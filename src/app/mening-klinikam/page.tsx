import type { Metadata } from "next";
import { KlinikamMobile } from "@/components/clinic/mobile/KlinikamMobile";

export const metadata: Metadata = {
  title: "Mening klinikam",
  description: "Klinikangiz ma’lumotlari faqat sizga ko‘rinadi.",
};

export default function MeningKlinikamPage() {
  return (
    <>
      <KlinikamMobile />
      <div className="hidden lg:block">
        <header className="mb-4">
          <h1 className="text-[26px] font-bold tracking-tight text-[#1a1d26]">Mening klinikam</h1>
          <p className="mt-1 text-sm text-[#8b93a7]">Qabul jadvali va bemorlar ro‘yxati kompyuter ekranida ochiladi.</p>
        </header>
      </div>
    </>
  );
}
