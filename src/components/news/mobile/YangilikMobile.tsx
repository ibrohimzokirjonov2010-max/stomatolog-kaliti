"use client";
/* eslint-disable @next/next/no-img-element -- article cover is a content photo */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Clock, FileText, Share2 } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { fetchNews, type LiveNews } from "@/lib/live-content";
import { formatUzDate } from "@/lib/format";
import "./yangilik-mobile.css";

type Part = { kind: "p"; text: string } | { kind: "h"; text: string; n: number };

const HEADING = /^(?:#{1,3}\s+|\d{1,2}[.)]\s+)(.{2,90})$/;

/** Splits the plain-text body into paragraphs; "1. Title" / "## Title" lines become numbered sections. */
function parse(body: string): Part[] {
  const parts: Part[] = [];
  let n = 0;
  for (const block of body.split(/\n\s*\n|\n(?=(?:#{1,3}\s|\d{1,2}[.)]\s))/)) {
    const text = block.trim();
    if (!text) continue;
    const match = !text.includes("\n") ? HEADING.exec(text) : null;
    if (match) parts.push({ kind: "h", text: match[1].trim(), n: ++n });
    else parts.push({ kind: "p", text });
  }
  return parts;
}

export function YangilikMobile({ id }: { id: string }) {
  const [article, setArticle] = useState<LiveNews | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const favorites = useFavorites();

  useEffect(() => {
    let stop = false;
    void fetchNews().then((rows) => {
      if (!stop) setArticle(rows.find((item) => item.id === id) ?? null);
    });
    return () => {
      stop = true;
    };
  }, [id]);

  if (article === undefined) return <p className="yn-state lg:hidden">Yuklanmoqda…</p>;
  if (!article) {
    return (
      <div className="yn-state lg:hidden">
        <p>Yangilik topilmadi</p>
        <Link href="/yangiliklar">Yangiliklarga qaytish</Link>
      </div>
    );
  }

  const parts = parse(article.body);
  const toc = parts.filter((part): part is Extract<Part, { kind: "h" }> => part.kind === "h");
  const lead = parts[0]?.kind === "p" ? parts[0].text : "";
  const rest = lead ? parts.slice(1) : parts;
  const minutes = Math.max(1, Math.round(article.body.split(/\s+/).filter(Boolean).length / 200));
  const date = article.publishedAt ? formatUzDate(article.publishedAt.slice(0, 10)) : null;
  const favId = `news:${article.id}`;
  const saved = favorites.has(favId);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: article?.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <article className="yn lg:hidden" data-testid="mobile-yangilik">
      {article.cover ? (
        <div className="yn-cover">
          <img src={article.cover} alt="" />
          <div className="yn-tools">
            <button type="button" aria-label="Ulashish" onClick={() => void share()}><Share2 /></button>
            <button type="button" aria-label="Saqlash" aria-pressed={saved} className={saved ? "on" : ""} onClick={() => favorites.toggle(favId)}><Bookmark /></button>
          </div>
        </div>
      ) : null}

      <div className="yn-meta-row">
        {article.tags[0] ? <span className="yn-tag">{article.tags[0]}</span> : <span />}
        {date ? <span className="yn-date">{date.dayNum}-{date.month} {date.year}</span> : null}
      </div>
      <h1>{article.title}</h1>
      {lead ? <p className="yn-lead">{lead}</p> : null}

      <div className="yn-bar">
        <span><Clock /> {minutes} daqiqa o‘qish</span>
        <span><FileText /> Maqola</span>
        <button type="button" aria-pressed={saved} onClick={() => favorites.toggle(favId)}><Bookmark className={saved ? "fill" : ""} /> {saved ? "Saqlangan" : "Saqlash"}</button>
        <button type="button" onClick={() => void share()}><Share2 /> {copied ? "Nusxalandi" : "Ulashish"}</button>
      </div>

      {toc.length > 1 ? (
        <section className="yn-toc">
          <h2>Maqola mazmuni</h2>
          <ol>
            {toc.map((item) => (
              <li key={item.n}><a href={`#bo-lim-${item.n}`}><span>{item.n}</span>{item.text}</a></li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="yn-body">
        {rest.map((part, index) =>
          part.kind === "h" ? (
            <h2 key={index} id={`bo-lim-${part.n}`}><span>{part.n}</span>{part.text}</h2>
          ) : (
            <p key={index}>{part.text}</p>
          ),
        )}
      </div>

      {article.tags.length > 1 ? (
        <div className="yn-tags">{article.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
      ) : null}
    </article>
  );
}
