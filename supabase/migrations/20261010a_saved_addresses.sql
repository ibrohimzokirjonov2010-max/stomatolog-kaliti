-- Saved delivery places (Uy, 2-filial, ...) per user, for checkout "Aniq manzil".
create table if not exists public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  city text,
  district text,
  address text not null check (char_length(address) between 1 and 300),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saved_addresses_user_idx on public.saved_addresses (user_id, created_at);
alter table public.saved_addresses enable row level security;
revoke all on public.saved_addresses from anon, authenticated;

create or replace function private.saved_address_json(a public.saved_addresses)
 returns jsonb language sql stable set search_path to '' as $function$
  select jsonb_build_object('id', a.id, 'label', a.label, 'city', a.city, 'district', a.district,
    'address', a.address, 'lat', a.lat, 'lng', a.lng, 'createdAt', a.created_at)
$function$;

create or replace function public.sh_saved_addresses(p_secret text, p_user uuid)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.saved_address_json(a) order by a.created_at)
    from public.saved_addresses a where a.user_id = p_user), '[]'::jsonb);
end
$function$;

create or replace function public.sh_saved_address_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  v_label text := left(btrim(coalesce(p_data->>'label', '')), 40);
  v_addr text := left(btrim(coalesce(p_data->>'address', '')), 300);
  v_city text := nullif(left(btrim(coalesce(p_data->>'city', '')), 60), '');
  v_district text := nullif(left(btrim(coalesce(p_data->>'district', '')), 120), '');
  v_lat double precision := nullif(p_data->>'lat', '')::double precision;
  v_lng double precision := nullif(p_data->>'lng', '')::double precision;
  a public.saved_addresses;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if v_label = '' or v_addr = '' or (v_lat is not null and (v_lat < -90 or v_lat > 90)) or (v_lng is not null and (v_lng < -180 or v_lng > 180)) then
    raise exception 'val_invalid';
  end if;
  if p_id is null then
    if (select count(*) from public.saved_addresses where user_id = p_user) >= 20 then raise exception 'lim_reached'; end if;
    insert into public.saved_addresses (user_id, label, city, district, address, lat, lng)
      values (p_user, v_label, v_city, v_district, v_addr, v_lat, v_lng) returning * into a;
  else
    update public.saved_addresses set label = v_label, city = v_city, district = v_district, address = v_addr,
      lat = v_lat, lng = v_lng, updated_at = now()
      where id = p_id and user_id = p_user returning * into a;
    if a.id is null then raise exception 'req_notfound'; end if;
  end if;
  return private.saved_address_json(a);
end
$function$;

create or replace function public.sh_saved_address_delete(p_secret text, p_user uuid, p_id uuid)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
begin
  perform private.assert_secret(p_secret);
  delete from public.saved_addresses where id = p_id and user_id = p_user;
  return jsonb_build_object('ok', true);
end
$function$;

revoke all on function private.saved_address_json(public.saved_addresses) from public, anon, authenticated;
revoke execute on function public.sh_saved_addresses, public.sh_saved_address_save, public.sh_saved_address_delete from public;
grant execute on function public.sh_saved_addresses, public.sh_saved_address_save, public.sh_saved_address_delete to anon, authenticated;
