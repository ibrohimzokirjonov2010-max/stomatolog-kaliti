-- Homepage lead form: name, +998 phone (9 national digits), role.
-- Apply this file in the Supabase SQL editor. RLS is on and there are no policies:
-- only sh_lead_create (STOMAHUB_DB_SECRET) can insert.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) = 9 and phone ~ '^[0-9]{9}$'),
  role text not null check (role in ('stomatolog', 'klinika_egasi', 'talaba', 'tish_texnigi', 'sotuvchi')),
  source text not null default 'home' check (source in ('home')),
  created_at timestamptz not null default now()
);

create index if not exists leads_phone_created_idx on public.leads (phone, created_at desc);
create index if not exists leads_created_idx on public.leads (created_at desc);

alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;

create or replace function public.sh_lead_create(p_secret text, p_user uuid, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := left(btrim(coalesce(p_data->>'name', '')), 80);
  v_phone text := nullif(private.phone9(p_data->>'phone'), '');
  v_role text := btrim(coalesce(p_data->>'role', ''));
  v_source text := coalesce(nullif(btrim(coalesce(p_data->>'source', '')), ''), 'home');
  r public.leads;
begin
  perform private.assert_secret(p_secret);
  if char_length(v_name) < 2
     or v_phone is null
     or char_length(v_phone) <> 9
     or v_role not in ('stomatolog', 'klinika_egasi', 'talaba', 'tish_texnigi', 'sotuvchi')
     or v_source <> 'home' then
    return jsonb_build_object('error', 'fields');
  end if;
  if (select count(*) from public.leads where created_at > now() - interval '1 hour' and phone = v_phone) >= 3 then
    return jsonb_build_object('error', 'limit');
  end if;
  select * into r from public.leads
    where phone = v_phone and created_at > now() - interval '24 hours'
    order by created_at desc
    limit 1;
  if r.id is not null then
    return jsonb_build_object('ok', true, 'id', r.id, 'duplicate', true);
  end if;
  insert into public.leads (user_id, name, phone, role, source)
  values (p_user, v_name, v_phone, v_role, v_source)
  returning * into r;
  return jsonb_build_object('ok', true, 'id', r.id, 'duplicate', false);
end $$;

revoke all on function public.sh_lead_create(text, uuid, jsonb) from public;
grant execute on function public.sh_lead_create(text, uuid, jsonb) to anon, authenticated, service_role;
