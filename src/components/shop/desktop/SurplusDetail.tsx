"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, Clock, Eye, Heart, MapPin, Package, Phone, ShieldCheck, Star } from "lucide-react";
import { filtekSimilar, getSurplusDetail, surplusHref, surplusSeed } from "@/data/desktop-shop";
import { telegramHref } from "@/data/surplus";
import { shopToggleFav, som, useShopCart, useShopFavs } from "./shop-cart";
import { ShopShell } from "./ShopShell";

export function SurplusDetail({ id }: { id: string }) {
  const listing = getSurplusDetail(id);
  const lines = useShopCart(surplusSeed);
  const favs = useShopFavs();
  const [photo, setPhoto] = useState(0);
  const [start, setStart] = useState(0);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  if (!listing) {
    return (
      <ShopShell searchPath="/ortiqcha-material" cartCount={count}>
        <p>E’lon topilmadi.</p>
      </ShopShell>
    );
  }

  const gallery = listing.gallery;
  const fav = favs.includes(listing.id);
  const similar = (listing.id === "filtek-z350-xt-a2" ? filtekSimilar : filtekSimilar.filter((item) => item.id !== listing.id)).slice(start, start + 5);
  const phone = listing.phone.replace(/\D/g, "");

  return (
    <ShopShell searchPath="/ortiqcha-material" cartCount={count}>
      <article data-testid="surplus-detail">
        <nav className="dk-crumbs">
          <Link href="/">Bosh sahifa</Link>
          <span>/</span>
          <Link href="/ortiqcha-material">Ortiqcha material</Link>
          <span>/</span>
          <Link href="/ortiqcha-material">{listing.categoryLabel}</Link>
          <span>/</span>
          <b>{listing.title}</b>
        </nav>
        <div className="pd-grid">
          <div className="pd-gal">
            <div className="stage">
              <img src={gallery[photo] ?? listing.gallery[0]} alt={listing.title} />
              <button type="button" className="nav prev" aria-label="Oldingi" onClick={() => setPhoto((index) => (index - 1 + gallery.length) % gallery.length)}>
                <ChevronLeft className="i" />
              </button>
              <button type="button" className="nav next" aria-label="Keyingi" onClick={() => setPhoto((index) => (index + 1) % gallery.length)}>
                <ChevronRight className="i" />
              </button>
            </div>
            <div className="pd-thumbs">
              {gallery.slice(0, 3).map((src, index) => (
                <button key={src + index} type="button" className={photo === index ? "on" : ""} onClick={() => setPhoto(index)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="pd-kicker">{listing.brand} · {listing.categoryLabel}</div>
            <h1 className="pd-title">{listing.title}</h1>
            <div className="sp-badges">
              {listing.badges.map((badge) => (
                <span key={badge.text} className={`sp-badge ${badge.tone}`}>{badge.text}</span>
              ))}
            </div>
            <div className="pd-rate">
              <Star className="i" />
              <b>{listing.rating.toFixed(1)}</b>
              <span>({listing.reviews} ta sharh)</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "calc(.2 * var(--u))" }}>
                <Eye className="i" /> {listing.views} marta ko‘rilgan
              </span>
            </div>
            <p className="pd-blurb">{listing.blurb}</p>
            <div className="sp-facts">
              {listing.facts.map((fact) => (
                <div className="pd-fact" key={fact.label}>
                  <small>{fact.label}</small>
                  <b>{fact.value}</b>
                </div>
              ))}
            </div>
            <h3 className="sec" style={{ marginTop: "calc(.9 * var(--u))" }}>Tavsif</h3>
            <p className="pd-copy">{listing.description}</p>
          </div>
          <aside className="pd-side">
            <section className="pd-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {listing.discount ? <span className="pd-off">-{listing.discount}%</span> : <span />}
                <button type="button" className={fav ? "pd-heart on" : "pd-heart"} aria-label="Sevimli" onClick={() => shopToggleFav(listing.id)}>
                  <Heart className="i" />
                </button>
              </div>
              <div className="pd-price">{som(listing.price)}</div>
              <div className="pd-old">
                <span>Asl narxi: <s>{som(listing.oldPrice)}</s></span>
              </div>
              <div className="pd-old">
                <span className="pd-save">Tejaysiz: {som(listing.save)}</span>
              </div>
              <a className="pd-buy" href={telegramHref(listing.telegram, `Assalomu alaykum, «${listing.title}» hali bormi?`)} target="_blank" rel="noreferrer">
                Sotuvchiga yozish
                <small style={{ display: "block", fontWeight: 500, opacity: 0.85 }}>Telegram orqali</small>
              </a>
              <a className="pd-ghost" href={`tel:+${phone}`}>
                <Phone className="i" /> Qo‘ng‘iroq qilish
              </a>
            </section>
            <section className="pd-card">
              <div className="pd-seller">
                <img src="/img/avatar.jpg" alt="" />
                <span>
                  <b>{listing.seller.name}</b>
                  <small style={{ color: "#0F766E" }}><BadgeCheck className="i" /> Tekshirilgan sotuvchi</small>
                </span>
              </div>
              <div className="pd-rate" style={{ marginTop: "calc(.45 * var(--u))" }}>
                <Star className="i" /> {listing.seller.rating.toFixed(1)} ({listing.seller.reviews} ta sharh)
                <span>{listing.seller.deals} ta bitim</span>
              </div>
              <div className="dk-stock" style={{ color: "#52637c" }}>
                <MapPin className="i" /> {listing.seller.city} · {listing.seller.place}
              </div>
              <div className="dk-stock" style={{ color: "#52637c" }}>
                <Clock className="i" /> Javob vaqti: {listing.seller.reply}
              </div>
              <div className="safe">
                <b style={{ fontSize: "calc(.72 * var(--u))" }}>Xavfsiz xarid</b>
                <ul style={{ margin: "calc(.3 * var(--u)) 0 0", padding: 0, listStyle: "none" }}>
                  {["Tekshirilgan sotuvchilar", "Yaroqlilik muddati ko‘rsatilgan", "Muloqot platforma orqali", "Shaxsiy ma’lumotlar himoyalangan"].map((item) => (
                    <li key={item}>
                      <ShieldCheck className="i" /> {item}
                    </li>
                  ))}
                </ul>
                <button type="button" className="dk-link" style={{ marginTop: "calc(.3 * var(--u))" }} onClick={() => document.getElementById("xavfsiz")?.scrollIntoView({ behavior: "smooth" })}>
                  Barchasini ko‘rish
                </button>
              </div>
            </section>
          </aside>
        </div>

        <div className="sp-low" id="xavfsiz">
          <section className="dk-panel sp-spec">
            <h3>Xususiyatlari</h3>
            <table className="pd-table">
              <tbody>
                {listing.specs.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="pd-card">
            <h3 className="sec">Sotuvchi</h3>
            <div className="pd-seller">
              <img src="/img/avatar.jpg" alt="" />
              <span>
                <b>{listing.seller.name}</b>
                <small><Package className="i" /> {listing.seller.deals} ta bitim</small>
              </span>
            </div>
          </section>
        </div>

        <section className="pd-sim">
          <div className="hd">
            <h2>O‘xshash e’lonlar</h2>
            <div className="pd-arrows">
              <button type="button" aria-label="Oldingi" onClick={() => setStart((value) => Math.max(0, value - 1))}>
                <ChevronLeft className="i" />
              </button>
              <button type="button" aria-label="Keyingi" onClick={() => setStart((value) => Math.min(2, value + 1))}>
                <ChevronRight className="i" />
              </button>
            </div>
          </div>
          <div className="pd-row" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
            {similar.map((item) => (
              <article className="dk-card" key={item.id}>
                <Link href={surplusHref(item.id)} className="ph">
                  <img src={item.image} alt="" />
                  {item.discount ? <span className="dk-badge red">-{item.discount}%</span> : null}
                </Link>
                <div className="sp-badges">
                  <span className="sp-badge green">{item.badge}</span>
                </div>
                <h3>
                  <Link href={surplusHref(item.id)}>{item.name}</Link>
                </h3>
                <div className="brand">{item.brand}</div>
                <div className="dk-price">
                  <strong>{som(item.price)}</strong>
                  {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                </div>
                <div className="brand"><MapPin className="i" /> {item.city}</div>
              </article>
            ))}
          </div>
        </section>
      </article>
    </ShopShell>
  );
}
