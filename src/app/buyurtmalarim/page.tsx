import type { Metadata } from "next";
import Link from "next/link";
import { MyOrdersList } from "@/components/my-orders";
import { OrdersMobileList } from "@/components/orders/mobile/OrdersMobileList";

export const metadata: Metadata = {
  title: "Buyurtmalarim",
  description: "Buyurtma holati va bildirishnomalar.",
};

export default function BuyurtmalarimPage() {
  return (
    <>
      <OrdersMobileList />
      <div className="hidden lg:block">
        <header className="mb-4 sm:mb-5">
          <p className="text-[13px] text-[#8b93a7]">
            <Link href="/marketplace" className="text-[#0F766E] hover:underline">
              Marketplace
            </Link>
            <span className="mx-1.5 text-[#d0d5e0]">/</span>
            <span>Mening buyurtmalarim</span>
          </p>
          <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[#1a1d26] sm:text-[28px]">
            Mening buyurtmalarim
          </h1>
          <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-[#8b93a7]">
            Holatni bosqichma-bosqich kuzating. To‘lov tasdiqlaguncha xavfsiz saqlanadi.
          </p>
        </header>
        <MyOrdersList />
      </div>
    </>
  );
}
