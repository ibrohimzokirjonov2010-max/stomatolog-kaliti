import type { Product, ProductCategory } from "@/data/products";

export type PackageStatus = "yopiq" | "ochilgan";

export type SurplusCategory =
  | "kompozit"
  | "bonding"
  | "sement"
  | "endodontiya"
  | "implantlar"
  | "anesteziya"
  | "borlar"
  | "instrument"
  | "ortodontiya"
  /** legacy ids (older localStorage listings / seed) — mapped via normalizeCategory */
  | "restavratsiya"
  | "laboratoriya";

export type SurplusCondition = "yangi" | "ishlatilgan" | "ochilgan";

export type SurplusListing = {
  id: string;
  name: string;
  brand: string;
  category: SurplusCategory;
  productCategory: ProductCategory;
  price: number;
  newPrice: number;
  status: PackageStatus;
  expiryMonths: number;
  /** Expiry as MM/YYYY (derived from expiryMonths when missing) */
  expiry?: string;
  condition?: SurplusCondition;
  rating?: number;
  reviews?: number;
  sellerDeals?: number;
  /** e.g. "2 oy oldin" — only for opened packs */
  openedAgo?: string;
  city: string;
  district?: string;
  seller: string;
  verified: boolean;
  mine?: boolean;
  featured?: boolean;
  updatedLabel: string;
  image: string;
  /** false when `image` is only the category placeholder */
  hasPhoto?: boolean;
  /** Extra gallery photos (seller uploads, max 8) */
  images?: string[];
  /** Optional short video overview (seller upload) */
  video?: string;
  /** Longer seller description */
  description?: string;
  /** Pickup point / landmark (public) */
  address?: string;
  lat?: number | null;
  lng?: number | null;
  phone: string;
  telegram?: string;
  note: string;
  createdAt?: string;
  active?: boolean;
  demo?: true;
  /** DB moderation state (owner view): pending | published | rejected | hidden | closed */
  modStatus?: string;
  rejectReason?: string | null;
  interestCount?: number;
};

/** Categories offered in the post form + desktop category row (order matches the design). */
export const surplusCategories: { id: SurplusCategory; label: string }[] = [
  { id: "kompozit", label: "Kompozit" },
  { id: "bonding", label: "Bond" },
  { id: "sement", label: "Sement" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "implantlar", label: "Implant" },
  { id: "anesteziya", label: "Anesteziya" },
  { id: "borlar", label: "Borlar" },
  { id: "instrument", label: "Instrument" },
  { id: "ortodontiya", label: "Ortodontiya" },
];

/** Map legacy category ids to the current set. */
export function normalizeCategory(category: SurplusCategory | string): SurplusCategory {
  if (category === "restavratsiya") return "kompozit";
  return category as SurplusCategory;
}

export function surplusCategoryLabel(category: SurplusCategory | string) {
  const id = normalizeCategory(category);
  return surplusCategories.find((item) => item.id === id)?.label ?? (id === "laboratoriya" ? "Laboratoriya" : "");
}

export const surplusCities = ["Toshkent", "Samarqand", "Buxoro", "Farg‘ona", "Andijon", "Namangan"] as const;

/** Popular brand tags shown under the search (desktop). */
export const surplusPopularBrands = [
  "3M",
  "Ivoclar",
  "Straumann",
  "Dentsply",
  "GC",
  "Shofu",
  "Kerr",
  "Ultradent",
  "Komet",
  "Coltene",
] as const;

/** Fixed "today" for expiry maths so SSR/CSR markup stays identical. */
const BASE_YEAR = 2026;
const BASE_MONTH = 10; // October

function monthsUntil(expiry: string) {
  const [mm, yyyy] = expiry.split("/").map(Number);
  return Math.max(1, (yyyy - BASE_YEAR) * 12 + (mm - BASE_MONTH));
}

export function monthsToExpiry(months: number) {
  const total = BASE_YEAR * 12 + (BASE_MONTH - 1) + Math.max(0, months);
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return `${String(month).padStart(2, "0")}/${year}`;
}

export function listingExpiry(listing: SurplusListing) {
  return listing.expiry ?? monthsToExpiry(listing.expiryMonths);
}

export function listingCondition(listing: SurplusListing): SurplusCondition {
  return listing.condition ?? (listing.status === "ochilgan" ? "ochilgan" : "yangi");
}

