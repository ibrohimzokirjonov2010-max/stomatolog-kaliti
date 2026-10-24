"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, Clock, CreditCard, Wallet, XCircle } from "lucide-react";
import {
  Card, Chips, Drawer, Empty, ErrorBox, Loading, PageHead, Pill, adminPost, btn, fmtDate, fmtInt, moneyParts, useAdminData, useToast,
} from "@/components/admin/ui";
import { fmtPhone } from "@/components/admin/users-view";
import { cn } from "@/lib/utils";

type Payout = {
  id: string; amount: number; status: "pending" | "paid" | "rejected"; createdAt: string; processedAt?: string; adminNote?: string;
  cardLast4?: string; cardHolder?: string; cardBank?: string; cardBrand?: string; storeId: string; storeName: string; ownerName?: string;
  ownerPhone?: string; isPlatform?: boolean; processedBy?: string;
};
type Data = {
  kpis: { pendingAmount: number; pending: number; paid30: number; rejected30: number };
  counts: { all: number; pending: number; paid: number; rejected: number };
  rows: Payout[];
};
type Filter = "all" | "pending" | "paid" | "rejected";

const STATUS = {
  pending: { label: "Jarayonda", tone: "orange" },
  paid: { label: "Bajarildi", tone: "green" },
  rejected: { label: "Rad etildi", tone: "red" },
} as const;

function Money({ v }: { v: number }) {
  const p = moneyParts(v);
  return <span><span className="font-heading text-[24px] font-bold">{p.value}</span><span className="ml-1 text-[12px] text-slate-400">{p.unit}</span></span>;
}

function cardText(p: Payout) {
  return p.cardLast4 ? `${p.cardBrand ? `${p.cardBrand} ` : ""}•••• ${p.cardLast4}` : "—";
}

