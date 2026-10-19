-- New orders stay unpaid until a real payment callback exists.
-- Click/Payme used to set escrow_held and paid_at inside sh_create_order. That is removed.
-- Also adds per-doctor CRM patient and appointment storage.

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
  -- Click and Payme are not connected. A real payment callback is the only path that may set escrow_held / paid_at.
  v_paid := false;
  insert into public.orders (id, buyer_id, name, phone, city, address, note, payment, total, status, status_history, payment_state, paid_at)
  values (v_id, p_user, p_order->>'name', p_order->>'phone', coalesce(p_order->>'city',''), p_order->>'address',
    coalesce(p_order->>'note',''), p_order->>'payment', 0, 'pending_accept',
    jsonb_build_array(jsonb_build_object('status','pending_accept','at', now(),
      'note', 'Buyurtma yaratildi · to‘lov kutilmoqda (' || coalesce(p_order->>'payment','') || ')')),
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



-- Per-doctor clinic records. RLS is on and there are no policies; only these RPCs (secret + session user) can read or write.
create table if not exists public.crm_records (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('patient', 'appointment')),
  client_id text not null check (char_length(client_id) between 1 and 80),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  unique (doctor_id, kind, client_id)
);
create index if not exists crm_records_doctor_idx on public.crm_records (doctor_id, kind, updated_at desc);
alter table public.crm_records enable row level security;

create or replace function public.sh_crm_list(p_secret text, p_user uuid, p_kind text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_kind not in ('patient', 'appointment') then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(payload order by updated_at desc)
    from public.crm_records
    where doctor_id = p_user and kind = p_kind
  ), '[]'::jsonb);
end $$;

create or replace function public.sh_crm_replace(p_secret text, p_user uuid, p_kind text, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare it jsonb; v_id text; n int := 0;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_kind not in ('patient', 'appointment') then return jsonb_build_object('error', 'kind'); end if;
  if jsonb_typeof(p_items) <> 'array' then return jsonb_build_object('error', 'items'); end if;
  if jsonb_array_length(p_items) > 400 then return jsonb_build_object('error', 'too_many'); end if;
  for it in select * from jsonb_array_elements(p_items) loop
    if octet_length(it::text) > 200000 then return jsonb_build_object('error', 'too_large'); end if;
  end loop;
  delete from public.crm_records where doctor_id = p_user and kind = p_kind;
  for it in select * from jsonb_array_elements(p_items) loop
    v_id := left(trim(coalesce(it->>'id', '')), 80);
    if v_id = '' then continue; end if;
    insert into public.crm_records (doctor_id, kind, client_id, payload)
    values (p_user, p_kind, v_id, it)
    on conflict (doctor_id, kind, client_id) do update
      set payload = excluded.payload, updated_at = now();
    n := n + 1;
  end loop;
  return public.sh_crm_list(p_secret, p_user, p_kind);
end $$;

create or replace function public.sh_crm_upsert(p_secret text, p_user uuid, p_kind text, p_item jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text; row public.crm_records;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_kind not in ('patient', 'appointment') then return jsonb_build_object('error', 'kind'); end if;
  if jsonb_typeof(p_item) <> 'object' then return jsonb_build_object('error', 'item'); end if;
  v_id := left(trim(coalesce(p_item->>'id', '')), 80);
  if v_id = '' then return jsonb_build_object('error', 'id'); end if;
  if octet_length(p_item::text) > 200000 then return jsonb_build_object('error', 'too_large'); end if;
  insert into public.crm_records (doctor_id, kind, client_id, payload)
  values (p_user, p_kind, v_id, p_item)
  on conflict (doctor_id, kind, client_id) do update
    set payload = public.crm_records.payload || excluded.payload, updated_at = now()
  returning * into row;
  return row.payload;
end $$;

revoke all on function public.sh_crm_list(text, uuid, text) from public;
revoke all on function public.sh_crm_replace(text, uuid, text, jsonb) from public;
revoke all on function public.sh_crm_upsert(text, uuid, text, jsonb) from public;
grant execute on function public.sh_crm_list(text, uuid, text) to anon, authenticated, service_role;
grant execute on function public.sh_crm_replace(text, uuid, text, jsonb) to anon, authenticated, service_role;
grant execute on function public.sh_crm_upsert(text, uuid, text, jsonb) to anon, authenticated, service_role;
