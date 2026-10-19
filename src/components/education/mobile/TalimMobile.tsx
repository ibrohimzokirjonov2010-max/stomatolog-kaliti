"use client";
/* eslint-disable @next/next/no-img-element -- lesson photos are sized by the fluid unit */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Eye, LayoutGrid, MoreVertical, Play, Search, SlidersHorizontal } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { readLessonProgress } from "@/lib/lesson-progress";
import {
  continueLesson,
  lessonSorts,
  lessonTopics,
  mobileLessons,
  type LessonSort,
  type LessonTopic,
  type MobileLesson,
} from "@/data/mobile-lessons";
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
  const favorites = useFavorites();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [paid, setPaid] = useState<MobileLesson | null>(null);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<"all" | LessonTopic>("all");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState<LessonSort>("yangi");
  const [filters, setFilters] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    setProgress(readLessonProgress());
  }, []);

  /** "Davom ettirish" shows only a lesson the user really started on this device. */
  const resume = useMemo(() => {
    const started = [continueLesson, ...mobileLessons].filter((item) => (progress[item.id] ?? 0) > 0 && (progress[item.id] ?? 0) < 100);
    return started.sort((a, b) => (progress[b.id] ?? 0) - (progress[a.id] ?? 0))[0] ?? null;
  }, [progress]);

  function open(item: MobileLesson) {
    if (item.price > 0) {
      setPaid(item);
      return;
    }
    router.push(`/talim/${item.id}/video`);
  }

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
  }, [level, query, sort, topic]);

  const showContinue = Boolean(resume) && (topic === "all" || topic === resume?.topic);

  async function share(item: MobileLesson) {
    const url = `${window.location.origin}/talim/${item.id}/video`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* the note still confirms the action */
      }
    }
    setNote("Havola nusxalandi");
  }

  return (
    <div className="tl lg:hidden" data-testid="mobile-talim">
      <div className="tl-body">
        <MobileBrandBar search />
        <h1 className="tl-title">Ta’lim</h1>
        <p className="tl-sub">Stomatologlar uchun video darslar kutubxonasi</p>

        <form className="tl-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input
            data-talim-search
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Dars, mavzu yoki muallifni qidiring..."
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

        {showContinue && resume ? (
          <article className="tl-go" data-testid="tl-continue">
            <Thumb lesson={resume} onPlay={() => router.push(`/talim/${resume.id}/video`)} />
            <div>
              <p className="tl-kicker">Davom ettirish</p>
              <h3>{resume.title}</h3>
              <p className="tl-prog">
                <i>
                  <span style={{ width: `${progress[resume.id]}%` }} />
                </i>
                {progress[resume.id]}%
              </p>
              <button type="button" className="tl-resume" onClick={() => router.push(`/talim/${resume.id}/video`)}>
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

        {note ? <p className="tl-note">{note}</p> : null}
        {list.length === 0 ? <p className="tl-note">Mos dars topilmadi</p> : null}

        {list.map((item) => (
          <article key={item.id} className="tl-row" id={item.id} data-testid="tl-row">
            <Thumb lesson={item} onPlay={() => open(item)} />
            <div className="tl-main">
              <button type="button" className="tl-kebab" aria-label="Yana" aria-expanded={menu === item.id} onClick={() => setMenu((current) => (current === item.id ? null : item.id))}>
                <MoreVertical />
              </button>
              {menu === item.id ? (
                <div className="tl-menu">
                  <button
                    type="button"
                    onClick={() => {
                      favorites.toggle(`lesson-${item.id}`);
                      setMenu(null);
                    }}
                  >
                    {favorites.has(`lesson-${item.id}`) ? "Saqlangan" : "Saqlash"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(null);
                      void share(item);
                    }}
                  >
                    Ulashish
                  </button>
                </div>
              ) : null}
              <h3><button type="button" className="tl-open" onClick={() => open(item)}>{item.title}</button></h3>
              <p className="tl-author">
                <img src={item.avatar} alt="" />
                {item.author}
              </p>
              <div className="tl-chips">
                <span>{item.topicLabel}</span>
                <span className={item.level === "boshlangich" ? "start" : undefined}>{item.levelLabel}</span>
              </div>
              <div className="tl-foot">
                <p>
                  <Eye /> {item.viewsLabel}
                </p>
                <p>
                  <BookOpen /> {item.lessons} dars
                </p>
                <span className={item.price === 0 ? "tl-price free" : "tl-price"}>{item.price === 0 ? "Bepul" : formatMoney(item.price, "UZS")}</span>
              </div>
            </div>
          </article>
        ))}
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
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => { setLevel(""); setFilters(false); }}>
                Tozalash
              </button>
              <button type="submit" className="go">
                Ko‘rish
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {paid ? (
        <div className="mb-sheet" role="dialog" aria-label="Pullik dars" data-testid="tl-paid">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setPaid(null)} />
          <div className="mb-panel">
            <h3>{paid.title}</h3>
            <p>
              Bu pullik dars ({formatMoney(paid.price, "UZS")}). Darslarni sotish hozircha ulanmagan — to‘lov olinmaydi. Birinchi qismini namuna sifatida ko‘rishingiz mumkin.
            </p>
            <div className="row">
              <button type="button" onClick={() => setPaid(null)}>
                Yopish
              </button>
              <Link className="go" href={`/talim/${paid.id}/video`}>
                <Play /> Namunani ko‘rish
              </Link>
            </div>
          </div>
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
      <span className="tl-time">{lesson.duration}</span>
    </button>
  );
}
