-- StomaHub admin RPCs (part 2): stores, applications, orders/escrow, ads, channels, content, audit, grants

create or replace function private.store_metrics(p_store uuid, p_from date)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'sales', count(distinct o.id),
    'gmv', coalesce(sum(i.price * i.qty), 0),
    'commission', coalesce(sum(round(i.price * i.qty * i.commission_rate / 100.0)) filter (where o.payment_state = 'released'), 0),
    'avgCheck', case when count(distinct o.id) > 0 then round(coalesce(sum(i.price * i.qty), 0) / count(distinct o.id)) else 0 end)
  from public.order_items i join public.orders o on o.id = i.order_id
  where i.store_id = p_store and o.paid_at is not null and o.payment_state <> 'refunded' and o.paid_at::date >= p_from
$$;

create or replace function public.sh_admin_stores(p_secret text, p_admin uuid, p_days int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_from date := current_date - (greatest(1, least(coalesce(p_days, 30), 366)) - 1);
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  return jsonb_build_object(
    'rows', coalesce((select jsonb_agg(private.store_json(s) || jsonb_build_object('ownerId', s.owner_id, 'plan', s.plan,
        'ownerFullName', (select full_name from public.profiles where id = s.owner_id),
        'products', (select count(*) from public.products where store_id = s.id),
        'metrics', private.store_metrics(s.id, v_from)) order by s.created_at desc)
      from public.stores s where s.status in ('active','suspended')), '[]'::jsonb),
    'totals', (select jsonb_build_object('gmv', coalesce(sum(i.price * i.qty), 0),
        'commission', coalesce(sum(round(i.price * i.qty * i.commission_rate / 100.0)) filter (where o.payment_state = 'released'), 0),
        'orders', count(distinct o.id))
      from public.order_items i join public.orders o on o.id = i.order_id
      where i.store_id is not null and o.paid_at is not null and o.payment_state <> 'refunded' and o.paid_at::date >= v_from),
    'active', (select count(*) from public.stores where status = 'active'),
    'all', (select count(*) from public.stores where status in ('active','suspended')));
end $$;

create or replace function public.sh_admin_store_detail(p_secret text, p_admin uuid, p_store uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  select * into s from public.stores where id = p_store;
  if s.id is null then return null; end if;
  return jsonb_build_object(
    'store', private.store_json(s) || jsonb_build_object('plan', s.plan, 'suspendedReason', s.suspended_reason),
    'metrics', private.store_metrics(s.id, current_date - 29),
    'series', (select jsonb_agg(jsonb_build_object('date', g.day::date, 'gmv', coalesce((select sum(i.price * i.qty) from public.order_items i
                 join public.orders o on o.id = i.order_id where i.store_id = s.id and o.paid_at::date = g.day::date and o.payment_state <> 'refunded'), 0)) order by g.day)
               from generate_series(current_date - 29, current_date, interval '1 day') g(day)),
    'topProducts', coalesce((select jsonb_agg(t order by (t->>'revenue')::bigint desc) from (
        select jsonb_build_object('name', i.name, 'brand', i.brand, 'qty', sum(i.qty), 'revenue', sum(i.price * i.qty)) t
        from public.order_items i join public.orders o on o.id = i.order_id
        where i.store_id = s.id and o.paid_at is not null and o.payment_state <> 'refunded'
        group by i.name, i.brand order by sum(i.price * i.qty) desc limit 4) x), '[]'::jsonb),
    'escrow', coalesce((select sum(i.price * i.qty) from public.order_items i join public.orders o on o.id = i.order_id
                        where i.store_id = s.id and o.payment_state = 'escrow_held'), 0),
    'disputes', (select count(*) from public.disputes d where d.status = 'open' and exists
                  (select 1 from public.order_items i where i.order_id = d.order_id and i.store_id = s.id)),
    'refundRate', (select case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where o.payment_state = 'refunded') / count(*), 1) end
                   from public.orders o where exists (select 1 from public.order_items i where i.order_id = o.id and i.store_id = s.id)),
    'products', (select count(*) from public.products where store_id = s.id),
    'ownerPhone', (select phone from public.profiles where id = s.owner_id));
