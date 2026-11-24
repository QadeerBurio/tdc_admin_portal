// AdminDashboard.js: the admin portal shell (sidebar from design/portal/PortalNav) and the dashboard
// (design/portal/AdDashboard). Pages still switch inside /admin; the data calls are the same as before.
import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { engagementApi } from "../services/api";
import "./styles/AdminDashboard.css";
import "../portal/portal.css";
import Ico from "../portal/Ico";
import PortalNav, { pageLabel, ADMIN_MENU, ADMIN_PAGE_ALIASES } from "../portal/PortalNav";
import { CountUp, useRouteFade } from "../portal/motion";
import AdminUserProfile from "../portal/AdminUserProfile";
import logoInk from "../portal/assets/tdc-logo-ink.png";
import dotSorted from "./dots/sorted.png";

// Sub-Components
import AdminOffersTabs from "./AdminOffersTabs";
import LoyaltyExceptions from "./LoyaltyExceptions";
import HiringFunnel from "./HiringFunnel";
import HireDisputes from "./HireDisputes";
import { RatingsReports } from "./CareerRatings";
import ratingsApi from "../services/ratingsApi";
import { careerApi } from "../services/careerApi";
import SurplusOps from "./SurplusOps";
import AdminActions from "./AdminActions";
import AdminUniversities from "./AdminUniversities";
import universitiesApi from "../services/universitiesApi";
import AdminFeatures from "./AdminFeatures";
import AdminSafety from "./AdminSafety";
import featuresApi from "../services/featuresApi";
import AdminLoyaltyPrograms from "./AdminLoyaltyPrograms";
import HiringOverview from "./HiringOverview";
import loyaltyApi from "../services/loyaltyApi";
import adminActionsApi from "../services/adminActionsApi";
import { CompanyVerifications, FreeHireTrials } from "./AdminFirstHireFree";
import AdminHome from "./AdminHome";
import AdminMetrics from "./AdminMetrics";
import trialApi from "../services/trialApi";
import hiringAccessApi from "../services/hiringAccessApi";
import AdminHiringPlans from "./AdminHiringPlans";
import surplusApi from "../services/surplusApi";
import AdminUserList from "./AdminUserList";
import AdminJobManager from "./AdminJobsManager";
import ManageExchange from "./ManageExchange";
import AdminPackageScreen from "./Traveling";
import CardManager from "./CardManager";
import AdminPackage from "./AdminPackage";
import EventManagement from "./EventManagement";
import BrandApprovalScreen from "./BrandApprovalScreen";
import AllBrandsRevenue from "./AllBrandsRevenue";

// 🆕 Crew
import CrewInbox from "./CrewInbox";
import CrewPartners from "./CrewPartners";
import CrewCampaigns from "./CrewCampaigns";
import CrewCredentials from "./CrewCredentials";

// 🆕 Engagement
import DropsSchedule from "./DropsSchedule";
import RewardsAdmin from "./RewardsAdmin";
import TestPush from "./TestPush";
import { API_ORIGIN } from "../config/api";
import { useAdminAccess } from "../portal/adminAccess";
import NoAccess from "../portal/NoAccess";
import AdminTeam from "./AdminTeam";
import AdminResumeMetrics from "./AdminResumeMetrics"; // P3d
// pilot pages show only once their pilot is set up on the server: Surprise Boxes, First Hire Free, hire disputes
const FHF_PAGES = ["free_hire_trials"]; // company verifications: every employer (on.company)
const adminMenuFor = (on) => ADMIN_MENU.map((s) => ({ ...s, items: s.items.filter((i) => (i[0] !== "surplus_ops" || on.surplus) && (!FHF_PAGES.includes(i[0]) || on.fhf) && (i[0] !== "hire_disputes" || on.disputes) && (i[0] !== "ratings_reports" || on.ratings) && (i[0] !== "admin_actions" || on.actions) && (i[0] !== "features" || on.features) && (i[0] !== "loyalty_programs" || on.loyaltyPrograms) && (i[0] !== "hiring_overview" || on.hiring) && (i[0] !== "hiring_plans" || on.plans) && (i[0] !== "company_verifications" || on.company) && (i[0] !== "universities" || on.universities)) })).filter((s) => s.items.length > 0);


