-- Add-form pages (e'lon, usta, laboratoriya, vakansiya).
-- Apply this file manually. It is the only migration for these forms.
-- Draft rows stay private. Publish from the new forms sets status = published
-- so the item shows in the public catalog immediately.
-- The older save path (no "mode" key) still sends masters/labs/jobs to pending moderation.

-- ───────────── helpers ─────────────
create or replace function private.money_or_null(p text) returns bigint
language plpgsql immutable set search_path = '' as $$
begin
  if p is null or btrim(p) = '' then return null; end if;
  return btrim(p)::bigint;
exception when others then
  return null;
end $$;

create or replace function private.int_or_null(p text) returns int
language plpgsql immutable set search_path = '' as $$
begin
  if p is null or btrim(p) = '' then return null; end if;
  return btrim(p)::int;
exception when others then
  return null;
end $$;

revoke all on function private.money_or_null(text), private.int_or_null(text) from public, anon, authenticated;

-- ───────────── e'lonlar ─────────────
create table if not exists public.classifieds (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '' check (char_length(title) <= 120),
  category text not null default '' check (char_length(category) <= 40),
  condition text not null default 'yangi' check (condition in ('yangi', 'ishlatilgan')),
  price bigint check (price is null or price between 0 and 100000000000),
  negotiable boolean not null default false,
  description text not null default '' check (char_length(description) <= 4000),
  city text not null default '' check (char_length(city) <= 60),
  district text not null default '' check (char_length(district) <= 60),
  phone text check (phone is null or char_length(phone) = 9),
  telegram text check (telegram is null or char_length(telegram) <= 80),
  photos text[] not null default '{}' check (cardinality(photos) <= 8),
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists classifieds_status_idx on public.classifieds (status, created_at desc);
create index if not exists classifieds_owner_idx on public.classifieds (owner_id, updated_at desc);

alter table public.classifieds enable row level security;
drop policy if exists classifieds_owner_select on public.classifieds;
create policy classifieds_owner_select on public.classifieds for select to authenticated using (owner_id = auth.uid());
revoke all on public.classifieds from anon, authenticated;
grant select on public.classifieds to authenticated;

create or replace function private.classified_json(c public.classifieds, p_viewer uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'title', c.title, 'category', c.category, 'condition', c.condition,
    'price', c.price, 'negotiable', c.negotiable, 'description', c.description,
    'city', c.city, 'district', c.district, 'photos', to_jsonb(coalesce(c.photos, '{}')),
    'status', c.status, 'createdAt', c.created_at, 'updatedAt', c.updated_at,
    'mine', c.owner_id is not distinct from p_viewer,
    'phone', case when c.status = 'published' or c.owner_id is not distinct from p_viewer then private.phone_fmt(c.phone) else null end,
    'telegram', case when c.status = 'published' or c.owner_id is not distinct from p_viewer then c.telegram else null end
  )
$$;
revoke all on function private.classified_json(public.classifieds, uuid) from public, anon, authenticated;

create or replace function public.sh_classified_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  c public.classifieds;
  v_mode text := coalesce(p_data->>'mode', 'draft');
  v_phone text := nullif(private.phone9(p_data->>'phone'), '');
  v_photos text[];
  v_price bigint := private.money_or_null(p_data->>'price');
  v_title text := left(btrim(coalesce(p_data->>'title', '')), 120);
  v_cat text := left(btrim(coalesce(p_data->>'category', '')), 40);
  v_city text := left(btrim(coalesce(p_data->>'city', '')), 60);
  v_cond text := case when p_data->>'condition' = 'ishlatilgan' then 'ishlatilgan' else 'yangi' end;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if v_mode not in ('draft', 'publish') then raise exception 'val_invalid'; end if;
  select coalesce(array_agg(left(x, 400)), '{}') into v_photos
    from (select x from jsonb_array_elements_text(coalesce(p_data->'photos', '[]'::jsonb)) x where btrim(x) <> '' limit 8) q;
  if char_length(v_phone) not in (0, 9) then v_phone := null; end if;
  if v_mode = 'publish' and (
    char_length(v_title) < 3 or char_length(v_cat) < 2 or char_length(v_city) < 2 or char_length(coalesce(v_phone, '')) <> 9
  ) then raise exception 'val_invalid'; end if;
  if char_length(v_title) < 1 then raise exception 'val_invalid'; end if;
  if p_id is null then
    if (select count(*) from public.classifieds where owner_id = p_user and status in ('draft', 'published')) >= 40 then
      raise exception 'lim_reached';
    end if;
    insert into public.classifieds (owner_id, title, category, condition, price, negotiable, description, city, district, phone, telegram, photos, status)
    values (p_user, v_title, v_cat, v_cond, v_price, coalesce((p_data->>'negotiable')::boolean, false),
      left(btrim(coalesce(p_data->>'description', '')), 4000), v_city, left(btrim(coalesce(p_data->>'district', '')), 60),
      v_phone, nullif(left(regexp_replace(btrim(coalesce(p_data->>'telegram', '')), '^@', ''), 80), ''), v_photos,
      case when v_mode = 'publish' then 'published' else 'draft' end)
    returning * into c;
  else
    select * into c from public.classifieds where id = p_id and owner_id = p_user for update;
    if c.id is null then raise exception 'req_notfound'; end if;
    update public.classifieds set title = v_title, category = v_cat, condition = v_cond, price = v_price,
      negotiable = coalesce((p_data->>'negotiable')::boolean, false),
      description = left(btrim(coalesce(p_data->>'description', '')), 4000), city = v_city,
      district = left(btrim(coalesce(p_data->>'district', '')), 60), phone = v_phone,
      telegram = nullif(left(regexp_replace(btrim(coalesce(p_data->>'telegram', '')), '^@', ''), 80), ''),
      photos = v_photos, status = case when v_mode = 'publish' then 'published' else 'draft' end, updated_at = now()
      where id = c.id returning * into c;
  end if;
  return private.classified_json(c, p_user);
end $$;

create or replace function public.sh_classified_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.classified_json(c, p_user) order by c.updated_at desc)
    from public.classifieds c where c.owner_id = p_user), '[]'::jsonb);
