/** One return window for every user-facing sentence (sidebar, cart, product, orders). */
export const RETURN_DAYS = 14;

/**
 * Site-wide free-delivery cutoff in so‘m.
 * 0 means there is no cutoff: checkout charges the seller’s per-product fee
 * (`shopDeliveryFee`), and every screen must say that instead of its own number.
 */
export const FREE_DELIVERY_MIN_UZS = 0;

export function returnWindowText() {
  return `${RETURN_DAYS} kun ichida qaytarish`;
}

export function freeDeliveryText() {
  if (FREE_DELIVERY_MIN_UZS <= 0) {
    return "Yetkazish haqi sotuvchi belgilagan narx. Bepul deb belgilangan mahsulotda haq yo‘q.";
  }
  const amount = new Intl.NumberFormat("ru-RU").format(FREE_DELIVERY_MIN_UZS);
  return `${amount} so‘m dan yuqori buyurtmalarda yetkazish bepul`;
}
