"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useSellerWork } from "@/components/seller-provider";
import { deliverySum, orderSum } from "@/components/seller-overview-desktop";
import { commissionView, goodsLines } from "@/lib/order-money";
import { formatMoney } from "@/lib/format";
import {
  advanceOrderStatus,
  buyerNotifiedText,
  isPickupOrder,
  startOrdersPolling,
  orderStatusLabel,
  paymentMethods,
  paymentStateLabel,
  sellerActionLabel,
  setOrderDeliveryTrack,
  type Order,
  type OrderStatus,
} from "@/lib/orders";
import { cn } from "@/lib/utils";
import { courierLocationText } from "@/lib/courier-location";

type TabId = "all" | "new" | "prep" | "ship" | "done" | "cancel";

const GROUP: Record<OrderStatus, Exclude<TabId, "all" | "cancel">> = {
  pending_accept: "new",
  qabul_qilindi: "prep",
  yigilmoqda: "prep",
  yigish_tugadi: "prep",
  yolda: "ship",
  yetkazildi: "done",
};

const PILL: Record<OrderStatus, { cls: string; label: string }> = {
  pending_accept: { cls: "bg-[#fef2f2] text-[#dc2626]", label: "Yangi" },
  qabul_qilindi: { cls: "bg-[#fff7ed] text-[#ea580c]", label: "Qabul qilindi" },
  yigilmoqda: { cls: "bg-[#fff7ed] text-[#ea580c]", label: "Yig‘ilmoqda" },
  yigish_tugadi: { cls: "bg-[#fff7ed] text-[#ea580c]", label: "Yig‘ish tugadi" },
  yolda: { cls: "bg-[#F0FDFA] text-[#0F766E]", label: "Yo‘lda" },
  yetkazildi: { cls: "bg-[#ecfdf3] text-[#15803d]", label: "Yetkazildi" },
};

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const DAY = 86_400_000;

type Period = "all" | "today" | "7" | "30";

function Spark({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const w = 64;
  const h = 26;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - (v / max) * (h - 7)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[26px] w-16" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Sel({ label, value, onChange, children, className }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-[#e3e8f1] bg-white pr-8 pl-3.5 text-[13px] font-medium text-[#1a1d26] outline-none focus:border-[#0F766E] focus:ring-3 focus:ring-[#0F766E]/15"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
    </label>
  );
}

function StatCard({ icon: Icon, tone, color, label, value, sub, series, onClick, active }: { icon: LucideIcon; tone: string; color: string; label: string; value: number; sub: string; series: number[]; onClick: () => void; active: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border bg-white p-3.5 text-left shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)] transition hover:border-[#CCFBF1]",
        active ? "border-[#0F766E] ring-2 ring-[#0F766E]/10" : "border-[#eceff5]",
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", tone)}>
          <Icon className="size-[18px]" />
        </span>
        <p className="min-w-0 truncate text-[12.5px] text-[#6b7280]">{label}</p>
      </div>
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div>
          <p className="text-[24px] leading-none font-extrabold text-[#111827]">{value}</p>
          <p className="mt-1.5 text-[11px] text-[#8b93a7]">{sub}</p>
        </div>
        <Spark values={series} color={color} />
      </div>
    </button>
  );
}

