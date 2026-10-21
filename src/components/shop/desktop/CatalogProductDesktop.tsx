"use client";
/* eslint-disable @next/next/no-img-element -- catalog photos come from seller uploads */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Box,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Hash,
  Heart,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Star,
  Store,
  Truck,
  Wrench,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ProductReviewsList, useProductReviews } from "@/components/product-reviews";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopToggleFav, som, useShopFavs, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { colorLabel, formaColors, formaGenders, formaKinds } from "@/data/forma";
import { catalogCardFrom, catalogHref, fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { formatDotDate } from "@/lib/format";
import "./product-desktop.css";

type Section = "forma" | "jihozlar";

const SECTION: Record<"marketplace" | Section, { href: string; label: string; missing: string }> = {
  marketplace: { href: "/marketplace", label: "Marketplace", missing: "Mahsulot topilmadi" },
  forma: { href: "/forma", label: "Tibbiy forma", missing: "Forma topilmadi" },
  jihozlar: { href: "/jihozlar", label: "Jihozlar", missing: "Jihoz topilmadi" },
};

const CATEGORY_LABEL: Record<string, string> = {
  materiallar: "Materiallar",
  implantlar: "Implantlar",
  asboblar: "Asboblar",
  jihozlar: "Jihozlar",
  laboratoriya: "Laboratoriya",
  forma: "Forma",
};

const TABS = ["Tavsif", "Texnik xususiyatlar", "Sharhlar", "Yetkazib berish"] as const;

function text(attrs: Record<string, unknown>, key: string) {
  const value = attrs[key];
  return typeof value === "string" ? value.trim() : "";
}

function num(attrs: Record<string, unknown>, key: string) {
  const value = Number(attrs[key]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Desktop product page for marketplace, forma and jihozlar items, built from the live catalog row. */
export function CatalogProductDesktop({ id, expect }: { id: string; expect?: Section }) {
  const router = useRouter();
  const { add } = useCart();
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const reviews = useProductReviews(id);
  const [card, setCard] = useState<CatalogCard | null | undefined>(undefined);
  const [related, setRelated] = useState<CatalogCard[]>([]);
  const [photo, setPhoto] = useState(0);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tavsif");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    let stop = false;
    void fetch(`/api/catalog/${id}`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((json: { ok?: boolean; product?: Record<string, unknown> }) => {
        if (stop) return;
        const next = json.ok && json.product ? catalogCardFrom(json.product) : null;
        if (!next || (expect && next.category !== expect)) {
          setCard(null);
          return;
        }
        setCard(next);
        if (next.sizes.length === 1) setSize(next.sizes[0]);
        if (next.colors.length === 1) setColor(next.colors[0]);
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
  }, [expect, id]);

  const section = SECTION[expect ?? "marketplace"];
  const gallery = useMemo(() => (card ? [card.image, ...card.images].filter((src, index, all) => src && all.indexOf(src) === index) : []), [card]);
  const similar = useMemo(() => (card ? related.filter((item) => item.category === card.category).slice(0, 4) : []), [card, related]);

  if (card === undefined || card === null) {
    return (
      <ShopShell searchPath={section.href} cartCount={cartCount}>
        <div className="pdx-empty">
          <b>{card === undefined ? "Yuklanmoqda..." : section.missing}</b>
          {card === null ? <Link href={section.href}>{section.label}ga qaytish</Link> : null}
        </div>
      </ShopShell>
    );
  }

  const product = card;
  const attrs = product.attrs;
  const short = text(attrs, "shortDescription");
  const official = attrs.official === true;
  const condition = text(attrs, "condition");
  const expiry = text(attrs, "expiryDate");
  const lot = text(attrs, "lot");
  const city = text(attrs, "city");
  const warranty = num(attrs, "warrantyMonths");
  const year = num(attrs, "year");
  const months = num(attrs, "installmentMonths");
  const monthly = num(attrs, "installmentMonthly") || (months ? Math.round(product.price / months) : 0);
  const delivery = attrs.freeDelivery === true ? "Bepul" : num(attrs, "deliveryPrice") ? som(num(attrs, "deliveryPrice")) : "";
  const docs = Array.isArray(attrs.docs) ? (attrs.docs as { url?: string; name?: string; size?: number }[]).filter((doc) => doc?.url) : [];
  const kind = formaKinds.find((item) => item.id === product.kind)?.label || "";
  const gender = formaGenders.find((item) => item.id === product.gender)?.label || "";
  const stock = product.stockQty;
  const shot = gallery[photo] || gallery[0] || "";
  const fav = favs.includes(product.id);
  const saving = product.oldPrice ? product.oldPrice - product.price : 0;

  const facts = [
    condition ? { icon: Box, label: "Holati", value: condition === "ishlatilgan" ? "Ishlatilgan" : "Yangi" } : null,
    expiry ? { icon: CalendarClock, label: "Yaroqlilik muddati", value: formatDotDate(expiry) } : null,
    lot ? { icon: Hash, label: "Lot raqami", value: lot } : null,
    { icon: Box, label: "Miqdor", value: stock > 0 ? `Omborda ${stock} ta` : "Tugagan", tone: stock > 0 ? "ok" : "bad" },
    city ? { icon: MapPin, label: "Joylashuv", value: city } : null,
    delivery ? { icon: Truck, label: "Yetkazib berish", value: delivery } : null,
    year ? { icon: CalendarClock, label: "Ishlab chiqarilgan", value: String(year) } : null,
    warranty ? { icon: ShieldCheck, label: "Kafolat", value: `${warranty} oy` } : null,
    kind ? { icon: Box, label: "Turi", value: kind } : null,
    gender ? { icon: Box, label: "Kim uchun", value: gender } : null,
  ].filter((item): item is { icon: typeof Box; label: string; value: string; tone?: string } => Boolean(item)).slice(0, 6);

  const specs = [
    ["Brend", product.brand],
    ["Ishlab chiqaruvchi", text(attrs, "manufacturer")],
    ["Model", text(attrs, "model")],
    ["Turi", text(attrs, "type") || kind],
    ["Hajm", text(attrs, "volume")],
    ["Qadoqda", text(attrs, "packCount")],
    ["Rang (material)", text(attrs, "color")],
    ["Qo‘llanish", text(attrs, "usage")],
    ["Qotish", text(attrs, "curing")],
    ["Saqlash", text(attrs, "storage")],
    ["Yaroqlilik", text(attrs, "shelfLife") || (expiry ? formatDotDate(expiry) : "")],
    ["Lot raqami", lot],
    ["Xususiyat", text(attrs, "specLine")],
    ["SKU", product.sku],
  ].filter((row) => row[1]);

  function addLine(goToCheckout = false) {
    if (product.sizes.length && !size) {
      setError("O‘lchamni tanlang");
      return;
    }
    if (product.colors.length && !color) {
      setError("Rangni tanlang");
      return;
    }
    setError("");
    add(product.id, productFromCatalog(product), qty, { size: size || undefined, color: color || undefined });
    if (goToCheckout) router.push("/buyurtma");
    else setNote("Savatga qo‘shildi");
  }

  return (
    <ShopShell searchPath={section.href} cartCount={cartCount}>
      <article className="pdx" data-testid="product-desktop">
        <nav className="dk-crumbs">
          <Link href={section.href}>{section.label}</Link>
          <ChevronRight className="i" />
          {expect ? null : (
            <>
              <Link href={`${section.href}?category=${product.category}`}>{CATEGORY_LABEL[product.category] ?? "Mahsulotlar"}</Link>
              <ChevronRight className="i" />
            </>
          )}
          <b>{product.name}</b>
        </nav>

        <div className="pdx-top">
          <section className="pdx-gallery">
            <div className="stage">
              {shot ? <img src={shot} alt={product.name} /> : <span className="none">Rasm yo‘q</span>}
              {gallery.length > 1 ? (
                <>
                  <button type="button" className="nav prev" aria-label="Oldingi rasm" onClick={() => setPhoto((photo - 1 + gallery.length) % gallery.length)}><ChevronLeft className="i" /></button>
                  <button type="button" className="nav next" aria-label="Keyingi rasm" onClick={() => setPhoto((photo + 1) % gallery.length)}><ChevronRight className="i" /></button>
                </>
              ) : null}
            </div>
            {gallery.length > 1 ? (
              <div className="thumbs">
                {gallery.slice(0, 5).map((src, index) => (
                  <button key={`${index}-${src}`} type="button" className={index === photo ? "on" : undefined} aria-label={`Rasm ${index + 1}`} onClick={() => setPhoto(index)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="pdx-info">
            <p className="brand">
              {product.brand}
              {official ? <span className="official"><BadgeCheck className="i" /> Rasmiy distribyutor</span> : null}
            </p>
            <h1>{product.name}</h1>
            {short ? <p className="sub">{short}</p> : null}
            {product.reviews > 0 ? (
              <p className="rate">
                <Star className="i" /> <b>{product.rating.toFixed(1)}</b> ({product.reviews} ta sharh)
              </p>
            ) : null}
            {product.description && product.description !== short ? <p className="blurb">{product.description.length > 220 ? `${product.description.slice(0, 220)}…` : product.description}</p> : null}

            <div className="facts">
              {facts.map((fact) => {
                const Icon = fact.icon;
                return (
                  <div key={fact.label}>
                    <Icon className="i" />
                    <span>
                      <small>{fact.label}</small>
                      <b className={fact.tone}>{fact.value}</b>
                    </span>
                  </div>
                );
              })}
            </div>

            {product.sizes.length ? (
              <div className="pick">
                <small>O‘lcham</small>
                <div>
                  {product.sizes.map((item) => (
                    <button key={item} type="button" className={size === item ? "on" : undefined} aria-pressed={size === item} onClick={() => setSize(item)}>{item}</button>
                  ))}
                </div>
              </div>
            ) : null}
            {product.colors.length ? (
              <div className="pick">
                <small>Rang{color ? `: ${colorLabel(color)}` : ""}</small>
                <div>
                  {product.colors.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={color === item ? "swatch on" : "swatch"}
                      aria-label={colorLabel(item)}
                      aria-pressed={color === item}
                      style={{ background: formaColors.find((entry) => entry.id === item)?.hex ?? "#d1d5db" }}
                      onClick={() => setColor(item)}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {docs.length ? (
              <div className="docs">
                {docs.slice(0, 2).map((doc) => (
                  <a key={doc.url} href={doc.url} target="_blank" rel="noreferrer">
                    <FileText className="i" />
                    <span><b>{doc.name || "Hujjat"}</b>{doc.size ? <small>{(doc.size / 1024 / 1024).toFixed(1)} MB</small> : null}</span>
                    <em>Yuklash</em>
                  </a>
                ))}
              </div>
            ) : null}
          </section>

          <aside className="pdx-side">
            <section className="buy">
              {product.discount ? <span className="off">-{product.discount}%</span> : null}
              <button type="button" className={fav ? "heart on" : "heart"} aria-label="Sevimlilarga" aria-pressed={fav} onClick={() => shopToggleFav(product.id)}><Heart className="i" /></button>
              <strong>{som(product.price)}</strong>
              {product.oldPrice ? (
                <p className="old">
                  <s>{som(product.oldPrice)}</s>
                  <span>Tejaysiz: {som(saving)}</span>
                </p>
              ) : null}
              {months ? <p className="install">{months} oyga {som(monthly)}/oy</p> : null}
              <div className="qty">
                <span className="step">
                  <button type="button" aria-label="Kamaytirish" disabled={qty <= 1} onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="i" /></button>
                  <b>{qty}</b>
                  <button type="button" aria-label="Oshirish" disabled={qty >= Math.max(1, stock)} onClick={() => setQty(Math.min(Math.max(1, stock), qty + 1))}><Plus className="i" /></button>
                </span>
                <small className={stock > 0 ? "ok" : "bad"}>{stock > 0 ? `${stock} dona mavjud` : "Tugagan"}</small>
              </div>
              {error ? <p className="err">{error}</p> : null}
              <button type="button" className="go" data-testid="product-add" disabled={stock < 1} onClick={() => addLine()}>
                <ShoppingCart className="i" /> Savatga qo‘shish
              </button>
              <button type="button" className="soft" disabled={stock < 1} onClick={() => addLine(true)}>Hozir xarid qilish</button>
              {note ? (
                <p className="done">
                  {note}. <Link href="/savat">Savatga o‘tish</Link>
                </p>
              ) : null}
            </section>

            {product.shopName ? (
              <section className="seller">
                <span className="ava"><Store className="i" /></span>
                <span>
                  <b>{product.shopName} {official ? <BadgeCheck className="i ok" /> : null}</b>
                  <small>{official ? "Rasmiy distribyutor" : "Sotuvchi"}</small>
                </span>
                {product.shopSlug ? <Link href={`/marketplace/dokon/${product.shopSlug}`}>Sotuvchi profili <ChevronRight className="i" /></Link> : null}
              </section>
            ) : null}

            <section className="perks">
              {attrs.installService === true ? <p><Wrench className="i" /> O‘rnatish xizmati bor</p> : null}
              <p><ShieldCheck className="i" /> Xarid sotuvchi tasdig‘idan keyin yuradi</p>
              <p><RefreshCw className="i" /> Qayta buyurtma savat orqali bir bosishda</p>
            </section>
          </aside>
        </div>

        <section className="pdx-tabs">
          <div className="pdx-tabbar" role="tablist">
            {TABS.map((item) => (
              <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "on" : undefined} onClick={() => setTab(item)}>
                {item === "Sharhlar" && product.reviews > 0 ? `Sharhlar (${product.reviews})` : item}
              </button>
            ))}
          </div>
          <div className="body">
            {tab === "Tavsif" ? (
              <div className="split">
                <p className="copy">{product.description || short || "Sotuvchi tavsif qo‘shmagan."}</p>
                {specs.length ? (
                  <table>
                    <caption>Asosiy xususiyatlar</caption>
                    <tbody>{specs.slice(0, 7).map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)}</tbody>
                  </table>
                ) : null}
              </div>
            ) : null}
            {tab === "Texnik xususiyatlar" ? (
              specs.length ? <table className="full"><tbody>{specs.map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)}</tbody></table> : <p className="copy">Texnik ma’lumot kiritilmagan.</p>
            ) : null}
            {tab === "Sharhlar" ? <ProductReviewsList data={reviews} columns={2} /> : null}
            {tab === "Yetkazib berish" ? (
              <p className="copy">
                {delivery ? `Yetkazib berish: ${delivery}.` : "Yetkazib berish narxi va muddati buyurtma rasmiylashtirilganda sotuvchi tomonidan belgilanadi."}
                {city ? ` Mahsulot joylashuvi: ${city}.` : ""}
              </p>
            ) : null}
          </div>
        </section>

        {similar.length ? (
          <section className="pdx-similar">
            <div className="hd">
              <h2>O‘xshash mahsulotlar</h2>
              <Link href={section.href}>Barchasini ko‘rish <ChevronRight className="i" /></Link>
            </div>
            <div className="row">
              {similar.map((item) => (
                <Link key={item.id} className="mini" href={catalogHref(item.category, item.id)}>
                  {item.discount ? <span className="off">-{item.discount}%</span> : null}
                  {item.image ? <img src={item.image} alt="" /> : <span className="ph" />}
                  <span className="t">
                    <b>{item.name}</b>
                    <small>{item.brand}</small>
                    {item.reviews > 0 ? <small className="r"><Star className="i" /> {item.rating.toFixed(1)} ({item.reviews})</small> : null}
                    <span className="p">
                      {item.oldPrice ? <s>{som(item.oldPrice)}</s> : null}
                      <strong className={item.oldPrice ? "sale" : undefined}>{som(item.price)}</strong>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </ShopShell>
  );
}
