"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Bookmark, CalendarDays, Clock, Eye, MapPin, Send } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { newsBadge, newsCats, type DesktopArticle, type NewsCat } from "@/data/desktop-news";
import { fetchNews, toDesktopNews } from "@/lib/live-content";
import { useSeminarRegs } from "@/components/seminar-provider";
import { seminars } from "@/data/seminars";
import { seminarHref } from "@/data/desktop-seminars";
import { som } from "@/components/shop/desktop/shop-cart";
import { site } from "@/data/site";
import "./news.css";

const MONTHS_SHORT = ["YAN", "FEV", "MAR", "APR", "MAY", "IYN", "IYL", "AVG", "SEN", "OKT", "NOY", "DEK"];

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
  const [showAllPopular, setShowAllPopular] = useState(false);
  const { catalogVersion } = useSeminarRegs();
  // Upcoming seminars stand in for "Yaqin tadbirlar"; news has no events of its own.
  const events = useMemo(() => {
    void catalogVersion;
    const today = new Date().toISOString().slice(0, 10);
    return seminars
      .filter((item) => item.date && item.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
  }, [catalogVersion]);

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
                  <h2>
                    <Link href={`/yangiliklar/${hero.id}`}>{hero.title}</Link>
                  </h2>
                  <p>{hero.lead}</p>
                  <div className="yn-author">
                    {hero.authorImage ? <img src={hero.authorImage} alt="" /> : null}
                    <div>
                      <b>{hero.author ?? "StomaHub"}</b>
                      <span>{hero.role ?? "Tahririyat"}</span>
                    </div>
                  </div>
                  <div className="yn-meta">
                    <span><CalendarDays className="i" /> {hero.date}</span>
                    {hero.views > 0 ? <span><Eye className="i" /> {hero.views.toLocaleString("fr-FR")}</span> : null}
                    <span><Clock className="i" /> {hero.minutes} daqiqa</span>
                  </div>
                  <Link className="yn-read" href={`/yangiliklar/${hero.id}`}>
                    O‘qish <ArrowRight className="i" />
                  </Link>
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
                    <h3>
                      <Link href={`/yangiliklar/${item.id}`}>{item.title}</Link>
                    </h3>
                    <div className="meta">
                      <span><CalendarDays className="i" /> {item.date}</span>
                      {item.views > 0 ? <span><Eye className="i" /> {item.views.toLocaleString("fr-FR")}</span> : null}
                      <span><Clock className="i" /> {item.minutes} daqiqa</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <aside className="yn-rail">
            <section className="yn-box">
              <h3>
                So‘nggi yangiliklar
                {visible.length > 5 ? (
                  <button type="button" className="yn-link" onClick={() => setShowAllPopular((open) => !open)}>
                    {showAllPopular ? "Yig‘ish" : "Barchasini ko‘rish"} <ArrowRight className="i" />
                  </button>
                ) : null}
              </h3>
              {popular.length === 0 ? <p className="yn-note">Hozircha yangilik yo‘q</p> : null}
              {popular.map((item, index) => (
                <Link className="yn-pop" key={item.id} href={`/yangiliklar/${item.id}`}>
                  <em>{index + 1}</em>
                  <img src={item.image} alt="" />
                  <div>
                    <b>{item.title}</b>
                    <span><CalendarDays className="i" /> {item.date}</span>
                  </div>
                </Link>
              ))}
            </section>
            <section className="yn-box">
              <h3>
                Yaqin tadbirlar
                <Link className="yn-link" href="/seminarlar">
                  Barchasini ko‘rish <ArrowRight className="i" />
                </Link>
              </h3>
              {events.length === 0 ? <p className="yn-note">Yaqin kunlarda tadbir yo‘q.</p> : null}
              {events.map((item) => {
                const [, month, day] = item.date.split("-");
                return (
                  <Link className="yn-event" key={item.id} href={seminarHref(item.id)}>
                    <span className="d">
                      <b>{Number(day)}</b>
                      <small>{MONTHS_SHORT[Number(month) - 1]}</small>
                    </span>
                    {item.image ? <img src={item.image} alt="" /> : null}
                    <span className="t">
                      <b>{item.title}</b>
                      <small><MapPin className="i" /> {item.city.replace(" shahri", "")}{item.venue ? `, ${item.venue}` : ""}</small>
                      <strong>{item.price > 0 ? som(item.price) : "Bepul"}</strong>
                    </span>
                  </Link>
                );
              })}
            </section>
            <section className="yn-box yn-tg">
              <h3><Send className="i" /> Telegram kanalimizga obuna bo‘ling</h3>
              <p>Stomatologiya yangiliklari, tadbirlar va foydali materiallar birinchi bo‘lib sizda.</p>
              <a href={site.telegram} target="_blank" rel="noreferrer">
                Obuna bo‘lish <ArrowRight className="i" />
              </a>
            </section>
          </aside>
        </div>
      </div>
    </ShopShell>
  );
}
