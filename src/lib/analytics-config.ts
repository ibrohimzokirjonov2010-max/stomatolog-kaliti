/** Public analytics ids. Empty string means the script must not load. */

function digits(value: string | undefined, min: number, max: number) {
  const trimmed = value?.trim() ?? "";
  return new RegExp(`^\\d{${min},${max}}$`).test(trimmed) ? trimmed : "";
}

export function analyticsConfig() {
  const ym = digits(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID, 5, 12);
  const pixel = digits(process.env.NEXT_PUBLIC_META_PIXEL_ID, 5, 20);
  const gaRaw = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() ?? "";
  const ga = /^G-[A-Z0-9]{4,16}$/.test(gaRaw) ? gaRaw : "";
  const clarityRaw = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() ?? "";
  const clarity = /^[a-z0-9]{6,20}$/i.test(clarityRaw) ? clarityRaw : "";
  return { ym, pixel, ga, clarity };
}
