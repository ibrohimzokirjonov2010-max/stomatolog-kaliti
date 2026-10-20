"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GraduationCap,
  Heart,
  MapPin,
  Plus,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { shopToggleFav, som, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { Drop } from "@/components/shop/desktop/parts";
import { useSeminarRegs } from "@/components/seminar-provider";
import { getSeminar, seminars, specialtyLabels, type Seminar } from "@/data/seminars";
import {
  seminarCategories,
  seminarHref,
  whyAttend,
  type SeminarCategory,
  type SeminarFormat,
} from "@/data/desktop-seminars";
import "./seminar.css";

const WEEK = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

const chipIcon = {
  all: Sparkles,
  implantologiya: Activity,
  endodontiya: Stethoscope,
  ortodontiya: Users,
  estetika: Sparkles,
  parodontologiya: Activity,
  jarrohlik: Stethoscope,
  boshqa: GraduationCap,
} as const;

type PriceFilter = "all" | "low" | "mid" | "high";
type SortKey = "near" | "far" | "cheap" | "rich";

function monthCells(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const lead = (first + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= count; day += 1) cells.push(day);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function iso(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function tashkentToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const year = pick("year");
  const month = pick("month") - 1;
  const day = pick("day");
  return { year, month, iso: iso(year, month, day) };
}

const DAY_NAMES = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function viewOf(item: Seminar) {
  const [year, month, day] = (item.date || "").split("-");
  const idx = Math.max(0, Number(month) - 1);
  const date = item.date ? new Date(Number(year), idx, Number(day) || 1) : null;
  const categoryKey = (item.specialty === "kongress" ? "boshqa" : item.specialty) as SeminarCategory;
  return {
    id: item.id,
    title: item.title,
    category: specialtyLabels[item.specialty] ?? item.specialty,
    categoryKey,
    summary: (item.description ?? "").slice(0, 180),
    city: item.city,
    venue: item.venue,
    start: item.time,
    end: item.timeEnd,
    hours: "",
    date: item.date || "",
    dayLabel: date ? DAY_NAMES[date.getDay()] : "",
    monthShort: (MONTHS[idx] ?? "").slice(0, 3),
    monthTitle: item.date ? `${MONTHS[idx]} ${year}` : "Sana yo‘q",
    dayNum: day ? String(Number(day)) : "—",
    speaker: item.speaker || "Tashkilotchi",
    speakerRole: item.speakerRole,
    speakerImage: item.speakerAvatar || "",
    seatsLeft: Math.max(0, item.seatsTotal - item.seatsTaken),
    seatsTotal: Math.max(item.seatsTotal, 0),
    price: item.price,
    image: item.image,
    format: (item.city === "Online" ? "online" : "offline") as SeminarFormat,
  };
}

export function SeminarList() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const favs = useShopFavs();
  const cartCount = useShopLineCount();
  const { catalogVersion, registrations } = useSeminarRegs();
  const source = useMemo(() => {
    void catalogVersion;
    return seminars.map(viewOf);
  }, [catalogVersion]);
  const [cat, setCat] = useState<SeminarCategory | "all">("all");
  const [city, setCity] = useState("Barchasi");
  const [format, setFormat] = useState<SeminarFormat | "all">("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<SortKey>("near");
  const [open, setOpen] = useState<"city" | "format" | "price" | "sort" | null>(null);
  const [today] = useState(tashkentToday);
  const [cursor, setCursor] = useState({ year: today.year, month: today.month });
  const [selected, setSelected] = useState(today.iso);
  const [filtering, setFiltering] = useState(false);
  const [onlyMonth, setOnlyMonth] = useState<string | null>(null);

  const items = useMemo(() => {
    const rows = source.filter((item) => {
      if (cat !== "all" && item.categoryKey !== cat) return false;
      if (city !== "Barchasi" && item.city !== city) return false;
      if (format !== "all" && item.format !== format) return false;
      if (price === "low" && item.price >= 1_000_000) return false;
      if (price === "mid" && (item.price < 1_000_000 || item.price > 2_000_000)) return false;
      if (price === "high" && item.price <= 2_000_000) return false;
      if (from && item.date < from) return false;
      if (to && item.date > to) return false;
      if (filtering && item.date !== selected) return false;
      if (onlyMonth && item.monthTitle !== onlyMonth) return false;
      if (q && !`${item.title} ${item.speaker} ${item.city} ${item.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => {
      if (sort === "cheap") return a.price - b.price;
      if (sort === "rich") return b.price - a.price;
      if (sort === "far") return b.date.localeCompare(a.date);
      return a.date.localeCompare(b.date);
    });
    return rows;
  }, [cat, city, filtering, format, from, onlyMonth, price, q, selected, sort, source, to]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      const list = map.get(item.monthTitle) ?? [];
      list.push(item);
      map.set(item.monthTitle, list);
    }
    return [...map.entries()];
  }, [items]);

  const marked = new Set(source.map((item) => item.date));
  const cells = monthCells(cursor.year, cursor.month);
  const sortLabel = { near: "Sana bo‘yicha (eng yaqin)", far: "Sana bo‘yicha (uzoq)", cheap: "Narx (arzon)", rich: "Narx (qimmat)" }[sort];
  const priceLabel = { all: "Barchasi", low: "1 mln gacha", mid: "1–2 mln", high: "2 mln dan" }[price];
  const formatLabel = { all: "Barchasi", offline: "Offline", online: "Online", hybrid: "Offline + jonli efir" }[format];

  function pickDay(day: number) {
    const next = iso(cursor.year, cursor.month, day);
    if (filtering && selected === next) {
      setFiltering(false);
      return;
    }
    setSelected(next);
    setFiltering(true);
    setOnlyMonth(null);
  }

  return (
    <ShopShell searchPath="/seminarlar" cartCount={cartCount} placeholder="Stomatologga nima kerak?" showCamera={false}>
      <div className="sem-layout" data-testid="seminar-list">
        <div>
          <div className="sem-head">
            <div>
              <h1 className="sem-h1">Seminarlar</h1>
              <p className="sem-sub">Bilimingizni oshiring, tajribali mutaxassislardan o‘rganing</p>
            </div>
            <Link className="sem-add" href="/seminarlar/yozuvlarim/tashkilotchi/yangi">
              <Plus className="i" /> Seminar qo‘shish
            </Link>
          </div>
          <div className="dk-chips" style={{ marginTop: "calc(.55 * var(--u))" }}>
            {seminarCategories.map((chip) => {
              const Icon = chipIcon[chip.id];
              return (
                <button key={chip.id} type="button" className={cat === chip.id ? "dk-chip on" : "dk-chip"} onClick={() => setCat(chip.id)}>
                  <Icon className="i" /> {chip.label}
                </button>
              );
            })}
          </div>
          <div className="sem-filters">
            <Drop label={`Shahar: ${city}`} open={open === "city"} onToggle={() => setOpen(open === "city" ? null : "city")}>
              {["Barchasi", "Toshkent", "Samarqand"].map((item) => (
                <button key={item} type="button" className={city === item ? "dk-check on" : "dk-check"} onClick={() => { setCity(item); setOpen(null); }}>
                  {item}
                </button>
              ))}
            </Drop>
            <Drop label={`Format: ${formatLabel}`} open={open === "format"} onToggle={() => setOpen(open === "format" ? null : "format")}>
              {(["all", "offline", "hybrid", "online"] as const).map((item) => (
                <button key={item} type="button" className={format === item ? "dk-check on" : "dk-check"} onClick={() => { setFormat(item); setOpen(null); }}>
                  {{ all: "Barchasi", offline: "Offline", hybrid: "Offline + jonli efir", online: "Online" }[item]}
                </button>
              ))}
            </Drop>
            <Drop label={`Narx: ${priceLabel}`} open={open === "price"} onToggle={() => setOpen(open === "price" ? null : "price")}>
              {(["all", "low", "mid", "high"] as const).map((item) => (
                <button key={item} type="button" className={price === item ? "dk-check on" : "dk-check"} onClick={() => { setPrice(item); setOpen(null); }}>
                  {{ all: "Barchasi", low: "1 mln gacha", mid: "1–2 mln", high: "2 mln dan" }[item]}
                </button>
              ))}
            </Drop>
            <label className="dk-drop">
              <span className="dk-drop" style={{ display: "inline-flex" }}>
                <span style={{ height: "calc(1.8 * var(--u))", padding: "0 calc(.65 * var(--u))", background: "#fff", border: "1px solid #e6edf5", borderRadius: "calc(.4 * var(--u))", fontSize: "calc(.64 * var(--u))", fontWeight: 650, display: "inline-flex", alignItems: "center", gap: "calc(.3 * var(--u))" }}>
                  <CalendarRange className="i" /> Sana oralig‘i
                  <input aria-label="Boshlanish sanasi" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                  <input aria-label="Tugash sanasi" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                </span>
              </span>
            </label>
            <Drop label={sortLabel} open={open === "sort"} onToggle={() => setOpen(open === "sort" ? null : "sort")}>
              {(["near", "far", "cheap", "rich"] as const).map((item) => (
                <button key={item} type="button" className={sort === item ? "dk-check on" : "dk-check"} onClick={() => { setSort(item); setOpen(null); }}>
                  {{ near: "Sana bo‘yicha (eng yaqin)", far: "Sana bo‘yicha (uzoq)", cheap: "Narx (arzon)", rich: "Narx (qimmat)" }[item]}
                </button>
              ))}
            </Drop>
          </div>
          {groups.length === 0 ? (
            <div className="dk-empty">
              <b>{source.length === 0 ? "Hozircha seminar yo‘q" : "Mos seminar topilmadi"}</b>
              <p>Filtrlarni o‘zgartiring.</p>
              <button
                type="button"
                onClick={() => {
                  setCat("all");
                  setCity("Barchasi");
                  setFormat("all");
                  setPrice("all");
                  setFrom("");
                  setTo("");
                  setFiltering(false);
                  setOnlyMonth(null);
                }}
              >
                Tozalash
              </button>
            </div>
          ) : (
            groups.map(([title, rows]) => (
              <section key={title}>
                <div className="sem-month">
                  <h2>{title}</h2>
                  <em>{rows.length} ta seminar</em>
                  <button type="button" className="dk-link" onClick={() => setOnlyMonth(onlyMonth === title ? null : title)}>
                    {onlyMonth === title ? "Hammasini ko‘rsatish" : "Barchasini ko‘rish"} <ChevronRight className="i" />
                  </button>
                </div>
                {rows.map((item) => {
                  const loved = favs.includes(item.id);
                  return (
                    <article className="sem-card" key={item.id}>
                      <div className="sem-date">
                        <b>{item.dayNum}</b>
                        <span>{item.monthShort}</span>
                        <small>{item.dayLabel}</small>
                      </div>
                      <Link href={seminarHref(item.id)}>
                        <img className="sem-thumb" src={item.image} alt="" />
                      </Link>
                      <div>
                        <span className="sem-tag">{item.category}</span>
                        <h3>
                          <Link href={seminarHref(item.id)}>{item.title}</Link>
                        </h3>
                        <p className="sum">{item.summary}</p>
                        <div className="sem-meta">
                          <span>
                            <MapPin className="i" /> {item.city} · {item.venue}
                          </span>
                          <span>
                            <Clock3 className="i" /> {item.start} – {item.end}
                          </span>
                          <span>{item.hours}</span>
                        </div>
                      </div>
                      <div>
                        <div className="sem-who">
                          {item.speakerImage ? <img src={item.speakerImage} alt="" /> : <span className="sem-who" />}
                          <span>
                            <b>{item.speaker}</b>
                            <small>{item.speakerRole}</small>
                          </span>
                        </div>
                        {item.seatsTotal > 0 ? (
                          <>
                            <div className="sem-bar" aria-hidden>
                              <i style={{ width: `${Math.round((item.seatsLeft / item.seatsTotal) * 100)}%` }} />
                            </div>
                            <div className="sem-left">
                              {item.seatsLeft}/{item.seatsTotal} joy qoldi
                            </div>
                          </>
                        ) : null}
                      </div>
                      <div className="sem-buy">
                        <div className="sem-price">{som(item.price)}</div>
                        <div className="sem-actions">
                          <Link className="sem-go" href={`${seminarHref(item.id)}#royxat`}>
                            Ro‘yxatdan o‘tish
                          </Link>
                          <button type="button" className={loved ? "sem-heart on" : "sem-heart"} aria-label="Sevimli" aria-pressed={loved} onClick={() => shopToggleFav(item.id)}>
                            <Heart className="i" />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            ))
          )}
        </div>
        <aside>
          <section className="sem-cal" aria-label="Kalendar">
            <div className="hd">
              <button type="button" className="nav" aria-label="Oldingi oy" onClick={() => setCursor((value) => ({ year: value.month === 0 ? value.year - 1 : value.year, month: value.month === 0 ? 11 : value.month - 1 }))}>
                <ChevronLeft className="i" />
              </button>
              <h3>
                {MONTHS[cursor.month]} {cursor.year}
              </h3>
              <button type="button" className="nav" aria-label="Keyingi oy" onClick={() => setCursor((value) => ({ year: value.month === 11 ? value.year + 1 : value.year, month: value.month === 11 ? 0 : value.month + 1 }))}>
                <ChevronRight className="i" />
              </button>
            </div>
            <div className="sem-week">
              {WEEK.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="sem-days">
              {cells.map((day, index) => {
                if (!day) return <button key={`e${index}`} type="button" disabled />;
                const id = iso(cursor.year, cursor.month, day);
                const on = selected === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`${on ? "on" : ""} ${marked.has(id) ? "has" : ""}`}
                    aria-current={id === today.iso ? "date" : undefined}
                    onClick={() => pickDay(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="sem-box">
            <div className="hd">
              <h3>Mening seminarlarim</h3>
              <Link className="dk-link" href="/seminarlar/chiptalarim">
                Barchasini ko‘rish
              </Link>
            </div>
            {registrations.length === 0 ? (
              <p className="sem-why">
                <small>Hali yozilgan seminar yo‘q</small>
              </p>
            ) : (
              registrations.slice(0, 4).map((item) => {
                const seminar = getSeminar(item.seminarId);
                const when = seminar?.date?.split("-") ?? [];
                return (
                  <Link className="sem-mine" key={item.id} href={seminarHref(item.seminarId)}>
                    <span className="d">
                      <b>{when[2] ? String(Number(when[2])) : "—"}</b>
                      <span>{when[1] ? (MONTHS[Number(when[1]) - 1] ?? "").slice(0, 3) : ""}</span>
                    </span>
                    <span>
                      <b>{item.seminarTitle || seminar?.title || "Seminar"}</b>
                      <small>{seminar?.city ?? ""}</small>
                    </span>
                    <ChevronRight className="i" />
                  </Link>
                );
              })
            )}
          </section>
          <section className="sem-box">
            <h3>Nega seminarlarga qatnashish kerak?</h3>
            {whyAttend.map((item) => (
              <div className="sem-why" key={item.title}>
                <span className="ic">
                  <GraduationCap className="i" />
                </span>
                <span>
                  <b>{item.title}</b>
                  <small>{item.text}</small>
                </span>
              </div>
            ))}
          </section>
        </aside>
      </div>
    </ShopShell>
  );
}
