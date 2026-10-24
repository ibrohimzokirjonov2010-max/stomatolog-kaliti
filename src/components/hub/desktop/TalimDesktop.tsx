"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpDown,
  BookOpen,
  ChevronDown,
  PlayCircle,
  Presentation,
  BadgeCheck,
  Clock3,
  Globe,
  MonitorPlay,
  Radio,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  directions,
  levels,
  type Course,
  type CourseFormat,
  type Direction,
  type Level,
} from "@/data/desktop-hub";
import { enrollCourse, fetchCourses, saveLessonDone, toContinue, toCourseCard, type LiveCourse } from "@/lib/live-content";
import "./hub.css";
import "./onlayn.css";

const sorts = [
  { id: "pop", label: "Eng ommabop" },
  { id: "new", label: "Yangi" },
  { id: "rate", label: "Reyting" },
  { id: "cheap", label: "Narxi: arzon" },
  { id: "rich", label: "Narxi: qimmat" },
];

function badgeOf(course: Course) {
  if (course.badge === "bepul") return { cls: "green", text: "Bepul" };
  if (course.badge === "off") return { cls: "red", text: course.offLabel ?? "−%" };
  if (course.badge === "cert") return { cls: "blue", text: "Sertifikatli" };
  if (course.badge === "yangi") return { cls: "green", text: "Yangi" };
  return null;
}

