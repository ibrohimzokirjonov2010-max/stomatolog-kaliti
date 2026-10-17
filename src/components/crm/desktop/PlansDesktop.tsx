"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ChevronRight, Download, Plus, Printer, Search } from "lucide-react";
import { CrmFrame, CrmModal } from "@/components/crm/desktop/CrmFrame";
import { NewPlanModal } from "@/components/crm/CrmCreateModals";
import { ADULT_LOWER, ADULT_UPPER, ToothChart, cycleTooth } from "@/components/crm/desktop/ToothChart";
import { buildPatients, seedPlans, type PlanStep, type ToothState, type TreatmentPlan } from "@/data/crm";
import { downloadPdf } from "@/lib/simple-pdf";
import { useStoredList } from "@/lib/stored-list";
import { formatGroupedNumber, formatMoney } from "@/lib/format";

const STATES: ToothState[] = ["soglom", "kariyes", "plomba", "endo", "implant", "koronka", "ekstraksiya"];
const LEGEND: { id: ToothState; label: string }[] = [
  { id: "soglom", label: "Sog‘lom" },
  { id: "kariyes", label: "Kariyes" },
  { id: "plomba", label: "Davolangan (plomba)" },
  { id: "endo", label: "Endodontik" },
  { id: "implant", label: "Implant" },
  { id: "koronka", label: "Koronka" },
  { id: "ekstraksiya", label: "Ekstraksiya" },
];
const PATIENTS = buildPatients().slice(0, 10);
const statusLabel = { davom: "Davom etmoqda", yakun: "Yakunlangan", reja: "Rejada" };
const stepLabel = { bajarildi: "Bajarildi", davom: "Davom etmoqda", kutil: "Kutilmoqda" };

