"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  Award,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Globe,
  Wrench,
  Heart,
  MapPin,
  MonitorPlay,
  Plus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import {
  getSeminarSpeakers,
  isDateTbd,
  isSeminarUpcoming,
  seminarHref,
  seminars as catalog,
  specialtyLabels,
  type Seminar,
  type Specialty,
} from "@/data/seminars";
import { som, useShopLines } from "@/components/shop/desktop/shop-cart";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import "./seminars-desktop.css";

type CityFilter = "" | "Toshkent" | "Samarqand" | "Online";
type FormatFilter = "" | "offline" | "online";
type PriceFilter = "" | "free" | "lt1" | "1to2" | "gt2";
type SortKey = "date" | "cheap" | "expensive" | "seats";

export const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
export const MONTHS_SHORT = ["YAN", "FEV", "MAR", "APR", "MAY", "IYN", "IYL", "AVG", "SEN", "OKT", "NOY", "DEK"];
export const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const WEEK_HEAD = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const PER_MONTH = 4;

const specialtyOrder: Specialty[] = ["implantologiya", "endodontiya", "ortodontiya", "estetika", "kongress"];

/** Local YYYY-MM-DD (no timezone shift). */
export function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function dateParts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { y, m, d, weekday: WEEKDAYS[date.getDay()], monthShort: MONTHS_SHORT[m - 1], month: MONTHS[m - 1] };
}

/** "8 soat" / "2 kun · 16 soat" from the seminar clock. */
export function durationLabel(s: Seminar) {
  const [h1, m1] = s.time.split(":").map(Number);
  const [h2, m2] = s.timeEnd.split(":").map(Number);
  if ([h1, m1, h2, m2].some((v) => Number.isNaN(v))) return "";
  const hours = Math.max(0, (h2 * 60 + m2 - (h1 * 60 + m1)) / 60);
  const days = s.dateEnd && s.dateEnd !== s.date ? Math.round((Date.parse(s.dateEnd) - Date.parse(s.date)) / 86_400_000) + 1 : 1;
  const per = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return days > 1 ? `${days} kun · ${per} soatdan` : `${per} soat`;
}

