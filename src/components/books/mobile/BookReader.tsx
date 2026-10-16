"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ChevronDown, ChevronLeft, List, Moon } from "lucide-react";
import { READER_PAGES, readerChapters, type ReaderChapter } from "@/data/reader-book";
import "./book-reader.css";

type Prefs = { font: number; dark: boolean; bookmark: number | null };

const FONT_MIN = 14;
const FONT_MAX = 22;
const START_PAGE = 45;

function storageKey(id: string) {
  return `sk-reader-${id}`;
}

function readPrefs(id: string): Prefs {
  const fallback = { font: 16, dark: false, bookmark: START_PAGE };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      font: typeof parsed.font === "number" ? Math.min(FONT_MAX, Math.max(FONT_MIN, parsed.font)) : fallback.font,
      dark: parsed.dark === true,
      bookmark: typeof parsed.bookmark === "number" ? parsed.bookmark : parsed.bookmark === null ? null : fallback.bookmark,
    };
  } catch {
    return fallback;
  }
}

export function BookReader({ id, title, author }: { id: string; title: string; author: string }) {
  const router = useRouter();
  const scroller = useRef<HTMLDivElement>(null);
  const jump = useRef(false);
  const [font, setFont] = useState(16);
  const [dark, setDark] = useState(false);
  const [bookmark, setBookmark] = useState<number | null>(START_PAGE);
  const [page, setPage] = useState(START_PAGE);
  const [toc, setToc] = useState(false);
  const [ready, setReady] = useState(false);
  const chapter = readerChapters.reduce((best, item) => (item.page <= page ? item : best), readerChapters[0]);

  useEffect(() => {
    const prefs = readPrefs(id);
    setFont(prefs.font);
    setDark(prefs.dark);
    setBookmark(prefs.bookmark);
    setReady(true);
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey(id), JSON.stringify({ font, dark, bookmark }));
  }, [bookmark, dark, font, id, ready]);

  useEffect(() => {
    if (!ready) return;
    const target = bookmark && bookmark > 1 ? bookmark : START_PAGE;
    goTo(target);
    // Initial placement only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  function rows() {
    const root = scroller.current;
    if (!root) return [];
    return readerChapters.map((item, index) => {
      const el = root.querySelector<HTMLElement>(`[data-chapter="${item.id}"]`);
      const next = readerChapters[index + 1]
        ? root.querySelector<HTMLElement>(`[data-chapter="${readerChapters[index + 1].id}"]`)
        : null;
      return {
        ...item,
        top: el?.offsetTop ?? 0,
        bottom: next?.offsetTop ?? root.scrollHeight,
      };
    });
  }

  function goTo(nextPage: number) {
    const root = scroller.current;
    const list = rows();
    if (!root || !list.length) return;
    const pageNo = Math.min(READER_PAGES, Math.max(1, nextPage));
    const index = Math.max(0, list.findIndex((item, i) => pageNo >= item.page && pageNo < (list[i + 1]?.page ?? READER_PAGES + 1)));
    const row = list[index] ?? list[0];
    const next = list[index + 1]?.page ?? READER_PAGES;
    const span = Math.max(1, next - row.page);
    const ratio = (pageNo - row.page) / span;
    jump.current = true;
    root.scrollTop = row.top + ratio * Math.max(0, row.bottom - row.top);
    setPage(pageNo);
    window.setTimeout(() => {
      jump.current = false;
    }, 40);
  }

  function onScroll() {
    if (jump.current) return;
    const root = scroller.current;
    const list = rows();
    if (!root || !list.length) return;
    const y = root.scrollTop + 2;
    let index = 0;
    list.forEach((item, i) => {
      if (y >= item.top) index = i;
    });
    const row = list[index];
    const next = list[index + 1]?.page ?? READER_PAGES;
    const span = Math.max(1, row.bottom - row.top);
    const ratio = Math.min(1, Math.max(0, (y - row.top) / span));
    setPage(Math.min(READER_PAGES, Math.max(1, Math.round(row.page + ratio * (next - row.page)))));
  }

  function toggleBookmark() {
    setBookmark((current) => (current === page ? null : page));
  }

  const marked = bookmark === page;
  const percent = `${((page - 1) / (READER_PAGES - 1)) * 100}%`;

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
          <b>{title}</b>
          <span>{author}</span>
        </div>
        <button type="button" className={marked ? "rd-mark on" : "rd-mark"} aria-label="Xatcho‘p" aria-pressed={marked} onClick={toggleBookmark}>
          <Bookmark fill={marked ? "currentColor" : "none"} />
        </button>
      </header>

      <button type="button" className="rd-chap" data-testid="rd-chapter" onClick={() => setToc(true)}>
        <i><List /></i>
        <span>
          <b>{chapter.label}</b>
          <span>{chapter.summary}</span>
        </span>
        <ChevronDown className="chev" />
      </button>

      <div className="rd-scroll" ref={scroller} onScroll={onScroll} style={{ fontSize: font }}>
        {readerChapters.map((item) => (
          <section key={item.id} data-chapter={item.id}>
            <ChapterBody chapter={item} />
          </section>
        ))}
      </div>

      <footer className="rd-bar">
        <div className="rd-range">
          <input
            type="range"
            min={1}
            max={READER_PAGES}
            value={page}
            aria-label="Sahifa"
            data-testid="rd-slider"
            style={{ ["--p" as string]: percent }}
            onChange={(event) => goTo(Number(event.target.value))}
          />
          <span data-testid="rd-page">{page} / {READER_PAGES} bet</span>
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
          <button type="button" className={marked ? "on" : undefined} data-testid="rd-bookmark" aria-pressed={marked} onClick={toggleBookmark}>
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
            {readerChapters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === chapter.id ? "ch on" : "ch"}
                onClick={() => {
                  goTo(item.page);
                  setToc(false);
                }}
              >
                <b>{item.label}</b>
                <span>{item.page}-bet</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChapterBody({ chapter }: { chapter: ReaderChapter }) {
  return (
    <>
      {chapter.blocks.map((block, index) => {
        if (block.type === "h2") return <h2 key={index}>{block.text}</h2>;
        if (block.type === "p") return <p key={index}>{block.text}</p>;
        if (block.type === "figure") return <CariesFigure key={index} />;
        return (
          <div key={index}>
            {block.items.map((item, i) => (
              <div key={item.title} className="rd-factor">
                <i>{i + 1}</i>
                <div>
                  <b>{item.title}</b>
                  <span>{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function CariesFigure() {
  const teeth = [
    { x: 18, label: "Sog‘lom tish", hole: 0 },
    { x: 172, label: "Emal kariyesi", hole: 1 },
    { x: 326, label: "Dentin kariyesi", hole: 2 },
    { x: 480, label: "Pulpa yaqin kariyes", hole: 3 },
  ];
  return (
    <figure className="rd-fig">
      <svg viewBox="0 0 640 230" role="img" aria-label="Kariyes bosqichlari">
        <rect width="640" height="230" fill="#fff" />
        <path d="M10 168 C 80 150, 160 176, 240 160 C 320 146, 420 178, 520 158 C 570 150, 610 156, 630 164 L 630 210 L 10 210 Z" fill="#f3b7b0" />
        <path d="M10 168 C 80 150, 160 176, 240 160 C 320 146, 420 178, 520 158 C 570 150, 610 156, 630 164" fill="none" stroke="#e59b96" strokeWidth="3" />
        {teeth.map((tooth) => (
          <g key={tooth.label}>
            <path d={`M${tooth.x + 18} 150 Q ${tooth.x + 8} 70 ${tooth.x + 36} 48 Q ${tooth.x + 62} 28 ${tooth.x + 86} 52 Q ${tooth.x + 112} 74 ${tooth.x + 100} 150 Q ${tooth.x + 92} 176 ${tooth.x + 70} 168 Q ${tooth.x + 48} 178 ${tooth.x + 28} 164 Z`} fill="#f7f4ef" stroke="#e4ddd2" />
            <path d={`M${tooth.x + 34} 78 Q ${tooth.x + 58} 62 ${tooth.x + 82} 82 L ${tooth.x + 74} 142 Q ${tooth.x + 58} 150 ${tooth.x + 42} 138 Z`} fill="#f3e2b8" />
            <path d={`M${tooth.x + 52} 108 Q ${tooth.x + 58} 100 ${tooth.x + 66} 110 L ${tooth.x + 62} 138 Q ${tooth.x + 56} 144 ${tooth.x + 50} 134 Z`} fill="#e06a62" />
            {tooth.hole > 0 ? <path d={`M${tooth.x + 48} 58 Q ${tooth.x + 62} ${40 + tooth.hole * 8} ${tooth.x + 78} 64 Q ${tooth.x + 70} ${78 + tooth.hole * 16} ${tooth.x + 52} ${70 + tooth.hole * 14} Z`} fill={tooth.hole > 2 ? "#6b3a2a" : "#8a5a32"} /> : null}
            {tooth.hole > 1 ? <path d={`M${tooth.x + 56} 86 Q ${tooth.x + 66} ${90 + tooth.hole * 8} ${tooth.x + 60} ${110 + tooth.hole * 6}`} fill="none" stroke="#5c331c" strokeWidth="3" /> : null}
            <text x={tooth.x + 58} y="224" textAnchor="middle" fill="#6a7c93" fontSize="13" fontFamily="sans-serif">{tooth.label}</text>
          </g>
        ))}
      </svg>
      <figcaption>2.1-rasm. Kariyesning rivojlanish bosqichlari</figcaption>
    </figure>
  );
}
