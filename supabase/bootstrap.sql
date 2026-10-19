-- StomaHub schema for an EMPTY Supabase project (eu-central-1).
-- Idempotent: safe to run twice.
--
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -v db_secret='YOUR_STOMAHUB_DB_SECRET' -f supabase/bootstrap.sql
--
-- How STOMAHUB_DB_SECRET is checked
-- ---------------------------------
-- It is NOT stored in plaintext and NOT hardcoded in this file.
-- private.assert_secret(p_secret) (first migration) reads private.app_config
-- where key = 'server_secret_sha256' and compares it to
-- encode(extensions.digest(p_secret, 'sha256'), 'hex').
-- Every app RPC sends p_secret from the server env STOMAHUB_DB_SECRET.
-- This script writes that hash from the psql variable db_secret (-v db_secret=...).
-- A second run updates the hash, so rotating the secret is the same command.
--
-- What this file includes, in filename order
-- ------------------------------------------
-- extensions (pgcrypto in schema extensions), private.app_config, RLS, grants,
-- storage buckets community / product-docs / seller-docs and their ticket policies,
-- platform store + StomaHub brand, commission 12% (private.marketplace_commission_rate),
-- bonus rules, legal/contact site_settings table (empty until an admin saves them),
-- and the 20261019a unpaid-order + CRM changes, then hot-query indexes.
--
-- Hosted Supabase already provides roles anon / authenticated / service_role,
-- schemas auth, storage, extensions, and auth.uid(). Do not run
-- supabase/local-supabase-stub.sql on the hosted project.

\set ON_ERROR_STOP on
\if :{?db_secret}
\else
\echo 'Missing -v db_secret=... (the new STOMAHUB_DB_SECRET, at least 16 characters)'
-- \quit does not set a non-zero status on this psql. Force ON_ERROR_STOP to fail the script.
select 1/0;
\endif

-- psql substitutes :'db_secret' here (it does not substitute inside dollar quotes).
select set_config('stomahub.bootstrap_secret', :'db_secret', false);
do $secret_len$
begin
  if length(current_setting('stomahub.bootstrap_secret')) < 16 then
    raise exception 'db_secret must be at least 16 characters. Pass -v db_secret=...';
  end if;
end
$secret_len$;

-- ════════════════════════════════════════
-- 20260925_stomahub_profiles_community.sql
-- ════════════════════════════════════════
-- StomaHub: real profiles + community (server-gated access; see README trust model)
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_config (
  key text primary key,
  value text not null
);

create table if not exists private.upload_tickets (
  path text primary key,
  user_id uuid not null,
  expires_at timestamptz not null
);

create or replace function private.assert_secret(p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  select value into v from private.app_config where key = 'server_secret_sha256';
  if v is null or p_secret is null
     or encode(extensions.digest(p_secret, 'sha256'), 'hex') <> v then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

-- ───────────── tables ─────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('phone','google','telegram')),
  provider_uid text not null,
  password_hash text,
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text,
  email text,
  telegram_username text,
  clinic text,
  city text,
  specialty text,
  bio text check (bio is null or char_length(bio) <= 1000),
  avatar_url text,
  role text not null default 'doctor' check (role in ('doctor','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_uid)
);
create unique index if not exists profiles_phone_unique on public.profiles (phone) where phone is not null and phone <> '';

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'case' check (kind in ('case','savol','yangilik')),
  body text not null check (char_length(body) between 1 and 5000),
  tags text[] not null default '{}',
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists community_posts_created_idx on public.community_posts (created_at desc);

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

-- RLS on, no policies: anon/authenticated cannot touch these tables directly.
alter table public.profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_comments enable row level security;
revoke all on public.profiles, public.community_posts, public.community_likes, public.community_comments from anon, authenticated;

-- ───────────── helpers ─────────────
create or replace function private.profile_json(p public.profiles)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'provider', p.provider, 'fullName', p.full_name, 'phone', coalesce(p.phone,''),
    'email', p.email, 'telegramUsername', p.telegram_username, 'clinic', p.clinic, 'city', p.city,
    'specialty', p.specialty, 'bio', p.bio, 'avatarUrl', p.avatar_url, 'role', p.role,
    'createdAt', p.created_at, 'updatedAt', p.updated_at)
$$;

create or replace function private.post_json(p_post_id uuid, p_viewer uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', cp.id, 'kind', cp.kind, 'body', cp.body, 'tags', to_jsonb(cp.tags), 'images', to_jsonb(cp.images),
    'createdAt', cp.created_at,
    'author', jsonb_build_object('id', a.id, 'fullName', a.full_name, 'specialty', a.specialty,
                                 'city', a.city, 'avatarUrl', a.avatar_url),
    'likeCount', (select count(*) from public.community_likes l where l.post_id = cp.id),
    'likedByMe', coalesce((select true from public.community_likes l where l.post_id = cp.id and l.user_id = p_viewer), false),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'body', c.body, 'createdAt', c.created_at,
        'author', jsonb_build_object('id', ca.id, 'fullName', ca.full_name, 'avatarUrl', ca.avatar_url))
        order by c.created_at)
      from public.community_comments c join public.profiles ca on ca.id = c.author_id
      where c.post_id = cp.id), '[]'::jsonb)
  )
  from public.community_posts cp join public.profiles a on a.id = cp.author_id
  where cp.id = p_post_id
$$;

-- ───────────── auth / profile RPCs (server-only, secret-gated) ─────────────
create or replace function public.sh_upsert_social(p_secret text, p_provider text, p_uid text, p_full_name text,
  p_email text, p_telegram_username text, p_avatar_url text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  insert into public.profiles (provider, provider_uid, full_name, email, telegram_username, avatar_url)
  values (p_provider, p_uid, left(p_full_name, 120), p_email, p_telegram_username, p_avatar_url)
  on conflict (provider, provider_uid) do update set
    email = coalesce(public.profiles.email, excluded.email),
    telegram_username = coalesce(excluded.telegram_username, public.profiles.telegram_username),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url)
  returning * into r;
  return private.profile_json(r);
end $$;

