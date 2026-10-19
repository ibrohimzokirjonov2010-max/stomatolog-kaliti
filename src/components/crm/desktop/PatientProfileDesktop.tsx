"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, Pencil, Wallet } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { patientStatuses, type Patient, type ToothState } from "@/data/crm";
import { useCrmPatients } from "@/lib/use-crm-list";
import { formatGroupedNumber } from "@/lib/format";
import "./profile-faithful.css";

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const BABY = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75];
const CYCLE: ToothState[] = ["soglom", "kariyes", "plomba", "endo", "implant", "koronka", "ekstraksiya"];
const TOOTH_CLASS: Partial<Record<ToothState, string>> = {
  kariyes: "kar",
  muammo: "kar",
  davolanmoqda: "kar",
  plomba: "plo",
  davolangan: "plo",
  endo: "end",
  implant: "imp",
  koronka: "sht",
  ekstraksiya: "yoq",
};
const LEGEND = [
  ["#fff", "Sog‘lom"],
  ["#ef4444", "Karies"],
  ["#3b82f6", "Plomba"],
  ["#f59e0b", "Endodontik"],
  ["#8b5cf6", "Shtift"],
  ["#0198a4", "Implant"],
  ["#e8eef4", "Yo‘q tish"],
];
const TABS = [
  ["umumiy", "Umumiy"],
  ["tish", "Tish kartasi"],
  ["reja", "Davolash rejalari"],
  ["tashrif", "Tashriflar"],
  ["tolov", "To‘lovlar"],
  ["hujjat", "Hujjatlar / Rentgen"],
] as const;

