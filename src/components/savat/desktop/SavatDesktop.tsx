"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, Heart, Lock, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Store, Trash2, Truck } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopRemove, shopSetQty, shopToggleFav, som, useShopFavs, useShopLineCount, useShopLinesOrSeed, type ShopLine } from "@/components/shop/desktop/shop-cart";
import { SAVAT_DELIVERY, SAVAT_DISCOUNT, SAVAT_PROMO, savatPicks, savatSeed } from "@/data/desktop-savat";
import "./cart.css";

const steps = ["Savat", "Yetkazib berish", "To‘lov", "Tasdiqlash"];
const pays = ["Click", "Payme", "Uzum", "Naqd"] as const;

export function SavatDesktop() {
  const router = useRouter();
  const lines = useShopLinesOrSeed(savatSeed);
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const [off, setOff] = useState<string[]>([]);
  const [code, setCode] = useState(SAVAT_PROMO);
  const [promo, setPromo] = useState<"ok" | "bad" | "">("ok");
  const [pay, setPay] = useState<(typeof pays)[number]>("Click");
  const [installment, setInstallment] = useState(false);
  const step = 0;
  const [note, setNote] = useState("");

  const groups = useMemo(() => {
    const map = new Map<string, ShopLine[]>();
    for (const line of lines) {
      const seller = line.seller || "StomaHub Market";
      map.set(seller, [...(map.get(seller) ?? []), line]);
    }
    return [...map.entries()];
  }, [lines]);

  const selected = lines.filter((line) => !off.includes(line.id));
  const subtotal = selected.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discount = promo === "ok" && subtotal > 0 ? Math.min(SAVAT_DISCOUNT, subtotal) : 0;
  const delivery = selected.length ? SAVAT_DELIVERY : 0;
  const total = Math.max(0, subtotal - discount) + delivery;
  const monthly = Math.round(total / 12 / 100) * 100;
  const allOn = lines.length > 0 && selected.length === lines.length;

  function toggle(id: string) {
    setOff((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  }

  function toggleGroup(items: ShopLine[]) {
    const ids = items.map((item) => item.id);
    const every = ids.every((id) => !off.includes(id));
    setOff((list) => (every ? [...new Set([...list, ...ids])] : list.filter((id) => !ids.includes(id))));
  }

  function applyPromo() {
    setPromo(code.trim().toUpperCase() === SAVAT_PROMO ? "ok" : "bad");
  }

  return (
    <ShopShell searchPath="/marketplace" cartCount={cartCount} placeholder="Stomatologiya mahsulotlarini qidiring..." showCamera={false}>
      <div className="sv-page">
        <div className="sv-head">
          <h1>Savat ({lines.reduce((sum, line) => sum + line.qty, 0)} ta mahsulot)</h1>
          <div className="sv-steps">
            {steps.map((label, index) => (
              <span key={label} className={index === step ? "sv-step on" : index < step ? "sv-step done" : "sv-step"}>
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
                <button type="button" className={allOn ? "sv-check on" : "sv-check"} onClick={() => setOff(allOn ? lines.map((line) => line.id) : [])}>
                  <i className="sv-boxi">{allOn ? <Check className="i" /> : null}</i>
                  Barchasini tanlash
                </button>
                <em>Tanlangan: {selected.length} ta</em>
              </div>
              {lines.length === 0 ? <p className="sv-empty" data-testid="savat-empty">Savat bo‘sh. Marketplace’dan mahsulot qo‘shing.</p> : null}
              {groups.map(([seller, items]) => {
                const groupOn = items.every((item) => !off.includes(item.id));
                return (
                  <div key={seller}>
                    <div className="sv-seller">
                      <button type="button" className={groupOn ? "sv-check on" : "sv-check"} onClick={() => toggleGroup(items)} aria-label={seller}>
                        <i className="sv-boxi">{groupOn ? <Check className="i" /> : null}</i>
                      </button>
                      <span className="mark"><Store className="i" /></span>
                      {seller}
                    </div>
                    {items.map((line) => {
                      const on = !off.includes(line.id);
                      const saved = favs.includes(line.id);
                      return (
                        <article className="sv-line" key={line.id}>
                          <button type="button" className={on ? "sv-check on" : "sv-check"} aria-label="Tanlash" onClick={() => toggle(line.id)}>
                            <i className="sv-boxi">{on ? <Check className="i" /> : null}</i>
                          </button>
                          <Link href={line.href}><img src={line.image} alt="" /></Link>
                          <div>
                            <h3><Link href={line.href}>{line.name}</Link></h3>
                            {line.variant ? <div className="var">{line.variant}</div> : null}
                            {line.official ? <div className="sv-official"><BadgeCheck className="i" /> Sotuvchining rasmiy do‘koni</div> : null}
                          </div>
                          <b className="sv-money">{som(line.price)}</b>
                          <div className="sv-qty">
                            <button type="button" aria-label="Kamaytirish" onClick={() => shopSetQty(line.id, Math.max(1, line.qty - 1))}><Minus className="i" /></button>
                            <span>{line.qty}</span>
                            <button type="button" aria-label="Oshirish" onClick={() => shopSetQty(line.id, Math.min(99, line.qty + 1))}><Plus className="i" /></button>
                          </div>
                          <b className="sv-money total">{som(line.price * line.qty)}</b>
                          <div className="sv-acts">
                            <button type="button" className={saved ? "on" : ""} onClick={() => shopToggleFav(line.id)}><Heart className="i" /> {saved ? "Saqlangan" : "Saqlash"}</button>
                            <button type="button" onClick={() => shopRemove(line.id)}><Trash2 className="i" /> O‘chirish</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                );
              })}
              {lines.length === 0 ? <p className="sv-empty">Savat bo‘sh. Tavsiyalardan mahsulot qo‘shing.</p> : null}
            </section>

            <section className="sv-picks">
              <h2>Siz uchun tavsiyalar <Link href="/marketplace">Barchasini ko‘rish →</Link></h2>
              <div className="sv-grid">
                {savatPicks.map((item) => (
                  <article className="sv-pick" key={item.id}>
                    <img src={item.image} alt="" />
                    <b>{item.name}</b>
                    <span>{item.variant}</span>
                    <div className="price">{som(item.price)}</div>
                    <button type="button" className="sv-add" onClick={() => { shopAdd(item); setNote("Savatga qo‘shildi"); }}>
                      <ShoppingCart className="i" /> Savatga
                    </button>
                  </article>
                ))}
              </div>
            </section>
            {note ? <p className="sv-note">{note}</p> : null}
          </div>

          <aside className="sv-rail">
            <section className="sv-box">
              <h3>Buyurtma xulosasi</h3>
              <div className="sv-row"><span>Mahsulotlar ({selected.length} ta)</span><b>{som(subtotal)}</b></div>
              <div className="sv-row minus"><span>Chegirma</span><b>- {som(discount)}</b></div>
              <div className="sv-row"><span>Yetkazib berish</span><b>{som(delivery)}</b></div>
              <div className="sv-promo">
                <input aria-label="Promokod" value={code} placeholder="Promokod" onChange={(event) => setCode(event.target.value)} />
                <button type="button" onClick={applyPromo}>Qo‘llash</button>
              </div>
              {promo === "ok" ? <p className="sv-ok">Promokod muvaffaqiyatli qo‘llandi!</p> : null}
              {promo === "bad" ? <p className="sv-bad">Promokod topilmadi</p> : null}
              <div className="sv-total"><span>JAMI</span><b>{som(total)}</b></div>
              <button type="button" className="sv-go" data-testid="savat-checkout" disabled={selected.length === 0} onClick={() => router.push("/buyurtma")}>
                Rasmiylashtirish →
              </button>
            </section>
            <section className="sv-box">
              <h3>To‘lov usuli</h3>
              <div className="sv-pay">
                {pays.map((item) => (
                  <button key={item} type="button" className={pay === item && !installment ? "on" : ""} onClick={() => { setPay(item); setInstallment(false); }}>{item}</button>
                ))}
              </div>
              <div className="sv-install">
                <div>
                  <b>Bo‘lib to‘lash (12 oy)</b>
                  <span>12 oy × {som(monthly)}</span>
                </div>
                <button type="button" className={installment ? "sv-switch on" : "sv-switch"} aria-pressed={installment} aria-label="Tanlash" onClick={() => setInstallment((value) => !value)}>
                  <i />
                </button>
              </div>
              <div className="sv-trust"><Lock className="i" /><div>Xavfsiz to‘lov<span>Ma’lumotlaringiz himoyalangan</span></div></div>
              <div className="sv-trust"><RotateCcw className="i" /><div>14 kun ichida qaytarish<span>Sifat kafolati</span></div></div>
              <div className="sv-trust"><Truck className="i" /><div>Yetkazib berish<span>Toshkent 1 kun, viloyat 3–5 kun</span></div></div>
              <div className="sv-trust"><ShieldCheck className="i" /><div>Rasmiy mahsulot<span>Sotuvchi kafolati</span></div></div>
            </section>
          </aside>
        </div>
      </div>
    </ShopShell>
  );
}
