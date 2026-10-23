export type ProductCategory =
  | "materiallar"
  | "implantlar"
  | "asboblar"
  | "jihozlar"
  | "laboratoriya"
  | "forma";

export type ApparelKind = "xalat" | "scrub" | "qalpoq" | "poyabzal";
export type ApparelGender = "erkak" | "ayol" | "unisex";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  inStock: boolean;
  delivery: string;
  image: string;
  demo?: boolean;
  kind?: ApparelKind;
  sizes?: string[];
  gender?: ApparelGender;
  colors?: string[];
  featured?: boolean;
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  /** Catalog page for this line. Kept on cart snapshots so /savat can link back. */
  href?: string;
  description?: string;
  stockQty?: number;
  active?: boolean;
  listedBySeller?: boolean;
  /** Seller-entered (optional) SKU, subcategory and extra gallery images. */
  sku?: string;
  subcategory?: string;
  images?: string[];
  attrs?: ProductAttrs;
  /** Marketplace holati — omitted means "yangi". */
  condition?: ProductCondition;
  /** Optional explicit spec pills (otherwise derived from the name). */
  specs?: string[];
};

export type ProductAttrs = {
  minOrder?: number;
  wholesale?: number;
  stockStatus?: "mavjud" | "buyurtma" | "tugagan";
  lot?: string;
  /** yyyy-mm-dd */
  expiryDate?: string;
  deliveryMethod?: "own" | "market" | "mixed";
  deliveryRegion?: string;
  deliveryPrice?: number;
  freeDelivery?: boolean;
  shortDescription?: string;
  manufacturer?: string;
  model?: string;
  color?: string;
  volume?: string;
  packCount?: string;
  type?: string;
  usage?: string;
  curing?: string;
  storage?: string;
  shelfLife?: string;
  docs?: { url: string; name: string; size?: number }[];
  isNew?: boolean;
  recommended?: boolean;
  limited?: boolean;
  /** Jihozlar: short spec line, warranty, year, and installment. */
  specLine?: string;
  warrantyMonths?: number;
  year?: number;
  installmentMonths?: number;
  installmentMonthly?: number;
  leasing?: boolean;
  installService?: boolean;
  official?: boolean;
  condition?: "yangi" | "ishlatilgan";
  city?: string;
};

export type ProductCondition = "yangi" | "ishlatilgan" | "ochilgan";

export const categoryTabs: { id: ProductCategory; label: string }[] = [
  { id: "materiallar", label: "Materiallar" },
  { id: "implantlar", label: "Implantlar" },
  { id: "asboblar", label: "Asboblar" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "forma", label: "Forma" },
];

export const categoryLabels: Record<ProductCategory, string> = {
  materiallar: "Materiallar",
  implantlar: "Implantlar",
  asboblar: "Asboblar",
  jihozlar: "Jihozlar",
  laboratoriya: "Laboratoriya",
  forma: "Forma",
};

/** Seller catalog is loaded from the database. This list is empty so design products are not shown. */
export const products: Product[] = [];

export const PRICE_MIN = 50_000;
export const PRICE_MAX = 5_000_000;
export const BRANDS_PREVIEW = 5;

export const marketplaceListingOrder: readonly string[] = [];

export const categoryCatalogCounts: Record<ProductCategory, number> = {
  materiallar: 0,
  implantlar: 0,
  asboblar: 0,
  jihozlar: 0,
  laboratoriya: 0,
  forma: 0,
};

export const brandCatalogCounts: Record<string, number> = {};

export function getProduct(id: string) {
  return products.find((item) => item.id === id);
}

export function productHref(product: Product) {
  if (product.listedBySeller || product.id.startsWith("shopprod-")) return `/marketplace/${product.id}`;
  if (product.category === "forma") return `/forma/${product.id}`;
  if (product.id.startsWith("surplus-")) return "/ortiqcha-material";
  return `/marketplace/${product.id}`;
}

export function specialOfferProducts(limit = 3) {
  return products
    .filter((item) => item.inStock && item.discount && item.category !== "forma")
    .sort((a, b) => (b.discount ?? 0) - (a.discount ?? 0) || b.price - a.price)
    .slice(0, limit);
}

export function productOldPrice(product: Product) {
  if (product.oldPrice) return product.oldPrice;
  if (product.discount) return Math.round(product.price / (1 - product.discount / 100));
  return undefined;
}

// ——— Marketplace desktop helpers (derived from existing product data) ———

