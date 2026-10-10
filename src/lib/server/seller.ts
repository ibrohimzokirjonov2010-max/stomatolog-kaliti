import "server-only";
import { publicObjectUrl, supabaseUrl } from "@/lib/server/db";
import { str } from "@/lib/server/user";

const CATEGORIES = new Set(["materiallar", "implantlar", "asboblar", "jihozlar", "forma"]);
const KINDS = new Set(["xalat", "scrub", "qalpoq", "poyabzal"]);
const GENDERS = new Set(["erkak", "ayol", "unisex"]);

/** Accept images we host (community bucket), site-relative placeholders, or plain https URLs. No data:/blob:. */
export function safeImage(value: unknown): string {
  const v = str(value, 600);
  if (!v) return "";
  if (v.startsWith(publicObjectUrl(""))) return v;
  if (v.startsWith("/") && !v.startsWith("//") && /^[\w\-./]+$/.test(v)) return v;
  if (/^https:\/\/[^\s"'<>]+$/i.test(v)) return v;
  return "";
}

function cleanList(value: unknown, max: number, len: number) {
  return Array.isArray(value)
    ? [...new Set(value.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, len)).filter(Boolean))].slice(0, max)
    : undefined;
}

export const PRODUCT_DOCS_BUCKET = "product-docs";

const ATTR_TEXT: Record<string, number> = {
  shortDescription: 1000, lot: 60, expiryDate: 10, deliveryRegion: 60, manufacturer: 80, model: 80, color: 40, volume: 40, packCount: 40,
  type: 80, usage: 120, curing: 80, storage: 80, shelfLife: 40,
};
const ATTR_NUM = ["minOrder", "wholesale", "deliveryPrice"];
const ATTR_BOOL = ["freeDelivery", "isNew", "recommended", "limited"];

/** Whitelist + sanitize the free-form wizard attributes (sale/delivery/specs/flags/documents). */
export function cleanAttrs(raw: unknown): Record<string, unknown> {
  const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, max] of Object.entries(ATTR_TEXT)) {
    const v = str(a[k], max);
    if (v) out[k] = v;
  }
  if (out.expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(out.expiryDate as string)) delete out.expiryDate;
  for (const k of ATTR_NUM) {
    const n = Math.floor(Number(a[k]));
    if (Number.isFinite(n) && n > 0 && n <= 10_000_000_000) out[k] = n;
  }
  for (const k of ATTR_BOOL) if (typeof a[k] === "boolean") out[k] = a[k];
  const stock = str(a.stockStatus, 12);
  if (["mavjud", "buyurtma", "tugagan"].includes(stock)) out.stockStatus = stock;
  const dm = str(a.deliveryMethod, 8);
  if (["own", "market", "mixed"].includes(dm)) out.deliveryMethod = dm;
  const prefix = `${supabaseUrl()}/storage/v1/object/public/${PRODUCT_DOCS_BUCKET}/`;
  if (Array.isArray(a.docs)) {
    out.docs = a.docs
      .filter((d): d is Record<string, unknown> => Boolean(d) && typeof d === "object")
      .map((d) => ({ url: str(d.url, 400), name: str(d.name, 120) || "hujjat", size: Math.max(0, Math.floor(Number(d.size) || 0)) }))
      .filter((d) => d.url.startsWith(prefix))
      .slice(0, 6);
  }
  return out;
}

