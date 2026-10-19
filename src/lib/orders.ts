import { refreshBonus } from "@/lib/bonus";

export type PaymentMethod = "click" | "payme" | "naqd";

export type OrderPaymentState = "awaiting_payment" | "escrow_held" | "released" | "refunded";

/** Full pipeline including pre-accept */
export type OrderStatus =
  | "pending_accept"
  | "qabul_qilindi"
  | "yigilmoqda"
  | "yigish_tugadi"
  | "yolda"
  | "yetkazildi";

/** Buyer timeline 5 steps (after accept) */
export const BUYER_TIMELINE: OrderStatus[] = [
  "qabul_qilindi",
  "yigilmoqda",
  "yigish_tugadi",
  "yolda",
  "yetkazildi",
];

export const SELLER_PIPELINE: OrderStatus[] = [
  "pending_accept",
  "qabul_qilindi",
  "yigilmoqda",
  "yigish_tugadi",
  "yolda",
  "yetkazildi",
];

export type StatusHistoryEntry = {
  status: OrderStatus;
  at: string;
  note?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  brand: string;
  image: string;
  qty: number;
  price: number;
  size?: string;
  color?: string;
  category?: string;
  source?: string;
  expiryMonths?: number;
  shopName?: string;
  shopSlug?: string;
  shopId?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  note: string;
  payment: PaymentMethod;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  paymentState: OrderPaymentState;
  shopId?: string;
  shopName?: string;
  confirmedAt?: string;
  /** Yandex Go / Taxi live tracking URL shared by seller */
  yandexTrackUrl?: string;
  courierName?: string;
  courierPhone?: string;
  /** e.g. "Chevrolet Cobalt · 01 A 123 BC" */
  carInfo?: string;
  /** Last known courier location set by seller/admin: map link and/or coordinates. */
  courierLocationUrl?: string;
  courierLat?: number;
  courierLng?: number;
  courierLocationAt?: string;
  paidAt?: string;
  commission?: number;
  /** Bonus spent on this order (Marketplace lines only) and what the doctor actually pays. */
  bonusUsed?: number;
  payable?: number;
  dispute?: { id: number; reason: string; status: "open" | "resolved"; resolution?: "release" | "refund"; createdAt: string };
};

export type DeliveryTrackInput = {
  yandexTrackUrl?: string;
  courierName?: string;
  courierPhone?: string;
  carInfo?: string;
  /** Map link or "lat, lng"; empty string clears it. */
  location?: string;
};

/** Pickup orders ("O‘zim olib ketaman") have no courier. */
export function isPickupOrder(o: Pick<Order, "note" | "address">) {
  return /olib ketaman/i.test(o.note ?? "") || /olib ketaman/i.test(o.address ?? "");
}

/** Buyer-facing 4-step display (Tezkor density) */
export const DISPLAY_STEPS = [
  { id: "qabul", label: "Qabul" },
  { id: "yigish", label: "Yig‘ish" },
  { id: "yolda", label: "Yo‘lda" },
  { id: "yetkazildi", label: "Yetkazildi" },
] as const;

export type DisplayStepId = (typeof DISPLAY_STEPS)[number]["id"];

/** Map internal status → display step index 0..3 */
export function displayStepIndex(status: OrderStatus): number {
  switch (status) {
    case "pending_accept":
    case "qabul_qilindi":
      return 0;
    case "yigilmoqda":
    case "yigish_tugadi":
      return 1;
    case "yolda":
      return 2;
    case "yetkazildi":
      return 3;
    default:
      return 0;
  }
}

export function orderStatusCopy(status: OrderStatus): {
  title: string;
  subtitle: string;
  eta: string;
} {
  switch (status) {
    case "pending_accept":
      return {
        title: "Kutilmoqda",
        subtitle: "Sotuvchi buyurtmani qabul qilishi kutilmoqda",
        eta: "Kutilmoqda",
      };
    case "qabul_qilindi":
      return {
        title: "Qabul qilindi",
        subtitle: "Sotuvchi buyurtmani qabul qildi",
        eta: "Qabul qilindi",
      };
    case "yigilmoqda":
      return {
        title: "Yig‘ilmoqda",
        subtitle: "Buyurtmangiz yig‘ilmoqda",
        eta: "Yig‘ilmoqda",
      };
    case "yigish_tugadi":
      return {
        title: "Yig‘ish tugadi",
        subtitle: "Buyurtma jo‘natishga tayyor",
        eta: "Tez orada",
      };
    case "yolda":
      return {
        title: "Yo‘lda",
        subtitle: "Mahsulot yo‘lda. Tez orada yoningizda bo‘ladi.",
        eta: "Tez orada",
      };
    case "yetkazildi":
      return {
        title: "Yetkazildi",
        subtitle: "Mahsulot yetkazildi — tasdiqlang",
        eta: "Yetkazib berildi",
      };
    default:
      return {
        title: orderStatusLabel[status] ?? "Holat",
        subtitle: "",
        eta: orderStatusLabel[status] ?? "",
      };
  }
}

