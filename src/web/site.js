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
  privacy: "privacy@gettdc.pk", // P5a (owner): the one privacy contact, same as the app
  phone: "0324-9287649",
  phoneHref: "tel:+923249287649",
  whatsapp: "https://wa.me/923249287649",
};

// Press coverage: one entry per outlet, each with its pieces (real coverage only; add new outlets at the top).
// Shown as the "featured in" logo strip on the home page and as cards on /founder.
//   logo: { file, w, h }  public/press/logos/<file>.webp and .png (fallback), both committed; w / h the files' size.
//         Shown at the same height, greyscale, full colour on hover / focus. scripts/check-press-logos.js (run before every
//         build) and src/web/press.test.js fail if a file is missing.
//   pieces: kind instagram | linkedin (a post: "featured on Instagram") or article (its headline, optional date)
//   summary: one line for the whole card; then each piece is a link titled with its headline (The Financial Daily)
export const PRESS = [
  { outlet: "Express Tribune", logo: { file: "express-tribune", w: 285, h: 96 }, pieces: [{ kind: "instagram", href: "https://www.instagram.com/p/Df1_QhXkeTn/" }] },
  { outlet: "Verified Pakistan", logo: { file: "verified-pakistan", w: 102, h: 96 }, pieces: [{ kind: "linkedin", href: "https://www.linkedin.com/posts/verifiedpakistanvp_during-a-hiring-drive-pakistani-entrepreneur-activity-7528713799072161792-nKX0" }] },
  {
    outlet: "Clap Pakistan", logo: { file: "clap-pakistan", w: 96, h: 96 },
    pieces: [
      { kind: "article", href: "https://clappakistan.com/why-are-fresh-graduates-struggling-to-get-their-first-interview-majid-shah-bukhari-is-investing-in-a-different-approach/", headline: "Why are fresh graduates struggling to get their first interview? Majid Shah Bukhari is investing in a different approach" },
      { kind: "instagram", href: "https://www.instagram.com/p/DfzMslugQXu/" },
    ],
  },
  {
    // staff-written pieces (filed under Press Releases), so "featuring", not "by"; no author page: the strip links the first
    outlet: "The Financial Daily", logo: { file: "the-financial-daily", w: 96, h: 96 }, summary: "articles featuring Majid Shah Bukhari",
    pieces: [
      { kind: "article", href: "https://thefinancialdaily.com/degrees-without-skills-majid-shah-calls-out-pakistans-broken-talent-pipeline/", headline: "Degrees without skills: Majid Shah calls out Pakistan's broken talent pipeline", date: "May 2026" },
      { kind: "article", href: "https://thefinancialdaily.com/64-of-nation-wasted-to-ignorance-the-talent-shortage-is-a-corporate-myth-majid-shah/", headline: "64% of nation wasted to ignorance: the talent shortage is a corporate myth", date: "May 2026" },
      { kind: "article", href: "https://thefinancialdaily.com/pakistans-youth-budget-grows-while-employment-stagnates-majid-shah/", headline: "Pakistan's youth budget grows while employment stagnates", date: "Jul 2026" },
    ],
  },
  // each Instagram post checked against the account that posted it (hellopakistan, startuppakistansp)
  { outlet: "Hello Pakistan", logo: { file: "hello-pakistan", w: 214, h: 96 }, pieces: [{ kind: "instagram", href: "https://www.instagram.com/p/Dfry68Eo-8B/" }] },
  { outlet: "Startup Pakistan", logo: { file: "startup-pakistan", w: 126, h: 96 }, pieces: [{ kind: "instagram", href: "https://www.instagram.com/p/DfrqDLDCdol/" }] },
];
const PIECE = {
  instagram: { line: "featured on Instagram", link: "view on Instagram" },
  linkedin: { line: "featured on LinkedIn", link: "view on LinkedIn" },
  article: { line: "", link: "read the article" },
};
/** one line about a piece: its headline (and date), or "featured on Instagram / LinkedIn" */
export const pieceLine = (p) => (p.headline ? `${p.headline}${p.date ? ` (${p.date})` : ""}` : PIECE[p.kind].line);
/** the link text for a piece: "read the article", "view on Instagram", "view on LinkedIn" */
export const pieceLink = (p) => PIECE[p.kind].link;
/** the link's full label, e.g. "Express Tribune: view on Instagram (opens in a new tab)"; for an outlet with a summary
 *  (links titled with the headline): "The Financial Daily: <headline> (opens in a new tab)" */
