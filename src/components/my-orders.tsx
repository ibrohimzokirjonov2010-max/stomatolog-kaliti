"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ContactSeller } from "@/components/contact-seller";
import { OrderReviewForm } from "@/components/order-review-form";
import { OrderTimeline, OrderTrackMap } from "@/components/order-timeline";
import { OrderCourierCard } from "@/components/order-courier-card";
import { OrderTrackMobile } from "@/components/order-track-mobile";
import { apparelMetaLabel } from "@/data/forma";
import { DELIVERY_LINE_ID } from "@/lib/cart-totals";
import { formatMoney } from "@/lib/format";
import {
  confirmOrderReceipt,
  ensureDemoOrderSeed,
  getOrder,
  loadOrders,
  openOrderDispute,
  startOrdersPolling,
  syncOrders,
  orderStatusLabel,
  paymentMethods,
  paymentStateLabel,
  statusBadgeClass,
  type Order,
} from "@/lib/orders";
import { markAllNotificationsRead, markNotificationRead, useNotifications, type AppNotification } from "@/lib/notifications";
import { useIsClient } from "@/lib/use-is-client";
import { BonusBalanceCard, BonusNotice } from "@/components/bonus/bonus";
import { cn } from "@/lib/utils";

function useOrdersLive() {
  const isClient = useIsClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    ensureDemoOrderSeed();
    setOrders(loadOrders());
  }, []);

  useEffect(() => {
    if (!isClient) return;
    void syncOrders(true).finally(() => {
      setOrders(loadOrders());
      setReady(true);
    });
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a server-backed external cache
    refresh();
    const onChange = () => refresh();
    window.addEventListener("sk-orders-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("sk-orders-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [isClient, refresh]);

  useEffect(() => {
    if (!isClient) return;
    return startOrdersPolling();
  }, [isClient]);

  return { ready, orders, refresh };
}

function notifIcon(type: AppNotification["type"]) {
  if (type === "order_paid" || type === "order_released" || type === "order_refunded") {
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  }
  if (type === "order_track") return <ShoppingBag className="size-4 text-violet-600" />;
  return <Package className="size-4 text-[#0F766E]" />;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Hozir";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short" });
}

