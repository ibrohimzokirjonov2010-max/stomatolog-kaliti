export type VideoLesson = {
  id: string;
  title: string;
  duration: string;
  image: string;
};

export const videoLessons: VideoLesson[] = [
  {
    id: "kompozit-qatlam",
    title: "Kompozit restavratsiya: qatlamma usul",
    duration: "16:42",
    image: "/images/seminar-lecture.png",
  },
  {
    id: "implant-bosqich",
    title: "Implant joylashtirish: bosqichma-bosqich",
    duration: "22:15",
    image: "/images/video-dentist-thumb.png",
  },
  {
    id: "endo-mikroskop",
    title: "Mikroskop yordamida endodontiya asoslari",
    duration: "18:05",
    image: "/images/seminar-scope.png",
  },
  {
    id: "smile-design",
    title: "Digital smile design: foto va wax-up",
    duration: "14:30",
    image: "/images/seminar-smile.png",
  },
];

export function videoLessonHref(id: string) {
  return `/talim#${id}`;
}


export type BookCategory =
  | "implantologiya"
  | "endodontiya"
  | "estetika"
  | "ortodontiya"
  | "jarrohlik"
  | "parodontologiya"
  | "bolalar"
  | "umumiy";

export type BookLanguage = "uz" | "ru" | "en";
export type BookLevel = "boshlangich" | "orta" | "yuqori";

export type Book = {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  pages: number;
  image: string;
  summary: string;
  /** Til: uz / ru / en */
  language: BookLanguage;
  /** Daraja */
  level: BookLevel;
  /** Nashr yili */
  year: number;
  /** Yuklab olishlar soni (namuna statistika) */
  downloads: number;
  /** Faqat haqiqiy, ochiq fayl havolasi bo‘lsa to‘ldiriladi. */
  fileUrl?: string;
};

export const bookCategoryLabels: Record<BookCategory, string> = {
  implantologiya: "Implantologiya",
  endodontiya: "Endodontiya",
  estetika: "Estetika",
  ortodontiya: "Ortodontiya",
  jarrohlik: "Og‘iz jarrohligi",
  parodontologiya: "Parodontologiya",
  bolalar: "Bolalar stomatologiyasi",
  umumiy: "Umumiy",
};

export const bookLanguageLabels: Record<BookLanguage, string> = {
  uz: "O‘zbekcha",
  ru: "Русский",
  en: "English",
};

export const bookLevelLabels: Record<BookLevel, string> = {
  boshlangich: "Boshlang‘ich",
  orta: "O‘rta",
  yuqori: "Ilg‘or",
};

export const bookCategoryTabs: { id: BookCategory | "all"; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "estetika", label: "Estetika" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "jarrohlik", label: "Og‘iz jarrohligi" },
  { id: "parodontologiya", label: "Parodontologiya" },
  { id: "bolalar", label: "Bolalar stomatologiyasi" },
  { id: "umumiy", label: "Umumiy" },
];

