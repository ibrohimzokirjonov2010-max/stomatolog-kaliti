export type NewsCat = "soha" | "tadbir" | "tech" | "qonun" | "kompaniya" | "intervyu";

export type DesktopArticle = {
  id: string;
  cat: NewsCat;
  title: string;
  lead: string;
  date: string;
  views: number;
  minutes: number;
  image: string;
  author?: string;
  role?: string;
  authorImage?: string;
  featured?: boolean;
};

export const newsCats: { id: "all" | NewsCat; label: string; badge: string }[] = [
  { id: "all", label: "Barchasi", badge: "Yangilik" },
  { id: "soha", label: "Soha yangiliklari", badge: "Soha yangiliklari" },
  { id: "tadbir", label: "Tadbirlar", badge: "Tadbirlar" },
  { id: "tech", label: "Texnologiyalar", badge: "Texnologiyalar" },
  { id: "qonun", label: "Qonunchilik", badge: "Qonunchilik" },
  { id: "kompaniya", label: "Kompaniyalar", badge: "Kompaniyalar" },
  { id: "intervyu", label: "Intervyular", badge: "Intervyu" },
];

export function newsBadge(cat: NewsCat) {
  return newsCats.find((item) => item.id === cat)?.badge ?? cat;
}

export const desktopArticles: DesktopArticle[] = [
  {
    id: "dental-expo-2026",
    cat: "tadbir",
    title: "Toshkentda Dental Expo 2026 ko‘rgazmasi o‘tkaziladi",
    lead: "2026-yil 15–17-aprel kunlari Toshkentda Markaziy Osiyodagi eng yirik stomatologik ko‘rgazma — Dental Expo 2026 bo‘lib o‘tadi. Tadbirda dunyoning yetakchi brendlari, zamonaviy texnologiyalar va mahorat darslari taqdim etiladi.",
    date: "12.12.2024",
    views: 2450,
    minutes: 5,
    image: "/img/news/expo.jpg",
    author: "Dilshod Karimov",
    role: "Bosh muharrir",
    authorImage: "/img/news/author.jpg",
    featured: true,
  },
  { id: "raqamli-implant", cat: "tech", title: "Raqamli implantologiya: yangi protokollar va imkoniyatlar", lead: "Raqamli rejalashtirish va navigatsiya implantologiyada xatolarni kamaytiradi.", date: "10.12.2024", views: 1320, minutes: 4, image: "/img/news/n1.jpg" },
  { id: "litsenziya", cat: "qonun", title: "Stomatologiya klinikalari uchun yangi litsenziya talablari ma’lum qilindi", lead: "Klinika litsenziyasi uchun yangilangan hujjatlar ro‘yxati e’lon qilindi.", date: "09.12.2024", views: 980, minutes: 3, image: "/img/news/n2.jpg" },
  { id: "skaner-narx", cat: "soha", title: "Intraoral skanerlar narxi pasaymoqda: bozor tahlili", lead: "Yangi avlod skanerlar narxi o‘tgan yilga nisbatan pasaygan.", date: "08.12.2024", views: 1760, minutes: 4, image: "/img/news/n3.jpg" },
  { id: "mirzayev", cat: "intervyu", title: "“Zamonaviy klinikada raqamli oqim” — Dr. Shavkat Mirzayev bilan intervyu", lead: "Raqamli oqim klinikada qabul vaqtini qanday qisqartirishi haqida.", date: "05.12.2024", views: 1120, minutes: 6, image: "/img/news/n4.jpg" },
  { id: "sirona-markaz", cat: "kompaniya", title: "Dentsply Sirona O‘zbekistonda yangi o‘quv markazini ochdi", lead: "Markazda shifokorlar uchun amaliy mashg‘ulotlar boshlanadi.", date: "03.12.2024", views: 950, minutes: 3, image: "/img/news/n5.jpg" },
  { id: "turbina", cat: "soha", title: "Turbina va uchliklar parvarishi: foydali tavsiyalar", lead: "Kundalik parvarish uchlik umrini sezilarli uzaytiradi.", date: "01.12.2024", views: 2340, minutes: 5, image: "/img/news/n6.jpg" },
  { id: "xalqaro-seminar", cat: "tadbir", title: "Stomatologlar uchun xalqaro seminar o‘tkaziladi", lead: "Seminar Toshkentda, xalqaro spikerlar ishtirokida.", date: "28.11.2024", views: 870, minutes: 3, image: "/img/news/n7.jpg" },
  { id: "aligner", cat: "tech", title: "Shaffof tish qatorlari (alignerlar): klinik holatlar va natijalar", lead: "Aligner bilan davolash muddati va nazorat qadamlari.", date: "25.11.2024", views: 1840, minutes: 4, image: "/img/news/n8.jpg" },
  { id: "tarmoq", cat: "kompaniya", title: "O‘zbekistonda yangi stomatologiya klinikasi tarmog‘i ish boshladi", lead: "Tarmoq birinchi filialini Toshkentda ochdi.", date: "20.11.2024", views: 1210, minutes: 5, image: "/img/news/n9.jpg" },
];

export const popularArticles: { title: string; views: number; date: string; image: string }[] = [
  { title: "Implant narxlari 2025-yilda qanday o‘zgaradi?", views: 5230, date: "02.12.2024", image: "/img/news/n9.jpg" },
  { title: "Bolalarda milk kasalliklari: oldini olish usullari", views: 4120, date: "29.11.2024", image: "/img/news/n10.jpg" },
  { title: "Alignerlar: kimlarga mos va qancha vaqt kerak?", views: 3980, date: "27.11.2024", image: "/img/news/n8.jpg" },
  { title: "Stomatologik lampalar: qaysi model yaxshiroq?", views: 3760, date: "21.11.2024", image: "/img/jihoz/lamp.jpg" },
  { title: "Klinika ochish: bosqichma-bosqich qo‘llanma", views: 3410, date: "18.11.2024", image: "/img/news/n2.jpg" },
];

export const upcomingEvents = [
  { day: "15", month: "APR", title: "Dental Expo 2026", place: "Toshkent, CAEx", price: 450_000 },
  { day: "22", month: "YAN", title: "Raqamli implantologiya seminari", place: "Toshkent", price: 250_000 },
  { day: "10", month: "FEV", title: "Bolalar stomatologiyasi mahorat darsi", place: "Samarqand", price: 200_000 },
];
