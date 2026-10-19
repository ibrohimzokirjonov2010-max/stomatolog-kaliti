"use client";
/* eslint-disable @next/next/no-img-element -- channel avatars are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Crown, Lightbulb, Plus, Search, Send, SlidersHorizontal } from "lucide-react";
import { useChannels } from "@/components/channels-provider";
import { MobileBrandBar } from "@/components/mobile/MobileBrandBar";
import { channelCategories, channelCategoryLabel, type Channel, type ChannelCategory } from "@/data/channels";
import { minBidToOutrank } from "@/lib/channels-work";
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

type Row = MobileChannel & { real?: Channel };

const TOPIC: Partial<Record<ChannelCategory, ChannelTopic>> = { implantologiya: "implantologiya", endodontiya: "endodontiya", ortodontiya: "ortodontiya", talim: "talim", umumiy: "umumiy" };

/** A real (seed or community-added) Telegram channel, with the design avatar when the handle matches. */
function fromChannel(c: Channel): Row {
  const look = mobileChannels.find((m) => m.handle.toLowerCase() === c.username.toLowerCase());
  return {
    id: c.id,
    handle: c.username,
    topic: look?.topic ?? TOPIC[c.category] ?? "umumiy",
    topicLabel: look?.topicLabel ?? channelCategoryLabel[c.category] ?? "Umumiy",
    platform: "telegram",
    subscribers: look?.subscribers ?? 0,
    subscribersLabel: look?.subscribersLabel ?? c.name,
    offer: c.bidSum,
    image: look?.image ?? "",
    real: c,
  };
}

