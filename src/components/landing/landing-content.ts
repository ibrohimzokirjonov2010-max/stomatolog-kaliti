import {
  BookOpen,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  ShoppingBag,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { publicContact } from "@/config/public-contact";

export const heroEyebrow = "Stomatologlar uchun yagona platforma";
export const heroTitle = "Qabullar va bemor kartasini";
export const heroAccent = "bitta oynada yuriting";
export const heroText =
  "O‘zbekiston stomatologlari uchun klinika CRM, seminarlar taqvimi va marketplace. Hisob ochish bepul.";

export const desktopNav = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/talim", label: "Ta’lim" },
  { href: "/seminarlar", label: "Seminarlar" },
  { href: "/kitoblar", label: "Kitoblar" },
  { href: "/crm", label: "Klinika CRM" },
  { href: "/ustalar", label: "Ustalar" },
] as const;

export const platformLinks = [
  ...desktopNav,
  { href: "/mutaxassislar", label: "Konsultatsiyalar" },
  { href: "/elonlar", label: "E’lonlar" },
] as const;

export const helpLinks = [
  { href: "#savollar", label: "Savol-javob" },
  { href: "/shartlar", label: "Foydalanish shartlari" },
  { href: "/maxfiylik", label: "Maxfiylik siyosati" },
  { href: "#aloqa", label: "Bog‘lanish" },
] as const;

export const features: { href: string; title: string; text: string; icon: LucideIcon; tone: string }[] = [
  { href: "/marketplace", title: "Marketplace", text: "Stomatologik mahsulotlar, uskunalar va materiallar", icon: ShoppingBag, tone: "bg-[#e8f1ff] text-[#0066FF]" },
  { href: "/talim", title: "Onlayn darslar", text: "Professional kurslar va videodarslar", icon: GraduationCap, tone: "bg-[#ffe8ee] text-[#e11d48]" },
  { href: "/seminarlar", title: "Seminarlar", text: "Amaliy seminarlar va master-klasslar", icon: CalendarDays, tone: "bg-[#e6faf6] text-[#00A896]" },
  { href: "/kitoblar", title: "Kitoblar", text: "Stomatologiyaga oid kitoblar va qo‘llanmalar", icon: BookOpen, tone: "bg-[#eef2ff] text-[#4f46e5]" },
  { href: "/crm", title: "Klinika CRM", text: "Bemorlar, rejalar, to‘lovlar va hisobotlar", icon: LayoutDashboard, tone: "bg-[#e8f1ff] text-[#0066FF]" },
  { href: "/ustalar", title: "Ustalar laboratoriyalari", text: "Tish texniklari va laboratoriyalar", icon: FlaskConical, tone: "bg-[#fff4e5] text-[#d97706]" },
  { href: "/mutaxassislar", title: "Konsultatsiyalar", text: "Hamkasblar bilan maslahat va tajriba almashish", icon: Stethoscope, tone: "bg-[#f3e8ff] text-[#7c3aed]" },
  { href: "/elonlar", title: "E’lonlar", text: "Ish, hamkorlik va xizmatlar e’lonlari", icon: Megaphone, tone: "bg-[#fff1e8] text-[#ea580c]" },
];

export const people = [
  { href: "/royxat", title: "Stomatolog", text: "Amaliyotchi shifokor", image: "/img/design-pr13/specialists/nigora-aliyeva.png", selected: true },
  { href: "/talim", title: "Talaba", text: "Tibbiyot talabasi", image: "/img/design-pr13/specialists/dilnoza-saidova.png", selected: false },
  { href: "/crm", title: "Klinika egasi", text: "Klinika rahbari", image: "/img/design-pr13/specialists/sardor-karimov.png", selected: false },
  { href: "/ustalar", title: "Tish texnigi", text: "Laboratoriya mutaxassisi", image: "/img/design-pr13/specialists/azizbek-mirzayev.png", selected: false },
  { href: "/marketplace/sotuvchi", title: "Sotuvchi", text: "Mahsulotlar sotuvchisi", image: "/img/design-pr13/specialists/bobur-tursunov.png", selected: false },
] as const;

export const crmPoints = [
  "Bemorlar kartasi va davolash rejalari",
  "Uchrashuvlar va kalendar",
  "To‘lovlar va qarzdorliklar",
  "Ombor va materiallar",
  "Hisobotlar va tahlillar",
  "Telegram eslatmalar",
] as const;

export const steps = [
  { n: "1", title: "Ro‘yxatdan o‘ting", text: "Bir necha daqiqada hisob yarating" },
  { n: "2", title: "Kerakli yo‘nalishni tanlang", text: "Marketplace, ta’lim yoki Klinika CRM" },
  { n: "3", title: "Imkoniyatlardan foydalaning", text: "O‘zingiz va klinikangizni rivojlantiring" },
] as const;

export const appPoints = [
  "Marketplace va buyurtmalar",
  "Seminarlar va onlayn darslar",
  "Uchrashuvlar va kalendar",
  "To‘lovlar va xabarnomalar",
] as const;

export const faqs = [
  { q: "StomaHub’dan foydalanish pullikmi?", a: "Ro‘yxatdan o‘tish va asosiy bo‘limlar bepul. Marketplace’dagi narx sotuvchiga bog‘liq, seminar va ayrim kurslar alohida to‘lanadi. Klinika CRM’ning boshlang‘ich imkoniyatlari hisob ochilishi bilan ishlaydi." },
  { q: "Seminarlarga qanday qatnashish mumkin?", a: "Seminarlar bo‘limidan tadbirni tanlang, joyni band qiling va to‘lovni Click yoki Payme orqali yakunlang. Chipta profilingizda saqlanadi." },
  { q: "Klinika CRM’ni bir nechta xodim ishlata oladimi?", a: "Ha. Klinika egasi shifokor va administratorlarni bir hisobga qo‘shishi mumkin. Har bir xodim bemorlar, qabul va to‘lovlarni o‘z ruxsati doirasida ko‘radi." },
  { q: "Mahsulotlarni qanday xarid qilish mumkin?", a: "Marketplace’dan mahsulotni savatga qo‘shing, yetkazib berish manzilini kiriting va Click yoki Payme orqali to‘lang. Buyurtma holati profilingizda ko‘rinadi." },
  { q: "To‘lovlarni qanday qabul qilish mumkin?", a: "Klinika CRM’da to‘lovni naqd, karta, Click yoki Payme sifatida yozib qo‘yasiz. Qarzdorlik bemor kartasida yangilanib boradi." },
  { q: "Texnik yordam qanday ishlaydi?", a: "Savolingiz bo‘lsa info@stomahub.uz ga yozing yoki Telegramda @stomahubuz ga murojaat qiling. Ish vaqtida javob beramiz." },
] as const;

export type ContactItem = {
  label: "Email" | "Telegram" | "Telefon" | "Manzil" | "Instagram";
  value: string;
  href: string | null;
};

export const contacts: ContactItem[] = [
  { label: "Email", value: publicContact.email, href: publicContact.emailHref },
  { label: "Telegram", value: publicContact.telegramHandle, href: publicContact.telegramUrl },
  ...(publicContact.phone
    ? [{ label: "Telefon" as const, value: publicContact.phone, href: `tel:${publicContact.phone.replace(/[^\d+]/g, "")}` }]
    : []),
  { label: "Manzil", value: publicContact.address, href: publicContact.addressMapHref },
  { label: "Instagram", value: publicContact.instagramUrl ? "Instagram" : "Tez orada", href: publicContact.instagramUrl },
];
