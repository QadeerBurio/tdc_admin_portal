// OfferImagesGallery.js — /OfferImagesGallery: every partner brand with a live offer, from the public offers endpoint.
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { WebNav, WebFooter, LINKS, PageHero, usePage } from "../web/site";
import { useOffers } from "../web/useOffers";

export default function OfferImagesGallery() {
  usePage("brands and deals");
  const { brands, loading } = useOffers();
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const categories = useMemo(() => {
    const counts = {};
    brands.forEach((b) => { if (b.category) counts[b.category] = (counts[b.category] || 0) + 1; });
    return Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  }, [brands]);

  const shown = brands.filter((b) =>
    (cat === "all" || b.category === cat) &&
    (!q.trim() || b.name.toLowerCase().includes(q.trim().toLowerCase()))
  );

  return (
    <div className="tdcw">
      <WebNav />
      <main>
        <PageHero eyebrow="Karachi, Lahore, Islamabad" title="brands on tdc" lead="flat student discounts at cafes, restaurants, salons, gyms, fashion and more. claim in the app, scan at the counter, sorted.">
          <div className="hero-ctas">
            <a href={LINKS.getApp} className="btn btn-primary">get the app to claim</a>
            <Link to="/brands" className="btn btn-secondary">add your brand</Link>
          </div>
        </PageHero>

        <section className="wrap section" style={{ paddingTop: 56 }}>
          <div className="row-between" style={{ marginBottom: 16, alignItems: "flex-end" }}>
            <div className="field" style={{ flex: "1 1 280px", maxWidth: 360 }}>
              <label htmlFor="brand-search">search brands</label>
              <input id="brand-search" className="input" type="search" placeholder="e.g. coffee" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {!loading && <span className="muted" style={{ fontSize: 14 }}>{shown.length} {shown.length === 1 ? "brand" : "brands"}</span>}
          </div>

          {categories.length > 1 && (
            <div className="filters" role="group" aria-label="filter by category" style={{ marginBottom: 24 }}>
              <button type="button" aria-pressed={cat === "all"} onClick={() => setCat("all")}>all</button>
              {categories.map((c) => (
                <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="brand-grid" aria-busy="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <div className="brand-card" key={i}><div className="img" /><b style={{ height: 14, background: "#F5F2EA", borderRadius: 7, width: "70%" }} /></div>
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <h3>nothing here yet<span className="dot">.</span></h3>
              <p>try another search or category.</p>
            </div>
          ) : (
            <div className="brand-grid">
              {shown.map((b) => (
                <div className="brand-card" key={b.name}>
                  <div className="img">
                    {b.image ? <img src={b.image} alt="" loading="lazy" /> : <span aria-hidden="true">{b.name.charAt(0).toLowerCase()}</span>}
                  </div>
                  <div>
                    <b style={{ display: "block" }}>{b.name}</b>
                    {b.category && <small>{b.category}</small>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="wrap section">
          <div className="cta-box">
            <div>
              <h2>see a deal you like<span className="dot">?</span></h2>
              <p>get tdc, claim it, scan at the counter. free for students, forever.</p>
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