export function PayoutsView() {
  const sp = useSearchParams();
  const [filter, setFilter] = useState<Filter>(() => {
    const f = sp.get("filter") as Filter | null;
    return f && ["all", "pending", "paid", "rejected"].includes(f) ? f : "all";
  });
  const [open, setOpen] = useState<Payout | null>(null);
  const { data, error, loading, reload } = useAdminData<Data>(`/api/admin/payouts?filter=${filter}`);
  const k = data?.kpis;

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHead title="To‘lov so‘rovlari" subtitle="Sotuvchilarning hisobdan pul yechish so‘rovlari. Pul o‘tkazilgach «Bajarildi» deb belgilang yoki sabab bilan rad eting." />
      {error ? <ErrorBox text={error} onRetry={reload} /> : !data || !k ? <Loading /> : (
        <div className={cn("space-y-4", loading && "opacity-60")}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><span className="flex size-8 items-center justify-center rounded-lg bg-[#fff7ed] text-[#ea580c]"><Clock className="size-4" /></span>Kutilayotgan</div>
              <div className="mt-3"><Money v={k.pendingAmount} /></div>
              <div className="text-[11.5px] text-slate-400">{fmtInt(k.pending)} ta so‘rov</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><span className="flex size-8 items-center justify-center rounded-lg bg-[#ecfdf3] text-[#15803d]"><CheckCircle2 className="size-4" /></span>Bajarilgan</div>
              <div className="mt-3"><Money v={k.paid30} /></div>
              <div className="text-[11.5px] text-slate-400">oxirgi 30 kun</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-700"><span className="flex size-8 items-center justify-center rounded-lg bg-[#fef2f2] text-[#dc2626]"><XCircle className="size-4" /></span>Rad etilgan</div>
              <div className="mt-3"><span className="font-heading text-[24px] font-bold">{fmtInt(k.rejected30)}</span><span className="ml-1 text-[12px] text-slate-400">ta</span></div>
              <div className="text-[11.5px] text-slate-400">oxirgi 30 kun</div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f7] p-3">
              <Chips value={filter} onChange={setFilter} options={[
                { id: "all", label: "Barchasi", count: data.counts.all },
                { id: "pending", label: "Jarayonda", count: data.counts.pending },
                { id: "paid", label: "Bajarildi", count: data.counts.paid },
                { id: "rejected", label: "Rad etildi", count: data.counts.rejected },
              ]} />
            </div>
            {data.rows.length === 0 ? (
              <Empty icon={<Wallet className="size-5" />} title="To‘lov so‘rovlari yo‘q" hint="Sotuvchilar kabinetdan pul yechishni so‘raganda shu yerda paydo bo‘ladi." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-[13px]">
                  <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Sotuvchi</th>
                      <th className="px-3 py-2.5 text-right">Summa</th>
                      <th className="px-3 py-2.5 text-left">Karta</th>
                      <th className="px-3 py-2.5 text-left">Sana</th>
                      <th className="px-3 py-2.5 text-left">Holat</th>
                      <th className="px-4 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((p) => (
                      <tr key={p.id} className="cursor-pointer border-t border-[#f1f5f9] hover:bg-[#f8fbff]" onClick={() => setOpen(p)}>
                        <td className="px-4 py-2.5"><span className="font-semibold">{p.storeName}</span><span className="block text-[11.5px] text-slate-400">{p.ownerName ?? ""}</span></td>
                        <td className="px-3 py-2.5 text-right font-semibold">{fmtInt(p.amount)} so‘m</td>
                        <td className="px-3 py-2.5 text-slate-600">{cardText(p)}<span className="block text-[11.5px] text-slate-400">{[p.cardHolder, p.cardBank].filter(Boolean).join(" · ")}</span></td>
                        <td className="px-3 py-2.5 text-slate-500">{fmtDate(p.createdAt, true)}</td>
                        <td className="px-3 py-2.5"><Pill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Pill></td>
                        <td className="px-4 py-2.5 text-right">
                          {p.status === "pending" ? <span className="rounded-lg bg-[#F0FDFA] px-2 py-1 text-[12px] font-semibold text-primary">Ko‘rib chiqish</span> : <ChevronRight className="ml-auto size-4 text-slate-300" />}
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
      <PayoutDrawer key={open?.id ?? "none"} payout={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); void reload(); }} />
    </div>
  );
}

function PayoutDrawer({ payout: p, onClose, onDone }: { payout: Payout | null; onClose: () => void; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const router = useRouter();
  const pending = p?.status === "pending";
  const valid = note.trim().length >= 3;

  async function resolve(action: "paid" | "reject") {
    if (!p) return;
    setBusy(true);
    const res = await adminPost(`/api/admin/payouts/${p.id}`, { action, note: note.trim() });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(action === "paid" ? "Bajarildi deb belgilandi" : "Rad etildi, balans qaytarildi");
    router.refresh();
    onDone();
  }

  return (
    <>
      <Drawer open={Boolean(p)} onClose={onClose} title={p ? `${p.storeName} · ${fmtInt(p.amount)} so‘m` : ""}
        footer={p && pending ? (
          <div className="space-y-2">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2}
              placeholder="Izoh: «Bajarildi» uchun tranzaksiya raqami/izohi, «Rad etish» uchun sabab (majburiy)"
              className="w-full resize-none rounded-xl border border-[#e2e8f0] px-3 py-2 text-[13px] outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button type="button" className={cn(btn.danger, "flex-1")} disabled={busy || !valid} onClick={() => resolve("reject")}>Rad etish</button>
              <button type="button" className={cn(btn.primary, "flex-1")} disabled={busy || !valid} onClick={() => resolve("paid")}>Bajarildi</button>
            </div>
          </div>
        ) : null}>
        {p ? (
          <div className="space-y-4 text-[13px]">
            <div className="flex flex-wrap gap-1.5"><Pill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Pill>{p.isPlatform ? <Pill tone="blue">Platforma do‘koni</Pill> : null}</div>
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#eceff5] p-4">
              {[["Sotuvchi", p.ownerName ?? "—"], ["Do‘kon", p.storeName], ["Telefon", p.ownerPhone ? fmtPhone(p.ownerPhone) : "—"], ["Summa", `${fmtInt(p.amount)} so‘m`],
                ["So‘ralgan", fmtDate(p.createdAt, true)], ["Ko‘rib chiqilgan", p.processedAt ? fmtDate(p.processedAt, true) : "—"]].map(([l, v]) => (
                <div key={l} className="min-w-0"><div className="text-[11.5px] text-slate-400">{l}</div><div className="break-words font-semibold">{v}</div></div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#eceff5] p-4">
              <p className="mb-2 flex items-center gap-1.5 font-semibold"><CreditCard className="size-4 text-primary" /> Karta rekvizitlari</p>
              {p.cardLast4 ? (
                <div className="grid grid-cols-2 gap-3">
                  {[["Karta", `•••• ${p.cardLast4}`], ["Egasi", p.cardHolder ?? "—"], ["Bank", p.cardBank ?? "—"], ["Turi", p.cardBrand ?? "—"]].map(([l, v]) => (
                    <div key={l} className="min-w-0"><div className="text-[11.5px] text-slate-400">{l}</div><div className="break-words font-semibold">{v}</div></div>
                  ))}
                </div>
              ) : <p className="text-slate-500">Rekvizit ko‘rsatilmagan.</p>}
              <p className="mt-2 text-[11.5px] text-slate-400">Xavfsizlik uchun to‘liq karta raqami saqlanmaydi — faqat oxirgi 4 raqam. To‘liq rekvizitni sotuvchi bilan telefon orqali aniqlang.</p>
            </div>
            {p.adminNote ? (
              <div className={cn("rounded-xl border p-3", p.status === "rejected" ? "border-[#fecaca] bg-[#fef2f2]" : "border-[#bbf7d0] bg-[#f0fdf4]")}>
                <p className="font-semibold">{p.status === "rejected" ? "Rad etish sababi" : "Tranzaksiya izohi"}</p>
                <p className="mt-0.5 text-slate-700">{p.adminNote}</p>
                {p.processedBy ? <p className="mt-1 text-[11.5px] text-slate-400">{p.processedBy}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
      {toast.node}
    </>
  );
}
