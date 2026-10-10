export type JobType = "full" | "part" | "shift" | "freelance" | "amaliyot";

/** Vacancy segment shown on the mobile list (Klinika = clinic staff, Texnik = technicians, Shifokor = doctors). */
export type JobCategory = "klinika" | "texnik" | "shifokor";

export const jobCategoryLabels: Record<JobCategory, string> = { klinika: "Klinika", texnik: "Texnik", shifokor: "Shifokor" };

/** Benefit tiles for "Biz taklif qilamiz" (stored as ids on the vacancy). */
export const jobBenefits = [
  { id: "rasmiy", title: "Rasmiy ishga qabul", sub: "Shartnoma asosida" },
  { id: "oqim", title: "Doimiy oqim", sub: "Bemorlar bilan" },
  { id: "malaka", title: "Malaka oshirish", sub: "Seminar va treninglar" },
  { id: "jamoa", title: "Do‘stona jamoa", sub: "Professional muhit" },
  { id: "sharoit", title: "Qulay sharoit", sub: "Zamonaviy uskunalar" },
  { id: "avtoturargoh", title: "Avtoturargoh", sub: "Klinika yonida" },
  { id: "tushlik", title: "Tushlik", sub: "Ish joyida" },
  { id: "bonus", title: "Bonuslar", sub: "Natijaga qarab" },
] as const;
export type JobBenefit = (typeof jobBenefits)[number]["id"];
export const JOB_BENEFIT_IDS = jobBenefits.map((b) => b.id) as JobBenefit[];

/** Category stored on the vacancy, or a best guess from the title for older vacancies without one. */
export function jobCategoryOf(job: { category?: JobCategory | null; title: string }): JobCategory {
  if (job.category) return job.category;
  const t = job.title.toLowerCase();
  if (/texnik|laborant|cad|tish texnigi/.test(t)) return "texnik";
  if (/assistent|hamshira|admin|menejer|resepsion|reception|kassir|sanitar/.test(t)) return "klinika";
  return "shifokor";
}

export type ClinicBrand = "smile" | "lux" | "alpha" | "zubr" | "medplus";

export type Job = {
  id: string;
  title: string;
  clinic: string;
  brand?: ClinicBrand;
  city: string;
  salaryMin: number;
  salaryMax?: number;
  type: JobType;
  experienceYears: number;
  postedDaysAgo: number;
  tags: string[];
  featured?: boolean;
  verified?: boolean;
  description: string;
  phone?: string;
  status?: "faol" | "yopiq";
  postedLocal?: boolean;
  /** Masofaviy (remote) ish */
  remote?: boolean;
  demo?: true;
  createdAt?: string;
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
  /** DB state (owner view) */
  mine?: boolean;
  modStatus?: string;
  rejectReason?: string | null;
  appCount?: number;
  newCount?: number;
};

export type Candidate = {
  id: string;
  name: string;
  role: string;
  city: string;
  experienceYears: number;
  salaryFrom: number;
  verified?: boolean;
  photo?: string;
  about: string;
  phone?: string;
  fileName?: string;
  mine?: boolean;
  demo?: true;
};

export const jobTypeLabels: Record<JobType, string> = {
  full: "To‘liq ish kuni",
  part: "Yarim stavka",
  shift: "Smena",
  freelance: "Freelance",
  amaliyot: "Amaliyot",
};

export const clinicBrands: Record<
  ClinicBrand,
  { name: string; short: string; color: string }
> = {
  smile: { name: "Smile Dental", short: "SMILE DENTAL", color: "#2563eb" },
  lux: { name: "Lux Dental", short: "LUX DENTAL", color: "#3b82f6" },
  alpha: { name: "Alpha Dental", short: "ALPHA DENTAL", color: "#0f766e" },
  zubr: { name: "Zubr Dental", short: "ZUBR DENTAL", color: "#ea580c" },
  medplus: { name: "MedPlus", short: "MEDPLUS", color: "#4f46e5" },
};

export const jobTitles = [
  "Implantolog",
  "Ortodont",
  "Stomatolog terapevt",
  "Implantolog assistent",
  "Stomatolog assistent",
  "Hamshira",
  "Pediatr stomatolog",
  "Stomatolog-ortoped",
  "Klinika administratori",
  "Stomatolog konsultant (masofaviy)",
] as const;

export const jobCities = ["Toshkent", "Samarqand", "Buxoro", "Namangan"] as const;

export const salaryFilters = [
  { value: "", label: "Har qanday" },
  { value: "5000000", label: "5 000 000+" },
  { value: "10000000", label: "10 000 000+" },
  { value: "15000000", label: "15 000 000+" },
] as const;

export const experienceFilters = [
  { value: "", label: "Barcha tajriba" },
  { value: "0", label: "Talab etilmaydi" },
  { value: "1", label: "1+ yil" },
  { value: "3", label: "3+ yil" },
  { value: "5", label: "5+ yil" },
] as const;

/** Vacancies and resumes now live in the database (see /api/work/jobs, /api/work/resumes). No bundled demo data. */
export const jobs: Job[] = [];

export const candidates: Candidate[] = [];

export function experienceLabel(years: number, forJob = true) {
  if (years <= 0) return forJob ? "Tajriba talab etilmaydi" : "Tajribasiz";
  return `${years}+ yil tajriba`;
}

export function postedLabel(days: number) {
  if (days <= 0) return "Bugun";
  if (days === 1) return "1 kun oldin";
  return `${days} kun oldin`;
}

export function getJob(id: string) {
  return jobs.find((job) => job.id === id);
}

export function jobHref(id: string) {
  return `/ishlar/${id}`;
}

/** Founder listing screenshot count (demo catalog). */
export const JOB_CATALOG_COUNT = 128;
