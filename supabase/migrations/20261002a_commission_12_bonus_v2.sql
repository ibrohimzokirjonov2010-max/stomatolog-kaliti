-- 20261002a: Marketplace commission 8% -> 12% (single source) + new-doctor bonus v2
-- (signup 10 000, first_purchase 30 000; Marketplace-only, one-time per type, race-safe).

-- ───────────────────────── 1) Commission: ONE source of truth ─────────────────────────
create or replace function private.marketplace_commission_rate() returns numeric
language sql immutable set search_path = '' as $$ select 12::numeric $$;

alter table public.stores alter column commission_rate set default private.marketplace_commission_rate();

-- Only stores still on the old default (8) move to the new rate; the platform store (0%) and custom admin rates stay.
-- Past orders keep their snapshot in order_items.commission_rate, so they are not touched.
update public.stores set commission_rate = private.marketplace_commission_rate()
where not is_platform and commission_rate = 8;

-- ───────────────────────── 2) Bonus v2 ─────────────────────────
alter table public.bonus_ledger add column if not exists bonus_type text;
alter table public.bonus_ledger drop constraint if exists bonus_ledger_bonus_type_check;
alter table public.bonus_ledger add constraint bonus_ledger_bonus_type_check
  check (bonus_type is null or (bonus_type in ('signup', 'first_purchase') and kind = 'grant'));
-- one grant per user per type — enforced by the database itself (race-safe)
create unique index if not exists bonus_ledger_one_grant_per_type
  on public.bonus_ledger (user_id, bonus_type) where kind = 'grant' and bonus_type is not null;
-- one first_purchase bonus per order too
create unique index if not exists bonus_ledger_one_grant_per_order_type
  on public.bonus_ledger (order_id, bonus_type) where kind = 'grant' and bonus_type = 'first_purchase';

-- Only profiles created after this moment can ever get the signup bonus (existing profiles get nothing).
insert into private.app_config (key, value)
values ('bonus_new_users_from', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))
on conflict (key) do nothing;

create or replace function private.bonus_cutoff() returns timestamptz
language sql stable security definer set search_path = '' as $$
  select coalesce((select value::timestamptz from private.app_config where key = 'bonus_new_users_from'), 'infinity'::timestamptz)
$$;

create or replace function private.digits9(p text) returns text
language sql immutable set search_path = '' as $$ select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 9) $$;

create or replace function private.bonus_rules() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'signup', 10000, 'firstPurchase', 30000, 'amount', 10000,
    'minOrder', 0, 'maxPerOrder', 40000, 'maxSharePercent', 50,
    'days', 365, 'refundGraceDays', 7)
$$;