export function initials(name: string) {
  return (
    name
      .replace(/^(Prof\.?|Dr\.?)\s*/gi, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "S"
  );
}

function inRange(s: Seminar, from: string, to: string) {
  if (!from && !to) return true;
  if (isDateTbd(s)) return false;
  const start = s.date;
  const end = s.dateEnd ?? s.date;
  if (from && end < from) return false;
  if (to && start > to) return false;
  return true;
}

export function SeminarsDesktop() {
  const { catalogVersion, liveSeminar, seatsLeft, isRegistered, registrations } = useSeminarRegs();
  const favorites = useFavorites();
  const lines = useShopLines();
  const today = isoOf(new Date());
  const [spec, setSpec] = useState<Specialty | "all">("all");
  const [city, setCity] = useState<CityFilter>("");
  const [format, setFormat] = useState<FormatFilter>("");
  const [price, setPrice] = useState<PriceFilter>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("date");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [cal, setCal] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });

  const upcoming = useMemo(() => {
    void catalogVersion;
    return catalog.map(liveSeminar).filter((s) => isSeminarUpcoming(s));
  }, [catalogVersion, liveSeminar]);

  const specs = useMemo(() => specialtyOrder.filter((id) => upcoming.some((s) => s.specialty === id)), [upcoming]);

  const items = useMemo(() => {
    const rows = upcoming.filter((s) => {
      if (spec !== "all" && s.specialty !== spec) return false;
      if (city && s.city !== city) return false;
      if (format === "online" && s.city !== "Online") return false;
      if (format === "offline" && s.city === "Online") return false;
      if (price === "free" && s.price > 0) return false;
      if (price === "lt1" && s.price >= 1_000_000) return false;
      if (price === "1to2" && (s.price < 1_000_000 || s.price > 2_000_000)) return false;
      if (price === "gt2" && s.price <= 2_000_000) return false;
      if (!inRange(s, from, to)) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "expensive") return b.price - a.price;
      if (sort === "seats") return seatsLeft(a) - seatsLeft(b);
      const tbd = Number(isDateTbd(a)) - Number(isDateTbd(b));
      return tbd || a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
    });
  }, [city, format, from, price, seatsLeft, sort, spec, to, upcoming]);

  /** Month groups (date order) — or one flat group when sorting by price / seats. */
  const groups = useMemo(() => {
    if (sort !== "date") return [{ key: "all", title: "Saralangan seminarlar", items }];
    const map = new Map<string, Seminar[]>();
    for (const s of items) {
      const key = isDateTbd(s) ? "tbd" : s.date.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()].map(([key, list]) => {
      if (key === "tbd") return { key, title: "Sana aniqlanmoqda", items: list };
      const [y, m] = key.split("-").map(Number);
      return { key, title: `${MONTHS[m - 1]} ${y}`, items: list };
    });
  }, [items, sort]);

  const filtersOn = spec !== "all" || Boolean(city || format || price || from || to);
  function resetAll() {
    setSpec("all");
    setCity("");
    setFormat("");
    setPrice("");
    setFrom("");
    setTo("");
  }

  const mine = useMemo(() => {
    void catalogVersion;
    return registrations
      .filter((r) => r.status !== "cancelled")
      .map((r) => catalog.find((s) => s.id === r.seminarId))
      .filter((s): s is Seminar => Boolean(s))
      .filter((s, i, list) => list.findIndex((x) => x.id === s.id) === i)
      .slice(0, 3);
  }, [catalogVersion, registrations]);

  return (
    <ShopShell searchPath="/seminarlar" cartCount={lines.reduce((sum, line) => sum + line.qty, 0)} placeholder="Stomatologga nima kerak?">
      <div className="sm" data-testid="seminars-desktop">
        <div className="sm-main">
          <div className="sm-head">
            <div>
              <h1>Seminarlar</h1>
              <p>Bilimingizni oshiring, tajribali mutaxassislardan o‘rganing</p>
            </div>
            <Link href="/seminarlar/tashkilotchi" className="sm-add">
              <Plus className="i" /> Seminar qo‘shish
            </Link>
          </div>

          <div className="sm-chips" role="tablist" aria-label="Yo‘nalish">
            <button type="button" role="tab" aria-selected={spec === "all"} className={spec === "all" ? "sm-chip on" : "sm-chip"} onClick={() => setSpec("all")}>
              Barchasi
            </button>
            {specs.map((id) => (
              <button key={id} type="button" role="tab" aria-selected={spec === id} className={spec === id ? "sm-chip on" : "sm-chip"} onClick={() => setSpec(id)}>
                {specialtyLabels[id]}
              </button>
            ))}
          </div>

          <div className="sm-filters">
            <Field label="Shahar" icon={<MapPin className="ic" />}>
              <select value={city} onChange={(event) => setCity(event.target.value as CityFilter)} aria-label="Shahar">
                <option value="">Barchasi</option>
                <option value="Toshkent">Toshkent</option>
                <option value="Samarqand">Samarqand</option>
                <option value="Online">Onlayn</option>
              </select>
            </Field>
            <Field label="Format" icon={<MonitorPlay className="ic" />}>
              <select value={format} onChange={(event) => setFormat(event.target.value as FormatFilter)} aria-label="Format">
                <option value="">Barchasi</option>
                <option value="offline">Oflayn</option>
                <option value="online">Onlayn</option>
              </select>
            </Field>
            <Field label="Narx" icon={<Wallet className="ic" />}>
              <select value={price} onChange={(event) => setPrice(event.target.value as PriceFilter)} aria-label="Narx">
                <option value="">Barchasi</option>
                <option value="free">Bepul</option>
                <option value="lt1">1 mln so‘mgacha</option>
                <option value="1to2">1–2 mln so‘m</option>
                <option value="gt2">2 mln so‘mdan yuqori</option>
              </select>
            </Field>
            <div className="sm-field wide">
              <CalendarDays className="ic" />
              <span className="txt">
                <small>Sana oralig‘i</small>
                <span className="sm-dates">
                  <input type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} aria-label="Sanadan" />
                  <span>–</span>
                  <input type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} aria-label="Sanagacha" />
                </span>
              </span>
            </div>
            <Field label="Saralash" icon={<ArrowUpDown className="ic" />}>
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Saralash">
                <option value="date">Eng yaqin sana</option>
                <option value="cheap">Narx: arzonroq</option>
                <option value="expensive">Narx: qimmatroq</option>
                <option value="seats">Joy kam qolgan</option>
              </select>
            </Field>
          </div>

          {filtersOn ? (
            <div className="sm-active">
              {from && from === to ? <span className="pill">{dateParts(from).d}-{dateParts(from).month.toLowerCase()}</span> : null}
              <span>{items.length} ta seminar topildi</span>
              <button type="button" onClick={resetAll}>
                <X className="i" /> Filtrlarni tozalash
              </button>
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="sm-empty" data-testid="seminars-empty">
              <CalendarDays className="big" />
              <b>{upcoming.length ? "Mos seminar topilmadi" : "Hozircha yaqin seminarlar yo‘q"}</b>
              <p>{upcoming.length ? "Filtrlarni o‘zgartirib ko‘ring." : "Yangi seminarlar tez orada qo‘shiladi. Tashkilotchi bo‘lsangiz, o‘z seminaringizni qo‘shing."}</p>
              <div className="acts">
                {filtersOn ? (
                  <button type="button" className="ghost" onClick={resetAll}>
                    Filtrlarni tozalash
                  </button>
                ) : null}
                <Link href="/seminarlar/tashkilotchi">
                  <Plus className="i" /> Seminar qo‘shish
                </Link>
              </div>
            </div>
          ) : (
            groups.map((group) => {
              const open = expanded.includes(group.key) || sort !== "date";
              const shown = open ? group.items : group.items.slice(0, PER_MONTH);
              return (
                <section className="sm-month" key={group.key}>
                  <div className="sm-month-hd">
                    <h2>
                      {group.title} <small>{group.items.length} ta seminar</small>
                    </h2>
                    {group.items.length > PER_MONTH && sort === "date" ? (
                      <button type="button" onClick={() => setExpanded((list) => (open ? list.filter((k) => k !== group.key) : [...list, group.key]))}>
                        {open ? "Yig‘ish" : "Barchasini ko‘rish"} <ArrowRight className="i" />
                      </button>
                    ) : null}
                  </div>
                  <div className="sm-rows">
                    {shown.map((s) => (
                      <SeminarRow
                        key={s.id}
                        s={s}
                        left={seatsLeft(s)}
                        registered={isRegistered(s.id)}
                        saved={favorites.has(`seminar:${s.id}`)}
                        onSave={() => favorites.toggle(`seminar:${s.id}`)}
                      />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>

        <aside className="sm-rail">
          <MiniCalendar
            y={cal.y}
            m={cal.m}
            today={today}
            seminars={upcoming}
            selected={from && from === to ? from : ""}
            onMonth={(step) => setCal((c) => {
              const d = new Date(c.y, c.m + step, 1);
              return { y: d.getFullYear(), m: d.getMonth() };
            })}
            onPick={(iso) => {
              if (from === iso && to === iso) {
                setFrom("");
                setTo("");
              } else {
                setFrom(iso);
                setTo(iso);
              }
            }}
          />

          <section className="sm-box">
            <div className="sm-box-hd">
              <h3>Mening seminarlarim</h3>
              <Link href="/seminarlar/yozuvlarim">
                Barchasini ko‘rish <ArrowRight className="i" />
              </Link>
            </div>
            {mine.length === 0 ? (
              <p className="sm-muted">Hali seminarga yozilmagansiz.</p>
            ) : (
              mine.map((s) => {
                const p = isDateTbd(s) ? null : dateParts(s.date);
                return (
                  <Link key={s.id} href={seminarHref(s.id)} className="sm-mine">
                    <span className="sm-mdate">
                      <b>{p ? p.d : "—"}</b>
                      <small>{p ? p.monthShort : "SANA"}</small>
                    </span>
                    <img src={s.image} alt="" />
                    <span className="txt">
                      <b>{s.title}</b>
                      <small>
                        {s.city === "Online" ? "Onlayn" : `${s.city}, ${s.venue}`}
                      </small>
                    </span>
                    <ChevronRight className="i" />
                  </Link>
                );
              })
            )}
          </section>

          <section className="sm-box">
            <h3 className="sm-why-title">Nega seminarlarga qatnashish kerak?</h3>
            <ul className="sm-why">
              <li>
                <span className="ic"><Globe className="i" /></span>
                <span><b>Tajribali spikerlar</b><small>Mutaxassislardan bevosita o‘rganing</small></span>
              </li>
              <li>
                <span className="ic"><Wrench className="i" /></span>
                <span><b>Amaliy ko‘nikmalar</b><small>Hands-on mashg‘ulotlar</small></span>
              </li>
              <li>
                <span className="ic"><Award className="i" /></span>
                <span><b>Shaxsiy chipta</b><small>Yozilgach QR-kodli chipta beriladi</small></span>
              </li>
              <li>
                <span className="ic"><Users className="i" /></span>
                <span><b>Kasbiy aloqa</b><small>Hamkasblar bilan tanishing</small></span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </ShopShell>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="sm-field">
      {icon}
      <span className="txt">
        <small>{label}</small>
        {children}
      </span>
      <ChevronDown className="chev" />
    </label>
  );
}

function SeminarRow({ s, left, registered, saved, onSave }: { s: Seminar; left: number; registered: boolean; saved: boolean; onSave: () => void }) {
  const tbd = isDateTbd(s);
  const p = tbd ? null : dateParts(s.date);
  const end = !tbd && s.dateEnd && s.dateEnd !== s.date ? dateParts(s.dateEnd) : null;
  const speakers = getSeminarSpeakers(s);
  const lead = speakers[0];
  const online = s.city === "Online";
  const total = Math.max(1, s.seatsTotal);
  const pct = Math.min(100, Math.round(((total - left) / total) * 100));
  const href = seminarHref(s.id);
  const full = left <= 0 && !s.seatsTbd;

  return (
    <article className="sm-row" data-testid="seminar-row">
      <div className="sm-date">
        <span className="sm-dtile">
          <b>{p ? (end && end.m === p.m ? `${p.d}–${end.d}` : p.d) : "—"}</b>
          <small>{p ? p.monthShort : "SANA"}</small>
        </span>
        <em>{p ? p.weekday : "Tez orada"}</em>
      </div>
      <Link href={href} className="sm-ph" aria-label={s.title}>
        <img src={s.image} alt="" loading="lazy" />
      </Link>
      <div className="sm-info">
        <span className={`sm-tag ${s.specialty}`}>{specialtyLabels[s.specialty]}</span>
        <h3>
          <Link href={href}>{s.title}</Link>
        </h3>
        <p>{s.badge ?? s.description}</p>
        <div className="sm-meta">
          <span>
            {online ? <Globe className="i" /> : <MapPin className="i" />}
            <b>{online ? "Onlayn" : s.city}</b>
            {!online && s.venue ? <em>{s.venue}</em> : null}
          </span>
          <span>
            <Clock3 className="i" /> {s.time} – {s.timeEnd}
          </span>
          {durationLabel(s) ? (
            <span>
              <CalendarDays className="i" /> {durationLabel(s)}
            </span>
          ) : null}
        </div>
      </div>
      <div className="sm-speaker">
        {lead ? (
          <>
            {lead.photo ? <img src={lead.photo} alt="" /> : <span className="ava">{initials(lead.name)}</span>}
            <span className="txt">
              <b>{lead.name}</b>
              <small>{speakers.length > 1 ? `${lead.role} · +${speakers.length - 1} spiker` : lead.role}</small>
            </span>
          </>
        ) : (
          <>
            <span className="ava muted">?</span>
            <span className="txt">
              <b>Ma’ruzachi aniqlanmoqda</b>
              <small>{s.organizer ? `Tashkilotchi: ${s.organizer}` : "Tez orada e’lon qilinadi"}</small>
            </span>
          </>
        )}
        <div className="seats">
          {s.organizer && lead ? <span className="org"><BadgeCheck className="i" /> {s.organizer}</span> : null}
          <span className="line">{s.seatsTbd ? "Joylar soni cheklangan" : full ? "Joy qolmadi" : `${left}/${s.seatsTotal} joy qoldi`}</span>
          {!s.seatsTbd ? (
            <span className="bar" aria-hidden>
              <i style={{ width: `${pct}%` }} />
            </span>
          ) : null}
        </div>
      </div>
      <div className="sm-buy">
        <button type="button" className={saved ? "sm-fav on" : "sm-fav"} aria-pressed={saved} aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlab qo‘yish"} onClick={onSave}>
          <Heart className="i" />
        </button>
        <div className="price">
          {s.oldPrice && s.oldPrice > s.price ? <s>{som(s.oldPrice)}</s> : null}
          <strong>{s.price > 0 ? som(s.price) : "Bepul"}</strong>
        </div>
        {registered ? (
          <Link href={href} className="sm-reg done">
            <BadgeCheck className="i" /> Yozilgansiz
          </Link>
        ) : full ? (
          <span className="sm-reg off">Joy qolmadi</span>
        ) : (
          <Link href={`${href}?royxat=1`} className="sm-reg" data-testid="seminar-register">
            Ro‘yxatdan o‘tish
          </Link>
        )}
      </div>
    </article>
  );
}

function MiniCalendar({
  y,
  m,
  today,
  seminars,
  selected,
  onMonth,
  onPick,
}: {
  y: number;
  m: number;
  today: string;
  seminars: Seminar[];
  selected: string;
  onMonth: (step: number) => void;
  onPick: (iso: string) => void;
}) {
  const days = useMemo(() => {
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7; // Monday-first
    const count = new Date(y, m + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= count; d++) cells.push(isoOf(new Date(y, m, d)));
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [m, y]);

  const busy = useMemo(() => {
    const set = new Set<string>();
    for (const s of seminars) {
      if (isDateTbd(s)) continue;
      const start = new Date(`${s.date}T00:00:00`);
      const end = new Date(`${s.dateEnd ?? s.date}T00:00:00`);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) set.add(isoOf(d));
    }
    return set;
  }, [seminars]);

  return (
    <section className="sm-box sm-cal" aria-label="Seminarlar kalendari">
      <div className="sm-cal-hd">
        <button type="button" aria-label="Oldingi oy" onClick={() => onMonth(-1)}>
          <ChevronLeft className="i" />
        </button>
        <b>
          {MONTHS[m]} {y}
        </b>
        <button type="button" aria-label="Keyingi oy" onClick={() => onMonth(1)}>
          <ChevronRight className="i" />
        </button>
      </div>
      <div className="sm-cal-grid">
        {WEEK_HEAD.map((d) => (
          <span key={d} className="wd">
            {d}
          </span>
        ))}
        {days.map((iso, index) =>
          iso ? (
            <button
              key={iso}
              type="button"
              className={["day", busy.has(iso) ? "busy" : "", iso === today ? "today" : "", iso === selected ? "on" : "", iso < today ? "past" : ""].filter(Boolean).join(" ")}
              aria-pressed={iso === selected}
              aria-label={`${Number(iso.slice(8))}-${MONTHS[m].toLowerCase()}${busy.has(iso) ? ", seminar bor" : ""}`}
              disabled={!busy.has(iso)}
              onClick={() => onPick(iso)}
            >
              {Number(iso.slice(8))}
            </button>
          ) : (
            <span key={`e${index}`} />
          ),
        )}
      </div>
      <p className="sm-cal-note">
        <i /> Seminar bor kunlar — bosib, shu kunni ko‘ring
      </p>
    </section>
  );
}
