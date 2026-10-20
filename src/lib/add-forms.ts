import { formatGroupedNumber } from "@/lib/format";
import { formatUzPhone, isUzPhone, uzPhoneDigits } from "@/lib/phone-uz";
import type { FieldErrors } from "@/lib/work-validate";

export const ADD_CITIES = ["Toshkent", "Samarqand", "Buxoro", "Andijon", "Namangan", "Farg‘ona", "Qarshi", "Nukus", "Urganch", "Termiz", "Jizzax", "Guliston", "Navoiy"] as const;

export const ADD_DISTRICTS = ["Yunusobod", "Mirzo Ulug‘bek", "Mirobod", "Yakkasaroy", "Shayxontohur", "Olmazor", "Chilonzor", "Sergeli", "Bektemir", "Uchtepa", "Yangihayot", "Yashnobod"] as const;

export const ELON_CATEGORIES = ["Uskunalar", "Asboblar", "Materiallar", "Ijara", "Boshqa"] as const;

export const USTA_SPECIALTIES = [
  { id: "unit", label: "Unit ta‘mirlash" },
  { id: "kompressor", label: "Kompressor" },
  { id: "rentgen", label: "Rentgen" },
  { id: "avtoklav", label: "Avtoklav" },
  { id: "turbina", label: "Turbina" },
] as const;

export const USTA_HOURS = ["Du–Sha, 09:00–18:00", "Du–Sha, 08:00–20:00", "Du–Juma, 09:00–18:00", "Har kuni, 09:00–21:00"] as const;

export const USTA_YEARS = [
  { id: "0", label: "Tajriba yo‘q" },
  { id: "1", label: "1 yil" },
  { id: "2", label: "2 yil" },
  { id: "3", label: "3 yil" },
  { id: "5", label: "5 yil" },
  { id: "10", label: "10+ yil" },
] as const;

export const LAB_SPECIALTIES = [
  { id: "crown", label: "Krona" },
  { id: "veneer", label: "Vinir" },
  { id: "implant", label: "Implant" },
  { id: "removable", label: "Protez" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "cadcam", label: "CAD/CAM" },
] as const;

export const LAB_MATERIALS = [
  { id: "zirconia", label: "Zirkon" },
  { id: "emax", label: "E.max" },
  { id: "metal-ceramic", label: "Metallokeramika" },
  { id: "pmma", label: "PMMA" },
  { id: "wax", label: "Mum" },
  { id: "kompozit", label: "Kompozit" },
  { id: "boshqa", label: "Boshqa" },
] as const;

export const LAB_DAYS = ["du", "se", "ch", "pa", "ju", "sh", "ya"] as const;
export const LAB_DAY_LABEL: Record<(typeof LAB_DAYS)[number], string> = { du: "Du", se: "Se", ch: "Ch", pa: "Pa", ju: "Ju", sh: "Sh", ya: "Ya" };

export const JOB_TYPES = [
  { id: "full", label: "To‘liq stavka" },
  { id: "part", label: "Yarim stavka" },
  { id: "shift", label: "Smena" },
  { id: "amaliyot", label: "Amaliyot" },
] as const;

export const JOB_EXPERIENCE = [
  { id: "0", label: "Tajriba talab qilinmaydi" },
  { id: "1", label: "1 yildan" },
  { id: "2", label: "2 yildan" },
  { id: "3", label: "3 yildan" },
  { id: "5", label: "5 yildan" },
] as const;

export const JOB_PERKS = [
  { id: "rasmiy", label: "Rasmiy ish" },
  { id: "oqim", label: "Bemor oqimi" },
  { id: "malaka", label: "Malaka oshirish" },
  { id: "bonus", label: "Bonus" },
  { id: "sharoit", label: "Zamonaviy sharoit" },
  { id: "tushlik", label: "Tushlik" },
] as const;

const clip = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export function moneyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 12);
}

export function moneyText(value: string) {
  const digits = moneyDigits(value);
  if (!digits) return "";
  return formatGroupedNumber(Number(digits));
}

export function moneyNumber(value: string) {
  const digits = moneyDigits(value);
  return digits ? Number(digits) : null;
}

export function telegramHandle(value: string) {
  return value.trim().replace(/^@+/, "").replace(/\s/g, "").slice(0, 64);
}