end $$;

create or replace function public.sh_classified_public(p_secret text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.classified_json(c, null) order by c.created_at desc)
    from public.classifieds c where c.status = 'published'), '[]'::jsonb);
end $$;

create or replace function public.sh_classified_one(p_secret text, p_id uuid, p_viewer uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.classifieds;
begin
  perform private.assert_secret(p_secret);
  select * into c from public.classifieds where id = p_id and (status = 'published' or owner_id is not distinct from p_viewer);
  if c.id is null then return null; end if;
  return private.classified_json(c, p_viewer);
end $$;

-- ───────────── ustalar: several profiles, draft, new fields ─────────────
alter table public.masters drop constraint if exists masters_owner_id_key;
drop index if exists masters_owner_id_key;
alter table public.masters add column if not exists address text;
alter table public.masters add column if not exists hours text;
alter table public.masters add column if not exists price_from bigint;
alter table public.masters add column if not exists price_negotiable boolean not null default false;
alter table public.masters add column if not exists contact_public boolean not null default false;
alter table public.masters alter column phone drop not null;

do $drop$
declare r record;
begin
  for r in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.masters'::regclass and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ~* 'services' or pg_get_constraintdef(c.oid) ~* 'status in'
        or pg_get_constraintdef(c.oid) ~* 'char_length\(city\)' or pg_get_constraintdef(c.oid) ~* 'char_length\(title\)'
        or pg_get_constraintdef(c.oid) ~* 'char_length\(phone\)' or pg_get_constraintdef(c.oid) ~* 'address'
        or pg_get_constraintdef(c.oid) ~* 'hours' or pg_get_constraintdef(c.oid) ~* 'price_from'
      )
  loop
    execute format('alter table public.masters drop constraint %I', r.conname);
  end loop;
end
$drop$;

alter table public.masters drop constraint if exists masters_services_check;
alter table public.masters drop constraint if exists masters_status_check;
alter table public.masters drop constraint if exists masters_city_check;
alter table public.masters drop constraint if exists masters_title_check;
alter table public.masters drop constraint if exists masters_phone_check;
alter table public.masters drop constraint if exists masters_address_check;
alter table public.masters drop constraint if exists masters_hours_check;
alter table public.masters drop constraint if exists masters_price_from_check;
alter table public.masters add constraint masters_services_check check (
  cardinality(services) <= 8
  and services <@ array['rentgen','kreslo','ornatish','tamirlash','mebel','servis','konsultatsiya','unit','kompressor','avtoklav','turbina']::text[]
);
alter table public.masters add constraint masters_status_check check (status in ('draft', 'pending', 'published', 'rejected', 'hidden'));
alter table public.masters add constraint masters_city_check check (char_length(city) <= 60);
alter table public.masters add constraint masters_title_check check (char_length(title) <= 80);
alter table public.masters add constraint masters_phone_check check (phone is null or char_length(phone) = 9);
alter table public.masters add constraint masters_address_check check (address is null or char_length(address) <= 200);
alter table public.masters add constraint masters_hours_check check (hours is null or char_length(hours) <= 80);
alter table public.masters add constraint masters_price_from_check check (price_from is null or (price_from >= 0 and price_from <= 1000000000));
create index if not exists masters_owner_idx on public.masters (owner_id, updated_at desc);

create or replace function private.master_json(m public.masters, p_full boolean) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', m.id, 'name', m.name, 'kind', m.kind, 'title', m.title, 'services', to_jsonb(m.services), 'city', m.city,
    'district', m.district, 'years', m.years, 'description', m.description, 'photo', m.photo, 'works', to_jsonb(coalesce(m.works, '{}')),
    'status', m.status, 'createdAt', m.created_at, 'address', m.address, 'hours', m.hours, 'priceFrom', m.price_from,
    'priceNegotiable', m.price_negotiable,
    'online', coalesce((select p.last_seen_at > now() - interval '5 minutes' from public.profiles p where p.id = m.owner_id), false),
    'jobs', (select count(*) from public.master_requests r where r.master_id = m.id and r.status = 'bajarildi'))
  || case when p_full or coalesce(m.contact_public, false) then jsonb_build_object('phone', private.phone_fmt(m.phone), 'telegram', m.telegram) else '{}'::jsonb end
  || case when p_full then jsonb_build_object('rejectReason', m.reject_reason) else '{}'::jsonb end
$$;
revoke all on function private.master_json(public.masters, boolean) from public, anon, authenticated;

