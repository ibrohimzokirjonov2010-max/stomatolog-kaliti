import type { Listing } from "@/data/listings";
import { formatGroupedNumber } from "@/lib/format";

export type ClassifiedRow = {
  id: string;
  title?: string;
  category?: string;
  condition?: string;
  price?: number | null;
  negotiable?: boolean;
  description?: string;
  city?: string;
  district?: string;
  phone?: string | null;
  telegram?: string | null;
  sourceUrl?: string | null;
  instagram?: string | null;
  photos?: string[];
  createdAt?: string;
};

const BLANK = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="100%" height="100%" fill="#eef3f9"/></svg>')}`;

export function classifiedToListing(row: ClassifiedRow): Listing {
  const created = row.createdAt ? new Date(row.createdAt) : new Date();
  const date = Number.isNaN(created.getTime()) ? "" : created.toISOString().slice(0, 10);
  const price = row.price ?? null;
  const category = row.category || "Boshqa";
  const type: Listing["type"] = category === "Ijara" ? "ijara" : category === "Ish" ? "ish" : category === "Laboratoriya" || category === "Xizmat" ? "xizmat" : category === "Hamkorlik" ? "hamkor" : "sotiladi";
  return {
    id: row.id,
    type,
    typeLabel: row.condition === "ishlatilgan" ? "Ishlatilgan" : "Yangi",
    title: row.title || "",
    city: row.city || "",
    district: row.district || "",
    date,
    dateLabel: date ? date.split("-").reverse().join(".") : "",
    price,
    priceLabel: price ? `${formatGroupedNumber(price)} so‘m` : "Kelishiladi",
    views: 0,
    likes: 0,
    image: row.photos?.[0] || BLANK,
    photos: row.photos ?? [],
    category,
    description: row.description || "",
    phone: row.phone || "",
    telegram: row.telegram || "",
    sourceUrl: row.sourceUrl || "",
    instagram: row.instagram || "",
  };
}
