-- StomaHub: helpers + user-facing RPCs (marketplace, orders/escrow, channels, ads, reports)

-- ───────────── helpers ─────────────
create or replace function private.is_admin(p_user uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin and blocked_at is null from public.profiles where id = p_user), false)
$$;

create or replace function private.assert_active(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null or not exists (select 1 from public.profiles where id = p_user and blocked_at is null) then
    raise exception 'blocked' using errcode = '42501';
  end if;
end $$;

-- returns admin_role or raises; p_roles = allowed roles besides owner (null = any admin)
create or replace function private.assert_admin(p_admin uuid, p_roles text[] default null)
returns text language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  select admin_role into v_role from public.profiles
  where id = p_admin and is_admin and blocked_at is null;
  if v_role is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_roles is not null and v_role <> 'owner' and not (v_role = any(p_roles)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return v_role;
end $$;

create or replace function private.audit(p_actor uuid, p_action text, p_type text, p_id text, p_details jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (p_actor, p_action, p_type, p_id, coalesce(p_details, '{}'::jsonb))
$$;

create or replace function private.profile_json(p public.profiles)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'provider', p.provider, 'fullName', p.full_name, 'phone', coalesce(p.phone,''),
    'email', p.email, 'telegramUsername', p.telegram_username, 'clinic', p.clinic, 'city', p.city,
    'specialty', p.specialty, 'bio', p.bio, 'avatarUrl', p.avatar_url,
    'role', case when p.is_admin then 'admin' else 'doctor' end,
    'isAdmin', p.is_admin and p.blocked_at is null, 'adminRole', case when p.is_admin then p.admin_role end,
    'blocked', p.blocked_at is not null,
    'createdAt', p.created_at, 'updatedAt', p.updated_at)
$$;

create or replace function private.store_json(s public.stores)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', s.id, 'slug', s.slug, 'name', s.name, 'city', s.city, 'bio', s.bio, 'phone', s.phone,
    'telegram', s.telegram, 'instagram', s.instagram, 'facebook', s.facebook, 'website', s.website,
    'address', s.address, 'yearsInBusiness', s.years_in_business, 'ownerName', s.owner_name,
    'verified', case s.status when 'active' then 'active' when 'pending' then 'pending' else 'rejected' end,
    'status', s.status,
    'rejectReason', case when s.status = 'suspended' then coalesce('Do‘kon vaqtincha to‘xtatilgan: ' || s.suspended_reason, 'Do‘kon vaqtincha to‘xtatilgan.') else s.reject_reason end,
    'appliedAt', s.applied_at, 'reviewedAt', s.reviewed_at, 'logo', s.logo, 'views', s.views,
    'commissionRate', s.commission_rate, 'createdAt', s.created_at, 'demo', true)
$$;

create or replace function private.product_json(p public.products, s public.stores)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p.id, 'name', p.name, 'brand', p.brand, 'category', p.category, 'price', p.price,
    'oldPrice', p.old_price, 'discount', p.discount, 'rating', p.rating, 'reviews', p.reviews,
    'inStock', p.active and p.stock > 0, 'delivery', p.delivery, 'image', p.image,
    'description', p.description, 'stockQty', p.stock, 'shopId', s.id, 'shopName', s.name, 'shopSlug', s.slug,
    'active', p.active, 'listedBySeller', true, 'featured', true,
    'kind', p.kind, 'sizes', to_jsonb(p.sizes), 'gender', p.gender, 'colors', to_jsonb(p.colors),
    'createdAt', p.created_at))
$$;

create or replace function private.order_json(o public.orders)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', o.id, 'createdAt', o.created_at, 'name', o.name, 'phone', o.phone, 'city', o.city,
    'address', o.address, 'note', o.note, 'payment', o.payment, 'total', o.total, 'commission', o.commission,
    'status', o.status, 'statusHistory', o.status_history, 'paymentState', o.payment_state,
    'shopId', o.shop_id, 'shopName', o.shop_name, 'confirmedAt', o.confirmed_at, 'paidAt', o.paid_at,
    'yandexTrackUrl', o.yandex_track_url, 'courierName', o.courier_name, 'courierPhone', o.courier_phone,
    'carInfo', o.car_info,
    'dispute', (select jsonb_build_object('id', d.id, 'reason', d.reason, 'status', d.status, 'resolution', d.resolution, 'createdAt', d.created_at)
                from public.disputes d where d.order_id = o.id order by d.created_at desc limit 1),
    'items', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'productId', i.product_id, 'name', i.name, 'brand', i.brand, 'image', i.image, 'qty', i.qty,
        'price', i.price, 'size', i.size, 'color', i.color, 'category', i.category, 'source', i.source,
        'expiryMonths', i.expiry_months, 'shopName', i.shop_name, 'shopSlug', i.shop_slug, 'shopId', i.store_id)) order by i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)))
