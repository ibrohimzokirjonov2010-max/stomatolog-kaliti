import type { DesktopOrder, OrderStatus, PayMethod } from "@/data/desktop-orders";
import type { MobileOrder, MobileOrderStatus } from "@/data/mobile-orders";
import { DELIVERY_LINE_ID } from "@/lib/cart-totals";
import type { Order, OrderItem } from "@/lib/orders";

function productLines(items: OrderItem[]) {
  return items.filter((item) => item.productId !== DELIVERY_LINE_ID && item.name !== "Yetkazib berish");
}

function desktopStatus(order: Order): OrderStatus {
  if (order.paymentState === "refunded") return "cancelled";
  if (order.status === "yetkazildi") return "delivered";
  if (order.status === "yolda") return "shipping";
  if (order.paymentState === "awaiting_payment") return "pending";
  return "preparing";
}

function payLabel(payment: Order["payment"]): PayMethod {
  if (payment === "payme") return "Payme";
  if (payment === "naqd") return "Naqd pul";
  return "Click";
}

function dayMonth(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function stamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${dayMonth(iso)}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

/** Four buyer-facing steps, each dated from the order's status history. */
const DESKTOP_STEPS: { label: string; statuses: Order["status"][] }[] = [
  { label: "Qabul qilindi", statuses: ["qabul_qilindi"] },
  { label: "Tayyorlandi", statuses: ["yigilmoqda", "yigish_tugadi"] },
  { label: "Yo‘lda", statuses: ["yolda"] },
  { label: "Yetkazildi", statuses: ["yetkazildi"] },
];

function desktopSteps(order: Order) {
  const history = order.statusHistory ?? [];
  const steps = DESKTOP_STEPS.map((step) => {
    const hit = history.filter((entry) => step.statuses.includes(entry.status)).pop();
    return { label: step.label, date: hit ? dayMonth(hit.at) : "" };
  });
  const stepAt = DESKTOP_STEPS.findIndex((step) => step.statuses.includes(order.status));
  return { steps, stepAt };
}

export function toDesktopOrder(order: Order): DesktopOrder {
  const lines = productLines(order.items);
  const { steps, stepAt } = desktopSteps(order);
  return {
    id: order.id,
    number: order.id,
    kind: "product",
    status: desktopStatus(order),
    title: lines.length > 1 ? `${lines[0].name} va yana ${lines.length - 1} ta` : lines[0]?.name || "Buyurtma",
    seller: order.shopName || lines[0]?.shopName || "StomaHub Market",
    total: order.total,
    pay: payLabel(order.payment),
    count: lines.reduce((sum, item) => sum + item.qty, 0) || lines.length,
    images: lines.map((item) => item.image).filter(Boolean),
    sortKey: order.createdAt.slice(0, 10),
    when: stamp(order.createdAt),
    note: order.paymentState === "awaiting_payment" ? "To‘lov kutilmoqda" : undefined,
    steps,
    stepAt,
  };
}

function mobileStatus(order: Order): MobileOrderStatus {
  if (order.paymentState === "refunded") return "bekor";
  if (order.status === "yetkazildi") return "yetkazildi";
  if (order.status === "yolda") return "yetkazilmoqda";
  return "jarayonda";
}

const MOBILE_STEPS: { title: string; statuses: Order["status"][] }[] = [
  { title: "Buyurtma qabul qilindi", statuses: ["qabul_qilindi"] },
  { title: "Tayyorlanmoqda", statuses: ["yigilmoqda", "yigish_tugadi"] },
  { title: "Yetkazilmoqda", statuses: ["yolda"] },
  { title: "Yetkazildi", statuses: ["yetkazildi"] },
];

/** Four-step tracker for orders on the way, dated from the status history. */
function mobileSteps(order: Order): MobileOrder["steps"] {
  if (order.status !== "yolda") return undefined;
  const at = MOBILE_STEPS.findIndex((step) => step.statuses.includes(order.status));
  return MOBILE_STEPS.map((step, index) => {
    const hit = (order.statusHistory ?? []).filter((entry) => step.statuses.includes(entry.status)).pop();
    return { title: step.title, when: hit ? shortStamp(hit.at) : "", state: index < at ? "done" : index === at ? "current" : "todo" };
  });
}

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

/** "5 okt, 11:20" in Tashkent time. */
function shortStamp(iso: string) {
  const full = listStamp(iso);
  if (!full) return "";
  const [date, time] = full.split(" ");
  const [, month, day] = date.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]}, ${time}`;
}

/** "2026-10-08 14:30" in Tashkent time. */
function listStamp(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}`;
}

export function toMobileOrder(order: Order): MobileOrder {
  const lines = productLines(order.items);
  const images = lines.map((item) => item.image).filter(Boolean);
  return {
    id: order.id,
    number: order.id,
    date: listStamp(order.createdAt),
    steps: mobileSteps(order),
    seller: order.shopName || "StomaHub Market",
    status: mobileStatus(order),
    itemCount: lines.reduce((sum, item) => sum + item.qty, 0),
    total: order.total,
    images: images.slice(0, 3),
    extra: Math.max(0, images.length - 3),
    place: [order.city, order.address].filter(Boolean).join(", "),
    delivery: /olib ketaman/i.test(order.note) ? "pickup" : "courier",
    items: lines.map((item) => ({
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      qty: item.qty,
    })),
  };
}
