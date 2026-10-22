"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Heart, Share2, Star } from "lucide-react";
import { cartLineKey, useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useFavorites } from "@/components/favorites-provider";
import { ToothIcon } from "@/components/catalog-pages/tooth-icon";
import { fmtReviewDate, type ProductReviewsData } from "@/components/product-reviews";
import { colorLabel, formaColors } from "@/data/forma";
import { productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import { discountPercent, getDeliveryLabel, orderCountLabel } from "@/lib/delivery-label";
import { formatMoney } from "@/lib/format";
import { resolveStoredImage } from "@/lib/media-url";
import "./product-mobile.css";

type ReadyProps = {
  status: "ready";
  card: CatalogCard;
  back: string;
  reviews: ProductReviewsData;
  size: string;
  color: string;
  onSize: (value: string) => void;
  onColor: (value: string) => void;
};

type StatusProps = {
  status: "loading" | "missing" | "failed";
  back?: string;
  backLabel?: string;
  title?: string;
  onRetry?: () => void;
};

function textAttr(attrs: Record<string, unknown>, key: string) {
  const value = attrs[key];
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return typeof value === "string" ? value.trim() : "";
}

function expiryLabel(raw: string) {
  const match = /^(\d{4})-(\d{2})/.exec(raw);
  return match ? `${match[2]}.${match[1]}` : raw;
}

export function ProductMobile(props: ReadyProps | StatusProps) {
  if (props.status === "loading") return <ProductSkeleton />;
  if (props.status !== "ready") {
    return (
      <div className="pm pm-state lg:hidden" data-testid="product-mobile">
        <p>{props.status === "failed" ? "Yuklab bo‘lmadi" : props.title || "Mahsulot topilmadi"}</p>
        {props.status === "failed" ? (
          <button type="button" onClick={props.onRetry}>Qayta urinish</button>
        ) : (
          <Link href={props.back || "/marketplace"}>{props.backLabel || "Marketplace‘ga qaytish"}</Link>
        )}
      </div>
    );
  }
  return <ProductReady {...props} />;
}

function ProductSkeleton() {
  return (
    <div className="pm lg:hidden" data-testid="product-mobile-loading" aria-busy="true">
      <div className="pm-skel pm-skel-hero" />
      <div className="pm-pad">
        <div className="pm-skel pm-skel-line short" />
        <div className="pm-skel pm-skel-line" />
        <div className="pm-skel pm-skel-line" />
        <div className="pm-skel pm-skel-line short" />
        <div className="pm-skel pm-skel-block" />
        <div className="pm-skel pm-skel-block" />
        <div className="pm-skel pm-skel-block" />
      </div>
      <div className="pm-bar">
        <button type="button" className="pm-buy" disabled>Savatga</button>
      </div>
    </div>
  );
}

function ProductReady({ card, back, reviews, size, color, onSize, onColor }: ReadyProps) {
  const router = useRouter();
  const pathname = usePathname();
  const cart = useCart();
  const favorites = useFavorites();
  const { ready, profile } = useDoctorProfile();
  const variantRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const gallery = [card.image, ...card.images].filter((src, index, all) => src && all.indexOf(src) === index);
  const [photo, setPhoto] = useState(0);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [logoBroken, setLogoBroken] = useState(false);
  const [bad, setBad] = useState<"" | "size" | "color">("");
  const [note, setNote] = useState("");
  const [descOpen, setDescOpen] = useState(false);
  const [descMore, setDescMore] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const sizeValue = card.sizes.length === 1 ? card.sizes[0] : size;
  const colorValue = card.colors.length === 1 ? card.colors[0] : color;
  const line = cart.items.find((item) => item.key === cartLineKey(card.id, sizeValue || undefined, colorValue || undefined));
  const pct = discountPercent(card.price, card.oldPrice);
  const reviewCount = reviews.loading ? card.reviewCount : reviews.count;
  const reviewAvg = reviews.loading ? card.reviewAvg : reviews.avg;
  const orders = orderCountLabel(card.orderCount);
  const delivery = getDeliveryLabel({
    deliveryDays: card.deliveryDays,
    cutoffTime: card.cutoffTime,
    worksOnWeekends: card.worksOnWeekends,
  });
  const saved = favorites.has(card.id);
  const description = card.description.trim();
  const visibleShots = gallery.filter((src) => !broken[src]);
  const specs = specRows(card);

  useEffect(() => {
    if (!note) return;
    const id = window.setTimeout(() => setNote(""), 2500);
    return () => window.clearTimeout(id);
  }, [note]);

  useEffect(() => {
    const el = descRef.current;
    if (!el || descOpen) return;
    setDescMore(el.scrollHeight > el.clientHeight + 1);
  }, [description, descOpen]);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(back);
  }

  function onFavorite() {
    if (!ready) return;
    if (!profile) {
      router.push(`/kirish?next=${encodeURIComponent(pathname || back)}`);
      return;
    }
    favorites.toggle(card.id);
  }

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: card.name, url });
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
    } catch {
      setNote("Havolani nusxalab bo‘lmadi");
    }
  }

  function requireChoice() {
    if (card.sizes.length > 1 && !sizeValue) {
      setBad("size");
      variantRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    if (card.colors.length > 1 && !colorValue) {
      setBad("color");
      variantRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    setBad("");
    return true;
  }

  function addOne() {
    if (!card.inStock || !requireChoice()) return;
    cart.add(card.id, productFromCatalog(card), 1, { size: sizeValue || undefined, color: colorValue || undefined });
  }

  function inc() {
    if (!line) return;
    if (line.qty >= card.stockQty) {
      setNote(`Omborda faqat ${card.stockQty} dona`);
      return;
    }
    cart.setQty(line.key, line.qty + 1);
  }

  function dec() {
    if (!line) return;
    if (line.qty <= 1) cart.remove(line.key);
    else cart.setQty(line.key, line.qty - 1);
  }

  const logo = !logoBroken ? resolveStoredImage(card.shopLogo) : "";
  const shownReviews = reviewsOpen ? reviews.reviews : reviews.reviews.slice(0, 3);

  return (
    <article className="pm lg:hidden" data-testid="product-mobile">
      <div className="pm-hero">
        <div
          className="pm-track"
          ref={trackRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            if (!el.clientWidth) return;
            setPhoto(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {visibleShots.length ? visibleShots.map((src) => (
            <div className="pm-slide" key={src}>
              <img src={src} alt="" onError={() => setBroken((current) => ({ ...current, [src]: true }))} />
            </div>
          )) : (
            <div className="pm-slide"><ToothIcon className="pm-tooth" /></div>
          )}
        </div>
        <button type="button" className="pm-float back" aria-label="Orqaga" onClick={goBack}><ChevronLeft /></button>
        <button type="button" className={saved ? "pm-float fav on" : "pm-float fav"} aria-label="Sevimlilar" aria-pressed={saved} onClick={onFavorite}>
          <Heart fill={saved ? "currentColor" : "none"} />
        </button>
        <button type="button" className="pm-float share" aria-label="Ulashish" onClick={() => void onShare()}><Share2 /></button>
        {!card.inStock ? <span className="pm-gone">Tugagan</span> : null}
      </div>
      {visibleShots.length > 1 ? (
        <div className="pm-dots" role="tablist" aria-label="Rasmlar">
          {visibleShots.map((src, index) => (
            <button
              key={src}
              type="button"
              className={index === photo ? "on" : undefined}
              aria-label={`Rasm ${index + 1}`}
              onClick={() => trackRef.current?.scrollTo({ left: index * trackRef.current.clientWidth, behavior: "smooth" })}
            >
              <i />
            </button>
          ))}
        </div>
      ) : null}
      <div className="pm-pad">
        <div className="pm-price">
          <b className={card.inStock ? undefined : "gone"}>{formatMoney(card.price, "UZS")}</b>
          {pct > 0 && card.oldPrice ? (
            <span className="was"><s>{formatMoney(card.oldPrice, "UZS")}</s> <em>-{pct}%</em></span>
          ) : null}
        </div>
        <h1>{card.name}</h1>
        {reviewCount > 0 || orders ? (
          reviewCount > 0 ? (
            <button type="button" className="pm-rate" onClick={() => document.getElementById("sharhlar")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {reviewAvg != null ? (
                <>
                  <Star fill="currentColor" color="#F5B400" />
                  <b>{reviewAvg.toFixed(1)}</b>
                </>
              ) : null}
              <span>{reviewCount} ta sharh</span>
              {orders ? <span>{orders}</span> : null}
            </button>
          ) : (
            <p className="pm-rate">{orders}</p>
          )
        ) : null}
        {card.sizes.length > 1 || card.colors.length > 1 ? (
          <div className={bad ? "pm-variants bad" : "pm-variants"} ref={variantRef} data-testid="variant-block">
            {card.sizes.length > 1 ? (
              <div>
                <p>O‘lcham</p>
                <div className="pm-chips">
                  {card.sizes.map((item) => (
                    <button key={item} type="button" className={sizeValue === item ? "on" : undefined} onClick={() => { onSize(item); if (bad === "size") setBad(""); }}>{item}</button>
                  ))}
                </div>
              </div>
            ) : null}
            {card.colors.length > 1 ? (
              <div>
                <p>Rang</p>
                <div className="pm-chips">
                  {card.colors.map((item) => {
                    const hex = formaColors.find((entry) => entry.id === item)?.hex;
                    return (
                      <button key={item} type="button" className={colorValue === item ? "on" : undefined} onClick={() => { onColor(item); if (bad === "color") setBad(""); }}>
                        {hex ? <i className="mr-1 inline-block size-3 rounded-full border border-black/10 align-middle" style={{ background: hex }} /> : null}
                        {colorLabel(item)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {bad ? <p className="err">{bad === "size" ? "O‘lchamni tanlang" : "Rangni tanlang"}</p> : null}
          </div>
        ) : null}
        <section className="pm-seller" data-testid="product-seller-mobile">
          {logo ? <img className="pm-logo" src={logo} alt="" onError={() => setLogoBroken(true)} /> : <span className="pm-initial">{(card.shopName || "S").slice(0, 1).toUpperCase()}</span>}
          <div>
            {card.shopName ? <b>{card.shopName}</b> : null}
            {card.shopSlug ? <Link href={`/marketplace/dokon/${card.shopSlug}`}>Do‘kon</Link> : null}
            {delivery ? <span>{delivery}</span> : null}
            <span>To‘lov: naqd</span>
          </div>
        </section>
        {specs.length ? (
          <table className="pm-specs">
            <tbody>
              {specs.map(([label, value]) => (
                <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>
              ))}
            </tbody>
          </table>
        ) : null}
        {description ? (
          <section>
            <h2>Tavsif</h2>
            <p ref={descRef} className={descOpen ? "pm-desc" : "pm-desc clamp"}>{description}</p>
            {descMore || descOpen ? (
              <button type="button" className="pm-more" onClick={() => setDescOpen((value) => !value)}>{descOpen ? "Yig‘ish" : "Batafsil"}</button>
            ) : null}
          </section>
        ) : null}
        {reviewCount > 0 && !reviews.loading && reviews.reviews.length > 0 ? (
          <section id="sharhlar">
            <h2>Sharhlar</h2>
            {shownReviews.map((review) => (
              <article key={review.id} className="pm-review">
                <header>
                  <b>{review.buyerName}</b>
                  <span>{fmtReviewDate(review.createdAt)}</span>
                </header>
                <StarRow value={review.rating} />
                {review.body ? <p>{review.body}</p> : null}
                {review.reply ? <p>Sotuvchi: {review.reply}</p> : null}
              </article>
            ))}
            {!reviewsOpen && reviews.reviews.length > 3 ? (
              <button type="button" className="pm-more" onClick={() => setReviewsOpen(true)}>Barcha sharhlar ({reviewCount})</button>
            ) : null}
          </section>
        ) : null}
      </div>
      {note ? <p className="pm-note" role="status">{note}</p> : null}
      <div className="pm-bar" data-testid="product-sticky">
        {!card.inStock ? (
          <button type="button" className="pm-buy off" disabled>Tugagan</button>
        ) : line ? (
          <>
            <div className="pm-step" data-testid="product-stepper">
              <button type="button" aria-label="Kamaytirish" onClick={dec}>−</button>
              <span>{line.qty}</span>
              <button type="button" aria-label="Oshirish" aria-disabled={line.qty >= card.stockQty} onClick={inc}>+</button>
            </div>
            <Link href="/savat" className="pm-go">O‘tish</Link>
          </>
        ) : (
          <button type="button" className="pm-buy" data-testid="product-mobile-add" onClick={addOne}>
            <span>Savatga</span>
            {delivery ? <small>{delivery}</small> : null}
          </button>
        )}
      </div>
    </article>
  );
}

function StarRow({ value }: { value: number }) {
  return (
    <span className="mt-1 flex gap-0.5 text-[#F5B400]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} className="size-4" fill={index < Math.round(value) ? "currentColor" : "none"} color={index < Math.round(value) ? "currentColor" : "#D1D5DB"} />
      ))}
    </span>
  );
}

function specRows(card: CatalogCard) {
  const rows: [string, string][] = [
    ["Ishlab chiqaruvchi", textAttr(card.attrs, "manufacturer") || card.brand],
    ["Material", textAttr(card.attrs, "material")],
    ["Turi", textAttr(card.attrs, "type")],
    ["Hajm", textAttr(card.attrs, "volume")],
    ["LOT", textAttr(card.attrs, "lot")],
    ["Muddati", textAttr(card.attrs, "expiryDate") ? expiryLabel(textAttr(card.attrs, "expiryDate")) : ""],
    ["Davlat", textAttr(card.attrs, "country")],
    ["Muallif", textAttr(card.attrs, "author")],
    ["Til", textAttr(card.attrs, "language")],
    ["Yil", textAttr(card.attrs, "year")],
    ["Bet", textAttr(card.attrs, "pages")],
    ["SKU", card.sku],
  ];
  if (!card.colors.length && textAttr(card.attrs, "color")) rows.splice(3, 0, ["Rang", textAttr(card.attrs, "color")]);
  return rows.filter((row) => row[1]);
}
