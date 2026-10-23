-- Additive catalog fields for the product page.
-- soldCount is delivered-order quantity (hidden in the UI when null).
-- Shop rating, review count, logo and city come from existing tables.
-- Does not drop or rewrite columns. Safe to re-run.

create or replace function private.product_json(p public.products, s public.stores)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p.id, 'name', p.name, 'brand', p.brand, 'category', p.category, 'price', p.price,
    'oldPrice', p.old_price, 'discount', p.discount, 'rating', p.rating, 'reviews', p.reviews,
    'inStock', p.active and p.stock > 0, 'delivery', p.delivery,
    'image', coalesce(nullif(btrim(p.image), ''), p.images[1]),
    'description', p.description, 'stockQty', p.stock, 'shopId', s.id, 'shopName', s.name, 'shopSlug', s.slug,
    'active', p.active, 'listedBySeller', true, 'featured', true,
    'kind', p.kind, 'sizes', to_jsonb(p.sizes), 'gender', p.gender, 'colors', to_jsonb(p.colors),
    'sku', p.sku, 'subcategory', p.subcategory, 'images', to_jsonb(p.images), 'attrs', p.attrs,
    'createdAt', p.created_at,
    'shopLogo', nullif(btrim(s.logo), ''),
    'shopCity', nullif(btrim(s.city), ''),
    'shopRating', (select nullif(round(avg(r.rating)::numeric, 2), 0) from public.reviews r where r.store_id = s.id),
    'shopReviews', (select nullif(count(*)::int, 0) from public.reviews r where r.store_id = s.id),
    'shopProducts', (select count(*)::int from public.products x where x.store_id = s.id and x.active),
    'soldCount', nullif((
      select coalesce(sum(i.qty), 0)::int
      from public.order_items i
      join public.orders o on o.id = i.order_id
      where i.product_id = p.id::text and o.status = 'yetkazildi'
    ), 0)
  ))
$$;
