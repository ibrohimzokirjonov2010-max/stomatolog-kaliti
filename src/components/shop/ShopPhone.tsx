"use client";
/* eslint-disable @next/next/no-img-element -- product photos are seller uploads */

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Eye, FileText, Heart, Info, MapPin, MessageCircle, Package, Phone, Search, ShoppingBag, ShoppingCart, SlidersHorizontal, Star, Store, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { ShopAvatar, VerifiedBadge } from "@/components/seller-ui";
import { categoryLabels, type Product } from "@/data/products";
import type { Shop } from "@/data/shops";
import { phoneHref, telegramHref } from "@/data/surplus";
import { catalogHref } from "@/lib/catalog-client";
import { formatMoney } from "@/lib/format";
import "./brand-mobile.css";
import "./shop-phone.css";

type Tab = "mahsulotlar" | "tafsilotlar" | "sharhlar" | "aloqa";
type Sort = "new" | "cheap" | "dear";
const TABS: { id: Tab; label: string; icon: typeof Star }[] = [
  { id: "mahsulotlar", label: "Mahsulotlar", icon: ShoppingBag },
  { id: "tafsilotlar", label: "Tafsilotlar", icon: FileText },
  { id: "sharhlar", label: "Sharhlar", icon: Star },
  { id: "aloqa", label: "Aloqa", icon: MessageCircle },
];
const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "Standart" },
  { id: "cheap", label: "Arzonroq" },
  { id: "dear", label: "Qimmatroq" },
];

