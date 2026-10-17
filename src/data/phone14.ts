import type { Specialist } from "@/data/desktop-specialists";
import type { Lab } from "@/data/labs";
import type { Listing } from "@/data/listings";

export const phoneCategories = [
  { id: "materiallar", title: "Stomatologik materiallar", count: "1 245 mahsulot", href: "/marketplace?cat=materiallar", image: "/img/phone14/cat-materiallar.png", tint: "#e8f1ff", color: "#0066ff" },
  { id: "implantlar", title: "Implantlar", count: "856 mahsulot", href: "/marketplace?cat=implantlar", image: "/img/phone14/cat-implantlar.png", tint: "#e7f8f2", color: "#0f9f75" },
  { id: "instrumentlar", title: "Instrumentlar", count: "1 032 mahsulot", href: "/marketplace?cat=asboblar", image: "/img/phone14/cat-instrumentlar.png", tint: "#fff4e8", color: "#e07a1f" },
  { id: "uskunalar", title: "Uskunalar", count: "412 mahsulot", href: "/jihozlar", image: "/img/phone14/cat-uskunalar.png", tint: "#f3e8ff", color: "#7c3aed" },
  { id: "endo", title: "Endodontiya", count: "623 mahsulot", href: "/marketplace?q=endo", image: "/img/phone14/cat-endo.png", tint: "#e7f6ff", color: "#0284c7" },
  { id: "orto", title: "Ortodontiya", count: "498 mahsulot", href: "/marketplace?q=ortodont", image: "/img/phone14/cat-orto.png", tint: "#fde8f3", color: "#db2777" },
  { id: "lab", title: "Laboratoriya materiallari", count: "534 mahsulot", href: "/marketplace?cat=laboratoriya", image: "/img/phone14/cat-lab.png", tint: "#eef2ff", color: "#4f46e5" },
  { id: "forma", title: "Stomatologik forma", count: "765 mahsulot", href: "/forma", image: "/img/phone14/cat-forma.png", tint: "#e8f8ff", color: "#0891b2" },
  { id: "seminar", title: "Seminarlar", count: "248 tadbir", href: "/seminarlar", image: "/img/phone14/cat-seminar.png", tint: "#fff7e6", color: "#d97706" },
  { id: "ehtiyot", title: "Ehtiyot qismlar", count: "312 mahsulot", href: "/marketplace?q=ehtiyot", image: "/img/phone14/cat-ehtiyot.png", tint: "#f1f5f9", color: "#475569" },
  { id: "xizmat", title: "Xizmatlar", count: "186 xizmat", href: "/ustalar", image: "/img/phone14/cat-xizmat.png", tint: "#ecfdf3", color: "#16a34a" },
  { id: "boshqa", title: "Boshqa kategoriyalar", count: "320 mahsulot", href: "/marketplace", image: "/img/phone14/cat-boshqa.png", tint: "#f8fafc", color: "#334155" },
];

export const phoneBrands = [
  { name: "3M", count: 124, letter: "3", logo: "/img/phone14/brand-3m.png" },
  { name: "Straumann", count: 86, letter: "S", logo: "/img/phone14/brand-straumann.png" },
  { name: "Dentsply Sirona", count: 142, letter: "D", logo: "/img/phone14/brand-dentsply.png" },
  { name: "Nobel Biocare", count: 98, letter: "N", logo: "/img/phone14/brand-nobel.png" },
  { name: "Ivoclar", count: 156, letter: "I", logo: "/img/phone14/brand-ivoclar.png" },
  { name: "VOCO", count: 64, letter: "V", logo: "/img/phone14/brand-voco.png" },
  { name: "GC", count: 72, letter: "G", logo: "/img/phone14/brand-gc.png" },
  { name: "Coltene", count: 89, letter: "C", logo: "/img/phone14/brand-coltene.png" },
  { name: "Kerr", count: 67, letter: "K", logo: "/img/phone14/brand-kerr.png" },
  { name: "Osstem Implant", count: 54, letter: "O", logo: "/img/phone14/brand-osstem.png" },
  { name: "Megagen", count: 48, letter: "M", logo: "/img/phone14/brand-megagen.png" },
  { name: "Neobiotech", count: 46, letter: "N", logo: "/img/phone14/brand-neo.png" },
  { name: "SDI", count: 38, letter: "S", logo: "/img/phone14/brand-sdi.png" },
  { name: "VITA", count: 42, letter: "V", logo: "/img/phone14/brand-vita.png" },
];

