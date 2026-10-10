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
  public.sh_admin_bonus, public.sh_session_ping, public.sh_update_profile, public.sh_seller_order_update,
  public.sh_admin_dashboard, public.sh_admin_users from public;
grant execute on function public.sh_otp_create, public.sh_otp_set_delivery, public.sh_otp_delivery_report, public.sh_otp_attempt,
  public.sh_register_verified, public.sh_verify_phone, public.sh_reset_password, public.sh_my_bonus, public.sh_create_order,
  public.sh_admin_bonus, public.sh_session_ping, public.sh_update_profile, public.sh_seller_order_update,
  public.sh_admin_dashboard, public.sh_admin_users to anon, authenticated;
