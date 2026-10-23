"use client";
/* eslint-disable @next/next/no-img-element -- covers are seller uploads */

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronRight, ChevronUp, Download, FileText, Layers, ListOrdered, User } from "lucide-react";
import type { LiveBook } from "@/lib/live-content";
import { formatMoney } from "@/lib/format";
import "./book-detail.css";

/** Reading time of a chapter at ~200 words a minute. */
function minutes(body: string) {
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 200));
}

/** Phone /kitoblar/[id] (mock "kitoblar product page"). Reading is free, so the main action opens the reader. */
export function BookDetailPhone({ book }: { book: LiveBook }) {
  const [more, setMore] = useState(false);
  const [allChapters, setAllChapters] = useState(false);
  const read = `/kitoblar/${book.id}/oqish`;
  const percent = book.progress?.percent ?? 0;
  const chapters = allChapters ? book.chapters : book.chapters.slice(0, 5);
  const long = book.description.length > 180;
  const facts = [
    { icon: <Layers />, label: "Boblar", value: book.chapters.length ? `${book.chapters.length} ta` : "—" },
    { icon: <FileText />, label: "Format", value: book.pdfUrl ? "PDF + onlayn" : "Onlayn" },
    { icon: <BookOpen />, label: "O‘qilgan", value: `${percent}%` },
  ];

  return (
    <div className="bd lg:hidden" data-testid="book-phone">
      <section className="bd-top">
        <div className="bd-cover">
          {book.cover ? <img src={book.cover} alt="" /> : <span><BookOpen /></span>}
        </div>
        <div className="bd-copy">
          <span className="bd-tag">Kitoblar</span>
          <h1>{book.title}</h1>
          <p className="bd-author"><User /> {book.author}</p>
          <b className="bd-price">{book.price > 0 ? formatMoney(book.price, "UZS") : "Bepul"}</b>
          <Link href={read} className="bd-main"><BookOpen /> {percent > 0 ? "Davom ettirish" : "O‘qishni boshlash"}</Link>
          {book.pdfUrl ? (
            <a href={book.pdfUrl} target="_blank" rel="noreferrer" className="bd-ghost"><Download /> PDF yuklab olish</a>
          ) : null}
        </div>
      </section>

      <div className="bd-facts">
        {facts.map((fact) => (
          <article key={fact.label}>
            <i>{fact.icon}</i>
            <span><small>{fact.label}</small><b>{fact.value}</b></span>
          </article>
        ))}
      </div>

      {book.description ? (
        <section className="bd-card">
          <header><i><FileText /></i><h2>Tavsif</h2></header>
          <p className={more || !long ? "bd-text" : "bd-text clamp"}>{book.description}</p>
          {long ? (
            <button type="button" className="bd-more" onClick={() => setMore((value) => !value)}>
              {more ? "Yig‘ish" : "Batafsil"} {more ? <ChevronUp /> : <ChevronDown />}
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="bd-card">
        <header>
          <i><ListOrdered /></i>
          <h2>Mundarija</h2>
          {book.chapters.length > 5 ? (
            <button type="button" onClick={() => setAllChapters((value) => !value)}>
              {allChapters ? "Yig‘ish" : `Barcha boblar (${book.chapters.length})`} <ChevronRight />
            </button>
          ) : null}
        </header>
        {book.chapters.length === 0 ? (
          <p className="bd-empty">Boblar hali qo‘shilmagan.</p>
        ) : (
          <ul className="bd-toc">
            {chapters.map((chapter, index) => (
              <li key={`${index}-${chapter.title}`}>
                <Link href={read}>
                  <em>{index + 1}-bob</em>
                  <span>{chapter.title}</span>
                  <small>{minutes(chapter.body)} daq</small>
                  <ChevronRight />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
