-- Seller cabinet: messages (conversations), reviews, seller settings. All access goes through SECURITY DEFINER RPCs.

/* ───────────── messages ───────────── */
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  order_id text references public.orders(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  topic text not null default 'general' check (topic in ('order','product','general')),
  seller_archived boolean not null default false,
  last_message text,
  last_message_at timestamptz not null default now(),
  seller_unread int not null default 0,
  buyer_unread int not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists conversations_ctx_uq on public.conversations
  (store_id, buyer_id, coalesce(order_id, ''), coalesce(product_id::text, ''));
create index if not exists conversations_store_idx on public.conversations (store_id, last_message_at desc);
create index if not exists conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('buyer','seller')),
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 2000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages (conversation_id, id);

/* ───────────── reviews ───────────── */
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text,
  product_image text,
  order_id text not null references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  r_quality smallint check (r_quality between 1 and 5),
  r_delivery smallint check (r_delivery between 1 and 5),
  r_packaging smallint check (r_packaging between 1 and 5),
  r_service smallint check (r_service between 1 and 5),
  r_value smallint check (r_value between 1 and 5),
  body text not null default '' check (char_length(body) <= 2000),
  images text[] not null default '{}',
  seller_reply text check (seller_reply is null or char_length(seller_reply) between 1 and 1500),
  seller_reply_at timestamptz,
  seller_reply_edited_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists reviews_once_uq on public.reviews (order_id, coalesce(product_id::text, ''), buyer_id);
create index if not exists reviews_store_idx on public.reviews (store_id, created_at desc);

/* ───────────── seller settings ───────────── */
create table if not exists public.seller_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  min_order bigint not null default 0 check (min_order >= 0),
  closed boolean not null default false,
  notify jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['conversations','messages','reviews','seller_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

/* closed store / minimum order are enforced where order lines are written */
create or replace function private.order_item_rules() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.store_id is not null and exists (select 1 from public.seller_settings s where s.store_id = new.store_id and s.closed) then
    raise exception 'store_closed' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists order_items_rules on public.order_items;
create trigger order_items_rules before insert on public.order_items for each row execute function private.order_item_rules();

create or replace function private.order_min_check() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_min bigint; v_sum bigint;
begin
  if new.store_id is null then return null; end if;
  select min_order into v_min from public.seller_settings where store_id = new.store_id;
  if coalesce(v_min, 0) > 0 then
    select coalesce(sum(price * qty), 0) into v_sum from public.order_items where order_id = new.order_id and store_id = new.store_id;
    if v_sum < v_min then raise exception 'min_order' using errcode = 'P0001'; end if;
  end if;
  return null;
end $$;
drop trigger if exists order_items_min on public.order_items;
create constraint trigger order_items_min after insert on public.order_items deferrable initially deferred
  for each row execute function private.order_min_check();

/* ───────────── message RPCs ───────────── */
create or replace function private.conv_json(c public.conversations)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', c.id, 'topic', c.topic, 'orderId', c.order_id, 'productId', c.product_id, 'storeId', c.store_id,
    'archived', c.seller_archived, 'lastMessage', c.last_message, 'lastMessageAt', c.last_message_at, 'createdAt', c.created_at,
    'sellerUnread', c.seller_unread, 'buyerUnread', c.buyer_unread,
    'storeName', (select s.name from public.stores s where s.id = c.store_id),
    'product', (select jsonb_build_object('id', p.id, 'name', p.name, 'price', p.price, 'image', p.image) from public.products p where p.id = c.product_id),
    'order', (select jsonb_build_object('id', o.id, 'createdAt', o.created_at, 'status', o.status, 'payment', o.payment,
        'paymentState', o.payment_state,
        'total', coalesce((select sum(i.price * i.qty) from public.order_items i where i.order_id = o.id and i.store_id = c.store_id), 0),
        'qty', coalesce((select sum(i.qty) from public.order_items i where i.order_id = o.id and i.store_id = c.store_id), 0),
        'name', (select i.name from public.order_items i where i.order_id = o.id and i.store_id = c.store_id order by i.id limit 1),
        'image', (select i.image from public.order_items i where i.order_id = o.id and i.store_id = c.store_id order by i.id limit 1))
      from public.orders o where o.id = c.order_id)
  ))
