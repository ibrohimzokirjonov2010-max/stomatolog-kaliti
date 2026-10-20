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
  /** Design fact row (Miqdor, Hajm, Shahar, Joylashuv). */
  highlights?: { label: string; value: string }[];
  /** Design specification table. */
  specRows?: [string, string][];
};

/** Categories offered in the post form + desktop category row (order matches the design). */
export const surplusCategories: { id: SurplusCategory; label: string }[] = [
  { id: "kompozit", label: "Kompozit" },
  { id: "bonding", label: "Bond" },
  { id: "sement", label: "Sement" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "implantlar", label: "Implant" },
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

/**
 * Shown when `/api/work/surplus` is down or returns nothing, so the catalog
 * and the Filtek product page are never empty. Real listings replace this.
 */
export const demoSurplusListings: SurplusListing[] = [
  {
    id: "filtek-z350-xt-a2",
    name: "Filtek Z350 XT A2",
    brand: "3M",
    category: "kompozit",
    productCategory: "materiallar",
    price: 850_000,
    newPrice: 1_200_000,
    status: "yopiq",
    expiryMonths: 24,
    expiry: "10/2028",
    condition: "yangi",
    rating: 4.9,
    reviews: 12,
    sellerDeals: 56,
    city: "Toshkent",
    district: "Yunusobod",
    seller: "Dr. Ibrohim Zokirjonov",
    verified: true,
    updatedLabel: "Bugun",
    image: "/img/shop/s-main.jpg",
    hasPhoto: true,
    images: ["/img/shop/s-main.jpg", "/img/shop/s-t1.jpg", "/img/shop/s-t2.jpg", "/img/shop/s-t3.jpg"],
    description:
      "3M Filtek Z350 XT – estetik restavratsiyalar uchun universal nanogibrid kompozit. Rang: A2. 3 dona, barchasi yopiq va ishlatilmagan. Yaroqlilik muddati: 10/2028. Klinikamizda ortib qolgan, shuning uchun arzonroq narxda sotaman.",
    note: "Sifatli universal kompozit. Rang: A2. Yopiq, ishlatilmagan. Klinikangizda ortib qolgan, arzon narxda sotaman.",
    address: "Klinika",
    phone: "+998901112233",
    telegram: "ibrohim_zokirjonov",
    createdAt: "2026-10-12T09:00:00.000Z",
    demo: true,
    highlights: [
      { label: "Miqdor", value: "3 dona" },
      { label: "Hajm", value: "4 g (1 dona)" },
      { label: "Shahar", value: "Toshkent" },
      { label: "Joylashuv", value: "Klinika" },
    ],
    specRows: [
      ["Brend", "3M"],
      ["Mahsulot nomi", "Filtek Z350 XT"],
      ["Turi", "Universal kompozit"],
      ["Rang", "A2"],
      ["Hajm", "4 g (1 dona)"],
      ["Miqdor", "3 dona"],
      ["Holati", "Yopiq, yangi"],
      ["Yaroqlilik muddati", "10/2028"],
      ["Lot raqami", "N892745"],
      ["Ishlab chiqarilgan mamlakat", "AQSh"],
    ],
  },
  {
    id: "optibond-fl",
    name: "OptiBond FL Bonding (8 ml)",
    brand: "Kerr",
    category: "bonding",
    productCategory: "materiallar",
    price: 1_100_000,
    newPrice: 1_100_000,
    status: "yopiq",
    expiryMonths: 18,
    condition: "yangi",
    rating: 4.8,
    reviews: 9,
    city: "Samarqand",
    seller: "Dr. Aziza Karimova",
    verified: true,
    updatedLabel: "Kecha",
    image: "/img/shop/m-optibond.jpg",
    hasPhoto: true,
    description: "Kerr OptiBond FL, yopiq flakon. Samarqanddagi klinikadan.",
    note: "Yopiq, ishlatilmagan.",
    phone: "+998901110011",
    createdAt: "2026-10-11T09:00:00.000Z",
    demo: true,
  },
  {
    id: "sdr-flow-surplus",
    name: "SDR flow+ Bulk fill kompozit (2 g)",
    brand: "Dentsply",
    category: "kompozit",
    productCategory: "materiallar",
    price: 382_000,
    newPrice: 450_000,
    status: "ochilgan",
    expiryMonths: 14,
    condition: "ochilgan",
    openedAgo: "2 oy oldin",
    rating: 4.6,
    reviews: 6,
    city: "Buxoro",
    seller: "Dr. Jasur Rahimov",
    verified: false,
    updatedLabel: "3 kun oldin",
    image: "/img/shop/m-sdr.jpg",
    hasPhoto: true,
    description: "SDR flow+ ochilgan, lekin ko‘p qismi qolgan. Buxoro.",
    note: "Ochilgan qadoq.",
    phone: "+998901110022",
    createdAt: "2026-10-08T09:00:00.000Z",
    demo: true,
  },
  {
    id: "protaper-gold-surplus",
    name: "ProTaper Gold Endodontik fayllar (6 dona)",
    brand: "Dentsply",
    category: "endodontiya",
    productCategory: "asboblar",
    price: 900_000,
    newPrice: 900_000,
    status: "yopiq",
    expiryMonths: 30,
    condition: "yangi",
    rating: 4.9,
    reviews: 11,
    city: "Buxoro",
    seller: "Dr. Malika Yusupova",
    verified: true,
    updatedLabel: "Bugun",
    image: "/img/shop/m-protaper.jpg",
    hasPhoto: true,
    description: "ProTaper Gold, yopiq blister. 6 dona.",
    note: "Yopiq.",
    phone: "+998901110033",
    createdAt: "2026-10-10T09:00:00.000Z",
    demo: true,
  },
  {
    id: "gcem-one",
    name: "G-CEM ONE Apeks sement (4.6 g)",
    brand: "GC",
    category: "sement",
    productCategory: "materiallar",
    price: 1_025_000,
    newPrice: 1_250_000,
    status: "yopiq",
    expiryMonths: 20,
    condition: "yangi",
    rating: 4.7,
    reviews: 7,
    city: "Toshkent",
    seller: "Dr. Sardor Tursunov",
    verified: true,
    updatedLabel: "Kecha",
    image: "/img/shop/m-fuji.jpg",
    hasPhoto: true,
    description: "GC G-CEM ONE, yopiq. Toshkent.",
    note: "Yopiq.",
    phone: "+998901110044",
    createdAt: "2026-10-09T09:00:00.000Z",
    demo: true,
  },
  {
    id: "straumann-blx",
    name: "Straumann BLX Implant (4.1 x 10 mm)",
    brand: "Straumann",
    category: "implantlar",
    productCategory: "implantlar",
    price: 3_840_000,
    newPrice: 3_840_000,
    status: "yopiq",
    expiryMonths: 36,
    condition: "yangi",
    rating: 4.9,
    reviews: 4,
    city: "Toshkent",
    seller: "Dr. Farrux Salomov",
    verified: true,
    updatedLabel: "Bugun",
    image: "/img/shop/m-surgic.jpg",
    hasPhoto: true,
    description: "Straumann BLX, steril yopiq qadoq.",
    note: "Yopiq.",
    phone: "+998901110055",
    createdAt: "2026-10-07T09:00:00.000Z",
    demo: true,
  },
  {
    id: "clearfil-se-surplus",
    name: "Clearfil SE Bond 2 Bonding to‘plami",
    brand: "Kuraray",
    category: "bonding",
    productCategory: "materiallar",
    price: 890_000,
    newPrice: 1_112_500,
    status: "yopiq",
    expiryMonths: 16,
    condition: "yangi",
    rating: 4.9,
    reviews: 8,
    city: "Toshkent",
    seller: "Dr. Dilnoza Yusupova",
    verified: true,
    updatedLabel: "2 kun oldin",
    image: "/img/shop/s-opti.jpg",
    hasPhoto: true,
    description: "Clearfil SE Bond 2, yopiq to‘plam.",
    note: "Yopiq.",
    phone: "+998901110066",
    createdAt: "2026-10-06T09:00:00.000Z",
    demo: true,
  },
  {
    id: "timax-x600l",
    name: "Ti-Max X600L Uchlik (turbina)",
    brand: "NSK",
    category: "instrument",
    productCategory: "asboblar",
    price: 5_350_000,
    newPrice: 5_350_000,
    status: "yopiq",
    expiryMonths: 12,
    condition: "yangi",
    rating: 4.6,
    reviews: 3,
    city: "Toshkent",
    seller: "Dr. Javohir Ahmedov",
    verified: false,
    updatedLabel: "Kecha",
    image: "/img/shop/m-timax.jpg",
    hasPhoto: true,
    description: "NSK Ti-Max, ishlatilmagan.",
    note: "Yopiq.",
    phone: "+998901110077",
    createdAt: "2026-10-05T09:00:00.000Z",
    demo: true,
  },
];

/** Public list stays empty. The surplus screen reads `/api/work/surplus` and does not fill in demo rows. */
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
