"use client";
/* eslint-disable @next/next/no-img-element -- ticket thumbs are fixed-size */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileBadge,
  MapPin,
  QrCode,
  Ticket,
  XCircle,
} from "lucide-react";
import { AttendanceActions } from "@/components/seminar-status";
import { useSeminarRegs } from "@/components/seminar-provider";
import { getSeminar, seminarDate, seminarHref, specialtyLabels, type Seminar } from "@/data/seminars";
import { tashkentDateParts } from "@/lib/tashkent-date";
import { loadSeminarTickets, type SeminarTicket } from "@/lib/seminar-tickets";
import type { SeminarRegistration } from "@/lib/seminar-registrations";
import { formatUzDate } from "@/lib/format";
import "./seminarlarim-mobile.css";

type Filter = "all" | "upcoming" | "past" | "cancelled";
type Phase = "pending" | "confirmed" | "upcoming" | "past" | "cancelled";

const FILTERS: { id: Filter; label: string; icon: typeof Clock3 }[] = [
  { id: "all", label: "Barchasi", icon: Ticket },
  { id: "upcoming", label: "Yaqinlashib kelayotgan", icon: Clock3 },
  { id: "past", label: "O‘tkazilgan", icon: CheckCircle2 },
  { id: "cancelled", label: "Bekor qilingan", icon: XCircle },
];

const PHASE: Record<Phase, { label: string; tone: string; icon: typeof Clock3 }> = {
  pending: { label: "Tasdiqlash kutilmoqda", tone: "wait", icon: Clock3 },
  confirmed: { label: "Tasdiqlangan", tone: "ok", icon: CheckCircle2 },
  upcoming: { label: "Yaqinlashib kelmoqda", tone: "wait", icon: Clock3 },
  past: { label: "O‘tkazilgan", tone: "ok", icon: CheckCircle2 },
  cancelled: { label: "Bekor qilingan", tone: "no", icon: XCircle },
};

/** Days until the seminar's (last) day in Tashkent time; null when the date is not announced. */
function daysUntil(seminar: Seminar | undefined, today: string) {
  if (!seminar || seminar.dateTbd) return null;
  const end = seminar.dateEnd || seminar.date;
  return Math.round((Date.parse(end) - Date.parse(today)) / 86_400_000);
}

function phaseOf(reg: SeminarRegistration, seminar: Seminar | undefined, today: string): Phase {
  if (reg.status === "cancelled") return "cancelled";
  if (reg.status === "attended") return "past";
  const left = daysUntil(seminar, today);
  if (left != null && left < 0) return "past";
  if (reg.status === "pending") return "pending";
  return left != null && left <= 14 ? "upcoming" : "confirmed";
}

function matches(phase: Phase, filter: Filter) {
  if (filter === "upcoming") return phase === "pending" || phase === "confirmed" || phase === "upcoming";
  if (filter === "past") return phase === "past";
  if (filter === "cancelled") return phase === "cancelled";
  return true;
}

