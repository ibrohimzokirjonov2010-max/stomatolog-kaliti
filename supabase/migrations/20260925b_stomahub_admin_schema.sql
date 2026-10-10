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
