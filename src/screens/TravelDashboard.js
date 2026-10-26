// src/screens/TravelDashboard.js
// Travel partner portal: the shell (PortalNav traveler menu on real URLs, design/portal/PortalNav) and the
// dashboard (design/portal/TrDashboard). The shell loads the same data the old dashboard did
// (traveler/bookings, traveler/savings) and hands it to the screens.
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation, Link, Outlet, useOutletContext } from "react-router-dom";
import axios from "axios";
import "../portal/portal.css";
import Ico, { TONES } from "../portal/Ico";
import PortalNav, { TRAVELER_MENU } from "../portal/PortalNav";
import { PageLoading, StatCard, Button, Pill } from "../portal/kit";
import logoInk from "../portal/assets/tdc-logo-ink.png";
import dotSorted from "./dots/sorted.png";
import "./styles/TravelPortal.css";

// path -> menu item
const NAV_FOR_PATH = {
  "/traveler-dashboard": "dashboard",
  "/traveler/packages": "packages",
  "/traveler/bookings": "bookings",
  "/traveler/redeem": "redeem",
  "/traveler/history": "history",
  "/traveler/savings": "savings",
  "/settings": "settings",
};
const LABEL_FOR_NAV = { dashboard: "dashboard", packages: "packages", bookings: "bookings", redeem: "redeem offer", history: "travel history", savings: "student savings", settings: "settings" };

const TravelDashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [savings, setSavings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeOffers: 0,
    totalSaved: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const bookingRes = await axios.get("https://the-deft-crew-production.up.railway.app/api/traveler/bookings",{
          headers: { Authorization: `Bearer ${token}` }
        });
        const savingRes = await axios.get("https://the-deft-crew-production.up.railway.app/api/traveler/savings",
        {
          headers: { Authorization: `Bearer ${token}` }
        });

        const savings = savingRes.data.reduce((acc, curr) => acc + curr.amountSaved, 0);
        setBookings(Array.isArray(bookingRes.data) ? bookingRes.data : []);
        setSavings(Array.isArray(savingRes.data) ? savingRes.data : []);
        setStats({
          totalBookings: bookingRes.data.length,
          activeOffers: savingRes.data.filter(s => s.isActive).length,
          totalSaved: savings
        });
      } catch (err) {
        console.error("Error fetching dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  // the mobile menu closes when the page changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const displayName = user?.name || "Traveler";
  const active = NAV_FOR_PATH[location.pathname];

  return (
    <div className={`tdcp tdcp-shell${isMobileMenuOpen ? " nav-open" : ""}`} data-portal="traveler">
      <PortalNav
        menu={TRAVELER_MENU}
        active={active}
        onSelect={() => setIsMobileMenuOpen(false)}
        userName={displayName}
        userRole="travel partner"
        portalLabel="travel partner"
        onLogout={handleLogout}
        onClose={isMobileMenuOpen ? () => setIsMobileMenuOpen(false) : undefined}
        settingsHref="/settings"
      />
      <div className="tdcp-scrim" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="tdcp-topbar">
          <img src={logoInk} alt="tdc." />
          <span style={{ fontWeight: 700, fontSize: 14 }}>{LABEL_FOR_NAV[active] || "travel partner"}</span>
          <button type="button" className="tdcp-icon-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="open menu" aria-expanded={isMobileMenuOpen} style={{ width: 44, height: 44, borderRadius: 22, border: "1px solid var(--line)", background: "var(--card)" }}>
            <Ico kind="menu" tone="plain" size={20} />
          </button>
        </header>
        <main className="tdcp-main">
          <Outlet context={{ token, user, displayName, stats, bookings, savings, loading }} />
        </main>
      </div>
    </div>
  );
};

export default TravelDashboard;

// ─── dashboard (design/portal/TrDashboard) ──────────────────────────
const rs = (n) => `rs ${Number(n || 0).toLocaleString()}`;
const BOOKING_TONE = { pending: "orange", confirmed: "green", declined: "red", cancelled: "sand", completed: "blue" };
const HOW = ["list a student package with a tdc price.", "students book and pay through you.", "redeem their tdc code to confirm the discount. sorted."];

export function TravelerHome() {
  const navigate = useNavigate();
  const { token, displayName, stats, bookings, loading } = useOutletContext();
  // live packages in the app (read-only for partners today)
  const [livePackages, setLivePackages] = useState(null);

  useEffect(() => {
    if (!token) return;
    axios.get("https://the-deft-crew-production.up.railway.app/api/traveler/packages", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setLivePackages(Array.isArray(res.data) ? res.data.length : 0))
      .catch((err) => { console.error("Error fetching packages", err); setLivePackages(0); });
  }, [token]);

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading your dashboard..." /></div>;

  return (
    <div className="tdcp k-page" data-screen="travel-dashboard">
      <section className="tr-hero" style={{ background: TONES.sky[0] }}>
        <div>
          <p className="tr-hey"><img src={dotSorted} alt="" />welcome back, {displayName}</p>
          <h1>where are students going next<span className="dot" aria-hidden="true">?</span></h1>
          <p className="tr-hero-sub">list student trips, track bookings and redeem tdc offers.</p>
        </div>
        <div className="k-row">
          <Button icon="plus" onClick={() => navigate("/traveler/packages", { state: { create: true } })}>new package</Button>
          <Link to="/traveler/redeem" className="k-btn secondary tr-hero-btn">redeem a code</Link>
        </div>
      </section>

      <div className="k-stats">
        <StatCard label="packages" value={livePackages == null ? "–" : livePackages} sub="live in the app" icon="plane" tone="sky" onClick={() => navigate("/traveler/packages")} />
        <StatCard label="bookings" value={stats.totalBookings} sub="all time" icon="calendar" tone="purple" onClick={() => navigate("/traveler/bookings")} />
        <StatCard label="active offers" value={stats.activeOffers} sub="ready to use" icon="tag" tone="red" onClick={() => navigate("/traveler/redeem")} />
        <StatCard label="students saved" value="–" sub="recorded once redemption goes live" icon="wallet" tone="pink" onClick={() => navigate("/traveler/savings")} />
      </div>

      <div className="tr-dash-grid">
        {bookings.length > 0 ? (
          <section className="k-card tr-list">
            <div className="tr-list-head">
              <h2>recent bookings</h2>
              <Link to="/traveler/bookings" className="tr-see">see all</Link>
            </div>
            {bookings.slice(0, 5).map((b) => (
              <div className="tr-row" key={b._id}>
                <span className="tr-row-i" aria-hidden="true"><Ico kind="plane" tone="plain" size={18} /></span>
                <div className="tr-row-text">
                  <b>{b.packageName || b.packageId?.name || "package"}</b>
                  <span className="k-muted">{[b.travelDate && new Date(b.travelDate).toLocaleDateString(), `${b.numberOfTravelers || 1} ${b.numberOfTravelers === 1 ? "traveller" : "travellers"}`, b.totalAmount != null && rs(b.totalAmount)].filter(Boolean).join(" · ")}</span>
                </div>
                <Pill tone={BOOKING_TONE[b.status] || "sand"}>{b.status || "pending"}</Pill>
              </div>
            ))}
          </section>
        ) : (
          <section className="k-card tr-none">
            <img src={dotSorted} alt="" />
            <h2>no bookings yet<span className="dot" aria-hidden="true">.</span></h2>
            <p>add your first student package and bookings will land here.</p>
            <Link to="/traveler/packages" state={{ create: true }} className="k-btn secondary">create a package</Link>
          </section>
        )}

        <section className="tr-how">
          <h2>how it works</h2>
          <ol>
            {HOW.map((t, i) => (
              <li key={i}><span>{i + 1}</span>{t}</li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
