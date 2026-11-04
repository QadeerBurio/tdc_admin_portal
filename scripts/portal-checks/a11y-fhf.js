// node --experimental-websocket a11y-fhf.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Accessibility of the First Hire Free (employer dashboard card and page, admin verifications, trials, billing ledger):
// axe-core (from the portal's node_modules) is injected into each page and
// run with the WCAG 2 A and AA rules on the page content (main) and on open dialogs, against the same mock API
// as fhf-ui-check.js. Prints every violation; exits 1 if there is any.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5194, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const E = "6ae9aaaaaaaaaaaaaaaaaaaa", E2 = "6ae9abababababababababab";
let flagOn = true;
let stage = "none"; // none -> pending -> approved -> active -> used
const policy = { version: "fhf-2026-11", text: "Your company's first verified hire through tdc is free: no fee for one hire per verified company. Pricing for further hires is coming soon; nothing is charged today.", furtherHires: "Pricing for further hires is coming soon." };
const verification = () => (stage === "none" ? null : { id: "v1", status: stage === "pending" ? "pending" : "approved", companyName: "Bright Labs (Pvt) Ltd", registrationType: "ntn", ntnOrSecp: "12345678", businessEmailDomain: "brightlabs.example", website: "brightlabs.example", reason: stage === "pending" ? "" : "NTN checked on FBR", reviewedAt: new Date().toISOString(), submittedAt: new Date().toISOString() });
const trialView = () => ({
  enabled: true, status: { none: "not_activated", pending: "not_activated", approved: "not_activated", active: "active", used: "used" }[stage],
  remainingFreeHires: stage === "active" ? 1 : 0, usedOn: stage === "used" ? new Date().toISOString() : null,
  nextAction: { none: { action: "verify_company", label: "verify your company" }, pending: { action: "wait_for_review", label: "tdc is checking your company details" }, approved: { action: "activate", label: "activate your free hire" }, active: { action: "post_job", label: "post a job and hire through tdc" }, used: { action: "none", label: "pricing for further hires is coming soon" } }[stage],
  policy, verification: verification(),
});
const routesNow = (k) => {
  if (k === "POST /api/career/employers/me/verification") { stage = "pending"; return ok(trialView()); }
  if (k === "POST /api/career/employers/me/trial/activate") { stage = "active"; return ok(trialView()); }
  return ({
    "GET /api/app/flags/me": { metaEvents: false, careerTimeline: true, employerFirstHireFree: flagOn },
    "GET /api/auth/me": { user: { _id: E, name: "Hina", role: "employee", companyName: "Bright Labs" } },
    "GET /api/career/employers/me/trial": flagOn ? ok(trialView()) : 404,
    "GET /api/career/employers/me/trial/summary": ok({ jobs: 2, applicants: 7, completedInterviews: 2, verifiedHires: stage === "used" ? 1 : 0, freeHireUsed: stage === "used", feeWaivedHires: 0, hiresPendingPricing: 0 }),
    "GET /api/career/admin/verifications": ok([{ id: "v2", employer: { id: E2, name: "Omar Bright", email: "omar@brightlabs.example", accountStatus: "Not Verified" }, companyName: "Bright Labs", registrationType: "ntn", ntnOrSecp: "12345678", businessEmailDomain: "brightlabs.example", website: "brightlabs.example", companyGroupKey: "reg:12345678", status: "duplicate_review", reason: "", submittedAt: new Date().toISOString(), hints: { signInEmailMatchesDomain: true, websiteMatchesDomain: true }, duplicateOf: [{ verificationId: "v1", employer: { id: E, name: "Hina Bright" }, matchedOn: ["registration number"] }], history: [] }]),
    "GET /api/career/admin/trials": ok({ trials: [{ id: "t1", companyGroupKey: "reg:12345678", companyName: "Bright Labs (Pvt) Ltd", status: "under_review", entitlementCount: 1, consumedCount: 1, consumedAt: new Date().toISOString(), fraudReviewStatus: "open", reviewReason: "the free hire was revoked after the 7-day window", usedBy: { applicationId: "a1", job: "QA engineer", candidateFirstName: "Sana" }, employers: [{ id: E, name: "Hina Bright", status: "approved" }], suspectedDuplicates: 1, version: 3, history: [] }], suspectedDuplicates: 1 }),
    "GET /api/career/admin/billing-events": ok([{ id: "b1", companyGroupKey: "reg:12345678", employer: { id: E, name: "Hina Bright" }, applicationId: "a1", eventType: "free_hire_consumed", feeWaived: true, amount: 0, currency: "PKR", note: "first verified hire", createdAt: new Date().toISOString() }, { id: "b2", companyGroupKey: "reg:12345678", employer: { id: E, name: "Hina Bright" }, applicationId: "a2", eventType: "hire_billable_pending_pricing", feeWaived: false, amount: null, currency: "PKR", note: "", createdAt: new Date().toISOString() }]),
    "GET /api/career/admin/employers/company-status": ok({ [E]: { status: "approved", companyName: "Bright Labs" } }),
    "GET /api/admin/users/employee": [{ _id: E, name: "Hina Bright", email: "hina@brightlabs.example", role: "employee", status: "Not Verified", createdAt: new Date().toISOString() }, { _id: E2, name: "Omar Bright", email: "omar@brightlabs.example", role: "employee", status: "Not Verified", createdAt: new Date().toISOString() }],
  })[k];
};
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
  const b = await launch(9402);
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
  const page = process.env.A11Y_SET || "fhf";
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
