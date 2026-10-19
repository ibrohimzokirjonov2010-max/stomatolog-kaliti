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