export const books: Book[] = [
  {
    id: "impl-basics",
    title: "Implantologiya asoslari",
    author: "Dr. Jasur Rakhimov",
    category: "implantologiya",
    pages: 214,
    image: "/images/seminar-implant.png",
    summary: "Osteointegratsiya, planning va birlamchi barqarorlik.",
    language: "uz",
    level: "boshlangich",
    year: 2023,
    downloads: 1248,
  },
  {
    id: "endo-atlas",
    title: "Endodontiya atlasi",
    author: "Dr. Nodira Karimova",
    category: "endodontiya",
    pages: 186,
    image: "/images/seminar-scope.png",
    summary: "Kanal anatomiyasi, irrigatsiya va obturatsiya protokoli.",
    language: "uz",
    level: "orta",
    year: 2022,
    downloads: 986,
  },
  {
    id: "smile-book",
    title: "Estetik smile design",
    author: "Dr. Kamola Abdullayeva",
    category: "estetika",
    pages: 160,
    image: "/images/seminar-smile.png",
    summary: "Foto protokol, veneer va kompozit restavratsiya.",
    language: "uz",
    level: "orta",
    year: 2024,
    downloads: 874,
  },
  {
    id: "ortho-guide",
    title: "Ortodontiya qo‘llanmasi",
    author: "Dr. Farrukh Khaydarov",
    category: "ortodontiya",
    pages: 198,
    image: "/images/seminar-braces.png",
    summary: "Bracket, aligner va retention asoslari.",
    language: "uz",
    level: "boshlangich",
    year: 2022,
    downloads: 742,
  },
  {
    id: "clinic-mgmt",
    title: "Klinika boshqaruvi",
    author: "StomaHub team",
    category: "umumiy",
    pages: 120,
    image: "/images/seminar-lecture.png",
    summary: "Jamoa, sifat va bemor tajribasi bo‘yicha qisqa qo‘llanma.",
    language: "uz",
    level: "boshlangich",
    year: 2024,
    downloads: 410,
  },
  {
    id: "digital-dent",
    title: "Digital dentistry",
    author: "Dr. Sanjar Salomov",
    category: "umumiy",
    pages: 172,
    image: "/images/seminar-xray.png",
    summary: "CBCT, IOS skaner va CAD/CAM kirish kursi.",
    language: "en",
    level: "yuqori",
    year: 2025,
    downloads: 1102,
  },
  {
    id: "impl-surgery",
    title: "Implant jarrohligi: bosqichlar",
    author: "Dr. Bekzod Ismoilov",
    category: "implantologiya",
    pages: 248,
    image: "/images/seminar-implants-macro.png",
    summary: "Flap dizayni, burg‘ulash ketma-ketligi va suturalash.",
    language: "uz",
    level: "yuqori",
    year: 2025,
    downloads: 1316,
  },
  {
    id: "impl-ru",
    title: "Дентальная имплантация: практика",
    author: "Dr. Alisher Nurmatov",
    category: "implantologiya",
    pages: 232,
    image: "/images/implant-promo.png",
    summary: "Планирование, выбор системы и протокол нагрузки.",
    language: "ru",
    level: "orta",
    year: 2021,
    downloads: 689,
  },
  {
    id: "impl-cbct",
    title: "CBCT va implant rejalashtirish",
    author: "Dr. Sanjar Salomov",
    category: "implantologiya",
    pages: 142,
    image: "/images/seminar-xray.png",
    summary: "Suyak sifati, nervga masofa va virtual planning.",
    language: "en",
    level: "yuqori",
    year: 2024,
    downloads: 931,
  },
  {
    id: "endo-rotary",
    title: "Rotatsion endodontiya",
    author: "Dr. Dilnoza Yusupova",
    category: "endodontiya",
    pages: 134,
    image: "/images/seminar-scope.png",
    summary: "NiTi fayllar, kanal formalash va sinish profilaktikasi.",
    language: "uz",
    level: "orta",
    year: 2024,
    downloads: 802,
  },
  {
    id: "endo-retreat",
    title: "Endodontik qayta davolash",
    author: "Dr. Timur Aliyev",
    category: "endodontiya",
    pages: 168,
    image: "/images/seminar-lecture.png",
    summary: "Eski plomba olib tashlash va murakkab holatlar.",
    language: "ru",
    level: "yuqori",
    year: 2023,
    downloads: 517,
  },
  {
    id: "endo-basics-en",
    title: "Essentials of Endodontics",
    author: "Dr. Laylo Rustamova",
    category: "endodontiya",
    pages: 156,
    image: "/images/lab-cadcam.png",
    summary: "Diagnostika, anesteziya va kanal tozalash asoslari.",
    language: "en",
    level: "boshlangich",
    year: 2020,
    downloads: 655,
  },
  {
    id: "composite-art",
    title: "Kompozit restavratsiya san’ati",
    author: "Dr. Malika Tursunova",
    category: "estetika",
    pages: 148,
    image: "/images/seminar-smile.png",
    summary: "Qatlamma usul, rang tanlash va yakuniy pardozlash.",
    language: "uz",
    level: "orta",
    year: 2023,
    downloads: 764,
  },
  {
    id: "veneer-guide",
    title: "Veneerlar: rejalashtirishdan sementlashgacha",
    author: "Dr. Kamola Abdullayeva",
    category: "estetika",
    pages: 176,
    image: "/images/seminar-implants-macro.png",
    summary: "Mock-up, preparatsiya va adgezivli sementlash.",
    language: "uz",
    level: "yuqori",
    year: 2025,
    downloads: 598,
  },
  {
    id: "whitening-ru",
    title: "Отбеливание зубов: протоколы",
    author: "Dr. Olga Petrova",
    category: "estetika",
    pages: 96,
    image: "/images/seminar-smile.png",
    summary: "Офисное и домашнее отбеливание, чувствительность.",
    language: "ru",
    level: "boshlangich",
    year: 2022,
    downloads: 433,
  },
  {
    id: "aligners",
    title: "Alignerlar bilan davolash",
    author: "Dr. Farrukh Khaydarov",
    category: "ortodontiya",
    pages: 206,
    image: "/images/seminar-braces.png",
    summary: "ClinCheck, attachment va tuzatish bosqichlari.",
    language: "uz",
    level: "yuqori",
    year: 2025,
    downloads: 845,
  },
  {
    id: "cephalo",
    title: "Sefalometriya asoslari",
    author: "Dr. Shahlo Hamidova",
    category: "ortodontiya",
    pages: 118,
    image: "/images/seminar-xray.png",
    summary: "Nuqtalar, tahlil usullari va davolash rejasi.",
    language: "en",
    level: "orta",
    year: 2021,
    downloads: 392,
  },
  {
    id: "oral-surgery",
    title: "Og‘iz jarrohligi amaliyoti",
    author: "Dr. Rustam Ergashev",
    category: "jarrohlik",
    pages: 224,
    image: "/images/implant-promo.png",
    summary: "Tish olish, kista va flap texnikalari.",
    language: "uz",
    level: "orta",
    year: 2023,
    downloads: 718,
  },
  {
    id: "wisdom",
    title: "Aql tishi jarrohligi",
    author: "Dr. Bekzod Ismoilov",
    category: "jarrohlik",
    pages: 112,
    image: "/images/seminar-implant.png",
    summary: "Retentsiyalangan tishlar va asoratlar profilaktikasi.",
    language: "ru",
    level: "yuqori",
    year: 2024,
    downloads: 466,
  },
  {
    id: "sinus-lift",
    title: "Sinus lift va suyak plastikasi",
    author: "Dr. Jasur Rakhimov",
    category: "jarrohlik",
    pages: 190,
    image: "/images/seminar-implants-macro.png",
    summary: "Yopiq va ochiq sinus lift, suyak materiallari.",
    language: "en",
    level: "yuqori",
    year: 2022,
    downloads: 574,
  },
  {
    id: "perio-basics",
    title: "Parodontologiya asoslari",
    author: "Dr. Nigora Saidova",
    category: "parodontologiya",
    pages: 164,
    image: "/images/seminar-scope.png",
    summary: "Diagnostika, skeyling va qo‘llab-quvvatlovchi terapiya.",
    language: "uz",
    level: "boshlangich",
    year: 2022,
    downloads: 612,
  },
  {
    id: "perio-surgery",
    title: "Parodontal jarrohlik",
    author: "Dr. Nigora Saidova",
    category: "parodontologiya",
    pages: 182,
    image: "/images/seminar-lecture.png",
    summary: "Gingivektomiya, retsessiya yopish va regeneratsiya.",
    language: "ru",
    level: "yuqori",
    year: 2025,
    downloads: 389,
  },
  {
    id: "pedo-guide",
    title: "Bolalar stomatologiyasi qo‘llanmasi",
    author: "Dr. Zilola Karimova",
    category: "bolalar",
    pages: 140,
    image: "/images/seminar-braces.png",
    summary: "Sut tishlari davolash, muloqot va profilaktika.",
    language: "uz",
    level: "boshlangich",
    year: 2024,
    downloads: 927,
  },
  {
    id: "pedo-ru",
    title: "Детская стоматология: клиника",
    author: "Dr. Irina Sokolova",
    category: "bolalar",
    pages: 204,
    image: "/images/seminar-smile.png",
    summary: "Кариес раннего возраста, пульпиты и травмы.",
    language: "ru",
    level: "orta",
    year: 2021,
    downloads: 508,
  },
  {
    id: "pedo-anesthesia",
    title: "Pediatric Dental Anesthesia",
    author: "Dr. Aziza Normatova",
    category: "bolalar",
    pages: 88,
    image: "/images/lab-cadcam.png",
    summary: "Bolalarda og‘riqsizlantirish va xulq boshqaruvi.",
    language: "en",
    level: "orta",
    year: 2023,
    downloads: 351,
  },
];
