"use client";
/* eslint-disable @next/next/no-img-element -- uniform photos are sized by the fluid unit */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, ChevronDown, ChevronRight, Heart, Search, ShoppingCart, SlidersHorizontal, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { formaKinds, mobileForma, type FormaColor, type FormaGender, type FormaKind, type MobileForma } from "@/data/mobile-forma";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/format";
import "./forma-mobile.css";

const catalog = mobileForma.filter((item) => !item.pdpOnly);
const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
const sizes = sizeOrder.filter((size) => catalog.some((item) => item.sizes.includes(size)));
const colors = catalog.reduce<FormaColor[]>((list, item) => {
  item.colors.forEach((color) => {
    if (!list.some((entry) => entry.id === color.id)) list.push(color);
  });
  return list;
}, []);

function KindIcon({ id }: { id: "all" | FormaKind }) {
  if (id === "all") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
      </svg>
    );
  }
  if (id === "kostyum") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 4.5 12 7l4-2.5 3 2.2-2.2 2.1V20H7.2V8.8L5 6.7l3-2.2Z" />
        <path d="M10 11.5h4" />
      </svg>
    );
  }
  if (id === "xalat") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 4.2 12 6.5 16 4.2l3.2 2-2 2.2V20H6.8V8.4L4.8 6.2l3.2-2Z" />
        <path d="M12 6.5V20" />
      </svg>
    );
  }
  if (id === "qishki") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M8 5.2 12 7.2l4-2 2.8 1.8V19H5.2V7l2.8-1.8Z" />
        <path d="M12 7.2V19M9 11h6" />
      </svg>
    );
  }
  if (id === "bosh") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M6 13.5c0-3.4 2.6-6 6-6s6 2.6 6 6v1.2c0 .8-.7 1.5-1.6 1.5H7.6c-.9 0-1.6-.7-1.6-1.5V13.5Z" />
        <path d="M8.2 16.2c.6 1.6 2 2.8 3.8 2.8s3.2-1.2 3.8-2.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 15.5c1.2-2.4 3.2-3.6 6.2-3.6h7.2c1.4 0 2.4 1 2.1 2.3l-.5 2.2c-.2.8-.9 1.4-1.7 1.4H7.2c-1 0-1.8-.7-2-1.6L4 15.5Z" />
      <path d="M8.2 11.9 9.4 8.8c.3-.7.9-1.1 1.6-1.1h2.2" />
    </svg>
  );
}

function asProduct(item: MobileForma): Product {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    category: "forma",
    price: item.price,
    rating: item.rating,
    reviews: item.reviews,
    inStock: true,
    delivery: "Toshkent: 1 kun",
    image: item.image,
    sizes: item.sizes,
    sku: item.sku,
    stockQty: 20,
  };
}