export const letterRanges = ["Barchasi", "A-B", "C-D", "E-F", "G-H", "I-J", "K-L", "M-N", "O-P", "Q-R", "S-T", "U-V", "W-Z"];

export function letterInRange(letter: string, range: string) {
  if (range === "Barchasi") return true;
  const [a, b] = range.split("-");
  if (letter < "A" || letter > "Z") return false;
  return letter >= a && letter <= b;
}

const day = 86400;
export const phoneSales = [
  { id: "sale-filtek", brand: "3M", name: "Filtek Universal Composite", spec: "Universal kompozit · A2 · 4 g", tags: ["Kompozit", "Material"], category: "Stomatologik materiallar", price: 350000, old: 500000, discount: 30, rating: 4.9, reviews: 124, seconds: 2 * day + 12 * 3600 + 18 * 60 + 45, image: "/img/phone14/sale-0.png" },
  { id: "sale-blt", brand: "Straumann", name: "BLT Implant System", spec: "BLT implant · Ø4.1 · SLActive", tags: ["Implant", "Jarrohlik"], category: "Implantlar", price: 4500000, old: 6000000, discount: 25, rating: 4.8, reviews: 96, seconds: 5 * day + 8 * 3600 + 32 * 60 + 10, image: "/img/phone14/sale-1.png" },
  { id: "sale-xsmart", brand: "Dentsply Sirona", name: "X-Smart Pro+", spec: "Endomotor · Pro+ · integratsiya", tags: ["Uskuna", "Endodontiya"], category: "Instrumentlar", price: 8000000, old: 10000000, discount: 20, rating: 4.9, reviews: 78, seconds: 3 * day + 21 * 3600 + 5 * 60 + 33, image: "/img/phone14/sale-2.png" },
  { id: "sale-fuji", brand: "GC", name: "Fuji IX GIC", spec: "Shisha ionomer · kapsula", tags: ["Sement", "Material"], category: "Stomatologik materiallar", price: 280000, old: 430000, discount: 35, rating: 4.8, reviews: 56, seconds: 1 * day + 16 * 3600 + 22 * 60 + 18, image: "/img/phone14/sale-3.png" },
  { id: "sale-hu", brand: "Hu-Friedy", name: "Instrumentlar to‘plami", spec: "Diagnostik to‘plam · 5 dona", tags: ["Instrument", "To‘plam"], category: "Instrumentlar", price: 960000, old: 1600000, discount: 40, rating: 4.9, reviews: 112, seconds: 6 * day + 11 * 3600 + 40 * 60 + 27, image: "/img/phone14/sale-4.png" },
];

export const phoneCourses = [
  { id: "implant-nazariya", title: "Implantologiya: nazariya va amaliyot", text: "Implant rejalash, joylashtirish va protezlashning amaliy bosqichlari.", topic: "Implantologiya", teacher: "Dr. Azizbek Karimov", role: "Implantolog", avatar: "/img/phone14/spec-0.png", image: "/img/phone14/course-0.png", lessons: "12 ta dars", time: "4 soat 12 daqiqa", level: "O‘rta", price: 299000, cta: "Kursni boshlash" },
  { id: "endo-zamonaviy", title: "Endodontiya: zamonaviy yondashuv", text: "Kanal davolashda mikroskop, irrigatsiya va obturatsiya.", topic: "Endodontiya", teacher: "Dr. Sardor Ismailov", role: "Endodontist", avatar: "/img/phone14/spec-2.png", image: "/img/phone14/course-1.png", lessons: "10 ta dars", time: "3 soat 28 daqiqa", level: "Barcha darajalar", price: 199000, cta: "Kursni olish" },
  { id: "orto-asos", title: "Ortodontiya asoslari", text: "Breket va elayner bilan tish qatorini tuzatish asoslari.", topic: "Ortodontiya", teacher: "Dr. Nilufar Abdullayeva", role: "Ortodont", avatar: "/img/phone14/spec-1.png", image: "/img/phone14/course-2.png", lessons: "18 ta dars", time: "5 soat 15 daqiqa", level: "Boshlang‘ich", price: 349000, cta: "Kursni olish" },
  { id: "estetik", title: "Estetik stomatologiya", text: "Veneer, kompozit restavratsiya va tabiiy kulgi dizayni.", topic: "Estetika", teacher: "Dr. Jahongir Rahimov", role: "Estetik stomatolog", avatar: "/img/phone14/spec-3.png", image: "/img/phone14/course-3.png", lessons: "8 ta dars", time: "2 soat 45 daqiqa", level: "O‘rta", price: 179000, cta: "Kursni olish" },
  { id: "paro", title: "Parodontologiya: amaliy yondashuv", text: "Parodontal cho‘ntak, gigiyena va qo‘llab-quvvatlovchi davolash.", topic: "Parodontologiya", teacher: "Dr. Madina Xolmatova", role: "Parodontolog", avatar: "/img/phone14/pat-4.png", image: "/img/phone14/course-4.png", lessons: "14 ta dars", time: "3 soat 10 daqiqa", level: "Barcha darajalar", price: 249000, cta: "Kursni olish" },
];

