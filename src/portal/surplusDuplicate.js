// Surprise Box helpers for the brand portal: duplicate a box, and pick the orders "cancel box" can cancel.
import { utcToKarachiInput } from "../services/surplusApi";

const DAY = 864e5;
// a duplicate keeps the box's clock times; when the pickup has started or is about to, it moves forward by
// whole days so it starts at least `leadMinutes` from now (Karachi has no daylight saving: whole days are exact)
export function shiftDays(pickupStartIso, now = new Date(), leadMinutes = 30) {
  const start = new Date(pickupStartIso).getTime();
  if (!Number.isFinite(start)) return 0;
  const earliest = now.getTime() + leadMinutes * 60e3;
  return start >= earliest ? 0 : Math.ceil((earliest - start) / DAY);
}
const plusDays = (iso, n) => (iso ? new Date(new Date(iso).getTime() + n * DAY).toISOString() : null);

// the new-box form, prefilled from an existing listing (merchant listing view); saved as a draft by default
export function duplicateForm(l, activeBranchIds = [], now = new Date()) {
  const n = shiftDays(l.pickupStart, now);
  const branchOk = activeBranchIds.map(String).includes(String(l.branch?.id));
  return {
    branchId: branchOk ? String(l.branch.id) : String(activeBranchIds[0] || ""),
    title: l.title || "",
    description: l.disclosures?.description || "",
    contentsMayVary: l.contentsMayVary !== false,
    allergens: (l.allergens || []).join(", "),
    allergenNotes: l.disclosures?.allergenNotes || "",
    dietary: (l.dietary || []).join(", "),
    bestBefore: utcToKarachiInput(plusDays(l.disclosures?.bestBefore, n)),
    quantityTotal: l.quantityTotal || 5,
    listPrice: l.listPrice ?? "",
    price: l.price ?? "",
    pickupStart: utcToKarachiInput(plusDays(l.pickupStart, n)),
    pickupEnd: utcToKarachiInput(plusDays(l.pickupEnd, n)),
    orderCutoff: utcToKarachiInput(plusDays(l.orderCutoff, n)),
    publish: false,
    shiftedDays: n,
    branchChanged: !branchOk,
  };
}

// "cancel box": this listing's open orders, split into the ones the brand can cancel and the ones that stay
// (e.g. already handed over, waiting for payment)
export function cancellableOrders(orders, listingId) {
  const mine = (orders || []).filter((o) => String(o.listingId) === String(listingId));
  return {
    cancel: mine.filter((o) => (o.next || []).includes("MERCHANT_CANCELLED")),
    stay: mine.filter((o) => !(o.next || []).includes("MERCHANT_CANCELLED")),
  };
}