export const conditionLabel: Record<SurplusCondition, string> = {
  yangi: "Yangi",
  ishlatilgan: "Ishlatilgan",
  ochilgan: "Ochilgan",
};

/** Bundled demo listings have no real reviews: rating is hidden until real data exists. */
export function listingRating(listing: SurplusListing) {
  void listing;
  return { rating: 0, reviews: 0 };
}

export function listingSellerDeals(listing: SurplusListing) {
  // bundled demo listings have no real sales history
  void listing;
  return 0;
}

export function listingDiscount(listing: SurplusListing) {
  if (!listing.newPrice || listing.newPrice <= listing.price) return 0;
  return Math.round((1 - listing.price / listing.newPrice) * 100);
}

/** Listings now live in the database (see /api/work/surplus). No bundled demo listings. */
export const surplusListings: SurplusListing[] = [];

export const statusLabel: Record<PackageStatus, string> = {
  yopiq: "Yopiq",
  ochilgan: "Ochilgan",
};

export function expiryLabel(months: number) {
  return `${months}+ oy`;
}

export function getListing(id: string) {
  return surplusListings.find((item) => item.id === id);
}

export function categoryToProductCategory(category: SurplusCategory): ProductCategory {
  if (category === "implantlar") return "implantlar";
  if (category === "endodontiya" || category === "instrument" || category === "borlar") return "asboblar";
  if (category === "laboratoriya") return "laboratoriya";
  return "materiallar";
}

export function placeholderImage(category: SurplusCategory) {
  if (category === "implantlar") return "/images/dentrade/dentium-superline.png";
  if (category === "bonding") return "/images/surplus-bond-bottle.png";
  if (category === "sement") return "/images/product-optibond.png";
  if (category === "endodontiya") return "/images/dentrade/iroot-apex.png";
  if (category === "anesteziya") return "/images/surplus-implant-box.png";
  if (category === "borlar") return "/images/dentrade/gingiva-former.png";
  if (category === "instrument") return "/images/dentrade/mirror-mir407.png";
  if (category === "ortodontiya") return "/images/seminar-braces.png";
  if (category === "laboratoriya") return "/images/product-graft.png";
  return "/images/dentrade/denfil-nano.png";
}

export function phoneHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:+${digits}` : `tel:${phone}`;
}

export function telegramHref(value?: string, text?: string) {
  if (!value) return "";
  const href =
    value.startsWith("http://") || value.startsWith("https://") || value.startsWith("tg://")
      ? value
      : `https://t.me/${value.replace(/^@/, "")}`;
  if (!text?.trim()) return href;
  return `${href}${href.includes("?") ? "&" : "?"}text=${encodeURIComponent(text.trim())}`;
}

export function surplusContactTemplate(listing: SurplusListing) {
  return `Assalomu alaykum, «${listing.name}» hali bormi? Holati: ${statusLabel[listing.status]}, yaroqlilik: ${expiryLabel(listing.expiryMonths)}. Originaligi va saqlash sharoiti qanday?`;
}

export function isRemoteImage(src: string) {
  return src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:");
}

export function surplusCartMeta(source?: string, expiryMonths?: number) {
  if (source !== "ortiqcha") return "";
  return expiryMonths ? `Ortiqcha · ${expiryLabel(expiryMonths)}` : "Ortiqcha";
}


/** No bundled seller photos: UI falls back to initials. */
export function surplusSellerAvatar(seller: string, mine?: boolean) {
  void seller;
  void mine;
  return undefined as string | undefined;
}

export function surplusBrandLabel(listing: SurplusListing) {
  const brand = listing.brand?.trim();
  if (brand) return brand;
  const cat = surplusCategoryLabel(listing.category);
  return cat || "Doktor e'loni";
}

export function listingToProduct(listing: SurplusListing): Product {
  const demo = listingRating(listing);
  return {
    id: listing.id,
    name: listing.name,
    brand: surplusBrandLabel(listing),
    category: listing.productCategory,
    price: listing.price,
    oldPrice: listing.newPrice,
    rating: demo.rating,
    reviews: demo.reviews,
    inStock: true,
    delivery: listing.district ? `${listing.city} · ${listing.district}` : listing.city,
    image: listing.image,
  };
}

export const surplusProducts = surplusListings.map(listingToProduct);
