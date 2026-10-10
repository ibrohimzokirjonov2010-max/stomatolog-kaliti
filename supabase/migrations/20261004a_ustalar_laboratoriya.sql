-- 2-bosqich (A): Ustalar + Laboratoriya real DB.
-- Public: only moderated (published) profiles, WITHOUT phone/telegram. Phone opens only after the owner accepts.
-- All writes go through sh_* SECURITY DEFINER RPCs (p_secret). RLS on; owner-only select policies; no anon access.

create or replace function private.phone9(p text) returns text language sql immutable set search_path = '' as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 9)
$$;
create or replace function private.phone_fmt(p text) returns text language sql immutable set search_path = '' as $$
  select case when length(coalesce(p, '')) = 9 then '+998 ' || substr(p, 1, 2) || ' ' || substr(p, 3, 3) || ' ' || substr(p, 6, 2) || ' ' || substr(p, 8, 2) else p end
$$;

-- ───────────── tables ─────────────
create table if not exists public.masters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  kind text not null default 'usta' check (kind in ('usta', 'kompaniya')),
  name text not null check (char_length(name) between 2 and 80),
  title text not null check (char_length(title) between 2 and 80),
  services text[] not null check (cardinality(services) between 1 and 6 and services <@ array['rentgen','kreslo','ornatish','tamirlash','mebel','servis']),
  city text not null check (char_length(city) between 2 and 60),
  years int not null default 0 check (years between 0 and 60),
  description text check (description is null or char_length(description) <= 600),
  photo text check (photo is null or char_length(photo) <= 400),
  phone text not null check (char_length(phone) = 9),
  telegram text check (telegram is null or char_length(telegram) <= 80),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists masters_status_idx on public.masters (status, created_at desc);

