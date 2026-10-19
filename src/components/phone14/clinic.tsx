"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, ChevronRight, Download, Eye, Filter, MessageCircle, Phone, Plus, QrCode, Share2, SlidersHorizontal } from "lucide-react";
import QRCode from "qrcode";
import { PhoneFrame, SearchBox, Sheet } from "@/components/phone14/chrome";
import { hidePhonePatient, listPhonePatients, writePatientCache } from "@/data/phone-records";
import { loadPatientsWithImport } from "@/lib/crm-client";
import type { Patient } from "@/data/crm";
import { ToothChart, ToothLegend } from "@/components/phone14/teeth";
import { PHONE_PAYS_KEY, PHONE_PLANS_KEY, phoneCerts, phoneLate, phonePatients, phonePayments, phoneStock, planStages, readPhoneStore, relDateLabel, type PhonePatient } from "@/data/phone14";
import { certificatesFromTickets } from "@/data/certificates";
import { loadSeminarTickets } from "@/lib/seminar-tickets";
import { useCart } from "@/components/cart-provider";
import { formatGroupedNumber } from "@/lib/format";
import type { Product } from "@/data/products";

export function PhoneCerts() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("Barchasi");
  const [earned, setEarned] = useState<ReturnType<typeof certificatesFromTickets>>([]);
  const [open, setOpen] = useState<(typeof phoneCerts)[number] | null>(null);
  const [qr, setQr] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    const read = () => setEarned(certificatesFromTickets(loadSeminarTickets()));
    read();
    window.addEventListener("sk-seminar-tickets", read);
    return () => window.removeEventListener("sk-seminar-tickets", read);
  }, []);
  const earnedCards = earned.map((item, index) => ({
    id: item.id,
    title: item.title,
    type: "seminar",
    typeLabel: "Seminar",
    date: item.dateLabel,
    cme: item.cme,
    image: "/img/phone14/cert-0.png",
    earned: true,
    index,
  }));
  const all = [...earnedCards, ...phoneCerts.map((item) => ({ ...item, earned: false }))];
  const counts = {
    Barchasi: all.length,
    Seminarlar: all.filter((item) => item.type === "seminar").length,
    "Onlayn darslar": all.filter((item) => item.type === "onlayn").length,
    Kurslar: all.filter((item) => item.type === "kurs").length,
  };
  const items = all.filter((item) => {
    if (tab === "Seminarlar" && item.type !== "seminar") return false;
    if (tab === "Onlayn darslar" && item.type !== "onlayn") return false;
    if (tab === "Kurslar" && item.type !== "kurs") return false;
    return !q.trim() || item.title.toLowerCase().includes(q.trim().toLowerCase());
  });
  const hours = all.reduce((sum, item) => sum + item.cme, 0);
  async function show(item: (typeof all)[number]) {
    setOpen(item);
    setQr(await QRCode.toDataURL(`${window.location.origin}/sertifikatlar#${item.id}`));
  }
  async function download(item: (typeof all)[number]) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f4f8ff";
    ctx.fillRect(0, 0, 1200, 800);
    ctx.strokeStyle = "#d4a017";
    ctx.lineWidth = 12;
    ctx.strokeRect(28, 28, 1144, 744);
    ctx.fillStyle = "#0f1e3d";
    ctx.font = "700 36px sans-serif";
    ctx.fillText("STOMAHUB SERTIFIKAT", 80, 140);
    ctx.font = "800 42px sans-serif";
    ctx.fillText(item.title, 80, 280);
    ctx.font = "500 28px sans-serif";
    ctx.fillText(`${item.typeLabel} · ${item.date} · ${item.cme} CME`, 80, 360);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${item.id}.png`;
    link.click();
  }
  async function share(item: (typeof all)[number]) {
    const url = `${window.location.origin}/sertifikatlar#${item.id}`;
    if (navigator.share) await navigator.share({ title: item.title, url });
    else {
      await navigator.clipboard.writeText(url);
      setNote("Havola nusxalandi");
      window.setTimeout(() => setNote(""), 1600);
    }
  }
  return (
    <PhoneFrame testId="phone-sertifikatlar" tab="market">
      <div>
        <h1>Sertifikatlar</h1>
        <p className="sub">Seminarlar, onlayn darslar va kurslar bo‘yicha sertifikatlaringiz</p>
      </div>
      <div className="stat">
        <small>Jami CME soatlar</small>
        <b>{hours} soat</b>
        <span>Professional rivojlanishingiz</span>
      </div>
      <div className="kpis">
        <article><b>{counts.Barchasi}</b><small>Sertifikatlar soni</small></article>
        <article><b>{hours}</b><small>CME soat (jami)</small></article>
        <article><b>5</b><small>Tugallangan kurslar</small></article>
      </div>
      <SearchBox value={q} onChange={setQ} label="Sertifikat qidirish" placeholder="Sertifikat nomi bo‘yicha qidirish..." />
      <div className="p14-row">
        {(["Barchasi", "Seminarlar", "Onlayn darslar", "Kurslar"] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? "p14-chip on" : "p14-chip"} onClick={() => setTab(item)}>{item} ({counts[item]})</button>
        ))}
      </div>
      <div className="list">
        {items.map((item) => (
          <article key={item.id} className="p14-card" style={{ display: "grid", gridTemplateColumns: "92px 1fr", gap: 10 }}>
            <img src={item.image} alt="" style={{ width: 92, height: 72, objectFit: "cover", borderRadius: 10 }} />
            <div>
              <b>{item.title}</b>
              <p><span className="pill blue">{item.typeLabel}</span></p>
              <p className="spec">{item.date} · {item.cme} soat CME</p>
              <p className="meta-line"><QrCode size={14} /> QR</p>
              <div className="pair" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                <button type="button" className="ghost" onClick={() => void show(item)}><Eye size={14} /> Ko‘rish</button>
                <button type="button" className="ghost" onClick={() => void download(item)}><Download size={14} /> Yuklab olish</button>
                <button type="button" className="ghost" onClick={() => void share(item)}><Share2 size={14} /> Ulashish</button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {open ? (
        <div className="viewer">
          <header><b>{open.title}</b><button type="button" onClick={() => setOpen(null)} aria-label="Yopish">Yopish</button></header>
          <img src={open.image} alt="" />
          {qr ? <img src={qr} alt="QR" style={{ width: 120, height: 120, margin: "12px auto", background: "#fff" }} /> : null}
        </div>
      ) : null}
      {note ? <div className="p14-note">{note}</div> : null}
    </PhoneFrame>
  );
}

export function PhonePatients() {
  const [rev, setRev] = useState(0);
  const [ready, setReady] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<PhonePatient | null>(null);
  useEffect(() => {
    const bump = () => setRev((value) => value + 1);
    window.addEventListener("sk-crm-patients", bump);
    void loadPatientsWithImport<Patient>().then((items) => {
      writePatientCache(items);
      setReady(true);
    });
    return () => window.removeEventListener("sk-crm-patients", bump);
  }, []);
  const all = ready ? listPhonePatients() : [];
  const filteredCity = all.filter((item) => !city || (item.city || "Toshkent") === city);
  const counts = {
    "": filteredCity.length,
    yangi: filteredCity.filter((item) => item.status === "yangi").length,
    davolanishda: filteredCity.filter((item) => item.status === "davolanishda").length,
    kuzatuvda: filteredCity.filter((item) => item.status === "kuzatuvda").length,
    yakun: filteredCity.filter((item) => item.status === "yakun").length,
  };
  const items = filteredCity.filter((item) => {
    if (status && item.status !== status) return false;
    const blob = `${item.name} ${item.phone} ${item.num}`.toLowerCase();
    return !q.trim() || blob.includes(q.trim().toLowerCase());
  });
  const chips = [
    ["", "Barchasi", ""],
    ["yangi", "Yangi", "green"],
    ["davolanishda", "Davolanishda", "blue"],
    ["kuzatuvda", "Kuzatuvda", "orange"],
    ["yakun", "Yakunlangan", "gray"],
  ] as const;
  return (
    <PhoneFrame testId="phone-bemorlar" tab="none">
      <div className="p14-head">
        <div>
          <h1>Bemorlar CRM</h1>
          <p className="sub">Bemorlaringizni qulay boshqaring</p>
        </div>
        <button type="button" className="p14-filter" onClick={() => setOpen(true)}><Filter size={14} /> Filtr</button>
      </div>
      <SearchBox className="search-44" value={q} onChange={setQ} label="Bemor qidirish" placeholder="Bemor ismi, telefon raqami yoki ID bo‘yicha qidirish..." />
      <div className="p14-row bemor-chips">
        {chips.map(([id, label, tone]) => (
          <button key={label} type="button" className={status === id ? `p14-chip ${tone} on` : `p14-chip ${tone}`} onClick={() => setStatus(id)}>{label} <i className="count">{counts[id]}</i></button>
        ))}
      </div>
      <div className="list bemor-list pad-fab">
        {items.length === 0 ? <p className="p14-empty">Bemor topilmadi</p> : items.map((item) => (
          <article key={item.id} className="pat-card">
            <Link href={`/crm/bemorlar/${item.id}`} className="pat-ava">
              <img src={item.avatar} alt="" />
              {item.online ? <i className="dot" /> : null}
            </Link>
            <div className="pat-main">
              <div className="pat-top">
                <Link href={`/crm/bemorlar/${item.id}`}><b>{item.name}</b></Link>
                <span className={`pat-status ${item.status}`}>{item.statusLabel}</span>
                <button type="button" aria-label="Menyu" onClick={() => setMenu(item)}><span aria-hidden="true">···</span></button>
              </div>
              <p className="spec">#{item.num} | {item.age} yosh | {item.gender}</p>
              <div className="pat-visits">
                <span><Calendar size={14} /> Oxirgi tashrif<small>{item.last}</small></span>
                <span>Keyingi tashrif<small>{item.next}</small></span>
              </div>
              <p className="tags">{item.tags.map((tag) => <i key={tag} className={`tag-${tag.toLowerCase()}`}>{tag}</i>)}</p>
            </div>
            <a className="pat-call" aria-label="Qo‘ng‘iroq" href={`tel:${item.phone.replace(/\s/g, "")}`}><Phone size={18} /></a>
          </article>
        ))}
      </div>
      <Link href="/crm/bemorlar/yangi" className="p14-fab" data-testid="patient-add-mobile"><Plus size={16} /> Bemor</Link>
      {menu ? (
        <Sheet title={menu.name} onClose={() => setMenu(null)}>
          <div className="sheet-links">
            <Link href={`/crm/bemorlar/${menu.id}`}>Ko‘rish</Link>
            <Link href={`/crm/bemorlar/yangi?edit=${menu.id}`}>Tahrirlash</Link>
            <Link href={`/crm/uchrashuvlar/yangi?patient=${menu.id}`}>Qabul qo‘shish</Link>
            <button type="button" onClick={() => { hidePhonePatient(menu.id); setMenu(null); setRev((value) => value + 1); }}>O‘chirish</button>
          </div>
        </Sheet>
      ) : null}
      {open ? (
        <Sheet title="Filtr" onClose={() => setOpen(false)}>
          <label>Shahar
            <select aria-label="Shahar" value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="">Barchasi</option>
              <option>Toshkent</option>
              <option>Samarqand</option>
            </select>
          </label>
          <button type="button" className="p14-go" onClick={() => setOpen(false)}>Qo‘llash</button>
        </Sheet>
      ) : null}
    </PhoneFrame>
  );
}

export { PhoneAppointments } from "@/components/phone14/appointments-phone";

export function PhonePlans() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("");
  const [open, setOpen] = useState<string | null>("s2");
  const [filter, setFilter] = useState(false);
  const [extra, setExtra] = useState<{ id: string; title: string; status: string }[]>([]);
  useEffect(() => { setExtra(readPhoneStore<{ id: string; title: string; status: string }>(PHONE_PLANS_KEY)); }, []);
  const showMain = (tab === "" || tab === "Davom etmoqda") && (!q.trim() || "malika implant protetik".includes(q.trim().toLowerCase()) || "implant va protetik davolash".includes(q.trim().toLowerCase()));
  return (
    <PhoneFrame testId="phone-reja" tab="none">
      <div className="p14-head">
        <div>
          <h1>Davolash rejalari</h1>
          <p className="sub">Bemorlar uchun davolash rejalari va bosqichlar</p>
        </div>
        <Link href="/crm/davolash-rejalari/yangi" className="p14-chip on" data-testid="plan-add"><Plus size={14} /> Yangi reja</Link>
      </div>
      <div className="p14-head">
        <SearchBox value={q} onChange={setQ} label="Reja qidirish" placeholder="Bemor ismi yoki reja nomi bo‘yicha qidirish..." />
        <button type="button" className="p14-filter" onClick={() => setFilter(true)}><SlidersHorizontal /> Filtr</button>
      </div>
      <div className="p14-row">
        {[
          ["Rejalashtirilgan", "4"],
          ["Davom etmoqda", "5"],
          ["Yakunlangan", "3"],
        ].map(([label, count]) => (
          <button key={label} type="button" className={tab === label ? "p14-chip on" : "p14-chip"} onClick={() => setTab(tab === label ? "" : label)}>{label} ({count})</button>
        ))}
      </div>
      {showMain ? (
        <>
          <article className="p14-card">
            <div className="who">
              <img src="/img/phone14/pat-0.png" alt="" />
              <span><b>Malika Karimova</b><small>#B-0012 · 28 yosh · Ayol</small><small>+998 90 123 45 67</small></span>
            </div>
            <Link href="/crm/bemorlar/b-0012" className="ghost" style={{ display: "inline-flex", alignItems: "center", marginTop: 8, padding: "0 12px" }}>Bemor kartasi</Link>
          </article>
          <article className="p14-card">
            <div className="p14-head"><b>Implant va protetik davolash</b><span className="pill blue">Davom etmoqda</span></div>
            <p className="spec">Reja raqami DP-{new Date().getFullYear()}-001 · {relDateLabel(-5)}</p>
            <ToothChart palette />
            <ToothLegend />
          </article>
          <section>
            <div className="p14-head"><h2 style={{ margin: 0, fontSize: "1.05rem" }}>Davolash bosqichlari</h2><b>Umumiy summa 12 500 000 so‘m</b></div>
            <div className="list">
              {planStages.map((stage, index) => (
                <button key={stage.id} type="button" className="p14-card stage" onClick={() => setOpen(open === stage.id ? null : stage.id)} aria-expanded={open === stage.id}>
                  <div className="top">
                    <b>{index + 1}. {stage.name}</b>
                    <span className={`pill ${stage.status === "Yakunlangan" ? "green" : stage.status === "Davom etmoqda" ? "blue" : stage.status === "Rejalashtirilgan" ? "amber" : "gray"}`}>{stage.status}</span>
                  </div>
                  <p>{formatGroupedNumber(stage.price)} so‘m</p>
                  {open === stage.id ? <p className="spec">{stage.date ? `${stage.date}. ` : ""}{stage.note}</p> : null}
                </button>
              ))}
            </div>
          </section>
        </>
      ) : <p className="p14-empty">Bu bo‘limda reja tanlanmadi</p>}
      {extra.map((item) => <article key={item.id} className="p14-card"><b>{item.title}</b><p className="pill blue">{item.status}</p></article>)}
      {filter ? <Sheet title="Filtr" onClose={() => setFilter(false)}><button type="button" className="p14-go" onClick={() => { setTab("Davom etmoqda"); setFilter(false); }}>Davom etmoqda</button></Sheet> : null}
    </PhoneFrame>
  );
}

