/** National number after +998, at most 9 digits. */
export function uzPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("998") ? digits.slice(3) : digits;
  return local.slice(0, 9);
}

/** +998 XX XXX XX XX while the user types. */
export function formatUzPhone(value: string) {
  const local = uzPhoneDigits(value);
  if (!local) return "";
  const parts = [local.slice(0, 2), local.slice(2, 5), local.slice(5, 7), local.slice(7, 9)].filter(Boolean);
  return `+998 ${parts.join(" ")}`;
}

export function isUzPhone(value: string) {
  return uzPhoneDigits(value).length === 9;
}
