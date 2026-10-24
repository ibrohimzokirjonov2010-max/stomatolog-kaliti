"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Bookmark, Camera, ChevronDown, Heart, Megaphone, Mic, Plus, Radio, Send, Star, Tv, X } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { channelCategories, channelCategoryLabel, type ChannelCategory } from "@/data/channels";
import { useStoredList } from "@/lib/stored-list";
import "./hub.css";
import "./kanallar.css";

type Platform = "telegram" | "youtube" | "instagram" | "podcast";
type Row = { id: string; name: string; handle: string; category: ChannelCategory; color: string; rank: number };

const platforms: { id: "all" | Platform; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "telegram", label: "Telegram" },
  { id: "youtube", label: "YouTube" },
  { id: "instagram", label: "Instagram" },
  { id: "podcast", label: "Podkast" },
];

/** Topic artwork and a one-line theme for the cover; channels carry no photo of their own yet. */
const COVER: Record<ChannelCategory, { img: string; line: string }> = {
  implantologiya: { img: "/img/design-pr13/courses/implant-nazariya.png", line: "Implantologiya, jarrohlik va klinik holatlar" },
  endodontiya: { img: "/img/design-pr13/courses/endo-kanal.png", line: "Endodontiya darslari va klinik keyslar" },
  ortodontiya: { img: "/img/design-pr13/courses/ortodont-zamonaviy.png", line: "Ortodontiya bilim va tajriba" },
  marketing: { img: "/img/mobile/kl-clinic.jpg", line: "Klinika marketingi va boshqaruv" },
  talim: { img: "/img/design-pr13/courses/terapiya-kompozit.png", line: "Stomatologiya amaliy darslari" },
  jihozlar: { img: "/img/jihoz/chair.jpg", line: "Stomatologik jihozlar va yangiliklar" },
  umumiy: { img: "/img/design-pr13/courses/raqamli-cadcam.png", line: "Stomatologlar uchun foydali kontent" },
};