export function SellerOrdersDesktop() {
  const { shopOrders, session } = useSellerWork();
  const params = useSearchParams();
  const urlQ = params.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [lastUrlQ, setLastUrlQ] = useState(urlQ);
  if (urlQ !== lastUrlQ) {
    setLastUrlQ(urlQ);
    setQ(urlQ);
  }
  const [tab, setTab] = useState<TabId>("all");
  const [city, setCity] = useState("");
  const [pay, setPay] = useState("");
  const [escrow, setEscrow] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [panelClosed, setPanelClosed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ text: string; err?: boolean } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { url: string; name: string; phone: string; car: string; loc: string }>>({});
  const pageSize = 10;

  useEffect(() => startOrdersPolling(), []);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 3200);
    return () => window.clearTimeout(t);
  }, [flash]);

  const orders = useMemo(() => [...shopOrders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)), [shopOrders]);
  const shopId = session?.id ?? "";

  const counts = useMemo(() => {
    const c = { all: orders.length, new: 0, prep: 0, ship: 0, done: 0, cancel: 0 };
    for (const o of orders) c[GROUP[o.status]] += 1;
    return c;
  }, [orders]);

  const series = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i)).getTime());
    const make = (pick: (o: Order) => boolean) =>
      days.map((start) => orders.filter((o) => pick(o) && +new Date(o.createdAt) >= start && +new Date(o.createdAt) < start + DAY).length);
    return {
      all: make(() => true),
      new: make((o) => GROUP[o.status] === "new"),
      prep: make((o) => GROUP[o.status] === "prep"),
      ship: make((o) => GROUP[o.status] === "ship"),
      done: make((o) => GROUP[o.status] === "done"),
      cancel: days.map(() => 0),
    };
  }, [orders]);
  const todayCount = series.all[6];

  const cities = useMemo(() => [...new Set(orders.map((o) => o.city).filter(Boolean))].sort(), [orders]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const from = period === "today" ? startToday : period === "7" ? startToday - 6 * DAY : period === "30" ? startToday - 29 * DAY : 0;
    return orders.filter((o) => {
      if (tab === "cancel") return false;
      if (tab !== "all" && GROUP[o.status] !== tab) return false;
      if (city && o.city !== city) return false;
      if (pay && o.payment !== pay) return false;
      if (escrow && o.paymentState !== escrow) return false;
      if (from && +new Date(o.createdAt) < from) return false;
      if (needle) {
        const hay = `${o.id} ${o.name} ${o.phone} ${o.city} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [orders, tab, city, pay, escrow, period, q]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = rows.slice((cur - 1) * pageSize, cur * pageSize);
  const allOnPage = slice.length > 0 && slice.every((o) => selected.includes(o.id));
  const filtered = Boolean(q || city || pay || escrow || tab !== "all" || period !== "all");

  const open = panelClosed ? null : (rows.find((o) => o.id === openId) ?? slice[0] ?? null);

  function reset() {
    setQ("");
    setCity("");
    setPay("");
    setEscrow("");
    setTab("all");
    setPeriod("all");
    setPage(1);
  }

  function pick(id: string) {
    setOpenId(id);
    setPanelClosed(false);
  }

  const periodLabel = (() => {
    const now = new Date();
    const f = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    if (period === "all") return "Barcha vaqt";
    if (period === "today") return f(now);
    const n = period === "7" ? 6 : 29;
    return `${f(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n))} – ${f(now)}`;
  })();

  function exportCsv() {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const src = selected.length ? orders.filter((o) => selected.includes(o.id)) : rows;
    const head = ["Buyurtma", "Sana", "Mijoz", "Telefon", "Shahar", "To'lov usuli", "Mahsulotlar", "Summa", "Holat", "Escrow"];
    const body = src.map((o) =>
      [o.id, `${fmtDate(o.createdAt)} ${fmtTime(o.createdAt)}`, o.name, o.phone, o.city, o.payment, o.items.map((i) => `${i.qty}x ${i.name}`).join("; "), orderSum(o, shopId), orderStatusLabel[o.status], paymentStateLabel[o.paymentState]].map(esc).join(","),
    );
    const blob = new Blob(["\ufeff" + [head.map(esc).join(","), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "buyurtmalar.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function draftOf(o: Order) {
    return drafts[o.id] ?? { url: o.yandexTrackUrl ?? "", name: o.courierName ?? "", phone: o.courierPhone ?? "", car: o.carInfo ?? "", loc: courierLocationText(o) };
  }
  function setDraft(o: Order, patch: Partial<{ url: string; name: string; phone: string; car: string; loc: string }>) {
    setDrafts((p) => ({ ...p, [o.id]: { ...draftOf(o), ...patch } }));
  }

  async function advance(o: Order) {
    setBusy(true);
    const res = await advanceOrderStatus(o.id);
    setBusy(false);
    setFlash(res.ok ? { text: buyerNotifiedText(orderStatusLabel[res.order.status], res) } : { text: res.reason || "Holatni yangilab bo‘lmadi.", err: true });
  }

  async function saveTrack(o: Order, toYolda: boolean) {
    const d = draftOf(o);
    const url = d.url.trim();
    if (toYolda && !url) {
      setFlash({ text: "Yandex Taxi kuzatuv linkini kiriting", err: true });
      return;
    }
    setBusy(true);
    const res = await setOrderDeliveryTrack(
      o.id,
      { yandexTrackUrl: url || undefined, courierName: d.name.trim() || undefined, courierPhone: d.phone.trim() || undefined, carInfo: d.car.trim() || undefined, location: d.loc.trim() },
      { advanceToYolda: toYolda },
    );
    setBusy(false);
    if (!res.ok) {
      setFlash({ text: res.reason || "Kuzatuv saqlanmadi.", err: true });
      return;
    }
    setFlash({ text: toYolda ? buyerNotifiedText("Yo‘lda", res) : buyerNotifiedText("Kuzatuv ma’lumotlari yangilandi", res) });
    setDrafts((p) => {
      const n = { ...p };
      delete n[o.id];
      return n;
    });
  }

  const tabs: { id: TabId; label: string; n: number }[] = [
    { id: "all", label: "Barchasi", n: counts.all },
    { id: "new", label: "Yangi", n: counts.new },
    { id: "prep", label: "Tayyorlanmoqda", n: counts.prep },
    { id: "ship", label: "Yetkazilmoqda", n: counts.ship },
    { id: "done", label: "Yetkazildi", n: counts.done },
    { id: "cancel", label: "Bekor qilingan", n: 0 },
  ];
  const pageNums = (() => {
    const out: (number | "…")[] = [];
    for (let i = 1; i <= pages; i += 1) {
      if (i === 1 || i === pages || Math.abs(i - cur) <= 1) out.push(i);
      else if (out[out.length - 1] !== "…") out.push("…");
    }
    return out;
  })();

  const go = (t: TabId) => {
    setTab(t);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#111827]">Buyurtmalar</h1>
          <p className="mt-1 text-[13.5px] text-[#6b7280]">Mijozlar tomonidan berilgan buyurtmalarni ko‘rib chiqing va boshqaring.</p>
        </div>
        <div className="flex items-center gap-2.5">
          {flash ? (
            <p className={cn("rounded-full px-3 py-1.5 text-[12px] font-medium ring-1", flash.err ? "bg-red-50 text-red-700 ring-red-200/70" : "bg-emerald-50 text-emerald-700 ring-emerald-200/70")}>{flash.text}</p>
          ) : null}
          <button type="button" onClick={exportCsv} disabled={!orders.length} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e3e8f1] bg-white px-4 text-[13.5px] font-semibold text-[#1a1d26] hover:bg-[#f7f9fc] disabled:opacity-50">
            <Download className="size-4" />
            Eksport
          </button>
          <label className="relative block">
            <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8b93a7]" />
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value as Period);
                setPage(1);
              }}
              aria-label="Davr"
              className="h-10 appearance-none rounded-xl border border-[#e3e8f1] bg-white pr-8 pl-9 text-[13px] font-medium text-[#1a1d26] outline-none focus:border-[#0F766E]"
              style={{ width: 232 }}
            >
              <option value="all">Barcha vaqt</option>
              <option value="today">Bugun</option>
              <option value="7">Oxirgi 7 kun</option>
              <option value="30">Oxirgi 30 kun</option>
            </select>
            <span className="pointer-events-none absolute top-1/2 left-9 -translate-y-1/2 bg-white pr-1 text-[13px] font-medium text-[#1a1d26]">{periodLabel}</span>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-6 gap-3">
        <StatCard icon={ShoppingBag} tone="bg-[#F0FDFA] text-[#0F766E]" color="#0F766E" label="Jami buyurtmalar" value={counts.all} sub="Barcha vaqt" series={series.all} active={tab === "all"} onClick={() => go("all")} />
        <StatCard icon={Clock} tone="bg-[#fef2f2] text-[#ef4444]" color="#ef4444" label="Yangi buyurtmalar" value={counts.new} sub={`Bugun: ${todayCount}`} series={series.new} active={tab === "new"} onClick={() => go("new")} />
        <StatCard icon={Package} tone="bg-[#fff7ed] text-[#f97316]" color="#f97316" label="Tayyorlanmoqda" value={counts.prep} sub="Jarayonda" series={series.prep} active={tab === "prep"} onClick={() => go("prep")} />
        <StatCard icon={Truck} tone="bg-[#F0FDFA] text-[#0F766E]" color="#0F766E" label="Yetkazilmoqda" value={counts.ship} sub="Yo‘lda" series={series.ship} active={tab === "ship"} onClick={() => go("ship")} />
        <StatCard icon={CheckCircle2} tone="bg-[#ecfdf3] text-[#16a34a]" color="#16a34a" label="Yetkazildi" value={counts.done} sub="Yakunlangan" series={series.done} active={tab === "done"} onClick={() => go("done")} />
        <StatCard icon={XCircle} tone="bg-[#fef2f2] text-[#ef4444]" color="#ef4444" label="Bekor qilingan" value={0} sub="Tez orada" series={series.cancel} active={tab === "cancel"} onClick={() => go("cancel")} />
      </div>

      <div className={cn("grid items-start gap-4", open ? "grid-cols-[minmax(0,1fr)_380px]" : "grid-cols-1")}>
        <section className="min-w-0 rounded-2xl border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)]">
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#eef1f6] px-4 pt-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                className={cn(
                  "-mb-px flex h-10 shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13px] font-semibold transition",
                  tab === t.id ? "border-[#0F766E] text-[#0F766E]" : "border-transparent text-[#6b7280] hover:text-[#1a1d26]",
                )}
              >
                {t.label}
                <span className={cn("rounded-full px-1.5 text-[11px] leading-[18px]", tab === t.id ? "bg-[#F0FDFA] text-[#0F766E]" : "bg-[#f1f4f9] text-[#8b93a7]")}>{t.n}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5 p-4">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#8b93a7]" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Buyurtma raqami yoki mijoz nomi..."
                className="h-10 w-full rounded-xl border border-[#e3e8f1] bg-white pr-3 pl-10 text-[13px] outline-none placeholder:text-[#a3abbd] focus:border-[#0F766E] focus:ring-3 focus:ring-[#0F766E]/15"
              />
            </div>
            <Sel label="Shahar" value={city} onChange={(v) => { setCity(v); setPage(1); }} className="w-[130px]">
              <option value="">Shahar</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </Sel>
            <Sel label="To‘lov usuli" value={pay} onChange={(v) => { setPay(v); setPage(1); }} className="w-[140px]">
              <option value="">To‘lov usuli</option>
              {paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.label.replace(" (yetkazganda)", "")}</option>)}
            </Sel>
            <Sel label="Escrow holati" value={escrow} onChange={(v) => { setEscrow(v); setPage(1); }} className="w-[150px]">
              <option value="">Escrow holati</option>
              <option value="awaiting_payment">{paymentStateLabel.awaiting_payment}</option>
              <option value="escrow_held">{paymentStateLabel.escrow_held}</option>
              <option value="released">{paymentStateLabel.released}</option>
              <option value="refunded">{paymentStateLabel.refunded}</option>
            </Sel>
            <button type="button" onClick={reset} disabled={!filtered} title="Filtrlarni tozalash" className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#e3e8f1] bg-white px-3.5 text-[13px] font-semibold text-[#1a1d26] hover:bg-[#f7f9fc] disabled:opacity-50">
              <SlidersHorizontal className="size-4" />
              Filtrlar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-y border-[#eef1f6] bg-[#fafbfe] text-[11.5px] font-semibold tracking-wide text-[#8b93a7] uppercase">
                  <th className="w-10 py-2.5 pl-4">
                    <input
                      type="checkbox"
                      aria-label="Hammasini tanlash"
                      className="size-4 accent-[#0F766E]"
                      checked={allOnPage}
                      onChange={(e) => setSelected((s) => (e.target.checked ? [...new Set([...s, ...slice.map((o) => o.id)])] : s.filter((id) => !slice.some((o) => o.id === id))))}
                    />
                  </th>
                  <th className="px-3 py-2.5">Buyurtma</th>
                  <th className="px-3 py-2.5">Mijoz</th>
                  <th className="px-3 py-2.5">Mahsulotlar</th>
                  <th className="px-3 py-2.5">Jami summa</th>
                  <th className="px-3 py-2.5">Holat</th>
                  <th className="px-3 py-2.5">Sana</th>
                  <th className="w-8 py-2.5 pr-3" />
                </tr>
              </thead>
              <tbody>
                {slice.map((o) => {
                  const active = open?.id === o.id;
                  const payLabel = paymentMethods.find((m) => m.id === o.payment)?.label.replace(" (yetkazganda)", "") ?? o.payment;
                  const pill = PILL[o.status];
                  return (
                    <tr
                      key={o.id}
                      onClick={() => pick(o.id)}
                      className={cn("cursor-pointer border-b border-[#f1f3f8] last:border-0 hover:bg-[#fafcff]", active && "bg-[#f5f9ff]")}
                    >
                      <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label="Tanlash" className="size-4 accent-[#0F766E]" checked={selected.includes(o.id)} onChange={(e) => setSelected((s) => (e.target.checked ? [...s, o.id] : s.filter((id) => id !== o.id)))} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="block text-[13.5px] font-bold text-[#0F766E]">{o.id}</span>
                        <span className="block text-[11.5px] text-[#8b93a7]">{payLabel}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-[12px] font-bold text-[#0F766E]">{(o.name || "?").slice(0, 1).toUpperCase()}</span>
                          <span className="min-w-0">
                            <span className="block max-w-[150px] truncate text-[13px] font-semibold text-[#1a1d26]">{o.name}</span>
                            <span className="block truncate text-[11.5px] text-[#8b93a7]">{o.phone} · {o.city}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {goodsLines(o, shopId).slice(0, 3).map((it, i) => (
                            <span key={i} className="flex size-9 items-center justify-center overflow-hidden rounded-lg border border-[#eef1f6] bg-[#f7f9fc]" title={`${it.qty}× ${it.name}`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={it.image} alt="" className="size-full object-contain p-0.5" />
                            </span>
                          ))}
                          {goodsLines(o, shopId).length > 3 ? <span className="flex size-9 items-center justify-center rounded-lg bg-[#f1f4f9] text-[11.5px] font-bold text-[#6b7280]">+{goodsLines(o, shopId).length - 3}</span> : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[13px] font-bold whitespace-nowrap text-[#1a1d26]">{formatMoney(o.total, "UZS")}</td>
                      <td className="px-3 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap", pill.cls)}>{pill.label}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="block text-[12.5px] text-[#1a1d26]">{fmtDate(o.createdAt)}</span>
                        <span className="block text-[11.5px] text-[#8b93a7]">{fmtTime(o.createdAt)}</span>
                      </td>
                      <td className="py-3 pr-3 text-[#a3abbd]">
                        <ChevronRight className="size-4" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!slice.length ? (
              <div className="px-4 py-14 text-center">
                <p className="text-[14px] font-semibold text-[#1a1d26]">{tab === "cancel" ? "Bekor qilingan buyurtma yo‘q" : orders.length ? "Mos buyurtma topilmadi" : "Hali buyurtma yo‘q"}</p>
                <p className="mt-1 text-[12.5px] text-[#8b93a7]">
                  {tab === "cancel" ? "Buyurtmani bekor qilish hali ishga tushmagan." : orders.length ? "Qidiruv yoki filtrlarni o‘zgartiring." : "Shifokorlar buyurtma bersa, shu yerda ko‘rinadi."}
                </p>
                {orders.length && filtered ? (
                  <button type="button" onClick={reset} className="mt-3 text-[13px] font-semibold text-[#0F766E] hover:underline">Filtrlarni tozalash</button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-[#eef1f6] px-4 py-3">
            <div className="flex items-center gap-3 text-[13px] text-[#6b7280]">
              <span><b className="text-[#1a1d26]">{rows.length}</b> ta buyurtma{rows.length !== orders.length ? ` / ${orders.length}` : ""}</span>
              <span className="text-[#c0c7d6]">|</span>
              <span>Tanlangan: <b className="text-[#1a1d26]">{selected.length}</b></span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Oldingi" disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="flex size-9 items-center justify-center rounded-lg border border-[#e3e8f1] text-[#4b5568] hover:bg-[#f7f9fc] disabled:opacity-40">
                <ChevronLeft className="size-4" />
              </button>
              {pageNums.map((n, i) =>
                n === "…" ? (
                  <span key={`d${i}`} className="px-1 text-[#a3abbd]">…</span>
                ) : (
                  <button key={n} type="button" onClick={() => setPage(n)} className={cn("size-9 rounded-lg text-[13px] font-semibold", n === cur ? "bg-[#0F766E] text-white" : "border border-[#e3e8f1] text-[#4b5568] hover:bg-[#f7f9fc]")}>
                    {n}
                  </button>
                ),
              )}
              <button type="button" aria-label="Keyingi" disabled={cur >= pages} onClick={() => setPage(cur + 1)} className="flex size-9 items-center justify-center rounded-lg border border-[#e3e8f1] text-[#4b5568] hover:bg-[#f7f9fc] disabled:opacity-40">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        {open ? (
          <DetailPanel
            key={open.id}
            order={open}
            shopId={shopId}
            busy={busy}
            draft={draftOf(open)}
            setDraft={(p) => setDraft(open, p)}
            onClose={() => setPanelClosed(true)}
            onAdvance={() => advance(open)}
            onSaveTrack={(toYolda) => saveTrack(open, toYolda)}
          />
        ) : null}
      </div>
    </div>
  );
}

function DetailPanel({
  order: o,
  shopId,
  busy,
  draft: d,
  setDraft,
  onClose,
  onAdvance,
  onSaveTrack,
}: {
  order: Order;
  shopId: string;
  busy: boolean;
  draft: { url: string; name: string; phone: string; car: string; loc: string };
  setDraft: (p: Partial<{ url: string; name: string; phone: string; car: string; loc: string }>) => void;
  onClose: () => void;
  onAdvance: () => void;
  onSaveTrack: (toYolda: boolean) => void;
}) {
  const pill = PILL[o.status];
  const payLabel = paymentMethods.find((m) => m.id === o.payment)?.label ?? (o.payment === "naqd" ? "Naqd pul" : o.payment);
  const sum = orderSum(o, shopId);
  const shipping = deliverySum(o);
  const bonus = Math.max(0, Number(o.bonusUsed) || 0);
  const fee = commissionView(o, shopId);
  const goods = goodsLines(o, shopId);
  const action = sellerActionLabel(o.status);
  const isShip = o.status === "yigish_tugadi";
  const showTrack =
    o.paymentState !== "refunded" &&
    !isPickupOrder(o) &&
    (["yigilmoqda", "yigish_tugadi", "yolda"].includes(o.status) || Boolean(o.yandexTrackUrl || o.courierName || o.courierPhone));
  const inp = "h-9 w-full rounded-lg border border-[#e3e8f1] bg-white px-3 text-[13px] outline-none placeholder:text-[#a3abbd] focus:border-[#0F766E]";
  const sectionTitle = "text-[13.5px] font-bold text-[#111827]";

  return (
    <aside className="sticky top-0 max-h-[calc(100vh-120px)] min-w-0 overflow-y-auto rounded-2xl border border-[#eceff5] bg-white shadow-[0_1px_3px_rgba(17, 24, 39, 0.04)]">
      <div className="border-b border-[#eef1f6] p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[16px] font-extrabold text-[#111827]">Buyurtma № {o.id}</h2>
            <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", pill.cls)}>{pill.label}</span>
          </div>
          <button type="button" aria-label="Yopish" onClick={onClose} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f1f4f9]">
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[12px] text-[#8b93a7]">
          {fmtDate(o.createdAt)}, {fmtTime(o.createdAt)} · {payLabel}
        </p>
        <p className="mt-0.5 text-[12px] text-[#8b93a7]">{payLabel}</p>
      </div>

      <div className="space-y-5 p-4">
        <section>
          <h3 className={sectionTitle}>Mijoz ma’lumotlari</h3>
          <div className="mt-2.5 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#F0FDFA] text-[15px] font-bold text-[#0F766E]">{(o.name || "?").slice(0, 1).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-[#1a1d26]">{o.name}</p>
              <p className="text-[12.5px] text-[#4b5568]">{o.phone}</p>
              <p className="mt-1 flex items-start gap-1 text-[12.5px] leading-snug text-[#6b7280]">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-[#8b93a7]" />
                {o.city ? `${o.city}, ` : ""}{o.address}
              </p>
              {o.note ? <p className="mt-1 text-[12px] text-[#8b93a7]">Izoh: {o.note}</p> : null}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#e3e8f1] text-[12.5px] font-semibold text-[#1a1d26] hover:bg-[#f7f9fc]">
              <Phone className="size-3.5" />
              Qo‘ng‘iroq qilish
            </a>
            <span title="Xabarlar tizimi hali ishga tushmagan" className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-lg border border-[#e3e8f1] px-3 text-[12.5px] font-semibold text-[#9aa3b5]">
              <MessageCircle className="size-3.5" />
              Mijozga yozish
              <span className="rounded bg-[#f1f4f9] px-1 text-[9.5px] font-semibold">Tez orada</span>
            </span>
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>Buyurtma mahsulotlari</h3>
          <ul className="mt-2.5 max-h-[210px] space-y-2.5 overflow-y-auto pr-1">
            {goods.map((it, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#eef1f6] bg-[#f7f9fc]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.image} alt="" className="size-full object-contain p-1" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-[#1a1d26]">{it.name}</span>
                  <span className="block text-[11.5px] text-[#8b93a7]">
                    {it.qty} dona × {formatMoney(it.price, "UZS")}
                    {it.size ? ` · ${it.size}` : ""}
                    {it.color ? ` · ${it.color}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-[12.5px] font-bold text-[#1a1d26]">{formatMoney(it.price * it.qty, "UZS")}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-1.5 rounded-xl bg-[#f7f9fc] p-3 text-[12.5px]">
          <div className="flex justify-between text-[#6b7280]"><span>Mahsulotlar jami</span><span className="font-semibold text-[#1a1d26]">{formatMoney(sum, "UZS")}</span></div>
          <div className="flex justify-between text-[#6b7280]"><span>Yetkazib berish</span><span className="font-semibold text-[#1a1d26]">{shipping > 0 ? formatMoney(shipping, "UZS") : "Bepul"}</span></div>
          <div className="flex justify-between text-[#6b7280]"><span>Chegirma / bonus</span><span className="font-semibold text-[#1a1d26]">{formatMoney(bonus, "UZS")}</span></div>
          <div className="flex justify-between text-[#6b7280]"><span>Platforma komissiyasi</span><span className="font-semibold text-[#1a1d26]" data-testid="seller-commission">{fee.text}</span></div>
          <div className="flex items-baseline justify-between border-t border-[#e3e8f1] pt-2">
            <span className="text-[13px] font-bold text-[#1a1d26]">Jami to‘lov</span>
            <span className="text-[19px] font-extrabold text-[#0F766E]">{formatMoney(o.total, "UZS")}</span>
          </div>
        </section>

        <section>
          <h3 className={sectionTitle}>To‘lov / escrow holati</h3>
          <div className="mt-2 rounded-xl border border-[#e8ecf3] p-3">
            <p className="text-[13px] font-semibold text-[#1a1d26]">{paymentStateLabel[o.paymentState]}</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#8b93a7]">
              {o.paymentState === "escrow_held"
                ? "Pul mijoz tasdiqlaguncha platformada saqlanadi."
                : o.paymentState === "released"
                  ? "Mijoz qabul qildi — pul sotuvchi hisobiga o‘tkazildi (hisob yozuvi)."
                  : o.paymentState === "awaiting_payment"
                    ? "Naqd to‘lov — yetkazilganda qabul qilinadi."
                    : "To‘lov mijozga qaytarildi."}
            </p>
            {o.dispute ? (
              <p className="mt-2 rounded-lg bg-[#fef2f2] px-2.5 py-1.5 text-[12px] text-[#b91c1c]">
                {o.dispute.status === "open" ? "Nizo ochiq" : "Nizo hal qilindi"}: {o.dispute.reason}
              </p>
            ) : null}
          </div>
        </section>

        {o.statusHistory?.length ? (
          <section>
            <h3 className={sectionTitle}>Holatlar tarixi</h3>
            <ol className="mt-2 space-y-1.5">
              {o.statusHistory.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-[12.5px]">
                  <span className="flex size-4 items-center justify-center rounded-full bg-[#22c55e] text-white"><Check className="size-2.5" strokeWidth={3} /></span>
                  <span className="flex-1 text-[#1a1d26]">{orderStatusLabel[h.status]}</span>
                  <span className="text-[11.5px] text-[#8b93a7]">{fmtDate(h.at)} {fmtTime(h.at)}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {showTrack ? (
          <section className="space-y-2 rounded-xl border border-[#e8ecf3] p-3">
            <h3 className={sectionTitle}>Kuryer va Yandex kuzatuv</h3>
            <input className={inp} value={d.url} onChange={(e) => setDraft({ url: e.target.value })} placeholder="https://go.yandex / taxi.yandex.ru link" />
            <div className="grid grid-cols-2 gap-2">
              <input className={inp} value={d.name} onChange={(e) => setDraft({ name: e.target.value })} placeholder="Kuryer ismi" />
              <input className={inp} value={d.phone} onChange={(e) => setDraft({ phone: e.target.value })} placeholder="+998 …" />
            </div>
            <input className={inp} value={d.car} onChange={(e) => setDraft({ car: e.target.value })} placeholder="Mashina · raqam" />
            <input className={inp} value={d.loc} onChange={(e) => setDraft({ loc: e.target.value })} placeholder="Kuryer joylashuvi: xarita linki yoki 41.31, 69.27" />
            {isShip ? (
              <button type="button" disabled={busy} onClick={() => onSaveTrack(true)} className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] text-[13.5px] font-bold text-white hover:bg-[#115E59] disabled:opacity-60">
                <Truck className="size-4" />
                {busy ? "Jo‘natilmoqda..." : "Jo‘natildi · Yo‘lda"}
              </button>
            ) : (
              <button type="button" disabled={busy} onClick={() => onSaveTrack(false)} className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#e3e8f1] text-[13px] font-semibold text-[#1a1d26] hover:bg-[#f7f9fc] disabled:opacity-60">
                {busy ? "Saqlanmoqda..." : "Kuzatuvni yangilash"}
              </button>
            )}
          </section>
        ) : null}
      </div>

      <div className="sticky bottom-0 grid grid-cols-2 gap-2.5 border-t border-[#eef1f6] bg-white p-4">
        <span title="Buyurtmani bekor qilish hali ishga tushmagan" className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-[#fecaca] text-[13px] font-semibold text-[#f5a3a3]">
          <Ban className="size-4" />
          Bekor qilish
        </span>
        {action && !isShip ? (
          <button type="button" disabled={busy} onClick={onAdvance} className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0F766E] text-[13.5px] font-bold text-white shadow-[0_6px_14px_rgba(15, 118, 110, 0.25)] hover:bg-[#115E59] disabled:opacity-60">
            <Check className="size-4" />
            {busy ? "Yangilanmoqda..." : action}
          </button>
        ) : (
          <span className="inline-flex h-11 items-center justify-center rounded-xl bg-[#f1f4f9] px-2 text-center text-[12px] leading-tight font-semibold text-[#6b7280]">
            {isShip ? "Yuqorida kuryer ma’lumotini kiriting" : o.status === "yetkazildi" ? "Mijoz tasdig‘i kutilmoqda" : "—"}
          </span>
        )}
      </div>
    </aside>
  );
}
