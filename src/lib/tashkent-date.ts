/** Calendar day in Asia/Tashkent, independent of the server or browser timezone. */
export function tashkentDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { year, month: month - 1, day, iso };
}

const HM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", hour: "2-digit", minute: "2-digit", hour12: false });
const DM = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", day: "2-digit", month: "2-digit" });

/** "16:30" in Tashkent time — identical on the server and in any browser, so SSR output hydrates cleanly. */
export function tashkentHm(date: Date) {
  return HM.format(date);
}

/** "08.10" in Tashkent time. */
export function tashkentDayMonth(date: Date) {
  return DM.format(date).replace("/", ".");
}
