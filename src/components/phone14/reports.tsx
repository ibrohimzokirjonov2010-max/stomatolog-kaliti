"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CalendarRange, ChevronDown, ChevronRight, Home, MoreHorizontal, Stethoscope, TrendingUp, Users, Wallet } from "lucide-react";
import { Sheet } from "@/components/phone14/chrome";
import { formatGroupedNumber } from "@/lib/format";

const PERIODS = ["Bugun", "Hafta", "Oy", "3 oy", "Yil", "Barcha davr"] as const;
type Period = (typeof PERIODS)[number];

const SERVICES = [
  ["Konsultatsiya", 28450000],
  ["Kompozit plomba", 18220000],
  ["Professional gigiyena", 15600000],
  ["Endodontik davolash", 12400000],
  ["Krona (keramika)", 10800000],
] as const;

const METHODS = [
  { name: "Naqd", pct: 45, color: "#0E8F94" },
  { name: "Karta", pct: 28, color: "#2F6BFF" },
  { name: "Click", pct: 15, color: "#F5A524" },
  { name: "Payme", pct: 8, color: "#22A06B" },
  { name: "O‘tkazma", pct: 4, color: "#94A3B8" },
];

const OCTOBER = [2891566, 2891566, 3614458, 4939759, 5903614, 6385542, 5301205, 5180723, 6265060, 8313253, 8554217, 7469880, 7590361, 8554217, 10000000, 10240964, 9879518, 10722892, 11566265, 13493976, 14819277, 12289157, 10361446, 11204819, 13373494, 15783133, 17831325, 17108434, 16024096, 16867470, 17831325];

const DOCTORS = [
  { name: "Dr. Ibrohim", amount: 52400000, photo: "/img/phone14/doc-0.png" },
  { name: "Dr. Aziza", amount: 38120000, photo: "/img/phone14/doc-1.png" },
  { name: "Dr. Kamron", amount: 24780000, photo: "/img/phone14/doc-2.png" },
];

const RANGES: Record<Period, [string, string]> = {
  Bugun: ["17.10.2024", "17.10.2024"],
  Hafta: ["14.10.2024", "20.10.2024"],
  Oy: ["01.10.2024", "31.10.2024"],
  "3 oy": ["01.08.2024", "31.10.2024"],
  Yil: ["01.01.2024", "31.10.2024"],
  "Barcha davr": ["01.01.2022", "31.10.2024"],
};

const FACTOR: Record<Period, number> = {
  Bugun: 0.048,
  Hafta: 0.26,
  Oy: 1,
  "3 oy": 2.85,
  Yil: 11.4,
  "Barcha davr": 18.6,
};

const PCT: Record<Period, [number, number, number, number]> = {
  Bugun: [4, 6, 3, 2],
  Hafta: [8, 11, 6, 4],
  Oy: [12, 18, 10, 7],
  "3 oy": [15, 21, 12, 9],
  Yil: [22, 27, 16, 11],
  "Barcha davr": [31, 36, 24, 14],
};

const CITY_FACTOR: Record<string, number> = { Toshkent: 1, Samarqand: 0.42, Buxoro: 0.28, Andijon: 0.33 };

function money(n: number) {
  return formatGroupedNumber(Math.round(n));
}

function series(period: Period) {
  if (period === "Bugun") return { labels: ["09", "11", "13", "15", "17"], values: [0.4, 0.9, 1.3, 0.8, 0.5].map((v) => v * 1_000_000), max: 2_000_000 };
  if (period === "Hafta") return { labels: ["14", "15", "16", "17", "18", "19", "20"], values: [3.2, 4.1, 3.6, 5.4, 4.8, 2.2, 1.4].map((v) => v * 1_000_000), max: 8_000_000 };
  if (period === "3 oy") return { labels: ["Avg", "Sen", "Okt"], values: [98, 112, 128].map((v) => v * 1_000_000), max: 160_000_000 };
  if (period === "Yil") return { labels: ["Yan", "Mar", "May", "Iyl", "Sen", "Okt"], values: [72, 81, 90, 96, 110, 128].map((v) => v * 1_000_000), max: 160_000_000 };
  if (period === "Barcha davr") return { labels: ["2022", "2023", "2024"], values: [640, 890, 1120].map((v) => v * 1_000_000), max: 1_400_000_000 };
  return { labels: ["1 okt", "5 okt", "10 okt", "15 okt", "20 okt", "25 okt", "31 okt"], values: OCTOBER, max: 20_000_000 };
}

