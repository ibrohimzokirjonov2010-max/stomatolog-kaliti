"use client";

import { useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  Heart,
  Link2,
  MapPin,
  MessageCircle,
  Scissors,
  Send,
  Share2,
  Star,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useSeminarRegs } from "@/components/seminar-provider";
import {
  getSeminarPastGallery,
  getSeminarSpeakers,
  isSeminarUpcoming,
  seminarDayMonth,
  seminarPriceText,
  seminars,
  sortedSeminars,
  specialtyLabels,
  type Seminar,
} from "@/data/seminars";
import { formatMoney } from "@/lib/format";
import { discountPercent, mapsHref, seminarTags } from "@/lib/seminar-mobile";
import { toggleSavedSeminar, useSavedSeminars } from "@/lib/seminar-saved";
import type { SeminarRegistration } from "@/lib/seminar-registrations";
import { SeminarPublicLinks } from "@/components/seminar-links";
import { cn } from "@/lib/utils";
import { seminarDate } from "@/data/seminars";

const BLUE = "#0F766E";

/** Feature cards are "confirmed" only when the organizer's own text (title/description/tags/program/learnings) mentions them. */
const FEATURES: { icon: LucideIcon; title: string; re: RegExp }[] = [
  { icon: FileText, title: "Nazariya va protokollar", re: /nazariy|protokol|ma.?ruza|lecture|nazariya/i },
  { icon: Scissors, title: "Jonli jarrohlik (Live-surgery)", re: /live|jonli|surgery|jarroh/i },
  { icon: ClipboardList, title: "Klinik case muhokama", re: /case|keys|klinik/i },
  { icon: GraduationCap, title: "Amaliy mashg‘ulot va savol-javob", re: /amaliy|hands|practic|mashg|savol/i },
  { icon: Award, title: "Sertifikat beriladi", re: /sertifikat|certificate/i },
];

function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[17px] font-bold tracking-tight text-[#1a1d26]">{children}</h2>
      {sub ? <p className="mt-0.5 text-[12.5px] text-[#8b93a7]">{sub}</p> : null}
    </div>
  );
}

