// node --experimental-websocket job-funnel-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// One job's hiring funnel, against a mock API:
// - employer reports page, pilot employers (FLAG_CAREER_TIMELINE): "hiring by job" with all jobs, then one job
//   (?jobId sent): views, applicants, shortlisted, interviewed, verified hires, time to hire, first response;
//   outside the pilot: no card and no analytics request;
// - admin hiring funnel: a job id filter (sent only when it's a 24-character id) and the job's facts.
// axe-core WCAG 2 A / AA on the card. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const E = "6af9000000000000000000e1", J1 = "6afa000000000000000000a1", J2 = "6afa000000000000000000a2";
const counts = (n) => ({ applications: n, submitted: n, joinedPilotLater: 0, reviewed: n - 1, shortlisted: n - 2, rejected: 1, withdrawn: 0, interviewsInvited: 3, interviewsAccepted: 2, interviewsCompleted: 2, noShowReports: 0, offersSent: 1, offersAccepted: 1, offersDeclined: 0, verifiedHires: 1, disputes: 0 });
const funnel = (jobId) => ({ range: {}, jobId: jobId || null, counts: counts(jobId ? 6 : 11), conversions: { submittedToReviewed: 80, reviewedToShortlisted: 50, shortlistedToCompletedInterview: 50, completedInterviewToOffer: 50, offerToAccepted: 100, acceptedToVerifiedHire: 100 }, medianHours: { firstEmployerResponse: 20, toFirstInterviewInvite: 70, toVerifiedHire: 324 }, ...(jobId ? { job: { id: jobId, title: jobId === J1 ? "Backend dev" : "Designer", views: 120, applicants: 8, archived: false } } : {}) });
let pilot = true;
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const u = new URL(q.url, "http://x");
  const k = `${q.method} ${u.pathname}`;
  const p = Object.fromEntries(u.searchParams);
  calls.push({ k, p });
  let out;
  if (k === "GET /api/app/flags/me") out = { careerTimeline: pilot };
  else if (k === "GET /api/career/employers/me/applications") out = ok({ enabled: true, jobs: [{ id: J1, title: "Backend dev" }, { id: J2, title: "Designer" }], applications: [] });
  else if (k === "GET /api/career/employers/me/analytics") out = ok(funnel(p.jobId));
  else if (k === "GET /api/career/admin/analytics") out = ok(funnel(p.jobId));
  else if (k === "GET /api/jobs/stats") out = { totalJobs: 2, totalApplications: 11 };
  else out = q.method === "GET" ? [] : { success: true };
  s.writeHead(200, h);
  s.end(JSON.stringify(out));
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(s);
}).listen(WEB);
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");

(async () => {
  const b = await launch(9360);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const signIn = async (who) => { await go(pg, `http://127.0.0.1:${WEB}/`); await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`); };
  const card = () => pg.evaluate(`document.querySelector("[data-card=job-funnel]")?.innerText || ""`);
  const lastOf = (p) => [...calls].reverse().find((c) => c.k === `GET ${p}`)?.p || null;

  await signIn({ _id: E, id: E, role: "employee", name: "Hire Co", companyName: "Hire Co" });
  await go(pg, `http://127.0.0.1:${WEB}/reports`);
  await sleep(3500);
  let t = await card();
  check("pilot employer: 'hiring by job' on the reports page, all jobs first", t.includes("hiring by job") && t.includes("applications on the timeline") && t.includes("11") && !t.includes("views") && lastOf("/api/career/employers/me/analytics") && !lastOf("/api/career/employers/me/analytics").jobId, t.replace(/\n/g, " | ").slice(0, 200));
  await pg.evaluate(`(() => { const el = document.querySelector('[data-card=job-funnel] select[aria-label="job"]'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, ${JSON.stringify(J1)}); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  await sleep(1200);
  t = await card();
  check("one job: ?jobId sent; views, applicants, shortlisted, interviewed, hired, time to hire, first response", lastOf("/api/career/employers/me/analytics")?.jobId === J1 && ["views", "120", "applicants", "8", "shortlisted", "4", "interviewed", "3 invited", "hired (verified)", "time to hire", "13.5 days", "first response", "20 h"].every((w) => t.includes(w)), t.replace(/\n/g, " | ").slice(0, 300));
  await pg.evaluate(AXE + "; true");
  const v = await pg.evaluate(`(async () => { const r = await axe.run(document.querySelector("[data-card=job-funnel]"), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length })); })()`);
  check("axe WCAG 2 A/AA: hiring by job", v.length === 0, v.length ? JSON.stringify(v) : "no violations");

  pilot = false;
  calls.length = 0;
  await go(pg, `http://127.0.0.1:${WEB}/reports`);
  await sleep(3500);
  check("outside the pilot: no card, no analytics request", !(await card()) && !calls.some((c) => c.k === "GET /api/career/employers/me/analytics"));

  // admin funnel: job id filter
  await signIn({ _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" });
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  await pg.evaluate(`[...document.querySelectorAll("button, a")].find((x) => /^hiring funnel$/i.test(x.innerText.trim()))?.click(); true`);
  await sleep(1500);
  const setJob = (v) => pg.evaluate(`(() => { const el = document.getElementById("hf-job"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await setJob("not-an-id");
  await sleep(800);
  check("admin: a job id that isn't 24 characters isn't sent", !lastOf("/api/career/admin/analytics")?.jobId);
  await setJob(J2);
  await sleep(1200);
  check("admin: a job id is sent, and the job's facts shown", lastOf("/api/career/admin/analytics")?.jobId === J2 && (await pg.evaluate(`document.querySelector("[data-job-facts]")?.innerText || ""`)).includes("Designer") && (await pg.evaluate(`document.querySelector("[data-job-facts]")?.innerText || ""`)).includes("120 views"));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
