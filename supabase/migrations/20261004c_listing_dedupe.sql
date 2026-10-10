-- Ikki marta yuborish himoyasi: bir xil vakansiya / ortiqcha material e'lonini qayta yaratib bo'lmaydi.
do $mig$
declare d text;
begin
  d := pg_get_functiondef('public.sh_job_save'::regproc);
  if position('listing_duplicate' in d) = 0 then
    d := replace(d, E'then raise exception ''lim_reached''; end if;\n    insert into public.jobs',
      E'then raise exception ''lim_reached''; end if;\n    if exists (select 1 from public.jobs where owner_id = p_user and status in (''pending'', ''published'', ''hidden'') and lower(btrim(title)) = lower(btrim(p_data->>''title'')) and lower(btrim(clinic)) = lower(btrim(p_data->>''clinic'')) and lower(btrim(city)) = lower(btrim(p_data->>''city''))) then raise exception ''listing_duplicate''; end if;\n    insert into public.jobs');
    execute d;
  end if;
  d := pg_get_functiondef('public.sh_surplus_save'::regproc);
  if position('listing_duplicate' in d) = 0 then
    d := replace(d, E'then raise exception ''lim_reached''; end if;\n    insert into public.surplus_listings',
      E'then raise exception ''lim_reached''; end if;\n    if exists (select 1 from public.surplus_listings where owner_id = p_user and status in (''pending'', ''published'', ''hidden'') and lower(btrim(name)) = lower(btrim(p_data->>''name'')) and lower(btrim(brand)) = lower(btrim(p_data->>''brand'')) and price = v_price) then raise exception ''listing_duplicate''; end if;\n    insert into public.surplus_listings');
    execute d;
  end if;
end $mig$;
