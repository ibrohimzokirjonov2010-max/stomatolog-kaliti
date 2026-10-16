"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { shopClear, som, useShopLinesOrSeed } from "@/components/shop/desktop/shop-cart";
import { SAVAT_DELIVERY, SAVAT_DISCOUNT, SAVAT_PROMO, savatSeed } from "@/data/desktop-savat";
import { rememberPlacedOrder, loadPlacedOrders, type MobileOrder } from "@/data/mobile-orders";
import "./checkout-desktop.css";

type Step = 1 | 2 | 3;
type PayId = "click" | "payme" | "uzum" | "card" | "naqd";
type ShipId = "courier" | "pickup";

const STEPS = [
  { id: 1 as const, label: "Yetkazish" },
  { id: 2 as const, label: "To‘lov" },
  { id: 3 as const, label: "Tasdiqlash" },
];

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg‘ona", "Namangan"];
const TASHKENT = ["Yunusobod", "Chilonzor", "Shayxontohur", "Mirzo Ulug‘bek", "Yakkasaroy", "Sergeli", "Uchtepa"];
const SAVED = [
  { id: "uy", title: "Uy", city: "Toshkent", district: "Yunusobod", address: "Yunusobod tumani, Amir Temur ko‘chasi, 25-uy" },
  { id: "klinika", title: "Klinika", city: "Toshkent", district: "Shayxontohur", address: "Shayxontohur tumani, Navoiy ko‘chasi, 12-uy" },
];
const PAYS: { id: PayId; title: string; hint: string }[] = [
  { id: "click", title: "Click", hint: "Click ilovasi orqali" },
  { id: "payme", title: "Payme", hint: "Payme ilovasi orqali" },
  { id: "uzum", title: "Uzum", hint: "Uzum ilovasi orqali" },
  { id: "card", title: "Bank kartasi", hint: "Visa / Mastercard" },
  { id: "naqd", title: "Naqd", hint: "Yetkazilganda to‘lash" },
];

function districtsOf(city: string) {
  return city === "Toshkent" ? TASHKENT : ["Markaz", "Shahar"];
}

