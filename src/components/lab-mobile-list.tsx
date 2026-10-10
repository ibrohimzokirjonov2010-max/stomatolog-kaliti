"use client";

import { Fragment, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpDown,
  Bookmark,
  Box,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  ClipboardList,
  Factory,
  FlaskConical,
  Headphones,
  MapPin,
  Package,
  Search,
  SlidersHorizontal,
  Star,
  Truck,
  X,
} from "lucide-react";
import { useLabWork } from "@/components/lab-provider";
import { LabMobileHero } from "@/components/lab-mobile-hero";
import { MobileSectionHeader } from "@/components/mobile-section-header";
import { LabPhoto, VerifiedBadge, labCover, labPlace, labServicesLine, useSavedLabs } from "@/components/lab-ui";
import { labCities, labMaterialFilters, labMaterialLabel, labServiceLabel, orderStatusSteps, type Lab, type LabMaterial, type LabService } from "@/data/labs";
import { orderStepIndex } from "@/lib/lab-work";
import { cn } from "@/lib/utils";

type Chip = { id: LabService | ""; label: string; icon?: string };
const chips: Chip[] = [
  { id: "", label: "Barchasi", icon: "barchasi" },
  { id: "crown", label: "Crown", icon: "crown" },
  { id: "veneer", label: "Veneer", icon: "veneer" },
  { id: "implant", label: "Implant", icon: "implant" },
  { id: "removable", label: "Protez", icon: "protez" },
  { id: "bridge", label: "Ko‘prik" },
  { id: "cadcam", label: "CAD/CAM" },
];

type Sort = "new" | "fast" | "cheap";
const sortLabels: Record<Sort, string> = { new: "Eng yangi", fast: "Eng tez", cheap: "Arzonroq" };
const stepIcons = [ClipboardList, Headphones, Factory, Package, Truck];

