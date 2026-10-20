"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Bookmark,
  Briefcase,
  CalendarClock,
  CalendarDays,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSignature,
  FileText,
  Gift,
  GraduationCap,
  Heart,
  Images,
  MapPin,
  MessageCircleMore,
  Play,
  Send,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { CategoryBadge, EmployerLogo, JobPhoto, mapHref, placeText, salaryText, timeAgo, useSavedJobs } from "@/components/ishlar-ui";
import { mobileTypeText } from "@/components/ishlar-mobile-list";
import { experienceLabel, jobBenefits, type Job, type JobBenefit } from "@/data/jobs";
import { sourceUrlValue } from "@/lib/add-forms";
import { cn } from "@/lib/utils";

const benefitStyle: Record<JobBenefit, { icon: ReactNode; cls: string }> = {
  rasmiy: { icon: <FileSignature className="size-[18px]" />, cls: "bg-[#e3f6ea] text-[#16a34a]" },
  oqim: { icon: <TrendingUp className="size-[18px]" />, cls: "bg-[#e3eeff] text-[#0066FF]" },
  malaka: { icon: <GraduationCap className="size-[18px]" />, cls: "bg-[#efe7ff] text-[#7c3aed]" },
  jamoa: { icon: <UsersRound className="size-[18px]" />, cls: "bg-[#ffe7ee] text-[#e11d48]" },
  sharoit: { icon: <Sparkles className="size-[18px]" />, cls: "bg-[#fff3df] text-[#d97706]" },
  avtoturargoh: { icon: <Car className="size-[18px]" />, cls: "bg-[#dff7f1] text-[#0d9488]" },
  tushlik: { icon: <UtensilsCrossed className="size-[18px]" />, cls: "bg-[#fff3df] text-[#d97706]" },
  bonus: { icon: <Award className="size-[18px]" />, cls: "bg-[#efe7ff] text-[#7c3aed]" },
};

type Media = { kind: "photo" | "video"; src: string };

