import { buildPatients, type Patient, type ToothState } from "@/data/crm";
import {
  PHONE_PATIENTS_KEY,
  findPhonePatient,
  phonePatients,
  relDateLabel,
  readPhoneStore,
  writePhoneStore,
  type PhonePatient,
} from "@/data/phone14";

export const HIDDEN_PATIENTS_KEY = "sk-phone14-hidden-patients";
export const TEETH_KEY = "sk-phone14-teeth";
export const XRAY_KEY = "sk-phone14-xrays";
export const CLINIC_PLANS_KEY = "sk-phone14-clinic-plans";
export const CLINIC_PAYS_KEY = "sk-phone14-clinic-pays";
export const CLINIC_VISITS_KEY = "sk-phone14-clinic-visits";

export type ToothStatus = "sog" | "plomba" | "endo" | "krona" | "implant" | "gone" | "karies";

export type ClinicVisit = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  procedure: string;
  doctor: string;
  tooth: string;
  notes: string;
  cost: number;
  status: string;
  unpaid?: boolean;
};

export type ClinicService = { name: string; tooth: string; price: number; done: boolean };

export type ClinicPlan = {
  id: string;
  patientId: string;
  name: string;
  doctor: string;
  date: string;
  status: string;
  done: number;
  stages: number;
  total: number;
  paid: number;
  services: ClinicService[];
};

export type ClinicPayment = {
  id: string;
  patientId: string;
  date: string;
  amount: number;
  method: string;
  plan: string;
  receipt: string;
};

export type ClinicXray = {
  id: string;
  patientId: string;
  date: string;
  type: "Panoramik" | "Periapikal" | "KT";
  tooth: string;
  src: string;
};

export const TOOTH_OPTIONS: { id: ToothStatus; label: string }[] = [
  { id: "sog", label: "Sog‘lom" },
  { id: "plomba", label: "Plomba" },
  { id: "endo", label: "Endo" },
  { id: "krona", label: "Krona" },
  { id: "implant", label: "Implant" },
  { id: "gone", label: "Olib tashlangan" },
  { id: "karies", label: "Karies" },
];

export function toothLabel(status: ToothStatus | undefined) {
  return TOOTH_OPTIONS.find((item) => item.id === status)?.label ?? "Sog‘lom";
}

