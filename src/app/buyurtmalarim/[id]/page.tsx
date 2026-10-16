"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MyOrderDetail } from "@/components/my-orders";
import { TrackMobile } from "@/components/orders/mobile/TrackMobile";
import { getMobileOrder, mobileOrders, type MobileOrder } from "@/data/mobile-orders";

function useTrackedOrder(id: string): MobileOrder | undefined {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("sk-placed-orders", onChange);
      return () => window.removeEventListener("sk-placed-orders", onChange);
    },
    () => (id ? getMobileOrder(id) : undefined),
    () => (id ? mobileOrders.find((order) => order.id === id) : undefined),
  );
}

export default function BuyurtmaDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const order = useTrackedOrder(id);

  return (
    <>
      <TrackMobile order={order} />
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