export function PlansDesktop() {
  const [plans, setPlans] = useStoredList("sk-crm-plans-v1", seedPlans);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [doctor, setDoctor] = useState("");
  const [selected, setSelected] = useState("r-0001");
  const [stepOpen, setStepOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [templates, setTemplates] = useState(false);
  const [step, setStep] = useState({ name: "", teeth: "", price: "300000" });
  const [pay, setPay] = useState({ amount: "200000", method: "Naqd", note: "To‘lov" });
  const [draft, setDraft] = useState({ title: "", doctor: "Dr. Sardor Karimov", patientId: "p-0002", date: "2026-10-22", teeth: "", amount: "", note: "" });

  const filtered = useMemo(() => plans.filter((plan) => {
    const patient = PATIENTS.find((item) => item.id === plan.patientId);
    if (status && plan.status !== status) return false;
    if (doctor && plan.doctor !== doctor) return false;
    if (q.trim() && !`${plan.title} ${patient?.name ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [doctor, plans, q, status]);
  const plan = plans.find((item) => item.id === selected) ?? filtered[0] ?? plans[0];
  const patient = PATIENTS.find((item) => item.id === plan?.patientId) ?? PATIENTS[0];
  const total = plan?.steps.reduce((sum, item) => sum + item.price, 0) ?? 0;
  const paid = plan?.payments.reduce((sum, item) => sum + item.amount, 0) ?? 0;
  const left = Math.max(0, total - paid);
  const progress = total ? Math.round((paid / total) * 100) : 0;

  function update(id: string, change: (item: TreatmentPlan) => TreatmentPlan) {
    setPlans((prev) => prev.map((item) => (item.id === id ? change(item) : item)));
  }

  if (!plan) return null;

  return (
    <CrmFrame active="plans" placeholder="Bemor, telefon, ID yoki xizmat bo‘yicha qidiring..." headerQuery={q} onHeaderQuery={setQ}>
      <div data-testid="plans-desktop">
        <div className="crm-head">
          <div>
            <h1>Davolash rejalari</h1>
            <p>Bemorlarning davolash rejalari va bosqichlari</p>
          </div>
          <div className="crm-actions">
            <button type="button" className="crm-btn blue" data-testid="plan-add" onClick={() => setNewOpen(true)}><Plus className="i" /> Yangi reja qo‘shish</button>
            <button type="button" className="crm-btn" data-testid="plan-templates" onClick={() => setTemplates(true)}>Reja shablonlari</button>
          </div>
        </div>
        <div className="crm-tools">
          <label className="crm-search"><Search className="i" /><input data-testid="plan-search" aria-label="Reja qidirish" value={q} placeholder="Bemor qidirish..." onChange={(event) => setQ(event.target.value)} /></label>
          <label className="crm-select"><select data-testid="plan-status" aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value); const next = plans.find((item) => !event.target.value || item.status === event.target.value); if (next) setSelected(next.id); }}><option value="">Barcha statuslar</option><option value="davom">Davom etmoqda</option><option value="reja">Rejada</option><option value="yakun">Yakunlangan</option></select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
          <label className="crm-select"><select data-testid="plan-doctor" aria-label="Shifokor" value={doctor} onChange={(event) => setDoctor(event.target.value)}><option value="">Barcha shifokorlar</option>{Array.from(new Set(plans.map((item) => item.doctor))).map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="crm-select"><select aria-label="Sana" defaultValue=""><option value="">Barcha sanalar</option><option>12.10.2026</option><option>09.10.2026</option></select></label>
        </div>
        {filtered.length === 0 ? <div className="crm-empty" data-testid="plan-empty">Reja topilmadi</div> : (
          <div className="pl-top">
            <aside className="pl-box">
              <span className="crm-person"><img src={patient.avatar} alt="" /><span><b>{patient.name}</b><small>#{patient.id.toUpperCase()}</small></span></span>
              <p className="crm-muted">{patient.age} yosh · {patient.gender}</p>
              <p className="crm-muted">{patient.phone}</p>
              <p className="crm-muted">{patient.city}</p>
              <button type="button" className="crm-btn" style={{ marginTop: "calc(.3 * var(--u))" }} onClick={() => setSelected(plans.find((item) => item.patientId !== patient.id)?.id ?? plan.id)}>Batafsil ma’lumot</button>
              <div style={{ marginTop: "calc(.4 * var(--u))" }}>
                {filtered.map((item) => (
                  <button key={item.id} type="button" className="visit" style={{ width: "100%", textAlign: "left" }} onClick={() => setSelected(item.id)}>
                    <span><b>{item.title}</b>{item.code}</span>
                  </button>
                ))}
              </div>
            </aside>
            <div className="pl-box">
              <h3>Tish kartasi (odontogramma)</h3>
              <ToothChart upper={ADULT_UPPER} lower={ADULT_LOWER} teeth={plan.teeth} legend={LEGEND} onCycle={(id) => update(plan.id, (item) => ({ ...item, teeth: { ...item.teeth, [id]: cycleTooth(item.teeth[id], STATES) } }))} />
              <h3 style={{ marginTop: "calc(.5 * var(--u))" }}>Treatment bosqichlari</h3>
              <table className="crm-table">
                <thead><tr><th>#</th><th>Xizmat nomi</th><th>Tish(lar)</th><th>Soni</th><th>Narxi (so‘m)</th><th>Holat</th><th>Sana</th></tr></thead>
                <tbody>
                  {plan.steps.map((item, index) => (
                    <tr key={item.id}><td>{index + 1}</td><td>{item.name}</td><td>{item.teeth}</td><td>{item.count}</td><td>{formatGroupedNumber(item.price)}</td><td><span className={`crm-pill ${item.status}`}>{stepLabel[item.status]}</span></td><td>{item.date || "–"}</td></tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="crm-btn" data-testid="step-add" onClick={() => setStepOpen(true)}><Plus className="i" /> Bosqich qo‘shish</button>
              <p style={{ textAlign: "right", fontWeight: 800 }}>Umumiy: {formatMoney(total, "UZS")}</p>
            </div>
            <aside>
              <div className="pl-box">
                <span className={`crm-pill ${plan.status}`}>{statusLabel[plan.status]}</span>
                <h3 style={{ marginTop: "calc(.3 * var(--u))" }}>{plan.title}</h3>
                <p className="crm-muted">Reja #{plan.code} · {plan.date}</p>
                <p>Shifokor {plan.doctor}</p>
                <p>Umumiy narx <b>{formatMoney(total, "UZS")}</b></p>
                <p>To‘langan <b className="money-plus">{formatMoney(paid, "UZS")}</b></p>
                <p>Qolgan <b className="money-minus">{formatMoney(left, "UZS")}</b></p>
                <p className="crm-muted">Bajarilish darajasi {progress}%</p>
                <div className="bar"><b style={{ width: `${progress}%` }} /></div>
                <button type="button" className="crm-btn blue" style={{ width: "100%", justifyContent: "center", marginTop: "calc(.4 * var(--u))" }} data-testid="plan-edit" onClick={() => setEditOpen(true)}>Rejani tahrirlash</button>
                <div className="crm-actions" style={{ marginTop: "calc(.3 * var(--u))" }}>
                  <button type="button" className="crm-btn" data-testid="plan-pdf" onClick={() => downloadPdf(`${plan.code}.pdf`, [plan.title, plan.doctor, patient.name, `Umumiy ${total}`, `Tolangan ${paid}`, `Qolgan ${left}`, ...plan.steps.map((item) => item.name)])}><Download className="i" /> PDF yuklab olish</button>
                  <button type="button" className="crm-btn" data-testid="plan-print" onClick={() => window.print()}><Printer className="i" /> Chop etish</button>
                </div>
              </div>
              <div className="pl-box" style={{ marginTop: "calc(.4 * var(--u))" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><b>To‘lovlar</b><button type="button" className="crm-btn blue" data-testid="plan-pay" onClick={() => setPayOpen(true)}><Plus className="i" /> To‘lov qo‘shish</button></div>
                <table className="crm-table">
                  <thead><tr><th>Sana</th><th>Summa</th><th>To‘lov usuli</th><th>Izoh</th></tr></thead>
                  <tbody>{plan.payments.map((item) => <tr key={`${item.date}-${item.note}`}><td>{item.date}</td><td>{formatGroupedNumber(item.amount)}</td><td>{item.method}</td><td>{item.note}</td></tr>)}</tbody>
                </table>
                <p className="money-plus">Jami to‘langan: {formatMoney(paid, "UZS")}</p>
                <p className="money-minus">Qolgan: {formatMoney(left, "UZS")}</p>
              </div>
            </aside>
          </div>
        )}
        {stepOpen ? (
          <CrmModal title="Bosqich qo‘shish" onClose={() => setStepOpen(false)}>
            <label className="crm-field">Nomi<input data-testid="step-name" value={step.name} onChange={(event) => setStep({ ...step, name: event.target.value })} /></label>
            <label className="crm-field">Tish<input value={step.teeth} onChange={(event) => setStep({ ...step, teeth: event.target.value })} /></label>
            <label className="crm-field">Narx<input value={step.price} onChange={(event) => setStep({ ...step, price: event.target.value })} /></label>
            <div className="row"><button type="button" className="go" data-testid="step-save" onClick={() => { const next: PlanStep = { id: `s-${Date.now()}`, name: step.name || "Yangi bosqich", teeth: step.teeth || "–", count: 1, price: Number(step.price) || 0, status: "kutil", date: "" }; update(plan.id, (item) => ({ ...item, steps: [...item.steps, next] })); setStepOpen(false); }}>Saqlash</button></div>
          </CrmModal>
        ) : null}
        {payOpen ? (
          <CrmModal title="To‘lov qo‘shish" onClose={() => setPayOpen(false)}>
            <label className="crm-field">Summa<input data-testid="plan-amount" value={pay.amount} onChange={(event) => setPay({ ...pay, amount: event.target.value })} /></label>
            <label className="crm-field">Usul<select value={pay.method} onChange={(event) => setPay({ ...pay, method: event.target.value })}><option>Naqd</option><option>Click</option><option>Karta</option><option>Payme</option></select></label>
            <div className="row"><button type="button" className="go" data-testid="plan-pay-save" onClick={() => { update(plan.id, (item) => ({ ...item, payments: [...item.payments, { date: "22.10.2026", amount: Number(pay.amount) || 0, method: pay.method, note: pay.note }] })); setPayOpen(false); }}>Saqlash</button></div>
          </CrmModal>
        ) : null}
        {editOpen ? (
          <CrmModal title="Rejani tahrirlash" onClose={() => setEditOpen(false)}>
            <label className="crm-field">Nomi<input defaultValue={plan.title} id="plan-title" /></label>
            <label className="crm-field">Shifokor<input defaultValue={plan.doctor} id="plan-doc" /></label>
            <div className="row"><button type="button" className="go" onClick={() => { const title = (document.getElementById("plan-title") as HTMLInputElement).value; const doc = (document.getElementById("plan-doc") as HTMLInputElement).value; update(plan.id, (item) => ({ ...item, title, doctor: doc })); setEditOpen(false); }}>Saqlash</button></div>
          </CrmModal>
        ) : null}
        {newOpen ? (
          <NewPlanModal
            patients={PATIENTS}
            initial={draft}
            onClose={() => setNewOpen(false)}
            onSave={(next) => {
              const id = `r-${Date.now()}`;
              const [year, month, day] = next.date.split("-");
              const price = Number(next.amount) || 0;
              setPlans((prev) => [{
                id,
                title: next.title.trim() || "Yangi reja",
                code: id.slice(-6),
                date: day && month && year ? `${day}.${month}.${year}` : "22.10.2026",
                status: "reja",
                doctor: next.doctor,
                patientId: next.patientId,
                steps: price || next.teeth ? [{ id: `s-${id}`, name: next.note.trim() || "Asosiy bosqich", teeth: next.teeth || "–", count: 1, price, status: "kutil", date: "" }] : [],
                payments: [],
                teeth: {},
              }, ...prev]);
              setDraft(next);
              setSelected(id);
              setNewOpen(false);
            }}
          />
        ) : null}
        {templates ? (
          <CrmModal title="Reja shablonlari" onClose={() => setTemplates(false)}>
            {["Gigiyena paketi", "Implant bosqichlari", "Bolalar ko‘rigi"].map((name) => (
              <button key={name} type="button" className="visit" style={{ width: "100%", textAlign: "left" }} onClick={() => { update(plan.id, (item) => ({ ...item, steps: [...item.steps, { id: `t-${name}`, name, teeth: "–", count: 1, price: 250000, status: "kutil", date: "" }] })); setTemplates(false); }}>{name}</button>
            ))}
          </CrmModal>
        ) : null}
      </div>
    </CrmFrame>
  );
}
