"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpDown, CalendarCheck, ChevronDown, ChevronRight, ClipboardList, Heart, MapPin, Phone, Plus, Search, SlidersHorizontal } from "lucide-react";
import { formatGroupedNumber } from "@/lib/format";
import { MobileSectionHeader, mobileHeaderActionCls } from "@/components/mobile-section-header";
import { useUstaWork } from "@/components/usta-provider";
import { UstaRequestSheet } from "@/components/usta-request-sheet";
import { MasterAvatar, VerifiedBadge, specialtyLine, useFavMasters } from "@/components/usta-ui";
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
        subtitle="Stomatologik uskunalar ta’mirlash ustalari"
        topPad="0.75rem"
        extra={
          <Link href="/ustalar/yangi" aria-label="Usta qo‘shish" data-testid="usta-add" className={mobileHeaderActionCls}>
            <Plus className="size-5" strokeWidth={2.4} />
          </Link>
        }
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
          className="h-[52px] w-full rounded-2xl border border-[#e6ebf3] bg-white pr-14 pl-11 text-[14.5px] text-[#1a1d26] shadow-[0_4px_14px_rgba(17, 24, 39, 0.04)] outline-none placeholder:text-[#8b93a7] focus:border-[#0F766E]"
        />
        <label className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-[#eef6f6] text-[#4b5568]">
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
                  on ? "border-[#0F766E] bg-[#0F766E] shadow-[0_6px_14px_rgba(15, 118, 110, 0.28)]" : "border-[#e3edf2] bg-white",
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
              <span className={cn("text-center text-[10.5px] leading-tight tracking-tight whitespace-nowrap", on ? "font-semibold text-[#111827]" : "font-medium text-[#6b7280]")}>{t.label}</span>
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
          <MapPin className="size-3.5 text-[#0F766E]" />
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
        <div className="rounded-[22px] bg-white px-5 py-10 text-center shadow-[0_4px_14px_rgba(17, 24, 39, 0.04)]" data-testid="usta-empty">
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
              className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white"
            >
              Filtrlarni tozalash
            </button>
          ) : (
            <Link href="/ustalar/yangi" className="mt-4 inline-flex h-11 items-center rounded-xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white">
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

      <Link href="/ustalar/sorovlarim" className="mt-4 flex min-h-[56px] items-center gap-3 rounded-2xl border border-[#F0FDFA] bg-white px-3.5 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e3f6f5] text-[#0F766E]">
          <ClipboardList className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[14px] font-bold text-[#1a1d26]">Mening so‘rovlarim</span>
          <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Yuborilgan va kelgan so‘rovlar</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
      </Link>

      <div className="h-14" />
      <button
        type="button"
        onClick={() => {
          const el = document.querySelector<HTMLInputElement>("[data-section-search]");
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.focus({ preventScroll: true });
        }}
        className="fixed inset-x-3 z-30 flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#0F766E] text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(15, 118, 110, 0.3)]"
        style={{ bottom: "calc(4.6rem + env(safe-area-inset-bottom))" }}
      >
        <Plus className="size-5" /> Usta topish yoki so‘rov qoldirish
      </button>
      {request ? <UstaRequestSheet master={request} onClose={() => setRequest(null)} /> : null}
    </div>
  );
}

function MasterCard({ master: m, solid, saved, onSave, onOpen, onRequest }: { master: Master; solid: boolean; saved: boolean; onSave: () => void; onOpen: () => void; onRequest: () => void }) {
  const works = m.works ?? [];
  const shown = works.slice(0, 3);
  const more = works.length - shown.length;
  const phone = m.phone?.replace(/[^\d+]/g, "") ?? "";
  return (
    <article className="relative rounded-[14px] border border-[#e9f0f5] bg-white p-2" data-testid="usta-card">
      <div className="flex gap-2.5">
        <button type="button" onClick={onOpen} className="relative h-[136px] w-[104px] shrink-0 overflow-hidden rounded-[10px] bg-[#e6f0f4]" aria-label={`${m.name} profili`}>
          {m.photo ? <Image src={m.photo} alt={m.name} fill sizes="104px" className="object-cover" /> : <span className="grid size-full place-items-center"><MasterAvatar master={m} size={64} dot={false} /></span>}
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-semibold text-[#0B1220]">
            <span className={cn("size-1.5 rounded-full", m.online ? "bg-[#16a34a]" : "bg-[#9aa3b5]")} />
            {m.online ? "Onlayn" : "Oflayn"}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-1 text-left">
              <span className="truncate text-[13px] font-bold text-[#0B1220]">{m.name}</span>
              <VerifiedBadge />
            </button>
            <button type="button" onClick={onSave} className="grid size-6 shrink-0 place-items-center text-[#115E59]" aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"} aria-pressed={saved}>
              <Heart className={cn("size-[16px]", saved && "fill-[#e11d48] text-[#e11d48]")} />
            </button>
          </div>
          <p className="truncate text-[10.5px] text-[#6b7487]">{specialtyLine(m)}</p>
          <div className="mt-1 flex gap-2">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#1a1d26]">
                {m.years > 0 ? <span>{m.years} yil tajriba</span> : null}
                <span className="inline-flex items-center gap-0.5"><MapPin className="size-3 text-[#115E59]" />{m.city}</span>
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {m.services.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-[5px] bg-[#f2f7fa] px-1.5 py-0.5 text-[9px] text-[#4b5568]">{serviceTagLabels[s] ?? s}</span>
                ))}
              </div>
            </div>
            {shown.length ? (
              <button type="button" onClick={onOpen} className="grid w-[64px] shrink-0 grid-cols-2 gap-0.5" aria-label="Bajarilgan ishlar">
                {shown.map((src, i) => (
                  <span key={`${src}-${i}`} className="relative aspect-square overflow-hidden rounded-[5px] bg-[#eef2f8]">
                    <Image src={src} alt={`${m.name} ishi ${i + 1}`} fill sizes="32px" className="object-cover" />
                  </span>
                ))}
                {more > 0 ? <span className="grid aspect-square place-items-center rounded-[5px] bg-[#eef2f8] text-[10px] font-semibold text-[#4b5568]">+{more}</span> : null}
              </button>
            ) : null}
          </div>
          <p className="mt-1.5 text-[10px] text-[#6b7487]">
            Xizmat narxi:{" "}
            <b className="text-[12.5px] text-[#0F766E]">{m.priceFrom ? `${formatGroupedNumber(m.priceFrom)} so‘m dan` : "Kelishiladi"}</b>
          </p>
          <div className="mt-1.5 flex gap-1.5">
            {phone ? (
              <a href={`tel:${phone}`} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[8px] border border-[#cfe2ea] text-[11px] font-semibold text-[#111827]">
                <Phone className="size-3.5 text-[#115E59]" /> Qo‘ng‘iroq
              </a>
            ) : null}
            {m.mine ? (
              <Link href={`/ustalar/yangi?id=${m.id}`} className="inline-flex h-8 flex-1 items-center justify-center rounded-[8px] border border-[#cfe2ea] text-[11px] font-semibold text-[#4b5568]">
                Profilim
              </Link>
            ) : (
              <button
                type="button"
                onClick={onRequest}
                className={cn("inline-flex h-8 flex-[1.4] items-center justify-center gap-1 rounded-[8px] text-[11px] font-semibold", solid ? "bg-[#0F766E] text-white" : "border border-[#0F766E] text-[#0F766E]")}
                data-testid="usta-request-btn"
              >
                <CalendarCheck className="size-3.5" /> Buyurtma berish
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
