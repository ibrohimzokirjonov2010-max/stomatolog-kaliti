"use client";

import { Bike, Car, MapPin, Navigation, Phone, UserRound } from "lucide-react";
import { courierMapLink } from "@/lib/courier-location";
import { isPickupOrder, type Order } from "@/lib/orders";
import { tashkentDayMonth, tashkentHm } from "@/lib/tashkent-date";

function timeLabel(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
  const hm = tashkentHm(d);
  if (diff < 1) return `hozirgina · ${hm}`;
  if (diff < 60) return `${diff} daqiqa oldin · ${hm}`;
  const sameDay = tashkentDayMonth(new Date()) === tashkentDayMonth(d);
  return sameDay ? `bugun ${hm}` : `${tashkentDayMonth(d)} ${hm}`;
}

/** Courier block on the buyer's order page (Yandex kuryer delivery only). Shows only what seller/admin entered. */
export function OrderCourierCard({ order }: { order: Order }) {
  if (isPickupOrder(order) || order.paymentState === "refunded") return null;

  const name = order.courierName?.trim();
  const phone = order.courierPhone?.trim();
  const car = order.carInfo?.trim();
  const track = order.yandexTrackUrl?.trim();
  const hasPin = order.courierLat != null && order.courierLng != null;
  const mapLink = courierMapLink(order);
  const assigned = Boolean(name || phone || track || mapLink);
  const delivered = order.status === "yetkazildi";

  if (!assigned) {
    return (
      <section className="rounded-[20px] border border-[#eceff5] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:px-5" data-testid="courier-card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold text-[#1a1d26]">Kuryer</h2>
          <span className="rounded-full bg-[#f4f7fb] px-2.5 py-0.5 text-[11px] font-semibold text-[#6b7280]">Yandex kuryer</span>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#f7f9fc] px-3.5 py-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#9aa3b5] ring-1 ring-[#e8ecf3]">
            <UserRound className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#4b5568]">Kuryer tayinlanmagan</p>
            <p className="mt-0.5 text-[12px] leading-snug text-[#8b93a7]">
              Sotuvchi kuryerni tayinlagach ismi, raqami va joylashuvi shu yerda chiqadi.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const lat = order.courierLat ?? 0;
  const lng = order.courierLng ?? 0;
  const embed = hasPin
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.008}%2C${lat - 0.005}%2C${lng + 0.008}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`
    : "";
  const when = timeLabel(order.courierLocationAt);

  return (
    <section className="overflow-hidden rounded-[20px] border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]" data-testid="courier-card">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 sm:px-5">
        <h2 className="text-[15px] font-semibold text-[#1a1d26]">Kuryer</h2>
        <span className="rounded-full bg-[#e8f1ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#0066FF]">Yandex kuryer</span>
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0066FF] to-[#3b82f6] text-[15px] font-bold text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)]">
          {name ? name[0].toUpperCase() : <Bike className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-semibold text-[#1a1d26]">{name || "Ism ko‘rsatilmagan"}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-[#8b93a7]">{phone || "Raqam ko‘rsatilmagan"}</p>
          {car ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-[#6b7280]">
              <Car className="size-3.5 shrink-0" />
              {car}
            </p>
          ) : null}
        </div>
        {phone ? (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, "")}`}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#0066FF] px-4 text-[13px] font-semibold text-white shadow-[0_6px_14px_rgba(0,102,255,0.25)] hover:bg-[#0058dd]"
          >
            <Phone className="size-3.5" />
            Qo‘ng‘iroq
          </a>
        ) : null}
      </div>

      <div className="border-t border-[#f0f3f8] px-4 py-3.5 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#1a1d26]">
            <MapPin className="size-3.5 text-[#0066FF]" />
            {delivered ? "Oxirgi joylashuv" : "Kuryer qayerda"}
          </p>
          {when ? <span className="text-[11.5px] text-[#8b93a7]">Yangilangan: {when}</span> : null}
        </div>
        {hasPin ? (
          <div className="mt-2.5 overflow-hidden rounded-2xl ring-1 ring-[#e8ecf3]">
            <iframe title="Kuryer joylashuvi" src={embed} className="block h-[170px] w-full border-0" loading="lazy" />
          </div>
        ) : null}
        {mapLink ? (
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2.5 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f0] bg-white text-[13px] font-semibold text-[#1a1d26] hover:border-[#0066FF]/40 hover:bg-[#f5f9ff]"
          >
            <Navigation className="size-3.5 text-[#0066FF]" />
            Xaritada ochish
          </a>
        ) : (
          <p className="mt-1.5 text-[12px] text-[#8b93a7]">Joylashuv hali yuborilmagan.</p>
        )}
        {track ? (
          <a
            href={track}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0B1220] text-[13px] font-semibold text-white hover:bg-[#1a2333]"
          >
            Yandex Go’da jonli kuzatish
          </a>
        ) : null}
      </div>
    </section>
  );
}
