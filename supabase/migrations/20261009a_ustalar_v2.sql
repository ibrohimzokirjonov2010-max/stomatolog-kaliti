-- Ustalar v2 (mobile redesign): master work photos + district + online flag; richer service requests
-- (multi-service, time range, photo/video media, extra info). Backward compatible with the v1 single-service flow.

alter table public.masters add column if not exists works text[] not null default '{}';
alter table public.masters add column if not exists district text;

alter table public.master_requests add column if not exists services text[] not null default '{}';
alter table public.master_requests add column if not exists time_range text;
alter table public.master_requests add column if not exists media text[] not null default '{}';
alter table public.master_requests add column if not exists extra text;

-- Request photos/videos (up to 10 MB each) go to the same ticketed community bucket.
update storage.buckets
   set file_size_limit = greatest(coalesce(file_size_limit, 0), 10485760),
       allowed_mime_types = (select array_agg(distinct x) from unnest(coalesce(allowed_mime_types, '{}') || array['video/mp4', 'video/quicktime', 'video/webm']) x)
 where id = 'community';

create or replace function private.master_json(m public.masters, p_full boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', m.id, 'name', m.name, 'kind', m.kind, 'title', m.title, 'services', to_jsonb(m.services), 'city', m.city,
    'district', m.district, 'years', m.years, 'description', m.description, 'photo', m.photo, 'works', to_jsonb(coalesce(m.works, '{}')),
    'status', m.status, 'createdAt', m.created_at,
    'online', coalesce((select p.last_seen_at > now() - interval '5 minutes' from public.profiles p where p.id = m.owner_id), false),
    'jobs', (select count(*) from public.master_requests r where r.master_id = m.id and r.status = 'bajarildi'))
  || case when p_full then jsonb_build_object('phone', private.phone_fmt(m.phone), 'telegram', m.telegram, 'rejectReason', m.reject_reason) else '{}'::jsonb end
$$;

create or replace function public.sh_master_save(p_secret text, p_user uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters; v_phone text := private.phone9(p_data->>'phone'); v_services text[]; v_works text[];
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select coalesce(array_agg(x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x;
  select coalesce(array_agg(left(x, 400)), '{}') into v_works from (select x from jsonb_array_elements_text(coalesce(p_data->'works', '[]'::jsonb)) x where btrim(x) <> '' limit 12) w;
  if char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(btrim(coalesce(p_data->>'title', ''))) < 2
     or cardinality(v_services) < 1 or char_length(v_phone) <> 9 or char_length(btrim(coalesce(p_data->>'city', ''))) < 2 then
    raise exception 'val_invalid';
  end if;
  select * into m from public.masters where owner_id = p_user for update;
  if m.id is null then
    insert into public.masters (owner_id, kind, name, title, services, city, district, years, description, photo, works, phone, telegram, status)
    values (p_user, case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, left(btrim(p_data->>'name'), 80), left(btrim(p_data->>'title'), 80),
      v_services, left(btrim(p_data->>'city'), 60), nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), coalesce((p_data->>'years')::int, 0),
      nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), nullif(btrim(coalesce(p_data->>'photo', '')), ''), v_works, v_phone,
      nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''), 'pending')
    returning * into m;
    perform private.sem_notify_admins('moderation_new', 'Yangi usta profili', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    perform private.notify(p_user, 'master_pending', 'Usta profilingiz moderatsiyada', 'Admin tasdiqlagach hamma ko‘radi.', '/ustalar/mening', null);
  else
    update public.masters set kind = case when p_data->>'kind' = 'kompaniya' then 'kompaniya' else 'usta' end, name = left(btrim(p_data->>'name'), 80),
      title = left(btrim(p_data->>'title'), 80), services = v_services, city = left(btrim(p_data->>'city'), 60),
      district = nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''), years = coalesce((p_data->>'years')::int, 0),
      description = nullif(left(btrim(coalesce(p_data->>'description', '')), 600), ''), photo = nullif(btrim(coalesce(p_data->>'photo', '')), ''),
      works = v_works, phone = v_phone, telegram = nullif(left(btrim(coalesce(p_data->>'telegram', '')), 80), ''),
      status = case when status in ('rejected') then 'pending' else status end, reject_reason = case when status = 'rejected' then null else reject_reason end,
      updated_at = now() where id = m.id returning * into m;
    if m.status = 'pending' then
      perform private.sem_notify_admins('moderation_new', 'Usta profili yangilandi', left(m.name, 80) || ' · moderatsiya kutmoqda', '/admin/moderatsiya');
    end if;
  end if;
  return private.master_json(m, true);
