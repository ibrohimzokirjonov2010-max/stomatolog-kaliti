"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronLeft, Moon, Search } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { books as hubBooks } from "@/data/desktop-hub";
import { books as eduBooks } from "@/data/education";
import { READER_PAGES, readerChapters, type ReaderChapter } from "@/data/reader-book";
import "./reader-desktop.css";

type Mark = { page: number; label: string };
type Note = { id: string; page: number; text: string; at: string };
type Store = { font: number; dark: boolean; bookmarks: Mark[]; notes: Note[] };

const TOC = [
  { id: "kirish", title: "1-bob. Klinik ko‘rik", page: 1, children: [
    { id: "k1", title: "1.1. Bemorni qabul qilish", page: 1 },
    { id: "k2", title: "1.2. Tashxis yozuvi", page: 18 },
  ] },
  { id: "kariyes", title: "2-bob. Kariyes va uning davolash usullari", page: 45, children: [
    { id: "c1", title: "2.1. Kariyes tushunchasi", page: 45 },
    { id: "c2", title: "2.2. Kariyesning etiologiyasi", page: 72 },
  ] },
  { id: "pulpit", title: "3-bob. Pulpit va periodontit", page: 128, children: [
    { id: "p1", title: "3.1. Pulpit belgilari", page: 128 },
    { id: "p2", title: "3.2. Apikal periodontit", page: 160 },
  ] },
  { id: "profilaktika", title: "4-bob. Profilaktika", page: 210, children: [
    { id: "f1", title: "4.1. Individual gigiyena", page: 210 },
    { id: "f2", title: "4.2. Klinik profilaktika", page: 248 },
  ] },
];

const FLAT = TOC.flatMap((item) => [item, ...item.children]);
const FONT_MIN = 14;
const FONT_MAX = 24;

function keyOf(id: string) {
  return `sk-reader-desk-${id}`;
}

function labelFor(page: number) {
  const hit = [...FLAT].reverse().find((item) => item.page <= page);
  return hit?.title ?? `Sahifa ${page}`;
}

function seed(): Store {
  return {
    font: 16,
    dark: false,
    bookmarks: [
      { page: 12, label: "1.1. Bemorni qabul qilish" },
      { page: 45, label: "2.1. Kariyes tushunchasi" },
    ],
    notes: [
      { id: "n1", page: 45, text: "Streptococcus mutans — asosiy kariyesogen bakteriya.", at: "12.10.2026" },
    ],
  };
}

