import {
  catalogShop,
  cardBrandLabel,
  placeholderProductImage,
  type CardBrand,
  type LinkedCard,
  type Shop,
} from "@/data/shops";
import {
  type ProductAttrs,
  type ApparelGender,
  type ApparelKind,
  type Product,
  type ProductCategory,
} from "@/data/products";
import { isDeliveryItem } from "@/lib/order-money";
import { loadSellerOrders } from "@/lib/orders";

export const SESSION_KEY = "sk-seller-session-v1";
export const SHOPS_KEY = "sk-seller-shops-v1";
export const PRODUCTS_KEY = "sk-seller-products-v1";
export const CARDS_KEY = "sk-seller-cards-v1";

export type SellerProductInput = {
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  discount?: number;
  stock: number;
  delivery: string;
  description: string;
  image?: string;
  images?: string[];
  attrs?: ProductAttrs;
  /** false = draft (saved but hidden from the catalog) */
  active?: boolean;
  /** exact base price before discount */
  oldPrice?: number;
  sku?: string;
  subcategory?: string;
  kind?: ApparelKind;
  sizes?: string[];
  gender?: ApparelGender;
  colors?: string[];
  specs?: string;
};

/** Latest DB catalog products (shared with cart lookup, which lives outside SellerWorkProvider). */
let dbCatalogCache: Product[] = [];
export const CATALOG_EVENT = "sk-catalog-changed";
export function getDbCatalog() {
  return dbCatalogCache;
}
export function setDbCatalog(rows: Product[]) {
  dbCatalogCache = rows;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CATALOG_EVENT));
}

export type SellerDoc = { path: string; name: string; size: number; type: string };

export type SellerApplicationInput = {
  stir?: string;
  docs?: SellerDoc[];
  ownerName: string;
  phone: string;
  shopName: string;
  city: string;
  bio: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  address?: string;
  yearsInBusiness?: number;
};

export type SellerSection = "marketplace" | "forma" | "jihozlar";

export function sectionForCategory(category: ProductCategory): SellerSection {
  if (category === "forma") return "forma";
  if (category === "jihozlar") return "jihozlar";
  return "marketplace";
}

export function catalogHrefForCategory(category: ProductCategory) {
  const section = sectionForCategory(category);
  if (section === "forma") return "/forma";
  if (section === "jihozlar") return "/jihozlar";
  return "/marketplace";
}

export function catalogLabelForCategory(category: ProductCategory) {
  const section = sectionForCategory(category);
  if (section === "forma") return "Forma";
  if (section === "jihozlar") return "Jihozlar";
  return "Marketplace";
}

export const marketplaceSellerCategories: ProductCategory[] = ["materiallar", "implantlar", "asboblar"];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function newSellerId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export function slugifyShop(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[‘’ʻʼ']/g, "")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "dokon";
}

function asShop(row: Shop): Shop | null {
  if (!row || typeof row.id !== "string" || !row.slug || !row.name) return null;
  const verified =
    row.verified === "active" || row.verified === "rejected" ? row.verified : "pending";
  return {
    ...row,
    verified,
    views: Number(row.views) || 0,
    yearsInBusiness:
      row.yearsInBusiness != null && Number.isFinite(Number(row.yearsInBusiness))
        ? Number(row.yearsInBusiness)
        : undefined,
    demo: true,
  };
}

function asProduct(row: Product): Product | null {
  if (!row || typeof row.id !== "string" || !row.name) return null;
  return {
    ...row,
    image: typeof row.image === "string" && row.image ? row.image : placeholderProductImage(row.category),
    price: Number(row.price) || 0,
    rating: Number(row.rating) || 0,
    reviews: Number(row.reviews) || 0,
    inStock: row.active === false ? false : Boolean(row.inStock),
    active: row.active !== false,
    listedBySeller: true,
    demo: true,
  };
}

export function loadShops(): Shop[] {
  const rows = readJson<Shop[]>(SHOPS_KEY, []);
  return Array.isArray(rows) ? rows.map(asShop).filter((row): row is Shop => Boolean(row)) : [];
}

export function saveShops(rows: Shop[]) {
  localStorage.setItem(SHOPS_KEY, JSON.stringify(rows));
}

export function loadSellerProducts(): Product[] {
  const rows = readJson<Product[]>(PRODUCTS_KEY, []);
  return Array.isArray(rows) ? rows.map(asProduct).filter((row): row is Product => Boolean(row)) : [];
}

export function saveSellerProducts(rows: Product[]) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(rows));
}

