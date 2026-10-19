export type JihozCat = "ustanovka" | "rentgen" | "skaner" | "avtoklav" | "mikroskop" | "kompressor" | "uchlik" | "lampa";
export type JihozCond = "yangi" | "ishlatilgan" | "korgazma";

export type DesktopJihoz = {
  slug: string;
  brand: string;
  brandKey: string;
  name: string;
  cat: JihozCat;
  condition: JihozCond;
  year: number;
  warranty: number;
  spec: string;
  price: number;
  months: number;
  monthly: number;
  leasing: boolean;
  install: boolean;
  official: boolean;
  city: string;
  rating: number;
  reviews: number;
  sold: number;
  image: string;
  gallery: string[];
  popularity: number;
};

export const jihozCats: { id: "all" | JihozCat; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "ustanovka", label: "Stomatologik ustanovka" },
  { id: "rentgen", label: "Rentgen va CBCT" },
  { id: "skaner", label: "Intraoral skaner" },
  { id: "avtoklav", label: "Avtoklav va sterilizatsiya" },
  { id: "mikroskop", label: "Mikroskop" },
  { id: "kompressor", label: "Kompressor va aspirator" },
  { id: "uchlik", label: "Uchliklar" },
  { id: "lampa", label: "Lampa" },
];

export const catLabel = (cat: JihozCat) => jihozCats.find((item) => item.id === cat)?.label ?? cat;

export const jihozConds: { id: JihozCond; label: string }[] = [
  { id: "yangi", label: "Yangi" },
  { id: "ishlatilgan", label: "Ishlatilgan" },
  { id: "korgazma", label: "Ko‘rgazmali" },
];

export const jihozBrands: { id: string; label: string }[] = [
  { id: "sirona", label: "Sirona" },
  { id: "planmeca", label: "Planmeca" },
  { id: "kavo", label: "KaVo" },
  { id: "nsk", label: "NSK" },
  { id: "wh", label: "W&H" },
  { id: "zeiss", label: "Carl Zeiss" },
  { id: "shape", label: "3Shape" },
  { id: "melag", label: "Melag" },
  { id: "cattani", label: "Cattani" },
  { id: "ivoclar", label: "Ivoclar" },
  { id: "fengdan", label: "Fengdan" },
  { id: "runyes", label: "Runyes" },
  { id: "anthos", label: "Anthos" },
  { id: "diplomat", label: "Diplomat" },
];

export const jihozWarranties = [6, 12, 24, 36];
export const jihozCities = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg‘ona", "Namangan"];
export const JIZOZ_PRICE_MAX = 500_000_000;

const chair = "/img/jihoz/chair.jpg";
const chair2 = "/img/jihoz/chair2.jpg";
const cbct = "/img/jihoz/cbct.jpg";
const scanner = "/img/jihoz/d-trios-5.jpg";
const scope = "/img/jihoz/scope.jpg";
const autoclave = "/img/jihoz/autoclave.jpg";
const compressor = "/img/jihoz/compressor.jpg";
const lamp = "/img/jihoz/d-bluephase-n.jpg";
const unit = "/img/jihoz/unit.jpg";
const hand = "/img/shop/m-timax.jpg";
const xray = "/img/jihoz/cbct.jpg";
const suction = "/img/jihoz/compressor.jpg";

function item(partial: DesktopJihoz): DesktopJihoz {
  return partial;
}