export const paymentMethods: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: "click", label: "Click", hint: "To‘lov kutilmoqda. Click hali ulanmagan, pul yechilmaydi." },
  { id: "payme", label: "Payme", hint: "To‘lov kutilmoqda. Payme hali ulanmagan, pul yechilmaydi." },
  { id: "naqd", label: "Naqd (yetkazganda)", hint: "Kuryerga naqd to‘lov. Buyurtma to‘lanmagan holda saqlanadi." },
];

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending_accept: "Kutilmoqda",
  qabul_qilindi: "Qabul qilindi",
  yigilmoqda: "Yig‘ilmoqda",
  yigish_tugadi: "Yig‘ish tugadi",
  yolda: "Yo‘lda",
  yetkazildi: "Yetkazildi",
};

export const paymentStateLabel: Record<OrderPaymentState, string> = {
  awaiting_payment: "To‘lov kutilmoqda",
  escrow_held: "Pul platformada",
  released: "Sotuvchiga o‘tkazildi",
  refunded: "Qaytarildi",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending_accept: "qabul_qilindi",
  qabul_qilindi: "yigilmoqda",
  yigilmoqda: "yigish_tugadi",
  yigish_tugadi: "yolda",
  yolda: "yetkazildi",
};

const SELLER_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  pending_accept: "Qabul qilish",
  qabul_qilindi: "Yig‘ishni boshlash",
  yigilmoqda: "Yig‘ish tugadi",
  yigish_tugadi: "Jo‘natildi",
  yolda: "Yetkazildi",
};

type Cache = { buyer: Order[]; seller: Order[]; shopId: string | null; loadedAt: number; userKey: string };
let cache: Cache = { buyer: [], seller: [], shopId: null, loadedAt: 0, userKey: "" };
let inflight: Promise<void> | null = null;

function normalizeOrder(raw: Partial<Order> & { id: string }): Order {
  const createdAt = raw.createdAt ?? new Date().toISOString();
  const status = (raw.status as OrderStatus) ?? "pending_accept";
  return {
    ...raw,
    id: raw.id,
    createdAt,
    name: raw.name ?? "",
    phone: raw.phone ?? "",
    city: raw.city ?? "",
    address: raw.address ?? "",
    note: raw.note ?? "",
    payment: (raw.payment as PaymentMethod) ?? "click",
    items: Array.isArray(raw.items) ? raw.items : [],
    total: Number(raw.total) || 0,
    status,
    statusHistory: Array.isArray(raw.statusHistory) && raw.statusHistory.length ? raw.statusHistory : [{ status, at: createdAt }],
    paymentState: (raw.paymentState as OrderPaymentState) ?? "awaiting_payment",
    shopId: raw.shopId ?? raw.items?.find((i) => i.shopId)?.shopId,
    shopName: raw.shopName ?? raw.items?.find((i) => i.shopName)?.shopName,
  };
}

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("sk-orders-changed"));
    }
}

/** Fetch my orders (buyer + seller) from the server into the in-memory cache. */
export function syncOrders(force = false): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (inflight) return inflight;
  if (!force && Date.now() - cache.loadedAt < 8000) return Promise.resolve();
  inflight = fetch("/api/orders", { cache: "no-store", credentials: "same-origin" })
    .then((r) => r.json())
    .then((j: { ok?: boolean; buyer?: Order[]; seller?: Order[]; shopId?: string | null }) => {
      if (!j?.ok) return;
      cache = {
        buyer: (j.buyer ?? []).map(normalizeOrder),
        seller: (j.seller ?? []).map(normalizeOrder),
        shopId: j.shopId ?? null,
        loadedAt: Date.now(),
        userKey: "",
      };
      emit();
    })
    .catch(() => undefined)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Orders I placed (cached; triggers a background refresh when stale). */
export function loadOrders(): Order[] {
  if (typeof window !== "undefined" && Date.now() - cache.loadedAt > 8000) void syncOrders();
  return cache.buyer;
}

/** Orders to my store (cached). */
export function loadSellerOrders(): Order[] {
  if (typeof window !== "undefined" && Date.now() - cache.loadedAt > 8000) void syncOrders();
  return cache.seller;
}

export function ordersLoaded() {
  return cache.loadedAt > 0;
}

export function getOrder(id: string) {
  return cache.buyer.find((o) => o.id === id) ?? cache.seller.find((o) => o.id === id);
}

function upsert(order: Order) {
  const o = normalizeOrder(order);
  const put = (list: Order[]) => (list.some((x) => x.id === o.id) ? list.map((x) => (x.id === o.id ? { ...x, ...o } : x)) : list);
  cache = { ...cache, buyer: put(cache.buyer), seller: put(cache.seller) };
  emit();
}

type OrderResult = { ok: true; order: Order; buyerTelegram?: boolean } | { ok: false; reason: string };

