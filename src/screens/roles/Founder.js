// Founder.js: /founder, Majid Shah Bukhari (MSB), founder of tdc. Story, path, what tdc stands for, "featured in"
// (a card per outlet from PRESS in web/site.js; the home page shows the same outlets as a logo strip) and how to reach him.
// Facts only: keep it in step with what MSB has approved for press.
import React from "react";
import { WebNav, WebFooter, LINKS, PRESS, PARTNERS, PRESS_LOGO_H, logoWidth, pieceLine, pieceLink, pieceLabel, partnerLabel, Arrow, usePage } from "../../web/site";
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

// the meta description mentions the coverage (outlets from PRESS)
const outlets = PRESS.map((o) => o.outlet);
export const FOUNDER_DESCRIPTION = `Majid Shah Bukhari (MSB), founder of tdc, the free app for students in Pakistan. featured in ${outlets.slice(0, -1).join(", ")} and ${outlets[outlets.length - 1]}.`;

export default function Founder() {
  usePage("meet the founder", FOUNDER_DESCRIPTION);
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

        {/* story */}
        <section className="wrap section">
          <div className="grid-2" style={{ gap: 48, alignItems: "start" }}>
            <h2 className="h-lg">the story<span className="dot">.</span></h2>
            <div style={{ display: "grid", gap: 18, fontSize: 18, lineHeight: 1.6 }}>
              <p>MSB has been building in tech since 2016. he started at Smartchoice.pk, then led growth and marketing at startups, including PayActiv, a US fintech, and GiftKarte Technologies.</p>
              <p>in 2022 he founded The Deft Crew, a full-service digital growth agency based in DHA Phase 6, Karachi. building it meant working every day with students and fresh grads from universities across Pakistan, and he kept seeing the same gap between what students need and what they can actually find.</p>
              <p>tdc is his answer to that gap. the idea took shape in 2025 and tdc launched in early 2026. today it is live in Karachi, Lahore and Islamabad, with 100+ partner brands.</p>
              <p className="muted">his views on Pakistan's youth skills gap have been featured in The Financial Daily.</p>
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

        {/* featured in: a card per outlet */}
        <section className="wrap section" aria-labelledby="featured-h" data-press="cards">
          <div className="section-head">
            <h2 id="featured-h" className="h-lg">featured in<span className="dot" aria-hidden="true">.</span></h2>
            <p>for interviews, features and speaking: <a href={`mailto:${LINKS.hello}`}>{LINKS.hello}</a></p>
          </div>
          <ul className="press-grid">
            {PRESS.map((o) => (
              <li key={o.outlet} className="card press-card">
                {o.logo && <img className="press-logo" src={o.logo.src} alt={o.outlet} height={PRESS_LOGO_H} width={logoWidth(o.logo)} loading="lazy" decoding="async" />}
                <h3 className="card-h">{o.outlet}</h3>
                {o.summary && <p className="muted press-summary">{o.summary}</p>}
                <ul className={`press-pieces${o.summary ? " press-titles" : ""}`}>
                  {o.pieces.map((p) => (
                    <li key={p.href}>
                      {o.summary ? (
                        <>
                          <a href={p.href} target="_blank" rel="noopener noreferrer" aria-label={pieceLabel(o, p)}>{p.headline} <Arrow size={16} /></a>
                          {p.date && <span className="muted press-date">{p.date}</span>}
                        </>
                      ) : (
                        <>
                          <p className="muted">{pieceLine(p)}</p>
                          <a href={p.href} target="_blank" rel="noopener noreferrer" aria-label={pieceLabel(o, p)}>{pieceLink(p)} <Arrow size={16} /></a>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        {/* partners (after "featured in") */}
        <section className="wrap section" aria-labelledby="partners-h" data-partners="cards" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <h2 id="partners-h" className="h-lg">partners<span className="dot" aria-hidden="true">.</span></h2>
          </div>
          <ul className="press-grid">
            {PARTNERS.map((p) => (
              <li key={p.name} className="card press-card">
                <img className="press-logo" src={p.logo.src} alt={p.name} height={PRESS_LOGO_H} width={logoWidth(p.logo)} loading="lazy" decoding="async" />
                <h3 className="card-h">{p.name}</h3>
                <ul className="press-pieces">
                  <li>
                    <p className="muted">{p.line}</p>
                    <a href={p.href} target="_blank" rel="noopener noreferrer" aria-label={partnerLabel(p)}>{p.link} <Arrow size={16} /></a>
                  </li>
                </ul>
              </li>
            ))}
          </ul>
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
