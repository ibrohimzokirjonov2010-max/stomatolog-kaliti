/** Clinic service price list. Kept in the browser like payments and treatment plans (sk-crm-*-v1). */

export const SERVICES_KEY = "sk-crm-services-v1";

export const SERVICE_CATEGORIES = [
  { id: "profilaktika", label: "Profilaktika", tone: "#115E59" },
  { id: "terapiya", label: "Terapiya", tone: "#0F766E" },
  { id: "endodontiya", label: "Endodontiya", tone: "#e11d48" },
  { id: "jarrohlik", label: "Jarrohlik", tone: "#8b5cf6" },
  { id: "implantologiya", label: "Implantologiya", tone: "#0d9488" },
  { id: "ortodontiya", label: "Ortodontiya", tone: "#f59e0b" },
  { id: "estetik", label: "Estetik stomatologiya", tone: "#db2777" },
  { id: "protezlash", label: "Protezlash", tone: "#64748b" },
  { id: "bolalar", label: "Bolalar stomatologiyasi", tone: "#16a34a" },
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]["id"];

export type ClinicService = {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  short: string;
  details: string;
  /** A category picture path or a small data URL the user uploaded. */
  image: string;
  price: number;
  minutes: number;
  teeth: string;
  active: boolean;
  inPlans: boolean;
  materials: string[];
  tags: string[];
  color: string;
  createdAt: string;
};

export function categoryOf(id: string) {
  return SERVICE_CATEGORIES.find((item) => item.id === id) ?? SERVICE_CATEGORIES[0];
}

export function categoryImage(id: string) {
  return `/img/services/${categoryOf(id).id}.jpg`;
}

/** Next free XZM-### code. */
export function nextServiceCode(list: ClinicService[]) {
  const top = list.reduce((max, item) => Math.max(max, Number(item.code.replace(/\D/g, "")) || 0), 0);
  return `XZM-${String(top + 1).padStart(3, "0")}`;
}
