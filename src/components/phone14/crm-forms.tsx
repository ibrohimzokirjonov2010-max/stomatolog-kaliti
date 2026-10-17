"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CalendarPlus, Check, ChevronLeft, CreditCard, Minus, Pencil, Phone, Plus, QrCode, Trash2, Wallet, X } from "lucide-react";
import { Sheet } from "@/components/phone14/chrome";
import {
  PHONE_APPTS_KEY,
  PHONE_PATIENTS_KEY,
  PHONE_PAYS_KEY,
  PHONE_PLANS_KEY,
  findPhonePatient,
  phonePatients,
  readPhoneStore,
  writePhoneStore,
  type PhonePatient,
} from "@/data/phone14";
import { formatGroupedNumber } from "@/lib/format";

const CLINIC_TODAY = new Date(2024, 9, 17);
const ADULT = [
  ["18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28"],
  ["48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38"],
];
const BABY = [
  ["55", "54", "53", "52", "51", "61", "62", "63", "64", "65"],
  ["85", "84", "83", "82", "81", "71", "72", "73", "74", "75"],
];
const KIND: Record<string, string> = { "16": "implant", "14": "plomba", "11": "endo", "26": "krona", "31": "implant", "36": "plomba" };
const KIND_COLOR: Record<string, string> = { sog: "#e8eef5", plomba: "#f5c518", endo: "#ef4444", krona: "#7c5cfc", implant: "#2f6bff", gone: "#94a3b8", pick: "#0E8F94" };
const DOCTORS = ["Dr. Ibrohim", "Dr. Aziza", "Dr. Kamron"];
const CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Namangan", "Farg‘ona"];
const SOURCES = ["Telegram / Instagram", "Do‘stlar", "Google", "Tavsiya", "Boshqa"];
const CONDITIONS = ["Diabet", "Gipertoniya", "Allergiya", "Homiladorlik"];
const DAYS = [
  ["Dush", 14], ["Sesh", 15], ["Chor", 16], ["Pay", 17], ["Jum", 18], ["Shan", 19], ["Yak", 20],
] as const;
const TIMES = Array.from({ length: 18 }, (_, i) => {
  const hour = 9 + Math.floor(i / 2);
  return `${String(hour).padStart(2, "0")}:${i % 2 ? "30" : "00"}`;
});
const BLOCKED = new Set(["10:00", "12:30", "16:30"]);

type ServiceRow = { id: string; name: string; tooth: string; qty: number; price: number };

const STARTER: ServiceRow[] = [
  { id: "s1", name: "Konsultatsiya", tooth: "16", qty: 1, price: 150000 },
  { id: "s2", name: "Kompozit plomba", tooth: "14", qty: 1, price: 450000 },
  { id: "s3", name: "Endodontik davolash", tooth: "11", qty: 1, price: 1200000 },
  { id: "s4", name: "Implant qo‘yish", tooth: "31", qty: 1, price: 8000000 },
  { id: "s5", name: "Krona (keramika)", tooth: "26", qty: 1, price: 2500000 },
];

