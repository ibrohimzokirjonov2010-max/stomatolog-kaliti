"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { READER_PAGES, readerChapters } from "@/data/reader-book";
import "./reader-desktop.css";

const FONT_MIN = 14;
const FONT_MAX = 24;
const keyOf = (id: string) => `sk-reader-desk-${id}`;

type Mark = { page: number; label: string };
type Note = { id: string; page: number; text: string; at: string };
type Store = { font?: number; dark?: boolean; bookmarks?: Mark[]; notes?: Note[] };

const TREE = [
  { id: "b1", label: "1-bob. Kirish", page: 12, pages: "12 bet", children: [] as { id: string; label: string; page: number; pages: string }[] },
  {
    id: "b2",
    label: "2-bob. Kariyes va uning davolash usullari",
    page: 45,
    pages: "34 bet",
    children: [
      { id: "c21", label: "2.1. Kariyes tushunchasi", page: 45, pages: "8 bet" },
      { id: "c22", label: "2.2. Kariyesning etiologiyasi", page: 48, pages: "" },
      { id: "c23", label: "2.3. Klinik ko‘rinishi", page: 52, pages: "" },
      { id: "c24", label: "2.4. Diagnostika usullari", page: 56, pages: "6 bet" },
      { id: "c25", label: "2.5. Davolash usullari", page: 61, pages: "6 bet" },
    ],
  },
  { id: "b3", label: "3-bob. Endodontik davolash", page: 72, pages: "42 bet", children: [] },
  { id: "b4", label: "4-bob. Restavratsion stomatologiya", page: 114, pages: "36 bet", children: [] },
  { id: "b5", label: "5-bob. Jarrohlik stomatologiya", page: 150, pages: "40 bet", children: [] },
  { id: "b6", label: "6-bob. Parodontologiya", page: 190, pages: "28 bet", children: [] },
  { id: "b7", label: "7-bob. Ortodontiya", page: 218, pages: "24 bet", children: [] },
  { id: "b8", label: "8-bob. Implantologiya", page: 242, pages: "38 bet", children: [] },
  { id: "b9", label: "9-bob. Bolalar stomatologiyasi", page: 280, pages: "26 bet", children: [] },
];

const SEED_MARKS: Mark[] = [
  { page: 45, label: "2.1. Kariyes tushunchasi" },
  { page: 52, label: "2.3. Klinik ko‘rinishi" },
  { page: 61, label: "2.5. Davolash usullari" },
];
const SEED_NOTES: Note[] = [{
  id: "n-saliva",
  page: 45,
  text: "Kariyes rivojlanishida so‘lakning himoya funksiyasi juda muhim. Buni klinik amaliyotda ham inobatga olish kerak.",
  at: "8 okt, 2026 14:20",
}];

const KARIYES = readerChapters.find((item) => item.id === "kariyes");

function labelFor(page: number) {
  const child = TREE.flatMap((item) => item.children).find((item) => item.page === page);
  if (child) return child.label;
  return TREE.find((item) => item.page === page)?.label ?? `${page}-bet`;
}

