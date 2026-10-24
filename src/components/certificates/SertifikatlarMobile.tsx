"use client";
/* eslint-disable @next/next/no-img-element -- QR codes are data URLs */

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Award, CalendarDays, Clock, Download, Eye, GraduationCap, Share2, Star, X } from "lucide-react";
import { useDoctorProfile } from "@/components/doctor-profile-provider";
import { useSeminarRegs } from "@/components/seminar-provider";
import { certificatesFromTickets } from "@/data/certificates";
import { getSeminar, seminarDate } from "@/data/seminars";
import { fetchCourses } from "@/lib/live-content";
import { loadSeminarTickets } from "@/lib/seminar-tickets";
import "./sertifikatlar-mobile.css";

type Card = { id: string; title: string; type: "seminar" | "onlayn" | "kurs"; typeLabel: string; date: string; cme: number; holder: string; tone: "teal" | "sand" };
type Tab = "all" | Card["type"];
const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "seminar", label: "Seminarlar" },
  { id: "onlayn", label: "Onlayn darslar" },
  { id: "kurs", label: "Kurslar" },
];

/** Default CME hours for an attended seminar without its own value. */
const SEMINAR_CME = 8;

function QrBox({ id }: { id: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    void QRCode.toDataURL(`${window.location.origin}/sertifikatlar#${id}`, { margin: 0, width: 160, color: { dark: "#111827", light: "#ffffff" } }).then(setSrc).catch(() => setSrc(""));
  }, [id]);
  return <span className="sc-qr">{src ? <img src={src} alt="Sertifikat QR" /> : null}<small>QR kodni skaner qiling</small></span>;
}

function Paper({ card, big = false }: { card: Card; big?: boolean }) {
  return (
    <span className={`sc-paper ${card.tone}${big ? " big" : ""}`} aria-hidden>
      <span className="sc-brand">STOMAHUB</span>
      <b>SERTIFIKAT</b>
      <span className="sc-holder">{card.holder}</span>
      <span className="sc-lines" />
      <span className="sc-seal"><Award /></span>
    </span>
  );
}

