import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { 
  LayoutDashboard, PlusCircle, Tag, Briefcase, 
  Repeat, Building2, GraduationCap, LogOut,
  ChevronRight, Globe, Plane, Loader2, CreditCard,
  ShoppingCart, BookOpen, Sparkles, TrendingUp,
  Users, Award, Calendar, Bell, Settings, HelpCircle,
  Menu, X, UserCircle, Home, BarChart3, 
  FileText, Gift, Star, Clock, CheckCircle,
  User, Mail, Phone, MapPin, CalendarDays,
  Shield, Edit, Lock, ChevronDown,
  ArrowUpRight, Activity, Zap, 
  Calendar as CalendarIcon, BarChart4
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./styles/AdminDashboard.css";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Offer Created", message: "TechCorp added a new discount", time: "2 min ago", read: false },
    { id: 2, title: "Student Registration", message: "5 new students joined today", time: "15 min ago", read: false },
    { id: 3, title: "Job Application", message: "3 new applications received", time: "1 hour ago", read: false },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    
    try {
      const headers = { "Authorization": `Bearer ${token}` };
      const API_BASE = "https://the-deft-crew-production.up.railway.app/api/admin";

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
    
  ];

  const cardData = [
    { id: "students", label: "Total Students", value: stats.students, icon: <GraduationCap size={28} />, trend: "+12% this month", color: "#6366f1", bg: "#eef2ff", gradient: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)" },
    { id: "brands", label: "Active Brands", value: stats.brands, icon: <Building2 size={28} />, trend: "+5 new", color: "#10b981", bg: "#ecfdf5", gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)" },
    { id: "booking", label: "Total Bookings", value: stats.bookings, icon: <ShoppingCart size={28} />, trend: "This week", color: "#8b5cf6", bg: "#f5f3ff", gradient: "linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)" },
    { id: "card_manager", label: "Approved Cards", value: stats.approvedCards, icon: <CreditCard size={28} />, trend: `${stats.pendingCards} pending`, color: "#f43f5e", bg: "#fff1f2", gradient: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)" },
    { id: "all offer", label: "Total Offers", value: stats.offers, icon: <Tag size={28} />, trend: "Active deals", color: "#ff961a", bg: "#fff7ed", gradient: "linear-gradient(135deg, #ff961a 0%, #fbbf24 100%)" },
    { id: "manage_jobs", label: "Open Jobs", value: stats.jobs, icon: <Briefcase size={28} />, trend: "New positions", color: "#f59e0b", bg: "#fef3c7", gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)" },
    { id: "exchange_program", label: "Exchange Programs", value: stats.exchange, icon: <Globe size={28} />, trend: "Global study", color: "#ec4899", bg: "#fdf2f8", gradient: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)" },
    { id: "traveling", label: "Travel Packages", value: stats.packages, icon: <Plane size={28} />, trend: "Adventure", color: "#3b82f6", bg: "#eff6ff", gradient: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)" },
  ];

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <div style={styles.dashboardWrapper}>
            {/* Modern Dashboard Header with Stats */}
            <motion.div 
              style={styles.dashboardHeader}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div style={styles.dashboardHeaderLeft}>
                <div style={styles.dashboardIconWrapper}>
                  <BarChart4 size={28} color="#ff961a" />
                </div>
                <div>
                  <h1 style={styles.dashboardMainTitle}>Dashboard</h1>
                  <p style={styles.dashboardSubtitle}>
                    Welcome back, {user?.name || "Administrator"}! Here's your platform overview
                  </p>
                </div>
              </div>
              <div style={styles.dashboardHeaderRight}>
                <div style={styles.dashboardDate}>
                  <CalendarIcon size={16} />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div style={styles.dashboardStatus}>
                  <span style={styles.statusDot}></span>
                  <span>All systems operational</span>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              className="cards-grid" 
              style={styles.cardGrid}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {cardData.map((item, index) => (
                <motion.div 
                  key={item.id} 
                  className="stat-card"
                  style={styles.statCard} 
                  onClick={() => setActivePage(item.id)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.06 + 0.1 }}
                  whileHover={{ 
                    y: -10, 
                    scale: 1.02,
                    boxShadow: "0 20px 40px -12px rgba(0,0,0,0.15)"
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div style={styles.cardContent}>
                    <div>
                      <p style={styles.cardLabel}>{item.label}</p>
                      <h3 style={styles.cardValue}>
                        {isFetching ? <div className="skeleton" style={styles.skeleton}></div> : item.value}
                      </h3>
                      <span style={{ ...styles.cardTrend, backgroundColor: item.bg, color: item.color }}>
                        <TrendingUp size={12} /> {item.trend}
                      </span>
                    </div>
                    <div style={{ ...styles.cardIconBox, background: item.gradient }}>
                      {item.icon}
                    </div>
                  </div>
                  <motion.div 
                    style={styles.cardGlow}
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Stats Footer */}
            <motion.div 
              style={styles.quickStats}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div style={styles.quickStatItem}>
                <Users size={18} color="#6366f1" />
                <span>{stats.students + stats.brands} Total Users</span>
              </div>
              <div style={styles.quickStatDivider} />
              <div style={styles.quickStatItem}>
                <Award size={18} color="#f59e0b" />
                <span>Active Platform</span>
              </div>
              <div style={styles.quickStatDivider} />
              <div style={styles.quickStatItem}>
                <Clock size={18} color="#10b981" />
                <span>Updated {new Date().toLocaleTimeString()}</span>
              </div>
              <div style={styles.quickStatDivider} />
              <div style={styles.quickStatItem}>
                <Activity size={18} color="#3b82f6" />
                <span>{stats.offers + stats.jobs} Total Listings</span>
              </div>
            </motion.div>
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
      
      default: return <div style={styles.placeholderSection}><h2>Section Under Construction</h2></div>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          style={styles.spinner}
        />
        <p style={styles.loaderText}>Loading dashboard...</p>
        <div style={styles.loadingBar}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={styles.loadingProgress}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div style={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <motion.aside 
        className="sidebar" 
        style={{
          ...styles.sidebar,
          transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        }}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <div className="logo-container" style={styles.logoContainer}>
            <div style={styles.logoBadge}>
              <span style={styles.logoIcon}>A</span>
            </div>
            <div>
              <h2 style={styles.logoText}>Admin<span style={styles.logoHighlight}>Portal</span></h2>
              <p style={styles.logoSubtext}>Management Dashboard</p>
            </div>
            {isMobile && (
              <button style={styles.mobileCloseBtn} onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            )}
          </div>
          
          <div style={styles.divider} />
          
          <nav style={styles.menu}>
            <p style={styles.menuLabel}>MAIN MENU</p>
            {menuItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  className={`menu-item ${isActive ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    ...styles.menuBtn,
                    backgroundColor: isActive ? "rgba(249, 195, 73, 0.12)" : (hoveredItem === item.id ? "rgba(255,255,255,0.05)" : "transparent"),
                    borderRight: isActive ? "3px solid rgba(249, 195, 73, 0.12)" : "3px solid transparent",
                  }}
                  onClick={() => {
                    setActivePage(item.id);
                    if (isMobile) setIsMobileMenuOpen(false);
                  }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span style={{...styles.btnIcon, color: isActive ? '#f9c349' : '#94a3b8'}}>
                    {item.icon}
                  </span>
                  <span style={{...styles.btnLabel, color: isActive ? '#fff' : '#cbd5e1'}}>
                    {item.label}
                  </span>
                  {isActive && <ChevronRight size={14} style={{ color: '#f9c349', marginLeft: 'auto' }} />}
                </motion.button>
              );
            })}
          </nav>
        </div>
        
        {/* User Section */}
        <div style={styles.userSection} ref={userMenuRef}>
          <div 
            style={styles.userInfo} 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="user-info-clickable"
          >
            <div style={styles.userAvatar}>
              {user?.name?.charAt(0) || "A"}
            </div>
            <div style={styles.userInfoText}>
              <div style={styles.userName}>{user?.name || "Administrator"}</div>
              <div style={styles.userRole}>Admin</div>
            </div>
            <ChevronDown size={16} style={{
              ...styles.userChevron,
              transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              color: '#94a3b8'
            }} />
          </div>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                style={styles.userDropdown}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <div 
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowProfileModal(true);
                  }}
                >
                  <UserCircle size={18} />
                  <span>My Profile</span>
                </div>
                <div 
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSettingsModal(true);
                  }}
                >
                  <Settings size={18} />
                  <span>Settings</span>
                </div>
                <div style={styles.dropdownDivider} />
                <div 
                  style={{ ...styles.dropdownItem, ...styles.dropdownLogout }}
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      <main style={styles.main}>
        <motion.header 
          className="main-header" 
          style={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div style={styles.headerLeft}>
            <h1 style={styles.greeting}>
              {activePage === "dashboard" ? "Dashboard" : activePage.replace(/_/g, ' ').toUpperCase()}
            </h1>
            <p style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={styles.headerActions}>
            {isMobile && (
              <button style={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                <Menu size={20} />
              </button>
            )}
            
            <div style={styles.notificationWrapper} ref={notificationRef}>
              <button 
                className="icon-btn" 
                style={styles.notifBtn}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span style={styles.notificationDot}>{unreadCount}</span>}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    style={styles.notificationDropdown}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div style={styles.notificationHeader}>
                      <span style={styles.notificationTitle}>Notifications</span>
                      <button style={styles.markAllBtn} onClick={markAllAsRead}>Mark all read</button>
                    </div>
                    {notifications.length === 0 ? (
                      <div style={styles.emptyNotification}>
                        <Bell size={32} color="#cbd5e1" />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          style={{...styles.notificationItem, opacity: notif.read ? 0.6 : 1}}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div style={styles.notificationIcon}>
                            {notif.id === 1 ? <Gift size={14} /> : 
                             notif.id === 2 ? <Users size={14} /> : 
                             <Briefcase size={14} />}
                          </div>
                          <div style={styles.notificationContent}>
                            <div style={styles.notificationTitleText}>{notif.title}</div>
                            <div style={styles.notificationMessage}>{notif.message}</div>
                            <div style={styles.notificationTime}>{notif.time}</div>
                          </div>
                          {!notif.read && <div style={styles.notificationUnread} />}
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button className="icon-btn" style={styles.settingsBtn}>
              <Settings size={20} />
            </button>
          </div>
        </motion.header>
        
        <motion.section 
          className="content-area" 
          style={styles.contentArea}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {renderContent()}
        </motion.section>
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
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.modalAvatar}>
                    {user?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>{user?.name || "Administrator"}</h2>
                    <p style={styles.modalSubtitle}>Administrator Account</p>
                  </div>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowProfileModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.profileStats}>
                  <div style={styles.profileStat}>
                    <div style={{...styles.profileStatIcon, background: '#eff6ff', color: '#3b82f6'}}>
                      <Users size={18} />
                    </div>
                    <div>
                      <span style={styles.profileStatValue}>{stats.students}</span>
                      <span style={styles.profileStatLabel}>Students</span>
                    </div>
                  </div>
                  <div style={styles.profileStat}>
                    <div style={{...styles.profileStatIcon, background: '#f0fdf4', color: '#10b981'}}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span style={styles.profileStatValue}>{stats.brands}</span>
                      <span style={styles.profileStatLabel}>Brands</span>
                    </div>
                  </div>
                  <div style={styles.profileStat}>
                    <div style={{...styles.profileStatIcon, background: '#fff7ed', color: '#ff961a'}}>
                      <Tag size={18} />
                    </div>
                    <div>
                      <span style={styles.profileStatValue}>{stats.offers}</span>
                      <span style={styles.profileStatLabel}>Offers</span>
                    </div>
                  </div>
                </div>

                <div style={styles.profileDivider} />

                <div style={styles.profileDetails}>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <User size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Full Name</span>
                      <span style={styles.profileDetailValue}>{user?.name || "Administrator"}</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <Mail size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Email</span>
                      <span style={styles.profileDetailValue}>{user?.email || "admin@example.com"}</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <Phone size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Phone</span>
                      <span style={styles.profileDetailValue}>{user?.phone || "+92 300 1234567"}</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <Shield size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Role</span>
                      <span style={styles.profileDetailValue}>Super Admin</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <CalendarDays size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Member Since</span>
                      <span style={styles.profileDetailValue}>January 2025</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <MapPin size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Location</span>
                      <span style={styles.profileDetailValue}>Lahore, Pakistan</span>
                    </div>
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
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={{...styles.modalContent, maxWidth: '500px'}}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={{...styles.modalAvatar, background: '#f1f5f9', color: '#ff961a', fontSize: '20px'}}>
                    <Settings size={24} />
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>Settings</h2>
                    <p style={styles.modalSubtitle}>Manage your preferences</p>
                  </div>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowSettingsModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.settingsGroup}>
                  <h3 style={styles.settingsGroupTitle}>Account Settings</h3>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <User size={18} color="#3b82f6" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Profile Information</div>
                      <div style={styles.settingsItemDesc}>Update your personal details</div>
                    </div>
                    <button style={styles.settingsItemBtn}>
                      <Edit size={12} /> Edit
                    </button>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <Lock size={18} color="#ef4444" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Security</div>
                      <div style={styles.settingsItemDesc}>Change password & security</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Update</button>
                  </div>
                </div>

                <div style={styles.profileDivider} />

                <div style={styles.settingsGroup}>
                  <h3 style={styles.settingsGroupTitle}>Preferences</h3>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <Bell size={18} color="#8b5cf6" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Notifications</div>
                      <div style={styles.settingsItemDesc}>Manage notification settings</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Configure</button>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <Globe size={18} color="#10b981" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Language</div>
                      <div style={styles.settingsItemDesc}>Choose your preferred language</div>
                    </div>
                    <select style={styles.settingsSelect}>
                      <option>English</option>
                      <option>Urdu</option>
                      <option>Arabic</option>
                    </select>
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
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(249, 195, 73, 0.2); }
            50% { box-shadow: 0 0 20px rgba(249, 195, 73, 0.4); }
            100% { box-shadow: 0 0 5px rgba(249, 195, 73, 0.2); }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }
          @keyframes statusPulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
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
            background: rgba(249, 195, 73, 0.12);
          }
          
          .main-header {
            animation: fadeInUp 0.5s ease forwards;
            opacity: 0;
            animation-delay: 0.1s;
          }
          
          .stat-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          }
          .stat-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15);
          }
          
          .stat-card .glow {
            animation: glow 2s infinite;
          }
          
          .icon-btn {
            transition: all 0.2s ease;
          }
          .icon-btn:hover {
            transform: translateY(-2px);
            background: #f1f5f9;
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
          
          .user-info-clickable {
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 12px;
          }
          .user-info-clickable:hover {
            background: rgba(255,255,255,0.05);
          }

          .glow {
            animation: glow 2s infinite;
          }

          .status-dot {
            animation: statusPulse 2s infinite;
          }

          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #ff961a;
          }

          @media (max-width: 768px) {
            .stat-card {
              min-width: unset !important;
            }
          }
        `}
      </style>
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
  bgDecoration3: {
    position: "absolute",
    top: "50%",
    right: "20%",
    width: "150px",
    height: "150px",
    background: "radial-gradient(circle, rgba(255,150,26,0.03) 0%, rgba(255,150,26,0) 70%)",
    borderRadius: "50%",
    pointerEvents: "none"
  },
  mobileOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 99,
    backdropFilter: "blur(4px)",
  },
  sidebar: { 
    width: "240px", 
    background: "#0f172a",
    margin: "2px", 
    padding: "24px 16px", 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "space-between", 
    color: "#fff", 
    boxShadow: "0 20px 35px -12px rgba(0, 0, 0, 0.25)",
    position: "relative",
    zIndex: 10,
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  mobileCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    marginLeft: "auto",
  },
  logoContainer: { 
    display: "flex", 
    alignItems: "center", 
    gap: "12px", 
    marginBottom: "24px", 
    paddingLeft: "8px",
    position: "relative",
  },
  logoBadge: { 
    width: "44px", 
    height: "44px", 
    borderRadius: "14px", 
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontWeight: "800", 
    fontSize: "20px",
    color: "#0f172a",
    boxShadow: "0 8px 25px rgba(249, 195, 73, 0.3)",
    flexShrink: 0
  },
  logoIcon: {
    transform: "rotate(-5deg)",
  },
  logoText: { 
    fontSize: "18px", 
    margin: 0, 
    fontWeight: "700", 
    color: "#fff",
    letterSpacing: "-0.5px",
    lineHeight: 1.2
  },
  logoHighlight: {
    color: "#f9c349",
  },
  logoSubtext: {
    fontSize: "10px",
    opacity: 0.4,
    margin: 0,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.06)",
    marginBottom: "20px",
  },
  menu: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "2px" 
  },
  menuLabel: {
    fontSize: "10px",
    opacity: 0.4,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "0 12px",
    marginBottom: "12px",
  },
  menuBtn: { 
    border: "none", 
    display: "flex", 
    alignItems: "center", 
    padding: "10px 12px", 
    borderRadius: "12px", 
    cursor: "pointer", 
    transition: "all 0.2s ease", 
    textAlign: "left", 
    fontSize: "14px", 
    fontWeight: "500", 
    width: "100%",
    background: "transparent",
    position: "relative",
  },
  btnIcon: { 
    marginRight: "12px", 
    display: "flex", 
    alignItems: "center",
    transition: "color 0.2s ease",
  },
  btnLabel: {
    flex: 1,
    transition: "color 0.2s ease",
  },
  userSection: {
    marginTop: "auto",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    position: "relative",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    borderRadius: "12px",
    transition: "all 0.3s ease",
  },
  userInfoText: {
    flex: 1,
  },
  userAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
    color: "#0f172a",
    flexShrink: 0,
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
  },
  userRole: {
    fontSize: "11px",
    opacity: 0.5,
    color: "#94a3b8",
  },
  userChevron: {
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
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px"
  },
  headerLeft: {
    flex: 1,
  },
  greeting: { 
    fontSize: "22px", 
    fontWeight: "700", 
    color: "#1e293b", 
    margin: 0,
    letterSpacing: "-0.5px"
  },
  dateText: { 
    color: "#64748b", 
    marginTop: "2px", 
    fontSize: "13px" 
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  mobileMenuBtn: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    padding: "10px",
    borderRadius: "14px",
    cursor: "pointer",
    color: "#64748b",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  },
  notificationWrapper: {
    position: "relative",
  },
  notifBtn: {
    position: "relative",
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
  notificationDot: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "10px",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
  },
  notificationDropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: "0",
    width: "340px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    zIndex: 1000,
  },
  notificationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
  },
  notificationTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  markAllBtn: {
    fontSize: "12px",
    color: "#ff961a",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontWeight: "600",
  },
  notificationItem: {
    display: "flex",
    gap: "12px",
    padding: "12px 20px",
    borderBottom: "1px solid #f1f5f9",
    cursor: "pointer",
    transition: "background 0.2s ease",
    position: "relative",
  },
  notificationIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ff961a",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitleText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  notificationMessage: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  notificationTime: {
    fontSize: "10px",
    color: "#94a3b8",
    marginTop: "4px",
  },
  notificationUnread: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#ff961a",
    flexShrink: 0,
    marginTop: "8px",
  },
  emptyNotification: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "40px 20px",
    color: "#94a3b8",
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
  contentArea: { 
    flex: 1 
  },
  dashboardWrapper: {
    padding: "4px 0"
  },
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    background: "#fff",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
  },
  dashboardHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  dashboardIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #fef3c7"
  },
  dashboardMainTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px"
  },
  dashboardSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px"
  },
  dashboardHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap"
  },
  dashboardDate: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#64748b",
    fontWeight: "500"
  },
  dashboardStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#10b981",
    fontWeight: "500",
    background: "#f0fdf4",
    padding: "4px 14px",
    borderRadius: "20px"
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#10b981",
    animation: "statusPulse 2s infinite"
  },
  cardGrid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
    gap: "20px",
    marginBottom: "24px"
  },
  statCard: { 
    background: "#fff", 
    padding: "24px", 
    borderRadius: "24px", 
    display: "flex", 
    flexDirection: "column",
    cursor: "pointer", 
    transition: "all 0.3s ease", 
    border: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
    minHeight: "140px",
    position: "relative",
    overflow: "hidden"
  },
  cardContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    position: "relative",
    zIndex: 2
  },
  cardLabel: { 
    color: "#64748b", 
    fontSize: "13px", 
    fontWeight: "600", 
    margin: "0 0 6px 0",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  cardValue: { 
    fontSize: "32px", 
    fontWeight: "800", 
    color: "#1e293b", 
    margin: 0,
    lineHeight: 1.2
  },
  cardTrend: { 
    fontSize: "12px", 
    fontWeight: "600", 
    marginTop: "8px", 
    display: "inline-flex", 
    alignItems: "center",
    gap: "4px",
    padding: "4px 12px", 
    borderRadius: "20px" 
  },
  cardIconBox: { 
    width: "56px", 
    height: "56px", 
    borderRadius: "16px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  cardGlow: {
    position: "absolute",
    top: "-50%",
    right: "-20%",
    width: "120px",
    height: "120px",
    background: "radial-gradient(circle, rgba(255,150,26,0.08) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
    zIndex: 1
  },
  quickStats: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "16px 20px",
    background: "#fff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    flexWrap: "wrap"
  },
  quickStatItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#475569",
    fontWeight: "500"
  },
  quickStatDivider: {
    width: "1px",
    height: "24px",
    background: "#e5e7eb"
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
  },
  loaderText: {
    fontSize: "16px",
    color: "#64748b",
    margin: 0,
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
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    borderRadius: "4px",
  },
  skeleton: {
    width: "70px",
    height: "32px",
    borderRadius: "8px"
  },
  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#fff",
    borderRadius: "24px",
    maxWidth: "580px",
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
    background: "linear-gradient(135deg, #f8fafc 0%, #fff 100%)",
  },
  modalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  modalAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "700",
    color: "#fff",
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
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
  },
  modalBody: {
    padding: "32px",
    overflowY: "auto",
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
  // Profile Styles
  profileStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    marginBottom: "24px",
  },
  profileStat: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px",
  },
  profileStatIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profileStatValue: {
    display: "block",
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },
  profileStatLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
  },
  profileDivider: {
    height: "1px",
    background: "#e5e7eb",
    marginBottom: "24px",
  },
  profileDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  profileDetailItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px",
    transition: "all 0.3s ease",
  },
  profileDetailIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profileDetailLabel: {
    display: "block",
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  profileDetailValue: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  // Settings Styles
  settingsGroup: {
    marginBottom: "20px",
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
    gap: "14px",
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
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
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
    padding: "4px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#f9c349",
    color: "#0f172a",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  settingsSelect: {
    padding: "6px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "12px",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
  },
};