export const pieceLabel = (o, p) => (o.summary ? `${o.outlet}: ${p.headline} (opens in a new tab)` : `${o.outlet}: ${pieceLink(p)}${p.headline ? `, ${p.headline}` : ""} (opens in a new tab)`);
export const PRESS_LOGO_H = 48; // every logo is shown this tall
/** a logo's width at PRESS_LOGO_H (from the file's size), so the space is kept while it loads */
export const logoWidth = (l) => Math.round((l.w / l.h) * PRESS_LOGO_H);
/** a logo's committed file in public/: logoPath(logo, "webp" | "png") */
export const logoPath = (l, ext) => `${process.env.PUBLIC_URL || ""}/press/logos/${l.file}.${ext}`;
/** a press / partner logo: WebP, with the PNG for browsers without WebP; lazy, its size kept while it loads */
export function PressLogo({ logo, alt, className }) {
  return (
    <picture className="press-pic">
      <source type="image/webp" srcSet={logoPath(logo, "webp")} />
      <img className={className} src={logoPath(logo, "png")} alt={alt} height={PRESS_LOGO_H} width={logoWidth(logo)} loading="lazy" decoding="async" />
    </picture>
  );
}

// University partners (a signed agreement, not press): a small row on the home page and a section on /founder.
export const PARTNERS = [
  { name: "Ziauddin University", logo: { file: "ziauddin-university", w: 264, h: 96 }, href: "https://zu.edu.pk/mou-with-the-deft-crew/", line: "MoU signed with The Deft Crew", link: "read about the MoU" },
];
export const partnerLabel = (p) => `${p.name}: ${p.link} (opens in a new tab)`;

/** "university partners" row (home page): each partner's logo opens its page in a new tab. */
export function PartnersRow({ style }) {
  const id = React.useId();
  return (
    <div className="featured partners-row" style={style} data-partners="row">
      <p className="featured-label" id={id}>university partners</p>
      <ul className="featured-list" aria-labelledby={id}>
        {PARTNERS.map((p) => (
          <li key={p.name}>
            <a href={p.href} target="_blank" rel="noopener noreferrer" className="featured-logo" aria-label={partnerLabel(p)}>
              <PressLogo logo={p.logo} alt={p.name} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "featured in" strip: each outlet's logo (or name) opens its main piece in a new tab. story: a "read the story" link
 *  to /founder (the home page). */
export function FeaturedIn({ style, story = false }) {
  const id = React.useId();
  return (
    <div className="featured" style={style} data-press="strip">
      <p className="featured-label" id={id}>featured in</p>
      <ul className="featured-list" aria-labelledby={id}>
        {PRESS.map((o) => {
          const p = o.pieces[0];
          return (
            <li key={o.outlet}>
              {o.logo ? (
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="featured-logo" aria-label={pieceLabel(o, p)}>
                  <PressLogo logo={o.logo} alt={o.outlet} />
                </a>
              ) : (
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="featured-name" aria-label={pieceLabel(o, p)}>{o.outlet}</a>
              )}
            </li>
          );
        })}
      </ul>
      {story && <Link to="/founder" className="featured-story">read the story <Arrow size={16} /></Link>}
    </div>
  );
}

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

// 24px stroke icons for the icon tiles (drawn for tdc, no icon library).
export const ICONS = {
  tag: "M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z",
  briefcase: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  calendar: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  store: "M4 10v10h16V10M3 10l2-6h14l2 6zM10 20v-5h4v5",
  cap: "M2 9l10-5 10 5-10 5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6",
  percent: "M19 5L5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1.5-3-5-3-5-1s3 1 5 1zM12 7c1.5-3 5-3 5-1s-3 1-5 1z",
  plus: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v8M8 12h8",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2",
  check: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
  chart: "M4 20h16M7 16v-5M12 16V7M17 16v-8",
  megaphone: "M3 10v4h4l6 4V6l-6 4zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12",
  userPlus: "M15 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19 8v6M16 11h6",
  users: "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM22 20v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  grid: "M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z",
  list: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  building: "M3 21h18M5 21V10M19 21V10M9 21v-6h6v6M2 10l10-6 10 6",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
  star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z",
};

// Icon tile: rounded square, yellow-soft, ink stroke. n adds the step number (read by screen readers).
export function IconTile({ d, n }) {
  return (
    <span className="icon-tile">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />
      </svg>
      {n != null && <b className="icon-tile-n">{n}</b>}
    </span>
  );
}

// Stat that counts up from 0 once when it scrolls into view: "100+", "3", "12+", "15–60%" (both numbers count).
// About 1.2 s, ease-out. Writes straight to the DOM (no re-renders). Reduced motion or no IntersectionObserver:
// the final value shows at once. Screen readers only get the final value.
export function CountUp({ value }) {
  const text = String(value);
  const live = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = live.current;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduce || !("IntersectionObserver" in window)) return undefined;
    const at = (p) => text.replace(/\d+/g, (d) => String(Math.round(Number(d) * p)));
    el.textContent = at(0);
    let raf;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - start) / 1200);
        el.textContent = k < 1 ? at(1 - Math.pow(1 - k, 3)) : text;
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); el.textContent = text; };
  }, [text]);
  return (
    <span className="count">
      <span className="count-size" aria-hidden="true">{text}</span>
      <span className="count-live" aria-hidden="true" ref={live}>{text}</span>
      <span className="sr-only">{text}</span>
    </span>
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

// Fade and rise for sections and cards as they scroll into view (once, staggered 70 ms within a row).
// Only things below the first screen are hidden, so the hero and first paint are untouched.
// Cards that arrive later (deals, logos) are picked up too. Off under reduced motion.
const REVEAL = ".section-head, .grid > *, .grid-2 > *, .facts .fact, .band-soft > h2, .cta-box, .logo-grid > *, .brand-grid > *, .partners, .dark-inner > div:not(.grid)";
function useReveal() {
  React.useEffect(() => {
    const main = document.querySelector(".tdcw main");
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!main || reduce || !("IntersectionObserver" in window)) return undefined;
    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      io.unobserve(el);
      const done = (ev) => { if (ev.target !== el) return; el.classList.add("rv-done"); el.removeEventListener("transitionend", done); };
      el.addEventListener("transitionend", done);
      el.classList.add("in");
    }), { rootMargin: "0px 0px -8% 0px" });
    const scan = () => {
      main.querySelectorAll(REVEAL).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        for (let a = el.parentElement; a && a !== main; a = a.parentElement) if (seen.has(a)) return;
        if (el.getBoundingClientRect().top < window.innerHeight) return;
        const row = [...el.parentElement.children].filter((c) => c.matches(REVEAL));
        el.style.setProperty("--i", Math.min(row.indexOf(el), 5));
        el.classList.add("rv");
        io.observe(el);
      });
    };
    scan();
    let raf;
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(scan); });
    mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); };
  }, []);
}

