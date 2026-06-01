import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AdminJobsManager from "./AdminJobsManager";
import CandidatesManager from "./CandidateManager";
import InterviewsManager from "./InterviewsManager";
import ReportsManager from "./ReportsManager";

// Icons
import {
  FaBriefcase, FaUsers, FaCalendarCheck, FaChartBar, FaHome,
  FaSignOutAlt, FaFileAlt, FaUserTie, FaCheckCircle, FaClock,
  FaEye, FaPlus, FaDownload, FaUserPlus, FaSpinner, FaSync,
  FaEnvelope, FaPhone, FaSearch, FaFilter, FaStar, FaTrash, FaEdit
} from "react-icons/fa";

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
    hiredCandidates: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [upcomingInterviewsList, setUpcomingInterviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  const fetchAllData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardStats(),
      fetchRecentApplications(),
      fetchUpcomingInterviews()
    ]);
    setRefreshing(false);
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Stats data:", res.data);
      setStats({
        totalJobs: res.data.totalJobs || 0,
        activeJobs: res.data.activeJobs || 0,
        totalApplications: res.data.totalApplications || 0,
        pendingApplications: res.data.pendingApplications || 0,
        shortlistedCandidates: res.data.shortlistedApplications || 0,
        totalInterviews: res.data.totalInterviews || 0,
        upcomingInterviews: res.data.upcomingInterviews || 0,
        hiredCandidates: res.data.hiredApplications || 0
      });
    } catch (err) {
      console.error("Error fetching dashboard stats", err);
    }
  };

  const fetchRecentApplications = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs/candidates/all?limit=5", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentApplications(res.data || []);
    } catch (err) {
      console.error("Error fetching recent applications", err);
      setRecentApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingInterviews = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs/interviews/upcoming", {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Upcoming interviews:", res.data);
      setUpcomingInterviewsList(res.data || []);
    } catch (err) {
      console.error("Error fetching upcoming interviews", err);
      setUpcomingInterviewsList([]);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaHome />, description: "Overview & Analytics" },
    { id: "jobs", label: "Jobs", icon: <FaBriefcase />, description: "Manage Job Postings" },
    { id: "candidates", label: "Candidates", icon: <FaUsers />, description: "Review Applications" },
    { id: "interviews", label: "Interviews", icon: <FaCalendarCheck />, description: "Schedule & Track" },
    { id: "reports", label: "Reports", icon: <FaChartBar />, description: "Analytics & Reports" }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case "pending": return "#f59e0b";
      case "reviewed": return "#3b82f6";
      case "shortlisted": return "#10b981";
      case "interview": return "#8b5cf6";
      case "rejected": return "#ef4444";
      case "hired": return "#059669";
      default: return "#6b7280";
    }
  };

  const renderDashboard = () => (
    <div style={styles.dashboardContainer}>
     
      <div style={styles.welcomeBanner}>
        <div>
          <h2 style={styles.welcomeTitle}>Welcome back, {user?.name || "Employer"}! 👋</h2>
          <p style={styles.welcomeText}>Here's what's happening with your job postings today.</p>
        </div>
        <button style={styles.postJobBtn} onClick={() => setActiveTab("jobs")}>
          <FaPlus /> Post New Job
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#eff6ff", color: "#3b82f6" }}><FaBriefcase /></div>
          <div>
            <h3 style={styles.statValue}>{stats.totalJobs}</h3>
            <p style={styles.statLabel}>Total Jobs</p>
            <span style={styles.statTrend}>+{stats.activeJobs} active</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#f0fdf4", color: "#10b981" }}><FaFileAlt /></div>
          <div>
            <h3 style={styles.statValue}>{stats.totalApplications}</h3>
            <p style={styles.statLabel}>Applications</p>
            <span style={styles.statTrend}>{stats.pendingApplications} pending</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#f59e0b" }}><FaUserTie /></div>
          <div>
            <h3 style={styles.statValue}>{stats.shortlistedCandidates}</h3>
            <p style={styles.statLabel}>Shortlisted</p>
            <span style={styles.statTrend}>Ready for interview</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#f3e8ff", color: "#8b5cf6" }}><FaCalendarCheck /></div>
          <div>
            <h3 style={styles.statValue}>{stats.upcomingInterviews}</h3>
            <p style={styles.statLabel}>Upcoming Interviews</p>
            <span style={styles.statTrend}>Total: {stats.totalInterviews} scheduled</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#dcfce7", color: "#059669" }}><FaCheckCircle /></div>
          <div>
            <h3 style={styles.statValue}>{stats.hiredCandidates}</h3>
            <p style={styles.statLabel}>Hired</p>
            <span style={styles.statTrend}>Successfully placed</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: "#ffe4e6", color: "#e11d48" }}><FaEye /></div>
          <div>
            <h3 style={styles.statValue}>245</h3>
            <p style={styles.statLabel}>Total Views</p>
            <span style={styles.statTrend}>Last 30 days</span>
          </div>
        </div>
      </div>

      <div style={styles.twoColumnGrid}>
        {/* Recent Applications */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h3>Recent Applications</h3>
            <button style={styles.viewAllBtn} onClick={() => setActiveTab("candidates")}>View All →</button>
          </div>
          <div style={styles.applicationsList}>
            {recentApplications.length === 0 ? (
              <div style={styles.emptyState}><FaFileAlt size={40} color="#cbd5e1" /><p>No applications yet</p></div>
            ) : (
              recentApplications.map((app) => (
                <div key={app._id} style={styles.applicationItem}>
                  <div style={styles.applicantAvatar}>{app.fullName?.charAt(0) || "A"}</div>
                  <div style={styles.applicantInfo}>
                    <div style={styles.applicantName}>{app.fullName}</div>
                    <div style={styles.applicantDetails}>
                      <span><FaEnvelope size={10} /> {app.email}</span>
                      <span><FaPhone size={10} /> {app.phone}</span>
                    </div>
                    <div style={styles.jobTitle}>{app.jobId?.title}</div>
                  </div>
                  <div style={styles.applicationStatus}>
                    <span style={{ ...styles.statusBadge, background: getStatusColor(app.status), color: "#fff" }}>{app.status}</span>
                    <span style={styles.appliedDate}>{new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <h3>Upcoming Interviews</h3>
            <button style={styles.viewAllBtn} onClick={() => setActiveTab("interviews")}>Schedule →</button>
          </div>
          <div style={styles.interviewsList}>
            {upcomingInterviewsList.length === 0 ? (
              <div style={styles.emptyState}>
                <FaCalendarCheck size={40} color="#cbd5e1" />
                <p>No interviews scheduled</p>
                <small style={{ fontSize: "11px", marginTop: "8px" }}>Schedule interviews from the Interviews tab</small>
              </div>
            ) : (
              upcomingInterviewsList.map((interview) => (
                <div key={interview._id} style={styles.interviewItem}>
                  <div style={styles.interviewDate}>
                    <div style={styles.dateDay}>{new Date(interview.interviewDate).getDate()}</div>
                    <div style={styles.dateMonth}>{new Date(interview.interviewDate).toLocaleString('default', { month: 'short' })}</div>
                  </div>
                  <div style={styles.interviewInfo}>
                    <div style={styles.candidateName}>{interview.fullName}</div>
                    <div style={styles.interviewJob}>{interview.jobId?.title}</div>
                    <div style={styles.interviewTime}><FaClock size={12} /> {new Date(interview.interviewDate).toLocaleTimeString()}</div>
                  </div>
                  <button style={styles.joinBtn} onClick={() => window.open(interview.meetingLink || "#", "_blank")}>Join</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <button style={styles.actionBtn} onClick={() => setActiveTab("jobs")}><FaPlus size={20} /><span>Post a Job</span></button>
          <button style={styles.actionBtn} onClick={() => setActiveTab("candidates")}><FaUserPlus size={20} /><span>Review Candidates</span></button>
          <button style={styles.actionBtn} onClick={() => setActiveTab("interviews")}><FaCalendarCheck size={20} /><span>Schedule Interview</span></button>
          <button style={styles.actionBtn} onClick={() => setActiveTab("reports")}><FaDownload size={20} /><span>Download Report</span></button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case "dashboard": return renderDashboard();
      case "jobs": return <AdminJobsManager userRole={user?.role} userName={user?.name} />;
      case "candidates": return <CandidatesManager token={token} />;
      case "interviews": return <InterviewsManager token={token} />;
      case "reports": return <ReportsManager token={token} stats={stats} />;
      default: return renderDashboard();
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar - Similar style to TravelDashboard */}
      <nav style={styles.sidebar}>
        <div style={styles.brandSection}>
          <div style={styles.logoBadge}>tdc<span style={{color:'#ff961a'}}>.</span></div>
          <h2 style={styles.logoText}>Job <span style={{fontWeight: '300'}}>Portal</span></h2>
        </div>

        <div style={styles.navGroup}>
          {navItems.map((item) => (
            <div
              key={item.id}
              className="nav-link"
              style={{
                ...styles.navItem,
                backgroundColor: activeTab === item.id ? "rgba(255,255,255,0.2)" : "transparent",
                boxShadow: activeTab === item.id ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                color: "#fff",
                fontWeight: activeTab === item.id ? "600" : "400",
              }}
              onClick={() => setActiveTab(item.id)}
            >
              <span style={styles.icon}>{item.icon}</span>
              <div style={styles.navText}>
                <span style={styles.navLabel}>{item.label}</span>
                <span style={styles.navDesc}>{item.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              {user?.name?.charAt(0) || "E"}
            </div>
            <div>
              <div style={styles.userName}>{user?.name || "Employer"}</div>
              <div style={styles.userRole}>{user?.role || "Employer"}</div>
            </div>
          </div>
          <div style={styles.logoutBtn} onClick={handleLogout} className="logout-hover">
            <FaSignOutAlt />
            <span>Logout</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {renderContent()}
        </div>
      </main>

      <style>
        {`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          
          .nav-link {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin: 4px 0;
          }
          .nav-link:hover {
            background-color: rgba(255,255,255,0.1) !important;
            transform: translateX(5px);
          }
          
          .stat-card, .section-card {
            animation: fadeInUp 0.5s ease forwards;
            opacity: 0;
          }
          .stat-card:nth-child(1) { animation-delay: 0.05s; }
          .stat-card:nth-child(2) { animation-delay: 0.1s; }
          .stat-card:nth-child(3) { animation-delay: 0.15s; }
          .stat-card:nth-child(4) { animation-delay: 0.2s; }
          .stat-card:nth-child(5) { animation-delay: 0.25s; }
          .stat-card:nth-child(6) { animation-delay: 0.3s; }
          
          .section-card {
            animation-delay: 0.35s;
          }
          
          .quick-action {
            transition: all 0.3s ease;
          }
          .quick-action:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }
          
          .logout-hover:hover {
            background: rgba(255,255,255,0.1);
            color: #fff;
          }
          
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #ff961a;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #e08500;
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
    backgroundColor: "#f8fafc", 
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: "hidden" 
  },
  sidebar: {
    width: "230px", 
    backgroundImage: "linear-gradient(195deg, #f3b245 0%, #ff961a 100%)",
    padding: "32px 20px",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    borderRadius: "30px",
    margin: "15px",
    boxShadow: "4px 0 20px rgba(0,0,0,0.08)"

  },
  brandSection: { 
    display: "flex", 
    alignItems: "center", 
    gap: "12px", 
    marginBottom: "48px", 
    paddingLeft: "12px" 
  },
  logoBadge: { 
    backgroundColor: "#1a1a1a", 
    width: "40px", 
    height: "40px", 
    borderRadius: "14px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontWeight: "800", 
    fontSize: "16px",
    color: "#fff"
  },
  logoText: { 
    margin: 0, 
    fontSize: "22px", 
    fontWeight: "700", 
    letterSpacing: "-0.5px" 
  },
  navGroup: { 
    flex: 1 
  },
  navItem: { 
    padding: "12px 16px", 
    borderRadius: "14px", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    gap: "14px",
    marginBottom: "8px",
    transition: "all 0.3s ease"
  },
  icon: { 
    fontSize: "20px", 
    display: "flex", 
    alignItems: "center",
    width: "24px"
  },
  navText: {
    display: "flex",
    flexDirection: "column",
    flex: 1
  },
  navLabel: { 
    fontSize: "14px", 
    fontWeight: "500" 
  },
  navDesc: {
    fontSize: "11px",
    opacity: 0.7,
    marginTop: "2px"
  },
  userSection: {
    marginTop: "auto",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.2)"
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px"
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#1a1a1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px"
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600"
  },
  userRole: {
    fontSize: "11px",
    opacity: 0.7
  },
  logoutBtn: { 
    padding: "10px 16px", 
    borderRadius: "12px", 
    display: "flex", 
    alignItems: "center", 
    gap: "12px",
    cursor: "pointer", 
    transition: "0.3s",
    fontSize: "14px"
  },
  mainContent: { 
    flex: 1, 
    padding: "14px", 
    overflow: "hidden" ,
    paddingBottom:50
  },
  contentWrapper: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: "32px", 
    boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
    padding: "25px",
    overflowY: "auto",
  },
  dashboardContainer: { 
    animation: "fadeInUp 0.5s ease" 
  },
 
 
  welcomeBanner: {
    background: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
    borderRadius: "24px",
    padding: "32px 40px",
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#fff"
  },
  welcomeTitle: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "8px"
  },
  welcomeText: {
    opacity: 0.9,
    fontSize: "14px"
  },
  postJobBtn: {
    background: "#fff",
    color: "#ff961a",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "32px"
  },
  statCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease"
  },
  statIcon: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px"
  },
  statValue: {
    fontSize: "28px",
    fontWeight: "800",
    margin: 0,
    color: "#1e293b"
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0"
  },
  statTrend: {
    fontSize: "11px",
    color: "#10b981"
  },
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "32px"
  },
  sectionCard: {
    background: "#fff",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    overflow: "hidden"
  },
  sectionHeader: {
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    color: "#ff961a",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500"
  },
  applicationsList: {
    maxHeight: "400px",
    overflowY: "auto"
  },
  applicationItem: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  applicantAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px",
    color: "#ff961a"
  },
  applicantInfo: {
    flex: 1
  },
  applicantName: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px"
  },
  applicantDetails: {
    display: "flex",
    gap: "12px",
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "4px"
  },
  jobTitle: {
    fontSize: "12px",
    color: "#ff961a"
  },
  applicationStatus: {
    textAlign: "right"
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    display: "inline-block",
    marginBottom: "6px"
  },
  appliedDate: {
    fontSize: "10px",
    color: "#94a3b8",
    display: "block"
  },
  interviewsList: {
    maxHeight: "400px",
    overflowY: "auto"
  },
  interviewItem: {
    padding: "16px 20px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },
  interviewDate: {
    textAlign: "center",
    minWidth: "60px"
  },
  dateDay: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#ff961a"
  },
  dateMonth: {
    fontSize: "11px",
    color: "#64748b"
  },
  interviewInfo: {
    flex: 1
  },
  candidateName: {
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "4px"
  },
  interviewJob: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "4px"
  },
  interviewTime: {
    fontSize: "11px",
    color: "#10b981"
  },
  joinBtn: {
    background: "#eff6ff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    color: "#3b82f6",
    fontWeight: "500",
    cursor: "pointer",
    fontSize: "12px"
  },
  quickActions: {
    marginTop: "8px"
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "16px"
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
    color: "#1e293b"
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8"
  }
};

export default CompanyDashboard;