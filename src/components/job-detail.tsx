"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BadgeCheck, Clock, MapPin, Phone } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { JobApplyForm } from "@/components/job-apply-form";
import { JobDetailMobile } from "@/components/job-detail-mobile";
import { useJobsWork } from "@/components/jobs-provider";
import {
  experienceLabel,
  jobTypeLabels,
  postedLabel,
  type ClinicBrand,
  type JobType,
} from "@/data/jobs";
import { formatSalaryRange } from "@/lib/format";
import { instagramHref, instagramValue, sourceUrlValue } from "@/lib/add-forms";
import { ClinicInitials } from "@/components/clinic-initials";
import { cn } from "@/lib/utils";

function ClinicMark({ brand, name, className }: { brand?: ClinicBrand; name: string; className?: string }) {
  if (!brand) return <ClinicInitials name={name} className={cn("size-16 text-[18px]", className)} />;
  const meta = {
    smile: { short: "SMILE DENTAL", color: "#2563eb" },
    lux: { short: "LUX DENTAL", color: "#3b82f6" },
    alpha: { short: "ALPHA DENTAL", color: "#0f766e" },
    zubr: { short: "ZUBR DENTAL", color: "#ea580c" },
    medplus: { short: "MEDPLUS", color: "#4f46e5" },
  }[brand];
  return (
    <span
      className={cn(
        "flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#eceff5]",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-6" fill={meta.color}>
        <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
      </svg>
      <span className="mt-0.5 max-w-[64px] text-center text-[8px] font-bold leading-tight tracking-wide" style={{ color: meta.color }}>
        {meta.short}
      </span>
    </span>
  );
}

export function JobDetail({ id }: { id: string }) {
  const { getById, hasApplied, ready, resume } = useJobsWork();
  const job = getById(id);
  const [applyOpen, setApplyOpen] = useState(false);
  const [messageMode, setMessageMode] = useState(false);

  if (ready && !job) {
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-16 text-center">
        <p className="text-[16px] font-semibold text-[#1a1d26]">Vakansiya topilmadi</p>
        <p className="mt-1 text-sm text-[#8b93a7]">E’lon o‘chirilgan yoki havola eskirgan bo‘lishi mumkin.</p>
        <Link href="/ishlar" className={cn(buttonVariants(), "mt-5 h-10 !rounded-xl")}>
          Ishlar
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-[16px] border border-[#eceff5] bg-white px-6 py-12 text-center text-sm text-[#8b93a7]">
        Yuklanmoqda…
      </div>
    );
  }

  const applied = hasApplied(job.id);

  return (
    <div>
      <div className="lg:hidden">
        <JobDetailMobile
          job={job}
          applied={applied}
          applySub={resume ? "Rezyume bilan" : "Bepul · tez javob"}
          onApply={() => {
            setMessageMode(false);
            setApplyOpen(true);
          }}
          onMessage={() => {
            setMessageMode(true);
            setApplyOpen(true);
          }}
        />
      </div>
      <div className="hidden lg:block">
      <Link
        href="/ishlar"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" />
        Barcha vakansiyalar
      </Link>

      <article className="rounded-[16px] border border-[#eceff5] bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <ClinicMark brand={job.brand} name={job.clinic} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {job.postedLocal ? (
                  <span className="mb-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Faol
                  </span>
                ) : null}
                <h1 className="text-[22px] font-bold tracking-tight text-[#0B1F4D] lg:text-[#1a1d26]">{job.title}</h1>
                <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-[#4b5568]">
                  {job.clinic}
                  {job.verified ? <BadgeCheck className="size-4 fill-primary text-white" /> : null}
                </p>
                <p className="mt-2 text-[18px] font-bold text-primary">
                  {formatSalaryRange(job.salaryMin, job.salaryMax)}
                </p>
              </div>
              <TypeBadge type={job.type} />
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#4b5568]">
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                {job.city}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                {jobTypeLabels[job.type]}
              </li>
              <li>{experienceLabel(job.experienceYears)}</li>
              <li className="text-[#8b93a7]">{postedLabel(job.postedDaysAgo)}</li>
            </ul>
          </div>
        </div>

        {job.tags.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {job.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-[#f4f7fb] px-2.5 py-1 text-[12px] font-medium text-[#4b5568]">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-5 border-t border-[#eceff5] pt-5">
          <h2 className="text-[15px] font-semibold text-[#1a1d26]">Tavsif</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#4b5568]">{job.description}</p>
        </div>

        {job.phone || job.telegram || job.email || sourceUrlValue(job.sourceUrl ?? "") || instagramHref(job.instagram ?? "") ? (
          <p className="mt-4 inline-flex flex-wrap items-center gap-2 text-sm text-[#4b5568]">
            <Phone className="size-4 text-primary" />
            {job.phone ? (
            <a href={`tel:${job.phone.replace(/\s/g, "")}`} className="font-medium text-primary hover:underline">
              {job.phone}
            </a>
            ) : null}
            {job.telegram ? <span>@{job.telegram.replace(/^@/, "")}</span> : null}
            {job.email ? <span>{job.email}</span> : null}
            {sourceUrlValue(job.sourceUrl ?? "") ? (
              <a href={sourceUrlValue(job.sourceUrl ?? "")} target="_blank" rel="noopener nofollow" className="font-medium text-primary hover:underline break-all" data-testid="job-source">
                {sourceUrlValue(job.sourceUrl ?? "")}
              </a>
            ) : null}
            {instagramHref(job.instagram ?? "") ? (
              <a href={instagramHref(job.instagram ?? "")} target="_blank" rel="noopener nofollow" className="font-medium text-primary hover:underline break-all" data-testid="job-instagram">
                {instagramValue(job.instagram ?? "")}
              </a>
            ) : null}
            {job.mine ? <Link href={`/ishlar/yangi?id=${job.id}`} className="font-semibold text-primary">Tahrirlash</Link> : null}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {job.mine ? (
            <>
              <span className="text-sm font-medium text-[#4b5568]">Bu sizning vakansiyangiz</span>
              <Link href="/ishlar/vakansiyalarim" className="text-[13px] font-semibold text-primary hover:underline">
                Mening vakansiyalarim
              </Link>
            </>
          ) : applied ? (
            <>
              <span className="text-sm font-medium text-emerald-700">Ariza yuborildi</span>
              <Link href="/ishlar/arizalarim" className="text-[13px] font-semibold text-primary hover:underline">
                Mening arizalarim
              </Link>
            </>
          ) : (
            <Button className="h-12 w-full rounded-2xl bg-[#0066FF] text-[15px] font-semibold shadow-[0_4px_12px_rgba(0,102,255,0.22)] sm:h-10 sm:w-auto sm:rounded-xl sm:text-sm sm:shadow-none" onClick={() => setApplyOpen(true)}>
              Ariza yuborish
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </article>
      </div>

      {applyOpen ? (
        <div className="fixed inset-0 z-[65] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-apply-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id="job-apply-title" className="text-lg font-semibold">
                {messageMode ? "Klinikaga xabar" : `Ariza: ${job.title}`}
              </h2>
              <button type="button" onClick={() => setApplyOpen(false)} className="text-sm text-muted-foreground">
                Yopish
              </button>
            </div>
            <JobApplyForm job={job} focusNote={messageMode} onCancel={() => setApplyOpen(false)} onSuccess={() => setApplyOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TypeBadge({ type }: { type: JobType }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        type === "full" && "bg-emerald-50 text-emerald-700",
        type === "part" && "bg-orange-50 text-orange-700",
        type === "shift" && "bg-amber-50 text-amber-700",
        type === "freelance" && "bg-violet-50 text-violet-700",
        type === "amaliyot" && "bg-sky-50 text-sky-700",
      )}
    >
      {jobTypeLabels[type]}
    </span>
  );
}
