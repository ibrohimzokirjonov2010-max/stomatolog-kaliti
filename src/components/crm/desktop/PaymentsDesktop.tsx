"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUp, Banknote, CheckCircle2, ChevronRight, CreditCard, Plus, Search, Smartphone, Wallet } from "lucide-react";
import { CrmFrame, CrmPager } from "@/components/crm/desktop/CrmFrame";
import { NewPaymentModal, planTotals } from "@/components/crm/NewPaymentModal";
import { downloadPdf } from "@/lib/simple-pdf";
import { type ClinicPayment, type Patient, type PayMethod, type TreatmentPlan } from "@/data/crm";
import { formatGroupedNumber, formatMoney } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";
import { useCrmPatients } from "@/lib/use-crm-list";
import { tashkentDateParts } from "@/lib/tashkent-date";

const SEED: ClinicPayment[] = [];
const METHODS: PayMethod[] = ["Karta", "Click", "Payme", "Naqd"];
const METHOD_COLOR: Record<string, string> = { Karta: "#0b8f8a", Click: "#20c9a6", Payme: "#a78bfa", Naqd: "#f5a524" };
const MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
const DAY_MS = 86_400_000;

/** "24.10.2026" → "2026-10-24". */
function parseDate(value: string) {
  const [day, month, year] = value.split(".");
  return `${year}-${month}-${day}`;
}

