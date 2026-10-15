import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mening klinikam",
  description: "Smile Dental Clinic: qabullar, daromad, bemorlar va laboratoriya buyurtmalari.",
};

export default function MeningKlinikamPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-[26px] font-bold tracking-tight text-[#1a1d26]">Mening klinikam</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">Qabul jadvali va bemorlar ro‘yxati kompyuter ekranida ochiladi.</p>
      </header>
    </div>
  );
}
