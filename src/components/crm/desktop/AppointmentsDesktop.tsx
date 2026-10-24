"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Play, Plus } from "lucide-react";
import { CrmFrame } from "@/components/crm/desktop/CrmFrame";
import { NewAppointmentModal } from "@/components/crm/CrmCreateModals";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import {
  apptRooms,
  apptStatusLabel,
  type Appointment,
  type ApptStatus,
} from "@/data/crm";
import { useCrmAppointments } from "@/lib/use-crm-list";
import { tashkentDateParts } from "@/lib/tashkent-date";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

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

/** Visit length in minutes; a booking saved without an end time counts as 30 minutes. */
function duration(item: { start: string; end: string }) {
  const span = minutes(item.end) - minutes(item.start);
  return span > 0 ? span : 30;
}

/** Side-by-side lanes for visits that overlap in time: [lane, lanes in its cluster] per id. */
function lanes<T extends { id: string; start: string; end: string }>(rows: T[]) {
  const sorted = [...rows].sort((a, b) => minutes(a.start) - minutes(b.start));
  const out = new Map<string, [number, number]>();
  let cluster: T[] = [];
  let clusterEnd = -1;
  const ends: number[] = [];
  const flush = () => {
    const width = Math.max(1, ends.length);
    for (const row of cluster) out.set(row.id, [out.get(row.id)?.[0] ?? 0, width]);
    cluster = [];
    ends.length = 0;
  };
  for (const row of sorted) {
    const start = minutes(row.start);
    if (start >= clusterEnd) flush();
    let lane = ends.findIndex((end) => end <= start);
    if (lane === -1) lane = ends.length;
    ends[lane] = start + duration(row);
    out.set(row.id, [lane, 0]);
    cluster.push(row);
    clusterEnd = Math.max(clusterEnd, start + duration(row));
  }
  flush();
  return out;
}

