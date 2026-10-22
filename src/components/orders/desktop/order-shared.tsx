"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Truck } from "lucide-react";
import { DELIVERY_LINE_ID } from "@/lib/cart-totals";
import { formatGroupedNumber } from "@/lib/format";
import { getOrder, isPickupOrder, ordersLoaded, startOrdersPolling, syncOrders, type Order, type OrderItem, type OrderStatus } from "@/lib/orders";

export const SUPPORT_URL = "https://t.me/stomahubuz";

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

export function som(n: number) {
  return `${formatGroupedNumber(Math.round(n))} so‘m`;
}

export function stamp(iso?: string, year = true) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const hm = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}${year ? ` ${date.getFullYear()}` : ""}, ${hm}`;
}

export function isDeliveryLine(item: OrderItem) {
  return item.productId === DELIVERY_LINE_ID || item.name === "Yetkazib berish";
}

export function orderSums(order: Order) {
  const goods = order.items.filter((item) => !isDeliveryLine(item));
  const goodsSum = goods.reduce((sum, item) => sum + item.price * item.qty, 0);
  const delivery = order.items.filter(isDeliveryLine).reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Math.max(0, goodsSum + delivery - order.total) + (order.bonusUsed ?? 0);
  return { goods, goodsSum, delivery, discount, total: order.payable ?? order.total, count: goods.reduce((sum, item) => sum + item.qty, 0) };
}

export function payTitle(order: Order) {
  return order.payment === "payme" ? "Payme" : order.payment === "naqd" ? "Naqd to‘lov" : "Click";
}

export function shopTitle(order: Order) {
  return order.shopName || order.items.find((item) => item.shopName)?.shopName || "StomaHub Market";
}

export type Tone = "go" | "prep" | "done" | "wait" | "off";

export function orderBadge(order: Order): { label: string; tone: Tone } {
  if (order.paymentState === "refunded") return { label: "Bekor qilingan", tone: "off" };
  if (order.status === "yetkazildi") return { label: "Yetkazildi", tone: "done" };
  if (order.status === "yolda") return { label: "Yo‘lda", tone: "go" };
  if (order.status === "yigilmoqda" || order.status === "yigish_tugadi") return { label: "Tayyorlanmoqda", tone: "prep" };
  if (order.status === "qabul_qilindi") return { label: "Qabul qilindi", tone: "prep" };
  return { label: "Tasdiq kutilmoqda", tone: "wait" };
}

/** Rough promise shown to the buyer; the platform has no courier ETA feed yet. */
export function etaText(order: Order) {
  if (order.paymentState === "refunded") return "";
  if (order.status === "yetkazildi") {
    const hit = [...order.statusHistory].reverse().find((entry) => entry.status === "yetkazildi");
    return hit ? `Yetkazib berildi: ${stamp(hit.at)}` : "Yetkazib berildi";
  }
  if (order.status === "yolda") return "Taxminiy yetkazish: bugun";
  const day = new Date(order.createdAt);
  day.setDate(day.getDate() + 2);
  return `Taxminiy yetkazish: ${day.getDate()} ${MONTHS[day.getMonth()]}`;
}

export type TrackStep = { key: string; title: string; hint: string; at: string; state: "done" | "current" | "todo" };

const FLOW: { key: string; statuses: OrderStatus[]; title: string; hint: string; pickupHint?: string }[] = [
  { key: "qabul", statuses: ["qabul_qilindi"], title: "Qabul qilindi", hint: "Buyurtmangiz qabul qilindi" },
  { key: "tayyor", statuses: ["yigilmoqda"], title: "Tayyorlanmoqda", hint: "Mahsulotlar tayyorlanmoqda" },
  { key: "topshirildi", statuses: ["yigish_tugadi"], title: "Kuryerga topshirildi", hint: "Kuryerga topshirildi", pickupHint: "Olib ketishga tayyor" },
  { key: "yolda", statuses: ["yolda"], title: "Yo‘lda", hint: "Kuryer manzilingizga harakatlanmoqda" },
  { key: "yetkazildi", statuses: ["yetkazildi"], title: "Yetkazildi", hint: "Buyurtma topshirildi" },
];

/** Buyer timeline built from the real status history (payment step inserted after acceptance). */
export function trackSteps(order: Order): TrackStep[] {
  const pickup = isPickupOrder(order);
  const at = (statuses: OrderStatus[]) => {
    const hit = [...order.statusHistory].reverse().find((entry) => statuses.includes(entry.status));
    return hit ? stamp(hit.at) : "";
  };
  const index = FLOW.findIndex((step) => step.statuses.includes(order.status));
  const steps: TrackStep[] = FLOW.filter((step) => !(pickup && step.key === "yolda")).map((step) => {
    const own = FLOW.indexOf(step);
    const done = index > own || (order.status === "yetkazildi" && own === index);
    return {
      key: step.key,
      title: pickup && step.key === "topshirildi" ? "Tayyor" : step.title,
      hint: pickup && step.pickupHint ? step.pickupHint : step.hint,
      at: at(step.statuses),
      state: done ? "done" : own === index ? "current" : "todo",
    };
  });
  if (order.status === "pending_accept") steps[0] = { ...steps[0], title: "Tasdiq kutilmoqda", hint: "Sotuvchi buyurtmani tasdiqlashi kutilmoqda", at: stamp(order.createdAt), state: "current" };
  const cash = order.payment === "naqd";
  const paid = Boolean(order.paidAt) || (!cash && order.paymentState !== "awaiting_payment") || (cash && order.status === "yetkazildi");
  steps.splice(1, 0, {
    key: "tolov",
    title: paid ? "To‘landi" : "To‘lov",
    hint: paid ? (cash ? "Naqd to‘lov qabul qilindi" : "To‘lov muvaffaqiyatli amalga oshirildi") : cash ? "Yetkazishda naqd to‘lanadi" : "To‘lov kutilmoqda",
    at: order.paidAt ? stamp(order.paidAt) : "",
    state: paid ? "done" : "todo",
  });
  if (order.paymentState === "refunded") return steps.map((step) => (step.state === "current" ? { ...step, state: "todo" } : step));
  return steps;
}

export function StepDot({ step }: { step: TrackStep }) {
  if (step.state === "done") return <i className="odx-dot done"><Check size={12} strokeWidth={3.5} /></i>;
  if (step.state === "current") return <i className="odx-dot now"><Truck size={13} /></i>;
  return <i className="odx-dot" />;
}

export function Timeline({ order, compact }: { order: Order; compact?: boolean }) {
  return (
    <ol className={compact ? "odx-tl compact" : "odx-tl"} data-testid="order-timeline">
      {trackSteps(order).map((step) => (
        <li key={step.key} className={step.state}>
          <StepDot step={step} />
          <div>
            <b>{step.title}</b>
            {step.at ? <span>{step.at}</span> : null}
            <small>{step.state === "todo" && !step.at ? (step.key === "tolov" ? step.hint : "Kutilmoqda") : step.hint}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Live order from the shared cache, kept fresh by polling. `null` = not mine / not found. */
export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const read = useCallback(() => {
    const hit = getOrder(id);
    if (hit) setOrder(hit);
    else if (ordersLoaded()) setOrder(null);
  }, [id]);
  useEffect(() => {
    void syncOrders(true).then(read);
    window.addEventListener("sk-orders-changed", read);
    const stop = startOrdersPolling();
    return () => {
      window.removeEventListener("sk-orders-changed", read);
      stop();
    };
  }, [read]);
  return { order, refresh: read };
}

function esc(text: string) {
  return text.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[ch] ?? ch);
}

/** Opens a print-ready receipt / invoice; the browser's print dialog saves it as PDF. */
export function printOrder(order: Order, kind: "chek" | "faktura") {
  const { goods, goodsSum, delivery, discount, total } = orderSums(order);
  const title = kind === "chek" ? "To‘lov cheki" : "Hisob-faktura";
  const rows = goods.map((item, index) => `<tr><td>${index + 1}</td><td>${esc(item.name)}${item.brand ? `<br><small>${esc(item.brand)}</small>` : ""}</td><td>${item.qty}</td><td>${formatGroupedNumber(item.price)}</td><td>${formatGroupedNumber(item.price * item.qty)}</td></tr>`).join("");
  const html = `<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${title} ${esc(order.id)}</title>
