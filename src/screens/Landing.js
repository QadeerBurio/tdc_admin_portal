// Landing.js — public home page (gettdc.pk), in the same design system as the tdc app.
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { WebNav, WebFooter, LINKS, Arrow } from "../web/site";
import logoInk from "../web/assets/tdc-logo-ink.png";

const API = "https://the-deft-crew-production.up.railway.app/api";

const FACTS = [
  { n: "100+", label: "partner brands" },
  { n: "3", label: "cities: Karachi, Lahore, Islamabad" },
  { n: "7+", label: "partner universities" },
  { n: "15–50%", label: "flat student discounts" },
];

const TOOLS = [
  { title: "deals", body: "flat discounts at cafes, salons, gyms, fashion and more. claim in the app, scan at the counter.", icon: "M20 12l-8 8-9-9V3h8l9 9zM7.5 7.5h.01" },
  { title: "campus feed", body: "posts, polls and anonymous confessions from students like you. the part everyone opens first.", icon: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" },
  { title: "career hub", body: "internships and entry-level jobs with a match score once your CV and work profile are done.", icon: "M4 8h16v11H4zM9 8V5h6v3M4 13h16" },
  { title: "cv builder", body: "build a clean CV on your phone and keep it ready for every application.", icon: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" },
  { title: "events and scholarships", body: "campus events, student-priced tickets and scholarships if you're planning to study abroad.", icon: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4" },
  { title: "ai travel assistant", body: "plan a trip on a student budget. it suggests the route and the plan, you decide.", icon: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" },
];

const STEPS = [
  { title: "claim it", body: "pick a brand in the app and tap claim." },
  { title: "scan at the counter", body: "scan the brand's tdc QR code. your profile gets verified on the spot." },
  { title: "sorted.", body: "the discount is applied. that visit also earns you crew points." },
];

const LEVELS = [
  { name: "rookie", pts: "300 pts", dot: "#FFFFFF" },
  { name: "main character", pts: "1,000 pts", dot: "#FFF1CC" },
  { name: "pro", pts: "3,000 pts", dot: "#F9C349" },
  { name: "goat", pts: "6,000 pts", dot: "#111111" },
  { name: "founder circle", pts: "8,000 pts + apply", dot: "#F9C349" },
];

const BRAND_POINTS = [
  { title: "free for year one", body: "no listing fee and no commission for the first year." },
  { title: "no leakage", body: "a brand-only QR. only verified tdc users can claim, and your staff completes every redemption." },
  { title: "live in your portal", body: "every claim shows up in real time, with which institutes your customers come from." },
  { title: "simple terms", body: "you set a flat discount from 15% to 50%. either side can exit with 15 working days' notice." },
];

// Shown only if the live brand list can't be loaded.
const FALLBACK_BRANDS = [
  ["Jenpharm", "health and beauty"], ["Dear Croissant", "food and drinks"], ["Socials by YS", "restaurant"],
  ["Spark Saloon", "salon"], ["Fropresso", "cafe"], ["House of Burger", "restaurant"],
  ["Krema Coffee & Gelato", "cafe"], ["The Padel Factory", "sports"], ["Playdium", "entertainment"],
  ["Three Coffee Roasters", "cafe"], ["Muscle Lab Gym", "gym"], ["Xiongmao Hotpot", "restaurant"],
].map(([name, category]) => ({ name, category }));

function Icon({ d }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function useLiveBrands() {
  const [brands, setBrands] = useState(null);
  useEffect(() => {
    let alive = true;
    axios
      .get(`${API}/offers/images/all`)
      .then((res) => {
        const seen = new Set();
        const list = (res.data?.offers || [])
          .filter((o) => o && o.brand && o.brand.approved !== false)
          .map((o) => ({
            name: (o.brand.brandName || o.brand.name || o.title || "").trim(),
            category: (o.category || "").toLowerCase(),
            image: o.image,
          }))
          .filter((b) => b.name)
          .filter((b) => {
            const k = b.name.trim().toLowerCase();
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .slice(0, 18);
        if (alive) setBrands(list.length ? list : FALLBACK_BRANDS);
      })
      .catch(() => alive && setBrands(FALLBACK_BRANDS));
    return () => { alive = false; };
  }, []);
  return brands || FALLBACK_BRANDS;
}

export default function Landing() {
  const brands = useLiveBrands();

  useEffect(() => {
    document.title = "tdc. student life, sorted";
    if (window.location.hash) {
      const el = document.querySelector(window.location.hash);
      if (el) setTimeout(() => el.scrollIntoView(), 50);
    }
  }, []);

  return (
    <div className="tdcw">
      <WebNav />

      <main>
        {/* hero */}
        <div className="wrap hero">
          <div>
            <span className="chip"><span className="chip-dot" />live in Karachi, Lahore and Islamabad</span>
            <h1 className="h-xl">student life,<br />sorted<span className="dot">.</span></h1>
            <p className="lead">tdc is the free app for university, college and O/A level students. deals at 100+ brands, internships, a CV builder and your campus feed, in one place.</p>
            <div className="hero-ctas">
              <a href={LINKS.getApp} className="btn btn-primary">get the app, it's free <Arrow /></a>
              <Link to="/signup" className="btn btn-secondary">partner with tdc</Link>
            </div>
            <p className="hero-note">free for students. forever. no catch.</p>
          </div>

          <div aria-hidden="true">
            <div className="phone">
              <div className="phone-screen">
                <div className="phone-top">
                  <img src={logoInk} alt="" />
                  <span className="pill"><i />crew points</span>
                </div>
                <div className="ph-hello">
                  <small>hey there</small>
                  <div>what are we sorting today<span className="dot">?</span></div>
                </div>
                <div className="ph-drop">
                  <b>today's drop</b>
                  <div className="q">best place to study on campus?</div>
                  <div className="ph-opts"><span>library</span><span>cafe</span><span>the lawn</span></div>
                  <small>vote to see what campus thinks.</small>
                </div>
                <div className="ph-title"><b>on campus<span className="dot">.</span></b><span>open feed</span></div>
                <div className="ph-card">
                  <small>latest confession · anonymous</small>
                  <p>been sitting in the 8am class for a month. it's not my class.</p>
                </div>
                <div className="ph-title"><b>deals near you<span className="dot">.</span></b><span>see all</span></div>
                <div className="ph-deals">
                  <div className="ph-deal"><i /><b>Jenpharm</b><small>health and beauty</small></div>
                  <div className="ph-deal"><i /><b>Dear Croissant</b><small>food and drinks</small></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* facts */}
        <section className="facts" aria-label="tdc in numbers">
          <div className="wrap">
            {FACTS.map((f) => (
              <div className="fact" key={f.label}><b>{f.n}</b><span>{f.label}</span></div>
            ))}
          </div>
        </section>

        {/* app */}
        <section id="app" className="wrap section">
          <div className="section-head">
            <h2 className="h-lg">one app.<br />everything sorted<span className="dot">.</span></h2>
            <p>the stuff students juggle across ten apps and fifty group chats, in one calm place.</p>
          </div>
          <div className="grid">
            {TOOLS.map((t) => (
              <div className="card" key={t.title}>
                <div className="icon-well"><Icon d={t.icon} /></div>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* how deals work */}
        <section className="wrap section">
          <div className="band-soft">
            <h2 className="h-md">how a deal works<span className="dot">.</span></h2>
            <div className="grid" style={{ marginTop: 32 }}>
              {STEPS.map((s, i) => (
                <div className="card" key={s.title}>
                  <div className="step-n">{i + 1}</div>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* crew */}
        <section className="wrap section">
          <div className="grid-2" style={{ gap: 40, alignItems: "center" }}>
            <div>
              <h2 className="h-lg">join the crew<span className="dot">.</span></h2>
              <p className="lead" style={{ marginTop: 16, maxWidth: 460, fontSize: 17 }}>one referral code. bring friends, use tdc, earn crew points. points level you up and unlock brand perks.</p>
              <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>founder circle: 50 seats, hand-picked by the founders. applications close 30 Dec 2026.</p>
            </div>
            <div className="ladder">
              <ul>
                {LEVELS.map((l) => (
                  <li key={l.name}>
                    <span className="lvl"><i style={{ background: l.dot }} />{l.name}</span>
                    <span className="pts">{l.pts}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* brands */}
        <section id="brands" className="dark on-dark" style={{ marginTop: 96 }}>
          <div className="wrap dark-inner">
            <div>
              <div className="eyebrow">for brands</div>
              <h2 className="h-lg" style={{ marginTop: 12 }}>reach students where they decide what's next<span className="dot">.</span></h2>
              <p className="lead" style={{ marginTop: 20, maxWidth: 460, fontSize: 17 }}>list a flat discount for tdc verified users. pay nothing in year one: no listing fee, no commission.</p>
              <div className="hero-ctas">
                <Link to="/signup" className="btn btn-accent">list your brand</Link>
                <a href={`mailto:${LINKS.hello}`} className="btn btn-ghost-dark">talk to us</a>
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
              {BRAND_POINTS.map((b) => (
                <div className="card" key={b.title}>
                  <span className="dot-mark" />
                  <h3 style={{ fontSize: 19 }}>{b.title}</h3>
                  <p>{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* partner brands (live) */}
        <section className="wrap section">
          <div className="section-head" style={{ marginBottom: 28 }}>
            <h2 className="h-md">100+ brands already on tdc<span className="dot">.</span></h2>
            <a href={LINKS.getApp} style={{ fontWeight: 700, fontSize: 15 }}>see them all in the app</a>
          </div>
          <div className="partners">
            {brands.map((b) => (
              <span key={b.name}>
                {b.image && <img src={b.image} alt="" style={{ width: 24, height: 24, borderRadius: 12, objectFit: "cover", marginLeft: -8 }} />}
                {b.name}
                {b.category && <small>{b.category}</small>}
              </span>
            ))}
          </div>
        </section>

        {/* employers + campus */}
        <section className="wrap section">
          <div className="grid-2">
            <div id="employers" className="card" style={{ padding: 40, borderRadius: 28, display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="eyebrow">for employers</div>
              <h2 className="h-md" style={{ fontSize: 34 }}>hire interns and fresh grads<span className="dot">.</span></h2>
              <p style={{ fontSize: 16, marginTop: 0 }}>post internships and entry-level roles to the career hub. students who've built their CV on tdc see how well they match before they apply, and you see candidates who fit.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                <Link to="/signup" className="btn btn-primary">register as employer</Link>
                <a href={`mailto:${LINKS.hr}`} className="btn btn-secondary">{LINKS.hr}</a>
              </div>
            </div>
            <div id="campus" className="card" style={{ padding: 40, borderRadius: 28, display: "flex", flexDirection: "column", gap: 16, background: "#FFF1CC", borderColor: "#FFF1CC" }}>
              <div className="eyebrow" style={{ color: "#111111" }}>campus ambassadors</div>
              <h2 className="h-md" style={{ fontSize: 34 }}>run tdc on your campus<span className="dot">.</span></h2>
              <p style={{ fontSize: 16, marginTop: 0, color: "#4A473F" }}>7+ universities and 20+ student societies already work with us. ambassadors get founder mentorship, 1-on-1 career counselling, a referral letter and a shot at the founder circle.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
                <Link to="/ambassador" className="btn btn-primary">apply as ambassador</Link>
                <a href={`mailto:${LINKS.hello}?subject=${encodeURIComponent("tdc x our society")}`} className="btn btn-secondary">societies, talk to us</a>
              </div>
            </div>
          </div>
        </section>

        {/* download */}
        <section className="wrap section">
          <div className="cta-box">
            <div>
              <h2>get tdc. it's free.<br />scene sorted<span className="dot">.</span></h2>
              <p>for students, alumni and faculty.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href={LINKS.appStore} className="btn btn-white" style={{ height: 58, borderRadius: 29 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.2 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1-2.8-4.1zM13.9 5.2c.7-.8 1.2-2 1-3.2-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.9-1.1 3.1 1.1.1 2.3-.6 3-1.4z" /></svg>
                app store
              </a>
              <a href={LINKS.playStore} className="btn btn-accent" style={{ height: 58, borderRadius: 29 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 2.8v18.4c0 .4.4.6.7.4l15.9-9.2c.3-.2.3-.6 0-.8L4.7 2.4c-.3-.2-.7 0-.7.4z" /></svg>
                google play
              </a>
            </div>
          </div>
        </section>
      </main>

      <WebFooter />
    </div>
  );
}
