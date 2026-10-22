// AdminDashboard.js: the admin portal shell (sidebar from design/portal/PortalNav) and the dashboard
// (design/portal/AdDashboard). Pages still switch inside /admin; the data calls are the same as before.
import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { engagementApi } from "../services/api";
import "./styles/AdminDashboard.css";
import "../portal/portal.css";
import Ico from "../portal/Ico";
import PortalNav, { pageLabel } from "../portal/PortalNav";
import AdminUserProfile from "../portal/AdminUserProfile";
import logoInk from "../portal/assets/tdc-logo-ink.png";
import dotSorted from "./dots/sorted.png";

// Sub-Components
import CreateOfferAdmin from "./CreateOfferAdmin";
import AdminOffers from "./AdminOffers";
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
import EngagementMetrics from "./EngagementMetrics";
import RewardsAdmin from "./RewardsAdmin";
import TestPush from "./TestPush";


// Today's date in Karachi as YYYY-MM-DD (the drops schedule uses the same key)
const karachiDayKey = (d) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const fmt = (n) => Number(n || 0).toLocaleString("en-US");
// user list page for each role in a profile URL (/admin/users/:role/:id)
const ROLE_PAGE = { student: "students", brand: "brands", employee: "employees", traveler: "travelers" };

export default function AdminDashboard() {
  const { user, token, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const { role: profileRole, id: profileId } = useParams();
  const location = useLocation();
  const [activePage, setActivePage] = useState(location.state?.page || ROLE_PAGE[profileRole] || "dashboard");
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
  const API_BASE = "https://the-deft-crew-production.up.railway.app/api";

  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);

    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const adminAPI = `${API_BASE}/admin`;

      const endpoints = [
        `${adminAPI}/all`,
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
        offers: Array.isArray(responses[0]) ? responses[0].length : 0,
        jobs: Array.isArray(responses[1]) ? responses[1].length : 0,
        students: Array.isArray(responses[2]) ? responses[2].length : 0,
        brands: Array.isArray(responses[3]) ? responses[3].length : 0,
        employees: Array.isArray(responses[4]) ? responses[4].length : 0,
        travelers: Array.isArray(responses[5]) ? responses[5].length : 0,
        exchange: Array.isArray(responses[6]) ? responses[6].length : 0,
        packages: Array.isArray(responses[7]) ? responses[7].length : 0,
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

  // Today's drop and its votes (read only)
  const [todayDrop, setTodayDrop] = useState(undefined);
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

  const n = (v) => (isFetching ? <span className="tdcp-skel" /> : fmt(v));
  const BIG = [
    { id: "students", label: "total students", value: n(stats.students), sub: "registered on tdc", icon: "grad", dark: true },
    { id: "brands", label: "brands", value: n(stats.brands), sub: "brand accounts", icon: "store", tone: "red" },
    { id: "all_brands_revenue", label: "all brands revenue", value: isFetching ? <span className="tdcp-skel" /> : `rs ${fmt(stats.totalRevenue)}`, sub: `${fmt(stats.brands)} brands tracked`, icon: "coin", tone: "green" },
    { id: "manage_jobs", label: "open jobs", value: n(stats.jobs), sub: "in the career hub", icon: "briefcase", tone: "coral" },
  ];
  const SMALL = [
    { id: "employees", label: "employers", value: n(stats.employees), sub: "companies", icon: "hat", tone: "sky" },
    { id: "all offer", label: "total offers", value: n(stats.offers), sub: "all offers", icon: "tag", tone: "red" },
    { id: "exchange_program", label: "scholarships", value: n(stats.exchange), sub: "study abroad", icon: "grad", tone: "blue" },
    { id: "events", label: "events", value: n(stats.events), sub: `${fmt(stats.eventRegistrations)} registrations`, icon: "calendar", tone: "purple" },
    { id: "card_manager", label: "approved cards", value: n(stats.approvedCards), sub: `${fmt(stats.pendingCards)} pending`, icon: "card", tone: "pink" },
    { id: "travelers", label: "travelers", value: n(stats.travelers), sub: "all time", icon: "compass", tone: "coral" },
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
          <button type="button" className="tdcp-btn tdcp-btn-primary" onClick={() => go("offer")}>create offer</button>
        </div>
      </div>

      <section aria-label="headline numbers" className="tdcp-grid-big">
        {BIG.map((s) => (
          <button type="button" key={s.id} className={`tdcp-stat${s.dark ? " dark" : ""}`} onClick={() => go(s.id)}>
            <div className="ico"><Ico kind={s.icon} tone={s.dark ? "yellow" : s.tone} size={52} /></div>
            <div className="lbl">{s.label}</div>
            <div className="num">{s.value}</div>
            <div className="sub">{s.sub}</div>
          </button>
        ))}
      </section>

      <section aria-label="more numbers" className="tdcp-grid-small">
        {SMALL.map((s) => (
          <button type="button" key={s.id + s.label} className="tdcp-stat small" onClick={() => go(s.id)}>
            <div className="ico"><Ico kind={s.icon} tone={s.tone} size={40} /></div>
            <div className="lbl">{s.label}</div>
            <div className="num">{s.value}</div>
            <div className="sub">{s.sub}</div>
          </button>
        ))}
      </section>

      <div className="tdcp-grid-2">
        <section className="tdcp-card" style={{ overflow: "hidden" }}>
          <div className="tdcp-card-head"><h2>needs your attention</h2></div>
          {TODO.map((t) => (
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
              {todayDrop.votes != null && <p style={{ margin: "6px 0 0", fontSize: 14, color: "#4A473F" }}>{fmt(todayDrop.votes)} {todayDrop.votes === 1 ? "vote" : "votes"} so far</p>}
            </>
          ) : (
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "#4A473F" }}>no drop scheduled for today.</p>
          )}
          <button type="button" className="tdcp-btn tdcp-btn-secondary" style={{ marginTop: 14, borderColor: "#FFFFFF" }} onClick={() => go("engagement_drops")}>drops schedule</button>
        </section>
      </div>
    </>
  );

  // Render Content
  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return renderDashboard();

      // Existing
      case "events": return <EventManagement />;
      case "all_brands_revenue": return <AllBrandsRevenue />;
      case "booking": return <AdminPackage />;
      case "card_manager": return <CardManager />;
      case "offer": return <CreateOfferAdmin />;
      case "all offer": return <AdminOffers />;
      case "manage_jobs": return <AdminJobManager />;
      case "exchange_program": return <ManageExchange />;
      case "traveling": return <AdminPackageScreen />;
      case "students": return <AdminUserList role="student" title="Student Directory" />;
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
      case "engagement_metrics": return <EngagementMetrics />;
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
        active={activePage}
        onSelect={go}
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
          <button type="button" className="tdcp-icon-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="open menu" aria-expanded={isMobileMenuOpen} style={{ width: 44, height: 44, borderRadius: 22, border: "1px solid #ECE7DB", background: "#FFFFFF" }}>
            <Ico kind="menu" tone="plain" size={20} />
          </button>
        </header>
        <main className="tdcp-main">
          {profileId
            ? <AdminUserProfile role={profileRole} id={profileId} onBack={() => navigate("/admin", { state: { page: ROLE_PAGE[profileRole] || "dashboard" } })} />
            : renderContent()}
        </main>
      </div>
    </div>
  );
}