/** Phone layout of /marketplace/dokon/[slug] (mock "do‘kon sahifasi"). */
export function ShopPhone({ shop, items, isOwner }: { shop: Shop; items: Product[]; isOwner: boolean }) {
  const cart = useCart();
  const favorites = useFavorites();
  const [tab, setTab] = useState<Tab>("mahsulotlar");
  const [cat, setCat] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("new");
  const [sortOpen, setSortOpen] = useState(false);
  const call = shop.phone ? phoneHref(shop.phone) : "";
  const tg = telegramHref(shop.telegram);
  const cats = Array.from(new Set(items.map((item) => item.category)));
  const q = query.trim().toLowerCase();
  const shown = items
    .filter((item) => (!cat || item.category === cat) && (!q || `${item.name} ${item.brand}`.toLowerCase().includes(q)))
    .sort((a, b) => (sort === "cheap" ? a.price - b.price : sort === "dear" ? b.price - a.price : 0));
  const delivery = items.find((item) => item.delivery)?.delivery;
  const followId = `shop:${shop.slug}`;
  const following = favorites.has(followId);
  const cover = items.find((item) => item.image)?.image;

  return (
    <div className="bm2 lg:hidden" data-testid="shop-phone">
      <section className="sh2-banner">
        <div className="sh2-banner-copy">
          <b>{shop.name}</b>
          <span>{shop.city || "Stomatologik mahsulotlar"}</span>
        </div>
        {cover ? <img src={cover} alt="" /> : <Store className="sh2-banner-icon" />}
      </section>

      <section className="bm2-id">
        <ShopAvatar shop={shop} className="sh2-logo" />
        <div>
          <h1 className="sh2-name">{shop.name} <VerifiedBadge status={shop.verified} /></h1>
          <p>{shop.bio ? shop.bio.split(/[.\n]/)[0] : "Stomatologik mahsulotlar do‘koni"}</p>
          {shop.city ? <p className="sh2-city"><MapPin /> {shop.city}</p> : null}
        </div>
        <button type="button" className={following ? "sh2-heart on" : "sh2-heart"} aria-label="Kuzatish" aria-pressed={following} onClick={() => favorites.toggle(followId)}><Heart /></button>
        {tg ? (
          <a href={tg} target="_blank" rel="noreferrer" className="sh2-chat"><MessageCircle /> Chat</a>
        ) : call ? (
          <a href={call} className="sh2-chat"><Phone /> Qo‘ng‘iroq</a>
        ) : null}
      </section>

      <div className="sh2-feats">
        <span><i><Package /></i><b>{items.length} ta mahsulot</b><small>Do‘konda</small></span>
        <span><i><Truck /></i><b>Yetkazib berish</b><small>{delivery || "Sotuvchi bilan kelishiladi"}</small></span>
        <span><i><Store /></i><b>{shop.yearsInBusiness ? `${shop.yearsInBusiness} yil` : "Faoliyat"}</b><small>{shop.yearsInBusiness ? "Bozorda" : "Ma’lumot yo‘q"}</small></span>
        <span><i><Eye /></i><b>{shop.views} marta</b><small>Ko‘rilgan</small></span>
      </div>

      <div className="sh2-tabs" role="tablist">
        {TABS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)}>
              <Icon /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === "mahsulotlar" ? (
        <>
          <div className="bm2-tools">
            <label className="bm2-search"><Search /><input value={query} placeholder="Mahsulot qidirish..." aria-label="Mahsulot qidirish" onChange={(event) => setQuery(event.target.value)} /></label>
            <div className="bm2-sort">
              <button type="button" aria-expanded={sortOpen} onClick={() => setSortOpen((open) => !open)}><SlidersHorizontal /> Filtr <ChevronDown /></button>
              {sortOpen ? (
                <div className="bm2-sort-menu">
                  {SORTS.map((item) => (
                    <button key={item.id} type="button" className={sort === item.id ? "on" : ""} onClick={() => { setSort(item.id); setSortOpen(false); }}>{item.label}</button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {cats.length > 1 ? (
            <div className="bm2-chips sh2-chips" role="tablist">
              <button type="button" role="tab" aria-selected={!cat} className={!cat ? "on" : ""} onClick={() => setCat("")}>Barchasi</button>
              {cats.map((item) => (
                <button key={item} type="button" role="tab" aria-selected={cat === item} className={cat === item ? "on" : ""} onClick={() => setCat(item)}>{categoryLabels[item] ?? item}</button>
              ))}
            </div>
          ) : null}
          {shown.length === 0 ? (
            <p className="bm2-empty">{items.length === 0 ? "Sotuvchi hali mahsulot joylamagan." : "Mos mahsulot topilmadi"}</p>
          ) : (
            <ul className="bm2-grid">
              {shown.map((item) => {
                const href = item.href ?? catalogHref(item.category, item.id);
                const liked = favorites.has(item.id);
                return (
                  <li key={item.id}>
                    <Link href={href} className="bm2-img">{item.image ? <img src={item.image} alt="" /> : <Package />}</Link>
                    <button type="button" className={liked ? "bm2-like on" : "bm2-like"} aria-label="Saqlash" aria-pressed={liked} onClick={() => favorites.toggle(item.id)}><Heart /></button>
                    <Link href={href} className="bm2-name">{item.name}</Link>
                    <p className="bm2-sub">{[item.brand, categoryLabels[item.category]].filter(Boolean).join(" · ")}</p>
                    <div className="bm2-foot">
                      <b>{formatMoney(item.price, "UZS")}</b>
                      <button type="button" className="bm2-cart" aria-label={`${item.name} savatga`} disabled={!item.inStock} onClick={() => cart.add(item.id, item)}><ShoppingCart /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}

      {tab === "tafsilotlar" ? (
        <section className="sh2-card">
          <h2><i><Info /></i> Do‘kon haqida</h2>
          <p className="sh2-text">{shop.bio || "Sotuvchi do‘kon haqida yozmagan."}</p>
          <dl className="sh2-info">
            {shop.ownerName ? <><dt>Egasi</dt><dd>{shop.ownerName}</dd></> : null}
            {shop.city ? <><dt>Shahar</dt><dd>{shop.city}</dd></> : null}
            {shop.address ? <><dt>Manzil</dt><dd>{shop.address}</dd></> : null}
            {shop.yearsInBusiness ? <><dt>Faoliyat</dt><dd>{shop.yearsInBusiness} yil</dd></> : null}
          </dl>
        </section>
      ) : null}

      {tab === "sharhlar" ? (
        <section className="sh2-card">
          <h2><i><Star /></i> Sharhlar</h2>
          <p className="sh2-text">Hali sharh yo‘q.</p>
        </section>
      ) : null}

      {tab === "aloqa" ? (
        <section className="sh2-card">
          <h2><i><MessageCircle /></i> Aloqa</h2>
          <div className="sh2-links">
            {call ? <a href={call}><Phone /> {shop.phone}</a> : null}
            {tg ? <a href={tg} target="_blank" rel="noreferrer"><MessageCircle /> Telegram</a> : null}
            {shop.instagram ? <a href={shop.instagram.startsWith("http") ? shop.instagram : `https://instagram.com/${shop.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener nofollow">Instagram</a> : null}
            {shop.website ? <a href={shop.website} target="_blank" rel="noopener nofollow">Veb-sayt</a> : null}
            {!call && !tg && !shop.instagram && !shop.website ? <p className="sh2-text">Kontakt ko‘rsatilmagan.</p> : null}
          </div>
        </section>
      ) : null}

      {isOwner ? <Link href="/marketplace/sotuvchi" className="sh2-owner">Sotuvchi kabineti</Link> : null}
    </div>
  );
}
