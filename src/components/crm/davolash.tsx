"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ChevronDown, Download, Pencil, Phone, Plus, Printer, Search, Trash2, UserRound } from "lucide-react";
import { Sheet, type Patient } from "@/components/clinic-dashboard";
import { cn } from "@/lib/utils";
import { METHOD, planTotal, som, todayIso, uid, usePayments, usePlans, type Plan, type Stage, type StageStatus, type ToothMark } from "./crm-local";
import { CrmFrame, CrmTitle, fmtDate, initials, selectCls, type useClinic } from "./crm-shared";
import { PaymentForm, fieldCls } from "./payment-form";

type Clinic = ReturnType<typeof useClinic>;

const PERM = { up: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], down: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38] };
const MILK = { up: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65], down: [85, 84, 83, 82, 81, 71, 72, 73, 74, 75] };
const MARK: Record<ToothMark | "healthy", { label: string; fill: string }> = {
  healthy: { label: "Sog‘lom", fill: "#ffffff" },
  karies: { label: "Karies", fill: "#cfe0ff" },
  plomba: { label: "Davolangan (plomba)", fill: "#4f8df7" },
  endo: { label: "Endodontik", fill: "#ef4444" },
  implant: { label: "Implant", fill: "#16a34a" },
  koronka: { label: "Koronka", fill: "#c4b5fd" },
  ekstraksiya: { label: "Ekstraksiya", fill: "#9ca3af" },
};
const STATUS: Record<StageStatus, { label: string; cls: string }> = {
  bajarildi: { label: "Bajarildi", cls: "bg-[#e8f8ef] text-[#17914f]" },
  davom: { label: "Davom etmoqda", cls: "bg-[#eaf2ff] text-[#0066FF]" },
  kutilmoqda: { label: "Kutilmoqda", cls: "bg-[#fff1e5] text-[#d9730d]" },
};

export function DavolashPage() {
  return <CrmFrame next="/klinika/davolash-rejalari">{(c) => <Davolash c={c} />}</CrmFrame>;
}

