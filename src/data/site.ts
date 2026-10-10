export const site = {
  name: "StomaHub",
  wordmark: "STOMAHUB",
  tagline: "Sizning professional hamkoringiz",
  description:
    "StomaHub — stomatologlar uchun bitta platforma: marketplace, seminarlar, ta’lim va klinika marketingi. Toshkent.",
  city: "Toshkent",
  email: "info@stomatologkaliti.uz",
  phoneDisplay: "+998 71 200 00 00",
  phoneHref: "tel:+998712000000",
  telegram: "https://t.me/stomatologkaliti",
  telegramHandle: "@stomatologkaliti",
  /**
   * Last-resort demo placeholder only (catalog content, form defaults).
   * Logged-in chrome (topbar / mobile) must use useDoctorProfile(), never this.
   */
  doctor: {
    name: "Dr. Azizbek",
    role: "Stomatolog",
    avatar: "/images/avatar-azizbek.png",
  },
} as const;

export const marketingNeeds = [
  { id: "logo", label: "Logo va brend" },
  { id: "website", label: "Sayt shabloni" },
  { id: "ads", label: "Reklama materiallari" },
  { id: "instagram", label: "Instagram postlar" },
] as const;
