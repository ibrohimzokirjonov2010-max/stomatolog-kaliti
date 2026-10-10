-- Laboratoriya v2 (mobile redesign): gallery/video/logo, district, experience, courier, portfolio, price list,
-- admin-only verified flag, owner online flag. All optional: the UI shows neutral states when empty.

alter table public.labs add column if not exists district text check (district is null or char_length(district) <= 60);
alter table public.labs add column if not exists photos text[] not null default '{}' check (cardinality(photos) <= 12);
alter table public.labs add column if not exists video text check (video is null or char_length(video) <= 400);
alter table public.labs add column if not exists logo text check (logo is null or char_length(logo) <= 400);
alter table public.labs add column if not exists years int check (years is null or (years >= 0 and years <= 60));
alter table public.labs add column if not exists courier text check (courier is null or courier in ('ha', 'yoq'));
alter table public.labs add column if not exists courier_area text check (courier_area is null or char_length(courier_area) <= 60);
alter table public.labs add column if not exists portfolio text[] not null default '{}' check (cardinality(portfolio) <= 24);
alter table public.labs add column if not exists price_items jsonb not null default '[]'::jsonb
  check (jsonb_typeof(price_items) = 'array' and jsonb_array_length(price_items) <= 30);
-- Set by admins only (never by sh_lab_save).
alter table public.labs add column if not exists verified boolean not null default false;

create or replace function private.lab_json(l public.labs, p_full boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'name', l.name, 'city', l.city, 'services', to_jsonb(l.services), 'materials', to_jsonb(l.materials),
    'description', l.description, 'days', l.days, 'priceFrom', l.price_from, 'photo', l.photo, 'status', l.status, 'createdAt', l.created_at,
    'district', l.district, 'photos', to_jsonb(coalesce(l.photos, '{}')), 'video', l.video, 'logo', l.logo, 'years', l.years,
    'courier', l.courier, 'courierArea', l.courier_area, 'portfolio', to_jsonb(coalesce(l.portfolio, '{}')), 'priceItems', coalesce(l.price_items, '[]'::jsonb),
    'verified', l.verified,
    'online', coalesce((select p.last_seen_at > now() - interval '5 minutes' from public.profiles p where p.id = l.owner_id), false),
    'lastSeen', (select p.last_seen_at from public.profiles p where p.id = l.owner_id),
    'done', (select count(*) from public.lab_orders o where o.lab_id = l.id and o.status = 'yetkazildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram, 'rejectReason', l.reject_reason) else '{}'::jsonb end
$$;

create or replace function public.sh_lab_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs; v_phone text := private.phone9(p_data->>'phone'); v_services text[]; v_materials text[];
  v_photos text[]; v_portfolio text[]; v_items jsonb; v_years int; v_courier text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x;
  select coalesce(array_agg(x), '{}') into v_materials from jsonb_array_elements_text(coalesce(p_data->'materials', '[]'::jsonb)) x;
  select coalesce(array_agg(left(x, 400)), '{}') into v_photos from (select x from jsonb_array_elements_text(coalesce(p_data->'photos', '[]'::jsonb)) x where btrim(x) <> '' limit 12) q;
  select coalesce(array_agg(left(x, 400)), '{}') into v_portfolio from (select x from jsonb_array_elements_text(coalesce(p_data->'portfolio', '[]'::jsonb)) x where btrim(x) <> '' limit 24) q;
  v_items := case when jsonb_typeof(p_data->'priceItems') = 'array' then p_data->'priceItems' else '[]'::jsonb end;
  if jsonb_array_length(v_items) > 30 or pg_column_size(v_items) > 60000 then raise exception 'val_invalid'; end if;
  v_years := nullif(p_data->>'years', '')::int;
  v_courier := case when p_data->>'courier' in ('ha', 'yoq') then p_data->>'courier' else null end;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or cardinality(v_services) < 1 or char_length(v_phone) <> 9
     or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 then raise exception 'val_invalid'; end if;
  select * into l from public.labs where owner_id = p_user for update;
  if l.id is null then
    insert into public.labs (owner_id, name, city, services, materials, description, days, price_from, photo, phone, telegram, status,
      district, photos, video, logo, years, courier, courier_area, portfolio, price_items)
    values (p_user, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'city'), 60), v_services, v_materials,
      nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), nullif(p_data->>'days', '')::int, nullif(p_data->>'priceFrom', '')::bigint,
      nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), 'pending',
      nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), v_photos, nullif(btrim(coalesce(p_data->>'video', '')), ''),
      nullif(btrim(coalesce(p_data->>'logo', '')), ''), v_years, v_courier, nullif(left(btrim(coalesce(p_data->>'courierArea', '')), 60), ''), v_portfolio, v_items)
    returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Yangi laboratoriya profili', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'lab_pending', 'Laboratoriya profilingiz moderatsiyada', 'Admin tasdiqlagach katalogda ko‘rinadi.', '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  else
    update public.labs set name = left(btrim(p_data->>'name'), 80), city = left(btrim(p_data->>'city'), 60), services = v_services, materials = v_materials,
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), days = nullif(p_data->>'days', '')::int, price_from = nullif(p_data->>'priceFrom', '')::bigint,
      photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''), phone = v_phone, telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), photos = v_photos, video = nullif(btrim(coalesce(p_data->>'video', '')), ''),
      logo = nullif(btrim(coalesce(p_data->>'logo', '')), ''), years = v_years, courier = v_courier,
      courier_area = nullif(left(btrim(coalesce(p_data->>'courierArea', '')), 60), ''), portfolio = v_portfolio, price_items = v_items,
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end,
      updated_at = now() where id = l.id returning * into l;
    if l.status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Laboratoriya profili yangilandi', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.lab_json(l, true);
end $$;
