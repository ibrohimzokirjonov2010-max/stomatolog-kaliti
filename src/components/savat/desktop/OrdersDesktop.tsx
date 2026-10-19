"use client";
/* eslint-disable @next/next/no-img-element -- desktop shell sizes raw images with --u */

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FlaskConical,
  Headset,
  MessageCircle,
  Package,
  RefreshCcw,
  Search,
  Settings2,
  ShoppingBag,
  Star,
  Store,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { shopAdd, som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { DELIVERY_COURIER } from "@/data/checkout-pricing";
import { isMarketId, marketHref } from "@/data/desktop-shop";
import { site } from "@/data/site";
import { getBonusSnapshot, refreshBonus, subscribeBonus } from "@/lib/bonus";
import { orderStatusCopy as labStatusCopy, type LabOrder } from "@/lib/lab-work";
import { confirmOrderReceipt, loadOrders, openOrderDispute, startOrdersPolling, syncOrders, type Order } from "@/lib/orders";
import { downloadPdf } from "@/lib/simple-pdf";
import { statusCopy as ustaStatusCopy, type UstaRequest } from "@/lib/usta-work";
import { api } from "@/lib/work-client";
import "./orders.css";

type Kind = "product" | "service" | "lab";
type Tone = "blue" | "orange" | "green" | "amber" | "red" | "grey";
type Row = {
  id: string;
  number: string;
  when: string;
  sort: string;
  title: string;
  sub: string;
  seller: string;
  images: string[];
  status: string;
  statusLabel: string;
  tone: Tone;
  note?: string;
  noteTone?: "red";
  steps?: { label: string; date: string; done: boolean }[];
  total?: number;
  pay?: string;
  order?: Order;
  usta?: UstaRequest;
  lab?: LabOrder;
};

const kinds: { id: Kind; label: string; icon: ReactNode }[] = [
  { id: "product", label: "Mahsulotlar", icon: <ShoppingBag className="i" /> },
  { id: "service", label: "Xizmatlar (Ustalar)", icon: <Wrench className="i" /> },
  { id: "lab", label: "Laboratoriya", icon: <FlaskConical className="i" /> },
];

const productChips = [
  { id: "all", label: "Barchasi" },
  { id: "pending", label: "To‘lov kutilmoqda" },
  { id: "preparing", label: "Tayyorlanmoqda" },
  { id: "shipping", label: "Yo‘lda" },
  { id: "delivered", label: "Yetkazildi" },
  { id: "cancelled", label: "Bekor qilingan" },
];

const periods = [
  { id: "6", label: "Oxirgi 6 oy", days: 183 },
  { id: "1", label: "Oxirgi 30 kun", days: 30 },
  { id: "12", label: "Oxirgi 1 yil", days: 365 },
];

const PAGE = 5;
const payLabel: Record<string, string> = { click: "Click", payme: "Payme", naqd: "Naqd", uzum: "Uzum" };

function stamp(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
function stampTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${stamp(iso)}, ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function orderRow(order: Order): Row {
  const at = (statuses: string[]) => order.statusHistory.find((h) => statuses.includes(h.status))?.at;
  const refunded = order.paymentState === "refunded";
  const status = refunded ? "cancelled" : order.status === "yetkazildi" ? "delivered" : order.status === "yolda" ? "shipping" : order.paymentState === "awaiting_payment" && order.payment !== "naqd" ? "pending" : "preparing";
  const label = { pending: "To‘lov kutilmoqda", preparing: "Tayyorlanmoqda", shipping: "Yo‘lda", delivered: "Yetkazildi", cancelled: "Bekor qilingan" }[status] ?? status;
  const tone: Tone = status === "shipping" ? "blue" : status === "preparing" ? "orange" : status === "delivered" ? "green" : status === "pending" ? "amber" : "red";
  const qty = order.items.reduce((sum, item) => sum + item.qty, 0) || order.items.length;
  const delivered = at(["yetkazildi"]);
  const shipped = at(["yolda"]);
  const prepared = at(["yigish_tugadi", "yigilmoqda"]);
  return {
    id: order.id,
    number: order.id,
    when: stampTime(order.createdAt),
    sort: order.createdAt,
    title: order.items[0]?.name ?? "Buyurtma",
    sub: `${qty} ta mahsulot`,
    seller: order.shopName ?? order.items[0]?.shopName ?? "StomaHub Market",
    images: order.items.map((item) => item.image).filter(Boolean),
    status,
    statusLabel: order.dispute?.status === "open" ? "Nizo ochilgan" : label,
    tone: order.dispute?.status === "open" ? "red" : tone,
    note: refunded ? `Bekor qilingan: ${stamp(order.statusHistory.at(-1)?.at)}` : status === "delivered" ? `Yetkazib berildi: ${stamp(delivered)}` : status === "shipping" ? (order.courierName ? `Kuryer: ${order.courierName}` : "Kuryerga topshirildi") : undefined,
    steps: status === "shipping" || status === "preparing" ? [
      { label: "Qabul qilindi", date: stamp(at(["qabul_qilindi"]) ?? order.createdAt), done: order.status !== "pending_accept" },
      { label: "Tayyorlandi", date: stamp(prepared), done: Boolean(prepared) || status === "shipping" },
      { label: "Yo‘lda", date: stamp(shipped), done: status === "shipping" },
      { label: "Yetkaziladi", date: "", done: false },
    ] : undefined,
    total: order.payable ?? order.total,
    pay: payLabel[order.payment] ?? order.payment,
    order,
  };
}

function ustaRow(row: UstaRequest): Row {
  const copy = ustaStatusCopy[row.status];
  const tone: Tone = row.status === "jarayonda" ? "blue" : row.status === "bajarildi" ? "green" : row.status === "yuborildi" ? "amber" : row.status === "rad" ? "red" : "grey";
  return {
    id: row.id,
    number: row.id.slice(0, 8).toUpperCase(),
    when: stampTime(row.createdAt),
    sort: row.createdAt,
    title: row.services?.length ? row.services.join(", ") : row.service,
    sub: row.note ? row.note.slice(0, 60) : row.timeRange ?? "",
    seller: row.masterName,
    images: row.media?.filter((url) => !/\.(mp4|mov|webm)(\?|$)/i.test(url)) ?? [],
    status: row.status,
    statusLabel: copy?.label ?? row.status,
    tone,
    note: row.date ? `Sana: ${stamp(row.date)}${row.timeRange ? `, ${row.timeRange}` : ""}` : undefined,
    usta: row,
  };
}

function labRow(row: LabOrder): Row {
  const copy = labStatusCopy[row.status];
  const tone: Tone = row.status === "ishlanmoqda" || row.status === "qabul_qilindi" ? "blue" : row.status === "tayyor" || row.status === "yetkazildi" ? "green" : row.status === "yangi" ? "amber" : "grey";
  return {
    id: row.id,
    number: row.id.slice(0, 8).toUpperCase(),
    when: stampTime(row.createdAt),
    sort: row.createdAt,
    title: `${row.service} · ${row.material}`,
    sub: `Bemor kodi: ${row.patientCode} · ${row.dueDays} kun`,
    seller: row.labName,
    images: [],
    status: row.status,
    statusLabel: copy?.label ?? row.status,
    tone,
    lab: row,
  };
}

const toneIcon: Record<Tone, ReactNode> = {
  blue: <Truck className="i" />,
  orange: <Settings2 className="i" />,
  green: <CheckCircle2 className="i" />,
  amber: <Clock3 className="i" />,
  red: <Ban className="i" />,
  grey: <Clock3 className="i" />,
};

export function OrdersDesktop() {
  const cartCount = useShopLineCount();
  const params = useSearchParams();
  const { profile, ready } = useDoctorProfile();
  const [q, setQ] = useState((params.get("q") ?? "").trim());
  const [kind, setKind] = useState<Kind>("product");
  const [chip, setChip] = useState("all");
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [period, setPeriod] = useState(periods[0]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [ustaRows, setUstaRows] = useState<UstaRequest[] | null>(null);
  const [labRows, setLabRows] = useState<LabOrder[] | null>(null);
  const [open, setOpen] = useState<Row | null>(null);
  const [dispute, setDispute] = useState<Row | null>(null);
  const [help, setHelp] = useState<"" | "returns" | "delivery">("");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState("");
  const bonus = useSyncExternalStore(subscribeBonus, getBonusSnapshot, getBonusSnapshot);

  useEffect(() => {
    const read = () => {
      setOrders(loadOrders());
      setLoaded(true);
    };
    window.addEventListener("sk-orders-changed", read);
    void syncOrders(true).then(read);
    const stop = startOrdersPolling();
    void refreshBonus();
    return () => {
      window.removeEventListener("sk-orders-changed", read);
      stop();
    };
  }, []);

  const loadWork = useCallback(async (which: Kind) => {
    if (which === "service") {
      const res = await api<{ outgoing: UstaRequest[] }>("/api/work/masters/requests");
      setUstaRows(res.ok ? res.data.outgoing ?? [] : []);
    }
    if (which === "lab") {
      const res = await api<{ outgoing: LabOrder[] }>("/api/work/labs/orders");
      setLabRows(res.ok ? res.data.outgoing ?? [] : []);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch the tab's rows when it is first opened
    if ((kind === "service" && ustaRows === null) || (kind === "lab" && labRows === null)) void loadWork(kind);
  }, [kind, labRows, loadWork, ustaRows]);

  const rows = useMemo<Row[]>(() => {
    if (kind === "product") return orders.map(orderRow);
    if (kind === "service") return (ustaRows ?? []).map(ustaRow);
    return (labRows ?? []).map(labRow);
  }, [kind, labRows, orders, ustaRows]);

  const chips = useMemo(() => {
    if (kind === "product") return productChips;
    const copy = kind === "service" ? ustaStatusCopy : labStatusCopy;
    return [{ id: "all", label: "Barchasi" }, ...Object.entries(copy).map(([id, value]) => ({ id, label: value.label }))];
  }, [kind]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (chip !== "all" && row.status !== chip) return false;
        if (needle && !`${row.number} ${row.title} ${row.seller}`.toLowerCase().includes(needle)) return false;
        const day = row.sort.slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
        return true;
      })
      .sort((a, b) => b.sort.localeCompare(a.sort));
  }, [chip, from, q, rows, to]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const view = filtered.slice((current - 1) * PAGE, current * PAGE);

  const since = Date.now() - period.days * 86_400_000;
  const spent = orders.filter((o) => o.paymentState !== "refunded" && new Date(o.createdAt).getTime() >= since).reduce((sum, o) => sum + (o.payable ?? o.total), 0);

  function flash(text: string) {
    setToast(text);
  }

  function reorder(row: Row) {
    const items = row.order?.items ?? [];
    for (const item of items) {
      shopAdd({ id: item.productId, name: item.name, price: item.price, image: item.image, href: isMarketId(item.productId) ? marketHref(item.productId) : "/marketplace", seller: item.shopName ?? "StomaHub Market" }, item.qty || 1);
    }
    flash(items.length ? `${items.length} ta mahsulot savatga qo‘shildi` : "Mahsulotlar topilmadi");
  }

  function receipt(row: Row) {
    const o = row.order;
    if (!o) return;
    downloadPdf(`StomaHub-${o.id}.pdf`, [
      "StomaHub — buyurtma cheki",
      `Buyurtma: ${o.id}`,
      `Sana: ${stampTime(o.createdAt)}`,
      `Xaridor: ${o.name}, ${o.phone}`,
      `Manzil: ${[o.city, o.address].filter(Boolean).join(", ")}`,
      "",
      ...o.items.map((item) => `${item.name} — ${item.qty} x ${som(item.price)} = ${som(item.qty * item.price)}`),
      "",
      o.bonusUsed ? `Bonus: -${som(o.bonusUsed)}` : "",
      `Jami: ${som(o.payable ?? o.total)}`,
      `To‘lov usuli: ${payLabel[o.payment] ?? o.payment}`,
    ].filter((line, index, all) => line !== "" || all[index - 1] !== ""));
    flash("Chek PDF ko‘rinishida yuklab olindi");
  }

  async function confirm(row: Row) {
    if (!row.order) return;
    setBusy(row.id);
    const res = await confirmOrderReceipt(row.order.id);
    setBusy("");
    flash(res.ok ? "Qabul qilinganligi tasdiqlandi — pul sotuvchiga o‘tkazildi" : res.reason);
  }

  async function cancelWork(row: Row) {
    setBusy(row.id);
    const res = row.usta
      ? await api(`/api/work/masters/requests/${row.usta.id}`, { body: { status: "bekor" } })
      : row.lab
        ? await api(`/api/work/labs/orders/${row.lab.id}`, { body: { status: "bekor" } })
        : null;
    setBusy("");
    if (res?.ok) {
      flash("So‘rov bekor qilindi");
      void loadWork(kind);
    } else if (res) flash(res.error);
  }

  const authed = ready && Boolean(profile);
  const loading = kind === "product" ? !loaded : kind === "service" ? ustaRows === null : labRows === null;

  return (
    <ShopShell searchPath="/buyurtmalarim" cartCount={cartCount} placeholder="Buyurtma raqami yoki mahsulot nomini qidirish..." showCamera={false}>
      <div className="or2" data-testid="orders-page">
        <div className="or2-main">
          <div className="or2-head">
            <div>
              <h1>Buyurtmalarim</h1>
              <p>Barcha buyurtmalaringiz va ularning holati.</p>
            </div>
            <div className="or2-tools">
              <label className="or2-search">
                <Search className="i" />
                <input value={q} placeholder="Buyurtma raqami..." aria-label="Buyurtma raqami" onChange={(event) => { setQ(event.target.value); setPage(1); }} />
              </label>
              <div className="or2-date">
                <button type="button" aria-expanded={dateOpen} onClick={() => setDateOpen((v) => !v)}><CalendarDays className="i" /> <span>{from || to ? `${from ? stamp(from) : "…"} — ${to ? stamp(to) : "…"}` : "Sana oralig‘i"}</span> <ChevronDown className="i" /></button>
                {dateOpen ? (
                  <div className="pop">
                    <label>Dan<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
                    <label>Gacha<input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
                    <div className="acts">
                      <button type="button" onClick={() => { setFrom(""); setTo(""); }}>Tozalash</button>
                      <button type="button" className="on" onClick={() => setDateOpen(false)}>Tayyor</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="or2-kinds" role="tablist" aria-label="Buyurtma turi">
            {kinds.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={kind === item.id} className={kind === item.id ? "on" : ""} onClick={() => { setKind(item.id); setChip("all"); setPage(1); }}>{item.icon} {item.label}</button>
            ))}
          </div>

          <div className="or2-chips">
            {chips.map((item) => {
              const n = item.id === "all" ? rows.length : rows.filter((row) => row.status === item.id).length;
              return <button key={item.id} type="button" aria-pressed={chip === item.id} className={chip === item.id ? "on" : ""} onClick={() => { setChip(item.id); setPage(1); }}>{item.label} ({n})</button>;
            })}
          </div>

          {!authed && ready ? (
            <div className="or2-empty">
              <b>Buyurtmalarni ko‘rish uchun kiring</b>
              <p>Buyurtmalar, usta so‘rovlari va laboratoriya buyurtmalari hisobingizga bog‘langan.</p>
              <Link href="/kirish?next=/buyurtmalarim">Kirish <ArrowRight className="i" /></Link>
            </div>
          ) : loading ? (
            <div className="or2-empty"><p>Yuklanmoqda…</p></div>
          ) : view.length === 0 ? (
            <div className="or2-empty">
              <b>{rows.length ? "Mos buyurtma topilmadi" : kind === "product" ? "Hali buyurtma yo‘q" : kind === "service" ? "Hali usta so‘rovi yo‘q" : "Hali laboratoriya buyurtmasi yo‘q"}</b>
              <p>{rows.length ? "Filtr yoki sanani o‘zgartirib ko‘ring." : kind === "product" ? "Marketplace’dan mahsulot tanlang — buyurtmalaringiz shu yerda kuzatiladi." : kind === "service" ? "Ustalar bo‘limidan ustaga so‘rov yuboring." : "Laboratoriyalar bo‘limidan buyurtma bering."}</p>
              {rows.length ? <button type="button" onClick={() => { setChip("all"); setQ(""); setFrom(""); setTo(""); }}>Filtrlarni tozalash</button> : <Link href={kind === "product" ? "/marketplace" : kind === "service" ? "/ustalar" : "/laboratoriya"}>{kind === "product" ? "Marketplace" : kind === "service" ? "Ustalar" : "Laboratoriya"} <ArrowRight className="i" /></Link>}
            </div>
          ) : (
            <div className="or2-list">
              {view.map((row) => (
                <OrderCard
                  key={row.id}
                  row={row}
                  busy={busy === row.id}
                  onOpen={() => setOpen(row)}
                  onReorder={() => reorder(row)}
                  onReceipt={() => receipt(row)}
                  onConfirm={() => void confirm(row)}
                  onDispute={() => setDispute(row)}
                  onCancel={() => void cancelWork(row)}
                />
              ))}
            </div>
          )}

          {pages > 1 ? (
            <nav className="or2-pages" aria-label="Sahifalar">
              <button type="button" aria-label="Oldingi" disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft className="i" /></button>
              {Array.from({ length: pages }, (_, index) => index + 1).map((n) => <button key={n} type="button" aria-current={n === current ? "page" : undefined} className={n === current ? "on" : ""} onClick={() => setPage(n)}>{n}</button>)}
              <button type="button" aria-label="Keyingi" disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight className="i" /></button>
            </nav>
          ) : null}
        </div>

        <aside className="or2-rail">
          <section className="or2-box">
            <div className="or2-box-hd">
              <h3>Mening xaridlarim</h3>
              <select aria-label="Davr" value={period.id} onChange={(event) => setPeriod(periods.find((item) => item.id === event.target.value) ?? periods[0])}>
                {periods.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </div>
            <div className="or2-stat"><span className="ic teal"><ShoppingBag className="i" /></span><span><small>Jami xarid</small><b>{som(spent)}</b></span></div>
            <div className="or2-stat"><span className="ic gold"><Star className="i" /></span><span><small>Bonus ballar</small><b>{(bonus.info?.balance ?? 0).toLocaleString("ru-RU").replace(/ |,/g, " ")} ball</b></span></div>
          </section>

          <section className="or2-box">
            <h3>Yordam va qo‘llab-quvvatlash</h3>
            <a className="or2-help" href={site.telegram} target="_blank" rel="noreferrer"><span className="ic"><Headset className="i" /></span><span><b>Buyurtma haqida savol</b><small>Mutaxassislarimizga murojaat qiling</small></span><ChevronRight className="i chev" /></a>
            <button type="button" className="or2-help" onClick={() => setHelp("returns")}><span className="ic"><Package className="i" /></span><span><b>Qaytarish va almashtirish</b><small>Qoidalarni ko‘rish</small></span><ChevronRight className="i chev" /></button>
            <button type="button" className="or2-help" onClick={() => setHelp("delivery")}><span className="ic"><Truck className="i" /></span><span><b>Yetkazib berish</b><small>Muddatlar va narxlar</small></span><ChevronRight className="i chev" /></button>
            <a className="or2-center" href={site.phoneHref}><Download className="i" /> Qo‘llab-quvvatlash markazi</a>
          </section>

          <section className="or2-chat">
            <div>
              <h3>Savollaringiz bormi?</h3>
              <p>Biz yordam berishga tayyormiz!</p>
              <a href={site.telegram} target="_blank" rel="noreferrer"><MessageCircle className="i" /> Onlayn chat</a>
            </div>
            <img src="/img/cart/d-support.jpg" alt="" />
          </section>
        </aside>

        {open ? <Detail row={open} onClose={() => setOpen(null)} onReceipt={() => receipt(open)} /> : null}
        {dispute?.order ? (
          <DisputeDialog
            row={dispute}
            onClose={() => setDispute(null)}
            onSent={(ok, text) => { if (ok) setDispute(null); flash(text); }}
          />
        ) : null}
        {help ? (
          <Dialog title={help === "returns" ? "Qaytarish va almashtirish" : "Yetkazib berish"} onClose={() => setHelp("")}>
            {help === "returns" ? (
              <>
                <p>To‘lov sotuvchiga darhol o‘tmaydi — siz «Qabul qildim» tugmasini bosmaguningizcha platformada saqlanadi.</p>
                <p>Mahsulot nosoz, noto‘g‘ri yoki kam kelgan bo‘lsa, yetkazilgan buyurtmada «Muammo bildirish» tugmasini bosing: nizo ochiladi va pul admin hal qilguncha ushlab turiladi.</p>
              </>
            ) : (
              <>
                <p>Kuryer orqali yetkazish: <b>{som(DELIVERY_COURIER)}</b>. O‘zingiz olib ketsangiz — bepul.</p>
                <p>Sotuvchi buyurtmani jo‘natganda kuryer ma’lumoti va (bo‘lsa) jonli kuzatish havolasi buyurtma tafsilotida chiqadi.</p>
              </>
            )}
          </Dialog>
        ) : null}
        {toast ? <p className="or2-toast" role="status" onAnimationEnd={() => setToast("")}>{toast}</p> : null}
      </div>
    </ShopShell>
  );
}

function OrderCard({ row, busy, onOpen, onReorder, onReceipt, onConfirm, onDispute, onCancel }: { row: Row; busy: boolean; onOpen: () => void; onReorder: () => void; onReceipt: () => void; onConfirm: () => void; onDispute: () => void; onCancel: () => void }) {
  const shown = row.images.slice(0, 3);
  const extra = Math.max(0, (row.order?.items.length ?? row.images.length) - shown.length);
  const o = row.order;
  const canConfirm = o && o.status === "yetkazildi" && !o.confirmedAt && o.paymentState === "escrow_held" && o.dispute?.status !== "open";
  const canCancelWork = (row.usta && row.usta.status === "yuborildi") || (row.lab && (row.lab.status === "yangi" || row.lab.status === "qabul_qilindi"));
  return (
    <article className="or2-card" data-testid="order-card">
      <div className="left">
        <p className="no"><b>{row.usta ? "So‘rov" : row.lab ? "Laboratoriya" : "Buyurtma"} № {row.number}</b><span>{row.when}</span></p>
        <div className="body">
          {shown.length ? (
            <div className="thumbs">
              {shown.map((src, index) => <img key={src + index} src={src} alt="" />)}
              {extra > 0 ? <span className="more">+{extra}</span> : null}
            </div>
          ) : <span className="thumb-ic">{row.usta ? <Wrench className="i" /> : row.lab ? <FlaskConical className="i" /> : <Package className="i" />}</span>}
          <div className="txt">
            <h3>{row.title}</h3>
            {row.sub ? <small>{row.sub}</small> : null}
            <span className="seller"><Store className="i" /> {row.seller}</span>
          </div>
        </div>
      </div>
      <div className="mid">
        <div className="mid-top">
          <span className={`or2-badge ${row.tone}`}>{toneIcon[row.tone]} {row.statusLabel}</span>
          {row.note ? <span className="note">{row.note}</span> : null}
        </div>
        {row.steps ? (
          <ol className="or2-track">
            {row.steps.map((step) => (
              <li key={step.label} className={step.done ? "done" : ""}>
                <i>{step.done ? <Check className="i" /> : null}</i>
                <b>{step.label}</b>
                <small>{step.date || " "}</small>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
      <div className="side">
        {row.total !== undefined ? (
          <>
            <small>Jami summa</small>
            <strong>{som(row.total)}</strong>
            <small>To‘lov usuli</small>
            <span className={`pay ${(row.pay ?? "").toLowerCase()}`}><i />{row.pay}</span>
          </>
        ) : row.lab?.labPhone || row.usta?.masterPhone ? (
          <a className="phone" href={`tel:${(row.lab?.labPhone ?? row.usta?.masterPhone ?? "").replace(/[^\d+]/g, "")}`}>{row.lab?.labPhone ?? row.usta?.masterPhone}</a>
        ) : null}
        <div className="acts">
          {row.status === "shipping" ? <button type="button" className="solid" onClick={onOpen}>Kuzatish</button> : null}
          {row.status === "delivered" ? <button type="button" onClick={onReceipt}><Download className="i" /> Chek yuklab olish</button> : null}
          {canConfirm ? <button type="button" className="solid" disabled={busy} onClick={onConfirm}><Check className="i" /> Qabul qildim</button> : null}
          {(row.status === "delivered" || row.status === "cancelled") && o ? <button type="button" className={canConfirm ? "" : "solid"} onClick={onReorder}><RefreshCcw className="i" /> Qayta buyurtma</button> : null}
          {o && o.status === "yetkazildi" && o.paymentState === "escrow_held" && !o.dispute ? <button type="button" className="danger" onClick={onDispute}>Muammo bildirish</button> : null}
          {canCancelWork ? <button type="button" className="danger" disabled={busy} onClick={onCancel}>Bekor qilish</button> : null}
          <button type="button" onClick={onOpen}>Batafsil</button>
        </div>
      </div>
    </article>
  );
}

function Detail({ row, onClose, onReceipt }: { row: Row; onClose: () => void; onReceipt: () => void }) {
  const o = row.order;
  return (
    <Dialog title={`${row.usta ? "So‘rov" : row.lab ? "Laboratoriya buyurtmasi" : "Buyurtma"} № ${row.number}`} onClose={onClose} wide>
      <p className="lead"><span className={`or2-badge ${row.tone}`}>{toneIcon[row.tone]} {row.statusLabel}</span> <span>{row.when}</span></p>
      {o ? (
        <>
          <ul className="or2-items">
            {o.items.map((item, index) => (
              <li key={item.productId + index}>
                {item.image ? <img src={item.image} alt="" /> : <span className="thumb-ic"><Package className="i" /></span>}
                <span><b>{item.name}</b><small>{[item.size, item.color].filter(Boolean).join(" · ") || item.shopName || ""}</small></span>
                <em>{item.qty} × {som(item.price)}</em>
              </li>
            ))}
          </ul>
          <dl className="or2-dl">
            <div><dt>Yetkazish</dt><dd>{[o.city, o.address].filter(Boolean).join(", ") || "—"}</dd></div>
            <div><dt>Qabul qiluvchi</dt><dd>{o.name} · {o.phone}</dd></div>
            {o.courierName ? <div><dt>Kuryer</dt><dd>{o.courierName}{o.courierPhone ? <> · <a href={`tel:${o.courierPhone.replace(/[^\d+]/g, "")}`}>{o.courierPhone}</a></> : null}{o.carInfo ? ` · ${o.carInfo}` : ""}</dd></div> : null}
            {o.bonusUsed ? <div><dt>Bonus</dt><dd>- {som(o.bonusUsed)}</dd></div> : null}
            <div><dt>Jami</dt><dd><b>{som(o.payable ?? o.total)}</b> · {payLabel[o.payment] ?? o.payment}</dd></div>
          </dl>
          <ol className="or2-history">
            {o.statusHistory.map((h, index) => <li key={h.status + index}><b>{({ pending_accept: "Yuborildi", qabul_qilindi: "Qabul qilindi", yigilmoqda: "Yig‘ilmoqda", yigish_tugadi: "Yig‘ish tugadi", yolda: "Yo‘lda", yetkazildi: "Yetkazildi" } as Record<string, string>)[h.status] ?? h.status}</b><small>{stampTime(h.at)}</small></li>)}
          </ol>
          <div className="acts">
            {o.yandexTrackUrl ? <a className="solid" href={o.yandexTrackUrl} target="_blank" rel="noreferrer"><Truck className="i" /> Jonli kuzatish</a> : null}
            {o.courierLocationUrl ? <a href={o.courierLocationUrl} target="_blank" rel="noreferrer">Kuryer joylashuvi</a> : null}
            {o.status === "yetkazildi" ? <button type="button" onClick={onReceipt}><Download className="i" /> Chek (PDF)</button> : null}
            <button type="button" onClick={onClose}>Yopish</button>
          </div>
        </>
      ) : row.usta ? (
        <>
          <dl className="or2-dl">
            <div><dt>Usta</dt><dd>{row.usta.masterName}</dd></div>
            <div><dt>Xizmat</dt><dd>{row.title}</dd></div>
            {row.usta.note ? <div><dt>Muammo</dt><dd>{row.usta.note}</dd></div> : null}
            <div><dt>Manzil</dt><dd>{[row.usta.district, row.usta.address].filter(Boolean).join(", ") || row.usta.clinic}</dd></div>
            {row.note ? <div><dt>Vaqt</dt><dd>{row.note.replace(/^Sana: /, "")}</dd></div> : null}
            <div><dt>Aloqa</dt><dd>{row.usta.masterPhone ? <a href={`tel:${row.usta.masterPhone.replace(/[^\d+]/g, "")}`}>{row.usta.masterPhone}</a> : "Usta qabul qilgach telefon ochiladi"}</dd></div>
          </dl>
          <div className="acts"><Link href="/ustalar/sorovlarim" className="solid">Mening so‘rovlarim</Link><button type="button" onClick={onClose}>Yopish</button></div>
        </>
      ) : row.lab ? (
        <>
          <dl className="or2-dl">
            <div><dt>Laboratoriya</dt><dd>{row.lab.labName}</dd></div>
            <div><dt>Ish</dt><dd>{row.title}</dd></div>
            <div><dt>Bemor kodi</dt><dd>{row.lab.patientCode}</dd></div>
            <div><dt>Muddat</dt><dd>{row.lab.dueDays} kun</dd></div>
            {row.lab.note ? <div><dt>Izoh</dt><dd>{row.lab.note}</dd></div> : null}
            <div><dt>Aloqa</dt><dd>{row.lab.labPhone ? <a href={`tel:${row.lab.labPhone.replace(/[^\d+]/g, "")}`}>{row.lab.labPhone}</a> : "Laboratoriya qabul qilgach telefon ochiladi"}</dd></div>
          </dl>
          <div className="acts"><Link href="/laboratoriya" className="solid">Laboratoriyalar</Link><button type="button" onClick={onClose}>Yopish</button></div>
        </>
      ) : null}
    </Dialog>
  );
}

function DisputeDialog({ row, onClose, onSent }: { row: Row; onClose: () => void; onSent: (ok: boolean, text: string) => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog title={`Muammo bildirish · ${row.number}`} onClose={onClose}>
      <form
        className="or2-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (reason.trim().length < 5) {
            setError("Muammoni qisqacha yozing (kamida 5 belgi).");
            return;
          }
          setBusy(true);
          const res = await openOrderDispute(row.order!.id, reason.trim());
          setBusy(false);
          if (res.ok) onSent(true, "Nizo ochildi — pul admin hal qilguncha ushlab turiladi");
          else setError(res.reason);
        }}
      >
        <p>Nima muammo bo‘ldi? To‘lov sotuvchiga o‘tmaydi, admin ikki tomonni ko‘rib chiqadi.</p>
        <textarea rows={4} value={reason} maxLength={1000} placeholder="Masalan: 2 ta mahsulot kam keldi, qadoq shikastlangan..." onChange={(event) => setReason(event.target.value)} />
        {error ? <p className="err" role="alert">{error}</p> : null}
        <div className="acts">
          <button type="button" onClick={onClose}>Bekor qilish</button>
          <button type="submit" className="solid" disabled={busy}>{busy ? "Yuborilmoqda…" : "Yuborish"}</button>
        </div>
      </form>
    </Dialog>
  );
}

function Dialog({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="or2-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={wide ? "or2-dialog wide" : "or2-dialog"}>
        <div className="hd"><h3>{title}</h3><button type="button" aria-label="Yopish" onClick={onClose}><X className="i" /></button></div>
        {children}
      </div>
    </div>
  );
}
