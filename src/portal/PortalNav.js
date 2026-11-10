// PortalNav.js: the portal sidebar from the design (design/portal/PortalNav), admin, brand, employer and travel partner menus.
// Admin items keep the admin dashboard's page ids, so selecting one switches the page inside /admin as before.
// Items with a path (fifth field) are real links, so every brand, employer and travel screen has its own URL.
import React from "react";
import { Link } from "react-router-dom";
import Ico from "./Ico";
import logoInk from "./assets/tdc-logo-ink.png";

export const ADMIN_MENU = [
  { title: "", items: [["dashboard", "dashboard", "home", "orange"], ["business_overview", "overview", "chart", "green"]] },
  {
    title: "content",
    items: [
      ["offer", "create offer", "plus", "yellow"],
      ["all offer", "manage offers", "tag", "red"],
      ["manage_jobs", "career portal", "briefcase", "coral"],
      ["exchange_program", "scholarships", "grad", "blue"],
      ["traveling", "traveling", "plane", "sky"],
      ["events", "events", "calendar", "purple"],
      ["all_brands_revenue", "brands revenue", "coin", "green"],
      ["loyalty_exceptions", "loyalty exceptions", "star", "yellow"],
      ["hiring_funnel", "hiring funnel", "chart", "green"],
      ["hire_disputes", "hire disputes", "alert", "red"], // shown only when FLAG_CAREER_TIMELINE is set up (AdminDashboard.js)
      ["ratings_reports", "ratings reports", "star", "yellow"], // shown only when FLAG_CAREER_RATINGS is set up (AdminDashboard.js)
      ["surplus_ops", "surprise boxes", "gift", "orange"], // shown only when the pilot is set up (AdminDashboard.js)
      ["company_verifications", "company verifications", "shield", "blue"], // First Hire Free: shown only when the pilot is set up
      ["free_hire_trials", "free-hire trials", "trophy", "green"], // First Hire Free: shown only when the pilot is set up
      ["brand_approval", "brand approvals", "shield", "orange"],
      ["card_manager", "approved cards", "card", "pink"],
    ],
  },
  {
    // admin oversight across features; each item shows only once its server side is live (AdminDashboard.js)
    title: "oversight",
    items: [
      ["admin_actions", "admin actions", "receipt", "ink"],
    ],
  },
  {
    title: "engagement",
    items: [
      ["engagement_drops", "drops schedule", "spark", "yellow"],
      ["engagement_metrics", "metrics", "chart", "green"],
      ["engagement_rewards", "rewards", "gift", "purple"],
      ["engagement_test_push", "test push", "bell", "coral"],
    ],
  },
  {
    title: "users",
    items: [
      ["students", "all students", "grad", "orange"],
      ["brands", "all brands", "store", "red"],
      ["employees", "all employers", "hat", "sky"],
      ["travelers", "all travelers", "compass", "pink"],
    ],
  },
];

// brand portal (design/portal/BrDashboard ... BrSettings), on today's paths.
// Campaigns stays routed at /brand-campaigns but is not in the menu.
export const BRAND_MENU = [
  {
    title: "",
    items: [
      ["dashboard", "dashboard", "home", "orange", "/home"],
      ["discounts", "discounts", "tag", "red", "/discount"],
      ["branches", "branches", "pin", "sky", "/Branches"],
      ["verify", "verify student", "qr", "green", "/verifyclaim"],
      ["loyalty", "loyalty", "star", "yellow", "/loyalty"], // shown only when FLAG_LOYALTY_V2 is on for the brand (Home.js)
      ["surprise", "surprise boxes", "gift", "orange", "/surprise-boxes"], // shown only when FLAG_SURPLUS_BOXES is on for the brand (Home.js)
      ["reward", "verify reward", "gift", "purple", "/verifyrward"],
      ["redemptions", "redemptions", "receipt", "blue", "/savinghistory"],
      ["insights", "insights", "chart", "green", "/insights"],
    ],
  },
];
// employer portal (design/portal/EmpDashboard ... EmpSettings), on today's paths; settings opens from the gear.
export const EMPLOYER_MENU = [
  {
    title: "",
    items: [
      ["dashboard", "dashboard", "home", "orange", "/employee-dashboard"],
      ["jobs", "jobs", "briefcase", "coral", "/employee-jobs"],
      ["candidates", "candidates", "users", "blue", "/candidate"],
      ["interviews", "interviews", "calendar", "purple", "/interviews"],
      ["reports", "reports", "chart", "green", "/reports"],
      ["results", "hiring results", "trophy", "green", "/hiring-results"],
    ],
  },
];

