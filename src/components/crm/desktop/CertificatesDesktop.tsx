"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  Award,
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  Eye,
  Info,
  MapPin,
  MonitorPlay,
  QrCode,
  Search,
  Star,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { MarketFrame, type HeaderLink } from "@/components/shop/desktop/MarketFrame";
import { certTypes, certificatesFromRegistrations, designCertificates, type CertType, type Certificate } from "@/data/certificates";
import { downloadPdf } from "@/lib/simple-pdf";
import "./crm.css";

const headerLinks: HeaderLink[] = [
  { href: "/", label: "Bosh sahifa" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/seminarlar", label: "Seminarlar" },
  { href: "/ustalar", label: "Ustalar" },
  { href: "/forma", label: "Forma" },
  { href: "/kitoblar", label: "Kitoblar" },
  { href: "/talim", label: "Ta’lim", key: "talim" },
];



function norm(value: string) {
  return value.toLowerCase().replaceAll("‘", "'").replaceAll("’", "'");
}

const paperFill: Record<Certificate["theme"], string> = {
  blue: "#e7f0ff",
  mint: "#e7fbf3",
  sand: "#fff8e8",
  navy: "#0c2454",
  sky: "#eaf3ff",
  royal: "#dbeafe",
};

const designPreview: Record<string, string> = {
  "cert-implant": "/img/design-pr13/certs/cert-implant.png",
  "cert-endo": "/img/design-pr13/certs/cert-endo.png",
  "cert-orto": "/img/design-pr13/certs/cert-orto.png",
  "cert-cad": "/img/design-pr13/certs/cert-cad.png",
  "cert-paro": "/img/design-pr13/certs/cert-paro.png",
  "cert-child": "/img/design-pr13/certs/cert-child.png",
};

/** Real (earned) certificates only — samples are never offered as downloads. */
function downloadCert(cert: Certificate) {
  if (!cert.earned) return;
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dark = cert.theme === "navy";
  ctx.fillStyle = paperFill[cert.theme];
  ctx.fillRect(0, 0, 1400, 900);
  ctx.strokeStyle = "#d4a017";
  ctx.lineWidth = 16;
  ctx.strokeRect(36, 36, 1328, 828);
  ctx.strokeStyle = dark ? "#f3d27a" : "#c9a227";
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 56, 1288, 788);
  ctx.fillStyle = dark ? "#ffffff" : "#0f1e3d";
  ctx.font = "700 28px sans-serif";
  ctx.fillText("STOMAHUB", 110, 150);
  ctx.font = "800 64px sans-serif";
  ctx.fillText("SERTIFIKAT", 110, 250);
  ctx.font = "700 40px sans-serif";
  ctx.fillText(cert.holder, 110, 360);
  ctx.font = "700 30px sans-serif";
  ctx.fillText(cert.title, 110, 430);
  ctx.font = "italic 28px Georgia, serif";
  ctx.fillText(cert.teacher, 110, 560);
  ctx.font = "500 24px sans-serif";
  ctx.fillText(`${cert.place}  ·  ${cert.dateLabel}`, 110, 640);
  ctx.beginPath();
  ctx.arc(1180, 640, 70, 0, Math.PI * 2);
  ctx.fillStyle = "#e8c15a";
  ctx.fill();
  ctx.fillStyle = dark ? "#fff6d0" : "#8a6400";
  ctx.font = "700 22px sans-serif";
  ctx.fillText(`${cert.cme} CME`, 1128, 648);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${cert.id}.png`;
  link.click();
  downloadPdf(`${cert.id}.pdf`, ["STOMAHUB", "SERTIFIKAT", cert.holder, cert.title, `${cert.typeLabel} · ${cert.teacher}`, `${cert.dateLabel} · ${cert.place}`, cert.cme ? `${cert.cme} CME` : ""].filter(Boolean));
}

function CertSheet({ item }: { item: Certificate }) {
  const preview = designPreview[item.id];
  if (preview) {
    return (
      <div className={`cert-paper photo ${item.theme}`} data-testid="cert-sheet">
        <img src={preview} alt="" />
      </div>
    );
  }
  return (
    <div className={`cert-paper ${item.theme}`} data-testid="cert-sheet">
      <b className="brand">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
        </svg>
        STOMAHUB
      </b>
      <h3>SERTIFIKAT</h3>
      <p className="who">{item.holder}</p>
      <p className="course">{item.title}</p>
      <div className="cert-sign">
        <svg viewBox="0 0 140 36" aria-hidden="true">
          <path d="M4 26 C 16 6, 30 6, 38 20 S 54 34, 64 16 S 82 2, 96 18 S 114 32, 136 10" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span>{item.teacher}</span>
      </div>
      <p className="sub">
        {item.place} · {item.dateLabel}
      </p>
      {item.cme ? <span className="cert-cme">{item.cme} CME</span> : null}
      <svg className="cert-seal" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#e8c15a" stroke="#a67c00" strokeWidth="3" />
        <circle cx="32" cy="32" r="21" fill="none" stroke="#8a6400" strokeWidth="1.2" />
        <path d="M32 16 L35.2 26.2 H46 L37.2 32.4 L40.2 43 L32 36.6 L23.8 43 L26.8 32.4 L18 26.2 H28.8 Z" fill="#fff6d0" stroke="#8a6400" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function CertificatesDesktop() {
  const { registrations, ready } = useSeminarRegs();
  const { profile } = useDoctorProfile();
  const [q, setQ] = useState("");
  const [type, setType] = useState<CertType | "cme" | "">("");
  const [sort, setSort] = useState<"yangi" | "eski" | "cme">("yangi");
  const [open, setOpen] = useState<Certificate | null>(null);
  const [mode, setMode] = useState<"full" | "qr" | "sample">("full");
  const [qr, setQr] = useState("");

  const earned = useMemo(() => certificatesFromRegistrations(registrations, profile?.fullName ?? ""), [profile?.fullName, registrations]);
  const all = useMemo(() => [...earned, ...designCertificates], [earned]);
  const items = useMemo(() => {
    const query = norm(q.trim());
    const next = all.filter((item) => {
      if (type === "cme" && !item.cme) return false;
      if (type && type !== "cme" && item.type !== type) return false;
      if (!query) return true;
      return norm(`${item.title} ${item.teacher} ${item.holder} ${item.typeLabel} ${item.place}`).includes(query);
    });
    next.sort((a, b) => {
      if (a.earned !== b.earned) return a.earned ? -1 : 1;
      if (sort === "cme" || type === "cme") return b.cme - a.cme;
      if (sort === "eski") return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });
    return next;
  }, [all, q, sort, type]);

  const cme = earned.reduce((sum, item) => sum + item.cme, 0);
  const courses = new Set(earned.filter((item) => item.type !== "seminar").map((item) => item.title)).size;

  useEffect(() => {
    if (!open || mode !== "qr") return;
    const text = [`StomaHub sertifikat`, open.holder, open.title, `${open.typeLabel} · ${open.teacher}`, `${open.dateLabel} · ${open.place}`, open.cme ? `${open.cme} CME` : "", `ID: ${open.id}`].filter(Boolean).join("\n");
    void QRCode.toDataURL(text, { width: 320, margin: 1 }).then(setQr, (error: unknown) => console.warn("qr", error));
  }, [open, mode]);

  function act(item: Certificate, next: "full" | "qr" | "down") {
    if (!item.earned && next !== "full") {
      setMode("sample");
      setOpen(item);
      return;
    }
    if (next === "down") {
      downloadCert(item);
      return;
    }
    setQr("");
    setMode(next);
    setOpen(item);
  }

  return (
    <MarketFrame
      active="certs"
      headerLinks={headerLinks}
      headerActive="talim"
      searchPlaceholder="Kurs, seminar yoki mavzu bo‘yicha qidiring..."
      headerQuery={q}
      onHeaderQuery={setQ}
      promoTitle="Bilimingiz har doim siz bilan!"
      promoText="Barcha sertifikatlaringiz bir joyda"
      promoCta="Sertifikatlaringiz"
      promoImage="/img/design-pr13/promo/medal.png"
      promoIcon={<Award className="i" />}
      onPromo={() => {
        setQ("");
        setType("");
        setSort("yangi");
      }}
    >
      <div data-testid="certs-desktop" className="ct2">
        <div className="ct2-head">
          <div>
            <h1>Sertifikatlar</h1>
            <p>Siz olgan barcha sertifikatlar va yutuqlar</p>
          </div>
          <div className="ct2-stats" data-testid="cert-stats">
            <span><Award className="i" /><b>{earned.length}</b><small>ta sertifikat</small></span>
            <span><Star className="i" /><b>{cme}</b><small>CME ballari</small></span>
            <span><Clock className="i" /><b>{courses}</b><small>ta kurs yakunlangan</small></span>
          </div>
        </div>
        <div className="ct2-tools">
          <div className="ct2-chips" role="tablist" aria-label="Sertifikat turi">
            <button type="button" role="tab" aria-selected={type === ""} className={type === "" ? "on" : undefined} data-testid="cert-all" onClick={() => setType("")}>Barchasi</button>
            {certTypes.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={type === item.id} className={type === item.id ? "on" : undefined} data-testid={`cert-${item.id}`} onClick={() => setType(item.id)}>{item.label}</button>
            ))}
          </div>
          <label className="ct2-search">
            <Search className="i" />
            <input data-testid="cert-search" aria-label="Sertifikat qidirish" value={q} placeholder="Sertifikat nomi yoki tashkilot bo‘yicha..." onChange={(event) => setQ(event.target.value)} />
          </label>
          <label className="ct2-sort">
            <ArrowUpDown className="i" />
            <select data-testid="cert-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="yangi">Yangidan eskiga</option>
              <option value="eski">Eskidan yangiga</option>
              <option value="cme">CME bo‘yicha</option>
            </select>
            <ChevronDown className="i" />
          </label>
        </div>
        {ready && earned.length === 0 ? (
          <div className="ct2-note" data-testid="cert-note">
            <Info className="i" />
            <span>
              {profile ? "Sizda hali sertifikat yo‘q." : "Sertifikatlaringizni ko‘rish uchun hisobingizga kiring."} Seminarda qatnashganingizni tashkilotchi tasdiqlagach, sertifikat shu yerda ismingiz bilan chiqadi. Pastdagilar — namuna.
            </span>
            {profile ? <Link href="/seminarlar">Seminarlar <ArrowRight className="i" /></Link> : <Link href="/kirish?next=/sertifikatlar">Kirish <ArrowRight className="i" /></Link>}
          </div>
        ) : null}
        {items.length === 0 ? (
          <div className="ct2-empty" data-testid="cert-empty">
            <b>Sertifikat topilmadi</b>
            <button type="button" onClick={() => { setQ(""); setType(""); }}>Filtrlarni tozalash</button>
          </div>
        ) : (
          <div className="ct2-grid">
            {items.map((item) => (
              <article key={item.id} className="ct2-card" data-testid="cert-card" data-earned={item.earned ? "1" : undefined}>
                <button type="button" className="sheet" aria-label={`${item.title} — ko‘rish`} onClick={() => act(item, "full")}>
                  <CertSheet item={item} />
                  {!item.earned ? <span className="ct2-sample">Namuna</span> : null}
                </button>
                <h2>{item.title}</h2>
                <p className="who">{item.typeLabel} • {item.teacher}</p>
                <p className="when">
                  <span><CalendarDays className="i" /> {item.dateLabel}</span>
                  <span>{item.place === "Onlayn" ? <MonitorPlay className="i" /> : <MapPin className="i" />} {item.place}</span>
                </p>
                <div className="ops">
                  <button type="button" data-testid={`cert-view-${item.id}`} onClick={() => act(item, "full")}><Eye className="i" /> Ko‘rish</button>
                  <button type="button" data-testid={`cert-down-${item.id}`} onClick={() => act(item, "down")}><Download className="i" /> Yuklab olish</button>
                  <button type="button" className="sq" data-testid={`cert-qr-${item.id}`} aria-label="QR kod" onClick={() => act(item, "qr")}><QrCode className="i" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
        {open && mode === "full" ? (
          <div className="cert-full" role="dialog" aria-label="Sertifikat" data-testid="cert-modal" onMouseDown={(event) => event.target === event.currentTarget && setOpen(null)}>
            <button type="button" className="cert-close" onClick={() => setOpen(null)} aria-label="Yopish">×</button>
            <CertSheet item={open} />
            {open.earned ? (
              <button type="button" className="go" onClick={() => downloadCert(open)}>Yuklab olish</button>
            ) : (
              <p className="ct2-full-note">Namuna sertifikat — sizning sertifikatingiz shu ko‘rinishda, ismingiz bilan beriladi.</p>
            )}
          </div>
        ) : null}
        {open && mode === "qr" ? (
          <div className="crm-modal" role="dialog" aria-label="QR kod" data-testid="cert-qr-modal" onMouseDown={(event) => event.target === event.currentTarget && setOpen(null)}>
            <div className="crm-dialog cert-view">
              <header>
                <b>{open.title}</b>
                <button type="button" onClick={() => setOpen(null)} aria-label="Yopish">×</button>
              </header>
              <div className="cert-qr">{qr ? <img src={qr} alt="QR kod" data-testid="cert-qr-img" /> : null}<p>{open.holder} · {open.dateLabel}</p><small>QR kodda sertifikat ma’lumotlari yozilgan.</small></div>
            </div>
          </div>
        ) : null}
        {open && mode === "sample" ? (
          <div className="crm-modal" role="dialog" aria-label="Namuna sertifikat" data-testid="cert-sample-modal" onMouseDown={(event) => event.target === event.currentTarget && setOpen(null)}>
            <div className="crm-dialog ct2-dlg">
              <header>
                <b>Namuna sertifikat</b>
                <button type="button" onClick={() => setOpen(null)} aria-label="Yopish"><X className="i" /></button>
              </header>
              <p>Bu sertifikat sahifa qanday ko‘rinishini ko‘rsatish uchun qo‘yilgan, uni yuklab olib yoki QR orqali tasdiqlab bo‘lmaydi.</p>
              <p>Seminarda qatnashganingiz tasdiqlangach, o‘z sertifikatingizni shu yerdan yuklab olasiz.</p>
              <div className="act">
                <button type="button" onClick={() => setOpen(null)}>Yopish</button>
                <Link className="go" href="/seminarlar">Seminarlarni ko‘rish</Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MarketFrame>
  );
}
