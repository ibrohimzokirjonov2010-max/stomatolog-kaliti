export type FormaCat = "scrub" | "xalat" | "qalpoq" | "poyabzal" | "fartuk" | "aksessuar";
export type FormaGender = "erkak" | "ayol" | "uniseks";
export type FormaMaterial = "paxta" | "stretch" | "premium" | "anti";

export type Swatch = { id: string; hex: string; label: string };

export type DesktopForma = {
  slug: string;
  brand: string;
  brandKey: string;
  name: string;
  blurb: string;
  rating: number;
  reviews: number;
  sold?: number;
  price: number;
  oldPrice?: number;
  off?: number;
  colors: Swatch[];
  sizes: string[];
  gender: FormaGender;
  cat: FormaCat;
  material: FormaMaterial;
  image: string;
  gallery: string[];
  popularity: number;
  isNew?: boolean;
  featured?: boolean;
};

const teal: Swatch = { id: "teal", hex: "#1aa6a0", label: "Yashil (Teal)" };
const navy: Swatch = { id: "navy", hex: "#1d3d6e", label: "To‘q ko‘k" };
const white: Swatch = { id: "white", hex: "#f7f8fa", label: "Oq" };
const black: Swatch = { id: "black", hex: "#1c2430", label: "Qora" };
const purple: Swatch = { id: "purple", hex: "#6d4ea3", label: "Siyohrang" };
const green: Swatch = { id: "green", hex: "#2f8f4e", label: "Yashil" };
const wine: Swatch = { id: "wine", hex: "#7a3048", label: "Bordo" };
const cloth = ["XS", "S", "M", "L", "XL"];
const shoes = ["36", "37", "38", "39", "40"];

export const formaCats: { id: "all" | FormaCat; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "scrub", label: "Skrab to‘plam" },
  { id: "xalat", label: "Xalat" },
  { id: "qalpoq", label: "Qalpoq" },
  { id: "poyabzal", label: "Tibbiy poyabzal" },
  { id: "fartuk", label: "Fartuk" },
  { id: "aksessuar", label: "Aksessuarlar" },
];

export const formaGenders: { id: FormaGender; label: string }[] = [
  { id: "erkak", label: "Erkak" },
  { id: "ayol", label: "Ayol" },
  { id: "uniseks", label: "Uniseks" },
];

export const formaSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export const formaSwatches: Swatch[] = [teal, navy, white, black, purple, green, wine];

export const formaMaterials: { id: FormaMaterial; label: string }[] = [
  { id: "paxta", label: "Paxta - poliester" },
  { id: "stretch", label: "Stretch (cho‘ziluvchan)" },
  { id: "premium", label: "Premium mato" },
  { id: "anti", label: "Antibakterial" },
];

export const formaBrands: { id: string; label: string }[] = [
  { id: "bestex", label: "Bestex" },
  { id: "cherokee", label: "Cherokee" },
  { id: "dickies", label: "Dickies" },
  { id: "hnl", label: "HNL" },
  { id: "zhengxing", label: "Zhengxing" },
  { id: "mediforma", label: "Mediforma" },
  { id: "labwear", label: "Labwear" },
];

export const FORMA_PRICE_MAX = 1_000_000;

export const wholesaleTiers = [
  { qty: "10+ dona", off: "−10%" },
  { qty: "30+ dona", off: "−20%" },
  { qty: "50+ dona", off: "−30%" },
  { qty: "100+ dona", off: "Maxsus narx" },
];

export const sizeChart = [
  { size: "XS", chest: "80–84", waist: "64–68", height: "155–160" },
  { size: "S", chest: "84–88", waist: "68–72", height: "160–165" },
  { size: "M", chest: "88–92", waist: "70–74", height: "165–170" },
  { size: "L", chest: "92–96", waist: "74–78", height: "170–175" },
  { size: "XL", chest: "96–102", waist: "78–84", height: "175–180" },
  { size: "XXL", chest: "102–108", waist: "84–90", height: "180–185" },
];

export const LOGO_PRICE = 35_000;