function isoOf(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftMonth(iso: string, delta: number) {
  const [year, month] = iso.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return isoOf(date);
}

function lastDay(iso: string) {
  const [year, month] = iso.split("-").map(Number);
  return isoOf(new Date(year, month, 0));
}

function compact(value: number) {
  if (value >= 1_000_000) return `${Math.round((value / 1_000_000) * 10) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

/** Percent change against the previous period, or null when there is nothing to compare with. */
function change(now: number, before: number) {
  return before > 0 ? Math.round(((now - before) / before) * 100) : null;
}

export function PaymentsDesktop() {
  const today = tashkentDateParts().iso;
  const monthStart = `${today.slice(0, 8)}01`;
  const [items, setItems] = useStoredList("sk-crm-payments-v1", SEED);
  const [plans, setPlans] = useStoredList<TreatmentPlan>("sk-crm-plans-v1", []);
  const pathname = usePathname();
  const router = useRouter();
  const [patients] = useCrmPatients<Patient>();
  const [q, setQ] = useState("");
  const [method, setMethod] = useState<PayMethod | "">("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState(monthStart);
  const [to, setTo] = useState(lastDay(monthStart));
  const [chart, setChart] = useState<"kun" | "hafta" | "oy">("kun");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState<PayMethod | "">(pathname === "/crm/tolovlar/yangi" ? "Naqd" : "");
  const [toast, setToast] = useState("");
  // Opening /crm/tolovlar/yangi (or navigating to it) shows the form.
  const [seenPath, setSeenPath] = useState(pathname);
  if (pathname !== seenPath) {
    setSeenPath(pathname);
    if (pathname === "/crm/tolovlar/yangi") setOpen("Naqd");
  }
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const [form, setForm] = useState({ patient: "", service: "Konsultatsiya", amount: "200000", method: "Naqd" as PayMethod, date: today, note: "" });

  const inRange = useMemo(() => items.filter((item) => {
    const iso = parseDate(item.date);
    return iso >= from && iso <= to;
  }), [from, items, to]);

  const filtered = useMemo(() => inRange.filter((item) => {
    if (method && item.method !== method) return false;
    if (status && item.status !== status) return false;
    if (q.trim() && !`${item.patient} ${item.service} ${item.id}`.toLowerCase().includes(q.trim().toLowerCase())) return false;
    return true;
  }), [inRange, method, q, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const safe = Math.min(page, pages);
  const slice = filtered.slice((safe - 1) * size, safe * size);

  // The same-length period right before the chosen range, for the KPI change badges.
  const spanDays = Math.max(1, Math.round((new Date(to).getTime() - new Date(from).getTime()) / DAY_MS) + 1);
  const prevTo = isoOf(new Date(new Date(from).getTime() - DAY_MS));
  const prevFrom = isoOf(new Date(new Date(from).getTime() - spanDays * DAY_MS));
  const prev = items.filter((item) => {
    const iso = parseDate(item.date);
    return iso >= prevFrom && iso <= prevTo;
  });
  const total = (rows: ClinicPayment[], name?: PayMethod) => rows.filter((item) => !name || item.method === name).reduce((sum, item) => sum + item.amount, 0);
  const sum = total(inRange);

  // Debt: what each treatment plan still owes after its recorded payments.
  const debtors = useMemo(() => plans
    .map((plan) => {
      const owed = plan.steps.reduce((acc, step) => acc + step.price, 0) - plan.payments.reduce((acc, pay) => acc + pay.amount, 0);
      const person = patients.find((item) => item.id === plan.patientId);
      return { id: plan.id, name: person?.name ?? "Bemor", avatar: person?.avatar ?? "", note: plan.title, owed, date: plan.payments.at(-1)?.date ?? plan.date };
    })
    .filter((row) => row.owed > 0)
    .sort((a, b) => b.owed - a.owed), [patients, plans]);
  const debt = debtors.reduce((acc, row) => acc + row.owed, 0);

  const donut = METHODS.map((name) => ({ name, value: total(inRange, name), color: METHOD_COLOR[name] }));
  const radius = 42;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  // Revenue bars come from the recorded payments only.
  const bars = useMemo(() => {
    if (chart === "oy") {
      return Array.from({ length: 6 }, (_, index) => {
        const start = shiftMonth(monthStart, index - 5);
        const end = lastDay(start);
        const value = items.filter((item) => { const iso = parseDate(item.date); return iso >= start && iso <= end; }).reduce((acc, item) => acc + item.amount, 0);
        return { label: MONTHS_SHORT[Number(start.slice(5, 7)) - 1], value };
      });
    }
    const rows: { label: string; value: number }[] = [];
    const step = chart === "hafta" ? 7 : 1;
    for (let at = new Date(from).getTime(); at <= new Date(to).getTime(); at += step * DAY_MS) {
      const start = isoOf(new Date(at));
      const end = isoOf(new Date(Math.min(at + (step - 1) * DAY_MS, new Date(to).getTime())));
      const value = inRange.filter((item) => { const iso = parseDate(item.date); return iso >= start && iso <= end; }).reduce((acc, item) => acc + item.amount, 0);
      rows.push({ label: chart === "hafta" ? `${Number(start.slice(8))}–${Number(end.slice(8))}` : String(Number(start.slice(8))), value });
    }
    return rows;
  }, [chart, from, inRange, items, monthStart, to]);
  const barMax = Math.max(...bars.map((bar) => bar.value), 0);

  const kpis = [
    { label: "Jami tushum", value: sum, before: total(prev), icon: Wallet, tone: "teal" },
    { label: "Naqd tushum", value: total(inRange, "Naqd"), before: total(prev, "Naqd"), icon: Banknote, tone: "green" },
    { label: "Karta to‘lovlari", value: total(inRange, "Karta"), before: total(prev, "Karta"), icon: CreditCard, tone: "blue" },
    { label: "Qolgan qarzdorlik", value: debt, before: 0, icon: Smartphone, tone: "red" },
  ];

  function closeModal() {
    setOpen("");
    if (pathname === "/crm/tolovlar/yangi") router.replace("/crm/tolovlar");
  }

  return (
    <CrmFrame active="payments" placeholder="Bemor, telefon, to‘lov raqami yoki xizmat nomi..." headerQuery={q} onHeaderQuery={(value) => { setQ(value); setPage(1); }}>
      <div data-testid="payments-desktop">
        <div className="crm-head">
          <div>
            <h1>To‘lovlar</h1>
            <p>Moliyaviy operatsiyalar va bemor to‘lovlari</p>
          </div>
          <div className="crm-actions">
            <label className="crm-select pay-range">
              <input aria-label="Boshlanish" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
              <span aria-hidden>–</span>
              <input aria-label="Tugash" type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
            </label>
            <button type="button" className="crm-btn blue" data-testid="pay-add" onClick={() => setOpen("Naqd")}><Plus className="i" /> Yangi to‘lov</button>
          </div>
        </div>

        <div className="pay-kpis">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const delta = change(kpi.value, kpi.before);
            return (
              <article key={kpi.label} className={kpi.tone}>
                <span className="ic"><Icon className="i" /></span>
                <div>
                  <small>{kpi.label}</small>
                  <b className={kpi.tone === "red" ? "money-minus" : undefined}>{formatMoney(kpi.value, "UZS")}</b>
                  {delta !== null ? (
                    <em className={delta < 0 ? "down" : undefined}>
                      {delta < 0 ? <ArrowDown className="i" /> : <ArrowUp className="i" />} {Math.abs(delta)}% <span>oldingi davrga nisbatan</span>
                    </em>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="pay-charts">
          <div className="crm-card pay-chart">
            <div className="pay-card-h">
              <b>Tushum dinamikasi</b>
              <div className="ap-view">{(["kun", "hafta", "oy"] as const).map((item) => <button key={item} type="button" className={chart === item ? "on" : undefined} data-testid={`chart-${item}`} onClick={() => setChart(item)}>{item === "kun" ? "Kunlik" : item === "hafta" ? "Haftalik" : "Oylik"}</button>)}</div>
            </div>
            {barMax === 0 ? (
              <p className="crm-muted pay-empty">Bu davrda tushum yo‘q</p>
            ) : (
              <div className="pay-plot">
                <div className="pay-axis" aria-hidden>{[4, 3, 2, 1, 0].map((stepIndex) => <span key={stepIndex}>{stepIndex === 0 ? "0" : compact((barMax / 4) * stepIndex)}</span>)}</div>
                <div className="bars" data-testid="pay-bars">
                  {bars.map((bar, index) => (
                    <div key={`${bar.label}-${index}`} className="bar-col" title={`${bar.label}: ${formatMoney(bar.value, "UZS")}`}>
                      <i style={{ "--h": bar.value / barMax } as CSSProperties} />
                      <small>{bars.length > 12 && index % 5 !== 0 && index !== bars.length - 1 ? "" : bar.label}</small>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="crm-card pay-donut">
            <b>To‘lov usullari bo‘yicha</b>
            <div className="pay-donut-in">
              <svg className="donut" viewBox="0 0 120 120" aria-label="To‘lov usullari">
                <circle cx="60" cy="60" r={radius} fill="none" stroke="#eef2f7" strokeWidth="16" />
                {sum > 0 ? donut.map((item) => {
                  const length = (item.value / sum) * circ;
                  const node = <circle key={item.name} cx="60" cy="60" r={radius} fill="none" stroke={item.color} strokeWidth="16" strokeDasharray={`${length} ${circ - length}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />;
                  offset += length;
                  return node;
                }) : null}
                <text x="60" y="58" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0f1e3d">{compact(sum)}</text>
                <text x="60" y="73" textAnchor="middle" fontSize="9" fill="#6a7c93">so‘m</text>
              </svg>
              <ul>
                {donut.map((item) => (
                  <li key={item.name}>
                    <i style={{ background: item.color }} />
                    <span>{item.name}</span>
                    <b>{formatGroupedNumber(item.value)}</b>
                    <em>{sum ? Math.round((item.value / sum) * 100) : 0}%</em>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="crm-split">
          <div className="crm-card">
            <div className="crm-tools pay-tools">
              <b>So‘nggi to‘lovlar</b>
              <label className="crm-search"><Search className="i" /><input data-testid="pay-search" aria-label="To‘lov qidirish" value={q} placeholder="Bemor nomi, telefon, xizmat..." onChange={(event) => { setQ(event.target.value); setPage(1); }} /></label>
              <label className="crm-select"><select data-testid="pay-method" aria-label="Usul" value={method} onChange={(event) => { setMethod(event.target.value as PayMethod | ""); setPage(1); }}><option value="">Barcha usullar</option>{METHODS.map((item) => <option key={item}>{item}</option>)}</select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
              <label className="crm-select"><select data-testid="pay-status" aria-label="Holat" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Barcha holatlar</option><option value="tolandi">To‘landi</option><option value="qisman">Qisman</option></select><ChevronRight className="i" style={{ transform: "rotate(90deg)" }} /></label>
            </div>
            <table className="crm-table">
              <thead><tr><th>#</th><th>Sana</th><th>Bemor</th><th>Xizmat</th><th>Summa</th><th>To‘lov usuli</th><th>Holat</th></tr></thead>
              <tbody>
                {slice.length === 0 ? <tr><td colSpan={7} className="crm-muted">Bu davrda to‘lov yo‘q</td></tr> : null}
                {slice.map((item, index) => (
                  <tr key={item.id} data-testid="pay-row">
                    <td className="num">{(safe - 1) * size + index + 1}</td>
                    <td>{item.date}</td>
                    <td><span className="crm-person">{item.avatar ? <img src={item.avatar} alt="" /> : null}<b>{item.patient || "—"}</b></span></td>
                    <td className="crm-muted">{item.service}</td>
                    <td><b>{formatMoney(item.amount, "UZS")}</b></td>
                    <td><span className="pay-method" style={{ color: METHOD_COLOR[item.method] ?? "#475569", background: `${METHOD_COLOR[item.method] ?? "#94a3b8"}1a` }}>{item.method}</span></td>
                    <td><span className={`crm-pill ${item.status}`}>{item.status === "tolandi" ? "To‘landi" : "Qisman"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <CrmPager page={safe} pages={pages} size={size} totalLabel={`Jami: ${filtered.length} ta to‘lov`} onPage={setPage} onSize={(value) => { setSize(value); setPage(1); }} />
          </div>
          <aside className="pay-rail">
            <div className="pl-box">
              <div className="pay-card-h">
                <b>Qarzdor bemorlar</b>
                <Link className="pay-link" href="/crm/davolash-rejalari">Barchasi <ArrowRight className="i" /></Link>
              </div>
              {debtors.length === 0 ? <p className="crm-muted">Qarzdor bemor yo‘q</p> : debtors.slice(0, 4).map((row) => (
                <Link key={row.id} className="pay-debtor" href="/crm/davolash-rejalari">
                  {row.avatar ? <img src={row.avatar} alt="" /> : <span className="pt-ini" aria-hidden>{row.name.slice(0, 1)}</span>}
                  <span><b>{row.name}</b><small>{row.note}</small></span>
                  <span className="amt"><b>{formatMoney(row.owed, "UZS")}</b><small>{row.date}</small></span>
                </Link>
              ))}
            </div>
            <div className="pl-box">
              <b>Tezkor to‘lov</b>
              <div className="pay-quick">
                {(["Click", "Payme", "Karta", "Naqd"] as PayMethod[]).map((item) => {
                  const Icon = item === "Karta" ? CreditCard : item === "Naqd" ? Banknote : Smartphone;
                  return (
                    <button key={item} type="button" data-testid={`quick-${item}`} style={{ color: METHOD_COLOR[item], background: `${METHOD_COLOR[item]}14` }} onClick={() => { setForm({ ...form, method: item }); setOpen(item); }}>
                      <Icon className="i" />
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
        {open ? (
          <NewPaymentModal
            plans={plans}
            initialMethod={open}
            onClose={closeModal}
            onSave={(payment) => {
              setItems((prev) => [payment, ...prev]);
              const plan = plans.find((item) => item.id === payment.planId);
              let closed = false;
              if (plan) {
                const before = planTotals(plan);
                closed = before.debt > 0 && payment.amount >= before.debt;
                setPlans((prev) => prev.map((item) => (item.id === plan.id
                  ? { ...item, status: closed ? "yakun" : item.status, payments: [...item.payments, { date: payment.date, amount: payment.amount, method: payment.method, note: payment.note || "To‘lov" }] }
                  : item)));
              }
              if (payment.receipt) {
                downloadPdf(`chek-${payment.id.slice(-6)}.pdf`, [
                  "StomaHub - To'lov cheki",
                  `Chek: ${payment.id.slice(-6)}`,
                  `Sana: ${payment.date}`,
                  `Bemor: ${payment.patient}`,
                  `Xizmat: ${payment.service}`,
                  `Summa: ${formatGroupedNumber(payment.amount)} so'm`,
                  `To'lov usuli: ${payment.method}`,
                  ...(payment.note ? [`Izoh: ${payment.note}`] : []),
                ]);
              }
              setToast(closed ? "To‘lov saqlandi. Qarz yopildi, reja “Yakunlangan” holatiga o‘tdi." : "To‘lov saqlandi");
              setForm({ ...form, method: payment.method });
              closeModal();
              setPage(1);
            }}
          />
        ) : null}
        {toast ? <div className="cm-toast" role="status" data-testid="pay-toast"><CheckCircle2 />{toast}</div> : null}
      </div>
    </CrmFrame>
  );
}
