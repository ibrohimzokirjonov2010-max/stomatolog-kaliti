export type Direction =
  | "terapiya"
  | "endodontiya"
  | "implantologiya"
  | "ortopediya"
  | "ortodontiya"
  | "parodontologiya"
  | "digital"
  | "boshqaruv";

export type Level = "bosh" | "orta" | "ekspert";
export type CourseFormat = "video" | "kurs" | "vebinar";

export type Course = {
  id: string;
  title: string;
  blurb: string;
  teacher: string;
  role: string;
  avatar: string;
  direction: Direction;
  level: Level;
  format: CourseFormat;
  price: number;
  oldPrice?: number;
  badge?: "bepul" | "off" | "cert" | "yangi";
  offLabel?: string;
  lessons: number;
  hours: number;
  lang: string;
  rating: number;
  reviews: number;
  duration: string;
  popularity: number;
  image: string;
};

export type ContinueItem = {
  id: string;
  title: string;
  seen: number;
  total: number;
  progress: number;
  time: string;
  image: string;
};

export const directions: { id: "all" | Direction; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "terapiya", label: "Terapiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "ortopediya", label: "Ortopediya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "parodontologiya", label: "Parodontologiya" },
  { id: "digital", label: "Digital stomatologiya" },
  { id: "boshqaruv", label: "Klinika boshqaruvi" },
];

export const levels: { id: "all" | Level; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "bosh", label: "Boshlang‘ich" },
  { id: "orta", label: "O‘rta" },
  { id: "ekspert", label: "Ekspert" },
];

export const formats: { id: "all" | CourseFormat; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "video", label: "Video dars" },
  { id: "kurs", label: "Kurs" },
  { id: "vebinar", label: "Vebinar yozuvi" },
];

const A = {
  kamola: "/images/usta-featured.png",
  sardor: "/images/usta-sardor.png",
  malika: "/img/seminars/speaker.jpg",
  javohir: "/images/usta-jamshid.png",
  dilshod: "/images/usta-akbar.png",
  aziza: "/img/design-pr13/ui/avatar.png",
  farukh: "/images/avatar-azizbek.png",
  nodirbek: "/images/usta-sardor.png",
  aziz: "/images/avatar-azizbek.png",
};

export const continueItems: ContinueItem[] = [
  {
    id: "kompozit",
    title: "Kompozit restavratsiya: qatlamlama usul",
    seen: 7,
    total: 12,
    progress: 62,
    time: "16:42",
    image: "/img/hub/cont-1.jpg",
  },
  {
    id: "implant-joy",
    title: "Implant joylashtirish: bosqichma-bosqich",
    seen: 9,
    total: 18,
    progress: 50,
    time: "22:15",
    image: "/img/hub/cont-2.jpg",
  },
  {
    id: "mikro",
    title: "Mikroskop yordamida endodontiya",
    seen: 5,
    total: 14,
    progress: 36,
    time: "18:05",
    image: "/img/hub/cont-3.jpg",
  },
];

