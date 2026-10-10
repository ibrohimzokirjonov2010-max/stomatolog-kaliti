"use client";

import { PromoSlider, type PromoSlide } from "@/components/promo-slider";
import type { JobCategory } from "@/data/jobs";

type Action = JobCategory | "post";

const SLIDES: (Omit<PromoSlide, "onClick" | "href"> & { action: Action })[] = [
  {
    id: "shifokor",
    title: "Klinikalarda shifokorlar uchun ish o‘rinlari",
    subtitle: "Toshkent va viloyatlardagi eng yaxshi takliflar",
    cta: "Vakansiyalarni ko‘rish",
    action: "shifokor",
    image: "/images/ishlar/ish-slayd-1-shifokor-mobil.webp",
    desktopImage: "/images/ishlar/ish-slayd-1-shifokor.webp",
    alt: "Stomatologiya kabinetidagi shifokor",
  },
  {
    id: "texnik",
    title: "Tish texniklari uchun ish",
    subtitle: "Laboratoriya va servis vakansiyalari",
    cta: "Texnik ishlari",
    action: "texnik",
    image: "/images/ishlar/ish-slayd-2-texnik-mobil.webp",
    desktopImage: "/images/ishlar/ish-slayd-2-texnik.webp",
    alt: "Tish texnigi laboratoriyada protez ustida ishlamoqda",
  },
  {
    id: "administrator",
    title: "Klinikangizga xodim kerakmi?",
    subtitle: "E’lon bering — mos mutaxassislar topiladi",
    cta: "E’lon berish",
    action: "post",
    image: "/images/ishlar/ish-slayd-3-administrator-mobil.webp",
    desktopImage: "/images/ishlar/ish-slayd-3-administrator.webp",
    alt: "Klinika qabulxonasidagi administrator",
  },
];

/** Ishlar mobile hero: 3 poster slides on the shared PromoSlider; buttons apply a segment filter or open the post form. */
export function IshlarMobileHero({ onSegment, onPost }: { onSegment: (c: JobCategory) => void; onPost: () => void }) {
  const slides: PromoSlide[] = SLIDES.map(({ action, ...s }) => ({ ...s, onClick: action === "post" ? onPost : () => onSegment(action) }));
  return <PromoSlider slides={slides} testId="ishlar-hero" label="Ish o‘rinlari" className="mb-4" />;
}
