"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, Download, FileText, Heart, Layers, MonitorSmartphone, Bookmark, Share2, User } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { fetchBook, fetchBooks, type LiveBook } from "@/lib/live-content";
import { useStoredList } from "@/lib/stored-list";
import "./book-desktop.css";

function minutes(body: string) {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 200));
}

/** Desktop /kitoblar/[id] (mock "kitoblar product page"). Reading is free, so the main action opens the reader. */
export function BookProductDesktop({ id }: { id: string }) {
  const cartCount = useShopLineCount();
  const [book, setBook] = useState<LiveBook | null | undefined>(undefined);
  const [all, setAll] = useState<LiveBook[]>([]);
  const [tab, setTab] = useState<"tavsif" | "mundarija" | "muallif">("tavsif");
  const [saved, setSaved] = useStoredList<string>("sk-book-saved-v1", []);
  const [note, setNote] = useState("");

  useEffect(() => {
    let stop = false;
    void Promise.all([fetchBook(id), fetchBooks()]).then(([row, list]) => {
      if (stop) return;
      setBook(row ?? list.find((item) => item.id === id) ?? null);
      setAll(list);
    });
    return () => {
      stop = true;
    };
  }, [id]);

  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 2200);
    return () => window.clearTimeout(timer);
  }, [note]);

  const related = useMemo(() => all.filter((item) => item.id !== id).slice(0, 4), [all, id]);
  const byAuthor = useMemo(() => (book ? all.filter((item) => item.id !== id && item.author === book.author) : []), [all, book, id]);

  if (book === undefined || book === null) {
    return (
      <ShopShell searchPath="/kitoblar" cartCount={cartCount} placeholder="Kitob, muallif yoki ISBN bo‘yicha qidiring..." showCamera={false}>
        <div className="bkp-empty" data-testid="book-desktop">
          {book === undefined ? "Yuklanmoqda..." : <>Kitob topilmadi. <Link href="/kitoblar">Kitoblarga qaytish</Link></>}
        </div>
      </ShopShell>
    );
  }

  const read = `/kitoblar/${id}/oqish`;
  const percent = book.progress?.percent ?? 0;
  const isSaved = saved.includes(book.id);
  const year = book.createdAt ? new Date(book.createdAt).getFullYear() : 0;
  const facts = [
    { icon: Layers, label: "Boblar", value: book.chapters.length ? `${book.chapters.length} ta` : "—" },
    { icon: FileText, label: "Format", value: book.pdfUrl ? "PDF + onlayn" : "Onlayn" },
    { icon: BookOpen, label: "O‘qilgan", value: `${percent}%` },
    { icon: CalendarDays, label: "Qo‘shilgan", value: year ? String(year) : "—" },
  ];

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: book?.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      /* cancelled */
    }
  }

  return (
    <ShopShell searchPath="/kitoblar" cartCount={cartCount} placeholder="Kitob, muallif yoki ISBN bo‘yicha qidiring..." showCamera={false}>
      <article className="bkp" data-testid="book-desktop">
        <nav className="bkp-crumbs"><Link href="/">Bosh sahifa</Link><ChevronRight /><Link href="/kitoblar">Kitoblar</Link><ChevronRight /><span>{book.title}</span></nav>

        <div className="bkp-top">
          <div className="bkp-cover">
            {book.cover ? <img src={book.cover} alt={book.title} /> : <span><BookOpen /></span>}
          </div>

          <section className="bkp-info">
            <div className="bkp-badges">
              <span className="fmt">{book.pdfUrl ? "PDF" : "Onlayn"}</span>
              {book.chapters.length ? <span className="soft">{book.chapters.length} bob</span> : null}
              <span className="acts">
                <button type="button" className={isSaved ? "on" : undefined} aria-pressed={isSaved} aria-label="Saqlash" onClick={() => setSaved((prev) => (prev.includes(book.id) ? prev.filter((item) => item !== book.id) : [...prev, book.id]))}>
                  <Heart fill={isSaved ? "currentColor" : "none"} />
                </button>
                <button type="button" aria-label="Ulashish" onClick={() => void share()}><Share2 /></button>
              </span>
            </div>
            <h1>{book.title}</h1>
            <p className="author"><User /> {book.author}</p>
            {book.description ? <p className="blurb">{book.description.length > 320 ? `${book.description.slice(0, 320)}…` : book.description}</p> : null}
            <div className="bkp-facts">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label}><i><Icon /></i><span><small>{label}</small><b>{value}</b></span></div>
              ))}
            </div>
          </section>

          <aside className="bkp-buy">
            <strong>{book.price > 0 ? som(book.price) : "Bepul"}</strong>
            {percent > 0 ? <div className="bkp-progress"><span><i style={{ width: `${percent}%` }} /></span><small>{percent}% o‘qilgan</small></div> : null}
            <Link href={read} className="go" data-testid="book-read"><BookOpen /> {percent > 0 ? "O‘qishni davom ettirish" : "O‘qishni boshlash"}</Link>
            {book.pdfUrl ? <a href={book.pdfUrl} target="_blank" rel="noreferrer" className="soft"><Download /> PDF yuklab olish</a> : null}
            <button type="button" className="ghost" onClick={() => setTab("mundarija")}><Layers /> Mundarijani ko‘rish</button>
            <ul>
              <li><MonitorSmartphone /> Istalgan qurilmada onlayn o‘qish</li>
              <li><Bookmark /> O‘qish joyingiz saqlanib boradi</li>
              {book.pdfUrl ? <li><Download /> PDF faylni yuklab olish mumkin</li> : null}
            </ul>
          </aside>
        </div>

        <section className="bkp-tabs">
          <div className="bkp-bar" role="tablist">
            {([["tavsif", "Tavsif"], ["mundarija", `Mundarija${book.chapters.length ? ` (${book.chapters.length})` : ""}`], ["muallif", "Muallif haqida"]] as const).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "on" : undefined} onClick={() => setTab(key)}>{label}</button>
            ))}
          </div>
          <div className="bkp-body">
            <div className="main">
              {tab === "tavsif" ? (
                <>
                  <h2>Kitob haqida</h2>
                  <p className="copy">{book.description || "Tavsif qo‘shilmagan."}</p>
                </>
              ) : null}
              {tab === "mundarija" ? (
                <>
                  <h2>Mundarija</h2>
                  {book.chapters.length === 0 ? <p className="copy">Boblar hali qo‘shilmagan.</p> : (
                    <ol className="bkp-toc full">
                      {book.chapters.map((chapter, index) => (
                        <li key={`${index}-${chapter.title}`}><Link href={read}><em>{index + 1}</em><span>{chapter.title}</span><small>{minutes(chapter.body)} daq</small></Link></li>
                      ))}
                    </ol>
                  )}
                </>
              ) : null}
              {tab === "muallif" ? (
                <>
                  <h2>{book.author}</h2>
                  <p className="copy">{byAuthor.length ? `StomaHub’da muallifning yana ${byAuthor.length} ta kitobi bor.` : "Muallif haqida qo‘shimcha ma’lumot kiritilmagan."}</p>
                </>
              ) : null}
            </div>
            {tab !== "mundarija" && book.chapters.length ? (
              <div className="side">
                <h3>Mundarija <small>(qisqa)</small> <button type="button" onClick={() => setTab("mundarija")}>Barchasini ko‘rish <ArrowRight /></button></h3>
                <ol className="bkp-toc">
                  {book.chapters.slice(0, 6).map((chapter, index) => (
                    <li key={`${index}-${chapter.title}`}><Link href={read}><em>{index + 1}</em><span>{chapter.title}</span><small>{minutes(chapter.body)} daq</small></Link></li>
                  ))}
                </ol>
              </div>
            ) : null}
            <div className="author-box">
              <h3>Muallif</h3>
              <p className="who"><span><User /></span><b>{book.author}</b></p>
              {byAuthor.length ? (
                <ul>{byAuthor.slice(0, 3).map((item) => <li key={item.id}><Check /> <Link href={`/kitoblar/${item.id}`}>{item.title}</Link></li>)}</ul>
              ) : null}
              <Link href={`/kitoblar?q=${encodeURIComponent(book.author)}`} className="more">Muallifning boshqa kitoblari <ArrowRight /></Link>
            </div>
          </div>
        </section>

        {related.length ? (
          <section className="bkp-related">
            <h2>O‘xshash kitoblar <Link href="/kitoblar">Barchasini ko‘rish <ArrowRight /></Link></h2>
            <div>
              {related.map((item) => (
                <Link key={item.id} href={`/kitoblar/${item.id}`} className="card">
                  {item.cover ? <img src={item.cover} alt="" /> : <span className="ph" />}
                  <span className="txt"><b>{item.title}</b><small>{item.author}</small><em>{item.price > 0 ? som(item.price) : "Bepul"}</em></span>
                  <i><BookOpen /></i>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
        {note ? <p className="bkp-toast" role="status">{note}</p> : null}
      </article>
    </ShopShell>
  );
}
