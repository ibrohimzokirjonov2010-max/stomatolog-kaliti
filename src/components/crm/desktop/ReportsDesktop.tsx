"use client";

import { useMemo, useState } from "react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { downloadText } from "@/lib/simple-pdf";
import { formatGroupedNumber } from "@/lib/format";
import "./reports-faithful.css";

const SERVICES = [
  ["Implantatsiya", 22450000],
  ["Professional gigiyena", 18220000],
  ["Ortodontik davolash", 16800000],
  ["Endodontik davolash", 12400000],
  ["Konsultatsiya", 8650000],
] as const;
const DOCTORS = [
  ["Dr. Ibrohim", 98, 86, 42350000],
  ["Dr. Azizbek", 76, 68, 28740000],
  ["Dr. Kamron", 62, 56, 24180000],
  ["Dr. Sardor", 54, 48, 18620000],
  ["Dr. Nargiza", 28, 26, 11940000],
] as const;
const STOCK = [["Kompozit", 12, 5], ["Bonding", 8, 5], ["Implant", 5, 2], ["End fayl", 7, 4]] as const;
const GOALS = [
  ["Daromad", "150 000 000 so‘m", 84],
  ["Bemorlar", "60 ta", 80],
  ["Qabullar", "350 ta", 73],
  ["O‘rtacha chek", "420 000 so‘m", 95],
] as const;

function som(n: number) {
  return `${formatGroupedNumber(n)} so‘m`;
}

