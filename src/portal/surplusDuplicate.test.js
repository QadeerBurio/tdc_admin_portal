import { shiftDays, duplicateForm, cancellableOrders } from "./surplusDuplicate";

const now = new Date("2026-11-10T12:00:00Z"); // 17:00 in Karachi
const listing = {
  id: "L1", title: "evening bakery box", branch: { id: "B1" }, contentsMayVary: true, allergens: ["gluten", "dairy"], dietary: ["halal"],
  disclosures: { description: "3-4 breads", allergenNotes: "contains gluten", bestBefore: "2026-11-09T18:00:00Z" },
  quantityTotal: 8, listPrice: 1200, price: 500,
  pickupStart: "2026-11-09T14:00:00Z", pickupEnd: "2026-11-09T16:00:00Z", orderCutoff: "2026-11-09T15:30:00Z",
};

test("shiftDays: future pickups stay, past ones move by whole days", () => {
  expect(shiftDays("2026-11-11T14:00:00Z", now)).toBe(0);
  expect(shiftDays("2026-11-09T14:00:00Z", now)).toBe(1); // yesterday 19:00 -> today 19:00 (still 2 hours away)
  expect(shiftDays("2026-11-10T12:20:00Z", now)).toBe(1); // starts in 20 minutes: too soon, tomorrow
  expect(shiftDays("2026-11-10T12:40:00Z", now)).toBe(0); // starts in 40 minutes: today
  expect(shiftDays("not a date", now)).toBe(0);
});

test("duplicateForm: same box, same clock times on the next possible day, draft", () => {
  const f = duplicateForm(listing, ["B1", "B2"], now);
  expect(f).toMatchObject({
    branchId: "B1", title: "evening bakery box", description: "3-4 breads", contentsMayVary: true, allergens: "gluten, dairy", allergenNotes: "contains gluten",
    dietary: "halal", quantityTotal: 8, listPrice: 1200, price: 500, publish: false, shiftedDays: 1, branchChanged: false,
  });
  // Karachi local inputs (UTC+5), moved 1 day
  expect(f.pickupStart).toBe("2026-11-10T19:00");
  expect(f.pickupEnd).toBe("2026-11-10T21:00");
  expect(f.orderCutoff).toBe("2026-11-10T20:30");
  expect(f.bestBefore).toBe("2026-11-10T23:00");
});

test("duplicateForm: an inactive branch falls back to the first active one", () => {
  const f = duplicateForm(listing, ["B2"], now);
  expect(f.branchId).toBe("B2");
  expect(f.branchChanged).toBe(true);
});

test("cancellableOrders: only this listing; handed-over orders stay", () => {
  const orders = [
    { id: "o1", listingId: "L1", next: ["CONFIRMED", "MERCHANT_CANCELLED"] },
    { id: "o2", listingId: "L1", next: ["COMPLETED"] },
    { id: "o3", listingId: "L2", next: ["MERCHANT_CANCELLED"] },
  ];
  const r = cancellableOrders(orders, "L1");
  expect(r.cancel.map((o) => o.id)).toEqual(["o1"]);
  expect(r.stay.map((o) => o.id)).toEqual(["o2"]);
});
