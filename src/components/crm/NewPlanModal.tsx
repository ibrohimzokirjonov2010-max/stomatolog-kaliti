"use client";

import { useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import { CalendarDays, Clock, Eraser, GripVertical, Info, MoreVertical, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { ADULT_LOWER, ADULT_UPPER, BABY_LOWER, BABY_UPPER, shapeOf, toothFill } from "@/components/crm/desktop/ToothChart";
import { CmDate, CmDialog, CmError, CmField, CmPicker, CmSelect, digitsOf, isoToDot, validDot } from "@/components/crm/crm-form-kit";
import type { Patient, PlanStage, PlanStep, ToothState, TreatmentPlan } from "@/data/crm";
import { formatGroupedNumber } from "@/lib/format";
import { useCrmPatients } from "@/lib/use-crm-list";
import { tashkentDateParts } from "@/lib/tashkent-date";

/** Default price list for the service picker. A row keeps any price the doctor typed. */
export const PLAN_SERVICES: { name: string; price: number }[] = [
  { name: "Konsultatsiya", price: 250_000 },
  { name: "Professional gigiyena", price: 400_000 },
  { name: "Plomba (kompozit)", price: 450_000 },
  { name: "Endodontik davolash", price: 800_000 },
  { name: "Shtift qo‘yish", price: 500_000 },
  { name: "Krona (metallokeramika)", price: 1_800_000 },
  { name: "Krona (sirkoniy)", price: 2_800_000 },
  { name: "Implant (komplekt)", price: 7_500_000 },
  { name: "Tish olib tashlash", price: 300_000 },
  { name: "Ortodontik davolash", price: 3_000_000 },
];
const STATUSES: { value: TreatmentPlan["status"]; label: string; color: string }[] = [
  { value: "reja", label: "Reja qilingan", color: "#0F766E" },
  { value: "davom", label: "Davom etmoqda", color: "#f59e0b" },
  { value: "yakun", label: "Yakunlangan", color: "#16a34a" },
];
const DURATIONS = ["1 kun", "1 hafta", "1-2 hafta", "2-4 hafta", "1-2 oy", "2-3 oy", "3-6 oy"];
const DISCOUNTS = [0, 5, 10, 15, 20, 25, 30];
const STAGE_COLORS = ["#0F766E", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444"];
const LEGEND: { id: ToothState; label: string; mark?: "ring" | "dash" }[] = [
  { id: "soglom", label: "Sog‘lom tish", mark: "ring" },
  { id: "kariyes", label: "Karies" },
  { id: "plomba", label: "Plomba" },
  { id: "endo", label: "Endodontik davolash" },
  { id: "shtift", label: "Shtift" },
  { id: "koronka", label: "Krona" },
  { id: "implant", label: "Implant" },
  { id: "ekstraksiya", label: "Yo‘q tish", mark: "dash" },
];

type Row = { key: string; name: string; tooth: string; qty: number; price: number };

let rowSeq = 0;
function newRow(name = PLAN_SERVICES[0].name): Row {
  rowSeq += 1;
  return { key: `r${Date.now()}-${rowSeq}`, name, tooth: "", qty: 1, price: PLAN_SERVICES.find((item) => item.name === name)?.price ?? 0 };
}

function money(n: number) {
  return `${formatGroupedNumber(Math.round(n))} so‘m`;
}

/** Spreads the discount over the rows so the saved steps add up to the final sum exactly. */
function netTotals(rows: Row[], discount: number) {
  const gross = rows.map((row) => row.qty * row.price);
  const total = gross.reduce((sum, value) => sum + value, 0);
  const net = Math.round(total * (100 - discount) / 100);
  const out = gross.map((value) => Math.round(value * (100 - discount) / 100));
  const drift = net - out.reduce((sum, value) => sum + value, 0);
  if (out.length) out[out.length - 1] += drift;
  return out;
}

function ageOf(patient: Patient) {
  return patient.age ? `${patient.age} yosh` : "";
}

function ToothIcon({ small }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={small ? { transform: "scale(.78)" } : undefined}>
      <path d="M7 3.5c-2.2 0-3.5 1.8-3.5 4.2 0 2.3.9 3.6 1.4 5.6.6 2.3.8 7.2 2.6 7.2 1.6 0 1.4-4.6 2.3-6 .6-.9 1.8-.9 2.4 0 .9 1.4.7 6 2.3 6 1.8 0 2-4.9 2.6-7.2.5-2 1.4-3.3 1.4-5.6 0-2.4-1.3-4.2-3.5-4.2-1.9 0-2.9 1-5 1s-3.1-1-5-1Z" />
    </svg>
  );
}

/** One tooth drawn in the chart. Upper teeth: roots up, crown down (y 18–38); the lower jaw is mirrored. */
function ToothGlyph({ id, state, lower }: { id: string; state: ToothState; lower: boolean }) {
  const d = shapeOf(id, Number(id[0]) >= 5);
  const flip = lower ? "matrix(1 0 0 -1 0 40)" : undefined;
  const clip = `cmc-${id}`;
  const gone = state === "ekstraksiya";
  const color = toothFill[state];
  return (
    <svg viewBox="0 0 24 40" aria-hidden="true">
      <defs>
        <clipPath id={clip}><path d={d} /></clipPath>
      </defs>
      <g transform={flip}>
        <path d={d} fill={gone ? "none" : "#fbfcfe"} stroke={gone ? "#a8b4c2" : "#b9c6d4"} strokeWidth="1.1" strokeLinejoin="round" strokeDasharray={gone ? "2 1.6" : undefined} />
        {!gone ? (
          <g clipPath={`url(#${clip})`}>
            {state === "koronka" ? <rect x="0" y="17" width="24" height="23" fill={color} opacity=".85" /> : null}
            {state === "plomba" ? <ellipse cx="12" cy="31" rx="6" ry="5.5" fill={color} opacity=".9" /> : null}
            {state === "kariyes" ? <><ellipse cx="11" cy="31" rx="4.4" ry="3.6" fill="#5a3b2e" opacity=".75" /><ellipse cx="11" cy="31" rx="6" ry="5" fill="none" stroke={color} strokeWidth="1.2" /></> : null}
            {state === "endo" ? <><path d="M12 3V30" stroke={color} strokeWidth="2.6" strokeLinecap="round" /><rect x="0" y="22" width="24" height="18" fill={color} opacity=".25" /></> : null}
            {state === "shtift" ? <><path d="M12 6V28" stroke={color} strokeWidth="3" strokeLinecap="round" /><rect x="0" y="24" width="24" height="16" fill="#6b7280" opacity=".55" /></> : null}
            {state === "implant" ? (
              <>
                <rect x="0" y="0" width="24" height="18" fill="#eef2f6" />
                <path d="M8 3h8l-1 15H9Z" fill={color} />
                {[5, 8, 11, 14].map((y) => <path key={y} d={`M7.5 ${y}h9`} stroke="#64748b" strokeWidth=".9" />)}
                <rect x="0" y="18" width="24" height="22" fill="#a5d8f5" opacity=".7" />
              </>
            ) : null}
            <path d="M6.5 18.5Q12 21 17.5 18.5" fill="none" stroke="#d5deea" strokeWidth=".8" strokeLinecap="round" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}

export type PlanTemplate = { id: string; name: string; steps: Omit<PlanStep, "id" | "status" | "date">[] };

export function NewPlanModal({ onClose, onSave }: { onClose: () => void; onSave: (plan: TreatmentPlan, asTemplate: boolean) => void }) {
  const [patients] = useCrmPatients<Patient>();
  const { profile } = useDoctorProfile();
  const doctorName = profile?.fullName?.trim() || "Shifokor";
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<TreatmentPlan["status"]>("reja");
  const [date, setDate] = useState(() => isoToDot(tashkentDateParts().iso));
  const [baby, setBaby] = useState(false);
  const [brush, setBrush] = useState<ToothState>("plomba");
  const [teeth, setTeeth] = useState<Record<string, ToothState>>({});
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);
  const [discount, setDiscount] = useState(0);
  const [payMode, setPayMode] = useState<"full" | "stages">("full");
  const [stages, setStages] = useState<PlanStage[]>([]);
  const [stageForm, setStageForm] = useState<null | { id: string; name: string; services: string[]; duration: string }>(null);
  const [menu, setMenu] = useState("");
  const [drag, setDrag] = useState(-1);
  const [asTemplate, setAsTemplate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nets = useMemo(() => netTotals(rows, discount), [rows, discount]);
  const gross = rows.reduce((sum, row) => sum + row.qty * row.price, 0);
  const net = nets.reduce((sum, value) => sum + value, 0);
  const off = gross - net;
  const upper = baby ? BABY_UPPER : ADULT_UPPER;
  const lower = baby ? BABY_LOWER : ADULT_LOWER;
  const marked = Object.keys(teeth).filter((id) => teeth[id] !== "soglom");

  const people = patients.map((item) => ({ id: item.id, title: item.name, sub: [item.phone, ageOf(item)].filter(Boolean).join("  •  "), avatar: item.avatar }));
  const doctorOption = [{ id: "self", title: doctorName, sub: profile?.specialty || "Shifokor", avatar: profile?.avatarUrl }];

  function stageAmount(keys: string[]) {
    return rows.reduce((sum, row, index) => (keys.includes(row.key) ? sum + nets[index] : sum), 0);
  }
  function stageTeeth(keys: string[]) {
    return Array.from(new Set(rows.filter((row) => keys.includes(row.key) && row.tooth.trim()).flatMap((row) => row.tooth.split(/[\s,]+/).filter(Boolean)))).join(", ");
  }

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function paint(id: string) {
    setTeeth((prev) => {
      const next = { ...prev };
      if ((prev[id] ?? "soglom") === brush || brush === "soglom") delete next[id];
      else next[id] = brush;
      return next;
    });
  }

  function editRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    clearError("rows");
  }

  function pickService(index: number, name: string) {
    const listed = PLAN_SERVICES.find((item) => item.name === name);
    setRows((prev) => prev.map((row, i) => {
      if (i !== index) return row;
      const wasDefault = PLAN_SERVICES.some((item) => item.name === row.name && item.price === row.price) || row.price === 0;
      return { ...row, name, price: wasDefault && listed ? listed.price : row.price };
    }));
  }

  function removeRow(index: number) {
    const key = rows[index]?.key;
    setRows((prev) => prev.filter((_, i) => i !== index));
    setStages((prev) => prev.map((stage) => ({ ...stage, services: stage.services.filter((item) => item !== key) })));
  }

  function onDrop(event: DragEvent, to: number) {
    event.preventDefault();
    if (drag < 0 || drag === to) return setDrag(-1);
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(drag, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDrag(-1);
  }

  function saveStage() {
    if (!stageForm) return;
    if (!stageForm.name.trim() || stageForm.services.length === 0) {
      setErrors((prev) => ({ ...prev, stage: "Bosqich nomini yozing va kamida bitta xizmatni belgilang" }));
      return;
    }
    clearError("stage");
    const stage: PlanStage = { id: stageForm.id, name: stageForm.name.trim(), services: stageForm.services, duration: stageForm.duration, teeth: "", amount: 0 };
    setStages((prev) => (prev.some((item) => item.id === stage.id) ? prev.map((item) => (item.id === stage.id ? stage : item)) : [...prev, stage]));
    setStageForm(null);
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!patientId) next.patient = "Bemorni tanlang";
    if (!title.trim()) next.title = "Reja nomini kiriting";
    if (!validDot(date)) next.date = "Sana DD.MM.YYYY ko‘rinishida bo‘lsin";
    if (rows.length === 0) next.rows = "Kamida bitta xizmat qo‘shing";
    else if (rows.some((row) => !row.name || row.qty < 1 || row.price <= 0)) next.rows = "Har bir xizmatga soni va narxini kiriting";
    if (payMode === "stages" && stages.length === 0) next.stage = "“Bosqichlarga bo‘lish” uchun kamida bitta bosqich qo‘shing";
    setErrors(next);
    if (Object.keys(next).length) return;
    const id = `r-${Date.now()}`;
    const steps: PlanStep[] = rows.map((row, index) => ({
      id: `s-${id}-${index}`,
      name: row.name,
      teeth: row.tooth.trim() || "–",
      count: row.qty,
      price: nets[index],
      status: status === "yakun" ? "bajarildi" : "kutil",
      date: "",
    }));
    onSave({
      id,
      title: title.trim(),
      code: `R-${id.slice(-4)}`,
      date,
      status,
      doctor: doctorName,
      patientId,
      steps,
      payments: [],
      teeth: Object.fromEntries(Object.entries(teeth).filter(([, value]) => value !== "soglom")),
      discount,
      payMode,
      stages: stages.map((stage) => ({ ...stage, amount: stageAmount(stage.services), teeth: stageTeeth(stage.services) })),
    }, asTemplate);
  }

  const statusColor = STATUSES.find((item) => item.value === status)?.color ?? "#0F766E";

  return (
    <CmDialog
      testId="plan-modal"
      title="Yangi davolash rejasi"
      subtitle="Bemorga davolash rejasi tuzing va xizmatlarni qo‘shing"
      width={800}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cm-ghost" data-testid="plan-cancel" onClick={onClose}>Bekor qilish</button>
          <div className="cm-plan-foot">
            <button type="button" className="cm-go" data-testid="new-plan-save" onClick={submit}><CalendarDays /> Saqlash</button>
            <label className="cm-check"><input type="checkbox" data-testid="plan-template" checked={asTemplate} onChange={(event) => setAsTemplate(event.target.checked)} /> Shablon sifatida saqlash</label>
          </div>
        </>
      }
    >
      <div className="cm-plan-1">
        <CmField label="Bemor" req>
          <CmPicker
            label="Bemor"
            testId="plan-patient"
            value={patientId}
            options={people}
            placeholder="Bemorni tanlang"
            bad={Boolean(errors.patient)}
            empty={<>Bemorlar ro‘yxati bo‘sh. <Link href="/crm/bemorlar/yangi">Bemor qo‘shish</Link></>}
            onChange={(value) => { setPatientId(value); clearError("patient"); }}
          />
          <CmError text={errors.patient} />
        </CmField>
        <CmField label="Shifokor" req>
          <CmPicker label="Shifokor" value="self" options={doctorOption} placeholder="Shifokor" empty="" onChange={() => undefined} />
        </CmField>
      </div>
      <div className="cm-plan-2">
        <CmField label="Reja nomi" req>
          <input className={`cm-input${errors.title ? " bad" : ""}`} data-testid="new-plan" aria-label="Reja nomi" placeholder="Masalan: Implant va protez davolash rejasi" value={title} onChange={(event) => { setTitle(event.target.value); clearError("title"); }} />
          <CmError text={errors.title} />
        </CmField>
        <CmField label="Holati">
          <CmSelect label="Holati" testId="plan-status-new" value={status} options={STATUSES.map((item) => ({ value: item.value, label: item.label }))} icon={<i className="cm-dot" style={{ background: statusColor, margin: 0 }} />} onChange={(value) => setStatus(value as TreatmentPlan["status"])} />
        </CmField>
        <CmField label="Sanasi">
          <CmDate label="Sanasi" testId="plan-date" leadIcon value={date} bad={Boolean(errors.date)} onChange={(value) => { setDate(value); clearError("date"); }} />
          <CmError text={errors.date} />
        </CmField>
      </div>

      <div className="cm-plan-mid">
        <section className="cm-panel">
          <div className="cm-panel-h">
            <h3>Tishlar (FDI)</h3>
            <div className="cm-tools">
              <button type="button" className={baby ? "cm-tool" : "cm-tool on"} title="Doimiy tishlar" aria-label="Doimiy tishlar" aria-pressed={!baby} onClick={() => setBaby(false)}><ToothIcon /></button>
              <button type="button" className={baby ? "cm-tool on" : "cm-tool"} title="Sut tishlari" aria-label="Sut tishlari" aria-pressed={baby} data-testid="plan-baby-new" onClick={() => setBaby(true)}><ToothIcon small /></button>
              <button type="button" className={brush === "soglom" ? "cm-tool on" : "cm-tool"} title="O‘chirg‘ich: bosilgan tishni sog‘lom qiladi" aria-label="O‘chirg‘ich" aria-pressed={brush === "soglom"} onClick={() => setBrush("soglom")}><Eraser /></button>
              <button type="button" className="cm-tool" title="Barcha belgilarni tozalash" aria-label="Barcha belgilarni tozalash" disabled={marked.length === 0} onClick={() => setTeeth({})}><RotateCcw /></button>
            </div>
          </div>
          <div className="cm-chart">
            <div className="cm-jaws">
              <div className={baby ? "cm-jaw baby" : "cm-jaw"}>
                {upper.map((id) => (
                  <button key={id} type="button" className="cm-tooth" data-testid={`plan-tooth-${id}`} aria-label={`${id} tish: ${LEGEND.find((item) => item.id === (teeth[id] ?? "soglom"))?.label}`} onClick={() => paint(id)}>
                    <small>{id}</small>
                    <ToothGlyph id={id} state={teeth[id] ?? "soglom"} lower={false} />
                  </button>
                ))}
              </div>
              <div className="cm-mid"><span>O‘ng</span><span>Chap</span></div>
              <div className={baby ? "cm-jaw baby" : "cm-jaw"}>
                {lower.map((id) => (
                  <button key={id} type="button" className="cm-tooth" data-testid={`plan-tooth-${id}`} aria-label={`${id} tish: ${LEGEND.find((item) => item.id === (teeth[id] ?? "soglom"))?.label}`} onClick={() => paint(id)}>
                    <ToothGlyph id={id} state={teeth[id] ?? "soglom"} lower />
                    <small>{id}</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="cm-legend" role="radiogroup" aria-label="Tish holati">
              {LEGEND.map((item) => (
                <button key={item.id} type="button" role="radio" aria-checked={brush === item.id} className={brush === item.id ? "on" : undefined} onClick={() => setBrush(item.id)}>
                  <i className={item.mark} style={item.mark ? undefined : { background: toothFill[item.id] }} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <p className="cm-chart-note">Holatni tanlang va tishni bosing.{marked.length ? ` Belgilangan: ${marked.join(", ")}` : ""}</p>
        </section>

        <div className="cm-fin">
          <section className="cm-panel">
            <div className="cm-panel-h"><h3>Moliyaviy hisob</h3></div>
            <dl>
              <div><dt>Xizmatlar jami</dt><dd data-testid="plan-gross">{money(gross)}</dd></div>
              <div>
                <dt>Chegirma</dt>
                <dd className="cm-disc">
                  <CmSelect label="Chegirma" testId="plan-discount" value={String(discount)} options={DISCOUNTS.map((item) => ({ value: String(item), label: `${item}%` }))} onChange={(value) => setDiscount(Number(value))} />
                  <span className="minus">{off ? `− ${money(off)}` : money(0)}</span>
                </dd>
              </div>
              <div><dt className="net">Yakuniy summa</dt><dd className="net" data-testid="plan-net">{money(net)}</dd></div>
            </dl>
          </section>
          <section className="cm-panel">
            <div className="cm-panel-h"><h3>To‘lov rejasi</h3></div>
            <div className="cm-tabs" role="group" aria-label="To‘lov rejasi">
              <button type="button" className={payMode === "full" ? "on" : undefined} aria-pressed={payMode === "full"} onClick={() => setPayMode("full")}>To‘liq to‘lov</button>
              <button type="button" className={payMode === "stages" ? "on" : undefined} aria-pressed={payMode === "stages"} data-testid="plan-split" onClick={() => setPayMode("stages")}>Bosqichlarga bo‘lish</button>
            </div>
            <p className="cm-info"><Info />{payMode === "full" ? "To‘liq summa bir martada to‘lanadi." : stages.length ? `${stages.length} bosqichda to‘lanadi: har bosqich boshlanishida.` : "Pastda bosqich qo‘shing: har bosqich alohida to‘lanadi."}</p>
          </section>
        </div>
      </div>

      <div className="cm-plan-bot">
        <section>
          <div className="cm-panel-h">
            <h3>Xizmatlar ro‘yxati</h3>
            <button type="button" className="cm-mini" data-testid="plan-add-row" onClick={() => { setRows((prev) => [...prev, newRow()]); clearError("rows"); }}><Plus /> Xizmat qo‘shish</button>
          </div>
          <div className="cm-svc-wrap">
            <table className="cm-svc">
              <thead>
                <tr><th aria-label="Tartib" /><th>#</th><th>Xizmat</th><th style={{ width: 46 }}>Tish</th><th style={{ width: 46 }}>Soni</th><th style={{ width: 86 }}>Narx (so‘m)</th><th style={{ width: 86 }}>Jami (so‘m)</th><th style={{ width: 40 }}>Amal</th></tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.key} className={drag === index ? "drag" : undefined} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, index)}>
                    <td className="grip" draggable onDragStart={() => setDrag(index)} onDragEnd={() => setDrag(-1)} title="Sudrab joyini o‘zgartiring"><GripVertical /></td>
                    <td className="n">{index + 1}</td>
                    <td><CmSelect label={`Xizmat ${index + 1}`} value={row.name} options={PLAN_SERVICES.some((item) => item.name === row.name) ? PLAN_SERVICES.map((item) => item.name) : [row.name, ...PLAN_SERVICES.map((item) => item.name)]} onChange={(value) => pickService(index, value)} /></td>
                    <td><input className="cm-input" aria-label={`Tish ${index + 1}`} placeholder="–" value={row.tooth} onChange={(event) => editRow(index, { tooth: event.target.value.replace(/[^\d,\s]/g, "").slice(0, 20) })} /></td>
                    <td><input className="cm-input" aria-label={`Soni ${index + 1}`} inputMode="numeric" value={row.qty || ""} onChange={(event) => editRow(index, { qty: Math.min(99, Number(digitsOf(event.target.value)) || 0) })} /></td>
                    <td><input className="cm-input" aria-label={`Narx ${index + 1}`} inputMode="numeric" value={row.price ? formatGroupedNumber(row.price) : ""} onChange={(event) => editRow(index, { price: Math.min(999_999_999, Number(digitsOf(event.target.value)) || 0) })} /></td>
                    <td><input className="cm-input ro" aria-label={`Jami ${index + 1}`} readOnly tabIndex={-1} value={formatGroupedNumber(row.qty * row.price)} /></td>
                    <td className="del"><button type="button" aria-label={`${index + 1}-xizmatni o‘chirish`} onClick={() => removeRow(index)}><Trash2 /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="cm-svc-empty">Xizmat yo‘q. “Xizmat qo‘shish” tugmasini bosing.</p> : null}
          </div>
          <CmError text={errors.rows} />
        </section>

        <section>
          <div className="cm-panel-h">
            <h3>Reja bosqichlari <i>(ixtiyoriy)</i></h3>
            <button type="button" className="cm-mini" data-testid="plan-add-stage" disabled={rows.length === 0} onClick={() => setStageForm({ id: `st-${Date.now()}`, name: "", services: [], duration: DURATIONS[2] })}><Plus /> Bosqich qo‘shish</button>
          </div>
          <div className="cm-stages">
            {stages.map((stage, index) => (
              <article key={stage.id} className="cm-stage" data-testid="plan-stage">
                <span className="no" style={{ background: STAGE_COLORS[index % STAGE_COLORS.length] }}>{index + 1}</span>
                <div className="cm-stage-h">
                  <b>Bosqich</b>
                  <strong>{money(stageAmount(stage.services))}</strong>
                  <button type="button" aria-label={`${index + 1}-bosqich: amallar`} aria-expanded={menu === stage.id} onClick={() => setMenu(menu === stage.id ? "" : stage.id)}><MoreVertical /></button>
                </div>
                <p>{stage.name}</p>
                <div className="cm-stage-f">
                  <span><ToothIcon small /> Tishlar: {stageTeeth(stage.services) || "–"}</span>
                  <span><Clock /> {stage.duration}</span>
                </div>
                {menu === stage.id ? (
                  <div className="cm-menu">
                    <button type="button" onClick={() => { setStageForm({ id: stage.id, name: stage.name, services: stage.services, duration: stage.duration }); setMenu(""); }}>Tahrirlash</button>
                    <button type="button" className="red" onClick={() => { setStages((prev) => prev.filter((item) => item.id !== stage.id)); setMenu(""); }}>O‘chirish</button>
                  </div>
                ) : null}
              </article>
            ))}
            {stageForm ? (
              <div className="cm-stage-form" data-testid="plan-stage-form">
                <input className="cm-input" aria-label="Bosqich nomi" placeholder="Masalan: Endo davolash" value={stageForm.name} onChange={(event) => setStageForm({ ...stageForm, name: event.target.value })} />
                <div className="cm-stage-svcs" role="group" aria-label="Bosqichdagi xizmatlar">
                  {rows.map((row, index) => {
                    const on = stageForm.services.includes(row.key);
                    return (
                      <button key={row.key} type="button" className={on ? "on" : undefined} aria-pressed={on} onClick={() => setStageForm({ ...stageForm, services: on ? stageForm.services.filter((item) => item !== row.key) : [...stageForm.services, row.key] })}>
                        {index + 1}. {row.name}
                      </button>
                    );
                  })}
                </div>
                <CmSelect label="Davomiyligi" value={stageForm.duration} options={DURATIONS} onChange={(value) => setStageForm({ ...stageForm, duration: value })} />
                <div className="cm-stage-acts">
                  <button type="button" className="cm-ghost" onClick={() => { setStageForm(null); clearError("stage"); }}>Bekor</button>
                  <button type="button" className="cm-mini" data-testid="plan-stage-save" onClick={saveStage}>Qo‘shish</button>
                </div>
              </div>
            ) : null}
            {stages.length === 0 && !stageForm ? <p className="cm-svc-empty" style={{ border: "1px dashed #dfe6ee", borderRadius: 8 }}>Xizmatlarni bosqichlarga ajrating: masalan, avval endo davolash, keyin implant.</p> : null}
          </div>
          <CmError text={errors.stage} />
        </section>
      </div>
    </CmDialog>
  );
}
