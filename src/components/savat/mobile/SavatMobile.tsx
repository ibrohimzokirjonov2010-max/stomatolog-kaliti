"use client";
/* eslint-disable @next/next/no-img-element -- cart photos are content images */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, ShoppingCart, Store, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { colorLabel } from "@/data/forma";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { formatMoney } from "@/lib/format";
import "./savat-mobile.css";

export function SavatMobile() {
  const router = useRouter();
  const cart = useCart();
  const favorites = useFavorites();
  const { items, setQty, remove, clear } = cart;
  const lines = items.length;
  const goods = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const delivery = shopDeliveryFee(items.map((item) => item.product));
  const total = goods + delivery;

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
          <Link href="/" className="mh-logo">STOMA<span>HUB</span></Link>
          <Link href="/savat" className="mh-ic" aria-label="Savat">
            <ShoppingCart />
            {lines > 0 ? <span className="mh-badge" data-testid="sv-cart-badge">{lines > 9 ? "9+" : lines}</span> : null}
          </Link>
          <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
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
                    {item.color ? <p className="sv-color"><i className="sv-dot" /> Rang: {colorLabel(item.color)}</p> : null}
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
            <section className="sv-box">
              <h3><Truck /> Yetkazib berish</h3>
              <p className="sv-line"><span>Sotuvchi belgilagan haq</span>{delivery ? <b>{formatMoney(delivery, "UZS")}</b> : <b className="free">Bepul</b>}</p>
            </section>
            <section className="sv-box" data-testid="sv-summary">
              <h3>Buyurtma xulosasi</h3>
              <p className="sv-line"><span>Mahsulotlar ({lines} ta)</span><b>{formatMoney(goods, "UZS")}</b></p>
              <p className="sv-line"><span>Yetkazib berish</span>{delivery ? <b data-testid="sv-delivery">{formatMoney(delivery, "UZS")}</b> : <b className="free" data-testid="sv-delivery">Bepul</b>}</p>
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
