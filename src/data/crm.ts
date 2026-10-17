export type PatientStatus = "faol" | "davolanishda" | "yangi" | "kuzatuvda" | "nofaol";
export type ToothState = "soglom" | "davolanmoqda" | "davolangan" | "muammo" | "kariyes" | "plomba" | "endo" | "implant" | "koronka" | "ekstraksiya";

export type PatientVisit = { date: string; kind: string; note: string; doctor: string };
export type PatientDoc = { name: string; detail: string };
export type PatientPay = { date: string; amount: number; method: string; note: string };

export type Patient = {
  id: string;
  num: number;
  name: string;
  age: number;
  gender: "Ayol" | "Erkak";
  phone: string;
  city: string;
  status: PatientStatus;
  lastVisit: string;
  nextVisit: string;
  avatar: string;
  email: string;
  created: string;
  /** Set when the patient is added from the form, so they sort ahead of the seed list. */
  addedAt?: number;
  family?: string;
  birth?: string;
  address?: string;
  source?: string;
  conditions?: string[];
  otherCondition?: string;
  note?: string;
  teeth: Record<string, ToothState>;
  visits: PatientVisit[];
  payments: PatientPay[];
  docs: PatientDoc[];
};

export const patientStatuses: { id: PatientStatus; label: string }[] = [
  { id: "faol", label: "Faol" },
  { id: "davolanishda", label: "Davolanishda" },
  { id: "yangi", label: "Yangi" },
  { id: "kuzatuvda", label: "Kuzatuvda" },
  { id: "nofaol", label: "Nofaol" },
];

export const patientCities = ["Toshkent", "Samarqand", "Buxoro", "Namangan", "Andijon", "Farg‘ona"];

const avatars = [
  "/img/profil/dilnoza.jpg",
  "/img/jobs/doctor.jpg",
  "/img/mobile/se-dilnoza.jpg",
  "/img/usta/bobur.jpg",
  "/img/mobile/tl-nigora.jpg",
  "/img/usta/azamat.jpg",
  "/img/mobile/se-sardor-face.jpg",
  "/img/mobile/tl-komiljon.jpg",
  "/img/mobile/tl-azizbek.jpg",
  "/img/mobile/ut-aziz-face.jpg",
];

