// node --experimental-websocket a11y-career.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Accessibility of the hiring timeline (employer pipeline, candidate drawer, schedule dialog, admin hiring funnel):
// axe-core (from the portal's node_modules) is injected into each page and
// run with the WCAG 2 A and AA rules on the page content (main) and on open dialogs, against the same mock API
// as career-ui-check.js. Prints every violation; exits 1 if there is any.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5194, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });
const E = "6ae9aaaaaaaaaaaaaaaaaaaa", A1 = "6ae9a1a1a1a1a1a1a1a1a1a1", A2 = "6ae9a2a2a2a2a2a2a2a2a2a2", IV = "6ae9c1c1c1c1c1c1c1c1c1c1";
const now = Date.now();
const A4 = "6ae9a4a4a4a4a4a4a4a4a4a4";
const apps = [
  { applicationId: A4, jobId: "j1", jobTitle: "Backend dev", candidateName: "Zara Khan", appliedAt: new Date(now - 1 * 864e5).toISOString(), careerEnabled: true, stage: "applied", version: 1, interview: { status: "none" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["REVIEWED", "SHORTLISTED", "REJECTED"] },
  { applicationId: A1, jobId: "j1", jobTitle: "Backend dev", candidateName: "Sana Khan", appliedAt: new Date(now - 5 * 864e5).toISOString(), careerEnabled: true, stage: "interview", version: 4, interview: { id: IV, status: "accepted", startsAt: new Date(now + 2 * 864e5).toISOString() }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["REJECTED", "INTERVIEW_RESCHEDULED", "INTERVIEW_CANCELLED"] },
  { applicationId: A2, jobId: "j1", jobTitle: "Backend dev", candidateName: "Taha Ali", appliedAt: new Date(now - 2 * 864e5).toISOString(), careerEnabled: true, stage: "applied", version: 1, interview: { status: "none" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["REVIEWED", "SHORTLISTED", "REJECTED"] },
  { applicationId: "6ae9a3a3a3a3a3a3a3a3a3a3", jobId: "j1", jobTitle: "Backend dev", candidateName: "Umar Old", appliedAt: new Date(now - 9 * 864e5).toISOString(), careerEnabled: false, stage: "reviewed", version: 0, interview: { status: "none" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: [] },
];
const timelineA2 = { applicationId: A2, job: { id: "j1", title: "Backend dev", company: "Hire Co", archived: false }, external: false, externalLabel: null, stage: "applied", legacyStatus: "pending", version: 1, interview: { status: "none" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["REVIEWED", "SHORTLISTED", "INTERVIEW_INVITED", "REJECTED"], events: [{ id: "e1", seq: 1, type: "APPLIED", actorRole: "system", source: "app", occurredAt: new Date(now - 2 * 864e5).toISOString(), metadata: {} }], interviewDetails: null, offerDetails: null };
const routes = {
  "GET /api/app/flags/me": { metaEvents: false, loyaltyV2: false, careerTimeline: true, careerMatching: true },
  [`GET /api/career/matching/applications/${A2}`]: ok({ applicationId: A2, modelVersion: "skill-evidence-1", computedAt: new Date(now - 3600e3).toISOString(), source: "resume", note: "Decision support only: an estimate from the resume, not a hiring prediction. Nothing is rejected or hidden automatically.", relevance: { score: 67, insufficient: null, label: "estimate: evidence for 2 of 3 listed skills", formula: "estimate = 100 x (job skills with evidence in the resume) / (skills the job lists)" }, mandatory: [{ criterion: "at least 1 year of work experience", status: "not_met", evidence: "the resume lists no work experience" }, { criterion: "education: Bachelor's Degree", status: "met", evidence: "BS" }], mandatorySummary: { met: 1, notMet: 1, unknown: 0 }, skills: { matched: [{ skill: "Node.js", evidence: [{ path: "projects[0].technologies[0]", text: "Node.js" }] }, { skill: "MongoDB", evidence: [{ path: "skills[1]", text: "MongoDB" }] }], missing: [{ skill: "Docker", evidence: [{ path: "", text: "not found in the resume's skills, projects or experience" }] }], unknown: [] }, evidenceSummary: "2 matched, 1 missing" }),
  "GET /api/career/matching/jobs/j1": ok({ sort: "relevance", applications: [{ applicationId: A2, match: { score: 67, label: "estimate: evidence for 2 of 3 listed skills" } }, { applicationId: A4, match: { score: 33, label: "estimate: evidence for 1 of 3 listed skills" } }, { applicationId: A1, match: null }], summary: { strong: 0, medium: 1, weak: 1, insufficient: 0, outsidePilot: 1, total: 3, thresholds: { strong: 70, medium: 40 }, note: "An estimate from each resume's skill evidence, not a judgment of the candidates." } }),
  "GET /api/career/employers/me/applications": ok({ enabled: true, jobs: [{ id: "j1", title: "Backend dev", archived: false, external: false }], applications: apps }),
  [`GET /api/career/applications/${A2}/timeline`]: ok(timelineA2),
  [`GET /api/career/resume/applications/${A2}/resume`]: ok({ applicationId: A2, jobId: "j1", versionId: "v1", label: "Backend dev - Taha", contentHash: "abcdef1234567890ff", attachedAt: new Date(now - 864e5).toISOString(), templateId: "ats-classic" }),
  "GET /api/career/admin/analytics": ok({ range: {}, counts: { applications: 12, submitted: 10, joinedPilotLater: 2, reviewed: 9, shortlisted: 6, rejected: 3, withdrawn: 1, interviewsInvited: 5, interviewsAccepted: 4, interviewsCompleted: 3, noShowReports: 1, offersSent: 3, offersAccepted: 2, offersDeclined: 1, verifiedHires: 1, disputes: 2 }, conversions: { submittedToReviewed: 75, reviewedToShortlisted: 66.7, shortlistedToCompletedInterview: 50, completedInterviewToOffer: 100, offerToAccepted: 66.7, acceptedToVerifiedHire: 50 }, medianHours: { firstEmployerResponse: 20.5, toFirstInterviewInvite: 70, toVerifiedHire: 300 } }),
};
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(k);
  if (k.endsWith("/resume.pdf")) { s.writeHead(200, { ...h, "content-type": "application/pdf" }); return s.end("%PDF-1.3 mock"); }
  if (k.includes("/career/resume/") && !(k in routes)) { s.writeHead(404, h); return s.end(JSON.stringify({ success: false, error: { code: "NOT_FOUND", message: "No tailored resume for this application" } })); }
  s.writeHead(200, h);
  const b = routes[k];
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
  const b = await launch(9404);
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
  const page = process.env.A11Y_SET || "career";
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
    // one job chosen: the match quality bar (strong / medium / weak) shows above the columns
    const pgq = await open(emp, "/candidate");
    await pgq.evaluate(`(() => { const s = document.querySelector('select[aria-label="job"]'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(s, "j1"); s.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
    await sleep(1500);
    await audit(pgq, "candidate pipeline for one job, with the match quality bar");
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
