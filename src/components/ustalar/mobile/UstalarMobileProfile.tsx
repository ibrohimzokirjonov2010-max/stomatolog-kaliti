"use client";
/* eslint-disable @next/next/no-img-element -- usta photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, ChevronRight, Clock, Heart, MapPin, Phone, Share2, ShieldCheck, Star, Users, Wrench } from "lucide-react";
import { ustaReviewsOf, ustaServicesOf, type MobileUsta } from "@/data/mobile-ustalar";
import { formatMoney } from "@/lib/format";
import "./ustalar-mobile.css";

const tabs = [
  { id: "xizmat", label: "Xizmatlar" },
  { id: "ish", label: "Ishlar" },
  { id: "sharh", label: "Sharhlar" },
  { id: "info", label: "Ma‘lumot" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function UstalarMobileProfile({ item }: { item: MobileUsta }) {
  const services = ustaServicesOf(item);
  const reviews = ustaReviewsOf(item);
  const [tab, setTab] = useState<TabId>("xizmat");
  const [saved, setSaved] = useState(false);
  const [service, setService] = useState(services[0]?.name ?? item.role);
  const [book, setBook] = useState(false);
  const [note, setNote] = useState("");
  const online = item.status === "onlayn";

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.name, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      setNote(url);
    }
  }

  const stats = [
    { icon: Wrench, value: item.jobs ?? "100+", label: "Bajarilgan ishlar" },
    { icon: Users, value: `${item.reviews} ta`, label: "Baho va sharh" },
    { icon: ShieldCheck, value: item.warranty ?? "1 yil", label: "Kafolat" },
    { icon: Clock, value: item.speed ?? "Tez", label: "Xizmat ko‘rsatish" },
  ];

  return (
    <div className="ut lg:hidden" data-testid="mobile-ustalar-profile">
      <div className="ut-hero">
        <img src={item.hero} alt="" />
        <Link href="/ustalar" className="ut-float back" aria-label="Orqaga"><ArrowLeft /></Link>
        <button type="button" className={saved ? "ut-float heart on" : "ut-float heart"} aria-label="Saqlash" aria-pressed={saved} onClick={() => setSaved((value) => !value)}><Heart fill={saved ? "currentColor" : "none"} /></button>
        <button type="button" className="ut-float share" aria-label="Ulashish" onClick={() => void share()}><Share2 /></button>
      </div>
      <div className="ut-body">
        <article className="ut-profile">
          <div className="ut-ava">
            <img src={item.avatar} alt="" />
            <i className={online ? "ut-dot on" : "ut-dot"} />
          </div>
          <div className="ut-who">
            <div className="ut-who-top">
              <h1>{item.name}{item.verified ? <BadgeCheck aria-label="Tasdiqlangan" /> : null}</h1>
              <span className={online ? "ut-live" : "ut-live off"}>{online ? "Onlayn" : "Band"}</span>
            </div>
            <p className="ut-role">{item.role}</p>
            <p className="ut-meta">
              <span><Star className="star" /> {item.rating.toFixed(1)} ({item.reviews} ta baho)</span>
              <span>{item.years} yil tajriba</span>
              <span><MapPin /> {item.city}</span>
            </p>
            <div className="ut-skills">
              {item.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          </div>
        </article>
        <div className="ut-stats">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label}>
                <Icon />
                <b>{stat.value}</b>
                {stat.label}
              </article>
            );
          })}
        </div>
        <div className="ut-tabs" role="tablist" aria-label="Usta bo‘limlari">
          {tabs.map((entry) => (
            <button key={entry.id} type="button" role="tab" aria-selected={tab === entry.id} className={tab === entry.id ? "on" : undefined} onClick={() => setTab(entry.id)}>
              {entry.label}
            </button>
          ))}
        </div>
        {note ? <p className="ut-note">{note}</p> : null}
        {tab === "xizmat" ? (
          <>
            <div className="ut-sec"><h2>Xizmatlar va narxlar</h2></div>
            <div className="ut-svc">
              {services.map((row) => (
                <button key={row.name} type="button" onClick={() => { setService(row.name); setBook(true); setNote(""); }}>
                  <img src={row.image} alt="" />
                  <span><b>{row.name}</b>{row.note}</span>
                  <em>{formatMoney(row.price, "UZS")}</em>
                  <ChevronRight />
                </button>
              ))}
            </div>
            <Works item={item} onAll={() => setTab("ish")} />
            <Reviews reviews={reviews.slice(0, 1)} onAll={() => setTab("sharh")} />
          </>
        ) : null}
        {tab === "ish" ? <Works item={item} /> : null}
        {tab === "sharh" ? <Reviews reviews={reviews} /> : null}
        {tab === "info" ? (
          <div className="ut-about">
            <p>{item.about}</p>
            <p>Telefon: <a href={`tel:${item.phone}`}>{item.phone}</a></p>
            <p>Shahar: {item.city}</p>
            <p>Tajriba: {item.years} yil</p>
            <p>Kafolat: {item.warranty ?? "1 yil"}</p>
          </div>
        ) : null}
        <div className="ut-pad profile" />
      </div>
      <div className="ut-buy" data-testid="ut-buy">
        <a className="ut-call" href={`tel:${item.phone}`}><Phone /> Qo‘ng‘iroq</a>
        <button type="button" className="ut-order" onClick={() => { setBook(true); setNote(""); }}><CalendarDays /> Buyurtma berish</button>
      </div>
      {book ? (
        <div className="ut-sheet" role="dialog" aria-label="Buyurtma berish">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setBook(false)} />
          <BookingForm
            item={item}
            service={service}
            onService={setService}
            onClose={() => setBook(false)}
            onDone={() => { setBook(false); setNote("Buyurtma qoldirildi"); }}
          />
        </div>
      ) : null}
    </div>
  );
}

function Works({ item, onAll }: { item: MobileUsta; onAll?: () => void }) {
  return (
    <>
      <div className="ut-sec">
        <h2>Bajarilgan ishlar</h2>
        {onAll ? <button type="button" className="ut-link" onClick={onAll}>Barchasini ko‘rish →</button> : null}
      </div>
      <div className="ut-works">
        {(onAll ? item.works.slice(0, 5) : item.works).map((src, index) => <img key={`${item.id}-work-${index}`} src={src} alt="" />)}
      </div>
    </>
  );
}

function Reviews({ reviews, onAll }: { reviews: { name: string; date: string; rating: number; text: string }[]; onAll?: () => void }) {
  return (
    <>
      <div className="ut-sec">
        <h2>Mijozlar sharhlari</h2>
        {onAll ? <button type="button" className="ut-link" onClick={onAll}>Barchasini ko‘rish →</button> : null}
      </div>
      {reviews.map((review) => (
        <article key={`${review.name}-${review.date}`} className="ut-review">
          <i>{review.name.slice(0, 1)}</i>
          <div>
            <div className="ut-rev-top">
              <b>{review.name}</b>
              <span className="when">{review.date}</span>
            </div>
            <p className="ut-stars">{"★".repeat(review.rating)}{"☆".repeat(Math.max(0, 5 - review.rating))}</p>
            <p>{review.text}</p>
          </div>
        </article>
      ))}
    </>
  );
}

function BookingForm({
  item,
  service,
  onService,
  onDone,
}: {
  item: MobileUsta;
  service: string;
  onService: (value: string) => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const services = ustaServicesOf(item);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  return (
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
      <input aria-label="Ism" placeholder="Ism" value={name} onChange={(event) => setName(event.target.value)} />
      <input aria-label="Telefon" placeholder="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <select aria-label="Xizmat" value={service} onChange={(event) => onService(event.target.value)}>
        {services.map((row) => <option key={row.name}>{row.name}</option>)}
      </select>
      <input aria-label="Sana" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <textarea aria-label="Izoh" placeholder="Izoh" rows={3} value={text} onChange={(event) => setText(event.target.value)} />
      {error ? <p className="ut-err">{error}</p> : null}
      <button type="submit" className="go">Yuborish</button>
    </form>
  );
}