// Today's date in Karachi as YYYY-MM-DD (the drops schedule uses the same key)
const karachiDayKey = (d) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
// user list page for each role in a profile URL (/admin/users/:role/:id)
const ROLE_PAGE = { student: "students", brand: "brands", employee: "employees", traveler: "travelers" };
// a page id from before the menu was reorganised ("offer", "all offer") → [page, offers tab]
const resolvePage = (id) => (ADMIN_PAGE_ALIASES[id] ? ADMIN_PAGE_ALIASES[id] : [id, null]);

export default function AdminDashboard() {
  const { user, token, loading, logout } = useContext(AuthContext);
  const access = useAdminAccess(user?.role === "admin");
  const navigate = useNavigate();

  const { role: profileRole, id: profileId } = useParams();
  const location = useLocation();
  const [activePage, setActivePageRaw] = useState(() => resolvePage(location.state?.page || ROLE_PAGE[profileRole] || "dashboard")[0]);
  const [offersTab, setOffersTab] = useState(() => resolvePage(location.state?.page)[1] || location.state?.tab || "all");
  const setActivePage = useCallback((id) => {
    const [page, tab] = resolvePage(id);
    if (tab) setOffersTab(tab);
    setActivePageRaw(page);
  }, []);
  const mainRef = useRef(null);
  useRouteFade(mainRef, activePage);
  const [isFetching, setIsFetching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Stats State
  const [stats, setStats] = useState({
    offers: 0,
    jobs: 0,
    students: 0,
    brands: 0,
    employees: 0,
    travelers: 0,
    exchange: 0,
    packages: 0,
    pendingCards: 0,
    approvedCards: 0,
    bookings: 0,
    courses: 0,
    events: 0,
    eventRegistrations: 0,
    totalRevenue: 0,
  });

  // Recent Events State
  const [recentEvents, setRecentEvents] = useState([]);

  // API Base URL
  const API_BASE = `${API_ORIGIN}/api`;

  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const adminAPI = `${API_BASE}/admin`;

      const endpoints = [
        // live offers from the shared metrics calculation (this used to be /admin/all, which lists home sliders, not offers)
        `${API_BASE}/analytics/admin/metrics?preset=today`,
        `${adminAPI}/jobs/all`,
        `${adminAPI}/users/student`,
        `${adminAPI}/users/brand`,
        `${adminAPI}/users/employee`,
        `${adminAPI}/users/traveler`,
        `${adminAPI}/exchange/all`,
        `${adminAPI}/packages/all`,
        `${adminAPI}/card-stats`,
        `${adminAPI}/bookings/stats`,
      ];

      const responses = await Promise.all(
        endpoints.map(url =>
          fetch(url, { headers })
            .then(res => res.ok ? res.json() : [])
            .catch(() => [])
        )
      );

      let totalRevenue = 0;
      try {
        const revenueRes = await fetch(`${API_BASE}/offers/admin/brands-revenue`, { headers });
        const revenueData = await revenueRes.json();
        if (revenueData.success && revenueData.summary) {
          totalRevenue = revenueData.summary.totalRevenue || 0;
        }
      } catch (revErr) {
        console.error("Revenue fetch failed:", revErr);
      }

      let eventsCount = 0;
      let eventsRegistrations = 0;
      try {
        const eventsRes = await fetch(`${API_BASE}/events/my-events`, { headers });
        const eventsData = await eventsRes.json();
        if (Array.isArray(eventsData)) {
          eventsCount = eventsData.length;
          const regCounts = await Promise.all(
            eventsData.map(ev =>
              fetch(`${API_BASE}/events/registrations/${ev._id}`, { headers })
                .then(r => r.json())
                .then(data => Array.isArray(data) ? data.length : 0)
                .catch(() => 0)
            )
          );
          eventsRegistrations = regCounts.reduce((sum, c) => sum + c, 0);
        }
      } catch (evErr) {
        console.error("Events fetch failed:", evErr);
      }

      setStats({
        offers: responses[0]?.data?.groups?.brands?.activeOffers?.value ?? 0,
        // open jobs: not switched off and not archived (this used to count every job ever posted)
        jobs: Array.isArray(responses[1]) ? responses[1].filter((j) => j && j.active !== false && !j.archivedAt).length : 0,
        // accounts from the shared metrics call: without suspended / banned / deactivated and test accounts
        // (the list lengths, the old count, included them); the "including suspended" note shows the rest
        ...(() => {
          const U = responses[0]?.data?.users;
          const len = (i) => (Array.isArray(responses[i]) ? responses[i].length : 0);
          const pick = (role, i) => (U?.[role] ? [U[role].active, U[role].includingSuspended] : [len(i), null]);
          const [students, studentsAll] = pick("student", 2), [brands, brandsAll] = pick("brand", 3), [employees, employeesAll] = pick("employee", 4), [travelers, travelersAll] = pick("traveler", 5);
          return { students, brands, employees, travelers, withSuspended: { students: studentsAll, brands: brandsAll, employees: employeesAll, travelers: travelersAll } };
        })(),
        exchange: Array.isArray(responses[6]) ? responses[6].length : 0,
        packages: Array.isArray(responses[7]) ? responses[7].length : 0,
        // accounts not approved yet ("student verifications"), from the list already loaded
        pendingStudents: Array.isArray(responses[2]) ? responses[2].filter((u) => u && u.status !== "Verified").length : 0,
        pendingCards: responses[8]?.pending || 0,
        approvedCards: responses[8]?.approvedTotal || 0,
        bookings: responses[9]?.totalBookings || 0,
        courses: Array.isArray(responses[10]) ? responses[10].length : 0,
        events: eventsCount,
        eventRegistrations: eventsRegistrations,
        totalRevenue: totalRevenue,
      });
    } catch (err) {
      console.error("Dashboard Stats Sync Error:", err);
    } finally {
      setTimeout(() => setIsFetching(false), 500);
    }
  }, [token]);

  const fetchRecentEvents = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const eventsAPI = `${API_BASE}/events`;

      const res = await fetch(`${eventsAPI}/my-events`, { headers });
      const data = await res.json();

      if (Array.isArray(data)) {
        const eventsWithRegistrations = await Promise.all(
          data.slice(0, 5).map(async (event) => {
            try {
              const regRes = await fetch(`${eventsAPI}/registrations/${event._id}`, { headers });
              const regData = await regRes.json();
              return { ...event, registrations: Array.isArray(regData) ? regData : [] };
            } catch (err) {
              return { ...event, registrations: [] };
            }
          })
        );
        setRecentEvents(eventsWithRegistrations);
      }
    } catch (err) {
      console.error("Error fetching recent events:", err);
      setRecentEvents([]);
    }
  }, [token]);

  useEffect(() => {
    if (!loading && !token) {
      navigate("/login");
    } else if (token) {
      fetchDashboardStats();
      fetchRecentEvents();
    }
  }, [token, loading, navigate, fetchDashboardStats, fetchRecentEvents]);

  // Needs your attention: brands waiting for approval (read only)
  const [pendingApprovals, setPendingApprovals] = useState(null);
  const fetchPendingApprovals = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/brand-approval?status=pending`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setPendingApprovals(data?.success ? Number(data.stats?.pending || 0) : null);
    } catch (err) {
      setPendingApprovals(null);
    }
  }, [token]);

  // menu badges: what's waiting, from the calls these pages already make (no new endpoint); null = unknown (hidden)
  const [waiting, setWaiting] = useState({});
  const countOf = (p, pick) => p.then((d) => pick(d)).catch(() => null);
  useEffect(() => {
    let live = true;
    Promise.all([
      countOf(hiringAccessApi.companyVerifications("pending"), (d) => (Array.isArray(d) ? d.length : null)),
      countOf(careerApi.adminDisputes(), (d) => (Array.isArray(d?.disputes) ? d.disputes.length : null)),
      countOf(ratingsApi.adminReports("open"), (d) => (Array.isArray(d) ? d.length : null)),
      countOf(hiringAccessApi.overview(), (d) => (typeof d?.counts?.openRequests === "number" ? d.counts.openRequests : null)),
    ]).then(([company, disputes, reports, plans]) => { if (live) setWaiting({ company_verifications: company, hire_disputes: disputes, ratings_reports: reports, hiring_plans: plans }); });
    return () => { live = false; };
  }, [activePage]); // refreshed when the admin moves between pages (after deciding one, the count drops)

  // Today's drop and its votes (read only)
  const [todayDrop, setTodayDrop] = useState(undefined);
  // "surprise boxes" shows only once the pilot is set up on the server (FLAG_SURPLUS_BOXES)
  const [surplusMenu, setSurplusMenu] = useState(false);
  useEffect(() => { surplusApi.adminAvailable().then(setSurplusMenu); }, []);
  const [fhfMenu, setFhfMenu] = useState(false);
  useEffect(() => { trialApi.adminAvailable().then(setFhfMenu); }, []);
  // "hire disputes" shows only when the hiring timeline is set up (FLAG_CAREER_TIMELINE)
  const [disputesMenu, setDisputesMenu] = useState(false);
  useEffect(() => { careerApi.adminDisputesAvailable().then(setDisputesMenu); }, []);
  // "ratings reports" shows only when ratings are set up (FLAG_CAREER_RATINGS)
  const [ratingsMenu, setRatingsMenu] = useState(false);
  useEffect(() => { ratingsApi.adminAvailable().then(setRatingsMenu); }, []);
  // "universities" shows once the shared university list is on the server
  const [universitiesMenu, setUniversitiesMenu] = useState(false);
  useEffect(() => { universitiesApi.available().then(setUniversitiesMenu); }, []);
  // "admin actions" shows once the unified admin action log is on the server
  const [actionsMenu, setActionsMenu] = useState(false);
  useEffect(() => { adminActionsApi.available().then(setActionsMenu); }, []);
  // "features" shows once the admin feature access routes are on the server
  const [featuresMenu, setFeaturesMenu] = useState(false);
  useEffect(() => { featuresApi.available().then(setFeaturesMenu); }, []);
  // "loyalty programs" shows once the admin loyalty routes are on the server
  const [loyaltyProgramsMenu, setLoyaltyProgramsMenu] = useState(false);
  useEffect(() => { loyaltyApi.adminProgramsAvailable().then(setLoyaltyProgramsMenu); }, []);
  // "hiring overview" shows once the admin hiring views answer (the hiring timeline is set up)
  const [hiringMenu, setHiringMenu] = useState(false);
  useEffect(() => { careerApi.adminOverviewAvailable().then(setHiringMenu); }, []);
  // "hiring plans" (free trials and plans for every employer) shows once the server answers
  const [plansMenu, setPlansMenu] = useState(false);
  useEffect(() => { hiringAccessApi.adminAvailable().then(setPlansMenu); }, []);
  // "company verifications": every employer's company (their jobs go live once it's verified)
  const [companyMenu, setCompanyMenu] = useState(false);
  useEffect(() => { hiringAccessApi.companyAvailable().then(setCompanyMenu); }, []);
  const fetchTodayDrop = useCallback(async () => {
    if (!token) return;
    const key = karachiDayKey(new Date());
    try {
      const list = await engagementApi.listDrops(key, key);
      const drop = (Array.isArray(list) ? list : []).find((d) => d.dayKey === key) || null;
      let votes = null;
      if (drop) {
        try { votes = (await engagementApi.dropResults(key))?.total ?? null; } catch (e) { votes = null; }
      }
      setTodayDrop(drop ? { title: drop.title, votes } : null);
    } catch (err) {
      setTodayDrop(null);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchPendingApprovals();
      fetchTodayDrop();
    }
  }, [token, fetchPendingApprovals, fetchTodayDrop]);

  // keep the menu in step with the URL: a profile highlights its user list; coming back opens that list
  useEffect(() => {
    if (profileId && ROLE_PAGE[profileRole]) setActivePage(ROLE_PAGE[profileRole]);
  }, [profileId, profileRole]);
  useEffect(() => {
    if (!profileId && location.state?.page) setActivePage(location.state.page);
  }, [profileId, location.state]);

  const go = (id) => {
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
    if (profileId) { navigate("/admin", { state: { page: id } }); return; }
    setActivePage(id);
  };
  // the browser tab says which page this is (the menu name)
  useEffect(() => {
    const label = pageLabel(activePage);
    document.title = label ? `${label} · tdc admin` : "tdc admin";
  }, [activePage]);

  // the menu as it is now (pilot pages only when set up); the overview links only to pages that are in it
  // Phase A: only the pages this admin may open (GET /api/admin/me/access); an older server: every page, as before
  const adminMenu = adminMenuFor({ surplus: surplusMenu, fhf: fhfMenu, disputes: disputesMenu, ratings: ratingsMenu, actions: actionsMenu, features: featuresMenu, loyaltyPrograms: loyaltyProgramsMenu, hiring: hiringMenu, plans: plansMenu, company: companyMenu, universities: universitiesMenu });
  const allowedMenu = adminMenu.map((s) => ({ ...s, items: s.items.filter((i) => access.canOpen(i[0])) })).filter((s) => s.items.length > 0);
  const allowedPages = allowedMenu.flatMap((s) => s.items.map((i) => i[0]));
  const n = (v) => (isFetching ? <span className="tdcp-skel" /> : fmt(v));
  // "including suspended: N" when suspended / banned accounts are left out of the number
  const susp = (k, plain) => { const all = stats.withSuspended?.[k]; return all != null && all !== stats[k] ? `including suspended: ${fmt(all)}` : plain; };
  const BIG = [
    { id: "students", label: "total students", value: n(stats.students), sub: susp("students", "active accounts"), icon: "grad", dark: true },
    { id: "brands", label: "brands", value: n(stats.brands), sub: susp("brands", "brand accounts"), icon: "store", tone: "red" },
    { id: "all_brands_revenue", label: "all brands revenue", value: isFetching ? <span className="tdcp-skel" /> : `rs ${fmt(stats.totalRevenue)}`, sub: `${fmt(stats.brands)} brands tracked`, icon: "coin", tone: "green" },
    { id: "manage_jobs", label: "open jobs", value: n(stats.jobs), sub: "in the career hub", icon: "briefcase", tone: "coral" },
  ];
  const SMALL = [
    { id: "employees", label: "employers", value: n(stats.employees), sub: susp("employees", "companies"), icon: "hat", tone: "sky" },
    { id: "all offer", label: "live offers", value: n(stats.offers), sub: "not archived", icon: "tag", tone: "red" },
    { id: "exchange_program", label: "scholarships", value: n(stats.exchange), sub: "study abroad", icon: "grad", tone: "blue" },
    { id: "events", label: "your events", value: n(stats.events), sub: `${fmt(stats.eventRegistrations)} registrations (events you created)`, icon: "calendar", tone: "purple" },
    { id: "card_manager", label: "approved cards", value: n(stats.approvedCards), sub: `${fmt(stats.pendingCards)} pending`, icon: "card", tone: "pink" },
    { id: "travelers", label: "travelers", value: n(stats.travelers), sub: susp("travelers", "all time"), icon: "compass", tone: "coral" },
    { id: "booking", label: "AI travel plans", value: n(stats.bookings), sub: "all time", icon: "plane", tone: "sky" },
  ];
  const TODO = [
    { id: "brand_approval", label: "brand approvals waiting", count: pendingApprovals },
    { id: "card_manager", label: "card requests", count: isFetching ? null : stats.pendingCards },
  ];
  const firstName = (user?.name || "").trim().split(/\s+/)[0];
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const renderDashboard = () => (
    <>
      <div className="tdcp-head">
        <div>
          <p className="tdcp-hello"><img src={dotSorted} alt="" />hey{firstName ? ` ${firstName}` : ""} · {today}</p>
          <h1 className="tdcp-title">the whole crew, at a glance<span className="dot" aria-hidden="true">.</span></h1>
        </div>
        <div className="tdcp-actions">
          {access.canOpen("offers") && <button type="button" className="tdcp-btn tdcp-btn-primary" onClick={() => go("offer")}>create offer</button>}
        </div>
      </div>

      <section aria-label="headline numbers" className="tdcp-grid-big">
        {BIG.filter((s) => access.canOpen(s.id)).map((s) => ( /* Phase A: only cards for their areas */
          <button type="button" key={s.id} className={`tdcp-stat${s.dark ? " dark" : ""}`} onClick={() => go(s.id)}>
            <div className="ico"><Ico kind={s.icon} tone={s.dark ? "yellow" : s.tone} size={52} /></div>
            <div className="lbl">{s.label}</div>
            <div className="num"><CountUp value={s.value} /></div>
            <div className="sub">{s.sub}</div>
          </button>
        ))}
      </section>

      <section aria-label="more numbers" className="tdcp-grid-small">
        {SMALL.filter((s) => access.canOpen(s.id)).map((s) => (
          <button type="button" key={s.id + s.label} className="tdcp-stat small" onClick={() => go(s.id)}>
            <div className="ico"><Ico kind={s.icon} tone={s.tone} size={40} /></div>
            <div className="lbl">{s.label}</div>
            <div className="num"><CountUp value={s.value} /></div>
            <div className="sub">{s.sub}</div>
          </button>
        ))}
      </section>

      <div className="tdcp-grid-2">
        <section className="tdcp-card" style={{ overflow: "hidden" }}>
          <div className="tdcp-card-head"><h2>needs your attention</h2></div>
          {TODO.filter((t) => access.canOpen(t.id)).map((t) => (
            <button type="button" key={t.label} className="tdcp-row" onClick={() => go(t.id)}>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>{t.label}</span>
              <span className={`tdcp-count${!t.count ? " zero" : ""}`}>{t.count == null ? "–" : fmt(t.count)}</span>
            </button>
          ))}
        </section>
        <section className="tdcp-soft">
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 19 }}>today's drop</h2>
          {todayDrop === undefined ? (
            <p style={{ margin: "10px 0 0" }}><span className="tdcp-skel" style={{ width: 220 }} /></p>
          ) : todayDrop ? (
            <>
              <p style={{ margin: "10px 0 0", fontFamily: "var(--heading)", fontWeight: 700, fontSize: 18 }}>{todayDrop.title}</p>
              {todayDrop.votes != null && <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ink-soft)" }}>{fmt(todayDrop.votes)} {todayDrop.votes === 1 ? "vote" : "votes"} so far</p>}
            </>
          ) : (
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--ink-soft)" }}>no drop scheduled for today.</p>
          )}
          {access.canOpen("engagement_drops") && <button type="button" className="tdcp-btn tdcp-btn-secondary" style={{ marginTop: 14, borderColor: "var(--card)" }} onClick={() => go("engagement_drops")}>drops schedule</button>}
        </section>
      </div>
    </>
  );

  // Render Content
  const renderContent = () => {
    // Phase A: paused access, or a page this admin can't open (an old link): say so, show nothing else
    if (access.level === "suspended") return <NoAccess paused />;
    if (access.loaded && !access.canOpen(activePage)) return <NoAccess />;
    switch (activePage) {
      case "dashboard":
        return renderDashboard();

      // Existing
      case "events": return <EventManagement />;
      case "all_brands_revenue": return <AllBrandsRevenue />;
      case "loyalty_exceptions": return <LoyaltyExceptions />;
      case "hiring_funnel": return <HiringFunnel />;
      case "hire_disputes": return <HireDisputes />;
      case "ratings_reports": return <RatingsReports />;
      case "admin_actions": return <AdminActions />;
      case "universities": return <AdminUniversities />;
      case "features": return <AdminFeatures />;
      case "safety": return <AdminSafety />;
      case "loyalty_programs": return <AdminLoyaltyPrograms />;
      case "hiring_overview": return <HiringOverview />;
      case "surplus_ops": return <SurplusOps />;
      case "company_verifications": return <CompanyVerifications />;
      case "business_overview": return <AdminHome go={go} pages={allowedPages} />;
      case "resume_metrics": return <AdminResumeMetrics />;
      case "team_access": return <AdminTeam />;
      case "free_hire_trials": return <FreeHireTrials />;
      case "hiring_plans": return <AdminHiringPlans />;
      case "booking": return <AdminPackage />;
      case "card_manager": return <CardManager />;
      case "offers": return <AdminOffersTabs tab={offersTab} onTab={setOffersTab} />;
      case "manage_jobs": return <AdminJobManager userRole="admin" />;
      case "exchange_program": return <ManageExchange />;
      case "traveling": return <AdminPackageScreen />;
      case "students": return <AdminUserList key="students" role="student" title="all students" />;
      // all students, filtered to the accounts waiting for approval
      case "student_verifications": return <AdminUserList key="student_verifications" role="student" title="student verifications" heading="student verifications" initialStatus="pending" />;
      case "brands": return <AdminUserList role="brand" title="Brand Management" />;
      case "employees": return <AdminUserList role="employee" title="Employee Management" />;
      case "travelers": return <AdminUserList role="traveler" title="Traveler Management" />;
      case "brand_approval": return <BrandApprovalScreen />;

      // 🆕 CREW
      case "crew_inbox": return <CrewInbox />;
      case "crew_partners": return <CrewPartners />;
      case "crew_campaigns": return <CrewCampaigns />;
      case "crew_credentials": return <CrewCredentials />;

      // 🆕 ENGAGEMENT
      case "engagement_drops": return <DropsSchedule />;
      case "engagement_metrics": return <AdminMetrics />;
      case "engagement_rewards": return <RewardsAdmin />;
      case "engagement_test_push": return <TestPush />;

      default:
        return <div className="tdcp-card tdcp-empty">this page is not available.</div>;
    }
  };

  if (loading) {
    return (
      <div className="tdcp" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }} role="status">
        <span className="tdcp-muted">loading the admin portal…</span>
      </div>
    );
  }

  return (
    <div className={`tdcp tdcp-shell${isMobileMenuOpen ? " nav-open" : ""}`}>
      <PortalNav
        menu={allowedMenu}
        active={activePage}
        onSelect={go}
        collapsible
        searchable
        storageKey={`tdc.admin.nav.${user?._id || user?.id || "admin"}`}
        badges={{
          brand_approval: pendingApprovals,
          student_verifications: isFetching ? null : stats.pendingStudents,
          ...waiting,
        }}
        userName={user?.name}
        userRole="admin"
        portalLabel="admin"
        onLogout={logout}
        onClose={isMobileMenuOpen ? () => setIsMobileMenuOpen(false) : undefined}
      />
      <div className="tdcp-scrim" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="tdcp-topbar">
          <img src={logoInk} alt="tdc." />
          <span style={{ fontWeight: 700, fontSize: 14 }}>{pageLabel(activePage) || "admin"}</span>
          <button type="button" className="tdcp-icon-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="open menu" aria-expanded={isMobileMenuOpen} style={{ width: 44, height: 44, borderRadius: 22, border: "1px solid var(--line)", background: "var(--card)" }}>
            <Ico kind="menu" tone="plain" size={20} />
          </button>
        </header>
        <main className="tdcp-main" ref={mainRef}>
          {profileId
            ? <AdminUserProfile role={profileRole} id={profileId} onBack={() => navigate("/admin", { state: { page: ROLE_PAGE[profileRole] || "dashboard" } })} />
            : renderContent()}
        </main>
      </div>
    </div>
  );
}
