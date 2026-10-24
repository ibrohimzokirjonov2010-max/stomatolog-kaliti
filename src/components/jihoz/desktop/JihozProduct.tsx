"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Heart,
  Layers,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Smile,
  Star,
  Truck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopToggleFav, som, somPlain, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
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
import { RequestModal, brandMark, cardKind } from "./JihozCatalog";
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

const pointIcons = [Smile, Users, ShieldCheck, Layers, Building2];

const deliveryRows = [
  { Icon: Truck, place: "Toshkent shahri", price: "Bepul", days: "1 kun", free: true },
  { Icon: MapPin, place: "Toshkent viloyati", price: "350 000 so‘m", days: "2–3 kun" },
  { Icon: Building2, place: "Boshqa viloyatlar", price: "350 000 so‘m", days: "3–5 kun" },
];

export function JihozProduct({ slug }: { slug: string }) {
  const product = getDesktopJihoz(slug);
  if (!product) return null;
  return <View product={product} />;
}

function condLabel(product: DesktopJihoz) {
  return product.condition === "ishlatilgan" ? "Ishlatilgan" : product.condition === "korgazma" ? "Ko‘rgazmali" : "Yangi";
}

function warrantyText(months: number) {
  return months >= 12 && months % 12 === 0 ? `${months / 12} yil kafolat` : `${months} oy kafolat`;
}