create or replace function public.sh_register_phone(p_secret text, p_full_name text, p_phone text, p_password_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  if exists (select 1 from public.profiles where phone = p_phone) then
    return jsonb_build_object('error', 'exists');
  end if;
  insert into public.profiles (provider, provider_uid, full_name, phone, password_hash)
  values ('phone', p_phone, left(p_full_name, 120), p_phone, p_password_hash)
  returning * into r;
  return private.profile_json(r);
end $$;

create or replace function public.sh_phone_credentials(p_secret text, p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where phone = p_phone and password_hash is not null limit 1;
  if r.id is null then return null; end if;
  return jsonb_build_object('passwordHash', r.password_hash, 'profile', private.profile_json(r));
end $$;

create or replace function public.sh_get_profile(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where id = p_user;
  if r.id is null then return null; end if;
  return private.profile_json(r);
end $$;

create or replace function public.sh_update_profile(p_secret text, p_user uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_phone text;
begin
  perform private.assert_secret(p_secret);
  v_phone := nullif(p_patch->>'phone', '');
  if v_phone is not null and exists (select 1 from public.profiles where phone = v_phone and id <> p_user) then
    return jsonb_build_object('error', 'exists');
  end if;
  update public.profiles set
    full_name = coalesce(nullif(p_patch->>'fullName', ''), full_name),
    phone = case when p_patch ? 'phone' then v_phone else phone end,
    clinic = case when p_patch ? 'clinic' then nullif(p_patch->>'clinic', '') else clinic end,
    city = case when p_patch ? 'city' then nullif(p_patch->>'city', '') else city end,
    specialty = case when p_patch ? 'specialty' then nullif(p_patch->>'specialty', '') else specialty end,
    bio = case when p_patch ? 'bio' then nullif(p_patch->>'bio', '') else bio end,
    avatar_url = case when p_patch ? 'avatarUrl' then nullif(p_patch->>'avatarUrl', '') else avatar_url end,
    updated_at = now()
  where id = p_user
  returning * into r;
  if r.id is null then return jsonb_build_object('error', 'not_found'); end if;
  return private.profile_json(r);
end $$;

-- ───────────── community RPCs ─────────────
create or replace function public.sh_community_feed(p_secret text, p_viewer uuid, p_limit int default 30, p_before timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((
    select jsonb_agg(private.post_json(x.id, p_viewer) order by x.created_at desc)
    from (select id, created_at from public.community_posts
          where p_before is null or created_at < p_before
          order by created_at desc limit least(greatest(p_limit, 1), 100)) x
  ), '[]'::jsonb);
end $$;

create or replace function public.sh_community_post(p_secret text, p_viewer uuid, p_post uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return private.post_json(p_post, p_viewer);
end $$;

create or replace function public.sh_community_create_post(p_secret text, p_user uuid, p_kind text, p_body text, p_tags text[], p_images text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.assert_secret(p_secret);
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
  delete from public.community_posts cp
  where cp.id = p_post
    and (cp.author_id = p_user or exists (select 1 from public.profiles p where p.id = p_user and p.role = 'admin'));
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.sh_community_toggle_like(p_secret text, p_user uuid, p_post uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
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
  insert into public.community_comments (post_id, author_id, body) values (p_post, p_user, p_body);
  return private.post_json(p_post, p_user);
end $$;

create or replace function public.sh_community_delete_comment(p_secret text, p_user uuid, p_comment uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_post uuid;
begin
  perform private.assert_secret(p_secret);
  delete from public.community_comments c
  where c.id = p_comment
    and (c.author_id = p_user or exists (select 1 from public.profiles p where p.id = p_user and p.role = 'admin'))
  returning c.post_id into v_post;
  if v_post is null then return null; end if;
  return private.post_json(v_post, p_user);
end $$;

-- ───────────── storage: public bucket, uploads only via server-issued tickets ─────────────
create or replace function public.sh_create_upload_ticket(p_secret text, p_user uuid, p_path text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  delete from private.upload_tickets where expires_at < now();
  insert into private.upload_tickets (path, user_id, expires_at) values (p_path, p_user, now() + interval '15 minutes');
  return true;
end $$;

create or replace function public.sh_can_upload(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.upload_tickets t where t.path = p_name and t.expires_at > now())
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community', 'community', true, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community ticket insert" on storage.objects;
create policy "community ticket insert" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'community' and public.sh_can_upload(name));
drop policy if exists "community public read" on storage.objects;
create policy "community public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'community');

-- lock down function execution: only these entry points are callable, all secret-gated except sh_can_upload
revoke all on all functions in schema private from public, anon, authenticated;
revoke execute on function public.sh_upsert_social, public.sh_register_phone, public.sh_phone_credentials,
  public.sh_get_profile, public.sh_update_profile, public.sh_community_feed, public.sh_community_post,
  public.sh_community_create_post(text, uuid, text, text, text[], text[]), public.sh_community_delete_post, public.sh_community_toggle_like,
  public.sh_community_add_comment, public.sh_community_delete_comment, public.sh_create_upload_ticket,
  public.sh_can_upload from public;
grant execute on function public.sh_upsert_social, public.sh_register_phone, public.sh_phone_credentials,
  public.sh_get_profile, public.sh_update_profile, public.sh_community_feed, public.sh_community_post,
  public.sh_community_create_post(text, uuid, text, text, text[], text[]), public.sh_community_delete_post, public.sh_community_toggle_like,
  public.sh_community_add_comment, public.sh_community_delete_comment, public.sh_create_upload_ticket,
  public.sh_can_upload to anon, authenticated;

-- ════════════════════════════════════════
-- 20260925b_stomahub_admin_schema.sql
-- ════════════════════════════════════════
-- StomaHub admin panel: schema (roles, marketplace, escrow, ads, channels, moderation, audit)
-- Same trust model: RLS on, no policies, anon/authenticated revoked; access only via secret-gated sh_* RPCs.

-- ───────────── profiles: admin + moderation fields ─────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists admin_role text check (admin_role in ('owner','admin','moderator','finance')),
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists last_seen_at timestamptz;

alter table public.community_posts
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.profiles(id) on delete set null;

-- ───────────── marketplace ─────────────
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text not null unique,
  name text not null check (char_length(name) between 1 and 120),
  city text not null default 'Toshkent',
  bio text not null default '',
  phone text not null default '',
  owner_name text not null default '',
  telegram text, instagram text, facebook text, website text, address text,
  years_in_business int,
  logo text,
  status text not null default 'pending' check (status in ('pending','active','rejected','suspended')),
  reject_reason text,
  suspended_reason text,
  applied_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  views int not null default 0,
  commission_rate numeric(5,2) not null default 8 check (commission_rate >= 0 and commission_rate <= 50),
  plan text not null default 'start',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  owner_name text not null,
  phone text not null,
  shop_name text not null,
  city text not null default 'Toshkent',
  bio text not null default '',
  telegram text, instagram text, facebook text, website text, address text,
  years_in_business int,
  stir text,
  docs jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reject_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seller_applications_status_idx on public.seller_applications (status, created_at);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  brand text not null default '',
  category text not null check (category in ('materiallar','implantlar','asboblar','jihozlar','laboratoriya','forma')),
  price bigint not null check (price > 0),
  old_price bigint,
  discount int,
  stock int not null default 0 check (stock >= 0),
  delivery text not null default 'Toshkent 24 soat',
  description text not null default '',
  image text,
  kind text, gender text,
  sizes text[], colors text[],
  active boolean not null default true,
  rating numeric(3,2) not null default 0,
  reviews int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_store_idx on public.products (store_id);

create sequence if not exists public.order_no_seq start 10001;

create table if not exists public.orders (
  id text primary key,
  buyer_id uuid references public.profiles(id) on delete set null,
  name text not null, phone text not null, city text not null default '', address text not null, note text not null default '',
  payment text not null check (payment in ('click','payme','naqd')),
  total bigint not null check (total >= 0),
  commission bigint not null default 0,
  status text not null default 'pending_accept'
    check (status in ('pending_accept','qabul_qilindi','yigilmoqda','yigish_tugadi','yolda','yetkazildi')),
  status_history jsonb not null default '[]'::jsonb,
  payment_state text not null default 'awaiting_payment'
    check (payment_state in ('awaiting_payment','escrow_held','released','refunded')),
  shop_id uuid references public.stores(id) on delete set null,
  shop_name text,
  yandex_track_url text, courier_name text, courier_phone text, car_info text,
  paid_at timestamptz, confirmed_at timestamptz, released_at timestamptz, refunded_at timestamptz,
  status_changed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null,
  store_id uuid references public.stores(id) on delete set null,
  name text not null, brand text not null default '', image text,
  qty int not null check (qty > 0),
  price bigint not null check (price >= 0),
  commission_rate numeric(5,2) not null default 0,
  size text, color text, category text, source text, expiry_months int,
  shop_name text, shop_slug text
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_store_idx on public.order_items (store_id);

create table if not exists public.escrow_ledger (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  kind text not null check (kind in ('hold','commission','release','refund')),
  amount bigint not null,
  actor_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists escrow_ledger_order_idx on public.escrow_ledger (order_id);

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders(id) on delete cascade,
  opened_by uuid references public.profiles(id) on delete set null,
  reason text not null check (char_length(reason) between 1 and 1000),
  status text not null default 'open' check (status in ('open','resolved')),
  resolution text check (resolution in ('release','refund')),
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists disputes_one_open on public.disputes (order_id) where status = 'open';

create table if not exists public.seller_subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  plan text not null,
  price_monthly bigint not null check (price_monthly >= 0),
  status text not null default 'active' check (status in ('active','cancelled')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

-- ───────────── ads ─────────────
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  advertiser text not null check (char_length(advertiser) between 1 and 160),
  title text not null default '',
  image_url text not null,
  placements text[] not null check (placements <@ array['home','marketplace','seminar','community']::text[] and cardinality(placements) > 0),
  starts_on date not null,
  ends_on date not null,
  pricing text not null default 'monthly' check (pricing in ('monthly','total')),
  price bigint not null default 0 check (price >= 0),
  link_url text,
  status text not null default 'active' check (status in ('draft','active','paused','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on >= starts_on)
);

create table if not exists public.ad_events (
  id bigint generated always as identity primary key,
  ad_id uuid not null references public.ads(id) on delete cascade,
  kind text not null check (kind in ('view','click')),
  placement text,
  viewer_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists ad_events_ad_idx on public.ad_events (ad_id, kind);

-- ───────────── channels auction ─────────────
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  username text not null,
  name text not null,
  category text not null,
  avatar_color text not null default '#0066FF',
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists channels_username_unique on public.channels (lower(username));

create table if not exists public.channel_bids (
  id bigint generated always as identity primary key,
  channel_key text not null,         -- seed channel id (ch-…) or channels.id
  channel_username text not null,
  bidder_id uuid references public.profiles(id) on delete set null,
  amount bigint not null check (amount > 0),
  auto_renew boolean not null default true,
  status text not null default 'active' check (status in ('active','cancelled')),
  created_at timestamptz not null default now()
);
create index if not exists channel_bids_key_idx on public.channel_bids (channel_key, amount desc);

-- ───────────── moderation + audit ─────────────
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null default 'spam',
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- lock down
do $$ declare t text; begin
  foreach t in array array['stores','seller_applications','products','orders','order_items','escrow_ledger','disputes',
    'seller_subscriptions','ads','ad_events','channels','channel_bids','community_reports','audit_log'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;
revoke all on sequence public.order_no_seq from anon, authenticated;

-- private bucket for seller KYC documents (no public read; reads only via short-lived server read tickets)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seller-docs', 'seller-docs', false, 8388608, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create table if not exists private.read_tickets (
  path text primary key,
  expires_at timestamptz not null
);

-- ════════════════════════════════════════
-- 20260925c_stomahub_admin_user_rpcs.sql
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- 20260925d_stomahub_admin_rpcs.sql
-- ════════════════════════════════════════
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
drop function if exists private.revenue_day(date) cascade;
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

-- ════════════════════════════════════════
-- 20260925e_stomahub_admin_rpcs2.sql
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- 20260925f_stomahub_session_ping.sql
-- ════════════════════════════════════════
drop function if exists public.sh_bootstrap_owner(text, uuid, text);

-- One call per /api/auth/me or login: touches last_seen (throttled 5 min) and promotes the account to owner
-- when it matches the ADMIN_* env lists passed by the server. Matching uses immutable identifiers only:
-- phone accounts by the phone they registered with (provider_uid), Google by email (not user-editable), Telegram by id.
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
      when r.provider = 'phone' and r.provider_uid = any(coalesce(p_phones, '{}')) and r.phone = r.provider_uid then 'phone'
      when r.provider = 'google' and lower(coalesce(r.email, '')) = any(coalesce(p_emails, '{}')) then 'email'
      when r.provider = 'telegram' and r.provider_uid = any(coalesce(p_telegram, '{}')) then 'telegram'
    end;
    if v_match is not null then
      update public.profiles set is_admin = true, admin_role = 'owner', updated_at = now() where id = p_user returning * into r;
      perform private.audit(p_user, 'admin.owner_bootstrap', 'profile', p_user::text, jsonb_build_object('matchedBy', v_match));
    end if;
  end if;
  return private.profile_json(r);
end $$;
revoke execute on function public.sh_session_ping(text, uuid, text[], text[], text[]) from public;
grant execute on function public.sh_session_ping(text, uuid, text[], text[], text[]) to anon, authenticated;

-- ════════════════════════════════════════
-- 20260925g_stomahub_order_guard.sql
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- 20260926a_stomahub_phone_otp_bonus.sql
-- ════════════════════════════════════════
-- StomaHub: phone verification (Telegram Gateway OTP) + new-doctor bonus (50 000 so'm, Marketplace only)
-- Same trust model: tables RLS on / no policies / anon+authenticated revoked; access only via secret-gated sh_* RPCs.

-- ───────────── private schema hardening (advisor: RLS disabled) ─────────────
-- private is not exposed via PostgREST and USAGE is revoked; RLS is defense-in-depth.
-- SECURITY DEFINER functions run as the table owner (postgres) and bypass RLS (no FORCE), so they keep working.
alter table private.app_config enable row level security;
alter table private.upload_tickets enable row level security;
alter table private.read_tickets enable row level security;
revoke all on private.app_config, private.upload_tickets, private.read_tickets from public, anon, authenticated;

-- ───────────── profiles ─────────────
alter table public.profiles add column if not exists phone_verified_at timestamptz;

-- ───────────── OTP codes ─────────────
create table if not exists public.otp_codes (
  id uuid primary key,
  phone text not null check (phone ~ '^[0-9]{9}$'),
  purpose text not null check (purpose in ('register','verify','reset')),
  user_id uuid references public.profiles(id) on delete cascade,
  code_hash text not null,
  channel text not null default 'telegram' check (channel in ('telegram','test')),
  request_id text,
  delivery_status text,
  ip_hash text,
  attempts int not null default 0,
  max_attempts int not null default 5,
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists otp_codes_phone_idx on public.otp_codes (phone, created_at desc);
create index if not exists otp_codes_ip_idx on public.otp_codes (ip_hash, created_at desc);
create index if not exists otp_codes_request_idx on public.otp_codes (request_id);

-- ───────────── bonus ─────────────
-- permanent: a phone number receives the signup bonus at most once, ever (survives profile deletion)
create table if not exists public.bonus_phone_grants (
  phone text primary key check (phone ~ '^[0-9]{9}$'),
  user_id uuid references public.profiles(id) on delete set null,
  amount bigint not null,
  granted_at timestamptz not null default now()
);

create table if not exists public.bonus_ledger (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  grant_id bigint references public.bonus_ledger(id) on delete cascade,
  kind text not null check (kind in ('grant','spend','refund','expire')),
  amount bigint not null,           -- grant/refund > 0, spend/expire < 0
  expires_at timestamptz,           -- grants only (extended on refund if needed)
  order_id text references public.orders(id) on delete set null,
  phone text,
  note text,
  created_at timestamptz not null default now(),
  check ((kind in ('grant','refund') and amount > 0) or (kind in ('spend','expire') and amount < 0)),
  check ((kind = 'grant') = (grant_id is null))
);
create index if not exists bonus_ledger_user_idx on public.bonus_ledger (user_id, kind);
create index if not exists bonus_ledger_grant_idx on public.bonus_ledger (grant_id);
create index if not exists bonus_ledger_order_idx on public.bonus_ledger (order_id);

alter table public.orders add column if not exists bonus_used bigint not null default 0 check (bonus_used >= 0);

alter table public.escrow_ledger drop constraint if exists escrow_ledger_kind_check;
alter table public.escrow_ledger add constraint escrow_ledger_kind_check
  check (kind in ('hold','commission','release','refund','bonus'));

do $$ declare t text; begin
  foreach t in array array['otp_codes','bonus_phone_grants','bonus_ledger'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
  end loop;
end $$;

-- ───────────── bonus helpers ─────────────
create or replace function private.bonus_rules()
returns jsonb language sql immutable set search_path = '' as $$
  select jsonb_build_object('amount', 50000, 'minOrder', 150000, 'maxPerOrder', 50000, 'days', 60, 'refundGraceDays', 7)
$$;

-- per-grant remaining amounts (no writes; expiry is evaluated against now())
create or replace function private.bonus_state(p_user uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with g as (
    select g.id, g.amount, g.expires_at, g.created_at,
           g.amount + coalesce((select sum(x.amount) from public.bonus_ledger x where x.grant_id = g.id), 0) as remaining
    from public.bonus_ledger g where g.user_id = p_user and g.kind = 'grant')
  select jsonb_build_object(
    'balance', coalesce((select sum(remaining) from g where expires_at > now() and remaining > 0), 0),
    'expiresAt', (select min(expires_at) from g where expires_at > now() and remaining > 0),
    'grantedAt', (select max(created_at) from g),
    'granted', coalesce((select sum(amount) from g), 0),
    'expired', exists (select 1 from g where expires_at <= now()),
    'rules', private.bonus_rules())
$$;

create or replace function private.bonus_balance(p_user uuid)
returns bigint language sql stable security definer set search_path = '' as $$
  select coalesce(sum(r), 0)::bigint from (
    select g.amount + coalesce((select sum(x.amount) from public.bonus_ledger x where x.grant_id = g.id), 0) r
    from public.bonus_ledger g where g.user_id = p_user and g.kind = 'grant' and g.expires_at > now()) t where r > 0
$$;

-- materialise 'expire' rows for grants past expiry that still have a remainder (idempotent)
create or replace function private.bonus_expire(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select g.id, g.user_id,
             g.amount + coalesce((select sum(x.amount) from public.bonus_ledger x where x.grant_id = g.id), 0) remaining
           from public.bonus_ledger g
           where g.kind = 'grant' and g.expires_at <= now() and (p_user is null or g.user_id = p_user) loop
    if r.remaining > 0 then
      insert into public.bonus_ledger (user_id, grant_id, kind, amount, note)
      values (r.user_id, r.id, 'expire', -r.remaining, 'Bonus muddati tugadi');
    end if;
  end loop;
end $$;

-- one signup bonus per phone ever AND per account; returns the grant or null
create or replace function private.grant_signup_bonus(p_user uuid, p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_rules jsonb := private.bonus_rules(); v_id bigint; v_exp timestamptz;
begin
  if p_user is null or p_phone is null then return null; end if;
  if exists (select 1 from public.bonus_ledger where user_id = p_user and kind = 'grant') then return null; end if;
  insert into public.bonus_phone_grants (phone, user_id, amount) values (p_phone, p_user, (v_rules->>'amount')::bigint)
  on conflict (phone) do nothing;
  if not found then return null; end if;
  v_exp := now() + make_interval(days => (v_rules->>'days')::int);
  insert into public.bonus_ledger (user_id, kind, amount, expires_at, phone, note)
  values (p_user, 'grant', (v_rules->>'amount')::bigint, v_exp, p_phone, 'Yangi shifokor bonusi (raqam tasdiqlandi)')
  returning id into v_id;
  perform private.audit(p_user, 'bonus.grant', 'profile', p_user::text,
    jsonb_build_object('amount', (v_rules->>'amount')::bigint, 'phone', '+998' || left(p_phone, 2) || '***' || right(p_phone, 4), 'expiresAt', v_exp));
  return jsonb_build_object('amount', (v_rules->>'amount')::bigint, 'expiresAt', v_exp);
end $$;

-- ───────────── profile json (+ verification + bonus) ─────────────
create or replace function private.profile_json(p public.profiles)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'provider', p.provider, 'fullName', p.full_name, 'phone', coalesce(p.phone,''),
    'email', p.email, 'telegramUsername', p.telegram_username, 'clinic', p.clinic, 'city', p.city,
    'specialty', p.specialty, 'bio', p.bio, 'avatarUrl', p.avatar_url,
    'role', case when p.is_admin then 'admin' else 'doctor' end,
    'isAdmin', p.is_admin and p.blocked_at is null, 'adminRole', case when p.is_admin then p.admin_role end,
    'blocked', p.blocked_at is not null,
    'phoneVerified', p.phone_verified_at is not null and coalesce(p.phone, '') <> '',
    'phoneVerifiedAt', p.phone_verified_at,
    'bonus', private.bonus_state(p.id),
    'createdAt', p.created_at, 'updatedAt', p.updated_at)
$$;

-- owner bootstrap by phone now requires a verified phone (any provider)
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
  return private.profile_json(r);
end $$;

-- a verified phone can no longer be edited from the profile form (only through OTP)
create or replace function public.sh_update_profile(p_secret text, p_user uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; cur public.profiles; v_phone text;
begin
  perform private.assert_secret(p_secret);
  select * into cur from public.profiles where id = p_user;
  if cur.id is null then return jsonb_build_object('error', 'not_found'); end if;
  v_phone := nullif(p_patch->>'phone', '');
  if p_patch ? 'phone' and cur.phone_verified_at is not null and v_phone is distinct from cur.phone then
    return jsonb_build_object('error', 'phone_locked');
  end if;
  if v_phone is not null and exists (select 1 from public.profiles where phone = v_phone and id <> p_user) then
    return jsonb_build_object('error', 'exists');
  end if;
  update public.profiles set
    full_name = coalesce(nullif(p_patch->>'fullName', ''), full_name),
    phone = case when p_patch ? 'phone' then v_phone else phone end,
    clinic = case when p_patch ? 'clinic' then nullif(p_patch->>'clinic', '') else clinic end,
    city = case when p_patch ? 'city' then nullif(p_patch->>'city', '') else city end,
    specialty = case when p_patch ? 'specialty' then nullif(p_patch->>'specialty', '') else specialty end,
    bio = case when p_patch ? 'bio' then nullif(p_patch->>'bio', '') else bio end,
    avatar_url = case when p_patch ? 'avatarUrl' then nullif(p_patch->>'avatarUrl', '') else avatar_url end,
    updated_at = now()
  where id = p_user
  returning * into r;
  return private.profile_json(r);
end $$;

-- ───────────── OTP RPCs ─────────────
-- phone holder check: a verified account, or a phone+password account, "owns" a number
create or replace function private.phone_owner(p_phone text)
returns uuid language sql stable security definer set search_path = '' as $$
  select id from public.profiles
  where phone = p_phone and (phone_verified_at is not null or (provider = 'phone' and password_hash is not null))
  order by phone_verified_at nulls last limit 1
$$;

-- Reserve a code slot (limits + purpose checks) before anything is sent. Code hash is computed by the server.
create or replace function public.sh_otp_create(p_secret text, p_id uuid, p_phone text, p_purpose text, p_user uuid,
  p_code_hash text, p_ip_hash text, p_channel text, p_ttl int, p_resend int, p_phone_daily int, p_ip_hourly int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_last timestamptz; v_owner uuid; v_exp timestamptz;
begin
  perform private.assert_secret(p_secret);
  if p_phone !~ '^[0-9]{9}$' or p_purpose not in ('register','verify','reset') then
    return jsonb_build_object('error', 'invalid');
  end if;
  perform pg_advisory_xact_lock(hashtext('sh_otp:' || p_phone));
  v_owner := private.phone_owner(p_phone);
  if p_purpose = 'register' and (v_owner is not null) then return jsonb_build_object('error', 'exists'); end if;
  if p_purpose = 'verify' then
    if p_user is null then return jsonb_build_object('error', 'invalid'); end if;
    perform private.assert_active(p_user);
    if v_owner is not null and v_owner <> p_user then return jsonb_build_object('error', 'taken'); end if;
    if exists (select 1 from public.profiles where id = p_user and phone = p_phone and phone_verified_at is not null) then
      return jsonb_build_object('error', 'already');
    end if;
  end if;
  if p_purpose = 'reset' and not exists (select 1 from public.profiles where phone = p_phone and password_hash is not null) then
    return jsonb_build_object('error', 'not_found');
  end if;

  select max(created_at) into v_last from public.otp_codes where phone = p_phone;
  if v_last is not null and v_last > now() - make_interval(secs => p_resend) then
    return jsonb_build_object('error', 'too_soon', 'retryAfter', ceil(extract(epoch from v_last + make_interval(secs => p_resend) - now())));
  end if;
  if (select count(*) from public.otp_codes where phone = p_phone and created_at > now() - interval '24 hours') >= p_phone_daily then
    return jsonb_build_object('error', 'daily_limit');
  end if;
  if p_ip_hash is not null and p_ip_hourly > 0 and
     (select count(*) from public.otp_codes where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= p_ip_hourly then
    return jsonb_build_object('error', 'ip_limit');
  end if;

  -- only the newest code for a phone+purpose is valid
  update public.otp_codes set consumed_at = now()
  where phone = p_phone and purpose = p_purpose and consumed_at is null;
  v_exp := now() + make_interval(secs => p_ttl);
  insert into public.otp_codes (id, phone, purpose, user_id, code_hash, channel, ip_hash, expires_at)
  values (p_id, p_phone, p_purpose, p_user, p_code_hash, coalesce(p_channel, 'telegram'), p_ip_hash, v_exp);
  delete from public.otp_codes where created_at < now() - interval '30 days';
  return jsonb_build_object('id', p_id, 'expiresAt', v_exp, 'resendAt', now() + make_interval(secs => p_resend));
end $$;

create or replace function public.sh_otp_set_delivery(p_secret text, p_id uuid, p_request_id text, p_status text, p_failed boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  update public.otp_codes set
    request_id = coalesce(p_request_id, request_id),
    delivery_status = coalesce(left(p_status, 40), delivery_status),
    consumed_at = case when p_failed then coalesce(consumed_at, now()) else consumed_at end
  where id = p_id;
end $$;

-- delivery report from Telegram Gateway callback (signature is verified by the server)
create or replace function public.sh_otp_delivery_report(p_secret text, p_request_id text, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  update public.otp_codes set delivery_status = left(p_status, 40) where request_id = p_request_id;
end $$;

-- Atomically reserve one attempt on the newest active code; the server compares the hash in constant time.
create or replace function public.sh_otp_attempt(p_secret text, p_phone text, p_purpose text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.otp_codes;
begin
  perform private.assert_secret(p_secret);
  select * into c from public.otp_codes
  where phone = p_phone and purpose = p_purpose and consumed_at is null and verified_at is null
  order by created_at desc limit 1 for update;
  if c.id is null then return jsonb_build_object('error', 'no_code'); end if;
  if p_purpose = 'verify' and c.user_id is distinct from p_user then return jsonb_build_object('error', 'no_code'); end if;
  if c.expires_at <= now() then return jsonb_build_object('error', 'expired'); end if;
  if c.attempts >= c.max_attempts then return jsonb_build_object('error', 'locked'); end if;
  update public.otp_codes set attempts = attempts + 1 where id = c.id returning * into c;
  return jsonb_build_object('id', c.id, 'codeHash', c.code_hash, 'attemptsLeft', c.max_attempts - c.attempts,
    'requestId', c.request_id, 'channel', c.channel);
end $$;

-- marks an OTP consumed; raises unless it is valid for this phone/purpose
create or replace function private.consume_otp(p_otp uuid, p_phone text, p_purpose text, p_user uuid)
returns public.otp_codes language plpgsql security definer set search_path = '' as $$
declare c public.otp_codes;
begin
  update public.otp_codes set verified_at = now(), consumed_at = now()
  where id = p_otp and phone = p_phone and purpose = p_purpose and consumed_at is null and verified_at is null
    and expires_at > now() and attempts <= max_attempts
    and (p_purpose <> 'verify' or user_id = p_user)
  returning * into c;
  if c.id is null then raise exception 'otp_invalid' using errcode = 'P0001'; end if;
  return c;
end $$;

-- frees a number from unverified social claims / stale phone-provider uids so a proven owner can take it
create or replace function private.release_phone_claims(p_phone text, p_keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set phone = null, updated_at = now()
  where phone = p_phone and id is distinct from p_keep and phone_verified_at is null
    and not (provider = 'phone' and password_hash is not null);
  update public.profiles set provider_uid = 'legacy:' || id::text
  where provider = 'phone' and provider_uid = p_phone and id is distinct from p_keep and coalesce(phone, '') <> p_phone;
end $$;

create or replace function public.sh_register_verified(p_secret text, p_otp uuid, p_full_name text, p_phone text, p_password_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_bonus jsonb;
begin
  perform private.assert_secret(p_secret);
  perform pg_advisory_xact_lock(hashtext('sh_otp:' || p_phone));
  if private.phone_owner(p_phone) is not null then return jsonb_build_object('error', 'exists'); end if;
  perform private.consume_otp(p_otp, p_phone, 'register', null);
  perform private.release_phone_claims(p_phone, null);
  insert into public.profiles (provider, provider_uid, full_name, phone, password_hash, phone_verified_at)
  values ('phone', p_phone, left(p_full_name, 120), p_phone, p_password_hash, now())
  returning * into r;
  v_bonus := private.grant_signup_bonus(r.id, p_phone);
  return jsonb_build_object('profile', private.profile_json(r), 'bonus', v_bonus);
end $$;

create or replace function public.sh_verify_phone(p_secret text, p_otp uuid, p_user uuid, p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_owner uuid; v_bonus jsonb;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  perform pg_advisory_xact_lock(hashtext('sh_otp:' || p_phone));
  v_owner := private.phone_owner(p_phone);
  if v_owner is not null and v_owner <> p_user then return jsonb_build_object('error', 'taken'); end if;
  perform private.consume_otp(p_otp, p_phone, 'verify', p_user);
  perform private.release_phone_claims(p_phone, p_user);
  update public.profiles set phone = p_phone, phone_verified_at = now(), updated_at = now(),
    provider_uid = case when provider = 'phone' then p_phone else provider_uid end
  where id = p_user returning * into r;
  v_bonus := private.grant_signup_bonus(r.id, p_phone);
  perform private.audit(p_user, 'phone.verified', 'profile', p_user::text,
    jsonb_build_object('phone', '+998' || left(p_phone, 2) || '***' || right(p_phone, 4)));
  return jsonb_build_object('profile', private.profile_json(r), 'bonus', v_bonus);
end $$;

create or replace function public.sh_reset_password(p_secret text, p_otp uuid, p_phone text, p_password_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_first boolean; v_bonus jsonb;
begin
  perform private.assert_secret(p_secret);
  perform pg_advisory_xact_lock(hashtext('sh_otp:' || p_phone));
  select * into r from public.profiles where phone = p_phone and password_hash is not null
  order by phone_verified_at nulls last limit 1;
  if r.id is null then return jsonb_build_object('error', 'not_found'); end if;
  perform private.consume_otp(p_otp, p_phone, 'reset', null);
  v_first := r.phone_verified_at is null;
  update public.profiles set password_hash = p_password_hash, phone_verified_at = coalesce(phone_verified_at, now()), updated_at = now()
  where id = r.id returning * into r;
  if v_first then v_bonus := private.grant_signup_bonus(r.id, p_phone); end if;
  perform private.audit(r.id, 'auth.password_reset', 'profile', r.id::text, '{}'::jsonb);
  return jsonb_build_object('profile', private.profile_json(r), 'blocked', r.blocked_at is not null, 'bonus', v_bonus);
end $$;

-- user-facing bonus summary + history
create or replace function public.sh_my_bonus(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return private.bonus_state(p_user) || jsonb_build_object(
    'history', coalesce((select jsonb_agg(jsonb_build_object('kind', l.kind, 'amount', l.amount, 'orderId', l.order_id,
        'note', l.note, 'createdAt', l.created_at, 'expiresAt', l.expires_at) order by l.created_at desc, l.id desc)
      from public.bonus_ledger l where l.user_id = p_user), '[]'::jsonb));
end $$;

-- ───────────── orders: bonus spend on create ─────────────
create or replace function private.order_json(o public.orders)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', o.id, 'createdAt', o.created_at, 'name', o.name, 'phone', o.phone, 'city', o.city,
    'address', o.address, 'note', o.note, 'payment', o.payment, 'total', o.total, 'commission', o.commission,
    'bonusUsed', o.bonus_used, 'payable', o.total - o.bonus_used,
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

drop function if exists public.sh_create_order(text, uuid, jsonb, jsonb);
create or replace function public.sh_create_order(p_secret text, p_user uuid, p_order jsonb, p_items jsonb, p_use_bonus boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text; it jsonb; v_prod public.products; v_store public.stores; v_total bigint := 0; v_comm bigint := 0;
  v_price bigint; v_qty int; v_first_store uuid; v_first_name text; o public.orders; v_paid boolean;
  v_eligible bigint := 0; v_rules jsonb := private.bonus_rules(); v_bonus bigint := 0; v_left bigint; v_take bigint; g record;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('error', 'empty');
  end if;
  if p_use_bonus then
    -- serialises all bonus operations of this user (no double spend across parallel requests)
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
    end if;
    v_price := case when v_prod.id is not null then v_prod.price else greatest(coalesce((it->>'price')::bigint, 0), 0) end;
    insert into public.order_items (order_id, product_id, store_id, name, brand, image, qty, price, commission_rate,
      size, color, category, source, expiry_months, shop_name, shop_slug)
    values (v_id, it->>'productId', v_store.id, coalesce(v_prod.name, it->>'name', 'Mahsulot'), coalesce(v_prod.brand, it->>'brand', ''),
      coalesce(v_prod.image, it->>'image'), v_qty, v_price, coalesce(v_store.commission_rate, 0),
      nullif(it->>'size',''), nullif(it->>'color',''), coalesce(v_prod.category, it->>'category'), nullif(it->>'source',''),
      nullif(it->>'expiryMonths','')::int, coalesce(v_store.name, it->>'shopName'), coalesce(v_store.slug, it->>'shopSlug'));
    v_total := v_total + v_price * v_qty;
    if v_store.id is not null then v_eligible := v_eligible + v_price * v_qty; end if;
    v_comm := v_comm + round(v_price * v_qty * coalesce(v_store.commission_rate, 0) / 100.0);
    if v_first_store is null and v_store.id is not null then v_first_store := v_store.id; v_first_name := v_store.name; end if;
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

-- release: seller gets full item amount minus commission; bonus is a platform expense
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
  if o.bonus_used > 0 then
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note)
    values (p_order, null, 'bonus', o.bonus_used, p_actor, 'Platforma xarajati: shifokor bonusi');
  end if;
  return o;
end $$;

-- refund / cancel: buyer gets back what they paid; bonus returns to the balance
create or replace function private.refund_order(p_order text, p_actor uuid, p_note text)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare o public.orders; it record; s record; v_grace int := (private.bonus_rules()->>'refundGraceDays')::int;
begin
  update public.orders set payment_state = 'refunded', refunded_at = now(), updated_at = now()
  where id = p_order and payment_state in ('escrow_held','awaiting_payment') returning * into o;
  if o.id is null then raise exception 'not_refundable' using errcode = 'P0001'; end if;
  if o.paid_at is not null and o.total - o.bonus_used > 0 then
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note) values (p_order, o.shop_id, 'refund', o.total - o.bonus_used, p_actor, p_note);
  end if;
  for it in select product_id, qty from public.order_items where order_id = p_order and store_id is not null loop
    update public.products set stock = stock + it.qty where id::text = it.product_id;
  end loop;
  -- return used bonus (same grant; expiry kept, or extended to now()+grace if it is expired / about to expire)
  for s in select l.grant_id, l.user_id, -sum(l.amount) used from public.bonus_ledger l
           where l.order_id = p_order and l.kind in ('spend','refund') group by l.grant_id, l.user_id having sum(l.amount) < 0 loop
    insert into public.bonus_ledger (user_id, grant_id, kind, amount, order_id, note)
    values (s.user_id, s.grant_id, 'refund', s.used, p_order, 'Buyurtma bekor qilindi — bonus qaytarildi');
    update public.bonus_ledger set expires_at = now() + make_interval(days => v_grace)
    where id = s.grant_id and expires_at < now() + make_interval(days => v_grace);
  end loop;
  return o;
end $$;

-- naqd: collected amount excludes the bonus part
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
  if v_next = 'yetkazildi' and o.payment = 'naqd' and o.paid_at is null then
    update public.orders set paid_at = now(), payment_state = 'escrow_held' where id = p_order returning * into o;
    insert into public.escrow_ledger (order_id, store_id, kind, amount, actor_id, note)
    values (p_order, o.shop_id, 'hold', o.total - o.bonus_used, p_user, 'Naqd to‘lov yetkazishda qabul qilindi (demo)');
  end if;
  return jsonb_build_object('order', private.order_json(o));
end $$;

-- ───────────── admin: KPIs with bonus expense ─────────────
drop function if exists private.revenue_day(date) cascade;
create function private.revenue_day(p_day date)
returns table(commission bigint, ads bigint, channels bigint, subs bigint, refunds bigint, gmv bigint, orders bigint, bonus bigint)
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
    coalesce((select count(*) from public.orders o where o.created_at::date = p_day), 0)::bigint,
    coalesce((select sum(l.amount) from public.escrow_ledger l where l.kind = 'bonus' and l.created_at::date = p_day), 0)::bigint
$$;

create or replace function private.period_kpis(p_from date, p_to date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with d as (select r.* from generate_series(p_from, p_to, interval '1 day') g(day), lateral private.revenue_day(g.day::date) r)
  select jsonb_build_object(
    'commission', coalesce(sum(d.commission), 0), 'ads', coalesce(sum(d.ads), 0), 'channels', coalesce(sum(d.channels), 0),
    'subs', coalesce(sum(d.subs), 0), 'refunds', coalesce(sum(d.refunds), 0), 'gmv', coalesce(sum(d.gmv), 0),
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

create or replace function private.bonus_overview()
returns jsonb language sql stable security definer set search_path = '' as $$
  with g as (
    select b.id, b.amount, b.expires_at,
           b.amount + coalesce((select sum(x.amount) from public.bonus_ledger x where x.grant_id = b.id), 0) remaining
    from public.bonus_ledger b where b.kind = 'grant')
  select jsonb_build_object(
    'rules', private.bonus_rules(),
    'grants', (select count(*) from g),
    'granted', coalesce((select sum(amount) from g), 0),
    'spent', coalesce(-(select sum(amount) from public.bonus_ledger where kind in ('spend','refund')), 0),
    'refunded', coalesce((select sum(amount) from public.bonus_ledger where kind = 'refund'), 0),
    'expired', coalesce(-(select sum(amount) from public.bonus_ledger where kind = 'expire'), 0)
               + coalesce((select sum(remaining) from g where expires_at <= now() and remaining > 0), 0),
    'outstanding', coalesce((select sum(remaining) from g where expires_at > now() and remaining > 0), 0),
    'activeUsers', (select count(*) from g where expires_at > now() and remaining > 0),
    'expense', coalesce((select sum(amount) from public.escrow_ledger where kind = 'bonus'), 0),
    'pendingInEscrow', coalesce((select sum(o.bonus_used) from public.orders o where o.payment_state in ('escrow_held','awaiting_payment')), 0),
    'commission', coalesce((select sum(amount) from public.escrow_ledger where kind = 'commission'), 0),
    'netCommission', coalesce((select sum(amount) from public.escrow_ledger where kind = 'commission'), 0)
                     - coalesce((select sum(amount) from public.escrow_ledger where kind = 'bonus'), 0),
    'recent', coalesce((select jsonb_agg(x order by (x->>'createdAt') desc) from (
        select jsonb_build_object('id', l.id, 'kind', l.kind, 'amount', l.amount, 'orderId', l.order_id, 'createdAt', l.created_at,
          'userId', l.user_id, 'fullName', coalesce(p.full_name, 'O‘chirilgan akkaunt')) x
        from public.bonus_ledger l left join public.profiles p on p.id = l.user_id
        order by l.created_at desc, l.id desc limit 8) t), '[]'::jsonb))
$$;

create or replace function public.sh_admin_bonus(p_secret text, p_admin uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','finance']);
  perform private.bonus_expire(null);
  return private.bonus_overview();
end $$;

create or replace function public.sh_admin_dashboard(p_secret text, p_admin uuid, p_days integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_days int := greatest(1, least(coalesce(p_days, 30), 366)); v_to date := current_date; v_from date; cur jsonb; prev jsonb; series jsonb;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin);
  v_from := v_to - (v_days - 1);
  cur := private.period_kpis(v_from, v_to);
  prev := private.period_kpis(v_from - v_days, v_from - 1);
  if v_days <= 31 then
    select jsonb_agg(jsonb_build_object('date', g.day::date, 'net', r.commission + r.ads + r.channels + r.subs - r.refunds - r.bonus, 'gmv', r.gmv) order by g.day)
    into series from generate_series(least(v_from, v_to - 29), v_to, interval '1 day') g(day), lateral private.revenue_day(g.day::date) r;
  else
    select jsonb_agg(jsonb_build_object('date', m.month_start, 'net', (m.k->>'net')::bigint, 'gmv', (m.k->>'gmv')::bigint) order by m.month_start)
    into series from (select gs::date month_start, private.period_kpis(greatest(gs::date, v_from), least((gs + interval '1 month - 1 day')::date, v_to)) k
                      from generate_series(date_trunc('month', v_from::timestamp), date_trunc('month', v_to::timestamp), interval '1 month') gs) m;
  end if;
  return jsonb_build_object(
    'from', v_from, 'to', v_to, 'days', v_days, 'current', cur, 'previous', prev, 'mrr', private.mrr(),
    'bonus', private.bonus_overview(),
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

create or replace function public.sh_admin_users(p_secret text, p_admin uuid, p_query text, p_filter text, p_city text, p_limit integer, p_offset integer)
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
      'blocked', (select count(*) from public.profiles where blocked_at is not null),
      'verified', (select count(*) from public.profiles where phone_verified_at is not null)),
    'cities', coalesce((select jsonb_agg(distinct city) from public.profiles where city is not null and city <> ''), '[]'::jsonb),
    'matching', (select count(*) from public.profiles p where private.user_match(p, q, p_filter, p_city)),
    'rows', coalesce((select jsonb_agg(x.j order by x.created_at desc) from (
      select p.created_at, jsonb_build_object('id', p.id, 'fullName', p.full_name, 'phone', coalesce(p.phone,''), 'email', p.email,
        'provider', p.provider, 'specialty', p.specialty, 'city', p.city, 'clinic', p.clinic, 'avatarUrl', p.avatar_url,
        'isAdmin', p.is_admin, 'adminRole', p.admin_role, 'blocked', p.blocked_at is not null,
        'isSeller', exists (select 1 from public.stores s where s.owner_id = p.id and s.status = 'active'),
        'phoneVerified', p.phone_verified_at is not null, 'bonusBalance', private.bonus_balance(p.id),
        'createdAt', p.created_at, 'lastSeenAt', p.last_seen_at) j
      from public.profiles p where private.user_match(p, q, p_filter, p_city)
      order by p.created_at desc limit least(greatest(coalesce(p_limit, 50), 1), 200) offset greatest(coalesce(p_offset, 0), 0)) x), '[]'::jsonb));
end $$;

-- ───────────── grants ─────────────
revoke all on all functions in schema private from public, anon, authenticated;
revoke execute on function public.sh_otp_create, public.sh_otp_set_delivery, public.sh_otp_delivery_report, public.sh_otp_attempt,
  public.sh_register_verified, public.sh_verify_phone, public.sh_reset_password, public.sh_my_bonus, public.sh_create_order,
  public.sh_admin_bonus, public.sh_session_ping(text, uuid, text[], text[], text[]), public.sh_update_profile, public.sh_seller_order_update,
  public.sh_admin_dashboard, public.sh_admin_users from public;
grant execute on function public.sh_otp_create, public.sh_otp_set_delivery, public.sh_otp_delivery_report, public.sh_otp_attempt,
  public.sh_register_verified, public.sh_verify_phone, public.sh_reset_password, public.sh_my_bonus, public.sh_create_order,
  public.sh_admin_bonus, public.sh_session_ping(text, uuid, text[], text[], text[]), public.sh_update_profile, public.sh_seller_order_update,
  public.sh_admin_dashboard, public.sh_admin_users to anon, authenticated;

-- ════════════════════════════════════════
-- 20260927a_stomahub_seller_finance.sql
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- 20260928a_stomahub_messages_reviews_settings.sql
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- 20260928b_conversations_context_fk.sql
-- ════════════════════════════════════════
-- order_id / product_id on conversations are context references only. ON DELETE SET NULL collided with the
-- unique (store, buyer, order, product) index (two contexts collapsing into the same NULL pair), which would
-- make deleting a product/order fail. Keep the ids as plain references; the list RPCs use left joins.
alter table public.conversations drop constraint if exists conversations_order_id_fkey;
alter table public.conversations drop constraint if exists conversations_product_id_fkey;

-- ════════════════════════════════════════
-- 20260929a_stomahub_platform_store_reviews_payouts.sql
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- 20260930a_product_media_fields.sql
-- ════════════════════════════════════════
-- 20260930a: product wizard fields — SKU, subcategory and extra gallery images.
alter table public.products
  add column if not exists sku text,
  add column if not exists subcategory text,
  add column if not exists images text[];

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
    image, kind, gender, sizes, colors, sku, subcategory, images)
  values (v_id, s.id, p_product->>'name', coalesce(p_product->>'brand',''), p_product->>'category', (p_product->>'price')::bigint,
    nullif(p_product->>'oldPrice','')::bigint, nullif(p_product->>'discount','')::int, greatest(coalesce((p_product->>'stockQty')::int, 0), 0),
    coalesce(nullif(p_product->>'delivery',''), 'Toshkent 24 soat'), coalesce(p_product->>'description',''), nullif(p_product->>'image',''),
    nullif(p_product->>'kind',''), nullif(p_product->>'gender',''),
    case when jsonb_typeof(p_product->'sizes') = 'array' then array(select jsonb_array_elements_text(p_product->'sizes')) end,
    case when jsonb_typeof(p_product->'colors') = 'array' then array(select jsonb_array_elements_text(p_product->'colors')) end,
    nullif(p_product->>'sku',''), nullif(p_product->>'subcategory',''),
    case when jsonb_typeof(p_product->'images') = 'array' then array(select jsonb_array_elements_text(p_product->'images')) end)
  on conflict (id) do update set
    name = excluded.name, brand = excluded.brand, category = excluded.category, price = excluded.price,
    old_price = excluded.old_price, discount = excluded.discount, stock = excluded.stock, delivery = excluded.delivery,
    description = excluded.description, image = coalesce(excluded.image, t.image), kind = excluded.kind,
    gender = excluded.gender, sizes = excluded.sizes, colors = excluded.colors,
    sku = excluded.sku, subcategory = excluded.subcategory, images = excluded.images, updated_at = now()
  returning * into p;
  return jsonb_build_object('product', private.product_json(p, s));
end $$;

create or replace function private.product_json(p public.products, s public.stores)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p.id, 'name', p.name, 'brand', p.brand, 'category', p.category, 'price', p.price,
    'oldPrice', p.old_price, 'discount', p.discount, 'rating', p.rating, 'reviews', p.reviews,
    'inStock', p.active and p.stock > 0, 'delivery', p.delivery, 'image', p.image,
    'description', p.description, 'stockQty', p.stock, 'shopId', s.id, 'shopName', s.name, 'shopSlug', s.slug,
    'active', p.active, 'listedBySeller', true, 'featured', true,
    'kind', p.kind, 'sizes', to_jsonb(p.sizes), 'gender', p.gender, 'colors', to_jsonb(p.colors),
    'sku', p.sku, 'subcategory', p.subcategory, 'images', to_jsonb(p.images),
    'createdAt', p.created_at))
$$;

grant execute on function public.sh_save_product(text, uuid, jsonb) to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20260930b_product_attrs_docs.sql
-- ════════════════════════════════════════
-- 20260930b: product wizard steps 2–3 — free-form attributes (sale/delivery/specs/flags), draft support, public product-docs bucket.
alter table public.products add column if not exists attrs jsonb not null default '{}'::jsonb;

-- public bucket for certificates / instructions shown on the product page (PDF, JPG, PNG), uploads only through server tickets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-docs', 'product-docs', true, 10485760, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product-docs public read" on storage.objects;
create policy "product-docs public read" on storage.objects for select to anon, authenticated using (bucket_id = 'product-docs');
drop policy if exists "product-docs ticket insert" on storage.objects;
create policy "product-docs ticket insert" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'product-docs' and public.sh_can_upload(name));

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
    image, kind, gender, sizes, colors, sku, subcategory, images, attrs, active)
  values (v_id, s.id, p_product->>'name', coalesce(p_product->>'brand',''), p_product->>'category', (p_product->>'price')::bigint,
    nullif(p_product->>'oldPrice','')::bigint, nullif(p_product->>'discount','')::int, greatest(coalesce((p_product->>'stockQty')::int, 0), 0),
    coalesce(nullif(p_product->>'delivery',''), 'Toshkent 24 soat'), coalesce(p_product->>'description',''), nullif(p_product->>'image',''),
    nullif(p_product->>'kind',''), nullif(p_product->>'gender',''),
    case when jsonb_typeof(p_product->'sizes') = 'array' then array(select jsonb_array_elements_text(p_product->'sizes')) end,
    case when jsonb_typeof(p_product->'colors') = 'array' then array(select jsonb_array_elements_text(p_product->'colors')) end,
    nullif(p_product->>'sku',''), nullif(p_product->>'subcategory',''),
    case when jsonb_typeof(p_product->'images') = 'array' then array(select jsonb_array_elements_text(p_product->'images')) end,
    case when jsonb_typeof(p_product->'attrs') = 'object' then p_product->'attrs' else '{}'::jsonb end,
    case when p_product ? 'active' then (p_product->>'active')::boolean else true end)
  on conflict (id) do update set
    name = excluded.name, brand = excluded.brand, category = excluded.category, price = excluded.price,
    old_price = excluded.old_price, discount = excluded.discount, stock = excluded.stock, delivery = excluded.delivery,
    description = excluded.description, image = coalesce(excluded.image, t.image), kind = excluded.kind,
    gender = excluded.gender, sizes = excluded.sizes, colors = excluded.colors,
    sku = excluded.sku, subcategory = excluded.subcategory, images = excluded.images, attrs = excluded.attrs,
    active = case when p_product ? 'active' then (p_product->>'active')::boolean else t.active end, updated_at = now()
  returning * into p;
  return jsonb_build_object('product', private.product_json(p, s));
end $$;

create or replace function private.product_json(p public.products, s public.stores)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p.id, 'name', p.name, 'brand', p.brand, 'category', p.category, 'price', p.price,
    'oldPrice', p.old_price, 'discount', p.discount, 'rating', p.rating, 'reviews', p.reviews,
    'inStock', p.active and p.stock > 0, 'delivery', p.delivery, 'image', p.image,
    'description', p.description, 'stockQty', p.stock, 'shopId', s.id, 'shopName', s.name, 'shopSlug', s.slug,
    'active', p.active, 'listedBySeller', true, 'featured', true,
    'kind', p.kind, 'sizes', to_jsonb(p.sizes), 'gender', p.gender, 'colors', to_jsonb(p.colors),
    'sku', p.sku, 'subcategory', p.subcategory, 'images', to_jsonb(p.images), 'attrs', p.attrs,
    'createdAt', p.created_at))
$$;

grant execute on function public.sh_save_product(text, uuid, jsonb) to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20261002a_commission_12_bonus_v2.sql
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- 20261002b_bonus_signup_eligible.sql
-- ════════════════════════════════════════
-- 20261002b: bonus_state exposes whether the profile can still earn the signup bonus (new profile, no grant yet).
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
    'signupEligible', not exists (select 1 from g where bonus_type = 'signup')
       and exists (select 1 from public.profiles p where p.id = p_user and p.created_at >= private.bonus_cutoff() and p.provider_uid not like 'platform:%'),
    'firstPurchaseGranted', exists (select 1 from g where bonus_type = 'first_purchase'),
    'firstPurchasePending', exists (select 1 from g where bonus_type = 'signup') and not exists (select 1 from g where bonus_type = 'first_purchase'),
    'rules', private.bonus_rules())
$$;

-- ════════════════════════════════════════
-- 20261002c_bonus_signup_verified_limits.sql
-- ════════════════════════════════════════
-- 20261002c: signup bonus only for verified accounts (OTP-verified phone, or Google/Telegram-verified) + per IP/device daily limits.
alter table public.bonus_ledger add column if not exists ip_hash text;
alter table public.bonus_ledger add column if not exists device_hash text;
create index if not exists bonus_ledger_signup_ip on public.bonus_ledger (ip_hash, created_at) where bonus_type = 'signup';
create index if not exists bonus_ledger_signup_device on public.bonus_ledger (device_hash, created_at) where bonus_type = 'signup';

create or replace function private.bonus_rules() returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object(
    'signup', 10000, 'firstPurchase', 30000, 'amount', 10000,
    'minOrder', 0, 'maxPerOrder', 40000, 'maxSharePercent', 50,
    'days', 365, 'refundGraceDays', 7,
    'signupPerIpDaily', 2, 'signupPerDeviceDaily', 1)
$$;

-- verified = OTP-verified phone, or an account whose session was issued after Google/Telegram server-side verification
create or replace function private.signup_verified(p_phone_verified_at timestamptz, p_provider text) returns boolean
language sql immutable set search_path = '' as $$
  select p_phone_verified_at is not null or p_provider in ('google', 'telegram')
$$;

drop function if exists private.grant_signup_bonus(uuid, text);
create or replace function private.grant_signup_bonus(p_user uuid, p_phone text default null, p_ip text default null, p_device text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_rules jsonb := private.bonus_rules(); v_amt bigint := (private.bonus_rules()->>'signup')::bigint;
  v_ph text; v_id bigint; v_exp timestamptz;
begin
  select * into r from public.profiles where id = p_user;
  if r.id is null or r.blocked_at is not null or r.provider_uid like 'platform:%' then return null; end if;
  if r.created_at < private.bonus_cutoff() then return null; end if;
  if not private.signup_verified(r.phone_verified_at, r.provider) then return null; end if;          -- stays "Kutilmoqda" until verified
  if p_ip is null and p_device is null then return null; end if;        -- origin unknown -> no grant
  if exists (select 1 from public.bonus_ledger where user_id = p_user and kind = 'grant' and bonus_type = 'signup') then return null; end if;
  -- serialize per origin so concurrent sign-ups cannot slip past the daily limits
  if p_ip is not null then perform pg_advisory_xact_lock(hashtext('bonus_ip:' || p_ip)); end if;
  if p_device is not null then perform pg_advisory_xact_lock(hashtext('bonus_dev:' || p_device)); end if;
  if p_ip is not null and (select count(*) from public.bonus_ledger where kind = 'grant' and bonus_type = 'signup' and ip_hash = p_ip
       and created_at > now() - interval '24 hours') >= (v_rules->>'signupPerIpDaily')::int then return null; end if;
  if p_device is not null and (select count(*) from public.bonus_ledger where kind = 'grant' and bonus_type = 'signup' and device_hash = p_device
       and created_at > now() - interval '24 hours') >= (v_rules->>'signupPerDeviceDaily')::int then return null; end if;
  if r.phone_verified_at is not null then
    v_ph := private.digits9(coalesce(nullif(p_phone, ''), r.phone));
    if length(v_ph) <> 9 then return null; end if;
    if exists (select 1 from public.profiles x where x.id <> r.id and private.digits9(x.phone) = v_ph and x.created_at < r.created_at) then return null; end if;
    insert into public.bonus_phone_grants (phone, user_id, amount) values (v_ph, p_user, v_amt) on conflict (phone) do nothing;
    if not found then return null; end if;
  end if;
  v_exp := now() + make_interval(days => (v_rules->>'days')::int);
  insert into public.bonus_ledger (user_id, kind, bonus_type, amount, expires_at, phone, ip_hash, device_hash, note)
  values (p_user, 'grant', 'signup', v_amt, v_exp, v_ph, p_ip, p_device, 'Ro‘yxatdan o‘tish bonusi')
  on conflict (user_id, bonus_type) where kind = 'grant' and bonus_type is not null do nothing
  returning id into v_id;
  if v_id is null then return null; end if;
  perform private.audit(p_user, 'bonus.grant', 'profile', p_user::text,
    jsonb_build_object('type', 'signup', 'amount', v_amt, 'via', case when v_ph is not null then 'phone_otp' else r.provider end, 'expiresAt', v_exp));
  return jsonb_build_object('amount', v_amt, 'expiresAt', v_exp);
end $$;

drop function if exists public.sh_session_ping(text, uuid, text[], text[], text[]);
create or replace function public.sh_session_ping(p_secret text, p_user uuid, p_phones text[], p_emails text[], p_telegram text[],
  p_ip_hash text default null, p_device_hash text default null) returns jsonb
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
  if r.blocked_at is null and r.created_at >= private.bonus_cutoff() and private.signup_verified(r.phone_verified_at, r.provider)
     and not exists (select 1 from public.bonus_ledger where user_id = r.id and kind = 'grant' and bonus_type = 'signup') then
    perform private.grant_signup_bonus(r.id, r.phone, p_ip_hash, p_device_hash);
  end if;
  return private.profile_json(r);
end $$;
revoke all on function public.sh_session_ping(text, uuid, text[], text[], text[], text, text) from public;
grant execute on function public.sh_session_ping(text, uuid, text[], text[], text[], text, text) to anon, authenticated, service_role;

create or replace function private.bonus_state(p_user uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  with g as (
    select g.id, g.amount, g.expires_at, g.created_at, g.bonus_type,
           g.amount + coalesce((select sum(x.amount) from public.bonus_ledger x where x.grant_id = g.id), 0) as remaining
    from public.bonus_ledger g where g.user_id = p_user and g.kind = 'grant'),
  p as (select * from public.profiles where id = p_user),
  elig as (select (select count(*) from p where p.created_at >= private.bonus_cutoff() and p.provider_uid not like 'platform:%') > 0
                  and not exists (select 1 from g where bonus_type = 'signup') as ok)
  select jsonb_build_object(
    'balance', coalesce((select sum(remaining) from g where expires_at > now() and remaining > 0), 0),
    'expiresAt', (select min(expires_at) from g where expires_at > now() and remaining > 0),
    'grantedAt', (select max(created_at) from g),
    'granted', coalesce((select sum(amount) from g), 0),
    'expired', exists (select 1 from g where expires_at <= now()),
    'signupGranted', exists (select 1 from g where bonus_type = 'signup'),
    'signupEligible', (select ok from elig),
    'signupReason', case when not (select ok from elig) then null
                         when (select private.signup_verified(p.phone_verified_at, p.provider) from p) then 'limit' else 'phone' end,
    'firstPurchaseGranted', exists (select 1 from g where bonus_type = 'first_purchase'),
    'firstPurchasePending', exists (select 1 from g where bonus_type = 'signup') and not exists (select 1 from g where bonus_type = 'first_purchase'),
    'rules', private.bonus_rules())
$$;

-- ════════════════════════════════════════
-- 20261003a_notifications_telegram.sql
-- ════════════════════════════════════════
-- In-app notification center + Telegram delivery state. All access goes through SECURITY DEFINER RPCs (see db.ts);
-- RLS additionally restricts direct (authenticated) access to the row owner.

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  order_id text references public.orders(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  tg_sent_at timestamptz,
  tg_attempts int not null default 0
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;
create index if not exists notifications_tg_idx on public.notifications (created_at) where tg_sent_at is null;
alter table public.notifications enable row level security;
drop policy if exists notifications_owner_select on public.notifications;
drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

alter table public.profiles add column if not exists tg_chat_id bigint;
alter table public.profiles add column if not exists tg_linked_at timestamptz;
create unique index if not exists profiles_tg_chat_unique on public.profiles (tg_chat_id) where tg_chat_id is not null;

create table if not exists public.telegram_link_tokens (
  token text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes'
);
create index if not exists telegram_link_tokens_user_idx on public.telegram_link_tokens (user_id);
alter table public.telegram_link_tokens enable row level security;

-- ───────────── helpers / triggers ─────────────
create or replace function private.notify(p_user uuid, p_type text, p_title text, p_body text, p_link text, p_order text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, type, title, body, link, order_id) values (p_user, p_type, p_title, p_body, p_link, p_order);
end $$;

create or replace function private.money(p bigint) returns text language sql immutable set search_path = '' as $$
  select replace(to_char(coalesce(p, 0), 'FM999,999,999,999,999'), ',', ' ') || ' so‘m'
$$;

create or replace function private.orders_notify() returns trigger language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_link text := '/buyurtmalarim/' || new.id; v_slink text := '/marketplace/sotuvchi?tab=orders';
  v_body text; v_by_buyer boolean;
begin
  if tg_op <> 'UPDATE' then return new; end if;

  -- order assigned to its store right after creation → seller "new order", buyer "sent"
  if old.shop_id is null and new.shop_id is not null and new.status = 'pending_accept' then
    select owner_id into v_owner from public.stores where id = new.shop_id;
    if v_owner is distinct from new.buyer_id then
      perform private.notify(v_owner, 'order_new', 'Yangi buyurtma', new.name || ' · ' || private.money(new.total) || ' · ' || new.id, v_slink, new.id);
    end if;
    perform private.notify(new.buyer_id, 'order_created', 'Buyurtma qabulga yuborildi', 'Sotuvchi qabulini kutmoqda. · ' || new.id, v_link, new.id);
  end if;

  if new.status is distinct from old.status then
    if new.status = 'qabul_qilindi' then
      perform private.notify(new.buyer_id, 'order_status', 'Buyurtma qabul qilindi', 'Sotuvchi buyurtmangizni qabul qildi. Yig‘ish boshlanadi. · ' || new.id, v_link, new.id);
    elsif new.status = 'yigilmoqda' then
      perform private.notify(new.buyer_id, 'order_status', 'Buyurtma yig‘ilmoqda', 'Buyurtmangiz yig‘ilmoqda. Tez orada jo‘natiladi. · ' || new.id, v_link, new.id);
    elsif new.status = 'yigish_tugadi' then
      perform private.notify(new.buyer_id, 'order_status', 'Yig‘ish tugadi', 'Buyurtma yig‘ib bo‘lindi — jo‘natishga tayyor. · ' || new.id, v_link, new.id);
    elsif new.status = 'yolda' then
      v_body := 'Buyurtmangiz yetkazib berish uchun yo‘lda.'
        || coalesce(' Kuryer: ' || nullif(new.courier_name, ''), '')
        || coalesce(' · ' || nullif(new.courier_phone, ''), '')
        || coalesce(' · ' || nullif(new.car_info, ''), '')
        || coalesce(' Kuzatish: ' || nullif(new.yandex_track_url, ''), '')
        || ' · ' || new.id;
      perform private.notify(new.buyer_id, 'order_status', 'Buyurtma yo‘lda', v_body, v_link, new.id);
    elsif new.status = 'yetkazildi' then
      perform private.notify(new.buyer_id, 'order_status', 'Buyurtma yetkazildi — tasdiqlang',
        'Mahsulotni tekshirib, “Tasdiqlash” ni bosing — shundan keyin pul sotuvchiga o‘tadi. · ' || new.id, v_link, new.id);
    end if;
  elsif new.status = 'yolda'
    and (new.yandex_track_url, new.courier_name, new.courier_phone, new.car_info) is distinct from (old.yandex_track_url, old.courier_name, old.courier_phone, old.car_info) then
    perform private.notify(new.buyer_id, 'order_track', 'Kuzatuv ma’lumotlari yangilandi',
      'Kuryer: ' || coalesce(nullif(new.courier_name, ''), '—') || coalesce(' · ' || nullif(new.courier_phone, ''), '') || coalesce(' · ' || nullif(new.car_info, ''), '')
      || coalesce(' Kuzatish: ' || nullif(new.yandex_track_url, ''), '') || ' · ' || new.id, v_link, new.id);
  end if;

  if new.payment_state is distinct from old.payment_state then
    select owner_id into v_owner from public.stores where id = new.shop_id;
    if new.payment_state = 'released' then
      v_by_buyer := not exists (select 1 from public.disputes d where d.order_id = new.id and d.status = 'resolved' and d.resolved_by is distinct from new.buyer_id);
      perform private.notify(new.buyer_id, 'order_paid', 'To‘lov yakunlandi', 'Pul sotuvchiga o‘tkazildi. · ' || new.id, v_link, new.id);
      perform private.notify(v_owner, 'order_released',
        case when v_by_buyer then 'Xaridor tasdiqladi — to‘lov yakunlandi' else 'Nizo hal qilindi — to‘lov yakunlandi' end,
        'Pul komissiya ushlab qolinib hisobingizga o‘tkazildi. · ' || new.id, v_slink, new.id);
    elsif new.payment_state = 'refunded' then
      perform private.notify(new.buyer_id, 'order_refunded', 'Pul qaytarildi', 'Buyurtma bekor qilindi, to‘lov sizga qaytarildi. · ' || new.id, v_link, new.id);
      perform private.notify(v_owner, 'order_refunded', 'Buyurtma bekor qilindi', 'Platforma pulni xaridorga qaytardi. · ' || new.id, v_slink, new.id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists orders_notify on public.orders;
create trigger orders_notify after update on public.orders for each row execute function private.orders_notify();

create or replace function private.disputes_notify() returns trigger language plpgsql security definer set search_path = '' as $$
declare o public.orders; v_owner uuid;
begin
  select * into o from public.orders where id = new.order_id;
  if o.id is null then return new; end if;
  select owner_id into v_owner from public.stores where id = o.shop_id;
  perform private.notify(v_owner, 'dispute_opened', 'Buyurtma bo‘yicha nizo ochildi', 'Xaridor muammo haqida xabar berdi: ' || left(new.reason, 160) || ' · ' || o.id, '/marketplace/sotuvchi?tab=orders', o.id);
  perform private.notify(o.buyer_id, 'dispute_opened', 'Nizo qabul qilindi', 'Murojaatingiz admin ko‘rib chiqishi uchun yuborildi. Pul himoyada turadi. · ' || o.id, '/buyurtmalarim/' || o.id, o.id);
  return new;
end $$;
drop trigger if exists disputes_notify on public.disputes;
create trigger disputes_notify after insert on public.disputes for each row execute function private.disputes_notify();

-- ───────────── RPCs ─────────────
create or replace function public.sh_notifs_list(p_secret text, p_user uuid, p_limit int default 30)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'unread', (select count(*) from public.notifications where user_id = p_user and read_at is null),
    'items', coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'type', x.type, 'title', x.title, 'body', x.body, 'link', x.link,
        'orderId', x.order_id, 'readAt', x.read_at, 'createdAt', x.created_at) order by x.created_at desc, x.id desc)
      from (select * from public.notifications where user_id = p_user order by created_at desc, id desc limit least(greatest(coalesce(p_limit, 30), 1), 100)) x), '[]'::jsonb));
end $$;

create or replace function public.sh_notifs_read(p_secret text, p_user uuid, p_ids bigint[] default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  update public.notifications set read_at = now() where user_id = p_user and read_at is null and (p_ids is null or id = any(p_ids));
  get diagnostics n = row_count;
  return jsonb_build_object('updated', n, 'unread', (select count(*) from public.notifications where user_id = p_user and read_at is null));
end $$;

create or replace function public.sh_tg_status(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where id = p_user;
  return jsonb_build_object('linked', r.tg_chat_id is not null, 'linkedAt', r.tg_linked_at);
end $$;

create or replace function public.sh_tg_link_token(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  delete from public.telegram_link_tokens where user_id = p_user or expires_at < now();
  v := encode(extensions.gen_random_bytes(18), 'hex');
  insert into public.telegram_link_tokens (token, user_id) values (v, p_user);
  return jsonb_build_object('token', v);
end $$;

create or replace function public.sh_tg_link(p_secret text, p_token text, p_chat bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare t public.telegram_link_tokens; v_name text;
begin
  perform private.assert_secret(p_secret);
  select * into t from public.telegram_link_tokens where token = p_token and expires_at > now();
  if t.token is null then return jsonb_build_object('ok', false); end if;
  update public.profiles set tg_chat_id = null, tg_linked_at = null where tg_chat_id = p_chat and id <> t.user_id;
  update public.profiles set tg_chat_id = p_chat, tg_linked_at = now() where id = t.user_id returning full_name into v_name;
  delete from public.telegram_link_tokens where user_id = t.user_id;
  return jsonb_build_object('ok', true, 'name', v_name);
end $$;

create or replace function public.sh_tg_unlink(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  update public.profiles set tg_chat_id = null, tg_linked_at = null where id = p_user;
  return jsonb_build_object('ok', true);
end $$;

-- Claim unsent notifications (≤1 day old, ≤5 attempts) of users with a linked chat.
create or replace function public.sh_notif_outbox(p_secret text, p_limit int default 25)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v jsonb;
begin
  perform private.assert_secret(p_secret);
  with picked as (
    select n.id from public.notifications n join public.profiles p on p.id = n.user_id
    where n.tg_sent_at is null and n.tg_attempts < 5 and n.created_at > now() - interval '1 day' and p.tg_chat_id is not null
    order by n.id limit least(greatest(coalesce(p_limit, 25), 1), 100) for update of n skip locked
  ), upd as (
    update public.notifications n set tg_attempts = n.tg_attempts + 1 from picked where n.id = picked.id
    returning n.id, n.title, n.body, n.link, (select p.tg_chat_id from public.profiles p where p.id = n.user_id) as chat
  )
  select coalesce(jsonb_agg(jsonb_build_object('id', u.id, 'chat', u.chat, 'title', u.title, 'body', u.body, 'link', u.link)), '[]'::jsonb) into v from upd u;
  return v;
end $$;

create or replace function public.sh_notif_tg_done(p_secret text, p_id bigint, p_ok boolean, p_unlink boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if p_ok then update public.notifications set tg_sent_at = now() where id = p_id; end if;
  if p_unlink then
    update public.profiles set tg_chat_id = null, tg_linked_at = null where id = (select user_id from public.notifications where id = p_id);
  end if;
end $$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke execute on function public.sh_notifs_list, public.sh_notifs_read, public.sh_tg_status, public.sh_tg_link_token, public.sh_tg_link,
  public.sh_tg_unlink, public.sh_notif_outbox, public.sh_notif_tg_done from public;
grant execute on function public.sh_notifs_list, public.sh_notifs_read, public.sh_tg_status, public.sh_tg_link_token, public.sh_tg_link,
  public.sh_tg_unlink, public.sh_notif_outbox, public.sh_notif_tg_done to anon, authenticated;

-- ════════════════════════════════════════
-- 20261003b_order_buyer_tg.sql
-- ════════════════════════════════════════
-- Seller UI: does the buyer also get Telegram messages? (only answers for the seller of that order)
create or replace function public.sh_order_buyer_tg(p_secret text, p_user uuid, p_order text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select p.tg_chat_id is not null from public.orders o
    join public.profiles p on p.id = o.buyer_id
    join public.stores s on s.id = o.shop_id
    where o.id = p_order and s.owner_id = p_user), false);
end $$;
revoke execute on function public.sh_order_buyer_tg from public;
grant execute on function public.sh_order_buyer_tg to anon, authenticated;

-- ════════════════════════════════════════
-- 20261003c_community_title_kind_verified.sql
-- ════════════════════════════════════════
-- Community v1 (mobile redesign): post title, 'maslahat' kind, author verified flag, member count.
alter table public.community_posts add column if not exists title text;
alter table public.community_posts drop constraint if exists community_posts_title_check;
alter table public.community_posts add constraint community_posts_title_check
  check (title is null or char_length(title) between 1 and 140);

alter table public.community_posts drop constraint if exists community_posts_kind_check;
alter table public.community_posts add constraint community_posts_kind_check
  check (kind in ('case','savol','yangilik','maslahat'));

-- post json: + title, + author.verified (real: phone confirmed through OTP)
create or replace function private.post_json(p_post_id uuid, p_viewer uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', cp.id, 'kind', cp.kind, 'title', cp.title, 'body', cp.body, 'tags', to_jsonb(cp.tags), 'images', to_jsonb(cp.images),
    'createdAt', cp.created_at,
    'author', jsonb_build_object('id', a.id, 'fullName', a.full_name, 'specialty', a.specialty,
                                 'city', a.city, 'avatarUrl', a.avatar_url,
                                 'verified', a.phone_verified_at is not null),
    'likeCount', (select count(*) from public.community_likes l where l.post_id = cp.id),
    'likedByMe', coalesce((select true from public.community_likes l where l.post_id = cp.id and l.user_id = p_viewer), false),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'body', c.body, 'createdAt', c.created_at,
        'author', jsonb_build_object('id', ca.id, 'fullName', ca.full_name, 'avatarUrl', ca.avatar_url))
        order by c.created_at)
      from public.community_comments c join public.profiles ca on ca.id = c.author_id
      where c.post_id = cp.id), '[]'::jsonb)
  )
  from public.community_posts cp join public.profiles a on a.id = cp.author_id
  where cp.id = p_post_id
$$;

-- create_post gets an optional title (old 6-arg signature replaced)
drop function if exists public.sh_community_create_post(text, uuid, text, text, text[], text[]);
create or replace function public.sh_community_create_post(p_secret text, p_user uuid, p_kind text, p_body text,
  p_tags text[], p_images text[], p_title text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  insert into public.community_posts (author_id, kind, title, body, tags, images)
  values (p_user, p_kind, nullif(left(btrim(coalesce(p_title, '')), 140), ''), p_body,
          coalesce(p_tags, '{}'), coalesce(p_images, '{}'))
  returning id into v_id;
  return private.post_json(v_id, p_user);
end $$;

-- real member count for the community header
create or replace function public.sh_community_stats(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object('members', (select count(*) from public.profiles where blocked_at is null));
end $$;

revoke execute on function public.sh_community_create_post(text, uuid, text, text, text[], text[], text) from public;
grant execute on function public.sh_community_create_post(text, uuid, text, text, text[], text[], text) to anon, authenticated;
revoke execute on function public.sh_community_stats(text) from public;
grant execute on function public.sh_community_stats(text) to anon, authenticated;

-- ════════════════════════════════════════
-- 20261003d_seminar_registrations.sql
-- ════════════════════════════════════════
-- Seminar registrations (real, server-side) + per-registration tickets + organizer link + notifications.
-- Same access model as the rest of the app: RLS on, owner-only direct policies for `authenticated`,
-- and all app access through SECURITY DEFINER RPCs that require the server secret (see src/lib/server/db.ts).
-- Payments are NOT processed here: a paid seminar stays `payment_status = 'awaiting'` until the organizer marks it manually.

-- Organizer link for catalog seminars (catalog content itself stays in src/data/seminars.ts).
create table if not exists public.seminars (
  id text primary key,
  organizer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.seminars enable row level security;
revoke all on public.seminars from anon, authenticated;

create table if not exists public.seminar_registrations (
  id uuid primary key default gen_random_uuid(),
  seminar_id text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,                 -- last 9 digits
  telegram text,
  clinic text,
  status text not null default 'registered' check (status in ('registered', 'confirmed', 'attended', 'cancelled')),
  payment_status text not null default 'free' check (payment_status in ('free', 'awaiting', 'paid')),
  price bigint not null default 0,
  ticket_code text not null unique,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  attended_at timestamptz,
  attended_by uuid references public.profiles(id) on delete set null,
  paid_at timestamptz,
  cancelled_at timestamptz
);
create index if not exists seminar_regs_seminar_idx on public.seminar_registrations (seminar_id, created_at desc);
create index if not exists seminar_regs_user_idx on public.seminar_registrations (user_id, created_at desc);
-- no double registration: one active ticket per user and per phone on a seminar
create unique index if not exists seminar_regs_user_active_uq on public.seminar_registrations (seminar_id, user_id) where status <> 'cancelled';
create unique index if not exists seminar_regs_phone_active_uq on public.seminar_registrations (seminar_id, phone) where status <> 'cancelled';

alter table public.seminar_registrations enable row level security;
drop policy if exists seminar_regs_owner_select on public.seminar_registrations;
drop policy if exists seminar_regs_organizer_select on public.seminar_registrations;
create policy seminar_regs_owner_select on public.seminar_registrations for select to authenticated using (user_id = auth.uid());
create policy seminar_regs_organizer_select on public.seminar_registrations for select to authenticated
  using (exists (select 1 from public.seminars s where s.id = seminar_id and s.organizer_id = auth.uid()));
revoke all on public.seminar_registrations from anon, authenticated;
grant select on public.seminar_registrations to authenticated;

-- ───────────── helpers ─────────────
create or replace function private.sem_is_admin(p_user uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = p_user and blocked_at is null), false)
$$;

create or replace function private.sem_can_manage(p_user uuid, p_seminar text) returns boolean language sql stable security definer set search_path = '' as $$
  select private.sem_is_admin(p_user)
      or exists (select 1 from public.seminars s where s.id = p_seminar and s.organizer_id = p_user)
$$;

create or replace function private.sem_json(r public.seminar_registrations) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'seminarId', r.seminar_id, 'name', r.name, 'phone', r.phone, 'telegram', r.telegram,
    'clinic', r.clinic, 'status', r.status, 'paymentStatus', r.payment_status, 'price', r.price, 'ticketCode', r.ticket_code,
    'createdAt', r.created_at, 'confirmedAt', r.confirmed_at, 'attendedAt', r.attended_at, 'paidAt', r.paid_at, 'cancelledAt', r.cancelled_at)
$$;

-- notify the organizer of a seminar (or every admin while the seminar has no organizer assigned)
create or replace function private.sem_notify_organizer(p_seminar text, p_except uuid, p_title text, p_body text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_org uuid; v_id uuid;
begin
  select organizer_id into v_org from public.seminars where id = p_seminar;
  if v_org is not null then
    if v_org is distinct from p_except then
      perform private.notify(v_org, 'seminar_organizer', p_title, p_body, '/seminarlar/tashkilotchi?seminar=' || p_seminar, null);
    end if;
  else
    for v_id in select id from public.profiles where is_admin and blocked_at is null and id is distinct from p_except loop
      perform private.notify(v_id, 'seminar_organizer', p_title, p_body, '/seminarlar/tashkilotchi?seminar=' || p_seminar, null);
    end loop;
  end if;
end $$;

-- ───────────── RPCs ─────────────
create or replace function public.sh_sem_register(p_secret text, p_user uuid, p_seminar text, p_title text, p_name text, p_phone text,
  p_telegram text, p_clinic text, p_free int, p_price bigint, p_closed boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9); r public.seminar_registrations; v_try int := 0; v_code text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if length(btrim(coalesce(p_name, ''))) < 2 or length(v_phone) < 9 then raise exception 'sem_invalid'; end if;
  if coalesce(p_closed, true) then raise exception 'sem_closed'; end if;
  perform pg_advisory_xact_lock(hashtext('sem:' || p_seminar));
  if exists (select 1 from public.seminar_registrations where seminar_id = p_seminar and status <> 'cancelled' and (user_id = p_user or phone = v_phone)) then
    raise exception 'sem_duplicate';
  end if;
  if (select count(*) from public.seminar_registrations where seminar_id = p_seminar and status <> 'cancelled') >= greatest(coalesce(p_free, 0), 0) then
    raise exception 'sem_full';
  end if;
  loop
    v_code := 'SK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
    exit when not exists (select 1 from public.seminar_registrations where ticket_code = v_code);
    v_try := v_try + 1; if v_try > 5 then raise exception 'sem_retry'; end if;
  end loop;
  insert into public.seminar_registrations (seminar_id, user_id, name, phone, telegram, clinic, payment_status, price, ticket_code)
  values (p_seminar, p_user, left(btrim(p_name), 120), v_phone, nullif(left(btrim(coalesce(p_telegram, '')), 80), ''),
    nullif(left(btrim(coalesce(p_clinic, '')), 120), ''), case when coalesce(p_price, 0) > 0 then 'awaiting' else 'free' end, greatest(coalesce(p_price, 0), 0), v_code)
  returning * into r;
  perform private.notify(p_user, 'seminar_registered', 'Seminarga yozildingiz',
    left(p_title, 120) || ' · chipta ' || r.ticket_code || case when r.payment_status = 'awaiting' then ' · to‘lov kutilmoqda (namuna)' else '' end,
    '/seminarlar/chipta/' || r.id, null);
  perform private.sem_notify_organizer(p_seminar, p_user, 'Seminarga yangi yozilish',
    r.name || ' · +998' || r.phone || ' · ' || left(p_title, 100));
  return private.sem_json(r);
end $$;

create or replace function public.sh_sem_my(p_secret text, p_user uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.sem_json(r) order by r.created_at desc) from public.seminar_registrations r where r.user_id = p_user), '[]'::jsonb);
end $$;

create or replace function public.sh_sem_get(p_secret text, p_user uuid, p_id uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminar_registrations;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.seminar_registrations where id = p_id and user_id = p_user;
  if r.id is null then return null; end if;
  return private.sem_json(r);
end $$;

create or replace function public.sh_sem_occupancy(p_secret text) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_object_agg(seminar_id, jsonb_build_object('registered', c_reg, 'confirmed', c_conf, 'attended', c_att))
    from (select seminar_id,
      count(*) filter (where status = 'registered') c_reg,
      count(*) filter (where status = 'confirmed') c_conf,
      count(*) filter (where status = 'attended') c_att
      from public.seminar_registrations where status <> 'cancelled' group by seminar_id) x), '{}'::jsonb);
end $$;

create or replace function public.sh_sem_act(p_secret text, p_user uuid, p_id uuid, p_action text, p_title text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminar_registrations;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into r from public.seminar_registrations where id = p_id and user_id = p_user for update;
  if r.id is null then raise exception 'sem_notfound'; end if;
  if p_action = 'confirm' then
    if r.status = 'registered' then
      update public.seminar_registrations set status = 'confirmed', confirmed_at = now() where id = r.id returning * into r;
    end if;
  elsif p_action = 'cancel' then
    if r.status in ('registered', 'confirmed') then
      update public.seminar_registrations set status = 'cancelled', cancelled_at = now() where id = r.id returning * into r;
      perform private.sem_notify_organizer(r.seminar_id, p_user, 'Yozilish bekor qilindi', r.name || ' · +998' || r.phone || ' · ' || left(p_title, 100));
    end if;
  else
    raise exception 'sem_invalid';
  end if;
  return private.sem_json(r);
end $$;

-- organizer cabinet: seminars the caller manages (admins: every seminar that has registrations) with their registrations
create or replace function public.sh_sem_organizer(p_secret text, p_user uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_admin boolean;
begin
  perform private.assert_secret(p_secret);
  v_admin := private.sem_is_admin(p_user);
  return jsonb_build_object('admin', v_admin, 'items', coalesce((
    select jsonb_agg(jsonb_build_object('seminarId', s.sid, 'regs', coalesce((
      select jsonb_agg(private.sem_json(r) order by r.created_at desc) from public.seminar_registrations r where r.seminar_id = s.sid), '[]'::jsonb)) order by s.sid)
    from (
      select id as sid from public.seminars where organizer_id = p_user
      union
      select distinct seminar_id from public.seminar_registrations where v_admin
    ) s), '[]'::jsonb));
end $$;

-- check-in by ticket code. Result codes instead of exceptions so the organizer sees who the ticket belongs to.
create or replace function public.sh_sem_checkin(p_secret text, p_user uuid, p_code text, p_title text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminar_registrations; v_code text := upper(btrim(coalesce(p_code, '')));
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into r from public.seminar_registrations where ticket_code = v_code;
  if r.id is null or not private.sem_can_manage(p_user, r.seminar_id) then return jsonb_build_object('result', 'notfound'); end if;
  if r.status = 'cancelled' then return jsonb_build_object('result', 'cancelled', 'reg', private.sem_json(r)); end if;
  if r.status = 'attended' then return jsonb_build_object('result', 'already', 'reg', private.sem_json(r)); end if;
  update public.seminar_registrations set status = 'attended', attended_at = now(), attended_by = p_user where id = r.id returning * into r;
  perform private.notify(r.user_id, 'seminar_attended', 'Seminarga kirish qayd etildi', coalesce(nullif(left(p_title, 120), ''), 'Chipta ' || r.ticket_code), '/seminarlar/chipta/' || r.id, null);
  return jsonb_build_object('result', 'ok', 'reg', private.sem_json(r));
end $$;

-- organizer marks an offline payment as received (nothing is charged by the platform)
create or replace function public.sh_sem_mark_paid(p_secret text, p_user uuid, p_id uuid, p_title text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminar_registrations;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into r from public.seminar_registrations where id = p_id for update;
  if r.id is null or not private.sem_can_manage(p_user, r.seminar_id) then raise exception 'sem_notfound'; end if;
  if r.payment_status = 'awaiting' and r.status <> 'cancelled' then
    update public.seminar_registrations set payment_status = 'paid', paid_at = now() where id = r.id returning * into r;
    perform private.notify(r.user_id, 'seminar_paid', 'To‘lov tashkilotchi tomonidan qayd etildi', left(p_title, 120) || ' · chipta ' || r.ticket_code, '/seminarlar/chipta/' || r.id, null);
  end if;
  return private.sem_json(r);
end $$;

-- admin assigns the organizer of a catalog seminar by phone (last 9 digits); empty phone clears it
create or replace function public.sh_sem_set_organizer(p_secret text, p_admin uuid, p_seminar text, p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9); v_org uuid;
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  if length(v_phone) >= 9 then
    select id into v_org from public.profiles where right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 9) = v_phone limit 1;
    if v_org is null then raise exception 'sem_notfound'; end if;
  end if;
  insert into public.seminars (id, organizer_id) values (p_seminar, v_org)
    on conflict (id) do update set organizer_id = excluded.organizer_id;
  if v_org is not null then
    perform private.notify(v_org, 'seminar_organizer', 'Siz seminar tashkilotchisisiz', 'Yozilgan doktorlar ro‘yxati va chipta tekshiruvi shu yerda.', '/seminarlar/tashkilotchi?seminar=' || p_seminar, null);
  end if;
  return jsonb_build_object('seminarId', p_seminar, 'organizerId', v_org);
end $$;

revoke all on all functions in schema private from public, anon, authenticated;
revoke execute on function public.sh_sem_register, public.sh_sem_my, public.sh_sem_get, public.sh_sem_occupancy, public.sh_sem_act,
  public.sh_sem_organizer, public.sh_sem_checkin, public.sh_sem_mark_paid, public.sh_sem_set_organizer from public;
grant execute on function public.sh_sem_register, public.sh_sem_my, public.sh_sem_get, public.sh_sem_occupancy, public.sh_sem_act,
  public.sh_sem_organizer, public.sh_sem_checkin, public.sh_sem_mark_paid, public.sh_sem_set_organizer to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20261003e_seminar_content.sql
-- ════════════════════════════════════════
-- Organizer-created seminars (DB), organizer applications, admin moderation (pending → published), delete/close with notifications.
-- Catalog seminars (src/data/seminars.ts) stay as seed; rows with source='catalog' only carry an organizer link.

alter table public.seminars
  add column if not exists source text not null default 'catalog' check (source in ('catalog', 'user')),
  add column if not exists status text not null default 'published' check (status in ('pending', 'published', 'rejected', 'closed', 'deleted')),
  add column if not exists reject_reason text,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists speakers jsonb not null default '[]'::jsonb,
  add column if not exists event_date date,
  add column if not exists start_time text,
  add column if not exists end_time text,
  add column if not exists city text,
  add column if not exists venue text,
  add column if not exists price bigint not null default 0 check (price >= 0),
  add column if not exists seats_total int check (seats_total is null or seats_total between 1 and 5000),
  add column if not exists specialty text,
  add column if not exists image text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists program jsonb not null default '[]'::jsonb,
  add column if not exists learnings text[] not null default '{}',
  add column if not exists updated_at timestamptz not null default now();
create index if not exists seminars_status_idx on public.seminars (status, event_date) where source = 'user';

drop policy if exists seminars_public_select on public.seminars;
create policy seminars_public_select on public.seminars for select to anon, authenticated
  using (source = 'user' and status in ('published', 'closed'));
drop policy if exists seminars_owner_select on public.seminars;
create policy seminars_owner_select on public.seminars for select to authenticated using (organizer_id = auth.uid());
grant select on public.seminars to anon, authenticated;

create table if not exists public.organizer_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null unique references public.profiles(id) on delete cascade,
  org_name text not null,
  phone text not null,
  city text,
  bio text,
  telegram text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reject_reason text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.organizer_applications enable row level security;
drop policy if exists org_apps_owner_select on public.organizer_applications;
create policy org_apps_owner_select on public.organizer_applications for select to authenticated using (applicant_id = auth.uid());
revoke all on public.organizer_applications from anon, authenticated;
grant select on public.organizer_applications to authenticated;

create or replace function private.sem_notify_admins(p_type text, p_title text, p_body text, p_link text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  for v_id in select id from public.profiles where is_admin and blocked_at is null loop
    perform private.notify(v_id, p_type, p_title, p_body, p_link, null);
  end loop;
end $$;

create or replace function private.sem_row_json(r public.seminars) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'organizerId', r.organizer_id, 'source', r.source, 'status', r.status, 'rejectReason', r.reject_reason,
    'title', r.title, 'description', r.description, 'speakers', r.speakers, 'date', r.event_date, 'time', r.start_time, 'timeEnd', r.end_time,
    'city', r.city, 'venue', r.venue, 'price', r.price, 'seats', r.seats_total, 'specialty', r.specialty, 'image', r.image,
    'tags', to_jsonb(r.tags), 'program', r.program, 'learnings', to_jsonb(r.learnings), 'createdAt', r.created_at, 'updatedAt', r.updated_at,
    'registered', (select count(*) from public.seminar_registrations g where g.seminar_id = r.id and g.status <> 'cancelled'))
$$;

create or replace function private.org_json(a public.organizer_applications) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'applicantId', a.applicant_id, 'applicantName', (select full_name from public.profiles where id = a.applicant_id),
    'orgName', a.org_name, 'phone', a.phone, 'city', a.city, 'bio', a.bio, 'telegram', a.telegram, 'status', a.status,
    'rejectReason', a.reject_reason, 'createdAt', a.created_at)
$$;

-- ───────────── organizer applications ─────────────
create or replace function public.sh_org_apply(p_secret text, p_user uuid, p_org text, p_phone text, p_city text, p_bio text, p_telegram text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.organizer_applications; v_phone text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 9);
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if length(btrim(coalesce(p_org, ''))) < 2 or length(v_phone) < 9 then raise exception 'sem_invalid'; end if;
  select * into a from public.organizer_applications where applicant_id = p_user for update;
  if a.id is not null and a.status = 'approved' then return private.org_json(a); end if;
  if a.id is null then
    insert into public.organizer_applications (applicant_id, org_name, phone, city, bio, telegram)
    values (p_user, left(btrim(p_org), 120), v_phone, nullif(left(btrim(coalesce(p_city, '')), 80), ''), nullif(left(btrim(coalesce(p_bio, '')), 1000), ''), nullif(left(btrim(coalesce(p_telegram, '')), 80), ''))
    returning * into a;
  else
    update public.organizer_applications set org_name = left(btrim(p_org), 120), phone = v_phone, city = nullif(left(btrim(coalesce(p_city, '')), 80), ''),
      bio = nullif(left(btrim(coalesce(p_bio, '')), 1000), ''), telegram = nullif(left(btrim(coalesce(p_telegram, '')), 80), ''),
      status = 'pending', reject_reason = null, updated_at = now() where id = a.id returning * into a;
  end if;
  perform private.sem_notify_admins('organizer_application', 'Yangi tashkilotchi arizasi', a.org_name || ' · +998' || a.phone, '/admin/seminarlar');
  return private.org_json(a);
end $$;

create or replace function public.sh_org_me(p_secret text, p_user uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.organizer_applications; v_admin boolean;
begin
  perform private.assert_secret(p_secret);
  v_admin := private.sem_is_admin(p_user);
  select * into a from public.organizer_applications where applicant_id = p_user;
  return jsonb_build_object('admin', v_admin, 'application', case when a.id is null then null else private.org_json(a) end,
    'canCreate', v_admin or coalesce(a.status = 'approved', false));
end $$;

create or replace function public.sh_org_admin(p_secret text, p_admin uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  return jsonb_build_object(
    'applications', coalesce((select jsonb_agg(private.org_json(a) order by (a.status = 'pending') desc, a.created_at desc) from public.organizer_applications a), '[]'::jsonb),
    'seminars', coalesce((select jsonb_agg(private.sem_row_json(s) || jsonb_build_object('organizerName', (select full_name from public.profiles where id = s.organizer_id))
        order by (s.status = 'pending') desc, s.created_at desc) from public.seminars s where s.source = 'user' and s.status <> 'deleted'), '[]'::jsonb),
    'organizers', coalesce((select jsonb_agg(jsonb_build_object('seminarId', s.id, 'organizerId', s.organizer_id, 'organizerName', (select full_name from public.profiles where id = s.organizer_id)))
        from public.seminars s where s.organizer_id is not null), '[]'::jsonb));
end $$;

create or replace function public.sh_org_review(p_secret text, p_admin uuid, p_id uuid, p_approve boolean, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare a public.organizer_applications;
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  select * into a from public.organizer_applications where id = p_id for update;
  if a.id is null then raise exception 'sem_notfound'; end if;
  update public.organizer_applications set status = case when p_approve then 'approved' else 'rejected' end,
    reject_reason = case when p_approve then null else nullif(left(btrim(coalesce(p_reason, '')), 300), '') end,
    reviewed_by = p_admin, reviewed_at = now(), updated_at = now() where id = a.id returning * into a;
  if p_approve then
    perform private.notify(a.applicant_id, 'organizer_approved', 'Tashkilotchi arizangiz tasdiqlandi', 'Endi seminar yaratishingiz mumkin.', '/seminarlar/yozuvlarim/tashkilotchi', null);
  else
    perform private.notify(a.applicant_id, 'organizer_rejected', 'Tashkilotchi arizangiz rad etildi', coalesce(a.reject_reason, 'Sabab ko‘rsatilmagan.'), '/seminarlar/yozuvlarim/tashkilotchi', null);
  end if;
  return private.org_json(a);
end $$;

-- ───────────── seminars ─────────────
create or replace function public.sh_sem_save(p_secret text, p_user uuid, p_id text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_admin boolean; v_ok boolean; r public.seminars; v_id text; v_status text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  v_admin := private.sem_is_admin(p_user);
  v_ok := v_admin or exists (select 1 from public.organizer_applications where applicant_id = p_user and status = 'approved');
  if coalesce(p_id, '') = '' then
    if not v_ok then raise exception 'sem_not_organizer'; end if;
    v_id := 'u-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    v_status := case when v_admin then 'published' else 'pending' end;
    insert into public.seminars (id, organizer_id, source, status, title, description, speakers, event_date, start_time, end_time, city, venue, price, seats_total, specialty, image, tags, program, learnings)
    values (v_id, p_user, 'user', v_status, left(btrim(p_data->>'title'), 160), nullif(left(btrim(coalesce(p_data->>'description', '')), 4000), ''),
      coalesce(p_data->'speakers', '[]'::jsonb), (p_data->>'date')::date, p_data->>'startTime', p_data->>'endTime', p_data->>'city', left(btrim(p_data->>'venue'), 200),
      greatest((p_data->>'price')::bigint, 0), (p_data->>'seats')::int, p_data->>'specialty', p_data->>'image',
      array(select jsonb_array_elements_text(coalesce(p_data->'tags', '[]'::jsonb))), coalesce(p_data->'program', '[]'::jsonb),
      array(select jsonb_array_elements_text(coalesce(p_data->'learnings', '[]'::jsonb))))
    returning * into r;
    if v_status = 'pending' then
      perform private.sem_notify_admins('seminar_pending', 'Yangi seminar tasdiq kutmoqda', left(r.title, 120), '/admin/seminarlar');
    end if;
  else
    select * into r from public.seminars where id = p_id and source = 'user' and status <> 'deleted' for update;
    if r.id is null or not (v_admin or r.organizer_id = p_user) then raise exception 'sem_notfound'; end if;
    if (p_data->>'seats')::int < (select count(*) from public.seminar_registrations where seminar_id = r.id and status <> 'cancelled') then
      raise exception 'sem_seats_low';
    end if;
    v_status := case when v_admin or r.status in ('published', 'closed') then r.status else 'pending' end;
    update public.seminars set status = v_status, reject_reason = case when v_status = 'pending' then null else reject_reason end,
      title = left(btrim(p_data->>'title'), 160), description = nullif(left(btrim(coalesce(p_data->>'description', '')), 4000), ''),
      speakers = coalesce(p_data->'speakers', '[]'::jsonb), event_date = (p_data->>'date')::date, start_time = p_data->>'startTime', end_time = p_data->>'endTime',
      city = p_data->>'city', venue = left(btrim(p_data->>'venue'), 200), price = greatest((p_data->>'price')::bigint, 0), seats_total = (p_data->>'seats')::int,
      specialty = p_data->>'specialty', image = p_data->>'image', tags = array(select jsonb_array_elements_text(coalesce(p_data->'tags', '[]'::jsonb))),
      program = coalesce(p_data->'program', '[]'::jsonb), learnings = array(select jsonb_array_elements_text(coalesce(p_data->'learnings', '[]'::jsonb))), updated_at = now()
    where id = r.id returning * into r;
    if r.status = 'pending' then
      perform private.sem_notify_admins('seminar_pending', 'Seminar qayta tasdiqqa yuborildi', left(r.title, 120), '/admin/seminarlar');
    end if;
  end if;
  return private.sem_row_json(r);
end $$;

-- close | reopen | delete (delete cancels active registrations and notifies every registrant)
create or replace function public.sh_sem_set_state(p_secret text, p_user uuid, p_id text, p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminars; g record;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into r from public.seminars where id = p_id and source = 'user' and status <> 'deleted' for update;
  if r.id is null or not (private.sem_is_admin(p_user) or r.organizer_id = p_user) then raise exception 'sem_notfound'; end if;
  if p_action = 'close' then
    if r.status = 'published' then update public.seminars set status = 'closed', updated_at = now() where id = r.id returning * into r; end if;
  elsif p_action = 'reopen' then
    if r.status = 'closed' then update public.seminars set status = 'published', updated_at = now() where id = r.id returning * into r; end if;
  elsif p_action = 'delete' then
    for g in select * from public.seminar_registrations where seminar_id = r.id and status <> 'cancelled' for update loop
      update public.seminar_registrations set status = 'cancelled', cancelled_at = now() where id = g.id;
      perform private.notify(g.user_id, 'seminar_cancelled', 'Seminar bekor qilindi', left(r.title, 120) || ' · tashkilotchi seminarni o‘chirdi, chiptangiz bekor qilindi.', '/seminarlar/yozuvlarim', null);
    end loop;
    update public.seminars set status = 'deleted', updated_at = now() where id = r.id returning * into r;
  else
    raise exception 'sem_invalid';
  end if;
  return private.sem_row_json(r);
end $$;

create or replace function public.sh_sem_admin_review(p_secret text, p_admin uuid, p_id text, p_approve boolean, p_reason text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminars;
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  select * into r from public.seminars where id = p_id and source = 'user' and status in ('pending', 'rejected', 'published', 'closed') for update;
  if r.id is null then raise exception 'sem_notfound'; end if;
  if p_approve then
    update public.seminars set status = 'published', reject_reason = null, updated_at = now() where id = r.id returning * into r;
    perform private.notify(r.organizer_id, 'seminar_published', 'Seminar tasdiqlandi', left(r.title, 120) || ' · endi hamma ko‘radi.', '/seminarlar/' || r.id, null);
  else
    update public.seminars set status = 'rejected', reject_reason = nullif(left(btrim(coalesce(p_reason, '')), 300), ''), updated_at = now() where id = r.id returning * into r;
    perform private.notify(r.organizer_id, 'seminar_rejected', 'Seminar rad etildi', left(r.title, 120) || ' · ' || coalesce(r.reject_reason, 'sabab ko‘rsatilmagan'), '/seminarlar/yozuvlarim/tashkilotchi', null);
  end if;
  return private.sem_row_json(r);
end $$;

create or replace function public.sh_sem_catalog(p_secret text) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.sem_row_json(s) order by s.event_date) from public.seminars s where s.source = 'user' and s.status in ('published', 'closed')), '[]'::jsonb);
end $$;

-- one seminar: public if published/closed; owner/admin also see pending/rejected
create or replace function public.sh_sem_get_one(p_secret text, p_id text, p_user uuid default null) returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.seminars;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.seminars where id = p_id and source = 'user' and status <> 'deleted';
  if r.id is null then return null; end if;
  if r.status in ('published', 'closed') or (p_user is not null and (r.organizer_id = p_user or private.sem_is_admin(p_user))) then
    return private.sem_row_json(r);
  end if;
  return null;
end $$;

create or replace function public.sh_sem_mine(p_secret text, p_user uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.sem_row_json(s) order by s.created_at desc) from public.seminars s
    where s.source = 'user' and s.organizer_id = p_user and s.status <> 'deleted'), '[]'::jsonb);
end $$;

-- organizer cabinet registrants: now also returns title/status for DB seminars and lists seminars without registrations
create or replace function public.sh_sem_organizer(p_secret text, p_user uuid) returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_admin boolean;
begin
  perform private.assert_secret(p_secret);
  v_admin := private.sem_is_admin(p_user);
  return jsonb_build_object('admin', v_admin, 'items', coalesce((
    select jsonb_agg(jsonb_build_object('seminarId', s.sid, 'title', (select title from public.seminars where id = s.sid), 'regs', coalesce((
      select jsonb_agg(private.sem_json(r) order by r.created_at desc) from public.seminar_registrations r where r.seminar_id = s.sid), '[]'::jsonb)) order by s.sid)
    from (
      select id as sid from public.seminars where organizer_id = p_user and status <> 'deleted'
      union
      select distinct seminar_id from public.seminar_registrations where v_admin
    ) s), '[]'::jsonb));
end $$;

revoke execute on function private.sem_notify_admins, private.sem_row_json, private.org_json from public, anon, authenticated;
revoke execute on function public.sh_org_apply, public.sh_org_me, public.sh_org_admin, public.sh_org_review, public.sh_sem_save, public.sh_sem_set_state,
  public.sh_sem_admin_review, public.sh_sem_catalog, public.sh_sem_get_one, public.sh_sem_mine, public.sh_sem_organizer from public;
grant execute on function public.sh_org_apply, public.sh_org_me, public.sh_org_admin, public.sh_org_review, public.sh_sem_save, public.sh_sem_set_state,
  public.sh_sem_admin_review, public.sh_sem_catalog, public.sh_sem_get_one, public.sh_sem_mine, public.sh_sem_organizer to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20261003f_sem_json_title.sql
-- ════════════════════════════════════════
-- Registrations carry the title of organizer-created (DB) seminars so tickets stay readable even after the seminar is deleted.
create or replace function private.sem_json(r public.seminar_registrations)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'seminarId', r.seminar_id, 'seminarTitle', (select s.title from public.seminars s where s.id = r.seminar_id),
    'name', r.name, 'phone', r.phone, 'telegram', r.telegram,
    'clinic', r.clinic, 'status', r.status, 'paymentStatus', r.payment_status, 'price', r.price, 'ticketCode', r.ticket_code,
    'createdAt', r.created_at, 'confirmedAt', r.confirmed_at, 'attendedAt', r.attended_at, 'paidAt', r.paid_at, 'cancelledAt', r.cancelled_at)
$$;

-- ════════════════════════════════════════
-- 20261004a_ustalar_laboratoriya.sql
-- ════════════════════════════════════════
-- 2-bosqich (A): Ustalar + Laboratoriya real DB.
-- Public: only moderated (published) profiles, WITHOUT phone/telegram. Phone opens only after the owner accepts.
-- All writes go through sh_* SECURITY DEFINER RPCs (p_secret). RLS on; owner-only select policies; no anon access.

create or replace function private.phone9(p text) returns text language sql immutable set search_path = '' as $$
  select right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 9)
$$;
create or replace function private.phone_fmt(p text) returns text language sql immutable set search_path = '' as $$
  select case when length(coalesce(p, '')) = 9 then '+998 ' || substr(p, 1, 2) || ' ' || substr(p, 3, 3) || ' ' || substr(p, 6, 2) || ' ' || substr(p, 8, 2) else p end
$$;

-- ───────────── tables ─────────────
create table if not exists public.masters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  kind text not null default 'usta' check (kind in ('usta', 'kompaniya')),
  name text not null check (char_length(name) between 2 and 80),
  title text not null check (char_length(title) between 2 and 80),
  services text[] not null check (cardinality(services) between 1 and 6 and services <@ array['rentgen','kreslo','ornatish','tamirlash','mebel','servis']),
  city text not null check (char_length(city) between 2 and 60),
  years int not null default 0 check (years between 0 and 60),
  description text check (description is null or char_length(description) <= 600),
  photo text check (photo is null or char_length(photo) <= 400),
  phone text not null check (char_length(phone) = 9),
  telegram text check (telegram is null or char_length(telegram) <= 80),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists masters_status_idx on public.masters (status, created_at desc);

create table if not exists public.master_requests (
  id uuid primary key default gen_random_uuid(),
  master_id uuid not null references public.masters(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  service text not null check (service in ('rentgen','kreslo','ornatish','tamirlash','mebel')),
  clinic text not null check (char_length(clinic) between 2 and 120),
  district text check (district is null or char_length(district) <= 60),
  address text check (address is null or char_length(address) <= 200),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) = 9),
  note text check (note is null or char_length(note) <= 500),
  when_need text not null default 'bugun' check (when_need in ('bugun', 'ertaga', 'sana')),
  need_date date,
  status text not null default 'yuborildi' check (status in ('yuborildi', 'jarayonda', 'bajarildi', 'bekor', 'rad')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists master_requests_master_idx on public.master_requests (master_id, created_at desc);
create index if not exists master_requests_req_idx on public.master_requests (requester_id, created_at desc);
-- one open request per (requester, master, service)
create unique index if not exists master_requests_active_uq on public.master_requests (master_id, requester_id, service) where status in ('yuborildi', 'jarayonda');

create table if not exists public.labs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  city text not null check (char_length(city) between 2 and 60),
  services text[] not null check (cardinality(services) between 1 and 6 and services <@ array['crown','veneer','implant','bridge','removable','cadcam']),
  materials text[] not null default '{}' check (materials <@ array['zirconia','emax','metal-ceramic','premium']),
  description text check (description is null or char_length(description) <= 600),
  days int check (days is null or days between 1 and 60),
  price_from bigint check (price_from is null or price_from between 0 and 1000000000),
  photo text check (photo is null or char_length(photo) <= 400),
  phone text not null check (char_length(phone) = 9),
  telegram text check (telegram is null or char_length(telegram) <= 80),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists labs_status_idx on public.labs (status, created_at desc);

create table if not exists public.lab_orders (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid not null references public.labs(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  service text not null check (service in ('crown','veneer','implant','bridge','removable','cadcam')),
  material text not null check (material in ('zirconia','emax','metal-ceramic','premium')),
  patient_code text not null check (char_length(patient_code) between 1 and 16),
  due_days int not null check (due_days between 1 and 60),
  phone text not null check (char_length(phone) = 9),
  note text check (note is null or char_length(note) <= 500),
  status text not null default 'yangi' check (status in ('yangi', 'qabul_qilindi', 'ishlanmoqda', 'tayyor', 'yetkazildi', 'bekor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists lab_orders_lab_idx on public.lab_orders (lab_id, created_at desc);
create index if not exists lab_orders_doctor_idx on public.lab_orders (doctor_id, created_at desc);
create unique index if not exists lab_orders_active_uq on public.lab_orders (lab_id, doctor_id, patient_code, service) where status in ('yangi', 'qabul_qilindi', 'ishlanmoqda', 'tayyor');

-- ───────────── RLS ─────────────
alter table public.masters enable row level security;
alter table public.master_requests enable row level security;
alter table public.labs enable row level security;
alter table public.lab_orders enable row level security;
drop policy if exists masters_owner_select on public.masters;
create policy masters_owner_select on public.masters for select to authenticated using (owner_id = auth.uid());
drop policy if exists master_requests_party_select on public.master_requests;
create policy master_requests_party_select on public.master_requests for select to authenticated
  using (requester_id = auth.uid() or exists (select 1 from public.masters m where m.id = master_id and m.owner_id = auth.uid()));
drop policy if exists labs_owner_select on public.labs;
create policy labs_owner_select on public.labs for select to authenticated using (owner_id = auth.uid());
drop policy if exists lab_orders_party_select on public.lab_orders;
create policy lab_orders_party_select on public.lab_orders for select to authenticated
  using (doctor_id = auth.uid() or exists (select 1 from public.labs l where l.id = lab_id and l.owner_id = auth.uid()));
revoke all on public.masters, public.master_requests, public.labs, public.lab_orders from anon, authenticated;
grant select on public.masters, public.master_requests, public.labs, public.lab_orders to authenticated;

-- ───────────── JSON builders ─────────────
create or replace function private.master_json(m public.masters, p_full boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', m.id, 'name', m.name, 'kind', m.kind, 'title', m.title, 'services', to_jsonb(m.services), 'city', m.city,
    'years', m.years, 'description', m.description, 'photo', m.photo, 'status', m.status, 'createdAt', m.created_at,
    'jobs', (select count(*) from public.master_requests r where r.master_id = m.id and r.status = 'bajarildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(m.phone), 'telegram', m.telegram, 'rejectReason', m.reject_reason) else '{}'::jsonb end
$$;

create or replace function private.lab_json(l public.labs, p_full boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'name', l.name, 'city', l.city, 'services', to_jsonb(l.services), 'materials', to_jsonb(l.materials),
    'description', l.description, 'days', l.days, 'priceFrom', l.price_from, 'photo', l.photo, 'status', l.status, 'createdAt', l.created_at,
    'done', (select count(*) from public.lab_orders o where o.lab_id = l.id and o.status = 'yetkazildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram, 'rejectReason', l.reject_reason) else '{}'::jsonb end
$$;

-- ───────────── Ustalar ─────────────
create or replace function public.sh_master_catalog(p_secret text, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.master_json(m, false) || jsonb_build_object('mine', m.owner_id is not distinct from p_viewer) order by m.created_at desc)
    from public.masters m where m.status = 'published'), '[]'::jsonb);
end $$;

create or replace function public.sh_master_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters;
begin
  perform private.assert_secret(p_secret);
  select * into m from public.masters where owner_id = p_user;
  if m.id is null then return null; end if;
  return private.master_json(m, true);
end $$;

create or replace function public.sh_master_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters; v_phone text := private.phone9(p_data->>'phone'); v_services text[];
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(btrim(coalesce(p_data->>'title', ''))) < 2
     or cardinality(v_services) < 1 or char_length(v_phone) <> 9 or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 then
    raise exception 'val_invalid';
  end if;
  select * into m from public.masters where owner_id = p_user for update;
  if m.id is null then
    insert into public.masters (owner_id, kind, name, title, services, city, years, description, photo, phone, telegram, status)
    values (p_user, case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'title'), 80),
      v_services, left(btrim(p_data->>'city'), 60), coalesce((p_data->>'years')::int, 0), nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''),
      nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), 'pending')
    returning * into m;
    perform private.sem_notify_admins('moderation_new', 'Yangi usta profili', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'master_pending', 'Usta profilingiz moderatsiyada', 'Admin tasdiqlagach hamma ko‘radi.', '/ustalar/mening', null);
  else
    update public.masters set kind = case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, name = left(btrim(p_data->>'name'), 80),
      title = left(btrim(p_data->>'title'), 80), services = v_services, city = left(btrim(p_data->>'city'), 60), years = coalesce((p_data->>'years')::int, 0),
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''), phone = v_phone,
      telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      status = case when status in ('rejected') then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end,
      updated_at = now() where id = m.id returning * into m;
    if m.status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Usta profili yangilandi', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.master_json(m, true);
end $$;

create or replace function public.sh_master_delete(p_secret text, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  delete from public.masters where owner_id = p_user;
end $$;

create or replace function public.sh_master_req_create(p_secret text, p_user uuid, p_master uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters; r public.master_requests; v_phone text := private.phone9(p_data->>'phone'); v_when text := coalesce(p_data->>'when', 'bugun');
  v_date date;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into m from public.masters where id = p_master and status = 'published';
  if m.id is null then raise exception 'req_notfound'; end if;
  if m.owner_id = p_user then raise exception 'req_self'; end if;
  if char_length(btrim(coalesce(p_data->>'clinic', ''))) < 2 or char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(v_phone) <> 9
     or p_data->>'service' not in ('rentgen','kreslo','ornatish','tamirlash','mebel') or v_when not in ('bugun','ertaga','sana') then
    raise exception 'val_invalid';
  end if;
  if v_when = 'sana' then
    begin v_date := (p_data->>'date')::date; exception when others then raise exception 'val_invalid'; end;
    if v_date is null or v_date < current_date then raise exception 'val_invalid'; end if;
  end if;
  if (select count(*) from public.master_requests where requester_id = p_user and created_at > now() - interval '1 hour') >= 8 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.master_requests where master_id = m.id and requester_id = p_user and service = p_data->>'service' and status in ('yuborildi', 'jarayonda')) then
    raise exception 'req_duplicate';
  end if;
  insert into public.master_requests (master_id, requester_id, service, clinic, district, address, name, phone, note, when_need, need_date)
  values (m.id, p_user, p_data->>'service', left(btrim(p_data->>'clinic'), 120), nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''),
    nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''), left(btrim(p_data->>'name'), 80), v_phone,
    nullif(left(btrim(coalesce(p_data->>'note', '')), 500), ''), v_when, v_date) returning * into r;
  perform private.notify(m.owner_id, 'master_request', 'Yangi xizmat so‘rovi', left(r.clinic, 80) || ' · ' || r.name, '/ustalar/sorovlarim?tab=kelgan', null);
  perform private.notify(p_user, 'master_request_sent', 'So‘rov yuborildi', left(m.name, 80) || ' ga so‘rovingiz yuborildi. Javobni kuting.', '/ustalar/sorovlarim', null);
  return jsonb_build_object('id', r.id, 'status', r.status);
end $$;

create or replace function private.master_req_json(r public.master_requests, m public.masters, p_for_owner boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'masterId', r.master_id, 'masterName', m.name, 'service', r.service, 'clinic', r.clinic, 'district', r.district,
    'address', r.address, 'name', r.name, 'phone', private.phone_fmt(r.phone), 'note', r.note, 'when', r.when_need, 'date', r.need_date,
    'status', r.status, 'createdAt', r.created_at, 'updatedAt', r.updated_at)
  || case when not p_for_owner and r.status in ('jarayonda', 'bajarildi') then jsonb_build_object('masterPhone', private.phone_fmt(m.phone), 'masterTelegram', m.telegram) else '{}'::jsonb end
$$;

create or replace function public.sh_master_req_list(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'outgoing', coalesce((select jsonb_agg(private.master_req_json(r, m, false) order by r.created_at desc)
      from public.master_requests r join public.masters m on m.id = r.master_id where r.requester_id = p_user), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(private.master_req_json(r, m, true) order by r.created_at desc)
      from public.master_requests r join public.masters m on m.id = r.master_id where m.owner_id = p_user), '[]'::jsonb));
end $$;

create or replace function public.sh_master_req_set(p_secret text, p_user uuid, p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.master_requests; m public.masters; v_owner boolean;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into r from public.master_requests where id = p_id for update;
  if r.id is null then raise exception 'req_notfound'; end if;
  select * into m from public.masters where id = r.master_id;
  v_owner := m.owner_id = p_user;
  if not v_owner and r.requester_id <> p_user then raise exception 'req_notfound'; end if;
  if v_owner then
    if not ((r.status = 'yuborildi' and p_status in ('jarayonda', 'rad')) or (r.status = 'jarayonda' and p_status in ('bajarildi', 'bekor'))) then raise exception 'req_state'; end if;
  else
    if not (r.status in ('yuborildi', 'jarayonda') and p_status = 'bekor') then raise exception 'req_state'; end if;
  end if;
  update public.master_requests set status = p_status, updated_at = now() where id = r.id returning * into r;
  if v_owner then
    perform private.notify(r.requester_id, 'master_request_' || r.status,
      case r.status when 'jarayonda' then 'So‘rovingiz qabul qilindi' when 'rad' then 'So‘rovingiz rad etildi' when 'bajarildi' then 'Ish bajarildi' else 'So‘rov bekor qilindi' end,
      case r.status when 'jarayonda' then left(m.name, 80) || ' qabul qildi. Telefon raqami ochildi.' else left(m.name, 80) || ' · ' || r.clinic end,
      '/ustalar/sorovlarim', null);
    perform private.notify(p_user, 'master_request_done', 'So‘rov holati yangilandi', left(r.clinic, 80) || ' · ' || r.status, '/ustalar/sorovlarim?tab=kelgan', null);
  else
    perform private.notify(m.owner_id, 'master_request_cancelled', 'So‘rov bekor qilindi', left(r.clinic, 80) || ' · ' || r.name, '/ustalar/sorovlarim?tab=kelgan', null);
  end if;
  return private.master_req_json(r, m, v_owner);
end $$;

-- ───────────── Laboratoriya ─────────────
create or replace function public.sh_lab_catalog(p_secret text, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.lab_json(l, false) || jsonb_build_object('mine', l.owner_id is not distinct from p_viewer) order by l.created_at desc)
    from public.labs l where l.status = 'published'), '[]'::jsonb);
end $$;

create or replace function public.sh_lab_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs;
begin
  perform private.assert_secret(p_secret);
  select * into l from public.labs where owner_id = p_user;
  if l.id is null then return null; end if;
  return private.lab_json(l, true);
end $$;

create or replace function public.sh_lab_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs; v_phone text := private.phone9(p_data->>'phone'); v_services text[]; v_materials text[];
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x;
  select coalesce(array_agg(x), '{}') into v_materials from jsonb_array_elements_text(coalesce(p_data->'materials', '[]'::jsonb)) x;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or cardinality(v_services) < 1 or char_length(v_phone) <> 9
     or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 then raise exception 'val_invalid'; end if;
  select * into l from public.labs where owner_id = p_user for update;
  if l.id is null then
    insert into public.labs (owner_id, name, city, services, materials, description, days, price_from, photo, phone, telegram, status)
    values (p_user, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'city'), 60), v_services, v_materials,
      nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), nullif(p_data->>'days', '')::int, nullif(p_data->>'priceFrom', '')::bigint,
      nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), 'pending')
    returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Yangi laboratoriya profili', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'lab_pending', 'Laboratoriya profilingiz moderatsiyada', 'Admin tasdiqlagach katalogda ko‘rinadi.', '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  else
    update public.labs set name = left(btrim(p_data->>'name'), 80), city = left(btrim(p_data->>'city'), 60), services = v_services, materials = v_materials,
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), days = nullif(p_data->>'days', '')::int, price_from = nullif(p_data->>'priceFrom', '')::bigint,
      photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''), phone = v_phone, telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end,
      updated_at = now() where id = l.id returning * into l;
    if l.status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Laboratoriya profili yangilandi', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.lab_json(l, true);
end $$;

create or replace function public.sh_lab_delete(p_secret text, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  delete from public.labs where owner_id = p_user;
end $$;

create or replace function public.sh_lab_order_create(p_secret text, p_user uuid, p_lab uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs; o public.lab_orders; v_phone text := private.phone9(p_data->>'phone'); v_code text := btrim(coalesce(p_data->>'patientCode', ''));
  v_days int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into l from public.labs where id = p_lab and status = 'published';
  if l.id is null then raise exception 'req_notfound'; end if;
  if l.owner_id = p_user then raise exception 'req_self'; end if;
  begin v_days := (p_data->>'dueDays')::int; exception when others then raise exception 'val_invalid'; end;
  if v_code = '' or char_length(v_code) > 16 or char_length(v_phone) <> 9 or v_days is null or v_days not between 1 and 60
     or p_data->>'service' not in ('crown','veneer','implant','bridge','removable','cadcam')
     or p_data->>'material' not in ('zirconia','emax','metal-ceramic','premium') then raise exception 'val_invalid'; end if;
  if (select count(*) from public.lab_orders where doctor_id = p_user and created_at > now() - interval '1 hour') >= 12 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.lab_orders where lab_id = l.id and doctor_id = p_user and patient_code = v_code and service = p_data->>'service'
             and status in ('yangi', 'qabul_qilindi', 'ishlanmoqda', 'tayyor')) then raise exception 'req_duplicate'; end if;
  insert into public.lab_orders (lab_id, doctor_id, service, material, patient_code, due_days, phone, note)
  values (l.id, p_user, p_data->>'service', p_data->>'material', v_code, v_days, v_phone, nullif(left(btrim(coalesce(p_data->>'note', '')), 500), ''))
  returning * into o;
  perform private.notify(l.owner_id, 'lab_order_new', 'Yangi lab buyurtma', 'Bemor kodi ' || o.patient_code || ' · ' || o.service || ' · ' || o.due_days || ' kun', '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  perform private.notify(p_user, 'lab_order_sent', 'Buyurtma yuborildi', left(l.name, 80) || ' ga buyurtmangiz yuborildi. Lab qabul qilishini kuting.', '/laboratoriya/buyurtmalarim', null);
  return jsonb_build_object('id', o.id, 'status', o.status);
end $$;

create or replace function private.lab_order_json(o public.lab_orders, l public.labs, p_for_lab boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', o.id, 'labId', o.lab_id, 'labName', l.name, 'service', o.service, 'material', o.material, 'patientCode', o.patient_code,
    'dueDays', o.due_days, 'phone', private.phone_fmt(o.phone), 'note', o.note, 'status', o.status, 'createdAt', o.created_at, 'updatedAt', o.updated_at,
    'doctorName', case when p_for_lab then (select full_name from public.profiles where id = o.doctor_id) else null end)
  || case when not p_for_lab and o.status not in ('yangi', 'bekor') then jsonb_build_object('labPhone', private.phone_fmt(l.phone), 'labTelegram', l.telegram) else '{}'::jsonb end
$$;

create or replace function public.sh_lab_order_list(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'outgoing', coalesce((select jsonb_agg(private.lab_order_json(o, l, false) order by o.created_at desc)
      from public.lab_orders o join public.labs l on l.id = o.lab_id where o.doctor_id = p_user), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(private.lab_order_json(o, l, true) order by o.created_at desc)
      from public.lab_orders o join public.labs l on l.id = o.lab_id where l.owner_id = p_user), '[]'::jsonb));
end $$;

create or replace function public.sh_lab_order_set(p_secret text, p_user uuid, p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare o public.lab_orders; l public.labs; v_lab boolean;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into o from public.lab_orders where id = p_id for update;
  if o.id is null then raise exception 'req_notfound'; end if;
  select * into l from public.labs where id = o.lab_id;
  v_lab := l.owner_id = p_user;
  if not v_lab and o.doctor_id <> p_user then raise exception 'req_notfound'; end if;
  if v_lab then
    if not ((o.status = 'yangi' and p_status in ('qabul_qilindi', 'bekor')) or (o.status = 'qabul_qilindi' and p_status in ('ishlanmoqda', 'bekor'))
         or (o.status = 'ishlanmoqda' and p_status in ('tayyor', 'bekor')) or (o.status = 'tayyor' and p_status = 'yetkazildi')) then raise exception 'req_state'; end if;
  else
    if not (o.status in ('yangi', 'qabul_qilindi') and p_status = 'bekor') then raise exception 'req_state'; end if;
  end if;
  update public.lab_orders set status = p_status, updated_at = now() where id = o.id returning * into o;
  if v_lab then
    perform private.notify(o.doctor_id, 'lab_order_' || o.status,
      case o.status when 'qabul_qilindi' then 'Buyurtma qabul qilindi' when 'ishlanmoqda' then 'Buyurtma ishlanmoqda' when 'tayyor' then 'Buyurtma tayyor'
        when 'yetkazildi' then 'Buyurtma yetkazildi' else 'Buyurtma bekor qilindi' end,
      left(l.name, 80) || ' · bemor kodi ' || o.patient_code, '/laboratoriya/buyurtmalarim', null);
    perform private.notify(p_user, 'lab_order_updated', 'Buyurtma holati yangilandi', 'Bemor kodi ' || o.patient_code || ' · ' || o.status, '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  else
    perform private.notify(l.owner_id, 'lab_order_cancelled', 'Buyurtma bekor qilindi', 'Bemor kodi ' || o.patient_code, '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  end if;
  return private.lab_order_json(o, l, v_lab);
end $$;

-- ───────────── admin moderation (generic; extended in the next migration) ─────────────
create or replace function public.sh_mod_list(p_secret text, p_admin uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  return coalesce((
    select jsonb_agg(x order by (x->>'status' = 'pending') desc, x->>'createdAt' desc) from (
      select jsonb_build_object('kind', 'master', 'id', m.id, 'title', m.name, 'sub', m.title || ' · ' || m.city, 'city', m.city, 'status', m.status,
        'rejectReason', m.reject_reason, 'ownerName', (select full_name from public.profiles where id = m.owner_id), 'phone', private.phone_fmt(m.phone),
        'detail', coalesce(m.description, ''), 'createdAt', m.created_at) x from public.masters m
      union all
      select jsonb_build_object('kind', 'lab', 'id', l.id, 'title', l.name, 'sub', 'Laboratoriya · ' || l.city, 'city', l.city, 'status', l.status,
        'rejectReason', l.reject_reason, 'ownerName', (select full_name from public.profiles where id = l.owner_id), 'phone', private.phone_fmt(l.phone),
        'detail', coalesce(l.description, ''), 'createdAt', l.created_at) from public.labs l
    ) t), '[]'::jsonb);
end $$;

create or replace function public.sh_mod_review(p_secret text, p_admin uuid, p_kind text, p_id uuid, p_action text, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_name text; v_status text; v_link text; v_label text;
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  if p_action not in ('approve', 'reject', 'hide') then raise exception 'val_invalid'; end if;
  v_status := case p_action when 'approve' then 'published' when 'reject' then 'rejected' else 'hidden' end;
  if p_kind = 'master' then
    update public.masters set status = v_status, reject_reason = case when p_action = 'reject' then nullif(left(btrim(coalesce(p_reason, '')), 300), '') else null end, updated_at = now()
      where id = p_id returning owner_id, name into v_owner, v_name;
    v_link := '/ustalar/mening'; v_label := 'Usta profilingiz';
  elsif p_kind = 'lab' then
    update public.labs set status = v_status, reject_reason = case when p_action = 'reject' then nullif(left(btrim(coalesce(p_reason, '')), 300), '') else null end, updated_at = now()
      where id = p_id returning owner_id, name into v_owner, v_name;
    v_link := '/laboratoriya/buyurtmalarim?tab=kelgan'; v_label := 'Laboratoriya profilingiz';
  else
    raise exception 'val_invalid';
  end if;
  if v_owner is null then raise exception 'sem_notfound'; end if;
  perform private.notify(v_owner, 'moderation_' || v_status,
    v_label || case p_action when 'approve' then ' tasdiqlandi' when 'reject' then ' rad etildi' else ' yashirildi' end,
    left(v_name, 80) || case when p_action = 'approve' then ' · endi hamma ko‘radi.' else ' · ' || coalesce(nullif(btrim(p_reason), ''), 'sabab ko‘rsatilmagan') end, v_link, null);
end $$;

-- ───────────── grants ─────────────
revoke execute on function private.phone9, private.phone_fmt, private.master_json, private.lab_json, private.master_req_json, private.lab_order_json from public, anon, authenticated;
revoke execute on function public.sh_master_catalog, public.sh_master_mine, public.sh_master_save, public.sh_master_delete, public.sh_master_req_create, public.sh_master_req_list,
  public.sh_master_req_set, public.sh_lab_catalog, public.sh_lab_mine, public.sh_lab_save, public.sh_lab_delete, public.sh_lab_order_create, public.sh_lab_order_list,
  public.sh_lab_order_set, public.sh_mod_list, public.sh_mod_review from public;
grant execute on function public.sh_master_catalog, public.sh_master_mine, public.sh_master_save, public.sh_master_delete, public.sh_master_req_create, public.sh_master_req_list,
  public.sh_master_req_set, public.sh_lab_catalog, public.sh_lab_mine, public.sh_lab_save, public.sh_lab_delete, public.sh_lab_order_create, public.sh_lab_order_list,
  public.sh_lab_order_set, public.sh_mod_list, public.sh_mod_review to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20261004b_ishlar_ortiqcha_klinika.sql
-- ════════════════════════════════════════
-- 2-bosqich (B): Ishlar, Ortiqcha material, Mening klinikam real DB.
-- Public: only moderated (published) listings WITHOUT phone/telegram. Phones open only after contact is accepted.
-- Clinic data is private: owner-only RLS + access only via sh_clinic_* RPCs. All writes go through sh_* RPCs (p_secret).

-- ───────────── Ishlar ─────────────
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  clinic text not null check (char_length(clinic) between 2 and 100),
  city text not null check (char_length(city) between 2 and 60),
  salary_min bigint check (salary_min is null or salary_min between 0 and 1000000000),
  salary_max bigint check (salary_max is null or salary_max between 0 and 1000000000),
  job_type text not null default 'full' check (job_type in ('full', 'part', 'shift')),
  experience_years int not null default 0 check (experience_years between 0 and 40),
  remote boolean not null default false,
  description text not null check (char_length(description) between 20 and 2000),
  phone text not null check (char_length(phone) = 9),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden', 'closed')),
  approved_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_status_idx on public.jobs (status, created_at desc);
create index if not exists jobs_owner_idx on public.jobs (owner_id, created_at desc);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) = 9),
  telegram text check (telegram is null or char_length(telegram) <= 80),
  experience_years int not null default 0 check (experience_years between 0 and 60),
  note text check (note is null or char_length(note) <= 800),
  status text not null default 'yuborildi' check (status in ('yuborildi', 'korilmoqda', 'qabul', 'rad', 'bekor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_apps_job_idx on public.job_applications (job_id, created_at desc);
create index if not exists job_apps_applicant_idx on public.job_applications (applicant_id, created_at desc);
create unique index if not exists job_apps_active_uq on public.job_applications (job_id, applicant_id) where status in ('yuborildi', 'korilmoqda', 'qabul');

create table if not exists public.job_resumes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  role text not null check (char_length(role) between 2 and 80),
  city text not null check (char_length(city) between 2 and 60),
  experience_years int not null default 0 check (experience_years between 0 and 60),
  salary_from bigint check (salary_from is null or salary_from between 0 and 1000000000),
  about text check (about is null or char_length(about) <= 800),
  phone text not null check (char_length(phone) = 9),
  telegram text check (telegram is null or char_length(telegram) <= 80),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_resume_offers (
  id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.job_resumes(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) = 9),
  message text check (message is null or char_length(message) <= 500),
  created_at timestamptz not null default now(),
  unique (resume_id, from_user)
);

-- ───────────── Ortiqcha material ─────────────
create table if not exists public.surplus_listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  brand text not null check (char_length(brand) between 1 and 60),
  category text not null check (category in ('kompozit','bonding','sement','endodontiya','implantlar','anesteziya','borlar','instrument','ortodontiya')),
  price bigint not null check (price between 1 and 10000000000),
  new_price bigint check (new_price is null or new_price between 1 and 10000000000),
  pkg text not null check (pkg in ('yopiq', 'ochilgan')),
  expiry_months int not null check (expiry_months between 1 and 120),
  city text not null check (char_length(city) between 2 and 60),
  district text check (district is null or char_length(district) <= 60),
  phone text not null check (char_length(phone) = 9),
  telegram text check (telegram is null or char_length(telegram) <= 80),
  image text check (image is null or char_length(image) <= 400),
  note text not null check (char_length(note) between 12 and 600),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden', 'closed')),
  approved_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists surplus_status_idx on public.surplus_listings (status, created_at desc);
create index if not exists surplus_owner_idx on public.surplus_listings (owner_id, created_at desc);

create table if not exists public.surplus_interests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.surplus_listings(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) = 9),
  message text check (message is null or char_length(message) <= 500),
  status text not null default 'yuborildi' check (status in ('yuborildi', 'qabul', 'rad', 'bekor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists surplus_int_listing_idx on public.surplus_interests (listing_id, created_at desc);
create index if not exists surplus_int_req_idx on public.surplus_interests (requester_id, created_at desc);
create unique index if not exists surplus_int_active_uq on public.surplus_interests (listing_id, requester_id) where status in ('yuborildi', 'qabul');

-- ───────────── Mening klinikam (private) ─────────────
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  branch text check (branch is null or char_length(branch) <= 80),
  address text check (address is null or char_length(address) <= 200),
  open_time text not null default '09:00' check (open_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  close_time text not null default '18:00' check (close_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.clinic_patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  phone text check (phone is null or char_length(phone) = 9),
  status text not null default 'Faol' check (status in ('Faol', 'Noaktiv')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists clinic_patients_idx on public.clinic_patients (clinic_id, created_at desc);
create table if not exists public.clinic_visits (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid references public.clinic_patients(id) on delete set null,
  patient_name text not null check (char_length(patient_name) between 2 and 80),
  visit_date date not null,
  visit_time text not null check (visit_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  procedure text not null default 'Ko‘rik' check (char_length(procedure) between 2 and 80),
  status text not null default 'Kutilyapti' check (status in ('Keldi', 'Kutilyapti', 'Bekor')),
  created_at timestamptz not null default now()
);
create index if not exists clinic_visits_idx on public.clinic_visits (clinic_id, visit_date, visit_time);
create table if not exists public.clinic_staff (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  role text not null check (char_length(role) between 2 and 80),
  on_duty boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists clinic_staff_idx on public.clinic_staff (clinic_id, created_at);

-- ───────────── RLS (owner / party only; no anon) ─────────────
alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;
alter table public.job_resumes enable row level security;
alter table public.job_resume_offers enable row level security;
alter table public.surplus_listings enable row level security;
alter table public.surplus_interests enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_patients enable row level security;
alter table public.clinic_visits enable row level security;
alter table public.clinic_staff enable row level security;

drop policy if exists jobs_owner_select on public.jobs;
create policy jobs_owner_select on public.jobs for select to authenticated using (owner_id = auth.uid());
drop policy if exists job_apps_party_select on public.job_applications;
create policy job_apps_party_select on public.job_applications for select to authenticated
  using (applicant_id = auth.uid() or exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = auth.uid()));
drop policy if exists job_resumes_owner_select on public.job_resumes;
create policy job_resumes_owner_select on public.job_resumes for select to authenticated using (owner_id = auth.uid());
drop policy if exists job_offers_party_select on public.job_resume_offers;
create policy job_offers_party_select on public.job_resume_offers for select to authenticated
  using (from_user = auth.uid() or exists (select 1 from public.job_resumes r where r.id = resume_id and r.owner_id = auth.uid()));
drop policy if exists surplus_owner_select on public.surplus_listings;
create policy surplus_owner_select on public.surplus_listings for select to authenticated using (owner_id = auth.uid());
drop policy if exists surplus_int_party_select on public.surplus_interests;
create policy surplus_int_party_select on public.surplus_interests for select to authenticated
  using (requester_id = auth.uid() or exists (select 1 from public.surplus_listings l where l.id = listing_id and l.owner_id = auth.uid()));
drop policy if exists clinics_owner_select on public.clinics;
create policy clinics_owner_select on public.clinics for select to authenticated using (owner_id = auth.uid());
drop policy if exists clinic_patients_owner_select on public.clinic_patients;
create policy clinic_patients_owner_select on public.clinic_patients for select to authenticated
  using (exists (select 1 from public.clinics c where c.id = clinic_id and c.owner_id = auth.uid()));
drop policy if exists clinic_visits_owner_select on public.clinic_visits;
create policy clinic_visits_owner_select on public.clinic_visits for select to authenticated
  using (exists (select 1 from public.clinics c where c.id = clinic_id and c.owner_id = auth.uid()));
drop policy if exists clinic_staff_owner_select on public.clinic_staff;
create policy clinic_staff_owner_select on public.clinic_staff for select to authenticated
  using (exists (select 1 from public.clinics c where c.id = clinic_id and c.owner_id = auth.uid()));
revoke all on public.jobs, public.job_applications, public.job_resumes, public.job_resume_offers, public.surplus_listings, public.surplus_interests,
  public.clinics, public.clinic_patients, public.clinic_visits, public.clinic_staff from anon, authenticated;
grant select on public.jobs, public.job_applications, public.job_resumes, public.job_resume_offers, public.surplus_listings, public.surplus_interests,
  public.clinics, public.clinic_patients, public.clinic_visits, public.clinic_staff to authenticated;

-- ───────────── Ishlar: JSON builders ─────────────
create or replace function private.job_json(j public.jobs, p_viewer uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', j.id, 'title', j.title, 'clinic', j.clinic, 'city', j.city, 'salaryMin', j.salary_min, 'salaryMax', j.salary_max,
    'type', j.job_type, 'experienceYears', j.experience_years, 'remote', j.remote, 'description', j.description, 'status', j.status,
    'rejectReason', j.reject_reason, 'createdAt', j.created_at, 'mine', j.owner_id = p_viewer)
  || case when j.owner_id = p_viewer then jsonb_build_object('appCount', (select count(*) from public.job_applications a where a.job_id = j.id and a.status <> 'bekor'),
      'newCount', (select count(*) from public.job_applications a where a.job_id = j.id and a.status = 'yuborildi'), 'phone', private.phone_fmt(j.phone)) else '{}'::jsonb end
$$;

create or replace function public.sh_job_catalog(p_secret text, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.job_json(j, p_viewer) order by j.created_at desc) from public.jobs j where j.status = 'published'), '[]'::jsonb);
end $$;

create or replace function public.sh_job_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.job_json(j, p_user) order by j.created_at desc) from public.jobs j where j.owner_id = p_user), '[]'::jsonb);
end $$;

create or replace function public.sh_job_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare j public.jobs; v_phone text := private.phone9(p_data->>'phone'); v_min bigint := nullif(p_data->>'salaryMin', '')::bigint; v_max bigint := nullif(p_data->>'salaryMax', '')::bigint;
  v_type text := coalesce(p_data->>'type', 'full');
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if char_length(btrim(coalesce(p_data->>'title', ''))) < 3 or char_length(btrim(coalesce(p_data->>'clinic', ''))) < 2 or char_length(btrim(coalesce(p_data->>'city', ''))) < 2
     or char_length(btrim(coalesce(p_data->>'description', ''))) < 20 or char_length(v_phone) <> 9 or v_type not in ('full', 'part', 'shift')
     or (v_min is not null and v_max is not null and v_max < v_min) then
    raise exception 'val_invalid';
  end if;
  if p_id is null then
    if (select count(*) from public.jobs where owner_id = p_user and created_at > now() - interval '1 day') >= 5
       or (select count(*) from public.jobs where owner_id = p_user and status in ('pending', 'published')) >= 15 then raise exception 'lim_reached'; end if;
    insert into public.jobs (owner_id, title, clinic, city, salary_min, salary_max, job_type, experience_years, remote, description, phone, status)
    values (p_user, left(btrim(p_data->>'title'), 100), left(btrim(p_data->>'clinic'), 100), left(btrim(p_data->>'city'), 60), v_min, v_max, v_type,
      coalesce(nullif(p_data->>'experienceYears', '')::int, 0), coalesce((p_data->>'remote')::boolean, false), left(btrim(p_data->>'description'), 2000), v_phone, 'pending')
    returning * into j;
    perform private.sem_notify_admins('moderation_new', 'Yangi vakansiya', left(j.title, 60) || ' · ' || left(j.clinic, 40) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'job_pending', 'Vakansiyangiz moderatsiyada', 'Admin tasdiqlagach hamma ko‘radi.', '/ishlar/vakansiyalarim', null);
  else
    select * into j from public.jobs where id = p_id and owner_id = p_user for update;
    if j.id is null then raise exception 'req_notfound'; end if;
    update public.jobs set title = left(btrim(p_data->>'title'), 100), clinic = left(btrim(p_data->>'clinic'), 100), city = left(btrim(p_data->>'city'), 60),
      salary_min = v_min, salary_max = v_max, job_type = v_type, experience_years = coalesce(nullif(p_data->>'experienceYears', '')::int, 0),
      remote = coalesce((p_data->>'remote')::boolean, false), description = left(btrim(p_data->>'description'), 2000), phone = v_phone,
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end, updated_at = now()
      where id = j.id returning * into j;
    if j.status = 'pending' then perform private.sem_notify_admins('moderation_new', 'Vakansiya yangilandi', left(j.title, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya'); end if;
  end if;
  return private.job_json(j, p_user);
end $$;

create or replace function public.sh_job_set(p_secret text, p_user uuid, p_id uuid, p_action text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare j public.jobs;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into j from public.jobs where id = p_id and owner_id = p_user for update;
  if j.id is null then raise exception 'req_notfound'; end if;
  if p_action = 'delete' then
    delete from public.jobs where id = j.id; return jsonb_build_object('deleted', true);
  elsif p_action = 'close' then
    if j.status not in ('published', 'pending') then raise exception 'req_state'; end if;
    update public.jobs set status = 'closed', updated_at = now() where id = j.id returning * into j;
    update public.job_applications set status = 'rad', updated_at = now() where job_id = j.id and status = 'yuborildi';
  elsif p_action = 'open' then
    if j.status <> 'closed' then raise exception 'req_state'; end if;
    update public.jobs set status = case when approved_at is not null then 'published' else 'pending' end, updated_at = now() where id = j.id returning * into j;
    if j.status = 'pending' then perform private.sem_notify_admins('moderation_new', 'Vakansiya qayta ochildi', left(j.title, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya'); end if;
  else raise exception 'val_invalid'; end if;
  return private.job_json(j, p_user);
end $$;

create or replace function private.job_app_json(a public.job_applications, j public.jobs, p_for_owner boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', a.id, 'jobId', a.job_id, 'jobTitle', j.title, 'clinic', j.clinic, 'city', j.city, 'jobStatus', j.status, 'name', a.name,
    'telegram', a.telegram, 'experienceYears', a.experience_years, 'note', a.note, 'status', a.status, 'createdAt', a.created_at, 'updatedAt', a.updated_at)
  || case when p_for_owner then jsonb_build_object('phone', private.phone_fmt(a.phone))
      when a.status = 'qabul' then jsonb_build_object('employerPhone', private.phone_fmt(j.phone)) else '{}'::jsonb end
$$;

create or replace function public.sh_job_app_create(p_secret text, p_user uuid, p_job uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare j public.jobs; a public.job_applications; v_phone text := private.phone9(p_data->>'phone');
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into j from public.jobs where id = p_job and status = 'published';
  if j.id is null then raise exception 'req_notfound'; end if;
  if j.owner_id = p_user then raise exception 'req_self'; end if;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(v_phone) <> 9 then raise exception 'val_invalid'; end if;
  if (select count(*) from public.job_applications where applicant_id = p_user and created_at > now() - interval '1 hour') >= 15 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.job_applications where job_id = j.id and applicant_id = p_user and status in ('yuborildi', 'korilmoqda', 'qabul')) then raise exception 'req_duplicate'; end if;
  insert into public.job_applications (job_id, applicant_id, name, phone, telegram, experience_years, note)
  values (j.id, p_user, left(btrim(p_data->>'name'), 80), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
    coalesce(nullif(p_data->>'experienceYears', '')::int, 0), nullif(left(btrim(coalesce(p_data->>'note', '')), 800), '')) returning * into a;
  perform private.notify(j.owner_id, 'job_application', 'Yangi ariza', left(a.name, 60) || ' · ' || left(j.title, 60), '/ishlar/vakansiyalarim?tab=arizalar', null);
  perform private.notify(p_user, 'job_application_sent', 'Ariza yuborildi', left(j.title, 60) || ' · ' || left(j.clinic, 40) || ' ga arizangiz yuborildi.', '/ishlar/arizalarim', null);
  return jsonb_build_object('id', a.id, 'status', a.status);
end $$;

create or replace function public.sh_job_app_list(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'outgoing', coalesce((select jsonb_agg(private.job_app_json(a, j, false) order by a.created_at desc)
      from public.job_applications a join public.jobs j on j.id = a.job_id where a.applicant_id = p_user), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(private.job_app_json(a, j, true) order by a.created_at desc)
      from public.job_applications a join public.jobs j on j.id = a.job_id where j.owner_id = p_user), '[]'::jsonb));
end $$;

create or replace function public.sh_job_app_set(p_secret text, p_user uuid, p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a public.job_applications; j public.jobs; v_owner boolean;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into a from public.job_applications where id = p_id for update;
  if a.id is null then raise exception 'req_notfound'; end if;
  select * into j from public.jobs where id = a.job_id;
  v_owner := j.owner_id = p_user;
  if not v_owner and a.applicant_id <> p_user then raise exception 'req_notfound'; end if;
  if v_owner then
    if p_status not in ('korilmoqda', 'qabul', 'rad') or a.status in ('rad', 'bekor') or a.status = p_status
       or (a.status = 'qabul' and p_status <> 'rad') then raise exception 'req_state'; end if;
  else
    if p_status <> 'bekor' or a.status not in ('yuborildi', 'korilmoqda') then raise exception 'req_state'; end if;
  end if;
  update public.job_applications set status = p_status, updated_at = now() where id = a.id returning * into a;
  if v_owner then
    perform private.notify(a.applicant_id, 'job_application_' || p_status,
      case p_status when 'korilmoqda' then 'Arizangiz ko‘rilmoqda' when 'qabul' then 'Arizangiz qabul qilindi' else 'Arizangiz rad etildi' end,
      left(j.title, 60) || ' · ' || left(j.clinic, 40) || case when p_status = 'qabul' then ' · telefon raqami ochildi.' else '' end, '/ishlar/arizalarim', null);
  else
    perform private.notify(j.owner_id, 'job_application_bekor', 'Ariza qaytarib olindi', left(a.name, 60) || ' · ' || left(j.title, 60), '/ishlar/vakansiyalarim?tab=arizalar', null);
  end if;
  return private.job_app_json(a, j, v_owner);
end $$;

-- resumes
create or replace function private.resume_json(r public.job_resumes, p_viewer uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'name', r.name, 'role', r.role, 'city', r.city, 'experienceYears', r.experience_years, 'salaryFrom', r.salary_from,
    'about', r.about, 'published', r.published, 'updatedAt', r.updated_at, 'mine', r.owner_id = p_viewer)
  || case when r.owner_id = p_viewer then jsonb_build_object('phone', private.phone_fmt(r.phone), 'telegram', r.telegram) else '{}'::jsonb end
$$;

create or replace function public.sh_resume_catalog(p_secret text, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.resume_json(r, p_viewer) order by r.updated_at desc) from public.job_resumes r where r.published), '[]'::jsonb);
end $$;

create or replace function public.sh_resume_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.job_resumes;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.job_resumes where owner_id = p_user;
  return jsonb_build_object('resume', case when r.id is null then null else private.resume_json(r, p_user) end,
    'offers', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'phone', private.phone_fmt(o.phone), 'message', o.message, 'createdAt', o.created_at) order by o.created_at desc)
      from public.job_resume_offers o where o.resume_id = r.id), '[]'::jsonb));
end $$;

create or replace function public.sh_resume_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.job_resumes; v_phone text := private.phone9(p_data->>'phone');
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(btrim(coalesce(p_data->>'role', ''))) < 2 or char_length(btrim(coalesce(p_data->>'city', ''))) < 2
     or char_length(v_phone) <> 9 then raise exception 'val_invalid'; end if;
  insert into public.job_resumes (owner_id, name, role, city, experience_years, salary_from, about, phone, telegram, published)
  values (p_user, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'role'), 80), left(btrim(p_data->>'city'), 60), coalesce(nullif(p_data->>'experienceYears', '')::int, 0),
    nullif(p_data->>'salaryFrom', '')::bigint, nullif(left(btrim(coalesce(p_data->>'about', '')), 800), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
    coalesce((p_data->>'published')::boolean, true))
  on conflict (owner_id) do update set name = excluded.name, role = excluded.role, city = excluded.city, experience_years = excluded.experience_years,
    salary_from = excluded.salary_from, about = excluded.about, phone = excluded.phone, telegram = excluded.telegram, published = excluded.published, updated_at = now()
  returning * into r;
  return private.resume_json(r, p_user);
end $$;

create or replace function public.sh_resume_delete(p_secret text, p_user uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  delete from public.job_resumes where owner_id = p_user;
end $$;

create or replace function public.sh_resume_offer(p_secret text, p_user uuid, p_resume uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.job_resumes; v_phone text := private.phone9(p_data->>'phone'); v_name text := left(btrim(coalesce(p_data->>'name', '')), 80);
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into r from public.job_resumes where id = p_resume and published;
  if r.id is null then raise exception 'req_notfound'; end if;
  if r.owner_id = p_user then raise exception 'req_self'; end if;
  if char_length(v_name) < 2 or char_length(v_phone) <> 9 then raise exception 'val_invalid'; end if;
  if (select count(*) from public.job_resume_offers where from_user = p_user and created_at > now() - interval '1 hour') >= 10 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.job_resume_offers where resume_id = r.id and from_user = p_user) then raise exception 'req_duplicate'; end if;
  insert into public.job_resume_offers (resume_id, from_user, name, phone, message)
  values (r.id, p_user, v_name, v_phone, nullif(left(btrim(coalesce(p_data->>'message', '')), 500), ''));
  perform private.notify(r.owner_id, 'resume_offer', 'Ish taklifi', v_name || ' sizning rezyumengizga qiziqdi.', '/ishlar/arizalarim?tab=takliflar', null);
  perform private.notify(p_user, 'resume_offer_sent', 'Taklif yuborildi', left(r.name, 60) || ' ga taklifingiz yuborildi.', '/ishlar', null);
  return jsonb_build_object('ok', true);
end $$;

-- ───────────── Ortiqcha material ─────────────
create or replace function private.surplus_json(l public.surplus_listings, p_viewer uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'name', l.name, 'brand', l.brand, 'category', l.category, 'price', l.price, 'newPrice', l.new_price, 'pkg', l.pkg,
    'expiryMonths', l.expiry_months, 'city', l.city, 'district', l.district, 'image', l.image, 'note', l.note, 'status', l.status, 'rejectReason', l.reject_reason,
    'seller', coalesce((select full_name from public.profiles where id = l.owner_id), 'Doktor'), 'createdAt', l.created_at, 'updatedAt', l.updated_at, 'mine', l.owner_id = p_viewer)
  || case when l.owner_id = p_viewer then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram,
      'interestCount', (select count(*) from public.surplus_interests i where i.listing_id = l.id and i.status <> 'bekor')) else '{}'::jsonb end
$$;

create or replace function public.sh_surplus_catalog(p_secret text, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.surplus_json(l, p_viewer) order by l.created_at desc) from public.surplus_listings l where l.status = 'published'), '[]'::jsonb);
end $$;

create or replace function public.sh_surplus_mine(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.surplus_json(l, p_user) order by l.created_at desc) from public.surplus_listings l where l.owner_id = p_user), '[]'::jsonb);
end $$;

create or replace function public.sh_surplus_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.surplus_listings; v_phone text := private.phone9(p_data->>'phone'); v_price bigint := nullif(p_data->>'price', '')::bigint; v_new bigint := nullif(p_data->>'newPrice', '')::bigint;
  v_exp int := nullif(p_data->>'expiryMonths', '')::int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(btrim(coalesce(p_data->>'brand', ''))) < 1 or v_price is null or v_price < 1
     or v_exp is null or v_exp < 1 or v_exp > 120 or coalesce(p_data->>'pkg', '') not in ('yopiq', 'ochilgan') or char_length(btrim(coalesce(p_data->>'city', ''))) < 2
     or char_length(v_phone) <> 9 or char_length(btrim(coalesce(p_data->>'note', ''))) < 12
     or coalesce(p_data->>'category', '') not in ('kompozit','bonding','sement','endodontiya','implantlar','anesteziya','borlar','instrument','ortodontiya') then
    raise exception 'val_invalid';
  end if;
  if p_id is null then
    if (select count(*) from public.surplus_listings where owner_id = p_user and created_at > now() - interval '1 day') >= 10
       or (select count(*) from public.surplus_listings where owner_id = p_user and status in ('pending', 'published')) >= 30 then raise exception 'lim_reached'; end if;
    insert into public.surplus_listings (owner_id, name, brand, category, price, new_price, pkg, expiry_months, city, district, phone, telegram, image, note, status)
    values (p_user, left(btrim(p_data->>'name'), 100), left(btrim(p_data->>'brand'), 60), p_data->>'category', v_price, v_new, p_data->>'pkg', v_exp, left(btrim(p_data->>'city'), 60),
      nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      nullif(btrim(coalesce(p_data->>'image', '')), ''), left(btrim(p_data->>'note'), 600), 'pending') returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Yangi ortiqcha material e’loni', left(l.name, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'surplus_pending', 'E’loningiz moderatsiyada', left(l.name, 60) || ' · admin tasdiqlagach hamma ko‘radi.', '/ortiqcha-material/elonlarim', null);
  else
    select * into l from public.surplus_listings where id = p_id and owner_id = p_user for update;
    if l.id is null then raise exception 'req_notfound'; end if;
    update public.surplus_listings set name = left(btrim(p_data->>'name'), 100), brand = left(btrim(p_data->>'brand'), 60), category = p_data->>'category', price = v_price, new_price = v_new,
      pkg = p_data->>'pkg', expiry_months = v_exp, city = left(btrim(p_data->>'city'), 60), district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), phone = v_phone,
      telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), image = nullif(btrim(coalesce(p_data->>'image', '')), ''), note = left(btrim(p_data->>'note'), 600),
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end, updated_at = now()
      where id = l.id returning * into l;
    if l.status = 'pending' then perform private.sem_notify_admins('moderation_new', 'E’lon yangilandi', left(l.name, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya'); end if;
  end if;
  return private.surplus_json(l, p_user);
end $$;

create or replace function public.sh_surplus_set(p_secret text, p_user uuid, p_id uuid, p_action text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.surplus_listings;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into l from public.surplus_listings where id = p_id and owner_id = p_user for update;
  if l.id is null then raise exception 'req_notfound'; end if;
  if p_action = 'delete' then
    delete from public.surplus_listings where id = l.id; return jsonb_build_object('deleted', true);
  elsif p_action = 'close' then
    if l.status not in ('published', 'pending') then raise exception 'req_state'; end if;
    update public.surplus_listings set status = 'closed', updated_at = now() where id = l.id returning * into l;
  elsif p_action = 'open' then
    if l.status <> 'closed' then raise exception 'req_state'; end if;
    update public.surplus_listings set status = case when approved_at is not null then 'published' else 'pending' end, updated_at = now() where id = l.id returning * into l;
    if l.status = 'pending' then perform private.sem_notify_admins('moderation_new', 'E’lon qayta ochildi', left(l.name, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya'); end if;
  else raise exception 'val_invalid'; end if;
  return private.surplus_json(l, p_user);
end $$;

create or replace function private.surplus_int_json(i public.surplus_interests, l public.surplus_listings, p_for_owner boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', i.id, 'listingId', i.listing_id, 'listingName', l.name, 'listingStatus', l.status, 'name', i.name, 'message', i.message, 'status', i.status,
    'createdAt', i.created_at, 'updatedAt', i.updated_at)
  || case when p_for_owner then jsonb_build_object('phone', private.phone_fmt(i.phone))
      when i.status = 'qabul' then jsonb_build_object('sellerPhone', private.phone_fmt(l.phone), 'sellerTelegram', l.telegram) else '{}'::jsonb end
$$;

create or replace function public.sh_surplus_int_create(p_secret text, p_user uuid, p_listing uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.surplus_listings; i public.surplus_interests; v_phone text := private.phone9(p_data->>'phone'); v_name text := left(btrim(coalesce(p_data->>'name', '')), 80);
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into l from public.surplus_listings where id = p_listing and status = 'published';
  if l.id is null then raise exception 'req_notfound'; end if;
  if l.owner_id = p_user then raise exception 'req_self'; end if;
  if char_length(v_name) < 2 or char_length(v_phone) <> 9 then raise exception 'val_invalid'; end if;
  if (select count(*) from public.surplus_interests where requester_id = p_user and created_at > now() - interval '1 hour') >= 10 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.surplus_interests where listing_id = l.id and requester_id = p_user and status in ('yuborildi', 'qabul')) then raise exception 'req_duplicate'; end if;
  insert into public.surplus_interests (listing_id, requester_id, name, phone, message)
  values (l.id, p_user, v_name, v_phone, nullif(left(btrim(coalesce(p_data->>'message', '')), 500), '')) returning * into i;
  perform private.notify(l.owner_id, 'surplus_interest', 'Bog‘lanish so‘rovi', v_name || ' · ' || left(l.name, 60), '/ortiqcha-material/elonlarim?tab=kelgan', null);
  perform private.notify(p_user, 'surplus_interest_sent', 'So‘rov yuborildi', left(l.name, 60) || ' egasiga so‘rovingiz yuborildi.', '/ortiqcha-material/elonlarim?tab=yuborgan', null);
  return jsonb_build_object('id', i.id, 'status', i.status);
end $$;

create or replace function public.sh_surplus_int_list(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'outgoing', coalesce((select jsonb_agg(private.surplus_int_json(i, l, false) order by i.created_at desc)
      from public.surplus_interests i join public.surplus_listings l on l.id = i.listing_id where i.requester_id = p_user), '[]'::jsonb),
    'incoming', coalesce((select jsonb_agg(private.surplus_int_json(i, l, true) order by i.created_at desc)
      from public.surplus_interests i join public.surplus_listings l on l.id = i.listing_id where l.owner_id = p_user), '[]'::jsonb));
end $$;

create or replace function public.sh_surplus_int_set(p_secret text, p_user uuid, p_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare i public.surplus_interests; l public.surplus_listings; v_owner boolean;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into i from public.surplus_interests where id = p_id for update;
  if i.id is null then raise exception 'req_notfound'; end if;
  select * into l from public.surplus_listings where id = i.listing_id;
  v_owner := l.owner_id = p_user;
  if not v_owner and i.requester_id <> p_user then raise exception 'req_notfound'; end if;
  if v_owner then
    if p_status not in ('qabul', 'rad') or i.status <> 'yuborildi' then raise exception 'req_state'; end if;
  else
    if p_status <> 'bekor' or i.status not in ('yuborildi', 'qabul') then raise exception 'req_state'; end if;
  end if;
  update public.surplus_interests set status = p_status, updated_at = now() where id = i.id returning * into i;
  if v_owner then
    perform private.notify(i.requester_id, 'surplus_interest_' || p_status, case p_status when 'qabul' then 'So‘rovingiz qabul qilindi' else 'So‘rovingiz rad etildi' end,
      left(l.name, 60) || case when p_status = 'qabul' then ' · egasining telefon raqami ochildi.' else '' end, '/ortiqcha-material/elonlarim?tab=yuborgan', null);
  else
    perform private.notify(l.owner_id, 'surplus_interest_bekor', 'So‘rov qaytarib olindi', i.name || ' · ' || left(l.name, 60), '/ortiqcha-material/elonlarim?tab=kelgan', null);
  end if;
  return private.surplus_int_json(i, l, v_owner);
end $$;

-- ───────────── Mening klinikam (owner-only) ─────────────
create or replace function private.clinic_state(p_user uuid) returns jsonb language plpgsql stable set search_path = '' as $$
declare c public.clinics; v_today date := (now() at time zone 'Asia/Tashkent')::date;
begin
  select * into c from public.clinics where owner_id = p_user;
  if c.id is null then return jsonb_build_object('clinic', null, 'patients', '[]'::jsonb, 'visits', '[]'::jsonb, 'staff', '[]'::jsonb, 'today', v_today); end if;
  return jsonb_build_object('today', v_today,
    'clinic', jsonb_build_object('id', c.id, 'name', c.name, 'branch', c.branch, 'address', c.address, 'openTime', c.open_time, 'closeTime', c.close_time),
    'patients', coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'phone', private.phone_fmt(p.phone), 'status', p.status, 'note', p.note, 'createdAt', p.created_at,
        'lastVisit', (select max(v.visit_date) from public.clinic_visits v where v.patient_id = p.id and v.status = 'Keldi' and v.visit_date <= v_today),
        'nextVisit', (select min(v.visit_date) from public.clinic_visits v where v.patient_id = p.id and v.status = 'Kutilyapti' and v.visit_date >= v_today)) order by p.created_at desc)
      from public.clinic_patients p where p.clinic_id = c.id), '[]'::jsonb),
    'visits', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'patientId', v.patient_id, 'name', v.patient_name, 'date', v.visit_date, 'time', v.visit_time,
        'procedure', v.procedure, 'status', v.status) order by v.visit_date, v.visit_time)
      from public.clinic_visits v where v.clinic_id = c.id and v.visit_date >= v_today - 7 and v.visit_date <= v_today + 60), '[]'::jsonb),
    'staff', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'role', s.role, 'onDuty', s.on_duty) order by s.created_at) from public.clinic_staff s where s.clinic_id = c.id), '[]'::jsonb));
end $$;

create or replace function public.sh_clinic_get(p_secret text, p_user uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return private.clinic_state(p_user);
end $$;

create or replace function public.sh_clinic_op(p_secret text, p_user uuid, p_op text, p_id uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.clinics; v_name text := left(btrim(coalesce(p_data->>'name', '')), 80); v_phone text := private.phone9(p_data->>'phone'); v_date date; v_time text := coalesce(p_data->>'time', '');
  v_pat public.clinic_patients; n int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if p_op = 'clinic_save' then
    if char_length(v_name) < 2 or coalesce(p_data->>'openTime', '09:00') !~ '^[0-2][0-9]:[0-5][0-9]$' or coalesce(p_data->>'closeTime', '18:00') !~ '^[0-2][0-9]:[0-5][0-9]$' then raise exception 'val_invalid'; end if;
    insert into public.clinics (owner_id, name, branch, address, open_time, close_time)
    values (p_user, v_name, nullif(left(btrim(coalesce(p_data->>'branch', '')), 80), ''), nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''),
      coalesce(p_data->>'openTime', '09:00'), coalesce(p_data->>'closeTime', '18:00'))
    on conflict (owner_id) do update set name = excluded.name, branch = excluded.branch, address = excluded.address, open_time = excluded.open_time, close_time = excluded.close_time, updated_at = now();
    return private.clinic_state(p_user);
  end if;
  select * into c from public.clinics where owner_id = p_user;
  if c.id is null then raise exception 'clinic_none'; end if;
  if p_op = 'patient_save' then
    if char_length(v_name) < 2 or (p_data->>'phone' is not null and btrim(p_data->>'phone') <> '' and char_length(v_phone) <> 9) then raise exception 'val_invalid'; end if;
    if p_id is null then
      select count(*) into n from public.clinic_patients where clinic_id = c.id;
      if n >= 5000 then raise exception 'lim_reached'; end if;
      insert into public.clinic_patients (clinic_id, name, phone, status, note) values (c.id, v_name, nullif(v_phone, ''), case when p_data->>'status' = 'Noaktiv' then 'Noaktiv' else 'Faol' end,
        nullif(left(btrim(coalesce(p_data->>'note', '')), 500), ''));
    else
      update public.clinic_patients set name = v_name, phone = nullif(v_phone, ''), status = case when p_data->>'status' = 'Noaktiv' then 'Noaktiv' else 'Faol' end,
        note = nullif(left(btrim(coalesce(p_data->>'note', '')), 500), '') where id = p_id and clinic_id = c.id;
      if not found then raise exception 'req_notfound'; end if;
    end if;
  elsif p_op = 'patient_delete' then
    delete from public.clinic_patients where id = p_id and clinic_id = c.id;
    if not found then raise exception 'req_notfound'; end if;
  elsif p_op = 'visit_save' then
    begin v_date := (p_data->>'date')::date; exception when others then raise exception 'val_invalid'; end;
    if v_date is null or v_time !~ '^[0-2][0-9]:[0-5][0-9]$' or char_length(left(btrim(coalesce(p_data->>'procedure', 'Ko‘rik')), 80)) < 2 then raise exception 'val_invalid'; end if;
    if nullif(p_data->>'patientId', '') is not null then
      select * into v_pat from public.clinic_patients where id = (p_data->>'patientId')::uuid and clinic_id = c.id;
      if v_pat.id is null then raise exception 'req_notfound'; end if;
      v_name := v_pat.name;
    end if;
    if char_length(v_name) < 2 then raise exception 'val_invalid'; end if;
    select count(*) into n from public.clinic_visits where clinic_id = c.id and visit_date >= current_date - 1;
    if n >= 2000 then raise exception 'lim_reached'; end if;
    if exists (select 1 from public.clinic_visits where clinic_id = c.id and visit_date = v_date and visit_time = v_time and patient_name = v_name and status <> 'Bekor') then raise exception 'req_duplicate'; end if;
    insert into public.clinic_visits (clinic_id, patient_id, patient_name, visit_date, visit_time, procedure) values (c.id, v_pat.id, v_name, v_date, v_time, left(btrim(coalesce(nullif(p_data->>'procedure', ''), 'Ko‘rik')), 80));
  elsif p_op = 'visit_status' then
    if coalesce(p_data->>'status', '') not in ('Keldi', 'Kutilyapti', 'Bekor') then raise exception 'val_invalid'; end if;
    update public.clinic_visits set status = p_data->>'status' where id = p_id and clinic_id = c.id;
    if not found then raise exception 'req_notfound'; end if;
  elsif p_op = 'visit_delete' then
    delete from public.clinic_visits where id = p_id and clinic_id = c.id;
    if not found then raise exception 'req_notfound'; end if;
  elsif p_op = 'staff_save' then
    if char_length(v_name) < 2 or char_length(left(btrim(coalesce(p_data->>'role', '')), 80)) < 2 then raise exception 'val_invalid'; end if;
    if p_id is null then
      select count(*) into n from public.clinic_staff where clinic_id = c.id;
      if n >= 200 then raise exception 'lim_reached'; end if;
      insert into public.clinic_staff (clinic_id, name, role, on_duty) values (c.id, v_name, left(btrim(p_data->>'role'), 80), coalesce((p_data->>'onDuty')::boolean, true));
    else
      update public.clinic_staff set name = v_name, role = left(btrim(p_data->>'role'), 80), on_duty = coalesce((p_data->>'onDuty')::boolean, on_duty) where id = p_id and clinic_id = c.id;
      if not found then raise exception 'req_notfound'; end if;
    end if;
  elsif p_op = 'staff_delete' then
    delete from public.clinic_staff where id = p_id and clinic_id = c.id;
    if not found then raise exception 'req_notfound'; end if;
  else raise exception 'val_invalid'; end if;
  return private.clinic_state(p_user);
end $$;

-- ───────────── admin moderation: add job + surplus kinds ─────────────
create or replace function public.sh_mod_list(p_secret text, p_admin uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  return coalesce((
    select jsonb_agg(x order by (x->>'status' = 'pending') desc, x->>'createdAt' desc) from (
      select jsonb_build_object('kind', 'master', 'id', m.id, 'title', m.name, 'sub', m.title || ' · ' || m.city, 'city', m.city, 'status', m.status,
        'rejectReason', m.reject_reason, 'ownerName', (select full_name from public.profiles where id = m.owner_id), 'phone', private.phone_fmt(m.phone),
        'detail', coalesce(m.description, ''), 'createdAt', m.created_at) x from public.masters m
      union all
      select jsonb_build_object('kind', 'lab', 'id', l.id, 'title', l.name, 'sub', 'Laboratoriya · ' || l.city, 'city', l.city, 'status', l.status,
        'rejectReason', l.reject_reason, 'ownerName', (select full_name from public.profiles where id = l.owner_id), 'phone', private.phone_fmt(l.phone),
        'detail', coalesce(l.description, ''), 'createdAt', l.created_at) from public.labs l
      union all
      select jsonb_build_object('kind', 'job', 'id', j.id, 'title', j.title, 'sub', j.clinic || ' · ' || j.city, 'city', j.city, 'status', j.status,
        'rejectReason', j.reject_reason, 'ownerName', (select full_name from public.profiles where id = j.owner_id), 'phone', private.phone_fmt(j.phone),
        'detail', j.description, 'createdAt', j.created_at) from public.jobs j where j.status <> 'closed'
      union all
      select jsonb_build_object('kind', 'surplus', 'id', s.id, 'title', s.name, 'sub', s.brand || ' · ' || s.city || ' · ' || s.price || ' so‘m', 'city', s.city, 'status', s.status,
        'rejectReason', s.reject_reason, 'ownerName', (select full_name from public.profiles where id = s.owner_id), 'phone', private.phone_fmt(s.phone),
        'detail', s.note, 'createdAt', s.created_at) from public.surplus_listings s where s.status <> 'closed'
    ) t), '[]'::jsonb);
end $$;

create or replace function public.sh_mod_review(p_secret text, p_admin uuid, p_kind text, p_id uuid, p_action text, p_reason text default '') returns void
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_name text; v_status text; v_link text; v_label text; v_reason text;
begin
  perform private.assert_secret(p_secret);
  if not private.sem_is_admin(p_admin) then raise exception 'sem_notfound'; end if;
  if p_action not in ('approve', 'reject', 'hide') then raise exception 'val_invalid'; end if;
  v_status := case p_action when 'approve' then 'published' when 'reject' then 'rejected' else 'hidden' end;
  v_reason := case when p_action = 'reject' then nullif(left(btrim(coalesce(p_reason, '')), 300), '') else null end;
  if p_kind = 'master' then
    update public.masters set status = v_status, reject_reason = v_reason, updated_at = now() where id = p_id returning owner_id, name into v_owner, v_name;
    v_link := '/ustalar/mening'; v_label := 'Usta profilingiz';
  elsif p_kind = 'lab' then
    update public.labs set status = v_status, reject_reason = v_reason, updated_at = now() where id = p_id returning owner_id, name into v_owner, v_name;
    v_link := '/laboratoriya/buyurtmalarim?tab=kelgan'; v_label := 'Laboratoriya profilingiz';
  elsif p_kind = 'job' then
    update public.jobs set status = v_status, reject_reason = v_reason, approved_at = case when p_action = 'approve' then coalesce(approved_at, now()) else approved_at end, updated_at = now()
      where id = p_id and status <> 'closed' returning owner_id, title into v_owner, v_name;
    v_link := '/ishlar/vakansiyalarim'; v_label := 'Vakansiyangiz';
  elsif p_kind = 'surplus' then
    update public.surplus_listings set status = v_status, reject_reason = v_reason, approved_at = case when p_action = 'approve' then coalesce(approved_at, now()) else approved_at end, updated_at = now()
      where id = p_id and status <> 'closed' returning owner_id, name into v_owner, v_name;
    v_link := '/ortiqcha-material/elonlarim'; v_label := 'E’loningiz';
  else
    raise exception 'val_invalid';
  end if;
  if v_owner is null then raise exception 'sem_notfound'; end if;
  perform private.notify(v_owner, 'moderation_' || v_status,
    v_label || case p_action when 'approve' then ' tasdiqlandi' when 'reject' then ' rad etildi' else ' yashirildi' end,
    left(v_name, 80) || case when p_action = 'approve' then ' · endi hamma ko‘radi.' else ' · ' || coalesce(nullif(btrim(p_reason), ''), 'sabab ko‘rsatilmagan') end, v_link, null);
end $$;

-- ───────────── grants ─────────────
revoke execute on function private.job_json, private.job_app_json, private.resume_json, private.surplus_json, private.surplus_int_json, private.clinic_state from public, anon, authenticated;
revoke execute on function public.sh_job_catalog, public.sh_job_mine, public.sh_job_save, public.sh_job_set, public.sh_job_app_create, public.sh_job_app_list, public.sh_job_app_set,
  public.sh_resume_catalog, public.sh_resume_mine, public.sh_resume_save, public.sh_resume_delete, public.sh_resume_offer,
  public.sh_surplus_catalog, public.sh_surplus_mine, public.sh_surplus_save, public.sh_surplus_set, public.sh_surplus_int_create, public.sh_surplus_int_list, public.sh_surplus_int_set,
  public.sh_clinic_get, public.sh_clinic_op from public;
grant execute on function public.sh_job_catalog, public.sh_job_mine, public.sh_job_save, public.sh_job_set, public.sh_job_app_create, public.sh_job_app_list, public.sh_job_app_set,
  public.sh_resume_catalog, public.sh_resume_mine, public.sh_resume_save, public.sh_resume_delete, public.sh_resume_offer,
  public.sh_surplus_catalog, public.sh_surplus_mine, public.sh_surplus_save, public.sh_surplus_set, public.sh_surplus_int_create, public.sh_surplus_int_list, public.sh_surplus_int_set,
  public.sh_clinic_get, public.sh_clinic_op to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20261004c_listing_dedupe.sql
-- ════════════════════════════════════════
-- Ikki marta yuborish himoyasi: bir xil vakansiya / ortiqcha material e'lonini qayta yaratib bo'lmaydi.
do $mig$
declare d text;
begin
  d := pg_get_functiondef('public.sh_job_save'::regproc);
  if position('listing_duplicate' in d) = 0 then
    d := replace(d, E'then raise exception ''lim_reached''; end if;\n    insert into public.jobs',
      E'then raise exception ''lim_reached''; end if;\n    if exists (select 1 from public.jobs where owner_id = p_user and status in (''pending'', ''published'', ''hidden'') and lower(btrim(title)) = lower(btrim(p_data->>''title'')) and lower(btrim(clinic)) = lower(btrim(p_data->>''clinic'')) and lower(btrim(city)) = lower(btrim(p_data->>''city''))) then raise exception ''listing_duplicate''; end if;\n    insert into public.jobs');
    execute d;
  end if;
  d := pg_get_functiondef('public.sh_surplus_save'::regproc);
  if position('listing_duplicate' in d) = 0 then
    d := replace(d, E'then raise exception ''lim_reached''; end if;\n    insert into public.surplus_listings',
      E'then raise exception ''lim_reached''; end if;\n    if exists (select 1 from public.surplus_listings where owner_id = p_user and status in (''pending'', ''published'', ''hidden'') and lower(btrim(name)) = lower(btrim(p_data->>''name'')) and lower(btrim(brand)) = lower(btrim(p_data->>''brand'')) and price = v_price) then raise exception ''listing_duplicate''; end if;\n    insert into public.surplus_listings');
    execute d;
  end if;
end $mig$;

-- ════════════════════════════════════════
-- 20261005a_legal_contact_privacy_requests.sql
-- ════════════════════════════════════════
-- 3-bosqich: huquqiy sahifalar uchun
--  * site_settings: admin kiritadigan ommaviy aloqa ma'lumoti (email / telefon / Telegram) — bo'sh bo'lsa sahifa ilova ichidagi so'rov formasini ko'rsatadi
--  * privacy_requests: /hisobni-ochirish formasi (hisobni o'chirish, ma'lumot nusxasi, maxfiylik savoli) — admin ko'radi va holatini yangilaydi
-- RLS yoqilgan, policy yo'q: faqat sh_* RPC (p_secret) orqali.

create table if not exists public.site_settings (
  key text primary key check (key in ('contact_email', 'contact_phone', 'contact_telegram')),
  value text not null check (char_length(value) between 1 and 120),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null check (char_length(name) between 2 and 80),
  phone text check (phone is null or char_length(phone) = 9),
  email text check (email is null or (char_length(email) <= 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  scope text not null check (scope in ('hisob', 'malumot', 'savol')),
  message text check (message is null or char_length(message) <= 1000),
  status text not null default 'yangi' check (status in ('yangi', 'jarayonda', 'bajarildi', 'rad')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);
create index if not exists privacy_requests_status_idx on public.privacy_requests (status, created_at desc);
create index if not exists privacy_requests_user_idx on public.privacy_requests (user_id);
alter table public.privacy_requests enable row level security;
revoke all on public.privacy_requests from anon, authenticated;

-- ommaviy aloqa (faqat admin kiritganlari)
create or replace function public.sh_site_contact_get(p_secret text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'email', (select value from public.site_settings where key = 'contact_email'),
    'phone', (select value from public.site_settings where key = 'contact_phone'),
    'telegram', (select value from public.site_settings where key = 'contact_telegram'));
end $$;

-- admin: p_data = { email, phone, telegram } (bo'sh qator = o'chirish)
create or replace function public.sh_site_contact_set(p_secret text, p_admin uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_email text := nullif(btrim(coalesce(p_data->>'email', '')), ''); v_phone text := nullif(btrim(coalesce(p_data->>'phone', '')), '');
  v_tg text := nullif(regexp_replace(btrim(coalesce(p_data->>'telegram', '')), '^(https?://)?(t\.me/|@)', ''), '');
  v_ph9 text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin']);
  if v_email is not null and (char_length(v_email) > 120 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'val_invalid'; end if;
  if v_phone is not null then
    v_ph9 := private.phone9(v_phone);
    if char_length(v_ph9) <> 9 then raise exception 'val_invalid'; end if;
    v_phone := private.phone_fmt(v_ph9);
  end if;
  if v_tg is not null and v_tg !~ '^[A-Za-z0-9_]{4,32}$' then raise exception 'val_invalid'; end if;
  delete from public.site_settings where key in ('contact_email', 'contact_phone', 'contact_telegram');
  if v_email is not null then insert into public.site_settings (key, value, updated_by) values ('contact_email', v_email, p_admin); end if;
  if v_phone is not null then insert into public.site_settings (key, value, updated_by) values ('contact_phone', v_phone, p_admin); end if;
  if v_tg is not null then insert into public.site_settings (key, value, updated_by) values ('contact_telegram', '@' || v_tg, p_admin); end if;
  perform private.audit(p_admin, 'site.contact', 'site_settings', 'contact', jsonb_build_object('email', v_email is not null, 'phone', v_phone is not null, 'telegram', v_tg is not null));
  return public.sh_site_contact_get(p_secret);
end $$;

-- so'rov yuborish (p_user — kirgan bo'lsa; mehmon ham yubora oladi)
-- p_data = { name, phone, email, scope, message }
create or replace function public.sh_privacy_create(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_name text := left(btrim(coalesce(p_data->>'name', '')), 80); v_phone text := nullif(private.phone9(p_data->>'phone'), '');
  v_email text := nullif(left(btrim(coalesce(p_data->>'email', '')), 120), ''); v_scope text := coalesce(p_data->>'scope', '');
  v_msg text := nullif(left(btrim(coalesce(p_data->>'message', '')), 1000), ''); p public.profiles; r public.privacy_requests; v_limit int;
begin
  perform private.assert_secret(p_secret);
  v_limit := case when p_user is null then 10 else 30 end;
  if p_user is not null then
    perform private.assert_active(p_user);
    select * into p from public.profiles where id = p_user;
    if v_name = '' then v_name := left(coalesce(p.full_name, ''), 80); end if;
    if v_phone is null and p.phone is not null then v_phone := nullif(private.phone9(p.phone), ''); end if;
    if v_email is null then v_email := p.email; end if;
  end if;
  if v_phone is not null and char_length(v_phone) <> 9 then v_phone := null; end if;
  if char_length(v_name) < 2 or v_scope not in ('hisob', 'malumot', 'savol') or (v_phone is null and v_email is null)
     or (v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') or (v_scope = 'savol' and v_msg is null) then
    raise exception 'val_invalid';
  end if;
  -- ikki marta yuborishdan himoya: bir xil shaxs uchun ochiq so'rov bo'lsa
  if exists (select 1 from public.privacy_requests where status in ('yangi', 'jarayonda') and scope = v_scope
      and ((p_user is not null and user_id = p_user) or (v_phone is not null and phone = v_phone) or (v_email is not null and lower(email) = lower(v_email)))) then
    raise exception 'req_duplicate';
  end if;
  -- spam: soatiga umumiy limit (mehmonlar uchun qattiqroq)
  if (select count(*) from public.privacy_requests where created_at > now() - interval '1 hour' and (p_user is null) = (user_id is null)) >= v_limit then
    raise exception 'req_rate';
  end if;
  insert into public.privacy_requests (user_id, name, phone, email, scope, message) values (p_user, v_name, v_phone, v_email, v_scope, v_msg) returning * into r;
  perform private.sem_notify_admins('privacy_new', 'Yangi maxfiylik so‘rovi',
    case v_scope when 'hisob' then 'Hisobni o‘chirish' when 'malumot' then 'Ma’lumot so‘rovi' else 'Maxfiylik savoli' end || ' · ' || left(v_name, 40), '/admin/sozlamalar');
  if p_user is not null then
    perform private.notify(p_user, 'privacy_received', 'So‘rovingiz qabul qilindi', 'Administrator ko‘rib chiqadi. Natija haqida bildirishnoma olasiz.', '/hisobni-ochirish', null);
  end if;
  return jsonb_build_object('id', r.id, 'status', r.status);
end $$;

create or replace function public.sh_privacy_list(p_secret text, p_admin uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin']);
  return coalesce((select jsonb_agg(jsonb_build_object('id', r.id, 'userId', r.user_id, 'name', r.name, 'phone', private.phone_fmt(r.phone), 'email', r.email,
      'scope', r.scope, 'message', r.message, 'status', r.status, 'adminNote', r.admin_note, 'createdAt', r.created_at, 'handledAt', r.handled_at,
      'registered', r.user_id is not null) order by (r.status in ('yangi', 'jarayonda')) desc, r.created_at desc)
    from (select * from public.privacy_requests order by created_at desc limit 200) r), '[]'::jsonb);
end $$;

create or replace function public.sh_privacy_set(p_secret text, p_admin uuid, p_id uuid, p_status text, p_note text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.privacy_requests; v_note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin']);
  if p_status not in ('jarayonda', 'bajarildi', 'rad') or (p_status = 'rad' and v_note is null) then raise exception 'val_invalid'; end if;
  update public.privacy_requests set status = p_status, admin_note = coalesce(v_note, admin_note), handled_by = p_admin, handled_at = now()
    where id = p_id and status in ('yangi', 'jarayonda') returning * into r;
  if r.id is null then raise exception 'req_state'; end if;
  perform private.audit(p_admin, 'privacy.' || p_status, 'privacy_request', r.id::text, jsonb_build_object('scope', r.scope));
  if r.user_id is not null then
    perform private.notify(r.user_id, 'privacy_' || p_status, case p_status when 'jarayonda' then 'So‘rovingiz ko‘rilmoqda' when 'bajarildi' then 'So‘rovingiz bajarildi' else 'So‘rovingiz rad etildi' end,
      coalesce(v_note, 'Batafsil ma’lumot uchun /hisobni-ochirish sahifasiga qarang.'), '/hisobni-ochirish', null);
  end if;
  return jsonb_build_object('id', r.id, 'status', r.status);
end $$;

revoke execute on function public.sh_site_contact_get, public.sh_site_contact_set, public.sh_privacy_create, public.sh_privacy_list, public.sh_privacy_set from public;
grant execute on function public.sh_site_contact_get, public.sh_site_contact_set, public.sh_privacy_create, public.sh_privacy_list, public.sh_privacy_set to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20261005b_brand_stomahub.sql
-- ════════════════════════════════════════
-- Brend nomi yagona "StomaHub": platforma do'koni, platforma profili va buyurtmalardagi do'kon nomi (faqat ko'rinadigan matnlar).
-- Identifikatorlar o'zgarmaydi: slug 'kaliti-market', provider_uid 'platform:stomatolog-kaliti', buyurtma raqamlari (SK-…).
update public.stores
   set name = 'StomaHub Market', owner_name = 'StomaHub',
       bio = 'StomaHub rasmiy katalogi — platforma o‘zi sotadigan mahsulotlar. Buyurtmalarni platforma administratori boshqaradi.'
 where is_platform and slug = 'kaliti-market';
update public.profiles set full_name = 'StomaHub (platforma)' where provider_uid = 'platform:stomatolog-kaliti';
update public.orders set shop_name = 'StomaHub Market' where shop_name = 'Kaliti Market';

-- ════════════════════════════════════════
-- 20261009a_ustalar_v2.sql
-- ════════════════════════════════════════
-- Ustalar v2 (mobile redesign): master work photos + district + online flag; richer service requests
-- (multi-service, time range, photo/video media, extra info). Backward compatible with the v1 single-service flow.

alter table public.masters add column if not exists works text[] not null default '{}';
alter table public.masters add column if not exists district text;

alter table public.master_requests add column if not exists services text[] not null default '{}';
alter table public.master_requests add column if not exists time_range text;
alter table public.master_requests add column if not exists media text[] not null default '{}';
alter table public.master_requests add column if not exists extra text;

-- Request photos/videos (up to 10 MB each) go to the same ticketed community bucket.
update storage.buckets
   set file_size_limit = greatest(coalesce(file_size_limit, 0), 10485760),
       allowed_mime_types = (select array_agg(distinct x) from unnest(coalesce(allowed_mime_types, '{}') || array['video/mp4', 'video/quicktime', 'video/webm']) x)
 where id = 'community';

create or replace function private.master_json(m public.masters, p_full boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', m.id, 'name', m.name, 'kind', m.kind, 'title', m.title, 'services', to_jsonb(m.services), 'city', m.city,
    'district', m.district, 'years', m.years, 'description', m.description, 'photo', m.photo, 'works', to_jsonb(coalesce(m.works, '{}')),
    'status', m.status, 'createdAt', m.created_at,
    'online', coalesce((select p.last_seen_at > now() - interval '5 minutes' from public.profiles p where p.id = m.owner_id), false),
    'jobs', (select count(*) from public.master_requests r where r.master_id = m.id and r.status = 'bajarildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(m.phone), 'telegram', m.telegram, 'rejectReason', m.reject_reason) else '{}'::jsonb end
$$;

create or replace function public.sh_master_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters; v_phone text := private.phone9(p_data->>'phone'); v_services text[]; v_works text[];
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x;
  select coalesce(array_agg(left(x, 400)), '{}') into v_works from (select x from jsonb_array_elements_text(coalesce(p_data->'works', '[]'::jsonb)) x where btrim(x) <> '' limit 12) w;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(btrim(coalesce(p_data->>'title', ''))) < 2
     or cardinality(v_services) < 1 or char_length(v_phone) <> 9 or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 then
    raise exception 'val_invalid';
  end if;
  select * into m from public.masters where owner_id = p_user for update;
  if m.id is null then
    insert into public.masters (owner_id, kind, name, title, services, city, district, years, description, photo, works, phone, telegram, status)
    values (p_user, case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'title'), 80),
      v_services, left(btrim(p_data->>'city'), 60), nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), coalesce((p_data->>'years')::int, 0),
      nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_works, v_phone,
      nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), 'pending')
    returning * into m;
    perform private.sem_notify_admins('moderation_new', 'Yangi usta profili', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'master_pending', 'Usta profilingiz moderatsiyada', 'Admin tasdiqlagach hamma ko‘radi.', '/ustalar/mening', null);
  else
    update public.masters set kind = case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, name = left(btrim(p_data->>'name'), 80),
      title = left(btrim(p_data->>'title'), 80), services = v_services, city = left(btrim(p_data->>'city'), 60),
      district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), years = coalesce((p_data->>'years')::int, 0),
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''),
      works = v_works, phone = v_phone, telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      status = case when status in ('rejected') then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end,
      updated_at = now() where id = m.id returning * into m;
    if m.status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Usta profili yangilandi', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.master_json(m, true);
end $$;

create or replace function public.sh_master_req_create(p_secret text, p_user uuid, p_master uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters; r public.master_requests; v_phone text := private.phone9(p_data->>'phone'); v_when text := coalesce(p_data->>'when', 'bugun');
  v_date date; v_services text[]; v_media text[]; v_service text := p_data->>'service';
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into m from public.masters where id = p_master and status = 'published';
  if m.id is null then raise exception 'req_notfound'; end if;
  if m.owner_id = p_user then raise exception 'req_self'; end if;
  select coalesce(array_agg(distinct x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x
    where x in ('kreslo','rentgen','profilaktika','ehtiyot','kompressor','sterilizatsiya','skaner','boshqa');
  select coalesce(array_agg(left(x, 400)), '{}') into v_media from (select x from jsonb_array_elements_text(coalesce(p_data->'media', '[]'::jsonb)) x where btrim(x) <> '' limit 5) q;
  if v_service is null or v_service not in ('rentgen','kreslo','ornatish','tamirlash','mebel') then
    v_service := case when 'kreslo' = any(v_services) then 'kreslo' when 'rentgen' = any(v_services) then 'rentgen'
                      when 'skaner' = any(v_services) then 'ornatish' else 'tamirlash' end;
  end if;
  if char_length(btrim(coalesce(p_data->>'clinic', ''))) < 2 or char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(v_phone) <> 9
     or v_when not in ('bugun','ertaga','sana') then
    raise exception 'val_invalid';
  end if;
  if v_when = 'sana' then
    begin v_date := (p_data->>'date')::date; exception when others then raise exception 'val_invalid'; end;
    if v_date is null or v_date < current_date then raise exception 'val_invalid'; end if;
  end if;
  if (select count(*) from public.master_requests where requester_id = p_user and created_at > now() - interval '1 hour') >= 8 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.master_requests where master_id = m.id and requester_id = p_user and service = v_service and status in ('yuborildi', 'jarayonda')) then
    raise exception 'req_duplicate';
  end if;
  insert into public.master_requests (master_id, requester_id, service, services, clinic, district, address, name, phone, note, when_need, need_date, time_range, media, extra)
  values (m.id, p_user, v_service, v_services, left(btrim(p_data->>'clinic'), 120), nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''),
    nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''), left(btrim(p_data->>'name'), 80), v_phone,
    nullif(left(btrim(coalesce(p_data->>'note', '')), 500), ''), v_when, v_date, nullif(left(btrim(coalesce(p_data->>'timeRange', '')), 40), ''),
    v_media, nullif(left(btrim(coalesce(p_data->>'extra', '')), 500), '')) returning * into r;
  perform private.notify(m.owner_id, 'master_request', 'Yangi xizmat so‘rovi', left(r.clinic, 80) || ' · ' || r.name, '/ustalar/sorovlarim?tab=kelgan', null);
  perform private.notify(p_user, 'master_request_sent', 'So‘rov yuborildi', left(m.name, 80) || ' ga so‘rovingiz yuborildi. Javobni kuting.', '/ustalar/sorovlarim', null);
  return jsonb_build_object('id', r.id, 'status', r.status);
end $$;

create or replace function private.master_req_json(r public.master_requests, m public.masters, p_for_owner boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'masterId', r.master_id, 'masterName', m.name, 'service', r.service, 'services', to_jsonb(coalesce(r.services, '{}')),
    'clinic', r.clinic, 'district', r.district, 'address', r.address, 'name', r.name, 'phone', private.phone_fmt(r.phone), 'note', r.note,
    'when', r.when_need, 'date', r.need_date, 'timeRange', r.time_range, 'media', to_jsonb(coalesce(r.media, '{}')), 'extra', r.extra,
    'status', r.status, 'createdAt', r.created_at, 'updatedAt', r.updated_at)
  || case when not p_for_owner and r.status in ('jarayonda', 'bajarildi') then jsonb_build_object('masterPhone', private.phone_fmt(m.phone), 'masterTelegram', m.telegram) else '{}'::jsonb end
$$;

revoke execute on function private.master_json, private.master_req_json from public, anon, authenticated;

-- ════════════════════════════════════════
-- 20261009b_masters_konsultatsiya.sql
-- ════════════════════════════════════════
-- Ustalar v2: allow the "konsultatsiya" master service.
alter table public.masters drop constraint if exists masters_services_check;
alter table public.masters add constraint masters_services_check check (
  cardinality(services) between 1 and 6
  and services <@ array['rentgen','kreslo','ornatish','tamirlash','mebel','servis','konsultatsiya']::text[]
);

-- ════════════════════════════════════════
-- 20261009c_ishlar_v2.sql
-- ════════════════════════════════════════
-- Ishlar v2 (mobile redesign): richer vacancy cards — category, media, schedule, benefits, requirements, employer info.
alter table public.jobs
  add column if not exists category text,
  add column if not exists photos text[] not null default '{}',
  add column if not exists video text,
  add column if not exists district text,
  add column if not exists address text,
  add column if not exists work_days text,
  add column if not exists work_hours text,
  add column if not exists benefits text[] not null default '{}',
  add column if not exists requirements text[] not null default '{}',
  add column if not exists employer_about text,
  add column if not exists staff_count integer,
  add column if not exists founded_year integer,
  add column if not exists logo text;

alter table public.jobs drop constraint if exists jobs_job_type_check;
alter table public.jobs add constraint jobs_job_type_check check (job_type in ('full', 'part', 'shift', 'freelance', 'amaliyot'));
alter table public.jobs drop constraint if exists jobs_category_check;
alter table public.jobs add constraint jobs_category_check check (category is null or category in ('klinika', 'texnik', 'shifokor'));
alter table public.jobs drop constraint if exists jobs_photos_check;
alter table public.jobs add constraint jobs_photos_check check (cardinality(photos) <= 8);
alter table public.jobs drop constraint if exists jobs_video_check;
alter table public.jobs add constraint jobs_video_check check (video is null or char_length(video) <= 400);
alter table public.jobs drop constraint if exists jobs_logo_check;
alter table public.jobs add constraint jobs_logo_check check (logo is null or char_length(logo) <= 400);
alter table public.jobs drop constraint if exists jobs_district_check;
alter table public.jobs add constraint jobs_district_check check (district is null or char_length(district) <= 60);
alter table public.jobs drop constraint if exists jobs_address_check;
alter table public.jobs add constraint jobs_address_check check (address is null or char_length(address) <= 200);
alter table public.jobs drop constraint if exists jobs_work_days_check;
alter table public.jobs add constraint jobs_work_days_check check (work_days is null or char_length(work_days) <= 60);
alter table public.jobs drop constraint if exists jobs_work_hours_check;
alter table public.jobs add constraint jobs_work_hours_check check (work_hours is null or char_length(work_hours) <= 40);
alter table public.jobs drop constraint if exists jobs_benefits_check;
alter table public.jobs add constraint jobs_benefits_check check (cardinality(benefits) <= 6 and benefits <@ array['rasmiy','oqim','malaka','jamoa','sharoit','avtoturargoh','tushlik','bonus']::text[]);
alter table public.jobs drop constraint if exists jobs_requirements_check;
alter table public.jobs add constraint jobs_requirements_check check (cardinality(requirements) <= 8);
alter table public.jobs drop constraint if exists jobs_employer_about_check;
alter table public.jobs add constraint jobs_employer_about_check check (employer_about is null or char_length(employer_about) <= 160);
alter table public.jobs drop constraint if exists jobs_staff_count_check;
alter table public.jobs add constraint jobs_staff_count_check check (staff_count is null or staff_count between 1 and 5000);
alter table public.jobs drop constraint if exists jobs_founded_year_check;
alter table public.jobs add constraint jobs_founded_year_check check (founded_year is null or founded_year between 1950 and 2100);

create or replace function private.job_json(j public.jobs, p_viewer uuid)
 returns jsonb language sql stable set search_path to '' as $function$
  select jsonb_build_object('id', j.id, 'title', j.title, 'clinic', j.clinic, 'city', j.city, 'salaryMin', j.salary_min, 'salaryMax', j.salary_max,
    'type', j.job_type, 'experienceYears', j.experience_years, 'remote', j.remote, 'description', j.description, 'status', j.status,
    'rejectReason', j.reject_reason, 'createdAt', j.created_at, 'mine', j.owner_id = p_viewer,
    'category', j.category, 'photos', to_jsonb(j.photos), 'video', j.video, 'district', j.district, 'address', j.address,
    'workDays', j.work_days, 'workHours', j.work_hours, 'benefits', to_jsonb(j.benefits), 'requirements', to_jsonb(j.requirements),
    'employerAbout', j.employer_about, 'staffCount', j.staff_count, 'foundedYear', j.founded_year, 'logo', j.logo)
  || case when j.owner_id = p_viewer then jsonb_build_object('appCount', (select count(*) from public.job_applications a where a.job_id = j.id and a.status <> 'bekor'),
      'newCount', (select count(*) from public.job_applications a where a.job_id = j.id and a.status = 'yuborildi'), 'phone', private.phone_fmt(j.phone)) else '{}'::jsonb end
$function$;

create or replace function public.sh_job_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare j public.jobs; v_phone text := private.phone9(p_data->>'phone'); v_min bigint := nullif(p_data->>'salaryMin', '')::bigint; v_max bigint := nullif(p_data->>'salaryMax', '')::bigint;
  v_type text := coalesce(p_data->>'type', 'full');
  v_cat text := nullif(p_data->>'category', '');
  v_photos text[] := coalesce((select array_agg(left(x, 400)) from (select jsonb_array_elements_text(case when jsonb_typeof(p_data->'photos') = 'array' then p_data->'photos' else '[]'::jsonb end) x limit 8) s), '{}');
  v_benefits text[] := coalesce((select array_agg(distinct x) from (select jsonb_array_elements_text(case when jsonb_typeof(p_data->'benefits') = 'array' then p_data->'benefits' else '[]'::jsonb end) x) s
      where x in ('rasmiy','oqim','malaka','jamoa','sharoit','avtoturargoh','tushlik','bonus')), '{}');
  v_reqs text[] := coalesce((select array_agg(left(btrim(x), 160)) from (select jsonb_array_elements_text(case when jsonb_typeof(p_data->'requirements') = 'array' then p_data->'requirements' else '[]'::jsonb end) x limit 8) s where btrim(x) <> ''), '{}');
  v_video text := nullif(left(btrim(coalesce(p_data->>'video', '')), 400), '');
  v_logo text := nullif(left(btrim(coalesce(p_data->>'logo', '')), 400), '');
  v_district text := nullif(left(btrim(coalesce(p_data->>'district', '')), 60), '');
  v_address text := nullif(left(btrim(coalesce(p_data->>'address', '')), 200), '');
  v_days text := nullif(left(btrim(coalesce(p_data->>'workDays', '')), 60), '');
  v_hours text := nullif(left(btrim(coalesce(p_data->>'workHours', '')), 40), '');
  v_about text := nullif(left(btrim(coalesce(p_data->>'employerAbout', '')), 160), '');
  v_staff int := nullif(p_data->>'staffCount', '')::int;
  v_founded int := nullif(p_data->>'foundedYear', '')::int;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if cardinality(v_benefits) > 6 then v_benefits := v_benefits[1:6]; end if;
  if char_length(btrim(coalesce(p_data->>'title', ''))) < 3 or char_length(btrim(coalesce(p_data->>'clinic', ''))) < 2 or char_length(btrim(coalesce(p_data->>'city', ''))) < 2
     or char_length(btrim(coalesce(p_data->>'description', ''))) < 20 or char_length(v_phone) <> 9 or v_type not in ('full', 'part', 'shift', 'freelance', 'amaliyot')
     or (v_cat is not null and v_cat not in ('klinika', 'texnik', 'shifokor'))
     or (v_staff is not null and (v_staff < 1 or v_staff > 5000)) or (v_founded is not null and (v_founded < 1950 or v_founded > extract(year from now())::int))
     or (v_min is not null and v_max is not null and v_max < v_min) then
    raise exception 'val_invalid';
  end if;
  if p_id is null then
    if (select count(*) from public.jobs where owner_id = p_user and created_at > now() - interval '1 day') >= 5
       or (select count(*) from public.jobs where owner_id = p_user and status in ('pending', 'published')) >= 15 then raise exception 'lim_reached'; end if;
    if exists (select 1 from public.jobs where owner_id = p_user and status in ('pending', 'published', 'hidden') and lower(btrim(title)) = lower(btrim(p_data->>'title')) and lower(btrim(clinic)) = lower(btrim(p_data->>'clinic')) and lower(btrim(city)) = lower(btrim(p_data->>'city'))) then raise exception 'listing_duplicate'; end if;
    insert into public.jobs (owner_id, title, clinic, city, salary_min, salary_max, job_type, experience_years, remote, description, phone, status,
        category, photos, video, district, address, work_days, work_hours, benefits, requirements, employer_about, staff_count, founded_year, logo)
    values (p_user, left(btrim(p_data->>'title'), 100), left(btrim(p_data->>'clinic'), 100), left(btrim(p_data->>'city'), 60), v_min, v_max, v_type,
      coalesce(nullif(p_data->>'experienceYears', '')::int, 0), coalesce((p_data->>'remote')::boolean, false), left(btrim(p_data->>'description'), 2000), v_phone, 'pending',
      v_cat, v_photos, v_video, v_district, v_address, v_days, v_hours, v_benefits, v_reqs, v_about, v_staff, v_founded, v_logo)
    returning * into j;
    perform private.sem_notify_admins('moderation_new', 'Yangi vakansiya', left(j.title, 60) || ' · ' || left(j.clinic, 40) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'job_pending', 'Vakansiyangiz moderatsiyada', 'Admin tasdiqlagach hamma ko‘radi.', '/ishlar/vakansiyalarim', null);
  else
    select * into j from public.jobs where id = p_id and owner_id = p_user for update;
    if j.id is null then raise exception 'req_notfound'; end if;
    update public.jobs set title = left(btrim(p_data->>'title'), 100), clinic = left(btrim(p_data->>'clinic'), 100), city = left(btrim(p_data->>'city'), 60),
      salary_min = v_min, salary_max = v_max, job_type = v_type, experience_years = coalesce(nullif(p_data->>'experienceYears', '')::int, 0),
      remote = coalesce((p_data->>'remote')::boolean, false), description = left(btrim(p_data->>'description'), 2000), phone = v_phone,
      category = v_cat, photos = v_photos, video = v_video, district = v_district, address = v_address, work_days = v_days, work_hours = v_hours,
      benefits = v_benefits, requirements = v_reqs, employer_about = v_about, staff_count = v_staff, founded_year = v_founded, logo = v_logo,
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end, updated_at = now()
      where id = j.id returning * into j;
    if j.status = 'pending' then perform private.sem_notify_admins('moderation_new', 'Vakansiya yangilandi', left(j.title, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya'); end if;
  end if;
  return private.job_json(j, p_user);
end $function$;

-- ════════════════════════════════════════
-- 20261009d_laboratoriya_v2.sql
-- ════════════════════════════════════════
-- Laboratoriya v2 (mobile redesign): gallery/video/logo, district, experience, courier, portfolio, price list,
-- admin-only verified flag, owner online flag. All optional: the UI shows neutral states when empty.

alter table public.labs add column if not exists district text check (district is null or char_length(district) <= 60);
alter table public.labs add column if not exists photos text[] not null default '{}' check (cardinality(photos) <= 12);
alter table public.labs add column if not exists video text check (video is null or char_length(video) <= 400);
alter table public.labs add column if not exists logo text check (logo is null or char_length(logo) <= 400);
alter table public.labs add column if not exists years int check (years is null or (years >= 0 and years <= 60));
alter table public.labs add column if not exists courier text check (courier is null or courier in ('ha', 'yoq'));
alter table public.labs add column if not exists courier_area text check (courier_area is null or char_length(courier_area) <= 60);
alter table public.labs add column if not exists portfolio text[] not null default '{}' check (cardinality(portfolio) <= 24);
alter table public.labs add column if not exists price_items jsonb not null default '[]'::jsonb
  check (jsonb_typeof(price_items) = 'array' and jsonb_array_length(price_items) <= 30);
-- Set by admins only (never by sh_lab_save).
alter table public.labs add column if not exists verified boolean not null default false;

create or replace function private.lab_json(l public.labs, p_full boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'name', l.name, 'city', l.city, 'services', to_jsonb(l.services), 'materials', to_jsonb(l.materials),
    'description', l.description, 'days', l.days, 'priceFrom', l.price_from, 'photo', l.photo, 'status', l.status, 'createdAt', l.created_at,
    'district', l.district, 'photos', to_jsonb(coalesce(l.photos, '{}')), 'video', l.video, 'logo', l.logo, 'years', l.years,
    'courier', l.courier, 'courierArea', l.courier_area, 'portfolio', to_jsonb(coalesce(l.portfolio, '{}')), 'priceItems', coalesce(l.price_items, '[]'::jsonb),
    'verified', l.verified,
    'online', coalesce((select p.last_seen_at > now() - interval '5 minutes' from public.profiles p where p.id = l.owner_id), false),
    'lastSeen', (select p.last_seen_at from public.profiles p where p.id = l.owner_id),
    'done', (select count(*) from public.lab_orders o where o.lab_id = l.id and o.status = 'yetkazildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram, 'rejectReason', l.reject_reason) else '{}'::jsonb end
$$;

create or replace function public.sh_lab_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.labs; v_phone text := private.phone9(p_data->>'phone'); v_services text[]; v_materials text[];
  v_photos text[]; v_portfolio text[]; v_items jsonb; v_years int; v_courier text;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x;
  select coalesce(array_agg(x), '{}') into v_materials from jsonb_array_elements_text(coalesce(p_data->'materials', '[]'::jsonb)) x;
  select coalesce(array_agg(left(x, 400)), '{}') into v_photos from (select x from jsonb_array_elements_text(coalesce(p_data->'photos', '[]'::jsonb)) x where btrim(x) <> '' limit 12) q;
  select coalesce(array_agg(left(x, 400)), '{}') into v_portfolio from (select x from jsonb_array_elements_text(coalesce(p_data->'portfolio', '[]'::jsonb)) x where btrim(x) <> '' limit 24) q;
  v_items := case when jsonb_typeof(p_data->'priceItems') = 'array' then p_data->'priceItems' else '[]'::jsonb end;
  if jsonb_array_length(v_items) > 30 or pg_column_size(v_items) > 60000 then raise exception 'val_invalid'; end if;
  v_years := nullif(p_data->>'years', '')::int;
  v_courier := case when p_data->>'courier' in ('ha', 'yoq') then p_data->>'courier' else null end;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or cardinality(v_services) < 1 or char_length(v_phone) <> 9
     or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 then raise exception 'val_invalid'; end if;
  select * into l from public.labs where owner_id = p_user for update;
  if l.id is null then
    insert into public.labs (owner_id, name, city, services, materials, description, days, price_from, photo, phone, telegram, status,
      district, photos, video, logo, years, courier, courier_area, portfolio, price_items)
    values (p_user, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'city'), 60), v_services, v_materials,
      nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), nullif(p_data->>'days', '')::int, nullif(p_data->>'priceFrom', '')::bigint,
      nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), 'pending',
      nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), v_photos, nullif(btrim(coalesce(p_data->>'video', '')), ''),
      nullif(btrim(coalesce(p_data->>'logo', '')), ''), v_years, v_courier, nullif(left(btrim(coalesce(p_data->>'courierArea', '')), 60), ''), v_portfolio, v_items)
    returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Yangi laboratoriya profili', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'lab_pending', 'Laboratoriya profilingiz moderatsiyada', 'Admin tasdiqlagach katalogda ko‘rinadi.', '/laboratoriya/buyurtmalarim?tab=kelgan', null);
  else
    update public.labs set name = left(btrim(p_data->>'name'), 80), city = left(btrim(p_data->>'city'), 60), services = v_services, materials = v_materials,
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), days = nullif(p_data->>'days', '')::int, price_from = nullif(p_data->>'priceFrom', '')::bigint,
      photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''), phone = v_phone, telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), photos = v_photos, video = nullif(btrim(coalesce(p_data->>'video', '')), ''),
      logo = nullif(btrim(coalesce(p_data->>'logo', '')), ''), years = v_years, courier = v_courier,
      courier_area = nullif(left(btrim(coalesce(p_data->>'courierArea', '')), 60), ''), portfolio = v_portfolio, price_items = v_items,
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end,
      updated_at = now() where id = l.id returning * into l;
    if l.status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Laboratoriya profili yangilandi', left(l.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.lab_json(l, true);
end $$;

-- ════════════════════════════════════════
-- 20261010a_saved_addresses.sql
-- ════════════════════════════════════════
-- Saved delivery places (Uy, 2-filial, ...) per user, for checkout "Aniq manzil".
create table if not exists public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 40),
  city text,
  district text,
  address text not null check (char_length(address) between 1 and 300),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists saved_addresses_user_idx on public.saved_addresses (user_id, created_at);
alter table public.saved_addresses enable row level security;
revoke all on public.saved_addresses from anon, authenticated;

create or replace function private.saved_address_json(a public.saved_addresses)
 returns jsonb language sql stable set search_path to '' as $function$
  select jsonb_build_object('id', a.id, 'label', a.label, 'city', a.city, 'district', a.district,
    'address', a.address, 'lat', a.lat, 'lng', a.lng, 'createdAt', a.created_at)
$function$;

create or replace function public.sh_saved_addresses(p_secret text, p_user uuid)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.saved_address_json(a) order by a.created_at)
    from public.saved_addresses a where a.user_id = p_user), '[]'::jsonb);
end
$function$;

create or replace function public.sh_saved_address_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
declare
  v_label text := left(btrim(coalesce(p_data->>'label', '')), 40);
  v_addr text := left(btrim(coalesce(p_data->>'address', '')), 300);
  v_city text := nullif(left(btrim(coalesce(p_data->>'city', '')), 60), '');
  v_district text := nullif(left(btrim(coalesce(p_data->>'district', '')), 120), '');
  v_lat double precision := nullif(p_data->>'lat', '')::double precision;
  v_lng double precision := nullif(p_data->>'lng', '')::double precision;
  a public.saved_addresses;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if v_label = '' or v_addr = '' or (v_lat is not null and (v_lat < -90 or v_lat > 90)) or (v_lng is not null and (v_lng < -180 or v_lng > 180)) then
    raise exception 'val_invalid';
  end if;
  if p_id is null then
    if (select count(*) from public.saved_addresses where user_id = p_user) >= 20 then raise exception 'lim_reached'; end if;
    insert into public.saved_addresses (user_id, label, city, district, address, lat, lng)
      values (p_user, v_label, v_city, v_district, v_addr, v_lat, v_lng) returning * into a;
  else
    update public.saved_addresses set label = v_label, city = v_city, district = v_district, address = v_addr,
      lat = v_lat, lng = v_lng, updated_at = now()
      where id = p_id and user_id = p_user returning * into a;
    if a.id is null then raise exception 'req_notfound'; end if;
  end if;
  return private.saved_address_json(a);
end
$function$;

create or replace function public.sh_saved_address_delete(p_secret text, p_user uuid, p_id uuid)
 returns jsonb language plpgsql security definer set search_path to '' as $function$
begin
  perform private.assert_secret(p_secret);
  delete from public.saved_addresses where id = p_id and user_id = p_user;
  return jsonb_build_object('ok', true);
end
$function$;

revoke all on function private.saved_address_json(public.saved_addresses) from public, anon, authenticated;
revoke execute on function public.sh_saved_addresses, public.sh_saved_address_save, public.sh_saved_address_delete from public;
grant execute on function public.sh_saved_addresses, public.sh_saved_address_save, public.sh_saved_address_delete to anon, authenticated;

-- ════════════════════════════════════════
-- 20261010b_order_courier_location.sql
-- ════════════════════════════════════════
-- Courier details on orders: last known courier location (map link and/or coordinates) + admin can set courier fields.
alter table public.orders add column if not exists courier_location_url text check (courier_location_url is null or char_length(courier_location_url) <= 500);
alter table public.orders add column if not exists courier_lat double precision check (courier_lat is null or courier_lat between -90 and 90);
alter table public.orders add column if not exists courier_lng double precision check (courier_lng is null or courier_lng between -180 and 180);
alter table public.orders add column if not exists courier_location_at timestamptz;

create or replace function private.order_json(o public.orders)
 returns jsonb language sql stable set search_path to ''
as $function$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', o.id, 'createdAt', o.created_at, 'name', o.name, 'phone', o.phone, 'city', o.city,
    'address', o.address, 'note', o.note, 'payment', o.payment, 'total', o.total, 'commission', o.commission,
    'bonusUsed', o.bonus_used, 'payable', o.total - o.bonus_used,
    'status', o.status, 'statusHistory', o.status_history, 'paymentState', o.payment_state,
    'shopId', o.shop_id, 'shopName', o.shop_name, 'confirmedAt', o.confirmed_at, 'paidAt', o.paid_at,
    'yandexTrackUrl', o.yandex_track_url, 'courierName', o.courier_name, 'courierPhone', o.courier_phone,
    'carInfo', o.car_info,
    'courierLocationUrl', o.courier_location_url, 'courierLat', o.courier_lat, 'courierLng', o.courier_lng,
    'courierLocationAt', o.courier_location_at,
    'dispute', (select jsonb_build_object('id', d.id, 'reason', d.reason, 'status', d.status, 'resolution', d.resolution, 'createdAt', d.created_at)
                from public.disputes d where d.order_id = o.id order by d.created_at desc limit 1),
    'items', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'productId', i.product_id, 'name', i.name, 'brand', i.brand, 'image', i.image, 'qty', i.qty,
        'price', i.price, 'size', i.size, 'color', i.color, 'category', i.category, 'source', i.source,
        'expiryMonths', i.expiry_months, 'shopName', i.shop_name, 'shopSlug', i.shop_slug, 'shopId', i.store_id)) order by i.id)
      from public.order_items i where i.order_id = o.id), '[]'::jsonb)))
