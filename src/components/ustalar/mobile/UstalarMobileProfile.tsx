"use client";
/* eslint-disable @next/next/no-img-element -- usta photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, ChevronRight, Clock, Heart, MapPin, Phone, Share2, ShieldCheck, Star, Users, Wrench } from "lucide-react";
import { ustaReviewsOf, ustaServicesOf, type MobileUsta } from "@/data/mobile-ustalar";
import { formatMoney } from "@/lib/format";
import "@/components/mobile/mobile-ui.css";
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
  const [sample, setSample] = useState(false);
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
              <span className="ut-live off" data-testid="ut-sample-badge">Namuna</span>
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
                <button key={row.name} type="button" data-testid="ut-svc" onClick={() => { setSample(true); setNote(""); }}>
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
            <p>Shahar: {item.city}</p>
            <p>Tajriba: {item.years} yil</p>
            <p>Kafolat: {item.warranty ?? "1 yil"}</p>
          </div>
        ) : null}
        <div className="ut-pad profile" />
      </div>
      <div className="ut-buy" data-testid="ut-buy">
        <button type="button" className="ut-call" data-testid="ut-call" onClick={() => setSample(true)}><Phone /> Qo‘ng‘iroq</button>
        <button type="button" className="ut-order" data-testid="ut-order" onClick={() => setSample(true)}><CalendarDays /> Buyurtma berish</button>
      </div>
      {sample ? (
        <div className="mb-sheet" role="dialog" aria-label="Namuna usta" data-testid="ut-info-sample">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setSample(false)} />
          <div className="mb-panel">
            <h3>Namuna profil</h3>
            <p>Bu profil bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan — u haqiqiy usta emas, unga qo‘ng‘iroq yoki buyurtma qilib bo‘lmaydi.</p>
            <p>Tasdiqlangan ustalar «Ustalar» ro‘yxati boshida chiqadi — ularga so‘rov shu yerdan yuboriladi.</p>
            <div className="row">
              <button type="button" onClick={() => setSample(false)}>Yopish</button>
              <Link className="go" href="/ustalar">Ustalar ro‘yxati</Link>
            </div>
          </div>
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