export type MarketGroup =
  | "kompozit"
  | "bond"
  | "sement"
  | "endodontiya"
  | "implant"
  | "anesteziya"
  | "borlar"
  | "instrument"
  | "jihozlar"
  | "laboratoriya"
  | "forma";

export const marketGroups: { id: MarketGroup; label: string }[] = [
  { id: "kompozit", label: "Kompozit" },
  { id: "bond", label: "Bond" },
  { id: "sement", label: "Sement" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "implant", label: "Implant" },
  { id: "anesteziya", label: "Anesteziya" },
  { id: "borlar", label: "Borlar" },
  { id: "instrument", label: "Instrument" },
  { id: "jihozlar", label: "Jihozlar" },
  { id: "laboratoriya", label: "Laboratoriya" },
  { id: "forma", label: "Forma" },
];

export const conditionLabels: Record<ProductCondition, string> = {
  yangi: "Yangi",
  ishlatilgan: "Ishlatilgan",
  ochilgan: "Ochilgan",
};

export const conditionOrder: ProductCondition[] = ["yangi", "ishlatilgan", "ochilgan"];

/** Old `?cat=` values (and direct group ids) → desktop category groups. */
export function groupsForCatParam(cat: string | null | undefined): MarketGroup[] {
  switch (cat) {
    case "materiallar":
      return ["kompozit", "bond", "sement"];
    case "implantlar":
      return ["implant"];
    case "asboblar":
      return ["instrument"];
    case "jihozlar":
      return ["jihozlar", "endodontiya"];
    case "laboratoriya":
      return ["laboratoriya"];
    case "forma":
      return ["forma"];
    default:
      return marketGroups.some((g) => g.id === cat) ? [cat as MarketGroup] : [];
  }
}

export function productGroup(product: Product): MarketGroup {
  const name = product.name.toLowerCase();
  if (product.category === "forma") return "forma";
  if (product.category === "implantlar") return "implant";
  if (/\b(bur|burs|bor|borlar|frez)\b/.test(name)) return "borlar";
  if (/anest|lidokain|artikain|ubistezin/.test(name)) return "anesteziya";
  if (product.category === "asboblar") return "instrument";
  if (product.category === "laboratoriya") return "laboratoriya";
  if (product.category === "jihozlar") {
    return /endomotor|apex|endo|kanal/.test(name) ? "endodontiya" : "jihozlar";
  }
  if (/bond/.test(name)) return "bond";
  if (/fuji|sement|cement|glass/.test(name)) return "sement";
  return "kompozit";
}

export function productCondition(product: Product): ProductCondition {
  return product.condition ?? "yangi";
}

const groupTypeLabel: Record<MarketGroup, string> = {
  kompozit: "Kompozit",
  bond: "Bond",
  sement: "Sement",
  endodontiya: "Endodontiya",
  implant: "Implant",
  anesteziya: "Anesteziya",
  borlar: "Bor",
  instrument: "Asbob",
  jihozlar: "Jihoz",
  laboratoriya: "Laboratoriya",
  forma: "Forma",
};

/** Small spec pills for marketplace cards: shade, size/weight, "Universal", otherwise product type. */
export function productSpecs(product: Product): string[] {
  if (product.specs?.length) return product.specs.slice(0, 3);
  const out: string[] = [];
  const name = product.name;
  if (/universal/i.test(name)) out.push("Universal");
  const dims = name.match(/\d+(?:\.\d+)?×\d+(?:\.\d+)?(?:\s?mm)?/);
  if (dims) out.push(dims[0].replace(/\s/g, ""));
  else {
    const unit = name.match(/\d+(?:\.\d+)?\s?(?:g|ml|mm|sm)\b/i);
    if (unit) out.push(unit[0].replace(/\s/g, ""));
  }
  const shade = name.match(/\b([A-D][1-4](?:\.5)?)\b/);
  if (shade) out.push(shade[1]);
  if (product.category === "forma") {
    if (!out.length && product.sizes?.length) out.push(`${product.sizes[0]}–${product.sizes[product.sizes.length - 1]}`);
  }
  if (out.length < 2) out.unshift(groupTypeLabel[productGroup(product)]);
  return [...new Set(out)].slice(0, 3);
}

const knownCities = ["Toshkent", "Samarqand", "Buxoro", "Farg‘ona"];

export function productCity(product: Product): string {
  return knownCities.find((city) => (product.delivery ?? "").startsWith(city)) ?? "Toshkent";
}
