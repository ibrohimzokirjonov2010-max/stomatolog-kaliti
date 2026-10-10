"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, ChevronRight, FileSpreadsheet, Lock, Percent, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Card, Chips, Drawer, Empty, ErrorBox, Loading, ORDER_STATUS_LABEL, PAYMENT_LABEL, PageHead, Pill, adminPost, btn, fmtDate, fmtInt,
  moneyParts, moneyShort, useAdminData, useToast,
} from "@/components/admin/ui";
import { fmtPhone } from "@/components/admin/users-view";
import { cn } from "@/lib/utils";
import { MARKETPLACE_COMMISSION_PERCENT } from "@/lib/commission";
import { courierLocationText } from "@/lib/courier-location";

type Item = { productId?: string; name: string; brand?: string; qty: number; price: number; shopName?: string; source?: string };
type Order = {
  id: string; createdAt: string; name: string; phone: string; city: string; address: string; note?: string; payment: string; total: number;
  commission?: number; status: string; statusHistory?: { status: string; at: string; note?: string }[]; paymentState: string; shopName?: string; paidAt?: string;
  buyerName?: string; statusChangedAt?: string; releasedAt?: string; refundedAt?: string; yandexTrackUrl?: string; courierName?: string;
  courierPhone?: string; carInfo?: string; courierLocationUrl?: string; courierLat?: number; courierLng?: number; courierLocationAt?: string;
  dispute?: { id: number; reason: string; status: string; resolution?: string; createdAt: string }; items: Item[];
};
type Data = {
  kpis: { escrowAmount: number; escrowOrders: number; avgHoldHours: number | null; released30: number; releasedOrders30: number; commission30: number; disputeAmount: number; disputes: number };
  counts: { all: number; escrow: number; awaiting: number; disputed: number; released: number; refunded: number };
  rows: Order[];
};
type Filter = "all" | "escrow" | "awaiting" | "disputed" | "released" | "refunded";

const PAY: Record<string, string> = { click: "Click", payme: "Payme", naqd: "Naqd" };

function MoneyKpi({ v }: { v: number }) {
  const p = moneyParts(v);
  return <span><span className="font-heading text-[24px] font-bold">{p.value}</span><span className="ml-1 text-[12px] text-slate-400">{p.unit}</span></span>;
}

function holdText(o: Order) {
  if (o.paymentState !== "escrow_held" || !o.paidAt) return "—";
  const h = (Date.now() - new Date(o.paidAt).getTime()) / 3600e3;
  return h < 24 ? `${Math.max(1, Math.floor(h))} soat` : `${Math.floor(h / 24)} kun`;
}

function statusPill(o: Order) {
  if (o.dispute?.status === "open") return <Pill tone="red">Nizo: {o.dispute.reason.slice(0, 28)}{o.dispute.reason.length > 28 ? "…" : ""}</Pill>;
  if (o.paymentState === "refunded") return <Pill tone="gray">Bekor qilindi</Pill>;
  if (o.paymentState === "released") return <Pill tone="green">Yakunlandi</Pill>;
  const tone = o.status === "yetkazildi" ? "green" : o.status === "yolda" ? "blue" : "gray";
  return <Pill tone={tone}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</Pill>;
}

function moneyPill(o: Order) {
  if (o.dispute?.status === "open" && o.paymentState === "escrow_held") return <Pill tone="red">Muzlatilgan</Pill>;
  if (o.paymentState === "escrow_held" && o.status === "yetkazildi") return <Pill tone="orange">Tasdiq kutilmoqda</Pill>;
  const p = PAYMENT_LABEL[o.paymentState];
  return <Pill tone={p?.tone ?? "gray"}>{p?.label ?? o.paymentState}</Pill>;
}

