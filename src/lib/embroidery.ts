export type EmbroideryItem = "xalat" | "scrub";

export type EmbroideryOrder = {
  id: string;
  clinic: string;
  itemType: EmbroideryItem;
  qty: number;
  phone: string;
  telegram?: string;
  logoLater: boolean;
  logoName?: string;
  createdAt: string;
  status: "qabul";
};

export const EMBROIDERY_KEY = "sk-forma-embroidery-v1";

export const embroideryTypes: { id: EmbroideryItem; label: string }[] = [
  { id: "xalat", label: "Xalat" },
  { id: "scrub", label: "Scrub" },
];

export function makeEmbroideryId() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const n = Math.floor(1000 + Math.random() * 9000);
  return `EMB-${stamp}-${n}`;
}

export function loadEmbroidery(): EmbroideryOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EMBROIDERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EmbroideryOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEmbroidery(order: EmbroideryOrder) {
  const next = [order, ...loadEmbroidery()].slice(0, 30);
  localStorage.setItem(EMBROIDERY_KEY, JSON.stringify(next));
}
