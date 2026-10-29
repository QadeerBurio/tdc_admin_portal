// src/screens/CompanyDashboard.js
// Employer portal: the shell (PortalNav employer menu on real URLs, design/portal/PortalNav) and the dashboard
// (design/portal/EmpDashboard). The shell loads the same data the old dashboard did and hands it to each screen.
import React, { useState, useContext, useEffect , useRef } from "react";
import { useRouteFade } from "../portal/motion";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation, Link, Outlet, useOutletContext } from "react-router-dom";
import axios from "axios";
import "../portal/portal.css";
import Ico from "../portal/Ico";
import PortalNav, { EMPLOYER_MENU } from "../portal/PortalNav";
import { PageLoading, StatCard, Pill, Button, EmptyState } from "../portal/kit";
import logoInk from "../portal/assets/tdc-logo-ink.png";
import dotSorted from "./dots/sorted.png";
import AdminJobsManager from "./AdminJobsManager";
import CandidatesManager from "./CandidateManager";
import InterviewsManager from "./InterviewsManager";
import ReportsManager from "./ReportsManager";
import "./styles/EmployerPortal.css";

// path -> menu item
const NAV_FOR_PATH = {
  "/employee-dashboard": "dashboard",
  "/employee-jobs": "jobs",
  "/candidate": "candidates",
  "/interviews": "interviews",
  "/reports": "reports",
  "/settings": "settings",
};
const LABEL_FOR_NAV = { dashboard: "dashboard", jobs: "jobs", candidates: "candidates", interviews: "interviews", reports: "reports", settings: "settings" };

const CompanyDashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  useRouteFade(mainRef, location.pathname);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    shortlistedCandidates: 0,
    totalInterviews: 0,
    upcomingInterviews: 0,
    hiredCandidates: 0,
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviewsList, setUpcomingInterviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const API_URL = "https://the-deft-crew-production.up.railway.app/api";
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (token) {
      fetchAllData();
      fetchEmployeeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // the mobile menu closes when the page changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // ─── Fetch all data ──────────────────────────────────────────────
  const fetchAllData = async () => {
    setRefreshing(true);
    setFetchError(null);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentApplications(),
        fetchUpcomingInterviews(),
      ]);
    } catch (error) {
      console.error("Error fetching all data:", error);
      setFetchError("Failed to load some data. Please refresh.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // ─── Fetch employee data ────────────────────────────────────────
  const fetchEmployeeData = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, config);
      setEmployeeData({
        ...res.data,
        logo: res.data.logo || "",
        companyName: res.data.companyName || res.data.brandName || "",
        brandName: res.data.brandName || "",
        name: res.data.name || user?.name || "",
      });
    } catch (err) {
      console.error("Error fetching employee data", err);
      setEmployeeData({
        name: user?.name || "",
        email: user?.email || "",
        companyName: user?.companyName || "",
        logo: user?.logo || "",
      });
    }
  };

  // ─── Fetch dashboard stats from /stats endpoint ────────────────
  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs/stats`, config);
      const data = res.data;
      
      setStats({
        totalJobs: data.totalJobs || 0,
        activeJobs: data.activeJobs || 0,
        totalApplications: data.totalApplications || 0,
        pendingApplications: data.pendingApplications || 0,
        shortlistedCandidates: data.shortlistedApplications || 0,
        totalInterviews: data.totalInterviews || 0,
        upcomingInterviews: data.upcomingInterviews || 0,
        hiredCandidates: data.hiredApplications || 0,
      });
      
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      
      // Fallback: Try individual endpoints
      try {
        // Get jobs
        const jobsRes = await axios.get(`${API_URL}/jobs/my-jobs`, config);
        const jobs = jobsRes.data || [];
        const activeJobs = jobs.filter(j => j.active).length;
        
        // Get applications for my jobs
        let totalApps = 0;
        let pendingApps = 0;
        let shortlisted = 0;
        let hired = 0;
        
        for (const job of jobs) {
          try {
            const appsRes = await axios.get(`${API_URL}/jobs/job/${job._id}/applications`, config);
            const apps = appsRes.data || [];
            totalApps += apps.length;
            apps.forEach(app => {
              if (app.status === 'pending') pendingApps++;
              if (app.status === 'shortlisted') shortlisted++;
              if (app.status === 'hired') hired++;
            });
          } catch (e) {
            // Skip if can't fetch apps for this job
          }
        }
        
        setStats({
          totalJobs: jobs.length,
          activeJobs: activeJobs,
          totalApplications: totalApps,
          pendingApplications: pendingApps,
          shortlistedCandidates: shortlisted,
          totalInterviews: 0,
          upcomingInterviews: 0,
          hiredCandidates: hired,
        });
      } catch (fallbackErr) {
        console.error("Fallback stats fetch failed:", fallbackErr);
      }
    }
  };

  // ─── Fetch recent applications ──────────────────────────────────
  const fetchRecentApplications = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs/candidates/all?limit=5`, config);
      setRecentApplications(res.data || []);
    } catch (err) {
      console.error("Error fetching recent applications:", err);
      setRecentApplications([]);
    }
  };

  // ─── Fetch upcoming interviews ──────────────────────────────────
  const fetchUpcomingInterviews = async () => {
    try {
      const res = await axios.get(`${API_URL}/jobs/interviews/upcoming`, config);
      setUpcomingInterviewsList(res.data || []);
    } catch (err) {
      console.error("Error fetching upcoming interviews:", err);
      setUpcomingInterviewsList([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getCompanyName = () => {
    return employeeData?.companyName || 
           employeeData?.brandName || 
           user?.companyName || 
           user?.brandName || 
           "Employer";
  };

  const getDisplayName = () => {
    return employeeData?.name || user?.name || "User";
  };

  const getLogoUrl = () => {
    return employeeData?.logo || user?.logo || "";
  };

  const companyName = getCompanyName();
  const displayName = getDisplayName();
  const logoUrl = getLogoUrl();
  const active = NAV_FOR_PATH[location.pathname];

  return (
    <div className={`tdcp tdcp-shell${isMobileMenuOpen ? " nav-open" : ""}`} data-portal="employer">
      <PortalNav
        menu={EMPLOYER_MENU}
        active={active}
        onSelect={() => setIsMobileMenuOpen(false)}
        userName={companyName}
        userRole="employer"
        portalLabel="employer"
        onLogout={handleLogout}
        onClose={isMobileMenuOpen ? () => setIsMobileMenuOpen(false) : undefined}
        settingsHref="/settings"
      />
      <div className="tdcp-scrim" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="tdcp-topbar">
          <img src={logoInk} alt="tdc." />
          <span style={{ fontWeight: 700, fontSize: 14 }}>{LABEL_FOR_NAV[active] || "employer"}</span>
          <button type="button" className="tdcp-icon-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="open menu" aria-expanded={isMobileMenuOpen} style={{ width: 44, height: 44, borderRadius: 22, border: "1px solid var(--line)", background: "var(--card)" }}>
            <Ico kind="menu" tone="plain" size={20} />
          </button>
        </header>
        <main className="tdcp-main" ref={mainRef}>
          <Outlet context={{ token, user, stats, recentApplications, upcomingInterviewsList, loading, refreshing, fetchError, fetchAllData, employeeData, companyName, displayName, logoUrl }} />
        </main>
      </div>
    </div>
  );
};

export default CompanyDashboard;

// ─── the screens inside the shell ───────────────────────────────────
// They take the same props they had as tabs of the old dashboard.
export function EmployerJobs() {
  const { user } = useOutletContext();
  return <AdminJobsManager userRole={user?.role} userName={user?.name} />;
}
export function EmployerCandidates() {
  const { token } = useOutletContext();
  return <CandidatesManager token={token} />;
}
export function EmployerInterviews() {
  const { token } = useOutletContext();
  return <InterviewsManager token={token} />;
}
export function EmployerReports() {
  const { token, stats } = useOutletContext();
  return <ReportsManager token={token} stats={stats} />;
}

// ─── dashboard (design/portal/EmpDashboard) ─────────────────────────
const STATUS_TONE = { pending: "sand", reviewed: "blue", shortlisted: "yellow", interview: "ink", rejected: "red", hired: "green" };

export function EmployerDashboard() {
  const navigate = useNavigate();
  const { stats, recentApplications, upcomingInterviewsList, loading, refreshing, fetchError, fetchAllData, companyName } = useOutletContext();

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading your dashboard..." /></div>;

  return (
    <div className="tdcp k-page emp-dash" data-screen="employer-dashboard">
      <div className="k-head">
        <div>
          <p className="emp-hey"><img src={dotSorted} alt="" />hey {companyName}</p>
          <h1>who are we hiring today<span className="dot" aria-hidden="true">?</span></h1>
        </div>
        <div className="k-actions">
          <Button icon="plus" onClick={() => navigate("/employee-jobs")}>post a job</Button>
        </div>
      </div>

      {fetchError && (
        <div className="k-note bad emp-error" role="alert">
          <span>{fetchError}</span>
          <Button variant="secondary" size="sm" icon="refresh" loading={refreshing} onClick={fetchAllData}>Retry</Button>
        </div>
      )}

      <div className="k-stats">
        <StatCard label="jobs posted" value={stats.totalJobs} sub={`${stats.activeJobs} active`} icon="briefcase" tone="coral" onClick={() => navigate("/employee-jobs")} />
        <StatCard label="applications" value={stats.totalApplications} sub={`${stats.pendingApplications} pending`} icon="users" tone="blue" onClick={() => navigate("/candidate")} />
        <StatCard label="shortlisted" value={stats.shortlistedCandidates} sub="ready for interview" icon="star" tone="orange" onClick={() => navigate("/candidate")} />
        <StatCard label="hired" value={stats.hiredCandidates} sub="successfully placed" icon="trophy" tone="green" onClick={() => navigate("/reports")} />
      </div>

      <div className="emp-dash-grid">
        <section className="k-card emp-list">
          <div className="emp-list-head">
            <h2>recent applications</h2>
            <Link to="/candidate" className="emp-see">see all</Link>
          </div>
          {recentApplications.length > 0 ? (
            recentApplications.map((app, index) => (
              <div className="emp-row" key={app._id || index}>
                <span className="emp-i" aria-hidden="true">{(app.fullName?.charAt(0) || "A").toLowerCase()}</span>
                <div className="emp-row-text">
                  <b>{app.fullName || "Unknown"}</b>
                  <span className="k-muted">{[app.jobId?.title || "Position", `${app.yearsOfExperience || 0}y exp`, app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Recently"].join(" · ")}</span>
                </div>
                <Pill tone={STATUS_TONE[app.status || "pending"] || "sand"}>{app.status || "pending"}</Pill>
              </div>
            ))
          ) : (
            <EmptyState icon="users" tone="blue" title="No recent applications" text="Applications will appear here" />
          )}
        </section>

        <section className="k-card emp-list">
          <div className="emp-list-head">
            <h2>upcoming interviews</h2>
            <Link to="/interviews" className="emp-see">see all</Link>
          </div>
          {upcomingInterviewsList.length > 0 ? (
            upcomingInterviewsList.map((interview, index) => {
              const d = interview.interviewDate ? new Date(interview.interviewDate) : null;
              return (
                <div className="emp-row" key={interview._id || index}>
                  <span className="emp-date" aria-hidden="true">
                    <b>{d ? d.getDate() : "??"}</b>
                    <span>{d ? d.toLocaleString("default", { month: "short" }) : "TBD"}</span>
                  </span>
                  <div className="emp-row-text">
                    <b>{interview.fullName || "Candidate"}</b>
                    <span className="k-muted">{[interview.jobId?.title || "Position", interview.jobId?.department].filter(Boolean).join(" · ")}</span>
                    <span className="k-muted">{d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time TBD"}</span>
                  </div>
                  {interview.meetingLink ? (
                    <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" className="k-btn secondary sm"><Ico kind="play" tone="plain" size={16} />Join</a>
                  ) : (
                    <span className="k-hint">No link</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="emp-none">
              <img src={dotSorted} alt="" />
              <p className="emp-none-t">nothing scheduled<span className="dot" aria-hidden="true">.</span></p>
              <p className="k-muted">shortlist candidates, then schedule from here.</p>
              <Link to="/interviews" className="k-btn secondary">schedule interview</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
