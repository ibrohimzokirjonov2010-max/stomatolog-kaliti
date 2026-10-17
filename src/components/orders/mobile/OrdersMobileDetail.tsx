"use client";
/* eslint-disable @next/next/no-img-element -- order photos are content images */

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Headphones, ShoppingCart, Store } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { MobileMenuButton } from "@/components/dashboard/mobile-chrome";
import { formatMoney } from "@/lib/format";
import type { MobileOrder } from "@/data/mobile-orders";
import { OrderSupportSheet, reorderMobileOrder } from "./OrdersMobileList";
import "./orders-mobile.css";

export function OrdersMobileDetail({ order }: { order: MobileOrder }) {
  const cart = useCart();
  const [support, setSupport] = useState(false);
  return (
    <article className="od lg:hidden" data-testid="mobile-buyurtma">
      <header className="mh-bar">
        <MobileMenuButton />
        <Link href="/buyurtmalarim" className="od-back" aria-label="Orqaga"><ArrowLeft /></Link>
        <h1 className="od-title" style={{ fontSize: 18 }}>{order.number}</h1>
      </header>
      <div className="od-body">
        <p className="od-date">{order.date}</p>
        <p className="od-seller"><Store /> {order.seller}</p>
        <div className="od-lines">
          {order.items.map((item) => (
            <div key={item.id} className="od-line">
              <img src={item.image} alt="" />
              <div>
                <b>{item.name}</b>
                <span>{item.qty} ta</span>
              </div>
              <strong>{formatMoney(item.price * item.qty, "UZS")}</strong>
            </div>
          ))}
        </div>
        <p className="od-price">{formatMoney(order.total, "UZS")}</p>
        <div className="od-actions">
          <Link href="/buyurtmalarim" className="od-btn od-ghost"><FileText /> Ro‘yxat</Link>
          {order.status === "yetkazilmoqda" ? (
            <button type="button" className="od-btn od-ghost" onClick={() => setSupport(true)}>
              <Headphones /> Qo‘llab-quvvatlash
            </button>
          ) : (
            <button type="button" className="od-btn od-teal" onClick={() => reorderMobileOrder(cart.add, order)}>
              <ShoppingCart /> Qayta buyurtma
            </button>
          )}
        </div>
      </div>
      {support ? <OrderSupportSheet order={order} onClose={() => setSupport(false)} /> : null}
    </article>
  );
}
