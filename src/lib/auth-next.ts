import { normalizePhone } from "@/lib/doctor-profile";
import { nextPath } from "@/lib/utils";

export const PHONE_STEP = "/royxat/telefon";

export function hasFullPhone(phone?: string | null) {
  return normalizePhone(phone || "").length === 9;
}

/** Google accounts have no phone in the ID token, so they finish that step before the app. */
export function afterAuthPath(phone?: string | null, fromPath?: string | null) {
  const queryNext = nextPath();
  const dest =
    queryNext !== "/"
      ? queryNext
      : fromPath &&
          fromPath !== "/" &&
          fromPath !== PHONE_STEP &&
          !fromPath.startsWith("/kirish") &&
          !fromPath.startsWith("/royxat")
        ? fromPath
        : "/";
  if (!hasFullPhone(phone)) {
    if (dest === "/" || dest === PHONE_STEP) return PHONE_STEP;
    return `${PHONE_STEP}?next=${encodeURIComponent(dest)}`;
  }
  return dest === PHONE_STEP ? "/" : dest;
}
