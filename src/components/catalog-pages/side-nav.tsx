"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Award,
  BadgePercent,
  BookOpen,
  Building2,
  ClipboardList,
  MessageSquare,
  GraduationCap,
  Heart,
  Home,
  LayoutGrid,
  MonitorPlay,
  Package,
  Presentation,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { id: string; href: string; label: string; icon: LucideIcon };

const MARKET_TOP: NavItem[] = [
  { id: "home", href: "/", label: "Bosh sahifa", icon: Home },
  { id: "kategoriyalar", href: "/kategoriyalar", label: "Kategoriyalar", icon: LayoutGrid },
  { id: "brendlar", href: "/brendlar", label: "Brendlar", icon: Tag },
  { id: "all", href: "/marketplace", label: "Barcha mahsulotlar", icon: ShoppingBag },
  { id: "new", href: "/marketplace", label: "Yangi mahsulotlar", icon: Sparkles },
  { id: "popular", href: "/marketplace", label: "Ommabop mahsulotlar", icon: Star },
  { id: "aksiyalar", href: "/aksiyalar", label: "Aksiyalar", icon: BadgePercent },
];
const MARKET_BOTTOM: NavItem[] = [
  { id: "fav", href: "/profil", label: "Sevimlilar", icon: Heart },
  { id: "orders", href: "/buyurtmalarim", label: "Mening buyurtmalarim", icon: Package },
  { id: "seller", href: "/marketplace/sotuvchi", label: "Sotuvchi bo‘lish", icon: Store },
];
const EDU_TOP: NavItem[] = [
  { id: "home", href: "/", label: "Bosh sahifa", icon: Home },
  { id: "darslar", href: "/onlayn-darslar", label: "Onlayn darslar", icon: MonitorPlay },
  { id: "seminarlar", href: "/seminarlar", label: "Seminarlar", icon: Presentation },
  { id: "ustalar", href: "/ustalar", label: "Ustalar", icon: UserRound },
  { id: "kitoblar", href: "/kitoblar", label: "Kitoblar", icon: BookOpen },
  { id: "kategoriyalar", href: "/kategoriyalar", label: "Kategoriyalar", icon: LayoutGrid },
  { id: "brendlar", href: "/brendlar", label: "Brendlar", icon: Tag },
  { id: "aksiyalar", href: "/aksiyalar", label: "Aksiyalar", icon: BadgePercent },
];
const EDU_BOTTOM: NavItem[] = [
  { id: "fav", href: "/profil", label: "Sevimlilar", icon: Heart },
  { id: "kurslar", href: "/talim", label: "Mening kurslarim", icon: GraduationCap },
  { id: "sert", href: "/sertifikatlar", label: "Sertifikatlar", icon: Award },
  { id: "settings", href: "/profil", label: "Sozlamalar", icon: Settings },
];

const PRO_TOP: NavItem[] = [
  { id: "home", href: "/", label: "Bosh sahifa", icon: Home },
  { id: "darslar", href: "/onlayn-darslar", label: "Onlayn darslar", icon: MonitorPlay },
  { id: "seminarlar", href: "/seminarlar", label: "Seminarlar", icon: Presentation },
  { id: "mutaxassislar", href: "/mutaxassislar", label: "Mutaxassislar", icon: UserRound },
  { id: "klinikalar", href: "/klinika", label: "Klinikalar", icon: Building2 },
  { id: "kitoblar", href: "/kitoblar", label: "Kitoblar", icon: BookOpen },
  { id: "kategoriyalar", href: "/kategoriyalar", label: "Kategoriyalar", icon: LayoutGrid },
  { id: "brendlar", href: "/brendlar", label: "Brendlar", icon: Tag },
  { id: "aksiyalar", href: "/aksiyalar", label: "Aksiyalar", icon: BadgePercent },
];
const PRO_BOTTOM: NavItem[] = [
  { id: "fav", href: "/profil", label: "Sevimlilar", icon: Heart },
  { id: "sorovlar", href: "/ustalar/sorovlarim", label: "Mening so‘rovlarim", icon: ClipboardList },
  { id: "xabarlar", href: "/profil", label: "Xabarlar", icon: MessageSquare },
  { id: "settings", href: "/profil", label: "Sozlamalar", icon: Settings },
];

