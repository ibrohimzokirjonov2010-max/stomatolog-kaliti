-- StomaHub admin RPCs: every function requires the server secret + an admin id and re-checks the role in the DB.

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
      'reports', (select count(distinct post_id) from public.community_reports where status = 'open')));
end $$;

-- ───────────── revenue model (one row per day) ─────────────
-- commission: from orders released that day; ads: contract value prorated per day (monthly price/30 or total/duration);
-- channels: auction bids placed that day; subs: active subscriptions price/30 per day; refunds: platform-borne refunds
-- (commission of orders refunded after release — 0 by construction, kept for the formula).
create or replace function private.revenue_day(p_day date)
returns table (commission bigint, ads bigint, channels bigint, subs bigint, refunds bigint, gmv bigint, orders bigint)
language sql stable security definer set search_path = '' as $$
  select
    coalesce((select sum(l.amount) from public.escrow_ledger l where l.kind = 'commission' and l.created_at::date = p_day), 0)::bigint,
    coalesce((select sum(case when a.pricing = 'monthly' then a.price / 30.0 else a.price::numeric / (a.ends_on - a.starts_on + 1) end)
              from public.ads a where a.status <> 'draft' and p_day between a.starts_on and a.ends_on), 0)::bigint,
    coalesce((select sum(b.amount) from public.channel_bids b where b.status = 'active' and b.created_at::date = p_day), 0)::bigint,
    coalesce((select sum(s.price_monthly / 30.0) from public.seller_subscriptions s
              where s.started_at::date <= p_day and (s.ends_at is null or s.ends_at::date >= p_day)
                and (s.status = 'active' or s.ends_at is not null)), 0)::bigint,
    0::bigint,
    coalesce((select sum(o.total) from public.orders o where o.paid_at is not null and o.payment_state <> 'refunded' and o.paid_at::date = p_day), 0)::bigint,
    coalesce((select count(*) from public.orders o where o.created_at::date = p_day), 0)::bigint
$$;

create or replace function private.mrr()
returns bigint language sql stable security definer set search_path = '' as $$
  select (
    coalesce((select sum(price_monthly) from public.seller_subscriptions where status = 'active' and (ends_at is null or ends_at > now())), 0)
    + coalesce((select sum(case when pricing = 'monthly' then price else price * 30.0 / (ends_on - starts_on + 1) end)
                from public.ads where status = 'active' and current_date between starts_on and ends_on), 0)
    + coalesce((select sum(m) from (select max(amount) m from public.channel_bids
                where status = 'active' and auto_renew and date_trunc('month', created_at) = date_trunc('month', now())
                group by channel_key) x), 0)
  )::bigint
$$;

