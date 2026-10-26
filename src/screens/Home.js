// src/screens/Home.js
// Brand portal: the shell (PortalNav brand menu on real URLs, design/portal/PortalNav) and the dashboard
// (design/portal/BrDashboard). The shell loads the same data the old Home did and opens the first-discount
// popup when the brand has no offer yet.
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation, Link, Outlet, useOutletContext } from "react-router-dom";
import axios from "axios";
import "../portal/portal.css";
import Ico from "../portal/Ico";
import PortalNav, { BRAND_MENU } from "../portal/PortalNav";
import { PageLoading, StatCard, Pill, Modal, toast } from "../portal/kit";
import logoInk from "../portal/assets/tdc-logo-ink.png";
import dotSorted from "./dots/sorted.png";
import Discount from "./Discount";
import "./styles/BrandPortal.css";

// path -> menu item (create offer sits under discounts, claimed users under redemptions)
const NAV_FOR_PATH = {
  "/home": "dashboard",
  "/discount": "discounts",
  "/create-offer": "discounts",
  "/Branches": "branches",
  "/verifyclaim": "verify",
  "/BrandVerifyScreen": "verify",
  "/verifyrward": "reward",
  "/savinghistory": "redemptions",
  "/claimedUsers": "redemptions",
  "/settings": "settings",
};
const LABEL_FOR_NAV = { dashboard: "dashboard", discounts: "discounts", branches: "branches", verify: "verify student", reward: "verify reward", redemptions: "redemptions", settings: "settings" };

