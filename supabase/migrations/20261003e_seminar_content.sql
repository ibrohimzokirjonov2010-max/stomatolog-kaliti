-- Organizer-created seminars (DB), organizer applications, admin moderation (pending → published), delete/close with notifications.
-- Catalog seminars (src/data/seminars.ts) stay as seed; rows with source='catalog' only carry an organizer link.

alter table public.seminars
  add column if not exists source text not null default 'catalog' check (source in ('catalog', 'user')),
  add column if not exists status text not null default 'published' check (status in ('pending', 'published', 'rejected', 'closed', 'deleted')),
  add column if not exists reject_reason text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists speakers jsonb not null default '[]'::jsonb,
  add column if not exists event_date date,
  add column if not exists start_time text,
  add column if not exists end_time text,
  add column if not exists city text,
  add column if not exists venue text,
  add column if not exists price bigint not null default 0 check (price >= 0),
  add column if not exists seats_total int check (seats_total is null or seats_total between 1 and 5000),
  add column if not exists specialty text,
  add column if not exists image text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists program jsonb not null default '[]'::jsonb,
  add column if not exists learnings text[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();
create index if not exists seminars_status_idx on public.seminars (status, event_date) where source = 'user';

drop policy if exists seminars_public_select on public.seminars;
create policy seminars_public_select on public.seminars for select to anon, authenticated
  using (source = 'user' and status in ('published', 'closed'));
drop policy if exists seminars_owner_select on public.seminars;
create policy seminars_owner_select on public.seminars for select to authenticated using (organizer_id = auth.uid());
grant select on public.seminars to anon, authenticated;

create table if not exists public.organizer_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null unique references public.profiles(id) on delete cascade,
  org_name text not null,
  phone text not null,
  city text,
  bio text,
  telegram text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizer_applications enable row level security;
drop policy if exists org_apps_owner_select on public.organizer_applications;
create policy org_apps_owner_select on public.organizer_applications for select to authenticated using (applicant_id = auth.uid());
revoke all on public.organizer_applications from anon, authenticated;
grant select on public.organizer_applications to authenticated;

create or replace function private.sem_notify_admins(p_type text, p_title text, p_body text, p_link text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  for v_id in select id from public.profiles where is_admin and blocked_at is null loop
    perform private.notify(v_id, p_type, p_title, p_body, p_link, null);
  end loop;
end $$;

create or replace function private.sem_row_json(r public.seminars) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'organizerId', r.organizer_id, 'source', r.source, 'status', r.status, 'rejectReason', r.reject_reason,
    'title', r.title, 'description', r.description, 'speakers', r.speakers, 'date', r.event_date, 'time', r.start_time, 'timeEnd', r.end_time,
    'city', r.city, 'venue', r.venue, 'price', r.price, 'seats', r.seats_total, 'specialty', r.specialty, 'image', r.image,
    'tags', to_jsonb(r.tags), 'program', r.program, 'learnings', to_jsonb(r.learnings), 'createdAt', r.created_at, 'updatedAt', r.updated_at,
    'registered', (select count(*) from public.seminar_registrations g where g.seminar_id = r.id and g.status <> 'cancelled'))
$$;

create or replace function private.org_json(a public.organizer_applications) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'applicantId', a.applicant_id, 'applicantName', (select full_name from public.profiles where id = a.applicant_id),
    'orgName', a.org_name, 'phone', a.phone, 'city', a.city, 'bio', a.bio, 'telegram', a.telegram, 'status', a.status,
    'rejectReason', a.reject_reason, 'createdAt', a.created_at)
$$;

