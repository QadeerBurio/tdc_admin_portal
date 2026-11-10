// useFlagsMe.js: the signed-in user's feature flags (GET /api/app/flags/me), shared by every screen that gates on
// them. Fetched when first needed, then again when the tab regains focus or becomes visible, at most once a minute,
// so a flag switched on (or off) on the server reaches an open portal without a reload. One cache per signed-in
// token (another account in the same tab never sees the previous one's flags); simultaneous callers share one
// request; a failed request keeps the last answer.
import { useEffect, useState } from "react";
import api from "../services/api";

export const REFRESH_GAP_MS = 60 * 1000;
const tokenNow = () => { try { return localStorage.getItem("token") || ""; } catch { return ""; } };
let cache = null; // { token, flags, at }
let inflight = null; // { token, promise }
const listeners = new Set();

/** The flags for the current token; reuses the last answer if it's under a minute old (unless force). */
export function fetchFlags({ force = false } = {}) {
  const token = tokenNow();
  if (!force && cache && cache.token === token && Date.now() - cache.at < REFRESH_GAP_MS) return Promise.resolve(cache.flags);
  if (inflight && inflight.token === token) return inflight.promise;
  const promise = api.get("/app/flags/me")
    .then((r) => r.data || {})
    .catch(() => (cache && cache.token === token ? cache.flags : {}))
    .then((flags) => {
      if (tokenNow() === token) {
        cache = { token, flags, at: Date.now() };
        listeners.forEach((l) => l(flags));
      }
      if (inflight?.promise === promise) inflight = null;
      return flags;
    });
  inflight = { token, promise };
  return promise;
}

// focus / visible again: refresh (the one-minute gap applies)
let watching = false;
function watchFocus() {
  if (watching || typeof window === "undefined") return;
  watching = true;
  window.addEventListener("focus", () => { fetchFlags(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") fetchFlags(); });
}

/** The flags object, or null until the first answer. Re-renders when a refresh changes them. */
export default function useFlagsMe() {
  const [flags, setFlags] = useState(() => (cache && cache.token === tokenNow() ? cache.flags : null));
  useEffect(() => {
    watchFocus();
    const listener = (f) => setFlags(f);
    listeners.add(listener);
    fetchFlags().then((f) => setFlags(f));
    return () => { listeners.delete(listener); };
  }, []);
  return flags;
}

// for tests: forget everything
export const __resetFlagsCache = () => { cache = null; inflight = null; };