end $$;

create or replace function public.sh_master_req_create(p_secret text, p_user uuid, p_master uuid, p_data jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.masters; r public.master_requests; v_phone text := private.phone9(p_data->>'phone'); v_when text := coalesce(p_data->>'when', 'bugun');
  v_date date; v_services text[]; v_media text[]; v_service text := p_data->>'service';
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into m from public.masters where id = p_master and status = 'published';
  if m.id is null then raise exception 'req_notfound'; end if;
  if m.owner_id = p_user then raise exception 'req_self'; end if;
  select coalesce(array_agg(distinct x), '{}') into v_services from jsonb_array_elements_text(coalesce(p_data->'services', '[]'::jsonb)) x
    where x in ('kreslo','rentgen','profilaktika','ehtiyot','kompressor','sterilizatsiya','skaner','boshqa');
  select coalesce(array_agg(left(x, 400)), '{}') into v_media from (select x from jsonb_array_elements_text(coalesce(p_data->'media', '[]'::jsonb)) x where btrim(x) <> '' limit 5) q;
  if v_service is null or v_service not in ('rentgen','kreslo','ornatish','tamirlash','mebel') then
    v_service := case when 'kreslo' = any(v_services) then 'kreslo' when 'rentgen' = any(v_services) then 'rentgen'
                      when 'skaner' = any(v_services) then 'ornatish' else 'tamirlash' end;
  end if;
  if char_length(btrim(coalesce(p_data->>'clinic', ''))) < 2 or char_length(btrim(coalesce(p_data->>'name', ''))) < 2 or char_length(v_phone) <> 9
     or v_when not in ('bugun','ertaga','sana') then
    raise exception 'val_invalid';
  end if;
  if v_when = 'sana' then
    begin v_date := (p_data->>'date')::date; exception when others then raise exception 'val_invalid'; end;
    if v_date is null or v_date < current_date then raise exception 'val_invalid'; end if;
  end if;
  if (select count(*) from public.master_requests where requester_id = p_user and created_at > now() - interval '1 hour') >= 8 then raise exception 'req_rate'; end if;
  if exists (select 1 from public.master_requests where master_id = m.id and requester_id = p_user and service = v_service and status in ('yuborildi', 'jarayonda')) then
    raise exception 'req_duplicate';
  end if;
  insert into public.master_requests (master_id, requester_id, service, services, clinic, district, address, name, phone, note, when_need, need_date, time_range, media, extra)
  values (m.id, p_user, v_service, v_services, left(btrim(p_data->>'clinic'), 120), nullif(left(btrim(coalesce(p_data->>'district', '')), 60), ''),
    nullif(left(btrim(coalesce(p_data->>'address', '')), 200), ''), left(btrim(p_data->>'name'), 80), v_phone,
    nullif(left(btrim(coalesce(p_data->>'note', '')), 500), ''), v_when, v_date, nullif(left(btrim(coalesce(p_data->>'timeRange', '')), 40), ''),
    v_media, nullif(left(btrim(coalesce(p_data->>'extra', '')), 500), '')) returning * into r;
  perform private.notify(m.owner_id, 'master_request', 'Yangi xizmat so‘rovi', left(r.clinic, 80) || ' · ' || r.name, '/ustalar/sorovlarim?tab=kelgan', null);
  perform private.notify(p_user, 'master_request_sent', 'So‘rov yuborildi', left(m.name, 80) || ' ga so‘rovingiz yuborildi. Javobni kuting.', '/ustalar/sorovlarim', null);
  return jsonb_build_object('id', r.id, 'status', r.status);
end $$;

create or replace function private.master_req_json(r public.master_requests, m public.masters, p_for_owner boolean) returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('id', r.id, 'masterId', r.master_id, 'masterName', m.name, 'service', r.service, 'services', to_jsonb(coalesce(r.services, '{}')),
    'clinic', r.clinic, 'district', r.district, 'address', r.address, 'name', r.name, 'phone', private.phone_fmt(r.phone), 'note', r.note,
    'when', r.when_need, 'date', r.need_date, 'timeRange', r.time_range, 'media', to_jsonb(coalesce(r.media, '{}')), 'extra', r.extra,
    'status', r.status, 'createdAt', r.created_at, 'updatedAt', r.updated_at)
  || case when not p_for_owner and r.status in ('jarayonda', 'bajarildi') then jsonb_build_object('masterPhone', private.phone_fmt(m.phone), 'masterTelegram', m.telegram) else '{}'::jsonb end
$$;

revoke execute on function private.master_json, private.master_req_json from public, anon, authenticated;