const WEEK = [
  { label: "7", h: 40 },
  { label: "8", h: 55 },
  { label: "9", h: 48 },
  { label: "10", h: 70 },
  { label: "11", h: 62 },
  { label: "12", h: 92, tip: "12 okt 15 200 000 so‘m" },
  { label: "13", h: 50 },
];

export function PhonePayments() {
  const [month, setMonth] = useState("Okt 2024");
  const [range, setRange] = useState<"Hafta" | "Oy" | "Yil">("Hafta");
  const [tip, setTip] = useState<number | null>(5);
  const [tab, setTab] = useState("recent");
  const [extra, setExtra] = useState<{ id: string; name: string; amount: string; note: string; date: string; status: string; avatar: string; late: boolean }[]>([]);
  useEffect(() => { setExtra(readPhoneStore<{ id: string; name: string; amount: string; note: string; date: string; status: string; avatar: string; late: boolean }>(PHONE_PAYS_KEY)); }, []);
  const months = ["Sen 2024", "Okt 2024", "Noy 2024"];
  const bars = range === "Hafta" ? WEEK : range === "Oy" ? WEEK.map((item, index) => ({ ...item, h: 30 + ((index * 17) % 60), tip: index === 5 ? item.tip : undefined })) : WEEK.map((item) => ({ ...item, h: 36 + (item.h % 40), tip: undefined }));
  const rows = tab === "recent" ? [...extra, ...phonePayments] : phoneLate;
  return (
    <PhoneFrame testId="phone-tolovlar" tab="none">
      <div className="p14-head">
        <div>
          <h1>To‘lovlar</h1>
          <p className="sub">Moliyaviy ko‘rsatkichlar va to‘lovlar tarixi</p>
        </div>
        <button type="button" className="p14-filter" onClick={() => setMonth(months[(months.indexOf(month) + 1) % months.length])}>{month}</button>
      </div>
      <div className="pay-kpis">
        <article><small>Jami tushum</small><b>48 250 000</b><em className="up">+12%</em></article>
        <article><small>To‘langan</small><b>38 700 000</b><em className="up">+18%</em></article>
        <article><small>Kutilayotgan</small><b>7 250 000</b><em className="down">-6%</em></article>
        <article><small>Muddati o‘tgan</small><b>2 300 000</b><em className="up">+25%</em></article>
      </div>
      <article className="p14-card">
        <div className="p14-head"><b>Tushumlar statistikasi</b>
          <span>{(["Hafta", "Oy", "Yil"] as const).map((item) => <button key={item} type="button" className={range === item ? "p14-chip on" : "p14-chip"} onClick={() => setRange(item)}>{item}</button>)}</span>
        </div>
        <div className="chart">
          {bars.map((bar, index) => (
            <button key={bar.label} type="button" className={tip === index ? "on" : undefined} style={{ height: `${bar.h}%` }} onClick={() => setTip(index)}>
              {tip === index && bar.tip ? <span className="tip">{bar.tip}</span> : null}
            </button>
          ))}
        </div>
      </article>
      <div className="p14-row">
        <button type="button" className={tab === "recent" ? "p14-chip on" : "p14-chip"} onClick={() => setTab("recent")}>So‘nggi to‘lovlar</button>
        <button type="button" className={tab === "late" ? "p14-chip on" : "p14-chip"} onClick={() => setTab("late")}>Muddati o‘tganlar (5)</button>
      </div>
      <div className="list">
        {rows.map((item) => (
          <article key={item.id} className="p14-card row-card pay-row">
            <img src={item.avatar} alt="" />
            <div><b>{item.name}</b><p className="spec">{item.note}</p><p className="spec">{item.date}</p>{item.late ? <span className="pill red">{item.status}</span> : null}</div>
            <b>{item.amount}</b>
            <ChevronRight size={16} color="#94a3b8" />
          </article>
        ))}
      </div>
      <Link href="/crm/tolovlar#barchasi">Barcha to‘lovlarni ko‘rish</Link>
      <Link href="/crm/tolovlar/yangi" className="p14-fab" data-testid="pay-add"><Plus size={16} /> To‘lov qo‘shish</Link>
    </PhoneFrame>
  );
}

