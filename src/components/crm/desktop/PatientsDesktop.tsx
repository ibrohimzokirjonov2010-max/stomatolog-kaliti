"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, MoreHorizontal, Plus, Search, Upload } from "lucide-react";
import { CrmFrame, CrmModal, CrmPager } from "@/components/crm/desktop/CrmFrame";
import { ADULT_LOWER, ADULT_UPPER, BABY_LOWER, BABY_UPPER, ToothChart, cycleTooth } from "@/components/crm/desktop/ToothChart";
import {
  buildPatients,
  patientCities,
  patientStatuses,
  type Patient,
  type PatientStatus,
  type ToothState,
} from "@/data/crm";
import { useStoredList } from "@/lib/stored-list";
import { downloadText } from "@/lib/simple-pdf";
import { formatGroupedNumber } from "@/lib/format";
import { NewPatientModal, patientFromDraft, type NewPatientDraft } from "@/components/crm/NewPatientModal";

const PATIENT_STATES: ToothState[] = ["soglom", "davolanmoqda", "davolangan", "muammo"];
const SEED = buildPatients();

function norm(value: string) {
  return value.toLowerCase().replaceAll("‘", "'");
}

function csv(items: Patient[]) {
  const head = "id,ism,yosh,jins,telefon,shahar,status,oxirgi,keyingi";
  const rows = items.map((item) => [item.id, item.name, item.age, item.gender, item.phone, item.city, item.status, item.lastVisit, item.nextVisit].join(","));
  return [head, ...rows].join("\n");
}

