// P3d public resume page behind the portal (middleware.js at the project root): gettdc.pk/r/* is forwarded to the
// server with the visitor's address (from Vercel's edge) and the shared secret, so the server can count real visitors;
// nothing else from the visitor's request goes along; the vercel.json rewrite stays as the fallback.
import middleware, { config, forwardHeaders, upstreamUrl } from "../../middleware";

const vercel = require("../../vercel.json");
const req = (url, headers = {}, method = "GET") => ({ url, method, headers: { get: (k) => headers[k.toLowerCase()] ?? null } });
const SECRET = "test-only-portal-proxy-secret-0123456789";

test("runs only for /r/* and /c/* (P4c); the rewrites in vercel.json stay as the fallback", () => {
  expect(config.matcher).toEqual(["/r/:path*", "/c/:path*"]);
  expect(vercel.rewrites.some((r) => r.source === "/r/:path*")).toBe(true);
  expect(vercel.rewrites.some((r) => r.source === "/c/:path*" && r.destination === "https://the-deft-crew-production.up.railway.app/c/:path*")).toBe(true);
  expect(vercel.headers.find((x) => x.source === "/c/(.*)").headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
  const spa = vercel.rewrites.findIndex((r) => r.destination === "/index.html");
  expect(vercel.rewrites.findIndex((r) => r.source === "/c/:path*")).toBeLessThan(spa);
});

test("a confession page (/c/<id>) is forwarded the same way, with the visitor's address and the secret", () => {
  const r = req("https://gettdc.pk/c/0123456789abcdef01234567", { "x-real-ip": "203.0.113.9" });
  expect(upstreamUrl(r, {})).toBe("https://the-deft-crew-production.up.railway.app/c/0123456789abcdef01234567");
  expect(forwardHeaders(r, { PORTAL_PROXY_SECRET: SECRET })["x-tdc-visitor-ip"]).toBe("203.0.113.9");
});

test("forwards to the same path and query on the production server (or RESUME_PAGE_ORIGIN)", () => {
  const r = req("https://gettdc.pk/r/AbCdEfGhIjKlMnOpQrStU_?k=self");
  expect(upstreamUrl(r, {})).toBe("https://the-deft-crew-production.up.railway.app/r/AbCdEfGhIjKlMnOpQrStU_?k=self");
  expect(upstreamUrl(r, { RESUME_PAGE_ORIGIN: "https://tdc-server-staging.up.railway.app/" })).toBe("https://tdc-server-staging.up.railway.app/r/AbCdEfGhIjKlMnOpQrStU_?k=self");
});

test("sends the visitor address Vercel set, with the secret; no cookies or other headers", () => {
  const h = forwardHeaders(req("https://gettdc.pk/r/x", { "x-real-ip": "203.0.113.9", "user-agent": "Mozilla/5.0", cookie: "session=1", authorization: "Bearer t", "x-tdc-proxy": "forged", "x-forwarded-for": "1.2.3.4" }), { PORTAL_PROXY_SECRET: SECRET });
  expect(h).toEqual({ "user-agent": "Mozilla/5.0", "accept-encoding": "identity", "x-tdc-proxy": SECRET, "x-tdc-visitor-ip": "203.0.113.9" });
});

test("no secret configured, or no usable address: neither header is sent (the server uses its edge address)", () => {
  expect(forwardHeaders(req("https://gettdc.pk/r/x", { "x-real-ip": "203.0.113.9" }), {})["x-tdc-visitor-ip"]).toBeUndefined();
  const h = forwardHeaders(req("https://gettdc.pk/r/x", { "x-real-ip": "not an ip" }), { PORTAL_PROXY_SECRET: SECRET });
  expect(h["x-tdc-proxy"]).toBeUndefined();
  expect(h["x-tdc-visitor-ip"]).toBeUndefined();
});

test("GET and HEAD only; the server's answer is passed back as is, no redirects followed", async () => {
  const calls = [];
  const answer = { status: 200 };
  const out = await middleware(req("https://gettdc.pk/r/x", { "x-real-ip": "203.0.113.9" }, "POST"), {}, async (url, init) => { calls.push([url, init]); return answer; });
  expect(out).toBe(answer);
  expect(calls[0][1].method).toBe("GET");
  expect(calls[0][1].redirect).toBe("manual");
  await middleware(req("https://gettdc.pk/r/x", {}, "HEAD"), {}, async (url, init) => { calls.push([url, init]); return answer; });
  expect(calls[1][1].method).toBe("HEAD");
});
