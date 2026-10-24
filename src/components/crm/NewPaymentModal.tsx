"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Banknote, Check, CreditCard, FileText, Info, Landmark } from "lucide-react";
import { CmDate, CmDialog, CmError, CmField, CmPicker, CmSwitch, digitsOf, isoToDot, validDot } from "@/components/crm/crm-form-kit";
import type { ClinicPayment, Patient, PayMethod, TreatmentPlan } from "@/data/crm";
import { formatGroupedNumber } from "@/lib/format";
import { useCrmPatients } from "@/lib/use-crm-list";
import { tashkentDateParts } from "@/lib/tashkent-date";

function ClickLogo() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="#0F766E" />
      <path d="M18.6 10.2a6 6 0 1 0 0 7.6" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}

function PaymeLogo() {
  return (
    <svg viewBox="0 0 28 28" aria-hidden="true">
      <rect x="2" y="2" width="24" height="24" rx="5" fill="#0F766E" />
      <path d="M10 21V7h5a4.3 4.3 0 0 1 0 8.6h-5" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

const METHODS: { id: PayMethod; label: string; logo: ReactNode }[] = [
  { id: "Naqd", label: "Naqd", logo: <Banknote style={{ color: "#16a34a" }} /> },
  { id: "Karta", label: "Karta", logo: <CreditCard style={{ color: "#0F766E" }} /> },
  { id: "Click", label: "Click", logo: <ClickLogo /> },
  { id: "Payme", label: "Payme", logo: <PaymeLogo /> },
  { id: "O‘tkazma", label: "O‘tkazma", logo: <Landmark style={{ color: "#111827" }} /> },
];

function money(n: number) {
  return `${formatGroupedNumber(Math.round(n))} so‘m`;
}

export function planTotals(plan: TreatmentPlan | undefined) {
  if (!plan) return { total: 0, paid: 0, debt: 0 };
  const total = plan.steps.reduce((sum, step) => sum + step.price, 0);
  const paid = plan.payments.reduce((sum, pay) => sum + pay.amount, 0);
  return { total, paid, debt: Math.max(0, total - paid) };
}

function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 3.5c-2.2 0-3.5 1.8-3.5 4.2 0 2.3.9 3.6 1.4 5.6.6 2.3.8 7.2 2.6 7.2 1.6 0 1.4-4.6 2.3-6 .6-.9 1.8-.9 2.4 0 .9 1.4.7 6 2.3 6 1.8 0 2-4.9 2.6-7.2.5-2 1.4-3.3 1.4-5.6 0-2.4-1.3-4.2-3.5-4.2-1.9 0-2.9 1-5 1s-3.1-1-5-1Z" />
    </svg>
  );
}

