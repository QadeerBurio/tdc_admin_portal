// CompanyProfile.js — /company_profile: hiring on tdc for employers. New tdc design, no invented stats.
import React from "react";
import { Link } from "react-router-dom";
import { WebNav, WebFooter, LINKS, PageHero, usePage, IconTile, ICONS } from "../../web/site";

const WHY = [
  { icon: ICONS.users, title: "students who are ready", body: "candidates build their CV and work profile on tdc, so you see more than a bare PDF." },
  { icon: ICONS.target, title: "a match score on every role", body: "once a student's CV and work profile are done, the career hub shows how well they fit your role before they apply." },
  { icon: ICONS.clock, title: "early access", body: "reach final-year students and fresh grads from 12+ partner universities before the open job market." },
  { icon: ICONS.grid, title: "one dashboard", body: "post roles, review candidates, schedule interviews and track your hiring in the employer portal." },
];

const STEPS = [
  { icon: ICONS.building, title: "register your company", body: "create an employer account. takes about a minute." },
  { icon: ICONS.briefcase, title: "post a role", body: "internships, entry-level jobs or graduate tracks: tech, marketing, finance, creative and more." },
  { icon: ICONS.list, title: "shortlist and interview", body: "review profiles and match scores, then invite candidates to interview from your dashboard." },
];

const FAQ = [
  { q: "what does it cost?", a: "talk to us about your hiring plans and we'll share what fits. reach us at hr@gettdc.pk." },
  { q: "what kind of roles can I post?", a: "internships, part-time roles, entry-level jobs and graduate programs. tdc is built for students and fresh grads." },
  { q: "who are the candidates?", a: "tdc verified users: university, college and O/A level students, plus alumni, across Karachi, Lahore and Islamabad." },
  { q: "how does the match score work?", a: "students who've completed their CV and work profile see a match percentage for each role, and you see who fits before you shortlist." },
  { q: "can I hire from a specific university?", a: "yes. candidate profiles show their institute, so you can focus on the campuses you want." },
];

// Hero card from the board: the sample role and three candidate rows. The board's rows are
// placeholders for live data, so they stay as neutral bars here (no invented names or scores).
function CandidatesPreview() {
  return (
    <div className="cand-card" aria-hidden="true">
      <div className="cand-head">
        <span className="cand-title">candidates<span className="dot">.</span></span>
        <span className="cand-role">growth marketing intern</span>
      </div>
      {[0, 1, 2].map((i) => (
        <div className="cand-row" key={i}>
          <div className="cand-avatar" />
          <div style={{ flex: 1 }}>
            <div className="cand-bar" style={{ width: `${[62, 54, 46][i]}%` }} />
            <div className="cand-bar soft" style={{ width: `${[78, 64, 40][i]}%`, marginTop: 8 }} />
          </div>
          <span className="cand-pill" />
        </div>
      ))}
    </div>
  );
}

export default function CompanyProfile() {
  usePage("for employers");

  return (
    <div className="tdcw">
      <WebNav />
      <main>
        <PageHero aside={<CandidatesPreview />} eyebrow="for employers" title="hire interns and fresh grads" lead="post internships and entry-level roles where students already plan their careers. they apply with a CV built on tdc, and you see who fits.">
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary">register as employer</Link>
            <a href={`mailto:${LINKS.hr}?subject=${encodeURIComponent("hiring on tdc")}`} className="btn btn-secondary">{LINKS.hr}</a>
          </div>
        </PageHero>

        <section className="wrap section">
          <div className="section-head">
            <h2 className="h-lg">why hire on tdc<span className="dot">.</span></h2>
            <p>less sorting through generic CVs. more candidates who match.</p>
          </div>
          <div className="grid">
            {WHY.map((w) => (
              <div className="card" key={w.title}>
                <IconTile d={w.icon} />
                <h3>{w.title}</h3>
                <p>{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <div className="band-soft">
            <h2 className="h-md">how it works<span className="dot">.</span></h2>
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

        <section className="wrap section">
          <div className="grid-2" style={{ gap: 40, alignItems: "start" }}>
            <div>
              <h2 className="h-lg">questions<span className="dot">?</span></h2>
              <p className="lead" style={{ marginTop: 16, fontSize: 17, maxWidth: 420 }}>anything else, email <a href={`mailto:${LINKS.hr}`}>{LINKS.hr}</a> or <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp us</a>.</p>
            </div>
            <div className="faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="wrap section">
          <div className="cta-box">
            <div>
              <h2>your next hire is on campus<span className="dot">.</span></h2>
              <p>create your employer account and post your first role.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link to="/signup" className="btn btn-accent">register as employer</Link>
              <Link to="/login" className="btn btn-ghost-dark">employer log in</Link>
            </div>
          </div>
        </section>
      </main>
      <WebFooter />
    </div>
  );
}
