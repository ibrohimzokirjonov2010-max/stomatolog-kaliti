-- 20260929a: platform store for catalog orders, real product reviews (public + buyer view), payout requisites + admin processing.

-- ───────────── 1. platform store (owner = system profile until an admin is promoted) ─────────────
alter table public.stores add column if not exists is_platform boolean not null default false;
create unique index if not exists stores_one_platform on public.stores (is_platform) where is_platform;

insert into public.profiles (provider, provider_uid, full_name, role)
values ('phone', 'platform:stomatolog-kaliti', 'Stomatolog Kaliti (platforma)', 'doctor')
on conflict (provider, provider_uid) do nothing;

insert into public.stores (owner_id, slug, name, city, bio, phone, owner_name, status, commission_rate, is_platform, reviewed_at)
select p.id, 'kaliti-market', 'Stomatolog Kaliti Market', 'Toshkent',
       'Stomatolog Kaliti rasmiy katalogi — platforma o‘zi sotadigan mahsulotlar. Buyurtmalarni platforma administratori boshqaradi.',
       '+998 71 200 00 00', 'Stomatolog Kaliti', 'active', 0, true, now()
from public.profiles p
where p.provider = 'phone' and p.provider_uid = 'platform:stomatolog-kaliti'
  and not exists (select 1 from public.stores s where s.is_platform);

-- existing catalog orders (no store yet) belong to the platform store from now on
with ps as (select id, name from public.stores where is_platform limit 1)
update public.order_items i set store_id = ps.id from ps
where i.store_id is null and i.product_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
with ps as (select id from public.stores where is_platform limit 1)
update public.orders o set shop_id = ps.id from ps
where o.shop_id is null and exists (select 1 from public.order_items i where i.order_id = o.id and i.store_id = ps.id);
with ps as (select id from public.stores where is_platform limit 1)
update public.escrow_ledger l set store_id = ps.id from ps
where l.store_id is null and l.kind in ('hold','release','commission','refund')
  and exists (select 1 from public.orders o where o.id = l.order_id and o.shop_id = ps.id);

