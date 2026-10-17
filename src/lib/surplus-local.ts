import type { SurplusListing } from "@/data/surplus";

export const SURPLUS_DRAFT_KEY = "sk-surplus-draft-v1";
export const SURPLUS_LOCAL_KEY = "sk-surplus-local-listings-v1";

export type DraftPhoto = { id: string; name: string; dataUrl: string };

export type SurplusDraft = {
  name: string;
  category: string;
  brand: string;
  qty: string;
  unit: string;
  month: string;
  year: string;
  holati: string;
  source: string;
  shopName: string;
  invoiceName: string;
  reason: string;
  note: string;
  price: string;
  newPrice: string;
  phone: string;
  city: string;
  telegram: string;
  photos: DraftPhoto[];
  videoName?: string;
  videoUrl?: string;
  videoDuration?: number;
};

export function readLocalListings(): SurplusListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SURPLUS_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SurplusListing[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === "string") : [];
  } catch {
    return [];
  }
}

export function writeLocalListings(listings: SurplusListing[]) {
  const slim = listings.map(slimListing);
  try {
    window.localStorage.setItem(SURPLUS_LOCAL_KEY, JSON.stringify(slim));
  } catch {
    try {
      const lighter = slim.map((item) => ({ ...item, video: undefined, images: (item.images ?? []).slice(0, 2) }));
      window.localStorage.setItem(SURPLUS_LOCAL_KEY, JSON.stringify(lighter));
    } catch {
      /* quota exceeded — the in-memory copy still shows until reload */
    }
  }
}

export function saveLocalListing(listing: SurplusListing) {
  const next = [listing, ...readLocalListings().filter((item) => item.id !== listing.id)];
  writeLocalListings(next);
  return next;
}

export function removeLocalListing(id: string) {
  const next = readLocalListings().filter((item) => item.id !== id);
  writeLocalListings(next);
  return next;
}

export function mergeListings(remote: SurplusListing[], local: SurplusListing[]) {
  const ids = new Set(remote.map((item) => item.id));
  return [...local.filter((item) => !ids.has(item.id)), ...remote];
}

export function readDraft(): SurplusDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SURPLUS_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SurplusDraft;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeDraft(draft: SurplusDraft) {
  const photos = draft.photos.slice(0, 10);
  const videoUrl = draft.videoUrl && draft.videoUrl.length < 1_500_000 ? draft.videoUrl : undefined;
  const payload: SurplusDraft = { ...draft, photos, videoUrl, videoName: videoUrl ? draft.videoName : undefined, videoDuration: videoUrl ? draft.videoDuration : undefined };
  window.localStorage.setItem(SURPLUS_DRAFT_KEY, JSON.stringify(payload));
  return Boolean(videoUrl) || !draft.videoUrl;
}

export function clearDraft() {
  window.localStorage.removeItem(SURPLUS_DRAFT_KEY);
}

function slimListing(listing: SurplusListing): SurplusListing {
  const video = listing.video && listing.video.length < 1_500_000 ? listing.video : listing.video?.startsWith("blob:") ? undefined : listing.video;
  return { ...listing, video };
}
