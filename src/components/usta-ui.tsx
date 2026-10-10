"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { BadgeCheck, Star, UserRound } from "lucide-react";
import type { Master, UstaService } from "@/data/masters";
import { cn } from "@/lib/utils";
import type { UstaIconName } from "@/components/usta-icons";

const FAV_KEY = "sh_fav_masters";

/** Saved masters live on this device only (there is no server-side favourites table for masters yet). */
export function useFavMasters() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(FAV_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once
      if (Array.isArray(raw)) setIds(raw.filter((x): x is string => typeof x === "string"));
    } catch {
      /* ignore */
    }
  }, []);
  const toggle = useCallback((id: string) => {
    setIds((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      try {
        window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  return { has: (id: string) => ids.includes(id), toggle };
}

export function MasterAvatar({ master, size, dot = true, priority }: { master: Master; size: number; dot?: boolean; priority?: boolean }) {
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      {master.photo ? (
        <Image
          src={master.photo}
          alt={master.name}
          width={size * 2}
          height={size * 2}
          priority={priority}
          className="size-full rounded-full object-cover ring-[3px] ring-[#eef3fb]"
        />
      ) : (
        <span className="grid size-full place-items-center rounded-full bg-[#e8f1ff] text-[#0066FF] ring-[3px] ring-[#eef3fb]">
          <UserRound className="size-1/2" strokeWidth={1.6} />
        </span>
      )}
      {dot && master.online ? (
        <span
          className="absolute rounded-full bg-[#22c55e] ring-[2.5px] ring-white"
          style={{ width: Math.round(size * 0.17), height: Math.round(size * 0.17), top: Math.round(size * 0.06), left: Math.round(size * 0.06) }}
          aria-label="Online"
        />
      ) : null}
    </span>
  );
}

/** Every catalog master passed admin moderation — that is the only verification we have. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span title="Moderatsiyadan o‘tgan" aria-label="Moderatsiyadan o‘tgan" className="inline-flex shrink-0">
      <BadgeCheck className={cn("size-[17px] fill-[#0066FF] text-white", className)} />
    </span>
  );
}

/** Masters have no rating data yet — always the neutral state (never a fabricated score). */
export function NoRating({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[12.5px] text-[#8b93a7]", className)} data-testid="usta-no-rating">
      <Star className="size-3.5 text-[#c5cbd8]" strokeWidth={2} />
      Hali baho yo‘q
    </span>
  );
}

export function specialtyLine(master: Master) {
  const short: Record<UstaService, string> = {
    rentgen: "Rentgen",
    kreslo: "Kreslo",
    ornatish: "O‘rnatish",
    tamirlash: "Ta’mirlash",
    mebel: "Mebel",
    servis: "Servis",
    konsultatsiya: "Konsultatsiya",
  };
  return master.services.slice(0, 2).map((id) => short[id] ?? id).join(" · ") || master.title;
}

export function serviceIcon(id: UstaService): UstaIconName {
  return id;
}

export function placeLine(master: Master) {
  return master.district ? `${master.city}, ${master.district}` : master.city;
}
