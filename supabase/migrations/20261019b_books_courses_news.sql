-- Books, courses, and news. Paste into the Supabase SQL editor on a database that already ran bootstrap.sql.
-- Idempotent. No psql variables. Forma and jihozlar stay on public.products (category + attrs).

-- ───────────── tables ─────────────
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  author text not null check (char_length(author) between 1 and 160),
  cover text,
  description text not null default '',
  price bigint not null default 0 check (price >= 0),
  pdf_url text,
  chapters jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  chapter int not null default 0 check (chapter >= 0),
  percent int not null default 0 check (percent between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  teacher text not null check (char_length(teacher) between 1 and 160),
  cover text,
  description text not null default '',
  price bigint not null default 0 check (price >= 0),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  position int not null default 0,
  title text not null check (char_length(title) between 1 and 200),
  video_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.course_enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table if not exists public.course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  done boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  cover text,
  body text not null default '',
  tags text[] not null default '{}',
  published_at timestamptz not null default now(),
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists books_created_idx on public.books (created_at desc);
create index if not exists books_published_idx on public.books (published, created_at desc);
create index if not exists book_progress_user_idx on public.book_progress (user_id, updated_at desc);
create index if not exists courses_created_idx on public.courses (created_at desc);
create index if not exists courses_published_idx on public.courses (published, created_at desc);
create index if not exists course_lessons_course_idx on public.course_lessons (course_id, position);
create index if not exists course_enrollments_user_idx on public.course_enrollments (user_id, enrolled_at desc);
create index if not exists course_progress_user_idx on public.course_progress (user_id, updated_at desc);
create index if not exists news_published_idx on public.news_posts (published, published_at desc);
create index if not exists news_tags_idx on public.news_posts using gin (tags);

alter table public.books enable row level security;
alter table public.book_progress enable row level security;
alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.course_progress enable row level security;
alter table public.news_posts enable row level security;

revoke all on table public.books, public.book_progress, public.courses, public.course_lessons, public.course_enrollments, public.course_progress, public.news_posts from public, anon, authenticated;

-- ───────────── library files (covers, book PDF, lesson video) via the existing ticket ─────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library', 'library', true, 52428800, array['image/jpeg','image/png','image/webp','application/pdf','video/mp4','video/webm','video/quicktime'])
on conflict (id) do update set public = true, file_size_limit = 52428800, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "library ticket insert" on storage.objects;
create policy "library ticket insert" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'library' and public.sh_can_upload(name));
drop policy if exists "library public read" on storage.objects;
create policy "library public read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'library');

-- ───────────── helpers ─────────────
create or replace function private.library_admin(p_admin uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.profiles;
begin
  select * into r from public.profiles where id = p_admin and is_admin and blocked_at is null and admin_role in ('owner', 'admin', 'moderator');
  if r.id is null then raise exception 'forbidden' using errcode = 'P0001'; end if;
end $$;
revoke all on function private.library_admin(uuid) from public, anon, authenticated;

create or replace function private.book_json(b public.books, p_user uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', b.id, 'title', b.title, 'author', b.author, 'cover', b.cover, 'description', b.description,
    'price', b.price, 'pdfUrl', b.pdf_url, 'chapters', b.chapters, 'published', b.published,
    'createdAt', b.created_at,
    'progress', (select jsonb_build_object('chapter', bp.chapter, 'percent', bp.percent)
                 from public.book_progress bp where p_user is not null and bp.user_id = p_user and bp.book_id = b.id)))
$$;
revoke all on function private.book_json(public.books, uuid) from public, anon, authenticated;

