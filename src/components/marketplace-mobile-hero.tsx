"use client";

import { PromoSlider, type PromoSlide } from "@/components/promo-slider";
import type { ProductCategory } from "@/data/products";

/** Bonus slide — approved by the owner (10 000 so‘m); shown first. Set to false to hide it again. */
const SHOW_BONUS_SLIDE = true;

type CatSlide = Omit<PromoSlide, "onClick" | "href"> & { cat: ProductCategory };

const CATEGORY_SLIDES: CatSlide[] = [
  {
    id: "materiallar",
    badge: "MATERIALLAR",
    badgeCls: "bg-[#0B1220] text-white",
    title: "Stomatologik materiallar",
    subtitle: "Kompozit, bond va qolip materiallari, hammasi bitta joyda",
    cta: "Ko‘rish",
    cat: "materiallar",
    image: "/images/marketplace/mp-slayd-1-materiallar-mobil.webp",
    desktopImage: "/images/marketplace/mp-slayd-1-materiallar.webp",
    alt: "Kompozit shpritslar, bond va qolip materiallari",
  },
  {
    id: "implantlar",
    badge: "IMPLANTLAR",
    badgeCls: "bg-[#0066FF] text-white",
    title: "Implantlar va abatmentlar",
    subtitle: "Ishonchli brendlar, Toshkent bo‘ylab 24 soatda yetkazish",
    cta: "Ko‘rish",
    cat: "implantlar",
    image: "/images/marketplace/mp-slayd-2-implantlar-mobil.webp",
    desktopImage: "/images/marketplace/mp-slayd-2-implantlar.webp",
    alt: "Titan dental implantlar, abatmentlar va keramik tojlar",
  },
  {
    id: "asboblar",
    badge: "ASBOBLAR",
    badgeCls: "bg-[#00C2A8] text-white",
    title: "Asbob va jihozlar",
    subtitle: "Klinikangiz uchun professional asboblar",
    cta: "Ko‘rish",
    cat: "asboblar",
    image: "/images/marketplace/mp-slayd-3-asboblar-mobil.webp",
    desktopImage: "/images/marketplace/mp-slayd-3-asboblar.webp",
    alt: "Lotokdagi stomatologik asboblar: oyna, zond va qisqichlar",
  },
];

const BONUS_SLIDE: PromoSlide = {
  id: "bonus",
  badge: "BONUS",
  badgeCls: "bg-white/20 text-white",
  title: "10 000 so‘m bonus sizga!",
  subtitle: "Marketplace bo‘limida ishlating",
  cta: "Bonusni olish",
  href: "/bonuslarim",
  tone: "dark",
  image: "/images/marketplace/mp-slayd-4-bonus-mobil.webp",
  desktopImage: "/images/marketplace/mp-slayd-4-bonus.webp",
  desktopTextBaked: true,
  alt: "StomaHub Marketplace bonusi",
};

/** Marketplace mobile hero: category slides that open the matching category chip. */
export function MarketplaceMobileHero({ onPick }: { onPick: (cat: ProductCategory) => void }) {
  const slides: PromoSlide[] = [
    ...(SHOW_BONUS_SLIDE ? [BONUS_SLIDE] : []),
    ...CATEGORY_SLIDES.map(({ cat, ...s }) => ({ ...s, onClick: () => onPick(cat) })),
  ];
  return <PromoSlider slides={slides} testId="marketplace-hero" label="Marketplace bo‘limlari" className="mb-4" />;
}
