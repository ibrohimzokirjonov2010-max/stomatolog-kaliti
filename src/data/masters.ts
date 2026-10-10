export type UstaService =
  | "rentgen"
  | "kreslo"
  | "ornatish"
  | "tamirlash"
  | "mebel"
  | "servis"
  | "konsultatsiya";

export const serviceFilters: { id: UstaService; label: string }[] = [
  { id: "rentgen", label: "Rentgen" },
  { id: "kreslo", label: "Kreslo" },
  { id: "ornatish", label: "Jihoz o‘rnatish" },
  { id: "tamirlash", label: "Ta’mirlash" },
  { id: "mebel", label: "Mebel/interyer" },
];

export const mobileServiceChips: { id: "all" | UstaService; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "rentgen", label: "Rentgen" },
  { id: "kreslo", label: "Kreslo" },
  { id: "ornatish", label: "O‘rnatish" },
  { id: "tamirlash", label: "Ta’mirlash" },
];

export const serviceLabels: Record<UstaService, string> = {
  rentgen: "Rentgen",
  kreslo: "Kreslo",
  ornatish: "Jihoz o‘rnatish",
  tamirlash: "Ta’mirlash",
  mebel: "Mebel",
  servis: "Servis",
  konsultatsiya: "Konsultatsiya",
};

export const serviceShortLabels: Record<UstaService, string> = {
  rentgen: "Rentgen",
  kreslo: "Kreslo",
  ornatish: "O‘rnatish",
  tamirlash: "Ta’mirlash",
  mebel: "Mebel",
  servis: "Servis",
  konsultatsiya: "Konsultatsiya",
};

/** Descriptive chip text for a master's service (list card tags, profile chips, "Asosiy xizmatlar"). */
export const serviceTagLabels: Record<UstaService, string> = {
  rentgen: "Rentgen o‘rnatish",
  kreslo: "Kreslo ta’mirlash",
  ornatish: "Jihoz o‘rnatish",
  tamirlash: "Uskuna ta’mirlash",
  mebel: "Mebel / interyer",
  servis: "Servis",
  konsultatsiya: "Konsultatsiya",
};

/** Mobile category tiles on /ustalar (mock order). */
export const ustaCategoryTiles: { id: "all" | UstaService; label: string }[] = [
  { id: "all", label: "Barchasi" },
  { id: "rentgen", label: "Rentgen" },
  { id: "kreslo", label: "Kreslo" },
  { id: "ornatish", label: "O‘rnatish" },
  { id: "tamirlash", label: "Ta’mirlash" },
  { id: "konsultatsiya", label: "Konsultatsiya" },
];

/** v2 request service tiles (multi-select). Stored in master_requests.services[]. */
export type RequestServiceV2 = "kreslo" | "rentgen" | "profilaktika" | "ehtiyot" | "kompressor" | "sterilizatsiya" | "skaner" | "boshqa";

export const requestServicesV2: { id: RequestServiceV2; label: string }[] = [
  { id: "kreslo", label: "Kreslo ta’mirlash" },
  { id: "rentgen", label: "Rentgen o‘rnatish" },
  { id: "profilaktika", label: "Profilaktika servis" },
  { id: "ehtiyot", label: "Original ehtiyot qismlar" },
  { id: "kompressor", label: "Kompressor ta’mirlash" },
  { id: "sterilizatsiya", label: "Sterilizatsiya uskunalari" },
  { id: "skaner", label: "Intraoral skaner" },
  { id: "boshqa", label: "Boshqa xizmat" },
];

export const REQUEST_SERVICES_V2 = requestServicesV2.map((x) => x.id);

export const timeRanges = ["09:00 – 12:00", "12:00 – 15:00", "15:00 – 18:00", "18:00 – 21:00", "Istalgan vaqt"] as const;

export type RequestService = Exclude<UstaService, "servis">;

export const requestServices: { id: RequestService; label: string }[] = [
  { id: "rentgen", label: "Rentgen" },
  { id: "kreslo", label: "Kreslo" },
  { id: "ornatish", label: "O‘rnatish" },
  { id: "tamirlash", label: "Ta’mirlash" },
  { id: "mebel", label: "Mebel" },
];

export const masterCities = ["Toshkent", "Samarqand"] as const;

export const toshkentDistricts = [
  "Yunusobod",
  "Mirzo Ulug‘bek",
  "Mirobod",
  "Yakkasaroy",
  "Shayxontohur",
  "Olmazor",
  "Chilonzor",
  "Sergeli",
  "Bektemir",
  "Uchtepa",
  "Yangihayot",
  "Yashnobod",
] as const;

/** Public master profile from the database (moderated). Phone/telegram are never part of the public payload. */
export type Master = {
  id: string;
  name: string;
  kind: "usta" | "kompaniya";
  title: string;
  services: UstaService[];
  city: string;
  years: number;
  jobs: number;
  photo?: string | null;
  description?: string | null;
  mine?: boolean;
  /** v2: optional tuman, work photos, owner seen in the last 5 minutes. */
  district?: string | null;
  works?: string[];
  online?: boolean;
  createdAt?: string;
};

export function phoneHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits ? `tel:+${digits}` : `tel:${phone}`;
}

export function telegramHref(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("tg://")) {
    return value;
  }
  return `https://t.me/${value.replace(/^@/, "")}`;
}

export function defaultRequestService(master: Master): RequestService {
  const match = master.services.find((id): id is RequestService => id !== "servis" && id !== "konsultatsiya");
  return match ?? "tamirlash";
}
