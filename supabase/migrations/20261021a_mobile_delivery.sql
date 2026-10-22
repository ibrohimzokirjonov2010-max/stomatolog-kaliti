-- Mobile marketplace delivery date and honest product counts.
-- Apply once after 20261020e_form_p0.sql. Safe to re-run.
-- Does not move hosting. Does not invent promotion or review rows.
-- delivery_days stays null until a seller sets it, so the date stays hidden.

alter table public.stores
  add column if not exists delivery_days int,
  add column if not exists cutoff_time text,
  add column if not exists works_on_weekends boolean not null default false;

alter table public.stores drop constraint if exists stores_delivery_days_check;
alter table public.stores
  add constraint stores_delivery_days_check
  check (delivery_days is null or (delivery_days >= 0 and delivery_days <= 30));

alter table public.stores drop constraint if exists stores_cutoff_time_check;
alter table public.stores
  add constraint stores_cutoff_time_check
  check (cutoff_time is null or cutoff_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

create or replace function private.product_json(p public.products, s public.stores)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p.id, 'name', p.name, 'brand', p.brand, 'category', p.category, 'price', p.price,
    'oldPrice', p.old_price, 'discount', p.discount, 'rating', p.rating, 'reviews', p.reviews,
    'inStock', p.active and p.stock > 0, 'delivery', p.delivery,
    'image', coalesce(nullif(btrim(p.image), ''), p.images[1]),
    'description', p.description, 'stockQty', p.stock, 'shopId', s.id, 'shopName', s.name, 'shopSlug', s.slug,
    'shopLogo', nullif(btrim(s.logo), ''),
    'active', p.active, 'listedBySeller', true, 'featured', true,
    'kind', p.kind, 'sizes', to_jsonb(p.sizes), 'gender', p.gender, 'colors', to_jsonb(p.colors),
    'sku', p.sku, 'subcategory', p.subcategory, 'images', to_jsonb(p.images), 'attrs', p.attrs,
    'createdAt', p.created_at,
    'deliveryDays', s.delivery_days,
    'cutoffTime', nullif(btrim(s.cutoff_time), ''),
    'worksOnWeekends', s.works_on_weekends,
    'reviewCount', (select count(*)::int from public.reviews r where r.product_id = p.id),
    'reviewAvg', (select round(avg(r.rating)::numeric, 2) from public.reviews r where r.product_id = p.id),
    'orderCount', (
      select count(distinct oi.order_id)::int
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.product_id = p.id::text and o.status = 'yetkazildi'
    )))
$$;

-- Sold-out and inactive products still open. The list stays active-only.
create or replace function public.sh_product_public(p_secret text, p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare p public.products; s public.stores;
begin
  perform private.assert_secret(p_secret);
  select * into p from public.products where id = p_id;
  if p.id is null then return null; end if;
  select * into s from public.stores where id = p.store_id and status = 'active';
  if s.id is null then return null; end if;
  return private.product_json(p, s);
end $$;

create or replace function public.sh_public_catalog(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  perform private.assert_secret(p_secret);
  select count(*) into n
  from public.products p
  join public.stores s on s.id = p.store_id
  where s.status = 'active' and p.active;
  return jsonb_build_object(
    'count', n,
    'shops', coalesce((select jsonb_agg(private.store_json(s) order by s.reviewed_at desc nulls last)
                       from public.stores s where s.status = 'active'), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(private.product_json(p, s) order by p.created_at desc)
                          from public.products p join public.stores s on s.id = p.store_id
                          where s.status = 'active' and p.active), '[]'::jsonb));
end $$;
