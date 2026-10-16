"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Mail, MapPin, Phone } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { ADULT_LOWER, ADULT_UPPER, BABY_LOWER, BABY_UPPER, ToothChart, cycleTooth } from "@/components/crm/desktop/ToothChart";
import { buildPatients, patientStatuses, type Patient, type ToothState } from "@/data/crm";
import { formatGroupedNumber } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";
import "./crm.css";

const STATES: ToothState[] = ["soglom", "davolanmoqda", "davolangan", "muammo"];

export function PatientProfileDesktop({ id }: { id: string }) {
  const [items, setItems] = useStoredList("sk-crm-patients-v1", buildPatients());
  const patient = items.find((item) => item.id === id);
  const [tab, setTab] = useState<"umumiy" | "tashrif" | "tolov" | "hujjat">("umumiy");
  const [dentition, setDentition] = useState<"doimiy" | "sut">("doimiy");

  function patch(fn: (item: Patient) => Patient) {
    setItems((prev) => prev.map((item) => (item.id === id ? fn(item) : item)));
  }

  if (!patient) {
    return (
      <ClinicShell>
        <div className="crm-empty" data-testid="patient-missing">
          <p>Bemor topilmadi</p>
          <Link href="/crm/bemorlar">Bemorlar ro‘yxati</Link>
        </div>
      </ClinicShell>
    );
  }

  const status = patientStatuses.find((item) => item.id === patient.status)?.label ?? patient.status;
  const paid = patient.payments.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ClinicShell>
      <div className="crm-teal pf" data-testid="patient-profile">
        <div className="crm-head">
          <div>
            <Link href="/crm/bemorlar" className="pf-back"><ChevronLeft className="i" /> Bemorlar</Link>
            <h1>Bemor profili</h1>
            <p>Shaxsiy ma’lumot, tashriflar va to‘lovlar</p>
          </div>
          <div className="crm-actions">
            <Link className="crm-btn" href="/crm/uchrashuvlar">Uchrashuv</Link>
            <Link className="crm-btn blue" href="/crm/tolovlar">To‘lov</Link>
          </div>
        </div>

        <section className="crm-card pf-hero">
          <img src={patient.avatar} alt="" />
          <div>
            <div className="pf-name">
              <h2>{patient.name}</h2>
              <span className={`crm-pill ${patient.status}`}>{status}</span>
            </div>
            <p>{patient.age} yosh · {patient.gender} · #{patient.id.toUpperCase()}</p>
            <div className="pf-meta">
              <span><Phone className="i" /> {patient.phone}</span>
              <span><Mail className="i" /> {patient.email || "—"}</span>
              <span><MapPin className="i" /> {patient.city}{patient.address ? `, ${patient.address}` : ""}</span>
            </div>
          </div>
          <div className="pf-kpis">
            <div><b>{patient.visits.length}</b><span>Tashrif</span></div>
            <div><b>{formatGroupedNumber(paid)}</b><span>To‘langan</span></div>
            <div><b>{patient.nextVisit || "—"}</b><span>Keyingi qabul</span></div>
          </div>
        </section>

        <div className="pt-tabs pf-tabs">
          {([["umumiy", "Umumiy"], ["tashrif", "Tashriflar"], ["tolov", "To‘lovlar"], ["hujjat", "Hujjatlar"]] as const).map(([key, label]) => (
            <button key={key} type="button" className={tab === key ? "on" : undefined} data-testid={`profile-tab-${key}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {tab === "umumiy" ? (
          <div className="pf-grid">
            <section className="crm-card pf-box">
              <h3>Aloqa</h3>
              <p><b>Telefon</b>{patient.phone}</p>
              <p><b>Email</b>{patient.email || "—"}</p>
              <p><b>Shahar</b>{patient.city}</p>
              <p><b>Manzil</b>{patient.address || "—"}</p>
              <p><b>Qayerdan bildi</b>{patient.source || "—"}</p>
              <p><b>Tug‘ilgan sana</b>{patient.birth || "—"}</p>
              <h3>Kasalliklar</h3>
              <p>{patient.conditions?.length ? patient.conditions.join(", ") : "Qayd etilmagan"}</p>
              {patient.otherCondition ? <p>{patient.otherCondition}</p> : null}
              <h3>Izoh</h3>
              <p>{patient.note || "Izoh yo‘q"}</p>
            </section>
            <section className="crm-card pf-box">
              <div className="pf-row">
                <h3>Tish kartasi</h3>
                <div className="ap-view">
                  <button type="button" className={dentition === "doimiy" ? "on" : undefined} onClick={() => setDentition("doimiy")}>Doimiy</button>
                  <button type="button" className={dentition === "sut" ? "on" : undefined} onClick={() => setDentition("sut")}>Sut tishlari</button>
                </div>
              </div>
              <ToothChart
                upper={dentition === "doimiy" ? ADULT_UPPER : BABY_UPPER}
                lower={dentition === "doimiy" ? ADULT_LOWER : BABY_LOWER}
                teeth={patient.teeth}
                legend={[{ id: "soglom", label: "Sog‘lom" }, { id: "davolanmoqda", label: "Davolanmoqda" }, { id: "davolangan", label: "Davolangan" }, { id: "muammo", label: "Muammo" }]}
                onCycle={(tooth) => patch((item) => ({ ...item, teeth: { ...item.teeth, [tooth]: cycleTooth(item.teeth[tooth], STATES) } }))}
              />
            </section>
          </div>
        ) : null}

        {tab === "tashrif" ? (
          <section className="crm-card pf-box">
            {patient.visits.length === 0 ? <p className="crm-muted">Tashrif yo‘q</p> : patient.visits.map((item) => (
              <div key={`${item.date}-${item.note}`} className="visit"><span><b>{item.date}</b>{item.kind}<small className="crm-muted">{item.note}</small></span><span>{item.doctor}</span></div>
            ))}
          </section>
        ) : null}

        {tab === "tolov" ? (
          <section className="crm-card pf-box">
            {patient.payments.length === 0 ? <p className="crm-muted">To‘lov yo‘q</p> : patient.payments.map((item) => (
              <div key={`${item.date}-${item.note}`} className="visit"><span><b>{item.date}</b>{item.note}<small className="crm-muted">{item.method}</small></span><span>{formatGroupedNumber(item.amount)} so‘m</span></div>
            ))}
          </section>
        ) : null}

        {tab === "hujjat" ? (
          <section className="crm-card pf-box">
            {patient.docs.length === 0 ? <p className="crm-muted">Hujjat yo‘q</p> : patient.docs.map((item) => (
              <div key={item.name} className="visit"><span><b>{item.name}</b>{item.detail}</span></div>
            ))}
          </section>
        ) : null}
      </div>
    </ClinicShell>
  );
}
