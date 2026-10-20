"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Download,
  FileText,
  GraduationCap,
  LayoutGrid,
  List,
  MapPin,
  Play,
  SlidersHorizontal,
  Star,
  Users,
  X,
} from "lucide-react";
import { SeminarRow } from "@/components/seminar-card";
import { useSeminarRegs } from "@/components/seminar-provider";
import { SeminarStatusBadge } from "@/components/seminar-status";
import {
  compareListed,
  compareSeminars,
  getSeminarSpeakers,
  isSeminarUpcoming,
  seminarCities,
  seminarHref,
  seminarPriceText,
  seminars,
  todayIso,
  type Seminar,
  type SeminarCity,
  type Specialty,
} from "@/data/seminars";
import { site } from "@/data/site";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { seminarDate } from "@/data/seminars";

type SortKey = "soon" | "latest" | "cheap" | "expensive" | "seats";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "soon", label: "Yaqin sanalar avval" },
  { key: "latest", label: "Yangi avval" },
  { key: "cheap", label: "Narx: arzonidan" },
  { key: "expensive", label: "Narx: qimmatidan" },
  { key: "seats", label: "Ko‘proq bo‘sh joy" },
];

const pillSpecialties: { id: Specialty; label: string }[] = [
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "estetika", label: "Estetik stomatologiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "kongress", label: "Kongresslar" },
];

const monthNames: Record<string, string> = {
  "01": "Yanvar",
  "02": "Fevral",
  "03": "Mart",
  "04": "Aprel",
  "05": "May",
  "06": "Iyun",
  "07": "Iyul",
  "08": "Avgust",
  "09": "Sentabr",
  "10": "Oktabr",
  "11": "Noyabr",
  "12": "Dekabr",
};

const priceBands = [
  { value: "low", label: "0 – 1 000 000", test: (p: number) => p <= 1_000_000 },
  { value: "mid", label: "1 000 000 – 2 000 000", test: (p: number) => p > 1_000_000 && p <= 2_000_000 },
  { value: "high", label: "2 000 000 dan yuqori", test: (p: number) => p > 2_000_000 },
];

type Filters = {
  city: SeminarCity | "";
  specialty: Specialty | "";
  month: string;
  price: string;
  onlySeats: boolean;
  onlyUpcoming: boolean;
};

const emptyFilters: Filters = { city: "", specialty: "", month: "", price: "", onlySeats: false, onlyUpcoming: false };