export function NewPaymentModal({
  plans,
  initialMethod,
  onClose,
  onSave,
}: {
  plans: TreatmentPlan[];
  initialMethod?: PayMethod;
  onClose: () => void;
  onSave: (payment: ClinicPayment) => void;
}) {
  const [patients] = useCrmPatients<Patient>();
  const [patientId, setPatientId] = useState("");
  const [planId, setPlanId] = useState("");
  const [amount, setAmount] = useState(0);
  const [typed, setTyped] = useState(false);
  const [date, setDate] = useState(() => isoToDot(tashkentDateParts().iso));
  const [method, setMethod] = useState<PayMethod>(initialMethod ?? "Naqd");
  const [receipt, setReceipt] = useState(true);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patient = patients.find((item) => item.id === patientId);
  const own = useMemo(() => plans.filter((plan) => plan.patientId === patientId), [patientId, plans]);
  const plan = own.find((item) => item.id === planId);
  const sums = planTotals(plan);

  const people = patients.map((item) => ({ id: item.id, title: item.name, sub: [item.phone, item.age ? `${item.age} yosh` : ""].filter(Boolean).join("  •  "), avatar: item.avatar }));
  const planOptions = own.map((item) => {
    const t = planTotals(item);
    return { id: item.id, title: item.title, sub: `${item.date}  •  ${money(t.total)}${t.debt ? "" : "  •  to‘langan"}`, icon: <PlanIcon /> };
  });

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function choosePatient(id: string) {
    setPatientId(id);
    clearError("patient");
    const open = plans.filter((item) => item.patientId === id).find((item) => planTotals(item).debt > 0);
    setPlanId(open?.id ?? "");
    if (!typed) setAmount(open ? planTotals(open).debt : 0);
  }

  function choosePlan(id: string) {
    setPlanId(id);
    clearError("amount");
    if (!typed) setAmount(planTotals(plans.find((item) => item.id === id)).debt);
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!patient) next.patient = "Bemorni tanlang";
    if (!amount) next.amount = "Summani kiriting";
    else if (plan && sums.debt > 0 && amount > sums.debt) next.amount = `Summa qarzdan oshmasin (${money(sums.debt)})`;
    if (!validDot(date)) next.date = "Sana DD.MM.YYYY ko‘rinishida bo‘lsin";
    setErrors(next);
    if (Object.keys(next).length || !patient) return;
    onSave({
      id: `pay-user-${Date.now()}`,
      date,
      patient: patient.name,
      avatar: patient.avatar ?? "",
      service: plan ? plan.title : "To‘lov",
      amount,
      method,
      status: plan && amount < sums.debt ? "qisman" : "tolandi",
      planId: plan?.id,
      note: note.trim(),
      receipt,
    });
  }

  return (
    <CmDialog
      testId="pay-modal"
      title="Yangi to‘lov qo‘shish"
      subtitle="Bemor to‘lovini kiriting"
      width={1000}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cm-ghost" data-testid="pay-cancel" onClick={onClose}>Bekor qilish</button>
          <button type="button" className="cm-go" data-testid="pay-save" style={{ minWidth: 117 }} onClick={submit}><Check /> Saqlash</button>
        </>
      }
    >
      <div className="cm-grid">
        <CmField label="Bemor" req>
          <CmPicker
            label="Bemor"
            testId="pay-patient"
            value={patientId}
            options={people}
            placeholder="Bemorni tanlang"
            bad={Boolean(errors.patient)}
            empty={<>Bemorlar ro‘yxati bo‘sh. <Link href="/crm/bemorlar/yangi">Bemor qo‘shish</Link></>}
            onChange={choosePatient}
          />
          <CmError text={errors.patient} />
        </CmField>
        <CmField label="Davolash rejasi">
          <CmPicker
            label="Davolash rejasi"
            testId="pay-plan"
            value={planId}
            options={planOptions}
            placeholder={patient ? (own.length ? "Rejani tanlang" : "Bu bemorda reja yo‘q") : "Avval bemorni tanlang"}
            disabled={!patient}
            empty={<>Bu bemorda davolash rejasi yo‘q. <Link href="/crm/davolash-rejalari/yangi">Reja tuzish</Link></>}
            onChange={choosePlan}
          />
        </CmField>
      </div>

      {plan ? (
        <div className="cm-kpis" data-testid="pay-kpis">
          <div><small>Reja summasi</small><b>{money(sums.total)}</b></div>
          <div className="paid"><small>To‘langan</small><b>{money(sums.paid)}</b></div>
          <div className="debt"><small>Qarz</small><b data-testid="pay-debt">{money(sums.debt)}</b></div>
        </div>
      ) : (
        <div className="cm-kpis none"><p>{patient ? "Reja tanlanmasa, to‘lov alohida yoziladi va hech bir rejaning qarzini kamaytirmaydi." : "Bemorni tanlang: uning davolash rejasi va qarzi shu yerda ko‘rinadi."}</p></div>
      )}

      <div className="cm-pay-row">
        <CmField label="Summa" req>
          <span className={`cm-ctl cm-sum${errors.amount ? " bad" : ""}`}>
            <input data-testid="pay-amount" aria-label="Summa" inputMode="numeric" placeholder="0" value={amount ? formatGroupedNumber(amount) : ""} onChange={(event) => { setAmount(Math.min(9_999_999_999, Number(digitsOf(event.target.value)) || 0)); setTyped(true); clearError("amount"); }} />
            <span className="cm-suffix">so‘m</span>
          </span>
          <CmError text={errors.amount} />
        </CmField>
        <CmField label="Sana" req>
          <CmDate label="Sana" testId="pay-date" leadIcon value={date} bad={Boolean(errors.date)} onChange={(value) => { setDate(value); clearError("date"); }} />
          <CmError text={errors.date} />
        </CmField>
      </div>

      <div className="cm-field" style={{ marginTop: 14 }}>
        <span className="cm-label">To‘lov usuli<em> *</em></span>
        <div className="cm-methods" role="radiogroup" aria-label="To‘lov usuli">
          {METHODS.map((item) => (
            <button key={item.id} type="button" role="radio" aria-checked={method === item.id} data-testid={`pay-method-${item.label}`} className={method === item.id ? "cm-method on" : "cm-method"} onClick={() => setMethod(item.id)}>
              {method === item.id ? <span className="tick"><Check /></span> : null}
              <span className="logo">{item.logo}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="cm-info"><Info />Qarz summa to‘liq yopilsa, davolash rejasi avtomatik ravishda “Yakunlangan” holatiga o‘tadi.</p>

      <div className="cm-toggle">
        <CmSwitch on={receipt} onChange={setReceipt} label="Chek chiqarish" testId="pay-receipt" />
        <div>
          <b>Chek chiqarish</b>
          <small>Saqlangandan keyin to‘lov cheki PDF ko‘rinishida yuklab olinadi</small>
        </div>
      </div>

      <div className="cm-field" style={{ marginTop: 12 }}>
        <span className="cm-label">Izoh</span>
        <div className="cm-area-ic">
          <FileText />
          <textarea className="cm-area" aria-label="Izoh" maxLength={300} placeholder="To‘lov haqida qo‘shimcha ma’lumot (ixtiyoriy)..." value={note} onChange={(event) => setNote(event.target.value.slice(0, 300))} />
        </div>
        <span className="cm-count">{note.length}/300</span>
      </div>
    </CmDialog>
  );
}