create or replace function public.sh_create_order(p_secret text, p_user uuid, p_order jsonb, p_items jsonb, p_use_bonus boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text; it jsonb; v_prod public.products; v_store public.stores; v_total bigint := 0; v_comm bigint := 0;
  v_price bigint; v_qty int; v_first_store uuid; v_first_name text; o public.orders; v_paid boolean; v_shop_name text; v_shop_slug text;
  v_eligible bigint := 0; v_rules jsonb := private.bonus_rules(); v_bonus bigint := 0; v_left bigint; v_take bigint; g record;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('error', 'empty');
  end if;
  if p_use_bonus then
    perform 1 from public.profiles where id = p_user for update;
  end if;
  v_id := 'SK-' || nextval('public.order_no_seq');
  v_paid := p_order->>'payment' in ('click','payme');
  insert into public.orders (id, buyer_id, name, phone, city, address, note, payment, total, status, status_history, payment_state, paid_at)
  values (v_id, p_user, p_order->>'name', p_order->>'phone', coalesce(p_order->>'city',''), p_order->>'address',
    coalesce(p_order->>'note',''), p_order->>'payment', 0, 'pending_accept',
    jsonb_build_array(jsonb_build_object('status','pending_accept','at', now(),
      'note', case when v_paid then 'Buyurtma yaratildi · to‘lov platformada (escrow)' else 'Buyurtma yaratildi · naqd to‘lov' end)),
    case when v_paid then 'escrow_held' else 'awaiting_payment' end,
    case when v_paid then now() end);

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(coalesce((it->>'qty')::int, 1), 999));
    v_prod := null; v_store := null;
    if (it->>'productId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      select * into v_prod from public.products where id = (it->>'productId')::uuid;
      if v_prod.id is null then raise exception 'product_unavailable' using errcode = 'P0001'; end if;
      select * into v_store from public.stores where id = v_prod.store_id;
      if v_store.owner_id = p_user then raise exception 'own_product' using errcode = 'P0001'; end if;
      if v_store.status <> 'active' or not v_prod.active then raise exception 'product_unavailable' using errcode = 'P0001'; end if;
      if v_prod.stock < v_qty then raise exception 'out_of_stock' using errcode = 'P0001'; end if;
      update public.products set stock = stock - v_qty where id = v_prod.id;
    else
      -- bundled platform catalog item: sold (and fulfilled) by the platform store
      select * into v_store from public.stores where is_platform and status = 'active';
    end if;
    v_price := case when v_prod.id is not null then v_prod.price else greatest(coalesce((it->>'price')::bigint, 0), 0) end;
    v_shop_name := case when coalesce(v_store.is_platform, false) then coalesce(nullif(it->>'shopName',''), v_store.name) else coalesce(v_store.name, it->>'shopName') end;
    v_shop_slug := case when coalesce(v_store.is_platform, false) then coalesce(nullif(it->>'shopSlug',''), v_store.slug) else coalesce(v_store.slug, it->>'shopSlug') end;
    insert into public.order_items (order_id, product_id, store_id, name, brand, image, qty, price, commission_rate,
      size, color, category, source, expiry_months, shop_name, shop_slug)
    values (v_id, it->>'productId', v_store.id, coalesce(v_prod.name, it->>'name', 'Mahsulot'), coalesce(v_prod.brand, it->>'brand', ''),
      coalesce(v_prod.image, it->>'image'), v_qty, v_price, coalesce(v_store.commission_rate, 0),
      nullif(it->>'size',''), nullif(it->>'color',''), coalesce(v_prod.category, it->>'category'), nullif(it->>'source',''),
      nullif(it->>'expiryMonths','')::int, v_shop_name, v_shop_slug);
    v_total := v_total + v_price * v_qty;
    if v_store.id is not null and not coalesce(v_store.is_platform, false) then v_eligible := v_eligible + v_price * v_qty; end if;
    v_comm := v_comm + round(v_price * v_qty * coalesce(v_store.commission_rate, 0) / 100.0);
    if v_first_store is null and v_store.id is not null then v_first_store := v_store.id; v_first_name := v_shop_name; end if;
    if v_first_name is null then v_first_name := nullif(it->>'shopName',''); end if;
  end loop;

  if p_use_bonus then
    if v_eligible < (v_rules->>'minOrder')::bigint then raise exception 'bonus_min_order' using errcode = 'P0001'; end if;
    perform private.bonus_expire(p_user);
    v_left := least(private.bonus_balance(p_user), (v_rules->>'maxPerOrder')::bigint, v_eligible);
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
  if v_paid then
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note)
    values (v_id, v_first_store, 'hold', v_total - v_bonus, p_user,
      'Demo to‘lov: ' || o.payment || ' (haqiqiy yechim yo‘q)' || case when v_bonus > 0 then ' · bonus ' || v_bonus || ' so‘m platforma hisobidan' else '' end);
  end if;
  return jsonb_build_object('order', private.order_json(o));
end $$;

-- the platform store is represented by the bundled catalog shop on the public pages, so it is not listed twice
create or replace function public.sh_public_catalog(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'shops', coalesce((select jsonb_agg(private.store_json(s) order by s.reviewed_at desc nulls last)
                       from public.stores s where s.status = 'active' and not s.is_platform), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(private.product_json(p, s) order by p.created_at desc)
                          from public.products p join public.stores s on s.id = p.store_id
                          where s.status = 'active' and p.active and not s.is_platform), '[]'::jsonb));
end $$;

