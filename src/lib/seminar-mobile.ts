import { getSeminarSpeakers, specialtyLabels, type Seminar } from "@/data/seminars";

/** Tags are derived only from real catalog fields (city/specialty/keywords) — nothing is invented. */
export type SeminarTag = { label: string; tone: "blue" | "green" | "violet" | "orange" };

const norm = (s: string) => s.toLowerCase();

export function isMasterClass(s: Seminar) {
  return /master-?\s?klass/.test(norm(`${s.title} ${s.description ?? ""}`));
}

export function isCourse(s: Seminar) {
  return /\bkurs/.test(norm(`${s.title} ${s.description ?? ""}`));
}

export function seminarTags(s: Seminar): SeminarTag[] {
  const tags: SeminarTag[] = [s.city === "Online" ? { label: "Onlayn", tone: "green" } : { label: "Offlayn", tone: "blue" }];
  if (isMasterClass(s)) tags.push({ label: "Master-klass", tone: "violet" });
  else if (isCourse(s)) tags.push({ label: "Kurs", tone: "blue" });
  else if (s.specialty === "kongress") tags.push({ label: "Kongress", tone: "orange" });
  for (const t of s.tags ?? []) if (tags.length < 4) tags.push({ label: t, tone: "blue" });
  return tags;
}

export type SeminarCategory = "implantologiya" | "endodontiya" | "ortodontiya" | "estetika" | "jarrohlik" | "boshqa";

export const seminarCategories: { id: SeminarCategory; label: string }[] = [
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "estetika", label: "Estetik stomatologiya" },
  { id: "jarrohlik", label: "Jarrohlik" },
  { id: "boshqa", label: "Boshqalar" },
];

const surgeryRe = /jarroh|surgery|sinus|augment|sutur|flap/;

export function inCategory(s: Seminar, c: SeminarCategory) {
  const hay = `${s.title} ${s.description ?? ""} ${(s.tags ?? []).join(" ")}`.toLowerCase();
  switch (c) {
    case "implantologiya":
    case "endodontiya":
    case "ortodontiya":
    case "estetika":
      return s.specialty === c;
    case "jarrohlik":
      return surgeryRe.test(hay);
    case "boshqa":
      return s.specialty === "kongress";
  }
}

export type ProgramStep = { time: string; title: string; hint: string; highlight?: boolean };

const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** Neutral generic stages laid over the seminar's real start/end time (no per-seminar schedule exists). */
export function programSteps(s: Seminar): ProgramStep[] {
  if (s.program?.length) return s.program.map((x) => ({ time: x.time, title: x.title, hint: "" }));
  const [h1, m1] = s.time.split(":").map(Number);
  const [h2, m2] = s.timeEnd.split(":").map(Number);
  const start = h1 * 60 + m1;
  const total = Math.max(60, h2 * 60 + m2 - start);
  const r5 = (n: number) => Math.round(n / 5) * 5;
  const reg = Math.min(30, r5(total * 0.08));
  const qa = Math.min(30, r5(total * 0.08));
  const coffee = Math.min(30, r5(total * 0.08));
  const rest = total - reg - qa - coffee;
  const theory = r5(rest * 0.45);
  const practice = rest - theory;
  const spec: [string, string, number, boolean?][] = [
    ["Ro‘yxatga olish", "Ishtirokchilarni kutib olish", reg],
    ["Nazariy qism", "Asosiy ma’ruza", theory],
    ["Kofe-breyk", "Tanaffus va networking", coffee],
    ["Amaliy mashg‘ulot", "Amaliy ish va namoyish", practice, true],
    ["Savol-javob", "Yakuniy muhokama", qa],
  ];
  let cur = start;
  return spec.map(([title, hint, len, hl]) => {
    const row = { time: `${hm(cur)} – ${hm(cur + len)}`, title, hint, highlight: Boolean(hl) };
    cur += len;
    return row;
  });
}

export function discountPercent(s: Seminar) {
  if (!s.oldPrice || s.oldPrice <= s.price) return 0;
  return Math.round((1 - s.price / s.oldPrice) * 100);
}

export function durationLabel(s: Seminar) {
  const [h1, m1] = s.time.split(":").map(Number);
  const [h2, m2] = s.timeEnd.split(":").map(Number);
  const mins = h2 * 60 + m2 - (h1 * 60 + m1);
  if (!Number.isFinite(mins) || mins <= 0) return `${s.time}–${s.timeEnd}`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} soat ${m} daqiqa` : `${h} soat`;
}

export function leadSpeaker(s: Seminar) {
  return getSeminarSpeakers(s)[0];
}

export function specialtyName(s: Seminar) {
  return specialtyLabels[s.specialty];
}

export function mapsHref(s: Seminar) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.venue}, ${s.city}`)}`;
}
