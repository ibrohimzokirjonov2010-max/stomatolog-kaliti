"use client";
/* eslint-disable @next/next/no-img-element -- gallery photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, Heart, MapPin, MessageCircle, Package, Share2, ShieldCheck, ShoppingCart, Star } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { detailTitle, mobileSurplusProduct, type MobileSurplusItem } from "@/data/mobile-surplus";
import { formatMoney } from "@/lib/format";
import "./surplus-mobile.css";

export function SurplusMobileDetail({ item }: { item: MobileSurplusItem }) {
  const { add } = useCart();
  const favorites = useFavorites();
  const [shot, setShot] = useState(0);
  const [chat, setChat] = useState(false);
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const saved = favorites.has(item.id);
  const title = detailTitle(item);
  const gallery = item.gallery.length > 0 ? item.gallery : [item.image];
  const photo = gallery[Math.min(shot, gallery.length - 1)];
  const savings = Math.max(0, item.oldPrice - item.price);

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
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
    <div className="om lg:hidden" data-testid="mobile-surplus-detail">
      <div className="om-hero">
        <img className="main" src={photo} alt="" />
        <Link href="/ortiqcha-material" className="om-float back" aria-label="Orqaga">
          <ChevronLeft />
        </Link>
        <button
          type="button"
          className={saved ? "om-float heart on" : "om-float heart"}
          aria-label="Sevimlilar"
          aria-pressed={saved}
          onClick={() => favorites.toggle(item.id)}
        >
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="om-float share" aria-label="Ulashish" onClick={() => void onShare()}>
          <Share2 />
        </button>
        <div className="om-thumbs">
          {gallery.map((src, index) => (
            <button key={src} type="button" className={index === shot ? "on" : undefined} aria-label={`Rasm ${index + 1}`} onClick={() => setShot(index)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="om-body om-detail">
        <div className="om-pills">
          <span>{item.chipLabel}</span>
          <span className="brand">{item.brand}</span>
        </div>
        <h1>{title}</h1>
        <p className="sub">{item.subtitle}</p>
        <div className="om-facts">
          <span className="om-fact ok">{item.condition}</span>
          <span className="om-fact">
            <CalendarDays /> Yaroqlilik: {item.expiry}
          </span>
          <span className="om-fact">
            <Package /> Miqdori: {item.qty}
          </span>
        </div>
        <p className="om-pin" style={{ marginTop: "calc(.45 * var(--u))" }}>
          <MapPin /> {item.city}
        </p>

        <section className="om-box">
          <p className="label">Hozirgi narx</p>
          <div className="om-now">
            <b>{formatMoney(item.price, "UZS")}</b>
            <em>-{item.discount}%</em>
          </div>
          <p>
            Asl narxi (yangi): <s>{formatMoney(item.oldPrice, "UZS")}</s>
          </p>
          <p className="save">Tejaysiz: {formatMoney(savings, "UZS")}</p>
        </section>

        <section className="om-box">
          <h2>Tavsif</h2>
          <p className="copy">{item.description}</p>
        </section>

        <section className="om-box">
          <h2>Sotuvchi</h2>
          <div className="om-seller">
            <img src="/img/mobile/dilnoza.jpg" alt="" />
            <div>
              <b>{item.seller}</b>
              <span>
                <Star className="star" /> {item.rating} ({item.reviews} ta baho)
              </span>
              <span>
                <MapPin /> {item.city}
              </span>
            </div>
            <button type="button" className="om-write" onClick={() => setChat(true)}>
              Sotuvchiga yozish
            </button>
          </div>
        </section>

        <div className="om-safe">
          <ShieldCheck />
          <div>
            <b>Xavfsiz savdo</b>
            <span>To‘lovni platforma orqali amalga oshiring va o‘zingizni himoya qiling.</span>
          </div>
        </div>

        {note ? <p className="om-note">{note}</p> : null}
        <div className="om-pad" />
      </div>

      <div className="om-buy">
        <button
          type="button"
          className="cart"
          data-testid="om-add"
          onClick={() => add(item.id, mobileSurplusProduct(item))}
        >
          <ShoppingCart /> Savatga qo‘shish
        </button>
        <button type="button" className="chat" onClick={() => setChat(true)}>
          <MessageCircle /> Sotuvchiga yozish
        </button>
      </div>

      {chat ? (
        <div className="om-sheet" role="dialog" aria-label="Sotuvchiga yozish">
          <button type="button" aria-label="Yopish" className="absolute inset-0" onClick={() => setChat(false)} />
          <form
            className="om-panel"
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
