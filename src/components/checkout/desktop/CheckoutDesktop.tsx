"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileText,
  House,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Truck,
  Wallet,
} from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { MapPicker, PlaceIcon } from "@/components/map-picker";
import { shopClear } from "@/components/shop/desktop/shop-cart";
import { useCart } from "@/components/cart-provider";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { formatPhoneDisplay } from "@/lib/doctor-profile";
import { formatUzPhone, isUzPhone } from "@/lib/phone-uz";
import { createOrder, type PaymentMethod } from "@/lib/orders";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { useSavedPlaces, type SavedPlace } from "@/lib/saved-addresses";
import { formatGroupedNumber } from "@/lib/format";
import "./checkout-desktop.css";

type Step = 1 | 2 | 3;
type Kind = "Uy" | "Klinika";

function apiPayment(): PaymentMethod {
  return "naqd";
}

/** Cash on delivery is the only payment method. */
const PAYS = [
  { id: "naqd", title: "Naqd to‘lov", hint: "Yetkazib berilganda", live: true },
] as const;

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Farg‘ona", "Andijon", "Namangan"];
const DISTRICTS = ["Yunusobod tumani", "Chilonzor tumani", "Mirzo Ulug‘bek tumani", "Yakkasaroy tumani", "Shayxontohur tumani", "Olmazor tumani", "Mirobod tumani", "Sergeli tumani", "Yashnobod tumani", "Uchtepa tumani", "Bektemir tumani", "Yangihayot tumani"];
const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function som(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

function deliveryDay(pickup: boolean) {
  const day = new Date();
  if (!pickup) day.setDate(day.getDate() + 1);
  if (day.getDay() === 0) day.setDate(day.getDate() + 1);
  return `${pickup ? "Bugun, " : ""}${day.getDate()} ${MONTHS[day.getMonth()]} ${day.getFullYear()}, ${DAYS[day.getDay()]}`;
}

function kindOf(place: SavedPlace): Kind | null {
  if (/^uy\b/i.test(place.label.trim())) return "Uy";
  if (/klinik|clinic/i.test(place.label)) return "Klinika";
  return null;
}

function PayLogo({ id }: { id: string }) {
  if (id === "click") return <span className="ckx-logo click"><i /></span>;
  if (id === "payme") return <span className="ckx-logo payme">P</span>;
  if (id === "uzum") return <span className="ckx-logo uzum">U</span>;
  const Icon = id === "card" ? CreditCard : id === "naqd" ? Banknote : CalendarClock;
  return <span className="ckx-logo ico"><Icon size={22} /></span>;
}

export function CheckoutDesktop() {
  const router = useRouter();
  const cart = useCart();
  const { profile, ready: profileReady } = useDoctorProfile();
  const saved = useSavedPlaces(Boolean(profile), profileReady);
  const { places } = saved;
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [district, setDistrict] = useState("Yunusobod tumani");
  const [address, setAddress] = useState("");
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [kind, setKind] = useState<Kind | "">("");
  const [placeId, setPlaceId] = useState("");
  const [more, setMore] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [ship, setShip] = useState<"courier" | "pickup">("courier");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState("naqd");
  const [invoice, setInvoice] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [oferta, setOferta] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [busy, setBusy] = useState(false);
  const lines = cart.selectedItems.length ? cart.selectedItems : cart.items;
  const goods = lines.reduce((sum, item) => sum + item.lineTotal, 0);
  const fee = shopDeliveryFee(lines.map((item) => item.product));
  const delivery = ship === "pickup" ? 0 : fee;
  const total = goods + delivery;
  const payment = PAYS.find((item) => item.id === pay) ?? PAYS[0];
  const kinds = (["Uy", "Klinika"] as const).map((label) => ({ label, place: places.find((item) => kindOf(item) === label) ?? null }));
  const others = places.filter((item) => !kindOf(item));

  useEffect(() => {
    if (!profile) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect -- prefill once the profile loads */
    setName((value) => value || profile.fullName);
    setPhone((value) => value || formatPhoneDisplay(profile.phone));
    if (profile.city) setCity((value) => (value === "Toshkent" ? profile.city || value : value));
  }, [profile]);

  function applyPlace(place: SavedPlace) {
    setPlaceId(place.id);
    setAddress(place.address);
    if (place.city) setCity(place.city);
    if (place.district) setDistrict(place.district);
    setPoint(place.lat != null && place.lng != null ? { lat: place.lat, lng: place.lng } : null);
    setFields((cur) => ({ ...cur, address: undefined }));
  }

  function pickKind(label: Kind, place: SavedPlace | null) {
    setKind(label);
    if (place) applyPlace(place);
    else setPlaceId("");
  }

  function nextFromDelivery() {
    const next: { name?: string; phone?: string; address?: string } = {};
    if (!name.trim()) next.name = "Ismni kiriting";
    if (!isUzPhone(phone)) next.phone = "Telefon +998 XX XXX XX XX ko‘rinishida bo‘lsin";
    if (!address.trim()) next.address = "Manzilni kiriting";
    setFields(next);
    if (!lines.length) { setError("Savat bo‘sh"); return; }
    if (next.name || next.phone || next.address) { setError("Qizil maydonlarni to‘ldiring"); return; }
    setError("");
    // Remember the typed address under the chosen Uy / Klinika slot for next time.
    if (kind) {
      const current = kinds.find((item) => item.label === kind)?.place;
      if (!current || current.address !== address.trim() || current.district !== district) {
        void saved.save({ id: current?.id, label: kind, city, district, address: address.trim(), lat: point?.lat ?? current?.lat ?? null, lng: point?.lng ?? current?.lng ?? null });
      }
    }
    setStep(2);
  }

  function applyPromo() {
    if (!promo.trim()) { setPromoMsg("Promokodni kiriting"); return; }
    setPromoMsg("Bunday promokod topilmadi");
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
      note: [kind ? `Manzil: ${kind}` : "", note.trim(), ship === "pickup" ? "Olib ketaman" : "", invoice ? "Hisob-faktura (PDF) kerak" : ""].filter(Boolean).join(". "),
      payment: apiPayment(),
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

  function goNext() {
    if (step === 1) nextFromDelivery();
    else if (step === 2) { setError(""); setStep(3); }
    else void confirm();
  }

  const promoBox = (
    <div className="ckx-promo">
      <label className="ckx-inicon"><Tag size={16} /><input aria-label="Promokod" placeholder={step === 2 ? "Promokodni kiriting" : "Promokod"} value={promo} onChange={(event) => { setPromo(event.target.value); setPromoMsg(""); }} /></label>
      <button type="button" onClick={applyPromo}>Qo‘llash</button>
    </div>
  );

  return (
    <ClinicShell accent="teal">
      <div data-testid="checkout-desktop" data-step={step} className="ckx">
        <div className="ckx-crumb"><Link href="/" aria-label="Bosh sahifa"><House size={14} /></Link><Link href="/marketplace">Marketplace</Link><ChevronRight size={12} /><Link href="/savat">Savatcha</Link><ChevronRight size={12} /><b>Buyurtma berish</b></div>
        <h1>Buyurtma berish</h1>
        <p className="ckx-sub">
          {step === 1 ? "Buyurtmangizni rasmiylashtirish uchun ma’lumotlarni kiriting" : step === 2 ? "Buyurtmangizni rasmiylashtirish uchun to‘lov usulini tanlang" : "Buyurtmangizni tekshirib, tasdiqlang"}
        </p>
        <div className="ckx-grid">
          <div className="ckx-left">
            <ol className="ckx-steps" data-testid="ckd-stepper">
              {([
                [1, "Yetkazish", "Manzil va yetkazish usuli"],
                [2, "To‘lov", step > 2 ? "To‘lov usuli tanlandi" : "To‘lov usulini tanlang"],
                [3, "Tasdiqlash", "Buyurtmani tekshirib tasdiqlang"],
              ] as const).map(([id, label, hint]) => (
                <li key={id} className={step === id ? "on" : step > id ? "done" : undefined}>
                  <button type="button" disabled={id >= step} onClick={() => { setError(""); setStep(id); }}>
                    <b>{step > id ? <Check size={18} strokeWidth={3} /> : id}</b>
                    <span><strong>{label}</strong><small>{hint}</small></span>
                  </button>
                </li>
              ))}
            </ol>

            {step === 1 ? (
              <section className="ckx-card">
                <h2>Yetkazish manzili</h2>
                <p className="ckx-hint">Buyurtmangiz qayerga yetkazilishini kiriting</p>
                <div className="ckx-2">
                  <label className={fields.name ? "bad" : undefined}><span>Ism <i>*</i></span><input data-testid="ckd-name" value={name} onChange={(event) => { setName(event.target.value); setFields((cur) => ({ ...cur, name: undefined })); }} />{fields.name ? <small className="err">{fields.name}</small> : null}</label>
                  <label className={fields.phone ? "bad" : undefined}><span>Telefon <i>*</i></span>
                    <span className="ckx-inicon"><Phone size={15} /><em className="ckx-flag" aria-hidden /><input data-testid="ckd-phone" inputMode="tel" placeholder="+998 XX XXX XX XX" value={phone} onChange={(event) => { setPhone(formatUzPhone(event.target.value)); setFields((cur) => ({ ...cur, phone: undefined })); }} /></span>
                    {fields.phone ? <small className="err">{fields.phone}</small> : null}
                  </label>
                  <label><span>Shahar <i>*</i></span><span className="ckx-sel"><select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>{CITIES.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} /></span></label>
                  <label><span>Tuman <i>*</i></span><span className="ckx-sel"><select aria-label="Tuman" value={district} onChange={(event) => setDistrict(event.target.value)}>{(DISTRICTS.includes(district) ? DISTRICTS : [district, ...DISTRICTS]).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={16} /></span></label>
                  <label className={fields.address ? "wide bad" : "wide"}><span>Aniq manzil <i>*</i></span>
                    <span className="ckx-inicon end"><input data-testid="ckd-address" placeholder="Ko‘cha, uy, xonadon, qavat" value={address} onChange={(event) => { setAddress(event.target.value); setPlaceId(""); setFields((cur) => ({ ...cur, address: undefined })); }} /><button type="button" aria-label="Xaritadan tanlash" onClick={() => setMapOpen(true)}><MapPin size={17} /></button></span>
                    {fields.address ? <small className="err">{fields.address}</small> : null}
                  </label>
                </div>

                <div className="ckx-mapgrid">
                  <button type="button" className="ckx-map" data-testid="ckd-map" onClick={() => setMapOpen(true)}>
                    <img src="/img/designs/toshkent-map.png" alt="" />
                    <span className="search"><Search size={14} />Xaritada manzilni tanlang</span>
                  </button>
                  <div className="ckx-places" data-testid="ckd-places">
                    <div className="head"><b>Saqlangan manzillarim</b>{others.length ? <button type="button" onClick={() => setMore((value) => !value)}>{more ? "Yig‘ish" : "Barchasini ko‘rish"}<ChevronRight size={14} /></button> : null}</div>
                    {kinds.map(({ label, place }) => {
                      const on = kind === label;
                      return (
                        <div key={label} className={on ? "ckx-addr on" : "ckx-addr"} data-testid={`ckd-kind-${label.toLowerCase()}`}>
                          <button type="button" className="pick" aria-pressed={on} onClick={() => pickKind(label, place)}>
                            <i className="dot">{on ? <Check size={11} strokeWidth={3.5} /> : <PlaceIcon label={label} className="ico" />}</i>
                            <span><b>{label}</b><small>{place ? [place.district, place.address].filter(Boolean).join(", ") : on ? "Yuqoridagi manzil shu nom bilan saqlanadi" : "Hali saqlanmagan"}</small></span>
                          </button>
                          <button type="button" className="edit" onClick={() => { pickKind(label, place); setMapOpen(true); }}>{place ? "Tahrirlash" : "Qo‘shish"}</button>
                        </div>
                      );
                    })}
                    {more ? others.map((place) => (
                      <div key={place.id} className={placeId === place.id ? "ckx-addr on" : "ckx-addr"}>
                        <button type="button" className="pick" onClick={() => { setKind(""); applyPlace(place); }}>
                          <i className="dot">{placeId === place.id ? <Check size={11} strokeWidth={3.5} /> : <PlaceIcon label={place.label} className="ico" />}</i>
                          <span><b>{place.label}</b><small>{[place.district, place.address].filter(Boolean).join(", ")}</small></span>
                        </button>
                      </div>
                    )) : null}
                  </div>
                </div>

                <h2>Yetkazish usuli</h2>
                <p className="ckx-hint">Sizga qulay yetkazish usulini tanlang</p>
                <div className="ckx-ship">
                  <button type="button" data-testid="ckd-ship-courier" className={ship === "courier" ? "on" : undefined} onClick={() => setShip("courier")}>
                    <i className="radio" /><Truck className="big" size={30} strokeWidth={1.6} />
                    <span><b>Kuryer orqali</b><small>Manzilingizga yetkazib berish</small></span>
                    <span className="side"><em>1–2 kun</em><strong>{fee ? som(fee) : "Bepul"}</strong></span>
                  </button>
                  <button type="button" data-testid="ckd-ship-pickup" className={ship === "pickup" ? "on" : undefined} onClick={() => setShip("pickup")}>
                    <i className="radio" /><Store className="big" size={30} strokeWidth={1.6} />
                    <span><b>Olib ketish</b><small>Do‘kondan o‘zingiz olib ketish</small></span>
                    <span className="side"><em className="free">Bepul</em><small>Bugun</small></span>
                  </button>
                </div>
                <h2 className="ckx-h-note">Qo‘shimcha ma’lumot</h2>
                <label className="ckx-note">
                  <textarea maxLength={300} aria-label="Qo‘shimcha ma’lumot" placeholder="Kuryer uchun izoh (masalan: qo‘ng‘iroq qiling, darvozada kutaman va h.k.)" value={note} onChange={(event) => setNote(event.target.value)} />
                  <small>{note.length}/300</small>
                </label>
              </section>
            ) : null}

            {step === 2 ? (
              <section className="ckx-card">
                <h2>To‘lov usulini tanlang</h2>
                <p className="ckx-hint">Sizga qulay to‘lov usulini tanlang</p>
                <div className="ckx-pays">
                  {PAYS.map((item) => (
                    <button key={item.id} type="button" disabled={!item.live} data-testid={`ckd-pay-${item.id}`} className={pay === item.id ? "on" : undefined} onClick={() => setPay(item.id)}>
                      {pay === item.id ? <i className="tick"><Check size={11} strokeWidth={3.5} /></i> : null}
                      {item.live ? <em className="tag">Hozir ishlaydi</em> : <em className="tag soon">Tez orada</em>}
                      <PayLogo id={item.id} />
                      <b>{item.title}</b>
                      <small>{item.hint}</small>
                    </button>
                  ))}
                </div>
                <div className="ckx-safebar"><ShieldCheck size={30} /><span><b>Naqd to‘lov</b><small>To‘lov yetkazib berilganda naqd qilinadi.</small></span></div>
                <div className="ckx-promorow">
                  <span><b>Promokod</b><small>Agar promokodingiz bo‘lsa, kiriting</small></span>
                  {promoBox}
                </div>
                {promoMsg ? <p className="ckx-promomsg">{promoMsg}</p> : null}
                <div className="ckx-paybox">
                  <div className="ckx-mini">
                    <b className="ttl">To‘lov ma’lumotlari</b>
                    <span>Mahsulotlar ({lines.length} ta)<b>{som(goods)}</b></span>
                    <span>Yetkazish<b>{delivery ? som(delivery) : "Bepul"}</b></span>
                    <span>Chegirma (promokod)<b>0 so‘m</b></span>
                    <span className="total">Jami to‘lov<b>{som(total)}</b></span>
                  </div>
                  <label className={invoice ? "ckx-invoice on" : "ckx-invoice"} data-testid="ckd-invoice">
                    <input type="checkbox" checked={invoice} onChange={(event) => setInvoice(event.target.checked)} />
                    <i className="ckb">{invoice ? <Check size={13} strokeWidth={3.5} /> : null}</i>
                    <span><b>Hisob-faktura</b><small>Menga elektron hisob-faktura (PDF) yuborilsin</small></span>
                  </label>
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <div className="ckx-review">
                <section className="ckx-card">
                  <div className="ckx-rhead"><ShoppingCart size={18} /><i>1</i><h2>Mahsulotlar ({lines.length} ta)</h2></div>
                  {lines.map((item) => (
                    <div key={item.key} className="ckx-line big"><img src={item.product.image} alt="" /><div><b>{item.product.name}</b><small>{item.qty} dona</small></div><em>{som(item.lineTotal)}</em></div>
                  ))}
                </section>
                <div className="ckx-rcol">
                  <section className="ckx-card">
                    <div className="ckx-rhead"><MapPin size={18} /><i>2</i><h2>Yetkazish manzili</h2><button type="button" onClick={() => setStep(1)}><Pencil size={14} />O‘zgartirish</button></div>
                    <div className="ckx-rbox addr">
                      <div><b>{name}</b><span>{phone}</span><span className="gap">{city}, {district}</span><span>{address}</span>{kind ? <em>{kind}</em> : null}</div>
                      <span className="thumb"><img src="/img/designs/toshkent-map.png" alt="" /></span>
                    </div>
                  </section>
                  <section className="ckx-card">
                    <div className="ckx-rhead"><Truck size={18} /><i>3</i><h2>Yetkazish vaqti</h2><button type="button" onClick={() => setStep(1)}><Pencil size={14} />O‘zgartirish</button></div>
                    <div className="ckx-rbox when">
                      <span className="pair">{ship === "courier" ? <Truck size={22} /> : <Store size={22} />}<span><b>{ship === "courier" ? "Kuryer orqali" : "Olib ketish"}</b><small>{ship === "courier" ? "Manzilingizga yetkazib berish" : "Do‘kondan o‘zingiz olib ketasiz"}</small></span></span>
                      <span className="pair"><CalendarDays size={22} /><span><b>{deliveryDay(ship === "pickup")}</b><small>10:00 – 18:00 oralig‘ida (taxminiy)</small></span></span>
                    </div>
                  </section>
                  <section className="ckx-card">
                    <div className="ckx-rhead"><Wallet size={18} /><i>4</i><h2>To‘lov usuli</h2><button type="button" onClick={() => setStep(2)}><Pencil size={14} />O‘zgartirish</button></div>
                    <div className="ckx-rbox pay"><PayLogo id={payment.id} /><span><b>{payment.title}</b><small>{payment.hint}</small></span>{invoice ? <em><FileText size={13} />Hisob-faktura (PDF)</em> : null}</div>
                  </section>
                </div>
                <label className={oferta ? "ckx-oferta on" : "ckx-oferta"}>
                  <input type="checkbox" checked={oferta} data-testid="ckd-oferta" onChange={(event) => { setOferta(event.target.checked); setError(""); }} />
                  <i className="ckb">{oferta ? <Check size={15} strokeWidth={3.5} /> : null}</i>
                  <span><b>Men <Link href="/shartlar">oferta shartlari</Link> bilan tanishib chiqdim va roziman</b><small>Buyurtma berish orqali siz StomaHub’ning <Link href="/shartlar">foydalanish shartlari</Link> va <Link href="/maxfiylik">maxfiylik siyosatiga</Link> rozilik bildirasiz.</small></span>
                </label>
              </div>
            ) : null}

            {error ? <p className="ckx-error" data-testid="ckd-error">{error}</p> : null}
            {step > 1 ? (
              <div className="ckx-nav">
                <button type="button" className="back" data-testid="ckd-back" onClick={() => { setError(""); setStep((step - 1) as Step); }}><ArrowLeft size={18} />Orqaga</button>
                {step < 3 ? <button type="button" className="next" data-testid="ckd-next" onClick={goNext}>Davom etish<ArrowRight size={18} /></button> : <button type="button" className="next" data-testid="ckd-confirm" disabled={busy} onClick={goNext}>{busy ? "Saqlanmoqda…" : "Buyurtmani tasdiqlash"}<ArrowRight size={18} /></button>}
              </div>
            ) : null}
          </div>

          <aside className="ckx-card ckx-side" data-testid="ckd-summary">
            <h2>Buyurtma ma’lumotlari <small>{lines.length} ta mahsulot</small></h2>
            {lines.length === 0 ? <p className="ckx-hint" data-testid="ckd-empty">Savat bo‘sh. Avval mahsulot qo‘shing.</p> : (
              <div className="ckx-lines">
                {lines.map((item) => (
                  <Link key={item.key} href={item.product.href || `/marketplace/${item.product.id}`} className="ckx-line"><img src={item.product.image} alt="" /><div><b>{item.product.name}</b><small>{item.qty} dona</small><em>{som(item.lineTotal)}</em></div></Link>
                ))}
              </div>
            )}
            <div className="ckx-mini">
              <span>Mahsulotlar ({lines.length} ta)<b>{som(goods)}</b></span>
              <span>Yetkazish<b>{delivery ? som(delivery) : "Bepul"}</b></span>
              {step === 3 ? <span>Chegirma (promokod)<b>0 so‘m</b></span> : null}
            </div>
            {step === 2 ? null : promoBox}
            {step !== 2 && promoMsg ? <p className="ckx-promomsg">{promoMsg}</p> : null}
            <div className="ckx-total"><span>Jami</span><b data-testid="ckd-total">{som(total)}</b></div>
            {step === 1 ? (
              <button type="button" className="ckx-cta" data-testid="ckd-next" onClick={goNext}>Davom etish<ArrowRight size={18} /></button>
            ) : step === 2 ? (
              <button type="button" className="ckx-cta" onClick={goNext}>Davom etish<ArrowRight size={18} /></button>
            ) : null}
            {step < 3 ? <p className="ckx-lock"><Lock size={13} />Xavfsiz to‘lov va ma’lumotlaringiz himoyalangan</p> : null}
            {step < 3 ? (
              <div className="ckx-info"><Truck size={30} strokeWidth={1.5} /><span><b>Yetkazish haqida</b><small>Toshkent shahri bo‘ylab 1–2 kun ichida yetkazib beriladi. Boshqa hududlar uchun muddatlar operator tomonidan tasdiqlanadi.</small></span></div>
            ) : (
              <div className="ckx-info"><ShieldCheck size={30} strokeWidth={1.5} /><span><b>Xavfsiz xarid</b><small>To‘lov ma’lumotlaringiz himoyalangan. Barcha operatsiyalar shifrlangan.</small></span></div>
            )}
          </aside>
        </div>
      </div>
      <MapPicker
        open={mapOpen}
        city={city}
        initial={point ? { ...point, address, district } : null}
        places={places}
        onClose={() => setMapOpen(false)}
        onConfirm={(picked) => {
          setAddress(picked.address);
          if (picked.district) setDistrict(picked.district);
          setPoint({ lat: picked.lat, lng: picked.lng });
          setPlaceId("");
          setFields((cur) => ({ ...cur, address: undefined }));
          setMapOpen(false);
        }}
        onSave={async (picked) => {
          const result = await saved.save({ label: picked.label, address: picked.address, district: picked.district, city, lat: picked.lat, lng: picked.lng });
          return result.ok ? null : result.error;
        }}
        onRemove={(id) => {
          void saved.remove(id);
          if (placeId === id) setPlaceId("");
        }}
      />
    </ClinicShell>
  );
}
