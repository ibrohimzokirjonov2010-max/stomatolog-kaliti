-- Courier details on orders: last known courier location (map link and/or coordinates) + admin can set courier fields.
alter table public.orders add column if not exists courier_location_url text check (courier_location_url is null or char_length(courier_location_url) <= 500);
alter table public.orders add column if not exists courier_lat double precision check (courier_lat is null or courier_lat between -90 and 90);
alter table public.orders add column if not exists courier_lng double precision check (courier_lng is null or courier_lng between -180 and 180);
alter table public.orders add column if not exists courier_location_at timestamptz;

create or replace function private.order_json(o public.orders)
 returns jsonb language sql stable set search_path to ''
as $function$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', o.id, 'createdAt', o.created_at, 'name', o.name, 'phone', o.phone, 'city', o.city,
    'address', o.address, 'note', o.note, 'payment', o.payment, 'total', o.total, 'commission', o.commission,
    'bonusUsed', o.bonus_used, 'payable', o.total - o.bonus_used,
    'status', o.status, 'statusHistory', o.status_history, 'paymentState', o.payment_state,
    'shopId', o.shop_id, 'shopName', o.shop_name, 'confirmedAt', o.confirmed_at, 'paidAt', o.paid_at,
    'yandexTrackUrl', o.yandex_track_url, 'courierName', o.courier_name, 'courierPhone', o.courier_phone,
    'carInfo', o.car_info,
    'courierLocationUrl', o.courier_location_url, 'courierLat', o.courier_lat, 'courierLng', o.courier_lng,
    'courierLocationAt', o.courier_location_at,
    'dispute', (select jsonb_build_object('id', d.id, 'reason', d.reason, 'status', d.status, 'resolution', d.resolution, 'createdAt', d.created_at)
                from public.disputes d where d.order_id = o.id order by d.created_at desc limit 1),
    'items', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'productId', i.product_id, 'name', i.name, 'brand', i.brand, 'image', i.image, 'qty', i.qty,
        'price', i.price, 'size', i.size, 'color', i.color, 'category', i.category, 'source', i.source,
        'expiryMonths', i.expiry_months, 'shopName', i.shop_name, 'shopSlug', i.shop_slug, 'shopId', i.store_id)) order by i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)))
$function$;

-- Applies courier fields from p_track. Location keys are only touched when 'location' is present (old clients keep working).
create or replace function private.apply_courier(p_order text, p_track jsonb)
 returns public.orders language plpgsql set search_path to ''
as $function$
declare o public.orders; v_url text; v_lat double precision; v_lng double precision;
begin
  update public.orders set yandex_track_url = nullif(trim(p_track->>'yandexTrackUrl'), ''),
    courier_name = nullif(left(trim(coalesce(p_track->>'courierName','')), 80), ''),
    courier_phone = nullif(left(trim(coalesce(p_track->>'courierPhone','')), 40), ''),
    car_info = nullif(left(trim(coalesce(p_track->>'carInfo','')), 80), ''), updated_at = now()
  where id = p_order returning * into o;
  if p_track ? 'location' then
    v_url := nullif(left(trim(coalesce(p_track->'location'->>'url','')), 500), '');
    if v_url is not null and v_url !~* '^https://' then v_url := null; end if;
    v_lat := case when (p_track->'location'->>'lat') ~ '^-?\d{1,2}(\.\d+)?$' then (p_track->'location'->>'lat')::double precision end;
    v_lng := case when (p_track->'location'->>'lng') ~ '^-?\d{1,3}(\.\d+)?$' then (p_track->'location'->>'lng')::double precision end;
    if v_lat is null or v_lng is null or v_lat not between -90 and 90 or v_lng not between -180 and 180 then v_lat := null; v_lng := null; end if;
    if (v_url, v_lat, v_lng) is distinct from (o.courier_location_url, o.courier_lat, o.courier_lng) then
      update public.orders set courier_location_url = v_url, courier_lat = v_lat, courier_lng = v_lng,
        courier_location_at = case when v_url is null and v_lat is null then null else now() end
      where id = p_order returning * into o;
    end if;
  end if;
  return o;
end $function$;
revoke all on function private.apply_courier(text, jsonb) from public, anon, authenticated;

create or replace function public.sh_seller_order_update(p_secret text, p_user uuid, p_order text, p_action text, p_track jsonb)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare o public.orders; v_store uuid; v_next text; v_note text; v_url text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select id into v_store from public.stores where owner_id = p_user and status = 'active';
  select * into o from public.orders where id = p_order;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_store is null or not exists (select 1 from public.order_items where order_id = p_order and store_id = v_store) then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if o.payment_state = 'refunded' then return jsonb_build_object('error', 'refunded'); end if;

  if p_action = 'track' then
    v_url := nullif(trim(p_track->>'yandexTrackUrl'), '');
    o := private.apply_courier(p_order, p_track);
    if coalesce((p_track->>'advance')::boolean, false) and v_url is not null and o.status in ('yigilmoqda','yigish_tugadi') then
      update public.orders set status = 'yolda', status_changed_at = now(),
        status_history = status_history || jsonb_build_array(jsonb_build_object('status','yolda','at',now(),'note','Yandex Taxi orqali jo‘natildi'))
      where id = p_order returning * into o;
    end if;
    return jsonb_build_object('order', private.order_json(o));
  end if;

  v_next := case o.status when 'pending_accept' then 'qabul_qilindi' when 'qabul_qilindi' then 'yigilmoqda'
    when 'yigilmoqda' then 'yigish_tugadi' when 'yigish_tugadi' then 'yolda' when 'yolda' then 'yetkazildi' end;
  if v_next is null then return jsonb_build_object('error', 'done'); end if;
  v_note := case v_next when 'qabul_qilindi' then 'Sotuvchi qabul qildi' when 'yigilmoqda' then 'Yig‘ish boshlandi'
    when 'yigish_tugadi' then 'Yig‘ish tugallandi' when 'yolda' then 'Jo‘natildi' else 'Yetkazib berildi' end;
  update public.orders set status = v_next, status_changed_at = now(), updated_at = now(),
    status_history = status_history || jsonb_build_array(jsonb_build_object('status', v_next, 'at', now(), 'note', v_note))
  where id = p_order returning * into o;
  if v_next = 'yetkazildi' and o.payment = 'naqd' and o.paid_at is null then
    update public.orders set paid_at = now(), payment_state = 'escrow_held' where id = p_order returning * into o;
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note)
    values (p_order, o.shop_id, 'hold', o.total - o.bonus_used, p_user, 'Naqd to‘lov yetkazishda qabul qilindi (demo)');
  end if;
  return jsonb_build_object('order', private.order_json(o));
end $function$;

create or replace function public.sh_admin_order_courier(p_secret text, p_admin uuid, p_order text, p_track jsonb)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare o public.orders;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','finance']);
  select * into o from public.orders where id = p_order;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if o.payment_state = 'refunded' then return jsonb_build_object('error', 'refunded'); end if;
  o := private.apply_courier(p_order, p_track - 'advance');
  perform private.audit(p_admin, 'order.courier', 'order', p_order,
    jsonb_build_object('courierName', o.courier_name, 'courierPhone', o.courier_phone, 'hasLocation', o.courier_lat is not null or o.courier_location_url is not null));
  return jsonb_build_object('order', private.order_json(o));
end $function$;
revoke execute on function public.sh_admin_order_courier(text, uuid, text, jsonb) from public;
grant execute on function public.sh_admin_order_courier(text, uuid, text, jsonb) to anon, authenticated, service_role;
