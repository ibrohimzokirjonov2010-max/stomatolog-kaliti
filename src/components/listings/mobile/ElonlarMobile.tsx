"use client";
/* eslint-disable @next/next/no-img-element -- listing photos are user uploads */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Armchair, Briefcase, Building2, CalendarDays, Filter, Heart, LayoutGrid, MapPin, Package, Plus, Search } from "lucide-react";
import { useFavorites } from "@/components/favorites-provider";
import { listingCities, type Listing } from "@/data/listings";
import { classifiedToListing, type ClassifiedRow } from "@/lib/classified-view";
import { useStoredList } from "@/lib/stored-list";
import "./elonlar-mobile.css";

type Deal = "sotiladi" | "ijara" | "ish";
const DEALS: { id: Deal; label: string }[] = [
  { id: "sotiladi", label: "Sotiladi" },
  { id: "ijara", label: "Ijaraga" },
  { id: "ish", label: "Ish o‘rni" },
];
const CATS: { id: string; label: string; icon: typeof Package }[] = [
  { id: "", label: "Barchasi", icon: LayoutGrid },
  { id: "Uskunalar", label: "Uskunalar", icon: Armchair },
  { id: "Materiallar", label: "Materiallar", icon: Package },
  { id: "Asboblar", label: "Asboblar", icon: Package },
  { id: "Ijara", label: "Klinika", icon: Building2 },
  { id: "Ish", label: "Ish o‘rni", icon: Briefcase },
];

function dealOf(item: Listing): Deal {
  if (item.type === "ijara") return "ijara";
  if (item.type === "ish") return "ish";
  return "sotiladi";
}

/** Phone /elonlar (mock "e‘lonlar telefon"). Desktop renders ListingsDesktop from AppChrome. */
export function ElonlarMobile() {
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [remote, setRemote] = useState<Listing[] | null>(null);
  const [deal, setDeal] = useState<Deal>("sotiladi");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const favorites = useFavorites();

  useEffect(() => {
    let cancel = false;
    void fetch("/api/work/classifieds")
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { items?: ClassifiedRow[] } | null;
        if (!cancel) setRemote(Array.isArray(data?.items) ? data.items.map(classifiedToListing) : []);
      })
      .catch(() => {
        if (!cancel) setRemote([]);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const all = [...(remote ?? []), ...extra.filter((item) => !(remote ?? []).some((row) => row.id === item.id))];
  const counts = DEALS.reduce<Record<Deal, number>>((acc, item) => ({ ...acc, [item.id]: all.filter((row) => dealOf(row) === item.id).length }), { sotiladi: 0, ijara: 0, ish: 0 });
  const needle = q.trim().toLowerCase();
  const shown = all
    .filter((item) => dealOf(item) === deal)
    .filter((item) => !cat || item.category === cat)
    .filter((item) => !city || item.city === city)
    .filter((item) => !needle || `${item.title} ${item.category} ${item.city} ${item.description}`.toLowerCase().includes(needle))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="el lg:hidden" data-testid="listings-mobile">
      <header className="el-head">
        <div>
          <h1>E‘lonlar</h1>
          <p>Stomatologiya sohasidagi e‘lonlar</p>
        </div>
        <Link href="/elonlar/yangi" className="el-new"><Plus /> E‘lon joylash</Link>
      </header>
      <div className="el-tools">
        <label className="el-search"><Search /><input value={q} placeholder="Kalit so‘z, kategoriya yoki shahar bo‘yicha qidirish..." aria-label="Qidirish" onChange={(event) => setQ(event.target.value)} /></label>
        <button type="button" className={city ? "el-filter on" : "el-filter"} aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}><Filter /> Filtr</button>
      </div>
      {filterOpen ? (
        <div className="el-cities">
          <button type="button" className={!city ? "on" : ""} onClick={() => setCity("")}>Barcha shaharlar</button>
          {listingCities.map((item) => (
            <button key={item.city} type="button" className={city === item.city ? "on" : ""} onClick={() => setCity(item.city)}>{item.city}</button>
          ))}
        </div>
      ) : null}
      <div className="el-deals" role="tablist">
        {DEALS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={deal === item.id} className={deal === item.id ? "on" : ""} onClick={() => setDeal(item.id)}>
            {item.label} ({counts[item.id]})
          </button>
        ))}
      </div>
      <div className="el-cats">
        {CATS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} type="button" className={cat === item.id ? "on" : ""} onClick={() => setCat(item.id)}><Icon /> {item.label}</button>
          );
        })}
      </div>
      {remote === null ? (
        <p className="el-empty">Yuklanmoqda…</p>
      ) : shown.length === 0 ? (
        <p className="el-empty">{all.length === 0 ? "Hozircha e’lon yo‘q." : "Mos e’lon topilmadi."}</p>
      ) : (
        <ul className="el-list">
          {shown.map((item) => {
            const liked = favorites.has(`elon:${item.id}`);
            return (
              <li key={item.id} className="el-card">
                <Link href={`/elonlar/${item.id}`} className="el-img">
                  <img src={item.image} alt="" />
                  <span className={`el-flag ${dealOf(item)}`}>{DEALS.find((row) => row.id === dealOf(item))?.label}</span>
                </Link>
                <div className="el-body">
                  <Link href={`/elonlar/${item.id}`} className="el-title">{item.title}</Link>
                  {item.description ? <p className="el-desc">{item.description}</p> : null}
                  <b className="el-price">{item.priceLabel}</b>
                  <p className="el-meta">
                    {item.city ? <span><MapPin /> {item.city}</span> : null}
                    {item.dateLabel ? <span><CalendarDays /> {item.dateLabel}</span> : null}
                  </p>
                </div>
                <button type="button" className={liked ? "el-like on" : "el-like"} aria-label="Saqlash" aria-pressed={liked} onClick={() => favorites.toggle(`elon:${item.id}`)}><Heart /></button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
