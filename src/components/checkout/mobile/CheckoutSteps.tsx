"use client";
/* eslint-disable @next/next/no-img-element -- cart photos are content images */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  Check,
  ChevronDown,
  CreditCard,
  Map,
  MapPin,
  MessageSquare,
  Percent,
  Phone,
  PieChart,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  User,
  X,
} from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { NotificationBell } from "@/components/notification-bell";
import { apparelMetaLabel } from "@/data/forma";
import { type MobileOrder } from "@/data/mobile-orders";
import { formatMoney } from "@/lib/format";
import { shopDeliveryFee } from "@/lib/cart-totals";
import { formatUzPhone, isUzPhone } from "@/lib/phone-uz";
import { useSavedPlaces } from "@/lib/saved-addresses";
import { createOrder, type PaymentMethod } from "@/lib/orders";
import "./checkout-steps.css";

type Step = 1 | 2 | 3 | "success";
type PayId = "click" | "payme" | "uzum" | "card" | "naqd" | "installment";
type ShipId = "courier" | "pickup";

const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Farg‘ona", "Namangan", "Nukus", "Qarshi"];
const TASHKENT = ["Yunusobod", "Chilonzor", "Shayxontohur", "Mirzo Ulug‘bek", "Yakkasaroy", "Sergeli", "Uchtepa", "Olmazor", "Mirobod", "Yashnobod", "Bektemir"];

const PAYS: { id: PayId; title: string; hint: string; mark: string; color: string; soon?: boolean }[] = [
  { id: "naqd", title: "Naqd pul", hint: "Yetkazilganda yoki olib ketganda", mark: "cash", color: "#12b981" },
  { id: "click", title: "Click", hint: "Tez orada", mark: "C", color: "#00b4d8", soon: true },
  { id: "payme", title: "Payme", hint: "Tez orada", mark: "P", color: "#14b87a", soon: true },
  { id: "uzum", title: "Uzum", hint: "Tez orada", mark: "U", color: "#7c3aed", soon: true },
  { id: "card", title: "Bank kartasi", hint: "Tez orada", mark: "card", color: "#0066ff", soon: true },
  { id: "installment", title: "Muddatli to‘lov", hint: "Tez orada", mark: "pie", color: "#f59e0b", soon: true },
];

const STEPS = [
  { id: 1 as const, label: "Yetkazish" },
  { id: 2 as const, label: "To‘lov" },
  { id: 3 as const, label: "Tasdiqlash" },
];