async function postOrder(url: string, body: unknown): Promise<OrderResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    const j = (await res.json().catch(() => null)) as { ok?: boolean; order?: Order; error?: string; buyerTelegram?: boolean } | null;
    if (!res.ok || !j?.ok || !j.order) return { ok: false, reason: j?.error ?? "Bajarib bo‘lmadi." };
    if (typeof window !== "undefined") window.dispatchEvent(new Event("sk-notifs-refresh"));
    return { ok: true, order: normalizeOrder(j.order), buyerTelegram: j.buyerTelegram === true };
  } catch {
    return { ok: false, reason: "Tarmoq xatosi. Qayta urinib ko‘ring." };
  }
}

export type NewOrderInput = {
  name: string;
  phone: string;
  city: string;
  address: string;
  note: string;
  payment: PaymentMethod;
  items: (Pick<OrderItem, "productId" | "qty" | "size" | "color" | "source" | "expiryMonths">)[];
  /** Ask the server to spend bonus balance (it decides the amount). */
  useBonus?: boolean;
};

/** Create an order on the server (prices are recomputed server-side). */
export async function createOrder(input: NewOrderInput): Promise<OrderResult> {
  const { items, useBonus, ...order } = input;
  const res = await postOrder("/api/orders", { order, items, useBonus: useBonus === true });
  if (res.ok) {
    void refreshBonus();
    cache = { ...cache, buyer: [res.order, ...cache.buyer.filter((o) => o.id !== res.order.id)] };
    emit();
    void syncOrders(true);
  }
  return res;
}

/** Seller advances the order to the next pipeline step. */
export async function advanceOrderStatus(orderId: string): Promise<OrderResult> {
  const res = await postOrder(`/api/orders/${encodeURIComponent(orderId)}`, { action: "advance" });
  if (res.ok) upsert(res.order);
  return res;
}

/** Doctor confirms receipt → escrow released to the seller minus commission. */
export async function confirmOrderReceipt(orderId: string): Promise<OrderResult> {
  const res = await postOrder(`/api/orders/${encodeURIComponent(orderId)}`, { action: "confirm" });
  if (res.ok) {
    upsert(res.order);
    void refreshBonus(); // first-purchase bonus may have been granted
  }
  return res;
}

/** Doctor reports a problem → escrow frozen until an admin resolves it. */
export async function openOrderDispute(orderId: string, reason: string): Promise<OrderResult> {
  const res = await postOrder(`/api/orders/${encodeURIComponent(orderId)}`, { action: "dispute", reason });
  if (res.ok) void syncOrders(true);
  return res;
}

/** Keeps the orders cache fresh: every ~12 s while the tab is visible, and right when it regains focus. Returns a stop fn. */
export function startOrdersPolling(): () => void {
  if (typeof window === "undefined") return () => undefined;
  const run = () => {
    if (document.visibilityState === "visible") void syncOrders(true);
  };
  const t = window.setInterval(run, 12000);
  document.addEventListener("visibilitychange", run);
  window.addEventListener("focus", run);
  return () => {
    window.clearInterval(t);
    document.removeEventListener("visibilitychange", run);
    window.removeEventListener("focus", run);
  };
}

/** Seller attaches Yandex Go track + courier details; may advance to yolda */
export async function setOrderDeliveryTrack(orderId: string, input: DeliveryTrackInput, opts?: { advanceToYolda?: boolean }): Promise<OrderResult> {
  const res = await postOrder(`/api/orders/${encodeURIComponent(orderId)}`, {
    action: "track",
    track: { ...input, advance: Boolean(opts?.advanceToYolda) },
  });
  if (res.ok) upsert(res.order);
  return res;
}

export function nextSellerStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status] ?? null;
}

export function sellerActionLabel(status: OrderStatus): string | null {
  return SELLER_ACTION_LABEL[status] ?? null;
}

export function buyerTimelineIndex(status: OrderStatus): number {
  if (status === "pending_accept") return -1;
  return BUYER_TIMELINE.indexOf(status);
}

export function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "pending_accept":
      return "bg-amber-50 text-amber-800 ring-amber-200/80";
    case "qabul_qilindi":
      return "bg-[#e8f1ff] text-[#0066FF] ring-[#bfdbfe]";
    case "yigilmoqda":
      return "bg-sky-50 text-sky-800 ring-sky-200/80";
    case "yigish_tugadi":
      return "bg-indigo-50 text-indigo-800 ring-indigo-200/80";
    case "yolda":
      return "bg-violet-50 text-violet-800 ring-violet-200/80";
    case "yetkazildi":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}


/** Previously seeded fake orders; now a no-op (only real orders are shown). */
export function ensureDemoOrderSeed() {
  void syncOrders();
}

/** Seller-side confirmation text after a status/track change (notification row is written by the database). */
export function buyerNotifiedText(prefix: string, res: { buyerTelegram?: boolean }) {
  return `${prefix} — shifokorga bildirishnoma yuborildi (${res.buyerTelegram ? "saytda va Telegramda" : "saytda"})`;
}
