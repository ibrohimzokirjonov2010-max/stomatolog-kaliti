-- StomaHub: real profiles + community (server-gated access; see README trust model)
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.app_config (
  key text primary key,
  value text not null
);

create table if not exists private.upload_tickets (
  path text primary key,
  user_id uuid not null,
  expires_at timestamptz not null
);

create or replace function private.assert_secret(p_secret text)
returns void language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  select value into v from private.app_config where key = 'server_secret_sha256';
  if v is null or p_secret is null
     or encode(extensions.digest(p_secret, 'sha256'), 'hex') <> v then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

-- ───────────── tables ─────────────
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('phone','google','telegram')),
  provider_uid text not null,
  password_hash text,
  full_name text not null check (char_length(full_name) between 1 and 120),
  phone text,
  email text,
  telegram_username text,
  clinic text,
  city text,
  specialty text,
  bio text check (bio is null or char_length(bio) <= 1000),
  avatar_url text,
  role text not null default 'doctor' check (role in ('doctor','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_uid)
);
create unique index if not exists profiles_phone_unique on public.profiles (phone) where phone is not null and phone <> '';

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'case' check (kind in ('case','savol','yangilik')),
  body text not null check (char_length(body) between 1 and 5000),
  tags text[] not null default '{}',
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists community_posts_created_idx on public.community_posts (created_at desc);

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

-- RLS on, no policies: anon/authenticated cannot touch these tables directly.
alter table public.profiles enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_comments enable row level security;
revoke all on public.profiles, public.community_posts, public.community_likes, public.community_comments from anon, authenticated;

-- ───────────── helpers ─────────────
create or replace function private.profile_json(p public.profiles)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', p.id, 'provider', p.provider, 'fullName', p.full_name, 'phone', coalesce(p.phone,''),
    'email', p.email, 'telegramUsername', p.telegram_username, 'clinic', p.clinic, 'city', p.city,
    'specialty', p.specialty, 'bio', p.bio, 'avatarUrl', p.avatar_url, 'role', p.role,
    'createdAt', p.created_at, 'updatedAt', p.updated_at)
$$;

create or replace function private.post_json(p_post_id uuid, p_viewer uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', cp.id, 'kind', cp.kind, 'body', cp.body, 'tags', to_jsonb(cp.tags), 'images', to_jsonb(cp.images),
    'createdAt', cp.created_at,
    'author', jsonb_build_object('id', a.id, 'fullName', a.full_name, 'specialty', a.specialty,
                                 'city', a.city, 'avatarUrl', a.avatar_url),
    'likeCount', (select count(*) from public.community_likes l where l.post_id = cp.id),
    'likedByMe', coalesce((select true from public.community_likes l where l.post_id = cp.id and l.user_id = p_viewer), false),
    'comments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'body', c.body, 'createdAt', c.created_at,
        'author', jsonb_build_object('id', ca.id, 'fullName', ca.full_name, 'avatarUrl', ca.avatar_url))
        order by c.created_at)
      from public.community_comments c join public.profiles ca on ca.id = c.author_id
      where c.post_id = cp.id), '[]'::jsonb)
  )
  from public.community_posts cp join public.profiles a on a.id = cp.author_id
  where cp.id = p_post_id
$$;

-- ───────────── auth / profile RPCs (server-only, secret-gated) ─────────────
create or replace function public.sh_upsert_social(p_secret text, p_provider text, p_uid text, p_full_name text,
  p_email text, p_telegram_username text, p_avatar_url text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  insert into public.profiles (provider, provider_uid, full_name, email, telegram_username, avatar_url)
  values (p_provider, p_uid, left(p_full_name, 120), p_email, p_telegram_username, p_avatar_url)
  on conflict (provider, provider_uid) do update set
    email = coalesce(public.profiles.email, excluded.email),
    telegram_username = coalesce(excluded.telegram_username, public.profiles.telegram_username),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url)
  returning * into r;
  return private.profile_json(r);
end $$;

