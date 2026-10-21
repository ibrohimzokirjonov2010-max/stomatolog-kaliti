"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Check, Heart, Lock, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Store, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { useFavorites } from "@/components/favorites-provider";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som } from "@/components/shop/desktop/shop-cart";
import { apparelMetaLabel } from "@/data/forma";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { returnWindowText } from "@/lib/commerce-terms";
import { catalogHref, fetchCatalogProducts, productFromCatalog, type CatalogCard } from "@/lib/catalog-client";
import "./cart.css";

const steps = ["Savat", "Yetkazib berish", "To‘lov", "Tasdiqlash"];

export function SavatDesktop() {
  const router = useRouter();
  const cart = useCart();
  const favorites = useFavorites();
  const { items, add, setQty, remove, clear, isSelected, toggleSelected, setAllSelected, selectedItems, selectedSubtotal } = cart;
  const [catalog, setCatalog] = useState<CatalogCard[]>([]);

  useEffect(() => {
    let stop = false;
    void fetchCatalogProducts().then((rows) => {
      if (!stop) setCatalog(rows);
    });
    return () => {
      stop = true;
    };
  }, []);

  // Suggestions: live catalog items not already in the cart, best reviewed first.
  const picks = useMemo(() => {
    const inCart = new Set(items.map((line) => line.product.id));
    return catalog
      .filter((item) => !inCart.has(item.id) && item.category !== "forma")
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 4);
  }, [catalog, items]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const line of items) {
      const seller = line.product.shopName || "Do‘kon";
      map.set(seller, [...(map.get(seller) ?? []), line]);
    }
    return [...map.entries()];
  }, [items]);

  const subtotal = selectedSubtotal;
  const delivery = shopDeliveryFee(selectedItems.map((line) => line.product));
  const total = subtotal + delivery;
  const allOn = items.length > 0 && selectedItems.length === items.length;
  const qtySum = items.reduce((sum, line) => sum + line.qty, 0);

  return (
    <ShopShell searchPath="/marketplace" cartCount={cart.count} placeholder="Stomatologiya mahsulotlarini qidiring..." showCamera={false}>
      <div className="sv-page" data-testid="savat-desktop">
        <div className="sv-head">
          <h1>
            Savat <span>({qtySum} ta mahsulot)</span>
          </h1>
          <div className="sv-steps">
            {steps.map((label, index) => (
              <span key={label} className={index === 0 ? "sv-step on" : "sv-step"}>
                {index > 0 ? <span className="line" /> : null}
                <i>{index + 1}</i>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="sv-cols">
          <div>
            <section className="sv-panel">
              <div className="sv-tools">
                <button type="button" className={allOn ? "sv-check on" : "sv-check"} onClick={() => setAllSelected(!allOn)}>
                  <i className="sv-boxi">{allOn ? <Check className="i" /> : null}</i>
                  Barchasini tanlash
                </button>
                <em>Tanlangan: {selectedItems.length} ta</em>
                {items.length > 0 ? (
                  <button type="button" onClick={() => clear()} data-testid="savat-clear">Barchasini o‘chirish</button>
                ) : null}
              </div>
              {items.length === 0 ? <p className="sv-empty" data-testid="savat-empty">Savat bo‘sh. Marketplace’dan mahsulot qo‘shing.</p> : null}
              {groups.map(([seller, lines]) => {
                const groupOn = lines.every((line) => isSelected(line.key));
                return (
                  <div key={seller}>
                    <div className="sv-seller">
                      <button
                        type="button"
                        className={groupOn ? "sv-check on" : "sv-check"}
                        onClick={() => lines.forEach((line) => { if (isSelected(line.key) === groupOn) toggleSelected(line.key); })}
                        aria-label={seller}
                      >
                        <i className="sv-boxi">{groupOn ? <Check className="i" /> : null}</i>
                      </button>
                      <span className="mark"><Store className="i" /></span>
                      {seller}
                    </div>
                    {lines.map((line) => {
                      const on = isSelected(line.key);
                      const saved = favorites.has(line.product.id);
                      const variant = apparelMetaLabel(line.size, line.color);
                      const href = line.product.href || `/marketplace/${line.product.id}`;
                      return (
                        <article className="sv-line" key={line.key} data-testid={`savat-line-${line.product.id}`}>
                          <button type="button" className={on ? "sv-check on" : "sv-check"} aria-label="Tanlash" onClick={() => toggleSelected(line.key)}>
                            <i className="sv-boxi">{on ? <Check className="i" /> : null}</i>
                          </button>
                          <Link href={href}>{line.product.image ? <img src={line.product.image} alt="" /> : <span />}</Link>
                          <div>
                            <h3><Link href={href}>{line.product.name}</Link></h3>
                            {variant ? <div className="var">{variant}</div> : null}
                            {line.product.brand ? <div className="var">{line.product.brand}</div> : null}
                            {line.product.attrs?.official ? <div className="sv-official"><BadgeCheck className="i" /> Sotuvchining rasmiy do‘koni</div> : null}
                          </div>
                          <b className="sv-money">{som(line.product.price)}</b>
                          <div className="sv-qty">
                            <button type="button" aria-label="Kamaytirish" onClick={() => setQty(line.key, Math.max(1, line.qty - 1))}><Minus className="i" /></button>
                            <span>{line.qty}</span>
                            <button type="button" aria-label="Oshirish" onClick={() => setQty(line.key, Math.min(line.max, line.qty + 1))}><Plus className="i" /></button>
                          </div>
                          <b className="sv-money total">{som(line.lineTotal)}</b>
                          <div className="sv-acts">
                            <button type="button" className={saved ? "on" : ""} onClick={() => favorites.toggle(line.product.id)}><Heart className="i" /> {saved ? "Saqlangan" : "Saqlash"}</button>
                            <button type="button" aria-label="O‘chirish" onClick={() => remove(line.key)}><Trash2 className="i" /> O‘chirish</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                );
              })}
            </section>
            {picks.length ? (
              <section className="sv-picks">
                <h2>
                  Siz uchun tavsiyalar
                  <Link href="/marketplace">
                    Barchasini ko‘rish <ArrowRight className="i" />
                  </Link>
                </h2>
                <div className="sv-grid">
                  {picks.map((item) => (
                    <article className="sv-pick" key={item.id}>
                      <Link href={catalogHref(item.category, item.id)}>{item.image ? <img src={item.image} alt="" /> : <span />}</Link>
                      <div>
                        <b>{item.name}</b>
                        <span>{item.brand}</span>
                        <div className="price">{som(item.price)}</div>
                        <button type="button" className="sv-add" onClick={() => add(item.id, productFromCatalog(item), 1)}>
                          <ShoppingCart className="i" /> Savatga
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="sv-rail">
            <section className="sv-box">
              <h3>Buyurtma xulosasi</h3>
              <div className="sv-row"><span>Mahsulotlar ({selectedItems.length} ta)</span><b>{som(subtotal)}</b></div>
              <div className="sv-row"><span>Yetkazib berish</span><b data-testid="savat-delivery">{delivery > 0 ? som(delivery) : "Bepul"}</b></div>
              <div className="sv-total"><span>JAMI</span><b data-testid="savat-total">{som(total)}</b></div>
              <button type="button" className="sv-go" data-testid="savat-checkout" disabled={selectedItems.length === 0} onClick={() => router.push("/buyurtma")}>
                Rasmiylashtirish <ArrowRight className="i" />
              </button>
            </section>
            <section className="sv-box">
              <div className="sv-trust"><Lock className="i" /><div>Xavfsiz to‘lov<span>Ma’lumotlaringiz himoyalangan</span></div></div>
              <div className="sv-trust"><RotateCcw className="i" /><div>{returnWindowText()}<span>Sifat kafolati</span></div></div>
              <div className="sv-trust"><Truck className="i" /><div>Yetkazib berish<span>Narx mahsulot kartasidagi haqiqiy yetkazish haqidan olinadi</span></div></div>
              <div className="sv-trust"><ShieldCheck className="i" /><div>Sotuvchi kafolati<span>Buyurtma sotuvchi tasdig‘idan keyin yuradi</span></div></div>
            </section>
          </aside>
        </div>
      </div>
    </ShopShell>
  );
}