create table if not exists public.master_requests (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.masters(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  service text not null check (service in ('rentgen','kreslo','ornatish','tamirlash','mebel')),
  clinic text not null check (char_length(clinic) between 2 and 120),
  district text check (district is null or char_length(district) <= 60),
  address text check (address is null or char_length(address) <= 200),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) = 9),
  note text check (note is null or char_length(note) <= 500),
  when_need text not null default 'bugun' check (when_need in ('bugun', 'ertaga', 'sana')),
  need_date date,
  status text not null default 'yuborildi' check (status in ('yuborildi', 'jarayonda', 'bajarildi', 'bekor', 'rad')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists master_requests_master_idx on public.master_requests (master_id, created_at desc);
create index if not exists master_requests_req_idx on public.master_requests (requester_id, created_at desc);
-- one open request per (requester, master, service)
create unique index if not exists master_requests_active_uq on public.master_requests (master_id, requester_id, service) where status in ('yuborildi', 'jarayonda');

create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  city text not null check (char_length(city) between 2 and 60),
  services text[] not null check (cardinality(services) between 1 and 6 and services <@ array['crown','veneer','implant','bridge','removable','cadcam']),
  materials text[] not null default '{}' check (materials <@ array['zirconia','emax','metal-ceramic','premium']),
  description text check (description is null or char_length(description) <= 600),
  days int check (days is null or days between 1 and 60),
  price_from bigint check (price_from is null or price_from between 0 and 1000000000),
  photo text check (photo is null or char_length(photo) <= 400),
  phone text not null check (char_length(phone) = 9),
  telegram text check (telegram is null or char_length(telegram) <= 80),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists labs_status_idx on public.labs (status, created_at desc);

create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  service text not null check (service in ('crown','veneer','implant','bridge','removable','cadcam')),
  material text not null check (material in ('zirconia','emax','metal-ceramic','premium')),
  patient_code text not null check (char_length(patient_code) between 1 and 16),
  due_days int not null check (due_days between 1 and 60),
  phone text not null check (char_length(phone) = 9),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'yangi' check (status in ('yangi', 'qabul_qilindi', 'ishlanmoqda', 'tayyor', 'yetkazildi', 'bekor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lab_orders_lab_idx on public.lab_orders (lab_id, created_at desc);
create index if not exists lab_orders_doctor_idx on public.lab_orders (doctor_id, created_at desc);
create unique index if not exists lab_orders_active_uq on public.lab_orders (lab_id, doctor_id, patient_code, service) where status in ('yangi', 'qabul_qilindi', 'ishlanmoqda', 'tayyor');

-- ───────────── RLS ─────────────
alter table public.masters enable row level security;
alter table public.master_requests enable row level security;
alter table public.labs enable row level security;
alter table public.lab_orders enable row level security;
drop policy if exists masters_owner_select on public.masters;
create policy masters_owner_select on public.masters for select to authenticated using (owner_id = auth.uid());
drop policy if exists master_requests_party_select on public.master_requests;
create policy master_requests_party_select on public.master_requests for select to authenticated
  using (requester_id = auth.uid() or exists (select 1 from public.masters m where m.id = master_id and m.owner_id = auth.uid()));
drop policy if exists labs_owner_select on public.labs;
create policy labs_owner_select on public.labs for select to authenticated using (owner_id = auth.uid());
drop policy if exists lab_orders_party_select on public.lab_orders;
create policy lab_orders_party_select on public.lab_orders for select to authenticated
  using (doctor_id = auth.uid() or exists (select 1 from public.labs l where l.id = lab_id and l.owner_id = auth.uid()));
revoke all on public.masters, public.master_requests, public.labs, public.lab_orders from anon, authenticated;
grant select on public.masters, public.master_requests, public.labs, public.lab_orders to authenticated;

-- ───────────── JSON builders ─────────────
create or replace function private.master_json(m public.masters, p_full boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', m.id, 'name', m.name, 'kind', m.kind, 'title', m.title, 'services', to_jsonb(m.services), 'city', m.city,
    'years', m.years, 'description', m.description, 'photo', m.photo, 'status', m.status, 'createdAt', m.created_at,
    'jobs', (select count(*) from public.master_requests r where r.master_id = m.id and r.status = 'bajarildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(m.phone), 'telegram', m.telegram, 'rejectReason', m.reject_reason) else '{}'::jsonb end
$$;

create or replace function private.lab_json(l public.labs, p_full boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'name', l.name, 'city', l.city, 'services', to_jsonb(l.services), 'materials', to_jsonb(l.materials),
    'description', l.description, 'days', l.days, 'priceFrom', l.price_from, 'photo', l.photo, 'status', l.status, 'createdAt', l.created_at,
    'done', (select count(*) from public.lab_orders o where o.lab_id = l.id and o.status = 'yetkazildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram, 'rejectReason', l.reject_reason) else '{}'::jsonb end
$$;

-- ───────────── Ustalar ─────────────
create or replace function public.sh_master_catalog(p_secret text, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.master_json(m, false) || jsonb_build_object('mine', m.owner_id is not distinct from p_viewer) order by m.created_at desc)
    from public.masters m where m.status = 'published'), '[]'::jsonb);
end $$;

create or replace function public.sh_master_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters;
begin
  perform private.assert_secret(p_secret);
  select * into m from public.masters where owner_id = p_user;
  if m.id is null then return null; end if;
  return private.master_json(m, true);
end $$;

create or replace function public.sh_master_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters; v_phone text := private.phone9(p_data->>'phone'); v_services text[];
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(btrim(coalesce(p_data->>'title', ''))) < 2
     or cardinality(v_services) < 1 or char_length(v_phone) <> 9 or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 then
    raise exception 'val_invalid';
  end if;
  select * into m from public.masters where owner_id = p_user for update;
  if m.id is null then
    insert into public.masters (owner_id, kind, name, title, services, city, years, description, photo, phone, telegram, status)
    values (p_user, case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'title'), 80),
      v_services, left(btrim(p_data->>'city'), 60), coalesce((p_data->>'years')::int, 0), nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''),
      nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), 'pending')
    returning * into m;
    perform private.sem_notify_admins('moderation_new', 'Yangi usta profili', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'master_pending', 'Usta profilingiz moderatsiyada', 'Admin tasdiqlagach hamma ko‘radi.', '/ustalar/mening', null);
  else
    update public.masters set kind = case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, name = left(btrim(p_data->>'name'), 80),
      title = left(btrim(p_data->>'title'), 80), services = v_services, city = left(btrim(p_data->>'city'), 60), years = coalesce((p_data->>'years')::int, 0),
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''), phone = v_phone,
      telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      status = case when status in ('rejected') then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end,
      updated_at = now() where id = m.id returning * into m;
    if m.status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Usta profili yangilandi', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.master_json(m, true);
