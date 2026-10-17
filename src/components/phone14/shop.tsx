"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, Heart, ShoppingCart, SlidersHorizontal, Star } from "lucide-react";
import { PhoneFrame, SearchBox, Sheet } from "@/components/phone14/chrome";
import { letterInRange, letterRanges, phoneBrands, phoneCategories, phoneSales } from "@/data/phone14";
import { useCart } from "@/components/cart-provider";
import { formatGroupedNumber } from "@/lib/format";
import type { Product } from "@/data/products";

const ICONS = ["grid", "plus", "tool", "chair", "drop", "smile", "flask", "shirt", "cal", "cog", "hands", "more"];

function Mini({ id }: { id: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  if (id === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (id === "tool") return <svg {...common}><path d="M14 6.5 17.5 10M7 13.5l6-6" /></svg>;
  if (id === "smile") return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M8 13c1.2 2 6.8 2 8 0" /></svg>;
  return <svg {...common}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>;
}

export function PhoneCategories() {
  const [q, setQ] = useState("");
  const items = phoneCategories.filter((item) => `${item.title} ${item.count}`.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <PhoneFrame testId="phone-kategoriyalar">
      <div>
        <h1>Kategoriyalar</h1>
        <p className="sub">Sizga kerakli stomatologik mahsulot va xizmatlar</p>
      </div>
      <SearchBox value={q} onChange={setQ} label="Kategoriya qidirish" placeholder="Mahsulot, brend yoki kategoriya qidirish..." />
      {items.length === 0 ? <p className="p14-empty">Kategoriya topilmadi</p> : (
        <div className="p14-grid">
          {items.map((item, index) => (
            <Link key={item.id} href={item.href} className="p14-card cat-card">
              <span className="meta">
                <span className="cat-ico" style={{ background: item.tint, color: item.color }}><Mini id={ICONS[index] ?? "grid"} /></span>
                <b>{item.title}</b>
                <small>{item.count}</small>
                <span className="cat-go"><ArrowRight /></span>
              </span>
              <img className="cat-photo" src={item.image} alt="" />
            </Link>
          ))}
        </div>
      )}
    </PhoneFrame>
  );
}

export function PhoneBrands() {
  const [q, setQ] = useState("");
  const [range, setRange] = useState("Barchasi");
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(0);
  const items = useMemo(() => phoneBrands.filter((item) => {
    if (q.trim() && !item.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (!letterInRange(item.letter, range)) return false;
    if (item.count < min) return false;
    return true;
  }), [min, q, range]);
  return (
    <PhoneFrame testId="phone-brendlar">
      <div>
        <h1>Brendlar</h1>
        <p className="sub">Mashhur stomatologik brendlar va ishlab chiqaruvchilar</p>
      </div>
      <SearchBox value={q} onChange={setQ} label="Brend qidirish" placeholder="Brend nomi bo‘yicha qidirish..." />
      <div className="p14-row">
        {letterRanges.map((item) => (
          <button key={item} type="button" className={range === item ? "p14-chip on" : "p14-chip"} onClick={() => setRange(item)}>{item}</button>
        ))}
        <button type="button" className="p14-filter" onClick={() => setOpen(true)}><SlidersHorizontal /> Filtr</button>
      </div>
      {items.length === 0 ? <p className="p14-empty">Brend topilmadi</p> : (
        <div className="p14-grid">
          {items.map((item) => (
            <Link key={item.name} href={`/marketplace?brand=${encodeURIComponent(item.name)}`} className="p14-card brand-card">
              <img src={item.logo} alt="" />
              <b>{item.name}</b>
              <span>{item.count} ta mahsulot <ChevronRight size={16} /></span>
            </Link>
          ))}
        </div>
      )}
      {open ? (
        <Sheet title="Filtr" onClose={() => setOpen(false)}>
          <label>Kamida mahsulot
            <select aria-label="Minimum" value={min} onChange={(event) => setMin(Number(event.target.value))}>
              <option value={0}>Barchasi</option>
              <option value={50}>50+</option>
              <option value={80}>80+</option>
              <option value={100}>100+</option>
            </select>
          </label>
          <button type="button" className="p14-go" onClick={() => setOpen(false)}>Qo‘llash</button>
        </Sheet>
      ) : null}
    </PhoneFrame>
  );
}

function clock(total: number) {
  const safe = Math.max(0, total);
  const d = Math.floor(safe / 86400);
  const h = Math.floor((safe % 86400) / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d} kun ${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function PhoneSales() {
  const { add } = useCart();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Barchasi");
  const [sort, setSort] = useState("mashhur");
  const [brand, setBrand] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [left, setLeft] = useState<Record<string, number>>(() => Object.fromEntries(phoneSales.map((item) => [item.id, item.seconds])));
  const [note, setNote] = useState("");
  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((prev) => Object.fromEntries(Object.entries(prev).map(([key, value]) => [key, Math.max(0, value - 1)])));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
  const items = useMemo(() => {
    const list = phoneSales.filter((item) => {
      if (cat !== "Barchasi" && item.category !== cat) return false;
      if (brand && item.brand !== brand) return false;
      const blob = `${item.brand} ${item.name} ${item.spec} ${item.tags.join(" ")}`.toLowerCase();
      return !q.trim() || blob.includes(q.trim().toLowerCase());
    });
    if (sort === "chegirma") return [...list].sort((a, b) => b.discount - a.discount);
    if (sort === "muddat") return [...list].sort((a, b) => (left[a.id] ?? 0) - (left[b.id] ?? 0));
    return [...list].sort((a, b) => b.reviews - a.reviews);
  }, [brand, cat, left, q, sort]);
  return (
    <PhoneFrame testId="phone-aksiyalar">
      <div className="p14-head">
        <div>
          <h1>Aksiyalar</h1>
          <p className="sub">Stomatologik mahsulotlarda maxsus takliflar</p>
        </div>
        <button type="button" className="p14-chip on" onClick={() => { setCat("Barchasi"); setBrand(""); setQ(""); }}>Barcha aksiyalar</button>
      </div>
      <SearchBox value={q} onChange={setQ} label="Aksiya qidirish" placeholder="Mahsulot yoki brend qidirish..." />
      <div className="p14-row">
        {["Barchasi", "Stomatologik materiallar", "Implantlar", "Instrumentlar"].map((item) => (
          <button key={item} type="button" className={cat === item ? "p14-chip on" : "p14-chip"} onClick={() => setCat(item)}>{item}</button>
        ))}
        <button type="button" className="p14-filter" onClick={() => setSort(sort === "chegirma" ? "mashhur" : "chegirma")}><SlidersHorizontal /> Filtr</button>
      </div>
      <div className="p14-row">
        <button type="button" className={sort === "mashhur" ? "p14-chip on" : "p14-chip"} onClick={() => setSort("mashhur")}>Eng mashhur</button>
        <button type="button" className={sort === "chegirma" ? "p14-chip on" : "p14-chip"} onClick={() => setSort("chegirma")}>Chegirma</button>
        <button type="button" className={sort === "muddat" ? "p14-chip on" : "p14-chip"} onClick={() => setSort("muddat")}>Muddatli</button>
        <label className="p14-filter">Brendlar
          <select aria-label="Brendlar" value={brand} onChange={(event) => setBrand(event.target.value)} style={{ border: 0, background: "transparent", font: "inherit" }}>
            <option value="">Barchasi</option>
            {[...new Set(phoneSales.map((item) => item.brand))].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="list">
        {items.length === 0 ? <p className="p14-empty">Aksiya topilmadi</p> : items.map((item) => (
          <article key={item.id} className="p14-card sale">
            <img src={item.image} alt="" />
            <div>
              <span className="tag">-{item.discount}%</span>
              <div style={{ float: "right" }}>
                <button type="button" className={saved.includes(item.id) ? "icon-btn on" : "icon-btn"} aria-label="Sevimli" aria-pressed={saved.includes(item.id)} onClick={() => setSaved((prev) => prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id])}>
                  <Heart fill={saved.includes(item.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <small className="spec">{item.brand}</small>
              <h3>{item.name}</h3>
              <p className="spec">{item.spec}</p>
              <p className="tags">{item.tags.map((tag) => <i key={tag}>{tag}</i>)}</p>
              <p><Star size={14} color="#f5b400" fill="#f5b400" /> {item.rating} ({item.reviews})</p>
              <p><b className="price">{formatGroupedNumber(item.price)}</b> <span className="old">{formatGroupedNumber(item.old)}</span></p>
              <p className="timer" data-testid={`timer-${item.id}`}>{clock(left[item.id] ?? 0)}</p>
              <button type="button" className="buy" style={{ width: "100%" }} onClick={() => {
                add(item.id, { id: item.id, name: item.name, brand: item.brand, category: "materiallar", price: item.price, oldPrice: item.old, discount: item.discount, rating: item.rating, reviews: item.reviews, inStock: true, delivery: "Toshkent", image: item.image } satisfies Product);
                setNote("Savatga qo‘shildi");
                window.setTimeout(() => setNote(""), 1600);
              }}><ShoppingCart size={16} /> Savatga</button>
            </div>
          </article>
        ))}
      </div>
      {note ? <div className="p14-note" role="status">{note}</div> : null}
    </PhoneFrame>
  );
}
