"use client";
/* eslint-disable @next/next/no-img-element -- equipment photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Battery, CalendarDays, Check, ChevronRight, Gauge, Heart, MessageCircle, Package, Share2, ShieldCheck, ShoppingCart, Star, Truck, Zap } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { JihozKit, JihozSpec, MobileJihoz } from "@/data/mobile-jihozlar";
import type { Product } from "@/data/products";
import { useFavorites } from "@/components/favorites-provider";
import { catalogShop } from "@/data/shops";
import { site } from "@/data/site";
import { formatMoney } from "@/lib/format";
import "./jihoz-mobile.css";

const specIcons = [Zap, Gauge, BadgeCheck, Battery];

function fallbackSpecs(item: MobileJihoz): JihozSpec[] {
  return [
    { label: "Kafolat", value: "1 yil" },
    { label: "Holat", value: item.condition === "yangi" ? "Yangi" : "B.U." },
    { label: "Brend", value: item.brand },
    { label: "Yetkazish", value: "Toshkent 1 kun" },
  ];
}

function fallbackKit(item: MobileJihoz): JihozKit[] {
  return item.gallery.slice(0, 4).map((image, index) => ({
    image,
    label: ["Asosiy blok", "Uskuna", "Kabel", "Yo‘riqnoma"][index] ?? "Komplekt",
  }));
}

function asProduct(item: MobileJihoz): Product {
  return {
    id: item.id,
    name: item.pdpName ?? item.name,
    brand: item.pdpBrand ?? item.brand,
    category: "jihozlar",
    price: item.price,
    oldPrice: item.oldPrice,
    discount: item.discount,
    rating: item.rating,
    reviews: item.reviews,
    inStock: true,
    delivery: "Toshkent bo‘ylab 1–2 kunda",
    image: item.gallery[0] ?? item.image,
    stockQty: 5,
  };
}

export function JihozMobileProduct({ item }: { item: MobileJihoz }) {
  const { add } = useCart();
  const gallery = item.gallery.length > 0 ? item.gallery : [item.image];
  const specs = item.specs ?? fallbackSpecs(item);
  const more = item.moreSpecs ?? [];
  const kit = item.kit ?? fallbackKit(item);
  const brand = item.pdpBrand ?? item.brand;
  const name = item.pdpName ?? item.name;
  const [photo, setPhoto] = useState(0);
  const favorites = useFavorites();
  const saved = favorites.has(item.id);
  const [sheet, setSheet] = useState<"specs" | "pay" | "chat" | null>(null);
  const [text, setText] = useState("");
  const tg = (msg: string) => `${site.telegram}?text=${encodeURIComponent(msg)}`;
  const [note, setNote] = useState("");

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        /* dismissed */
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

  function addToCart() {
    add(item.id, asProduct(item));
    setNote("Savatga qo‘shildi");
  }

  return (
    <div className="jz lg:hidden" data-testid="mobile-jihoz-product">
      <div className="jz-cover">
        <img src={gallery[photo]} alt="" data-testid="jz-hero" />
        <Link href="/jihozlar" className="jz-float back" aria-label="Orqaga"><ArrowLeft /></Link>
        <button type="button" className={saved ? "jz-float heart on" : "jz-float heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={() => favorites.toggle(item.id)}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="jz-float share" aria-label="Ulashish" onClick={() => void share()}><Share2 /></button>
      </div>
      <div className="jz-body jz-pdp">
        <div className="jz-thumbs">
          {gallery.slice(0, 4).map((src, index) => (
            <button key={`${src}-${index}`} type="button" className={photo === index ? "on" : undefined} aria-label={`Rasm ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
        <div className="jz-pills">
          <span className="jz-orig">ORIGINAL</span>
          <Link href="/jihozlar" className="jz-brand">{brand} <ChevronRight /></Link>
          <span className="jz-stock"><Check /> Omborda bor</span>
        </div>
        <h1>{name}</h1>
        <p className="jz-rate"><Star /> {item.rating} ({item.reviews} ta sharh)</p>
        <p className="jz-price">
          <b data-testid="jz-price">{formatMoney(item.price, "UZS")}</b>
          {item.oldPrice ? <s>{formatMoney(item.oldPrice, "UZS")}</s> : null}
          {item.discount ? <em>-{item.discount}%</em> : null}
        </p>
        <button type="button" className="jz-inst" onClick={() => setSheet("pay")}>
          <CalendarDays /> {item.months} oy – oyiga {formatMoney(item.monthly, "UZS")} dan <ChevronRight />
        </button>
        {note ? <p className="jz-note">{note}</p> : null}
        <div className="jz-feats">
          <article><ShieldCheck /><b>Kafolat</b>1 yil</article>
          <article><Truck /><b>Toshkent bo‘ylab</b>1–2 kunda yetkazish</article>
          <article><Package /><b>Omborda bor</b>Tez yetkazish</article>
        </div>
        <div className="jz-sec">
          <h2>Texnik xususiyatlari</h2>
          <button type="button" className="jz-link" onClick={() => setSheet("specs")}>Barchasini ko‘rish <ChevronRight /></button>
        </div>
        <div className="jz-specs">
          {specs.slice(0, 4).map((spec, index) => {
            const Icon = specIcons[index] ?? Zap;
            return (
              <article key={spec.label}>
                <Icon />
                <b>{spec.label}</b>
                <span>{spec.value}</span>
              </article>
            );
          })}
        </div>
        <h2>Komplektatsiya</h2>
        <div className="jz-kit">
          {kit.map((part) => (
            <article key={part.label}>
              <img src={part.image} alt="" />
              {part.label}
            </article>
          ))}
        </div>
        <div className="jz-seller">
          <span className="mark">StomaHub</span>
          <div>
            <b>{catalogShop.name} <Check /></b>
            <span>Platforma katalogi · {catalogShop.city}</span>
          </div>
          <button type="button" className="jz-chat" onClick={() => setSheet("chat")}><MessageCircle /> Sotuvchiga yozish</button>
        </div>
        <div className="jz-pad" />
      </div>
      <div className="jz-buy" data-testid="jz-buy">
        <div className="sum">
          <b data-testid="jz-sticky-price">{formatMoney(item.price, "UZS")}</b>
          <span>{item.months} oy – oyiga {formatMoney(item.monthly, "UZS")} dan</span>
        </div>
        <button type="button" className="split" onClick={() => setSheet("pay")}><CalendarDays /> Bo‘lib to‘lash</button>
        <button type="button" className="cart" onClick={addToCart}><ShoppingCart /> Savatga qo‘shish</button>
      </div>
      {sheet ? (
        <div className="jz-sheet" role="dialog" aria-label={sheet === "specs" ? "Texnik xususiyatlar" : sheet === "pay" ? "Bo‘lib to‘lash" : "Sotuvchiga yozish"}>
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setSheet(null)} />
          <div className="jz-box">
            {sheet === "specs" ? (
              <>
                <h3>Texnik xususiyatlari</h3>
                <ul className="jz-more">
                  {[...specs, ...more].map((spec) => (
                    <li key={spec.label}><span>{spec.label}</span><b>{spec.value}</b></li>
                  ))}
                </ul>
                <button type="button" className="go" onClick={() => setSheet(null)}>Yopish</button>
              </>
            ) : null}
            {sheet === "pay" ? (
              <>
                <h3>Bo‘lib to‘lash</h3>
                <p>Taxminan {item.months} oy · oyiga {formatMoney(item.monthly, "UZS")} (jami {formatMoney(item.price, "UZS")}).</p>
                <p>Bo‘lib to‘lash sayt orqali hozircha rasmiylashtirilmaydi — shartlarni operator bilan Telegram’da kelishasiz.</p>
                <a className="go" data-testid="jz-pay-tg" href={tg(`Bo‘lib to‘lash: ${name} (${formatMoney(item.price, "UZS")}), ${item.months} oy`)} target="_blank" rel="noreferrer">Telegram’da so‘rash</a>
              </>
            ) : null}
            {sheet === "chat" ? (
              <>
                <h3>Sotuvchiga yozish</h3>
                <p>Savolingiz Telegram’da {catalogShop.name} operatoriga tayyor xabar bo‘lib ochiladi.</p>
                <textarea aria-label="Xabar" rows={3} value={text} onChange={(event) => setText(event.target.value)} placeholder="Savolingizni yozing" />
                <a className="go" data-testid="jz-chat-tg" href={tg(`${name}: ${text.trim() || "savolim bor"}`)} target="_blank" rel="noreferrer">Telegram’da yuborish</a>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
