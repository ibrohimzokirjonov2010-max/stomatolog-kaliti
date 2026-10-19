/** Public marketplace rows from GET /api/catalog. */

export type CatalogCard = {
  id: string;
  name: string;
  brand: string;
  brandKey: string;
  category: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  image: string;
  createdAt: string;
  shopId: string;
  shopName: string;
  shopSlug: string;
};

export type CatalogShop = {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo: string;
};

const PRODUCT_CATEGORIES = ["materiallar", "implantlar", "asboblar", "jihozlar", "laboratoriya", "forma"] as const;

export function productFromCatalog(item: CatalogCard) {
  const category = (PRODUCT_CATEGORIES as readonly string[]).includes(item.category) ? item.category : "materiallar";
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: category as (typeof PRODUCT_CATEGORIES)[number],
    price: item.price,
    oldPrice: item.oldPrice,
    discount: item.discount,
    rating: item.rating,
    reviews: item.reviews,
    inStock: item.inStock,
    delivery: "",
    image: item.image,
    description: "",
    shopId: item.shopId || undefined,
    shopName: item.shopName || undefined,
    shopSlug: item.shopSlug || undefined,
  };
}

export function brandKeyOf(brand: string) {
  return brand.trim().toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "boshqa";
}

function cardFrom(raw: Record<string, unknown>): CatalogCard | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const name = typeof raw.name === "string" ? raw.name : "";
  if (!id || !name) return null;
  const brand = typeof raw.brand === "string" && raw.brand.trim() ? raw.brand.trim() : "Brend";
  const price = Number(raw.price) || 0;
  const oldPrice = Number(raw.oldPrice) || 0;
  const discount = Number(raw.discount) || 0;
  return {
    id,
    name,
    brand,
    brandKey: brandKeyOf(brand),
    category: typeof raw.category === "string" ? raw.category : "",
    price,
    oldPrice: oldPrice > price ? oldPrice : undefined,
    discount: discount > 0 ? discount : undefined,
    rating: Number(raw.rating) || 0,
    reviews: Number(raw.reviews) || 0,
    inStock: raw.inStock !== false,
    image: typeof raw.image === "string" ? raw.image : "",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    shopId: typeof raw.shopId === "string" ? raw.shopId : "",
    shopName: typeof raw.shopName === "string" ? raw.shopName : "",
    shopSlug: typeof raw.shopSlug === "string" ? raw.shopSlug : "",
  };
}

export async function fetchCatalog(): Promise<{ products: CatalogCard[]; shops: CatalogShop[] }> {
  try {
    const res = await fetch("/api/catalog", { credentials: "same-origin" });
    const json = (await res.json()) as { ok?: boolean; products?: Record<string, unknown>[]; shops?: Record<string, unknown>[] };
    if (!json.ok) return { products: [], shops: [] };
    const products = Array.isArray(json.products) ? json.products.map(cardFrom).filter((item): item is CatalogCard => Boolean(item)) : [];
    const shops: CatalogShop[] = [];
    if (Array.isArray(json.shops)) {
      for (const raw of json.shops) {
        const id = typeof raw.id === "string" ? raw.id : "";
        const name = typeof raw.name === "string" ? raw.name : "";
        if (!id || !name) continue;
        shops.push({
          id,
          slug: typeof raw.slug === "string" && raw.slug ? raw.slug : id,
          name,
          city: typeof raw.city === "string" ? raw.city : "",
          logo: typeof raw.logo === "string" ? raw.logo : "",
        });
      }
    }
    return { products, shops };
  } catch {
    return { products: [], shops: [] };
  }
}

export async function fetchCatalogProducts(): Promise<CatalogCard[]> {
  const { products } = await fetchCatalog();
  return products;
}
