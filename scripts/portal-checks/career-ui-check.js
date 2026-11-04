// node --experimental-websocket career-ui-check.js <buildDir>
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
const E = "6ae9aaaaaaaaaaaaaaaaaaaa", A1 = "6ae9a1a1a1a1a1a1a1a1a1a1", A2 = "6ae9a2a2a2a2a2a2a2a2a2a2", IV = "6ae9c1c1c1c1c1c1c1c1c1c1";
const now = Date.now();
const apps = [
  { applicationId: A1, jobId: "j1", jobTitle: "Backend dev", candidateName: "Sana Khan", appliedAt: new Date(now - 5 * 864e5).toISOString(), careerEnabled: true, stage: "interview", version: 4, interview: { id: IV, status: "accepted", startsAt: new Date(now + 2 * 864e5).toISOString() }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["REJECTED", "INTERVIEW_RESCHEDULED", "INTERVIEW_CANCELLED"] },
  { applicationId: A2, jobId: "j1", jobTitle: "Backend dev", candidateName: "Taha Ali", appliedAt: new Date(now - 2 * 864e5).toISOString(), careerEnabled: true, stage: "applied", version: 1, interview: { status: "none" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["REVIEWED", "SHORTLISTED", "REJECTED"] },
  { applicationId: "6ae9a3a3a3a3a3a3a3a3a3a3", jobId: "j1", jobTitle: "Backend dev", candidateName: "Umar Old", appliedAt: new Date(now - 9 * 864e5).toISOString(), careerEnabled: false, stage: "reviewed", version: 0, interview: { status: "none" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: [] },
];
const timelineA2 = { applicationId: A2, job: { id: "j1", title: "Backend dev", company: "Hire Co", archived: false }, external: false, externalLabel: null, stage: "applied", legacyStatus: "pending", version: 1, interview: { status: "none" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["REVIEWED", "SHORTLISTED", "INTERVIEW_INVITED", "REJECTED"], events: [{ id: "e1", seq: 1, type: "APPLIED", actorRole: "system", source: "app", occurredAt: new Date(now - 2 * 864e5).toISOString(), metadata: {} }], interviewDetails: null, offerDetails: null };
const routes = {
  "GET /api/app/flags/me": { metaEvents: false, loyaltyV2: false, careerTimeline: true },
  "GET /api/career/employers/me/applications": ok({ enabled: true, jobs: [{ id: "j1", title: "Backend dev", archived: false, external: false }], applications: apps }),
  [`GET /api/career/applications/${A2}/timeline`]: ok(timelineA2),
  "GET /api/career/admin/analytics": ok({ range: {}, counts: { applications: 12, submitted: 10, joinedPilotLater: 2, reviewed: 9, shortlisted: 6, rejected: 3, withdrawn: 1, interviewsInvited: 5, interviewsAccepted: 4, interviewsCompleted: 3, noShowReports: 1, offersSent: 3, offersAccepted: 2, offersDeclined: 1, verifiedHires: 1, disputes: 2 }, conversions: { submittedToReviewed: 75, reviewedToShortlisted: 66.7, shortlistedToCompletedInterview: 50, completedInterviewToOffer: 100, offerToAccepted: 66.7, acceptedToVerifiedHire: 50 }, medianHours: { firstEmployerResponse: 20.5, toFirstInterviewInvite: 70, toVerifiedHire: 300 } }),
};
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(k);
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
  const b = await launch(9343);
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
  const emp = { _id: E, id: E, role: "employee", name: "Hire Co", companyName: "Hire Co" };
  const pg = await open(emp, "/candidate");
  expect("employer pipeline", await text(pg), ["candidates", "Applied", "Reviewed", "Shortlisted", "Interview", "Offer", "Hired", "Rejected", "Sana Khan", "Taha Ali", "classic flow", "classic list"]);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => /Taha Ali/.test(x.innerText))?.click(); true`);
  await sleep(1500);
  expect("candidate drawer", await text(pg), ["timeline and audit", "applied", "by system", "mark reviewed", "shortlist", "schedule interview", "reject"]);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "schedule interview")?.click(); true`);
  await sleep(800);
  expect("schedule dialog", await text(pg), ["schedule an interview", "Asia/Karachi", "date and time (Karachi)", "meeting link", "send invite"]);
  if (pg.errs.length) bad = 1;
  pg.errs.forEach((e) => console.log("    " + e));
  if (!pg.errs.length) console.log("    employer pages: no page errors, no console errors");
  const adm = await open({ _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" }, "/admin");
  await adm.evaluate(`[...document.querySelectorAll("button, a")].find((e) => /hiring funnel/i.test(e.innerText))?.click(); true`);
  await sleep(2500);
  expect("admin hiring funnel", await text(adm), ["hiring funnel", "submitted", "verified hires", "interviews completed", "offers sent / accepted", "median first employer response", "20.5 h", "disputes"]);
  if (adm.errs.length) bad = 1;
  adm.errs.forEach((e) => console.log("    " + e));
  if (!adm.errs.length) console.log("    admin page: no page errors, no console errors");
  console.log("API calls: " + [...new Set(calls)].filter((c) => /career|flags/.test(c)).join(", "));
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
