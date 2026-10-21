import assert from "node:assert/strict";
import { discountPercent, getDeliveryLabel, orderCountLabel } from "./delivery-label.ts";

const wedMorning = new Date("2026-10-21T10:00:00.000Z");
const wedEvening = new Date("2026-10-21T12:00:00.000Z");

assert.equal(
  getDeliveryLabel({ deliveryDays: 1, cutoffTime: "16:00" }, wedMorning),
  "Ertaga",
);
assert.equal(
  getDeliveryLabel({ deliveryDays: 1, cutoffTime: "16:00" }, wedEvening),
  "23-oktabr",
);
assert.equal(getDeliveryLabel({ deliveryDays: 0, cutoffTime: "16:00" }, wedMorning), "Bugun");
assert.equal(getDeliveryLabel({ deliveryDays: 0, cutoffTime: "16:00" }, wedEvening), "Ertaga");
assert.equal(
  getDeliveryLabel({ deliveryDays: 3, cutoffTime: "16:00", worksOnWeekends: false }, wedMorning),
  "26-oktabr",
);
assert.equal(
  getDeliveryLabel({ deliveryDays: 1, cutoffTime: "16:00", worksOnWeekends: false }, new Date("2026-10-23T10:00:00.000Z")),
  "26-oktabr",
);
assert.equal(
  getDeliveryLabel({ deliveryDays: 1, cutoffTime: "16:00", worksOnWeekends: true }, new Date("2026-10-23T10:00:00.000Z")),
  "Ertaga",
);
assert.equal(getDeliveryLabel({ deliveryDays: null }, wedMorning), "");
assert.equal(getDeliveryLabel(undefined, wedMorning), "");
assert.equal(discountPercent(49250, 90000), 45);
assert.equal(discountPercent(100, 100), 0);
assert.equal(discountPercent(99, 100), 1);
assert.equal(orderCountLabel(0), "");
assert.equal(orderCountLabel(8), "8 ta buyurtma");
assert.equal(orderCountLabel(40), "40+ ta buyurtma");
assert.equal(orderCountLabel(46), "40+ ta buyurtma");

console.log("delivery-label tests passed");