export function KanallarMobile() {
  const work = useChannels();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ChannelCategory | "">("");
  const [bidError, setBidError] = useState("");
  const [platform, setPlatform] = useState<ChannelPlatform | "">("");
  const [topic, setTopic] = useState<"all" | ChannelTopic>("all");
  const [filters, setFilters] = useState(false);
  const [minOffer, setMinOffer] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [bidFor, setBidFor] = useState<Row | null>(null);
  const [bid, setBid] = useState("");
  const [sample, setSample] = useState<MobileChannel | null>(null);
  const [tip, setTip] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    const floor = Number(minOffer.replace(/\s/g, ""));
    const real = work.channels.map(fromChannel);
    const known = new Set(real.map((r) => r.handle.toLowerCase()));
    const rows: Row[] = [...real, ...mobileChannels.filter((m) => !known.has(m.handle.toLowerCase()))];
    return rows
      .filter((item) => {
        if (platform && item.platform !== platform) return false;
        if (topic !== "all" && item.topic !== topic) return false;
        if (floor > 0 && item.offer < floor) return false;
        if (!q) return true;
        return `${item.handle} ${item.topicLabel}`.toLowerCase().replace("@", "").includes(q);
      })
      .sort((a, b) => b.offer - a.offer);
  }, [minOffer, platform, query, topic, work.channels]);
  const minBid = minBidToOutrank(work.channels, 1);

  function subscribe(item: Row) {
    if (item.real) {
      window.open(`https://t.me/${item.real.username.replace(/^@/, "")}`, "_blank", "noopener");
      return;
    }
    setSample(item);
  }

  function takeSpot(item: Row) {
    if (!item.real) {
      setSample(item);
      return;
    }
    setBidFor(item);
    setBid(String(minBid));
    setBidError("");
  }

  return (
    <div className="fk lg:hidden" data-testid="mobile-kanallar">
      <div className="fk-body">
        <MobileBrandBar search />
        <h1 className="fk-title">Foydali kanallar</h1>
        <p className="fk-sub">Stomatologlar uchun eng yaxshi kanallar bir joyda</p>
        <p className="fk-sub">Kanalingizni qo‘shing — o‘rin auksion orqali</p>
        <button type="button" className="fk-tip" onClick={() => setTip(true)}>
          <Lightbulb />
          <span>Maslahat: Kanallar reytingi eng yuqori taklif asosida belgilanadi. Eng ko‘p taklif bergan kanal yuqori o‘ringa chiqadi.</span>
          <ChevronRight className="go" />
        </button>
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
        {list.length === 0 ? <p className="fk-note">Mos kanal topilmadi</p> : null}
        {list.map((item, index) => {
          const Icon = platformIcon[item.platform];
          const rank = index + 1;
          return (
            <article key={item.id} className="fk-row" data-testid="fk-row" data-real={item.real ? "1" : undefined}>
              <div className={rank <= 3 ? "fk-rank gold" : "fk-rank"}>
                {rank <= 3 ? <Crown fill="currentColor" /> : null}
                {rank}
              </div>
              <div className="fk-ava">
                {item.image ? <img src={item.image} alt="" /> : <span className="fk-ini" style={{ background: item.real?.avatarColor }}>{item.handle.replace("@", "").slice(0, 2).toUpperCase()}</span>}
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
                <button type="button" className="link" data-testid="fk-bid" onClick={() => takeSpot(item)}>O‘rinni olish <ChevronRight /></button>
              </div>
              <button type="button" className={rank === 1 ? "fk-subbtn on" : "fk-subbtn"} data-testid="fk-sub" onClick={() => subscribe(item)}>
                Obuna
              </button>
            </article>
          );
        })}
        <div className="fk-pad" />
      </div>
      <button type="button" className="fk-add" data-testid="fk-add" onClick={() => setAddOpen(true)}>
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
        <div className="mb-sheet" role="dialog" aria-label="Kanal qo‘shish" data-testid="fk-request">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setAddOpen(false)} />
          <form
            className="mb-panel"
            onSubmit={(event) => {
              event.preventDefault();
              const res = work.add({ username: handle, category });
              if (res.ok) {
                setAddOpen(false);
                setHandle("");
                setCategory("");
                setBidError("");
              } else if (res.reason !== "auth") setBidError(res.reason === "duplicate" ? "Bu @username allaqachon ro‘yxatda." : "Telegram @username (4–32 belgi) va mavzuni kiriting.");
              else setAddOpen(false);
            }}
          >
            <h3>Kanal qo‘shish</h3>
            <p>Telegram kanalingizni qo‘shing. Yuqori o‘rin uchun keyin taklif berasiz — sayt pul yechmaydi, taklif moderator bilan kelishiladi.</p>
            <input aria-label="Username" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@username" />
            <select aria-label="Mavzu" value={category} onChange={(event) => setCategory(event.target.value as ChannelCategory | "")}>
              <option value="">Mavzuni tanlang</option>
              {channelCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {bidError ? <p className="note">{bidError}</p> : null}
            <div className="row">
              <button type="button" onClick={() => setAddOpen(false)}>
                Yopish
              </button>
              <button type="submit" className="go" data-testid="fk-send">
                Qo‘shish
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {bidFor ? (
        <div className="mb-sheet" role="dialog" aria-label="O‘rinni olish" data-testid="fk-bid-sheet">
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setBidFor(null)} />
          <form
            className="mb-panel"
            onSubmit={(event) => {
              event.preventDefault();
              if (!bidFor.real) return;
              const res = work.bid(bidFor.real.id, Number(bid.replace(/\s/g, "")));
              if (res.ok) setBidFor(null);
              else setBidError(res.reason === "too_low" ? `Taklif kamida ${formatMoney(res.minRequired, "UZS")} bo‘lishi kerak.` : "Taklifni yuborib bo‘lmadi.");
            }}
          >
            <h3>1-o‘rinni olish: {bidFor.handle}</h3>
            <p>Hozirgi eng yuqori taklif — {formatMoney(Math.max(0, minBid - 1), "UZS")}. Kamida {formatMoney(minBid, "UZS")} taklif qiling. Taklif saqlanadi, to‘lov moderator bilan kelishiladi.</p>
            <input aria-label="Taklif" inputMode="numeric" value={bid} onChange={(event) => setBid(event.target.value)} placeholder="Taklif, so‘m" />
            {bidError ? <p className="note">{bidError}</p> : null}
            <div className="row">
              <button type="button" onClick={() => setBidFor(null)}>
                Yopish
              </button>
              <button type="submit" className="go" data-testid="fk-bid-send">
                Taklif berish
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {sample || tip ? (
        <div className="mb-sheet" role="dialog" aria-label={tip ? "Reyting qanday ishlaydi" : "Namuna kanal"} data-testid={tip ? "fk-tip-sheet" : "fk-sample"}>
          <button type="button" aria-label="Yopish" className="bg" onClick={() => { setSample(null); setTip(false); }} />
          <div className="mb-panel">
            {tip ? (
              <>
                <h3>Reyting qanday ishlaydi</h3>
                <p>Har bir mavzuda kanallar eng yuqori taklif bo‘yicha tartiblanadi. Taklifni moderator tasdiqlagach, kanal ro‘yxatda tegishli o‘ringa chiqadi.</p>
              </>
            ) : (
              <>
                <h3>{sample?.handle}</h3>
                <p>Bu kanal bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan namuna — havolasi yo‘q. Ro‘yxatdagi Telegram kanallarida «Obuna» kanalni Telegram’da ochadi.</p>
              </>
            )}
            <div className="row">
              <button type="button" onClick={() => { setSample(null); setTip(false); }}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