export function loadCards(): LinkedCard[] {
  const rows = readJson<LinkedCard[]>(CARDS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

export function saveCards(rows: LinkedCard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(rows));
}

export function loadSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function saveSessionId(id: string | null) {
  if (!id) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, id);
}

export function mergeShops(posted: Shop[]) {
  return posted;
}

export function mergeMarketplaceCatalog(listed: Product[], shops?: Shop[]) {
  const approvedIds = new Set(
    (shops ?? loadShops())
      .filter((s) => s.verified === "active")
      .map((s) => s.id),
  );
  const live = listed.filter(
    (item) => item.active !== false && (!item.shopId || approvedIds.has(item.shopId)),
  );
  return live;
}

export function uniqueSlug(name: string, existing: Shop[], keepId?: string) {
  const base = slugifyShop(name);
  const taken = new Set(existing.filter((item) => item.id !== keepId).map((item) => item.slug));
  taken.add(catalogShop.slug);
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

export function isPersistableImage(src: string) {
  return src.startsWith("/") || src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:");
}

export function productFromInput(input: SellerProductInput, shop: Shop, existing?: Product): Product {
  const discount = input.discount && input.discount > 0 && input.discount < 90 ? Math.round(input.discount) : undefined;
  const stock = Math.max(0, Math.floor(input.stock));
  const okImg = (u?: string): u is string => Boolean(u) && isPersistableImage(u as string) && !(u as string).startsWith("blob:");
  const extras = [...new Set((input.images ?? []).filter(okImg))];
  const cover = okImg(input.image) ? input.image : extras.shift();
  const image = cover ?? existing?.image ?? placeholderProductImage(input.category);
  const images = extras.filter((u) => u !== image).slice(0, 9);
  const oldPrice = discount ? input.oldPrice ?? Math.round(input.price / (1 - discount / 100)) : undefined;
  const specs = input.specs?.trim();
  const baseDesc = input.description.trim();
  const description =
    input.category === "jihozlar" && specs
      ? [baseDesc, specs ? `Texnik xususiyatlar: ${specs}` : ""].filter(Boolean).join("\n\n")
      : baseDesc;
  const isForma = input.category === "forma";
  return {
    id: existing?.id ?? newSellerId("shopprod"),
    name: input.name.trim(),
    brand: input.brand.trim(),
    category: input.category,
    price: input.price,
    oldPrice,
    discount,
    rating: existing?.rating ?? 0,
    reviews: existing?.reviews ?? 0,
    inStock: stock > 0 && (input.active ?? existing?.active) !== false,
    delivery: input.delivery.trim() || "Toshkent 24 soat",
    image,
    demo: true,
    description,
    stockQty: stock,
    shopId: shop.id,
    shopName: shop.name,
    shopSlug: shop.slug,
    active: (input.active ?? existing?.active) !== false,
    listedBySeller: true,
    featured: true,
    attrs: input.attrs,
    sku: input.sku?.trim() || undefined,
    subcategory: input.subcategory?.trim() || undefined,
    images,
    kind: isForma ? input.kind : undefined,
    sizes: isForma && input.sizes?.length ? input.sizes : undefined,
    gender: isForma ? input.gender : undefined,
    colors: isForma && input.colors?.length ? input.colors : undefined,
  };
}

/** Resize/compress an image File to a JPEG/PNG data URL suitable for localStorage. */
export async function fileToCompressedDataUrl(file: File, maxSide = 960, quality = 0.82): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("not-image");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const preferPng = file.type === "image/png" && quality >= 0.95;
  const mime = preferPng ? "image/png" : "image/jpeg";
  const dataUrl = canvas.toDataURL(mime, preferPng ? undefined : quality);
  if (dataUrl.length > 1_200_000) {
    return canvas.toDataURL("image/jpeg", 0.7);
  }
  return dataUrl;
}

export function listShopOrders(shopId: string, listed: Product[]) {
  const ids = new Set(listed.filter((item) => item.shopId === shopId).map((item) => item.id));
  try {
    return loadSellerOrders().filter(
      (order) => order.items.some((item) => ids.has(item.productId) || item.shopId === shopId),
    );
  } catch {
    return [];
  }
}

export function countProductsBySection(listed: Product[]) {
  const counts = { marketplace: 0, forma: 0, jihozlar: 0 };
  for (const item of listed) {
    if (item.active === false) continue;
    counts[sectionForCategory(item.category)] += 1;
  }
  return counts;
}