export function ReaderDesktop({ id }: { id: string }) {
  const router = useRouter();
  const [font, setFont] = useState(16);
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState(45);
  const [bookmarks, setBookmarks] = useState<Mark[]>(SEED_MARKS);
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<"marks" | "notes">("marks");
  const [searchOn, setSearchOn] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [writing, setWriting] = useState(false);
  const [open, setOpen] = useState("b2");

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage is only available after mount */
    try {
      const raw = window.localStorage.getItem(keyOf(id));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Store>;
        if (typeof parsed.font === "number") setFont(Math.min(FONT_MAX, Math.max(FONT_MIN, parsed.font)));
        if (parsed.dark === true) setDark(true);
        if (Array.isArray(parsed.bookmarks) && parsed.bookmarks.length) setBookmarks(parsed.bookmarks);
        if (Array.isArray(parsed.notes) && parsed.notes.length) setNotes(parsed.notes);
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

  const marked = bookmarks.some((item) => item.page === page);
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return readerChapters.flatMap((item) => item.blocks.flatMap((block) => {
      const text = block.type === "p" || block.type === "h2" ? block.text : "";
      return text.toLowerCase().includes(q) ? [{ page: item.page, text }] : [];
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
    setNotes((list) => [{ id: `n-${Date.now()}`, page, text, at: "16 okt, 2026" }, ...list]);
    setDraft("");
    setWriting(false);
    setTab("notes");
  }

  return (
    <div className={dark ? "rdx dark" : "rdx"} data-testid="reader-desktop" data-theme={dark ? "dark" : "light"}>
      <header className="rdx-top">
        <button type="button" aria-label="Orqaga" onClick={() => (window.history.length > 1 ? router.back() : router.push(`/kitoblar/${id}`))}>‹</button>
        <b>StomaHub</b>
        <div className="rdx-title"><strong>Stomatologiya klinik amaliyotda</strong><span>Dr. Azizbek Rahimov</span></div>
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
            <img src="/img/designs/atlas-cover.png" alt="" />
            <div><b>Stomatologiya klinik amaliyotda</b><small>Diagnostika, davolash va zamonaviy yondashuvlar</small><em>Dr. Azizbek Rahimov</em></div>
          </div>
          <h2>Mundarija</h2>
          {TREE.map((item) => (
            <div key={item.id}>
              <button type="button" className={open === item.id ? "rdx-ch on" : "rdx-ch"} onClick={() => { setOpen(item.id); go(item.page); }}>
                <span>{item.label}</span><small>{item.pages}</small>
              </button>
              {open === item.id ? item.children.map((child) => (
                <button key={child.id} type="button" className={page === child.page ? "rdx-sub on" : "rdx-sub"} data-testid={`toc-${child.id}`} onClick={() => go(child.page)}>
                  {child.label}{child.pages ? <small>{child.pages}</small> : null}
                </button>
              )) : null}
            </div>
          ))}
        </aside>
        <article className="rdx-read" style={{ fontSize: font }} data-testid="rd-content">
          {hits.length ? (
            <div data-testid="rd-hits">
              {hits.map((hit) => <button key={hit.text} type="button" onClick={() => go(hit.page)}>{hit.page}-bet · {hit.text.slice(0, 80)}</button>)}
            </div>
          ) : null}
          {page >= 45 && page < 72 && KARIYES ? (
            <>
              <p className="rdx-kicker">2-bob. Kariyes va uning davolash usullari</p>
              {KARIYES.blocks.map((block, index) => {
                if (block.type === "h2") return <h2 key={block.text}>{block.text}</h2>;
                if (block.type === "p") return <p key={index}>{block.text}</p>;
                if (block.type === "figure") return (
                  <figure key="fig">
                    <img src="/img/designs/caries-stages.png" alt="2.1-rasm. Kariyesning rivojlanish bosqichlari" />
                  </figure>
                );
                return (
                  <ol key="factors">
                    {block.items.map((item, factor) => <li key={item.title}><b>{factor + 1}. {item.title}</b><span>{item.text}</span></li>)}
                  </ol>
                );
              })}
            </>
          ) : (
            <>
              <h2>{labelFor(page)}</h2>
              <p>{page}-bet. Ushbu bo‘limda klinik yondashuv, diagnostika va davolash ketma-ketligi berilgan.</p>
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
              {bookmarks.map((item) => (
                <button key={item.page} type="button" className="rdx-mark" onClick={() => go(item.page)}>
                  <b>{item.label}</b><small>{item.page}-bet</small>
                </button>
              ))}
              <button type="button" className="rdx-add" data-testid="rd-add-mark" onClick={toggleMark}>+ Joriy sahifani xatcho‘pga qo‘shish</button>
            </>
          ) : (
            <>
              {notes.map((item) => (
                <article key={item.id} className="rdx-note"><b>{item.page}-bet · {labelFor(item.page)}</b><p>{item.text}</p><small>{item.at}</small></article>
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
        <button type="button" data-testid="rd-prev" onClick={() => go(page - 1)}>‹ Oldingi sahifa</button>
        <input type="range" min={1} max={READER_PAGES} value={page} aria-label="Sahifa" data-testid="rd-slider" onChange={(event) => go(Number(event.target.value))} />
        <span data-testid="rd-page">{page} / {READER_PAGES} bet</span>
        <button type="button" data-testid="rd-next" onClick={() => go(page + 1)}>Keyingi sahifa ›</button>
      </footer>
    </div>
  );
}
