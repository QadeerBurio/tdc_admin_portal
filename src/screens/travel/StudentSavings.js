// Student savings (design/portal/TrSavings): what students saved on this partner's trips through tdc.
// Savings are only real once a redemption records the discount actually given, and no travel redemption
// exists yet; today's traveler/savings is a flat 10% estimate, so it is not shown here.
// Will need: GET /api/partner/travel/savings -> recorded redemptions { amount saved, discountPercent,
// package, redeemedAt }, used for the total, average discount, top package and months.
import React, { useMemo } from "react";
import Ico from "../../portal/Ico";
import { Button, StatCard } from "../../portal/kit";
import dotSorted from "../dots/sorted.png";
import "../styles/TravelPortal.css";

const rs = (n) => `rs ${Number(n || 0).toLocaleString()}`;

export default function StudentSavings({ redemptions = [], onExport = null }) {
  const total = redemptions.reduce((n, r) => n + (Number(r.discountAmount) || 0), 0);
  const avg = redemptions.length ? Math.round(redemptions.reduce((n, r) => n + (Number(r.discountPercent) || 0), 0) / redemptions.length) : null;
  const top = useMemo(() => {
    const c = {};
    redemptions.forEach((r) => { c[r.package] = (c[r.package] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }, [redemptions]);
  // the last six months, with the recorded total for each
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const sum = redemptions.filter((r) => { const x = new Date(r.redeemedAt); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); }).reduce((n, r) => n + (Number(r.discountAmount) || 0), 0);
      return { label: d.toLocaleDateString("en-US", { month: "short" }).toLowerCase(), sum };
    });
  }, [redemptions]);
  const max = Math.max(...months.map((m) => m.sum), 1);

  return (
    <div className="tdcp k-page" data-screen="travel-savings">
      <div className="k-head">
        <div className="tr-title">
          <Ico kind="wallet" tone="pink" size={56} />
          <div>
            <h1>student savings<span className="dot" aria-hidden="true">.</span></h1>
            <p>what students saved on your trips through tdc.</p>
          </div>
        </div>
        <div className="k-actions">
          <Button variant="secondary" icon="download" disabled={!onExport || redemptions.length === 0} onClick={() => onExport && onExport()}>export</Button>
        </div>
      </div>

      <div className="tr-save-row">
        <div className="tr-save-total">
          <img src={dotSorted} alt="" />
          <div>
            <span>total saved by students</span>
            <b>{rs(total)}</b>
            <span>across {redemptions.length} {redemptions.length === 1 ? "redemption" : "redemptions"}</span>
          </div>
        </div>
        <StatCard label="average discount" value={avg == null ? "–" : `${avg}%`} icon="tag" tone="red" />
        <StatCard label="top package" value={<span className="tr-stat-text">{top || "none yet"}</span>} icon="star" tone="orange" />
      </div>

      <section className="k-card tr-pad">
        <div className="tr-list-head tr-flush">
          <h2>savings by month</h2>
          <span className="k-muted">{rs(total)} total</span>
        </div>
        <div className="tr-bars" role="img" aria-label={`savings by month: ${months.map((m) => `${m.label} ${rs(m.sum)}`).join(", ")}`}>
          {months.map((m) => (
            <div className="tr-bar" key={m.label}>
              <div className="tr-bar-track"><div className="tr-bar-fill" style={{ height: m.sum ? `${Math.max(4, (m.sum / max) * 100)}%` : 0 }} /></div>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
        <p className="k-muted tr-bars-note">bars fill in as students redeem tdc offers on your packages.</p>
      </section>
    </div>
  );
}