function spec(partial: Omit<Specialist, "reviewList" | "rank" | "hours" | "about" | "clinic" | "patients"> & { patients: number }): Specialist {
  return {
    ...partial,
    clinic: "StomaHub klinikasi",
    hours: "09:00 – 18:00",
    about: `${partial.specialtyLabel}. ${partial.city}da qabul.`,
    patients: partial.patients,
    reviewList: [],
    rank: 0,
  };
}

export const phoneSpecialists: Specialist[] = [
  spec({ id: "azizbek-karimov", name: "Dr. Azizbek Karimov", specialty: "implantolog", specialtyLabel: "Implantolog/jarroh", city: "Toshkent", rating: 4.9, reviews: 124, experience: "8 yil", years: 8, patientsLabel: "300+", patients: 300, online: true, image: "/img/phone14/spec-0.png", phone: "+998901112233", skills: ["Implantatsiya", "Suyak plastikasi", "Sinus lift"] }),
  spec({ id: "nilufar-abdullayeva", name: "Dr. Nilufar Abdullayeva", specialty: "ortodont", specialtyLabel: "Ortodont", city: "Toshkent", rating: 4.8, reviews: 96, experience: "6 yil", years: 6, patientsLabel: "500+", patients: 500, online: true, image: "/img/phone14/spec-1.png", phone: "+998902223344", skills: ["Breket tizimlari", "Elaynerlar", "Tish qatorini tuzatish"] }),
  spec({ id: "sardor-ismailov", name: "Dr. Sardor Ismailov", specialty: "endodontist", specialtyLabel: "Endodontist", city: "Samarqand", rating: 4.9, reviews: 88, experience: "10 yil", years: 10, patientsLabel: "700+", patients: 700, online: false, image: "/img/phone14/spec-2.png", phone: "+998903334455", skills: ["Endodontiya", "Mikroskopik davolash", "Qayta davolash"] }),
  spec({ id: "jahongir-rahimov", name: "Dr. Jahongir Rahimov", specialty: "terapevt", specialtyLabel: "Estetik stomatolog", city: "Toshkent", rating: 4.8, reviews: 63, experience: "7 yil", years: 7, patientsLabel: "400+", patients: 400, online: true, image: "/img/phone14/spec-3.png", phone: "+998904445566", skills: ["Veneerlar", "Kompozit restavratsiya", "Estetik reabilitatsiya"] }),
];

export const phoneCerts = [
  { id: "c1", title: "Implantologiya: nazariya va amaliyot", type: "seminar", typeLabel: "Seminar", date: "12-13 may 2024", cme: 16, image: "/img/phone14/cert-0.png" },
  { id: "c2", title: "Endodontiya: zamonaviy yondashuv", type: "onlayn", typeLabel: "Onlayn dars", date: "3 aprel 2024", cme: 8, image: "/img/phone14/cert-1.png" },
  { id: "c3", title: "Estetik stomatologiya", type: "kurs", typeLabel: "Kurs", date: "20 fevral 2024", cme: 12, image: "/img/phone14/cert-2.png" },
  { id: "c4", title: "Ortodontiyada raqamli texnologiyalar", type: "onlayn", typeLabel: "Onlayn dars", date: "10 yanvar 2024", cme: 8, image: "/img/phone14/cert-3.png" },
  { id: "c5", title: "Klinik parodontologiya", type: "seminar", typeLabel: "Seminar", date: "18 mart 2024", cme: 8, image: "/img/phone14/cert-0.png" },
  { id: "c6", title: "Bolalar stomatologiyasi", type: "seminar", typeLabel: "Seminar", date: "5 iyun 2024", cme: 8, image: "/img/phone14/cert-1.png" },
  { id: "c7", title: "Raqamli smile design", type: "onlayn", typeLabel: "Onlayn dars", date: "22 mart 2024", cme: 6, image: "/img/phone14/cert-2.png" },
  { id: "c8", title: "Gigiyena va profilaktika", type: "onlayn", typeLabel: "Onlayn dars", date: "2 fevral 2024", cme: 6, image: "/img/phone14/cert-3.png" },
];