create or replace function private.bonus_state(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with g as (
    select g.id, g.amount, g.expires_at, g.created_at, g.bonus_type,
           g.amount + coalesce((select sum(x.amount) from public.bonus_ledger x where x.grant_id = g.id), 0) as remaining
    from public.bonus_ledger g where g.user_id = p_user and g.kind = 'grant')
  select jsonb_build_object(
    'balance', coalesce((select sum(remaining) from g where expires_at > now() and remaining > 0), 0),
    'expiresAt', (select min(expires_at) from g where expires_at > now() and remaining > 0),
    'grantedAt', (select max(created_at) from g),
    'granted', coalesce((select sum(amount) from g), 0),
    'expired', exists (select 1 from g where expires_at <= now()),
    'signupGranted', exists (select 1 from g where bonus_type = 'signup'),
    'firstPurchaseGranted', exists (select 1 from g where bonus_type = 'first_purchase'),
    'firstPurchasePending', exists (select 1 from g where bonus_type = 'signup') and not exists (select 1 from g where bonus_type = 'first_purchase'),
    'rules', private.bonus_rules())
$$;

-- Signup bonus: only profiles created after the cutoff, one per profile and one per phone, never for the platform profile.
create or replace function private.grant_signup_bonus(p_user uuid, p_phone text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_rules jsonb := private.bonus_rules(); v_amt bigint := (private.bonus_rules()->>'signup')::bigint;
  v_ph text; v_id bigint; v_exp timestamptz;
begin
  select * into r from public.profiles where id = p_user;
  if r.id is null or r.blocked_at is not null or r.provider_uid like 'platform:%' then return null; end if;
  if r.created_at < private.bonus_cutoff() then return null; end if;
  v_ph := private.digits9(coalesce(nullif(p_phone, ''), r.phone));
  if length(v_ph) <> 9 then return null; end if;
  if exists (select 1 from public.profiles x where x.id <> r.id and private.digits9(x.phone) = v_ph and x.created_at < r.created_at) then return null; end if;
  if exists (select 1 from public.bonus_ledger where user_id = p_user and kind = 'grant' and bonus_type = 'signup') then return null; end if;
  insert into public.bonus_phone_grants (phone, user_id, amount) values (v_ph, p_user, v_amt) on conflict (phone) do nothing;
  if not found then return null; end if;
  v_exp := now() + make_interval(days => (v_rules->>'days')::int);
  insert into public.bonus_ledger (user_id, kind, bonus_type, amount, expires_at, phone, note)
  values (p_user, 'grant', 'signup', v_amt, v_exp, v_ph, 'Ro‘yxatdan o‘tish bonusi')
  on conflict (user_id, bonus_type) where kind = 'grant' and bonus_type is not null do nothing
  returning id into v_id;
  if v_id is null then return null; end if;
  perform private.audit(p_user, 'bonus.grant', 'profile', p_user::text,
    jsonb_build_object('type', 'signup', 'amount', v_amt, 'phone', '+998' || left(v_ph, 2) || '***' || right(v_ph, 4), 'expiresAt', v_exp));
  return jsonb_build_object('amount', v_amt, 'expiresAt', v_exp);
end $$;

-- First-purchase bonus: called on escrow release. Needs a signup grant (new bonus user), and at least one
-- Marketplace line (materiallar/implantlar/asboblar, not "ortiqcha") from a store the buyer does not own
-- (neither by owner id nor by phone). Unique index => at most one, even under concurrent releases.
create or replace function private.grant_first_purchase_bonus(p_order text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o public.orders; b public.profiles; v_rules jsonb := private.bonus_rules(); v_amt bigint := (private.bonus_rules()->>'firstPurchase')::bigint;
  v_id bigint; v_exp timestamptz;
begin
  select * into o from public.orders where id = p_order;
  if o.id is null or o.buyer_id is null or o.payment_state <> 'released' then return null; end if;
  if not exists (select 1 from public.bonus_ledger where user_id = o.buyer_id and kind = 'grant' and bonus_type = 'signup') then return null; end if;
  select * into b from public.profiles where id = o.buyer_id;
  if b.id is null or b.blocked_at is not null then return null; end if;
  if not exists (
    select 1 from public.order_items i join public.stores s on s.id = i.store_id
    left join public.profiles ow on ow.id = s.owner_id
    where i.order_id = p_order
      and i.category in ('materiallar', 'implantlar', 'asboblar') and i.product_id not like 'surplus-%'
      and s.owner_id is distinct from o.buyer_id
      and coalesce(nullif(private.digits9(s.phone), ''), 'none') not in (private.digits9(b.phone), private.digits9(o.phone))
      and coalesce(nullif(private.digits9(ow.phone), ''), 'none') not in (private.digits9(b.phone), private.digits9(o.phone))
  ) then return null; end if;
  v_exp := now() + make_interval(days => (v_rules->>'days')::int);
  insert into public.bonus_ledger (user_id, kind, bonus_type, amount, expires_at, order_id, note)
  values (o.buyer_id, 'grant', 'first_purchase', v_amt, v_exp, p_order, 'Birinchi xarid bonusi')
  on conflict do nothing returning id into v_id;
  if v_id is null then return null; end if;
  perform private.audit(o.buyer_id, 'bonus.grant', 'order', p_order,
    jsonb_build_object('type', 'first_purchase', 'amount', v_amt, 'expiresAt', v_exp));
  return jsonb_build_object('amount', v_amt, 'expiresAt', v_exp);
end $$;

-- Escrow release: seller still gets gross − commission (commission snapshot per item); the bonus-paid part is a platform expense.
create or replace function private.release_order(p_order text, p_actor uuid, p_note text) returns public.orders
language plpgsql security definer set search_path = '' as $$
declare o public.orders; r record;
begin
  update public.orders set payment_state = 'released', released_at = now(),
    confirmed_at = coalesce(confirmed_at, now()), updated_at = now()
  where id = p_order and payment_state = 'escrow_held' returning * into o;
  if o.id is null then raise exception 'not_releasable' using errcode = 'P0001'; end if;
  for r in select i.store_id, sum(i.price * i.qty) gross, sum(round(i.price * i.qty * i.commission_rate / 100.0)) comm
           from public.order_items i where i.order_id = p_order group by i.store_id loop
    if r.comm > 0 then
      insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note) values (p_order, r.store_id, 'commission', r.comm, p_actor, p_note);
    end if;
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note) values (p_order, r.store_id, 'release', r.gross - r.comm, p_actor, p_note);
  end loop;
  if o.bonus_used > 0 then
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note)
    values (p_order, null, 'bonus', o.bonus_used, p_actor, 'Platforma xarajati: shifokor bonusi');
  end if;
  perform private.grant_first_purchase_bonus(p_order);
  return o;
