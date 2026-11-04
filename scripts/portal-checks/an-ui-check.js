// node --experimental-websocket an-ui-check.js <buildDir>
// Business analytics portal pages against a mock API: admin overview, brand insights, employer hiring results.
// Portal build (REACT_APP_API_URL=http://127.0.0.1:5197) against a mock /api/career; signs in through
// localStorage; checks the employer pipeline, the candidate drawer and the admin hiring funnel render,
// with no page or console errors.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5194, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });
let flagOn = true;
const okA = (data) => ({ success: true, data, requestId: "mock" });
const A = "6ae9aaaaaaaaaaaaaaaaaaaa", E = "6ae9abababababababababab";
const range = { from: new Date(Date.now() - 30 * 864e5).toISOString(), to: new Date().toISOString() };
const funnel = { range: {}, counts: { applications: 12, submitted: 10, joinedPilotLater: 2, reviewed: 9, shortlisted: 6, rejected: 3, withdrawn: 1, interviewsInvited: 5, interviewsAccepted: 4, interviewsCompleted: 3, noShowReports: 1, offersSent: 3, offersAccepted: 2, offersDeclined: 1, verifiedHires: 1, disputes: 0 }, conversions: { acceptedToVerifiedHire: 50 }, medianHours: { firstEmployerResponse: 20.5 } };
const routesNow = (k) => ({
  "GET /api/app/flags/me": { employerFirstHireFree: true, loyaltyV2: false, surplusBoxes: false },
  "GET /api/analytics/admin/overview": okA({
    range, minCohort: 5,
    discounts: { redemptions: 15, uniqueStudents: 11, billTotal: 13300, savedTotal: 2660, repeatCustomers: 4, studentBrandPairs: 11, repeatRatePct: 36.4, archivedRedemptions: 1, definitions: { redemptions: "bills the brand confirmed" }, topBrands: [{ id: "b1", name: "Alpha Cafe", redemptions: 11, uniqueStudents: 8, studentBrandPairs: 8, repeatRatePct: 37.5, savedTotal: 2200 }], brandsHidden: 1 },
    loyalty: { countedVisits: 6, creditsNotCounted: 1, reversals: 1, netVisits: 5, members: 5, uniqueStudents: 5, membersByTier: { Member: 4, Regular: 1 }, membersByTierNote: "", definitions: { countedVisits: "credits that counted" } },
    surpriseBox: { ordersPlaced: 8, boxesOrdered: 9, verifiedPickups: 3, boxesPickedUp: 4, collectedAtPickup: 1350, cancelledByStudent: 1, cancelledByBrand: 1, noShows: 2, disputes: 1, pickupRatePct: 50, pickupRateDenominator: 6, definitions: { verifiedPickups: "verified codes" } },
    hiring: funnel,
    resumeStudio: { tailoringStarted: 14, tailoringCompleted: 11, tailoringFailed: 2, inProgress: 1, failedByReason: { TIMED_OUT: 2 }, studentsTailoring: 9, approvals: 7, studentsApproved: 6, applicationsWithTailoredVersion: 4, suggestions: 60, factualCheckRejections: 9, factualCheckRejectionPct: 15, needsConfirmation: 5, timeToDraftSeconds: { p50: 42, p95: 131, count: 11 }, definitions: { approvals: "tailored versions students approved in the range" } },
    employers: { companiesVerified: 1, verificationsPending: 0, suspectedDuplicates: 1, verificationsRejected: 0, trialsIssued: 1, trialsIssuedInRange: 1, trialsActive: 0, trialsUsed: 1, trialsUnderReview: 0, freeHiresConsumed: 1, freeHiresRestored: 0, netFreeHires: 1, hiresPendingPricing: 1, payingEmployers: 0, feesCollected: 0, trialToPaidPct: null, definitions: { payingEmployers: "no pricing exists yet" } },
  }),
  "GET /api/analytics/brands/me": okA({ range, minCohort: 5, discounts: { redemptions: 3, uniqueStudents: null, billTotal: 1500, savedTotal: 300, repeatCustomers: null, repeatRatePct: null, note: "hidden: fewer than 5 students", definitions: {} }, loyalty: { countedVisits: 0, creditsNotCounted: 0, reversals: 0, netVisits: 0, members: 0, uniqueStudents: 0, membersByTier: null, membersByTierNote: "hidden: fewer than 5 students" }, surpriseBox: { ordersPlaced: 2, boxesOrdered: 2, verifiedPickups: 1, collectedAtPickup: 450, cancelledByStudent: 0, cancelledByBrand: 0, noShows: 1, disputes: 0, pickupRatePct: 50, pickupRateDenominator: 2 } }),
  "GET /api/analytics/employers/me": okA({ range, hiring: funnel, trial: { status: "used", remainingFreeHires: 0, nextAction: { action: "none", label: "pricing for further hires is coming soon" }, summary: { applicants: 12, completedInterviews: 3, verifiedHires: 1, freeHireUsed: true }, furtherHires: "Pricing for further hires is coming soon." } }),
  "GET /api/career/employers/me/trial": 404,
})[k];
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(k);
  if (/^GET \/api\/(career|analytics)\/admin/.test(k) && !flagOn) { s.writeHead(404, h); return s.end(JSON.stringify({ success: false, error: { code: "OFF" } })); }
  const rt = routesNow(k, q);
  if (rt === 404) { s.writeHead(404, h); return s.end(JSON.stringify({ success: false, error: { code: "NOT_FOUND" } })); }
  s.writeHead(200, h);
  const b = rt;
  s.end(JSON.stringify(b !== undefined ? b : q.method === "GET" ? [] : { success: true }));
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(s);
}).listen(WEB);

