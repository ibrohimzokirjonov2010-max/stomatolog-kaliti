import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Foydali kanallar",
  description: "Stomatologlar uchun Telegram, YouTube, Instagram kanallar va podkastlar.",
};

export default function FoydaliKanallarPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-[26px] font-bold tracking-tight text-[#1a1d26]">Foydali kanallar</h1>
        <p className="mt-1 text-sm text-[#8b93a7]">Telegram, YouTube, Instagram va podkastlar. To‘liq katalog kompyuterda ochiladi.</p>
      </header>
    </div>
  );
}
