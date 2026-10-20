import { UZ_REGIONS } from "@/data/regions";
import { type Seminar, type SeminarCity, type Specialty } from "@/data/seminars";

/** Organizer-created seminar as returned by the database RPCs (camelCase JSON). */
export type SeminarRow = {
  id: string;
  organizerId: string | null;
  source: "catalog" | "user";
  status: "pending" | "published" | "rejected" | "closed" | "deleted";
  rejectReason: string | null;
  title: string | null;
  description: string | null;
  speakers: { name: string; role: string }[];
  date: string | null;
  time: string | null;
  timeEnd: string | null;
  city: string | null;
  venue: string | null;
  price: number | null;
  priceHidden?: boolean;
  dateEnd?: string | null;
  sourceUrl?: string | null;
  instagram?: string | null;
  seats: number | null;
  specialty: string | null;
  image: string | null;
  tags: string[];
  program: { time: string; title: string }[];
  learnings: string[];
  createdAt: string;
  updatedAt: string;
  registered: number;
  organizerName?: string | null;
};

export const SPECIALTIES: { id: Specialty; label: string }[] = [
  { id: "implantologiya", label: "Implantologiya" },
  { id: "endodontiya", label: "Endodontiya" },
  { id: "estetika", label: "Estetik stomatologiya" },
  { id: "ortodontiya", label: "Ortodontiya" },
  { id: "kongress", label: "Kongress / boshqa" },
];

export const SEMINAR_STATUS_LABEL: Record<SeminarRow["status"], string> = {
  pending: "Tasdiq kutmoqda",
  published: "E’lon qilingan",
  rejected: "Rad etilgan",
  closed: "Yopilgan",
  deleted: "O‘chirilgan",
};

const KNOWN_CITIES = new Set<string>([...UZ_REGIONS, "Toshkent", "Samarqand", "Online"]);

export function seminarRowPriceText(price: number | null | undefined) {
  if (price == null) return "Narx e‘lon qilinmagan";
  if (price > 0) return `${price.toLocaleString("ru-RU")} so‘m`;
  return "Bepul";
}

/** Map a DB row into the shared `Seminar` shape so every list/detail/ticket page can render it. */
export function rowToSeminar(r: SeminarRow): Seminar {
  const speakers = (r.speakers ?? []).filter((s) => s?.name);
  const city = KNOWN_CITIES.has(r.city ?? "") ? (r.city as SeminarCity) : "Toshkent shahri";
  const hidden = r.price == null || Boolean(r.priceHidden);
  return {
    id: r.id,
    title: r.title ?? "",
    date: r.date ?? "",
    time: r.time ?? "00:00",
    timeEnd: r.timeEnd ?? r.time ?? "00:00",
    dateEnd: r.dateEnd || undefined,
    city,
    venue: r.venue ?? "",
    speaker: speakers[0]?.name ?? "",
    speakerRole: speakers[0]?.role ?? "",
    speakers: speakers.map((s) => ({ name: s.name, role: s.role })),
    learnings: r.learnings?.length ? r.learnings : undefined,
    specialty: ((r.specialty as Specialty) || "kongress") as Specialty,
    price: hidden ? 0 : Number(r.price) || 0,
    priceHidden: hidden,
    sourceUrl: r.sourceUrl || undefined,
    instagram: r.instagram || undefined,
    seatsTaken: 0,
    seatsTotal: r.seats ?? 0,
    image: r.image ?? "",
    description: r.description ?? undefined,
    remote: true,
    tags: r.tags ?? [],
    program: r.program ?? [],
    status: r.status,
  };
}