export type Promo = { title: ReactNode; text: string; cta: string; href: string; image?: string; icon?: LucideIcon };

export function CatalogSideNav({
  active,
  promo,
  variant = "market",
}: {
  active: string;
  promo: Promo;
  variant?: "market" | "edu" | "pro";
}) {
  const top = variant === "edu" ? EDU_TOP : variant === "pro" ? PRO_TOP : MARKET_TOP;
  const bottom = variant === "edu" ? EDU_BOTTOM : variant === "pro" ? PRO_BOTTOM : MARKET_BOTTOM;
  const PromoIcon = promo.icon;
  const row = (item: NavItem) => {
    const on = item.id === active;
    const Icon = item.icon;
    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          "flex h-10 items-center gap-3 rounded-lg px-3 text-[13.5px] transition-colors",
          on ? "bg-[#EAF2FF] font-semibold text-[#0066FF]" : "text-[#1f2a44] hover:bg-[#f4f7fc]",
        )}
      >
        <Icon className="size-[18px] shrink-0" strokeWidth={on ? 2 : 1.6} />
        {item.label}
      </Link>
    );
  };
  return (
    <aside className="sticky top-0 hidden w-[236px] shrink-0 flex-col rounded-2xl border border-[#eceff5] bg-white p-2.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:flex">
      <nav className="space-y-0.5">{top.map(row)}</nav>
      <div className="mx-3 my-2.5 h-px bg-[#eceff5]" />
      <nav className="space-y-0.5">{bottom.map(row)}</nav>
      <div className="relative mt-4 overflow-hidden rounded-xl bg-gradient-to-br from-[#EEF4FF] to-[#E3EDFF] p-4">
        {promo.image ? (
          <Image src={promo.image} alt="" width={120} height={120} className="pointer-events-none absolute -top-1 -right-3 h-[110px] w-auto object-contain" />
        ) : null}
        {PromoIcon ? <PromoIcon className="relative mb-2 size-6 text-[#0066FF]" /> : <div className="h-14" />}
        <h3 className="relative max-w-[150px] text-[15px] leading-snug font-bold text-[#0B1F4D]">{promo.title}</h3>
        <p className="relative mt-1.5 text-[12px] leading-relaxed text-[#6b7590]">{promo.text}</p>
        <Link
          href={promo.href}
          className="relative mt-3.5 flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0066FF] text-[13px] font-semibold text-white hover:bg-[#0057d9]"
        >
          {promo.cta} <ArrowRight className="size-4" />
        </Link>
      </div>
    </aside>
  );
}

export function CatalogLayout({ side, children }: { side: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-5">
      {side}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function PageTitle({ title, subtitle, right }: { title: string; subtitle: string; right?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-start gap-3 lg:mb-5">
      <div className="min-w-0">
        <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#0B1F4D] lg:text-[30px]">{title}</h1>
        <p className="mt-1 text-[13.5px] text-[#8b93a7] lg:text-[15px]">{subtitle}</p>
      </div>
      {right ? <div className="ml-auto flex items-center gap-2.5">{right}</div> : null}
    </header>
  );
}

export function StatBadge({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e3ebfa] bg-[#EEF4FF] px-4 py-2.5">
      <Icon className="size-6 shrink-0 text-[#0066FF]" strokeWidth={1.7} />
      <div className="leading-tight">
        <div className="text-[13px] font-bold text-[#0B1F4D]">{title}</div>
        {text ? <div className="mt-0.5 text-[11.5px] text-[#6b7590]">{text}</div> : null}
      </div>
    </div>
  );
}

/** Horizontally scrolling chip row (wraps-free on mobile, single line on desktop). */
export function ChipRow<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "h-9 shrink-0 rounded-lg border px-3.5 text-[12.5px] font-medium whitespace-nowrap transition-colors",
            value === item.id
              ? "border-[#0066FF] bg-[#0066FF] text-white"
              : "border-[#e6eaf2] bg-white text-[#1f2a44] hover:border-[#0066FF]/40",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
