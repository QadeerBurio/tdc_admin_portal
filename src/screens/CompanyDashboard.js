import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminJobsManager from "./AdminJobsManager";
import CandidatesManager from "./CandidateManager";
import InterviewsManager from "./InterviewsManager";
import ReportsManager from "./ReportsManager";

// Icons
import {
  FaBriefcase,
  FaUsers,
  FaCalendarCheck,
  FaChartBar,
  FaHome,
  FaVideo,
  FaSignOutAlt,
  FaFileAlt,
  FaUserTie,
  FaCheckCircle,
  FaClock,
  FaEye,
  FaPlus,
  FaDownload,
  FaUserPlus,
  FaEnvelope,
  FaPhone,
  FaArrowRight,
  FaBell,
  FaSearch,
  FaCog,
  FaUser,
  FaUserCircle,
  FaChevronDown,
  FaTimes,
  FaLock,
  FaShieldAlt,
  FaGlobe,
  FaBuilding,
  FaImage,
  FaSpinner,
  FaGripLines,
  FaRocket,
  FaThumbsUp,
  FaChartLine,
  FaBars,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const CompanyDashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [fetchError, setFetchError] = useState(null);
  const userMenuRef = useRef(null);

  const API_URL = "https://the-deft-crew-production.up.railway.app/api";
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (token) {
      fetchAllData();
      fetchEmployeeData();
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FaHome />,
      description: "Overview & Analytics",
    },
    {
      id: "jobs",
      label: "Jobs",
      icon: <FaBriefcase />,
      description: "Manage Job Postings",
    },
    {
      id: "candidates",
      label: "Candidates",
      icon: <FaUsers />,
      description: "Review Applications",
    },
    {
      id: "interviews",
      label: "Interviews",
      icon: <FaCalendarCheck />,
      description: "Schedule & Track",
    },
    {
      id: "reports",
      label: "Reports",
      icon: <FaChartBar />,
      description: "Analytics & Reports",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "reviewed": return "#3b82f6";
      case "shortlisted": return "#10b981";
      case "interview": return "#8b5cf6";
      case "rejected": return "#ef4444";
      case "hired": return "#059669";
      default: return "#6b7280";
    }
  };

  const getTabTitle = () => {
    const tab = navItems.find(item => item.id === activeTab);
    return tab ? tab.label : "Dashboard";
  };

  const getTabDescription = () => {
    const tab = navItems.find(item => item.id === activeTab);
    return tab ? tab.description : "Overview & Analytics";
  };

  const renderDashboard = () => {
    const companyName = getCompanyName();
    const displayName = getDisplayName();
    const logoUrl = getLogoUrl();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={styles.dashboardContainer}
      >
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={styles.welcomeBanner}
        >
          <div style={styles.welcomeContent}>
            <div style={styles.welcomeAvatarWrapper}>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Company Logo" 
                  style={styles.welcomeAvatar}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div style={styles.welcomeAvatarFallback}>
                  {displayName?.charAt(0) || "E"}
                </div>
              )}
            </div>
            <div style={styles.welcomeText}>
              <h2 style={styles.welcomeTitle}>Welcome back, {displayName}!</h2>
              <p style={styles.welcomeSubtitle}>
                {companyName} • {stats.totalJobs} jobs • {stats.totalApplications} applications
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={styles.welcomeBtn}
            onClick={() => {
              setActiveTab("jobs");
              if (isMobile) setIsMobileMenuOpen(false);
            }}
          >
            <FaPlus size={14} /> Post New Job
          </motion.button>
        </motion.div>

        {/* Stats Grid - 4 per row on large, 1 per row on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            ...styles.statsGrid,
            gridTemplateColumns: isMobile 
              ? "1fr" 
              : "repeat(3, 1fr)",
            gap: isMobile ? "12px" : "16px",
          }}
        >
          <div style={styles.statCard} className="stat-card">
            <div style={styles.statIconWrapper}>
              <FaBriefcase style={styles.statIcon} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{stats.totalJobs}</h3>
              <p style={styles.statLabel}>Total Jobs</p>
              <span style={styles.statTrend}>
                <span style={styles.trendUp}>↑</span> {stats.activeJobs} active
              </span>
            </div>
          </div>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIconWrapper, background: "#ecfdf5" }}>
              <FaFileAlt style={{ ...styles.statIcon, color: "#10b981" }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{stats.totalApplications}</h3>
              <p style={styles.statLabel}>Applications</p>
              <span style={styles.statTrend}>
                <span style={styles.trendUp}>↑</span> {stats.pendingApplications} pending
              </span>
            </div>
          </div>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIconWrapper, background: "#fef3c7" }}>
              <FaUserTie style={{ ...styles.statIcon, color: "#f59e0b" }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{stats.shortlistedCandidates}</h3>
              <p style={styles.statLabel}>Shortlisted</p>
              <span style={styles.statTrend}>Ready for interview</span>
            </div>
          </div>
         
        </motion.div>

        {/* Stats Grid Row 2 - 4 per row on large, 1 per row on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            ...styles.statsGrid,
            gridTemplateColumns: isMobile 
              ? "1fr" 
              : "repeat(3, 1fr)",
            gap: isMobile ? "12px" : "16px",
          }}
        >
         <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIconWrapper, background: "#f3e8ff" }}>
              <FaCalendarCheck style={{ ...styles.statIcon, color: "#8b5cf6" }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{stats.upcomingInterviews}</h3>
              <p style={styles.statLabel}>Upcoming Interviews</p>
              <span style={styles.statTrend}>Total: {stats.totalInterviews} scheduled</span>
            </div>
          </div>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIconWrapper, background: "#dcfce7" }}>
              <FaCheckCircle style={{ ...styles.statIcon, color: "#059669" }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>{stats.hiredCandidates}</h3>
              <p style={styles.statLabel}>Hired</p>
              <span style={styles.statTrend}>Successfully placed</span>
            </div>
          </div>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIconWrapper, background: "#ffe4e6" }}>
              <FaEye style={{ ...styles.statIcon, color: "#e11d48" }} />
            </div>
            <div style={styles.statContent}>
              <h3 style={styles.statValue}>
                {stats.totalJobs * 15 + stats.totalApplications * 2}
              </h3>
              <p style={styles.statLabel}>Total Views</p>
              <span style={styles.statTrend}>Last 30 days</span>
            </div>
          </div>
         
        </motion.div>

        {/* Recent Activity Sections - Column Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={styles.columnLayout}
        >
          {/* Recent Applications */}
          <div style={styles.sectionCard} className="section-card">
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Recent Applications</h3>
                <p style={styles.sectionSubtitle}>Latest candidates who applied</p>
              </div>
              <button style={styles.viewAllBtn} onClick={() => {
                setActiveTab("candidates");
                if (isMobile) setIsMobileMenuOpen(false);
              }}>
                View All <FaArrowRight size={12} />
              </button>
            </div>
            <div style={styles.applicationsList}>
              {recentApplications.length > 0 ? (
                recentApplications.map((app, index) => (
                  <motion.div
                    key={app._id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={styles.applicationItem}
                    className="application-item"
                  >
                    <div style={styles.applicantAvatar}>
                      {app.fullName?.charAt(0) || "A"}
                    </div>
                    <div style={styles.applicantInfo}>
                      <div style={styles.applicantName}>{app.fullName || "Unknown"}</div>
                      <div style={styles.applicantDetails}>
                        <span>{app.jobId?.title || "Position"}</span>
                        <span>•</span>
                        <span>{app.yearsOfExperience || 0}y exp</span>
                      </div>
                      <div style={styles.jobTitle}>{app.email || ""}</div>
                    </div>
                    <div style={styles.applicationStatus}>
                      <span style={{
                        ...styles.statusBadge,
                        background: getStatusColor(app.status || "pending"),
                      }}>
                        {app.status || "Pending"}
                      </span>
                      <span style={styles.appliedDate}>
                        {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Recently"}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <p>No recent applications</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Applications will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div style={styles.sectionCard} className="section-card">
            <div style={styles.sectionHeader}>
              <div>
                <h3 style={styles.sectionTitle}>Upcoming Interviews</h3>
                <p style={styles.sectionSubtitle}>Scheduled interviews</p>
              </div>
              <button style={styles.viewAllBtn} onClick={() => {
                setActiveTab("interviews");
                if (isMobile) setIsMobileMenuOpen(false);
              }}>
                View All <FaArrowRight size={12} />
              </button>
            </div>
            <div style={styles.interviewsList}>
              {upcomingInterviewsList.length > 0 ? (
                upcomingInterviewsList.map((interview, index) => (
                  <motion.div
                    key={interview._id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={styles.interviewItem}
                    className="interview-item"
                  >
                    <div style={styles.interviewDate}>
                      <div style={styles.dateDay}>
                        {interview.interviewDate ? new Date(interview.interviewDate).getDate() : "??"}
                      </div>
                      <div style={styles.dateMonth}>
                        {interview.interviewDate ? new Date(interview.interviewDate).toLocaleString('default', { month: 'short' }) : "TBD"}
                      </div>
                    </div>
                    <div style={styles.interviewInfo}>
                      <div style={styles.candidateName}>
                        {interview.fullName || "Candidate"}
                      </div>
                      <div style={styles.interviewJob}>
                        {interview.jobId?.title || "Position"} • {interview.jobId?.department || ""}
                      </div>
                      <div style={styles.interviewTime}>
                        <FaClock size={12} /> 
                        {interview.interviewDate ? new Date(interview.interviewDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Time TBD"}
                      </div>
                    </div>
                    {interview.meetingLink ? (
                      <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer" style={styles.joinBtn} className="join-btn">
                        <FaVideo size={14} /> Join
                      </a>
                    ) : (
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>No link</span>
                    )}
                  </motion.div>
                ))
              ) : (
                <div style={styles.emptyState}>
                  <p>No upcoming interviews</p>
                  <p style={{ fontSize: "12px", color: "#94a3b8" }}>Schedule interviews from candidates</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

      

        {/* Error Message */}
        {fetchError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.errorBanner}
          >
            <span style={styles.errorIcon}>⚠️</span>
            <span style={styles.errorText}>{fetchError}</span>
            <button style={styles.errorRetryBtn} onClick={fetchAllData}>
              <FaSpinner size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} /> Retry
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return renderDashboard();
      case "jobs":
        return <AdminJobsManager userRole={user?.role} userName={user?.name} />;
      case "candidates":
        return <CandidatesManager token={token} />;
      case "interviews":
        return <InterviewsManager token={token} />;
      case "reports":
        return <ReportsManager token={token} stats={stats} />;
      default:
        return renderDashboard();
    }
  };

  const companyName = getCompanyName();
  const displayName = getDisplayName();
  const logoUrl = getLogoUrl();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>
          <FaSpinner className="spin" size={48} color="#f9c349" />
        </div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
        <div style={styles.loadingBar}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, repeat: Infinity }}
            style={styles.loadingProgress}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <motion.div
          style={styles.mobileOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          style={{
            ...styles.mobileMenuBtn,
            left: isMobileMenuOpen ? '290px' : '12px',
          }}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="mobileMenuBtn"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      )}

      {/* Modern Sidebar */}
      <motion.nav
        style={{
          ...styles.sidebar,
          width: isMobile ? '280px' : (isSidebarCollapsed ? '80px' : '260px'),
          transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          position: isMobile ? 'fixed' : 'relative',
        }}
        initial={false}
        animate={{
          x: isMobile ? (isMobileMenuOpen ? 0 : -280) : 0,
          transition: { type: "spring", stiffness: 300, damping: 30 }
        }}
      >
        <div style={styles.sidebarGradient} />
        
        <div style={styles.brandSection}>
          <div style={styles.logoBadge}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Company Logo" 
                style={styles.sidebarLogo}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span style={styles.logoIcon}>tdc</span>';
                }}
              />
            ) : (
              <span style={styles.logoIcon}>tdc</span>
            )}
          </div>
          {!isSidebarCollapsed && !isMobile && (
            <div>
              <h2 style={styles.logoText}>Company<span style={styles.logoHighlight}> Dashboard</span></h2>
            </div>
          )}
          {!isSidebarCollapsed && isMobile && (
            <div style={styles.brandText}>
              <h2 style={styles.logoText}>Company<span style={styles.logoHighlight}> Dashboard</span></h2>
            </div>
          )}
        </div>

        <div style={styles.navGroup}>
          {!isSidebarCollapsed && <p style={styles.navGroupLabel}>Main Menu</p>}
          {navItems.map((item) => (
            <div
              key={item.id}
              className="nav-link"
              style={{
                ...styles.navItem,
                background:
                  activeTab === item.id ? "rgba(249, 195, 73, 0.12)" : "transparent",
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '14px' : '12px 18px',
                borderRight: activeTab === item.id ? '3px solid #f9c349' : '3px solid transparent',
              }}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setIsMobileMenuOpen(false);
              }}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <span style={{ 
                ...styles.icon, 
                color: activeTab === item.id ? "#f9c349" : "#94a3b8",
                fontSize: isSidebarCollapsed ? '22px' : '18px',
              }}>
                {item.icon}
              </span>
              {!isSidebarCollapsed && (
                <div style={styles.navText}>
                  <span style={{ 
                    ...styles.navLabel,
                    color: activeTab === item.id ? "#f9c349" : "#e2e8f0"
                  }}>
                    {item.label}
                  </span>
                  <span style={styles.navDesc}>{item.description}</span>
                </div>
              )}
              {activeTab === item.id && !isSidebarCollapsed && (
                <span style={styles.activeIndicator} />
              )}
            </div>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <div style={styles.userSection} ref={userMenuRef}>
            <div 
              style={{
                ...styles.userInfo,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '10px' : '10px',
              }} 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="user-info-clickable"
            >
              <div style={styles.userAvatar}>
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Company Logo" 
                    style={styles.userAvatarImg}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.textContent = displayName?.charAt(0) || "E";
                    }}
                  />
                ) : (
                  displayName?.charAt(0) || "E"
                )}
              </div>
              {!isSidebarCollapsed && !isMobile && (
                <>
                  <div style={styles.userInfoText}>
                    <div style={styles.userName}>{displayName}</div>
                    <div style={styles.userRole}>
                      {companyName || "Employer"}
                    </div>
                  </div>
                  <FaChevronDown style={{ 
                    ...styles.userChevron, 
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} />
                </>
              )}
              {!isSidebarCollapsed && isMobile && (
                <>
                  <div style={styles.userInfoText}>
                    <div style={styles.userName}>{displayName}</div>
                    <div style={styles.userRole}>
                      {companyName || "Employer"}
                    </div>
                  </div>
                  <FaChevronDown style={{ 
                    ...styles.userChevron, 
                    transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                  }} />
                </>
              )}
            </div>
            
            {showUserMenu && !isSidebarCollapsed && (
              <div style={styles.userDropdown}>
                <div 
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowProfileModal(true);
                  }}
                >
                  <FaUserCircle size={18} />
                  <span>My Profile</span>
                </div>
               
                <div style={styles.dropdownDivider} />
                <div 
                  style={{ ...styles.dropdownItem, ...styles.dropdownLogout }}
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                >
                  <FaSignOutAlt size={18} />
                  <span>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {/* Modern Header */}
          <div style={styles.modernHeader}>
            <div style={styles.headerLeft}>
              <div style={styles.headerBreadcrumb}>
                <span style={styles.breadcrumbHome}>
                  <FaHome size={14} color="#f9c349" />
                </span>
                <span style={styles.breadcrumbSeparator}>/</span>
                <span style={styles.breadcrumbCurrent}>{getTabTitle()}</span>
              </div>
              <h1 style={styles.headerTitle}>{getTabTitle()}</h1>
              <p style={styles.headerDescription}>{getTabDescription()}</p>
            </div>
          </div>

          {renderContent()}
        </div>
      </main>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  <FaUser size={20} style={{ marginRight: '12px', color: '#f9c349' }} />
                  My Profile
                </h2>
                <button style={styles.modalCloseBtn} onClick={() => setShowProfileModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div style={styles.profileContent}>
                <div style={styles.profileAvatarContainer}>
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Company Logo" 
                      style={styles.profileAvatarImg}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={styles.profileAvatar}>
                      {displayName?.charAt(0) || "E"}
                    </div>
                  )}
                </div>
                <div style={styles.profileInfo}>
                  <div style={styles.profileName}>{displayName}</div>
                  <div style={styles.profileEmail}>{user?.email || "employer@example.com"}</div>
                  <div style={styles.profileRole}>
                    {companyName || "Employer"}
                  </div>
                  {logoUrl && (
                    <div style={styles.profileLogoInfo}>
                      <FaImage size={14} style={{ marginRight: '6px' }} />
                      Logo uploaded
                    </div>
                  )}
                </div>
                <div style={styles.profileDivider} />
                <div style={styles.profileDetails}>
                  <div style={styles.profileDetailItem}>
                    <span style={styles.profileDetailLabel}>Member Since</span>
                    <span style={styles.profileDetailValue}>
                      {employeeData?.createdAt ? 
                        new Date(employeeData.createdAt).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        }) : 
                        'January 2025'
                      }
                    </span>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <span style={styles.profileDetailLabel}>Company</span>
                    <span style={styles.profileDetailValue}>
                      {companyName || 'Not specified'}
                    </span>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <span style={styles.profileDetailLabel}>Total Jobs Posted</span>
                    <span style={styles.profileDetailValue}>{stats.totalJobs}</span>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <span style={styles.profileDetailLabel}>Total Hires</span>
                    <span style={styles.profileDetailValue}>{stats.hiredCandidates}</span>
                  </div>
                </div>
              </div>
              <button style={styles.modalCloseBtnBottom} onClick={() => setShowProfileModal(false)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.modalOverlay}
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  <FaCog size={20} style={{ marginRight: '12px', color: '#f9c349' }} />
                  Settings
                </h2>
                <button style={styles.modalCloseBtn} onClick={() => setShowSettingsModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div style={styles.settingsContent}>
                <div style={styles.settingsGroup}>
                  <h3 style={styles.settingsGroupTitle}>Account Settings</h3>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}><FaUser /></div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Profile Information</div>
                      <div style={styles.settingsItemDesc}>Update your personal information</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Edit</button>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}><FaBuilding /></div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Company Details</div>
                      <div style={styles.settingsItemDesc}>
                        {companyName || 'Update company information'}
                      </div>
                    </div>
                    <button style={styles.settingsItemBtn}>Update</button>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}><FaEnvelope /></div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Email Preferences</div>
                      <div style={styles.settingsItemDesc}>Manage notification settings</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Configure</button>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}><FaLock /></div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Security</div>
                      <div style={styles.settingsItemDesc}>Change password and security settings</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Update</button>
                  </div>
                </div>
                <div style={styles.settingsGroup}>
                  <h3 style={styles.settingsGroupTitle}>Preferences</h3>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}><FaGlobe /></div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Language</div>
                      <div style={styles.settingsItemDesc}>Choose your preferred language</div>
                    </div>
                    <select style={styles.settingsSelect}>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}><FaShieldAlt /></div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Privacy</div>
                      <div style={styles.settingsItemDesc}>Control your privacy settings</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Manage</button>
                  </div>
                </div>
              </div>
              <button style={styles.modalCloseBtnBottom} onClick={() => setShowSettingsModal(false)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .spin {
            animation: spin 1s linear infinite;
          }

          .mobileMenuBtn {
            display: none;
            position: fixed;
            top: 12px;
            left: 12px;
            z-index: 999;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            color: #0f172a;
            font-size: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.06);
            transition: all 0.3s ease;
          }
          .mobileMenuBtn:hover {
            background: #f8fafc;
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
          }

          .nav-link {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin: 2px 0;
            position: relative;
            border-radius: 10px;
          }
          .nav-link:hover {
            background-color: rgba(255,255,255,0.05) !important;
            transform: translateX(5px);
          }

          .stat-card {
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, transparent, #f9c349, transparent);
            transition: left 0.5s ease;
          }
          .stat-card:hover::before {
            left: 100%;
          }
          .stat-card:hover {
            transform: translateY(-5px) scale(1.01);
            box-shadow: 0 12px 40px rgba(0,0,0,0.08);
            border-color: #f9c349;
          }
          .stat-card:nth-child(1) { animation-delay: 0.05s; }
          .stat-card:nth-child(2) { animation-delay: 0.1s; }
          .stat-card:nth-child(3) { animation-delay: 0.15s; }
          .stat-card:nth-child(4) { animation-delay: 0.2s; }
          .stat-card:nth-child(5) { animation-delay: 0.25s; }
          .stat-card:nth-child(6) { animation-delay: 0.3s; }
          .stat-card:nth-child(7) { animation-delay: 0.35s; }
          .stat-card:nth-child(8) { animation-delay: 0.4s; }

          .section-card {
            animation: fadeInUp 0.6s ease forwards;
            opacity: 0;
            animation-delay: 0.35s;
            transition: all 0.3s ease;
          }
          .section-card:hover {
            box-shadow: 0 8px 30px rgba(0,0,0,0.05);
          }

          .quick-action {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .quick-action::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(249, 195, 73, 0.08), transparent);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .quick-action:hover::after {
            opacity: 1;
          }
          .quick-action:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 12px 40px rgba(249, 195, 73, 0.2);
            border-color: #f9c349;
          }

          .user-info-clickable {
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 12px;
          }
          .user-info-clickable:hover {
            background: rgba(255,255,255,0.05);
          }

          .join-btn {
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          .join-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transform: translateX(-100%);
            transition: transform 0.5s ease;
          }
          .join-btn:hover::before {
            transform: translateX(100%);
          }
          .join-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(249, 195, 73, 0.3);
          }

          .view-all-btn {
            transition: all 0.3s ease;
            position: relative;
          }
          .view-all-btn:hover {
            color: #e08500;
            transform: translateX(3px);
          }

          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #f9c349;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #e8a800;
          }

          .status-badge {
            animation: scaleIn 0.3s ease;
          }

          .welcome-banner {
            animation: fadeInUp 0.5s ease;
            background-size: 200% 200%;
            animation: gradientMove 10s ease infinite;
          }

          .notification-badge {
            animation: pulse 2s infinite;
          }

          .action-icon-wrapper {
            animation: float 3s ease-in-out infinite;
          }

          .user-dropdown {
            animation: slideDown 0.2s ease forwards;
          }

          .modal-content {
            animation: scaleIn 0.3s ease;
          }

          .settings-item:hover {
            background: #f1f5f9;
            transform: translateX(4px);
          }

          .profile-avatar-img {
            transition: all 0.3s ease;
          }
          .profile-avatar-img:hover {
            transform: scale(1.05) rotate(-5deg);
          }

          .application-item, .interview-item {
            transition: all 0.3s ease;
          }
          .application-item:hover, .interview-item:hover {
            background: #f8fafc;
            transform: translateX(4px);
          }

          .error-banner {
            animation: fadeInUp 0.4s ease;
          }

          /* Mobile Responsive */
          @media (max-width: 768px) {
            .mobileMenuBtn {
              display: flex !important;
            }
            .stat-card {
              animation: fadeInUp 0.5s ease forwards !important;
            }
            .stat-card:nth-child(5) { animation-delay: 0.25s; }
            .stat-card:nth-child(6) { animation-delay: 0.3s; }
            .stat-card:nth-child(7) { animation-delay: 0.35s; }
            .stat-card:nth-child(8) { animation-delay: 0.4s; }
            
            .columnLayout {
              grid-template-columns: 1fr !important;
            }
            .contentWrapper {
              padding: 12px !important;
              border-radius: 12px !important;
            }
            .modernHeader {
              margin-bottom: 16px !important;
              padding-bottom: 12px !important;
            }
            .headerTitle {
              font-size: 20px !important;
            }
            .headerDescription {
              font-size: 12px !important;
            }
            .sectionTitle {
              font-size: 14px !important;
            }
            .sectionSubtitle {
              font-size: 11px !important;
            }
            .applicationItem {
              padding: 10px 14px !important;
              flex-wrap: wrap !important;
            }
            .applicantDetails {
              flex-wrap: wrap !important;
              gap: 6px !important;
            }
            .applicationStatus {
              text-align: left !important;
              width: 100% !important;
              margin-top: 4px !important;
            }
            .interviewItem {
              padding: 10px 14px !important;
              flex-wrap: wrap !important;
            }
            .interviewDate {
              min-width: 40px !important;
            }
            .dateDay {
              font-size: 18px !important;
            }
            .actionsGrid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 10px !important;
            }
            .actionBtn {
              padding: 14px !important;
              font-size: 12px !important;
            }
            .actionIconWrapper {
              width: 38px !important;
              height: 38px !important;
            }
            .actionIconWrapper svg {
              font-size: 18px !important;
            }
            .modalContent {
              max-width: 98% !important;
              border-radius: 14px !important;
            }
            .profileContent {
              padding: 20px !important;
            }
            .profileDetails {
              grid-template-columns: 1fr 1fr !important;
              gap: 10px !important;
            }
            .profileDetailItem {
              padding: 8px !important;
            }
            .profileDetailValue {
              font-size: 13px !important;
            }
            .settingsContent {
              padding: 16px !important;
            }
            .settingsItem {
              padding: 10px 12px !important;
              flex-wrap: wrap !important;
            }
            .settingsItemBtn {
              width: 100% !important;
              margin-top: 4px !important;
            }
            .settingsSelect {
              width: 100% !important;
              margin-top: 4px !important;
            }
            .statValue {
              font-size: 18px !important;
            }
            .statIconWrapper {
              width: 40px !important;
              height: 40px !important;
            }
            .statIcon {
              font-size: 16px !important;
            }
            .statCard {
              padding: 14px !important;
              gap: 10px !important;
            }
            .statLabel {
              font-size: 11px !important;
            }
            .statTrend {
              font-size: 10px !important;
            }
          }

          @media (max-width: 480px) {
            .mobileMenuBtn {
              top: 10px;
              width: 38px;
              height: 38px;
              font-size: 16px;
            }
            .contentWrapper {
              padding: 10px !important;
              border-radius: 10px !important;
            }
            .headerTitle {
              font-size: 18px !important;
            }
            .actionsGrid {
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
            }
            .actionBtn {
              padding: 10px !important;
              font-size: 11px !important;
            }
            .actionIconWrapper {
              width: 32px !important;
              height: 32px !important;
            }
            .actionIconWrapper svg {
              font-size: 14px !important;
            }
            .profileDetails {
              grid-template-columns: 1fr !important;
            }
            .applicantDetails span {
              font-size: 10px !important;
            }
            .statusBadge {
              font-size: 10px !important;
              padding: 2px 8px !important;
            }
            .modalTitle {
              font-size: 16px !important;
            }
            .profileName {
              font-size: 18px !important;
            }
            .profileEmail {
              font-size: 12px !important;
            }
            .profileRole {
              font-size: 12px !important;
            }
            .statValue {
              font-size: 16px !important;
            }
            .statIconWrapper {
              width: 34px !important;
              height: 34px !important;
            }
            .statIcon {
              font-size: 14px !important;
            }
            .statCard {
              padding: 10px !important;
              gap: 8px !important;
            }
            .statLabel {
              font-size: 10px !important;
            }
            .statTrend {
              font-size: 9px !important;
            }
          }

          @media (min-width: 769px) and (max-width: 1024px) {
            .stat-card {
              animation: fadeInUp 0.5s ease forwards !important;
            }
            .stat-card:nth-child(5) { animation-delay: 0.25s; }
            .stat-card:nth-child(6) { animation-delay: 0.3s; }
            .stat-card:nth-child(7) { animation-delay: 0.35s; }
            .stat-card:nth-child(8) { animation-delay: 0.4s; }
            
            .columnLayout {
              grid-template-columns: 1fr !important;
            }
            .actionsGrid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }

          @media (min-width: 1025px) {
            .columnLayout {
              grid-template-columns: 1fr !important;
              max-width: 800px !important;
              margin: 0 auto !important;
            }
          }

          @media (min-width: 1200px) {
            .columnLayout {
              grid-template-columns: 1fr !important;
              max-width: 800px !important;
              margin: 0 auto !important;
            }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  mobileOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 99,
  },
  mobileMenuBtn: {
    display: "none",
    position: "fixed",
    top: "12px",
    left: "12px",
    zIndex: 999,
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    background: "#ffffff",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    color: "#0f172a",
    fontSize: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    transition: "all 0.3s ease",
  },
  sidebar: {
    background: "linear-gradient(180deg, #0f172a 0%, #1a2332 50%, #0f172a 100%)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    boxShadow: "4px 0 30px rgba(0,0,0,0.15)",
    position: "relative",
    overflow: "hidden",
    transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    flexShrink: 0,
    borderRight: "1px solid rgba(255,255,255,0.05)",
    height: "100vh",
    zIndex: 100,
  },
  sidebarGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(ellipse at 50% 0%, rgba(249, 195, 73, 0.03) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  brandSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "36px",
    padding: "0 8px",
    position: "relative",
    zIndex: 1,
  },
  brandText: {
    flex: 1,
  },
  logoBadge: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    boxShadow: "0 8px 25px rgba(249, 195, 73, 0.25)",
    overflow: "hidden",
    flexShrink: 0,
  },
  sidebarLogo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  logoIcon: {
    transform: "rotate(-5deg)",
  },
  logoText: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    color: "#fff",
  },
  logoHighlight: {
    color: "#f9c349",
  },
  navGroup: {
    flex: 1,
    position: "relative",
    zIndex: 1,
    overflowY: "auto",
  },
  navGroupLabel: {
    fontSize: "10px",
    opacity: 0.3,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "0 16px",
    marginBottom: "12px",
  },
  navItem: {
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "4px",
    transition: "all 0.3s ease",
    position: "relative",
  },
  icon: {
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    width: "22px",
    transition: "all 0.3s ease",
  },
  navText: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  navLabel: {
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  navDesc: {
    fontSize: "10px",
    opacity: 0.4,
    marginTop: "1px",
  },
  activeIndicator: {
    width: "6px",
    height: "6px",
    background: "#f9c349",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    position: "relative",
    zIndex: 1,
  },
  userSection: {
    position: "relative",
    marginBottom: "12px",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px",
    borderRadius: "12px",
    transition: "all 0.3s ease",
  },
  userInfoText: {
    flex: 1,
    minWidth: 0,
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
    color: "#0f172a",
    flexShrink: 0,
    overflow: "hidden",
  },
  userAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  userRole: {
    fontSize: "11px",
    opacity: 0.5,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  userChevron: {
    fontSize: "12px",
    color: "#94a3b8",
    transition: "transform 0.3s ease",
  },
  userDropdown: {
    position: "absolute",
    bottom: "calc(100% + 10px)",
    left: "0",
    right: "0",
    background: "#1e293b",
    borderRadius: "12px",
    padding: "8px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
    zIndex: 100,
    border: "1px solid rgba(255,255,255,0.05)",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#e2e8f0",
    fontSize: "14px",
    fontWeight: "500",
  },
  dropdownDivider: {
    height: "1px",
    background: "rgba(255,255,255,0.06)",
    margin: "4px 0",
  },
  dropdownLogout: {
    color: "#ef4444",
  },
  mainContent: {
    flex: 1,
    padding: "12px",
    overflow: "hidden",
    paddingBottom: 50,
  },
  contentWrapper: {
    height: "100%",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    padding: "28px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  modernHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "28px",
    paddingBottom: "20px",
    borderBottom: "1px solid #f1f5f9",
    flexShrink: 0,
  },
  headerLeft: {
    flex: 1,
  },
  headerBreadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  breadcrumbHome: {
    display: "flex",
    alignItems: "center",
  },
  breadcrumbSeparator: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  breadcrumbCurrent: {
    color: "#f9c349",
    fontSize: "13px",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  headerDescription: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  dashboardContainer: {
    flex: 1,
  },
  welcomeBanner: {
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    padding: "20px 24px",
    borderRadius: "16px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  welcomeContent: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  welcomeAvatarWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid rgba(255,255,255,0.3)",
    flexShrink: 0,
  },
  welcomeAvatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  welcomeAvatarFallback: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "20px",
    color: "#fff",
  },
  welcomeText: {
    color: "#fff",
  },
  welcomeTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
  },
  welcomeSubtitle: {
    fontSize: "13px",
    opacity: 0.8,
    margin: "2px 0 0 0",
  },
  welcomeBtn: {
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    padding: "8px 18px",
    borderRadius: "10px",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
  },
  statsGrid: {
    display: "grid",
    gap: "16px",
    marginBottom: "16px",
  },
  statCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  statIconWrapper: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statIcon: {
    fontSize: "22px",
    color: "#3b82f6",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: "26px",
    fontWeight: "800",
    margin: 0,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    margin: "2px 0",
  },
  statTrend: {
    fontSize: "11px",
    color: "#10b981",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  trendUp: {
    color: "#10b981",
    fontWeight: "700",
  },
  columnLayout: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "24px",
    marginBottom: "10px",
    maxWidth: "800px",
    margin: "0 auto 28px auto",
    width: "100%",
  },
  sectionCard: {
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    transition: "all 0.3s ease",
  },
  sectionHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  sectionSubtitle: {
    fontSize: "12px",
    color: "#94a3b8",
    margin: "2px 0 0 0",
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    color: "#f9c349",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  applicationsList: {
    maxHeight: "380px",
    overflowY: "auto",
  },
  applicationItem: {
    padding: "14px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    transition: "all 0.3s ease",
  },
  applicantAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
    color: "#fff",
    flexShrink: 0,
  },
  applicantInfo: {
    flex: 1,
    minWidth: 0,
  },
  applicantName: {
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "2px",
    fontSize: "14px",
  },
  applicantDetails: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "2px",
    flexWrap: "wrap",
  },
  jobTitle: {
    fontSize: "12px",
    color: "#f9c349",
    fontWeight: "500",
  },
  applicationStatus: {
    textAlign: "right",
    flexShrink: 0,
  },
  statusBadge: {
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
    marginBottom: "4px",
    color: "#fff",
  },
  appliedDate: {
    fontSize: "10px",
    color: "#94a3b8",
    display: "block",
  },
  interviewsList: {
    maxHeight: "380px",
    overflowY: "auto",
  },
  interviewItem: {
    padding: "14px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    transition: "all 0.3s ease",
  },
  interviewDate: {
    textAlign: "center",
    minWidth: "54px",
  },
  dateDay: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#f9c349",
  },
  dateMonth: {
    fontSize: "10px",
    color: "#64748b",
    textTransform: "uppercase",
  },
  interviewInfo: {
    flex: 1,
    minWidth: 0,
  },
  candidateName: {
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "2px",
    fontSize: "14px",
  },
  interviewJob: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "2px",
  },
  interviewTime: {
    fontSize: "11px",
    color: "#10b981",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  joinBtn: {
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    border: "none",
    padding: "6px 14px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.3s ease",
    flexShrink: 0,
  },
  quickActions: {
    marginTop: "8px",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginTop: "16px",
  },
  actionBtn: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: "20px",
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
  },
  actionIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#94a3b8",
  },
  errorBanner: {
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "16px",
  },
  errorIcon: {
    fontSize: "18px",
  },
  errorText: {
    flex: 1,
    fontSize: "13px",
    color: "#dc2626",
  },
  errorRetryBtn: {
    padding: "6px 16px",
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.2s ease",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "16px",
  },
  loadingSpinner: {
    fontSize: "48px",
    color: "#f9c349",
  },
  loadingText: {
    fontSize: "16px",
    color: "#64748b",
  },
  loadingBar: {
    width: "200px",
    height: "4px",
    background: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
  },
  loadingProgress: {
    height: "100%",
    background: "#f9c349",
    borderRadius: "4px",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: "24px",
    maxWidth: "600px",
    width: "95%",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    padding: "24px 32px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#f8fafc",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
  },
  modalCloseBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontSize: "18px",
  },
  modalCloseBtnBottom: {
    padding: "14px 32px",
    background: "#f1f5f9",
    border: "none",
    color: "#475569",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    width: "100%",
    transition: "all 0.3s ease",
    borderTop: "1px solid #e5e7eb",
  },
  profileContent: {
    padding: "32px",
    textAlign: "center",
  },
  profileAvatarContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "16px",
  },
  profileAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    fontWeight: "700",
    color: "#fff",
  },
  profileAvatarImg: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #f9c349",
  },
  profileInfo: {
    textAlign: "center",
  },
  profileName: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
  },
  profileEmail: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px",
  },
  profileRole: {
    fontSize: "13px",
    color: "#f9c349",
    fontWeight: "600",
    marginTop: "4px",
  },
  profileLogoInfo: {
    fontSize: "12px",
    color: "#10b981",
    marginTop: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  profileDivider: {
    height: "1px",
    background: "#e5e7eb",
    margin: "24px 0",
  },
  profileDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    textAlign: "left",
  },
  profileDetailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  profileDetailLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  profileDetailValue: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
  },
  settingsContent: {
    padding: "32px",
    maxHeight: "500px",
    overflowY: "auto",
  },
  settingsGroup: {
    marginBottom: "24px",
  },
  settingsGroupTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "12px",
  },
  settingsItem: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 16px",
    background: "#f8fafc",
    borderRadius: "12px",
    marginBottom: "8px",
    transition: "all 0.3s ease",
  },
  settingsItemIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#3b82f6",
    fontSize: "16px",
    flexShrink: 0,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  settingsItemDesc: {
    fontSize: "12px",
    color: "#64748b",
  },
  settingsItemBtn: {
    padding: "6px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#f9c349",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.3s ease",
  },
  settingsSelect: {
    padding: "6px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "12px",
    background: "#fff",
    cursor: "pointer",
  },
};

export default CompanyDashboard;