"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { CalendarDays, CheckCircle2, ChevronLeft, Clock, Download, FileText, IdCard, Info, MapPin, QrCode, Share2, ShieldCheck, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AttendanceActions, PaymentBadge } from "@/components/seminar-status";
import { useSeminarRegs } from "@/components/seminar-provider";
import { getSeminar, seminarHref, specialtyLabels } from "@/data/seminars";
import { formatUzDate } from "@/lib/format";
import { downloadPdf } from "@/lib/simple-pdf";
import "./ticket.css";
import { cn } from "@/lib/utils";
import { fromServer, type SeminarRegistration, type ServerRegistration } from "@/lib/seminar-registrations";
import { seminarDate } from "@/data/seminars";

type State = { kind: "loading" } | { kind: "auth" } | { kind: "missing" } | { kind: "ok"; reg: SeminarRegistration };

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [qr, setQr] = useState("");
  // Re-render once the seminar catalog has loaded, so getSeminar() below finds the event.
  useSeminarRegs();

  useEffect(() => {
    let alive = true;
    fetch(`/api/seminars/registrations/${id}`, { cache: "no-store", credentials: "same-origin" })
      .then(async (res) => {
        const j = (await res.json().catch(() => ({}))) as { ok?: boolean; registration?: ServerRegistration };
        if (!alive) return;
        if (res.status === 401) setState({ kind: "auth" });
        else if (j.ok && j.registration) setState({ kind: "ok", reg: fromServer(j.registration) });
        else setState({ kind: "missing" });
      })
      .catch(() => alive && setState({ kind: "missing" }));
    return () => {
      alive = false;
    };
  }, [id]);

  const code = state.kind === "ok" ? state.reg.ticketCode : "";
  useEffect(() => {
    if (!code) return;
    QRCode.toDataURL(code, { margin: 1, width: 440, errorCorrectionLevel: "M", color: { dark: "#0B1F4D", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [code]);

  const back = (
    <p className="mb-3 text-[13px]">
      <Link href="/seminarlar/yozuvlarim" className="inline-flex items-center gap-1 text-[#0066FF] hover:underline">
        <ChevronLeft className="size-4" />
        Mening yozuvlarim
      </Link>
    </p>
  );

  if (state.kind === "loading") return <div className="mx-auto max-w-md">{back}<div className="h-72 animate-pulse rounded-[20px] bg-[#f1f3f8]" /></div>;
  if (state.kind === "auth" || state.kind === "missing") {
    return (
      <div className="mx-auto max-w-md">
        {back}
        <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-14 text-center">
          <p className="text-[16px] font-semibold text-[#1a1d26]">{state.kind === "auth" ? "Chiptani ko‘rish uchun tizimga kiring" : "Chipta topilmadi"}</p>
          <p className="mt-1 text-sm text-[#8b93a7]">Chipta faqat o‘z egasiga ko‘rinadi.</p>
          <Link
            href={state.kind === "auth" ? `/kirish?next=${encodeURIComponent(`/seminarlar/yozuvlarim/${id}`)}` : "/seminarlar/yozuvlarim"}
            className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}
          >
            {state.kind === "auth" ? "Kirish" : "Mening yozuvlarim"}
          </Link>
        </div>
      </div>
    );
  }

  const reg = state.reg;
  const seminar = getSeminar(reg.seminarId);
  const date = seminar ? seminarDate(seminar) : null;
  const cancelled = reg.status === "cancelled";
  const title = seminar?.title ?? reg.seminarTitle ?? "Seminar";
  const place = seminar ? (seminar.city === "Online" ? "Onlayn" : [seminar.city, seminar.venue].filter(Boolean).join(", ")) : "";
  const time = seminar?.time ? `${seminar.time}${seminar.timeEnd ? ` – ${seminar.timeEnd}` : ""}` : "";
  const tags = seminar ? [specialtyLabels[seminar.specialty], ...(seminar.tags ?? [])].filter(Boolean).slice(0, 3) : [];
  const issued = formatUzDate(reg.createdAt.slice(0, 10));
  const look = cancelled
    ? { label: "Bekor qilingan", tone: "no", icon: XCircle }
    : reg.status === "attended"
      ? { label: "Qatnashgan", tone: "ok", icon: CheckCircle2 }
      : reg.status === "confirmed"
        ? { label: "Tasdiqlangan", tone: "ok", icon: CheckCircle2 }
        : { label: "Tasdiqlash kutilmoqda", tone: "wait", icon: Clock };
  const StatusIcon = look.icon;

  function savePdf() {
    downloadPdf(`chipta-${reg.ticketCode}.pdf`, [
      "StomaHub - Seminar chiptasi",
      "",
      title,
      date ? `Sana: ${date.long}` : "",
      time ? `Vaqt: ${time}` : "",
      place ? `Joy: ${place}` : "",
      "",
      `Ishtirokchi: ${reg.name}`,
      `Telefon: +998 ${reg.phone}`,
      `Chipta kodi: ${reg.ticketCode}`,
      `Holat: ${look.label}`,
      `Berilgan sana: ${issued.long}`,
    ].filter((line, index, all) => line || all[index - 1]));
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${title} — chipta`, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="tk">
      <Link href="/seminarlar/yozuvlarim" className="tk-back"><ChevronLeft /> Chiptalarim</Link>
      <h1>Seminar chiptasi</h1>
      <p className="tk-lead">Seminarga kirish uchun ushbu chiptani ko‘rsating</p>

      <article className={cancelled ? "tk-ticket off" : "tk-ticket"} data-testid="seminar-ticket-page">
        <div className="tk-top">
          <div className="tk-photo">
            {/* eslint-disable-next-line @next/next/no-img-element -- seminar covers come from organizer uploads */}
            {seminar?.image ? <img src={seminar.image} alt="" /> : <CalendarDays />}
          </div>
          <div className="tk-info">
            <span className={`tk-status ${look.tone}`}><StatusIcon /> {look.label}</span>
            <h2>{title}</h2>
            {seminar?.badge || seminar?.organizer ? <p className="tk-sub">{seminar.badge || seminar.organizer}</p> : null}
            {date ? <p className="tk-row"><CalendarDays /> {date.long}</p> : null}
            {time ? <p className="tk-row"><Clock /> {time}</p> : null}
            {place ? <p className="tk-row"><MapPin /> {place}</p> : null}
            {tags.length ? <div className="tk-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
          </div>
        </div>
        <div className="tk-cut" aria-hidden />
        <div className="tk-bottom">
          <dl>
            <dt>Ishtirokchi</dt><dd>{reg.name}</dd>
            <dt>To‘lov</dt><dd><PaymentBadge reg={reg} /></dd>
            <dt>Chipta raqami</dt><dd className="tk-code">{reg.ticketCode}</dd>
            <dt>Sana</dt><dd>{issued.long}</dd>
          </dl>
          <div className="tk-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt={`Chipta QR: ${reg.ticketCode}`} /> : <span>QR tayyorlanmoqda…</span>}
            <p><FileText /> Seminarga kirish uchun QR kodni ko‘rsating</p>
          </div>
        </div>
      </article>

      <section className="tk-note">
        <h3><Info /> Muhim ma’lumotlar</h3>
        <ul>
          {cancelled ? <li><XCircle /> Bu chipta bekor qilingan va kirish uchun yaroqsiz.</li> : <li><QrCode /> Seminarga kirishda ushbu QR kodni ko‘rsating.</li>}
          <li><IdCard /> Chipta faqat sizning nomingizga rasmiylashtirilgan.</li>
          <li><Clock /> Seminar boshlanishidan kamida 15 daqiqa oldin keling.</li>
          {place ? <li><MapPin /> Manzil: {place}.</li> : null}
          {reg.paymentStatus === "awaiting" && !cancelled ? <li><ShieldCheck /> To‘lov holatini tashkilotchi belgilaydi.</li> : null}
        </ul>
      </section>

      {reg.status === "pending" ? <AttendanceActions registration={reg} compact /> : null}
      <button type="button" className="tk-pdf" onClick={savePdf}><Download /> PDF sifatida saqlash</button>
      <button type="button" className="tk-share" onClick={() => void share()}><Share2 /> Ulashish</button>
      {seminar ? <Link href={seminarHref(seminar.id)} className="tk-link">Seminar sahifasi</Link> : null}
    </div>
  );
}
