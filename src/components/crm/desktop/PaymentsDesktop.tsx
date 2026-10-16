"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import { CrmFrame, CrmPager } from "@/components/crm/desktop/CrmFrame";
import { NewPaymentModal } from "@/components/crm/CrmCreateModals";
import { buildPayments, debtors, revenueBars, type ClinicPayment, type PayMethod } from "@/data/crm";
import { formatGroupedNumber, formatMoney } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";

const SEED = buildPayments();
const METHODS: PayMethod[] = ["Click", "Payme", "Karta", "Naqd"];

function parseDate(value: string) {
  const [day, month, year] = value.split(".");
  return `${year}-${month}-${day}`;
}

export function PaymentsDesktop() {
  const [items, setItems] = useStoredList("sk-crm-payments-v1", SEED);
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<PayMethod | "">("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-31");
  const [chart, setChart] = useState<"kun" | "hafta" | "oy">("kun");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState<PayMethod | "">("");
  const [form, setForm] = useState({ patient: "", service: "Konsultatsiya", amount: "200000", method: "Naqd" as PayMethod, date: "2026-10-22", note: "" });

  const filtered = useMemo(() => items.filter((item) => {
    const iso = parseDate(item.date);
    if (iso < from || iso > to) return false;
    if (method && item.method !== method) return false;
    if (status && item.status !== status) return false;
    if (q.trim() && !`${item.patient} ${item.service} ${item.id}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [from, items, method, q, status, to]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const safe = Math.min(page, pages);
  const slice = filtered.slice((safe - 1) * size, safe * size);
  const pristine = from === "2026-10-01" && to === "2026-10-31" && !q && !method && !status && items.length === SEED.length;
  const sum = filtered.reduce((total, item) => total + item.amount, 0);
  const by = (name: PayMethod) => filtered.filter((item) => item.method === name).reduce((total, item) => total + item.amount, 0);
  const donut = pristine
    ? [{ name: "Karta", value: 28300000, color: "#3b6cff", pct: "54%" }, { name: "Click", value: 12600000, color: "#22c55e", pct: "24%" }, { name: "Payme", value: 7800000, color: "#a78bfa", pct: "15%" }, { name: "Naqd", value: 3700000, color: "#fb923c", pct: "7%" }]
    : METHODS.map((name, index) => ({ name, value: by(name), color: ["#22c55e", "#a78bfa", "#3b6cff", "#fb923c"][index], pct: sum ? `${Math.round((by(name) / sum) * 100)}%` : "0%" }));
  const totalDonut = donut.reduce((total, item) => total + item.value, 0) || 1;
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const bars = chart === "kun" ? revenueBars : chart === "hafta" ? [8, 14, 18, 16, 12] : [22, 28, 31, 26, 34, 40];

  return (
    <CrmFrame active="payments" placeholder="Bemor, telefon, to‘lov raqami yoki xizmat nomi..." headerQuery={q} onHeaderQuery={(value) => { setQ(value); setPage(1); }}>
      <div data-testid="payments-desktop">
        <div className="crm-head">
          <div>
            <h1>To‘lovlar</h1>
            <p>Moliyaviy operatsiyalar va bemor to‘lovlari</p>
          </div>
          <div className="crm-actions">
            <label className="crm-select" style={{ width: "auto" }}>
              <input aria-label="Boshlanish" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              <input aria-label="Tugash" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
            </label>
            <button type="button" className="crm-btn blue" data-testid="pay-add" onClick={() => setOpen("Naqd")}><Plus className="i" /> Yangi to‘lov</button>
          </div>
        </div>
        <div className="pay-kpis">
          <article><small>Jami tushum</small><b>{pristine ? "52 400 000 so‘m" : formatMoney(sum, "UZS")}</b><em className="money-plus">+12% o‘tgan oyga nisbatan</em></article>
          <article><small>Naqd tushum</small><b>{pristine ? "8 700 000 so‘m" : formatMoney(by("Naqd"), "UZS")}</b><em className="money-plus">+5% o‘tgan oyga nisbatan</em></article>
          <article><small>Karta to‘lovlari</small><b>{pristine ? "28 300 000 so‘m" : formatMoney(by("Karta"), "UZS")}</b><em className="money-plus">+18% o‘tgan oyga nisbatan</em></article>
          <article><small>Qolgan qarzdorlik</small><b className="money-minus">{pristine ? "14 600 000 so‘m" : formatMoney(14600000, "UZS")}</b><em className="money-minus">-8% o‘tgan oyga nisbatan</em></article>
        </div>
        <div className="pay-charts">
          <div className="crm-card" style={{ padding: "calc(.5 * var(--u))" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><b>Tushum dinamikasi</b><div className="ap-view">{(["kun", "hafta", "oy"] as const).map((item) => <button key={item} type="button" className={chart === item ? "on" : undefined} data-testid={`chart-${item}`} onClick={() => setChart(item)}>{item === "kun" ? "Kunlik" : item === "hafta" ? "Haftalik" : "Oylik"}</button>)}</div></div>
            <div className="bars" data-testid="pay-bars">{bars.map((value, index) => <i key={index} style={{ height: `${(value / Math.max(...bars)) * 100}%` }} />)}</div>
          </div>
          <div className="crm-card" style={{ padding: "calc(.5 * var(--u))", display: "flex", gap: "calc(.4 * var(--u))" }}>
            <svg className="donut" viewBox="0 0 120 120" aria-label="To‘lov usullari">
              {donut.map((item) => {
                const length = (item.value / totalDonut) * circ;
                const dash = `${length} ${circ - length}`;
                const node = <circle key={item.name} cx="60" cy="60" r={radius} fill="none" stroke={item.color} strokeWidth="14" strokeDasharray={dash} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />;
                offset += length;
                return node;
              })}
              <text x="60" y="58" textAnchor="middle" fontSize="11" fontWeight="800">{pristine ? "52.4M" : `${Math.round(sum / 1_000_000)}M`}</text>
              <text x="60" y="72" textAnchor="middle" fontSize="8">so‘m</text>
            </svg>
            <div>
              <b>To‘lov usullari bo‘yicha</b>
              {donut.map((item) => <p key={item.name} className="crm-muted"><i style={{ background: item.color, width: 8, height: 8, display: "inline-block", borderRadius: 99, marginRight: 6 }} />{item.name} {formatGroupedNumber(item.value)} {item.pct}</p>)}
            </div>
          </div>
        </div>
        <div className="crm-split">
          <div className="crm-card">
            <div className="crm-tools" style={{ padding: "calc(.4 * var(--u))" }}>
              <b>So‘nggi to‘lovlar</b>
              <label className="crm-search"><Search className="i" /><input data-testid="pay-search" aria-label="To‘lov qidirish" value={q} placeholder="Bemor nomi, telefon, xizmat..." onChange={(event) => { setQ(event.target.value); setPage(1); }} /></label>
              <label className="crm-select"><select data-testid="pay-method" aria-label="Usul" value={method} onChange={(event) => { setMethod(event.target.value as PayMethod | ""); setPage(1); }}><option value="">Barcha usullar</option>{METHODS.map((item) => <option key={item}>{item}</option>)}</select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
              <label className="crm-select"><select data-testid="pay-status" aria-label="Holat" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Barcha holatlar</option><option value="tolandi">To‘landi</option><option value="qisman">Qisman</option></select></label>
            </div>
            <table className="crm-table">
              <thead><tr><th>#</th><th>Sana</th><th>Bemor</th><th>Xizmat</th><th>Summa</th><th>To‘lov usuli</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {slice.map((item, index) => (
                  <tr key={item.id} data-testid="pay-row">
                    <td>{(safe - 1) * size + index + 1}</td>
                    <td>{item.date}</td>
                    <td><span className="crm-person"><img src={item.avatar} alt="" /><b>{item.patient}</b></span></td>
                    <td>{item.service}</td>
                    <td>{formatMoney(item.amount, "UZS")}</td>
                    <td><span className="crm-pill faol">{item.method}</span></td>
                    <td><span className={`crm-pill ${item.status}`}>{item.status === "tolandi" ? "To‘landi" : "Qisman"}</span></td>
                    <td>···</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CrmPager page={safe} pages={pages} size={size} totalLabel={`Jami: ${filtered.length} ta to‘lov`} onPage={setPage} onSize={(value) => { setSize(value); setPage(1); }} />
          </div>
          <aside>
            <div className="pl-box">
              <b>Qarzdor bemorlar</b>
              {debtors.map((item) => (
                <div key={item.name} className="visit"><span className="crm-person"><img src={item.avatar} alt="" /><span><b>{item.name}</b><small>{item.note} · {item.date}</small></span></span><b className="money-minus">{formatMoney(item.amount, "UZS")}</b></div>
              ))}
            </div>
            <div className="pl-box" style={{ marginTop: "calc(.4 * var(--u))" }}>
              <b>Tezkor to‘lov</b>
              <div className="pay-quick">
                {METHODS.map((item) => (
                  <button key={item} type="button" className="crm-btn" data-testid={`quick-${item}`} style={{ background: item === "Click" ? "#e8fbf3" : item === "Payme" ? "#f3e8ff" : item === "Karta" ? "#e8f1ff" : "#fff7ed" }} onClick={() => { setForm({ ...form, method: item }); setOpen(item); }}>{item}</button>
                ))}
              </div>
            </div>
          </aside>
        </div>
        {open ? (
          <NewPaymentModal
            initial={{ ...form, method: open || "Naqd" }}
            onClose={() => setOpen("")}
            onSave={(draft) => {
              const [year, month, day] = draft.date.split("-");
              const next: ClinicPayment = {
                id: `pay-user-${Date.now()}`,
                date: day && month && year ? `${day}.${month}.${year}` : "22.10.2026",
                patient: draft.patient.trim(),
                avatar: "/img/jobs/doctor.jpg",
                service: draft.note.trim() ? `${draft.service} · ${draft.note.trim()}` : draft.service,
                amount: Number(draft.amount) || 0,
                method: draft.method,
                status: "tolandi",
              };
              setItems((prev) => [next, ...prev]);
              setForm(draft);
              setOpen("");
              setPage(1);
            }}
          />
        ) : null}
      </div>
    </CrmFrame>
  );
}
