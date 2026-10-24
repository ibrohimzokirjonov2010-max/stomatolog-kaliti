"use client";

import { useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { BadgeCheck, FlaskConical } from "lucide-react";
import { labServiceWords, type Lab, type LabPriceItem } from "@/data/labs";
import { cn } from "@/lib/utils";

const KEY = "sh_saved_labs";
const listeners = new Set<() => void>();

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

/** Saved (bookmarked) labs — device-local, like saved jobs. */
export function useSavedLabs() {
  const raw = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      window.addEventListener("storage", cb);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
      };
    },
    read,
    () => "[]",
  );
  const ids: string[] = (() => {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    } catch {
      return [];
    }
  })();
  const toggle = useCallback((id: string) => {
    const cur: string[] = JSON.parse(read());
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
    listeners.forEach((l) => l());
  }, []);
  return { has: (id: string) => ids.includes(id), toggle, ids };
}

/** Blue check — shown only when an admin marked the lab verified. */
export function VerifiedBadge({ lab, className }: { lab: Lab; className?: string }) {
  if (!lab.verified) return null;
  return <BadgeCheck className={cn("size-[17px] shrink-0 fill-[#0F766E] text-white", className)} aria-label="Tasdiqlangan" data-testid="lab-verified" />;
}

export function labGallery(lab: Lab) {
  const photos = lab.photos?.length ? lab.photos : lab.photo ? [lab.photo] : [];
  return photos;
}

export function labCover(lab: Lab) {
  return lab.photos?.[0] ?? lab.portfolio?.[0] ?? lab.photo ?? null;
}

export function labServicesLine(lab: Lab) {
  const words = lab.services.map((s) => labServiceWords[s]);
  const line = words.join(", ");
  return line ? line.charAt(0).toUpperCase() + line.slice(1) : "—";
}

export function labPlace(lab: Lab) {
  return [lab.city, lab.district].filter(Boolean).join(", ");
}

export function labMapHref(lab: Lab) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([lab.name, lab.district, lab.city, "O‘zbekiston"].filter(Boolean).join(", "))}`;
}

export function somText(n: number) {
  return `${n.toLocaleString("ru-RU").replace(/,/g, " ")} so‘m`;
}

export function priceText(item: Pick<LabPriceItem, "price">) {
  return item.price != null ? somText(item.price) : "Narx kelishiladi";
}

export function daysText(min: number | null, max: number | null) {
  if (min != null && max != null) return min === max ? `${min} kun` : `${min}–${max} kun`;
  if (min != null || max != null) return `${min ?? max} kun`;
  return "—";
}

/** Average turnaround for the stat card: price-list range, else the lab's average days, else "—". */
export function labTurnaround(lab: Lab) {
  const items = lab.priceItems ?? [];
  const mins = items.map((i) => i.daysMin ?? i.daysMax).filter((x): x is number => x != null);
  const maxs = items.map((i) => i.daysMax ?? i.daysMin).filter((x): x is number => x != null);
  if (mins.length) return daysText(Math.min(...mins), Math.max(...maxs));
  return lab.days ? `${lab.days} kun` : "—";
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${Math.max(1, m)} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d} kun oldin` : `${Math.floor(d / 30)} oy oldin`;
}

export function LabPhoto({ src, alt, sizes, className, priority, iconClass }: { src: string | null; alt: string; sizes: string; className?: string; priority?: boolean; iconClass?: string }) {
  return (
    <span className={cn("relative block overflow-hidden bg-gradient-to-br from-[#F0FDFA] to-[#dbe7fb]", className)}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-[#8fb0e6]" data-testid="lab-photo-placeholder">
          <FlaskConical className={cn("size-8", iconClass)} />
        </span>
      )}
    </span>
  );
}

export function LabLogo({ lab, className }: { lab: Lab; className?: string }) {
  const initials = lab.name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "LB";
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-[#e6ebf3]", className)}>
      {lab.logo ? <Image src={lab.logo} alt={`${lab.name} logotipi`} fill sizes="96px" className="object-contain p-2" /> : <span className="text-[22px] font-bold text-[#0F766E]">{initials}</span>}
    </span>
  );
}
