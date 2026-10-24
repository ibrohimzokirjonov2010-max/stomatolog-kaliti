"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock3, ExternalLink, LogOut, Pencil, RefreshCw, ShieldCheck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SellerApplyForm } from "@/components/seller-apply-form";
import { ShopAvatar } from "@/components/seller-ui";
import { useSellerWork } from "@/components/seller-provider";
import {
  normalizeSocialHandle,
  socialDisplay,
  type Shop,
} from "@/data/shops";
import { cn } from "@/lib/utils";

function SocialLink({ label, value, kind }: { label: string; value?: string; kind?: "instagram" | "telegram" }) {
  if (!value?.trim()) return null;
  const href =
    kind === "instagram" || kind === "telegram"
      ? normalizeSocialHandle(value, kind)
      : value.startsWith("http")
        ? value
        : `https://${value}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-[#e6eaf2] bg-white px-2.5 py-1 text-[12px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA]"
    >
      {label}: {socialDisplay(value)}
      <ExternalLink className="size-3" />
    </a>
  );
}

export function SellerPendingStatus({ shop }: { shop: Shop }) {
  const { logout } = useSellerWork();
  const [editing, setEditing] = useState(false);

  return (
    <div className="mx-auto max-w-2xl space-y-3 pb-16 sm:space-y-4">
      <p className="text-[12px] text-[#8b93a7] sm:text-[13px]">
        <Link href="/marketplace" className="text-[#0F766E] hover:underline">
          Marketplace
        </Link>
        <span className="mx-1">/</span>
        <span>Sotuvchi arizasi</span>
      </p>

      <section className="rounded-[14px] border border-[#fde68a] bg-[#fffbeb] p-3.5 sm:rounded-[16px] sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fef3c7] text-[#b45309]">
            <Clock3 className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-bold tracking-tight text-[#1a1d26] sm:text-[22px]">
              Arizangiz ko‘rib chiqilmoqda
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6b7280] sm:text-sm">
              Ishonchli do‘konlargina sotadi. Platforma ijtimoiy tarmoqlar va ma’lumotlarni tekshiradi. Shu paytda
              mahsulot qo‘shish va katalogga chiqish yopiq.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:rounded-[16px] sm:p-5">
        <div className="flex items-start gap-3">
          <ShopAvatar shop={shop} className="size-12 text-[16px] sm:size-14 sm:text-[18px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[#1a1d26]">{shop.name}</p>
            <p className="mt-0.5 text-[12.5px] text-[#6b7280]">
              {shop.ownerName} · {shop.city} · {shop.phone}
            </p>
            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[#4b5568]">{shop.bio}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <SocialLink label="IG" value={shop.instagram} kind="instagram" />
              <SocialLink label="TG" value={shop.telegram} kind="telegram" />
              <SocialLink label="FB" value={shop.facebook} />
              <SocialLink label="Web" value={shop.website} />
            </div>
            {shop.address ? (
              <p className="mt-2 text-[12px] text-[#8b93a7]">Manzil: {shop.address}</p>
            ) : null}
            {shop.yearsInBusiness != null ? (
              <p className="text-[12px] text-[#8b93a7]">Tajriba: {shop.yearsInBusiness} yil</p>
            ) : null}
            {shop.appliedAt ? (
              <p className="mt-1 text-[11px] text-[#8b93a7]">
                Yuborilgan: {new Date(shop.appliedAt).toLocaleString("uz-UZ")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 !rounded-xl"
            onClick={() => setEditing((v) => !v)}
          >
            <Pencil className="size-3.5" />
            {editing ? "Yopish" : "Arizani tahrirlash"}
          </Button>
          <Button type="button" variant="ghost" className="h-10 !rounded-xl text-[#8b93a7]" onClick={logout}>
            <LogOut className="size-3.5" />
            Chiqish
          </Button>
        </div>
      </section>

      {editing ? (
        <SellerApplyForm mode="edit" initial={shop} onSuccess={() => setEditing(false)} submitLabel="Saqlash" />
      ) : null}

      <p className="flex items-start gap-2 text-[12px] leading-relaxed text-[#8b93a7]">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
        Tekshiruvdan o‘tgach kabinet to‘liq ochiladi — Marketplace, Forma va Jihozlarga mahsulot qo‘shasiz. Odatda 24 soat ichida
        ko‘rib chiqiladi.
      </p>
    </div>
  );
}

export function SellerRejectedStatus({ shop }: { shop: Shop }) {
  const { logout } = useSellerWork();
  const [reapplyOpen, setReapplyOpen] = useState(true);

  return (
    <div className="mx-auto max-w-2xl space-y-3 pb-16 sm:space-y-4">
      <p className="text-[12px] text-[#8b93a7] sm:text-[13px]">
        <Link href="/marketplace" className="text-[#0F766E] hover:underline">
          Marketplace
        </Link>
        <span className="mx-1">/</span>
        <span>Sotuvchi arizasi</span>
      </p>

      <section className="rounded-[14px] border border-[#fecaca] bg-[#fef2f2] p-3.5 sm:rounded-[16px] sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fee2e2] text-[#b91c1c]">
            <AlertCircle className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[18px] font-bold tracking-tight text-[#1a1d26] sm:text-[22px]">Ariza rad etildi</h1>
            <p className="mt-1 text-[13px] leading-relaxed text-[#6b7280] sm:text-sm">
              {shop.rejectReason?.trim() || "Ijtimoiy tarmoqlar yoki ma’lumot yetarli emas."}
            </p>
            <p className="mt-2 text-[13px] text-[#4b5568]">
              Ma’lumotlarni to‘ldirib qayta ariza yuborishingiz mumkin.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[14px] border border-[#eceff5] bg-white p-3 sm:rounded-[16px] sm:p-5">
        <p className="text-[15px] font-semibold text-[#1a1d26]">{shop.name}</p>
        <p className="mt-0.5 text-[12.5px] text-[#6b7280]">
          {shop.ownerName} · {shop.city}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" className="h-10 !rounded-xl" onClick={() => setReapplyOpen(true)}>
            <RefreshCw className="size-3.5" />
            Qayta ariza
          </Button>
          <Button type="button" variant="ghost" className="h-10 !rounded-xl text-[#8b93a7]" onClick={logout}>
            Chiqish
          </Button>
          <Link href="/marketplace" className={cn(buttonVariants({ variant: "outline" }), "h-10 !rounded-xl")}>
            Marketplace
          </Link>
        </div>
      </section>

      {reapplyOpen ? <SellerApplyForm mode="reapply" initial={shop} onSuccess={() => setReapplyOpen(false)} /> : null}
    </div>
  );
}
