import type { Product } from "@/data/products";

export type MobileSurplusChip = "all" | "kompozit" | "bond" | "sement" | "implant" | "fayllar" | "boshqa";

export type MobileSurplusItem = {
  id: string;
  name: string;
  brand: string;
  spec: string;
  chip: Exclude<MobileSurplusChip, "all">;
  chipLabel: string;
  condition: string;
  expiry: string;
  qty: string;
  price: number;
  oldPrice: number;
  discount: number;
  city: string;
  image: string;
  gallery: string[];
  subtitle: string;
  description: string;
  seller: string;
  rating: number;
  reviews: number;
};

export const MOBILE_SURPLUS_TOTAL = 128;

export const mobileSurplusChips: { id: MobileSurplusChip; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "kompozit", label: "Kompozit" },
  { id: "bond", label: "Bond" },
  { id: "sement", label: "Sement" },
  { id: "implant", label: "Implant" },
  { id: "fayllar", label: "Fayllar" },
];

export const mobileSurplusSorts = [
  { id: "new", label: "Eng yangi" },
  { id: "cheap", label: "Arzonroq" },
  { id: "dear", label: "Qimmatroq" },
  { id: "discount", label: "Chegirma" },
] as const;

export type MobileSurplusSort = (typeof mobileSurplusSorts)[number]["id"];

const filtekGallery = [
  "/img/mobile/om-filtek.jpg",
  "/img/mobile/om-filtek-box.jpg",
  "/img/mobile/om-filtek-syr.jpg",
  "/img/mobile/om-filtek-tip.jpg",
  "/img/mobile/om-filtek-shade.jpg",
];

export const mobileSurplusItems: MobileSurplusItem[] = [
  {
    id: "filtek-z350-xt-a2",
    name: "3M Filtek Universal kompozit",
    brand: "3M",
    spec: "A2, 4 g",
    chip: "kompozit",
    chipLabel: "Kompozit",
    condition: "Yangi, ochilmagan",
    expiry: "12.2026",
    qty: "3 ta",
    price: 850_000,
    oldPrice: 1_200_000,
    discount: 29,
    city: "Toshkent",
    image: filtekGallery[0],
    gallery: filtekGallery,
    subtitle: "Universal kompozit plomba materiali, 4 g",
    description:
      "3M Filtek Z350 XT universal kompozit materiali. Rang: A2. To‘plamda 3 ta shprits (har biri 4 g). Mahsulot yangi, ochilmagan, yaroqlilik muddati 12.2026. Klinikada ortiqcha qolgan, sifatli va original mahsulot.",
    seller: "Dr. Dilnoza Karimova",
    rating: 0,
    reviews: 0,
  },
  {
    id: "om-protaper",
    name: "ProTaper Next fayllar",
    brand: "Dentsply Sirona",
    spec: "25 mm, 6 ta",
    chip: "fayllar",
    chipLabel: "Fayllar",
    condition: "Yangi",
    expiry: "11.2027",
    qty: "6 ta",
    price: 650_000,
    oldPrice: 900_000,
    discount: 28,
    city: "Samarqand",
    image: "/img/mobile/om-protaper.jpg",
    gallery: ["/img/mobile/om-protaper.jpg"],
    subtitle: "Endodontik fayllar, 25 mm, 6 ta",
    description: "ProTaper Next fayllar to‘plami. Yangi, ochilmagan. Yaroqlilik muddati 11.2027. Samarqanddagi klinikada ortiqcha qolgan.",
    seller: "Dr. Dilnoza Karimova",
    rating: 0,
    reviews: 0,
  },
  {
    id: "om-tokuyama",
    name: "Tokuyama Universal Bond",
    brand: "Tokuyama",
    spec: "5 ml",
    chip: "bond",
    chipLabel: "Bond",
    condition: "Yangi, ochilmagan",
    expiry: "06.2026",
    qty: "1 ta",
    price: 450_000,
    oldPrice: 700_000,
    discount: 36,
    city: "Toshkent",
    image: "/img/mobile/om-tokuyama.jpg",
    gallery: ["/img/mobile/om-tokuyama.jpg"],
    subtitle: "Universal bond, 5 ml",
    description: "Tokuyama Universal Bond. Yangi, ochilmagan. Yaroqlilik muddati 06.2026. Toshkentdagi klinikada ortiqcha qolgan.",
    seller: "Dr. Dilnoza Karimova",
    rating: 0,
    reviews: 0,
  },
  {
    id: "om-biooss",
    name: "Geistlich Bio-Oss suyak materiali",
    brand: "Geistlich",
    spec: "0.5 g",
    chip: "implant",
    chipLabel: "Implant",
    condition: "Yangi",
    expiry: "10.2026",
    qty: "1 ta",
    price: 1_250_000,
    oldPrice: 1_600_000,
    discount: 22,
    city: "Toshkent",
    image: "/img/mobile/om-biooss.jpg",
    gallery: ["/img/mobile/om-biooss.jpg"],
    subtitle: "Suyak o‘rnini bosuvchi material, 0.5 g",
    description: "Geistlich Bio-Oss suyak materiali. Yangi. Yaroqlilik muddati 10.2026. Toshkentdagi klinikada ortiqcha qolgan.",
    seller: "Dr. Dilnoza Karimova",
    rating: 0,
    reviews: 0,
  },
  {
    id: "om-relyx",
    name: "RelyX U200 sement",
    brand: "3M",
    spec: "A2, 11 g",
    chip: "sement",
    chipLabel: "Sement",
    condition: "Yangi",
    expiry: "08.2026",
    qty: "1 ta",
    price: 720_000,
    oldPrice: 950_000,
    discount: 24,
    city: "Buxoro",
    image: "/img/mobile/om-relyx.jpg",
    gallery: ["/img/mobile/om-relyx.jpg"],
    subtitle: "O‘z-o‘zidan yopishadigan sement, A2, 11 g",
    description: "3M RelyX U200 sement. Yangi. Yaroqlilik muddati 08.2026. Buxorodagi klinikada ortiqcha qolgan.",
    seller: "Dr. Dilnoza Karimova",
    rating: 0,
    reviews: 0,
  },
  {
    id: "om-gloves",
    name: "Medicom nitril qo‘lqoplar",
    brand: "Medicom",
    spec: "M, 100 dona",
    chip: "boshqa",
    chipLabel: "Himoya",
    condition: "Yangi",
    expiry: "12.2027",
    qty: "100 dona",
    image: "/img/mobile/om-gloves.jpg",
    gallery: ["/img/mobile/om-gloves.jpg"],
    price: 120_000,
    oldPrice: 180_000,
    discount: 33,
    city: "Andijon",
    subtitle: "Nitril qo‘lqoplar, M, 100 dona",
    description: "Medicom nitril qo‘lqoplar. Yangi quti. Yaroqlilik muddati 12.2027. Andijondagi klinikada ortiqcha qolgan.",
    seller: "Dr. Dilnoza Karimova",
    rating: 0,
    reviews: 0,
  },
];

export function getMobileSurplus(id: string) {
  return mobileSurplusItems.find((item) => item.id === id) ?? null;
}

export function mobileSurplusProduct(item: MobileSurplusItem): Product {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: "materiallar",
    price: item.price,
    oldPrice: item.oldPrice,
    discount: item.discount,
    rating: item.rating,
    reviews: item.reviews,
    inStock: true,
    delivery: item.city,
    image: item.image,
    description: item.description,
  };
}

export function detailTitle(item: MobileSurplusItem) {
  return item.id === "filtek-z350-xt-a2" ? "Filtek Z350 XT A2" : item.name;
}
