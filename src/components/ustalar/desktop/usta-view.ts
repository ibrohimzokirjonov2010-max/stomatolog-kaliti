import type { Master, RequestServiceV2 } from "@/data/masters";
import { serviceTagLabels } from "@/data/masters";
import { type DesktopUsta, type UstaService } from "@/data/desktop-ustalar";

/** One row in the desktop Ustalar UI: a moderated master from the database, or a design sample. */
export type UstaView = DesktopUsta & { master?: Master };

/** Fields the desktop repair form can hand to a request. The shared sheet does not prefill them. */
export type UstaRequestDraft = {
  services?: RequestServiceV2[];
  note?: string;
  district?: string;
  address?: string;
  date?: string;
  timeRange?: string;
  files?: File[];
};

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const serviceMap: Record<string, UstaService[]> = {
  rentgen: ["rentgen"],
  kreslo: ["unit"],
  ornatish: ["install"],
  tamirlash: ["unit", "hand", "compressor", "autoclave"],
  mebel: ["install"],
  servis: ["unit", "autoclave", "compressor"],
  konsultatsiya: [],
  unit: ["unit"],
  kompressor: ["compressor"],
  avtoklav: ["autoclave"],
  turbina: ["hand"],
};

const specialtyLabels: Record<string, string> = {
  unit: "Unit ta‘mirlash",
  kompressor: "Kompressor",
  avtoklav: "Avtoklav",
  turbina: "Turbina",
};

/** Map a public master (no phone/telegram, no ratings yet) onto the view model. Unknown fields stay empty. */
export function masterToView(master: Master): UstaView {
  const services = [...new Set(master.services.flatMap((id) => serviceMap[id] ?? []))];
  const tags = master.services.map((id) => specialtyLabels[id] ?? serviceTagLabels[id] ?? id);
  return {
    master,
    slug: master.id,
    name: master.name,
    role: master.title,
    city: master.city,
    district: master.district ?? "",
    status: master.online ? "online" : "offline",
    statusLabel: master.online ? "Onlayn" : "Offlayn",
    services,
    tags,
    years: master.years,
    jobs: master.jobs,
    rating: 0,
    reviews: 0,
    response: "",
    hours: master.hours ?? "",
    warranty: "",
    prices: master.priceFrom ? [{ name: "Xizmat", price: `${new Intl.NumberFormat("ru-RU").format(master.priceFrom)} so‘mdan` }] : [],
    brands: [],
    skills: tags,
    phone: master.phone ?? "",
    telegram: master.telegram ?? "",
    image: master.photo ?? "",
    works: master.works ?? [],
    about: master.description ?? "",
    popularity: 1000 + master.jobs,
    weekend: "",
    areas: [],
    serviceRows: [],
    reviewList: [],
    stars: [],
  };
}

/** Moderated masters from the database. Design samples are not mixed in. */
export function ustaList(masters: Master[]): UstaView[] {
  return masters.map(masterToView);
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
