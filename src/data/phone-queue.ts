import { phonePatients, readPhoneStore, writePhoneStore } from "@/data/phone14";
import { CLINIC_PAYS_KEY, CLINIC_PLANS_KEY, CLINIC_VISITS_KEY, patientPlans, type ClinicPayment, type ClinicPlan, type ClinicVisit } from "@/data/phone-records";

export const QUEUE_KEY = "sk-phone14-queue-v2";

export type QueueStatus = "keladi" | "kutil" | "davolan" | "bajar" | "bekor";

export type QueueAppt = {
  id: string;
  patientId: string;
  date: string;
  time: string;
  end: string;
  name: string;
  service: string;
  age: number;
  gender: string;
  tooth: string;
  note: string;
  status: QueueStatus;
  statusLabel: string;
  phone: string;
  avatar: string;
  amount: number;
  startedAt?: string;
};

const LABELS: Record<QueueStatus, string> = {
  keladi: "Keladigan",
  kutil: "Kutilayotgan",
  davolan: "Davolanmoqda",
  bajar: "Bajarildi",
  bekor: "Bekor qilindi",
};

export function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseStart(appt: QueueAppt) {
  const [y, m, d] = appt.date.split("-").map(Number);
  const [hh, mm] = appt.time.split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

function endFrom(time: string, minutes: number) {
  const [hh, mm] = time.split(":").map(Number);
  const total = hh * 60 + mm + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function row(date: string, time: string, patientId: string, service: string, tooth: string, note: string, status: QueueStatus, amount: number, minutes = 40): QueueAppt {
  const person = phonePatients.find((item) => item.id === patientId)!;
  return {
    id: `q-${date}-${time.replace(":", "")}`,
    patientId,
    date,
    time,
    end: endFrom(time, minutes),
    name: person.name,
    service,
    age: person.age,
    gender: person.gender,
    tooth,
    note,
    status,
    statusLabel: LABELS[status],
    phone: person.phone.replace(/\s/g, ""),
    avatar: person.avatar,
    amount,
  };
}

export function seedQueue(now: Date): QueueAppt[] {
  const today = dayKey(now);
  const tomorrow = dayKey(addDays(now, 1));
  const yesterday = dayKey(addDays(now, -1));
  return [
    row(today, "09:00", "b-0012", "Profilaktik ko‘rik", "Umumiy ko‘rik", "Tozalash va maslahat", "keladi", 150_000, 45),
    row(today, "10:30", "b-0013", "Plomba davolash", "16", "Anesteziya kerak", "kutil", 450_000, 45),
    row(today, "12:00", "b-0014", "Endodontik davolash", "11", "Rentgen olingan", "keladi", 1_200_000, 40),
    row(today, "14:00", "b-0015", "Ortodontik konsultatsiya", "55", "Panoramik rentgen bilan", "kutil", 180_000, 50),
    row(today, "15:30", "b-0016", "Estetik restoratsiya", "11", "Rang tanlash", "keladi", 2_400_000, 40),
    row(tomorrow, "10:00", "b-0017", "Krona nazorati", "26", "Okklyuziya tekshiruvi", "keladi", 200_000, 30),
    row(yesterday, "16:00", "b-0012", "Gigiyena", "—", "Kecha yakunlangan", "bajar", 250_000, 30),
  ];
}

const DESK_STATUS = { keladi: "tasdiq", kutil: "kutil", davolan: "davol", bajar: "yakun", bekor: "bekor" } as const;
const PHONE_STATUS = { tasdiq: "keladi", kutil: "kutil", davol: "davolan", yakun: "bajar", bekor: "bekor" } as const;

function toDesk(item: QueueAppt) {
  return {
    id: item.id,
    date: item.date,
    start: item.time,
    end: item.end,
    patient: item.name,
    avatar: item.avatar,
    service: item.service,
    doctor: "",
    doctorId: "",
    room: "",
    status: DESK_STATUS[item.status],
    patientId: item.patientId,
    phone: item.phone,
    tooth: item.tooth,
    amount: item.amount,
    note: item.note,
    startedAt: item.startedAt,
  };
}

function fromDesk(raw: Record<string, unknown>): QueueAppt | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const date = typeof raw.date === "string" ? raw.date : "";
  const start = typeof raw.start === "string" ? raw.start : typeof raw.time === "string" ? raw.time : "";
  if (!id || !date || !start) return null;
  const desk = typeof raw.status === "string" && raw.status in PHONE_STATUS ? PHONE_STATUS[raw.status as keyof typeof PHONE_STATUS] : null;
  const phone = typeof raw.status === "string" && raw.status in LABELS ? raw.status as QueueStatus : desk ?? "keladi";
  return {
    id,
    patientId: typeof raw.patientId === "string" ? raw.patientId : id,
    date,
    time: start,
    end: typeof raw.end === "string" ? raw.end : start,
    name: typeof raw.patient === "string" ? raw.patient : typeof raw.name === "string" ? raw.name : "Bemor",
    service: typeof raw.service === "string" ? raw.service : "",
    age: Number(raw.age) || 0,
    gender: typeof raw.gender === "string" ? raw.gender : "",
    tooth: typeof raw.tooth === "string" ? raw.tooth : "",
    note: typeof raw.note === "string" ? raw.note : "",
    status: phone,
    statusLabel: LABELS[phone],
    phone: typeof raw.phone === "string" ? raw.phone : "",
    avatar: typeof raw.avatar === "string" ? raw.avatar : "",
    amount: Number(raw.amount) || 0,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : undefined,
  };
}

export function loadQueue(_now?: Date) {
  return readPhoneStore<QueueAppt>(QUEUE_KEY)
    .filter((item) => item && item.id && !item.id.startsWith("q-"))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export async function refreshQueueFromServer() {
  const { loadCrm } = await import("@/lib/crm-client");
  const rows = await loadCrm<Record<string, unknown>>("appointments");
  const items = rows.map(fromDesk).filter((item): item is QueueAppt => item != null);
  writePhoneStore(QUEUE_KEY, items);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("sk-queue"));
  return items;
}

export function saveQueueItem(item: QueueAppt) {
  const saved = readPhoneStore<QueueAppt>(QUEUE_KEY).filter((rowItem) => rowItem.id !== item.id && !rowItem.id.startsWith("q-"));
  writePhoneStore(QUEUE_KEY, [item, ...saved]);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("sk-queue"));
  void import("@/lib/crm-client").then(({ upsertCrm }) => upsertCrm("appointments", toDesk(item)));
}