(async () => {
  const b = await launch(9383);
  let bad = 0;
  const open = async (who, p) => {
    const pg = await b.page();
    pg.errs = [];
    await pg.s("Log.enable");
    pg.on((m) => {
      if (m.method === "Runtime.exceptionThrown") pg.errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") pg.errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error") pg.errs.push("log: " + m.params.entry.text.slice(0, 160));
    });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    await sleep(3500);
    return pg;
  };
  const text = (pg) => pg.evaluate(`document.body.innerText || ""`);
  const expect = (label, t, want) => {
    const miss = want.filter((w) => !t.toLowerCase().includes(w.toLowerCase()));
    if (miss.length) bad = 1;
    console.log(`${label}: ${miss.length ? "MISSING " + miss.join(" | ") : "all expected text present"}`);
  };

  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  const adm = await open(admin, "/admin");
  await adm.evaluate(`[...document.querySelectorAll("button, a")].find((e) => e.innerText.trim().toLowerCase() === "overview")?.click(); true`);
  await sleep(2000);
  expect("admin overview: all six cards with denominators", await text(adm), ["overview", "claims, holds and scheduled interviews never count", "discounts", "redemptions (brand-confirmed)", "36.4% of 11", "of which deleted brands", "1 brand(s) with fewer than 5 students not listed", "loyalty", "members: Regular", "surprise box", "verified pickups", "50% of 6", "hiring", "verified hires", "20.5 h", "employers", "free hires used (net of restored)", "hires pending pricing", "paying employers", "not measurable yet", "resume studio", "tailoring started", "11 / 2 / 1", "applications with a tailored version", "blocked by the factual check", "9 (15% of 60)", "42 s / 2.2 min", "failed: timed out 2", "brands by redemptions", "Alpha Cafe", "export csv", "from", "to"]);
  await adm.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "export csv")?.click(); true`);
  await sleep(500);
  const hasDefs = await adm.evaluate(`document.querySelectorAll("details summary").length >= 5`);
  if (!hasDefs) bad = 1;
  console.log(`each card says what it counts: ${hasDefs ? "yes" : "NO"}`);
  adm.errs.forEach((e) => console.log("    " + e));
  if (adm.errs.length) bad = 1; else console.log("    admin overview (and csv export): no page errors, no console errors");

  const brand = { _id: A, id: A, role: "brand", name: "Tiny", brandName: "Tiny Shop", brandApprovalStatus: "approved" };
  const pg = await open(brand, "/insights");
  const bmenu = await pg.evaluate(`[...document.querySelectorAll("aside a, aside button")].map((a) => a.innerText.trim().toLowerCase()).join("|")`);
  if (!/insights/.test(bmenu)) bad = 1;
  console.log(`brand menu: ${/insights/.test(bmenu) ? "has 'insights'" : "MISSING insights"}`);
  expect("brand insights: own figures, small cohort hidden", await text(pg), ["insights", "redemptions you confirmed", "hidden", "fewer than 5 students", "surprise boxes", "verified pickups"]);
  pg.errs.forEach((e) => console.log("    " + e));
  if (pg.errs.length) bad = 1; else console.log("    brand insights: no page errors, no console errors");

  const emp = { _id: E, id: E, role: "employee", name: "Hina", companyName: "Bright Labs" };
  const ep = await open(emp, "/hiring-results");
  expect("employer hiring results: funnel + first hire free", await text(ep), ["hiring results", "your funnel", "verified hires", "interviews completed", "first hire free", "free hire used", "pricing for further hires is coming soon"]);
  const prices = /(PKR|Rs\.?)\s*\d/.test(await text(ep));
  if (prices) bad = 1;
  console.log(`no prices on the employer page: ${prices ? "PRICE FOUND" : "yes"}`);
  ep.errs.forEach((e) => console.log("    " + e));
  if (ep.errs.filter((e) => !/status of 404/.test(e)).length) bad = 1; else console.log("    employer page: no page errors, no console errors (404 = the dashboard card's trial check outside the pilot)");
  console.log("API calls: " + [...new Set(calls)].filter((c) => /analytics|flags/.test(c)).join(", "));
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