export function SeminarlarimMobile() {
  const { registrations, ready, auth } = useSeminarRegs();
  const [tickets, setTickets] = useState<SeminarTicket[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState("");
  const today = tashkentDateParts().iso;

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

  // Upcoming tickets first (soonest on top), then past and cancelled ones (latest on top).
  const rows = registrations
    .map((reg) => {
      const seminar = getSeminar(reg.seminarId);
      return { reg, seminar, ticket: tickets.find((item) => item.seminarId === reg.seminarId), phase: phaseOf(reg, seminar, today), date: seminar?.date ?? reg.createdAt };
    })
    .sort((a, b) => {
      const doneA = a.phase === "past" || a.phase === "cancelled";
      const doneB = b.phase === "past" || b.phase === "cancelled";
      if (doneA !== doneB) return doneA ? 1 : -1;
      return doneA ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
    });
  const shown = rows.filter((row) => matches(row.phase, filter));

  return (
    <div className="sx lg:hidden" data-testid="seminarlarim">
      <h1>Seminar chiptalarim</h1>
      <p className="sx-lead">Siz ro‘yxatdan o‘tgan seminar chiptalari</p>

      <div className="sx-chips" role="tablist">
        {FILTERS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? "on" : ""} onClick={() => setFilter(item.id)}>
              <Icon /> {item.label}
            </button>
          );
        })}
      </div>

      {ready && !auth ? (
        <div className="sx-empty">
          <p>Chiptalarni ko‘rish uchun tizimga kiring</p>
          <Link href="/kirish?next=/seminarlar/yozuvlarim">Kirish</Link>
        </div>
      ) : !ready ? (
        <div className="sx-empty"><p>Yuklanmoqda…</p></div>
      ) : shown.length === 0 ? (
        <div className="sx-empty">
          <p>{rows.length === 0 ? "Hali seminar yo‘q" : "Bu bo‘limda chipta yo‘q"}</p>
          {rows.length === 0 ? <Link href="/seminarlar">Seminar tanlash</Link> : null}
        </div>
      ) : (
        <ul className="sx-list">
          {shown.map(({ reg, seminar, ticket, phase }) => {
            const look = PHASE[phase];
            const Icon = look.icon;
            const title = seminar?.title ?? reg.seminarTitle ?? ticket?.title ?? "Seminar";
            const image = seminar?.image || ticket?.image || "";
            const when = seminar ? seminarDate(seminar).long : ticket?.when || formatUzDate(reg.createdAt.slice(0, 10)).long;
            const place = seminar ? [seminar.city, seminar.venue].filter(Boolean).join(", ") : ticket?.place;
            const sub = seminar?.badge || seminar?.organizer || seminar?.speaker || "";
            const tags = seminar ? [specialtyLabels[seminar.specialty], ...(seminar.tags ?? [])].filter(Boolean).slice(0, 3) : [];
            const href = seminar ? seminarHref(seminar.id) : "";
            const expanded = open === reg.id;
            return (
              <li key={reg.id} className="sx-card" data-testid="seminar-ticket">
                <div className="sx-main">
                  <div className="sx-photo">{image ? <img src={image} alt="" /> : <CalendarDays />}</div>
                  <div className="sx-body">
                    <div className="sx-top">
                      <span className={`sx-status ${look.tone}`}><Icon /> {look.label}</span>
                      {href ? <Link href={href} className="sx-go" aria-label="Seminar sahifasi"><ChevronRight /></Link> : null}
                    </div>
                    <p className="sx-date"><CalendarDays /> {when}</p>
                    <b className="sx-title">{title}</b>
                    {sub ? <p className="sx-sub">{sub}</p> : null}
                    {place ? <p className="sx-place"><MapPin /> {place}</p> : null}
                    {tags.length ? <div className="sx-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
                  </div>
                </div>
                {phase !== "cancelled" ? (
                  <div className="sx-foot">
                    <i className="sx-ticket"><Ticket /></i>
                    <span className="sx-copy"><b>Chipta</b><small>{reg.ticketCode ? `${reg.ticketCode} · QR kod bilan kirish` : "QR kod bilan kirish"}</small></span>
                    {reg.status === "attended" ? (
                      <Link href="/sertifikatlar" className="sx-btn"><FileBadge /> Sertifikat</Link>
                    ) : (
                      <Link href={`/seminarlar/yozuvlarim/${reg.id}`} className="sx-btn"><QrCode /> QR kod</Link>
                    )}
                    <button type="button" className="sx-btn fill" aria-expanded={expanded} onClick={() => setOpen(expanded ? "" : reg.id)}>Batafsil</button>
                  </div>
                ) : (
                  <p className="sx-note">Joy bo‘shatildi. Xuddi shu seminarga qayta yozilishingiz mumkin.</p>
                )}
                {expanded ? (
                  <div className="sx-detail">
                    <p>{reg.name} · +998 {reg.phone}{reg.clinic ? ` · ${reg.clinic}` : ""}</p>
                    {seminar?.time ? <p>Boshlanish: {seminar.time}{seminar.timeEnd ? ` – ${seminar.timeEnd}` : ""}</p> : null}
                    {reg.status === "pending" ? <AttendanceActions registration={reg} compact /> : null}
                    {href ? <Link href={href}>Seminar sahifasi</Link> : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
