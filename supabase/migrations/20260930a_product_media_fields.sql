-- 20260930a: product wizard fields — SKU, subcategory and extra gallery images.
alter table public.products
  add column if not exists sku text,
  add column if not exists subcategory text,
  add column if not exists images text[];

create or replace function public.sh_save_product(p_secret text, p_user uuid, p_product jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores; p public.products; v_id uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into s from public.stores where owner_id = p_user and status = 'active';
  if s.id is null then return jsonb_build_object('error', 'session'); end if;
  v_id := (p_product->>'id')::uuid;
  if exists (select 1 from public.products where id = v_id and store_id <> s.id) then
    return jsonb_build_object('error', 'forbidden');
  end if;
  insert into public.products as t (id, store_id, name, brand, category, price, old_price, discount, stock, delivery, description,
    image, kind, gender, sizes, colors, sku, subcategory, images)
  values (v_id, s.id, p_product->>'name', coalesce(p_product->>'brand',''), p_product->>'category', (p_product->>'price')::bigint,
    nullif(p_product->>'oldPrice','')::bigint, nullif(p_product->>'discount','')::int, greatest(coalesce((p_product->>'stockQty')::int, 0), 0),
    coalesce(nullif(p_product->>'delivery',''), 'Toshkent 24 soat'), coalesce(p_product->>'description',''), nullif(p_product->>'image',''),
    nullif(p_product->>'kind',''), nullif(p_product->>'gender',''),
    case when jsonb_typeof(p_product->'sizes') = 'array' then array(select jsonb_array_elements_text(p_product->'sizes')) end,
    case when jsonb_typeof(p_product->'colors') = 'array' then array(select jsonb_array_elements_text(p_product->'colors')) end,
    nullif(p_product->>'sku',''), nullif(p_product->>'subcategory',''),
    case when jsonb_typeof(p_product->'images') = 'array' then array(select jsonb_array_elements_text(p_product->'images')) end)
  on conflict (id) do update set
    name = excluded.name, brand = excluded.brand, category = excluded.category, price = excluded.price,
    old_price = excluded.old_price, discount = excluded.discount, stock = excluded.stock, delivery = excluded.delivery,
    description = excluded.description, image = coalesce(excluded.image, t.image), kind = excluded.kind,
    gender = excluded.gender, sizes = excluded.sizes, colors = excluded.colors,
    sku = excluded.sku, subcategory = excluded.subcategory, images = excluded.images, updated_at = now()
  returning * into p;
  return jsonb_build_object('product', private.product_json(p, s));
end $$;

create or replace function private.product_json(p public.products, s public.stores)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p.id, 'name', p.name, 'brand', p.brand, 'category', p.category, 'price', p.price,
    'oldPrice', p.old_price, 'discount', p.discount, 'rating', p.rating, 'reviews', p.reviews,
    'inStock', p.active and p.stock > 0, 'delivery', p.delivery, 'image', p.image,
    'description', p.description, 'stockQty', p.stock, 'shopId', s.id, 'shopName', s.name, 'shopSlug', s.slug,
    'active', p.active, 'listedBySeller', true, 'featured', true,
    'kind', p.kind, 'sizes', to_jsonb(p.sizes), 'gender', p.gender, 'colors', to_jsonb(p.colors),
    'sku', p.sku, 'subcategory', p.subcategory, 'images', to_jsonb(p.images),
    'createdAt', p.created_at))
$$;

grant execute on function public.sh_save_product(text, uuid, jsonb) to anon, authenticated, service_role;
