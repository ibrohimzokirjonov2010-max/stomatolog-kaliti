"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState } from "react";
import Link from "next/link";
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Star, Truck } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopToggleFav, som, somPlain, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  catLabel,
  fengdanAbout,
  fengdanKit,
  fengdanPoints,
  fengdanSpecs,
  fengdanWarranty,
  getDesktopJihoz,
  jihozReviews,
  similarJihoz,
  techProfile,
  type DesktopJihoz,
} from "@/data/desktop-jihozlar";
import "./jihoz.css";

const tabs = [
  { id: "about", label: "Tavsif" },
  { id: "specs", label: "Texnik xususiyatlar" },
  { id: "kit", label: "Komplekt" },
  { id: "warranty", label: "Kafolat va servis" },
  { id: "install", label: "O‘rnatish" },
  { id: "delivery", label: "Yetkazib berish" },
  { id: "reviews", label: "Sharhlar" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function JihozProduct({ slug }: { slug: string }) {
  const product = getDesktopJihoz(slug);
  if (!product) return null;
  return <View product={product} />;
}

function View({ product }: { product: DesktopJihoz }) {
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<TabId>("about");
  const [note, setNote] = useState("");
  const [ask, setAsk] = useState(false);
  const [tech, setTech] = useState(false);
  const fav = favs.includes(product.slug);
  const gallery = product.gallery.length ? product.gallery : [product.image];
  const similar = similarJihoz(product.slug);
  const rich = product.slug === "fengdan-ql2028";
  const specs = rich ? fengdanSpecs : [
    ["Brend", product.brand],
    ["Model", product.name],
    ["Yil", String(product.year)],
    ["Kafolat", `${product.warranty} oy`],
    ["Holati", product.condition === "yangi" ? "Yangi" : product.condition === "ishlatilgan" ? "Ishlatilgan" : "Ko‘rgazmali"],
    ["Shahar", product.city],
  ] as [string, string][];
  const kit = rich ? fengdanKit : [product.spec, "O‘rnatish yo‘riqnomasi", "Kafolat taloni"];
  const warranty = rich ? fengdanWarranty : [`${product.warranty / 12 >= 1 ? `${product.warranty / 12} yil` : `${product.warranty} oy`} kafolat`, "Servis markazi", "Original ehtiyot qismlar"];
  const reviewCount = rich ? 48 : product.reviews;

  function line() {
    return { id: `jihoz-${product.slug}`, name: product.name, price: product.price, image: product.image, href: `/jihozlar/${product.slug}` };
  }

  return (
    <ShopShell searchPath="/jihozlar" cartCount={cartCount} placeholder="Jihoz, material, brend yoki kategoriya qidiring..." showCamera={false}>
      <div className="jz-page">
        <div className="jz-crumbs">
          <Link href="/marketplace">Do‘kon</Link><span>›</span>
          <Link href="/jihozlar">Jihozlar</Link><span>›</span>
          <span>{catLabel(product.cat)}</span><span>›</span>
          <b>{product.name}</b>
        </div>
        <div className="jz-pdp">
          <div className="jz-gal">
            <div className="jz-thumbs">
              {gallery.map((src, index) => (
                <button key={src + index} type="button" className={photo === index ? "on" : ""} onClick={() => setPhoto(index)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
            <div className="jz-stage"><img src={gallery[photo] ?? product.image} alt="" /></div>
          </div>
          <section className="jz-buy">
            <div className="jz-pills">
              <span className="jz-pill">{product.condition === "ishlatilgan" ? "Ishlatilgan" : product.condition === "korgazma" ? "Ko‘rgazmali" : "Yangi"}</span>
              {product.official ? <span className="jz-pill blue">Rasmiy distribyutor</span> : null}
              <span className="jz-pill">{product.warranty >= 24 ? `${product.warranty / 12} yil kafolat` : `${product.warranty} oy kafolat`}</span>
            </div>
            <h1>{product.name}</h1>
            <div className="jz-meta" style={{ display: "flex", gap: "calc(.35 * var(--u))", alignItems: "center" }}>
              <b>{product.brand}</b>
              <Star className="i" style={{ color: "#f5b400", fill: "#f5b400" }} />
              <b>{product.rating.toFixed(1)}</b>
              <span>({reviewCount} sharh)</span>
              <span>{product.sold}+ ta sotilgan</span>
            </div>
            <div className="sum">{som(product.price)}</div>
            <div className="jz-stock">
              <span><b>Omborda bor</b></span>
              <span><Truck className="i" /> Toshkent 1 kun, Viloyatlar 3–5 kun</span>
            </div>
            <div className="jz-inst">
              <span>Bo‘lib to‘lash</span>
              <b>{product.months} oy × {somPlain(product.monthly)} so‘m/oy</b>
            </div>
            <div className="jz-cta">
              <div className="jz-qty">
                <button type="button" aria-label="Kamaytirish" onClick={() => setQty((value) => Math.max(1, value - 1))}><Minus className="i" /></button>
                <b>{qty}</b>
                <button type="button" aria-label="Oshirish" onClick={() => setQty((value) => Math.min(99, value + 1))}><Plus className="i" /></button>
              </div>
              <button type="button" className="jz-add" onClick={() => { shopAdd(line(), qty); setNote("Savatga qo‘shildi"); }}><ShoppingCart className="i" /> Savatga qo‘shish</button>
              <button type="button" className={fav ? "jz-wish on" : "jz-wish"} aria-label="Sevimli" onClick={() => shopToggleFav(product.slug)}><Heart className="i" /></button>
            </div>
            <button type="button" className="jz-now" onClick={() => setAsk(true)}>Konsultatsiya so‘rash</button>
            {note ? <p className="jz-note">{note}</p> : null}
          </section>
          <aside className="jz-rail">
            <section className="jz-box">
              <span className="jz-brand">Sotuvchi</span>
              <b style={{ display: "block", fontSize: "calc(.9 * var(--u))" }}>{product.brand} {product.brand === "Fengdan" ? "Uzbekistan" : ""}</b>
              <p className="jz-spec">Rasmiy distribyutor</p>
              <div className="jz-meta"><Star className="i" style={{ color: "#f5b400", fill: "#f5b400" }} /> 4.9 <span>(128 sharh)</span></div>
              <p className="jz-spec">500+ mahsulot</p>
              <div className="jz-acts">
                <Link className="jz-ghost" href="/jihozlar" style={{ display: "grid", placeItems: "center", textDecoration: "none", flex: 1 }}>Do‘konni ko‘rish</Link>
                <Link className="jz-add" href="/jihozlar" style={{ textDecoration: "none", flex: 1 }}>Barcha mahsulotlar</Link>
              </div>
            </section>
            <section className="jz-box">
              <h3>O‘rnatish va servis</h3>
              <p className="jz-spec">Sertifikatlangan usta tomonidan o‘rnatish</p>
              <strong className="jz-price">{som(techProfile.price)}</strong>
              <div className="jz-cmp-row">
                <img src={techProfile.image} alt="" style={{ objectFit: "cover" }} />
                <div>
                  <b>{techProfile.name}</b>
                  <span>{techProfile.role} · {techProfile.rating} ({techProfile.reviews} sharh)</span>
                  <span>{techProfile.brands.join(" · ")}</span>
                </div>
              </div>
              <button type="button" className="jz-ghost" style={{ width: "100%" }} onClick={() => setTech(true)}>Ustani tanlash</button>
            </section>
            <section className="jz-box">
              <h3><Truck className="i" /> Yetkazib berish</h3>
              <div className="jz-cmp-row"><span>Toshkent shahri</span><b>Bepul</b><span>1 kun</span></div>
              <div className="jz-cmp-row"><span>Toshkent viloyati</span><b>350 000 so‘m</b><span>2–3 kun</span></div>
              <div className="jz-cmp-row"><span>Boshqa viloyatlar</span><b>350 000 so‘m</b><span>3–5 kun</span></div>
            </section>
          </aside>
        </div>

        <div className="jz-tabs">
          {tabs.map((item) => (
            <button key={item.id} type="button" className={tab === item.id ? "jz-tab on" : "jz-tab"} onClick={() => setTab(item.id)}>
              {item.label}{item.id === "reviews" ? ` (${reviewCount})` : ""}
            </button>
          ))}
        </div>

        {tab === "about" ? (
          <div className="jz-sub">
            <section className="jz-box">
              <h3>Mahsulot tavsifi</h3>
              <p className="jz-spec">{rich ? fengdanAbout : `${product.name} — ${product.spec}. ${product.year}-yil, ${catLabel(product.cat)}.`}</p>
              <ul className="jz-points">{(rich ? fengdanPoints : [product.spec, "Kafolat va servis", "O‘rnatish maslahati"]).map((line) => <li key={line}><Check className="i" /> {line}</li>)}</ul>
            </section>
            <section className="jz-box"><h3>Texnik xususiyatlar</h3><SpecTable rows={specs} /></section>
            <section className="jz-box"><h3>Komplekt</h3><ul className="jz-points">{kit.map((line) => <li key={line}><Check className="i" /> {line}</li>)}</ul></section>
            <section className="jz-box"><h3><ShieldCheck className="i" /> Kafolat va servis</h3><ul className="jz-points">{warranty.map((line) => <li key={line}><Check className="i" /> {line}</li>)}</ul></section>
          </div>
        ) : null}
        {tab === "specs" ? <section className="jz-box"><SpecTable rows={specs} /></section> : null}
        {tab === "kit" ? <section className="jz-box"><ul className="jz-points">{kit.map((line) => <li key={line}><Check className="i" /> {line}</li>)}</ul></section> : null}
        {tab === "warranty" ? <section className="jz-box"><ul className="jz-points">{warranty.map((line) => <li key={line}><Check className="i" /> {line}</li>)}</ul></section> : null}
        {tab === "install" ? <section className="jz-box"><p>O‘rnatish sertifikatlangan usta tomonidan, klinikangiz jadvaliga mos kuni. Narxi {som(techProfile.price)}.</p></section> : null}
        {tab === "delivery" ? <section className="jz-box"><p>Toshkent shahri — bepul, 1 kun. Toshkent viloyati va boshqa viloyatlar — 350 000 so‘m, 2–5 kun.</p></section> : null}
        {tab === "reviews" ? (
          <section className="jz-box">
            {jihozReviews.map((review) => (
              <div key={review.name} className="jz-cmp-row"><div><b>{review.name}</b><span>{review.rating}.0 · {review.date}</span><span>{review.text}</span></div></div>
            ))}
          </section>
        ) : null}

        <section>
          <h3 style={{ display: "flex", justifyContent: "space-between" }}>O‘xshash mahsulotlar <Link className="jz-link" href="/jihozlar">Barchasini ko‘rish</Link></h3>
          <div className="jz-grid jz-sim">
            {similar.map((item) => (
              <article className="jz-card" key={item.slug}>
                <div className="ph"><img src={item.image} alt="" /></div>
                <div className="bd">
                  <span className="jz-brand">{item.brand}</span>
                  <h3><Link href={`/jihozlar/${item.slug}`}>{item.name}</Link></h3>
                  <span className="jz-meta"><Star className="i" style={{ color: "#f5b400", fill: "#f5b400" }} /> {item.rating.toFixed(1)} ({item.reviews})</span>
                  <strong className="jz-price">{som(item.price)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {ask ? (
        <div className="jz-modal" onClick={() => setAsk(false)}>
          <div className="jz-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Konsultatsiya so‘rash</h3>
            <label>Ism<input /></label>
            <label>Telefon<input /></label>
            <div className="acts">
              <button type="button" className="jz-add" onClick={() => { setAsk(false); setNote("Konsultatsiya so‘rovi qabul qilindi."); }}>Yuborish</button>
              <button type="button" className="jz-ghost" onClick={() => setAsk(false)}>Bekor qilish</button>
            </div>
          </div>
        </div>
      ) : null}
      {tech ? (
        <div className="jz-modal" onClick={() => setTech(false)}>
          <div className="jz-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>{techProfile.name}</h3>
            <p>{techProfile.role}. {techProfile.brands.join(", ")} jihozlarini o‘rnatadi.</p>
            <div className="acts"><button type="button" className="jz-add" onClick={() => { setTech(false); setNote("Usta tanlandi. Mutaxassis bog‘lanadi."); }}>Tanlash</button></div>
          </div>
        </div>
      ) : null}
    </ShopShell>
  );
}

function SpecTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="jz-table">
      <tbody>{rows.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td></tr>)}</tbody>
    </table>
  );
}
