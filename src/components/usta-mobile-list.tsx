"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ChevronDown, ChevronRight, ClipboardList, Heart, ImageOff, MapPin, Plus, Search, Send, SlidersHorizontal } from "lucide-react";
import { MobileSectionHeader, mobileHeaderActionCls } from "@/components/mobile-section-header";
import { useUstaWork } from "@/components/usta-provider";
import { UstalarMobileHero } from "@/components/ustalar-mobile-hero";
import { UstaRequestSheet } from "@/components/usta-request-sheet";
import { MasterAvatar, NoRating, VerifiedBadge, specialtyLine, useFavMasters } from "@/components/usta-ui";
import { masterCities, serviceLabels, serviceTagLabels, ustaCategoryTiles, type Master, type UstaService } from "@/data/masters";
import { cn } from "@/lib/utils";

type Sort = "tavsiya" | "tajriba" | "ish" | "yangi";
const sortLabels: Record<Sort, string> = { tavsiya: "Saralash", tajriba: "Tajriba bo‘yicha", ish: "Ko‘p ish bajargan", yangi: "Yangi qo‘shilgan" };

/** Mobile Ustalar list (mock 1). Real catalog data only; empty fields fall back to neutral states. */
export function UstaMobileList() {
  const router = useRouter();
  const { masters, mastersReady } = useUstaWork();
  const fav = useFavMasters();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<"all" | UstaService>("all");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<Sort>("tavsiya");
  const [request, setRequest] = useState<Master | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = masters.filter((m) => {
      if (cat !== "all" && !m.services.includes(cat)) return false;
      if (city && m.city !== city) return false;
      if (!q) return true;
      return [m.name, m.title, m.city, m.district ?? "", m.description ?? "", ...m.services.map((s) => `${serviceLabels[s]} ${serviceTagLabels[s]}`)]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    if (sort === "tajriba") list.sort((a, b) => b.years - a.years);
    if (sort === "ish") list.sort((a, b) => b.jobs - a.jobs);
    if (sort === "yangi") list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    return list;
  }, [cat, city, masters, query, sort]);

  return (
    <div className="-mx-4 -mt-4 min-h-dvh bg-[#F4F7FC] px-4 pb-6" data-testid="usta-mobile-list">
      <MobileSectionHeader
        title="Ustalar"
        subtitle="Tajribali ustalar · Toshkent va viloyatlar"
        topPad="0.75rem"
        extra={
          <Link href="/ustalar/yangi" aria-label="Usta qo‘shish" data-testid="usta-add" className={mobileHeaderActionCls}>
            <Plus className="size-5" strokeWidth={2.4} />
          </Link>
        }
      />

      {/* Promo slider first (Seminarlar-style): sections follow below */}
      <UstalarMobileHero
        onPick={(c) => {
          setCat(c);
          requestAnimationFrame(() => document.getElementById("usta-list-head")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }}
      />

      {/* Search */}
      <div className="relative mb-3.5">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[19px] -translate-y-1/2 text-[#6b7487]" />
        <input
          data-section-search
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          placeholder="Usta, mutaxassislik yoki xizmatlar..."
          className="h-[52px] w-full rounded-2xl border border-[#e6ebf3] bg-white pr-14 pl-11 text-[14.5px] text-[#1a1d26] shadow-[0_4px_14px_rgba(15,23,42,0.04)] outline-none placeholder:text-[#8b93a7] focus:border-[#0066FF]"
        />
        <label className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-[#eef3fb] text-[#4b5568]">
          <SlidersHorizontal className="size-[18px]" />
          <select value={city} onChange={(e) => setCity(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Filtr: shahar">
            <option value="">Barcha shaharlar</option>
            {masterCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Category tiles */}
      <div className="mb-4 grid grid-cols-6 gap-2" data-testid="usta-categories">
        {ustaCategoryTiles.map((t) => {
          const on = cat === t.id;
          const img = t.id === "all" ? "barchasi" : t.id;
          return (
            <button key={t.id} type="button" onClick={() => setCat(t.id)} aria-pressed={on} className="flex min-w-0 flex-col items-center gap-1.5">
              <span
                className={cn(
                  "grid aspect-square w-full place-items-center rounded-2xl border",
                  on ? "border-[#0066FF] bg-[#0066FF] shadow-[0_6px_14px_rgba(0,102,255,0.28)]" : "border-[#e1e9f8] bg-white",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/icons/ustalar/${img}-128.png`}
                  alt=""
                  width={36}
                  height={36}
                  className="size-[36px] object-contain"
                  style={on ? { filter: "brightness(0) invert(1)" } : undefined}
                />
              </span>
              <span className={cn("text-center text-[10.5px] leading-tight tracking-tight whitespace-nowrap", on ? "font-semibold text-[#0B1F4D]" : "font-medium text-[#6b7280]")}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Title + city + sort */}
      <div id="usta-list-head" className="mb-3 flex scroll-mt-3 items-center gap-2">
        <h2 className="text-[21px] font-bold tracking-tight text-[#0B1220]">
          Tajribali ustalar <span className="ml-1 align-middle text-[13px] font-semibold text-[#8b93a7]" data-testid="usta-count">{visible.length} ta</span>
        </h2>
        <label className="relative ml-auto inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-[#e6ebf3] bg-white pr-2 pl-2.5 text-[12px] font-medium text-[#1a1d26]">
          <MapPin className="size-3.5 text-[#0066FF]" />
          {city || "Barchasi"}
          <ChevronDown className="size-3.5 text-[#8b93a7]" />
          <select value={city} onChange={(e) => setCity(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Shahar">
            <option value="">Barcha shaharlar</option>
            {masterCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="relative inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-[#e6ebf3] bg-white pr-2 pl-2.5 text-[12px] font-medium text-[#1a1d26]">
          <ArrowUpDown className="size-3.5 text-[#4b5568]" />
          {sort === "tavsiya" ? "Saralash" : sortLabels[sort].split(" ")[0]}
          <ChevronDown className="size-3.5 text-[#8b93a7]" />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Saralash">
            <option value="tavsiya">Tavsiya etilgan</option>
            <option value="tajriba">Tajriba bo‘yicha</option>
            <option value="ish">Ko‘p ish bajargan</option>
            <option value="yangi">Yangi qo‘shilgan</option>
          </select>
        </label>
      </div>

      {!mastersReady ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[150px] animate-pulse rounded-[22px] bg-white" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[22px] bg-white px-5 py-10 text-center shadow-[0_4px_14px_rgba(15,23,42,0.04)]" data-testid="usta-empty">
          <p className="text-[15px] font-semibold text-[#1a1d26]">{masters.length ? "Bu filtr bo‘yicha usta topilmadi" : "Hali tasdiqlangan usta yo‘q"}</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">{masters.length ? "Kategoriya yoki shaharni o‘zgartiring." : "Birinchi bo‘lib profilingizni joylang."}</p>
          {masters.length ? (
            <button
              type="button"
              onClick={() => {
                setCat("all");
                setCity("");
                setQuery("");
              }}
              className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white"
            >
              Filtrlarni tozalash
            </button>
          ) : (
            <Link href="/ustalar/yangi" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">
              Usta qo‘shish
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3" data-testid="usta-cards">
          {visible.map((m, i) => (
            <li key={m.id}>
              <MasterCard master={m} solid={i === 0} saved={fav.has(m.id)} onSave={() => fav.toggle(m.id)} onOpen={() => router.push(`/ustalar/${m.id}`)} onRequest={() => setRequest(m)} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/ustalar/sorovlarim" className="mt-4 flex min-h-[56px] items-center gap-3 rounded-2xl border border-[#dbe7ff] bg-white px-3.5 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]">
          <ClipboardList className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[14px] font-bold text-[#1a1d26]">Mening so‘rovlarim</span>
          <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Yuborilgan va kelgan so‘rovlar</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
      </Link>

      {request ? <UstaRequestSheet master={request} onClose={() => setRequest(null)} /> : null}
    </div>
  );
}

function MasterCard({ master: m, solid, saved, onSave, onOpen, onRequest }: { master: Master; solid: boolean; saved: boolean; onSave: () => void; onOpen: () => void; onRequest: () => void }) {
  const works = m.works ?? [];
  const shown = works.slice(0, 4);
  const more = works.length - shown.length;
  return (
    <article className="relative rounded-[22px] bg-white p-3.5 shadow-[0_4px_16px_rgba(15,23,42,0.05)]" data-testid="usta-card">
      <button type="button" onClick={onSave} className="absolute top-3 right-3 grid size-9 place-items-center rounded-full text-[#4b5568]" aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"} aria-pressed={saved}>
        <Heart className={cn("size-[21px]", saved && "fill-[#ef4444] text-[#ef4444]")} />
      </button>
      <div className="flex gap-3">
        <button type="button" onClick={onOpen} className="shrink-0" aria-label={`${m.name} profili`}>
          <MasterAvatar master={m} size={76} />
        </button>
        <div className="min-w-0 flex-1 pr-8">
          <button type="button" onClick={onOpen} className="flex max-w-full items-center gap-1 text-left">
            <span className="truncate text-[16px] font-bold text-[#0B1220]">{m.name}</span>
            <VerifiedBadge />
          </button>
          <p className="mt-0.5 truncate text-[12.5px] text-[#6b7487]">
            {specialtyLine(m)}
            {m.years > 0 ? ` · ${m.years} yil` : ""}
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[#1a1d26]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-[#0066FF]" />
              {m.city}
            </span>
            <NoRating />
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-1" aria-label="Bajarilgan ishlar">
          {shown.length ? (
            <>
              {shown.map((src, i) => (
                <span key={`${src}-${i}`} className="relative aspect-square max-w-[50px] min-w-0 flex-1 overflow-hidden rounded-lg bg-[#eef2f8]">
                  <Image src={src} alt={`${m.name} ishi ${i + 1}`} fill sizes="50px" className="object-cover" />
                </span>
              ))}
              {more > 0 ? (
                <span className="grid aspect-square max-w-[50px] min-w-0 flex-1 place-items-center rounded-lg bg-[#eef2f8] text-[12px] font-semibold text-[#4b5568]">+{more}</span>
              ) : null}
            </>
          ) : (
            <span className="flex h-[46px] w-full items-center gap-2 rounded-lg bg-[#f4f6fa] px-2.5 text-[11.5px] text-[#8b93a7]" data-testid="usta-no-works">
              <ImageOff className="size-4 shrink-0" />
              Ish rasmlari hali joylanmagan
            </span>
          )}
        </button>
        {m.mine ? (
          <Link href={`/ustalar/yangi?id=${m.id}`} className="inline-flex h-10 shrink-0 items-center rounded-xl border border-[#dbe3f0] px-3 text-[12px] font-semibold text-[#4b5568]">
            Profilim
          </Link>
        ) : (
          <button
            type="button"
            onClick={onRequest}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-1 rounded-xl px-2.5 text-[12px] font-semibold",
              solid ? "bg-[#0066FF] text-white shadow-[0_6px_14px_rgba(0,102,255,0.28)]" : "border border-[#0066FF] bg-white text-[#0066FF]",
            )}
            data-testid="usta-request-btn"
          >
            <Send className="size-4" />
            Xizmat so‘rovi
          </button>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {m.services.map((s) => (
          <span key={s} className="rounded-lg bg-[#f1f4f9] px-2 py-1 text-[11px] font-medium text-[#4b5568]">
            {serviceTagLabels[s] ?? s}
          </span>
        ))}
      </div>
    </article>
  );
}
