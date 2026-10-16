"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BadgePercent,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  Download,
  Eye,
  GraduationCap,
  Heart,
  Home,
  LayoutGrid,
  MapPin,
  PlayCircle,
  QrCode,
  Search,
  Settings,
  Star,
  Tag,
  UserRound,
} from "lucide-react";
import QRCode from "qrcode";
import { MarketFrame, type FrameLink, type HeaderLink } from "@/components/shop/desktop/MarketFrame";
import { certTypes, certificatesFromTickets, designCertificates, type CertType, type Certificate } from "@/data/certificates";
import { loadSeminarTickets } from "@/lib/seminar-tickets";
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

const sideMain: FrameLink[] = [
  { key: "home", label: "Bosh sahifa", href: "/", icon: Home },
  { key: "courses", label: "Onlayn darslar", href: "/talim", icon: GraduationCap },
  { key: "seminars", label: "Seminarlar", href: "/seminarlar", icon: CalendarDays },
  { key: "specs", label: "Mutaxassislar", href: "/mutaxassislar", icon: UserRound },
  { key: "clinics", label: "Klinikalar", href: "/mening-klinikam", icon: Star },
  { key: "books", label: "Kitoblar", href: "/kitoblar", icon: BookOpen },
  { key: "cats", label: "Kategoriyalar", href: "/marketplace", icon: LayoutGrid },
  { key: "brands", label: "Brendlar", href: "/marketplace/brendlar", icon: Tag },
  { key: "sale", label: "Aksiyalar", href: "/marketplace/aksiyalar", icon: BadgePercent },
];

const sideSecond: FrameLink[] = [
  { key: "fav", label: "Sevimlilar", href: "/talim", icon: Heart },
  { key: "mine", label: "Mening kurslarim", href: "/talim", icon: PlayCircle },
  { key: "certs", label: "Sertifikatlar", href: "/sertifikatlar", icon: Award },
  { key: "settings", label: "Sozlamalar", href: "/profil", icon: Settings },
];

function norm(value: string) {
  return value.toLowerCase().replaceAll("‘", "'").replaceAll("’", "'");
}