-- ───────────── organizer applications ─────────────
create or replace function public.sh_org_apply(p_secret text, p_user uuid, p_org text, p_phone text, p_city text, p_bio text, p_telegram text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.organizer_applications; v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if length(btrim(coalesce(p_org, ''))) < 2 or length(v_phone) < 9 then raise exception 'sem_invalid'; end if;
  select * into a from public.organizer_applications where applicant_id = p_user for update;
  if a.id is not null and a.status = 'approved' then return private.org_json(a); end if;
  if a.id is null then
    insert into public.organizer_applications (applicant_id, org_name, phone, city, bio, telegram)
    values (p_user, left(btrim(p_org), 120), v_phone, nullif(left(btrim(coalesce(p_city, '')), 80), ''), nullif(left(btrim(coalesce(p_bio, '')), 1000), ''), nullif(left(btrim(coalesce(p_telegram, '')), 80), ''))
    returning * into a;
  else
    update public.organizer_applications set org_name = left(btrim(p_org), 120), phone = v_phone, city = nullif(left(btrim(coalesce(p_city, '')), 80), ''),
      bio = nullif(left(btrim(coalesce(p_bio, '')), 1000), ''), telegram = nullif(left(btrim(coalesce(p_telegram, '')), 80), ''),
      status = 'pending', reject_reason = null, updated_at = now() where id = a.id returning * into a;
  end if;
  perform private.sem_notify_admins('organizer_application', 'Yangi tashkilotchi arizasi', a.org_name || ' · +998' || a.phone, '/admin/seminarlar');
  return private.org_json(a);
end $$;

create or replace function public.sh_org_me(p_secret text, p_user uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.organizer_applications; v_admin boolean;
begin
  perform private.assert_secret(p_secret);
  v_admin := private.sem_is_admin(p_user);
  select * into a from public.organizer_applications where applicant_id = p_user;
  return jsonb_build_object('admin', v_admin, 'application', case when a.id is null then null else private.org_json(a) end,
    'canCreate', v_admin or coalesce(a.status = 'approved', false));
end $$;

create or replace function public.sh_org_admin(p_secret text, p_admin uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  return jsonb_build_object(
    'applications', coalesce((select jsonb_agg(private.org_json(a) order by (a.status = 'pending') desc, a.created_at desc) from public.organizer_applications a), '[]'::jsonb),
    'seminars', coalesce((select jsonb_agg(private.sem_row_json(s) || jsonb_build_object('organizerName', (select full_name from public.profiles where id = s.organizer_id))
        order by (s.status = 'pending') desc, s.created_at desc) from public.seminars s where s.source = 'user' and s.status <> 'deleted'), '[]'::jsonb),
    'organizers', coalesce((select jsonb_agg(jsonb_build_object('seminarId', s.id, 'organizerId', s.organizer_id, 'organizerName', (select full_name from public.profiles where id = s.organizer_id)))
        from public.seminars s where s.organizer_id is not null), '[]'::jsonb));
end $$;

create or replace function public.sh_org_review(p_secret text, p_admin uuid, p_id uuid, p_approve boolean, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.organizer_applications;
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  select * into a from public.organizer_applications where id = p_id for update;
  if a.id is null then raise exception 'sem_notfound'; end if;
  update public.organizer_applications set status = case when p_approve then 'approved' else 'rejected' end,
    reject_reason = case when p_approve then null else nullif(left(btrim(coalesce(p_reason, '')), 300), '') end,
    reviewed_by = p_admin, reviewed_at = now(), updated_at = now() where id = a.id returning * into a;
  if p_approve then
    perform private.notify(a.applicant_id, 'organizer_approved', 'Tashkilotchi arizangiz tasdiqlandi', 'Endi seminar yaratishingiz mumkin.', '/seminarlar/yozuvlarim/tashkilotchi', null);
  else
    perform private.notify(a.applicant_id, 'organizer_rejected', 'Tashkilotchi arizangiz rad etildi', coalesce(a.reject_reason, 'Sabab ko‘rsatilmagan.'), '/seminarlar/yozuvlarim/tashkilotchi', null);
  end if;
  return private.org_json(a);
end $$;

-- ───────────── seminars ─────────────
create or replace function public.sh_sem_save(p_secret text, p_user uuid, p_id text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_admin boolean; v_ok boolean; r public.seminars; v_id text; v_status text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  v_admin := private.sem_is_admin(p_user);
  v_ok := v_admin or exists (select 1 from public.organizer_applications where applicant_id = p_user and status = 'approved');
  if coalesce(p_id, '') = '' then
    if not v_ok then raise exception 'sem_not_organizer'; end if;
    v_id := 'u-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    v_status := case when v_admin then 'published' else 'pending' end;
    insert into public.seminars (id, organizer_id, source, status, title, description, speakers, event_date, start_time, end_time, city, venue, price, seats_total, specialty, image, tags, program, learnings)
    values (v_id, p_user, 'user', v_status, left(btrim(p_data->>'title'), 160), nullif(left(btrim(coalesce(p_data->>'description', '')), 4000), ''),
      coalesce(p_data->'speakers', '[]'::jsonb), (p_data->>'date')::date, p_data->>'startTime', p_data->>'endTime', p_data->>'city', left(btrim(p_data->>'venue'), 200),
      greatest((p_data->>'price')::bigint, 0), (p_data->>'seats')::int, p_data->>'specialty', p_data->>'image',
      array(select jsonb_array_elements_text(coalesce(p_data->'tags', '[]'::jsonb))), coalesce(p_data->'program', '[]'::jsonb),
      array(select jsonb_array_elements_text(coalesce(p_data->'learnings', '[]'::jsonb))))
    returning * into r;
    if v_status = 'pending' then
      perform private.sem_notify_admins('seminar_pending', 'Yangi seminar tasdiq kutmoqda', left(r.title, 120), '/admin/seminarlar');
    end if;
  else
    select * into r from public.seminars where id = p_id and source = 'user' and status <> 'deleted' for update;
    if r.id is null or not (v_admin or r.organizer_id = p_user) then raise exception 'sem_notfound'; end if;
    if (p_data->>'seats')::int < (select count(*) from public.seminar_registrations where seminar_id = r.id and status <> 'cancelled') then
      raise exception 'sem_seats_low';
    end if;
    v_status := case when v_admin or r.status in ('published', 'closed') then r.status else 'pending' end;
    update public.seminars set status = v_status, reject_reason = case when v_status = 'pending' then null else reject_reason end,
      title = left(btrim(p_data->>'title'), 160), description = nullif(left(btrim(coalesce(p_data->>'description', '')), 4000), ''),
      speakers = coalesce(p_data->'speakers', '[]'::jsonb), event_date = (p_data->>'date')::date, start_time = p_data->>'startTime', end_time = p_data->>'endTime',
      city = p_data->>'city', venue = left(btrim(p_data->>'venue'), 200), price = greatest((p_data->>'price')::bigint, 0), seats_total = (p_data->>'seats')::int,
      specialty = p_data->>'specialty', image = p_data->>'image', tags = array(select jsonb_array_elements_text(coalesce(p_data->'tags', '[]'::jsonb))),
      program = coalesce(p_data->'program', '[]'::jsonb), learnings = array(select jsonb_array_elements_text(coalesce(p_data->'learnings', '[]'::jsonb))), updated_at = now()
    where id = r.id returning * into r;
    if r.status = 'pending' then
      perform private.sem_notify_admins('seminar_pending', 'Seminar qayta tasdiqqa yuborildi', left(r.title, 120), '/admin/seminarlar');
    end if;
  end if;
  return private.sem_row_json(r);
end $$;

-- close | reopen | delete (delete cancels active registrations and notifies every registrant)
create or replace function public.sh_sem_set_state(p_secret text, p_user uuid, p_id text, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminars; g record;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into r from public.seminars where id = p_id and source = 'user' and status <> 'deleted' for update;
  if r.id is null or not (private.sem_is_admin(p_user) or r.organizer_id = p_user) then raise exception 'sem_notfound'; end if;
  if p_action = 'close' then
    if r.status = 'published' then update public.seminars set status = 'closed', updated_at = now() where id = r.id returning * into r; end if;
  elsif p_action = 'reopen' then
    if r.status = 'closed' then update public.seminars set status = 'published', updated_at = now() where id = r.id returning * into r; end if;
  elsif p_action = 'delete' then
    for g in select * from public.seminar_registrations where seminar_id = r.id and status <> 'cancelled' for update loop
      update public.seminar_registrations set status = 'cancelled', cancelled_at = now() where id = g.id;
      perform private.notify(g.user_id, 'seminar_cancelled', 'Seminar bekor qilindi', left(r.title, 120) || ' · tashkilotchi seminarni o‘chirdi, chiptangiz bekor qilindi.', '/seminarlar/yozuvlarim', null);
    end loop;
    update public.seminars set status = 'deleted', updated_at = now() where id = r.id returning * into r;
  else
    raise exception 'sem_invalid';
  end if;
  return private.sem_row_json(r);
end $$;

create or replace function public.sh_sem_admin_review(p_secret text, p_admin uuid, p_id text, p_approve boolean, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminars;
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  select * into r from public.seminars where id = p_id and source = 'user' and status in ('pending', 'rejected', 'published', 'closed') for update;
  if r.id is null then raise exception 'sem_notfound'; end if;
  if p_approve then
    update public.seminars set status = 'published', reject_reason = null, updated_at = now() where id = r.id returning * into r;
    perform private.notify(r.organizer_id, 'seminar_published', 'Seminar tasdiqlandi', left(r.title, 120) || ' · endi hamma ko‘radi.', '/seminarlar/' || r.id, null);
  else
    update public.seminars set status = 'rejected', reject_reason = nullif(left(btrim(coalesce(p_reason, '')), 300), ''), updated_at = now() where id = r.id returning * into r;
    perform private.notify(r.organizer_id, 'seminar_rejected', 'Seminar rad etildi', left(r.title, 120) || ' · ' || coalesce(r.reject_reason, 'sabab ko‘rsatilmagan'), '/seminarlar/yozuvlarim/tashkilotchi', null);
  end if;
  return private.sem_row_json(r);
end $$;

create or replace function public.sh_sem_catalog(p_secret text) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.sem_row_json(s) order by s.event_date) from public.seminars s where s.source = 'user' and s.status in ('published', 'closed')), '[]'::jsonb);
end $$;

-- one seminar: public if published/closed; owner/admin also see pending/rejected
create or replace function public.sh_sem_get_one(p_secret text, p_id text, p_user uuid default null) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminars;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.seminars where id = p_id and source = 'user' and status <> 'deleted';
  if r.id is null then return null; end if;
  if r.status in ('published', 'closed') or (p_user is not null and (r.organizer_id = p_user or private.sem_is_admin(p_user))) then
    return private.sem_row_json(r);
  end if;
  return null;
end $$;

create or replace function public.sh_sem_mine(p_secret text, p_user uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.sem_row_json(s) order by s.created_at desc) from public.seminars s
    where s.source = 'user' and s.organizer_id = p_user and s.status <> 'deleted'), '[]'::jsonb);
end $$;

-- organizer cabinet registrants: now also returns title/status for DB seminars and lists seminars without registrations
create or replace function public.sh_sem_organizer(p_secret text, p_user uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_admin boolean;
begin
  perform private.assert_secret(p_secret);
  v_admin := private.sem_is_admin(p_user);
  return jsonb_build_object('admin', v_admin, 'items', coalesce((
    select jsonb_agg(jsonb_build_object('seminarId', s.sid, 'title', (select title from public.seminars where id = s.sid), 'regs', coalesce((
      select jsonb_agg(private.sem_json(r) order by r.created_at desc) from public.seminar_registrations r where r.seminar_id = s.sid), '[]'::jsonb)) order by s.sid)
    from (
      select id as sid from public.seminars where organizer_id = p_user and status <> 'deleted'
      union
      select distinct seminar_id from public.seminar_registrations where v_admin
    ) s), '[]'::jsonb));
end $$;

revoke execute on function private.sem_notify_admins, private.sem_row_json, private.org_json from public, anon, authenticated;
revoke execute on function public.sh_org_apply, public.sh_org_me, public.sh_org_admin, public.sh_org_review, public.sh_sem_save, public.sh_sem_set_state,
  public.sh_sem_admin_review, public.sh_sem_catalog, public.sh_sem_get_one, public.sh_sem_mine, public.sh_sem_organizer from public;
grant execute on function public.sh_org_apply, public.sh_org_me, public.sh_org_admin, public.sh_org_review, public.sh_sem_save, public.sh_sem_set_state,
  public.sh_sem_admin_review, public.sh_sem_catalog, public.sh_sem_get_one, public.sh_sem_mine, public.sh_sem_organizer to anon, authenticated, service_role;