create or replace function private.period_kpis(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with d as (select r.* from generate_series(p_from, p_to, interval '1 day') g(day), lateral private.revenue_day(g.day::date) r)
  select jsonb_build_object(
    'commission', coalesce(sum(d.commission), 0), 'ads', coalesce(sum(d.ads), 0), 'channels', coalesce(sum(d.channels), 0),
    'subs', coalesce(sum(d.subs), 0), 'refunds', coalesce(sum(d.refunds), 0), 'gmv', coalesce(sum(d.gmv), 0),
    'net', coalesce(sum(d.commission + d.ads + d.channels + d.subs - d.refunds), 0),
    'orders', (select count(*) from public.orders where created_at::date between p_from and p_to),
    'delivered', (select count(*) from public.orders where created_at::date between p_from and p_to and status = 'yetkazildi'),
    'paidOrders', (select count(*) from public.orders where paid_at::date between p_from and p_to and payment_state <> 'refunded'),
    'activeUsers', (select count(*) from public.profiles where last_seen_at::date between p_from and p_to),
    'newUsers', (select count(*) from public.profiles where created_at::date between p_from and p_to),
    'newTelegram', (select count(*) from public.profiles where created_at::date between p_from and p_to and provider = 'telegram'))
  from d
$$;

create or replace function public.sh_admin_dashboard(p_secret text, p_admin uuid, p_days int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_days int := greatest(1, least(coalesce(p_days, 30), 366)); v_to date := current_date; v_from date; cur jsonb; prev jsonb; series jsonb;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  v_from := v_to - (v_days - 1);
  cur := private.period_kpis(v_from, v_to);
  prev := private.period_kpis(v_from - v_days, v_from - 1);
  if v_days <= 31 then
    select jsonb_agg(jsonb_build_object('date', g.day::date, 'net', r.commission + r.ads + r.channels + r.subs - r.refunds, 'gmv', r.gmv) order by g.day)
    into series from generate_series(least(v_from, v_to - 29), v_to, interval '1 day') g(day), lateral private.revenue_day(g.day::date) r;
  else
    select jsonb_agg(jsonb_build_object('date', m.month_start, 'net', (m.k->>'net')::bigint, 'gmv', (m.k->>'gmv')::bigint) order by m.month_start)
    into series from (select gs::date month_start, private.period_kpis(greatest(gs::date, v_from), least((gs + interval '1 month - 1 day')::date, v_to)) k
                      from generate_series(date_trunc('month', v_from::timestamp), date_trunc('month', v_to::timestamp), interval '1 month') gs) m;
  end if;
  return jsonb_build_object(
    'from', v_from, 'to', v_to, 'days', v_days, 'current', cur, 'previous', prev, 'mrr', private.mrr(),
    'escrow', jsonb_build_object(
      'amount', coalesce((select sum(total) from public.orders where payment_state = 'escrow_held'), 0),
      'orders', (select count(*) from public.orders where payment_state = 'escrow_held'),
      'disputes', (select count(*) from public.disputes where status = 'open')),
    'series', coalesce(series, '[]'::jsonb),
    'topStores', coalesce((select jsonb_agg(t order by (t->>'gmv')::bigint desc) from (
        select jsonb_build_object('id', s.id, 'name', s.name, 'city', s.city, 'slug', s.slug,
          'sales', count(distinct o.id), 'gmv', coalesce(sum(i.price * i.qty), 0),
          'commission', coalesce(sum(round(i.price * i.qty * i.commission_rate / 100.0)) filter (where o.payment_state = 'released'), 0),
          'spark', (select jsonb_agg(coalesce((select sum(i2.price * i2.qty) from public.order_items i2 join public.orders o2 on o2.id = i2.order_id
                      where i2.store_id = s.id and o2.paid_at::date = g.day::date and o2.payment_state <> 'refunded'), 0) order by g.day)
                    from generate_series(v_to - 13, v_to, interval '1 day') g(day))) t
        from public.stores s
        join public.order_items i on i.store_id = s.id
        join public.orders o on o.id = i.order_id and o.paid_at is not null and o.payment_state <> 'refunded' and o.paid_at::date between v_from and v_to
        group by s.id order by coalesce(sum(i.price * i.qty), 0) desc limit 5) x), '[]'::jsonb),
    'attention', jsonb_build_object(
      'pendingApplications', (select count(*) from public.seller_applications where status = 'pending'),
      'oldestPendingHours', (select floor(extract(epoch from now() - min(created_at)) / 3600) from public.seller_applications where status = 'pending'),
      'openDisputes', (select count(*) from public.disputes where status = 'open'),
      'disputedEscrow', coalesce((select sum(o.total) from public.disputes d join public.orders o on o.id = d.order_id where d.status = 'open'), 0),
      'reportedPosts', (select count(distinct post_id) from public.community_reports where status = 'open'),
      'staleInTransit', (select count(*) from public.orders where status = 'yolda' and status_changed_at < now() - interval '48 hours'
                           and payment_state not in ('refunded','released'))));
end $$;

-- ───────────── users ─────────────
create or replace function private.user_match(p public.profiles, q text, p_filter text, p_city text)
returns boolean language sql stable security definer set search_path = '' as $$
  select (q is null or p.full_name ilike '%' || q || '%' or coalesce(p.phone,'') ilike '%' || q || '%' or coalesce(p.email,'') ilike '%' || q || '%'
          or coalesce(p.clinic,'') ilike '%' || q || '%' or coalesce(p.telegram_username,'') ilike '%' || q || '%')
    and (p_city is null or p_city = '' or p.city = p_city)
    and (coalesce(p_filter,'all') = 'all'
      or (p_filter = 'seller' and exists (select 1 from public.stores s where s.owner_id = p.id and s.status = 'active'))
      or (p_filter = 'admin' and p.is_admin) or (p_filter = 'blocked' and p.blocked_at is not null)
      or (p_filter in ('phone','google','telegram') and p.provider = p_filter))
$$;

create or replace function public.sh_admin_users(p_secret text, p_admin uuid, p_query text, p_filter text, p_city text, p_limit int, p_offset int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare q text := nullif(trim(coalesce(p_query, '')), '');
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  return jsonb_build_object(
    'total', (select count(*) from public.profiles),
    'active30', (select count(*) from public.profiles where last_seen_at > now() - interval '30 days'),
    'today', (select count(*) from public.profiles where created_at::date = current_date),
    'counts', jsonb_build_object(
      'doctors', (select count(*) from public.profiles p where not exists (select 1 from public.stores s where s.owner_id = p.id and s.status = 'active')),
      'sellers', (select count(*) from public.stores where status = 'active'),
      'admins', (select count(*) from public.profiles where is_admin),
      'blocked', (select count(*) from public.profiles where blocked_at is not null)),
    'cities', coalesce((select jsonb_agg(distinct city) from public.profiles where city is not null and city <> ''), '[]'::jsonb),
    'matching', (select count(*) from public.profiles p where private.user_match(p, q, p_filter, p_city)),
    'rows', coalesce((select jsonb_agg(x.j order by x.created_at desc) from (
      select p.created_at, jsonb_build_object('id', p.id, 'fullName', p.full_name, 'phone', coalesce(p.phone,''), 'email', p.email,
        'provider', p.provider, 'specialty', p.specialty, 'city', p.city, 'clinic', p.clinic, 'avatarUrl', p.avatar_url,
        'isAdmin', p.is_admin, 'adminRole', p.admin_role, 'blocked', p.blocked_at is not null,
        'isSeller', exists (select 1 from public.stores s where s.owner_id = p.id and s.status = 'active'),
        'createdAt', p.created_at, 'lastSeenAt', p.last_seen_at) j
      from public.profiles p where private.user_match(p, q, p_filter, p_city)
      order by p.created_at desc limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) x), '[]'::jsonb));
end $$;

create or replace function public.sh_admin_user_detail(p_secret text, p_admin uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  select * into r from public.profiles where id = p_user;
  if r.id is null then return null; end if;
  return jsonb_build_object(
    'profile', private.profile_json(r) || jsonb_build_object('adminRole', r.admin_role, 'isAdmin', r.is_admin,
      'blockedAt', r.blocked_at, 'blockedReason', r.blocked_reason, 'lastSeenAt', r.last_seen_at),
    'posts', (select count(*) from public.community_posts where author_id = p_user),
    'orders', (select count(*) from public.orders where buyer_id = p_user),
    'spent', coalesce((select sum(total) from public.orders where buyer_id = p_user and paid_at is not null and payment_state <> 'refunded'), 0),
    'store', (select jsonb_build_object('id', s.id, 'name', s.name, 'status', s.status, 'slug', s.slug) from public.stores s where s.owner_id = p_user),
    'recentOrders', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'shopName', o.shop_name, 'total', o.total,
        'createdAt', o.created_at, 'paymentState', o.payment_state, 'status', o.status,
        'items', (select coalesce(sum(qty), 0) from public.order_items where order_id = o.id)) order by o.created_at desc)
      from (select * from public.orders where buyer_id = p_user order by created_at desc limit 3) o), '[]'::jsonb));
