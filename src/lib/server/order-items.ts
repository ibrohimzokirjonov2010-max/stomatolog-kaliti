import "server-only";
import { products as staticProducts } from "@/data/products";
import { surplusProducts } from "@/data/surplus";
import { catalogShop } from "@/data/shops";
import { safeImage } from "@/lib/server/seller";
import { UUID_RE, str } from "@/lib/server/user";

const STATIC = new Map([...staticProducts, ...surplusProducts].map((p) => [p.id, p]));

/**
 * Cart lines → the shape the SQL order/quote functions expect. Seller (DB) products are priced in SQL; platform
 * catalog items are priced here from the bundled catalog — client prices are never trusted. Unknown items are rejected.
 */
export function normalizeOrderItems(
  rawItems: unknown[],
): { ok: true; items: Record<string, unknown>[] } | { ok: false; error: string } {
  const items: Record<string, unknown>[] = [];
  for (const raw of rawItems) {
    const it = (raw ?? {}) as Record<string, unknown>;
    const productId = str(it.productId, 80);
    const qty = Math.min(Math.max(Math.floor(Number(it.qty) || 1), 1), 999);
    const meta = {
      size: str(it.size, 12),
      color: str(it.color, 30),
      source: str(it.source, 40),
      expiryMonths: Number.isFinite(Number(it.expiryMonths)) && it.expiryMonths != null ? String(Math.floor(Number(it.expiryMonths))) : "",
    };
    if (UUID_RE.test(productId)) {
      items.push({ productId, qty, ...meta });
      continue;
    }
    const p = STATIC.get(productId);
    if (!p) return { ok: false, error: "Savatdagi ba’zi mahsulotlar endi mavjud emas. Savatni yangilang." };
    const isSurplus = productId.startsWith("surplus-");
    items.push({
      productId,
      qty,
      price: p.price,
      name: p.name,
      brand: p.brand,
      image: safeImage(p.image),
      category: p.category,
      shopName: isSurplus ? "Ortiqcha material" : catalogShop.name,
      shopSlug: isSurplus ? "" : catalogShop.slug,
      ...meta,
    });
  }
  return { ok: true, items };
}
