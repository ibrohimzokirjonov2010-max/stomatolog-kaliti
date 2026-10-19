import type { Product } from "@/data/products";

/** Delivery for the selected lines: one fee per shop.
 *  A shop is free when every line is marked free. Otherwise the fee is the
 *  highest stated delivery price among the paid lines. A missing price is 0.
 */
export function shopDeliveryFee(products: Product[]) {
  const groups = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.shopId || product.shopName || "shop";
    const list = groups.get(key) ?? [];
    list.push(product);
    groups.set(key, list);
  }
  let fee = 0;
  for (const lines of groups.values()) {
    const paid = lines.filter((item) => item.attrs?.freeDelivery !== true);
    if (paid.length === 0) continue;
    const prices = paid.map((item) => {
      const value = Number(item.attrs?.deliveryPrice);
      return Number.isFinite(value) && value > 0 ? value : 0;
    });
    fee += Math.max(0, ...prices);
  }
  return fee;
}
