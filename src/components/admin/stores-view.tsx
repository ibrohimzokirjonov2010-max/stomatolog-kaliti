"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ExternalLink, FileSpreadsheet, Percent, PauseCircle, PlayCircle, Search, Store } from "lucide-react";
import {
  AreaChart, Avatar, Card, Chips, Empty, ErrorBox, Loading, PageHead, Pill, Segmented, adminPost, btn, fmtDate, fmtInt, hashTone,
  moneyParts, moneyShort, shortDate, useAdminData, useToast,
} from "@/components/admin/ui";
import { fmtPhone } from "@/components/admin/users-view";
import { cn } from "@/lib/utils";

type Metrics = { sales: number; gmv: number; commission: number; avgCheck: number };
type Row = {
  id: string; slug: string; name: string; city?: string | null; status: "active" | "suspended"; ownerName?: string | null; ownerFullName?: string | null;
  ownerId: string; plan?: string | null; products: number; metrics: Metrics; commissionRate: number; appliedAt?: string; reviewedAt?: string;
  createdAt: string; telegram?: string | null; instagram?: string | null; views: number;
};
type Data = { rows: Row[]; totals: { gmv: number; commission: number; orders: number }; active: number; all: number };
type Detail = {
  store: Row & { suspendedReason?: string | null; address?: string | null };
  metrics: Metrics; series: { date: string; gmv: number }[];
  topProducts: { name: string; brand: string | null; qty: number; revenue: number }[];
  escrow: number; disputes: number; refundRate: number; products: number; ownerPhone: string | null;
};
type Days = "7" | "30" | "90";
type Filter = "all" | "active" | "suspended";

function MoneyBig({ v }: { v: number }) {
  const p = moneyParts(v);
  return (
    <span>
      <span className="font-heading text-[22px] font-bold">{p.value}</span>
      <span className="ml-1 text-[12px] text-slate-400">{p.unit}</span>
    </span>
  );
}

