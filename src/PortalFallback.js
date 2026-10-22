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
const isChunkError = (e) => !!e && (e.name === "ChunkLoadError" || /Loading (CSS )?chunk|dynamically imported module/i.test(String(e.message)));

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
    if (!isChunkError(error)) throw error;
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