const UZ_MON = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

export function relDateLabel(dayOffset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return `${date.getDate()} ${UZ_MON[date.getMonth()]} ${date.getFullYear()}`;
}

export type PhonePatient = {
  id: string;
  name: string;
  num: string;
  age: number;
  gender: "Ayol" | "Erkak" | "Boshqa";
  phone: string;
  status: "yangi" | "davolanishda" | "kuzatuvda" | "yakun";
  statusLabel: string;
  last: string;
  next: string;
  tags: string[];
  online: boolean;
  avatar: string;
  city?: string;
  birth?: string;
  email?: string;
  address?: string;
  source?: string;
  note?: string;
  conditions?: string[];
};

export const phonePatients: PhonePatient[] = [
  { id: "b-0012", name: "Malika Karimova", num: "B-0012", age: 28, gender: "Ayol", phone: "+998 90 123 45 67", status: "davolanishda", statusLabel: "Davolanishda", last: relDateLabel(-5), next: relDateLabel(3), tags: ["Plomba", "Endodontiya", "Kuzatuv"], online: true, avatar: "/img/phone14/pat-0.png", city: "Toshkent", birth: "1996-10-14", conditions: ["Allergiya", "Gipertoniya"] },
  { id: "b-0013", name: "Jahongir Rahimov", num: "B-0013", age: 35, gender: "Erkak", phone: "+998 93 200 11 22", status: "kuzatuvda", statusLabel: "Kuzatuvda", last: relDateLabel(-12), next: relDateLabel(19), tags: ["Implant", "Proteziya", "Kuzatuv"], online: true, avatar: "/img/phone14/pat-1.png", city: "Toshkent" },
  { id: "b-0014", name: "Oysa Abdurahmonova", num: "B-0014", age: 42, gender: "Ayol", phone: "+998 97 310 22 33", status: "yangi", statusLabel: "Yangi", last: "—", next: "Rejalashtirish", tags: ["Konsultatsiya", "Diagnostika"], online: false, avatar: "/img/phone14/pat-2.png", city: "Toshkent" },
  { id: "b-0015", name: "Sardorbek Aliyev", num: "B-0015", age: 12, gender: "Erkak", phone: "+998 90 440 33 44", status: "davolanishda", statusLabel: "Davolanishda", last: relDateLabel(-7), next: relDateLabel(8), tags: ["Ortodontiya", "Breket", "Nazorat"], online: true, avatar: "/img/phone14/pat-3.png", city: "Toshkent" },
  { id: "b-0016", name: "Nilufar Ismoilova", num: "B-0016", age: 31, gender: "Ayol", phone: "+998 91 550 44 55", status: "yakun", statusLabel: "Yakunlangan", last: relDateLabel(-16), next: "—", tags: ["Estetik", "Veneer", "Yakunlangan"], online: false, avatar: "/img/phone14/pat-4.png", city: "Toshkent" },
  { id: "b-0017", name: "Azizbek Normatov", num: "B-0017", age: 29, gender: "Erkak", phone: "+998 93 660 55 66", status: "davolanishda", statusLabel: "Davolanishda", last: relDateLabel(-9), next: relDateLabel(1), tags: ["Protez", "Koronka", "Nazorat"], online: true, avatar: "/img/phone14/pat-5.png", city: "Toshkent" },
];