end $$;

-- p_action: 'suspend' | 'activate' | 'commission'
create or replace function public.sh_admin_store_action(p_secret text, p_admin uuid, p_store uuid, p_action text, p_value text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores; v_rate numeric;
begin
  perform private.assert_secret(p_secret);
  select * into s from public.stores where id = p_store;
  if s.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if p_action = 'suspend' then
    perform private.assert_admin(p_admin, array['admin','moderator']);
    update public.stores set status = 'suspended', suspended_reason = left(nullif(p_value,''), 300), updated_at = now() where id = p_store;
  elsif p_action = 'activate' then
    perform private.assert_admin(p_admin, array['admin','moderator']);
    update public.stores set status = 'active', suspended_reason = null, updated_at = now() where id = p_store;
  elsif p_action = 'commission' then
    perform private.assert_admin(p_admin, array['admin','finance']);
    v_rate := p_value::numeric;
    if v_rate < 0 or v_rate > 50 then return jsonb_build_object('error', 'invalid'); end if;
    update public.stores set commission_rate = v_rate, updated_at = now() where id = p_store;
  else
    return jsonb_build_object('error', 'invalid');
  end if;
  perform private.audit(p_admin, 'store.' || p_action, 'store', p_store::text, jsonb_build_object('name', s.name, 'value', p_value));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_admin_applications(p_secret text, p_admin uuid, p_status text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  return jsonb_build_object(
    'counts', jsonb_build_object(
      'pending', (select count(*) from public.seller_applications where status = 'pending'),
      'approved', (select count(*) from public.seller_applications where status = 'approved'),
      'rejected', (select count(*) from public.seller_applications where status = 'rejected')),
    'avgReviewHours', (select round(avg(extract(epoch from reviewed_at - created_at) / 3600)) from public.seller_applications where reviewed_at is not null),
    'rows', coalesce((select jsonb_agg(jsonb_build_object(
        'id', a.id, 'status', a.status, 'ownerName', a.owner_name, 'phone', a.phone, 'shopName', a.shop_name, 'city', a.city,
        'bio', a.bio, 'telegram', a.telegram, 'instagram', a.instagram, 'facebook', a.facebook, 'website', a.website,
        'address', a.address, 'yearsInBusiness', a.years_in_business, 'stir', a.stir, 'docs', a.docs,
        'rejectReason', a.reject_reason, 'createdAt', a.created_at, 'reviewedAt', a.reviewed_at, 'storeId', a.store_id,
        'applicant', jsonb_build_object('id', p.id, 'fullName', p.full_name, 'phone', p.phone, 'provider', p.provider),
        'duplicate', exists (select 1 from public.seller_applications a2 where a2.id <> a.id and a2.applicant_id <> a.applicant_id
                             and (a2.phone = a.phone or (a.stir is not null and a2.stir = a.stir))))
        order by case when a.status = 'pending' then a.created_at end asc, a.created_at desc)
      from public.seller_applications a join public.profiles p on p.id = a.applicant_id
      where a.status = coalesce(nullif(p_status,''), 'pending')), '[]'::jsonb));
end $$;

create or replace function public.sh_admin_review_application(p_secret text, p_admin uuid, p_app uuid, p_approve boolean, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.seller_applications;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','moderator']);
  select * into a from public.seller_applications where id = p_app;
  if a.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if a.status <> 'pending' then return jsonb_build_object('error', 'already'); end if;
  if not p_approve and nullif(trim(coalesce(p_reason,'')), '') is null then return jsonb_build_object('error', 'reason'); end if;
  update public.seller_applications set status = case when p_approve then 'approved' else 'rejected' end,
    reject_reason = case when p_approve then null else left(p_reason, 500) end,
    reviewed_by = p_admin, reviewed_at = now(), updated_at = now() where id = p_app;
  update public.stores set status = case when p_approve then 'active' else 'rejected' end,
    reject_reason = case when p_approve then null else left(p_reason, 500) end,
    reviewed_by = p_admin, reviewed_at = now(), updated_at = now() where id = a.store_id;
  perform private.audit(p_admin, case when p_approve then 'application.approve' else 'application.reject' end, 'application', p_app::text,
    jsonb_build_object('shop', a.shop_name, 'reason', p_reason));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_admin_doc_ticket(p_secret text, p_admin uuid, p_app uuid, p_path text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  if not exists (select 1 from public.seller_applications a, jsonb_array_elements(a.docs) d where a.id = p_app and d->>'path' = p_path) then
    return false;
  end if;
  delete from private.read_tickets where expires_at < now();
  insert into private.read_tickets (path, expires_at) values (p_path, now() + interval '1 minute')
  on conflict (path) do update set expires_at = excluded.expires_at;
  return true;
end $$;

create or replace function public.sh_admin_orders(p_secret text, p_admin uuid, p_filter text, p_query text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare q text := nullif(trim(coalesce(p_query,'')), '');
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  return jsonb_build_object(
    'kpis', jsonb_build_object(
      'escrowAmount', coalesce((select sum(total) from public.orders where payment_state = 'escrow_held'), 0),
      'escrowOrders', (select count(*) from public.orders where payment_state = 'escrow_held'),
      'avgHoldHours', (select round(avg(extract(epoch from now() - paid_at) / 3600)) from public.orders where payment_state = 'escrow_held'),
      'released30', coalesce((select sum(amount) from public.escrow_ledger where kind = 'release' and created_at > now() - interval '30 days'), 0),
      'releasedOrders30', (select count(*) from public.orders where released_at > now() - interval '30 days'),
      'commission30', coalesce((select sum(amount) from public.escrow_ledger where kind = 'commission' and created_at > now() - interval '30 days'), 0),
      'disputeAmount', coalesce((select sum(o.total) from public.disputes d join public.orders o on o.id = d.order_id where d.status = 'open'), 0),
      'disputes', (select count(*) from public.disputes where status = 'open')),
    'counts', jsonb_build_object(
      'all', (select count(*) from public.orders),
      'escrow', (select count(*) from public.orders where payment_state = 'escrow_held'),
      'awaiting', (select count(*) from public.orders where payment_state = 'escrow_held' and status = 'yetkazildi'),
      'disputed', (select count(*) from public.disputes where status = 'open'),
      'released', (select count(*) from public.orders where payment_state = 'released'),
      'refunded', (select count(*) from public.orders where payment_state = 'refunded')),
    'rows', coalesce((select jsonb_agg(private.order_json(o) || jsonb_build_object(
        'buyerName', (select full_name from public.profiles where id = o.buyer_id), 'statusChangedAt', o.status_changed_at,
        'releasedAt', o.released_at, 'refundedAt', o.refunded_at) order by o.created_at desc)
      from (select * from public.orders o where
          (q is null or o.id ilike '%' || q || '%' or o.name ilike '%' || q || '%' or coalesce(o.shop_name,'') ilike '%' || q || '%')
          and (coalesce(p_filter,'all') = 'all'
            or (p_filter = 'escrow' and o.payment_state = 'escrow_held')
            or (p_filter = 'awaiting' and o.payment_state = 'escrow_held' and o.status = 'yetkazildi')
            or (p_filter = 'disputed' and exists (select 1 from public.disputes d where d.order_id = o.id and d.status = 'open'))
            or (p_filter = 'released' and o.payment_state = 'released')
            or (p_filter = 'refunded' and o.payment_state = 'refunded'))
          order by o.created_at desc limit 200) o), '[]'::jsonb));
end $$;

create or replace function public.sh_admin_resolve_order(p_secret text, p_admin uuid, p_order text, p_resolution text, p_note text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','finance']);
  select * into o from public.orders where id = p_order;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if p_resolution = 'release' then
    if o.payment_state <> 'escrow_held' then return jsonb_build_object('error', 'state'); end if;
    o := private.release_order(p_order, p_admin, coalesce('Admin: ' || nullif(p_note,''), 'Admin qarori: sotuvchiga o‘tkazildi'));
  elsif p_resolution = 'refund' then
    if o.payment_state not in ('escrow_held','awaiting_payment') then return jsonb_build_object('error', 'state'); end if;
    o := private.refund_order(p_order, p_admin, coalesce('Admin: ' || nullif(p_note,''), 'Admin qarori: shifokorga qaytarildi'));
  else
    return jsonb_build_object('error', 'invalid');
  end if;
  update public.disputes set status = 'resolved', resolution = p_resolution, resolution_note = left(p_note, 500),
    resolved_by = p_admin, resolved_at = now() where order_id = p_order and status = 'open';
  perform private.audit(p_admin, 'order.' || p_resolution, 'order', p_order, jsonb_build_object('total', o.total, 'note', p_note));
  return jsonb_build_object('order', private.order_json(o));
end $$;

create or replace function public.sh_admin_ads(p_secret text, p_admin uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  return jsonb_build_object(
    'rows', coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'advertiser', a.advertiser, 'title', a.title, 'imageUrl', a.image_url,
        'placements', to_jsonb(a.placements), 'startsOn', a.starts_on, 'endsOn', a.ends_on, 'pricing', a.pricing, 'price', a.price,
        'linkUrl', a.link_url, 'status', case when a.status = 'active' and a.ends_on < current_date then 'ended'
                                          when a.status = 'active' and a.starts_on > current_date then 'scheduled' else a.status end,
        'createdAt', a.created_at,
        'views', (select count(*) from public.ad_events e where e.ad_id = a.id and e.kind = 'view'),
        'clicks', (select count(*) from public.ad_events e where e.ad_id = a.id and e.kind = 'click'),
        'revenue', case when a.status = 'draft' or a.starts_on > current_date then 0 else
          round((case when a.pricing = 'monthly' then a.price / 30.0 else a.price::numeric / (a.ends_on - a.starts_on + 1) end)
                * (least(a.ends_on, current_date) - a.starts_on + 1)) end)
      order by a.created_at desc) from public.ads a), '[]'::jsonb),
    'revenue30', (select coalesce(sum(r.ads), 0) from generate_series(current_date - 29, current_date, interval '1 day') g(day), lateral private.revenue_day(g.day::date) r),
    'channels30', coalesce((select sum(amount) from public.channel_bids where status = 'active' and created_at > now() - interval '30 days'), 0),
    'views30', (select count(*) from public.ad_events where kind = 'view' and created_at > now() - interval '30 days'),
    'clicks30', (select count(*) from public.ad_events where kind = 'click' and created_at > now() - interval '30 days'));
end $$;

create or replace function public.sh_admin_save_ad(p_secret text, p_admin uuid, p_ad jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.ads; v_id uuid := nullif(p_ad->>'id','')::uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','finance']);
  if v_id is null then
    insert into public.ads (advertiser, title, image_url, placements, starts_on, ends_on, pricing, price, link_url, status, created_by)
    values (p_ad->>'advertiser', coalesce(p_ad->>'title',''), p_ad->>'imageUrl',
      array(select jsonb_array_elements_text(p_ad->'placements')), (p_ad->>'startsOn')::date, (p_ad->>'endsOn')::date,
      coalesce(p_ad->>'pricing','monthly'), coalesce((p_ad->>'price')::bigint, 0), nullif(p_ad->>'linkUrl',''),
      coalesce(p_ad->>'status','active'), p_admin) returning * into a;
    perform private.audit(p_admin, 'ad.create', 'ad', a.id::text, jsonb_build_object('advertiser', a.advertiser, 'status', a.status, 'price', a.price));
  else
    update public.ads set advertiser = coalesce(p_ad->>'advertiser', advertiser), title = coalesce(p_ad->>'title', title),
      image_url = coalesce(p_ad->>'imageUrl', image_url),
      placements = case when p_ad ? 'placements' then array(select jsonb_array_elements_text(p_ad->'placements')) else placements end,
      starts_on = coalesce((p_ad->>'startsOn')::date, starts_on), ends_on = coalesce((p_ad->>'endsOn')::date, ends_on),
      pricing = coalesce(p_ad->>'pricing', pricing), price = coalesce((p_ad->>'price')::bigint, price),
      link_url = case when p_ad ? 'linkUrl' then nullif(p_ad->>'linkUrl','') else link_url end,
      status = coalesce(p_ad->>'status', status), updated_at = now()
    where id = v_id returning * into a;
    if a.id is null then return jsonb_build_object('error', 'not_found'); end if;
    perform private.audit(p_admin, 'ad.update', 'ad', a.id::text, jsonb_build_object('advertiser', a.advertiser, 'status', a.status));
  end if;
  return jsonb_build_object('ok', true, 'id', a.id);
end $$;

create or replace function public.sh_admin_delete_ad(p_secret text, p_admin uuid, p_ad uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','finance']);
  delete from public.ads where id = p_ad returning advertiser into v;
  if v is null then return jsonb_build_object('error', 'not_found'); end if;
  perform private.audit(p_admin, 'ad.delete', 'ad', p_ad::text, jsonb_build_object('advertiser', v));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_admin_channels(p_secret text, p_admin uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  return jsonb_build_object(
    'channels', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'username', c.username, 'name', c.name, 'category', c.category,
        'hidden', c.hidden_at is not null, 'createdAt', c.created_at,
        'owner', (select full_name from public.profiles where id = c.owner_id),
        'topBid', (select max(amount) from public.channel_bids b where b.channel_key = c.id::text and b.status = 'active')) order by c.created_at desc)
      from public.channels c), '[]'::jsonb),
    'bids', coalesce((select jsonb_agg(jsonb_build_object('id', b.id, 'key', b.channel_key, 'username', b.channel_username, 'amount', b.amount,
        'autoRenew', b.auto_renew, 'status', b.status, 'createdAt', b.created_at,
        'bidder', (select full_name from public.profiles where id = b.bidder_id)) order by b.created_at desc)
      from (select * from public.channel_bids order by created_at desc limit 200) b), '[]'::jsonb),
    'monthly', coalesce((select jsonb_agg(jsonb_build_object('month', m, 'amount', s) order by m) from (
        select date_trunc('month', created_at)::date m, sum(amount) s from public.channel_bids where status = 'active'
        and created_at > date_trunc('month', now()) - interval '5 months' group by 1) x), '[]'::jsonb),
    'mrr', coalesce((select sum(m) from (select max(amount) m from public.channel_bids where status = 'active' and auto_renew
                     and date_trunc('month', created_at) = date_trunc('month', now()) group by channel_key) x), 0));
end $$;

create or replace function public.sh_admin_channel_action(p_secret text, p_admin uuid, p_action text, p_target text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','moderator','finance']);
  if p_action = 'hide_channel' then update public.channels set hidden_at = now() where id = p_target::uuid;
  elsif p_action = 'show_channel' then update public.channels set hidden_at = null where id = p_target::uuid;
  elsif p_action = 'cancel_bid' then update public.channel_bids set status = 'cancelled' where id = p_target::bigint;
  else return jsonb_build_object('error', 'invalid'); end if;
  perform private.audit(p_admin, 'channel.' || p_action, 'channel', p_target, '{}'::jsonb);
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_admin_content(p_secret text, p_admin uuid, p_filter text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  return jsonb_build_object(
    'counts', jsonb_build_object(
      'reported', (select count(distinct r.post_id) from public.community_reports r where r.status = 'open'),
      'all', (select count(*) from public.community_posts),
      'hidden', (select count(*) from public.community_posts where hidden_at is not null)),
    'rows', coalesce((select jsonb_agg(x.j order by x.created_at desc) from (
      select cp.created_at, jsonb_build_object('id', cp.id, 'body', left(cp.body, 300), 'kind', cp.kind, 'createdAt', cp.created_at,
        'hidden', cp.hidden_at is not null, 'images', cardinality(cp.images),
        'author', jsonb_build_object('id', a.id, 'fullName', a.full_name, 'blocked', a.blocked_at is not null),
        'likes', (select count(*) from public.community_likes l where l.post_id = cp.id),
        'comments', (select count(*) from public.community_comments c where c.post_id = cp.id),
        'reports', (select count(*) from public.community_reports r where r.post_id = cp.id and r.status = 'open'),
        'reasons', (select jsonb_agg(distinct r.reason) from public.community_reports r where r.post_id = cp.id and r.status = 'open')) j
      from public.community_posts cp join public.profiles a on a.id = cp.author_id
      where case coalesce(p_filter, 'reported')
        when 'reported' then exists (select 1 from public.community_reports r where r.post_id = cp.id and r.status = 'open')
        when 'hidden' then cp.hidden_at is not null
        else true end
      order by cp.created_at desc limit 200) x), '[]'::jsonb));
end $$;

create or replace function public.sh_admin_moderate_post(p_secret text, p_admin uuid, p_post uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_author text; v_body text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','moderator']);
  select a.full_name, left(cp.body, 120) into v_author, v_body from public.community_posts cp join public.profiles a on a.id = cp.author_id where cp.id = p_post;
  if v_author is null then return jsonb_build_object('error', 'not_found'); end if;
  if p_action = 'hide' then
    update public.community_posts set hidden_at = now(), hidden_by = p_admin where id = p_post;
    update public.community_reports set status = 'resolved', resolved_by = p_admin, resolved_at = now() where post_id = p_post and status = 'open';
  elsif p_action = 'unhide' then
    update public.community_posts set hidden_at = null, hidden_by = null where id = p_post;
  elsif p_action = 'dismiss' then
    update public.community_reports set status = 'dismissed', resolved_by = p_admin, resolved_at = now() where post_id = p_post and status = 'open';
  elsif p_action = 'delete' then
    delete from public.community_posts where id = p_post;
  else
    return jsonb_build_object('error', 'invalid');
  end if;
  perform private.audit(p_admin, 'post.' || p_action, 'post', p_post::text, jsonb_build_object('author', v_author, 'excerpt', v_body));
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_admin_audit(p_secret text, p_admin uuid, p_limit int)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  return coalesce((select jsonb_agg(jsonb_build_object('id', l.id, 'action', l.action, 'targetType', l.target_type, 'targetId', l.target_id,
      'details', l.details, 'createdAt', l.created_at, 'actor', (select full_name from public.profiles where id = l.actor_id)) order by l.created_at desc)
    from (select * from public.audit_log order by created_at desc limit least(greatest(coalesce(p_limit, 100), 1), 500)) l), '[]'::jsonb);
end $$;

create or replace function public.sh_admin_log(p_secret text, p_admin uuid, p_action text, p_type text, p_id text, p_details jsonb)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  perform private.audit(p_admin, p_action, p_type, p_id, p_details);
end $$;

-- grants: only sh_* entry points are callable (all secret-gated except sh_can_upload / sh_can_read used by storage policies)
revoke all on all functions in schema private from public, anon, authenticated;
do $$ declare f record; begin
  for f in select p.oid::regprocedure sig from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname like 'sh\_%' loop
    execute format('revoke execute on function %s from public', f.sig);
    execute format('grant execute on function %s to anon, authenticated', f.sig);
  end loop;
end $$;
