"use client";

import { PromoSlider, type PromoSlide } from "@/components/promo-slider";

/** Which catalog filter a hero button opens (existing Forma kinds only — no invented products). */
export type FormaHeroTarget = "" | "xalat" | "scrub";

const SLIDES: (Omit<PromoSlide, "onClick" | "href"> & { target: FormaHeroTarget })[] = [
  {
    id: "premium",
    badge: "PREMIUM",
    badgeCls: "bg-[#0B1220] text-white",
    title: (
      <>
        Stomatologlar uchun zamonaviy <span className="text-[#0F766E]">forma</span>
      </>
    ),
    subtitle: "Qulay, sifatli va professional ko‘rinish",
    cta: "Kolleksiyani ko‘rish",
    target: "",
    image: "/images/forma/slayd-1-zamonaviy-forma-mobil.webp",
    desktopImage: "/images/forma/slayd-1-zamonaviy-forma.webp",
    alt: "Firuza va to‘q ko‘k tibbiy formadagi ikki stomatolog klinikada",
  },
  {
    id: "klassik",
    badge: "KLASSIK",
    badgeCls: "bg-[#0F766E] text-white",
    title: "Klassik to‘plam",
    subtitle: "Oq xalat va yengil formalar, har kuni toza va ishonchli ko‘rinish",
    cta: "Ko‘rish",
    target: "xalat",
    image: "/images/forma/slayd-2-klassik-toplam-mobil.webp",
    desktopImage: "/images/forma/slayd-2-klassik-toplam.webp",
    alt: "Oq xalat va havorang forma kiygan stomatolog",
  },
  {
    id: "rangli",
    badge: "YANGI",
    badgeCls: "bg-[#00C2A8] text-white",
    title: "Rangli to‘plam",
    subtitle: "To‘q ko‘k, bordo, firuza va kulrang, o‘zingizga mosini tanlang",
    cta: "Ko‘rish",
    target: "scrub",
    image: "/images/forma/slayd-3-rangli-toplam-mobil.webp",
    desktopImage: "/images/forma/slayd-3-rangli-toplam.webp",
    alt: "Bordo rangli formadagi stomatolog, yonida rangli formalar to‘plami",
  },
];

/** Forma hero: 3 brand slides on the shared PromoSlider. */
export function FormaMobileHero({ onPick }: { onPick: (target: FormaHeroTarget) => void }) {
  const slides: PromoSlide[] = SLIDES.map(({ target, ...s }) => ({ ...s, onClick: () => onPick(target) }));
  return <PromoSlider slides={slides} testId="forma-hero" label="Forma kolleksiyalari" />;
}
