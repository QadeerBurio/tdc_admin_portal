// Home.jsx
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  FaStar,
  FaLongArrowAltUp,
  FaUserCircle,
  FaChevronDown,
  FaPlus,
  FaEdit,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaUser,
  FaImage,
  FaStore,
  FaGlobe,
  FaRocket,
  FaArrowRight,
  FaThLarge,
  FaLayerGroup,
  FaPalette,
  FaSun,
  FaMoon,
  FaUserTie,
  FaBuilding,
  FaMailBulk,
  FaPhoneAlt,
  FaClipboardList,
  FaWallet,
  FaCreditCard,
  FaTag,
  FaPercent,
  FaBullhorn,
  FaChartBar,
  FaTrophy,
  FaMedal,
  FaCoins,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { IoSettingsOutline, IoNotificationsOutline } from "react-icons/io5";
import { MdOutlineDashboard, MdOutlineAnalytics } from "react-icons/md";

// Import components for each tab
import Discount from "./Discount";
import MyOffers from "./MyOffers";
import CreateOffer from "./CreateOffer";
import ClaimedUsers from "./ClaimedUsers";
import VerifyClaim from "./VerifyClaim";
import SavingsHistory from "./SavingsHistory";

export default function Home() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("home");
  const [stats, setStats] = useState({
    totalLeads: 0,
    completedRedemptions: 0,
    totalSavings: 0,
    totalRevenue: 0,
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [brandData, setBrandData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [hasOffers, setHasOffers] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [offerCreated, setOfferCreated] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New claim received from student!", time: "2 min ago", read: false },
    { id: 2, message: "Offer 'Summer Sale' expiring in 3 days", time: "1 hour ago", read: false },
    { id: 3, message: "5 new students viewed your offers today", time: "3 hours ago", read: true },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  const userMenuRef = React.useRef(null);
  const notificationRef = React.useRef(null);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchBrandData();
      fetchOffers();
    }
  }, [token]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/my-offers",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.data && res.data.length > 0) {
        setHasOffers(true);
        setOffers(res.data);
        setShowDiscountModal(false);
        setOfferCreated(true);
      } else {
        setHasOffers(false);
        setShowDiscountModal(true);
        setOfferCreated(false);
      }
    } catch (err) {
      console.error("Error fetching offers:", err);
      setHasOffers(false);
      setShowDiscountModal(true);
      setOfferCreated(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrandData = async () => {
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/auth/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBrandData({
        ...res.data,
        logo: res.data.logo || "",
        brandName: res.data.brandName || res.data.companyName || "",
        name: res.data.name || user?.name || "",
      });
    } catch (err) {
      console.error("Error fetching brand data", err);
      setBrandData({
        name: user?.name || "",
        email: user?.email || "",
        brandName: user?.brandName || user?.companyName || "",
        logo: user?.logo || "",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const leadRes = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/claimed-users",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const savingRes = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/savings-report",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const savings = savingRes.data.reduce((acc, curr) => acc + curr.saved, 0);
      const revenue = savingRes.data.reduce((acc, curr) => acc + (curr.bill - curr.saved), 0);

      setStats({
        totalLeads: leadRes.data.length,
        completedRedemptions: savingRes.data.length,
        totalSavings: savings,
        totalRevenue: revenue,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleCreateOfferNavigation = () => {
    setShowDiscountModal(false);
    setActiveTab("createOffer");
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const handleCloseDiscountModal = () => {
    if (!hasOffers) {
      setNotificationMessage("Please create your first offer to get started!");
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 4000);
      return;
    }
    setShowDiscountModal(false);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const refreshOffers = () => {
    fetchOffers();
  };

  const handleOfferCreated = () => {
    setShowDiscountModal(false);
    setHasOffers(true);
    setOfferCreated(true);
    fetchOffers();
    setActiveTab("myOffers");
  };

  const getBrandName = () => {
    return brandData?.brandName || brandData?.companyName || user?.brandName || user?.companyName || "Brand";
  };

  const getDisplayName = () => {
    return brandData?.name || user?.name || "Brand Partner";
  };

  const getLogoUrl = () => {
    return brandData?.logo || user?.logo || "";
  };

  const brandName = getBrandName();
  const displayName = getDisplayName();
  const logoUrl = getLogoUrl();

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: "home", label: "Dashboard", icon: <MdOutlineDashboard />, description: "Overview" },
    { id: "myOffers", label: "Discount", icon: <FaTicketAlt />, description: "Manage" },
    { id: "verifyClaim", label: "Verify Student", icon: <FaShieldAlt />, description: "Verify" },
    { id: "savingsHistory", label: "Redemption", icon: <FaShieldAlt />, description: "Verify" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return renderHome();
      case "myOffers":
        return <MyOffers />;
      case "createOffer":
        return <CreateOffer onOfferCreated={refreshOffers} />;
      case "claimedUsers":
        return <ClaimedUsers />;
      case "verifyClaim":
        return <VerifyClaim />;
      case "savingsHistory":
        return <SavingsHistory />;
      default:
        return renderHome();
    }
  };

  const renderHome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={styles.homeContainer}
    >
      <motion.div style={styles.statsGrid}>
        <motion.div
          style={styles.statCard}
          className="stat-card"
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div style={{ ...styles.statIconWrapper, background: "linear-gradient(135deg, #fef3c7, #fde68a)" }}>
            <FaTicketAlt style={{ ...styles.statIcon, color: "#d97706" }} />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statValue}>{stats.totalLeads}</h3>
            <p style={styles.statLabel}>Total Claims</p>
            <span style={styles.statTrend}>
              <FaLongArrowAltUp size={12} /> 12% this month
            </span>
          </div>
        </motion.div>

        <motion.div
          style={styles.statCard}
          className="stat-card"
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div style={{ ...styles.statIconWrapper, background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
            <FaCheckCircle style={{ ...styles.statIcon, color: "#059669" }} />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statValue}>{stats.completedRedemptions}</h3>
            <p style={styles.statLabel}>Redemptions</p>
            <span style={styles.statTrend}>
              <FaArrowUp size={12} /> 5% conversion
            </span>
          </div>
        </motion.div>

        <motion.div
          style={styles.statCard}
          className="stat-card"
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div style={{ ...styles.statIconWrapper, background: "linear-gradient(135deg, #dbeafe, #93c5fd)" }}>
            <FaCoins style={{ ...styles.statIcon, color: "#2563eb" }} />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statValue}>PKR {stats.totalRevenue.toLocaleString()}</h3>
            <p style={styles.statLabel}>Total Revenue</p>
            <span style={styles.statTrend}>
              <FaLongArrowAltUp size={12} /> From Sales
            </span>
          </div>
        </motion.div>

        <motion.div
          style={styles.statCard}
          className="stat-card"
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div style={{ ...styles.statIconWrapper, background: "linear-gradient(135deg, #fce4ec, #fecdd3)" }}>
            <FaChartLine style={{ ...styles.statIcon, color: "#e11d48" }} />
          </div>
          <div style={styles.statContent}>
            <h3 style={styles.statValue}>PKR {stats.totalSavings.toLocaleString()}</h3>
            <p style={styles.statLabel}>Total Savings Given</p>
            <span style={styles.statTrend}>
              <FaLongArrowAltUp size={12} /> Social Impact
            </span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  return (
    <div style={styles.container}>
      {/* Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            style={styles.notificationToast}
          >
            <div style={styles.notificationContent}>
              <span style={styles.notificationIcon}>⚠️</span>
              <span style={styles.notificationText}>{notificationMessage}</span>
              <button
                style={styles.notificationClose}
                onClick={() => setShowNotification(false)}
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Mobile Menu Toggle Button - Only visible on mobile */}
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
          <motion.div
            style={styles.logoBadge}
            whileHover={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Brand Logo"
                style={styles.sidebarLogo}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span style={styles.logoIcon}>B</span>';
                }}
              />
            ) : (
              <span style={styles.logoIcon}>B</span>
            )}
          </motion.div>
          <div style={styles.brandText}>
            <motion.h2
              style={styles.logoText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Brand<span style={styles.logoHighlight}>Portal</span>
            </motion.h2>
            <motion.p
              style={styles.logoSubtext}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {brandName || "Brand Partner"}
            </motion.p>
          </div>
        </div>

        <div style={styles.navGroup}>
          <p style={styles.navGroupLabel}>Main Menu</p>
          {navItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="nav-link"
              style={{
                ...styles.navItem,
                backgroundColor: activeTab === item.id ? "rgba(249, 195, 73, 0.12)" : "transparent",
                borderRight: activeTab === item.id ? "3px solid #f9c349" : "3px solid transparent",
              }}
              onClick={() => handleTabChange(item.id)}
              onMouseEnter={() => setHoveredNav(index)}
              onMouseLeave={() => setHoveredNav(null)}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.span
                style={{
                  ...styles.icon,
                  color: activeTab === item.id ? "#f9c349" : "#94a3b8"
                }}
                whileHover={{ scale: 1.15 }}
              >
                {item.icon}
              </motion.span>
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
                <motion.span
                  style={styles.activeIndicator}
                  layoutId="activeIndicator"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          style={styles.userSection}
          ref={userMenuRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            style={styles.userInfo}
            onClick={() => setShowUserMenu(!showUserMenu)}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <div style={styles.userAvatar}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Brand Logo"
                  style={styles.userAvatarImg}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.textContent = displayName?.charAt(0) || "B";
                  }}
                />
              ) : (
                displayName?.charAt(0) || "B"
              )}
            </div>
            <div style={styles.userInfoText}>
              <div style={styles.userName}>{displayName}</div>
              <div style={styles.userRole}>{brandName || "Brand"}</div>
            </div>
            <motion.div
              animate={{ rotate: showUserMenu ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <FaChevronDown style={styles.userChevron} />
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                style={styles.userDropdown}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  style={styles.dropdownItem}
                  whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowProfileModal(true);
                  }}
                >
                  <FaUserCircle size={18} />
                  <span>My Profile</span>
                </motion.div>
                <motion.div
                  style={styles.dropdownItem}
                  whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.05)" }}
                  onClick={() => {
                    setShowUserMenu(false);
                    setShowSettingsModal(true);
                  }}
                >
                  <FaCog size={18} />
                  <span>Settings</span>
                </motion.div>
                <div style={styles.dropdownDivider} />
                <motion.div
                  style={{ ...styles.dropdownItem, ...styles.dropdownLogout }}
                  whileHover={{ x: 5, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                >
                  <FaSignOutAlt size={18} />
                  <span>Logout</span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div style={styles.sidebarFooter}>
          <motion.div
            style={styles.footerBadge}
            whileHover={{ scale: 1.02 }}
          >
            <FaMedal style={styles.footerBadgeIcon} />
            <div>
              <span style={styles.footerBadgeTitle}>Brand Partner</span>
              <span style={styles.footerBadgeSub}>Verified Account</span>
            </div>
          </motion.div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <motion.div
          style={styles.contentWrapper}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Page Header */}
          <div style={styles.pageHeader}>
            <div style={styles.headerLeft}>
              <motion.div
                style={styles.headerIconWrapper}
                
              >
                {activeTab === "home" && <FaHome style={styles.headerIcon} />}
                {activeTab === "myOffers" && <FaTicketAlt style={styles.headerIcon} />}
                {activeTab === "createOffer" && <FaGift style={styles.headerIcon} />}
                {activeTab === "claimedUsers" && <FaUsers style={styles.headerIcon} />}
                {activeTab === "verifyClaim" && <FaShieldAlt style={styles.headerIcon} />}
                {activeTab === "savingsHistory" && <FaChartLine style={styles.headerIcon} />}
              </motion.div>
              <div>
                <motion.h1
                  style={styles.pageTitle}
                  key={activeTab}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {navItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </motion.h1>
                <motion.p
                  style={styles.pageSubtitle}
                  key={`sub-${activeTab}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {navItems.find(item => item.id === activeTab)?.description || "Overview"}
                </motion.p>
              </div>
            </div>
           
          </div>

          {/* Dynamic Content */}
          <div className="animated-content" style={styles.contentArea}>
            {renderContent()}
          </div>
        </motion.div>
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
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <motion.div
                    style={styles.modalAvatar}
                    whileHover={{ scale: 1.05 }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Brand Logo"
                        style={styles.modalAvatarImg}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.textContent = displayName?.charAt(0) || "B";
                        }}
                      />
                    ) : (
                      displayName?.charAt(0) || "B"
                    )}
                  </motion.div>
                  <div>
                    <h2 style={styles.modalTitle}>{displayName}</h2>
                    <p style={styles.modalSubtitle}>{brandName || "Brand Partner"}</p>
                  </div>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowProfileModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.profileStats}>
                  <div style={styles.profileStat}>
                    <FaTicketAlt size={18} color="#d97706" />
                    <div>
                      <span style={styles.profileStatValue}>{stats.totalLeads}</span>
                      <span style={styles.profileStatLabel}>Total Leads</span>
                    </div>
                  </div>
                  <div style={styles.profileStat}>
                    <FaCheckCircle size={18} color="#059669" />
                    <div>
                      <span style={styles.profileStatValue}>{stats.completedRedemptions}</span>
                      <span style={styles.profileStatLabel}>Redemptions</span>
                    </div>
                  </div>
                  <div style={styles.profileStat}>
                    <FaCoins size={18} color="#2563eb" />
                    <div>
                      <span style={styles.profileStatValue}>PKR {stats.totalRevenue.toLocaleString()}</span>
                      <span style={styles.profileStatLabel}>Total Revenue</span>
                    </div>
                  </div>
                  <div style={styles.profileStat}>
                    <FaChartLine size={18} color="#e11d48" />
                    <div>
                      <span style={styles.profileStatValue}>PKR {stats.totalSavings.toLocaleString()}</span>
                      <span style={styles.profileStatLabel}>Savings Impact</span>
                    </div>
                  </div>
                </div>

                <div style={styles.profileDivider} />

                <div style={styles.profileDetails}>
                  {[
                    { icon: <FaUser />, label: "Full Name", value: displayName },
                    { icon: <FaStore />, label: "Brand Name", value: brandName || "Not specified" },
                    { icon: <FaEnvelope />, label: "Email", value: user?.email || "brand@example.com" },
                    { icon: <FaPhone />, label: "Phone", value: user?.phone || "+92 300 1234567" },
                    {
                      icon: <FaCalendarAlt />, label: "Member Since", value: brandData?.createdAt ?
                        new Date(brandData.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        }) : 'January 2025'
                    },
                    { icon: <FaShieldAlt />, label: "Role", value: "Brand Partner" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      style={styles.profileDetailItem}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div style={styles.profileDetailIcon}>
                        {item.icon}
                      </div>
                      <div>
                        <span style={styles.profileDetailLabel}>{item.label}</span>
                        <span style={styles.profileDetailValue}>{item.value}</span>
                      </div>
                    </motion.div>
                  ))}
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
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25 }}
              style={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderLeft}>
                  <div style={styles.settingsIconWrapper}>
                    <IoSettingsOutline size={24} color="#d97706" />
                  </div>
                  <div>
                    <h2 style={styles.modalTitle}>Settings</h2>
                    <p style={styles.modalSubtitle}>Manage your brand account preferences</p>
                  </div>
                </div>
                <button style={styles.modalCloseBtn} onClick={() => setShowSettingsModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div style={styles.modalBody}>
                <div style={styles.settingsGroup}>
                  <h3 style={styles.settingsGroupTitle}>Account Settings</h3>
                  {[
                    { icon: <FaUser />, label: "Profile Information", desc: "Update your personal information", action: "Edit" },
                    { icon: <FaStore />, label: "Brand Details", desc: brandName || 'Update brand information', action: "Update" },
                    { icon: <FaImage />, label: "Brand Logo", desc: "Upload or update your brand logo", action: "Upload" },
                    { icon: <FaEnvelope />, label: "Email Preferences", desc: "Manage notification settings", action: "Configure" },
                    { icon: <FaLock />, label: "Security", desc: "Change password and security settings", action: "Update" },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      style={styles.settingsItem}
                      whileHover={{ scale: 1.01, backgroundColor: "#f1f5f9" }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div style={styles.settingsItemIcon}>
                        {item.icon}
                      </div>
                      <div style={styles.settingsItemContent}>
                        <div style={styles.settingsItemLabel}>{item.label}</div>
                        <div style={styles.settingsItemDesc}>{item.desc}</div>
                      </div>
                      <button style={styles.settingsItemBtn}>{item.action}</button>
                    </motion.div>
                  ))}
                </div>

                <div style={styles.settingsDivider} />

                <div style={styles.settingsGroup}>
                  <h3 style={styles.settingsGroupTitle}>Preferences</h3>
                  <motion.div
                    style={styles.settingsItem}
                    whileHover={{ scale: 1.01, backgroundColor: "#f1f5f9" }}
                  >
                    <div style={styles.settingsItemIcon}>
                      <FaGlobe size={18} color="#059669" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Language</div>
                      <div style={styles.settingsItemDesc}>Choose your preferred language</div>
                    </div>
                    <select style={styles.settingsSelect}>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </motion.div>
                  <motion.div
                    style={styles.settingsItem}
                    whileHover={{ scale: 1.01, backgroundColor: "#f1f5f9" }}
                  >
                    <div style={styles.settingsItemIcon}>
                      <FaShieldAlt size={18} color="#d97706" />
                    </div>
                    <div style={styles.settingsItemContent}>
                      <div style={styles.settingsItemLabel}>Privacy</div>
                      <div style={styles.settingsItemDesc}>Control your privacy settings</div>
                    </div>
                    <button style={styles.settingsItemBtn}>Manage</button>
                  </motion.div>
                </div>
              </div>

              <button style={styles.modalCloseBtnBottom} onClick={() => setShowSettingsModal(false)}>
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discount Modal */}
      <AnimatePresence>
        {showDiscountModal && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.discountModalOverlay}
            onClick={handleCloseDiscountModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              style={styles.discountModalContent}
              onClick={(e) => e.stopPropagation()}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div style={styles.discountModalHeader}>
                <div style={styles.discountModalHeaderLeft}>
                  <div style={styles.discountModalIcon}>
                    <FaRocket size={24} color="#d97706" />
                  </div>
                  <div>
                    <h2 style={styles.discountModalTitle}>Create Your First Offer! 🎯</h2>
                    <p style={styles.discountModalSubtitle}>You haven't created any offers yet</p>
                  </div>
                </div>
                <button style={styles.discountModalClose} onClick={handleCloseDiscountModal}>
                  <FaTimes />
                </button>
              </div>

              <div style={styles.discountModalBody}>
                <Discount onOfferCreated={handleOfferCreated} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .nav-link {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin: 2px 0;
          position: relative;
          border-radius: 10px;
          cursor: pointer;
        }
        .nav-link:hover {
          background-color: rgba(255,255,255,0.05) !important;
        }

        .stat-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .stat-card:hover {
          border-color: #f9c349;
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }

        .animated-content {
          animation: fadeIn 0.5s ease forwards;
          width: 100%;
          flex: 1;
          overflow-y: auto;
          padding-bottom: 20px;
        }

        ::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          background: transparent;
        }
        
        * {
          scrollbar-width: none;
        }
        
        * {
          -ms-overflow-style: none;
        }

        .search-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }
        .search-input:focus {
          outline: none;
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

        /* Mobile First - All devices */
        @media (max-width: 768px) {
          .mobileMenuBtn {
            display: flex !important;
          }
          .stat-card {
            animation: fadeIn 0.5s ease forwards !important;
          }
          .search-input {
            width: 80px !important;
          }
          .searchBar {
            display: none !important;
          }
          .profileDetails {
            grid-template-columns: 1fr !important;
          }
          .profileStats {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .contentWrapper {
            padding: 12px !important;
            border-radius: 12px !important;
            height: 100% !important;
            overflow-y: auto !important;
            width: 100% !important;
          }
          .notificationDropdown {
            width: 280px !important;
            right: -40px !important;
          }
          .pageHeader {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
            padding-bottom: 12px !important;
          }
          .headerLeft {
            justify-content: center !important;
            text-align: center !important;
            width: 100% !important;
          }
          .headerRight {
            width: 100% !important;
            justify-content: center !important;
          }
          .sidebar {
            width: 280px !important;
            padding: 16px 12px !important;
            position: fixed !important;
            top: 0;
            left: 0;
            height: 100vh !important;
            z-index: 100 !important;
            transform: translateX(-100%);
          }
          .statValue {
            font-size: 16px !important;
          }
          .statIconWrapper {
            width: 38px !important;
            height: 38px !important;
          }
          .statIcon {
            font-size: 16px !important;
          }
          .statCard {
            padding: 14px !important;
            gap: 12px !important;
          }
          .statLabel {
            font-size: 12px !important;
          }
          .statTrend {
            font-size: 10px !important;
          }
          .modalContent {
            max-width: 98% !important;
            border-radius: 14px !important;
          }
          .modalBody {
            padding: 16px !important;
          }
          .modalHeader {
            padding: 14px 16px !important;
          }
          .discountModalContent {
            max-width: 98% !important;
            border-radius: 14px !important;
          }
          .discountModalBody {
            padding: 12px !important;
          }
          .discountModalHeader {
            padding: 12px 16px !important;
          }
          .profileStat {
            padding: 8px !important;
          }
          .profileStatValue {
            font-size: 14px !important;
          }
          .settingsItem {
            padding: 10px 12px !important;
            flex-wrap: wrap !important;
          }
          .settingsItemBtn {
            width: 100% !important;
            padding: 6px !important;
            margin-top: 4px !important;
          }
          .settingsSelect {
            width: 100% !important;
            margin-top: 4px !important;
          }
          .mainContent {
            padding: 0 !important;
            flex: 1 !important;
            width: 100% !important;
            overflow: hidden !important;
            margin-left: 0 !important;
          }
          .contentArea {
            padding: 0 !important;
            overflow-y: auto !important;
            flex: 1 !important;
          }
          .homeContainer {
            padding: 0 !important;
            width: 100% !important;
          }
          .pageTitle {
            font-size: 18px !important;
          }
          .headerIconWrapper {
            width: 36px !important;
            height: 36px !important;
            font-size: 14px !important;
          }
          .headerIcon {
            font-size: 14px !important;
          }
          .brandSection {
            margin-bottom: 24px !important;
            gap: 10px !important;
          }
          .logoBadge {
            width: 40px !important;
            height: 40px !important;
            font-size: 18px !important;
          }
          .logoText {
            font-size: 17px !important;
          }
          .logoSubtext {
            font-size: 9px !important;
          }
          .navItem {
            padding: 8px 12px !important;
            gap: 10px !important;
          }
          .navLabel {
            font-size: 13px !important;
          }
          .icon {
            font-size: 16px !important;
            width: 18px !important;
          }
          .userInfo {
            padding: 6px !important;
            gap: 8px !important;
          }
          .userAvatar {
            width: 32px !important;
            height: 32px !important;
            font-size: 12px !important;
          }
          .userName {
            font-size: 12px !important;
          }
          .userRole {
            font-size: 10px !important;
          }
          .pageSubtitle {
            font-size: 12px !important;
          }
          .notificationBadge {
            font-size: 9px !important;
            width: 16px !important;
            height: 16px !important;
          }
          .notificationBtn {
            width: 36px !important;
            height: 36px !important;
            font-size: 14px !important;
          }
          .notificationDropdown {
            width: 260px !important;
            right: -30px !important;
          }
          .notificationItem {
            padding: 10px 14px !important;
          }
          .notificationItemText {
            font-size: 12px !important;
          }
          .modalAvatar {
            width: 44px !important;
            height: 44px !important;
            font-size: 18px !important;
          }
          .modalTitle {
            font-size: 17px !important;
          }
          .modalCloseBtn {
            width: 30px !important;
            height: 30px !important;
            font-size: 14px !important;
          }
          .modalCloseBtnBottom {
            font-size: 13px !important;
            padding: 12px !important;
          }
          .profileDetailItem {
            padding: 10px !important;
          }
          .profileDetailValue {
            font-size: 12px !important;
          }
          .profileDetailLabel {
            font-size: 9px !important;
          }
          .settingsGroupTitle {
            font-size: 13px !important;
          }
          .settingsItemLabel {
            font-size: 13px !important;
          }
          .settingsItemDesc {
            font-size: 11px !important;
          }
          .container {
            padding: 0 !important;
          }
          .sidebarFooter {
            margin-top: 8px !important;
            padding-top: 8px !important;
          }
          .footerBadge {
            padding: 8px 12px !important;
          }
          .footerBadgeTitle {
            font-size: 11px !important;
          }
          .footerBadgeSub {
            font-size: 9px !important;
          }
          .footerBadgeIcon {
            font-size: 16px !important;
          }
          .userDropdown {
            padding: 6px !important;
          }
          .dropdownItem {
            padding: 8px 12px !important;
            font-size: 13px !important;
            gap: 10px !important;
          }
          .statsGrid {
            margin-bottom: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .mobileMenuBtn {
            top: 10px;
            width: 38px;
            height: 38px;
            font-size: 16px;
          }
          .profileStats {
            grid-template-columns: 1fr !important;
          }
          .contentWrapper {
            padding: 10px !important;
            border-radius: 10px !important;
          }
          .statCard {
            padding: 12px !important;
            gap: 10px !important;
          }
          .statValue {
            font-size: 15px !important;
          }
          .statIconWrapper {
            width: 34px !important;
            height: 34px !important;
          }
          .statIcon {
            font-size: 14px !important;
          }
          .pageTitle {
            font-size: 16px !important;
          }
          .headerIconWrapper {
            width: 32px !important;
            height: 32px !important;
            font-size: 12px !important;
          }
          .headerIcon {
            font-size: 12px !important;
          }
          .sidebar {
            width: 260px !important;
            padding: 12px 10px !important;
          }
          .notificationDropdown {
            width: 240px !important;
            right: -50px !important;
          }
          .discountModalContent {
            max-width: 98% !important;
            border-radius: 12px !important;
          }
          .discountModalBody {
            padding: 10px !important;
          }
          .discountModalHeader {
            padding: 10px 14px !important;
          }
          .discountModalTitle {
            font-size: 15px !important;
          }
          .discountModalSubtitle {
            font-size: 11px !important;
          }
          .discountModalIcon {
            width: 36px !important;
            height: 36px !important;
          }
          .discountModalIcon svg {
            font-size: 18px !important;
          }
          .modalContent {
            max-width: 98% !important;
            border-radius: 12px !important;
          }
          .modalTitle {
            font-size: 16px !important;
          }
          .modalBody {
            padding: 14px !important;
          }
          .modalHeader {
            padding: 12px 14px !important;
          }
          .profileStatValue {
            font-size: 13px !important;
          }
          .profileStatLabel {
            font-size: 9px !important;
          }
          .profileDetailItem {
            padding: 8px !important;
          }
          .profileDetailValue {
            font-size: 11px !important;
          }
          .settingsItem {
            padding: 8px 10px !important;
          }
          .settingsItemLabel {
            font-size: 12px !important;
          }
          .settingsItemDesc {
            font-size: 10px !important;
          }
          .mainContent {
            padding: 0 !important;
          }
          .search-input {
            width: 60px !important;
            font-size: 11px !important;
          }
          .notificationBtn {
            width: 32px !important;
            height: 32px !important;
            font-size: 12px !important;
          }
          .notificationBadge {
            font-size: 8px !important;
            width: 14px !important;
            height: 14px !important;
            top: -3px !important;
            right: -3px !important;
          }
          .statTrend {
            font-size: 9px !important;
          }
          .statLabel {
            font-size: 11px !important;
          }
          .logoBadge {
            width: 36px !important;
            height: 36px !important;
            font-size: 16px !important;
          }
          .logoText {
            font-size: 15px !important;
          }
          .logoSubtext {
            font-size: 8px !important;
          }
          .navItem {
            padding: 6px 10px !important;
            gap: 8px !important;
          }
          .navLabel {
            font-size: 12px !important;
          }
          .icon {
            font-size: 14px !important;
            width: 16px !important;
          }
          .navDesc {
            font-size: 9px !important;
          }
          .pageSubtitle {
            font-size: 11px !important;
          }
          .statsGrid {
            gap: 8px !important;
            margin-bottom: 12px !important;
          }
          .brandSection {
            margin-bottom: 16px !important;
            gap: 8px !important;
          }
          .userAvatar {
            width: 28px !important;
            height: 28px !important;
            font-size: 11px !important;
          }
          .userName {
            font-size: 11px !important;
          }
          .userRole {
            font-size: 9px !important;
          }
          .userChevron {
            font-size: 10px !important;
          }
          .footerBadge {
            padding: 6px 10px !important;
          }
          .footerBadgeTitle {
            font-size: 10px !important;
          }
          .footerBadgeSub {
            font-size: 8px !important;
          }
          .footerBadgeIcon {
            font-size: 14px !important;
          }
          .dropdownItem {
            padding: 6px 10px !important;
            font-size: 12px !important;
            gap: 8px !important;
          }
          .userDropdown {
            padding: 4px !important;
          }
          .modalAvatar {
            width: 38px !important;
            height: 38px !important;
            font-size: 16px !important;
          }
          .modalCloseBtn {
            width: 28px !important;
            height: 28px !important;
            font-size: 12px !important;
          }
          .modalCloseBtnBottom {
            font-size: 12px !important;
            padding: 10px !important;
          }
        }

        @media (max-width: 800px) {
          .pageHeader {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 12px !important;
          }
          .headerLeft {
            justify-content: center !important;
            text-align: center !important;
            width: 100% !important;
          }
          .headerRight {
            width: 100% !important;
            justify-content: center !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .statsGrid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .profileStats {
            grid-template-columns: 1fr 1fr !important;
          }
          .profileDetails {
            grid-template-columns: 1fr 1fr !important;
          }
          .sidebar {
            width: 220px !important;
            padding: 20px 12px !important;
          }
          .contentWrapper {
            padding: 18px 20px !important;
          }
          .statValue {
            font-size: 19px !important;
          }
          .statCard {
            padding: 16px !important;
          }
          .logoText {
            font-size: 18px !important;
          }
          .navItem {
            padding: 8px 12px !important;
          }
          .navLabel {
            font-size: 13px !important;
          }
          .mainContent {
            padding: 10px !important;
          }
        }

        @media (min-width: 1025px) {
          .sidebar {
            width: 260px !important;
            padding: 24px 16px !important;
            position: relative !important;
            transform: translateX(0) !important;
          }
          .contentWrapper {
            padding: 24px 28px !important;
          }
          .statsGrid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .mainContent {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#f1f5f9",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: "hidden",
    position: "relative",
    padding: 0,
    margin: 0,
    boxSizing: "border-box",
  },
  sidebar: {
    width: "260px",
    minWidth: "260px",
    background: "linear-gradient(180deg, #0f172a 0%, #1a2332 50%, #0f172a 100%)",
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
    zIndex: 100,
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    flexShrink: 0,
    height: "100vh",
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
  mobileOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    zIndex: 99,
    animation: "fadeIn 0.3s ease",
  },
  brandSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "32px",
    padding: "0 8px",
    position: "relative",
    zIndex: 1,
  },
  brandText: {
    flex: 1,
  },
  logoBadge: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    boxShadow: "0 8px 25px rgba(249, 195, 73, 0.25)",
    flexShrink: 0,
    overflow: "hidden",
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
    fontSize: "18px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    color: "#fff",
  },
  logoHighlight: {
    color: "#f9c349",
  },
  logoSubtext: {
    margin: 0,
    fontSize: "9px",
    opacity: 0.5,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  mobileCloseBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px",
  },
  navGroup: {
    flex: 1,
    overflowY: "auto",
    position: "relative",
    zIndex: 1,
  },
  navGroupLabel: {
    fontSize: "10px",
    opacity: 0.3,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    padding: "0 16px",
    marginBottom: "12px",
    fontWeight: "600",
  },
  navItem: {
    padding: "8px 14px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "4px",
    transition: "all 0.3s ease",
    position: "relative",
  },
  icon: {
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    width: "20px",
    transition: "all 0.3s ease",
  },
  navText: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  navLabel: {
    fontSize: "13px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  navDesc: {
    fontSize: "9px",
    opacity: 0.4,
    marginTop: "1px",
  },
  activeIndicator: {
    width: "6px",
    height: "6px",
    background: "#f9c349",
    borderRadius: "50%",
  },
  userSection: {
    marginTop: "auto",
    paddingTop: "14px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    position: "relative",
    zIndex: 1,
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 8px",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  userInfoText: {
    flex: 1,
  },
  userAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
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
    fontSize: "13px",
    fontWeight: "600",
    color: "#fff",
  },
  userRole: {
    fontSize: "10px",
    opacity: 0.5,
  },
  userChevron: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  userDropdown: {
    position: "absolute",
    bottom: "calc(100% + 10px)",
    left: "0",
    right: "0",
    background: "#1e293b",
    borderRadius: "12px",
    padding: "6px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
    zIndex: 100,
    border: "1px solid rgba(255,255,255,0.05)",
  },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    color: "#e2e8f0",
    fontSize: "13px",
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
  sidebarFooter: {
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    position: "relative",
    zIndex: 1,
  },
  footerBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    background: "rgba(255,255,255,0.03)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.04)",
    cursor: "default",
  },
  footerBadgeIcon: {
    fontSize: "16px",
    color: "#f9c349",
  },
  footerBadgeTitle: {
    display: "block",
    fontSize: "11px",
    fontWeight: "600",
    color: "#fff",
  },
  footerBadgeSub: {
    display: "block",
    fontSize: "9px",
    opacity: 0.4,
  },
  mainContent: {
    flex: 1,
    padding: "0px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    width: "100%",
    height: "100vh",
  },
  contentWrapper: {
    height: "100%",
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    padding: "24px 15px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    width: "100%",
  },
  contentArea: {
    flex: 1,
    width: "100%",
    overflow: "visible",
    display: "flex",
    flexDirection: "column",
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid #f1f5f9",
    flexWrap: "wrap",
    gap: "12px",
    flexShrink: 0,
    width: "100%",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  headerIconWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "18px",
    flexShrink: 0,
    boxShadow: "0 4px 15px rgba(249, 195, 73, 0.25)",
    marginLeft:70
  },
  headerIcon: {
    fontSize: "18px",
    
  },
  pageTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  pageSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0 0 0",
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
  homeContainer: {
    animation: "fadeIn 0.5s ease",
    width: "100%",
    flex: 1,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
    width: "100%",
  },
  statCard: {
    background: "#fff",
    padding: "18px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    border: "1px solid #e2e8f0",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  statIconWrapper: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statIcon: {
    fontSize: "20px",
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: "20px",
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
    color: "#059669",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
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
    borderRadius: "20px",
    maxWidth: "560px",
    width: "95%",
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
  },
  modalHeader: {
    padding: "22px 26px",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #fafbfc 0%, #fff 100%)",
  },
  modalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  modalAvatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
    flexShrink: 0,
    overflow: "hidden",
  },
  modalAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  modalTitle: {
    fontSize: "19px",
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
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontSize: "16px",
  },
  modalBody: {
    padding: "24px",
    overflowY: "auto",
  },
  modalCloseBtnBottom: {
    padding: "12px 28px",
    background: "#f8fafc",
    border: "none",
    borderTop: "1px solid #e2e8f0",
    color: "#475569",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    width: "100%",
    transition: "all 0.3s ease",
  },
  profileStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "10px",
    marginBottom: "20px",
  },
  profileStat: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    background: "#f8fafc",
    borderRadius: "10px",
  },
  profileStatValue: {
    display: "block",
    fontSize: "16px",
    fontWeight: "700",
    color: "#0f172a",
  },
  profileStatLabel: {
    display: "block",
    fontSize: "10px",
    color: "#64748b",
  },
  profileDivider: {
    height: "1px",
    background: "#e2e8f0",
    marginBottom: "20px",
  },
  profileDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  profileDetailItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    background: "#f8fafc",
    borderRadius: "10px",
    transition: "all 0.3s ease",
  },
  profileDetailIcon: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#f5a623",
    flexShrink: 0,
  },
  profileDetailLabel: {
    display: "block",
    fontSize: "9px",
    color: "#94a3b8",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  profileDetailValue: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  settingsIconWrapper: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsGroup: {
    marginBottom: "20px",
  },
  settingsGroupTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "10px",
  },
  settingsItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    background: "#f8fafc",
    borderRadius: "10px",
    marginBottom: "8px",
    transition: "all 0.3s ease",
  },
  settingsItemIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  settingsItemDesc: {
    fontSize: "11px",
    color: "#64748b",
  },
  settingsItemBtn: {
    padding: "4px 12px",
    border: "none",
    borderRadius: "8px",
    background: "linear-gradient(135deg, #f9c349 0%, #f5a623 100%)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    transition: "all 0.3s ease",
    whiteSpace: "nowrap",
  },
  settingsSelect: {
    padding: "6px 10px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    background: "#fff",
    cursor: "pointer",
  },
  settingsDivider: {
    height: "1px",
    background: "#e2e8f0",
    marginBottom: "20px",
  },
  discountModalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(12px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
  },
  discountModalContent: {
    background: "#fff",
    borderRadius: "24px",
    maxWidth: "720px",
    width: "95%",
    maxHeight: "92vh",
    overflow: "hidden",
    boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
  },
  discountModalHeader: {
    padding: "18px 24px",
    borderBottom: "2px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(135deg, #fafbfc 0%, #fff 100%)",
    flexShrink: 0,
  },
  discountModalHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  discountModalIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#fff7ed",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  discountModalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  discountModalSubtitle: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  discountModalClose: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    color: "#64748b",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s ease",
    fontSize: "16px",
  },
  discountModalBody: {
    padding: "20px 24px",
    overflowY: "auto",
    flex: 1,
  },
  notificationToast: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    maxWidth: "380px",
  },
  notificationContent: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    padding: "12px 18px",
    borderRadius: "14px",
    boxShadow: "0 10px 40px rgba(245, 158, 11, 0.3)",
    border: "1px solid #f59e0b",
  },
  notificationIcon: {
    fontSize: "18px",
  },
  notificationText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#92400e",
    flex: 1,
  },
  notificationClose: {
    background: "transparent",
    border: "none",
    color: "#92400e",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
  },
};