const primaryCourses: Course[] = [
  {
    id: "kompozit",
    title: "Kompozit restavratsiya: qatlamlama usul",
    blurb: "Oldingi va orqa tishlarda estetik restavratsiya protokollari.",
    teacher: "Dr. Kamola Abdullayeva",
    role: "Estetik stomatolog",
    avatar: A.kamola,
    direction: "terapiya",
    level: "orta",
    format: "video",
    price: 0,
    badge: "bepul",
    lessons: 12,
    hours: 6,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: "16:42",
    popularity: 100,
    image: "/img/hub/course-1.jpg",
  },
  {
    id: "implant-toj",
    title: "Implantologiya: implantdan tojgacha",
    blurb: "Diagnostika, implant joylashtirish va protezik bosqichlar.",
    teacher: "Dr. Sardor Raximov",
    role: "Implantolog, PhD",
    avatar: A.sardor,
    direction: "implantologiya",
    level: "ekspert",
    format: "kurs",
    price: 600_000,
    oldPrice: 800_000,
    badge: "off",
    offLabel: "−25%",
    lessons: 18,
    hours: 10,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: "22:15",
    popularity: 98,
    image: "/img/hub/course-2.jpg",
  },
  {
    id: "mikro",
    title: "Mikroskop yordamida endodontiya",
    blurb: "Mikroskopda ishlash va murakkab kanallar davolashi.",
    teacher: "Dr. Malika Karimova",
    role: "Endodontist",
    avatar: A.malika,
    direction: "endodontiya",
    level: "ekspert",
    format: "kurs",
    price: 750_000,
    badge: "cert",
    lessons: 14,
    hours: 8,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: "16:05",
    popularity: 96,
    image: "/img/hub/course-3.jpg",
  },
  {
    id: "dsd",
    title: "Digital Smile Design: foto va wax-up",
    blurb: "Raqamli rejalashtirish va bemor bilan muloqot.",
    teacher: "Dr. Javohir Ahmedov",
    role: "Protetist",
    avatar: A.javohir,
    direction: "digital",
    level: "orta",
    format: "kurs",
    price: 550_000,
    badge: "yangi",
    lessons: 10,
    hours: 5,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: "26:30",
    popularity: 94,
    image: "/img/hub/course-4.jpg",
  },
  {
    id: "orto-proto",
    title: "Ortodontiyada zamonaviy protokollar",
    blurb: "Tashxis, reja va aligner/breket davolash.",
    teacher: "Dr. Dilshod Tursunov",
    role: "Ortodont",
    avatar: A.dilshod,
    direction: "ortodontiya",
    level: "orta",
    format: "kurs",
    price: 450_000,
    badge: "yangi",
    lessons: 8,
    hours: 4,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: "19:12",
    popularity: 90,
    image: "/img/hub/course-5.jpg",
  },
  {
    id: "sinus",
    title: "Suyak augmentatsiyasi va sinus lifting",
    blurb: "Amaliy video darslar va klinik holatlar.",
    teacher: "Dr. Aziza Mirzayeva",
    role: "Jarroh-implantolog",
    avatar: A.aziza,
    direction: "implantologiya",
    level: "ekspert",
    format: "video",
    price: 680_000,
    badge: "cert",
    lessons: 16,
    hours: 9,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: "24:18",
    popularity: 88,
    image: "/img/hub/course-6.jpg",
  },
  {
    id: "paro",
    title: "Parodontologiya: klinik yondashuv",
    blurb: "Zamonaviy davolash protokollari.",
    teacher: "Dr. Farukh Khaydarov",
    role: "Parodontolog",
    avatar: A.farukh,
    direction: "parodontologiya",
    level: "ekspert",
    format: "kurs",
    price: 490_000,
    lessons: 11,
    hours: 6,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: "15:36",
    popularity: 84,
    image: "/img/hub/course-7.jpg",
  },
  {
    id: "mkt",
    title: "Klinika boshqaruvi va marketing",
    blurb: "Stomatologik klinikani samarali boshqarish.",
    teacher: "Dr. Nodirbek Ismoilov",
    role: "Klinika rahbari",
    avatar: A.nodirbek,
    direction: "boshqaruv",
    level: "bosh",
    format: "vebinar",
    price: 390_000,
    lessons: 9,
    hours: 5,
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    duration: "28:40",
    popularity: 80,
    image: "/img/hub/course-8.jpg",
  },
];

const extraPool: Array<Pick<Course, "title" | "blurb" | "teacher" | "role" | "direction" | "level" | "format" | "price" | "avatar">> = [
  { title: "Oldingi tishlar: kompozit qatlamlari", blurb: "Shade selection va polishing protokoli.", teacher: "Dr. Kamola Abdullayeva", role: "Estetik stomatolog", direction: "terapiya", level: "bosh", format: "video", price: 0, avatar: A.kamola },
  { title: "Kanal topish: mikroskop asoslari", blurb: "MB2 va kalsifikatsiyalangan kanallar.", teacher: "Dr. Malika Karimova", role: "Endodontist", direction: "endodontiya", level: "orta", format: "video", price: 320_000, avatar: A.malika },
  { title: "Immediate implant: case selection", blurb: "Bir vaqtda implant va vaqtinchalik toj.", teacher: "Dr. Sardor Raximov", role: "Implantolog, PhD", direction: "implantologiya", level: "ekspert", format: "kurs", price: 890_000, avatar: A.sardor },
  { title: "Kronka va ko‘prik: raqamli ish oqimi", blurb: "Skaner, dizayn va sementlash.", teacher: "Dr. Javohir Ahmedov", role: "Protetist", direction: "ortopediya", level: "orta", format: "kurs", price: 610_000, avatar: A.javohir },
  { title: "Aligner: refinement va attachment", blurb: "Reja tuzatish va bemor nazorati.", teacher: "Dr. Dilshod Tursunov", role: "Ortodont", direction: "ortodontiya", level: "ekspert", format: "vebinar", price: 540_000, avatar: A.dilshod },
  { title: "Peri-implantit: erta tashxis", blurb: "Yallig‘lanishni to‘xtatish protokollari.", teacher: "Dr. Farukh Khaydarov", role: "Parodontolog", direction: "parodontologiya", level: "orta", format: "video", price: 0, avatar: A.farukh },
  { title: "CBCT o‘qish: implant rejalash", blurb: "Suyak hajmi va nerv masofasi.", teacher: "Dr. Aziza Mirzayeva", role: "Jarroh-implantolog", direction: "digital", level: "orta", format: "kurs", price: 470_000, avatar: A.aziza },
  { title: "Qabulxona skriptlari", blurb: "Administrator uchun bemor bilan muloqot.", teacher: "Dr. Nodirbek Ismoilov", role: "Klinika rahbari", direction: "boshqaruv", level: "bosh", format: "vebinar", price: 180_000, avatar: A.nodirbek },
  { title: "Bolalar terapiyasi: pulpotomiya", blurb: "Sut tishlarida xavfsiz protokol.", teacher: "Dr. Kamola Abdullayeva", role: "Estetik stomatolog", direction: "terapiya", level: "orta", format: "kurs", price: 260_000, avatar: A.kamola },
  { title: "Qayta endodontik davolash", blurb: "Sindirilgan asbob va perforatsiya.", teacher: "Dr. Malika Karimova", role: "Endodontist", direction: "endodontiya", level: "ekspert", format: "kurs", price: 820_000, avatar: A.malika },
  { title: "Soft tissue: paypaslash va chok", blurb: "Implant atrofi yumshoq to‘qima.", teacher: "Dr. Sardor Raximov", role: "Implantolog, PhD", direction: "implantologiya", level: "ekspert", format: "video", price: 730_000, avatar: A.sardor },
  { title: "Vinir: prep va mock-up", blurb: "Minimal invaziv preparatsiya.", teacher: "Dr. Javohir Ahmedov", role: "Protetist", direction: "ortopediya", level: "ekspert", format: "kurs", price: 640_000, avatar: A.javohir },
  { title: "Bolalar ortodontiyasi", blurb: "Erta tashxis va apparat tanlash.", teacher: "Dr. Dilshod Tursunov", role: "Ortodont", direction: "ortodontiya", level: "bosh", format: "video", price: 0, avatar: A.dilshod },
  { title: "Gingival plastika", blurb: "Tabassum chizig‘ini tuzatish.", teacher: "Dr. Farukh Khaydarov", role: "Parodontolog", direction: "parodontologiya", level: "ekspert", format: "vebinar", price: 510_000, avatar: A.farukh },
  { title: "Foto protokol: klinik surat", blurb: "Retraktor, fon va rang balansi.", teacher: "Dr. Aziza Mirzayeva", role: "Jarroh-implantolog", direction: "digital", level: "bosh", format: "video", price: 210_000, avatar: A.aziza },
  { title: "Narxlar va KPI", blurb: "Kreslo bandligi va oylik reja.", teacher: "Dr. Nodirbek Ismoilov", role: "Klinika rahbari", direction: "boshqaruv", level: "orta", format: "kurs", price: 350_000, avatar: A.nodirbek },
];

