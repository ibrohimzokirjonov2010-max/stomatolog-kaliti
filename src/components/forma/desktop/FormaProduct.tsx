"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState } from "react";
import Link from "next/link";
import { Check, Heart, Minus, Plus, ShieldCheck, ShoppingCart, Star, Truck, Wallet } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopToggleFav, som, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  formaAdvantages,
  formaReviews,
  getDesktopForma,
  similarForma,
  type DesktopForma,
} from "@/data/desktop-forma";
import { SizeTable } from "./FormaCatalog";
import "./forma.css";

const tabs = [
  { id: "about", label: "Tavsif" },
  { id: "specs", label: "Xususiyatlar" },
  { id: "size", label: "O‘lcham jadvali" },
  { id: "reviews", label: "Sharhlar" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function FormaProduct({ slug }: { slug: string }) {
  const product = getDesktopForma(slug);
  if (!product) return null;
  return <FormaProductView product={product} />;
}

function FormaProductView({ product }: { product: DesktopForma }) {
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const [photo, setPhoto] = useState(0);
  const [color, setColor] = useState(product.colors[0]?.id ?? "");
  const [size, setSize] = useState(product.sizes.includes("M") ? "M" : product.sizes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<TabId>("about");
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const swatch = product.colors.find((item) => item.id === color) ?? product.colors[0];
  const similar = similarForma(product.slug);
  const fav = favs.includes(product.slug);
  const gallery = product.gallery.length ? product.gallery : [product.image];

  function line() {
    return {
      id: `forma-${product.slug}-${swatch?.id ?? "one"}-${size || "os"}`,
      name: `${product.name}${size ? ` · ${size}` : ""}${swatch ? ` · ${swatch.label}` : ""}`,
      price: product.price,
      image: product.image,
      href: `/forma/${product.slug}`,
    };
  }

  function add() {
    shopAdd(line(), qty);
    setNote("Savatga qo‘shildi");
  }

  function buyNow() {
    shopAdd(line(), qty);
    setNote("Buyurtma qabul qilindi. To‘lovni savat orqali yakunlaysiz.");
  }

  return (
    <ShopShell searchPath="/forma" cartCount={cartCount} placeholder="Mahsulot, brend yoki kategoriya qidiring..." showCamera={false}>
      <div className="fm-page">
        <div className="fm-crumbs">
          <Link href="/marketplace">Do‘kon</Link>
          <span>›</span>
          <Link href="/forma">Forma</Link>
          <span>›</span>
          <b>{product.name}</b>
        </div>

        <div className="fm-pdp">
          <div className="fm-gal">
            <div className="fm-thumbs">
              {gallery.map((src, index) => (
                <button key={src + index} type="button" className={photo === index ? "on" : ""} onClick={() => setPhoto(index)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
            <div className="fm-stage">
              <img src={gallery[photo] ?? product.image} alt="" />
            </div>
          </div>

          <section className="fm-box fm-buy">
            <h1>{product.name}</h1>
            <div className="fm-rate" style={{ marginTop: "calc(.3 * var(--u))" }}>
              <Star className="i" /> {product.rating.toFixed(1)} <span>({product.reviews} sharh)</span>
              {product.sold ? <em className="fm-sold">{product.sold} ta sotilgan</em> : null}
            </div>
            <div className="fm-price" style={{ marginTop: "calc(.35 * var(--u))" }}>
              <strong>{som(product.price)}</strong>
              {product.oldPrice ? <s>{som(product.oldPrice)}</s> : null}
              {product.off ? <em className="fm-off">−{product.off}%</em> : null}
            </div>
            {swatch ? (
              <div className="fm-field">
                <span>Rang: {swatch.label}</span>
                <div className="fm-dots">
                  {product.colors.map((item) => (
                    <button key={item.id} type="button" className={color === item.id ? "fm-dot on" : "fm-dot"} style={{ background: item.hex }} aria-label={item.label} onClick={() => setColor(item.id)} />
                  ))}
                </div>
              </div>
            ) : null}
            {product.sizes.length ? (
              <div className="fm-field">
                <div className="rowish">
                  <span>O‘lcham: {size}</span>
                  <button type="button" className="fm-link" onClick={() => setTab("size")}>O‘lchamlar jadvali</button>
                </div>
                <div className="fm-sizes">
                  {product.sizes.map((item) => (
                    <button key={item} type="button" className={size === item ? "fm-sz on" : "fm-sz"} onClick={() => setSize(item)}>{item}</button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="fm-cta">
              <div className="fm-qty">
                <button type="button" aria-label="Kamaytirish" onClick={() => setQty((value) => Math.max(1, value - 1))}><Minus className="i" /></button>
                <b>{qty}</b>
                <button type="button" aria-label="Oshirish" onClick={() => setQty((value) => Math.min(99, value + 1))}><Plus className="i" /></button>
              </div>
              <button type="button" className="fm-add" onClick={add}><ShoppingCart className="i" /> Savatga qo‘shish</button>
              <button type="button" className={fav ? "fm-wish on" : "fm-wish"} aria-label="Sevimli" onClick={() => shopToggleFav(product.slug)}><Heart className="i" /></button>
            </div>
            <button type="button" className="fm-now" onClick={buyNow}>Hozir sotib olish</button>
            {note ? <p className="fm-note">{note}</p> : null}
            <div className="fm-guar">
              <div>
                <b><ShieldCheck className="i" /> Sifat kafolati</b>
                <small>30 kun ichida qaytarish</small>
              </div>
              <div>
                <b><Truck className="i" /> Tez yetkazib berish</b>
                <small>Toshkent 1 kun · Viloyatlar 2–3 kun</small>
              </div>
              <div>
                <b><Wallet className="i" /> Xavfsiz to‘lov</b>
                <small>Click, Payme, Uzcard</small>
              </div>
            </div>
          </section>

          <aside className="fm-rail">
            <section className="fm-box fm-seller">
              <span className="fm-brand">Sotuvchi</span>
              <b className="lg">{product.brand}</b>
              <p>Tibbiy forma va aksessuarlar</p>
              <div className="fm-rate"><Star className="i" /> 4.9 <span>(320 sharh)</span></div>
              <p>2 500+ mahsulot</p>
              <Link className="fm-add" href="/forma" style={{ textDecoration: "none" }}>Barcha mahsulotlar</Link>
            </section>
            <section className="fm-box">
              <h3><Truck className="i" /> Yetkazib berish</h3>
              <div className="fm-ship"><span>Toshkent shahri</span><em>1 kun</em></div>
              <div className="fm-ship"><span>Toshkent viloyati</span><em>2–3 kun</em></div>
              <div className="fm-ship"><span>Boshqa viloyatlar</span><em>2–3 kun</em></div>
              <button type="button" className="fm-link" onClick={() => setNote("Yetkazib berish: Toshkentda 1 kun, viloyatlarda 2–3 kun. Kuryer qo‘ng‘iroq qiladi.")}>Yetkazib berish haqida batafsil</button>
            </section>
            <section className="fm-box fm-ask">
              <b>Savollaringiz bormi?</b>
              <p>Mahsulot haqida mutaxassisdan maslahat oling.</p>
              <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Savolingiz..." aria-label="Savol" />
              <button
                type="button"
                className="fm-add"
                onClick={() => {
                  if (!question.trim()) return;
                  setAsked("Savolingiz qabul qilindi. Mutaxassis tez orada javob yozadi.");
                  setQuestion("");
                }}
              >
                Savol berish
              </button>
              {asked ? <p className="fm-note">{asked}</p> : null}
            </section>
          </aside>
        </div>

        <div className="fm-sub">
          <section className="fm-box">
            <div className="fm-subtabs">
              {tabs.map((item) => (
                <button key={item.id} type="button" className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)}>
                  {item.id === "reviews" ? `Sharhlar (${product.reviews})` : item.label}
                </button>
              ))}
            </div>
            {tab === "about" ? <About product={product} /> : null}
            {tab === "specs" ? <Specs product={product} /> : null}
            {tab === "size" ? (
              <div className="fm-diagram">
                <SizeTable active={size} />
                <SizeDiagram />
              </div>
            ) : null}
            {tab === "reviews" ? (
              <div>
                {formaReviews.map((review) => (
                  <div className="fm-ship" key={review.name} style={{ display: "block" }}>
                    <b>{review.name}</b>
                    <div className="fm-rate"><Star className="i" /> {review.stars}</div>
                    <p className="fm-blurb">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <section className="fm-sim">
          <h2>O‘xshash mahsulotlar</h2>
          <div className="fm-grid">
            {similar.map((item) => (
              <article className="fm-card" key={item.slug}>
                <Link href={`/forma/${item.slug}`} className="ph">
                  <img src={item.image} alt="" />
                </Link>
                <div className="bd">
                  <span className="fm-brand">{item.brand}</span>
                  <h3><Link href={`/forma/${item.slug}`}>{item.name}</Link></h3>
                  <div className="fm-rate"><Star className="i" /> {item.rating.toFixed(1)} <span>({item.reviews})</span></div>
                  <div className="fm-price"><strong>{som(item.price)}</strong></div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </ShopShell>
  );
}

function About({ product }: { product: DesktopForma }) {
  return (
    <div className="fm-desc">
      <div>
        <h3>Mahsulot tavsifi</h3>
        <p>
          Stomatologlar uchun zamonaviy va qulay {product.name}. Elastik mato harakat erkinligini ta’minlaydi, uzoq ish kunida ham qulaylik beradi. Klinika va shifoxonalarda foydalanish uchun ideal tanlov.
        </p>
        <ul className="fm-pros">
          {formaAdvantages.map((line) => (
            <li key={line}><Check className="i" /> {line}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Mato tarkibi</h3>
        <div className="fm-fabric">
          <img src="/img/forma/fabric.jpg" alt="" />
          <ul>
            <li>72% Polyester</li>
            <li>21% Viskoza</li>
            <li>7% Spandeks</li>
          </ul>
        </div>
      </div>
      <div>
        <h3>O‘lcham jadvali (sm)</h3>
        <div className="fm-diagram">
          <SizeDiagram />
          <p style={{ margin: 0 }}>
            A — ko‘krak, B — bel, C — bo‘y. O‘lchamlarni tanada, yengil kiyim ustidan oling.
          </p>
        </div>
      </div>
    </div>
  );
}

function Specs({ product }: { product: DesktopForma }) {
  const rows = [
    ["Brend", product.brand],
    ["Toifa", product.cat],
    ["Jins", product.gender === "erkak" ? "Erkak" : product.gender === "ayol" ? "Ayol" : "Uniseks"],
    ["Mato", product.material === "paxta" ? "Paxta - poliester" : product.material === "stretch" ? "Stretch" : product.material === "anti" ? "Antibakterial" : "Premium"],
    ["O‘lchamlar", product.sizes.join(", ") || "Yagona"],
    ["Yuvish", "60°C gacha"],
  ];
  return (
    <table className="fm-table">
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

function SizeDiagram() {
  return (
    <svg className="fm-shirt" viewBox="0 0 120 150" aria-label="O‘lcham sxemasi">
      <path d="M40 18 h40 l18 16 v28 h-12 v70 H34 V62 H22 V34 Z" fill="#e7f6f8" stroke="#1497a8" strokeWidth="2" />
      <path d="M48 18 q12 10 24 0" fill="none" stroke="#1497a8" strokeWidth="2" />
      <text x="8" y="78" fontSize="11" fill="#1497a8" fontWeight="700">A</text>
      <text x="54" y="96" fontSize="11" fill="#1497a8" fontWeight="700">B</text>
      <text x="100" y="40" fontSize="11" fill="#1497a8" fontWeight="700">C</text>
    </svg>
  );
}
