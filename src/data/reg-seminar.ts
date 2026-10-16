import { getDesktopSeminar } from "@/data/desktop-seminars";
import { getMobileSeminar, type MobileSeminar } from "@/data/mobile-seminars";
import { getSeminar, specialtyLabels, type Seminar } from "@/data/seminars";
import { formatUzDate } from "@/lib/format";

export type RegTag = { label: string; tone: "blue" | "green" | "line" };

export type RegSeminar = {
  id: string;
  title: string;
  image: string;
  tags: RegTag[];
  speaker: string;
  when: string;
  place: string;
  price: number;
};

const mobileCategory: Record<MobileSeminar["category"], string> = {
  implantologiya: "Implantologiya",
  endodontiya: "Endodontiya",
  ortodontiya: "Ortodontiya",
  estetika: "Estetika",
  jarrohlik: "Jarrohlik",
};

/** Standart is the seminar price. VIP keeps the design ratio 2 200 000 / 1 500 000. */
export function ticketPrices(price: number) {
  const standart = Math.max(0, Math.round(price));
  const vip = Math.round((standart * 22) / 15);
  return { standart, vip };
}

function withStart(when: string, start: string) {
  const clock = start.trim();
  if (!clock || when.includes(clock)) return when;
  return `${when}, ${clock}`;
}

function fromMobile(item: MobileSeminar): RegSeminar {
  const start = item.time.split(/[–-]/)[0] ?? "";
  return {
    id: item.id,
    title: item.title,
    image: item.image,
    tags: [
      { label: mobileCategory[item.category], tone: "line" },
      { label: item.formatLabel, tone: item.format === "onlayn" ? "blue" : "green" },
    ],
    speaker: item.speaker,
    when: withStart(item.when, start),
    place: item.place,
    price: item.price,
  };
}

function fromCatalog(item: Seminar): RegSeminar {
  const date = formatUzDate(item.date);
  const online = item.city === "Online";
  return {
    id: item.id,
    title: item.title,
    image: item.image,
    tags: [
      { label: specialtyLabels[item.specialty], tone: "line" },
      { label: online ? "Onlayn" : "Oflayn", tone: online ? "blue" : "green" },
    ],
    speaker: item.speaker,
    when: date.long === "Sana aniqlanmoqda" ? date.long : `${date.day}-${date.month} ${date.year}, ${item.time}`,
    place: online ? "Onlayn" : `${item.city}, ${item.venue}`,
    price: item.price,
  };
}

export function resolveRegSeminar(id: string): RegSeminar | null {
  const mobile = getMobileSeminar(id);
  if (mobile) return fromMobile(mobile);
  const catalog = getSeminar(id);
  if (catalog) return fromCatalog(catalog);
  const desktop = getDesktopSeminar(id);
  if (!desktop) return null;
  const online = desktop.format === "online";
  const tags: RegTag[] = [{ label: desktop.category, tone: "line" }];
  if (desktop.format === "hybrid") {
    tags.push({ label: "Oflayn", tone: "green" }, { label: "Onlayn", tone: "blue" });
  } else {
    tags.push({ label: online ? "Onlayn" : "Oflayn", tone: online ? "blue" : "green" });
  }
  return {
    id: desktop.id,
    title: desktop.detailTitle,
    image: desktop.image,
    tags,
    speaker: desktop.speaker,
    when: withStart(desktop.dateChip, desktop.start),
    place: `${desktop.city}, ${desktop.venue}`,
    price: desktop.price,
  };
}
