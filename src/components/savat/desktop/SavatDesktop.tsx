"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Banknote, Check, CheckCircle2, Heart, Minus, Plus, RotateCcw, ShieldCheck, ShoppingCart, Store, Trash2, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, shopRemove, shopSetQty, shopToggleFav, som, useShopFavs, useShopLineCount, useShopLines, type ShopLine } from "@/components/shop/desktop/shop-cart";
import { deliveryFee, isValidPromo, loadPromo, promoDiscount, savePay, savePromo, type PayId } from "@/data/checkout-pricing";
import { savatPicks } from "@/data/desktop-savat";
import { useIsClient } from "@/lib/use-is-client";
import "./savat.css";

const steps = ["Savat", "Yetkazib berish", "To‘lov", "Tasdiqlash"];
const pays: { id: PayId; label: string; mark: string; cls: string }[] = [
  { id: "click", label: "Click", mark: "", cls: "click" },
  { id: "payme", label: "Payme", mark: "P", cls: "payme" },
  { id: "uzum", label: "Uzum", mark: "", cls: "uzum" },
  { id: "naqd", label: "Naqd", mark: "", cls: "naqd" },
];

export function SavatDesktop() {
  const router = useRouter();
  const lines = useShopLines();
  const cartCount = useShopLineCount();
  const favs = useShopFavs();
  const cart = useCart();
  const isClient = useIsClient();
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<"ok" | "bad" | "">("");
  const [promoLoaded, setPromoLoaded] = useState(false);
  if (isClient && !promoLoaded) {
    const stored = loadPromo();
    setPromoLoaded(true);
    if (isValidPromo(stored)) {
      setCode(stored);
      setPromo("ok");
    }
  }
  const [pay, setPay] = useState<PayId>("click");
  const [installment, setInstallment] = useState(false);
  const [added, setAdded] = useState("");

  const groups = useMemo(() => {
    const map = new Map<string, ShopLine[]>();
    for (const line of lines) {
      const seller = line.seller || "StomaHub Market";
      map.set(seller, [...(map.get(seller) ?? []), line]);
    }
    return [...map.entries()];
  }, [lines]);

  const lineKey = (line: ShopLine) => line.key ?? line.id;
  const isOn = (line: ShopLine) => cart.isSelected(lineKey(line));
  const selected = lines.filter(isOn);
  const units = selected.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = selected.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discount = promo === "ok" ? promoDiscount(code, subtotal) : 0;
  const delivery = deliveryFee(subtotal);
  const total = Math.max(0, subtotal - discount) + delivery;
  const monthly = Math.round(total / 12 / 100) * 100;
  const allOn = lines.length > 0 && selected.length === lines.length;
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  function toggleGroup(items: ShopLine[]) {
    const every = items.every(isOn);
    for (const item of items) if (every || !isOn(item)) cart.toggleSelected(lineKey(item));
  }

  function applyPromo() {
    const ok = isValidPromo(code);
    setPromo(code.trim() ? (ok ? "ok" : "bad") : "");
    savePromo(code);
  }

  function checkout() {
    savePromo(promo === "ok" ? code : "");
    savePay(installment ? "muddatli" : pay);
    router.push("/buyurtma");
  }

  return (
    <ShopShell searchPath="/marketplace" cartCount={cartCount} placeholder="Stomatologiya mahsulotlarini qidiring..." showCamera={false}>
      <div className="sv2" data-testid="savat-page">
        <div className="sv2-main">
          <div className="sv2-head">
            <h1>Savat <span>({count} ta mahsulot)</span></h1>
            <ol className="sv2-steps" aria-label="Buyurtma bosqichlari">
              {steps.map((label, index) => (
                <li key={label} className={index === 0 ? "on" : ""} aria-current={index === 0 ? "step" : undefined}><i>{index + 1}</i>{label}</li>
              ))}
            </ol>
          </div>

          <section className="sv2-panel">
            <div className="sv2-tools">
              <button type="button" className={allOn ? "sv2-cb on" : "sv2-cb"} aria-pressed={allOn} disabled={!lines.length} onClick={() => cart.setAllSelected(!allOn)}>
                <i aria-hidden>{allOn ? <Check className="i" /> : null}</i> Barchasini tanlash
              </button>
              <span>Tanlangan: <b>{selected.length} ta</b></span>
            </div>
            {groups.map(([seller, items]) => {
              const groupOn = items.every(isOn);
              return (
                <div className="sv2-group" key={seller}>
                  <div className="sv2-seller">
                    <button type="button" className={groupOn ? "sv2-cb on" : "sv2-cb"} aria-pressed={groupOn} aria-label={`${seller}: barchasini tanlash`} onClick={() => toggleGroup(items)}><i aria-hidden>{groupOn ? <Check className="i" /> : null}</i></button>
                    <Store className="i store" /> <b>{seller}</b>
                  </div>
                  {items.map((line) => {
                    const on = isOn(line);
                    const saved = favs.includes(line.id);
                    return (
                      <article className="sv2-line" key={lineKey(line)} data-testid="savat-line">
                        <button type="button" className={on ? "sv2-cb on" : "sv2-cb"} aria-pressed={on} aria-label={`${line.name}: tanlash`} onClick={() => cart.toggleSelected(lineKey(line))}><i aria-hidden>{on ? <Check className="i" /> : null}</i></button>
                        <Link href={line.href} className="ph"><img src={line.image} alt="" /></Link>
                        <div className="info">
                          <h3><Link href={line.href}>{line.name}</Link></h3>
                          {line.variant ? <p>{line.variant}</p> : null}
                          <span className="by"><Store className="i" /> {line.seller || "StomaHub Market"} {line.official ? <em><BadgeCheck className="i" /> Sotuvchining rasmiy do‘koni</em> : null}</span>
                        </div>
                        <span className="unit">{som(line.price)}</span>
                        <div className="sv2-qty">
                          <button type="button" aria-label="Kamaytirish" disabled={line.qty <= 1} onClick={() => shopSetQty(lineKey(line), Math.max(1, line.qty - 1))}><Minus className="i" /></button>
                          <b aria-live="polite">{line.qty}</b>
                          <button type="button" aria-label="Oshirish" disabled={line.qty >= 99} onClick={() => shopSetQty(lineKey(line), Math.min(99, line.qty + 1))}><Plus className="i" /></button>
                        </div>
                        <strong className="sum">{som(line.price * line.qty)}</strong>
                        <div className="acts">
                          <button type="button" className={saved ? "on" : ""} aria-pressed={saved} onClick={() => shopToggleFav(line.id)}><Heart className="i" /> {saved ? "Saqlangan" : "Saqlash"}</button>
                          <button type="button" onClick={() => shopRemove(lineKey(line))}><Trash2 className="i" /> O‘chirish</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })}
            {lines.length === 0 ? (
              <div className="sv2-empty">
                <ShoppingCart className="i" />
                <b>Savat bo‘sh</b>
                <p>Marketplace’dan yoki quyidagi tavsiyalardan mahsulot qo‘shing.</p>
                <Link href="/marketplace">Marketplace’ga o‘tish <ArrowRight className="i" /></Link>
              </div>
            ) : null}
          </section>

          <section className="sv2-picks">
            <div className="hd"><h2>Siz uchun tavsiyalar</h2><Link href="/marketplace">Barchasini ko‘rish <ArrowRight className="i" /></Link></div>
            <div className="grid">
              {savatPicks.map((item) => {
                const liked = favs.includes(item.id);
                const inCart = lines.some((line) => line.id === item.id);
                return (
                  <article className="sv2-pick" key={item.id}>
                    <Link href={item.href} className="ph"><img src={item.image} alt="" /></Link>
                    <div className="txt">
                      <b>{item.name}</b>
                      <span>{item.variant}</span>
                      <strong>{som(item.price)}</strong>
                    </div>
                    <button type="button" className={liked ? "heart on" : "heart"} aria-pressed={liked} aria-label="Sevimlilarga qo‘shish" onClick={() => shopToggleFav(item.id)}><Heart className="i" /></button>
                    <button type="button" className={added === item.id || inCart ? "add done" : "add"} onClick={() => { shopAdd(item); setAdded(item.id); }}>
                      {added === item.id || inCart ? <Check className="i" /> : <ShoppingCart className="i" />} {added === item.id || inCart ? "Savatda" : "Savatga"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="sv2-rail">
          <section className="sv2-box">
            <h3>Buyurtma xulosasi</h3>
            <dl className="sv2-sum">
              <div><dt>Mahsulotlar ({units} ta)</dt><dd>{som(subtotal)}</dd></div>
              <div className="minus"><dt>Chegirma</dt><dd>- {som(discount)}</dd></div>
              <div><dt>Yetkazib berish</dt><dd>{som(delivery)}</dd></div>
            </dl>
            <form className="sv2-promo" onSubmit={(event) => { event.preventDefault(); applyPromo(); }}>
              <label>
                <small>Promokod</small>
                <input aria-label="Promokod" value={code} placeholder="Kodni kiriting" onChange={(event) => { setCode(event.target.value); if (promo) setPromo(""); }} />
                {code ? <button type="button" className="x" aria-label="Tozalash" onClick={() => { setCode(""); setPromo(""); savePromo(""); }}><X className="i" /></button> : null}
              </label>
              <button type="submit">Qo‘llash</button>
            </form>
            {promo === "ok" ? <p className="sv2-ok"><CheckCircle2 className="i" /> Promokod muvaffaqiyatli qo‘llandi!</p> : null}
            {promo === "bad" ? <p className="sv2-bad">Promokod topilmadi</p> : null}
            <div className="sv2-total"><span>JAMI</span><b>{som(total)}</b></div>
            <button type="button" className="sv2-go" data-testid="savat-checkout" disabled={selected.length === 0} onClick={checkout}>Rasmiylashtirish <ArrowRight className="i" /></button>
          </section>

          <section className="sv2-box">
            <h3>To‘lov usuli</h3>
            <div className="sv2-pays" role="radiogroup" aria-label="To‘lov usuli">
              {pays.map((item) => (
                <button key={item.id} type="button" role="radio" aria-checked={pay === item.id && !installment} className={pay === item.id && !installment ? "on" : ""} onClick={() => { setPay(item.id); setInstallment(false); }}>
                  <i className={`logo ${item.cls}`}>{item.cls === "naqd" ? <Banknote className="i" /> : item.mark}</i>{item.label}
                </button>
              ))}
            </div>
            <button type="button" role="radio" aria-checked={installment} className={installment ? "sv2-install on" : "sv2-install"} onClick={() => setInstallment((v) => !v)}>
              <i className="dot" aria-hidden />
              <span><b>Bo‘lib to‘lash (12 oy)</b><small>12 oy × {som(monthly)}</small></span>
              <em>{installment ? "Tanlandi" : "Tanlash"}</em>
            </button>
            <div className="sv2-trust">
              <div><span className="ic"><ShieldCheck className="i" /></span><span><b>Xavfsiz to‘lov</b><small>Ma’lumotlaringiz himoyalangan</small></span></div>
              <div><span className="ic"><RotateCcw className="i" /></span><span><b>14 kun ichida qaytarish</b><small>Sifat kafolati</small></span></div>
            </div>
          </section>
        </aside>
      </div>
    </ShopShell>
  );
}
