-- One lead per registered user (phone sign-up or Google).
-- Safe to run twice. If an earlier draft of this file created the homepage form
-- table, this reshapes it: anonymous form rows are removed, and the row is
-- keyed by user_id.
-- RLS stays on with no policies. Only sh_lead_upsert / sh_admin_leads (secret) touch it.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null default '',
  phone text,
  email text,
  role text,
  method text,
  utm jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads add column if not exists email text;
alter table public.leads add column if not exists method text;
alter table public.leads add column if not exists utm jsonb;
alter table public.leads add column if not exists updated_at timestamptz;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'leads' and column_name = 'source'
  ) then
    execute 'delete from public.leads where source = ''home''';
  end if;
end $$;

alter table public.leads drop column if exists source;

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.leads'::regclass and contype = 'c'
  loop
    execute format('alter table public.leads drop constraint %I', c.conname);
  end loop;
end $$;

delete from public.leads a using public.leads b
where a.user_id is not null
  and a.user_id = b.user_id
  and a.ctid <> b.ctid
  and (a.created_at < b.created_at or (a.created_at = b.created_at and a.ctid < b.ctid));
delete from public.leads where user_id is null;

alter table public.leads alter column phone drop not null;
alter table public.leads alter column role drop not null;
alter table public.leads alter column name set default '';
update public.leads set name = '' where name is null;
update public.leads set method = 'phone' where method is null or method not in ('phone', 'google');
update public.leads set utm = '{}'::jsonb where utm is null;
update public.leads set updated_at = coalesce(created_at, now()) where updated_at is null;

alter table public.leads alter column name set not null;
alter table public.leads alter column method set not null;
alter table public.leads alter column utm set not null;
alter table public.leads alter column utm set default '{}'::jsonb;
alter table public.leads alter column updated_at set not null;
alter table public.leads alter column updated_at set default now();
alter table public.leads alter column user_id set not null;

alter table public.leads drop constraint if exists leads_user_id_fkey;
alter table public.leads
  add constraint leads_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
alter table public.leads drop constraint if exists leads_user_unique;
alter table public.leads add constraint leads_user_unique unique (user_id);
alter table public.leads drop constraint if exists leads_method_check;
alter table public.leads add constraint leads_method_check check (method in ('phone', 'google'));

create index if not exists leads_created_idx on public.leads (created_at desc);

alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;

drop function if exists public.sh_lead_create(text, uuid, jsonb);

create or replace function public.sh_lead_upsert(p_secret text, p_user uuid, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(btrim(coalesce(p_data->>'name', '')), 120);
  v_phone text := nullif(private.phone9(p_data->>'phone'), '');
  v_email text := nullif(left(btrim(coalesce(p_data->>'email', '')), 120), '');
  v_role text := nullif(left(btrim(coalesce(p_data->>'role', '')), 80), '');
  v_method text := case when p_data->>'method' in ('phone', 'google') then p_data->>'method' else 'phone' end;
  v_raw jsonb := case when jsonb_typeof(p_data->'utm') = 'object' then p_data->'utm' else '{}'::jsonb end;
  v_utm jsonb;
  v_id uuid;
  v_created boolean := false;
begin
  perform private.assert_secret(p_secret);
  if p_user is null or not exists (select 1 from public.profiles where id = p_user) then
    return jsonb_build_object('error', 'user');
  end if;
  if v_phone is not null and char_length(v_phone) <> 9 then v_phone := null; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then v_email := null; end if;
  if v_role is not null and v_role not in ('Stomatolog', 'Klinika egasi', 'Talaba', 'Tish texnigi', 'Sotuvchi') then
    v_role := null;
  end if;
  v_utm := jsonb_strip_nulls(jsonb_build_object(
    'utm_source', nullif(left(btrim(coalesce(v_raw->>'utm_source', '')), 120), ''),
    'utm_medium', nullif(left(btrim(coalesce(v_raw->>'utm_medium', '')), 120), ''),
    'utm_campaign', nullif(left(btrim(coalesce(v_raw->>'utm_campaign', '')), 120), ''),
    'utm_term', nullif(left(btrim(coalesce(v_raw->>'utm_term', '')), 120), ''),
    'utm_content', nullif(left(btrim(coalesce(v_raw->>'utm_content', '')), 120), ''),
    'referrer', nullif(left(btrim(coalesce(v_raw->>'referrer', '')), 300), ''),
    'landing_path', nullif(left(btrim(coalesce(v_raw->>'landing_path', '')), 200), '')
  ));
  v_created := not exists (select 1 from public.leads where user_id = p_user);
  insert into public.leads (user_id, name, phone, email, role, method, utm)
  values (p_user, v_name, v_phone, v_email, v_role, v_method, coalesce(v_utm, '{}'::jsonb))
  on conflict (user_id) do update set
    name = case when excluded.name <> '' then excluded.name else public.leads.name end,
    phone = coalesce(excluded.phone, public.leads.phone),
    email = coalesce(excluded.email, public.leads.email),
    role = coalesce(excluded.role, public.leads.role),
    utm = public.leads.utm || coalesce((
      select jsonb_object_agg(e.key, e.value)
      from jsonb_each(excluded.utm) as e(key, value)
      where coalesce(public.leads.utm ->> e.key, '') = ''
        and coalesce(e.value #>> '{}', '') <> ''
    ), '{}'::jsonb),
    updated_at = now()
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'created', v_created);
end $$;

create or replace function public.sh_admin_leads(p_secret text, p_admin uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin', 'moderator', 'finance']);
  return jsonb_build_object(
    'rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id,
        'userId', l.user_id,
        'name', l.name,
        'phone', case when l.phone is null then null else private.phone_fmt(l.phone) end,
        'email', l.email,
        'role', l.role,
        'method', l.method,
        'utm', l.utm,
        'createdAt', l.created_at,
        'updatedAt', l.updated_at
      ) order by l.created_at desc)
      from (select * from public.leads order by created_at desc limit 300) l
    ), '[]'::jsonb)
  );
end $$;

revoke all on function public.sh_lead_upsert(text, uuid, jsonb) from public;
revoke all on function public.sh_admin_leads(text, uuid) from public;
grant execute on function public.sh_lead_upsert(text, uuid, jsonb) to anon, authenticated, service_role;
grant execute on function public.sh_admin_leads(text, uuid) to anon, authenticated, service_role;