export function ReaderDesktop({ id }: { id: string }) {
  const router = useRouter();
  const hub = hubBooks.find((book) => book.id === id);
  const edu = eduBooks.find((book) => book.id === id);
  const title = hub?.title ?? edu?.title ?? "Stomatologiya klinik amaliyotda";
  const author = hub?.authors ?? edu?.author ?? "Dr. Azizbek Rahimov";
  const image = hub?.image ?? edu?.image ?? "/img/hub/book-1.jpg";
  const [font, setFont] = useState(16);
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState(45);
  const [bookmarks, setBookmarks] = useState<Mark[]>(seed().bookmarks);
  const [notes, setNotes] = useState<Note[]>(seed().notes);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"marks" | "notes">("marks");
  const [searchOn, setSearchOn] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only available after mount */
    try {
      const raw = window.localStorage.getItem(keyOf(id));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Store>;
        if (typeof parsed.font === "number") setFont(Math.min(FONT_MAX, Math.max(FONT_MIN, parsed.font)));
        if (parsed.dark === true) setDark(true);
        if (Array.isArray(parsed.bookmarks)) setBookmarks(parsed.bookmarks);
        if (Array.isArray(parsed.notes)) setNotes(parsed.notes);
      }
    } catch {
      /* keep seed */
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(keyOf(id), JSON.stringify({ font, dark, bookmarks, notes }));
    } catch {
      /* quota */
    }
  }, [bookmarks, dark, font, id, notes, ready]);

  const chapter = readerChapters.reduce((best, item) => (item.page <= page ? item : best), readerChapters[0]);
  const activeId = [...FLAT].reverse().find((item) => item.page <= page)?.id ?? FLAT[0].id;
  const marked = bookmarks.some((item) => item.page === page);

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return readerChapters.flatMap((item) => item.blocks.flatMap((block) => {
      const text = block.type === "p" || block.type === "h2" ? block.text : block.type === "factors" ? block.items.map((row) => row.title).join(" ") : "";
      if (!text.toLowerCase().includes(q)) return [];
      return [{ page: item.page, text }];
    })).slice(0, 6);
  }, [query]);

  function go(next: number) {
    setPage(Math.min(READER_PAGES, Math.max(1, next)));
  }

  function toggleMark() {
    setBookmarks((list) => (list.some((item) => item.page === page) ? list.filter((item) => item.page !== page) : [{ page, label: labelFor(page) }, ...list]));
  }

  function addNote() {
    const text = draft.trim();
    if (!text) return;
    setNotes((list) => [{ id: `n-${Date.now()}`, page, text, at: "16.10.2026" }, ...list]);
    setDraft("");
    setWriting(false);
    setTab("notes");
  }

  return (
    <ClinicShell accent="blue">
      <div className={dark ? "rdk dark" : "rdk"} data-testid="reader-desktop" data-theme={dark ? "dark" : "light"}>
        <header className="rdk-top">
          <button type="button" className="rdk-back" aria-label="Orqaga" onClick={() => (window.history.length > 1 ? router.back() : router.push(`/kitoblar/${id}`))}>
            <ChevronLeft />
          </button>
          <div className="rdk-name">
            <b>{title}</b>
            <span>{author}</span>
          </div>
          <div className="rdk-tools">
            <button type="button" data-testid="rd-font-down" onClick={() => setFont((value) => Math.max(FONT_MIN, value - 1))}>A-</button>
            <button type="button" data-testid="rd-font-up" onClick={() => setFont((value) => Math.min(FONT_MAX, value + 1))}>A+</button>
            <button type="button" className={dark ? "on" : undefined} data-testid="rd-theme" aria-pressed={dark} onClick={() => setDark((value) => !value)}><Moon size={14} /> Tungi rejim</button>
            <button type="button" className={marked ? "on" : undefined} data-testid="rd-bookmark" aria-pressed={marked} onClick={toggleMark}><Bookmark size={14} fill={marked ? "currentColor" : "none"} /> Xatcho‘p</button>
            <button type="button" className={searchOn ? "on" : undefined} data-testid="rd-search-toggle" onClick={() => setSearchOn((value) => !value)}><Search size={14} /> Qidirish</button>
            {searchOn ? <input className="rdk-search" aria-label="Qidirish" data-testid="rd-search" value={query} placeholder="Matndan qidirish" onChange={(event) => setQuery(event.target.value)} /> : null}
          </div>
        </header>
        <div className="rdk-grid">
          <aside className="rdk-side">
            <div className="rdk-book">
              <img src={image} alt="" />
              <div><b>{title}</b><span>{author}</span></div>
            </div>
            <h3>Mundarija</h3>
            {TOC.map((item) => (
              <div key={item.id}>
                <button type="button" className={activeId === item.id ? "rdk-node on" : "rdk-node"} onClick={() => go(item.page)}>
                  {item.title}<span>{item.page}</span>
                </button>
                {item.children.map((child) => (
                  <button key={child.id} type="button" className={activeId === child.id ? "rdk-sub on" : "rdk-sub"} data-testid={`toc-${child.id}`} onClick={() => go(child.page)}>
                    {child.title}<span>{child.page}</span>
                  </button>
                ))}
              </div>
            ))}
          </aside>
          <article className="rdk-read" style={{ fontSize: font }} data-testid="rd-content">
            {hits.length ? (
              <div data-testid="rd-hits">
                {hits.map((hit) => (
                  <button key={`${hit.page}-${hit.text.slice(0, 12)}`} type="button" className="rdk-hit" onClick={() => go(hit.page)}>
                    <b>{hit.page}-bet</b>
                    {hit.text}
                  </button>
                ))}
              </div>
            ) : (
              <ChapterView chapter={chapter} page={page} query={query} />
            )}
          </article>
          <aside className="rdk-side">
            <div className="rdk-tabs">
              <button type="button" className={tab === "marks" ? "on" : undefined} onClick={() => setTab("marks")}>Xatcho‘plar</button>
              <button type="button" className={tab === "notes" ? "on" : undefined} data-testid="rd-notes-tab" onClick={() => setTab("notes")}>Mening eslatmalarim</button>
            </div>
            {tab === "marks" ? (
              <>
                {bookmarks.length === 0 ? <p>Xatcho‘p yo‘q</p> : bookmarks.map((item) => (
                  <button key={item.page} type="button" className="rdk-hit" onClick={() => go(item.page)}>
                    <b>{item.label}</b>
                    {item.page}-bet
                  </button>
                ))}
                <button type="button" className="rdk-add" data-testid="rd-add-mark" onClick={toggleMark}>Joriy sahifani xatcho‘pga qo‘shish</button>
              </>
            ) : (
              <>
                {notes.map((item) => (
                  <button key={item.id} type="button" className="rdk-note" onClick={() => go(item.page)}>
                    <b>{item.page}-bet · {item.at}</b>
                    {item.text}
                  </button>
                ))}
                {writing ? (
                  <div className="rdk-noteform">
                    <textarea aria-label="Eslatma" value={draft} onChange={(event) => setDraft(event.target.value)} />
                    <button type="button" className="rdk-add" data-testid="rd-save-note" onClick={addNote}>Saqlash</button>
                  </div>
                ) : (
                  <button type="button" className="rdk-add" data-testid="rd-new-note" onClick={() => setWriting(true)}>Yangi eslatma</button>
                )}
              </>
            )}
          </aside>
        </div>
        <footer className="rdk-bottom">
          <button type="button" data-testid="rd-prev" onClick={() => go(page - 1)}>Oldingi sahifa</button>
          <input type="range" min={1} max={READER_PAGES} value={page} aria-label="Sahifa" data-testid="rd-slider" onChange={(event) => go(Number(event.target.value))} />
          <span className="rdk-page" data-testid="rd-page">{page} / {READER_PAGES}</span>
          <button type="button" data-testid="rd-next" onClick={() => go(page + 1)}>Keyingi sahifa</button>
        </footer>
      </div>
    </ClinicShell>
  );
}

