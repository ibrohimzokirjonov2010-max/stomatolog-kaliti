-- Seller finance: read-only ledger summary + payout *requests* (no real money movement).
create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  amount bigint not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','paid','rejected')),
  note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists payout_requests_store_idx on public.payout_requests (store_id, created_at desc);
alter table public.payout_requests enable row level security;
revoke all on public.payout_requests from anon, authenticated;

create or replace function public.sh_seller_finance(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_released bigint; v_comm bigint; v_reserved bigint; v_held bigint; v_held_comm bigint; v_held_n int;
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
  return jsonb_build_object(
    'commissionRate', v_store.commission_rate,
    'released', v_released, 'commission', v_comm, 'reserved', v_reserved,
    'balance', greatest(v_released - v_reserved, 0),
    'held', v_held - v_held_comm, 'heldGross', v_held, 'heldCommission', v_held_comm, 'heldOrders', v_held_n,
    'ledger', coalesce((select jsonb_agg(x order by x->>'createdAt' desc) from (
        select jsonb_build_object('id', l.id, 'orderId', l.order_id, 'kind', l.kind, 'amount', l.amount,
          'createdAt', l.created_at, 'payment', o.payment) x
        from public.escrow_ledger l left join public.orders o on o.id = l.order_id
        where l.store_id = v_store.id and l.kind in ('release','commission')
        order by l.created_at desc limit 500) t), '[]'::jsonb),
    'payouts', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'amount', p.amount, 'status', p.status, 'createdAt', p.created_at) order by p.created_at desc)
        from (select * from public.payout_requests where store_id = v_store.id order by created_at desc limit 50) p), '[]'::jsonb));
end $$;

create or replace function public.sh_request_payout(p_secret text, p_user uuid, p_amount bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_released bigint; v_reserved bigint; v_id uuid;
begin
  perform private.assert_secret(p_secret);
  select * into v_store from public.stores where owner_id = p_user and status = 'active' for update;
  if v_store.id is null then return jsonb_build_object('error', 'no_store'); end if;
  if p_amount is null or p_amount <= 0 then return jsonb_build_object('error', 'amount'); end if;
  select coalesce(sum(amount), 0) into v_released from public.escrow_ledger where store_id = v_store.id and kind = 'release';
  select coalesce(sum(amount), 0) into v_reserved from public.payout_requests where store_id = v_store.id and status in ('pending','paid');
  if p_amount > v_released - v_reserved then return jsonb_build_object('error', 'insufficient'); end if;
  insert into public.payout_requests (store_id, amount) values (v_store.id, p_amount) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
