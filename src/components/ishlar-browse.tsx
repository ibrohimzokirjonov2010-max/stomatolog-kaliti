"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Gift,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  X,
} from "lucide-react";
import { IshlarDesktop } from "@/components/ishlar-desktop";
import { IshlarMobileList } from "@/components/ishlar-mobile-list";
import { JobApplyForm } from "@/components/job-apply-form";
import { useJobsWork } from "@/components/jobs-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  clinicBrands,
  experienceFilters,
  experienceLabel,
  jobCities,
  jobHref,
  jobTitles,
  jobTypeLabels,
  postedLabel,
  salaryFilters,
  type Candidate,
  type ClinicBrand,
  type Job,
  type JobType,
} from "@/data/jobs";
import { formatMoney, formatSalaryRange } from "@/lib/format";
import { Modal, PostJobForm, ProfileView, ResumeForm } from "@/components/job-forms";
import { ClinicInitials } from "@/components/clinic-initials";
import { cn } from "@/lib/utils";

type ModalKind = "post" | "resume" | "apply" | "profile" | null;
type RoleChip = "all" | "shifokor" | "assistent" | "texnik" | "admin";

const roleChips: { key: RoleChip; label: string }[] = [
  { key: "all", label: "Barchasi" },
  { key: "shifokor", label: "Shifokor" },
  { key: "assistent", label: "Assistent" },
  { key: "texnik", label: "Texnik" },
  { key: "admin", label: "Admin" },
];

function formatSalaryCompact(min: number, max?: number) {
  const toMln = (n: number) => {
    const mln = n / 1_000_000;
    return Number.isInteger(mln) ? String(mln) : mln.toFixed(1).replace(/\.0$/, "");
  };
  if (!max) return `${toMln(min)}+ mln so‘m`;
  return `${toMln(min)}-${toMln(max)} mln so‘m`;
}

