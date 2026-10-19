"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Globe,
  Heart,
  MapPin,
  MonitorPlay,
  Share2,
  Star,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { RegistrationSection } from "@/components/seminar-register";
import {
  getSeminar,
  getSeminarSpeakers,
  isDateTbd,
  isSeminarUpcoming,
  seminarHref,
  seminarWhen,
  seminars as catalog,
  specialtyLabels,
  type Seminar,
} from "@/data/seminars";
import { som, useShopLines } from "@/components/shop/desktop/shop-cart";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { dateParts, durationLabel, initials } from "./SeminarsDesktop";
import "./seminars-desktop.css";

/** iCalendar file for the seminar (local Tashkent time, floating). */
function icsFor(s: Seminar) {
  const day = (iso: string) => iso.replace(/-/g, "");
  const clock = (t: string) => `${t.replace(":", "")}00`;
  const esc = (v: string) => v.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  const where = s.city === "Online" ? "Onlayn" : `${s.venue}, ${s.city}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StomaHub//Seminarlar//UZ",
    "BEGIN:VEVENT",
    `UID:${s.id}@stomahub`,
    `DTSTART:${day(s.date)}T${clock(s.time)}`,
    `DTEND:${day(s.dateEnd ?? s.date)}T${clock(s.timeEnd)}`,
    `SUMMARY:${esc(s.title)}`,
    `LOCATION:${esc(where)}`,
    `DESCRIPTION:${esc(`${s.description ?? ""}\n${typeof location !== "undefined" ? location.href : ""}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function SeminarPageDesktop({ id }: { id: string }) {
  const params = useSearchParams();
  const { catalogVersion, ready, liveSeminar, seatsLeft, activeReg } = useSeminarRegs();
  const favorites = useFavorites();
  const lines = useShopLines();
  const [regOpen, setRegOpen] = useState(false);
  const [day, setDay] = useState(0);
  const [shared, setShared] = useState(false);
  const cartCount = lines.reduce((sum, line) => sum + line.qty, 0);

  const base = useMemo(() => {
    void catalogVersion;
    return getSeminar(id);
  }, [catalogVersion, id]);

  // "?royxat=1" (from the list's "Ro‘yxatdan o‘tish") opens the form once, on arrival.
  const wantsReg = params.get("royxat") === "1";
  useEffect(() => {
    if (wantsReg) setRegOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on first arrival
  }, []);

  function closeReg() {
    setRegOpen(false);
    if (new URLSearchParams(location.search).has("royxat")) history.replaceState(history.state, "", location.pathname);
  }

  useEffect(() => {
    if (!regOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeReg();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [regOpen]);

  const similar = useMemo(() => {
    void catalogVersion;
    if (!base) return [];
    const up = catalog.filter((s) => s.id !== base.id && isSeminarUpcoming(s));
    return [...up.filter((s) => s.specialty === base.specialty), ...up.filter((s) => s.specialty !== base.specialty)].slice(0, 3);
  }, [base, catalogVersion]);

  if (!base) {
    return (
      <ShopShell searchPath="/seminarlar" cartCount={cartCount}>
        {ready ? (
          <div className="sm-empty sm-missing" data-testid="seminar-missing">
            <CalendarDays className="big" />
            <b>Seminar topilmadi</b>
            <p>Seminar o‘chirilgan yoki hali e’lon qilinmagan.</p>
            <div className="acts">
              <Link href="/seminarlar">Seminarlar ro‘yxati</Link>
            </div>
          </div>
        ) : (
          <div className="smd-skel" aria-busy="true" />
        )}
      </ShopShell>
    );
  }

  const s = liveSeminar(base);
  const left = seatsLeft(s);
  const mine = activeReg(s.id);
  const upcoming = isSeminarUpcoming(s);
  const tbd = isDateTbd(s);
  const online = s.city === "Online";
  const speakers = getSeminarSpeakers(s);
  const saved = favorites.has(`seminar:${s.id}`);
  const p = tbd ? null : dateParts(s.date);
  const discount = s.oldPrice && s.oldPrice > s.price ? Math.round((1 - s.price / s.oldPrice) * 100) : 0;
  const total = Math.max(1, s.seatsTotal);
  const pct = Math.min(100, Math.round(((total - left) / total) * 100));
  const full = left <= 0 && !s.seatsTbd;
  const days = s.programDays ?? [];
  const activeDay = days[Math.min(day, Math.max(0, days.length - 1))];
  const schedule = activeDay ? activeDay.schedule : s.program ?? [];
  const learnings = activeDay ? [] : s.learnings ?? [];
  const mapHref = online ? "" : `https://yandex.uz/maps/?text=${encodeURIComponent(`${s.venue}, ${s.city}`)}`;
  const seatsText = s.seatsTbd ? "Joylar soni cheklangan" : full ? "Joy qolmadi" : `${left} ta o‘rin qoldi`;

  function downloadIcs() {
    const blob = new Blob([icsFor(s)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    const url = location.href.split("?")[0];
    try {
      if (navigator.share) await navigator.share({ title: s.title, url });
      else await navigator.clipboard.writeText(url);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      /* cancelled */
    }
  }

  return (
    <ShopShell searchPath="/seminarlar" cartCount={cartCount} placeholder="Stomatologga nima kerak?">
      <div className="smd" data-testid="seminar-page">
        <div className="smd-main">
          <nav className="smd-crumbs" aria-label="Breadcrumb">
            <Link href="/seminarlar">Seminarlar</Link>
            <span>/</span>
            <span>{specialtyLabels[s.specialty]}</span>
            <span>/</span>
            <b>{s.title}</b>
          </nav>

          <div className="smd-title-row">
            <div>
              <span className={`sm-tag ${s.specialty}`}>{specialtyLabels[s.specialty]}</span>
              {s.badge ? <span className="sm-tag plain">{s.badge}</span> : null}
              <h1>{s.title}</h1>
              {s.description ? <p className="smd-lead">{s.description}</p> : null}
            </div>
            <div className="smd-tools">
              <button type="button" className={saved ? "on" : ""} aria-pressed={saved} aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlab qo‘yish"} onClick={() => favorites.toggle(`seminar:${s.id}`)}>
                <Heart className="i" />
              </button>
              <button type="button" aria-label="Ulashish" onClick={share}>
                <Share2 className="i" />
              </button>
              {shared ? <span className="smd-toast">Havola nusxalandi</span> : null}
            </div>
          </div>

          <div className="smd-facts">
            <div>
              <CalendarDays className="ic" />
              <span>
                <b>{seminarWhen(s)}</b>
                <small>{p ? `${p.weekday}, ${s.time} – ${s.timeEnd}` : "Sana tez orada e’lon qilinadi"}</small>
              </span>
            </div>
            <div>
              <MapPin className="ic" />
              <span>
                <b>{online ? "Onlayn" : s.city}</b>
                <small>{online ? "Havola yozilgandan keyin yuboriladi" : s.venue}</small>
              </span>
            </div>
            <div>
              <MonitorPlay className="ic" />
              <span>
                <b>{online ? "Onlayn" : "Oflayn"}</b>
                <small>{online ? "Jonli efirda qatnashish" : "Zalda qatnashish"}</small>
              </span>
            </div>
            <div>
              <Clock3 className="ic" />
              <span>
                <b>{durationLabel(s) || "—"}</b>
                <small>{s.organizer ? `Tashkilotchi: ${s.organizer}` : "Davomiyligi"}</small>
              </span>
            </div>
          </div>

          <div className="smd-hero">
            <img className="bg" src={s.image} alt="" aria-hidden />
            <img className="fg" src={s.image} alt={s.title} />
          </div>

          <div className="smd-grid">
            <section className="smd-card smd-about">
              <h2>Seminar haqida</h2>
              <p className="smd-text">{s.description || "Tashkilotchi batafsil ma’lumotni tez orada qo‘shadi."}</p>
              {learnings.length || (s.features?.length ?? 0) > 0 ? (
                <div className={learnings.length && s.features?.length ? "smd-two" : "smd-two one"}>
                  {learnings.length ? (
                    <div className="smd-learn">
                      <h3>Nimalarni o‘rganasiz?</h3>
                      <ul>
                        {learnings.map((item) => (
                          <li key={item}>
                            <CheckCircle2 className="i" /> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {s.features?.length ? (
                    <div className="smd-perks">
                      <h3>Imkoniyatlar</h3>
                      <ul>
                        {s.features.map((item) => (
                          <li key={item.title}>
                            <span className="ic"><BadgeCheck className="i" /></span>
                            <span>
                              <b>{item.title}</b>
                              <small>{item.subtitle}</small>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>

            <section className="smd-card smd-speaker" data-testid="seminar-speakers">
              <h2>{speakers.length > 1 ? "Spikerlar" : "Spiker"}</h2>
              {speakers.length === 0 ? (
                <div className="smd-sp tbd">
                  <span className="ava">?</span>
                  <div>
                    <b>Ma’ruzachi aniqlanmoqda</b>
                    <small>Tez orada e’lon qilinadi</small>
                  </div>
                </div>
              ) : (
                speakers.slice(0, 4).map((sp) => (
                  <div className="smd-sp" key={sp.name}>
                    {sp.photo ? <img src={sp.photo} alt="" /> : <span className="ava">{initials(sp.name)}</span>}
                    <div>
                      <b>{sp.name}</b>
                      <small>{sp.role}</small>
                      {sp.city ? (
                        <small className="line">
                          <MapPin className="i" /> {sp.city}
                        </small>
                      ) : null}
                      {sp.bio ? <p>{sp.bio}</p> : null}
                    </div>
                  </div>
                ))
              )}
              {s.organizer ? (
                <p className="smd-org">
                  <BadgeCheck className="i" /> Tashkilotchi: <b>{s.organizer}</b>
                </p>
              ) : null}
            </section>

            {schedule.length || days.length ? (
              <section className="smd-card smd-program" data-testid="seminar-program">
                <div className="smd-program-hd">
                  <h2>
                    Dastur{" "}
                    {activeDay?.date ? <small>({activeDay.date})</small> : p && !days.length ? <small>({p.d}-{p.month.toLowerCase()} {p.y})</small> : null}
                  </h2>
                  {days.length > 1 ? (
                    <div className="smd-days" role="tablist" aria-label="Kunlar">
                      {days.map((d, index) => (
                        <button key={d.label} type="button" role="tab" aria-selected={index === day} className={index === day ? "on" : ""} onClick={() => setDay(index)}>
                          {d.label} · {d.title}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                {activeDay?.topics?.length ? (
                  <ul className="smd-topics">
                    {activeDay.topics.map((t) => (
                      <li key={t}>
                        <CheckCircle2 className="i" /> {t}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ol className="smd-schedule">
                  {schedule.map((row) => (
                    <li key={`${row.time}-${row.title}`}>
                      <Clock3 className="i" />
                      <time>{row.time}</time>
                      <span>{row.title}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            <section className="smd-card smd-place">
              <h2>Joylashuv</h2>
              {online ? (
                <p className="smd-text">
                  <Globe className="i" /> Seminar onlayn o‘tadi. Efir havolasi ro‘yxatdan o‘tgan ishtirokchilarga yuboriladi.
                </p>
              ) : (
                <div className="smd-venue">
                  <span className="pin">
                    <MapPin className="i" />
                  </span>
                  <div>
                    <b>{s.venue}</b>
                    <small>{s.city}</small>
                    <a href={mapHref} target="_blank" rel="noreferrer">
                      Xaritada ochish <ExternalLink className="i" />
                    </a>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <aside className="smd-rail">
          <section className="smd-card smd-reg" data-testid="seminar-reg-card">
            <div className="smd-reg-hd">
              <h2>Ro‘yxatdan o‘tish</h2>
              <span className={full ? "pill red" : "pill"}>{seatsText}</span>
            </div>
            <div className="smd-tier on">
              <span className="radio" aria-hidden />
              <div className="body">
                <b>{online ? "Onlayn chipta" : "Standart chipta"}</b>
                <div className="price">
                  <strong>{s.price > 0 ? som(s.price) : "Bepul"}</strong>
                  {discount ? (
                    <>
                      <s>{som(s.oldPrice as number)}</s>
                      <em>-{discount}%</em>
                    </>
                  ) : null}
                </div>
                <ul>
                  <li>
                    <CheckCircle2 className="i" /> {online ? "Jonli efirda qatnashish" : "Zalda qatnashish"}
                  </li>
                  <li>
                    <CheckCircle2 className="i" /> Shaxsiy QR-chipta
                  </li>
                  {durationLabel(s) ? (
                    <li>
                      <CheckCircle2 className="i" /> {durationLabel(s)}
                    </li>
                  ) : null}
                </ul>
                {!s.seatsTbd ? (
                  <div className="seats">
                    <span>{full ? "Joy qolmadi" : `${left}/${s.seatsTotal} joy qoldi`}</span>
                    <span className="bar" aria-hidden>
                      <i style={{ width: `${pct}%` }} />
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            {mine ? (
              <Link href={`/seminarlar/yozuvlarim/${mine.id}`} className="smd-cta done" data-testid="seminar-ticket">
                <Ticket className="i" /> Siz yozilgansiz — chiptani ochish
              </Link>
            ) : !upcoming ? (
              <span className="smd-cta off">Seminar o‘tib ketgan</span>
            ) : full ? (
              <span className="smd-cta off">Joy qolmadi</span>
            ) : (
              <button type="button" className="smd-cta" data-testid="seminar-open-reg" onClick={() => setRegOpen(true)}>
                Ro‘yxatdan o‘tish <ArrowRight className="i" />
              </button>
            )}
            <button type="button" className="smd-ghost" onClick={downloadIcs} disabled={tbd}>
              <CalendarPlus className="i" /> Kalendarga qo‘shish
            </button>
            <p className="smd-note">
              <Ticket className="i" /> Yozilgach shaxsiy chipta (kod + QR) beriladi.{s.price > 0 ? " Onlayn to‘lov hozircha olinmaydi." : ""}
            </p>
          </section>

          <section className="smd-card smd-reviews">
            <div className="smd-reg-hd">
              <h2>Ishtirokchilar sharhlari</h2>
            </div>
            <p className="smd-muted">
              <Star className="i" /> Hali sharh yo‘q. Sharhlar seminar o‘tgach paydo bo‘ladi.
            </p>
          </section>

          {similar.length ? (
            <section className="smd-card smd-similar">
              <div className="smd-reg-hd">
                <h2>O‘xshash seminarlar</h2>
                <Link href="/seminarlar">
                  Barchasini ko‘rish <ArrowRight className="i" />
                </Link>
              </div>
              {similar.map((item) => (
                <Link key={item.id} href={seminarHref(item.id)} className="smd-sim">
                  <img src={item.image} alt="" />
                  <span className="txt">
                    <b>{item.title}</b>
                    <small>
                      <CalendarDays className="i" /> {seminarWhen(item)}
                      <span>
                        <MapPin className="i" /> {item.city === "Online" ? "Onlayn" : item.city}
                      </span>
                    </small>
                  </span>
                  <strong>{item.price > 0 ? som(item.price) : "Bepul"}</strong>
                  <ChevronRight className="i chev" />
                </Link>
              ))}
            </section>
          ) : null}
        </aside>

        {regOpen ? (
          <div className="smd-modal" role="dialog" aria-modal="true" aria-label="Ro‘yxatdan o‘tish" onMouseDown={(event) => event.target === event.currentTarget && closeReg()}>
            <div className="smd-modal-box">
              <button type="button" className="smd-modal-x" aria-label="Yopish" onClick={closeReg}>
                <X className="i" />
              </button>
              <RegistrationSection seminar={s} left={left} mine={mine} upcoming={upcoming} anchorId="royxat" className="!border-0 !shadow-none !p-0" />
              {!mine ? (
                <p className="smd-modal-meta">
                  <Users className="i" /> {s.title} · {seminarWhen(s)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </ShopShell>
  );
}
