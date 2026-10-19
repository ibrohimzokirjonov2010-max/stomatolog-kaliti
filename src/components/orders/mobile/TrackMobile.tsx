"use client";
/* eslint-disable @next/next/no-img-element -- order and courier photos are content images */

import { useState } from "react";
import Link from "next/link";
import { Calendar, Check, ChevronRight, FileText, Headphones, Home, ShoppingBag, ShoppingCart, Store, Truck } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { formatMoney } from "@/lib/format";
import type { MobileOrder, MobileOrderStatus } from "@/data/mobile-orders";
import { OrderSupportSheet } from "./OrdersMobileList";
import "./track-mobile.css";

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const STEP_COPY = [
  { title: "Qabul qilindi", text: "Buyurtmangiz qabul qilindi." },
  { title: "Tayyorlanmoqda", text: "Sotuvchi mahsulotlarni tayyorlamoqda." },
  { title: "Yo‘lda", text: "Kuryer buyurtmangizni manzilga olib ketmoqda." },
  { title: "Yetkazildi", text: "Buyurtma manzilingizga yetkaziladi." },
];

function parseWhen(date: string) {
  const [day, clock] = date.split(" ");
  const parsed = new Date(`${day}T${clock || "12:00"}`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function label(date: Date, withYear = false) {
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  const head = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return { day: withYear ? `${head}, ${date.getFullYear()}` : `${head}, ${time}`, time, head };
}

function activeIndex(status: MobileOrderStatus) {
  if (status === "yetkazildi") return 4;
  if (status === "yetkazilmoqda") return 2;
  if (status === "bekor") return 0;
  return 0;
}

function headline(order: MobileOrder) {
  if (order.status === "yetkazildi") return { title: "yetkazildi", text: "Buyurtma manzilingizga yetkazildi." };
  if (order.status === "bekor") return { title: "bekor qilindi", text: "Buyurtma bekor qilindi." };
  if (order.delivery === "pickup") return { title: "qabul qilindi", text: "Buyurtmangiz qabul qilindi. Do‘kondan olib ketishingiz mumkin." };
  return { title: "qabul qilindi", text: "Buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada sizga yetkazib beriladi." };
}

export function TrackMobile({ order }: { order: MobileOrder | undefined }) {
  const lines = useCart().items.length;
  const [help, setHelp] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(false);

  return (
    <div className="tr lg:hidden" data-testid="mobile-track">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMAHUB</Link>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {lines > 0 ? <span className="mh-badge" data-testid="tr-cart-badge">{lines > 9 ? "9+" : lines}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="tr-body">
        <div>
          <h1 className="tr-title">Buyurtmani kuzatish</h1>
          <p className="tr-sub">Buyurtma holatini real vaqtda kuzating.</p>
        </div>
        {order ? <TrackBody order={order} itemsOpen={itemsOpen} onItems={() => setItemsOpen((value) => !value)} /> : (
          <div className="tr-empty" data-testid="tr-missing">
            <h2>Buyurtma topilmadi</h2>
            <Link href="/buyurtmalarim">Buyurtmalarim</Link>
          </div>
        )}
        <div className="tr-pad" />
      </div>
      {order ? (
        <div className="tr-bar" data-testid="tr-bar">
          <button type="button" className="tr-help" data-testid="tr-help" onClick={() => setHelp(true)}>
            <Headphones /> Yordam
          </button>
          <Link href="/buyurtmalarim" className="tr-go" data-testid="tr-orders">
            <FileText /> Buyurtmalarim
          </Link>
        </div>
      ) : null}
      {help && order ? <OrderSupportSheet order={order} onClose={() => setHelp(false)} /> : null}
    </div>
  );
}

function TrackBody({
  order,
  itemsOpen,
  onItems,
}: {
  order: MobileOrder;
  itemsOpen: boolean;
  onItems: () => void;
}) {
  const when = parseWhen(order.date);
  const head = headline(order);
  const active = activeIndex(order.status);
  const thumbs = order.images.slice(0, 5);
  const more = order.extra > 0 ? order.extra : Math.max(0, order.items.length - thumbs.length);
  const area = order.place?.split(",")[0]?.trim() || "Yunusobod";
  const onRoad = order.status === "yetkazilmoqda" && order.delivery !== "pickup";
  const etaTitle = order.delivery === "pickup" ? "Olib ketish" : onRoad ? "Kuryer yo‘lda" : order.status === "yetkazildi" ? "Yetkazildi" : "Kuryer tayyorlanmoqda";
  const etaValue = order.delivery === "pickup" ? "Bugun" : onRoad ? "35 daqiqa" : order.status === "yetkazildi" ? "Yetib bordi" : "Tez orada";

  return (
    <>
      <section className="tr-card tr-status">
        <span className="tr-check"><Check strokeWidth={2.6} /></span>
        <div>
          <b>Buyurtma #{order.number}</b>
          <strong className="tr-state">{head.title}</strong>
          <p>{head.text}</p>
        </div>
        <div className="tr-date">
          <Calendar />
          <span>Buyurtma sanasi</span>
          <strong>{when ? label(when, true).day : order.date}</strong>
          <em>{when ? label(when).time : ""}</em>
        </div>
      </section>

      <section className="tr-card tr-steps" data-testid="tr-steps">
        {STEP_COPY.map((step, index) => {
          const state = index < active ? "done" : index === active ? "on" : "";
          const at = when ? label(new Date(when.getTime() + index * 50 * 60000)) : null;
          const time = state ? at?.day ?? "" : "Kutilmoqda";
          return (
            <div key={step.title} className={`tr-step ${state}`} data-testid={`tr-step-${index}`}>
              <span className="tr-dot">{state === "on" && index === 2 ? <Truck /> : state ? <Check strokeWidth={3} /> : null}</span>
              <div>
                <b>{step.title}</b>
                <small>{time}</small>
              </div>
              <p>{step.text}</p>
            </div>
          );
        })}
      </section>

      <section className="tr-map" data-testid="tr-map" aria-label="Yetkazish xaritasi">
        <MapArt area={area} />
        <span className="tr-pin shop" aria-hidden><Store /></span>
        {order.delivery !== "pickup" ? <span className="tr-truck" aria-hidden><Truck /></span> : null}
        <span className="tr-pin home" aria-hidden><Home /></span>
        <div className="tr-eta">
          <i><Truck /></i>
          <div>
            <b>{etaTitle}</b>
            <span>Taxminiy vaqt</span>
            <strong>{etaValue}</strong>
          </div>
        </div>
      </section>

      {order.delivery !== "pickup" ? (
        <section className="tr-card tr-courier">
          <div>
            <b>Kuryer biriktirilmagan</b>
            <small>Yetkazib berish holati to‘lovdan keyin yangilanadi</small>
          </div>
        </section>
      ) : null}

      <section className="tr-card">
        <div className="tr-goods-top">
          <ShoppingBag />
          <b>Mahsulotlar ({order.itemCount} ta)</b>
          <button type="button" className="tr-link" data-testid="tr-items" onClick={onItems}>
            Batafsil <ChevronRight />
          </button>
        </div>
        <div className="tr-thumbs">
          {thumbs.map((src) => <img key={src} src={src} alt="" />)}
          {more > 0 ? <span className="tr-more">+{more}</span> : null}
        </div>
        {itemsOpen ? order.items.map((item) => (
          <p key={item.id} className="tr-item"><span>{item.name} · {item.qty} ta</span><b>{formatMoney(item.price * item.qty, "UZS")}</b></p>
        )) : null}
        <p className="tr-sum"><span>Jami summa</span><b data-testid="tr-total">{formatMoney(order.total, "UZS")}</b></p>
      </section>
    </>
  );
}

function MapArt({ area }: { area: string }) {
  return (
    <svg viewBox="0 0 360 148" role="img">
      <rect width="360" height="148" fill="#e7eef6" />
      <path d="M0 36 H360 M0 78 H360 M0 118 H360 M70 0 V148 M150 0 V148 M230 0 V148 M300 0 V148" stroke="#f7fafc" strokeWidth="10" />
      <path d="M0 36 H360 M0 78 H360 M0 118 H360 M70 0 V148 M150 0 V148 M230 0 V148 M300 0 V148" stroke="#d5e0ec" strokeWidth="1" />
      <path d="M20 40 H120 V90 H20 Z" fill="#dceadf" />
      <path d="M250 20 H340 V70 H250 Z" fill="#e4eaf2" />
      <path d="M48 112 C 110 104, 140 78, 175 86 S 230 70, 250 58 S 290 40, 318 36" fill="none" stroke="#0066ff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="48" cy="112" r="5" fill="#0066ff" />
      <circle cx="318" cy="36" r="5" fill="#0066ff" />
      <text x="168" y="28" fill="#8b93a7" fontSize="11" fontFamily="sans-serif">{area}</text>
      <text x="96" y="132" fill="#8b93a7" fontSize="10" fontFamily="sans-serif">Amir Temur ko‘chasi</text>
      <text x="286" y="92" fill="#8b93a7" fontSize="10" fontFamily="sans-serif">Minor</text>
    </svg>
  );
}
