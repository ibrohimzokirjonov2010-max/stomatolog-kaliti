"use client";
/* eslint-disable @next/next/no-img-element -- news photos are sized by the card layout */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, ChevronRight, Clock, Eye, Flame, Search, ShoppingCart, SlidersHorizontal } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { NotificationBell } from "@/components/notification-bell";
import { formatNewsViews, mobileNews, newsKinds, type NewsKind } from "@/data/mobile-news";
import "./yangiliklar-mobile.css";

function KindIcon({ id }: { id: "all" | NewsKind }) {
  if (id === "all") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (id === "texnologiya") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 5c1.2 2 2.2 2.2 4 2.2S14.8 7 16 5" />
        <path d="M9 9.5c.8 3 1.6 4.5 3 4.5s2.2-1.5 3-4.5" />
        <path d="M10.2 14.2 9 20h6l-1.2-5.8" />
      </svg>
    );
  }
  if (id === "seminarlar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M3 10 12 5l9 5-9 5-9-5Z" />
        <path d="M7 12.5V16c1.6 1.4 3.2 2 5 2s3.4-.6 5-2v-3.5" />
      </svg>
    );
  }
  if (id === "klinikalar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 20V8l8-4 8 4v12" />
        <path d="M9 20v-5h6v5M12 9v4M10 11h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M9 4h6v4a3 3 0 0 1-6 0V4Z" />
      <path d="M9 6H7a3 3 0 0 0 0 6h2M15 6h2a3 3 0 0 1 0 6h-2" />
      <path d="M12 14v3M9 20h6" />
    </svg>
  );
}

function Meta({ date, minutes, views, light }: { date: string; minutes: number; views: number; light?: boolean }) {
  return (
    <div className="nw-meta" style={light ? undefined : { color: "#8b93a7" }}>
      <span><Calendar /> {date}</span>
      <span><Clock /> {minutes} daqiqa</span>
      <span><Eye /> {formatNewsViews(views)}</span>
    </div>
  );
}

export function YangiliklarMobileList() {
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | NewsKind>("all");
  const [filters, setFilters] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mobileNews
      .filter((item) => {
        if (kind !== "all" && item.kind !== kind) return false;
        if (!q) return true;
        return `${item.title} ${item.excerpt}`.toLowerCase().includes(q);
      })
      .sort((a, b) => a.rank - b.rank);
  }, [kind, query]);

  const featured = rows.find((item) => item.featured) ?? null;
  const list = rows.filter((item) => item.id !== featured?.id);

  return (
    <div className="nw lg:hidden" data-testid="mobile-yangiliklar">
      <header className="mh-bar">
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-news-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" minBadge={2} buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="nw-body">
        <h1 className="nw-title">Yangiliklar</h1>
        <p className="nw-sub">Stomatologiya sohasidagi eng so‘nggi yangiliklar va maqolalar</p>
        <form className="nw-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-news-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Yangiliklar qidirish..." aria-label="Qidiruv" />
          <button type="button" className="nw-filter" aria-label="Filtr" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </button>
        </form>
        <div className="nw-cats" aria-label="Kategoriyalar">
          {newsKinds.map((item) => (
            <button key={item.id} type="button" className={kind === item.id ? "on" : undefined} aria-pressed={kind === item.id} onClick={() => setKind(item.id)}>
              <i><KindIcon id={item.id} /></i>
              {item.label}
            </button>
          ))}
        </div>
        {featured ? (
          <Link href={`/yangiliklar/${featured.id}`} className="nw-hero" data-testid="nw-hero">
            <img src={featured.image} alt="" />
            <span className="nw-shade" />
            <span className="copy">
              <span className="nw-badge"><Flame /> Mashhur</span>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <Meta date={featured.date} minutes={featured.minutes} views={featured.views} light />
            </span>
            <span className="nw-arrow" aria-hidden="true"><ChevronRight /></span>
          </Link>
        ) : null}
        <div className="nw-list">
          {list.length === 0 && !featured ? <p className="nw-empty">Yangilik topilmadi</p> : null}
          {list.map((item) => (
            <Link key={item.id} href={`/yangiliklar/${item.id}`} className="nw-card" data-testid={`nw-card-${item.id}`}>
              <img src={item.image} alt="" />
              <span>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
                <Meta date={item.date} minutes={item.minutes} views={item.views} />
              </span>
              <span className="nw-go" aria-hidden="true"><ChevronRight /></span>
            </Link>
          ))}
        </div>
        <div className="nw-pad" />
      </div>
      <button
        type="button"
        className={subscribed ? "nw-subbtn on" : "nw-subbtn"}
        data-testid="nw-sub"
        aria-pressed={subscribed}
        onClick={() => setSubscribed((value) => !value)}
      >
        <Bell /> {subscribed ? "Obuna bo‘lindi" : "Obuna bo‘lish"}
      </button>
      {filters ? (
        <div className="nw-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <div className="nw-box">
            <h3>Filtr</h3>
            {newsKinds.map((item) => (
              <button
                key={item.id}
                type="button"
                className={kind === item.id ? "pick on" : "pick"}
                onClick={() => { setKind(item.id); setFilters(false); }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