create or replace function public.sh_master_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters;
begin
  perform private.assert_secret(p_secret);
  select * into m from public.masters where owner_id = p_user order by updated_at desc limit 1;
  if m.id is null then return null; end if;
  return private.master_json(m, true);
end $$;

create or replace function public.sh_master_profiles(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.master_json(m, true) order by m.updated_at desc)
    from public.masters m where m.owner_id = p_user), '[]'::jsonb);
end $$;

create or replace function public.sh_master_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  m public.masters;
  v_mode text := nullif(p_data->>'mode', '');
  v_phone text := nullif(private.phone9(p_data->>'phone'), '');
  v_services text[];
  v_works text[];
  v_id uuid;
  v_name text := left(btrim(coalesce(p_data->>'name', '')), 80);
  v_title text := left(btrim(coalesce(p_data->>'title', '')), 80);
  v_city text := left(btrim(coalesce(p_data->>'city', '')), 60);
  v_years int := coalesce(private.int_or_null(p_data->>'years'), 0);
  v_price bigint := private.money_or_null(p_data->>'priceFrom');
  v_status text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x
    where x in ('rentgen','kreslo','ornatish','tamirlash','mebel','servis','konsultatsiya','unit','kompressor','avtoklav','turbina');
  select coalesce(array_agg(left(x, 400)), '{}') into v_works from (select x from jsonb_array_elements_text(coalesce(p_data->'works', '[]'::jsonb)) x where btrim(x) <> '' limit 8) w;
  if char_length(coalesce(v_phone, '')) not in (0, 9) then v_phone := null; end if;
  if v_years < 0 or v_years > 60 then v_years := 0; end if;
  if v_mode is null then
    if char_length(v_name) < 2 or char_length(v_title) < 2 or cardinality(v_services) < 1 or char_length(coalesce(v_phone, '')) <> 9 or char_length(v_city) < 2 then
      raise exception 'val_invalid';
    end if;
  elsif v_mode = 'publish' then
    if char_length(v_name) < 2 or cardinality(v_services) < 1 or char_length(coalesce(v_phone, '')) <> 9 or char_length(v_city) < 2 then
      raise exception 'val_invalid';
    end if;
    if char_length(v_title) < 2 then v_title := left(v_name, 80); end if;
  else
    if v_mode <> 'draft' or char_length(v_name) < 2 then raise exception 'val_invalid'; end if;
  end if;
  begin
    v_id := nullif(p_data->>'id', '')::uuid;
  exception when others then
    raise exception 'val_invalid';
  end;
  if v_mode is null then
    select * into m from public.masters where owner_id = p_user order by updated_at desc limit 1 for update;
  elsif v_id is not null then
    select * into m from public.masters where id = v_id and owner_id = p_user for update;
    if m.id is null then raise exception 'req_notfound'; end if;
  end if;
  v_status := case v_mode when 'publish' then 'published' when 'draft' then 'draft' else 'pending' end;
  if m.id is null then
    if (select count(*) from public.masters where owner_id = p_user) >= 12 then raise exception 'lim_reached'; end if;
    insert into public.masters (owner_id, kind, name, title, services, city, district, years, description, photo, works, phone, telegram, status, address, hours, price_from, price_negotiable, contact_public)
    values (p_user, case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, v_name, coalesce(nullif(v_title, ''), v_name),
      v_services, v_city, nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), v_years,
      nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_works, v_phone,
      nullif(left(regexp_replace(btrim(coalesce(p_data->>'telegram', '')), '^@', ''), 80), ''), v_status,
      nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''), nullif(left(btrim(coalesce(p_data->>'hours', '')), 80), ''),
      v_price, coalesce((p_data->>'priceNegotiable')::boolean, false), v_mode is not null)
    returning * into m;
    if v_status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Yangi usta profili', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
      perform private.notify(p_user, 'master_pending', 'Usta profilingiz moderatsiyada', 'Admin tasdiqlagach hamma ko‘radi.', '/ustalar/mening', null);
    end if;
  else
    update public.masters set kind = case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end,
      name = v_name, title = coalesce(nullif(v_title, ''), v_name), services = v_services, city = v_city,
      district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), years = v_years,
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''),
      photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''), works = v_works, phone = v_phone,
      telegram = nullif(left(regexp_replace(btrim(coalesce(p_data->>'telegram', '')), '^@', ''), 80), ''),
      address = nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''),
      hours = nullif(left(btrim(coalesce(p_data->>'hours', '')), 80), ''), price_from = v_price,
      price_negotiable = coalesce((p_data->>'priceNegotiable')::boolean, false),
      contact_public = case when v_mode is not null then true else contact_public end,
      status = case when v_mode is null then case when status = 'rejected' then 'pending' else status end else v_status end,
      reject_reason = case when status = 'rejected' and v_mode is null then null else reject_reason end,
      updated_at = now() where id = m.id returning * into m;
    if m.status = 'pending' and v_mode is null then
      perform private.sem_notify_admins('moderation_new', 'Usta profili yangilandi', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.master_json(m, true);
end $$;

-- ───────────── laboratoriyalar ─────────────
alter table public.labs drop constraint if exists labs_owner_id_key;
drop index if exists labs_owner_id_key;
alter table public.labs add column if not exists address text;
alter table public.labs add column if not exists hours text;
alter table public.labs add column if not exists weekdays text[] not null default '{}';
alter table public.labs add column if not exists open_time text;
alter table public.labs add column if not exists close_time text;
alter table public.labs add column if not exists delivery boolean not null default false;
alter table public.labs add column if not exists email text;
alter table public.labs add column if not exists contact_public boolean not null default false;
alter table public.labs alter column phone drop not null;

do $drop$
declare r record;
begin
  for r in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.labs'::regclass and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ~* 'services' or pg_get_constraintdef(c.oid) ~* 'materials'
        or pg_get_constraintdef(c.oid) ~* 'status in' or pg_get_constraintdef(c.oid) ~* 'char_length\(city\)'
        or pg_get_constraintdef(c.oid) ~* 'char_length\(phone\)' or pg_get_constraintdef(c.oid) ~* 'address'
        or pg_get_constraintdef(c.oid) ~* 'hours' or pg_get_constraintdef(c.oid) ~* 'email'
        or pg_get_constraintdef(c.oid) ~* 'weekdays' or pg_get_constraintdef(c.oid) ~* 'open_time'
      )
  loop
    execute format('alter table public.labs drop constraint %I', r.conname);
  end loop;
