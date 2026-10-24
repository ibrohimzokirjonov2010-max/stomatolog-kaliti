"use client";

import { useSyncExternalStore } from "react";
import { LandingDesktop } from "@/components/landing/landing-desktop";
import { LandingMobile } from "@/components/landing/landing-mobile";

const DESKTOP = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DESKTOP);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function snapshot() {
  return window.matchMedia(DESKTOP).matches;
}

/** Server HTML is the phone layout. After hydration only the matching layout stays mounted, so sections are not duplicated. */
function serverSnapshot() {
  return false;
}

/** Guests see this at `/` and `/landing`. One layout is in the DOM at a time. */
export function LandingPage() {
  const desktop = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return desktop ? <LandingDesktop /> : <LandingMobile />;
}