export function TalimDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [q, setQ] = useState(paramQ);
  const [direction, setDirection] = useState<"all" | Direction>("all");
  const [level, setLevel] = useState<"all" | Level>("all");
  const [format, setFormat] = useState<"all" | CourseFormat>("all");
  const [price, setPrice] = useState<"all" | "free" | "paid">("all");
  const [sort, setSort] = useState("pop");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [live, setLive] = useState<LiveCourse[]>([]);
  const [ready, setReady] = useState(false);
  const [player, setPlayer] = useState<Course | null>(null);
  const [seminars, setSeminars] = useState<{ id: string; title: string; date: string | null; city: string | null; image: string | null }[]>([]);
  const catalog = params.get("view") === "kurslar";

  useEffect(() => {
    setQ(paramQ);
  }, [paramQ]);

  useEffect(() => {
    let stop = false;
    void fetch("/api/seminars/catalog", { cache: "no-store" })
      .then(async (res) => (await res.json()) as { seminars?: { id?: string; title?: string | null; date?: string | null; city?: string | null; image?: string | null; status?: string }[] })
      .then((data) => {
        if (stop) return;
        const rows = (data.seminars ?? [])
          .filter((item) => item.id && item.title && (!item.status || item.status === "published"))
          .slice(0, 3)
          .map((item) => ({ id: String(item.id), title: String(item.title), date: item.date ?? null, city: item.city ?? null, image: item.image ?? null }));
        setSeminars(rows);
      })
      .catch(() => {
        if (!stop) setSeminars([]);
      });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    let stop = false;
    void fetchCourses().then((rows) => {
      if (stop) return;
      setLive(rows);
      setCourses(rows.map(toCourseCard));
      setProgress(Object.fromEntries(rows.filter((item) => item.enrolled).map((item) => [item.id, item.progress])));
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = courses.filter((course) => {
      if (direction !== "all" && course.direction !== direction) return false;
      if (level !== "all" && course.level !== level) return false;
      if (format !== "all" && course.format !== format) return false;
      if (price === "free" && course.price !== 0) return false;
      if (price === "paid" && course.price === 0) return false;
      if (!query) return true;
      return `${course.title} ${course.teacher} ${course.blurb}`.toLowerCase().includes(query);
    });
    list = [...list].sort((a, b) => {
      if (sort === "rate") return b.rating - a.rating;
      if (sort === "cheap") return a.price - b.price;
      if (sort === "rich") return b.price - a.price;
      if (sort === "new") return (b.badge === "yangi" ? 1 : 0) - (a.badge === "yangi" ? 1 : 0) || b.popularity - a.popularity;
      return b.popularity - a.popularity;
    });
    return list;
  }, [courses, q, direction, level, format, price, sort]);

  function play(course: Course) {
    setPlayer(course);
    void enrollCourse(course.id).then((next) => {
      if (!next) return;
      setLive((rows) => rows.map((item) => (item.id === next.id ? next : item)));
      setProgress((prev) => ({ ...prev, [next.id]: next.progress }));
    });
  }


  return (
    <ShopShell searchPath="/talim" cartCount={cartCount} placeholder="Stomatologga nima kerak?" showCamera={false}>
      <div className="odl" data-testid="talim-desktop">
        {catalog ? null : (
          <section className="odl-hub" data-testid="talim-hub">
            <div>
              <h1>Ta’lim</h1>
              <p>Bilimingizni oshiring. Stomatologiya sohasidagi eng so‘nggi bilimlar, amaliyotlar va tajribalar.</p>
            </div>
            <h2>Nega Ta’lim?</h2>
            <div className="odl-why">
              <Link href="/seminarlar"><Presentation className="i" /> <b>Seminarlar va kurslar</b><small>Amaliy va klinik yondashuv</small></Link>
              <Link href="/kitoblar"><BookOpen className="i" /> <b>Kitoblar</b><small>Klinik adabiyotlar</small></Link>
              <Link href="/foydali-kanallar"><Radio className="i" /> <b>Foydali kanallar</b><small>Telegram va YouTube</small></Link>
              <Link href="/mutaxassislar"><Users className="i" /> <b>Mutaxassislar</b><small>Yetakchi spikerlar</small></Link>
              <Link href="/sertifikatlar"><BadgeCheck className="i" /> <b>Sertifikat</b><small>Kurs yakunida</small></Link>
            </div>
            <div className="odl-split">
              <div className="odl-video">
                {courses[0] ? (
                  <button type="button" onClick={() => play(courses[0])}>
                    <img src={courses[0].image} alt="" />
                    <span><PlayCircle className="i" /> {courses[0].title}</span>
                  </button>
                ) : (
                  <div className="odl-video-empty"><PlayCircle className="i" /><b>{ready ? "Hozircha video dars yo‘q" : "Yuklanmoqda..."}</b></div>
                )}
              </div>
              <aside>
                <header><h2>Yaqinlashayotgan seminarlar</h2><Link href="/seminarlar">Barchasi</Link></header>
                {seminars.length === 0 ? <p className="odl-empty-inline">Hozircha e’lon qilingan seminar yo‘q.</p> : seminars.map((item) => (
                  <Link key={item.id} href={`/seminarlar/${item.id}`} className="odl-sem">
                    {item.image ? <img src={item.image} alt="" /> : <span className="ph" />}
                    <span><b>{item.title}</b><small>{[item.date, item.city].filter(Boolean).join(" · ") || "Sana ko‘rsatilmagan"}</small></span>
                  </Link>
                ))}
              </aside>
            </div>
            <header className="odl-kurs-hd"><h2>Kurslar</h2><Link href="/talim?view=kurslar">Barchasini ko‘rish</Link></header>
            {courses.length === 0 ? <p className="odl-empty-inline">{ready ? "Hozircha kurs yo‘q." : "Yuklanmoqda..."}</p> : (
              <div className="odl-row">
                {courses.slice(0, 4).map((course) => (
                  <article key={course.id} className="odl-card">
                    <button type="button" className="ph" onClick={() => play(course)} aria-label={course.title}><img src={course.image} alt="" /></button>
                    <div className="bd"><h3>{course.title}</h3><strong>{course.price === 0 ? "Bepul" : som(course.price)}</strong></div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
        {catalog ? <>
        <div className="odl-head">
          <div>
            <h1>Onlayn darslar</h1>
            <p>Stomatologiya bo‘yicha professional onlayn kurslar</p>
          </div>
          <div className="odl-badges">
            <span><i><MonitorPlay className="i" /></i><span><b>{courses.length} ta kurs</b><small>Professional darslar</small></span></span>
            <span><i><Users className="i" /></i><span><b>{new Set(courses.map((item) => item.teacher)).size} ta o‘qituvchi</b><small>Tajribali mutaxassislar</small></span></span>
            <span><i><BadgeCheck className="i" /></i><span><b>Sertifikat</b><small>Kurs yakunida</small></span></span>
          </div>
        </div>

        <div className="odl-tools">
          <label className="odl-search"><Search className="i" /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Kurs yoki o‘qituvchini qidiring..." aria-label="Kurs qidirish" /></label>
          <label className="odl-sel"><select aria-label="Mavzu" value={direction} onChange={(event) => setDirection(event.target.value as "all" | Direction)}>{directions.map((item) => <option key={item.id} value={item.id}>{item.id === "all" ? "Barcha mavzular" : item.label}</option>)}</select><ChevronDown className="i" /></label>
          <label className="odl-sel"><select aria-label="Daraja" value={level} onChange={(event) => setLevel(event.target.value as "all" | Level)}>{levels.map((item) => <option key={item.id} value={item.id}>{item.id === "all" ? "Barcha darajalar" : item.label}</option>)}</select><ChevronDown className="i" /></label>
          <label className="odl-sel"><select aria-label="Narx" value={price} onChange={(event) => setPrice(event.target.value as "all" | "free" | "paid")}><option value="all">Barcha narxlar</option><option value="free">Bepul</option><option value="paid">Pullik</option></select><ChevronDown className="i" /></label>
          <label className="odl-sel"><ArrowUpDown className="i lead" /><select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value)}>{sorts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronDown className="i" /></label>
        </div>

        <div className="odl-chips">
          {directions.map((item) => (
            <button key={item.id} type="button" className={direction === item.id ? "on" : undefined} onClick={() => setDirection(item.id)}>{item.label}</button>
          ))}
        </div>

        {live.some((item) => item.enrolled) ? (
          <section className="odl-cont">
            <h2>Davom ettirish</h2>
            <div>
              {live.filter((item) => item.enrolled).map(toContinue).map((item) => {
                const pct = progress[item.id] ?? item.progress;
                const course = courses.find((entry) => entry.id === item.id);
                if (!course) return null;
                return (
                  <button type="button" key={item.id} className="odl-contcard" onClick={() => play(course)}>
                    <img src={item.image} alt="" />
                    <span><b>{item.title}</b><small>{item.total} darsdan {item.seen} tasi ko‘rildi</small><i><u style={{ width: `${pct}%` }} /></i></span>
                    <em>{pct}%</em>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {shown.length === 0 ? (
          <div className="odl-empty">
            <b>{!ready ? "Yuklanmoqda..." : courses.length === 0 ? "Hozircha kurs yo‘q" : "Bu filtrda kurs yo‘q"}</b>
            {ready && courses.length ? <button type="button" onClick={() => { setDirection("all"); setLevel("all"); setFormat("all"); setPrice("all"); setQ(""); }}>Filtrlarni tozalash</button> : null}
          </div>
        ) : (
          <div className="odl-grid">
            {shown.map((course) => {
              const badge = badgeOf(course);
              return (
                <article className="odl-card" key={course.id} data-testid="course-card">
                  <button type="button" className="ph" onClick={() => play(course)} aria-label={course.title}>
                    <img src={course.image} alt="" />
                    {badge ? <span className={`tag ${badge.cls}`}>{badge.text}</span> : null}
                    <span className="dur"><Clock3 className="i" />{course.duration}</span>
                  </button>
                  <div className="bd">
                    <h3>{course.title}</h3>
                    <div className="who">
                      <span className="ava">{course.teacher.replace(/^Dr\.?\s*/i, "").slice(0, 1)}</span>
                      <span><b>{course.teacher}</b><small>{directions.find((item) => item.id === course.direction)?.label ?? course.role}</small></span>
                    </div>
                    <div className="meta">
                      {course.reviews > 0 ? <span><Star className="i star" />{course.rating.toFixed(1)} ({course.reviews})</span> : <span><MonitorPlay className="i" />{course.lessons} dars</span>}
                      <span><Globe className="i" />{course.lang}</span>
                    </div>
                    <div className="buy">
                      <strong>{course.price === 0 ? "Bepul" : som(course.price)}</strong>
                      <button type="button" className="go" data-testid="course-start" aria-label={course.price === 0 ? "Tomosha qilish" : "Kursni boshlash"} title={course.price === 0 ? "Tomosha qilish" : "Kursni boshlash"} onClick={() => play(course)}><PlayCircle className="i" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </> : null}
      </div>

      {player ? (
        <div className="hub-modal" role="presentation" onClick={() => setPlayer(null)}>
          <div className="hub-dialog hub-player" role="dialog" aria-labelledby="player-title" onClick={(event) => event.stopPropagation()}>
            <div className="hub-head">
              <h3 id="player-title">{player.title}</h3>
              <button type="button" onClick={() => setPlayer(null)} aria-label="Yopish">
                <X className="i" />
              </button>
            </div>
            <img src={player.image} alt="" />
            <p>
              {player.teacher} · {player.role}. Jarayon: {progress[player.id] ?? 0}%.
            </p>
            <div className="hub-bar">
              <i style={{ width: `${progress[player.id] ?? 0}%` }} />
            </div>
            <ul>
              {(live.find((item) => item.id === player.id)?.lessons ?? []).map((lesson) => (
                <li key={lesson.id}>
                  <button type="button" onClick={() => void saveLessonDone(player.id, lesson.id).then((next) => {
                    if (!next) return;
                    setLive((rows) => rows.map((item) => (item.id === next.id ? next : item)));
                    setProgress((prev) => ({ ...prev, [next.id]: next.progress }));
                  })}>
                    {lesson.done ? "✓ " : ""}{lesson.title}
                  </button>
                  {lesson.videoUrl ? <a href={lesson.videoUrl}>Video</a> : null}
                </li>
              ))}
            </ul>
            <div className="hub-actions">
              <button type="button" className="hub-btn" onClick={() => play(player)}>
                Yozilish
              </button>
              <button type="button" className="hub-btn ghost" onClick={() => setPlayer(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </ShopShell>
  );
}
