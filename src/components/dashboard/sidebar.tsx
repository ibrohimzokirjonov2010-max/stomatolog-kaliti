"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Headphones, ShieldCheck } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { Logo } from "@/components/logo";
import { useSellerWork } from "@/components/seller-provider";
import { SellerCabinetNav } from "@/components/seller-cabinet-nav";
import { isShopApproved } from "@/data/shops";
import { navItems } from "@/data/nav";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

const SOTUVCHI_HREF = "/marketplace/sotuvchi";
const PROFIL_HREF = "/profil";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { session } = useSellerWork();
  const { profile } = useDoctorProfile();
  const onMarketplace = pathname === "/marketplace" || pathname.startsWith("/marketplace/");
  const onSotuvchi = pathname === SOTUVCHI_HREF || pathname.startsWith(`${SOTUVCHI_HREF}/`);

  const cabinet = onSotuvchi && Boolean(session) && isShopApproved(session!);

  const visibleItems = navItems.filter((item) => {
    if (item.href === SOTUVCHI_HREF) return Boolean(session);
    return true;
  });
  // Profil is always last and pinned to the bottom of the sidebar.
  const mainItems = visibleItems.filter((item) => item.href !== PROFIL_HREF);
  const bottomItems = visibleItems.filter((item) => item.href === PROFIL_HREF);

  const renderItem = (item: (typeof navItems)[number]) => {
    const isSotuvchi = item.href === SOTUVCHI_HREF;
    const isMarketplace = item.href === "/marketplace";
    const active =
      item.href === "/"
        ? pathname === "/" || pathname.startsWith("/bosh-sahifa")
        : isSotuvchi
          ? onSotuvchi
          : isMarketplace
            ? (pathname === "/marketplace" || pathname.startsWith("/marketplace/")) && !onSotuvchi
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    const marketplaceActive = active && isMarketplace;
    const sotuvchiActive = active && isSotuvchi;
    const label = isSotuvchi && session ? "Mening do‘konim" : item.label;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13.5px] font-medium transition-colors",
          marketplaceActive || sotuvchiActive
            ? "bg-[#e8f1ff] text-[#0066FF]"
            : active
              ? "bg-primary text-white"
              : "text-slate-500 hover:bg-slate-50 hover:text-foreground"
        )}
      >
        <Icon className="size-[18px] shrink-0" strokeWidth={marketplaceActive || sotuvchiActive ? 2 : 1.6} />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <aside className={cn("flex h-full w-[232px] shrink-0 flex-col border-r border-border bg-white", className)}>
      <div className="px-4 py-4">
        <Link href="/" className="block rounded-xl">
          <Logo />
        </Link>
      </div>

      {cabinet ? (
        <SellerCabinetNav />
      ) : (
        <>
      <nav aria-label="Asosiy menyu" className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {mainItems.map(renderItem)}
      </nav>

      {bottomItems.length > 0 || profile?.isAdmin ? (
        <div className="space-y-0.5 border-t border-border px-3 pt-2">
          {profile?.isAdmin ? (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-[12px] px-3 py-2 text-[13.5px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-foreground"
            >
              <ShieldCheck className="size-[18px] shrink-0" strokeWidth={1.6} />
              <span className="truncate">Admin panel</span>
            </Link>
          ) : null}
          {bottomItems.map(renderItem)}
        </div>
      ) : null}

      <div className="p-3">
        <a
          href={site.phoneHref}
          className="flex items-center gap-2.5 rounded-2xl bg-[#eef4ff] px-3 py-3 text-slate-600"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <Headphones className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-foreground">Yordam kerakmi?</span>
            <span className="block text-[12px] text-muted-foreground">
              {onMarketplace ? "Tez va qulay yechimlar" : "24/7 Support xizmati"}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-slate-400" />
        </a>
      </div>
        </>
      )}
    </aside>
  );
}
