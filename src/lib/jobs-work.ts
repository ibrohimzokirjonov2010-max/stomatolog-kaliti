import type { Candidate, Job, JobBenefit, JobCategory, JobType } from "@/data/jobs";

export type JobAppStatus = "yuborildi" | "korilmoqda" | "qabul" | "rad" | "bekor";

/** Vacancy as returned by /api/work/jobs*. The employer phone is present only for the owner. */
export type DbJob = {
  id: string;
  title: string;
  clinic: string;
  city: string;
  salaryMin: number | null;
  salaryMax: number | null;
  type: JobType;
  experienceYears: number;
  remote: boolean;
  description: string;
  status: "draft" | "pending" | "published" | "rejected" | "hidden" | "closed";
  rejectReason: string | null;
  createdAt: string;
  mine: boolean;
  appCount?: number;
  newCount?: number;
  phone?: string;
  category?: JobCategory | null;
  photos?: string[];
  video?: string | null;
  district?: string | null;
  address?: string | null;
  workDays?: string | null;
  workHours?: string | null;
  benefits?: JobBenefit[];
  requirements?: string[];
  employerAbout?: string | null;
  staffCount?: number | null;
  foundedYear?: number | null;
  logo?: string | null;
  duties?: string[];
  salaryNegotiable?: boolean;
  acceptApplications?: boolean;
  benefitNote?: string | null;
  telegram?: string | null;
  email?: string | null;
};

/** Application. `phone` = applicant phone (employer view); `employerPhone` appears for the applicant only after acceptance. */
export type JobApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  clinic: string;
  city: string;
  jobStatus: string;
  name: string;
  telegram: string | null;
  experienceYears: number;
  note: string | null;
  status: JobAppStatus;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  employerPhone?: string;
};

export type DbResume = {
  id: string;
  name: string;
  role: string;
  city: string;
  experienceYears: number;
  salaryFrom: number | null;
  about: string | null;
  published: boolean;
  updatedAt: string;
  mine: boolean;
  phone?: string;
  telegram?: string | null;
};

export type ResumeOffer = { id: string; name: string; phone: string; message: string | null; createdAt: string };

export const appStatusCopy: Record<JobAppStatus, { label: string; className: string }> = {
  yuborildi: { label: "Yuborildi", className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80" },
  korilmoqda: { label: "Ko‘rib chiqilmoqda", className: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80" },
  qabul: { label: "Qabul", className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80" },
  rad: { label: "Rad", className: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80" },
  bekor: { label: "Bekor", className: "bg-slate-100 text-slate-500 ring-1 ring-slate-200/80" },
};

export const ACTIVE_APP_STATUSES: JobAppStatus[] = ["yuborildi", "korilmoqda", "qabul"];

export function isActiveApp(status: JobAppStatus) {
  return ACTIVE_APP_STATUSES.includes(status);
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export function jobFromDb(d: DbJob): Job {
  const days = Math.max(0, Math.floor((Date.now() - new Date(d.createdAt).getTime()) / 86_400_000));
  return {
    id: d.id,
    title: d.title,
    clinic: d.clinic,
    city: d.city,
    salaryMin: d.salaryMin ?? 0,
    salaryMax: d.salaryMax ?? undefined,
    type: d.type,
    experienceYears: d.experienceYears,
    postedDaysAgo: days,
    tags: d.remote ? ["Masofaviy"] : [],
    description: d.description,
    phone: d.phone,
    status: d.status === "closed" ? "yopiq" : "faol",
    remote: d.remote,
    mine: d.mine,
    modStatus: d.status,
    rejectReason: d.rejectReason,
    appCount: d.appCount,
    newCount: d.newCount,
    createdAt: d.createdAt,
    category: d.category ?? null,
    photos: d.photos ?? [],
    video: d.video ?? null,
    district: d.district ?? null,
    address: d.address ?? null,
    workDays: d.workDays ?? null,
    workHours: d.workHours ?? null,
    benefits: d.benefits ?? [],
    requirements: d.requirements ?? [],
    employerAbout: d.employerAbout ?? null,
    staffCount: d.staffCount ?? null,
    foundedYear: d.foundedYear ?? null,
    logo: d.logo ?? null,
    duties: d.duties ?? [],
    salaryNegotiable: d.salaryNegotiable,
    acceptApplications: d.acceptApplications,
    benefitNote: d.benefitNote ?? null,
    telegram: d.telegram ?? null,
    email: d.email ?? null,
  };
}

export function candidateFromDb(d: DbResume): Candidate {
  return {
    id: d.id,
    name: d.name,
    role: d.role,
    city: d.city,
    experienceYears: d.experienceYears,
    salaryFrom: d.salaryFrom ?? 0,
    about: d.about ?? "",
    phone: d.phone,
    mine: d.mine,
  };
}

export type PublishJobInput = {
  title: string;
  clinic: string;
  city: string;
  type: JobType;
  salaryMin: string;
  salaryMax: string;
  experienceYears: string;
  description: string;
  phone: string;
  remote?: boolean;
  category?: JobCategory | "";
  photos?: string[];
  video?: string;
  logo?: string;
  district?: string;
  address?: string;
  workDays?: string;
  workHours?: string;
  benefits?: JobBenefit[];
  requirements?: string[];
  employerAbout?: string;
  staffCount?: string;
  foundedYear?: string;
};

export type ResumeInput = {
  name: string;
  role: string;
  city: string;
  experienceYears: string;
  salaryFrom: string;
  about: string;
  phone: string;
  telegram?: string;
  published?: boolean;
};

export const JOB_MOD_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Moderatsiyada", cls: "bg-[#fffbeb] text-[#92400e]" },
  published: { label: "E’londa", cls: "bg-[#ecfdf3] text-[#15803d]" },
  rejected: { label: "Rad etilgan", cls: "bg-[#fef2f2] text-[#b91c1c]" },
  hidden: { label: "Yashirilgan", cls: "bg-[#f3f5f9] text-[#475569]" },
  closed: { label: "Yopilgan", cls: "bg-[#f3f5f9] text-[#8b93a7]" },
};
