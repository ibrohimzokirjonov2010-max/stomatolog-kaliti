"use client";

import { BadgeCheck, Ban, Clock3 } from "lucide-react";
import type { Shop } from "@/data/shops";
import { cn } from "@/lib/utils";

export function ShopAvatar({ shop, className }: { shop: Shop; className?: string }) {
  if (shop.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={shop.logo} alt="" className={cn("rounded-2xl object-cover", className)} />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl bg-[#F0FDFA] font-bold text-[#0F766E]",
        className,
      )}
    >
      {shop.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function VerifiedBadge({ status }: { status: Shop["verified"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#ecfdf3] px-1.5 py-0.5 text-[10px] font-semibold text-[#15803d] sm:gap-1 sm:px-2.5 sm:text-[11px]">
        <BadgeCheck className="size-3 sm:size-3.5" />
        <span className="sm:hidden">OK</span>
        <span className="hidden sm:inline">Tasdiqlangan</span>
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#fef2f2] px-1.5 py-0.5 text-[10px] font-semibold text-[#b91c1c] sm:gap-1 sm:px-2.5 sm:text-[11px]">
        <Ban className="size-3 sm:size-3.5" />
        <span className="sm:hidden">Rad</span>
        <span className="hidden sm:inline">Rad etilgan</span>
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-[#fff7ed] px-1.5 py-0.5 text-[10px] font-semibold text-[#c2410c] sm:gap-1 sm:px-2.5 sm:text-[11px]">
      <Clock3 className="size-3 sm:size-3.5" />
      <span className="sm:hidden">Kutilmoqda</span>
      <span className="hidden sm:inline">Ko‘rib chiqilmoqda</span>
    </span>
  );
}
