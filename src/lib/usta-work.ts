import type { RequestService } from "@/data/masters";

export type RequestStatus = "yuborildi" | "jarayonda" | "bajarildi" | "bekor" | "rad";
export type WhenNeed = "bugun" | "ertaga" | "sana";

/** Service request as returned by the server. `masterPhone/masterTelegram` exist only after the master accepted. */
export type UstaRequest = {
  id: string;
  masterId: string;
  masterName: string;
  service: RequestService;
  clinic: string;
  district: string | null;
  address: string | null;
  name: string;
  phone: string;
  note: string | null;
  when: WhenNeed;
  date: string | null;
  createdAt: string;
  status: RequestStatus;
  masterPhone?: string;
  masterTelegram?: string | null;
  services?: string[];
  timeRange?: string | null;
  media?: string[];
  extra?: string | null;
};

export const statusCopy: Record<RequestStatus, { label: string; className: string }> = {
  yuborildi: { label: "Yuborildi", className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80" },
  jarayonda: { label: "Qabul qilindi", className: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80" },
  bajarildi: { label: "Bajarildi", className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80" },
  bekor: { label: "Bekor", className: "bg-slate-100 text-slate-500 ring-1 ring-slate-200/80" },
  rad: { label: "Rad etildi", className: "bg-rose-50 text-rose-800 ring-1 ring-rose-200/80" },
};

export const whenCopy: Record<WhenNeed, string> = {
  bugun: "Bugun",
  ertaga: "Ertaga",
  sana: "Belgilangan sana",
};

export type MyMaster = {
  id: string;
  name: string;
  kind: "usta" | "kompaniya";
  title: string;
  services: string[];
  city: string;
  years: number;
  description: string | null;
  photo: string | null;
  phone: string;
  telegram: string | null;
  status: "pending" | "published" | "rejected" | "hidden";
  rejectReason: string | null;
  jobs: number;
  district?: string | null;
  works?: string[];
};
