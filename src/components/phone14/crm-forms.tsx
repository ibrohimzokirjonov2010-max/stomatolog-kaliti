"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Camera, Check, ChevronDown, ChevronLeft, Clock, CreditCard, Minus, Pencil, Plus, QrCode, Save, Search, Trash2, UserRound, Wallet, X } from "lucide-react";
import { ToothChart, ToothLegend } from "@/components/phone14/teeth";
import { Sheet } from "@/components/phone14/chrome";
import {
  PHONE_PATIENTS_KEY,
  PHONE_PAYS_KEY,
  PHONE_PLANS_KEY,
  phonePatients,
  readPhoneStore,
  writePhoneStore,
  type PhonePatient,
} from "@/data/phone14";
import { CLINIC_PAYS_KEY, CLINIC_PLANS_KEY, loadClinic, patientPlans, type ClinicPayment, type ClinicPlan } from "@/data/phone-records";
import { findQueueItem, finishPaid, saveQueueItem } from "@/data/phone-queue";
import { formatGroupedNumber } from "@/lib/format";

const DOCTORS = ["Dr. Ibrohim", "Dr. Aziza", "Dr. Kamron"];
const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Namangan", "Farg‘ona"];
const SOURCES = ["Telegram / Instagram", "Do‘stlar", "Google", "Tavsiya", "Boshqa"];
const CONDITIONS = ["Diabet", "Gipertoniya", "Allergiya", "Homiladorlik"];
const SERVICES = ["Konsultatsiya", "Kompozit plomba", "Endodontik davolash", "Implant qo‘yish", "Krona (keramika)", "Professional gigiyena"];
const TIMES = Array.from({ length: 18 }, (_, i) => {
  const hour = 9 + Math.floor(i / 2);
  return `${String(hour).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
});
const EMPTY_PATIENT = { ism: "", familiya: "", prefix: "+998", phone: "", birth: "", gender: "", city: "", address: "", email: "", source: "", note: "" };

type ServiceRow = { id: string; name: string; tooth: string; qty: number; price: number };

function money(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

function ageOn(iso: string) {
  if (!iso) return 0;
  const born = new Date(iso);
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const month = today.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < born.getDate())) age -= 1;
  return Math.max(0, age);
}

function maskPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean).join(" ");
}

function allPatients() {
  const extra = readPhoneStore<PhonePatient>(PHONE_PATIENTS_KEY);
  const ids = new Set(extra.map((item) => item.id));
  return [...extra, ...phonePatients.filter((item) => !ids.has(item.id))];
}

function nextNum(extra: PhonePatient[]) {
  const used = new Set([...phonePatients, ...extra].map((item) => item.num));
  let n = 18;
  while (used.has(`B-${String(n).padStart(4, "0")}`)) n += 1;
  return `B-${String(n).padStart(4, "0")}`;
}

function useClinicPatients() {
  const [people, setPeople] = useState(phonePatients);
  useEffect(() => { setPeople(allPatients()); }, []);
  return people;
}

function FormScreen({ title, subtitle, back, testId, children }: { title: string; subtitle: string; back: string; testId: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="p14 crm crm-new lg:hidden" data-testid={testId}>
      <header className="crm-bar">
        <button type="button" aria-label="Orqaga" onClick={() => router.push(back)}><ChevronLeft /></button>
        <h1>{title}</h1>
        <button type="button" aria-label="Yopish" onClick={() => router.push(back)}><X /></button>
      </header>
      <p className="crm-sub">{subtitle}</p>
      {children}
    </div>
  );
}

function Field({ label, required, error, icon, children }: { label: string; required?: boolean; error?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <div className={error ? "crm-field bad" : "crm-field"}>
      <span className={icon ? "with-ico" : undefined}>{icon}{label}{required ? <i className="star"> *</i> : null}</span>
      {children}
      {error ? <span className="crm-err">{error}</span> : null}
    </div>
  );
}

function SelectBox({ label, value, onChange, options, icon, avatar }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; icon?: ReactNode; avatar?: string }) {
  return (
    <div className="crm-select">
      {avatar ? <img src={avatar} alt="" /> : icon}
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => <option key={item.value || "empty"} value={item.value}>{item.label}</option>)}
      </select>
      <ChevronDown />
    </div>
  );
}

export function PhoneAddPatient() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [form, setForm] = useState(EMPTY_PATIENT);
  const [conds, setConds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const found = editId ? allPatients().find((item) => item.id === editId) : null;
    if (!found) return;
    const [ism, ...rest] = found.name.split(" ");
    const digits = found.phone.replace(/\D/g, "");
    const local = digits.startsWith("998") ? digits.slice(3) : digits.slice(-9);
    setForm({
      ism,
      familiya: rest.join(" "),
      prefix: "+998",
      phone: maskPhone(local),
      birth: found.birth || "",
      gender: found.gender,
      city: found.city || "",
      address: found.address || "",
      email: found.email || "",
      source: found.source || "",
      note: found.note || "",
    });
    setConds(found.conditions || []);
    setPhoto(found.avatar);
  }, [editId]);

  function onFile(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setPhotoError("JPG yoki PNG, maksimum 5MB");
      return;
    }
    setPhotoError("");
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function save() {
    const next: Record<string, string> = {};
    if (!form.ism.trim()) next.ism = "Ism majburiy";
    if (!form.familiya.trim()) next.familiya = "Familiya majburiy";
    if (form.phone.replace(/\D/g, "").length < 9) next.phone = "Telefon majburiy";
    if (!form.birth) next.birth = "Tug‘ilgan sana majburiy";
    if (!form.gender) next.gender = "Jinsni tanlang";
    if (!form.city) next.city = "Shahar majburiy";
    if (!form.source) next.source = "Manbani tanlang";
    setErrors(next);
    if (Object.keys(next).length) return;
    const extra = readPhoneStore<PhonePatient>(PHONE_PATIENTS_KEY);
    const gender = (form.gender === "Erkak" || form.gender === "Boshqa" ? form.gender : "Ayol") as PhonePatient["gender"];
    const previous = editId ? allPatients().find((item) => item.id === editId) : null;
    const avatar = photo.startsWith("data:") && photo.length < 180_000 ? photo : photo.startsWith("/") ? photo : "/img/phone14/pat-0.png";
    const patient: PhonePatient = {
      id: editId || `b-${Date.now()}`,
      name: `${form.ism.trim()} ${form.familiya.trim()}`,
      num: previous?.num || nextNum(extra),
      age: ageOn(form.birth),
      gender,
      phone: `${form.prefix} ${form.phone.trim()}`,
      status: previous?.status || "yangi",
      statusLabel: previous?.statusLabel || "Yangi",
      last: previous?.last || "—",
      next: previous?.next || "—",
      tags: conds.length ? conds : previous?.tags || ["Yangi"],
      online: previous?.online || false,
      avatar,
      city: form.city,
      birth: form.birth,
      email: form.email.trim(),
      address: form.address.trim(),
      source: form.source,
      note: form.note.trim(),
      conditions: conds,
    };
    const stored = extra.some((item) => item.id === patient.id)
      ? extra.map((item) => item.id === patient.id ? patient : item)
      : [patient, ...extra];
    try { writePhoneStore(PHONE_PATIENTS_KEY, stored); }
    catch { writePhoneStore(PHONE_PATIENTS_KEY, stored.map((item) => item.id === patient.id ? { ...item, avatar: "/img/phone14/pat-0.png" } : item)); }
    router.push(`/crm/bemorlar/${patient.id}`);
  }

  return (
    <FormScreen title={editId ? "Bemorni tahrirlash" : "Yangi bemor qo‘shish"} subtitle="Bemor ma’lumotlarini kiriting" back="/crm/bemorlar" testId="phone-bemor-qoshish">
      <h2 className="crm-section">Asosiy ma’lumotlar</h2>
      <button type="button" className="ava-pick" onClick={() => fileRef.current?.click()} aria-label="Rasm qo‘shish">
        {photo ? <img src={photo} alt="" /> : <Camera size={22} />}
      </button>
      <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png" onChange={(event) => onFile(event.target.files?.[0])} />
      {photoError ? <p className="crm-err">{photoError}</p> : null}
      <Field label="Ism" required error={errors.ism}><input value={form.ism} placeholder="Ismni kiriting" onChange={(event) => setForm({ ...form, ism: event.target.value })} /></Field>
      <Field label="Familiya" required error={errors.familiya}><input value={form.familiya} placeholder="Familiyani kiriting" onChange={(event) => setForm({ ...form, familiya: event.target.value })} /></Field>
      <Field label="Tug‘ilgan sana" required error={errors.birth}><input type="date" value={form.birth} onChange={(event) => setForm({ ...form, birth: event.target.value })} /></Field>
      <Field label="Jinsi" required error={errors.gender}>
        <span className="seg" role="radiogroup" aria-label="Jinsi">
          {["Erkak", "Ayol", "Boshqa"].map((item) => (
            <button key={item} type="button" className={form.gender === item ? "on" : undefined} onClick={() => setForm({ ...form, gender: item })}>{item}</button>
          ))}
        </span>
      </Field>
      <h2 className="crm-section">Aloqa</h2>
      <Field label="Telefon" required error={errors.phone}>
        <span className="crm-phone">
          <span className="crm-select">
            <select aria-label="Kod" value={form.prefix} onChange={(event) => setForm({ ...form, prefix: event.target.value })}>
              <option>+998</option><option>+7</option><option>+1</option>
            </select>
            <ChevronDown />
          </span>
          <input inputMode="tel" placeholder="90 123 45 67" value={form.phone} onChange={(event) => setForm({ ...form, phone: maskPhone(event.target.value) })} />
        </span>
      </Field>
      <Field label="Email"><input type="email" inputMode="email" placeholder="example@mail.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
      <Field label="Shahar" required error={errors.city}>
        <SelectBox label="Shahar" value={form.city} onChange={(value) => setForm({ ...form, city: value })} options={[{ value: "", label: "Shaharni tanlang" }, ...CITIES.map((item) => ({ value: item, label: item }))]} icon={<UserRound />} />
      </Field>
      <Field label="Manzil"><input placeholder="Ko‘cha, uy, xonadon" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
      <Field label="Qayerdan bildi?" required error={errors.source}>
        <SelectBox label="Qayerdan bildi" value={form.source} onChange={(value) => setForm({ ...form, source: value })} options={[{ value: "", label: "Manbani tanlang" }, ...SOURCES.map((item) => ({ value: item, label: item }))]} />
      </Field>
      <h2 className="crm-section">Tibbiy ma’lumot</h2>
      <div className="allergy-chips">
        {CONDITIONS.map((item) => (
          <button key={item} type="button" className={conds.includes(item) ? "on" : undefined} onClick={() => setConds((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])}>{item}</button>
        ))}
      </div>
      <h2 className="crm-section">Izoh</h2>
      <Field label="Izoh">
        <textarea maxLength={500} placeholder="Bemor haqida qo‘shimcha ma’lumot" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
      </Field>
      <p className="crm-count">{form.note.length}/500</p>
      <button type="button" className="crm-save sticky-save" data-testid="patient-save" onClick={save}>Saqlash</button>
    </FormScreen>
  );
}

export function PhoneAddAppointment() {
  const router = useRouter();
  const params = useSearchParams();
  const preset = params.get("patient") || "";
  const [q, setQ] = useState("");
  const [patient, setPatient] = useState<PhonePatient | null>(null);
  const [qr, setQr] = useState(false);
  const [doctor, setDoctor] = useState("");
  const [chair, setChair] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [dur, setDur] = useState(0);
  const [sms, setSms] = useState(false);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const people = useClinicPatients();
  useEffect(() => {
    if (!preset) return;
    setPatient(people.find((item) => item.id === preset) ?? null);
  }, [people, preset]);
  const found = q.trim() ? people.filter((item) => `${item.name} ${item.phone} ${item.num}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5) : [];

  function save() {
    const next: Record<string, string> = {};
    if (!patient) next.patient = "Bemorni tanlang";
    if (!doctor) next.doctor = "Shifokor majburiy";
    if (!chair) next.chair = "Kreslo majburiy";
    if (!service) next.service = "Xizmat majburiy";
    if (!date) next.date = "Sanani tanlang";
    if (!time) next.time = "Vaqtni tanlang";
    if (!dur) next.dur = "Davomiylik majburiy";
    setErrors(next);
    if (Object.keys(next).length || !patient) return;
    const [hh, mm] = time.split(":").map(Number);
    const total = hh * 60 + mm + dur;
    const end = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    saveQueueItem({
      id: `q-${date}-${time.replace(":", "")}-${patient.id}`,
      patientId: patient.id,
      date,
      time,
      end,
      name: patient.name,
      service,
      age: patient.age,
      gender: patient.gender,
      tooth: "—",
      note: note || (sms ? "SMS eslatma yoqilgan" : "Yangi uchrashuv"),
      status: "keladi",
      statusLabel: "Keladigan",
      phone: patient.phone.replace(/\s/g, ""),
      avatar: patient.avatar,
      amount: 0,
    });
    router.push("/crm/uchrashuvlar");
  }

  return (
    <FormScreen title="Yangi uchrashuv" subtitle="Qabul ma’lumotlarini kiriting" back="/crm/uchrashuvlar" testId="phone-uchrashuv-qoshish">
      <Field label="Bemor" required error={errors.patient}>
        <span className="crm-find">
          <Search />
          <input placeholder="Ism, telefon yoki ID" value={q} onChange={(event) => setQ(event.target.value)} />
          <button type="button" aria-label="QR" onClick={() => setQr(true)}><QrCode /></button>
        </span>
      </Field>
      {found.map((item) => (
        <button key={item.id} type="button" className="crm-card" onClick={() => { setPatient(item); setQ(""); }}>
          <img src={item.avatar} alt="" /><span><b>{item.name}</b><small>#{item.num}</small></span>
        </button>
      ))}
      {patient ? (
        <article className="crm-card">
          <img src={patient.avatar} alt="" />
          <span><b>{patient.name}</b><small>ID: #{patient.num}</small></span>
          <button type="button" aria-label="Tozalash" onClick={() => setPatient(null)}><X /></button>
        </article>
      ) : null}
      <Field label="Shifokor" required error={errors.doctor}><SelectBox label="Shifokor" value={doctor} onChange={setDoctor} options={[{ value: "", label: "Shifokorni tanlang" }, ...DOCTORS.map((item) => ({ value: item, label: item }))]} icon={<UserRound />} /></Field>
      <Field label="Kreslo" required error={errors.chair}><SelectBox label="Kreslo" value={chair} onChange={setChair} options={[{ value: "", label: "Kresloni tanlang" }, ...["Kreslo 1", "Kreslo 2", "Kreslo 3"].map((item) => ({ value: item, label: item }))]} /></Field>
      <Field label="Xizmat" required error={errors.service}>
        <SelectBox label="Xizmat" value={service} onChange={setService} options={[{ value: "", label: "Xizmatni tanlang" }, ...SERVICES.map((item) => ({ value: item, label: item }))]} icon={<Wallet />} />
      </Field>
      <Field label="Sana" required error={errors.date}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
      <Field label="Vaqt" required error={errors.time}>
        <span className="crm-times">
          {TIMES.map((slot) => (
            <button key={slot} type="button" className={time === slot ? "on" : undefined} onClick={() => setTime(slot)}>{slot}</button>
          ))}
        </span>
      </Field>
      <Field label="Davomiyligi" required error={errors.dur}>
        <span className="crm-dur">
          {[30, 45, 60, 90].map((item) => <button key={item} type="button" className={dur === item ? "on" : undefined} onClick={() => setDur(item)}><Clock size={14} />{item} daqiqa</button>)}
        </span>
      </Field>
      <div className="crm-toggle">
        <span className="with-ico"><Bell size={16} /><span><b>SMS eslatma yuborish</b><small className="spec">Bemorga uchrashuvdan oldin eslatma yuboriladi</small></span></span>
        <button type="button" className={sms ? "crm-switch on" : "crm-switch"} aria-pressed={sms} onClick={() => setSms(!sms)}><i /></button>
      </div>
      <Field label="Izoh" icon={<Pencil size={14} />}><textarea maxLength={500} placeholder="Uchrashuv haqida izoh" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <p className="crm-count">{note.length}/500</p>
      <button type="button" className="crm-save sticky-save" onClick={save}><Save size={16} /> Saqlash</button>
      {qr ? (
        <Sheet title="QR skaner" onClose={() => setQr(false)}>
          <div className="scan fake" />
          <p>Kamerani ulang yoki bemorni qidiruv orqali tanlang.</p>
          <button type="button" className="crm-save" onClick={() => setQr(false)}>Yopish</button>
        </Sheet>
      ) : null}
    </FormScreen>
  );
}