function emailOk(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Empty is allowed. A filled value must be an http(s) URL of at most 400 characters. */
export function sourceUrlValue(value: string) {
  const raw = value.trim();
  if (!raw || raw.length > 400 || /\s/.test(raw)) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    if (!url.hostname) return "";
    return raw;
  } catch {
    return "";
  }
}

function sourceError(value: string, errors: FieldErrors) {
  const raw = value.trim();
  if (!raw) return;
  if (raw.length > 400) errors.sourceUrl = "Havola 400 belgidan oshmasin.";
  else if (!sourceUrlValue(raw)) errors.sourceUrl = "Havola http:// yoki https:// bilan boshlansin.";
}

function reached(phone: string, telegram: string, email: string, sourceUrl: string, apply = false) {
  return isUzPhone(phone) || telegramHandle(telegram).length >= 3 || emailOk(email.trim()) || Boolean(sourceUrlValue(sourceUrl)) || apply;
}

function partialContact(phone: string, telegram: string, email: string, sourceUrl: string) {
  return Boolean(
    (phone.trim() && !isUzPhone(phone))
    || (telegram.trim() && telegramHandle(telegram).length < 3)
    || (email.trim() && !emailOk(email.trim()))
    || (sourceUrl.trim() && !sourceUrlValue(sourceUrl)),
  );
}

export type ElonInput = {
  title: string;
  category: string;
  condition: "yangi" | "ishlatilgan";
  price: string;
  negotiable: boolean;
  description: string;
  city: string;
  district: string;
  phone: string;
  telegram: string;
  sourceUrl: string;
  photos: string[];
};

export function emptyElon(): ElonInput {
  return { title: "", category: "", condition: "yangi", price: "", negotiable: false, description: "", city: "", district: "", phone: "", telegram: "", sourceUrl: "", photos: [] };
}

export function validateElon(input: ElonInput, mode: "draft" | "publish"): FieldErrors {
  const errors: FieldErrors = {};
  sourceError(input.sourceUrl, errors);
  if (mode === "draft") {
    if (input.title.trim().length < 2) errors.title = "Qoralama uchun sarlavha kiriting.";
    return errors;
  }
  if (input.title.trim().length < 3) errors.title = "Sarlavha kamida 3 ta belgi bo‘lsin.";
  if (!input.category) errors.category = "Kategoriyani tanlang.";
  if (!input.city) errors.city = "Shaharni tanlang.";
  if (!input.negotiable && !moneyDigits(input.price)) errors.price = "Narxni kiriting yoki Kelishiladi ni belgilang.";
  if (input.price && !moneyDigits(input.price)) errors.price = "Narxni raqam bilan kiriting.";
  if (input.phone && !isUzPhone(input.phone)) errors.phone = "Telefon raqamini to‘liq kiriting yoki bo‘sh qoldiring.";
  if (input.telegram && telegramHandle(input.telegram).length < 3) errors.telegram = "Telegram manzilini to‘g‘ri kiriting.";
  if (input.description.trim().length > 0 && input.description.trim().length < 10) errors.description = "Tavsif kamida 10 ta belgi bo‘lsin yoki bo‘sh qoldiring.";
  if (!reached(input.phone, input.telegram, "", input.sourceUrl) && !partialContact(input.phone, input.telegram, "", input.sourceUrl)) {
    errors.contact = "Telefon, Telegram yoki manba havolasidan bittasini kiriting.";
  }
  return errors;
}

export function elonPayload(input: ElonInput, mode: "draft" | "publish", id?: string) {
  return {
    id: id || undefined,
    mode,
    title: clip(input.title, 120),
    category: clip(input.category, 40),
    condition: input.condition,
    price: input.negotiable && !moneyDigits(input.price) ? null : moneyNumber(input.price),
    negotiable: input.negotiable,
    description: clip(input.description, 4000),
    city: clip(input.city, 60),
    district: clip(input.district, 60),
    phone: formatUzPhone(input.phone),
    telegram: telegramHandle(input.telegram),
    sourceUrl: sourceUrlValue(input.sourceUrl),
    photos: input.photos.slice(0, 8),
  };
}

export type UstaInput = {
  name: string;
  services: string[];
  years: string;
  city: string;
  district: string;
  address: string;
  hours: string;
  priceFrom: string;
  priceNegotiable: boolean;
  description: string;
  phone: string;
  telegram: string;
  sourceUrl: string;
  photo: string;
  works: string[];
};

