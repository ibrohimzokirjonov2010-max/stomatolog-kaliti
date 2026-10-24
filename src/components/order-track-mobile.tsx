"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Headset,
  House,
  MapPin,
  MapPinned,
  Package,
  Phone,
  Scooter,
  ShoppingBag,
  Store,
} from "lucide-react";
import { apparelMetaLabel } from "@/data/forma";
import { site } from "@/data/site";
import { courierMapLink, parseCourierLocation } from "@/lib/courier-location";
import { formatMoney } from "@/lib/format";
import { isPickupOrder, type Order, type OrderStatus } from "@/lib/orders";
import { cn } from "@/lib/utils";

type LatLng = { lat: number; lng: number };

const MAP_H = 190;

const TASHKENT_HM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hour12: false });
const TASHKENT_DAY = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", year: "numeric", month: "numeric", day: "numeric" });
const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

/** "14:30" in Tashkent time, the same on the server and in the browser. */
function hm(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return hmDate(d);
}

function hmDate(d: Date) {
  return TASHKENT_HM.format(d);
}

/** "8 okt" / "8 okt, 2026" in Tashkent time. */
function dayLabel(iso?: string, withYear = false) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = TASHKENT_DAY.formatToParts(d);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("day")} ${MONTHS[Number(pick("month")) - 1]}${withYear ? `, ${pick("year")}` : ""}`;
}

function historyAt(order: Order, statuses: OrderStatus[]) {
  const h = [...order.statusHistory].reverse().find((x) => statuses.includes(x.status));
  return h?.at;
}

/** Destination pin: the checkout stores "Xarita: https://yandex.uz/maps/?pt=lng,lat" inside the address/note. */
function destinationPoint(order: Order): LatLng | null {
  const text = `${order.address ?? ""} ${order.note ?? ""}`;
  const m = text.match(/https:\/\/\S+/);
  if (!m) return null;
  const p = parseCourierLocation(m[0].replace(/[,.;]+$/, ""));
  return p && p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null;
}

function destinationLink(order: Order) {
  const m = `${order.address ?? ""} ${order.note ?? ""}`.match(/https:\/\/\S+/);
  return m ? m[0].replace(/[,.;]+$/, "") : "";
}

function cleanAddress(order: Order) {
  const a = (order.address ?? "").replace(/,?\s*Xarita:\s*https:\/\/\S+/gi, "").replace(/\s*,\s*$/, "").trim();
  return [order.city, a].filter(Boolean).join(", ");
}

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "K";
}

/* ---------------- Map ---------------- */

function project(p: LatLng, z: number) {
  const s = 256 * 2 ** z;
  const sin = Math.sin((p.lat * Math.PI) / 180);
  return {
    x: ((p.lng + 180) / 360) * s,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s,
  };
}

function Bubble({
  icon,
  tone,
  title,
  subtitle,
  href,
  className,
  style,
}: {
  icon: ReactNode;
  tone: "blue" | "teal";
  title: string;
  subtitle?: string;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const body = (
    <>
      <span
        className={cn(
          "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] text-white",
          tone === "blue" ? "bg-[#0F766E]" : "bg-[#0F766E]",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[12px] font-bold leading-tight text-[#0B1220]">{title}</span>
        {subtitle ? <span className="block truncate text-[11px] leading-tight text-[#4b5568]">{subtitle}</span> : null}
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-[#4b5568]" />
    </>
  );
  const cls = cn(
    "absolute z-[3] flex max-w-[210px] items-center gap-2 rounded-[12px] bg-white py-1.5 pr-2 pl-1.5 shadow-[0_6px_18px_rgba(17, 24, 39, 0.16)]",
    className,
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={style}>
      {body}
    </a>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

function DestPin({ x, y }: { x: number; y: number }) {
  return (
    <span className="absolute z-[2] -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
      <span className="flex size-[34px] items-center justify-center rounded-full bg-[#0F766E] text-white ring-[4px] ring-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.4)]">
        <House className="size-4" strokeWidth={2.4} />
      </span>
    </span>
  );
}

function SellerPin({ x, y }: { x: number; y: number }) {
  return (
    <span className="absolute z-[2] -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
      <span className="flex size-[34px] items-center justify-center rounded-full bg-[#0F766E] text-white ring-[4px] ring-white shadow-[0_4px_12px_rgba(15, 118, 110, 0.4)]">
        <Store className="size-4" strokeWidth={2.4} />
      </span>
    </span>
  );
}

function CourierPin({ x, y, live }: { x: number; y: number; live: boolean }) {
  return (
    <span className="absolute z-[2] -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
      {live ? <span className="absolute inset-[-8px] rounded-full bg-[#0F766E]/20" /> : null}
      <span className="relative flex size-[40px] items-center justify-center rounded-full bg-[#0F766E] text-[#0B1220] ring-[4px] ring-white shadow-[0_6px_16px_rgba(17, 24, 39, 0.25)]">
        <Scooter className="size-[21px]" strokeWidth={2.2} />
      </span>
    </span>
  );
}

function curvePath(a: { x: number; y: number }, b: { x: number; y: number }, bend = 0.18) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = mx - dy * bend;
  const cy = my + dx * bend;
  return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
}

function TrackMap({
  order,
  width,
  dest,
  courier,
  destLabel,
}: {
  order: Order;
  width: number;
  dest: LatLng | null;
  courier: LatLng | null;
  destLabel: string;
}) {
  const W = width;
  const H = MAP_H;
  const shop = order.shopName?.trim() || "Sotuvchi";
  const delivered = order.status === "yetkazildi";
  const onWay = order.status === "yolda";
  const destHref = destinationLink(order) || undefined;
  const real = [dest, courier].filter(Boolean) as LatLng[];

  if (real.length) {
    // Real tiles fitted around the known points (destination pin and/or last courier location).
    const visTop = 96;
    const visBottom = H - 46;
    let z = 15;
    if (real.length > 1) {
      for (z = 16; z > 10; z--) {
        const a = project(real[0], z);
        const b = project(real[1], z);
        if (Math.abs(a.x - b.x) < W - 110 && Math.abs(a.y - b.y) < visBottom - visTop - 40) break;
      }
    }
    const pts = real.map((p) => project(p, z));
    const cx = (Math.min(...pts.map((p) => p.x)) + Math.max(...pts.map((p) => p.x))) / 2;
    const cy = (Math.min(...pts.map((p) => p.y)) + Math.max(...pts.map((p) => p.y))) / 2;
    const ox = cx - W / 2;
    const oy = cy - (visTop + visBottom) / 2;
    const tiles: { x: number; y: number; left: number; top: number }[] = [];
    const n = 2 ** z;
    for (let tx = Math.floor(ox / 256); tx <= Math.floor((ox + W) / 256); tx++) {
      for (let ty = Math.floor(oy / 256); ty <= Math.floor((oy + H) / 256); ty++) {
        if (ty < 0 || ty >= n) continue;
        tiles.push({ x: ((tx % n) + n) % n, y: ty, left: tx * 256 - ox, top: ty * 256 - oy });
      }
    }
    const toScreen = (p: LatLng) => {
      const q = project(p, z);
      return { x: q.x - ox, y: q.y - oy };
    };
    const d = dest ? toScreen(dest) : null;
    const c = courier && !delivered ? toScreen(courier) : null;
    return (
      <div className="relative h-full w-full overflow-hidden bg-[#eef0f2]" data-testid="track-map" data-map="real">
        {tiles.map((t) => (
          <img
            key={`${t.x}-${t.y}-${t.left}`}
            src={`https://tile.openstreetmap.org/${z}/${t.x}/${t.y}.png`}
            alt=""
            draggable={false}
            className="absolute size-[256px] max-w-none select-none [filter:saturate(0.55)_brightness(1.04)]"
            style={{ left: t.left, top: t.top }}
          />
        ))}
        <svg className="pointer-events-none absolute inset-0 z-[1]" width={W} height={H} aria-hidden>
          {d && c ? (
            <>
              <path d={curvePath(c, d)} fill="none" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" />
              <path d={curvePath(c, d)} fill="none" stroke="#0F766E" strokeWidth={5} strokeLinecap="round" />
            </>
          ) : null}
        </svg>
        {d ? <DestPin x={d.x} y={d.y} /> : null}
        {c ? <CourierPin x={c.x} y={c.y} live={onWay} /> : null}
        {d ? (
          <Bubble
            tone="blue"
            icon={<House className="size-4" strokeWidth={2.4} />}
            title="Sizning manzilingiz"
            subtitle={destLabel}
            href={destHref}
            style={{ left: Math.min(Math.max(d.x - 105, 10), W - 220), top: Math.max(d.y - 66, 58) }}
          />
        ) : null}
        <Bubble
          tone="teal"
          icon={<Store className="size-4" strokeWidth={2.4} />}
          title={shop}
          subtitle="Sotuvchi"
          className="bottom-11 left-3"
        />
        <span className="absolute right-2 bottom-8 z-[3] rounded bg-white/80 px-1 text-[9px] text-[#4b5568]">
          © OpenStreetMap
        </span>
      </div>
    );
  }

  // No coordinates yet: honest schematic (seller → destination), courier drawn on the line only when yo‘lda/delivered.
  const s = { x: W * 0.16, y: H * 0.66 };
  const t = { x: W * 0.74, y: H * 0.45 };
  const routeD = `M${s.x} ${s.y} C${W * 0.36} ${H * 0.76}, ${W * 0.5} ${H * 0.6}, ${W * 0.6} ${H * 0.56} S${W * 0.7} ${H * 0.5}, ${t.x} ${t.y}`;
  const courierPos = delivered ? t : onWay ? { x: W * 0.6, y: H * 0.56 } : null;
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#eef1ee]" data-testid="track-map" data-map="schematic">
      <svg className="absolute inset-0" width={W} height={H} aria-hidden>
        <rect width={W} height={H} fill="#eef0ec" />
        <ellipse cx={W * 0.12} cy={H * 0.3} rx={60} ry={34} fill="#d6ead2" />
        <ellipse cx={W * 0.55} cy={H * 0.22} rx={46} ry={26} fill="#d6ead2" />
        <ellipse cx={W * 0.9} cy={H * 0.7} rx={70} ry={40} fill="#d6ead2" />
        <path d={`M${-10} ${H * 0.45} C${W * 0.3} ${H * 0.35}, ${W * 0.55} ${H * 0.95}, ${W + 10} ${H * 0.85}`} stroke="#F0FDFA" strokeWidth={10} fill="none" />
        {[0.2, 0.42, 0.66, 0.86].map((k) => (
          <path key={`v${k}`} d={`M${W * k} 0 L${W * (k + 0.05)} ${H}`} stroke="#ffffff" strokeWidth={7} />
        ))}
        {[0.18, 0.5, 0.8].map((k) => (
          <path key={`h${k}`} d={`M0 ${H * k} L${W} ${H * (k + 0.06)}`} stroke="#ffffff" strokeWidth={7} />
        ))}
        <path d={`M0 ${H * 0.62} C${W * 0.3} ${H * 0.58}, ${W * 0.6} ${H * 0.4}, ${W} ${H * 0.28}`} stroke="#fde9b0" strokeWidth={6} fill="none" />
        <path d={routeD} fill="none" stroke="#ffffff" strokeWidth={9} strokeLinecap="round" />
        <path d={routeD} fill="none" stroke="#0F766E" strokeWidth={5} strokeLinecap="round" />
      </svg>
      <SellerPin x={s.x} y={s.y} />
      <DestPin x={t.x} y={t.y} />
      {courierPos && !delivered ? <CourierPin x={courierPos.x} y={courierPos.y} live={false} /> : null}
      <Bubble
        tone="teal"
        icon={<Store className="size-4" strokeWidth={2.4} />}
        title={shop}
        subtitle="Sotuvchi"
        style={{ left: 10, top: s.y - 78 }}
      />
      <Bubble
        tone="blue"
        icon={<House className="size-4" strokeWidth={2.4} />}
        title="Sizning manzilingiz"
        subtitle={destLabel}
        href={destHref}
        style={{ right: 10, top: t.y - 72 }}
      />
      <span className="absolute bottom-9 left-3 z-[3] rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-semibold text-[#6b7280] shadow-sm">
        Sxema · aniq joylashuv hali yo‘q
      </span>
    </div>
  );
}