$function$;

-- Applies courier fields from p_track. Location keys are only touched when 'location' is present (old clients keep working).
create or replace function private.apply_courier(p_order text, p_track jsonb)
 returns public.orders language plpgsql set search_path to ''
as $function$
declare o public.orders; v_url text; v_lat double precision; v_lng double precision;
begin
  update public.orders set yandex_track_url = nullif(trim(p_track->>'yandexTrackUrl'), ''),
    courier_name = nullif(left(trim(coalesce(p_track->>'courierName','')), 80), ''),
    courier_phone = nullif(left(trim(coalesce(p_track->>'courierPhone','')), 40), ''),
    car_info = nullif(left(trim(coalesce(p_track->>'carInfo','')), 80), ''), updated_at = now()
  where id = p_order returning * into o;
  if p_track ? 'location' then
    v_url := nullif(left(trim(coalesce(p_track->'location'->>'url','')), 500), '');
    if v_url is not null and v_url !~* '^https://' then v_url := null; end if;
    v_lat := case when (p_track->'location'->>'lat') ~ '^-?\d{1,2}(\.\d+)?$' then (p_track->'location'->>'lat')::double precision end;
    v_lng := case when (p_track->'location'->>'lng') ~ '^-?\d{1,3}(\.\d+)?$' then (p_track->'location'->>'lng')::double precision end;
    if v_lat is null or v_lng is null or v_lat not between -90 and 90 or v_lng not between -180 and 180 then v_lat := null; v_lng := null; end if;
    if (v_url, v_lat, v_lng) is distinct from (o.courier_location_url, o.courier_lat, o.courier_lng) then
      update public.orders set courier_location_url = v_url, courier_lat = v_lat, courier_lng = v_lng,
        courier_location_at = case when v_url is null and v_lat is null then null else now() end
      where id = p_order returning * into o;
    end if;
  end if;
  return o;
