"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Award,
  BadgeCheck,
  Clock3,
  GraduationCap,
  LayoutGrid,
  List,
  MonitorSmartphone,
  Search,
  Send,
  Star,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  certificates,
  continueItems,
  courses,
  directions,
  formats,
  levels,
  whyLearn,
  type Course,
  type CourseFormat,
  type Direction,
  type Level,
} from "@/data/desktop-hub";
import "./hub.css";

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
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [player, setPlayer] = useState<Course | null>(null);
  const [certsOpen, setCertsOpen] = useState(false);
  const [chat, setChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [msgs, setMsgs] = useState<{ me?: boolean; text: string }[]>([
    { text: "Salom! Ta’lim bo‘yicha savolingizni yozing." },
  ]);

  useEffect(() => {
    setQ(paramQ);
  }, [paramQ]);

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
  }, [q, direction, level, format, price, sort]);

  function play(course: Course) {
    setPlayer(course);
    setProgress((prev) => ({ ...prev, [course.id]: Math.min(100, (prev[course.id] ?? 8) + 6) }));
  }

  function sendChat() {
    const text = draft.trim();
    if (!text) return;
    setMsgs((prev) => [...prev, { me: true, text }, { text: "Qabul qilindi. Mutaxassis tez orada javob yozadi." }]);
    setDraft("");
  }

  const sortLabel = sorts.find((item) => item.id === sort)?.label ?? "Eng ommabop";

  return (
    <ShopShell searchPath="/talim" cartCount={cartCount} placeholder="Stomatologga nima kerak?" showCamera={false}>
      <div className="hub-split">
        <div className="hub-page">
          <div className="hub-head">
            <div>
              <h1>Ta’lim</h1>
              <p>Bilimingizni oshiring. Klinik ko‘nikmalar, protokollar va sertifikatli kurslar.</p>
            </div>
            <label className="hub-q">
              <Search className="i" />
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Dars yoki kurs qidiring..." />
            </label>
          </div>

          <section>
            <h2 className="hub-h2">Davom ettirish</h2>
            <div className="hub-cont">
              {continueItems.map((item) => {
                const pct = progress[item.id] ?? item.progress;
                const course = courses.find((entry) => entry.id === item.id) ?? courses[0];
                return (
                  <article className="hub-ccard" key={item.id}>
                    <div className="ph">
                      <img src={item.image} alt="" />
                      <span className="hub-time">{item.time}</span>
                    </div>
                    <div className="bd">
                      <b>{item.title}</b>
                      <small>
                        {item.total} darsdan {item.seen} dars ko‘rildi
                      </small>
                      <div className="hub-bar">
                        <i style={{ width: `${pct}%` }} />
                      </div>
                      <div className="hub-foot">
                        <em>{pct}%</em>
                        <button type="button" className="hub-btn" onClick={() => play(course)}>
                          Davom ettirish →
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="hub-fblock">
            <div className="hub-frow">
              <span>Yo‘nalish:</span>
              {directions.map((item) => (
                <button key={item.id} type="button" className={direction === item.id ? "hub-chip on" : "hub-chip"} onClick={() => setDirection(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="hub-frow">
              <span>Daraja:</span>
              {levels.map((item) => (
                <button key={item.id} type="button" className={level === item.id ? "hub-chip on" : "hub-chip"} onClick={() => setLevel(item.id)}>
                  {item.label}
                </button>
              ))}
              <span>Format:</span>
              {formats.map((item) => (
                <button key={item.id} type="button" className={format === item.id ? "hub-chip on" : "hub-chip"} onClick={() => setFormat(item.id)}>
                  {item.label}
                </button>
              ))}
              <span>Narx:</span>
              {(
                [
                  ["all", "Barchasi"],
                  ["free", "Bepul"],
                  ["paid", "Pullik"],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" className={price === id ? "hub-chip on" : "hub-chip"} onClick={() => setPrice(id)}>
                  {label}
                </button>
              ))}
              <div className="hub-tools">
                <div className={sortOpen ? "dk-drop on" : "dk-drop"}>
                  <button type="button" onClick={() => setSortOpen((open) => !open)}>
                    Saralash: {sortLabel}
                  </button>
                  {sortOpen ? (
                    <div className="dk-pop">
                      {sorts.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={sort === item.id ? "hub-check on" : "hub-check"}
                          onClick={() => {
                            setSort(item.id);
                            setSortOpen(false);
                          }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="dk-view">
                  <button type="button" className={view === "grid" ? "on" : ""} onClick={() => setView("grid")} aria-label="Jadval">
                    <LayoutGrid className="i" />
                  </button>
                  <button type="button" className={view === "list" ? "on" : ""} onClick={() => setView("list")} aria-label="Ro‘yxat">
                    <List className="i" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="hub-sec-h">
            <h2>Barcha kurslar</h2>
            <span className="hub-count">{shown.length} ta kurs topildi</span>
          </div>
          {shown.length === 0 ? (
            <div className="hub-empty">
              Bu filtrda kurs yo‘q.
              <div>
                <button
                  type="button"
                  className="hub-btn"
                  onClick={() => {
                    setDirection("all");
                    setLevel("all");
                    setFormat("all");
                    setPrice("all");
                    setQ("");
                  }}
                >
                  Filtrlarni tozalash
                </button>
              </div>
            </div>
          ) : (
            <div className={view === "list" ? "hub-grid list" : "hub-grid"}>
              {shown.map((course) => {
                const badge = badgeOf(course);
                return (
                  <article className="hub-course" key={course.id}>
                    <div className="hub-photo">
                      <img src={course.image} alt="" />
                      {badge ? <span className={`hub-badge ${badge.cls}`}>{badge.text}</span> : null}
                      <span className="hub-time">{course.duration}</span>
                    </div>
                    <div className="bd">
                      <h3>{course.title}</h3>
                      <p className="blurb">{course.blurb}</p>
                      <div className="hub-who">
                        <img src={course.avatar} alt="" />
                        <div>
                          <b>{course.teacher}</b>
                          <small>{course.role}</small>
                        </div>
                      </div>
                      <div className="hub-meta">
                        <Star className="i" />
                        <span>
                          {course.rating.toFixed(1)} ({course.reviews} ta sharh)
                        </span>
                        <span>{course.lessons} dars</span>
                        <span>{course.hours} soat</span>
                        <span>{course.lang}</span>
                      </div>
                      <div className="hub-price">
                        <strong>{course.price === 0 ? "Bepul" : som(course.price)}</strong>
                        {course.oldPrice ? <s>{som(course.oldPrice)}</s> : null}
                      </div>
                      <button type="button" className="hub-btn" onClick={() => play(course)}>
                        {course.price === 0 ? "Tomosha qilish" : "Kursni boshlash"} →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="hub-rail">
          <section className="hub-box">
            <h3>
              Mening sertifikatlarim
              <button type="button" onClick={() => setCertsOpen((open) => !open)}>
                {certsOpen ? "Yig‘ish" : "Barchasini ko‘rish"}
              </button>
            </h3>
            {certificates.map((item) => (
              <div className="hub-cert" key={item.id}>
                <span className="ic">
                  <Award className="i" />
                </span>
                <div>
                  <b>{item.title}</b>
                  <small>
                    {item.meta}
                    {certsOpen ? ` · ${item.date}` : ""}
                  </small>
                  {!certsOpen ? <small>{item.date}</small> : null}
                </div>
              </div>
            ))}
          </section>
          <section className="hub-box">
            <h3>Mening natijalarim</h3>
            <div className="hub-stats">
              <div className="hub-stat">
                <span className="ic">
                  <Clock3 className="i" />
                </span>
                <div>
                  <b>42</b>
                  <small>Ko‘rilgan soat</small>
                </div>
              </div>
              <div className="hub-stat">
                <span className="ic">
                  <GraduationCap className="i" />
                </span>
                <div>
                  <b>6</b>
                  <small>Tugatilgan kurslar</small>
                </div>
              </div>
              <div className="hub-stat">
                <span className="ic">
                  <Award className="i" />
                </span>
                <div>
                  <b>3</b>
                  <small>Sertifikat</small>
                </div>
              </div>
              <div className="hub-stat">
                <span className="ic">
                  <Users className="i" />
                </span>
                <div>
                  <b>1</b>
                  <small>Joriy kurs</small>
                </div>
              </div>
            </div>
          </section>
          <section className="hub-box">
            <h3>Nega Ta’lim?</h3>
            {whyLearn.map((item) => (
              <div className="hub-why" key={item.title}>
                <span className="ic">
                  {item.title.startsWith("Amaliy") ? <Stethoscope className="i" /> : item.title.startsWith("Yetakchi") ? <Users className="i" /> : item.title.startsWith("Sertifikat") ? <BadgeCheck className="i" /> : <MonitorSmartphone className="i" />}
                </span>
                <div>
                  <b>{item.title}</b>
                  <small>{item.text}</small>
                </div>
              </div>
            ))}
          </section>
          <section className="hub-box hub-chatcard">
            <div>
              <b>Savollaringiz bormi?</b>
              <p>Ta’lim bo‘yicha yordam berishga tayyormiz</p>
              <button type="button" className="hub-btn" onClick={() => setChat(true)}>
                Online chat
              </button>
            </div>
            <img src="/img/hub/chat.jpg" alt="" />
          </section>
        </aside>
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
              {player.teacher} · {player.role}. Jarayon: {progress[player.id] ?? 8}%.
            </p>
            <div className="hub-bar">
              <i style={{ width: `${progress[player.id] ?? 8}%` }} />
            </div>
            <div className="hub-actions">
              <button type="button" className="hub-btn" onClick={() => setProgress((prev) => ({ ...prev, [player.id]: Math.min(100, (prev[player.id] ?? 8) + 10) }))}>
                Davom ettirish
              </button>
              <button type="button" className="hub-btn ghost" onClick={() => setPlayer(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {chat ? (
        <div className="dk-chat" role="dialog" aria-label="Online chat">
          <header>
            Online chat
            <button type="button" onClick={() => setChat(false)} aria-label="Yopish">
              <X className="i" />
            </button>
          </header>
          <div className="log">
            {msgs.map((msg, index) => (
              <div className={msg.me ? "msg me" : "msg"} key={index}>
                {msg.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendChat();
            }}
          >
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Xabar yozing..." />
            <button type="submit" aria-label="Yuborish">
              <Send className="i" />
            </button>
          </form>
        </div>
      ) : null}
    </ShopShell>
  );
}