export function PhoneAddPlan() {
  const router = useRouter();
  const params = useSearchParams();
  const preset = params.get("patient") || "";
  const people = useClinicPatients();
  const [patientId, setPatientId] = useState(preset);
  const [doctor, setDoctor] = useState("");
  const [title, setTitle] = useState("");
  const [dent, setDent] = useState<"katta" | "bola">("katta");
  const [picked, setPicked] = useState<string[]>([]);
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [discountOn, setDiscountOn] = useState(false);
  const [mode, setMode] = useState<"%" | "so‘m">("%");
  const [percent, setPercent] = useState(0);
  const [sumOff, setSumOff] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => { if (preset) setPatientId(preset); }, [preset]);
  const subtotal = rows.reduce((sum, row) => sum + row.qty * row.price, 0);
  const discount = discountOn ? (mode === "%" ? Math.round(subtotal * (Number(percent) || 0) / 100) : Math.min(subtotal, Number(sumOff) || 0)) : 0;
  const total = Math.max(0, subtotal - discount);
  const teeth = new Set(rows.map((row) => row.tooth).filter((item) => item && item !== "—"));
  const chosen = people.find((item) => item.id === patientId);

  function save() {
    const next: Record<string, string> = {};
    if (!patientId) next.patient = "Bemorni tanlang";
    if (!doctor) next.doctor = "Shifokor majburiy";
    if (!title.trim()) next.title = "Reja nomi majburiy";
    setErrors(next);
    if (Object.keys(next).length) return;
    const id = `r-${Date.now()}`;
    const patient = people.find((item) => item.id === patientId);
    const plan: ClinicPlan = {
      id,
      patientId,
      name: title.trim(),
      doctor,
      date: new Date().toLocaleDateString("uz-UZ", { day: "numeric", month: "short", year: "numeric" }),
      status: "Rejalashtirilgan",
      done: 0,
      stages: Math.max(1, rows.length),
      total,
      paid: 0,
      services: rows.map((row) => ({ name: row.name, tooth: row.tooth, price: row.qty * row.price, done: false })),
    };
    writePhoneStore(CLINIC_PLANS_KEY, [plan, ...readPhoneStore<ClinicPlan>(CLINIC_PLANS_KEY)]);
    writePhoneStore(PHONE_PLANS_KEY, [{ id, title: title.trim(), status: "Rejalashtirilgan", patient: patient?.name || "" }, ...readPhoneStore<{ id: string; title: string; status: string }>(PHONE_PLANS_KEY)]);
    router.push(patientId ? `/crm/bemorlar/${patientId}` : "/crm/davolash-rejalari");
  }

  return (
    <FormScreen title="Yangi davolash rejasi" subtitle="Davolash reja ma’lumotlarini kiriting" back="/crm/davolash-rejalari" testId="phone-reja-qoshish">
      <Field label="Bemor" required error={errors.patient}>
        <SelectBox label="Bemor" value={patientId} onChange={setPatientId} avatar={chosen?.avatar} options={[{ value: "", label: "Bemorni tanlang" }, ...people.map((item) => ({ value: item.id, label: item.name }))]} />
      </Field>
      {chosen ? <p className="spec">ID: #{chosen.num} · {chosen.phone}</p> : null}
      <Field label="Shifokor" required error={errors.doctor}><SelectBox label="Shifokor" value={doctor} onChange={setDoctor} options={[{ value: "", label: "Shifokorni tanlang" }, ...DOCTORS.map((item) => ({ value: item, label: item }))]} icon={<UserRound />} /></Field>
      <Field label="Reja nomi" required error={errors.title}><input value={title} placeholder="Reja nomi" onChange={(event) => setTitle(event.target.value)} /></Field>
      <div className="p14-head">
        <b>Tishlar (FDI)</b>
        <button type="button" className="rpt-link" onClick={() => setPicked([])}>Tozalash</button>
      </div>
      <span className="seg two"><button type="button" className={dent === "katta" ? "on" : undefined} onClick={() => setDent("katta")}>Katta</button><button type="button" className={dent === "bola" ? "on" : undefined} onClick={() => setDent("bola")}>Bola</button></span>
      <ToothChart mode={dent} selected={picked} onToggle={(id) => setPicked((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])} />
      <ToothLegend />
      <b>Xizmatlar</b>
      <table className="crm-table">
        <thead><tr><th>Xizmat</th><th>Tish</th><th>Soni</th><th>Narx</th><th>Jami</th><th /></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td><span className="tooth-chip">{row.tooth}</span></td>
              <td><span className="crm-qty"><button type="button" aria-label="Kamaytirish" onClick={() => setRows(rows.map((item) => item.id === row.id ? { ...item, qty: Math.max(1, item.qty - 1) } : item))}><Minus size={12} /></button>{row.qty}<button type="button" aria-label="Oshirish" onClick={() => setRows(rows.map((item) => item.id === row.id ? { ...item, qty: item.qty + 1 } : item))}><Plus size={12} /></button></span></td>
              <td><input aria-label={`${row.name} narxi`} inputMode="numeric" value={row.price} onChange={(event) => setRows(rows.map((item) => item.id === row.id ? { ...item, price: Number(event.target.value.replace(/\D/g, "")) || 0 } : item))} /></td>
              <td>{formatGroupedNumber(row.qty * row.price)}</td>
              <td><button type="button" aria-label="O‘chirish" onClick={() => setRows(rows.filter((item) => item.id !== row.id))}><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="p14-chip" onClick={() => setRows([...rows, { id: `n-${Date.now()}`, name: "Yangi xizmat", tooth: picked[0] || "—", qty: 1, price: 0 }])}>+ Xizmat qo‘shish</button>
      <div className="crm-toggle">
        <b>Chegirma</b>
        <button type="button" className={discountOn ? "crm-switch on" : "crm-switch"} aria-pressed={discountOn} onClick={() => setDiscountOn(!discountOn)}><i /></button>
      </div>
      {discountOn ? (
        <div className="list">
          <div className="crm-split">
            <span className="seg two">
              <button type="button" className={mode === "%" ? "on" : undefined} onClick={() => setMode("%")}>%</button>
              <button type="button" className={mode === "so‘m" ? "on" : undefined} onClick={() => setMode("so‘m")}>so‘m</button>
            </span>
            {mode === "%" ? <input aria-label="Chegirma foizi" value={percent} onChange={(event) => setPercent(Number(event.target.value) || 0)} /> : <input aria-label="Chegirma summasi" value={formatGroupedNumber(sumOff)} onChange={(event) => setSumOff(Number(event.target.value.replace(/\D/g, "")) || 0)} />}
          </div>
          <div className="green-card">{money(discount)}</div>
        </div>
      ) : null}
      <article className="p14-card">
        <div className="p14-head"><span>Jami summa<small className="spec">{rows.length} ta xizmat · {teeth.size} ta tish</small></span><b style={{ color: "#0E8F94", whiteSpace: "nowrap" }}>{money(total)}</b></div>
      </article>
      <button type="button" className="crm-save sticky-save" onClick={save}>Saqlash</button>
    </FormScreen>
  );
}