export function FormaMobileCatalog() {
  const { count, add } = useCart();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | FormaKind>("all");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [gender, setGender] = useState<"" | FormaGender>("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [filters, setFilters] = useState(false);
  const [note, setNote] = useState("");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cap = Number(maxPrice);
    const rows = catalog.filter((item) => {
      if (kind !== "all" && item.kind !== kind) return false;
      if (size && !item.sizes.includes(size)) return false;
      if (color && !item.colors.some((entry) => entry.id === color)) return false;
      if (gender && item.gender !== gender) return false;
      if (cap > 0 && item.price > cap) return false;
      if (!q) return true;
      return `${item.name} ${item.brand} ${item.kind}`.toLowerCase().includes(q);
    });
    if (sort === "yangi") rows.sort((a, b) => Number(b.fresh) - Number(a.fresh) || b.reviews - a.reviews);
    else if (sort === "arzon") rows.sort((a, b) => a.price - b.price);
    else if (sort === "qimmat") rows.sort((a, b) => b.price - a.price);
    else rows.sort((a, b) => b.reviews - a.reviews);
    return rows;
  }, [color, gender, kind, maxPrice, query, size, sort]);

  function addItem(item: MobileForma) {
    add(item.id, asProduct(item), 1, { size: item.sizes[0], color: item.colors[0]?.label });
    setNote("Savatga qo‘shildi");
  }

  return (
    <div className="fm lg:hidden" data-testid="mobile-forma">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidirish" onClick={() => document.querySelector<HTMLInputElement>("[data-forma-search]")?.focus()}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {count > 0 ? <span className="mh-badge" data-testid="fm-cart-badge">{count > 9 ? "9+" : count}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="fm-body">
        <h1 className="fm-title">Forma</h1>
        <p className="fm-sub">Stomatologlar uchun professional kiyimlar</p>
        <form className="fm-search" onSubmit={(event) => event.preventDefault()}>
          <Search />
          <input
            data-forma-search
            data-section-search
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Forma, brend yoki kategoriya..."
            aria-label="Qidiruv"
          />
          <button type="button" className="fm-filter" aria-label="Filtr" onClick={() => setFilters(true)}>
            <SlidersHorizontal />
          </button>
        </form>
        <div className="fm-hero">
          <img src="/img/mobile/fm-hero.jpg" alt="" />
          <div className="copy">
            <h2>Stomatologlar uchun zamonaviy forma</h2>
            <p>Qulay, sifatli va professional ko‘rinish</p>
            <button type="button" className="go" onClick={() => document.getElementById("fm-list")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              Kolleksiyani ko‘rish <ChevronRight />
            </button>
          </div>
        </div>
        <div className="fm-cats" aria-label="Kategoriyalar">
          {formaKinds.map((item) => (
            <button key={item.id} type="button" className={kind === item.id ? "on" : undefined} aria-pressed={kind === item.id} onClick={() => setKind(item.id)}>
              <i><KindIcon id={item.id} /></i>
              {item.label}
            </button>
          ))}
        </div>
        <div className="fm-drops">
          <label>
            <select className="s-olcham" aria-label="O‘lcham" value={size} onChange={(event) => setSize(event.target.value)}>
              <option value="">O‘lcham</option>
              {sizes.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <ChevronDown />
          </label>
          <label>
            <select className="s-rang" aria-label="Rang" value={color} onChange={(event) => setColor(event.target.value)}>
              <option value="">Rang</option>
              {colors.map((value) => <option key={value.id} value={value.id}>{value.label}</option>)}
            </select>
            <ChevronDown />
          </label>
          <label>
            <select className="s-jins" aria-label="Jins" value={gender} onChange={(event) => setGender(event.target.value as "" | FormaGender)}>
              <option value="">Jins</option>
              <option value="ayol">Ayol</option>
              <option value="erkak">Erkak</option>
              <option value="uniseks">Uniseks</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <select className="s-narx" aria-label="Narx" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
              <option value="">Narx</option>
              <option value="150000">150 000 gacha</option>
              <option value="200000">200 000 gacha</option>
              <option value="250000">250 000 gacha</option>
            </select>
            <ChevronDown />
          </label>
          <label>
            <ArrowUpDown />
            <select className="s-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="">Saralash</option>
              <option value="yangi">Yangi</option>
              <option value="arzon">Arzon</option>
              <option value="qimmat">Qimmat</option>
            </select>
            <ChevronDown />
          </label>
        </div>
        {note ? <p className="fm-note">{note}</p> : null}
        {list.length === 0 ? <p className="fm-note">Mos forma topilmadi</p> : null}
        <div className="fm-grid" id="fm-list">
          {list.map((item) => (
            <article key={item.id} className="fm-card" data-testid={`fm-card-${item.id}`}>
              <div className="fm-ph">
                <Link href={`/forma/${item.id}`}>
                  <img src={item.image} alt="" />
                </Link>
                {item.fresh ? <span className="fm-new">Yangi</span> : null}
                <button
                  type="button"
                  className={saved.includes(item.id) ? "fm-heart on" : "fm-heart"}
                  aria-label="Sevimlilar"
                  aria-pressed={saved.includes(item.id)}
                  onClick={() => setSaved((current) => (current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]))}
                >
                  <Heart fill={saved.includes(item.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <Link href={`/forma/${item.id}`}>
                <p className="brand">{item.brand}</p>
                <h3>{item.name}</h3>
              </Link>
              <p className="fm-rate">
                <Star /> {item.rating} ({item.reviews} ta baho)
              </p>
              <div className="fm-dots" aria-hidden="true">
                {item.colors.map((entry) => <i key={entry.id} style={{ background: entry.hex }} />)}
              </div>
              <div className="fm-sizes">{item.sizes.map((value) => <span key={value}>{value}</span>)}</div>
              <div className="fm-buyrow">
                <b>{formatMoney(item.price, "UZS")}</b>
                <button type="button" className="fm-add" aria-label="Savatga qo‘shish" data-testid={`fm-add-${item.id}`} onClick={() => addItem(item)}>
                  <ShoppingCart />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      {filters ? (
        <div className="fm-sheet" role="dialog" aria-label="Filtr">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setFilters(false)} />
          <form
            className="fm-box"
            onSubmit={(event) => {
              event.preventDefault();
              setFilters(false);
            }}
          >
            <h3>Filtr</h3>
            <label>
              O‘lcham
              <select aria-label="Filtr o‘lchami" value={size} onChange={(event) => setSize(event.target.value)}>
                <option value="">Barchasi</option>
                {sizes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              Rang
              <select aria-label="Filtr rangi" value={color} onChange={(event) => setColor(event.target.value)}>
                <option value="">Barchasi</option>
                {colors.map((value) => <option key={value.id} value={value.id}>{value.label}</option>)}
              </select>
            </label>
            <label>
              Jins
              <select aria-label="Filtr jinsi" value={gender} onChange={(event) => setGender(event.target.value as "" | FormaGender)}>
                <option value="">Barchasi</option>
                <option value="ayol">Ayol</option>
                <option value="erkak">Erkak</option>
                <option value="uniseks">Uniseks</option>
              </select>
            </label>
            <label>
              Narx
              <select aria-label="Filtr narxi" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)}>
                <option value="">Barchasi</option>
                <option value="150000">150 000 gacha</option>
                <option value="200000">200 000 gacha</option>
                <option value="250000">250 000 gacha</option>
              </select>
            </label>
            <button type="submit" className="go">Ko‘rish</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