export default function Home() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState({
    totalLeads: 0,
    completedRedemptions: 0,
    totalSavings: 0,
    totalRevenue: 0,
  });
  const [leads, setLeads] = useState([]);
  const [savings, setSavings] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [brandData, setBrandData] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [hasOffers, setHasOffers] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [offerCreated, setOfferCreated] = useState(false);

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchBrandData();
      fetchOffers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // the mobile menu closes when the page changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const fetchOffers = async () => {
    try {
      const res = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/my-offers",
        {
          headers: { Authorization: `Bearer ${token}` },
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
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const savingRes = await axios.get(
        "https://the-deft-crew-production.up.railway.app/api/offers/savings-report",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const savings = savingRes.data.reduce((acc, curr) => acc + curr.saved, 0);
      const revenue = savingRes.data.reduce(
        (acc, curr) => acc + (curr.bill - curr.saved),
        0
      );

      setLeads(Array.isArray(leadRes.data) ? leadRes.data : []);
      setSavings(Array.isArray(savingRes.data) ? savingRes.data : []);
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
    navigate("/create-offer");
    setIsMobileMenuOpen(false);
  };

  const handleCloseDiscountModal = () => {
    if (!hasOffers) {
      toast("Please create your first Discount to get started!");
      return;
    }
    setShowDiscountModal(false);
  };

  const refreshOffers = () => {
    fetchOffers();
  };

  const handleOfferCreated = () => {
    setShowDiscountModal(false);
    setHasOffers(true);
    setOfferCreated(true);
    fetchOffers();
    navigate("/discount");
  };

  const getBrandName = () => {
    return (
      brandData?.brandName ||
      brandData?.companyName ||
      user?.brandName ||
      user?.companyName ||
      "Brand"
    );
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
  const active = NAV_FOR_PATH[location.pathname];

  return (
    <div className={`tdcp tdcp-shell${isMobileMenuOpen ? " nav-open" : ""}`} data-portal="brand">
      <PortalNav
        menu={BRAND_MENU}
        active={active}
        onSelect={() => setIsMobileMenuOpen(false)}
        userName={brandName}
        userRole="brand partner"
        portalLabel="brand portal"
        onLogout={handleLogout}
        onClose={isMobileMenuOpen ? () => setIsMobileMenuOpen(false) : undefined}
        settingsHref="/settings"
      />
      <div className="tdcp-scrim" onClick={() => setIsMobileMenuOpen(false)} aria-hidden="true" />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <header className="tdcp-topbar">
          <img src={logoInk} alt="tdc." />
          <span style={{ fontWeight: 700, fontSize: 14 }}>{LABEL_FOR_NAV[active] || "brand portal"}</span>
          <button type="button" className="tdcp-icon-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="open menu" aria-expanded={isMobileMenuOpen} style={{ width: 44, height: 44, borderRadius: 22, border: "1px solid var(--line)", background: "var(--card)" }}>
            <Ico kind="menu" tone="plain" size={20} />
          </button>
        </header>
        <main className="tdcp-main">
          <Outlet context={{ stats, leads, savings, offers, loading, brandName, displayName, logoUrl, brandData, refreshOffers }} />
        </main>
      </div>

      {/* first discount: shown until the brand has one */}
      <Modal
        open={showDiscountModal && !loading}
        onClose={handleCloseDiscountModal}
        size="lg"
        icon="tag"
        tone="yellow"
        title="create your first discount"
        sub="one flat offer for tdc verified users. you can edit it any time."
      >
        <Discount onOfferCreated={handleOfferCreated} />
      </Modal>
    </div>
  );
}

// ─── dashboard (design/portal/BrDashboard) ───────────────────────────
const rs = (n) => `rs ${Number(n || 0).toLocaleString()}`;
const timeAgo = (d) => {
  if (!d) return "";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString();
};

export function BrandDashboard() {
  const { stats, leads, offers, loading, brandName } = useOutletContext();

  if (loading) return <div className="tdcp k-page"><PageLoading label="loading your dashboard…" /></div>;

  // recent claims, newest first
  const recent = [...leads].sort((a, b) => new Date(b.claimedAt || 0) - new Date(a.claimedAt || 0)).slice(0, 5);
  // where they study: claims per institute, from the same list
  const byUni = {};
  leads.forEach((l) => { const k = l.universityName || "other"; byUni[k] = (byUni[k] || 0) + 1; });
  const unis = Object.entries(byUni).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const top = unis.length ? unis[0][1] : 1;
  const live = [...offers].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

  return (
    <div className="tdcp k-page br-dash" data-screen="brand-dashboard">
      <div className="k-head">
        <div style={{ minWidth: 0 }}>
          <p className="br-hey"><img src={dotSorted} alt="" />hey {brandName}</p>
          <h1>here's how students are finding you<span className="dot" aria-hidden="true">.</span></h1>
        </div>
        <div className="k-actions">
          <Link to="/verifyclaim" className="k-btn accent">verify a student</Link>
          <Link to="/discount" className="k-btn primary">manage discount</Link>
        </div>
      </div>

      <div className="k-stats">
        <StatCard label="total claims" value={stats.totalLeads.toLocaleString()} sub="students who saved your discount" icon="tag" tone="red" />
        <StatCard label="redemptions" value={stats.completedRedemptions.toLocaleString()} sub="completed at your counter" icon="check" tone="green" />
        <StatCard label="revenue from tdc" value={rs(stats.totalRevenue)} sub="from bills" icon="coin" tone="orange" />
        <StatCard label="students saved" value={rs(stats.totalSavings)} sub="across all visits" icon="heart" tone="pink" />
      </div>

      <div className="br-dash-grid">
        <section className="k-card br-claims">
          <div className="br-claims-head">
            <h2>recent claims</h2>
            <span className="k-hint">{leads.length.toLocaleString()} in total</span>
          </div>
          {recent.length === 0 ? (
            <p className="k-hint" style={{ padding: "0 22px 22px", margin: 0 }}>no claims yet. they show here as soon as a student saves your discount.</p>
          ) : (
            recent.map((c, i) => (
              <div className="br-claim" key={c._id || i}>
                <span className="br-claim-i">{(c.universityName || "t").charAt(0).toLowerCase()}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>tdc verified user · {c.universityName || "institute"}</b>
                  <div className="k-hint">{[timeAgo(c.claimedAt), c.offerTitle].filter(Boolean).join(" · ")}</div>
                </div>
                <Pill tone="yellow">claimed</Pill>
              </div>
            ))
          )}
        </section>

        <div className="br-side">
          <section className="br-live">
            <div className="br-live-lbl">your live discount</div>
            {live ? (
              <div className="br-live-row">
                <span className="br-live-logo">{(brandName || "b").charAt(0).toLowerCase()}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="br-live-pct">{live.discountPercentage}% off</div>
                  <div className="br-live-meta">{[live.category, live.isInStore && live.isOnline ? "in-store and online" : live.isInStore ? "in-store" : live.isOnline ? "online" : ""].filter(Boolean).join(" · ")}</div>
                </div>
                <Link to="/discount" className="k-btn secondary sm">edit</Link>
              </div>
            ) : (
              <p className="br-live-meta" style={{ margin: "10px 0 0" }}>no discount live yet.</p>
            )}
          </section>

          <section className="k-card pad">
            <h2 className="br-h2">where they study</h2>
            {unis.length === 0 ? (
              <p className="k-hint" style={{ margin: "12px 0 0" }}>shows once students claim your discount.</p>
            ) : (
              <div className="br-unis">
                {unis.map(([name, n]) => (
                  <div key={name}>
                    <div className="br-uni-row"><b>{name}</b><span className="k-muted">{n} claim{n === 1 ? "" : "s"}</span></div>
                    <div className="k-progress"><i style={{ width: `${Math.round((n / top) * 100)}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
            <p className="k-hint" style={{ margin: "14px 0 0" }}>numbers only. tdc never shares students' personal data.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
