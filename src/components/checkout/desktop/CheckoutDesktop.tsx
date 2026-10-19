"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { shopClear } from "@/components/shop/desktop/shop-cart";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { formatPhoneDisplay } from "@/lib/doctor-profile";
import { createOrder, type PaymentMethod } from "@/lib/orders";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { formatGroupedNumber } from "@/lib/format";
import "./checkout-desktop.css";

type Step = 1 | 2 | 3;

function apiPayment(id: string): PaymentMethod {
  if (id === "payme") return "payme";
  if (id === "naqd") return "naqd";
  return "click";
}

function som(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

export function CheckoutDesktop() {
  const router = useRouter();
  const cart = useCart();
  const { profile } = useDoctorProfile();
  const [step, setStep] = useState<Step>(1);
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
  const [pay, setPay] = useState("naqd");
  const [invoice, setInvoice] = useState(false);
  const [oferta, setOferta] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const lines = cart.selectedItems.length ? cart.selectedItems : cart.items;
  const goods = lines.reduce((sum, item) => sum + item.lineTotal, 0);
  const delivery = shopDeliveryFee(lines.map((item) => item.product));
  const total = goods + delivery;

  useEffect(() => {
    if (!profile) return;
    setName((value) => value || profile.fullName);
    setPhone((value) => value || formatPhoneDisplay(profile.phone));
    if (profile.city) setCity((value) => (value === "Toshkent" ? profile.city || value : value));
  }, [profile]);

  function nextFromDelivery() {
    if (!lines.length) { setError("Savat bo‘sh"); return; }
    if (!name.trim() || !phone.trim() || !address.trim()) { setError("Manzil maydonlarini to‘ldiring"); return; }
    setError("");
    setStep(2);
  }
  async function confirm() {
    if (!oferta) { setError("Oferta shartlarini tasdiqlang"); return; }
    if (!lines.length) { setError("Savat bo‘sh"); return; }
    setBusy(true);
    setError("");
    const result = await createOrder({
      name: name.trim(),
      phone: phone.trim(),
      city,
      address: [district, address].filter(Boolean).join(", "),
      note: [note.trim(), ship === "pickup" ? "Olib ketaman" : "", invoice ? "Hisob-faktura" : ""].filter(Boolean).join(". "),
      payment: apiPayment(pay),
      items: lines.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
        size: item.size,
        color: item.color,
        source: item.source,
        expiryMonths: item.expiryMonths,
      })),
    });
    setBusy(false);
    if (!result.ok) { setError(result.reason); return; }
    shopClear();
    cart.clear();
    router.push(`/buyurtmalarim?order=${encodeURIComponent(result.order.id)}`);
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
                  <button type="button" className={ship === "courier" ? "on" : undefined} onClick={() => setShip("courier")}><b>Kuryer orqali</b><span>1–2 kun</span><em>25 000 so‘m</em></button>
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
                <label className="ckx-check"><input type="checkbox" checked={invoice} onChange={(event) => setInvoice(event.target.checked)} /> Menga elektron hisob-faktura (PDF) yuborilsin</label>
                <div className="ckx-mini">
                  <span>Mahsulotlar ({lines.length} ta)<b>{som(goods)}</b></span>
                  <span>Yetkazish<b>{delivery ? som(delivery) : "Bepul"}</b></span>
                  <span>Jami to‘lov<b>{som(total)}</b></span>
                </div>
              </section>
            ) : null}
            {step === 3 ? (
              <section className="ckx-card">
                <div className="ckx-saved-head"><h2>Mahsulotlar ({lines.length} ta)</h2><button type="button" onClick={() => setStep(1)}>O‘zgartirish</button></div>
                {lines.map((item) => (
                  <div key={item.key} className="ckx-line"><img src={item.product.image} alt="" /><div><b>{item.product.name}</b><small>{item.qty} dona</small></div><em>{som(item.lineTotal)}</em></div>
                ))}
                <div className="ckx-saved-head"><h2>Yetkazish manzili</h2><button type="button" onClick={() => setStep(1)}>O‘zgartirish</button></div>
                <p><b>{name}</b><br />{phone}<br />{city}, {district}<br />{address}</p>
                <div className="ckx-saved-head"><h2>Yetkazish vaqti</h2><button type="button" onClick={() => setStep(1)}>O‘zgartirish</button></div>
                <p>{ship === "courier" ? "Kuryer orqali" : "Olib ketish"}</p>
                <div className="ckx-saved-head"><h2>To‘lov usuli</h2><button type="button" onClick={() => setStep(2)}>O‘zgartirish</button></div>
                <p>{pay === "click" ? "Click · Click orqali to‘lov" : pay}</p>
                <label className="ckx-check"><input type="checkbox" checked={oferta} data-testid="ckd-oferta" onChange={(event) => setOferta(event.target.checked)} /> Men oferta shartlari bilan tanishib chiqdim va roziman</label>
                <p className="ckx-fine">Buyurtma berish orqali siz StomaHub’ning foydalanish shartlari va maxfiylik siyosatiga rozilik bildirasiz.</p>
              </section>
            ) : null}
            {error ? <p className="ckx-error" data-testid="ckd-error">{error}</p> : null}
            <div className="ckx-nav">
              {step > 1 ? <button type="button" className="back" data-testid="ckd-back" onClick={() => { setError(""); setStep((step - 1) as Step); }}>‹ Orqaga</button> : <span />}
              {step < 3 ? <button type="button" className="next" data-testid="ckd-next" onClick={() => (step === 1 ? nextFromDelivery() : setStep(3))}>Davom etish ›</button> : <button type="button" className="next" data-testid="ckd-confirm" disabled={busy} onClick={() => void confirm()}>{busy ? "Saqlanmoqda…" : "Buyurtmani tasdiqlash ›"}</button>}
            </div>
          </div>
          <aside className="ckx-card" data-testid="ckd-summary">
            <h2>Buyurtma ma’lumotlari <small>{lines.length} ta mahsulot</small></h2>
            {lines.length === 0 ? <p data-testid="ckd-empty">Savat bo‘sh. Avval mahsulot qo‘shing.</p> : lines.map((item) => (
              <div key={item.key} className="ckx-line"><img src={item.product.image} alt="" /><div><b>{item.product.name}</b><small>{item.qty} dona</small></div><em>{som(item.lineTotal)}</em></div>
            ))}
            <div className="ckx-mini">
              <span>Mahsulotlar ({lines.length} ta)<b>{som(goods)}</b></span>
              <span>Yetkazish<b>{delivery ? som(delivery) : "Bepul"}</b></span>
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