-- when an owner-admin is promoted (ADMIN_* env match), the platform store moves to that account
create or replace function public.sh_session_ping(p_secret text, p_user uuid, p_phones text[], p_emails text[], p_telegram text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_match text;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where id = p_user;
  if r.id is null then return null; end if;
  if r.last_seen_at is null or r.last_seen_at < now() - interval '5 minutes' then
    update public.profiles set last_seen_at = now() where id = p_user returning * into r;
  end if;
  if r.blocked_at is null and not (r.is_admin and r.admin_role = 'owner') then
    v_match := case
      when r.phone_verified_at is not null and coalesce(r.phone, '') <> '' and r.phone = any(coalesce(p_phones, '{}')) then 'phone'
      when r.provider = 'google' and lower(coalesce(r.email, '')) = any(coalesce(p_emails, '{}')) then 'email'
      when r.provider = 'telegram' and r.provider_uid = any(coalesce(p_telegram, '{}')) then 'telegram'
    end;
    if v_match is not null then
      update public.profiles set is_admin = true, admin_role = 'owner', updated_at = now() where id = p_user returning * into r;
      perform private.audit(p_user, 'admin.owner_bootstrap', 'profile', p_user::text, jsonb_build_object('matchedBy', v_match));
    end if;
  end if;
  if r.is_admin and r.admin_role = 'owner' and r.blocked_at is null then
    perform private.claim_platform_store(r.id);
  end if;
  return private.profile_json(r);
end $$;

create or replace function private.claim_platform_store(p_admin uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- only moves a store still owned by the system profile, and only if the admin has no store of their own
  update public.stores s set owner_id = p_admin, updated_at = now()
  where s.is_platform
    and exists (select 1 from public.profiles sp where sp.id = s.owner_id and sp.provider_uid = 'platform:stomatolog-kaliti')
    and not exists (select 1 from public.stores x where x.owner_id = p_admin);
  if found then
    perform private.audit(p_admin, 'platform.store_claimed', 'store', (select id::text from public.stores where is_platform), '{}'::jsonb);
  end if;
end $$;
revoke all on function private.claim_platform_store(uuid) from public, anon, authenticated;

-- ───────────── 2. real product reviews ─────────────
create or replace function private.short_name(p_name text)
returns text language sql immutable set search_path = '' as $$
  select trim(coalesce(nullif(split_part(btrim(p_name), ' ', 1), ''), 'Xaridor')
    || case when split_part(btrim(p_name), ' ', 2) <> '' then ' ' || upper(left(split_part(btrim(p_name), ' ', 2), 1)) || '.' else '' end)
$$;

create or replace function public.sh_product_reviews(p_secret text, p_product uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'count', (select count(*) from public.reviews where product_id = p_product),
    'avg', (select round(avg(rating)::numeric, 2) from public.reviews where product_id = p_product),
    'reviews', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'id', r.id, 'rating', r.rating, 'body', r.body, 'buyerName', private.short_name(b.full_name),
        'createdAt', r.created_at, 'reply', r.seller_reply, 'replyAt', r.seller_reply_at, 'images', r.images,
        'cats', jsonb_build_object('quality', r.r_quality, 'delivery', r.r_delivery, 'packaging', r.r_packaging, 'service', r.r_service, 'value', r.r_value)))
        order by r.created_at desc)
      from (select * from public.reviews where product_id = p_product order by created_at desc limit 100) r
      join public.profiles b on b.id = r.buyer_id), '[]'::jsonb));
end $$;

create or replace function public.sh_review_order_state(p_secret text, p_user uuid, p_order text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'eligible', exists (select 1 from public.orders o where o.id = p_order and o.buyer_id = p_user and o.status = 'yetkazildi' and o.payment_state <> 'refunded'),
    'reviewed', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('productId', coalesce(r.product_id::text, ''), 'rating', r.rating,
        'body', r.body, 'createdAt', r.created_at, 'reply', r.seller_reply, 'replyAt', r.seller_reply_at)))
      from public.reviews r where r.order_id = p_order and r.buyer_id = p_user), '[]'::jsonb));
end $$;

-- ───────────── 3. payouts: requisites + admin processing ─────────────
alter table public.payout_requests
  add column if not exists card_last4 text check (card_last4 is null or card_last4 ~ '^\d{4}$'),
  add column if not exists card_holder text,
  add column if not exists card_bank text,
  add column if not exists card_brand text,
  add column if not exists provider_token text,          -- reserved for a payment provider's card token (never a PAN)
  add column if not exists admin_note text,
  add column if not exists processed_by uuid references public.profiles(id) on delete set null,
  add column if not exists seller_seen_at timestamptz;
