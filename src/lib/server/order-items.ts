import "server-only";
import { products as staticProducts, type Product, type ProductCategory } from "@/data/products";
import { surplusProducts } from "@/data/surplus";
import { marketProducts, type ShopCategory } from "@/data/desktop-shop";
import { desktopForma } from "@/data/desktop-forma";
import { desktopJihoz } from "@/data/desktop-jihozlar";
import { catalogShop } from "@/data/shops";
import { safeImage } from "@/lib/server/seller";
import { UUID_RE, str } from "@/lib/server/user";

function shopCategory(category: ShopCategory): ProductCategory {
  if (category === "implantlar") return "implantlar";
  if (category === "uskunalar") return "jihozlar";
  if (category === "asboblar" || category === "endodontiya" || category === "uchliklar") return "asboblar";
  return "materiallar";
}

function priced(partial: Pick<Product, "id" | "name" | "brand" | "category" | "price" | "image">): Product {
  return { ...partial, rating: 0, reviews: 0, inStock: true, delivery: "" };
}

const DESIGN_CATALOG: Product[] = [
  ...marketProducts.map((item) => priced({
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: shopCategory(item.category),
    price: item.price,
    image: item.image,
  })),
  ...desktopForma.map((item) => priced({
    id: item.slug,
    name: item.name,
    brand: item.brand,
    category: "forma",
    price: item.price,
    image: item.image,
  })),
  ...desktopJihoz.map((item) => priced({
    id: item.slug,
    name: item.name,
    brand: item.brand,
    category: "jihozlar",
    price: item.price,
    image: item.image,
  })),
];

const STATIC = new Map([...staticProducts, ...surplusProducts, ...DESIGN_CATALOG].map((p) => [p.id, p]));

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