function Davolash({ c }: { c: Clinic }) {
  const patients = useMemo(() => c.state?.patients ?? [], [c.state]);
  const [plans, savePlans] = usePlans();
  const [pays, savePays] = usePayments();
  const [q, setQ] = useState("");
  const [pid, setPid] = useState<string>("");
  const [milk, setMilk] = useState(false);
  const [brush, setBrush] = useState<ToothMark | "healthy">("karies");
  const [modal, setModal] = useState<null | "plan" | "stage" | "pay" | { stage: Stage }>(null);

  const found = patients.filter((p) => !q.trim() || `${p.name} ${p.phone ?? ""}`.toLowerCase().includes(q.trim().toLowerCase()));
  const patient = patients.find((p) => p.id === pid) ?? found[0] ?? null;
  const plan = (plans ?? []).find((p) => p.patientId === patient?.id) ?? null;
  const planPays = (pays ?? []).filter((p) => plan && p.planId === plan.id).sort((a, b) => a.date.localeCompare(b.date));
  const total = plan ? planTotal(plan) : 0;
  const paid = planPays.reduce((a, p) => a + p.amount, 0);
  const done = plan ? plan.stages.filter((s) => s.status === "bajarildi").reduce((a, s) => a + s.price * Math.max(1, s.count), 0) : 0;
  const progress = total ? Math.round((done / total) * 100) : 0;

  const updatePlan = (next: Plan) => savePlans((plans ?? []).map((p) => (p.id === next.id ? next : p)));
  function toggleTooth(n: number) {
    if (!plan) return;
    const teeth = { ...plan.teeth };
    if (brush === "healthy" || teeth[n] === brush) delete teeth[n];
    else teeth[n] = brush;
    updatePlan({ ...plan, teeth });
  }

  if (!patients.length)
    return (
      <div>
        <CrmTitle title="Davolash rejalari" subtitle="Bemorlarning davolash rejalari va bosqichlari" />
        <Empty text="Avval Bemorlar CRM sahifasida bemor qo‘shing." />
      </div>
    );

  return (
    <div className="print:[&_button]:hidden">
      <CrmTitle
        title="Davolash rejalari"
        subtitle="Bemorlarning davolash rejalari va bosqichlari"
        actions={
          patient && !plan ? (
            <button type="button" onClick={() => setModal("plan")} className="flex h-10 items-center gap-2 rounded-xl bg-[#0066FF] px-5 text-[13px] font-semibold text-white">
              <Plus className="size-4" /> Yangi reja qo‘shish
            </button>
          ) : null
        }
      />
      <div className="mb-3 flex flex-wrap gap-2.5 print:hidden">
        <label className="relative min-w-0 flex-1 max-lg:basis-full">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#0066FF]" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bemor qidirish..." className="h-10 w-full rounded-xl border border-[#e6eaf2] bg-white pr-3 pl-10 text-[12.5px] outline-none focus:border-[#0066FF]" />
        </label>
        <label className="relative flex-1 lg:w-[240px] lg:flex-none">
          <select value={patient?.id ?? ""} onChange={(e) => setPid(e.target.value)} className={selectCls}>
            {found.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {(plans ?? []).some((x) => x.patientId === p.id) ? " • reja bor" : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
        </label>
      </div>

      {!patient ? (
        <Empty text="Bemor topilmadi" />
      ) : (
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row">
              <PatientCard p={patient} />
              <div className="min-w-0 flex-1 rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-[14px] font-bold text-[#0B1F4D]">Tish kartasi (odontogramma)</h2>
                  <div className="ml-auto flex rounded-lg border border-[#e6eaf2] p-0.5 print:hidden">
                    {[false, true].map((m) => (
                      <button key={String(m)} type="button" onClick={() => setMilk(m)} className={cn("h-7 rounded-md px-3 text-[11.5px] font-semibold", milk === m ? "bg-[#0066FF] text-white" : "text-[#4a5470]")}>
                        {m ? "Sut tishlari" : "Doimiy tishlar"}
                      </button>
                    ))}
                  </div>
                </div>
                <Chart rows={milk ? MILK : PERM} marks={plan?.teeth ?? {}} onTooth={plan ? toggleTooth : undefined} />
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(Object.keys(MARK) as (ToothMark | "healthy")[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      disabled={!plan}
                      onClick={() => setBrush(k)}
                      className={cn("flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] text-[#4a5470] disabled:cursor-default", plan && brush === k ? "border-[#0066FF] bg-[#f3f8ff]" : "border-transparent")}
                    >
                      <span className="size-2.5 rounded-full border border-[#c9d1df]" style={{ background: MARK[k].fill }} />
                      {MARK[k].label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-[#9aa3b2] print:hidden">{plan ? "Belgini tanlang va tishni bosing." : "Tishlarni belgilash uchun avval reja yarating."}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <h2 className="mb-3 text-[14px] font-bold text-[#0B1F4D]">Davolash bosqichlari</h2>
              {!plan || plan.stages.length === 0 ? (
                <p className="py-6 text-center text-[12.5px] text-[#8b93a7]">{plan ? "Hali bosqich qo‘shilmagan" : "Bu bemor uchun reja yo‘q"}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-[12.5px]">
                    <thead className="bg-[#f8fafd] text-[11.5px] text-[#6b7590]">
                      <tr>
                        <th className="rounded-l-lg py-2 pl-3 font-medium">#</th>
                        <th className="font-medium">Xizmat nomi</th>
                        <th className="font-medium">Tish(lar)</th>
                        <th className="font-medium">Soni</th>
                        <th className="font-medium">Narxi (so‘m)</th>
                        <th className="font-medium">Holat</th>
                        <th className="font-medium">Sana</th>
                        <th className="rounded-r-lg print:hidden" />
                      </tr>
                    </thead>
                    <tbody>
                      {plan.stages.map((s, i) => (
                        <tr key={s.id} className="border-b border-[#f2f4f8] last:border-0">
                          <td className="py-2.5 pl-3 text-[#6b7590]">{i + 1}</td>
                          <td className="font-medium text-[#0B1F4D]">{s.service}</td>
                          <td>{s.teeth.length ? s.teeth.join(", ") : "—"}</td>
                          <td>{s.count}</td>
                          <td>{(s.price * Math.max(1, s.count)).toLocaleString("ru-RU")}</td>
                          <td>
                            <select
                              aria-label="Holat"
                              value={s.status}
                              onChange={(e) => updatePlan({ ...plan, stages: plan.stages.map((x) => (x.id === s.id ? { ...x, status: e.target.value as StageStatus, date: x.date ?? (e.target.value === "bajarildi" ? todayIso() : x.date) } : x)) })}
                              className={cn("appearance-none rounded-md px-2 py-0.5 text-[11.5px] font-semibold outline-none", STATUS[s.status].cls)}
                            >
                              {(Object.keys(STATUS) as StageStatus[]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
                            </select>
                          </td>
                          <td>{s.date ? fmtDate(s.date) : "—"}</td>
                          <td className="pr-2 print:hidden">
                            <div className="flex gap-0.5">
                              <button type="button" aria-label="Tahrirlash" onClick={() => setModal({ stage: s })} className="grid size-7 place-items-center rounded-md text-[#6b7590] hover:bg-[#f1f3f7]"><Pencil className="size-3.5" /></button>
                              <button type="button" aria-label="O‘chirish" onClick={() => window.confirm("Bosqichni o‘chirasizmi?") && updatePlan({ ...plan, stages: plan.stages.filter((x) => x.id !== s.id) })} className="grid size-7 place-items-center rounded-md text-[#6b7590] hover:bg-[#f1f3f7]"><Trash2 className="size-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {plan ? (
                <div className="mt-3 flex items-center">
                  <button type="button" onClick={() => setModal("stage")} className="flex h-9 items-center gap-1.5 rounded-lg bg-[#f3f8ff] px-3.5 text-[12.5px] font-semibold text-[#0066FF] print:hidden">
                    <Plus className="size-4" /> Bosqich qo‘shish
                  </button>
                  <span className="ml-auto text-[13px] text-[#4a5470]">
                    Umumiy: <b className="text-[17px] text-[#0066FF]">{som(total)}</b>
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="w-full shrink-0 space-y-4 xl:w-[300px]">
            <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-bold text-[#0B1F4D]">Davolash rejasi</h2>
                {plan ? <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", progress >= 100 ? STATUS.bajarildi.cls : STATUS.davom.cls)}>{progress >= 100 ? "Yakunlangan" : "Davom etmoqda"}</span> : null}
              </div>
              {!plan ? (
                <div className="py-6 text-center">
                  <p className="text-[12.5px] text-[#8b93a7]">Bu bemor uchun reja hali yaratilmagan</p>
                  <button type="button" onClick={() => setModal("plan")} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-[#0066FF] px-4 text-[13px] font-semibold text-white">
                    <Plus className="size-4" /> Reja yaratish
                  </button>
                </div>
              ) : (
                <>
                  <p className="mt-1 text-[15px] font-bold text-[#0B1F4D]">{plan.title}</p>
                  <p className="text-[11.5px] text-[#8b93a7]">{fmtDate(plan.createdAt)}</p>
                  <dl className="mt-3 space-y-1.5 text-[12.5px]">
                    {plan.doctor ? <Row k="Shifokor" v={plan.doctor} /> : null}
                    <Row k="Umumiy narx" v={som(total)} b />
                    <Row k="To‘langan" v={som(paid)} cls="text-[#17914f]" />
                    <Row k="Qolgan" v={som(Math.max(0, total - paid))} cls="text-[#d93b3b]" />
                  </dl>
                  <div className="mt-3 flex justify-between text-[12px]"><span>Bajarilish darajasi</span><b className="text-[#0066FF]">{progress}%</b></div>
                  <div className="mt-1 h-2 rounded-full bg-[#eef1f6]"><div className="h-2 rounded-full bg-[#0066FF]" style={{ width: `${progress}%` }} /></div>
                  <button type="button" onClick={() => setModal("plan")} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] text-[13px] font-semibold text-white print:hidden">
                    <Pencil className="size-4" /> Rejani tahrirlash
                  </button>
                  <div className="mt-2 grid grid-cols-2 gap-2 print:hidden">
                    <button type="button" onClick={() => window.print()} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d6e4ff] text-[12px] font-semibold text-[#0066FF]"><Download className="size-4" /> PDF</button>
                    <button type="button" onClick={() => window.print()} className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#d6e4ff] text-[12px] font-semibold text-[#0066FF]"><Printer className="size-4" /> Chop etish</button>
                  </div>
                </>
              )}
            </div>

            {plan ? (
              <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-[14px] font-bold text-[#0B1F4D]">To‘lovlar</h2>
                  <button type="button" onClick={() => setModal("pay")} className="flex h-8 items-center gap-1 rounded-lg bg-[#0066FF] px-3 text-[12px] font-semibold text-white print:hidden"><Plus className="size-3.5" /> To‘lov qo‘shish</button>
                </div>
                {planPays.length === 0 ? (
                  <p className="py-4 text-center text-[12px] text-[#8b93a7]">Hali to‘lov yo‘q</p>
                ) : (
                  <table className="w-full text-left text-[11.5px]">
                    <thead className="text-[#6b7590]"><tr><th className="py-1 font-medium">Sana</th><th className="font-medium">Summa</th><th className="font-medium">Usul</th><th className="font-medium">Izoh</th></tr></thead>
                    <tbody>
                      {planPays.map((p) => (
                        <tr key={p.id} className="border-t border-[#f2f4f8]">
                          <td className="py-1.5">{fmtDate(p.date)}</td>
                          <td>{p.amount.toLocaleString("ru-RU")}</td>
                          <td><span className={cn("rounded px-1.5 py-0.5 text-[10.5px] font-semibold", METHOD[p.method].cls)}>{METHOD[p.method].label}</span></td>
                          <td className="max-w-[80px] truncate text-[#6b7590]">{p.note ?? ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <dl className="mt-2 space-y-1 border-t border-[#eef1f6] pt-2 text-[12.5px]">
                  <Row k="Jami to‘langan" v={som(paid)} cls="text-[#17914f]" />
                  <Row k="Qolgan" v={som(Math.max(0, total - paid))} cls="text-[#d93b3b]" />
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {modal === "plan" && patient ? (
        <Sheet title={plan ? "Rejani tahrirlash" : "Yangi reja"} onClose={() => setModal(null)}>
          <PlanForm
            plan={plan}
            onDelete={plan ? () => { savePlans((plans ?? []).filter((p) => p.id !== plan.id)); setModal(null); } : undefined}
            onSave={(title, doctor) => {
              if (plan) updatePlan({ ...plan, title, doctor });
              else savePlans([...(plans ?? []), { id: uid(), patientId: patient.id, title, doctor, createdAt: todayIso(), stages: [], teeth: {} }]);
              setModal(null);
            }}
          />
        </Sheet>
      ) : null}
      {plan && (modal === "stage" || (modal && typeof modal === "object")) ? (
        <Sheet title={typeof modal === "object" ? "Bosqichni tahrirlash" : "Bosqich qo‘shish"} onClose={() => setModal(null)}>
          <StageForm
            stage={typeof modal === "object" && modal ? modal.stage : null}
            onSave={(s) => {
              const exists = plan.stages.some((x) => x.id === s.id);
              updatePlan({ ...plan, stages: exists ? plan.stages.map((x) => (x.id === s.id ? s : x)) : [...plan.stages, s] });
              setModal(null);
            }}
          />
        </Sheet>
      ) : null}
      {modal === "pay" && plan && patient ? (
        <Sheet title="To‘lov qo‘shish" onClose={() => setModal(null)}>
          <PaymentForm patients={patients} patientId={patient.id} planId={plan.id} onSave={(p) => { savePays([...(pays ?? []), p]); setModal(null); }} />
        </Sheet>
      ) : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#d9e0ec] bg-white px-6 py-14 text-center">
      <UserRound className="mx-auto size-10 text-[#0066FF]" strokeWidth={1.5} />
      <p className="mt-3 text-[14px] font-semibold text-[#0B1F4D]">{text}</p>
    </div>
  );
}

function Row({ k, v, b, cls }: { k: string; v: string; b?: boolean; cls?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-[#6b7590]">{k}</dt>
      <dd className={cn("text-right font-semibold text-[#0B1F4D]", b && "font-bold", cls)}>{v}</dd>
    </div>
  );
}

function PatientCard({ p }: { p: Patient }) {
  return (
    <div className="rounded-2xl border border-[#eceff5] bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] lg:w-[230px]">
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#e3edff] to-[#cddcff] text-[18px] font-bold text-[#0066FF]">{initials(p.name)}</span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold text-[#0B1F4D]">{p.name}</div>
          <div className="text-[11.5px] text-[#8b93a7]">#{p.id.slice(0, 8).toUpperCase()}</div>
          <span className={cn("mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold", p.status === "Faol" ? "bg-[#e8f8ef] text-[#17914f]" : "bg-[#fdecec] text-[#d93b3b]")}>{p.status === "Faol" ? "Faol" : "Nofaol"}</span>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-[12.5px] text-[#1f2a44]">
        {p.phone ? <div className="flex items-center gap-2"><Phone className="size-3.5 text-[#6b7590]" /> {p.phone}</div> : null}
        {p.lastVisit ? <div className="text-[#6b7590]">Oxirgi tashrif: {fmtDate(p.lastVisit)}</div> : null}
        {p.note ? <div className="text-[#6b7590]">{p.note}</div> : null}
      </div>
    </div>
  );
}

function Chart({ rows, marks, onTooth }: { rows: { up: number[]; down: number[] }; marks: Record<string, ToothMark>; onTooth?: (n: number) => void }) {
  const tooth = (n: number, upper: boolean) => {
    const m = marks[n];
    const molar = n % 10 >= 6 || (n > 50 && n % 10 >= 4);
    const w = molar ? 22 : 17;
    return (
      <button key={n} type="button" disabled={!onTooth} onClick={() => onTooth?.(n)} className="flex flex-col items-center gap-0.5 disabled:cursor-default" title={`Tish ${n}${m ? ` — ${MARK[m].label}` : ""}`}>
        {upper ? <span className="text-[9.5px] text-[#6b7590]">{n}</span> : null}
        <svg width={w} height={40} viewBox={`0 0 ${w} 40`} className={cn(!upper && "rotate-180")}>
          <path d={`M2 6 Q${w / 2} -2 ${w - 2} 6 L${w - 3} 20 Q${w * 0.72} 39 ${w / 2} 29 Q${w * 0.28} 39 3 20 Z`} fill={m ? MARK[m].fill : "#fff"} stroke={m === "ekstraksiya" ? "#6b7280" : "#b9c2d3"} strokeWidth={1} strokeDasharray={m === "ekstraksiya" ? "2 2" : undefined} />
        </svg>
        {!upper ? <span className="text-[9.5px] text-[#6b7590]">{n}</span> : null}
      </button>
    );
  };
  return (
    <div className="overflow-x-auto">
      <div className="mx-auto w-max min-w-full">
        <div className="flex justify-between gap-0.5">{rows.up.map((n) => tooth(n, true))}</div>
        <div className="mt-1.5 flex justify-between gap-0.5">{rows.down.map((n) => tooth(n, false))}</div>
      </div>
    </div>
  );
}

function PlanForm({ plan, onSave, onDelete }: { plan: Plan | null; onSave: (title: string, doctor?: string) => void; onDelete?: () => void }) {
  const [title, setTitle] = useState(plan?.title ?? "");
  const [doctor, setDoctor] = useState(plan?.doctor ?? "");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (title.trim()) onSave(title.trim(), doctor.trim() || undefined);
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-[12.5px] font-medium text-[#4a5470]">Reja nomi *<input value={title} onChange={(e) => setTitle(e.target.value)} className={fieldCls} required /></label>
      <label className="block text-[12.5px] font-medium text-[#4a5470]">Shifokor<input value={doctor} onChange={(e) => setDoctor(e.target.value)} className={fieldCls} /></label>
      <button type="submit" className="h-11 w-full rounded-xl bg-[#0066FF] text-[14px] font-semibold text-white">Saqlash</button>
      {onDelete ? <button type="button" onClick={() => window.confirm("Rejani o‘chirasizmi?") && onDelete()} className="h-10 w-full rounded-xl text-[13px] font-semibold text-red-600 hover:bg-red-50">Rejani o‘chirish</button> : null}
    </form>
  );
}

function StageForm({ stage, onSave }: { stage: Stage | null; onSave: (s: Stage) => void }) {
  const [f, setF] = useState({ service: stage?.service ?? "", teeth: stage?.teeth.join(", ") ?? "", count: String(stage?.count ?? 1), price: stage ? String(stage.price) : "", status: stage?.status ?? ("kutilmoqda" as StageStatus), date: stage?.date ?? "" });
  const [err, setErr] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (!f.service.trim()) return setErr("Xizmat nomini kiriting");
    const teeth = f.teeth.split(/[\s,;]+/).map(Number).filter((n) => (n >= 11 && n <= 48) || (n >= 51 && n <= 85));
    onSave({ id: stage?.id ?? uid(), service: f.service.trim(), teeth, count: Math.max(1, Number(f.count) || 1), price: Math.max(0, Number(f.price.replace(/\s/g, "")) || 0), status: f.status, date: f.date || undefined });
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <label className="col-span-2 block text-[12.5px] font-medium text-[#4a5470]">Xizmat nomi *<input value={f.service} onChange={(e) => setF({ ...f, service: e.target.value })} className={fieldCls} /></label>
      <label className="block text-[12.5px] font-medium text-[#4a5470]">Tish(lar) (FDI)<input value={f.teeth} placeholder="16, 26" onChange={(e) => setF({ ...f, teeth: e.target.value })} className={fieldCls} /></label>
      <label className="block text-[12.5px] font-medium text-[#4a5470]">Soni<input type="number" min={1} value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} className={fieldCls} /></label>
      <label className="block text-[12.5px] font-medium text-[#4a5470]">Narxi, 1 dona (so‘m)<input inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className={fieldCls} /></label>
      <label className="block text-[12.5px] font-medium text-[#4a5470]">Sana<input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} className={fieldCls} /></label>
      <label className="col-span-2 block text-[12.5px] font-medium text-[#4a5470]">Holat
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as StageStatus })} className={fieldCls}>
          {(Object.keys(STATUS) as StageStatus[]).map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
        </select>
      </label>
      {err ? <p className="col-span-2 text-[13px] text-red-600">{err}</p> : null}
      <button type="submit" className="col-span-2 h-11 rounded-xl bg-[#0066FF] text-[14px] font-semibold text-white">Saqlash</button>
    </form>
  );
}