const firstTen = [
  { id: "p-0001", num: 1, name: "Aliyeva Mohira", age: 25, gender: "Ayol", phone: "+998 90 123 45 67", city: "Toshkent", status: "faol", lastVisit: "12.10.2026", nextVisit: "20.10.2026", avatar: avatars[0], email: "mohiraaliyeva@gmail.com", created: "2026-10-20", visits: [{ date: "12.10.2026", kind: "Davolash", note: "14 tish – plomba", doctor: "Dr. Karimov" }, { date: "20.09.2026", kind: "Maslahat", note: "Ortodontik maslahat", doctor: "Dr. To‘xtayev" }, { date: "15.08.2026", kind: "Gigiyena", note: "Professional tozalash", doctor: "Dr. Aliyeva" }], payments: [{ date: "12.10.2026", amount: 200000, method: "Naqd", note: "Konsultatsiya" }, { date: "15.10.2026", amount: 800000, method: "Karta", note: "Plomba" }, { date: "20.10.2026", amount: 4200000, method: "Click", note: "Endo + vaqtinchalik" }] },
  { id: "p-0002", num: 2, name: "Karimov Aziz", age: 32, gender: "Erkak", phone: "+998 93 234 56 78", city: "Toshkent", status: "davolanishda", lastVisit: "10.10.2026", nextVisit: "15.10.2026", avatar: avatars[1], email: "aziz.karimov@gmail.com", created: "2026-10-19", visits: [{ date: "10.10.2026", kind: "Davolash", note: "Plomba", doctor: "Dr. Aliyeva" }], payments: [{ date: "20.10.2026", amount: 800000, method: "Click", note: "Plomba" }], docs: [] },
  { id: "p-0003", num: 3, name: "Normatova Dilnoza", age: 28, gender: "Ayol", phone: "+998 90 345 67 89", city: "Samarqand", status: "yangi", lastVisit: "", nextVisit: "18.10.2026", avatar: avatars[2], email: "dilnoza.n@gmail.com", created: "2026-10-18", visits: [], payments: [], docs: [] },
  { id: "p-0004", num: 4, name: "Tursunov Bobur", age: 40, gender: "Erkak", phone: "+998 91 456 78 90", city: "Toshkent", status: "faol", lastVisit: "08.10.2026", nextVisit: "", avatar: avatars[3], email: "bobur.t@gmail.com", created: "2026-10-17", visits: [{ date: "08.10.2026", kind: "Davolash", note: "Implant nazorati", doctor: "Dr. Karimov" }], payments: [], docs: [] },
  { id: "p-0005", num: 5, name: "Jabborova Sevara", age: 22, gender: "Ayol", phone: "+998 93 567 89 01", city: "Toshkent", status: "kuzatuvda", lastVisit: "05.10.2026", nextVisit: "05.01.2027", avatar: avatars[4], email: "sevara.j@gmail.com", created: "2026-10-16", visits: [{ date: "05.10.2026", kind: "Maslahat", note: "Kuzatuv", doctor: "Dr. Aliyeva" }], payments: [], docs: [] },
  { id: "p-0006", num: 6, name: "Raximov Sardor", age: 35, gender: "Erkak", phone: "+998 90 678 90 12", city: "Buxoro", status: "davolanishda", lastVisit: "11.10.2026", nextVisit: "25.10.2026", avatar: avatars[5], email: "sardor.r@gmail.com", created: "2026-10-15", visits: [{ date: "11.10.2026", kind: "Davolash", note: "Koronka", doctor: "Dr. To‘xtayev" }], payments: [], docs: [] },
  { id: "p-0007", num: 7, name: "Ismoilova Madina", age: 18, gender: "Ayol", phone: "+998 93 789 01 23", city: "Toshkent", status: "faol", lastVisit: "07.10.2026", nextVisit: "", avatar: avatars[6], email: "madina.i@gmail.com", created: "2026-10-14", visits: [{ date: "07.10.2026", kind: "Maslahat", note: "Ortodontik maslahat", doctor: "Dr. To‘xtayev" }], payments: [], docs: [] },
  { id: "p-0008", num: 8, name: "Xudoyberdiyev Anvar", age: 45, gender: "Erkak", phone: "+998 91 890 12 34", city: "Toshkent", status: "nofaol", lastVisit: "01.09.2026", nextVisit: "", avatar: avatars[7], email: "anvar.x@gmail.com", created: "2026-10-13", visits: [{ date: "01.09.2026", kind: "Davolash", note: "Koronka", doctor: "Dr. Karimov" }], payments: [], docs: [] },
  { id: "p-0009", num: 9, name: "Qodirova Aziza", age: 27, gender: "Ayol", phone: "+998 90 901 23 45", city: "Namangan", status: "faol", lastVisit: "09.10.2026", nextVisit: "22.10.2026", avatar: avatars[8], email: "aziza.q@gmail.com", created: "2026-10-12", visits: [{ date: "09.10.2026", kind: "Gigiyena", note: "Professional tozalash", doctor: "Dr. Saidova" }], payments: [], docs: [] },
  { id: "p-0010", num: 10, name: "Usmonov Davron", age: 30, gender: "Erkak", phone: "+998 93 012 34 56", city: "Toshkent", status: "davolanishda", lastVisit: "13.10.2026", nextVisit: "27.10.2026", avatar: avatars[9], email: "davron.u@gmail.com", created: "2026-10-11", visits: [{ date: "13.10.2026", kind: "Davolash", note: "Nazorat", doctor: "Dr. Aliyeva" }], payments: [], docs: [] },
];

const extraNames = ["Karimova Saida", "Qodirov Temur", "Saidova Nargiza", "Xolmatov Nuriddin", "Rahimova Aziza", "Ismoilov Bekzod", "Yusupova Madina", "Alimov Jasur", "Ergasheva Malika", "Nurmatov Otabek"];
const statuses: PatientStatus[] = ["faol", "davolanishda", "yangi", "kuzatuvda", "nofaol"];

function pad(n: number) {
  return String(n).padStart(4, "0");
}

