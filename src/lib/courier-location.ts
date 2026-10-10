/** Courier location helpers (shared by client + API). Accepts a map link or "lat, lng". */
export type CourierLocationInput = { url?: string; lat?: number; lng?: number };

function validPair(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
}

/** Parse free text: "41.31, 69.27", a Yandex link (ll= / pt= / whatshere[point]= are lng,lat) or a Google link (@lat,lng / q=lat,lng). */
export function parseCourierLocation(raw: string): CourierLocationInput | null {
  const text = raw.trim();
  if (!text) return {};
  const plain = text.match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (plain) {
    const lat = Number(plain[1]);
    const lng = Number(plain[2]);
    return validPair(lat, lng) ? { lat, lng } : null;
  }
  if (!/^https:\/\/[^\s"'<>]+$/i.test(text)) return null;
  let decoded = text;
  try {
    decoded = decodeURIComponent(text);
  } catch {
    /* keep raw */
  }
  const out: CourierLocationInput = { url: text.slice(0, 500) };
  const yandex = decoded.match(/[?&](?:pt|ll|whatshere\[point\])=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const google = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ?? decoded.match(/[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (yandex && /yandex|ya\.ru/i.test(decoded)) {
    const lng = Number(yandex[1]);
    const lat = Number(yandex[2]);
    if (validPair(lat, lng)) Object.assign(out, { lat, lng });
  } else if (google) {
    const lat = Number(google[1]);
    const lng = Number(google[2]);
    if (validPair(lat, lng)) Object.assign(out, { lat, lng });
  }
  return out;
}

/** Text shown back in an edit field for the stored location. */
export function courierLocationText(o: { courierLocationUrl?: string; courierLat?: number; courierLng?: number }) {
  if (o.courierLocationUrl) return o.courierLocationUrl;
  if (o.courierLat != null && o.courierLng != null) return `${o.courierLat}, ${o.courierLng}`;
  return "";
}

export function courierMapLink(o: { courierLocationUrl?: string; courierLat?: number; courierLng?: number }) {
  if (o.courierLat != null && o.courierLng != null)
    return `https://yandex.uz/maps/?pt=${o.courierLng},${o.courierLat}&z=16&l=map`;
  return o.courierLocationUrl || "";
}
