"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Headphones, ShieldCheck } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { Logo } from "@/components/logo";
import { useSellerWork } from "@/components/seller-provider";
import { SellerCabinetNav } from "@/components/seller-cabinet-nav";
import { isShopApproved } from "@/data/shops";
import { navBottom, navGroups, navTop, type NavGroup, type NavItem } from "@/data/nav";
import { useNavTree } from "@/components/nav/use-nav-tree";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

const SOTUVCHI_HREF = "/marketplace/sotuvchi";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { session } = useSellerWork();
  const { profile } = useDoctorProfile();
  const onMarketplace = pathname === "/marketplace" || pathname.startsWith("/marketplace/");
  const onSotuvchi = pathname === SOTUVCHI_HREF || pathname.startsWith(`${SOTUVCHI_HREF}/`);

  const cabinet = onSotuvchi && Boolean(session) && isShopApproved(session!);

  const { activeHref, isOpen, toggle } = useNavTree();

  const renderItem = (item: NavItem, sub = false) => {
    const isSotuvchi = item.href === SOTUVCHI_HREF;
    const active = isSotuvchi ? onSotuvchi : activeHref === item.href;
    const Icon = item.icon;
    const label = isSotuvchi && session ? "Mening do‘konim" : item.label;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-[12px] font-medium transition-colors",
          sub ? "px-2.5 py-1.5 text-[13px]" : "px-3 py-2 text-[13.5px]",
          active ? "bg-primary text-white" : "text-slate-500 hover:bg-slate-50 hover:text-foreground"
        )}
      >
        <Icon className={sub ? "size-4 shrink-0" : "size-[18px] shrink-0"} strokeWidth={active ? 2 : 1.6} />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  const renderGroup = (group: NavGroup) => {
    const open = isOpen(group.id);
    const GroupIcon = group.icon;
    return (
      <div key={group.id} className="pt-1" data-group={group.id}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => toggle(group.id)}
          className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[12.5px] font-semibold text-foreground transition-colors hover:bg-slate-50"
        >
          <GroupIcon className="size-[18px] shrink-0 text-slate-400" strokeWidth={1.8} />
          <span className="min-w-0 flex-1 truncate">{group.title}</span>
          <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition-transform", open ? "" : "-rotate-90")} />
        </button>
        {open ? (
          <div className="mt-0.5 mb-1 ml-[21px] space-y-0.5 border-l border-[#e3eaf6] pl-2">
            {group.items.map((item) => renderItem(item, true))}
          </div>
        ) : null}
      </div>
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
        {renderItem(navTop)}
        {navGroups.map(renderGroup)}
      </nav>

      {(

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
          {renderItem(navBottom)}
        </div>
      )}

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
