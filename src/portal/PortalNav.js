// PortalNav.js: the portal sidebar from the design (design/portal/PortalNav), admin menu.
// Items keep the admin dashboard's page ids, so selecting one switches the page inside /admin as before.
import React from "react";
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

// label for a page id (used for the mobile top bar and page titles)
export const pageLabel = (id) => {
  for (const s of ADMIN_MENU) for (const [pid, label] of s.items) if (pid === id) return label;
  return "";
};

export default function PortalNav({ active, onSelect, userName, userRole = "admin", portalLabel = "admin", onLogout, onClose }) {
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
        {ADMIN_MENU.map((s) => (
          <div className="tdcp-nav-group" key={s.title || "main"}>
            {s.title && <div className="tdcp-nav-title">{s.title}</div>}
            {s.items.map(([id, label, icon, tone]) => {
              const on = id === active;
              return (
                <button key={id} type="button" className="tdcp-nav-item" aria-current={on ? "page" : undefined} onClick={() => onSelect(id)}>
                  <Ico kind={icon} tone={on ? "yellow" : tone} size={32} />
                  <span className="lbl">{label}</span>
                  <span className="pip" />
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
        <button type="button" className="tdcp-icon-btn" onClick={onLogout} aria-label="log out" title="log out">
          <Ico kind="logout" tone="plain" size={18} />
        </button>
      </div>
    </aside>
  );
}
