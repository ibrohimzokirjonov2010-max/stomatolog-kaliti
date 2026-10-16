"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { CrmFrame } from "@/components/crm/desktop/CrmFrame";
import { buildPatients, buildPayments, seedAppointments } from "@/data/crm";
import { formatGroupedNumber } from "@/lib/format";
import { downloadText } from "@/lib/simple-pdf";
import { useStoredList } from "@/lib/stored-list";

const PERIODS = [
  { id: "bugun", label: "Bugun" },
  { id: "hafta", label: "Hafta" },
  { id: "oy", label: "Oy" },
  { id: "yil", label: "Yil" },
] as const;

const WEEK = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan", "Yak"];

export function ReportsDesktop() {
  const [payments] = useStoredList("sk-crm-payments-v1", buildPayments());
  const [patients] = useStoredList("sk-crm-patients-v1", buildPatients());
  const [appointments] = useStoredList("sk-crm-appointments-v1", seedAppointments);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["id"]>("oy");

  const factor = period === "bugun" ? 0.08 : period === "hafta" ? 0.28 : period === "oy" ? 1 : 11;
  const revenue = Math.round(payments.reduce((sum, item) => sum + item.amount, 0) * factor);
  const visits = Math.max(1, Math.round(appointments.filter((item) => item.grid !== false).length * factor));
  const fresh = Math.max(1, Math.round(patients.filter((item) => item.status === "yangi").length * Math.min(factor, 1)));
  const debt = Math.round(18_400_000 * factor);

  const bars = useMemo(() => {
    if (period === "bugun") return [40, 70, 55, 90, 60, 30, 20];
    if (period === "hafta") return [48, 72, 64, 88, 76, 40, 28];
    if (period === "yil") return [30, 42, 38, 55, 60, 48, 70, 66, 58, 74, 80, 62];
    return [22, 35, 28, 48, 40, 62, 55, 44, 70, 58, 36, 80];
  }, [period]);

  const services = [
    { name: "Konsultatsiya", count: Math.round(86 * factor), sum: Math.round(17_200_000 * factor) },
    { name: "Plomba", count: Math.round(54 * factor), sum: Math.round(43_200_000 * factor) },
    { name: "Endodontiya", count: Math.round(21 * factor), sum: Math.round(31_500_000 * factor) },
    { name: "Gigiyena", count: Math.round(40 * factor), sum: Math.round(12_000_000 * factor) },
    { name: "Implant", count: Math.round(6 * factor), sum: Math.round(27_000_000 * factor) },
  ];

  const recent = payments.slice(0, 6);

  function exportCsv() {
    const lines = ["Bemor,Xizmat,Summa,Usul,Sana", ...recent.map((item) => `${item.patient},${item.service},${item.amount},${item.method},${item.date}`)];
    downloadText("hisobot.csv", lines.join("\n"));
  }

  return (
    <CrmFrame active="reports" placeholder="Hisobot bo‘yicha qidiring...">
      <div data-testid="reports-desktop">
        <div className="crm-head">
          <div>
            <h1>Hisobotlar</h1>
            <p>Klinik tushum, qabullar va xizmatlar</p>
          </div>
          <button type="button" className="crm-btn" data-testid="reports-export" onClick={exportCsv}><Download className="i" /> Eksport</button>
        </div>
        <div className="rp-chips">
          {PERIODS.map((item) => (
            <button key={item.id} type="button" className={period === item.id ? "on" : undefined} data-testid={`report-${item.id}`} onClick={() => setPeriod(item.id)}>{item.label}</button>
          ))}
        </div>
        <div className="rp-kpis">
          <article><span>Tushum</span><b data-testid="report-revenue">{formatGroupedNumber(revenue)}</b></article>
          <article><span>Qabullar</span><b>{formatGroupedNumber(visits)}</b></article>
          <article><span>Yangi bemorlar</span><b>{formatGroupedNumber(fresh)}</b></article>
          <article><span>Qarzdorlik</span><b>{formatGroupedNumber(debt)}</b></article>
        </div>
        <div className="rp-split">
          <section className="crm-card">
            <div className="pf-box">
              <h3>Tushum</h3>
              <div className="rp-bars" data-testid="report-bars">
                {bars.map((value, index) => <i key={`${period}-${index}`} style={{ height: `${value}%` }} title={WEEK[index % 7]} />)}
              </div>
            </div>
          </section>
          <section className="crm-card pf-box">
            <h3>Xizmatlar</h3>
            {services.map((item) => (
              <div key={item.name} className="visit">
                <span><b>{item.name}</b>{formatGroupedNumber(item.count)} ta</span>
                <span>{formatGroupedNumber(item.sum)} so‘m</span>
              </div>
            ))}
          </section>
        </div>
        <section className="crm-card" style={{ marginTop: "calc(.5 * var(--u))" }}>
          <table className="crm-table">
            <thead>
              <tr><th>Sana</th><th>Bemor</th><th>Xizmat</th><th>Usul</th><th>Summa</th></tr>
            </thead>
            <tbody>
              {recent.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.patient}</td>
                  <td>{item.service}</td>
                  <td>{item.method}</td>
                  <td>{formatGroupedNumber(item.amount)} so‘m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </CrmFrame>
  );
}