function xraySvg(title: string, tone: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
    <rect width="640" height="420" fill="#141414"/>
    <ellipse cx="320" cy="210" rx="250" ry="92" fill="${tone}" opacity="0.9"/>
    <ellipse cx="320" cy="228" rx="210" ry="46" fill="#1c1c1c"/>
    ${Array.from({ length: 14 }, (_, i) => {
      const x = 90 + i * 34;
      return `<rect x="${x}" y="168" width="22" height="58" rx="8" fill="#d5d5d5" opacity="0.85"/>`;
    }).join("")}
    <text x="24" y="36" fill="#cfcfcf" font-family="sans-serif" font-size="22">${title}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const SEED_TEETH: Record<string, { adult: Record<string, ToothStatus>; child: Record<string, ToothStatus> }> = {
  "b-0012": { adult: { "16": "implant", "14": "plomba", "11": "endo", "26": "krona", "36": "karies", "46": "plomba" }, child: {} },
  "b-0013": { adult: { "16": "implant", "26": "krona", "36": "karies" }, child: {} },
  "b-0014": { adult: { "11": "endo", "21": "karies" }, child: {} },
  "b-0015": { adult: { "16": "karies" }, child: { "55": "karies", "75": "plomba", "64": "karies" } },
  "b-0016": { adult: { "11": "krona", "21": "krona", "12": "plomba" }, child: {} },
  "b-0017": { adult: { "26": "krona", "36": "gone", "46": "plomba" }, child: {} },
};

const SEED_VISITS: ClinicVisit[] = [
  { id: "v1", patientId: "b-0012", date: relDateLabel(-3), time: "10:24", procedure: "Endodontik davolash", doctor: "Dr. Ibrohim", tooth: "11", notes: "Kanal tozalash va vaqtinchalik plomba", cost: 1_200_000, status: "Yakunlangan" },
  { id: "v2", patientId: "b-0012", date: relDateLabel(-18), time: "15:10", procedure: "Konsultatsiya", doctor: "Dr. Aziza", tooth: "11", notes: "Shikoyat: og‘riq, sovuqqa sezgirlik", cost: 150_000, status: "Yakunlangan" },
  { id: "v3", patientId: "b-0012", date: relDateLabel(-40), time: "11:40", procedure: "Professional gigiyena", doctor: "Dr. Ibrohim", tooth: "—", notes: "Tozalash va Air Flow", cost: 250_000, status: "Yakunlangan" },
  { id: "v4", patientId: "b-0012", date: relDateLabel(-70), time: "09:20", procedure: "Reja tuzish", doctor: "Dr. Kamron", tooth: "16", notes: "Implant rejasini muhokama qilish", cost: 0, status: "Rejalashtirilgan" },
  { id: "v5", patientId: "b-0013", date: relDateLabel(-12), time: "11:00", procedure: "Implant nazorati", doctor: "Dr. Ibrohim", tooth: "16", notes: "Yumshoq to‘qima tinch, shish yo‘q", cost: 200_000, status: "Yakunlangan" },
  { id: "v6", patientId: "b-0013", date: relDateLabel(-29), time: "14:30", procedure: "Krona namunasi", doctor: "Dr. Kamron", tooth: "26", notes: "Rang va tishlash tekshirildi", cost: 0, status: "Davom etmoqda" },
  { id: "v7", patientId: "b-0014", date: relDateLabel(-6), time: "16:45", procedure: "Birinchi konsultatsiya", doctor: "Dr. Aziza", tooth: "11", notes: "Og‘riq, rentgen tavsiya etildi", cost: 150_000, status: "Yakunlangan" },
  { id: "v8", patientId: "b-0015", date: relDateLabel(-7), time: "14:00", procedure: "Ortodontik ko‘rik", doctor: "Dr. Aziza", tooth: "55", notes: "Breket oldidan gigiyena", cost: 180_000, status: "Yakunlangan" },
  { id: "v9", patientId: "b-0016", date: relDateLabel(-16), time: "12:15", procedure: "Veneer topshirish", doctor: "Dr. Kamron", tooth: "11", notes: "Bemor natijadan mamnun", cost: 2_400_000, status: "Yakunlangan" },
  { id: "v10", patientId: "b-0017", date: relDateLabel(-9), time: "10:40", procedure: "Krona sementlash", doctor: "Dr. Ibrohim", tooth: "26", notes: "Okklyuziya tuzatildi", cost: 1_100_000, status: "Yakunlangan" },
];

const SEED_PLANS: ClinicPlan[] = [
  {
    id: "dp-0012",
    patientId: "b-0012",
    name: "Implant va protetik davolash",
    doctor: "Dr. Ibrohim",
    date: relDateLabel(-5),
    status: "Davom etmoqda",
    done: 2,
    stages: 5,
    total: 12_500_000,
    paid: 4_000_000,
    services: [
      { name: "Konsultatsiya", tooth: "—", price: 150_000, done: true },
      { name: "Endodontik davolash", tooth: "11", price: 1_200_000, done: true },
      { name: "Implant qo‘yish", tooth: "16", price: 8_000_000, done: false },
      { name: "Krona (keramika)", tooth: "26", price: 2_500_000, done: false },
      { name: "Nazorat", tooth: "16", price: 650_000, done: false },
    ],
  },
  {
    id: "dp-0013",
    patientId: "b-0013",
    name: "Implant va krona",
    doctor: "Dr. Kamron",
    date: relDateLabel(-29),
    status: "Davom etmoqda",
    done: 1,
    stages: 3,
    total: 9_200_000,
    paid: 1_800_000,
    services: [
      { name: "Implant", tooth: "16", price: 6_500_000, done: true },
      { name: "Abutment", tooth: "16", price: 700_000, done: false },
      { name: "Krona", tooth: "26", price: 2_000_000, done: false },
    ],
  },
  {
    id: "dp-0014",
    patientId: "b-0014",
    name: "Endodontiya va plomba",
    doctor: "Dr. Aziza",
    date: relDateLabel(-6),
    status: "Rejalashtirilgan",
    done: 0,
    stages: 2,
    total: 1_650_000,
    paid: 150_000,
    services: [
      { name: "Endodontiya", tooth: "11", price: 1_200_000, done: false },
      { name: "Plomba", tooth: "21", price: 450_000, done: false },
    ],
  },
  {
    id: "dp-0015",
    patientId: "b-0015",
    name: "Ortodontik davolash",
    doctor: "Dr. Aziza",
    date: relDateLabel(-7),
    status: "Davom etmoqda",
    done: 1,
    stages: 4,
    total: 6_000_000,
    paid: 1_500_000,
    services: [
      { name: "Diagnostika", tooth: "55", price: 400_000, done: true },
      { name: "Breket", tooth: "—", price: 4_200_000, done: false },
      { name: "Nazorat", tooth: "—", price: 800_000, done: false },
      { name: "Retainer", tooth: "—", price: 600_000, done: false },
    ],
  },
  {
    id: "dp-0016",
    patientId: "b-0016",
    name: "Estetik veneer",
    doctor: "Dr. Kamron",
    date: relDateLabel(-16),
    status: "Yakunlangan",
    done: 3,
    stages: 3,
    total: 4_800_000,
    paid: 4_800_000,
    services: [
      { name: "Veneer", tooth: "11", price: 2_400_000, done: true },
      { name: "Veneer", tooth: "21", price: 2_400_000, done: true },
    ],
  },
  {
    id: "dp-0017",
    patientId: "b-0017",
    name: "Krona va protez",
    doctor: "Dr. Ibrohim",
    date: relDateLabel(-9),
    status: "Davom etmoqda",
    done: 2,
    stages: 3,
    total: 3_400_000,
    paid: 1_100_000,
    services: [
      { name: "Krona", tooth: "26", price: 1_800_000, done: true },
      { name: "Plomba", tooth: "46", price: 450_000, done: true },
      { name: "Protez", tooth: "36", price: 1_150_000, done: false },
    ],
  },
];

const SEED_PAYS: ClinicPayment[] = [
  { id: "pay-12a", patientId: "b-0012", date: relDateLabel(-5), amount: 2_500_000, method: "Karta", plan: "Implant va protetik davolash", receipt: "CHK-1042" },
  { id: "pay-12b", patientId: "b-0012", date: relDateLabel(-18), amount: 1_500_000, method: "Naqd", plan: "Implant va protetik davolash", receipt: "CHK-0988" },
  { id: "pay-13", patientId: "b-0013", date: relDateLabel(-12), amount: 1_800_000, method: "Click", plan: "Implant va krona", receipt: "CHK-1101" },
  { id: "pay-14", patientId: "b-0014", date: relDateLabel(-6), amount: 150_000, method: "Payme", plan: "Endodontiya va plomba", receipt: "CHK-1114" },
  { id: "pay-15", patientId: "b-0015", date: relDateLabel(-7), amount: 1_500_000, method: "Naqd", plan: "Ortodontik davolash", receipt: "CHK-1090" },
  { id: "pay-16", patientId: "b-0016", date: relDateLabel(-16), amount: 4_800_000, method: "Karta", plan: "Estetik veneer", receipt: "CHK-1004" },
  { id: "pay-17", patientId: "b-0017", date: relDateLabel(-9), amount: 1_100_000, method: "Click", plan: "Krona va protez", receipt: "CHK-1077" },
];

const SEED_XRAYS: ClinicXray[] = [
  { id: "xr1", patientId: "b-0012", date: relDateLabel(-5), type: "Panoramik", tooth: "—", src: xraySvg("Panoramik · Malika", "#d0d0d0") },
  { id: "xr2", patientId: "b-0012", date: relDateLabel(-18), type: "Periapikal", tooth: "11", src: xraySvg("Periapikal · 11", "#c8c8c8") },
  { id: "xr3", patientId: "b-0012", date: relDateLabel(-40), type: "KT", tooth: "16", src: xraySvg("KT · 16", "#b5b5b5") },
];

const DESK_TOOTH: Record<ToothState, ToothStatus> = {
  soglom: "sog",
  davolanmoqda: "karies",
  davolangan: "plomba",
  muammo: "karies",
  kariyes: "karies",
  plomba: "plomba",
  endo: "endo",
  implant: "implant",
  koronka: "krona",
  ekstraksiya: "gone",
};

function hiddenIds() {
  return new Set(readPhoneStore<string>(HIDDEN_PATIENTS_KEY));
}

export function listPhonePatients() {
  const hidden = hiddenIds();
  const extra = readPhoneStore<PhonePatient>(PHONE_PATIENTS_KEY);
  const ids = new Set(extra.map((item) => item.id));
  return [...extra, ...phonePatients.filter((item) => !ids.has(item.id))].filter((item) => !hidden.has(item.id));
}

export function hidePhonePatient(id: string) {
  const extra = readPhoneStore<PhonePatient>(PHONE_PATIENTS_KEY);
  if (extra.some((item) => item.id === id)) {
    writePhoneStore(PHONE_PATIENTS_KEY, extra.filter((item) => item.id !== id));
    return;
  }
  const hidden = readPhoneStore<string>(HIDDEN_PATIENTS_KEY);
  if (!hidden.includes(id)) writePhoneStore(HIDDEN_PATIENTS_KEY, [...hidden, id]);
}

function fromDesktop(item: Patient): PhonePatient {
  const status = item.status === "yangi" ? "yangi" : item.status === "kuzatuvda" ? "kuzatuvda" : item.status === "nofaol" ? "yakun" : "davolanishda";
  const labels = { yangi: "Yangi", davolanishda: "Davolanishda", kuzatuvda: "Kuzatuvda", yakun: "Yakunlangan" } as const;
  return {
    id: item.id,
    name: item.name,
    num: item.id.toUpperCase(),
    age: item.age,
    gender: item.gender,
    phone: item.phone,
    status,
    statusLabel: labels[status],
    last: item.lastVisit || "—",
    next: item.nextVisit || "—",
    tags: item.conditions?.length ? item.conditions : [labels[status]],
    online: false,
    avatar: item.avatar,
    city: item.city,
  };
}

export function resolvePhonePatient(rawId: string): PhonePatient | null {
  const id = decodeURIComponent(rawId).trim().toLowerCase();
  const people = typeof window === "undefined" ? phonePatients : listPhonePatients();
  const direct = people.find((item) => item.id.toLowerCase() === id || item.num.toLowerCase() === id || item.num.toLowerCase() === id.replace(/^#/, ""));
  if (direct) return direct;
  const seed = findPhonePatient(id) ?? phonePatients.find((item) => item.num.toLowerCase() === id);
  if (seed && !hiddenIds().has(seed.id)) return seed;
  const desk = buildPatients().find((item) => item.id.toLowerCase() === id);
  return desk ? fromDesktop(desk) : null;
}

function deskBundle(item: Patient) {
  const patient = fromDesktop(item);
  const visits: ClinicVisit[] = item.visits.map((visit, index) => ({
    id: `${item.id}-v${index}`,
    patientId: item.id,
    date: visit.date,
    time: "10:00",
    procedure: visit.kind,
    doctor: visit.doctor,
    tooth: "—",
    notes: visit.note,
    cost: 0,
    status: "Yakunlangan",
  }));
  const payments: ClinicPayment[] = item.payments.map((pay, index) => ({
    id: `${item.id}-p${index}`,
    patientId: item.id,
    date: pay.date,
    amount: pay.amount,
    method: pay.method,
    plan: pay.note,
    receipt: `CHK-${item.num}${index}`,
  }));
  const adult: Record<string, ToothStatus> = {};
  for (const [tooth, state] of Object.entries(item.teeth)) adult[tooth] = DESK_TOOTH[state] ?? "sog";
  return { patient, visits, plans: [] as ClinicPlan[], payments, teeth: { adult, child: {} as Record<string, ToothStatus> }, xrays: [] as ClinicXray[] };
}

export function patientChart(patientId: string) {
  const saved = typeof window === "undefined" ? null : readMap(TEETH_KEY)[patientId];
  const seed = SEED_TEETH[patientId] ?? { adult: {}, child: {} };
  return {
    adult: { ...seed.adult, ...(saved?.adult ?? {}) },
    child: { ...seed.child, ...(saved?.child ?? {}) },
  };
}

export function saveTooth(patientId: string, mode: "adult" | "child", tooth: string, status: ToothStatus) {
  const all = readMap(TEETH_KEY);
  const current = all[patientId] ?? { adult: {}, child: {} };
  all[patientId] = { ...current, [mode]: { ...current[mode], [tooth]: status } };
  window.localStorage.setItem(TEETH_KEY, JSON.stringify(all));
}

function readMap(key: string): Record<string, { adult: Record<string, ToothStatus>; child: Record<string, ToothStatus> }> {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "{}") as Record<string, { adult: Record<string, ToothStatus>; child: Record<string, ToothStatus> }>;
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function patientVisits(patientId: string) {
  const extra = readPhoneStore<ClinicVisit>(CLINIC_VISITS_KEY).filter((item) => item.patientId === patientId);
  return [...extra, ...SEED_VISITS.filter((item) => item.patientId === patientId)];
}

export function patientPlans(patientId: string) {
  const extra = readPhoneStore<ClinicPlan>(CLINIC_PLANS_KEY).filter((item) => item.patientId === patientId);
  const ids = new Set(extra.map((item) => item.id));
  return [...extra, ...SEED_PLANS.filter((item) => item.patientId === patientId && !ids.has(item.id))];
}

export function patientPayments(patientId: string) {
  const extra = readPhoneStore<ClinicPayment>(CLINIC_PAYS_KEY).filter((item) => item.patientId === patientId);
  return [...extra, ...SEED_PAYS.filter((item) => item.patientId === patientId)];
}

export function patientXrays(patientId: string) {
  const extra = readPhoneStore<ClinicXray>(XRAY_KEY).filter((item) => item.patientId === patientId);
  return [...extra, ...SEED_XRAYS.filter((item) => item.patientId === patientId)];
}

export function saveXray(item: ClinicXray) {
  writePhoneStore(XRAY_KEY, [item, ...readPhoneStore<ClinicXray>(XRAY_KEY)]);
}

export function deleteXray(id: string) {
  const extra = readPhoneStore<ClinicXray>(XRAY_KEY).filter((item) => item.id !== id);
  const hidden = readPhoneStore<string>("sk-phone14-hidden-xrays");
  writePhoneStore(XRAY_KEY, extra);
  if (SEED_XRAYS.some((item) => item.id === id) && !hidden.includes(id)) {
    writePhoneStore("sk-phone14-hidden-xrays", [...hidden, id]);
  }
}

export function visibleXrays(patientId: string) {
  const hidden = new Set(readPhoneStore<string>("sk-phone14-hidden-xrays"));
  return patientXrays(patientId).filter((item) => !hidden.has(item.id));
}

export function loadClinic(rawId: string) {
  const patient = resolvePhonePatient(rawId);
  if (!patient) return null;
  const desk = buildPatients().find((item) => item.id.toLowerCase() === patient.id.toLowerCase());
  if (desk && !phonePatients.some((item) => item.id === patient.id) && !readPhoneStore<PhonePatient>(PHONE_PATIENTS_KEY).some((item) => item.id === patient.id)) {
    const bundle = deskBundle(desk);
    return { ...bundle, patient };
  }
  const plans = patientPlans(patient.id);
  const payments = patientPayments(patient.id);
  return {
    patient,
    visits: patientVisits(patient.id),
    plans,
    payments,
    teeth: patientChart(patient.id),
    xrays: visibleXrays(patient.id),
  };
}
