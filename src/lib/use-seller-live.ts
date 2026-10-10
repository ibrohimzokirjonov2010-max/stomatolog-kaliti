"use client";

import { useEffect, useState } from "react";

export type ReviewSummary = { count: number; avg: number | null; unanswered: number };

function usePolled<T>(url: string, pick: (d: Record<string, unknown>) => T, initial: T, enabled: boolean, ms = 30000) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const run = () =>
      fetch(url, { credentials: "same-origin", cache: "no-store" })
        .then((r) => r.json() as Promise<Record<string, unknown>>)
        .then((d) => alive && d.ok && setValue(pick(d)))
        .catch(() => undefined);
    run();
    const t = window.setInterval(run, ms);
    const onFocus = () => run();
    window.addEventListener("sk-seller-live", onFocus);
    return () => {
      alive = false;
      window.clearInterval(t);
      window.removeEventListener("sk-seller-live", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, ms]);
  return value;
}

/** Real review totals of my store (average, count, unanswered). */
export function useReviewSummary(enabled = true): ReviewSummary {
  return usePolled<ReviewSummary>(
    "/api/seller/reviews?summary=1",
    (d) => ({ count: Number(d.count ?? 0), avg: d.avg == null ? null : Number(d.avg), unanswered: Number(d.unanswered ?? 0) }),
    { count: 0, avg: null, unanswered: 0 },
    enabled,
  );
}

/** Seller conversations with unread buyer messages. */
export function useUnreadConversations(enabled = true): number {
  return usePolled<number>("/api/conversations/unread", (d) => Number(d.count ?? 0), 0, enabled, 20000);
}

/** Payout requests whose status changed (paid / rejected) and the seller has not seen yet. */
export function useUnseenPayouts(enabled = true): number {
  return usePolled<number>("/api/seller/finance?unseen=1", (d) => Number(d.count ?? 0), 0, enabled, 30000);
}

/** Ask the badges to refresh right away (after reading / replying). */
export function pingSellerLive() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("sk-seller-live"));
}
