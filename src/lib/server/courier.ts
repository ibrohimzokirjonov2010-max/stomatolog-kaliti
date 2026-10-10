import "server-only";
import { parseCourierLocation } from "@/lib/courier-location";
import { str } from "@/lib/server/user";

/** Validates seller/admin courier input → p_track jsonb for the DB, or an Uzbek error. */
export function buildCourierTrack(raw: unknown): { track: Record<string, unknown> } | { error: string } {
  const t = (raw ?? {}) as Record<string, unknown>;
  const url = str(t.yandexTrackUrl, 500);
  if (url && !/^https:\/\/[^\s"'<>]+$/i.test(url)) return { error: "Havola https:// bilan boshlanishi kerak." };
  const phone = str(t.courierPhone, 40);
  if (phone && !/^[+\d][\d\s()-]{6,}$/.test(phone)) return { error: "Kuryer telefon raqami noto‘g‘ri." };
  const track: Record<string, unknown> = {
    yandexTrackUrl: url,
    courierName: str(t.courierName, 80),
    courierPhone: phone,
    carInfo: str(t.carInfo, 80),
    advance: t.advance === true,
  };
  if (typeof t.location === "string") {
    const loc = parseCourierLocation(t.location.slice(0, 500));
    if (!loc) return { error: "Joylashuv: xarita havolasi (https://…) yoki koordinata (41.31, 69.27) kiriting." };
    track.location = { url: loc.url ?? "", lat: loc.lat != null ? String(loc.lat) : "", lng: loc.lng != null ? String(loc.lng) : "" };
  }
  return { track };
}
