"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, BadgeCheck, Briefcase, CalendarDays, ChevronDown, Heart, MapPin, MessageSquare, Search, Stethoscope, UserRound, Users } from "lucide-react";
import { useUstaWork } from "@/components/usta-provider";
import { useFavMasters } from "@/components/usta-ui";
import { UstaRequestSheet } from "@/components/usta-request-sheet";
import type { Master } from "@/data/masters";
import { cn } from "@/lib/utils";
import { CatalogLayout, CatalogSideNav, ChipRow, PageTitle, StatBadge } from "./side-nav";

type Spec = "" | "implantolog" | "ortodont" | "terapevt" | "ortoped" | "jarroh" | "endodontist" | "parodontolog" | "bolalar" | "gigiyenist";
const SPECS: { id: Spec; label: string; re?: RegExp }[] = [
  { id: "", label: "Barchasi" },
  { id: "implantolog", label: "Implantolog", re: /implant/i },
  { id: "ortodont", label: "Ortodont", re: /ortodont/i },
  { id: "terapevt", label: "Terapevt", re: /terapev/i },
  { id: "ortoped", label: "Ortoped", re: /ortoped/i },
  { id: "jarroh", label: "Jarroh", re: /jarroh|xirurg/i },
  { id: "endodontist", label: "Endodontist", re: /endodont/i },
  { id: "parodontolog", label: "Parodontolog", re: /parodont/i },
  { id: "bolalar", label: "Bolalar stomatologi", re: /bolalar|pediatr/i },
  { id: "gigiyenist", label: "Gigiyenist", re: /gigiyen/i },
];
type SortKey = "years" | "jobs" | "name";

const selectCls =
  "h-11 w-full appearance-none rounded-xl border border-[#e6eaf2] bg-white pr-8 pl-10 text-[12.5px] font-medium text-[#1f2a44] outline-none focus:border-[#0066FF]";

export function MutaxassislarPage() {
  const { masters, mastersReady } = useUstaWork();
  const fav = useFavMasters();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [spec, setSpec] = useState<Spec>("");
  const [sort, setSort] = useState<SortKey>("years");
  const [contact, setContact] = useState<Master | null>(null);

  const cities = useMemo(() => [...new Set(masters.map((m) => m.city).filter(Boolean))].sort(), [masters]);
  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    const re = SPECS.find((s) => s.id === spec)?.re;
    const list = masters.filter(
      (m) =>
        (!term || `${m.name} ${m.title}`.toLowerCase().includes(term)) &&
        (!city || m.city === city) &&
        (!re || re.test(`${m.title} ${m.description ?? ""}`)),
    );
    const sorted = [...list];
    if (sort === "years") sorted.sort((a, b) => b.years - a.years);
    if (sort === "jobs") sorted.sort((a, b) => b.jobs - a.jobs);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [city, masters, q, sort, spec]);

  return (
    <CatalogLayout
      side={
        <CatalogSideNav
          variant="pro"
          active="mutaxassislar"
          promo={{
            title: "Professional mutaxassislarni toping!",
            text: "Tajribali stomatologlar bilan bog‘laning",
            cta: "Mutaxassis qidirish",
            href: "/mutaxassislar",
            image: "/catalog-pages/promo-mutaxassislar.png",
          }}
        />
      }
    >
      <PageTitle
        title="Mutaxassislar"
        subtitle="Tajribali stomatolog mutaxassislar bilan bog‘laning"
        right={
          <div className="hidden gap-2.5 xl:flex">
            <StatBadge icon={Users} title={`${masters.length} ta mutaxassis`} text="O‘zbekiston bo‘ylab" />
            <StatBadge icon={BadgeCheck} title="Tekshirilgan profillar" text="Haqiqiy mutaxassislar" />
          </div>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2.5">
        <label className="relative min-w-0 flex-1 max-lg:basis-full">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mutaxassis yoki mutaxassislik bo‘yicha qidiring..."
            className="h-11 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[13px] outline-none placeholder:text-[#9aa3b2] focus:border-[#0066FF]"
          />
        </label>
        <label className="relative flex-1 lg:w-[140px] lg:flex-none xl:w-[150px]">
          <MapPin className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
            <option value="">Shahar: Barchasi</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </label>
        <label className="relative hidden w-[150px] xl:block">
          <Stethoscope className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <select value={spec} onChange={(e) => setSpec(e.target.value as Spec)} className={selectCls}>
            {SPECS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id ? s.label : "Mutaxassislik"}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </label>
        <label className="relative flex-1 lg:w-[150px] lg:flex-none">
          <ArrowUpDown className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls}>
            <option value="years">Tajriba bo‘yicha</option>
            <option value="jobs">Ishlar soni</option>
            <option value="name">Ism (A–Z)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </label>
      </div>
      <ChipRow items={SPECS} value={spec} onChange={setSpec} className="mb-4" />
      {!mastersReady && masters.length === 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[340px] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-14 text-center">
          <UserRound className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
          <p className="mt-3 text-[15px] font-semibold text-[#0B1F4D]">Mutaxassis topilmadi</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Filtrlarni o‘zgartirib ko‘ring.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-4">
          {visible.map((m) => (
            <article key={m.id} className="flex overflow-hidden rounded-2xl border border-[#eceff5] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.05)] max-sm:gap-3 max-sm:p-2.5 sm:flex-col">
              <div className="relative shrink-0 bg-gradient-to-b from-[#eef4ff] to-[#dfe9f8] max-sm:w-[38%] max-sm:rounded-xl sm:aspect-[190/104]">
                {m.photo ? (
                  <Image src={m.photo} alt={m.name} fill sizes="(min-width:1280px) 25vw, 50vw" className="object-cover object-top" />
                ) : (
                  <div className="flex h-full min-h-[120px] items-center justify-center text-[34px] font-bold text-[#0066FF]/70">
                    {m.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Sevimlilarga"
                  onClick={() => fav.toggle(m.id)}
                  className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <Heart className={cn("size-4", fav.has(m.id) ? "fill-[#FF3B3B] text-[#FF3B3B]" : "text-[#1f2a44]")} />
                </button>
                {m.online ? (
                  <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-white px-2 py-0.5 text-[11.5px] font-semibold text-[#14a44d] shadow-sm">
                    <span className="size-2 rounded-full bg-[#22c55e]" /> Online
                  </span>
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col sm:p-3">
                <h2 className="truncate text-[14px] font-bold text-[#0B1F4D]">{m.name}</h2>
                <p className="truncate text-[12.5px] text-[#0066FF]">{m.title}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#6b7590]">
                  <MapPin className="size-3.5" /> {m.district ? `${m.city}, ${m.district}` : m.city}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#6b7590]">
                  {m.years > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" /> {m.years} yil tajriba
                    </span>
                  ) : null}
                  {m.jobs > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="size-3.5" /> {m.jobs}+ ish
                    </span>
                  ) : null}
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
                  <Link
                    href={`/ustalar/${m.id}`}
                    className="flex h-9 items-center justify-center rounded-lg border border-[#d6e4ff] bg-[#f3f8ff] text-[12.5px] font-semibold text-[#0066FF]"
                  >
                    Profil
                  </Link>
                  <button
                    type="button"
                    onClick={() => setContact(m)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#0066FF] text-[12.5px] font-semibold text-white hover:bg-[#0057d9]"
                  >
                    <MessageSquare className="size-3.5" /> Bog‘lanish
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {contact ? <UstaRequestSheet master={contact} onClose={() => setContact(null)} /> : null}
    </CatalogLayout>
  );
}
