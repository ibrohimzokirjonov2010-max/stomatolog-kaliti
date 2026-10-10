"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { CalendarDays, ChevronLeft, MapPin, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PaymentBadge, SeminarStatusBadge } from "@/components/seminar-status";
import { getSeminar, seminarHref } from "@/data/seminars";
import { cn } from "@/lib/utils";
import { fromServer, type SeminarRegistration, type ServerRegistration } from "@/lib/seminar-registrations";
import { seminarDate } from "@/data/seminars";

type State = { kind: "loading" } | { kind: "auth" } | { kind: "missing" } | { kind: "ok"; reg: SeminarRegistration };

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [qr, setQr] = useState("");

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

  return (
    <div className="mx-auto max-w-md">
      {back}
      <article className="overflow-hidden rounded-[22px] border border-[#dbe7ff] bg-white shadow-[0_10px_30px_rgba(0,60,160,0.10)]">
        <div className="bg-gradient-to-br from-[#0066FF] to-[#0B1F4D] px-5 py-4 text-white">
          <p className="text-[11px] font-bold tracking-[0.12em] text-white/70 uppercase">Shaxsiy chipta</p>
          <h1 className="mt-1 text-[17px] leading-snug font-bold">{seminar?.title ?? reg.seminarTitle ?? reg.seminarId}</h1>
        </div>
        <div className="space-y-3 px-5 py-5">
          {seminar && date ? (
            <div className="space-y-1.5 text-[13px] text-[#4b5568]">
              <p className="flex items-center gap-2">
                <CalendarDays className="size-4 text-[#0066FF]" />
                {date.when}, {seminar.time}–{seminar.timeEnd}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-[#0066FF]" />
                {seminar.city === "Online" ? "Onlayn" : `${seminar.city}, ${seminar.venue}`}
              </p>
            </div>
          ) : null}

          <div className={cn("mx-auto grid size-[220px] place-items-center rounded-2xl border border-[#e6eaf2] bg-white p-2", cancelled && "opacity-30")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt={`Chipta QR: ${reg.ticketCode}`} className="size-full" /> : <span className="text-[12px] text-[#8b93a7]">QR tayyorlanmoqda…</span>}
          </div>
          <p className="text-center font-mono text-[22px] font-bold tracking-[0.08em] text-[#0B1F4D]">{reg.ticketCode}</p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <SeminarStatusBadge status={reg.status} />
            <PaymentBadge reg={reg} />
          </div>

          <dl className="divide-y divide-[#f1f3f8] rounded-xl bg-[#f7f9fc] px-3.5 text-[13px]">
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-[#8b93a7]">Chipta egasi</dt>
              <dd className="text-right font-semibold text-[#1a1d26]">{reg.name}</dd>
            </div>
            <div className="flex justify-between gap-3 py-2">
              <dt className="text-[#8b93a7]">Telefon</dt>
              <dd className="font-semibold text-[#1a1d26]">+998 {reg.phone}</dd>
            </div>
            {reg.clinic ? (
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-[#8b93a7]">Klinika</dt>
                <dd className="text-right font-semibold text-[#1a1d26]">{reg.clinic}</dd>
              </div>
            ) : null}
            {reg.price > 0 ? (
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-[#8b93a7]">Narx</dt>
                <dd className="font-semibold text-[#1a1d26]">{reg.price.toLocaleString("ru-RU").replace(/,/g, " ")} so‘m</dd>
              </div>
            ) : null}
          </dl>

          <p className="flex items-start gap-2 text-[12px] leading-snug text-[#6b7488]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0066FF]" />
            {cancelled
              ? "Bu chipta bekor qilingan va kirish uchun yaroqsiz."
              : reg.status === "attended"
                ? "Kirish qayd etilgan."
                : "Kirishda shu kodni (yoki QR ni) tashkilotchiga ko‘rsating. Chipta faqat sizga tegishli — uni boshqalarga bermang."}
            {reg.paymentStatus === "awaiting" && !cancelled ? " To‘lov hozircha namuna: onlayn to‘lov olinmaydi, holatni tashkilotchi belgilaydi." : ""}
          </p>

          {seminar ? (
            <Link href={seminarHref(seminar.id)} className={cn(buttonVariants({ variant: "outline" }), "h-11 w-full !rounded-xl")}>
              Seminar sahifasi
            </Link>
          ) : null}
        </div>
      </article>
    </div>
  );
}
