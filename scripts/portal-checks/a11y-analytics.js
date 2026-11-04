// node --experimental-websocket a11y-analytics.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Accessibility of the analytics (admin overview, brand insights, employer hiring results):
// axe-core (from the portal's node_modules) is injected into each page and
// run with the WCAG 2 A and AA rules on the page content (main) and on open dialogs, against the same mock API
// as an-ui-check.js. Prints every violation; exits 1 if there is any.
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
  const b = await launch(9403);
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

  const AXE = require("fs").readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  const findings = [];
  const audit = async (pg, label, scope = "main") => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    findings.push({ label, v });
    console.log(`${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };
  const clickText = (p, txt) => p.evaluate(`[...document.querySelectorAll("button, a, [role=tab]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(txt)})?.click(); true`);
  const clickMatch = (p, re) => p.evaluate(`[...document.querySelectorAll("button, a, [role=tab]")].find((x) => ${re}.test(x.innerText))?.click(); true`);

  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  const page = process.env.A11Y_SET || "analytics";
  if (page === "surplus") {
    const brand = { _id: A, id: A, role: "brand", name: "Alpha", brandName: "Alpha", brandApprovalStatus: "approved" };
    const pg = await open(brand, "/surprise-boxes");
    await audit(pg, "brand surprise boxes: today");
    await clickText(pg, "cancel"); await sleep(500); await audit(pg, "brand surprise boxes: cancel dialog", "[role=dialog]"); await clickText(pg, "keep it"); await sleep(300);
    await clickMatch(pg, /^listings/); await sleep(1000); await audit(pg, "brand surprise boxes: listings");
    await clickText(pg, "new surprise box"); await sleep(600); await audit(pg, "brand surprise boxes: listing form", "[role=dialog]"); await pg.evaluate(`document.querySelector("[role=dialog] button[aria-label=close]")?.click(); true`); await sleep(300);
    await clickMatch(pg, /verify pickup/); await sleep(800); await audit(pg, "brand surprise boxes: verify pickup");
    const adm = await open(admin, "/admin");
    await clickMatch(adm, /surprise boxes/i); await sleep(2000); await audit(adm, "admin surprise boxes: cases");
    for (const t of ["orders", "no-shows", "brands"]) { await clickText(adm, t); await sleep(800); await audit(adm, `admin surprise boxes: ${t}`); }
    await audit(adm, "admin shell (existing)", "aside");
  }
  if (page === "fhf") {
    const emp = { _id: E, id: E, role: "employee", name: "Hina", companyName: "Bright Labs" };
    let pg = await open(emp, "/employee-dashboard");
    await audit(pg, "employer dashboard (free-hire card)", "[data-card=first-hire-free]");
    pg = await open(emp, "/first-hire-free");
    await audit(pg, "employer first hire free page");
    const adm = await open(admin, "/admin");
    await clickMatch(adm, /company verifications/i); await sleep(2000); await audit(adm, "admin company verifications");
    await clickText(adm, "approve"); await sleep(500); await audit(adm, "admin verification decision dialog", "[role=dialog]"); await clickText(adm, "cancel"); await sleep(300);
    await clickMatch(adm, /free-hire trials/i); await sleep(2000); await audit(adm, "admin free-hire trials");
    await clickMatch(adm, /billing ledger/); await sleep(1000); await audit(adm, "admin billing ledger");
  }
  if (page === "analytics") {
    const adm = await open(admin, "/admin");
    await adm.evaluate(`[...document.querySelectorAll("button, a")].find((e) => e.innerText.trim().toLowerCase() === "overview")?.click(); true`); await sleep(2000);
    await audit(adm, "admin overview");
    const brand = { _id: A, id: A, role: "brand", name: "Tiny", brandName: "Tiny Shop", brandApprovalStatus: "approved" };
    await audit(await open(brand, "/insights"), "brand insights");
    const emp = { _id: E, id: E, role: "employee", name: "Hina", companyName: "Bright Labs" };
    await audit(await open(emp, "/hiring-results"), "employer hiring results");
  }
  if (page === "career") {
    const emp = { _id: E, id: E, role: "employee", name: "Hire Co", companyName: "Hire Co" };
    const pg = await open(emp, "/candidate");
    await audit(pg, "employer candidate pipeline");
    await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => /Taha Ali/.test(x.innerText))?.click(); true`); await sleep(1500);
    await audit(pg, "candidate drawer (timeline, sent resume)", "[role=dialog]");
    await clickText(pg, "schedule interview"); await sleep(800); await audit(pg, "schedule interview dialog", "[role=dialog]:last-of-type");
    const adm = await open(admin, "/admin");
    await clickMatch(adm, /hiring funnel/i); await sleep(2000); await audit(adm, "admin hiring funnel");
  }
  if (page === "loyalty") {
    const brand = { _id: A, id: A, role: "brand", name: "Alpha", brandName: "Alpha", brandApprovalStatus: "approved" };
    await audit(await open(brand, "/loyalty"), "brand loyalty");
    const adm = await open(admin, "/admin");
    await clickMatch(adm, /loyalty exceptions/i); await sleep(2000); await audit(adm, "admin loyalty exceptions");
  }

  const total = findings.reduce((n, f) => n + f.v.length, 0);
  console.log(`\nA11Y_TOTAL=${total}`);
  b.close();
  process.exit(total ? 1 : 0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
