// Landing.js — public home page (gettdc.pk), in the same design system as the tdc app.
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { WebNav, WebFooter, LINKS, Arrow, pageTitle, IconTile, ICONS, CountUp } from "../web/site";
import { useOffers } from "../web/useOffers";
import logoInk from "../web/assets/tdc-logo-ink.png";
import dotSorted from "./dots/sorted.png";
import dotExcited from "./dots/excited.png";
import dotCheeky from "./dots/cheeky.png";

// shown in the first screen, under the hero buttons (desktop) / the hero text (mobile)
const FACTS = [
  { n: "100+", label: "partner brands" },
  { n: "3", label: "cities" },
  { n: "12+", label: "universities" },
  { n: "15–60%", label: "student discounts" },
];

const TOOLS = [
  { title: "deals", body: "flat discounts at cafes, salons, gyms, fashion and more. claim in the app, scan at the counter.", icon: ICONS.tag },
  { title: "campus feed", body: "posts, polls and anonymous confessions from students like you. the part everyone opens first.", icon: ICONS.chat },
  { title: "career hub", body: "internships and entry-level jobs with a match score once your CV and work profile are done.", icon: ICONS.briefcase },
  { title: "cv builder", body: "build a clean CV on your phone and keep it ready for every application.", icon: ICONS.doc },
  { title: "events and scholarships", body: "campus events, student-priced tickets and scholarships if you are planning to study abroad.", icon: ICONS.calendar },
  { title: "ai travel assistant", body: "plan a trip on a student budget. it suggests the route and the plan, you decide.", icon: ICONS.pin },
];

const STEPS = [
  { icon: ICONS.plus, title: "claim it", body: "pick a brand in the app and tap claim." },
  { icon: ICONS.qr, title: "scan at the counter", body: "scan the brand's tdc QR code. your profile gets verified on the spot." },
  { icon: ICONS.check, title: "sorted.", body: "the discount is applied. that visit also earns you crew points." },
];

const LEVELS = [
  { name: "rookie", pts: "300 pts", dot: "#FFFFFF" },
  { name: "main character", pts: "1,000 pts", dot: "#FFF1CC" },
  { name: "pro", pts: "3,000 pts", dot: "#F9C349" },
  { name: "goat", pts: "6,000 pts", dot: "#111111" },
  { name: "founder circle", pts: "8,000 pts + apply", dot: "#F9C349" },
];

const BRAND_POINTS = [
  { icon: ICONS.gift, title: "free for year one", body: "no listing fee and no commission for the first year." },
  { icon: ICONS.shield, title: "no leakage", body: "a brand-only QR. only verified tdc users can claim, and your staff completes every redemption." },
  { icon: ICONS.chart, title: "live in your portal", body: "every claim shows up in real time, with which institutes your customers come from." },
  { icon: ICONS.doc, title: "simple terms", body: "you set a flat discount from 15–60%. either side can exit with 15 working days' notice." },
];

