-- Seller stats, shop scope, commission, unpaid cash GMV, admin products, marketing leads.
-- Delivery lines are not products and must not attach an order to the platform store.

create or replace function private.is_delivery_line(p_product text, p_name text)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_product, '') = 'delivery-fee' or coalesce(p_name, '') = 'Yetkazib berish'
$$;
revoke all on function private.is_delivery_line(text, text) from public, anon, authenticated;

create or replace function private.seller_store_id(p_user uuid)
returns uuid language sql stable set search_path = '' as $$
  select s.id from public.stores s
  where s.owner_id = p_user and coalesce(s.is_platform, false) = false
  order by (s.status = 'active') desc, s.created_at desc
  limit 1
$$;
revoke all on function private.seller_store_id(uuid) from public, anon, authenticated;

-- Real shops stuck at 0% use the same 12% the order snapshot already uses. Platform stays 0.
update public.stores
set commission_rate = private.marketplace_commission_rate()
where coalesce(is_platform, false) = false and commission_rate = 0;

-- Detach existing delivery rows from whichever store they were filed under.
update public.order_items
set store_id = null, commission_rate = 0
where private.is_delivery_line(product_id, name);

create or replace function public.sh_my_orders(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store uuid := private.seller_store_id(p_user);
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'buyer', coalesce((select jsonb_agg(private.order_json(o) order by o.created_at desc)
                       from (select * from public.orders where buyer_id = p_user order by created_at desc limit 100) o), '[]'::jsonb),
    'seller', coalesce((select jsonb_agg(private.order_json(o) order by o.created_at desc)
                        from (select * from public.orders o2
                              where v_store is not null and exists (
                                select 1 from public.order_items i
                                where i.order_id = o2.id and i.store_id = v_store
                                  and not private.is_delivery_line(i.product_id, i.name))
                              order by created_at desc limit 200) o), '[]'::jsonb),
    'shopId', v_store);
end $$;

