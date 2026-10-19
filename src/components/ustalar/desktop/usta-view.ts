import type { Master, RequestServiceV2, UstaService as MasterService } from "@/data/masters";
import { serviceTagLabels } from "@/data/masters";
import { desktopUstalar, type DesktopUsta, type UstaService } from "@/data/desktop-ustalar";

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

const serviceMap: Record<MasterService, UstaService[]> = {
  rentgen: ["rentgen"],
  kreslo: ["unit"],
  ornatish: ["install"],
  tamirlash: ["unit", "hand", "compressor", "autoclave"],
  mebel: ["install"],
  servis: ["unit", "autoclave", "compressor"],
  konsultatsiya: [],
};

/** Map a public master (no phone/telegram, no ratings yet) onto the view model. Unknown fields stay empty. */
export function masterToView(master: Master): UstaView {
  const services = [...new Set(master.services.flatMap((id) => serviceMap[id] ?? []))];
  const tags = master.services.map((id) => serviceTagLabels[id] ?? id);
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
    hours: "",
    warranty: "",
    prices: [],
    brands: [],
    skills: tags,
    phone: "",
    telegram: "",
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

/** Database masters first (they can really receive requests), then the design samples. */
export function ustaList(masters: Master[]): UstaView[] {
  return [...masters.map(masterToView), ...desktopUstalar];
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
}
