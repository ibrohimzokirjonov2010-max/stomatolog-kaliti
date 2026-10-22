"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CalendarDays, ChevronDown, Eye, Handshake, Heart, House, LayoutGrid, MapPin, Plus, Search, ShoppingBag, SlidersHorizontal, Wrench, type LucideIcon } from "lucide-react";
import { CrmFrame } from "@/components/crm/desktop/CrmFrame";
import { listingCities, listingTypes, getListing, type Listing, type ListingType } from "@/data/listings";
import { classifiedToListing, type ClassifiedRow } from "@/lib/classified-view";
import { ELON_CATEGORIES, instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import { useStoredList } from "@/lib/stored-list";
import "./listings-desktop.css";

const TYPE_ICON: Record<string, LucideIcon> = { "": LayoutGrid, sotiladi: ShoppingBag, ijara: House, ish: BriefcaseBusiness, xizmat: Wrench, hamkor: Handshake };
/** Jobs and services live in their own sections; these tiles link there with live counts. */
const ELSEWHERE: Record<string, { href: string; api: string }> = { ish: { href: "/ishlar", api: "/api/work/jobs" }, xizmat: { href: "/ustalar", api: "/api/work/masters" } };
const PRICE_STEPS = [["", "Narx (so‘m)"], ["1", "1 mln gacha"], ["10", "1–10 mln"], ["11", "10 mln dan yuqori"]] as const;

const SAVED = "sk-elon-saved-v1";

export function ListingsDesktop() {
  const router = useRouter();
  const params = useSearchParams();
  const [outside, setOutside] = useState<Record<string, number>>({});
  const initial = (params.get("tur") as ListingType | null) ?? "";
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [remote, setRemote] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<ListingType | "">(initial);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState("yangi");
  const [price, setPrice] = useState("");
  const [more, setMore] = useState(false);
  const [allCities, setAllCities] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    setType(initial);
  }, [initial]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED);
      if (raw) setSaved(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let cancel = false;
    void fetch("/api/work/classifieds").then(async (res) => {
      const data = await res.json().catch(() => null) as { items?: ClassifiedRow[] } | null;
      if (!cancel && Array.isArray(data?.items)) setRemote(data.items.map(classifiedToListing));
    }).catch(() => undefined);
    for (const [key, { api }] of Object.entries(ELSEWHERE)) {
      void fetch(api).then(async (res) => {
        const data = await res.json().catch(() => null) as Record<string, unknown> | null;
        const list = Object.values(data ?? {}).find(Array.isArray) as unknown[] | undefined;
        if (!cancel && list) setOutside((cur) => ({ ...cur, [key]: list.length }));
      }).catch(() => undefined);
    }
    return () => { cancel = true; };
  }, []);

  const all = [...remote, ...extra.filter((item) => !remote.some((row) => row.id === item.id))];
  const items = useMemo(() => {
    const next = all.filter((item) => {
      if (type && item.type !== type) return false;
      if (category && item.category !== category) return false;
      if (city && item.city !== city) return false;
      if (q.trim() && !`${item.title} ${item.city} ${item.category}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
      const sum = item.price ?? 0;
      if (price === "1" && !(item.price != null && sum <= 1_000_000)) return false;
      if (price === "10" && !(sum > 1_000_000 && sum <= 10_000_000)) return false;
      if (price === "11" && !(sum > 10_000_000)) return false;
      return true;
    });
    next.sort((a, b) => sort === "arzon" ? (a.price ?? 0) - (b.price ?? 0) : sort === "qimmat" ? (b.price ?? 0) - (a.price ?? 0) : b.date.localeCompare(a.date));
    return next;
  }, [all, category, city, price, q, sort, type]);

  function toggle(id: string) {
    setSaved((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      window.localStorage.setItem(SAVED, JSON.stringify(next));
      return next;
    });
  }

  return (
    <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring..." headerQuery={q} onHeaderQuery={setQ}>
      <div data-testid="listings-desktop" className="elx">
        <div className="elx-head">
          <div>
            <h1>E‘lonlar</h1>
            <p>Stomatologiya sohasidagi e’lonlar: sotiladi, ijaraga, ish o‘rni va boshqalar</p>
          </div>
          <Link href="/elonlar/yangi" className="elx-add" data-testid="listing-add"><Plus size={18} /> E‘lon joylashtirish</Link>
        </div>
        <div className="elx-grid">
          <div className="elx-main">
            <div className="elx-tiles">
              {listingTypes.map((item) => {
                const Icon = TYPE_ICON[item.id] ?? LayoutGrid;
                return (
                  <button key={item.label} type="button" className={type === item.id ? "on" : undefined} data-testid={`listing-type-${item.id || "all"}`} onClick={() => (ELSEWHERE[item.id] ? router.push(ELSEWHERE[item.id].href) : setType(item.id))}>
                    <Icon size={24} strokeWidth={1.7} />
                    <b>{item.label}</b>
                    <small>{item.id === "" ? all.length : ELSEWHERE[item.id] ? outside[item.id] ?? "…" : all.filter((row) => row.type === item.id).length}</small>
                  </button>
                );
              })}
            </div>
            <div className="elx-tools">
              <label className="elx-search"><Search size={16} /><input data-testid="listing-search" aria-label="E’lon qidirish" value={q} placeholder="Kalit so‘z bo‘yicha qidiring..." onChange={(event) => setQ(event.target.value)} /></label>
              <label className="elx-sel"><select data-testid="listing-category" aria-label="Toifa" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Barcha toifalar</option>{ELON_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label>
              <label className="elx-sel"><select data-testid="listing-city" aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}><option value="">Barcha shaharlar</option>{listingCities.map((item) => <option key={item.city}>{item.city}</option>)}</select><ChevronDown size={15} /></label>
              <label className="elx-sel"><select data-testid="listing-price" aria-label="Narx" value={price} onChange={(event) => setPrice(event.target.value)}>{PRICE_STEPS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><ChevronDown size={15} /></label>
              <button type="button" className={more ? "elx-filter on" : "elx-filter"} aria-expanded={more} onClick={() => setMore((value) => !value)}><SlidersHorizontal size={15} /> Filtrlar</button>
            </div>
            {more ? (
              <div className="elx-more">
                <span>Saralash:</span>
                {([["yangi", "Yangilari"], ["arzon", "Arzonlari"], ["qimmat", "Qimmatlari"]] as const).map(([id, label]) => (
                  <button key={id} type="button" data-testid={`listing-sort-${id}`} className={sort === id ? "on" : undefined} onClick={() => setSort(id)}>{label}</button>
                ))}
                {type || category || city || price || q ? <button type="button" className="reset" onClick={() => { setType(""); setCategory(""); setCity(""); setPrice(""); setQ(""); }}>Tozalash</button> : null}
              </div>
            ) : null}
            {items.length === 0 ? (
              <div className="elx-empty" data-testid="listing-empty"><b>E’lon topilmadi</b><span>Filtrlarni o‘zgartiring yoki birinchi bo‘lib e’lon joylashtiring.</span><Link href="/elonlar/yangi" className="elx-add"><Plus size={16} /> E‘lon joylashtirish</Link></div>
            ) : (
              <div className="elx-cards">
                {items.map((item) => (
                  <article key={item.id} className="elx-card" data-testid="listing-card">
                    <Link href={`/elonlar/${item.id}`} className="ph"><img src={item.image} alt="" /></Link>
                    <span className={`elx-flag ${item.type}`}>{listingTypes.find((row) => row.id === item.type)?.label ?? item.typeLabel}</span>
                    <button type="button" className={`elx-heart${saved.includes(item.id) ? " on" : ""}`} aria-label="Saqlash" data-testid={`listing-heart-${item.id}`} onClick={() => toggle(item.id)}><Heart size={16} /></button>
                    <div className="pad">
                      <h3><Link href={`/elonlar/${item.id}`}>{item.title}</Link></h3>
                      <p className="meta"><span><MapPin size={13} />{item.city || "—"}</span>{item.dateLabel ? <span><CalendarDays size={13} />{item.dateLabel}</span> : null}</p>
                      <p className={item.price ? "price" : "price deal"}>{item.priceLabel}</p>
                      <p className="stats">{item.views ? <span><Eye size={14} />{item.views}</span> : null}<span><Heart size={13} />{item.likes + (saved.includes(item.id) ? 1 : 0)}</span></p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
          <aside className="elx-side">
            <section>
              <h3>Ommabop shaharlar</h3>
              {[...listingCities].sort((x, y) => all.filter((row) => row.city === y.city).length - all.filter((row) => row.city === x.city).length).slice(0, allCities ? undefined : 6).map((item) => (
                <button key={item.city} type="button" className={city === item.city ? "elx-city on" : "elx-city"} onClick={() => setCity(city === item.city ? "" : item.city)}><MapPin size={15} /><span>{item.city}</span><b>{all.filter((row) => row.city === item.city).length}</b></button>
              ))}
              <button type="button" className="elx-link" onClick={() => { setCity(""); setAllCities((value) => !value); }}>Barcha shaharlar <ArrowRight size={14} /></button>
            </section>
            <section>
              <h3>So‘nggi e’lonlar <button type="button" className="elx-link" onClick={() => { setType(""); setSort("yangi"); }}>Barchasi <ArrowRight size={14} /></button></h3>
              {all.length === 0 ? <p className="elx-muted">Hozircha e’lon yo‘q</p> : [...all].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 4).map((item) => (
                <Link key={item.id} href={`/elonlar/${item.id}`} className="elx-recent"><img src={item.image} alt="" /><span><b>{item.title}</b><em>{item.priceLabel}</em><small><MapPin size={11} />{[item.city, item.dateLabel].filter(Boolean).join(" • ")}</small></span></Link>
              ))}
            </section>
          </aside>
        </div>
      </div>
    </CrmFrame>
  );
}

export function ListingDetailDesktop({ id }: { id: string }) {
  const [extra] = useStoredList("sk-elonlar-v1", [] as Listing[]);
  const [remote, setRemote] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancel = false;
    void fetch(`/api/work/classifieds/${id}`).then(async (res) => {
      const data = await res.json().catch(() => null) as { item?: ClassifiedRow } | null;
      if (!cancel && data?.item) setRemote(classifiedToListing(data.item));
      if (!cancel) setReady(true);
    }).catch(() => { if (!cancel) setReady(true); });
    return () => { cancel = true; };
  }, [id]);
  const item = remote ?? getListing(id, extra);
  if (!item && !ready) {
    return (
      <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring...">
        <div className="crm-empty">Yuklanmoqda…</div>
      </CrmFrame>
    );
  }
  if (!item) {
    return (
      <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring...">
        <div className="crm-empty">E’lon topilmadi</div>
      </CrmFrame>
    );
  }
  return (
    <CrmFrame active="listings" listings placeholder="E‘lonlar bo‘yicha qidiring...">
      <div data-testid="listing-detail">
        <Link href="/elonlar" className="crm-btn">Orqaga</Link>
        <div className="crm-split" style={{ marginTop: "calc(.4 * var(--u))", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,.8fr)" }}>
          <div className="crm-card">
            <img src={item.image} alt="" style={{ width: "100%", height: "calc(16 * var(--u))", objectFit: "cover" }} />
            <div style={{ padding: "calc(.6 * var(--u))" }}>
              <span className={`el-flag ${item.type}`} style={{ position: "static" }}>{item.typeLabel}</span>
              <h1 style={{ fontSize: "calc(1.2 * var(--u))", margin: "calc(.3 * var(--u)) 0" }}>{item.title}</h1>
              <p className="el-price">{item.priceLabel}</p>
              <p className="crm-muted">{item.city} · {item.dateLabel} · {item.views} ko‘rish</p>
              <p>{item.description}</p>
            </div>
          </div>
          <aside className="pl-box">
            <b>Bog‘lanish</b>
            <p className="crm-muted">E’lon egasi bilan chat yoki telefon orqali.</p>
            {item.phone ? <a className="crm-btn blue" href={`tel:${item.phone.replace(/\s/g, "")}`}>{item.phone}</a> : <p className="crm-muted">Telefon ko‘rsatilmagan.</p>}
            {item.telegram ? <a className="crm-btn" href={`https://t.me/${item.telegram.replace(/^@/, "")}`}>@{item.telegram.replace(/^@/, "")}</a> : null}
            {sourceUrlValue(item.sourceUrl ?? "") ? <a className="crm-btn" href={sourceUrlValue(item.sourceUrl ?? "")} target="_blank" rel="noopener nofollow" data-testid="listing-source">{sourceUrlValue(item.sourceUrl ?? "")}</a> : null}
            {instagramHref(item.instagram ?? "") ? <a className="crm-btn" href={instagramHref(item.instagram ?? "")} target="_blank" rel="noopener nofollow" data-testid="listing-instagram">{instagramValue(item.instagram ?? "")}</a> : null}
          </aside>
        </div>
      </div>
    </CrmFrame>
  );
}