export function emptyUsta(): UstaInput {
  return { name: "", services: [], years: "", city: "", district: "", address: "", hours: "", priceFrom: "", priceNegotiable: false, description: "", phone: "", telegram: "", sourceUrl: "", photo: "", works: [] };
}

export function ustaTitle(services: string[]) {
  return services.map((id) => USTA_SPECIALTIES.find((item) => item.id === id)?.label ?? id).join(", ").slice(0, 80);
}

export function validateUsta(input: UstaInput, mode: "draft" | "publish"): FieldErrors {
  const errors: FieldErrors = {};
  sourceError(input.sourceUrl, errors);
  if (input.name.trim().length < 2) errors.name = "Ustaxona nomini kiriting.";
  if (mode === "draft") return errors;
  if (!input.city) errors.city = "Shaharni tanlang.";
  if (input.address.trim().length < 3) errors.address = "Manzilni kiriting.";
  if (input.phone && !isUzPhone(input.phone)) errors.phone = "Telefon raqamini to‘liq kiriting yoki bo‘sh qoldiring.";
  if (input.telegram && telegramHandle(input.telegram).length < 3) errors.telegram = "Telegram manzilini to‘g‘ri kiriting.";
  if (input.priceFrom && !moneyDigits(input.priceFrom)) errors.priceFrom = "Narxni raqam bilan kiriting.";
  if (!reached(input.phone, input.telegram, "", input.sourceUrl) && !partialContact(input.phone, input.telegram, "", input.sourceUrl)) {
    errors.contact = "Telefon, Telegram yoki manba havolasidan bittasini kiriting.";
  }
  return errors;
}

export function ustaPayload(input: UstaInput, mode: "draft" | "publish", id?: string) {
  const years = USTA_YEARS.some((item) => item.id === input.years) ? Number(input.years) : 0;
  return {
    id: id || undefined,
    mode,
    kind: "usta",
    name: clip(input.name, 80),
    title: ustaTitle(input.services) || clip(input.name, 80),
    services: input.services,
    years,
    city: clip(input.city, 60),
    district: clip(input.district, 60),
    address: clip(input.address, 200),
    hours: clip(input.hours, 80),
    priceFrom: moneyNumber(input.priceFrom),
    priceNegotiable: input.priceNegotiable,
    description: clip(input.description, 600),
    phone: formatUzPhone(input.phone),
    telegram: telegramHandle(input.telegram),
    sourceUrl: sourceUrlValue(input.sourceUrl),
    photo: input.photo,
    works: input.works.slice(0, 8),
  };
}

export type LabRow = { key: string; service: string; material: string; price: string; days: string };

export type LabInput = {
  name: string;
  services: string[];
  rows: LabRow[];
  materials: string[];
  city: string;
  district: string;
  address: string;
  weekdays: string[];
  openTime: string;
  closeTime: string;
  delivery: boolean;
  phone: string;
  telegram: string;
  email: string;
  sourceUrl: string;
  logo: string;
  photos: string[];
};

export function emptyLab(): LabInput {
  return {
    name: "",
    services: [],
    rows: [{ key: "row-1", service: "", material: "", price: "", days: "" }],
    materials: [],
    city: "",
    district: "",
    address: "",
    weekdays: ["du", "se", "ch", "pa", "ju", "sh"],
    openTime: "09:00",
    closeTime: "18:00",
    delivery: false,
    phone: "",
    telegram: "",
    email: "",
    sourceUrl: "",
    logo: "",
    photos: [],
  };
}