/* ---------------- Steps ---------------- */

/* ---------------- Screen ---------------- */

export function OrderTrackMobile({
  order,
  payLabel,
  details,
}: {
  order: Order;
  payLabel: string;
  /** Escrow / confirm / dispute / review blocks, opened from "Buyurtma tafsilotlari". */
  details: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(430);
  const [showAll, setShowAll] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 430));
    ro.observe(el);
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      ro.disconnect();
      clearInterval(t);
    };
  }, []);

  const pickup = isPickupOrder(order);
  const dest = useMemo(() => destinationPoint(order), [order]);
  const courier = order.courierLat != null && order.courierLng != null ? { lat: order.courierLat, lng: order.courierLng } : null;
  const address = cleanAddress(order) || "Manzil ko‘rsatilmagan";
  const addrShort = address.replace(/^Toshkent,\s*/i, "");
  const delivered = order.status === "yetkazildi";
  const refunded = order.paymentState === "refunded";

  const name = order.courierName?.trim() ?? "";
  const phone = order.courierPhone?.trim() ?? "";
  const trackHref = order.yandexTrackUrl?.trim() || courierMapLink(order);
  const locAge = order.courierLocationAt ? (now - new Date(order.courierLocationAt).getTime()) / 60000 : Infinity;

  // ETA: only an estimate from real coordinates (courier location ≤ 30 min old + destination pin).
  let etaBig = "";
  let etaLabel = "Yetib kelish vaqti";
  let chip: { text: string; tone: "green" | "gray" } = { text: "Vaqt aniqlanmoqda", tone: "gray" };
  if (refunded) {
    etaBig = "Bekor qilindi";
    chip = { text: "Pul qaytarildi", tone: "gray" };
  } else if (delivered) {
    etaLabel = "Yetkazilgan vaqt";
    etaBig = hm(historyAt(order, ["yetkazildi"])) || "Yetkazildi";
    chip = { text: "Yetkazildi", tone: "green" };
  } else if (order.status === "yolda" && courier && dest && locAge <= 30) {
    const mins = Math.max(3, Math.round(((haversineKm(courier, dest) * 1.35) / 22) * 60));
    const from = new Date(now + mins * 60000);
    const to = new Date(now + (mins + 10) * 60000);
    etaLabel = "Taxminiy yetib kelish vaqti";
    etaBig = `${hmDate(from)} – ${hmDate(to)}`;
    chip = { text: `${mins} daqiqa qoldi`, tone: "green" };
  } else {
    etaBig =
      order.status === "pending_accept"
        ? "Tasdiq kutilmoqda"
        : order.status === "yolda"
          ? "Kuryer yo‘lda"
          : order.status === "yigish_tugadi"
            ? "Kuryer kutilmoqda"
            : "Tayyorlanmoqda";
  }

  const items = order.items;

  async function copyId() {
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const statusTitle = refunded
    ? "bekor qilindi"
    : delivered
      ? "yetkazildi"
      : order.status === "pending_accept"
        ? "tasdiq kutilmoqda"
        : order.status === "yolda"
          ? "yo‘lda"
          : "qabul qilindi";
  const statusText = refunded
    ? "Buyurtma bekor qilindi, pul qaytarildi."
    : delivered
      ? "Buyurtmangiz manzilga yetkazildi."
      : order.status === "pending_accept"
        ? "Sotuvchi buyurtmangizni tez orada tasdiqlaydi."
        : "Buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada sizga yetkazib beriladi.";
  const active = order.status === "pending_accept" ? 0 : order.status === "yolda" ? 2 : delivered ? 4 : 1;
  const timeline = [
    { title: "Qabul qilindi", at: historyAt(order, ["qabul_qilindi"]) ?? order.confirmedAt, text: "Buyurtmangiz qabul qilindi." },
    { title: "Tayyorlanmoqda", at: historyAt(order, ["yigilmoqda", "yigish_tugadi"]), text: "Sotuvchi mahsulotlarni tayyorlamoqda." },
    { title: pickup ? "Olib ketishga tayyor" : "Yo‘lda", at: historyAt(order, ["yolda"]), text: pickup ? "Do‘kondan olib ketishingiz mumkin." : "Kuryer buyurtmangizni manzilga olib ketmoqda." },
    { title: "Yetkazildi", at: historyAt(order, ["yetkazildi"]), text: "Buyurtma manzilingizga yetkazildi." },
  ];
  const thumbs = items.slice(0, 5);
  const more = items.length - thumbs.length;

  return (
    <div className="-mx-4 -mt-4 space-y-2.5 bg-[#f5f9fd] px-3 pt-3 pb-5 text-[#111827] lg:hidden" data-testid="order-track-mobile">
      <div className="px-1">
        <h1 className="text-[22px] leading-tight font-extrabold tracking-tight">Buyurtmani kuzatish</h1>
        <p className="mt-0.5 text-[11px] text-[#7b8aa5]">Buyurtma holatini real vaqtda kuzating.</p>
      </div>

      <section className="flex items-center gap-3 rounded-[12px] border border-[#e9f0f5] bg-white p-3" data-testid="track-status">
        <span className="flex size-[56px] shrink-0 items-center justify-center rounded-full bg-[#F0FDFA]">
          <span className="flex size-[40px] items-center justify-center rounded-full bg-[#0F766E] text-white">
            {order.status === "yolda" ? <Scooter className="size-5" /> : <Check className="size-5" strokeWidth={3} />}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">Buyurtma #{order.id}</p>
          <p className="text-[15px] leading-tight font-bold text-[#0F766E]">{statusTitle}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-[#6a7c93]">{statusText}</p>
        </div>
        <span className="flex shrink-0 flex-col items-center rounded-[10px] bg-[#e6f7f6] px-2.5 py-2 text-center">
          <CalendarDays className="size-4 text-[#0F766E]" />
          <span className="mt-1 text-[8.5px] text-[#6a7c93]">Buyurtma sanasi</span>
          <span className="text-[10.5px] font-semibold">{dayLabel(order.createdAt, true)}</span>
          <span className="text-[9.5px] text-[#6a7c93]">{hm(order.createdAt)}</span>
        </span>
      </section>

      <ol className="rounded-[12px] border border-[#e9f0f5] bg-white px-3 py-2.5" data-testid="track-steps">
        {timeline.map((step, i) => {
          const done = i < active;
          const on = i === active;
          return (
            <li key={step.title} className="relative flex gap-3 pb-3 last:pb-0">
              {i < timeline.length - 1 ? (
                <span className={cn("absolute top-[26px] left-[13px] h-[calc(100%-22px)] w-[2px]", i < active ? "bg-[#0F766E]" : "bg-[#e3e8f0]")} aria-hidden />
              ) : null}
              <span className="relative z-[1] flex w-[28px] shrink-0 justify-center">
                {on ? (
                  <span className="flex size-[28px] items-center justify-center rounded-full bg-[#0F766E] text-white ring-4 ring-[#F0FDFA]">
                    {i === 2 ? <Scooter className="size-[14px]" /> : <Clock className="size-[14px]" />}
                  </span>
                ) : done ? (
                  <span className="flex size-[26px] items-center justify-center rounded-full bg-[#0F766E] text-white">
                    <Check className="size-[14px]" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="size-[26px] rounded-full border-2 border-[#d5dde6] bg-white" />
                )}
              </span>
              <span className="w-[42%] shrink-0">
                <span className={cn("block text-[12px] font-semibold", on ? "text-[#0F766E]" : done ? "text-[#111827]" : "text-[#6a7c93]")}>{step.title}</span>
                <span className={cn("block text-[10px]", on ? "text-[#0F766E]" : "text-[#8b93a7]")}>
                  {step.at ? `${dayLabel(step.at)}, ${hm(step.at)}` : "Kutilmoqda"}
                </span>
              </span>
              <span className="min-w-0 flex-1 pt-0.5 text-[9.5px] leading-snug text-[#6a7c93]">{step.text}</span>
            </li>
          );
        })}
      </ol>

      {!pickup ? (
        <section className="relative overflow-hidden rounded-[12px] border border-[#e9f0f5] bg-white" data-testid="track-eta">
          <div ref={boxRef} className="w-full" style={{ height: MAP_H }}>
            <TrackMap order={order} width={width} dest={dest} courier={courier} destLabel={addrShort} />
          </div>
          <div className="flex items-center gap-2.5 border-t border-[#eef1f5] px-3 py-2.5">
            <span className="flex size-[36px] items-center justify-center rounded-full bg-[#e6f7f6] text-[#0F766E]">
              <Scooter className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] text-[#0F766E]">{etaLabel}</span>
              <span className="block truncate text-[15px] leading-tight font-extrabold text-[#115E59]">{etaBig}</span>
            </span>
            {chip.tone === "green" ? <span className="shrink-0 rounded-[8px] bg-[#e3f8ec] px-2 py-1 text-[11px] font-semibold text-[#166534]">{chip.text}</span> : null}
          </div>
        </section>
      ) : null}

      {pickup ? (
        <section className="flex items-center gap-3 rounded-[12px] border border-[#e9f0f5] bg-white p-3">
          <span className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-[#e6f7f6] text-[#0F766E]">
            <Store className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-[#6a7c93]">Olib ketish</p>
            <p className="text-[13px] font-bold">Kuryer kerak emas — o‘zingiz olib ketasiz</p>
          </div>
        </section>
      ) : (
        <section className="flex items-center gap-2.5 rounded-[12px] border border-[#e9f0f5] bg-white p-2.5" data-testid="courier-card">
          <span
            className={cn(
              "flex size-[52px] shrink-0 items-center justify-center rounded-full text-[16px] font-bold",
              name ? "bg-[#0F766E] text-white" : "bg-[#eef3f7] text-[#9aa3b5]",
            )}
          >
            {name ? initials(name) : <Scooter className="size-6" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold">{name || "Kuryer tayinlanmagan"}</p>
            <p className="truncate text-[10.5px] text-[#6a7c93]">{order.carInfo || (name ? "Kuryer" : "Sotuvchi kuryer chaqirgach ko‘rinadi")}</p>
          </div>
          {phone ? (
            <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-[8px] border border-[#0F766E] px-2.5 text-[11px] font-semibold text-[#115E59]">
              <Phone className="size-[15px]" /> Qo‘ng‘iroq
            </a>
          ) : null}
          {trackHref ? (
            <a href={trackHref} target="_blank" rel="noopener noreferrer" className="flex h-[34px] shrink-0 items-center gap-1.5 rounded-[8px] border border-[#0F766E] px-2.5 text-[11px] font-semibold text-[#115E59]">
              <MapPinned className="size-[15px]" /> Kuzatish
            </a>
          ) : null}
        </section>
      )}

      <section className="rounded-[12px] border border-[#e9f0f5] bg-white p-3" data-testid="track-products">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-[13px] font-bold">
            <span className="flex size-[28px] items-center justify-center rounded-full bg-[#e6f7f6] text-[#0F766E]"><ShoppingBag className="size-[15px]" /></span>
            Mahsulotlar ({items.length} ta)
          </p>
          <button type="button" onClick={() => setShowAll((v) => !v)} className="flex items-center gap-0.5 text-[11px] font-semibold text-[#0F766E]">
            {showAll ? "Yig‘ish" : "Batafsil"}
            <ChevronRight className={cn("size-3.5 transition-transform", showAll && "rotate-90")} />
          </button>
        </div>
        {showAll ? (
          <ul className="mt-2">
            {items.map((it, i) => (
              <li key={`${it.productId}-${i}`} className="flex items-center gap-2.5 border-b border-[#eef1f5] py-2 last:border-0">
                <Thumb src={it.image} qty={it.qty} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold">{it.name}</p>
                  <p className="truncate text-[10.5px] text-[#6a7c93]">
                    {it.size || it.color ? `${apparelMetaLabel(it.size, it.color)} · ` : ""}
                    {it.qty} dona
                  </p>
                </div>
                <span className="shrink-0 text-[12px] font-bold text-[#0F766E]">{formatMoney(it.price * it.qty, "UZS")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-2.5 flex gap-1.5">
            {thumbs.map((it, i) => <Thumb key={`${it.productId}-${i}`} src={it.image} qty={it.qty} size={52} />)}
            {more > 0 ? <span className="flex size-[52px] items-center justify-center rounded-[10px] bg-[#f2f5f8] text-[13px] font-semibold text-[#6a7c93]">+{more}</span> : null}
          </div>
        )}
        <p className="mt-2.5 flex items-center justify-between text-[12px]">
          <span className="text-[#6a7c93]">Jami summa{order.bonusUsed ? ` (bonus −${formatMoney(order.bonusUsed, "UZS")})` : ""}</span>
          <b className="text-[14px]">{formatMoney(order.payable ?? order.total, "UZS")}</b>
        </p>
      </section>

      <section className="rounded-[12px] border border-[#e9f0f5] bg-white px-3" data-testid="track-info">
        {(() => {
          const destHref = destinationLink(order);
          const row = (
            <>
              <MapPin className="size-[16px] shrink-0 text-[#0F766E]" />
              <span className="shrink-0 text-[12px]">{pickup ? "Olib ketish" : "Manzil"}</span>
              <span className="min-w-0 flex-1 truncate text-right text-[11.5px] font-medium">{address}</span>
            </>
          );
          return destHref ? (
            <a href={destHref} target="_blank" rel="noopener noreferrer" className="flex h-[44px] items-center gap-2.5 border-b border-[#eef1f5]">{row}</a>
          ) : (
            <div className="flex h-[44px] items-center gap-2.5 border-b border-[#eef1f5]">{row}</div>
          );
        })()}
        <div className="flex h-[44px] items-center gap-2.5 border-b border-[#eef1f5]">
          <Package className="size-[16px] shrink-0 text-[#0F766E]" />
          <span className="shrink-0 text-[12px]">Buyurtma raqami</span>
          <span className="min-w-0 flex-1 truncate text-right text-[11.5px] font-semibold">{order.id}</span>
          <button type="button" onClick={copyId} aria-label="Nusxa olish" className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#f1f4f8] text-[#4b5568]">
            {copied ? <Check className="size-4 text-[#0F766E]" /> : <Copy className="size-[14px]" />}
          </button>
        </div>
        <button type="button" onClick={() => setOpenDetails((v) => !v)} className="flex h-[44px] w-full items-center gap-2.5 text-left" data-testid="track-total">
          <CreditCard className="size-[16px] shrink-0 text-[#0F766E]" />
          <span className="shrink-0 text-[12px]">To‘lov va tasdiqlash</span>
          <span className="min-w-0 flex-1 truncate text-right text-[11.5px] font-medium">{payLabel}</span>
          <ChevronRight className={cn("size-4 shrink-0 text-[#8b93a7] transition-transform", openDetails && "rotate-90")} />
        </button>
      </section>

      {openDetails ? <div className="space-y-3" data-testid="track-details">{details}</div> : null}

      <div className="grid grid-cols-2 gap-2">
        <a href={site.telegram} target="_blank" rel="noopener noreferrer" className="flex h-[40px] items-center justify-center gap-2 rounded-[9px] border border-[#0F766E] bg-white text-[12px] font-semibold text-[#115E59]">
          <Headset className="size-[16px]" /> Yordam
        </a>
        <Link href="/buyurtmalarim" className="flex h-[40px] items-center justify-center gap-2 rounded-[9px] bg-[#0F766E] text-[12px] font-semibold text-white">
          <FileText className="size-[16px]" /> Buyurtmalarim
        </Link>
      </div>
    </div>
  );
}

function Thumb({ src, qty, size }: { src: string; qty: number; size: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f4f6f9] ring-1 ring-[#eef1f5]"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-contain" loading="lazy" />
      ) : (
        <Package className="size-5 text-[#b6bfcc]" />
      )}
      <span className="absolute right-0.5 bottom-0.5 rounded-[5px] bg-white px-1 text-[9.5px] leading-[14px] font-bold text-[#0B1220] shadow-sm">
        x{qty}
      </span>
    </span>
  );
}