export const courses: Course[] = [
  ...primaryCourses,
  ...extraPool.map((item, index) => ({
    ...item,
    id: `extra-${index + 1}`,
    lessons: 6 + (index % 5),
    hours: 3 + (index % 4),
    lang: "O‘zbek",
    rating: 0 + (index % 5) * 0.1,
    reviews: 0 + index * 3,
    duration: `${12 + index}:${(10 + index * 3) % 60}`,
    popularity: 70 - index,
    image: `/img/hub/course-${(index % 8) + 1}.jpg`,
    badge: (item.price === 0 ? "bepul" : index % 4 === 0 ? "yangi" : undefined) as Course["badge"],
  })),
];

export const certificates = [
  { id: "c1", title: "Implantologiya: asosiy kurs", meta: "EMC 8 ball", date: "12.09.2024" },
  { id: "c2", title: "Endodontiya master-klass", meta: "EMC 6 ball", date: "18.05.2024" },
  { id: "c3", title: "Digital Smile Design", meta: "EMC 5 ball", date: "10.03.2024" },
];

export const whyLearn = [
  { title: "Amaliy va klinik yondashuv", text: "Real klinik holatlar asosida" },
  { title: "Yetakchi mutaxassislardan", text: "O‘zbekiston va xalqaro spikerlar" },
  { title: "Sertifikat va CME ballari", text: "Kasbiy rivojlanish tajribasi" },
  { title: "Istalgan vaqtda, istalgan qurilmada", text: "Kompyuter, planshet yoki telefon orqali" },
];

export type BookLang = "O‘zbek" | "Rus" | "Ingliz";
export type BookFormat = "bosma" | "pdf";

export type Book = {
  id: string;
  title: string;
  authors: string;
  year: number;
  pages: string;
  lang: BookLang;
  rating: number;
  reviews: number;
  price: number;
  oldPrice?: number;
  badge?: "best" | "off" | "yangi";
  offLabel?: string;
  formats: BookFormat[];
  stock: "ombor" | "preorder";
  publisher: string;
  category: string;
  image: string;
  popularity: number;
  sample: string;
};

export const bookCategories = ["Barchasi", "Terapiya", "Endodontiya", "Implantologiya", "Ortopediya", "Ortodontiya", "Jarrohlik", "Anatomiya", "Atlaslar"];

export const publishers = [
  { id: "Quintessence", count: 28 },
  { id: "Elsevier", count: 31 },
  { id: "Springer", count: 12 },
  { id: "StomaMedia", count: 18 },
  { id: "Boshqalar", count: 90 },
];

