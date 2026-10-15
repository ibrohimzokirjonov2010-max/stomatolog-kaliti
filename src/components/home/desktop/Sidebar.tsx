"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgePercent,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Crown,
  FlaskConical,
  BookOpen,
  GraduationCap,
  HelpCircle,
  Home,
  Hospital,
  LayoutGrid,
  Briefcase,
  Megaphone,
  MessageCircle,
  Monitor,
  Newspaper,
  MessagesSquare,
  MonitorPlay,
  Package,
  Presentation,
  Radio,
  Shirt,
  ShoppingBag,
  Store,
  Tag,
  UserRound,
  Users,
  Wallet,
  Wrench,
  Warehouse,
} from "lucide-react";

type Item = { key: string; icon: LucideIcon; label: string; href?: string };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Do‘kon",
    items: [
      { key: "all", icon: LayoutGrid, label: "Barcha mahsulotlar", href: "/marketplace" },
      { key: "market", icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
      { key: "surplus", icon: Package, label: "Ortiqcha material", href: "/ortiqcha-material" },
      { key: "cats", icon: LayoutGrid, label: "Kategoriyalar", href: "/marketplace" },
      { key: "brands", icon: Tag, label: "Brendlar", href: "/marketplace" },
      { key: "sale", icon: BadgePercent, label: "Aksiyalar", href: "/marketplace?sale=1" },
    ],
  },
  {
    title: "Ta’lim",
    items: [
      { key: "edu", icon: GraduationCap, label: "Ta’lim", href: "/talim" },
      { key: "sem", icon: Presentation, label: "Seminarlar", href: "/seminarlar" },
      { key: "online", icon: MonitorPlay, label: "Onlayn darslar", href: "/talim" },
      { key: "spec", icon: Users, label: "Mutaxassislar", href: "/ustalar" },
      { key: "cert", icon: Award, label: "Sertifikatlar", href: "/seminarlar/chiptalarim" },
      { key: "books", icon: BookOpen, label: "Kitoblar", href: "/kitoblar" },
    ],
  },
  {
    title: "Klinika",
    items: [
      { key: "myclinic", icon: Hospital, label: "Mening klinikam", href: "/mening-klinikam" },
      { key: "crm", icon: UserRound, label: "Bemorlar CRM", href: "/klinika" },
      { key: "meet", icon: CalendarDays, label: "Uchrashuvlar", href: "/klinika" },
      { key: "plan", icon: ClipboardList, label: "Davolash rejalari", href: "/klinika" },
      { key: "pay", icon: Wallet, label: "To‘lovlar", href: "/buyurtmalarim" },
      { key: "stock", icon: Warehouse, label: "Ombor (Inventar)", href: "/klinika" },
    ],
  },
  {
    title: "Xizmatlar",
    items: [
      { key: "labs", icon: FlaskConical, label: "Ustalar va laboratoriyalar", href: "/laboratoriya" },
      { key: "consult", icon: MessageCircle, label: "Konsultatsiyalar", href: "/community" },
      { key: "channels", icon: Radio, label: "Foydali kanallar", href: "/foydali-kanallar" },
      { key: "ads", icon: Megaphone, label: "E’lonlar", href: "/ishlar" },
      { key: "community", icon: MessagesSquare, label: "Community", href: "/community" },
      { key: "faq", icon: HelpCircle, label: "FAQ", href: "/shartlar" },
      { key: "forma", icon: Shirt, label: "Forma", href: "/forma" },
      { key: "jihoz", icon: Monitor, label: "Jihozlar", href: "/jihozlar" },
      { key: "ustalar", icon: Wrench, label: "Ustalar", href: "/ustalar" },
      { key: "jobs", icon: Briefcase, label: "Ishlar", href: "/ishlar" },
      { key: "news", icon: Newspaper, label: "Yangiliklar", href: "/yangiliklar" },
    ],
  },
];

function activeKey(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname === "/ortiqcha-material" || pathname.startsWith("/ortiqcha-material/")) return "surplus";
  if (pathname === "/marketplace" || (/^\/marketplace\/(?!sotuvchi|dokon)/.test(pathname) && !pathname.startsWith("/marketplace/sotuvchi"))) return "market";
  if (pathname === "/seminarlar" || (pathname.startsWith("/seminarlar/") && !pathname.startsWith("/seminarlar/chiptalarim"))) return "sem";
  if (pathname.startsWith("/seminarlar/chiptalarim")) return "cert";
  if (pathname === "/talim" || pathname.startsWith("/talim/")) return "edu";
  if (pathname === "/kitoblar" || pathname.startsWith("/kitoblar/")) return "books";
  if (pathname === "/foydali-kanallar" || pathname.startsWith("/foydali-kanallar/")) return "channels";
  if (pathname === "/mening-klinikam") return "myclinic";
  if (pathname === "/ustalar" || pathname.startsWith("/ustalar/")) return "ustalar";
  if (pathname === "/buyurtmalarim" || pathname.startsWith("/buyurtmalarim/")) return "pay";
  if (pathname === "/laboratoriya" || pathname.startsWith("/laboratoriya/")) return "labs";
  if (pathname === "/community" || pathname.startsWith("/community/")) return "community";
  if (pathname === "/ishlar" || pathname.startsWith("/ishlar/")) return "jobs";
  if (pathname === "/yangiliklar" || pathname.startsWith("/yangiliklar/")) return "news";
  if (pathname === "/jihozlar" || pathname.startsWith("/jihozlar/")) return "jihoz";
  if (pathname === "/shartlar") return "faq";
  if (pathname === "/forma" || (pathname.startsWith("/forma/") && !pathname.startsWith("/forma/buyurtmalarim"))) return "forma";
  if (pathname === "/klinika" || pathname.startsWith("/klinika/")) return "crm";
  return "";
}

export default function Sidebar() {
  const pathname = usePathname() ?? "/";
  const current = activeKey(pathname);

  return (
    <aside className="sh-side">
      <div className="sh-side-nav">
        <Link className={current === "home" ? "sh-nav active" : "sh-nav"} href="/" title="Bosh sahifa">
          <Home className="i" />
          <span>Bosh sahifa</span>
        </Link>
        {groups.map((group) => (
          <div className="sh-group" key={group.title}>
            <h4>{group.title}</h4>
            {group.items.map((item) => {
              const Icon = item.icon;
              const className = current === item.key ? "sh-nav active" : "sh-nav";
              const inner = (
                <>
                  <Icon className="i" />
                  <span>{item.label}</span>
                </>
              );
              if (!item.href) {
                return (
                  <span className={className} key={item.key} title={item.label}>
                    {inner}
                  </span>
                );
              }
              return (
                <Link className={className} href={item.href} key={item.key} title={item.label}>
                  {inner}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
      <Link className="sh-pro" href="/marketing">
        <span className="crown">
          <Crown className="i" />
        </span>
        <b>StomaHub Pro</b>
        <small>Klinikangiz uchun yana ko‘proq imkoniyatlar</small>
        <span className="go">
          Batafsil <ChevronRight className="i" />
        </span>
      </Link>
    </aside>
  );
}
