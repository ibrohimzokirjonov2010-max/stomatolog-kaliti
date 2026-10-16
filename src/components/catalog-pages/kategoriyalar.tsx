"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, type ComponentType } from "react";
import { Armchair, ChevronRight, Crown, Gem, Grip, Pipette, Slice, Smile, Sparkles, Syringe } from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { groupsForCatParam, productGroup } from "@/data/products";
import { formatGroupedNumber } from "@/lib/format";
import { CatalogLayout, PageTitle } from "./side-nav";
import { ToothIcon } from "./tooth-icon";

type Cat = {
  id: string;
  name: string;
  desc: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Marketplace `?cat=` value. Counts are derived from the same filter. */
  cat?: string;
  /** Free-text fallback when the catalog has no matching category (count hidden). */
  q?: string;
};

export const CATEGORIES: Cat[] = [
  { id: "terapiya", name: "Terapiya", desc: "Kompozitlar, sementlar, adgezivlar va boshqa materiallar", icon: ToothIcon, cat: "materiallar" },
  { id: "ortopediya", name: "Ortopediya", desc: "Kronalar, ko‘priklar, protezlar va ortopedik materiallar", icon: Crown, cat: "laboratoriya" },
  { id: "jarrohlik", name: "Jarrohlik", desc: "Jarrohlik asboblari, materiallar va sarf buyumlari", icon: Slice, q: "jarroh" },
  { id: "implantologiya", name: "Implantologiya", desc: "Implantlar, abutmentlar, jarrohlik to‘plamlar", icon: Syringe, cat: "implantlar" },
  { id: "endodontiya", name: "Endodontiya", desc: "Kanal asboblari, motorlar, materiallar va irrigatsiya", icon: Pipette, q: "endo" },
  { id: "ortodontiya", name: "Ortodontiya", desc: "Breketlar, alaynerlar, dog‘lar va ortodontik materiallar", icon: Smile, q: "ortodont" },
  { id: "gigiyena", name: "Gigiyena", desc: "Cho‘tkalar, pastalar, iplar va profilaktik vositalar", icon: Sparkles, q: "gigiyena" },
  { id: "asboblar", name: "Asboblar", desc: "Diagnostik, terapevtik va jarrohlik asboblar", icon: Grip, cat: "asboblar" },
  { id: "uskunalar", name: "Uskunalar", desc: "Stomatologik unitlar, rentgen, sterilizatsiya va boshqa uskunalar", icon: Armchair, cat: "jihozlar" },
];

function href(c: Cat) {
  return c.cat ? `/marketplace?cat=${c.cat}` : `/marketplace?q=${encodeURIComponent(c.q ?? c.name)}`;
}

export function KategoriyalarPage() {
  const { catalog } = useSellerWork();
  const counts = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const c of CATEGORIES) {
      if (!c.cat) {
        map[c.id] = null;
        continue;
      }
      const groups = groupsForCatParam(c.cat);
      map[c.id] = catalog.filter((p) => groups.includes(productGroup(p))).length;
    }
    return map;
  }, [catalog]);

  return (
    <CatalogLayout>
      <PageTitle
        title="Kategoriyalar"
        subtitle="Stomatologiya mahsulotlarini kategoriya bo‘yicha tanlang"
        right={
          <div className="hidden items-center gap-3 rounded-xl border border-[#e3ebfa] bg-[#EEF4FF] px-4 py-2.5 lg:flex">
            <Gem className="size-6 text-[#0066FF]" strokeWidth={1.7} />
            <div className="leading-tight">
              <div className="text-[13px] font-bold text-[#0B1F4D]">{CATEGORIES.length} ta kategoriya</div>
              {catalog.length ? (
                <div className="mt-0.5 text-[11.5px] text-[#0066FF]">{formatGroupedNumber(catalog.length)} ta mahsulot</div>
              ) : null}
            </div>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          const n = counts[c.id];
          return (
            <Link
              key={c.id}
              href={href(c)}
              className="group overflow-hidden rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_6px_20px_rgba(15,23,42,0.09)]"
            >
              <div className="relative aspect-[390/134] w-full overflow-hidden bg-[#f4f6fa] max-lg:aspect-[16/9]">
                <Image
                  src={`/categories/${c.id}.jpg`}
                  alt={c.name}
                  fill
                  sizes="(min-width:1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-start gap-3 p-3 lg:gap-4 lg:p-4">
                <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#0066FF] lg:flex">
                  <Icon className="size-6" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[14px] font-bold text-[#0B1F4D] lg:text-[15px]">{c.name}</h2>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-[#6b7590] lg:text-[12.5px]">{c.desc}</p>
                  {n != null ? (
                    <p className="mt-1.5 text-[12px] font-semibold text-[#0066FF]">{formatGroupedNumber(n)} ta mahsulot</p>
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
    </CatalogLayout>
  );
}