function money(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

function ageOn(iso: string) {
  if (!iso) return 0;
  const born = new Date(iso);
  let age = CLINIC_TODAY.getFullYear() - born.getFullYear();
  const month = CLINIC_TODAY.getMonth() - born.getMonth();
  if (month < 0 || (month === 0 && CLINIC_TODAY.getDate() < born.getDate())) age -= 1;
  return Math.max(0, age);
}

function allPatients() {
  const extra = readPhoneStore<PhonePatient>(PHONE_PATIENTS_KEY);
  const ids = new Set(extra.map((item) => item.id));
  return [...extra, ...phonePatients.filter((item) => !ids.has(item.id))];
}

function useClinicPatients() {
  const [people, setPeople] = useState(phonePatients);
  useEffect(() => { setPeople(allPatients()); }, []);
  return people;
}

function FormScreen({ title, subtitle, back, testId, children }: { title: string; subtitle: string; back: string; testId: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <div className="p14 crm lg:hidden" data-testid={testId}>
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

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <div className={error ? "crm-field bad" : "crm-field"}>
      <span>{label}{required ? <i className="star"> *</i> : null}</span>
      {children}
      {error ? <span className="crm-err">{error}</span> : null}
    </div>
  );
}

function ToothSvg({ kind, selected }: { kind?: string; selected?: boolean }) {
  const fill = selected ? KIND_COLOR.pick : KIND_COLOR[kind || "sog"] || "#fff";
  const stroke = kind || selected ? fill : "#c5d0e0";
  return (
    <svg viewBox="0 0 32 40" aria-hidden="true">
      <path d="M16 3c5 0 9 3.5 9 9 0 3-.8 6-1.6 10-.8 5-1.6 10-2.4 12-.6 1.2-1.6 1.4-2.4.2-1-2.2-1.6-7-1.6-12V14c0 5-.6 9.8-1.6 12-.8 1.2-1.8 1-2.4-.2-.8-2-1.6-7-2.4-12C7.8 18 7 15 7 12c0-5.5 4-9 9-9z" fill={kind || selected ? fill : "#fff"} stroke={stroke} strokeWidth="1.6" />
    </svg>
  );
}

function ToothChart({ mode, selected, onToggle, palette }: { mode: "katta" | "bola"; selected?: string[]; onToggle?: (id: string) => void; palette?: boolean }) {
  const rows = mode === "katta" ? ADULT : BABY;
  return (
    <div className="teeth" aria-label="Tish kartasi">
      {rows.map((row) => (
        <div key={row[0]} className="crm-arch">
          {row.map((id) => {
            const on = selected?.includes(id);
            const kind = palette ? KIND[id] : undefined;
            return (
              <button key={id} type="button" className={on ? "crm-tooth on" : "crm-tooth"} aria-pressed={on} aria-label={`Tish ${id}`} onClick={() => onToggle?.(id)}>
                <ToothSvg kind={kind} selected={on && !kind} />
                <small>{id}</small>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Legend() {
  const items = [["#d5dee8", "Sog‘lom"], ["#f5c518", "Plomba"], ["#ef4444", "Endo"], ["#7c5cfc", "Krona"], ["#2f6bff", "Implant"], ["#94a3b8", "Olib tashlangan"]];
  return <p className="crm-legend">{items.map(([color, label]) => <span key={label}><i style={{ background: color }} />{label}</span>)}</p>;
}

export function PhoneAddPatient() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("edit");
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [form, setForm] = useState({ ism: "", familiya: "", prefix: "+998", phone: "", birth: "", gender: "", city: "Toshkent", address: "", email: "", source: "Telegram / Instagram", note: "" });
  const [conds, setConds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const found = editId ? allPatients().find((item) => item.id === editId) : null;
    if (!found) return;
    const [ism, ...rest] = found.name.split(" ");
    setForm((prev) => ({ ...prev, ism, familiya: rest.join(" "), phone: found.phone.replace(/^\+998\s?/, ""), gender: found.gender, birth: found.id === "b-0012" ? "1996-10-14" : prev.birth }));
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
    const patient: PhonePatient = {
      id: editId || `b-${Date.now()}`,
      name: `${form.ism.trim()} ${form.familiya.trim()}`,
      num: editId ? (allPatients().find((item) => item.id === editId)?.num || "B-1024") : `B-${1025 + extra.length}`,
      age: ageOn(form.birth),
      gender,
      phone: `${form.prefix} ${form.phone.trim()}`,
      status: "yangi",
      statusLabel: "Yangi",
      last: "—",
      next: "—",
      tags: conds.length ? conds : ["Yangi"],
      online: false,
      avatar: photo.startsWith("/") ? photo : "/img/phone14/pat-0.png",
    };
    const stored = extra.some((item) => item.id === patient.id)
      ? extra.map((item) => item.id === patient.id ? patient : item)
      : [patient, ...extra];
    try { writePhoneStore(PHONE_PATIENTS_KEY, stored); }
    catch { writePhoneStore(PHONE_PATIENTS_KEY, stored.map((item) => item.id === patient.id ? { ...item, avatar: "/img/phone14/pat-0.png" } : item)); }
    router.push("/crm/bemorlar");
  }

  return (
    <FormScreen title="Yangi bemor qo‘shish" subtitle="Bemor ma’lumotlarini kiriting" back="/crm/bemorlar" testId="phone-bemor-qoshish">
      <div className="crm-grid">
        <div className="list">
          <Field label="Ism" required error={errors.ism}><input value={form.ism} placeholder="Ismni kiriting" onChange={(event) => setForm({ ...form, ism: event.target.value })} /></Field>
          <Field label="Familiya" required error={errors.familiya}><input value={form.familiya} placeholder="Familiyani kiriting" onChange={(event) => setForm({ ...form, familiya: event.target.value })} /></Field>
        </div>
        <button type="button" className="crm-photo" onClick={() => fileRef.current?.click()}>
          {photo ? <img src={photo} alt="Bemor rasmi" /> : <><span>Rasm qo‘shish</span><small>JPG, PNG (maks. 5MB)</small></>}
        </button>
        <input ref={fileRef} hidden type="file" accept="image/jpeg,image/png" onChange={(event) => onFile(event.target.files?.[0])} />
      </div>
      {photoError ? <p className="crm-err">{photoError}</p> : null}
      <Field label="Telefon" required error={errors.phone}>
        <span className="crm-phone">
          <select aria-label="Kod" value={form.prefix} onChange={(event) => setForm({ ...form, prefix: event.target.value })}>
            <option>+998</option><option>+7</option><option>+1</option>
          </select>
          <input inputMode="tel" placeholder="90 123 45 67" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </span>
      </Field>
      <div className="crm-split">
        <Field label="Tug‘ilgan sana" required error={errors.birth}><input type="date" value={form.birth} onChange={(event) => setForm({ ...form, birth: event.target.value })} /></Field>
        <Field label="Jinsi" required error={errors.gender}>
          <span className="seg" role="radiogroup" aria-label="Jinsi">
            {["Erkak", "Ayol", "Boshqa"].map((item) => (
              <button key={item} type="button" className={form.gender === item ? "on" : undefined} onClick={() => setForm({ ...form, gender: item })}>{item}</button>
            ))}
          </span>
        </Field>
      </div>
      <Field label="Shahar" required error={errors.city}>
        <select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })}>{CITIES.map((item) => <option key={item}>{item}</option>)}</select>
      </Field>
      <Field label="Manzil"><input placeholder="Manzilni kiriting (ko‘cha, uy, xonadon)" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></Field>
      <Field label="Email"><input type="email" placeholder="example@mail.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></Field>
      <Field label="Qayerdan bildi?" required error={errors.source}>
        <select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}>{SOURCES.map((item) => <option key={item}>{item}</option>)}</select>
      </Field>
      <div>
        <b>Allergiya va kasalliklar</b>
        <div className="crm-checks">
          {CONDITIONS.map((item) => (
            <label key={item}><input type="checkbox" checked={conds.includes(item)} onChange={() => setConds((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])} />{item}</label>
          ))}
        </div>
      </div>
      <Field label="Izoh">
        <textarea maxLength={500} placeholder="Bemor haqida qo‘shimcha ma’lumot (ixtiyoriy)..." value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
      </Field>
      <p className="crm-count">{form.note.length}/500</p>
      <button type="button" className="crm-save" onClick={save}>Saqlash</button>
    </FormScreen>
  );
}

const VISITS = [
  { date: "14 okt 2024, 10:24", title: "Davolash", doctor: "Dr. Ibrohim", note: "11 tish endodontik davolash", photo: "/img/phone14/doc-0.png" },
  { date: "28 sen 2024, 15:10", title: "Konsultatsiya", doctor: "Dr. Aziza", note: "Shikoyat: og‘riq (11)", photo: "/img/phone14/doc-1.png" },
  { date: "12 avg 2024, 11:40", title: "Professional gigiyena", doctor: "Dr. Ibrohim", note: "Tozalash + Air Flow", photo: "/img/phone14/doc-0.png" },
  { date: "3 may 2024, 09:20", title: "Reja tuzish", doctor: "Dr. Kamron", note: "Implant rejasini muhokama", photo: "/img/phone14/doc-2.png" },
];

export function PhonePatientProfile({ id }: { id: string }) {
  const [extra, setExtra] = useState<PhonePatient[]>([]);
  const [tab, setTab] = useState("Umumiy");
  const [dent, setDent] = useState<"katta" | "bola">("katta");
  useEffect(() => { setExtra(readPhoneStore<PhonePatient>(PHONE_PATIENTS_KEY)); }, []);
  const patient = extra.find((item) => item.id === id) ?? findPhonePatient(id) ?? null;
  if (!patient) {
    return <FormScreen title="Bemor profili" subtitle="Bemor topilmadi" back="/crm/bemorlar" testId="phone-bemor-profili"><Link href="/crm/bemorlar">Bemorlar</Link></FormScreen>;
  }
  const malika = patient.id === "b-0012";
  const num = malika ? "B-1024" : patient.num;
  const birth = malika ? "14.10.1996" : "—";
  const tabs = ["Umumiy", "Tish kartasi", "Rejalar", "Tashriflar", "To‘lovlar", "Rentgen"];
  return (
    <div className="p14 crm lg:hidden" data-testid="phone-bemor-profili">
      <header className="crm-bar">
        <Link href="/crm/bemorlar" aria-label="Orqaga"><ChevronLeft /></Link>
        <h1>Bemor profili</h1>
        <span />
      </header>
      <div className="prof-hero">
        <img src={patient.avatar} alt="" />
        <div>
          <b>{patient.name}</b> <span className="badge-live">Faol bemor</span>
          <p className="spec">ID: #{num}</p>
          <p className="spec">{patient.age} yosh · {birth} · {patient.gender}</p>
          <p className="spec">{patient.phone}</p>
        </div>
      </div>
      <div className="act-row">
        <a href={`tel:${patient.phone.replace(/\s/g, "")}`}><Phone />Qo‘ng‘iroq</a>
        <Link href={`/crm/uchrashuvlar/yangi?patient=${patient.id}`}><CalendarPlus />Qabul</Link>
        <Link href={`/crm/tolovlar/yangi?patient=${patient.id}`}><Wallet />To‘lov</Link>
        <Link href={`/crm/bemorlar/yangi?edit=${patient.id}`}><Pencil />Tahrirlash</Link>
      </div>
      {malika ? <p className="allergy"><AlertTriangle size={14} /> Penitsillin allergiyasi. Gipertoniya (dori qabul qiladi)</p> : null}
      <div className="p14-row">
        {tabs.map((item) => <button key={item} type="button" className={tab === item ? "p14-chip on" : "p14-chip"} onClick={() => setTab(item)}>{item}</button>)}
      </div>
      {tab === "Umumiy" || tab === "Tish kartasi" ? (
        <section className="p14-card">
          <div className="p14-head"><b>Tish holati (FDI)</b>
            <span className="seg two"><button type="button" className={dent === "katta" ? "on" : undefined} onClick={() => setDent("katta")}>Katta</button><button type="button" className={dent === "bola" ? "on" : undefined} onClick={() => setDent("bola")}>Bola</button></span>
          </div>
          <ToothChart mode={dent} palette={dent === "katta" && malika} />
          <Legend />
        </section>
      ) : null}
      {tab === "Umumiy" ? (
        <>
          <div className="mini-cards">
            <article><small>Balans</small><b>{money(malika ? 8_000_000 : 0)}</b></article>
            <article><small>To‘lov holati</small><b style={{ color: "#e11d48" }}>Qarzdor</b><span className="spec">33%</span><span className="bar"><i style={{ width: "33%", background: "#ef4444" }} /></span></article>
          </div>
          <p className="spec">Umumiy: {money(malika ? 12_000_000 : 0)} · Qarz: {money(malika ? 8_000_000 : 0)}</p>
          <p className="spec">To‘langan: {money(malika ? 4_000_000 : 0)} · To‘langan: 33%</p>
          <div className="p14-head"><b>So‘nggi tashriflar</b><span className="spec">Barchasini ko‘rish</span></div>
          <div className="list">
            {(malika ? VISITS : []).map((item) => (
              <article key={item.date} className="visit">
                <span className="rail" />
                <span><small className="spec">{item.date}</small><b>{item.title}</b><p>{item.note}</p></span>
                <span className="who"><img src={item.photo} alt="" /><small>{item.doctor}</small></span>
              </article>
            ))}
            {!malika ? <p className="p14-empty">Tashriflar yo‘q</p> : null}
          </div>
        </>
      ) : null}
      {tab === "Rejalar" ? <article className="p14-card"><b>Implant va protetik davolash</b><p className="spec">DP-2024-001 · {money(12_500_000)}</p></article> : null}
      {tab === "Tashriflar" ? <div className="list">{malika ? VISITS.map((item) => <article key={item.date} className="p14-card"><b>{item.title}</b><p className="spec">{item.date} · {item.doctor}</p><p>{item.note}</p></article>) : <p className="p14-empty">Tashriflar yo‘q</p>}</div> : null}
      {tab === "To‘lovlar" ? <article className="p14-card"><b>To‘langan {money(4_000_000)}</b><p className="spec">Qarz {money(8_000_000)}</p></article> : null}
      {tab === "Rentgen" ? <p className="p14-empty">Rentgen suratlar hali yuklanmagan</p> : null}
      <Link href={`/crm/uchrashuvlar/yangi?patient=${patient.id}`} className="crm-save" style={{ display: "grid", placeItems: "center" }}>+ Yangi qabul qo‘shish</Link>
    </div>
  );
}

export function PhoneAddAppointment() {
  const router = useRouter();
  const params = useSearchParams();
  const preset = params.get("patient");
  const [q, setQ] = useState("");
  const [patient, setPatient] = useState<PhonePatient | null>(phonePatients[0] ?? null);
  const [qr, setQr] = useState(false);
  const [doctor, setDoctor] = useState("Dr. Ibrohim");
  const [chair, setChair] = useState("Kreslo 1");
  const [service, setService] = useState("Konsultatsiya");
  const [day, setDay] = useState(17);
  const [time, setTime] = useState("09:00");
  const [dur, setDur] = useState(30);
  const [sms, setSms] = useState(true);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const people = useClinicPatients();
  useEffect(() => {
    setPatient((current) => {
      if (current && people.some((item) => item.id === current.id)) return current;
      const id = preset || "b-0012";
      return people.find((item) => item.id === id) ?? people[0] ?? null;
    });
  }, [people, preset]);
  const found = people.filter((item) => `${item.name} ${item.phone} ${item.num}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 5);

  function save() {
    const next: Record<string, string> = {};
    if (!patient) next.patient = "Bemorni tanlang";
    if (!doctor) next.doctor = "Shifokor majburiy";
    if (!chair) next.chair = "Kreslo majburiy";
    if (!service) next.service = "Xizmat majburiy";
    if (!day) next.day = "Sanani tanlang";
    if (!time) next.time = "Vaqtni tanlang";
    if (!dur) next.dur = "Davomiylik majburiy";
    setErrors(next);
    if (Object.keys(next).length) return;
    const endMin = Number(time.slice(0, 2)) * 60 + Number(time.slice(3)) + dur;
    const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    const row = { id: `u-${Date.now()}`, time, end, name: patient!.name, service, age: patient!.age, gender: patient!.gender, tooth: "—", note: note || (sms ? "SMS eslatma yoqilgan" : "Yangi uchrashuv"), status: "keladi", statusLabel: "Keladigan", phone: patient!.phone.replace(/\s/g, ""), avatar: patient!.avatar, day };
    writePhoneStore(PHONE_APPTS_KEY, [row, ...readPhoneStore<typeof row>(PHONE_APPTS_KEY)]);
    router.push("/crm/uchrashuvlar");
  }

  return (
    <FormScreen title="Yangi uchrashuv" subtitle="Qabul ma’lumotlarini kiriting" back="/crm/uchrashuvlar" testId="phone-uchrashuv-qoshish">
      <Field label="Bemor" required error={errors.patient}>
        <span className="crm-phone">
          <input placeholder="Bemorni qidiring (ism, telefon yoki ID)" value={q} onChange={(event) => setQ(event.target.value)} />
          <button type="button" aria-label="QR" className="p14-filter" onClick={() => setQr(true)}><QrCode /></button>
        </span>
      </Field>
      {q.trim() ? found.map((item) => (
        <button key={item.id} type="button" className="crm-card" onClick={() => { setPatient(item); setQ(""); }}>
          <img src={item.avatar} alt="" /><span><b>{item.name}</b><small>#{item.num}</small></span>
        </button>
      )) : null}
      {patient ? (
        <article className="crm-card">
          <img src={patient.avatar} alt="" />
          <span><b>{patient.name}</b><small>ID: #{patient.id === "b-0012" ? "B-1024" : patient.num} · {patient.phone}</small></span>
          <button type="button" aria-label="Tozalash" onClick={() => setPatient(null)}><X /></button>
        </article>
      ) : null}
      <div className="crm-split">
        <Field label="Shifokor" required error={errors.doctor}><select value={doctor} onChange={(event) => setDoctor(event.target.value)}>{DOCTORS.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Kreslo" required error={errors.chair}><select value={chair} onChange={(event) => setChair(event.target.value)}>{["Kreslo 1", "Kreslo 2", "Kreslo 3"].map((item) => <option key={item}>{item}</option>)}</select></Field>
      </div>
      <Field label="Xizmat" required error={errors.service}>
        <select value={service} onChange={(event) => setService(event.target.value)}>{STARTER.map((item) => <option key={item.id}>{item.name}</option>)}<option>Professional gigiyena</option></select>
      </Field>
      <Field label="Sana" required error={errors.day}>
        <span className="crm-days">
          {DAYS.map(([label, n]) => (
            <button key={n} type="button" className={day === n ? "on" : undefined} onClick={() => setDay(n)}><small>{label}</small><b>{n}</b><small>okt</small></button>
          ))}
        </span>
      </Field>
      <Field label="Vaqt" required error={errors.time}>
        <span className="crm-times">
          {TIMES.map((slot) => (
            <button key={slot} type="button" disabled={BLOCKED.has(slot)} className={time === slot ? "on" : undefined} onClick={() => setTime(slot)}>{slot}</button>
          ))}
        </span>
      </Field>
      <Field label="Davomiyligi" required error={errors.dur}>
        <span className="crm-dur">
          {[30, 45, 60, 90].map((item) => <button key={item} type="button" className={dur === item ? "on" : undefined} onClick={() => setDur(item)}>{item} daqiqa</button>)}
        </span>
      </Field>
      <div className="crm-toggle">
        <span><b>SMS eslatma yuborish</b><small className="spec">Bemorga uchrashuvdan oldin eslatma yuboriladi</small></span>
        <button type="button" className={sms ? "crm-switch on" : "crm-switch"} aria-pressed={sms} onClick={() => setSms(!sms)}><i /></button>
      </div>
      <Field label="Izoh"><textarea maxLength={500} placeholder="Uchrashuv haqida qo‘shimcha ma’lumot..." value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <p className="crm-count">{note.length}/500</p>
      <button type="button" className="crm-save" onClick={save}>Saqlash</button>
      {qr ? (
        <Sheet title="QR skaner" onClose={() => setQr(false)}>
          <div className="scan fake" />
          <p>Bemor kartasidagi QR kodni skanerlang.</p>
          <button type="button" className="crm-save" onClick={() => { setPatient(people.find((item) => item.id === "b-0012") ?? people[0] ?? null); setQr(false); }}>#B-1024 ni qabul qilish</button>
        </Sheet>
      ) : null}
    </FormScreen>
  );
}

export function PhoneAddPlan() {
  const router = useRouter();
  const params = useSearchParams();
  const preset = params.get("patient");
  const people = useClinicPatients();
  const [patientId, setPatientId] = useState(preset || "b-0012");
  const [doctor, setDoctor] = useState("Dr. Ibrohim");
  const [title, setTitle] = useState("Kompleks davolash");
  const [dent, setDent] = useState<"katta" | "bola">("katta");
  const [picked, setPicked] = useState<string[]>(["16", "14", "11", "31", "26"]);
  const [rows, setRows] = useState<ServiceRow[]>(STARTER);
  const [discountOn, setDiscountOn] = useState(true);
  const [mode, setMode] = useState<"%" | "so‘m">("%");
  const [percent, setPercent] = useState(10);
  const [sumOff, setSumOff] = useState(1_230_000);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const subtotal = rows.reduce((sum, row) => sum + row.qty * row.price, 0);
  const discount = discountOn ? (mode === "%" ? Math.round(subtotal * (Number(percent) || 0) / 100) : Math.min(subtotal, Number(sumOff) || 0)) : 0;
  const total = subtotal - discount;
  const teeth = new Set(rows.map((row) => row.tooth).filter((item) => item && item !== "—"));

  function save() {
    const next: Record<string, string> = {};
    if (!patientId) next.patient = "Bemorni tanlang";
    if (!doctor) next.doctor = "Shifokor majburiy";
    if (!title.trim()) next.title = "Reja nomi majburiy";
    setErrors(next);
    if (Object.keys(next).length) return;
    const patient = people.find((item) => item.id === patientId);
    writePhoneStore(PHONE_PLANS_KEY, [{ id: `r-${Date.now()}`, title: title.trim(), status: "Rejalashtirilgan", patient: patient?.name || "" }, ...readPhoneStore<{ id: string; title: string; status: string }>(PHONE_PLANS_KEY)]);
    router.push("/crm/davolash-rejalari");
  }

  return (
    <FormScreen title="Yangi davolash rejasi" subtitle="Davolash reja ma’lumotlarini kiriting" back="/crm/davolash-rejalari" testId="phone-reja-qoshish">
      <Field label="Bemor" required error={errors.patient}>
        <select value={patientId} onChange={(event) => setPatientId(event.target.value)}>
          {people.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </Field>
      <p className="spec">ID: #{patientId === "b-0012" ? "B-1024" : people.find((item) => item.id === patientId)?.num} · {people.find((item) => item.id === patientId)?.phone}</p>
      <div className="crm-split">
        <Field label="Shifokor" required error={errors.doctor}><select value={doctor} onChange={(event) => setDoctor(event.target.value)}>{DOCTORS.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Reja nomi" required error={errors.title}><input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      </div>
      <div className="p14-head">
        <b>Tishlar (FDI)</b>
        <button type="button" className="rpt-link" onClick={() => setPicked([])}>Tozalash</button>
      </div>
      <span className="seg two"><button type="button" className={dent === "katta" ? "on" : undefined} onClick={() => setDent("katta")}>Katta</button><button type="button" className={dent === "bola" ? "on" : undefined} onClick={() => setDent("bola")}>Bola</button></span>
      <ToothChart mode={dent} palette={dent === "katta"} selected={picked} onToggle={(id) => setPicked((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])} />
      <Legend />
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
        <div className="crm-split">
          <span className="seg two">
            <button type="button" className={mode === "%" ? "on" : undefined} onClick={() => setMode("%")}>%</button>
            <button type="button" className={mode === "so‘m" ? "on" : undefined} onClick={() => setMode("so‘m")}>so‘m</button>
          </span>
          {mode === "%" ? <input aria-label="Chegirma foizi" value={percent} onChange={(event) => setPercent(Number(event.target.value) || 0)} /> : <input aria-label="Chegirma summasi" value={sumOff} onChange={(event) => setSumOff(Number(event.target.value.replace(/\D/g, "")) || 0)} />}
          <b>{money(discount)}</b>
        </div>
      ) : null}
      <article className="p14-card">
        <div className="p14-head"><span>Jami summa</span><b style={{ color: "#0E8F94" }}>{money(total)}</b></div>
        <p className="spec">{rows.length} ta xizmat · {teeth.size} ta tish</p>
      </article>
      <button type="button" className="crm-save" onClick={save}>Saqlash</button>
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
  const people = useClinicPatients();
  const [patientId, setPatientId] = useState(params.get("patient") || "b-0012");
  const [plan, setPlan] = useState("Kompleks davolash");
  const [amount, setAmount] = useState("3000000");
  const [method, setMethod] = useState<string>("Naqd");
  const [date, setDate] = useState("2024-10-15");
  const [receipt, setReceipt] = useState(true);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const patient = people.find((item) => item.id === patientId);

  function save() {
    const next: Record<string, string> = {};
    if (!patientId) next.patient = "Bemorni tanlang";
    if (!plan) next.plan = "Rejani tanlang";
    if (!(Number(amount) > 0)) next.amount = "Summa majburiy";
    if (!method) next.method = "To‘lov usulini tanlang";
    if (!date) next.date = "Sana majburiy";
    setErrors(next);
    if (Object.keys(next).length) return;
    const row = { id: `pay-${Date.now()}`, name: patient?.name || "Bemor", amount: money(Number(amount)), note: note || plan, date: "15 okt", status: "To‘langan", avatar: patient?.avatar || "/img/phone14/pat-0.png", late: false };
    writePhoneStore(PHONE_PAYS_KEY, [row, ...readPhoneStore<typeof row>(PHONE_PAYS_KEY)]);
    router.push("/crm/tolovlar");
  }

  return (
    <FormScreen title="Yangi to‘lov qo‘shish" subtitle="To‘lov ma’lumotlarini kiriting" back="/crm/tolovlar" testId="phone-tolov-qoshish">
      <Field label="Bemor" required error={errors.patient}>
        <select value={patientId} onChange={(event) => setPatientId(event.target.value)}>{people.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      </Field>
      {patient ? <p className="spec">ID: #{patient.id === "b-0012" ? "B-1024" : patient.num} · {patient.phone}</p> : null}
      <Field label="Davolash rejasi" required error={errors.plan}>
        <select value={plan} onChange={(event) => setPlan(event.target.value)}>
          <option>Kompleks davolash</option>
          <option>Implant va protetik davolash</option>
        </select>
      </Field>
      <p className="spec">ID: #R-001 · 12 ta xizmat · 5 ta tish</p>
      <article className="debt">
        <small>Qarz</small>
        <b>8 000 000 so‘m</b>
        <p className="spec">Umumiy: 12 000 000 so‘m</p>
        <p className="spec">To‘langan: 4 000 000 so‘m</p>
      </article>
      <Field label="Summa" required error={errors.amount}>
        <span className="crm-phone">
          <input inputMode="numeric" value={formatGroupedNumber(Number(amount) || 0)} onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))} />
          <span className="p14-filter">so‘m</span>
        </span>
      </Field>
      <Field label="To‘lov usuli" required error={errors.method}>
        <span className="pay-methods">
          {PAY_METHODS.map((item) => (
            <button key={item.id} type="button" className={method === item.id ? "on" : undefined} onClick={() => setMethod(item.id)}>
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
      <Field label="Izoh"><textarea maxLength={500} placeholder="To‘lov haqida izoh (ixtiyoriy)..." value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <p className="crm-count">{note.length}/500</p>
      <button type="button" className="crm-save" onClick={save}>Saqlash</button>
    </FormScreen>
  );
}