export const phoneAppts = [
  { id: "u1", time: "09:00", end: "09:45", name: "Malika Karimova", service: "Profilaktik ko‘rik", age: 28, gender: "Ayol", tooth: "Umumiy ko‘rik", note: "Tozalash va maslahat", status: "keladi", statusLabel: "Kelmoqda", phone: "+998901234567", avatar: "/img/phone14/pat-0.png" },
  { id: "u2", time: "10:30", end: "11:15", name: "Jahongir Rahimov", service: "Plomba davolash", age: 35, gender: "Erkak", tooth: "Karies (16)", note: "Anesteziya kerak", status: "kutil", statusLabel: "Kutilmoqda", phone: "+998932001122", avatar: "/img/phone14/pat-1.png" },
  { id: "u3", time: "12:00", end: "12:40", name: "Oysa Abdurahmonova", service: "Endodontik davolash", age: 42, gender: "Ayol", tooth: "Endodontiya (11)", note: "Rentgen olingan", status: "davolan", statusLabel: "Davolanmoqda", phone: "+998973102233", avatar: "/img/phone14/pat-2.png" },
  { id: "u4", time: "14:00", end: "14:50", name: "Sardorbek Aliyev", service: "Ortodontik konsultatsiya", age: 12, gender: "Erkak", tooth: "Breket maslahati", note: "Panoramik rentgen bilan", status: "kutil", statusLabel: "Kutilmoqda", phone: "+998904403344", avatar: "/img/phone14/pat-3.png" },
  { id: "u5", time: "15:30", end: "16:10", name: "Nilufar Ismoilova", service: "Estetik restoratsiya", age: 31, gender: "Ayol", tooth: "Veneer konsultatsiya", note: "Rang tanlash", status: "keladi", statusLabel: "Kelmoqda", phone: "+998915504455", avatar: "/img/phone14/pat-4.png" },
];

export const planStages = [
  { id: "s1", name: "Diagnostika va rejalashtirish", status: "Yakunlangan", price: 500000, date: relDateLabel(-5), note: "Konsultatsiya, OPG, KT" },
  { id: "s2", name: "Endodontik davolash (14)", status: "Davom etmoqda", price: 1500000, date: relDateLabel(3), note: "Kanal davolash" },
  { id: "s3", name: "Implant qo‘yish (16, 31)", status: "Rejalashtirilgan", price: 8000000, date: relDateLabel(19), note: "Implant + abutment" },
  { id: "s4", name: "Protetik bosqich", status: "Kutilmoqda", price: 2500000, date: "", note: "Krona va protez" },
];

export const phonePayments = [
  { id: "p1", name: "Malika Karimova", amount: "2 500 000 so‘m", note: "Davolash (Implant)", date: `${relDateLabel(-5)} · 14:30`, status: "To‘langan", avatar: "/img/phone14/pat-0.png", late: false },
  { id: "p2", name: "Jahongir Rahimov", amount: "1 800 000 so‘m", note: "Davolash (Proteziya)", date: `${relDateLabel(-5)} · 11:20`, status: "To‘langan", avatar: "/img/phone14/pat-1.png", late: false },
  { id: "p3", name: "Oysa Abdurahmonova", amount: "500 000 so‘m", note: "Konsultatsiya", date: `${relDateLabel(-6)} · 16:45`, status: "To‘langan", avatar: "/img/phone14/pat-2.png", late: false },
  { id: "p4", name: "Sardorbek Aliyev", amount: "3 200 000 so‘m", note: "Davolash (Ortodontiya)", date: `${relDateLabel(-6)} · 10:15`, status: "To‘langan", avatar: "/img/phone14/pat-3.png", late: false },
];

export const phoneLate = [
  { id: "l1", name: "Azizbek Normatov", amount: "700 000 so‘m", note: "Muddati o‘tgan", date: "1 okt", status: "Muddati o‘tgan", avatar: "/img/phone14/pat-5.png", late: true },
  { id: "l2", name: "Nilufar Ismoilova", amount: "450 000 so‘m", note: "Muddati o‘tgan", date: "28 sen", status: "Muddati o‘tgan", avatar: "/img/phone14/pat-4.png", late: true },
  { id: "l3", name: "Oysa Abdurahmonova", amount: "900 000 so‘m", note: "Qoldiq", date: "20 sen", status: "Muddati o‘tgan", avatar: "/img/phone14/pat-2.png", late: true },
  { id: "l4", name: "Jahongir Rahimov", amount: "150 000 so‘m", note: "Qoldiq", date: "12 sen", status: "Muddati o‘tgan", avatar: "/img/phone14/pat-1.png", late: true },
  { id: "l5", name: "Sardorbek Aliyev", amount: "100 000 so‘m", note: "Qoldiq", date: "5 sen", status: "Muddati o‘tgan", avatar: "/img/phone14/pat-3.png", late: true },
];

