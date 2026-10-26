// Tabs shared by redemptions and claimed students (design/portal/BrRedemptions): claimed students lives inside redemptions.
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
