"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Clock, Eye, Send } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { desktopArticles, newsBadge, newsCats, popularArticles, upcomingEvents, type NewsCat } from "@/data/desktop-news";
import "@/components/jihoz/desktop/jihoz.css";

export function NewsDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [cat, setCat] = useState<"all" | NewsCat>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [heroId, setHeroId] = useState(desktopArticles.find((item) => item.featured)?.id ?? desktopArticles[0].id);
  const [note, setNote] = useState("");
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [showAllEvents, setShowAllEvents] = useState(false);

  const visible = useMemo(() => desktopArticles.filter((item) => {
    if (cat !== "all" && item.cat !== cat) return false;
    if (q && !`${item.title} ${item.lead}`.toLowerCase().includes(q)) return false;
    return true;
  }), [cat, q]);

  const hero = visible.find((item) => item.id === heroId) ?? visible[0];
  const grid = visible.filter((item) => item.id !== hero?.id);
  const popular = showAllPopular ? popularArticles : popularArticles;
  const events = showAllEvents ? upcomingEvents : upcomingEvents;

  function toggleSave(id: string) {
    setSaved((list) => list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  return (
    <ShopShell searchPath="/yangiliklar" cartCount={cartCount} placeholder="Stomatologiya sohasidagi yangiliklarni qidiring..." showCamera={false}>
      <div className="yn-page">
        <div className="yn-head">
          <div>
            <h1>Yangiliklar</h1>
            <p>Stomatologiya sohasidagi eng so‘nggi yangiliklar, tadbirlar va tahlillar</p>
          </div>
        </div>
        <div className="yn-tabs">
          {newsCats.map((item) => (
            <button key={item.id} type="button" className={cat === item.id ? "yn-tab on" : "yn-tab"} onClick={() => setCat(item.id)}>{item.label}</button>
          ))}
        </div>
        <div className="yn-cols">
          <div style={{ display: "flex", flexDirection: "column", gap: "calc(.5 * var(--u))", minWidth: 0 }}>
            {hero ? (
              <article className="yn-hero">
                <img className="cover" src={hero.image} alt="" />
                <div className="txt">
                  <span className="yn-badge" style={{ position: "static" }}>{newsBadge(hero.cat)}</span>
                  <h2>{hero.title}</h2>
                  <p>{hero.lead}</p>
                  <div className="yn-author">
                    {hero.authorImage ? <img src={hero.authorImage} alt="" /> : null}
                    <div>
                      <b>{hero.author ?? "StomaHub"}</b>
                      <span>{hero.role ?? "Tahririyat"}</span>
                    </div>
                  </div>
                  <div className="yn-meta" style={{ marginTop: "calc(.4 * var(--u))" }}>
                    <span>{hero.date}</span>
                    <span><Eye className="i" /> {hero.views.toLocaleString("fr-FR")}</span>
                    <span><Clock className="i" /> {hero.minutes} daqiqa</span>
                    <button type="button" className={saved.includes(hero.id) ? "yn-mark on" : "yn-mark"} style={{ position: "static" }} aria-label="Saqlash" onClick={() => toggleSave(hero.id)}><Bookmark className="i" /></button>
                  </div>
                </div>
              </article>
            ) : <div className="yn-box">Yangilik topilmadi</div>}
            <div className="yn-grid">
              {grid.map((item) => (
                <article className="yn-card" key={item.id}>
                  <div className="ph">
                    <img src={item.image} alt="" />
                    <span className="yn-badge">{newsBadge(item.cat)}</span>
                    <button type="button" className={saved.includes(item.id) ? "yn-mark on" : "yn-mark"} aria-label="Saqlash" onClick={() => toggleSave(item.id)}><Bookmark className="i" /></button>
                  </div>
                  <div className="bd">
                    <h3><button type="button" onClick={() => setHeroId(item.id)} style={{ textAlign: "left" }}>{item.title}</button></h3>
                    <div className="meta">
                      <span>{item.date}</span>
                      <span><Eye className="i" /> {item.views.toLocaleString("fr-FR")}</span>
                      <span><Clock className="i" /> {item.minutes} daqiqa</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {note ? <p className="yn-note">{note}</p> : null}
          </div>
          <aside className="yn-rail">
            <section className="yn-box">
              <h3>Ko‘p o‘qilganlar <button type="button" className="yn-link" onClick={() => setShowAllPopular(true)}>Barchasini ko‘rish</button></h3>
              {popular.map((item, index) => (
                <div className="yn-pop" key={item.title}>
                  <em>{index + 1}</em>
                  <img src={item.image} alt="" />
                  <div>
                    <b>{item.title}</b>
                    <span><Eye className="i" /> {item.views.toLocaleString("fr-FR")} · {item.date}</span>
                  </div>
                </div>
              ))}
              {showAllPopular ? <p className="yn-note">Eng ko‘p o‘qilgan 5 ta maqola.</p> : null}
            </section>
            <section className="yn-box">
              <h3>Yaqin tadbirlar <button type="button" className="yn-link" onClick={() => setShowAllEvents(true)}>Barchasini ko‘rish</button></h3>
              {events.map((item) => (
                <div className="yn-event" key={item.title}>
                  <div className="yn-date"><b>{item.day}</b><span>{item.month}</span></div>
                  <div>
                    <b>{item.title}</b>
                    <span>{item.place}</span>
                    <strong>{som(item.price)}</strong>
                  </div>
                </div>
              ))}
              {showAllEvents ? <p className="yn-note">Yaqin uchta tadbir.</p> : null}
            </section>
            <section className="yn-box yn-tg">
              <h3><Send className="i" /> Telegram kanalimizga obuna bo‘ling</h3>
              <p>Stomatologiya yangiliklari, tadbirlar va foydali materiallar birinchi bo‘lib sizda.</p>
              <button type="button" onClick={() => setNote("Obuna so‘rovi qabul qilindi.")}>Obuna bo‘lish</button>
            </section>
          </aside>
        </div>
      </div>
    </ShopShell>
  );
}
