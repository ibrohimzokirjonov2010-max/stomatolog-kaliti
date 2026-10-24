import { products, type ApparelGender, type ApparelKind, type Product } from "@/data/products";

export const clothingSizes = ["S", "M", "L", "XL", "XXL"] as const;

export const formaKinds: { id: ApparelKind; label: string }[] = [
  { id: "xalat", label: "Xalat" },
  { id: "scrub", label: "Scrub" },
  { id: "qalpoq", label: "Qalpoq" },
  { id: "poyabzal", label: "Poyabzal" },
];

export const formaGenders: { id: ApparelGender; label: string }[] = [
  { id: "erkak", label: "Erkaklar" },
  { id: "ayol", label: "Ayollar" },
  { id: "unisex", label: "Unisex" },
];

export const formaColors: { id: string; hex: string; label: string; extra?: boolean }[] = [
  { id: "teal", hex: "#0F766E", label: "Yashil" },
  { id: "navy", hex: "#111827", label: "To‘q ko‘k" },
  { id: "black", hex: "#111827", label: "Qora" },
  { id: "white", hex: "#ffffff", label: "Oq" },
  { id: "sky", hex: "#CCFBF1", label: "Moviy", extra: true },
];

export const FORMA_PRICE_MIN = 50_000;
export const FORMA_PRICE_MAX = 2_000_000;

export const formaProducts: Product[] = products.filter((product) => product.category === "forma");

export const formaBrands = [...new Set(formaProducts.map((product) => product.brand))];

export function matchesClothingSize(product: Product, size: string) {
  if (!size) return true;
  const sizes = product.sizes ?? [];
  if (sizes.includes(size)) return true;
  return false;
}

const extraColorLabels: Record<string, string> = {
  oq: "Oq",
  qora: "Qora",
  purple: "Siyohrang",
  green: "Yashil",
  yalpiz: "Yalpiz",
  pushti: "Pushti",
};

/** Uzbek color name. Unknown ids stay as stored so a new swatch is not invented in English. */
export function colorLabel(id: string) {
  return formaColors.find((item) => item.id === id)?.label ?? extraColorLabels[id] ?? id;
}

export function apparelMetaLabel(size?: string, color?: string) {
  const parts = [size, color ? colorLabel(color) : ""].filter(Boolean);
  return parts.join(" · ");
}

export function defaultApparelSize(product: Product, preset?: string) {
  const sizes = product.sizes ?? [];
  if (preset && sizes.includes(preset)) return preset;
  if (sizes.length === 1) return sizes[0];
  return "";
}

export function defaultApparelColor(product: Product, preset?: string) {
  const colors = product.colors ?? [];
  if (preset && colors.includes(preset)) return preset;
  if (colors.length === 1) return colors[0];
  return "";
}

export function apparelReady(product: Product, size?: string, color?: string) {
  const sizes = product.sizes ?? [];
  const colors = product.colors ?? [];
  if (sizes.length && !size) return false;
  if (colors.length && !color) return false;
  return true;
}

export function sizeLine(product: Product) {
  const sizes = product.sizes ?? [];
  if (sizes.length === 1 && sizes[0] === "Universal") return "Universal";
  return sizes.join(", ");
}

// ——— Desktop catalogue helpers (derived from existing product data; prices untouched) ———

export type FormaCat = "" | "scrub" | "xalat" | "komplekt" | "poyabzal" | "qalpoq" | "aksessuar" | "boshqa";

export const formaCats: { id: FormaCat; label: string }[] = [
  { id: "", label: "Barchasi" },
  { id: "scrub", label: "Scrub" },
  { id: "xalat", label: "Xalat" },
  { id: "komplekt", label: "Kiyim komplekti" },
  { id: "poyabzal", label: "Poyabzal" },
  { id: "qalpoq", label: "Qalpoq" },
  { id: "aksessuar", label: "Aksessuar" },
  { id: "boshqa", label: "Boshqa" },
];

/** «Kiyim komplekti» = scrub/xalat sets sold as a «to‘plam». */
export function matchesFormaCat(product: Product, cat: FormaCat) {
  if (!cat) return true;
  if (cat === "komplekt") return /to‘plam/i.test(product.name);
  if (cat === "aksessuar" || cat === "boshqa") return false;
  return product.kind === cat;
}

export function isBestseller(product: Product) {
  return product.reviews >= 50;
}

/** Seller-listed products and the latest catalogue entries count as «Yangi». */
export function isNewForma(product: Product) {
  if (product.listedBySeller) return true;
  const n = Number(product.id.match(/forma-ali-(\d+)/)?.[1] ?? 0);
  return n >= 17 || !/^forma-ali-/.test(product.id);
}

/** Sample material info (no material field in catalogue data). */
export function formaMaterial(product: Product): { id: string; label: string; composition: string; density: string } {
  switch (product.kind) {
    case "xalat":
      return { id: "paxta", label: "Paxta aralash", composition: "70% Paxta, 30% Polyester", density: "210 g/m²" };
    case "poyabzal":
      return { id: "eva", label: "EVA / sun’iy teri", composition: "EVA tagi, sun’iy teri ustki qism", density: "—" };
    case "qalpoq":
      return { id: "spunbond", label: "Spunbond", composition: "100% Polipropilen (spunbond)", density: "25 g/m²" };
    default:
      return { id: "polyester", label: "Polyester / Paxta", composition: "65% Polyester, 35% Cotton", density: "180 g/m²" };
  }
}

export const formaMaterials = [
  { id: "polyester", label: "Polyester / Paxta" },
  { id: "paxta", label: "Paxta aralash" },
  { id: "eva", label: "EVA / sun’iy teri" },
  { id: "spunbond", label: "Spunbond" },
];

export const formaPriceBands: { id: string; label: string; test: (price: number) => boolean }[] = [
  { id: "p1", label: "100 000 gacha", test: (p) => p < 100_000 },
  { id: "p2", label: "100 000 – 150 000", test: (p) => p >= 100_000 && p <= 150_000 },
  { id: "p3", label: "150 000 – 250 000", test: (p) => p > 150_000 && p <= 250_000 },
  { id: "p4", label: "250 000 dan yuqori", test: (p) => p > 250_000 },
];

export function formaSku(product: Product) {
  return product.id.toUpperCase().replace(/^FORMA-/, "FRM-");
}

export function stockLabel(product: Product) {
  if (!product.inStock) return "Buyurtma asosida";
  const qty = product.stockQty;
  return typeof qty === "number" && qty > 0 && qty < 20 ? `Omborda ${qty}` : "Omborda 20+";
}

/** Short delivery line: «Toshkent 3–7 kun» etc. */
export function deliveryShort(product: Product) {
  return product.delivery || "Toshkent 24 soat";
}