$$;

-- buyer card for the seller: contact data is shared only if the buyer has ordered from this store
create or replace function private.conv_buyer(p_buyer uuid, p_store uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p.id, 'name', p.full_name, 'registeredAt', p.created_at,
    'orders', (select count(*) from public.orders o where o.buyer_id = p.id and exists (select 1 from public.order_items i where i.order_id = o.id and i.store_id = p_store)),
    'phone', (select o.phone from public.orders o where o.buyer_id = p.id and exists (select 1 from public.order_items i where i.order_id = o.id and i.store_id = p_store) order by o.created_at desc limit 1),
    'city', coalesce((select o.city from public.orders o where o.buyer_id = p.id and exists (select 1 from public.order_items i where i.order_id = o.id and i.store_id = p_store) order by o.created_at desc limit 1), p.city),
    'telegram', case when exists (select 1 from public.orders o where o.buyer_id = p.id and exists (select 1 from public.order_items i where i.order_id = o.id and i.store_id = p_store)) then p.telegram_username end,
    'recent', coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'createdAt', r.created_at, 'status', r.status, 'total', r.total) order by r.created_at desc)
        from (select o.id, o.created_at, o.status,
                (select coalesce(sum(i.price * i.qty), 0) from public.order_items i where i.order_id = o.id and i.store_id = p_store) total
              from public.orders o where o.buyer_id = p.id and exists (select 1 from public.order_items i where i.order_id = o.id and i.store_id = p_store)
              order by o.created_at desc limit 3) r), '[]'::jsonb)))
  from public.profiles p where p.id = p_buyer
$$;