export function WebNav() {
  const [open, setOpen] = useState(false);
  useReveal();
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
          <Link to="/founder">meet the founder</Link>
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
          <Link to="/privacy">privacy</Link>
          <Link to="/child-safety">Child Safety Standards</Link>
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
        <footer style={{ padding: "0 24px 28px", textAlign: "center", fontSize: 13.5 }} className="muted help-foot">
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
      <h1 style={{ fontWeight: 800, fontSize: 34, letterSpacing: -1, lineHeight: 1.1 }}>{title}<span className="dot" aria-hidden={mark === "." ? "true" : undefined}>{mark}</span></h1>
      {sub && <p className="muted" style={{ marginTop: 8, fontSize: 15 }}>{sub}</p>}
    </div>
  );
}

// Tab titles follow the design boards: "tdc. partner log in", "tdc. for brands", ...
export const pageTitle = (name) => `tdc. ${String(name).replace(/\s*·\s*tdc\.?\s*$/, "").replace(/^tdc\.\s*/, "")}`;

// Sets the tab title (and, when given, the page's meta description, put back on leaving) and starts each page at the top.
export function usePage(title, description) {
  React.useEffect(() => {
    document.title = pageTitle(title);
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [title]);
  React.useEffect(() => {
    if (!description) return undefined;
    let meta = document.querySelector('meta[name="description"]');
    const made = !meta;
    if (made) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
    const before = meta.getAttribute("content");
    meta.setAttribute("content", description);
    return () => { if (made) meta.remove(); else meta.setAttribute("content", before || ""); };
  }, [description]);
}

// aside: optional second column (the boards' hero cards), side by side from 760px up
export function PageHero({ eyebrow, title, mark = ".", lead, children, aside }) {
  const text = (
    <div>
      {eyebrow && <span className="chip"><span className="chip-dot" />{eyebrow}</span>}
      <h1 className="h-xl" style={{ marginTop: 20, fontSize: "clamp(42px, 5.6vw, 76px)" }}>{title}<span className="dot" aria-hidden={mark === "." ? "true" : undefined}>{mark}</span></h1>
      {lead && <p className="lead" style={{ marginTop: 20, maxWidth: aside ? 560 : 620 }}>{lead}</p>}
      {children}
    </div>
  );
  if (!aside) return <div className="wrap" style={{ paddingTop: 64, paddingBottom: 8 }}>{text}</div>;
  return (
    <div className="wrap hero-split" style={{ paddingTop: 64, paddingBottom: 8 }}>
      {text}
      {aside}
    </div>
  );
}
