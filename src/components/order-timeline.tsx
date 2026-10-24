"use client";

import { tashkentDayMonth, tashkentHm } from "@/lib/tashkent-date";
import { Check, Clock, Package, Truck } from "lucide-react";
import {
  DISPLAY_STEPS,
  displayStepIndex,
  orderStatusCopy,
  orderStatusLabel,
  type Order,
} from "@/lib/orders";
import { cn } from "@/lib/utils";

function StepIcon({
  stepId,
  done,
  active,
}: {
  stepId: (typeof DISPLAY_STEPS)[number]["id"];
  done: boolean;
  active: boolean;
}) {
  const cls = cn(
    "transition-colors",
    active || done ? "text-white" : "text-[#b0b7c6]",
    active ? "size-[22px]" : "size-[18px]",
  );
  if (done && !active) {
    return <Check className="size-[18px] text-white" strokeWidth={2.75} />;
  }
  if (stepId === "qabul") return <Clock className={cls} strokeWidth={2.1} />;
  if (stepId === "yigish") return <Package className={cls} strokeWidth={2.1} />;
  if (stepId === "yolda") return <Truck className={cls} strokeWidth={2.1} />;
  return <Check className={cls} strokeWidth={2.4} />;
}

/**
 * Tezkor-style buyer progress: big ETA headline + horizontal 4 circles + one subtitle.
 * Internal 6 statuses collapse into 4 display steps.
 */
