"use client";
/* eslint-disable @next/next/no-img-element -- usta photos are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, BadgeCheck, CalendarDays, ChevronDown, MapPin, Phone, Search, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { mobileUstalar, ustaKinds, ustaServicesOf, type MobileUsta, type UstaKind } from "@/data/mobile-ustalar";
import { formatMoney } from "@/lib/format";
import "./ustalar-mobile.css";

function KindIcon({ id }: { id: "all" | UstaKind }) {
  if (id === "all") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (id === "kreslo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M14.5 5.5 18.5 9.5" />
        <path d="m8 8 8 8" />
        <path d="M6.5 9.5 4 12l2 2 2.5-2.5" />
        <path d="m14.5 15.5 2.5 2.5 2-2-2.5-2.5" />
      </svg>
    );
  }
  if (id === "rentgen") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 5c1.2 2 2.2 2.2 4 2.2S14.8 7 16 5" />
        <path d="M9 9.5c.8 3 1.6 4.5 3 4.5s2.2-1.5 3-4.5" />
        <path d="M10.2 14.2 9 20h6l-1.2-5.8" />
      </svg>
    );
  }
  if (id === "ornatish") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M14 6.5 17.5 10" />
        <path d="m7 13.5 6.2-6.2a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8L10.5 17" />
        <path d="M6 18.5h5" />
      </svg>
    );
  }
  if (id === "tamirlash") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M6 16.5c0-3 2.2-5 6-5s6 2 6 5" />
      <path d="M8 8.5a2 2 0 1 0 0.1 0M16 8.5a2 2 0 1 0 .1 0" />
      <path d="M5 17.5h14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Z" />
    </svg>
  );
}

export function UstalarMobileList() {
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | UstaKind>("all");
  const [city, setCity] = useState("Toshkent");
  const [spec, setSpec] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [booking, setBooking] = useState<MobileUsta | null>(null);
  const [find, setFind] = useState(false);
  const [note, setNote] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = Number(maxPrice);
    const rows = mobileUstalar.filter((item) => {
      if (kind !== "all" && !item.kinds.includes(kind)) return false;
      if (city !== "all" && item.city !== city) return false;
      if (spec && !item.kinds.includes(spec as UstaKind)) return false;
      if (cap > 0 && item.fromPrice > cap) return false;
      if (!q) return true;
      return `${item.name} ${item.role} ${item.city} ${item.skills.join(" ")}`.toLowerCase().includes(q);
    });
    if (sort === "reyting") rows.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    else if (sort === "arzon") rows.sort((a, b) => a.fromPrice - b.fromPrice);
    else if (sort === "tajriba") rows.sort((a, b) => b.years - a.years);
    else rows.sort((a, b) => a.rank - b.rank);
    return rows;
  }, [city, kind, maxPrice, query, sort, spec]);

  return (
    <div className="ut lg:hidden" data-testid="mobile-ustalar">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMA<span>HUB</span></Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-usta-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="ut-body">
        <h1 className="ut-title">Ustalar</h1>
        <p className="ut-sub">Stomatologik uskunalar ta‘mirlash ustalari</p>
        <form className="ut-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-usta-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Usta, mutaxassis yoki xizmatni qidiring..." aria-label="Qidiruv" />
        </form>
        <div className="ut-cats" aria-label="Kategoriyalar">
          {ustaKinds.map((item) => (
            <button key={item.id} type="button" className={kind === item.id ? "on" : undefined} aria-pressed={kind === item.id} onClick={() => setKind(item.id)}>
              <i><KindIcon id={item.id} /></i>
              {item.label}
            </button>
          ))}
        </div>
        <div className="ut-drops">
          <label>
            <MapPin />
            <select className="s-city" aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="Toshkent">Toshkent</option>
              <option value="Samarqand">Samarqand</option>
              <option value="all">Barchasi</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <select className="s-spec" aria-label="Mutaxassislik" value={spec} onChange={(event) => setSpec(event.target.value)}>
              <option value="">Mutaxassislik</option>
              {ustaKinds.filter((item) => item.id !== "all").map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <ChevronDown />
          </label>
          <label>
            <select className="s-price" aria-label="Narx" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
              <option value="">Narx</option>
              <option value="200000">200 ming</option>
              <option value="300000">300 ming</option>
              <option value="500000">500 ming</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <ArrowUpDown />
            <select className="s-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="">Saralash</option>
              <option value="reyting">Reyting</option>
              <option value="arzon">Arzon</option>
              <option value="tajriba">Tajriba</option>
            </select>
            <ChevronDown />
          </label>
        </div>
        {note ? <p className="ut-note">{note}</p> : null}
        <div className="ut-list">
          {list.length === 0 ? <p className="ut-sub">Usta topilmadi</p> : null}
          {list.map((item) => (
            <article key={item.id} className="ut-card" data-testid={`ut-card-${item.id}`}>
              <Link href={`/ustalar/${item.id}`} className="ut-photo">
                <img src={item.image} alt="" />
                <span className={item.status === "onlayn" ? "ut-badge on" : "ut-badge off"}>{item.status === "onlayn" ? "Onlayn" : "Band"}</span>
              </Link>
              <div className="ut-main">
                <Link href={`/ustalar/${item.id}`} className="ut-copy">
                  <h2>{item.name}{item.verified ? <BadgeCheck aria-label="Tasdiqlangan" /> : null}</h2>
                  <p className="ut-role">{item.role}</p>
                  <p className="ut-meta">
                    <span><Star className="star" /> {item.rating.toFixed(1)} ({item.reviews} ta baho)</span>
                  </p>
                  <p className="ut-meta">
                    <span>{item.years} yil tajriba</span>
                    <span><MapPin /> {item.city}</span>
                  </p>
                  <div className="ut-row">
                    <div className="ut-skills">
                      {item.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}
                    </div>
                    <div className="ut-thumbs">
                      {item.works.slice(0, 2).map((src, index) => <img key={`${item.id}-${index}`} src={src} alt="" />)}
                      <b>+{item.extraPhotos}</b>
                    </div>
                  </div>
                  <p className="ut-price">Xizmat narxi: <b>{formatMoney(item.fromPrice, "UZS")}</b> dan</p>
                </Link>
                <div className="ut-actions">
                  <a className="ut-call" href={`tel:${item.phone}`}><Phone /> Qo‘ng‘iroq</a>
                  <button type="button" className="ut-order" onClick={() => { setBooking(item); setNote(""); }}><CalendarDays /> Buyurtma berish</button>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="ut-pad" />
      </div>
      <button type="button" className="ut-find" onClick={() => { setFind(true); setNote(""); }}>
        + Usta topish yoki so‘rov qoldirish →
      </button>
      {booking ? (
        <BookingSheet
          item={booking}
          onClose={() => setBooking(null)}
          onDone={() => { setBooking(null); setNote("Buyurtma qoldirildi"); }}
        />
      ) : null}
      {find ? <FindSheet onClose={() => setFind(false)} onDone={() => { setFind(false); setNote("So‘rov qoldirildi"); }} /> : null}
    </div>
  );
}

function BookingSheet({ item, onClose, onDone }: { item: MobileUsta; onClose: () => void; onDone: () => void }) {
  const services = ustaServicesOf(item);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(services[0]?.name ?? item.role);
  const [date, setDate] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="ut-sheet" role="dialog" aria-label="Buyurtma berish">
      <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={onClose} />
      <form
        className="ut-box"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            setError("Ismni kiriting");
            return;
          }
          onDone();
        }}
      >
        <h3>Buyurtma berish</h3>
        <p className="ut-role">{item.name}</p>
        <input aria-label="Ism" placeholder="Ism" value={name} onChange={(event) => setName(event.target.value)} />
        <input aria-label="Telefon" placeholder="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <select aria-label="Xizmat" value={service} onChange={(event) => setService(event.target.value)}>
          {services.map((row) => <option key={row.name}>{row.name}</option>)}
        </select>
        <input aria-label="Sana" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <textarea aria-label="Izoh" placeholder="Izoh" rows={3} value={text} onChange={(event) => setText(event.target.value)} />
        {error ? <p className="ut-err">{error}</p> : null}
        <button type="submit" className="go">Yuborish</button>
      </form>
    </div>
  );
}

function FindSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="ut-sheet" role="dialog" aria-label="So‘rov qoldirish">
      <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={onClose} />
      <form
        className="ut-box"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) {
            setError("Ismni kiriting");
            return;
          }
          onDone();
        }}
      >
        <h3>So‘rov qoldirish</h3>
        <input aria-label="Ism" placeholder="Ism" value={name} onChange={(event) => setName(event.target.value)} />
        <input aria-label="Telefon" placeholder="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <textarea aria-label="Izoh" placeholder="Qanday usta kerak?" rows={3} value={text} onChange={(event) => setText(event.target.value)} />
        {error ? <p className="ut-err">{error}</p> : null}
        <button type="submit" className="go">Yuborish</button>
      </form>
    </div>
  );
}
