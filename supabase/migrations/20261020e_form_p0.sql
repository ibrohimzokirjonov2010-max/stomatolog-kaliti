-- P0 add-form rules. Apply once after 20261020d_public_catalog.sql. Safe to re-run.
-- Does not move hosting. Does not republish drafts.
-- Hides public phones (reveal RPC), blocks drug surplus listings, stores video tokens
-- and optional form extras (p0 jsonb). Surplus saves stay pending until a moderator approves.

alter table public.masters add column if not exists p0 jsonb not null default '{}'::jsonb;
alter table public.labs add column if not exists p0 jsonb not null default '{}'::jsonb;
alter table public.jobs add column if not exists p0 jsonb not null default '{}'::jsonb;
alter table public.classifieds add column if not exists p0 jsonb not null default '{}'::jsonb;
alter table public.surplus_listings add column if not exists p0 jsonb not null default '{}'::jsonb;
alter table public.community_posts add column if not exists p0 jsonb not null default '{}'::jsonb;

alter table public.surplus_listings add column if not exists lot text;
alter table public.surplus_listings add column if not exists qty int;
alter table public.surplus_listings add column if not exists qty_unit text;
alter table public.surplus_listings add column if not exists expiry_on date;
alter table public.surplus_listings add column if not exists live_verified boolean not null default false;
alter table public.surplus_listings add column if not exists verification_code text;

alter table public.surplus_listings drop constraint if exists surplus_listings_category_check;
-- category stays free text; the save function rejects drugs.

create table if not exists public.video_tokens (
  id uuid primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null check (code ~ '^[0-9]{4}$'),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  capture_source text,
  duration_ms int,
  size_bytes int,
  sha256 text,
  video_url text,
  mobile boolean not null default false,
  live_verified boolean not null default false
);
create index if not exists video_tokens_user_idx on public.video_tokens (user_id, issued_at desc);
alter table public.video_tokens enable row level security;
revoke all on public.video_tokens from anon, authenticated;

create table if not exists public.phone_reveals (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  target_id uuid not null,
  created_at timestamptz not null default now()
);
create index if not exists phone_reveals_viewer_idx on public.phone_reveals (viewer_id, created_at desc);
alter table public.phone_reveals enable row level security;
revoke all on public.phone_reveals from anon, authenticated;

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  target_id uuid not null,
  reason text not null,
  serious boolean not null default false,
  created_at timestamptz not null default now(),
  unique (reporter_id, kind, target_id)
);
alter table public.content_reports enable row level security;
revoke all on public.content_reports from anon, authenticated;

-- Drug listings leave the public catalog. Owners still see them as hidden.
update public.surplus_listings
set status = 'hidden',
    reject_reason = 'Dori vositalari yuridik xulosagacha yopildi',
    updated_at = now()
where status in ('published', 'pending')
  and (
    category = 'anesteziya'
    or name ~* '(anestez|articain|ubistesin|ultracain|lidocain|karpula|carpule|septanest|scandonest)'
    or coalesce(brand, '') ~* '(anestez|articain|ubistesin|ultracain|lidocain|karpula|carpule|septanest)'
  );