/** Phone /sertifikatlar (mock "sertifikatlar telefon"). */
export function SertifikatlarMobile() {
  const { profile } = useDoctorProfile();
  const { registrations } = useSeminarRegs();
  const [tickets, setTickets] = useState(() => certificatesFromTickets([]));
  const [coursesDone, setCoursesDone] = useState(0);
  const [tab, setTab] = useState<Tab>("all");
  const [open, setOpen] = useState<Card | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const read = () => setTickets(certificatesFromTickets(loadSeminarTickets()));
    read();
    window.addEventListener("sk-seminar-tickets", read);
    void fetchCourses().then((rows) => setCoursesDone(rows.filter((row) => row.enrolled && row.progress >= 100).length));
    return () => window.removeEventListener("sk-seminar-tickets", read);
  }, []);

  const holder = profile?.fullName || "Shifokor";
  // Attended seminars (server) first, then locally saved tickets for other seminars.
  const attended: Card[] = registrations
    .filter((reg) => reg.status === "attended")
    .map((reg, index) => {
      const seminar = getSeminar(reg.seminarId);
      return {
        id: `reg-${reg.id}`,
        title: seminar?.title ?? reg.seminarTitle ?? "Seminar",
        type: "seminar",
        typeLabel: "Seminar",
        date: seminar ? seminarDate(seminar).long : (reg.attendedAt ?? reg.createdAt).slice(0, 10),
        cme: SEMINAR_CME,
        holder: reg.name || holder,
        tone: index % 3 === 2 ? "sand" : "teal",
      };
    });
  const seen = new Set(registrations.filter((reg) => reg.status === "attended").map((reg) => reg.seminarId));
  const local: Card[] = tickets
    .filter((item) => !seen.has(item.id.replace(/^ticket-/, "")))
    .map((item, index) => ({ id: item.id, title: item.title, type: "seminar", typeLabel: "Seminar", date: item.dateLabel, cme: item.cme, holder: item.holder || holder, tone: (attended.length + index) % 3 === 2 ? "sand" : "teal" }));
  const all = [...attended, ...local];
  const hours = all.reduce((sum, item) => sum + item.cme, 0);
  const shown = tab === "all" ? all : all.filter((item) => item.type === tab);
  const count = (id: Tab) => (id === "all" ? all.length : all.filter((item) => item.type === id).length);

  function download(card: Card) {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 820;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1200, 820);
    ctx.strokeStyle = card.tone === "sand" ? "#c79a52" : "#0F766E";
    ctx.lineWidth = 18;
    ctx.strokeRect(30, 30, 1140, 760);
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.font = "700 30px sans-serif";
    ctx.fillText("STOMAHUB", 600, 130);
    ctx.font = "800 72px serif";
    ctx.fillText("SERTIFIKAT", 600, 240);
    ctx.font = "600 40px sans-serif";
    ctx.fillText(card.holder, 600, 340);
    ctx.font = "500 32px sans-serif";
    ctx.fillText(card.title, 600, 440);
    ctx.fillText(`${card.typeLabel} · ${card.date} · ${card.cme} soat (CME)`, 600, 500);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `sertifikat-${card.id}.png`;
    link.click();
  }

  async function share(card: Card) {
    const url = `${window.location.origin}/sertifikatlar#${card.id}`;
    try {
      if (navigator.share) await navigator.share({ title: card.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setNote("Havola nusxalandi");
        window.setTimeout(() => setNote(""), 1600);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="sc lg:hidden" data-testid="phone-sertifikatlar">
      <h1>Sertifikatlar</h1>
      <p className="sc-lead">Seminarlar, onlayn darslar va kurslar bo‘yicha sertifikatlaringiz</p>

      <section className="sc-stat">
        <span className="sc-medal"><Award /></span>
        <div className="sc-hours">
          <small>Jami CME soatlar</small>
          <b>{hours} <span>soat</span></b>
          <p>Professional rivojlanishingiz uchun rahmat!</p>
        </div>
        <ul>
          <li><GraduationCap /><span><b>{all.length}</b><small>Sertifikatlar soni</small></span></li>
          <li><Clock /><span><b>{hours}</b><small>CME soat (jami)</small></span></li>
          <li><Star /><span><b data-testid="cert-courses">{coursesDone}</b><small>Tugallangan kurslar</small></span></li>
        </ul>
      </section>

      <div className="sc-tabs" role="tablist">
        {TABS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "on" : ""} onClick={() => setTab(item.id)}>
            {item.label} ({count(item.id)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="sc-empty">{all.length === 0 ? "Hali sertifikat yo‘q. Seminarda qatnashganingiz tasdiqlangach shu yerda paydo bo‘ladi." : "Bu bo‘limda sertifikat yo‘q."}</p>
      ) : (
        <ul className="sc-list">
          {shown.map((card) => (
            <li key={card.id} id={card.id} className="sc-card">
              <div className="sc-top">
                <Paper card={card} />
                <div className="sc-info">
                  <b>{card.title}</b>
                  <span className="sc-type">{card.typeLabel}</span>
                  <p><CalendarDays /> {card.date}</p>
                  <p><Clock /> {card.cme} soat (CME)</p>
                </div>
                <QrBox id={card.id} />
              </div>
              <div className="sc-actions">
                <button type="button" onClick={() => setOpen(card)}><Eye /> Ko‘rish</button>
                <button type="button" onClick={() => download(card)}><Download /> Yuklab olish</button>
                <button type="button" onClick={() => void share(card)}><Share2 /> Ulashish</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="sc-view" role="dialog" aria-label={open.title}>
          <button type="button" className="sc-close" aria-label="Yopish" onClick={() => setOpen(null)}><X /></button>
          <Paper card={open} big />
          <p>{open.title} · {open.date} · {open.cme} soat (CME)</p>
          <QrBox id={open.id} />
        </div>
      ) : null}
      {note ? <div className="sc-note">{note}</div> : null}
    </div>
  );
}
