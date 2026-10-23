"use client";
/* eslint-disable @next/next/no-img-element -- patient photos are local uploads */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, ArrowDown, ArrowUp, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, CreditCard, FileText, Plus, Wallet } from "lucide-react";
import { NewPaymentModal, planTotals } from "@/components/crm/NewPaymentModal";
import type { ClinicPayment, Patient, TreatmentPlan } from "@/data/crm";
import { formatGroupedNumber } from "@/lib/format";
import { useStoredList } from "@/lib/stored-list";
import { useCrmPatients } from "@/lib/use-crm-list";
import { tashkentDateParts } from "@/lib/tashkent-date";
import "./tolovlar-mobile.css";

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

/** "24.10.2026" → "2026-10-24". */
function isoOf(value: string) {
  const [day, month, year] = value.split(".");
  return `${year}-${month}-${day}`;
}

function monthShift(ym: string, delta: number) {
  const [year, month] = ym.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function daysIn(ym: string) {
  const [year, month] = ym.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function Change({ now, before }: { now: number; before: number }) {
  if (!before) return <small className="tp-chg">o‘tgan oyda yo‘q</small>;
  const pct = Math.round(((now - before) / before) * 100);
  const Icon = pct >= 0 ? ArrowUp : ArrowDown;
  return <small className={pct >= 0 ? "tp-chg up" : "tp-chg down"}><Icon /> {pct >= 0 ? "+" : ""}{pct}% <span>o‘tgan oyga nisbatan</span></small>;
}

/** Phone /crm/tolovlar (mock "to‘lovlar telefon"). Same storage as the desktop page. */
export function TolovlarMobile() {
  const pathname = usePathname();
  const [items, setItems] = useStoredList<ClinicPayment>("sk-crm-payments-v1", []);
  const [plans, setPlans] = useStoredList<TreatmentPlan>("sk-crm-plans-v1", []);
  const [patients] = useCrmPatients<Patient>();
  const [ym, setYm] = useState(tashkentDateParts().iso.slice(0, 7));
  const [tab, setTab] = useState<"last" | "debt">("last");
  const [adding, setAdding] = useState(pathname === "/crm/tolovlar/yangi");
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const ofMonth = (key: string) => items.filter((item) => isoOf(item.date).startsWith(key));
  const now = ofMonth(ym);
  const before = ofMonth(monthShift(ym, -1));
  const sum = (rows: ClinicPayment[]) => rows.reduce((acc, item) => acc + item.amount, 0);
  const paid = (rows: ClinicPayment[]) => sum(rows.filter((item) => item.status === "tolandi"));
  const partial = (rows: ClinicPayment[]) => sum(rows.filter((item) => item.status === "qisman"));

  const debtors = useMemo(() => plans
    .map((plan) => {
      const owed = planTotals(plan).debt;
      const person = patients.find((item) => item.id === plan.patientId);
      return { id: plan.id, name: person?.name ?? "Bemor", avatar: person?.avatar ?? "", note: plan.title, owed, date: plan.payments.at(-1)?.date ?? plan.date };
    })
    .filter((row) => row.owed > 0)
    .sort((a, b) => b.owed - a.owed), [patients, plans]);
  const debt = debtors.reduce((acc, row) => acc + row.owed, 0);

  const bars = useMemo(() => {
    const days = daysIn(ym);
    return Array.from({ length: days }, (_, index) => {
      const day = `${ym}-${String(index + 1).padStart(2, "0")}`;
      return { day: index + 1, value: items.filter((item) => isoOf(item.date) === day).reduce((acc, item) => acc + item.amount, 0) };
    });
  }, [items, ym]);
  const peak = Math.max(1, ...bars.map((bar) => bar.value));
  const best = bars.reduce((top, bar) => (bar.value > top.value ? bar : top), { day: 0, value: 0 });
  const recent = [...now].sort((a, b) => isoOf(b.date).localeCompare(isoOf(a.date))).slice(0, 8);
  const [year, month] = ym.split("-").map(Number);

  return (
    <div className="tp" data-testid="payments-mobile">
      <header className="tp-head">
        <div>
          <h1>To‘lovlar</h1>
          <p>Moliyaviy ko‘rsatkichlar va to‘lovlar tarixi</p>
        </div>
        <div className="tp-month">
          <button type="button" aria-label="Oldingi oy" onClick={() => setYm(monthShift(ym, -1))}><ChevronLeft /></button>
          <span><CalendarDays /> {MONTHS[month - 1].slice(0, 3)} {year}</span>
          <button type="button" aria-label="Keyingi oy" onClick={() => setYm(monthShift(ym, 1))}><ChevronRight /></button>
        </div>
      </header>

      <div className="tp-kpis">
        <article><i className="teal"><Wallet /></i><span><small>Jami tushum</small><b>{formatGroupedNumber(sum(now))} so‘m</b><Change now={sum(now)} before={sum(before)} /></span></article>
        <article><i className="green"><CreditCard /></i><span><small>To‘langan</small><b>{formatGroupedNumber(paid(now))} so‘m</b><Change now={paid(now)} before={paid(before)} /></span></article>
        <article><i className="amber"><Clock /></i><span><small>Qisman to‘langan</small><b>{formatGroupedNumber(partial(now))} so‘m</b><Change now={partial(now)} before={partial(before)} /></span></article>
        <article><i className="red"><AlertCircle /></i><span><small>Qarzdorlik</small><b>{formatGroupedNumber(debt)} so‘m</b><small className="tp-chg">{debtors.length} ta reja bo‘yicha</small></span></article>
      </div>

      <section className="tp-card">
        <h2>Tushumlar statistikasi</h2>
        <div className="tp-chart" role="img" aria-label="Kunlik tushum">
          {best.value > 0 ? (
            <span className="tp-tip" style={{ left: `${((best.day - 0.5) / bars.length) * 100}%` }}>{best.day} {MONTHS[month - 1].slice(0, 3).toLowerCase()}<b>{formatGroupedNumber(best.value)} so‘m</b></span>
          ) : null}
          {bars.map((bar) => (
            <span key={bar.day} className={bar.day === best.day && best.value > 0 ? "on" : undefined} style={{ height: `${Math.max(3, (bar.value / peak) * 100)}%` }} />
          ))}
        </div>
        <div className="tp-axis"><span>1</span><span>{Math.round(bars.length / 2)}</span><span>{bars.length}</span></div>
        {sum(now) === 0 ? <p className="tp-muted">Bu oyda to‘lov yo‘q.</p> : null}
      </section>

      <div className="tp-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "last"} className={tab === "last" ? "on" : ""} onClick={() => setTab("last")}>So‘nggi to‘lovlar</button>
        <button type="button" role="tab" aria-selected={tab === "debt"} className={tab === "debt" ? "on" : ""} onClick={() => setTab("debt")}>
          Qarzdorlar {debtors.length ? <em>{debtors.length}</em> : null}
        </button>
      </div>

      <ul className="tp-list">
        {tab === "last" ? (
          recent.length === 0 ? <li className="tp-empty">Hozircha to‘lov yo‘q.</li> : recent.map((item) => (
            <li key={item.id}>
              {item.avatar ? <img src={item.avatar} alt="" /> : <span className="tp-ava">{item.patient.slice(0, 1)}</span>}
              <span className="tp-who"><b>{item.patient}</b><small>{item.service}</small><small><CalendarDays /> {item.date} · {item.method}</small></span>
              <span className={item.status === "tolandi" ? "tp-pill" : "tp-pill part"}>{item.status === "tolandi" ? "To‘landi" : "Qisman"}</span>
              <b className="tp-sum">{formatGroupedNumber(item.amount)} so‘m</b>
            </li>
          ))
        ) : debtors.length === 0 ? <li className="tp-empty">Qarzdorlik yo‘q.</li> : debtors.map((row) => (
          <li key={row.id}>
            {row.avatar ? <img src={row.avatar} alt="" /> : <span className="tp-ava">{row.name.slice(0, 1)}</span>}
            <span className="tp-who"><b>{row.name}</b><small>{row.note}</small><small><CalendarDays /> {row.date}</small></span>
            <b className="tp-sum red">{formatGroupedNumber(row.owed)} so‘m</b>
          </li>
        ))}
      </ul>

      <div className="tp-foot">
        <Link href="/crm/davolash-rejalari" className="tp-all"><FileText /> Davolash rejalari <ChevronRight /></Link>
        <button type="button" className="tp-add" onClick={() => setAdding(true)}><Plus /> To‘lov qo‘shish</button>
      </div>

      {adding ? (
        <NewPaymentModal
          plans={plans}
          initialMethod="Naqd"
          onClose={() => setAdding(false)}
          onSave={(payment) => {
            setItems((prev) => [payment, ...prev]);
            const plan = plans.find((item) => item.id === payment.planId);
            let closed = false;
            if (plan) {
              const owed = planTotals(plan).debt;
              closed = owed > 0 && payment.amount >= owed;
              setPlans((prev) => prev.map((item) => (item.id === plan.id
                ? { ...item, status: closed ? "yakun" : item.status, payments: [...item.payments, { date: payment.date, amount: payment.amount, method: payment.method, note: payment.note || "To‘lov" }] }
                : item)));
            }
            setToast(closed ? "To‘lov saqlandi. Qarz yopildi." : "To‘lov saqlandi");
            setAdding(false);
          }}
        />
      ) : null}
      {toast ? <div className="tp-toast" role="status"><CheckCircle2 /> {toast}</div> : null}
    </div>
  );
}