export function IshlarBrowse() {
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const { catalog, resumes, myJobs, hasApplied, resume } = useJobsWork();

  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [salary, setSalary] = useState("");
  const [experience, setExperience] = useState("");
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [activePerson, setActivePerson] = useState<Candidate | null>(null);


  const people = resumes;

  const visible = useMemo(() => {
    const minSalary = salary ? Number(salary) : 0;
    const minExp = experience === "" ? null : Number(experience);
    return catalog.filter((job) => {
      const matchesQ =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.clinic.toLowerCase().includes(q) ||
        job.city.toLowerCase().includes(q);
      const matchesTitle = !title || job.title === title;
      const matchesCity = !city || job.city === city;
      const matchesType = !type || job.type === type;
      const matchesSalary = !minSalary || job.salaryMin >= minSalary;
      const matchesExp =
        minExp === null
          ? true
          : minExp === 0
            ? job.experienceYears === 0
            : job.experienceYears >= minExp;
      return matchesQ && matchesTitle && matchesCity && matchesType && matchesSalary && matchesExp;
    });
  }, [catalog, city, experience, q, salary, title, type]);

  const featured = visible.find((job) => job.featured) ?? visible[0];
  const list = visible.filter((job) => job.id !== featured?.id);
  const shownPeople = showAllCandidates ? people : people.slice(0, 3);

  const filterBadge =
    (city ? 1 : 0) + (type ? 1 : 0) + (salary ? 1 : 0) + (experience ? 1 : 0);

  function clear() {
    setTitle("");
    setCity("");
    setType("");
    setSalary("");
    setExperience("");
  }

  function openApply(job: Job) {
    setActiveJob(job);
    setModal("apply");
  }

  function openProfile(person: Candidate) {
    setActivePerson(person);
    setModal("profile");
  }

  return (
    <div>
      {/* ════════════════════════════════════════════════
          MOBILE LAYOUT (≤768px phone / lg shell)
          ════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <IshlarMobileList onPost={() => setModal("post")} onResume={() => setModal("resume")} onApply={openApply} hasResume={Boolean(resume)} />
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP LAYOUT (≥1024px / lg:)
          ════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <IshlarDesktop
          catalog={catalog}
          people={people}
          hasApplied={hasApplied}
          q={q}
          onPost={() => setModal("post")}
          onResume={() => setModal("resume")}
          onApply={openApply}
          onProfile={openProfile}
        />
      </div>

      {modal === "post" ? (
        <Modal title="Vakansiya joylash" onClose={() => setModal(null)}>
          <PostJobForm onCancel={() => setModal(null)} onDone={() => setModal(null)} />
        </Modal>
      ) : null}
      {modal === "resume" ? (
        <Modal title={resume ? "Rezyumeni tahrirlash" : "Rezyume joylash"} onClose={() => setModal(null)}>
          <ResumeForm
            initial={resume}
            onCancel={() => setModal(null)}
            onDone={() => {
              setShowAllCandidates(true);
              setModal(null);
            }}
          />
        </Modal>
      ) : null}
      {modal === "apply" && activeJob ? (
        <Modal title={`Ariza: ${activeJob.title}`} onClose={() => setModal(null)}>
          <JobApplyForm job={activeJob} onCancel={() => setModal(null)} onSuccess={() => setModal(null)} />
        </Modal>
      ) : null}
      {modal === "profile" && activePerson ? (
        <Modal title="Talabgor profili" onClose={() => setModal(null)}>
          <ProfileView person={activePerson} onClose={() => setModal(null)} />
        </Modal>
      ) : null}
    </div>
  );
}

function FilterBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-[#1a1d26]">{label}</p>
      {children}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 rounded-xl text-[13px] font-semibold",
        active ? "bg-[#0066FF] text-white" : "bg-[#f4f6fa] text-[#4b5568]",
      )}
    >
      {label}
    </button>
  );
}

function FilterSheet({
  title,
  onClose,
  onClear,
  children,
}: {
  title: string;
  onClose: () => void;
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Yopish" onClick={onClose} />
      <div
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white px-4 pt-3 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#e6eaf2]" />
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[16px] font-bold text-[#1a1d26]">{title}</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClear} className="text-sm font-semibold text-[#8b93a7]">
              Tozalash
            </button>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-[#0066FF]">
              Tayyor
            </button>
          </div>
        </div>
        <div className="space-y-4 pb-2">{children}</div>
      </div>
    </div>
  );
}

function FeaturedJob({
  job,
  applied,
  onApply,
}: {
  job: Job;
  applied: boolean;
  onApply: () => void;
}) {
  return (
    <article className="rounded-[16px] bg-[#eaf2ff] px-5 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <ClinicMark brand={job.brand} name={job.clinic} className="size-[72px]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-[22px] font-bold tracking-tight text-[#1a1d26]">
                <Link href={jobHref(job.id)} className="hover:text-primary">
                  {job.title}
                </Link>
              </h3>
              <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-[#4b5568]">
                {job.clinic}
                {job.verified ? <BadgeCheck className="size-4 fill-primary text-white" /> : null}
              </p>
              <p className="mt-2 text-[18px] font-bold text-primary">
                {formatSalaryRange(job.salaryMin, job.salaryMax)}
              </p>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[#4b5568]">
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" />
                {job.city}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                {jobTypeLabels[job.type]}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-primary">{job.experienceYears}+</span>
                yil tajriba
              </li>
            </ul>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-[#4b5568]"
                >
                  {tag}
                </span>
              ))}
            </div>
            {applied ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-emerald-700">Ariza yuborildi</span>
                <Link href={jobHref(job.id)} className="text-[13px] font-semibold text-primary hover:underline">
                  Batafsil
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={jobHref(job.id)}
                  className={cn(buttonVariants({ variant: "outline" }), "h-10 !rounded-xl")}
                >
                  Batafsil
                </Link>
                <Button className="h-10 rounded-xl" onClick={onApply}>
                  Ariza yuborish
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function JobCard({
  job,
  applied,
  onApply,
}: {
  job: Job;
  applied: boolean;
  onApply: () => void;
}) {
  return (
    <article className="flex flex-col rounded-[14px] border border-[#eceff5] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex gap-3">
        <ClinicMark brand={job.brand} name={job.clinic} />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1 text-sm font-semibold text-[#1a1d26]">
            <Link href={jobHref(job.id)} className="hover:text-primary">
              {job.title}
            </Link>
            {job.verified ? <BadgeCheck className="size-3.5 fill-primary text-white" /> : null}
            {job.postedLocal ? (
              <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-semibold text-emerald-700">
                Faol
              </span>
            ) : null}
          </h3>
          <p className="text-[12px] text-[#8b93a7]">{job.clinic}</p>
          <p className="mt-1 text-sm font-bold text-[#1a1d26]">{formatSalaryRange(job.salaryMin, job.salaryMax)}</p>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-[#8b93a7]">
        {job.city}
        <span className="mx-1.5">·</span>
        {postedLabel(job.postedDaysAgo)}
        <span className="mx-1.5">·</span>
        {experienceLabel(job.experienceYears)}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <TypeBadge type={job.type} />
        {applied ? (
          <div className="flex items-center gap-3">
            <span className="text-[13px] font-medium text-emerald-700">Ariza yuborildi</span>
            <Link href={jobHref(job.id)} className="text-[13px] font-semibold text-primary hover:underline">
              Batafsil
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href={jobHref(job.id)} className="text-[13px] font-semibold text-[#4b5568] hover:text-primary">
              Batafsil
            </Link>
            <button
              type="button"
              onClick={onApply}
              className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Ariza yuborish
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
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

function ClinicMark({ brand, name, className }: { brand?: ClinicBrand; name: string; className?: string }) {
  if (!brand) return <ClinicInitials name={name} className={className} />;
  const meta = clinicBrands[brand];
  const large = Boolean(className?.includes("size-[72px]") || className?.includes("size-16"));
  return (
    <span
      className={cn(
        "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-[#eceff5]",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className={large ? "size-6" : "size-5"} fill={meta.color}>
        <path d="M12 3.2c-2.2 0-4 1.6-4 3.6 0 1-.3 2.4-.8 3.8C6.6 12.4 6 14 6 15.4c0 2 1.5 3.4 3.2 3.4 1 0 1.7-.6 2.8-.6s1.8.6 2.8.6c1.7 0 3.2-1.4 3.2-3.4 0-1.4-.6-3-1.2-4.8-.5-1.4-.8-2.8-.8-3.8 0-2-1.8-3.6-4-3.6z" />
      </svg>
      <span
        className={cn(
          "mt-0.5 text-center font-bold tracking-wide",
          large ? "max-w-[64px] text-[8px] leading-tight" : "max-w-[44px] truncate text-[7px]"
        )}
        style={{ color: meta.color }}
      >
        {large ? meta.short : meta.short.split(" ")[0]}
      </span>
    </span>
  );
}

function CandidateAvatar({ person, large = false }: { person: Candidate; large?: boolean }) {
  const size = large ? "size-16" : "size-11";
  if (person.photo) {
    return (
      <Image
        src={person.photo}
        alt=""
        width={large ? 64 : 44}
        height={large ? 64 : 44}
        className={cn(size, "shrink-0 rounded-full object-cover")}
      />
    );
  }
  const initials = person.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      className={cn(
        size,
        "flex shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-sm font-semibold text-primary"
      )}
    >
      {initials}
    </span>
  );
}

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="relative min-w-[140px] flex-1 rounded-[14px] border border-[#e6eaf2] bg-white px-3 py-2">
      <span className="block text-[11px] text-[#8b93a7]">{label}</span>
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 bottom-2.5 size-4 text-slate-400" />
    </label>
  );
}

function NativeSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-0.5 w-full appearance-none bg-transparent pr-5 text-sm font-semibold text-[#1a1d26] outline-none"
    >
      {children}
    </select>
  );
}