/** Mobile Laboratoriya list (mock 01). Real labs only; missing data shows neutral text. */
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

  const extra = (material ? 1 : 0) + (days ? 1 : 0) + (city ? 1 : 0) + (onlySaved ? 1 : 0);
  const stepIndex = latest ? orderStepIndex(latest.status) : -1;
  const activeOrders = orders.filter((o) => o.status !== "bekor").length;

  function clearAll() {
    setService("");
    setMaterial("");
    setDays("");
    setCity("");
    setOnlySaved(false);
    setQuery("");
  }

  return (
    <div data-testid="lab-mobile">
      <MobileSectionHeader title="Laboratoriya" subtitle="Dental lab hamkorlari · crown, veneer, implant va protez buyurtmasi." />

      {/* Search */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[19px] -translate-y-1/2 text-[#6b7487]" />
        <input
          data-section-search
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          placeholder="Lab, xizmat, shahar..."
          className="h-[50px] w-full rounded-2xl border border-[#e6ebf3] bg-white pr-14 pl-11 text-[14.5px] text-[#1a1d26] shadow-[0_4px_14px_rgba(15,23,42,0.04)] outline-none placeholder:text-[#8b93a7] focus:border-[#0066FF]"
          data-testid="lab-search"
        />
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-xl bg-[#e8f0ff] text-[#0066FF]"
          aria-label="Filtrlar"
          data-testid="lab-filter-btn"
        >
          <SlidersHorizontal className="size-[18px]" />
          {extra ? <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#0066FF] text-[9px] font-bold text-white">{extra}</span> : null}
        </button>
      </div>

      <LabMobileHero
        onService={(s) => {
          setService(s);
          document.querySelector('[data-testid="lab-chips"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onList={() => document.getElementById("lab-kompaniyalari")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />

      {/* Category chips */}
      <div className="-mx-4 mb-3.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="lab-chips">
        <div className="flex w-max gap-2">
          {chips.map((c) => {
            const on = service === c.id;
            return (
              <button
                key={c.id || "all"}
                type="button"
                onClick={() => setService(c.id)}
                aria-pressed={on}
                data-chip={c.id || "all"}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium",
                  c.icon && "pl-3",
                  on ? "bg-[#0066FF] font-semibold text-white shadow-[0_4px_12px_rgba(0,102,255,0.28)]" : "border border-[#e6ebf3] bg-white text-[#1a1d26]",
                )}
              >
                {c.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/icons/laboratoriya/${c.icon}-64.png`}
                    srcSet={`/icons/laboratoriya/${c.icon}-64.png 1x, /icons/laboratoriya/${c.icon}-128.png 2x`}
                    alt=""
                    aria-hidden
                    width={19}
                    height={19}
                    className="size-[19px] shrink-0 object-contain"
                    style={on ? { filter: "brightness(0) invert(1)" } : undefined}
                  />
                ) : null}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Order status */}
      <section className="mb-4 rounded-[20px] bg-[#eaf2ff] px-3.5 pt-3.5 pb-3" data-testid="lab-tracking">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-[#0066FF] shadow-sm">
            <ClipboardList className="size-[22px]" />
          </span>
          <div className="min-w-0 pt-0.5">
            <h2 className="text-[15px] font-semibold text-[#0B1220]">Buyurtma holati</h2>
            <p className="mt-0.5 truncate text-[12px] text-[#6b7487]" data-testid="lab-tracking-text">
              {latest ? `${latest.labName} · ${labServiceLabel(latest.service)}` : "Hali buyurtma yo‘q — yangi buyurtma bering."}
            </p>
            <Link href="/laboratoriya/buyurtmalarim" className="mt-1 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-[#0066FF]">
              Mening lab buyurtmalarim{activeOrders ? ` (${activeOrders})` : ""}
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
        <ol className="mt-3 flex items-start" data-testid="lab-stepper">
          {orderStatusSteps.map((step, i) => {
            const Icon = stepIcons[i];
            const done = stepIndex >= 0 && i <= stepIndex;
            const current = stepIndex === i;
            return (
              <Fragment key={step.id}>
                {i > 0 ? <li aria-hidden className={cn("mt-[17px] h-0 min-w-1.5 flex-1 border-t-2 border-dashed mx-0.5", done ? "border-[#0066FF]" : "border-[#c5d3ea]")} /> : null}
                <li className="flex shrink-0 flex-col items-center gap-1 text-center" aria-current={current ? "step" : undefined}>
                  <span className={cn("grid size-9 place-items-center rounded-full bg-white text-[#0066FF] shadow-sm", done && "ring-2 ring-[#0066FF]", current && "bg-[#0066FF] text-white")}>
                    <Icon className="size-[17px]" />
                  </span>
                  <span className="text-[10.5px] leading-tight font-medium whitespace-nowrap text-[#1a1d26]">{step.title}</span>
                </li>
              </Fragment>
            );
          })}
        </ol>
      </section>

      {/* Labs */}
      <div id="lab-kompaniyalari" className="mb-2.5 flex scroll-mt-20 items-center gap-2">
        <h2 className="text-[17px] font-bold text-[#0B1220]">Lab kompaniyalari</h2>
        <span className="text-[12.5px] font-medium text-[#8b93a7]" data-testid="lab-count">
          {labsReady ? `${visible.length} ta` : "…"}
        </span>
        <label className="relative ml-auto inline-flex h-8 items-center gap-1 rounded-full border border-[#e6ebf3] bg-white pr-2.5 pl-2.5 text-[12.5px] font-medium text-[#1a1d26]">
          <ArrowUpDown className="size-3.5 text-[#0066FF]" />
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="appearance-none bg-transparent pr-3 outline-none" aria-label="Saralash" data-testid="lab-sort">
            {(Object.keys(sortLabels) as Sort[]).map((k) => (
              <option key={k} value={k}>
                {sortLabels[k]}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-2 size-3.5 text-[#8b93a7]" />
        </label>
      </div>

      {!labsReady ? (
        <p className="py-10 text-center text-sm text-[#8b93a7]">Yuklanmoqda…</p>
      ) : labs.length === 0 ? (
        <div className="rounded-[20px] border border-[#eceff5] bg-white px-6 py-12 text-center" data-testid="no-labs">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#eef4ff] text-[#0066FF]">
            <FlaskConical className="size-6" />
          </span>
          <p className="mt-4 text-[16px] font-semibold text-[#1a1d26]">Hali laboratoriya yo‘q</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-[#8b93a7]">Tasdiqlangan laboratoriyalar shu yerda chiqadi. Laboratoriyangiz bo‘lsa, profilingizni joylang.</p>
          <Link href="/laboratoriya/mening" className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">
            Laboratoriya sifatida e’lon berish
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-[20px] border border-[#eceff5] bg-white px-4 py-10 text-center">
          <p className="text-[14px] font-semibold text-[#1a1d26]">Laboratoriya topilmadi</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Filtrlarni o‘zgartiring yoki tozalang.</p>
          <button type="button" onClick={clearAll} className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#0066FF] px-5 text-[14px] font-semibold text-white">
            Filtrlarni tozalash
          </button>
        </div>
      ) : (
        <ul className="space-y-2.5" data-testid="lab-m-list">
          {visible.map((lab, i) => (
            <li key={lab.id}>
              <LabMobileCard lab={lab} saved={saved.has(lab.id)} onSave={() => saved.toggle(lab.id)} priority={i < 2} />
            </li>
          ))}
        </ul>
      )}

      <section className="mt-4 grid gap-2.5">
        <Link href="/laboratoriya/mening" className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-white px-3.5 py-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]">
            <Building2 className="size-4" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-bold text-[#1a1d26]">Lab qo‘shish</span>
            <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Profil va buyurtmalarni qabul qilish</span>
          </span>
          <ChevronRight className="size-4 text-[#8b93a7]" />
        </Link>
        <Link href="/marketplace?cat=laboratoriya" className="flex items-center gap-3 rounded-2xl border border-[#eceff5] bg-white px-3.5 py-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f1ff] text-[#0066FF]">
            <Box className="size-4" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[13px] font-bold text-[#1a1d26]">Materiallar va ehtiyot qismlar</span>
            <span className="mt-0.5 block text-[12px] text-[#8b93a7]">Marketplace-ga o‘tish</span>
          </span>
          <ChevronRight className="size-4 text-[#8b93a7]" />
        </Link>
      </section>

      {sheet ? (
        <div className="fixed inset-0 z-[65] flex items-end bg-[#0B1220]/45" onClick={() => setSheet(false)}>
          <div className="w-full rounded-t-[26px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()} data-testid="lab-filter-sheet">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-[#0B1220]">Filtrlar</h2>
              <button type="button" onClick={() => setSheet(false)} className="grid size-9 place-items-center rounded-full bg-[#f3f5f9]" aria-label="Yopish">
                <X className="size-4" />
              </button>
            </div>
            <SheetGroup title="Material">
              {[{ id: "", label: "Barchasi" }, ...labMaterialFilters].map((m) => (
                <SheetChip key={m.id || "all"} on={material === m.id} onClick={() => setMaterial(m.id as LabMaterial | "")}>
                  {m.label}
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
            <SheetGroup title="Shahar">
              {["", ...labCities].map((c) => (
                <SheetChip key={c || "all"} on={city === c} onClick={() => setCity(c)}>
                  {c || "Barcha shaharlar"}
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
              <button type="button" onClick={() => setSheet(false)} className="h-12 rounded-2xl bg-[#0066FF] text-[14px] font-semibold text-white">
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
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium", on ? "bg-[#0066FF] text-white" : "border border-[#e6ebf3] bg-white text-[#1a1d26]")}
    >
      {children}
    </button>
  );
}

function LabMobileCard({ lab, saved, onSave, priority }: { lab: Lab; saved: boolean; onSave: () => void; priority?: boolean }) {
  const href = `/laboratoriya/${lab.id}`;
  const cover = labCover(lab);
  const thumbs = (lab.portfolio?.length ? lab.portfolio : (lab.photos ?? []).slice(1)).filter(Boolean);
  const shown = thumbs.length > 4 ? thumbs.slice(0, 3) : thumbs.slice(0, 4);
  const rest = thumbs.length - shown.length;
  return (
    <article className="relative flex gap-2.5 rounded-[18px] border border-[#eceff5] bg-white p-2 shadow-[0_2px_10px_rgba(15,23,42,0.04)]" data-testid="lab-card">
      <Link href={href} className="shrink-0" aria-label={lab.name}>
        <LabPhoto src={cover} alt={`${lab.name} ishi`} sizes="100px" priority={priority} className="size-[100px] rounded-[14px]" />
      </Link>
      <div className="min-w-0 flex-1 pt-0.5 pr-0.5">
        <Link href={href} className="flex items-center gap-1 pr-7">
          <h3 className="truncate text-[15px] font-bold text-[#0B1220]">{lab.name}</h3>
          <VerifiedBadge lab={lab} />
        </Link>
        <p className="mt-0.5 truncate text-[12px] text-[#4b5568]">{labServicesLine(lab)}</p>
        <div className="mt-1 flex items-center gap-3 text-[12px] text-[#4b5568]">
          <span className="inline-flex items-center gap-1" data-testid="lab-rating">
            <Star className="size-3.5 text-[#c9d1de]" />
            Hali baho yo‘q
          </span>
          <span className="inline-flex items-center gap-1">
            <BriefcaseBusiness className="size-3.5 text-[#6b7487]" />
            {lab.years != null ? `${lab.years} yil tajriba` : "Tajriba —"}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 truncate text-[12px] text-[#6b7487]">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{labPlace(lab)}</span>
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-1" data-testid="lab-card-thumbs">
            {shown.length ? (
              <>
                {shown.map((src, i) => (
                  <span key={`${src}-${i}`} className="relative size-[30px] shrink-0 overflow-hidden rounded-md bg-[#eef2f8]">
                    <Image src={src} alt="" fill sizes="30px" className="object-cover" loading="lazy" />
                  </span>
                ))}
                {rest > 0 ? (
                  <span className="relative grid size-[30px] shrink-0 place-items-center overflow-hidden rounded-md bg-[#0B1220] text-[11px] font-bold text-white">
                    <Image src={thumbs[3]} alt="" fill sizes="30px" className="object-cover opacity-40" loading="lazy" />
                    <span className="relative">+{rest}</span>
                  </span>
                ) : null}
              </>
            ) : (
              <span className="truncate text-[11px] text-[#9aa3b5]">Portfolio hali yo‘q</span>
            )}
          </div>
          <Link href={href} className="inline-flex h-[30px] shrink-0 items-center gap-0.5 rounded-lg bg-[#eaf2ff] px-2.5 text-[12px] font-semibold text-[#0066FF]" data-testid="lab-open">
            Profilni ko‘rish
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>
      <button type="button" onClick={onSave} className="absolute top-2 right-2 grid size-7 place-items-center text-[#4b5568]" aria-label="Saqlash" aria-pressed={saved} data-testid="lab-bookmark">
        <Bookmark className={cn("size-[18px]", saved && "fill-[#0066FF] text-[#0066FF]")} />
      </button>
    </article>
  );
}