end $function$;
revoke all on function private.apply_courier(text, jsonb) from public, anon, authenticated;

create or replace function public.sh_seller_order_update(p_secret text, p_user uuid, p_order text, p_action text, p_track jsonb)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
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
    values (p_order, o.shop_id, 'hold', o.total - o.bonus_used, p_user, 'Naqd to‘lov yetkazishda qabul qilindi (demo)');
  end if;
  return jsonb_build_object('order', private.order_json(o));
end $function$;

create or replace function public.sh_admin_order_courier(p_secret text, p_admin uuid, p_order text, p_track jsonb)
 returns jsonb language plpgsql security definer set search_path to ''
as $function$
declare o public.orders;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_admin(p_admin, array['admin','finance']);
  select * into o from public.orders where id = p_order;
  if o.id is null then return jsonb_build_object('error', 'not_found'); end if;
  if o.payment_state = 'refunded' then return jsonb_build_object('error', 'refunded'); end if;
  o := private.apply_courier(p_order, p_track - 'advance');
  perform private.audit(p_admin, 'order.courier', 'order', p_order,
    jsonb_build_object('courierName', o.courier_name, 'courierPhone', o.courier_phone, 'hasLocation', o.courier_lat is not null or o.courier_location_url is not null));
  return jsonb_build_object('order', private.order_json(o));
