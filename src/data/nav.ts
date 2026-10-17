import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgePercent,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardList,
  Cpu,
  FlaskConical,
  GraduationCap,
  Home,
  LayoutGrid,
  Megaphone,
  MonitorPlay,
  Newspaper,
  Package,
  Presentation,
  Radio,
  Receipt,
  Shirt,
  ShoppingBag,
  Stethoscope,
  Store,
  Tag,
  UserRound,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  HeartHandshake,
  MessagesSquare,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  hint?: string;
  /** Extra route prefixes that also make this item active. */
  match?: string[];
};

export type NavGroup = {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

/** Always-visible first item. */
export const navTop: NavItem = { href: "/", label: "Bosh sahifa", icon: Home, match: ["/bosh-sahifa"] };

/** Always-visible last item. */
export const navBottom: NavItem = { href: "/profil", label: "Profil", icon: UserRound };

export const navGroups: NavGroup[] = [
  {
    id: "xaridlar",
    title: "Xaridlar",
    icon: ShoppingBag,
    items: [
      { href: "/marketplace", label: "Marketplace", icon: ShoppingBag, match: ["/product", "/savat", "/cart", "/checkout", "/buyurtma"] },
      { href: "/kategoriyalar", label: "Kategoriyalar", icon: LayoutGrid },
      { href: "/marketplace/brendlar", label: "Brendlar", icon: Tag },
      { href: "/marketplace/aksiyalar", label: "Aksiyalar", icon: BadgePercent },
      { href: "/ortiqcha-material", label: "Ortiqcha material", icon: Package },
      { href: "/elonlar", label: "E’lonlar", icon: Megaphone },
      { href: "/buyurtmalarim", label: "Buyurtmalarim", icon: Receipt },
      { href: "/marketplace/sotuvchi", label: "Sotuvchi kabineti", icon: Store, match: ["/sotuvchi"] },
    ],
  },
  {
    id: "talim",
    title: "Ta’lim va rivojlanish",
    icon: GraduationCap,
    items: [
      { href: "/seminarlar", label: "Seminarlar", icon: Presentation },
      { href: "/talim", label: "Onlayn darslar", icon: MonitorPlay },
      { href: "/kitoblar", label: "Kitoblar", icon: BookOpen },
      { href: "/mutaxassislar", label: "Mutaxassislar", icon: Users },
      { href: "/sertifikatlar", label: "Sertifikatlar", icon: Award },
    ],
  },
  {
    id: "klinika",
    title: "Klinika CRM",
    icon: Building2,
    items: [
      { href: "/mening-klinikam", label: "Mening klinikam", icon: Building2, match: ["/klinika"] },
      { href: "/crm/bemorlar", label: "Bemorlar", icon: UserRound, match: ["/crm"] },
      { href: "/crm/uchrashuvlar", label: "Uchrashuvlar", icon: CalendarDays },
      { href: "/crm/davolash-rejalari", label: "Davolash rejalari", icon: ClipboardList },
      { href: "/crm/tolovlar", label: "To‘lovlar", icon: Wallet },
      { href: "/crm/xizmatlar", label: "Xizmatlar", icon: Stethoscope },
      { href: "/crm/ombor", label: "Ombor", icon: Warehouse },
      { href: "/crm/hisobotlar", label: "Hisobotlar", icon: BarChart3 },
    ],
  },
  {
    id: "hamkorlar",
    title: "Xizmatlar va hamkorlar",
    icon: HeartHandshake,
    items: [
      { href: "/ustalar", label: "Ustalar", icon: Wrench },
      { href: "/laboratoriya", label: "Laboratoriya", icon: FlaskConical },
      { href: "/jihozlar", label: "Jihozlar", icon: Cpu },
      { href: "/forma", label: "Forma", icon: Shirt },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
      { href: "/ishlar", label: "Ishlar", icon: BriefcaseBusiness },
    ],
  },
  {
    id: "hamjamiyat",
    title: "Hamjamiyat",
    icon: MessagesSquare,
    items: [
      { href: "/community", label: "Community", icon: Users },
      { href: "/foydali-kanallar", label: "Foydali kanallar", icon: Radio, match: ["/kanallar"] },
      { href: "/yangiliklar", label: "Yangiliklar", icon: Newspaper },
    ],
  },
];

/** Every nav item in display order (top, grouped items, bottom). */
export const navItems: NavItem[] = [navTop, ...navGroups.flatMap((group) => group.items), navBottom];

function prefixMatch(pathname: string, prefix: string) {
  if (prefix === "/") return pathname === "/";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** The href of the single nav item that best matches the pathname (longest prefix wins). */
export function activeNavHref(pathname: string): string | null {
  let best: { href: string; len: number } | null = null;
  for (const item of navItems) {
    for (const prefix of [item.href, ...(item.match ?? [])]) {
      if (prefixMatch(pathname, prefix) && (!best || prefix.length > best.len)) best = { href: item.href, len: prefix.length };
    }
  }
  return best?.href ?? null;
}

/** Id of the group that contains the active route. */
export function activeNavGroup(pathname: string): string | null {
  const href = activeNavHref(pathname);
  if (!href) return null;
  return navGroups.find((group) => group.items.some((item) => item.href === href))?.id ?? null;
}
