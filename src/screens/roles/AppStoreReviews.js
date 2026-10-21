// AppStoreReviews.js — /AppStoreReviews: real App Store reviews only (Apple's public review feed).
// The old page scraped Google Play through third-party CORS proxies and fell back to made-up reviews; both are gone.
import React, { useEffect, useState } from "react";
import { WebNav, WebFooter, LINKS, PageHero, usePage } from "../../web/site";

const APP_ID = "6765877675";
const FEEDS = [
  `https://itunes.apple.com/pk/rss/customerreviews/page=1/id=${APP_ID}/sortby=mostrecent/json`,
  `https://itunes.apple.com/pk/rss/customerreviews/page=2/id=${APP_ID}/sortby=mostrecent/json`,
  `https://itunes.apple.com/us/rss/customerreviews/page=1/id=${APP_ID}/sortby=mostrecent/json`,
];

function parseFeed(data) {
  const entries = data?.feed?.entry;
  const list = Array.isArray(entries) ? entries : entries ? [entries] : [];
  return list
    .filter((e) => e["im:rating"])
    .map((e) => ({
      id: e.id?.label,
      rating: parseInt(e["im:rating"].label, 10),
      title: (e.title?.label || "").trim(),
      content: (e.content?.label || "").trim(),
      author: (e.author?.name?.label || "App Store user").trim(),
      date: e.updated?.label ? new Date(e.updated.label) : null,
    }))
    .filter((r) => r.rating >= 1 && r.rating <= 5 && r.content);
}

function Stars({ n }) {
  return (
    <span className="stars" role="img" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill={i <= n ? "#F9C349" : "#ECE7DB"}>
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </span>
  );
}

export default function AppStoreReviews() {
  usePage("reviews · tdc.");
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all(FEEDS.map((u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null)))
      .then((results) => {
        const seen = new Set();
        const all = results.flatMap(parseFeed).filter((r) => {
          const k = r.id || `${r.author}-${r.title}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        all.sort((a, b) => (b.date || 0) - (a.date || 0));
        if (alive) setReviews(all);
      });
    return () => { alive = false; };
  }, []);

  const avg = reviews && reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="tdcw">
      <WebNav />
      <main>
        <PageHero eyebrow="from the App Store" title="what students say" lead="real reviews from the tdc app on the App Store. no edits, no picking favourites.">
          <div className="hero-ctas">
            <a href={`${LINKS.appStore}?action=write-review`} className="btn btn-primary">review us on the App Store</a>
            <a href={LINKS.playStore} className="btn btn-secondary">review us on Google Play</a>
          </div>
        </PageHero>

        <section className="wrap section" style={{ paddingTop: 56 }}>
          {reviews === null ? (
            <div className="grid" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => <div className="card" key={i} style={{ height: 180, background: "#F5F2EA", borderColor: "#F5F2EA" }} />)}
            </div>
          ) : reviews.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 48 }}>
              <h3 style={{ fontSize: 24 }}>no reviews to show yet<span className="dot">.</span></h3>
              <p style={{ maxWidth: 420, margin: "8px auto 0" }}>using tdc? a quick review helps other students find it.</p>
            </div>
          ) : (
            <>
              <div className="row-between" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <b style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: 44, letterSpacing: -1 }}>{avg.toFixed(1)}</b>
                  <div>
                    <Stars n={Math.round(avg)} />
                    <div className="muted" style={{ fontSize: 14 }}>from {reviews.length} App Store {reviews.length === 1 ? "review" : "reviews"} shown here</div>
                  </div>
                </div>
              </div>
              <div className="grid">
                {reviews.map((r) => (
                  <article className="card" key={r.id || r.title + r.author} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Stars n={r.rating} />
                    {r.title && <h3 style={{ fontSize: 18 }}>{r.title}</h3>}
                    <p style={{ marginTop: 0, color: "#111111" }}>{r.content}</p>
                    <p style={{ marginTop: "auto", fontSize: 13 }}>
                      {r.author}{r.date ? ` · ${r.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <WebFooter />
    </div>
  );
}