export const books: Book[] = [
  {
    id: "misch",
    title: "Contemporary Implant Dentistry",
    authors: "Carl E. Misch",
    year: 2021,
    pages: "1040 sahifa",
    lang: "Ingliz",
    rating: 0,
    reviews: 0,
    price: 420_000,
    badge: "best",
    formats: ["bosma", "pdf"],
    stock: "ombor",
    publisher: "Quintessence",
    category: "Implantologiya",
    image: "/img/hub/book-1.jpg",
    popularity: 100,
    sample: "Implant rejalashda suyak zichligi, protez fazosi va yuklama o‘qi birga ko‘riladi. Namuna bob diagnostika varag‘i va birinchi jarrohlik qadamlarini qisqa ko‘rsatadi.",
  },
  {
    id: "pathways",
    title: "Pathways of the Pulp",
    authors: "Kenneth H. Hargreaves",
    year: 2021,
    pages: "616 sahifa",
    lang: "Ingliz",
    rating: 0,
    reviews: 0,
    price: 480_000,
    oldPrice: 600_000,
    badge: "off",
    offLabel: "−20%",
    formats: ["bosma", "pdf"],
    stock: "ombor",
    publisher: "Elsevier",
    category: "Endodontiya",
    image: "/img/hub/book-2.jpg",
    popularity: 96,
    sample: "Pulp diagnostikasi, irrigatsiya va obturatsiya bo‘yicha namuna sahifa. To‘liq matn muallif nashrida; bu yerda faqat mazmun tavsifi.",
  },
  {
    id: "shill",
    title: "Fundamentals of Fixed Prosthodontics",
    authors: "Herbert T. Shillingburg",
    year: 2012,
    pages: "772 sahifa",
    lang: "Ingliz",
    rating: 0,
    reviews: 0,
    price: 510_000,
    formats: ["bosma", "pdf"],
    stock: "ombor",
    publisher: "Quintessence",
    category: "Ortopediya",
    image: "/img/hub/book-3.jpg",
    popularity: 90,
    sample: "Qo‘zg‘almas protezlashda preparatsiya chegarasi, vaqtinchalik konstruksiya va sement tanlash haqida qisqa namuna.",
  },
  {
    id: "proffit",
    title: "Proffit Ortodontiya",
    authors: "William R. Proffit",
    year: 2018,
    pages: "352 sahifa",
    lang: "Ingliz",
    rating: 0,
    reviews: 0,
    price: 520_000,
    formats: ["bosma", "pdf"],
    stock: "ombor",
    publisher: "Elsevier",
    category: "Ortodontiya",
    image: "/img/hub/book-4.jpg",
    popularity: 88,
    sample: "O‘sish, malokluzion tashxis va davolash chegaralari bo‘yicha kirish bobining qisqa tavsifi.",
  },
  {
    id: "rizaev",
    title: "Terapevtik stomatologiya",
    authors: "A. R. Rizaev",
    year: 2022,
    pages: "540 sahifa",
    lang: "O‘zbek",
    rating: 0,
    reviews: 0,
    price: 250_000,
    badge: "yangi",
    formats: ["bosma"],
    stock: "ombor",
    publisher: "StomaMedia",
    category: "Terapiya",
    image: "/img/hub/book-5.jpg",
    popularity: 92,
    sample: "Kariyes, pulp va parodont diagnostikasi o‘zbek tilida. Namuna — birinchi bobdagi klinik ko‘rik tartibi.",
  },
  {
    id: "netter",
    title: "Atlas of Human Anatomy",
    authors: "Frank H. Netter",
    year: 2019,
    pages: "564 sahifa",
    lang: "Ingliz",
    rating: 0,
    reviews: 0,
    price: 390_000,
    formats: ["bosma", "pdf"],
    stock: "ombor",
    publisher: "Elsevier",
    category: "Anatomiya",
    image: "/img/hub/book-6.jpg",
    popularity: 94,
    sample: "Bosh va bo‘yin plitalarining ro‘yxati. Bu namuna atlas sahifasini qayta chizmaydi, faqat bo‘lim tartibini ko‘rsatadi.",
  },
  {
    id: "lindhe",
    title: "Clinical Periodontology and Implant Dentistry",
    authors: "Jan Lindhe, Niklaus Lang",
    year: 2015,
    pages: "1440 sahifa",
    lang: "Ingliz",
    rating: 0,
    reviews: 0,
    price: 510_000,
    oldPrice: 600_000,
    badge: "off",
    offLabel: "−15%",
    formats: ["bosma", "pdf"],
    stock: "preorder",
    publisher: "Springer",
    category: "Parodontologiya",
    image: "/img/hub/book-7.jpg",
    popularity: 86,
    sample: "Parodont tekshiruvi va implant atrofi to‘qimalari bo‘yicha mundarija namuna. To‘liq matn nashriyotda.",
  },
  {
    id: "endo-surg",
    title: "Endodontic Surgery",
    authors: "Byungook Kim",
    year: 2020,
    pages: "PDF · 120 MB",
    lang: "Ingliz",
    rating: 0,
    reviews: 0,
    price: 470_000,
    formats: ["pdf"],
    stock: "ombor",
    publisher: "Boshqalar",
    category: "Jarrohlik",
    image: "/img/hub/book-8.jpg",
    popularity: 78,
    sample: "Apikal jarrohlikda kesma, retropreparatsiya va tikish bo‘yicha qisqa protokol tavsifi.",
  },
];

