/** Shared (client + server) validators for the DB-backed sections: Ustalar, Laboratoriya, Ishlar, Ortiqcha material. Messages are Uzbek. */
export type FieldErrors = Record<string, string>;

export const MASTER_SERVICES = ["rentgen", "kreslo", "ornatish", "tamirlash", "mebel", "servis", "konsultatsiya"] as const;
export const LAB_SERVICES = ["crown", "veneer", "implant", "bridge", "removable", "cadcam"] as const;
export const LAB_MATERIALS = ["zirconia", "emax", "metal-ceramic", "premium"] as const;

export function digits9(value: unknown) {
  const d = String(value ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : d;
}
export function phoneOk(value: unknown) {
  return digits9(value).length === 9;
}
const PHONE_MSG = "Telefon raqamini to‘liq kiriting (kamida 9 raqam).";
const t = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
function intIn(v: unknown, min: number, max: number) {
  const n = typeof v === "number" ? v : Number(String(v ?? "").trim());
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}
function pickList<T extends string>(v: unknown, allowed: readonly T[]) {
  return Array.isArray(v) ? (Array.from(new Set(v.filter((x): x is T => allowed.includes(x as T)))) as T[]) : [];
}

export type MasterInput = { kind: string; name: string; title: string; services: string[]; city: string; years: string | number; description: string; photo: string; phone: string; telegram: string };
export function validateMaster(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const services = pickList(input.services, MASTER_SERVICES);
  const years = intIn(input.years === "" || input.years == null ? 0 : input.years, 0, 60);
  const clean = {
    kind: input.kind === "kompaniya" ? "kompaniya" : "usta",
    name: t(input.name, 80),
    title: t(input.title, 80),
    services,
    city: t(input.city, 60),
    years: years ?? 0,
    description: t(input.description, 600),
    photo: t(input.photo, 400),
    phone: t(input.phone, 40),
    telegram: t(input.telegram, 80),
    district: t(input.district, 60),
    works: (Array.isArray(input.works) ? input.works : []).map((x) => t(x, 400)).filter(Boolean).slice(0, 12),
  };
  if (clean.name.length < 2) errors.name = "Ism yoki kompaniya nomini kiriting.";
  if (clean.title.length < 2) errors.title = "Mutaxassislikni kiriting (masalan, Stomatolog texnik).";
  if (services.length < 1) errors.services = "Kamida bitta xizmat turini tanlang.";
  if (clean.city.length < 2) errors.city = "Shaharni tanlang.";
  if (years === null) errors.years = "Tajribani 0 dan 60 gacha yilda kiriting.";
  if (clean.description && clean.description.length < 10) errors.description = "Tavsif kamida 10 ta belgi bo‘lsin yoki bo‘sh qoldiring.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  return { errors, clean };
}

const REQ_V2 = ["kreslo", "rentgen", "profilaktika", "ehtiyot", "kompressor", "sterilizatsiya", "skaner", "boshqa"];

/**
 * Service request. v1 (desktop sheet) sends a single `service`; v2 (mobile sheet) sends `services[]`,
 * `timeRange`, `media[]`, `extra` and requires description, address, date and time range.
 */
export function validateMasterRequest(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const v2 = Array.isArray(input.services);
  const when = ["bugun", "ertaga", "sana"].includes(String(input.when)) ? String(input.when) : "bugun";
  const services = v2 ? [...new Set((input.services as unknown[]).map(String).filter((x) => REQ_V2.includes(x)))] : [];
  const clean = {
    service: t(input.service, 20),
    services,
    clinic: t(input.clinic, 120),
    district: t(input.district, 60),
    address: t(input.address, 200),
    name: t(input.name, 80),
    phone: t(input.phone, 40),
    note: t(input.note, 500),
    when,
    date: t(input.date, 12),
    timeRange: t(input.timeRange, 40),
    media: (Array.isArray(input.media) ? input.media : []).map((x) => t(x, 400)).filter((x) => /^https:\/\//.test(x)).slice(0, 5),
    extra: t(input.extra, 500),
  };
  if (v2) {
    if (!services.length) errors.services = "Kamida bitta xizmat turini tanlang.";
    if (clean.note.length < 10) errors.note = "Muammoni kamida 10 ta belgida yozing.";
    if (!clean.district) errors.district = "Tumanni tanlang.";
    if (clean.address.length < 3) errors.address = "Aniq manzilni kiriting.";
    if (!clean.timeRange) errors.timeRange = "Vaqt oralig‘ini tanlang.";
    if (!clean.clinic) clean.clinic = clean.address;
  } else if (!["rentgen", "kreslo", "ornatish", "tamirlash", "mebel"].includes(clean.service)) errors.service = "Xizmat turini tanlang.";
  if (clean.clinic.length < 2) errors[v2 ? "address" : "clinic"] = v2 ? "Aniq manzilni kiriting." : "Klinika nomini kiriting.";
  if (clean.name.length < 2) errors.name = "Ismingizni kiriting.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  if (when === "sana" || v2) {
    const d = new Date(`${clean.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.date) || Number.isNaN(d.getTime())) errors.date = "Sanani tanlang.";
    else if (d < today) errors.date = "Sana o‘tib ketgan bo‘lmasin.";
  }
  return { errors, clean: v2 ? { ...clean, when: "sana" } : clean };
}

export const LAB_PRICE_CATS = ["metall-keramika", "sirkon", "emax", "viner", "implant", "protez", "jarrohlik", "aligner", "boshqa"] as const;

function urlList(v: unknown, max: number) {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim().slice(0, 400)).slice(0, max) : [];
}

/** Lab price list rows: title required; price/days optional (null = kelishiladi / noma’lum). */
function cleanPriceItems(v: unknown, errors: FieldErrors) {
  if (!Array.isArray(v)) return [];
  const out: { id: string; title: string; cat: string; tags: string[]; price: number | null; daysMin: number | null; daysMax: number | null; photo: string | null }[] = [];
  for (const raw of v.slice(0, 30)) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const title = t(r.title, 80);
    if (title.length < 2) continue;
    const cat = (LAB_PRICE_CATS as readonly string[]).includes(String(r.cat)) ? String(r.cat) : "boshqa";
    const tags = (Array.isArray(r.tags) ? r.tags : typeof r.tags === "string" ? r.tags.split(",") : []).map((x) => t(x, 20)).filter(Boolean).slice(0, 3);
    const price = r.price === "" || r.price == null ? null : intIn(String(r.price).replace(/\s/g, ""), 0, 1_000_000_000);
    let daysMin = r.daysMin === "" || r.daysMin == null ? null : intIn(r.daysMin, 1, 60);
    let daysMax = r.daysMax === "" || r.daysMax == null ? null : intIn(r.daysMax, 1, 60);
    if (daysMin !== null && daysMax !== null && daysMax < daysMin) [daysMin, daysMax] = [daysMax, daysMin];
    if (r.price !== "" && r.price != null && price === null) errors.priceItems = "Narxni raqam bilan kiriting.";
    const id = typeof r.id === "string" && /^[a-z0-9-]{4,40}$/i.test(r.id) ? r.id : Math.random().toString(36).slice(2, 10);
    out.push({ id, title, cat, tags, price, daysMin, daysMax, photo: t(r.photo, 400) || null });
  }
  return out;
}

export function validateLab(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const services = pickList(input.services, LAB_SERVICES);
  const materials = pickList(input.materials, LAB_MATERIALS);
  const days = input.days === "" || input.days == null ? null : intIn(input.days, 1, 60);
  const priceRaw = input.priceFrom === "" || input.priceFrom == null ? null : intIn(String(input.priceFrom).replace(/\s/g, ""), 0, 1_000_000_000);
  const clean = {
    name: t(input.name, 80),
    city: t(input.city, 60),
    services,
    materials,
    description: t(input.description, 600),
    days,
    priceFrom: priceRaw,
    photo: t(input.photo, 400),
    phone: t(input.phone, 40),
    telegram: t(input.telegram, 80),
    district: t(input.district, 60),
    photos: urlList(input.photos, 12),
    video: t(input.video, 400),
    logo: t(input.logo, 400),
    years: input.years === "" || input.years == null ? null : intIn(input.years, 0, 60),
    courier: input.courier === "ha" || input.courier === "yoq" ? (input.courier as "ha" | "yoq") : null,
    courierArea: t(input.courierArea, 60),
    portfolio: urlList(input.portfolio, 24),
    priceItems: cleanPriceItems(input.priceItems, errors),
  };
  if (input.years !== "" && input.years != null && clean.years === null) errors.years = "Tajribani 0 dan 60 yilgacha kiriting.";
  if (clean.name.length < 2) errors.name = "Laboratoriya nomini kiriting.";
  if (clean.city.length < 2) errors.city = "Shaharni tanlang.";
  if (services.length < 1) errors.services = "Kamida bitta xizmat turini tanlang.";
  if (input.days !== "" && input.days != null && days === null) errors.days = "Muddatni 1 dan 60 kungacha kiriting.";
  if (input.priceFrom !== "" && input.priceFrom != null && priceRaw === null) errors.priceFrom = "Narxni raqam bilan kiriting.";
  if (clean.description && clean.description.length < 10) errors.description = "Tavsif kamida 10 ta belgi bo‘lsin yoki bo‘sh qoldiring.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  return { errors, clean };
}

/** Initials / code only — reject obvious full names. */
export function isPatientCode(value: string) {
  const text = value.trim();
  if (!text || text.length > 16) return false;
  if (/[A-ZА-ЯЁ][a-zа-яё]{2,}\s+[A-ZА-ЯЁ][a-zа-яё]{2,}/.test(text)) return false;
  if (/(?:bemor|patient)\s+/i.test(text)) return false;
  return /^[A-Za-zА-Яа-яЁё0-9 .'\-]{1,16}$/.test(text);
}

export function validateLabOrder(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const due = intIn(input.dueDays, 1, 60);
  const clean = {
    service: t(input.service, 20),
    material: t(input.material, 20),
    patientCode: t(input.patientCode, 16),
    dueDays: due ?? 0,
    phone: t(input.phone, 40),
    note: t(input.note, 500),
  };
  if (!(LAB_SERVICES as readonly string[]).includes(clean.service)) errors.service = "Xizmat turini tanlang.";
  if (!(LAB_MATERIALS as readonly string[]).includes(clean.material)) errors.material = "Materialni tanlang.";
  if (!isPatientCode(clean.patientCode)) errors.patientCode = "Bemor kodi — faqat initsial yoki kod (masalan A.K. yoki B-14). To‘liq ism yozilmasin.";
  if (due === null) errors.dueDays = "Muddatni tanlang.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  return { errors, clean };
}

export const JOB_TYPES = ["full", "part", "shift", "freelance", "amaliyot"] as const;
export const JOB_CATEGORIES = ["klinika", "texnik", "shifokor"] as const;
export const JOB_BENEFITS = ["rasmiy", "oqim", "malaka", "jamoa", "sharoit", "avtoturargoh", "tushlik", "bonus"] as const;
export const SURPLUS_CATEGORIES = ["kompozit", "bonding", "sement", "endodontiya", "implantlar", "anesteziya", "borlar", "instrument", "ortodontiya"] as const;

function moneyOrNull(v: unknown, label: string, errors: FieldErrors, key: string) {
  if (v === "" || v == null) return null;
  const n = intIn(String(v).replace(/[\s,]/g, ""), 0, 1_000_000_000);
  if (n === null) errors[key] = `${label} raqam bilan kiritilsin.`;
  return n;
}

export function validateJob(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const salaryMin = moneyOrNull(input.salaryMin, "Minimal maosh", errors, "salaryMin");
  const salaryMax = moneyOrNull(input.salaryMax, "Maksimal maosh", errors, "salaryMax");
  const exp = intIn(input.experienceYears === "" || input.experienceYears == null ? 0 : input.experienceYears, 0, 40);
  const clean = {
    title: t(input.title, 100),
    clinic: t(input.clinic, 100),
    city: t(input.city, 60),
    salaryMin,
    salaryMax,
    type: (JOB_TYPES as readonly string[]).includes(String(input.type)) ? String(input.type) : "full",
    experienceYears: exp ?? 0,
    remote: input.remote === true,
    description: t(input.description, 2000),
    phone: t(input.phone, 40),
    category: (JOB_CATEGORIES as readonly string[]).includes(String(input.category)) ? String(input.category) : "",
    photos: Array.isArray(input.photos) ? input.photos.filter((x): x is string => typeof x === "string" && x.startsWith("https://")).slice(0, 8) : [],
    video: t(input.video, 400),
    logo: t(input.logo, 400),
    district: t(input.district, 60),
    address: t(input.address, 200),
    workDays: t(input.workDays, 60),
    workHours: t(input.workHours, 40),
    benefits: pickList(input.benefits, JOB_BENEFITS).slice(0, 6),
    requirements: (Array.isArray(input.requirements) ? input.requirements : typeof input.requirements === "string" ? input.requirements.split("\n") : [])
      .map((x) => t(x, 160))
      .filter(Boolean)
      .slice(0, 8),
    employerAbout: t(input.employerAbout, 160),
    staffCount: input.staffCount === "" || input.staffCount == null ? null : intIn(input.staffCount, 1, 5000),
    foundedYear: input.foundedYear === "" || input.foundedYear == null ? null : intIn(input.foundedYear, 1950, new Date().getFullYear()),
  };
  if (input.staffCount !== "" && input.staffCount != null && clean.staffCount === null) errors.staffCount = "Xodimlar sonini 1 dan 5000 gacha kiriting.";
  if (input.foundedYear !== "" && input.foundedYear != null && clean.foundedYear === null) errors.foundedYear = "Yilni to‘g‘ri kiriting (masalan, 2018).";
  if (Array.isArray(input.benefits) && input.benefits.length > 6) errors.benefits = "Ko‘pi bilan 6 ta afzallik tanlang.";
  if (clean.title.length < 3) errors.title = "Lavozim nomini kiriting (kamida 3 belgi).";
  if (clean.clinic.length < 2) errors.clinic = "Klinika nomini kiriting.";
  if (clean.city.length < 2) errors.city = "Shaharni tanlang.";
  if (exp === null) errors.experienceYears = "Tajribani 0 dan 40 gacha yilda kiriting.";
  if (salaryMin !== null && salaryMax !== null && salaryMax < salaryMin) errors.salaryMax = "Maksimal maosh minimaldan kam bo‘lmasin.";
  if (clean.description.length < 20) errors.description = "Vakansiya tavsifi kamida 20 ta belgi bo‘lsin.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  return { errors, clean };
}

export function validateJobApplication(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const exp = intIn(input.experienceYears === "" || input.experienceYears == null ? 0 : input.experienceYears, 0, 60);
  const clean = { name: t(input.name, 80), phone: t(input.phone, 40), telegram: t(input.telegram, 80), experienceYears: exp ?? 0, note: t(input.note, 800) };
  if (clean.name.length < 2) errors.name = "Ismingizni kiriting.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  if (exp === null) errors.experienceYears = "Tajribani 0 dan 60 gacha yilda kiriting.";
  return { errors, clean };
}

export function validateResume(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const exp = intIn(input.experienceYears === "" || input.experienceYears == null ? 0 : input.experienceYears, 0, 60);
  const salaryFrom = moneyOrNull(input.salaryFrom, "Maosh", errors, "salaryFrom");
  const clean = {
    name: t(input.name, 80),
    role: t(input.role, 80),
    city: t(input.city, 60),
    experienceYears: exp ?? 0,
    salaryFrom,
    about: t(input.about, 800),
    phone: t(input.phone, 40),
    telegram: t(input.telegram, 80),
    published: input.published !== false,
  };
  if (clean.name.length < 2) errors.name = "Ism-familiyangizni kiriting.";
  if (clean.role.length < 2) errors.role = "Mutaxassisligingizni kiriting (masalan, Stomatolog-terapevt).";
  if (clean.city.length < 2) errors.city = "Shaharni tanlang.";
  if (exp === null) errors.experienceYears = "Tajribani 0 dan 60 gacha yilda kiriting.";
  if (clean.about && clean.about.length < 10) errors.about = "O‘zingiz haqingizda kamida 10 ta belgi yozing yoki bo‘sh qoldiring.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  return { errors, clean };
}

export function validateContact(input: Record<string, unknown>, messageMax = 500) {
  const errors: FieldErrors = {};
  const clean = { name: t(input.name, 80), phone: t(input.phone, 40), message: t(input.message, messageMax) };
  if (clean.name.length < 2) errors.name = "Ismingizni kiriting.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  return { errors, clean };
}

/** Dealer / wholesale tone is not allowed — personal clinic leftovers only. */
export function surplusNoteProblem(note: string, title: string) {
  const text = note.trim();
  if (text.length < 12) return "Shaxsiy izoh yozing — nima uchun ortiqcha, qayerda saqlangan (kamida 12 belgi).";
  const blob = `${title} ${text}`;
  const dealer = /(ulgurji|diler|wholesale|partiya|distributor|importyor|\boptom\b)/i.test(blob);
  const personal = /(ortiqcha|klinika|qolgan|o['‘]?zim|shaxsiy|yaroqlilik|muddat|ochilgan|yopiq)/i.test(text);
  if (dealer && !personal) return "Ulgurji/diler ohangida e’lon qabul qilinmaydi. Klinika ortiqchasi ekanini izohda yozing.";
  return "";
}

export function validateSurplus(input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const price = intIn(String(input.price ?? "").replace(/[\s,]/g, ""), 1, 10_000_000_000);
  const newPrice = input.newPrice === "" || input.newPrice == null ? null : intIn(String(input.newPrice).replace(/[\s,]/g, ""), 1, 10_000_000_000);
  const expiry = intIn(String(input.expiryMonths ?? "").replace(/\D/g, ""), 1, 120);
  const clean = {
    name: t(input.name, 100),
    brand: t(input.brand, 60),
    category: String(input.category ?? ""),
    price: price ?? 0,
    newPrice,
    pkg: input.pkg === "ochilgan" ? "ochilgan" : input.pkg === "yopiq" ? "yopiq" : "",
    expiryMonths: expiry ?? 0,
    city: t(input.city, 60),
    district: t(input.district, 60),
    phone: t(input.phone, 40),
    telegram: t(input.telegram, 80),
    image: t(input.image, 400),
    note: t(input.note, 600),
    images: Array.isArray(input.images) ? input.images.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim().slice(0, 400)).slice(0, 8) : [],
    video: t(input.video, 400),
    description: t(input.description, 2000),
    address: t(input.address, 200),
    lat: typeof input.lat === "number" && Number.isFinite(input.lat) && Math.abs(input.lat) <= 90 ? input.lat : null,
    lng: typeof input.lng === "number" && Number.isFinite(input.lng) && Math.abs(input.lng) <= 180 ? input.lng : null,
  };
  if ((clean.lat === null) !== (clean.lng === null)) {
    clean.lat = null;
    clean.lng = null;
  }
  if (clean.name.length < 2) errors.name = "Mahsulot nomini kiriting.";
  if (!clean.brand) errors.brand = "Brendni kiriting.";
  if (!(SURPLUS_CATEGORIES as readonly string[]).includes(clean.category)) errors.category = "Kategoriyani tanlang.";
  if (price === null) errors.price = "Narxni raqam bilan kiriting.";
  if (input.newPrice !== "" && input.newPrice != null && newPrice === null) errors.newPrice = "Asl narxni raqam bilan kiriting yoki bo‘sh qoldiring.";
  if (!clean.pkg) errors.pkg = "Holatni tanlang (Yopiq yoki Ochilgan).";
  if (expiry === null) errors.expiryMonths = "Yaroqlilik muddatini oyda kiriting (1–120).";
  if (clean.city.length < 2) errors.city = "Shaharni tanlang.";
  if (!phoneOk(clean.phone)) errors.phone = PHONE_MSG;
  const noteErr = surplusNoteProblem(clean.note, clean.name);
  if (noteErr) errors.note = noteErr;
  return { errors, clean };
}

export function validateClinicOp(op: string, input: Record<string, unknown>) {
  const errors: FieldErrors = {};
  const clean: Record<string, unknown> = {};
  const name = t(input.name, 80);
  const timeRe = /^[0-2]\d:[0-5]\d$/;
  if (op === "clinic_save") {
    Object.assign(clean, { name, branch: t(input.branch, 80), address: t(input.address, 200), openTime: t(input.openTime, 5) || "09:00", closeTime: t(input.closeTime, 5) || "18:00" });
    if (name.length < 2) errors.name = "Klinika nomini kiriting.";
    if (!timeRe.test(String(clean.openTime)) || !timeRe.test(String(clean.closeTime))) errors.openTime = "Ish vaqtini SS:DD ko‘rinishida kiriting (masalan 09:00).";
  } else if (op === "patient_save") {
    const phone = t(input.phone, 40);
    Object.assign(clean, { name, phone, status: input.status === "Noaktiv" ? "Noaktiv" : "Faol", note: t(input.note, 500) });
    if (name.length < 2) errors.name = "Bemor ismini kiriting.";
    if (phone && !phoneOk(phone)) errors.phone = PHONE_MSG;
  } else if (op === "visit_save") {
    const date = t(input.date, 12);
    const time = t(input.time, 5);
    Object.assign(clean, { patientId: t(input.patientId, 40), name, date, time, procedure: t(input.procedure, 80) || "Ko‘rik" });
    if (!clean.patientId && name.length < 2) errors.patientId = "Bemorni tanlang yoki ismini kiriting.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) errors.date = "Sanani tanlang.";
    if (!timeRe.test(time)) errors.time = "Vaqtni SS:DD ko‘rinishida kiriting (masalan 14:30).";
  } else if (op === "visit_status") {
    clean.status = ["Keldi", "Kutilyapti", "Bekor"].includes(String(input.status)) ? input.status : "";
    if (!clean.status) errors.status = "Holat noto‘g‘ri.";
  } else if (op === "staff_save") {
    Object.assign(clean, { name, role: t(input.role, 80), onDuty: input.onDuty !== false });
    if (name.length < 2) errors.name = "Xodim ismini kiriting.";
    if (String(clean.role).length < 2) errors.role = "Lavozimni kiriting.";
  } else if (!["patient_delete", "visit_delete", "staff_delete"].includes(op)) {
    errors.op = "Amal noto‘g‘ri.";
  }
  return { errors, clean };
}

export function fieldsResponseBody(errors: FieldErrors) {
  return { ok: false, errors, error: Object.values(errors).find(Boolean) ?? "Maydonlarni tekshiring." };
}
