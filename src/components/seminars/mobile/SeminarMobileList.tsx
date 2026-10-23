"use client";
/* eslint-disable @next/next/no-img-element -- seminar photos are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Award,
  Bookmark,
  CalendarDays,
  ChevronRight,
  LayoutGrid,
  MapPin,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Users,
  Wifi,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import {
  MOBILE_SEMINAR_TOTAL,
  mobileSeminarCats,
  mobileSeminars,
  type MobileSeminar,
  type MobileSeminarCat,
  type MobileSeminarFormat,
} from "@/data/mobile-seminars";
import { formatMoney } from "@/lib/format";
import "./seminar-mobile.css";

const TODAY = new Date("2026-10-16T00:00:00");

function Tooth({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
    </svg>
  );
}

const catIcon = {
  all: LayoutGrid,
  implantologiya: Tooth,
  endodontiya: Tooth,
  ortodontiya: Tooth,
  estetika: Tooth,
  jarrohlik: Tooth,
} as const;

export function SeminarMobileList() {
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<MobileSeminarCat>("all");
  const [week, setWeek] = useState(false);
  const [month, setMonth] = useState(false);
  const [formats, setFormats] = useState<MobileSeminarFormat[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [filters, setFilters] = useState(false);
  const [city, setCity] = useState("");
  const badge = count > 0 ? count : 3;
  const hero = mobileSeminars[0];

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mobileSeminars.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (formats.length && !formats.includes(item.format)) return false;
      if (city === "toshkent" && !item.place.toLowerCase().includes("toshkent") && !item.place.toLowerCase().includes("academy")) return false;
      if (city === "onlayn" && item.format !== "onlayn") return false;
      const day = new Date(`${item.day}T00:00:00`);
      const ahead = (day.getTime() - TODAY.getTime()) / 86400000;
      if (week && (ahead < 0 || ahead > 6)) return false;
      if (month && day.getMonth() !== TODAY.getMonth()) return false;
      if (!q) return true;
      return `${item.title} ${item.speaker} ${item.place}`.toLowerCase().includes(q);
    });
  }, [cat, city, formats, month, query, week]);

  const narrowed = cat !== "all" || formats.length > 0 || week || month || Boolean(query.trim()) || Boolean(city);
  const shown = narrowed ? list.length : MOBILE_SEMINAR_TOTAL;

  function toggleFormat(format: MobileSeminarFormat) {
    setFormats((current) => (current.includes(format) ? current.filter((item) => item !== format) : [...current, format]));
  }

  return (
    <div className="se lg:hidden" data-testid="mobile-seminars">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">
          STOMA<span>HUB</span>
        </Link>
        <button type="button" className="mh-ic" aria-label="Kalendar" onClick={() => document.getElementById("se-list")?.scrollIntoView({ behavior: "smooth" })}>
          <CalendarDays />
        </button>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-seminar-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          <span className="mh-badge" data-testid="se-cart-badge">
            {badge > 9 ? "9+" : badge}
          </span>
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>

      <div className="se-body">
        <form className="se-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input
            data-seminar-search
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Seminar, ma’ruzachi yoki shahar..."
            aria-label="Qidiruv"
          />
          <button type="button" className="se-filter" aria-label="Filtr" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </button>
        </form>

        <Link href={`/seminarlar/${hero.id}`} className="se-hero">
          <img src={hero.image} alt="" />
          <span className="veil" />
          <span className="copy">
            <span className="se-top">
              <Award /> TOP SEMINAR
            </span>
            <h2>{hero.title}</h2>
            <p>
              <CalendarDays /> {hero.when}
            </p>
            <p>
              <MapPin /> {hero.place}
            </p>
            <p>
              <Users /> {hero.seats} o‘rin
            </p>
            <span className="cta">
              Ro‘yxatdan o‘tish <ChevronRight />
            </span>
          </span>
          <span className="who">
            <b>{hero.speaker}</b>
            <span>{hero.speakerOrg} · Tashkilotchi</span>
          </span>
        </Link>

        <div className="se-head">
          <h2>Kategoriyalar</h2>
          <button type="button" onClick={() => setCat("all")}>
            Barchasini ko‘rish
          </button>
        </div>
        <div className="se-cats" aria-label="Kategoriyalar">
          {mobileSeminarCats.map((item) => {
            const Icon = catIcon[item.id];
            return (
              <button key={item.id} type="button" className={cat === item.id ? "on" : undefined} onClick={() => setCat(item.id)}>
                <i>
                  <Icon />
                </i>
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="se-chips">
          <button type="button" className={week ? "on" : undefined} onClick={() => setWeek((value) => !value)}>
            <CalendarDays /> Bu hafta
          </button>
          <button type="button" className={month ? "on" : undefined} onClick={() => setMonth((value) => !value)}>
            <CalendarDays /> Bu oy
          </button>
          <button type="button" className={formats.includes("oflayn") ? "on" : undefined} onClick={() => toggleFormat("oflayn")}>
            <MapPin /> Oflayn
          </button>
          <button type="button" className={formats.includes("onlayn") ? "on" : undefined} onClick={() => toggleFormat("onlayn")}>
            <Wifi /> Onlayn
          </button>
        </div>

        <div className="se-head" id="se-list">
          <h2>Yaqinlashib kelayotgan seminarlar</h2>
          <span className="se-count" data-testid="se-count">
            {shown}
          </span>
        </div>

        {list.length === 0 ? <p className="se-note">Mos seminar topilmadi</p> : null}
        {list.map((item) => (
          <SeminarRow
            key={item.id}
            item={item}
            saved={saved.includes(item.id)}
            onSave={() => setSaved((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))}
          />
        ))}
      </div>

      {filters ? (
        <div className="se-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form
            className="se-panelbox"
            onSubmit={(event) => {
              event.preventDefault();
              setFilters(false);
            }}
          >
            <h3>Filtr</h3>
            <select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Barcha joylar</option>
              <option value="toshkent">Toshkent</option>
              <option value="onlayn">Onlayn</option>
            </select>
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => { setCity(""); setFilters(false); }}>
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

function SeminarRow({ item, saved, onSave }: { item: MobileSeminar; saved: boolean; onSave: () => void }) {
  const href = `/seminarlar/${item.id}`;
  return (
    <article className="se-card">
      <div className="se-ph">
        <Link href={href} aria-label={item.title}>
          <img src={item.image} alt="" />
        </Link>
        <span className="se-badge">{item.dateBadge}</span>
        <button type="button" className={saved ? "se-mark on" : "se-mark"} aria-label="Saqlash" aria-pressed={saved} onClick={onSave}>
          <Bookmark fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div>
        <div className="se-pills">
          <span>{item.formatLabel}</span>
          <span className="soft">{item.kind}</span>
        </div>
        <Link href={href}>
          <h3>{item.title}</h3>
        </Link>
        <div className="se-meta">
          <p>{item.speaker === "Dr. Sardorbek Rahimov" ? `${item.speakerOrg} · Tashkilotchi` : item.speaker}</p>
          <p>
            <CalendarDays /> {item.cardWhen}
          </p>
          <p>
            <MapPin /> {item.place}
          </p>
          <p>
            <Users /> {item.seats} o‘rin
          </p>
        </div>
        <div className="se-price">
          <div>
            <span>
              <em>-{item.discount}%</em>
              <s>{formatMoney(item.oldPrice, "UZS")}</s>
            </span>
            <b>{formatMoney(item.price, "UZS")}</b>
          </div>
          <Link href={href} className="se-go">
            Ro‘yxatdan o‘tish <ChevronRight />
          </Link>
        </div>
      </div>
    </article>
  );
}
