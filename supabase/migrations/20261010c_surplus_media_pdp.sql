-- 20261010c: Ortiqcha material — full product page: gallery, video, description, pickup location; single-listing read.
alter table public.surplus_listings
  add column if not exists images text[] not null default '{}' check (cardinality(images) <= 8),
  add column if not exists video text check (video is null or char_length(video) <= 400),
  add column if not exists description text check (description is null or char_length(description) <= 2000),
  add column if not exists address text check (address is null or char_length(address) <= 200),
  add column if not exists lat double precision check (lat is null or lat between -90 and 90),
  add column if not exists lng double precision check (lng is null or lng between -180 and 180);

create or replace function private.surplus_json(l public.surplus_listings, p_viewer uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'name', l.name, 'brand', l.brand, 'category', l.category, 'price', l.price, 'newPrice', l.new_price, 'pkg', l.pkg,
    'expiryMonths', l.expiry_months, 'city', l.city, 'district', l.district, 'image', l.image, 'note', l.note, 'status', l.status, 'rejectReason', l.reject_reason,
    'images', to_jsonb(coalesce(l.images, '{}'::text[])), 'video', l.video, 'description', l.description, 'address', l.address, 'lat', l.lat, 'lng', l.lng,
    'seller', coalesce((select full_name from public.profiles where id = l.owner_id), 'Doktor'), 'createdAt', l.created_at, 'updatedAt', l.updated_at, 'mine', l.owner_id = p_viewer)
  || case when l.owner_id = p_viewer then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram,
      'interestCount', (select count(*) from public.surplus_interests i where i.listing_id = l.id and i.status <> 'bekor')) else '{}'::jsonb end
$$;

/** One listing for the product page: published for everyone, any state for its owner. */
create or replace function public.sh_surplus_get(p_secret text, p_id uuid, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.surplus_listings;
begin
  perform private.assert_secret(p_secret);
  select * into l from public.surplus_listings where id = p_id and (status = 'published' or (p_viewer is not null and owner_id = p_viewer));
  if l.id is null then return null; end if;
  return private.surplus_json(l, p_viewer);
end $$;

create or replace function public.sh_surplus_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.surplus_listings; v_phone text := private.phone9(p_data->>'phone'); v_price bigint := nullif(p_data->>'price', '')::bigint; v_new bigint := nullif(p_data->>'newPrice', '')::bigint;
  v_exp int := nullif(p_data->>'expiryMonths', '')::int;
  v_images text[] := case when jsonb_typeof(p_data->'images') = 'array'
    then array(select left(btrim(x), 400) from jsonb_array_elements_text(p_data->'images') x where btrim(x) <> '' limit 8) else '{}'::text[] end;
  v_video text := nullif(left(btrim(coalesce(p_data->>'video', '')), 400), '');
  v_desc text := nullif(left(btrim(coalesce(p_data->>'description', '')), 2000), '');
  v_addr text := nullif(left(btrim(coalesce(p_data->>'address', '')), 200), '');
  v_lat double precision := nullif(p_data->>'lat', '')::double precision;
  v_lng double precision := nullif(p_data->>'lng', '')::double precision;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(btrim(coalesce(p_data->>'brand', ''))) < 1 or v_price is null or v_price < 1
     or v_exp is null or v_exp < 1 or v_exp > 120 or coalesce(p_data->>'pkg', '') not in ('yopiq', 'ochilgan') or char_length(btrim(coalesce(p_data->>'city', ''))) < 2
     or char_length(v_phone) <> 9 or char_length(btrim(coalesce(p_data->>'note', ''))) < 12
     or coalesce(p_data->>'category', '') not in ('kompozit','bonding','sement','endodontiya','implantlar','anesteziya','borlar','instrument','ortodontiya')
     or (v_lat is null) <> (v_lng is null) or (v_lat is not null and (v_lat not between -90 and 90 or v_lng not between -180 and 180)) then
    raise exception 'val_invalid';
  end if;
  if p_id is null then
    if (select count(*) from public.surplus_listings where owner_id = p_user and created_at > now() - interval '1 day') >= 10
       or (select count(*) from public.surplus_listings where owner_id = p_user and status in ('pending', 'published')) >= 30 then raise exception 'lim_reached'; end if;
    if exists (select 1 from public.surplus_listings where owner_id = p_user and status in ('pending', 'published', 'hidden') and lower(btrim(name)) = lower(btrim(p_data->>'name')) and lower(btrim(brand)) = lower(btrim(p_data->>'brand')) and price = v_price) then raise exception 'listing_duplicate'; end if;
    insert into public.surplus_listings (owner_id, name, brand, category, price, new_price, pkg, expiry_months, city, district, phone, telegram, image, note, status,
      images, video, description, address, lat, lng)
    values (p_user, left(btrim(p_data->>'name'), 100), left(btrim(p_data->>'brand'), 60), p_data->>'category', v_price, v_new, p_data->>'pkg', v_exp, left(btrim(p_data->>'city'), 60),
      nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      nullif(btrim(coalesce(p_data->>'image', '')), ''), left(btrim(p_data->>'note'), 600), 'pending',
      v_images, v_video, v_desc, v_addr, v_lat, v_lng) returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Yangi ortiqcha material e’loni', left(l.name, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'surplus_pending', 'E’loningiz moderatsiyada', left(l.name, 60) || ' · admin tasdiqlagach hamma ko‘radi.', '/ortiqcha-material/elonlarim', null);
  else
    select * into l from public.surplus_listings where id = p_id and owner_id = p_user for update;
    if l.id is null then raise exception 'req_notfound'; end if;
    update public.surplus_listings set name = left(btrim(p_data->>'name'), 100), brand = left(btrim(p_data->>'brand'), 60), category = p_data->>'category', price = v_price, new_price = v_new,
      pkg = p_data->>'pkg', expiry_months = v_exp, city = left(btrim(p_data->>'city'), 60), district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), phone = v_phone,
      telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), image = nullif(btrim(coalesce(p_data->>'image', '')), ''), note = left(btrim(p_data->>'note'), 600),
      images = v_images, video = v_video, description = v_desc, address = v_addr, lat = v_lat, lng = v_lng,
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end, updated_at = now()
      where id = l.id returning * into l;
    if l.status = 'pending' then perform private.sem_notify_admins('moderation_new', 'E’lon yangilandi', left(l.name, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya'); end if;
  end if;
  return private.surplus_json(l, p_user);
end $$;

revoke all on function public.sh_surplus_get(text, uuid, uuid) from public;
grant execute on function public.sh_surplus_get(text, uuid, uuid) to anon, authenticated, service_role;
