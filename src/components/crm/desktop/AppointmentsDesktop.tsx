"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { CrmFrame } from "@/components/crm/desktop/CrmFrame";
import { NewAppointmentModal } from "@/components/crm/CrmCreateModals";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import {
  CLINIC_TODAY,
  apptRooms,
  apptStatusLabel,
  type Appointment,
  type ApptStatus,
} from "@/data/crm";
import { useCrmAppointments } from "@/lib/use-crm-list";

const DEMO_DOCTOR_IDS = new Set(["ibrohim", "karimov", "aliyeva", "toxtayev", "saidova"]);

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const WEEK_NAMES = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];
const REAL = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return iso(date);
}

function monday(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(value, diff);
}

function weekOf(value: string) {
  if (value >= "2026-10-20" && value <= "2026-10-26") return "2026-10-20";
  return monday(value);
}

function minutes(value: string) {
  const [hour, min] = value.split(":").map(Number);
  return hour * 60 + min;
}

function labelFor(value: string) {
  if (value >= "2026-10-20" && value <= "2026-10-26") return WEEK_NAMES[Number(value.slice(-2)) - 20];
  return REAL[new Date(`${value}T00:00:00Z`).getUTCDay()];
}

export function AppointmentsDesktop() {
  const { profile } = useDoctorProfile();
  const [items, setItems] = useCrmAppointments<Appointment>();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(CLINIC_TODAY);
  const [view, setView] = useState<"kun" | "hafta" | "oy">("hafta");
  const [doctor, setDoctor] = useState("");
  const [room, setRoom] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ patient: "", service: "Konsultatsiya", doctorId: "self", room: "Xona 1", date: CLINIC_TODAY, start: "09:00", end: "10:00", status: "tasdiq" as ApptStatus, note: "" });
  const doctors = useMemo(() => {
    const map = new Map<string, string>();
    const self = profile?.fullName?.trim();
    if (self) map.set("self", self);
    for (const item of items) {
      if (!item.doctorId || DEMO_DOCTOR_IDS.has(item.doctorId)) continue;
      if (!item.doctor || /karimov|aliyeva|to['’]xtayev|saidova/i.test(item.doctor)) continue;
      map.set(item.doctorId, item.doctor);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [items, profile?.fullName]);

  const weekStart = weekOf(cursor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const visible = useMemo(() => items.filter((item) => {
    if (doctor && item.doctorId !== doctor) return false;
    if (room && item.room !== room) return false;
    if (q.trim() && !`${item.patient} ${item.service}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [doctor, items, q, room]);

  const gridDay = view === "kun" ? [cursor] : days;
  const todayItems = visible.filter((item) => item.date === cursor);
  const shownToday = todayItems.filter((item) => item.grid !== false);
  const avg = shownToday.length ? Math.round(shownToday.reduce((sum, item) => sum + (minutes(item.end) - minutes(item.start)), 0) / shownToday.length) : 0;
  const load = Math.min(100, Math.round((shownToday.reduce((sum, item) => sum + (minutes(item.end) - minutes(item.start)), 0) / (10 * 60)) * 100));
  const seedDay = false;

  const monthStart = `${cursor.slice(0, 8)}01`;
  const monthDays = Array.from({ length: 31 }, (_, index) => addDays(monthStart, index)).filter((item) => item.slice(5, 7) === cursor.slice(5, 7));

  return (
    <CrmFrame inlineSearch active="appointments" placeholder="Bemor, telefon, ID yoki xizmat bo‘yicha qidiring..." headerQuery={q} onHeaderQuery={setQ}>
      <div data-testid="appointments-desktop">
        <div className="crm-head">
          <div>
            <h1>Uchrashuvlar</h1>
            <p>Klinika jadvali va bemor qabuli</p>
          </div>
          <div className="crm-actions">
            <button type="button" className="crm-btn" data-testid="appt-today" onClick={() => { setCursor(CLINIC_TODAY); setView("hafta"); }}>Bugun</button>
            <button type="button" className="crm-btn blue" data-testid="appt-add" onClick={() => setAdding(true)}><Plus className="i" /> Yangi uchrashuv</button>
          </div>
        </div>
        <div className="ap-bar">
          <button type="button" aria-label="Oldingi" onClick={() => setCursor(addDays(cursor, view === "oy" ? -30 : view === "kun" ? -1 : -7))}><ChevronLeft /></button>
          <button type="button" aria-label="Keyingi" onClick={() => setCursor(addDays(cursor, view === "oy" ? 30 : view === "kun" ? 1 : 7))}><ChevronRight /></button>
          <b>{view === "oy" ? "Oktyabr 2026" : `${days[0].slice(8)}.${days[0].slice(5, 7)} – ${days[6].slice(8)} oktyabr 2026`}</b>
          <div className="ap-view">
            {(["kun", "hafta", "oy"] as const).map((item) => (
              <button key={item} type="button" className={view === item ? "on" : undefined} data-testid={`appt-${item}`} onClick={() => setView(item)}>{item === "kun" ? "Kun" : item === "hafta" ? "Hafta" : "Oy"}</button>
            ))}
          </div>
          <label className="crm-select"><select data-testid="appt-doctor" aria-label="Shifokor" value={doctor} onChange={(event) => setDoctor(event.target.value)}><option value="">Barcha shifokorlar</option>{doctors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="crm-select"><select data-testid="appt-room" aria-label="Xona" value={room} onChange={(event) => setRoom(event.target.value)}><option value="">Barcha xonalar</option>{apptRooms.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="ap-docs">
          <button type="button" className={doctor === "" ? "on" : undefined} onClick={() => setDoctor("")}>Barchasi</button>
          {doctors.map((item) => (
            <button key={item.id} type="button" className={doctor === item.id ? "on" : undefined} onClick={() => setDoctor(item.id)}>
              {item.name}
            </button>
          ))}
          <div className="ap-legend">
            <span><i style={{ background: "#22c55e" }} />Tasdiqlangan</span>
            <span><i style={{ background: "#f59e0b" }} />Kutilmoqda</span>
            <span><i style={{ background: "#3b82f6" }} />Davolanmoqda</span>
            <span><i style={{ background: "#94a3b8" }} />Yakunlangan</span>
            <span><i style={{ background: "#ef4444" }} />Bekor qilingan</span>
          </div>
        </div>
        <div className="crm-split">
          {view === "oy" ? (
            <div className="ap-month">
              {monthDays.map((day) => {
                const count = visible.filter((item) => item.date === day && item.grid !== false).length;
                return <button key={day} type="button" className={day === cursor ? "on" : undefined} onClick={() => { setCursor(day); setView("kun"); }}><b>{Number(day.slice(-2))}</b><span>{count ? `${count} ta` : ""}</span></button>;
              })}
            </div>
          ) : (
            <div className="ap-grid" style={view === "kun" ? { gridTemplateColumns: "calc(3 * var(--u)) minmax(0,1fr)" } : undefined}>
              <header>Vaqt</header>
              {gridDay.map((day) => (
                <header key={day} className={day === CLINIC_TODAY ? "on" : undefined}><b>{labelFor(day)}</b><div>{Number(day.slice(-2))} okt</div></header>
              ))}
              <div className="ap-hours">{HOURS.map((hour, index) => <div key={hour} style={{ height: index === HOURS.length - 1 ? 0 : "calc(2.2 * var(--u))" }}>{hour}</div>)}</div>
              {gridDay.map((day) => (
                <div key={day} className="ap-col">
                  {visible.filter((item) => item.date === day && item.grid !== false).map((item) => {
                    const top = ((minutes(item.start) - 8 * 60) / (10 * 60)) * 100;
                    const height = ((minutes(item.end) - minutes(item.start)) / (10 * 60)) * 100;
                    return (
                      <button key={item.id} type="button" className={`ap-block ${item.status}`} style={{ top: `${top}%`, height: `${height}%` }} data-testid="appt-block">
                        <small>{item.start} – {item.end}</small>
                        <b>{item.patient}</b>
                        <span>{item.service}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          <aside>
            <div className="ap-today">
              <div style={{ display: "flex", justifyContent: "space-between" }}><b>Bugungi uchrashuvlar</b><span className="crm-muted">{cursor.split("-").reverse().join(".")}</span></div>
              {shownToday.length === 0 ? <p className="crm-muted">Uchrashuv yo‘q</p> : shownToday.map((item) => (
                <div key={item.id} className="row">
                  <img src={item.avatar} alt="" />
                  <span style={{ flex: 1 }}><b>{item.patient}</b><small className="crm-muted">{item.service} · {item.room}</small></span>
                  <span className={`crm-pill ${item.status}`}>{apptStatusLabel[item.status]}</span>
                  {item.status !== "davol" && item.status !== "yakun" && item.status !== "bekor" ? (
                    <button type="button" className="crm-btn blue" data-testid="appt-start" onClick={() => setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, status: "davol" } : row)))}>Boshlash</button>
                  ) : null}
                  {item.status === "davol" ? (
                    <button type="button" className="crm-btn" data-testid="appt-finish" onClick={() => setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, status: "yakun" } : row)))}>Yakunlash</button>
                  ) : null}
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: "calc(.7 * var(--u))" }}>Statistika (bugun)</h3>
            <div className="ap-stats">
              <div><b data-testid="appt-count">{seedDay ? 5 : shownToday.length}</b>Uchrashuv</div>
              <div><b>{seedDay ? 3 : todayItems.filter((item) => item.isNew).length}</b>Yangi bemor</div>
              <div><b>{seedDay ? 1 : todayItems.filter((item) => item.status === "yakun").length}</b>Yakunlangan</div>
              <div><b>{seedDay ? 1 : todayItems.filter((item) => item.status === "bekor").length}</b>Bekor qilingan</div>
            </div>
            <div className="pl-box" style={{ marginTop: "calc(.35 * var(--u))" }}>
              <p className="crm-muted">O‘rtacha qabul vaqti</p>
              <b>{seedDay ? 45 : avg} daqiqa</b>
              <p className="crm-muted" style={{ marginTop: "calc(.3 * var(--u))" }}>Klinika bandligi</p>
              <div className="ap-load"><b style={{ width: `${seedDay ? 80 : load}%` }} /></div>
              <b>{seedDay ? 80 : load}%</b>
            </div>
          </aside>
        </div>
        {adding ? (
          <NewAppointmentModal
            initial={form}
            onClose={() => setAdding(false)}
            onSave={(draft) => {
              setForm((current) => ({ ...current, ...draft }));
              if (!draft.patient.trim()) return;
              const doc = doctors.find((item) => item.id === draft.doctorId) ?? { id: "self", name: profile?.fullName?.trim() || "Shifokor" };
              const next: Appointment = {
                id: `user-${Date.now()}`,
                date: draft.date,
                start: draft.start,
                end: draft.end,
                patient: draft.patient.trim(),
                avatar: "/img/jobs/doctor.jpg",
                service: draft.note.trim() ? `${draft.service} · ${draft.note.trim()}` : draft.service,
                doctor: doc.name,
                doctorId: doc.id,
                room: draft.room,
                status: "tasdiq",
              };
              setItems((prev) => [next, ...prev]);
              setCursor(draft.date);
              setAdding(false);
            }}
          />
        ) : null}
      </div>
    </CrmFrame>
  );
}