end
$drop$;

alter table public.labs drop constraint if exists labs_services_check;
alter table public.labs drop constraint if exists labs_materials_check;
alter table public.labs drop constraint if exists labs_status_check;
alter table public.labs drop constraint if exists labs_city_check;
alter table public.labs drop constraint if exists labs_phone_check;
alter table public.labs drop constraint if exists labs_address_check;
alter table public.labs drop constraint if exists labs_hours_check;
alter table public.labs drop constraint if exists labs_email_check;
alter table public.labs drop constraint if exists labs_weekdays_check;
alter table public.labs drop constraint if exists labs_open_time_check;
alter table public.labs drop constraint if exists labs_close_time_check;
alter table public.labs add constraint labs_services_check check (
  cardinality(services) <= 8
  and services <@ array['crown','veneer','implant','bridge','removable','cadcam','ortodontiya']::text[]
);
alter table public.labs add constraint labs_materials_check check (
  materials <@ array['zirconia','emax','metal-ceramic','premium','pmma','wax','kompozit','boshqa']::text[]
);
alter table public.labs add constraint labs_status_check check (status in ('draft', 'pending', 'published', 'rejected', 'hidden'));
alter table public.labs add constraint labs_city_check check (char_length(city) <= 60);
alter table public.labs add constraint labs_phone_check check (phone is null or char_length(phone) = 9);
alter table public.labs add constraint labs_address_check check (address is null or char_length(address) <= 200);
alter table public.labs add constraint labs_hours_check check (hours is null or char_length(hours) <= 80);
alter table public.labs add constraint labs_email_check check (email is null or char_length(email) <= 120);
alter table public.labs add constraint labs_weekdays_check check (cardinality(weekdays) <= 7);
alter table public.labs add constraint labs_open_time_check check (open_time is null or open_time ~ '^[0-2][0-9]:[0-5][0-9]$');
alter table public.labs add constraint labs_close_time_check check (close_time is null or close_time ~ '^[0-2][0-9]:[0-5][0-9]$');
create index if not exists labs_owner_idx on public.labs (owner_id, updated_at desc);

create or replace function private.lab_json(l public.labs, p_full boolean) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', l.id, 'name', l.name, 'city', l.city, 'services', to_jsonb(l.services), 'materials', to_jsonb(l.materials),
    'description', l.description, 'days', l.days, 'priceFrom', l.price_from, 'photo', l.photo, 'status', l.status, 'createdAt', l.created_at,
    'district', l.district, 'photos', to_jsonb(coalesce(l.photos, '{}')), 'video', l.video, 'logo', l.logo, 'years', l.years,
    'courier', l.courier, 'courierArea', l.courier_area, 'portfolio', to_jsonb(coalesce(l.portfolio, '{}')), 'priceItems', coalesce(l.price_items, '[]'::jsonb),
    'verified', l.verified, 'address', l.address, 'hours', l.hours, 'weekdays', to_jsonb(coalesce(l.weekdays, '{}')),
    'openTime', l.open_time, 'closeTime', l.close_time, 'delivery', l.delivery,
    'online', coalesce((select p.last_seen_at > now() - interval '5 minutes' from public.profiles p where p.id = l.owner_id), false),
    'lastSeen', (select p.last_seen_at from public.profiles p where p.id = l.owner_id),
    'done', (select count(*) from public.lab_orders o where o.lab_id = l.id and o.status = 'yetkazildi'))
  || case when p_full or coalesce(l.contact_public, false) then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram, 'email', l.email) else '{}'::jsonb end
  || case when p_full then jsonb_build_object('rejectReason', l.reject_reason) else '{}'::jsonb end
$$;
revoke all on function private.lab_json(public.labs, boolean) from public, anon, authenticated;

create or replace function public.sh_lab_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs;
begin
  perform private.assert_secret(p_secret);
  select * into l from public.labs where owner_id = p_user order by updated_at desc limit 1;
  if l.id is null then return null; end if;
  return private.lab_json(l, true);
end $$;

create or replace function public.sh_lab_profiles(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.lab_json(l, true) order by l.updated_at desc)
    from public.labs l where l.owner_id = p_user), '[]'::jsonb);
