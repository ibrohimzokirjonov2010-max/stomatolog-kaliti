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

export function toDesktopOrder(order: Order): DesktopOrder {
  const lines = productLines(order.items);
  return {
    id: order.id,
    number: order.id,
    kind: "product",
    status: desktopStatus(order),
    title: lines.map((item) => item.name).filter(Boolean).join(", ") || "Buyurtma",
    seller: order.shopName || lines[0]?.shopName || "StomaHub Market",
    total: order.total,
    pay: payLabel(order.payment),
    count: lines.reduce((sum, item) => sum + item.qty, 0) || lines.length,
    images: lines.map((item) => item.image).filter(Boolean),
    sortKey: order.createdAt.slice(0, 10),
    when: new Date(order.createdAt).toLocaleString("uz-UZ"),
    note: order.paymentState === "awaiting_payment" ? "To‘lov kutilmoqda" : undefined,
    steps: [
      { label: "Qabul", date: "" },
      { label: "Yig‘ish", date: "" },
      { label: "Yo‘lda", date: "" },
      { label: "Yetkazildi", date: "" },
    ],
  };
}

function mobileStatus(order: Order): MobileOrderStatus {
  if (order.paymentState === "refunded") return "bekor";
  if (order.status === "yetkazildi") return "yetkazildi";
  if (order.status === "yolda") return "yetkazilmoqda";
  return "jarayonda";
}

export function toMobileOrder(order: Order): MobileOrder {
  const lines = productLines(order.items);
  const images = lines.map((item) => item.image).filter(Boolean);
  return {
    id: order.id,
    number: order.id,
    date: new Date(order.createdAt).toLocaleString("uz-UZ"),
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