$$;

create or replace function private.unique_store_slug(p_base text, p_keep uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare v text := coalesce(nullif(p_base, ''), 'dokon'); i int := 2;
begin
  while v = 'kaliti-market' or exists (select 1 from public.stores where slug = v and (p_keep is null or id <> p_keep)) loop
    v := coalesce(nullif(p_base, ''), 'dokon') || '-' || i; i := i + 1;
  end loop;
  return v;
end $$;

-- ───────────── profile / session helpers ─────────────
create or replace function public.sh_touch_last_seen(p_secret text, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  update public.profiles set last_seen_at = now()
  where id = p_user and (last_seen_at is null or last_seen_at < now() - interval '5 minutes');
end $$;

-- Called by the server when a logged-in account matches ADMIN_PHONES / ADMIN_TELEGRAM_IDS / ADMIN_EMAILS env.
create or replace function public.sh_bootstrap_owner(p_secret text, p_user uuid, p_matched_by text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where id = p_user;
  if r.id is null then return null; end if;
  if not (r.is_admin and r.admin_role = 'owner') then
    update public.profiles set is_admin = true, admin_role = 'owner', updated_at = now() where id = p_user returning * into r;
    perform private.audit(p_user, 'admin.owner_bootstrap', 'profile', p_user::text, jsonb_build_object('matchedBy', p_matched_by));
  end if;
  return private.profile_json(r);
end $$;

-- re-define credential / social functions so blocked users are reported
create or replace function public.sh_phone_credentials(p_secret text, p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where phone = p_phone and password_hash is not null limit 1;
  if r.id is null then return null; end if;
  return jsonb_build_object('passwordHash', r.password_hash, 'blocked', r.blocked_at is not null, 'profile', private.profile_json(r));
end $$;

-- ───────────── community (hidden posts, blocked users, admin via is_admin) ─────────────
create or replace function public.sh_community_feed(p_secret text, p_viewer uuid, p_limit int default 30, p_before timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((
    select jsonb_agg(private.post_json(x.id, p_viewer) order by x.created_at desc)
    from (select cp.id, cp.created_at from public.community_posts cp
          join public.profiles a on a.id = cp.author_id
          where cp.hidden_at is null and a.blocked_at is null
            and (p_before is null or cp.created_at < p_before)
          order by cp.created_at desc limit least(greatest(p_limit, 1), 100)) x
  ), '[]'::jsonb);
end $$;

create or replace function public.sh_community_post(p_secret text, p_viewer uuid, p_post uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if exists (select 1 from public.community_posts where id = p_post and hidden_at is not null
             and author_id is distinct from p_viewer) and not private.is_admin(p_viewer) then
    return null;
  end if;
  return private.post_json(p_post, p_viewer);
end $$;

create or replace function public.sh_community_create_post(p_secret text, p_user uuid, p_kind text, p_body text, p_tags text[], p_images text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  insert into public.community_posts (author_id, kind, body, tags, images)
  values (p_user, p_kind, p_body, coalesce(p_tags, '{}'), coalesce(p_images, '{}'))
  returning id into v_id;
  return private.post_json(v_id, p_user);
end $$;

create or replace function public.sh_community_delete_post(p_secret text, p_user uuid, p_post uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  delete from public.community_posts cp where cp.id = p_post and cp.author_id = p_user;
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.sh_community_toggle_like(p_secret text, p_user uuid, p_post uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if exists (select 1 from public.community_likes where post_id = p_post and user_id = p_user) then
    delete from public.community_likes where post_id = p_post and user_id = p_user;
  else
    insert into public.community_likes (post_id, user_id) values (p_post, p_user);
  end if;
  return private.post_json(p_post, p_user);
end $$;

create or replace function public.sh_community_add_comment(p_secret text, p_user uuid, p_post uuid, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  insert into public.community_comments (post_id, author_id, body) values (p_post, p_user, p_body);
  return private.post_json(p_post, p_user);
end $$;

create or replace function public.sh_community_delete_comment(p_secret text, p_user uuid, p_comment uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_post uuid;
begin
  perform private.assert_secret(p_secret);
  delete from public.community_comments c where c.id = p_comment and c.author_id = p_user
  returning c.post_id into v_post;
  if v_post is null then return null; end if;
  return private.post_json(v_post, p_user);
end $$;

create or replace function public.sh_report_post(p_secret text, p_user uuid, p_post uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if not exists (select 1 from public.community_posts where id = p_post) then
    return jsonb_build_object('error', 'not_found');
  end if;
  insert into public.community_reports (post_id, reporter_id, reason)
  values (p_post, p_user, left(coalesce(nullif(p_reason, ''), 'spam'), 300))
  on conflict (post_id, reporter_id) do update set reason = excluded.reason, status = 'open', created_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- ───────────── storage tickets (seller docs private bucket) ─────────────
create or replace function public.sh_can_read(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.read_tickets t where t.path = p_name and t.expires_at > now())
$$;

drop policy if exists "seller-docs ticket insert" on storage.objects;
create policy "seller-docs ticket insert" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'seller-docs' and public.sh_can_upload(name));
drop policy if exists "seller-docs ticket read" on storage.objects;
create policy "seller-docs ticket read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'seller-docs' and public.sh_can_read(name));

-- ───────────── marketplace: stores / applications / products ─────────────
create or replace function public.sh_public_catalog(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'shops', coalesce((select jsonb_agg(private.store_json(s) order by s.reviewed_at desc nulls last)
                       from public.stores s where s.status = 'active'), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(private.product_json(p, s) order by p.created_at desc)
                          from public.products p join public.stores s on s.id = p.store_id
                          where s.status = 'active' and p.active), '[]'::jsonb));
end $$;

create or replace function public.sh_my_store(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores;
begin
  perform private.assert_secret(p_secret);
  select * into s from public.stores where owner_id = p_user;
  if s.id is null then return jsonb_build_object('shop', null, 'products', '[]'::jsonb); end if;
  return jsonb_build_object(
    'shop', private.store_json(s),
    'application', (select jsonb_build_object('id', a.id, 'status', a.status, 'stir', a.stir, 'docs', a.docs, 'createdAt', a.created_at)
                    from public.seller_applications a where a.store_id = s.id order by a.created_at desc limit 1),
    'products', coalesce((select jsonb_agg(private.product_json(p, s) order by p.created_at desc)
                          from public.products p where p.store_id = s.id), '[]'::jsonb));
end $$;

-- p_mode: 'new' | 'update' | 'reapply'
create or replace function public.sh_submit_application(p_secret text, p_user uuid, p_mode text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores; v_slug text; v_years int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into s from public.stores where owner_id = p_user;
  v_years := case when (p_payload->>'yearsInBusiness') ~ '^\d{1,3}$' then (p_payload->>'yearsInBusiness')::int end;

  if p_mode = 'new' and s.id is not null and s.status in ('active','pending','suspended') then
    return jsonb_build_object('shop', private.store_json(s), 'existing', true);
  end if;
  if p_mode in ('update','reapply') and s.id is null then
    return jsonb_build_object('error', 'no_store');
  end if;
  if p_mode = 'update' and s.status not in ('pending','rejected') then
    return jsonb_build_object('error', 'not_editable');
  end if;

  v_slug := private.unique_store_slug(p_payload->>'slug', s.id);

  if s.id is null then
    insert into public.stores (owner_id, slug, name, city, bio, phone, owner_name, telegram, instagram, facebook, website, address, years_in_business)
    values (p_user, v_slug, p_payload->>'shopName', coalesce(nullif(p_payload->>'city',''), 'Toshkent'), p_payload->>'bio',
            p_payload->>'phone', p_payload->>'ownerName', nullif(p_payload->>'telegram',''), nullif(p_payload->>'instagram',''),
            nullif(p_payload->>'facebook',''), nullif(p_payload->>'website',''), nullif(p_payload->>'address',''), v_years)
    returning * into s;
  else
    update public.stores set
      slug = v_slug, name = p_payload->>'shopName', city = coalesce(nullif(p_payload->>'city',''), 'Toshkent'),
      bio = p_payload->>'bio', phone = p_payload->>'phone', owner_name = p_payload->>'ownerName',
      telegram = nullif(p_payload->>'telegram',''), instagram = nullif(p_payload->>'instagram',''),
      facebook = nullif(p_payload->>'facebook',''), website = nullif(p_payload->>'website',''),
      address = nullif(p_payload->>'address',''), years_in_business = v_years,
      status = case when p_mode = 'update' then status else 'pending' end,
      reject_reason = case when p_mode = 'update' then reject_reason else null end,
      applied_at = case when p_mode = 'update' then applied_at else now() end,
      updated_at = now()
    where id = s.id returning * into s;
  end if;

  if p_mode = 'update' then
    update public.seller_applications a set
      owner_name = s.owner_name, phone = s.phone, shop_name = s.name, city = s.city, bio = s.bio,
      telegram = s.telegram, instagram = s.instagram, facebook = s.facebook, website = s.website,
      address = s.address, years_in_business = s.years_in_business,
      stir = coalesce(nullif(p_payload->>'stir',''), a.stir),
      docs = case when jsonb_array_length(coalesce(p_payload->'docs','[]'::jsonb)) > 0 then p_payload->'docs' else a.docs end,
      updated_at = now()
    where a.id = (select id from public.seller_applications where store_id = s.id order by created_at desc limit 1);
  else
    insert into public.seller_applications (applicant_id, store_id, owner_name, phone, shop_name, city, bio, telegram, instagram,
      facebook, website, address, years_in_business, stir, docs)
    values (p_user, s.id, s.owner_name, s.phone, s.name, s.city, s.bio, s.telegram, s.instagram, s.facebook, s.website,
      s.address, s.years_in_business, nullif(p_payload->>'stir',''), coalesce(p_payload->'docs','[]'::jsonb));
  end if;
  return jsonb_build_object('shop', private.store_json(s));
end $$;

create or replace function public.sh_update_store(p_secret text, p_user uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into s from public.stores where owner_id = p_user;
  if s.id is null then return jsonb_build_object('error', 'no_store'); end if;
  update public.stores set
    name = coalesce(nullif(p_patch->>'name',''), name),
    slug = case when nullif(p_patch->>'name','') is not null and p_patch->>'name' <> name
                then private.unique_store_slug(p_patch->>'slug', id) else slug end,
    city = coalesce(nullif(p_patch->>'city',''), city),
    bio = coalesce(nullif(p_patch->>'bio',''), bio),
    phone = coalesce(nullif(p_patch->>'phone',''), phone),
    telegram = case when p_patch ? 'telegram' then nullif(p_patch->>'telegram','') else telegram end,
    instagram = case when p_patch ? 'instagram' then nullif(p_patch->>'instagram','') else instagram end,
    facebook = case when p_patch ? 'facebook' then nullif(p_patch->>'facebook','') else facebook end,
    website = case when p_patch ? 'website' then nullif(p_patch->>'website','') else website end,
    address = case when p_patch ? 'address' then nullif(p_patch->>'address','') else address end,
    years_in_business = case when p_patch ? 'yearsInBusiness' then
      case when (p_patch->>'yearsInBusiness') ~ '^\d{1,3}$' then (p_patch->>'yearsInBusiness')::int end else years_in_business end,
    logo = case when p_patch ? 'logo' then nullif(p_patch->>'logo','') else logo end,
    updated_at = now()
  where id = s.id returning * into s;
  return jsonb_build_object('shop', private.store_json(s));
end $$;

create or replace function public.sh_save_product(p_secret text, p_user uuid, p_product jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores; p public.products; v_id uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into s from public.stores where owner_id = p_user and status = 'active';
  if s.id is null then return jsonb_build_object('error', 'session'); end if;
  v_id := (p_product->>'id')::uuid;
  if exists (select 1 from public.products where id = v_id and store_id <> s.id) then
    return jsonb_build_object('error', 'forbidden');
  end if;
  insert into public.products as t (id, store_id, name, brand, category, price, old_price, discount, stock, delivery, description,
    image, kind, gender, sizes, colors)
  values (v_id, s.id, p_product->>'name', coalesce(p_product->>'brand',''), p_product->>'category', (p_product->>'price')::bigint,
    nullif(p_product->>'oldPrice','')::bigint, nullif(p_product->>'discount','')::int, greatest(coalesce((p_product->>'stockQty')::int, 0), 0),
    coalesce(nullif(p_product->>'delivery',''), 'Toshkent 24 soat'), coalesce(p_product->>'description',''), nullif(p_product->>'image',''),
    nullif(p_product->>'kind',''), nullif(p_product->>'gender',''),
    case when jsonb_typeof(p_product->'sizes') = 'array' then array(select jsonb_array_elements_text(p_product->'sizes')) end,
    case when jsonb_typeof(p_product->'colors') = 'array' then array(select jsonb_array_elements_text(p_product->'colors')) end)
  on conflict (id) do update set
    name = excluded.name, brand = excluded.brand, category = excluded.category, price = excluded.price,
    old_price = excluded.old_price, discount = excluded.discount, stock = excluded.stock, delivery = excluded.delivery,
    description = excluded.description, image = coalesce(excluded.image, t.image), kind = excluded.kind,
    gender = excluded.gender, sizes = excluded.sizes, colors = excluded.colors, updated_at = now()
  returning * into p;
  return jsonb_build_object('product', private.product_json(p, s));
end $$;

create or replace function public.sh_product_action(p_secret text, p_user uuid, p_product uuid, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores; n int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into s from public.stores where owner_id = p_user;
  if s.id is null then return jsonb_build_object('error', 'session'); end if;
  if p_action = 'delete' then
    delete from public.products where id = p_product and store_id = s.id;
  else
    update public.products set active = (p_action = 'activate'), updated_at = now() where id = p_product and store_id = s.id;
  end if;
  get diagnostics n = row_count;
  return jsonb_build_object('ok', n > 0);
end $$;

create or replace function public.sh_bump_store_view(p_secret text, p_store uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  update public.stores set views = views + 1 where id = p_store and status = 'active';
end $$;

-- ───────────── orders + escrow ─────────────
-- p_items: [{productId, qty, price (server-validated for static catalog), name, brand, image, size, color, category, source, expiryMonths, shopName, shopSlug}]
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
      if v_prod.id is not null then
        select * into v_store from public.stores where id = v_prod.store_id;
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

create or replace function public.sh_my_orders(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store uuid;
begin
  perform private.assert_secret(p_secret);
  select id into v_store from public.stores where owner_id = p_user;
  return jsonb_build_object(
    'buyer', coalesce((select jsonb_agg(private.order_json(o) order by o.created_at desc)
                       from (select * from public.orders where buyer_id = p_user order by created_at desc limit 100) o), '[]'::jsonb),
    'seller', coalesce((select jsonb_agg(private.order_json(o) order by o.created_at desc)
                        from (select * from public.orders o2 where v_store is not null and exists
                              (select 1 from public.order_items i where i.order_id = o2.id and i.store_id = v_store)
                              order by created_at desc limit 200) o), '[]'::jsonb),
    'shopId', v_store);
end $$;

-- internal: release escrow (commission + payouts per store)
create or replace function private.release_order(p_order text, p_actor uuid, p_note text)
returns public.orders language plpgsql security definer set search_path = '' as $$
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
  return o;
end $$;

create or replace function private.refund_order(p_order text, p_actor uuid, p_note text)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare o public.orders; it record;
begin
  update public.orders set payment_state = 'refunded', refunded_at = now(), updated_at = now()
  where id = p_order and payment_state in ('escrow_held','awaiting_payment') returning * into o;
  if o.id is null then raise exception 'not_refundable' using errcode = 'P0001'; end if;
  if o.paid_at is not null then
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note) values (p_order, o.shop_id, 'refund', o.total, p_actor, p_note);
  end if;
  for it in select product_id, qty from public.order_items where order_id = p_order and store_id is not null loop
    update public.products set stock = stock + it.qty where id::text = it.product_id;
  end loop;
  return o;
end $$;

create or replace function public.sh_seller_order_update(p_secret text, p_user uuid, p_order text, p_action text, p_track jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
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
    update public.orders set yandex_track_url = v_url, courier_name = nullif(trim(p_track->>'courierName'),''),
      courier_phone = nullif(trim(p_track->>'courierPhone'),''), car_info = nullif(trim(p_track->>'carInfo'),''), updated_at = now()
    where id = p_order returning * into o;
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
  -- cash on delivery: money is considered collected into escrow at delivery (demo)
  if v_next = 'yetkazildi' and o.payment = 'naqd' and o.paid_at is null then
    update public.orders set paid_at = now(), payment_state = 'escrow_held' where id = p_order returning * into o;
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note)
    values (p_order, o.shop_id, 'hold', o.total, p_user, 'Naqd to‘lov yetkazishda qabul qilindi (demo)');
  end if;
  return jsonb_build_object('order', private.order_json(o));
end $$;

create or replace function public.sh_confirm_order(p_secret text, p_user uuid, p_order text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  perform private.assert_secret(p_secret);
  select * into o from public.orders where id = p_order and buyer_id = p_user;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if o.status <> 'yetkazildi' then return jsonb_build_object('error', 'not_delivered'); end if;
  if o.payment_state <> 'escrow_held' then return jsonb_build_object('error', 'already'); end if;
  o := private.release_order(p_order, p_user, 'Shifokor tasdiqladi');
  update public.disputes set status = 'resolved', resolution = 'release', resolution_note = 'Shifokor buyurtmani tasdiqladi',
    resolved_by = p_user, resolved_at = now() where order_id = p_order and status = 'open';
  return jsonb_build_object('order', private.order_json(o));
end $$;

create or replace function public.sh_open_dispute(p_secret text, p_user uuid, p_order text, p_reason text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into o from public.orders where id = p_order and buyer_id = p_user;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if o.payment_state not in ('escrow_held','awaiting_payment') then return jsonb_build_object('error', 'closed'); end if;
  if exists (select 1 from public.disputes where order_id = p_order and status = 'open') then
    return jsonb_build_object('error', 'exists');
  end if;
  insert into public.disputes (order_id, opened_by, reason) values (p_order, p_user, left(p_reason, 1000));
  return jsonb_build_object('order', private.order_json(o));
end $$;

-- ───────────── channels auction ─────────────
create or replace function public.sh_channels(p_secret text, p_viewer uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'channels', coalesce((select jsonb_agg(jsonb_build_object('id', c.id, 'username', c.username, 'name', c.name,
        'category', c.category, 'avatarColor', c.avatar_color, 'createdAt', c.created_at,
        'mine', p_viewer is not null and c.owner_id = p_viewer) order by c.created_at)
      from public.channels c where c.hidden_at is null), '[]'::jsonb),
    'bids', coalesce((select jsonb_object_agg(k, amt) from (
        select channel_key k, max(amount) amt from public.channel_bids where status = 'active' group by channel_key) b), '{}'::jsonb),
    'myBidKeys', coalesce((select jsonb_agg(distinct channel_key) from public.channel_bids where bidder_id = p_viewer and p_viewer is not null), '[]'::jsonb));
end $$;

create or replace function public.sh_add_channel(p_secret text, p_user uuid, p_username text, p_name text, p_category text, p_color text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.channels;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if exists (select 1 from public.channels where lower(username) = lower(p_username)) then
    return jsonb_build_object('error', 'duplicate');
  end if;
  insert into public.channels (owner_id, username, name, category, avatar_color)
  values (p_user, p_username, left(p_name, 120), p_category, p_color) returning * into c;
  return jsonb_build_object('channel', jsonb_build_object('id', c.id, 'username', c.username, 'name', c.name,
    'category', c.category, 'avatarColor', c.avatar_color, 'createdAt', c.created_at, 'mine', true));
end $$;

create or replace function public.sh_place_bid(p_secret text, p_user uuid, p_key text, p_username text, p_amount bigint, p_min bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_amount < p_min or p_amount < coalesce((select max(amount) + 1 from public.channel_bids where status = 'active'), 0) then
    return jsonb_build_object('error', 'too_low');
  end if;
  insert into public.channel_bids (channel_key, channel_username, bidder_id, amount) values (p_key, p_username, p_user, p_amount);
  return jsonb_build_object('ok', true);
end $$;

-- ───────────── ads (public read of active ads + event logging) ─────────────
create or replace function public.sh_active_ads(p_secret text, p_placement text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(jsonb_build_object('id', a.id, 'advertiser', a.advertiser, 'title', a.title,
      'imageUrl', a.image_url, 'linkUrl', a.link_url) order by a.created_at desc)
    from public.ads a where a.status = 'active' and p_placement = any(a.placements)
      and current_date between a.starts_on and a.ends_on), '[]'::jsonb);
end $$;

create or replace function public.sh_log_ad_event(p_secret text, p_ad uuid, p_kind text, p_placement text, p_viewer uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if exists (select 1 from public.ads where id = p_ad and status = 'active') then
    insert into public.ad_events (ad_id, kind, placement, viewer_id) values (p_ad, p_kind, p_placement, p_viewer);
  end if;
end $$;
