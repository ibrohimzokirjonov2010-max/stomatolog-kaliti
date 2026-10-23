"use client";
/* eslint-disable @next/next/no-img-element -- order photos are content images */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Clock, FileText, Headphones, Search, ShoppingCart, Store, Truck, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { NotificationBell } from "@/components/notification-bell";
import { formatMoney } from "@/lib/format";
import {
  orderChips,
  orderStatusMeta,
  type MobileOrder,
  type MobileOrderStatus,
} from "@/data/mobile-orders";
import { loadOrders, syncOrders } from "@/lib/orders";
import { toMobileOrder } from "@/lib/order-present";
import type { Product } from "@/data/products";
import "./orders-mobile.css";

function productOf(order: MobileOrder, item: MobileOrder["items"][number]): Product {
  return {
    id: item.id,
    name: item.name,
    brand: order.seller,
    shopName: order.seller,
    category: "materiallar",
    price: item.price,
    rating: 5,
    reviews: 1,
    inStock: true,
    delivery: "Toshkent",
    image: item.image,
    stockQty: 8,
  };
}

export function reorderMobileOrder(add: ReturnType<typeof useCart>["add"], order: MobileOrder) {
  for (const item of order.items) {
    add(item.id, productOf(order, item), item.qty);
  }
}

function StatusBadge({ status }: { status: MobileOrderStatus }) {
  const Icon = status === "yetkazildi" ? Check : status === "yetkazilmoqda" ? Truck : status === "jarayonda" ? Clock : X;
  return (
    <span className={`od-badge ${status}`}>
      <Icon strokeWidth={2.6} />
      {orderStatusMeta[status].label}
    </span>
  );
}

function Tracker({ order }: { order: MobileOrder }) {
  const steps = order.steps;
  if (!steps?.length) return null;
  const current = Math.max(0, steps.findIndex((step) => step.state === "current"));
  const pct = (current / (steps.length - 1)) * 100;
  return (
    <div className="od-track" data-testid="od-track">
      <i className="od-rail" style={{ background: `linear-gradient(90deg, #0b7f7d ${pct}%, #e6ebf2 ${pct}%)` }} />
      {steps.map((step) => (
        <div key={step.title} className={`od-step ${step.state === "done" ? "done" : step.state === "current" ? "now" : "todo"}`}>
          <span className="od-dot">
            {step.state === "done" ? <Check strokeWidth={3} /> : step.state === "current" ? <Truck strokeWidth={2.4} /> : null}
          </span>
          <strong>{step.title}</strong>
          <em>{step.when}</em>
        </div>
      ))}
    </div>
  );
}

