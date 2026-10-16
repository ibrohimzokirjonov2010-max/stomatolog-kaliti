import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgePercent,
  BookOpen,
  CalendarDays,
  LayoutGrid,
  Tag,
  Wallet,
  Warehouse,
  BriefcaseBusiness,
  ClipboardList,
  Building2,
  Cpu,
  FlaskConical,
  Home,
  Megaphone,
  MonitorPlay,
  Newspaper,
  Package,
  Radio,
  Shirt,
  ShoppingBag,
  Store,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
  /** Sub-pages shown under the item while one of its routes is open. */
  children?: NavItem[];
  /** Extra route prefixes that belong to this group (for active state). */
  match?: string[];
};

export const navItems: NavItem[] = [
  { href: "/", label: "Bosh sahifa", icon: Home },
  { href: "/ortiqcha-material", label: "Ortiqcha material", icon: Package },
  {
    href: "/marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    match: ["/kategoriyalar", "/brendlar", "/aksiyalar", "/elonlar"],
    children: [
      { href: "/kategoriyalar", label: "Kategoriyalar", icon: LayoutGrid },
      { href: "/brendlar", label: "Brendlar", icon: Tag },
      { href: "/aksiyalar", label: "Aksiyalar", icon: BadgePercent },
      { href: "/elonlar", label: "E’lonlar", icon: Megaphone },
    ],
  },
  { href: "/buyurtmalarim", label: "Buyurtmalarim", icon: ClipboardList },
  { href: "/marketplace/sotuvchi", label: "Sotuvchi", icon: Store },
  { href: "/seminarlar", label: "Seminarlar", icon: MonitorPlay },
  {
    href: "/onlayn-darslar",
    label: "Ta’lim",
    icon: BookOpen,
    match: ["/talim", "/mutaxassislar", "/sertifikatlar"],
    children: [
      { href: "/onlayn-darslar", label: "Onlayn darslar", icon: MonitorPlay },
      { href: "/mutaxassislar", label: "Mutaxassislar", icon: UserRound },
      { href: "/sertifikatlar", label: "Sertifikatlar", icon: Award },
    ],
  },
  { href: "/kitoblar", label: "Kitoblar", icon: BookOpen },
  { href: "/kanallar", label: "Foydali kanallar", icon: Radio },
  { href: "/community", label: "Community", icon: Users },
  {
    href: "/klinika",
    label: "Mening klinikam",
    icon: Building2,
    children: [
      { href: "/klinika/bemorlar", label: "Bemorlar CRM", icon: Users },
      { href: "/klinika/uchrashuvlar", label: "Uchrashuvlar", icon: CalendarDays },
      { href: "/klinika/davolash-rejalari", label: "Davolash rejalari", icon: ClipboardList },
      { href: "/klinika/tolovlar", label: "To‘lovlar", icon: Wallet },
      { href: "/klinika/ombor", label: "Ombor", icon: Warehouse },
    ],
  },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/forma", label: "Forma", icon: Shirt },
  { href: "/jihozlar", label: "Jihozlar", icon: Cpu },
  { href: "/ustalar", label: "Ustalar", icon: Wrench },
  { href: "/laboratoriya", label: "Laboratoriya", icon: FlaskConical },
  { href: "/ishlar", label: "Ishlar", icon: BriefcaseBusiness },
  { href: "/yangiliklar", label: "Yangiliklar", icon: Newspaper },
  { href: "/profil", label: "Profil", icon: UserRound },
];
