import {
  categoryToProductCategory,
  placeholderImage,
  type PackageStatus,
  type SurplusCategory,
  type SurplusListing,
} from "@/data/surplus";
import { timeAgoUz } from "@/lib/work-client";

/** Listing as returned by /api/work/surplus*. Phone/telegram are present only for the owner. */
export type DbSurplus = {
  id: string;
  name: string;
  brand: string;
  category: SurplusCategory;
  price: number;
  newPrice: number | null;
  pkg: PackageStatus;
  expiryMonths: number;
  city: string;
  district: string | null;
  image: string | null;
  note: string;
  images?: string[] | null;
  video?: string | null;
  description?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  status: "pending" | "published" | "rejected" | "hidden" | "closed";
  rejectReason: string | null;
  seller: string;
  createdAt: string;
  updatedAt: string;
  mine: boolean;
  phone?: string;
  telegram?: string | null;
  interestCount?: number;
};

export type InterestStatus = "yuborildi" | "qabul" | "rad" | "bekor";

/** Contact request. `phone` = requester phone (owner view); `sellerPhone` appears for the requester only after acceptance. */
export type SurplusInterest = {
  id: string;
  listingId: string;
  listingName: string;
  listingStatus: string;
  name: string;
  message: string | null;
  status: InterestStatus;
  createdAt: string;
  updatedAt: string;
  phone?: string;
  sellerPhone?: string;
  sellerTelegram?: string | null;
};

export type PublishSurplusInput = {
  name: string;
  brand: string;
  category: SurplusCategory;
  pkg: PackageStatus | "";
  expiryMonths?: string;
  expiryMonth?: string;
  expiryYear?: string;
  lot?: string;
  qty?: string;
  qtyUnit?: string;
  declaration?: boolean;
  videoMeta?: unknown;
  price: string;
  newPrice: string;
  city: string;
  district: string;
  phone: string;
  telegram: string;
  image: string;
  note: string;
  images?: string[];
  video?: string;
  description?: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
};

function expiryFrom(createdAt: string, months: number) {
  const d = new Date(createdAt);
  d.setMonth(d.getMonth() + months);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function listingFromDb(d: DbSurplus): SurplusListing {
  return {
    id: d.id,
    name: d.name,
    brand: d.brand,
    category: d.category,
    productCategory: categoryToProductCategory(d.category),
    price: d.price,
    newPrice: d.newPrice ?? d.price,
    status: d.pkg,
    expiryMonths: d.expiryMonths,
    expiry: expiryFrom(d.createdAt, d.expiryMonths),
    city: d.city,
    district: d.district ?? undefined,
    seller: d.seller,
    verified: false,
    mine: d.mine,
    updatedLabel: timeAgoUz(d.updatedAt),
    image: d.image || placeholderImage(d.category),
    hasPhoto: Boolean(d.image),
    images: (d.images ?? []).filter(Boolean),
    video: d.video ?? undefined,
    description: d.description ?? undefined,
    address: d.address ?? undefined,
    lat: d.lat ?? null,
    lng: d.lng ?? null,
    phone: d.phone ?? "",
    telegram: d.telegram ?? undefined,
    note: d.note,
    createdAt: d.createdAt,
    active: d.status === "published",
    modStatus: d.status,
    rejectReason: d.rejectReason,
    interestCount: d.interestCount,
  };
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

export const interestStatusCopy: Record<InterestStatus, { label: string; cls: string }> = {
  yuborildi: { label: "Javob kutilmoqda", cls: "bg-[#F0FDFA] text-[#0F766E]" },
  qabul: { label: "Qabul qilindi", cls: "bg-[#ecfdf3] text-[#15803d]" },
  rad: { label: "Rad etildi", cls: "bg-[#fef2f2] text-[#b91c1c]" },
  bekor: { label: "Bekor qilindi", cls: "bg-[#f3f5f9] text-[#8b93a7]" },
};
