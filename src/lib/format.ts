const uzMonths = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
] as const;

const uzMonthsShort = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "Iyn",
  "Iyl",
  "Avg",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
] as const;

const badgeMonths = [
  "YAN",
  "FEV",
  "MAR",
  "APR",
  "MAY",
  "IYUN",
  "IYUL",
  "AVG",
  "SEN",
  "OKT",
  "NOY",
  "DEK",
] as const;

/** Internal placeholder for "date not announced yet" seminars; formatUzDate renders it as "Sana aniqlanmoqda". */
export const SEMINAR_DATE_TBD = "2099-12-31";

export function formatUzDate(isoDate: string) {
  if (isoDate === SEMINAR_DATE_TBD) {
    return { day: "—", dayNum: "", month: "", monthTitle: "", monthShort: "", monthBadge: "SANA", year: "", long: "Sana aniqlanmoqda", when: "Sana aniqlanmoqda" };
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = uzMonths[month - 1];
  const monthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return {
    day: String(day).padStart(2, "0"),
    dayNum: String(day),
    month: monthName,
    monthTitle,
    monthShort: uzMonthsShort[month - 1],
    monthBadge: badgeMonths[month - 1],
    year: String(year),
    long: `${day}-${monthName}, ${year}`,
    when: `${day} ${monthTitle} ${year}`,
  };
}

/** "2026-10-24" or "24.10.2026" → "24.10.2026"; anything else → the fallback. */
export function formatDotDate(value: string | null | undefined, fallback = "–") {
  if (!value) return fallback;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  return /^\d{2}\.\d{2}\.\d{4}/.test(value) ? value.slice(0, 10) : fallback;
}

/** Deterministic grouping — avoids Intl NBSP/NNBSP SSR/client hydration #418. */
export function formatGroupedNumber(amount: number) {
  const n = Math.round(Number.isFinite(amount) ? amount : 0);
  const neg = n < 0;
  const digits = String(Math.abs(n));
  const parts: string[] = [];
  for (let i = digits.length; i > 0; i -= 3) {
    parts.unshift(digits.slice(Math.max(0, i - 3), i));
  }
  return `${neg ? "-" : ""}${parts.join(" ")}`;
}

export function formatMoney(amount: number, currency: "UZS" | "USD") {
  const formatted = formatGroupedNumber(amount);
  return currency === "USD" ? `${formatted} USD` : `${formatted} so‘m`;
}

export function formatSalaryRange(min: number, max?: number) {
  if (!min && !max) return "Maosh kelishiladi";
  if (!min && max) return `${formatMoney(max, "UZS")} gacha`;
  if (!max) return `${formatMoney(min, "UZS")}dan`;
  const minLabel = formatMoney(min, "UZS").replace(" so‘m", "");
  return `${minLabel} – ${formatMoney(max, "UZS")}`;
}