end $$;

create or replace function public.sh_lab_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  l public.labs;
  v_mode text := nullif(p_data->>'mode', '');
  v_phone text := nullif(private.phone9(p_data->>'phone'), '');
  v_services text[];
  v_materials text[];
  v_photos text[];
  v_portfolio text[];
  v_days text[];
  v_items jsonb;
  v_id uuid;
  v_name text := left(btrim(coalesce(p_data->>'name', '')), 80);
  v_city text := left(btrim(coalesce(p_data->>'city', '')), 60);
  v_years int := private.int_or_null(p_data->>'years');
  v_status text;
  v_open text := nullif(left(btrim(coalesce(p_data->>'openTime', '')), 5), '');
  v_close text := nullif(left(btrim(coalesce(p_data->>'closeTime', '')), 5), '');
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x
    where x in ('crown','veneer','implant','bridge','removable','cadcam','ortodontiya');
  select coalesce(array_agg(x), '{}') into v_materials from jsonb_array_elements_text(coalesce(p_data->'materials', '[]'::jsonb)) x
    where x in ('zirconia','emax','metal-ceramic','premium','pmma','wax','kompozit','boshqa');
  select coalesce(array_agg(left(x, 400)), '{}') into v_photos from (select x from jsonb_array_elements_text(coalesce(p_data->'photos', '[]'::jsonb)) x where btrim(x) <> '' limit 8) q;
  select coalesce(array_agg(left(x, 400)), '{}') into v_portfolio from (select x from jsonb_array_elements_text(coalesce(p_data->'portfolio', '[]'::jsonb)) x where btrim(x) <> '' limit 8) q;
  select coalesce(array_agg(x), '{}') into v_days from jsonb_array_elements_text(coalesce(p_data->'weekdays', '[]'::jsonb)) x
    where x in ('du','se','ch','pa','ju','sh','ya');
  v_items := case when jsonb_typeof(p_data->'priceItems') = 'array' then p_data->'priceItems' else '[]'::jsonb end;
  if jsonb_array_length(v_items) > 30 or pg_column_size(v_items) > 60000 then raise exception 'val_invalid'; end if;
  if char_length(coalesce(v_phone, '')) not in (0, 9) then v_phone := null; end if;
  if v_years is not null and (v_years < 0 or v_years > 60) then v_years := null; end if;
  if v_open is not null and v_open !~ '^[0-2][0-9]:[0-5][0-9]$' then v_open := null; end if;
  if v_close is not null and v_close !~ '^[0-2][0-9]:[0-5][0-9]$' then v_close := null; end if;
  if v_mode is null then
    if char_length(v_name) < 2 or cardinality(v_services) < 1 or char_length(coalesce(v_phone, '')) <> 9 or char_length(v_city) < 2 then
      raise exception 'val_invalid';
    end if;
  elsif v_mode = 'publish' then
    if char_length(v_name) < 2 or cardinality(v_services) < 1 or char_length(v_city) < 2 or char_length(coalesce(v_phone, '')) <> 9 then
      raise exception 'val_invalid';
    end if;
  else
    if v_mode <> 'draft' or char_length(v_name) < 2 then raise exception 'val_invalid'; end if;
  end if;
  begin
    v_id := nullif(p_data->>'id', '')::uuid;
  exception when others then
    raise exception 'val_invalid';
  end;
  if v_mode is null then
    select * into l from public.labs where owner_id = p_user order by updated_at desc limit 1 for update;
  elsif v_id is not null then
    select * into l from public.labs where id = v_id and owner_id = p_user for update;
    if l.id is null then raise exception 'req_notfound'; end if;
  end if;
  v_status := case v_mode when 'publish' then 'published' when 'draft' then 'draft' else 'pending' end;
  if l.id is null then
    if (select count(*) from public.labs where owner_id = p_user) >= 12 then raise exception 'lim_reached'; end if;
    insert into public.labs (owner_id, name, city, services, materials, description, days, price_from, photo, phone, telegram, status,
      district, photos, video, logo, years, courier, courier_area, portfolio, price_items, address, hours, weekdays, open_time, close_time, delivery, email, contact_public)
    values (p_user, v_name, v_city, v_services, v_materials,
      nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), private.int_or_null(p_data->>'days'), private.money_or_null(p_data->>'priceFrom'),
      nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_phone, nullif(left(regexp_replace(btrim(coalesce(p_data->>'telegram', '')), '^@', ''), 80), ''), v_status,
      nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), v_photos, nullif(btrim(coalesce(p_data->>'video', '')), ''),
      nullif(btrim(coalesce(p_data->>'logo', '')), ''), v_years,
      case when p_data->>'courier' in ('ha', 'yoq') then p_data->>'courier' when coalesce((p_data->>'delivery')::boolean, false) then 'ha' else null end,
      nullif(left(btrim(coalesce(p_data->>'courierArea', '')), 60), ''), v_portfolio, v_items,
      nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''), nullif(left(btrim(coalesce(p_data->>'hours', '')), 80), ''),
      v_days, v_open, v_close, coalesce((p_data->>'delivery')::boolean, false),
      nullif(left(btrim(coalesce(p_data->>'email', '')), 120), ''), v_mode is not null)
    returning * into l;
    if v_status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Yangi laboratoriya profili', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
      perform private.notify(p_user, 'lab_pending', 'Laboratoriya profilingiz moderatsiyada', 'Admin tasdiqlagach katalogda ko‘rinadi.', '/laboratoriya/buyurtmalarim?tab=kelgan', null);
    end if;
  else
    update public.labs set name = v_name, city = case when v_mode is null then v_city else coalesce(nullif(v_city, ''), city) end,
      services = v_services, materials = v_materials,
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''),
      days = private.int_or_null(p_data->>'days'), price_from = private.money_or_null(p_data->>'priceFrom'),
      photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''), phone = v_phone,
      telegram = nullif(left(regexp_replace(btrim(coalesce(p_data->>'telegram', '')), '^@', ''), 80), ''),
      district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), photos = v_photos,
      video = nullif(btrim(coalesce(p_data->>'video', '')), ''), logo = nullif(btrim(coalesce(p_data->>'logo', '')), ''),
      years = v_years,
      courier = case when p_data->>'courier' in ('ha', 'yoq') then p_data->>'courier' when p_data ? 'delivery' and coalesce((p_data->>'delivery')::boolean, false) then 'ha' when p_data ? 'delivery' then 'yoq' else courier end,
      courier_area = nullif(left(btrim(coalesce(p_data->>'courierArea', '')), 60), ''), portfolio = v_portfolio, price_items = v_items,
      address = nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''),
      hours = nullif(left(btrim(coalesce(p_data->>'hours', '')), 80), ''), weekdays = v_days, open_time = v_open, close_time = v_close,
      delivery = case when p_data ? 'delivery' then coalesce((p_data->>'delivery')::boolean, false) else delivery end,
      email = nullif(left(btrim(coalesce(p_data->>'email', '')), 120), ''),
      contact_public = case when v_mode is not null then true else contact_public end,
      status = case when v_mode is null then case when status = 'rejected' then 'pending' else status end else v_status end,
      reject_reason = case when status = 'rejected' and v_mode is null then null else reject_reason end,
      updated_at = now() where id = l.id returning * into l;
    if l.status = 'pending' and v_mode is null then
      perform private.sem_notify_admins('moderation_new', 'Laboratoriya profili yangilandi', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.lab_json(l, true);
end $$;

-- ───────────── vakansiyalar ─────────────
alter table public.jobs add column if not exists telegram text;
alter table public.jobs add column if not exists email text;
alter table public.jobs add column if not exists duties text[] not null default '{}';
alter table public.jobs add column if not exists salary_negotiable boolean not null default false;
alter table public.jobs add column if not exists accept_applications boolean not null default true;
alter table public.jobs add column if not exists benefit_note text;
alter table public.jobs add column if not exists contact_public boolean not null default false;
alter table public.jobs alter column phone drop not null;

do $drop$
declare r record;
begin
  for r in
    select c.conname from pg_constraint c
    where c.conrelid = 'public.jobs'::regclass and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ~* 'char_length\(description\)' or pg_get_constraintdef(c.oid) ~* 'char_length\(title\)'
        or pg_get_constraintdef(c.oid) ~* 'char_length\(clinic\)' or pg_get_constraintdef(c.oid) ~* 'char_length\(city\)'
        or pg_get_constraintdef(c.oid) ~* 'char_length\(phone\)' or pg_get_constraintdef(c.oid) ~* 'status in'
        or pg_get_constraintdef(c.oid) ~* 'duties' or pg_get_constraintdef(c.oid) ~* 'email'
        or pg_get_constraintdef(c.oid) ~* 'benefit_note' or pg_get_constraintdef(c.oid) ~* 'telegram'
      )
  loop
    execute format('alter table public.jobs drop constraint %I', r.conname);
  end loop;
