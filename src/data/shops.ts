import { site } from "@/data/site";
import type { Product, ProductCategory } from "@/data/products";

/** pending = ariza; active = tasdiqlangan (approved); rejected = rad etilgan */
export type ShopVerified = "pending" | "active" | "rejected";

export type Shop = {
  id: string;
  slug: string;
  name: string;
  city: string;
  bio: string;
  phone: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  address?: string;
  yearsInBusiness?: number;
  ownerName: string;
  verified: ShopVerified;
  rejectReason?: string;
  appliedAt?: string;
  reviewedAt?: string;
  logo?: string;
  views: number;
  createdAt: string;
  demo: true;
};

export type CardBrand = "uzcard" | "humo" | "visa" | "mastercard";

export type LinkedCard = {
  shopId: string;
  brand: CardBrand;
  last4: string;
  holder: string;
  bank?: string;
  expiryMasked: string;
  linkedAt: string;
};

export const CATALOG_SHOP_ID = "shop-kaliti";

export const catalogShop: Shop = {
  id: CATALOG_SHOP_ID,
  slug: "kaliti-market",
  name: "StomaHub Market",
  city: "Toshkent",
  bio: "StomaHub rasmiy katalogi — klinik materiallar, implantlar va asboblar. Namuna ombor, haqiqiy jo‘natma yo‘q.",
  phone: site.phoneDisplay,
  telegram: site.telegramHandle,
  ownerName: "StomaHub",
  verified: "active",
  views: 1840,
  createdAt: "2026-01-12T00:00:00.000Z",
  demo: true,
};

export const shopCities = ["Toshkent", "Samarqand", "Buxoro", "Farg‘ona"] as const;

export const sellerCategories: { id: ProductCategory; label: string }[] = [
  { id: "materiallar", label: "Materiallar" },
  { id: "implantlar", label: "Implantlar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "forma", label: "Forma" },
];

export const cardBrandLabel: Record<CardBrand, string> = {
  uzcard: "Uzcard",
  humo: "Humo",
  visa: "Visa",
  mastercard: "Mastercard",
};

export function shopHref(slug: string) {
  return `/marketplace/dokon/${slug}`;
}

export function sellerCabinetHref() {
  return "/marketplace/sotuvchi";
}

export function isShopApproved(shop: Pick<Shop, "verified">) {
  return shop.verified === "active";
}

export function shopStatusLabel(status: ShopVerified) {
  if (status === "active") return "Tasdiqlangan";
  if (status === "rejected") return "Rad etilgan";
  return "Ko‘rib chiqilmoqda";
}

export function productShop(product: Product): { name: string; slug: string } | null {
  if (product.shopSlug && product.shopName) {
    return { name: product.shopName, slug: product.shopSlug };
  }
  if (product.listedBySeller) return null;
  if (product.category === "forma" || product.id.startsWith("surplus-")) return null;
  return { name: catalogShop.name, slug: catalogShop.slug };
}

export function placeholderProductImage(category: ProductCategory) {
  if (category === "implantlar") return "/images/product-implant.png";
  if (category === "asboblar") return "/images/product-curette.png";
  if (category === "jihozlar") return "/images/product-unit.png";
  if (category === "forma") return "/images/product-composite.png";
  if (category === "laboratoriya") return "/images/product-graft.png";
  return "/images/product-composite.png";
}

export function isRemoteSrc(src: string) {
  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:");
}

export function normalizeSocialHandle(raw: string, kind: "instagram" | "telegram") {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const handle = t.replace(/^@/, "");
  if (kind === "instagram") return `https://instagram.com/${handle}`;
  return `https://t.me/${handle}`;
}

export function socialDisplay(raw?: string) {
  if (!raw) return "";
  try {
    if (raw.startsWith("http")) {
      const u = new URL(raw);
      return u.hostname.replace("www.", "") + u.pathname.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return raw.startsWith("@") ? raw : `@${raw.replace(/^@/, "")}`;
}
