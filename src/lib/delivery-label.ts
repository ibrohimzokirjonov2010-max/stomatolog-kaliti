/** Seller delivery date in Asia/Tashkent. Shared by the mobile product page and marketplace cards. */

export type DeliverySeller = {
  deliveryDays: number | null;
  cutoffTime?: string | null;
  worksOnWeekends?: boolean | null;
};

const MONTHS = [
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

type Ymd = { y: number; m: number; d: number };

function tashkentParts(now: Date) {
  const shifted = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

function parseCutoff(value: string | null | undefined) {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value ?? "").trim());
  if (!match) return { hour: 16, minute: 0 };
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return { hour: 16, minute: 0 };
  return { hour, minute };
}

function utcDate(day: Ymd) {
  return new Date(Date.UTC(day.y, day.m - 1, day.d));
}

function fromUtc(date: Date): Ymd {
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

function addCalendarDays(day: Ymd, days: number): Ymd {
  const date = utcDate(day);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtc(date);
}

function weekday(day: Ymd) {
  return utcDate(day).getUTCDay();
}

function isWeekend(day: Ymd) {
  const n = weekday(day);
  return n === 0 || n === 6;
}

function sameDay(a: Ymd, b: Ymd) {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

export function getDeliveryLabel(seller: DeliverySeller | null | undefined, now = new Date()) {
  const days = seller?.deliveryDays;
  if (days == null || !Number.isInteger(days) || days < 0) return "";
  const parts = tashkentParts(now);
  const cutoff = parseCutoff(seller?.cutoffTime);
  const afterCutoff = parts.hour > cutoff.hour || (parts.hour === cutoff.hour && parts.minute > cutoff.minute);
  const today = { y: parts.y, m: parts.m, d: parts.d };
  let cursor = addCalendarDays(today, afterCutoff ? 1 : 0);
  const weekends = seller?.worksOnWeekends === true;
  let left = days;
  if (!weekends) {
    while (isWeekend(cursor)) cursor = addCalendarDays(cursor, 1);
  }
  while (left > 0) {
    cursor = addCalendarDays(cursor, 1);
    if (weekends || !isWeekend(cursor)) left -= 1;
  }
  const tomorrow = addCalendarDays(today, 1);
  if (sameDay(cursor, today)) return "Bugun";
  if (sameDay(cursor, tomorrow)) return "Ertaga";
  return `${cursor.d}-${MONTHS[cursor.m - 1]}`;
}

export function discountPercent(price: number, oldPrice?: number | null) {
  if (oldPrice == null || !(oldPrice > price) || price < 0) return 0;
  const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
  return pct >= 1 ? pct : 0;
}

/** Fewer than 10 stays exact. Larger counts floor to the previous ten: 40+. */
export function orderCountLabel(count: number) {
  if (!Number.isFinite(count) || count < 1) return "";
  const n = Math.floor(count);
  if (n < 10) return `${n} ta buyurtma`;
  return `${Math.floor(n / 10) * 10}+ ta buyurtma`;
}
