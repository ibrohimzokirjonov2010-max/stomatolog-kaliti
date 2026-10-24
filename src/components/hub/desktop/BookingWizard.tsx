"use client";
/* eslint-disable @next/next/no-img-element -- patient photos are local uploads */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Armchair, ArrowRight, Bell, CalendarDays, Check, ChevronRight, Clock, FileText, Pencil, Search, UserRound, Wallet, X } from "lucide-react";
import { patientStatuses, type Appointment, type Patient } from "@/data/crm";
import { SERVICES_KEY, categoryOf, type ClinicService } from "@/lib/crm-services";
import { formatDotDate, formatGroupedNumber } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";
import "./booking-wizard.css";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const STEPS = ["Bemor", "Xizmat", "Taqvim", "Tasdiqlash"] as const;
const TIMES = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];
const DURATIONS = [15, 30, 45, 60, 90, 120];
const QUICK = [
  { id: "all", label: "Barchasi" },
  { id: "recent", label: "So‘nggi bemorlar" },
  { id: "debt", label: "Qarzdorlik bor" },
  { id: "active", label: "Faol bemorlar" },
] as const;

export type Chair = { id: string; name: string };

function iso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function fromIso(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toMin(time: string) {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toTime(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/** Event-time values; kept outside the component so render stays pure. */
function stamp() {
  return { now: Date.now(), today: iso(new Date()) };
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

/** Clinic "Yangi qabul yozish" dialog (mock "qabulga yozish"): patient → service → time → confirm. */
export function BookingWizard({
  chairs,
  initial,
  patients,
  appointments,
  doctor,
  city,
  roomOf,
  debtOf,
  onAddPatient,
  onSave,
  onClose,
}: {
  chairs: Chair[];
  initial: { chair: string; time: string; date: string };
  patients: Patient[];
  appointments: Appointment[];
  doctor: string;
  city: string;
  roomOf: (chairId: string) => string;
  debtOf: (patient: Patient) => number;
  onAddPatient: (patient: Patient) => void;
  onSave: (appt: Appointment) => void;
  onClose: () => void;
}) {
  const [services] = useStoredList<ClinicService>(SERVICES_KEY, []);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"old" | "new">(patients.length ? "old" : "new");
  const [q, setQ] = useState("");
  const [quick, setQuick] = useState<(typeof QUICK)[number]["id"]>("all");
  const [patientId, setPatientId] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [serviceText, setServiceText] = useState("");
  const [chair, setChair] = useState(initial.chair);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [length, setLength] = useState(30);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patient = patients.find((item) => item.id === patientId) ?? null;
  const service = services.find((item) => item.id === serviceId) ?? null;
  const chairName = chairs.find((item) => item.id === chair)?.name ?? chair;
  const when = fromIso(date);
  const end = toTime(toMin(time) + length);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    const digits = query.replace(/\D/g, "");
    let rows = patients.filter((item) => !query || item.name.toLowerCase().includes(query) || (digits && item.phone.replace(/\D/g, "").includes(digits)));
    if (quick === "debt") rows = rows.filter((item) => debtOf(item) > 0);
    if (quick === "active") rows = rows.filter((item) => item.status === "faol" || item.status === "davolanishda");
    if (quick === "recent") rows = [...rows].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0) || (b.created || "").localeCompare(a.created || ""));
    return rows.slice(0, 6);
  }, [debtOf, patients, q, quick]);

  // Times already taken in this chair on the chosen day.
  const busy = useMemo(() => {
    const room = roomOf(chair);
    return appointments.filter((item) => item.date === date && item.status !== "bekor" && (item.room === room || item.room === chair || item.room === chairName));
  }, [appointments, chair, chairName, date, roomOf]);
  const clash = (start: string, minutes: number) => busy.some((item) => toMin(start) < toMin(item.end || toTime(toMin(item.start) + 30)) && toMin(item.start) < toMin(start) + minutes);

  const name = patient?.name ?? newName.trim();
  const serviceName = service?.name ?? serviceText.trim();

  function next() {
    setError("");
    if (step === 0) {
      if (mode === "old" && !patient) return setError("Bemorni tanlang.");
      if (mode === "new" && (newName.trim().length < 2 || newPhone.replace(/\D/g, "").length < 9)) return setError("Ism va telefon raqamini kiriting.");
    }
    if (step === 1 && !serviceName) return setError("Xizmatni tanlang yoki yozing.");
    if (step === 2 && clash(time, length)) return setError("Bu vaqt shu kresloda band. Boshqa vaqt tanlang.");
    if (step < 3) {
      if (step === 1 && service) setLength(service.minutes || 30);
      setStep(step + 1);
      return;
    }
    save();
  }

  function save() {
    const t = stamp();
    let who = patient;
    if (!who) {
      who = {
        id: `p-${t.now}`,
        num: patients.length + 1,
        name: newName.trim(),
        age: 0,
        gender: "Ayol",
        phone: newPhone.trim(),
        city,
        status: "yangi",
        lastVisit: "",
        nextVisit: "",
        avatar: "",
        email: "",
        created: t.today,
        addedAt: t.now,
        teeth: {},
        visits: [],
        payments: [],
        docs: [],
      } as Patient;
      onAddPatient(who);
    }
    onSave({
      id: `user-${t.now}`,
      date,
      start: time,
      end,
      patient: who.name,
      avatar: who.avatar || "",
      service: note.trim() ? `${serviceName} · ${note.trim()}` : serviceName,
      doctor,
      doctorId: "self",
      room: roomOf(chair),
      status: "tasdiq",
      isNew: !patient,
    });
  }

  const status = patient ? patientStatuses.find((item) => item.id === patient.status) : null;

  return (
    <div className="bw" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="bw-box" role="dialog" aria-modal="true" aria-labelledby="bw-title" data-testid="booking-wizard">
        <div className="bw-main">
          <header className="bw-head">
            <span className="bw-logo"><CalendarDays /></span>
            <div>
              <h2 id="bw-title">Yangi qabul yozish</h2>
              <p>{chairName} · {when.getDate()}-{MONTHS[when.getMonth()]} {when.getFullYear()} · {time}</p>
            </div>
          </header>
          <ol className="bw-steps">
            {STEPS.map((label, index) => (
              <li key={label} className={index === step ? "on" : index < step ? "done" : undefined}>
                <button type="button" disabled={index > step} onClick={() => setStep(index)}>
                  <i>{index < step ? <Check /> : index + 1}</i>
                  {label}
                </button>
              </li>
            ))}
          </ol>

          <div className="bw-body">
            {step === 0 ? (
              <>
                <div className="bw-sec-h">
                  <span><h3>Bemor ma’lumotlari</h3><p>Mavjud bemorni tanlang yoki yangi bemor qo‘shing</p></span>
                  <Link href="/crm/bemorlar">Bemorlar ro‘yxatiga o‘tish <ArrowRight /></Link>
                </div>
                <div className="bw-seg">
                  <button type="button" className={mode === "old" ? "on" : undefined} onClick={() => setMode("old")}>Mavjud bemor</button>
                  <button type="button" className={mode === "new" ? "on" : undefined} onClick={() => { setMode("new"); setPatientId(""); }}>Yangi bemor</button>
                </div>
                {mode === "old" ? (
                  <>
                    <label className="bw-search"><Search /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Bemor qidirish (ism, telefon)..." autoFocus /></label>
                    <p className="bw-lab">Tez tanlash</p>
                    <div className="bw-chips">
                      {QUICK.map((item) => <button key={item.id} type="button" className={quick === item.id ? "on" : undefined} onClick={() => setQuick(item.id)}>{item.label}</button>)}
                    </div>
                    <ul className="bw-list">
                      {list.length === 0 ? <li className="empty">{patients.length ? "Bemor topilmadi." : "Hali bemor yo‘q — “Yangi bemor”ni tanlang."}</li> : list.map((item) => {
                        const debt = debtOf(item);
                        const on = item.id === patientId;
                        return (
                          <li key={item.id}>
                            <button type="button" className={on ? "on" : undefined} aria-pressed={on} onClick={() => setPatientId(item.id)}>
                              <span className="ava">{item.avatar ? <img src={item.avatar} alt="" /> : initials(item.name)}</span>
                              <span className="who"><b>{item.name}</b><small>{item.phone || "—"}</small></span>
                              <span className="last"><small>Oxirgi tashrif</small><b>{formatDotDate(item.lastVisit, "—")}</b></span>
                              <span className={debt ? "pill debt" : "pill"}>{debt ? "Qarzdorlik" : patientStatuses.find((row) => row.id === item.status)?.label ?? "Faol"}</span>
                              <i className="radio">{on ? <Check /> : null}</i>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                ) : (
                  <div className="bw-form">
                    <label><span>Ism familiya *</span><input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Masalan: Aliyeva Malika" autoFocus /></label>
                    <label><span>Telefon *</span><input value={newPhone} onChange={(event) => setNewPhone(event.target.value)} inputMode="tel" placeholder="+998 90 123 45 67" /></label>
                    <p className="bw-hint">Bemor kartasi qabul bilan birga yaratiladi. Qolgan ma’lumotlarni keyin Bemorlar bo‘limida to‘ldirasiz.</p>
                  </div>
                )}
              </>
            ) : null}

            {step === 1 ? (
              <>
                <div className="bw-sec-h"><span><h3>Xizmat</h3><p>Klinika xizmatlaridan tanlang yoki o‘zingiz yozing</p></span><Link href="/crm/xizmatlar">Xizmatlar ro‘yxati <ArrowRight /></Link></div>
                {services.filter((item) => item.active).length ? (
                  <ul className="bw-services">
                    {services.filter((item) => item.active).map((item) => {
                      const on = item.id === serviceId;
                      const meta = categoryOf(item.category);
                      return (
                        <li key={item.id}>
                          <button type="button" className={on ? "on" : undefined} aria-pressed={on} onClick={() => { setServiceId(item.id); setServiceText(""); }}>
                            <img src={item.image} alt="" style={{ background: item.color }} />
                            <span className="who"><b>{item.name}</b><small style={{ color: meta.tone }}>{meta.label}</small></span>
                            <span className="last"><small><Clock /> {item.minutes} daq</small><b>{formatGroupedNumber(item.price)} so‘m</b></span>
                            <i className="radio">{on ? <Check /> : null}</i>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="bw-hint">Xizmatlar ro‘yxati bo‘sh. Xizmat nomini pastda yozing yoki Xizmatlar bo‘limida narxlarni qo‘shing.</p>}
                <label className="bw-free"><span>Yoki xizmatni yozing</span><input value={serviceText} onChange={(event) => { setServiceText(event.target.value); setServiceId(""); }} placeholder="Masalan: Konsultatsiya" /></label>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="bw-sec-h"><span><h3>Taqvim</h3><p>Kreslo, sana va vaqtni tanlang</p></span></div>
                <div className="bw-row3">
                  <label><span>Kreslo</span><select value={chair} onChange={(event) => setChair(event.target.value)}>{chairs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label><span>Sana</span><input type="date" value={date} onChange={(event) => event.target.value && setDate(event.target.value)} /></label>
                  <label><span>Davomiyligi</span><select value={length} onChange={(event) => setLength(Number(event.target.value))}>{DURATIONS.map((item) => <option key={item} value={item}>{item} daqiqa</option>)}</select></label>
                </div>
                <p className="bw-lab">Vaqt</p>
                <div className="bw-times">
                  {TIMES.map((item) => {
                    const taken = clash(item, length);
                    return <button key={item} type="button" disabled={taken} className={item === time ? "on" : undefined} onClick={() => setTime(item)} title={taken ? "Band" : undefined}>{item}</button>;
                  })}
                </div>
                {busy.length ? <p className="bw-hint">Shu kunda {chairName}da {busy.length} ta qabul bor — band vaqtlar o‘chirilgan.</p> : null}
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div className="bw-sec-h"><span><h3>Tasdiqlash</h3><p>Ma’lumotlarni tekshirib, qabulni saqlang</p></span></div>
                <dl className="bw-review">
                  <div><dt>Bemor</dt><dd>{name}{patient ? "" : " (yangi)"}</dd></div>
                  <div><dt>Xizmat</dt><dd>{serviceName}{service ? ` · ${formatGroupedNumber(service.price)} so‘m` : ""}</dd></div>
                  <div><dt>Kreslo</dt><dd>{chairName}</dd></div>
                  <div><dt>Vaqt</dt><dd>{when.getDate()}-{MONTHS[when.getMonth()]} {when.getFullYear()}, {time}–{end}</dd></div>
                  <div><dt>Shifokor</dt><dd>{doctor}</dd></div>
                </dl>
                <label className="bw-free"><span>Eslatma (ixtiyoriy)</span><textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Bemor haqida eslatma qo‘shing..." /></label>
              </>
            ) : null}
          </div>

          <footer className="bw-foot">
            {error ? <p role="alert">{error}</p> : <span />}
            <button type="button" className="bw-cancel" onClick={step ? () => setStep(step - 1) : onClose}>{step ? "Orqaga" : "Bekor"}</button>
            <button type="button" className="bw-next" onClick={next} data-testid="bw-next">{step < 3 ? "Keyingi bosqich" : "Qabulni saqlash"} <ArrowRight /></button>
          </footer>
        </div>

        <aside className="bw-side">
          <button type="button" className="bw-x" aria-label="Yopish" onClick={onClose}><X /></button>
          <section className="bw-chair">
            <i><Armchair /></i>
            <span><b>{chairName}</b><small>Stomatologik kabinet</small></span>
            <em className={clash(time, length) ? "busy" : undefined}>{clash(time, length) ? "Band" : "Bo‘sh"}</em>
          </section>
          <h4>Tanlangan vaqt <button type="button" onClick={() => setStep(2)}><Pencil /> O‘zgartirish</button></h4>
          <div className="bw-when">
            <p><CalendarDays /><span><b>{when.getDate()}-{MONTHS[when.getMonth()]} {when.getFullYear()}</b><small>{WEEKDAYS[when.getDay()]}</small></span></p>
            <p><Clock /><span><b>{time} – {end}</b><small>{length} daqiqa</small></span></p>
          </div>
          <h4>Bemor {name ? <button type="button" onClick={() => setStep(0)}><Pencil /> O‘zgartirish</button> : null}</h4>
          {name ? (
            <div className="bw-person">
              <span className="ava">{patient?.avatar ? <img src={patient.avatar} alt="" /> : initials(name)}</span>
              <span><b>{name}</b><small>{patient?.phone || newPhone || "—"}</small></span>
              <ChevronRight />
            </div>
          ) : <p className="bw-muted">Bemor tanlanmagan.</p>}
          {patient?.lastVisit ? (
            <div className="bw-remind"><Bell /><span><b>Eslatma</b><small>Bemorning oxirgi tashrifi {formatDotDate(patient.lastVisit, "—")}</small></span></div>
          ) : null}
          {patient ? (
            <>
              <h4>Tez ma’lumot <Link href={`/crm/bemorlar/${patient.id}`}>Batafsil profil <ArrowRight /></Link></h4>
              <div className="bw-facts">
                <p><UserRound /><span><small>Yosh</small><b>{patient.age || "—"}</b></span></p>
                <p><UserRound /><span><small>Jinsi</small><b>{patient.gender}</b></span></p>
                <p><Wallet /><span><small>Qarzdorlik</small><b>{formatGroupedNumber(debtOf(patient))} so‘m</b></span></p>
                <p><FileText /><span><small>Holat</small><b>{status?.label ?? "Faol"}</b></span></p>
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
