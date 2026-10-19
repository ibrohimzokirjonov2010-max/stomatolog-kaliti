-- Local-only stand-in for a hosted Supabase project.
-- Do NOT run this against the real Supabase database. Hosted projects already have
-- these roles, the auth schema, and the storage schema.
-- Used to prove supabase/bootstrap.sql on empty Postgres:
--   psql -v ON_ERROR_STOP=1 -v db_secret=... -f supabase/local-supabase-stub.sql -f supabase/bootstrap.sql

\set ON_ERROR_STOP on

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists extensions;
create schema if not exists auth;
create schema if not exists storage;

create or replace function auth.uid() returns uuid
language sql stable as $$ select null::uuid $$;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text,
  name text,
  owner uuid,
  created_at timestamptz not null default now()
);

alter table storage.objects enable row level security;
alter table storage.buckets enable row level security;

grant usage on schema public, storage to anon, authenticated, service_role;
grant all on schema storage to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
