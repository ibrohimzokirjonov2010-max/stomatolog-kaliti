"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Copy, ExternalLink, Headphones, House, MapPin, MessageSquare, Phone, Star, Truck, UserRound, X, XCircle } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { catalogHref } from "@/lib/catalog-client";
import { isPickupOrder, openOrderDispute, type Order } from "@/lib/orders";
import { etaText, orderBadge, orderSums, payTitle, shopTitle, som, stamp, StepDot, SUPPORT_URL, Timeline, trackSteps, useOrder } from "./order-shared";
import "./order-desktop.css";

const HEADLINE: Record<string, [string, string]> = {
  wait: ["Tasdiq kutilmoqda", "Sotuvchi buyurtmangizni tez orada tasdiqlaydi."],
  prep: ["Buyurtmangiz tayyorlanmoqda", "Sotuvchi mahsulotlarni yig‘moqda. Tayyor bo‘lgach kuryerga topshiriladi."],
  go: ["Buyurtmangiz yo‘lda", "Buyurtmangiz manzilingizga yetkazib berilmoqda. Iltimos, telefoningizni yoqib qo‘ying."],
  done: ["Buyurtma yetkazildi", "Buyurtmangiz topshirildi. Xaridingiz uchun rahmat!"],
  off: ["Buyurtma bekor qilingan", "To‘lov sizga qaytarildi."],
};

function mapsHref(order: Order) {
  return `https://yandex.uz/maps/?text=${encodeURIComponent(`${order.city}, ${order.address}`)}`;
}

