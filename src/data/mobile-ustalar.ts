export type UstaKind = "kreslo" | "rentgen" | "ornatish" | "tamirlash" | "konsultatsiya";

export type UstaService = { name: string; note: string; price: number; image: string };
export type UstaReview = { name: string; date: string; rating: number; text: string };

export type MobileUsta = {
  id: string;
  name: string;
  role: string;
  city: string;
  status: "onlayn" | "band";
  verified: boolean;
  rating: number;
  reviews: number;
  years: number;
  fromPrice: number;
  kinds: UstaKind[];
  skills: string[];
  extraPhotos: number;
  image: string;
  hero: string;
  avatar: string;
  works: string[];
  rank: number;
  jobs?: string;
  warranty?: string;
  speed?: string;
  services?: UstaService[];
  reviewList?: UstaReview[];
  about?: string;
};

export const ustaKinds: { id: "all" | UstaKind; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "kreslo", label: "Kreslo" },
  { id: "rentgen", label: "Rentgen" },
  { id: "ornatish", label: "O‘rnatish" },
  { id: "tamirlash", label: "Ta‘mirlash" },
  { id: "konsultatsiya", label: "Konsultatsiya" },
];

const chair = "/img/mobile/ut-work-chair.jpg";
const hand = "/img/mobile/ut-work-hand.jpg";
const board = "/img/mobile/ut-work-board.jpg";
const hero = "/img/mobile/ut-aziz-hero.jpg";

const azizServices: UstaService[] = [
  { name: "Turbina ta‘miri", note: "Tozalash, podshipnik almashtirish", price: 350_000, image: hand },
  { name: "Qo‘lcha ta‘miri", note: "Tozalash, moylash, detallar almashtirish", price: 250_000, image: hand },
  { name: "Endomotor ta‘miri", note: "Diagnostika va ta‘mirlash", price: 400_000, image: board },
  { name: "Fiziodispenser ta‘miri", note: "Diagnostika, plata ta‘miri", price: 500_000, image: board },
  { name: "Stomatologik kreslo ta‘miri", note: "Gidravlika, elektronika, umumiy servis", price: 800_000, image: chair },
];

