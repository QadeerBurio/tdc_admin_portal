// UniversitiesSection.js — /universities: partner campuses. Names and logos only; no invented rankings or counts.
import React from "react";
import { Link } from "react-router-dom";
import { WebNav, WebFooter, LINKS, PageHero, usePage, IconTile, ICONS } from "../../web/site";
import szabistLogo from "./szabist_logo.jpg";
import iobmLogo from "./Iobm.png";
import indusLogo from "./indus.jpg";
import hamdardLogo from "./hamdard.png";
import ziauddinLogo from "./ziaudin.jpg";
import denningLogo from "./denninguni.jpg";

// Add new partner campuses here (name, city, logo import).
const UNIVERSITIES = [
  { name: "SZABIST", city: "Karachi", logo: szabistLogo },
  { name: "IoBM", city: "Karachi", logo: iobmLogo },
  { name: "Indus University", city: "Karachi", logo: indusLogo },
  { name: "Hamdard University", city: "Karachi", logo: hamdardLogo },
  { name: "Ziauddin University", city: "Karachi", logo: ziauddinLogo },
  { name: "Denning", city: "Karachi", logo: denningLogo },
];

const FOR_CAMPUS = [
  { icon: ICONS.gift, title: "free for every student", body: "deals, career hub, CV builder and the campus feed. tdc stays free for students, forever." },
  { icon: ICONS.briefcase, title: "careers on campus", body: "internships and entry-level roles from employers looking for your students." },
  { icon: ICONS.calendar, title: "events and activations", body: "we run activations with your societies and partner brands, with costs shared across vendors." },
  { icon: ICONS.megaphone, title: "campus ambassadors", body: "student leads who run tdc on campus and get founder mentorship in return." },
];

export default function UniversitiesSection() {
  usePage("partner universities");

  return (
    <div className="tdcw">
      <WebNav />
      <main>
        <PageHero eyebrow="12+ partner universities" title="on campus with tdc" lead="we work with universities, colleges and student societies to bring deals, careers and events to students. here are some of the campuses already with us." />

        <section className="wrap section" style={{ paddingTop: 56 }}>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))" }}>
            {UNIVERSITIES.map((u) => (
              <div className="card" key={u.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: 18 }}>
                <div style={{ width: 64, height: 64, flex: "0 0 auto", borderRadius: 16, border: "1px solid #ECE7DB", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 6 }}>
                  <img src={u.logo} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
                <div>
                  <h2 className="card-h" style={{ fontSize: 18 }}>{u.name}</h2>
                  <p style={{ marginTop: 2, fontSize: 14 }}>{u.city}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <div className="section-head">
            <h2 className="h-lg">what your campus gets<span className="dot" aria-hidden="true">.</span></h2>
            <p>no cost to the institute or its students.</p>
          </div>
          <div className="grid">
            {FOR_CAMPUS.map((f) => (
              <div className="card" key={f.title}>
                <IconTile d={f.icon} />
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <div className="cta-box">
            <div>
              <h2>bring tdc to your campus<span className="dot" aria-hidden="true">.</span></h2>
              <p>placement offices, student affairs and society heads: let's talk.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href={`mailto:${LINKS.hello}?subject=${encodeURIComponent("university partnership")}`} className="btn btn-accent">partner with us</a>
              <Link to="/ambassador" className="btn btn-ghost-dark">become an ambassador</Link>
            </div>
          </div>
        </section>
      </main>
      <WebFooter />
    </div>
  );
}
