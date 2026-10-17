"use client";

import { usePathname } from "next/navigation";
import { SellerCabinetNav } from "@/components/seller-cabinet-nav";
import { useSellerWork } from "@/components/seller-provider";
import { isShopApproved } from "@/data/shops";

/** Seller cabinet links stay in the content column so the app sidebar never changes. */
export function SellerRail() {
  const pathname = usePathname() ?? "";
  const { session } = useSellerWork();
  const onSotuvchi = pathname === "/marketplace/sotuvchi" || pathname.startsWith("/marketplace/sotuvchi/");
  const cabinet = onSotuvchi && Boolean(session) && isShopApproved(session!);
  if (!cabinet) return null;
  return (
    <aside className="dh-seller hidden lg:block" data-testid="seller-cabinet-nav">
      <SellerCabinetNav />
    </aside>
  );
}