export const featuredBook: Book = {
  id: "renouard",
  title: "Atlas of Dental Implantology",
  authors: "Franck Renouard",
  year: 2021,
  pages: "352 sahifa",
  lang: "Ingliz",
  rating: 0,
  reviews: 0,
  price: 375_000,
  oldPrice: 500_000,
  formats: ["bosma", "pdf"],
  stock: "ombor",
  publisher: "Quintessence",
  category: "Atlaslar",
  image: "/img/hub/book-featured.jpg",
  popularity: 99,
  sample: "Haftaning tanlovi: implant atlasidagi bosqichma-bosqich protokolning mundarija sahifasi. To‘liq sahifalar xarid qilingach ochiladi.",
};

export const library = [
  { id: "lib1", title: "Implantologiya asoslari", author: "Dr. S. Raximov", meta: "PDF · 245 MB", image: "/img/hub/book-1.jpg" },
  { id: "lib2", title: "Endodontiya atlasi", author: "Dr. M. Karimova", meta: "PDF · 180 MB", image: "/img/hub/book-2.jpg" },
  { id: "lib3", title: "Estetik restavratsiya", author: "Dr. K. Abdullayeva", meta: "PDF · 96 MB", image: "/img/hub/book-5.jpg" },
];

export type Platform = "telegram" | "youtube" | "instagram" | "podcast";

export type Channel = {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  topic: string;
  lang: "O‘zbek" | "Rus" | "Ingliz";
  subscribers: number;
  rating: number;
  reviews: number;
  about: string;
  tags: [string, string];
  verified: boolean;
  image: string;
  popularity: number;
};

export const channelTopics = ["Barchasi", "Endodontiya", "Implantologiya", "Ortodontiya", "Estetika", "Klinika marketingi", "Vakansiyalar", "Material sotuvi"];

