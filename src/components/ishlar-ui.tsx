"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { jobCategoryLabels, jobCategoryOf, type Job, type JobCategory } from "@/data/jobs";
import { cn } from "@/lib/utils";

const SAVED_KEY = "sh_saved_jobs";

/** Saved vacancies — kept on this device (there is no server-side "saved jobs" table). */
export function useSavedJobs() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once
      if (Array.isArray(raw)) setIds(raw.filter((x) => typeof x === "string"));
    } catch {
      /* ignore */
    }
  }, []);
  const toggle = useCallback((id: string) => {
    setIds((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, 200);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return { has: (id: string) => ids.includes(id), toggle };
}

export const categoryBadge: Record<JobCategory, string> = {
  klinika: "bg-[#22c55e]",
  texnik: "bg-[#7c3aed]",
  shifokor: "bg-[#0066FF]",
};

export function CategoryBadge({ job, className }: { job: Job; className?: string }) {
  const c = jobCategoryOf(job);
  return <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] leading-none font-semibold text-white", categoryBadge[c], className)}>{jobCategoryLabels[c]}</span>;
}

/** "2 soat oldin" from an ISO timestamp (falls back to days). */
export function timeAgo(job: Job) {
  if (!job.createdAt) return job.postedDaysAgo <= 0 ? "Bugun" : `${job.postedDaysAgo} kun oldin`;
  const mins = Math.max(0, Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 60_000));
  if (mins < 2) return "Hozirgina";
  if (mins < 60) return `${mins} daqiqa oldin`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} kun oldin`;
  return `${Math.floor(days / 30)} oy oldin`;
}

const mln = (n: number) => {
  const v = n / 1_000_000;
  return v >= 1 ? (Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, "")) : (n / 1000).toFixed(0) + " ming";
};

/** Real salary range or "Kelishiladi" (never invented). */
export function salaryText(job: Job) {
  const min = job.salaryMin || 0;
  const max = job.salaryMax || 0;
  const unit = (n: number) => (n >= 1_000_000 ? " mln so‘m" : " so‘m");
  if (min && max) return `${mln(min)}–${mln(max)}${unit(max)}`;
  if (min) return `${mln(min)}+${unit(min)}`;
  if (max) return `${mln(max)}${unit(max)}gacha`;
  return "Kelishiladi";
}

export function placeText(job: Job) {
  return [job.city, job.district].filter(Boolean).join(", ");
}

export function mapHref(job: Job) {
  const q = [job.address, job.district, job.city, "Uzbekistan"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** First vacancy photo, or a neutral clinic placeholder (never a stock "fake" photo). */
export function JobPhoto({ job, src, sizes, priority, className, iconClass }: { job: Job; src?: string; sizes: string; priority?: boolean; className?: string; iconClass?: string }) {
  const url = src ?? job.photos?.[0];
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-[#e6efff] to-[#f3f7ff]", className)}>
      {url ? (
        <Image src={url} alt={`${job.clinic} — ${job.title}`} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[#9db8ea]" data-testid="job-photo-placeholder">
          <Building2 className={cn("size-9", iconClass)} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}

export function EmployerLogo({ job, size = 48, className }: { job: Job; size?: number; className?: string }) {
  const initials = job.clinic
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-[#e6ebf3]", className)} style={{ width: size, height: size }}>
      {job.logo ? (
        <Image src={job.logo} alt={`${job.clinic} logotipi`} fill sizes={`${size}px`} className="object-contain p-1" />
      ) : (
        <span className="text-[14px] font-bold text-[#0066FF]" style={{ fontSize: Math.round(size * 0.32) }}>
          {initials}
        </span>
      )}
    </span>
  );
}
