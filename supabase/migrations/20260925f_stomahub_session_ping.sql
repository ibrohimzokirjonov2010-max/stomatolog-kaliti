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
