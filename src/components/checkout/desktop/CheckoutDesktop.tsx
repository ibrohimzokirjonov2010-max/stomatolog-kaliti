"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { useCart } from "@/components/cart-provider";
import { cartItemToShopLine } from "@/components/shop/desktop/shop-cart";
import { deliveryFee, isValidPromo, loadPay, loadPromo, promoDiscount, savePromo } from "@/data/checkout-pricing";
import { useIsClient } from "@/lib/use-is-client";
import { rememberPlacedOrder, loadPlacedOrders, type MobileOrder } from "@/data/mobile-orders";
import { formatGroupedNumber } from "@/lib/format";
import "./checkout-desktop.css";

type Step = 1 | 2 | 3;

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function orderDate(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

/** Courier: next working day (Sunday is skipped). */
function courierDay(from: Date) {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${WEEKDAYS[d.getDay()]}`;
}

function som(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

export function CheckoutDesktop() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const cart = useCart();
  const isClient = useIsClient();
  const items = useMemo(() => cart.selectedItems.map(cartItemToShopLine), [cart.selectedItems]);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  const goods = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [district, setDistrict] = useState("Yunusobod tumani");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState("");
  const [more, setMore] = useState(false);
  const [map, setMap] = useState(false);
  const [ship, setShip] = useState<"courier" | "pickup">("courier");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState("click");
  useEffect(() => {
    const stored = loadPay();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- apply the method picked on /savat after hydration
    if (stored) setPay(stored);
  }, []);
  const [promo, setPromo] = useState("");
  const [promoOn, setPromoOn] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");
  const [promoLoaded, setPromoLoaded] = useState(false);
  if (isClient && !promoLoaded) {
    const stored = loadPromo();
    setPromoLoaded(true);
    if (isValidPromo(stored)) {
      setPromo(stored);
      setPromoOn(true);
    }
  }
  const [invoice, setInvoice] = useState(false);
  const [oferta, setOferta] = useState(false);
  const [error, setError] = useState("");
  const delivery = deliveryFee(goods, ship);
  const courierFee = deliveryFee(goods, "courier");
  const discount = promoOn ? promoDiscount(promo, goods) : 0;
  const total = Math.max(0, goods - discount) + delivery;

  function applyPromo() {
    const ok = isValidPromo(promo);
    setPromoOn(ok);
    setPromoMsg(promo.trim() ? (ok ? "Promokod qo‘llandi" : "Promokod topilmadi") : "");
    savePromo(ok ? promo : "");
  }

  function nextFromDelivery() {
    if (items.length === 0) { setError("Savatda tanlangan mahsulot yo‘q"); return; }
    if (!name.trim() || !address.trim()) { setError("Ism va manzilni to‘ldiring"); return; }
    if (phone.replace(/\D/g, "").length < 9) { setError("Telefon raqamini to‘liq kiriting"); return; }
    setError("");
    setStep(2);
  }
  function confirm() {
    if (items.length === 0) { setError("Savatda tanlangan mahsulot yo‘q"); return; }
    if (!oferta) { setError("Oferta shartlarini tasdiqlang"); return; }
    const orders = loadPlacedOrders();
    const now = new Date();
    const seq = 10080 + orders.length;
    const id = `sk-${seq}`;
    const sellers = [...new Set(items.map((item) => item.seller ?? "StomaHub Market"))];
    const order: MobileOrder = {
      id,
      number: `SH-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${seq}`,
      date: orderDate(now),
      seller: sellers.length === 1 ? sellers[0] : `${sellers[0]} va yana ${sellers.length - 1}`,
      status: "jarayonda",
      itemCount,
      total,
      images: items.slice(0, 3).map((item) => item.image),
      extra: Math.max(0, items.length - 3),
      items: items.map((item) => ({ id: item.id, name: item.name, price: item.price, image: item.image, qty: item.qty })),
      delivery: ship,
      place: `${city}, ${district}, ${address}`,
    };
    rememberPlacedOrder(order);
    savePromo("");
    cart.clearSelected();
    router.push(`/buyurtmalarim/${id}`);
  }

  return (
    <ClinicShell accent="blue">
      <div data-testid="checkout-desktop" data-step={step} className="ckx">
        <div className="ckx-crumb"><Link href="/marketplace">Marketplace</Link><span>›</span><Link href="/savat">Savatcha</Link><span>›</span><b>Buyurtma berish</b></div>
        <h1>Buyurtma berish</h1>
        <p className="ckx-sub">
          {step === 1 ? "Buyurtmangizni rasmiylashtirish uchun ma’lumotlarni kiriting" : step === 2 ? "Buyurtmangizni rasmiylashtirish uchun to‘lov usulini tanlang" : "Buyurtmangizni tekshirib, tasdiqlang"}
        </p>
        <div className="ckx-steps" data-testid="ckd-stepper">
          {[
            [1, "Yetkazish", "Manzil va yetkazish usuli"],
            [2, "To‘lov", "To‘lov usulini tanlang"],
            [3, "Tasdiqlash", "Buyurtmani tekshirib tasdiqlang"],
          ].map(([id, label, hint]) => (
            <div key={String(id)} className={step === id ? "on" : step > (id as number) ? "done" : undefined}>
              <b>{id}</b><span>{label}</span><small>{hint}</small>
            </div>
          ))}
        </div>
        <div className="ckx-grid">
          <div>
            {step === 1 ? (
              <section className="ckx-card">
                <h2>Yetkazish manzili</h2>
                <p>Buyurtmangiz qayerga yetkazilishini kiriting</p>
                <div className="ckx-2">
                  <label>Ism *<input data-testid="ckd-name" value={name} onChange={(event) => setName(event.target.value)} /></label>
                  <label>Telefon *<input data-testid="ckd-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
                  <label>Shahar *<select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>{["Toshkent", "Samarqand", "Buxoro"].map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label>Tuman *<select aria-label="Tuman" value={district} onChange={(event) => setDistrict(event.target.value)}>{["Yunusobod tumani", "Chilonzor tumani", "Mirzo Ulug‘bek tumani"].map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label className="wide">Aniq manzil *<input data-testid="ckd-address" value={address} onChange={(event) => setAddress(event.target.value)} /></label>
                </div>
                <button type="button" className="ckx-mapbtn" onClick={() => setMap((value) => !value)}>Xaritada manzilni tanlang</button>
                {map ? <img className="ckx-map" src="/img/designs/toshkent-map.png" alt="Toshkent xaritasi" /> : null}
                <div className="ckx-saved-head"><b>Saqlangan manzillarim</b><button type="button" onClick={() => setMore((value) => !value)}>Barchasini ko‘rish ›</button></div>
                {[{ id: "uy", title: "Uy", line: "Amir Temur ko‘chasi, 25-uy, 3-xonadon" }, { id: "klinika", title: "Klinika", line: "Shota Rustaveli ko‘chasi, 15-uy" }].slice(0, more ? 2 : 2).map((item) => (
                  <button key={item.id} type="button" className={saved === item.id ? "ckx-addr on" : "ckx-addr"} onClick={() => { setSaved(item.id); setAddress(item.id === "uy" ? "Amir Temur ko‘chasi, 25-uy, 3-xonadon, 5-qavat" : "Shota Rustaveli ko‘chasi, 15-uy"); }}>
                    <b>{item.title}</b><span>{item.line}</span><em>Tahrirlash</em>
                  </button>
                ))}
                <h2>Yetkazish usuli</h2>
                <p>Sizga qulay yetkazish usulini tanlang</p>
                <div className="ckx-ship">
                  <button type="button" className={ship === "courier" ? "on" : undefined} onClick={() => setShip("courier")}><b>Kuryer orqali</b><span>1–2 kun</span><em>{courierFee ? som(courierFee) : "Bepul"}</em></button>
                  <button type="button" className={ship === "pickup" ? "on" : undefined} onClick={() => setShip("pickup")}><b>Olib ketish</b><span>Bepul</span><em>Bugun</em></button>
                </div>
                <label className="wide">Qo‘shimcha ma’lumot
                  <textarea maxLength={300} placeholder="Kuryer uchun izoh (masalan: qo‘ng‘iroq qiling, darvozada kutaman va h.k.)" value={note} onChange={(event) => setNote(event.target.value)} />
                  <small>{note.length}/300</small>
                </label>
              </section>
            ) : null}
            {step === 2 ? (
              <section className="ckx-card">
                <h2>To‘lov usulini tanlang</h2>
                <p>Sizga qulay to‘lov usulini tanlang</p>
                <div className="ckx-pays">
                  {[
                    ["click", "Click", "Click orqali to‘lov", "Tavsiya etiladi"],
                    ["payme", "Payme", "Payme orqali to‘lov", ""],
                    ["uzum", "Uzum", "Uzum orqali to‘lov", ""],
                    ["card", "Bank kartasi", "Visa, Mastercard, Humo", ""],
                    ["naqd", "Naqd to‘lov", "Yetkazishda naqd", ""],
                    ["muddatli", "Muddatli to‘lov", "Uzum nasiya / Bank", ""],
                  ].map(([id, title, hint, badge]) => (
                    <button key={id} type="button" className={pay === id ? "on" : undefined} data-testid={`ckd-pay-${id}`} onClick={() => setPay(id)}>
                      {badge ? <em>{badge}</em> : null}<b>{title}</b><span>{hint}</span>
                    </button>
                  ))}
                </div>
                <p className="ckx-safe">To‘lovlar xavfsiz. Barcha to‘lovlar shifrlangan va to‘liq himoyalangan.</p>
                <div className="ckx-promo">
                  <input aria-label="Promokod" placeholder="Promokodni kiriting" value={promo} onChange={(event) => setPromo(event.target.value)} />
                  <button type="button" data-testid="ckd-promo" onClick={applyPromo}>Qo‘llash</button>
                </div>
                {promoMsg ? <p className={promoOn ? "ckx-safe" : "ckx-error"}>{promoMsg}</p> : null}
                <label className="ckx-check"><input type="checkbox" checked={invoice} onChange={(event) => setInvoice(event.target.checked)} /> Menga elektron hisob-faktura (PDF) yuborilsin</label>
                <div className="ckx-mini">
                  <span>Mahsulotlar ({itemCount} ta)<b>{som(goods)}</b></span>
                  <span>Yetkazish<b>{som(delivery)}</b></span>
                  <span>Chegirma (promokod)<b>{discount ? `- ${som(discount)}` : som(0)}</b></span>
                  <span>Jami to‘lov<b>{som(total)}</b></span>
                </div>
              </section>
            ) : null}
            {step === 3 ? (
              <section className="ckx-card">
                <div className="ckx-saved-head"><h2>Mahsulotlar ({itemCount} ta)</h2><button type="button" onClick={() => setStep(1)}>O‘zgartirish</button></div>
                {items.map((item) => (
                  <div key={item.key ?? item.id} className="ckx-line"><img src={item.image} alt="" /><div><b>{item.name}</b><small>{item.qty} dona{item.variant ? ` · ${item.variant}` : ""}</small></div><em>{som(item.price * item.qty)}</em></div>
                ))}
                <div className="ckx-saved-head"><h2>Yetkazish manzili</h2><button type="button" onClick={() => setStep(1)}>O‘zgartirish</button></div>
                <p><b>{name}</b><br />{phone}<br />{city}, {district}<br />{address}</p>
                <div className="ckx-saved-head"><h2>Yetkazish vaqti</h2><button type="button" onClick={() => setStep(1)}>O‘zgartirish</button></div>
                <p>{ship === "courier" ? `Kuryer orqali · ${courierDay(new Date())} · 10:00–18:00` : "Olib ketish · Bugun"}</p>
                <div className="ckx-saved-head"><h2>To‘lov usuli</h2><button type="button" onClick={() => setStep(2)}>O‘zgartirish</button></div>
                <p>{pay === "click" ? "Click · Click orqali to‘lov" : pay}</p>
                <label className="ckx-check"><input type="checkbox" checked={oferta} data-testid="ckd-oferta" onChange={(event) => setOferta(event.target.checked)} /> Men oferta shartlari bilan tanishib chiqdim va roziman</label>
                <p className="ckx-fine">Buyurtma berish orqali siz StomaHub’ning foydalanish shartlari va maxfiylik siyosatiga rozilik bildirasiz.</p>
              </section>
            ) : null}
            {error ? <p className="ckx-error" data-testid="ckd-error">{error}</p> : null}
            <div className="ckx-nav">
              {step > 1 ? <button type="button" className="back" data-testid="ckd-back" onClick={() => { setError(""); setStep((step - 1) as Step); }}>‹ Orqaga</button> : <span />}
              {step < 3 ? <button type="button" className="next" data-testid="ckd-next" onClick={() => (step === 1 ? nextFromDelivery() : setStep(3))}>Davom etish ›</button> : <button type="button" className="next" data-testid="ckd-confirm" onClick={confirm}>Buyurtmani tasdiqlash ›</button>}
            </div>
          </div>
          <aside className="ckx-card" data-testid="ckd-summary">
            <h2>Buyurtma ma’lumotlari <small>{itemCount} ta mahsulot</small></h2>
            {items.map((item) => (
              <div key={item.key ?? item.id} className="ckx-line"><img src={item.image} alt="" /><div><b>{item.name}</b><small>{item.qty} dona{item.variant ? ` · ${item.variant}` : ""}</small></div><em>{som(item.price * item.qty)}</em></div>
            ))}
            {isClient && items.length === 0 ? (
              <p className="ckx-fine" data-testid="ckd-empty">Savatda tanlangan mahsulot yo‘q. <Link href="/marketplace">Marketplace’ga o‘tish →</Link></p>
            ) : null}
            <div className="ckx-mini">
              <span>Mahsulotlar ({itemCount} ta)<b>{som(goods)}</b></span>
              <span>Yetkazish<b>{som(delivery)}</b></span>
              <span>Chegirma{promoOn ? ` (${promo.trim().toUpperCase()})` : ""}<b>{discount ? `- ${som(discount)}` : som(0)}</b></span>
              <span className="total">Jami<b>{som(total)}</b></span>
            </div>
            <p className="ckx-safe">{step === 3 ? "Xavfsiz xarid. To‘lov ma’lumotlaringiz himoyalangan. Barcha operatsiyalar shifrlangan." : "Xavfsiz to‘lov va ma’lumotlaringiz himoyalangan"}</p>
            {step === 1 ? <p className="ckx-fine">Toshkent shahri bo‘ylab 1–2 kun ichida yetkazib beriladi. Boshqa hududlar uchun muddatlar operator tomonidan tasdiqlanadi.</p> : null}
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}