async function downloadPng(cert: Certificate) {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dark = cert.theme === "navy";
  ctx.fillStyle = dark ? "#0c2454" : "#f4f8ff";
  ctx.fillRect(0, 0, 1400, 900);
  ctx.strokeStyle = "#d4a017";
  ctx.lineWidth = 10;
  ctx.strokeRect(36, 36, 1328, 828);
  ctx.fillStyle = dark ? "#ffffff" : "#0f1e3d";
  ctx.font = "700 28px sans-serif";
  ctx.fillText("STOMAHUB", 90, 140);
  ctx.font = "800 72px sans-serif";
  ctx.fillText("SERTIFIKAT", 90, 250);
  ctx.font = "600 36px sans-serif";
  ctx.fillText(cert.holder, 90, 360);
  ctx.font = "700 32px sans-serif";
  ctx.fillText(cert.title, 90, 440);
  ctx.font = "500 26px sans-serif";
  ctx.fillText(`${cert.typeLabel} · ${cert.teacher}`, 90, 510);
  ctx.fillText(`${cert.dateLabel} · ${cert.place}`, 90, 560);
  ctx.fillText(`${cert.cme} CME`, 90, 640);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${cert.id}.png`;
  link.click();
}

export function CertificatesDesktop() {
  const [tickets, setTickets] = useState<ReturnType<typeof loadSeminarTickets>>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<CertType | "cme" | "">("");
  const [sort, setSort] = useState<"yangi" | "eski" | "cme">("yangi");
  const [open, setOpen] = useState<Certificate | null>(null);
  const [mode, setMode] = useState<"full" | "qr">("full");
  const [qr, setQr] = useState("");

  useEffect(() => {
    const read = () => setTickets(loadSeminarTickets());
    read();
    window.addEventListener("sk-seminar-tickets", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("sk-seminar-tickets", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const earned = useMemo(() => certificatesFromTickets(tickets), [tickets]);
  const all = useMemo(() => [...earned, ...designCertificates], [earned]);
  const items = useMemo(() => {
    const query = norm(q.trim());
    const next = all.filter((item) => {
      if (type && type !== "cme" && item.type !== type) return false;
      if (!query) return true;
      return norm(`${item.title} ${item.teacher} ${item.holder} ${item.typeLabel}`).includes(query);
    });
    next.sort((a, b) => {
      if (sort === "cme" || type === "cme") return b.cme - a.cme;
      if (sort === "eski") return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });
    return next;
  }, [all, q, sort, type]);

  const cme = 320 + earned.reduce((sum, item) => sum + item.cme, 0);

  useEffect(() => {
    if (!open) return;
    void QRCode.toDataURL(`stoma://sertifikat/${open.id}/${open.holder}`, { width: 320, margin: 1 }).then(setQr);
  }, [open]);

  return (
    <MarketFrame
      active="certs"
      headerLinks={headerLinks}
      headerActive="talim"
      searchPlaceholder="Kurs, seminar yoki mavzu bo‘yicha qidiring..."
      headerQuery={q}
      onHeaderQuery={setQ}
      sideMain={sideMain}
      sideSecond={sideSecond}
      sideLabel="Ta’lim"
      promoTitle="Bilimingiz har doim siz bilan!"
      promoText="Barcha sertifikatlaringiz bir joyda"
      promoCta="Sertifikatlaringiz"
      promoImage="/img/hub/ribbon.svg"
      promoIcon={<Award className="i" />}
      onPromo={() => {
        setQ("");
        setType("");
        setSort("yangi");
      }}
    >
      <div data-testid="certs-desktop">
        <div className="crm-head">
          <div>
            <h1>Sertifikatlar</h1>
            <p>Siz olgan barcha sertifikatlar va yutuqlar</p>
          </div>
          <div className="cert-stats">
            <div className="brd-badge"><span className="medal"><Award className="i" /></span><span><b>{12 + earned.length}</b><span>ta sertifikat</span></span></div>
            <div className="brd-badge"><span className="medal"><Star className="i" /></span><span><b>{cme}</b><span>CME ballari</span></span></div>
            <div className="brd-badge"><span className="medal"><Clock className="i" /></span><span><b>4</b><span>ta kurs yakunlangan</span></span></div>
          </div>
        </div>
        <div className="crm-tools">
          <div className="cert-chips" role="tablist">
            <button type="button" className={type === "" ? "on" : undefined} data-testid="cert-all" onClick={() => setType("")}>Barchasi</button>
            {certTypes.map((item) => (
              <button key={item.id} type="button" className={type === item.id ? "on" : undefined} data-testid={`cert-${item.id}`} onClick={() => setType(item.id)}>{item.label}</button>
            ))}
          </div>
          <label className="crm-search" style={{ flex: "0 0 calc(16 * var(--u))" }}>
            <Search className="i" />
            <input data-testid="cert-search" aria-label="Sertifikat qidirish" value={q} placeholder="Sertifikat nomi yoki tashkilot bo‘yicha..." onChange={(event) => setQ(event.target.value)} />
          </label>
          <label className="crm-select">
            <select data-testid="cert-sort" aria-label="Saralash" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
              <option value="yangi">Yangidan eskiga</option>
              <option value="eski">Eskidan yangiga</option>
              <option value="cme">CME bo‘yicha</option>
            </select>
            <ChevronRight className="i" style={{ transform: "rotate(90deg)" }} />
          </label>
        </div>
        {items.length === 0 ? (
          <div className="crm-empty" data-testid="cert-empty"><p>Sertifikat topilmadi</p></div>
        ) : (
          <div className="cert-grid">
            {items.map((item) => (
              <article key={item.id} className="cert-card" data-testid="cert-card">
                <div className={`cert-paper ${item.theme}`}>
                  <b className="brand">STOMAHUB</b>
                  <h3>SERTIFIKAT</h3>
                  <p className="who">{item.holder}</p>
                  <p className="course">{item.title}</p>
                  <p className="sub">{item.teacher} · {item.place} · {item.dateLabel}</p>
                  <span className="cert-cme">{item.cme} CME</span>
                  <i className="cert-seal" />
                </div>
                <h2>{item.title}</h2>
                <p className="meta">{item.typeLabel} · {item.teacher}</p>
                <p className="when"><span><CalendarDays className="i" style={{ width: "1em" }} /> {item.dateLabel}</span><span><MapPin className="i" style={{ width: "1em" }} /> {item.place}</span></p>
                <div className="cert-ops">
                  <button type="button" data-testid={`cert-view-${item.id}`} onClick={() => { setMode("full"); setOpen(item); }}><Eye className="i" /> Ko‘rish</button>
                  <button type="button" data-testid={`cert-down-${item.id}`} onClick={() => void downloadPng(item)}><Download className="i" /> Yuklab olish</button>
                  <button type="button" data-testid={`cert-qr-${item.id}`} aria-label="QR" onClick={() => { setMode("qr"); setOpen(item); }}><QrCode className="i" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
        {open ? (
          <div className="crm-modal" role="dialog" aria-label="Sertifikat" data-testid="cert-modal">
            <div className="crm-dialog cert-view">
              <header>
                <b>{open.title}</b>
                <button type="button" onClick={() => setOpen(null)} aria-label="Yopish">×</button>
              </header>
              {mode === "full" ? (
              <div className={`cert-paper ${open.theme}`}>
                <b className="brand">STOMAHUB</b>
                <h3>SERTIFIKAT</h3>
                <p className="who">{open.holder}</p>
                <p className="course">{open.title}</p>
                <p className="sub">{open.typeLabel} · {open.teacher}</p>
                <p className="sub">{open.dateLabel} · {open.place} · {open.cme} CME</p>
                <span className="cert-cme">{open.cme} CME</span>
                <i className="cert-seal" />
              </div>
              ) : null}
              {mode === "qr" ? <div className="cert-qr">{qr ? <img src={qr} alt="QR kod" data-testid="cert-qr-img" /> : null}<p>{open.holder}</p></div> : null}
              <div className="row">
                <button type="button" className="go" onClick={() => void downloadPng(open)}>Yuklab olish</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </MarketFrame>
  );
}