end $function$;
revoke execute on function public.sh_admin_order_courier(text, uuid, text, jsonb) from public;
grant execute on function public.sh_admin_order_courier(text, uuid, text, jsonb) to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20261010c_surplus_media_pdp.sql
-- ════════════════════════════════════════
-- 20261010c: Ortiqcha material — full product page: gallery, video, description, pickup location; single-listing read.
alter table public.surplus_listings
  add column if not exists images text[] not null default '{}' check (cardinality(images) <= 8),
  add column if not exists video text check (video is null or char_length(video) <= 400),
  add column if not exists description text check (description is null or char_length(description) <= 2000),
  add column if not exists address text check (address is null or char_length(address) <= 200),
  add column if not exists lat double precision check (lat is null or lat between -90 and 90),
  add column if not exists lng double precision check (lng is null or lng between -180 and 180);

create or replace function private.surplus_json(l public.surplus_listings, p_viewer uuid) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', l.id, 'name', l.name, 'brand', l.brand, 'category', l.category, 'price', l.price, 'newPrice', l.new_price, 'pkg', l.pkg,
    'expiryMonths', l.expiry_months, 'city', l.city, 'district', l.district, 'image', l.image, 'note', l.note, 'status', l.status, 'rejectReason', l.reject_reason,
    'images', to_jsonb(coalesce(l.images, '{}'::text[])), 'video', l.video, 'description', l.description, 'address', l.address, 'lat', l.lat, 'lng', l.lng,
    'seller', coalesce((select full_name from public.profiles where id = l.owner_id), 'Doktor'), 'createdAt', l.created_at, 'updatedAt', l.updated_at, 'mine', l.owner_id = p_viewer)
  || case when l.owner_id = p_viewer then jsonb_build_object('phone', private.phone_fmt(l.phone), 'telegram', l.telegram,
      'interestCount', (select count(*) from public.surplus_interests i where i.listing_id = l.id and i.status <> 'bekor')) else '{}'::jsonb end
