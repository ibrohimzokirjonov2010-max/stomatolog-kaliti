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
  SlidersHorizontal,
  Users,
  Wifi,
} from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { isSeminarUpcoming, sortedSeminars, type Seminar } from "@/data/seminars";
import {
  mobileSeminarCats,
  mobileSeminars,
  type MobileSeminar,
  type MobileSeminarCat,
  type MobileSeminarFormat,
} from "@/data/mobile-seminars";
import { formatMoney } from "@/lib/format";
import "./seminar-mobile.css";

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

function dm(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/** An organizer's real seminar (seed catalog or database) drawn with the design card. */
function fromCatalog(s: Seminar): MobileSeminar {
  const online = s.city === "Online";
  const [y, m, d] = s.date.split("-").map(Number);
  const when = s.dateTbd ? "Sana aniqlanmoqda" : `${d} ${MONTHS[(m || 1) - 1]} ${y}, ${s.time}`;
  const old = s.oldPrice && s.oldPrice > s.price ? s.oldPrice : s.price;
  const cat = (["implantologiya", "endodontiya", "ortodontiya", "estetika", "jarrohlik"] as const).find((c) => c === (s.specialty as string)) ?? "implantologiya";
  return {
    id: s.id,
    realId: s.id,
    title: s.title,
    category: cat,
    format: online ? "onlayn" : "oflayn",
    formatLabel: online ? "Onlayn" : "Oflayn",
    kind: s.dateEnd && s.dateEnd !== s.date ? "Ko‘p kunlik seminar" : "Bir kunlik seminar",
    dateBadge: s.dateTbd ? "Tez orada" : s.dateEnd && s.dateEnd !== s.date ? `${dm(s.date)} – ${dm(s.dateEnd)}` : dm(s.date),
    when,
    cardWhen: when,
    time: `${s.time} – ${s.timeEnd}`,
    place: online ? "Onlayn" : [s.venue, s.city].filter(Boolean).join(", "),
    seats: s.seatsTotal,
    seatsLeft: Math.max(0, s.seatsTotal - s.seatsTaken),
    price: s.price,
    oldPrice: old,
    discount: old > s.price ? Math.round((1 - s.price / old) * 100) : 0,
    image: s.image,
    speaker: s.speaker || "Ma’ruzachi aniqlanmoqda",
    speakerRole: s.speakerRole,
    speakerOrg: "",
    speakerImage: s.speakerAvatar ?? "",
    about: s.description ?? "",
    aboutMore: "",
    features: [],
    stats: [],
    program: s.program ?? [],
    address: s.venue,
    day: s.date,
  };
}

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
  const favorites = useFavorites();
  const { catalogVersion } = useSeminarRegs();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<MobileSeminarCat>("all");
  const [week, setWeek] = useState(false);
  const [month, setMonth] = useState(false);
  const [formats, setFormats] = useState<MobileSeminarFormat[]>([]);
  const [filters, setFilters] = useState(false);
  const [city, setCity] = useState("");
  /** Design cards that advertise a real seminar, then other real seminars, then design samples. */
  const all = useMemo(() => {
    void catalogVersion;
    const mapped = new Set(mobileSeminars.map((item) => item.realId).filter(Boolean));
    const extra = sortedSeminars().filter((s) => !s.demo && !mapped.has(s.id) && isSeminarUpcoming(s)).map(fromCatalog);
    return [...mobileSeminars.filter((item) => item.realId), ...extra, ...mobileSeminars.filter((item) => !item.realId)];
  }, [catalogVersion]);
  const hero = all[0];
  const today = useMemo(() => new Date(new Date().toISOString().slice(0, 10) + "T00:00:00"), []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((item) => {
      if (cat !== "all" && item.category !== cat) return false;
      if (formats.length && !formats.includes(item.format)) return false;
      if (city === "toshkent" && !item.place.toLowerCase().includes("toshkent") && !item.place.toLowerCase().includes("academy")) return false;
      if (city === "onlayn" && item.format !== "onlayn") return false;
      const day = new Date(`${item.day}T00:00:00`);
      const ahead = (day.getTime() - today.getTime()) / 86400000;
      if (week && (ahead < 0 || ahead > 6)) return false;
      if (month && (day.getMonth() !== today.getMonth() || day.getFullYear() !== today.getFullYear())) return false;
      if (!q) return true;
      return `${item.title} ${item.speaker} ${item.place}`.toLowerCase().includes(q);
    });
  }, [all, cat, city, formats, month, query, today, week]);

  const shown = list.length;

  function toggleFormat(format: MobileSeminarFormat) {
    setFormats((current) => (current.includes(format) ? current.filter((item) => item !== format) : [...current, format]));
  }

  return (
    <div className="se lg:hidden" data-testid="mobile-seminars">
      <div className="se-body">
        <MobileBrandBar
          search
          extra={
            <Link href="/seminarlar/yozuvlarim" className="mb-ic square" aria-label="Mening seminarlarim" data-testid="seminar-my-calendar">
              <CalendarDays />
            </Link>
          }
        />
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
          <img src={hero.banner ?? hero.image} alt="" />
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
            saved={favorites.has(`seminar-${item.id}`)}
            onSave={() => favorites.toggle(`seminar-${item.id}`)}
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
    <article className="se-card" data-testid="se-card" data-real={item.realId ? "1" : undefined}>
      <div className="se-ph">
        <Link href={href} aria-label={item.title}>
          <img src={item.image} alt="" />
        </Link>
        <span className="se-badge">{item.dateBadge}</span>
        {!item.realId ? <span className="se-sample">Namuna</span> : null}
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
          <p>{item.realId && item.speakerOrg ? `${item.speakerOrg} · Tashkilotchi` : item.speaker}</p>
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
            {item.discount > 0 ? (
              <span>
                <em>-{item.discount}%</em>
                <s>{formatMoney(item.oldPrice, "UZS")}</s>
              </span>
            ) : null}
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
