import { conditionLabel, listingCondition, listingDiscount, surplusCategoryLabel, type SurplusListing } from "@/data/surplus";
import type { MobileSurplusChip, MobileSurplusItem } from "@/data/mobile-surplus";

/** One card/detail on the mobile Ortiqcha material screens: a real (moderated) listing or a design sample. */
export type SurplusView = {
  id: string;
  real: boolean;
  name: string;
  brand: string;
  spec: string;
  chip: Exclude<MobileSurplusChip, "all">;
  chipLabel: string;
  condition: string;
  expiry: string;
  qty: string;
  price: number;
  oldPrice: number;
  discount: number;
  city: string;
  image: string;
  gallery: string[];
  subtitle: string;
  description: string;
  seller: string;
  rating?: number;
  reviews?: number;
  listing?: SurplusListing;
};

const CHIP: Record<string, Exclude<MobileSurplusChip, "all">> = {
  kompozit: "kompozit",
  restavratsiya: "kompozit",
  bonding: "bond",
  sement: "sement",
  implantlar: "implant",
  endodontiya: "fayllar",
};

function isListing(value: SurplusListing | MobileSurplusItem): value is SurplusListing {
  return "newPrice" in value;
}

export function surplusView(item: SurplusListing | MobileSurplusItem): SurplusView {
  if (!isListing(item)) {
    return { ...item, real: false };
  }
  const cond = listingCondition(item);
  const condition = cond === "yangi" ? (item.status === "yopiq" ? "Yangi, ochilmagan" : "Yangi") : conditionLabel[cond];
  const gallery = [...new Set([item.image, ...(item.images ?? [])].filter(Boolean))];
  return {
    id: item.id,
    real: true,
    name: item.name,
    brand: item.brand,
    spec: surplusCategoryLabel(item.category),
    chip: CHIP[item.category] ?? "boshqa",
    chipLabel: surplusCategoryLabel(item.category) || "Material",
    condition,
    expiry: (item.expiry ?? "").replace("/", "."),
    qty: "",
    price: item.price,
    oldPrice: item.newPrice ?? item.price,
    discount: listingDiscount(item),
    city: [item.city, item.district].filter(Boolean).join(", "),
    image: item.image,
    gallery,
    subtitle: [item.brand, surplusCategoryLabel(item.category)].filter(Boolean).join(" · "),
    description: item.description || item.note || "",
    seller: item.seller,
    listing: item,
  };
}
