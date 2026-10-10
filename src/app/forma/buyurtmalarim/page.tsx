"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { apparelMetaLabel } from "@/data/forma";
import { embroideryTypes } from "@/lib/embroidery";
import { loadEmbroidery, type EmbroideryOrder } from "@/lib/embroidery";
import { formatMoney, formatUzDate } from "@/lib/format";
import { loadOrders, syncOrders, type Order } from "@/lib/orders";
import { useIsClient } from "@/lib/use-is-client";
import { cn } from "@/lib/utils";

function isFormaCheckout(order: Order) {
  return order.items.some((item) => item.category === "forma" || Boolean(item.size || item.color));
}

export default function FormaOrdersPage() {
  const isClient = useIsClient();
  const [embroidery, setEmbroidery] = useState<EmbroideryOrder[] | undefined>(undefined);
  const [checkouts, setCheckouts] = useState<Order[] | undefined>(undefined);

  if (isClient && embroidery === undefined) {
    setEmbroidery(loadEmbroidery());
    setCheckouts(loadOrders().filter(isFormaCheckout));
  }

  useEffect(() => {
    const onChange = () => setCheckouts(loadOrders().filter(isFormaCheckout));
    window.addEventListener("sk-orders-changed", onChange);
    void syncOrders(true);
    return () => window.removeEventListener("sk-orders-changed", onChange);
  }, []);

  const ready = embroidery !== undefined && checkouts !== undefined;
  const empty = ready && embroidery.length === 0 && checkouts.length === 0;

  return (
    <div>
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/forma" className="text-[#0066FF] hover:underline">
            Forma
          </Link>
          <span className="mx-1">/</span>
          <span>Mening forma buyurtmalarim</span>
        </p>
        <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[#1a1d26]">Mening forma buyurtmalarim</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">
          Embroidery so‘rovlari va savat orqali berilgan forma buyurtmalari.
        </p>
      </header>

      {!ready ? (
        <p className="text-sm text-[#8b93a7]">Yuklanmoqda...</p>
      ) : empty ? (
        <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-[#1a1d26]">Hali buyurtma yo‘q</p>
          <p className="mt-1 text-sm text-[#8b93a7]">Forma qo‘shing yoki embroidery so‘rovi yuboring.</p>
          <Link href="/forma" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
            Forma katalogi
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {checkouts && checkouts.length ? (
            <section>
              <h2 className="mb-2 text-[15px] font-semibold text-[#1a1d26]">Katalog buyurtmalari</h2>
              <ul className="space-y-2.5">
                {checkouts.map((order) => (
                  <li key={order.id} className="rounded-[14px] border border-[#eceff5] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[14px] font-semibold text-[#1a1d26]">{order.id}</p>
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
                        Qabul qilindi
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#8b93a7]">
                      {formatUzDate(order.createdAt.slice(0, 10)).when} · {formatMoney(order.total, "UZS")}
                    </p>
                    <ul className="mt-2 space-y-1 text-[13px] text-[#4b5568]">
                      {order.items
                        .filter((item) => item.category === "forma" || item.size || item.color)
                        .map((item, index) => (
                          <li key={`${item.productId}-${index}`}>
                            {item.name}
                            {item.size || item.color ? ` · ${apparelMetaLabel(item.size, item.color)}` : ""} × {item.qty}
                          </li>
                        ))}
                    </ul>
                    <Link
                      href={`/buyurtma/tasdiq?id=${encodeURIComponent(order.id)}`}
                      className="mt-2 inline-block text-[13px] font-semibold text-[#0066FF]"
                    >
                      Tasdiq
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {embroidery && embroidery.length ? (
            <section>
              <h2 className="mb-2 text-[15px] font-semibold text-[#1a1d26]">Embroidery</h2>
              <ul className="space-y-2.5">
                {embroidery.map((item) => (
                  <li key={item.id} className="rounded-[14px] border border-[#eceff5] bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-[14px] font-semibold text-[#1a1d26]">{item.clinic}</p>
                      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200/80">
                        Buyurtma qabul qilindi
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#4b5568]">
                      {embroideryTypes.find((row) => row.id === item.itemType)?.label} · {item.qty} dona
                    </p>
                    <p className="mt-1 text-[12px] text-[#8b93a7]">
                      {item.phone}
                      {item.telegram ? ` · ${item.telegram}` : ""} ·{" "}
                      {item.logoLater ? "Logo keyin" : item.logoName ?? "Logo"}
                    </p>
                    <p className="mt-1 text-[12px] text-[#8b93a7]">{item.id}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
