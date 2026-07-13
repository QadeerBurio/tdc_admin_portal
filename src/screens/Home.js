import React, { useState, useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Components
import CreateOffer from "./CreateOffer";
import ClaimedUsers from "./ClaimedUsers";
import VerifyClaim from "./VerifyClaim";
import SavingsHistory from "./SavingsHistory";
import MyOffers from "./MyOffers";

// Icons
import {
  FaGift,
  FaUsers,
  FaSignOutAlt,
  FaShieldAlt,
  FaChartLine,
  FaHome,
  FaArrowUp,
  FaCheckCircle,
  FaTicketAlt,
  FaBell,
  FaSearch,
  FaCog,
  FaBars,
  FaTimes,
  FaArrowRight,
  FaStar,
  FaLongArrowAltUp,
  FaUserCircle,
  FaChevronDown,
  FaPlus,
  FaEye,
  FaFileAlt,
  FaEdit,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCalendarAlt,
  FaUser,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [stats, setStats] = useState({
    totalLeads: 0,
    completedRedemptions: 0,
    totalSavings: 0,
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const leadRes = await axios.get("http://localhost:5000/api/offers/claimed-users", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const savingRes = await axios.get("http://localhost:5000/api/offers/savings-report", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const savings = savingRes.data.reduce((acc, curr) => acc + curr.saved, 0);
        setStats({
          totalLeads: leadRes.data.length,
          completedRedemptions: savingRes.data.length,
          totalSavings: savings
        });
      } catch (err) {
        console.error("Error fetching dashboard stats", err);
      }
    };
    if (token) fetchStats();
  }, [token]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "home", label: "Dashboard", icon: <FaHome />, description: "Overview" },
    { id: "createOffer", label: "Create Offer", icon: <FaGift />, description: "New Offer" },
    { id: "myOffers", label: "My Offers", icon: <FaTicketAlt />, description: "Manage" },
    { id: "claimedUsers", label: "Claimed Leads", icon: <FaUsers />, description: "Leads" },
    { id: "verifyClaim", label: "Verify Student", icon: <FaShieldAlt />, description: "Verify" },
    { id: "savingsHistory", label: "Redemptions", icon: <FaChartLine />, description: "History" },
  ];

  const renderHome = () => (
    <div style={styles.homeContainer}>
      {/* Welcome Banner */}
      <div style={styles.welcomeHero}>
        <div style={styles.heroContent}>
          <div>
            <div style={styles.heroBadge}>
              <FaStar /> Partner Dashboard
            </div>
            <h2 style={styles.heroTitle}>
              Welcome back, {user?.name || "Partner"}! 👋
            </h2>
            <p style={styles.heroSubtitle}>
              Here's what's happening with your student offers today.
            </p>
          </div>
          <div style={styles.heroStats}>
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>{stats.totalLeads}</span>
              <span style={styles.heroStatLabel}>Total Claims</span>
            </div>
            <div style={styles.heroStatDivider} />
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>{stats.completedRedemptions}</span>
              <span style={styles.heroStatLabel}>Redemptions</span>
            </div>
            <div style={styles.heroStatDivider} />
            <div style={styles.heroStat}>
              <span style={styles.heroStatValue}>PKR {stats.totalSavings.toLocaleString()}</span>
              <span style={styles.heroStatLabel}>Savings Impact</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard} className="stat-card">
          <div style={{ ...styles.statIconWrapper, background: "#fff7ed" }}>
            <FaTicketAlt style={{ ...styles.statIcon, color: "#f97316" }} />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statValue}>{stats.totalLeads}</h3>
            <p style={styles.statLabel}>Total Claims</p>
            <span style={styles.statTrend}>
              <FaLongArrowAltUp size={12} /> 12% this month
            </span>
          </div>
        </div>

        <div style={styles.statCard} className="stat-card">
          <div style={{ ...styles.statIconWrapper, background: "#f0fdf4" }}>
            <FaCheckCircle style={{ ...styles.statIcon, color: "#10b981" }} />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statValue}>{stats.completedRedemptions}</h3>
            <p style={styles.statLabel}>Redemptions</p>
            <span style={styles.statTrend}>
              <FaArrowUp size={12} /> 5% conversion
            </span>
          </div>
        </div>

        <div style={styles.statCard} className="stat-card">
          <div style={{ ...styles.statIconWrapper, background: "#eff6ff" }}>
            <FaChartLine style={{ ...styles.statIcon, color: "#3b82f6" }} />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statValue}>PKR {stats.totalSavings.toLocaleString()}</h3>
            <p style={styles.statLabel}>Total Savings</p>
            <span style={styles.statTrend}>
              <FaLongArrowAltUp size={12} /> Social Impact
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionsGrid}>
          <button
            style={styles.actionBtn}
            className="quick-action"
            onClick={() => setActiveTab("createOffer")}
          >
            <div style={styles.actionIconWrapper}>
              <FaPlus size={24} />
            </div>
            <span>Create New Offer</span>
          </button>
          <button
            style={styles.actionBtn}
            className="quick-action"
            onClick={() => setActiveTab("myOffers")}
          >
            <div style={styles.actionIconWrapper}>
              <FaFileAlt size={24} />
            </div>
            <span>View My Offers</span>
          </button>
          <button
            style={styles.actionBtn}
            className="quick-action"
            onClick={() => setActiveTab("claimedUsers")}
          >
            <div style={styles.actionIconWrapper}>
              <FaUsers size={24} />
            </div>
            <span>View Leads</span>
          </button>
          <button
            style={styles.actionBtn}
            className="quick-action"
            onClick={() => setActiveTab("verifyClaim")}
          >
            <div style={styles.actionIconWrapper}>
              <FaShieldAlt size={24} />
            </div>
            <span>Verify Student</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    let content;
    switch (activeTab) {
      case "home":
        content = renderHome();
        break;
      case "createOffer":
        content = <CreateOffer />;
        break;
      case "myOffers":
        content = <MyOffers />;
        break;
      case "claimedUsers":
        content = <ClaimedUsers />;
        break;
      case "verifyClaim":
        content = <VerifyClaim />;
        break;
      default:
        content = <SavingsHistory />;
    }

    return <div className="animated-content">{content}</div>;
  };

  return (
    <div style={styles.container}>
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div style={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <nav style={{
        ...styles.sidebar,
        transform: isMobile ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
      }}>
        <div style={styles.brandSection}>
          <div style={styles.logoBadge}>
            <span style={styles.logoIcon}>P</span>
          </div>
          <div style={styles.brandText}>
            <h2 style={styles.logoText}>Partner<span style={styles.logoHighlight}>Portal</span> </h2>
            <p style={styles.logoSubtext}>Recruitment Partner</p>
          </div>
          {isMobile && (
            <button style={styles.mobileCloseBtn} onClick={() => setIsMobileMenuOpen(false)}>
              <FaTimes />
            </button>
          )}
        </div>

        <div style={styles.navGroup}>
          <p style={styles.navGroupLabel}>MENU</p>
          {navItems.map((item) => (
            <div
              key={item.id}
              className="nav-link"
              style={{
                ...styles.navItem,
                backgroundColor: activeTab === item.id ? "rgba(249, 195, 73, 0.15)" : "transparent",
              }}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setIsMobileMenuOpen(false);
              }}
            >
              <span style={{
                ...styles.icon,
                color: activeTab === item.id ? "#f9c349" : "#94a3b8"
              }}>
                {item.icon}
              </span>
              <div style={styles.navText}>
                <span style={{
                  ...styles.navLabel,
                  color: activeTab === item.id ? "#f9c349" : "#e2e8f0"
                }}>
                  {item.label}
                </span>
                <span style={styles.navDesc}>{item.description}</span>
              </div>
              {activeTab === item.id && (
                <span style={styles.activeIndicator} />
              )}
            </div>
          ))}
        </div>

        <div style={styles.userSection} ref={userMenuRef}>
          <div style={styles.userInfo} onClick={() => setShowUserMenu(!showUserMenu)}>
            <div style={styles.userAvatar}>
              {user?.name?.charAt(0) || "P"}
            </div>
            <div style={styles.userInfoText}>
              <div style={styles.userName}>{user?.name || "Partner"}</div>
              <div style={styles.userRole}>Partner</div>
            </div>
            <FaChevronDown style={{
              ...styles.userChevron,
              transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'
            }} />
          </div>

          {showUserMenu && (
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
              <div 
                style={styles.dropdownItem}
                onClick={() => {
                  setShowUserMenu(false);
                  setShowSettingsModal(true);
                }}
              >
                <FaCog size={18} />
                <span>Settings</span>
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
      </nav>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {/* Professional Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <div style={styles.headerIconWrapper}>
                {activeTab === "home" && <FaHome style={styles.headerIcon} />}
                {activeTab === "createOffer" && <FaGift style={styles.headerIcon} />}
                {activeTab === "myOffers" && <FaTicketAlt style={styles.headerIcon} />}
                {activeTab === "claimedUsers" && <FaUsers style={styles.headerIcon} />}
                {activeTab === "verifyClaim" && <FaShieldAlt style={styles.headerIcon} />}
                {activeTab === "savingsHistory" && <FaChartLine style={styles.headerIcon} />}
              </div>
              <div>
                <h1 style={styles.pageTitle}>
                  {navItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </h1>
                <p style={styles.pageSubtitle}>
                  {navItems.find(item => item.id === activeTab)?.description || "Overview"}
                </p>
              </div>
            </div>
            <div style={styles.headerRight}>
              <div style={styles.searchBar}>
                <FaSearch style={styles.searchIcon} />
                <input type="text" placeholder="Search..." style={styles.searchInput} />
              </div>
              <button style={styles.notificationBtn}>
                <FaBell />
                <span style={styles.notificationBadge}>3</span>
              </button>
              {isMobile && (
                <button style={styles.mobileMenuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  <FaBars />
                </button>
              )}
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
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.modalAvatar}>
                    {user?.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>{user?.name || "Partner"}</h2>
                    <p style={styles.modalSubtitle}>Partner Account</p>
                  </div>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowProfileModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.profileStats}>
                  <div style={styles.profileStat}>
                    <FaTicketAlt size={18} color="#f97316" />
                    <div>
                      <span style={styles.profileStatValue}>{stats.totalLeads}</span>
                      <span style={styles.profileStatLabel}>Total Leads</span>
                    </div>
                  </div>
                  <div style={styles.profileStat}>
                    <FaCheckCircle size={18} color="#10b981" />
                    <div>
                      <span style={styles.profileStatValue}>{stats.completedRedemptions}</span>
                      <span style={styles.profileStatLabel}>Redemptions</span>
                    </div>
                  </div>
                  <div style={styles.profileStat}>
                    <FaChartLine size={18} color="#3b82f6" />
                    <div>
                      <span style={styles.profileStatValue}>PKR {stats.totalSavings.toLocaleString()}</span>
                      <span style={styles.profileStatLabel}>Savings Impact</span>
                    </div>
                  </div>
                </div>

                <div style={styles.profileDivider} />

                <div style={styles.profileDetails}>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <FaUser size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Full Name</span>
                      <span style={styles.profileDetailValue}>{user?.name || "Partner"}</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <FaEnvelope size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Email</span>
                      <span style={styles.profileDetailValue}>{user?.email || "partner@example.com"}</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <FaPhone size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Phone</span>
                      <span style={styles.profileDetailValue}>{user?.phone || "+92 300 1234567"}</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <FaBuilding size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Company</span>
                      <span style={styles.profileDetailValue}>{user?.company || "Tech Solutions Inc."}</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <FaCalendarAlt size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Member Since</span>
                      <span style={styles.profileDetailValue}>January 2025</span>
                    </div>
                  </div>
                  <div style={styles.profileDetailItem}>
                    <div style={styles.profileDetailIcon}>
                      <FaShieldAlt size={16} color="#ff961a" />
                    </div>
                    <div>
                      <span style={styles.profileDetailLabel}>Role</span>
                      <span style={styles.profileDetailValue}>Partner</span>
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
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.settingsIconWrapper}>
                    <FaCog size={24} color="#ff961a" />
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>Settings</h2>
                    <p style={styles.modalSubtitle}>Manage your account preferences</p>
                  </div>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowSettingsModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.settingsGroup}>
                  <h3 style={styles.settingsGroupTitle}>Account Settings</h3>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <FaUser size={18} color="#3b82f6" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Profile Information</div>
                      <div style={styles.settingsItemDesc}>Update your personal information</div>
                    </div>
                    <button style={styles.settingsItemBtn}>
                      <FaEdit size={12} /> Edit
                    </button>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <FaEnvelope size={18} color="#8b5cf6" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Email Preferences</div>
                      <div style={styles.settingsItemDesc}>Manage notification settings</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Configure</button>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <FaLock size={18} color="#ef4444" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Security</div>
                      <div style={styles.settingsItemDesc}>Change password and security settings</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Update</button>
                  </div>
                </div>

                <div style={styles.settingsDivider} />

                <div style={styles.settingsGroup}>
                  <h3 style={styles.settingsGroupTitle}>Preferences</h3>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <FaBuilding size={18} color="#10b981" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Company Details</div>
                      <div style={styles.settingsItemDesc}>Update your company information</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Manage</button>
                  </div>
                  <div style={styles.settingsItem}>
                    <div style={styles.settingsItemIcon}>
                      <FaShieldAlt size={18} color="#f59e0b" />
                    </div>
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
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
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
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(249, 195, 73, 0.3); }
            50% { box-shadow: 0 0 20px rgba(249, 195, 73, 0.5); }
            100% { box-shadow: 0 0 5px rgba(249, 195, 73, 0.3); }
          }

          .nav-link {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin: 2px 0;
            position: relative;
            border-radius: 12px;
          }
          .nav-link:hover {
            background-color: rgba(255,255,255,0.05) !important;
            transform: translateX(5px);
          }

          .stat-card {
            animation: slideInRight 0.6s ease forwards;
            opacity: 0;
            transition: all 0.3s ease;
          }
          .stat-card:hover {
            transform: translateY(-5px) scale(1.01);
            box-shadow: 0 12px 40px rgba(0,0,0,0.08);
            border-color: #f9c349;
          }
          .stat-card:nth-child(1) { animation-delay: 0.05s; }
          .stat-card:nth-child(2) { animation-delay: 0.1s; }
          .stat-card:nth-child(3) { animation-delay: 0.15s; }

          .quick-action {
            transition: all 0.3s ease;
          }
          .quick-action:hover {
            transform: translateY(-6px) scale(1.02);
            box-shadow: 0 12px 40px rgba(249, 195, 73, 0.25);
            border-color: #f9c349;
          }

          .animated-content {
            animation: fadeIn 0.5s ease forwards;
          }

          .animated-content > div {
            animation: scaleIn 0.4s ease forwards;
          }

          .animated-content .stat-card {
            opacity: 0;
            animation: slideInRight 0.5s ease forwards;
          }
          .animated-content .stat-card:nth-child(1) { animation-delay: 0.05s; }
          .animated-content .stat-card:nth-child(2) { animation-delay: 0.1s; }
          .animated-content .stat-card:nth-child(3) { animation-delay: 0.15s; }

          .notification-badge {
            animation: pulse 2s infinite;
          }

          .user-info:hover {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
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
              animation: fadeIn 0.5s ease forwards !important;
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
  sidebar: {
    width: "250px",
    background: "linear-gradient(195deg, #0f172a 0%, #1e293b 100%)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    zIndex: 100,
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    flexShrink: 0,
  },
  mobileOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 99,
    animation: "fadeIn 0.3s ease",
  },
  brandSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "40px",
    padding: "0 8px",
    position: "relative",
  },
  brandText: {
    flex: 1,
  },
  logoBadge: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    boxShadow: "0 8px 25px rgba(249, 195, 73, 0.3)",
    flexShrink: 0,
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
  logoSubtext: {
    margin: 0,
    fontSize: "10px",
    opacity: 0.5,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  mobileCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "20px",
    cursor: "pointer",
    padding: "4px",
  },
  navGroup: {
    flex: 1,
  },
  navGroupLabel: {
    fontSize: "10px",
    opacity: 0.4,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "0 16px",
    marginBottom: "12px",
  },
  navItem: {
    padding: "10px 16px",
    borderRadius: "12px",
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
    padding: "8px",
    borderRadius: "12px",
    cursor: "pointer",
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
    animation: "slideDown 0.2s ease forwards",
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
    padding: "24px",
    overflowY: "auto",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    paddingBottom: "20px",
    borderBottom: "2px solid #f1f5f9",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  headerIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "20px",
    flexShrink: 0,
  },
  headerIcon: {
    fontSize: "20px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    background: "#f1f5f9",
    padding: "8px 16px",
    borderRadius: "12px",
    gap: "10px",
    transition: "all 0.3s ease",
    border: "1px solid transparent",
  },
  searchIcon: {
    color: "#94a3b8",
    fontSize: "14px",
  },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "14px",
    color: "#0f172a",
    width: "150px",
  },
  notificationBtn: {
    position: "relative",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    transition: "all 0.3s ease",
  },
  notificationBadge: {
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
  mobileMenuBtn: {
    display: "none",
    width: "40px",
    height: "40px",
    borderRadius: "12px",
    border: "none",
    background: "#f1f5f9",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    fontSize: "18px",
  },
  homeContainer: {
    animation: "fadeIn 0.5s ease",
  },
  welcomeHero: {
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    borderRadius: "20px",
    padding: "32px",
    marginBottom: "28px",
    color: "#fff",
    boxShadow: "0 10px 40px rgba(255, 150, 26, 0.2)",
    position: "relative",
    overflow: "hidden",
  },
  heroContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    position: "relative",
    zIndex: 2,
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.2)",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  heroTitle: {
    fontSize: "26px",
    fontWeight: "700",
    margin: 0,
  },
  heroSubtitle: {
    fontSize: "14px",
    opacity: 0.9,
    marginTop: "8px",
  },
  heroStats: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    background: "rgba(255,255,255,0.15)",
    padding: "16px 24px",
    borderRadius: "16px",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  heroStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heroStatValue: {
    fontSize: "24px",
    fontWeight: "700",
  },
  heroStatLabel: {
    fontSize: "11px",
    opacity: 0.8,
    marginTop: "2px",
  },
  heroStatDivider: {
    width: "1px",
    height: "40px",
    background: "rgba(255,255,255,0.2)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statIcon: {
    fontSize: "22px",
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
  quickActions: {
    marginTop: "8px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "16px",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
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
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    transition: "all 0.3s ease",
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
    maxWidth: "550px",
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
    fontSize: "18px",
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
    gap: "10px",
    padding: "12px",
    background: "#f8fafc",
    borderRadius: "12px",
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
    gap: "16px",
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
  settingsIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
  settingsDivider: {
    height: "1px",
    background: "#e5e7eb",
    marginBottom: "24px",
  },
};

export default Dashboard;