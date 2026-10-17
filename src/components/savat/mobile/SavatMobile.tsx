"use client";
/* eslint-disable @next/next/no-img-element -- cart photos are content images */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, ShoppingCart, Store, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { formatMoney } from "@/lib/format";
import "./savat-mobile.css";

const DISCOUNT = 500_000;
const REGION_FEE = 30_000;

export function SavatMobile() {
  const router = useRouter();
  const cart = useCart();
  const favorites = useFavorites();
  const { items, setQty, remove, clear } = cart;
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [ship, setShip] = useState<"toshkent" | "viloyat">("toshkent");
  const lines = items.length;
  const goods = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = applied ? DISCOUNT : 0;
  const delivery = ship === "viloyat" ? REGION_FEE : 0;
  const total = Math.max(0, goods - discount + delivery);

  return (
    <div className="sv lg:hidden" data-testid="mobile-savat">
      <header className="mh-bar">
        <div className="sv-head">
          <MobileMenuButton />
          <button
            type="button"
            className="sv-back"
            aria-label="Orqaga"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/marketplace");
            }}
          >
            <ArrowLeft />
          </button>
          <Link href="/" className="mh-logo">STOMAHUB</Link>
          <Link href="/savat" className="mh-ic" aria-label="Savat">
            <ShoppingCart />
            {lines > 0 ? <span className="mh-badge" data-testid="sv-cart-badge">{lines > 9 ? "9+" : lines}</span> : null}
          </Link>
          <NotificationBell variant="mobile" minBadge={3} buttonClassName="size-10 text-[#1a1d26]" />
        </div>
      </header>
      <div className="sv-body">
        <div className="sv-top">
          <div>
            <h1 className="sv-title">Savat</h1>
            <p className="sv-sub">Tanlangan mahsulotlar ro‘yxati ({lines} ta)</p>
          </div>
          {lines > 0 ? (
            <button type="button" className="sv-clear" onClick={() => clear()}>
              <Trash2 /> Barchasini o‘chirish
            </button>
          ) : null}
        </div>
        {lines === 0 ? (
          <div className="sv-empty" data-testid="sv-empty">
            <h2>Savat bo‘sh</h2>
            <p>Marketplacedan mahsulot qo‘shing.</p>
            <Link href="/marketplace">Xaridni boshlash</Link>
          </div>
        ) : (
          <>
            {items.map((item) => {
              const fav = favorites.has(item.product.id);
              return (
                <article key={item.key} className="sv-card" data-testid={`sv-line-${item.product.id}`}>
                  <img src={item.product.image} alt="" />
                  <div className="sv-main">
                    <div className="sv-row">
                      <h2>{item.product.name}</h2>
                      <button type="button" className="sv-icon" aria-label="O‘chirish" onClick={() => remove(item.key)}><Trash2 /></button>
                      <button type="button" className={fav ? "sv-icon on" : "sv-icon"} aria-label="Saqlash" aria-pressed={fav} onClick={() => favorites.toggle(item.product.id)}>
                        <Heart fill={fav ? "currentColor" : "none"} />
                      </button>
                    </div>
                    {item.size ? <p className="sv-variant">{item.size}</p> : null}
                    <p className="sv-seller"><Store /> {item.product.shopName || item.product.brand}</p>
                    {item.color ? <p className="sv-color"><i className="sv-dot" /> Rang: {item.color}</p> : null}
                    <div className="sv-buy">
                      <div className="sv-step">
                        <button type="button" aria-label="Kamaytirish" onClick={() => setQty(item.key, item.qty - 1)} disabled={item.qty <= 1}>−</button>
                        <b>{item.qty}</b>
                        <button type="button" aria-label="Oshirish" onClick={() => setQty(item.key, item.qty + 1)} disabled={item.qty >= item.max}>+</button>
                      </div>
                      <p className="sv-price">
                        {formatMoney(item.lineTotal, "UZS")}
                        {item.qty > 1 ? <span className="sv-unit">{item.qty} x {formatMoney(item.product.price, "UZS")}</span> : null}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
            <section className="sv-box sv-promo">
              <div className="sv-promo-top">
                <i>%</i>
                <div>
                  <b>Promo-kod</b>
                  <span>Chegirma olish uchun promo-kod kiriting</span>
                </div>
                <button type="button" className="sv-apply" onClick={() => {
                  if (!code.trim()) {
                    setApplied(false);
                    setPromoError("Promo-kod kiriting");
                    return;
                  }
                  setPromoError("");
                  setApplied(true);
                }}>Qo‘llash</button>
              </div>
              <form onSubmit={(event) => {
                event.preventDefault();
                if (!code.trim()) {
                  setApplied(false);
                  setPromoError("Promo-kod kiriting");
                  return;
                }
                setPromoError("");
                setApplied(true);
              }}>
                <input aria-label="Promo-kod" placeholder="Promo-kod kiriting..." value={code} onChange={(event) => setCode(event.target.value)} />
              </form>
              {promoError ? <p className="sv-err">{promoError}</p> : null}
            </section>
            <section className="sv-box">
              <h3><Truck /> Yetkazib berish</h3>
              <label className="sv-ship">
                <input type="radio" name="ship" checked={ship === "toshkent"} onChange={() => setShip("toshkent")} />
                <b>Toshkent bo‘ylab</b>
                <span className="sv-eta">1–2 kun</span>
                <em>Bepul</em>
              </label>
              <label className="sv-ship">
                <input type="radio" name="ship" checked={ship === "viloyat"} onChange={() => setShip("viloyat")} />
                <b>Boshqa viloyatlar</b>
                <span className="sv-eta">2–4 kun</span>
                <em className="pay">{formatMoney(REGION_FEE, "UZS")}</em>
              </label>
            </section>
            <section className="sv-box" data-testid="sv-summary">
              <h3>Buyurtma xulosasi</h3>
              <p className="sv-line"><span>Mahsulotlar ({lines} ta)</span><b>{formatMoney(goods, "UZS")}</b></p>
              <p className="sv-line"><span>Chegirma</span><b className="off">{discount ? `-${formatMoney(discount, "UZS")}` : formatMoney(0, "UZS")}</b></p>
              <p className="sv-line"><span>Yetkazib berish</span>{delivery ? <b>{formatMoney(delivery, "UZS")}</b> : <b className="free">Bepul</b>}</p>
              <p className="sv-jami"><span>Jami</span><b data-testid="sv-total">{formatMoney(total, "UZS")}</b></p>
            </section>
            <div className="sv-pad" />
          </>
        )}
      </div>
      {lines > 0 ? (
        <div className="sv-bar" data-testid="sv-bar">
          <p>Jami:<strong>{formatMoney(total, "UZS")}</strong></p>
          <Link href="/buyurtma" className="sv-go">Rasmiylashtirish →</Link>
        </div>
      ) : null}
    </div>
  );
}
