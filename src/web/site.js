// Shared pieces for the public site (landing, sign up, log in, ambassador).
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./web.css";
import logoInk from "./assets/tdc-logo-ink.png";
import logoWhite from "./assets/tdc-logo-white.png";

export const LINKS = {
  getApp: "https://go.gettdc.pk",
  appStore: "https://apps.apple.com/pk/app/the-deft-crew/id6765877675",
  playStore: "https://play.google.com/store/apps/details?id=com.aqkhan110.tdc",
  instagram: "https://www.instagram.com/tdc.app/",
  linkedin: "https://www.linkedin.com/company/thedeftcrew/",
  hello: "hello@gettdc.pk",
  hr: "hr@gettdc.pk",
  phone: "0324-9287649",
  phoneHref: "tel:+923249287649",
  whatsapp: "https://wa.me/923249287649",
};

export function Logo({ dark = false, size = "", to = "/" }) {
  return (
    <Link to={to} className={`logo ${size}`} aria-label="tdc. home">
      <img src={dark ? logoWhite : logoInk} alt="tdc." />
    </Link>
  );
}

export function Arrow({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const NAV = [
  { href: "/#app", label: "the app" },
  { href: "/brands", label: "for brands" },
  { href: "/company_profile", label: "for employers" },
  { href: "/OfferImagesGallery", label: "deals" },
  { href: "/ambassador", label: "campus ambassadors" },
  { href: "/#contact", label: "contact" },
];

// Section links (with #) are plain anchors; page links use the router.
function NavLink({ item, onClick }) {
  if (item.href.includes("#")) return <a href={item.href} onClick={onClick}>{item.label}</a>;
  return <Link to={item.href} onClick={onClick}>{item.label}</Link>;
}

export function WebNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="main">
          {NAV.map((n) => <NavLink key={n.href} item={n} />)}
        </nav>
        <div className="nav-actions">
          <Link to="/login" className="nav-login">log in</Link>
          <a href={LINKS.getApp} className="btn btn-primary btn-sm">get the app</a>
        </div>
        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? "close menu" : "open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      <div className={`nav-mobile ${open ? "open" : ""}`}>
        {NAV.map((n) => <NavLink key={n.href} item={n} onClick={() => setOpen(false)} />)}
        <Link to="/login" onClick={() => setOpen(false)}>partner log in</Link>
        <a href={LINKS.getApp} className="btn btn-primary btn-block">get the app</a>
      </div>
    </header>
  );
}

export function WebFooter() {
  return (
    <footer className="footer" id="contact">
      <div className="wrap footer-grid">
        <div className="footer-col">
          <Logo size="lg" />
          <p className="muted" style={{ marginTop: 6 }}>student life, sorted. part of MSB Group.</p>
        </div>
        <div className="footer-col">
          <b>explore</b>
          <a href="/#app">the app</a>
          <Link to="/OfferImagesGallery">brands and deals</Link>
          <Link to="/universities">partner universities</Link>
          <Link to="/AppStoreReviews">reviews</Link>
          <Link to="/ambassador">campus ambassadors</Link>
          <a href="/#campus">for campuses</a>
        </div>
        <div className="footer-col">
          <b>partners</b>
          <Link to="/brands">for brands</Link>
          <Link to="/company_profile">for employers</Link>
          <Link to="/signup">become a partner</Link>
          <Link to="/login">partner log in</Link>
        </div>
        <div className="footer-col">
          <b>say hi</b>
          <a href={`mailto:${LINKS.hello}`}>{LINKS.hello}</a>
          <span className="muted" style={{ fontSize: 14, marginTop: -6 }}>brands, partnerships, support</span>
          <a href={`mailto:${LINKS.hr}`}>{LINKS.hr}</a>
          <span className="muted" style={{ fontSize: 14, marginTop: -6 }}>careers, campus ambassadors</span>
          <a href={LINKS.phoneHref}>{LINKS.phone}</a>
          <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">chat on WhatsApp</a>
          <span className="muted">DHA Phase 6, Karachi</span>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} tdc, part of MSB Group.</span>
        <span style={{ display: "flex", gap: 18 }}>
          <a href={LINKS.instagram}>Instagram</a>
          <a href={LINKS.linkedin}>LinkedIn</a>
        </span>
      </div>
    </footer>
  );
}

// Centered card layout used by log in, forgot password, OTP and reset password.
export function AuthShell({ children, headerAction }) {
  return (
    <div className="tdcw">
      <div className="center-shell">
        <header className="wrap row-between" style={{ width: "100%", paddingTop: 20, paddingBottom: 20 }}>
          <Logo />
          {headerAction}
        </header>
        <main>{children}</main>
        <footer style={{ padding: "0 24px 28px", textAlign: "center", fontSize: 13.5 }} className="muted">
          need help? <a href={`mailto:${LINKS.hello}`} style={{ color: "#6B675E" }}>{LINKS.hello}</a>
          {" · "}
          <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer" style={{ color: "#6B675E" }}>WhatsApp</a>
        </footer>
      </div>
    </div>
  );
}

export function CardTitle({ title, sub, mark = "." }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h1 style={{ fontWeight: 800, fontSize: 34, letterSpacing: -1, lineHeight: 1.1 }}>{title}<span className="dot">{mark}</span></h1>
      {sub && <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>{sub}</p>}
    </div>
  );
}

// Tab titles follow the design boards: "tdc. partner log in", "tdc. for brands", ...
export const pageTitle = (name) => `tdc. ${String(name).replace(/\s*·\s*tdc\.?\s*$/, "").replace(/^tdc\.\s*/, "")}`;

// Sets the tab title and starts each page at the top.
export function usePage(title) {
  React.useEffect(() => {
    document.title = pageTitle(title);
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [title]);
}

export function PageHero({ eyebrow, title, mark = ".", lead, children }) {
  return (
    <div className="wrap" style={{ paddingTop: 64, paddingBottom: 8 }}>
      {eyebrow && <span className="chip"><span className="chip-dot" />{eyebrow}</span>}
      <h1 className="h-xl" style={{ marginTop: 20, fontSize: "clamp(42px, 5.6vw, 76px)" }}>{title}<span className="dot">{mark}</span></h1>
      {lead && <p className="lead" style={{ marginTop: 20, maxWidth: 620 }}>{lead}</p>}
      {children}
    </div>
  );
}
