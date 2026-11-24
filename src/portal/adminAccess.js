// src/portal/adminAccess.js
// Phase A (A-7): what this admin may open, from GET /api/admin/me/access (on sign-in, and when the window gets focus
// again, at most every 30 s). The menu shows only pages they can open; a page opened by link without access shows
// "you don't have access to this". An older server without that route: every page, as before.
//   PAGE_PERMISSIONS   page id → the permission it needs (config/adminPermissions.js keys); missing = any admin
//   useAdminAccess()   { loaded, level, permissions, can(permission), canOpen(pageId) }
//   deviceId()         this browser's id for the admin sign-in code (sent in the login body: no extra header, so no
//                      cross-origin preflight change; older servers ignore it)
import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import perms from "./adminPermissions";

export const PAGE_PERMISSIONS = {
  dashboard: null,
  business_overview: "analytics.view",
  engagement_metrics: "analytics.view",
  resume_metrics: "analytics.view", // P3d
  admin_actions: "audit.view",
  safety: "safety.view",
  students: "students.view",
  brands: "brands.view",
  employees: "employers.view",
  travelers: "students.view",
  student_verifications: "students.verify",
  universities: "universities.manage",
  card_manager: "cards.manage",
  manage_jobs: "jobs.manage",
  exchange_program: "scholarships.manage",
  events: "events.manage",
  traveling: "travel.manage",
  booking: "travel.manage",
  engagement_rewards: "rewards.manage",
  brand_approval: "brands.view",
  offers: "offers.manage",
  loyalty_programs: "loyalty.manage",
  loyalty_exceptions: "loyalty.manage",
  surplus_ops: "surplus.manage",
  all_brands_revenue: "revenue.view",
  company_verifications: "employers.view",
  hiring_overview: "hiring.manage",
  hiring_funnel: "hiring.manage",
  hire_disputes: "disputes.manage",
  ratings_reports: "ratings.moderate",
  free_hire_trials: "plans.manage",
  hiring_plans: "plans.manage",
  engagement_drops: "drops.manage",
  engagement_test_push: "push.send",
  crew_inbox: "crew.view",
  crew_partners: "crew.view",
  crew_campaigns: "crew.view",
  crew_credentials: "credentials.issue",
  features: "features.manage",
  team_access: "team.manage",
};

// an older server (no /me/access): everything a legacy admin had, which is every page except the team page
const LEGACY = { level: "legacy", permissions: perms.KEYS.filter((k) => k !== "team.manage") };

export function deviceId() {
  try {
    let id = localStorage.getItem("tdc.deviceId");
    if (!id || !/^[A-Za-z0-9_-]{16,80}$/.test(id)) {
      const bytes = new Uint8Array(18);
      (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(bytes) : bytes.forEach((_, i) => (bytes[i] = Math.floor(Math.random() * 256)));
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem("tdc.deviceId", id);
    }
    return id;
  } catch {
    return "";
  }
}

export function useAdminAccess(enabled = true) {
  const [state, setState] = useState({ loaded: false, level: null, permissions: [] });
  const last = useRef(0);
  const load = useCallback(async (force = false) => {
    if (!enabled) return;
    if (!force && Date.now() - last.current < 30000) return;
    last.current = Date.now();
    try {
      const { data } = await api.get("/admin/me/access");
      const d = data?.data || {};
      // not an answer from Phase A's route (an older server, a proxy page): every page, as before
      if (!["super", "legacy", "member", "suspended"].includes(d.level) || !Array.isArray(d.permissions)) setState({ loaded: true, ...LEGACY });
      else setState({ loaded: true, level: d.level, permissions: d.permissions });
    } catch (e) {
      const code = e?.response?.data?.code;
      if (code === "ADMIN_ACCESS_SUSPENDED") setState({ loaded: true, level: "suspended", permissions: [] });
      else if (e?.response?.status === 404 || !e?.response) setState({ loaded: true, ...LEGACY });
      else setState((s) => (s.loaded ? s : { loaded: true, ...LEGACY }));
    }
  }, [enabled]);
  useEffect(() => {
    load(true);
    const onFocus = () => load(false);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);
  const can = useCallback((permission) => !permission || state.level === "super" || state.permissions.includes(permission), [state]);
  const canOpen = useCallback((page) => can(PAGE_PERMISSIONS[page] ?? null), [can]);
  return { ...state, can, canOpen, reload: () => load(true) };
}
