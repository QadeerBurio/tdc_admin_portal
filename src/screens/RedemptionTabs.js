// Tabs on claimed students (design/portal/BrRedemptions). Claimed students is hidden from the brand menu and from
// redemptions; the /claimedUsers route and file are kept, and these tabs lead back to redemptions from there.
import React from "react";
import { Link, useLocation } from "react-router-dom";
import Ico from "../portal/Ico";

const TABS = [
  ["/savinghistory", "redemptions", "receipt"],
  ["/claimedUsers", "claimed students", "users"],
];

export default function RedemptionTabs() {
  const { pathname } = useLocation();
  return (
    <nav className="k-tabs" aria-label="redemptions sections">
      {TABS.map(([to, label, icon]) => (
        <Link key={to} to={to} className="k-tab" aria-selected={pathname === to} aria-current={pathname === to ? "page" : undefined}>
          <Ico kind={icon} tone="plain" size={17} />{label}
        </Link>
      ))}
    </nav>
  );
}
