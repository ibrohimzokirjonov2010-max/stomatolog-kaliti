import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { CheckoutSteps } from "@/components/checkout/mobile/CheckoutSteps";

export const metadata: Metadata = {
  title: "Buyurtma",
  description: "Yetkazib berish va to‘lov.",
};

export default function BuyurtmaPage() {
  return (
    <>
      <div className="lg:hidden">
        <CheckoutSteps />
      </div>
      <div className="hidden lg:block">
        <header className="mb-4">
          <h1 className="text-[26px] font-bold tracking-tight text-[#1a1d26]">Buyurtma</h1>
          <p className="mt-1 text-sm text-[#8b93a7]">Manzil va to‘lov usuli. Haqiqiy to‘lov shlyuzi yo‘q — namuna tasdiq.</p>
        </header>
        <CheckoutForm />
      </div>
    </>
  );
}
