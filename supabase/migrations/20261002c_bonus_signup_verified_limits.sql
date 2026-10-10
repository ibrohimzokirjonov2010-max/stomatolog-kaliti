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