export function CheckoutDesktop() {
  const router = useRouter();
  const lines = useShopLinesOrSeed(savatSeed);
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("Ibrohim Zokirjonov");
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [city, setCity] = useState("Toshkent");
  const [district, setDistrict] = useState("Yunusobod");
  const [address, setAddress] = useState(SAVED[0].address);
  const [saved, setSaved] = useState("uy");
  const [comment, setComment] = useState("");
  const [delivery, setDelivery] = useState<ShipId>("courier");
  const [pay, setPay] = useState<PayId>("click");
  const [promo, setPromo] = useState("");
  const [promoOn, setPromoOn] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [oferta, setOferta] = useState(false);
  const [error, setError] = useState("");

  const goods = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const discount = promoOn ? Math.min(SAVAT_DISCOUNT, goods) : 0;
  const ship = lines.length && delivery === "courier" ? SAVAT_DELIVERY : 0;
  const total = Math.max(0, goods - discount) + ship;
  const payMeta = PAYS.find((item) => item.id === pay) ?? PAYS[0];

  function chooseCity(next: string) {
    setCity(next);
    const list = districtsOf(next);
    setDistrict((current) => (list.includes(current) ? current : list[0]));
    setSaved("");
  }

  function chooseSaved(id: string) {
    const place = SAVED.find((item) => item.id === id);
    if (!place) return;
    setSaved(id);
    setCity(place.city);
    setDistrict(place.district);
    setAddress(place.address);
    setError("");
  }

  function nextFromDelivery() {
    if (!name.trim()) return setError("Ismni kiriting");
    if (phone.replace(/\D/g, "").length < 9) return setError("Telefon raqamini kiriting");
    if (!address.trim()) return setError("Manzilni kiriting");
    setError("");
    setStep(2);
  }

  function applyPromo() {
    if (promo.trim().toUpperCase() !== SAVAT_PROMO) {
      setPromoOn(false);
      setPromoError("Promokod topilmadi");
      return;
    }
    setPromoError("");
    setPromoOn(true);
  }

  function confirm() {
    if (!oferta) {
      setError("Ofertani tasdiqlang");
      return;
    }
    const seq = 10080 + loadPlacedOrders().length;
    const order: MobileOrder = {
      id: `sk-${seq}`,
      number: `SK-${seq}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      seller: lines[0]?.seller || "StomaHub Market",
      status: "jarayonda",
      itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
      total,
      images: lines.slice(0, 3).map((line) => line.image),
      extra: Math.max(0, lines.length - 3),
      place: [district, city].filter(Boolean).join(", "),
      delivery,
      items: lines.map((line) => ({ id: line.id, name: line.name, price: line.price, image: line.image, qty: line.qty })),
    };
    rememberPlacedOrder(order);
    shopClear();
    router.push(`/buyurtmalarim/${order.id}`);
  }

  return (
    <ClinicShell accent="blue">
      <div data-testid="checkout-desktop" data-step={step}>
        <div className="ckd-head">
          <h1>Buyurtma berish</h1>
          <p>{step === 1 ? "Yetkazib berish manzilini kiriting" : step === 2 ? "To‘lov usulini tanlang" : "Ma’lumotlarni tekshirib, tasdiqlang"}</p>
        </div>
        <div className="ckd-steps" data-testid="ckd-stepper">
          {STEPS.map((item, index) => {
            const state = step === item.id ? "on" : step > item.id ? "done" : "";
            return (
              <button key={item.id} type="button" className={`ckd-step ${state}`} onClick={() => { if (item.id < step) { setError(""); setStep(item.id); } }}>
                {index > 0 ? <span className="line" /> : null}
                <i>{state === "done" ? <Check size={12} /> : item.id}</i>
                {item.label}
              </button>
            );
          })}
        </div>

        {lines.length === 0 ? (
          <div className="ckd-card" data-testid="ckd-empty">
            <h2>Savat bo‘sh</h2>
            <p>Marketplacedan mahsulot qo‘shing.</p>
            <Link className="ckd-next" href="/savat">Savatga o‘tish</Link>
          </div>
        ) : (
          <div className="ckd-grid">
            <section className="ckd-card">
              {step === 1 ? (
                <>
                  <h2>Yetkazish</h2>
                  <div className="ckd-fields">
                    <label>Ism*<input data-testid="ckd-name" value={name} onChange={(event) => setName(event.target.value)} /></label>
                    <label>Telefon*<input data-testid="ckd-phone" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
                    <label>Shahar
                      <select aria-label="Shahar" value={city} onChange={(event) => chooseCity(event.target.value)}>{CITIES.map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                    <label>Tuman
                      <select aria-label="Tuman" value={district} onChange={(event) => setDistrict(event.target.value)}>{districtsOf(city).map((item) => <option key={item}>{item}</option>)}</select>
                    </label>
                    <label className="ckd-wide">Manzil*<input data-testid="ckd-address" value={address} onChange={(event) => { setAddress(event.target.value); setSaved(""); }} /></label>
                  </div>
                  <div className="ckd-saved">
                    {SAVED.map((item) => (
                      <button key={item.id} type="button" className={saved === item.id ? "on" : undefined} onClick={() => chooseSaved(item.id)}>
                        <b>{item.title}</b>
                        <span>{item.address}</span>
                      </button>
                    ))}
                  </div>
                  <div className="ckd-ship">
                    <button type="button" className={delivery === "courier" ? "on" : undefined} onClick={() => setDelivery("courier")}><b>Kuryer</b><span>Ertaga, {som(SAVAT_DELIVERY)}</span></button>
                    <button type="button" className={delivery === "pickup" ? "on" : undefined} onClick={() => setDelivery("pickup")}><b>Olib ketish</b><span>Do‘kondan, bepul</span></button>
                  </div>
                  <label className="ckd-note">Izoh<textarea aria-label="Izoh" value={comment} onChange={(event) => setComment(event.target.value)} /></label>
                </>
              ) : null}

              {step === 2 ? (
                <>
                  <h2>To‘lov</h2>
                  <div className="ckd-pay">
                    {PAYS.map((item) => (
                      <button key={item.id} type="button" className={pay === item.id ? "on" : undefined} data-testid={`ckd-pay-${item.id}`} onClick={() => setPay(item.id)}>
                        <b>{item.title}</b>
                        <span>{item.hint}</span>
                      </button>
                    ))}
                  </div>
                  <div className="ckd-promo">
                    <input aria-label="Promokod" value={promo} placeholder="Promokod" onChange={(event) => setPromo(event.target.value)} />
                    <button type="button" data-testid="ckd-promo" onClick={applyPromo}>Qo‘llash</button>
                  </div>
                  {promoOn ? <p className="ckd-error" style={{ color: "#16803c" }}>Promokod qo‘llandi</p> : null}
                  {promoError ? <p className="ckd-error">{promoError}</p> : null}
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <h2>Tasdiqlash</h2>
                  <div className="ckd-review">
                    <article><b>Qabul qiluvchi</b>{name} · {phone}</article>
                    <article><b>Manzil</b>{delivery === "pickup" ? "Olib ketish" : address}<br />{district}, {city}</article>
                    <article><b>To‘lov</b>{payMeta.title}</article>
                    {comment ? <article><b>Izoh</b>{comment}</article> : null}
                  </div>
                  <label className="ckd-check">
                    <input type="checkbox" checked={oferta} data-testid="ckd-oferta" onChange={(event) => setOferta(event.target.checked)} />
                    <span>Oferta shartlariga roziman</span>
                  </label>
                </>
              ) : null}

              {error ? <p className="ckd-error" data-testid="ckd-error">{error}</p> : null}
              <div className="ckd-actions">
                {step === 1 ? <Link className="ckd-back" href="/savat">Orqaga</Link> : (
                  <button type="button" className="ckd-back" data-testid="ckd-back" onClick={() => { setError(""); setStep((step - 1) as Step); }}>Orqaga</button>
                )}
                {step < 3 ? (
                  <button type="button" className="ckd-next" data-testid="ckd-next" onClick={() => (step === 1 ? nextFromDelivery() : setStep(3))}>Keyingi</button>
                ) : (
                  <button type="button" className="ckd-next" data-testid="ckd-confirm" onClick={confirm}>Tasdiqlash</button>
                )}
              </div>
            </section>

            <aside className="ckd-card" data-testid="ckd-summary">
              <h2>Buyurtma</h2>
              {lines.map((line) => (
                <div key={line.id} className="ckd-line">
                  <img src={line.image} alt="" />
                  <span style={{ flex: 1 }}><b>{line.name}</b><span>{line.qty} ta</span></span>
                  <b>{som(line.price * line.qty)}</b>
                </div>
              ))}
              <div className="ckd-row"><span>Mahsulotlar</span><b>{som(goods)}</b></div>
              <div className="ckd-row"><span>Chegirma</span><b>- {som(discount)}</b></div>
              <div className="ckd-row"><span>Yetkazib berish</span><b>{som(ship)}</b></div>
              <div className="ckd-row total"><span>Jami</span><b>{som(total)}</b></div>
            </aside>
          </div>
        )}
      </div>
    </ClinicShell>
  );
}