export function MyOrdersList() {
  const { ready, orders } = useOrdersLive();
  const { items } = useNotifications(true);
  const notifs = items.filter((n) => n.link?.startsWith("/buyurtmalarim"));
  const unread = notifs.filter((n) => !n.readAt).length;

  if (!ready) {
    return (
      <div className="rounded-[20px] border border-[#eceff5] bg-white px-6 py-14 text-center text-sm text-[#8b93a7]">
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BonusNotice />
      <BonusBalanceCard compact />
      {notifs.length ? (
        <section className="overflow-hidden rounded-[20px] border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#f0f3f8] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="relative flex size-10 items-center justify-center rounded-2xl bg-[#F0FDFA] text-[#0F766E]">
                <Bell className="size-[18px]" />
                {unread ? (
                  <span className="absolute -right-1 -top-1 flex size-4.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </span>
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-[#1a1d26]">
                  Bildirishnomalar
                </h2>
                <p className="text-[12px] text-[#8b93a7]">
                  {unread ? `${unread} ta yangi xabar` : "Yangilanishlar kuzatiladi"}
                </p>
              </div>
            </div>
            {unread ? (
              <Button
                type="button"
                variant="outline"
                className="h-8 !rounded-xl border-[#e2e8f0] px-3 text-[12px] font-medium"
                onClick={() => markAllNotificationsRead()}
              >
                Hammasini o‘qilgan qilish
              </Button>
            ) : null}
          </div>
          <ul className="max-h-[280px] divide-y divide-[#f0f3f8] overflow-y-auto">
            {notifs.slice(0, 10).map((n) => (
              <li key={n.id}>
                <Link
                  href={n.link || "/buyurtmalarim"}
                  onClick={() => markNotificationRead(n.id)}
                  className={cn(
                    "flex gap-3 px-4 py-3.5 transition hover:bg-[#f7f9fc] sm:px-5",
                    !n.readAt && "bg-[#f5f9ff]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                      !n.readAt ? "bg-white shadow-sm ring-1 ring-[#F0FDFA]" : "bg-[#f4f7fb]",
                    )}
                  >
                    {notifIcon(n.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13.5px] font-semibold text-[#1a1d26]">{n.title}</p>
                      <span className="shrink-0 text-[11px] text-[#9aa3b5]">{relativeTime(n.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-relaxed text-[#6b7280]">
                      {n.body}
                    </p>
                  </div>
                  {!n.readAt ? (
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-[#0F766E]" aria-hidden />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!orders.length ? (
        <div className="rounded-[20px] border border-[#eceff5] bg-white px-6 py-16 text-center shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#F0FDFA] text-[#0F766E]">
            <Package className="size-7" />
          </span>
          <p className="mt-4 text-[17px] font-semibold text-[#1a1d26]">Hali buyurtma yo‘q</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-[#8b93a7]">
            Marketplace yoki Formadan buyurtma bering — holatni shu yerda kuzatasiz.
          </p>
          <Link href="/marketplace" className={cn(buttonVariants(), "mt-6 h-11 !rounded-xl px-6")}>
            Marketplace’ga o‘tish
          </Link>
        </div>
      ) : (
        <section>
          <div className="mb-2.5 flex items-end justify-between px-0.5">
            <h2 className="text-[15px] font-semibold text-[#1a1d26]">Buyurtmalar</h2>
            <span className="text-[12px] text-[#8b93a7]">{orders.length} ta</span>
          </div>
          <ul className="space-y-2.5">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/buyurtmalarim/${encodeURIComponent(order.id)}`}
                  className="group flex items-center gap-3 rounded-[18px] border border-[#eceff5] bg-white p-3.5 shadow-[0_1px_2px_rgba(17, 24, 39, 0.03)] transition hover:border-[#CCFBF1] hover:shadow-[0_8px_24px_rgba(15, 118, 110, 0.07)] sm:p-4"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#f4f7fb] text-[#0F766E] group-hover:bg-[#F0FDFA]">
                    <Package className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[14px] font-semibold text-[#1a1d26]">{order.id}</p>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold ring-1",
                          order.paymentState === "refunded" ? "bg-[#fef2f2] text-[#dc2626]" : statusBadgeClass(order.status),
                        )}
                      >
                        {order.paymentState === "refunded" ? "Bekor qilindi · pul qaytarildi" : orderStatusLabel[order.status]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[12.5px] text-[#8b93a7]">
                      {order.shopName ?? "Do‘kon"} · {order.items.length} pozitsiya ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                    </p>
                    <p className="mt-1 text-[14px] font-bold text-[#1a1d26]">
                      {formatMoney(order.payable ?? order.total, "UZS")}
                      {order.bonusUsed ? <span className="ml-1.5 text-[11.5px] font-medium text-[#0F766E]">bonus −{formatMoney(order.bonusUsed, "UZS")}</span> : null}
                    </p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-[#c5cad6] group-hover:text-[#0F766E]" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function isDeliveryLine(item: Order["items"][number]) {
  return item.productId === DELIVERY_LINE_ID || item.name === "Yetkazib berish";
}

export function MyOrderDetail({ orderId, initialOrder }: { orderId: string; initialOrder?: Order }) {
  const { ready, refresh } = useOrdersLive();
  const [order, setOrder] = useState<Order | null | undefined>(initialOrder);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeText, setDisputeText] = useState("");

  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from a server-backed external cache
    setOrder(getOrder(orderId) ?? initialOrder ?? null);
  }, [ready, orderId, initialOrder]);

  useEffect(() => {
    const onChange = () => setOrder(getOrder(orderId) ?? initialOrder ?? null);
    window.addEventListener("sk-orders-changed", onChange);
    return () => window.removeEventListener("sk-orders-changed", onChange);
  }, [initialOrder, orderId]);

  if (order === undefined) {
    return (
      <div className="rounded-[20px] border border-[#eceff5] bg-white px-6 py-14 text-center text-sm text-[#8b93a7]">
        Yuklanmoqda...
      </div>
    );
  }

  if (!order) notFound();

  async function onConfirm() {
    setBusy(true);
    const res = await confirmOrderReceipt(order!.id);
    setBusy(false);
    if (!res.ok) {
      setMsg(res.reason || "Tasdiqlash hozir mumkin emas.");
      return;
    }
    setOrder(res.order);
    setMsg("Mahsulot tasdiqlandi. To‘lov sotuvchiga o‘tkazildi.");
    refresh();
  }

  async function onDispute() {
    const reason = disputeText.trim();
    if (reason.length < 5) {
      setMsg("Muammoni qisqacha yozing (kamida 5 belgi).");
      return;
    }
    setBusy(true);
    const res = await openOrderDispute(order!.id, reason);
    setBusy(false);
    if (!res.ok) {
      setMsg(res.reason);
      return;
    }
    setDisputeOpen(false);
    setDisputeText("");
    setMsg("Murojaat qabul qilindi. Pul muzlatildi — administrator ko‘rib chiqadi.");
    refresh();
  }

  const canDispute =
    (order.paymentState === "escrow_held" || order.paymentState === "awaiting_payment") && order.dispute?.status !== "open";

  const payLabel = paymentMethods.find((p) => p.id === order.payment)?.label ?? order.payment;
  const goods = order.items.filter((item) => !isDeliveryLine(item));
  const deliverySum = order.items.filter(isDeliveryLine).reduce((sum, item) => sum + item.price * item.qty, 0);
  const goodsSum = goods.reduce((sum, item) => sum + item.price * item.qty, 0);

  const reviewForm =
    order.status === "yetkazildi" && order.paymentState !== "refunded" ? <OrderReviewForm orderId={order.id} items={order.items} /> : null;

  const escrowSection = (
      <section className="overflow-hidden rounded-[20px] border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)]">
        <div className="flex items-center gap-2.5 px-4 py-3.5 text-[12.5px] text-[#4b5568] sm:px-5">
          <CheckCircle2 className="size-4 shrink-0 text-[#0F766E]" />
          <span>
            <span className="font-semibold text-[#1a1d26]">
              {paymentStateLabel[order.paymentState]}
            </span>
            {order.paymentState === "escrow_held"
              ? " — tasdiqlaguncha platformada"
              : order.paymentState === "released"
                ? " — sotuvchiga o‘tkazildi"
                : order.paymentState === "refunded"
                  ? " — pul sizga qaytarildi"
                  : order.payment === "naqd"
                    ? " — kuryerga naqd to‘laysiz"
                    : ""}
          </span>
        </div>
        {order.dispute ? (
          <div
            className={cn(
              "border-t border-[#f0f3f8] px-4 py-3 text-[12.5px] sm:px-5",
              order.dispute.status === "open" ? "bg-[#fff7ed] text-[#9a3412]" : "text-[#4b5568]",
            )}
          >
            <span className="font-semibold">
              {order.dispute.status === "open"
                ? "Murojaat ko‘rib chiqilmoqda — pul muzlatilgan"
                : order.dispute.resolution === "refund"
                  ? "Murojaat hal qilindi — pul qaytarildi"
                  : "Murojaat hal qilindi — pul sotuvchiga o‘tkazildi"}
            </span>
            <span className="block text-[#8b93a7]">{order.dispute.reason}</span>
          </div>
        ) : null}
        {order.status === "yetkazildi" && order.paymentState === "escrow_held" ? (
          <div className="border-t border-[#f0f3f8] px-4 py-4 sm:px-5">
            <Button
              type="button"
              className="h-11 w-full !rounded-xl text-[14px] font-semibold"
              disabled={busy}
              onClick={onConfirm}
            >
              {busy ? "Tasdiqlanmoqda..." : "Mahsulotni tasdiqlash"}
            </Button>
            <p className="mt-2 text-center text-[11.5px] text-[#8b93a7]">
              Tasdiqlashdan so‘ng to‘lov sotuvchiga o‘tkaziladi
            </p>
          </div>
        ) : null}
        {canDispute ? (
          <div className="border-t border-[#f0f3f8] px-4 py-3 sm:px-5">
            {disputeOpen ? (
              <div className="space-y-2">
                <textarea
                  value={disputeText}
                  onChange={(e) => setDisputeText(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Nima muammo? Masalan: mahsulot kelmadi, boshqa mahsulot keldi, shikastlangan…"
                  className="w-full rounded-xl border border-[#e2e8f0] p-3 text-[13px] outline-none focus:border-[#0F766E]"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-10 flex-1 !rounded-xl" onClick={() => setDisputeOpen(false)}>
                    Bekor
                  </Button>
                  <Button type="button" className="h-10 flex-1 !rounded-xl bg-[#dc2626] hover:bg-[#b91c1c]" disabled={busy} onClick={onDispute}>
                    Murojaat yuborish
                  </Button>
                </div>
                <p className="text-[11.5px] text-[#8b93a7]">Pul sotuvchiga o‘tkazilmaydi — administrator ikki tomonni tinglab qaror qiladi.</p>
              </div>
            ) : (
              <button type="button" onClick={() => setDisputeOpen(true)} className="w-full text-center text-[13px] font-semibold text-[#dc2626] hover:underline">
                Muammo bormi? Murojaat qilish
              </button>
            )}
          </div>
        ) : null}
        {msg ? (
          <p className="border-t border-[#f0f3f8] px-4 py-3 text-center text-[13px] font-medium text-emerald-700 sm:px-5">
            {msg}
          </p>
        ) : null}
      </section>

  );

  return (
    <>
    <OrderTrackMobile
      order={order}
      payLabel={payLabel}
      details={
        <>
          {escrowSection}
          {order.shopId ? (
            <ContactSeller storeId={order.shopId} shopName={order.shopName} orderId={order.id} label="Sotuvchiga yozish" className="h-11 w-full rounded-[14px] border-[#e2e8f0] text-[13.5px] text-[#1a1d26]" />
          ) : null}
          {reviewForm}
        </>
      }
    />
    <div className="mx-auto hidden max-w-lg space-y-3 sm:max-w-2xl sm:space-y-3.5 lg:block">
      {/* Optional live map — Tezkor top section */}
      <OrderTrackMap order={order} />

      {/* Status + horizontal stepper */}
      <section className="overflow-hidden rounded-[20px] border border-[#eceff5] bg-white px-4 py-5 shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)] sm:px-6 sm:py-6">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold tracking-[0.14em] text-[#9aa3b5]">
            {order.id}
          </p>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
              order.paymentState === "refunded" ? "bg-[#fef2f2] text-[#dc2626]" : statusBadgeClass(order.status),
            )}
          >
            {order.paymentState === "refunded" ? "Bekor qilindi · pul qaytarildi" : orderStatusLabel[order.status]}
          </span>
        </div>
        <OrderTimeline order={order} />
      </section>

      {/* Seller row — Tezkor shop card */}
      <section className="flex items-center gap-3 rounded-[20px] border border-[#eceff5] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)]">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-[#0F766E]">
          <Store className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold text-[#1a1d26]">
            {order.shopName ?? "Do‘kon"}
          </p>
          <p className="mt-0.5 text-[12.5px] text-[#8b93a7]">Sotuvchi · {order.city}</p>
        </div>
        {order.shopId ? (
          <ContactSeller storeId={order.shopId} shopName={order.shopName} orderId={order.id} label="Yozish" className="h-9 w-auto shrink-0 rounded-full border-[#e2e8f0] px-3.5 text-[13px] text-[#1a1d26]" />
        ) : null}
      </section>

      <OrderCourierCard order={order} />

      {/* Delivery details */}
      <section className="rounded-[20px] border border-[#eceff5] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)] sm:px-5">
        <h2 className="text-[15px] font-semibold text-[#1a1d26]">Yetkazib berish tafsilotlari</h2>
        <dl className="mt-3 space-y-3">
          <div className="flex gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#f4f7fb] text-[#0F766E]">
              <MapPin className="size-3.5" />
            </span>
            <div className="min-w-0">
              <dt className="text-[11.5px] font-medium uppercase tracking-wide text-[#9aa3b5]">
                Manzil
              </dt>
              <dd className="mt-0.5 text-[13.5px] font-medium leading-snug text-[#1a1d26]">
                {order.city}, {order.address}
              </dd>
              {order.note ? (
                <p className="mt-0.5 text-[12px] text-[#8b93a7]">{order.note}</p>
              ) : null}
            </div>
          </div>
          <div className="flex gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#f4f7fb] text-[#0F766E]">
              <Phone className="size-3.5" />
            </span>
            <div className="min-w-0">
              <dt className="text-[11.5px] font-medium uppercase tracking-wide text-[#9aa3b5]">
                Qabul qiluvchi
              </dt>
              <dd className="mt-0.5 text-[13.5px] font-medium text-[#1a1d26]">
                {order.name} · {order.phone}
              </dd>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#f7f9fc] px-3.5 py-3">
            <div>
              <p className="text-[11.5px] font-medium uppercase tracking-wide text-[#9aa3b5]">
                To‘lov
              </p>
              <p className="mt-0.5 text-[13.5px] font-semibold text-[#1a1d26]">{payLabel}</p>
            </div>
            <div className="text-right">
              {order.bonusUsed ? (
                <p className="text-[12px] font-medium text-[#8b93a7]">
                  Bonus −{formatMoney(order.bonusUsed, "UZS")} · jami {formatMoney(order.total, "UZS")}
                </p>
              ) : null}
              <p className="text-[15px] font-bold text-[#0F766E]">{formatMoney(order.payable ?? order.total, "UZS")}</p>
            </div>
          </div>
        </dl>
      </section>

      {escrowSection}

      {/* Products */}
      <section className="rounded-[20px] border border-[#eceff5] bg-white p-4 shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)] sm:p-5">
        <h2 className="text-[15px] font-semibold text-[#1a1d26]">Mahsulotlar</h2>
        <ul className="mt-3 space-y-0">
          {goods.map((item, index) => (
            <li
              key={`${item.productId}-${index}`}
              className="flex items-center justify-between gap-3 border-b border-[#f0f3f8] py-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-[#1a1d26]">{item.name}</p>
                <p className="mt-0.5 text-[12px] text-[#8b93a7]">
                  {item.size || item.color ? `${apparelMetaLabel(item.size, item.color)} · ` : ""}
                  {item.qty} dona
                </p>
              </div>
              <span className="shrink-0 text-[13.5px] font-semibold text-[#1a1d26]">
                {formatMoney(item.price * item.qty, "UZS")}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-1 space-y-1.5 border-t border-[#eceff5] pt-3.5" data-testid="order-totals">
          <div className="flex items-center justify-between text-[13px] text-[#4b5568]">
            <span>Mahsulotlar</span>
            <span>{formatMoney(goodsSum, "UZS")}</span>
          </div>
          <div className="flex items-center justify-between text-[13px] text-[#4b5568]">
            <span>Yetkazib berish</span>
            <span>{deliverySum > 0 ? formatMoney(deliverySum, "UZS") : "0 so‘m"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#1a1d26]">Jami</span>
            <span className="text-[16px] font-bold text-[#0F766E]">{formatMoney(order.total, "UZS")}</span>
          </div>
        </div>
        {order.bonusUsed ? (
          <div className="mt-1.5 flex items-center justify-between text-[13px]">
            <span className="text-[#4b5568]">Bonus bilan to‘langan</span>
            <span className="font-semibold text-[#16a34a]">−{formatMoney(order.bonusUsed, "UZS")}</span>
          </div>
        ) : null}
      </section>

      {reviewForm}
    </div>
    </>
  );
}
