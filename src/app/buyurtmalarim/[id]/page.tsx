"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MyOrderDetail } from "@/components/my-orders";
import { TrackMobile } from "@/components/orders/mobile/TrackMobile";
import type { MobileOrder } from "@/data/mobile-orders";
import { toMobileOrder } from "@/lib/order-present";
import { loadOrders, syncOrders } from "@/lib/orders";

export default function BuyurtmaDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const [order, setOrder] = useState<MobileOrder | undefined>();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancel = false;
    void syncOrders(true).finally(() => {
      if (cancel) return;
      const found = loadOrders().find((item) => item.id === id);
      setOrder(found ? toMobileOrder(found) : undefined);
      setReady(true);
    });
    return () => {
      cancel = true;
    };
  }, [id]);

  return (
    <>
      {ready ? <TrackMobile order={order} /> : <p className="p-6 text-sm text-slate-500 lg:hidden">Yuklanmoqda</p>}
      <div className="hidden lg:block">
        <header className="mb-4">
          <p className="text-[13px] text-[#8b93a7]">
            <Link href="/buyurtmalarim" className="text-[#0066FF] hover:underline">
              Buyurtmalarim
            </Link>
            <span className="mx-1.5 text-[#d0d5e0]">/</span>
            <span className="truncate font-medium text-[#4b5568]">{id || "…"}</span>
          </p>
        </header>
        {id ? <MyOrderDetail orderId={id} /> : <p className="text-sm text-[#8b93a7]">ID yo‘q</p>}
      </div>
    </>
  );
}
