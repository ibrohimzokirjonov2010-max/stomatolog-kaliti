-- Public catalog was hiding the owner's live products.
-- sh_public_catalog excluded is_platform because an old bundled catalog duplicated
-- the platform store. That bundled catalog is gone, so active products on the
-- active platform store never reached /marketplace or /jihozlar, while the seller
-- panel (sh_my_store) still listed them as faol.
-- Apply once after 20261020c_source_links.sql. Safe to re-run (create or replace).
-- Does not change masters/jobs status: those rows publish from the new forms.
-- The public "0 ta" counts were city and "mine" filters in the UI, not a stuck status.

create or replace function public.sh_public_catalog(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'shops', coalesce((select jsonb_agg(private.store_json(s) order by s.reviewed_at desc nulls last)
                       from public.stores s where s.status = 'active'), '[]'::jsonb),
    'products', coalesce((select jsonb_agg(private.product_json(p, s) order by p.created_at desc)
                          from public.products p join public.stores s on s.id = p.store_id
                          where s.status = 'active' and p.active), '[]'::jsonb));
end $$;

-- Prefer the seller's active non-platform shop. Fall back to the active platform
-- store only when that is the owner's only active store, and always pick one row
-- (two active stores used to abort the save).
create or replace function public.sh_save_product(p_secret text, p_user uuid, p_product jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare s public.stores; p public.products; v_id uuid;
begin
  perform private.assert_secret(p_secret);
  perform private.assert_active(p_user);
  select * into s from public.stores
  where id = coalesce(
    (select id from public.stores
      where owner_id = p_user and status = 'active' and coalesce(is_platform, false) = false
      order by created_at limit 1),
    (select id from public.stores
      where owner_id = p_user and status = 'active'
      order by created_at limit 1)
  );
  if s.id is null then return jsonb_build_object('error', 'session'); end if;
  v_id := (p_product->>'id')::uuid;
  if exists (select 1 from public.products where id = v_id and store_id <> s.id) then
    return jsonb_build_object('error', 'forbidden');
  end if;
  insert into public.products as t (id, store_id, name, brand, category, price, old_price, discount, stock, delivery, description,
    image, kind, gender, sizes, colors, sku, subcategory, images, attrs, active)
  values (v_id, s.id, p_product->>'name', coalesce(p_product->>'brand',''), p_product->>'category', (p_product->>'price')::bigint,
    nullif(p_product->>'oldPrice','')::bigint, nullif(p_product->>'discount','')::int, greatest(coalesce((p_product->>'stockQty')::int, 0), 0),
    coalesce(nullif(p_product->>'delivery',''), 'Toshkent 24 soat'), coalesce(p_product->>'description',''), nullif(p_product->>'image',''),
    nullif(p_product->>'kind',''), nullif(p_product->>'gender',''),
    case when jsonb_typeof(p_product->'sizes') = 'array' then array(select jsonb_array_elements_text(p_product->'sizes')) end,
    case when jsonb_typeof(p_product->'colors') = 'array' then array(select jsonb_array_elements_text(p_product->'colors')) end,
    nullif(p_product->>'sku',''), nullif(p_product->>'subcategory',''),
    case when jsonb_typeof(p_product->'images') = 'array' then array(select jsonb_array_elements_text(p_product->'images')) end,
    case when jsonb_typeof(p_product->'attrs') = 'object' then p_product->'attrs' else '{}'::jsonb end,
    case when p_product ? 'active' then (p_product->>'active')::boolean else true end)
  on conflict (id) do update set
    name = excluded.name, brand = excluded.brand, category = excluded.category, price = excluded.price,
    old_price = excluded.old_price, discount = excluded.discount, stock = excluded.stock, delivery = excluded.delivery,
    description = excluded.description, image = coalesce(excluded.image, t.image), kind = excluded.kind,
    gender = excluded.gender, sizes = excluded.sizes, colors = excluded.colors,
    sku = excluded.sku, subcategory = excluded.subcategory, images = excluded.images, attrs = excluded.attrs,
    active = case when p_product ? 'active' then (p_product->>'active')::boolean else t.active end, updated_at = now()
  returning * into p;
  return jsonb_build_object('product', private.product_json(p, s));
end $$;

-- Cover falls back to the first gallery photo so a card is not an empty square
-- when the seller uploaded extras but the cover column is blank.
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
    'createdAt', p.created_at))
$$;

-- Doctors who filled a profile, plus published usta profiles. No phone or email.
create or replace function public.sh_public_specialists(p_secret text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_secret(p_secret);
  return jsonb_build_object(
    'people', coalesce((
      select jsonb_agg(x order by x->>'name')
      from (
        select jsonb_build_object(
          'id', 'doctor-' || p.id::text,
          'kind', 'doctor',
          'name', p.full_name,
          'specialty', coalesce(nullif(btrim(p.specialty), ''), 'Stomatolog'),
          'city', coalesce(p.city, ''),
          'clinic', coalesce(p.clinic, ''),
          'about', coalesce(p.bio, ''),
          'image', coalesce(p.avatar_url, ''),
          'href', '/mutaxassislar/doctor-' || p.id::text
        ) as x
        from public.profiles p
        where p.blocked_at is null
          and p.provider_uid not like 'platform:%'
          and char_length(btrim(p.full_name)) >= 2
          and (
            char_length(btrim(coalesce(p.specialty, ''))) >= 2
            or char_length(btrim(coalesce(p.clinic, ''))) >= 2
          )
        union all
        select jsonb_build_object(
          'id', 'usta-' || m.id::text,
          'kind', 'usta',
          'name', m.name,
          'specialty', coalesce(nullif(btrim(m.title), ''), 'Usta'),
          'city', coalesce(m.city, ''),
          'clinic', '',
          'about', coalesce(m.description, ''),
          'image', coalesce(m.photo, ''),
          'href', '/ustalar/' || m.id::text
        )
        from public.masters m
        where m.status = 'published'
      ) q
    ), '[]'::jsonb));
end $$;

grant execute on function public.sh_public_specialists(text) to anon, authenticated, service_role;
