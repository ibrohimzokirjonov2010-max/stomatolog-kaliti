"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Link2, Send } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { desktopArticles, getDesktopArticle, newsBadge, popularArticles } from "@/data/desktop-news";
import { site } from "@/data/site";
import { Meta, SaveBtn, useSavedArticles } from "./NewsDesktop";
import "./news.css";

/** Article page for the desktop news list. Only the summary we have is shown — no invented body text. */
export function NewsArticleDesktop({ id }: { id: string }) {
  const cartCount = useShopLineCount();
  const item = getDesktopArticle(id);
  const { saved, toggle } = useSavedArticles();
  const [copied, setCopied] = useState(false);
  if (!item) return null;
  const pool = [...desktopArticles, ...popularArticles].filter((row) => row.id !== item.id);
  const more = [...pool.filter((row) => row.cat === item.cat), ...pool.filter((row) => row.cat !== item.cat)].slice(0, 4);
  const url = typeof window === "undefined" ? `/yangiliklar/${item.id}` : window.location.href;

  return (
    <ShopShell searchPath="/yangiliklar" cartCount={cartCount} placeholder="Stomatologiya sohasidagi yangiliklarni qidiring..." showCamera={false}>
      <div className="yn2-article" data-testid="news-article">
        <nav className="yn2-crumbs" aria-label="Breadcrumb">
          <Link href="/yangiliklar">Yangiliklar</Link><ChevronRight className="i" /><span>{newsBadge(item.cat)}</span>
        </nav>
        <article className="yn2-box yn2-read">
          <span className="yn2-badge">{newsBadge(item.cat)}</span>
          <h1>{item.title}</h1>
          <div className="yn2-mrow">
            {item.author ? (
              <span className="yn2-author">
                {item.authorImage ? <img src={item.authorImage} alt="" /> : null}
                <span><b>{item.author}</b><small>{item.role}</small></span>
              </span>
            ) : null}
            <Meta item={item} />
            <SaveBtn on={saved.includes(item.id)} onClick={() => toggle(item.id)} />
          </div>
          <img className="cover" src={item.image} alt="" />
          <p className="lead">{item.lead}</p>
          <div className="share">
            <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(item.title)}`} target="_blank" rel="noreferrer"><Send className="i" /> Telegram’da ulashish</a>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(url).then(() => setCopied(true), () => setCopied(false));
              }}
            >
              {copied ? <Check className="i" /> : <Link2 className="i" />} {copied ? "Havola nusxalandi" : "Havolani nusxalash"}
            </button>
            <a href={site.telegram} target="_blank" rel="noreferrer">Kanalga obuna bo‘lish</a>
          </div>
          <Link href="/yangiliklar" className="back"><ArrowLeft className="i" /> Barcha yangiliklar</Link>
        </article>
        <aside className="yn2-box yn2-related">
          <h3>O‘xshash maqolalar</h3>
          {more.map((row) => (
            <Link key={row.id} href={`/yangiliklar/${row.id}`} className="rel">
              <img src={row.image} alt="" />
              <span><b>{row.title}</b><small>{row.date}</small></span>
            </Link>
          ))}
        </aside>
      </div>
    </ShopShell>
  );
}
