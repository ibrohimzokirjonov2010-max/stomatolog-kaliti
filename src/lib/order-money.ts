import { DELIVERY_LINE_ID } from "@/lib/cart-totals";
import { MARKETPLACE_COMMISSION_PERCENT } from "@/lib/commission";
import { formatMoney } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/orders";

export function isDeliveryItem(item: { productId?: string; name?: string; category?: string }) {
  return item.productId === DELIVERY_LINE_ID || item.name === "Yetkazib berish" || item.category === "yetkazish";
}

/** Goods lines for one shop. A missing shop id stays; another shop’s line is dropped. Delivery never counts. */
export function goodsLines(order: Order, shopId?: string): OrderItem[] {
  return order.items.filter((item) => {
    if (isDeliveryItem(item)) return false;
    if (shopId && item.shopId && item.shopId !== shopId) return false;
    return true;
  });
}

export function deliveryLines(order: Order): OrderItem[] {
  return order.items.filter((item) => isDeliveryItem(item));
}

export function lineSum(items: Pick<OrderItem, "price" | "qty">[]) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** Seller cabinet: an order belongs here only when this shop sold the goods. */
export function orderBelongsToShop(order: Order, shopId: string) {
  if (!shopId) return false;
  const goods = order.items.filter((item) => !isDeliveryItem(item));
  if (goods.some((item) => item.shopId === shopId)) return true;
  if (order.shopId === shopId && goods.every((item) => !item.shopId || item.shopId === shopId)) return true;
  return false;
}

/** One rate for the panel and the order. A stored amount wins; otherwise the platform rate. */
export function commissionView(order: Order, shopId?: string) {
  const goods = lineSum(goodsLines(order, shopId));
  const stored = Math.max(0, Number(order.commission) || 0);
  const implied = goods > 0 && stored > 0 ? Math.round((stored / goods) * 1000) / 10 : null;
  const rate = implied != null && implied > 0 && implied <= 50 ? implied : MARKETPLACE_COMMISSION_PERCENT;
  const amount = stored > 0 ? stored : Math.round((goods * rate) / 100);
  return { goods, rate, amount, text: `${rate}% · ${formatMoney(amount, "UZS")}` };
}

/** Store row of 0 on a real shop is the unset default, not a custom waiver. */
export function displayCommissionRate(storeRate: number | null | undefined) {
  if (storeRate == null || storeRate <= 0) return MARKETPLACE_COMMISSION_PERCENT;
  return storeRate;
}
