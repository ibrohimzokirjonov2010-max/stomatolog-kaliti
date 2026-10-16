"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, ChevronRight, Globe, Search } from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { formatGroupedNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CatalogLayout, CatalogSideNav, PageTitle } from "./side-nav";

type Brand = { id: string; name: string; country: string; flag: string; aliases?: string[] };

export const BRANDS: Brand[] = [
  { id: "3m", name: "3M", country: "AQSH", flag: "🇺🇸" },
  { id: "dentsply-sirona", name: "Dentsply Sirona", country: "Germaniya", flag: "🇩🇪", aliases: ["dentsply", "sirona"] },
  { id: "ivoclar", name: "Ivoclar", country: "Lixtenshteyn", flag: "🇱🇮", aliases: ["ivoclar vivadent"] },
  { id: "straumann", name: "Straumann", country: "Shveytsariya", flag: "🇨🇭" },
  { id: "nobel-biocare", name: "Nobel Biocare", country: "Shveytsariya", flag: "🇨🇭" },
  { id: "zimmer-biomet", name: "Zimmer Biomet", country: "AQSH", flag: "🇺🇸" },
  { id: "coltene", name: "Coltene", country: "Shveytsariya", flag: "🇨🇭" },
  { id: "kerr", name: "Kerr", country: "AQSH", flag: "🇺🇸" },
  { id: "gc", name: "GC", country: "Yaponiya", flag: "🇯🇵" },
  { id: "tokuyama", name: "Tokuyama", country: "Yaponiya", flag: "🇯🇵" },
  { id: "fanta", name: "Fanta Dental", country: "Italiya", flag: "🇮🇹", aliases: ["fanta"] },
  { id: "ultradent", name: "Ultradent", country: "AQSH", flag: "🇺🇸" },
  { id: "mectron", name: "Mectron", country: "Italiya", flag: "🇮🇹" },
  { id: "nsk", name: "NSK", country: "Yaponiya", flag: "🇯🇵" },
  { id: "wh", name: "W&H", country: "Avstriya", flag: "🇦🇹" },
  { id: "vatech", name: "Vatech", country: "Janubiy Koreya", flag: "🇰🇷" },
  { id: "planmeca", name: "Planmeca", country: "Finlyandiya", flag: "🇫🇮" },
  { id: "osstem", name: "Osstem", country: "Janubiy Koreya", flag: "🇰🇷", aliases: ["osstem implant"] },
  { id: "mindray", name: "Mindray", country: "Xitoy", flag: "🇨🇳" },
  { id: "angelus", name: "Angelus", country: "Braziliya", flag: "🇧🇷" },
];

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function BrendlarPage() {
  const { catalog } = useSellerWork();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [letter, setLetter] = useState("");

  /** Real counts from the catalog `brand` field (case-insensitive, with aliases). */
  const counts = useMemo(() => {
    const byBrand = new Map<string, { n: number; label: string }>();
    for (const p of catalog) {
      const key = p.brand.trim().toLowerCase();
      const prev = byBrand.get(key);
      byBrand.set(key, { n: (prev?.n ?? 0) + 1, label: prev?.label ?? p.brand.trim() });
    }
    const out: Record<string, { n: number; label: string }> = {};
    for (const b of BRANDS) {
      let n = 0;
      let label = "";
      for (const key of [b.name.toLowerCase(), ...(b.aliases ?? [])]) {
        const hit = byBrand.get(key);
        if (hit) {
          n += hit.n;
          label ||= hit.label;
        }
      }
      out[b.id] = { n, label };
    }
    return out;
  }, [catalog]);

  const countries = useMemo(() => [...new Set(BRANDS.map((b) => b.country))].sort(), []);
  const visible = BRANDS.filter(
    (b) =>
      (!q.trim() || b.name.toLowerCase().includes(q.trim().toLowerCase())) &&
      (!country || b.country === country) &&
      (!letter || b.name.toUpperCase().startsWith(letter)),
  );

  return (
    <CatalogLayout
      side={
        <CatalogSideNav
          active="brendlar"
          promo={{
            title: "Rasmiy brendlar bir joyda!",
            text: "Dunyoning yetakchi stomatologiya brendlari",
            cta: "Barcha brendlar",
            href: "/brendlar",
            image: "/catalog-pages/promo-brendlar.png",
            icon: Award,
          }}
        />
      }
    >
      <PageTitle
        title="Brendlar"
        subtitle="Dunyoning yetakchi stomatologiya brendlari"
        right={
          <div className="hidden items-center gap-3 rounded-xl border border-[#e3ebfa] bg-[#EEF4FF] px-4 py-2.5 lg:flex">
            <Award className="size-6 text-[#0066FF]" strokeWidth={1.7} />
            <div className="leading-tight">
              <div className="text-[13px] font-bold text-[#0B1F4D]">{BRANDS.length} ta brend</div>
              <div className="mt-0.5 text-[11.5px] text-[#6b7590]">Rasmiy yetkazib beruvchilar</div>
            </div>
          </div>
        }
      />
      <div className="mb-3 flex gap-3">
        <label className="relative flex-1 lg:max-w-[375px]">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#0066FF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Brend nomi bo‘yicha qidiring..."
            className="h-11 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-11 text-[13.5px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0066FF]"
          />
        </label>
        <label className="relative hidden w-[204px] lg:block">
          <Globe className="pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-[#1f2a44]" />
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-[#e6eaf2] bg-white pr-8 pl-10 text-[13px] text-[#1f2a44] outline-none focus:border-[#0066FF]"
          >
            <option value="">Barcha davlatlar</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 rotate-90 text-[#1f2a44]" />
        </label>
      </div>
      <div className="-mx-4 mb-4 flex items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:justify-between lg:px-0">
        {["", ...LETTERS].map((l) => (
          <button
            key={l || "all"}
            type="button"
            onClick={() => setLetter(l)}
            className={cn(
              "h-8 shrink-0 rounded-lg text-[12.5px] font-medium transition-colors",
              l ? "min-w-8 px-1.5" : "px-4",
              letter === l ? "bg-[#0066FF] text-white" : "text-[#4a5470] hover:bg-[#EEF4FF] max-lg:border max-lg:border-[#e6eaf2] max-lg:bg-white",
            )}
          >
            {l || "Barchasi"}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white p-10 text-center text-[13.5px] text-[#8b93a7]">
          Hech qanday brend topilmadi
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {visible.map((b) => {
            const c = counts[b.id];
            const brandParam = c?.label || b.name;
            return (
              <Link
                key={b.id}
                href={`/marketplace?brand=${encodeURIComponent(brandParam)}`}
                className="group flex flex-col rounded-2xl border border-[#eceff5] bg-white p-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_6px_20px_rgba(15,23,42,0.09)]"
              >
                <div className="relative h-[72px] w-full">
                  <Image src={`/brands/${b.id}.png`} alt={b.name} fill sizes="200px" className="object-contain mix-blend-multiply" />
                </div>
                <div className="mt-2 flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[13px] font-bold text-[#0B1F4D]">{b.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[#6b7590]">
                      <span className="text-[13px] leading-none">{b.flag}</span>
                      {b.country}
                    </p>
                    {c && c.n > 0 ? (
                      <p className="mt-1 text-[11.5px] font-semibold text-[#0066FF]">{formatGroupedNumber(c.n)} ta mahsulot</p>
                    ) : null}
                  </div>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[#0066FF] transition-colors group-hover:bg-[#0066FF] group-hover:text-white">
                    <ChevronRight className="size-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </CatalogLayout>
  );
}