create or replace function public.sh_form_p0_set(p_secret text, p_user uuid, p_kind text, p_id uuid, p_extra jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_extra is null or jsonb_typeof(p_extra) <> 'object' then raise exception 'val_invalid'; end if;
  if p_kind = 'master' then
    update public.masters set p0 = p_extra, updated_at = now() where id = p_id and owner_id = p_user;
  elsif p_kind = 'lab' then
    update public.labs set p0 = p_extra, updated_at = now() where id = p_id and owner_id = p_user;
  elsif p_kind = 'job' then
    update public.jobs set p0 = p_extra, updated_at = now() where id = p_id and owner_id = p_user;
  elsif p_kind = 'classified' then
    update public.classifieds set p0 = p_extra, updated_at = now() where id = p_id and owner_id = p_user;
  elsif p_kind = 'surplus' then
    update public.surplus_listings set p0 = p_extra, updated_at = now() where id = p_id and owner_id = p_user;
  elsif p_kind = 'case' then
    update public.community_posts set p0 = p_extra where id = p_id and author_id = p_user;
  else
    raise exception 'val_invalid';
  end if;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'req_notfound'; end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.sh_form_p0_set(text, uuid, text, uuid, jsonb) from public;
grant execute on function public.sh_form_p0_set(text, uuid, text, uuid, jsonb) to anon, authenticated, service_role;

create or replace function public.sh_video_token_create(p_secret text, p_user uuid, p_id uuid, p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_code !~ '^[0-9]{4}$' then raise exception 'val_invalid'; end if;
  select count(*) into n from public.video_tokens where user_id = p_user and issued_at > now() - interval '1 hour';
  if n >= 10 then raise exception 'lim_reached'; end if;
  insert into public.video_tokens (id, user_id, code, expires_at)
  values (p_id, p_user, p_code, now() + interval '15 minutes');
  return jsonb_build_object('id', p_id, 'code', p_code, 'expiresAt', now() + interval '15 minutes');
end $$;
revoke all on function public.sh_video_token_create(text, uuid, uuid, text) from public;
grant execute on function public.sh_video_token_create(text, uuid, uuid, text) to anon, authenticated, service_role;

create or replace function public.sh_video_token_complete(p_secret text, p_user uuid, p_id uuid, p_meta jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.video_tokens;
  v_source text := p_meta->>'captureSource';
  v_ms int := nullif(p_meta->>'durationMs', '')::int;
  v_size int := nullif(p_meta->>'sizeBytes', '')::int;
  v_mobile boolean := coalesce((p_meta->>'mobile')::boolean, false);
  v_live boolean;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into t from public.video_tokens where id = p_id and user_id = p_user for update;
  if t.id is null then raise exception 'req_notfound'; end if;
  if t.used_at is not null then raise exception 'val_invalid'; end if;
  if t.expires_at < now() then raise exception 'otp_invalid'; end if;
  if v_source not in ('live_camera', 'capture_input', 'desktop_file') then raise exception 'val_invalid'; end if;
  if v_mobile and v_source = 'desktop_file' then raise exception 'video_rejected'; end if;
  if v_ms is null or v_ms < 15000 or v_ms > 60000 then raise exception 'video_rejected'; end if;
  if v_size is not null and v_size > 52428800 then raise exception 'video_rejected'; end if;
  v_live := v_source in ('live_camera', 'capture_input');
  update public.video_tokens set used_at = now(), capture_source = v_source, duration_ms = v_ms, size_bytes = v_size,
    sha256 = nullif(left(coalesce(p_meta->>'sha256', ''), 80), ''),
    video_url = nullif(left(coalesce(p_meta->>'videoUrl', ''), 400), ''),
    mobile = v_mobile, live_verified = v_live
  where id = t.id;
  return jsonb_build_object('ok', true, 'liveVerified', v_live, 'moderation', 'pending', 'code', t.code);
end $$;
revoke all on function public.sh_video_token_complete(text, uuid, uuid, jsonb) from public;
grant execute on function public.sh_video_token_complete(text, uuid, uuid, jsonb) to anon, authenticated, service_role;

-- Public catalog JSON no longer includes the phone. Owner views (p_full / mine) still do.
create or replace function private.master_json(m public.masters, p_full boolean) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', m.id, 'name', m.name, 'kind', m.kind, 'title', m.title, 'services', to_jsonb(m.services), 'city', m.city,
    'district', m.district, 'years', m.years, 'description', m.description, 'photo', m.photo, 'works', to_jsonb(coalesce(m.works, '{}')),
    'status', m.status, 'createdAt', m.created_at, 'address', m.address, 'hours', m.hours, 'priceFrom', m.price_from,
    'priceNegotiable', m.price_negotiable, 'sourceUrl', m.source_url, 'instagram', m.instagram,
    'p0', coalesce(m.p0, '{}'::jsonb),
    'online', coalesce((select p.last_seen_at > now() - interval '5 minutes' from public.profiles p where p.id = m.owner_id), false),
    'jobs', (select count(*) from public.master_requests r where r.master_id = m.id and r.status = 'bajarildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(m.phone), 'telegram', m.telegram) else '{}'::jsonb end
  || case when p_full then jsonb_build_object('rejectReason', m.reject_reason) else '{}'::jsonb end
$$;
revoke all on function private.master_json(public.masters, boolean) from public, anon, authenticated;

create or replace function private.lab_json(l public.labs, p_full boolean) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', l.id, 'name', l.name, 'city', l.city, 'services', to_jsonb(l.services), 'materials', to_jsonb(l.materials),
    'description', l.description, 'days', l.days, 'priceFrom', l.price_from, 'photo', l.photo, 'status', l.status, 'createdAt', l.created_at,
    'district', l.district, 'photos', to_jsonb(coalesce(l.photos, '{}')), 'video', l.video, 'logo', l.logo, 'years', l.years,
    'courier', l.courier, 'courierArea', l.courier_area, 'portfolio', to_jsonb(coalesce(l.portfolio, '{}')), 'priceItems', coalesce(l.price_items, '[]'::jsonb),
    'verified', l.verified, 'address', l.address, 'hours', l.hours, 'weekdays', to_jsonb(coalesce(l.weekdays, '{}')),
    'openTime', l.open_time, 'closeTime', l.close_time, 'delivery', l.delivery, 'sourceUrl', l.source_url, 'instagram', l.instagram,
    'p0', coalesce(l.p0, '{}'::jsonb),
    'online', coalesce((select p.last_seen_at > now() - interval '5 minutes' from public.profiles p where p.id = l.owner_id), false),
    'lastSeen', (select p.last_seen_at from public.profiles p where p.id = l.owner_id),
    'done', (select count(*) from public.lab_orders o where o.lab_id = l.id and o.status = 'yetkazildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram, 'email', l.email) else '{}'::jsonb end
  || case when p_full then jsonb_build_object('rejectReason', l.reject_reason) else '{}'::jsonb end
$$;
revoke all on function private.lab_json(public.labs, boolean) from public, anon, authenticated;

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
    'acceptApplications', j.accept_applications, 'benefitNote', j.benefit_note, 'sourceUrl', j.source_url, 'instagram', j.instagram,
    'p0', coalesce(j.p0, '{}'::jsonb))
  || case when j.owner_id = p_viewer then jsonb_build_object(
      'phone', private.phone_fmt(j.phone), 'telegram', j.telegram, 'email', j.email) else '{}'::jsonb end
  || case when j.owner_id = p_viewer then jsonb_build_object(
      'appCount', (select count(*) from public.job_applications a where a.job_id = j.id and a.status <> 'bekor'),
      'newCount', (select count(*) from public.job_applications a where a.job_id = j.id and a.status = 'yuborildi')) else '{}'::jsonb end
$$;
revoke all on function private.job_json(public.jobs, uuid) from public, anon, authenticated;

create or replace function private.classified_json(c public.classifieds, p_viewer uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', c.id, 'title', c.title, 'category', c.category, 'condition', c.condition,
    'price', c.price, 'negotiable', c.negotiable, 'description', c.description,
    'city', c.city, 'district', c.district, 'photos', to_jsonb(coalesce(c.photos, '{}')),
    'status', c.status, 'createdAt', c.created_at, 'updatedAt', c.updated_at,
    'mine', c.owner_id is not distinct from p_viewer, 'sourceUrl', c.source_url, 'instagram', c.instagram,
    'p0', coalesce(c.p0, '{}'::jsonb),
    'phone', case when c.owner_id is not distinct from p_viewer then private.phone_fmt(c.phone) else null end,
    'telegram', case when c.owner_id is not distinct from p_viewer then c.telegram else null end
  )
$$;
revoke all on function private.classified_json(public.classifieds, uuid) from public, anon, authenticated;

create or replace function private.surplus_json(l public.surplus_listings, p_viewer uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'name', l.name, 'brand', l.brand, 'category', l.category, 'price', l.price, 'newPrice', l.new_price, 'pkg', l.pkg,
    'expiryMonths', l.expiry_months, 'expiryOn', l.expiry_on, 'lot', case when l.owner_id = p_viewer then l.lot else null end,
    'qty', l.qty, 'qtyUnit', l.qty_unit, 'city', l.city, 'district', l.district, 'image', l.image, 'note', l.note, 'status', l.status, 'rejectReason', l.reject_reason,
    'images', to_jsonb(coalesce(l.images, '{}'::text[])), 'video', l.video, 'description', l.description, 'address', l.address, 'lat', l.lat, 'lng', l.lng,
    'liveVerified', l.live_verified and l.status = 'published', 'verificationCode', case when l.owner_id = p_viewer then l.verification_code else null end,
    'p0', case when l.owner_id = p_viewer then coalesce(l.p0, '{}'::jsonb) else '{}'::jsonb end,
    'seller', coalesce((select full_name from public.profiles where id = l.owner_id), 'Doktor'), 'createdAt', l.created_at, 'updatedAt', l.updated_at, 'mine', l.owner_id = p_viewer)
  || case when l.owner_id = p_viewer then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram,
      'interestCount', (select count(*) from public.surplus_interests i where i.listing_id = l.id and i.status <> 'bekor')) else '{}'::jsonb end
$$;

create or replace function public.sh_surplus_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.surplus_listings; t public.video_tokens;
  v_phone text := private.phone9(p_data->>'phone');
  v_price bigint := nullif(p_data->>'price', '')::bigint;
  v_new bigint := nullif(p_data->>'newPrice', '')::bigint;
  v_exp int := nullif(p_data->>'expiryMonths', '')::int;
  v_images text[] := case when jsonb_typeof(p_data->'images') = 'array'
    then array(select left(btrim(x), 400) from jsonb_array_elements_text(p_data->'images') x where btrim(x) <> '' limit 8) else '{}'::text[] end;
  v_video text := nullif(left(btrim(coalesce(p_data->>'video', '')), 400), '');
  v_desc text := nullif(left(btrim(coalesce(p_data->>'description', '')), 2000), '');
  v_addr text := nullif(left(btrim(coalesce(p_data->>'address', '')), 200), '');
  v_lat double precision := nullif(p_data->>'lat', '')::double precision;
  v_lng double precision := nullif(p_data->>'lng', '')::double precision;
  v_lot text := upper(left(btrim(coalesce(p_data->>'lot', '')), 30));
  v_qty int := nullif(p_data->>'qty', '')::int;
  v_unit text := p_data->>'qtyUnit';
  v_exp_on date := nullif(p_data->>'expiryOn', '')::date;
  v_token uuid := nullif(p_data->'videoMeta'->>'tokenId', '')::uuid;
  v_blob text := lower(coalesce(p_data->>'name', '') || ' ' || coalesce(p_data->>'brand', '') || ' ' || coalesce(p_data->>'category', ''));
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if v_blob ~ '(anestez|articain|ubistesin|ultracain|lidocain|karpula|carpule|septanest|scandonest|mepivacain|antibiot)'
     or coalesce(p_data->>'category', '') = 'anesteziya' then
    raise exception 'drug_banned';
  end if;
  if coalesce(p_data->>'pkg', '') = 'ochilgan' then raise exception 'val_invalid'; end if;
  if v_exp_on is null or v_exp_on < ((now() at time zone 'Asia/Tashkent')::date + 60) then raise exception 'val_invalid'; end if;
  if v_lot !~ '^[A-Z0-9][A-Z0-9._-]{1,29}$' then raise exception 'val_invalid'; end if;
  if v_qty is null or v_qty < 1 or v_qty > 999 then raise exception 'val_invalid'; end if;
  if v_unit not in ('dona', 'shprits', 'quti', 'toplam', 'ml', 'g') then raise exception 'val_invalid'; end if;
  if coalesce(p_data->>'declaration', '') is distinct from 'true' then raise exception 'val_invalid'; end if;
  if v_video is null or v_token is null then raise exception 'video_rejected'; end if;
  select * into t from public.video_tokens where id = v_token and user_id = p_user and used_at is not null;
  if t.id is null or t.video_url is distinct from v_video then raise exception 'video_rejected'; end if;
  if t.mobile and t.capture_source = 'desktop_file' then raise exception 'video_rejected'; end if;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or v_price is null or v_price < 1
     or v_exp is null or v_exp < 1 or v_exp > 120 or coalesce(p_data->>'pkg', '') <> 'yopiq'
     or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 or char_length(v_phone) <> 9
     or char_length(btrim(coalesce(p_data->>'note', ''))) < 12
     or coalesce(p_data->>'category', '') not in ('kompozit','bonding','sement','endodontiya','implantlar','borlar','instrument','ortodontiya')
     or (v_lat is null) <> (v_lng is null) or (v_lat is not null and (v_lat not between -90 and 90 or v_lng not between -180 and 180)) then
    raise exception 'val_invalid';
  end if;
  if p_id is null then
    if (select count(*) from public.surplus_listings where owner_id = p_user and created_at > now() - interval '1 day') >= 3
       or (select count(*) from public.surplus_listings where owner_id = p_user and status in ('pending', 'published')) >= 30 then raise exception 'lim_reached'; end if;
    insert into public.surplus_listings (owner_id, name, brand, category, price, new_price, pkg, expiry_months, city, district, phone, telegram, image, note, status,
      images, video, description, address, lat, lng, lot, qty, qty_unit, expiry_on, live_verified, verification_code, p0)
    values (p_user, left(btrim(p_data->>'name'), 100), left(coalesce(nullif(btrim(coalesce(p_data->>'brand', '')), ''), 'Boshqa'), 60), p_data->>'category', v_price, v_new, 'yopiq', v_exp,
      left(btrim(p_data->>'city'), 60), nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), v_phone,
      nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), nullif(btrim(coalesce(p_data->>'image', '')), ''),
      left(btrim(p_data->>'note'), 600), 'pending', v_images, v_video, v_desc, v_addr, v_lat, v_lng,
      v_lot, v_qty, v_unit, v_exp_on, t.live_verified, t.code, coalesce(p_data->'p0', '{}'::jsonb))
    returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Yangi ortiqcha material', left(l.name, 60) || ' · jonli video tekshiruvi', '/admin/moderatsiya');
    perform private.notify(p_user, 'surplus_pending', 'E’loningiz moderatsiyada', left(l.name, 60) || ' · tasdiqlanguncha ko‘rinmaydi.', '/ortiqcha-material/elonlarim', null);
  else
    select * into l from public.surplus_listings where id = p_id and owner_id = p_user for update;
    if l.id is null then raise exception 'req_notfound'; end if;
    update public.surplus_listings set name = left(btrim(p_data->>'name'), 100), brand = left(coalesce(nullif(btrim(coalesce(p_data->>'brand', '')), ''), 'Boshqa'), 60),
      category = p_data->>'category', price = v_price, new_price = v_new, pkg = 'yopiq', expiry_months = v_exp,
      city = left(btrim(p_data->>'city'), 60), district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), phone = v_phone,
      telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), image = nullif(btrim(coalesce(p_data->>'image', '')), ''),
      note = left(btrim(p_data->>'note'), 600), images = v_images, video = v_video, description = v_desc, address = v_addr, lat = v_lat, lng = v_lng,
      lot = v_lot, qty = v_qty, qty_unit = v_unit, expiry_on = v_exp_on, live_verified = t.live_verified, verification_code = t.code,
      p0 = coalesce(p_data->'p0', p0), status = 'pending', reject_reason = null, updated_at = now()
      where id = l.id returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Material yangilandi', left(l.name, 60) || ' · qayta tekshiruv', '/admin/moderatsiya');
  end if;
  return private.surplus_json(l, p_user);