function AreaChart({ values, labels, max }: { values: number[]; labels: string[]; max: number }) {
  const w = 340;
  const h = 132;
  const left = 28;
  const bottom = 18;
  const pts = values.map((value, index) => {
    const x = left + (index / Math.max(1, values.length - 1)) * (w - left - 6);
    const y = 8 + (1 - Math.min(value, max) / max) * (h - bottom - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - bottom} L${pts[0][0].toFixed(1)},${h - bottom} Z`;
  const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0];
  const labelIdx = values.length === 31 ? [0, 4, 9, 14, 19, 24, 30] : values.map((_, i) => i);
  return (
    <svg className="rpt-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Daromad dinamikasi">
      {ticks.map((tick) => {
        const y = 8 + (1 - tick / max) * (h - bottom - 8);
        const label = tick >= 1_000_000_000 ? `${Math.round(tick / 1_000_000_000)}mlrd` : `${Math.round(tick / 1_000_000)}M`;
        return (
          <g key={tick}>
            <line x1={left} x2={w - 4} y1={y} y2={y} stroke="#e6edf5" />
            <text x={2} y={y + 3} fontSize="8" fill="#94a3b8">{label}</text>
          </g>
        );
      })}
      <path d={area} fill="rgba(14,143,148,.18)" />
      <path d={line} fill="none" stroke="#0E8F94" strokeWidth="2" />
      {labelIdx.map((index, n) => (
        <text key={labels[n] ?? index} x={pts[index][0]} y={h - 4} fontSize="7" fill="#64748b" textAnchor="middle">{labels[n]}</text>
      ))}
    </svg>
  );
}

function Donut({ total }: { total: string }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg className="rpt-donut" viewBox="0 0 120 120" role="img" aria-label="To‘lov usullari">
      {METHODS.map((part) => {
        const len = (c * part.pct) / 100;
        const node = (
          <circle key={part.name} cx="60" cy="60" r={r} fill="none" stroke={part.color} strokeWidth="12" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />
        );
        offset += len;
        return node;
      })}
      <text x="60" y="58" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#16324f">{total}</text>
      <text x="60" y="68" textAnchor="middle" fontSize="6" fill="#64748b">so‘m</text>
    </svg>
  );
}

export function PhoneReports() {
  const [period, setPeriod] = useState<Period>("Oy");
  const [city, setCity] = useState("Toshkent");
  const [range, setRange] = useState<[string, string]>(RANGES.Oy);
  const [custom, setCustom] = useState(false);
  const [draft, setDraft] = useState({ from: "2024-10-01", to: "2024-10-31" });
  const [open, setOpen] = useState<"range" | "bell" | "more" | "chart" | "services" | "methods" | "doctors" | null>(null);

  const factor = (custom ? 1 : FACTOR[period]) * (CITY_FACTOR[city] ?? 1);
  const pct = PCT[custom ? "Oy" : period];
  const income = Math.round(128_450_000 * factor);
  const patients = Math.max(1, Math.round(342 * factor));
  const visits = Math.max(1, Math.round(516 * factor));
  const avg = Math.max(1000, Math.round(249_127 * (0.85 + 0.15 * Math.min(factor, 2))));
  const services = SERVICES.map(([name, amount]) => [name, Math.round(amount * factor)] as const);
  const doctors = DOCTORS.map((item) => ({ ...item, amount: Math.round(item.amount * factor) }));
  const chart = useMemo(() => series(custom ? "Oy" : period), [custom, period]);
  const maxService = Math.max(...services.map((item) => item[1]));
  const maxDoctor = Math.max(...doctors.map((item) => item.amount));

  function choose(next: Period) {
    setPeriod(next);
    setCustom(false);
    setRange(RANGES[next]);
  }

  function downloadExcel() {
    const rows = [
      ["Bo‘lim", "Nomi", "Qiymat"],
      ["Davr", range.join(" - "), city],
      ["KPI", "Daromad", String(income)],
      ["KPI", "Bemorlar", String(patients)],
      ["KPI", "Qabullar", String(visits)],
      ["KPI", "O‘rtacha chek", String(avg)],
      ...services.map(([name, amount]) => ["Xizmat", name, String(amount)]),
      ...METHODS.map((item) => ["To‘lov", item.name, `${item.pct}%`]),
      ...doctors.map((item) => ["Shifokor", item.name, String(item.amount)]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hisobotlar.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p14 rpt lg:hidden" data-testid="phone-hisobotlar">
      <header className="rpt-top">
        <Link href="/mening-klinikam" className="rpt-brand">
          <span className="rpt-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="18" height="18"><path d="M16 4c4 0 8 3 8 8 0 2-.4 4-1 6-.6 3-1 6-1.4 8-.3 1.2-.8 1.4-1.2.2-.5-1.4-.8-4-.8-6v-2c0 2-.3 4.6-.8 6-.4 1.2-.9 1-1.2-.2C16.2 22 16 19 16 16c0 3-.2 6-.6 8-.3 1.2-.8 1.4-1.2.2-.5-1.4-.8-4-.8-6v2c0 2-.3 4.6-.8 6-.4 1.2-.9 1-1.2-.2C10 22 9.6 19 9 16c-.6-2-1-4-1-6 0-5 4-8 8-8z" fill="#fff"/></svg>
          </span>
          <span><b>StomaHub</b><small>Mening klinikam</small></span>
        </Link>
        <span className="crm-select" style={{ width: "auto", height: "calc(2.8 * var(--u))" }}>
          <select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
            {Object.keys(CITY_FACTOR).map((item) => <option key={item}>{item}</option>)}
          </select>
          <ChevronDown size={14} />
        </span>
        <button type="button" className="rpt-ico rpt-bell" aria-label="Bildirishnomalar" onClick={() => setOpen("bell")}>
          <Bell />
          <i className="dot" />
        </button>
      </header>
      <div className="rpt-title">
        <h1>Hisobotlar</h1>
        <button type="button" className="rpt-range" onClick={() => setOpen("range")}>
          <CalendarRange size={14} /> {range[0]} - {range[1]}
        </button>
      </div>
      <div className="p14-row">
        {PERIODS.map((item) => (
          <button key={item} type="button" className={!custom && period === item ? "p14-chip on" : "p14-chip"} onClick={() => choose(item)}>{item}</button>
        ))}
      </div>
      <div className="rpt-kpis">
        <article><span className="ico"><Wallet size={14} /></span><small>Daromad</small><b>{money(income)} so‘m</b><em>+{pct[0]}%</em><small> o‘tgan oyga nisbatan</small></article>
        <article><span className="ico"><Users size={14} /></span><small>Bemorlar</small><b>{money(patients)}</b><em>+{pct[1]}%</em><small> o‘tgan oyga nisbatan</small></article>
        <article><span className="ico"><Stethoscope size={14} /></span><small>Qabullar</small><b>{money(visits)}</b><em>+{pct[2]}%</em><small> o‘tgan oyga nisbatan</small></article>
        <article><span className="ico"><TrendingUp size={14} /></span><small>O‘rtacha chek</small><b>{money(avg)} so‘m</b><em>+{pct[3]}%</em><small> o‘tgan oyga nisbatan</small></article>
      </div>
      <section className="p14-card">
        <div className="rpt-sec"><b>Daromad dinamikasi</b><button type="button" className="rpt-link" onClick={() => setOpen("chart")}>Batafsil <ChevronRight size={14} /></button></div>
        <AreaChart values={chart.values} labels={chart.labels} max={chart.max} />
      </section>
      <div className="rpt-cols">
        <section className="p14-card">
          <div className="rpt-sec"><b>Top 5 xizmatlar</b><button type="button" onClick={() => setOpen("services")}>Batafsil</button></div>
          {services.map(([name, amount]) => (
            <div key={name} className="rpt-barline">
              <span>{name}</span><b>{money(amount)}</b>
              <span className="track"><i style={{ width: `${(amount / maxService) * 100}%` }} /></span>
            </div>
          ))}
        </section>
        <section className="p14-card">
          <div className="rpt-sec"><b>To‘lov usullari</b><button type="button" onClick={() => setOpen("methods")}>Batafsil</button></div>
          <Donut total={money(income)} />
          <div className="rpt-legend">
            {METHODS.map((item) => <span key={item.name}><i style={{ background: item.color, width: 8, height: 8, borderRadius: 99, display: "inline-block" }} />{item.name}<b>{item.pct}%</b></span>)}
          </div>
        </section>
      </div>
      <section>
        <div className="rpt-sec"><b>Shifokorlar bo‘yicha daromad</b><button type="button" className="rpt-link" onClick={() => setOpen("doctors")}>Batafsil</button></div>
        <div className="list">
          {doctors.map((item) => (
            <article key={item.name} className="rpt-doc">
              <img src={item.photo} alt="" />
              <span><b>{item.name}</b><span className="track" style={{ display: "block", height: 4, background: "#e7eef5", borderRadius: 99 }}><i style={{ display: "block", height: "100%", width: `${(item.amount / maxDoctor) * 100}%`, background: "#0E8F94", borderRadius: 99 }} /></span></span>
              <b className="amt">{money(item.amount)} so‘m</b>
            </article>
          ))}
        </div>
      </section>
      <div className="rpt-actions">
        <button type="button" className="xls" onClick={downloadExcel}>Excel yuklab olish</button>
        <button type="button" className="pdf" onClick={() => window.print()}>PDF yuklab olish</button>
      </div>
      <nav className="rpt-tabs" aria-label="CRM menyu">
        <Link href="/"><Home />Bosh sahifa</Link>
        <Link href="/crm/bemorlar"><Users />Bemorlar</Link>
        <Link href="/crm/uchrashuvlar"><CalendarRange />Uchrashuvlar</Link>
        <Link href="/crm/hisobotlar" className="on"><TrendingUp />Hisobotlar</Link>
        <button type="button" onClick={() => setOpen("more")}><MoreHorizontal />Boshqa</button>
      </nav>
      {open === "range" ? (
        <Sheet title="Sana oralig‘i" onClose={() => setOpen(null)}>
          <label className="crm-field">Dan<input type="date" value={draft.from} onChange={(event) => setDraft({ ...draft, from: event.target.value })} /></label>
          <label className="crm-field">Gacha<input type="date" value={draft.to} onChange={(event) => setDraft({ ...draft, to: event.target.value })} /></label>
          <button type="button" className="crm-save" onClick={() => {
            const fmt = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };
            setRange([fmt(draft.from), fmt(draft.to)]);
            setCustom(true);
            setOpen(null);
          }}>Qo‘llash</button>
        </Sheet>
      ) : null}
      {open === "bell" ? (
        <Sheet title="Bildirishnomalar" onClose={() => setOpen(null)}>
          <p>Yangi to‘lov: Malika Karimova, 2 500 000 so‘m</p>
          <p>Ertangi qabul: Jahongir Rahimov, 10:30</p>
        </Sheet>
      ) : null}
      {open === "more" ? (
        <Sheet title="Boshqa" onClose={() => setOpen(null)}>
          <div className="sheet-links">
            <Link href="/crm/tolovlar">To‘lovlar</Link>
            <Link href="/crm/davolash-rejalari">Davolash rejalari</Link>
            <Link href="/crm/ombor">Ombor</Link>
            <Link href="/sertifikatlar">Sertifikatlar</Link>
            <Link href="/profil">Profil</Link>
          </div>
        </Sheet>
      ) : null}
      {open === "chart" ? <Sheet title="Daromad dinamikasi" onClose={() => setOpen(null)}><p>{chart.labels.join(", ")}</p><p>Jami {money(income)} so‘m</p></Sheet> : null}
      {open === "services" ? <Sheet title="Top 5 xizmatlar" onClose={() => setOpen(null)}>{services.map(([name, amount]) => <p key={name}>{name}: {money(amount)} so‘m</p>)}</Sheet> : null}
      {open === "methods" ? <Sheet title="To‘lov usullari" onClose={() => setOpen(null)}>{METHODS.map((item) => <p key={item.name}>{item.name}: {item.pct}% · {money(income * item.pct / 100)} so‘m</p>)}</Sheet> : null}
      {open === "doctors" ? <Sheet title="Shifokorlar" onClose={() => setOpen(null)}>{doctors.map((item) => <p key={item.name}>{item.name}: {money(item.amount)} so‘m</p>)}</Sheet> : null}
    </div>
  );
}
