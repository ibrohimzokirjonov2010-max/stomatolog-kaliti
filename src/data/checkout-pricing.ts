/**
 * One source of truth for cart → checkout money rules, shared by /savat and /buyurtma.
 * (Demo values until real delivery tariffs and promo campaigns come from the backend.)
 */

export const DELIVERY_COURIER = 25_000;
export const DELIVERY_PICKUP = 0;
/** Courier fee (no free-delivery threshold: StomaHub does not offer free delivery). */
export function deliveryFee(subtotal: number, ship: "courier" | "pickup" = "courier") {
  if (subtotal <= 0 || ship === "pickup") return DELIVERY_PICKUP;
  return DELIVERY_COURIER;
}

export const PROMO_CODE = "STOMAHUB10";
/** 10% off the goods subtotal. */
export const PROMO_RATE = 0.1;

export function normalizePromo(code: string) {
  return code.trim().toUpperCase();
}

export function isValidPromo(code: string) {
  return normalizePromo(code) === PROMO_CODE;
}

export function promoDiscount(code: string, subtotal: number) {
  if (!isValidPromo(code) || subtotal <= 0) return 0;
  return Math.round((subtotal * PROMO_RATE) / 100) * 100;
}

const PROMO_KEY = "sk-checkout-promo-v1";

/** Remember a promo accepted on /savat so /buyurtma applies the same discount. */
export function savePromo(code: string) {
  try {
    if (isValidPromo(code)) window.sessionStorage.setItem(PROMO_KEY, normalizePromo(code));
    else window.sessionStorage.removeItem(PROMO_KEY);
  } catch {
    /* storage unavailable: the user can re-enter the code at checkout */
  }
}

export function loadPromo() {
  try {
    return window.sessionStorage.getItem(PROMO_KEY) ?? "";
  } catch {
    return "";
  }
}

const PAY_KEY = "sk-checkout-pay-v1";
export const PAY_IDS = ["click", "payme", "uzum", "card", "naqd", "muddatli"] as const;
export type PayId = (typeof PAY_IDS)[number];

/** Remember the payment method picked on /savat so /buyurtma opens with it. */
export function savePay(id: PayId) {
  try {
    window.sessionStorage.setItem(PAY_KEY, id);
  } catch {
    /* storage unavailable */
  }
}

export function loadPay(): PayId | "" {
  try {
    const raw = window.sessionStorage.getItem(PAY_KEY) ?? "";
    return (PAY_IDS as readonly string[]).includes(raw) ? (raw as PayId) : "";
  } catch {
    return "";
  }
}