end
$drop$;

alter table public.jobs drop constraint if exists jobs_title_check;
alter table public.jobs drop constraint if exists jobs_clinic_check;
alter table public.jobs drop constraint if exists jobs_city_check;
alter table public.jobs drop constraint if exists jobs_description_check;
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs drop constraint if exists jobs_phone_check;
alter table public.jobs drop constraint if exists jobs_duties_check;
alter table public.jobs drop constraint if exists jobs_email_check;
alter table public.jobs drop constraint if exists jobs_telegram_check;
alter table public.jobs drop constraint if exists jobs_benefit_note_check;
alter table public.jobs add constraint jobs_title_check check (char_length(title) between 1 and 100);
alter table public.jobs add constraint jobs_clinic_check check (char_length(clinic) <= 100);
alter table public.jobs add constraint jobs_city_check check (char_length(city) <= 60);
alter table public.jobs add constraint jobs_description_check check (char_length(description) <= 2000);
alter table public.jobs add constraint jobs_status_check check (status in ('draft', 'pending', 'published', 'rejected', 'hidden', 'closed'));
alter table public.jobs add constraint jobs_phone_check check (phone is null or char_length(phone) = 9);
alter table public.jobs add constraint jobs_duties_check check (cardinality(duties) <= 12);
alter table public.jobs add constraint jobs_email_check check (email is null or char_length(email) <= 120);
alter table public.jobs add constraint jobs_telegram_check check (telegram is null or char_length(telegram) <= 80);
alter table public.jobs add constraint jobs_benefit_note_check check (benefit_note is null or char_length(benefit_note) <= 80);

