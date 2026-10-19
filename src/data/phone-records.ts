import type { Patient, ToothState } from "@/data/crm";
import {
  PHONE_PATIENTS_KEY,
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

const PATIENT_CACHE = "sk-crm-cache-patients";

export function readPatientCache(): Patient[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PATIENT_CACHE) || "[]") as Patient[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePatientCache(items: Patient[]) {
  window.localStorage.setItem(PATIENT_CACHE, JSON.stringify(items));
  window.dispatchEvent(new Event("sk-crm-patients"));
}

export function listPhonePatients() {
  const hidden = hiddenIds();
  return readPatientCache().map(fromDesktop).filter((item) => !hidden.has(item.id));
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
  const people = typeof window === "undefined" ? [] : listPhonePatients();
  const direct = people.find((item) => item.id.toLowerCase() === id || item.num.toLowerCase() === id || item.num.toLowerCase() === id.replace(/^#/, ""));
  if (direct) return direct;
  const desk = readPatientCache().find((item) => item.id.toLowerCase() === id);
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
  for (const [tooth, state] of Object.entries(item.teeth || {})) adult[tooth] = DESK_TOOTH[state] ?? "sog";
  const plans: ClinicPlan[] = (item.plans ?? []).map((plan) => ({
    id: plan.id,
    patientId: item.id,
    name: plan.name,
    doctor: plan.doctor,
    date: plan.date,
    status: plan.status,
    done: 0,
    stages: 1,
    total: plan.total,
    paid: 0,
    services: [],
  }));
  const xrays: ClinicXray[] = (item.xrays ?? []).map((xray) => ({
    id: xray.id,
    patientId: item.id,
    date: xray.date,
    type: xray.type === "KT" || xray.type === "Panoramik" || xray.type === "Periapikal" ? xray.type : "Periapikal",
    tooth: xray.tooth,
    src: "",
  }));
  return { patient, visits, plans, payments, teeth: { adult, child: {} as Record<string, ToothStatus> }, xrays };
}

export function patientChart(patientId: string) {
  const saved = typeof window === "undefined" ? null : readMap(TEETH_KEY)[patientId];
  return {
    adult: { ...(saved?.adult ?? {}) },
    child: { ...(saved?.child ?? {}) },
  };
}

const PHONE_TO_DESK: Record<string, ToothState> = {
  sog: "soglom",
  plomba: "plomba",
  endo: "endo",
  krona: "koronka",
  implant: "implant",
  gone: "ekstraksiya",
  karies: "kariyes",
};

export function syncPatientClinic(patientId: string) {
  const cache = readPatientCache();
  const index = cache.findIndex((item) => item.id === patientId);
  if (index < 0) return;
  const patient = { ...cache[index], teeth: { ...cache[index].teeth } };
  const chart = readMap(TEETH_KEY)[patientId];
  if (chart?.adult) {
    for (const [tooth, status] of Object.entries(chart.adult)) patient.teeth[tooth] = PHONE_TO_DESK[status] ?? "soglom";
  }
  const visits = readPhoneStore<ClinicVisit>(CLINIC_VISITS_KEY).filter((item) => item.patientId === patientId);
  if (visits.length) patient.visits = visits.map((item) => ({ date: item.date, kind: item.procedure, note: item.notes, doctor: item.doctor }));
  const pays = readPhoneStore<ClinicPayment>(CLINIC_PAYS_KEY).filter((item) => item.patientId === patientId);
  if (pays.length) patient.payments = pays.map((item) => ({ date: item.date, amount: item.amount, method: item.method, note: item.plan }));
  const plans = readPhoneStore<ClinicPlan>(CLINIC_PLANS_KEY).filter((item) => item.patientId === patientId);
  if (plans.length) {
    patient.plans = plans.map((item) => ({ id: item.id, name: item.name, doctor: item.doctor, date: item.date, status: item.status, total: item.total }));
  }
  const xrays = readPhoneStore<ClinicXray>(XRAY_KEY).filter((item) => item.patientId === patientId);
  if (xrays.length) {
    patient.xrays = xrays.map((item) => ({ id: item.id, date: item.date, type: item.type, tooth: item.tooth, note: item.tooth }));
  }
  cache[index] = patient;
  writePatientCache(cache);
  void import("@/lib/crm-client").then(({ upsertCrm }) => upsertCrm("patients", patient));
}

export function saveTooth(patientId: string, mode: "adult" | "child", tooth: string, status: ToothStatus) {
  const all = readMap(TEETH_KEY);
  const current = all[patientId] ?? { adult: {}, child: {} };
  all[patientId] = { ...current, [mode]: { ...current[mode], [tooth]: status } };
  window.localStorage.setItem(TEETH_KEY, JSON.stringify(all));
  syncPatientClinic(patientId);
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
  return readPhoneStore<ClinicVisit>(CLINIC_VISITS_KEY).filter((item) => item.patientId === patientId);
}

export function patientPlans(patientId: string) {
  return readPhoneStore<ClinicPlan>(CLINIC_PLANS_KEY).filter((item) => item.patientId === patientId);
}

export function patientPayments(patientId: string) {
  return readPhoneStore<ClinicPayment>(CLINIC_PAYS_KEY).filter((item) => item.patientId === patientId);
}

export function patientXrays(patientId: string) {
  return readPhoneStore<ClinicXray>(XRAY_KEY).filter((item) => item.patientId === patientId);
}

export function saveXray(item: ClinicXray) {
  writePhoneStore(XRAY_KEY, [item, ...readPhoneStore<ClinicXray>(XRAY_KEY)]);
  syncPatientClinic(item.patientId);
}

export function deleteXray(id: string) {
  writePhoneStore(XRAY_KEY, readPhoneStore<ClinicXray>(XRAY_KEY).filter((item) => item.id !== id));
}

export function visibleXrays(patientId: string) {
  const hidden = new Set(readPhoneStore<string>("sk-phone14-hidden-xrays"));
  return patientXrays(patientId).filter((item) => !hidden.has(item.id));
}

export function loadClinic(rawId: string) {
  const patient = resolvePhonePatient(rawId);
  if (!patient) return null;
  const desk = readPatientCache().find((item) => item.id.toLowerCase() === patient.id.toLowerCase());
  if (desk) {
    const bundle = deskBundle(desk);
    const localPlans = patientPlans(patient.id);
    const localPays = patientPayments(patient.id);
    const localVisits = patientVisits(patient.id);
    const localXrays = patientXrays(patient.id);
    return {
      ...bundle,
      patient,
      plans: localPlans.length ? localPlans : bundle.plans,
      payments: localPays.length ? localPays : bundle.payments,
      visits: localVisits.length ? localVisits : bundle.visits,
      xrays: localXrays.length ? localXrays : bundle.xrays,
    };
  }
  return {
    patient,
    visits: patientVisits(patient.id),
    plans: patientPlans(patient.id),
    payments: patientPayments(patient.id),
    teeth: patientChart(patient.id),
    xrays: patientXrays(patient.id),
  };
}
