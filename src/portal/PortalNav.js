// PortalNav.js: the portal sidebar from the design (design/portal/PortalNav), admin, brand, employer and travel partner menus.
// Admin items keep the admin dashboard's page ids, so selecting one switches the page inside /admin as before.
// Items with a path (fifth field) are real links, so every brand, employer and travel screen has its own URL.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Ico from "./Ico";
import logoInk from "./assets/tdc-logo-ink.png";

// the admin menu, by area. [page id, label, icon, tone]. Page ids are the admin dashboard's (AdminDashboard.js),
// unchanged, so links and saved state from before keep working. Pilot items show only once their server side is
// set up (AdminDashboard.js adminMenuFor). Labels are the page titles too.
export const ADMIN_MENU = [
  {
    title: "general",
    items: [
      ["dashboard", "dashboard", "home", "orange"],
      ["business_overview", "overview", "chart", "green"],
      ["engagement_metrics", "metrics", "chart", "blue"],
      ["admin_actions", "admin actions", "receipt", "ink"], // the audit log
    ],
  },
  {
    title: "users",
    items: [
      ["students", "all students", "grad", "orange"],
      ["brands", "all brands", "store", "red"],
      ["employees", "all employers", "hat", "sky"],
      ["travelers", "all travelers", "compass", "pink"],
      ["student_verifications", "student verifications", "check", "green"], // all students, pending approval
      ["card_manager", "student cards", "card", "pink"], // physical card requests: payment, printing, shipping
    ],
  },
  {
    title: "student app",
    items: [
      ["manage_jobs", "jobs & internships", "briefcase", "coral"],
      ["exchange_program", "scholarships", "grad", "blue"],
      ["events", "events", "calendar", "purple"],
      ["traveling", "travel", "plane", "sky"],
      ["booking", "AI travel plans", "compass", "blue"], // the travel plans students made, and their revenue
      ["engagement_rewards", "rewards", "gift", "purple"],
    ],
  },
  {
    title: "brands",
    items: [
      ["brand_approval", "brand approvals", "shield", "orange"],
      ["offers", "offers", "tag", "red"], // all offers | new offer
      ["loyalty_programs", "loyalty programs", "star", "yellow"],
      ["loyalty_exceptions", "loyalty exceptions", "star", "yellow"],
      ["surplus_ops", "surprise boxes", "gift", "orange"],
      ["all_brands_revenue", "brand revenue", "coin", "green"],
    ],
  },
  {
    title: "employers",
    items: [
      ["company_verifications", "company verifications", "shield", "blue"],
      ["hiring_overview", "hiring overview", "briefcase", "blue"],
      ["hiring_funnel", "hiring funnel", "chart", "green"],
      ["hire_disputes", "hire disputes", "alert", "red"],
      ["ratings_reports", "ratings reports", "star", "yellow"],
      ["free_hire_trials", "first hire free", "trophy", "green"],
      ["hiring_plans", "hiring plans", "coin", "blue"],
    ],
  },
  {
    title: "engagement",
    items: [
      ["engagement_drops", "daily drops", "spark", "yellow"],
      ["engagement_test_push", "push test", "bell", "coral"],
    ],
  },
  {
    // the Crew programme (server: /api/admin/crew): partner applications, partners, campaigns, credentials
    title: "crew",
    items: [
      ["crew_inbox", "crew inbox", "receipt", "orange"],
      ["crew_partners", "crew partners", "users", "blue"],
      ["crew_campaigns", "crew campaigns", "spark", "yellow"],
      ["crew_credentials", "crew credentials", "shield", "green"],
    ],
  },
  {
    title: "settings",
    items: [["features", "features", "settings", "green"]],
  },
];
// page ids from before the reorganisation, still accepted (state.page, old links): [page id, offers tab]
export const ADMIN_PAGE_ALIASES = { offer: ["offers", "new"], "all offer": ["offers", "all"] };
/** the admin group a page id belongs to ("" when none) */
export const groupOf = (id, menu = ADMIN_MENU) => (menu.find((g) => g.items.some(([pid]) => pid === id)) || {}).title || "";

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
      ["company", "company verification", "shield", "blue", "/company-verification"], // always shown, with its status chip
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

