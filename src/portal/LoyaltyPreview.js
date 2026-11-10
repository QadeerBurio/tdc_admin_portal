// LoyaltyPreview.js: the loyalty card as a student sees it in the app (mirrors the app's LoyaltyCard),
// built from the brand's unsaved form, for a student with a chosen number of verified visits.
import React from "react";
import Ico from "./Ico";

export const ruleText = (t) => (t.maxVisit == null ? `visit ${t.minVisit} onward` : t.minVisit === t.maxVisit ? `visit ${t.minVisit}` : `visits ${t.minVisit}–${t.maxVisit}`);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// the tier the next visit falls in, and the one after it (same rule as the server's quote)
export function progressFor(tiers, visits) {
  const next = visits + 1;
  const i = tiers.findIndex((t) => next >= t.minVisit && (t.maxVisit == null || next <= t.maxVisit));
  const currentTier = tiers[i < 0 ? tiers.length - 1 : i];
  const nextTier = i >= 0 && i < tiers.length - 1 ? tiers[i + 1] : null;
  return { currentTier, nextTier, visitsBeforeNextTier: nextTier ? nextTier.minVisit - 1 - visits : 0 };
}

const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function LoyaltyPreview({ brandName, tiers, maxVisitsPerDay, resetMonths, terms, startsAt, endsAt, visits = 0 }) {
  if (!tiers?.length) return null;
  const { currentTier, nextTier, visitsBeforeNextTier } = progressFor(tiers, visits);
  const goal = nextTier ? nextTier.minVisit - 1 : visits;
  const filled = nextTier ? Math.min(1, goal > 0 ? visits / goal : 0) : 1;
  return (
    <div className="loy-preview" data-testid="loyalty-preview" style={{ border: "1px solid var(--line, #e6e0d6)", borderRadius: 22, padding: 16, maxWidth: 380, background: "var(--card, #fff)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Ico kind="star" tone="yellow" size={28} />
        <strong style={{ flex: 1, fontSize: 18 }}>loyalty<span aria-hidden="true">.</span>{brandName ? <span className="k-muted" style={{ fontWeight: 400, fontSize: 13 }}> · {brandName}</span> : null}</strong>
        <span style={{ padding: "4px 10px", borderRadius: 12, background: "#fdf1c7", fontWeight: 700, fontSize: 12 }}>{String(currentTier.name || "").toLowerCase()}</span>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1, padding: 12, borderRadius: 16, background: "#f6f1e8" }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{visits}</div>
          <div className="k-muted" style={{ fontSize: 12 }}>{visits === 1 ? "verified visit" : "verified visits"}</div>
        </div>
        <div style={{ flex: 1, padding: 12, borderRadius: 16, background: "#f6f1e8" }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{currentTier.discountPct}%</div>
          <div className="k-muted" style={{ fontSize: 12 }}>on your next visit</div>
        </div>
      </div>
      <div aria-hidden="true" style={{ height: 8, borderRadius: 4, background: "#ece6da", marginTop: 14, overflow: "hidden" }}>
        <div style={{ height: 8, width: `${Math.round(filled * 100)}%`, background: "#f2c230" }} />
      </div>
      <p style={{ fontWeight: 600, fontSize: 13.5, margin: "8px 0 0" }}>
        {nextTier ? `${plural(visitsBeforeNextTier, "more visit")}, then ${nextTier.discountPct}% from visit ${nextTier.minVisit} (${String(nextTier.name || "").toLowerCase()}).` : "you're on the top tier."}
      </p>
      <p className="k-muted" style={{ fontSize: 12.5, margin: "10px 0 0" }}>{tiers.map((t) => `${ruleText(t)}: ${t.discountPct}%`).join("  ·  ")}</p>
      <p className="k-muted" style={{ fontSize: 12, margin: "6px 0 0", lineHeight: 1.45 }}>
        a visit counts when the brand confirms your bill. claiming or showing your qr doesn't count.
        {Number(maxVisitsPerDay) ? ` ${plural(Number(maxVisitsPerDay), "visit")} a day count${Number(maxVisitsPerDay) === 1 ? "s" : ""}.` : ""}
        {Number(resetMonths) ? ` visits count for ${Number(resetMonths)} months.` : ""}
        {terms ? ` ${terms}` : ""}
      </p>
      {(startsAt || endsAt) && (
        <p className="k-muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
          {startsAt && endsAt ? `runs ${fmtDate(startsAt)} to ${fmtDate(endsAt)}.` : startsAt ? `starts ${fmtDate(startsAt)}.` : `ends ${fmtDate(endsAt)}.`}
        </p>
      )}
    </div>
  );
}
