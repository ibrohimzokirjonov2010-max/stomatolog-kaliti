import type { Metadata } from "next";
import Link from "next/link";
import { BonusBalanceCard, BonusNotice } from "@/components/bonus/bonus";
import { BonuslarimMobile } from "@/components/bonus/mobile/BonuslarimMobile";

export const metadata: Metadata = {
  title: "Bonuslarim",
  description: "Bonus balans va tarix. Faqat Marketplace’da ishlatiladi.",
};

export default function BonuslarimPage() {
  return (
    <>
    <BonuslarimMobile />
    <div className="mx-auto hidden max-w-2xl lg:block">
      <header className="mb-4">
        <p className="text-[13px] text-[#8b93a7]">
          <Link href="/marketplace" className="text-[#0F766E] hover:underline">Marketplace</Link>
          <span className="mx-1.5 text-[#d0d5e0]">/</span>
          <span>Bonuslarim</span>
        </p>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight text-[#1a1d26] sm:text-[28px]">Bonuslarim</h1>
        <p className="mt-1 text-[13.5px] leading-relaxed text-[#8b93a7]">
          Berilgan, kutilayotgan va ishlatilgan bonuslar. Bonus faqat Marketplace buyurtmalarida ishlatiladi va naqdga yechilmaydi.
        </p>
      </header>
      <div className="space-y-3">
        <BonusNotice />
        <BonusBalanceCard />
      </div>
    </div>
    </>
  );
}