function clock(total: number) {
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function labelFor(value: string) {
  if (value >= "2026-10-20" && value <= "2026-10-26") return WEEK_NAMES[Number(value.slice(-2)) - 20];
  return REAL[new Date(`${value}T00:00:00Z`).getUTCDay()];
}

function monthLabel(iso: string) {
  return `${MONTHS[Number(iso.slice(5, 7)) - 1] ?? ""} ${iso.slice(0, 4)}`;
}

function dayLabel(iso: string) {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}

export function AppointmentsDesktop() {
  const { profile } = useDoctorProfile();
  const today = tashkentDateParts().iso;
  const [items, setItems] = useCrmAppointments<Appointment>();
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(today);
  const [view, setView] = useState<"kun" | "hafta" | "oy">("hafta");
  const [doctor, setDoctor] = useState("");
  const [room, setRoom] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ patient: "", service: "Konsultatsiya", doctorId: "self", room: "Kreslo 1", date: today, start: "09:00", end: "10:00", status: "tasdiq" as ApptStatus, note: "" });
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
  const todayItems = visible.filter((item) => item.date === today);
  const shownToday = todayItems.filter((item) => item.grid !== false);
  const avg = shownToday.length ? Math.round(shownToday.reduce((sum, item) => sum + duration(item), 0) / shownToday.length) : 0;
  const load = Math.min(100, Math.round((shownToday.reduce((sum, item) => sum + duration(item), 0) / (10 * 60)) * 100));
  const seedDay = false;

  const monthStart = `${cursor.slice(0, 8)}01`;
  const monthDays = Array.from({ length: 31 }, (_, index) => addDays(monthStart, index)).filter((item) => item.slice(5, 7) === cursor.slice(5, 7));

  return (
    <CrmFrame active="appointments" placeholder="Bemor, telefon, ID yoki xizmat bo‘yicha qidiring..." headerQuery={q} onHeaderQuery={setQ}>
      <div data-testid="appointments-desktop">
        <div className="crm-head">
          <div>
            <h1>Uchrashuvlar</h1>
            <p>Klinika jadvali va bemor qabuli</p>
          </div>
          <div className="crm-actions">
            <button type="button" className="crm-btn" data-testid="appt-today" onClick={() => { setCursor(today); setView("hafta"); }}>Bugun</button>
            <button type="button" className="crm-btn blue" data-testid="appt-add" onClick={() => setAdding(true)}><Plus className="i" /> Yangi uchrashuv</button>
          </div>
        </div>
        <div className="ap-bar">
          <button type="button" aria-label="Oldingi" onClick={() => setCursor(addDays(cursor, view === "oy" ? -30 : view === "kun" ? -1 : -7))}><ChevronLeft /></button>
          <button type="button" aria-label="Keyingi" onClick={() => setCursor(addDays(cursor, view === "oy" ? 30 : view === "kun" ? 1 : 7))}><ChevronRight /></button>
          <b>{view === "oy" ? monthLabel(cursor) : `${Number(days[0].slice(8))} ${monthLabel(days[0]).split(" ")[0]} – ${Number(days[6].slice(8))} ${monthLabel(days[6])}`}</b>
          <div className="ap-view">
            {(["kun", "hafta", "oy"] as const).map((item) => (
              <button key={item} type="button" className={view === item ? "on" : undefined} data-testid={`appt-${item}`} onClick={() => setView(item)}>{item === "kun" ? "Kun" : item === "hafta" ? "Hafta" : "Oy"}</button>
            ))}
          </div>
          <label className="crm-select"><select data-testid="appt-doctor" aria-label="Shifokor" value={doctor} onChange={(event) => setDoctor(event.target.value)}><option value="">Barcha shifokorlar</option>{doctors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="crm-select"><select data-testid="appt-room" aria-label="Kreslo" value={room} onChange={(event) => setRoom(event.target.value)}><option value="">Barcha kreslolar</option>{apptRooms.map((item) => <option key={item}>{item}</option>)}</select></label>
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
            <span><i style={{ background: "#0F766E" }} />Davolanmoqda</span>
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
                <header key={day} className={day === today ? "on" : undefined}><b>{labelFor(day)}</b><div>{Number(day.slice(-2))} {MONTHS[Number(day.slice(5, 7)) - 1]?.slice(0, 3)}</div></header>
              ))}
              <div className="ap-hours">{HOURS.map((hour, index) => <div key={hour} style={{ height: index === HOURS.length - 1 ? 0 : "calc(2.2 * var(--u))" }}>{hour}</div>)}</div>
              {gridDay.map((day) => (
                <div key={day} className="ap-col">
                  {(() => {
                    const dayRows = visible.filter((item) => item.date === day && item.grid !== false);
                    const placed = lanes(dayRows);
                    return dayRows.map((item) => {
                    const top = ((minutes(item.start) - 8 * 60) / (10 * 60)) * 100;
                    const height = (duration(item) / (10 * 60)) * 100;
                    const [lane, count] = placed.get(item.id) ?? [0, 1];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`ap-block ${item.status}${count > 1 ? " narrow" : ""}`}
                        style={{ top: `${top}%`, height: `${height}%`, left: `calc(${(lane / count) * 100}% + 2px)`, width: `calc(${100 / count}% - 4px)`, right: "auto" }}
                        title={`${item.start} ${item.patient} · ${item.service}`}
                        data-testid="appt-block"
                      >
                        <small>{item.start} – {clock(minutes(item.start) + duration(item))}</small>
                        <b>{item.patient}</b>
                        <span>{item.service}</span>
                      </button>
                    );
                    });
                  })()}
                </div>
              ))}
            </div>
          )}
          <aside>
            <div className="ap-today">
              <div className="ap-today-h"><b>Bugungi uchrashuvlar</b><span className="crm-muted">{dayLabel(today)}</span></div>
              {shownToday.length === 0 ? <p className="crm-muted">Uchrashuv yo‘q</p> : [...shownToday].sort((a, b) => a.start.localeCompare(b.start)).map((item) => (
                <div key={item.id} className="row">
                  <time>
                    {item.start}
                    <small>{clock(minutes(item.start) + duration(item))}</small>
                  </time>
                  {item.avatar ? <img src={item.avatar} alt="" /> : <span className="ap-ini" aria-hidden>{item.patient.slice(0, 1)}</span>}
                  <span className="who"><b>{item.patient}</b><small className="crm-muted">{item.service}</small></span>
                  <span className={`crm-pill ${item.status}`}>{apptStatusLabel[item.status]}</span>
                  {item.status !== "davol" && item.status !== "yakun" && item.status !== "bekor" ? (
                    <button type="button" className="ap-act" data-testid="appt-start" aria-label={`${item.patient}: qabulni boshlash`} title="Boshlash" onClick={() => setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, status: "davol" } : row)))}><Play className="i" /></button>
                  ) : null}
                  {item.status === "davol" ? (
                    <button type="button" className="ap-act done" data-testid="appt-finish" aria-label={`${item.patient}: qabulni yakunlash`} title="Yakunlash" onClick={() => setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, status: "yakun" } : row)))}><Check className="i" /></button>
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
