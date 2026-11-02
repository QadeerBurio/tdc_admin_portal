// src/config/api.js
// The one place the portal learns where the server is. REACT_APP_API_URL is the server's origin,
// without /api (e.g. https://tdc-server-staging.up.railway.app). Create React App bakes it in at build
// time; unset, it is production, so a build without the variable behaves as before.
export const API_ORIGIN = (process.env.REACT_APP_API_URL || "https://the-deft-crew-production.up.railway.app").replace(/\/+$/, "");
export const API_BASE = `${API_ORIGIN}/api`;