/** Mobile vacancy detail (mock 2). Every block renders; missing data shows a neutral state. */
export function JobDetailMobile({ job, applied, applySub, onApply, onMessage }: { job: Job; applied: boolean; applySub: string; onApply: () => void; onMessage: () => void }) {
  const router = useRouter();
  const saved = useSavedJobs();
  const photos = job.photos ?? [];
  const media: Media[] = [...photos.map((src) => ({ kind: "photo" as const, src })), ...(job.video ? [{ kind: "video" as const, src: job.video }] : [])];
  const [idx, setIdx] = useState(0);
  const [video, setVideo] = useState(false);
  const [copied, setCopied] = useState(false);
  const current = photos[Math.min(idx, Math.max(0, photos.length - 1))];
  const years = job.foundedYear ? Math.max(0, new Date().getFullYear() - job.foundedYear) : null;
  const schedule = [job.workDays, job.workHours].filter(Boolean);
  const reqs = job.requirements ?? [];
  const benefits = (job.benefits ?? []).slice(0, 6);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: job.title, text: `${job.title} — ${job.clinic}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className="-mx-4 -mt-4 min-h-dvh bg-[#F4F7FC] pb-[calc(9.5rem+env(safe-area-inset-bottom))]" data-testid="job-detail-mobile">
      {/* Hero */}
      <div className="relative">
        <JobPhoto job={job} src={current} sizes="100vw" priority className="h-[300px] w-full" iconClass="size-14" />
        <div className="absolute inset-x-0 top-0 flex items-center gap-2 px-4" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
          <button type="button" onClick={() => (window.history.length > 1 ? router.back() : router.push("/ishlar"))} className="grid size-10 place-items-center rounded-full bg-white/95 text-[#1a1d26] shadow" aria-label="Orqaga">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={() => saved.toggle(job.id)} className="ml-auto grid size-10 place-items-center rounded-full bg-white/95 text-[#1a1d26] shadow" aria-label="Saqlash" aria-pressed={saved.has(job.id)}>
            <Heart className={cn("size-[19px]", saved.has(job.id) && "fill-[#ef4444] text-[#ef4444]")} />
          </button>
          <button type="button" onClick={() => void share()} className="grid size-10 place-items-center rounded-full bg-white/95 text-[#1a1d26] shadow" aria-label="Ulashish">
            <Share2 className="size-[18px]" />
          </button>
        </div>
        <CategoryBadge job={job} className="absolute bottom-12 left-4 px-2 py-1 text-[11px]" />
        <span className="absolute right-4 bottom-12 inline-flex items-center gap-1 rounded-lg bg-[#0B1220]/60 px-2 py-1 text-[11.5px] font-medium text-white" data-testid="job-media-counter">
          <Images className="size-3.5" />
          {photos.length ? `${Math.min(idx, photos.length - 1) + 1}/${photos.length}` : "0/0"}
        </span>
        {copied ? <span className="absolute inset-x-0 top-16 mx-auto w-fit rounded-full bg-[#0B1220] px-3 py-1.5 text-[12px] text-white">Havola nusxalandi</span> : null}
      </div>

      <div className="relative -mt-8 rounded-t-[26px] bg-[#F4F7FC] px-4 pt-3">
        {/* Thumbnails */}
        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="job-thumbs">
          <div className="flex w-max gap-2">
            {media.length ? (
              media.map((m, i) =>
                m.kind === "photo" ? (
                  <button key={m.src} type="button" onClick={() => setIdx(i)} className={cn("relative h-[62px] w-[82px] overflow-hidden rounded-xl ring-2", i === idx ? "ring-[#0066FF]" : "ring-transparent")} aria-label={`Rasm ${i + 1}`}>
                    <Image src={m.src} alt="" fill sizes="82px" className="object-cover" />
                  </button>
                ) : (
                  <button key="video" type="button" onClick={() => setVideo(true)} className="relative grid h-[62px] w-[82px] place-items-center overflow-hidden rounded-xl bg-[#0B1220] text-white" data-testid="job-video-tile">
                    {photos[0] ? <Image src={photos[0]} alt="" fill sizes="82px" className="object-cover opacity-50" /> : null}
                    <span className="relative grid place-items-center">
                      <span className="grid size-7 place-items-center rounded-full bg-white/90 text-[#0066FF]">
                        <Play className="size-3.5 fill-current" />
                      </span>
                      <span className="mt-0.5 text-[11px] font-semibold">Video</span>
                    </span>
                  </button>
                ),
              )
            ) : (
              <span className="flex h-[62px] items-center gap-2 rounded-xl bg-white px-3 text-[12px] text-[#8b93a7]" data-testid="job-no-photos">
                <Images className="size-4" />
                Ish joyi rasmlari hali joylanmagan
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mt-4 flex items-start gap-2">
          <h1 className="min-w-0 flex-1 text-[22px] leading-tight font-bold tracking-tight text-[#0B1220]">{job.title}</h1>
          <span className="mt-1 shrink-0 rounded-full bg-[#e9eef7] px-2.5 py-1 text-[11px] font-medium text-[#4b5568]">{timeAgo(job)}</span>
        </div>

        {/* Employer */}
        <div className="mt-3 flex items-center gap-3">
          <EmployerLogo job={job} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold text-[#0B1220]">{job.clinic}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[#8b93a7]" data-testid="job-rating">
              <Star className="size-3.5" />
              Hali baho yo‘q
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-[#4b5568]">
              <MapPin className="size-3.5 shrink-0 text-[#8b93a7]" />
              <span className="truncate">{placeText(job)}</span>
              <a href={mapHref(job)} target="_blank" rel="noreferrer" className="ml-auto inline-flex shrink-0 items-center gap-0.5 font-semibold text-[#0066FF]" data-testid="job-map">
                Xaritada ko‘rish
                <ChevronRight className="size-3.5" />
              </a>
            </p>
          </div>
        </div>

        {/* Info chips */}
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="job-info-chips">
          <InfoChip icon={<Wallet className="size-[17px]" />} value={salaryText(job)} label="Maosh" muted={salaryText(job) === "Kelishiladi"} />
          <InfoChip icon={<Briefcase className="size-[17px]" />} value={mobileTypeText[job.type]} label={job.remote ? "Masofaviy" : "Ish turi"} />
          <InfoChip icon={<CalendarDays className="size-[17px]" />} value={schedule[0] ?? "Aniqlanmoqda"} label={schedule[1] ?? "Ish vaqti"} muted={!schedule.length} />
        </div>

        {/* Klinika haqida */}
        <h2 className="mt-5 mb-2 text-[17px] font-bold text-[#0B1220]">Klinika haqida</h2>
        <section className="rounded-[20px] bg-white p-3 shadow-[0_4px_16px_rgba(15,23,42,0.04)]" data-testid="job-employer-card">
          <div className="flex items-center gap-3">
            {job.logo || photos[0] ? (
              <span className="relative h-[64px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-[#f3f7ff]">
                <Image src={(job.logo || photos[0]) as string} alt="" fill sizes="84px" className={job.logo ? "object-contain p-1.5" : "object-cover"} />
              </span>
            ) : (
              <EmployerLogo job={job} size={64} className="rounded-xl" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-[#0B1220]">{job.clinic}</p>
              <p className={cn("mt-0.5 line-clamp-2 text-[12px]", job.employerAbout ? "text-[#6b7487]" : "text-[#8b93a7]")}>{job.employerAbout || "Ish beruvchi qisqacha ma’lumot kiritmagan"}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 border-t border-[#eef1f6] pt-3">
            <MiniStat icon={<UsersRound className="size-[15px]" />} value={job.staffCount ? `${job.staffCount}+` : "—"} label="Xodimlar soni" />
            <MiniStat icon={<CalendarClock className="size-[15px]" />} value={years === null ? "—" : years === 0 ? "1 yildan kam" : `${years} yil`} label="Faoliyat" />
            <MiniStat icon={<MapPin className="size-[15px]" />} value={job.district || job.city} label={job.district ? job.city : "Hudud"} />
          </div>
        </section>

        {/* Tavsif */}
        <Section icon={<FileText className="size-[18px]" />} title="Tavsif">
          <p className="text-[13px] leading-relaxed whitespace-pre-line text-[#4b5568]">{job.description}</p>
          {sourceUrlValue(job.sourceUrl ?? "") ? (
            <a href={sourceUrlValue(job.sourceUrl ?? "")} target="_blank" rel="noopener nofollow" className="mt-2 inline-flex break-all text-[13px] font-semibold text-[#0066FF]" data-testid="job-source-mobile">
              {sourceUrlValue(job.sourceUrl ?? "")}
            </a>
          ) : null}
        </Section>

        {/* Asosiy talablar */}
        <Section icon={<ClipboardList className="size-[18px]" />} title="Asosiy talablar" testId="job-requirements">
          <ul className="space-y-1.5">
            <Req text={experienceLabel(job.experienceYears)} />
            {reqs.map((r) => (
              <Req key={r} text={r} />
            ))}
          </ul>
          {!reqs.length ? <p className="mt-1.5 text-[12px] text-[#8b93a7]">Qo‘shimcha talablar ko‘rsatilmagan.</p> : null}
        </Section>

        {/* Biz taklif qilamiz */}
        <Section icon={<Gift className="size-[18px]" />} title="Biz taklif qilamiz" testId="job-benefits">
          {benefits.length ? (
            <div className="grid grid-cols-3 gap-2">
              {benefits.map((id) => {
                const b = jobBenefits.find((x) => x.id === id);
                if (!b) return null;
                return (
                  <div key={id} className="flex min-w-0 items-center gap-2 rounded-2xl bg-white p-2 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", benefitStyle[id].cls)}>{benefitStyle[id].icon}</span>
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[11.5px] font-semibold text-[#0B1220]">{b.title}</span>
                      <span className="block text-[10px] text-[#8b93a7]">{b.sub}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl bg-white px-3 py-3.5 text-[12.5px] text-[#8b93a7]">Ish beruvchi afzalliklarni hali ko‘rsatmagan.</p>
          )}
        </Section>
      </div>

      {/* Sticky action bar (above the global tab bar) */}
      <div
        className="fixed inset-x-0 z-30 border-t border-[#e6ebf3] bg-white/95 px-3 py-2.5 backdrop-blur-md"
        style={{ bottom: "calc(4.15rem + env(safe-area-inset-bottom))" }}
        data-testid="job-action-bar"
      >
        <div className="flex items-stretch gap-2">
          <button type="button" onClick={() => saved.toggle(job.id)} aria-pressed={saved.has(job.id)} className="flex w-[64px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#f1f4f9] text-[11px] font-medium text-[#4b5568]" data-testid="job-save-bar">
            <Bookmark className={cn("size-5", saved.has(job.id) && "fill-[#0066FF] text-[#0066FF]")} />
            {saved.has(job.id) ? "Saqlandi" : "Saqlash"}
          </button>
          {job.mine ? (
            <Link href="/ishlar/vakansiyalarim" className="flex h-[56px] flex-1 items-center justify-center rounded-2xl bg-[#0066FF] text-[14.5px] font-semibold text-white">
              Mening vakansiyalarim
            </Link>
          ) : applied ? (
            <Link href="/ishlar/arizalarim" className="flex h-[56px] flex-1 flex-col items-center justify-center rounded-2xl bg-[#e7f8ef] leading-tight text-[#15803d]" data-testid="job-applied">
              <span className="flex items-center gap-1 text-[14.5px] font-semibold">
                <Check className="size-4" />
                Ariza yuborilgan
              </span>
              <span className="text-[11px]">Holatini kuzatish</span>
            </Link>
          ) : (
            <button type="button" onClick={onApply} className="flex h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#0066FF] text-white shadow-[0_8px_18px_rgba(0,102,255,0.3)]" data-testid="job-apply">
              <Send className="size-5" />
              <span className="text-left leading-tight">
                <span className="block text-[14.5px] font-semibold">Ariza yuborish</span>
                <span className="block text-[11px] text-white/85">{applySub}</span>
              </span>
            </button>
          )}
          {!job.mine ? (
            <button type="button" onClick={onMessage} className="flex h-[56px] w-[118px] shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-[#eaf1ff] px-2 text-[#0066FF]" data-testid="job-message">
              <MessageCircleMore className="size-5 shrink-0" />
              <span className="text-left leading-tight">
                <span className="block text-[12.5px] font-semibold">Xabar yozish</span>
                <span className="block text-[10px] text-[#4b5568]">Klinikaga yozish</span>
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {video && job.video ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black" role="dialog" aria-modal="true" aria-label="Video">
          <button type="button" onClick={() => setVideo(false)} className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white" aria-label="Yopish">
            <X className="size-5" />
          </button>
          <video src={job.video} controls autoPlay playsInline className="max-h-full w-full" />
        </div>
      ) : null}
    </div>
  );
}

function InfoChip({ icon, value, label, muted }: { icon: ReactNode; value: string; label: string; muted?: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-white py-2.5 pr-3.5 pl-2.5 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#e3eeff] text-[#0066FF]">{icon}</span>
      <span className="leading-tight whitespace-nowrap">
        <span className={cn("block text-[12.5px] font-bold", muted ? "text-[#8b93a7]" : "text-[#0B1220]")}>{value}</span>
        <span className="block text-[10.5px] text-[#8b93a7]">{label}</span>
      </span>
    </div>
  );
}

function MiniStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e3eeff] text-[#0066FF]">{icon}</span>
      <span className="min-w-0 leading-tight">
        <span className={cn("block truncate text-[12.5px] font-bold", value === "—" ? "text-[#8b93a7]" : "text-[#0B1220]")}>{value}</span>
        <span className="block truncate text-[10px] text-[#8b93a7]">{label}</span>
      </span>
    </div>
  );
}

function Section({ icon, title, children, testId }: { icon: ReactNode; title: string; children: ReactNode; testId?: string }) {
  return (
    <section className="mt-5" data-testid={testId}>
      <h2 className="mb-2 flex items-center gap-2 text-[15.5px] font-bold text-[#0B1220]">
        <span className="text-[#0066FF]">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Req({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-[13px] text-[#4b5568]">
      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#0066FF] text-white">
        <Check className="size-2.5" strokeWidth={3.5} />
      </span>
      {text}
    </li>
  );
}
