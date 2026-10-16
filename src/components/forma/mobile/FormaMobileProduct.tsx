"use client";
/* eslint-disable @next/next/no-img-element -- uniform photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Heart, Leaf, Minus, Plus, Ruler, Share2, ShoppingCart, Star, Truck, WashingMachine } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { LOGO_FEE, type MobileForma } from "@/data/mobile-forma";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/format";
import "./forma-mobile.css";

const chartCm: Record<string, string> = {
  XS: "40–42",
  S: "44–46",
  M: "48–50",
  L: "52–54",
  XL: "56–58",
  XXL: "60–62",
};

function Tooth() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
    </svg>
  );
}

function asProduct(item: MobileForma, id: string, price: number): Product {
  return {
    id,
    name: item.name,
    brand: item.brand,
    category: "forma",
    price,
    oldPrice: item.oldPrice,
    discount: item.discount,
    rating: item.rating,
    reviews: item.reviews,
    inStock: true,
    delivery: "Toshkent: 1 kun",
    image: item.gallery[0] ?? item.image,
    sizes: item.sizes,
    sku: item.sku,
    stockQty: 20,
  };
}

export function FormaMobileProduct({ item }: { item: MobileForma }) {
  const { add } = useCart();
  const gallery = item.gallery.length > 0 ? item.gallery : [item.image];
  const [photo, setPhoto] = useState(0);
  const [saved, setSaved] = useState(false);
  const [colorId, setColorId] = useState(item.colors[0]?.id ?? "");
  const [size, setSize] = useState(item.sizes.includes("M") ? "M" : item.sizes[0] ?? "");
  const [logo, setLogo] = useState(false);
  const [qty, setQty] = useState(1);
  const [chart, setChart] = useState(false);
  const [note, setNote] = useState("");
  const color = item.colors.find((entry) => entry.id === colorId) ?? item.colors[0];
  const unit = item.price + (logo ? LOGO_FEE : 0);
  const showDeal = Boolean(item.oldPrice && item.discount && unit < item.oldPrice);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.name, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      setNote(url);
    }
  }

  function addToCart() {
    const id = logo ? `${item.id}-logo` : item.id;
    add(id, asProduct(item, id, unit), qty, { size, color: color?.label });
    setNote("Savatga qo‘shildi");
  }

  return (
    <div className="fm lg:hidden" data-testid="mobile-forma-product">
      <div className="fm-cover">
        <img className="hero" src={gallery[photo]} alt="" data-testid="fm-hero" />
        <Link href="/forma" className="fm-float back" aria-label="Orqaga">
          <ArrowLeft />
        </Link>
        <button
          type="button"
          className={saved ? "fm-float heart on" : "fm-float heart"}
          aria-label="Sevimlilar"
          aria-pressed={saved}
          onClick={() => setSaved((value) => !value)}
        >
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="fm-float share" aria-label="Ulashish" onClick={() => void share()}>
          <Share2 />
        </button>
      </div>
      <div className="fm-body fm-pdp">
        <div className="fm-thumbs">
          {gallery.slice(0, 4).map((src, index) => (
            <button key={src} type="button" className={photo === index ? "on" : undefined} aria-label={`Rasm ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
        <p className="fm-price">
          {showDeal ? (
            <>
              <em>-{item.discount}%</em>
              <s>{formatMoney(item.oldPrice ?? 0, "UZS")}</s>
            </>
          ) : null}
          <b data-testid="fm-price">{formatMoney(unit, "UZS")}</b>
        </p>
        <Link href="/forma" className="fm-brand">
          {item.brand} <ChevronRight />
        </Link>
        <h1>{item.name}</h1>
        <p className="fm-meta">
          <span className="fm-rate"><Star /> {item.rating} ({item.reviews} ta sharh)</span>
          <span className="fm-ok"><Check /> Sotuvda mavjud</span>
          <span>SKU: {item.sku}</span>
        </p>
        {note ? <p className="fm-note">{note}</p> : null}
        <div className="fm-block">
          <p className="fm-lab">Rang: <b>{color?.label}</b></p>
          <div className="fm-swatches">
            {item.colors.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === color?.id ? "on" : undefined}
                style={{ background: entry.hex }}
                aria-label={entry.label}
                aria-pressed={entry.id === color?.id}
                onClick={() => setColorId(entry.id)}
              />
            ))}
            <span className="fm-cname">{color?.label}</span>
          </div>
        </div>
        <div className="fm-block">
          <div className="fm-head">
            <p className="fm-lab">O‘lcham: <b>{size}</b></p>
            <button type="button" className="fm-link" onClick={() => setChart(true)}>
              <Ruler /> O‘lcham jadvali
            </button>
          </div>
          <div className="fm-sizesel">
            {item.sizes.map((value) => (
              <button key={value} type="button" className={value === size ? "on" : undefined} aria-pressed={value === size} onClick={() => setSize(value)}>
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="fm-block fm-logo">
          <span className="mark"><Tooth /></span>
          <div>
            <b>Logo tikish (ixtiyoriy)</b>
            <span>Kiyimingizga klinika logotipini tikish</span>
          </div>
          <em>+ {formatMoney(LOGO_FEE, "UZS")}</em>
          <button
            type="button"
            className={logo ? "fm-switch on" : "fm-switch"}
            role="switch"
            aria-checked={logo}
            aria-label="Logo tikish"
            data-testid="fm-logo"
            onClick={() => setLogo((value) => !value)}
          >
            <i />
          </button>
        </div>
        <div className="fm-block fm-qty">
          <b>Miqdor</b>
          <div>
            <button type="button" aria-label="Kamaytirish" onClick={() => setQty((value) => Math.max(1, value - 1))}><Minus /></button>
            <span data-testid="fm-qty">{qty}</span>
            <button type="button" aria-label="Oshirish" onClick={() => setQty((value) => Math.min(20, value + 1))}><Plus /></button>
          </div>
        </div>
        <div className="fm-info">
          <article>
            <Leaf />
            <b>Material</b>
            65% paxta
            <br />
            35% polyester
          </article>
          <article>
            <WashingMachine />
            <b>Parvarish</b>
            30°C da yuvish
            <br />
            Oqartiruvchi ishlatmaslik
          </article>
          <article>
            <Truck />
            <b>Yetkazib berish</b>
            Toshkent: 1 kun
            <br />
            Boshqa hududlar: 1-2 kun
          </article>
        </div>
        <div className="fm-pad" />
      </div>
      <div className="fm-buy" data-testid="fm-buy">
        <b data-testid="fm-sticky-price">{formatMoney(unit * qty, "UZS")}</b>
        <button type="button" className="cart" onClick={addToCart}>
          <ShoppingCart /> Savatga qo‘shish
        </button>
      </div>
      {chart ? (
        <div className="fm-sheet" role="dialog" aria-label="O‘lcham jadvali">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setChart(false)} />
          <div className="fm-box">
            <h3>O‘lcham jadvali</h3>
            <ul className="fm-chart">
              {item.sizes.map((value) => (
                <li key={value}><span>{value}</span><span>{chartCm[value] ?? "—"}</span></li>
              ))}
            </ul>
            <button type="button" className="go" onClick={() => setChart(false)}>Yopish</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