const PAY_METHODS = [
  { id: "Naqd", icon: "cash" },
  { id: "Karta", icon: "card" },
  { id: "Click", icon: "click" },
  { id: "Payme", icon: "payme" },
  { id: "O‘tkazma", icon: "wire" },
] as const;

export function PhoneAddPayment() {
  const router = useRouter();
  const params = useSearchParams();
  const visit = params.get("visit") || "";
  const presetPatient = params.get("patient") || "";
  const people = useClinicPatients();
  const [patientId, setPatientId] = useState(presetPatient);
  const [plan, setPlan] = useState(params.get("plan") || "");
  const [amount, setAmount] = useState(params.get("amount") || "");
  const [method, setMethod] = useState("");
  const [date, setDate] = useState("");
  const [receipt, setReceipt] = useState(false);
  const [note, setNote] = useState(params.get("notes") || "");
  const [planNames, setPlanNames] = useState<string[]>([]);
  const [debt, setDebt] = useState<{ total: number; paid: number; debt: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const patient = people.find((item) => item.id === patientId);

  useEffect(() => {
    if (presetPatient) setPatientId(presetPatient);
  }, [presetPatient]);

  useEffect(() => {
    if (!visit) return;
    const appt = findQueueItem(visit);
    if (appt?.date) setDate(appt.date);
  }, [visit]);

  useEffect(() => {
    if (!patientId) {
      setPlanNames([]);
      setDebt(null);
      return;
    }
    setPlanNames(patientPlans(patientId).map((item) => item.name));
    const clinic = loadClinic(patientId);
    if (!clinic) {
      setDebt(null);
      return;
    }
    const paid = clinic.payments.reduce((sum, item) => sum + item.amount, 0);
    const planTotal = clinic.plans.reduce((sum, item) => sum + item.total, 0);
    const unpaid = clinic.visits.filter((item) => item.unpaid).reduce((sum, item) => sum + item.cost, 0);
    setDebt({ total: planTotal + unpaid, paid, debt: Math.max(0, planTotal - paid) + unpaid });
  }, [patientId]);

  function save() {
    const next: Record<string, string> = {};
    if (!patientId) next.patient = "Bemorni tanlang";
    if (!(Number(amount) > 0)) next.amount = "Summa majburiy";
    if (!method) next.method = "To‘lov usulini tanlang";
    if (!date) next.date = "Sana majburiy";
    setErrors(next);
    if (Object.keys(next).length) return;
    const value = Number(amount);
    if (visit) {
      const appt = findQueueItem(visit);
      if (appt) finishPaid({ ...appt, note: note || appt.note }, note, { amount: value, method, plan: plan || appt.service, date });
      router.push("/crm/uchrashuvlar");
      return;
    }
    const pay: ClinicPayment = {
      id: `pay-${Date.now()}`,
      patientId,
      date,
      amount: value,
      method,
      plan: plan || "To‘lov",
      receipt: receipt ? `CHK-${Date.now().toString().slice(-4)}` : "—",
    };
    writePhoneStore(CLINIC_PAYS_KEY, [pay, ...readPhoneStore<ClinicPayment>(CLINIC_PAYS_KEY)]);
    writePhoneStore(PHONE_PAYS_KEY, [{ id: pay.id, name: patient?.name || "Bemor", amount: money(value), note: note || pay.plan, date, status: "To‘langan", avatar: patient?.avatar || "/img/phone14/pat-0.png", late: false }, ...readPhoneStore<{ id: string }>(PHONE_PAYS_KEY)]);
    router.push(patientId ? `/crm/bemorlar/${patientId}` : "/crm/tolovlar");
  }

  const planOptions = [{ value: "", label: "Rejani tanlang" }, ...planNames.map((item) => ({ value: item, label: item }))];
  if (plan && !planNames.includes(plan)) planOptions.push({ value: plan, label: plan });

  return (
    <FormScreen title="Yangi to‘lov qo‘shish" subtitle="To‘lov ma’lumotlarini kiriting" back={visit ? "/crm/uchrashuvlar" : "/crm/tolovlar"} testId="phone-tolov-qoshish">
      <Field label="Bemor" required error={errors.patient}>
        <SelectBox label="Bemor" value={patientId} onChange={setPatientId} avatar={patient?.avatar} options={[{ value: "", label: "Bemorni tanlang" }, ...people.map((item) => ({ value: item.id, label: item.name }))]} />
      </Field>
      {patient ? <p className="spec">ID: #{patient.num} · {patient.phone}</p> : null}
      <Field label="Davolash rejasi" error={errors.plan}>
        <SelectBox label="Davolash rejasi" value={plan} onChange={setPlan} options={planOptions} icon={<Wallet />} />
      </Field>
      {debt ? (
        <article className="debt">
          <small>Qarz</small>
          <b>{money(debt.debt)}</b>
          <p className="spec">Umumiy: {money(debt.total)}</p>
          <p className="spec">To‘langan: {money(debt.paid)}</p>
        </article>
      ) : null}
      <Field label="Summa" required error={errors.amount}>
        <span className="crm-phone">
          <input inputMode="numeric" value={amount ? formatGroupedNumber(Number(amount) || 0) : ""} placeholder="0" onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
          <span className="p14-filter">so‘m</span>
        </span>
      </Field>
      <Field label="To‘lov usuli" required error={errors.method}>
        <span className="pay-methods">
          {PAY_METHODS.map((item) => (
            <button key={item.id} type="button" data-testid={`pay-method-${item.id}`} className={method === item.id ? "on" : undefined} onClick={() => setMethod(item.id)}>
              {method === item.id ? <span className="tick"><Check size={10} /></span> : null}
              {item.icon === "click" ? <img src="/img/phone14/logo-click.png" alt="Click" /> : item.icon === "payme" ? <img src="/img/phone14/logo-payme.png" alt="Payme" /> : item.icon === "card" ? <CreditCard size={16} /> : <Wallet size={16} />}
              {item.id}
            </button>
          ))}
        </span>
      </Field>
      <Field label="Sana" required error={errors.date}><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
      <div className="crm-toggle">
        <span><b>Chek chiqarish</b><small className="spec">To‘lov uchun fiskal chek chiqarish</small></span>
        <button type="button" className={receipt ? "crm-switch on" : "crm-switch"} aria-pressed={receipt} onClick={() => setReceipt(!receipt)}><i /></button>
      </div>
      <Field label="Izoh"><textarea maxLength={500} placeholder="To‘lov haqida izoh" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <p className="crm-count">{note.length}/500</p>
      <button type="button" className="crm-save sticky-save" data-testid="pay-save" onClick={save}>Saqlash</button>
    </FormScreen>
  );
}
