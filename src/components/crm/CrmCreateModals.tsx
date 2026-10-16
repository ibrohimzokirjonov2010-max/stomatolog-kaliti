"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { PayMethod } from "@/data/crm";
import { formatGroupedNumber } from "@/lib/format";
import "./new-patient.css";
import "./crm-create.css";

const SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
const DOW = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const SERVICES = ["Konsultatsiya", "Endodontik davolash", "Shtift qo‘yish", "Implant (komplekt)", "Professional gigiyena", "Ortodontik davolash"];
const PAYS: PayMethod[] = ["Karta", "Click", "Payme", "O‘tkazma"];

function useLock(onClose: () => void) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
}

function Overlay({ testId, title, wide, onClose, children }: { testId: string; title: string; wide?: boolean; onClose: () => void; children: ReactNode }) {
  useLock(onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="px-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={wide ? "px-dialog wide" : "px-dialog"} role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function Head({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <header className="px-head">
      <div><h2>{title}</h2><p className="sub">{subtitle}</p></div>
      <button type="button" className="px-x" aria-label="Yopish" onClick={onClose}>×</button>
    </header>
  );
}

function money(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

function addMinutes(start: string, minutes: number) {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export type ApptDraft = {
  patient: string;
  service: string;
  doctorId: string;
  room: string;
  date: string;
  start: string;
  end: string;
  note: string;
};

export function NewAppointmentModal({ initial, onClose, onSave }: { initial: ApptDraft; onClose: () => void; onSave: (draft: ApptDraft) => void }) {
  const [patient, setPatient] = useState(initial.patient || "Malika Karimova");
  const [picked, setPicked] = useState(true);
  const [query, setQuery] = useState("");
  const [service, setService] = useState(initial.service || "Konsultatsiya");
  const [room, setRoom] = useState("Kreslo 1");
  const [day, setDay] = useState(16);
  const [start, setStart] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [sms, setSms] = useState(true);
  const [note, setNote] = useState(initial.note || "");
  const [error, setError] = useState("");
  const cells = useMemo(() => {
    const first = new Date(2024, 9, 1).getDay();
    const lead = (first + 6) % 7;
    const days = Array.from({ length: 31 }, (_, index) => index + 1);
    return [...Array.from({ length: lead }, (_, index) => -(30 - lead + index + 1)), ...days, ...Array.from({ length: (7 - ((lead + 31) % 7)) % 7 }, (_, index) => 100 + index)];
  }, []);

  function save() {
    const name = patient.trim();
    if (!name) { setError("Bemorni tanlang"); return; }
    onSave({
      patient: name,
      service,
      doctorId: "ibrohim",
      room,
      date: `2024-10-${String(day).padStart(2, "0")}`,
      start,
      end: addMinutes(start, duration),
      note: sms ? note : `${note}`.trim(),
    });
  }

  return (
    <Overlay testId="appt-modal" title="Yangi uchrashuv" onClose={onClose}>
      <Head title="Yangi uchrashuv" subtitle="Uchrashuv ma’lumotlarini kiriting" onClose={onClose} />
      <div className="px-grid">
        <div>
          <span className="px-label">Bemor</span>
          {picked ? (
            <div className="px-card">
              <img src="/img/designs/malika.png" alt="" />
              <div><b>Malika Karimova</b><small>+998 90 123 45 67 · 28 yosh</small></div>
              <button type="button" aria-label="Olib tashlash" onClick={() => setPicked(false)}>×</button>
            </div>
          ) : (
            <input className="px-field" data-testid="appt-patient" placeholder="Bemorni qidirish..." value={query} onChange={(event) => { setQuery(event.target.value); setPatient(event.target.value); }} />
          )}
        </div>
        <div>
          <span className="px-label">Shifokor</span>
          <div className="px-card"><div><b>Dr. Ibrohim</b><small>Stomatolog</small></div></div>
        </div>
        <label><span className="px-label">Kreslo</span>
          <select className="px-select" aria-label="Kreslo" value={room} onChange={(event) => setRoom(event.target.value)}>
            {["Kreslo 1", "Kreslo 2", "Kreslo 3"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label><span className="px-label">Xizmat</span>
          <select className="px-select" aria-label="Xizmat" value={service} onChange={(event) => setService(event.target.value)}>
            {SERVICES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div>
          <span className="px-label">Sana</span>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "calc(.3 * var(--u))", fontWeight: 800, fontSize: "calc(.72 * var(--u))" }}><span>‹</span> Oktabr 2024 <span>›</span></div>
          <div className="px-cal">
            {DOW.map((item) => <span key={item} className="dow">{item}</span>)}
            {cells.map((item) => item < 1 || item > 31
              ? <span key={item} className="mute">{item < 0 ? Math.abs(item) : item - 99}</span>
              : <button key={item} type="button" className={item === day ? "on" : undefined} onClick={() => setDay(item)}>{item}</button>)}
          </div>
        </div>
        <div>
          <span className="px-label">Vaqt</span>
          <div className="px-times">
            {SLOTS.map((item) => <button key={item} type="button" className={item === start ? "on" : undefined} onClick={() => setStart(item)}>{item}</button>)}
          </div>
        </div>
        <label><span className="px-label">Davomiyligi</span>
          <select className="px-select" aria-label="Davomiyligi" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
            {[15, 30, 45, 60, 90].map((item) => <option key={item} value={item}>{item} daqiqa</option>)}
          </select>
        </label>
        <div className="px-toggle">
          <span>Bemorga SMS eslatma yuborish</span>
          <button type="button" className={sms ? "px-switch on" : "px-switch"} aria-pressed={sms} data-testid="appt-sms" onClick={() => setSms((value) => !value)}><i /></button>
        </div>
      </div>
      <label style={{ display: "block", marginTop: "calc(.55 * var(--u))" }}>
        <span className="px-label">Izoh</span>
        <textarea className="px-area" aria-label="Izoh" maxLength={500} placeholder="Qo‘shimcha ma’lumot (ixtiyoriy)..." value={note} onChange={(event) => setNote(event.target.value)} />
        <div className="px-count">{note.length}/500</div>
      </label>
      {error ? <p className="px-error">{error}</p> : null}
      <div className="px-foot">
        <button type="button" className="ghost" onClick={onClose}>Bekor qilish</button>
        <button type="button" className="go" data-testid="appt-save" onClick={save}>Saqlash</button>
      </div>
    </Overlay>
  );
}

export type PlanDraft = {
  title: string;
  patientId: string;
  doctor: string;
  date: string;
  teeth: string;
  amount: string;
  note: string;
};

type ServiceRow = { name: string; tooth: string; qty: number; price: number };

const PLAN_ROWS: ServiceRow[] = [
  { name: "Konsultatsiya", tooth: "–", qty: 1, price: 250000 },
  { name: "Endodontik davolash", tooth: "11", qty: 1, price: 800000 },
  { name: "Shtift qo‘yish", tooth: "14", qty: 1, price: 500000 },
  { name: "Implant (komplekt)", tooth: "31", qty: 1, price: 7500000 },
];
const PLAN_TEETH: Record<number, string> = { 11: "end", 14: "sht", 31: "imp", 16: "plo", 26: "plo" };

export function NewPlanModal({ patients, initial, onClose, onSave }: { patients: { id: string; name: string }[]; initial: PlanDraft; onClose: () => void; onSave: (draft: PlanDraft) => void }) {
  const [title, setTitle] = useState(initial.title || "Implant va protez davolash rejasi");
  const [patientId, setPatientId] = useState(initial.patientId || patients[0]?.id || "");
  const [doctor, setDoctor] = useState("Dr. Ibrohim");
  const [status, setStatus] = useState("Reja qilingan");
  const [date, setDate] = useState("14.10.2024");
  const [rows, setRows] = useState(PLAN_ROWS);
  const [discount, setDiscount] = useState(5);
  const [split, setSplit] = useState(true);
  const [picked, setPicked] = useState<number[]>([11, 14, 31]);
  const [error, setError] = useState("");
  const [template, setTemplate] = useState(false);
  const gross = rows.reduce((sum, row) => sum + row.price * row.qty, 0);
  const off = Math.round(gross * discount / 100);
  const net = gross - off;

  function save() {
    if (!title.trim()) { setError("Reja nomini kiriting"); return; }
    if (!patientId) { setError("Bemorni tanlang"); return; }
    const [d, m, y] = date.split(".");
    onSave({
      title: title.trim(),
      patientId,
      doctor,
      date: y && m && d ? `${y}-${m}-${d}` : "2024-10-14",
      teeth: picked.join(", "),
      amount: String(net),
      note: template ? "Shablon sifatida saqlandi" : status,
    });
  }

  return (
    <Overlay testId="plan-modal" title="Yangi davolash rejasi" wide onClose={onClose}>
      <Head title="Yangi davolash rejasi" subtitle="Bemorga davolash rejasi tuzing va xizmatlarni qo‘shing" onClose={onClose} />
      <div className="px-grid">
        <div>
          <span className="px-label">Bemor *</span>
          <div className="px-card">
            <img src="/img/designs/malika.png" alt="" />
            <div><b>Malika Karimova</b><small>+998 90 123 45 67 · 28 yosh</small></div>
            <select aria-label="Bemor" value={patientId} onChange={(event) => setPatientId(event.target.value)} style={{ marginLeft: "auto" }}>
              <option value={patientId}>Malika Karimova</option>
              {patients.filter((item) => item.id !== patientId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <span className="px-label">Shifokor *</span>
          <input className="px-field" aria-label="Shifokor" value={doctor} onChange={(event) => setDoctor(event.target.value)} />
        </div>
        <label><span className="px-label">Reja nomi *</span>
          <input className="px-field" data-testid="new-plan" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <div className="px-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <label><span className="px-label">Holati</span>
            <select className="px-select" aria-label="Holati" value={status} onChange={(event) => setStatus(event.target.value)}>
              {["Reja qilingan", "Jarayonda", "Yakunlangan"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label><span className="px-label">Sanasi</span>
            <input className="px-field" aria-label="Sana" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
        </div>
      </div>
      <div className="px-split" style={{ marginTop: "calc(.6 * var(--u))" }}>
        <div>
          <span className="px-label">Tishlar (FDI)</span>
          <div className="pxp-arch" style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "calc(.12 * var(--u))" }}>
            {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((n) => (
              <button key={n} type="button" className={`px-tooth ${picked.includes(n) ? "on" : ""} ${PLAN_TEETH[n] || ""}`} onClick={() => setPicked((prev) => prev.includes(n) ? prev.filter((item) => item !== n) : [...prev, n])}>{n}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "calc(.12 * var(--u))", marginTop: "calc(.2 * var(--u))" }}>
            {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map((n) => (
              <button key={n} type="button" className={`px-tooth ${picked.includes(n) ? "on" : ""} ${PLAN_TEETH[n] || ""}`} onClick={() => setPicked((prev) => prev.includes(n) ? prev.filter((item) => item !== n) : [...prev, n])}>{n}</button>
            ))}
          </div>
          <div className="pxp-legend" style={{ display: "flex", flexWrap: "wrap", gap: "calc(.35 * var(--u))", marginTop: "calc(.35 * var(--u))", fontSize: "calc(.58 * var(--u))" }}>
            {[["#fff", "Sog‘lom"], ["#3b82f6", "Plomba"], ["#f59e0b", "Endodontik"], ["#8b5cf6", "Shtift"], ["#0ea5e9", "Krona"], ["#0198a4", "Implant"], ["#e8eef4", "Yo‘q tish"]].map(([color, label]) => <span key={label}><i style={{ background: color, width: 8, height: 8, display: "inline-block", marginRight: 4, border: "1px solid #ddd" }} />{label}</span>)}
          </div>
        </div>
        <div>
          <span className="px-label">Moliyaviy hisob</span>
          <div className="px-kpis" style={{ gridTemplateColumns: "1fr" }}>
            <article><small>Xizmatlar jami</small><b>{money(gross)}</b></article>
            <article><small>Chegirma</small>
              <select aria-label="Chegirma" value={discount} onChange={(event) => setDiscount(Number(event.target.value))}>
                {[0, 5, 10, 15].map((item) => <option key={item} value={item}>{item}%</option>)}
              </select>
              <b>− {money(off)}</b>
            </article>
            <article><small>Yakuniy summa</small><b>{money(net)}</b></article>
          </div>
          <div className="px-label" style={{ marginTop: "calc(.45 * var(--u))" }}>To‘lov rejasi</div>
          <div className="px-times">
            <button type="button" className={!split ? "on" : undefined} onClick={() => setSplit(false)}>To‘liq to‘lov</button>
            <button type="button" className={split ? "on" : undefined} onClick={() => setSplit(true)}>Bosqichlarga bo‘lish</button>
          </div>
        </div>
      </div>
      <div className="px-split" style={{ marginTop: "calc(.6 * var(--u))" }}>
        <div>
          <span className="px-label">Xizmatlar ro‘yxati</span>
          <table className="px-table">
            <thead><tr><th>#</th><th>Xizmat</th><th>Tish</th><th>Soni</th><th>Narx</th><th>Jami</th><th /></tr></thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.name}>
                  <td>{index + 1}</td>
                  <td><select aria-label={`Xizmat ${index + 1}`} value={row.name} onChange={(event) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, name: event.target.value } : item))}>{SERVICES.map((item) => <option key={item}>{item}</option>)}</select></td>
                  <td><input aria-label={`Tish ${index + 1}`} value={row.tooth} onChange={(event) => setRows((prev) => prev.map((item, i) => i === index ? { ...item, tooth: event.target.value } : item))} /></td>
                  <td>{row.qty}</td>
                  <td>{formatGroupedNumber(row.price)}</td>
                  <td>{formatGroupedNumber(row.price * row.qty)}</td>
                  <td><button type="button" aria-label="O‘chirish" onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" style={{ color: "#0198a4", fontWeight: 800, marginTop: "calc(.3 * var(--u))", fontSize: "calc(.66 * var(--u))" }} onClick={() => setRows((prev) => [...prev, { name: "Konsultatsiya", tooth: "–", qty: 1, price: 0 }])}>+ Xizmat qo‘shish</button>
        </div>
        {split ? (
          <div>
            <span className="px-label">Reja bosqichlari (ixtiyoriy)</span>
            <article className="px-card" style={{ marginBottom: "calc(.35 * var(--u))" }}><div><b>Bosqich 1 · {money(1050000)}</b><small>Endo davolash · Tishlar: 11, 14 · 1–2 hafta</small></div></article>
            <article className="px-card"><div><b>Bosqich 2 · {money(7547500)}</b><small>Implant va protez · Tishlar: 31</small></div></article>
          </div>
        ) : null}
      </div>
      {error ? <p className="px-error">{error}</p> : null}
      <div className="px-foot">
        <button type="button" className="ghost" onClick={onClose}>Bekor qilish</button>
        <button type="button" className="soft" data-testid="plan-template" onClick={() => setTemplate(true)}>Shablon sifatida saqlash</button>
        <button type="button" className="go" data-testid="new-plan-save" onClick={save}>Saqlash</button>
      </div>
    </Overlay>
  );
}

export type PayDraft = {
  patient: string;
  service: string;
  amount: string;
  method: PayMethod;
  date: string;
  note: string;
};

export function NewPaymentModal({ initial, onClose, onSave }: { initial: PayDraft; onClose: () => void; onSave: (draft: PayDraft) => void }) {
  const [patient, setPatient] = useState(initial.patient || "Malika Karimova");
  const [amount, setAmount] = useState(initial.amount && initial.amount !== "200000" ? initial.amount : "1050000");
  const [date, setDate] = useState("14.10.2024");
  const [method, setMethod] = useState<PayMethod>(PAYS.includes(initial.method) ? initial.method : "Click");
  const [receipt, setReceipt] = useState(true);
  const [note, setNote] = useState(initial.note || "");
  const [error, setError] = useState("");

  function save() {
    if (!patient.trim()) { setError("Bemorni kiriting"); return; }
    if (!Number(amount)) { setError("Summani kiriting"); return; }
    const [d, m, y] = date.split(".");
    onSave({
      patient: patient.trim(),
      service: receipt ? "Implant va protez rejasi · chek" : "Implant va protez rejasi",
      amount: amount.replace(/\D/g, ""),
      method,
      date: y && m && d ? `${y}-${m}-${d}` : "2024-10-14",
      note,
    });
  }

  return (
    <Overlay testId="pay-modal" title="Yangi to‘lov qo‘shish" onClose={onClose}>
      <Head title="Yangi to‘lov qo‘shish" subtitle="Bemor to‘lovini kiriting" onClose={onClose} />
      <div className="px-grid">
        <div>
          <span className="px-label">Bemor</span>
          <div className="px-card">
            <img src="/img/designs/malika.png" alt="" />
            <div><b>Malika Karimova</b><small>+998 90 123 45 67 · 28 yosh</small></div>
          </div>
          <input className="px-field" data-testid="pay-patient" aria-label="Bemor" value={patient} onChange={(event) => setPatient(event.target.value)} style={{ marginTop: "calc(.3 * var(--u))" }} />
        </div>
        <div>
          <span className="px-label">Davolash rejasi</span>
          <div className="px-card"><div><b>Implant va protez rejasi</b><small>14.10.2024 · {money(8597500)}</small></div></div>
        </div>
      </div>
      <div className="px-kpis" style={{ marginTop: "calc(.55 * var(--u))" }}>
        <article><small>Reja summasi</small><b>{money(9050000)}</b></article>
        <article><small>To‘langan</small><b>{money(8000000)}</b></article>
        <article className="debt"><small>Qarz</small><b>{money(1050000)}</b></article>
      </div>
      <div className="px-grid" style={{ marginTop: "calc(.55 * var(--u))" }}>
        <label><span className="px-label">Summa</span>
          <input className="px-field" aria-label="Summa" inputMode="numeric" value={formatGroupedNumber(Number(amount) || 0)} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
        </label>
        <label><span className="px-label">Sana</span>
          <input className="px-field" aria-label="Sana" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
      </div>
      <div style={{ marginTop: "calc(.55 * var(--u))" }}>
        <span className="px-label">To‘lov usuli</span>
        <div className="px-pays">
          {PAYS.map((item) => <button key={item} type="button" className={method === item ? "on" : undefined} onClick={() => setMethod(item)}>{item}</button>)}
        </div>
      </div>
      <p className="px-note" style={{ marginTop: "calc(.5 * var(--u))" }}>Qarz summa to‘liq yopilsa, davolash rejasi avtomatik ravishda “Yakunlangan” holatiga o‘tadi.</p>
      <div className="px-toggle" style={{ marginTop: "calc(.5 * var(--u))" }}>
        <div><b style={{ display: "block", fontSize: "calc(.72 * var(--u))" }}>Chek chiqarish</b><small style={{ color: "#8b97a8" }}>To‘lov bo‘yicha fiskal chek chiqarish</small></div>
        <button type="button" className={receipt ? "px-switch on" : "px-switch"} aria-pressed={receipt} onClick={() => setReceipt((value) => !value)}><i /></button>
      </div>
      <label style={{ display: "block", marginTop: "calc(.5 * var(--u))" }}>
        <span className="px-label">Izoh</span>
        <textarea className="px-area" aria-label="Izoh" maxLength={300} placeholder="To‘lov haqida qo‘shimcha ma’lumot (ixtiyoriy)..." value={note} onChange={(event) => setNote(event.target.value.slice(0, 300))} />
        <div className="px-count">{note.length}/300</div>
      </label>
      {error ? <p className="px-error">{error}</p> : null}
      <div className="px-foot">
        <button type="button" className="ghost" onClick={onClose}>Bekor qilish</button>
        <button type="button" className="go" data-testid="pay-save" onClick={save}>Saqlash</button>
      </div>
    </Overlay>
  );
}
