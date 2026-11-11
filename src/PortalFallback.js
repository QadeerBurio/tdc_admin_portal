// PortalFallback.js — loading state and "tdc was updated" screen for the lazy-loaded portal screens.
import React, { Suspense } from "react";
import logoInk from "./web/assets/tdc-logo-ink.png";

export function PortalLoading() {
  return (
    <div className="tdcw" data-portal-loading>
      <div className="center-shell" style={{ alignItems: "center", justifyContent: "center", gap: 18 }} role="status" aria-live="polite">
        <img src={logoInk} alt="tdc." style={{ height: 34, width: "auto" }} />
        <span className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 15 }}>
          <span className="spinner" aria-hidden="true" /> loading
        </span>
      </div>
    </div>
  );
}

// A portal screen's code file can go missing when a new version is deployed while a tab is open.
// That case shows a reload screen; any other error is passed on exactly as before.
// Only OUR chunk files count: a JS / CSS file under /static/ on this site's own origin. A failure that names a
// third-party URL (Google Fonts, a CDN, anything external) is never "tdc was updated".
const chunkUrl = (e) => {
  if (e.request) return String(e.request); // webpack sets the failed file's URL here (JS and CSS chunks)
  const m = /(https?:\/\/[^\s)]+)/.exec(String(e.message || "")); // "...failed.\n(error: <url>)" / "...module: <url>"
  return m ? m[1] : "";
};
export function isOwnChunkError(e, here = window.location) {
  if (!e) return false;
  const looksLikeChunk = e.name === "ChunkLoadError" || e.code === "CSS_CHUNK_LOAD_FAILED" || /Loading (CSS )?chunk|dynamically imported module/i.test(String(e.message));
  if (!looksLikeChunk) return false;
  const url = chunkUrl(e);
  if (!url) return true; // webpack always names the file; without one, keep the earlier behaviour
  let u;
  try { u = new URL(url, here.href); } catch { return false; }
  return u.origin === here.origin && /\/static\/(js|css)\//.test(u.pathname);
}

class PortalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!isOwnChunkError(error)) throw error;
    return (
      <div className="tdcw" data-portal-error>
        <div className="center-shell" style={{ alignItems: "center", justifyContent: "center", gap: 18, padding: 24, textAlign: "center" }} role="alert">
          <img src={logoInk} alt="tdc." style={{ height: 34, width: "auto" }} />
          <p style={{ fontSize: 17 }}>tdc was updated. reload to get the latest version.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>reload</button>
        </div>
      </div>
    );
  }
}

export function PortalShell({ children }) {
  return (
    <PortalErrorBoundary>
      <Suspense fallback={<PortalLoading />}>{children}</Suspense>
    </PortalErrorBoundary>
  );
}
