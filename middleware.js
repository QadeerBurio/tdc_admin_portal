// middleware.js (Vercel Routing Middleware, project root): gettdc.pk/r/<link> → the server's public resume page (P3d).
// It does what the /r/* rewrite in vercel.json does (that rewrite stays as the fallback), and also tells the server
// who the visitor is, so views and the rate limit count real visitors instead of Vercel's own address:
//   x-tdc-visitor-ip  the address Vercel's edge set for this request (x-real-ip; Vercel overwrites what a client sends)
//   x-tdc-proxy       PORTAL_PROXY_SECRET (Vercel environment variable, the same value as on the server; never in the
//                     repo). Without it the server ignores x-tdc-visitor-ip (server services/clientAddress.js).
// Only GET / HEAD, only a small allow-list of request headers (no cookies), the server's answer passed back as is.
//   RESUME_PAGE_ORIGIN (optional Vercel variable): the server to forward to; default the production server. A staging
//   portal sets it to the staging server (docs/STAGING.md on the server).
export const config = { matcher: "/r/:path*" };

const DEFAULT_ORIGIN = "https://the-deft-crew-production.up.railway.app";
const PASS = ["user-agent", "accept", "accept-language"];
const IP = /^(?:\d{1,3}(?:\.\d{1,3}){3}|[0-9a-f:]{2,39}(?::\d{1,3}(?:\.\d{1,3}){3})?)$/i;

/** the request headers sent to the server */
export function forwardHeaders(request, env = {}) {
  const h = {};
  for (const k of PASS) { const v = request.headers.get(k); if (v) h[k] = v; }
  h["accept-encoding"] = "identity"; // the body is passed back as is: never decoded twice
  const ip = String(request.headers.get("x-real-ip") || "").trim();
  const secret = String(env.PORTAL_PROXY_SECRET || "");
  if (secret && IP.test(ip)) { h["x-tdc-proxy"] = secret; h["x-tdc-visitor-ip"] = ip; }
  return h;
}

/** where the request goes: the same path and query on the server */
export function upstreamUrl(request, env = {}) {
  const u = new URL(request.url);
  const origin = String(env.RESUME_PAGE_ORIGIN || DEFAULT_ORIGIN).replace(/\/+$/, "");
  return `${origin}${u.pathname}${u.search}`;
}

export default async function middleware(request, _context, fetchImpl = fetch) {
  const env = (typeof process !== "undefined" && process.env) || {};
  const method = request.method === "HEAD" ? "HEAD" : "GET";
  return fetchImpl(upstreamUrl(request, env), { method, headers: forwardHeaders(request, env), redirect: "manual" });
}
