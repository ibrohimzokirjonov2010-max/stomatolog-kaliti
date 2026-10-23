"use client";
/* eslint-disable @next/next/no-img-element -- seller uploads are contain-fitted */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Box,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Hash,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { catalogCardFrom, catalogHref, fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatDotDate } from "@/lib/format";
import { marketGroupId, marketGroupLabel } from "@/lib/mp-groups";
import { ShopShell } from "./ShopShell";
import { shopToggleFav, som, useShopFavs, useShopLineCount } from "./shop-cart";
import "./marketplace-faithful.css";

const CATEGORY_LABEL: Record<string, string> = {
  materiallar: "Materiallar",
  implantlar: "Implantlar",
  asboblar: "Asboblar",
  jihozlar: "Jihozlar",
  laboratoriya: "Laboratoriya",
  forma: "Forma",
};

function text(attrs: Record<string, unknown>, key: string) {
  const value = attrs[key];
  return typeof value === "string" ? value.trim() : "";
}

function benefitsOf(attrs: Record<string, unknown>) {
  const raw = attrs.benefits;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 6);
}

function fileSize(size?: number) {
  if (!size || size <= 0) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function conditionLabel(raw: string) {
  if (raw === "yangi") return "Yangi";
  if (raw === "ishlatilgan") return "Ishlatilgan";
  if (raw === "ochilgan") return "Ochilgan";
  return raw;
}

export function MarketplacePdp({ id }: { id: string }) {
  const router = useRouter();
  const { add } = useCart();
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const reviews = useProductReviews(id);
  const [card, setCard] = useState<CatalogCard | null | undefined>(undefined);
  const [related, setRelated] = useState<CatalogCard[]>([]);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("");
  const [error, setError] = useState("");
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

  useEffect(() => {
    if (!light) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setLight(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [light]);

  const gallery = useMemo(() => (card ? [card.image, ...card.images].filter((src, index, all) => src && all.indexOf(src) === index) : []), [card]);

  if (card === undefined || card === null) {
    return (
      <ShopShell className="mp-shell" searchPath="/marketplace" cartCount={cartCount}>
        <div className="mpx-empty">
          <b>{card === undefined ? "Yuklanmoqda..." : "Mahsulot topilmadi"}</b>
          {card === null ? <p><Link href="/marketplace">Marketplace</Link></p> : null}
        </div>
      </ShopShell>
    );
  }

  const product = card;
  const attrs = product.attrs;
  const short = text(attrs, "shortDescription");
  const typeLine = [text(attrs, "type"), text(attrs, "volume")].filter(Boolean).join(" · ") || product.subcategory;
  const official = attrs.official === true;
  const condition = text(attrs, "condition");
  const expiry = text(attrs, "expiryDate");
  const lot = text(attrs, "lot");
  const city = text(attrs, "city") || product.shopCity;
  const delivery = attrs.freeDelivery === true ? "Bepul" : Number(attrs.deliveryPrice) > 0 ? som(Number(attrs.deliveryPrice)) : product.delivery.trim();
  const docs = Array.isArray(attrs.docs) ? (attrs.docs as { url?: string; name?: string; size?: number }[]).filter((doc) => doc?.url) : [];
  const benefits = benefitsOf(attrs);
  const clinical = text(attrs, "clinicalImage");
  const usage = text(attrs, "usage");
  const stock = product.stockQty;
  const shot = gallery[photo] || gallery[0] || "";
  const fav = favs.includes(product.id);
  const saving = product.oldPrice && product.oldPrice > product.price ? product.oldPrice - product.price : 0;
  const group = marketGroupId(product);
  const groupLabel = marketGroupLabel(group);
  const reviewCount = reviews.count || (product.reviews > 0 ? product.reviews : 0);
  const reviewAvg = reviews.avg ?? (product.reviews > 0 ? product.rating : 0);
  const similar = related.filter((item) => item.category === product.category || marketGroupId(item) === group).slice(0, 4);
  const sameShop = related.filter((item) => item.shopId && item.shopId === product.shopId).length;
  const shopCount = product.shopProducts || (sameShop ? sameShop + 1 : 0);

  const facts = [
    condition ? { icon: Box, label: "Holati", value: conditionLabel(condition) } : null,
    expiry ? { icon: CalendarClock, label: "Yaroqlilik muddati", value: formatDotDate(expiry) } : null,
    lot ? { icon: Hash, label: "Lot raqami", value: lot } : null,
    { icon: Box, label: "Miqdor", value: stock > 0 ? `Omborda ${stock} ta` : "Tugagan", tone: stock > 0 ? "ok" : "bad" },
    city ? { icon: MapPin, label: "Joylashuv", value: city } : null,
    delivery ? { icon: Truck, label: "Yetkazib berish", value: delivery } : null,
  ].filter((item): item is { icon: typeof Box; label: string; value: string; tone?: string } => Boolean(item));

  const specs = [
    ["Brend", product.brand && product.brand !== "Brend" ? product.brand : ""],
    ["Mahsulot turi", text(attrs, "type")],
    ["Hajm", text(attrs, "volume")],
    ["Qadoqda", text(attrs, "packCount")],
    ["Rang", text(attrs, "color")],
    ["Ishlab chiqaruvchi", text(attrs, "manufacturer")],
    ["Model", text(attrs, "model")],
    ["Qo‘llanish", usage],
    ["Qotish", text(attrs, "curing")],
    ["Saqlash", text(attrs, "storage")],
    ["Yaroqlilik muddati", text(attrs, "shelfLife") || (expiry ? formatDotDate(expiry) : "")],
    ["Lot raqami", lot],
    ["SKU", product.sku],
  ].filter((row) => row[1]);

  const tabs = [
    product.description || short || benefits.length || specs.length ? "Tavsif" : "",
    usage ? "Klinik qo‘llanish" : "",
    specs.length ? "Texnik xususiyatlar" : "",
    docs.length ? "Sertifikat" : "",
    reviewCount > 0 ? `Sharhlar (${reviewCount})` : "",
    delivery ? "Yetkazib berish" : "",
    "Qayta buyurtma",
  ].filter(Boolean);
  const active = tabs.includes(tab) ? tab : tabs[0];

  function addLine(checkout = false) {
    if (stock < 1) return;
    setError("");
    add(product.id, productFromCatalog(product), qty);
    if (checkout) router.push("/savat/rasmiylashtirish");
  }

  return (
    <ShopShell className="mp-shell" searchPath="/marketplace" cartCount={cartCount}>
      <article className="mpx" data-testid="product-desktop">
        <nav className="mpx-crumbs">
          <Link href="/marketplace">Marketplace</Link>
          <ChevronRight className="i" />
          <Link href={`/marketplace?cat=${product.category}`}>{CATEGORY_LABEL[product.category] ?? "Mahsulotlar"}</Link>
          {groupLabel && groupLabel !== CATEGORY_LABEL[product.category] ? (
            <>
              <ChevronRight className="i" />
              <Link href={`/marketplace?cat=${group}`}>{groupLabel}</Link>
            </>
          ) : null}
          <ChevronRight className="i" />
          <b>{product.name}</b>
        </nav>

        <div className="mpx-top">
          <section>
            <div className={gallery.length > 1 ? "mpx-stage" : "mpx-stage solo"} onClick={() => shot && setLight(true)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setLight(true); }}>
              {shot ? <img src={shot} alt={product.name} /> : <span className="mpx-spec">Rasm yo‘q</span>}
              {gallery.length > 1 ? (
                <>
                  <button type="button" className="mpx-nav prev" aria-label="Oldingi rasm" onClick={(event) => { event.stopPropagation(); setPhoto((photo - 1 + gallery.length) % gallery.length); }}><ChevronLeft className="i" /></button>
                  <button type="button" className="mpx-nav next" aria-label="Keyingi rasm" onClick={(event) => { event.stopPropagation(); setPhoto((photo + 1) % gallery.length); }}><ChevronRight className="i" /></button>
                </>
              ) : null}
            </div>
            {gallery.length > 1 ? (
              <div className="mpx-thumbs">
                {gallery.slice(0, 5).map((src, index) => (
                  <button key={`${index}-${src}`} type="button" className={index === photo ? "on" : undefined} aria-label={`Rasm ${index + 1}`} onClick={() => setPhoto(index)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="mpx-info">
            <p className="mpx-kicker">
              {product.brand && product.brand !== "Brend" ? product.brand : null}
              {official ? <span className="mpx-official"><BadgeCheck className="i" /> Rasmiy distribyutor</span> : null}
            </p>
            <h1>{product.name}</h1>
            {typeLine ? <p className="mpx-type">{typeLine}</p> : null}
            {reviewCount > 0 || product.soldCount > 0 ? (
              <p className="mpx-meta">
                {reviewCount > 0 ? <><Star className="i" /> <b>{reviewAvg.toFixed(1)}</b> ({reviewCount} ta sharh)</> : null}
                {reviewCount > 0 && product.soldCount > 0 ? <span>|</span> : null}
                {product.soldCount > 0 ? <span>{product.soldCount.toLocaleString("ru-RU")} ta sotilgan</span> : null}
              </p>
            ) : null}
            {short || product.description ? <p className="mpx-blurb">{short || product.description}</p> : null}
            {facts.length ? (
              <div className="mpx-facts">
                {facts.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div className="mpx-fact" key={fact.label}>
                      <Icon className="i" />
                      <span>
                        <small>{fact.label}</small>
                        <b className={fact.tone}>{fact.value}</b>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
            {docs.length ? (
              <div className="mpx-docs">
                {docs.slice(0, 2).map((doc) => (
                  <a key={doc.url} className="mpx-doc" href={doc.url} target="_blank" rel="noreferrer">
                    <FileText className="i" />
                    <span>
                      <b>{doc.name || "Hujjat (PDF)"}</b>
                      {fileSize(doc.size) ? <small>{fileSize(doc.size)}</small> : null}
                    </span>
                    <em>Yuklash</em>
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <aside className="mpx-side">
            <section className="mpx-buy">
              {product.discount ? <span className="mpx-off">-{product.discount}%</span> : null}
              <button type="button" className={fav ? "mpx-fav on" : "mpx-fav"} aria-label="Sevimlilarga" aria-pressed={fav} onClick={() => shopToggleFav(product.id)}>
                <Heart className="i" fill={fav ? "currentColor" : "none"} />
              </button>
              <p className="price">{som(product.price)}</p>
              {saving > 0 && product.oldPrice ? (
                <p className="mpx-old">
                  <s>{som(product.oldPrice)}</s>
                  <span>Tejaysiz: {som(saving)}</span>
                </p>
              ) : null}
              <div className="mpx-qty">
                <span className="step">
                  <button type="button" aria-label="Kamaytirish" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="i" /></button>
                  <b>{qty}</b>
                  <button type="button" aria-label="Oshirish" disabled={qty >= Math.max(1, stock)} onClick={() => setQty(Math.min(Math.max(1, stock), qty + 1))}><Plus className="i" /></button>
                </span>
                <small className={stock > 0 ? "ok" : "bad"}>{stock > 0 ? `${stock} dona mavjud` : "Tugagan"}</small>
              </div>
              {error ? <p className="mpx-err">{error}</p> : null}
              <button type="button" className="mpx-go" data-testid="product-add" disabled={stock < 1} onClick={() => addLine()}>
                <ShoppingCart className="i" /> Savatga qo‘shish
              </button>
              <button type="button" className="mpx-soft" disabled={stock < 1} onClick={() => addLine(true)}>Hozir xarid qilish</button>
              <button type="button" className="mpx-linebtn" disabled={stock < 1} onClick={() => addLine()}>Tez qayta buyurtma</button>
              {product.shopName ? (
                <section className="mpx-seller">
                  <span className="ava">{product.shopLogo ? <img src={product.shopLogo} alt="" /> : <Store className="i" />}</span>
                  <span>
                    <b>{product.shopName} {official ? <BadgeCheck className="i" /> : null}</b>
                    <small>
                      {official ? "Rasmiy distribyutor" : "Sotuvchi"}
                      {product.shopReviews > 0 ? ` · ${product.shopRating.toFixed(1)} (${product.shopReviews})` : ""}
                      {city ? ` · ${city}` : ""}
                      {shopCount > 0 ? ` · ${shopCount} ta mahsulot` : ""}
                    </small>
                  </span>
                  {product.shopSlug ? <Link href={`/marketplace/dokon/${product.shopSlug}`}>Sotuvchi profili <ChevronRight className="i" /></Link> : null}
                </section>
              ) : null}
            </section>
          </aside>
        </div>

        {tabs.length ? (
          <section className="mpx-tabs">
            <div className="mpx-tabbar" role="tablist">
              {tabs.map((item) => (
                <button key={item} type="button" role="tab" aria-selected={active === item} className={active === item ? "on" : undefined} onClick={() => setTab(item)}>
                  {item}
                </button>
              ))}
            </div>
            <div className="mpx-tabbody">
              {active === "Tavsif" ? (
                <div className="mpx-split">
                  <div>
                    <p className="mpx-copy">{product.description || short || "Sotuvchi tavsif qo‘shmagan."}</p>
                    {benefits.length ? (
                      <ul className="mpx-benefits">
                        {benefits.map((item) => (
                          <li key={item}><Check className="i" />{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div>
                    {specs.length ? (
                      <table className="mpx-table">
                        <caption>Asosiy xususiyatlar</caption>
                        <tbody>{specs.slice(0, 8).map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)}</tbody>
                      </table>
                    ) : null}
                    {clinical ? <div className="mpx-clinical"><img src={clinical} alt="" /></div> : null}
                  </div>
                </div>
              ) : null}
              {active === "Klinik qo‘llanish" ? <p className="mpx-copy">{usage}</p> : null}
              {active === "Texnik xususiyatlar" ? (
                <table className="mpx-table"><tbody>{specs.map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)}</tbody></table>
              ) : null}
              {active === "Sertifikat" ? (
                <div className="mpx-docs">
                  {docs.map((doc) => (
                    <a key={doc.url} className="mpx-doc" href={doc.url} target="_blank" rel="noreferrer">
                      <FileText className="i" />
                      <span><b>{doc.name || "Hujjat"}</b>{fileSize(doc.size) ? <small>{fileSize(doc.size)}</small> : null}</span>
                      <em>Yuklash</em>
                    </a>
                  ))}
                </div>
              ) : null}
              {active.startsWith("Sharhlar") ? <ProductReviewsList data={reviews} columns={2} /> : null}
              {active === "Yetkazib berish" ? (
                <p className="mpx-copy">
                  {delivery ? `Yetkazib berish: ${delivery}.` : ""}
                  {city ? ` Joylashuv: ${city}.` : ""} To‘lov naqd, yetkazib berilganda.
                </p>
              ) : null}
              {active === "Qayta buyurtma" ? (
                <div>
                  <p className="mpx-copy">Shu mahsulotni yana savatga qo‘shish — miqdor saqlanadi, to‘lov yetkazilganda naqd.</p>
                  <button type="button" className="mpx-go" style={{ marginTop: 12, maxWidth: 280 }} disabled={stock < 1} onClick={() => addLine()}>
                    Tez qayta buyurtma
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {similar.length ? (
          <section className="mpx-sim">
            <div className="hd">
              <h2>O‘xshash mahsulotlar</h2>
              <Link href="/marketplace">Barchasini ko‘rish <ChevronRight className="i" /></Link>
            </div>
            <div className="mpx-simrow">
              {similar.map((item) => (
                <Link key={item.id} className="mpx-mini" href={catalogHref(item.category, item.id)}>
                  {item.discount ? <span className="off">-{item.discount}%</span> : null}
                  {item.image ? <img src={item.image} alt="" /> : <span className="ph" />}
                  <span>
                    <b>{item.name}</b>
                    <small>{item.brand}</small>
                    {item.reviews > 0 ? <small>{item.rating.toFixed(1)} ({item.reviews})</small> : null}
                    <span className="p">
                      {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                      <strong className={item.oldPrice ? "sale" : undefined}>{som(item.price)}</strong>
                    </span>
                  </span>
                  <button
                    type="button"
                    className="add"
                    aria-label="Savatga"
                    onClick={(event) => {
                      event.preventDefault();
                      add(item.id, productFromCatalog(item));
                    }}
                  >
                    <ShoppingCart className="i" />
                  </button>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {light && shot ? (
          <div className="mpx-light" role="dialog" aria-label="Rasm" onClick={() => setLight(false)}>
            <img src={shot} alt={product.name} />
          </div>
        ) : null}
      </article>
    </ShopShell>
  );
}
