"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DesktopHeader } from "@/components/desktop/desktop-header";
import { DesktopSidebar } from "@/components/desktop/desktop-sidebar";
import { fetchBook, saveBookProgress, type LiveBook } from "@/lib/live-content";
import "./reader-desktop.css";

const FONT_MIN = 14;
const FONT_MAX = 24;
const lookKey = (id: string) => `sk-reader-desk-look-${id}`;

type Mark = { page: number; label: string };
type Note = { id: string; page: number; text: string; at: string };

export function ReaderDesktop({ id }: { id: string }) {
  const router = useRouter();
  const posted = useRef("");
  const [book, setBook] = useState<LiveBook | null | undefined>(undefined);
  const [font, setFont] = useState(16);
  const [dark, setDark] = useState(false);
  const [index, setIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<Mark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tab, setTab] = useState<"marks" | "notes">("marks");
  const [searchOn, setSearchOn] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [writing, setWriting] = useState(false);

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
        const parsed = JSON.parse(raw) as { font?: number; dark?: boolean; bookmarks?: Mark[]; notes?: Note[] };
        if (typeof parsed.font === "number") setFont(Math.min(FONT_MAX, Math.max(FONT_MIN, parsed.font)));
        if (parsed.dark === true) setDark(true);
        if (Array.isArray(parsed.bookmarks)) setBookmarks(parsed.bookmarks);
        if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
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
      window.localStorage.setItem(lookKey(id), JSON.stringify({ font, dark, bookmarks, notes }));
    } catch {
      /* quota */
    }
  }, [bookmarks, dark, font, id, notes]);

  const chapters = book?.chapters ?? [];
  const total = Math.max(1, chapters.length);
  const page = Math.min(total, index + 1);
  const chapter = chapters[index];
  const percent = Math.round((page / total) * 100);
  const marked = bookmarks.some((item) => item.page === page);

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

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return chapters.flatMap((item, i) => {
      const text = `${item.title} ${item.body}`;
      return text.toLowerCase().includes(q) ? [{ page: i + 1, text: item.title }] : [];
    }).slice(0, 6);
  }, [chapters, query]);

  function go(next: number) {
    setIndex(Math.min(total, Math.max(1, next)) - 1);
  }
  function toggleMark() {
    if (!chapter) return;
    setBookmarks((list) => (list.some((item) => item.page === page) ? list.filter((item) => item.page !== page) : [{ page, label: chapter.title }, ...list]));
  }
  function addNote() {
    const text = draft.trim();
    if (!text) return;
    setNotes((list) => [{ id: `n-${Date.now()}`, page, text, at: new Date().toLocaleString("ru-RU") }, ...list]);
    setDraft("");
    setWriting(false);
    setTab("notes");
  }

  return (
    <div className="sh dh">
      <DesktopHeader searchPlaceholder="Kitob, mavzu yoki muallif..." />
      <div className="sh-body">
        <DesktopSidebar />
        <main className={dark ? "rdx dark" : "rdx"} data-testid="reader-desktop" data-theme={dark ? "dark" : "light"}>
          <header className="rdx-top">
            <button type="button" aria-label="Orqaga" onClick={() => (window.history.length > 1 ? router.back() : router.push(`/kitoblar/${id}`))}>‹</button>
            <div className="rdx-title">
              <strong>{book?.title ?? (book === undefined ? "Yuklanmoqda..." : "Kitob topilmadi")}</strong>
              <span>{book?.author ?? ""}</span>
            </div>
            <div className="rdx-tools">
              <button type="button" data-testid="rd-font-down" onClick={() => setFont((value) => Math.max(FONT_MIN, value - 1))}>A−</button>
              <button type="button" data-testid="rd-font-up" onClick={() => setFont((value) => Math.min(FONT_MAX, value + 1))}>A+</button>
              <button type="button" className={dark ? "on" : undefined} data-testid="rd-theme" aria-pressed={dark} onClick={() => setDark((value) => !value)}>Tungi rejim</button>
              <button type="button" className={marked ? "on" : undefined} data-testid="rd-bookmark" aria-pressed={marked} onClick={toggleMark}>Xatcho‘p</button>
              <button type="button" className={searchOn ? "on" : undefined} data-testid="rd-search-toggle" onClick={() => setSearchOn((value) => !value)}>Qidirish</button>
              {searchOn ? <input aria-label="Qidirish" data-testid="rd-search" value={query} placeholder="Matndan qidirish" onChange={(event) => setQuery(event.target.value)} /> : null}
            </div>
          </header>
          <div className="rdx-body">
            <aside>
              <div className="rdx-book">
                {book?.cover ? <img src={book.cover} alt="" /> : null}
                <div>
                  <b>{book?.title ?? "Kitob"}</b>
                  <small>{book?.description?.slice(0, 90) || "Tavsif yo‘q"}</small>
                  <em>{book?.author}</em>
                </div>
              </div>
              <h2>Mundarija</h2>
              {chapters.length === 0 ? <p>Hozircha bob yo‘q</p> : null}
              {chapters.map((item, i) => (
                <button key={`${item.title}-${i}`} type="button" className={i === index ? "rdx-ch on" : "rdx-ch"} onClick={() => go(i + 1)}>
                  <span>{item.title}</span><small>{i + 1}-bob</small>
                </button>
              ))}
            </aside>
            <article className="rdx-read" style={{ fontSize: font }} data-testid="rd-content">
              {hits.length ? (
                <div data-testid="rd-hits">
                  {hits.map((hit) => <button key={hit.text} type="button" onClick={() => go(hit.page)}>{hit.page}-bob · {hit.text}</button>)}
                </div>
              ) : null}
              {chapter ? (
                <>
                  <h2>{chapter.title}</h2>
                  {chapter.body.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => <p key={line}>{line}</p>)}
                  {!chapter.body.trim() ? <p>Bu bobda matn yo‘q.</p> : null}
                </>
              ) : (
                <>
                  <h2>{book?.title ?? "Kitob"}</h2>
                  <p>{book?.description || "Hozircha bob qo‘shilmagan."}</p>
                  {book?.pdfUrl ? <p><a href={book.pdfUrl}>PDF ni ochish</a></p> : null}
                </>
              )}
            </article>
            <aside className="rdx-side">
              <div className="rdx-tabs">
                <button type="button" className={tab === "marks" ? "on" : undefined} onClick={() => setTab("marks")}>Xatcho‘plar</button>
                <button type="button" className={tab === "notes" ? "on" : undefined} data-testid="rd-notes-tab" onClick={() => setTab("notes")}>Mening eslatmalarim</button>
              </div>
              {tab === "marks" ? (
                <>
                  {bookmarks.length === 0 ? <p>Hozircha xatcho‘p yo‘q</p> : null}
                  {bookmarks.map((item) => (
                    <button key={item.page} type="button" className="rdx-mark" onClick={() => go(item.page)}>
                      <b>{item.label}</b><small>{item.page}-bob</small>
                    </button>
                  ))}
                  <button type="button" className="rdx-add" data-testid="rd-add-mark" onClick={toggleMark}>+ Joriy bobni xatcho‘pga qo‘shish</button>
                </>
              ) : (
                <>
                  {notes.length === 0 && !writing ? <p>Hozircha eslatma yo‘q</p> : null}
                  {notes.map((item) => (
                    <article key={item.id} className="rdx-note"><b>{item.page}-bob</b><p>{item.text}</p><small>{item.at}</small></article>
                  ))}
                  {writing ? (
                    <div>
                      <textarea aria-label="Eslatma" value={draft} onChange={(event) => setDraft(event.target.value)} />
                      <button type="button" className="rdx-add" data-testid="rd-save-note" onClick={addNote}>Saqlash</button>
                    </div>
                  ) : <button type="button" className="rdx-add" data-testid="rd-new-note" onClick={() => setWriting(true)}>+ Yangi eslatma</button>}
                </>
              )}
            </aside>
          </div>
          <footer className="rdx-foot">
            <button type="button" data-testid="rd-prev" onClick={() => go(page - 1)}>‹ Oldingi bob</button>
            <input type="range" min={1} max={total} value={page} aria-label="Bob" data-testid="rd-slider" onChange={(event) => go(Number(event.target.value))} />
            <span data-testid="rd-page">{page} / {total} bob</span>
            <button type="button" data-testid="rd-next" onClick={() => go(page + 1)}>Keyingi bob ›</button>
          </footer>
        </main>
      </div>
    </div>
  );
}