$$;

/** One listing for the product page: published for everyone, any state for its owner. */
create or replace function public.sh_surplus_get(p_secret text, p_id uuid, p_viewer uuid default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.surplus_listings;
begin
  perform private.assert_secret(p_secret);
  select * into l from public.surplus_listings where id = p_id and (status = 'published' or (p_viewer is not null and owner_id = p_viewer));
  if l.id is null then return null; end if;
  return private.surplus_json(l, p_viewer);
end $$;

create or replace function public.sh_surplus_save(p_secret text, p_user uuid, p_id uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l public.surplus_listings; v_phone text := private.phone9(p_data->>'phone'); v_price bigint := nullif(p_data->>'price', '')::bigint; v_new bigint := nullif(p_data->>'newPrice', '')::bigint;
  v_exp int := nullif(p_data->>'expiryMonths', '')::int;
  v_images text[] := case when jsonb_typeof(p_data->'images') = 'array'
    then array(select left(btrim(x), 400) from jsonb_array_elements_text(p_data->'images') x where btrim(x) <> '' limit 8) else '{}'::text[] end;
  v_video text := nullif(left(btrim(coalesce(p_data->>'video', '')), 400), '');
  v_desc text := nullif(left(btrim(coalesce(p_data->>'description', '')), 2000), '');
  v_addr text := nullif(left(btrim(coalesce(p_data->>'address', '')), 200), '');
  v_lat double precision := nullif(p_data->>'lat', '')::double precision;
  v_lng double precision := nullif(p_data->>'lng', '')::double precision;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(btrim(coalesce(p_data->>'brand', ''))) < 1 or v_price is null or v_price < 1
     or v_exp is null or v_exp < 1 or v_exp > 120 or coalesce(p_data->>'pkg', '') not in ('yopiq', 'ochilgan') or char_length(btrim(coalesce(p_data->>'city', ''))) < 2
     or char_length(v_phone) <> 9 or char_length(btrim(coalesce(p_data->>'note', ''))) < 12
     or coalesce(p_data->>'category', '') not in ('kompozit','bonding','sement','endodontiya','implantlar','anesteziya','borlar','instrument','ortodontiya')
     or (v_lat is null) <> (v_lng is null) or (v_lat is not null and (v_lat not between -90 and 90 or v_lng not between -180 and 180)) then
    raise exception 'val_invalid';
  end if;
  if p_id is null then
    if (select count(*) from public.surplus_listings where owner_id = p_user and created_at > now() - interval '1 day') >= 10
       or (select count(*) from public.surplus_listings where owner_id = p_user and status in ('pending', 'published')) >= 30 then raise exception 'lim_reached'; end if;
    if exists (select 1 from public.surplus_listings where owner_id = p_user and status in ('pending', 'published', 'hidden') and lower(btrim(name)) = lower(btrim(p_data->>'name')) and lower(btrim(brand)) = lower(btrim(p_data->>'brand')) and price = v_price) then raise exception 'listing_duplicate'; end if;
    insert into public.surplus_listings (owner_id, name, brand, category, price, new_price, pkg, expiry_months, city, district, phone, telegram, image, note, status,
      images, video, description, address, lat, lng)
    values (p_user, left(btrim(p_data->>'name'), 100), left(btrim(p_data->>'brand'), 60), p_data->>'category', v_price, v_new, p_data->>'pkg', v_exp, left(btrim(p_data->>'city'), 60),
      nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), v_phone, nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      nullif(btrim(coalesce(p_data->>'image', '')), ''), left(btrim(p_data->>'note'), 600), 'pending',
      v_images, v_video, v_desc, v_addr, v_lat, v_lng) returning * into l;
    perform private.sem_notify_admins('moderation_new', 'Yangi ortiqcha material e’loni', left(l.name, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'surplus_pending', 'E’loningiz moderatsiyada', left(l.name, 60) || ' · admin tasdiqlagach hamma ko‘radi.', '/ortiqcha-material/elonlarim', null);
  else
    select * into l from public.surplus_listings where id = p_id and owner_id = p_user for update;
    if l.id is null then raise exception 'req_notfound'; end if;
    update public.surplus_listings set name = left(btrim(p_data->>'name'), 100), brand = left(btrim(p_data->>'brand'), 60), category = p_data->>'category', price = v_price, new_price = v_new,
      pkg = p_data->>'pkg', expiry_months = v_exp, city = left(btrim(p_data->>'city'), 60), district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), phone = v_phone,
      telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), image = nullif(btrim(coalesce(p_data->>'image', '')), ''), note = left(btrim(p_data->>'note'), 600),
      images = v_images, video = v_video, description = v_desc, address = v_addr, lat = v_lat, lng = v_lng,
      status = case when status = 'rejected' then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end, updated_at = now()
      where id = l.id returning * into l;
    if l.status = 'pending' then perform private.sem_notify_admins('moderation_new', 'E’lon yangilandi', left(l.name, 60) || ' · moderatsiya kutmoqda', '/admin/moderatsiya'); end if;
  end if;
  return private.surplus_json(l, p_user);
