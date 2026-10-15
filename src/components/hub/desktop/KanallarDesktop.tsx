"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Camera, Heart, Mic, Plus, Send, Star, Tv } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  channelTopics,
  channels as seedChannels,
  editorPickIds,
  officialChannels,
  savedChannelIds,
  subsFull,
  subsK,
  type Channel,
  type Platform,
} from "@/data/desktop-hub";
import "./hub.css";

const platforms: { id: "all" | Platform; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "telegram", label: "Telegram" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "podcast", label: "Podkast" },
];

const langs = ["Barchasi", "O‘zbek", "Rus", "Ingliz"] as const;

function PlatformIcon({ id }: { id: Platform }) {
  if (id === "youtube") return <Tv className="i" />;
  if (id === "instagram") return <Camera className="i" />;
  if (id === "podcast") return <Mic className="i" />;
  return <Send className="i" />;
}

export function KanallarDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [q, setQ] = useState(paramQ);
  const [list, setList] = useState<Channel[]>(seedChannels);
  const [platform, setPlatform] = useState<"all" | Platform>("all");
  const [topic, setTopic] = useState("Barchasi");
  const [lang, setLang] = useState<(typeof langs)[number]>("Barchasi");
  const [sort, setSort] = useState("pop");
  const [sortOpen, setSortOpen] = useState(false);
  const [subs, setSubs] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>(savedChannelIds);
  const [savedOpen, setSavedOpen] = useState(false);
  const [offer, setOffer] = useState(false);

  useEffect(() => {
    setQ(paramQ);
  }, [paramQ]);

  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const rows = list.filter((item) => {
      if (platform !== "all" && item.platform !== platform) return false;
      if (topic !== "Barchasi" && item.topic !== topic && !item.tags.includes(topic)) return false;
      if (lang !== "Barchasi" && item.lang !== lang) return false;
      if (!query) return true;
      return `${item.name} ${item.handle} ${item.about}`.toLowerCase().includes(query);
    });
    return [...rows].sort((a, b) => (sort === "sub" ? b.subscribers - a.subscribers : sort === "rate" ? b.rating - a.rating : b.popularity - a.popularity));
  }, [list, platform, topic, lang, q, sort]);

  function toggleSub(id: string) {
    setSubs((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }
  function toggleSave(id: string) {
    setSaved((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  const picks = editorPickIds.map((id) => list.find((item) => item.id === id)).filter((item): item is Channel => Boolean(item));
  const savedRows = list.filter((item) => saved.includes(item.id));

  return (
    <ShopShell searchPath="/foydali-kanallar" cartCount={cartCount} placeholder="Kanal, mavzu yoki username bo‘yicha qidiring..." showCamera={false}>
      <div className="hub-split">
        <div className="hub-page">
          <div className="hub-head">
            <div>
              <h1>Foydali kanallar</h1>
              <p>Stomatologlar uchun eng yaxshi Telegram, YouTube, Instagram kanallar va podkastlar.</p>
            </div>
            <button type="button" className="hub-btn" onClick={() => setOffer(true)}>
              <Plus className="i" /> Kanal taklif qilish
            </button>
          </div>
          <div className="hub-tabs">
            {platforms.map((item) => (
              <button key={item.id} type="button" className={platform === item.id ? "hub-tab on" : "hub-tab"} onClick={() => setPlatform(item.id)}>
                {item.id !== "all" ? <PlatformIcon id={item.id} /> : null}
                {item.label}
              </button>
            ))}
          </div>
          <div className="hub-frow">
            <span>Mavzu:</span>
            {channelTopics.map((item) => (
              <button key={item} type="button" className={topic === item ? "hub-chip on" : "hub-chip"} onClick={() => setTopic(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="hub-frow">
            <span>Til:</span>
            {langs.map((item) => (
              <button key={item} type="button" className={lang === item ? "hub-chip on" : "hub-chip"} onClick={() => setLang(item)}>
                {item}
              </button>
            ))}
            <div className="hub-tools">
              <div className={sortOpen ? "dk-drop on" : "dk-drop"}>
                <button type="button" onClick={() => setSortOpen((open) => !open)}>
                  Saralash: {sort === "sub" ? "Obunachilar" : sort === "rate" ? "Reyting" : "Ommabop"}
                </button>
                {sortOpen ? (
                  <div className="dk-pop">
                    {(
                      [
                        ["pop", "Ommabop"],
                        ["sub", "Obunachilar"],
                        ["rate", "Reyting"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className="hub-check"
                        onClick={() => {
                          setSort(id);
                          setSortOpen(false);
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {shown.length === 0 ? (
            <div className="hub-empty">Bu filtrda kanal yo‘q.</div>
          ) : (
            <div className="hub-grid">
              {shown.map((item) => (
                <article className="hub-ch" key={item.id}>
                  <div className="ph">
                    <img src={item.image} alt="" />
                    {item.verified ? <span className="hub-ver">Tasdiqlangan</span> : null}
                    <button type="button" className={saved.includes(item.id) ? "hub-heart on" : "hub-heart"} onClick={() => toggleSave(item.id)} aria-label="Saqlash">
                      <Heart className="i" />
                    </button>
                  </div>
                  <div className="bd">
                    <h3>{item.name}</h3>
                    <span className="hub-handle">{item.handle}</span>
                    <div className="hub-meta">
                      <span>{subsFull(item.subscribers)} obunachi</span>
                      <span>{item.lang}</span>
                    </div>
                    <p>{item.about}</p>
                    <div className="hub-tags">
                      {item.tags.map((tag) => (
                        <i key={tag}>{tag}</i>
                      ))}
                    </div>
                    <div className="hub-meta">
                      <Star className="i" /> {item.rating.toFixed(1)} ({item.reviews} ta baho)
                    </div>
                    <button type="button" className={subs.includes(item.id) ? "hub-subbtn on" : "hub-subbtn"} onClick={() => toggleSub(item.id)}>
                      {subs.includes(item.id) ? "Obuna bo‘ldingiz" : "Obuna bo‘lish"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
        <aside className="hub-rail">
          <section className="hub-box">
            <h3>Muharrir tanlovi</h3>
            <p className="by" style={{ marginTop: 0 }}>
              StomaHub jamoasi tavsiyasi
            </p>
            {picks.map((item) => (
              <div className="hub-pick" key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <b>{item.name}</b>
                  <small>{subsK(item.subscribers)} obunachi</small>
                </div>
                <button type="button" className={subs.includes(item.id) ? "hub-subbtn on" : "hub-subbtn"} onClick={() => toggleSub(item.id)}>
                  {subs.includes(item.id) ? "Obuna" : "Obuna bo‘lish"}
                </button>
              </div>
            ))}
          </section>
          <section className="hub-box">
            <h3>
              Mening saqlanganlarim
              <button type="button" onClick={() => setSavedOpen((open) => !open)}>
                {savedOpen ? "Yig‘ish" : "Barchasini ko‘rish"}
              </button>
            </h3>
            {savedRows.length === 0 ? <p className="by">Hali saqlanmagan.</p> : null}
            {(savedOpen ? savedRows : savedRows.slice(0, 3)).map((item) => (
              <div className="hub-pick" key={item.id}>
                <img src={item.image} alt="" />
                <b>{item.name}</b>
                <Bookmark className="i" />
              </div>
            ))}
          </section>
          <section className="hub-box">
            <h3>StomaHub rasmiy kanallari</h3>
            <p className="by">Yangiliklar, aksiyalar va foydali kontentlar.</p>
            {officialChannels.map((item) => (
              <div className="hub-off" key={item.id}>
                <span className="hub-tg">
                  <Send className="i" />
                </span>
                <div>
                  <b>{item.name}</b>
                  <small className="hub-handle">
                    {item.handle} · {subsK(item.subscribers)} obunachi
                  </small>
                </div>
                <button type="button" className={subs.includes(item.id) ? "hub-subbtn on" : "hub-subbtn"} onClick={() => toggleSub(item.id)}>
                  {subs.includes(item.id) ? "Obuna" : "Obuna bo‘lish"}
                </button>
              </div>
            ))}
          </section>
        </aside>
      </div>
      {offer ? (
        <div className="hub-modal" onClick={() => setOffer(false)}>
          <form
            className="hub-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const name = String(data.get("name") || "").trim();
              if (!name) return;
              setList((prev) => [
                {
                  id: `new-${Date.now()}`,
                  name,
                  handle: String(data.get("handle") || "@kanal"),
                  platform: "telegram",
                  topic: "Endodontiya",
                  lang: "O‘zbek",
                  subscribers: 120,
                  rating: 5,
                  reviews: 1,
                  about: "Taklif qilingan kanal.",
                  tags: ["Umumiy", "Yangiliklar"],
                  verified: false,
                  image: "/img/hub/channel-1.jpg",
                  popularity: 120,
                },
                ...prev,
              ]);
              setOffer(false);
            }}
          >
            <h3>Kanal taklif qilish</h3>
            <label>Nomi</label>
            <input name="name" required />
            <label>Username</label>
            <input name="handle" placeholder="@username" />
            <div className="hub-actions">
              <button className="hub-btn" type="submit">
                Yuborish
              </button>
              <button className="hub-btn ghost" type="button" onClick={() => setOffer(false)}>
                Bekor
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </ShopShell>
  );
}