export function validateLabForm(input: LabInput, mode: "draft" | "publish"): FieldErrors {
  const errors: FieldErrors = {};
  sourceError(input.sourceUrl, errors);
  if (input.name.trim().length < 2) errors.name = "Laboratoriya nomini kiriting.";
  if (mode === "draft") return errors;
  if (!input.services.length) errors.services = "Kamida bitta mutaxassislikni tanlang.";
  if (!input.city) errors.city = "Shaharni tanlang.";
  if (input.address.trim().length < 3) errors.address = "Manzilni kiriting.";
  if (!input.weekdays.length) errors.weekdays = "Ish kunlarini tanlang.";
  if (input.phone && !isUzPhone(input.phone)) errors.phone = "Telefon raqamini to‘liq kiriting yoki bo‘sh qoldiring.";
  if (input.telegram && telegramHandle(input.telegram).length < 3) errors.telegram = "Telegram manzilini to‘g‘ri kiriting.";
  if (input.email && !emailOk(input.email.trim())) errors.email = "Email manzilini to‘g‘ri kiriting.";
  const badRow = input.rows.some((row) => (row.service || row.material || row.price || row.days) && row.service.trim().length < 2);
  if (badRow) errors.rows = "Xizmat turini kiriting yoki qatorni o‘chiring.";
  if (!reached(input.phone, input.telegram, input.email, input.sourceUrl) && !partialContact(input.phone, input.telegram, input.email, input.sourceUrl)) {
    errors.contact = "Telefon, Telegram, email yoki manba havolasidan bittasini kiriting.";
  }
  return errors;
}

export function labPayload(input: LabInput, mode: "draft" | "publish", id?: string) {
  const priceItems = input.rows
    .filter((row) => row.service.trim().length >= 2)
    .slice(0, 30)
    .map((row) => {
      const price = moneyNumber(row.price);
      const days = Number(row.days.replace(/\D/g, ""));
      const daysOk = Number.isInteger(days) && days >= 1 && days <= 60 ? days : null;
      const serviceId = LAB_SPECIALTIES.find((item) => item.label.toLowerCase() === row.service.trim().toLowerCase())?.id;
      const cat = serviceId === "veneer" ? "viner" : serviceId === "implant" ? "implant" : serviceId === "removable" ? "protez" : serviceId === "crown" ? "sirkon" : "boshqa";
      return {
        id: row.key.slice(0, 40),
        service: clip(row.service, 80),
        material: clip(row.material, 40),
        title: clip(row.service, 80),
        cat,
        tags: row.material.trim() ? [clip(row.material, 20)] : [],
        price,
        days: daysOk,
        daysMin: daysOk,
        daysMax: daysOk,
        photo: null,
      };
    });
  const prices = priceItems.map((row) => row.price).filter((n): n is number => n != null);
  const days = priceItems.map((row) => row.days).filter((n): n is number => n != null);
  const dayLabels = input.weekdays.map((id) => LAB_DAY_LABEL[id as (typeof LAB_DAYS)[number]] ?? id);
  const hours = dayLabels.length ? `${dayLabels[0]}–${dayLabels[dayLabels.length - 1]}, ${input.openTime || "09:00"}–${input.closeTime || "18:00"}` : "";
  return {
    id: id || undefined,
    mode,
    name: clip(input.name, 80),
    city: clip(input.city, 60),
    district: clip(input.district, 60),
    services: input.services,
    materials: input.materials,
    description: "",
    days: days.length ? Math.min(...days) : null,
    priceFrom: prices.length ? Math.min(...prices) : null,
    photo: input.photos[0] ?? "",
    phone: formatUzPhone(input.phone),
    telegram: telegramHandle(input.telegram),
    email: clip(input.email, 120),
    sourceUrl: sourceUrlValue(input.sourceUrl),
    logo: input.logo,
    photos: input.photos.slice(0, 8),
    portfolio: input.photos.slice(0, 8),
    priceItems,
    address: clip(input.address, 200),
    hours: hours.slice(0, 80),
    weekdays: input.weekdays,
    openTime: input.openTime,
    closeTime: input.closeTime,
    delivery: input.delivery,
    courier: input.delivery ? "ha" : "yoq",
  };
}

export type JobInput = {
  title: string;
  clinic: string;
  city: string;
  district: string;
  address: string;
  type: string;
  salaryMin: string;
  salaryMax: string;
  negotiable: boolean;
  experienceYears: string;
  requirements: string;
  duties: string;
  benefits: string[];
  benefitNote: string;
  phone: string;
  telegram: string;
  email: string;
  sourceUrl: string;
  acceptApplications: boolean;
};

export function emptyJob(): JobInput {
  return {
    title: "", clinic: "", city: "", district: "", address: "", type: "full", salaryMin: "", salaryMax: "", negotiable: false,
    experienceYears: "0", requirements: "", duties: "", benefits: [], benefitNote: "", phone: "", telegram: "", email: "", sourceUrl: "", acceptApplications: true,
  };
}

