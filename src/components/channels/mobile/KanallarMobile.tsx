"use client";
/* eslint-disable @next/next/no-img-element -- channel avatars are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Crown, Lightbulb, Plus, Search, Send, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { channelPlatforms, channelTopics, mobileChannels, type ChannelPlatform, type ChannelTopic, type MobileChannel } from "@/data/mobile-channels";
import { formatMoney } from "@/lib/format";
import "../../books/mobile/books-mobile.css";

function Instagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
function Youtube() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.2s0-3.2-.4-4.6c-.2-.8-.9-1.5-1.7-1.7C18.4 5.5 12 5.5 12 5.5s-6.4 0-7.9.4c-.8.2-1.5.9-1.7 1.7C2 9 2 12.2 2 12.2s0 3.2.4 4.6c.2.8.9 1.5 1.7 1.7 1.5.4 7.9.4 7.9.4s6.4 0 7.9-.4c.8-.2 1.5-.9 1.7-1.7.4-1.4.4-4.6.4-4.6zM10 15.5v-6l5.2 3-5.2 3z" />
    </svg>
  );
}
const platformIcon = { telegram: Send, instagram: Instagram, youtube: Youtube } as const;

export function KanallarMobile() {
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<ChannelPlatform | "">("");
  const [topic, setTopic] = useState<"all" | ChannelTopic>("all");
  const [subs, setSubs] = useState<string[]>([]);
  const [extra, setExtra] = useState<MobileChannel[]>([]);
  const [filters, setFilters] = useState(false);
  const [minOffer, setMinOffer] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [bidFor, setBidFor] = useState<MobileChannel | null>(null);
  const [bid, setBid] = useState("");
  const [note, setNote] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    const floor = Number(minOffer.replace(/\s/g, ""));
    return [...mobileChannels, ...extra]
      .filter((item) => {
        if (platform && item.platform !== platform) return false;
        if (topic !== "all" && item.topic !== topic) return false;
        if (floor > 0 && item.offer < floor) return false;
        if (!q) return true;
        return `${item.handle} ${item.topicLabel}`.toLowerCase().replace("@", "").includes(q);
      })
      .sort((a, b) => b.offer - a.offer);
  }, [extra, minOffer, platform, query, topic]);

  return (
    <div className="fk lg:hidden" data-testid="mobile-kanallar">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-channel-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="fk-body">
        <h1 className="fk-title">Foydali kanallar</h1>
        <p className="fk-sub">Stomatologlar uchun eng yaxshi kanallar bir joyda</p>
        <p className="fk-sub">Kanalingizni qo‘shing — o‘rin auksion orqali</p>
        <div className="fk-tip">
          <Lightbulb />
          <span>Maslahat: Kanallar reytingi eng yuqori taklif asosida belgilanadi. Eng ko‘p taklif bergan kanal yuqori o‘ringa chiqadi.</span>
        </div>
        <form className="fk-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-channel-search data-section-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="@username yoki kanal nomi bilan qidirish..." aria-label="Qidiruv" />
          <button type="button" className="fk-filter" aria-label="Filtr" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </button>
        </form>
        <div className="fk-plats">
          {channelPlatforms.map((item) => {
            const Icon = platformIcon[item.id];
            return (
              <button key={item.id} type="button" className={`${item.id}${platform === item.id ? " on" : ""}`} onClick={() => setPlatform((value) => (value === item.id ? "" : item.id))}>
                <Icon /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="fk-cats" aria-label="Mavzular">
          {channelTopics.map((item) => (
            <button key={item.id} type="button" className={topic === item.id ? "on" : undefined} onClick={() => setTopic(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {note ? <p className="fk-note">{note}</p> : null}
        {list.length === 0 ? <p className="fk-note">Mos kanal topilmadi</p> : null}
        {list.map((item, index) => {
          const Icon = platformIcon[item.platform];
          const rank = index + 1;
          const on = subs.includes(item.id);
          return (
            <article key={item.id} className="fk-row">
              <div className={rank <= 3 ? "fk-rank gold" : "fk-rank"}>
                {rank <= 3 ? <Crown fill="currentColor" /> : null}
                {rank}
              </div>
              <div className="fk-ava">
                <img src={item.image} alt="" />
                <i className={item.platform}><Icon /></i>
              </div>
              <div>
                <h3>{item.handle}</h3>
                <span className="topic">{item.topicLabel}</span>
                <p>{item.subscribersLabel}</p>
              </div>
              <div className="fk-bid">
                <span>Eng yuqori taklif</span>
                <b>{formatMoney(item.offer, "UZS")}</b>
                <button type="button" className="link" onClick={() => { setBidFor(item); setBid(""); }}>O‘rinni olish</button>
                <button type="button" className={on ? "fk-subbtn on" : "fk-subbtn"} aria-pressed={on} onClick={() => setSubs((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))}>
                  Obuna
                </button>
              </div>
            </article>
          );
        })}
        <div className="fk-pad" />
      </div>
      <button type="button" className="fk-add" onClick={() => setAddOpen(true)}>
        <Plus /> Kanal qo‘shish
      </button>

      {filters ? (
        <div className="fk-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form className="fk-box" onSubmit={(event) => { event.preventDefault(); setFilters(false); }}>
            <h3>Filtr</h3>
            <input aria-label="Eng past taklif" inputMode="numeric" value={minOffer} onChange={(event) => setMinOffer(event.target.value)} placeholder="Eng past taklif" />
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => { setMinOffer(""); setFilters(false); }}>Tozalash</button>
              <button type="submit" className="go">Ko‘rish</button>
            </div>
          </form>
        </div>
      ) : null}

      {addOpen ? (
        <div className="fk-sheet" role="dialog" aria-label="Kanal qo‘shish">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setAddOpen(false)} />
          <form
            className="fk-box"
            onSubmit={(event) => {
              event.preventDefault();
              const name = handle.trim().replace(/^@/, "");
              if (!name) return;
              setExtra((current) => [
                { id: `ch-${name}`, handle: `@${name}`, topic: "umumiy", topicLabel: "Umumiy stomatologiya", platform: "telegram", subscribers: 0, subscribersLabel: "0 obunachi", offer: 0, image: "/img/mobile/se-sardor-face.jpg" },
                ...current,
              ]);
              setHandle("");
              setAddOpen(false);
              setNote("Kanal qo‘shildi");
            }}
          >
            <h3>Kanal qo‘shish</h3>
            <input aria-label="Username" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@username" />
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setAddOpen(false)}>Yopish</button>
              <button type="submit" className="go">Qo‘shish</button>
            </div>
          </form>
        </div>
      ) : null}

      {bidFor ? (
        <div className="fk-sheet" role="dialog" aria-label="O‘rinni olish">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setBidFor(null)} />
          <form
            className="fk-box"
            onSubmit={(event) => {
              event.preventDefault();
              if (!bid.trim()) return;
              setBidFor(null);
              setNote("Taklif yuborildi");
            }}
          >
            <h3>O‘rinni olish</h3>
            <p>{bidFor.handle}</p>
            <input aria-label="Taklif" inputMode="numeric" value={bid} onChange={(event) => setBid(event.target.value)} placeholder="Taklif, so‘m" />
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setBidFor(null)}>Yopish</button>
              <button type="submit" className="go">Yuborish</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