export function PatientsDesktop() {
  const [items, setItems] = useStoredList("sk-crm-patients-v1", SEED);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PatientStatus | "">("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<"yangi" | "eski" | "ism">("yangi");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [selected, setSelected] = useState("p-0001");
  const [checked, setChecked] = useState<string[]>([]);
  const [tab, setTab] = useState<"umumiy" | "davolash" | "tolov" | "hujjat">("umumiy");
  const [dentition, setDentition] = useState<"doimiy" | "sut">("doimiy");
  const [menu, setMenu] = useState(false);
  const [adding, setAdding] = useState(false);
  const [visit, setVisit] = useState(false);
  const [toast, setToast] = useState("");
  const [visitForm, setVisitForm] = useState({ date: "22.10.2026", kind: "Maslahat", note: "", doctor: "Dr. Karimov" });

  const filtered = useMemo(() => {
    const query = norm(q.trim());
    const next = items.filter((item) => {
      if (status && item.status !== status) return false;
      if (city && item.city !== city) return false;
      if (!query) return true;
      return norm(`${item.name} ${item.phone} ${item.id} ${item.city}`).includes(query);
    });
    next.sort((a, b) => {
      if (sort === "ism") return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
      if (sort === "eski") return a.created.localeCompare(b.created);
      return (b.addedAt ?? 0) - (a.addedAt ?? 0) || b.created.localeCompare(a.created);
    });
    return next;
  }, [city, items, q, sort, status]);

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const safePage = Math.min(page, pages);
  const slice = filtered.slice((safePage - 1) * size, safePage * size);
  const current = items.find((item) => item.id === selected) ?? slice[0] ?? items[0];

  function patch(id: string, update: (item: Patient) => Patient) {
    setItems((prev) => prev.map((item) => (item.id === id ? update(item) : item)));
  }

  function addPatient(draft: NewPatientDraft) {
    const next = patientFromDraft(draft, items.length + 1);
    setItems((prev) => [next, ...prev]);
    setSelected(next.id);
    setStatus("");
    setQ("");
    setCity("");
    setAdding(false);
    setPage(1);
    setToast(`${next.name} qo‘shildi`);
    window.setTimeout(() => setToast(""), 2800);
  }

  return (
    <CrmFrame active="patients" placeholder="Bemor qidirish (ism, telefon, ID)..." headerQuery={q} onHeaderQuery={(value) => { setQ(value); setPage(1); }}>
      <div data-testid="patients-desktop">
        <div className="crm-head">
          <div>
            <h1>Bemorlar CRM</h1>
            <p>Barcha bemorlaringizni boshqaring</p>
          </div>
          <div className="crm-actions" style={{ position: "relative" }}>
            <button type="button" className="crm-btn blue" data-testid="patient-add" onClick={() => setAdding(true)}><Plus className="i" /> Yangi bemor qo‘shish</button>
            <label className="crm-btn">
              <Upload className="i" /> Import
              <input data-testid="patient-import" type="file" accept=".csv,text/csv" hidden onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const rows = text.split(/\r?\n/).slice(1).filter(Boolean);
                const extra: Patient[] = rows.map((row, index) => {
                  const [name, phone, cityName, age, gender] = row.split(",");
                  return { id: `imp-${Date.now()}-${index}`, num: 0, name: name || "Bemor", age: Number(age) || 30, gender: gender === "Erkak" ? "Erkak" : "Ayol", phone: phone || "", city: cityName || "Toshkent", status: "yangi", lastVisit: "", nextVisit: "", avatar: "/img/jobs/doctor.jpg", email: "", created: "2026-10-22", teeth: {}, visits: [], payments: [], docs: [] };
                });
                setItems((prev) => [...extra, ...prev]);
              }} />
            </label>
            <button type="button" className="crm-btn" data-testid="patient-export" onClick={() => downloadText("bemorlar.csv", csv(filtered))}><Download className="i" /> Eksport</button>
            <button type="button" className="crm-btn" aria-label="Yana" data-testid="patient-more" onClick={() => setMenu((value) => !value)}><MoreHorizontal className="i" /></button>
            {menu ? (
              <div className="crm-menu">
                <button type="button" onClick={() => { setItems((prev) => prev.filter((item) => !checked.includes(item.id))); setChecked([]); setMenu(false); }}>Tanlanganlarni o‘chirish</button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="crm-tools">
          <label className="crm-search"><Search className="i" /><input data-testid="patient-search" aria-label="Bemor qidirish" value={q} placeholder="Bemor qidirish..." onChange={(event) => { setQ(event.target.value); setPage(1); }} /></label>
          <label className="crm-select"><select data-testid="patient-status" aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value as PatientStatus | ""); setPage(1); }}><option value="">Barcha statuslar</option>{patientStatuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
          <label className="crm-select"><select data-testid="patient-city" aria-label="Shahar" value={city} onChange={(event) => { setCity(event.target.value); setPage(1); }}><option value="">Barcha shaharlar</option>{patientCities.map((item) => <option key={item}>{item}</option>)}</select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
          <label className="crm-select"><select data-testid="patient-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="yangi">Yangi oldin</option><option value="eski">Eski oldin</option><option value="ism">Ism</option></select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
        </div>
        <div className="crm-split">
          <div className="crm-card">
            <table className="crm-table">
              <thead>
                <tr>
                  <th><input type="checkbox" aria-label="Barchasini tanlash" checked={slice.length > 0 && slice.every((item) => checked.includes(item.id))} onChange={(event) => setChecked(event.target.checked ? slice.map((item) => item.id) : [])} /></th>
                  <th>#</th><th>Bemor</th><th>Telefon</th><th>Shahar</th><th>Status</th><th>Oxirgi tashrif</th><th>Keyingi qabul</th><th />
                </tr>
              </thead>
              <tbody>
                {slice.map((item) => (
                  <tr key={item.id} className={item.id === current?.id ? "on" : undefined} data-testid="patient-row" onClick={() => setSelected(item.id)}>
                    <td><input type="checkbox" aria-label={item.name} checked={checked.includes(item.id)} onChange={(event) => setChecked((prev) => event.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id))} onClick={(event) => event.stopPropagation()} /></td>
                    <td>{item.num}</td>
                    <td><span className="crm-person pt-who"><img src={item.avatar} alt="" /><span><b><Link href={`/crm/bemorlar/${item.id}`} data-testid="patient-profile-link" onClick={(event) => event.stopPropagation()}>{item.name}</Link></b><small>{item.age} yosh · {item.gender}</small></span></span></td>
                    <td>{item.phone}</td>
                    <td>{item.city}</td>
                    <td><span className={`crm-pill ${item.status}`}>{patientStatuses.find((entry) => entry.id === item.status)?.label}</span></td>
                    <td>{item.lastVisit || "–"}</td>
                    <td>{item.nextVisit || "–"}</td>
                    <td><button type="button" aria-label="Amallar" onClick={(event) => { event.stopPropagation(); setSelected(item.id); }}>···</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CrmPager page={safePage} pages={pages} size={size} totalLabel={`Jami: ${filtered.length} bemor`} onPage={setPage} onSize={(value) => { setSize(value); setPage(1); }} />
          </div>
          {current ? (
            <aside className="pt-side" data-testid="patient-panel">
              <span className="crm-person"><img src={current.avatar} alt="" /><span><b>{current.name}</b><small>#{current.id.toUpperCase()}</small></span></span>
              <h2>{current.name}</h2>
              <p className="crm-muted">{current.age} yosh · {current.gender}</p>
              <p className="crm-muted">{current.phone}</p>
              <p className="crm-muted">{current.city}</p>
              <p className="crm-muted">{current.email}</p>
              <button type="button" className="crm-btn blue" style={{ width: "100%", justifyContent: "center", marginTop: "calc(.4 * var(--u))" }} data-testid="patient-visit" onClick={() => setVisit(true)}>Qabul qo‘shish</button>
              <div className="pt-tabs">
                {([["umumiy", "Umumiy"], ["davolash", "Davolash"], ["tolov", "To‘lovlar"], ["hujjat", "Hujjatlar"]] as const).map(([id, label]) => (
                  <button key={id} type="button" className={tab === id ? "on" : undefined} data-testid={`pt-tab-${id}`} onClick={() => setTab(id)}>{label}</button>
                ))}
              </div>
              {tab === "umumiy" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <b>Tish kartasi</b>
                    <div className="ap-view">
                      <button type="button" className={dentition === "doimiy" ? "on" : undefined} onClick={() => setDentition("doimiy")}>Doimiy</button>
                      <button type="button" className={dentition === "sut" ? "on" : undefined} onClick={() => setDentition("sut")}>Sut tishlari</button>
                    </div>
                  </div>
                  <ToothChart
                    upper={dentition === "doimiy" ? ADULT_UPPER : BABY_UPPER}
                    lower={dentition === "doimiy" ? ADULT_LOWER : BABY_LOWER}
                    teeth={current.teeth}
                    legend={[{ id: "soglom", label: "Sog‘lom" }, { id: "davolanmoqda", label: "Davolanmoqda" }, { id: "davolangan", label: "Davolangan" }, { id: "muammo", label: "Muammo" }]}
                    onCycle={(id) => patch(current.id, (item) => ({ ...item, teeth: { ...item.teeth, [id]: cycleTooth(item.teeth[id], PATIENT_STATES) } }))}
                  />
                  <h3 style={{ marginTop: "calc(.5 * var(--u))", fontSize: "calc(.68 * var(--u))" }}>So‘nggi tashriflar</h3>
                  {current.visits.length === 0 ? <p className="crm-muted">Tashrif yo‘q</p> : current.visits.map((item) => (
                    <div key={`${item.date}-${item.note}`} className="visit"><span><b>{item.date}</b>{item.kind}<small className="crm-muted">{item.note}</small></span><span>{item.doctor}</span></div>
                  ))}
                </>
              ) : null}
              {tab === "davolash" ? (current.visits.filter((item) => item.kind !== "Gigiyena").map((item) => <div key={item.note} className="visit"><span><b>{item.kind}</b>{item.note}</span><span>{item.date}</span></div>)) : null}
              {tab === "tolov" ? (current.payments.length === 0 ? <p className="crm-muted">To‘lov yo‘q</p> : current.payments.map((item) => <div key={item.note} className="visit"><span><b>{item.date}</b>{item.note}</span><span>{formatGroupedNumber(item.amount)} so‘m</span></div>)) : null}
              {tab === "hujjat" ? (current.docs.length === 0 ? <p className="crm-muted">Hujjat yo‘q</p> : current.docs.map((item) => <div key={item.name} className="visit"><span><b>{item.name}</b>{item.detail}</span><button type="button" onClick={() => downloadText(item.name, `${current.name}\n${item.name}`, "text/plain")}>Yuklab olish</button></div>)) : null}
            </aside>
          ) : null}
        </div>
        {adding ? <NewPatientModal onClose={() => setAdding(false)} onSave={addPatient} /> : null}
        {toast ? <div className="nb-toast" data-testid="patient-toast" role="status"><i />{toast}</div> : null}
        {visit && current ? (
          <CrmModal title="Qabul qo‘shish" onClose={() => setVisit(false)}>
            <label className="crm-field">Sana<input value={visitForm.date} onChange={(event) => setVisitForm({ ...visitForm, date: event.target.value })} /></label>
            <label className="crm-field">Tur<input value={visitForm.kind} onChange={(event) => setVisitForm({ ...visitForm, kind: event.target.value })} /></label>
            <label className="crm-field">Izoh<input value={visitForm.note} onChange={(event) => setVisitForm({ ...visitForm, note: event.target.value })} /></label>
            <div className="row"><button type="button" className="go" data-testid="visit-save" onClick={() => { patch(current.id, (item) => ({ ...item, lastVisit: visitForm.date, visits: [{ ...visitForm }, ...item.visits] })); setVisit(false); }}>Saqlash</button></div>
          </CrmModal>
        ) : null}
      </div>
    </CrmFrame>
  );
}