end $$;

create or replace function public.sh_master_delete(p_secret text, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  delete from public.masters where owner_id = p_user;
end $$;

create or replace function public.sh_master_req_create(p_secret text, p_user uuid, p_master uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters; r public.master_requests; v_phone text := private.phone9(p_data->>'phone'); v_when text := coalesce(p_data->>'when', 'bugun');
  v_date date;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into m from public.masters where id = p_master and status = 'published';
  if m.id is null then raise exception 'req_notfound'; end if;
  if m.owner_id = p_user then raise exception 'req_self'; end if;
  if char_length(btrim(coalesce(p_data->>'clinic', ''))) < 2 or char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(v_phone) <> 9
     or p_data->>'service' not in ('rentgen','kreslo','ornatish','tamirlash','mebel') or v_when not in ('bugun','ertaga','sana') then
    raise exception 'val_invalid';
  end if;
  if v_when = 'sana' then
    begin v_date := (p_data->>'date')::date; exception when others then raise exception 'val_invalid'; end;
    if v_date is null or v_date < current_date then raise exception 'val_invalid'; end if;
  end if;
  if (select count(*) from public.master_requests where requester_id = p_user and created_at > now() - interval '1 hour') >= 8 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.master_requests where master_id = m.id and requester_id = p_user and service = p_data->>'service' and status in ('yuborildi', 'jarayonda')) then
    raise exception 'req_duplicate';
  end if;
  insert into public.master_requests (master_id, requester_id, service, clinic, district, address, name, phone, note, when_need, need_date)
  values (m.id, p_user, p_data->>'service', left(btrim(p_data->>'clinic'), 120), nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''),
    nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''), left(btrim(p_data->>'name'), 80), v_phone,
    nullif(left(btrim(coalesce(p_data->>'note', '')), 500), ''), v_when, v_date) returning * into r;
  perform private.notify(m.owner_id, 'master_request', 'Yangi xizmat so‘rovi', left(r.clinic, 80) || ' · ' || r.name, '/ustalar/sorovlarim?tab=kelgan', null);
  perform private.notify(p_user, 'master_request_sent', 'So‘rov yuborildi', left(m.name, 80) || ' ga so‘rovingiz yuborildi. Javobni kuting.', '/ustalar/sorovlarim', null);
  return jsonb_build_object('id', r.id, 'status', r.status);
end $$;

create or replace function private.master_req_json(r public.master_requests, m public.masters, p_for_owner boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'masterId', r.master_id, 'masterName', m.name, 'service', r.service, 'clinic', r.clinic, 'district', r.district,
    'address', r.address, 'name', r.name, 'phone', private.phone_fmt(r.phone), 'note', r.note, 'when', r.when_need, 'date', r.need_date,
    'status', r.status, 'createdAt', r.created_at, 'updatedAt', r.updated_at)
  || case when not p_for_owner and r.status in ('jarayonda', 'bajarildi') then jsonb_build_object('masterPhone', private.phone_fmt(m.phone), 'masterTelegram', m.telegram) else '{}'::jsonb end
$$;

create or replace function public.sh_master_req_list(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'outgoing', coalesce((select jsonb_agg(private.master_req_json(r, m, false) order by r.created_at desc)
      from public.master_requests r join public.masters m on m.id = r.master_id where r.requester_id = p_user), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(private.master_req_json(r, m, true) order by r.created_at desc)
      from public.master_requests r join public.masters m on m.id = r.master_id where m.owner_id = p_user), '[]'::jsonb));
end $$;

