"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Baby,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  BookPlus,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  Drill,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  Library,
  Microscope,
  RefreshCw,
  Scissors,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  User,
  X,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import {
  bookCategoryLabels,
  bookCategoryTabs,
  bookLanguageLabels,
  bookLevelLabels,
  books,
  type Book,
  type BookCategory,
  type BookLanguage,
  type BookLevel,
} from "@/data/education";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "popular" | "pages" | "title";
type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Eng yangi" },
  { key: "popular", label: "Eng ko‘p yuklangan" },
  { key: "pages", label: "Sahifalar soni" },
  { key: "title", label: "Nomi (A–Z)" },
];

const tabIcons: Record<BookCategory | "all", IconType> = {
  all: BookOpen,
  implantologiya: Drill,
  endodontiya: Microscope,
  estetika: Sparkles,
  ortodontiya: Smile,
  jarrohlik: Scissors,
  parodontologiya: Layers,
  bolalar: Baby,
  umumiy: Library,
};

const levelStyle: Record<BookLevel, string> = {
  boshlangich: "bg-[#e6f7ed] text-[#16a34a]",
  orta: "bg-[#fff4d6] text-[#b7791f]",
  yuqori: "bg-[#ffe9e9] text-[#e5484d]",
};

type Filters = {
  category: BookCategory | "all";
  language: BookLanguage | "";
  level: BookLevel | "";
  year: string;
  onlySaved: boolean;
};

const emptyFilters: Filters = { category: "all", language: "", level: "", year: "", onlySaved: false };
const favId = (id: string) => `book:${id}`;
const langTag: Record<BookLanguage, string> = { uz: "O‘zbekcha", ru: "Ruscha", en: "Inglizcha" };