const featured: DesktopJihoz[] = [
  item({ slug: "sirona-intego", brand: "Sirona", brandKey: "sirona", name: "Dentsply Sirona Intego", cat: "ustanovka", condition: "yangi", year: 2024, warranty: 24, spec: "O‘rnatish va trening kiritilgan", price: 185_000_000, months: 12, monthly: 15_420_000, leasing: true, install: true, official: true, city: "Toshkent", rating: 4.8, reviews: 36, sold: 18, image: "/img/jihoz/d-sirona-intego.jpg", gallery: ["/img/jihoz/d-sirona-intego.jpg"], popularity: 100 }),
  item({ slug: "planmeca-promax", brand: "Planmeca", brandKey: "planmeca", name: "Planmeca ProMax 3D Classic", cat: "rentgen", condition: "yangi", year: 2023, warranty: 24, spec: "O‘rnatish va kalibrovka", price: 420_000_000, months: 24, monthly: 21_000_000, leasing: true, install: true, official: true, city: "Toshkent", rating: 4.9, reviews: 22, sold: 9, image: "/img/jihoz/d-planmeca-promax.jpg", gallery: ["/img/jihoz/d-planmeca-promax.jpg"], popularity: 99 }),
  item({ slug: "trios-5", brand: "3Shape", brandKey: "shape", name: "3Shape TRIOS 5", cat: "skaner", condition: "yangi", year: 2024, warranty: 24, spec: "Dasturiy ta’minot kiritilgan", price: 185_000_000, months: 12, monthly: 15_420_000, leasing: true, install: true, official: true, city: "Toshkent", rating: 4.8, reviews: 41, sold: 27, image: "/img/jihoz/d-trios-5.jpg", gallery: ["/img/jihoz/d-trios-5.jpg"], popularity: 98 }),
  item({ slug: "zeiss-extaro", brand: "Carl Zeiss", brandKey: "zeiss", name: "Carl Zeiss Extaro 300", cat: "mikroskop", condition: "yangi", year: 2023, warranty: 24, spec: "O‘rnatish va trening", price: 560_000_000, months: 24, monthly: 28_000_000, leasing: true, install: true, official: true, city: "Toshkent", rating: 4.9, reviews: 14, sold: 6, image: "/img/jihoz/d-zeiss-extaro.jpg", gallery: ["/img/jihoz/d-zeiss-extaro.jpg"], popularity: 97 }),
  item({ slug: "kavo-e70", brand: "KaVo", brandKey: "kavo", name: "KaVo Estetica E70", cat: "ustanovka", condition: "ishlatilgan", year: 2021, warranty: 12, spec: "Texnik ko‘rikdan o‘tgan", price: 120_000_000, months: 12, monthly: 10_000_000, leasing: true, install: false, official: true, city: "Toshkent", rating: 4.6, reviews: 19, sold: 11, image: "/img/jihoz/d-kavo-e70.jpg", gallery: ["/img/jihoz/d-kavo-e70.jpg"], popularity: 96 }),
  item({ slug: "melag-31b", brand: "Melag", brandKey: "melag", name: "Melag Vacuklav 31 B+", cat: "avtoklav", condition: "yangi", year: 2024, warranty: 24, spec: "O‘rnatish va servis", price: 42_500_000, months: 12, monthly: 3_540_000, leasing: true, install: true, official: true, city: "Toshkent", rating: 4.7, reviews: 33, sold: 40, image: "/img/jihoz/d-melag-31b.jpg", gallery: ["/img/jihoz/d-melag-31b.jpg"], popularity: 95 }),
  item({ slug: "cattani-ac300", brand: "Cattani", brandKey: "cattani", name: "Cattani AC 300", cat: "kompressor", condition: "yangi", year: 2024, warranty: 24, spec: "O‘rnatish kiritilgan", price: 25_000_000, months: 12, monthly: 2_080_000, leasing: false, install: true, official: true, city: "Samarqand", rating: 4.6, reviews: 17, sold: 22, image: "/img/jihoz/d-cattani-ac300.jpg", gallery: ["/img/jihoz/d-cattani-ac300.jpg"], popularity: 94 }),
  item({ slug: "bluephase-n", brand: "Ivoclar", brandKey: "ivoclar", name: "Ivoclar Bluephase N", cat: "lampa", condition: "yangi", year: 2024, warranty: 24, spec: "Original mahsulot", price: 8_500_000, months: 6, monthly: 1_420_000, leasing: false, install: false, official: true, city: "Toshkent", rating: 4.8, reviews: 54, sold: 80, image: "/img/jihoz/d-bluephase-n.jpg", gallery: ["/img/jihoz/d-bluephase-n.jpg"], popularity: 93 }),
  item({ slug: "fengdan-ql2028", brand: "Fengdan", brandKey: "fengdan", name: "Dental unit Fengdan QL2028", cat: "ustanovka", condition: "yangi", year: 2024, warranty: 24, spec: "Sertifikatlangan o‘rnatish", price: 68_500_000, months: 12, monthly: 5_708_000, leasing: true, install: true, official: true, city: "Toshkent", rating: 4.9, reviews: 48, sold: 220, image: "/img/jihoz/d-fengdan-main.jpg", gallery: ["/img/jihoz/d-fengdan-main.jpg", "/img/jihoz/d-fengdan-t2.jpg", "/img/jihoz/d-fengdan-t3.jpg", "/img/jihoz/d-fengdan-t4.jpg", "/img/jihoz/d-fengdan-t5.jpg"], popularity: 90 }),
  item({ slug: "fengdan-ql2028-plus", brand: "Fengdan", brandKey: "fengdan", name: "Fengdan QL2028 Plus", cat: "ustanovka", condition: "yangi", year: 2024, warranty: 24, spec: "Kengaytirilgan komplekt", price: 72_000_000, months: 12, monthly: 6_000_000, leasing: true, install: true, official: true, city: "Toshkent", rating: 4.8, reviews: 36, sold: 40, image: "/img/jihoz/d-fengdan-plus.jpg", gallery: ["/img/jihoz/d-fengdan-plus.jpg"], popularity: 80 }),
  item({ slug: "runyes-s600", brand: "Runyes", brandKey: "runyes", name: "Runyes S600", cat: "ustanovka", condition: "yangi", year: 2023, warranty: 24, spec: "Gidravlik kreslo", price: 58_900_000, months: 12, monthly: 4_910_000, leasing: true, install: true, official: false, city: "Toshkent", rating: 4.7, reviews: 28, sold: 31, image: "/img/jihoz/d-runyes-s600.jpg", gallery: ["/img/jihoz/d-runyes-s600.jpg"], popularity: 79 }),
  item({ slug: "anthos-a7", brand: "Anthos", brandKey: "anthos", name: "Anthos A7 Plus", cat: "ustanovka", condition: "yangi", year: 2024, warranty: 36, spec: "Ergonomik blok", price: 96_000_000, months: 18, monthly: 5_400_000, leasing: true, install: true, official: true, city: "Toshkent", rating: 4.9, reviews: 41, sold: 15, image: "/img/jihoz/d-anthos-a7.jpg", gallery: ["/img/jihoz/d-anthos-a7.jpg"], popularity: 78 }),
  item({ slug: "diplomat-da370", brand: "Diplomat", brandKey: "diplomat", name: "Diplomat ADEPT DA370", cat: "ustanovka", condition: "yangi", year: 2023, warranty: 24, spec: "Yevropa yig‘imi", price: 84_500_000, months: 18, monthly: 4_800_000, leasing: true, install: true, official: true, city: "Samarqand", rating: 4.6, reviews: 19, sold: 12, image: "/img/jihoz/d-diplomat-da370.jpg", gallery: ["/img/jihoz/d-diplomat-da370.jpg"], popularity: 77 }),
];

