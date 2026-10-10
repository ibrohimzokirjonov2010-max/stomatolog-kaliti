"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Download, FileText, Globe, Heart, MessageSquare, Share2, ShoppingCart, Star } from "lucide-react";
import { BookToast, useBookDownload } from "@/components/kitoblar-mobile";
import { useFavorites } from "@/components/favorites-provider";
import { bookCategoryLabels, bookLanguageLabels, bookLevelLabels, books, type Book } from "@/data/education";
import { bookFavId, bookHref, formatCount, isNewBook, topBookIds } from "@/lib/book-helpers";
import { cn } from "@/lib/utils";

export function KitobDetail({ book }: { book: Book }) {
  const router = useRouter();
  const favorites = useFavorites();
  const saved = favorites.has(bookFavId(book.id));
  const { toast, download, setToast } = useBookDownload();
  const [tab, setTab] = useState("about");
  const related = books.filter((b) => b.category === book.category && b.id !== book.id);
  const sameAuthor = books.filter((b) => b.author === book.author).length;
  const hasFile = Boolean(book.fileUrl);
  const [more, setMore] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: book.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast("Havola nusxalandi");
    } catch {
      /* cancelled */
    }
  }

  const facts = [
    { icon: BookOpen, label: `${book.pages} bet` },
    { icon: FileText, label: "PDF format" },
    { icon: Globe, label: bookLanguageLabels[book.language] },
    { icon: Download, label: hasFile ? "Yuklab olish" : "Yuklab olish tez orada" },
  ];
  const tabs = [
    { id: "about", label: "Tavsif" },
    { id: "toc", label: "Mundarija" },
    { id: "samples", label: "Namunaviy sahifalar" },
    { id: "reviews", label: "Sharhlar" },
    { id: "related", label: "Tavsiya" },
  ];

  return (
    <div className="-m-4 mx-auto max-w-xl pb-6 lg:m-0 lg:mx-auto" data-testid="kitob-detail">
      <div className="px-4 pt-3" style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.75rem)" }}>
        <div className="flex items-center justify-between">
          <button type="button" aria-label="Orqaga" onClick={() => (window.history.length > 1 ? router.back() : router.push("/kitoblar"))} className="grid size-10 place-items-center rounded-full border border-[#e6eaf2] bg-white text-[#0B1F4D]">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex gap-2">
            <button type="button" aria-label="Ulashish" onClick={share} className="grid size-10 place-items-center rounded-full border border-[#e6eaf2] bg-white text-[#0B1F4D]">
              <Share2 className="size-[18px]" />
            </button>
            <button type="button" aria-label="Saqlash" aria-pressed={saved} onClick={() => favorites.toggle(bookFavId(book.id))} className="grid size-10 place-items-center rounded-full border border-[#e6eaf2] bg-white text-[#0B1F4D]">
              <Heart className={cn("size-[18px]", saved && "fill-[#f43f5e] text-[#f43f5e]")} />
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-4">
          <div className="relative aspect-[3/4] w-[42%] shrink-0 overflow-hidden rounded-2xl bg-[#eef2f8] shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
            <Image src={book.image} alt={book.title} fill priority sizes="170px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              {topBookIds.has(book.id) ? <span className="rounded-md bg-[#0066FF] px-2.5 py-1 text-[10.5px] leading-none font-bold text-white">Bestseller</span> : null}
              <span className="rounded-md bg-[#e8f1ff] px-2.5 py-1 text-[10.5px] leading-none font-bold text-[#0066FF]">{bookCategoryLabels[book.category]}</span>
              {isNewBook(book) ? <span className="rounded-md bg-[#e3f8ec] px-2.5 py-1 text-[10.5px] leading-none font-bold text-[#0f9d58]">Yangi</span> : null}
            </div>
            <h1 className="mt-2 text-[20px] leading-[1.2] font-bold tracking-tight text-[#0B1F4D]">{book.title}</h1>
            <p className="mt-1 text-[13px] text-[#6b7280]">{book.author}</p>
            <p className="mt-0.5 text-[11.5px] text-[#8b93a7]">{bookLevelLabels[book.level]} daraja · {book.year}-yil</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] text-[#4b5568]">
              <Download className="size-4 text-[#0066FF]" />
              {formatCount(book.downloads)} marta yuklangan
            </p>
            <p className={cn("mt-2 text-[19px] leading-none font-bold", hasFile ? "text-[#16a34a]" : "text-[#0066FF]")}>{hasFile ? "Bepul" : "Narx tez orada"}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {facts.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-2xl bg-[#f2f6ff] px-1.5 py-2.5 text-center">
              <Icon className="size-5 text-[#0066FF]" strokeWidth={1.8} />
              <span className="text-[11px] leading-tight font-semibold text-[#0B1F4D]">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => setToast("Bepul namuna tez orada qo‘shiladi.")} className="inline-flex h-12 flex-col items-center justify-center rounded-xl border border-[#0066FF] bg-white text-[13px] leading-tight font-semibold text-[#0066FF]">
            <span className="inline-flex items-center gap-1.5"><BookOpen className="size-4" />Bepul namunani o‘qish</span>
            <span className="text-[10px] font-medium text-[#8b93a7]">Tez orada</span>
          </button>
          <button
            type="button"
            data-testid="kitob-download"
            onClick={() => download(book)}
            className="inline-flex h-12 flex-col items-center justify-center rounded-xl bg-[#0066FF] text-[13.5px] leading-tight font-semibold text-white shadow-[0_8px_18px_rgba(0,102,255,0.3)]"
          >
            <span className="inline-flex items-center gap-1.5">
              {hasFile ? <Download className="size-4" /> : <ShoppingCart className="size-4" />}
              {hasFile ? "Yuklab olish" : "Savatga qo‘shish"}
            </span>
            {!hasFile ? <span className="text-[10px] font-medium text-white/80">Tez orada</span> : null}
          </button>
        </div>
      </div>

      <nav className="sticky top-0 z-20 mt-5 border-b border-[#e8ecf4] bg-white px-4">
        <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id}
              onClick={() => {
                setTab(t.id);
                document.getElementById(`kitob-${t.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn("shrink-0 border-b-2 py-3 text-[14px] font-semibold whitespace-nowrap", tab === t.id ? "border-[#0066FF] text-[#0066FF]" : "border-transparent text-[#6b7280]")}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="space-y-6 px-4 pt-5">
        <section id="kitob-about" className="scroll-mt-14">
          <h2 className="mb-2 text-[17px] font-bold text-[#0B1F4D]">Kitob haqida</h2>
          <div className="flex gap-3">
            <p className={cn("min-w-0 flex-1 text-[14px] leading-relaxed text-[#4b5568]", !more && "line-clamp-5")}>{book.summary}</p>
            <div className="relative size-[84px] shrink-0 overflow-hidden rounded-xl bg-[#eef2f8]">
              <Image src={book.image} alt="" fill sizes="84px" className="object-cover" />
            </div>
          </div>
          <button type="button" onClick={() => setMore((v) => !v)} className="mt-1.5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0066FF]">
            {more ? "Yopish" : "Batafsil"}
            <ChevronDown className={cn("size-4 transition-transform", more && "rotate-180")} />
          </button>
        </section>

        <section id="kitob-toc" className="scroll-mt-14">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#0B1F4D]">Mundarija <span className="text-[13px] font-medium text-[#8b93a7]">(asosiy boblar)</span></h2>
            <span className="inline-flex items-center text-[12.5px] font-semibold text-[#0066FF]">Barchasini ko‘rish <ChevronRight className="size-3.5" /></span>
          </div>
          <p className="rounded-2xl bg-[#f2f5fa] px-4 py-6 text-center text-[13px] text-[#8b93a7]">Mundarija tez orada qo‘shiladi.</p>
        </section>

        <section id="kitob-samples" className="scroll-mt-14">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#0B1F4D]">Namunaviy sahifalar</h2>
            <span className="inline-flex items-center text-[12.5px] font-semibold text-[#0066FF]">Barchasini ko‘rish <ChevronRight className="size-3.5" /></span>
          </div>
          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="grid h-[112px] w-[84px] shrink-0 place-items-center rounded-xl border border-dashed border-[#d5dcea] bg-[#f7f9fc] text-center text-[10.5px] leading-tight text-[#8b93a7]">
                <span>
                  <FileText className="mx-auto mb-1 size-5 text-[#b5bdcc]" strokeWidth={1.5} />
                  {n}-bet
                  <span className="block">tez orada</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section id="kitob-author" className="scroll-mt-14">
          <h2 className="mb-2 text-[17px] font-bold text-[#0B1F4D]">Muallif haqida</h2>
          <div className="flex items-center gap-3 rounded-2xl border border-[#e8ecf4] bg-white p-3.5">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[16px] font-bold text-[#0066FF]">
              {book.author.replace(/^Dr\.?\s*/i, "").split(" ").slice(0, 2).map((p) => p[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold text-[#0B1F4D]">{book.author}</p>
              <p className="mt-0.5 text-[12px] text-[#8b93a7]">Katalogda {sameAuthor} ta kitob</p>
              <p className="mt-1 text-[12px] leading-snug text-[#6b7280]">Muallif haqida batafsil ma’lumot tez orada qo‘shiladi.</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-[#8b93a7]" />
          </div>
        </section>

        <section id="kitob-reviews" className="scroll-mt-14">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-bold text-[#0B1F4D]">Foydalanuvchilar sharhlari <span className="text-[13px] font-medium text-[#8b93a7]">(0)</span></h2>
            <span className="inline-flex items-center text-[12.5px] font-semibold text-[#0066FF]">Barchasini ko‘rish <ChevronRight className="size-3.5" /></span>
          </div>
          <div className="rounded-2xl bg-[#f2f5fa] px-4 py-6 text-center text-[13px] text-[#8b93a7]">
            <span className="mb-1 flex items-center justify-center gap-0.5 text-[#cdd5e4]">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className="size-4" />
              ))}
            </span>
            <MessageSquare className="mx-auto mb-1 size-4 text-[#b5bdcc]" />
            Hozircha sharh yo‘q.
          </div>
        </section>

        <section id="kitob-related" className="scroll-mt-14">
          <h2 className="mb-2.5 text-[17px] font-bold text-[#0B1F4D]">Tavsiya</h2>
          {related.length ? (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {related.map((b) => (
                <Link key={b.id} href={bookHref(b.id)} className="w-[126px] shrink-0">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#eef2f8] shadow-[0_6px_16px_rgba(15,23,42,0.1)]">
                    <Image src={b.image} alt="" fill sizes="126px" className="object-cover" />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-tight font-semibold text-[#1a1d26]">{b.title}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#8b93a7]">{b.author}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-[#f2f5fa] px-4 py-6 text-center text-[13px] text-[#8b93a7]">Tavsiyalar tez orada.</p>
          )}
        </section>
      </div>

      <BookToast text={toast} />
    </div>
  );
}
