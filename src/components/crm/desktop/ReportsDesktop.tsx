"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, CalendarDays, ChevronLeft, ChevronRight, ClipboardList, Eye, FileSpreadsheet, FileText, Receipt, Search, UserPlus, Wallet } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { planTotals } from "@/components/crm/NewPaymentModal";
import type { Appointment, ClinicPayment, Patient, PayMethod, TreatmentPlan } from "@/data/crm";
import { formatGroupedNumber } from "@/lib/format";
import { downloadPdf, downloadText } from "@/lib/simple-pdf";
import { useStoredList } from "@/lib/stored-list";
import { useCrmAppointments, useCrmPatients } from "@/lib/use-crm-list";
import { tashkentDateParts } from "@/lib/tashkent-date";
import "./reports.css";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
const SHORT = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
/** Fixed order, validated for colour-vision separation; every slice also has a text label and value. */
const METHOD_COLOR: Record<PayMethod, string> = { Naqd: "#0d9488", Click: "#3b82f6", Payme: "#f59e0b", Karta: "#8b5cf6", "O‘tkazma": "#e11d48" };
const METHODS = Object.keys(METHOD_COLOR) as PayMethod[];
const PAGE = 8;

type Range = "kun" | "hafta" | "oy";

/** "24.10.2026" or "2026-10-24…" → "2026-10-24". */
function iso(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const [d, m, y] = value.split(".");
  return y && m && d ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "";
}

