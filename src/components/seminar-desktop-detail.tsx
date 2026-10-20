"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Bookmark,
  BookmarkCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  Link2,
  MapPin,
  MessageCircle,
  Play,
  Scissors,
  Send,
  Share2,
  Star,
  Users,
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

const BLUE = "#0066FF";

const TABS = [
  { id: "umumiy", label: "Umumiy ma’lumot" },
  { id: "spikerlar", label: "Spikerlar" },
  { id: "dastur", label: "Dastur" },
  { id: "materiallar", label: "Materiallar" },
  { id: "fikrlar", label: "Fikrlar" },
  { id: "joylashuv", label: "Joylashuv" },
];

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
    <div className="rounded-2xl border border-dashed border-[#d6def0] bg-[#f8faff] px-4 py-5 text-[13px] text-[#6b7280]">
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
  const lead = speakers[0];
  const learnings = s.learnings ?? [];
  const gallery = getSeminarPastGallery(s);
  const program = s.program ?? [];
  const pct = discountPercent(s);
  const saved = useSavedSeminars().includes(s.id);
  const tags = seminarTags(s);
  const [tab, setTab] = useState(TABS[0].id);
  const [toast, setToast] = useState("");
  const [slide, setSlide] = useState(0);

  const slides = useMemo(
    () => [...new Set([s.image, ...gallery.map((g) => g.image)].filter(Boolean))],
    [s.image, gallery],
  );
  const heroImg = slides[slide % Math.max(1, slides.length)] ?? "";

  const hay = [s.title, s.description, ...(s.tags ?? []), ...learnings, ...program.map((p) => p.title)].join(" ");
  const chipLabel = [specialtyLabels[s.specialty], s.badge ?? tags[0]?.label].filter(Boolean).join(" + ");
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

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = TABS.map((t) => document.getElementById(`dsem-${t.id}`)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setTab(hit.target.id.replace("dsem-", ""));
      },
      { rootMargin: "-120px 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

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
  function go(id: string) {
    setTab(id);
    document.getElementById(`dsem-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const seatLabel = s.seatsTbd ? "Joylar soni cheklangan" : s.seatsTotal > 0 ? `${left}/${s.seatsTotal} Joy qoldi` : "O‘rinlar tez orada";
  const showCta = upcoming && !mine && left > 0;

  const meta: { icon: LucideIcon; text: string }[] = [
    { icon: CalendarDays, text: date.when },
    { icon: Clock, text: `${s.time} - ${s.timeEnd}` },
    { icon: MapPin, text: place || "Joy tez orada" },
    { icon: Users, text: seatLabel },
  ];

  return (
    <div className="relative mx-auto max-w-[1180px] 2xl:max-w-[1360px]">
      <p className="mb-3 text-[12.5px] text-[#8b93a7]">
        <Link href="/seminarlar" className="text-[#0066FF] hover:underline">
          Seminarlar
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#4b5568]">{s.title}</span>
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* ───────── main column ───────── */}
        <div className="min-w-0">
          <section className="relative overflow-hidden rounded-[20px] bg-[#0B1F4D] shadow-[0_10px_30px_rgba(15,23,42,0.14)]">
            <div className="relative h-[320px] 2xl:h-[360px]">
              {heroImg ? (
                <Image key={heroImg} src={heroImg} alt="" fill priority className="object-cover" sizes="(min-width:1536px) 960px, 760px" />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F4D]/90 via-[#0B1F4D]/55 to-[#0B1F4D]/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F4D]/85 via-transparent to-transparent" />

              <div className="absolute inset-0 flex flex-col justify-end p-6 2xl:p-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase text-white",
                      upcoming ? "bg-[#0066FF]" : "bg-white/25 backdrop-blur-sm",
                    )}
                  >
                    {upcoming ? "Joriy seminar" : s.status === "closed" ? "Yopilgan" : "O‘tgan"}
                  </span>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    {chipLabel}
                  </span>
                  {s.organizer ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      <Building2 className="size-3.5" />
                      Tashkilotchi: {s.organizer}
                    </span>
                  ) : null}
                </div>
                <h1 className="max-w-[560px] text-[30px] leading-[1.12] font-extrabold tracking-tight text-white 2xl:max-w-[720px] 2xl:text-[36px]">
                  {s.title}
                </h1>
                <p className="mt-2 max-w-[520px] line-clamp-2 text-[13.5px] leading-snug text-white/85 2xl:max-w-[640px]">
                  {s.description || "Seminar tavsifi tez orada qo‘shiladi."}
                </p>
                <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium text-white">
                  {meta.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-full bg-[#0066FF]">
                        <Icon className="size-3.5 text-white" />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => flash("Video tez orada")}
                aria-label="Video (tez orada)"
                className="absolute top-1/2 right-[12%] grid size-16 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/50 backdrop-blur-md transition hover:bg-white/30"
              >
                <Play className="ml-0.5 size-7 fill-white" />
              </button>
              <button
                type="button"
                onClick={() => setSlide((i) => (i + 1) % Math.max(1, slides.length))}
                aria-label="Keyingi rasm"
                className="absolute right-4 bottom-4 rounded-full bg-black/45 px-3 py-1 text-[12px] font-semibold text-white backdrop-blur-sm"
              >
                {slides.length ? `${(slide % slides.length) + 1}/${slides.length}` : "Rasm tez orada"}
              </button>
            </div>
          </section>

          {/* tabs */}
          <nav className="sticky top-0 z-20 -mx-1 mt-4 flex gap-1 overflow-x-auto border-b border-[#e6eaf2] bg-[#f6f8fc]/95 px-1 backdrop-blur [scrollbar-width:none]">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                className={cn(
                  "-mb-px shrink-0 border-b-2 px-3.5 py-3 text-[13.5px] font-semibold transition-colors",
                  tab === t.id ? "border-[#0066FF] text-[#0066FF]" : "border-transparent text-[#6b7280] hover:text-[#1a1d26]",
                )}
              >
                {t.label}
                {t.id === "fikrlar" ? " (0)" : ""}
              </button>
            ))}
          </nav>

          {/* umumiy */}
          <section id="dsem-umumiy" className="scroll-mt-16 pt-6">
            <SectionTitle>Seminar haqida</SectionTitle>
            {s.description ? (
              <p className="text-[14px] leading-relaxed text-[#4b5568]">{s.description}</p>
            ) : (
              <Soon>Seminar tavsifi tez orada qo‘shiladi.</Soon>
            )}
            <div className={cn("mt-4 grid gap-3", featureCards.length === 4 ? "grid-cols-4" : "grid-cols-5")}>
              {featureCards.map(({ icon: Icon, title, sub, on }) => {
                return (
                  <div
                    key={title}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center rounded-2xl border bg-white p-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)]",
                      on ? "border-[#e3e9f5]" : "border-dashed border-[#e3e9f5] opacity-60",
                    )}
                  >
                    <span className={cn("grid size-11 place-items-center rounded-xl", on ? "bg-[#e8f1ff] text-[#0066FF]" : "bg-[#f1f3f8] text-[#9aa3b5]")}>
                      <Icon className="size-5" />
                    </span>
                    <p className="mt-2.5 text-[12.5px] leading-snug font-semibold text-[#1a1d26]">{title}</p>
                    {sub ? <p className="mt-1 text-[11.5px] leading-snug text-[#6b7280]">{sub}</p> : null}
                    {!on ? <p className="mt-1 text-[10.5px] text-[#8b93a7]">Aniqlanmoqda</p> : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-7">
              <SectionTitle>Nima o‘rganasiz?</SectionTitle>
              {!learnings.length && days.length ? (
                <div className={cn("grid gap-4", days.length > 1 && "grid-cols-2")} data-testid="seminar-day-topics">
                  {days.map((d) => (
                    <div key={d.label} className="rounded-2xl border border-[#e3e9f5] bg-white p-4">
                      <p className="mb-2.5 text-[13px] font-bold text-[#0066FF]">
                        {d.label.toUpperCase()} — {d.title}{d.date ? ` · ${d.date}` : ""}
                      </p>
                      <ul className="space-y-2">
                        {d.topics.map((t) => (
                          <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-snug font-medium text-[#1a1d26]">
                            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-[#0066FF]" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : learnings.length ? (
                <ol className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {learnings.slice(0, 8).map((item, i) => (
                    <li key={`${i}-${item}`} className="flex items-start gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[12px] font-bold text-[#0066FF]">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-[14px] leading-snug font-medium text-[#1a1d26]">{item}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <Soon>O‘quv maqsadlari tashkilotchi tomonidan tez orada e’lon qilinadi.</Soon>
              )}
            </div>

            <div className="mt-7">
              <SectionTitle>Seminar lavhalari</SectionTitle>
              {gallery.length ? (
                <div className="grid grid-cols-4 gap-3">
                  {gallery.slice(0, 4).map((g) => (
                    <figure key={`${g.image}-${g.caption}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl">
                      <Image src={g.image} alt={g.caption ?? ""} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="240px" />
                      {g.caption ? (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <figcaption className="absolute inset-x-0 bottom-0 p-2 text-[11.5px] font-semibold text-white">{g.caption}</figcaption>
                        </>
                      ) : null}
                    </figure>
                  ))}
                </div>
              ) : (
                <Soon>Lavhalar seminar o‘tgach shu yerda ko‘rinadi.</Soon>
              )}
            </div>
          </section>

          {/* spikerlar */}
          <section id="dsem-spikerlar" className="scroll-mt-16 pt-8">
            <SectionTitle>Spikerlar</SectionTitle>
            {speakers.length ? (
              <div className="grid grid-cols-2 gap-3">
                {speakers.map((sp) => (
                  <article key={`${sp.name}-${sp.role}`} className="flex gap-3 rounded-2xl border border-[#e3e9f5] bg-white p-3.5">
                    {sp.photo ? (
                      <Image src={sp.photo} alt="" width={52} height={52} className="size-[52px] shrink-0 rounded-full object-cover ring-2 ring-[#e8f1ff]" />
                    ) : (
                      <span className="grid size-[52px] shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-sm font-bold text-[#0066FF]">{initials(sp.name)}</span>
                    )}
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[#1a1d26]">{sp.name}</p>
                      {sp.role ? <p className="mt-0.5 text-[12.5px] text-[#0066FF]">{sp.role}</p> : null}
                      {sp.bio ? <p className="mt-1 text-[12px] leading-snug text-[#6b7280]">{sp.bio}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Soon>Ma’ruzachi aniqlanmoqda.</Soon>
            )}
          </section>

          {/* dastur */}
          <section id="dsem-dastur" className="scroll-mt-16 pt-8">
            <SectionTitle>Dastur</SectionTitle>
            {days.length ? (
              <div className={cn("grid gap-4", days.length > 1 && "grid-cols-2")} data-testid="seminar-program">
                {days.map((d) => (
                  <div key={d.label}>
                    <p className="mb-2 text-[14px] font-bold text-[#1a1d26]">
                      {d.label} <span className="font-semibold text-[#0066FF]">· {d.title}</span>
                      {d.date ? <span className="ml-1.5 text-[12.5px] font-medium text-[#8b93a7]">{d.date}</span> : null}
                    </p>
                    <ol className="space-y-1.5">
                      {d.schedule.map((p, i) => {
                        const brk = /kofe|tushlik/i.test(p.title);
                        return (
                          <li key={`${p.time}-${i}`} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5", brk ? "border-dashed border-[#e3e9f5] bg-[#f8faff]" : "border-[#e3e9f5] bg-white")}>
                            <span className="w-[92px] shrink-0 text-[12.5px] font-bold text-[#0066FF]">{p.time}</span>
                            <span className={cn("text-[13px]", brk ? "text-[#8b93a7]" : "font-medium text-[#1a1d26]")}>{p.title}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            ) : program.length ? (
              <ol className="space-y-2">
                {program.map((p, i) => (
                  <li key={`${p.time}-${i}`} className="flex items-center gap-4 rounded-xl border border-[#e3e9f5] bg-white px-4 py-3">
                    <span className="w-[110px] shrink-0 text-[13px] font-bold text-[#0066FF]">{p.time}</span>
                    <span className="text-[13.5px] font-medium text-[#1a1d26]">{p.title}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Soon>
                Dastur tez orada. Seminar vaqti: {s.time} — {s.timeEnd}.
              </Soon>
            )}
          </section>

          {/* materiallar */}
          <section id="dsem-materiallar" className="scroll-mt-16 pt-8">
            <SectionTitle>Materiallar</SectionTitle>
            <Soon>Materiallar haqida ma’lumot tez orada.</Soon>
          </section>

          {/* fikrlar */}
          <section id="dsem-fikrlar" className="scroll-mt-16 pt-8">
            <SectionTitle>Fikrlar</SectionTitle>
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#d6def0] bg-[#f8faff] px-4 py-5 text-[13px] text-[#6b7280]">
              <Star className="size-5 text-[#9aa3b5]" />
              Hali fikr yo‘q. Seminardan keyin ishtirokchilar fikr qoldirishi mumkin bo‘ladi.
            </div>
          </section>

          {/* joylashuv */}
          <section id="dsem-joylashuv" className="scroll-mt-16 pt-8">
            <SectionTitle>Joylashuv</SectionTitle>
            <AddressCard s={s} online={online} />
          </section>

          {/* registration (existing flow) */}
          <div className="mt-8 pb-4">{children}</div>
        </div>

        {/* ───────── right column ───────── */}
        <aside className="min-w-0 space-y-4 self-start xl:sticky xl:top-0">
          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12px] font-medium text-[#8b93a7]">Narx</p>
              {upcoming && s.seatsTbd ? (
                <span className="rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-[11.5px] font-bold text-[#dc2626]">Joylar soni cheklangan</span>
              ) : upcoming && s.seatsTotal > 0 ? (
                left > 0 ? (
                  <span className="rounded-full bg-[#fee2e2] px-2.5 py-0.5 text-[11.5px] font-bold text-[#dc2626]">{left} ta o‘rin qoldi</span>
                ) : (
                  <span className="rounded-full bg-[#f1f3f8] px-2.5 py-0.5 text-[11.5px] font-bold text-[#6b7280]">Joy qolmadi</span>
                )
              ) : null}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-[28px] leading-none font-extrabold text-[#0066FF]">
                {seminarPriceText(s)}
              </p>
              {pct > 0 && s.oldPrice ? (
                <>
                  <span className="text-[13px] text-[#9aa3b5] line-through">{formatMoney(s.oldPrice, "UZS")}</span>
                  <span className="rounded-md bg-[#e8f1ff] px-1.5 py-0.5 text-[11px] font-bold text-[#0066FF]">-{pct}%</span>
                </>
              ) : null}
            </div>

            {mine ? (
              <Link
                href={`/seminarlar/yozuvlarim/${mine.id}`}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(0,102,255,0.3)] hover:bg-[#0052cc]"
              >
                Chiptani ochish <ArrowRight className="size-5" />
              </Link>
            ) : showCta ? (
              <button
                type="button"
                onClick={scrollToForm}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(0,102,255,0.3)] hover:bg-[#0052cc]"
              >
                Ro‘yxatdan o‘tish <ArrowRight className="size-5" />
              </button>
            ) : (
              <button type="button" disabled className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-[#e5e9f2] text-[15px] font-semibold text-[#8b93a7]">
                {!upcoming ? "Seminar o‘tgan" : "Joy qolmadi"}
              </button>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  toggleSavedSeminar(s.id);
                  flash(saved ? "Saqlanganlardan olib tashlandi" : "Saqlandi");
                }}
                className={cn(
                  "flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-semibold transition-colors",
                  saved ? "border-[#0066FF] bg-[#e8f1ff] text-[#0066FF]" : "border-[#d9e0ee] text-[#1a1d26] hover:bg-[#f5f8ff]",
                )}
              >
                {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                {saved ? "Saqlangan" : "Saqlash"}
              </button>
              <button
                type="button"
                onClick={shareNative}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#d9e0ee] text-[13px] font-semibold text-[#1a1d26] hover:bg-[#f5f8ff]"
              >
                <Share2 className="size-4" />
                Ulashish
              </button>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
            <p className="mb-3 text-[14px] font-bold text-[#1a1d26]">Asosiy spiker</p>
            {lead ? (
              <div className="flex items-center gap-3">
                {lead.photo ? (
                  <Image src={lead.photo} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full object-cover ring-2 ring-[#e8f1ff]" />
                ) : (
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-base font-bold text-[#0066FF]">{initials(lead.name)}</span>
                )}
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold text-[#1a1d26]">{lead.name}</p>
                  {lead.role ? <p className="mt-0.5 text-[12.5px] text-[#0066FF]">{lead.role}</p> : null}
                  {speakers.length > 1 ? <p className="mt-1 text-[11.5px] text-[#8b93a7]">va yana {speakers.length - 1} ta spiker</p> : null}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-[#6b7280]">Ma’ruzachi aniqlanmoqda</p>
            )}
          </div>

          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
            <ul className="space-y-3 text-[13px]">
              <DetailRow icon={CalendarDays} label="Sana">{date.when}</DetailRow>
              <DetailRow icon={Clock} label="Vaqt">{s.time} - {s.timeEnd}</DetailRow>
              <DetailRow icon={MapPin} label="Joy">{place || "Tez orada"}</DetailRow>
              <DetailRow icon={Users} label="O‘rinlar">{s.seatsTbd ? "Joylar soni cheklangan" : s.seatsTotal > 0 ? `${left} / ${s.seatsTotal}` : "Tez orada"}</DetailRow>
              {s.organizer ? <DetailRow icon={Building2} label="Tashkilotchi">{s.organizer}</DetailRow> : null}
            </ul>
            <div className="mt-4">
              <AddressCard s={s} online={online} compact />
            </div>
          </div>

          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
            <p className="mb-3 text-[14px] font-bold text-[#1a1d26]">Ulashish</p>
            <div className="flex items-center gap-2.5">
              <ShareBtn label="Telegram" onClick={() => openShare("telegram")} className="bg-[#229ED9]"><Send className="size-4" /></ShareBtn>
              <ShareBtn label="WhatsApp" onClick={() => openShare("whatsapp")} className="bg-[#25D366]"><MessageCircle className="size-4" /></ShareBtn>
              <ShareBtn label="Facebook" onClick={() => openShare("facebook")} className="bg-[#1877F2]"><span className="text-[15px] leading-none font-extrabold">f</span></ShareBtn>
              <ShareBtn label="LinkedIn" onClick={() => openShare("linkedin")} className="bg-[#0A66C2]"><span className="text-[12px] leading-none font-extrabold">in</span></ShareBtn>
              <ShareBtn label="Havolani nusxalash" onClick={copyLink} className="bg-[#6b7280]"><Link2 className="size-4" /></ShareBtn>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#e3e9f5] bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[14px] font-bold text-[#1a1d26]">O‘xshash seminarlar</p>
              <Link href="/seminarlar" className="text-[12px] font-semibold text-[#0066FF] hover:underline">Barchasini ko‘rish</Link>
            </div>
            {similar.length ? (
              <ul className="space-y-3">
                {similar.map((x) => (
                  <li key={x.id}>
                    <Link href={`/seminarlar/${x.id}`} className="group flex items-center gap-3">
                      <span className="relative size-[54px] shrink-0 overflow-hidden rounded-xl bg-[#e8f1ff]">
                        {x.image ? <Image src={x.image} alt="" fill className="object-cover" sizes="54px" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 block text-[12.5px] leading-snug font-semibold text-[#1a1d26] group-hover:text-[#0066FF]">{x.title}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-[#8b93a7]">
                          {seminarDayMonth(x.date)} · {x.city} · {seminarPriceText(x)}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-[#9aa3b5]" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-[#6b7280]">Boshqa seminarlar tez orada.</p>
            )}
          </div>
        </aside>
      </div>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#0B1F4D] px-4 py-2 text-[13px] font-medium text-white shadow-lg" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f1ff]">
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
          <a href={mapsHref(s)} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#0066FF] hover:underline">
            Xaritada
            <ArrowRight className="size-3.5" />
          </a>
        ) : null}
      </div>
      <SeminarPublicLinks sourceUrl={s.sourceUrl} instagram={s.instagram} testId={compact ? "seminar-links-side" : "seminar-links"} />
    </div>
  );
}
