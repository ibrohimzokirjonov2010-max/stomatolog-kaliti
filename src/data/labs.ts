export type LabService = "crown" | "veneer" | "implant" | "bridge" | "removable" | "cadcam" | "ortodontiya";
export type LabMaterial = "zirconia" | "emax" | "metal-ceramic" | "premium";

/** Public lab profile from the database (moderated). Phone/telegram are never part of the public payload. */
export type Lab = {
  id: string;
  name: string;
  city: string;
  services: LabService[];
  materials: LabMaterial[];
  description: string | null;
  days: number | null;
  priceFrom: number | null;
  photo: string | null;
  done: number;
  mine?: boolean;
  createdAt?: string;
  district?: string | null;
  photos?: string[];
  video?: string | null;
  logo?: string | null;
  years?: number | null;
  courier?: "ha" | "yoq" | null;
  courierArea?: string | null;
  portfolio?: string[];
  priceItems?: LabPriceItem[];
  /** Admin-set only. */
  verified?: boolean;
  online?: boolean;
  lastSeen?: string | null;
  address?: string | null;
  hours?: string | null;
  phone?: string | null;
  telegram?: string | null;
  email?: string | null;
  delivery?: boolean;
};

export type LabPriceCat = "metall-keramika" | "sirkon" | "emax" | "viner" | "implant" | "protez" | "jarrohlik" | "aligner" | "boshqa";

/** One row of the lab's price list (owner-entered). price/days null = "kelishiladi" / unknown. */
export type LabPriceItem = {
  id: string;
  title: string;
  cat: LabPriceCat;
  tags: string[];
  price: number | null;
  daysMin: number | null;
  daysMax: number | null;
  photo: string | null;
};

export const labPriceCats: { id: LabPriceCat; label: string }[] = [
  { id: "metall-keramika", label: "Metall-keramika" },
  { id: "sirkon", label: "Sirkon" },
  { id: "emax", label: "E-max" },
  { id: "viner", label: "Viner" },
  { id: "implant", label: "Implant" },
  { id: "protez", label: "Protez" },
  { id: "jarrohlik", label: "Jarrohlik" },
  { id: "aligner", label: "Aligner" },
  { id: "boshqa", label: "Boshqa" },
];

export function labPriceCatLabel(id: LabPriceCat) {
  return labPriceCats.find((c) => c.id === id)?.label ?? id;
}

/** Lowercase service names for the card subtitle ("Crown, veneer, implant, protez"). */
export const labServiceWords: Record<LabService, string> = {
  crown: "crown",
  veneer: "veneer",
  implant: "implant",
  bridge: "ko‘prik",
  removable: "protez",
  cadcam: "CAD/CAM",
  ortodontiya: "ortodontiya",
};

export const labServiceFilters: { id: LabService; label: string }[] = [
  { id: "crown", label: "Crown" },
  { id: "veneer", label: "Veneer" },
  { id: "implant", label: "Implant" },
  { id: "bridge", label: "Bridge" },
  { id: "removable", label: "Removable" },
  { id: "cadcam", label: "CAD/CAM" },
];

export const labMaterialFilters: { id: LabMaterial; label: string }[] = [
  { id: "zirconia", label: "Zirconia" },
  { id: "emax", label: "E.max" },
  { id: "metal-ceramic", label: "Metal-ceramic" },
  { id: "premium", label: "Premium" },
];

export const labCities = ["Toshkent", "Samarqand", "Farg‘ona", "Buxoro"] as const;

export const orderStatusSteps = [
  { id: "yangi", title: "Yuborildi", text: "Lab ko‘rib chiqmoqda" },
  { id: "qabul_qilindi", title: "Qabul qilindi", text: "Buyurtma qabul qilindi" },
  { id: "ishlanmoqda", title: "Ishlanmoqda", text: "Laboratoriyada ishlanmoqda" },
  { id: "tayyor", title: "Tayyor", text: "Ish tayyorlandi" },
  { id: "yetkazildi", title: "Yetkazildi", text: "Yetkazib berildi" },
] as const;

export type LabOrderStepId = (typeof orderStatusSteps)[number]["id"];

export function labServiceLabel(id: LabService) {
  return labServiceFilters.find((item) => item.id === id)?.label ?? id;
}

export function labMaterialLabel(id: LabMaterial) {
  return labMaterialFilters.find((item) => item.id === id)?.label ?? id;
}

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