export function PhoneStock() {
  const { add } = useCart();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("Barchasi");
  const [low, setLow] = useState(false);
  const [filter, setFilter] = useState(false);
  const [scan, setScan] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [report, setReport] = useState(false);
  const [sku, setSku] = useState("");
  const [form, setForm] = useState({ name: "", category: "Materiallar", sku: "", qty: "10", max: "20", expiry: "" });
  const [extra, setExtra] = useState<typeof phoneStock>([]);
  const [note, setNote] = useState("");
  const items = useMemo(() => [...extra, ...phoneStock].filter((item) => {
    if (low && item.status !== "Kam qoldi") return false;
    if (tab !== "Barchasi" && item.category !== tab) return false;
    const blob = `${item.name} ${item.category} ${item.sku}`.toLowerCase();
    return !q.trim() || blob.includes(q.trim().toLowerCase());
  }), [extra, low, q, tab]);
  return (
    <PhoneFrame testId="phone-ombor" tab="none">
      <div className="p14-head">
        <div>
          <h1>Ombor</h1>
          <p className="sub">Materiallar va jihozlar inventarizatsiyasi</p>
        </div>
        <button type="button" className="p14-filter" onClick={() => setScan(true)}>Skaner</button>
      </div>
      <div className="p14-head">
        <SearchBox value={q} onChange={setQ} label="Ombor qidirish" placeholder="Mahsulot nomi, kategoriya yoki SKU bo‘yicha qidirish..." />
        <button type="button" className="p14-filter" onClick={() => setFilter(true)}><SlidersHorizontal /> Filtr</button>
      </div>
      <div className="p14-row">
        {[
          ["Barchasi", "128"],
          ["Materiallar", "45"],
          ["Implantlar", "18"],
          ["Instrumentlar", "22"],
          ["Jihozlar", "12"],
        ].map(([label, count]) => (
          <button key={label} type="button" className={tab === label ? "p14-chip on" : "p14-chip"} onClick={() => { setTab(label); setLow(false); }}>{label} ({count})</button>
        ))}
      </div>
      <button type="button" className="alert" onClick={() => setLow(true)}>
        <b>Kam miqdordagi mahsulotlar</b>
        5 ta mahsulotning qoldig‘i kam. Zudlik bilan buyurtma bering.
      </button>
      <div className="list">
        {items.length === 0 ? <p className="p14-empty">Mahsulot topilmadi</p> : items.map((item) => (
          <article key={item.id} className="p14-card row-card" style={{ gridTemplateColumns: "58px 1fr" }}>
            <img src={item.image} alt="" />
            <div>
              <div className="p14-head"><b>{item.name}</b><span className={`pill ${item.status === "Kam qoldi" ? "red" : "green"}`}>{item.status}</span></div>
              <p className="spec">{item.category} · {item.sku}</p>
              <div className="bar"><i style={{ width: `${Math.min(100, (item.qty / item.max) * 100)}%`, background: item.status === "Kam qoldi" ? "#ef4444" : "#22c55e" }} /></div>
              <p className="spec">{item.qty}/{item.max} · {item.expiry}</p>
              <button type="button" className="ghost" onClick={() => {
                add(item.id, { id: item.id, name: item.name, brand: "Ombor", category: "materiallar", price: 50000, rating: 5, reviews: 1, inStock: true, delivery: "Klinika", image: item.image, sku: item.sku } satisfies Product);
                setNote("Savatga qo‘shildi");
                window.setTimeout(() => setNote(""), 1400);
              }}>Buyurtma berish</button>
            </div>
          </article>
        ))}
      </div>
      <button type="button" onClick={() => setReport(true)}>Ombor hisoboti</button>
      <button type="button" className="p14-fab" onClick={() => setAddOpen(true)}><Plus size={16} /> Mahsulot qo‘shish</button>
      {note ? <div className="p14-note">{note}</div> : null}
      {scan ? (
        <Sheet title="Skaner" onClose={() => setScan(false)}>
          <div className="scan"><div className="fake" /></div>
          <label>Shtrix-kod yoki SKU<input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="CMP-001" /></label>
          <button type="button" className="p14-go" onClick={() => { setQ(sku); setScan(false); }}>Qidirish</button>
        </Sheet>
      ) : null}
      {addOpen ? (
        <Sheet title="Mahsulot qo‘shish" onClose={() => setAddOpen(false)}>
          <label>Nomi<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Kategoriya<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Materiallar</option><option>Implantlar</option><option>Instrumentlar</option><option>Jihozlar</option></select></label>
          <label>SKU<input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} /></label>
          <label>Qoldiq<input value={form.qty} onChange={(event) => setForm({ ...form, qty: event.target.value })} /></label>
          <label>Yaroqlilik<input value={form.expiry} onChange={(event) => setForm({ ...form, expiry: event.target.value })} placeholder="01 yan 2027" /></label>
          <button type="button" className="p14-go" onClick={() => {
            if (!form.name.trim()) return;
            const qty = Number(form.qty) || 0;
            const max = Number(form.max) || 20;
            setExtra((prev) => [{ id: `st-${Date.now()}`, name: form.name.trim(), category: form.category, sku: form.sku || `SKU-${Date.now().toString().slice(-4)}`, qty, max, expiry: form.expiry || "01 yan 2028", status: qty / max < 0.4 ? "Kam qoldi" : "Norma", image: "/img/phone14/stock-0.png" }, ...prev]);
            setAddOpen(false);
          }}>Saqlash</button>
        </Sheet>
      ) : null}
      {filter ? <Sheet title="Filtr" onClose={() => setFilter(false)}><button type="button" className="p14-go" onClick={() => { setLow(true); setFilter(false); }}>Faqat kam qoldiq</button></Sheet> : null}
      {report ? <Sheet title="Ombor hisoboti" onClose={() => setReport(false)}><p>Jami pozitsiyalar: 128. Kam qoldiq: 5. Implantlar: 18.</p></Sheet> : null}
    </PhoneFrame>
  );
}
