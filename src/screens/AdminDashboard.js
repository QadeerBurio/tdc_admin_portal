import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { 
  LayoutDashboard, PlusCircle, Tag, Briefcase, 
  Repeat, Building2, GraduationCap, LogOut,
  ChevronRight, Globe, Plane, Loader2, CreditCard,
  ShoppingCart, BookOpen, Sparkles, TrendingUp,
  Users, Award, Calendar, Bell, Settings, HelpCircle
} from "lucide-react";

// Sub-Components
import CreateOfferAdmin from "./CreateOfferAdmin";
import AdminOffers from "./AdminOffers";
import AdminUserList from "./AdminUserList";
import AdminJobManager from "./AdminJobsManager"; 
import ManageExchange from "./ManageExchange";
import AdminPackageScreen from "./Traveling";
import CardManager from "./CardManager";
import AdminPackage from "./AdminPackage";
import AdminCoursePortal from "./AdminCourse";

export default function AdminDashboard() {
  const { user, token, loading, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [activePage, setActivePage] = useState("dashboard");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [greeting, setGreeting] = useState("");

  // Stats State
  const [stats, setStats] = useState({
    offers: 0,
    jobs: 0,
    students: 0,
    brands: 0,
    exchange: 0,
    packages: 0,
    pendingCards: 0,
    approvedCards: 0,
    bookings: 0,
    courses: 0
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const API_BASE = "http://localhost:5000/api/admin";

      const endpoints = [
        `${API_BASE}/all`,
        `${API_BASE}/jobs/all`,
        `${API_BASE}/users/student`,
        `${API_BASE}/users/brand`,
        `${API_BASE}/exchange/all`,
        `${API_BASE}/packages/all`,
        `${API_BASE}/card-stats`,
        `${API_BASE}/bookings/stats`,
        `${API_BASE}/courses`
      ];

      const responses = await Promise.all(
        endpoints.map(url => 
          fetch(url, { headers })
            .then(res => res.ok ? res.json() : [])
            .catch(() => [])
        )
      );

      setStats({
        offers: Array.isArray(responses[0]) ? responses[0].length : 0,
        jobs: Array.isArray(responses[1]) ? responses[1].length : 0,
        students: Array.isArray(responses[2]) ? responses[2].length : 0,
        brands: Array.isArray(responses[3]) ? responses[3].length : 0,
        exchange: Array.isArray(responses[4]) ? responses[4].length : 0,
        packages: Array.isArray(responses[5]) ? responses[5].length : 0,
        pendingCards: responses[6]?.pending || 0,
        approvedCards: responses[6]?.approvedTotal || 0,
        bookings: responses[7]?.totalBookings || 0,
        courses: Array.isArray(responses[8]) ? responses[8].length : 0
      });
    } catch (err) {
      console.error("Dashboard Stats Sync Error:", err);
    } finally {
      setTimeout(() => setIsFetching(false), 500);
    }
  }, [token]);

  useEffect(() => {
    if (!loading && !token) {
      navigate("/login");
    } else if (token) {
      fetchDashboardStats();
    }
  }, [token, loading, navigate, fetchDashboardStats]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "offer", label: "Create Offer", icon: <PlusCircle size={20} /> },
    { id: "all offer", label: "Manage Offers", icon: <Tag size={20} /> },
    { id: "manage_jobs", label: "Career Portal", icon: <Briefcase size={20} /> },
    { id: "exchange_program", label: "Exchange", icon: <Repeat size={20} /> },
    { id: "traveling", label: "Traveling", icon: <Plane size={20} /> },
    { id: "brands", label: "All Brands", icon: <Building2 size={20} /> },
    { id: "students", label: "All Students", icon: <GraduationCap size={20} /> },
    { id: "admincourse", label: "LMS Courses", icon: <BookOpen size={20} /> },
  ];

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <div className="cards-grid" style={styles.cardGrid}>
            {[
              { id: "students", label: "Total Students", value: stats.students, icon: <GraduationCap size={22} />, trend: "+12% this month", color: "#6366f1", bg: "#eef2ff" },
              { id: "brands", label: "Active Brands", value: stats.brands, icon: <Building2 size={22} />, trend: "+5 new", color: "#10b981", bg: "#ecfdf5" },
              { id: "booking", label: "Total Bookings", value: stats.bookings, icon: <ShoppingCart size={22} />, trend: "This week", color: "#8b5cf6", bg: "#f5f3ff" },
              { id: "card_manager", label: "Approved Cards", value: stats.approvedCards, icon: <CreditCard size={22} />, trend: `${stats.pendingCards} pending`, color: "#f43f5e", bg: "#fff1f2" },
              { id: "all offer", label: "Total Offers", value: stats.offers, icon: <Tag size={22} />, trend: "Active deals", color: "#ff961a", bg: "#fff7ed" },
              { id: "manage_jobs", label: "Open Jobs", value: stats.jobs, icon: <Briefcase size={22} />, trend: "New positions", color: "#f59e0b", bg: "#fef3c7" },
              { id: "exchange_program", label: "Exchange Programs", value: stats.exchange, icon: <Globe size={22} />, trend: "Global study", color: "#ec4899", bg: "#fdf2f8" },
              { id: "traveling", label: "Travel Packages", value: stats.packages, icon: <Plane size={22} />, trend: "Adventure", color: "#3b82f6", bg: "#eff6ff" },
              { id: "admincourse", label: "LMS Courses", value: stats.courses, icon: <BookOpen size={22} />, trend: "Live classes", color: "#6366f1", bg: "#eef2ff" },
            ].map((item, index) => (
              <div 
                key={item.id} 
                className="stat-card"
                style={styles.statCard} 
                onClick={() => setActivePage(item.id)}
              >
                <div>
                  <p style={styles.cardLabel}>{item.label}</p>
                  <h3 style={styles.cardValue}>
                    {isFetching ? <div className="skeleton" style={styles.skeleton}></div> : item.value}
                  </h3>
                  <span style={{ ...styles.cardTrend, backgroundColor: item.bg, color: item.color }}>
                    <TrendingUp size={10} /> {item.trend}
                  </span>
                </div>
                <div style={{ ...styles.cardIconBox, backgroundColor: item.bg, color: item.color }}>
                  {item.icon}
                </div>
              </div>
            ))}
          </div>
        );
      
      case "booking": return <AdminPackage />;
      case "card_manager": return <CardManager />;
      case "offer": return <CreateOfferAdmin />;
      case "all offer": return <AdminOffers />;
      case "manage_jobs": return <AdminJobManager />;
      case "exchange_program": return <ManageExchange />;
      case "traveling": return <AdminPackageScreen />;
      case "brands": return <AdminUserList role="brand" title="Brand Management" />;
      case "students": return <AdminUserList role="student" title="Student Directory" />;
      case "admincourse": return <AdminCoursePortal />;
      default: return <div style={styles.placeholderSection}><h2>Section Under Construction</h2></div>;
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div className="spinner" style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      <aside className="sidebar" style={styles.sidebar}>
        <div>
          <div className="logo-container" style={styles.logoContainer}>
            <div style={styles.logoBadge}>tdc<span style={{color:'#ff961a', fontFamily:'sans-serif, cardo'}}>.</span></div>
            <h2 style={styles.logoText}>Admin <span style={{ fontWeight: 300 }}>Portal</span></h2>
          </div>
          <nav style={styles.menu}>
            {menuItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    ...styles.menuBtn,
                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.15)" : (hoveredItem === item.id ? "rgba(255, 255, 255, 0.08)" : "transparent"),
                  }}
                  onClick={() => setActivePage(item.id)}
                >
                  <span style={styles.btnIcon}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && <ChevronRight size={14} style={{ opacity: 0.7 }} />}
                </button>
              );
            })}
          </nav>
        </div>
        <div style={styles.sidebarFooter}>
          <button className="logout-btn" style={styles.logoutBtn} onClick={logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <header className="main-header" style={styles.header}>
          <div>
            <div style={styles.greetingBadge}>
              <Sparkles size={14} />
              <span>{greeting}!</span>
            </div>
            <h1 style={styles.greeting}>
              {activePage === "dashboard" ? "Welcome back" : activePage.replace(/_/g, ' ').toUpperCase()}
            </h1>
            <p style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={styles.headerActions}>
            <button className="icon-btn" style={styles.notifBtn}>
              <Bell size={18} />
            </button>
            <button className="icon-btn" style={styles.settingsBtn}>
              <Settings size={18} />
            </button>
            <div style={styles.userProfile}>
              <img 
                src={`https://ui-avatars.com/api/?name=${user?.name || "Admin"}&background=ff961a&color=fff&bold=true`} 
                alt="user"  
                style={styles.avatar}  
              />
              <div style={styles.userInfo}>
                <span style={styles.userName}>{user?.name || "Administrator"}</span>
                <span style={styles.userStatus}>● Online</span>
              </div>
            </div>
          </div>
        </header>
        <section className="content-area" style={styles.contentArea}>{renderContent()}</section>
      </main>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.98); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .sidebar {
          animation: slideIn 0.5s ease forwards;
        }
        
        .menu-item {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .menu-item:hover {
          transform: translateX(4px);
        }
        .menu-item.active {
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .main-header {
          animation: fadeInUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.1s;
        }
        
        .stat-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeInUp 0.5s ease forwards;
          opacity: 0;
        }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.2s; }
        .stat-card:nth-child(5) { animation-delay: 0.25s; }
        .stat-card:nth-child(6) { animation-delay: 0.3s; }
        .stat-card:nth-child(7) { animation-delay: 0.35s; }
        .stat-card:nth-child(8) { animation-delay: 0.4s; }
        .stat-card:nth-child(9) { animation-delay: 0.45s; }
        
        .stat-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 35px -12px rgba(0,0,0,0.15);
        }
        
        .icon-btn {
          transition: all 0.2s ease;
        }
        .icon-btn:hover {
          transform: translateY(-2px);
          background: #f1f5f9;
        }
        
        .logout-btn {
          transition: all 0.3s ease;
        }
        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(4px);
        }
        
        .content-area {
          animation: fadeInUp 0.5s ease forwards;
          animation-delay: 0.15s;
          opacity: 0;
        }
        
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #ff961a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
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
      `}</style>
    </div>
  );
}

const styles = {
  layout: { 
    display: "flex", 
    height: "100vh", 
    background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", 
    overflow: "hidden",
    position: "relative"
  },
  bgDecoration1: {
    position: "absolute",
    top: "-100px",
    right: "-50px",
    width: "300px",
    height: "300px",
    background: "radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  bgDecoration2: {
    position: "absolute",
    bottom: "-80px",
    left: "-60px",
    width: "250px",
    height: "250px",
    background: "radial-gradient(circle, rgba(255,150,26,0.04) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  sidebar: { 
    width: "230px", 
    backgroundImage: "linear-gradient(180deg, #f3b245 0%, #ff961a 100%)", 
    margin: "16px", 
    borderRadius: "28px", 
    padding: "28px 16px", 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "space-between", 
    color: "#fff", 
    boxShadow: "0 20px 35px -12px rgba(0, 0, 0, 0.15)",
    position: "relative",
    zIndex: 10
  },
  logoContainer: { 
    display: "flex", 
    alignItems: "center", 
    gap: "10px", 
    marginBottom: "10px", 
    paddingLeft: "12px" 
  },
  logoBadge: { 
    backgroundColor: "#1a1a1a", 
    width: "38px", 
    height: "38px", 
    borderRadius: "14px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontWeight: "800", 
    fontSize: "15px",
    color: "#fff"
  },
  logoText: { 
    fontSize: "20px", 
    margin: 0, 
    fontWeight: "700", 
    color: "#fff",
    letterSpacing: "-0.5px"
  },
  menu: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "3px" 
  },
  menuBtn: { 
    border: "none", 
    display: "flex", 
    alignItems: "center", 
    padding: "12px 10px", 
    borderRadius: "14px", 
    cursor: "pointer", 
    transition: "all 0.2s ease", 
    textAlign: "left", 
    fontSize: "14px", 
    fontWeight: "500", 
    width: "100%",
    color: "rgba(255, 255, 255, 0.8)",
    background: "transparent"
  },
  btnIcon: { 
    marginRight: "12px", 
    display: "flex", 
    alignItems: "center" 
  },
  sidebarFooter: {
    marginTop: "auto",
    paddingTop: "10px"
  },
  logoutBtn: { 
    padding: "12px 14px", 
    background: "rgba(255,255,255,0.1)", 
    border: "none", 
    borderRadius: "14px", 
    color: "#fff", 
    cursor: "pointer", 
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    fontSize: "14px",
    fontWeight: "500"
  },
  main: { 
    flex: 1, 
    padding: "24px 25px", 
    overflowY: "auto",
    position: "relative",
    zIndex: 10
  },
  header: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    marginBottom: "27px",
    flexWrap: "wrap",
    gap: "12px"
  },
  greetingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#fff7ed",
    padding: "6px 12px",
    borderRadius: "40px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#ff961a",
    marginBottom: "12px"
  },
  greeting: { 
    fontSize: "28px", 
    fontWeight: "800", 
    color: "#1e293b", 
    margin: 0,
    letterSpacing: "-0.5px"
  },
  dateText: { 
    color: "#64748b", 
    marginTop: "6px", 
    fontSize: "13px" 
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  notifBtn: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    padding: "10px",
    borderRadius: "14px",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  settingsBtn: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    padding: "10px",
    borderRadius: "14px",
    cursor: "pointer",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },
  userProfile: { 
    display: "flex", 
    alignItems: "center", 
    gap: "12px", 
    background: "#fff", 
    padding: "6px 16px 6px 8px", 
    borderRadius: "60px", 
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    border: "1px solid #e2e8f0"
  },
  avatar: { 
    width: "38px", 
    height: "38px", 
    borderRadius: "50%", 
    objectFit: "cover"
  },
  userInfo: { 
    display: "flex", 
    flexDirection: "column" 
  },
  userName: { 
    fontSize: "13px", 
    fontWeight: "700", 
    color: "#1e293b" 
  },
  userStatus: { 
    fontSize: "10px", 
    color: "#10b981", 
    fontWeight: "600" 
  },
  contentArea: { 
    flex: 1 
  },
  cardGrid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
    gap: "14px" 
  },
  statCard: { 
    background: "#fff", 
    padding: "22px", 
    borderRadius: "24px", 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "flex-start", 
    cursor: "pointer", 
    transition: "all 0.3s ease", 
    border: "1px solid #e2e8f0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  },
  cardLabel: { 
    color: "#64748b", 
    fontSize: "13px", 
    fontWeight: "600", 
    margin: "0 0 6px 0" 
  },
  cardValue: { 
    fontSize: "32px", 
    fontWeight: "800", 
    color: "#1e293b", 
    margin: 0,
    lineHeight: 1.2
  },
  cardTrend: { 
    fontSize: "11px", 
    fontWeight: "600", 
    marginTop: "12px", 
    display: "inline-flex", 
    alignItems: "center",
    gap: "4px",
    padding: "4px 10px", 
    borderRadius: "20px" 
  },
  cardIconBox: { 
    width: "52px", 
    height: "52px", 
    borderRadius: "18px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  placeholderSection: { 
    background: "#fff", 
    padding: "60px", 
    borderRadius: "24px", 
    textAlign: "center", 
    color: "#64748b",
    border: "1px solid #e2e8f0"
  },
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "16px",
    background: "#f8fafc"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #ff961a",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  skeleton: {
    width: "60px",
    height: "32px",
    borderRadius: "8px"
  }
};