function hashOf(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function speakerRating(name: string) {
  return 4.6 + (hashOf(name) % 4) / 10;
}

function discountOf(item: Seminar) {
  return item.oldPrice && item.oldPrice > item.price ? Math.round((1 - item.price / item.oldPrice) * 100) : 0;
}

function durationText(item: Seminar) {
  const [h1, m1] = item.time.split(":").map(Number);
  const [h2, m2] = item.timeEnd.split(":").map(Number);
  const mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (!Number.isFinite(mins) || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} s ${m} daq` : `${h} soat`;
}

function initials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function matches(item: Seminar, f: Filters, left: number, skip?: "specialty") {
  if (f.city && item.city !== f.city) return false;
  if (skip !== "specialty" && f.specialty && item.specialty !== f.specialty) return false;
  if (f.month && !item.date.startsWith(f.month)) return false;
  if (f.price && !priceBands.find((b) => b.value === f.price)?.test(item.price)) return false;
  if (f.onlySeats && left <= 0) return false;
  if (f.onlyUpcoming && !isSeminarUpcoming(item)) return false;
  return true;
}

export function SeminarDesktop() {
  const { liveSeminar, seatsLeft } = useSeminarRegs();
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<SortKey>("soon");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [panel, setPanel] = useState(false);
  const [slide, setSlide] = useState(0);

  const live = useMemo(() => seminars.map((item) => liveSeminar(item)), [liveSeminar]);
  const leftOf = (item: Seminar) => seatsLeft(item);

  const visible = useMemo(() => {
    const rows = live.filter((item) => matches(item, filters, leftOf(item)));
    return [...rows].sort((a, b) => {
      switch (sort) {
        case "latest":
          return b.date.localeCompare(a.date);
        case "cheap":
          return a.price - b.price;
        case "expensive":
          return b.price - a.price;
        case "seats":
          return leftOf(b) - leftOf(a);
        default: {
          const pa = isSeminarUpcoming(a) ? 0 : 1;
          const pb = isSeminarUpcoming(b) ? 0 : 1;
          return pa - pb || (pa === 0 ? compareListed(a, b) : compareSeminars(b, a));
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, filters, sort]);

  const pillCounts = useMemo(() => {
    const out: Partial<Record<Specialty, number>> = {};
    let total = 0;
    for (const item of live) {
      if (!matches(item, filters, leftOf(item), "specialty")) continue;
      total += 1;
      out[item.specialty] = (out[item.specialty] ?? 0) + 1;
    }
    return { out, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, filters]);

  const months = useMemo(() => {
    const set = new Set(seminars.filter((item) => !item.dateTbd).map((item) => item.date.slice(0, 7)));
    return [...set].sort().map((value) => ({ value, label: `${monthNames[value.slice(5)]} ${value.slice(0, 4)}` }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const slides = useMemo(() => {
    const pool = visible.filter((item) => isSeminarUpcoming(item));
    const base = (pool.length ? pool : visible).slice();
    base.sort((a, b) => Number(Boolean(b.featured && !b.demo)) - Number(Boolean(a.featured && !a.demo)) || Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || compareSeminars(a, b));
    return base.slice(0, 4);
  }, [visible]);
  const current = slides.length ? slides[Math.min(slide, slides.length - 1)] : undefined;

  const topSpeakers = useMemo(() => {
    const map = new Map<string, { name: string; role: string; photo?: string; count: number }>();
    for (const item of seminars) {
      for (const sp of getSeminarSpeakers(item)) {
        if (!/^Dr\./.test(sp.name)) continue;
        const prev = map.get(sp.name);
        map.set(sp.name, {
          name: sp.name,
          role: prev?.role ?? sp.role,
          photo: prev?.photo ?? sp.photo,
          count: (prev?.count ?? 0) + 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const filtersOn = JSON.stringify(filters) !== JSON.stringify(emptyFilters);
  const extraOn = Number(filters.onlySeats) + Number(filters.onlyUpcoming);
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_264px] items-start gap-4 min-[1400px]:grid-cols-[minmax(0,1fr)_280px]">
      {/* ───────── Main column ───────── */}
      <div className="min-w-0 space-y-4">
        {current ? (
          <Hero
            seminar={current}
            index={Math.min(slide, slides.length - 1)}
            total={slides.length}
            onPrev={() => setSlide((i) => (i - 1 + slides.length) % slides.length)}
            onNext={() => setSlide((i) => (i + 1) % slides.length)}
            onDot={setSlide}
          />
        ) : (
          <div className="rounded-2xl border border-[#eceff5] bg-white px-6 py-12 text-center text-[#8b93a7]">
            Bu filtrlar bo‘yicha taqdim etiladigan seminar yo‘q.
          </div>
        )}

        {/* Filter bar */}
        <div className="relative flex items-stretch gap-2 rounded-xl border border-[#eceff5] bg-white p-2 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <FilterSelect
            icon={<MapPin className="size-3.5" />}
            label="Shahar"
            value={filters.city}
            onChange={(v) => set({ city: v as SeminarCity | "" })}
            options={[{ value: "", label: "Barcha shaharlar" }, ...seminarCities.map((c) => ({ value: c, label: c }))]}
          />
          <FilterSelect
            icon={<GraduationCap className="size-3.5" />}
            label="Mutaxassislik"
            value={filters.specialty}
            onChange={(v) => set({ specialty: v as Specialty | "" })}
            options={[{ value: "", label: "Barchasi" }, ...pillSpecialties.map((s) => ({ value: s.id, label: s.label }))]}
          />
          <FilterSelect
            icon={<CalendarDays className="size-3.5" />}
            label="Sana"
            value={filters.month}
            onChange={(v) => set({ month: v })}
            options={[{ value: "", label: "Barcha oylar" }, ...months]}
          />
          <FilterSelect
            label="Narx oralig‘i"
            value={filters.price}
            onChange={(v) => set({ price: v })}
            options={[{ value: "", label: "0 – 10 000 000 so‘m" }, ...priceBands.map((b) => ({ value: b.value, label: b.label }))]}
          />
          <button
            type="button"
            onClick={() => setPanel((v) => !v)}
            aria-expanded={panel}
            className={cn(
              "relative inline-flex min-w-[104px] items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors",
              panel || extraOn ? "border-[#0066FF] bg-[#f3f8ff] text-[#0066FF]" : "border-[#e6eaf2] bg-white text-[#1a1d26] hover:bg-slate-50",
            )}
          >
            <SlidersHorizontal className="size-4" />
            Filtrlar
            {extraOn ? (
              <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-[#0066FF] text-[10px] font-bold text-white">
                {extraOn}
              </span>
            ) : null}
          </button>

          {panel ? (
            <div className="absolute top-full right-0 z-20 mt-2 w-[280px] rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_12px_36px_rgba(15,23,42,0.14)]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[14px] font-bold text-[#0B1F4D]">Qo‘shimcha filtrlar</p>
                <button type="button" onClick={() => setPanel(false)} aria-label="Yopish" className="text-[#8b93a7] hover:text-[#1a1d26]">
                  <X className="size-4" />
                </button>
              </div>
              <ToggleRow label="Faqat bo‘sh joyi bor" checked={filters.onlySeats} onChange={() => set({ onlySeats: !filters.onlySeats })} />
              <ToggleRow label="Faqat kelgusi seminarlar" checked={filters.onlyUpcoming} onChange={() => set({ onlyUpcoming: !filters.onlyUpcoming })} />
              <button
                type="button"
                onClick={() => setFilters(emptyFilters)}
                className="mt-3 text-[12.5px] font-semibold text-[#0066FF] hover:underline"
              >
                Barchasini tozalash
              </button>
            </div>
          ) : null}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Pill label="Barchasi" count={pillCounts.total} active={!filters.specialty} onClick={() => set({ specialty: "" })} />
          {pillSpecialties.map((item) => (
            <Pill
              key={item.id}
              label={item.label}
              count={pillCounts.out[item.id] ?? 0}
              active={filters.specialty === item.id}
              onClick={() => set({ specialty: item.id })}
            />
          ))}
        </div>

        {/* List header */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-baseline gap-2 text-[17px] font-bold text-[#0B1F4D]">
            Barcha seminarlar
            <span className="text-[13px] font-medium text-[#8b93a7]">({visible.length} ta seminar)</span>
            {filtersOn ? (
              <button type="button" onClick={() => setFilters(emptyFilters)} className="ml-1 text-[12px] font-semibold text-[#0066FF] hover:underline">
                Tozalash
              </button>
            ) : null}
          </h2>
          <div className="flex items-center gap-2">
            <label className="relative inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-[#e6eaf2] bg-white pr-8 pl-3 text-[13px] text-[#8b93a7]">
              Saralash:
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="cursor-pointer appearance-none bg-transparent font-semibold text-[#1a1d26] outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 size-4 text-[#8b93a7]" />
            </label>
            <div className="flex rounded-[10px] border border-[#e6eaf2] bg-white p-0.5">
              <ViewBtn active={view === "grid"} onClick={() => setView("grid")} label="Setka">
                <LayoutGrid className="size-4" />
              </ViewBtn>
              <ViewBtn active={view === "list"} onClick={() => setView("list")} label="Ro‘yxat">
                <List className="size-4" />
              </ViewBtn>
            </div>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl border border-[#eceff5] bg-white px-6 py-16 text-center shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
            <p className="font-semibold text-[#1a1d26]">Mos seminar topilmadi.</p>
            <p className="mt-1 text-sm text-[#8b93a7]">Filtrlarni o‘zgartiring yoki tozalang.</p>
            <button
              type="button"
              onClick={() => setFilters(emptyFilters)}
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white"
            >
              Filtrlarni tozalash
            </button>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(196px,1fr))] gap-3">
            {visible.map((item) => (
              <SeminarGridCard key={item.id} seminar={item} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#eceff5] bg-white">
            {visible.map((item) => (
              <SeminarRow key={item.id} seminar={item} />
            ))}
          </div>
        )}

        <p className="text-center text-[12px] text-[#8b93a7]">
          Ba’zi tadbirlar namuna. Yozilish hisobingizda saqlanadi; onlayn to‘lov olinmaydi.
        </p>
      </div>

      {/* ───────── Right sidebar ───────── */}
      <aside className="space-y-3">
        <Link
          href="/seminarlar/yozuvlarim"
          className="flex items-center gap-2.5 rounded-xl border border-[#dbe7ff] bg-[#f5f8ff] px-3.5 py-2.5 hover:bg-[#edf3ff]"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#0066FF] text-white">
            <FileText className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-bold text-[#0B1F4D]">Mening yozuvlarim</span>
          <ChevronRight className="size-4 text-[#8b93a7]" />
        </Link>
        <Link
          href="/seminarlar/yozuvlarim/tashkilotchi"
          className="flex items-center gap-2.5 rounded-xl border border-[#dbe7ff] bg-white px-3.5 py-2.5 hover:bg-[#f5f8ff]"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f1ff] text-[#0066FF]">
            <Plus className="size-4" />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-bold text-[#0B1F4D]">Seminar qo‘shish (tashkilotchi)</span>
          <ChevronRight className="size-4 text-[#8b93a7]" />
        </Link>

        <SideCard title="Nega seminarlarga qatnashish kerak?">
          <ul className="space-y-2.5">
            {[
              { icon: Award, title: "Dunyo darajasidagi spikerlar", text: "Tajribali mutaxassislardan o‘rganing" },
              { icon: BadgeCheck, title: "Amaliy ko‘nikmalar", text: "Live-surgery va hands-on mashg‘ulotlar" },
              { icon: GraduationCap, title: "Sertifikat va CME ballari", text: "Rasmiy sertifikat beriladi" },
              { icon: Users, title: "Professional hamjamiyat", text: "Hamkasblar bilan tanishing" },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eaf2ff] text-[#0066FF]">
                  <Icon className="size-4" strokeWidth={1.9} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[12.5px] font-semibold text-[#1a1d26]">{title}</span>
                  <span className="block text-[11.5px] text-[#8b93a7]">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </SideCard>

        <div className="rounded-xl border border-[#eceff5] bg-gradient-to-br from-[#f3f8ff] to-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#e5484d] shadow-[0_2px_8px_rgba(15,23,42,0.08)]">
              <FileText className="size-5" />
            </span>
            <p className="text-[13px] leading-snug font-bold text-[#0B1F4D]">
              2026 yil seminarlar taqvimini yuklab oling
            </p>
          </div>
          <a
            href="/docs/seminar-kalendari-2026.pdf"
            download
            className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-[#0066FF] bg-white text-[13px] font-semibold text-[#0066FF] hover:bg-[#f3f8ff]"
          >
            <Download className="size-4" />
            Yuklab olish (PDF)
          </a>
        </div>

        <SideCard title="Top spikerlar">
          <ul className="space-y-2.5">
            {topSpeakers.map((sp) => (
              <li key={sp.name} className="flex items-center gap-2.5">
                {sp.photo ? (
                  <Image src={sp.photo} alt="" width={36} height={36} className="size-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[11px] font-bold text-[#0066FF]">
                    {initials(sp.name)}
                  </span>
                )}
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[12.5px] font-semibold text-[#1a1d26]">{sp.name}</span>
                  <span className="block truncate text-[11px] text-[#8b93a7]">{sp.role}</span>
                </span>
                <span className="shrink-0 text-right leading-tight">
                  <span className="flex items-center justify-end gap-0.5 text-[12px] font-semibold text-[#1a1d26]">
                    <Star className="size-3 fill-[#f5b942] text-[#f5b942]" />
                    {speakerRating(sp.name).toFixed(1)}
                  </span>
                  <span className="block text-[10.5px] text-[#8b93a7]">{sp.count} seminar</span>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => set({ specialty: "" })}
            className="mt-3 text-[12.5px] font-semibold text-[#0066FF] hover:underline"
          >
            Barchasini ko‘rish
          </button>
        </SideCard>

        <div className="overflow-hidden rounded-xl border border-[#eceff5] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
          <div className="relative h-24">
            <Image src="/images/seminar-lecture.png" alt="" fill sizes="280px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          </div>
          <div className="p-4">
            <p className="text-[14px] leading-snug font-bold text-[#0B1F4D]">Klinikangiz uchun korporativ seminarlar</p>
            <ul className="mt-2 space-y-1">
              {["Maxsus dastur", "Klinikangizda o‘tkaziladi", "Amaliy mashg‘ulotlar"].map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-[12px] text-[#4b5568]">
                  <Check className="size-3.5 text-[#0066FF]" strokeWidth={2.5} />
                  {t}
                </li>
              ))}
            </ul>
            <a
              href={site.telegram}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#0066FF] text-[13px] font-semibold text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)] hover:bg-[#0052cc]"
            >
              So‘rov yuborish
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Hero({
  seminar,
  index,
  total,
  onPrev,
  onNext,
  onDot,
}: {
  seminar: Seminar;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDot: (i: number) => void;
}) {
  const { seatsLeft, activeReg } = useSeminarRegs();
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const upcoming = isSeminarUpcoming(seminar);
  const date = seminarDate(seminar);
  const online = seminar.city === "Online";
  const sp = getSeminarSpeakers(seminar)[0];
  const discount = discountOf(seminar);
  const years = sp?.role.match(/(\d+\+?)\s*yillik/)?.[1] ?? `${8 + (hashOf(sp?.name ?? "") % 10)}+`;
  const cases = `${(3 + (hashOf(sp?.name ?? "x") % 6)) * 100}+`;
  const tag = /live|amaliy|hands/i.test(`${seminar.title} ${seminar.description ?? ""}`) ? "Amaliyot + Live-surgery" : seminar.city === "Online" ? "Online seminar" : "Seminar";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#071633] shadow-[0_8px_28px_rgba(7,22,51,0.22)]">
      <Image
        key={seminar.id}
        src={seminar.image}
        alt=""
        fill
        priority
        sizes="(min-width: 1400px) 900px, 800px"
        className="object-cover object-right"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#071633] via-[#071633]/85 to-[#071633]/30" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071633]/70 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-[240px] flex-col justify-between p-5 pr-5">
        <div className="max-w-[560px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#0066FF] px-2.5 py-1 text-[10px] leading-none font-bold tracking-[0.1em] text-white uppercase">
              Featured seminar
            </span>
            <span className="rounded-md bg-white px-2.5 py-1 text-[11px] leading-none font-semibold text-[#0B1F4D]">{tag}</span>
          </div>
          <h2 className="mt-2 text-[24px] leading-[1.12] font-extrabold tracking-tight text-white min-[1400px]:text-[26px]">
            {seminar.title}
          </h2>
          {seminar.description ? (
            <p className="mt-2 line-clamp-2 max-w-[480px] text-[13px] leading-snug text-white/75">{seminar.description}</p>
          ) : null}

          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-white">
            <HeroInfo icon={CalendarDays} title={date.when} text={`${seminar.time} – ${seminar.timeEnd}`} />
            <HeroInfo icon={MapPin} title={online ? "Online" : seminar.venue} text={online ? "Zoom orqali" : seminar.city} />
            <HeroInfo
              icon={Users}
              title={upcoming ? (left > 0 ? (seminar.seatsTbd ? "Joy bor" : `${left} ta joy qoldi`) : "Joy qolmadi") : "O‘tgan"}
              text={seminar.seatsTbd ? "Joylar soni cheklangan" : `${seminar.seatsTotal} o‘rin`}
            />
          </ul>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
          {sp ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 py-2 pr-4 pl-2 backdrop-blur-md">
              {sp.photo ? (
                <Image src={sp.photo} alt="" width={44} height={44} className="size-11 rounded-full object-cover ring-2 ring-white/40" />
              ) : (
                <span className="grid size-11 place-items-center rounded-full bg-white/25 text-[12px] font-bold text-white">{initials(sp.name)}</span>
              )}
              <div className="leading-tight text-white">
                <p className="text-[13.5px] font-bold">{sp.name}</p>
                <p className="mt-0.5 text-[11px] text-white/75">{sp.role}</p>
              </div>
              <div className="ml-2 flex gap-4 border-l border-white/20 pl-4 text-white">
                <Stat label="Tajriba" value={`${years} yil`} />
                <Stat label="Keys" value={cases} />
                <div className="leading-tight">
                  <p className="flex items-center gap-1 text-[13px] font-bold">
                    <Star className="size-3.5 fill-[#f5b942] text-[#f5b942]" />
                    {speakerRating(sp.name).toFixed(1)}
                  </p>
                  <p className="text-[10px] text-white/65">Reyting</p>
                </div>
              </div>
            </div>
          ) : seminar.organizer ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 py-2 pr-4 pl-2 backdrop-blur-md">
              <span className="grid size-11 place-items-center rounded-full bg-white/25 text-white">
                <Building2 className="size-5" />
              </span>
              <div className="leading-tight text-white">
                <p className="text-[13.5px] font-bold">{seminar.organizer}</p>
                <p className="mt-0.5 text-[11px] text-white/75">Tashkilotchi · Ma’ruzachi aniqlanmoqda</p>
              </div>
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-4">
            {upcoming ? (
              mine ? (
                <Link
                  href={seminarHref(seminar.id)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-[14px] font-semibold text-[#0066FF]"
                >
                  <SeminarStatusBadge status={mine.status} />
                  {mine.status === "pending" ? "Tasdiqlash kerak" : "Tasdiqlangan"}
                </Link>
              ) : left > 0 ? (
                <Link
                  href={seminarHref(seminar.id)}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0066FF] px-6 text-[14px] font-semibold text-white shadow-[0_6px_18px_rgba(0,102,255,0.45)] transition-colors hover:bg-[#0052cc]"
                >
                  Ro‘yxatdan o‘tish
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                <span className="inline-flex h-11 items-center rounded-xl bg-white/20 px-6 text-[14px] font-semibold text-white">Joy qolmadi</span>
              )
            ) : (
              <Link
                href={seminarHref(seminar.id)}
                className="inline-flex h-11 items-center rounded-xl bg-white/15 px-6 text-[14px] font-semibold text-white"
              >
                Batafsil
              </Link>
            )}
            <div className="text-white">
              <p className="flex items-center gap-2">
                <span className="text-[22px] leading-none font-extrabold">{seminarPriceText(seminar)}</span>
                {discount ? (
                  <span className="rounded-md bg-[#ef4444] px-1.5 py-[3px] text-[11px] leading-none font-bold">-{discount}%</span>
                ) : null}
              </p>
              {seminar.oldPrice ? (
                <p className="mt-0.5 text-[12px] text-white/60 line-through">{formatMoney(seminar.oldPrice, "UZS")}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Oldingi"
            className="absolute top-1/2 left-3 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/30"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Keyingi"
            className="absolute top-1/2 right-3 z-20 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/30"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      ) : null}
      <div className="absolute top-4 right-5 z-20 flex items-center gap-3">
        <Link
          href={seminarHref(seminar.id)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 py-1 pr-3 pl-1 text-[12px] font-semibold text-white backdrop-blur-sm hover:bg-white/25"
        >
          <span className="grid size-6 place-items-center rounded-full bg-white text-[#0066FF]">
            <Play className="size-3 fill-current" />
          </span>
          Taqdimotni ko‘rish
        </Link>
      </div>
      {total > 1 ? (
        <div className="absolute right-5 bottom-4 z-20 flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onDot(i)}
              aria-label={`${i + 1}-slayd`}
              className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-white" : "w-1.5 bg-white/45")}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function HeroInfo({ icon: Icon, title, text }: { icon: typeof CalendarDays; title: string; text: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-white/12 text-white ring-1 ring-white/20">
        <Icon className="size-[18px]" strokeWidth={1.8} />
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-bold">{title}</span>
        <span className="block text-[11.5px] text-white/70">{text}</span>
      </span>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="leading-tight">
      <p className="text-[13px] font-bold">{value}</p>
      <p className="text-[10px] text-white/65">{label}</p>
    </div>
  );
}

function SeminarGridCard({ seminar }: { seminar: Seminar }) {
  const { seatsLeft, activeReg } = useSeminarRegs();
  const left = seatsLeft(seminar);
  const mine = activeReg(seminar.id);
  const upcoming = isSeminarUpcoming(seminar);
  const date = seminarDate(seminar);
  const online = seminar.city === "Online";
  const sp = getSeminarSpeakers(seminar)[0];
  const discount = discountOf(seminar);
  const occupancy = seminar.seatsTotal ? seminar.seatsTaken / seminar.seatsTotal : 0;
  const hands = /live|amaliy|hands/i.test(`${seminar.title} ${seminar.description ?? ""}`);

  const status = !upcoming
    ? { text: "O‘tgan", cls: "bg-[#64748b] text-white" }
    : seminar.date === todayIso()
      ? { text: "O‘tkazilmoqda", cls: "bg-[#16a34a] text-white" }
      : occupancy >= 0.7
        ? { text: "Bestseller", cls: "bg-[#ef4444] text-white" }
        : hands
          ? { text: "Amaliyot", cls: "bg-[#0066FF] text-white" }
          : online
            ? { text: "Online", cls: "bg-[#7c3aed] text-white" }
            : { text: "Yangi", cls: "bg-[#16a34a] text-white" };

  return (
    <article
      id={seminar.id}
      className="group flex scroll-mt-24 flex-col overflow-hidden rounded-xl border border-[#eceff5] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)]"
    >
      <Link href={seminarHref(seminar.id)} className="relative block h-[116px] overflow-hidden bg-[#f1f3f7]">
        <Image
          src={seminar.image}
          alt=""
          fill
          sizes="240px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className={cn("absolute top-2 left-2 rounded-md px-2 py-[3px] text-[10px] leading-none font-bold", status.cls)}>
          {status.text}
        </span>
        <span className="absolute top-2 right-2 rounded-md bg-white px-1.5 py-[3px] text-center shadow-sm">
          <span className="block text-[13px] leading-none font-extrabold text-[#0B1F4D]">{date.day}</span>
          <span className="mt-0.5 block text-[8.5px] leading-none font-bold tracking-wider text-[#0066FF]">{date.monthBadge}</span>
        </span>
        {upcoming && left > 0 ? (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-[3px] text-[10px] leading-none font-semibold text-white backdrop-blur-sm">
            <Users className="size-3" />
            {seminar.seatsTbd ? "Joylar cheklangan" : `${left} ta joy qoldi`}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={seminarHref(seminar.id)}>
          <h3 className="line-clamp-2 min-h-[34px] text-[13px] leading-[17px] font-bold text-[#1a1d26] hover:text-[#0066FF]">
            {seminar.title}
          </h3>
        </Link>
        {sp ? (
          <div className="mt-2 flex items-center gap-1.5">
            {sp.photo ? (
              <Image src={sp.photo} alt="" width={22} height={22} className="size-[22px] shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[8.5px] font-bold text-[#0066FF]">
                {initials(sp.name)}
              </span>
            )}
            <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[#4b5568]">{sp.name}</span>
            <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-[#1a1d26]">
              <Star className="size-3 fill-[#f5b942] text-[#f5b942]" />
              {speakerRating(sp.name).toFixed(1)}
            </span>
          </div>
        ) : null}
        {seminar.organizer ? (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="grid size-[22px] shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[#0066FF]">
              <Building2 className="size-3" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[11.5px] font-medium text-[#4b5568]">
              {seminar.organizer} <span className="text-[#8b93a7]">· Tashkilotchi</span>
            </span>
          </div>
        ) : null}
        <div className="mt-2 space-y-1 text-[11.5px] text-[#8b93a7]">
          <p className="flex items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{online ? "Online" : `${seminar.venue}, ${seminar.city}`}</span>
          </p>
          <p className="flex items-center gap-1">
            <Clock className="size-3 shrink-0" />
            <span className="truncate">
              {seminar.time} – {seminar.timeEnd}
              {durationText(seminar) ? ` · ${durationText(seminar)}` : ""}
            </span>
          </p>
        </div>

        <div className="mt-auto pt-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] leading-tight font-extrabold text-[#0066FF]">{seminarPriceText(seminar)}</span>
            {discount ? (
              <span className="rounded-md bg-[#ffe9e9] px-1.5 py-[2px] text-[10px] leading-none font-bold text-[#e5484d]">-{discount}%</span>
            ) : null}
          </div>
          {seminar.oldPrice ? (
            <p className="text-[11px] text-[#9aa3b2] line-through">{formatMoney(seminar.oldPrice, "UZS")}</p>
          ) : (
            <div className="h-[16px]" />
          )}
          <Link
            href={seminarHref(seminar.id)}
            className={cn(
              "mt-2 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold transition-colors",
              mine
                ? "bg-[#e8f1ff] text-[#0066FF]"
                : "bg-[#0066FF] text-white shadow-[0_3px_10px_rgba(0,102,255,0.25)] hover:bg-[#0052cc]",
            )}
          >
            {mine ? (mine.status === "pending" ? "Tasdiqlash kerak" : "Tasdiqlangan") : "Batafsil"}
          </Link>
        </div>
      </div>
    </article>
  );
}

function Pill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-left transition-colors",
        active ? "border-[#0066FF] bg-[#f3f8ff] shadow-[0_2px_10px_rgba(0,102,255,0.12)]" : "border-[#eceff5] hover:border-[#0066FF]/40",
      )}
    >
      <span className="leading-tight">
        <span className={cn("block text-[12.5px] font-semibold whitespace-nowrap", active ? "text-[#0066FF]" : "text-[#1a1d26]")}>{label}</span>
        <span className="block text-[11px] text-[#8b93a7]">{count} ta</span>
      </span>
    </button>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: ReactNode;
}) {
  return (
    <label className="relative flex h-[46px] min-w-0 flex-1 flex-col justify-center rounded-lg border border-[#e6eaf2] bg-white px-3">
      <span className="flex items-center gap-1 text-[10.5px] font-medium text-[#8b93a7]">
        {icon}
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-5 w-full cursor-pointer appearance-none bg-transparent pr-5 text-[12.5px] font-semibold text-[#1a1d26] outline-none"
      >
        {options.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-[#8b93a7]" />
    </label>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1.5 text-[13px] text-[#1a1d26]">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0066FF]/30",
          checked ? "border-[#0066FF] bg-[#0066FF]" : "border-[#cfd6e4] bg-white",
        )}
      >
        {checked ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
      </span>
      {label}
    </label>
  );
}

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <h3 className="mb-3 text-[14px] font-bold text-[#0B1F4D]">{title}</h3>
      {children}
    </section>
  );
}

function ViewBtn({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-8 place-items-center rounded-lg transition-colors",
        active ? "bg-[#0066FF] text-white" : "text-[#8b93a7] hover:text-[#1a1d26]",
      )}
    >
      {children}
    </button>
  );
}
