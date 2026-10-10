"use client";

import { PromoSlider, type PromoSlide } from "@/components/promo-slider";
import type { LabService } from "@/data/labs";

type Action = LabService | "list";

const SLIDES: (Omit<PromoSlide, "onClick" | "href"> & { action: Action })[] = [
  {
    id: "crown",
    title: "Professional crown buyurtmasi",
    subtitle: "Zirkon va E-max — Toshkent lablaridan",
    cta: "Crown buyurtma",
    action: "crown",
    image: "/images/laboratoriya/lab-slayd-1-crown-mobil.webp",
    desktopImage: "/images/laboratoriya/lab-slayd-1-crown.webp",
    alt: "Gips modeldagi keramik koronka",
  },
  {
    id: "veneer",
    title: "Estetik veneerlar",
    subtitle: "Rang tanlash va aniq moslashuv",
    cta: "Veneer buyurtma",
    action: "veneer",
    image: "/images/laboratoriya/lab-slayd-2-veneer-mobil.webp",
    desktopImage: "/images/laboratoriya/lab-slayd-2-veneer.webp",
    alt: "Rang shkalasi yonidagi veneerlar",
  },
  {
    id: "implant",
    title: "Implant va protez uchun lab",
    subtitle: "CAD/CAM, titanium implant, protez",
    cta: "Lab topish",
    action: "list",
    image: "/images/laboratoriya/lab-slayd-3-implant-mobil.webp",
    desktopImage: "/images/laboratoriya/lab-slayd-3-implant.webp",
    alt: "Implant ustidagi koronka va CAD/CAM frezer",
  },
];

/** Laboratoriya mobile hero: 3 poster slides on the shared PromoSlider; buttons apply a chip filter or scroll to the list. */
export function LabMobileHero({ onService, onList }: { onService: (s: LabService) => void; onList: () => void }) {
  const slides: PromoSlide[] = SLIDES.map(({ action, ...s }) => ({ ...s, onClick: action === "list" ? onList : () => onService(action) }));
  return <PromoSlider slides={slides} testId="lab-hero" label="Laboratoriya xizmatlari" className="mb-3.5" />;
}