export default function Landing() {
  const { brands: allBrands } = useOffers();
  const brands = allBrands.slice(0, 18);

  useEffect(() => {
    document.title = pageTitle("student life, sorted");
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
          <div className="hero-copy">
            <span className="chip"><span className="chip-dot" />live in Karachi, Lahore and Islamabad</span>
            <h1 className="h-xl">student life,<br />sorted<span className="dot" aria-hidden="true">.</span></h1>
            <p className="lead">tdc is the free app for university, college and O/A level students. deals at 100+ brands, internships, a CV builder and your campus feed, in one place.</p>
            <div className="hero-ctas">
              <a href={LINKS.getApp} className="btn btn-primary">get the app, it's free <Arrow /></a>
              <Link to="/signup" className="btn btn-secondary">partner with tdc</Link>
            </div>
            <p className="hero-note">free for students. forever. no catch.</p>
            <ul className="hero-stats" aria-label="tdc in numbers">
              {FACTS.map((f) => (
                <li key={f.label}><b><CountUp value={f.n} /></b><span>{f.label}</span></li>
              ))}
            </ul>
          </div>

          <div className="phone-stage" aria-hidden="true">
            <div className="phone">
              <img className="mood mood-a" src={dotSorted} alt="" width="56" height="56" />
              <img className="mood mood-b" src={dotExcited} alt="" width="56" height="56" />
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
                <div className="ph-title"><b>on campus<span className="dot" aria-hidden="true">.</span></b><span>open feed</span></div>
                <div className="ph-card">
                  <small>latest confession · anonymous</small>
                  <p>been sitting in the 8am class for a month. it's not my class.</p>
                </div>
                <div className="ph-title"><b>deals near you<span className="dot" aria-hidden="true">.</span></b><span>see all</span></div>
                <div className="ph-deals">
                  <div className="ph-deal"><i className="tint-rose">J<em>20% off</em></i><b>Jenpharm</b><small>health and beauty</small></div>
                  <div className="ph-deal"><i className="tint-yellow">D<em>15% off</em></i><b>Dear Croissant</b><small>food and drinks</small></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* app */}
        <section id="app" className="wrap section">
          <div className="section-head">
            <h2 className="h-lg">one app.<br />everything sorted<span className="dot" aria-hidden="true">.</span></h2>
            <p>the stuff students juggle across ten apps and fifty group chats, in one calm place.</p>
          </div>
          <div className="grid grid-3">
            {TOOLS.map((t) => (
              <div className="card" key={t.title}>
                <IconTile d={t.icon} />
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* how deals work */}
        <section className="wrap section">
          <div className="band-soft">
            <h2 className="h-md">how a deal works<span className="dot" aria-hidden="true">.</span></h2>
            <div className="grid" style={{ marginTop: 32 }}>
              {STEPS.map((s, i) => (
                <div className="card" key={s.title}>
                  <IconTile d={s.icon} n={i + 1} />
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
              <h2 className="h-lg">join the crew<span className="dot" aria-hidden="true">.</span></h2>
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
              <h2 className="h-lg" style={{ marginTop: 12 }}>reach students where they decide what's next<span className="dot" aria-hidden="true">.</span></h2>
              <p className="lead" style={{ marginTop: 20, maxWidth: 460, fontSize: 17 }}>list a flat discount for tdc verified users. pay nothing in year one: no listing fee, no commission.</p>
              <div className="hero-ctas">
                <Link to="/signup" className="btn btn-accent">list your brand</Link>
                <a href={`mailto:${LINKS.hello}`} className="btn btn-ghost-dark">talk to us</a>
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: 12 }}>
              {BRAND_POINTS.map((b) => (
                <div className="card" key={b.title}>
                  <IconTile d={b.icon} />
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
            <h2 className="h-md">100+ brands already on tdc<span className="dot" aria-hidden="true">.</span></h2>
            <a href={LINKS.getApp} style={{ fontWeight: 700, fontSize: 15 }}>see them all in the app</a>
          </div>
          <div className="partners">
            {brands.map((b) => (
              <span key={b.name}>
                {b.image && <img src={b.image} alt="" width="24" height="24" loading="lazy" decoding="async" style={{ width: 24, height: 24, borderRadius: 12, objectFit: "cover", marginLeft: -8 }} />}
                {b.name}
                {b.category && <small>{b.category}</small>}
              </span>
            ))}
          </div>
        </section>

        {/* employers + campus */}
        <section className="wrap section">
          <div className="grid-2">
            <div id="employers" className="card block">
              <IconTile d={ICONS.briefcase} />
              <div className="eyebrow">for employers</div>
              <h2 className="h-md" style={{ fontSize: 34 }}>hire interns and fresh grads<span className="dot" aria-hidden="true">.</span></h2>
              <p style={{ fontSize: 16, marginTop: 0 }}>post internships and entry-level roles to the career hub. students who've built their CV on tdc see how well they match before they apply, and you see candidates who fit.</p>
              <div className="block-actions">
                <Link to="/signup" className="btn btn-primary">register as employer</Link>
                <a href={`mailto:${LINKS.hr}`} className="btn btn-secondary">{LINKS.hr}</a>
              </div>
            </div>
            <div id="campus" className="card block block-soft">
              <IconTile d={ICONS.building} />
              <div className="eyebrow" style={{ color: "#111111" }}>for campuses and societies</div>
              <h2 className="h-md" style={{ fontSize: 34 }}>bring tdc to your campus<span className="dot" aria-hidden="true">.</span></h2>
              <p style={{ fontSize: 16, marginTop: 0, color: "#4A473F" }}>12+ universities already work with us on events, activations and the campus ambassador program.</p>
              <div className="block-actions">
                <a href={`mailto:${LINKS.hello}`} className="btn btn-primary">partner with us</a>
              </div>
            </div>
          </div>
        </section>

        {/* download */}
        <section className="wrap section">
          <div className="cta-box">
            <div>
              <div className="cta-dots">
                <img src={dotExcited} alt="" width="48" height="48" loading="lazy" />
                <img src={dotCheeky} alt="" width="48" height="48" loading="lazy" />
              </div>
              <h2>get tdc. it's free.<br />scene sorted<span className="dot" aria-hidden="true">.</span></h2>
              <p>for students, alumni and faculty.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href={LINKS.appStore} className="btn btn-white" style={{ height: 58, borderRadius: 29 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M16 3c-1.5.2-3 1.3-3.5 3M12 7c-3-1.5-7 0-7 5 0 4 3 9 5 9 1 0 1.5-.6 2-.6s1 .6 2 .6c2 0 4-3.5 4.6-5.5-1.8-.8-2.6-2.5-2.6-4 0-1.6.9-2.8 2-3.5-1-1.4-3.5-2.5-6-1z" /></svg>
                app store
              </a>
              <a href={LINKS.playStore} className="btn btn-accent" style={{ height: 58, borderRadius: 29 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 3l14 9-14 9z" /></svg>
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
