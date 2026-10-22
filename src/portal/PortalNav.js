// PortalNav.js: the portal sidebar from the design (design/portal/PortalNav), admin and brand menus.
// Admin items keep the admin dashboard's page ids, so selecting one switches the page inside /admin as before.
// Items with a path (fifth field) are real links, so every brand screen has its own URL.
import React from "react";
import { Link } from "react-router-dom";
import Ico from "./Ico";
import logoInk from "./assets/tdc-logo-ink.png";

export const ADMIN_MENU = [
  { title: "", items: [["dashboard", "dashboard", "home", "orange"]] },
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
      ["brand_approval", "brand approvals", "shield", "orange"],
      ["card_manager", "approved cards", "card", "pink"],
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
      ["reward", "verify reward", "gift", "purple", "/verifyrward"],
      ["redemptions", "redemptions", "receipt", "blue", "/savinghistory"],
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
          <Link to={settingsHref} className="tdcp-icon-btn" aria-label="settings" title="settings">
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
