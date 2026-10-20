/** Public marketplace rows from GET /api/catalog. */

import type { ApparelGender, ApparelKind, Product, ProductAttrs, ProductCategory } from "@/data/products";

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
  description: string;
  kind: string;
  gender: string;
  sizes: string[];
  colors: string[];
  images: string[];
  sku: string;
  stockQty: number;
  attrs: Record<string, unknown>;
};

export type CatalogShop = {
  id: string;
  slug: string;
  name: string;
  city: string;
  logo: string;
};

const PRODUCT_CATEGORIES = ["materiallar", "implantlar", "asboblar", "jihozlar", "laboratoriya", "forma"] as const;
const KINDS = ["xalat", "scrub", "qalpoq", "poyabzal"] as const;
const GENDERS = ["erkak", "ayol", "unisex"] as const;

export function catalogHref(category: string, id: string) {
  if (category === "forma") return `/forma/${id}`;
  if (category === "jihozlar") return `/jihozlar/${id}`;
  return `/marketplace/${id}`;
}

export const CATALOG_CATS = ["all", "materiallar", "implantlar", "asboblar", "jihozlar", "laboratoriya", "forma"] as const;
export type CatalogCat = (typeof CATALOG_CATS)[number];

const CATALOG_CAT_ALIAS: Record<string, CatalogCat> = {
  kompozitlar: "materiallar",
  terapiya: "materiallar",
  bondlar: "materiallar",
  endodontiya: "asboblar",
  uchliklar: "asboblar",
  uskunalar: "jihozlar",
  gigiyena: "forma",
};

/** `?category=` and `?cat=` select the same catalog chip on desktop and mobile. */
export function catalogCatFromQuery(raw: string | null | undefined): CatalogCat {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return "all";
  if ((CATALOG_CATS as readonly string[]).includes(value)) return value as CatalogCat;
  return CATALOG_CAT_ALIAS[value] ?? "all";
}

export function productFromCatalog(item: CatalogCard): Product {
  const category = ((PRODUCT_CATEGORIES as readonly string[]).includes(item.category) ? item.category : "materiallar") as ProductCategory;
  const attrs = item.attrs as ProductAttrs;
  const free = attrs.freeDelivery === true;
  const deliveryPrice = Number(attrs.deliveryPrice) || 0;
  const kind = (KINDS as readonly string[]).includes(item.kind) ? (item.kind as ApparelKind) : undefined;
  const gender = (GENDERS as readonly string[]).includes(item.gender) ? (item.gender as ApparelGender) : undefined;
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category,
    price: item.price,
    oldPrice: item.oldPrice,
    discount: item.discount,
    rating: item.rating,
    reviews: item.reviews,
    inStock: item.inStock && item.stockQty > 0,
    delivery: free ? "Bepul yetkazib berish" : deliveryPrice > 0 ? `${deliveryPrice}` : "",
    image: item.image,
    images: item.images,
    description: item.description,
    shopId: item.shopId || undefined,
    shopName: item.shopName || undefined,
    shopSlug: item.shopSlug || undefined,
    sku: item.sku || undefined,
    stockQty: item.stockQty,
    kind,
    gender,
    sizes: item.sizes,
    colors: item.colors,
    href: catalogHref(category, item.id),
    attrs,
    listedBySeller: true,
  };
}

export function brandKeyOf(brand: string) {
  return brand.trim().toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "boshqa";
}

export function catalogCardFrom(raw: Record<string, unknown>): CatalogCard | null {
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
    description: typeof raw.description === "string" ? raw.description : "",
    kind: typeof raw.kind === "string" ? raw.kind : "",
    gender: typeof raw.gender === "string" ? raw.gender : "",
    sizes: Array.isArray(raw.sizes) ? raw.sizes.filter((item): item is string => typeof item === "string") : [],
    colors: Array.isArray(raw.colors) ? raw.colors.filter((item): item is string => typeof item === "string") : [],
    images: Array.isArray(raw.images) ? raw.images.filter((item): item is string => typeof item === "string") : [],
    sku: typeof raw.sku === "string" ? raw.sku : "",
    stockQty: Number.isFinite(Number(raw.stockQty)) ? Math.max(0, Math.floor(Number(raw.stockQty))) : 0,
    attrs: raw.attrs && typeof raw.attrs === "object" && !Array.isArray(raw.attrs) ? (raw.attrs as Record<string, unknown>) : {},
  };
}

export async function fetchCatalog(): Promise<{ products: CatalogCard[]; shops: CatalogShop[] }> {
  try {
    const res = await fetch("/api/catalog", { credentials: "same-origin" });
    const json = (await res.json()) as { ok?: boolean; products?: Record<string, unknown>[]; shops?: Record<string, unknown>[] };
    if (!json.ok) return { products: [], shops: [] };
    const products = Array.isArray(json.products) ? json.products.map(catalogCardFrom).filter((item): item is CatalogCard => Boolean(item)) : [];
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
