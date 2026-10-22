"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, CircleDollarSign, Download, MapPin, Pencil, Phone, Plus, Printer, Search, UserRound, Wallet } from "lucide-react";
import { CrmFrame, CrmModal } from "@/components/crm/desktop/CrmFrame";
import { NewPlanModal } from "@/components/crm/CrmCreateModals";
import { ADULT_LOWER, ADULT_UPPER, BABY_LOWER, BABY_UPPER, ToothChart, cycleTooth } from "@/components/crm/desktop/ToothChart";
import { type Patient, type PlanStep, type ToothState, type TreatmentPlan } from "@/data/crm";
import { useCrmPatients } from "@/lib/use-crm-list";
import { tashkentDateParts } from "@/lib/tashkent-date";
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
const statusLabel = { davom: "Davom etmoqda", yakun: "Yakunlangan", reja: "Rejada" };
const stepLabel = { bajarildi: "Bajarildi", davom: "Davom etmoqda", kutil: "Kutilmoqda" };

function todayDot() {
  const [year, month, day] = tashkentDateParts().iso.split("-");
  return `${day}.${month}.${year}`;
}

export function PlansDesktop() {
  const [plans, setPlans] = useStoredList<TreatmentPlan>("sk-crm-plans-v1", []);
  const [patients] = useCrmPatients<Patient>();
  const [dateFilter, setDateFilter] = useState("");
  const [baby, setBaby] = useState(false);
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
  const [draft, setDraft] = useState({ title: "", doctor: "", patientId: "", date: "", teeth: "", amount: "", note: "" });

  const filtered = useMemo(() => plans.filter((plan) => {
    const patient = patients.find((item) => item.id === plan.patientId);
    if (status && plan.status !== status) return false;
    if (doctor && plan.doctor !== doctor) return false;
    if (dateFilter && plan.date !== dateFilter) return false;
    if (q.trim() && !`${plan.title} ${patient?.name ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [dateFilter, doctor, patients, plans, q, status]);
  const plan = filtered.find((item) => item.id === selected) ?? filtered[0];
  const patient = patients.find((item) => item.id === plan?.patientId);
  const planDates = Array.from(new Set(plans.map((item) => item.date).filter(Boolean)));
  const total = plan?.steps.reduce((sum, item) => sum + item.price, 0) ?? 0;
  const paid = plan?.payments.reduce((sum, item) => sum + item.amount, 0) ?? 0;
  const left = Math.max(0, total - paid);
  const progress = total ? Math.round((paid / total) * 100) : 0;

  function update(id: string, change: (item: TreatmentPlan) => TreatmentPlan) {
    setPlans((prev) => prev.map((item) => (item.id === id ? change(item) : item)));
  }

  if (plans.length === 0) {
    return (
      <CrmFrame active="plans" placeholder="Bemor, telefon, ID yoki xizmat bo‘yicha qidiring..." headerQuery={q} onHeaderQuery={setQ}>
        <div data-testid="plans-desktop">
          <div className="crm-head">
            <div>
              <h1>Davolash rejalari</h1>
              <p>Hali reja yo‘q</p>
            </div>
          </div>
        </div>
      </CrmFrame>
    );
  }

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
          <label className="crm-select"><select aria-label="Sana" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}><option value="">Barcha sanalar</option>{planDates.map((item) => <option key={item}>{item}</option>)}</select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
        </div>
        {!plan ? <div className="crm-empty" data-testid="plan-empty">Reja topilmadi</div> : (
          <div className="pl-layout">
            <section className="pl-box pl-patient">
              <div className="pl-who">
                {patient?.avatar ? <img src={patient.avatar} alt="" /> : <span className="pt-ini" aria-hidden>{(patient?.name ?? "B").slice(0, 1)}</span>}
                <div>
                  <b>{patient?.name ?? "Bemor topilmadi"}</b>
                  <small>#{(patient?.id ?? plan.patientId).toUpperCase()}</small>
                  {patient ? (
                    <span className="pl-tags">
                      {patient.age ? <i>{patient.age} yosh</i> : null}
                      <i>{patient.gender}</i>
                    </span>
                  ) : null}
                </div>
              </div>
              <ul className="pt-facts">
                {patient?.phone ? <li><Phone className="i" /> {patient.phone}</li> : null}
                {patient?.city ? <li><MapPin className="i" /> {patient.city}</li> : null}
                {patient ? <li><Link className="pl-link" href={`/crm/bemorlar/${patient.id}`}><CalendarDays className="i" /> Batafsil ma’lumot</Link></li> : null}
              </ul>
              {filtered.length > 1 ? (
                <div className="pl-list">
                  {filtered.map((item) => (
                    <button key={item.id} type="button" className={item.id === plan.id ? "on" : undefined} onClick={() => setSelected(item.id)}>
                      <b>{item.title}</b>
                      <small>{patients.find((row) => row.id === item.patientId)?.name ?? "Bemor"} · {item.date}</small>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="pl-box pl-chart">
              <div className="pl-chart-h">
                <h3>Tish kartasi (odontogramma)</h3>
                <div className="ap-view">
                  <button type="button" className={baby ? undefined : "on"} onClick={() => setBaby(false)}>Doimiy tishlar</button>
                  <button type="button" className={baby ? "on" : undefined} data-testid="plan-baby" onClick={() => setBaby(true)}>Sut tishlari</button>
                </div>
              </div>
              <ToothChart upper={baby ? BABY_UPPER : ADULT_UPPER} lower={baby ? BABY_LOWER : ADULT_LOWER} teeth={plan.teeth} legend={LEGEND} onCycle={(id) => update(plan.id, (item) => ({ ...item, teeth: { ...item.teeth, [id]: cycleTooth(item.teeth[id], STATES) } }))} />
            </section>

            <section className="pl-box pl-summary">
              <div className="pl-summary-h">
                <h3>Davolash rejasi</h3>
                <span className={`crm-pill ${plan.status}`}>{statusLabel[plan.status]}</span>
              </div>
              <h2>{plan.title}</h2>
              <p className="crm-muted">Reja #{plan.code} · {plan.date}</p>
              <dl className="pl-facts">
                <dt><UserRound className="i" /> Shifokor</dt><dd>{plan.doctor || "—"}</dd>
                <dt><CircleDollarSign className="i" /> Umumiy narx</dt><dd>{formatMoney(total, "UZS")}</dd>
                <dt><Wallet className="i" /> To‘langan</dt><dd className="money-plus">{formatMoney(paid, "UZS")}</dd>
                <dt><Wallet className="i" /> Qolgan</dt><dd className="money-minus">{formatMoney(left, "UZS")}</dd>
              </dl>
              <div className="pl-progress"><span>Bajarilish darajasi</span><b>{progress}%</b></div>
              <div className="bar"><b style={{ width: `${progress}%` }} /></div>
              <button type="button" className="crm-btn blue pl-wide" data-testid="plan-edit" onClick={() => setEditOpen(true)}><Pencil className="i" /> Rejani tahrirlash</button>
              <div className="pl-two">
                <button type="button" className="crm-btn" data-testid="plan-pdf" onClick={() => downloadPdf(`${plan.code}.pdf`, [plan.title, plan.doctor, patient?.name ?? "", `Umumiy ${total}`, `Tolangan ${paid}`, `Qolgan ${left}`, ...plan.steps.map((item) => item.name)])}><Download className="i" /> PDF yuklab olish</button>
                <button type="button" className="crm-btn" data-testid="plan-print" onClick={() => window.print()}><Printer className="i" /> Chop etish</button>
              </div>
            </section>

            <section className="pl-box pl-steps">
              <h3>Davolash bosqichlari</h3>
              <table className="crm-table">
                <thead><tr><th>#</th><th>Xizmat nomi</th><th>Tish(lar)</th><th>Soni</th><th>Narxi (so‘m)</th><th>Holat</th><th>Sana</th></tr></thead>
                <tbody>
                  {plan.steps.length === 0 ? <tr><td colSpan={7} className="crm-muted">Bosqich yo‘q</td></tr> : null}
                  {plan.steps.map((item, index) => (
                    <tr key={item.id}><td className="num">{index + 1}</td><td>{item.name}</td><td>{item.teeth}</td><td>{item.count}</td><td>{formatGroupedNumber(item.price)}</td><td><span className={`crm-pill ${item.status}`}>{stepLabel[item.status]}</span></td><td>{item.date || "–"}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="pl-foot">
                <button type="button" className="crm-btn" data-testid="step-add" onClick={() => setStepOpen(true)}><Plus className="i" /> Bosqich qo‘shish</button>
                <p>Umumiy: <b>{formatMoney(total, "UZS")}</b></p>
              </div>
            </section>

            <section className="pl-box pl-pays">
              <div className="pl-summary-h">
                <h3>To‘lovlar</h3>
                <button type="button" className="crm-btn blue" data-testid="plan-pay" onClick={() => setPayOpen(true)}><Plus className="i" /> To‘lov qo‘shish</button>
              </div>
              <table className="crm-table">
                <thead><tr><th>Sana</th><th>Summa</th><th>Usul</th><th>Izoh</th></tr></thead>
                <tbody>
                  {plan.payments.length === 0 ? <tr><td colSpan={4} className="crm-muted">To‘lov yo‘q</td></tr> : null}
                  {plan.payments.map((item, index) => <tr key={`${index}-${item.date}`}><td>{item.date}</td><td>{formatGroupedNumber(item.amount)}</td><td><span className="pl-method">{item.method}</span></td><td>{item.note}</td></tr>)}
                </tbody>
              </table>
              <p className="pl-sum">Jami to‘langan: <b className="money-plus">{formatMoney(paid, "UZS")}</b></p>
              <p className="pl-sum">Qolgan: <b className="money-minus">{formatMoney(left, "UZS")}</b></p>
            </section>
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
            <div className="row"><button type="button" className="go" data-testid="plan-pay-save" onClick={() => { update(plan.id, (item) => ({ ...item, payments: [...item.payments, { date: todayDot(), amount: Number(pay.amount) || 0, method: pay.method, note: pay.note }] })); setPayOpen(false); }}>Saqlash</button></div>
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
            patients={patients}
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
                date: day && month && year ? `${day}.${month}.${year}` : todayDot(),
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