create index if not exists payout_requests_status_idx on public.payout_requests (status, created_at desc);

drop function if exists public.sh_request_payout(text, uuid, bigint);
create or replace function public.sh_request_payout(p_secret text, p_user uuid, p_amount bigint, p_card jsonb default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_released bigint; v_reserved bigint; v_id uuid; v_last4 text; v_holder text; v_bank text; v_brand text;
begin
  perform private.assert_secret(p_secret);
  select * into v_store from public.stores where owner_id = p_user and status = 'active' for update;
  if v_store.id is null then return jsonb_build_object('error', 'no_store'); end if;
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('error', 'amount'); end if;
  v_last4 := p_card->>'last4';
  v_holder := left(btrim(coalesce(p_card->>'holder', '')), 60);
  v_bank := left(btrim(coalesce(p_card->>'bank', '')), 60);
  v_brand := left(btrim(coalesce(p_card->>'brand', '')), 20);
  if v_last4 is null or v_last4 !~ '^\d{4}$' or v_holder = '' then return jsonb_build_object('error', 'card'); end if;
  select coalesce(sum(amount), 0) into v_released from public.escrow_ledger where store_id = v_store.id and kind = 'release';
  select coalesce(sum(amount), 0) into v_reserved from public.payout_requests where store_id = v_store.id and status in ('pending','paid');
  if p_amount > v_released - v_reserved then return jsonb_build_object('error', 'insufficient'); end if;
  insert into public.payout_requests (store_id, amount, card_last4, card_holder, card_bank, card_brand)
  values (v_store.id, p_amount, v_last4, v_holder, nullif(v_bank, ''), nullif(v_brand, '')) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function private.payout_json(p public.payout_requests)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object('id', p.id, 'amount', p.amount, 'status', p.status, 'createdAt', p.created_at,
    'processedAt', p.processed_at, 'adminNote', p.admin_note, 'cardLast4', p.card_last4, 'cardHolder', p.card_holder,
    'cardBank', p.card_bank, 'cardBrand', p.card_brand, 'unseen', (p.status <> 'pending' and p.seller_seen_at is null)))
$$;

