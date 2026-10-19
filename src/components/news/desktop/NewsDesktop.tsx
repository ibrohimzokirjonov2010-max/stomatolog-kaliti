"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, Clock, Eye, Send } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { newsBadge, newsCats, type DesktopArticle, type NewsCat } from "@/data/desktop-news";
import { fetchNews, toDesktopNews } from "@/lib/live-content";
import "@/components/jihoz/desktop/jihoz.css";

export function NewsDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [cat, setCat] = useState<"all" | NewsCat>("all");
  const [saved, setSaved] = useState<string[]>([]);
  const [articles, setArticles] = useState<DesktopArticle[]>([]);
  const [ready, setReady] = useState(false);
  const [heroId, setHeroId] = useState("");
  useEffect(() => {
    let stop = false;
    void fetchNews().then((rows) => {
      if (stop) return;
      const mapped = rows.map(toDesktopNews);
      setArticles(mapped);
      setHeroId(mapped[0]?.id ?? "");
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);
  const [note, setNote] = useState("");
  const [showAllPopular, setShowAllPopular] = useState(false);

  const visible = useMemo(() => articles.filter((item) => {
    if (cat !== "all" && item.cat !== cat) return false;
    if (q && !`${item.title} ${item.lead}`.toLowerCase().includes(q)) return false;
    return true;
  }), [articles, cat, q]);

  const hero = visible.find((item) => item.id === heroId) ?? visible[0];
  const grid = visible.filter((item) => item.id !== hero?.id);
  const popular = visible.slice(0, showAllPopular ? visible.length : 5);

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
                  <button type="button" className={saved.includes(hero.id) ? "yn-mark on" : "yn-mark"} aria-label="Saqlash" onClick={() => toggleSave(hero.id)}><Bookmark className="i" /></button>
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
                  </div>
                </div>
              </article>
            ) : <div className="yn-box">{!ready ? "Yuklanmoqda..." : articles.length === 0 ? "Hozircha yangilik yo‘q" : "Yangilik topilmadi"}</div>}
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
              {popular.length === 0 ? <p className="yn-note">Hozircha yangilik yo‘q</p> : null}
              {popular.map((item, index) => (
                <div className="yn-pop" key={item.id}>
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
              <h3>Yaqin tadbirlar</h3>
              <p className="yn-note">Hozircha tadbir yo‘q. Tadbirlar alohida bo‘lim emas.</p>
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
