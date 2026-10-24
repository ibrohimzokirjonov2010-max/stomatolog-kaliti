"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Armchair,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { ShopShell } from "@/components/shop/desktop/ShopShell";
import { som, useShopLineCount } from "@/components/shop/desktop/shop-cart";
import { useCrmAppointments, useCrmPatients } from "@/lib/use-crm-list";
import { useStoredList } from "@/lib/stored-list";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useLabWork } from "@/components/lab-provider";
import { apptRooms, patientStatuses, type Appointment, type ClinicPayment, type Patient, type StockItem } from "@/data/crm";
import { labMaterialLabel, labServiceLabel } from "@/data/labs";
import { orderStatusCopy } from "@/lib/lab-work";
import { formatDotDate } from "@/lib/format";
import { api } from "@/lib/work-client";
import "./hub.css";
import "./klinika.css";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
const CHAIRS = [
  { id: "k1", name: "Kreslo 1" },
  { id: "k2", name: "Kreslo 2" },
  { id: "k3", name: "Kreslo 3" },
];
const SLOT_TIMES = ["09:00", "10:00", "11:30", "14:00", "15:30", "17:00"];
const LUNCH = "13:00";
const DAY_MS = 86_400_000;
const STATUS_PILL: Record<string, string> = { tasdiq: "Tasdiqlangan", kutil: "Kutilmoqda", davol: "Qabulda", yakun: "Tugallandi" };

type StaffRow = { id: string; name: string; role: string; onDuty: boolean };

type SlotView =
  | { time: string; kind: "lunch" }
  | { time: string; kind: "free" }
  | { time: string; kind: "visit"; appt: Appointment };