function Soon({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#F0FDFA] bg-[#f8faff] px-4 py-5 text-[13px] text-[#6b7280]">
      {children}
    </div>
  );
}

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function SeminarDetailDesktop({
  seminar: s,
  left,
  mine,
  upcoming,
  formRef,
  children,
}: {
  seminar: Seminar;
  left: number;
  mine: SeminarRegistration | undefined;
  upcoming: boolean;
  formRef: React.RefObject<HTMLElement | null>;
  /** The existing registration form/ticket section (shared with mobile). */
  children: ReactNode;
}) {
  const { catalogVersion } = useSeminarRegs();
  const date = seminarDate(s);
  const online = s.city === "Online";
  const speakers = getSeminarSpeakers(s).filter((sp) => sp.name);
  const learnings = s.learnings ?? [];
  const gallery = getSeminarPastGallery(s);
  const program = s.program ?? [];
  const pct = discountPercent(s);
  const saved = useSavedSeminars().includes(s.id);
  const tags = seminarTags(s);
  const [toast, setToast] = useState("");
  const [slide, setSlide] = useState(0);

  const slides = useMemo(
    () => [...new Set([s.image, ...gallery.map((g) => g.image)].filter(Boolean))],
    [s.image, gallery],
  );
  const heroImg = slides[slide % Math.max(1, slides.length)] ?? "";

  const hay = [s.title, s.description, ...(s.tags ?? []), ...learnings, ...program.map((p) => p.title)].join(" ");
  const days = s.programDays ?? [];
  const featureCards: { icon: LucideIcon; title: string; sub?: string; on: boolean }[] = s.features?.length
    ? s.features.map((f, i) => ({ icon: [FileText, ClipboardList, GraduationCap, Award][i % 4], title: f.title, sub: f.subtitle, on: true }))
    : FEATURES.map((f) => ({ icon: f.icon, title: f.title, on: f.re.test(hay) }));
  const place = online ? "Online" : [s.venue, s.city].filter(Boolean).join(", ");

  const similar = useMemo(() => {
    const others = sortedSeminars().filter((x) => x.id !== s.id && isSeminarUpcoming(x));
    others.sort((a, b) => Number(b.specialty === s.specialty) - Number(a.specialty === s.specialty));
    return others.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id, s.specialty, catalogVersion, seminars.length]);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }
  const pageUrl = () => window.location.href.split("#")[0];
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      flash("Havola nusxalandi");
    } catch {
      flash("Nusxalab bo‘lmadi");
    }
  }
  async function shareNative() {
    const url = pageUrl();
    try {
      if (navigator.share) {
        await navigator.share({ title: s.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash("Havola nusxalandi");
    } catch {
      /* user cancelled the share sheet */
    }
  }
  function openShare(kind: "telegram" | "whatsapp" | "facebook" | "linkedin") {
    const url = encodeURIComponent(pageUrl());
    const text = encodeURIComponent(`${s.title} — StomaHub`);
    const href = {
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    }[kind];
    window.open(href, "_blank", "noopener,noreferrer");
  }
  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const showCta = upcoming && !mine && left > 0;

  const certificate = /sertifikat|certificate|cme/i.test(hay);
  const facts: { icon: LucideIcon; title: string; sub: string }[] = [
    { icon: CalendarDays, title: date.when, sub: `${weekday(s.date)}${weekday(s.date) ? ", " : ""}${s.time} – ${s.timeEnd}` },
    { icon: MapPin, title: online ? "Online" : s.city.replace(" shahri", ""), sub: s.venue || "Manzil tez orada" },
    { icon: Video, title: online ? "Online" : "Offline", sub: online ? "Jonli efirda qatnashish" : "Zalda qatnashish" },
    ...(certificate ? [{ icon: Award, title: tags.find((t) => /cme/i.test(t.label))?.label ?? "Sertifikat", sub: "Sertifikat beriladi" }] : []),
  ];
  const taken = s.seatsTotal > 0 ? Math.max(0, s.seatsTotal - left) : 0;
  const fill = s.seatsTotal > 0 ? Math.round((taken / s.seatsTotal) * 100) : 0;

  function addToCalendar() {
    const stamp = (d: string, t: string) => `${d.replace(/-/g, "")}T${(t || "00:00").replace(":", "")}00`;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//StomaHub//Seminar//UZ",
      "BEGIN:VEVENT",
      `UID:${s.id}@stomahub`,
      `DTSTART;TZID=Asia/Tashkent:${stamp(s.date, s.time)}`,
      `DTEND;TZID=Asia/Tashkent:${stamp(s.dateEnd || s.date, s.timeEnd)}`,
      `SUMMARY:${s.title}`,
      `LOCATION:${place}`,
      `URL:${pageUrl()}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.id}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    flash("Kalendar fayli yuklab olindi");
  }

  return (
    <div className="relative mx-auto max-w-[1180px] 2xl:max-w-[1360px]">
      <p className="mb-3 text-[12px] text-[#8b93a7]">
        <Link href="/seminarlar" className="hover:text-[#0F766E]">Seminarlar</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/seminarlar?cat=${s.specialty}`} className="text-[#0F766E] hover:underline">{specialtyLabels[s.specialty]}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#4b5568]">{s.title}</span>
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {/* hero banner: title over the seminar photo */}
          <section className="relative overflow-hidden rounded-[18px] border border-[#e3e9f5] bg-[#eef6f6]">
            {heroImg ? <Image key={heroImg} src={heroImg} alt="" fill priority className="object-cover object-right" sizes="(min-width:1536px) 980px, 780px" /> : null}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/10" aria-hidden />
            <div className="relative flex min-h-[230px] flex-col p-5 2xl:min-h-[260px]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F0FDFA] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#0F766E]">{specialtyLabels[s.specialty]}</span>
                  {!upcoming ? <span className="rounded-full bg-[#f1f3f8] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#6b7280]">{s.status === "closed" ? "Yopilgan" : "O‘tgan"}</span> : null}
                  {s.organizer ? <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-[11.5px] text-[#4b5568]"><Building2 className="size-3.5" /> {s.organizer}</span> : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label={saved ? "Saqlanganlardan olib tashlash" : "Saqlash"}
                    aria-pressed={saved}
                    onClick={() => {
                      toggleSavedSeminar(s.id);
                      flash(saved ? "Saqlanganlardan olib tashlandi" : "Saqlandi");
                    }}
                    className={cn("grid size-10 place-items-center rounded-xl border bg-white transition-colors", saved ? "border-[#0F766E] text-[#0F766E]" : "border-[#e3e9f5] text-[#4b5568] hover:border-[#CCFBF1]")}
                  >
                    <Heart className={cn("size-[18px]", saved && "fill-current")} />
                  </button>
                  <button type="button" aria-label="Ulashish" onClick={shareNative} className="grid size-10 place-items-center rounded-xl border border-[#e3e9f5] bg-white text-[#4b5568] hover:border-[#CCFBF1]">
                    <Share2 className="size-[18px]" />
                  </button>
                </div>
              </div>
              <h1 className="mt-2 max-w-[62%] text-[28px] leading-[1.12] font-extrabold tracking-tight text-[#0f1e3d] 2xl:text-[32px]">{s.title}</h1>
              {s.description ? <p className="mt-1.5 line-clamp-2 max-w-[60%] text-[13.5px] leading-snug text-[#4b5568]">{s.description}</p> : null}
              <div className={cn("mt-auto grid max-w-[70%] grid-cols-2 gap-2 pt-4 xl:max-w-[78%]", facts.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3")}>
                {facts.map(({ icon: Icon, title, sub }) => (
                  <div key={title + sub} className="flex items-center gap-2 rounded-xl border border-[#e3e9f5] bg-white/95 px-2.5 py-2 shadow-[0_2px_10px_rgba(15,30,61,0.05)]">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F0FDFA] text-[#0F766E]">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] leading-tight font-bold text-[#0f1e3d]">{title}</span>
                      <span className="mt-0.5 block truncate text-[10.5px] leading-snug text-[#0F766E]">{sub}</span>
                    </span>
                  </div>
                ))}

              </div>
            </div>
            {slides.length > 1 ? (
              <button
                type="button"
                onClick={() => setSlide((i) => (i + 1) % slides.length)}
                aria-label="Keyingi rasm"
                className="absolute right-3 bottom-3 rounded-full bg-black/45 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-sm"
              >
                {(slide % slides.length) + 1}/{slides.length}
              </button>
            ) : null}
          </section>

          {/* format strip */}
          {featureCards.some((f) => f.on) ? (
            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(5, featureCards.filter((f) => f.on).length)}, minmax(0, 1fr))` }}>
              {featureCards.filter((f) => f.on).slice(0, 5).map(({ icon: Icon, title }) => (
                <div key={title} className="flex items-center gap-2 rounded-xl border border-[#e3e9f5] bg-white px-3 py-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F0FDFA] text-[#0F766E]"><Icon className="size-4" /></span>
                  <span className="text-[12px] leading-tight font-semibold text-[#0f1e3d]">{title}</span>
                </div>
              ))}
            </div>
          ) : null}

          {/* about + speaker */}
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
              <SectionTitle>Seminar haqida</SectionTitle>
              {s.description ? <p className="text-[13.5px] leading-relaxed text-[#4b5568]">{s.description}</p> : <Soon>Seminar tavsifi tez orada qo‘shiladi.</Soon>}
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <div className="rounded-2xl bg-[#f6f9fc] p-4">
                  <p className="mb-2.5 text-[13.5px] font-bold text-[#111827]">Nimalarni o‘rganasiz?</p>
                  {learnings.length || days.length ? (
                    <ul className="space-y-2">
                      {(learnings.length ? learnings : days.flatMap((d) => d.topics)).slice(0, 8).map((item, i) => (
                        <li key={`${i}-${item}`} className="flex items-start gap-2 text-[12.5px] leading-snug text-[#111827]">
                          <CheckCircle2 className="mt-px size-4 shrink-0 text-[#0F766E]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[12.5px] text-[#6b7280]">O‘quv maqsadlari tez orada e’lon qilinadi.</p>
                  )}
                </div>
                <div className="rounded-2xl bg-[#f3fbf9] p-4">
                  <p className="mb-2.5 text-[13.5px] font-bold text-[#111827]">Seminar formati</p>
                  <ul className="space-y-2.5">
                    {featureCards.filter((f) => f.on).length === 0 ? <li className="text-[12.5px] text-[#6b7280]">Tafsilotlar tez orada.</li> : null}
                    {featureCards.filter((f) => f.on).map(({ icon: Icon, title, sub }) => (
                      <li key={title} className="flex items-start gap-2.5">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white text-[#0F766E]"><Icon className="size-4" /></span>
                        <span>
                          <span className="block text-[12.5px] font-semibold text-[#111827]">{title}</span>
                          {sub ? <span className="block text-[11px] text-[#6b7280]">{sub}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
              <SectionTitle>{speakers.length > 1 ? "Spikerlar" : "Spiker"}</SectionTitle>
              {speakers.length ? (
                <ul className="space-y-4">
                  {speakers.slice(0, 3).map((sp) => (
                    <li key={`${sp.name}-${sp.role}`} className="flex items-center gap-3">
                      {sp.photo ? (
                        <Image src={sp.photo} alt="" width={64} height={64} className="size-16 shrink-0 rounded-full object-cover ring-2 ring-[#F0FDFA]" />
                      ) : (
                        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[#F0FDFA] text-[17px] font-bold text-[#0F766E]">{initials(sp.name)}</span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-[14px] font-bold text-[#111827]">{sp.name}</span>
                        {sp.role ? <span className="block text-[12px] text-[#5d6e86]">{sp.role}</span> : null}
                        {sp.bio ? <span className="mt-1 block text-[11.5px] leading-snug text-[#6b7280]">{sp.bio}</span> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Soon>Ma’ruzachi aniqlanmoqda.</Soon>
              )}
            </section>
          </div>

          {/* program + venue */}
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_300px] gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
              <SectionTitle sub={date.when}>Dastur</SectionTitle>
              {days.length ? (
                <div className={cn("grid gap-4", days.length > 1 && "grid-cols-2")} data-testid="seminar-program">
                  {days.map((d) => (
                    <div key={d.label}>
                      <p className="mb-2 text-[13px] font-bold text-[#111827]">{d.label} <span className="font-semibold text-[#0F766E]">· {d.title}</span></p>
                      <ProgramList rows={d.schedule} />
                    </div>
                  ))}
                </div>
              ) : program.length ? (
                <ProgramList rows={program} />
              ) : (
                <Soon>Dastur tez orada. Seminar vaqti: {s.time} — {s.timeEnd}.</Soon>
              )}
            </section>
            <section className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
              <SectionTitle>Joylashuv</SectionTitle>
              <AddressCard s={s} online={online} />
              <ul className="mt-4 space-y-3 text-[13px]">
                <DetailRow icon={Clock} label="Vaqt">{s.time} - {s.timeEnd}</DetailRow>
                <DetailRow icon={Users} label="O‘rinlar">{s.seatsTbd ? "Joylar soni cheklangan" : s.seatsTotal > 0 ? `${left} / ${s.seatsTotal}` : "Tez orada"}</DetailRow>
              </ul>
            </section>
          </div>

          {gallery.length ? (
            <section className="mt-4 rounded-[18px] border border-[#e3e9f5] bg-white p-5">
              <SectionTitle>Seminar lavhalari</SectionTitle>
              <div className="grid grid-cols-4 gap-3">
                {gallery.slice(0, 4).map((g) => (
                  <figure key={`${g.image}-${g.caption}`} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                    <Image src={g.image} alt={g.caption ?? ""} fill className="object-cover" sizes="240px" />
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {/* registration (existing flow) */}
          <div className="mt-6 pb-4">{children}</div>
        </div>

        {/* right column */}
        <aside className="min-w-0 space-y-4 self-start xl:sticky xl:top-0">
          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5 shadow-[0_4px_16px_rgba(17, 24, 39, 0.05)]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[16px] font-extrabold text-[#111827]">Ro‘yxatdan o‘tish</p>
              {upcoming && s.seatsTotal > 0 && !s.seatsTbd ? (
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", left > 0 ? "bg-[#fee2e2] text-[#dc2626]" : "bg-[#f1f3f8] text-[#6b7280]")}>
                  {left > 0 ? `${left} ta o‘rin qoldi` : "Joy qolmadi"}
                </span>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border-2 border-[#0F766E] bg-[#f3fbf9] p-4">
              <p className="text-[12.5px] font-semibold text-[#0F766E]">{online ? "Online qatnashish" : "Zalda qatnashish"}</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <p className="text-[24px] leading-none font-extrabold text-[#111827]">{seminarPriceText(s)}</p>
                {pct > 0 && s.oldPrice ? (
                  <>
                    <span className="text-[12px] text-[#9aa3b5] line-through">{formatMoney(s.oldPrice, "UZS")}</span>
                    <span className="rounded-md bg-[#F0FDFA] px-1.5 py-0.5 text-[11px] font-bold text-[#129a5c]">-{pct}%</span>
                  </>
                ) : null}
              </div>
              <ul className="mt-3 space-y-1.5 text-[12px] text-[#111827]">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-[#0F766E]" /> {online ? "Jonli efirga kirish" : "Zalda qatnashish"}</li>
                {program.some((p) => /kofe|tushlik/i.test(p.title)) ? <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-[#0F766E]" /> Kofe-breyk va tushlik</li> : null}
                {certificate ? <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-[#0F766E]" /> Sertifikat beriladi</li> : null}
              </ul>
              {s.seatsTotal > 0 && !s.seatsTbd ? (
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-[#5d6e86]"><span>Band joylar</span><span>{taken}/{s.seatsTotal}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#dde8ef]"><div className="h-full rounded-full bg-[#0F766E]" style={{ width: `${fill}%` }} /></div>
                </div>
              ) : null}
            </div>

            {mine ? (
              <Link href={`/seminarlar/yozuvlarim/${mine.id}`} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[15px] font-semibold text-white hover:bg-[#0F766E]">
                Chiptani ochish <ArrowRight className="size-5" />
              </Link>
            ) : showCta ? (
              <button type="button" onClick={scrollToForm} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0F766E] text-[15px] font-semibold text-white hover:bg-[#0F766E]">
                Ro‘yxatdan o‘tish <ArrowRight className="size-5" />
              </button>
            ) : (
              <button type="button" disabled className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#e5e9f2] text-[15px] font-semibold text-[#8b93a7]">
                {!upcoming ? "Seminar o‘tgan" : "Joy qolmadi"}
              </button>
            )}
            {upcoming && !s.dateTbd ? (
              <button type="button" onClick={addToCalendar} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#CCFBF1] bg-white text-[13.5px] font-semibold text-[#0F766E] hover:bg-[#f3fbf9]">
                <CalendarPlus className="size-4" /> Kalendarga qo‘shish
              </button>
            ) : null}
            {certificate ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f6f9fc] p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[#0F766E]"><Award className="size-[18px]" /></span>
                <span className="text-[12px] leading-snug text-[#111827]"><b className="block text-[12.5px]">Sertifikat beriladi</b>Seminar yakunida</span>
              </div>
            ) : null}
          </div>

          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
            <p className="mb-3 text-[14px] font-bold text-[#111827]">Ishtirokchilar sharhlari</p>
            <div className="flex items-center gap-3 text-[12.5px] text-[#6b7280]">
              <Star className="size-5 shrink-0 text-[#9aa3b5]" />
              Hali sharh yo‘q. Seminardan keyin ishtirokchilar fikr qoldiradi.
            </div>
          </div>

          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[14px] font-bold text-[#111827]">O‘xshash seminarlar</p>
              <Link href="/seminarlar" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0F766E] hover:underline">Barchasi <ArrowRight className="size-3.5" /></Link>
            </div>
            {similar.length ? (
              <ul className="space-y-3">
                {similar.map((x) => (
                  <li key={x.id}>
                    <Link href={`/seminarlar/${x.id}`} className="group flex items-center gap-3">
                      <span className="relative h-[46px] w-[64px] shrink-0 overflow-hidden rounded-lg bg-[#F0FDFA]">
                        {x.image ? <Image src={x.image} alt="" fill className="object-cover" sizes="64px" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 block text-[12.5px] font-semibold text-[#111827] group-hover:text-[#0F766E]">{x.title}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[#8b93a7]">{seminarDayMonth(x.date)} · {x.city.replace(" shahri", "")}</span>
                      </span>
                      <span className="shrink-0 text-[12px] font-bold text-[#0F766E]">{seminarPriceText(x)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-[#6b7280]">Boshqa seminarlar tez orada.</p>
            )}
          </div>

          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
            <p className="mb-3 text-[14px] font-bold text-[#111827]">Ulashish</p>
            <div className="flex items-center gap-2.5">
              <ShareBtn label="Telegram" onClick={() => openShare("telegram")} className="bg-[#0F766E]"><Send className="size-4" /></ShareBtn>
              <ShareBtn label="WhatsApp" onClick={() => openShare("whatsapp")} className="bg-[#25D366]"><MessageCircle className="size-4" /></ShareBtn>
              <ShareBtn label="Facebook" onClick={() => openShare("facebook")} className="bg-[#0F766E]"><span className="text-[15px] leading-none font-extrabold">f</span></ShareBtn>
              <ShareBtn label="LinkedIn" onClick={() => openShare("linkedin")} className="bg-[#0F766E]"><span className="text-[12px] leading-none font-extrabold">in</span></ShareBtn>
              <ShareBtn label="Havolani nusxalash" onClick={copyLink} className="bg-[#6b7280]"><Link2 className="size-4" /></ShareBtn>
            </div>
          </div>
        </aside>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#111827] px-4 py-2 text-[13px] font-medium text-white shadow-lg" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function weekday(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

function ProgramList({ rows }: { rows: { time: string; title: string }[] }) {
  return (
    <ol className="divide-y divide-[#f1f4f8]">
      {rows.map((p, i) => {
        const next = rows[i + 1]?.time;
        const brk = /kofe|tushlik/i.test(p.title);
        return (
          <li key={`${p.time}-${i}`} className="flex items-center gap-3 py-2">
            <Clock className="size-3.5 shrink-0 text-[#9aa3b5]" />
            <span className="w-[96px] shrink-0 text-[12px] font-semibold text-[#5d6e86] tabular-nums">{p.time}{next ? ` – ${next}` : ""}</span>
            <span className={cn("text-[12.5px]", brk ? "text-[#8b93a7]" : "font-medium text-[#111827]")}>{p.title}</span>
          </li>
        );
      })}
    </ol>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F0FDFA]">
        <Icon className="size-4" style={{ color: BLUE }} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] text-[#8b93a7]">{label}</span>
        <span className="block font-semibold text-[#1a1d26]">{children}</span>
      </span>
    </li>
  );
}

function ShareBtn({ label, onClick, className, children }: { label: string; onClick: () => void; className: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cn("grid size-10 place-items-center rounded-full text-white transition hover:opacity-90", className)}>
      {children}
    </button>
  );
}

/** No coordinates exist in the data, so this is an address card with a Google Maps link instead of an embedded map. */
function AddressCard({ s, online, compact }: { s: Seminar; online: boolean; compact?: boolean }) {
  const hasVenue = Boolean(s.venue);
  return (
    <div className={cn("rounded-2xl border border-[#e3e9f5] bg-[#f5f8ff]", compact ? "p-3" : "p-4")}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-[#ef4444] shadow-sm">
          <MapPin className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          {online ? (
            <p className="text-[13px] font-semibold text-[#1a1d26]">Online format</p>
          ) : hasVenue ? (
            <>
              <p className="truncate text-[13px] font-semibold text-[#1a1d26]">{s.venue}</p>
              <p className="text-[12px] text-[#6b7280]">{s.city}</p>
            </>
          ) : (
            <p className="text-[13px] text-[#6b7280]">Manzil tez orada e’lon qilinadi.</p>
          )}
        </div>
        {!online && hasVenue ? (
          <a href={mapsHref(s)} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#0F766E] hover:underline">
            Xaritada
            <ArrowRight className="size-3.5" />
          </a>
        ) : null}
      </div>
      <SeminarPublicLinks sourceUrl={s.sourceUrl} instagram={s.instagram} testId={compact ? "seminar-links-side" : "seminar-links"} />
    </div>
  );
}