export function ReportsDesktop() {
  const [range, setRange] = useState("oy");
  const [doctor, setDoctor] = useState("Barcha shifokorlar");
  const [service, setService] = useState("Barcha xizmatlar");
  const [compare, setCompare] = useState("Oldingi oy");
  const [sort, setSort] = useState("Daromad bo‘yicha");
  const factor = range === "bugun" ? 0.04 : range === "hafta" ? 0.22 : range === "yil" ? 11 : 1;
  const revenue = Math.round(125430000 * factor);
  const doctors = useMemo(() => {
    const rows = DOCTORS.filter((row) => doctor === "Barcha shifokorlar" || row[0] === doctor);
    return sort.startsWith("Qabul") ? [...rows].sort((a, b) => b[1] - a[1]) : rows;
  }, [doctor, sort]);

  function exportCsv() {
    const lines = ["Ko'rsatkich,Qiymat", `Daromad,${revenue}`, "Yangi bemorlar,48", "Qabullar,312", "Ortacha chek,401380"];
    downloadText("hisobotlar.csv", lines.join("\n"), "text/csv");
  }
  function exportPdf() {
    downloadText("hisobotlar.pdf", `Hisobotlar\nUmumiy daromad: ${som(revenue)}\nYangi bemorlar: 48\nQabullar: 312\n`, "application/pdf");
  }

  return (
    <ClinicShell accent="teal">
      <div className="rpx" data-testid="reports-desktop">
        <header className="rpx-head">
          <div>
            <h1>Hisobotlar</h1>
            <p>Klinikangiz faoliyati bo‘yicha batafsil statistika</p>
          </div>
          <div className="rpx-actions">
            <button type="button" data-testid="reports-export" onClick={exportCsv}>Excel export</button>
            <button type="button" data-testid="reports-pdf" onClick={exportPdf}>PDF export</button>
          </div>
        </header>
        <div className="rpx-filters">
          <span className="rpx-range">01 okt 2024 – 31 okt 2024</span>
          {[["bugun", "Bugun"], ["hafta", "Hafta"], ["yil", "Yil"]].map(([id, label]) => (
            <button key={id} type="button" className={range === id ? "on" : undefined} data-testid={`report-${id}`} onClick={() => setRange(id)}>{label}</button>
          ))}
          <select aria-label="Shifokor" value={doctor} onChange={(event) => setDoctor(event.target.value)}>
            {["Barcha shifokorlar", ...DOCTORS.map((row) => row[0])].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Xizmat" value={service} onChange={(event) => setService(event.target.value)}>
            {["Barcha xizmatlar", ...SERVICES.map((row) => row[0])].map((item) => <option key={item}>{item}</option>)}
          </select>
          <select aria-label="Taqqoslash" value={compare} onChange={(event) => setCompare(event.target.value)}>
            {["Oldingi oy", "Oldingi yil"].map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <section className="rpx-kpis">
          <article><small>Umumiy daromad</small><b data-testid="report-revenue">{som(revenue)}</b><em>+12% ({compare.toLowerCase()}ga nisbatan)</em></article>
          <article><small>Yangi bemorlar</small><b>{Math.max(1, Math.round(48 * factor))}</b><em>+20%</em></article>
          <article><small>Qabullar soni</small><b>{Math.max(1, Math.round(312 * factor))}</b><em>+8%</em></article>
          <article><small>O‘rtacha chek</small><b>{som(401380)}</b><em>+4%</em></article>
        </section>
        <section className="rpx-3">
          <article className="rpx-card">
            <h3>Daromad grafigi <select aria-label="Grafik" defaultValue="Daromad"><option>Daromad</option><option>Qabullar</option></select></h3>
            <svg viewBox="0 0 320 120" className="rpx-line" role="img" aria-label="Daromad grafigi">
              <polyline fill="none" stroke="#0198a4" strokeWidth="2.5" points="8,88 40,80 70,74 100,68 130,60 160,48 190,55 220,40 250,46 280,32 310,28" />
              <polyline fill="rgba(1,152,164,.12)" stroke="none" points="8,88 40,80 70,74 100,68 130,60 160,48 190,55 220,40 250,46 280,32 310,28 310,110 8,110" />
            </svg>
            <div className="rpx-axis"><span>1 okt</span><span>10 okt</span><span>15 okt</span><span>20 okt</span><span>25 okt</span><span>31 okt</span></div>
          </article>
          <article className="rpx-card">
            <h3>Eng ko‘p ko‘rsatilgan xizmatlar <span>Top 5</span></h3>
            <ol>
              {SERVICES.filter((row) => service === "Barcha xizmatlar" || row[0] === service).map((row, index) => (
                <li key={row[0]}><b>{index + 1}. {row[0]}</b><span>{som(row[1])}</span></li>
              ))}
            </ol>
          </article>
          <article className="rpx-card">
            <h3>To‘lov usullari <span>Summa bo‘yicha</span></h3>
            <div className="rpx-donut" style={{ background: "conic-gradient(#0198a4 0 28%, #22c55e 28% 46%, #3773fe 46% 64%, #f59e0b 64% 71%, #94a3b8 71% 100%)" }} />
            <ul className="rpx-legend">
              <li><i style={{ background: "#0198a4" }} /> Click 28%</li>
              <li><i style={{ background: "#22c55e" }} /> Payme 18%</li>
              <li><i style={{ background: "#3773fe" }} /> Karta 18%</li>
              <li><i style={{ background: "#f59e0b" }} /> O‘tkazma 7%</li>
              <li><i style={{ background: "#94a3b8" }} /> Naqd 29%</li>
            </ul>
          </article>
        </section>
        <section className="rpx-3">
          <article className="rpx-card">
            <h3>Bemorlar: yangi va qaytgan</h3>
            <p className="rpx-key"><i style={{ background: "#0198a4" }} /> Yangi bemorlar <i style={{ background: "#94a3b8" }} /> Qaytgan bemorlar</p>
            <svg viewBox="0 0 320 90" className="rpx-line" role="img" aria-label="Yangi va qaytgan">
              <polyline fill="none" stroke="#0198a4" strokeWidth="2" points="8,70 60,62 110,50 160,44 210,38 260,30 310,24" />
              <polyline fill="none" stroke="#94a3b8" strokeWidth="2" points="8,60 60,58 110,55 160,52 210,48 260,46 310,42" />
            </svg>
          </article>
          <article className="rpx-card">
            <h3>Shifokorlar bo‘yicha natijalar
              <select aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value)}><option>Daromad bo‘yicha</option><option>Qabullar bo‘yicha</option></select>
            </h3>
            <table>
              <thead><tr><th>#</th><th>Shifokor</th><th>Qabullar</th><th>Bemorlar</th><th>Daromad (so‘m)</th></tr></thead>
              <tbody>
                {doctors.map((row, index) => (
                  <tr key={row[0]}><td>{index + 1}</td><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td>{formatGroupedNumber(row[3])}</td></tr>
                ))}
              </tbody>
            </table>
          </article>
          <article className="rpx-card">
            <h3>Bemorlar manbalari <span>Bemorlar soni</span></h3>
            {[["Instagram", 32, "#e1306c"], ["Google", 25, "#4285f4"], ["Tavsiya", 33, "#0198a4"], ["Boshqa", 10, "#94a3b8"]].map(([name, pct, color]) => (
              <div key={String(name)} className="rpx-bar"><span>{name}</span><b style={{ width: `${pct}%`, background: String(color) }} /><em>{pct}%</em></div>
            ))}
          </article>
        </section>
        <section className="rpx-3">
          <article className="rpx-card">
            <h3>Oylik ko‘rsatkichlar taqqoslash</h3>
            <table>
              <thead><tr><th>Ko‘rsatkich</th><th>Joriy oy</th><th>{compare}</th><th>O‘zgarish</th></tr></thead>
              <tbody>
                <tr><td>Daromad</td><td>{formatGroupedNumber(revenue)}</td><td>112 300 000</td><td>+12%</td></tr>
                <tr><td>Bemorlar</td><td>48</td><td>40</td><td>+20%</td></tr>
                <tr><td>Qabullar</td><td>312</td><td>288</td><td>+8%</td></tr>
                <tr><td>O‘rtacha chek</td><td>401 380</td><td>385 200</td><td>+4%</td></tr>
              </tbody>
            </table>
          </article>
          <article className="rpx-card">
            <h3>Ombor harakati (qisqacha)</h3>
            <table>
              <thead><tr><th>Mahsulot</th><th>Sarflangan</th><th>Qoldiq</th></tr></thead>
              <tbody>{STOCK.map((row) => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody>
            </table>
          </article>
          <article className="rpx-card">
            <h3>Kelgusi davr uchun reja <button type="button" data-testid="report-edit" onClick={() => setCompare("Oldingi oy")}>Tahrirlash</button></h3>
            <p className="rpx-key">Maqsadlar (noyabr 2024)</p>
            {GOALS.map(([name, target, pct]) => (
              <div key={name} className="rpx-goal"><span>{name}: {target}</span><b style={{ width: `${pct}%` }} /><em>{pct}%</em></div>
            ))}
          </article>
        </section>
      </div>
    </ClinicShell>
  );
}