function ChapterView({ chapter, page, query }: { chapter: ReaderChapter; page: number; query: string }) {
  const q = query.trim();
  function paint(text: string) {
    if (!q) return text;
    const index = text.toLowerCase().indexOf(q.toLowerCase());
    if (index < 0) return text;
    return <>{text.slice(0, index)}<mark>{text.slice(index, index + q.length)}</mark>{text.slice(index + q.length)}</>;
  }
  return (
    <>
      <p style={{ color: "#8b97a8" }}>{page}-bet</p>
      {chapter.blocks.map((block, index) => {
        if (block.type === "h2") return <h2 key={index}>{paint(block.text)}</h2>;
        if (block.type === "p") return <p key={index}>{paint(block.text)}</p>;
        if (block.type === "figure") return <Figure key={index} />;
        return (
          <div key={index}>
            {block.items.map((item, i) => (
              <div key={item.title} className="rdk-factor">
                <i>{i + 1}</i>
                <div><b>{item.title}</b><span>{item.text}</span></div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function Figure() {
  return (
    <figure className="rdk-fig">
      <svg viewBox="0 0 640 180" role="img" aria-label="Kariyes bosqichlari">
        <rect width="640" height="180" fill="#fffaf8" />
        {[18, 172, 326, 480].map((x, hole) => (
          <g key={x}>
            <path d={`M${x + 18} 130 Q ${x + 8} 50 ${x + 36} 32 Q ${x + 62} 14 ${x + 86} 36 Q ${x + 112} 54 ${x + 100} 130 Q ${x + 70} 148 ${x + 28} 140 Z`} fill="#f7f4ef" stroke="#e4ddd2" />
            <path d={`M${x + 40} 70 Q ${x + 62} 54 ${x + 82} 74 L ${x + 74} 118 Q ${x + 58} 128 ${x + 46} 112 Z`} fill="#f3e2b8" />
            {hole > 0 ? <path d={`M${x + 50} 46 Q ${x + 66} ${36 + hole * 6} ${x + 78} 52 Q ${x + 68} ${70 + hole * 10} ${x + 52} ${62 + hole * 8} Z`} fill={hole > 2 ? "#6b3a2a" : "#8a5a32"} /> : null}
          </g>
        ))}
      </svg>
      <figcaption>2.1-rasm. Kariyesning rivojlanish bosqichlari</figcaption>
    </figure>
  );
}
