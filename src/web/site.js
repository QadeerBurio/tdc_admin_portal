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
  { href: "/#brands", label: "for brands" },
  { href: "/#employers", label: "for employers" },
  { href: "/ambassador", label: "campus ambassadors" },
  { href: "/#contact", label: "contact" },
];

export function WebNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Logo />
        <nav className="nav-links" aria-label="main">
          {NAV.map((n) => (
            <a key={n.href} href={n.href}>{n.label}</a>
          ))}
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
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</a>
        ))}
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
          <a href="/#brands">for brands</a>
          <a href="/#employers">for employers</a>
          <Link to="/ambassador">campus ambassadors</Link>
        </div>
        <div className="footer-col">
          <b>partners</b>
          <Link to="/signup">list your brand</Link>
          <Link to="/signup">register as employer</Link>
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
        <span>© {new Date().getFullYear()} tdc, part of MSB Group. all rights reserved.</span>
        <span style={{ display: "flex", gap: 18 }}>
          <a href={LINKS.instagram}>Instagram</a>
          <a href={LINKS.linkedin}>LinkedIn</a>
        </span>
      </div>
    </footer>
  );
}
