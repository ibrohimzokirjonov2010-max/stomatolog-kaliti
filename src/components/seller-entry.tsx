"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Plus, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useSellerWork } from "@/components/seller-provider";
import { isShopApproved, sellerCabinetHref } from "@/data/shops";
import { cn } from "@/lib/utils";

export function SellerEntryCta({
  className,
  fullWidth,
  plusIcon,
}: {
  className?: string;
  fullWidth?: boolean;
  plusIcon?: boolean;
}) {
  const { session } = useSellerWork();
  const label = !session
    ? "Sotuvchi bo‘lish"
    : isShopApproved(session)
      ? "Mening do‘konim"
      : session.verified === "rejected"
        ? "Arizani qayta yuborish"
        : "Ariza holati";
  return (
    <Link
      href={sellerCabinetHref()}
      className={cn(
        buttonVariants({ variant: session && isShopApproved(session) ? "outline" : "default" }),
        "h-10 shrink-0 !rounded-xl px-4",
        fullWidth && "w-full",
        className,
      )}
    >
      {plusIcon && !session ? <Plus className="size-4" /> : <Store className="size-4" />}
      {label}
    </Link>
  );
}

export function SellerCatalogHint({ className }: { className?: string }) {
  const { session } = useSellerWork();
  return (
    <p className={cn("text-[13px] text-[#8b93a7]", className)}>
      {session && isShopApproved(session) ? (
        <>
          Do‘koningiz ochiq.{" "}
          <Link href={sellerCabinetHref()} className="font-semibold text-[#0066FF] hover:underline">
            Mening do‘konim
          </Link>
        </>
      ) : session ? (
        <>
          Ariza tekshiruvda.{" "}
          <Link href={sellerCabinetHref()} className="font-semibold text-[#0066FF] hover:underline">
            Holatni ko‘rish
          </Link>
        </>
      ) : (
        <>
          Ishonchli do‘konlargina sotadi.{" "}
          <Link href={sellerCabinetHref()} className="font-semibold text-[#0066FF] hover:underline">
            Ariza topshirish
          </Link>
        </>
      )}
    </p>
  );
}

/** The single seller entry for buyers: a modest row in the Profil page list (section pages carry no seller CTA). */
export function ProfileSellerRow({ icon }: { icon: ReactNode }) {
  const { session } = useSellerWork();
  const approved = Boolean(session && isShopApproved(session));
  const title = !session ? "Sotuvchi bo‘lish" : approved ? "Mening do‘konim" : session.verified === "rejected" ? "Arizani qayta yuborish" : "Ariza holati";
  const sub = !session ? "Do‘kon ochish uchun ariza topshiring" : approved ? "Mahsulotlar, buyurtmalar va hisobotlar" : "Ariza platforma tekshiruvida";
  return (
    <Link
      href={sellerCabinetHref()}
      data-testid="profile-seller-row"
      className="flex items-center gap-3 rounded-2xl bg-[#f5f9ff] px-3.5 py-3 ring-1 ring-[#e0ecff] transition hover:bg-[#e8f1ff]"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#0066FF] shadow-sm">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-[#1a1d26]">{title}</span>
        <span className="block text-[12px] text-[#8b93a7]">{sub}</span>
      </span>
    </Link>
  );
}