function districtsOf(city: string) {
  return city === "Toshkent" ? TASHKENT : ["Markaz", "Shahar"];
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function prettyPhone(raw: string) {
  const d = digits(raw);
  const local = d.startsWith("998") ? d.slice(3) : d;
  if (local.length !== 9) return raw;
  return `+998 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
}

function stamp(date: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}

function etaLabel(date = new Date()) {
  const months = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return `Ertaga, ${next.getDate()} ${months[next.getMonth()]}`;
}

function apiPay(): PaymentMethod {
  return "naqd";
}

function PayMark({ mark, color }: { mark: string; color: string }) {
  if (mark === "card") {
    return <span className="ck-mark" style={{ background: "#e8f1ff", color }}><CreditCard /></span>;
  }
  if (mark === "cash") {
    return <span className="ck-mark" style={{ background: color }}><Banknote /></span>;
  }
  if (mark === "pie") {
    return <span className="ck-mark" style={{ background: color }}><PieChart /></span>;
  }
  return <span className="ck-mark" style={{ background: color }}>{mark}</span>;
}

export function CheckoutSteps() {
  const cart = useCart();
  const { items, clear } = cart;
  const { profile, ready: profileReady } = useDoctorProfile();
  const { places, loaded: placesLoaded } = useSavedPlaces(Boolean(profile), profileReady);
  const seeded = useRef(false);
  const [booted, setBooted] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Toshkent");
  const [district, setDistrict] = useState("Yunusobod");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState("");
  const [allPlaces, setAllPlaces] = useState(false);
  const [comment, setComment] = useState("");
  const [delivery, setDelivery] = useState<ShipId>("courier");
  const [pay, setPay] = useState<PayId>("naqd");
  const [promo, setPromo] = useState("");
  const [promoError, setPromoError] = useState("");
  const [oferta, setOferta] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [mapOpen, setMapOpen] = useState(false);
  const [placed, setPlaced] = useState<MobileOrder | null>(null);

  useEffect(() => setBooted(true), []);

  useEffect(() => {
    if (seeded.current || !profile) return;
    seeded.current = true;
    if (profile.fullName) setName(profile.fullName);
    if (profile.phone) setPhone(prettyPhone(profile.phone));
  }, [profile]);

  const lines = items.length;
  const goods = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const deliveryFee = shopDeliveryFee(items.map((item) => item.product));
  const total = goods + deliveryFee;
  const payMeta = PAYS.find((item) => item.id === pay) ?? PAYS[0];
  const eta = useMemo(() => etaLabel(), []);
  const districts = districtsOf(city);
  const thumbs = items.slice(0, 5);
  const more = Math.max(0, items.length - thumbs.length);
  const shown = query.trim()
    ? items.filter((item) => item.product.name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  function go(next: 1 | 2 | 3) {
    setError("");
    setStep(next);
  }

  function chooseCity(next: string) {
    setCity(next);
    const list = districtsOf(next);
    setDistrict((current) => (list.includes(current) ? current : list[0]));
    setSaved("");
  }

  function chooseSaved(id: string) {
    const place = places.find((item) => item.id === id);
    if (!place) return;
    setSaved(id);
    if (place.city) setCity(place.city);
    if (place.district) setDistrict(place.district);
    setAddress(place.address);
    setError("");
  }

  function nextFromDelivery() {
    const next: { name?: string; phone?: string; address?: string } = {};
    if (!name.trim()) next.name = "Ismni kiriting";
    if (!isUzPhone(phone)) next.phone = "Telefon +998 XX XXX XX XX ko‘rinishida bo‘lsin";
    if (!address.trim()) next.address = "Manzilni kiriting";
    setFields(next);
    if (next.name || next.phone || next.address) {
      setError("Qizil maydonlarni to‘ldiring");
      return;
    }
    setError("");
    go(2);
  }

  function applyPromo() {
    setPromoError(promo.trim() ? "Promokod mavjud emas" : "Promokod kiriting");
  }

  async function confirm() {
    if (!oferta) {
      setError("Ofertani tasdiqlang");
      return;
    }
    const note = [comment.trim(), delivery === "pickup" ? "Olib ketaman" : ""].filter(Boolean).join(". ");
    const result = await createOrder({
      name: name.trim(),
      phone: phone.trim(),
      city,
      address: address.trim(),
      note,
      payment: apiPay(),
      items: items.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
        size: item.size,
        color: item.color,
        source: item.source,
        expiryMonths: item.expiryMonths,
      })),
    });
    if (!result.ok) {
      setError(result.reason);
      return;
    }
    const order: MobileOrder = {
      id: result.order.id,
      number: result.order.id,
      date: stamp(new Date(result.order.createdAt)),
      seller: result.order.shopName || items[0]?.product.shopName || "StomaHub Market",
      status: "jarayonda",
      itemCount: items.reduce((sum, item) => sum + item.qty, 0),
      total: result.order.total,
      images: items.slice(0, 3).map((item) => item.product.image),
      extra: Math.max(0, items.length - 3),
      place: [district, city].filter(Boolean).join(", "),
      delivery,
      items: items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image: item.product.image,
        qty: item.qty,
      })),
    };
    clear();
    setPlaced(order);
    setError("");
    setStep("success");
  }

  const subtitle = step === 2
    ? "To‘lov usulini tanlang"
    : step === 3
      ? "Ma‘lumotlarni tekshirib, tasdiqlang"
      : "Mahsulotlaringizni rasmiylashtirish";

  return (
    <div className="ck lg:hidden" data-testid="mobile-checkout" data-step={step}>
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <button type="button" className="mh-ic" aria-label="Qidiruv" aria-expanded={searchOpen} onClick={() => setSearchOpen((value) => !value)}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {lines > 0 ? <span className="mh-badge" data-testid="ck-cart-badge">{lines > 9 ? "9+" : lines}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>

      <div className="ck-body">
        <div>
          <h1 className="ck-title">Buyurtma berish</h1>
          {step !== "success" ? <p className="ck-sub">{subtitle}</p> : null}
        </div>
        {searchOpen ? (
          <label className="ck-search">
            <Search />
            <input aria-label="Mahsulot qidirish" placeholder="Mahsulot qidirish" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        ) : null}

        {booted && lines === 0 && step !== "success" ? (
          <div className="ck-empty" data-testid="ck-empty">
            <h2>Savat bo‘sh</h2>
            <p>Marketplacedan mahsulot qo‘shing.</p>
            <Link href="/savat">Savatga o‘tish</Link>
          </div>
        ) : null}

        {step !== "success" && lines > 0 ? (
          <>
            <div className="ck-steps" data-testid="ck-step">
              {STEPS.map((item) => {
                const state = step === item.id ? "on" : typeof step === "number" && step > item.id ? "done" : "";
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ck-step ${state}`}
                    data-testid={`ck-step-${item.id}`}
                    onClick={() => {
                      if (typeof step === "number" && item.id < step) go(item.id);
                    }}
                  >
                    <i>{state === "done" ? <Check strokeWidth={3} /> : item.id}</i>
                    <b>{item.label}</b>
                  </button>
                );
              })}
            </div>

            {step === 1 ? (
              <>
                <section className="ck-card" data-testid="ck-cart">
                  <button type="button" className="ck-cart-top" aria-expanded={cartOpen} onClick={() => setCartOpen((value) => !value)}>
                    <span className="ck-count">{lines}</span>
                    <span>
                      <b>{lines} ta mahsulot</b>
                      <small>Savatingizdagi mahsulotlar</small>
                    </span>
                    <strong className="ck-sum">{formatMoney(goods, "UZS")}</strong>
                    <ChevronDown className={cartOpen ? "ck-chev open" : "ck-chev"} />
                  </button>
                  {cartOpen ? (
                    <div className="ck-thumbs">
                      {thumbs.map((item) => <img key={item.key} src={item.product.image} alt="" />)}
                      {more > 0 ? <span className="ck-more">+{more}</span> : null}
                    </div>
                  ) : null}
                </section>

                <section className="ck-card">
                  <div className="ck-sec">
                    <MapPin />
                    <div>
                      <b>Yetkazib berish ma‘lumotlari</b>
                      <span>Buyurtmangiz qayerga yetkazilsin?</span>
                    </div>
                  </div>
                  <div className="ck-grid">
                    <label className={fields.name ? "ck-field bad" : "ck-field"}>
                      <em>Ism va familiya</em>
                      <User className="lead" />
                      <input aria-label="Ism va familiya" value={name} onChange={(event) => { setName(event.target.value); setFields((cur) => ({ ...cur, name: undefined })); }} />
                      {fields.name ? <small className="err">{fields.name}</small> : null}
                    </label>
                    <label className={fields.phone ? "ck-field bad" : "ck-field"}>
                      <em>Telefon raqami</em>
                      <Phone className="lead" />
                      <input aria-label="Telefon raqami" inputMode="tel" placeholder="+998 XX XXX XX XX" value={phone} onChange={(event) => { setPhone(formatUzPhone(event.target.value)); setFields((cur) => ({ ...cur, phone: undefined })); }} />
                      {fields.phone ? <small className="err">{fields.phone}</small> : null}
                    </label>
                    <label className="ck-field">
                      <em>Shahar</em>
                      <BookOpen className="lead" />
                      <select aria-label="Shahar" value={city} onChange={(event) => chooseCity(event.target.value)}>
                        {CITIES.map((item) => <option key={item}>{item}</option>)}
                      </select>
                      <span className="tail"><ChevronDown /></span>
                    </label>
                    <label className="ck-field">
                      <em>Tuman</em>
                      <BookOpen className="lead" />
                      <select aria-label="Tuman" value={district} onChange={(event) => { setDistrict(event.target.value); setSaved(""); }}>
                        {districts.map((item) => <option key={item}>{item}</option>)}
                      </select>
                      <span className="tail"><ChevronDown /></span>
                    </label>
                  </div>
                  <label className={fields.address ? "ck-field bad" : "ck-field"}>
                    <em>Aniq manzil</em>
                    <MapPin className="lead" />
                    <input aria-label="Aniq manzil" value={address} onChange={(event) => { setAddress(event.target.value); setSaved(""); setFields((cur) => ({ ...cur, address: undefined })); }} />
                    {fields.address ? <small className="err">{fields.address}</small> : null}
                    {address ? (
                      <button type="button" className="tail clear" aria-label="Tozalash" onClick={() => { setAddress(""); setSaved(""); }}>
                        <X />
                      </button>
                    ) : null}
                  </label>
                  <button type="button" className="ck-map" data-testid="ck-map" onClick={() => setMapOpen(true)}>
                    <Map /> Xaritadan tanlash
                  </button>
                </section>

                <div className="ck-label">
                  <span>Saqlangan manzillar</span>
                  {places.length > 2 ? (
                    <button type="button" data-testid="ck-places-all" onClick={() => setAllPlaces((value) => !value)}>
                      {allPlaces ? "Yig‘ish" : "Barchasini ko‘rish"}
                    </button>
                  ) : null}
                </div>
                <div role="radiogroup" aria-label="Saqlangan manzillar">
                  {placesLoaded && places.length === 0 ? (
                    <p className="ck-sub">Hozircha saqlangan manzil yo‘q. Manzilni yuqoridagi maydonga yozing.</p>
                  ) : (allPlaces ? places : places.slice(0, 2)).map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      role="radio"
                      aria-checked={saved === place.id}
                      data-testid={`ck-place-${place.id}`}
                      className={saved === place.id ? "ck-place on" : "ck-place"}
                      onClick={() => chooseSaved(place.id)}
                    >
                      <span className="ck-ico"><MapPin /></span>
                      <span>
                        <b>{place.label}</b>
                        <small>{[place.district, place.address].filter(Boolean).join(", ")}</small>
                      </span>
                      <i className="ck-radio" />
                    </button>
                  ))}
                </div>

                <label className="ck-field">
                  <em>Izoh (ixtiyoriy)</em>
                  <MessageSquare className="lead" />
                  <textarea aria-label="Izoh" placeholder="Masalan: qo‘ng‘iroq qilib kelishilsin..." value={comment} onChange={(event) => setComment(event.target.value)} />
                </label>

                <section className="ck-card">
                  <div className="ck-sec">
                    <Truck />
                    <div>
                      <b>Yetkazish usuli</b>
                      <span>Sizga qulay usulni tanlang</span>
                    </div>
                  </div>
                  <div role="radiogroup" aria-label="Yetkazish usuli">
                    <button type="button" role="radio" aria-checked={delivery === "courier"} data-testid="ck-ship-courier" className={delivery === "courier" ? "ck-ship on" : "ck-ship"} onClick={() => setDelivery("courier")}>
                      <span className="ck-ico"><User /></span>
                      <span>
                        <b>Kuryer orqali</b>
                        <small>Toshkent bo‘ylab yetkazib berish</small>
                      </span>
                      <span className="ck-eta">Bugun / Ertaga</span>
                      <i className="ck-radio" />
                    </button>
                    <button type="button" role="radio" aria-checked={delivery === "pickup"} data-testid="ck-ship-pickup" className={delivery === "pickup" ? "ck-ship on" : "ck-ship"} onClick={() => setDelivery("pickup")}>
                      <span className="ck-ico"><Store /></span>
                      <span>
                        <b>Olib ketish</b>
                        <small>Do‘kondan o‘zingiz olib ketasiz</small>
                      </span>
                      <span className="ck-eta">Bugun</span>
                      <i className="ck-radio" />
                    </button>
                  </div>
                </section>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <section className="ck-card">
                  <div className="ck-sec">
                    <CreditCard />
                    <div>
                      <b>To‘lov usuli</b>
                      <span>Sizga qulay to‘lov usulini tanlang</span>
                    </div>
                  </div>
                  <div className="ck-pays" role="radiogroup" aria-label="To‘lov usuli">
                    {PAYS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={!item.soon && pay === item.id}
                        aria-disabled={item.soon || undefined}
                        disabled={item.soon}
                        data-testid={`ck-pay-${item.id}`}
                        className={!item.soon && pay === item.id ? "ck-pay on" : "ck-pay"}
                        onClick={() => { if (!item.soon) setPay(item.id); }}
                      >
                        <PayMark mark={item.mark} color={item.color} />
                        <span>
                          <b>{item.title}</b>
                          <small>{item.hint}</small>
                        </span>
                        <i className="ck-radio" />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="ck-card">
                  <div className="ck-sec">
                    <Percent />
                    <div>
                      <b>Promokod</b>
                      <span>Chegirma olish uchun promokod kiriting</span>
                    </div>
                  </div>
                  <div className="ck-promo">
                    <input
                      aria-label="Promokod"
                      data-testid="ck-promo"
                      placeholder="Promokod kiriting..."
                      value={promo}
                      onChange={(event) => setPromo(event.target.value)}
                    />
                    <button type="button" className="ck-apply" data-testid="ck-apply" onClick={applyPromo}>Qo‘llash</button>
                  </div>
                  {promoError ? <p className="ck-promo-err" data-testid="ck-promo-error">{promoError}</p> : null}
                </section>

                <Summary goods={goods} lines={lines} city={city} delivery={delivery} fee={deliveryFee} total={total} />
                <div className="ck-safe">
                  <ShieldCheck />
                  <div>
                    <b>Xavfsiz to‘lov</b>
                    <span>Barcha to‘lovlar himoyalangan va shifrlangan</span>
                  </div>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <section className="ck-card">
                  <div className="ck-card-top">
                    <ShoppingCart />
                    <span>
                      <b>Mahsulotlar ({lines} ta)</b>
                      <small>Savatdagi mahsulotlar</small>
                    </span>
                    <Link href="/savat" className="ck-edit">O‘zgartirish</Link>
                  </div>
                  {shown.map((item) => (
                    <div key={item.key} className="ck-prod">
                      <img src={item.product.image} alt="" />
                      <div>
                        <b>{item.product.name}</b>
                        <small>{apparelMetaLabel(item.size, item.color) || item.product.brand}</small>
                      </div>
                      <div>
                        <em>{item.qty} dona</em>
                        <strong>{formatMoney(item.lineTotal, "UZS")}</strong>
                      </div>
                    </div>
                  ))}
                </section>

                <section className="ck-card">
                  <div className="ck-card-top">
                    <MapPin />
                    <span><b>Yetkazib berish manzili</b></span>
                    <button type="button" className="ck-edit" data-testid="ck-edit-address" onClick={() => go(1)}>O‘zgartirish</button>
                  </div>
                  <p className="ck-prod" style={{ display: "block", paddingTop: 8 }}>
                    <b>{name}</b>
                    <small style={{ display: "block" }}>{phone}</small>
                    <small style={{ display: "block" }}>{city}, {address}</small>
                  </p>
                </section>

                <section className="ck-card">
                  <div className="ck-card-top">
                    <Truck />
                    <span><b>Yetkazish ma‘lumotlari</b></span>
                    <button type="button" className="ck-edit" data-testid="ck-edit-delivery" onClick={() => go(1)}>O‘zgartirish</button>
                  </div>
                  <div className="ck-ship" style={{ marginTop: 8, border: 0, padding: 0 }}>
                    <span className="ck-ico">{delivery === "courier" ? <User /> : <Store />}</span>
                    <span>
                      <b>{delivery === "courier" ? "Kuryer orqali" : "Olib ketish"}</b>
                      <small>{delivery === "courier" ? "Toshkent bo‘ylab yetkazib berish" : "Do‘kondan o‘zingiz olib ketasiz"}</small>
                    </span>
                    <span className="ck-eta">{delivery === "courier" ? eta : "Bugun"}</span>
                  </div>
                </section>

                <section className="ck-card">
                  <div className="ck-card-top">
                    <CreditCard />
                    <span><b>To‘lov usuli</b></span>
                    <button type="button" className="ck-edit" data-testid="ck-edit-pay" onClick={() => go(2)}>O‘zgartirish</button>
                  </div>
                  <div className="ck-ship" style={{ marginTop: 8, border: 0, padding: 0 }}>
                    <PayMark mark={payMeta.mark} color={payMeta.color} />
                    <span>
                      <b>{payMeta.title}</b>
                      <small>{payMeta.hint}</small>
                    </span>
                  </div>
                </section>

                <Summary goods={goods} lines={lines} city={city} delivery={delivery} fee={deliveryFee} total={total} />
                <label className="ck-offer">
                  <input type="checkbox" data-testid="ck-oferta" checked={oferta} onChange={(event) => { setOferta(event.target.checked); setError(""); }} />
                  Ommaviy oferta bilan tanishdim va roziman
                </label>
              </>
            ) : null}
            <div className="ck-pad" />
          </>
        ) : null}

        {step === "success" && placed ? (
          <div className="ck-success" data-testid="ck-success">
            <div className="ck-ok"><Check strokeWidth={2.6} /></div>
            <h2>Buyurtma qabul qilindi</h2>
            <p>Buyurtma raqami</p>
            <b data-testid="ck-order-number">{placed.number}</b>
            <p>Jami {formatMoney(placed.total, "UZS")}</p>
            <Link href={`/buyurtmalarim/${placed.id}`} className="ck-next" data-testid="ck-success-track">Buyurtmani kuzatish</Link>
            <Link href="/buyurtmalarim" className="ck-back" data-testid="ck-success-orders">Buyurtmalarim</Link>
          </div>
        ) : null}
      </div>

      {step === 1 && lines > 0 ? (
        <div className="ck-bar" data-testid="ck-bar">
          {error ? <p className="ck-error" data-testid="ck-error">{error}</p> : null}
          <button type="button" className="ck-next" data-testid="ck-next" onClick={nextFromDelivery}>
            Davom etish <ArrowRight />
          </button>
          <p>Keyingi bosqich: to‘lov</p>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="ck-bar" data-testid="ck-bar">
          <div className="ck-row">
            <button type="button" className="ck-back" data-testid="ck-back" onClick={() => go(1)}>
              <ArrowLeft /> Orqaga
            </button>
            <button type="button" className="ck-next" data-testid="ck-next" onClick={() => go(3)}>
              Davom etish <ArrowRight />
            </button>
          </div>
          <p>Keyingi bosqich: tasdiqlash</p>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="ck-bar" data-testid="ck-bar">
          {error ? <p className="ck-error" data-testid="ck-error">{error}</p> : null}
          <button type="button" className="ck-next" data-testid="ck-confirm" onClick={confirm}>
            Buyurtmani tasdiqlash <ArrowRight />
          </button>
        </div>
      ) : null}

      {mapOpen ? (
        <div className="ck-sheet" role="dialog" aria-label="Xaritadan tanlash" data-testid="ck-map-sheet">
          <button type="button" aria-label="Yopish" data-testid="ck-map-close" className="absolute inset-0" onClick={() => setMapOpen(false)} />
          <div className="ck-box">
            <h3>Saqlangan manzillar</h3>
            {places.length === 0 ? (
              <p className="ck-sub">Hozircha saqlangan manzil yo‘q. Manzilni maydonga yozing.</p>
            ) : places.map((place) => (
              <button
                key={place.id}
                type="button"
                className="pick"
                data-testid={`ck-map-${place.id}`}
                onClick={() => {
                  chooseSaved(place.id);
                  setMapOpen(false);
                }}
              >
                {[place.label, place.address].filter(Boolean).join(" — ")}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Summary({
  goods,
  lines,
  city,
  delivery,
  fee,
  total,
}: {
  goods: number;
  lines: number;
  city: string;
  delivery: ShipId;
  fee: number;
  total: number;
}) {
  const ship = delivery === "courier" ? `Yetkazish (${city}, kuryer)` : "Olib ketish";
  return (
    <section className="ck-card">
      <div className="ck-sec">
        <BookOpen />
        <div>
          <b>Buyurtma xulosasi</b>
          <span>Buyurtmangiz tafsilotlari</span>
        </div>
      </div>
      <p className="ck-line"><span>Mahsulotlar ({lines} ta)</span><b>{formatMoney(goods, "UZS")}</b></p>
      <p className="ck-line"><span>{ship}</span><b className={fee > 0 ? undefined : "free"}>{fee > 0 ? formatMoney(fee, "UZS") : "Bepul"}</b></p>
      <p className="ck-jami"><span>Jami</span><b data-testid="ck-total">{formatMoney(total, "UZS")}</b></p>
    </section>
  );
}
