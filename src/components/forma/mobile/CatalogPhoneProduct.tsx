"use client";
/* eslint-disable @next/next/no-img-element -- seller photos come from uploads */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Box, ChevronDown, ChevronRight, CreditCard, Heart, Leaf, Minus, Package, Plus, Ruler, Share2, ShieldCheck, ShoppingCart, Star, Store, Truck, WashingMachine } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { colorLabel, formaColors } from "@/data/forma";
import { productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatMoney } from "@/lib/format";
import "./catalog-phone-product.css";

const chartCm: Record<string, string> = {
  XS: "40–42",
  S: "44–46",
  M: "48–50",
  L: "52–54",
  XL: "56–58",
  XXL: "60–62",
};

function text(attrs: Record<string, unknown>, key: string) {
  const value = attrs[key];
  return typeof value === "string" ? value.trim() : "";
}

function num(attrs: Record<string, unknown>, key: string) {
  const value = Number(attrs[key]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Phone product page for /forma/[id] (mock "forma bolimi product page") and
 * /jihozlar/[slug] (mock "jihozlar product page": specs, installment, seller).
 */
export function CatalogPhoneProduct({ card, back, delivery, specs }: { card: CatalogCard; back: string; delivery: string; specs: string[][] }) {
  const { add } = useCart();
  const gallery = [card.image, ...card.images].filter((src, index, all) => src && all.indexOf(src) === index);
  const [photo, setPhoto] = useState(0);
  const [saved, setSaved] = useState(false);
  const [size, setSize] = useState(card.sizes.length === 1 ? card.sizes[0] : "");
  const [color, setColor] = useState(card.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [chart, setChart] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [allSpecs, setAllSpecs] = useState(false);

  const max = Math.max(1, card.stockQty);
  const deal = card.oldPrice && card.oldPrice > card.price ? card.oldPrice : 0;
  const off = deal ? card.discount || Math.round((1 - card.price / deal) * 100) : 0;
  const material = text(card.attrs, "material") || text(card.attrs, "color");
  const care = text(card.attrs, "care");
  const ship = delivery || card.delivery;
  const tiles = [
    material ? { icon: <Leaf />, title: "Material", body: material } : null,
    care ? { icon: <WashingMachine />, title: "Parvarish", body: care } : null,
    ship ? { icon: <Truck />, title: "Yetkazib berish", body: ship } : null,
  ].filter((tile) => tile !== null);
  const known = card.sizes.some((value) => chartCm[value]);
  const eq = card.category === "jihozlar";
  const warranty = num(card.attrs, "warrantyMonths");
  const months = num(card.attrs, "installmentMonths");
  const monthly = num(card.attrs, "installmentMonthly") || (months ? Math.round(card.price / months) : 0);
  const perks = [
    warranty ? { icon: <ShieldCheck />, title: "Kafolat", body: `${warranty} oy` } : null,
    ship ? { icon: <Truck />, title: "Yetkazish", body: ship } : null,
    { icon: <Box />, title: card.stockQty > 0 ? "Omborda bor" : "Tugagan", body: card.stockQty > 0 ? `${card.stockQty} ta` : "Hozircha yo‘q" },
  ].filter((tile) => tile !== null);
  const shownSpecs = allSpecs ? specs : specs.slice(0, 4);

  useEffect(() => {
    if (!note && !error) return;
    const timer = window.setTimeout(() => {
      setNote("");
      setError("");
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [error, note]);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: card.name, url });
      } catch {
        // Closing the share sheet is not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      setNote(url);
    }
  }

  function addLine() {
    if (card.sizes.length && !size) {
      setError("O‘lchamni tanlang");
      return;
    }
    if (card.colors.length && !color) {
      setError("Rangni tanlang");
      return;
    }
    setError("");
    add(card.id, productFromCatalog(card), qty, { size: size || undefined, color: color || undefined });
    setNote("Savatga qo‘shildi");
  }

  return (
    <div className="cpp lg:hidden" data-testid="phone-product">
      <div className="cpp-cover">
        {gallery[photo] ? <img src={gallery[photo]} alt="" /> : <span className="cpp-nophoto"><Package /> Rasm yo‘q</span>}
        <Link href={back} className="cpp-float back" aria-label="Orqaga"><ArrowLeft /></Link>
        <button type="button" className={saved ? "cpp-float heart on" : "cpp-float heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={() => setSaved((value) => !value)}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="cpp-float share" aria-label="Ulashish" onClick={() => void share()}><Share2 /></button>
      </div>

      {gallery.length > 1 ? (
        <div className="cpp-thumbs">
          {gallery.slice(0, 4).map((src, index) => (
            <button key={src} type="button" className={photo === index ? "on" : undefined} aria-label={`Rasm ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}

      {eq ? (
        <section className="cpp-card cpp-main cpp-eq">
          <div className="cpp-tags">
            {card.attrs.official === true ? <span className="cpp-orig"><BadgeCheck /> ORIGINAL</span> : null}
            {card.brand ? <Link href={back} className="cpp-chip">{card.brand} <ChevronRight /></Link> : null}
            <span className={card.stockQty > 0 ? "cpp-instock" : "cpp-instock no"}><Box /> {card.stockQty > 0 ? "Omborda bor" : "Tugagan"}</span>
          </div>
          <h1>{card.name}</h1>
          {card.reviews > 0 ? <p className="cpp-meta"><span className="cpp-rate"><Star /> <b>{card.rating.toFixed(1)}</b> ({card.reviews} ta sharh)</span></p> : null}
          <p className="cpp-eqprice">
            <b className="cpp-price">{formatMoney(card.price, "UZS")}</b>
            {deal ? <><s>{formatMoney(deal, "UZS")}</s><em>-{off}%</em></> : null}
          </p>
          {months ? <span className="cpp-plan"><CreditCard /> {months} oy – oyiga <b>{formatMoney(monthly, "UZS")}</b> dan</span> : null}
          {card.sku ? <small className="cpp-eqsku">SKU: {card.sku}</small> : null}
        </section>
      ) : (
      <section className="cpp-card cpp-main">
        {deal ? <p className="cpp-deal"><em>-{off}%</em><s>{formatMoney(deal, "UZS")}</s></p> : null}
        <b className="cpp-price">{formatMoney(card.price, "UZS")}</b>
        {card.brand ? <Link href={back} className="cpp-brand">{card.brand} <ChevronRight /></Link> : null}
        <h1>{card.name}</h1>
        <p className="cpp-meta">
          {card.reviews > 0 ? <span className="cpp-rate"><Star /> <b>{card.rating.toFixed(1)}</b> ({card.reviews} ta sharh)</span> : null}
          <span className={card.stockQty > 0 ? "cpp-ok" : "cpp-no"}><BadgeCheck /> {card.stockQty > 0 ? "Sotuvda mavjud" : "Tugagan"}</span>
          {card.sku ? <span className="cpp-sku">SKU: {card.sku}</span> : null}
        </p>
      </section>
      )}

      {eq ? (
        <div className="cpp-card cpp-perks">
          {perks.map((tile) => (
            <article key={tile.title}>
              <i>{tile.icon}</i>
              <span><b>{tile.title}</b>{tile.body}</span>
            </article>
          ))}
        </div>
      ) : null}

      {eq && specs.length ? (
        <section className="cpp-specs">
          <div className="cpp-sechead">
            <h2>Texnik xususiyatlari</h2>
            {specs.length > 4 ? (
              <button type="button" onClick={() => setAllSpecs((value) => !value)}>
                {allSpecs ? "Yig‘ish" : "Barchasini ko‘rish"} {allSpecs ? <ChevronDown /> : <ChevronRight />}
              </button>
            ) : null}
          </div>
          <div className="cpp-specgrid">
            {shownSpecs.map(([label, value]) => (
              <article key={label}><small>{label}</small><b>{value}</b></article>
            ))}
          </div>
        </section>
      ) : null}

      {card.colors.length || card.sizes.length ? (
        <section className="cpp-card">
          {card.colors.length ? (
            <>
              <p className="cpp-lab">Rang: <b>{color ? colorLabel(color) : "tanlang"}</b></p>
              <div className="cpp-swatches">
                {card.colors.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={color === item ? "on" : undefined}
                    style={{ background: formaColors.find((entry) => entry.id === item)?.hex ?? "#d1d5db" }}
                    aria-label={colorLabel(item)}
                    aria-pressed={color === item}
                    onClick={() => setColor(item)}
                  />
                ))}
                {color ? <span>{colorLabel(color)}</span> : null}
              </div>
            </>
          ) : null}
          {card.sizes.length ? (
            <>
              <div className="cpp-head">
                <p className="cpp-lab">O‘lcham: <b>{size || "tanlang"}</b></p>
                {known ? <button type="button" className="cpp-link" onClick={() => setChart(true)}><Ruler /> O‘lcham jadvali</button> : null}
              </div>
              <div className="cpp-sizes">
                {card.sizes.map((item) => (
                  <button key={item} type="button" className={size === item ? "on" : undefined} aria-pressed={size === item} onClick={() => setSize(item)}>{item}</button>
                ))}
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      <section className="cpp-qty">
        <b>Miqdor</b>
        <div>
          <button type="button" aria-label="Kamaytirish" disabled={qty <= 1} onClick={() => setQty((value) => Math.max(1, value - 1))}><Minus /></button>
          <span>{qty}</span>
          <button type="button" aria-label="Oshirish" disabled={qty >= max} onClick={() => setQty((value) => Math.min(max, value + 1))}><Plus /></button>
        </div>
      </section>

      {!eq && tiles.length ? (
        <div className="cpp-info" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
          {tiles.map((tile) => (
            <article key={tile.title}>
              {tile.icon}
              <span><b>{tile.title}</b>{tile.body}</span>
            </article>
          ))}
        </div>
      ) : null}

      {card.description ? (
        <section className="cpp-card cpp-desc">
          <b>Tavsif</b>
          <p>{card.description}</p>
        </section>
      ) : null}

      {card.shopName ? (
        <Link href={card.shopSlug ? `/marketplace/dokon/${card.shopSlug}` : back} className="cpp-card cpp-shop">
          <span className="cpp-logo">{card.shopLogo ? <img src={card.shopLogo} alt="" /> : card.shopName.slice(0, 1)}</span>
          <span>
            <small>Sotuvchi</small>
            <b>{card.shopName}</b>
            {card.shopReviews > 0 ? <em><Star /> {card.shopRating.toFixed(1)} ({card.shopReviews} ta baho)</em> : null}
          </span>
          {eq ? <span className="cpp-shopgo"><Store /> Do‘kon</span> : <ChevronRight />}
        </Link>
      ) : null}

      <div className="cpp-pad" />
      {error || note ? <p className={error ? "cpp-toast err" : "cpp-toast"} role="status">{error || note}</p> : null}
      <div className="cpp-buy">
        <span>
          {deal && !eq ? <small><em>-{off}%</em><s>{formatMoney(deal * qty, "UZS")}</s></small> : null}
          <b>{formatMoney(card.price * qty, "UZS")}</b>
          {eq && months ? <small className="cpp-month">{months} oy – oyiga {formatMoney(monthly * qty, "UZS")} dan</small> : null}
        </span>
        <button type="button" disabled={card.stockQty < 1} onClick={addLine}><ShoppingCart /> Savatga qo‘shish</button>
      </div>

      {chart ? (
        <div className="cpp-sheet" role="dialog" aria-label="O‘lcham jadvali">
          <button type="button" aria-label="Yopish" className="cpp-scrim" onClick={() => setChart(false)} />
          <div className="cpp-box">
            <h3>O‘lcham jadvali</h3>
            <p>Ko‘krak aylanasi, sm</p>
            <ul>
              {card.sizes.map((item) => <li key={item}><span>{item}</span><span>{chartCm[item] ?? "—"}</span></li>)}
            </ul>
            <button type="button" className="go" onClick={() => setChart(false)}>Yopish</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
