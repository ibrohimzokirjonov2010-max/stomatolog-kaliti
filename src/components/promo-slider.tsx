"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PromoSlide = {
  id: string;
  badge?: string;
  badgeCls?: string;
  title: ReactNode;
  subtitle: string;
  cta: string;
  image: string;
  alt: string;
  /** Either a click handler (in-page filter) or a link. */
  onClick?: () => void;
  href?: string;
  /** "light" = pale blue card with dark text (default); "dark" = #0066FF→#0B1220 gradient with white text. */
  tone?: "light" | "dark";
  /** Wide 1200×675 poster (text-free left side) used full-bleed on desktop (lg+). Without it desktop keeps the right-side photo. */
  desktopImage?: string;
  /** The wide poster already carries its own headline/button (e.g. bonus): on desktop hide the overlay text and make the whole slide clickable. */
  desktopTextBaked?: boolean;
  /** "white" = white button with blue text (on a light card). */
  ctaTone?: "white";
};

const AUTOPLAY_MS = 5000;

/**
 * Mobile promo carousel shared by Forma and Marketplace: text left, photo right (object-cover, top-anchored),
 * swipe + clickable dots + ~5s auto-rotate (paused while touching, off for reduced motion). First image eager, rest lazy.
 */
export function PromoSlider({ slides, testId, label, className }: { slides: PromoSlide[]; testId: string; label: string; className?: string }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = slides.length;

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  useEffect(() => {
    if (paused || count < 2) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => goTo((idx + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [idx, paused, count]);

  if (!count) return null;

  return (
    <section className={cn("mb-5 min-w-0 lg:mx-auto lg:w-full lg:max-w-[1360px]", className)} data-testid={testId} aria-roledescription="karusel" aria-label={label}>
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== idx) setIdx(Math.min(Math.max(i, 0), count - 1));
        }}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setPaused(false)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => {
          const dark = s.tone === "dark";
          const btnCls = cn(
            "mt-2.5 inline-flex h-9 w-fit shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold lg:mt-4 lg:h-11 lg:px-5 lg:text-[14px]",
            dark
              ? "bg-white text-[#0066FF]"
              : s.ctaTone === "white"
                ? "bg-white text-[#0066FF] shadow-[0_6px_14px_rgba(15,23,42,0.12)] ring-1 ring-[#0066FF]/15"
                : "bg-[#0066FF] text-white shadow-[0_6px_14px_rgba(0,102,255,0.3)]",
          );
          const btn = (
            <>
              {s.cta}
              <ArrowRight className="size-3.5" />
            </>
          );
          return (
            <div key={s.id} className="w-full shrink-0 snap-center" aria-roledescription="slayd" aria-label={`${i + 1} / ${count}`}>
              <div
                className={cn(
                  "relative h-[168px] overflow-hidden rounded-[20px] lg:h-[220px] xl:h-[240px] 2xl:h-[260px]",
                  dark ? "bg-gradient-to-br from-[#0066FF] to-[#0B1220]" : "bg-gradient-to-r from-[#dcebff] via-[#e8f3ff] to-[#F4F7FC]",
                )}
              >
                {s.desktopImage ? (
                  <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
                    {/* WebP primary, JPG fallback, only matched at lg+ so phones never fetch it; first slide eager, rest lazy. */}
                    <picture>
                      <source media="(min-width: 1024px)" srcSet={s.desktopImage} type="image/webp" />
                      <source media="(min-width: 1024px)" srcSet={s.desktopImage.replace(/\.webp$/, ".jpg")} type="image/jpeg" />
                      <img
                        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                        alt=""
                        width={1200}
                        height={675}
                        loading={i === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className={cn(
                          "absolute inset-0 size-full object-center",
                          s.desktopTextBaked ? "scale-110 object-cover blur-2xl" : "object-cover object-right",
                        )}
                      />
                    </picture>
                    {s.desktopTextBaked ? (
                      /* Poster has its own headline: show it whole (contain) so the baked text is never cropped. */
                      <picture>
                        <source media="(min-width: 1024px)" srcSet={s.desktopImage} type="image/webp" />
                        <source media="(min-width: 1024px)" srcSet={s.desktopImage.replace(/\.webp$/, ".jpg")} type="image/jpeg" />
                        <img
                          src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                          alt=""
                          width={1200}
                          height={675}
                          loading={i === 0 ? "eager" : "lazy"}
                          decoding="async"
                          className="absolute inset-0 size-full object-contain object-center"
                        />
                      </picture>
                    ) : null}
                    {s.desktopTextBaked ? null : (
                      <div className={cn("absolute inset-0", dark ? "bg-gradient-to-r from-[#0B1220]/70 via-[#0B1220]/30 to-transparent" : "bg-gradient-to-r from-white/70 via-white/25 to-transparent")} />
                    )}
                  </div>
                ) : null}
                {s.desktopImage && s.desktopTextBaked ? (
                  s.href ? (
                    <Link href={s.href} aria-label={s.cta} className="absolute inset-0 z-20 hidden lg:block" />
                  ) : (
                    <button type="button" onClick={s.onClick} aria-label={s.cta} className="absolute inset-0 z-20 hidden lg:block" />
                  )
                ) : null}
                <div className={cn("relative z-10 flex h-full max-w-[58%] flex-col justify-center p-3.5 pr-1 lg:max-w-[52%] lg:px-9 lg:py-5 xl:px-10", s.desktopImage && s.desktopTextBaked ? "lg:hidden" : "")}>
                  {s.badge ? <span className={cn("w-fit rounded-full px-2.5 py-1 text-[10px] leading-none font-bold tracking-[0.08em] lg:px-3 lg:py-1.5 lg:text-[12px]", s.badgeCls)}>{s.badge}</span> : null}
                  <h2 className={cn(s.badge ? "mt-2 lg:mt-3" : "", "line-clamp-2 text-[17px] leading-[1.15] font-bold tracking-tight lg:text-[26px] lg:leading-[1.12] xl:text-[28px]", dark ? "text-white" : "text-[#0B1220]")}>{s.title}</h2>
                  <p className={cn("mt-1 line-clamp-2 text-[11.5px] leading-snug lg:mt-2 lg:text-[15px]", dark ? "text-white/80" : "text-[#5b6577]")}>{s.subtitle}</p>
                  {s.href ? (
                    <Link href={s.href} className={btnCls}>
                      {btn}
                    </Link>
                  ) : (
                    <button type="button" onClick={s.onClick} className={btnCls}>
                      {btn}
                    </button>
                  )}
                </div>
                <div className={cn("absolute inset-y-0 right-0 w-[43%] overflow-hidden rounded-r-[22px] lg:w-[45%]", s.desktopImage ? "lg:hidden" : "")}>
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(max-width: 1023px) 45vw, 520px"
                    priority={i === 0}
                    loading={i === 0 ? undefined : "lazy"}
                    className="object-cover object-[center_top]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {count > 1 ? (
        <div className="mt-2.5 flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              data-testid={`${testId}-dot`}
              aria-label={`${i + 1}-slayd`}
              aria-current={i === idx}
              onClick={() => goTo(i)}
              className="grid h-4 place-items-center px-0.5"
            >
              <span className={cn("block h-1.5 rounded-full transition-all", i === idx ? "w-4 bg-[#0066FF]" : "w-1.5 bg-[#cdd5e4]")} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
