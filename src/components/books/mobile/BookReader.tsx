"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronDown, ChevronLeft, List, Moon } from "lucide-react";
import { fetchBook, saveBookProgress, type LiveBook, type LiveChapter } from "@/lib/live-content";
import "./book-reader.css";

const FONT_MIN = 14;
const FONT_MAX = 22;

function lookKey(id: string) {
  return `sk-reader-look-${id}`;
}

export function BookReader({ id }: { id: string }) {
  const router = useRouter();
  const posted = useRef<string>("");
  const [book, setBook] = useState<LiveBook | null | undefined>(undefined);
  const [font, setFont] = useState(16);
  const [dark, setDark] = useState(false);
  const [mark, setMark] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [toc, setToc] = useState(false);

  useEffect(() => {
    let stop = false;
    void fetchBook(id).then((row) => {
      if (stop) return;
      setBook(row);
      const start = row?.progress?.chapter ?? 0;
      const last = Math.max(0, (row?.chapters.length ?? 1) - 1);
      setIndex(Math.min(last, Math.max(0, start)));
    });
    try {
      const raw = window.localStorage.getItem(lookKey(id));
      if (raw) {
        const parsed = JSON.parse(raw) as { font?: number; dark?: boolean; mark?: number | null };
        if (typeof parsed.font === "number") setFont(Math.min(FONT_MAX, Math.max(FONT_MIN, parsed.font)));
        if (parsed.dark === true) setDark(true);
        if (typeof parsed.mark === "number") setMark(parsed.mark);
      }
    } catch {
      /* look prefs only */
    }
    return () => {
      stop = true;
    };
  }, [id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(lookKey(id), JSON.stringify({ font, dark, mark }));
    } catch {
      /* quota */
    }
  }, [dark, font, id, mark]);

  const chapters = book?.chapters ?? [];
  const total = Math.max(1, chapters.length);
  const page = Math.min(total, index + 1);
  const chapter = chapters[index];
  const percent = Math.round((page / total) * 100);

  useEffect(() => {
    if (!book || !chapters.length) return;
    const key = `${book.id}:${index}:${percent}`;
    if (posted.current === key) return;
    posted.current = key;
    const timer = window.setTimeout(() => {
      void saveBookProgress(book.id, index, percent);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [book, chapters.length, index, percent]);

  if (book === undefined) {
    return <div className="rd" data-testid="book-reader"><p className="rd-name">Yuklanmoqda...</p></div>;
  }
  if (!book) {
    return (
      <div className="rd" data-testid="book-reader">
        <header className="rd-top">
          <button type="button" className="rd-back" aria-label="Orqaga" onClick={() => router.push("/kitoblar")}><ChevronLeft /></button>
          <div className="rd-name"><b>Kitob topilmadi</b></div>
        </header>
      </div>
    );
  }

  const marked = mark === index;

  return (
    <div className={dark ? "rd dark" : "rd"} data-testid="book-reader" data-theme={dark ? "dark" : "light"}>
      <header className="rd-top">
        <button
          type="button"
          className="rd-back"
          aria-label="Orqaga"
          onClick={() => {
            if (window.history.length > 1) router.back();
            else router.push("/kitoblar");
          }}
        >
          <ChevronLeft />
        </button>
        <div className="rd-name">
          <b>{book.title}</b>
          <span>{book.author}</span>
        </div>
        <button type="button" className={marked ? "rd-mark on" : "rd-mark"} aria-label="Xatcho‘p" aria-pressed={marked} onClick={() => setMark(marked ? null : index)}>
          <Bookmark fill={marked ? "currentColor" : "none"} />
        </button>
      </header>

      <button type="button" className="rd-chap" data-testid="rd-chapter" onClick={() => setToc(true)}>
        <i><List /></i>
        <span>
          <b>{chapter?.title ?? "Kitob"}</b>
          <span>{chapters.length ? `${page}-bob` : book.pdfUrl ? "PDF" : "Matn yo‘q"}</span>
        </span>
        <ChevronDown className="chev" />
      </button>

      <div className="rd-scroll" style={{ fontSize: font }}>
        {chapter ? <ChapterBody chapter={chapter} /> : (
          <section>
            <h2>{book.title}</h2>
            {book.description ? <p>{book.description}</p> : <p>Hozircha bob qo‘shilmagan.</p>}
            {book.pdfUrl ? <p><a href={book.pdfUrl}>PDF ni ochish</a></p> : null}
          </section>
        )}
      </div>

      <footer className="rd-bar">
        <div className="rd-range">
          <input
            type="range"
            min={1}
            max={total}
            value={page}
            aria-label="Bob"
            data-testid="rd-slider"
            style={{ ["--p" as string]: `${((page - 1) / Math.max(1, total - 1)) * 100}%` }}
            onChange={(event) => setIndex(Number(event.target.value) - 1)}
          />
          <span data-testid="rd-page">{page} / {total} bob</span>
        </div>
        <div className="rd-tools">
          <button type="button" data-testid="rd-font-down" onClick={() => setFont((value) => Math.max(FONT_MIN, value - 1))}>
            <span className="big">A-</span>
            Kichikroq
          </button>
          <button type="button" data-testid="rd-font-up" onClick={() => setFont((value) => Math.min(FONT_MAX, value + 1))}>
            <span className="big">A+</span>
            Kattaroq
          </button>
          <button type="button" className={dark ? "on" : undefined} data-testid="rd-theme" aria-pressed={dark} onClick={() => setDark((value) => !value)}>
            <Moon />
            Tungi rejim
          </button>
          <button type="button" className={marked ? "on" : undefined} data-testid="rd-bookmark" aria-pressed={marked} onClick={() => setMark(marked ? null : index)}>
            <Bookmark fill={marked ? "currentColor" : "none"} />
            Xatcho‘p
          </button>
          <button type="button" data-testid="rd-toc" onClick={() => setToc(true)}>
            <List />
            Mundarija
          </button>
        </div>
      </footer>

      {toc ? (
        <div className="rd-sheet" role="dialog" aria-label="Mundarija" data-testid="rd-toc-sheet">
          <button type="button" className="absolute inset-0" aria-label="Yopish" data-testid="rd-toc-close" onClick={() => setToc(false)} />
          <div className="rd-box">
            <h3>Mundarija</h3>
            {chapters.length === 0 ? <p>Hozircha bob yo‘q</p> : null}
            {chapters.map((item, i) => (
              <button
                key={`${item.title}-${i}`}
                type="button"
                className={i === index ? "ch on" : "ch"}
                onClick={() => {
                  setIndex(i);
                  setToc(false);
                }}
              >
                <b>{item.title}</b>
                <span>{i + 1}-bob</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChapterBody({ chapter }: { chapter: LiveChapter }) {
  const parts = chapter.body.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return (
    <section>
      <h2>{chapter.title}</h2>
      {parts.length ? parts.map((line) => <p key={line}>{line}</p>) : <p>Bu bobda matn yo‘q.</p>}
    </section>
  );
}
