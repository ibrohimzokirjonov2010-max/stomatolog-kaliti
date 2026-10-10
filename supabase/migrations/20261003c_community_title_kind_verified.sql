-- Community v1 (mobile redesign): post title, 'maslahat' kind, author verified flag, member count.
alter table public.community_posts add column if not exists title text;
alter table public.community_posts drop constraint if exists community_posts_title_check;
alter table public.community_posts add constraint community_posts_title_check
  check (title is null or char_length(title) between 1 and 140);

alter table public.community_posts drop constraint if exists community_posts_kind_check;
alter table public.community_posts add constraint community_posts_kind_check
  check (kind in ('case','savol','yangilik','maslahat'));

-- post json: + title, + author.verified (real: phone confirmed through OTP)
create or replace function private.post_json(p_post_id uuid, p_viewer uuid)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'id', cp.id, 'kind', cp.kind, 'title', cp.title, 'body', cp.body, 'tags', to_jsonb(cp.tags), 'images', to_jsonb(cp.images),
    'createdAt', cp.created_at,
    'author', jsonb_build_object('id', a.id, 'fullName', a.full_name, 'specialty', a.specialty,
                                 'city', a.city, 'avatarUrl', a.avatar_url,
                                 'verified', a.phone_verified_at is not null),
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

-- create_post gets an optional title (old 6-arg signature replaced)
drop function if exists public.sh_community_create_post(text, uuid, text, text, text[], text[]);
create or replace function public.sh_community_create_post(p_secret text, p_user uuid, p_kind text, p_body text,
  p_tags text[], p_images text[], p_title text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  insert into public.community_posts (author_id, kind, title, body, tags, images)
  values (p_user, p_kind, nullif(left(btrim(coalesce(p_title, '')), 140), ''), p_body,
          coalesce(p_tags, '{}'), coalesce(p_images, '{}'))
  returning id into v_id;
  return private.post_json(v_id, p_user);
end $$;

-- real member count for the community header
create or replace function public.sh_community_stats(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object('members', (select count(*) from public.profiles where blocked_at is null));
end $$;

revoke execute on function public.sh_community_create_post(text, uuid, text, text, text[], text[], text) from public;
grant execute on function public.sh_community_create_post(text, uuid, text, text, text[], text[], text) to anon, authenticated;
revoke execute on function public.sh_community_stats(text) from public;
grant execute on function public.sh_community_stats(text) to anon, authenticated;
