"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Camera, Heart, Mic, Plus, Send, Star, Tv } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  channelTopics,
  subsFull,
  subsK,
  type Channel,
  type Platform,
} from "@/data/desktop-hub";
import { channelCategoryLabel, type ChannelCategory } from "@/data/channels";
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

/** Channel photo, or its initials on the channel's own colour when there is no photo. */
function ChannelAvatar({ name, image, color, className = "hub-ch-mini" }: { name: string; image: string; color?: string; className?: string }) {
  if (image) return <img className={className} src={image} alt="" />;
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className={className} style={{ background: color || "#0fa6a0" }} aria-hidden>
      {letters}
    </span>
  );
}

export function KanallarDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [q, setQ] = useState(paramQ);
  const [list, setList] = useState<Channel[]>([]);
  const [platform, setPlatform] = useState<"all" | Platform>("all");
  const [topic, setTopic] = useState("Barchasi");
  const [lang, setLang] = useState<(typeof langs)[number]>("Barchasi");
  const [sort, setSort] = useState("pop");
  const [sortOpen, setSortOpen] = useState(false);
  const [subs, setSubs] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [offer, setOffer] = useState(false);
  const [colors, setColors] = useState<Record<string, string>>({});

  useEffect(() => {
    setQ(paramQ);
  }, [paramQ]);

  useEffect(() => {
    let stop = false;
    void fetch("/api/channels", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json: { ok?: boolean; channels?: { id: string; username: string; name: string; category: ChannelCategory; avatarColor?: string }[] }) => {
        if (stop || !json.ok) return;
        setColors(Object.fromEntries((json.channels ?? []).map((item) => [item.id, item.avatarColor || ""])));
        const topicOf = (category: string) => channelCategoryLabel[category as ChannelCategory] ?? "Umumiy";
        setList(
          (json.channels ?? []).map((item, index) => ({
            id: item.id,
            name: item.name,
            handle: item.username,
            platform: "telegram" as const,
            topic: topicOf(item.category),
            lang: "O‘zbek" as const,
            subscribers: 0,
            rating: 0,
            reviews: 0,
            about: item.username,
            tags: [topicOf(item.category), "Telegram"] as [string, string],
            verified: false,
            image: "",
            popularity: 1000 - index,
          })),
        );
      })
      .catch(() => undefined);
    return () => {
      stop = true;
    };
  }, []);

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

  const picks = list.slice(0, 4);
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
              <button key={item.id} type="button" className={`hub-tab ch-plat ${item.id}${platform === item.id ? " on" : ""}`} onClick={() => setPlatform(item.id)}>
                {item.id !== "all" ? <PlatformIcon id={item.id} /> : null}
                {item.label}
              </button>
            ))}
          </div>
          <div className="hub-frow ch-filter">
            <span>Mavzu:</span>
            {channelTopics.map((item) => (
              <button key={item} type="button" className={topic === item ? "hub-chip on" : "hub-chip"} onClick={() => setTopic(item)}>
                {item}
              </button>
            ))}
          </div>
          <div className="hub-frow ch-filter">
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
            <div className="hub-empty">{list.length === 0 ? "Hozircha kanal yo‘q" : "Bu filtrda kanal yo‘q."}</div>
          ) : (
            <div className="hub-grid">
              {shown.map((item) => (
                <article className="hub-ch" key={item.id}>
                  <div className="ph">
                    {item.image ? (
                      <img src={item.image} alt="" />
                    ) : (
                      <span className="hub-ch-cover" style={{ "--ch": colors[item.id] || "#0fa6a0" } as CSSProperties} aria-hidden />
                    )}
                    <ChannelAvatar name={item.name} image={item.image} color={colors[item.id]} className="hub-ch-ava" />
                    {item.verified ? <span className="hub-ver">Tasdiqlangan</span> : null}
                    <button type="button" className={saved.includes(item.id) ? "hub-heart on" : "hub-heart"} onClick={() => toggleSave(item.id)} aria-label="Saqlash">
                      <Heart className="i" />
                    </button>
                  </div>
                  <div className="bd">
                    <h3>{item.name}</h3>
                    <span className="hub-handle">@{item.handle.replace(/^@/, "")}</span>
                    <div className="hub-meta">
                      {item.subscribers > 0 ? <span>{subsFull(item.subscribers)} obunachi</span> : null}
                      <span>{item.lang}</span>
                    </div>
                    {item.about && item.about !== item.handle ? <p>{item.about}</p> : null}
                    <div className="hub-tags">
                      {item.tags.map((tag) => (
                        <i key={tag}>{tag}</i>
                      ))}
                    </div>
                    <div className="hub-ch-foot">
                      {item.reviews > 0 ? (
                        <span className="hub-meta">
                          <Star className="i" /> {item.rating.toFixed(1)} <small>({item.reviews} ta baho)</small>
                        </span>
                      ) : null}
                      <a
                        className={subs.includes(item.id) ? "hub-subbtn on" : "hub-subbtn"}
                        href={`https://t.me/${item.handle.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => toggleSub(item.id)}
                      >
                        {subs.includes(item.id) ? "Obuna bo‘ldingiz" : "Obuna bo‘lish"}
                      </a>
                    </div>
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
                <ChannelAvatar name={item.name} image={item.image} color={colors[item.id]} />
                <div>
                  <b>{item.name}</b>
                  <small>{item.subscribers > 0 ? `${subsK(item.subscribers)} obunachi` : `@${item.handle.replace(/^@/, "")}`}</small>
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
                <ChannelAvatar name={item.name} image={item.image} color={colors[item.id]} />
                <b>{item.name}</b>
                <Bookmark className="i" />
              </div>
            ))}
          </section>
          <section className="hub-box">
            <h3>StomaHub rasmiy kanallari</h3>
            <p className="by">Hozircha rasmiy kanal yo‘q.</p>
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
              const username = String(data.get("handle") || "").trim();
              if (!name || !username) return;
              void fetch("/api/channels", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, username, category: "umumiy" }),
              }).then(() => window.location.assign("/foydali-kanallar"));
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
