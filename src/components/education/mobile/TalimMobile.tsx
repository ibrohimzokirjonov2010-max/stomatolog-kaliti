"use client";
/* eslint-disable @next/next/no-img-element -- lesson photos are sized by the fluid unit */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, Bookmark, LayoutGrid, Play, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import {
  lessonSorts,
  lessonTopics,
  type LessonSort,
  type LessonTopic,
  type MobileLesson,
} from "@/data/mobile-lessons";
import { fetchCourses, toMobileLesson } from "@/lib/live-content";
import { formatMoney } from "@/lib/format";
import "./talim-mobile.css";

function Tooth() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
    </svg>
  );
}

export function TalimMobile() {
  const router = useRouter();
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<"all" | LessonTopic>("all");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState<LessonSort>("yangi");
  const [filters, setFilters] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [mobileLessons, setMobileLessons] = useState<MobileLesson[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let stop = false;
    void fetchCourses().then((rows) => {
      if (stop) return;
      setMobileLessons(rows.map(toMobileLesson));
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);
  const continueLesson = mobileLessons.find((item) => item.progress != null) ?? null;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = mobileLessons.filter((item) => {
      if (topic !== "all" && item.topic !== topic) return false;
      if (level && item.level !== level) return false;
      if (!q) return true;
      return `${item.title} ${item.author} ${item.topicLabel}`.toLowerCase().includes(q);
    });
    if (sort === "ommabop") rows.sort((a, b) => b.views - a.views);
    if (sort === "narx") rows.sort((a, b) => a.price - b.price);
    return rows;
  }, [level, mobileLessons, query, sort, topic]);

  const showContinue = Boolean(
    continueLesson &&
    (topic === "all" || topic === continueLesson.topic) &&
    (!level || continueLesson.level === level) &&
    (!query.trim() || `${continueLesson.title} ${continueLesson.author} ${continueLesson.topicLabel}`.toLowerCase().includes(query.trim().toLowerCase())),
  );

  return (
    <div className="tl lg:hidden" data-testid="mobile-talim">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">
          STOMA<span>HUB</span>
        </Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-talim-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>

      <div className="tl-body">
        <h1 className="tl-title">Onlayn darslar</h1>
        <p className="tl-sub">Bilimingizni oshiring va amaliy ko‘nikmalarni rivojlantiring</p>

        <form className="tl-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input
            data-talim-search
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kurs, ma’ruzachi yoki mavzu bo‘yicha qidirish..."
            aria-label="Qidiruv"
          />
          <button type="button" className="tl-filter" aria-label="Filtr" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </button>
        </form>

        <div className="tl-cats" aria-label="Mavzular">
          {lessonTopics.map((item) => (
            <button key={item.id} type="button" className={topic === item.id ? "on" : undefined} onClick={() => setTopic(item.id)}>
              {item.id === "all" ? <LayoutGrid /> : <Tooth />}
              {item.label}
            </button>
          ))}
        </div>

        {showContinue && continueLesson ? (
          <article className="tl-go">
            <Thumb lesson={continueLesson} onPlay={() => router.push(`/talim/${continueLesson.id}/video`)} />
            <div>
              <p className="tl-kicker">Davom ettirish</p>
              <h3>{continueLesson.title}</h3>
              <p className="tl-prog">
                <i>
                  <span style={{ width: `${continueLesson.progress}%` }} />
                </i>
                {continueLesson.progress}%
              </p>
              <button type="button" className="tl-resume" onClick={() => router.push(`/talim/${continueLesson.id}/video`)}>
                <Play fill="currentColor" /> Davom ettirish
              </button>
            </div>
          </article>
        ) : null}

        <div className="tl-head">
          <h2>Barcha darslar</h2>
          <label className="tl-sort">
            Saralash:
            <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as LessonSort)}>
              {lessonSorts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {list.length === 0 ? <p className="tl-note">{!ready ? "Yuklanmoqda..." : mobileLessons.length === 0 ? "Hozircha kurs yo‘q" : "Mos dars topilmadi"}</p> : null}

        {list.map((item) => {
          const started = item.progress != null;
          return (
            <article key={item.id} className="tl-card" id={item.id}>
              <button type="button" className="tl-cover" aria-label={`${item.title} ni ko‘rish`} onClick={() => router.push(`/talim/${item.id}/video`)}>
                <img src={item.image} alt="" />
                <span className="tl-topic">{item.topicLabel}</span>
                <span className="tl-count"><Play fill="currentColor" /> {item.lessons} dars</span>
              </button>
              <div className="tl-info">
                <button type="button" className={saved.includes(item.id) ? "tl-save on" : "tl-save"} aria-label="Saqlash" aria-pressed={saved.includes(item.id)} onClick={() => setSaved((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))}>
                  <Bookmark />
                </button>
                <h3>{item.title}</h3>
                {item.blurb ? <p className="tl-blurb">{item.blurb}</p> : null}
                <p className="tl-author">
                  <img src={item.avatar} alt="" />
                  <span><b>{item.author}</b></span>
                </p>
                <p className="tl-meta">
                  <span><BookOpen /> {item.lessons} ta dars</span>
                  <span><BarChart3 /> {item.levelLabel}</span>
                  {started ? <span className="tl-done">{item.progress}%</span> : null}
                </p>
                <div className="tl-buy">
                  <b className={item.price === 0 ? "free" : undefined}>{item.price === 0 ? "Bepul" : formatMoney(item.price, "UZS")}</b>
                  <button type="button" onClick={() => router.push(`/talim/${item.id}/video`)}>{started ? "Davom ettirish" : "Kursni boshlash"}</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filters ? (
        <div className="tl-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form
            className="tl-box"
            onSubmit={(event) => {
              event.preventDefault();
              setFilters(false);
            }}
          >
            <h3>Filtr</h3>
            <select aria-label="Daraja" value={level} onChange={(event) => setLevel(event.target.value)}>
              <option value="">Barcha darajalar</option>
              <option value="boshlangich">Boshlang‘ich</option>
              <option value="orta">O‘rta daraja</option>
            </select>
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#111827" }} onClick={() => { setLevel(""); setFilters(false); }}>
                Tozalash
              </button>
              <button type="submit" className="go">
                Ko‘rish
              </button>
            </div>
          </form>
        </div>
      ) : null}

    </div>
  );
}

function Thumb({ lesson, onPlay }: { lesson: MobileLesson; onPlay: () => void }) {
  return (
    <button type="button" className="tl-ph" aria-label={`${lesson.title} ni ko‘rish`} onClick={onPlay}>
      <img src={lesson.image} alt="" />
      <span className="tl-play">
        <Play fill="currentColor" />
      </span>
    </button>
  );
}
