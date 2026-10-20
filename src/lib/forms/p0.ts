/** Shared P0 rules for the six add forms. Safe to import from client and server. */

export const USTA_VISIT = [
  { id: "clinic", label: "Ha, klinikaga boraman" },
  { id: "workshop", label: "Faqat ustaxonada" },
  { id: "both", label: "Ikkalasi" },
] as const;

export const USTA_SERVICE_CHIPS = [
  { id: "unit", label: "Stomatologik ustanovka" },
  { id: "turbina", label: "Turbinali nakonechnik" },
  { id: "tamirlash", label: "Burchakli nakonechnik" },
  { id: "kompressor", label: "Kompressor" },
  { id: "avtoklav", label: "Avtoklav" },
  { id: "servis", label: "Skaler / fotopolimer" },
  { id: "rentgen", label: "Rentgen / radioviziograf" },
  { id: "kreslo", label: "Ustanovka o‘rnatish" },
  { id: "ornatish", label: "Elektr va santexnika" },
  { id: "mebel", label: "Mebel" },
  { id: "konsultatsiya", label: "Maslahat" },
  { id: "endo", label: "Apeks-lokator / endomotor" },
  { id: "aspirator", label: "So‘rgich (aspirator)" },
] as const;

export const LAB_TURNAROUND = [
  { id: "1-3", label: "1–3 kun" },
  { id: "3-5", label: "3–5 kun" },
  { id: "5-7", label: "5–7 kun" },
  { id: "7+", label: "7+ kun" },
] as const;

export const LAB_FLOW = [
  { id: "stl", label: "Intraoral skan (STL) qabul qilamiz" },
  { id: "impression", label: "Faqat qolip (ottisk)" },
  { id: "both", label: "Ikkalasi" },
] as const;

export const LAB_WORK_CHIPS = [
  { id: "crown", label: "Sirkoniy tojlar" },
  { id: "veneer", label: "Vinirlar" },
  { id: "implant", label: "Implant ustidagi konstruksiyalar" },
  { id: "bridge", label: "Metallokeramika" },
  { id: "removable", label: "Olinadigan protezlar" },
  { id: "ortodontiya", label: "Kappalar / elaynerlar" },
  { id: "cadcam", label: "CAD/CAM frezerlash" },
  { id: "emax", label: "E.max" },
  { id: "pmma", label: "Vaqtinchalik tojlar (PMMA)" },
  { id: "bugel", label: "Bugel protezlar" },
  { id: "guide", label: "Jarrohlik shabloni" },
] as const;

export const JOB_ROLE_CHIPS = [
  "Stomatolog-terapevt",
  "Stomatolog-ortoped",
  "Ortodont",
  "Jarroh-stomatolog",
  "Implantolog",
  "Bolalar stomatologi",
  "Gigienist",
  "Endodontist",
  "Assistent (hamshira)",
  "Tish texnigi",
  "Administrator",
] as const;

export const JOB_STYLE = [
  { id: "full", label: "To‘liq stavka" },
  { id: "part", label: "Yarim stavka" },
  { id: "shift", label: "Smenali" },
  { id: "freelance", label: "Foizga ishlash" },
  { id: "amaliyot", label: "Ijara (kreslo)" },
] as const;

export const ELON_WEAR = [
  { id: "yangi", label: "Yangi", condition: "yangi" },
  { id: "alo", label: "Ishlatilgan — a’lo", condition: "ishlatilgan" },
  { id: "yaxshi", label: "Ishlatilgan — yaxshi", condition: "ishlatilgan" },
  { id: "tamirtalab", label: "Ta’mirtalab", condition: "ishlatilgan" },
] as const;

export const CASE_TAGS = [
  "Terapiya",
  "Endodontiya",
  "Estetik restavratsiya",
  "Ortopediya",
  "Implantologiya",
  "Jarrohlik",
  "Parodontologiya",
  "Ortodontiya",
  "Bolalar stomatologiyasi",
] as const;

export const SURPLUS_QTY_UNITS = ["dona", "shprits", "quti", "toplam", "ml", "g"] as const;

export const SURPLUS_MIN_DAYS = 60;

const DRUG_RE =
  /anestez|anesthetic|anaesthe|articain|ubistesin|ultracain|ultracaine|lidocain|septanest|scandonest|mepivacain|bupivacain|karpula|carpule|carpul|adrenalin|epinephrin|antibiot|amoksicil|amoxicil|ibuprofen|ketorol|deksametazon|dexameth|novocain|novokain|dori\s*vosita/i;

export const DRUG_BLOCK_MESSAGE =
  "Dori vositalarini bu bo‘limda sotib bo‘lmaydi. Anestetik karpulalar va boshqa dorilar yuridik xulosagacha yopiq.";