export const channels: Channel[] = [
  { id: "stomuz", name: "Stomatologlar UZ", handle: "@stomatologlar_uz", platform: "telegram", topic: "Endodontiya", lang: "O‘zbek", subscribers: 24500, rating: 0, reviews: 0, about: "Klinik holatlar, protokollar, yangiliklar va hamkasblar tajribasi.", tags: ["Umumiy", "Klinik holatlar"], verified: true, image: "/img/hub/channel-1.jpg", popularity: 100 },
  { id: "implant", name: "Implant Club Tashkent", handle: "@implant_club_tashkent", platform: "telegram", topic: "Implantologiya", lang: "O‘zbek", subscribers: 18200, rating: 0, reviews: 0, about: "Implantologiya bo‘yicha amaliy holatlar, jarrohlik videolari.", tags: ["Implantologiya", "Jarrohlik"], verified: true, image: "/img/hub/channel-2.jpg", popularity: 92 },
  { id: "endo", name: "Endo Masters", handle: "@endomasters", platform: "youtube", topic: "Endodontiya", lang: "Rus", subscribers: 41300, rating: 0, reviews: 0, about: "Endodontiya: mikroskop, protokollar va klinik holatlar.", tags: ["Endodontiya", "Mikroskop"], verified: true, image: "/img/hub/channel-3.jpg", popularity: 98 },
  { id: "aesth", name: "Dental Aesthetics", handle: "@dental_aesthetics_uz", platform: "instagram", topic: "Estetika", lang: "O‘zbek", subscribers: 15700, rating: 0, reviews: 0, about: "Estetik stomatologiya, smile design, kompozit va keramik restavratsiyalar.", tags: ["Estetika", "Smile design"], verified: true, image: "/img/hub/channel-4.jpg", popularity: 84 },
  { id: "kamola", name: "Dr. Kamola Dental", handle: "@dr.kamola_dental", platform: "youtube", topic: "Estetika", lang: "O‘zbek", subscribers: 9400, rating: 0, reviews: 0, about: "Amaliy klinik videolar, davolash jarayoni bosqichma-bosqich.", tags: ["Umumiy", "Davolash jarayoni"], verified: false, image: "/img/hub/channel-5.jpg", popularity: 80 },
  { id: "talk", name: "Dental Talk Podcast", handle: "@dental_talk", platform: "podcast", topic: "Klinika marketingi", lang: "Ingliz", subscribers: 22100, rating: 0, reviews: 0, about: "Stomatologlar uchun podkast: mutaxassislar bilan suhbatlar.", tags: ["Podkast", "Halqaro tajriba"], verified: false, image: "/img/hub/channel-6.jpg", popularity: 86 },
  { id: "marketing", name: "Klinika Marketing", handle: "@clinic_marketing", platform: "instagram", topic: "Klinika marketingi", lang: "Rus", subscribers: 12300, rating: 0, reviews: 0, about: "Klinika boshqaruvi, marketing va bemorlarni jalb qilish.", tags: ["Marketing", "Klinika boshqaruvi"], verified: false, image: "/img/hub/channel-7.jpg", popularity: 74 },
  { id: "materials", name: "Dental Materials UZ", handle: "@dental_materials_uz", platform: "telegram", topic: "Material sotuvi", lang: "O‘zbek", subscribers: 8900, rating: 0, reviews: 0, about: "Stomatologik materiallar, yangiliklar va amaliy tavsiyalar.", tags: ["Material sotuvi", "Yangiliklar"], verified: false, image: "/img/hub/channel-8.jpg", popularity: 70 },
  { id: "orto", name: "Ortodontiya UZ", handle: "@ortodontiya_uz", platform: "telegram", topic: "Ortodontiya", lang: "O‘zbek", subscribers: 22400, rating: 0, reviews: 0, about: "Aligner va breket protokollari, klinik holatlar.", tags: ["Ortodontiya", "Klinik holatlar"], verified: true, image: "/img/hub/channel-9.jpg", popularity: 83 },
  { id: "pedia", name: "Pediatric Dentistry", handle: "@pediatric_dentistry", platform: "youtube", topic: "Terapiya", lang: "Ingliz", subscribers: 37800, rating: 0, reviews: 0, about: "Bolalar stomatologiyasi bo‘yicha xalqaro darslar.", tags: ["Umumiy", "Davolash jarayoni"], verified: false, image: "/img/hub/channel-10.jpg", popularity: 88 },
  { id: "cbct", name: "Radiology & CBCT", handle: "@radiology_cbct", platform: "youtube", topic: "Implantologiya", lang: "Rus", subscribers: 14600, rating: 0, reviews: 0, about: "CBCT o‘qish va implant rejalashtirish.", tags: ["Implantologiya", "Mikroskop"], verified: false, image: "/img/hub/channel-11.jpg", popularity: 76 },
  { id: "oral", name: "Oral Surgery", handle: "@oral_surgery_uz", platform: "instagram", topic: "Jarrohlik", lang: "O‘zbek", subscribers: 26100, rating: 0, reviews: 0, about: "Og‘iz jarrohligi: kesma, chok va asoratlar.", tags: ["Jarrohlik", "Klinik holatlar"], verified: false, image: "/img/hub/channel-12.jpg", popularity: 79 },
];

export const editorPickIds = ["stomuz", "endo", "aesth", "marketing", "talk"];
export const savedChannelIds = ["implant", "endo", "aesth"];

export const officialChannels = [
  { id: "off-news", name: "StomaHub yangiliklari", handle: "@stomahub_news", subscribers: 12400 },
  { id: "off-comm", name: "StomaHub Community", handle: "@stomahub_community", subscribers: 8400 },
];