export function buildPatients(): Patient[] {
  const mohiraTeeth: Record<string, ToothState> = { "14": "plomba", "16": "kariyes", "11": "endo", "26": "plomba", "31": "implant", "21": "koronka", "36": "muammo", "46": "davolangan" };
  const list: Patient[] = firstTen.map((item) => ({
    ...item,
    gender: item.gender === "Erkak" ? "Erkak" as const : "Ayol" as const,
    status: item.status as Patient["status"],
    teeth: item.id === "p-0001" ? mohiraTeeth : {},
    docs: "docs" in item && item.docs && item.docs.length ? item.docs : [{ name: "Qabul varaqasi.pdf", detail: "120 KB" }],
  }));
  for (let index = 11; index <= 248; index += 1) {
    const name = `${extraNames[index % extraNames.length]} ${index}`;
    const gender = index % 2 === 0 ? "Erkak" : "Ayol";
    list.push({
      id: `p-${pad(index)}`,
      num: index,
      name,
      age: 18 + (index % 40),
      gender,
      phone: `+998 9${index % 10} ${String(100 + (index % 800)).padStart(3, "0")} ${String(10 + (index % 80)).padStart(2, "0")} ${String(10 + (index % 80)).padStart(2, "0")}`,
      city: patientCities[index % patientCities.length],
      status: statuses[index % statuses.length],
      lastVisit: index % 4 === 0 ? "" : `${String((index % 27) + 1).padStart(2, "0")}.09.2026`,
      nextVisit: index % 5 === 0 ? "" : `${String((index % 27) + 1).padStart(2, "0")}.11.2026`,
      avatar: avatars[index % avatars.length],
      email: `bemor${index}@gmail.com`,
      created: `2026-09-${String((index % 27) + 1).padStart(2, "0")}`,
      teeth: {},
      visits: [],
      payments: [],
      docs: [],
    });
  }
  return list;
}

export type ApptStatus = "tasdiq" | "kutil" | "davol" | "yakun" | "bekor";

export type Appointment = {
  id: string;
  date: string;
  start: string;
  end: string;
  patient: string;
  avatar: string;
  service: string;
  doctor: string;
  doctorId: string;
  room: string;
  status: ApptStatus;
  isNew?: boolean;
  grid?: boolean;
};

export const apptDoctors = [
  { id: "ibrohim", name: "Dr. Ibrohim", role: "Stomatolog" },
  { id: "karimov", name: "Dr. Karimov", role: "Implantolog" },
  { id: "aliyeva", name: "Dr. Aliyeva", role: "Terapevt" },
  { id: "toxtayev", name: "Dr. To‘xtayev", role: "Ortoped" },
  { id: "saidova", name: "Dr. Saidova", role: "Gigiyenist" },
];

export const apptRooms = ["Xona 1", "Xona 2", "Xona 3"];

export const apptStatusLabel: Record<ApptStatus, string> = {
  tasdiq: "Tasdiqlangan",
  kutil: "Kutilmoqda",
  davol: "Davolanmoqda",
  yakun: "Yakunlangan",
  bekor: "Bekor qilingan",
};

function appt(partial: Appointment): Appointment {
  return partial;
}

export const CLINIC_TODAY = "2026-10-22";

