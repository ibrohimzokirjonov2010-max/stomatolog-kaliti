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