export function KitoblarDesktop() {
  const favorites = useFavorites();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<SortKey>("newest");
  const [panel, setPanel] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const years = useMemo(() => [...new Set(books.map((b) => b.year))].sort((a, b) => b - a), []);

  const match = (b: Book, skipCategory = false) => {
    const needle = q.trim().toLowerCase();
    if (needle) {
      const hay = `${b.title} ${b.author} ${bookCategoryLabels[b.category]} ${b.summary}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    if (!skipCategory && filters.category !== "all" && b.category !== filters.category) return false;
    if (filters.language && b.language !== filters.language) return false;
    if (filters.level && b.level !== filters.level) return false;
    if (filters.year && String(b.year) !== filters.year) return false;
    if (filters.onlySaved && !favorites.has(favId(b.id))) return false;
    return true;
  };

  const visible = useMemo(() => {
    const rows = books.filter((b) => match(b));
    return rows.sort((a, b) => {
      switch (sort) {
        case "popular":
          return b.downloads - a.downloads;
        case "pages":
          return b.pages - a.pages;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return b.year - a.year || b.downloads - a.downloads;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters, sort, favorites.ids]);

  const counts = useMemo(() => {
    const out: Partial<Record<BookCategory, number>> = {};
    let total = 0;
    for (const b of books) {
      if (!match(b, true)) continue;
      total += 1;
      out[b.category] = (out[b.category] ?? 0) + 1;
    }
    return { out, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filters, favorites.ids]);

  const top = useMemo(() => [...books].sort((a, b) => b.downloads - a.downloads).slice(0, 5), []);

  const extraOn = Number(filters.onlySaved);
  const dirty = Boolean(q) || JSON.stringify(filters) !== JSON.stringify(emptyFilters);
  const reset = () => {
    setQ("");
    setFilters(emptyFilters);
  };
  const toGrid = () => gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const download = (b: Book) => {
    if (b.fileUrl) {
      window.open(b.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setToast(`“${b.title}” fayli hozircha ulanmagan — namuna katalog.`);
  };

  return (
    <div className="space-y-4">
      <Hero />

      {/* Category tabs */}
      <div className="relative">
        <div ref={tabsRef} className="flex gap-2 overflow-x-auto pr-12 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bookCategoryTabs.map((item) => {
            const Icon = tabIcons[item.id];
            const active = filters.category === item.id;
            const count = item.id === "all" ? counts.total : (counts.out[item.id] ?? 0);
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => set({ category: item.id })}
                className={cn(
                  "flex h-[58px] shrink-0 items-center gap-2.5 rounded-xl border px-3.5 text-left transition-colors",
                  active
                    ? "border-[#0F766E] bg-[#0F766E] text-white shadow-[0_6px_16px_rgba(15, 118, 110, 0.28)]"
                    : "border-[#eceff5] bg-white text-[#1a1d26] hover:border-[#0F766E]/40",
                )}
              >
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", active ? "bg-white/20" : "bg-[#eaf2ff] text-[#0F766E]")}>
                  <Icon className="size-[17px]" strokeWidth={1.9} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[12.5px] font-semibold whitespace-nowrap">{item.label}</span>
                  <span className={cn("block text-[11px]", active ? "text-white/80" : "text-[#8b93a7]")}>{count} ta kitob</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Keyingi kategoriyalar"
          onClick={() => {
            const el = tabsRef.current;
            if (!el) return;
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
            el.scrollBy({ left: atEnd ? -el.scrollWidth : 320, behavior: "smooth" });
          }}
          className="absolute top-1/2 right-0 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-[#e6eaf2] bg-white text-[#4b5568] shadow-[0_2px_10px_rgba(17, 24, 39, 0.1)] hover:text-[#0F766E]"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Filter bar */}
      <div className="relative flex items-stretch gap-2 rounded-xl border border-[#eceff5] bg-white p-2 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
        <label className="flex h-[46px] min-w-0 flex-[1.5] items-center gap-2 rounded-lg border border-[#e6eaf2] bg-[#f7f9fc] px-3">
          <Search className="size-4 shrink-0 text-[#8b93a7]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kitob, muallif yoki mavzu..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#1a1d26] outline-none placeholder:text-[#9aa3b2]"
          />
          {q ? (
            <button type="button" aria-label="Tozalash" onClick={() => setQ("")} className="text-[#8b93a7] hover:text-[#1a1d26]">
              <X className="size-3.5" />
            </button>
          ) : null}
        </label>
        <button
          type="button"
          onClick={() => setPanel((v) => !v)}
          aria-expanded={panel}
          className={cn(
            "relative inline-flex min-w-[96px] items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors",
            panel || extraOn ? "border-[#0F766E] bg-[#f3f8ff] text-[#0F766E]" : "border-[#e6eaf2] bg-white text-[#1a1d26] hover:bg-slate-50",
          )}
        >
          <SlidersHorizontal className="size-4" />
          Filtrlar
          {extraOn ? (
            <span className="absolute -top-1.5 -right-1.5 grid size-[18px] place-items-center rounded-full bg-[#0F766E] text-[10px] font-bold text-white">
              {extraOn}
            </span>
          ) : null}
        </button>
        <FilterSelect
          label="Saralash"
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          options={sortOptions.map((o) => ({ value: o.key, label: o.label }))}
          className="min-w-[132px] flex-none"
          hideLabel
        />
        <FilterSelect
          label="Mutaxassislik"
          value={filters.category === "all" ? "" : filters.category}
          onChange={(v) => set({ category: (v || "all") as BookCategory | "all" })}
          options={[
            { value: "", label: "Barchasi" },
            ...bookCategoryTabs.filter((t) => t.id !== "all").map((t) => ({ value: t.id, label: t.label })),
          ]}
        />
        <FilterSelect
          label="Til"
          value={filters.language}
          onChange={(v) => set({ language: v as BookLanguage | "" })}
          options={[
            { value: "", label: "Barchasi" },
            ...(Object.keys(bookLanguageLabels) as BookLanguage[]).map((k) => ({ value: k, label: bookLanguageLabels[k] })),
          ]}
        />
        <FilterSelect label="Format" value="pdf" onChange={() => {}} options={[{ value: "pdf", label: "PDF" }]} />
        <FilterSelect
          label="Daraja"
          value={filters.level}
          onChange={(v) => set({ level: v as BookLevel | "" })}
          options={[
            { value: "", label: "Barchasi" },
            ...(Object.keys(bookLevelLabels) as BookLevel[]).map((k) => ({ value: k, label: bookLevelLabels[k] })),
          ]}
        />
        <FilterSelect
          label="Nashr yili"
          value={filters.year}
          onChange={(v) => set({ year: v })}
          options={[{ value: "", label: "Barchasi" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
        />

        {panel ? (
          <div className="absolute top-full right-0 z-20 mt-2 w-[260px] rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_12px_36px_rgba(17, 24, 39, 0.14)]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[14px] font-bold text-[#111827]">Qo‘shimcha filtrlar</p>
              <button type="button" onClick={() => setPanel(false)} aria-label="Yopish" className="text-[#8b93a7] hover:text-[#1a1d26]">
                <X className="size-4" />
              </button>
            </div>
            <label className="flex cursor-pointer items-center gap-2 py-1.5 text-[13px] text-[#1a1d26]">
              <input type="checkbox" checked={filters.onlySaved} onChange={() => set({ onlySaved: !filters.onlySaved })} className="peer sr-only" />
              <span
                className={cn(
                  "grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0F766E]/30",
                  filters.onlySaved ? "border-[#0F766E] bg-[#0F766E]" : "border-[#cfd6e4] bg-white",
                )}
              >
                {filters.onlySaved ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
              </span>
              Faqat saqlanganlar
            </label>
            <button type="button" onClick={reset} className="mt-3 text-[12.5px] font-semibold text-[#0F766E] hover:underline">
              Barchasini tozalash
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_280px] items-start gap-4">
        {/* Grid */}
        <div ref={gridRef} className="min-w-0 scroll-mt-4">
          <p className="mb-3 flex items-baseline gap-2 text-[15px] font-bold text-[#111827]">
            {visible.length} ta kitob
            {dirty ? (
              <button type="button" onClick={reset} className="text-[12px] font-semibold text-[#0F766E] hover:underline">
                Tozalash
              </button>
            ) : null}
          </p>
          {visible.length === 0 ? (
            <div className="rounded-xl border border-[#eceff5] bg-white px-6 py-16 text-center shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
              <p className="font-semibold text-[#1a1d26]">Mos kitob topilmadi.</p>
              <p className="mt-1 text-sm text-[#8b93a7]">Qidiruv yoki filtrlarni o‘zgartiring.</p>
              <button type="button" onClick={reset} className="mt-4 inline-flex h-10 items-center rounded-xl bg-[#0F766E] px-5 text-sm font-semibold text-white">
                Filtrlarni tozalash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 min-[1180px]:grid-cols-3 min-[1400px]:grid-cols-4">
              {visible.map((b) => (
                <BookCard
                  key={b.id}
                  book={b}
                  saved={favorites.has(favId(b.id))}
                  onSave={() => favorites.toggle(favId(b.id))}
                  onDownload={() => download(b)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <aside className="space-y-3">
          <section className="rounded-xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
            <h3 className="mb-3 text-[14px] font-bold text-[#111827]">Eng ko‘p yuklangan kitoblar</h3>
            <ol className="space-y-3">
              {top.map((b, i) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQ(b.title);
                      setFilters(emptyFilters);
                      toGrid();
                    }}
                    className="flex w-full items-center gap-2.5 text-left"
                  >
                    <span className="w-3 shrink-0 text-center text-[13px] font-bold text-[#0F766E]">{i + 1}</span>
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-[#f1f3f7]">
                      <BookCover src={b.image} sizes="44px" iconClass="size-5" eager />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[12.5px] font-semibold text-[#1a1d26]">{b.title}</span>
                      <span className="block truncate text-[11px] text-[#8b93a7]">{b.author}</span>
                      <span className="block text-[10.5px] text-[#8b93a7]">
                        {b.pages} bet · {b.downloads.toLocaleString("ru-RU")} marta yuklangan
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => {
                reset();
                setSort("popular");
                toGrid();
              }}
              className="mt-3 text-[12.5px] font-semibold text-[#0F766E] hover:underline"
            >
              Barchasini ko‘rish
            </button>
          </section>

          <section className="rounded-xl bg-gradient-to-br from-[#0F766E] to-[#0F766E] p-4 text-white shadow-[0_8px_24px_rgba(15, 118, 110, 0.28)]">
            <div className="flex items-start gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20">
                <Sparkles className="size-[18px]" />
              </span>
              <p className="text-[14px] leading-snug font-bold">Sizga mos kitoblarni tavsiya qilamiz</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Implantologiya", "Estetika", "CBCT"].map((t) => (
                <span key={t} className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
                  {t}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setFilters({ ...emptyFilters, category: "implantologiya" });
                toGrid();
              }}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-white text-[13px] font-semibold text-[#0F766E] hover:bg-[#f3f8ff]"
            >
              Tavsiyalarni ko‘rish
              <ArrowRight className="size-4" />
            </button>
          </section>

          <section className="rounded-xl border border-[#fde4e4] bg-gradient-to-br from-[#fff5f5] to-white p-4 shadow-[0_2px_10px_rgba(17, 24, 39, 0.04)]">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#e5484d] shadow-[0_2px_8px_rgba(17, 24, 39, 0.08)]">
                <BookPlus className="size-5" />
              </span>
              <div>
                <p className="text-[14px] font-bold text-[#111827]">Kitob qo‘shish</p>
                <p className="mt-0.5 text-[12px] leading-snug text-[#6b7488]">
                  Agar sifatli va foydali kitobga ega bo‘lsangiz, uni platformaga qo‘shing.
                </p>
              </div>
            </div>
            <a
              href={site.telegram}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-[#0F766E] bg-white text-[13px] font-semibold text-[#0F766E] hover:bg-[#f3f8ff]"
            >
              Kitob qo‘shish
              <ArrowRight className="size-4" />
            </a>
          </section>
        </aside>
      </div>

      {toast ? (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#111827] px-4 py-2.5 text-[13px] font-medium text-white shadow-[0_12px_32px_rgba(17, 24, 39, 0.3)]">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function Hero() {
  const stats: { icon: IconType; value: string; label: string; tone: string }[] = [
    { icon: BookOpen, value: "250+", label: "bepul kitob", tone: "bg-[#F0FDFA] text-[#0F766E]" },
    { icon: FolderOpen, value: "10+", label: "mutaxassislik", tone: "bg-[#F0FDFA] text-[#0F766E]" },
    { icon: Globe, value: "UZ · RU · EN", label: "O‘zbek, Rus, Ingliz tillarida", tone: "bg-[#F0FDFA] text-[#0F766E]" },
    { icon: RefreshCw, value: "Doimiy", label: "yangilanib boradi", tone: "bg-[#e3f7ea] text-[#16a34a]" },
  ];
  const benefits: { icon: IconType; text: string; tone: string }[] = [
    { icon: ShieldCheck, text: "Bepul va qonuniy manbalar", tone: "bg-[#e3f7ea] text-[#16a34a]" },
    { icon: Download, text: "PDF formatda yuklab olish", tone: "bg-[#e3f7ea] text-[#16a34a]" },
    { icon: BadgeCheck, text: "Sifatli ilmiy adabiyotlar", tone: "bg-[#e3f7ea] text-[#16a34a]" },
    { icon: Star, text: "Stomatologlar uchun tanlov", tone: "bg-[#fff1dc] text-[#f59e0b]" },
    { icon: RefreshCw, text: "Doimiy yangilanib boradi", tone: "bg-[#ffe9e9] text-[#e5484d]" },
  ];
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#F0FDFA] bg-gradient-to-r from-[#eaf2ff] via-[#f3f8ff] to-[#eaf2ff]">
      <Image src="/images/implant-cutout.png" alt="" fill priority sizes="900px" className="object-cover opacity-[0.14] blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#eaf2ff] via-[#eaf2ff]/80 to-[#f5f9ff]/60" />

      <div className="relative z-10 flex items-stretch gap-5 p-6">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold tracking-[0.04em] text-[#0F766E]">Dental E-Library</p>
          <h1 className="mt-1.5 max-w-[470px] text-[28px] leading-[1.15] font-extrabold tracking-tight text-[#111827] min-[1400px]:text-[31px]">
            Stomatologiya bo‘yicha bepul kitoblar
          </h1>
          <p className="mt-2 max-w-[440px] text-[13px] leading-snug text-[#4b5568]">
            Ilmiy manbalar, qo‘llanmalar va atlaslar PDF formatda. O‘qing, yuklab oling va bilimlaringizni oshiring.
          </p>
          <ul className="mt-5 flex max-w-[640px] gap-3">
            {stats.map(({ icon: Icon, value, label, tone }) => (
              <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tone)}>
                  <Icon className="size-[17px]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-[13px] font-extrabold whitespace-nowrap text-[#111827]">{value}</span>
                  <span className="block text-[10.5px] text-[#6b7488]">{label}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CSS-built book visual */}
        <div className="relative hidden w-[190px] shrink-0 min-[1280px]:block" aria-hidden>
          <div className="absolute bottom-3 left-2 h-[26px] w-[170px] -skew-x-6 rounded-sm bg-gradient-to-r from-[#111827] to-[#111827] shadow-[0_6px_14px_rgba(17, 24, 39, 0.3)]" />
          <div className="absolute bottom-[38px] left-5 h-[22px] w-[150px] -skew-x-6 rounded-sm bg-gradient-to-r from-[#e9eef8] to-[#ffffff] shadow-[0_4px_10px_rgba(17, 24, 39, 0.2)]" />
          <div className="absolute bottom-[58px] left-6 h-[176px] w-[128px] -rotate-3 overflow-hidden rounded-[5px] bg-gradient-to-br from-[#111827] via-[#111827] to-[#111827] p-3 text-white shadow-[0_14px_28px_rgba(17, 24, 39, 0.45)]">
            <div className="absolute inset-y-0 left-0 w-2 bg-black/25" />
            <p className="pl-1 text-[7px] font-bold tracking-[0.18em] text-[#CCFBF1]">DENTAL</p>
            <p className="pl-1 text-[15px] leading-[1.05] font-extrabold tracking-tight">IMPLANTOLOGY</p>
            <p className="pl-1 text-[8px] font-semibold text-white/80">A CLINICAL ATLAS</p>
            <div className="absolute inset-x-3 bottom-3 grid h-[78px] place-items-center rounded bg-gradient-to-b from-[#0F766E] to-[#111827]">
              <svg viewBox="0 0 40 60" className="h-[62px] text-white/90" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 4h16l-2 14H14z" fill="currentColor" fillOpacity=".25" />
                <path d="M15 22h10M15 28h10M16 34h8M17 40h6M18 46h4" />
                <path d="M20 52v5" />
              </svg>
            </div>
          </div>
        </div>

        <ul className="relative z-10 flex w-[232px] shrink-0 flex-col justify-center gap-2.5 rounded-2xl bg-white p-4 shadow-[0_8px_28px_rgba(17, 94, 89, 0.12)]">
          {benefits.map(({ icon: Icon, text, tone }) => (
            <li key={text} className="flex items-center gap-2.5">
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full", tone)}>
                <Icon className="size-[14px]" strokeWidth={2} />
              </span>
              <span className="text-[12.5px] leading-tight font-semibold text-[#1a1d26]">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Flag({ lang }: { lang: BookLanguage }) {
  const bg =
    lang === "uz"
      ? "linear-gradient(#0099b5 0 32%, #ce1126 32% 36%, #fff 36% 64%, #ce1126 64% 68%, #1eb53a 68%)"
      : lang === "ru"
        ? "linear-gradient(#fff 0 33%, #115E59 33% 66%, #d52b1e 66%)"
        : "linear-gradient(90deg, transparent 42%, #c8102e 42% 58%, transparent 58%), linear-gradient(transparent 42%, #c8102e 42% 58%, transparent 58%), #111827";
  return <span aria-hidden className="inline-block h-[9px] w-[13px] shrink-0 rounded-[2px] border border-black/10" style={{ background: bg }} />;
}

/** Muqova rasmi: yuklanmasa yoki bo‘sh bo‘lsa neutral gradient + kitob ikonkasi ko‘rsatiladi. */
function BookCover({ src, sizes, iconClass, eager, className }: { src?: string; sizes: string; iconClass: string; eager?: boolean; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span aria-hidden className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#F0FDFA] via-[#eaf2ff] to-[#f5f9ff] text-[#0F766E]/60">
        <BookOpen className={iconClass} strokeWidth={1.6} />
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      loading={eager ? "eager" : undefined}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}

function BookCard({
  book,
  saved,
  onSave,
  onDownload,
}: {
  book: Book;
  saved: boolean;
  onSave: () => void;
  onDownload: () => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-[#eceff5] bg-white shadow-[0_2px_10px_rgba(17, 24, 39, 0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(17, 24, 39, 0.10)]">
      <div className="relative h-[128px] overflow-hidden bg-[#f1f3f7]">
        <BookCover src={book.image} sizes="240px" iconClass="size-9" eager className="transition-transform duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-[#e5484d] px-1.5 py-[3px] text-[9.5px] leading-none font-bold text-white shadow-sm">
          <FileText className="size-3" />
          PDF
        </span>
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-[3px] text-[10px] leading-none font-semibold text-[#1a1d26] shadow-sm">
          <Flag lang={book.language} />
          {langTag[book.language]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 min-h-[34px] text-[13.5px] leading-[17px] font-bold text-[#1a1d26]">{book.title}</h3>
        <p className="mt-1.5 flex items-center gap-1 text-[11.5px] text-[#8b93a7]">
          <User className="size-3 shrink-0" />
          <span className="truncate">{book.author}</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="rounded-full bg-[#F0FDFA] px-2 py-[3px] text-[10.5px] leading-none font-semibold text-[#0F766E]">
            {bookCategoryLabels[book.category]}
          </span>
          <span className={cn("rounded-full px-2 py-[3px] text-[10.5px] leading-none font-semibold", levelStyle[book.level])}>
            {bookLevelLabels[book.level]}
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-[#8b93a7]">
          <BookOpen className="size-3" />
          {book.pages} bet <span className="text-[#cfd6e4]">|</span> {book.year}
        </p>
        <div className="mt-auto flex gap-1.5 pt-3">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#0F766E] text-[12.5px] font-semibold text-white shadow-[0_3px_10px_rgba(15, 118, 110, 0.25)] transition-colors hover:bg-[#115E59]"
          >
            <Download className="size-3.5" />
            Yuklab olish
          </button>
          <button
            type="button"
            onClick={onSave}
            aria-pressed={saved}
            aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-[10px] border transition-colors",
              saved ? "border-[#0F766E] bg-[#eaf2ff] text-[#0F766E]" : "border-[#e6eaf2] bg-white text-[#4b5568] hover:text-[#0F766E]",
            )}
          >
            {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  hideLabel?: boolean;
}): ReactNode {
  return (
    <label className={cn("relative flex h-[46px] min-w-0 flex-1 flex-col justify-center rounded-lg border border-[#e6eaf2] bg-white px-3", className)}>
      {hideLabel ? <span className="sr-only">{label}</span> : <span className="text-[10.5px] font-medium text-[#8b93a7]">{label}</span>}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
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
