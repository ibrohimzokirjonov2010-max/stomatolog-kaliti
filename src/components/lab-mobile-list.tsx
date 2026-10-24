"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bookmark,
  Box,
  Building2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Coins,
  Filter,
  FlaskConical,
  MapPin,
  Search,
  ShoppingCart,
  Timer,
  X,
} from "lucide-react";
import { useLabWork } from "@/components/lab-provider";
import { MobileSectionHeader } from "@/components/mobile-section-header";
import { LabPhoto, labCover, labPlace, labServicesLine, labTurnaround, somText, useSavedLabs } from "@/components/lab-ui";
import { labCities, labMaterialFilters, labMaterialLabel, labServiceFilters, labServiceLabel, orderStatusSteps, type Lab, type LabMaterial, type LabService } from "@/data/labs";
import { orderStepIndex } from "@/lib/lab-work";
import { cn } from "@/lib/utils";

type Sort = "new" | "fast" | "cheap";
const sortLabels: Record<Sort, string> = { new: "Eng yangi", fast: "Eng tez", cheap: "Arzonroq" };

/** Mobile Laboratoriya list (mock "Ustalar laboratoriyalari"). Real labs only; missing data shows neutral text. */
export function LabMobileList() {
  const { labs, labsReady, latest, orders } = useLabWork();
  const saved = useSavedLabs();
  const [query, setQuery] = useState("");
  const [service, setService] = useState<LabService | "">("");
  const [material, setMaterial] = useState<LabMaterial | "">("");
  const [days, setDays] = useState("");
  const [city, setCity] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [sort, setSort] = useState<Sort>("new");
  const [sheet, setSheet] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const maxDays = days ? Number(days) : null;
    const list = labs.filter((lab) => {
      if (service && !lab.services.includes(service)) return false;
      if (material && !lab.materials.includes(material)) return false;
      if (maxDays !== null && !(lab.days !== null && lab.days <= maxDays)) return false;
      if (city && lab.city !== city) return false;
      if (onlySaved && !saved.has(lab.id)) return false;
      if (!q) return true;
      const hay = [lab.name, lab.city, lab.district ?? "", ...lab.services.map(labServiceLabel), labServicesLine(lab), ...lab.materials.map(labMaterialLabel), ...(lab.priceItems ?? []).map((i) => i.title)]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    const ts = (l: Lab) => (l.createdAt ? new Date(l.createdAt).getTime() : 0);
    if (sort === "new") list.sort((a, b) => ts(b) - ts(a));
    if (sort === "fast") list.sort((a, b) => (a.days ?? 999) - (b.days ?? 999));
    if (sort === "cheap") list.sort((a, b) => (a.priceFrom ?? Number.MAX_SAFE_INTEGER) - (b.priceFrom ?? Number.MAX_SAFE_INTEGER));
    return list;
  }, [city, days, labs, material, onlySaved, query, saved, service, sort]);

  // Chip counts follow every other filter, so the numbers match what a tap shows.
  const countFor = (id: LabMaterial | "") =>
    labs.filter((lab) => (!id || lab.materials.includes(id)) && (!city || lab.city === city) && (!service || lab.services.includes(service))).length;
  const extra = (service ? 1 : 0) + (days ? 1 : 0) + (onlySaved ? 1 : 0) + (sort !== "new" ? 1 : 0);
  const stepIndex = latest ? orderStepIndex(latest.status) : -1;
  const activeOrders = orders.filter((o) => o.status !== "bekor").length;

  function clearAll() {
    setService("");
    setMaterial("");
    setDays("");
    setCity("");
    setOnlySaved(false);
    setSort("new");
    setQuery("");
  }

  return (
    <div className="pb-4" data-testid="lab-mobile">
      <MobileSectionHeader title={null} />

      <div className="mb-3 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-[21px] leading-tight font-extrabold tracking-tight text-[#111827]">Ustalar laboratoriyalari</h1>
          <p className="mt-0.5 text-[12.5px] text-[#6b7c93]">Tish texniklari va laboratoriyalar</p>
        </div>
        <label className="relative mt-1 inline-flex h-9 shrink-0 items-center gap-1 rounded-[10px] border border-[#e3ecf0] bg-white pr-6 pl-2 text-[12px] text-[#111827]">
          <MapPin className="size-[15px] text-[#0F766E]" />
          <select value={city} onChange={(e) => setCity(e.target.value)} className="max-w-[86px] appearance-none truncate bg-transparent outline-none" aria-label="Shahar" data-testid="lab-city">
            <option value="">Barchasi</option>
            {labCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 size-3.5 text-[#4b5568]" />
        </label>
      </div>

      <div className="mb-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-[17px] -translate-y-1/2 text-[#4b5568]" />
          <input
            data-section-search
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Laboratoriya nomi, xizmat yoki hudud bo‘yicha qidirish..."
            className="h-11 w-full rounded-[10px] border border-[#e3ecf0] bg-[#f6fafb] pr-3 pl-9 text-[12.5px] text-[#1a1d26] outline-none placeholder:text-[#8b93a7] focus:border-[#0F766E]"
            data-testid="lab-search"
          />
        </div>
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#e3ecf0] bg-white px-3 text-[12.5px] text-[#111827]"
          data-testid="lab-filter-btn"
        >
          <Filter className="size-4" /> Filtr
          {extra ? <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-[#0F766E] text-[9px] font-bold text-white">{extra}</span> : null}
        </button>
      </div>

      <div className="-mx-4 mb-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="lab-chips">
        <div className="flex w-max gap-1.5">
          {[{ id: "" as const, label: "Barchasi" }, ...labMaterialFilters].map((c) => {
            const on = material === c.id;
            return (
              <button
                key={c.id || "all"}
                type="button"
                onClick={() => setMaterial(c.id)}
                aria-pressed={on}
                data-chip={c.id || "all"}
                className={cn("inline-flex h-[30px] shrink-0 items-center rounded-[8px] px-3 text-[11.5px]", on ? "bg-[#0F766E] font-semibold text-white" : "border border-[#e3ecf0] bg-white text-[#1a1d26]")}
              >
                {c.label} ({labsReady ? countFor(c.id) : "…"})
              </button>
            );
          })}
        </div>
      </div>

      <span className="sr-only" data-testid="lab-count">{labsReady ? `${visible.length} ta` : "…"}</span>

      {!labsReady ? (
        <p className="py-10 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : labs.length === 0 ? (
        <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-12 text-center" data-testid="no-labs">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e3f6f5] text-[#0F766E]">
            <FlaskConical className="size-6" />
          </span>
          <p className="mt-4 text-[16px] font-semibold text-[#1a1d26]">Hali laboratoriya yo‘q</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-[#8b93a7]">Tasdiqlangan laboratoriyalar shu yerda chiqadi. Laboratoriyangiz bo‘lsa, profilingizni joylang.</p>
          <Link href="/laboratoriya/yangi" className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white">
            Laboratoriya sifatida e’lon berish
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[16px] border border-[#eceff5] bg-white px-4 py-10 text-center">
          <p className="text-[14px] font-semibold text-[#1a1d26]">Laboratoriya topilmadi</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Filtrlarni o‘zgartiring yoki tozalang.</p>
          <button type="button" onClick={clearAll} className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white">
            Filtrlarni tozalash
          </button>
        </div>
      ) : (
        <ul className="space-y-2" data-testid="lab-m-list">
          {visible.map((lab, i) => (
            <li key={lab.id}>
              <LabMobileCard lab={lab} saved={saved.has(lab.id)} onSave={() => saved.toggle(lab.id)} priority={i < 2} />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-4 grid gap-2">
        <Link href="/laboratoriya/buyurtmalarim" className="flex items-center gap-3 rounded-[14px] border border-[#e9f0f5] bg-white px-3 py-2.5" data-testid="lab-tracking">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e6f7f6] text-[#0F766E]">
            <ClipboardList className="size-[17px]" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-semibold text-[#0B1220]">Mening lab buyurtmalarim{activeOrders ? ` (${activeOrders})` : ""}</span>
            <span className="block truncate text-[11px] text-[#6b7487]" data-testid="lab-tracking-text">
              {latest ? `${latest.labName} · ${labServiceLabel(latest.service)} · ${orderStatusSteps[Math.max(0, stepIndex)]?.title ?? ""}` : "Hali buyurtma yo‘q — yangi buyurtma bering."}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-[#8b93a7]" />
        </Link>
        <Link href="/laboratoriya/yangi" className="flex items-center gap-3 rounded-[14px] border border-[#e9f0f5] bg-white px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e6f7f6] text-[#0F766E]">
            <Building2 className="size-4" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-semibold text-[#1a1d26]">Lab qo‘shish</span>
            <span className="block text-[11px] text-[#6b7487]">Profil va buyurtmalarni qabul qilish</span>
          </span>
          <ChevronRight className="size-4 text-[#8b93a7]" />
        </Link>
        <Link href="/marketplace?cat=laboratoriya" className="flex items-center gap-3 rounded-[14px] border border-[#e9f0f5] bg-white px-3 py-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e6f7f6] text-[#0F766E]">
            <Box className="size-4" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-semibold text-[#1a1d26]">Materiallar va ehtiyot qismlar</span>
            <span className="block text-[11px] text-[#6b7487]">Marketplace-ga o‘tish</span>
          </span>
          <ChevronRight className="size-4 text-[#8b93a7]" />
        </Link>
      </section>

      {sheet ? (
        <div className="fixed inset-0 z-[65] flex items-end bg-[#0B1220]/45" onClick={() => setSheet(false)}>
          <div className="max-h-[85dvh] w-full overflow-y-auto rounded-t-[26px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()} data-testid="lab-filter-sheet">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-[#0B1220]">Filtrlar</h2>
              <button type="button" onClick={() => setSheet(false)} className="grid size-9 place-items-center rounded-full bg-[#f3f5f9]" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
            <SheetGroup title="Xizmat">
              {[{ id: "", label: "Barchasi" }, ...labServiceFilters].map((s) => (
                <SheetChip key={s.id || "all"} on={service === s.id} onClick={() => setService(s.id as LabService | "")}>
                  {s.label}
                </SheetChip>
              ))}
            </SheetGroup>
            <SheetGroup title="Muddat">
              {[["", "Farqi yo‘q"], ["5", "5 kungacha"], ["7", "7 kungacha"], ["10", "10 kungacha"]].map(([v, l]) => (
                <SheetChip key={v || "all"} on={days === v} onClick={() => setDays(v)}>
                  {l}
                </SheetChip>
              ))}
            </SheetGroup>
            <SheetGroup title="Saralash">
              {(Object.keys(sortLabels) as Sort[]).map((k) => (
                <SheetChip key={k} on={sort === k} onClick={() => setSort(k)}>
                  {sortLabels[k]}
                </SheetChip>
              ))}
            </SheetGroup>
            <SheetGroup title="Boshqa">
              <SheetChip on={onlySaved} onClick={() => setOnlySaved(!onlySaved)}>
                <Bookmark className="size-3.5" /> Saqlanganlar
              </SheetChip>
            </SheetGroup>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button type="button" onClick={clearAll} className="h-12 rounded-2xl border border-[#dbe3f0] text-[14px] font-semibold text-[#1a1d26]">
                Tozalash
              </button>
              <button type="button" onClick={() => setSheet(false)} className="h-12 rounded-2xl bg-[#0F766E] text-[14px] font-semibold text-white">
                Ko‘rsatish ({visible.length})
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SheetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[13px] font-semibold text-[#4b5568]">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SheetChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium", on ? "bg-[#0F766E] text-white" : "border border-[#e6ebf3] bg-white text-[#1a1d26]")}
    >
      {children}
    </button>
  );
}

function LabMobileCard({ lab, saved, onSave, priority }: { lab: Lab; saved: boolean; onSave: () => void; priority?: boolean }) {
  const href = `/laboratoriya/${lab.id}`;
  const cover = labCover(lab);
  const turnaround = labTurnaround(lab);
  const prices = (lab.priceItems ?? []).map((item) => item.price).filter((p): p is number => p != null);
  const from = prices.length ? Math.min(...prices) : lab.priceFrom;
  const tags = [...lab.materials.map(labMaterialLabel), ...lab.services.map(labServiceLabel)].filter((t, i, all) => all.indexOf(t) === i).slice(0, 4);
  return (
    <article className="flex gap-2.5 rounded-[12px] border border-[#e9f0f5] bg-white p-1.5" data-testid="lab-card">
      <Link href={href} className="shrink-0 self-center" aria-label={lab.name}>
        <LabPhoto src={cover} alt={`${lab.name} ishi`} sizes="80px" priority={priority} className="size-[76px] rounded-[8px]" />
      </Link>
      <div className="min-w-0 flex-1 py-0.5 pr-0.5">
        <div className="flex items-center gap-1">
          <Link href={href} className="flex min-w-0 flex-1 items-center gap-1">
            <h3 className="truncate text-[13px] font-bold text-[#111827]">{lab.name}</h3>
            {lab.verified ? <BadgeCheck className="size-[15px] shrink-0 fill-[#16a34a] text-white" aria-label="Tekshirilgan" /> : null}
          </Link>
          <button type="button" onClick={onSave} className="grid size-6 shrink-0 place-items-center text-[#4b5568]" aria-label="Saqlash" aria-pressed={saved} data-testid="lab-bookmark">
            <Bookmark className={cn("size-[14px]", saved && "fill-[#0F766E] text-[#0F766E]")} />
          </button>
        </div>
        <p className="flex items-center gap-1 text-[10.5px] text-[#6b7487]">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{labPlace(lab)}</span>
        </p>
        {tags.length ? (
          <div className="mt-1 flex gap-1 overflow-hidden">
            {tags.map((t) => (
              <span key={t} className="shrink-0 rounded-[5px] bg-[#e9f6f5] px-1.5 py-[2px] text-[9.5px] text-[#115E59]">{t}</span>
            ))}
          </div>
        ) : null}
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="flex shrink-0 items-center gap-1">
            <Timer className="size-[13px] shrink-0 text-[#115E59]" />
            <span className="min-w-0 leading-[1.1]">
              <b className="block text-[10.5px] font-semibold whitespace-nowrap text-[#111827]">{turnaround}</b>
              <small className="block w-0 min-w-full truncate text-[8px] text-[#6b7487]">Tayyorlash muddati</small>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1">
            <Coins className="size-[13px] shrink-0 text-[#115E59]" />
            <span className="min-w-0 leading-[1.1]">
              <b className="block text-[10.5px] font-semibold whitespace-nowrap text-[#111827]">{from != null ? somText(from) : "Kelishiladi"}</b>
              <small className="block w-0 min-w-full truncate text-[8px] text-[#6b7487]">Boshlang‘ich narx</small>
            </span>
          </span>
          <Link href={`${href}?buyurtma=1`} className="ml-auto inline-flex h-8 shrink-0 items-center gap-1 rounded-[8px] bg-[#115E59] px-2 text-[10.5px] font-semibold text-white" data-testid="lab-open">
            <ShoppingCart className="size-3.5" /> Buyurtma
          </Link>
        </div>
      </div>
    </article>
  );
}
