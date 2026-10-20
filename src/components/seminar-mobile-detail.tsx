"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileBadge,
  Images,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Play,
  Share2,
  Star,
  Users,
  Video,
  X,
} from "lucide-react";
import { BookmarkButton, SeminarCover, ToothOutline, cardTags, initials } from "@/components/seminar-mobile-list";
import { SeminarStatusBadge } from "@/components/seminar-status";
import type { SeminarRegistration } from "@/lib/seminar-registrations";
import { getSeminarSpeakers, seminarPriceText, seminarSeatsShort, seminars, type Seminar } from "@/data/seminars";
import { SeminarPublicLinks } from "@/components/seminar-links";
import { formatMoney } from "@/lib/format";
import { discountPercent, mapsHref, programSteps } from "@/lib/seminar-mobile";
import { cn } from "@/lib/utils";
import { seminarDate } from "@/data/seminars";

type Props = {
  seminar: Seminar;
  left: number;
  mine: SeminarRegistration | undefined;
  upcoming: boolean;
  onRegister: () => void;
  /** Registration block (mobile form / registered state). */
  children: ReactNode;
  formRef: RefObject<HTMLElement | null>;
};

function RegisterButton({ left, mine, upcoming, onRegister }: Pick<Props, "left" | "mine" | "upcoming" | "onRegister">) {
  const base = "inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-[14px] px-5 text-[14px] font-semibold whitespace-nowrap";
  if (!upcoming) return <span className={cn(base, "bg-[#f1f3f7] text-[#8b93a7]")}>O‘tgan seminar</span>;
  if (mine)
    return (
      <Link href={`/seminarlar/yozuvlarim/${mine.id}`} className={cn(base, "bg-[#f5f9ff] px-4 text-[#0066FF]")}>
        <SeminarStatusBadge status={mine.status} />
        Chipta
      </Link>
    );
  if (left <= 0) return <span className={cn(base, "bg-[#f1f3f7] text-[#8b93a7]")}>Joy qolmadi</span>;
  return (
    <button type="button" data-testid="seminar-register-cta" onClick={onRegister} className={cn(base, "px-4 min-[410px]:min-w-[46%] bg-[#0066FF] text-white shadow-[0_8px_18px_rgba(0,102,255,0.3)]")}>
      Ro‘yxatdan o‘tish
      <ArrowRight className="size-4" />
    </button>
  );
}

/** Tooth outline icon for the "Klinik case" chip. */
function ToothChipIcon({ className }: { className?: string }) {
  return <ToothOutline className={className} />;
}

function Card({ id, className, children }: { id?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-16 rounded-[18px] bg-white p-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.05)] ring-1 ring-[#edf0f6]", className)}>
      {children}
    </section>
  );
}

function CardHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <h2 className="text-[16px] font-bold tracking-tight text-[#0B1F4D]">{title}</h2>
      {action}
    </div>
  );
}

function LinkBtn({ children, onClick, testId }: { children: ReactNode; onClick: () => void; testId?: string }) {
  return (
    <button type="button" data-testid={testId} onClick={onClick} className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#0066FF]">
      {children}
      <ChevronRight className="size-3.5" />
    </button>
  );
}

