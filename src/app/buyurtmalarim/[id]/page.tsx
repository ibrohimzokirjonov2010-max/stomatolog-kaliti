"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { MyOrderDetail } from "@/components/my-orders";

export default function BuyurtmaDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";

  return (
    <div>
      <header className="mb-4 hidden lg:block">
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
  );
}
