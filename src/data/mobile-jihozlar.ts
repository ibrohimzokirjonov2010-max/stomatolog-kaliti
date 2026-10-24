export type JihozKind = "kreslo" | "endomotor" | "rentgen" | "fiziodispenser" | "qolcha" | "sterilizatsiya";
export type JihozCond = "yangi" | "bu";

export type JihozSpec = { label: string; value: string };
export type JihozKit = { image: string; label: string };

export type MobileJihoz = {
  id: string;
  brand: string;
  pdpBrand?: string;
  name: string;
  pdpName?: string;
  kind: JihozKind;
  condition: JihozCond;
  badge: "Yangi" | "Original";
  price: number;
  oldPrice?: number;
  discount?: number;
  monthly: number;
  months: number;
  rating: number;
  reviews: number;
  image: string;
  gallery: string[];
  rank: number;
  specs?: JihozSpec[];
  moreSpecs?: JihozSpec[];
  kit?: JihozKit[];
};

export const jihozKinds: { id: JihozKind; label: string }[] = [
  { id: "kreslo", label: "Kreslolar" },
  { id: "endomotor", label: "Endomotor" },
  { id: "rentgen", label: "Rentgen" },
  { id: "fiziodispenser", label: "Fiziodispenser" },
  { id: "qolcha", label: "Qo‘lchalar" },
  { id: "sterilizatsiya", label: "Sterilizatsiya" },
];

const hero = "/img/mobile/jz-hero.jpg";
const tip = "/img/mobile/jz-tip.jpg";
const screen = "/img/mobile/jz-screen.jpg";
const cable = "/img/mobile/jz-cable.jpg";

export const mobileJihoz: MobileJihoz[] = [
  {
    id: "jz-ajax",
    brand: "Ajax",
    name: "Ajax AJ15 stomatologik kreslo",
    kind: "kreslo",
    condition: "yangi",
    badge: "Yangi",
    price: 45_800_000,
    monthly: 3_817_000,
    months: 12,
    rating: 0,
    reviews: 0,
    image: "/img/mobile/jz-chair.jpg",
    gallery: ["/img/mobile/jz-chair.jpg", "/img/mobile/jz-xray.jpg", "/img/mobile/jz-hand.jpg", "/img/mobile/jz-cable.jpg"],
    rank: 1,
  },
  {
    id: "jz-ecube",
    brand: "Eighteeth",
    pdpBrand: "Saeshin",
    name: "E-Cube Endomotor",
    pdpName: "Endomotor E-Cube",
    kind: "endomotor",
    condition: "yangi",
    badge: "Original",
    price: 6_120_000,
    oldPrice: 7_500_000,
    discount: 18,
    monthly: 510_000,
    months: 12,
    rating: 0,
    reviews: 0,
    image: "/img/mobile/jz-endo.jpg",
    gallery: [hero, tip, screen, cable],
    rank: 2,
    specs: [
      { label: "Tezlik", value: "100 – 2500 rpm" },
      { label: "Moment", value: "0.6 – 4.0 Ncm" },
      { label: "Apeksjudor", value: "Mavjud (integratsiyalashgan)" },
      { label: "Akkumulyator", value: "2000 mAh (Simsiz, qulay ishlash)" },
    ],
    moreSpecs: [
      { label: "Quvvat", value: "3.7 V" },
      { label: "Og‘irlik", value: "180 g" },
      { label: "Ishlash vaqti", value: "2 soat" },
      { label: "Kafolat", value: "12 oy" },
    ],
    kit: [
      { image: hero, label: "Bosh blok (E-Cube)" },
      { image: tip, label: "Endomotor nako‘nik" },
      { image: screen, label: "Zaryadlash stansiyasi" },
      { image: cable, label: "Adapter va kabel" },
      { image: tip, label: "Fayllar uchun ushlagich" },
      { image: cable, label: "Yo‘riqnoma" },
    ],
  },
  {
    id: "jz-nsk",
    brand: "NSK",
    name: "Surgic Pro2 fiziodispenser",
    kind: "fiziodispenser",
    condition: "yangi",
    badge: "Original",
    price: 24_500_000,
    monthly: 2_042_000,
    months: 12,
    rating: 0,
    reviews: 0,
    image: "/img/mobile/jz-physio.jpg",
    gallery: ["/img/mobile/jz-physio.jpg", tip, screen, cable],
    rank: 3,
  },
  {
    id: "jz-iroot",
    brand: "Woodpecker",
    name: "iRoot Pro apeksikator",
    kind: "endomotor",
    condition: "yangi",
    badge: "Yangi",
    price: 4_850_000,
    monthly: 404_000,
    months: 12,
    rating: 0,
    reviews: 0,
    image: "/img/mobile/jz-apex.jpg",
    gallery: ["/img/mobile/jz-apex.jpg", screen, tip, cable],
    rank: 4,
  },
  {
    id: "jz-xray",
    brand: "Planmeca",
    name: "ProX intraoral rentgen",
    kind: "rentgen",
    condition: "yangi",
    badge: "Original",
    price: 32_000_000,
    monthly: 2_667_000,
    months: 12,
    rating: 0,
    reviews: 0,
    image: "/img/mobile/jz-xray.jpg",
    gallery: ["/img/mobile/jz-xray.jpg", "/img/mobile/jz-chair.jpg", cable, screen],
    rank: 5,
  },
  {
    id: "jz-hand",
    brand: "NSK",
    name: "Ti-Max Z95L qo‘lcha",
    kind: "qolcha",
    condition: "yangi",
    badge: "Original",
    price: 4_800_000,
    monthly: 400_000,
    months: 12,
    rating: 0,
    reviews: 0,
    image: "/img/mobile/jz-hand.jpg",
    gallery: ["/img/mobile/jz-hand.jpg", tip, cable, screen],
    rank: 6,
  },
  {
    id: "jz-clave",
    brand: "Melag",
    name: "Vacuklav 31 B+ sterilizator",
    kind: "sterilizatsiya",
    condition: "yangi",
    badge: "Yangi",
    price: 42_500_000,
    monthly: 3_542_000,
    months: 12,
    rating: 0,
    reviews: 0,
    image: "/img/mobile/jz-clave.jpg",
    gallery: ["/img/mobile/jz-clave.jpg", cable, screen, "/img/mobile/jz-xray.jpg"],
    rank: 7,
  },
  {
    id: "jz-kavo-bu",
    brand: "KaVo",
    name: "Estetica E70 kreslo",
    kind: "kreslo",
    condition: "bu",
    badge: "Original",
    price: 28_000_000,
    monthly: 2_334_000,
    months: 12,
    rating: 0,
    reviews: 0,
    image: "/img/mobile/jz-chair.jpg",
    gallery: ["/img/mobile/jz-chair.jpg", "/img/mobile/jz-hand.jpg", cable, screen],
    rank: 8,
  },
];

export function getMobileJihoz(id: string) {
  return mobileJihoz.find((item) => item.id === id) ?? null;
}

export const JIZHOZ_RESULT_TOTAL = 116;