export const phoneStock = [
  { id: "st1", name: "Kompozit (A2)", category: "Materiallar", sku: "CMP-001", qty: 3, max: 20, expiry: "15 dek 2025", status: "Kam qoldi", image: "/img/phone14/stock-0.png" },
  { id: "st2", name: "Implant (Straumann)", category: "Implantlar", sku: "IMP-045", qty: 12, max: 20, expiry: "20 mar 2027", status: "Norma", image: "/img/phone14/stock-1.png" },
  { id: "st3", name: "Frez (Turbina)", category: "Instrumentlar", sku: "FRZ-012", qty: 5, max: 10, expiry: "10 yan 2026", status: "Kam qoldi", image: "/img/phone14/stock-2.png" },
  { id: "st4", name: "Sutura (3-0)", category: "Materiallar", sku: "SUT-003", qty: 24, max: 30, expiry: "5 dek 2026", status: "Norma", image: "/img/phone14/stock-3.png" },
  { id: "st5", name: "Kostniy material (Bone Graft)", category: "Materiallar", sku: "BG-007", qty: 2, max: 10, expiry: "1 mar 2026", status: "Kam qoldi", image: "/img/phone14/stock-4.png" },
  { id: "st6", name: "Dezinfeksiya vositasi", category: "Materiallar", sku: "DSF-019", qty: 8, max: 15, expiry: "12 apr 2026", status: "Kam qoldi", image: "/img/phone14/stock-5.png" },
];

export const phoneLabs: (Lab & { district: string; rating: number; reviews: number; tags: string[]; daysLabel: string; priceLabel: string; chip: string })[] = [
  { id: "dental-art-lab", name: "Dental Art Lab", city: "Toshkent", district: "Yakkasaroy", services: ["crown", "veneer"], materials: ["zirconia", "emax"], description: "Zirkon, E-max va press keramika.", days: 4, priceFrom: 800000, photo: "/img/phone14/lab-0.png", done: 128, verified: true, rating: 4.9, reviews: 128, tags: ["Zirkon", "E-max", "Press keramika", "Veneer"], daysLabel: "3-5 kun", priceLabel: "800 000", chip: "Zirkon" },
  { id: "uzdental-lab", name: "UzDental Lab", city: "Toshkent", district: "Chilonzor", services: ["implant", "crown"], materials: ["emax", "zirconia"], description: "Implant konstruktsiya va E-max.", days: 5, priceFrom: 900000, photo: "/img/phone14/lab-1.png", done: 96, verified: true, rating: 4.8, reviews: 96, tags: ["Implant konstruktsiya", "E-max", "Shtift", "Kombinatsiya"], daysLabel: "4-7 kun", priceLabel: "900 000", chip: "E-max" },
  { id: "smile-tech-lab", name: "Smile Tech Lab", city: "Toshkent", district: "Mirzo Ulug‘bek", services: ["veneer", "crown"], materials: ["zirconia", "metal-ceramic"], description: "Veneer va metallokeramika.", days: 3, priceFrom: 750000, photo: "/img/phone14/lab-2.png", done: 112, verified: true, rating: 4.9, reviews: 112, tags: ["Veneer", "Zirkon", "Metallokeramika", "Boomerang"], daysLabel: "2-4 kun", priceLabel: "750 000", chip: "Metallokeramika" },
  { id: "prolab-dental", name: "ProLab Dental", city: "Toshkent", district: "Shayxontohur", services: ["implant", "crown"], materials: ["zirconia", "emax"], description: "Implant protez va skrupli konstruktsiya.", days: 6, priceFrom: 1200000, photo: "/img/phone14/lab-3.png", done: 84, verified: true, rating: 4.7, reviews: 84, tags: ["Implant protez", "Skrupli konstruktsiya", "Zirkon", "E-max"], daysLabel: "5-7 kun", priceLabel: "1 200 000", chip: "Zirkon" },
  { id: "master-lab", name: "Master Lab", city: "Toshkent", district: "Olmazor", services: ["crown", "removable"], materials: ["zirconia", "emax"], description: "Kronalar va vaqtinchalik protez.", days: 4, priceFrom: 700000, photo: "/img/phone14/lab-4.png", done: 76, verified: true, rating: 4.8, reviews: 76, tags: ["Zirkon", "E-max", "Vaqtinchalik protez", "Kronalar"], daysLabel: "3-5 kun", priceLabel: "700 000", chip: "Shtift va qalpoq" },
  { id: "align-lab", name: "Align Lab", city: "Toshkent", district: "Yunusobod", services: ["cadcam"], materials: ["premium"], description: "Aligner va 3D chop.", days: 4, priceFrom: 600000, photo: "/img/phone14/lab-5.png", done: 93, verified: true, rating: 4.9, reviews: 93, tags: ["Kapalar (Aligner)", "Diagnostik model", "Skanlash", "3D chop"], daysLabel: "3-6 kun", priceLabel: "600 000", chip: "Zirkon" },
];