end $$;

-- Session ping also grants the signup bonus (registration of any provider ends up here); idempotent.
create or replace function public.sh_session_ping(p_secret text, p_user uuid, p_phones text[], p_emails text[], p_telegram text[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
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
  if r.blocked_at is null and r.created_at >= private.bonus_cutoff() and coalesce(r.phone, '') <> ''
     and not exists (select 1 from public.bonus_ledger where user_id = r.id and kind = 'grant' and bonus_type = 'signup') then
    perform private.grant_signup_bonus(r.id, r.phone);
  end if;
  return private.profile_json(r);
end $$;

create or replace function public.sh_my_bonus(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return private.bonus_state(p_user) || jsonb_build_object(
    'history', coalesce((select jsonb_agg(jsonb_build_object('kind', l.kind, 'type', l.bonus_type, 'amount', l.amount, 'orderId', l.order_id,
        'note', l.note, 'createdAt', l.created_at, 'expiresAt', l.expires_at) order by l.created_at desc, l.id desc)
      from public.bonus_ledger l where l.user_id = p_user), '[]'::jsonb));
end $$;

-- Quote for the cart: how much bonus can be applied (server decides; checkout re-checks it atomically).
create or replace function public.sh_bonus_quote(p_secret text, p_user uuid, p_items jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare it jsonb; v_prod public.products; v_store public.stores; v_total bigint := 0; v_eligible bigint := 0; v_price bigint; v_qty int; v_cat text;
  v_rules jsonb := private.bonus_rules(); v_bal bigint; v_cap bigint;
begin
  perform private.assert_secret(p_secret);
  if jsonb_typeof(p_items) = 'array' then
    for it in select * from jsonb_array_elements(p_items) loop
      v_qty := greatest(1, least(coalesce((it->>'qty')::int, 1), 999));
      v_prod := null; v_store := null;
      if (it->>'productId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        select * into v_prod from public.products where id = (it->>'productId')::uuid;
        continue when v_prod.id is null;
        select * into v_store from public.stores where id = v_prod.store_id;
        continue when v_store.id is null or v_store.owner_id = p_user or v_store.status <> 'active' or not v_prod.active;
      else
        select * into v_store from public.stores where is_platform and status = 'active';
      end if;
      v_price := case when v_prod.id is not null then v_prod.price else greatest(coalesce((it->>'price')::bigint, 0), 0) end;
      v_cat := coalesce(v_prod.category, it->>'category');
      v_total := v_total + v_price * v_qty;
      if v_store.id is not null and v_cat in ('materiallar', 'implantlar', 'asboblar') and (it->>'productId') not like 'surplus-%' then
        v_eligible := v_eligible + v_price * v_qty;
      end if;
    end loop;
  end if;
  perform private.bonus_expire(p_user);
  v_bal := private.bonus_balance(p_user);
  v_cap := least(v_bal, (v_rules->>'maxPerOrder')::bigint, floor(v_eligible * (v_rules->>'maxSharePercent')::int / 100.0)::bigint);
  return jsonb_build_object('balance', v_bal, 'total', v_total, 'eligible', v_eligible, 'usable', greatest(v_cap, 0),
    'payable', v_total - greatest(v_cap, 0), 'maxSharePercent', (v_rules->>'maxSharePercent')::int);
end $$;

-- Checkout: same as before, but bonus applies only to Marketplace lines and at most maxSharePercent of them.
-- Seller payout is unaffected: escrow hold = total − bonus, release still pays sellers gross − commission(12%), and the
-- bonus-paid part is booked as a platform expense ('bonus' escrow row) at release.
create or replace function public.sh_create_order(p_secret text, p_user uuid, p_order jsonb, p_items jsonb, p_use_bonus boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_id text; it jsonb; v_prod public.products; v_store public.stores; v_total bigint := 0; v_comm bigint := 0;
  v_price bigint; v_qty int; v_first_store uuid; v_first_name text; o public.orders; v_paid boolean; v_shop_name text; v_shop_slug text;
  v_eligible bigint := 0; v_rules jsonb := private.bonus_rules(); v_bonus bigint := 0; v_left bigint; v_take bigint; g record; v_cat text;
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
      select * into v_store from public.stores where is_platform and status = 'active';
    end if;
    v_price := case when v_prod.id is not null then v_prod.price else greatest(coalesce((it->>'price')::bigint, 0), 0) end;
    v_cat := coalesce(v_prod.category, it->>'category');
    v_shop_name := case when coalesce(v_store.is_platform, false) then coalesce(nullif(it->>'shopName',''), v_store.name) else coalesce(v_store.name, it->>'shopName') end;
    v_shop_slug := case when coalesce(v_store.is_platform, false) then coalesce(nullif(it->>'shopSlug',''), v_store.slug) else coalesce(v_store.slug, it->>'shopSlug') end;
    insert into public.order_items (order_id, product_id, store_id, name, brand, image, qty, price, commission_rate,
      size, color, category, source, expiry_months, shop_name, shop_slug)
    values (v_id, it->>'productId', v_store.id, coalesce(v_prod.name, it->>'name', 'Mahsulot'), coalesce(v_prod.brand, it->>'brand', ''),
      coalesce(v_prod.image, it->>'image'), v_qty, v_price, coalesce(v_store.commission_rate, 0),
      nullif(it->>'size',''), nullif(it->>'color',''), v_cat, nullif(it->>'source',''),
      nullif(it->>'expiryMonths','')::int, v_shop_name, v_shop_slug);
    v_total := v_total + v_price * v_qty;
    if v_store.id is not null and v_cat in ('materiallar', 'implantlar', 'asboblar') and (it->>'productId') not like 'surplus-%' then
      v_eligible := v_eligible + v_price * v_qty;
    end if;
    v_comm := v_comm + round(v_price * v_qty * coalesce(v_store.commission_rate, 0) / 100.0);
    if v_first_store is null and v_store.id is not null then v_first_store := v_store.id; v_first_name := v_shop_name; end if;
    if v_first_name is null then v_first_name := nullif(it->>'shopName',''); end if;
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
  if v_paid then
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note)
    values (v_id, v_first_store, 'hold', v_total - v_bonus, p_user,
      'Demo to‘lov: ' || o.payment || ' (haqiqiy yechim yo‘q)' || case when v_bonus > 0 then ' · bonus ' || v_bonus || ' so‘m platforma hisobidan' else '' end);
  end if;
  return jsonb_build_object('order', private.order_json(o));
end $$;

revoke all on function public.sh_bonus_quote(text, uuid, jsonb) from public;
grant execute on function public.sh_bonus_quote(text, uuid, jsonb) to anon, authenticated, service_role;
