"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, Pencil, Wallet } from "lucide-react";
import { ClinicShell } from "@/components/shell/ClinicShell";
import { formatGroupedNumber } from "@/lib/format";
import "./profile-faithful.css";

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const BABY = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65, 85, 84, 83, 82, 81, 71, 72, 73, 74, 75];
const TOOTH: Record<number, string> = { 16: "kar", 26: "kar", 14: "sht", 11: "end", 21: "plo", 24: "plo", 31: "imp", 36: "yoq", 46: "end" };
const LEGEND = [
  ["#fff", "Sog‘lom"],
  ["#ef4444", "Karies"],
  ["#3b82f6", "Plomba"],
  ["#f59e0b", "Endodontik"],
  ["#8b5cf6", "Shtift"],
  ["#0198a4", "Implant"],
  ["#e8eef4", "Yo‘q tish"],
];
const VISITS = [
  { date: "12 okt 2024", title: "Karies davolash", doctor: "Dr. Ibrohim", note: "karies" },
  { date: "28 sen 2024", title: "Konsultatsiya", doctor: "Dr. Sardor", note: "shtift" },
  { date: "15 sen 2024", title: "Implant o‘rnatish", doctor: "Dr. Ibrohim", note: "implant" },
  { date: "2 sen 2024", title: "Profilaktik ko‘rik", doctor: "Dr. Nargiza", note: "" },
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
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("umumiy");
  const [baby, setBaby] = useState(false);
  const [editing, setEditing] = useState(false);
  const [allergyOpen, setAllergyOpen] = useState(false);
  const [phone, setPhone] = useState("+998 90 123 45 67");
  const [email, setEmail] = useState("malika.karimova@mail.uz");
  const [address, setAddress] = useState("Mirzo Ulug‘bek tumani, Buyuk Ipak Yo‘li 45");
  const showChart = tab === "umumiy" || tab === "tish";
  const showVisits = tab === "umumiy" || tab === "tashrif";
  const showInfo = tab === "umumiy" || tab === "hujjat";

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
              <button type="button" data-testid="profile-edit" onClick={() => setEditing((value) => !value)}><Pencil size={15} /> Tahrirlash</button>
            </div>
          </div>
        </div>

        <section className="pxp-hero">
          <div className="pxp-who">
            <img src="/img/designs/malika.png" alt="" />
            <div>
              <h2>Malika Karimova <span className="pxp-id">#000124</span></h2>
              <div className="pxp-line">
                <span>28 yosh (12 fev 1996)</span>
                <span>Ayol</span>
              </div>
              <div className="pxp-line">
                <span>{phone}</span>
                <span>Toshkent</span>
                <span>Telegram: @malikakarimova</span>
              </div>
              <div className="pxp-badges">
                <span>Faol bemor</span>
                <span>Implant</span>
                <span>Ortodontik davolash</span>
                <span className="vip">VIP</span>
              </div>
            </div>
          </div>
          <div className="pxp-money">
            <article><div><small>Umumiy summa</small><b>{money(12500000)}</b></div></article>
            <article><div><small>To‘langan</small><b>{money(8000000)}</b></div></article>
            <article className="debt"><div><small>Qarz</small><b>{money(4500000)}</b></div></article>
          </div>
          <div className="pxp-alert">
            <b>Allergiya <button type="button" onClick={() => setAllergyOpen((value) => !value)}>Batafsil ›</button></b>
            <p>Penitsillin, Aspirin</p>
            <p>Gipertoniya (yengil), Diabet (2 tip)</p>
            {allergyOpen ? <p data-testid="profile-allergy">Davolash oldidan qon bosimini tekshirish. Anesteziyaga sezuvchanlik bor.</p> : null}
          </div>
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
                  {(baby ? BABY.slice(0, 10) : UPPER).map((n) => <button key={n} type="button" className={`px-tooth ${TOOTH[n] || ""}`}>{n}</button>)}
                </div>
                <div className="pxp-arch">
                  {(baby ? BABY.slice(10) : LOWER).map((n) => <button key={n} type="button" className={`px-tooth ${TOOTH[n] || ""}`}>{n}</button>)}
                </div>
                <div className="pxp-legend">
                  {LEGEND.map(([color, label]) => <span key={label}><i style={{ background: color, border: "1px solid #d5e0ea" }} />{label}</span>)}
                </div>
              </section>
            ) : null}
            {showVisits ? (
              <section className="pxp-card">
                <h3>So‘nggi tashriflar <button type="button" onClick={() => setTab("tashrif")}>Barchasini ko‘rish ›</button></h3>
                {VISITS.map((item) => (
                  <div key={item.date} className="pxp-visit">
                    <div><b>{item.date}</b><small>{item.title} · {item.doctor}{item.note ? ` · ${item.note}` : ""}</small></div>
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
            <div className="pxp-visit"><div><b>Implant va protez davolash rejasi</b><small>14.10.2024 · Dr. Ibrohim · Reja qilingan</small></div><b>{money(8597500)}</b></div>
          </section>
        ) : null}
        {tab === "tolov" ? (
          <section className="pxp-card">
            <h3>To‘lovlar</h3>
            <div className="pxp-visit"><div><b>14.10.2024 · Click</b><small>Implant va protez rejasi</small></div><b>{money(8000000)}</b></div>
            <div className="pxp-visit"><div><b>Qarz</b><small>Yakuniy summa {money(8597500)}</small></div><b>{money(4500000)}</b></div>
          </section>
        ) : null}

        {showInfo ? (
          <div className="pxp-grid3">
            <section className="pxp-card">
              <h3>Asosiy ma’lumotlar <button type="button" onClick={() => setEditing((value) => !value)}>Tahrirlash</button></h3>
              <div className="pxp-row"><span>Ism, familiya</span><b>Malika Karimova</b></div>
              <div className="pxp-row"><span>Tug‘ilgan sana</span><b>12 fev 1996 (28 yosh)</b></div>
              <div className="pxp-row"><span>Jinsi</span><b>Ayol</b></div>
              <div className="pxp-row"><span>Telefon</span>{editing ? <input className="pxp-edit" aria-label="Telefon" value={phone} onChange={(event) => setPhone(event.target.value)} /> : <b>{phone}</b>}</div>
              <div className="pxp-row"><span>Email</span>{editing ? <input className="pxp-edit" aria-label="Email" value={email} onChange={(event) => setEmail(event.target.value)} /> : <b>{email}</b>}</div>
              <div className="pxp-row"><span>Shahar</span><b>Toshkent</b></div>
              <div className="pxp-row"><span>Manzil</span>{editing ? <input className="pxp-edit" aria-label="Manzil" value={address} onChange={(event) => setAddress(event.target.value)} /> : <b>{address}</b>}</div>
              <div className="pxp-row"><span>Qayerdan bildi?</span><b>Instagram</b></div>
            </section>
            <section className="pxp-card">
              <h3>Tibbiy ma’lumotlar <button type="button" onClick={() => setAllergyOpen(true)}>Tahrirlash</button></h3>
              <div className="pxp-row"><span>Allergiya</span><b>Penitsillin, Aspirin</b></div>
              <div className="pxp-row"><span>Kasalliklar</span><b>Gipertoniya (yengil), Diabet (2 tip)</b></div>
              <div className="pxp-row"><span>Doimiy dori vositalari</span><b>Yo‘q</b></div>
              <div className="pxp-row"><span>Chekish / spirtli ichimlik</span><b>Yo‘q</b></div>
              <div className="pxp-note">Bemorda anesteziyaga nisbatan sezuvchanlik mavjud. Davolash oldidan qon bosimini tekshirish.</div>
            </section>
            <section className="pxp-card">
              <h3>Hujjatlar / Rentgen <button type="button" onClick={() => setTab("hujjat")}>Barchasini ko‘rish ›</button></h3>
              <div className="pxp-docs">
                {[["OPG", "12 okt 2024"], ["RVG", "12 okt 2024"], ["3D KT", "15 sen 2024"], ["Intraoral foto", "15 sen 2024"], ["Davolash rejasi", "28 sen 2024"]].map(([name, date]) => (
                  <figure key={name}><div className="ph" /><figcaption>{name}</figcaption><small>{date}</small></figure>
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </ClinicShell>
  );
}