export function StoresView() {
  const [days, setDays] = useState<Days>("30");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const { data, error, loading, reload } = useAdminData<Data>(`/api/admin/stores?days=${days}`);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.rows ?? [])
      .filter((r) => filter === "all" || r.status === filter)
      .filter((r) => !t || [r.name, r.ownerName, r.ownerFullName, r.city].some((v) => (v ?? "").toLowerCase().includes(t)))
      .sort((a, b) => b.metrics.gmv - a.metrics.gmv);
  }, [data, filter, q]);
  const avg = data && data.totals.orders ? data.totals.gmv / data.totals.orders : 0;
  const selected = sel ?? rows[0]?.id ?? null;

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHead
        title="Do‘konlar"
        subtitle={data ? `${fmtInt(data.all)} ta tasdiqlangan do‘kon · ${days} kunlik ko‘rsatkichlar` : "Yuklanmoqda…"}
        actions={
          <>
            <Segmented value={days} onChange={setDays} options={[{ id: "7", label: "7 kun" }, { id: "30", label: "30 kun" }, { id: "90", label: "90 kun" }]} />
            <a href={`/api/admin/export?kind=stores&days=${days}`} className={btn.outline}>
              <FileSpreadsheet className="size-4" /> Eksport
            </a>
          </>
        }
      />
      {error ? (
        <ErrorBox text={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : (
        <div className={cn("space-y-4", loading && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Card className="p-4"><div className="text-[12px] text-slate-500">Jami GMV</div><MoneyBig v={data.totals.gmv} /></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-500">Komissiya (o‘tkazilgan)</div><MoneyBig v={data.totals.commission} /></Card>
            <Card className="p-4"><div className="text-[12px] text-slate-500">O‘rtacha chek</div><MoneyBig v={avg} /></Card>
            <Card className="p-4">
              <div className="text-[12px] text-slate-500">Faol do‘konlar</div>
              <span className="font-heading text-[22px] font-bold">{fmtInt(data.active)}</span>
              <span className="ml-1 text-[12px] text-slate-400">/ {fmtInt(data.all)}</span>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f7] p-3">
              <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 text-[13px] lg:max-w-[300px]">
                <Search className="size-4 text-slate-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Do‘kon yoki egasi…" className="min-w-0 flex-1 bg-transparent outline-none" />
              </label>
              <Chips value={filter} onChange={setFilter} options={[
                { id: "all", label: "Barchasi" },
                { id: "active", label: "Faol", count: data.rows.filter((r) => r.status === "active").length },
                { id: "suspended", label: "To‘xtatilgan", count: data.rows.filter((r) => r.status === "suspended").length },
              ]} />
              <span className="ml-auto text-[12px] text-slate-400">Saralash: GMV ↓</span>
            </div>
            {rows.length === 0 ? (
              <Empty icon={<Store className="size-5" />} title={data.all ? "Mos do‘kon topilmadi" : "Hali tasdiqlangan do‘kon yo‘q"}
                hint={data.all ? undefined : "Sotuvchi arizasi tasdiqlangach, do‘kon shu yerda paydo bo‘ladi."} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-[13px]">
                  <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Do‘kon</th>
                      <th className="px-3 py-2.5 text-left">Tarif</th>
                      <th className="px-3 py-2.5 text-right">Sotuvlar</th>
                      <th className="px-3 py-2.5 text-right">GMV</th>
                      <th className="px-3 py-2.5 text-right">Komissiya</th>
                      <th className="px-3 py-2.5 text-right">O‘rt. chek</th>
                      <th className="px-3 py-2.5 text-right">Mahsulot</th>
                      <th className="px-4 py-2.5 text-left">Holat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} onClick={() => setSel(r.id)} className={cn("cursor-pointer border-t border-[#f1f5f9] hover:bg-[#f8fbff]", selected === r.id && "bg-[#eef4ff]")}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.name} tone={hashTone(r.id)} className="size-8" />
                            <div>
                              <div className="flex items-center gap-1 font-semibold">{r.name}{r.status === "active" ? <BadgeCheck className="size-3.5 text-primary" /> : null}</div>
                              <div className="text-[11.5px] text-slate-400">{[r.ownerName || r.ownerFullName, r.city].filter(Boolean).join(" · ")}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{r.plan || "Bepul"}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{fmtInt(r.metrics.sales)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{moneyShort(r.metrics.gmv)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-[#15803d]">{moneyShort(r.metrics.commission)} <span className="text-[11px] font-normal text-slate-400">({Number(r.commissionRate)}%)</span></td>
                        <td className="px-3 py-2.5 text-right">{fmtInt(r.metrics.avgCheck)}</td>
                        <td className="px-3 py-2.5 text-right">{fmtInt(r.products)}</td>
                        <td className="px-4 py-2.5">{r.status === "active" ? <Pill tone="green">Faol</Pill> : <Pill tone="red">To‘xtatilgan</Pill>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          {selected ? <StoreDetail id={selected} onChanged={reload} /> : null}
        </div>
      )}
    </div>
  );
}

function StoreDetail({ id, onChanged }: { id: string; onChanged: () => void }) {
  const { data, error, loading, reload } = useAdminData<Detail>(`/api/admin/stores/${id}`);
  const toast = useToast();
  const router = useRouter();
  const [editRate, setEditRate] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(action: string, value?: string) {
    setBusy(true);
    const res = await adminPost(`/api/admin/stores/${id}`, { action, value });
    setBusy(false);
    if (!res.ok) return toast.show(res.error, "err");
    toast.show(action === "commission" ? "Komissiya yangilandi" : action === "suspend" ? "Do‘kon to‘xtatildi" : "Do‘kon faollashtirildi");
    setEditRate(null);
    setSuspendReason(null);
    await reload();
    onChanged();
    router.refresh();
  }

  if (error) return <ErrorBox text={error} onRetry={reload} />;
  if (!data || loading && !data) return <Card><Loading /></Card>;
  const s = data.store;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-3">
        <Avatar name={s.name} tone={hashTone(s.id)} className="size-12 text-[15px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-[20px] font-bold">{s.name}</p>
            {s.status === "active" ? <Pill tone="green">Faol</Pill> : <Pill tone="red">To‘xtatilgan</Pill>}
            {s.plan ? <Pill tone="violet">{s.plan}</Pill> : null}
          </div>
          <p className="text-[12.5px] text-slate-500">
            {[s.ownerName, data.ownerPhone ? fmtPhone(data.ownerPhone) : null, s.city, s.address, s.reviewedAt ? `${fmtDate(s.reviewedAt)} dan beri` : null, s.instagram ? `@${s.instagram.replace(/^@/, "")}` : null].filter(Boolean).join(" · ")}
          </p>
          {s.status === "suspended" && s.suspendedReason ? <p className="mt-1 text-[12.5px] text-[#b91c1c]">Sabab: {s.suspendedReason}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {editRate !== null ? (
            <span className="flex items-center gap-1.5">
              <input type="number" min={0} max={50} step={0.5} value={editRate} onChange={(e) => setEditRate(e.target.value)} className="h-9 w-20 rounded-xl border border-[#e2e8f0] px-2 text-[13px]" aria-label="Komissiya %" />
              <button type="button" className={btn.primary} disabled={busy} onClick={() => act("commission", editRate)}>Saqlash</button>
              <button type="button" className={btn.outline} onClick={() => setEditRate(null)}>Bekor</button>
            </span>
          ) : (
            <button type="button" className={btn.outline} onClick={() => setEditRate(String(Number(s.commissionRate)))}>
              <Percent className="size-4" /> Komissiya: {Number(s.commissionRate)}%
            </button>
          )}
          <a href={`/marketplace/dokon/${s.slug}`} target="_blank" rel="noreferrer" className={btn.outline}>
            <ExternalLink className="size-4" /> Ommaviy sahifa
          </a>
          {s.status === "active" ? (
            <button type="button" className={btn.danger} onClick={() => setSuspendReason("")}>
              <PauseCircle className="size-4" /> To‘xtatish
            </button>
          ) : (
            <button type="button" className={btn.primary} disabled={busy} onClick={() => act("activate")}>
              <PlayCircle className="size-4" /> Faollashtirish
            </button>
          )}
        </div>
      </div>
      {suspendReason !== null ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3">
          <input value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} maxLength={300} placeholder="To‘xtatish sababi (sotuvchi kabinetida ko‘rinadi)" className="h-9 min-w-[240px] flex-1 rounded-lg border border-[#fecaca] bg-white px-2.5 text-[13px] outline-none" />
          <button type="button" className={btn.outline} onClick={() => setSuspendReason(null)}>Bekor</button>
          <button type="button" className={btn.dangerSolid} disabled={busy} onClick={() => act("suspend", suspendReason)}>Do‘konni to‘xtatish</button>
        </div>
      ) : null}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
            <span className="font-semibold">Kunlik savdo (GMV) · 30 kun</span>
            <span className="flex flex-wrap gap-3 text-slate-500">
              <span>Sotuv: <b className="text-[#0f172a]">{fmtInt(data.metrics.sales)}</b></span>
              <span>GMV: <b className="text-[#0f172a]">{moneyShort(data.metrics.gmv)}</b></span>
              <span>Komissiya: <b className="text-[#15803d]">{moneyShort(data.metrics.commission)}</b></span>
              <span>Qaytarish: <b className="text-[#0f172a]">{Number(data.refundRate)}%</b></span>
            </span>
          </div>
          <AreaChart values={data.series.map((p) => p.gmv)} labels={data.series.map((p) => shortDate(p.date))} height={220} />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold">Top mahsulotlar</p>
          {data.topProducts.length === 0 ? (
            <p className="text-[12.5px] text-slate-400">Hali sotuv yo‘q.</p>
          ) : (
            <ol className="space-y-2">
              {data.topProducts.map((p, i) => (
                <li key={p.name + i} className="flex items-center gap-2 text-[13px]">
                  <span className="flex size-6 items-center justify-center rounded-md bg-[#f1f5f9] text-[11px] font-bold text-slate-500">{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{p.name}</span><span className="text-[11.5px] text-slate-400">{fmtInt(p.qty)} dona sotildi</span></span>
                  <span className="font-semibold">{moneyShort(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[["Escrowda", moneyShort(data.escrow)], ["Ochiq nizolar", fmtInt(data.disputes)], ["Ko‘rishlar", fmtInt(s.views)], ["Mahsulotlar", fmtInt(data.products)]].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-[#f8fafc] p-2.5">
                <div className="text-[11px] text-slate-400">{l}</div>
                <div className="font-heading text-[15px] font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {toast.node}
    </Card>
  );
}
