"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import type { Patient } from "@/data/crm";
import { useCrmPatients } from "@/lib/use-crm-list";
import "./new-patient.css";
import "./crm-create.css";

const SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
const DOW = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const SERVICES = ["Konsultatsiya", "Endodontik davolash", "Shtift qo‘yish", "Implant (komplekt)", "Professional gigiyena", "Ortodontik davolash"];

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

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function NewAppointmentModal({ initial, onClose, onSave }: { initial: ApptDraft; onClose: () => void; onSave: (draft: ApptDraft) => void }) {
  const [patients] = useCrmPatients<Patient>();
  const { profile } = useDoctorProfile();
  const doctorName = profile?.fullName?.trim() || "Shifokor";
  const matched = patients.find((item) => item.name === initial.patient);
  const [patientId, setPatientId] = useState(matched?.id ?? "");
  const [service, setService] = useState(initial.service || "Konsultatsiya");
  const [room, setRoom] = useState(initial.room || "Kreslo 1");
  const [date, setDate] = useState(/^\d{4}-\d{2}-\d{2}$/.test(initial.date) ? initial.date : todayIso());
  const [start, setStart] = useState(initial.start || "10:00");
  const [duration, setDuration] = useState(30);
  const [sms, setSms] = useState(true);
  const [note, setNote] = useState(initial.note || "");
  const [error, setError] = useState("");

  function save() {
    const person = patients.find((item) => item.id === patientId);
    if (!person) { setError("Bemorni tanlang"); return; }
    onSave({
      patient: person.name,
      service,
      doctorId: "self",
      room,
      date,
      start,
      end: addMinutes(start, duration),
      note: sms ? note : note.trim(),
    });
  }

  return (
    <Overlay testId="appt-modal" title="Yangi uchrashuv" wide onClose={onClose}>
      <Head title="Yangi uchrashuv" subtitle="Uchrashuv ma’lumotlarini kiriting" onClose={onClose} />
      <div className="px-grid">
        <label>
          <span className="px-label">Bemor</span>
          <select className="px-select" data-testid="appt-patient" aria-label="Bemor" value={patientId} onChange={(event) => setPatientId(event.target.value)}>
            <option value="">Bemorni tanlang</option>
            {patients.map((item) => <option key={item.id} value={item.id}>{item.name}{item.phone ? ` · ${item.phone}` : ""}</option>)}
          </select>
          {patients.length === 0 ? <p className="px-note">Avval bemor qo‘shing. Namuna bemorlar yo‘q.</p> : null}
        </label>
        <div>
          <span className="px-label">Shifokor</span>
          <div className="px-card"><div><b>{doctorName}</b></div></div>
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
        <label>
          <span className="px-label">Sana</span>
          <input className="px-field" type="date" aria-label="Sana" data-testid="appt-date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
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
        <button type="button" className="go" data-testid="appt-save" disabled={patients.length === 0} onClick={save}>Saqlash</button>
      </div>
    </Overlay>
  );
}
