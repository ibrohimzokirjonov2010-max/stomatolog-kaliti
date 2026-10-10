import Link from "next/link";
import {
  Bone,
  BriefcaseBusiness,
  CalendarDays,
  Grid2x2,
  LayoutDashboard,
  Megaphone,
  Package,
  Scissors,
  Shirt,
  Wrench,
} from "lucide-react";

const categories = [
  { href: "/marketplace?cat=materiallar", label: "Materiallar", icon: Package },
  { href: "/marketplace?cat=asboblar", label: "Asboblar", icon: Scissors },
  { href: "/marketplace?cat=implantlar", label: "Implantlar", icon: Bone },
  { href: "/marketplace?cat=jihozlar", label: "Uskunalar", icon: Wrench },
  { href: "/forma", label: "Forma va kiyimlar", icon: Shirt },
  { href: "/ishlar", label: "Ishlar", icon: BriefcaseBusiness },
  { href: "/seminarlar", label: "Seminarlar", icon: CalendarDays },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/klinika", label: "Klinika CRM", icon: LayoutDashboard },
  { href: "/marketplace", label: "Barchasi", icon: Grid2x2 },
];

export function CategoryRow() {
  return (
    <section className="grid grid-cols-10 gap-2.5">
      {categories.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white px-2 py-3.5 text-center hover:border-primary/40 hover:shadow-sm"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#eef4ff] text-primary">
              <Icon className="size-[18px]" />
            </span>
            <span className="text-[11.5px] leading-tight font-medium text-slate-600">
              {item.label}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
