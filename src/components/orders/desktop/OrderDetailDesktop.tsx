"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CreditCard,
  FileText,
  Headphones,
  House,
  MapPin,
  Receipt,
  RotateCcw,
  ShoppingCart,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { ContactSeller } from "@/components/contact-seller";
import { shopAdd } from "@/components/shop/desktop/shop-cart";
import { apparelMetaLabel } from "@/data/forma";
import { catalogHref } from "@/lib/catalog-client";
import { confirmOrderReceipt, openOrderDispute, type Order, type OrderItem } from "@/lib/orders";
import { etaText, orderBadge, orderSums, payTitle, printOrder, shopTitle, som, stamp, SUPPORT_URL, Timeline, useOrder } from "./order-shared";
import "./order-desktop.css";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function PayMark({ order }: { order: Order }) {
  if (order.payment === "click") return <span className="odx-pay click"><i /></span>;
  if (order.payment === "payme") return <span className="odx-pay payme">P</span>;
  return <span className="odx-pay cash"><CreditCard size={20} /></span>;
}

type Reviewed = { rating: number; body?: string };

function ReviewCard({ order }: { order: Order }) {
  const [eligible, setEligible] = useState(false);
  const [done, setDone] = useState<Record<string, Reviewed>>({});
  const [stars, setStars] = useState<Record<string, number>>({});
  const [open, setOpen] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    fetch(`/api/reviews?order=${encodeURIComponent(order.id)}`, { credentials: "same-origin", cache: "no-store" })
      .then((r) => r.json())
      .then((j: { ok?: boolean; eligible?: boolean; reviewed?: ({ productId: string } & Reviewed)[] }) => {
        if (!alive || !j.ok) return;
        setEligible(Boolean(j.eligible));
        setDone(Object.fromEntries((j.reviewed ?? []).map((row) => [row.productId, row])));
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, [order.id]);
  const items = order.items.filter((item) => item.shopId && UUID_RE.test(item.productId));
  if (!eligible || !items.length) return null;

  async function send(item: OrderItem) {
    const rating = stars[item.productId] ?? 0;
    if (!rating) { setErr("Avval yulduzcha bilan baholang"); setOpen(item.productId); return; }
    setBusy(true);
    setErr("");
    const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ orderId: order.id, productId: item.productId, rating, cats: {}, body }) }).catch(() => null);
    const j = (await res?.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    setBusy(false);
    if (!j?.ok) { setErr(j?.error ?? "Sharhni saqlab bo‘lmadi"); return; }
    setDone((cur) => ({ ...cur, [item.productId]: { rating, body: body.trim() || undefined } }));
    setOpen("");
    setBody("");
  }

  return (
    <section className="odx-card" data-testid="order-review">
      <div className="odx-chead"><h2>Mahsulotni baholang</h2></div>
      <div className="odx-rate">
        {items.map((item) => {
          const fixed = done[item.productId];
          const value = fixed?.rating ?? stars[item.productId] ?? 0;
          return (
            <div key={item.productId} className="odx-rateitem">
              <img src={item.image} alt="" />
              <div>
                <b>{item.name}</b>
                <small>{[item.brand, item.size || item.color ? apparelMetaLabel(item.size, item.color) : ""].filter(Boolean).join(" • ")}</small>
                <span className="stars" role="radiogroup" aria-label="Baho">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" disabled={Boolean(fixed)} aria-label={`${n} yulduz`} aria-checked={value === n} role="radio" onClick={() => setStars((cur) => ({ ...cur, [item.productId]: n }))}>
                      <Star size={18} className={n <= value ? "on" : undefined} />
                    </button>
                  ))}
                </span>
              </div>
              {fixed ? <em>Sharh yuborildi</em> : <button type="button" className="odx-btn" onClick={() => { setOpen(open === item.productId ? "" : item.productId); setErr(""); }}>Sharh yozish</button>}
              {open === item.productId && !fixed ? (
                <div className="odx-rateform">
                  <textarea rows={3} maxLength={2000} placeholder="Fikringiz (ixtiyoriy)" value={body} onChange={(event) => setBody(event.target.value)} />
                  {err ? <p className="odx-err">{err}</p> : null}
                  <button type="button" className="odx-btn solid" disabled={busy} onClick={() => void send(item)}>{busy ? "Yuborilmoqda…" : "Yuborish"}</button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function OrderDetailDesktop({ id }: { id: string }) {
  const { order, refresh } = useOrder(id);
  const [note, setNote] = useState("");
  const [dispute, setDispute] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (order === undefined) return <ClinicShell accent="teal"><div className="odx"><p className="odx-empty">Yuklanmoqda…</p></div></ClinicShell>;
  if (order === null) {
    return (
      <ClinicShell accent="teal">
        <div className="odx" data-testid="order-missing">
          <div className="odx-empty"><h1>Buyurtma topilmadi</h1><p>Bu buyurtma sizning hisobingizda yo‘q yoki o‘chirilgan.</p><Link className="odx-btn solid" href="/buyurtmalarim">Buyurtmalarimga qaytish</Link></div>
        </div>
      </ClinicShell>
    );
  }

  const current = order;
  const badge = orderBadge(current);
  const { goods, goodsSum, delivery, discount, total, count } = orderSums(current);
  const canDispute = (current.paymentState === "escrow_held" || current.paymentState === "awaiting_payment") && current.dispute?.status !== "open";
  const [addrMain, ...addrRest] = current.address.split(", ");

  function reorder(item: OrderItem) {
    shopAdd({ id: item.productId, name: item.name, price: item.price, image: item.image, href: `/marketplace/${item.productId}`, seller: item.shopName, variant: item.size || item.color ? apparelMetaLabel(item.size, item.color) : undefined }, item.qty);
    setNote(`«${item.name}» savatga qo‘shildi`);
  }

  async function sendDispute() {
    if (reason.trim().length < 5) { setNote("Muammoni qisqacha yozing (kamida 5 belgi)"); return; }
    setBusy(true);
    const res = await openOrderDispute(current.id, reason.trim());
    setBusy(false);
    if (!res.ok) { setNote(res.reason); return; }
    setDispute(false);
    setReason("");
    setNote("So‘rov qabul qilindi. To‘lov muzlatildi — administrator ko‘rib chiqadi.");
    refresh();
  }

  async function confirmReceipt() {
    setBusy(true);
    const res = await confirmOrderReceipt(current.id);
    setBusy(false);
    setNote(res.ok ? "Qabul qilish tasdiqlandi. To‘lov sotuvchiga o‘tkazildi." : res.reason || "Tasdiqlash hozir mumkin emas");
    refresh();
  }

  return (
    <ClinicShell accent="teal">
      <div className="odx" data-testid="order-detail-desktop">
        <div className="odx-top">
          <div>
            <div className="odx-crumb"><Link href="/" aria-label="Bosh sahifa"><House size={14} /></Link><Link href="/buyurtmalarim">Buyurtmalarim</Link><span>/</span><b>#{current.id}</b></div>
            <div className="odx-title"><h1>Buyurtma #{current.id}</h1><span className={`odx-badge ${badge.tone}`}><Truck size={18} />{badge.label}</span></div>
            <p className="odx-meta"><span>{stamp(current.createdAt)} da berilgan</span><i />{count} ta mahsulot<i />{shopTitle(current)}<em>{etaText(current)}</em></p>
          </div>
          <div className="odx-actions">
            <button type="button" className="odx-act" onClick={() => setNote(printOrder(current, "chek") ? "Chek ochildi — PDF sifatida saqlashingiz mumkin" : "Brauzer yangi oynani blokladi")}><Receipt size={18} />Chek yuklab olish</button>
            <button type="button" className="odx-act" onClick={() => setNote(printOrder(current, "faktura") ? "Hisob-faktura ochildi — PDF sifatida saqlashingiz mumkin" : "Brauzer yangi oynani blokladi")}><FileText size={18} />Faktura yuklab olish</button>
            <Link className="odx-act" href={`/buyurtmalarim/${encodeURIComponent(current.id)}/kuzatish`} data-testid="order-track-link"><Truck size={18} />Kuzatish</Link>
            <button type="button" className="odx-act" disabled={!canDispute} title={canDispute ? undefined : "Bu buyurtma uchun so‘rov yuborib bo‘lmaydi"} onClick={() => setDispute((value) => !value)}><RotateCcw size={18} />Qaytarish so‘rovi</button>
            <a className="odx-act" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer"><Headphones size={18} />Yordam</a>
          </div>
        </div>

        {note ? <p className="odx-note" role="status">{note}</p> : null}
        {current.dispute ? <p className={current.dispute.status === "open" ? "odx-note warn" : "odx-note"}>{current.dispute.status === "open" ? "Qaytarish so‘rovi ko‘rib chiqilmoqda — to‘lov muzlatilgan" : current.dispute.resolution === "refund" ? "So‘rov hal qilindi — pul qaytarildi" : "So‘rov hal qilindi — pul sotuvchiga o‘tkazildi"}. {current.dispute.reason}</p> : null}
        {dispute ? (
          <section className="odx-card odx-dispute">
            <h2>Qaytarish so‘rovi</h2>
            <textarea rows={3} maxLength={1000} placeholder="Nima muammo? Masalan: mahsulot kelmadi, boshqa mahsulot keldi, shikastlangan…" value={reason} onChange={(event) => setReason(event.target.value)} />
            <div><button type="button" className="odx-btn" onClick={() => setDispute(false)}>Bekor</button><button type="button" className="odx-btn danger" disabled={busy} onClick={() => void sendDispute()}>So‘rov yuborish</button></div>
            <small>Pul sotuvchiga o‘tkazilmaydi — administrator ikki tomonni tinglab qaror qiladi.</small>
          </section>
        ) : null}

        <div className="odx-grid">
          <div className="odx-main">
            <section className="odx-card">
              <div className="odx-chead"><h2>Mahsulotlar ({goods.length})</h2></div>
              <table className="odx-table">
                <thead><tr><th>Mahsulot</th><th>Brend</th><th>SKU</th><th>Soni</th><th>Narxi (so‘m)</th><th>Jami (so‘m)</th><th /></tr></thead>
                <tbody>
                  {goods.map((item, index) => (
                    <tr key={`${item.productId}-${index}`}>
                      <td><Link href={catalogHref(item.category ?? "", item.productId)} className="odx-prod"><img src={item.image} alt="" /><span><b>{item.name}</b>{item.size || item.color ? <small>{apparelMetaLabel(item.size, item.color)}</small> : null}</span></Link></td>
                      <td>{item.brand || "—"}</td>
                      <td className="sku">{item.productId.slice(0, 8).toUpperCase()}</td>
                      <td>{item.qty}</td>
                      <td>{som(item.price).replace(" so‘m", "")}</td>
                      <td>{som(item.price * item.qty).replace(" so‘m", "")}</td>
                      <td><button type="button" className="odx-btn" data-testid="order-reorder" onClick={() => reorder(item)}><ShoppingCart size={16} />Qayta buyurtma</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <div className="odx-three">
              <section className="odx-card">
                <div className="odx-chead"><MapPin size={18} /><h2>Yetkazish manzili</h2></div>
                <div className="odx-addr">
                  <img src="/img/designs/toshkent-map.png" alt="" />
                  <div><b>{current.name}</b><span className="tel">{current.phone}</span><span>{current.city}{addrMain ? `, ${addrMain}` : ""}</span>{addrRest.length ? <span>{addrRest.join(", ")}</span> : null}{current.note ? <small>Izoh: {current.note}</small> : null}</div>
                </div>
              </section>
              <section className="odx-card">
                <div className="odx-chead"><CreditCard size={18} /><h2>To‘lov usuli</h2></div>
                <div className="odx-payrow"><PayMark order={current} /><b>{payTitle(current)}</b><em>{som(total)}</em></div>
                <p className="odx-muted">
                  {current.paymentState === "refunded" ? "Pul sizga qaytarildi" : current.paidAt ? `To‘lov amalga oshirildi: ${stamp(current.paidAt)}` : current.payment === "naqd" ? "Kuryerga naqd to‘laysiz" : current.paymentState === "awaiting_payment" ? "To‘lov kutilmoqda" : "To‘lov platformada xavfsiz saqlanmoqda"}
                </p>
                {current.status === "yetkazildi" && current.paymentState === "escrow_held" ? <button type="button" className="odx-btn solid wide" disabled={busy} onClick={() => void confirmReceipt()}>{busy ? "Tasdiqlanmoqda…" : "Mahsulotni qabul qildim"}</button> : null}
              </section>
              <section className="odx-card">
                <div className="odx-chead"><Store size={18} /><h2>Sotuvchi</h2></div>
                <div className="odx-seller"><span className="logo"><Store size={24} /></span><div><b>{shopTitle(current)}<BadgeCheck size={16} /></b><small>{current.city}</small></div></div>
                {current.shopId ? <ContactSeller storeId={current.shopId} shopName={current.shopName} orderId={current.id} label="Chat yozish" className="odx-btn wide" /> : null}
                <div className="odx-two">
                  <Link className="odx-btn" href={current.items.find((item) => item.shopSlug)?.shopSlug ? `/marketplace/dokon/${current.items.find((item) => item.shopSlug)?.shopSlug}` : "/marketplace"}><Store size={14} />Do‘kon sahifasi</Link>
                  <Link className="odx-btn" href="/marketplace"><ShoppingCart size={14} />Barcha mahsulotlar</Link>
                </div>
              </section>
            </div>

            {current.status === "yetkazildi" ? <ReviewCard order={current} /> : null}
          </div>

          <aside className="odx-side">
            <section className="odx-card">
              <div className="odx-chead"><h2>Buyurtma holati</h2></div>
              <Timeline order={current} />
            </section>
            <section className="odx-card">
              <div className="odx-chead"><h2>Buyurtma summasi</h2></div>
              <div className="odx-sum">
                <span>Mahsulotlar ({goods.length})<b>{som(goodsSum)}</b></span>
                <span>Yetkazish<b>{delivery ? som(delivery) : "Bepul"}</b></span>
                <span>Chegirma<b className={discount ? "minus" : undefined}>{discount ? `− ${som(discount)}` : "0 so‘m"}</b></span>
                <span className="total">Jami<b>{som(total)}</b></span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </ClinicShell>
  );
}
