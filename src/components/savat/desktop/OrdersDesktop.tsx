"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, Download, MessageCircle, RefreshCcw, Search, ShoppingBag, Star, Store, Truck } from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import {
  ORDER_PAGE_SIZE,
  orderKinds,
  orderStatuses,
  statusLabel,
  type DesktopOrder,
  type OrderKind,
  type OrderStatus,
} from "@/data/desktop-orders";
import { freeDeliveryText, returnWindowText } from "@/lib/commerce-terms";
import { loadOrders, syncOrders } from "@/lib/orders";
import { toDesktopOrder } from "@/lib/order-present";
import "./cart.css";

const periods = [
  { id: "6", label: "Oxirgi 6 oy", spent: 38_450_000, points: 2450 },
  { id: "1", label: "Oxirgi 30 kun", spent: 6_120_000, points: 420 },
  { id: "0", label: "Joriy oy", spent: 2_100_000, points: 180 },
];

function clock(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function Countdown({ start }: { start: number }) {
  const [left, setLeft] = useState(start);
  useEffect(() => {
    const timer = window.setInterval(() => setLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <span className="bo-count">To‘lov qilish uchun: {clock(left)}</span>;
}

export function OrdersDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const queryParam = (params.get("q") ?? "").trim();
  const [q, setQ] = useState(queryParam);
  const [kind, setKind] = useState<OrderKind>("product");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [period, setPeriod] = useState(periods[0]);
  const [open, setOpen] = useState<DesktopOrder | null>(null);
  const [chat, setChat] = useState(false);
  const [help, setHelp] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setQ(queryParam);
    setPage(1);
  }, [queryParam]);

  const [rows, setRows] = useState<DesktopOrder[]>([]);
  useEffect(() => {
    const load = () => setRows(loadOrders().map(toDesktopOrder));
    void syncOrders(true).then(load);
    window.addEventListener("sk-orders-changed", load);
    return () => window.removeEventListener("sk-orders-changed", load);
  }, []);
  const orders = rows;
  const scoped = orders.filter((order) => order.kind === kind);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return scoped.filter((order) => {
      if (status !== "all" && order.status !== status) return false;
      if (needle && !`${order.number} ${order.title} ${order.seller}`.toLowerCase().includes(needle)) return false;
      const day = order.sortKey.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
  }, [from, q, scoped, status, to]);
  const pages = Math.max(1, Math.ceil(filtered.length / ORDER_PAGE_SIZE));
  const view = filtered.slice((page - 1) * ORDER_PAGE_SIZE, page * ORDER_PAGE_SIZE);

  function setKindTab(next: OrderKind) {
    setKind(next);
    setStatus("all");
    setPage(1);
  }

  function receipt(order: DesktopOrder) {
    const blob = new Blob(
      [`StomaHub chek\nBuyurtma ${order.number}\n${order.title}\n${order.seller}\n${som(order.total)}\nTo‘lov: ${order.pay}\n`],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${order.number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNote("Chek yuklab olindi");
  }

  function reorder(order: DesktopOrder) {
    shopAdd({
      id: `reorder-${order.id}`,
      name: order.title,
      price: order.total,
      image: order.images[0] ?? "/img/shop/m-filtek.jpg",
      href: "/savat",
      seller: order.seller,
      official: true,
    });
    setNote("Buyurtma savatga qo‘shildi");
  }

  return (
    <ShopShell searchPath="/buyurtmalarim" cartCount={cartCount} placeholder="Buyurtma raqami yoki mahsulot nomini qidiring..." showCamera={false}>
      <div className="bo-page">
        <div className="bo-head">
          <div>
            <h1>Buyurtmalarim</h1>
            <p>Barcha buyurtmalaringiz va ularning holati.</p>
          </div>
          <div className="bo-filters">
            <label className="bo-search">
              <Search className="i" />
              <input value={q} placeholder="Buyurtma raqami" aria-label="Buyurtma raqami" onChange={(event) => { setQ(event.target.value); setPage(1); }} />
            </label>
            <div className="bo-date">
              <button type="button" onClick={() => setDateOpen((value) => !value)}><Calendar className="i" /> {from || to ? `${from || "…"} — ${to || "…"}` : "Sana oralig‘i"}</button>
              {dateOpen ? (
                <div className="bo-pop">
                  <input type="date" aria-label="Dan" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
                  <input type="date" aria-label="Gacha" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
                  <button type="button" className="sv-add" onClick={() => { setFrom(""); setTo(""); setDateOpen(false); }}>Tozalash</button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="bo-tabs">
          {orderKinds.map((item) => (
            <button key={item.id} type="button" className={kind === item.id ? "bo-tab on" : "bo-tab"} onClick={() => setKindTab(item.id)}>{item.label}</button>
          ))}
        </div>
        <div className="bo-chips">
          {orderStatuses.map((item) => {
            const count = item.id === "all" ? scoped.length : scoped.filter((order) => order.status === item.id).length;
            return (
              <button key={item.id} type="button" className={status === item.id ? "bo-chip on" : "bo-chip"} onClick={() => { setStatus(item.id); setPage(1); }}>
                {item.label} ({count})
              </button>
            );
          })}
        </div>
        <div className="bo-cols">
          <div className="bo-list">
            {view.map((order) => {
              const shown = order.images.slice(0, 3);
              const extra = order.count - shown.length;
              const activeStep = order.stepAt ?? -1;
              return (
                <article className="bo-card" key={order.id}>
                  <div>
                    <div className="bo-no"><b>Buyurtma № {order.number}</b><span>{order.when}</span></div>
                    <div className="bo-thumbs">
                      {shown.map((src, index) => <img key={`${index}-${src}`} src={src} alt="" />)}
                      {extra > 0 ? <span className="bo-more">+{extra}</span> : null}
                    </div>
                    <h3>{order.title}</h3>
                    <div className="var">{order.count} ta mahsulot</div>
                    <div className="bo-seller"><Store className="i" /> {order.seller}</div>
                  </div>
                  <div className="bo-mid">
                    <span className={`bo-badge ${order.status}`}>{statusLabel(order.status)}</span>
                    {order.note ? <div className="var" style={{ marginTop: "calc(.25 * var(--u))" }}>{order.note}</div> : null}
                    {order.status === "pending" && order.countdown ? <Countdown start={order.countdown} /> : null}
                    {order.steps ? (
                      <div className="bo-track">
                        {order.steps.map((step, index) => (
                          <div key={step.label} className={index < activeStep ? "on" : index === activeStep ? "on now" : ""}>
                            <b />
                            {step.label}
                            <div>{step.date}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="bo-side">
                    <span>Jami summa</span>
                    <strong>{som(order.total)}</strong>
                    <small>To‘lov usuli</small>
                    <b>{order.pay}</b>
                    <div className="bo-acts">
                      {order.status === "shipping" ? <button type="button" className="solid" onClick={() => setNote(`${order.number} yo‘lda. Taxminiy yetkazish saqlangan.`)}>Kuzatish</button> : null}
                      {order.status === "pending" ? <span className="var">To‘lov hali ulanmagan</span> : null}
                      {order.status === "delivered" ? <button type="button" onClick={() => receipt(order)}><Download className="i" /> Chek yuklab olish</button> : null}
                      {order.status === "delivered" || order.status === "cancelled" ? <button type="button" onClick={() => reorder(order)}><RefreshCcw className="i" /> Qayta buyurtma</button> : null}
                      <button type="button" onClick={() => setOpen(order)}>Batafsil</button>
                    </div>
                  </div>
                </article>
              );
            })}
            {view.length === 0 ? <div className="bo-card sv-empty" data-testid="orders-empty">{rows.length === 0 ? "Hali buyurtma yo‘q" : "Buyurtma topilmadi"}</div> : null}
            <div className="bo-pages">
              {Array.from({ length: pages }, (_, index) => (
                <button key={index} type="button" className={page === index + 1 ? "on" : ""} onClick={() => setPage(index + 1)}>{index + 1}</button>
              ))}
            </div>
            {note ? <p className="bo-note">{note}</p> : null}
          </div>
          <aside className="bo-rail">
            <section className="bo-box">
              <h3>Mening xaridlarim <select className="bo-select" aria-label="Davr" value={period.id} onChange={(event) => setPeriod(periods.find((item) => item.id === event.target.value) ?? periods[0])}>{periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></h3>
              <div className="bo-stat"><span className="mark"><ShoppingBag className="i" /></span><div><span>Jami xarid</span><b>{som(rows.reduce((sum, order) => sum + order.total, 0))}</b></div></div>
              <div className="bo-stat"><span className="mark"><Star className="i" /></span><div><span>Buyurtmalar</span><b>{rows.length} ta</b></div></div>
            </section>
            <section className="bo-box">
              <h3>Yordam va qo‘llab-quvvatlash</h3>
              <button type="button" className="bo-help" onClick={() => setHelp("Buyurtma haqida savol qoldiring. Mutaxassislarimiz ish vaqtida javob beradi.")}><MessageCircle className="i" /><div><b>Buyurtma haqida savol</b><span>Mutaxassislarimizga murojaat qiling</span></div></button>
              <button type="button" className="bo-help" onClick={() => setHelp(`${returnWindowText()}. Mahsulot ochilmagan va chek saqlangan bo‘lishi kerak.`)}><RefreshCcw className="i" /><div><b>Qaytarish va almashtirish</b><span>Qoidalarni ko‘rish</span></div></button>
              <button type="button" className="bo-help" onClick={() => setHelp(freeDeliveryText())}><Truck className="i" /><div><b>Yetkazib berish</b><span>Muddatlar va narxlar</span></div></button>
              <button type="button" className="bo-center" onClick={() => setHelp("Qo‘llab-quvvatlash markazi: +998 71 200 00 00, har kuni 09:00–21:00.")}>Qo‘llab-quvvatlash markazi</button>
              {help ? <p className="bo-note" style={{ marginTop: "calc(.35 * var(--u))" }}>{help}</p> : null}
            </section>
            <section className="bo-box bo-chat">
              <span className="bo-chat-ico" aria-hidden="true"><MessageCircle className="i" /></span>
              <div>
                <h3>Savollaringiz bormi?</h3>
                <p>Biz yordam berishga tayyormiz!</p>
                <button type="button" onClick={() => setChat(true)}>Onlayn chat</button>
              </div>
            </section>
          </aside>
        </div>
      </div>
      {open ? (
        <div className="sv-modal" onClick={() => setOpen(null)}>
          <div className="sv-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Buyurtma № {open.number}</h3>
            <p>{open.title}</p>
            <p>{open.seller} · {statusLabel(open.status)}</p>
            <p>{som(open.total)} · {open.pay}</p>
            <p>{open.when}</p>
            <div className="acts"><button type="button" className="sv-go" onClick={() => setOpen(null)}>Yopish</button></div>
          </div>
        </div>
      ) : null}
      {chat ? (
        <div className="sv-modal" onClick={() => setChat(false)}>
          <div className="sv-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>Onlayn chat</h3>
            <label>Xabar<textarea value={message} onChange={(event) => setMessage(event.target.value)} /></label>
            <div className="acts">
              <button type="button" className="sv-go" onClick={() => { if (!message.trim()) return; setNote("Xabar yuborildi"); setChat(false); setMessage(""); }}>Yuborish</button>
              <button type="button" className="sv-add" onClick={() => setChat(false)}>Yopish</button>
            </div>
          </div>
        </div>
      ) : null}
    </ShopShell>
  );
}
