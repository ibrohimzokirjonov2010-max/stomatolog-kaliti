"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { apptDoctors, apptRooms, buildPatients, type PayMethod } from "@/data/crm";
import "./new-patient.css";
import "./crm-create.css";

const SERVICES = ["Konsultatsiya", "Davolash", "Gigiyena", "Implant", "Ortodontiya", "Professional tozalash"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const METHODS: PayMethod[] = ["Naqd", "Click", "Payme", "Karta"];
const NAMES = buildPatients().slice(0, 12).map((item) => item.name);

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

function Shell({
  title,
  subtitle,
  testId,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  testId: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useLock(onClose);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="nb-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="nb-dialog" role="dialog" aria-modal="true" aria-label={title} data-testid={testId}>
        <header className="nb-head">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="nb-x" aria-label="Yopish" onClick={onClose}>×</button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
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

export function NewAppointmentModal({
  initial,
  onClose,
  onSave,
}: {
  initial: ApptDraft;
  onClose: () => void;
  onSave: (draft: ApptDraft) => void;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  function save() {
    if (!form.patient.trim()) {
      setError("Bemorni kiriting");
      return;
    }
    if (!form.service.trim()) {
      setError("Xizmatni tanlang");
      return;
    }
    onSave(form);
  }

  return (
    <Shell title="Yangi uchrashuv" subtitle="Qabul vaqti va shifokorni tanlang" testId="appt-modal" onClose={onClose}>
      <div className="nb-grid">
        <label className="nb-field">
          Bemor*
          <input data-testid="appt-patient" list="appt-names" value={form.patient} placeholder="Bemor ismi" onChange={(event) => setForm({ ...form, patient: event.target.value })} />
          <datalist id="appt-names">{NAMES.map((name) => <option key={name} value={name} />)}</datalist>
        </label>
        <label className="nb-field">
          Xizmat*
          <select aria-label="Xizmat" value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}>
            {SERVICES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="nb-field">
          Shifokor*
          <select aria-label="Shifokor" value={form.doctorId} onChange={(event) => setForm({ ...form, doctorId: event.target.value })}>
            {apptDoctors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="nb-field">
          Xona*
          <select aria-label="Xona" value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })}>
            {apptRooms.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="nb-field">
          Sana*
          <input type="date" aria-label="Sana" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        </label>
        <label className="nb-field">
          Boshlanish
          <select aria-label="Boshlanish" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })}>
            {TIMES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="nb-field">
          Tugash
          <select aria-label="Tugash" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })}>
            {TIMES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="nb-field">
          Izoh
          <input aria-label="Izoh" value={form.note} placeholder="Qo‘shimcha eslatma" onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </label>
      </div>
      {error ? <p className="nb-error">{error}</p> : null}
      <div className="nb-foot">
        <button type="button" className="ghost" onClick={onClose}>Bekor qilish</button>
        <button type="button" className="go" data-testid="appt-save" onClick={save}>Saqlash</button>
      </div>
    </Shell>
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

export function NewPlanModal({
  patients,
  initial,
  onClose,
  onSave,
}: {
  patients: { id: string; name: string }[];
  initial: PlanDraft;
  onClose: () => void;
  onSave: (draft: PlanDraft) => void;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  function save() {
    if (!form.title.trim()) {
      setError("Reja nomini kiriting");
      return;
    }
    if (!form.patientId) {
      setError("Bemorni tanlang");
      return;
    }
    onSave(form);
  }

  return (
    <Shell title="Yangi davolash rejasi" subtitle="Davolash bosqichlari va narxini kiriting" testId="plan-modal" onClose={onClose}>
      <div className="nb-grid">
        <label className="nb-field nb-span">
          Reja nomi*
          <input data-testid="new-plan" value={form.title} placeholder="Masalan, kompleks davolash" onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="nb-field">
          Bemor*
          <select aria-label="Bemor" value={form.patientId} onChange={(event) => setForm({ ...form, patientId: event.target.value })}>
            {patients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="nb-field">
          Shifokor
          <input aria-label="Shifokor" value={form.doctor} onChange={(event) => setForm({ ...form, doctor: event.target.value })} />
        </label>
        <label className="nb-field">
          Boshlanish sanasi
          <input type="date" aria-label="Boshlanish sanasi" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        </label>
        <label className="nb-field">
          Tishlar
          <input aria-label="Tishlar" value={form.teeth} placeholder="16, 26" onChange={(event) => setForm({ ...form, teeth: event.target.value })} />
        </label>
        <label className="nb-field">
          Taxminiy summa
          <input aria-label="Summa" inputMode="numeric" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value.replace(/[^\d]/g, "") })} />
        </label>
        <label className="nb-field nb-span">
          Izoh
          <textarea aria-label="Izoh" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </label>
      </div>
      {error ? <p className="nb-error">{error}</p> : null}
      <div className="nb-foot">
        <button type="button" className="ghost" onClick={onClose}>Bekor qilish</button>
        <button type="button" className="go" data-testid="new-plan-save" onClick={save}>Saqlash</button>
      </div>
    </Shell>
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

export function NewPaymentModal({
  initial,
  onClose,
  onSave,
}: {
  initial: PayDraft;
  onClose: () => void;
  onSave: (draft: PayDraft) => void;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  function save() {
    if (!form.patient.trim()) {
      setError("Bemorni kiriting");
      return;
    }
    if (!Number(form.amount)) {
      setError("Summani kiriting");
      return;
    }
    onSave(form);
  }

  return (
    <Shell title="Yangi to‘lov" subtitle="To‘lov summasi va usulini kiriting" testId="pay-modal" onClose={onClose}>
      <div className="nb-grid">
        <label className="nb-field">
          Bemor*
          <input data-testid="pay-patient" list="pay-names" value={form.patient} placeholder="Bemor ismi" onChange={(event) => setForm({ ...form, patient: event.target.value })} />
          <datalist id="pay-names">{NAMES.map((name) => <option key={name} value={name} />)}</datalist>
        </label>
        <label className="nb-field">
          Xizmat
          <select aria-label="Xizmat" value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value })}>
            {SERVICES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="nb-field">
          Summa*
          <input aria-label="Summa" inputMode="numeric" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value.replace(/[^\d]/g, "") })} />
        </label>
        <label className="nb-field">
          Sana
          <input type="date" aria-label="Sana" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
        </label>
        <div className="nb-span">
          <span className="nb-label">Usul*</span>
          <div className="nb-pays">
            {METHODS.map((item) => (
              <button key={item} type="button" className={form.method === item ? "on" : undefined} onClick={() => setForm({ ...form, method: item })}>{item}</button>
            ))}
          </div>
        </div>
        <label className="nb-field nb-span">
          Izoh
          <input aria-label="Izoh" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </label>
      </div>
      {error ? <p className="nb-error">{error}</p> : null}
      <div className="nb-foot">
        <button type="button" className="ghost" onClick={onClose}>Bekor qilish</button>
        <button type="button" className="go" data-testid="pay-save" onClick={save}>Saqlash</button>
      </div>
    </Shell>
  );
}