/** Real pin when the seller shared courier coordinates, otherwise the static city map. */
function TrackMap({ order, tall }: { order: Order; tall?: boolean }) {
  const lat = order.courierLat;
  const lng = order.courierLng;
  if (lat != null && lng != null) {
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.012}%2C${lat - 0.007}%2C${lng + 0.012}%2C${lat + 0.007}&layer=mapnik&marker=${lat}%2C${lng}`;
    return <div className={tall ? "odx-map tall" : "odx-map"}><iframe title="Kuryer joylashuvi" src={src} loading="lazy" />{order.courierLocationAt ? <span className="chip">Yangilangan: {stamp(order.courierLocationAt, false)}</span> : null}</div>;
  }
  return (
    <div className={tall ? "odx-map tall" : "odx-map"}>
      <img src="/img/designs/toshkent-map.png" alt="" />
      <span className="chip">{order.status === "yolda" ? "Taxminiy yo‘nalish" : order.status === "yetkazildi" ? "Yetkazib berildi" : "Kuryer hali yo‘lga chiqmagan"}</span>
    </div>
  );
}

function CourierCard({ order, wide }: { order: Order; wide?: boolean }) {
  const name = order.courierName?.trim();
  const phone = order.courierPhone?.trim();
  if (isPickupOrder(order)) {
    return <div className="odx-courier"><span className="ava"><MapPin size={26} /></span><div><b>Olib ketish</b><small>Buyurtmani do‘kondan o‘zingiz olib ketasiz</small></div></div>;
  }
  return (
    <>
      <div className="odx-courier" data-testid="track-courier">
        <span className="ava"><UserRound size={30} /></span>
        <div>
          <b>{name || "Kuryer tayinlanmagan"}{name ? <em><Star size={14} />Kuryer</em> : null}</b>
          <small>{name ? order.carInfo?.trim() || "StomaHub kuryeri" : "Sotuvchi kuryerni tayinlagach ismi va raqami shu yerda chiqadi"}</small>
          {phone && wide ? <span className="tel">{phone}</span> : null}
        </div>
      </div>
      {phone ? (
        <div className="odx-two">
          <a className="odx-btn" href={`tel:${phone.replace(/[^\d+]/g, "")}`}><Phone size={16} />Qo‘ng‘iroq qilish</a>
          <a className="odx-btn solid" href={`sms:${phone.replace(/[^\d+]/g, "")}`}><MessageSquare size={16} />Xabar yozish</a>
        </div>
      ) : null}
    </>
  );
}

export function TrackDesktop({ id }: { id: string }) {
  const { order } = useOrder(id);
  if (order === undefined) return <ClinicShell accent="teal"><div className="odx"><p className="odx-empty">Yuklanmoqda…</p></div></ClinicShell>;
  if (order === null) {
    return (
      <ClinicShell accent="teal">
        <div className="odx"><div className="odx-empty"><h1>Buyurtma topilmadi</h1><p>Bu buyurtma sizning hisobingizda yo‘q.</p><Link className="odx-btn solid" href="/buyurtmalarim">Buyurtmalarimga qaytish</Link></div></div>
      </ClinicShell>
    );
  }
  const badge = orderBadge(order);
  const [title, text] = HEADLINE[badge.tone];
  const { goods, goodsSum, delivery, discount, total } = orderSums(order);
  const steps = trackSteps(order).filter((step) => step.key !== "tolov" && step.key !== "topshirildi");
  const history = [...order.statusHistory].reverse();
  const [addrMain, ...addrRest] = order.address.split(", ");

  return (
    <ClinicShell accent="teal">
      <div className="odx" data-testid="track-desktop" data-order={order.id}>
        <div className="odx-crumb"><Link href="/" aria-label="Bosh sahifa"><House size={14} /></Link><Link href="/">Bosh sahifa</Link><span>›</span><Link href="/buyurtmalarim">Buyurtmalarim</Link><span>›</span><b>Buyurtmani kuzatish</b></div>
        <div className="odx-grid track">
          <div className="odx-main">
            <div className="odx-trackhead">
              <div>
                <h1>Buyurtma #{order.id}</h1>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <div className="odx-eta"><Clock size={34} /><span><small>Taxminiy yetkazib berish vaqti</small><b>{etaText(order).replace(/^Taxminiy yetkazish: /, "").replace(/^bugun$/, "Bugun") || "—"}</b></span></div>
            </div>
            <ol className="odx-hsteps" data-testid="track-steps">
              {steps.map((step) => (
                <li key={step.key} className={step.state}>
                  <StepDot step={step} />
                  <b>{step.title}</b>
                  <small>{step.at || (step.state === "todo" ? "Tez orada" : "")}</small>
                  <span>{step.state === "todo" ? "" : step.hint}</span>
                </li>
              ))}
            </ol>
            <TrackMap order={order} tall />
            <section className="odx-card">
              <div className="odx-chead"><MapPin size={18} /><h2>Yetkazish manzili</h2></div>
              <div className="odx-addr inline">
                <img src="/img/designs/toshkent-map.png" alt="" />
                <div><b>{order.name}</b><span>{order.phone}</span><span>{order.city}{addrMain ? `, ${addrMain}` : ""}</span>{addrRest.length ? <span>{addrRest.join(", ")}</span> : null}</div>
                <a className="odx-btn" href={mapsHref(order)} target="_blank" rel="noopener noreferrer"><MapPin size={16} />Manzilni ko‘rish</a>
              </div>
            </section>
            <section className="odx-card">
              <div className="odx-chead"><Truck size={18} /><h2>Kuryer holati</h2></div>
              <ul className="odx-log">
                {history.length ? history.map((entry, index) => {
                  const step = trackSteps({ ...order, status: entry.status }).find((item) => item.state === "current") ?? trackSteps(order)[0];
                  return <li key={`${entry.status}-${entry.at}`} className={index === 0 ? "on" : undefined}><i /><b>{step.title}</b><span>{stamp(entry.at)}</span><small>{entry.note || step.hint}</small></li>;
                }) : <li className="on"><i /><b>Buyurtma berildi</b><span>{stamp(order.createdAt)}</span><small>Sotuvchi tasdiqlashi kutilmoqda</small></li>}
              </ul>
            </section>
            <div className="odx-navrow">
              <a className="odx-btn big" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer"><Headphones size={18} />Yordam</a>
              <Link className="odx-btn big solid" href="/buyurtmalarim"><ArrowLeft size={18} />Buyurtmalarimga qaytish</Link>
            </div>
          </div>

          <aside className="odx-side">
            <section className="odx-card">
              <div className="odx-chead"><h2>Kuryer ma’lumotlari</h2></div>
              <CourierCard order={order} wide />
              {order.yandexTrackUrl ? <a className="odx-btn wide" href={order.yandexTrackUrl} target="_blank" rel="noopener noreferrer">Yandex Go’da kuzatish<ExternalLink size={14} /></a> : null}
            </section>
            <section className="odx-card">
              <div className="odx-chead"><h2>Buyurtma mahsulotlari ({goods.length} ta)</h2></div>
              <div className="odx-lines">
                {goods.map((item, index) => (
                  <Link key={`${item.productId}-${index}`} href={catalogHref(item.category ?? "", item.productId)} className="odx-line"><img src={item.image} alt="" /><span><b>{item.name}</b><small>{item.qty} dona</small></span><em>{som(item.price * item.qty)}</em></Link>
                ))}
              </div>
              <div className="odx-sum">
                <span>Mahsulotlar ({goods.length} ta)<b>{som(goodsSum)}</b></span>
                <span>Yetkazish<b>{delivery ? som(delivery) : "Bepul"}</b></span>
                <span>Chegirma (promokod)<b>{discount ? `− ${som(discount)}` : "0 so‘m"}</b></span>
                <span className="total">Jami<b>{som(total)}</b></span>
              </div>
            </section>
            <section className="odx-card">
              <div className="odx-chead"><h2>Buyurtma ma’lumotlari</h2></div>
              <dl className="odx-dl">
                <dt>Buyurtma raqami</dt><dd><Link href={`/buyurtmalarim/${encodeURIComponent(order.id)}`}>#{order.id}</Link></dd>
                <dt>Sana</dt><dd>{stamp(order.createdAt)}</dd>
                <dt>Do‘kon</dt><dd>{shopTitle(order)}</dd>
                <dt>To‘lov usuli</dt><dd>{payTitle(order)}</dd>
                <dt>Holati</dt><dd><span className={`odx-badge sm ${badge.tone}`}>{badge.label}</span></dd>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}

/** Side panel opened from the orders list (design: buyutmani kuzaiths). */
export function TrackDrawer({ order, onClose, onChanged }: { order: Order; onClose: () => void; onChanged?: () => void }) {
  const badge = orderBadge(order);
  const [copied, setCopied] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const canCancel = order.status !== "yetkazildi" && (order.paymentState === "escrow_held" || order.paymentState === "awaiting_payment") && order.dispute?.status !== "open";
  const [addrMain, ...addrRest] = order.address.split(", ");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function sendCancel() {
    if (reason.trim().length < 5) { setMsg("Sababni qisqacha yozing (kamida 5 belgi)"); return; }
    setBusy(true);
    const res = await openOrderDispute(order.id, `Bekor qilish: ${reason.trim()}`);
    setBusy(false);
    if (!res.ok) { setMsg(res.reason); return; }
    setCancel(false);
    setMsg("Bekor qilish so‘rovi yuborildi. Administrator ko‘rib chiqadi.");
    onChanged?.();
  }

  return (
    <div className="odx-scrim" onClick={onClose}>
      <aside className="odx odx-drawer" role="dialog" aria-label={`Buyurtma #${order.id}`} data-testid="track-drawer" onClick={(event) => event.stopPropagation()}>
        <header>
          <span className="ico"><Truck size={26} /></span>
          <div><h2>Buyurtma #{order.id}</h2><small>{stamp(order.createdAt)} da berilgan</small></div>
          <button type="button" className="x" aria-label="Yopish" onClick={onClose}><X size={22} /></button>
          <span className={`odx-badge sm ${badge.tone}`}>{badge.label}</span>
        </header>
        <div className="odx-dgrid">
          <Timeline order={order} compact />
          <div>
            <TrackMap order={order} />
            <section className="odx-card flat"><CourierCard order={order} /></section>
          </div>
        </div>
        <div className="odx-dgrid even">
          <section className="odx-card flat">
            <div className="odx-chead"><MapPin size={18} /><h2>Yetkazish manzili</h2></div>
            <div className="odx-addr"><img src="/img/designs/toshkent-map.png" alt="" /><div><b>{order.name}</b><span>{order.phone}</span><span>{order.city}{addrMain ? `, ${addrMain}` : ""}</span>{addrRest.length ? <span>{addrRest.join(", ")}</span> : null}</div></div>
            <a className="odx-btn right" href={mapsHref(order)} target="_blank" rel="noopener noreferrer"><MapPin size={16} />Xaritada ko‘rish</a>
          </section>
          <section className="odx-card flat">
            <div className="odx-chead"><Truck size={18} /><h2>Kuzatuv havolasi</h2></div>
            {order.yandexTrackUrl ? (
              <>
                <div className="odx-code"><code>{order.yandexTrackUrl.replace(/^https?:\/\//, "").slice(0, 28)}…</code><button type="button" className="odx-btn" onClick={() => { void navigator.clipboard?.writeText(order.yandexTrackUrl ?? "").then(() => setCopied(true)); }}><Copy size={15} />{copied ? "Nusxalandi" : "Nusxa olish"}</button></div>
                <p className="odx-muted">Ushbu havola orqali yetkazib berish holatini tekshirishingiz mumkin.</p>
                <a className="odx-btn wide" href={order.yandexTrackUrl} target="_blank" rel="noopener noreferrer">Yandex Tracking da kuzatish<ExternalLink size={14} /></a>
              </>
            ) : <p className="odx-muted">Sotuvchi kuryerga topshirgach, Yandex kuzatuv havolasi shu yerda paydo bo‘ladi.</p>}
          </section>
        </div>
        {msg ? <p className="odx-note">{msg}</p> : null}
        {cancel ? (
          <section className="odx-card flat odx-dispute">
            <textarea rows={2} maxLength={500} placeholder="Nega bekor qilmoqchisiz?" value={reason} onChange={(event) => setReason(event.target.value)} />
            <div><button type="button" className="odx-btn" onClick={() => setCancel(false)}>Orqaga</button><button type="button" className="odx-btn danger" disabled={busy} onClick={() => void sendCancel()}>So‘rov yuborish</button></div>
          </section>
        ) : null}
        <footer>
          <a className="odx-btn big" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer"><Headphones size={18} />Yordam</a>
          <Link className="odx-btn big" href={`/buyurtmalarim/${encodeURIComponent(order.id)}/kuzatish`}>To‘liq kuzatish</Link>
          {canCancel ? <button type="button" className="odx-btn big danger-line" onClick={() => setCancel(true)}><XCircle size={18} />Buyurtmani bekor qilish</button> : null}
        </footer>
      </aside>
    </div>
  );
}
