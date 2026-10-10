"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type AdPlacement = "home" | "marketplace" | "seminar" | "community";
type Ad = { id: string; advertiser: string; title: string; imageUrl: string; linkUrl: string | null };

function logEvent(adId: string, kind: "view" | "click", placement: AdPlacement) {
  const key = `sk-ad-${kind}-${adId}-${placement}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    /* private mode — still log */
  }
  const body = JSON.stringify({ adId, kind, placement });
  void fetch("/api/ads/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body,
    keepalive: true,
  }).catch(() => undefined);
}

function safeLink(url: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Paid banner managed from /admin/reklama. Renders nothing when no active ad for this placement. */
export function AdBanner({ placement, className }: { placement: AdPlacement; className?: string }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/ads?placement=${placement}`)
      .then((r) => r.json())
      .then((json: { ok?: boolean; ads?: Ad[] }) => {
        if (cancelled || !json.ok || !json.ads?.length) return;
        setAd(json.ads[Math.floor(Math.random() * json.ads.length)]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [placement]);

  useEffect(() => {
    const el = ref.current;
    if (!ad || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      logEvent(ad.id, "view", placement);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.5)) {
          logEvent(ad.id, "view", placement);
          io.disconnect();
        }
      },
      { threshold: [0.5] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ad, placement]);

  if (!ad) return null;
  const href = safeLink(ad.linkUrl);
  const label = ad.title || ad.advertiser;
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded banner of arbitrary origin/size */}
      <img src={ad.imageUrl} alt={label} className="h-full w-full object-cover" loading="lazy" />
      <span className="absolute top-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-white uppercase">
        Reklama
      </span>
    </>
  );
  const box = "relative block aspect-[3/1] w-full overflow-hidden rounded-2xl border border-[#eceff5] bg-[#f4f7fc] sm:aspect-[5/1] xl:aspect-[6/1]";
  return (
    <div ref={ref} className={cn("mb-4", className)} data-ad-id={ad.id}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={box}
          aria-label={`Reklama: ${label}`}
          onClick={() => logEvent(ad.id, "click", placement)}
        >
          {inner}
        </a>
      ) : (
        <div className={box}>{inner}</div>
      )}
    </div>
  );
}
