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
