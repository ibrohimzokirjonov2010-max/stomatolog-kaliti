"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Crown, Gavel, Plus, Search, Send, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useChannels } from "@/components/channels-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { channelCategories, channelCategoryLabel, MIN_CHANNEL_BID, type Channel, type ChannelCategory } from "@/data/channels";
import { minBidToOutrank } from "@/lib/channels-work";
import { formatGroupedNumber } from "@/lib/format";
import "../../books/mobile/books-mobile.css";
import "./kanallar-mobile.css";

const CROWN = ["#f5a524", "#94a3b8", "#c2733a"];

/** Phone /foydali-kanallar (mock "foydali kanallar telefon"): ranking by the place auction. */
export function KanallarMobile() {
  const { count } = useCart();
  const { ready, channels, add, bid } = useChannels();
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<"all" | ChannelCategory>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [bidFor, setBidFor] = useState<Channel | null>(null);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState<ChannelCategory | "">("");
  const [note, setNote] = useState("");

  const rank = useMemo(() => new Map(channels.map((item, index) => [item.id, index + 1])), [channels]);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    return channels.filter((item) => {
      if (topic !== "all" && item.category !== topic) return false;
      if (!q) return true;
      return `${item.username} ${item.name}`.toLowerCase().replace("@", "").includes(q);
    });
  }, [channels, query, topic]);
  const minTop = minBidToOutrank(channels, 1);

  function openBid(item: Channel) {
    setBidFor(item);
    setAmount(String(minTop));
    setNote("");
  }

  return (
    <div className="fk lg:hidden" data-testid="mobile-kanallar">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMA<span>HUB</span></Link>
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
        <p className="fk-lead">Kanalingizni qo‘shing — o‘rin auksion orqali</p>
        <div className="fk-tip">
          <Crown />
          <span><b>Maslahat:</b> Kanallar reytingi eng yuqori taklif asosida belgilanadi. Eng ko‘p taklif bergan kanal yuqori o‘ringa chiqadi.</span>
        </div>
        <form className="fk-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-channel-search data-section-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="@username yoki kanal nomi bilan qidirish..." aria-label="Qidiruv" />
        </form>
        <div className="fk-cats" aria-label="Mavzular">
          <button type="button" className={topic === "all" ? "on" : undefined} onClick={() => setTopic("all")}>Barchasi</button>
          {channelCategories.map((item) => (
            <button key={item.id} type="button" className={topic === item.id ? "on" : undefined} onClick={() => setTopic(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        {note ? <p className="fk-note">{note}</p> : null}
        {!ready ? <p className="fk-note">Yuklanmoqda...</p> : null}
        {ready && list.length === 0 ? (
          <p className="fk-note" data-testid="channels-mobile-empty">{channels.length === 0 ? "Hozircha kanal yo‘q" : "Mos kanal topilmadi"}</p>
        ) : null}
        <ul className="fk-list">
          {list.map((item) => {
            const place = rank.get(item.id) ?? 0;
            const handleText = item.username.startsWith("@") ? item.username : `@${item.username}`;
            return (
              <li key={item.id} className="fk-card">
                <span className="fk-rank">
                  {place <= 3 ? <Crown style={{ color: CROWN[place - 1], fill: CROWN[place - 1] }} /> : null}
                  <i className={place <= 3 ? `top t${place}` : ""}>{place}</i>
                </span>
                <span className="fk-ava" style={{ background: item.avatarColor || "#0b7f7d" }}>
                  {item.name.slice(0, 1).toUpperCase()}
                  <em><Send /></em>
                </span>
                <span className="fk-info">
                  <b>{handleText}</b>
                  <small className="fk-cat">{channelCategoryLabel[item.category] ?? "Umumiy"}</small>
                  <small className="fk-name">{item.name}</small>
                </span>
                <span className="fk-bid">
                  <small>Eng yuqori taklif</small>
                  <b>{formatGroupedNumber(item.bidSum)} so‘m</b>
                  <button type="button" onClick={() => openBid(item)}><Gavel /> O‘rinni olish <ChevronRight /></button>
                </span>
                <a className={place === 1 ? "fk-sub-btn on" : "fk-sub-btn"} href={`https://t.me/${handleText.slice(1)}`} target="_blank" rel="noreferrer">Obuna</a>
              </li>
            );
          })}
        </ul>
        <div className="fk-pad" />
      </div>
      <button type="button" className="fk-add" onClick={() => { setAddOpen(true); setNote(""); }}>
        <Plus /> Kanal qo‘shish
      </button>

      {bidFor ? (
        <div className="fk-sheet" role="dialog" aria-label="O‘rinni olish">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setBidFor(null)} />
          <form
            className="fk-box"
            onSubmit={(event) => {
              event.preventDefault();
              const res = bid(bidFor.id, Number(amount.replace(/\D/g, "")));
              if (!res.ok) {
                setNote(res.reason === "too_low" ? `Taklif kamida ${formatGroupedNumber(res.minRequired)} so‘m bo‘lishi kerak` : "Taklifni yuborib bo‘lmadi");
                return;
              }
              setBidFor(null);
            }}
          >
            <h3>{bidFor.username} — 1-o‘rin</h3>
            <p className="fk-hint">Hozirgi eng yuqori taklif: {formatGroupedNumber(channels[0]?.bidSum ?? MIN_CHANNEL_BID)} so‘m. 1-o‘rin uchun kamida {formatGroupedNumber(minTop)} so‘m.</p>
            <input aria-label="Taklif summasi" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/\D/g, "").slice(0, 9))} />
            {note ? <p className="fk-hint err">{note}</p> : null}
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setBidFor(null)}>Yopish</button>
              <button type="submit" className="go">Taklif berish</button>
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
              if (handle.trim().replace(/^@/, "").length < 3 || !category) {
                setNote("Username va mavzuni kiriting");
                return;
              }
              const res = add({ username: handle, name, category });
              if (!res.ok) {
                setNote(res.reason === "duplicate" ? "Bu kanal allaqachon bor" : res.reason === "auth" ? "Avval tizimga kiring" : "Username noto‘g‘ri");
                return;
              }
              setName("");
              setHandle("");
              setCategory("");
              setAddOpen(false);
            }}
          >
            <h3>Kanal qo‘shish</h3>
            <input aria-label="Nomi" value={name} onChange={(event) => setName(event.target.value)} placeholder="Kanal nomi" />
            <input aria-label="Username" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@username" />
            <select aria-label="Mavzu" value={category} onChange={(event) => setCategory(event.target.value as ChannelCategory | "")}>
              <option value="">Mavzuni tanlang</option>
              {channelCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            {note ? <p className="fk-hint err">{note}</p> : null}
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#24344d" }} onClick={() => setAddOpen(false)}>Yopish</button>
              <button type="submit" className="go">Qo‘shish</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
