export type FormaKind = "kostyum" | "xalat" | "qishki" | "bosh" | "poyabzal";
export type FormaGender = "ayol" | "erkak" | "uniseks";

export type FormaColor = { id: string; hex: string; label: string };

export type MobileForma = {
  id: string;
  brand: string;
  name: string;
  kind: FormaKind;
  gender: FormaGender;
  price: number;
  oldPrice?: number;
  discount?: number;
  rating: number;
  reviews: number;
  colors: FormaColor[];
  sizes: string[];
  image: string;
  gallery: string[];
  sku: string;
  fresh?: boolean;
  /** Shown on the product page, not in the catalog grid. */
  pdpOnly?: boolean;
};

const mint: FormaColor = { id: "yalpiz", hex: "#7ddec8", label: "Yalpiz" };
const navy: FormaColor = { id: "navy", hex: "#1d3d6e", label: "To‘q ko‘k" };
const black: FormaColor = { id: "qora", hex: "#1c2430", label: "Qora" };
const white: FormaColor = { id: "oq", hex: "#f4f6f8", label: "Oq" };
const pink: FormaColor = { id: "pushti", hex: "#e7b7c8", label: "Pushti" };

export const formaKinds: { id: "all" | FormaKind; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "kostyum", label: "Kostyumlar" },
  { id: "xalat", label: "Xalatlar" },
  { id: "qishki", label: "Qishki forma" },
  { id: "bosh", label: "Bosh kiyimlar" },
  { id: "poyabzal", label: "Poyabzal" },
];

export const mobileForma: MobileForma[] = [
  {
    id: "fm-ayol",
    brand: "Bestex",
    name: "Ayollar uchun kostyum",
    kind: "kostyum",
    gender: "ayol",
    price: 189_000,
    rating: 4.8,
    reviews: 120,
    colors: [navy, black, pink, white],
    sizes: ["S", "M", "L", "XL"],
    image: "/img/mobile/fm-woman.jpg",
    gallery: ["/img/mobile/fm-woman.jpg", "/img/mobile/fm-pocket.jpg", "/img/mobile/fm-label.jpg", "/img/mobile/fm-hero.jpg"],
    sku: "BX-101",
    fresh: true,
  },
  {
    id: "fm-erkak",
    brand: "Bestex",
    name: "Erkaklar uchun kostyum",
    kind: "kostyum",
    gender: "erkak",
    price: 175_000,
    rating: 4.7,
    reviews: 98,
    colors: [navy, black, white, mint],
    sizes: ["S", "M", "L", "XL"],
    image: "/img/mobile/fm-man.jpg",
    gallery: ["/img/mobile/fm-man.jpg", "/img/mobile/fm-pocket.jpg", "/img/mobile/fm-label.jpg", "/img/mobile/fm-hero.jpg"],
    sku: "BX-102",
    fresh: true,
  },
  {
    id: "fm-xalat",
    brand: "Bestex",
    name: "Tibbiy xalat (ayollar uchun)",
    kind: "xalat",
    gender: "ayol",
    price: 205_000,
    rating: 4.9,
    reviews: 86,
    colors: [white, navy, pink, black],
    sizes: ["S", "M", "L", "XL"],
    image: "/img/mobile/fm-coat.jpg",
    gallery: ["/img/mobile/fm-coat.jpg", "/img/mobile/fm-pocket.jpg", "/img/mobile/fm-label.jpg", "/img/mobile/fm-woman.jpg"],
    sku: "BX-201",
    fresh: true,
  },
  {
    id: "fm-cap",
    brand: "Bestex",
    name: "Bosh kiyim (unisex)",
    kind: "bosh",
    gender: "uniseks",
    price: 105_000,
    rating: 4.8,
    reviews: 64,
    colors: [mint, navy, black, white],
    sizes: ["S", "M", "L", "XL"],
    image: "/img/mobile/fm-cap.jpg",
    gallery: ["/img/mobile/fm-cap.jpg", "/img/mobile/fm-label.jpg", "/img/mobile/fm-pocket.jpg", "/img/mobile/fm-mint.jpg"],
    sku: "BX-301",
    fresh: true,
  },
  {
    id: "fm-qishki",
    brand: "Bestex",
    name: "Qishki tibbiy kurtka",
    kind: "qishki",
    gender: "uniseks",
    price: 245_000,
    rating: 4.6,
    reviews: 28,
    colors: [navy, black, mint],
    sizes: ["S", "M", "L", "XL"],
    image: "/img/mobile/fm-winter.jpg",
    gallery: ["/img/mobile/fm-winter.jpg", "/img/mobile/fm-pocket.jpg", "/img/mobile/fm-label.jpg", "/img/mobile/fm-man.jpg"],
    sku: "BX-401",
    fresh: true,
  },
  {
    id: "fm-shoe",
    brand: "Bestex",
    name: "Tibbiy poyabzal",
    kind: "poyabzal",
    gender: "uniseks",
    price: 165_000,
    rating: 4.6,
    reviews: 40,
    colors: [white, navy, black],
    sizes: ["S", "M", "L", "XL"],
    image: "/img/mobile/fm-shoe.jpg",
    gallery: ["/img/mobile/fm-shoe.jpg", "/img/mobile/fm-label.jpg", "/img/mobile/fm-pocket.jpg", "/img/mobile/fm-mint.jpg"],
    sku: "BX-501",
    fresh: true,
  },
  {
    id: "bestex-logo-scrub",
    brand: "BESTEX",
    name: "Bestex logo tibbiy scrub to‘plam",
    kind: "kostyum",
    gender: "ayol",
    price: 105_000,
    oldPrice: 130_000,
    discount: 19,
    rating: 4.8,
    reviews: 32,
    colors: [mint, navy, black, white],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    image: "/img/mobile/fm-mint.jpg",
    gallery: ["/img/mobile/fm-mint.jpg", "/img/mobile/fm-side.jpg", "/img/mobile/fm-pocket.jpg", "/img/mobile/fm-label.jpg"],
    sku: "BX-001",
    pdpOnly: true,
  },
];

export function getMobileForma(id: string) {
  return mobileForma.find((item) => item.id === id) ?? null;
}

export const LOGO_FEE = 25_000;