export function findQueueItem(id: string, now = new Date()) {
  return loadQueue(now).find((item) => item.id === id) ?? null;
}

export function currentAppointment(items: QueueAppt[], now: Date) {
  const today = dayKey(now);
  const pending = items
    .filter((item) => item.date === today && item.status !== "bajar" && item.status !== "bekor")
    .sort((a, b) => a.time.localeCompare(b.time));
  return pending.find((item) => item.status === "davolan")
    ?? pending.find((item) => parseStart(item).getTime() <= now.getTime())
    ?? pending[0]
    ?? null;
}

export function countdownText(appt: QueueAppt, now: Date) {
  if (appt.status === "davolan") return "boshlandi";
  const diff = parseStart(appt).getTime() - now.getTime();
  if (diff <= 0) return "boshlandi";
  const mins = Math.max(1, Math.round(diff / 60000));
  if (mins < 60) return `${mins} daqiqadan keyin`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest ? `${hours} soat ${rest} daqiqadan keyin` : `${hours} soatdan keyin`;
}

export function elapsedLabel(startedAt: string, now: Date) {
  const sec = Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function startVisit(appt: QueueAppt, now = new Date()) {
  const next: QueueAppt = { ...appt, status: "davolan", statusLabel: LABELS.davolan, startedAt: now.toISOString() };
  saveQueueItem(next);
  return next;
}

function pushVisit(appt: QueueAppt, notes: string, unpaid: boolean) {
  const visit: ClinicVisit = {
    id: `visit-${appt.id}`,
    patientId: appt.patientId,
    date: appt.date,
    time: appt.time,
    procedure: appt.service,
    doctor: "Dr. Ibrohim",
    tooth: appt.tooth,
    notes: notes || appt.note,
    cost: appt.amount,
    status: unpaid ? "Qarz" : "Yakunlangan",
    unpaid,
  };
  const visits = readPhoneStore<ClinicVisit>(CLINIC_VISITS_KEY).filter((item) => item.id !== visit.id);
  writePhoneStore(CLINIC_VISITS_KEY, [visit, ...visits]);
  void import("@/data/phone-records").then(({ syncPatientClinic }) => syncPatientClinic(appt.patientId));
}

export function finishUnpaid(appt: QueueAppt, notes: string) {
  saveQueueItem({ ...appt, status: "bajar", statusLabel: LABELS.bajar, note: notes || appt.note });
  pushVisit({ ...appt, note: notes || appt.note }, notes, true);
}

export function finishPaid(appt: QueueAppt, notes: string, payment: { amount: number; method: string; plan: string; date: string }) {
  saveQueueItem({ ...appt, status: "bajar", statusLabel: LABELS.bajar, note: notes || appt.note, amount: payment.amount });
  pushVisit({ ...appt, note: notes || appt.note, amount: payment.amount }, notes, false);
  const pay: ClinicPayment = {
    id: `pay-${appt.id}`,
    patientId: appt.patientId,
    date: payment.date,
    amount: payment.amount,
    method: payment.method,
    plan: payment.plan || appt.service,
    receipt: `CHK-${appt.time.replace(":", "")}`,
  };
  const pays = readPhoneStore<ClinicPayment>(CLINIC_PAYS_KEY).filter((item) => item.id !== pay.id);
  writePhoneStore(CLINIC_PAYS_KEY, [pay, ...pays]);
  if (payment.plan) {
    const plan = patientPlans(appt.patientId).find((item) => item.name === payment.plan);
    if (plan) {
      const next: ClinicPlan = { ...plan, paid: plan.paid + payment.amount };
      const stored = readPhoneStore<ClinicPlan>(CLINIC_PLANS_KEY).filter((item) => item.id !== plan.id);
      writePhoneStore(CLINIC_PLANS_KEY, [next, ...stored]);
    }
  }
}