create or replace function public.sh_seller_finance(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_released bigint; v_comm bigint; v_reserved bigint; v_held bigint; v_held_comm bigint; v_held_n int; v_unseen int;
  v_rate numeric;
begin
  perform private.assert_secret(p_secret);
  select * into v_store from public.stores where id = private.seller_store_id(p_user);
  if v_store.id is null then return jsonb_build_object('error', 'no_store'); end if;
  v_rate := case when v_store.commission_rate > 0 then v_store.commission_rate else private.marketplace_commission_rate() end;
  select coalesce(sum(amount) filter (where kind = 'release'), 0), coalesce(sum(amount) filter (where kind = 'commission'), 0)
    into v_released, v_comm from public.escrow_ledger where store_id = v_store.id;
  select coalesce(sum(amount), 0) into v_reserved from public.payout_requests where store_id = v_store.id and status in ('pending','paid');
  select coalesce(sum(i.price * i.qty), 0),
         coalesce(sum(round(i.price * i.qty * coalesce(nullif(i.commission_rate, 0), v_rate) / 100.0)), 0),
         count(distinct o.id)
    into v_held, v_held_comm, v_held_n
    from public.order_items i join public.orders o on o.id = i.order_id
    where i.store_id = v_store.id
      and not private.is_delivery_line(i.product_id, i.name)
      and o.payment_state in ('escrow_held', 'awaiting_payment');
  select count(*) into v_unseen from public.payout_requests where store_id = v_store.id and status <> 'pending' and seller_seen_at is null;
  return jsonb_build_object(
    'commissionRate', v_rate,
    'released', v_released, 'commission', v_comm, 'reserved', v_reserved,
    'balance', greatest(v_released - v_reserved, 0),
    'held', v_held - v_held_comm, 'heldGross', v_held, 'heldCommission', v_held_comm, 'heldOrders', v_held_n,
    'payoutsUnseen', v_unseen,
    'ledger', coalesce((select jsonb_agg(x order by x->>'createdAt' desc) from (
        select jsonb_build_object('id', l.id, 'orderId', l.order_id, 'kind', l.kind, 'amount', l.amount,
          'createdAt', l.created_at, 'payment', o.payment) x
        from public.escrow_ledger l left join public.orders o on o.id = l.order_id
        where l.store_id = v_store.id and l.kind in ('release','commission')
        order by l.created_at desc limit 500) t), '[]'::jsonb),
    'payouts', coalesce((select jsonb_agg(private.payout_json(p) order by p.created_at desc)
        from (select * from public.payout_requests where store_id = v_store.id order by created_at desc limit 50) p), '[]'::jsonb));
end $$;

-- New orders: a delivery line has no store and no commission, so it cannot pull another shop into this cabinet.
create or replace function public.sh_create_order(p_secret text, p_user uuid, p_order jsonb, p_items jsonb, p_use_bonus boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id text; it jsonb; v_prod public.products; v_store public.stores; v_total bigint := 0; v_comm bigint := 0;
  v_price bigint; v_qty int; v_first_store uuid; v_first_name text; o public.orders; v_paid boolean; v_shop_name text; v_shop_slug text;
  v_eligible bigint := 0; v_rules jsonb := private.bonus_rules(); v_bonus bigint := 0; v_left bigint; v_take bigint; g record; v_cat text;
  v_delivery boolean; v_rate numeric;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('error', 'empty');
  end if;
  if coalesce(p_order->>'payment', '') not in ('naqd') then
    return jsonb_build_object('error', 'payment');
  end if;
  if p_use_bonus then
    perform 1 from public.profiles where id = p_user for update;
  end if;
  v_id := 'SK-' || nextval('public.order_no_seq');
  v_paid := false;
  insert into public.orders (id, buyer_id, name, phone, city, address, note, payment, total, status, status_history, payment_state, paid_at)
  values (v_id, p_user, p_order->>'name', p_order->>'phone', coalesce(p_order->>'city',''), p_order->>'address',
    coalesce(p_order->>'note',''), 'naqd', 0, 'pending_accept',
    jsonb_build_array(jsonb_build_object('status','pending_accept','at', now(), 'note', 'Buyurtma yaratildi · Naqd pul')),
    'awaiting_payment', null);

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(coalesce((it->>'qty')::int, 1), 999));
    v_prod := null; v_store := null;
    v_delivery := private.is_delivery_line(it->>'productId', it->>'name') or coalesce(it->>'category', '') = 'yetkazish';
    if not v_delivery and (it->>'productId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select * into v_prod from public.products where id = (it->>'productId')::uuid;
      if v_prod.id is null then raise exception 'product_unavailable' using errcode = 'P0001'; end if;
      select * into v_store from public.stores where id = v_prod.store_id;
      if v_store.owner_id = p_user then raise exception 'own_product' using errcode = 'P0001'; end if;
      if v_store.status <> 'active' or not v_prod.active then raise exception 'product_unavailable' using errcode = 'P0001'; end if;
      if v_prod.stock < v_qty then raise exception 'out_of_stock' using errcode = 'P0001'; end if;
      update public.products set stock = stock - v_qty where id = v_prod.id;
    elsif not v_delivery then
      select * into v_store from public.stores where is_platform and status = 'active';
    end if;
    v_price := case when v_prod.id is not null then v_prod.price else greatest(coalesce((it->>'price')::bigint, 0), 0) end;
    v_cat := case when v_delivery then 'yetkazish' else coalesce(v_prod.category, it->>'category') end;
    v_rate := case when v_delivery or v_store.id is null then 0
      when coalesce(v_store.commission_rate, 0) > 0 then v_store.commission_rate
      when coalesce(v_store.is_platform, false) then 0
      else private.marketplace_commission_rate() end;
    v_shop_name := case
      when v_delivery then 'Yetkazib berish'
      when coalesce(v_store.is_platform, false) then coalesce(nullif(it->>'shopName',''), v_store.name)
      else coalesce(v_store.name, it->>'shopName') end;
    v_shop_slug := case
      when v_delivery then ''
      when coalesce(v_store.is_platform, false) then coalesce(nullif(it->>'shopSlug',''), v_store.slug)
      else coalesce(v_store.slug, it->>'shopSlug') end;
    insert into public.order_items (order_id, product_id, store_id, name, brand, image, qty, price, commission_rate,
      size, color, category, source, expiry_months, shop_name, shop_slug)
    values (v_id, it->>'productId', case when v_delivery then null else v_store.id end,
      coalesce(v_prod.name, it->>'name', 'Mahsulot'), coalesce(v_prod.brand, it->>'brand', ''),
      coalesce(v_prod.image, it->>'image'), v_qty, v_price, v_rate,
      nullif(it->>'size',''), nullif(it->>'color',''), v_cat, nullif(it->>'source',''),
      nullif(it->>'expiryMonths','')::int, v_shop_name, v_shop_slug);
    v_total := v_total + v_price * v_qty;
    if not v_delivery and v_store.id is not null and v_cat in ('materiallar', 'implantlar', 'asboblar') and (it->>'productId') not like 'surplus-%' then
      v_eligible := v_eligible + v_price * v_qty;
    end if;
    if not v_delivery then
      v_comm := v_comm + round(v_price * v_qty * v_rate / 100.0);
    end if;
    if not v_delivery and v_first_store is null and v_store.id is not null then v_first_store := v_store.id; v_first_name := v_shop_name; end if;
    if not v_delivery and v_first_name is null then v_first_name := nullif(it->>'shopName',''); end if;
  end loop;

  if p_use_bonus then
    if v_eligible <= 0 then raise exception 'bonus_min_order' using errcode = 'P0001'; end if;
    perform private.bonus_expire(p_user);
    v_left := least(private.bonus_balance(p_user), (v_rules->>'maxPerOrder')::bigint,
      floor(v_eligible * (v_rules->>'maxSharePercent')::int / 100.0)::bigint);
    if v_left <= 0 then raise exception 'bonus_empty' using errcode = 'P0001'; end if;
    for g in select b.id, b.amount + coalesce((select sum(x.amount) from public.bonus_ledger x where x.grant_id = b.id), 0) remaining
             from public.bonus_ledger b where b.user_id = p_user and b.kind = 'grant' and b.expires_at > now()
             order by b.expires_at, b.id loop
      exit when v_left <= 0;
      continue when g.remaining <= 0;
      v_take := least(g.remaining, v_left);
      insert into public.bonus_ledger (user_id, grant_id, kind, amount, order_id, note)
      values (p_user, g.id, 'spend', -v_take, v_id, 'Buyurtmada ishlatildi');
      v_bonus := v_bonus + v_take; v_left := v_left - v_take;
    end loop;
  end if;

  update public.orders set total = v_total, commission = v_comm, bonus_used = v_bonus, shop_id = v_first_store, shop_name = v_first_name,
    status_history = case when v_bonus > 0 then jsonb_set(status_history, '{0,note}',
      to_jsonb((status_history->0->>'note') || ' · bonus −' || v_bonus || ' so‘m')) else status_history end
  where id = v_id returning * into o;
  return jsonb_build_object('order', private.order_json(o));
end $$;

create or replace function private.period_kpis(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with d as (select r.* from generate_series(p_from, p_to, interval '1 day') g(day), lateral private.revenue_day(g.day::date) r)
  select jsonb_build_object(
    'commission', coalesce(sum(d.commission), 0), 'ads', coalesce(sum(d.ads), 0), 'channels', coalesce(sum(d.channels), 0),
    'subs', coalesce(sum(d.subs), 0), 'refunds', coalesce(sum(d.refunds), 0), 'gmv', coalesce(sum(d.gmv), 0),
    'gmvPending', coalesce((select sum(o.total) from public.orders o
      where o.payment = 'naqd' and o.paid_at is null and o.payment_state <> 'refunded'
        and o.created_at::date between p_from and p_to), 0),
    'bonus', coalesce(sum(d.bonus), 0), 'netCommission', coalesce(sum(d.commission - d.bonus), 0),
    'net', coalesce(sum(d.commission + d.ads + d.channels + d.subs - d.refunds - d.bonus), 0),
    'orders', (select count(*) from public.orders where created_at::date between p_from and p_to),
    'delivered', (select count(*) from public.orders where created_at::date between p_from and p_to and status = 'yetkazildi'),
    'paidOrders', (select count(*) from public.orders where paid_at::date between p_from and p_to and payment_state <> 'refunded'),
    'activeUsers', (select count(*) from public.profiles where last_seen_at::date between p_from and p_to),
    'newUsers', (select count(*) from public.profiles where created_at::date between p_from and p_to),
    'newTelegram', (select count(*) from public.profiles where created_at::date between p_from and p_to and provider = 'telegram'))
  from d
$$;

create or replace function public.sh_admin_products(p_secret text, p_admin uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','moderator']);
  return coalesce((select jsonb_agg(x order by (x->>'active')::boolean, x->>'createdAt' desc) from (
    select jsonb_build_object(
      'id', p.id, 'name', p.name, 'brand', p.brand, 'category', p.category, 'price', p.price,
      'stock', p.stock, 'active', p.active, 'image', p.image, 'createdAt', p.created_at,
      'storeId', s.id, 'storeName', s.name, 'storeStatus', s.status) x
    from public.products p join public.stores s on s.id = p.store_id
    order by p.active, p.created_at desc
    limit 400) t), '[]'::jsonb);
end $$;

create or replace function public.sh_admin_product_set(p_secret text, p_admin uuid, p_id uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','moderator']);
  if p_action not in ('approve', 'hide') then return jsonb_build_object('error', 'action'); end if;
  update public.products set active = (p_action = 'approve'), updated_at = now() where id = p_id;
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('error', 'not_found'); end if;
  perform private.audit(p_admin, 'product.' || p_action, 'product', p_id::text, jsonb_build_object('active', p_action = 'approve'));
  return jsonb_build_object('ok', true, 'active', p_action = 'approve');
end $$;

revoke all on function public.sh_admin_products(text, uuid) from public;
revoke all on function public.sh_admin_product_set(text, uuid, uuid, text) from public;
grant execute on function public.sh_admin_products(text, uuid) to anon, authenticated, service_role;
grant execute on function public.sh_admin_product_set(text, uuid, uuid, text) to anon, authenticated, service_role;

create table if not exists public.marketing_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  clinic text not null check (char_length(clinic) between 2 and 120),
  contact text not null check (char_length(contact) between 3 and 80),
  needs text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now()
);
alter table public.marketing_leads enable row level security;
revoke all on public.marketing_leads from anon, authenticated;

create or replace function public.sh_marketing_lead(p_secret text, p_user uuid, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_name text := left(btrim(coalesce(p_data->>'name', '')), 80);
  v_clinic text := left(btrim(coalesce(p_data->>'clinic', '')), 120);
  v_contact text := left(btrim(coalesce(p_data->>'contact', '')), 80);
  v_notes text := left(btrim(coalesce(p_data->>'notes', '')), 1000);
  v_needs text[];
  r public.marketing_leads;
begin
  perform private.assert_secret(p_secret);
  if char_length(v_name) < 2 or char_length(v_clinic) < 2 or char_length(v_contact) < 3 then
    return jsonb_build_object('error', 'fields');
  end if;
  select coalesce(array_agg(left(x, 40)), '{}') into v_needs
  from (select jsonb_array_elements_text(case when jsonb_typeof(p_data->'needs') = 'array' then p_data->'needs' else '[]'::jsonb end) x limit 12) s
  where char_length(btrim(x)) > 0;
  if coalesce(cardinality(v_needs), 0) = 0 then return jsonb_build_object('error', 'needs'); end if;
  if (select count(*) from public.marketing_leads where created_at > now() - interval '1 hour' and contact = v_contact) >= 5 then
    return jsonb_build_object('error', 'limit');
  end if;
  insert into public.marketing_leads (user_id, name, clinic, contact, needs, notes)
  values (p_user, v_name, v_clinic, v_contact, v_needs, v_notes)
  returning * into r;
  return jsonb_build_object('ok', true, 'id', r.id);
end $$;
revoke all on function public.sh_marketing_lead(text, uuid, jsonb) from public;
grant execute on function public.sh_marketing_lead(text, uuid, jsonb) to anon, authenticated, service_role;

-- Seller status changes only for goods that belong to this user's shop.
create or replace function public.sh_seller_order_update(p_secret text, p_user uuid, p_order text, p_action text, p_track jsonb)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare o public.orders; v_store uuid; v_next text; v_note text; v_url text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  v_store := private.seller_store_id(p_user);
  select * into o from public.orders where id = p_order;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_store is null or not exists (
    select 1 from public.order_items i
    where i.order_id = p_order and i.store_id = v_store and not private.is_delivery_line(i.product_id, i.name)
  ) then
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
    values (p_order, o.shop_id, 'hold', o.total - o.bonus_used, p_user, 'Naqd pul yetkazishda qabul qilindi');
  end if;
  return jsonb_build_object('order', private.order_json(o));
end $function$;
