import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgePercent,
  Building2,
  FlaskConical,
  HelpCircle,
  Home,
  Images,
  Monitor,
  MonitorPlay,
  Presentation,
  ShieldCheck,
  Shirt,
  Sparkles,
  Star,
  Store,
  Users,
} from "lucide-react";
import { site } from "@/data/site";

type Item = { icon: LucideIcon; label: string; href?: string };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Do‘kon",
    items: [
      { icon: Store, label: "Marketplace", href: "/marketplace" },
      { icon: BadgePercent, label: "Maxsus takliflar" },
      { icon: Sparkles, label: "Yangi mahsulotlar" },
      { icon: ShieldCheck, label: "Mashhur brendlar" },
    ],
  },
  {
    title: "Ta’lim",
    items: [
      { icon: Presentation, label: "Seminarlar", href: "/seminarlar" },
      { icon: Users, label: "Ustalar", href: "/ustalar" },
      { icon: MonitorPlay, label: "Onlayn ta’lim", href: "/talim" },
    ],
  },
  {
    title: "Klinika",
    items: [
      { icon: Building2, label: "Klinika echimlari", href: "/klinika" },
      { icon: Monitor, label: "Uskunalar", href: "/jihozlar" },
      { icon: FlaskConical, label: "Laboratoriya", href: "/laboratoriya" },
      { icon: Activity, label: "Diagnostika" },
    ],
  },
  {
    title: "Xizmatlar",
    items: [
      { icon: Shirt, label: "Forma", href: "/forma" },
      { icon: Images, label: "Ishlar galereyasi" },
      { icon: Star, label: "Reyting va sharhlar" },
      { icon: HelpCircle, label: "Yordam", href: site.phoneHref },
    ],
  },
];

function NavItem({ icon: Icon, label, href, active }: Item & { active?: boolean }) {
  const className = active ? "sh-nav active" : "sh-nav";
  const inner = (
    <>
      <Icon className="i" />
      <span>{label}</span>
    </>
  );
  if (!href) {
    return (
      <span className={className} title={label}>
        {inner}
      </span>
    );
  }
  if (href.startsWith("tel:") || href.startsWith("http")) {
    return (
      <a className={className} href={href} title={label}>
        {inner}
      </a>
    );
  }
  return (
    <Link className={className} href={href} title={label}>
      {inner}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="sh-side">
      <NavItem icon={Home} label="Bosh sahifa" href="/" active />
      {groups.map((group) => (
        <div className="sh-group" key={group.title}>
          <h4>{group.title}</h4>
          {group.items.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </div>
      ))}
    </aside>
  );
}
