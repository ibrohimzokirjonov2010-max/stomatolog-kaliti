"use client";

import { PromoSlider, type PromoSlide } from "@/components/promo-slider";

/** In-page keyword filter a hero button applies to the Jihozlar list (matches real product names; null = show all). */
export type JihozPreset = { label: string; re: RegExp } | null;

export const JIHOZ_PRESETS = {
  endo: { label: "Endodontik jihozlar", re: /endo|apeks|apex|lokator/i },
  diagnostika: { label: "Rentgen va diagnostika", re: /rentgen|skaner|radioviziograf|tomograf|sensor|kamera|x-ray/i },
} as const;

const SLIDES: (Omit<PromoSlide, "onClick" | "href"> & { preset: JihozPreset })[] = [
  {
    id: "endodontiya",
    badge: "ENDODONTIYA",
    badgeCls: "bg-[#0B1220] text-white",
    title: "Endodontik jihozlar",
    subtitle: "Endomotor va apeks-lokatorlar, aniq va ishonchli davolash uchun",
    cta: "Ko‘rish",
    preset: JIHOZ_PRESETS.endo,
    image: "/images/jihozlar/jihoz-slayd-1-endodontiya-mobil.webp",
    desktopImage: "/images/jihozlar/jihoz-slayd-1-endodontiya.webp",
    alt: "Endomotor va apeks-lokator stomatologik jihozlari",
  },
  {
    id: "kreslo",
    badge: "KRESLO",
    badgeCls: "bg-[#0F766E] text-white",
    title: "Kreslo va stomatologik qurilmalar",
    subtitle: "Klinikangizni zamonaviy uskunalar bilan jihozlang",
    cta: "Ko‘rish",
    // No chair/unit listings yet — the button opens the full Jihozlar list instead of an empty filter.
    preset: null,
    image: "/images/jihozlar/jihoz-slayd-2-kreslo-mobil.webp",
    desktopImage: "/images/jihozlar/jihoz-slayd-2-kreslo.webp",
    alt: "Zamonaviy stomatologik kreslo va qurilma klinika kabinetida",
  },
  {
    id: "diagnostika",
    badge: "DIAGNOSTIKA",
    badgeCls: "bg-[#00C2A8] text-white",
    title: "Rentgen va diagnostika",
    subtitle: "Portativ rentgen va intraoral skanerlar",
    cta: "Ko‘rish",
    preset: JIHOZ_PRESETS.diagnostika,
    image: "/images/jihozlar/jihoz-slayd-3-diagnostika-mobil.webp",
    desktopImage: "/images/jihozlar/jihoz-slayd-3-diagnostika.webp",
    alt: "Portativ dental rentgen apparati va intraoral skaner",
  },
];

/** Jihozlar mobile hero: 3 brand slides on the shared PromoSlider; buttons filter the list below. */
export function JihozlarMobileHero({ onPick }: { onPick: (preset: JihozPreset) => void }) {
  const slides: PromoSlide[] = SLIDES.map(({ preset, ...s }) => ({ ...s, onClick: () => onPick(preset) }));
  return <PromoSlider slides={slides} testId="jihozlar-hero" label="Jihozlar bo‘limlari" className="mb-1" />;
}