function View({ product }: { product: DesktopJihoz }) {
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<TabId>("about");
  const [ask, setAsk] = useState(false);
  const [plan, setPlan] = useState(false);
  const [note, setNote] = useState("");
  const fav = favs.includes(product.slug);
  const gallery = product.gallery.length ? product.gallery : [product.image];
  const similar = similarJihoz(product.slug);
  const rich = product.slug === "fengdan-ql2028";
  const specs: [string, string][] = rich
    ? fengdanSpecs
    : [
        ["Brend", product.brand],
        ["Model", product.name],
        ["Turi", cardKind[product.cat]],
        ["Ishlab chiqarilgan yil", String(product.year)],
        ["Kafolat", `${product.warranty} oy`],
        ["Holati", condLabel(product)],
        ["Shahar", product.city],
      ];
  const kit = rich ? fengdanKit : [product.name, product.spec, "Foydalanish yo‘riqnomasi", "Kafolat taloni"];
  const warranty = rich ? fengdanWarranty : [warrantyText(product.warranty), product.official ? "Rasmiy distribyutor kafolati" : "Sotuvchi kafolati", "Original ehtiyot qismlar", "Texnik qo‘llab-quvvatlash"];
  const about = rich ? fengdanAbout : `${product.name} — ${cardKind[product.cat].toLowerCase()}. ${product.year}-yil, ${product.spec.toLowerCase()}.`;
  const points = rich ? fengdanPoints : [product.spec, warrantyText(product.warranty), product.install ? "O‘rnatish xizmati mavjud" : "Klinikaga yetkazib berish", product.leasing ? "Lizing / bo‘lib to‘lash" : "Bir martalik to‘lov"];
  const reviewCount = rich ? 48 : product.reviews;
  const sellerName = product.brand === "Fengdan" ? "Fengdan Uzbekistan" : `${product.brand} rasmiy do‘koni`;
  const crumbKind = product.cat === "ustanovka" ? "Stomatologik kreslo" : cardKind[product.cat];

  function add() {
    shopAdd({ id: `jihoz-${product.slug}`, name: product.name, variant: cardKind[product.cat], price: product.price, image: product.image, href: `/jihozlar/${product.slug}`, seller: sellerName, official: product.official }, qty);
  }

  return (
    <ShopShell searchPath="/jihozlar" cartCount={cartCount} placeholder="Jihoz, material, brend yoki kategoriya qidiring..." showCamera={false}>
      <div className="jxp" data-testid="jihoz-product">
        <nav className="jxp-crumbs" aria-label="Breadcrumb">
          <Link href="/marketplace">Do‘kon</Link><ChevronRight className="i" />
          <Link href="/jihozlar">Jihozlar</Link><ChevronRight className="i" />
          <Link href={`/jihozlar?cat=${product.cat}`}>{crumbKind}</Link><ChevronRight className="i" />
          <b>{product.name}</b>
        </nav>

        <div className="jxp-top">
          <div className="jxp-gal">
            <div className="jxp-thumbs">
              {gallery.slice(0, 5).map((src, index) => (
                <button key={src + index} type="button" className={photo === index ? "on" : ""} aria-label={`Rasm ${index + 1}`} aria-pressed={photo === index} onClick={() => setPhoto(index)}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
            <div className="jxp-stage"><img src={gallery[photo] ?? product.image} alt={product.name} /></div>
          </div>

          <section className="jxp-buy">
            <div className="jxp-pills">
              <span className="pill green">{condLabel(product)}</span>
              {product.official ? <span className="pill blue">Rasmiy distribyutor</span> : null}
              <span className="pill plain"><ShieldCheck className="i" /> {warrantyText(product.warranty)}</span>
            </div>
            <h1>{product.name}</h1>
            <div className="jxp-rate">
              <b>{product.brand}</b>
              {reviewCount > 0 ? (
                <>
                  <Star className="i star" />
                  <b>{product.rating.toFixed(1)}</b>
                  <span>({reviewCount} sharh)</span>
                </>
              ) : null}
              {product.sold > 0 ? <><span className="sep" /><Package className="i" /><span>{product.sold}+ ta sotilgan</span></> : null}
            </div>
            <div className="jxp-sum">{som(product.price)}</div>
            <div className="jxp-stock">
              <span className="ok"><CheckCircle2 className="i" /> Omborda bor</span>
              <span className="ship"><Truck className="i" /> Toshkent 1 kun, Viloyatlar 3–5 kun</span>
            </div>
            <button type="button" className={plan ? "jxp-plan open" : "jxp-plan"} aria-expanded={plan} onClick={() => setPlan((v) => !v)}>
              <span className="ic"><Wallet className="i" /></span>
              <span className="txt">
                <b>Bo‘lib to‘lash</b>
                <small>{product.months} oy × {somPlain(product.monthly)} so‘m/oy</small>
              </span>
              <ChevronRight className="i chev" />
            </button>
            {plan ? (
              <div className="jxp-plan-body">
                <p>Oylik to‘lov: <b>{somPlain(product.monthly)} so‘m</b> · muddat: <b>{product.months} oy</b>{product.leasing ? " · lizing mavjud" : ""}.</p>
                <p className="muted">Shartlar sotuvchi bilan yakuniy kelishiladi.</p>
              </div>
            ) : null}
            <div className="jxp-cta">
              <div className="jxp-qty">
                <button type="button" aria-label="Kamaytirish" disabled={qty <= 1} onClick={() => setQty((value) => Math.max(1, value - 1))}><Minus className="i" /></button>
                <b aria-live="polite">{qty}</b>
                <button type="button" aria-label="Oshirish" onClick={() => setQty((value) => Math.min(99, value + 1))}><Plus className="i" /></button>
              </div>
              <button type="button" className="jxp-add" data-testid="jihoz-add" onClick={add}><ShoppingCart className="i" /> Savatga qo‘shish</button>
              <button type="button" className={fav ? "jxp-wish on" : "jxp-wish"} aria-pressed={fav} aria-label={fav ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo‘shish"} onClick={() => shopToggleFav(product.slug)}><Heart className="i" /></button>
            </div>
            <button type="button" className="jxp-ask" onClick={() => setAsk(true)}><MessageCircle className="i" /> Konsultatsiya so‘rash</button>
          </section>

          <aside className="jxp-rail">
            <section className="jx-box jxp-seller">
              <h3>Sotuvchi</h3>
              <Link href={`/jihozlar?brand=${product.brandKey}`} className="who">
                {product.brand === "Fengdan" ? <img src="/img/jihoz/d-fengdan-logo.jpg" alt="" /> : <span className="logo">{(brandMark[product.brandKey] ?? product.brand).slice(0, 2)}</span>}
                <span className="txt">
                  <b>{sellerName} {product.official ? <BadgeCheck className="i badge" aria-label="Tasdiqlangan" /> : null}</b>
                  <small>{product.official ? "Rasmiy distribyutor" : "Sotuvchi"}</small>
                  <small className="r"><Star className="i star" /> <b>4.9</b> (128 sharh)</small>
                  <small className="r"><Package className="i" /> 500+ mahsulot</small>
                </span>
                <ChevronRight className="i chev" />
              </Link>
              <div className="acts">
                <Link href={`/jihozlar?brand=${product.brandKey}`} className="jx-ghost">Do‘konni ko‘rish</Link>
                <Link href="/jihozlar" className="jx-ghost">Barcha mahsulotlar <ArrowRight className="i" /></Link>
              </div>
            </section>

            <section className="jx-box jxp-service">
              <div className="hd">
                <span className="ic"><Wrench className="i" /></span>
                <div>
                  <h3>O‘rnatish va servis</h3>
                  <small>Sertifikatlangan usta tomonidan o‘rnatish</small>
                  <b className="price">{som(techProfile.price)}</b>
                </div>
              </div>
              <div className="tech">
                <img src={techProfile.image} alt="" />
                <div>
                  <b>{techProfile.name}</b>
                  <small><Star className="i star" /> <b>{techProfile.rating}</b> ({techProfile.reviews} sharh)</small>
                  <small><MapPin className="i" /> Toshkent</small>
                  <span className="chips">{techProfile.brands.map((brand) => <i key={brand}>{brand}</i>)}</span>
                </div>
              </div>
              <Link href="/ustalar" className="jx-ghost wide">Ustani tanlash <ArrowRight className="i" /></Link>
            </section>

            <section className="jx-box jxp-delivery">
              <div className="hd">
                <span className="ic"><Truck className="i" /></span>
                <h3>Yetkazib berish</h3>
              </div>
              {deliveryRows.map(({ Icon, place, price, days, free }) => (
                <div className="jxp-drow" key={place}>
                  <Icon className="i" />
                  <span>{place}</span>
                  <b className={free ? "free" : undefined}>{price}</b>
                  <em>{days}</em>
                </div>
              ))}
            </section>
          </aside>
        </div>

        <section className="jxp-info">
          <div className="jxp-tabs" role="tablist" aria-label="Mahsulot ma’lumotlari">
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)}>
                {item.label}{item.id === "reviews" ? ` (${reviewCount})` : ""}
              </button>
            ))}
          </div>

          {tab === "about" ? (
            <div className="jxp-four">
              <div>
                <h3>Mahsulot tavsifi</h3>
                <p className="jxp-text">{about}</p>
                <ul className="jxp-points">
                  {points.map((line, index) => {
                    const Icon = pointIcons[index % pointIcons.length];
                    return <li key={line}><Icon className="i" /> {line}</li>;
                  })}
                </ul>
              </div>
              <div>
                <h3>Texnik xususiyatlar</h3>
                <SpecTable rows={specs} />
              </div>
              <div>
                <h3>Komplekt</h3>
                <ul className="jxp-checks">{kit.map((line) => <li key={line}><CheckCircle2 className="i" /> {line}</li>)}</ul>
              </div>
              <WarrantyBox lines={warranty} />
            </div>
          ) : null}
          {tab === "specs" ? <div className="jxp-one"><SpecTable rows={specs} /></div> : null}
          {tab === "kit" ? <div className="jxp-one"><ul className="jxp-checks cols">{kit.map((line) => <li key={line}><CheckCircle2 className="i" /> {line}</li>)}</ul></div> : null}
          {tab === "warranty" ? <div className="jxp-one narrow"><WarrantyBox lines={warranty} /></div> : null}
          {tab === "install" ? (
            <div className="jxp-one">
              <p className="jxp-text">{product.install ? `O‘rnatish sertifikatlangan usta tomonidan, klinikangiz jadvaliga mos kunda. Narxi — ${som(techProfile.price)}.` : "Bu jihoz uchun o‘rnatish xizmati kiritilmagan. Usta tanlash uchun Ustalar bo‘limiga o‘ting."}</p>
              <Link href="/ustalar" className="jx-ghost inline">Ustalar bo‘limi <ArrowRight className="i" /></Link>
            </div>
          ) : null}
          {tab === "delivery" ? (
            <div className="jxp-one narrow">
              {deliveryRows.map(({ Icon, place, price, days, free }) => (
                <div className="jxp-drow" key={place}><Icon className="i" /><span>{place}</span><b className={free ? "free" : undefined}>{price}</b><em>{days}</em></div>
              ))}
            </div>
          ) : null}
          {tab === "reviews" ? (
            <div className="jxp-one">
              {jihozReviews.map((review) => (
                <div key={review.name} className="jxp-review">
                  <b>{review.name}</b>
                  <span className="stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={i < review.rating ? "i on" : "i"} />)}</span>
                  <small>{review.date}</small>
                  <p>{review.text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {similar.length ? (
          <section className="jxp-similar">
            <div className="hd">
              <h2>O‘xshash mahsulotlar</h2>
              <Link href={`/jihozlar?cat=${product.cat}`}>Barchasini ko‘rish <ArrowRight className="i" /></Link>
            </div>
            <div className="jxp-sim-row">
              {similar.map((item) => {
                const liked = favs.includes(item.slug);
                return (
                  <article className="jxp-sim" key={item.slug}>
                    <Link href={`/jihozlar/${item.slug}`} className="ph" aria-label={item.name}><img src={item.image} alt="" /></Link>
                    <button type="button" className={liked ? "jx-heart sm on" : "jx-heart sm"} aria-pressed={liked} aria-label="Sevimlilarga qo‘shish" onClick={() => shopToggleFav(item.slug)}><Heart className="i" /></button>
                    <div className="txt">
                      <b>{item.brand}</b>
                      <Link href={`/jihozlar/${item.slug}`}>{item.name.replace(new RegExp(`^${item.brand}\\s+`), "")}</Link>
                      {item.reviews > 0 ? <small><Star className="i star" /> {item.rating.toFixed(1)} ({item.reviews})</small> : null}
                      <strong>{som(item.price)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {ask ? <RequestModal title="Konsultatsiya so‘rash" subject={product.name} onClose={() => setAsk(false)} onSent={setNote} /> : null}
        {note ? <p className="jx-toast" role="status" onAnimationEnd={() => setNote("")}>{note}</p> : null}
      </div>
    </ShopShell>
  );
}

function WarrantyBox({ lines }: { lines: string[] }) {
  return (
    <div className="jxp-warranty">
      <h3><ShieldCheck className="i big" /> Kafolat va servis</h3>
      <ul>{lines.map((line) => <li key={line}><ShieldCheck className="i" /> {line}</li>)}</ul>
    </div>
  );
}

function SpecTable({ rows }: { rows: [string, string][] }) {
  return (
    <table className="jxp-table">
      <tbody>{rows.map(([key, value]) => <tr key={key}><td>{key}</td><td>{value}</td></tr>)}</tbody>
    </table>
  );
}