// travel partner portal (design/portal/TrDashboard ... TrSavings); settings opens from the gear.
export const TRAVELER_MENU = [
  {
    title: "",
    items: [
      ["dashboard", "dashboard", "home", "orange", "/traveler-dashboard"],
      ["packages", "packages", "plane", "sky", "/traveler/packages"],
      ["bookings", "bookings", "calendar", "purple", "/traveler/bookings"],
      ["redeem", "redeem offer", "qr", "green", "/traveler/redeem"],
      ["history", "travel history", "compass", "blue", "/traveler/history"],
      ["savings", "student savings", "wallet", "pink", "/traveler/savings"],
    ],
  },
];


// label for a page id (used for the mobile top bar and page titles)
export const pageLabel = (id) => {
  for (const s of ADMIN_MENU) for (const [pid, label] of s.items) if (pid === id) return label;
  return "";
};

export default function PortalNav({ menu = ADMIN_MENU, active, onSelect, userName, userRole = "admin", portalLabel = "admin", onLogout, onClose, settingsHref }) {
  const initial = (userName || "a").trim().charAt(0).toUpperCase();
  return (
    <aside className="tdcp-nav" aria-label="portal menu">
      <div className="tdcp-nav-brand">
        <img src={logoInk} alt="tdc." />
        <span className="tdcp-nav-tag">{portalLabel}</span>
        {onClose && (
          <button type="button" className="tdcp-icon-btn tdcp-nav-close" onClick={onClose} aria-label="close menu" style={{ marginLeft: "auto" }}>
            <Ico kind="close" tone="plain" size={20} />
          </button>
        )}
      </div>
      <nav aria-label="portal">
        {menu.map((s) => (
          <div className="tdcp-nav-group" key={s.title || "main"}>
            {s.title && <div className="tdcp-nav-title">{s.title}</div>}
            {s.items.map(([id, label, icon, tone, href]) => {
              const on = id === active;
              const inner = (
                <>
                  <Ico kind={icon} tone={on ? "yellow" : tone} size={32} />
                  <span className="lbl">{label}</span>
                  <span className="pip" />
                </>
              );
              return href ? (
                <Link key={id} to={href} className="tdcp-nav-item" aria-current={on ? "page" : undefined} onClick={() => onSelect && onSelect(id)}>
                  {inner}
                </Link>
              ) : (
                <button key={id} type="button" className="tdcp-nav-item" aria-current={on ? "page" : undefined} onClick={() => onSelect(id)}>
                  {inner}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="tdcp-nav-user">
        <div className="tdcp-avatar" aria-hidden="true">{initial}</div>
        <div className="who">
          <b>{userName || "admin"}</b>
          <span>{userRole}</span>
        </div>
        {settingsHref && (
          <Link to={settingsHref} className="tdcp-icon-btn" aria-label="settings" title="settings" onClick={onSelect}>
            <Ico kind="settings" tone="plain" size={18} />
          </Link>
        )}
        <button type="button" className="tdcp-icon-btn" onClick={onLogout} aria-label="log out" title="log out">
          <Ico kind="logout" tone="plain" size={18} />
        </button>
      </div>
    </aside>
  );
}