end $$;

create or replace function public.sh_admin_set_block(p_secret text, p_admin uuid, p_user uuid, p_blocked boolean, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_role text;
begin
  perform private.assert_secret(p_secret);
  v_role := private.assert_admin(p_admin, array['admin','moderator']);
  if p_user = p_admin then return jsonb_build_object('error', 'self'); end if;
  select * into r from public.profiles where id = p_user;
  if r.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if r.is_admin and r.admin_role = 'owner' then return jsonb_build_object('error', 'owner'); end if;
  if r.is_admin and v_role <> 'owner' then return jsonb_build_object('error', 'forbidden'); end if;
  update public.profiles set blocked_at = case when p_blocked then now() end,
    blocked_reason = case when p_blocked then left(nullif(p_reason, ''), 300) end, updated_at = now()
  where id = p_user returning * into r;
  perform private.audit(p_admin, case when p_blocked then 'user.block' else 'user.unblock' end, 'profile', p_user::text,
    jsonb_build_object('name', r.full_name, 'reason', p_reason));
  return jsonb_build_object('ok', true);
end $$;

-- p_role: null/'' = regular user, or admin|moderator|finance. Owner only.
create or replace function public.sh_admin_set_role(p_secret text, p_admin uuid, p_user uuid, p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_role text := nullif(p_role, ''); v_prev text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array[]::text[]);
  if v_role is not null and v_role not in ('admin','moderator','finance') then return jsonb_build_object('error', 'invalid'); end if;
  if p_user = p_admin then return jsonb_build_object('error', 'self'); end if;
  select * into r from public.profiles where id = p_user;
  if r.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if r.admin_role = 'owner' and r.is_admin then return jsonb_build_object('error', 'owner'); end if;
  v_prev := case when r.is_admin then r.admin_role end;
  update public.profiles set is_admin = v_role is not null, admin_role = v_role, updated_at = now() where id = p_user;
  perform private.audit(p_admin, 'user.role', 'profile', p_user::text, jsonb_build_object('name', r.full_name, 'from', v_prev, 'to', v_role));
  return jsonb_build_object('ok', true);
end $$;
