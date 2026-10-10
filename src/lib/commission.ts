/**
 * Marketplace seller commission (percent). UI texts use this constant; the database mirrors it in ONE place:
 * `private.marketplace_commission_rate()` (default of stores.commission_rate, migration 20261002a).
 * Change both together. Past orders keep the rate snapshotted in order_items.commission_rate; the platform store stays 0%.
 */
export const MARKETPLACE_COMMISSION_PERCENT = 12;
