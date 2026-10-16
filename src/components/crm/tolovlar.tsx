"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Banknote, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Plus, Search, Smartphone, Trash2, Wallet } from "lucide-react";
import { Sheet } from "@/components/clinic-dashboard";
import { cn } from "@/lib/utils";
import { METHOD, planTotal, som, todayIso, usePayments, usePlans, type PayMethod } from "./crm-local";
import { CrmFrame, CrmTitle, fmtDate, initials, type useClinic } from "./crm-shared";
import { PaymentForm } from "./payment-form";

type Clinic = ReturnType<typeof useClinic>;
type Gran = "kun" | "hafta" | "oy";
const PAGE = 8;

const monthStart = () => `${todayIso().slice(0, 8)}01`;
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : String(n));

export function TolovlarPage() {
  return <CrmFrame next="/klinika/tolovlar">{(c) => <Tolovlar c={c} />}</CrmFrame>;
}

function Tolovlar({ c }: { c: Clinic }) {
  const patients = useMemo(() => c.state?.patients ?? [], [c.state]);
  const [pays, savePays] = usePayments();
  const [plans] = usePlans();
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayIso());
  const [gran, setGran] = useState<Gran>("kun");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState<null | { method?: PayMethod }>(null);

  const all = useMemo(() => pays ?? [], [pays]);
  const inRange = useMemo(() => all.filter((p) => p.date >= from && p.date <= to), [all, from, to]);
  const sum = (m?: PayMethod[]) => inRange.filter((p) => !m || m.includes(p.method)).reduce((a, p) => a + p.amount, 0);
  const total = sum();

  const debtors = useMemo(() => {
    return (plans ?? [])
      .map((pl) => {
        const paid = all.filter((p) => p.planId === pl.id).reduce((a, p) => a + p.amount, 0);
        const patient = patients.find((p) => p.id === pl.patientId);
        return { pl, patient, debt: planTotal(pl) - paid };
      })
      .filter((d) => d.debt > 0 && d.patient)
      .sort((a, b) => b.debt - a.debt);
  }, [all, patients, plans]);
  const debtTotal = debtors.reduce((a, d) => a + d.debt, 0);

  const bars = useMemo(() => {
    const buckets = new Map<string, number>();
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    const key = (d: Date) => {
      if (gran === "oy") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (gran === "hafta") {
        const m = new Date(d);
        m.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return m.toISOString().slice(0, 10);
      }
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    for (let d = new Date(start); d <= end && buckets.size < 120; d.setDate(d.getDate() + 1)) buckets.set(key(d), buckets.get(key(d)) ?? 0);
    for (const p of inRange) {
      const k = key(new Date(`${p.date}T00:00:00`));
      buckets.set(k, (buckets.get(k) ?? 0) + p.amount);
    }
    return [...buckets.entries()];
  }, [from, gran, inRange, to]);
  const max = Math.max(1, ...bars.map(([, v]) => v));

  const methods = (Object.keys(METHOD) as PayMethod[]).map((m) => ({ m, v: sum([m]) })).sort((a, b) => b.v - a.v);
  let acc = 0;
  const donut = total
    ? `conic-gradient(${methods.map(({ m, v }) => { const s = (acc / total) * 360; acc += v; return `${METHOD[m].color} ${s}deg ${(acc / total) * 360}deg`; }).join(",")})`
    : "conic-gradient(#eef1f6 0deg 360deg)";

  const list = [...inRange].filter((p) => !q.trim() || `${p.patientName} ${p.note ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => b.date.localeCompare(a.date));
  const pages = Math.max(1, Math.ceil(list.length / PAGE));
  const cur = Math.min(page, pages);

  return (
    <div>
      <CrmTitle
        title="To‘lovlar"
        subtitle="Moliyaviy operatsiyalar va bemor to‘lovlari"
        actions={
          <>
            <div className="flex h-10 items-center gap-1.5 rounded-xl border border-[#e6eaf2] bg-white px-3 text-[12.5px]">
              <CalendarDays className="size-4 text-[#6b7590]" />
              <input type="date" aria-label="Boshlanish" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[112px] bg-transparent outline-none" />
              <span>–</span>
              <input type="date" aria-label="Tugash" value={to} onChange={(e) => setTo(e.target.value)} className="w-[112px] bg-transparent outline-none" />
            </div>
            <button type="button" onClick={() => setAdding({})} className="flex h-10 items-center gap-2 rounded-xl bg-[#0066FF] px-5 text-[13px] font-semibold text-white hover:bg-[#0057d9]">
              <Plus className="size-4" /> Yangi to‘lov
            </button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5 2xl:grid-cols-4 xl:gap-3">
        <Kpi icon={Wallet} tone="bg-[#eef4ff] text-[#0066FF]" label="Jami tushum" value={som(total)} />
        <Kpi icon={Banknote} tone="bg-[#e9f8f1] text-[#17914f]" label="Naqd tushum" value={som(sum(["naqd"]))} />
        <Kpi icon={CreditCard} tone="bg-[#eef4ff] text-[#0066FF]" label="Karta / onlayn" value={som(sum(["karta", "click", "payme"]))} />
        <Kpi icon={AlertCircle} tone="bg-[#fdeeee] text-[#d93b3b]" label="Qolgan qarzdorlik" value={som(debtTotal)} danger />
      </div>

      {all.length === 0 ? (
        <div className="mb-4 rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-12 text-center">
          <Wallet className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
          <p className="mt-3 text-[15px] font-semibold text-[#0B1F4D]">Hali to‘lov kiritilmagan</p>
          <p className="mt-1 text-[13px] text-[#8b93a7]">To‘lovlar shu qurilmada saqlanadi. Birinchi to‘lovni qo‘shing.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <div className="mb-3 flex items-center">
                <h2 className="text-[14px] font-bold text-[#0B1F4D]">Tushum dinamikasi</h2>
                <div className="ml-auto flex rounded-lg border border-[#e6eaf2] p-0.5">
                  {(["kun", "hafta", "oy"] as const).map((g) => (
                    <button key={g} type="button" onClick={() => setGran(g)} className={cn("h-7 rounded-md px-3 text-[11.5px] font-semibold", gran === g ? "bg-[#0066FF] text-white" : "text-[#4a5470]")}>
                      {g === "kun" ? "Kunlik" : g === "hafta" ? "Haftalik" : "Oylik"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex h-[150px] items-end gap-[3px] border-b border-[#eef1f6]">
                {bars.map(([k, v]) => (
                  <div key={k} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${k}: ${som(v)}`}>
                    <div className="w-full rounded-t-[3px] bg-gradient-to-t from-[#2f6bff] to-[#7aa7ff]" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 0 }} />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10.5px] text-[#8b93a7]">
                <span>{bars[0]?.[0].split("-").reverse().join(".")}</span>
                <span>max {short(max === 1 ? 0 : max)}</span>
                <span>{bars.at(-1)?.[0].split("-").reverse().join(".")}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <h2 className="mb-3 text-[14px] font-bold text-[#0B1F4D]">To‘lov usullari bo‘yicha</h2>
              <div className="flex items-center gap-4">
                <div className="relative size-[104px] shrink-0 rounded-full" style={{ background: donut }}>
                  <div className="absolute inset-[18px] grid place-items-center rounded-full bg-white text-center">
                    <div className="text-[15px] font-extrabold text-[#0B1F4D]">{short(total)}</div>
                    <div className="-mt-1 text-[10.5px] text-[#6b7590]">so‘m</div>
                  </div>
                </div>
                <ul className="min-w-0 flex-1 space-y-1.5 text-[12px]">
                  {methods.map(({ m, v }) => (
                    <li key={m} className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: METHOD[m].color }} />
                      <span className="flex-1">{METHOD[m].label}</span>
                      <span className="font-semibold">{short(v)}</span>
                      <span className="w-7 text-right text-[11px] text-[#6b7590]">{total ? Math.round((v / total) * 100) : 0}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-bold text-[#0B1F4D]">So‘nggi to‘lovlar</h2>
              <label className="relative ml-auto w-full sm:w-[240px]">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#0066FF]" />
                <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Bemor nomi, izoh..." className="h-9 w-full rounded-lg border border-[#e6eaf2] pr-3 pl-9 text-[12.5px] outline-none focus:border-[#0066FF]" />
              </label>
            </div>
            {list.length === 0 ? (
              <p className="py-6 text-center text-[12.5px] text-[#8b93a7]">Tanlangan davrda to‘lov yo‘q</p>
            ) : (
              <>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-left text-[12.5px]">
                    <thead className="bg-[#f8fafd] text-[11.5px] text-[#6b7590]">
                      <tr><th className="rounded-l-lg py-2 pl-3 font-medium">#</th><th className="font-medium">Sana</th><th className="font-medium">Bemor</th><th className="font-medium">Izoh</th><th className="font-medium">Summa</th><th className="font-medium">Usul</th><th className="rounded-r-lg" /></tr>
                    </thead>
                    <tbody>
                      {list.slice((cur - 1) * PAGE, cur * PAGE).map((p, i) => (
                        <tr key={p.id} className="border-b border-[#f2f4f8] last:border-0">
                          <td className="py-2.5 pl-3 text-[#6b7590]">{(cur - 1) * PAGE + i + 1}</td>
                          <td>{fmtDate(p.date)}</td>
                          <td><span className="flex items-center gap-2"><Av name={p.patientName} /> <span className="font-medium text-[#0B1F4D]">{p.patientName}</span></span></td>
                          <td className="max-w-[180px] truncate text-[#6b7590]">{p.note ?? "—"}</td>
                          <td className="font-semibold">{som(p.amount)}</td>
                          <td><span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", METHOD[p.method].cls)}>{METHOD[p.method].label}</span></td>
                          <td className="pr-2"><button type="button" aria-label="O‘chirish" onClick={() => window.confirm("To‘lovni o‘chirasizmi?") && savePays(all.filter((x) => x.id !== p.id))} className="grid size-7 place-items-center rounded-md text-[#8b93a7] hover:bg-[#f1f3f7]"><Trash2 className="size-3.5" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="space-y-2 sm:hidden">
                  {list.slice((cur - 1) * PAGE, cur * PAGE).map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-xl border border-[#eef1f6] p-2.5">
                      <Av name={p.patientName} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-[#0B1F4D]">{p.patientName}</span>
                        <span className="block text-[11.5px] text-[#8b93a7]">{fmtDate(p.date)}{p.note ? ` · ${p.note}` : ""}</span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[13px] font-bold">{som(p.amount)}</span>
                        <span className={cn("rounded px-1.5 text-[10.5px] font-semibold", METHOD[p.method].cls)}>{METHOD[p.method].label}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center gap-2 text-[12px] text-[#6b7590]">
                  <span>Jami: {list.length} ta to‘lov</span>
                  <div className="ml-auto flex gap-1">
                    <button type="button" aria-label="Oldingi" disabled={cur === 1} onClick={() => setPage(cur - 1)} className="grid size-8 place-items-center rounded-lg border border-[#e6eaf2] disabled:opacity-40"><ChevronLeft className="size-4" /></button>
                    <span className="grid h-8 min-w-8 place-items-center rounded-lg bg-[#0066FF] px-2 font-semibold text-white">{cur}</span>
                    <button type="button" aria-label="Keyingi" disabled={cur === pages} onClick={() => setPage(cur + 1)} className="grid size-8 place-items-center rounded-lg border border-[#e6eaf2] disabled:opacity-40"><ChevronRight className="size-4" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="w-full shrink-0 space-y-4 xl:w-[280px]">
          <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <h2 className="mb-2 text-[14px] font-bold text-[#0B1F4D]">Qarzdor bemorlar</h2>
            {debtors.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-[#8b93a7]">Qarzdor bemor yo‘q</p>
            ) : (
              <ul className="divide-y divide-[#f2f4f8]">
                {debtors.slice(0, 5).map(({ pl, patient, debt }) => (
                  <li key={pl.id} className="flex items-center gap-2.5 py-2">
                    <Av name={patient!.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-[#0B1F4D]">{patient!.name}</span>
                      <span className="block truncate text-[11px] text-[#8b93a7]">{pl.title}</span>
                    </span>
                    <span className="text-[12.5px] font-bold text-[#d93b3b]">{som(debt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
            <h2 className="mb-2 text-[14px] font-bold text-[#0B1F4D]">Tezkor to‘lov</h2>
            <div className="grid grid-cols-4 gap-2">
              {([
                ["click", Smartphone, "bg-[#e8f8ef] text-[#17914f]"],
                ["payme", Smartphone, "bg-[#e6f6fb] text-[#0891b2]"],
                ["karta", CreditCard, "bg-[#f3eaff] text-[#7c3aed]"],
                ["naqd", Banknote, "bg-[#fff4e5] text-[#d9730d]"],
              ] as const).map(([m, Icon, cls]) => (
                <button key={m} type="button" onClick={() => setAdding({ method: m })} className={cn("flex flex-col items-center gap-1 rounded-xl py-3 text-[12px] font-semibold", cls)}>
                  <Icon className="size-5" /> {METHOD[m].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {adding ? (
        <Sheet title="Yangi to‘lov" onClose={() => setAdding(null)}>
          {patients.length ? (
            <PaymentForm patients={patients} method={adding.method} onSave={(p) => { savePays([...all, p]); setAdding(null); }} />
          ) : (
            <p className="text-[14px] text-[#4a5470]">Avval Bemorlar CRM sahifasida bemor qo‘shing.</p>
          )}
        </Sheet>
      ) : null}
    </div>
  );
}

function Av({ name }: { name: string }) {
  return <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e3edff] to-[#cddcff] text-[11px] font-bold text-[#0066FF]">{initials(name)}</span>;
}

function Kpi({ icon: Icon, tone, label, value, danger }: { icon: typeof Wallet; tone: string; label: string; value: string; danger?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border p-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:p-4", danger ? "border-[#fbdada] bg-[#fff6f6]" : "border-[#eceff5] bg-white")}>
      <span className={cn("hidden size-11 shrink-0 place-items-center rounded-xl sm:grid", tone)}><Icon className="size-5" /></span>
      <div className="min-w-0">
        <div className="text-[11.5px] text-[#6b7590] lg:text-[12.5px]">{label}</div>
        <div className={cn("truncate text-[15px] font-extrabold lg:text-[20px]", danger ? "text-[#d93b3b]" : "text-[#0B1F4D]")}>{value}</div>
      </div>
    </div>
  );
}