create or replace function public.sh_conv_list(p_secret text, p_user uuid, p_role text, p_store uuid default null, p_product uuid default null, p_order text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store uuid;
begin
  perform private.assert_secret(p_secret);
  if p_role = 'seller' then
    select id into v_store from public.stores where owner_id = p_user;
    if v_store is null then return '[]'::jsonb; end if;
    return coalesce((select jsonb_agg(private.conv_json(c) || jsonb_build_object('buyer', private.conv_buyer(c.buyer_id, c.store_id)) order by c.last_message_at desc)
      from (select * from public.conversations where store_id = v_store order by last_message_at desc limit 200) c), '[]'::jsonb);
  end if;
  return coalesce((select jsonb_agg(private.conv_json(c) order by c.last_message_at desc)
    from (select * from public.conversations where buyer_id = p_user
            and (p_store is null or store_id = p_store) and (p_product is null or product_id = p_product) and (p_order is null or order_id = p_order)
          order by last_message_at desc limit 50) c), '[]'::jsonb);
end $$;

create or replace function public.sh_conv_unread(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store uuid;
begin
  perform private.assert_secret(p_secret);
  select id into v_store from public.stores where owner_id = p_user;
  if v_store is null then return jsonb_build_object('count', 0); end if;
  return jsonb_build_object('count', (select count(*) from public.conversations where store_id = v_store and seller_unread > 0 and not seller_archived));
end $$;

create or replace function public.sh_conv_messages(p_secret text, p_user uuid, p_conv uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.conversations; v_owner uuid; v_role text;
begin
  perform private.assert_secret(p_secret);
  select * into c from public.conversations where id = p_conv;
  if c.id is null then return jsonb_build_object('error', 'not_found'); end if;
  select owner_id into v_owner from public.stores where id = c.store_id;
  if p_user = v_owner then v_role := 'seller'; elsif p_user = c.buyer_id then v_role := 'buyer'; else return jsonb_build_object('error', 'not_found'); end if;
  update public.messages set read_at = now() where conversation_id = p_conv and read_at is null and sender_role <> v_role;
  if v_role = 'seller' then update public.conversations set seller_unread = 0 where id = p_conv and seller_unread <> 0;
  else update public.conversations set buyer_unread = 0 where id = p_conv and buyer_unread <> 0; end if;
  return jsonb_build_object('role', v_role, 'messages', coalesce((select jsonb_agg(jsonb_build_object('id', m.id, 'from', m.sender_role, 'body', m.body, 'createdAt', m.created_at, 'readAt', m.read_at) order by m.id)
    from (select * from public.messages where conversation_id = p_conv order by id desc limit 300) m), '[]'::jsonb));
end $$;

create or replace function public.sh_conv_send(p_secret text, p_user uuid, p_conv uuid, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.conversations; v_owner uuid; v_role text; v_body text := btrim(coalesce(p_body, ''));
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if char_length(v_body) < 1 or char_length(v_body) > 2000 then return jsonb_build_object('error', 'body'); end if;
  select * into c from public.conversations where id = p_conv;
  if c.id is null then return jsonb_build_object('error', 'not_found'); end if;
  select owner_id into v_owner from public.stores where id = c.store_id;
  if p_user = v_owner then v_role := 'seller'; elsif p_user = c.buyer_id then v_role := 'buyer'; else return jsonb_build_object('error', 'not_found'); end if;
  insert into public.messages (conversation_id, sender_role, sender_id, body) values (p_conv, v_role, p_user, v_body);
  update public.conversations set last_message = left(v_body, 160), last_message_at = now(),
    seller_unread = seller_unread + case when v_role = 'buyer' then 1 else 0 end,
    buyer_unread = buyer_unread + case when v_role = 'seller' then 1 else 0 end,
    seller_archived = case when v_role = 'buyer' then false else seller_archived end
  where id = p_conv;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_conv_start(p_secret text, p_user uuid, p_store uuid, p_product uuid, p_order text, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store public.stores; v_id uuid; v_topic text; v_body text := btrim(coalesce(p_body, ''));
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if char_length(v_body) < 1 or char_length(v_body) > 2000 then return jsonb_build_object('error', 'body'); end if;
  select * into v_store from public.stores where id = p_store and status = 'active';
  if v_store.id is null then return jsonb_build_object('error', 'no_store'); end if;
  if v_store.owner_id = p_user then return jsonb_build_object('error', 'own_store'); end if;
  if p_product is not null and not exists (select 1 from public.products where id = p_product and store_id = p_store) then return jsonb_build_object('error', 'bad_context'); end if;
  if p_order is not null and not exists (select 1 from public.orders o where o.id = p_order and o.buyer_id = p_user
       and exists (select 1 from public.order_items i where i.order_id = o.id and i.store_id = p_store)) then return jsonb_build_object('error', 'bad_context'); end if;
  v_topic := case when p_order is not null then 'order' when p_product is not null then 'product' else 'general' end;
  insert into public.conversations (store_id, buyer_id, order_id, product_id, topic)
  values (p_store, p_user, p_order, p_product, v_topic)
  on conflict (store_id, buyer_id, coalesce(order_id, ''), coalesce(product_id::text, '')) do update set topic = excluded.topic
  returning id into v_id;
  return public.sh_conv_send(p_secret, p_user, v_id, v_body) || jsonb_build_object('id', v_id);
end $$;

create or replace function public.sh_conv_archive(p_secret text, p_user uuid, p_conv uuid, p_archived boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  update public.conversations c set seller_archived = coalesce(p_archived, true)
  where c.id = p_conv and c.store_id in (select id from public.stores where owner_id = p_user);
  get diagnostics n = row_count;
  if n = 0 then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('ok', true);
end $$;

/* ───────────── review RPCs ───────────── */
create or replace function private.review_json(r public.reviews)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', r.id, 'rating', r.rating, 'body', r.body, 'images', to_jsonb(r.images), 'createdAt', r.created_at,
    'orderId', r.order_id, 'productId', r.product_id,
    'productName', coalesce((select p.name from public.products p where p.id = r.product_id), r.product_name),
    'productImage', coalesce((select p.image from public.products p where p.id = r.product_id), r.product_image),
    'productPrice', (select p.price from public.products p where p.id = r.product_id),
    'buyerName', (select pr.full_name from public.profiles pr where pr.id = r.buyer_id),
    'reply', r.seller_reply, 'replyAt', r.seller_reply_at, 'replyEditedAt', r.seller_reply_edited_at,
    'cats', jsonb_strip_nulls(jsonb_build_object('quality', r.r_quality, 'delivery', r.r_delivery, 'packaging', r.r_packaging, 'service', r.r_service, 'value', r.r_value))))
$$;

create or replace function public.sh_seller_reviews(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store uuid;
begin
  perform private.assert_secret(p_secret);
  select id into v_store from public.stores where owner_id = p_user;
  if v_store is null then return jsonb_build_object('error', 'no_store'); end if;
  return jsonb_build_object('storeId', v_store, 'reviews', coalesce((select jsonb_agg(private.review_json(r) order by r.created_at desc)
    from (select * from public.reviews where store_id = v_store order by created_at desc limit 1000) r), '[]'::jsonb));
end $$;

create or replace function public.sh_review_reply(p_secret text, p_user uuid, p_review uuid, p_text text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_text text := btrim(coalesce(p_text, '')); r public.reviews;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if char_length(v_text) < 1 or char_length(v_text) > 1500 then return jsonb_build_object('error', 'body'); end if;
  update public.reviews x set
    seller_reply_edited_at = case when x.seller_reply is not null then now() else null end,
    seller_reply_at = coalesce(x.seller_reply_at, now()),
    seller_reply = v_text
  where x.id = p_review and x.store_id in (select id from public.stores where owner_id = p_user)
  returning * into r;
  if r.id is null then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('review', private.review_json(r));
end $$;

create or replace function public.sh_review_create(p_secret text, p_user uuid, p_order text, p_product text, p_rating int, p_cats jsonb, p_body text, p_images jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders; it public.order_items; v_pid uuid; r public.reviews; v_imgs text[];
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_rating is null or p_rating < 1 or p_rating > 5 then return jsonb_build_object('error', 'rating'); end if;
  select * into o from public.orders where id = p_order and buyer_id = p_user;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if o.status <> 'yetkazildi' or o.payment_state = 'refunded' then return jsonb_build_object('error', 'not_delivered'); end if;
  select * into it from public.order_items where order_id = p_order and product_id = p_product and store_id is not null limit 1;
  if it.id is null then return jsonb_build_object('error', 'not_found'); end if;
  begin v_pid := p_product::uuid; exception when others then v_pid := null; end;
  if v_pid is not null and not exists (select 1 from public.products where id = v_pid) then v_pid := null; end if;
  select coalesce(array_agg(x), '{}') into v_imgs from (select jsonb_array_elements_text(coalesce(p_images, '[]'::jsonb)) x limit 4) q;
  begin
    insert into public.reviews (store_id, product_id, product_name, product_image, order_id, buyer_id, rating,
      r_quality, r_delivery, r_packaging, r_service, r_value, body, images)
    values (it.store_id, v_pid, it.name, it.image, p_order, p_user, p_rating,
      nullif(p_cats->>'quality', '')::smallint, nullif(p_cats->>'delivery', '')::smallint, nullif(p_cats->>'packaging', '')::smallint,
      nullif(p_cats->>'service', '')::smallint, nullif(p_cats->>'value', '')::smallint, left(btrim(coalesce(p_body, '')), 2000), v_imgs)
    returning * into r;
  exception when unique_violation then return jsonb_build_object('error', 'already');
            when check_violation then return jsonb_build_object('error', 'rating'); end;
  if v_pid is not null then
    update public.products set rating = (select round(avg(rating)::numeric, 2) from public.reviews where product_id = v_pid),
      reviews = (select count(*) from public.reviews where product_id = v_pid) where id = v_pid;
  end if;
  return jsonb_build_object('review', private.review_json(r));
end $$;

create or replace function public.sh_review_order_state(p_secret text, p_user uuid, p_order text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'eligible', exists (select 1 from public.orders o where o.id = p_order and o.buyer_id = p_user and o.status = 'yetkazildi' and o.payment_state <> 'refunded'),
    'reviewed', coalesce((select jsonb_agg(jsonb_build_object('productId', coalesce(r.product_id::text, ''), 'rating', r.rating)) from public.reviews r where r.order_id = p_order and r.buyer_id = p_user), '[]'::jsonb));
end $$;

create or replace function public.sh_review_summary(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store uuid;
begin
  perform private.assert_secret(p_secret);
  select id into v_store from public.stores where owner_id = p_user;
  if v_store is null then return jsonb_build_object('count', 0, 'avg', null, 'unanswered', 0); end if;
  return (select jsonb_build_object('count', count(*), 'avg', round(avg(rating)::numeric, 2), 'unanswered', count(*) filter (where seller_reply is null))
    from public.reviews where store_id = v_store);
end $$;

/* ───────────── settings & password RPCs ───────────── */
create or replace function public.sh_get_settings(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores; t public.seller_settings; pr public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into pr from public.profiles where id = p_user;
  select * into s from public.stores where owner_id = p_user;
  select * into t from public.seller_settings where store_id = s.id;
  return jsonb_strip_nulls(jsonb_build_object('hasStore', s.id is not null, 'status', s.status, 'minOrder', coalesce(t.min_order, 0),
    'closed', coalesce(t.closed, false), 'notify', coalesce(t.notify, '{}'::jsonb), 'hasPassword', pr.password_hash is not null,
    'provider', pr.provider, 'phoneVerified', pr.phone_verified_at is not null));
end $$;

create or replace function public.sh_save_settings(p_secret text, p_user uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores; v_min bigint; v_notify jsonb := '{}'::jsonb; k text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into s from public.stores where owner_id = p_user;
  if s.id is null then return jsonb_build_object('error', 'no_store'); end if;
  insert into public.seller_settings (store_id) values (s.id) on conflict (store_id) do nothing;
  if p_patch ? 'minOrder' then
    v_min := greatest(0, least(1000000000, coalesce(nullif(p_patch->>'minOrder', '')::bigint, 0)));
    update public.seller_settings set min_order = v_min, updated_at = now() where store_id = s.id;
  end if;
  if p_patch ? 'closed' then
    update public.seller_settings set closed = coalesce((p_patch->>'closed')::boolean, false), updated_at = now() where store_id = s.id;
  end if;
  if p_patch ? 'notify' then
    foreach k in array array['newOrders','orderStatus','messages','reviews','marketing'] loop
      if (p_patch->'notify') ? k then v_notify := v_notify || jsonb_build_object(k, coalesce((p_patch->'notify'->>k)::boolean, false)); end if;
    end loop;
    update public.seller_settings set notify = notify || v_notify, updated_at = now() where store_id = s.id;
  end if;
  return public.sh_get_settings(p_secret, p_user);
end $$;

create or replace function public.sh_user_credentials(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return (select jsonb_build_object('passwordHash', password_hash) from public.profiles where id = p_user and blocked_at is null);
end $$;

create or replace function public.sh_change_password(p_secret text, p_user uuid, p_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  update public.profiles set password_hash = p_hash, updated_at = now() where id = p_user and password_hash is not null;
  if not found then return jsonb_build_object('error', 'no_password'); end if;
  return jsonb_build_object('ok', true);
end $$;

do $$ declare f text; begin
  foreach f in array array[
    'sh_conv_list(text,uuid,text,uuid,uuid,text)','sh_conv_unread(text,uuid)','sh_conv_messages(text,uuid,uuid)','sh_conv_send(text,uuid,uuid,text)',
    'sh_conv_start(text,uuid,uuid,uuid,text,text)','sh_conv_archive(text,uuid,uuid,boolean)','sh_seller_reviews(text,uuid)',
    'sh_review_reply(text,uuid,uuid,text)','sh_review_create(text,uuid,text,text,int,jsonb,text,jsonb)','sh_review_order_state(text,uuid,text)',
    'sh_review_summary(text,uuid)','sh_get_settings(text,uuid)','sh_save_settings(text,uuid,jsonb)','sh_user_credentials(text,uuid)',
    'sh_change_password(text,uuid,text)'] loop
    execute format('revoke execute on function public.%s from public', f);
    execute format('grant execute on function public.%s to anon, authenticated', f);
  end loop;
end $$;