const advantages = [
  "Elastik va qulay mato",
  "Nafas oluvchi va tez quriydigan",
  "Antibakterial ishlov",
  "Ko‘p martalik yuvishga bardoshli",
  "Cho‘kmaydi va rangini yo‘qotmaydi",
  "Amaliy cho‘ntaklar",
  "60°C gacha yuvish mumkin",
  "Ayollar va erkaklar uchun mos",
];

export { advantages as formaAdvantages };

function item(partial: DesktopForma): DesktopForma {
  return partial;
}

export const desktopForma: DesktopForma[] = [
  item({
    slug: "erkaklar-skrab-bestex",
    brand: "Bestex",
    brandKey: "bestex",
    name: "Erkaklar skrab to‘plam",
    blurb: "Paxta-poliester, qulay va nafas oladi",
    rating: 4.9,
    reviews: 120,
    price: 380_000,
    oldPrice: 450_000,
    off: 15,
    colors: [teal, navy, black],
    sizes: cloth,
    gender: "erkak",
    cat: "scrub",
    material: "paxta",
    image: "/img/forma/m-teal.jpg",
    gallery: ["/img/forma/m-teal.jpg", "/img/forma/m-navy.jpg", "/img/forma/detail.jpg"],
    popularity: 100,
  }),
  item({
    slug: "ayollar-skrab-cherokee",
    brand: "Cherokee",
    brandKey: "cherokee",
    name: "Ayollar skrab to‘plam",
    blurb: "Stretch mato, antibakterial",
    rating: 4.8,
    reviews: 86,
    price: 420_000,
    colors: [navy, teal, black, white],
    sizes: cloth,
    gender: "ayol",
    cat: "scrub",
    material: "stretch",
    image: "/img/forma/f-navy.jpg",
    gallery: ["/img/forma/f-navy.jpg", "/img/forma/f-teal.jpg", "/img/forma/fabric.jpg"],
    popularity: 99,
  }),
  item({
    slug: "tibbiy-xalat-hnl",
    brand: "HNL",
    brandKey: "hnl",
    name: "Tibbiy xalat (erkaklar)",
    blurb: "Premium mato, klinika logosi bilan",
    rating: 4.7,
    reviews: 52,
    price: 520_000,
    colors: [white, navy],
    sizes: cloth,
    gender: "erkak",
    cat: "xalat",
    material: "premium",
    image: "/img/forma/coat.jpg",
    gallery: ["/img/forma/coat.jpg", "/img/forma/m-white.jpg"],
    popularity: 98,
  }),
  item({
    slug: "ayollar-skrab-bestex",
    brand: "Bestex",
    brandKey: "bestex",
    name: "Ayollar skrab to‘plam",
    blurb: "Stretch mato, nafas oladi",
    rating: 4.8,
    reviews: 95,
    price: 390_000,
    colors: [purple, teal, navy, white],
    sizes: cloth,
    gender: "ayol",
    cat: "scrub",
    material: "stretch",
    image: "/img/forma/f-lilac.jpg",
    gallery: ["/img/forma/f-lilac.jpg", "/img/forma/f-teal.jpg", "/img/forma/fabric.jpg"],
    popularity: 97,
  }),
  item({
    slug: "tibbiy-poyabzal",
    brand: "Zhengxing",
    brandKey: "zhengxing",
    name: "Tibbiy poyabzal",
    blurb: "Yengil, sirpanmaydigan",
    rating: 4.6,
    reviews: 73,
    price: 290_000,
    colors: [white, black],
    sizes: shoes,
    gender: "uniseks",
    cat: "poyabzal",
    material: "premium",
    image: "/img/forma/shoes.jpg",
    gallery: ["/img/forma/shoes.jpg"],
    popularity: 96,
  }),
  item({
    slug: "tibbiy-qalpoq",
    brand: "Bestex",
    brandKey: "bestex",
    name: "Tibbiy qalpoq",
    blurb: "Paxta, sozlanadigan",
    rating: 4.5,
    reviews: 40,
    price: 85_000,
    colors: [navy, teal, white],
    sizes: ["S", "M", "L"],
    gender: "uniseks",
    cat: "qalpoq",
    material: "paxta",
    image: "/img/forma/cap.jpg",
    gallery: ["/img/forma/cap.jpg"],
    popularity: 95,
  }),
  item({
    slug: "himoya-fartuk",
    brand: "HNL",
    brandKey: "hnl",
    name: "Himoya fartuk",
    blurb: "Suv o‘tkazmaydigan qatlam",
    rating: 4.7,
    reviews: 38,
    price: 120_000,
    colors: [navy, teal],
    sizes: ["S", "M", "L", "XL"],
    gender: "uniseks",
    cat: "fartuk",
    material: "premium",
    image: "/img/forma/scrub-c.jpg",
    gallery: ["/img/forma/scrub-c.jpg", "/img/forma/coat.jpg"],
    popularity: 94,
  }),
  item({
    slug: "organayzer",
    brand: "Bestex",
    brandKey: "bestex",
    name: "Aksessuarlar (organayzer)",
    blurb: "Qulay va sig‘imli",
    rating: 4.5,
    reviews: 50,
    price: 95_000,
    colors: [black, navy],
    sizes: [],
    gender: "uniseks",
    cat: "aksessuar",
    material: "premium",
    image: "/img/forma/scrub-b.jpg",
    gallery: ["/img/forma/scrub-b.jpg"],
    popularity: 93,
  }),
  item({
    slug: "premium-stretch",
    brand: "BESTEX",
    brandKey: "bestex",
    name: "Stomatolog formasi Premium Stretch",
    blurb: "Elastik mato, nafas oladi, antibakterial ishlov",
    rating: 4.8,
    reviews: 126,
    sold: 210,
    price: 389_000,
    oldPrice: 450_000,
    off: 14,
    colors: [teal, navy, black, purple],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    gender: "ayol",
    cat: "scrub",
    material: "stretch",
    image: "/img/forma/f-teal.jpg",
    gallery: ["/img/forma/f-teal.jpg", "/img/forma/detail.jpg", "/img/forma/f-navy.jpg", "/img/forma/fabric.jpg", "/img/forma/f-lilac.jpg"],
    popularity: 90,
    featured: true,
  }),
  item({
    slug: "skrab-classic",
    brand: "BESTEX",
    brandKey: "bestex",
    name: "Erkaklar skrab to‘plam Classic",
    blurb: "Kundalik navbatchilik uchun klassik to‘plam",
    rating: 4.7,
    reviews: 64,
    price: 320_000,
    colors: [teal, navy],
    sizes: cloth,
    gender: "erkak",
    cat: "scrub",
    material: "paxta",
    image: "/img/forma/m-navy.jpg",
    gallery: ["/img/forma/m-navy.jpg", "/img/forma/m-teal.jpg"],
    popularity: 80,
  }),
  item({
    slug: "mediforma-ayol",
    brand: "MEDIFORMA",
    brandKey: "mediforma",
    name: "Ayollar skrab to‘plam",
    blurb: "Yengil to‘plam, tez quriydigan mato",
    rating: 4.8,
    reviews: 91,
    price: 355_000,
    colors: [navy, white, teal],
    sizes: cloth,
    gender: "ayol",
    cat: "scrub",
    material: "stretch",
    image: "/img/forma/f-green.jpg",
    gallery: ["/img/forma/f-green.jpg"],
    popularity: 79,
  }),
  item({
    slug: "xalat-erkak-bestex",
    brand: "BESTEX",
    brandKey: "bestex",
    name: "Erkaklar tibbiy xalat",
    blurb: "Klassik xalat, cho‘ntaklar bilan",
    rating: 4.6,
    reviews: 38,
    price: 330_000,
    colors: [white, navy],
    sizes: cloth,
    gender: "erkak",
    cat: "xalat",
    material: "premium",
    image: "/img/forma/m-white.jpg",
    gallery: ["/img/forma/m-white.jpg", "/img/forma/coat.jpg"],
    popularity: 78,
  }),
  item({
    slug: "labwear-xalat",
    brand: "LABWEAR",
    brandKey: "labwear",
    name: "Tibbiy xalat Premium",
    blurb: "Laboratoriya va qabulxona uchun",
    rating: 4.8,
    reviews: 55,
    price: 420_000,
    colors: [white, teal],
    sizes: cloth,
    gender: "uniseks",
    cat: "xalat",
    material: "premium",
    image: "/img/forma/scrub-e.jpg",
    gallery: ["/img/forma/scrub-e.jpg", "/img/forma/coat.jpg"],
    popularity: 77,
  }),
  item({
    slug: "skrab-bordo",
    brand: "BESTEX",
    brandKey: "bestex",
    name: "Skrab to‘plam Bordo",
    blurb: "To‘q bordo rang, stretch mato",
    rating: 4.7,
    reviews: 22,
    price: 350_000,
    colors: [wine, navy],
    sizes: cloth,
    gender: "ayol",
    cat: "scrub",
    material: "stretch",
    image: "/img/forma/f-black.jpg",
    gallery: ["/img/forma/f-black.jpg"],
    popularity: 76,
    isNew: true,
  }),
  item({
    slug: "cherokee-flex",
    brand: "CHEROKEE",
    brandKey: "cherokee",
    name: "Skrab to‘plam Flex",
    blurb: "Harakat erkinligi, elastik bel",
    rating: 4.9,
    reviews: 73,
    price: 390_000,
    colors: [navy, teal, black],
    sizes: cloth,
    gender: "uniseks",
    cat: "scrub",
    material: "stretch",
    image: "/img/forma/scrub-f.jpg",
    gallery: ["/img/forma/scrub-f.jpg", "/img/forma/f-navy.jpg"],
    popularity: 75,
  }),
  item({
    slug: "dickies-scrub",
    brand: "Dickies",
    brandKey: "dickies",
    name: "Dickies skrab to‘plam",
    blurb: "Zich to‘qima, kundalik kiyim",
    rating: 4.6,
    reviews: 44,
    price: 410_000,
    colors: [navy, black, teal],
    sizes: [...cloth, "2XL"],
    gender: "erkak",
    cat: "scrub",
    material: "paxta",
    image: "/img/forma/scrub-g.jpg",
    gallery: ["/img/forma/scrub-g.jpg"],
    popularity: 70,
  }),
  item({
    slug: "ayollar-xalat",
    brand: "Cherokee",
    brandKey: "cherokee",
    name: "Ayollar tibbiy xalat",
    blurb: "Yengil xalat, nafas oladi",
    rating: 4.7,
    reviews: 33,
    price: 360_000,
    colors: [white, purple],
    sizes: cloth,
    gender: "ayol",
    cat: "xalat",
    material: "premium",
    image: "/img/forma/scrub-h.jpg",
    gallery: ["/img/forma/scrub-h.jpg"],
    popularity: 68,
    isNew: true,
  }),
  item({
    slug: "qalpoq-cherokee",
    brand: "Cherokee",
    brandKey: "cherokee",
    name: "Jarrohlik qalpog‘i",
    blurb: "Paxta, bog‘ichli",
    rating: 4.4,
    reviews: 18,
    price: 45_000,
    colors: [green, navy, white],
    sizes: ["S", "M", "L"],
    gender: "uniseks",
    cat: "qalpoq",
    material: "paxta",
    image: "/img/forma/scrub-i.jpg",
    gallery: ["/img/forma/cap.jpg"],
    popularity: 60,
  }),
  item({
    slug: "poyabzal-bestex",
    brand: "Bestex",
    brandKey: "bestex",
    name: "Bestex tibbiy tufli",
    blurb: "Yengil tagcharm, oson tozalanadi",
    rating: 4.5,
    reviews: 29,
    price: 310_000,
    colors: [white, navy],
    sizes: ["37", "38", "39", "40", "41", "42"],
    gender: "uniseks",
    cat: "poyabzal",
    material: "premium",
    image: "/img/forma/shoes.jpg",
    gallery: ["/img/forma/shoes.jpg"],
    popularity: 66,
  }),
  item({
    slug: "fartuk-bestex",
    brand: "Bestex",
    brandKey: "bestex",
    name: "Gigiyena fartugi",
    blurb: "Namlikka chidamli old qatlam",
    rating: 4.3,
    reviews: 15,
    price: 98_000,
    colors: [teal, white],
    sizes: ["M", "L", "XL"],
    gender: "uniseks",
    cat: "fartuk",
    material: "anti",
    image: "/img/forma/scrub-j.jpg",
    gallery: ["/img/forma/scrub-j.jpg"],
    popularity: 58,
  }),
  item({
    slug: "organayzer-hnl",
    brand: "HNL",
    brandKey: "hnl",
    name: "Instrument organayzeri",
    blurb: "Cho‘ntaklar va kamar ilgagi",
    rating: 4.6,
    reviews: 21,
    price: 110_000,
    colors: [black, navy],
    sizes: [],
    gender: "uniseks",
    cat: "aksessuar",
    material: "premium",
    image: "/img/forma/scrub-k.jpg",
    gallery: ["/img/forma/scrub-k.jpg"],
    popularity: 57,
  }),
  item({
    slug: "scrub-3xl",
    brand: "Dickies",
    brandKey: "dickies",
    name: "Keng o‘lcham skrab",
    blurb: "2XL va 3XL, erkin bichim",
    rating: 4.4,
    reviews: 12,
    price: 430_000,
    colors: [navy, black],
    sizes: ["XL", "2XL", "3XL"],
    gender: "erkak",
    cat: "scrub",
    material: "paxta",
    image: "/img/forma/scrub-l.jpg",
    gallery: ["/img/forma/scrub-l.jpg"],
    popularity: 55,
    isNew: true,
  }),
  item({
    slug: "anti-scrub",
    brand: "HNL",
    brandKey: "hnl",
    name: "Antibakterial skrab",
    blurb: "Kumush ionli ishlov, stretch",
    rating: 4.8,
    reviews: 47,
    price: 460_000,
    colors: [teal, white, navy],
    sizes: cloth,
    gender: "uniseks",
    cat: "scrub",
    material: "anti",
    image: "/img/forma/scrub-a.jpg",
    gallery: ["/img/forma/scrub-a.jpg", "/img/forma/fabric.jpg"],
    popularity: 72,
  }),
  item({
    slug: "zhengxing-clog",
    brand: "Zhengxing",
    brandKey: "zhengxing",
    name: "Saboo tibbiy poyabzal",
    blurb: "Teshikli, yengil",
    rating: 4.2,
    reviews: 19,
    price: 210_000,
    colors: [white, black, navy],
    sizes: shoes,
    gender: "uniseks",
    cat: "poyabzal",
    material: "premium",
    image: "/img/forma/shoes.jpg",
    gallery: ["/img/forma/shoes.jpg"],
    popularity: 54,
  }),
  item({
    slug: "premium-qalpoq",
    brand: "Labwear",
    brandKey: "labwear",
    name: "Premium jarrohlik qalpog‘i",
    blurb: "Ikki qatlam, paxta",
    rating: 4.6,
    reviews: 16,
    price: 62_000,
    colors: [navy, green, white],
    sizes: ["M", "L"],
    gender: "uniseks",
    cat: "qalpoq",
    material: "paxta",
    image: "/img/forma/cap.jpg",
    gallery: ["/img/forma/cap.jpg"],
    popularity: 52,
  }),
];

const bySlug = new Map(desktopForma.map((item) => [item.slug, item]));

export function getDesktopForma(slug: string) {
  return bySlug.get(slug);
}

export function desktopFormaSlugs() {
  return desktopForma.map((item) => item.slug);
}

export function similarForma(slug: string) {
  if (slug === "premium-stretch") {
    return ["skrab-classic", "mediforma-ayol", "xalat-erkak-bestex", "labwear-xalat", "skrab-bordo", "cherokee-flex"]
      .map((id) => bySlug.get(id))
      .filter((item): item is DesktopForma => Boolean(item));
  }
  const current = bySlug.get(slug);
  return desktopForma.filter((item) => item.slug !== slug && (!current || item.cat === current.cat)).slice(0, 6);
}

export const formaReviews = [
  { name: "Dr. Kamola A.", text: "Mato yumshoq, cho‘ntaklar qulay. Uzoq navbatchilikda ham charchamadi.", stars: 5 },
  { name: "Dr. Sardor R.", text: "O‘lcham jadvali to‘g‘ri keldi. Rang yuvishda o‘chmadi.", stars: 5 },
  { name: "Madina S.", text: "Yetkazish tez bo‘ldi. Tikuvlari silliq, cho‘kmaydi.", stars: 4 },
];