create or replace function private.job_json(j public.jobs, p_viewer uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', j.id, 'title', j.title, 'clinic', j.clinic, 'city', j.city, 'salaryMin', j.salary_min, 'salaryMax', j.salary_max,
    'type', j.job_type, 'experienceYears', j.experience_years, 'remote', j.remote, 'description', j.description, 'status', j.status,
    'rejectReason', j.reject_reason, 'createdAt', j.created_at, 'mine', j.owner_id = p_viewer,
    'category', j.category, 'photos', to_jsonb(j.photos), 'video', j.video, 'district', j.district, 'address', j.address,
    'workDays', j.work_days, 'workHours', j.work_hours, 'benefits', to_jsonb(j.benefits), 'requirements', to_jsonb(j.requirements),
    'employerAbout', j.employer_about, 'staffCount', j.staff_count, 'foundedYear', j.founded_year, 'logo', j.logo,
    'duties', to_jsonb(coalesce(j.duties, '{}')), 'salaryNegotiable', j.salary_negotiable,
    'acceptApplications', j.accept_applications, 'benefitNote', j.benefit_note)
  || case when j.owner_id = p_viewer or coalesce(j.contact_public, false) then jsonb_build_object(
      'phone', private.phone_fmt(j.phone), 'telegram', j.telegram, 'email', j.email) else '{}'::jsonb end
  || case when j.owner_id = p_viewer then jsonb_build_object(
      'appCount', (select count(*) from public.job_applications a where a.job_id = j.id and a.status <> 'bekor'),
      'newCount', (select count(*) from public.job_applications a where a.job_id = j.id and a.status = 'yuborildi')) else '{}'::jsonb end
$$;
revoke all on function private.job_json(public.jobs, uuid) from public, anon, authenticated;