<style>body{font:14px/1.5 system-ui,sans-serif;color:#0f1d33;margin:32px}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{border-bottom:1px solid #e3eaf1;padding:8px;text-align:left}th:nth-child(n+3),td:nth-child(n+3){text-align:right}small{color:#6b7a90}.sum{margin-left:auto;width:300px}.sum div{display:flex;justify-content:space-between;padding:3px 0}.sum b{font-size:18px}.meta{display:flex;justify-content:space-between;gap:24px;margin-top:14px}</style></head>
<body><h1>StomaHub — ${title}</h1><p>Buyurtma #${esc(order.id)} · ${esc(stamp(order.createdAt))}</p>
<div class="meta"><div><b>Sotuvchi</b><br>${esc(shopTitle(order))}</div><div><b>Xaridor</b><br>${esc(order.name)}<br>${esc(order.phone)}<br>${esc(order.city)}, ${esc(order.address)}</div><div><b>To‘lov</b><br>${esc(payTitle(order))}</div></div>
<table><thead><tr><th>#</th><th>Mahsulot</th><th>Soni</th><th>Narxi (so‘m)</th><th>Jami (so‘m)</th></tr></thead><tbody>${rows}</tbody></table>
<div class="sum"><div><span>Mahsulotlar</span><span>${som(goodsSum)}</span></div><div><span>Yetkazish</span><span>${som(delivery)}</span></div>${discount ? `<div><span>Chegirma</span><span>−${som(discount)}</span></div>` : ""}<div><b>Jami</b><b>${som(total)}</b></div></div>
<script>window.onload=function(){window.print()}</script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
