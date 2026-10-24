"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  ChevronRight,
  MoreHorizontal,
  BookOpen,
  Download,
  Drill,
  FileText,
  Heart,
  Microscope,
  Scissors,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Smile,
  X,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { MobileSectionHeader } from "@/components/mobile-section-header";
import {
  bookCategoryLabels,
  bookLanguageLabels,
  bookLevelLabels,
  books,
  type Book,
  type BookCategory,
  type BookLanguage,
  type BookLevel,
} from "@/data/education";
import { bookFavId, bookHref, formatCount, isNewBook } from "@/lib/book-helpers";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>;
export type MockCat = "all" | "endodontiya" | "implantologiya" | "ortodontiya" | "jarrohlik" | "bolalar" | "boshqa";

const mockCats: { id: MockCat; label: string; icon: IconType }[] = [
  { id: "all", label: "Barchasi", icon: BookOpen },
  { id: "endodontiya", label: "Endodontiya", icon: Microscope },
  { id: "implantologiya", label: "Implantologiya", icon: Drill },
  { id: "ortodontiya", label: "Ortodontiya", icon: Smile },
  { id: "jarrohlik", label: "Stomatologik jarrohlik", icon: Scissors },
  { id: "bolalar", label: "Pediatriya", icon: Baby },
  { id: "boshqa", label: "Boshqa", icon: MoreHorizontal },
];

const mainCats: BookCategory[] = ["endodontiya", "implantologiya", "ortodontiya", "jarrohlik", "bolalar"];

function inMockCat(b: Book, c: MockCat) {
  if (c === "all") return true;
  if (c === "boshqa") return !mainCats.includes(b.category);
  return b.category === c;
}

