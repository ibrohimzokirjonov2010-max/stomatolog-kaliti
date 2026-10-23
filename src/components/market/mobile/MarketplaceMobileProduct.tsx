"use client";
/* eslint-disable @next/next/no-img-element -- seller photos stay contain inside the frame */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, ChevronLeft, ChevronRight, FileText, Heart, MapPin, MessageCircle, Package, ShoppingCart, Star, Store, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { catalogCardFrom, catalogHref, fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatDotDate } from "@/lib/format";
import { marketGroupId, marketGroupLabel } from "@/lib/mp-groups";
import { som, shopToggleFav, useShopFavs } from "@/components/shop/desktop/shop-cart";
import "./marketplace-phone.css";

function text(attrs: Record<string, unknown>, key: string) {
  const value = attrs[key];
  return typeof value === "string" ? value.trim() : "";
}

function benefitsOf(attrs: Record<string, unknown>) {
  const raw = attrs.benefits;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 6);
}

export function MarketplaceMobileProduct({ id }: { id: string }) {
  const router = useRouter();
  const { add } = useCart();
  const favs = useShopFavs();
  const reviews = useProductReviews(id);
  const [card, setCard] = useState<CatalogCard | null | undefined>(undefined);
  const [related, setRelated] = useState<CatalogCard[]>([]);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("");
  const [light, setLight] = useState(false);

  useEffect(() => {
    let stop = false;
    void fetch(`/api/catalog/${id}`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json: { ok?: boolean; product?: Record<string, unknown> }) => {
        if (stop) return;
        setCard(json.ok && json.product ? catalogCardFrom(json.product) : null);
      })
      .catch(() => {
        if (!stop) setCard(null);
      });
    void fetchCatalogProducts().then((rows) => {
      if (!stop) setRelated(rows.filter((item) => item.id !== id));
    });
    return () => {
      stop = true;
    };
  }, [id]);

  const gallery = useMemo(() => (card ? [card.image, ...card.images].filter((src, index, all) => src && all.indexOf(src) === index) : []), [card]);

  if (card === undefined) return <p className="mpx-mprod note">Yuklanmoqda...</p>;
  if (card === null) {
    return (
      <p className="mpx-mprod note">
        Mahsulot topilmadi. <Link href="/marketplace">Marketplace</Link>
      </p>
    );
  }

  const product = card;
  const attrs = product.attrs;
  const short = text(attrs, "shortDescription");
  const typeLine = [text(attrs, "type"), text(attrs, "volume")].filter(Boolean).join(" · ") || product.subcategory;
  const official = attrs.official === true;
  const expiry = text(attrs, "expiryDate");
  const lot = text(attrs, "lot");
  const city = text(attrs, "city") || product.shopCity;
  const delivery = attrs.freeDelivery === true ? "Bepul" : Number(attrs.deliveryPrice) > 0 ? som(Number(attrs.deliveryPrice)) : product.delivery.trim();
  const condition = text(attrs, "condition");
  const docs = Array.isArray(attrs.docs) ? (attrs.docs as { url?: string; name?: string; size?: number }[]).filter((doc) => doc?.url) : [];
  const benefits = benefitsOf(attrs);
  const usage = text(attrs, "usage");
  const stock = product.stockQty;
  const shot = gallery[photo] || gallery[0] || "";
  const fav = favs.includes(product.id);
  const group = marketGroupLabel(marketGroupId(product));
  const reviewCount = reviews.count || (product.reviews > 0 ? product.reviews : 0);
  const reviewAvg = reviews.avg ?? (product.reviews > 0 ? product.rating : 0);
  const similar = related.filter((item) => item.category === product.category || marketGroupId(item) === marketGroupId(product)).slice(0, 4);

  const facts = [
    condition ? ["Holati", condition === "yangi" ? "Yangi" : condition] : null,
    expiry ? ["Yaroqlilik", formatDotDate(expiry)] : null,
    lot ? ["Lot", lot] : null,
    city ? ["Joylashuv", city] : null,
  ].filter((row): row is [string, string] => Boolean(row));

  const tabs = [
    product.description || short || benefits.length ? "Tavsif" : "",
    usage ? "Klinik qo‘llanish" : "",
    docs.length ? "Sertifikat" : "",
    reviewCount > 0 ? `Sharhlar (${reviewCount})` : "",
    delivery ? "Yetkazib berish" : "",
    "Qayta buyurtma",
  ].filter(Boolean);
  const active = tabs.includes(tab) ? tab : tabs[0];

  function addLine(checkout = false) {
    if (stock < 1) return;
    add(product.id, productFromCatalog(product), qty);
    if (checkout) router.push("/savat/rasmiylashtirish");
  }

  return (
    <article className="mpx-mprod lg:hidden" data-testid="product-mobile">
      <nav className="crumbs">
        <Link href="/marketplace">Marketplace</Link>
        <span>/</span>
        {group ? <Link href={`/marketplace?cat=${marketGroupId(product)}`}>{group}</Link> : null}
        <span>/</span>
        <b>{product.name}</b>
      </nav>
      <div className={gallery.length > 1 ? "stage" : "stage solo"} onClick={() => shot && setLight(true)}>
        {shot ? <img src={shot} alt={product.name} /> : null}
        {gallery.length > 1 ? (
          <>
            <button type="button" className="nav prev" aria-label="Oldingi" onClick={(event) => { event.stopPropagation(); setPhoto((photo - 1 + gallery.length) % gallery.length); }}><ChevronLeft size={16} /></button>
            <button type="button" className="nav next" aria-label="Keyingi" onClick={(event) => { event.stopPropagation(); setPhoto((photo + 1) % gallery.length); }}><ChevronRight size={16} /></button>
          </>
        ) : null}
      </div>
      {gallery.length > 1 ? (
        <div className="thumbs">
          {gallery.slice(0, 5).map((src, index) => (
            <button key={`${index}-${src}`} type="button" className={index === photo ? "on" : undefined} onClick={() => setPhoto(index)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
      <p className="type" style={{ marginTop: 10 }}>
        {product.brand && product.brand !== "Brend" ? product.brand : null}
        {official ? <span style={{ color: "#0f766e", fontWeight: 700 }}> · <BadgeCheck size={14} style={{ display: "inline" }} /> Rasmiy distribyutor</span> : null}
        <button type="button" aria-label="Sevimlilarga" onClick={() => shopToggleFav(product.id)} style={{ float: "right", color: fav ? "#dc2626" : "#64748b" }}>
          <Heart size={18} fill={fav ? "currentColor" : "none"} />
        </button>
      </p>
      <h1>{product.name}</h1>
      {typeLine ? <p className="type">{typeLine}</p> : null}
      {reviewCount > 0 || product.soldCount > 0 ? (
        <p className="type">
          {reviewCount > 0 ? <><Star size={14} fill="#f5b400" color="#f5b400" /> {reviewAvg.toFixed(1)} ({reviewCount})</> : null}
          {product.soldCount > 0 ? ` · ${product.soldCount} ta sotilgan` : null}
        </p>
      ) : null}
      <section className="mpp-price">
        <div>
          <b>{som(product.price)}</b>
          {product.oldPrice && product.oldPrice > product.price ? <em>-{Math.round((1 - product.price / product.oldPrice) * 100)}%</em> : null}
        </div>
        {product.oldPrice && product.oldPrice > product.price ? (
          <>
            <s>{som(product.oldPrice)}</s>
            <span className="mpp-save">Tejaysiz: {som(product.oldPrice - product.price)}</span>
          </>
        ) : null}
      </section>
      <div className="mpp-stock">
        <span className={stock > 0 ? "ok" : "no"}><Package size={16} /> {stock > 0 ? "Omborda bor" : "Tugagan"}</span>
        {delivery ? <span className="mpp-del"><Truck size={16} /> {delivery}</span> : null}
      </div>
      <div className="mpp-qty">
        <small>Miqdori</small>
        <div>
          <button type="button" aria-label="Kamaytirish" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
          <b>{qty}</b>
          <button type="button" aria-label="Oshirish" disabled={stock > 0 && qty >= stock} onClick={() => setQty(qty + 1)}>+</button>
        </div>
      </div>
      {facts.length ? (
        <div className="facts">
          {facts.map(([label, value]) => (
            <div key={label}><small>{label}</small><b>{value}</b></div>
          ))}
        </div>
      ) : null}
      {docs.length ? (
        <div className="facts" style={{ marginTop: 8 }}>
          {docs.slice(0, 2).map((doc) => (
            <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 8 }}>
              <FileText size={16} color="#0f766e" />
              <span><b style={{ display: "block", fontSize: 13 }}>{doc.name || "PDF"}</b><small style={{ color: "#0f766e" }}>Yuklash</small></span>
            </a>
          ))}
        </div>
      ) : null}
      <button type="button" onClick={() => addLine(true)} disabled={stock < 1} style={{ marginTop: 12, width: "100%", height: 44, borderRadius: 10, background: "#ccfbf1", color: "#0f766e", fontWeight: 750 }}>
        Hozir xarid qilish
      </button>
      {tabs.length ? (
        <>
          <div className="tabs" role="tablist">
            {tabs.map((item) => (
              <button key={item} type="button" className={active === item ? "on" : undefined} onClick={() => setTab(item)}>{item}</button>
            ))}
          </div>
          {active === "Tavsif" ? (
            <div>
              <p className="copy">{product.description || short}</p>
              {benefits.length ? <ul>{benefits.map((item) => <li key={item}>✓ {item}</li>)}</ul> : null}
            </div>
          ) : null}
          {active === "Klinik qo‘llanish" ? <p className="copy">{usage}</p> : null}
          {active === "Sertifikat" ? docs.map((doc) => <p key={doc.url} className="copy"><a href={doc.url}>{doc.name || "Hujjat"} — Yuklash</a></p>) : null}
          {active.startsWith("Sharhlar") ? <ProductReviewsList data={reviews} /> : null}
          {active === "Yetkazib berish" ? <p className="copy">Yetkazib berish: {delivery}. To‘lov naqd, yetkazib berilganda.</p> : null}
          {active === "Qayta buyurtma" ? <p className="copy">Shu mahsulotni yana savatga qo‘shish. To‘lov yetkazilganda naqd.</p> : null}
        </>
      ) : null}
      {product.shopName ? (
        <section className="mpp-seller">
          <b className="mpp-seller-h">Sotuvchi</b>
          <div>
            <span className="mpp-logo">{product.shopLogo ? <img src={product.shopLogo} alt="" /> : <Store size={20} />}</span>
            <span className="mpp-seller-copy">
              <b>{product.shopName}</b>
              {city ? <small><MapPin size={12} /> {city}</small> : null}
            </span>
            {product.shopSlug ? <Link href={`/marketplace/dokon/${product.shopSlug}`} className="mpp-write"><MessageCircle size={15} /> Do‘kon</Link> : null}
          </div>
        </section>
      ) : null}
      {similar.length ? (
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
            <b>O‘xshash mahsulotlar</b>
            <Link href="/marketplace" style={{ color: "#0f766e", fontSize: 13, fontWeight: 700 }}>Barchasini ko‘rish</Link>
          </div>
          <div className="simrow">
            {similar.map((item) => (
              <Link key={item.id} href={catalogHref(item.category, item.id)}>
                {item.image ? <img src={item.image} alt="" /> : null}
                <b>{item.name}</b>
                <strong className={item.discount ? "sale" : undefined}>{som(item.price)}</strong>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mpx-sticky">
        <div>
          {product.oldPrice && product.oldPrice > product.price ? <s>{som(product.oldPrice)}</s> : null}
          <b>{som(product.price)}</b>
        </div>
        <button type="button" data-testid="product-add" disabled={stock < 1} onClick={() => addLine()}>
          <ShoppingCart size={16} style={{ display: "inline", marginRight: 6 }} />
          Savatga qo‘shish
        </button>
      </div>
      {light && shot ? (
        <div className="mpx-light" role="dialog" aria-label="Rasm" onClick={() => setLight(false)} style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(15,23,42,.72)", display: "grid", placeItems: "center", padding: 16 }}>
          <img src={shot} alt={product.name} style={{ maxWidth: "100%", maxHeight: "86vh", objectFit: "contain", background: "#fff", borderRadius: 12, padding: 12 }} />
        </div>
      ) : null}
    </article>
  );
}
