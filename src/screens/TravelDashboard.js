import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Components
import Package from "./AdminPackage";
import Traveling from './Traveling'
// Icons
import {
  FaPlane, FaTicketAlt, FaSignOutAlt, FaSearch, 
  FaMapMarkedAlt, FaHome,  FaCheckCircle, FaWallet
} from "react-icons/fa";

const TravelDashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [stats, setStats] = useState({ 
    totalBookings: 0, 
    activeOffers: 0, 
    totalSaved: 0 
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const bookingRes = await axios.get("https://the-deft-crew-production.up.railway.app/api/traveler/bookings", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const savingRes = await axios.get("https://the-deft-crew-production.up.railway.app/api/traveler/savings", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const savings = savingRes.data.reduce((acc, curr) => acc + curr.amountSaved, 0);
        setStats({
          totalBookings: bookingRes.data.length,
          activeOffers: savingRes.data.filter(s => s.isActive).length,
          totalSaved: savings
        });
      } catch (err) {
        console.error("Error fetching dashboard stats", err);
      }
    };
    if (token) fetchStats();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { id: "home", label: "Dashboard", icon: <FaHome /> },
    { id: "browseOffers", label: "Browse Offers", icon: <FaSearch /> },
    { id: "myClaims", label: "My Bookings", icon: <FaTicketAlt /> },
    { id: "redeemOffer", label: "Redeem Offer", icon: <FaWallet /> },
    { id: "travelHistory", label: "Travel History", icon: <FaMapMarkedAlt /> },
    { id: "savingsTracker", label: "My Savings", icon: <FaPlane /> },
  ];

  const renderHome = () => (
    <div style={styles.homeContainer}>
      <div style={styles.welcomeHero}>
        <div style={{ zIndex: 2 }}>
          <h2 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>
            Welcome back, {user?.name || "Traveler"}! 
          </h2>
          <p style={{ opacity: 0.9, marginTop: "10px", fontSize: "16px" }}>
            Discover exclusive student offers and plan your next journey.
          </p>
        </div>
      </div>
      
      <div style={styles.statsGrid}>
        <StatCard 
          icon={<FaTicketAlt />} 
          color="#f97316" 
          bg="#fff7ed" 
          label="My Bookings" 
          value={stats.totalBookings} 
          trend="Travel Plans"
        />
        <StatCard 
          icon={<FaCheckCircle />} 
          color="#10b981" 
          bg="#f0fdf4" 
          label="Active Offers" 
          value={stats.activeOffers} 
          trend="Ready to Use"
        />
        <StatCard 
          icon={<FaWallet />} 
          color="#3b82f6" 
          bg="#eff6ff" 
          label="Total Saved" 
          value={`PKR ${stats.totalSaved.toLocaleString()}`} 
          trend="Student Savings"
        />
      </div>
    </div>
  );

  // Animation wrapper for main content
  const renderAnimatedContent = () => {
    let content;
    switch(activeTab) {
      case "home":
        content = renderHome();
        break;
      case "browseOffers":
        content = <Traveling />;
        break;
      case "myClaims":
        content = <Package />;
        break;
      case "redeemOffer":
        content = <Package />;
        break;
      case "travelHistory":
        content = <Package />;
        break;
      default:
        content = <Package />;
    }
    
    return (
      <div className="animated-content" key={activeTab}>
        {content}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <nav style={styles.sidebar}>
        <div style={styles.brandSection}>
          <div style={styles.logoBadge}>tdc<span style={{color:'#ff961a'}}>.</span></div>
          <h2 style={styles.logoText}>Traveler <span style={{fontWeight: '300'}}>Portal</span></h2>
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
              <span style={styles.navLabel}>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={styles.logoutWrapper}>
          <div style={styles.logoutBtn} onClick={handleLogout} className="logout-hover">
            <FaSignOutAlt />
            <span style={styles.navLabel}>Logout</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area with Animations */}
      <main style={styles.mainContent}>
        <div style={styles.contentWrapper}>
          {renderAnimatedContent()}
        </div>
      </main>

      <style>
        {`
          @keyframes fadeIn { 
            from { opacity: 0; transform: translateY(15px); } 
            to { opacity: 1; transform: translateY(0); } 
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes rotateIn {
            from { opacity: 0; transform: rotate(-3deg) scale(0.98); }
            to { opacity: 1; transform: rotate(0) scale(1); }
          }
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.9); }
            50% { opacity: 0.5; transform: scale(1.02); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
          }
          
          .nav-link { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); margin: 4px 0; }
          .nav-link:hover { background-color: rgba(255,255,255,0.1) !important; transform: translateX(5px); }
          .stat-card { transition: all 0.3s ease; }
          .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .logout-hover:hover { background: rgba(255,255,255,0.1); color: #fff !important; }
          
          /* Main Content Animations */
          .animated-content {
            animation: scaleIn 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          }
          
          /* Stagger animation for stat cards */
          .animated-content .stat-card {
            opacity: 0;
            animation: slideInRight 0.5s ease forwards;
          }
          .animated-content .stat-card:nth-child(1) { animation-delay: 0.1s; }
          .animated-content .stat-card:nth-child(2) { animation-delay: 0.2s; }
          .animated-content .stat-card:nth-child(3) { animation-delay: 0.3s; }
          
          /* Hero section animation */
          .animated-content .welcome-hero,
          .animated-content [style*="welcomeHero"] {
            animation: slideInLeft 0.5s ease-out;
          }
          
          /* Component wrapper animation */
          .animated-content > div {
            animation: fadeIn 0.4s ease-out;
          }
          
          /* Form elements animation for create offer */
          .animated-content form,
          .animated-content .form-container {
            animation: slideInRight 0.4s ease-out;
          }
          
          /* Table rows animation */
          .animated-content table tbody tr {
            opacity: 0;
            animation: slideInRight 0.3s ease forwards;
          }
          .animated-content table tbody tr:nth-child(1) { animation-delay: 0.05s; }
          .animated-content table tbody tr:nth-child(2) { animation-delay: 0.1s; }
          .animated-content table tbody tr:nth-child(3) { animation-delay: 0.15s; }
          .animated-content table tbody tr:nth-child(4) { animation-delay: 0.2s; }
          .animated-content table tbody tr:nth-child(5) { animation-delay: 0.25s; }
          
          /* Card elements animation */
          .animated-content .card,
          .animated-content [class*="Card"] {
            animation: scaleIn 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1);
          }
          
          /* Button hover effects */
          .animated-content button {
            transition: all 0.2s ease;
          }
          .animated-content button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          
          /* Loading shimmer effect */
          .loading-shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 1000px 100%;
            animation: shimmer 1.5s infinite;
          }
          
          /* Scrollbar styling */
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

// Reusable Stat Card Component
const StatCard = ({ icon, color, bg, label, value, trend }) => (
  <div style={styles.summaryCard} className="stat-card">
    <div style={{...styles.cardIcon, backgroundColor: bg}}>{React.cloneElement(icon, { color })}</div>
    <div>
      <span style={styles.cardLabel}>{label}</span>
      <h2 style={styles.cardValue}>{value}</h2>
      <div style={{...styles.trend, color}}>{trend}</div>
    </div>
  </div>
);

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
    padding: "32px 16px",
    display: "flex",
    flexDirection: "column",
    color: "#fff",
    borderRadius:"30px",
    margin:'5px'
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
    width: "36px", 
    height: "36px", 
    borderRadius: "14px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontWeight: "800", 
    fontSize: "14px" 
  },
  logoText: { margin: 0, fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" },
  navGroup: { flex: 1 },
  navItem: { 
    padding: "12px 16px", 
    borderRadius: "14px", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    fontSize: "14px" 
  },
  icon: { fontSize: "20px", display: "flex", alignItems: "center" },
  navLabel: { marginLeft: "12px" },
  logoutWrapper: { marginTop: "auto", paddingTop: "20px" },
  logoutBtn: { 
    padding: "12px 16px", 
    borderRadius: "14px", 
    color: "rgba(255,255,255,0.8)", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    transition: "0.3s" 
  },
  mainContent: { flex: 1, padding: "24px", overflow: "hidden" },
  contentWrapper: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: "32px", 
    boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
    padding: "32px",
    overflowY: "auto",
  },
  homeContainer: { animation: "fadeIn 0.5s ease-out" },
  welcomeHero: {
    padding: "40px",
    backgroundImage: "linear-gradient(135deg, #ff961a 0%, #f3b245 100%)",
    borderRadius: "24px",
    color: "#fff",
    marginBottom: "32px",
    position: "relative",
    overflow: "hidden"
  },
  statsGrid: { 
    display: "grid", 
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
    gap: "24px" 
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: "24px",
    borderRadius: "24px",
    border: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  cardIcon: { 
    width: "60px", 
    height: "60px", 
    borderRadius: "18px", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    fontSize: "24px" 
  },
  cardLabel: { fontSize: "12px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" },
  cardValue: { margin: "4px 0", fontSize: "28px", color: "#1e293b", fontWeight: "800" },
  trend: { fontSize: "13px", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px"}
};

export default TravelDashboard;