end $$;

create or replace function public.sh_reveal_phone(p_secret text, p_user uuid, p_kind text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_phone text; n int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select count(*) into n from public.phone_reveals where viewer_id = p_user and created_at > now() - interval '1 day';
  if n >= 30 then raise exception 'lim_reached'; end if;
  if p_kind = 'master' then
    select private.phone_fmt(phone) into v_phone from public.masters where id = p_id and status = 'published';
  elsif p_kind = 'lab' then
    select private.phone_fmt(phone) into v_phone from public.labs where id = p_id and status = 'published';
  elsif p_kind = 'job' then
    select private.phone_fmt(phone) into v_phone from public.jobs where id = p_id and status = 'published';
  elsif p_kind = 'classified' then
    select private.phone_fmt(phone) into v_phone from public.classifieds where id = p_id and status = 'published';
  elsif p_kind = 'surplus' then
    select private.phone_fmt(phone) into v_phone from public.surplus_listings where id = p_id and status = 'published';
  else
    raise exception 'val_invalid';
  end if;
  if v_phone is null or char_length(v_phone) < 6 then return jsonb_build_object('phone', null); end if;
  insert into public.phone_reveals (viewer_id, kind, target_id) values (p_user, p_kind, p_id);
  return jsonb_build_object('phone', v_phone);
end $$;
revoke all on function public.sh_reveal_phone(text, uuid, text, uuid) from public;
grant execute on function public.sh_reveal_phone(text, uuid, text, uuid) to anon, authenticated, service_role;

create or replace function public.sh_content_report(p_secret text, p_user uuid, p_kind text, p_id uuid, p_reason text, p_serious boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_kind not in ('master', 'lab', 'job', 'classified', 'surplus', 'post') then raise exception 'val_invalid'; end if;
  select count(*) into n from public.content_reports where reporter_id = p_user and created_at > now() - interval '1 day';
  if n >= 10 then raise exception 'lim_reached'; end if;
  insert into public.content_reports (reporter_id, kind, target_id, reason, serious)
  values (p_user, p_kind, p_id, left(btrim(coalesce(p_reason, 'boshqa')), 80), coalesce(p_serious, false))
  on conflict (reporter_id, kind, target_id) do update set reason = excluded.reason, serious = excluded.serious;
  select count(*) into n from public.content_reports where kind = p_kind and target_id = p_id;
  if coalesce(p_serious, false) or n >= 3 then
    if p_kind = 'surplus' then update public.surplus_listings set status = 'hidden', updated_at = now() where id = p_id and status = 'published'; end if;
    if p_kind = 'master' then update public.masters set status = 'hidden', updated_at = now() where id = p_id and status = 'published'; end if;
    if p_kind = 'lab' then update public.labs set status = 'hidden', updated_at = now() where id = p_id and status = 'published'; end if;
    if p_kind = 'job' then update public.jobs set status = 'hidden', updated_at = now() where id = p_id and status = 'published'; end if;
    if p_kind = 'classified' then update public.classifieds set status = 'hidden', updated_at = now() where id = p_id and status = 'published'; end if;
  end if;
  return jsonb_build_object('ok', true, 'hidden', coalesce(p_serious, false) or n >= 3);
end $$;
revoke all on function public.sh_content_report(text, uuid, text, uuid, text, boolean) from public;
grant execute on function public.sh_content_report(text, uuid, text, uuid, text, boolean) to anon, authenticated, service_role;
