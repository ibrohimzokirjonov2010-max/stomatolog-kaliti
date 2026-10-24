import { orderStatusSteps, type LabMaterial, type LabPriceItem, type LabService } from "@/data/labs";

export type LabOrderStatus = "yangi" | "qabul_qilindi" | "ishlanmoqda" | "tayyor" | "yetkazildi" | "bekor";

/** Order as returned by the server. `labPhone/labTelegram` exist only after the lab accepted (doctor side). */
export type LabOrder = {
  id: string;
  labId: string;
  labName: string;
  service: LabService;
  material: LabMaterial;
  patientCode: string;
  dueDays: number;
  phone: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  status: LabOrderStatus;
  doctorName: string | null;
  labPhone?: string;
  labTelegram?: string | null;
};

export type MyLab = {
  id: string;
  name: string;
  city: string;
  services: LabService[];
  materials: LabMaterial[];
  description: string | null;
  days: number | null;
  priceFrom: number | null;
  photo: string | null;
  phone: string;
  telegram: string | null;
  status: "pending" | "published" | "rejected" | "hidden";
  rejectReason: string | null;
  done: number;
  district: string | null;
  photos: string[];
  video: string | null;
  logo: string | null;
  years: number | null;
  courier: "ha" | "yoq" | null;
  courierArea: string | null;
  portfolio: string[];
  priceItems: LabPriceItem[];
  verified: boolean;
};

export const orderStatusCopy: Record<LabOrderStatus, { label: string; className: string }> = {
  yangi: { label: "Yuborildi", className: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80" },
  qabul_qilindi: { label: "Qabul qilindi", className: "bg-[#F0FDFA] text-[#115E59] ring-1 ring-[#99F6E4]/80" },
  ishlanmoqda: { label: "Ishlanmoqda", className: "bg-[#F0FDFA] text-[#115E59] ring-1 ring-[#99F6E4]/80" },
  tayyor: { label: "Tayyor", className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80" },
  yetkazildi: { label: "Yetkazildi", className: "bg-[#F0FDFA] text-[#115E59] ring-1 ring-[#99F6E4]/80" },
  bekor: { label: "Bekor", className: "bg-slate-100 text-slate-500 ring-1 ring-slate-200/80" },
};

export const dueDayOptions = [5, 7, 10, 14] as const;

/** Next status the LAB can move to (null = final). */
export function nextOrderStatus(status: LabOrderStatus): LabOrderStatus | null {
  if (status === "yangi") return "qabul_qilindi";
  if (status === "qabul_qilindi") return "ishlanmoqda";
  if (status === "ishlanmoqda") return "tayyor";
  if (status === "tayyor") return "yetkazildi";
  return null;
}

export const nextActionLabel: Partial<Record<LabOrderStatus, string>> = {
  yangi: "Qabul qilish",
  qabul_qilindi: "Ishni boshlash",
  ishlanmoqda: "Tayyor deb belgilash",
  tayyor: "Yetkazildi",
};

/** Doctor may cancel only before work starts. */
export function canDoctorCancel(status: LabOrderStatus) {
  return status === "yangi" || status === "qabul_qilindi";
}
export function canLabDecline(status: LabOrderStatus) {
  return status === "yangi" || status === "qabul_qilindi" || status === "ishlanmoqda";
}

export function orderStepIndex(status: LabOrderStatus) {
  if (status === "bekor") return -1;
  return orderStatusSteps.findIndex((step) => step.id === status);
}

export function latestActiveOrder(orders: LabOrder[]) {
  return (
    orders.find((row) => row.status !== "yetkazildi" && row.status !== "bekor") ??
    orders.find((row) => row.status === "yetkazildi") ??
    null
  );
}
