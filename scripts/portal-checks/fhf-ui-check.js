// node --experimental-websocket fhf-ui-check.js <buildDir>
// First Hire Free portal pages against a mock API
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
  const b = await launch(9373);
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

  const click = (p, txt) => p.evaluate(`[...document.querySelectorAll("button, a")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(txt)})?.click(); true`);
  const type = (p, sel, val) => p.evaluate(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, ${JSON.stringify(val)}); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  const emp = { _id: E, id: E, role: "employee", name: "Hina", companyName: "Bright Labs" };
  let pg = await open(emp, "/employee-dashboard");
  expect("employer dashboard card", await text(pg), ["your first verified hire is free", "not activated", "verify your company", "terms"]);
  await click(pg, "verify your company");
  await sleep(1500);
  expect("verification form + terms", await text(pg), ["company verification", "registered company name", "NTN", "company e-mail domain", "not gmail, yahoo, outlook", "website", "send for verification", "terms", "nothing is charged today"]);
  const noPrices = !/(PKR|Rs\.?)\s*\d/.test(await text(pg));
  if (!noPrices) bad = 1;
  console.log(`no prices shown: ${noPrices ? "yes" : "PRICE FOUND"}`);
  await type(pg, "#fhf-name", "Bright Labs (Pvt) Ltd"); await type(pg, "#fhf-reg", "1234567-8"); await type(pg, "#fhf-domain", "brightlabs.example"); await type(pg, "#fhf-web", "brightlabs.example");
  await click(pg, "send for verification");
  await sleep(1000);
  expect("sent: being checked", await text(pg), ["being checked", "tdc is checking your company details"]);
  stage = "approved";
  pg = await open(emp, "/first-hire-free");
  expect("approved: activate", await text(pg), ["verified", "NTN checked on FBR", "activate my free hire"]);
  await click(pg, "activate my free hire");
  await sleep(1000);
  expect("activated: active, 1 free hire left, post a job", await text(pg), ["active", "free hires left", "post a job"]);
  stage = "used";
  pg = await open(emp, "/employee-dashboard");
  expect("dashboard card after the free hire: used, pricing coming soon", await text(pg), ["your first verified hire is free", "used", "pricing for further hires is coming soon"]);
  pg.errs.forEach((e) => console.log("    " + e));
  if (pg.errs.length) bad = 1; else console.log("    employer pages: no page errors, no console errors");

  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  const adm = await open(admin, "/admin");
  await adm.evaluate(`[...document.querySelectorAll("button, a")].find((e) => /company verifications/i.test(e.innerText))?.click(); true`);
  await sleep(2000);
  expect("admin: verification queue", await text(adm), ["company verifications"]);
  await adm.evaluate(`(() => { const s = document.querySelector("select[aria-label=status]"); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set; set.call(s, "duplicate_review"); s.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  await sleep(1200);
  expect("admin: duplicate hints", await text(adm), ["Bright Labs", "NTN 12345678", "Hina Bright", "same registration number", "sign-in e-mail on this domain", "approve", "reject"]);
  await click(adm, "approve");
  await sleep(500);
  expect("admin: approving a duplicate explains the shared free hire; reason required", await text(adm), ["approving puts it in the same company", "reason (required)", "it's a different company"]);
  const disabled = await adm.evaluate(`[...document.querySelectorAll("[role=dialog] button, .k-modal button")].find((x) => x.innerText.trim() === "approve")?.disabled === true`);
  if (!disabled) bad = 1;
  console.log(`decision button off until a reason is written: ${disabled ? "yes" : "NO"}`);
  await click(adm, "cancel");
  await sleep(300);
  await adm.evaluate(`[...document.querySelectorAll("button, a")].find((e) => /free-hire trials/i.test(e.innerText))?.click(); true`);
  await sleep(2000);
  expect("admin: trials", await text(adm), ["free-hire trials", "Bright Labs (Pvt) Ltd", "under review", "revoked after the 7-day window", "QA engineer", "restore", "keep", "1 suspected duplicate account"]);
  await adm.evaluate(`[...document.querySelectorAll("[role=tab]")].find((x) => /billing ledger/.test(x.innerText))?.click(); true`);
  await sleep(1200);
  expect("admin: billing ledger (records only)", await text(adm), ["free hire used", "waived (0)", "hire (pricing pending)", "pricing pending"]);
  await adm.evaluate(`[...document.querySelectorAll("button, a")].find((e) => /all employers/i.test(e.innerText))?.click(); true`);
  await sleep(2000);
  expect("admin: employer list badge", await text(adm), ["company verified", "company not verified"]);
  adm.errs.forEach((e) => console.log("    " + e));
  if (adm.errs.length) bad = 1; else console.log("    admin pages: no page errors, no console errors");

  flagOn = false;
  pg = await open(emp, "/employee-dashboard");
  const t = await text(pg);
  if (/first verified hire is free/.test(t)) bad = 1;
  console.log(`flag off: employer dashboard ${/first verified hire is free/.test(t) ? "STILL SHOWS the card" : "has no card"}`);
  const adm2 = await open(admin, "/admin");
  const menu = await adm2.evaluate(`[...document.querySelectorAll("aside a, aside button")].map((a) => a.innerText.trim().toLowerCase()).join("|")`);
  const hiddenMenu = !/company verifications|free-hire trials/.test(menu);
  if (!hiddenMenu) bad = 1;
  console.log(`flag off: admin menu ${hiddenMenu ? "has no first-hire-free pages" : "STILL SHOWS them"}`);
  console.log("API calls: " + [...new Set(calls)].filter((c) => /career|flags/.test(c)).join(", "));
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