export const phoneAds: Listing[] = [
  { id: "ad-unit", type: "sotiladi", typeLabel: "Sotiladi", title: "Stomatologik unit (kreslo)", city: "Toshkent", date: "2024-10-12", dateLabel: "12 okt 2024", price: 25000000, priceLabel: "25 000 000 so‘m", views: 86, likes: 12, image: "/img/phone14/ad-0.png", category: "Uskunalar", description: "Yaxshi holatda, 2022 yil, barcha komplekt bilan." },
  { id: "ad-implant", type: "sotiladi", typeLabel: "Sotiladi", title: "Implant to‘plami (yangi)", city: "Toshkent", date: "2024-10-11", dateLabel: "11 okt 2024", price: 12500000, priceLabel: "12 500 000 so‘m", views: 64, likes: 9, image: "/img/phone14/ad-1.png", category: "Materiallar", description: "Straumann original, to‘liq to‘plam." },
  { id: "ad-room", type: "ijara", typeLabel: "Ijaraga", title: "Stomatologik kabinet ijaraga", city: "Toshkent", date: "2024-10-10", dateLabel: "10 okt 2024", price: 3000000, priceLabel: "3 000 000 so‘m / oy", views: 71, likes: 6, image: "/img/phone14/ad-2.png", category: "Klinika", description: "To‘liq jihozlangan, metro yaqinida." },
  { id: "ad-composite", type: "sotiladi", typeLabel: "Sotiladi", title: "Kompozit materiallar", city: "Samarqand", date: "2024-10-09", dateLabel: "9 okt 2024", price: 450000, priceLabel: "450 000 so‘m", views: 40, likes: 4, image: "/img/phone14/ad-3.png", category: "Materiallar", description: "Turli ranglarda, original, yangi." },
  { id: "ad-job", type: "ish", typeLabel: "Ish o‘rni", title: "Stomatolog shifokor kerak", city: "Toshkent", date: "2024-10-08", dateLabel: "8 okt 2024", price: null, priceLabel: "8 000 000 – 15 000 000 so‘m", views: 120, likes: 15, image: "/img/phone14/ad-4.png", category: "Ish o‘rni", description: "Zamonaviy klinikaga tajribali shifokor kerak." },
  { id: "ad-autoclave", type: "sotiladi", typeLabel: "Sotiladi", title: "Avtoklav (sterilizator)", city: "Toshkent", date: "2024-10-07", dateLabel: "7 okt 2024", price: 8500000, priceLabel: "8 500 000 so‘m", views: 55, likes: 7, image: "/img/phone14/ad-5.png", category: "Uskunalar", description: "Yaxshi holatda, 2021 yil, 23 litr." },
];

export const PHONE_PATIENTS_KEY = "sk-phone14-patients";
export const PHONE_APPTS_KEY = "sk-phone14-appts";
export const PHONE_PLANS_KEY = "sk-phone14-plans";
export const PHONE_PAYS_KEY = "sk-phone14-payments";

export function readPhoneStore<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "[]") as T[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function writePhoneStore<T>(key: string, items: T[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function findPhoneAd(id: string, extra: Listing[] = []) {
  return [...extra, ...phoneAds].find((item) => item.id === id) ?? null;
}

export function findPhonePatient(id: string) {
  return phonePatients.find((item) => item.id === id) ?? null;
}

export function findPhoneLab(id: string) {
  return phoneLabs.find((item) => item.id === id) ?? null;
}
