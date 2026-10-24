"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ComponentType, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Armchair, ChevronRight, Crown, Grip, Pipette, Search, Slice, Smile, Sparkles, Syringe } from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { groupsForCatParam, productGroup } from "@/data/products";
import { formatGroupedNumber } from "@/lib/format";
import "./kategoriyalar-phone.css";
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

const TINTS = ["#e3f6f5", "#e7f8ec", "#efe9fe", "#fff1e3", "#fde8ee", "#ece9fe", "#e3f6f5", "#F0FDFA", "#fff4dc"];
const INKS = ["#0F766E", "#16a34a", "#7c3aed", "#ea7a12", "#e11d48", "#6d28d9", "#0F766E", "#0F766E", "#b7791f"];

/** Phone /kategoriyalar (desktop renders KategoriyalarDesktop from AppChrome). */
export function KategoriyalarPage() {
  const router = useRouter();
  const { catalog } = useSellerWork();
  const [query, setQuery] = useState("");
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
  const q = query.trim().toLowerCase();
  const shown = q ? CATEGORIES.filter((c) => `${c.name} ${c.desc}`.toLowerCase().includes(q)) : CATEGORIES;

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const text = query.trim();
    router.push(text ? `/marketplace?q=${encodeURIComponent(text)}` : "/marketplace");
  }

  return (
    <div className="kt" data-testid="kategoriyalar-phone">
      <h1>Kategoriyalar</h1>
      <p className="kt-lead">Sizga kerakli stomatologik mahsulot va xizmatlar</p>
      <form className="kt-search" onSubmit={onSearch}>
        <Search />
        <input value={query} placeholder="Mahsulot, brend yoki kategoriya qidirish..." aria-label="Qidirish" onChange={(event) => setQuery(event.target.value)} />
      </form>
      {shown.length === 0 ? <p className="kt-empty">Mos kategoriya yo‘q — qidiruvni marketplace’da davom ettirish uchun Enter bosing.</p> : null}
      <div className="kt-grid">
        {shown.map((c) => {
          const Icon = c.icon;
          const n = counts[c.id];
          const index = CATEGORIES.indexOf(c) % TINTS.length;
          return (
            <Link key={c.id} href={href(c)} className="kt-card">
              <span className="kt-ico" style={{ background: TINTS[index], color: INKS[index] }}><Icon className="kt-svg" strokeWidth={1.8} /></span>
              <b>{c.name}</b>
              <small>{n != null ? `${formatGroupedNumber(n)} mahsulot` : c.desc}</small>
              <span className="kt-go"><ChevronRight /></span>
              <span className="kt-img"><Image src={`/categories/${c.id}.jpg`} alt="" fill sizes="25vw" className="object-cover" /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
