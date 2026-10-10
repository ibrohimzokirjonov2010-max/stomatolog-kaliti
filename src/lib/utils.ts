export { cn } from "cn"

/** Safe post-login redirect target from ?next= (same-origin relative paths only). */
export function nextPath(fallback = "/") {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next") ?? "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