export function OrderTimeline({ order }: { order: Order }) {
  const activeIdx = displayStepIndex(order.status);
  const copy = orderStatusCopy(order.status);

  return (
    <div className="w-full">
      <div className="text-center sm:text-left">
        <p className="text-[13px] font-medium text-[#8b93a7]">Yetkazib beramiz:</p>
        <h2 className="mt-0.5 text-[28px] font-bold leading-[1.15] tracking-tight text-[#1a1d26] sm:text-[32px]">
          {copy.eta}
        </h2>
      </div>

      <ol className="mt-6 flex items-end justify-between gap-1 px-1 sm:mt-7 sm:px-4">
        {DISPLAY_STEPS.map((step, index) => {
          const done = index < activeIdx;
          const active = index === activeIdx;
          const connectorDone = index < activeIdx;
          return (
            <li key={step.id} className="relative flex flex-1 flex-col items-center">
              {index < DISPLAY_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "absolute top-[22px] left-[calc(50%+26px)] h-[3px] w-[calc(100%-52px)] rounded-full sm:top-[24px]",
                    connectorDone ? "bg-[#0F766E]" : "bg-[#e8ecf3]",
                  )}
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "relative z-[1] flex items-center justify-center rounded-full transition-all duration-200",
                  active &&
                    "size-[52px] bg-[#0F766E] shadow-[0_0_0_6px_rgba(15,118,110,0.14),0_8px_20px_rgba(15,118,110,0.28)] sm:size-[56px]",
                  done && !active && "size-[44px] bg-[#0F766E] sm:size-[46px]",
                  !done &&
                    !active &&
                    "size-[44px] bg-[#f1f4f9] ring-1 ring-[#e4e9f1] sm:size-[46px]",
                )}
                aria-current={active ? "step" : undefined}
              >
                <StepIcon stepId={step.id} done={done} active={active} />
              </span>
            </li>
          );
        })}
      </ol>

      <p className="mt-5 text-center text-[14px] leading-relaxed text-[#5b6475] sm:mt-6 sm:text-[15px]">
        {copy.subtitle}
      </p>

      {order.statusHistory.length ? (
        <div className="mt-6 border-t border-[#eef1f6] pt-4" data-testid="order-history">
          <h3 className="text-[13px] font-semibold text-[#8b93a7]">Buyurtma tarixi</h3>
          <ol className="mt-3 space-y-3">
            {[...order.statusHistory].reverse().map((h, i) => (
              <li key={`${h.status}-${h.at}-${i}`} className="flex gap-3">
                <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", i === 0 ? "bg-[#0F766E] ring-4 ring-[#0F766E]/15" : "bg-[#c5cfe0]")} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-[14px] font-semibold text-[#1a1d26]">{orderStatusLabel[h.status] ?? h.status}</p>
                    <time className="text-[12px] text-[#8b93a7]" dateTime={h.at}>
                      {`${tashkentDayMonth(new Date(h.at))}, ${tashkentHm(new Date(h.at))}`}
                    </time>
                  </div>
                  {h.note ? <p className="text-[12.5px] leading-snug text-[#6b7280]">{h.note}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function MapCanvas({ delivered }: { delivered?: boolean }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 390 220"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="mapFade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e3ebf4" />
          <stop offset="55%" stopColor="#d5e0ec" />
          <stop offset="100%" stopColor="#c8d5e4" />
        </linearGradient>
        <linearGradient id="routeGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0F766E" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#0F766E" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#0F766E" stopOpacity="0.15" />
        </linearGradient>
        <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodOpacity="0.28" />
        </filter>
      </defs>
      <rect width="390" height="220" fill="url(#mapFade)" />
      {/* city blocks */}
      <rect x="12" y="22" width="64" height="42" rx="5" fill="#f5f8fb" opacity="0.95" />
      <rect x="88" y="12" width="78" height="52" rx="5" fill="#eef3f8" />
      <rect x="180" y="28" width="48" height="36" rx="5" fill="#f5f8fb" />
      <rect x="245" y="16" width="70" height="48" rx="5" fill="#e8f0f7" />
      <rect x="328" y="30" width="50" height="40" rx="5" fill="#f1f5f9" />
      <rect x="24" y="118" width="72" height="46" rx="5" fill="#eef3f8" />
      <rect x="112" y="135" width="88" height="50" rx="5" fill="#f5f8fb" />
      <rect x="220" y="128" width="60" height="42" rx="5" fill="#e8f0f7" />
      <rect x="300" y="140" width="72" height="44" rx="5" fill="#f1f5f9" />
      {/* park */}
      <ellipse cx="70" cy="90" rx="28" ry="16" fill="#c5dfc8" opacity="0.55" />
      <ellipse cx="310" cy="100" rx="22" ry="14" fill="#c5dfc8" opacity="0.4" />
      {/* roads */}
      <path d="M0 108 H390" stroke="#ffffff" strokeWidth="16" opacity="0.95" />
      <path d="M0 108 H390" stroke="#b8c5d4" strokeWidth="1.5" strokeDasharray="10 12" opacity="0.65" />
      <path d="M155 0 V220" stroke="#ffffff" strokeWidth="13" opacity="0.9" />
      <path d="M280 0 V220" stroke="#ffffff" strokeWidth="10" opacity="0.85" />
      {/* route glow under path */}
      <path
        d="M48 168 C95 155 120 130 155 108 C200 78 250 58 332 48"
        fill="none"
        stroke="url(#routeGlow)"
        strokeWidth="14"
        strokeLinecap="round"
      />
      {/* main route shop → doctor */}
      <path
        d="M48 168 C95 155 120 130 155 108 C200 78 250 58 332 48"
        fill="none"
        stroke="#0F766E"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.92"
      />
      {/* origin (shop) dot */}
      <g transform="translate(40,160)" filter="url(#pinShadow)">
        <circle cx="8" cy="8" r="11" fill="white" />
        <circle cx="8" cy="8" r="7.5" fill="#1a1d26" />
        <circle cx="8" cy="8" r="3" fill="white" />
      </g>
      {/* destination pin */}
      <g transform="translate(320,20)" filter="url(#pinShadow)">
        <path
          d="M12 0 C5.4 0 0 5.4 0 12 C0 21 12 34 12 34 S24 21 24 12 C24 5.4 18.6 0 12 0Z"
          fill="#0F766E"
        />
        <circle cx="12" cy="12" r="4.5" fill="white" />
      </g>
      {/* car on route — mid path */}
      {!delivered ? (
        <g transform="translate(148,88)" filter="url(#pinShadow)">
          <circle cx="20" cy="20" r="20" fill="white" />
          <circle cx="20" cy="20" r="16.5" fill="#0F766E" />
          <rect x="9" y="16" width="22" height="10" rx="2.5" fill="white" />
          <path d="M12 16 L15 11 H24 L28 16 Z" fill="white" opacity="0.95" />
          <circle cx="14" cy="27" r="2.4" fill="#0f172a" />
          <circle cx="26" cy="27" r="2.4" fill="#0f172a" />
        </g>
      ) : (
        <g transform="translate(310,42)" filter="url(#pinShadow)">
          <circle cx="16" cy="16" r="14" fill="#10b981" />
          <path
            d="M10 16.5 L14 20.5 L22 12.5"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

/**
 * Top-of-page Tezkor map: where delivery is coming from → where it’s going.
 * Shown when status is yolda/yetkazildi or a Yandex track URL exists.
 */
export function OrderTrackMap({ order }: { order: Order }) {
  const show =
    order.status === "yolda" ||
    order.status === "yetkazildi" ||
    Boolean(order.yandexTrackUrl);
  if (!show) return null;

  const hasTrack = Boolean(order.yandexTrackUrl?.trim());
  const delivered = order.status === "yetkazildi";
  const origin = order.shopName?.trim() || "Do‘kon";
  const destShort =
    order.address?.trim().length > 36
      ? `${order.address.trim().slice(0, 34)}…`
      : order.address?.trim() || order.city;

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#eceff5] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
      <div className="relative h-[210px] w-full overflow-hidden bg-[#d5e0ec] sm:h-[240px]">
        <MapCanvas delivered={delivered} />

        {/* Origin / destination chips — answers "qayerdan / qayerga" */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-1.5 p-3">
          <span className="pointer-events-auto inline-flex max-w-[78%] items-center gap-1.5 self-start rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#1a1d26] shadow-sm ring-1 ring-black/5">
            <span className="size-1.5 shrink-0 rounded-full bg-[#1a1d26]" />
            <span className="truncate">
              {origin}
              {order.city ? ` · ${order.city}` : ""}
            </span>
          </span>
          <span className="pointer-events-auto inline-flex max-w-[85%] items-center gap-1.5 self-end rounded-full bg-[#0F766E] px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_4px_12px_rgba(15,118,110,0.35)]">
            <span className="size-1.5 shrink-0 rounded-full bg-white" />
            <span className="truncate">{destShort}</span>
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/40 via-black/15 to-transparent px-3 pb-3 pt-12">
          {hasTrack ? (
            <a
              href={order.yandexTrackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-[#1a1d26] shadow-[0_4px_14px_rgba(15,23,42,0.2)] transition hover:bg-[#f7f9fc]"
            >
              Yandex Go’da kuzatish
            </a>
          ) : (
            <span className="inline-flex h-9 items-center rounded-full bg-white/90 px-3 text-[12px] font-semibold text-[#4b5568] shadow-sm">
              {delivered ? "Yetkazib berildi" : "Yo‘lda · karta taxminiy"}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-[#1a1d26] shadow-sm ring-1 ring-black/5">
            <span className="relative flex size-2">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-70",
                  delivered ? "bg-emerald-400" : "animate-ping bg-emerald-400",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  delivered ? "bg-emerald-500" : "bg-emerald-500",
                )}
              />
            </span>
            {delivered ? "Yetkazildi" : hasTrack ? "Jonli" : "Yo‘lda"}
          </span>
        </div>
      </div>

      {/* Empty-state hint only when yolda without track and no courier info */}
      {!hasTrack && order.status === "yolda" ? (
        <p className="border-t border-[#f0f3f8] px-4 py-2.5 text-center text-[12px] text-[#8b93a7]">
          Sotuvchi Yandex Taxi linkini qo‘shsa — aniq jonli kuzatuv ochiladi
        </p>
      ) : null}

    </div>
  );
}
