"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  Crown,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  type LucideIcon,
} from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { useReviewSummary, useUnreadConversations, useUnseenPayouts } from "@/lib/use-seller-live";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

export type CabinetTab =
  | "overview"
  | "products"
  | "orders"
  | "analytics"
  | "profile"
  | "card"
  | "messages"
  | "reviews"
  | "settings";

export const SOON_TABS: CabinetTab[] = [];

export const CABINET_MENU: { id: CabinetTab; label: string; icon: LucideIcon; soon?: boolean }[] = [
  { id: "overview", label: "Umumiy", icon: LayoutDashboard },
  { id: "products", label: "Mahsulotlar", icon: Package },
  { id: "orders", label: "Buyurtmalar", icon: ShoppingBag },
  { id: "analytics", label: "Analitika", icon: BarChart3 },
  { id: "profile", label: "Do‘kon profili", icon: Store },
  { id: "card", label: "Karta / to‘lov", icon: CreditCard },
  { id: "messages", label: "Xabarlar", icon: MessageSquare },
  { id: "reviews", label: "Reyting va sharhlar", icon: Star },
  { id: "settings", label: "Sozlamalar", icon: Settings },
];

export function cabinetTabFromParam(value: string | null): CabinetTab {
  return CABINET_MENU.some((m) => m.id === value) ? (value as CabinetTab) : "overview";
}

export function cabinetHref(tab: CabinetTab) {
  return tab === "overview" ? "/marketplace/sotuvchi" : `/marketplace/sotuvchi?tab=${tab}`;
}

function Menu() {
  const params = useSearchParams();
  const pathname = usePathname();
  const { shopOrders } = useSellerWork();
  const tab = pathname === "/marketplace/sotuvchi" ? cabinetTabFromParam(params.get("tab")) : null;
  const newOrders = shopOrders.filter((o) => o.status === "pending_accept").length;
  const unreadChats = useUnreadConversations();
  const unseenPayouts = useUnseenPayouts();
  const unansweredReviews = useReviewSummary().unanswered;

  return (
    <nav aria-label="Kabinet menyusi" className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
      {CABINET_MENU.map((item) => {
        const on = tab === item.id;
        const Icon = item.icon;
        const badgeN = item.id === "orders" ? newOrders : item.id === "messages" ? unreadChats : item.id === "reviews" ? unansweredReviews : item.id === "card" ? unseenPayouts : 0;
        const badge = badgeN > 0 ? String(badgeN) : null;
        return (
          <Link
            key={item.id}
            href={cabinetHref(item.id)}
            scroll={false}
            className={cn(
              "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13.5px] font-medium transition-colors",
              on ? "bg-[#e8f1ff] font-semibold text-[#0066FF]" : "text-slate-500 hover:bg-slate-50 hover:text-foreground",
            )}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={on ? 2 : 1.6} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {badge ? (
              <span className="rounded-full bg-[#ef4444] px-1.5 text-[11px] leading-[18px] font-bold text-white">{badge}</span>
            ) : item.soon ? (
              <span className="rounded-full bg-[#f1f4f9] px-1.5 text-[9.5px] leading-[16px] font-semibold text-[#8b93a7]">Tez orada</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function SellerCabinetNav() {
  return (
    <>
      <Suspense fallback={<div className="flex-1" />}>
        <Menu />
      </Suspense>
      <div className="space-y-2.5 p-3">
        <div className="rounded-2xl border border-[#fde9b8] bg-gradient-to-br from-[#fffaf0] to-[#fff3d6] p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#f59e0b] shadow-sm">
              <Crown className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground">Premium sotuvchi</p>
              <p className="text-[11.5px] leading-snug text-muted-foreground">Qo‘shimcha imkoniyatlar</p>
            </div>
          </div>
          <span className="mt-2.5 flex h-8 w-full items-center justify-center rounded-lg bg-white/80 text-[12.5px] font-semibold text-[#b45309] ring-1 ring-[#fde9b8]">
            Tez orada
          </span>
        </div>
        <a href={site.phoneHref} className="flex items-center gap-2.5 rounded-2xl bg-[#eef4ff] px-3 py-3 text-slate-600">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <Headphones className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-foreground">Yordam kerakmi?</span>
            <span className="block text-[12px] text-muted-foreground">24/7 Support xizmati</span>
          </span>
        </a>
      </div>
    </>
  );
}