create or replace function public.sh_job_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  j public.jobs;
  v_mode text := nullif(p_data->>'mode', '');
  v_phone text := nullif(private.phone9(p_data->>'phone'), '');
  v_min bigint := private.money_or_null(p_data->>'salaryMin');
  v_max bigint := private.money_or_null(p_data->>'salaryMax');
  v_type text := coalesce(nullif(p_data->>'type', ''), 'full');
  v_cat text := nullif(p_data->>'category', '');
  v_photos text[] := coalesce((select array_agg(left(x, 400)) from (select jsonb_array_elements_text(case when jsonb_typeof(p_data->'photos') = 'array' then p_data->'photos' else '[]'::jsonb end) x limit 8) s), '{}');
  v_benefits text[] := coalesce((select array_agg(distinct x) from (select jsonb_array_elements_text(case when jsonb_typeof(p_data->'benefits') = 'array' then p_data->'benefits' else '[]'::jsonb end) x) s
      where x in ('rasmiy','oqim','malaka','jamoa','sharoit','avtoturargoh','tushlik','bonus')), '{}');
  v_reqs text[] := coalesce((select array_agg(left(btrim(x), 160)) from (select jsonb_array_elements_text(case when jsonb_typeof(p_data->'requirements') = 'array' then p_data->'requirements' else '[]'::jsonb end) x limit 8) s where btrim(x) <> ''), '{}');
  v_duties text[] := coalesce((select array_agg(left(btrim(x), 160)) from (select jsonb_array_elements_text(case when jsonb_typeof(p_data->'duties') = 'array' then p_data->'duties' else '[]'::jsonb end) x limit 8) s where btrim(x) <> ''), '{}');
  v_title text := left(btrim(coalesce(p_data->>'title', '')), 100);
  v_clinic text := left(btrim(coalesce(p_data->>'clinic', '')), 100);
  v_city text := left(btrim(coalesce(p_data->>'city', '')), 60);
  v_desc text := left(btrim(coalesce(p_data->>'description', '')), 2000);
  v_email text := nullif(left(btrim(coalesce(p_data->>'email', '')), 120), '');
  v_tg text := nullif(left(regexp_replace(btrim(coalesce(p_data->>'telegram', '')), '^@', ''), 80), '');
  v_status text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if cardinality(v_benefits) > 6 then v_benefits := v_benefits[1:6]; end if;
  if char_length(coalesce(v_phone, '')) not in (0, 9) then v_phone := null; end if;
  if v_type not in ('full', 'part', 'shift', 'freelance', 'amaliyot') then v_type := 'full'; end if;
  if v_cat is not null and v_cat not in ('klinika', 'texnik', 'shifokor') then v_cat := null; end if;
  if v_min is not null and v_max is not null and v_max < v_min then raise exception 'val_invalid'; end if;
  if v_mode is null then
    if char_length(v_title) < 3 or char_length(v_clinic) < 2 or char_length(v_city) < 2 or char_length(v_desc) < 20 or char_length(coalesce(v_phone, '')) <> 9 then
      raise exception 'val_invalid';
    end if;
    v_status := 'pending';
  elsif v_mode = 'publish' then
    if char_length(v_title) < 3 or char_length(v_clinic) < 2 or char_length(v_city) < 2 then raise exception 'val_invalid'; end if;
    if char_length(coalesce(v_phone, '')) <> 9 and v_tg is null and v_email is null then raise exception 'val_invalid'; end if;
    if char_length(v_desc) < 1 then v_desc := left(v_title, 2000); end if;
    v_status := 'published';
  else
    if v_mode <> 'draft' or char_length(v_title) < 1 then raise exception 'val_invalid'; end if;
    v_status := 'draft';
  end if;
  if p_id is null and v_mode is null then
    if (select count(*) from public.jobs where owner_id = p_user and created_at > now() - interval '1 day') >= 5
       or (select count(*) from public.jobs where owner_id = p_user and status in ('pending', 'published')) >= 15 then raise exception 'lim_reached'; end if;
    if exists (select 1 from public.jobs where owner_id = p_user and status in ('pending', 'published', 'hidden') and lower(btrim(title)) = lower(v_title) and lower(btrim(clinic)) = lower(v_clinic) and lower(btrim(city)) = lower(v_city)) then raise exception 'listing_duplicate'; end if;
  elsif p_id is null and v_mode = 'publish' then
    if (select count(*) from public.jobs where owner_id = p_user and status in ('pending', 'published')) >= 15 then raise exception 'lim_reached'; end if;
  end if;
  if p_id is null then
    insert into public.jobs (owner_id, title, clinic, city, salary_min, salary_max, job_type, experience_years, remote, description, phone, status,
        category, photos, video, district, address, work_days, work_hours, benefits, requirements, employer_about, staff_count, founded_year, logo,
        telegram, email, duties, salary_negotiable, accept_applications, benefit_note, contact_public)
    values (p_user, v_title, v_clinic, v_city, v_min, v_max, v_type,
      coalesce(private.int_or_null(p_data->>'experienceYears'), 0), coalesce((p_data->>'remote')::boolean, false), v_desc, v_phone, v_status,
      v_cat, v_photos, nullif(left(btrim(coalesce(p_data->>'video', '')), 400), ''),
      nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''),
      nullif(left(btrim(coalesce(p_data->>'workDays', '')), 60), ''), nullif(left(btrim(coalesce(p_data->>'workHours', '')), 40), ''),
      v_benefits, v_reqs, nullif(left(btrim(coalesce(p_data->>'employerAbout', '')), 160), ''),
      private.int_or_null(p_data->>'staffCount'), private.int_or_null(p_data->>'foundedYear'),
      nullif(left(btrim(coalesce(p_data->>'logo', '')), 400), ''), v_tg, v_email, v_duties,
      coalesce((p_data->>'salaryNegotiable')::boolean, false), coalesce((p_data->>'acceptApplications')::boolean, true),
      nullif(left(btrim(coalesce(p_data->>'benefitNote', '')), 80), ''), v_mode is not null)
    returning * into j;
    if v_status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Yangi vakansiya', left(j.title, 60) || ' · ' || left(j.clinic, 40) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
      perform private.notify(p_user, 'job_pending', 'Vakansiyangiz moderatsiyada', 'Admin tasdiqlagach hamma ko‘radi.', '/ishlar/vakansiyalarim', null);
    end if;
  else
    select * into j from public.jobs where id = p_id and owner_id = p_user for update;
    if j.id is null then raise exception 'req_notfound'; end if;
    update public.jobs set title = coalesce(nullif(v_title, ''), title), clinic = v_clinic, city = v_city,
      salary_min = v_min, salary_max = v_max, job_type = v_type, experience_years = coalesce(private.int_or_null(p_data->>'experienceYears'), 0),
      remote = coalesce((p_data->>'remote')::boolean, false), description = v_desc, phone = v_phone,
      category = v_cat, photos = v_photos, video = nullif(left(btrim(coalesce(p_data->>'video', '')), 400), ''),
      district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), address = nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''),
      work_days = nullif(left(btrim(coalesce(p_data->>'workDays', '')), 60), ''), work_hours = nullif(left(btrim(coalesce(p_data->>'workHours', '')), 40), ''),
      benefits = v_benefits, requirements = v_reqs, employer_about = nullif(left(btrim(coalesce(p_data->>'employerAbout', '')), 160), ''),
      staff_count = private.int_or_null(p_data->>'staffCount'), founded_year = private.int_or_null(p_data->>'foundedYear'),
      logo = nullif(left(btrim(coalesce(p_data->>'logo', '')), 400), ''), telegram = v_tg, email = v_email, duties = v_duties,
      salary_negotiable = coalesce((p_data->>'salaryNegotiable')::boolean, false),
      accept_applications = coalesce((p_data->>'acceptApplications')::boolean, true),
      benefit_note = nullif(left(btrim(coalesce(p_data->>'benefitNote', '')), 80), ''),
      contact_public = case when v_mode is not null then true else contact_public end,
      status = case when v_mode is null then case when status = 'rejected' then 'pending' else status end else v_status end,
      reject_reason = case when status = 'rejected' and v_mode is null then null else reject_reason end, updated_at = now()
      where id = j.id returning * into j;
    if j.status = 'pending' and v_mode is null then
      perform private.sem_notify_admins('moderation_new', 'Vakansiya yangilandi', left(j.title, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.job_json(j, p_user);
end $$;

grant execute on function public.sh_classified_save(text, uuid, uuid, jsonb), public.sh_classified_mine(text, uuid), public.sh_classified_public(text), public.sh_classified_one(text, uuid, uuid), public.sh_master_profiles(text, uuid), public.sh_lab_profiles(text, uuid) to anon, authenticated, service_role;
