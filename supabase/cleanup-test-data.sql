-- Removes E2E test data. Edit the id list; never includes real users.
with t(id) as (values ('e16ef4cf-249e-4f6a-a9a9-5af63bbc3cca'::uuid) /*, ('e0ea1440-48dc-473c-8fe7-306e2844ddac'::uuid) */)
select 1;
