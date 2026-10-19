"use client";
/* eslint-disable @next/next/no-img-element -- equipment photos are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown, Heart, LayoutGrid, List, Search, ShieldCheck, ShoppingCart, SlidersHorizontal, Tag } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { JIZHOZ_RESULT_TOTAL, jihozKinds, mobileJihoz, type JihozKind, type MobileJihoz } from "@/data/mobile-jihozlar";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/format";
import "./jihoz-mobile.css";

function KindIcon({ id }: { id: JihozKind }) {
  if (id === "kreslo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M7 10V6.5A2.5 2.5 0 0 1 9.5 4h5A2.5 2.5 0 0 1 17 6.5V10" />
        <path d="M5 10h14v3.5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V10Z" />
        <path d="M8 16.5V20M16 16.5V20" />
      </svg>
    );
  }
  if (id === "endomotor") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M14 4.5 18 8.5 10 16.5 6 12.5 14 4.5Z" />
        <path d="M6 18.5h6" />
      </svg>
    );
  }
  if (id === "rentgen") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="8" r="3" />
        <path d="M12 11v3M8 20h8M9 14h6l1 6H8l1-6Z" />
      </svg>
    );
  }
  if (id === "fiziodispenser") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M8 10h4M8 13h6" />
      </svg>
    );
  }
  if (id === "qolcha") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 19c2-1 3-3 3-6V6l5 2v3c0 4-2 7-5 8H8Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9 8h6M12 8v4" />
    </svg>
  );
}

function BrandLogo({ brand }: { brand: string }) {
  const key = brand.toLowerCase();
  if (brand === "Ajax") return <span className="jz-logo ajax">AJA<span>X</span></span>;
  if (brand === "Eighteeth") return <span className="jz-logo eighteeth"><i />Eighteeth</span>;
  if (brand === "Woodpecker") return <span className="jz-logo woodpecker">WOODPECKER</span>;
  return <span className={`jz-logo ${key}`}>{brand}</span>;
}

function asProduct(item: MobileJihoz): Product {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: "jihozlar",
    price: item.price,
    oldPrice: item.oldPrice,
    discount: item.discount,
    rating: item.rating,
    reviews: item.reviews,
    inStock: true,
    delivery: "Toshkent: 1 kun",
    image: item.image,
    stockQty: 5,
  };
}

export function JihozMobileCatalog() {
  const { count, add } = useCart();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<JihozKind>("kreslo");
  const [kindOn, setKindOn] = useState(false);
  const [cond, setCond] = useState<"yangi" | "bu">("yangi");
  const [condOn, setCondOn] = useState(false);
  const [sort, setSort] = useState("showcase");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [brand, setBrand] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [filters, setFilters] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const brands = [...new Set(mobileJihoz.map((item) => item.brand))];
  const filterCount = 1 + (brand ? 1 : 0) + (maxPrice ? 1 : 0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = Number(maxPrice);
    const rows = mobileJihoz.filter((item) => {
      if (kindOn && item.kind !== kind) return false;
      if (condOn && item.condition !== cond) return false;
      if (brand && item.brand !== brand) return false;
      if (cap > 0 && item.price > cap) return false;
      if (!q) return true;
      return `${item.name} ${item.brand} ${item.kind}`.toLowerCase().includes(q);
    });
    if (sort === "arzon") rows.sort((a, b) => a.price - b.price);
    else if (sort === "qimmat") rows.sort((a, b) => b.price - a.price);
    else if (sort === "yangi") rows.sort((a, b) => Number(b.condition === "yangi") - Number(a.condition === "yangi") || a.rank - b.rank);
    else rows.sort((a, b) => a.rank - b.rank);
    return rows;
  }, [brand, cond, condOn, kind, kindOn, maxPrice, query, sort]);

  const quiet = !kindOn && !condOn && !query && !brand && !maxPrice;
  const resultLabel = quiet ? `${JIZHOZ_RESULT_TOTAL} ta natija` : `${list.length} ta natija`;

  return (
    <div className="jz lg:hidden" data-testid="mobile-jihoz">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-jihoz-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge" data-testid="jz-cart-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" minBadge={2} buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="jz-body">
        <h1 className="jz-title">Jihozlar</h1>
        <p className="jz-sub">Klinik jihoz va uskunalar — sotuvchilar e‘lonlari ham shu yerda</p>
        <form className="jz-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input data-jihoz-search data-section-search value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Stomatologik jihozlarni qidiring..." aria-label="Qidiruv" />
        </form>
        <div className="jz-cats" aria-label="Kategoriyalar">
          {jihozKinds.map((item) => (
            <button
              key={item.id}
              type="button"
              className={kind === item.id ? "on" : undefined}
              aria-pressed={kind === item.id}
              onClick={() => { setKind(item.id); setKindOn(true); }}
            >
              <i><KindIcon id={item.id} /></i>
              {item.label}
            </button>
          ))}
        </div>
        <div className="jz-tools">
          <button type="button" className={cond === "yangi" ? "on" : undefined} onClick={() => { setCond("yangi"); setCondOn(true); }}>Yangi</button>
          <button type="button" className={cond === "bu" ? "on" : undefined} onClick={() => { setCond("bu"); setCondOn(true); }}>B.U.</button>
          <button type="button" className="count" onClick={() => setFilters(true)}>
            <SlidersHorizontal /> Filtrlar <em>{filterCount}</em>
          </button>
          <span className="n">{resultLabel}</span>
          <label>
            <ArrowUpDown />
            <select aria-label="Saralash" value={sort === "showcase" ? "arzon" : sort} onChange={(event) => setSort(event.target.value)}>
              <option value="arzon">Arzonroq</option>
              <option value="qimmat">Qimmatroq</option>
              <option value="yangi">Yangi</option>
            </select>
            <ChevronDown />
          </label>
          <div className="views" aria-label="Ko‘rinish">
            <button type="button" className={view === "grid" ? "on" : undefined} aria-label="Katak" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid /></button>
            <button type="button" className={view === "list" ? "on" : undefined} aria-label="Ro‘yxat" aria-pressed={view === "list"} onClick={() => setView("list")}><List /></button>
          </div>
        </div>
        {note ? <p className="jz-note">{note}</p> : null}
        {list.length === 0 ? <p className="jz-note">Mos jihoz topilmadi</p> : null}
        <div className={view === "list" ? "jz-grid list" : "jz-grid"}>
          {list.map((item) => (
            <article key={item.id} className="jz-card" data-testid={`jz-card-${item.id}`}>
              <div className="jz-ph">
                <Link href={`/jihozlar/${item.id}`}><img src={item.image} alt="" /></Link>
                <span className={item.badge === "Yangi" ? "jz-badge yangi" : "jz-badge original"}>{item.badge}</span>
                <button
                  type="button"
                  className={saved.includes(item.id) ? "jz-heart on" : "jz-heart"}
                  aria-label="Sevimlilar"
                  aria-pressed={saved.includes(item.id)}
                  onClick={() => setSaved((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))}
                >
                  <Heart fill={saved.includes(item.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="jz-meta">
                <Link href={`/jihozlar/${item.id}`}>
                  <BrandLogo brand={item.brand} />
                  <h3>{item.name}</h3>
                </Link>
                <div className="jz-tags">
                  <span><ShieldCheck /> Kafolat 1 yil</span>
                  <span><Tag /> {item.condition === "yangi" ? "Yangi" : "B.U."}</span>
                </div>
                <div className="jz-buyrow">
                  <div>
                    <b>{formatMoney(item.price, "UZS")}</b>
                    <span className="jz-month">Oyiga {formatMoney(item.monthly, "UZS")} dan</span>
                  </div>
                  <button
                    type="button"
                    className="jz-add"
                    aria-label="Savatga qo‘shish"
                    data-testid={`jz-add-${item.id}`}
                    onClick={() => {
                      add(item.id, asProduct(item));
                      setNote("Savatga qo‘shildi");
                    }}
                  >
                    <ShoppingCart />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      {filters ? (
        <div className="jz-sheet" role="dialog" aria-label="Filtrlar">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form className="jz-box" onSubmit={(event) => { event.preventDefault(); setFilters(false); }}>
            <h3>Filtrlar</h3>
            <label>
              Brend
              <select aria-label="Brend" value={brand} onChange={(event) => setBrand(event.target.value)}>
                <option value="">Barchasi</option>
                {brands.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              Narx
              <select aria-label="Narx" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
                <option value="">Barchasi</option>
                <option value="10000000">10 000 000 gacha</option>
                <option value="30000000">30 000 000 gacha</option>
                <option value="50000000">50 000 000 gacha</option>
              </select>
            </label>
            <button type="submit" className="go">Ko‘rish</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