create or replace function private.course_json(c public.courses, p_user uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', c.id, 'title', c.title, 'teacher', c.teacher, 'cover', c.cover, 'description', c.description,
    'price', c.price, 'published', c.published, 'createdAt', c.created_at,
    'lessons', coalesce((select jsonb_agg(jsonb_build_object(
        'id', l.id, 'title', l.title, 'videoUrl', l.video_url, 'position', l.position,
        'done', case when p_user is null then false else exists (select 1 from public.course_progress cp where cp.user_id = p_user and cp.lesson_id = l.id and cp.done) end
      ) order by l.position, l.created_at)
      from public.course_lessons l where l.course_id = c.id), '[]'::jsonb),
    'enrolled', p_user is not null and exists (select 1 from public.course_enrollments e where e.user_id = p_user and e.course_id = c.id),
    'progress', case when p_user is null then 0 else coalesce((
      select round(100.0 * count(*) filter (where cp.done) / nullif(count(*), 0))::int
      from public.course_lessons l
      left join public.course_progress cp on cp.lesson_id = l.id and cp.user_id = p_user
      where l.course_id = c.id), 0) end))
$$;
revoke all on function private.course_json(public.courses, uuid) from public, anon, authenticated;

create or replace function private.news_json(n public.news_posts)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', n.id, 'title', n.title, 'cover', n.cover, 'body', n.body, 'tags', to_jsonb(n.tags),
    'publishedAt', n.published_at, 'published', n.published, 'createdAt', n.created_at))
$$;
revoke all on function private.news_json(public.news_posts) from public, anon, authenticated;

-- ───────────── public reads ─────────────
create or replace function public.sh_books_list(p_secret text, p_user uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.book_json(b, p_user) order by b.created_at desc)
                   from public.books b where b.published), '[]'::jsonb);
end $$;

create or replace function public.sh_book_get(p_secret text, p_id uuid, p_user uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.books;
begin
  perform private.assert_secret(p_secret);
  select * into b from public.books where id = p_id and published;
  if b.id is null then return null; end if;
  return private.book_json(b, p_user);
end $$;

create or replace function public.sh_book_progress(p_secret text, p_user uuid, p_id uuid, p_chapter int, p_percent int)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.books;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into b from public.books where id = p_id and published;
  if b.id is null then return jsonb_build_object('error', 'not_found'); end if;
  insert into public.book_progress (user_id, book_id, chapter, percent)
  values (p_user, p_id, greatest(p_chapter, 0), least(greatest(p_percent, 0), 100))
  on conflict (user_id, book_id) do update set chapter = excluded.chapter, percent = excluded.percent, updated_at = now();
  return private.book_json(b, p_user);
end $$;

create or replace function public.sh_courses_list(p_secret text, p_user uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.course_json(c, p_user) order by c.created_at desc)
                   from public.courses c where c.published), '[]'::jsonb);
end $$;