export function useBookDownload() {
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);
  const download = (b: Book) => {
    if (b.fileUrl) {
      window.open(b.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setToast(`“${b.title}”: narx va savatga qo‘shish tez orada ochiladi.`);
  };
  return { toast, download, setToast };
}

export function BookToast({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto w-fit max-w-[90%] rounded-2xl bg-[#0B1F4D] px-4 py-2.5 text-center text-[13px] font-medium text-white shadow-lg">
      {text}
    </div>
  );
}

function BookCard({ book, onDownload, wide }: { book: Book; onDownload: (b: Book) => void; wide?: boolean }) {
  const favorites = useFavorites();
  const saved = favorites.has(bookFavId(book.id));
  const hasFile = Boolean(book.fileUrl);
  return (
    <article data-testid="book-card" className={cn("shrink-0", wide ? "w-full" : "w-[158px]")}>
      <div className="relative">
        {isNewBook(book) ? <span className="absolute top-2 left-2 z-10 rounded-md bg-[#16a34a] px-1.5 py-[3px] text-[10.5px] leading-none font-bold text-white">Yangi</span> : null}
        <button
          type="button"
          aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"}
          aria-pressed={saved}
          onClick={() => favorites.toggle(bookFavId(book.id))}
          className="absolute top-1.5 right-1.5 z-10 grid size-8 place-items-center rounded-full bg-white text-[#94a3b8] shadow-sm"
        >
          <Heart className={cn("size-4", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
        </button>
        <Link href={bookHref(book.id)} className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-[#eef2f8] shadow-[0_6px_16px_rgba(15,23,42,0.1)]">
          <Image src={book.image} alt="" fill sizes="158px" className="object-cover" />
        </Link>
      </div>
      <Link href={bookHref(book.id)} className="mt-2 block">
        <h3 className="line-clamp-2 min-h-[34px] text-[13px] leading-[17px] font-bold text-[#1a1d26]">{book.title}</h3>
        <p className="mt-0.5 truncate text-[11.5px] text-[#8b93a7]">{book.author}</p>
      </Link>
      <p className="mt-1 truncate text-[11px] text-[#8b93a7]">{book.pages} bet · {formatCount(book.downloads)} yuklangan</p>
      <div className="mt-1 flex items-center justify-between gap-1.5">
        <p className={cn("min-w-0 text-[12px] leading-tight font-bold", hasFile ? "text-[#16a34a]" : "text-[#0B1F4D]")}>{hasFile ? "Bepul" : "Narx tez orada"}</p>
        <button
          type="button"
          aria-label={hasFile ? "Yuklab olish" : "Savatga qo‘shish"}
          data-testid="book-card-download"
          onClick={() => onDownload(book)}
          className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#0F766E] text-white shadow-[0_6px_14px_rgba(15,118,110,0.28)]"
        >
          {hasFile ? <Download className="size-4" /> : <ShoppingCart className="size-4" />}
        </button>
      </div>
    </article>
  );
}

function Hero({ onAll }: { onAll: () => void }) {
  const [idx, setIdx] = useState(0);
  const top = useMemo(() => [...books].sort((a, b) => b.downloads - a.downloads).slice(0, 3), []);
  const total = 1 + 2;
  return (
    <section className="mb-5">
      <div
        onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / Math.max(1, e.currentTarget.clientWidth)))}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="relative h-[184px] w-full shrink-0 snap-center overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0F766E] via-[#0a4fd6] to-[#0B1F4D] p-4 text-white shadow-[0_10px_28px_rgba(15,118,110,0.28)]">
          <div className="relative z-10 flex h-full max-w-[58%] flex-col">
            <span className="w-fit rounded-full bg-white px-2.5 py-1 text-[10px] leading-none font-bold tracking-[0.08em] text-[#0F766E]">TAVSIYA</span>
            <h2 className="mt-2.5 text-[18px] leading-[1.18] font-bold">Stomatologlar uchun eng yaxshi adabiyotlar</h2>
            <p className="mt-1 text-[11.5px] leading-snug text-white/80">Bilimingizni oshiring, kasbiy rivojlaning</p>
            <button type="button" onClick={onAll} className="mt-auto inline-flex h-9 w-fit items-center gap-1.5 rounded-xl bg-white px-3.5 text-[12.5px] font-bold text-[#0F766E]">
              Barchasini ko‘rish
              <ArrowRight className="size-3.5" />
            </button>
          </div>
          <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center">
            {top.map((b, i) => (
              <div key={b.id} className="relative h-[116px] w-[78px] overflow-hidden rounded-lg border-2 border-white/80 shadow-xl" style={{ marginLeft: i ? -34 : 0, transform: `rotate(${(i - 1) * 6}deg)`, zIndex: 3 - i }}>
                <Image src={b.image} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
        {top.slice(0, 2).map((b) => (
          <Link key={b.id} href={bookHref(b.id)} className="relative flex h-[184px] w-full shrink-0 snap-center items-center gap-4 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0a4fd6] to-[#0B1F4D] p-4 text-white">
            <div className="relative h-[140px] w-[100px] shrink-0 overflow-hidden rounded-xl border-2 border-white/80 shadow-xl">
              <Image src={b.image} alt="" fill sizes="100px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] leading-none font-bold tracking-[0.08em]">ENG KO‘P YUKLANGAN</span>
              <h2 className="mt-2 line-clamp-3 text-[16px] leading-[1.2] font-bold">{b.title}</h2>
              <p className="mt-1 truncate text-[12px] text-white/80">{b.author}</p>
              <p className="mt-1 text-[11.5px] text-white/70">{formatCount(b.downloads)} marta yuklangan</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-4 bg-[#0F766E]" : "w-1.5 bg-[#cdd5e4]")} />
        ))}
      </div>
    </section>
  );
}

export function KitoblarMobile() {
  const favorites = useFavorites();
  const { toast, download, setToast } = useBookDownload();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<MockCat>("all");
  const [openPop, setOpenPop] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [language, setLanguage] = useState<BookLanguage | "">("");
  const [level, setLevel] = useState<BookLevel | "">("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [sheet, setSheet] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return books.filter((b) => {
      if (needle && !`${b.title} ${b.author} ${bookCategoryLabels[b.category]} ${b.summary}`.toLowerCase().includes(needle)) return false;
      if (!inMockCat(b, cat)) return false;
      if (language && b.language !== language) return false;
      if (level && b.level !== level) return false;
      if (onlySaved && !favorites.has(bookFavId(b.id))) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, cat, language, level, onlySaved, favorites.ids]);

  const popular = useMemo(() => [...filtered].sort((a, b) => b.downloads - a.downloads), [filtered]);
  const latest = useMemo(() => [...filtered].sort((a, b) => b.year - a.year || b.downloads - a.downloads), [filtered]);
  const filterCount = (language ? 1 : 0) + (level ? 1 : 0) + (onlySaved ? 1 : 0);

  return (
    <div>
      <MobileSectionHeader
        title="Kitoblar"
        subtitle="Stomatologiya bo‘yicha eng yaxshi adabiyotlar"
        onSearch={() => searchRef.current?.focus()}
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-[#8b93a7]" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Kitob nomi, muallif yoki mavzu bo‘yicha qidirish..."
            className="h-12 w-full rounded-2xl border border-[#e8eef4] bg-[#f4f6fa] pr-9 pl-10 text-[14px] text-[#1a1d26] outline-none placeholder:text-[#8b93a7] focus:border-[#0F766E] focus:bg-white focus:ring-2 focus:ring-[#0F766E]/15"
          />
          {q ? (
            <button type="button" aria-label="Tozalash" onClick={() => setQ("")} className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center text-[#8b93a7]">
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <button type="button" aria-label="Filtrlar" onClick={() => setSheet(true)} className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-[#0F766E] text-white shadow-[0_6px_14px_rgba(15,118,110,0.28)]">
          <SlidersHorizontal className="size-5" />
          {filterCount > 0 ? <span className="absolute -top-1 -right-1 grid size-[18px] place-items-center rounded-full bg-[#FF3B30] text-[10px] font-bold text-white ring-2 ring-white">{filterCount}</span> : null}
        </button>
      </div>

      <Hero onAll={() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      <div className="-mx-4 mb-5 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mockCats.map((t) => {
          const Icon = t.icon;
          const on = cat === t.id;
          return (
            <button key={t.id} type="button" aria-pressed={on} onClick={() => setCat(t.id)} className="flex w-[78px] shrink-0 flex-col items-center gap-1.5">
              <span className={cn("grid size-[58px] place-items-center rounded-2xl", on ? "bg-[#F0FDFA] text-[#0F766E] ring-1 ring-[#0F766E]/40" : "bg-[#f1f3f7] text-[#6b7280]")}>
                <Icon className="size-6" strokeWidth={1.7} />
              </span>
              <span className={cn("text-center text-[11.5px] leading-tight", on ? "font-semibold text-[#0F766E]" : "font-medium text-[#4b5568]")}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div ref={listRef} className="scroll-mt-16" />
      {filtered.length === 0 ? (
        <div className="mb-5 rounded-2xl border border-[#eceff5] bg-white px-4 py-12 text-center">
          <p className="text-[14px] font-semibold text-[#1a1d26]">Kitob topilmadi</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">Qidiruv yoki filtrlarni o‘zgartiring.</p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCat("all");
              setLanguage("");
              setLevel("");
              setOnlySaved(false);
            }}
            className="mt-4 inline-flex h-11 items-center rounded-2xl bg-[#0F766E] px-5 text-[14px] font-semibold text-white"
          >
            Tozalash
          </button>
        </div>
      ) : (
        <>
          <section className="mb-5">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[16px] font-bold tracking-tight text-[#0B1F4D]">Mashhur kitoblar</h2>
              <button type="button" onClick={() => setOpenPop((v) => !v)} className="inline-flex items-center text-[12.5px] font-semibold text-[#0F766E]">
                {openPop ? "Yig‘ish" : "Barchasini ko‘rish"} <ChevronRight className={cn("size-3.5", openPop && "rotate-90")} />
              </button>
            </div>
            <div className={cn(openPop ? "grid grid-cols-2 gap-3" : "-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}>
              {popular.map((b) => (
                <BookCard key={b.id} book={b} onDownload={download} wide={openPop} />
              ))}
            </div>
          </section>
          <section className="mb-5">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[16px] font-bold tracking-tight text-[#0B1F4D]">So‘nggi qo‘shilganlar</h2>
              <button type="button" onClick={() => setOpenNew((v) => !v)} className="inline-flex items-center text-[12.5px] font-semibold text-[#0F766E]">
                {openNew ? "Yig‘ish" : "Barchasini ko‘rish"} <ChevronRight className={cn("size-3.5", openNew && "rotate-90")} />
              </button>
            </div>
            <div className={cn(openNew ? "grid grid-cols-2 gap-3" : "-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden")}>
              {latest.map((b) => (
                <BookCard key={b.id} book={b} onDownload={download} wide={openNew} />
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mb-4 flex items-center gap-3 rounded-2xl bg-[#F0FDFA] p-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-[#e5484d] shadow-sm">
          <FileText className="size-6" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[14px] font-bold text-[#0B1F4D]">PDF formatdagi adabiyotlar</p>
          <p className="mt-0.5 text-[11.5px] text-[#6b7280]">Kitoblarni PDF formatda yuklab olish</p>
        </div>
        <button type="button" onClick={() => setToast("PDF kitoblar bo‘limi tez orada ochiladi.")} className="inline-flex h-10 shrink-0 flex-col items-center justify-center rounded-xl bg-[#0F766E] px-3 text-[12.5px] leading-none font-semibold text-white">
          <span className="inline-flex items-center gap-1">PDF kitoblar <ArrowRight className="size-3" /></span>
          <span className="mt-0.5 text-[9.5px] font-medium text-white/80">Tez orada</span>
        </button>
      </section>

      <BookToast text={toast} />

      {sheet ? (
        <div className="fixed inset-0 z-50">
          <button type="button" aria-label="Yopish" className="absolute inset-0 bg-black/40" onClick={() => setSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pt-3 shadow-2xl" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2]" />
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[16px] font-bold text-[#1a1d26]">Filtrlar</p>
              <button type="button" onClick={() => setSheet(false)} className="text-sm font-semibold text-[#0F766E]">Tayyor</button>
            </div>
            <div className="space-y-4 pb-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Til</p>
                <div className="flex flex-wrap gap-2">
                  {(["uz", "ru", "en"] as BookLanguage[]).map((l) => (
                    <button key={l} type="button" onClick={() => setLanguage(language === l ? "" : l)} className={cn("h-11 rounded-xl px-4 text-[14px] font-semibold", language === l ? "bg-[#0F766E] text-white" : "bg-[#f4f6fa] text-[#4b5568]")}>
                      {bookLanguageLabels[l]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-[#1a1d26]">Daraja</p>
                <div className="flex flex-wrap gap-2">
                  {(["boshlangich", "orta", "yuqori"] as BookLevel[]).map((l) => (
                    <button key={l} type="button" onClick={() => setLevel(level === l ? "" : l)} className={cn("h-11 rounded-xl px-4 text-[14px] font-semibold", level === l ? "bg-[#0F766E] text-white" : "bg-[#f4f6fa] text-[#4b5568]")}>
                      {bookLevelLabels[l]}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" aria-pressed={onlySaved} onClick={() => setOnlySaved((v) => !v)} className={cn("flex h-11 w-full items-center justify-between rounded-xl px-4 text-[14px] font-semibold", onlySaved ? "bg-[#F0FDFA] text-[#0F766E]" : "bg-[#f4f6fa] text-[#4b5568]")}>
                Faqat saqlanganlar
                <Heart className={cn("size-4", onlySaved && "fill-current")} />
              </button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={() => { setLanguage(""); setLevel(""); setOnlySaved(false); }} className="h-12 rounded-2xl bg-[#f4f6fa] text-sm font-semibold text-[#4b5568]">Tozalash</button>
                <button type="button" onClick={() => setSheet(false)} className="h-12 rounded-2xl bg-[#0F766E] text-sm font-semibold text-white">Ko‘rsatish ({filtered.length})</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

