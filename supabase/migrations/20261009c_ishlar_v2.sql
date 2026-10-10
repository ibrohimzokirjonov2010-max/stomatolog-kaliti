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
alter table public.jobs add constraint jobs_category_check check (category is null or category in ('klinika', 'texnik', 'shifokor'));
alter table public.jobs add constraint jobs_photos_check check (cardinality(photos) <= 8);
alter table public.jobs add constraint jobs_video_check check (video is null or char_length(video) <= 400);
alter table public.jobs add constraint jobs_logo_check check (logo is null or char_length(logo) <= 400);
alter table public.jobs add constraint jobs_district_check check (district is null or char_length(district) <= 60);
alter table public.jobs add constraint jobs_address_check check (address is null or char_length(address) <= 200);
alter table public.jobs add constraint jobs_work_days_check check (work_days is null or char_length(work_days) <= 60);
alter table public.jobs add constraint jobs_work_hours_check check (work_hours is null or char_length(work_hours) <= 40);
alter table public.jobs add constraint jobs_benefits_check check (cardinality(benefits) <= 6 and benefits <@ array['rasmiy','oqim','malaka','jamoa','sharoit','avtoturargoh','tushlik','bonus']::text[]);
alter table public.jobs add constraint jobs_requirements_check check (cardinality(requirements) <= 8);
alter table public.jobs add constraint jobs_employer_about_check check (employer_about is null or char_length(employer_about) <= 160);
alter table public.jobs add constraint jobs_staff_count_check check (staff_count is null or staff_count between 1 and 5000);
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
