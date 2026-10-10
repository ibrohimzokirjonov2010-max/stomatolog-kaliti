-- Ustalar v2: allow the "konsultatsiya" master service.
alter table public.masters drop constraint if exists masters_services_check;
alter table public.masters add constraint masters_services_check check (
  cardinality(services) between 1 and 6
  and services <@ array['rentgen','kreslo','ornatish','tamirlash','mebel','servis','konsultatsiya']::text[]
);