create or replace function public.sh_seller_finance(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_released bigint; v_comm bigint; v_reserved bigint; v_held bigint; v_held_comm bigint; v_held_n int; v_unseen int;
begin
  perform private.assert_secret(p_secret);
  select * into v_store from public.stores where owner_id = p_user;
  if v_store.id is null then return jsonb_build_object('error', 'no_store'); end if;
  select coalesce(sum(amount) filter (where kind = 'release'), 0), coalesce(sum(amount) filter (where kind = 'commission'), 0)
    into v_released, v_comm from public.escrow_ledger where store_id = v_store.id;
  select coalesce(sum(amount), 0) into v_reserved from public.payout_requests where store_id = v_store.id and status in ('pending','paid');
  select coalesce(sum(i.price * i.qty), 0), coalesce(sum(round(i.price * i.qty * i.commission_rate / 100.0)), 0), count(distinct o.id)
    into v_held, v_held_comm, v_held_n
    from public.order_items i join public.orders o on o.id = i.order_id
    where i.store_id = v_store.id and o.payment_state = 'escrow_held';
  select count(*) into v_unseen from public.payout_requests where store_id = v_store.id and status <> 'pending' and seller_seen_at is null;
  return jsonb_build_object(
    'commissionRate', v_store.commission_rate,
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

create or replace function public.sh_payouts_unseen(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object('count', (select count(*) from public.payout_requests pr join public.stores s on s.id = pr.store_id
    where s.owner_id = p_user and pr.status <> 'pending' and pr.seller_seen_at is null));
end $$;

create or replace function public.sh_payouts_mark_seen(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  update public.payout_requests pr set seller_seen_at = now()
  from public.stores s where s.id = pr.store_id and s.owner_id = p_user and pr.status <> 'pending' and pr.seller_seen_at is null;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_admin_payouts(p_secret text, p_admin uuid, p_filter text default 'all')
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','finance']);
  return jsonb_build_object(
    'kpis', jsonb_build_object(
      'pendingAmount', coalesce((select sum(amount) from public.payout_requests where status = 'pending'), 0),
      'pending', (select count(*) from public.payout_requests where status = 'pending'),
      'paid30', coalesce((select sum(amount) from public.payout_requests where status = 'paid' and processed_at > now() - interval '30 days'), 0),
      'rejected30', (select count(*) from public.payout_requests where status = 'rejected' and processed_at > now() - interval '30 days')),
    'counts', jsonb_build_object(
      'all', (select count(*) from public.payout_requests),
      'pending', (select count(*) from public.payout_requests where status = 'pending'),
      'paid', (select count(*) from public.payout_requests where status = 'paid'),
      'rejected', (select count(*) from public.payout_requests where status = 'rejected')),
    'rows', coalesce((select jsonb_agg(x order by (x->>'status' = 'pending') desc, x->>'createdAt' desc) from (
        select private.payout_json(p) || jsonb_strip_nulls(jsonb_build_object('storeId', s.id, 'storeName', s.name, 'ownerName', s.owner_name,
          'ownerPhone', s.phone, 'isPlatform', s.is_platform, 'processedBy', pb.full_name)) x
        from public.payout_requests p join public.stores s on s.id = p.store_id left join public.profiles pb on pb.id = p.processed_by
        where p_filter = 'all' or p.status = p_filter
        order by (p.status = 'pending') desc, p.created_at desc limit 300) t), '[]'::jsonb));
end $$;

create or replace function public.sh_admin_resolve_payout(p_secret text, p_admin uuid, p_id uuid, p_action text, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.payout_requests; v_note text := left(btrim(coalesce(p_note, '')), 500);
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','finance']);
  if p_action not in ('paid', 'reject') then return jsonb_build_object('error', 'invalid'); end if;
  if char_length(v_note) < 3 then return jsonb_build_object('error', 'note'); end if;
  select * into p from public.payout_requests where id = p_id for update;
  if p.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if p.status <> 'pending' then return jsonb_build_object('error', 'state'); end if;
  update public.payout_requests set status = case when p_action = 'paid' then 'paid' else 'rejected' end,
    admin_note = v_note, processed_at = now(), processed_by = p_admin, seller_seen_at = null
  where id = p_id returning * into p;
  perform private.audit(p_admin, 'payout.' || case when p_action = 'paid' then 'paid' else 'rejected' end, 'payout', p.id::text,
    jsonb_build_object('amount', p.amount, 'storeId', p.store_id, 'note', v_note));
  return jsonb_build_object('payout', private.payout_json(p));
end $$;

create or replace function public.sh_admin_whoami(p_secret text, p_admin uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where id = p_admin and is_admin and blocked_at is null;
  if r.id is null then return null; end if;
  return private.profile_json(r) || jsonb_build_object(
    'badges', jsonb_build_object(
      'applications', (select count(*) from public.seller_applications where status = 'pending'),
      'disputes', (select count(*) from public.disputes where status = 'open'),
      'reports', (select count(distinct post_id) from public.community_reports where status = 'open'),
      'payouts', (select count(*) from public.payout_requests where status = 'pending')));
end $$;

grant execute on function public.sh_product_reviews(text, uuid), public.sh_review_order_state(text, uuid, text),
  public.sh_request_payout(text, uuid, bigint, jsonb), public.sh_seller_finance(text, uuid), public.sh_payouts_unseen(text, uuid),
  public.sh_payouts_mark_seen(text, uuid), public.sh_admin_payouts(text, uuid, text), public.sh_admin_resolve_payout(text, uuid, uuid, text, text),
  public.sh_admin_whoami(text, uuid), public.sh_create_order(text, uuid, jsonb, jsonb, boolean), public.sh_public_catalog(text),
  public.sh_session_ping(text, uuid, text[], text[], text[]) to anon, authenticated, service_role;
