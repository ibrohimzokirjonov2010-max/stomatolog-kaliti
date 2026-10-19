"use client";
/* eslint-disable @next/next/no-img-element -- gallery photos are sized by the fluid unit */

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle, Package, Pencil, Share2, ShieldCheck, ShoppingCart, Star, BadgeCheck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { detailTitle, type MobileSurplusItem } from "@/data/mobile-surplus";
import { listingToProduct } from "@/data/surplus";
import { initialsFromName } from "@/lib/doctor-profile";
import { formatMoney } from "@/lib/format";
import type { SurplusView } from "./surplus-view";
import "./surplus-mobile.css";

export function SurplusMobileDetail({
  view,
  modNote,
  onContact,
  onEdit,
}: {
  view: SurplusView;
  modNote?: string;
  onContact?: () => void;
  onEdit?: () => void;
}) {
  const cart = useCart();
  const favorites = useFavorites();
  const [shot, setShot] = useState(0);
  const [sheet, setSheet] = useState<"" | "sample" | "safe">("");
  const [note, setNote] = useState("");
  const saved = favorites.has(view.id);
  const listing = view.listing;
  const mine = Boolean(listing?.mine);
  const title = view.real ? view.name : detailTitle(view as unknown as MobileSurplusItem);
  const gallery = view.gallery.length > 0 ? view.gallery : [view.image];
  const photo = gallery[Math.min(shot, gallery.length - 1)];
  const savings = Math.max(0, view.oldPrice - view.price);
  const inCart = cart.lines.some((line) => line.productId === view.id);

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

  function addToCart() {
    if (!listing) {
      setSheet("sample");
      return;
    }
    cart.add(listing.id, listingToProduct(listing), 1, { source: "ortiqcha", expiryMonths: listing.expiryMonths });
    setNote("Savatga qo‘shildi");
  }

  function write() {
    if (!listing || !onContact) {
      setSheet("sample");
      return;
    }
    onContact();
  }

  return (
    <div className="om om-pdp lg:hidden" data-testid="mobile-surplus-detail" data-real={view.real ? "1" : undefined}>
      <div className="om-hero">
        <img className="main" src={photo} alt="" />
        <Link href="/ortiqcha-material" className="om-float back" aria-label="Orqaga">
          <ChevronLeft />
        </Link>
        <button type="button" className={saved ? "om-float heart on" : "om-float heart"} aria-label="Sevimlilar" aria-pressed={saved} onClick={() => favorites.toggle(view.id)}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="om-float share" aria-label="Ulashish" onClick={() => void onShare()}>
          <Share2 />
        </button>
      </div>
      {gallery.length > 1 ? (
        <div className="om-thumbs">
          {gallery.map((src, index) => (
            <button key={src} type="button" className={index === shot ? "on" : undefined} aria-label={`Rasm ${index + 1}`} onClick={() => setShot(index)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="om-body om-detail">
        {modNote ? <p className="om-note warn">{modNote}</p> : null}
        <div className="om-pills">
          <span>{view.chipLabel}</span>
          {view.brand ? <span className="brand">{view.brand}</span> : null}
        </div>
        <h1>{title}</h1>
        {view.subtitle ? <p className="sub">{view.subtitle}</p> : null}
        <div className="om-facts">
          {view.condition ? (
            <span className="om-fact ok">
              <BadgeCheck /> {view.condition}
            </span>
          ) : null}
          {view.expiry ? (
            <span className="om-fact">
              <CalendarDays /> Yaroqlilik: {view.expiry}
            </span>
          ) : null}
          {view.qty ? (
            <span className="om-fact">
              <Package /> Miqdori: {view.qty}
            </span>
          ) : null}
        </div>
        <p className="om-pin">
          <MapPin /> {view.city}
        </p>

        <section className="om-box price">
          <p className="label">Hozirgi narx</p>
          <div className="om-now">
            <b>{formatMoney(view.price, "UZS")}</b>
            {view.discount > 0 ? <em>-{view.discount}%</em> : null}
          </div>
          {view.oldPrice > view.price ? (
            <>
              <p>
                Asl narxi (yangi): <s>{formatMoney(view.oldPrice, "UZS")}</s>
              </p>
              <p className="save">Tejaysiz: {formatMoney(savings, "UZS")}</p>
            </>
          ) : null}
        </section>

        {view.description ? (
          <section className="om-sec">
            <h2>Tavsif</h2>
            <p className="copy">{view.description}</p>
          </section>
        ) : null}

        <section className="om-sec">
          <h2>Sotuvchi</h2>
          <div className="om-seller">
            {view.real ? <span className="ava">{initialsFromName(view.seller)}</span> : <img src="/img/mobile/dilnoza.jpg" alt="" />}
            <div>
              <b>
                {mine ? `Siz · ${view.seller}` : view.seller}
                {!view.real ? <BadgeCheck className="ok" /> : null}
              </b>
              {view.rating ? (
                <span>
                  <Star className="star" /> {view.rating} ({view.reviews} ta baho)
                </span>
              ) : null}
              <span>
                <MapPin /> {view.city}
              </span>
            </div>
            {mine ? (
              <button type="button" className="om-write" onClick={onEdit}>
                <Pencil /> Tahrirlash
              </button>
            ) : (
              <button type="button" className="om-write" data-testid="om-write" onClick={write}>
                <MessageCircle /> Sotuvchiga yozish
              </button>
            )}
          </div>
        </section>

        <button type="button" className="om-safe" onClick={() => setSheet("safe")}>
          <ShieldCheck />
          <div>
            <b>Xavfsiz savdo</b>
            <span>To‘lovni platforma orqali amalga oshiring va o‘zingizni himoya qiling.</span>
          </div>
          <ChevronRight className="go" />
        </button>

        {note ? <p className="om-note">{note}</p> : null}
        <div className="om-pad" />
      </div>

      <div className="om-buy">
        {mine ? (
          <button type="button" className="cart" onClick={onEdit}>
            <Pencil /> Tahrirlash
          </button>
        ) : (
          <button type="button" className={inCart ? "cart done" : "cart"} data-testid="om-add" onClick={inCart ? undefined : addToCart}>
            {inCart ? <Check /> : <ShoppingCart />} {inCart ? "Savatda" : "Savatga qo‘shish"}
          </button>
        )}
        {inCart ? (
          <Link href="/savat" className="chat">
            <ShoppingCart /> Savatga o‘tish
          </Link>
        ) : (
          <button type="button" className="chat" onClick={mine ? () => setNote("Bu sizning e’loningiz") : write}>
            <MessageCircle /> Sotuvchiga yozish
          </button>
        )}
      </div>

      {sheet ? (
        <div className="mb-sheet" role="dialog" aria-label={sheet === "safe" ? "Xavfsiz savdo" : "Namuna e’lon"} data-testid={`om-sheet-${sheet}`}>
          <button type="button" aria-label="Yopish" className="bg" onClick={() => setSheet("")} />
          <div className="mb-panel">
            {sheet === "safe" ? (
              <>
                <h3>Xavfsiz savdo</h3>
                <p>Savatga qo‘shib, buyurtmani platforma orqali rasmiylashtirsangiz, buyurtma «Buyurtmalarim»da saqlanadi va yetkazilgach muammo bo‘lsa e’tiroz bildirishingiz mumkin.</p>
                <p>Sotuvchi bilan to‘g‘ridan-to‘g‘ri kelishsangiz, mahsulotni ko‘rib, yaroqlilik muddatini tekshirib oling va oldindan to‘lov qilmang.</p>
              </>
            ) : (
              <>
                <h3>Namuna e’lon</h3>
                <p>Bu e’lon bo‘lim qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan — uning egasi yo‘q, shuning uchun sotib olib yoki yozib bo‘lmaydi.</p>
                <p>Haqiqiy e’lonlar ro‘yxat boshida chiqadi. O‘zingizdagi ortiqcha materialni ham e’lon qilishingiz mumkin.</p>
              </>
            )}
            <div className="row">
              <button type="button" onClick={() => setSheet("")}>
                Yopish
              </button>
              {sheet === "sample" ? (
                <Link className="go" href="/ortiqcha-material?joylash=1">
                  E’lon berish
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