function iso(date: Date) {
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function labelOf(date: Date) {
  return `${date.getDate()}-${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Accepts "2026-10-24" and "24.10.2026"; returns null for anything else. */
function parseDay(value: string | undefined): Date | null {
  if (!value) return null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (isoMatch) return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  const dotMatch = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(value);
  if (dotMatch) return new Date(Number(dotMatch[3]), Number(dotMatch[2]) - 1, Number(dotMatch[1]));
  return null;
}


function monthKey(date: Date) {
  return date.getFullYear() * 12 + date.getMonth();
}

/** Percent change, or null when there is nothing to compare against. */
function delta(now: number, before: number) {
  if (before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

function chairOf(appt: Appointment) {
  const room = (appt.room || "").trim();
  const index = CHAIRS.findIndex((chair, i) => room === chair.id || room === chair.name || room === apptRooms[i]);
  return index;
}

function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function compactMoney(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function KlinikaDesktop() {
  const cartCount = useShopLineCount();
  const { profile, updateProfile } = useDoctorProfile();
  const { orders: labOrders } = useLabWork();
  const [patients, setPatients] = useCrmPatients<Patient>();
  const [appointments, setAppointments] = useCrmAppointments<Appointment>();
  const [ledger] = useStoredList<ClinicPayment>("sk-crm-payments-v1", []);
  const [stock] = useStoredList<StockItem>("sk-crm-stock-v2", []);
  const [date, setDate] = useState(() => new Date());
  const [now, setNow] = useState<Date | null>(null);
  const [range, setRange] = useState<6 | 3>(6);
  const [filter, setFilter] = useState<"all" | "busy" | "free">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState<{ chair: string; time: string } | null>(null);
  const [settings, setSettings] = useState(false);
  const [team, setTeam] = useState<StaffRow[]>([]);
  const [patientQ, setPatientQ] = useState("");
  const [calMonth, setCalMonth] = useState<Date | null>(null);

  // Staff live in the clinic record (clinic_staff); managed on /klinika.
  useEffect(() => {
    if (!profile?.id) return;
    let stop = false;
    void api<{ state: { staff?: StaffRow[] } | null }>("/api/work/clinic").then((res) => {
      if (!stop && res.ok) setTeam(res.data.state?.staff ?? []);
    });
    return () => {
      stop = true;
    };
  }, [profile?.id]);

  // Clock only on the client so server and client markup agree.
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const clinicName = profile?.clinic?.trim() || "Mening klinikam";
  const clinicCity = profile?.city?.trim() || "";
  const day = iso(date);
  const isToday = now ? iso(now) === day : false;

  const dayAppts = useMemo(() => appointments.filter((item) => item.date === day && item.status !== "bekor"), [appointments, day]);

  const chairs = useMemo(() => {
    const placed = CHAIRS.map(() => new Map<string, Appointment>());
    const floating: Appointment[] = [];
    for (const appt of dayAppts) {
      const index = chairOf(appt);
      if (index >= 0 && !placed[index].has(appt.start)) placed[index].set(appt.start, appt);
      else floating.push(appt);
    }
    // Appointments without a known chair go to the first chair that is free at that time.
    for (const appt of floating) {
      const target = placed.find((map) => !map.has(appt.start));
      if (target) target.set(appt.start, appt);
    }
    return CHAIRS.map((chair, index) => {
      const booked = [...placed[index].keys()].map(minutes);
      // A default slot gives way to a booking that starts within the same hour.
      const defaults = SLOT_TIMES.filter((time) => !booked.some((start) => start !== minutes(time) && Math.abs(start - minutes(time)) < 60));
      const times = new Set([...defaults, LUNCH, ...placed[index].keys()]);
      const slots: SlotView[] = [...times]
        .sort((a, b) => minutes(a) - minutes(b))
        .map((time) => {
          const appt = placed[index].get(time);
          if (appt) return { time, kind: "visit", appt };
          if (time === LUNCH) return { time, kind: "lunch" };
          return { time, kind: "free" };
        });
      const open = slots.filter((slot) => slot.kind !== "lunch");
      const busy = open.filter((slot) => slot.kind === "visit").length;
      return { ...chair, slots, busy, total: open.length };
    });
  }, [dayAppts]);

  const slotTotal = chairs.reduce((sum, chair) => sum + chair.total, 0);
  const slotBusy = chairs.reduce((sum, chair) => sum + chair.busy, 0);
  const occupancy = slotTotal ? Math.round((slotBusy / slotTotal) * 100) : 0;

  const weekAgo = iso(new Date(date.getTime() - 7 * DAY_MS));
  const apptsWeekAgo = appointments.filter((item) => item.date === weekAgo && item.status !== "bekor").length;

  const anchor = now ?? date;
  const newThisWeek = patients.filter((patient) => {
    const created = parseDay(patient.created);
    return created ? anchor.getTime() - created.getTime() < 7 * DAY_MS : false;
  }).length;
  const newPrevWeek = patients.filter((patient) => {
    const created = parseDay(patient.created);
    if (!created) return false;
    const age = anchor.getTime() - created.getTime();
    return age >= 7 * DAY_MS && age < 14 * DAY_MS;
  }).length;

  // Every payment the clinic recorded: the To‘lovlar ledger plus payments saved on patient cards.
  const payments = useMemo(() => {
    const rows: { date: Date; amount: number }[] = [];
    for (const pay of ledger) {
      const when = parseDay(pay.date);
      if (when) rows.push({ date: when, amount: Number(pay.amount) || 0 });
    }
    for (const patient of patients) {
      for (const pay of patient.payments ?? []) {
        const when = parseDay(pay.date);
        if (when) rows.push({ date: when, amount: Number(pay.amount) || 0 });
      }
    }
    return rows;
  }, [ledger, patients]);

  const thisMonth = monthKey(anchor);
  const income = payments.filter((pay) => monthKey(pay.date) === thisMonth).reduce((sum, pay) => sum + pay.amount, 0);
  const lastMonthIncome = payments.filter((pay) => monthKey(pay.date) === thisMonth - 1).reduce((sum, pay) => sum + pay.amount, 0);

  const bars = useMemo(() => {
    const list: { label: string; value: number }[] = [];
    for (let offset = range - 1; offset >= 0; offset -= 1) {
      const key = thisMonth - offset;
      const month = ((key % 12) + 12) % 12;
      list.push({
        label: MONTHS_SHORT[month],
        value: payments.filter((pay) => monthKey(pay.date) === key).reduce((sum, pay) => sum + pay.amount, 0),
      });
    }
    return list;
  }, [payments, range, thisMonth]);
  const barMax = Math.max(...bars.map((bar) => bar.value), 0);
  const axisTop = barMax > 0 ? Math.ceil(barMax / 4 / 1_000_000) * 4 * 1_000_000 || Math.ceil(barMax / 4 / 1_000) * 4 * 1_000 : 0;

  const alerts = stock
    .filter((item) => Number(item.qty) <= Number(item.min))
    .sort((a, b) => Number(a.qty) - Number(b.qty))
    .slice(0, 3);

  const debtOf = (patient: Patient) => {
    const planned = (patient.plans ?? []).filter((plan) => plan.status !== "bekor").reduce((sum, plan) => sum + (Number(plan.total) || 0), 0);
    const paid = (patient.payments ?? []).reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
    return Math.max(0, planned - paid);
  };

  const staff = useMemo(() => {
    const list: { id: string; name: string; role: string; avatar: string; online: boolean }[] = [];
    if (profile?.fullName) list.push({ id: "me", name: profile.fullName, role: profile.specialty || "Shifokor", avatar: profile.avatarUrl || "", online: true });
    for (const person of team) list.push({ id: person.id, name: person.name, role: person.role, avatar: "", online: person.onDuty });
    return list.slice(0, 4);
  }, [profile, team]);

  const shownPatients = useMemo(() => {
    const q = patientQ.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return patients.filter((patient) => !q || patient.name.toLowerCase().includes(q) || (digits && (patient.phone || "").replace(/\D/g, "").includes(digits)));
  }, [patientQ, patients]);

  const dayYear = date.getFullYear();
  const dayMonth = date.getMonth();
  const month = useMemo(() => calMonth ?? new Date(dayYear, dayMonth, 1), [calMonth, dayMonth, dayYear]);
  const calDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const busy = new Set(appointments.filter((item) => item.status !== "bekor").map((item) => item.date));
    return [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: count }, (_, index) => {
        const d = new Date(month.getFullYear(), month.getMonth(), index + 1);
        return { d, key: iso(d), busy: busy.has(iso(d)) };
      }),
    ];
  }, [appointments, month]);

  const openLab = labOrders.filter((order) => order.status !== "yetkazildi" && order.status !== "bekor").slice(0, 4);

  function shift(days: number) {
    setDate((prev) => new Date(prev.getTime() + days * DAY_MS));
  }

  function firstFree() {
    for (const chair of chairs) {
      const slot = chair.slots.find((item) => item.kind === "free");
      if (slot) return { chair: chair.id, time: slot.time };
    }
    return null;
  }

  return (
    <ShopShell searchPath="/mening-klinikam" cartCount={cartCount} placeholder="Stomatologga nima kerak?" showCamera={false}>
      <div className="kd">
        <header className="kd-head">
          <div className="kd-brand">
            <span className="kd-logo" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2.2c1.7 0 3 .9 3.5 2.3.4 1.1.2 2.1-.2 3 .9.3 1.9.2 2.8-.3 1.1-.6 2.5-.2 3.2 1 .7 1.1.5 2.5-.3 3.4-.7.8-1.2 1.9-1.2 3.1 0 2.2-.9 4.6-1.8 5.8-.5.7-1.6.8-2.2.1-.5-.6-1-1.7-1.4-1.7s-.9 1.1-1.4 1.7c-.6.7-1.7.6-2.2-.1-.9-1.2-1.8-3.6-1.8-5.8 0-1.2-.5-2.3-1.2-3.1-.8-.9-1-2.3-.3-3.4.7-1.2 2.1-1.6 3.2-1 .9.5 1.9.6 2.8.3-.4-.9-.6-1.9-.2-3C9 3.1 10.3 2.2 12 2.2z"
                />
              </svg>
            </span>
            <div>
              <h1>
                {clinicName}
                <BadgeCheck className="kd-verified" aria-label="Tasdiqlangan" />
              </h1>
              <p>
                <span>
                  <MapPin className="i" /> {clinicCity || "Shahar tanlanmagan"}
                </span>
                <button type="button" onClick={() => setSettings(true)}>
                  <Settings className="i" /> Sozlamalar
                </button>
              </p>
            </div>
          </div>
          <div className="kd-banner">
            <img src="/img/jihoz/chair.jpg" alt="" />
            <span>
              <b>Klinikangizni to‘liq nazorat qiling</b>
              <small>Bemorlar, moliya, ombor va xodimlar bir joyda</small>
              <button type="button" onClick={() => setSettings(true)}>Klinika sozlamalari <ArrowRight className="i" /></button>
            </span>
          </div>
          <div className="kd-head-actions">
            <button type="button" className="kd-btn ghost" onClick={() => setPatientOpen(true)}>
              <Plus className="i" /> Bemor qo‘shish
            </button>
            <button
              type="button"
              className="kd-btn solid"
              onClick={() => {
                const slot = firstFree();
                if (slot) setBookOpen(slot);
              }}
            >
              <CalendarPlus className="i" /> Qabulga yozish
            </button>
          </div>
        </header>

        <section className="kd-kpis" aria-label="Bugungi ko‘rsatkichlar">
          <Kpi icon={<CalendarDays className="i" />} label="Bugungi qabullar" value={String(dayAppts.length)} change={delta(dayAppts.length, apptsWeekAgo)} note={`Jami ${slotTotal} ta slotdan`} meter={slotTotal ? Math.round((slotBusy / slotTotal) * 100) : 0} />
          <Kpi icon={<UserRound className="i" />} label="Yangi bemorlar" value={String(newThisWeek)} change={delta(newThisWeek, newPrevWeek)} note={`Jami: ${patients.length} ta bemor`} />
          <Kpi
            icon={<CircleDollarSign className="i" />}
            tone="orange"
            label="Oylik daromad"
            value={som(income)}
            change={delta(income, lastMonthIncome)}
            note={`O‘tgan oy: ${som(lastMonthIncome)}`}
            testId="clinic-income"
          />
          <Kpi icon={<Armchair className="i" />} label="Kreslo bandligi" value={`${occupancy}%`} note={`${CHAIRS.length} ta kreslodan`} testId="clinic-occupancy" ring={occupancy} />
        </section>

        <div className="kd-grid">
          <div className="kd-left">
            <section className="kd-card kd-sched">
              <div className="kd-card-h">
                <h2>Bugungi qabul jadvali</h2>
                <div className="kd-sched-tools">
                  <div className="kd-date">
                    <button type="button" onClick={() => shift(-1)} aria-label="Oldingi kun">
                      <ChevronLeft className="i" />
                    </button>
                    <b>{labelOf(date)}</b>
                    <button type="button" onClick={() => shift(1)} aria-label="Keyingi kun">
                      <ChevronRight className="i" />
                    </button>
                  </div>
                  <button type="button" className="kd-btn ghost sm" disabled={isToday} onClick={() => { setDate(new Date()); setCalMonth(null); }}>Bugun</button>
                  <div className="kd-drop">
                    <button type="button" className="kd-btn ghost sm" aria-expanded={filterOpen} onClick={() => setFilterOpen((open) => !open)}>
                      {filter === "busy" ? "Band qabullar" : filter === "free" ? "Bo‘sh slotlar" : "Barcha qabullar"}
                    </button>
                    {filterOpen ? (
                      <div className="kd-pop" role="menu">
                        {(
                          [
                            ["all", "Barcha qabullar"],
                            ["busy", "Band qabullar"],
                            ["free", "Bo‘sh slotlar"],
                          ] as const
                        ).map(([id, label]) => (
                          <button
                            key={id}
                            type="button"
                            role="menuitemradio"
                            aria-checked={filter === id}
                            onClick={() => {
                              setFilter(id);
                              setFilterOpen(false);
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="kd-chairs">
                {chairs.map((chair) => {
                  const ratio = chair.total ? chair.busy / chair.total : 0;
                  const tone = ratio >= 0.75 ? "red" : ratio >= 0.5 ? "amber" : "green";
                  return (
                    <div className="kd-chair" key={chair.id}>
                      <h3>
                        <Armchair className="i" /> {chair.name}
                        <span className={`kd-pill ${tone}`}>
                          <i aria-hidden /> {ratio >= 0.5 ? "Band" : "Bo‘sh"}
                        </span>
                        <em>
                          {chair.busy}/{chair.total}
                        </em>
                      </h3>
                      <div className="kd-slots">
                        {chair.slots
                          .filter((slot) => (filter === "busy" ? slot.kind === "visit" : filter === "free" ? slot.kind === "free" : true))
                          .map((slot) => (
                            <SlotRow
                              key={slot.time}
                              slot={slot}
                              current={isToday && now ? isCurrent(slot.time, chair.slots, now) : false}
                              onFree={() => setBookOpen({ chair: chair.id, time: slot.time })}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="kd-bottom">
              <section className="kd-card">
                <div className="kd-card-h">
                  <h2>Bemorlar ro‘yxati</h2>
                  <Link className="kd-link" href="/crm/bemorlar">
                    Barchasini ko‘rish <ArrowRight className="i" />
                  </Link>
                </div>
                <label className="kd-search">
                  <Search className="i" />
                  <input value={patientQ} onChange={(event) => setPatientQ(event.target.value)} placeholder="Bemor qidirish (ism, telefon)..." aria-label="Bemor qidirish" />
                </label>
                <div className="kd-table-wrap">
                  <table className="kd-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Ism familiya</th>
                        <th>Telefon</th>
                        <th>Oxirgi tashrif</th>
                        <th>Keyingi tashrif</th>
                        <th>Qarzdorlik</th>
                        <th>Holat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="kd-empty-row">
                            Hali bemor yo‘q. <button type="button" onClick={() => setPatientOpen(true)}>Birinchi bemorni qo‘shing</button>
                          </td>
                        </tr>
                      ) : null}
                      {patients.length > 0 && shownPatients.length === 0 ? (
                        <tr><td colSpan={7} className="kd-empty-row">Bemor topilmadi.</td></tr>
                      ) : null}
                      {shownPatients.slice(0, 5).map((patient, index) => {
                        const debt = debtOf(patient);
                        const status = patientStatuses.find((item) => item.id === patient.status);
                        return (
                          <tr key={patient.id}>
                            <td>{index + 1}</td>
                            <td className="nm">
                              <Link href={`/crm/bemorlar/${patient.id}`}>{patient.name}</Link>
                            </td>
                            <td>{patient.phone || "—"}</td>
                            <td>{formatDotDate(patient.lastVisit, "—")}</td>
                            <td>{formatDotDate(patient.nextVisit, "—")}</td>
                            <td className={debt ? "debt" : ""}>{som(debt)}</td>
                            <td>
                              <span className={`kd-st ${patient.status}`}>{status?.label ?? "Faol"}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="kd-card">
                <div className="kd-card-h">
                  <h2>Xodimlar</h2>
                  <Link className="kd-link" href="/klinika">
                    {team.length ? "Barchasini ko‘rish" : "Xodim qo‘shish"} <ArrowRight className="i" />
                  </Link>
                </div>
                {staff.length === 0 ? (
                  <p className="kd-empty">Xodimlarni qo‘shsangiz, ular shu yerda ko‘rinadi.</p>
                ) : (
                  <ul className="kd-staff">
                    {staff.map((person) => (
                      <li key={person.id}>
                        <span className="kd-staff-ph">
                          {person.avatar ? <img src={person.avatar} alt="" /> : <span className="kd-initials">{initials(person.name)}</span>}
                          {person.online ? <i aria-label="Bugun ishda" /> : null}
                        </span>
                        <b>{person.name}</b>
                        <small>{person.role}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>

          <aside className="kd-right">
            <section className="kd-card kd-cal">
              <div className="kd-card-h">
                <h2>Kalendar</h2>
                <Link className="kd-link" href="/crm/uchrashuvlar">Barchasini ko‘rish <ArrowRight className="i" /></Link>
              </div>
              <div className="kd-cal-h">
                <b>{MONTHS[month.getMonth()][0].toUpperCase()}{MONTHS[month.getMonth()].slice(1)} {month.getFullYear()}</b>
                <span>
                  <button type="button" aria-label="Oldingi oy" onClick={() => setCalMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="i" /></button>
                  <button type="button" aria-label="Keyingi oy" onClick={() => setCalMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="i" /></button>
                </span>
              </div>
              <div className="kd-cal-grid">
                {["Du", "Se", "Cho", "Pa", "Ju", "Sha", "Ya"].map((name) => <small key={name}>{name}</small>)}
                {calDays.map((cell, index) =>
                  cell ? (
                    <button
                      key={cell.key}
                      type="button"
                      className={[cell.key === day ? "on" : "", now && cell.key === iso(now) ? "today" : "", cell.busy ? "busy" : ""].filter(Boolean).join(" ") || undefined}
                      aria-pressed={cell.key === day}
                      aria-label={labelOf(cell.d)}
                      onClick={() => setDate(cell.d)}
                    >
                      {cell.d.getDate()}
                    </button>
                  ) : (
                    <span key={`e${index}`} />
                  ),
                )}
              </div>
              <p className="kd-cal-key"><i className="today" /> Bugun <i className="busy" /> Qabul bor</p>
            </section>
            <section className="kd-card">
              <div className="kd-card-h">
                <h2>Daromad statistikasi</h2>
                <button type="button" className="kd-select" onClick={() => setRange(range === 6 ? 3 : 6)}>
                  Oxirgi {range} oy <ChevronRight className="i" />
                </button>
              </div>
              {barMax === 0 ? (
                <p className="kd-empty">
                  To‘lovlar kiritilgach, oylik daromad grafigi shu yerda chiziladi. <Link href="/crm/tolovlar">To‘lov qo‘shish</Link>
                </p>
              ) : (
                <div className="kd-chart" data-testid="clinic-revenue">
                  <div className="kd-axis" aria-hidden>
                    {[4, 3, 2, 1, 0].map((step) => (
                      <span key={step}>{step === 0 ? "0" : compactMoney((axisTop / 4) * step)}</span>
                    ))}
                  </div>
                  <div className="kd-bars">
                    {bars.map((bar, index) => {
                      const last = index === bars.length - 1;
                      return (
                        <div className="kd-bar-col" key={`${bar.label}-${index}`}>
                          <div className="kd-bar-track">
                            {last && bar.value > 0 ? <span className="kd-tip">{som(bar.value)}</span> : null}
                            <span className={last ? "kd-bar now" : "kd-bar"} style={{ height: `${axisTop ? (bar.value / axisTop) * 100 : 0}%` }} title={som(bar.value)} />
                          </div>
                          <small>{bar.label}</small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="kd-card">
              <div className="kd-card-h">
                <h2>Ombor ogohlantirishlari</h2>
                <Link className="kd-link" href="/crm/ombor">
                  Barchasini ko‘rish <ArrowRight className="i" />
                </Link>
              </div>
              {alerts.length === 0 ? (
                <p className="kd-empty">{stock.length ? "Hamma material yetarli." : "Omborga material qo‘shsangiz, kam qolganlari shu yerda chiqadi."}</p>
              ) : (
                <ul className="kd-alerts">
                  {alerts.map((item) => {
                    const qty = Number(item.qty) || 0;
                    const critical = qty === 0 || qty <= Math.floor(Number(item.min) / 2);
                    return (
                      <li key={item.id}>
                        <Link href="/crm/ombor">
                          <span className="kd-thumb">{item.image ? <img src={item.image} alt="" /> : null}</span>
                          <span className="kd-alert-t">
                            <b>{item.name}</b>
                            <small>{item.supplier || item.category}</small>
                          </span>
                          <span className={critical ? "kd-pill red" : "kd-pill amber"}>
                            {qty === 0 ? "Tugagan" : critical ? `${qty} dona qoldi` : `Tugayapti (${qty} dona)`}
                          </span>
                          <ArrowRight className="i kd-go" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link className="kd-btn solid block" href="/marketplace">
                Marketplacedan buyurtma qilish <ArrowRight className="i" />
              </Link>
            </section>

            <section className="kd-card">
              <div className="kd-card-h">
                <h2>Faol laboratoriya buyurtmalari</h2>
                <Link className="kd-link" href="/laboratoriya/buyurtmalarim">
                  Barchasini ko‘rish <ArrowRight className="i" />
                </Link>
              </div>
              {openLab.length === 0 ? (
                <p className="kd-empty">
                  Faol buyurtma yo‘q. <Link href="/laboratoriya">Laboratoriya tanlash</Link>
                </p>
              ) : (
                <div className="kd-table-wrap">
                  <table className="kd-table kd-lab">
                    <thead>
                      <tr>
                        <th>Bemor</th>
                        <th>Ish turi</th>
                        <th className="mat">Material</th>
                        <th>Holat</th>
                        <th>Muddat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openLab.map((order) => {
                        const due = new Date(new Date(order.createdAt).getTime() + order.dueDays * DAY_MS);
                        return (
                          <tr key={order.id}>
                            <td className="nm">{order.patientCode}</td>
                            <td>{labServiceLabel(order.service)}</td>
                            <td className="mat">{labMaterialLabel(order.material)}</td>
                            <td>
                              <span className={`kd-lab-st ${order.status}`}>{orderStatusCopy[order.status].label}</span>
                            </td>
                            <td>{formatDotDate(iso(due), "—")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {patientOpen ? (
        <div className="hub-modal" onClick={() => setPatientOpen(false)}>
          <form
            className="hub-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const name = String(data.get("name") || "").trim();
              const phone = String(data.get("phone") || "").trim();
              const row: Patient = {
                id: `p-${Date.now()}`,
                num: patients.length + 1,
                name: name || "Bemor",
                age: 0,
                gender: "Ayol",
                phone,
                city: clinicCity,
                status: "yangi",
                lastVisit: "",
                nextVisit: "",
                avatar: "",
                email: "",
                created: iso(new Date()),
                addedAt: Date.now(),
                teeth: {},
                visits: [],
                payments: [],
                docs: [],
              };
              setPatients((prev) => [row, ...prev]);
              setPatientOpen(false);
            }}
          >
            <h3>Bemor qo‘shish</h3>
            <label htmlFor="kd-p-name">Ism familiya</label>
            <input id="kd-p-name" name="name" required />
            <label htmlFor="kd-p-phone">Telefon</label>
            <input id="kd-p-phone" name="phone" required placeholder="+998" />
            <div className="hub-actions">
              <button className="hub-btn" type="submit">
                Saqlash
              </button>
              <button className="hub-btn ghost" type="button" onClick={() => setPatientOpen(false)}>
                Bekor
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {bookOpen ? (
        <div className="hub-modal" onClick={() => setBookOpen(null)}>
          <form
            className="hub-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const name = String(data.get("name") || "Bemor").trim() || "Bemor";
              const note = String(data.get("note") || "Qabul").trim() || "Qabul";
              const appt: Appointment = {
                id: `user-${Date.now()}`,
                date: day,
                start: bookOpen.time,
                end: `${String(Math.floor((minutes(bookOpen.time) + 30) / 60)).padStart(2, "0")}:${String((minutes(bookOpen.time) + 30) % 60).padStart(2, "0")}`,
                patient: name,
                avatar: patients.find((item) => item.name === name)?.avatar || "",
                service: note,
                doctor: profile?.fullName || "Shifokor",
                doctorId: "self",
                room: apptRooms[CHAIRS.findIndex((chair) => chair.id === bookOpen.chair)] ?? bookOpen.chair,
                status: "tasdiq",
              };
              setAppointments((prev) => [appt, ...prev]);
              setBookOpen(null);
            }}
          >
            <h3>
              Qabulga yozish · {CHAIRS.find((chair) => chair.id === bookOpen.chair)?.name} · {bookOpen.time}
            </h3>
            <label htmlFor="kd-b-name">Bemor</label>
            <input id="kd-b-name" name="name" list="kd-patients" required />
            <datalist id="kd-patients">
              {patients.map((patient) => (
                <option key={patient.id} value={patient.name} />
              ))}
            </datalist>
            <label htmlFor="kd-b-note">Sabab</label>
            <input id="kd-b-note" name="note" placeholder="Konsultatsiya" />
            <div className="hub-actions">
              <button className="hub-btn" type="submit">
                Yozish
              </button>
              <button className="hub-btn ghost" type="button" onClick={() => setBookOpen(null)}>
                Bekor
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {settings ? (
        <div className="hub-modal" onClick={() => setSettings(false)}>
          <form
            className="hub-dialog"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void updateProfile({ clinic: String(data.get("name") || clinicName).trim() });
              setSettings(false);
            }}
          >
            <h3>Sozlamalar</h3>
            <label htmlFor="kd-s-name">Klinika nomi</label>
            <input id="kd-s-name" name="name" defaultValue={clinicName} />
            <div className="hub-actions">
              <button className="hub-btn" type="submit">
                Saqlash
              </button>
              <button className="hub-btn ghost" type="button" onClick={() => setSettings(false)}>
                Bekor
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </ShopShell>
  );
}

/** The slot whose time has started and the next one has not. */
function isCurrent(time: string, slots: SlotView[], now: Date) {
  const current = now.getHours() * 60 + now.getMinutes();
  const index = slots.findIndex((slot) => slot.time === time);
  const start = minutes(time);
  const next = slots[index + 1] ? minutes(slots[index + 1].time) : start + 60;
  return current >= start && current < next;
}

function Kpi({
  icon,
  label,
  value,
  note,
  change = null,
  tone = "teal",
  testId,
  meter,
  ring,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  change?: number | null;
  tone?: "teal" | "orange";
  testId?: string;
  meter?: number;
  ring?: number;
}) {
  return (
    <article className="kd-kpi">
      <span className={`kd-kpi-ic ${tone}`}>{icon}</span>
      <div>
        <span className="kd-kpi-l">{label}</span>
        <span className="kd-kpi-v">
          <b data-testid={testId}>{value}</b>
          {change !== null ? (
            <em className={change < 0 ? "down" : ""}>
              <ArrowUp className="i" /> {Math.abs(change)}%
            </em>
          ) : null}
        </span>
        <small>{note}</small>
        {meter !== undefined ? <span className="kd-meter" aria-hidden><i style={{ width: `${Math.min(100, meter)}%` }} /></span> : null}
      </div>
      {ring !== undefined ? (
        <svg className="kd-ring" viewBox="0 0 44 44" aria-hidden>
          <circle cx="22" cy="22" r="18" className="bg" />
          <circle cx="22" cy="22" r="18" className="fg" strokeDasharray={`${(Math.min(100, ring) / 100) * 113.1} 113.1`} transform="rotate(-90 22 22)" />
        </svg>
      ) : null}
    </article>
  );
}

function SlotRow({ slot, current, onFree }: { slot: SlotView; current: boolean; onFree: () => void }) {
  if (slot.kind === "lunch") {
    return (
      <div className="kd-slot lunch">
        <time>{slot.time}</time>
        <span>— Tushlik</span>
      </div>
    );
  }
  if (slot.kind === "free") {
    return (
      <div className={current ? "kd-slot now" : "kd-slot"}>
        <time>{slot.time}</time>
        <button type="button" className="kd-free" onClick={onFree}>
          <Plus className="i" /> Bemor qabul qilish
        </button>
      </div>
    );
  }
  const { appt } = slot;
  return (
    <div className={current ? "kd-slot now" : "kd-slot"}>
      <time>{slot.time}</time>
      <span className="kd-av">{appt.avatar ? <img src={appt.avatar} alt="" /> : initials(appt.patient)}</span>
      <span className="kd-who">
        <b>{appt.patient}</b>
        <small>{appt.service}</small>
      </span>
      {STATUS_PILL[appt.status] ? <span className={`kd-apst ${appt.status}`}>{STATUS_PILL[appt.status]}</span> : null}
      <Link className="kd-more" href="/crm/uchrashuvlar" aria-label={`${appt.patient} uchrashuvi`}>
        <MoreHorizontal className="i" />
      </Link>
    </div>
  );
}