function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysIn(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function money(value: number) {
  return `${formatGroupedNumber(Math.round(value))} so‘m`;
}

function initials(name: string) {
  return name.replace(/^Dr\.?\s*/i, "").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "—";
}

/** Desktop /crm/hisobotlar (mock "hisobotlar"). Everything is computed from the clinic's own payments, plans, patients and appointments. */
export function ReportsDesktop() {
  const [payments] = useStoredList<ClinicPayment>("sk-crm-payments-v1", []);
  const [plans] = useStoredList<TreatmentPlan>("sk-crm-plans-v1", []);
  const [patients] = useCrmPatients<Patient>();
  const [appointments] = useCrmAppointments<Appointment>();
  const [ym, setYm] = useState(tashkentDateParts().iso.slice(0, 7));
  const [range, setRange] = useState<Range>("kun");
  const [tab, setTab] = useState<"all" | "tolandi" | "qisman" | "qarz">("all");
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("");
  const [page, setPage] = useState(1);
  const [y, m] = ym.split("-").map(Number);
  const prev = shiftMonth(ym, -1);

  const doctorOf = useMemo(() => new Map(plans.map((plan) => [plan.id, plan.doctor])), [plans]);
  const inMonth = (key: string, month: string) => key.startsWith(month);

  const monthPays = useMemo(() => payments.filter((item) => inMonth(iso(item.date), ym)), [payments, ym]);
  const stats = useMemo(() => {
    const of = (month: string) => {
      const pays = payments.filter((item) => inMonth(iso(item.date), month));
      const revenue = pays.reduce((sum, item) => sum + item.amount, 0);
      return {
        revenue,
        patients: patients.filter((item) => inMonth(iso(item.created), month)).length,
        visits: appointments.filter((item) => inMonth(iso(item.date), month) && item.status !== "bekor").length,
        check: pays.length ? revenue / pays.length : 0,
      };
    };
    const months = Array.from({ length: 6 }, (_, index) => shiftMonth(ym, index - 5));
    return { now: of(ym), before: of(prev), trend: months.map(of) };
  }, [appointments, patients, payments, prev, ym]);

  const bars = useMemo(() => {
    if (range === "oy") {
      return Array.from({ length: 12 }, (_, index) => {
        const key = `${y}-${String(index + 1).padStart(2, "0")}`;
        return { label: SHORT[index], value: payments.filter((item) => inMonth(iso(item.date), key)).reduce((sum, item) => sum + item.amount, 0), current: key === ym };
      });
    }
    const days = daysIn(ym);
    const daily = Array.from({ length: days }, (_, index) => {
      const key = `${ym}-${String(index + 1).padStart(2, "0")}`;
      return monthPays.filter((item) => iso(item.date) === key).reduce((sum, item) => sum + item.amount, 0);
    });
    if (range === "kun") return daily.map((value, index) => ({ label: String(index + 1).padStart(2, "0"), value, current: false }));
    return Array.from({ length: Math.ceil(days / 7) }, (_, week) => ({
      label: `${week * 7 + 1}–${Math.min(days, week * 7 + 7)}`,
      value: daily.slice(week * 7, week * 7 + 7).reduce((sum, value) => sum + value, 0),
      current: false,
    }));
  }, [monthPays, payments, range, y, ym]);
  const peak = Math.max(1, ...bars.map((bar) => bar.value));
  const scale = niceScale(peak);

  const byMethod = useMemo(() => {
    const total = monthPays.reduce((sum, item) => sum + item.amount, 0);
    return { total, rows: METHODS.map((id) => ({ id, value: monthPays.filter((item) => item.method === id).reduce((sum, item) => sum + item.amount, 0) })) };
  }, [monthPays]);

  const group = (key: (item: ClinicPayment) => string) => {
    const map = new Map<string, number>();
    for (const item of monthPays) map.set(key(item), (map.get(key(item)) ?? 0) + item.amount);
    const total = monthPays.reduce((sum, item) => sum + item.amount, 0) || 1;
    return [...map].map(([name, value]) => ({ name, value, share: Math.round((value / total) * 100) })).sort((a, b) => b.value - a.value).slice(0, 5);
  };
  const byService = group((item) => item.service || "Boshqa");
  const byDoctor = group((item) => (item.planId && doctorOf.get(item.planId)) || "Shifokor biriktirilmagan");

  const debtors = useMemo(
    () => plans.map((plan) => ({ plan, debt: planTotals(plan).debt, patient: patients.find((item) => item.id === plan.patientId)?.name ?? "Bemor" })).filter((row) => row.debt > 0).sort((a, b) => b.debt - a.debt),
    [patients, plans],
  );

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...monthPays]
      .filter((item) => (tab === "all" || tab === "qarz" ? true : item.status === tab))
      .filter((item) => !method || item.method === method)
      .filter((item) => !query || `${item.patient} ${item.service}`.toLowerCase().includes(query))
      .sort((a, b) => iso(b.date).localeCompare(iso(a.date)));
  }, [method, monthPays, q, tab]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages);
  const pageRows = rows.slice((current - 1) * PAGE, current * PAGE);

  const period = `01-${SHORT[m - 1]} ${y} — ${daysIn(ym)}-${SHORT[m - 1]} ${y}`;

  function exportCsv() {
    const head = "Sana,Bemor,Xizmat,Shifokor,Summa,To'lov usuli,Status";
    const body = rows.map((item) => [item.date, item.patient, item.service, (item.planId && doctorOf.get(item.planId)) || "", item.amount, item.method, item.status === "tolandi" ? "To'langan" : "Qisman"].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","));
    downloadText(`hisobot-${ym}.csv`, `﻿${[head, ...body].join("\n")}\n`, "text/csv");
  }

  function exportPdf() {
    downloadPdf(`hisobot-${ym}.pdf`, [
      `Hisobot: ${MONTHS[m - 1]} ${y}`,
      "",
      `Umumiy daromad: ${money(stats.now.revenue)}`,
      `Yangi bemorlar: ${stats.now.patients}`,
      `Qabullar soni: ${stats.now.visits}`,
      `O'rtacha chek: ${money(stats.now.check)}`,
      "",
      "To'lov usullari:",
      ...byMethod.rows.filter((row) => row.value).map((row) => `  ${row.id}: ${money(row.value)}`),
      "",
      "Xizmatlar bo'yicha:",
      ...byService.map((row) => `  ${row.name}: ${money(row.value)} (${row.share}%)`),
    ].slice(0, 38));
  }

  const kpis = [
    { key: "revenue", label: "Umumiy daromad", icon: <Wallet />, tone: "amber", now: stats.now.revenue, before: stats.before.revenue, text: money(stats.now.revenue), prevText: money(stats.before.revenue), trend: stats.trend.map((row) => row.revenue) },
    { key: "patients", label: "Yangi bemorlar", icon: <UserPlus />, tone: "teal", now: stats.now.patients, before: stats.before.patients, text: `${stats.now.patients} ta`, prevText: `${stats.before.patients} ta`, trend: stats.trend.map((row) => row.patients) },
    { key: "visits", label: "Qabullar soni", icon: <CalendarDays />, tone: "teal", now: stats.now.visits, before: stats.before.visits, text: `${stats.now.visits} ta`, prevText: `${stats.before.visits} ta`, trend: stats.trend.map((row) => row.visits) },
    { key: "check", label: "O‘rtacha chek", icon: <Receipt />, tone: "amber", now: stats.now.check, before: stats.before.check, text: money(stats.now.check), prevText: money(stats.before.check), trend: stats.trend.map((row) => row.check) },
  ];

  let offset = 0;
  const ring = 2 * Math.PI * 52;

  return (
    <ClinicShell accent="teal">
      <div className="rp" data-testid="reports-desktop">
        <header className="rp-head">
          <div>
            <h1>Hisobotlar</h1>
            <p>Klinikangiz faoliyati bo‘yicha moliyaviy va tahliliy statistikalar</p>
          </div>
          <div className="rp-period">
            <button type="button" aria-label="Oldingi oy" onClick={() => { setYm(prev); setPage(1); }}><ChevronLeft /></button>
            <span><CalendarDays /> {period}</span>
            <button type="button" aria-label="Keyingi oy" onClick={() => { setYm(shiftMonth(ym, 1)); setPage(1); }}><ChevronRight /></button>
          </div>
          <button type="button" className="rp-export" data-testid="reports-export" onClick={exportCsv}><FileSpreadsheet /> Excel export</button>
          <button type="button" className="rp-export" data-testid="reports-pdf" onClick={exportPdf}><FileText /> PDF export</button>
        </header>

        <section className="rp-kpis">
          {kpis.map((kpi) => {
            const pct = kpi.before ? Math.round(((kpi.now - kpi.before) / kpi.before) * 100) : null;
            const top = Math.max(1, ...kpi.trend);
            return (
              <article key={kpi.key}>
                <i className={kpi.tone}>{kpi.icon}</i>
                <div>
                  <small>{kpi.label}</small>
                  <b data-testid={kpi.key === "revenue" ? "report-revenue" : undefined}>
                    {kpi.text}
                    {pct !== null ? <em className={pct >= 0 ? "up" : "down"}>{pct >= 0 ? <ArrowUp /> : <ArrowDown />}{Math.abs(pct)}%</em> : null}
                  </b>
                  <small>O‘tgan oy: {kpi.prevText}</small>
                </div>
                <span className="rp-spark" aria-hidden="true">
                  {kpi.trend.map((value, index) => <i key={index} style={{ height: `${Math.max(8, (value / top) * 100)}%` }} />)}
                </span>
              </article>
            );
          })}
        </section>

        <div className="rp-grid">
          <section className="rp-card rp-chart">
            <header>
              <h2>Daromad grafigi</h2>
              <div className="rp-seg" role="tablist">
                {([["kun", "Kunlik"], ["hafta", "Haftalik"], ["oy", "Oylik"]] as const).map(([id, label]) => (
                  <button key={id} type="button" role="tab" aria-selected={range === id} className={range === id ? "on" : undefined} onClick={() => setRange(id)}>{label}</button>
                ))}
              </div>
              <span className="rp-month">{range === "oy" ? y : `${MONTHS[m - 1][0].toUpperCase()}${MONTHS[m - 1].slice(1)} ${y}`}</span>
            </header>
            <div className="rp-plot">
              <div className="rp-axis">{scale.ticks.slice().reverse().map((tick) => <span key={tick}>{tick ? `${formatTick(tick)}` : "0"}</span>)}</div>
              <div className="rp-bars" role="img" aria-label="Daromad grafigi">
                {bars.map((bar, index) => (
                  <span key={`${bar.label}-${index}`} className={bar.current ? "bar on" : "bar"} style={{ height: `${(bar.value / scale.max) * 100}%` }} data-tip={`${bar.label}: ${money(bar.value)}`} />
                ))}
              </div>
            </div>
            <div className="rp-labels" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
              {bars.map((bar, index) => <span key={`${bar.label}-${index}`}>{range === "kun" ? (index % 2 === 0 ? bar.label : "") : bar.label}</span>)}
            </div>
            <p className="rp-legend"><i /> Tushum{peak <= 1 ? " · bu davrda to‘lov yo‘q" : ""}</p>
          </section>

          <section className="rp-card rp-donut">
            <header><h2>To‘lov usullari</h2></header>
            <div className="rp-ring">
              <svg viewBox="0 0 120 120" role="img" aria-label="To‘lov usullari ulushi">
                <circle cx="60" cy="60" r="52" className="track" />
                {byMethod.total ? byMethod.rows.filter((row) => row.value).map((row) => {
                  const part = (row.value / byMethod.total) * ring;
                  const el = (
                    <circle key={row.id} cx="60" cy="60" r="52" stroke={METHOD_COLOR[row.id]} strokeDasharray={`${Math.max(0, part - 2)} ${ring}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)">
                      <title>{`${row.id}: ${money(row.value)}`}</title>
                    </circle>
                  );
                  offset += part;
                  return el;
                }) : null}
              </svg>
              <span><b>{formatGroupedNumber(byMethod.total)}</b><small>so‘m · jami tushum</small></span>
            </div>
            <ul>
              {byMethod.rows.map((row) => (
                <li key={row.id}>
                  <i style={{ background: METHOD_COLOR[row.id] }} />
                  <span>{row.id}</span>
                  <small>{byMethod.total ? Math.round((row.value / byMethod.total) * 100) : 0}%</small>
                  <b>{formatGroupedNumber(row.value)}</b>
                </li>
              ))}
            </ul>
          </section>

          <section className="rp-card rp-rank">
            <header><h2>Xizmatlar bo‘yicha daromad</h2><Link href="/crm/xizmatlar">Barchasini ko‘rish <ArrowRight /></Link></header>
            {byService.length === 0 ? <p className="rp-muted">Bu oyda to‘lov yo‘q.</p> : byService.map((row) => (
              <div key={row.name} className="rp-row">
                <span className="ic"><ClipboardList /></span>
                <span className="txt"><b>{row.name}</b><small>{money(row.value)}</small><i><em style={{ width: `${row.share}%` }} /></i></span>
                <strong>{row.share}%</strong>
              </div>
            ))}
          </section>

          <section className="rp-card rp-table">
            <div className="rp-tabs" role="tablist">
              {([["all", "Barcha to‘lovlar"], ["tolandi", "To‘langan"], ["qisman", "Qisman"], ["qarz", "Qarzdorlik"]] as const).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "on" : undefined} onClick={() => { setTab(id); setPage(1); }}>
                  {label}{id === "qarz" && debtors.length ? <em>{debtors.length}</em> : null}
                </button>
              ))}
            </div>
            {tab === "qarz" ? (
              <table>
                <thead><tr><th>#</th><th>Bemor</th><th>Davolash rejasi</th><th>Shifokor</th><th>Jami</th><th>To‘langan</th><th>Qarz</th></tr></thead>
                <tbody>
                  {debtors.length === 0 ? <tr><td colSpan={7} className="empty">Qarzdorlik yo‘q.</td></tr> : debtors.map((row, index) => {
                    const totals = planTotals(row.plan);
                    return (
                      <tr key={row.plan.id}>
                        <td>{index + 1}</td><td>{row.patient}</td><td>{row.plan.title}</td><td>{row.plan.doctor || "—"}</td>
                        <td>{formatGroupedNumber(totals.total)}</td><td>{formatGroupedNumber(totals.paid)}</td><td className="debt">{formatGroupedNumber(row.debt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <>
                <div className="rp-filters">
                  <label className="rp-search"><Search /><input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="To‘lov qidirish (bemor, xizmat)..." /></label>
                  <select value={method} onChange={(event) => { setMethod(event.target.value); setPage(1); }} aria-label="To‘lov usuli">
                    <option value="">To‘lov usuli</option>
                    {METHODS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <table>
                  <thead><tr><th>#</th><th>Sana</th><th>Bemor</th><th>Xizmat</th><th>Shifokor</th><th>Summa (so‘m)</th><th>To‘lov usuli</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {pageRows.length === 0 ? <tr><td colSpan={9} className="empty" data-testid="reports-empty">Bu davrda to‘lov yo‘q. Raqamlar to‘lovlar kiritilgach chiqadi.</td></tr> : pageRows.map((item, index) => (
                      <tr key={item.id}>
                        <td>{(current - 1) * PAGE + index + 1}</td>
                        <td>{item.date}</td>
                        <td>{item.patient}</td>
                        <td>{item.service}</td>
                        <td>{(item.planId && doctorOf.get(item.planId)) || "—"}</td>
                        <td>{formatGroupedNumber(item.amount)}</td>
                        <td><span className="pill" style={{ color: METHOD_COLOR[item.method], background: `${METHOD_COLOR[item.method]}1a` }}>{item.method}</span></td>
                        <td><span className={item.status === "tolandi" ? "st ok" : "st part"}>{item.status === "tolandi" ? "To‘langan" : "Qisman"}</span></td>
                        <td><Link href="/crm/tolovlar" aria-label="To‘lovlarda ochish"><Eye /></Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <footer className="rp-pager">
                  <span>Jami: <b>{rows.length}</b> ta to‘lov</span>
                  <div>
                    <button type="button" aria-label="Oldingi sahifa" disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft /></button>
                    {Array.from({ length: pages }, (_, index) => index + 1).slice(Math.max(0, current - 3), Math.max(0, current - 3) + 5).map((n) => (
                      <button key={n} type="button" className={n === current ? "on" : undefined} onClick={() => setPage(n)}>{n}</button>
                    ))}
                    <button type="button" aria-label="Keyingi sahifa" disabled={current >= pages} onClick={() => setPage(current + 1)}><ChevronRight /></button>
                  </div>
                </footer>
              </>
            )}
          </section>

          <section className="rp-card rp-rank rp-docs">
            <header><h2>Shifokorlar bo‘yicha daromad</h2><Link href="/crm/davolash-rejalari">Rejalar <ArrowRight /></Link></header>
            {byDoctor.length === 0 ? <p className="rp-muted">Bu oyda to‘lov yo‘q.</p> : byDoctor.map((row) => (
              <div key={row.name} className="rp-row">
                <span className="ava">{initials(row.name)}</span>
                <span className="txt"><b>{row.name}</b><small>{money(row.value)}</small><i><em style={{ width: `${row.share}%` }} /></i></span>
                <strong>{row.share}%</strong>
              </div>
            ))}
            <p className="rp-note">Shifokor to‘lov bog‘langan davolash rejasidan olinadi.</p>
          </section>
        </div>
      </div>
    </ClinicShell>
  );
}

function niceScale(peak: number) {
  const raw = peak / 4;
  const pow = 10 ** Math.floor(Math.log10(Math.max(1, raw)));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * pow).find((s) => s >= raw) ?? raw;
  return { max: step * 4, ticks: [0, step, step * 2, step * 3, step * 4] };
}

function formatTick(value: number) {
  if (value >= 1_000_000) return `${+(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${+(value / 1_000).toFixed(0)}K`;
  return String(value);
}