end $$;

revoke all on function public.sh_surplus_get(text, uuid, uuid) from public;
grant execute on function public.sh_surplus_get(text, uuid, uuid) to anon, authenticated, service_role;

-- ════════════════════════════════════════
-- 20261019a_unpaid_orders_and_crm.sql
-- ════════════════════════════════════════
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

-- ════════════════════════════════════════
-- 20261019b_hot_indexes.sql
-- ════════════════════════════════════════
-- Hot-query indexes for the empty-project bootstrap.
-- Most of these already exist in earlier migrations; IF NOT EXISTS keeps a second run clean.

create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders (shop_id, created_at desc) where shop_id is not null;

create index if not exists products_store_idx on public.products (store_id);
create index if not exists products_category_created_idx on public.products (category, created_at desc);
create index if not exists products_created_idx on public.products (created_at desc);

create index if not exists community_posts_created_idx on public.community_posts (created_at desc);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);
create index if not exists community_likes_post_idx on public.community_likes (post_id);

create index if not exists crm_records_doctor_idx on public.crm_records (doctor_id, kind, updated_at desc);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;

create index if not exists surplus_status_idx on public.surplus_listings (status, created_at desc);
create index if not exists masters_status_idx on public.masters (status, created_at desc);
create index if not exists jobs_status_idx on public.jobs (status, created_at desc);
create index if not exists labs_status_idx on public.labs (status, created_at desc);

-- Session and login lookups (there is no sessions table: the cookie is an HMAC, and
-- sh_session_ping / OTP / Telegram link look these columns up).
create unique index if not exists profiles_phone_unique on public.profiles (phone) where phone is not null and phone <> '';
create index if not exists profiles_email_login_idx on public.profiles (lower(email)) where email is not null and email <> '';
create index if not exists profiles_provider_uid_idx on public.profiles (provider, provider_uid);
create index if not exists otp_codes_phone_idx on public.otp_codes (phone, created_at desc);
create index if not exists telegram_link_tokens_user_idx on public.telegram_link_tokens (user_id);

-- ════════════════════════════════════════
-- STOMAHUB_DB_SECRET hash (psql variable, not a literal secret)
-- ════════════════════════════════════════
insert into private.app_config (key, value)
values ('server_secret_sha256', encode(extensions.digest(:'db_secret', 'sha256'), 'hex'))
on conflict (key) do update set value = excluded.value;

select set_config('stomahub.bootstrap_secret', '', false);
