// BrandsProfile.js — /brands: why brands partner with tdc. New tdc design, real terms only.
import React from "react";
import { Link } from "react-router-dom";
import { WebNav, WebFooter, LINKS, PageHero, usePage, IconTile, ICONS, CountUp } from "../../web/site";
import { useOffers } from "../../web/useOffers";

const FACTS = [
  { icon: ICONS.store, n: "100+", label: "brands already live" },
  { icon: ICONS.cap, n: "12+", label: "partner universities" },
  { icon: ICONS.pin, n: "3", label: "cities: Karachi, Lahore, Islamabad" },
  { icon: ICONS.gift, n: "0", label: "listing fee or commission in year one" },
];

const WHY = [
  { icon: ICONS.store, title: "real footfall", body: "students claim in the app and redeem at your counter. every visit is a real customer, not an impression." },
  { icon: ICONS.shield, title: "no leakage", body: "a QR code only your brand has. only verified tdc users can claim, and your staff completes every redemption in the portal." },
  { icon: ICONS.chart, title: "you see what works", body: "every claim shows up live in your brand portal, with which institutes your customers come from. we share numbers, never students' personal data." },
  { icon: ICONS.megaphone, title: "creators, not ads", body: "tdc runs collabs with student creators. a 'tdc x your brand' post puts you in front of their followers." },
];

const STEPS = [
  { icon: ICONS.userPlus, title: "sign up free", body: "create your brand account at gettdc.pk/signup. takes about a minute." },
  { icon: ICONS.percent, title: "set one flat discount", body: "anything from 15–60% for tdc verified users. one simple offer students remember." },
  { icon: ICONS.qr, title: "put the QR on your counter", body: "we send your brand QR. students scan it to redeem, you see it live." },
];

const TERMS = [
  ["listing fee", "none in year one"],
  ["commission", "none in year one"],
  ["discount", "flat, 15–60%, set by you"],
  ["who can claim", "tdc verified users: students, alumni and faculty"],
  ["leaving", "either side, 15 working days' notice"],
];

export default function BrandsProfile() {
  usePage("for brands");
  const { brands } = useOffers();
  const logos = brands.filter((b) => b.image).slice(0, 12);

  return (
    <div className="tdcw">
      <WebNav />
      <main>
        <PageHero eyebrow="for brands" title="get students through your door" lead="tdc puts your brand in the app students open every day. list a flat discount, they claim it in the app and redeem at your counter. free for your first year.">
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary">list your brand</Link>
            <a href={`mailto:${LINKS.hello}?subject=${encodeURIComponent("brand partnership")}`} className="btn btn-secondary">talk to us</a>
          </div>
        </PageHero>

        <section className="facts" aria-label="tdc in numbers" style={{ marginTop: 56 }}>
          <div className="wrap">
            {FACTS.map((f) => (
              <div className="fact" key={f.label}><IconTile d={f.icon} /><b><CountUp value={f.n} /></b><span>{f.label}</span></div>
            ))}
          </div>
        </section>

        <section className="wrap section">
          <div className="section-head">
            <h2 className="h-lg">why brands join<span className="dot" aria-hidden="true">.</span></h2>
            <p>built so a deal turns into a visit, and the visit is tracked end to end.</p>
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
            <h2 className="h-md">live in 3 steps<span className="dot" aria-hidden="true">.</span></h2>
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
              <h2 className="h-lg">the terms<span className="dot" aria-hidden="true">.</span></h2>
              <p className="lead" style={{ marginTop: 16, fontSize: 17, maxWidth: 440 }}>short and simple. the signed agreement is a formality on top of the sign up form.</p>
            </div>
            <div className="ladder">
              <ul>
                {TERMS.map(([k, v]) => (
                  <li key={k}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{k}</span>
                    <span className="pts" style={{ textAlign: "right", color: "#111111" }}>{v}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {logos.length > 0 && (
          <section className="wrap section">
            <div className="section-head" style={{ marginBottom: 28 }}>
              <h2 className="h-md">in good company<span className="dot" aria-hidden="true">.</span></h2>
              <Link to="/OfferImagesGallery" className="tap-link" style={{ fontWeight: 700, fontSize: 15 }}>see all brands</Link>
            </div>
            <div className="logo-grid">
              {logos.map((b) => (
                <div className="logo-tile" key={b.name}>
                  <img src={b.image} alt={b.name} loading="lazy" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="wrap section">
          <div className="cta-box">
            <div>
              <h2>your first year is on us<span className="dot" aria-hidden="true">.</span></h2>
              <p>no listing fee, no commission. just students at your counter.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link to="/signup" className="btn btn-accent">list your brand</Link>
              <a href={LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark">WhatsApp us</a>
            </div>
          </div>
        </section>
      </main>
      <WebFooter />
    </div>
  );
}