export function slugify(name: string) {
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

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateApplication(body: Record<string, unknown>): ValidationResult<Record<string, unknown>> {
  const ownerName = str(body.ownerName, 120);
  const shopName = str(body.shopName, 120);
  const phone = str(body.phone, 40);
  const bio = str(body.bio, 2000);
  const telegram = str(body.telegram, 120);
  const instagram = str(body.instagram, 120);
  if (!ownerName || !shopName) return { ok: false, error: "Ism va do‘kon nomini kiriting." };
  if (phone.replace(/\D/g, "").length < 9) return { ok: false, error: "Telefon raqamini to‘g‘ri kiriting." };
  if (bio.length < 20) return { ok: false, error: "Do‘kon haqida kamida 20 belgi yozing." };
  if (!telegram && !instagram) return { ok: false, error: "Telegram yoki Instagram sahifasini kiriting." };
  const stir = str(body.stir, 20).replace(/\D/g, "");
  if (stir && stir.length !== 9) return { ok: false, error: "STIR 9 ta raqamdan iborat bo‘ladi." };
  const years = Number(body.yearsInBusiness);
  const docs = Array.isArray(body.docs)
    ? body.docs
        .filter((d): d is Record<string, unknown> => Boolean(d) && typeof d === "object")
        .map((d) => ({ path: str(d.path, 200), name: str(d.name, 120) || "hujjat", size: Math.max(0, Math.floor(Number(d.size) || 0)), type: str(d.type, 60) }))
        .filter((d) => /^apps\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/i.test(d.path))
        .slice(0, 5)
    : [];
  return {
    ok: true,
    value: {
      slug: slugify(shopName),
      shopName,
      ownerName,
      phone,
      city: str(body.city, 60) || "Toshkent",
      bio,
      telegram,
      instagram,
      facebook: str(body.facebook, 200),
      website: str(body.website, 200),
      address: str(body.address, 200),
      yearsInBusiness: Number.isFinite(years) && years >= 0 && years < 200 ? String(Math.floor(years)) : "",
      stir,
      docs,
    },
  };
}

/** Docs must live under the caller's own folder. */
export function docsOwnedBy(docs: unknown, userId: string) {
  return Array.isArray(docs) && docs.every((d) => typeof d?.path === "string" && d.path.startsWith(`apps/${userId}/`));
}

export function validateProduct(body: Record<string, unknown>, id: string): ValidationResult<Record<string, unknown>> {
  const name = str(body.name, 160);
  const brand = str(body.brand, 80);
  const category = str(body.category, 20);
  const price = Math.floor(Number(body.price));
  if (!name || !brand) return { ok: false, error: "Nom va brend majburiy." };
  if (!CATEGORIES.has(category)) return { ok: false, error: "Kategoriya noto‘g‘ri." };
  if (!Number.isFinite(price) || price <= 0 || price > 10_000_000_000) return { ok: false, error: "Narx noto‘g‘ri." };
  const discountRaw = Math.round(Number(body.discount));
  const discount = Number.isFinite(discountRaw) && discountRaw > 0 && discountRaw < 90 ? discountRaw : null;
  const stock = Math.floor(Number(body.stockQty ?? body.stock));
  const isForma = category === "forma";
  const kind = str(body.kind, 20);
  const gender = str(body.gender, 20);
  // Gallery: cover (`image`) + up to 9 extra photos, in the seller's order, no duplicates. If the cover is missing
  // but extra photos exist, the first extra photo becomes the cover (list cards always show `image`).
  const extras = [...new Set((Array.isArray(body.images) ? body.images : []).map((x) => safeImage(x)).filter(Boolean))];
  let cover = safeImage(body.image);
  if (!cover && extras.length) cover = extras.shift() ?? "";
  const images = extras.filter((u) => u !== cover).slice(0, 9);
  return {
    ok: true,
    value: {
      id,
      name,
      brand,
      category,
      price,
      discount,
      oldPrice: discount
        ? (() => {
            const given = Math.floor(Number(body.oldPrice));
            const calc = Math.round(price / (1 - discount / 100));
            // client may send the exact base price it discounted from (avoids rounding drift)
            return Number.isFinite(given) && Math.abs(given - calc) <= Math.max(2, calc * 0.01) ? given : calc;
          })()
        : null,
      stockQty: Number.isFinite(stock) ? Math.min(Math.max(stock, 0), 1_000_000) : 0,
      delivery: str(body.delivery, 80) || "Toshkent 24 soat",
      description: str(body.description, 4000),
      image: cover,
      kind: isForma && KINDS.has(kind) ? kind : "",
      gender: isForma && GENDERS.has(gender) ? gender : "",
      sizes: isForma ? cleanList(body.sizes, 12, 8) ?? [] : null,
      colors: isForma ? cleanList(body.colors, 12, 20) ?? [] : null,
      sku: str(body.sku, 60),
      subcategory: str(body.subcategory, 60),
      attrs: cleanAttrs(body.attrs),
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
      images,
    },
  };
}