export function luhnOk(digits: string) {
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (!Number.isFinite(n)) return false;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

export function detectCardBrand(digits: string): CardBrand | null {
  if (digits.startsWith("8600")) return "uzcard";
  if (digits.startsWith("9860")) return "humo";
  if (digits.startsWith("4")) return "visa";
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(digits)) return "mastercard";
  return null;
}

export function parseExpiry(value: string) {
  const match = value.replace(/\s/g, "").match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) return null;
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { month, year, masked: `${String(month).padStart(2, "0")}/${String(year).padStart(2, "0")}` };
}

export function validateCard(input: { number: string; expiry: string; holder: string; bank?: string }) {
  const digits = input.number.replace(/\D/g, "");
  const holder = input.holder.trim();
  if (holder.length < 3) return { ok: false as const, reason: "holder" as const };
  const expiry = parseExpiry(input.expiry);
  if (!expiry) return { ok: false as const, reason: "expiry" as const };
  if (digits.length < 16 || digits.length > 19) return { ok: false as const, reason: "number" as const };
  const brand = detectCardBrand(digits);
  if (!brand) return { ok: false as const, reason: "brand" as const };
  if ((brand === "visa" || brand === "mastercard") && !luhnOk(digits)) {
    return { ok: false as const, reason: "luhn" as const };
  }
  if ((brand === "uzcard" || brand === "humo") && digits.length !== 16) {
    return { ok: false as const, reason: "number" as const };
  }
  return {
    ok: true as const,
    brand,
    last4: digits.slice(-4),
    holder,
    bank: input.bank?.trim() || undefined,
    expiryMasked: expiry.masked,
  };
}

export function cardStatusLabel(card: LinkedCard | null) {
  if (!card) return "Ulash kutilmoqda";
  return `Karta ulangan · ${cardBrandLabel[card.brand]} **** ${card.last4}`;
}

export function countShopOrders(shopId: string, listed: Product[]) {
  const ids = new Set(listed.filter((item) => item.shopId === shopId).map((item) => item.id));
  if (!ids.size) return 0;
  try {
    return loadSellerOrders().filter((order) => order.items.some((item) => ids.has(item.productId) || item.shopId === shopId))
      .length;
  } catch {
    return 0;
  }
}


export type DaySalesPoint = { date: string; label: string; total: number; count: number };

function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function salesLast7Days(orders: ReturnType<typeof loadSellerOrders>, shopId: string): DaySalesPoint[] {
  const days: DaySalesPoint[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = localDateKey(d);
    const label = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    days.push({ date: key, label, total: 0, count: 0 });
  }
  const index = new Map(days.map((d) => [d.date, d]));
  for (const order of orders) {
    if (!order.createdAt) continue;
    const when = new Date(order.createdAt);
    if (Number.isNaN(when.getTime())) continue;
    const bucket = index.get(localDateKey(when));
    if (!bucket) continue;
    const lines = order.items.filter((item) => !isDeliveryItem(item) && (!item.shopId || item.shopId === shopId));
    if (!lines.length) continue;
    const sum = lines.reduce((acc, item) => acc + item.price * item.qty, 0);
    bucket.total += sum;
    bucket.count += 1;
  }
  return days;
}

export type TopSoldRow = { productId: string; name: string; brand: string; qty: number; revenue: number; image?: string };

export function topSoldProducts(
  orders: ReturnType<typeof loadSellerOrders>,
  shopId: string,
  listed: Product[],
  limit = 5,
): TopSoldRow[] {
  const mine = new Map(listed.filter((p) => p.shopId === shopId).map((p) => [p.id, p]));
  const agg = new Map<string, TopSoldRow>();
  for (const order of orders) {
    for (const item of order.items) {
      if (isDeliveryItem(item)) continue;
      if (item.shopId && item.shopId !== shopId) continue;
      if (!item.shopId && !mine.has(item.productId)) continue;
      const key = item.productId || item.name;
      const prev = agg.get(key) ?? {
        productId: item.productId,
        name: item.name,
        brand: item.brand,
        qty: 0,
        revenue: 0,
        image: mine.get(item.productId)?.image ?? item.image,
      };
      prev.qty += item.qty;
      prev.revenue += item.price * item.qty;
      agg.set(key, prev);
    }
  }
  return [...agg.values()].sort((a, b) => b.qty - a.qty || b.revenue - a.revenue).slice(0, limit);
}

export function hasSocial(shop: Pick<Shop, "telegram" | "instagram">) {
  return Boolean(shop.telegram?.trim() || shop.instagram?.trim());
}

export { cardBrandLabel };