export const seedAppointments: Appointment[] = [
  appt({ id: "a1", date: "2026-10-20", start: "08:00", end: "09:00", patient: "Aliyeva Mohira", avatar: avatars[0], service: "Konsultatsiya", doctor: "Dr. Aliyeva", doctorId: "aliyeva", room: "Xona 1", status: "davol" }),
  appt({ id: "a2", date: "2026-10-21", start: "08:30", end: "09:30", patient: "Raximov Aziz", avatar: avatars[5], service: "Davolash", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 2", status: "tasdiq" }),
  appt({ id: "a3", date: "2026-10-22", start: "08:00", end: "09:00", patient: "Normatova Dilnoza", avatar: avatars[2], service: "Gigiyena", doctor: "Dr. Saidova", doctorId: "saidova", room: "Xona 1", status: "davol", isNew: true }),
  appt({ id: "a4", date: "2026-10-23", start: "08:00", end: "09:00", patient: "Usmonov D.", avatar: avatars[9], service: "Konsultatsiya", doctor: "Dr. Aliyeva", doctorId: "aliyeva", room: "Xona 2", status: "davol" }),
  appt({ id: "a5", date: "2026-10-24", start: "08:00", end: "09:00", patient: "Karimova Saida", avatar: avatars[4], service: "Davolash", doctor: "Dr. To‘xtayev", doctorId: "toxtayev", room: "Xona 1", status: "kutil" }),
  appt({ id: "a6", date: "2026-10-20", start: "10:00", end: "11:00", patient: "Tursunov Bobur", avatar: avatars[3], service: "Implant", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 3", status: "bekor" }),
  appt({ id: "a7", date: "2026-10-21", start: "10:00", end: "11:30", patient: "Qodirova Aziza", avatar: avatars[8], service: "Ortodontik", doctor: "Dr. To‘xtayev", doctorId: "toxtayev", room: "Xona 1", status: "tasdiq" }),
  appt({ id: "a8", date: "2026-10-22", start: "10:00", end: "11:00", patient: "Ismoilova Madina", avatar: avatars[6], service: "Davolash", doctor: "Dr. Aliyeva", doctorId: "aliyeva", room: "Xona 2", status: "tasdiq", isNew: true }),
  appt({ id: "a9", date: "2026-10-23", start: "10:00", end: "11:00", patient: "Xudoyberdiyev A.", avatar: avatars[7], service: "Konsultatsiya", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 2", status: "tasdiq" }),
  appt({ id: "a10", date: "2026-10-24", start: "10:00", end: "11:30", patient: "Jabborova Sevara", avatar: avatars[4], service: "Davolash", doctor: "Dr. Aliyeva", doctorId: "aliyeva", room: "Xona 1", status: "kutil" }),
  appt({ id: "a11", date: "2026-10-20", start: "12:00", end: "13:00", patient: "Normurodov I.", avatar: avatars[1], service: "Konsultatsiya", doctor: "Dr. Saidova", doctorId: "saidova", room: "Xona 1", status: "davol" }),
  appt({ id: "a12", date: "2026-10-21", start: "12:00", end: "13:00", patient: "Karimov Aziz", avatar: avatars[1], service: "Nazorat", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 2", status: "tasdiq" }),
  appt({ id: "a13", date: "2026-10-22", start: "12:00", end: "13:00", patient: "Karimov Aziz", avatar: avatars[1], service: "Nazorat", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 1", status: "kutil" }),
  appt({ id: "a14", date: "2026-10-24", start: "12:00", end: "13:30", patient: "Raximov Sardor", avatar: avatars[5], service: "Jarrohlik", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 3", status: "bekor" }),
  appt({ id: "a15", date: "2026-10-20", start: "14:00", end: "15:00", patient: "Saidova Nargiza", avatar: avatars[2], service: "Gigiyena", doctor: "Dr. Saidova", doctorId: "saidova", room: "Xona 1", status: "tasdiq" }),
  appt({ id: "a16", date: "2026-10-21", start: "14:00", end: "15:00", patient: "Usmonov Davron", avatar: avatars[9], service: "Davolash", doctor: "Dr. To‘xtayev", doctorId: "toxtayev", room: "Xona 2", status: "kutil" }),
  appt({ id: "a17", date: "2026-10-22", start: "14:00", end: "15:00", patient: "Qodirov Temur", avatar: avatars[7], service: "Implant", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 3", status: "tasdiq", isNew: true }),
  appt({ id: "a18", date: "2026-10-23", start: "14:00", end: "15:00", patient: "Karimova Saida", avatar: avatars[4], service: "Konsultatsiya", doctor: "Dr. Aliyeva", doctorId: "aliyeva", room: "Xona 1", status: "davol" }),
  appt({ id: "a19", date: "2026-10-24", start: "14:00", end: "15:00", patient: "Ismoilova Madina", avatar: avatars[6], service: "Nazorat", doctor: "Dr. To‘xtayev", doctorId: "toxtayev", room: "Xona 2", status: "tasdiq" }),
  appt({ id: "a20", date: "2026-10-20", start: "16:00", end: "17:00", patient: "Xolmatov Nuriddin", avatar: avatars[5], service: "Davolash", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 2", status: "kutil" }),
  appt({ id: "a21", date: "2026-10-21", start: "16:00", end: "17:00", patient: "Aliyeva Mohira", avatar: avatars[0], service: "Konsultatsiya", doctor: "Dr. Aliyeva", doctorId: "aliyeva", room: "Xona 1", status: "davol" }),
  appt({ id: "a22", date: "2026-10-22", start: "16:00", end: "17:00", patient: "Tursunov Bobur", avatar: avatars[3], service: "Nazorat", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 2", status: "kutil" }),
  appt({ id: "a23", date: "2026-10-23", start: "16:00", end: "17:30", patient: "Normatova Dilnoza", avatar: avatars[2], service: "Ortodontik", doctor: "Dr. To‘xtayev", doctorId: "toxtayev", room: "Xona 1", status: "tasdiq" }),
  appt({ id: "a24", date: "2026-10-24", start: "16:00", end: "17:00", patient: "Qodirova Aziza", avatar: avatars[8], service: "Davolash", doctor: "Dr. Saidova", doctorId: "saidova", room: "Xona 2", status: "tasdiq" }),
  appt({ id: "a25", date: "2026-10-25", start: "16:00", end: "17:00", patient: "Usmonov D.", avatar: avatars[9], service: "Konsultatsiya", doctor: "Dr. Aliyeva", doctorId: "aliyeva", room: "Xona 1", status: "davol" }),
  appt({ id: "a26", date: "2026-10-22", start: "17:30", end: "18:00", patient: "Yakunlangan qabul", avatar: avatars[1], service: "Nazorat", doctor: "Dr. Saidova", doctorId: "saidova", room: "Xona 3", status: "yakun", grid: false }),
  appt({ id: "a27", date: "2026-10-22", start: "17:40", end: "18:00", patient: "Bekor qabul", avatar: avatars[5], service: "Maslahat", doctor: "Dr. Karimov", doctorId: "karimov", room: "Xona 2", status: "bekor", grid: false }),
];

export type PlanStep = { id: string; name: string; teeth: string; count: number; price: number; status: "bajarildi" | "davom" | "kutil"; date: string };
export type PlanPay = { date: string; amount: number; method: string; note: string };

export type TreatmentPlan = {
  id: string;
  title: string;
  code: string;
  date: string;
  status: "davom" | "yakun" | "reja";
  doctor: string;
  patientId: string;
  steps: PlanStep[];
  payments: PlanPay[];
  teeth: Record<string, ToothState>;
};

export const seedPlans: TreatmentPlan[] = [
  {
    id: "r-0001",
    title: "Zamonaviy kompleks davolash",
    code: "R-0001",
    date: "12.10.2026",
    status: "davom",
    doctor: "Dr. Sardor Karimov",
    patientId: "p-0001",
    steps: [
      { id: "s1", name: "Diagnostika va konsultatsiya", teeth: "–", count: 1, price: 200000, status: "bajarildi", date: "12.10.2026" },
      { id: "s2", name: "Karies davolash (plomba)", teeth: "16, 26", count: 2, price: 800000, status: "bajarildi", date: "15.10.2026" },
      { id: "s3", name: "Endodontik davolash", teeth: "11", count: 1, price: 1500000, status: "davom", date: "20.10.2026" },
      { id: "s4", name: "Shift va koronka", teeth: "14", count: 1, price: 2800000, status: "kutil", date: "" },
      { id: "s5", name: "Implant o‘rnatish", teeth: "31", count: 1, price: 4500000, status: "kutil", date: "" },
      { id: "s6", name: "Professional tozalash", teeth: "–", count: 1, price: 500000, status: "kutil", date: "" },
      { id: "s7", name: "Nazorat ko‘rigi", teeth: "–", count: 1, price: 300000, status: "kutil", date: "" },
    ],
    payments: [
      { date: "12.10.2026", amount: 200000, method: "Naqd", note: "Konsultatsiya" },
      { date: "15.10.2026", amount: 800000, method: "Karta", note: "Plomba" },
      { date: "20.10.2026", amount: 4200000, method: "Click", note: "Endo + vaqtinchalik" },
    ],
    teeth: { "16": "kariyes", "26": "plomba", "11": "endo", "14": "koronka", "31": "implant", "21": "ekstraksiya", "36": "plomba", "46": "kariyes" },
  },
  {
    id: "r-0002",
    title: "Ortodontik davolash",
    code: "R-0002",
    date: "09.10.2026",
    status: "reja",
    doctor: "Dr. Alisher To‘xtayev",
    patientId: "p-0009",
    steps: [{ id: "s1", name: "Diagnostika", teeth: "–", count: 1, price: 300000, status: "bajarildi", date: "09.10.2026" }],
    payments: [{ date: "09.10.2026", amount: 300000, method: "Click", note: "Maslahat" }],
    teeth: { "13": "kariyes" },
  },
  {
    id: "r-0003",
    title: "Implant rejasi",
    code: "R-0003",
    date: "11.10.2026",
    status: "davom",
    doctor: "Dr. Sardor Karimov",
    patientId: "p-0006",
    steps: [{ id: "s1", name: "Implant", teeth: "36", count: 1, price: 4500000, status: "davom", date: "11.10.2026" }],
    payments: [],
    teeth: { "36": "implant" },
  },
];

export type PayStatus = "tolandi" | "qisman";
export type PayMethod = "Naqd" | "Click" | "Karta" | "Payme" | "O‘tkazma";

export type ClinicPayment = {
  id: string;
  date: string;
  patient: string;
  avatar: string;
  service: string;
  amount: number;
  method: PayMethod;
  status: PayStatus;
};

const paySeed: ClinicPayment[] = [
  { id: "pay-1", date: "20.10.2026", patient: "Aliyeva Mohira", avatar: avatars[0], service: "Konsultatsiya", amount: 200000, method: "Naqd", status: "tolandi" },
  { id: "pay-2", date: "20.10.2026", patient: "Karimov Aziz", avatar: avatars[1], service: "Plomba (16)", amount: 800000, method: "Click", status: "tolandi" },
  { id: "pay-3", date: "19.10.2026", patient: "Normatova Dilnoza", avatar: avatars[2], service: "Endodontik davolash", amount: 1500000, method: "Karta", status: "tolandi" },
  { id: "pay-4", date: "18.10.2026", patient: "Tursunov Bobur", avatar: avatars[3], service: "Implant (31)", amount: 4500000, method: "Payme", status: "tolandi" },
  { id: "pay-5", date: "18.10.2026", patient: "Xudoyberdiyev Anvar", avatar: avatars[7], service: "Koronka (14)", amount: 2800000, method: "Karta", status: "qisman" },
  { id: "pay-6", date: "17.10.2026", patient: "Qodirova Aziza", avatar: avatars[8], service: "Professional tozalash", amount: 500000, method: "Naqd", status: "tolandi" },
  { id: "pay-7", date: "16.10.2026", patient: "Usmonov Davron", avatar: avatars[9], service: "Nazorat", amount: 300000, method: "Click", status: "tolandi" },
  { id: "pay-8", date: "15.10.2026", patient: "Ismoilova Madina", avatar: avatars[6], service: "Ortodontik maslahat", amount: 400000, method: "Payme", status: "tolandi" },
];

const methods: PayMethod[] = ["Naqd", "Click", "Karta", "Payme"];

export function buildPayments(): ClinicPayment[] {
  const list = [...paySeed];
  for (let index = 9; index <= 248; index += 1) {
    const day = String((index % 27) + 1).padStart(2, "0");
    list.push({
      id: `pay-${index}`,
      date: `${day}.10.2026`,
      patient: extraNames[index % extraNames.length],
      avatar: avatars[index % avatars.length],
      service: ["Konsultatsiya", "Plomba", "Nazorat", "Gigiyena"][index % 4],
      amount: 200000 + (index % 8) * 150000,
      method: methods[index % methods.length],
      status: index % 11 === 0 ? "qisman" : "tolandi",
    });
  }
  return list;
}

export const debtors = [
  { name: "Xudoyberdiyev Anvar", note: "Implant", amount: 3200000, date: "15.10.2026", avatar: avatars[7] },
  { name: "Karimova Saida", note: "Ortodontik davolash", amount: 2800000, date: "10.10.2026", avatar: avatars[4] },
  { name: "Raximov Sardor", note: "Koronka (14)", amount: 1500000, date: "08.10.2026", avatar: avatars[5] },
  { name: "Jabborova Sevara", note: "Endodontiya", amount: 900000, date: "05.10.2026", avatar: avatars[4] },
];

export const revenueBars = [2.2, 1.4, 2.8, 3.2, 1.8, 4.2, 3.6, 2.4, 1.6, 3.8, 4.6, 2.2, 3.1, 1.2, 2.6, 4.8, 3.4, 2.0, 1.5, 3.2, 2.8, 4.1, 3.0, 5.6, 2.4, 6.2, 3.8, 2.6, 4.4, 3.2, 2.1];

export type StockStatus = "kam" | "mavjud" | "tugash";

export type StockItem = {
  id: string;
  name: string;
  detail: string;
  category: string;
  sku: string;
  qty: number;
  min: number;
  expiry: string;
  supplier: string;
  status: StockStatus;
  image: string;
  price: number;
};

const stockImages = ["/img/mobile/om-filtek-syr.jpg", "/img/shop/m-protaper.jpg", "/images/implant-cutout.png", "/img/shop/m-uds.jpg", "/img/cart/gloves.jpg", "/img/cart/masks.jpg", "/images/product-bond.png", "/images/product-composite.png"];

const stockFirst: StockItem[] = [
  { id: "st-1", name: "Filtek Universal", detail: "Kompozit 4g", category: "Restavratsion materiallar", sku: "CMP-001", qty: 12, min: 20, expiry: "15.08.2027", supplier: "3M", status: "kam", image: stockImages[0], price: 180000 },
  { id: "st-2", name: "Articaine 4%", detail: "10 kartrij", category: "Anesteziya", sku: "AN-004", qty: 5, min: 20, expiry: "12.03.2026", supplier: "Inibsa", status: "kam", image: stockImages[7], price: 95000 },
  { id: "st-3", name: "Implant NeoBiotech", detail: "Ø4.0 x 10mm", category: "Implantlar", sku: "IMP-010", qty: 8, min: 10, expiry: "", supplier: "NeoBiotech", status: "kam", image: stockImages[2], price: 420000 },
  { id: "st-4", name: "Gutta Percha", detail: "#25 (100 dona)", category: "Endodontiya", sku: "END-025", qty: 3, min: 20, expiry: "20.12.2026", supplier: "Meta Biomed", status: "kam", image: stockImages[1], price: 65000 },
  { id: "st-5", name: "Surgical Kit", detail: "Implant jarrohlik seti", category: "Asboblar", sku: "INS-100", qty: 1, min: 2, expiry: "", supplier: "Osstem", status: "kam", image: stockImages[3], price: 2400000 },
  { id: "st-6", name: "NaOCl 5.25%", detail: "100 ml", category: "Endodontiya", sku: "END-005", qty: 25, min: 10, expiry: "10.05.2027", supplier: "Cerkamed", status: "mavjud", image: stockImages[6], price: 40000 },
  { id: "st-7", name: "Steril qo‘lqop", detail: "M (100 dona)", category: "Sarf materiallar", sku: "DISP-002", qty: 120, min: 50, expiry: "18.10.2028", supplier: "Unigloves", status: "mavjud", image: stockImages[4], price: 28000 },
  { id: "st-8", name: "Maska 3 qatlamli", detail: "50 dona", category: "Sarf materiallar", sku: "DISP-003", qty: 40, min: 50, expiry: "22.11.2026", supplier: "Euronda", status: "kam", image: stockImages[5], price: 18000 },
  { id: "st-9", name: "Xlorgeksidin 0.12%", detail: "250 ml", category: "Dezinfeksiya", sku: "DIS-010", qty: 6, min: 10, expiry: "05.01.2026", supplier: "Septodont", status: "tugash", image: stockImages[6], price: 32000 },
  { id: "st-10", name: "Polishing Pasta", detail: "Prophy pasta 100g", category: "Profilaktika", sku: "PRF-001", qty: 35, min: 20, expiry: "14.09.2027", supplier: "Ivoclar", status: "mavjud", image: stockImages[7], price: 54000 },
];

export const stockCategories = ["Restavratsion materiallar", "Anesteziya", "Implantlar", "Endodontiya", "Asboblar", "Sarf materiallar", "Dezinfeksiya", "Profilaktika"];
export const stockSuppliers = ["3M", "Inibsa", "NeoBiotech", "Meta Biomed", "Osstem", "Cerkamed", "Unigloves", "Euronda", "Septodont", "Ivoclar"];

export function buildStock(): StockItem[] {
  const list = [...stockFirst];
  for (let index = 11; index <= 248; index += 1) {
    const low = index <= 22;
    const soon = index > 22 && index <= 28;
    list.push({
      id: `st-${index}`,
      name: `Material ${index}`,
      detail: "Klinika zaxirasi",
      category: stockCategories[index % stockCategories.length],
      sku: `SKU-${index}`,
      qty: low ? 2 + (index % 5) : 30 + (index % 40),
      min: 10,
      expiry: soon ? `0${(index % 8) + 1}.02.2026` : `${String((index % 27) + 1).padStart(2, "0")}.08.2027`,
      supplier: stockSuppliers[index % stockSuppliers.length],
      status: low ? "kam" : soon ? "tugash" : "mavjud",
      image: stockImages[index % stockImages.length],
      price: 20000 + (index % 15) * 10000,
    });
  }
  return list;
}

export function stockValue(items: StockItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}
