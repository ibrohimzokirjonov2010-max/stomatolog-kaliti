import "server-only";
import { products as staticProducts } from "@/data/products";
import { surplusProducts } from "@/data/surplus";
import { catalogShop } from "@/data/shops";
import { marketProducts } from "@/data/desktop-shop";
import { saleActive, saleProducts } from "@/data/desktop-sales";
import { desktopJihoz } from "@/data/desktop-jihozlar";
import { LOGO_PRICE, desktopForma } from "@/data/desktop-forma";
import { atlasEditions, books, featuredBook } from "@/data/desktop-hub";
import { savatPicks } from "@/data/desktop-savat";
import { mobileMarketItems } from "@/data/mobile-market";
import { mobileBooks } from "@/data/mobile-books";
import { LOGO_FEE, mobileForma } from "@/data/mobile-forma";
import { mobileJihoz } from "@/data/mobile-jihozlar";
import { safeImage } from "@/lib/server/seller";
import { UUID_RE, str } from "@/lib/server/user";

type Priced = { id: string; name: string; brand: string; price: number; image: string; category: string };

/** Everything the platform itself sells, priced from the bundled catalogs (the desktop catalogs included). */
const STATIC = new Map<string, Priced>(
  [
    ...staticProducts,
    ...surplusProducts,
    ...marketProducts,
    ...desktopJihoz.map((p) => ({ id: `jihoz-${p.slug}`, name: p.name, brand: p.brand, price: p.price, image: p.image, category: "jihozlar" })),
    ...[...books, featuredBook].map((b) => ({ id: `book-${b.id}`, name: b.title, brand: b.publisher, price: b.price, image: b.image, category: "kitoblar" })),
    ...Object.values(atlasEditions).map((e) => ({ id: e.id, name: e.name, brand: "Quintessence", price: e.price, image: e.image, category: "kitoblar" })),
    ...mobileMarketItems.map((p) => ({ id: p.id, name: p.name, brand: p.brand, price: p.price, image: p.image, category: p.chip })),
    ...mobileForma.flatMap((f) => [
      { id: f.id, name: f.name, brand: f.brand, price: f.price, image: f.image, category: "forma" },
      { id: `${f.id}-logo`, name: `${f.name} + logo tikish`, brand: f.brand, price: f.price + LOGO_FEE, image: f.image, category: "forma" },
    ]),
    ...mobileJihoz.map((j) => ({ id: j.id, name: j.pdpName ?? j.name, brand: j.pdpBrand ?? j.brand, price: j.price, image: j.image, category: "jihozlar" })),
    ...mobileBooks.map((b) => ({ id: b.id, name: b.title, brand: b.author, price: b.price, image: b.image, category: "kitoblar" })),
    ...savatPicks.map((p) => ({ id: p.id, name: p.name, brand: p.seller ?? "", price: p.price, image: p.image, category: "materiallar" })),
    { id: "forma-logo-chest", name: "Logo kashtasi xizmati", brand: "StomaHub Forma", price: LOGO_PRICE, image: "/img/forma/d-logo-kashta.jpg", category: "forma" },
    { id: "forma-logo-sleeve", name: "Logo kashtasi xizmati", brand: "StomaHub Forma", price: LOGO_PRICE, image: "/img/forma/d-logo-kashta.jpg", category: "forma" },
  ].map((p) => [p.id, p]),
);
const SALES = new Map(saleProducts.map((p) => [p.id, p]));
/** Forma cart ids carry the chosen colour/size: forma-<slug>-<colour>[-<size>]. Longest slug wins. */
const FORMA = [...desktopForma].sort((a, b) => b.slug.length - a.slug.length);

function formaItem(productId: string): Priced | undefined {
  if (!productId.startsWith("forma-")) return undefined;
  const p = FORMA.find((item) => productId.startsWith(`forma-${item.slug}-`));
  return p ? { id: productId, name: p.name, brand: p.brand, price: p.price, image: p.image, category: "forma" } : undefined;
}

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
    const sale = SALES.get(productId);
    if (sale && !saleActive(sale)) return { ok: false, error: `“${sale.name}” aksiyasi tugagan. Savatdan olib tashlang.` };
    const p: Priced | undefined = sale ?? STATIC.get(productId) ?? formaItem(productId);
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
