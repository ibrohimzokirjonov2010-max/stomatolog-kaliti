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