create or replace function public.sh_master_req_set(p_secret text, p_user uuid, p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.master_requests; m public.masters; v_owner boolean;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into r from public.master_requests where id = p_id for update;
  if r.id is null then raise exception 'req_notfound'; end if;
  select * into m from public.masters where id = r.master_id;
  v_owner := m.owner_id = p_user;
  if not v_owner and r.requester_id <> p_user then raise exception 'req_notfound'; end if;
  if v_owner then
    if not ((r.status = 'yuborildi' and p_status in ('jarayonda', 'rad')) or (r.status = 'jarayonda' and p_status in ('bajarildi', 'bekor'))) then raise exception 'req_state'; end if;
  else
    if not (r.status in ('yuborildi', 'jarayonda') and p_status = 'bekor') then raise exception 'req_state'; end if;
  end if;
  update public.master_requests set status = p_status, updated_at = now() where id = r.id returning * into r;
  if v_owner then
    perform private.notify(r.requester_id, 'master_request_' || r.status,
      case r.status when 'jarayonda' then 'So‘rovingiz qabul qilindi' when 'rad' then 'So‘rovingiz rad etildi' when 'bajarildi' then 'Ish bajarildi' else 'So‘rov bekor qilindi' end,
      case r.status when 'jarayonda' then left(m.name, 80) || ' qabul qildi. Telefon raqami ochildi.' else left(m.name, 80) || ' · ' || r.clinic end,
      '/ustalar/sorovlarim', null);
    perform private.notify(p_user, 'master_request_done', 'So‘rov holati yangilandi', left(r.clinic, 80) || ' · ' || r.status, '/ustalar/sorovlarim?tab=kelgan', null);
  else
    perform private.notify(m.owner_id, 'master_request_cancelled', 'So‘rov bekor qilindi', left(r.clinic, 80) || ' · ' || r.name, '/ustalar/sorovlarim?tab=kelgan', null);
  end if;
  return private.master_req_json(r, m, v_owner);
end $$;

-- ───────────── Laboratoriya ─────────────
create or replace function public.sh_lab_catalog(p_secret text, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.lab_json(l, false) || jsonb_build_object('mine', l.owner_id is not distinct from p_viewer) order by l.created_at desc)
    from public.labs l where l.status = 'published'), '[]'::jsonb);
end $$;

create or replace function public.sh_lab_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs;
begin
  perform private.assert_secret(p_secret);
  select * into l from public.labs where owner_id = p_user;
  if l.id is null then return null; end if;
  return private.lab_json(l, true);
end $$;

create or replace function public.sh_lab_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs; v_phone text := private.phone9(p_data->>'phone'); v_services text[]; v_materials text[];
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x;
  select coalesce(array_agg(x), '{}') into v_materials from jsonb_array_elements_text(coalesce(p_data->'materials', '[]'::jsonb)) x;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or cardinality(v_services) < 1 or char_length(v_phone) <> 9
     or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 then raise exception 'val_invalid'; end if;
  select * into l from public.labs where owner_id = p_user for update;
  if l.id is null then
    insert into public.labs (owner_id, name, city, services, materials, description, days, price_from, photo, phone, telegram, status)
    values (p_user, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'city'), 60), v_services, v_materials,
      nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), nullif(p_data->>'days', '')::int, nullif(p_data->>'priceFrom', '')::bigint,
      nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), 'pending')
    returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Yangi laboratoriya profili', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'lab_pending', 'Laboratoriya profilingiz moderatsiyada', 'Admin tasdiqlagach katalogda ko‘rinadi.', '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  else
    update public.labs set name = left(btrim(p_data->>'name'), 80), city = left(btrim(p_data->>'city'), 60), services = v_services, materials = v_materials,
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), days = nullif(p_data->>'days', '')::int, price_from = nullif(p_data->>'priceFrom', '')::bigint,
      photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''), phone = v_phone, telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end,
      updated_at = now() where id = l.id returning * into l;
    if l.status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Laboratoriya profili yangilandi', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.lab_json(l, true);
end $$;

