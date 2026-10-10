-- Reject unknown DB product ids (no 0-priced orders) and buying from your own store.
create or replace function public.sh_create_order(p_secret text, p_user uuid, p_order jsonb, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text; it jsonb; v_prod public.products; v_store public.stores; v_total bigint := 0; v_comm bigint := 0;
  v_price bigint; v_qty int; v_first_store uuid; v_first_name text; o public.orders; v_paid boolean;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('error', 'empty');
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
      if v_prod.id is not null then
        select * into v_store from public.stores where id = v_prod.store_id;
        if v_store.owner_id = p_user then raise exception 'own_product' using errcode = 'P0001'; end if;
        if v_store.status <> 'active' or not v_prod.active then raise exception 'product_unavailable' using errcode = 'P0001'; end if;
        if v_prod.stock < v_qty then raise exception 'out_of_stock' using errcode = 'P0001'; end if;
        update public.products set stock = stock - v_qty where id = v_prod.id;
      end if;
    end if;
    v_price := case when v_prod.id is not null then v_prod.price else greatest(coalesce((it->>'price')::bigint, 0), 0) end;
    insert into public.order_items (order_id, product_id, store_id, name, brand, image, qty, price, commission_rate,
      size, color, category, source, expiry_months, shop_name, shop_slug)
    values (v_id, it->>'productId', v_store.id, coalesce(v_prod.name, it->>'name', 'Mahsulot'), coalesce(v_prod.brand, it->>'brand', ''),
      coalesce(v_prod.image, it->>'image'), v_qty, v_price, coalesce(v_store.commission_rate, 0),
      nullif(it->>'size',''), nullif(it->>'color',''), coalesce(v_prod.category, it->>'category'), nullif(it->>'source',''),
      nullif(it->>'expiryMonths','')::int, coalesce(v_store.name, it->>'shopName'), coalesce(v_store.slug, it->>'shopSlug'));
    v_total := v_total + v_price * v_qty;
    v_comm := v_comm + round(v_price * v_qty * coalesce(v_store.commission_rate, 0) / 100.0);
    if v_first_store is null and v_store.id is not null then v_first_store := v_store.id; v_first_name := v_store.name; end if;
    if v_first_name is null then v_first_name := nullif(it->>'shopName',''); end if;
  end loop;

  update public.orders set total = v_total, commission = v_comm, shop_id = v_first_store, shop_name = v_first_name
  where id = v_id returning * into o;
  if v_paid then
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note)
    values (v_id, v_first_store, 'hold', v_total, p_user, 'Demo to‘lov: ' || o.payment || ' (haqiqiy yechim yo‘q)');
  end if;
  return jsonb_build_object('order', private.order_json(o));
end $$;

