// node --experimental-websocket a11y-loyalty.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Accessibility of the loyalty (brand loyalty and verify pages, admin loyalty exceptions and reverse dialog):
// axe-core (from the portal's node_modules) is injected into each page and
// run with the WCAG 2 A and AA rules on the page content (main) and on open dialogs, against the same mock API
// as loyalty-ui-check.js. Prints every violation; exits 1 if there is any.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;

const B = "6ae9aaaaaaaaaaaaaaaaaaaa", S = "6ae9bbbbbbbbbbbbbbbbbbbb", O = "6ae9cccccccccccccccccccc";
const program = { id: "6ae9dddddddddddddddddddd", brand: B, status: "active", version: 3, tiers: [{ name: "Member", minVisit: 1, maxVisit: 5, discountPct: 15 }, { name: "Regular", minVisit: 6, maxVisit: null, discountPct: 25 }], maxDiscountPct: 25, brandMaxDiscountPct: 25, adminMaxDiscountPct: null, eligibleOfferIds: [], branchIds: [], maxVisitsPerDay: 1, resetMonths: 12, terms: "one visit a day counts", startsAt: null, endsAt: null };
const loyaltyQuote = { applies: true, tierName: "Member", discountPct: 15, visits: 2, nextVisitNumber: 3, nextTier: { name: "Regular", minVisit: 6, discountPct: 25 }, visitsBeforeNextTier: 3, countsAsVisit: true };
const ok = (data) => ({ success: true, data, requestId: "mock" });
const routes = {
  "GET /api/app/flags/me": { metaEvents: false, loyaltyV2: true },
  "GET /api/loyalty/programs/mine": ok(program),
  "GET /api/loyalty/brands/me/analytics": ok({ program, verifiedVisits: 42, members: 17, repeatCustomers: 9, reversals: 1, creditsNotCounted: 3, uniqueStudents: 17, tierCounts: { Member: 14, Regular: 3 } }),
  "GET /api/branches/my-branches": { success: true, branches: [{ _id: "6ae9eeeeeeeeeeeeeeeeeeee", name: "Clifton", city: "Karachi" }] },
  "GET /api/offers/my-offers": [{ _id: O, title: "Alpha 20%", discountPercentage: 20, createdAt: new Date().toISOString(), isInStore: true }],
  "GET /api/offers/pending-scans": [{ studentId: S, name: "Sana", rollNo: "21K-1", universityName: "SZABIST", offerId: O, offerTitle: "Alpha 20%", discountPercentage: 15, offerDiscountPercentage: 20, scannedAt: new Date().toISOString(), status: "pending", loyalty: loyaltyQuote }],
  "GET /api/offers/claimed-users": [{ _id: S, name: "Sana", rollNo: "21K-1", universityName: "SZABIST", offerId: O, offerTitle: "Alpha 20%", discountPercentage: 20 }],
  "POST /api/loyalty/quotes": ok({ ...loyaltyQuote, discountPercentage: 15 }),
  "GET /api/loyalty/admin/ledger": ok({ rows: [
    { id: "r1", type: "CREDIT", visitsDelta: 1, redemptionId: "x1", brand: B, brandName: "Alpha Cafe", student: S, studentName: "Sana", source: "redeem-payment", reason: "", visitNumber: 3, tierName: "Member", discountPct: 15, billAmount: 1000, savedAmount: 150, reversed: false, at: new Date().toISOString() },
    { id: "r2", type: "CREDIT", visitsDelta: 0, redemptionId: "x2", brand: B, brandName: "Alpha Cafe", student: S, studentName: "Sana", source: "redeem-payment", reason: "daily-limit", visitNumber: null, tierName: "Member", discountPct: 15, reversed: false, at: new Date().toISOString() },
    { id: "r3", type: "REVERSAL", visitsDelta: -1, redemptionId: "x0", brand: B, brandName: "Alpha Cafe", student: S, studentName: "Sana", source: "admin", reason: "refund: order returned", actorName: "admin", reversed: false, at: new Date().toISOString() },
  ] }),
};
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const key = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(key);
  const body = routes[key];
  s.writeHead(200, h);
  s.end(JSON.stringify(body !== undefined ? body : (q.method === "GET" ? [] : { success: true })));
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(s);
}).listen(WEB);

(async () => {
  const b = await launch(9406);
  let bad = 0;
  const visit = async (who, p, expect) => {
    const pg = await b.page();
    const errs = [];
    await pg.s("Log.enable");
    pg.on((m) => {
      if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error") errs.push("log: " + m.params.entry.text.slice(0, 160));
    });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    await sleep(4000);
    const text = await pg.evaluate(`document.getElementById("root")?.innerText || ""`);
    const missing = expect.filter((t) => !text.toLowerCase().includes(t.toLowerCase()));
    if (missing.length || errs.length || text.trim().length < 20) bad = 1;
    console.log(`${who.role} ${p}: ${text.trim().length} chars; ${missing.length ? "MISSING " + missing.join(" | ") : "all expected text present"}`);
    errs.forEach((e) => console.log("    " + e));
    if (!errs.length) console.log("    no page errors, no console errors");
    return pg;
  };

  const AXE = require("fs").readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  let total = 0;
  const audit = async (pg, label, scope = "main") => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    total += v.length;
    console.log(`${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };
  const brand = { _id: B, id: B, role: "brand", name: "Alpha", brandName: "Alpha Cafe" };
  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  await audit(await visit(brand, "/loyalty", []), "brand loyalty");
  await audit(await visit(brand, "/verifyclaim", []), "brand verify (loyalty line)");
  const pg = await visit(admin, "/admin", []);
  await pg.evaluate(`[...document.querySelectorAll("button, a")].find((e) => /loyalty exceptions/i.test(e.innerText))?.click(); true`);
  await sleep(2500);
  await audit(pg, "admin loyalty exceptions");
  await pg.evaluate(`[...document.querySelectorAll("button")].find((e) => e.innerText.trim() === "reverse")?.click(); true`);
  await sleep(800);
  await audit(pg, "admin reverse dialog", "[role=dialog]");
  console.log(`\nA11Y_TOTAL=${total}`);
  b.close();
  process.exit(total ? 1 : 0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