export function surplusDrugProblem(name: string, brand: string, category: string) {
  if (category === "anesteziya" || DRUG_RE.test(`${name} ${brand} ${category}`)) return DRUG_BLOCK_MESSAGE;
  return "";
}

export function expiryFromParts(monthRaw: string, yearRaw: string, now = new Date()) {
  const month = Number(monthRaw);
  const year = Number(yearRaw);
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2024 || year > 2045) {
    return { ok: false as const, error: "Yaroqlilik muddatini OO / YYYY ko‘rinishida kiriting." };
  }
  const end = new Date(Date.UTC(year, month, 0));
  const tashkent = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const today = Date.UTC(tashkent.getUTCFullYear(), tashkent.getUTCMonth(), tashkent.getUTCDate());
  const daysLeft = Math.floor((end.getTime() - today) / 86_400_000);
  if (daysLeft < 0) return { ok: false as const, error: "Muddati o‘tgan materialni sotib bo‘lmaydi — bu bemorlar xavfsizligi uchun." };
  if (daysLeft < SURPLUS_MIN_DAYS) return { ok: false as const, error: "Yaroqlilik muddati 2 oydan kam qolgan. Bunday materiallar joylanmaydi." };
  const expiryMonths = Math.min(120, Math.max(1, Math.round(daysLeft / 30)));
  return { ok: true as const, expiryOn: end.toISOString().slice(0, 10), expiryMonths, daysLeft };
}

export type VideoCapture = "live_camera" | "capture_input" | "desktop_file";

export type SurplusVideoMeta = {
  tokenId: string;
  code: string;
  captureSource: VideoCapture;
  durationMs: number;
  sizeBytes: number;
  sha256: string;
  mobile: boolean;
};

export function videoMetaProblem(meta: Partial<SurplusVideoMeta> | null | undefined) {
  if (!meta?.tokenId || !meta.captureSource) return "Mahsulotni 15–60 soniyalik video bilan ko‘rsating: muddat va LOT aniq ko‘rinsin.";
  if (meta.mobile && meta.captureSource === "desktop_file") return "Telefonda videoni jonli kameradan yozing. Galereyadan yuklash qabul qilinmaydi.";
  if (!meta.durationMs || meta.durationMs < 15_000) return "Video juda qisqa. Muddat va LOT’ni yaqindan ko‘rsatishga ulguring — kamida 15 soniya.";
  if (meta.durationMs > 60_000) return "Video 60 soniyadan oshmasin.";
  if (meta.sizeBytes && meta.sizeBytes > 50 * 1024 * 1024) return "Video 50 MB dan oshmasin.";
  return "";
}

export function caseProblem(input: {
  text: string;
  tags: string[];
  images: string[];
  consent?: boolean;
  faceAck?: boolean;
  complaint?: string;
  diagnosis?: string;
  steps?: string;
}) {
  const personal = personalDataProblem(`${input.text}\n${input.complaint ?? ""}\n${input.diagnosis ?? ""}\n${input.steps ?? ""}`);
  if (personal) return personal;
  if (!input.consent) return "Klinik holatni joylash uchun bemor roziligini tasdiqlang.";
  if (!input.faceAck) return "Yuz va shaxsiy ma’lumot ko‘rinmasligini tasdiqlang.";
  const complaint = (input.complaint ?? "").trim();
  const diagnosis = (input.diagnosis ?? "").trim();
  const steps = (input.steps ?? "").trim();
  if (complaint.length < 3 && !/shikoyat\s*:/i.test(input.text)) return "Shikoyatni yozing.";
  if (diagnosis.length < 3 && !/diagnoz\s*:/i.test(input.text)) return "Diagnozni yozing.";
  if (input.images.length < 2) return "Oldin va keyin rasmlarini qo‘shing — kamida 2 ta.";
  if (!/\d+\s*[.)]/.test(steps) && !/\d+\s*[.)]/.test(input.text)) return "Davolash bosqichlarini raqamlab yozing (1. 2. 3.).";
  const known = input.tags.some((tag) => CASE_TAGS.some((item) => item.toLowerCase() === tag.toLowerCase()));
  if (!known) return "Mutaxassislik chipini tanlang.";
  return "";
}

export function personalDataProblem(text: string) {
  if (/\+?998\s?\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/.test(text)) return "Matnda telefon raqami bor. Bemorning shaxsiy ma’lumotini olib tashlang.";
  if (/\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/.test(text) && /bemor|familiya|ism/i.test(text)) {
    return "Matnda bemorning shaxsiy ma’lumotiga o‘xshash narsa bor. Iltimos, olib tashlang.";
  }
  return "";
}
