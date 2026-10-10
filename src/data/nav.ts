import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
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
};

export const navItems: NavItem[] = [
  { href: "/", label: "Bosh sahifa", icon: Home },
  { href: "/ortiqcha-material", label: "Ortiqcha material", icon: Package },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/buyurtmalarim", label: "Buyurtmalarim", icon: ClipboardList },
  { href: "/marketplace/sotuvchi", label: "Sotuvchi", icon: Store },
  { href: "/seminarlar", label: "Seminarlar", icon: MonitorPlay },
  { href: "/talim", label: "Ta’lim", icon: BookOpen },
  { href: "/kitoblar", label: "Kitoblar", icon: BookOpen },
  { href: "/kanallar", label: "Foydali kanallar", icon: Radio },
  { href: "/community", label: "Community", icon: Users },
  { href: "/klinika", label: "Mening klinikam", icon: Building2 },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/forma", label: "Forma", icon: Shirt },
  { href: "/jihozlar", label: "Jihozlar", icon: Cpu },
  { href: "/ustalar", label: "Ustalar", icon: Wrench },
  { href: "/laboratoriya", label: "Laboratoriya", icon: FlaskConical },
  { href: "/ishlar", label: "Ishlar", icon: BriefcaseBusiness },
  { href: "/yangiliklar", label: "Yangiliklar", icon: Newspaper },
  { href: "/profil", label: "Profil", icon: UserRound },
];
