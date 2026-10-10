"use client";

import { PromoSlider, type PromoSlide } from "@/components/promo-slider";
import type { UstaService } from "@/data/masters";

const SLIDES: (Omit<PromoSlide, "onClick" | "href"> & { cat: UstaService })[] = [
  {
    id: "ornatish",
    badge: "O‘RNATISH",
    badgeCls: "bg-[#0066FF] text-white",
    title: "Stomatologik uskunalarni professional o‘rnatish",
    subtitle: "Tajribali ustalar — kafolat bilan",
    cta: "Usta topish",
    cat: "ornatish",
    image: "/images/ustalar/usta-slayd-1-ornatish-mobil.webp",
    desktopImage: "/images/ustalar/usta-slayd-1-ornatish.webp",
    alt: "Usta stomatologik kreslo o‘rnatmoqda",
  },
  {
    id: "tamirlash",
    badge: "TA’MIRLASH",
    badgeCls: "bg-[#0B1220] text-white",
    title: "Kreslo va uskunalar ta’miri",
    subtitle: "Tez chiqish, original ehtiyot qismlar",
    cta: "Xizmat so‘rash",
    cat: "tamirlash",
    image: "/images/ustalar/usta-slayd-2-tamirlash-mobil.webp",
    desktopImage: "/images/ustalar/usta-slayd-2-tamirlash.webp",
    alt: "Usta stomatologik kreslo mexanizmini ta’mirlamoqda",
  },
  {
    id: "rentgen",
    badge: "RENTGEN",
    badgeCls: "bg-[#00C2A8] text-white",
    title: "Rentgen va diagnostika servisi",
    subtitle: "O‘rnatish, kalibrovka va texnik xizmat",
    cta: "Batafsil",
    cat: "rentgen",
    image: "/images/ustalar/usta-slayd-3-rentgen-mobil.webp",
    desktopImage: "/images/ustalar/usta-slayd-3-rentgen.webp",
    alt: "Usta panoramik rentgen apparatini sozlamoqda",
  },
];

/** Ustalar mobile hero: 3 poster slides on the shared PromoSlider; each button applies its category filter to the list. */
export function UstalarMobileHero({ onPick }: { onPick: (cat: UstaService) => void }) {
  const slides: PromoSlide[] = SLIDES.map(({ cat, ...s }) => ({ ...s, onClick: () => onPick(cat) }));
  return <PromoSlider slides={slides} testId="ustalar-hero" label="Usta xizmatlari" className="mb-4" />;
}