const extraPool: Array<Pick<DesktopJihoz, "brand" | "brandKey" | "name" | "cat" | "image" | "price" | "spec">> = [
  { brand: "NSK", brandKey: "nsk", name: "NSK Ti-Max Z95L", cat: "uchlik", image: hand, price: 4_800_000, spec: "Optikali 1:5" },
  { brand: "W&H", brandKey: "wh", name: "W&H Implantmed", cat: "uchlik", image: hand, price: 18_500_000, spec: "Implantologiya motori" },
  { brand: "NSK", brandKey: "nsk", name: "NSK Surgic Pro2", cat: "uchlik", image: hand, price: 21_000_000, spec: "Jarrohlik motor" },
  { brand: "Planmeca", brandKey: "planmeca", name: "Planmeca ProX", cat: "rentgen", image: xray, price: 32_000_000, spec: "Intraoral rentgen" },
  { brand: "Melag", brandKey: "melag", name: "Melag Vacuklav 43 B", cat: "avtoklav", image: autoclave, price: 54_000_000, spec: "Katta kamera" },
  { brand: "Cattani", brandKey: "cattani", name: "Cattani Turbo-Smart", cat: "kompressor", image: suction, price: 19_500_000, spec: "Aspiratsiya tizimi" },
  { brand: "3Shape", brandKey: "shape", name: "3Shape TRIOS 3", cat: "skaner", image: scanner, price: 96_000_000, spec: "Simsiz skaner" },
  { brand: "Carl Zeiss", brandKey: "zeiss", name: "Carl Zeiss OPMI pico", cat: "mikroskop", image: scope, price: 210_000_000, spec: "LED yoritish" },
  { brand: "KaVo", brandKey: "kavo", name: "KaVo MASTERsurg", cat: "uchlik", image: hand, price: 16_800_000, spec: "Jarrohlik uchlik" },
  { brand: "Ivoclar", brandKey: "ivoclar", name: "Ivoclar Bluephase PowerCure", cat: "lampa", image: lamp, price: 6_200_000, spec: "Yuqori quvvat" },
  { brand: "Sirona", brandKey: "sirona", name: "Sirona Heliodent Plus", cat: "rentgen", image: xray, price: 28_000_000, spec: "Devorga o‘rnatiladi" },
  { brand: "Fengdan", brandKey: "fengdan", name: "Fengdan ay-7", cat: "ustanovka", image: chair, price: 49_000_000, spec: "Asosiy komplekt" },
];