export function OrderSupportSheet({ order, onClose }: { order: MobileOrder; onClose: () => void }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="od-sheet" role="dialog" aria-label="Qo‘llab-quvvatlash" data-testid="od-support-sheet">
      <button type="button" aria-label="Yopish" data-testid="od-support-close" className="absolute inset-0" onClick={onClose} />
      <div className="od-box">
        <h3>Qo‘llab-quvvatlash</h3>
        <p>{order.number} · {order.seller}</p>
        {sent ? (
          <p className="od-note" data-testid="od-support-sent">So‘rov yuborildi</p>
        ) : (
          <>
            <textarea value={text} placeholder="Muammoni qisqacha yozing" onChange={(event) => setText(event.target.value)} />
            {error ? <p>{error}</p> : null}
            <button
              type="button"
              className="od-btn od-teal"
              onClick={() => {
                if (text.trim().length < 3) {
                  setError("Xabarni yozing");
                  return;
                }
                setError("");
                setSent(true);
              }}
            >
              Yuborish
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function OrdersMobileList() {
  const cart = useCart();
  const lines = cart.items.length;
  const [status, setStatus] = useState<"all" | MobileOrderStatus>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [supportId, setSupportId] = useState<string | null>(null);
  const [placed, setPlaced] = useState<MobileOrder[]>([]);
  useEffect(() => {
    const load = () => setPlaced(loadOrders().map(toMobileOrder));
    void syncOrders(true).then(load);
    window.addEventListener("sk-orders-changed", load);
    return () => window.removeEventListener("sk-orders-changed", load);
  }, []);
  const orders = placed;
  const counts = useMemo(() => {
    const next: Record<string, number> = { all: orders.length };
    for (const order of orders) next[order.status] = (next[order.status] ?? 0) + 1;
    return next;
  }, [orders]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (!q) return true;
      return `${order.number} ${order.seller}`.toLowerCase().includes(q);
    });
  }, [orders, query, status]);
  const support = orders.find((order) => order.id === supportId) ?? null;

  return (
    <div className="od lg:hidden" data-testid="mobile-buyurtmalar">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/" className="mh-logo">STOMA<span>HUB</span></Link>
        <button type="button" className="mh-ic" aria-label="Qidiruv" aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)}>
          <Search />
        </button>
        <Link href="/savat" className="mh-ic" aria-label="Savat">
          <ShoppingCart />
          {lines > 0 ? <span className="mh-badge" data-testid="od-cart-badge">{lines > 9 ? "9+" : lines}</span> : null}
        </Link>
        <NotificationBell variant="mobile" buttonClassName="size-10 text-[#1a1d26]" />
      </header>
      <div className="od-body">
        <div>
          <h1 className="od-title">Mening buyurtmalarim</h1>
          <p className="od-sub">Buyurtmalaringiz holatini kuzating va tafsilotlarini ko‘ring.</p>
        </div>
        {searchOpen ? (
          <label className="od-search">
            <Search />
            <input
              value={query}
              placeholder="SK raqam yoki sotuvchi"
              aria-label="Buyurtma qidirish"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        ) : null}
        <div className="od-chips">
          {orderChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={status === chip.id ? "on" : undefined}
              data-testid={`od-chip-${chip.id}`}
              aria-pressed={status === chip.id}
              onClick={() => setStatus(chip.id)}
            >
              {chip.label} ({counts[chip.id] ?? 0})
            </button>
          ))}
        </div>
        {rows.length === 0 ? <p className="od-empty">Mos buyurtma yo‘q</p> : null}
        <div className="od-list">
          {rows.map((order) => (
            <article key={order.id} className="od-card" data-testid={`od-card-${order.id}`}>
              <div className="od-top">
                <Link href={`/buyurtmalarim/${order.id}`} className="od-sk">{order.number}</Link>
                <span className="od-date">{order.date}</span>
                <StatusBadge status={order.status} />
                <Link href={`/buyurtmalarim/${order.id}`} aria-label={`${order.number} batafsil`}>
                  <ChevronRight className="od-chev" />
                </Link>
              </div>
              <p className="od-seller"><Store /> {order.seller}</p>
              <Tracker order={order} />
              <div className="od-goods">
                <div className="od-meta">
                  <div className="od-thumbs">
                    {order.images.map((src) => <img key={src} src={src} alt="" />)}
                    {order.extra > 0 ? <span className="od-more">+{order.extra} ta</span> : null}
                  </div>
                  <span className="od-count">{order.itemCount} ta mahsulot</span>
                </div>
                <b className="od-price">{formatMoney(order.total, "UZS")}</b>
              </div>
              <div className="od-actions">
                <Link href={`/buyurtmalarim/${order.id}`} className="od-btn od-ghost">
                  <FileText /> Batafsil
                </Link>
                {order.status === "yetkazilmoqda" ? (
                  <button type="button" className="od-btn od-ghost" data-testid={`od-support-${order.id}`} onClick={() => setSupportId(order.id)}>
                    <Headphones /> Qo‘llab-quvvatlash
                  </button>
                ) : (
                  <button type="button" className="od-btn od-teal" data-testid={`od-reorder-${order.id}`} onClick={() => reorderMobileOrder(cart.add, order)}>
                    <ShoppingCart /> Qayta buyurtma
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="od-pad" />
      </div>
      <Link href="/marketplace" className="od-go" data-testid="od-go">
        <ShoppingCart /> Xaridni davom ettirish →
      </Link>
      {support ? <OrderSupportSheet order={support} onClose={() => setSupportId(null)} /> : null}
    </div>
  );
}