export function OrdersView() {
  const sp = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() => {
    const f = sp.get("filter") as Filter | null;
    return f && ["all", "escrow", "awaiting", "disputed", "released", "refunded"].includes(f) ? f : "all";
  });
  const [q, setQ] = useState(() => sp.get("q") ?? "");
  const [debounced, setDebounced] = useState(() => (sp.get("q") ?? "").trim());
  const [open, setOpen] = useState<Order | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const { data, error, loading, reload } = useAdminData<Data>(`/api/admin/orders?filter=${filter}&q=${encodeURIComponent(debounced)}`);
  const k = data?.kpis;

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHead
        title="Buyurtmalar & Escrow"
        subtitle={`Pul platformada ushlab turiladi va shifokor tasdiqlagach komissiya (standart ${MARKETPLACE_COMMISSION_PERCENT}%) ushlab qolinib sotuvchiga o‘tkaziladi`}
        actions={<a href="/api/admin/export?kind=orders" className={btn.outline}><FileSpreadsheet className="size-4" /> CSV</a>}
      />
      {error ? <ErrorBox text={error} onRetry={reload} /> : !data || !k ? <Loading /> : (
        <div className={cn("space-y-4", loading && "opacity-60")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><span className="flex size-8 items-center justify-center rounded-lg bg-[#fff7ed] text-[#ea580c]"><Lock className="size-4" /></span>Ushlab turilgan (escrow)</div>
              <div className="mt-3"><MoneyKpi v={k.escrowAmount} /></div>
              <div className="text-[11.5px] text-slate-400">{fmtInt(k.escrowOrders)} buyurtma{k.avgHoldHours != null ? ` · o‘rt. ${k.avgHoldHours >= 24 ? `${(k.avgHoldHours / 24).toFixed(1)} kun` : `${k.avgHoldHours} soat`}` : ""}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><span className="flex size-8 items-center justify-center rounded-lg bg-[#ecfdf3] text-[#15803d]"><ArrowLeftRight className="size-4" /></span>Sotuvchilarga o‘tkazilgan</div>
              <div className="mt-3"><MoneyKpi v={k.released30} /></div>
              <div className="text-[11.5px] text-slate-400">30 kun · {fmtInt(k.releasedOrders30)} buyurtma</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><span className="flex size-8 items-center justify-center rounded-lg bg-[#e8f1ff] text-primary"><Percent className="size-4" /></span>Ushlangan komissiya</div>
              <div className="mt-3"><MoneyKpi v={k.commission30} /></div>
              <div className="text-[11.5px] text-slate-400">30 kun · o‘tkazmalardan</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><span className="flex size-8 items-center justify-center rounded-lg bg-[#fef2f2] text-[#dc2626]"><ShieldAlert className="size-4" /></span>Nizoli</div>
              <div className="mt-3"><MoneyKpi v={k.disputeAmount} /></div>
              <div className="text-[11.5px] text-slate-400">{fmtInt(k.disputes)} buyurtma · muzlatilgan</div>
            </Card>
          </div>

          <Card className="flex items-center gap-1 overflow-x-auto p-3">
            {["To‘landi", "Escrowda", "Yo‘lda", "Yetkazildi", "Shifokor tasdiqladi", "O‘tkazildi"].map((s, i, arr) => (
              <div key={s} className="flex min-w-fit flex-1 items-center gap-2">
                <span className={cn("flex size-6 items-center justify-center rounded-full text-[11px] font-bold", i === arr.length - 1 ? "bg-[#e8f1ff] text-primary" : "bg-primary text-white")}>{i + 1}</span>
                <span className="text-[12.5px] font-semibold">{s}</span>
                {i < arr.length - 1 ? <ChevronRight className="mx-auto size-4 text-slate-300" /> : null}
              </div>
            ))}
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f7] p-3">
              <Chips value={filter} onChange={setFilter} options={[
                { id: "all", label: "Barchasi", count: data.counts.all },
                { id: "escrow", label: "Escrowda", count: data.counts.escrow },
                { id: "awaiting", label: "Tasdiq kutilmoqda", count: data.counts.awaiting },
                { id: "disputed", label: "Nizoli", count: data.counts.disputed },
                { id: "released", label: "O‘tkazildi", count: data.counts.released },
                { id: "refunded", label: "Qaytarildi", count: data.counts.refunded },
              ]} />
              <label className="ml-auto flex h-9 w-[220px] items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px]">
                <Search className="size-4 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="SK-…, ism, do‘kon" className="min-w-0 flex-1 bg-transparent outline-none" />
              </label>
            </div>
            {data.rows.length === 0 ? (
              <Empty icon={<ShieldCheck className="size-5" />} title="Buyurtmalar yo‘q" hint="Shifokorlar marketplace’dan buyurtma berganda shu yerda paydo bo‘ladi." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-[13px]">
                  <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 text-left">ID</th>
                      <th className="px-3 py-2.5 text-left">Shifokor</th>
                      <th className="px-3 py-2.5 text-left">Do‘kon</th>
                      <th className="px-3 py-2.5 text-right">Summa</th>
                      <th className="px-3 py-2.5 text-right">Komissiya</th>
                      <th className="px-3 py-2.5 text-left">To‘lov</th>
                      <th className="px-3 py-2.5 text-left">Yetkazish</th>
                      <th className="px-3 py-2.5 text-left">Pul holati</th>
                      <th className="px-3 py-2.5 text-left">Kutmoqda</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((o) => (
                      <tr key={o.id} className="cursor-pointer border-t border-[#f1f5f9] hover:bg-[#f8fbff]" onClick={() => setOpen(o)}>
                        <td className="px-4 py-2.5 font-semibold text-primary">#{o.id}</td>
                        <td className="px-3 py-2.5">{o.buyerName ?? o.name}</td>
                        <td className="px-3 py-2.5 text-slate-600">{o.shopName ?? "—"}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{fmtInt(o.total)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-[#15803d]">{o.commission ? fmtInt(o.commission) : "—"}</td>
                        <td className="px-3 py-2.5 text-slate-500">{PAY[o.payment] ?? o.payment}</td>
                        <td className="px-3 py-2.5">{statusPill(o)}</td>
                        <td className="px-3 py-2.5">{moneyPill(o)}</td>
                        <td className="px-3 py-2.5 text-slate-500">{holdText(o)}</td>
                        <td className="px-4 py-2.5 text-right">
                          {o.dispute?.status === "open" ? <span className="rounded-lg bg-[#fef2f2] px-2 py-1 text-[12px] font-semibold text-[#dc2626]">Hal qilish</span> : <ChevronRight className="ml-auto size-4 text-slate-300" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
      <OrderDrawer key={open?.id ?? "none"} order={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); void reload(); }} />
    </div>
  );
}

function OrderDrawer({ order: o, onClose, onDone }: { order: Order | null; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<"release" | "refund" | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const canRelease = o?.paymentState === "escrow_held";
  const canRefund = o?.paymentState === "escrow_held" || o?.paymentState === "awaiting_payment";

  async function resolve(resolution: "release" | "refund") {
    if (!o) return;
    setBusy(true);
    const res = await adminPost(`/api/admin/orders/${o.id}`, { resolution, note });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(resolution === "release" ? "Pul sotuvchiga o‘tkazildi" : "Pul shifokorga qaytarildi");
    router.refresh();
    onDone();
  }

  return (
    <>
      <Drawer open={Boolean(o)} onClose={onClose} title={o ? `Buyurtma #${o.id}` : ""}
        footer={o && (canRelease || canRefund) ? (
          <div className="space-y-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Izoh (audit jurnaliga yoziladi)" className="h-9 w-full rounded-xl border border-[#e2e8f0] px-3 text-[13px] outline-none" />
            {confirm ? (
              <div className="flex gap-2">
                <button type="button" className={btn.outline} onClick={() => setConfirm(null)}>Bekor</button>
                <button type="button" className={cn(confirm === "refund" ? btn.dangerSolid : btn.primary, "flex-1")} disabled={busy} onClick={() => resolve(confirm)}>
                  {confirm === "release" ? `${moneyShort(o.total)} sotuvchiga o‘tkazilsinmi?` : `${moneyShort(o.total)} shifokorga qaytarilsinmi?`}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                {canRefund ? <button type="button" className={cn(btn.danger, "flex-1")} onClick={() => setConfirm("refund")}>Shifokorga qaytarish</button> : null}
                {canRelease ? <button type="button" className={cn(btn.primary, "flex-1")} onClick={() => setConfirm("release")}>Sotuvchiga o‘tkazish</button> : null}
              </div>
            )}
          </div>
        ) : null}>
        {o ? (
          <div className="space-y-4 text-[13px]">
            <div className="flex flex-wrap gap-1.5">{statusPill(o)}{moneyPill(o)}<Pill tone="blue">{PAY[o.payment] ?? o.payment}</Pill></div>
            {o.dispute ? (
              <div className={cn("rounded-xl border p-3", o.dispute.status === "open" ? "border-[#fecaca] bg-[#fef2f2]" : "border-[#eceff5] bg-[#f8fafc]")}>
                <p className="font-semibold">{o.dispute.status === "open" ? "Ochiq nizo" : `Nizo hal qilingan (${o.dispute.resolution === "refund" ? "qaytarildi" : "o‘tkazildi"})`}</p>
                <p className="mt-0.5 text-slate-600">{o.dispute.reason}</p>
                <p className="mt-1 text-[11.5px] text-slate-400">{fmtDate(o.dispute.createdAt, true)}</p>
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#eceff5] p-4">
              {[["Shifokor", o.buyerName ?? o.name], ["Telefon", fmtPhone(o.phone)], ["Do‘kon", o.shopName ?? "—"], ["Summa", `${fmtInt(o.total)} so‘m`],
                ["Yaratilgan", fmtDate(o.createdAt, true)], ["To‘langan", o.paidAt ? fmtDate(o.paidAt, true) : "—"],
                ["Manzil", [o.city, o.address].filter(Boolean).join(", ")], ["Komissiya", o.commission ? `${fmtInt(o.commission)} so‘m` : "—"]].map(([l, v]) => (
                <div key={l} className="min-w-0"><div className="text-[11.5px] text-slate-400">{l}</div><div className="break-words font-semibold">{v}</div></div>
              ))}
            </div>
            <div>
              <p className="mb-1.5 font-semibold">Mahsulotlar</p>
              <ul className="divide-y divide-[#f1f5f9]">
                {o.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3 py-2">
                    <span className="min-w-0"><span className="block truncate font-medium">{i.name}</span><span className="text-[11.5px] text-slate-400">{[i.brand, i.shopName].filter(Boolean).join(" · ")} · {i.qty} dona</span></span>
                    <span className="font-semibold">{fmtInt(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {o.statusHistory?.length ? (
              <div>
                <p className="mb-1.5 font-semibold">Tarix</p>
                <ol className="space-y-1.5 border-l-2 border-[#e2e8f0] pl-3">
                  {o.statusHistory.map((h, idx) => (
                    <li key={idx} className="text-[12.5px]"><span className="font-medium">{ORDER_STATUS_LABEL[h.status] ?? h.status}</span> <span className="text-slate-400">· {fmtDate(h.at, true)}</span>{h.note ? <span className="block text-[11.5px] text-slate-500">{h.note}</span> : null}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {o.note ? <p className="rounded-xl bg-[#f8fafc] p-3 text-slate-600">Izoh: {o.note}</p> : null}
            {o.paymentState !== "refunded" && !/olib ketaman/i.test(`${o.note ?? ""} ${o.address}`) ? (
              <CourierEditor order={o} onSaved={() => { toast.show("Kuryer ma’lumoti saqlandi"); router.refresh(); onDone(); }} onError={(e) => toast.show(e, "err")} />
            ) : null}
          </div>
        ) : null}
      </Drawer>
      {toast.node}
    </>
  );
}

function CourierEditor({ order: o, onSaved, onError }: { order: Order; onSaved: () => void; onError: (e: string) => void }) {
  const [f, setF] = useState(() => ({
    name: o.courierName ?? "", phone: o.courierPhone ?? "", car: o.carInfo ?? "", url: o.yandexTrackUrl ?? "",
    loc: courierLocationText(o),
  }));
  const [busy, setBusy] = useState(false);
  const inp = "h-9 w-full rounded-xl border border-[#e2e8f0] px-3 text-[13px] outline-none focus:border-primary";

  async function save() {
    setBusy(true);
    const res = await adminPost(`/api/admin/orders/${o.id}`, {
      action: "courier",
      track: { courierName: f.name, courierPhone: f.phone, carInfo: f.car, yandexTrackUrl: f.url, location: f.loc },
    });
    setBusy(false);
    if (!res.ok) return onError(res.error);
    onSaved();
  }

  return (
    <div className="space-y-2 rounded-2xl border border-[#eceff5] p-4">
      <p className="font-semibold">Kuryer (Yandex)</p>
      <div className="grid grid-cols-2 gap-2">
        <input className={inp} value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Kuryer ismi" />
        <input className={inp} value={f.phone} maxLength={40} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="+998 …" />
      </div>
      <input className={inp} value={f.car} maxLength={80} onChange={(e) => setF({ ...f, car: e.target.value })} placeholder="Mashina · raqam" />
      <input className={inp} value={f.url} maxLength={500} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="Yandex Go kuzatuv linki (https://…)" />
      <input className={inp} value={f.loc} maxLength={500} onChange={(e) => setF({ ...f, loc: e.target.value })} placeholder="Joylashuv: xarita linki yoki 41.31, 69.27" />
      {o.courierLocationAt ? <p className="text-[11.5px] text-slate-400">Joylashuv yangilangan: {fmtDate(o.courierLocationAt, true)}</p> : null}
      <button type="button" className={cn(btn.primary, "w-full")} disabled={busy} onClick={save}>{busy ? "Saqlanmoqda…" : "Kuryerni saqlash"}</button>
    </div>
  );
}
