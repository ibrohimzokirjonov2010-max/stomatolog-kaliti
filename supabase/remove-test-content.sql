-- Removes everything supabase/seed-test-content.sql added (ids starting with 5eed0000-, seminars 5eed-).
-- Deleting the test profiles also removes their stores, products, ustalar, labs, jobs, surplus listings
-- and community posts (on delete cascade). Real users' orders keep their rows; product links become null.

begin;
delete from public.course_lessons where id::text like '5eed0000-%';
delete from public.courses where id::text like '5eed0000-%';
delete from public.books where id::text like '5eed0000-%';
delete from public.news_posts where id::text like '5eed0000-%';
delete from public.channels where id::text like '5eed0000-%';
delete from public.seminars where id like '5eed-%';
delete from public.community_posts where id::text like '5eed0000-%';
delete from public.surplus_listings where id::text like '5eed0000-%';
delete from public.jobs where id::text like '5eed0000-%';
delete from public.labs where id::text like '5eed0000-%';
delete from public.masters where id::text like '5eed0000-%';
delete from public.products where id::text like '5eed0000-%';
delete from public.stores where id::text like '5eed0000-%';
delete from public.profiles where id::text like '5eed0000-%';
commit;
