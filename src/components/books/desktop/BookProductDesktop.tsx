"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { som } from "@/components/shop/desktop/shop-cart";
import { fetchBook, fetchBooks, type LiveBook } from "@/lib/live-content";
import "./book-desktop.css";

export function BookProductDesktop({ id }: { id: string }) {
  const [book, setBook] = useState<LiveBook | null | undefined>(undefined);
  const [related, setRelated] = useState<LiveBook[]>([]);
  const [tab, setTab] = useState<"tavsif" | "mundarija" | "sharh">("tavsif");
  const [more, setMore] = useState(false);
  const [openChapter, setOpenChapter] = useState(0);

  useEffect(() => {
    let stop = false;
    void Promise.all([fetchBook(id), fetchBooks()]).then(([row, list]) => {
      if (stop) return;
      setBook(row);
      setRelated(list.filter((item) => item.id !== id).slice(0, 5));
    });
    return () => {
      stop = true;
    };
  }, [id]);

  if (book === undefined) {
    return <ClinicShell accent="blue"><div className="bkx" data-testid="book-desktop"><p>Yuklanmoqda...</p></div></ClinicShell>;
  }
  if (!book) {
    return (
      <ClinicShell accent="blue">
        <div className="bkx" data-testid="book-desktop">
          <h1>Kitob topilmadi</h1>
          <Link href="/kitoblar">Kitoblarga qaytish</Link>
        </div>
      </ClinicShell>
    );
  }

  const priceLabel = book.price > 0 ? som(book.price) : "Bepul";

  return (
    <ClinicShell accent="blue">
      <div className="bkx" data-testid="book-desktop">
        <div className="bkx-crumb"><Link href="/marketplace">Do‘kon</Link><span>›</span><Link href="/kitoblar">Kitoblar</Link><span>›</span><b>{book.title}</b></div>
        <div className="bkx-hero">
          {book.cover ? <img className="bkx-cover" src={book.cover} alt="" /> : <div className="bkx-cover" />}
          <div>
            <h1>{book.title}</h1>
            <p className="bkx-author">Muallif: {book.author}</p>
            {book.progress ? <p className="bkx-stars">O‘qilgan: <b>{book.progress.percent}%</b></p> : null}
            <p className="bkx-price">{priceLabel}</p>
            <div className="bkx-label">{book.pdfUrl ? "PDF mavjud" : book.chapters.length ? `${book.chapters.length} bob` : "Elektron kitob"}</div>
            <div className="bkx-actions">
              <Link href={`/kitoblar/${id}/oqish`} data-testid="book-read">O‘qish</Link>
              {book.pdfUrl ? <a href={book.pdfUrl}>PDF</a> : null}
            </div>
          </div>
          <aside className="bkx-facts">
            <h2>Kitob ma’lumotlari</h2>
            <div><span>Muallif</span><b>{book.author}</b></div>
            <div><span>Boblar</span><b>{book.chapters.length || "—"}</b></div>
            <div><span>Narx</span><b>{priceLabel}</b></div>
            <div><span>PDF</span><b>{book.pdfUrl ? "Bor" : "Yo‘q"}</b></div>
          </aside>
        </div>
        <div className="bkx-main">
          <div>
            <div className="bkx-tabs">
              {([["tavsif", "Tavsif"], ["mundarija", "Mundarija"], ["sharh", "Sharhlar"]] as const).map(([key, label]) => (
                <button key={key} type="button" className={tab === key ? "on" : undefined} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>
            {tab === "tavsif" ? (
              <div className="bkx-copy">
                <p>{more || book.description.length < 280 ? book.description || "Tavsif yo‘q." : `${book.description.slice(0, 280)}…`}</p>
                {book.description.length >= 280 ? <button type="button" onClick={() => setMore((value) => !value)}>{more ? "Yig‘ish" : "Ko‘proq o‘qish"}</button> : null}
              </div>
            ) : null}
            {tab === "mundarija" ? (
              <div className="bkx-toc">
                {book.chapters.length === 0 ? <p>Hozircha bob yo‘q</p> : null}
                {book.chapters.map((item, index) => (
                  <button key={`${item.title}-${index}`} type="button" className={openChapter === index ? "on" : undefined} onClick={() => setOpenChapter(index)}>
                    {index + 1}. {item.title}
                    {openChapter === index && item.body ? <small>{item.body.slice(0, 140)}</small> : null}
                  </button>
                ))}
              </div>
            ) : null}
            {tab === "sharh" ? <div className="bkx-reviews"><p>Hozircha sharh yo‘q.</p></div> : null}
          </div>
        </div>
        <section>
          <div className="bkx-saved"><h2>O‘xshash kitoblar</h2><Link href="/kitoblar">Barchasini ko‘rish ›</Link></div>
          {related.length === 0 ? <p>Hozircha boshqa kitob yo‘q</p> : null}
          <div className="bkx-related">
            {related.map((item) => (
              <Link key={item.id} href={`/kitoblar/${item.id}`}>
                <article>{item.cover ? <img src={item.cover} alt="" /> : null}<b>{item.title}</b><small>{item.author}</small><em>{item.price > 0 ? som(item.price) : "Bepul"}</em></article>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </ClinicShell>
  );
}