create or replace function public.sh_lab_delete(p_secret text, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  delete from public.labs where owner_id = p_user;
end $$;

create or replace function public.sh_lab_order_create(p_secret text, p_user uuid, p_lab uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs; o public.lab_orders; v_phone text := private.phone9(p_data->>'phone'); v_code text := btrim(coalesce(p_data->>'patientCode', ''));
  v_days int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into l from public.labs where id = p_lab and status = 'published';
  if l.id is null then raise exception 'req_notfound'; end if;
  if l.owner_id = p_user then raise exception 'req_self'; end if;
  begin v_days := (p_data->>'dueDays')::int; exception when others then raise exception 'val_invalid'; end;
  if v_code = '' or char_length(v_code) > 16 or char_length(v_phone) <> 9 or v_days is null or v_days not between 1 and 60
     or p_data->>'service' not in ('crown','veneer','implant','bridge','removable','cadcam')
     or p_data->>'material' not in ('zirconia','emax','metal-ceramic','premium') then raise exception 'val_invalid'; end if;
  if (select count(*) from public.lab_orders where doctor_id = p_user and created_at > now() - interval '1 hour') >= 12 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.lab_orders where lab_id = l.id and doctor_id = p_user and patient_code = v_code and service = p_data->>'service'
             and status in ('yangi', 'qabul_qilindi', 'ishlanmoqda', 'tayyor')) then raise exception 'req_duplicate'; end if;
  insert into public.lab_orders (lab_id, doctor_id, service, material, patient_code, due_days, phone, note)
  values (l.id, p_user, p_data->>'service', p_data->>'material', v_code, v_days, v_phone, nullif(left(btrim(coalesce(p_data->>'note', '')), 500), ''))
  returning * into o;
  perform private.notify(l.owner_id, 'lab_order_new', 'Yangi lab buyurtma', 'Bemor kodi ' || o.patient_code || ' · ' || o.service || ' · ' || o.due_days || ' kun', '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  perform private.notify(p_user, 'lab_order_sent', 'Buyurtma yuborildi', left(l.name, 80) || ' ga buyurtmangiz yuborildi. Lab qabul qilishini kuting.', '/laboratoriya/buyurtmalarim', null);
  return jsonb_build_object('id', o.id, 'status', o.status);
end $$;

create or replace function private.lab_order_json(o public.lab_orders, l public.labs, p_for_lab boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', o.id, 'labId', o.lab_id, 'labName', l.name, 'service', o.service, 'material', o.material, 'patientCode', o.patient_code,
    'dueDays', o.due_days, 'phone', private.phone_fmt(o.phone), 'note', o.note, 'status', o.status, 'createdAt', o.created_at, 'updatedAt', o.updated_at,
    'doctorName', case when p_for_lab then (select full_name from public.profiles where id = o.doctor_id) else null end)
  || case when not p_for_lab and o.status not in ('yangi', 'bekor') then jsonb_build_object('labPhone', private.phone_fmt(l.phone), 'labTelegram', l.telegram) else '{}'::jsonb end
$$;

create or replace function public.sh_lab_order_list(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'outgoing', coalesce((select jsonb_agg(private.lab_order_json(o, l, false) order by o.created_at desc)
      from public.lab_orders o join public.labs l on l.id = o.lab_id where o.doctor_id = p_user), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(private.lab_order_json(o, l, true) order by o.created_at desc)
      from public.lab_orders o join public.labs l on l.id = o.lab_id where l.owner_id = p_user), '[]'::jsonb));
end $$;

create or replace function public.sh_lab_order_set(p_secret text, p_user uuid, p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o public.lab_orders; l public.labs; v_lab boolean;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into o from public.lab_orders where id = p_id for update;
  if o.id is null then raise exception 'req_notfound'; end if;
  select * into l from public.labs where id = o.lab_id;
  v_lab := l.owner_id = p_user;
  if not v_lab and o.doctor_id <> p_user then raise exception 'req_notfound'; end if;
  if v_lab then
    if not ((o.status = 'yangi' and p_status in ('qabul_qilindi', 'bekor')) or (o.status = 'qabul_qilindi' and p_status in ('ishlanmoqda', 'bekor'))
         or (o.status = 'ishlanmoqda' and p_status in ('tayyor', 'bekor')) or (o.status = 'tayyor' and p_status = 'yetkazildi')) then raise exception 'req_state'; end if;
  else
    if not (o.status in ('yangi', 'qabul_qilindi') and p_status = 'bekor') then raise exception 'req_state'; end if;
  end if;
  update public.lab_orders set status = p_status, updated_at = now() where id = o.id returning * into o;
  if v_lab then
    perform private.notify(o.doctor_id, 'lab_order_' || o.status,
      case o.status when 'qabul_qilindi' then 'Buyurtma qabul qilindi' when 'ishlanmoqda' then 'Buyurtma ishlanmoqda' when 'tayyor' then 'Buyurtma tayyor'
        when 'yetkazildi' then 'Buyurtma yetkazildi' else 'Buyurtma bekor qilindi' end,
      left(l.name, 80) || ' · bemor kodi ' || o.patient_code, '/laboratoriya/buyurtmalarim', null);
    perform private.notify(p_user, 'lab_order_updated', 'Buyurtma holati yangilandi', 'Bemor kodi ' || o.patient_code || ' · ' || o.status, '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  else
    perform private.notify(l.owner_id, 'lab_order_cancelled', 'Buyurtma bekor qilindi', 'Bemor kodi ' || o.patient_code, '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  end if;
  return private.lab_order_json(o, l, v_lab);
end $$;

-- ───────────── admin moderation (generic; extended in the next migration) ─────────────
create or replace function public.sh_mod_list(p_secret text, p_admin uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  return coalesce((
    select jsonb_agg(x order by (x->>'status' = 'pending') desc, x->>'createdAt' desc) from (
      select jsonb_build_object('kind', 'master', 'id', m.id, 'title', m.name, 'sub', m.title || ' · ' || m.city, 'city', m.city, 'status', m.status,
        'rejectReason', m.reject_reason, 'ownerName', (select full_name from public.profiles where id = m.owner_id), 'phone', private.phone_fmt(m.phone),
        'detail', coalesce(m.description, ''), 'createdAt', m.created_at) x from public.masters m
      union all
      select jsonb_build_object('kind', 'lab', 'id', l.id, 'title', l.name, 'sub', 'Laboratoriya · ' || l.city, 'city', l.city, 'status', l.status,
        'rejectReason', l.reject_reason, 'ownerName', (select full_name from public.profiles where id = l.owner_id), 'phone', private.phone_fmt(l.phone),
        'detail', coalesce(l.description, ''), 'createdAt', l.created_at) from public.labs l
    ) t), '[]'::jsonb);
end $$;

create or replace function public.sh_mod_review(p_secret text, p_admin uuid, p_kind text, p_id uuid, p_action text, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_name text; v_status text; v_link text; v_label text;
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  if p_action not in ('approve', 'reject', 'hide') then raise exception 'val_invalid'; end if;
  v_status := case p_action when 'approve' then 'published' when 'reject' then 'rejected' else 'hidden' end;
  if p_kind = 'master' then
    update public.masters set status = v_status, reject_reason = case when p_action = 'reject' then nullif(left(btrim(coalesce(p_reason, '')), 300), '') else null end, updated_at = now()
      where id = p_id returning owner_id, name into v_owner, v_name;
    v_link := '/ustalar/mening'; v_label := 'Usta profilingiz';
  elsif p_kind = 'lab' then
    update public.labs set status = v_status, reject_reason = case when p_action = 'reject' then nullif(left(btrim(coalesce(p_reason, '')), 300), '') else null end, updated_at = now()
      where id = p_id returning owner_id, name into v_owner, v_name;
    v_link := '/laboratoriya/buyurtmalarim?tab=kelgan'; v_label := 'Laboratoriya profilingiz';
  else
    raise exception 'val_invalid';
  end if;
  if v_owner is null then raise exception 'sem_notfound'; end if;
  perform private.notify(v_owner, 'moderation_' || v_status,
    v_label || case p_action when 'approve' then ' tasdiqlandi' when 'reject' then ' rad etildi' else ' yashirildi' end,
    left(v_name, 80) || case when p_action = 'approve' then ' · endi hamma ko‘radi.' else ' · ' || coalesce(nullif(btrim(p_reason), ''), 'sabab ko‘rsatilmagan') end, v_link, null);
end $$;

-- ───────────── grants ─────────────
revoke execute on function private.phone9, private.phone_fmt, private.master_json, private.lab_json, private.master_req_json, private.lab_order_json from public, anon, authenticated;
revoke execute on function public.sh_master_catalog, public.sh_master_mine, public.sh_master_save, public.sh_master_delete, public.sh_master_req_create, public.sh_master_req_list,
  public.sh_master_req_set, public.sh_lab_catalog, public.sh_lab_mine, public.sh_lab_save, public.sh_lab_delete, public.sh_lab_order_create, public.sh_lab_order_list,
  public.sh_lab_order_set, public.sh_mod_list, public.sh_mod_review from public;
grant execute on function public.sh_master_catalog, public.sh_master_mine, public.sh_master_save, public.sh_master_delete, public.sh_master_req_create, public.sh_master_req_list,
  public.sh_master_req_set, public.sh_lab_catalog, public.sh_lab_mine, public.sh_lab_save, public.sh_lab_delete, public.sh_lab_order_create, public.sh_lab_order_list,
  public.sh_lab_order_set, public.sh_mod_list, public.sh_mod_review to anon, authenticated, service_role;
