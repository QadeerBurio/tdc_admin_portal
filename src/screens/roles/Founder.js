// Founder.js — /founder: Majid Shah Bukhari (MSB), founder of tdc. Story, path, what tdc stands for,
// press (PRESS in web/site.js, also shown on the home page) and how to reach him.
// Facts only: keep it in step with what MSB has approved for press.
import React from "react";
import { WebNav, WebFooter, LINKS, PRESS, FeaturedIn, Arrow, usePage } from "../../web/site";
import photo from "../../web/assets/founder-msb.jpg";

const MSB_LINKEDIN = "https://www.linkedin.com/in/majidshahbukhari1/";

const PATH = [
  { when: "2016", what: "Smartchoice.pk", note: "started in tech at a fintech and e-commerce startup in Karachi." },
  { when: "next", what: "PayActiv", note: "growth marketer at a US fintech." },
  { when: "next", what: "GiftKarte Technologies", note: "head of marketing." },
  { when: "2022", what: "The Deft Crew", note: "founded a full-service digital growth agency in Karachi, now with presence in the UAE and the USA." },
  { when: "2026", what: "tdc", note: "launched the free app for students: deals, internships, a CV builder and a campus feed, in one place." },
];

const STANDS_FOR = [
  { h: "free for students. forever", p: "tdc never charges students. brands, employers and partners keep it running." },
  { h: "numbers, not people", p: "brands see how their deals perform. they never get a student's personal details." },
  { h: "useful, not noisy", p: "student life is loud enough. tdc should be the app you open because it helps, not because it nags." },
];

export default function Founder() {
  usePage("meet the founder");
  return (
    <div className="tdcw">
      <WebNav />
      <main>
        {/* hero */}
        <section className="wrap hero">
          <div className="hero-copy">
            <span className="chip"><span className="chip-dot" />founder, tdc</span>
            <h1 className="h-xl">meet MSB<span className="dot" aria-hidden="true">.</span></h1>
            <p className="lead">
              Majid Shah Bukhari is the founder of tdc, the free app that sorts student life in Pakistan, and of The Deft Crew, the
              digital growth agency it grew out of. part of MSB Group.
            </p>
            <div className="hero-ctas">
              <a href={MSB_LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn btn-primary">connect on LinkedIn <Arrow /></a>
              <a href={`mailto:${LINKS.hello}?subject=Press%20%2F%20founder`} className="btn btn-secondary">press and speaking</a>
            </div>
          </div>
          <img className="founder-photo" src={photo} alt="Majid Shah Bukhari, founder of tdc" width="900" height="1124" />
        </section>

        <div className="wrap"><FeaturedIn /></div>

        {/* story */}
        <section className="wrap section">
          <div className="grid-2" style={{ gap: 48, alignItems: "start" }}>
            <h2 className="h-lg">the story<span className="dot">.</span></h2>
            <div style={{ display: "grid", gap: 18, fontSize: 18, lineHeight: 1.6 }}>
              <p>MSB has been building in tech since 2016. he started at Smartchoice.pk, then led growth and marketing at startups, including PayActiv, a US fintech, and GiftKarte Technologies.</p>
              <p>in 2022 he founded The Deft Crew, a full-service digital growth agency based in DHA Phase 6, Karachi. building it meant working every day with students and fresh grads from universities across Pakistan, and he kept seeing the same gap between what students need and what they can actually find.</p>
              <p>tdc is his answer to that gap. the idea took shape in 2025 and tdc launched in early 2026. today it is live in Karachi, Lahore and Islamabad, with 100+ partner brands.</p>
              <p className="muted">he also writes about Pakistan's youth skills gap, with pieces published in The Financial Daily.</p>
            </div>
          </div>
        </section>

        {/* path */}
        <section className="wrap section">
          <div className="section-head">
            <h2 className="h-lg">the path<span className="dot">.</span></h2>
            <p>startups first, then an agency, then tdc.</p>
          </div>
          <ol className="timeline">
            {PATH.map((x) => (
              <li key={x.what}>
                <b>{x.when}</b>
                <div>
                  <h3>{x.what}</h3>
                  <p>{x.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* what tdc stands for */}
        <section className="wrap section">
          <div className="band-soft">
            <h2 className="h-md">what tdc stands for<span className="dot">.</span></h2>
            <div className="grid" style={{ marginTop: 28 }}>
              {STANDS_FOR.map((x) => (
                <div key={x.h} className="card">
                  <h3 className="card-h">{x.h}<span className="dot">.</span></h3>
                  <p className="muted" style={{ marginTop: 8 }}>{x.p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* press */}
        <section className="wrap section">
          <div className="section-head">
            <h2 className="h-lg">in the press<span className="dot">.</span></h2>
            <p>for interviews, features and speaking: <a href={`mailto:${LINKS.hello}`}>{LINKS.hello}</a></p>
          </div>
          <div className="grid-2">
            {PRESS.map((p) => (
              <a key={p.outlet} href={p.href} target="_blank" rel="noopener noreferrer" className="card press-card">
                <span className="eyebrow">featured</span>
                <span className="card-h">{p.outlet}</span>
                <span className="muted">the tdc story, covered by {p.outlet}.</span>
                <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>read the story <Arrow size={16} /></span>
              </a>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="wrap section" style={{ paddingBottom: 96 }}>
          <div className="cta-box">
            <div>
              <h2>student life, sorted<span className="dot">.</span></h2>
              <p>get tdc. it's free for students, forever.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href={LINKS.appStore} className="btn btn-white">app store</a>
              <a href={LINKS.playStore} className="btn btn-accent">google play</a>
            </div>
          </div>
        </section>
      </main>
      <WebFooter />
    </div>
  );
}