export function subsFull(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function subsK(n: number) {
  return `${(n / 1000).toFixed(1)}K`;
}

export type PostKind = "keys" | "savol" | "muhokama";

export type CasePhoto = { src: string; label: string };

export type CommunityPost = {
  id: string;
  author: string;
  role: string;
  city: string;
  avatar: string;
  title: string;
  body: string;
  kind: PostKind;
  time: string;
  category: string;
  fdi?: string;
  diagnoz?: string;
  davolash?: string;
  natija?: string;
  photos: CasePhoto[];
  tags: string[];
  likes: number;
  comments: number;
  mine?: boolean;
};

export const communityCategories = ["Barchasi", "Endodontiya", "Implantologiya", "Ortodontiya", "Estetika", "Jarrohlik", "Ortopediya", "Parodontologiya", "Klinik holatlar"];

export const communityPosts: CommunityPost[] = [
  {
    id: "p1",
    author: "Dr. Malika Yusupova",
    role: "Endodontist",
    city: "Toshkent",
    avatar: A.malika,
    title: "36-tish: surunkali apikal periodontit — qayta endodontik davolash",
    body: "Bemor 36-tishda og‘riq va diskomfort bilan murojaat qildi. Avvalgi davolash sifatsiz bo‘lgan. Mikroskop ostida qayta endodontik davolash amalga oshirildi. Natijalar va rentgen nazoratini ulashmoqchiman.",
    kind: "keys",
    time: "2 kun oldin",
    category: "Endodontiya",
    fdi: "36",
    diagnoz: "Surunkali apikal periodontit",
    davolash: "Mikroskop ostida qayta endodontik davolash",
    natija: "6 oylik nazoratda simptomlar yo‘q",
    photos: [
      { src: "/img/hub/case-a1.jpg", label: "Oldin" },
      { src: "/img/hub/case-a2.jpg", label: "Davolash jarayoni" },
      { src: "/img/hub/case-a3.jpg", label: "Keyin" },
      { src: "/img/hub/case-a4.jpg", label: "Keyin" },
    ],
    tags: ["#Endodontiya", "#Klinik keys", "#Mikroskop", "#Qayta davolash"],
    likes: 42,
    comments: 12,
  },
  {
    id: "p2",
    author: "Dr. Aziz Karimov",
    role: "Implantolog",
    city: "Toshkent",
    avatar: A.aziz,
    title: "Sinus lifting + implant: 6 oylik natijalar",
    body: "Chap yuqori jag‘da suyak yetishmovchiligi tufayli sinus lifting va implantatsiya (Straumann) amalga oshirildi. 6 oylik nazoratda barqaror natija. Sizning fikringiz qanday?",
    kind: "keys",
    time: "5 kun oldin",
    category: "Implantologiya",
    fdi: "26",
    diagnoz: "Suyak yetishmovchiligi",
    davolash: "Sinus lifting + implant (Straumann)",
    natija: "6 oyda to‘liq osseointegratsiya",
    photos: [
      { src: "/img/hub/case-b1.jpg", label: "Oldin" },
      { src: "/img/hub/case-b2.jpg", label: "CBCT" },
      { src: "/img/hub/case-b3.jpg", label: "Jarrohlik jarayoni" },
      { src: "/img/hub/case-b4.jpg", label: "Implant" },
      { src: "/img/hub/case-b5.jpg", label: "6 oy keyin" },
    ],
    tags: ["#Implantologiya", "#Sinus lifting", "#Case"],
    likes: 36,
    comments: 8,
  },
  {
    id: "p3",
    author: "Dr. Kamola Abdullayeva",
    role: "Estetik stomatolog",
    city: "Toshkent",
    avatar: A.kamola,
    title: "Kompozitda qatlam qalinligi qanday bo‘lsa, rang barqaror turadi?",
    body: "Oldingi tishda A2 dentin va emal qatlami. 1 mm dan yupqa emal qatlami rangni o‘zgartirayaptimi, yoki bu polishing masalasi? Tajribangizni yozing.",
    kind: "savol",
    time: "1 kun oldin",
    category: "Estetika",
    photos: [],
    tags: ["#Estetika", "#Kompozit"],
    likes: 18,
    comments: 6,
  },
];

export const topMembers = [
  { name: "Dr. Malika Yusupova", role: "Endodontist", posts: 124, rating: 0, likes: 320, avatar: A.malika },
  { name: "Dr. Aziz Karimov", role: "Implantolog", posts: 98, rating: 0, likes: 286, avatar: A.aziz },
  { name: "Dr. Kamola Abdullayeva", role: "Estetik stomatolog", posts: 76, rating: 0, likes: 210, avatar: A.kamola },
  { name: "Dr. Farrux Salomov", role: "Ortodont", posts: 64, rating: 0, likes: 198, avatar: A.dilshod },
  { name: "Dr. Dilnoza Yusupova", role: "Jarroh", posts: 58, rating: 0, likes: 176, avatar: A.aziza },
];

export const trends = [
  { tag: "#Implantologiya", count: 128 },
  { tag: "#Endodontiya", count: 96 },
  { tag: "#Estetika", count: 84 },
  { tag: "#Case", count: 72 },
  { tag: "#Ortodontiya", count: 58 },
];

export const communityRules = [
  "Hurmat va odobni saqlang",
  "Klinik ma’lumotlarni anonimizatsiya qiling",
  "Reklama va spam taqiqlanadi",
  "Faqat stomatologiyaga oid mavzular",
  "Boshqalarning fikriga hurmat bilan munosabatda bo‘ling",
];

export type SlotKind = "visit" | "lunch" | "free";

export type Slot = {
  time: string;
  kind: SlotKind;
  name?: string;
  note?: string;
  avatar?: string;
};

export const clinicDate = "2026-10-24";

export const chairs: { id: string; name: string; slots: Slot[] }[] = [
  {
    id: "k1",
    name: "Kreslo 1",
    slots: [
      { time: "09:00", kind: "visit", name: "Otabek Karimov", note: "Professional gigiyena", avatar: A.dilshod },
      { time: "09:30", kind: "visit", name: "Dilnoza Abdurahimova", note: "Kompozit restavratsiya, tish 46", avatar: A.malika },
      { time: "11:00", kind: "visit", name: "Sardor Tursunov", note: "Davolash rejasi muhokamasi", avatar: A.sardor },
      { time: "11:30", kind: "lunch", note: "Tushlik" },
      { time: "14:00", kind: "visit", name: "Mohira Salayeva", note: "Endodontik davolash, tish 36", avatar: A.aziza },
      { time: "15:30", kind: "visit", name: "Azizbek Olimov", note: "Nazorat ko‘rigi", avatar: A.javohir },
      { time: "17:00", kind: "visit", name: "Nigora Raxmonova", note: "Estetik konsultatsiya", avatar: A.kamola },
    ],
  },
  {
    id: "k2",
    name: "Kreslo 2",
    slots: [
      { time: "09:00", kind: "visit", name: "Kamoliddin Egamberdiyev", note: "Implant konsultatsiyasi", avatar: A.farukh },
      { time: "09:30", kind: "visit", name: "Sevara Ismailova", note: "Kompozit restavratsiya, tish 21", avatar: A.aziza },
      { time: "11:00", kind: "visit", name: "Jahongir Qodirov", note: "Kronka tayyorlash (sken)", avatar: A.javohir },
      { time: "11:30", kind: "lunch", note: "Tushlik" },
      { time: "14:00", kind: "visit", name: "Gulnora Karimova", note: "Endodontik konsultatsiya", avatar: A.malika },
      { time: "15:30", kind: "visit", name: "Javohir Mirzayev", note: "Professional gigiyena", avatar: A.sardor },
      { time: "17:00", kind: "free" },
    ],
  },
  {
    id: "k3",
    name: "Kreslo 3",
    slots: [
      { time: "09:00", kind: "visit", name: "Madina Saidova", note: "Initial konsultatsiya", avatar: A.kamola },
      { time: "09:30", kind: "visit", name: "Ulug‘bek Hasanov", note: "Kompozit restavratsiya, tish 11", avatar: A.nodirbek },
      { time: "11:00", kind: "visit", name: "Diyoraxon Akbarova", note: "Professional gigiyena", avatar: A.aziza },
      { time: "11:30", kind: "lunch", note: "Tushlik" },
      { time: "14:00", kind: "free" },
      { time: "15:30", kind: "free" },
      { time: "17:00", kind: "free" },
    ],
  },
];

export const revenueMonths = [
  { m: "May", v: 42 },
  { m: "Iyun", v: 58 },
  { m: "Iyul", v: 48 },
  { m: "Avg", v: 78 },
  { m: "Sen", v: 62 },
  { m: "Okt", v: 100 },
];

export const inventory = [
  { id: "filtek", name: "Filtek Z350 A2", brand: "3M", note: "2 dona qoldi", tone: "red" as const },
  { id: "ubi", name: "Ubistesin 4%", brand: "Espe", note: "Tugayapti (5 dona)", tone: "amber" as const },
  { id: "opti", name: "Kerr OptiBond Solo Plus", brand: "Kerr", note: "Tugayapti (3 dona)", tone: "amber" as const },
];

export type PatientRow = {
  id: string;
  name: string;
  phone: string;
  last: string;
  next: string;
  debt: number;
  avatar: string;
};

export const patients: PatientRow[] = [
  { id: "pt1", name: "Otabek Karimov", phone: "+998 90 123 45 67", last: "25.10.2026", next: "27.10.2026", debt: 0, avatar: A.dilshod },
  { id: "pt2", name: "Sevara Ismailova", phone: "+998 90 234 56 78", last: "18.10.2026", next: "22.10.2026", debt: 450_000, avatar: A.aziza },
  { id: "pt3", name: "Jahongir Qodirov", phone: "+998 93 345 67 89", last: "15.10.2026", next: "20.10.2026", debt: 0, avatar: A.javohir },
  { id: "pt4", name: "Mohira Salayeva", phone: "+998 97 456 78 90", last: "21.10.2026", next: "27.10.2026", debt: 1_200_000, avatar: A.malika },
  { id: "pt5", name: "Dilnoza Abdurahimova", phone: "+998 91 765 43 21", last: "12.10.2026", next: "18.10.2026", debt: 0, avatar: A.kamola },
];

export const staff = [
  { name: "Dr. Malika Yusupova", role: "Terapevt", avatar: A.malika },
  { name: "Dr. Aziz Karimov", role: "Ortoped", avatar: A.aziz },
  { name: "Dilnoza Raximova", role: "Administrator", avatar: A.aziza },
  { name: "Sardor Bekmurodov", role: "Assistant", avatar: A.sardor },
];

export const labOrders = [
  { id: "1", patient: "O. Karimov", fdi: "11", work: "E.max kronka", material: "E.max", status: "Tayyorlanmoqda", tone: "blue" as const, due: "29.10.2026" },
  { id: "2", patient: "S. Ismailova", fdi: "21", work: "Zirkon kronka", material: "Zirkon", status: "Dizayn bosqichida", tone: "amber" as const, due: "27.10.2026" },
  { id: "3", patient: "J. Qodirov", fdi: "36", work: "Implant abutment", material: "Titan", status: "Shakllantirilmoqda", tone: "teal" as const, due: "30.10.2026" },
];
