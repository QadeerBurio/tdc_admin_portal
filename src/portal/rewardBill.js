// rewardBill.js: a loyalty reward applied to a bill (feat/loyalty-control), the same arithmetic as the server
// (services/loyalty.js breakdownOf). Everything on the ORIGINAL bill:
//   stack (on top): offer % of the bill + reward % of the bill (or + PKR off); never above the bill
//   replace: the bigger of the offer discount and the reward
//   free item: the offer discount as normal, plus "give: <item>"
// e.g. bill 1,000, offer 15%, reward 25% on top → 150 + 250 = 400 off, pay 600; replace → 250 off, pay 750
import React from "react";

export function breakdownOf({ bill, offerPct, reward = null, combine = "stack", capPct = null }) {
  const b = Math.max(0, Number(bill) || 0);
  const offerFull = Math.min(b, Math.round((b * Math.max(0, Number(offerPct) || 0)) / 100));
  let rewardFull = 0;
  let giveItem = null;
  if (reward?.kind === "percent") rewardFull = Math.round((b * Math.min(Number(reward.value) || 0, capPct == null ? 100 : capPct)) / 100);
  else if (reward?.kind === "amount") rewardFull = Math.min(Number(reward.value) || 0, b);
  else if (reward?.kind === "item") giveItem = String(reward.item || reward.label || "a free item");
  const mode = reward && reward.kind !== "item" ? (combine === "replace" ? "replace" : "stack") : null;
  let offerDiscount = offerFull;
  let rewardDiscount = 0;
  if (mode === "stack") rewardDiscount = Math.min(rewardFull, b - offerFull);
  else if (mode === "replace" && rewardFull > offerFull) { offerDiscount = 0; rewardDiscount = Math.min(rewardFull, b); }
  const totalDiscount = offerDiscount + rewardDiscount;
  return {
    bill: b, offerPct: Number(offerPct) || 0, offerDiscount, rewardDiscount, totalDiscount, pay: b - totalDiscount, giveItem, combine: mode,
    reward: reward ? { kind: reward.kind, value: reward.value ?? null, item: reward.item || "", label: reward.label || "" } : null,
    used: mode === "replace" ? (rewardDiscount > 0 ? "reward" : "offer") : mode ? "both" : reward ? "offer+item" : "offer",
  };
}

const pkr = (n) => `₨ ${Number(n || 0).toLocaleString()}`;

/** the breakdown rows on the brand's verify screen (bd: breakdownOf / the server's breakdown) */
export function BillBreakdown({ bd }) {
  if (!bd) return null;
  return (
    <div className="bv-breakdown" data-breakdown>
      <div className="bv-row"><span>Original Amount:</span><span>{pkr(bd.bill)}</span></div>
      {bd.combine === "replace" && bd.used === "reward"
        ? <div className="bv-row off"><span>Offer ({bd.offerPct}%):</span><span>replaced by the reward</span></div>
        : <div className="bv-row off"><span>Offer discount ({bd.offerPct}%):</span><span>- {pkr(bd.offerDiscount)}</span></div>}
      {bd.combine && (
        <div className="bv-row off" data-reward-row>
          <span>{`Loyalty reward (${bd.reward?.label || "reward"}${bd.combine === "replace" ? ", instead of the offer" : ", on top"}):`}</span>
          <span>{bd.combine === "replace" && bd.used === "offer" ? "offer is bigger: not added" : `- ${pkr(bd.rewardDiscount)}`}</span>
        </div>
      )}
      {bd.giveItem && <div className="bv-row" data-give><span>Give:</span><span><b>{bd.giveItem}</b></span></div>}
      <div className="bv-row off"><span>Total discount:</span><span>- {pkr(bd.totalDiscount)}</span></div>
      <div className="bv-row total"><span>Final Amount:</span><span>{pkr(bd.pay)}</span></div>
    </div>
  );
}
