"use client";
/* eslint-disable @next/next/no-img-element -- gallery photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Heart, MapPin, Minus, Package, Plus, Share2, ShoppingCart, Star, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { mobileMarketProduct, type MobileMarketItem } from "@/data/mobile-market";
import { formatMoney } from "@/lib/format";
import "./market-mobile.css";

export function MarketMobileDetail({ item }: { item: MobileMarketItem }) {
  const { add } = useCart();
  const favorites = useFavorites();
  const [shot, setShot] = useState(0);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState(item.variants[0] ?? item.spec);
  const [chat, setChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const saved = favorites.has(item.id);
  const gallery = item.gallery.length > 0 ? item.gallery : [item.image];
  const photo = gallery[Math.min(shot, gallery.length - 1)];
  const savings = Math.max(0, item.oldPrice - item.price);

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* the note still confirms the action */
      }
    }
    setNote("Havola nusxalandi");
  }

  return (
    <div className="mk lg:hidden" data-testid="mobile-market-detail">
      <div className="mk-hero">
        <img className="main" src={photo} alt="" />
        <Link href="/marketplace" className="mk-float back" aria-label="Orqaga">
          <ChevronLeft />
        </Link>
        <button
          type="button"
          className={saved ? "mk-float heart on" : "mk-float heart"}
          aria-label="Sevimlilar"
          aria-pressed={saved}
          onClick={() => favorites.toggle(item.id)}
        >
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="mk-float share" aria-label="Ulashish" onClick={() => void onShare()}>
          <Share2 />
        </button>
        <div className="mk-thumbs">
          {gallery.map((src, index) => (
            <button key={src} type="button" className={index === shot ? "on" : undefined} aria-label={`Rasm ${index + 1}`} onClick={() => setShot(index)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="mk-body mk-detail">
        <div className="mk-kicker">
          {item.official ? (
            <span className="orig">
              <BadgeCheck /> ORIGINAL
            </span>
          ) : null}
          <span>
            {item.brand} <ChevronRight />
          </span>
        </div>
        <h1>{item.name}</h1>
        <p className="mk-meta">
          <Star className="star" style={{ width: "calc(1.1 * var(--u))", height: "calc(1.1 * var(--u))", color: "#f5b400", fill: "#f5b400" }} />
          {item.rating} ({item.reviews} ta baho)
          <span>|</span>
          {item.shares} ta sharh
        </p>

        <section className="mk-box">
          <div className="mk-now">
            <b>{formatMoney(item.price, "UZS")}</b>
            <em>-{item.discount}%</em>
          </div>
          <p>
            <s>{formatMoney(item.oldPrice, "UZS")}</s>
          </p>
          <p className="save">Tejaysiz: {formatMoney(savings, "UZS")}</p>
        </section>

        <div className="mk-rows">
          <div className="mk-row">
            <Package /> Omborda bor
          </div>
          <button type="button" className="mk-row ship" onClick={() => setNote(item.delivery)}>
            <Truck /> {item.delivery} <ChevronRight />
          </button>
        </div>

        <div className="mk-rows">
          <div className="mk-field">
            <label htmlFor="mk-variant">Hajm (variant)</label>
            <select id="mk-variant" value={variant} onChange={(event) => setVariant(event.target.value)}>
              {item.variants.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="mk-field">
            <label>Miqdori</label>
            <div className="mk-step">
              <button type="button" aria-label="Kamaytirish" onClick={() => setQty((value) => Math.max(1, value - 1))}>
                <Minus />
              </button>
              <span>{qty}</span>
              <button type="button" aria-label="Oshirish" onClick={() => setQty((value) => Math.min(99, value + 1))}>
                <Plus />
              </button>
            </div>
          </div>
        </div>

        <section className="mk-box">
          <h2>Tavsif</h2>
          <p className="copy">{item.description}</p>
        </section>

        <section className="mk-box">
          <h2>Xususiyatlari</h2>
          <ul>
            {item.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </section>

        <section className="mk-box">
          <h2>Sotuvchi</h2>
          <div className="mk-seller">
            <span className="mk-logo">{item.sellerTag}</span>
            <div>
              <b>{item.seller}</b>
              <span>{item.sellerRole}</span>
              <span>
                <Star className="star" /> {item.sellerRating} ({item.sellerReviews} ta baho)
              </span>
              <span>
                <MapPin /> {item.sellerCity}
              </span>
            </div>
            <button type="button" className="mk-write" onClick={() => setChat(true)}>
              Sotuvchiga yozish
            </button>
          </div>
        </section>

        {note ? <p className="mk-note">{note}</p> : null}
        <div className="mk-pad" />
      </div>

      <div className="mk-buy">
        <div>
          <b>{formatMoney(item.price, "UZS")}</b>
          <span>
            <s>{formatMoney(item.oldPrice, "UZS")}</s>
            <em>-{item.discount}%</em>
          </span>
        </div>
        <button type="button" data-testid="mk-add" onClick={() => add(item.id, mobileMarketProduct(item), qty)}>
          <ShoppingCart /> Savatga qo‘shish
        </button>
      </div>

      {chat ? (
        <div className="mk-sheet" role="dialog" aria-label="Sotuvchiga yozish">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setChat(false)} />
          <form
            className="mk-panel"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              setChat(false);
              setDraft("");
              setNote("Xabar yuborildi");
            }}
          >
            <h3>Sotuvchiga yozish</h3>
            <textarea aria-label="Xabar" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Xabaringiz..." rows={4} />
            <div className="row">
              <button type="button" className="go" style={{ background: "#eef2f6", color: "#111827" }} onClick={() => setChat(false)}>
                Yopish
              </button>
              <button type="submit" className="go">
                Yuborish
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
