import { seminarCities } from "@/data/seminars";
import { SPECIALTIES } from "@/lib/seminar-remote";

export type SeminarInput = {
  title: string;
  description: string;
  speakers: { name: string; role: string }[];
  date: string;
  startTime: string;
  endTime: string;
  city: string;
  venue: string;
  price: string | number;
  seats: string | number;
  specialty: string;
  image: string;
  /** comma separated */
  tags: string;
  program: { time: string; title: string }[];
  /** one per line */
  learnings: string;
};

export type SeminarClean = {
  title: string;
  description: string;
  speakers: { name: string; role: string }[];
  date: string;
  startTime: string;
  endTime: string;
  city: string;
  venue: string;
  price: number;
  seats: number;
  specialty: string;
  image: string;
  tags: string[];
  program: { time: string; title: string }[];
  learnings: string[];
};

export type SeminarErrors = Partial<Record<string, string>>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function tashkentToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function emptySeminarInput(): SeminarInput {
  return {
    title: "",
    description: "",
    speakers: [{ name: "", role: "" }],
    date: "",
    startTime: "",
    endTime: "",
    city: "Toshkent",
    venue: "",
    price: "",
    seats: "",
    specialty: "implantologiya",
    image: "",
    tags: "",
    program: [],
    learnings: "",
  };
}

/** Shared by the form (instant messages) and the API (authoritative). Messages are shown to the user as-is. */
export function validateSeminar(input: SeminarInput, opts: { isNew: boolean }): { errors: SeminarErrors; clean: SeminarClean } {
  const errors: SeminarErrors = {};
  const title = (input.title ?? "").trim().replace(/\s+/g, " ");
  if (!title) errors.title = "Seminar nomini kiriting.";
  else if (title.length < 5) errors.title = "Nom kamida 5 ta belgidan iborat bo‘lsin.";
  else if (title.length > 160) errors.title = "Nom 160 belgidan oshmasin.";

  const description = (input.description ?? "").trim();
  if (!description) errors.description = "Seminar tavsifini yozing.";
  else if (description.length < 20) errors.description = "Tavsif kamida 20 ta belgi bo‘lsin.";
  else if (description.length > 4000) errors.description = "Tavsif 4000 belgidan oshmasin.";

  const speakers = (input.speakers ?? [])
    .map((s) => ({ name: (s.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80), role: (s.role ?? "").trim().slice(0, 100) }))
    .filter((s) => s.name || s.role)
    .slice(0, 5);
  if (speakers.length === 0) errors.speakers = "Kamida bitta ma‘ruzachi ismini kiriting.";
  else if (speakers.some((s) => s.name.length < 3)) errors.speakers = "Ma‘ruzachi ismi kamida 3 ta belgi bo‘lsin.";
  const speakersClean = speakers.map((s) => ({ name: s.name, role: s.role || "Ma‘ruzachi" }));

  let date = (input.date ?? "").trim();
  if (!date) errors.date = "Sanani tanlang.";
  else if (!DATE_RE.test(date) || Number.isNaN(Date.parse(date))) errors.date = "Sana noto‘g‘ri.";
  else if (opts.isNew && date < tashkentToday()) errors.date = "O‘tib ketgan sanani tanlab bo‘lmaydi.";
  if (errors.date) date = "";

  const startTime = (input.startTime ?? "").trim();
  const endTime = (input.endTime ?? "").trim();
  if (!startTime) errors.startTime = "Boshlanish vaqtini kiriting.";
  else if (!TIME_RE.test(startTime)) errors.startTime = "Vaqt noto‘g‘ri (masalan 10:00).";
  if (!endTime) errors.endTime = "Tugash vaqtini kiriting.";
  else if (!TIME_RE.test(endTime)) errors.endTime = "Vaqt noto‘g‘ri (masalan 17:00).";
  else if (!errors.startTime && endTime <= startTime) errors.endTime = "Tugash vaqti boshlanishdan keyin bo‘lsin.";

  const city = (input.city ?? "").trim();
  if (!(seminarCities as string[]).includes(city)) errors.city = "Shaharni tanlang.";

  const venue = (input.venue ?? "").trim();
  if (!venue) errors.venue = city === "Online" ? "Platforma yoki havolani kiriting." : "Manzil yoki joyni kiriting.";
  else if (venue.length < 3) errors.venue = "Joy nomi juda qisqa.";
  else if (venue.length > 200) errors.venue = "Joy nomi 200 belgidan oshmasin.";

  const priceRaw = String(input.price ?? "").replace(/[\s_,]/g, "");
  let price = 0;
  if (priceRaw === "") errors.price = "Narxni kiriting (bepul bo‘lsa 0).";
  else if (!/^\d+$/.test(priceRaw)) errors.price = "Narx faqat raqamlardan iborat bo‘lsin.";
  else if (Number(priceRaw) > 100_000_000) errors.price = "Narx 100 000 000 so‘mdan oshmasin.";
  else price = Number(priceRaw);

  const seatsRaw = String(input.seats ?? "").replace(/[\s_,]/g, "");
  let seats = 0;
  if (seatsRaw === "") errors.seats = "O‘rinlar sonini kiriting.";
  else if (!/^\d+$/.test(seatsRaw) || Number(seatsRaw) < 1) errors.seats = "O‘rinlar soni kamida 1 bo‘lsin.";
  else if (Number(seatsRaw) > 5000) errors.seats = "O‘rinlar soni 5000 dan oshmasin.";
  else seats = Number(seatsRaw);

  const specialty = (input.specialty ?? "").trim();
  if (!SPECIALTIES.some((s) => s.id === specialty)) errors.specialty = "Yo‘nalishni tanlang.";

  const image = (input.image ?? "").trim();
  if (!image) errors.image = "Seminar uchun rasm yuklang.";
  else if (!/^https:\/\//.test(image) || image.length > 600) errors.image = "Rasm manzili noto‘g‘ri — qayta yuklang.";

  const tags = [...new Set((input.tags ?? "").split(/[,\n]/).map((t) => t.trim().replace(/^#/, "")).filter(Boolean))];
  if (tags.length > 6) errors.tags = "Teglar soni 6 tadan oshmasin.";
  else if (tags.some((t) => t.length > 24)) errors.tags = "Har bir teg 24 belgidan oshmasin.";

  const progRaw = (input.program ?? []).map((p) => ({ time: (p.time ?? "").trim(), title: (p.title ?? "").trim() })).filter((p) => p.time || p.title);
  if (progRaw.length > 12) errors.program = "Dastur bosqichlari 12 tadan oshmasin.";
  else if (progRaw.some((p) => !p.time || !p.title)) errors.program = "Har bir bosqichda vaqt va nom bo‘lsin (yoki qatorni o‘chiring).";
  else if (progRaw.some((p) => p.time.length > 20 || p.title.length > 100)) errors.program = "Bosqich matni juda uzun.";

  const learnings = (input.learnings ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (learnings.length > 8) errors.learnings = "Eng ko‘pi bilan 8 ta band yozing.";
  else if (learnings.some((l) => l.length > 140)) errors.learnings = "Har bir band 140 belgidan oshmasin.";

  return {
    errors,
    clean: {
      title,
      description,
      speakers: speakersClean,
      date,
      startTime,
      endTime,
      city,
      venue,
      price,
      seats,
      specialty,
      image,
      tags: tags.slice(0, 6),
      program: progRaw.slice(0, 12),
      learnings: learnings.slice(0, 8),
    },
  };
}
