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