// open / closed groups, per admin (localStorage; any failure just means "all open")
const readOpen = (key) => { try { const v = JSON.parse(window.localStorage.getItem(key) || "null"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
const writeOpen = (key, v) => { try { window.localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode, full storage: not remembered */ } };
const slug = (t) => String(t || "main").replace(/[^a-z0-9]+/gi, "-").toLowerCase();

/**
 * collapsible: groups are buttons (aria-expanded) that open / close their items, open by default, remembered per
 * admin under storageKey; the active item's group opens by itself. searchable: a box that filters items by name.
 * badges: { pageId: count } shown next to the item (hidden at 0).
 * chips: { pageId: { label, tone } } a short status next to the item (e.g. "under review").
 */
export default function PortalNav({ menu = ADMIN_MENU, active, onSelect, userName, userRole = "admin", portalLabel = "admin", onLogout, onClose, settingsHref, collapsible = false, searchable = false, badges = {}, chips = {}, storageKey = "tdc.portalNav.groups" }) {
  const initial = (userName || "a").trim().charAt(0).toUpperCase();
  const [open, setOpen] = useState(() => (collapsible ? readOpen(storageKey) : {}));
  const [q, setQ] = useState("");
  const navRef = useRef(null);
  useEffect(() => { if (collapsible) setOpen(readOpen(storageKey)); }, [collapsible, storageKey]);
  const isOpen = (title) => !collapsible || open[title] !== false;
  const toggle = (title) => setOpen((o) => { const next = { ...o, [title]: !(o[title] !== false) }; writeOpen(storageKey, next); return next; });
  // the active page's group opens (and stays open)
  useEffect(() => {
    if (!collapsible || !active) return;
    const g = (menu.find((x) => x.items.some(([id]) => id === active)) || {}).title;
    if (g && open[g] === false) setOpen((o) => { const next = { ...o, [g]: true }; writeOpen(storageKey, next); return next; });
  }, [active, collapsible, menu]); // eslint-disable-line react-hooks/exhaustive-deps
  const query = q.trim().toLowerCase();
  const shown = useMemo(() => menu.map((g) => ({ ...g, items: query ? g.items.filter(([, label]) => label.toLowerCase().includes(query)) : g.items })).filter((g) => g.items.length), [menu, query]);
  // up / down arrows move between the group buttons and items; home / end jump to the first / last
  const onKeyDown = (e) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const els = [...(navRef.current?.querySelectorAll("[data-nav-focus]") || [])];
    const i = els.indexOf(document.activeElement);
    if (i < 0 && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const next = e.key === "Home" ? 0 : e.key === "End" ? els.length - 1 : e.key === "ArrowDown" ? Math.min(els.length - 1, i + 1) : Math.max(0, i - 1);
    els[next]?.focus();
  };
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
      {searchable && (
        <div className="tdcp-nav-search">
          <Ico kind="search" tone="plain" size={16} />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="search the menu" aria-label="search the menu" data-nav-search="" />
        </div>
      )}
      <nav aria-label="portal" ref={navRef} onKeyDown={onKeyDown}>
        {shown.length === 0 && <p className="tdcp-nav-empty" role="status">nothing matches “{q.trim()}”.</p>}
        {shown.map((s) => {
          const groupId = `nav-group-${slug(s.title)}`;
          const expanded = query ? true : isOpen(s.title);
          const waiting = s.items.reduce((n, [id]) => n + (Number(badges[id]) > 0 ? Number(badges[id]) : 0), 0);
          return (
            <div className="tdcp-nav-group" key={s.title || "main"} data-group={s.title || "main"}>
              {s.title && (collapsible ? (
                <button type="button" className="tdcp-nav-title tdcp-nav-toggle" aria-expanded={expanded} aria-controls={groupId} onClick={() => toggle(s.title)} disabled={!!query} data-nav-focus="">
                  <span className="lbl">{s.title}</span>
                  {!expanded && waiting > 0 && <span className="tdcp-nav-badge" aria-label={`${waiting} waiting`}>{waiting}</span>}
                  <Ico kind="chevronDown" tone="plain" size={14} />
                </button>
              ) : <div className="tdcp-nav-title">{s.title}</div>)}
              <div id={groupId} className="tdcp-nav-items" hidden={!expanded}>
                {s.items.map(([id, label, icon, tone, href]) => {
                  const on = id === active;
                  const n = Number(badges[id]) || 0;
                  const inner = (
                    <>
                      <Ico kind={icon} tone={on ? "yellow" : tone} size={32} />
                      <span className="lbl">{label}</span>
                      {n > 0 && <span className="tdcp-nav-badge" aria-label={`${n} waiting`}>{n > 99 ? "99+" : n}</span>}
                      {chips[id] && <span className="tdcp-nav-chip" data-tone={chips[id].tone || "sand"} data-chip={id}>{chips[id].label}</span>}
                      <span className="pip" />
                    </>
                  );
                  return href ? (
                    <Link key={id} to={href} className="tdcp-nav-item" aria-current={on ? "page" : undefined} onClick={() => onSelect && onSelect(id)} data-nav-focus="" data-page={id}>
                      {inner}
                    </Link>
                  ) : (
                    <button key={id} type="button" className="tdcp-nav-item" aria-current={on ? "page" : undefined} onClick={() => onSelect(id)} data-nav-focus="" data-page={id}>
                      {inner}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
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