const conds: JihozCond[] = ["yangi", "yangi", "yangi", "ishlatilgan", "korgazma"];
const cities = jihozCities;
const extras: DesktopJihoz[] = [];
let n = 0;
while (featured.length + extras.length < 86) {
  const base = extraPool[n % extraPool.length];
  const warranty = jihozWarranties[n % jihozWarranties.length];
  const price = base.price + (n % 5) * 500_000;
  extras.push({
    slug: `${base.brandKey}-${base.cat}-${n + 1}`,
    brand: base.brand,
    brandKey: base.brandKey,
    name: n < extraPool.length ? base.name : `${base.name} ${2022 + (n % 4)}`,
    cat: base.cat,
    condition: conds[n % conds.length],
    year: 2021 + (n % 5),
    warranty,
    spec: base.spec,
    price,
    months: warranty >= 24 ? 24 : 12,
    monthly: Math.round(price / (warranty >= 24 ? 24 : 12)),
    leasing: n % 3 !== 2,
    install: n % 2 === 0,
    official: n % 4 !== 3,
    city: cities[n % cities.length],
    rating: 4.4 + (n % 5) * 0.1,
    reviews: 8 + (n % 20),
    sold: 3 + (n % 15),
    image: base.image,
    gallery: [base.image],
    popularity: 50 - n * 0.01,
  });
  n += 1;
}

export const desktopJihoz: DesktopJihoz[] = [...featured, ...extras];

export function getDesktopJihoz(slug: string) {
  return desktopJihoz.find((item) => item.slug === slug);
}

export function desktopJihozSlugs() {
  return desktopJihoz.map((item) => item.slug);
}

const similarSlugs = ["fengdan-ql2028-plus", "runyes-s600", "anthos-a7", "diplomat-da370"];

export function similarJihoz(slug: string) {
  if (slug === "fengdan-ql2028") {
    return similarSlugs.map((id) => getDesktopJihoz(id)).filter((item): item is DesktopJihoz => Boolean(item));
  }
  const current = getDesktopJihoz(slug);
  return desktopJihoz.filter((item) => item.slug !== slug && item.cat === current?.cat).slice(0, 4);
}

export const fengdanSpecs: [string, string][] = [
  ["Model", "QL2028"],
  ["Quvvat", "220V / 50Hz"],
  ["LED chiroq", "8 000 – 35 000 lyuks"],
  ["Kreslo harakati", "Gidravlik, 9 xotira holati"],
  ["Boshqaruv paneli", "Sensorli, ergonomik displey"],
  ["Uchliklar", "3 teshikli / 2 teshikli (ixtiyoriy)"],
  ["Ultratovush skaler", "Mavjud (EMS/NSK)"],
  ["Pnevmatik tupurgich", "Mavjud"],
  ["Suv tizimi", "Avtomatik dezinfeksiya"],
  ["Og‘irligi", "210 kg"],
];

export const fengdanKit = [
  "Stomatologik kreslo",
  "Shifokor bloki (3 ta uchlik)",
  "Assistent bloki",
  "LED chiroq",
  "Pnevmatik tupurgich",
  "Suv va havo tizimi",
  "Raqamli boshqaruv paneli",
  "Ultratovush skaler",
  "O‘rnatish to‘plami",
  "Foydalanish yo‘riqnomasi",
];

export const fengdanWarranty = [
  "2 yil rasmiy kafolat",
  "Toshkentda servis markazi",
  "Original ehtiyot qismlar",
  "Onlayn texnik qo‘llab-quvvatlash",
  "O‘rnatish to‘plami",
];

export const fengdanPoints = [
  "Zamonaviy ergonomik dizayn",
  "Shifokor va bemor uchun qulay",
  "Ishonchli va bardoshli komponentlar",
  "Keng funksionallik",
  "Klinikalar uchun optimal yechim",
];

export const fengdanAbout =
  "Fengdan QL2028 — zamonaviy va ishonchli stomatologik ustanovka. Ergonomik dizayn, shifokor va bemor uchun qulaylik, keng funksionallik va sifatli materiallar klinikangiz uchun ideal tanlovdir.";

export const jihozReviews = [
  { name: "Dr. Kamola A.", rating: 5, text: "O‘rnatish tez bo‘ldi, kreslo barqaror ishlaydi.", date: "12.08.2026" },
  { name: "Dr. Sardor R.", rating: 5, text: "Shifokor bloki qulay, skaler to‘plamda keldi.", date: "03.07.2026" },
  { name: "Madina S.", rating: 4, text: "Narx va komplekt mos. Servis qo‘ng‘iroqqa tez javob berdi.", date: "19.06.2026" },
];

export const techProfile = {
  name: "Sardor Rahimov",
  role: "Texnik",
  rating: 4.9,
  reviews: 128,
  brands: ["Fengdan", "Sirona", "KaVo"],
  price: 1_500_000,
  image: "/img/jihoz/d-tech.jpg",
};