export function validateJobForm(input: JobInput, mode: "draft" | "publish"): FieldErrors {
  const errors: FieldErrors = {};
  sourceError(input.sourceUrl, errors);
  if (input.title.trim().length < 3) errors.title = mode === "draft" ? "Qoralama uchun lavozim nomini kiriting." : "Lavozim nomini kiriting (kamida 3 belgi).";
  if (mode === "draft") return errors;
  if (input.clinic.trim().length < 2) errors.clinic = "Klinika nomini kiriting.";
  if (!input.city) errors.city = "Shaharni tanlang.";
  if (!JOB_TYPES.some((item) => item.id === input.type)) errors.type = "Bandlik turini tanlang.";
  const min = moneyNumber(input.salaryMin);
  const max = moneyNumber(input.salaryMax);
  if (!input.negotiable && min == null && max == null) errors.salaryMin = "Maoshni kiriting yoki Kelishiladi ni belgilang.";
  if (min != null && max != null && max < min) errors.salaryMax = "Maksimal maosh minimaldan kam bo‘lmasin.";
  if (input.requirements.trim().length < 10) errors.requirements = "Talablarni yozing (kamida 10 belgi).";
  if (input.phone && !isUzPhone(input.phone)) errors.phone = "Telefon raqamini to‘liq kiriting yoki bo‘sh qoldiring.";
  if (input.telegram && telegramHandle(input.telegram).length < 3) errors.telegram = "Telegram manzilini to‘g‘ri kiriting.";
  if (input.email && !emailOk(input.email.trim())) errors.email = "Email manzilini to‘g‘ri kiriting.";
  if (!reached(input.phone, input.telegram, input.email, input.sourceUrl, input.acceptApplications) && !partialContact(input.phone, input.telegram, input.email, input.sourceUrl)) {
    errors.contact = "Telefon, Telegram, email, manba havolasi yoki saytda ariza qabul qilishdan bittasini qoldiring.";
  }
  return errors;
}

export function jobPayload(input: JobInput, mode: "draft" | "publish", id?: string) {
  const requirements = input.requirements.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8);
  const duties = input.duties.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 8);
  const description = [
    input.requirements.trim() ? `Talablar:\n${input.requirements.trim()}` : "",
    input.duties.trim() ? `Majburiyatlar:\n${input.duties.trim()}` : "",
  ].filter(Boolean).join("\n\n").slice(0, 2000);
  return {
    id: id || undefined,
    mode,
    title: clip(input.title, 100),
    clinic: clip(input.clinic, 100),
    city: clip(input.city, 60),
    district: clip(input.district, 60),
    address: clip(input.address, 200),
    type: input.type || "full",
    salaryMin: moneyNumber(input.salaryMin),
    salaryMax: moneyNumber(input.salaryMax),
    salaryNegotiable: input.negotiable,
    experienceYears: Number(input.experienceYears || 0),
    description: description || clip(input.title, 100),
    requirements: requirements.length ? requirements : input.requirements.trim() ? [clip(input.requirements, 160)] : [],
    duties: duties.length ? duties : input.duties.trim() ? [clip(input.duties, 160)] : [],
    benefits: input.benefits.slice(0, 6),
    benefitNote: clip(input.benefitNote, 80),
    phone: input.phone ? formatUzPhone(input.phone) : "",
    telegram: telegramHandle(input.telegram),
    email: clip(input.email, 120),
    sourceUrl: sourceUrlValue(input.sourceUrl),
    acceptApplications: input.acceptApplications,
    remote: false,
    category: "",
  };
}

export function phoneLocal(value: string) {
  return uzPhoneDigits(value);
}

export type SaveResult = { ok: true; id: string } | { ok: false; error: string; errors?: FieldErrors };

export async function saveAddForm(url: string, body: unknown): Promise<SaveResult> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; errors?: FieldErrors; item?: { id?: string }; master?: { id?: string }; lab?: { id?: string }; job?: { id?: string } } | null;
  if (!res.ok || !data?.ok) {
    return { ok: false, error: data?.error || "Saqlab bo‘lmadi.", errors: data?.errors };
  }
  const id = data.item?.id || data.master?.id || data.lab?.id || data.job?.id || "";
  return { ok: true, id };
}