function money(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

export function PatientProfileDesktop({ id }: { id: string }) {
  const [items, setItems, ready] = useCrmPatients<Patient>();
  const patient = items.find((item) => item.id === id);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("umumiy");
  const [baby, setBaby] = useState(false);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [draftReady, setDraftReady] = useState("");
  const showChart = tab === "umumiy" || tab === "tish";
  const showVisits = tab === "umumiy" || tab === "tashrif";
  const showInfo = tab === "umumiy" || tab === "hujjat";

  if (patient && draftReady !== patient.id) {
    setDraftReady(patient.id);
    setPhone(patient.phone);
    setEmail(patient.email);
    setAddress(patient.address || patient.city || "");
  }

  function patch(update: (item: Patient) => Patient) {
    setItems((prev) => prev.map((item) => (item.id === id ? update(item) : item)));
  }

  function saveContact() {
    patch((item) => ({ ...item, phone: phone.trim(), email: email.trim(), address: address.trim() }));
    setEditing(false);
  }

  function cycle(tooth: number) {
    patch((item) => {
      const key = String(tooth);
      const current = item.teeth?.[key] ?? "soglom";
      const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
      return { ...item, teeth: { ...item.teeth, [key]: next } };
    });
  }

  if (!ready) {
    return <ClinicShell accent="teal"><p className="pxp" data-testid="patient-profile">Yuklanmoqda</p></ClinicShell>;
  }
  if (!patient) {
    return (
      <ClinicShell accent="teal">
        <div className="pxp" data-testid="patient-profile" data-patient={id}>
          <p>Bemor topilmadi</p>
          <Link href="/crm/bemorlar">Bemorlar ro‘yxati</Link>
        </div>
      </ClinicShell>
    );
  }

  const paid = (patient.payments ?? []).reduce((sum, item) => sum + item.amount, 0);
  const planned = (patient.plans ?? []).reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(planned, paid);
  const debt = Math.max(0, planned - paid);
  const status = patientStatuses.find((item) => item.id === patient.status)?.label ?? patient.status;
  const teeth = patient.teeth ?? {};
  const visits = patient.visits ?? [];
  const payments = patient.payments ?? [];
  const plans = patient.plans ?? [];
  const docs = [...(patient.docs ?? []), ...(patient.xrays ?? []).map((item) => ({ name: item.type || "Rentgen", detail: `${item.date} · ${item.tooth}` }))];

  return (
    <ClinicShell accent="teal">
      <div className="pxp" data-testid="patient-profile" data-patient={id}>
        <div>
          <div className="crumb"><Link href="/crm/bemorlar">Bemorlar CRM</Link><span>›</span><b>Bemor profili</b></div>
          <div className="pxp-head">
            <h1>Bemor profili</h1>
            <div className="pxp-actions">
              <Link className="go" href="/crm/uchrashuvlar"><CalendarPlus size={15} /> Qabul qo‘shish</Link>
              <Link href="/crm/tolovlar"><Wallet size={15} /> To‘lov</Link>
              <button type="button" data-testid="profile-edit" onClick={() => (editing ? saveContact() : setEditing(true))}><Pencil size={15} /> {editing ? "Saqlash" : "Tahrirlash"}</button>
            </div>
          </div>
        </div>

        <section className="pxp-hero">
          <div className="pxp-who">
            <img src={patient.avatar || "/img/jobs/doctor.jpg"} alt="" />
            <div>
              <h2>{patient.name} <span className="pxp-id">#{patient.id}</span></h2>
              <div className="pxp-line">
                <span>{patient.age ? `${patient.age} yosh` : "Yosh kiritilmagan"}</span>
                <span>{patient.gender}</span>
              </div>
              <div className="pxp-line">
                <span>{patient.phone || "Telefon yo‘q"}</span>
                <span>{patient.city || "Shahar yo‘q"}</span>
              </div>
              <div className="pxp-badges">
                <span>{status}</span>
              </div>
            </div>
          </div>
          <div className="pxp-money">
            <article><div><small>Umumiy summa</small><b>{money(total)}</b></div></article>
            <article><div><small>To‘langan</small><b>{money(paid)}</b></div></article>
            <article className="debt"><div><small>Qarz</small><b>{money(debt)}</b></div></article>
          </div>
          {patient.note || patient.conditions?.length ? (
            <div className="pxp-alert">
              <b>Eslatma</b>
              <p>{patient.conditions?.join(", ")}</p>
              {patient.note ? <p>{patient.note}</p> : null}
            </div>
          ) : null}
        </section>

        <div className="pxp-tabs">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" className={tab === key ? "on" : undefined} data-testid={`profile-tab-${key}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {showChart || showVisits ? (
          <div className="pxp-split">
            {showChart ? (
              <section className="pxp-card">
                <h3>Tish kartasi (FDI) <button type="button" data-testid="profile-baby" onClick={() => setBaby((value) => !value)}>{baby ? "Doimiy tishlar" : "Sut tishlar"}</button></h3>
                <div className="pxp-arch">
                  {(baby ? BABY.slice(0, 10) : UPPER).map((n) => <button key={n} type="button" className={`px-tooth ${TOOTH_CLASS[teeth[String(n)]] || ""}`} onClick={() => cycle(n)}>{n}</button>)}
                </div>
                <div className="pxp-arch">
                  {(baby ? BABY.slice(10) : LOWER).map((n) => <button key={n} type="button" className={`px-tooth ${TOOTH_CLASS[teeth[String(n)]] || ""}`} onClick={() => cycle(n)}>{n}</button>)}
                </div>
                <div className="pxp-legend">
                  {LEGEND.map(([color, label]) => <span key={label}><i style={{ background: color, border: "1px solid #d5e0ea" }} />{label}</span>)}
                </div>
              </section>
            ) : null}
            {showVisits ? (
              <section className="pxp-card">
                <h3>So‘nggi tashriflar <button type="button" onClick={() => setTab("tashrif")}>Barchasini ko‘rish ›</button></h3>
                {visits.length === 0 ? <p>Tashrif yo‘q</p> : visits.map((item) => (
                  <div key={`${item.date}-${item.note}`} className="pxp-visit">
                    <div><b>{item.date}</b><small>{item.kind} · {item.doctor}{item.note ? ` · ${item.note}` : ""}</small></div>
                    <em>Bajarildi ›</em>
                  </div>
                ))}
              </section>
            ) : null}
          </div>
        ) : null}

        {tab === "reja" ? (
          <section className="pxp-card">
            <h3>Davolash rejalari <Link href="/crm/davolash-rejalari">Barchasi</Link></h3>
            {plans.length === 0 ? <p>Davolash rejasi yo‘q</p> : plans.map((plan) => (
              <div key={plan.id} className="pxp-visit"><div><b>{plan.name}</b><small>{plan.date} · {plan.doctor} · {plan.status}</small></div><b>{money(plan.total)}</b></div>
            ))}
          </section>
        ) : null}
        {tab === "tolov" ? (
          <section className="pxp-card">
            <h3>To‘lovlar</h3>
            {payments.length === 0 ? <p>To‘lov yo‘q</p> : payments.map((item) => (
              <div key={`${item.date}-${item.note}`} className="pxp-visit"><div><b>{item.date} · {item.method}</b><small>{item.note}</small></div><b>{money(item.amount)}</b></div>
            ))}
          </section>
        ) : null}

        {showInfo ? (
          <div className="pxp-grid3">
            <section className="pxp-card">
              <h3>Asosiy ma’lumotlar <button type="button" onClick={() => (editing ? saveContact() : setEditing(true))}>{editing ? "Saqlash" : "Tahrirlash"}</button></h3>
              <div className="pxp-row"><span>Ism, familiya</span><b>{patient.name}</b></div>
              <div className="pxp-row"><span>Yosh</span><b>{patient.age || "—"}</b></div>
              <div className="pxp-row"><span>Jinsi</span><b>{patient.gender}</b></div>
              <div className="pxp-row"><span>Telefon</span>{editing ? <input className="pxp-edit" aria-label="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} /> : <b>{patient.phone || "—"}</b>}</div>
              <div className="pxp-row"><span>Email</span>{editing ? <input className="pxp-edit" aria-label="Email" value={email} onChange={(event) => setEmail(event.target.value)} /> : <b>{patient.email || "—"}</b>}</div>
              <div className="pxp-row"><span>Shahar</span><b>{patient.city || "—"}</b></div>
              <div className="pxp-row"><span>Manzil</span>{editing ? <input className="pxp-edit" aria-label="Manzil" value={address} onChange={(event) => setAddress(event.target.value)} /> : <b>{patient.address || "—"}</b>}</div>
            </section>
            <section className="pxp-card">
              <h3>Tibbiy ma’lumotlar</h3>
              <div className="pxp-row"><span>Holat</span><b>{status}</b></div>
              <div className="pxp-row"><span>Eslatma</span><b>{patient.note || "—"}</b></div>
              <div className="pxp-row"><span>Kasalliklar</span><b>{patient.conditions?.join(", ") || "—"}</b></div>
            </section>
            <section className="pxp-card">
              <h3>Hujjatlar / Rentgen <button type="button" onClick={() => setTab("hujjat")}>Barchasini ko‘rish ›</button></h3>
              <div className="pxp-docs">
                {docs.length === 0 ? <p>Hujjat yo‘q</p> : docs.map((item) => (
                  <figure key={`${item.name}-${item.detail}`}><div className="ph" /><figcaption>{item.name}</figcaption><small>{item.detail}</small></figure>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </ClinicShell>
  );
}
