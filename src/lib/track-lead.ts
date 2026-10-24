import { analyticsConfig } from "@/lib/analytics-config";

type AnalyticsWindow = Window & {
  ym?: (id: number, method: string, goal: string) => void;
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  clarity?: (method: string, name: string) => void;
};

/** Fires only for providers whose NEXT_PUBLIC id is set and whose script defined a function. */
export function trackLeadConversion() {
  if (typeof window === "undefined") return;
  const w = window as AnalyticsWindow;
  const { ym, pixel, ga, clarity } = analyticsConfig();
  if (ym && typeof w.ym === "function") w.ym(Number(ym), "reachGoal", "lead");
  if (pixel && typeof w.fbq === "function") w.fbq("track", "Lead");
  if (ga && typeof w.gtag === "function") w.gtag("event", "generate_lead", { lead_source: "home" });
  if (clarity && typeof w.clarity === "function") w.clarity("event", "lead");
}
