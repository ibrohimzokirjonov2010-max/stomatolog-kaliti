"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Bookmark, CalendarDays, Clock3, Eye, MapPin, Send } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { desktopArticles, newsBadge, newsCats, popularArticles, upcomingEvents, type DesktopArticle, type NewsCat } from "@/data/desktop-news";
import { site } from "@/data/site";
import "./news.css";

const SAVED_KEY = "sh-news-saved-v1";

export function views(n: number) {
  return n.toLocaleString("ru-RU").replace(/ |,/g, " ");
}

/** Bookmarks for articles, kept per browser. */
export function useSavedArticles() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate once from localStorage
      if (Array.isArray(raw)) setSaved(raw.filter((x): x is string => typeof x === "string"));
    } catch {
      /* private mode */
    }
  }, []);
  function toggle(id: string) {
    setSaved((current) => {
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      try {
        window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* private mode */
      }
      return next;
    });
  }
  return { saved, toggle };
}

export function NewsDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const [cat, setCat] = useState<"all" | NewsCat | "saved">("all");
  const [order, setOrder] = useState<"new" | "views">("new");
  const { saved, toggle } = useSavedArticles();

  const visible = useMemo(() => {
    const pool = cat === "saved" ? [...desktopArticles, ...popularArticles].filter((item) => saved.includes(item.id)) : desktopArticles;
    const rows = pool.filter((item) => {
      if (cat !== "all" && cat !== "saved" && item.cat !== cat) return false;
      if (q && !`${item.title} ${item.lead}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return order === "views" ? [...rows].sort((a, b) => b.views - a.views) : rows;
  }, [cat, order, q, saved]);

  const hero = order === "new" && cat !== "saved" ? visible.find((item) => item.featured) ?? visible[0] : undefined;
  const grid = visible.filter((item) => item !== hero);

  return (
    <ShopShell searchPath="/yangiliklar" cartCount={cartCount} placeholder="Stomatologiya sohasidagi yangiliklarni qidiring..." showCamera={false}>
      <div className="yn2" data-testid="news-page">
        <div className="yn2-main">
          <div className="yn2-head">
            <h1>Yangiliklar</h1>
            <p>Stomatologiya sohasidagi eng so‘nggi yangiliklar, tadbirlar va tahlillar</p>
          </div>
          <div className="yn2-tabs" role="tablist" aria-label="Turkum">
            {newsCats.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={cat === item.id} className={cat === item.id ? "on" : ""} onClick={() => setCat(item.id)}>{item.label}</button>
            ))}
            {saved.length ? <button type="button" role="tab" aria-selected={cat === "saved"} className={cat === "saved" ? "on" : ""} onClick={() => setCat("saved")}><Bookmark className="i" /> Saqlanganlar ({saved.length})</button> : null}
          </div>

          {hero ? (
            <article className="yn2-hero" data-testid="news-hero">
              <Link href={`/yangiliklar/${hero.id}`} className="ph" aria-label={hero.title}><img src={hero.image} alt="" /></Link>
              <div className="txt">
                <span className="yn2-badge">{newsBadge(hero.cat)}</span>
                <h2><Link href={`/yangiliklar/${hero.id}`}>{hero.title}</Link></h2>
                <p>{hero.lead}</p>
                <div className="foot">
                  <span className="yn2-author">
                    {hero.authorImage ? <img src={hero.authorImage} alt="" /> : null}
                    <span><b>{hero.author ?? "StomaHub"}</b><small>{hero.role ?? "Tahririyat"}</small></span>
                  </span>
                  <Meta item={hero} />
                </div>
              </div>
              <SaveBtn on={saved.includes(hero.id)} onClick={() => toggle(hero.id)} />
            </article>
          ) : null}

          {grid.length ? (
            <div className="yn2-grid">
              {grid.map((item) => (
                <article className="yn2-card" key={item.id} data-testid="news-card">
                  <div className="ph">
                    <Link href={`/yangiliklar/${item.id}`} aria-label={item.title}><img src={item.image} alt="" loading="lazy" /></Link>
                    <span className="yn2-badge">{newsBadge(item.cat)}</span>
                    <SaveBtn on={saved.includes(item.id)} onClick={() => toggle(item.id)} />
                  </div>
                  <h3><Link href={`/yangiliklar/${item.id}`}>{item.title}</Link></h3>
                  <Meta item={item} />
                </article>
              ))}
            </div>
          ) : !hero ? (
            <div className="yn2-empty">
              <b>{cat === "saved" ? "Saqlangan maqola yo‘q" : "Yangilik topilmadi"}</b>
              <p>{cat === "saved" ? "Maqoladagi belgini bosing — u shu yerda turadi." : "Boshqa turkumni tanlang yoki qidiruvni o‘zgartiring."}</p>
              <button type="button" onClick={() => setCat("all")}>Barcha yangiliklar</button>
            </div>
          ) : null}
        </div>

        <aside className="yn2-rail">
          <section className="yn2-box">
            <div className="yn2-box-hd">
              <h3>Ko‘p o‘qilganlar</h3>
              <button type="button" onClick={() => { setCat("all"); setOrder(order === "views" ? "new" : "views"); }}>{order === "views" ? "Yangilari bo‘yicha" : "Barchasini ko‘rish"} <ArrowRight className="i" /></button>
            </div>
            <ol className="yn2-pop">
              {popularArticles.map((item, index) => (
                <li key={item.id}>
                  <em>{index + 1}</em>
                  <Link href={`/yangiliklar/${item.id}`} className="ph" aria-label={item.title}><img src={item.image} alt="" /></Link>
                  <span>
                    <Link href={`/yangiliklar/${item.id}`}>{item.title}</Link>
                    <small><Eye className="i" /> {views(item.views)} <CalendarDays className="i" /> {item.date}</small>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="yn2-box">
            <div className="yn2-box-hd">
              <h3>Yaqin tadbirlar</h3>
              <Link href="/seminarlar">Barchasini ko‘rish <ArrowRight className="i" /></Link>
            </div>
            <ul className="yn2-events">
              {upcomingEvents.map((item) => (
                <li key={item.title}>
                  <span className="ev-date"><b>{item.day}</b><small>{item.month}</small></span>
                  <img src={item.image} alt="" />
                  <span className="txt">
                    <Link href="/seminarlar">{item.title}</Link>
                    <small><MapPin className="i" /> {item.place}</small>
                    <strong>{som(item.price)}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="yn2-tg">
            <Send className="plane" aria-hidden />
            <div>
              <h3>Telegram kanalimizga obuna bo‘ling</h3>
              <p>Stomatologiya yangiliklari, tadbirlar va foydali materiallar birinchi bo‘lib sizda!</p>
              <a href={site.telegram} target="_blank" rel="noreferrer">Obuna bo‘lish <ArrowRight className="i" /></a>
            </div>
          </section>
        </aside>
      </div>
    </ShopShell>
  );
}

export function Meta({ item }: { item: DesktopArticle }) {
  return (
    <span className="yn2-meta">
      <span><CalendarDays className="i" /> {item.date}</span>
      <span><Eye className="i" /> {views(item.views)}</span>
      <span><Clock3 className="i" /> {item.minutes} daqiqa</span>
    </span>
  );
}

export function SaveBtn({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button type="button" className={on ? "yn2-save on" : "yn2-save"} aria-pressed={on} aria-label={on ? "Saqlanganlardan olib tashlash" : "Saqlash"} onClick={onClick}>
      <Bookmark className="i" />
    </button>
  );
}
