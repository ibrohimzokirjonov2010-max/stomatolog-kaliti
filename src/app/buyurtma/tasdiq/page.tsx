"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MapPinned } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { apparelMetaLabel } from "@/data/forma";
import { surplusCartMeta } from "@/data/surplus";
import { formatMoney } from "@/lib/format";
import {
  getOrder,
  syncOrders,
  orderStatusLabel,
  paymentMethods,
  paymentStateLabel,
  statusBadgeClass,
  type Order,
} from "@/lib/orders";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

function Confirmation() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const isClient = useIsClient();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    if (!isClient) return;
    const cached = id ? getOrder(id) : undefined;
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a server-backed external cache
      setOrder(cached);
      return;
    }
    void syncOrders(true).finally(() => setOrder(id ? (getOrder(id) ?? null) : null));
  }, [id, isClient]);

  if (order === undefined) {
    return (
      <div className="rounded-[20px] border border-[#eceff5] bg-white px-6 py-16 text-center text-sm text-[#8b93a7]">
        Buyurtma tekshirilmoqda...
      </div>
    );
  }

  const pay = order ? paymentMethods.find((item) => item.id === order.payment)?.label : "";

  if (!order) {
    return (
      <div className="rounded-[20px] border border-[#eceff5] bg-white px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1a1d26]">Buyurtma topilmadi</p>
        <p className="mt-1 text-sm text-[#8b93a7]">Buyurtmalar akkauntingizda saqlanadi — tizimga kirganingizni tekshiring.</p>
        <Link href="/marketplace" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
          Marketplace’ga o‘tish
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl overflow-hidden rounded-[20px] border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="bg-gradient-to-b from-[#ecfdf3] to-white px-6 pb-2 pt-8 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-[#16a34a] shadow-[0_4px_16px_rgba(22,163,74,0.18)]">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-4 text-[22px] font-bold tracking-tight text-[#1a1d26] sm:text-[24px]">
          Buyurtma qabul qilindi
        </h1>
        <p className="mt-1.5 text-[13.5px] text-[#8b93a7]">
          {order.paymentState === "awaiting_payment"
            ? order.payment === "naqd"
              ? "To‘lov yetkazib berilganda naqd qilinadi. Sotuvchi qabulini kutmoqda."
              : "To‘lov hali tasdiqlanmagan. Sotuvchi qabulini kutmoqda."
            : "Sotuvchi qabulini kutmoqda."}
        </p>
        <p className="mt-4 inline-flex rounded-xl bg-[#F0FDFA] px-4 py-2.5 text-[15px] font-semibold text-[#0F766E]">
          {order.id}
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
              statusBadgeClass(order.status),
            )}
          >
            {orderStatusLabel[order.status]}
          </span>
          <span className="inline-flex rounded-full bg-[#f4f7fb] px-2.5 py-0.5 text-[11px] font-medium text-[#6b7280] ring-1 ring-[#e8ecf3]">
            {paymentStateLabel[order.paymentState]}
          </span>
        </div>
      </div>

      <dl className="space-y-1.5 px-6 pt-5 text-left text-[13.5px] text-[#4b5568]">
        <div className="flex justify-between">
          <dt>Qabul qiluvchi</dt>
          <dd className="font-medium text-[#1a1d26]">{order.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Telefon</dt>
          <dd>{order.phone}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Manzil</dt>
          <dd className="text-right">
            {order.city}, {order.address}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>To‘lov</dt>
          <dd>{pay}</dd>
        </div>
        {order.note ? (
          <div className="flex justify-between gap-4">
            <dt>Izoh</dt>
            <dd className="text-right">{order.note}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-[#eceff5] pt-2 text-[16px] font-bold text-[#1a1d26]">
          <dt>Jami</dt>
          <dd>{formatMoney(order.total, "UZS")}</dd>
        </div>
      </dl>

      <ul className="mx-6 mt-4 space-y-1.5 border-t border-[#eceff5] pt-4 text-left text-[13px] text-[#4b5568]">
        {order.items.map((item, index) => (
          <li key={`${item.productId}-${item.size}-${item.color}-${index}`} className="flex justify-between gap-2">
            <span className="min-w-0 truncate">
              {item.name}
              {item.size || item.color ? ` · ${apparelMetaLabel(item.size, item.color)}` : ""}
              {item.shopName ? ` · ${item.shopName}` : ""}
              {surplusCartMeta(item.source, item.expiryMonths)
                ? ` · ${surplusCartMeta(item.source, item.expiryMonths)}`
                : ""}{" "}
              × {item.qty}
            </span>
            <span>{formatMoney(item.price * item.qty, "UZS")}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 px-6 py-6">
        <Link
          href={`/buyurtmalarim/${encodeURIComponent(order.id)}`}
          className={cn(buttonVariants(), "h-11 !rounded-xl gap-2")}
        >
          <MapPinned className="size-4" />
          Buyurtmani kuzatish
        </Link>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/buyurtmalarim"
            className={cn(buttonVariants({ variant: "outline" }), "h-10 !rounded-xl")}
          >
            Buyurtmalarim
          </Link>
          <Link href="/marketplace" className={cn(buttonVariants({ variant: "outline" }), "h-10 !rounded-xl")}>
            Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BuyurtmaTasdiqPage() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
