import { SEMINAR_DATE_TBD as SEMINAR_DATE_TBD_VALUE, formatUzDate } from "@/lib/format";
import { tashkentDateParts } from "@/lib/tashkent-date";

export type Specialty =
  | "implantologiya"
  | "endodontiya"
  | "estetika"
  | "ortodontiya"
  | "kongress";

export type SeminarCity = "Toshkent" | "Samarqand" | "Online";

export type SeminarSpeaker = {
  name: string;
  role: string;
  photo?: string;
  city?: string;
  bio?: string;
};

export type SeminarGalleryItem = {
  image: string;
  caption?: string;
  subtitle?: string;
  /** A still image (poster) — opens in the viewer instead of the "video" play overlay. */
  still?: boolean;
};

/** One day of a multi-day seminar: topics + timed schedule. */
export type SeminarProgramDay = {
  /** e.g. "1-kun" */
  label: string;
  /** e.g. "Nazariya" */
  title: string;
  /** e.g. "21-oktyabr" */
  date?: string;
  topics: string[];
  schedule: { time: string; title: string }[];
};

export type Seminar = {
  id: string;
  title: string;
  date: string;
  time: string;
  timeEnd: string;
  city: SeminarCity;
  venue: string;
  speaker: string;
  speakerRole: string;
  speakerAvatar?: string;
  /** Multiple speakers — preferred over single speaker fields when present. */
  speakers?: SeminarSpeaker[];
  /** What participants will learn (Nima o'rganasiz). */
  learnings?: string[];
  /** Past seminar posters/photos gallery. */
  pastGallery?: SeminarGalleryItem[];
  specialty: Specialty;
  price: number;
  /** Optional pre-discount price (shown crossed out with -N%). */
  oldPrice?: number;
  seatsTaken: number;
  seatsTotal: number;
  image: string;
  description?: string;
  featured?: boolean;
  demo?: true;
  /** Organizer-created seminar loaded from the database (not part of the static seed). */
  remote?: boolean;
  /** Organizer's own tags (DB seminars). */
  tags?: string[];
  /** Organizer's own program steps (DB seminars). */
  program?: { time: string; title: string }[];
  /** Lifecycle status of a DB seminar (published | closed). */
  status?: string;
  /** Real date not announced yet: `date` holds the internal SEMINAR_DATE_TBD placeholder and the UI shows "Sana aniqlanmoqda". */
  dateTbd?: boolean;
  /** Last day of a multi-day seminar (YYYY-MM-DD). */
  dateEnd?: string;
  /** Seat count not announced: `seatsTotal` is only an internal registration cap; the UI shows "Joylar soni cheklangan". */
  seatsTbd?: boolean;
  /** Organizer (Tashkilotchi) name shown on cards and the detail page. */
  organizer?: string;
  /** Short format badge, e.g. "Ikki kunlik seminar". */
  badge?: string;
  /** Explicit feature cards (all shown as active), instead of keyword-derived ones. */
  features?: { title: string; subtitle: string }[];
  /** Multi-day program (day tabs/headings). */
  programDays?: SeminarProgramDay[];
  /** Portrait image for the mobile hero (falls back to speaker photo / cover). */
  heroImage?: string;
};

/** Internal placeholder date for seminars whose date is not announced yet (never shown — see `dateTbd`). */
export { SEMINAR_DATE_TBD } from "@/lib/format";

export const specialtyLabels: Record<Specialty, string> = {
  implantologiya: "Implantologiya",
  endodontiya: "Endodontiya",
  estetika: "Estetika",
  ortodontiya: "Ortodontiya",
  kongress: "Kongress",
};

export const seminarCities: SeminarCity[] = ["Toshkent", "Samarqand", "Online"];

/** Live list. Filled only from /api/seminars/catalog. */
export const seminars: Seminar[] = [];

export const SEMINAR_CATALOG_COUNT = seminars.length;

/** Replace the shared list with the database catalog. Bundled rows are not merged back. */
export function setRemoteSeminars(list: Seminar[]) {
  seminars.splice(0, seminars.length, ...list);
}

export function seminarHref(id: string) {
  return `/seminarlar/${id}`;
}