function PlatformIcon({ id }: { id: Platform }) {
  if (id === "youtube") return <Tv />;
  if (id === "instagram") return <Camera />;
  if (id === "podcast") return <Mic />;
  return <Send />;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function link(handle: string) {
  return `https://t.me/${handle.replace(/^@/, "")}`;
}

/** Desktop /foydali-kanallar (mock "foydali kanallar"). Only Telegram channels exist in the catalog today. */
export function KanallarDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [q, setQ] = useState(paramQ);
  const [seenQ, setSeenQ] = useState(paramQ);
  const [list, setList] = useState<Row[] | null>(null);
  const [platform, setPlatform] = useState<"all" | Platform>("all");
  const [topic, setTopic] = useState<ChannelCategory | "">("");
  const [sort, setSort] = useState<"pop" | "new" | "az">("pop");
  const [saved, setSaved] = useStoredList<string>("sk-channel-saved-v1", []);
  const [savedOpen, setSavedOpen] = useState(false);
  const [offer, setOffer] = useState(false);
  if (seenQ !== paramQ) {
    setSeenQ(paramQ);
    setQ(paramQ);
  }

  useEffect(() => {
    let stop = false;
    void fetch("/api/channels", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json: { ok?: boolean; channels?: { id: string; username: string; name: string; category: ChannelCategory; avatarColor?: string }[] }) => {
        if (stop) return;
        setList(
          (json.ok ? json.channels ?? [] : []).map((item, index) => ({
            id: item.id,
            name: item.name,
            handle: item.username,
            category: channelCategoryLabel[item.category] ? item.category : "umumiy",
            color: item.avatarColor || "#0d9f9a",
            rank: index,
          })),
        );
      })
      .catch(() => {
        if (!stop) setList([]);
      });
    return () => {
      stop = true;
    };
  }, []);

  const rows = useMemo(() => list ?? [], [list]);
  const shown = useMemo(() => {
    const query = q.trim().toLowerCase();
    const next = rows.filter((item) => {
      if (platform !== "all" && platform !== "telegram") return false;
      if (topic && item.category !== topic) return false;
      if (!query) return true;
      return `${item.name} ${item.handle} ${channelCategoryLabel[item.category]}`.toLowerCase().includes(query);
    });
    if (sort === "az") return [...next].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "new") return [...next].reverse();
    return next;
  }, [platform, q, rows, sort, topic]);

  const picks = rows.slice(0, 5);
  const savedRows = rows.filter((item) => saved.includes(item.id));
  const toggleSave = (id: string) => setSaved((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));

  return (
    <ShopShell searchPath="/foydali-kanallar" cartCount={cartCount} placeholder="Kanal, mavzu yoki username bo‘yicha qidiring..." showCamera={false}>
      <div className="kn">
        <div className="kn-main">
          <div className="kn-head">
            <i><Radio /></i>
            <div>
              <h1>Foydali kanallar</h1>
              <p>Stomatologlar uchun eng yaxshi Telegram, YouTube, Instagram kanallar va podkastlar.</p>
            </div>
            <button type="button" className="kn-offer" onClick={() => setOffer(true)}><Plus /> Kanal taklif qilish</button>
          </div>

          <div className="kn-plats">
            {platforms.map((item) => (
              <button key={item.id} type="button" className={`kn-plat ${item.id}${platform === item.id ? " on" : ""}`} onClick={() => setPlatform(item.id)}>
                {item.id !== "all" ? <i><PlatformIcon id={item.id} /></i> : null}
                {item.label}
              </button>
            ))}
          </div>

          <div className="kn-row">
            <span>Mavzu:</span>
            <button type="button" className={topic === "" ? "on" : undefined} onClick={() => setTopic("")}>Barchasi</button>
            {channelCategories.map((item) => (
              <button key={item.id} type="button" className={topic === item.id ? "on" : undefined} onClick={() => setTopic(item.id)}>{item.label}</button>
            ))}
            <label className="kn-sort">
              Saralash:
              <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Saralash">
                <option value="pop">Ommabop</option>
                <option value="new">Yangi qo‘shilgan</option>
                <option value="az">Nomi bo‘yicha</option>
              </select>
              <ChevronDown />
            </label>
          </div>

          {list === null ? (
            <div className="kn-empty">Yuklanmoqda…</div>
          ) : shown.length === 0 ? (
            <div className="kn-empty">
              {platform !== "all" && platform !== "telegram" ? `${platforms.find((item) => item.id === platform)?.label} kanallari hali qo‘shilmagan.` : rows.length === 0 ? "Hozircha kanal yo‘q." : "Bu filtrda kanal yo‘q."}
              <button type="button" onClick={() => setOffer(true)}>Kanal taklif qilish</button>
            </div>
          ) : (
            <div className="kn-grid">
              {shown.map((item) => {
                const cover = COVER[item.category];
                const isSaved = saved.includes(item.id);
                return (
                  <article className="kn-card" key={item.id}>
                    <div className="kn-cover">
                      <img src={cover.img} alt="" />
                      <b>{cover.line}</b>
                      <span className="kn-badge telegram" aria-label="Telegram"><Send /></span>
                    </div>
                    <span className="kn-ava" style={{ background: item.color }}>{initials(item.name)}</span>
                    <div className="kn-body">
                      <h3>{item.name}</h3>
                      <a className="kn-handle" href={link(item.handle)} target="_blank" rel="noreferrer">@{item.handle.replace(/^@/, "")}</a>
                      <div className="kn-tags"><span>{channelCategoryLabel[item.category]}</span><span>Telegram</span></div>
                      <div className="kn-foot">
                        <a className="kn-sub" href={link(item.handle)} target="_blank" rel="noreferrer">Obuna bo‘lish</a>
                        <button type="button" className={isSaved ? "kn-heart on" : "kn-heart"} aria-pressed={isSaved} aria-label="Saqlash" onClick={() => toggleSave(item.id)}>
                          <Heart fill={isSaved ? "currentColor" : "none"} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="kn-rail">
          <section className="kn-box">
            <h3><span><Star className="star" /> Muharrir tanlovi</span></h3>
            {picks.length === 0 ? <p className="kn-muted">Hali kanal yo‘q.</p> : picks.map((item) => (
              <div className="kn-pick" key={item.id}>
                <span className="kn-mini" style={{ background: item.color }}>{initials(item.name)}</span>
                <span className="who"><b>{item.name}</b><small>@{item.handle.replace(/^@/, "")}</small><small>{channelCategoryLabel[item.category]}</small></span>
                <a href={link(item.handle)} target="_blank" rel="noreferrer">Obuna</a>
              </div>
            ))}
          </section>
          <section className="kn-box">
            <h3>
              <span>Mening saqlanganlarim</span>
              {savedRows.length > 3 ? <button type="button" onClick={() => setSavedOpen(!savedOpen)}>{savedOpen ? "Yig‘ish" : "Barchasini ko‘rish"} <ArrowRight /></button> : null}
            </h3>
            {savedRows.length === 0 ? <p className="kn-muted">Hali saqlanmagan. Kartadagi yurakchani bosing.</p> : (savedOpen ? savedRows : savedRows.slice(0, 3)).map((item) => (
              <div className="kn-saved" key={item.id}>
                <span className="kn-mini sm" style={{ background: item.color }}>{initials(item.name)}</span>
                <a href={link(item.handle)} target="_blank" rel="noreferrer">{item.name}</a>
                <button type="button" aria-label="Saqlanganlardan olib tashlash" onClick={() => toggleSave(item.id)}><Bookmark fill="currentColor" /></button>
              </div>
            ))}
          </section>
          <section className="kn-promo">
            <i><Megaphone /></i>
            <b>O‘zingiz bilgan foydali kanalni taklif qiling</b>
            <small>Stomatologlar hamjamiyatini birga rivojlantiramiz.</small>
            <button type="button" onClick={() => setOffer(true)}><Plus /> Kanal taklif qilish</button>
          </section>
        </aside>
      </div>
      {offer ? <OfferDialog onClose={() => setOffer(false)} /> : null}
    </ShopShell>
  );
}

function OfferDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState<ChannelCategory>("umumiy");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    const clean = handle.trim().replace(/^@+/, "").replace(/^https?:\/\/t\.me\//, "");
    if (!/^[a-zA-Z0-9_]{3,32}$/.test(clean)) return setError("Username 3–32 ta lotin harfi, raqam yoki _ bo‘lsin.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/channels", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || clean, username: clean, category }),
    }).catch(() => null);
    setBusy(false);
    const json = (await res?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (!res?.ok || !json?.ok) {
      setError(res?.status === 401 ? "Taklif qilish uchun tizimga kiring." : json?.error === "duplicate" ? "Bu kanal allaqachon bor." : "Yuborib bo‘lmadi. Qayta urinib ko‘ring.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="kn-scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="kn-dialog" role="dialog" aria-modal="true" aria-label="Kanal taklif qilish" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <header><b>Kanal taklif qilish</b><button type="button" aria-label="Yopish" onClick={onClose}><X /></button></header>
        {done ? (
          <>
            <p className="kn-ok">Rahmat! Kanal ro‘yxatga qo‘shildi.</p>
            <div className="kn-dacts"><button type="button" className="go" onClick={() => window.location.reload()}>Ro‘yxatni yangilash</button></div>
          </>
        ) : (
          <>
            <label>Kanal nomi<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Masalan: Implantology.Uz" /></label>
            <label>Telegram username<input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@username" required /></label>
            <label>Mavzu
              <select value={category} onChange={(event) => setCategory(event.target.value as ChannelCategory)}>
                {channelCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            {error ? <p className="kn-err" role="alert">{error}</p> : null}
            <div className="kn-dacts">
              <button type="button" onClick={onClose}>Bekor</button>
              <button type="submit" className="go" disabled={busy}>{busy ? "Yuborilmoqda…" : "Yuborish"}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