create or replace function public.sh_register_phone(p_secret text, p_full_name text, p_phone text, p_password_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  if exists (select 1 from public.profiles where phone = p_phone) then
    return jsonb_build_object('error', 'exists');
  end if;
  insert into public.profiles (provider, provider_uid, full_name, phone, password_hash)
  values ('phone', p_phone, left(p_full_name, 120), p_phone, p_password_hash)
  returning * into r;
  return private.profile_json(r);
end $$;

create or replace function public.sh_phone_credentials(p_secret text, p_phone text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where phone = p_phone and password_hash is not null limit 1;
  if r.id is null then return null; end if;
  return jsonb_build_object('passwordHash', r.password_hash, 'profile', private.profile_json(r));
end $$;

create or replace function public.sh_get_profile(p_secret text, p_user uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  perform private.assert_secret(p_secret);
  select * into r from public.profiles where id = p_user;
  if r.id is null then return null; end if;
  return private.profile_json(r);
end $$;

create or replace function public.sh_update_profile(p_secret text, p_user uuid, p_patch jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.profiles; v_phone text;
begin
  perform private.assert_secret(p_secret);
  v_phone := nullif(p_patch->>'phone', '');
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
  if r.id is null then return jsonb_build_object('error', 'not_found'); end if;
  return private.profile_json(r);
end $$;

-- ───────────── community RPCs ─────────────
create or replace function public.sh_community_feed(p_secret text, p_viewer uuid, p_limit int default 30, p_before timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((
    select jsonb_agg(private.post_json(x.id, p_viewer) order by x.created_at desc)
    from (select id, created_at from public.community_posts
          where p_before is null or created_at < p_before
          order by created_at desc limit least(greatest(p_limit, 1), 100)) x
  ), '[]'::jsonb);
end $$;

create or replace function public.sh_community_post(p_secret text, p_viewer uuid, p_post uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return private.post_json(p_post, p_viewer);
end $$;

create or replace function public.sh_community_create_post(p_secret text, p_user uuid, p_kind text, p_body text, p_tags text[], p_images text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.assert_secret(p_secret);
  insert into public.community_posts (author_id, kind, body, tags, images)
  values (p_user, p_kind, p_body, coalesce(p_tags, '{}'), coalesce(p_images, '{}'))
  returning id into v_id;
  return private.post_json(v_id, p_user);
end $$;

create or replace function public.sh_community_delete_post(p_secret text, p_user uuid, p_post uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  delete from public.community_posts cp
  where cp.id = p_post
    and (cp.author_id = p_user or exists (select 1 from public.profiles p where p.id = p_user and p.role = 'admin'));
  get diagnostics n = row_count;
  return n > 0;
end $$;

create or replace function public.sh_community_toggle_like(p_secret text, p_user uuid, p_post uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  if exists (select 1 from public.community_likes where post_id = p_post and user_id = p_user) then
    delete from public.community_likes where post_id = p_post and user_id = p_user;
  else
    insert into public.community_likes (post_id, user_id) values (p_post, p_user);
  end if;
  return private.post_json(p_post, p_user);
end $$;

create or replace function public.sh_community_add_comment(p_secret text, p_user uuid, p_post uuid, p_body text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  insert into public.community_comments (post_id, author_id, body) values (p_post, p_user, p_body);
  return private.post_json(p_post, p_user);
end $$;

create or replace function public.sh_community_delete_comment(p_secret text, p_user uuid, p_comment uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_post uuid;
begin
  perform private.assert_secret(p_secret);
  delete from public.community_comments c
  where c.id = p_comment
    and (c.author_id = p_user or exists (select 1 from public.profiles p where p.id = p_user and p.role = 'admin'))
  returning c.post_id into v_post;
  if v_post is null then return null; end if;
  return private.post_json(v_post, p_user);
end $$;

-- ───────────── storage: public bucket, uploads only via server-issued tickets ─────────────
create or replace function public.sh_create_upload_ticket(p_secret text, p_user uuid, p_path text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  delete from private.upload_tickets where expires_at < now();
  insert into private.upload_tickets (path, user_id, expires_at) values (p_path, p_user, now() + interval '15 minutes');
  return true;
end $$;

create or replace function public.sh_can_upload(p_name text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.upload_tickets t where t.path = p_name and t.expires_at > now())
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community', 'community', true, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community ticket insert" on storage.objects;
create policy "community ticket insert" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'community' and public.sh_can_upload(name));
drop policy if exists "community public read" on storage.objects;
create policy "community public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'community');

-- lock down function execution: only these entry points are callable, all secret-gated except sh_can_upload
revoke all on all functions in schema private from public, anon, authenticated;
revoke execute on function public.sh_upsert_social, public.sh_register_phone, public.sh_phone_credentials,
  public.sh_get_profile, public.sh_update_profile, public.sh_community_feed, public.sh_community_post,
  public.sh_community_create_post(text, uuid, text, text, text[], text[]), public.sh_community_delete_post, public.sh_community_toggle_like,
  public.sh_community_add_comment, public.sh_community_delete_comment, public.sh_create_upload_ticket,
  public.sh_can_upload from public;
grant execute on function public.sh_upsert_social, public.sh_register_phone, public.sh_phone_credentials,
  public.sh_get_profile, public.sh_update_profile, public.sh_community_feed, public.sh_community_post,
  public.sh_community_create_post(text, uuid, text, text, text[], text[]), public.sh_community_delete_post, public.sh_community_toggle_like,
  public.sh_community_add_comment, public.sh_community_delete_comment, public.sh_create_upload_ticket,
  public.sh_can_upload to anon, authenticated;
