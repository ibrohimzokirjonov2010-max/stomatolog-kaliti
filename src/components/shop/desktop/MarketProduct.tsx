"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, FileText, Heart, MapPin, RefreshCw, ShoppingCart, Star, Store } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/data/products";
import { getMarketProduct, marketHref, marketSeed, pdpSimilar } from "@/data/desktop-shop";
import { shopAdd, shopToggleFav, som, useShopCart, useShopFavs } from "./shop-cart";
import { ShopShell } from "./ShopShell";
import { Stepper } from "./parts";
import { freeDeliveryText } from "@/lib/commerce-terms";

const tabs = ["Tavsif", "Klinik qo‘llanish", "Texnik xususiyatlar", "Sertifikat", "Sharhlar", "Yetkazib berish", "Qayta buyurtma"] as const;

export function MarketProduct({ id }: { id: string }) {
  const product = getMarketProduct(id);
  const lines = useShopCart(marketSeed);
  const favs = useShopFavs();
  const router = useRouter();
  const real = useCart();
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Tavsif");
  const [start, setStart] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const gallery = product?.gallery ?? [];
  const similar = useMemo(() => pdpSimilar.filter((item) => item.id !== id), [id]);
  const visible = similar.slice(start, start + 4);
  const fav = product ? favs.includes(product.id) : false;

  if (!product) {
    return (
      <ShopShell searchPath="/marketplace" cartCount={lines.reduce((sum, line) => sum + line.qty, 0)}>
        <p>Mahsulot topilmadi.</p>
      </ShopShell>
    );
  }

  function push(amount = qty) {
    shopAdd({ id: product!.id, name: product!.name, price: product!.price, image: product!.image, href: marketHref(product!.id) }, amount);
  }

  function checkout(amount = qty) {
    push(amount);
    const extra: Product = {
      id: product!.id,
      name: product!.name,
      brand: product!.brand,
      category: "materiallar",
      price: product!.price,
      oldPrice: product!.oldPrice,
      rating: product!.rating,
      reviews: product!.reviews,
      inStock: true,
      delivery: product!.delivery,
      image: product!.image,
      stockQty: 40,
    };
    real.add(product!.id, extra, amount);
    router.push("/checkout");
  }

  return (
    <ShopShell searchPath="/marketplace" cartCount={lines.reduce((sum, line) => sum + line.qty, 0)}>
      <article data-testid="market-product">
        <nav className="dk-crumbs">
          <Link href="/marketplace">Marketplace</Link>
          <span>/</span>
          <Link href="/marketplace">Materiallar</Link>
          <span>/</span>
          <Link href="/marketplace">Bond</Link>
          <span>/</span>
          <b>{product.name.split(" ")[0]} {product.name.split(" ")[1] ?? ""}</b>
        </nav>
        <div className="pd-grid">
          <div className="pd-gal">
            <div className="stage">
              <img src={gallery[photo] ?? product.image} alt={product.name} />
              <button type="button" className="nav prev" aria-label="Oldingi rasm" onClick={() => setPhoto((index) => (index - 1 + gallery.length) % gallery.length)}>
                <ChevronLeft className="i" />
              </button>
              <button type="button" className="nav next" aria-label="Keyingi rasm" onClick={() => setPhoto((index) => (index + 1) % gallery.length)}>
                <ChevronRight className="i" />
              </button>
            </div>
            <div className="pd-thumbs">
              {gallery.slice(0, 4).map((src, index) => (
                <button type="button" key={src + index} className={photo === index ? "on" : ""} onClick={() => setPhoto(index)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="pd-kicker">
              {product.brand}
              {product.official ? <span className="pill">Rasmiy distribyutor</span> : null}
            </div>
            <h1 className="pd-title">{product.id === "optibond-solo-plus" ? "OptiBond Solo Plus" : product.name.replace(/ \(.*\)$/, "")}</h1>
            <p className="pd-sub">{product.subtitle}</p>
            <div className="pd-rate">
              <Star className="i" />
              <b>{product.rating.toFixed(1)}</b>
              <span>({product.reviews} ta sharh)</span>
              <span>|</span>
              <span>{product.sold.toLocaleString("ru-RU")} ta sotilgan</span>
            </div>
            <p className="pd-blurb">{product.blurb}</p>
            <div className="pd-facts">
              <div className="pd-fact"><small>Holati</small><b>{product.condition}</b></div>
              <div className="pd-fact"><small>Yaroqlilik muddati</small><b>{product.expiry}</b></div>
              <div className="pd-fact"><small>Lot raqami</small><b>{product.lot}</b></div>
              <div className="pd-fact"><small>Miqdor</small><b>{product.qtyLabel}</b></div>
              <div className="pd-fact"><small>Joylashuv</small><b>{product.city}</b></div>
              <div className="pd-fact"><small>Yetkazish</small><b>{product.delivery}</b></div>
            </div>
            <div className="pd-docs">
              <div className="pd-doc">
                <FileText className="ic" />
                <span><b>Sertifikat (PDF)</b><small>1.2 MB</small></span>
                <a href="/docs/optibond-sertifikat.pdf" download>Yuklash <Download className="i" /></a>
              </div>
              <div className="pd-doc">
                <FileText className="ic" />
                <span><b>Yo‘riqnoma (PDF)</b><small>0.8 MB</small></span>
                <a href="/docs/optibond-yoriqnoma.pdf" download>Yuklash <Download className="i" /></a>
              </div>
            </div>
          </div>
          <aside className="pd-side">
            <section className="pd-card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {product.discount ? <span className="pd-off">-{product.discount}%</span> : <span />}
                <button type="button" className={fav ? "pd-heart on" : "pd-heart"} aria-label="Sevimli" onClick={() => shopToggleFav(product.id)}>
                  <Heart className="i" />
                </button>
              </div>
              <div className="pd-price">{som(product.price)}</div>
              <div className="pd-old">
                {product.oldPrice ? <s>{som(product.oldPrice)}</s> : <span />}
                {product.oldPrice ? <span className="pd-save">Tejaysiz: {som(product.oldPrice - product.price)}</span> : null}
              </div>
              <div className="pd-qty">
                <Stepper qty={qty} onChange={(next) => setQty(Math.max(1, next))} />
                <span style={{ color: "#12a06a", fontSize: "calc(.64 * var(--u))", fontWeight: 700 }}>20+ dona mavjud</span>
              </div>
              <button type="button" className="pd-buy" onClick={() => push()}>
                <ShoppingCart className="i" /> Savatga qo‘shish
              </button>
              <button type="button" className="pd-ghost" onClick={() => checkout()}>
                Hozir xarid qilish
              </button>
              <button
                type="button"
                className="pd-ghost"
                onClick={() => {
                  push(Math.max(qty, 2));
                  setNote("Qayta buyurtma savatga qo‘shildi");
                  window.setTimeout(() => setNote(null), 2200);
                }}
              >
                <RefreshCw className="i" /> Tez qayta buyurtma
              </button>
            </section>
            <section className="pd-card">
              <div className="pd-seller">
                <span className="pd-ava">
                  <Store className="i" />
                </span>
                <span>
                  <b>StomaHub Market</b>
                  <small>Rasmiy distribyutor</small>
                  <small>
                    <Star className="i" style={{ color: "#f5b400", fill: "#f5b400" }} /> 4.9 · 1 250+ mahsulot
                  </small>
                </span>
              </div>
              <Link className="pd-mini" href="/marketplace/sotuvchi" style={{ display: "grid", placeItems: "center" }}>
                Sotuvchi profili
              </Link>
            </section>
          </aside>
        </div>

        <div className="pd-tabs" role="tablist">
          {tabs.map((item) => (
            <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "on" : ""} onClick={() => setTab(item)}>
              {item === "Sharhlar" ? `Sharhlar (${product.reviews})` : item}
            </button>
          ))}
        </div>
        <div className="pd-split">
          <div className="pd-copy">
            {tab === "Tavsif" ? (
              <>
                <p>{product.name} — universal mahsulot bo‘lib, klinikada keng qo‘llaniladi. {product.blurb}</p>
                <ul>
                  {product.benefits.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {tab === "Klinik qo‘llanish" ? (
              <ol>
                {product.usage.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                <li>Ishlab chiqaruvchi yo‘riqnomasiga rioya qiling.</li>
              </ol>
            ) : null}
            {tab === "Texnik xususiyatlar" ? (
              <table className="pd-table">
                <tbody>
                  {product.tech.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
            {tab === "Sertifikat" ? (
              <p>
                Mahsulot sertifikati va yo‘riqnoma PDF ko‘rinishida yuklab olinadi. Lot {product.lot}. Yaroqlilik: {product.expiry}.
              </p>
            ) : null}
            {tab === "Sharhlar" ? (
              product.reviewsList.map((review) => (
                <div className="pd-rev" key={review.name}>
                  <b>{review.name}</b> · {review.rating.toFixed(1)} · <span style={{ color: "#8b9bb0" }}>{review.date}</span>
                  <p>{review.text}</p>
                </div>
              ))
            ) : null}
            {tab === "Yetkazib berish" ? (
              <p>
                <MapPin className="i" /> {product.city}. {product.delivery}. {freeDeliveryText()}
              </p>
            ) : null}
            {tab === "Qayta buyurtma" ? (
              <div>
                <p>Oldingi buyurtmadagi miqdorni savatga qaytaring.</p>
                <button type="button" className="pd-buy" style={{ width: "auto", padding: "0 calc(1 * var(--u))" }} onClick={() => push(2)}>
                  2 dona qayta buyurtma
                </button>
              </div>
            ) : null}
          </div>
          <div>
            <h3 className="sec" style={{ marginTop: 0 }}>Asosiy xususiyatlar</h3>
            <table className="pd-table">
              <tbody>
                {product.specs.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {product.id === "optibond-solo-plus" ? (
              <img src="/img/shop/pdp-tooth.jpg" alt="" style={{ width: "100%", marginTop: "calc(.6 * var(--u))", borderRadius: "calc(.5 * var(--u))", objectFit: "cover", maxHeight: "calc(8 * var(--u))" }} />
            ) : null}
          </div>
        </div>

        <section className="pd-sim">
          <div className="hd">
            <h2>O‘xshash mahsulotlar</h2>
            <div className="pd-arrows">
              <button type="button" aria-label="Oldingi" onClick={() => setStart((value) => Math.max(0, value - 1))}>
                <ChevronLeft className="i" />
              </button>
              <button type="button" aria-label="Keyingi" onClick={() => setStart((value) => Math.min(Math.max(0, similar.length - 4), value + 1))}>
                <ChevronRight className="i" />
              </button>
            </div>
          </div>
          <div className="pd-row">
            {visible.map((item) => (
              <article className="dk-card" key={item.id}>
                <Link href={item.href} className="ph">
                  <img src={item.image} alt="" />
                  {item.discount ? <span className="dk-badge red">-{item.discount}%</span> : null}
                </Link>
                <div className="brand">{item.brand}</div>
                <h3>
                  <Link href={item.href}>{item.name}</Link>
                </h3>
                <StarsInline value={item.rating} reviews={item.reviews} />
                <div className="dk-price">
                  <strong>{som(item.price)}</strong>
                  {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                </div>
                <button
                  type="button"
                  className="dk-add"
                  onClick={() => shopAdd({ id: item.id, name: item.name, price: item.price, image: item.image, href: item.href })}
                >
                  <ShoppingCart className="i" />
                </button>
              </article>
            ))}
          </div>
        </section>
        {note ? <div className="dk-toast">{note}</div> : null}
      </article>
    </ShopShell>
  );
}

function StarsInline({ value, reviews }: { value: number; reviews: number }) {
  return (
    <div className="dk-meta">
      <Star className="i" /> {value.toFixed(1)} ({reviews})
    </div>
  );
}