export function seminarDayMonth(iso: string) {
  if (iso === SEMINAR_DATE_TBD_VALUE) return "Sana tez orada";
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function todayIso(from = new Date()) {
  return tashkentDateParts(from).iso;
}

export function isSeminarUpcoming(seminar: Seminar, from = new Date()) {
  if (seminar.status === "closed") return false; // organizer closed registration
  if (seminar.dateTbd) return true; // date not announced yet — registration stays open
  return (seminar.dateEnd ?? seminar.date) >= todayIso(from);
}

export function isDateTbd(seminar: Pick<Seminar, "date" | "dateTbd">) {
  return Boolean(seminar.dateTbd) || seminar.date === SEMINAR_DATE_TBD_VALUE;
}

/** formatUzDate for a seminar, aware of multi-day ranges (date … dateEnd) and the TBD placeholder. */
export function seminarDate(seminar: Pick<Seminar, "date" | "dateTbd" | "dateEnd">) {
  const d = formatUzDate(isDateTbd(seminar) ? SEMINAR_DATE_TBD_VALUE : seminar.date);
  if (isDateTbd(seminar) || !seminar.dateEnd || seminar.dateEnd === seminar.date) return d;
  const e = formatUzDate(seminar.dateEnd);
  if (e.month === d.month && e.year === d.year) {
    const dd = `${d.dayNum}–${e.dayNum}`;
    return { ...d, dayNum: dd, day: `${d.day}–${e.day}`, long: `${dd}-${d.month}, ${d.year}`, when: `${dd} ${d.monthTitle} ${d.year}` };
  }
  return { ...d, long: `${d.dayNum}-${d.month} – ${e.long}`, when: `${d.dayNum} ${d.monthTitle} – ${e.when}` };
}

/** "12 Oktyabr 2026", "21–22 Oktyabr 2026" or "Sana aniqlanmoqda". */
export function seminarWhen(seminar: Pick<Seminar, "date" | "dateTbd" | "dateEnd">) {
  return seminarDate(seminar).when;
}

/** Short seat line: real registrations if any, else the seat count, or "Joylar soni cheklangan" when not announced. */
export function seminarSeatsShort(seminar: Seminar, takenSuffix = "ishtirokchi") {
  const taken = Math.min(seminar.seatsTotal, seminar.seatsTaken);
  if (taken > 0) return `${taken} ${takenSuffix}`;
  return seminar.seatsTbd ? "Joylar soni cheklangan" : `${seminar.seatsTotal} o‘rin`;
}

/** Real (non-demo) featured upcoming seminars first, then by date. */
export function compareListed(a: Seminar, b: Seminar) {
  return Number(Boolean(b.featured && !b.demo)) - Number(Boolean(a.featured && !a.demo)) || compareSeminars(a, b);
}

export function compareSeminars(a: Seminar, b: Seminar) {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
}

export function getSeminar(id: string) {
  return seminars.find((item) => item.id === id);
}

export function sortedSeminars() {
  return [...seminars].sort(compareSeminars);
}

export function upcomingSeminars(limit = 3, from = new Date()) {
  const upcoming = [...seminars].sort(compareListed).filter((item) => isSeminarUpcoming(item, from));
  return (upcoming.length ? upcoming : sortedSeminars()).slice(0, limit);
}

export function featuredSeminar(from = new Date()) {
  const upcoming = sortedSeminars().filter((item) => isSeminarUpcoming(item, from));
  return upcoming.find((item) => item.featured) ?? upcoming[0] ?? sortedSeminars()[0];
}


/** Resolve speakers list — prefers `speakers[]`, else single speaker fields. */
export function getSeminarSpeakers(seminar: Seminar): SeminarSpeaker[] {
  if (seminar.speakers && seminar.speakers.length > 0) return seminar.speakers.filter((sp) => sp.name);
  if (!seminar.speaker) return []; // speaker not announced yet
  return [
    {
      name: seminar.speaker,
      role: seminar.speakerRole,
      photo: seminar.speakerAvatar,
      city: seminar.city === "Online" ? undefined : seminar.city,
    },
  ];
}

/** Default learnings from description / specialty when not provided. */
export function getSeminarLearnings(seminar: Seminar): string[] {
  if (seminar.learnings && seminar.learnings.length > 0) return seminar.learnings;
  const label = specialtyLabels[seminar.specialty];
  const base = [
    `${label} bo‘yicha zamonaviy protokol`,
    "Amaliy case discussion",
    "Klinik xatolarni oldini olish",
    "Savol-javob va sertifikat",
  ];
  if (seminar.description) {
    const short = seminar.description.replace(/\s+/g, " ").trim();
    if (short.length > 20) base.unshift(short.length > 90 ? `${short.slice(0, 87)}…` : short);
  }
  return base.slice(0, 6);
}

/** Past gallery — uses seminar image + related catalog images as fallback. */
export function getSeminarPastGallery(seminar: Seminar): SeminarGalleryItem[] {
  if (seminar.remote) return [];
  if (seminar.pastGallery && seminar.pastGallery.length > 0) return seminar.pastGallery;
  const pool = [
    seminar.image,
    "/images/seminar-lecture.png",
    "/images/seminar-congress.png",
    "/images/seminar-featured.png",
    "/images/seminar-smile.png",
    "/images/seminar-implant.png",
  ];
  const unique = [...new Set(pool)].slice(0, 4);
  return unique.map((image, i) => ({
    image,
    caption: i === 0 ? specialtyLabels[seminar.specialty] : "Oldingi seminar",
    subtitle: seminar.city,
  }));
}

export function seatsLeft(seminar: Seminar) {
  return Math.max(0, seminar.seatsTotal - seminar.seatsTaken);
}