export function SeminarDetailMobile({ seminar: s, left, mine, upcoming, onRegister, children }: Props) {
  const speakers = getSeminarSpeakers(s).filter((sp) => sp.name);
  const lead = speakers[0];
  const date = seminarDate(s);
  const online = s.city === "Online";
  const tags = cardTags(s);
  /** Only the seminar's own photos — no stand-in images from other seminars. */
  const gallery = s.remote ? [] : (s.pastGallery ?? []);
  const steps = programSteps(s);
  const pct = discountPercent(s);
  const [toast, setToast] = useState("");
  const [day, setDay] = useState(0);
  const [tab, setTab] = useState("about");
  const [allSteps, setAllSteps] = useState(false);
  const [moreAbout, setMoreAbout] = useState(false);
  const [speakerOpen, setSpeakerOpen] = useState(false);
  const [pickStep, setPickStep] = useState(Math.max(0, steps.findIndex((x) => x.highlight)));
  const [viewer, setViewer] = useState<number | null>(null);

  const tabs = [
    { id: "about", label: "Umumiy" },
    { id: "program", label: "Dastur" },
    { id: "speakers", label: "Ma‘ruzachi" },
    { id: "place", label: "Manzil" },
    { id: "reviews", label: "Sharhlar" },
  ];

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = tabs.map((t) => document.getElementById(`sem-${t.id}`)).filter((e): e is HTMLElement => Boolean(e));
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setTab(hit.target.id.replace("sem-", ""));
      },
      { rootMargin: "-90px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2200);
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: s.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      flash("Havola nusxalandi");
    } catch {
      flash("Ulashib bo‘lmadi");
    }
  }

  function go(id: string) {
    setTab(id);
    document.getElementById(`sem-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const words = s.title.split(" ");
  const lastWord = words.length > 2 ? words[words.length - 1] : "";
  const firstWords = words.length > 2 ? words.slice(0, -1).join(" ") : s.title;
  const heroPhoto = lead?.photo ?? s.heroImage ?? s.speakerAvatar ?? s.image;
  const heroThumbs = gallery.slice(0, 4);
  const galleryTiles = gallery.slice(0, 5);
  const galleryExtra = gallery.length - galleryTiles.length;
  const place = online ? (s.venue && s.venue !== "Online" ? `Onlayn (${s.venue})` : "Onlayn") : [s.city, s.venue].filter(Boolean).join(", ");
  const speakerSeminarCount = lead ? seminars.filter((x) => getSeminarSpeakers(x).some((p) => p.name === lead.name)).length : 0;

  /** A chip is "on" only when the seminar's own text mentions it (same rule as desktop); otherwise "Aniqlanmoqda". */
  const hay = [s.title, s.description, ...(s.tags ?? []), ...(s.learnings ?? []), ...(s.program ?? []).map((x) => x.title)].join(" ");
  const chipIcons = [BookOpen, ToothChipIcon, Video, FileBadge];
  const chips: { icon: (p: { className?: string }) => ReactNode; label: string; sub?: string; on: boolean }[] = s.features?.length
    ? s.features.slice(0, 4).map((f, i) => ({ icon: chipIcons[i % chipIcons.length], label: f.title, sub: f.subtitle, on: true }))
    : [
        { icon: BookOpen, label: "Nazariya va protokollar", re: /nazariy|protokol|ma.?ruza|lecture|nazariya/i },
        { icon: ToothChipIcon, label: "Klinik case muhokama", re: /case|keys|klinik/i },
        { icon: Video, label: "Amaliy mashg‘ulot", re: /amaliy|hands|practic|mashg|savol|live|jonli/i },
        { icon: FileBadge, label: "Sertifikat beriladi", re: /sertifikat|certificate/i },
      ].map(({ re, ...c }) => ({ ...c, on: re.test(hay) }));
  const days = s.programDays ?? [];
  const curDay = days[Math.min(day, Math.max(0, days.length - 1))];

  return (
    <div className="-m-4 pb-6" data-testid="seminar-detail-mobile">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#071733] text-white" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        {heroPhoto ? (
          <div
            className="absolute inset-y-0 left-0 w-[60%]"
            style={{ WebkitMaskImage: "linear-gradient(to right, #000 60%, transparent)", maskImage: "linear-gradient(to right, #000 60%, transparent)" }}
          >
            <Image src={heroPhoto} alt="" fill priority sizes="260px" className="object-cover object-top" />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#071733]/30 to-[#0b2a66]/70" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#071733]/80 to-transparent" />

        <Link href="/seminarlar" aria-label="Orqaga" className="absolute top-3 left-4 z-20 grid size-10 place-items-center rounded-full bg-white text-[#0B1F4D] shadow-sm" style={{ marginTop: "env(safe-area-inset-top)" }}>
          <ChevronLeft className="size-5" />
        </Link>

        <div className="relative z-10 ml-[45%] flex min-h-[300px] flex-col pt-3 pr-4 pb-7">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-wrap gap-1">
              {!upcoming ? <span className="rounded-md bg-white/25 px-2 py-[5px] text-[10px] leading-none font-bold tracking-wide uppercase">O‘tgan</span> : null}
              {tags.map((t) => (
                <span key={t.label} className="rounded-md bg-[#0066FF] px-2 py-[5px] text-[10px] leading-none font-bold tracking-wide uppercase">
                  {t.label}
                </span>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <BookmarkButton id={s.id} onDark className="!size-10" />
              <button type="button" aria-label="Ulashish" onClick={share} className="grid size-10 place-items-center rounded-full bg-white text-[#0B1F4D] shadow-sm">
                <Share2 className="size-[18px]" />
              </button>
            </div>
          </div>
          <h1 className="mt-1.5 text-[20px] leading-[1.15] font-extrabold tracking-tight" data-testid="seminar-title">
            {firstWords}
            {lastWord ? <span className="text-[#5fa2ff]"> {lastWord}</span> : null}
          </h1>
          {s.description ? <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-white/80">{s.description}</p> : null}
          <ul className="mt-2 space-y-[3px] text-[11.5px] text-white/90">
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0" />
              {date.long}
            </li>
            <li className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" />
              {s.time} – {s.timeEnd}
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{place}</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" />
              {seminarSeatsShort(s)}
            </li>
            {s.organizer ? (
              <li className="flex items-center gap-1.5" data-testid="seminar-hero-organizer">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">Tashkilotchi: {s.organizer}</span>
              </li>
            ) : null}
          </ul>
          <div className="mt-auto flex items-center gap-1.5 pt-3" data-testid="seminar-hero-gallery">
            {heroThumbs.length > 0 ? (
              heroThumbs.map((g, i) => (
                <button key={`${g.image}-${i}`} type="button" aria-label="Rasmni ochish" onClick={() => setViewer(i)} className="relative size-[38px] shrink-0 overflow-hidden rounded-lg ring-1 ring-white/40">
                  <Image src={g.image} alt="" fill sizes="38px" className="object-cover" />
                </button>
              ))
            ) : (
              <span className="relative size-[38px] shrink-0 overflow-hidden rounded-lg ring-1 ring-white/40">
                <SeminarCover src={s.image} sizes="38px" />
              </span>
            )}
            <button
              type="button"
              onClick={() => go("gallery")}
              aria-label="Galereya"
              className="grid size-[38px] shrink-0 place-items-center rounded-lg bg-white/15 text-[11px] font-bold ring-1 ring-white/40 backdrop-blur-sm"
            >
              {gallery.length > heroThumbs.length ? `+${gallery.length - heroThumbs.length}` : <Images className="size-4" />}
            </button>
          </div>
        </div>
        <button
          type="button"
          data-testid="seminar-video"
          onClick={() => flash("Video tez orada")}
          className="absolute bottom-7 left-4 z-20 inline-flex h-9 items-center gap-2 rounded-full bg-black/55 px-3.5 text-[12.5px] font-semibold backdrop-blur-sm"
        >
          <Play className="size-3.5 fill-white" />
          Video ko‘rish
        </button>
      </section>

      {/* Price card */}
      <section className="relative z-10 mx-4 -mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-white p-3.5 shadow-[0_10px_28px_rgba(15,23,42,0.1)]" data-testid="seminar-price-card">
        <div className="min-w-0">
          <p className="text-[clamp(17px,5vw,21px)] leading-tight font-extrabold whitespace-nowrap text-[#0B1F4D]">{seminarPriceText(s)}</p>
          {pct > 0 && s.oldPrice ? (
            <p className="mt-0.5 flex items-center gap-1.5">
              <span className="rounded-md bg-[#ff3b30] px-1.5 py-[3px] text-[10px] leading-none font-bold text-white">-{pct}%</span>
              <span className="text-[11.5px] text-[#9aa3b5] line-through">{formatMoney(s.oldPrice, "UZS")}</span>
            </p>
          ) : null}
          <p className={cn("mt-0.5 text-[12px] font-semibold", upcoming && left > 0 ? "text-[#0f9d58]" : "text-[#8b93a7]")}>
            {!upcoming ? "Yozilish yopilgan" : left > 0 ? (s.seatsTbd ? "Joylar soni cheklangan" : `${s.seatsTotal} o‘rindan ${left} ta qoldi`) : "Joy qolmadi"}
          </p>
        </div>
        <RegisterButton left={left} mine={mine} upcoming={upcoming} onRegister={onRegister} />
      </section>

      <div className="space-y-3 px-4 pt-3">
        {/* Pill tabs */}
        <nav aria-label="Bo‘limlar" className="sticky -top-4 z-20 -mx-4 bg-[#F4F7FC]/95 px-4 py-2 backdrop-blur-md" data-testid="seminar-tabs">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(t.id)}
                aria-current={tab === t.id}
                className={cn(
                  "h-9 shrink-0 rounded-full border px-4 text-[13px] font-semibold",
                  tab === t.id ? "border-[#0066FF] bg-[#0066FF] text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)]" : "border-[#e3e8f1] bg-white text-[#4b5568]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        <Card id="sem-about">
          <CardHead title="Seminar haqida" />
          <p className={cn("text-[12.5px] leading-relaxed text-[#4b5568]", !moreAbout && "line-clamp-3")}>{s.description ?? "Seminar haqida batafsil ma’lumot tez orada qo‘shiladi."}</p>
          {moreAbout && s.learnings?.length ? (
            <ul className="mt-2 space-y-1">
              {s.learnings.map((l) => (
                <li key={l} className="flex gap-2 text-[12.5px] leading-snug text-[#1a1d26]">
                  <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[#0066FF]" />
                  {l}
                </li>
              ))}
            </ul>
          ) : null}
          {(s.description && s.description.length > 140) || s.learnings?.length ? (
            <button type="button" onClick={() => setMoreAbout((v) => !v)} className="mt-1 text-[12px] font-semibold text-[#0066FF]">
              {moreAbout ? "Yig‘ish" : "Batafsil"}
            </button>
          ) : null}
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {chips.map(({ icon: Icon, label, sub, on }) => {
              return (
                <div
                  key={label}
                  data-on={on}
                  className={cn("flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center", on ? "bg-[#f0f5ff]" : "border border-dashed border-[#dfe5ef] bg-[#f8fafc]")}
                >
                  <Icon className={cn("size-[18px]", on ? "text-[#0066FF]" : "text-[#a3acbd]")} />
                  <span className={cn("text-[10px] leading-[1.2] font-medium", on ? "text-[#33405a]" : "text-[#8b93a7]")}>{label}</span>
                  {sub ? <span className="text-[8.5px] leading-[1.15] text-[#6b7280]">{sub}</span> : null}
                  {!on ? <span className="text-[8.5px] leading-none text-[#a3acbd]">Aniqlanmoqda</span> : null}
                </div>
              );
            })}
          </div>
        </Card>

        {curDay ? (
          <Card id="sem-program">
            <CardHead title="Seminar dasturi" action={<span className="text-[11.5px] font-semibold text-[#6b7280]">{days.length} kun</span>} />
            <div className="mb-3 grid gap-1.5 rounded-xl bg-[#f1f4f9] p-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }} role="tablist" data-testid="seminar-day-tabs">
              {days.map((d, i) => (
                <button
                  key={d.label}
                  type="button"
                  role="tab"
                  aria-selected={curDay === d}
                  onClick={() => setDay(i)}
                  className={cn(
                    "rounded-lg py-1.5 text-[12.5px] leading-tight font-semibold",
                    curDay === d ? "bg-white text-[#0066FF] shadow-[0_2px_8px_rgba(15,23,42,0.08)]" : "text-[#6b7280]",
                  )}
                >
                  {d.label.toUpperCase()} · {d.title}
                  {d.date ? <span className="block text-[10.5px] font-medium opacity-75">{d.date}</span> : null}
                </button>
              ))}
            </div>
            <ul className="mb-3 grid grid-cols-1 gap-1" data-testid="seminar-day-topics">
              {curDay.topics.map((t) => (
                <li key={t} className="flex gap-2 text-[12.5px] leading-snug text-[#1a1d26]">
                  <span className="mt-[6px] size-1.5 shrink-0 rounded-full bg-[#0066FF]" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mb-1 text-[12px] font-bold text-[#0B1F4D]">{curDay.label} jadvali{curDay.date ? ` · ${curDay.date}` : ""}</p>
            <ol data-testid="seminar-program">
              {curDay.schedule.map((st, i, arr) => {
                const brk = /kofe|tushlik/i.test(st.title);
                return (
                  <li key={`${st.time}-${i}`} className="relative flex items-center gap-2.5 py-1.5">
                    {i < arr.length - 1 ? <span className="absolute top-1/2 left-[7px] h-full w-[2px] bg-[#cfe0ff]" aria-hidden /> : null}
                    <span className="relative grid w-4 shrink-0 place-items-center">
                      <span className={cn("rounded-full", brk ? "size-2 bg-[#b9c6dc]" : "size-2.5 bg-[#0066FF]")} />
                    </span>
                    <span className="w-[86px] shrink-0 text-[11.5px] font-medium text-[#6b7280]">{st.time}</span>
                    <span className={cn("min-w-0 flex-1 text-[12.5px] leading-snug", brk ? "text-[#8b93a7]" : "font-semibold text-[#1a1d26]")}>{st.title}</span>
                  </li>
                );
              })}
            </ol>
          </Card>
        ) : (
        <Card id="sem-program">
          <CardHead
            title="Seminar dasturi"
            action={
              steps.length > 4 ? (
                <LinkBtn onClick={() => setAllSteps((v) => !v)}>{allSteps ? "Yig‘ish" : "Barchasini ko‘rish"}</LinkBtn>
              ) : undefined
            }
          />
          {steps.length === 0 ? (
            <p className="rounded-xl bg-[#f5f8fc] px-3 py-4 text-center text-[12.5px] text-[#8b93a7]">Dastur tez orada e’lon qilinadi.</p>
          ) : (
            <ol data-testid="seminar-program">
              {(allSteps ? steps : steps.slice(0, 4)).map((st, i, arr) => {
                const on = pickStep === i;
                return (
                  <li key={`${st.title}-${i}`} className="relative">
                    {i < arr.length - 1 ? <span className="absolute top-1/2 left-[7px] h-full w-[2px] bg-[#cfe0ff]" aria-hidden /> : null}
                    <button type="button" onClick={() => setPickStep(i)} className={cn("relative flex w-full items-center gap-2.5 rounded-xl py-2 pr-2 text-left", on && "bg-[#eaf2ff]")}>
                      <span className="grid w-4 shrink-0 place-items-center">
                        <span className={cn("rounded-full bg-[#0066FF]", on ? "size-3.5 ring-[3px] ring-[#cfe0ff]" : "size-2.5")} />
                      </span>
                      <span className={cn("w-[92px] shrink-0 text-[11.5px] font-medium", on ? "text-[#0066FF]" : "text-[#6b7280]")}>{st.time.replace(/\s/g, "")}</span>
                      <span className={cn("min-w-0 flex-1 truncate text-[12.5px] font-semibold", on ? "text-[#0066FF]" : "text-[#1a1d26]")}>{st.title}</span>
                      <ChevronRight className="size-4 shrink-0 text-[#9aa3b5]" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          {s.program?.length ? null : <p className="mt-1 text-[10.5px] text-[#9aa3b5]">Taxminiy bosqichlar — aniq dastur tashkilotchi tomonidan e’lon qilinadi.</p>}
        </Card>
        )}

        <Card id="sem-speakers">
          <CardHead title="Ma‘ruzachi" action={lead ? <LinkBtn testId="seminar-speaker-toggle" onClick={() => setSpeakerOpen((v) => !v)}>{speakerOpen ? "Yig‘ish" : "Profilni ko‘rish"}</LinkBtn> : undefined} />
          {!lead ? (
            <p className="rounded-xl bg-[#f5f8fc] px-3 py-4 text-center text-[12.5px] text-[#8b93a7]" data-testid="seminar-speaker-tbd">Ma’ruzachi aniqlanmoqda</p>
          ) : (
            <div className="space-y-2">
              {(speakerOpen ? speakers : speakers.slice(0, 1)).map((sp, i) => (
                <article key={`${sp.name}-${i}`} className="rounded-xl ring-1 ring-[#edf0f6]">
                  <button type="button" onClick={() => setSpeakerOpen((v) => !v)} className="flex w-full items-center gap-3 p-2.5 text-left">
                    {sp.photo ? (
                      <Image src={sp.photo} alt="" width={46} height={46} className="size-[46px] shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="grid size-[46px] shrink-0 place-items-center rounded-full bg-[#e8f1ff] text-[13px] font-bold text-[#0066FF]">{initials(sp.name)}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-[#0B1F4D]">{sp.name}</span>
                      <span className="block truncate text-[11.5px] text-[#6b7280]">{sp.role}</span>
                    </span>
                    {i === 0 ? (
                      <span className="shrink-0 text-right leading-tight">
                        <span className="flex items-center justify-end gap-1 text-[11px] text-[#9aa3b5]">
                          <Star className="size-3.5" /> Baho yo‘q
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[#6b7280]" data-testid="speaker-seminars">
                          {speakerSeminarCount} ta seminar
                        </span>
                      </span>
                    ) : null}
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f1f4f9] text-[#4b5568]">
                      <ChevronRight className={cn("size-4 transition-transform", speakerOpen && "rotate-90")} />
                    </span>
                  </button>
                  {speakerOpen && (sp.bio || sp.city) ? (
                    <div className="border-t border-[#f0f3f8] px-3 py-2 text-[12px] leading-snug text-[#6b7280]">
                      {sp.city ? (
                        <p className="flex items-center gap-1">
                          <MapPin className="size-3" /> {sp.city}
                        </p>
                      ) : null}
                      {sp.bio ? <p className="mt-1">{sp.bio}</p> : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </Card>

        <Card id="sem-gallery">
          <CardHead title="Seminar galereyasi" action={gallery.length ? <LinkBtn onClick={() => setViewer(0)}>{gallery.length} ta</LinkBtn> : undefined} />
          {gallery.length === 0 ? (
            <p className="rounded-xl bg-[#f5f8fc] px-3 py-5 text-center text-[12.5px] text-[#8b93a7]">Galereya tez orada qo‘shiladi.</p>
          ) : (
            <div className="-mx-3.5 flex gap-2 overflow-x-auto px-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="seminar-gallery">
              {galleryTiles.map((g, i, arr) => (
                <figure key={`${g.image}-${i}`} className="relative h-[64px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-[#eef2f8]">
                  <Image src={g.image} alt={g.caption ?? ""} fill sizes="84px" className="object-cover" />
                  {i === 0 && !g.still ? (
                    <button type="button" aria-label="Videoni ko‘rish" onClick={() => flash("Video tez orada")} className="absolute inset-0 grid place-items-center bg-black/20">
                      <span className="grid size-7 place-items-center rounded-full bg-white/95 text-[#0B1F4D]">
                        <Play className="size-3.5 fill-current" />
                      </span>
                    </button>
                  ) : (
                    <button type="button" aria-label="Rasmni ochish" onClick={() => setViewer(i)} className="absolute inset-0">
                      {i === arr.length - 1 && galleryExtra > 0 ? <span className="absolute inset-0 grid place-items-center bg-[#0B1F4D]/65 text-[15px] font-bold text-white">+{galleryExtra}</span> : null}
                    </button>
                  )}
                </figure>
              ))}
            </div>
          )}
        </Card>

        {s.organizer ? (
          <Card id="sem-organizer">
            <CardHead title="Tashkilotchi" />
            <div className="flex items-center gap-3" data-testid="seminar-organizer">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf2ff] text-[#0066FF]">
                <Building2 className="size-5" />
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[13.5px] font-semibold text-[#0B1F4D]">{s.organizer}</p>
                <p className="mt-0.5 truncate text-[11.5px] text-[#6b7280]">Seminar tashkilotchisi</p>
              </div>
            </div>
          </Card>
        ) : null}

        <Card id="sem-place">
          <CardHead title="Manzil" />
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf2ff] text-[#0066FF]">{online ? <Video className="size-5" /> : <MapPin className="size-5" />}</span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13.5px] font-semibold text-[#0B1F4D]">{online ? "Seminar onlayn o‘tadi" : s.venue || s.city}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-[#6b7280]">
                {online ? place : s.city} · {date.when}, {s.time}–{s.timeEnd}
              </p>
            </div>
            {!online && s.venue ? (
              <a href={mapsHref(s)} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl bg-[#f5f9ff] px-3 text-[12px] font-semibold text-[#0066FF]">
                Xarita <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>
          <SeminarPublicLinks sourceUrl={s.sourceUrl} instagram={s.instagram} testId="seminar-links-mobile" />
        </Card>

        <Card id="sem-reviews">
          <CardHead title="Sharhlar" action={<LinkBtn onClick={() => flash("Sharhlar tez orada")}>Barchasini ko‘rish</LinkBtn>} />
          <div className="flex items-start gap-3 rounded-xl p-2.5 ring-1 ring-[#edf0f6]" data-testid="seminar-reviews-empty">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fdecef] text-[#e5486a]">
              <MessageSquare className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-[#0B1F4D]">Hali sharh yo‘q</p>
              <p className="mt-0.5 flex items-center gap-0.5 text-[#d7dce6]" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="size-3.5" />
                ))}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-[#6b7280]">Seminardan so‘ng ishtirokchilar sharhlari shu yerda chiqadi.</p>
            </div>
            <MoreHorizontal className="size-4 shrink-0 text-[#c3c9d6]" aria-hidden />
          </div>
        </Card>

        {children}
      </div>

      {toast ? (
        <div role="status" className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] mx-auto w-fit rounded-full bg-[#0B1F4D] px-4 py-2 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {viewer !== null && gallery[viewer] ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/90 lg:hidden" role="dialog" aria-label="Galereya" data-testid="seminar-lightbox">
          <div className="flex items-center justify-between px-4 pt-4 text-white" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
            <span className="text-[13px] font-semibold">
              {viewer + 1} / {gallery.length}
            </span>
            <button type="button" aria-label="Yopish" onClick={() => setViewer(null)} className="grid size-10 place-items-center rounded-full bg-white/15">
              <X className="size-5" />
            </button>
          </div>
          <button type="button" aria-label="Keyingi rasm" onClick={() => setViewer((viewer + 1) % gallery.length)} className="relative mx-4 my-6 flex-1">
            <Image src={gallery[viewer].image} alt={gallery[viewer].caption ?? ""} fill sizes="100vw" className="object-contain" />
          </button>
          {gallery[viewer].caption ? (
            <p className="px-4 pb-8 text-center text-[13px] text-white/85">
              {gallery[viewer].caption}
              {gallery[viewer].subtitle ? <span className="text-white/55"> · {gallery[viewer].subtitle}</span> : null}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