create or replace function public.sh_course_get(p_secret text, p_id uuid, p_user uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.courses;
begin
  perform private.assert_secret(p_secret);
  select * into c from public.courses where id = p_id and published;
  if c.id is null then return null; end if;
  return private.course_json(c, p_user);
end $$;

create or replace function public.sh_course_enroll(p_secret text, p_user uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.courses;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into c from public.courses where id = p_id and published;
  if c.id is null then return jsonb_build_object('error', 'not_found'); end if;
  insert into public.course_enrollments (user_id, course_id) values (p_user, p_id)
  on conflict (user_id, course_id) do nothing;
  return private.course_json(c, p_user);
end $$;

create or replace function public.sh_course_progress(p_secret text, p_user uuid, p_lesson uuid, p_done boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare l public.course_lessons; c public.courses;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into l from public.course_lessons where id = p_lesson;
  if l.id is null then return jsonb_build_object('error', 'not_found'); end if;
  select * into c from public.courses where id = l.course_id and published;
  if c.id is null then return jsonb_build_object('error', 'not_found'); end if;
  insert into public.course_enrollments (user_id, course_id) values (p_user, c.id)
  on conflict (user_id, course_id) do nothing;
  insert into public.course_progress (user_id, lesson_id, done)
  values (p_user, p_lesson, p_done)
  on conflict (user_id, lesson_id) do update set done = excluded.done, updated_at = now();
  return private.course_json(c, p_user);
end $$;

create or replace function public.sh_news_list(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return coalesce((select jsonb_agg(private.news_json(n) order by n.published_at desc)
                   from public.news_posts n where n.published), '[]'::jsonb);
end $$;

create or replace function public.sh_news_get(p_secret text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n public.news_posts;
begin
  perform private.assert_secret(p_secret);
  select * into n from public.news_posts where id = p_id and published;
  if n.id is null then return null; end if;
  return private.news_json(n);
end $$;

create or replace function public.sh_product_public(p_secret text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.products; s public.stores;
begin
  perform private.assert_secret(p_secret);
  select * into p from public.products where id = p_id and active;
  if p.id is null then return null; end if;
  select * into s from public.stores where id = p.store_id and status = 'active';
  if s.id is null then return null; end if;
  return private.product_json(p, s);
end $$;

-- ───────────── admin write ─────────────
create or replace function public.sh_admin_library(p_secret text, p_admin uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.library_admin(p_admin);
  return jsonb_build_object(
    'books', coalesce((select jsonb_agg(private.book_json(b, null) order by b.updated_at desc) from public.books b), '[]'::jsonb),
    'courses', coalesce((select jsonb_agg(private.course_json(c, null) order by c.updated_at desc) from public.courses c), '[]'::jsonb),
    'news', coalesce((select jsonb_agg(private.news_json(n) order by n.updated_at desc) from public.news_posts n), '[]'::jsonb));
end $$;

create or replace function public.sh_admin_book_save(p_secret text, p_admin uuid, p_row jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare b public.books; v_id uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.library_admin(p_admin);
  if nullif(p_row->>'title','') is null or nullif(p_row->>'author','') is null then
    return jsonb_build_object('error', 'invalid');
  end if;
  v_id := nullif(p_row->>'id','')::uuid;
  if v_id is null then v_id := gen_random_uuid(); end if;
  insert into public.books as t (id, title, author, cover, description, price, pdf_url, chapters, published)
  values (
    v_id,
    left(p_row->>'title', 200),
    left(p_row->>'author', 160),
    nullif(p_row->>'cover',''),
    coalesce(p_row->>'description',''),
    greatest(coalesce((p_row->>'price')::bigint, 0), 0),
    nullif(p_row->>'pdfUrl',''),
    case when jsonb_typeof(p_row->'chapters') = 'array' then p_row->'chapters' else '[]'::jsonb end,
    case when p_row ? 'published' then (p_row->>'published')::boolean else true end)
  on conflict (id) do update set
    title = excluded.title, author = excluded.author, cover = excluded.cover, description = excluded.description,
    price = excluded.price, pdf_url = excluded.pdf_url, chapters = excluded.chapters, published = excluded.published,
    updated_at = now()
  returning * into b;
  return private.book_json(b, null);
end $$;

create or replace function public.sh_admin_book_delete(p_secret text, p_admin uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.library_admin(p_admin);
  delete from public.books where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_admin_course_save(p_secret text, p_admin uuid, p_row jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c public.courses; v_id uuid; lesson jsonb; i int := 0;
begin
  perform private.assert_secret(p_secret);
  perform private.library_admin(p_admin);
  if nullif(p_row->>'title','') is null or nullif(p_row->>'teacher','') is null then
    return jsonb_build_object('error', 'invalid');
  end if;
  v_id := nullif(p_row->>'id','')::uuid;
  if v_id is null then v_id := gen_random_uuid(); end if;
  insert into public.courses as t (id, title, teacher, cover, description, price, published)
  values (
    v_id, left(p_row->>'title', 200), left(p_row->>'teacher', 160), nullif(p_row->>'cover',''),
    coalesce(p_row->>'description',''), greatest(coalesce((p_row->>'price')::bigint, 0), 0),
    case when p_row ? 'published' then (p_row->>'published')::boolean else true end)
  on conflict (id) do update set
    title = excluded.title, teacher = excluded.teacher, cover = excluded.cover, description = excluded.description,
    price = excluded.price, published = excluded.published, updated_at = now()
  returning * into c;
  delete from public.course_lessons where course_id = c.id;
  if jsonb_typeof(p_row->'lessons') = 'array' then
    for lesson in select * from jsonb_array_elements(p_row->'lessons') loop
      if nullif(lesson->>'title','') is null then continue; end if;
      insert into public.course_lessons (course_id, position, title, video_url)
      values (c.id, i, left(lesson->>'title', 200), nullif(lesson->>'videoUrl',''));
      i := i + 1;
    end loop;
  end if;
  return private.course_json(c, null);
end $$;

create or replace function public.sh_admin_course_delete(p_secret text, p_admin uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.library_admin(p_admin);
  delete from public.courses where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.sh_admin_news_save(p_secret text, p_admin uuid, p_row jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n public.news_posts; v_id uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.library_admin(p_admin);
  if nullif(p_row->>'title','') is null then return jsonb_build_object('error', 'invalid'); end if;
  v_id := nullif(p_row->>'id','')::uuid;
  if v_id is null then v_id := gen_random_uuid(); end if;
  insert into public.news_posts as t (id, title, cover, body, tags, published_at, published)
  values (
    v_id, left(p_row->>'title', 200), nullif(p_row->>'cover',''), coalesce(p_row->>'body',''),
    case when jsonb_typeof(p_row->'tags') = 'array' then array(select left(jsonb_array_elements_text(p_row->'tags'), 40)) else '{}'::text[] end,
    coalesce(nullif(p_row->>'publishedAt','')::timestamptz, now()),
    case when p_row ? 'published' then (p_row->>'published')::boolean else true end)
  on conflict (id) do update set
    title = excluded.title, cover = excluded.cover, body = excluded.body, tags = excluded.tags,
    published_at = excluded.published_at, published = excluded.published, updated_at = now()
  returning * into n;
  return private.news_json(n);
end $$;

create or replace function public.sh_admin_news_delete(p_secret text, p_admin uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  perform private.library_admin(p_admin);
  delete from public.news_posts where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function
  public.sh_books_list(text, uuid), public.sh_book_get(text, uuid, uuid), public.sh_book_progress(text, uuid, uuid, int, int),
  public.sh_courses_list(text, uuid), public.sh_course_get(text, uuid, uuid), public.sh_course_enroll(text, uuid, uuid),
  public.sh_course_progress(text, uuid, uuid, boolean), public.sh_news_list(text), public.sh_news_get(text, uuid),
  public.sh_product_public(text, uuid), public.sh_admin_library(text, uuid),
  public.sh_admin_book_save(text, uuid, jsonb), public.sh_admin_book_delete(text, uuid, uuid),
  public.sh_admin_course_save(text, uuid, jsonb), public.sh_admin_course_delete(text, uuid, uuid),
  public.sh_admin_news_save(text, uuid, jsonb), public.sh_admin_news_delete(text, uuid, uuid)
from public;
grant execute on function
  public.sh_books_list(text, uuid), public.sh_book_get(text, uuid, uuid), public.sh_book_progress(text, uuid, uuid, int, int),
  public.sh_courses_list(text, uuid), public.sh_course_get(text, uuid, uuid), public.sh_course_enroll(text, uuid, uuid),
  public.sh_course_progress(text, uuid, uuid, boolean), public.sh_news_list(text), public.sh_news_get(text, uuid),
  public.sh_product_public(text, uuid), public.sh_admin_library(text, uuid),
  public.sh_admin_book_save(text, uuid, jsonb), public.sh_admin_book_delete(text, uuid, uuid),
  public.sh_admin_course_save(text, uuid, jsonb), public.sh_admin_course_delete(text, uuid, uuid),
  public.sh_admin_news_save(text, uuid, jsonb), public.sh_admin_news_delete(text, uuid, uuid)
to anon, authenticated, service_role;

-- Any public table that is still open to the API roles gets RLS. Access stays on the security-definer RPCs.
do $rls$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
  loop
    execute format('alter table public.%I enable row level security', r.relname);
  end loop;
end
$rls$;