export const mobileUstalar: MobileUsta[] = [
  {
    id: "azizbek-tursunov",
    name: "Azizbek Tursunov",
    role: "Stomatologik jihozlar ta‘miri",
    city: "Toshkent",
    status: "onlayn",
    verified: true,
    rating: 4.9,
    reviews: 128,
    years: 5,
    fromPrice: 250_000,
    kinds: ["kreslo", "rentgen", "tamirlash"],
    skills: ["Kreslo", "Rentgen", "Fiziodispenser", "Turbina", "Qo‘lchalar"],
    extraPhotos: 3,
    image: "/img/mobile/ut-aziz.jpg",
    hero,
    avatar: "/img/mobile/ut-aziz-face.jpg",
    works: [board, hand, chair, hero, hand, board],
    rank: 1,
    jobs: "500+",
    warranty: "1 yil",
    speed: "Tez",
    services: azizServices,
    reviewList: [
      { name: "Dilshodbek", date: "12 mart 2025", rating: 5, text: "Turbina ta‘mirini juda sifatli qilib berdi. Tez va professional. Tavsiya qilaman!" },
      { name: "Malika", date: "2 fevral 2025", rating: 5, text: "Kreslo gidravlikasini o‘z vaqtida tuzatdi. Narxi ham adolatli." },
      { name: "Jasur", date: "18 yanvar 2025", rating: 4, text: "Endomotorni diagnostika qilib, ertasi kuni qaytardi." },
    ],
    about: "Stomatologik kreslo, rentgen va qo‘l asboblarini ta‘mirlayman. Toshkent bo‘ylab chiqaman, kafolat 1 yil.",
  },
  {
    id: "shahzod-karimov",
    name: "Shahzod Karimov",
    role: "Stomatologik jihozlar ta‘miri",
    city: "Toshkent",
    status: "band",
    verified: false,
    rating: 4.8,
    reviews: 96,
    years: 8,
    fromPrice: 200_000,
    kinds: ["tamirlash"],
    skills: ["Endomotor", "Apekslokator", "Ultrasonik"],
    extraPhotos: 4,
    image: "/img/mobile/ut-shahzod.jpg",
    hero: "/img/mobile/ut-shahzod.jpg",
    avatar: "/img/mobile/ut-shahzod.jpg",
    works: [board, hand, chair, board],
    rank: 2,
    jobs: "320+",
    warranty: "6 oy",
    speed: "1–2 kun",
    about: "Endomotor va apekslokator ta‘miri. Hozir band, keyingi bo‘sh vaqt ertaga.",
  },
  {
    id: "jasur-mirzayev",
    name: "Jasur Mirzayev",
    role: "Qo‘lchalar va turbinalar ta‘miri",
    city: "Toshkent",
    status: "onlayn",
    verified: true,
    rating: 4.9,
    reviews: 210,
    years: 7,
    fromPrice: 150_000,
    kinds: ["tamirlash"],
    skills: ["Qo‘lcha", "Turbina", "Mikromotor"],
    extraPhotos: 5,
    image: "/img/mobile/ut-jasur.jpg",
    hero: "/img/mobile/ut-jasur.jpg",
    avatar: "/img/mobile/ut-jasur.jpg",
    works: [hand, board, chair, hand],
    rank: 3,
    jobs: "410+",
    warranty: "1 yil",
    speed: "Tez",
    about: "Turbina va mikromotorlarni tozalab, podshipnikini almashtiraman.",
  },
  {
    id: "otabek-nazarov",
    name: "Otabek Nazarov",
    role: "Jihoz o‘rnatish va montaj",
    city: "Toshkent",
    status: "onlayn",
    verified: true,
    rating: 4.7,
    reviews: 54,
    years: 6,
    fromPrice: 400_000,
    kinds: ["ornatish", "kreslo"],
    skills: ["O‘rnatish", "Kreslo", "Kompressor"],
    extraPhotos: 2,
    image: "/img/mobile/ut-aziz.jpg",
    hero: chair,
    avatar: "/img/mobile/ut-aziz-face.jpg",
    works: [chair, board],
    rank: 4,
    about: "Yangi kreslo va kompressorni o‘rnatib, ishga tushiraman.",
  },
  {
    id: "dilnoza-karimova",
    name: "Dilnoza Karimova",
    role: "Jihoz bo‘yicha maslahatchi",
    city: "Toshkent",
    status: "onlayn",
    verified: true,
    rating: 4.6,
    reviews: 40,
    years: 4,
    fromPrice: 80_000,
    kinds: ["konsultatsiya"],
    skills: ["Konsultatsiya", "Tanlov", "Smeta"],
    extraPhotos: 1,
    image: "/img/mobile/ut-aziz-face.jpg",
    hero: "/img/mobile/ut-aziz-face.jpg",
    avatar: "/img/mobile/ut-aziz-face.jpg",
    works: [chair, hand],
    rank: 5,
    about: "Klinikaga qanday jihoz olishni maslahat beraman.",
  },
  {
    id: "bekzod-aliyev",
    name: "Bekzod Aliyev",
    role: "Rentgen apparatlari ustasi",
    city: "Samarqand",
    status: "band",
    verified: false,
    rating: 4.5,
    reviews: 22,
    years: 9,
    fromPrice: 300_000,
    kinds: ["rentgen", "tamirlash"],
    skills: ["Rentgen", "CBCT"],
    extraPhotos: 2,
    image: "/img/mobile/ut-shahzod.jpg",
    hero: "/img/mobile/ut-shahzod.jpg",
    avatar: "/img/mobile/ut-shahzod.jpg",
    works: [board, chair],
    rank: 6,
    about: "Samarqandda rentgen va CBCT apparatlariga xizmat qilaman.",
  },
];

export function getMobileUsta(id: string) {
  return mobileUstalar.find((item) => item.id === id) ?? null;
}

export function ustaServicesOf(item: MobileUsta): UstaService[] {
  return item.services ?? [
    { name: item.role, note: item.city, price: item.fromPrice, image: item.works[0] ?? item.image },
  ];
}

export function ustaReviewsOf(item: MobileUsta): UstaReview[] {
  return item.reviewList ?? [
    { name: "Dilshodbek", date: "12 mart 2025", rating: item.rating >= 4.8 ? 5 : 4, text: "Ishini sifatli va o‘z vaqtida bajardi." },
  ];
}
