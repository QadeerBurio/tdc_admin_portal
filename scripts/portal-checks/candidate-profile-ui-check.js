// node --experimental-websocket candidate-profile-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// The employer's candidate profile (/candidate/:applicationId, FLAG_CAREER_TIMELINE) against a mock API:
// - the candidate's applications to this employer's jobs, grouped by the candidate's id (another person with the
//   same name is not merged in); stats (applications, furthest stage, interviews, offers, hires, days to first
//   response), stage history, interview outcomes, the tailored resume sent, match evidence;
// - no ratings: no ratings request, no rating text; unsafe links (javascript:) are not rendered;
// - the pipeline drawer's "full profile" opens it; an application that isn't the employer's: "candidate not found";
// - flag off: a pilot notice and no candidate requests. axe-core WCAG 2 A / AA on the profile. Exits 1 on failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const E = "6ae9eeeeeeeeeeeeeeeeeeee", U1 = "6ae9u1u1u1u1u1u1u1u1u1u1".replace(/u/g, "1"), U2 = "6ae9222222222222222222ff";
const A1 = "6ae9a1a1a1a1a1a1a1a1a1a1", A2 = "6ae9a2a2a2a2a2a2a2a2a2a2", A3 = "6ae9a3a3a3a3a3a3a3a3a3a3";
const t0 = Date.parse("2026-10-01T06:00:00Z"), D = 864e5;
const at = (days) => new Date(t0 + days * D).toISOString();
const job1 = { _id: "j1", title: "Backend dev" }, job2 = { _id: "j2", title: "Frontend dev" };
const legacy = {
  [A1]: { _id: A1, userId: U1, jobId: job1, fullName: "Zara Ahmed", email: "zara@example.com", phone: "0300 1234567", city: "Karachi", country: "Pakistan", currentPosition: "Intern", currentCompany: "Acme", yearsOfExperience: 1, noticePeriod: "2 weeks", coverLetter: "I build APIs.", portfolioUrl: "https://zara.example.com", linkedInUrl: "javascript:alert(1)", appliedAt: at(10), status: "shortlisted" },
  [A2]: { _id: A2, userId: U1, jobId: job2, fullName: "Zara Ahmed", email: "zara@example.com", phone: "0300 1234567", coverLetter: "older", appliedAt: at(0), status: "rejected" },
  [A3]: { _id: A3, userId: U2, jobId: job1, fullName: "Zara Ahmed", email: "other.zara@example.com", phone: "0311 0000000", coverLetter: "different person", appliedAt: at(12), status: "pending" },
};
const ev = (seq, type, day, metadata = {}) => ({ id: `e${seq}${type}`, seq, type, actorRole: "employer", source: "portal", occurredAt: at(day), metadata });
const tl = (applicationId, jobTitle, stage, events) => ({ applicationId, job: { id: "j", title: jobTitle, archived: false }, external: false, stage, legacyStatus: "pending", version: events.length, nextAllowedActions: ["REJECTED"], events, interviewDetails: null, offerDetails: null });
const timelines = {
  [A1]: tl(A1, "Backend dev", "interview", [ev(1, "APPLIED", 10), ev(2, "REVIEWED", 11), ev(3, "SHORTLISTED", 12), ev(4, "INTERVIEW_INVITED", 13), ev(5, "INTERVIEW_COMPLETED", 15, { note: "great chat" })]),
  [A2]: tl(A2, "Frontend dev", "rejected", [ev(1, "APPLIED", 0), ev(2, "REJECTED", 3)]),
};
const row = (id, title, stage, careerEnabled = true) => ({ applicationId: id, jobId: "j", jobTitle: title, candidateName: "Zara Ahmed", appliedAt: legacy[id].appliedAt, careerEnabled, stage, version: 1, interview: { status: "none" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: careerEnabled ? ["REJECTED"] : [] });
let flags = { careerTimeline: true, careerMatching: true };
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(k);
  let status = 200, out;
  const one = /^GET \/api\/jobs\/candidates\/(\w+)$/.exec(k);
  const tlm = /^GET \/api\/career\/applications\/(\w+)\/timeline$/.exec(k);
  if (k === "GET /api/app/flags/me") out = flags;
  else if (k === "GET /api/jobs/candidates/all") out = Object.values(legacy);
  else if (one) { if (legacy[one[1]]) out = legacy[one[1]]; else { status = 403; out = { message: "Access denied" }; } }
  else if (k === "GET /api/career/employers/me/applications") out = ok({ enabled: true, jobs: [{ id: "j1", title: "Backend dev" }, { id: "j2", title: "Frontend dev" }], applications: [row(A3, "Backend dev", "applied"), row(A1, "Backend dev", "interview"), row(A2, "Frontend dev", "rejected")] });
  else if (tlm) { if (timelines[tlm[1]]) out = ok(timelines[tlm[1]]); else { status = 404; out = { success: false, error: { code: "NOT_FOUND" } }; } }
  else if (k === `GET /api/career/resume/applications/${A1}/resume`) out = ok({ label: "tailored for Backend dev", attachedAt: at(10), contentHash: "abc123abc123abc" });
  else if (k === `GET /api/career/matching/applications/${A1}`) out = ok({ applicationId: A1, modelVersion: "skill-evidence-1", computedAt: at(10), note: "Decision support only.", relevance: { score: 50, label: "estimate: evidence for 1 of 2 listed skills", formula: "f" }, mandatory: [], mandatorySummary: { met: 0, notMet: 0, unknown: 0 }, skills: { matched: [{ skill: "Node.js", evidence: [{ path: "skills[0]", text: "Node.js" }] }], missing: [], unknown: [] }, evidenceSummary: "1 matched", best: { score: 50, quality: "medium", qualityLabel: "medium", insufficient: null, summary: "Matches 1 of 2 skills, missing SQL", strengths: [{ skill: "Node.js", evidence: "Node.js" }], gaps: { missingSkills: ["SQL"], unknownSkills: [], requirements: [] }, skillStatus: { "Node.js": "matched", SQL: "missing" }, mandatorySummary: { met: 0, notMet: 0, unknown: 0 } } });
  else { status = q.method === "GET" && k.includes("/career/") ? 404 : 200; out = status === 404 ? { success: false, error: { code: "NOT_FOUND" } } : q.method === "GET" ? [] : { success: true }; }
  s.writeHead(status, h);
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
  const b = await launch(9354);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const employer = { _id: E, id: E, role: "employee", name: "Hire Co", companyName: "Hire Co" };
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(employer)})); true`);
  const main = () => pg.evaluate(`(document.querySelector("[data-screen=candidate-profile]") || document.getElementById("root"))?.innerText || ""`);

  await go(pg, `http://127.0.0.1:${WEB}/candidate/${A1}`);
  await sleep(4000);
  let t = await main();
  const stat = (label) => pg.evaluate(`(() => { const el = [...document.querySelectorAll("[data-screen=candidate-profile] .k-stat")].find((x) => x.innerText.toLowerCase().includes(${JSON.stringify(label)})); return el ? el.innerText : null; })()`);
  check("profile: name, position, contact", ["Zara Ahmed", "Intern at Acme", "Karachi, Pakistan", "zara@example.com", "0300 1234567", "2 weeks"].every((w) => t.includes(w)));
  check("this candidate's two applications only (same-name person not merged)", t.includes("Backend dev") && t.includes("Frontend dev") && !t.includes("other.zara@example.com") && (await pg.evaluate(`document.querySelectorAll("[data-application]").length`)) === 2);
  const s1 = await stat("applications to your jobs");
  check("stat: 2 applications to your jobs", !!s1 && /\b2\b/.test(s1) && !s1.includes("furthest"), s1);
  const s2 = await stat("furthest stage");
  check("stat: furthest stage interview", !!s2 && s2.includes("interview"), s2);
  const s3 = await stat("interviews completed");
  check("stat: 1 interview completed of 1 invited", !!s3 && /\b1\b/.test(s3) && s3.includes("1 invited"), s3);
  const s4 = await stat("first response");
  check("stat: median 2 days to first response (1 and 3)", !!s4 && /\b2\b/.test(s4), s4);
  check("stage history and interview outcome with the note", t.includes("stage history") && t.includes("shortlisted") && t.includes("interview completed") && t.includes("great chat"));
  check("tailored resume sent and match evidence", t.includes("resume sent: tailored for Backend dev") && t.includes("match evidence") && t.includes("Node.js"));
  check("best-match summary on the profile (50%, medium, the line, gaps, check before deciding)", t.includes("50%") && t.includes("Matches 1 of 2 skills, missing SQL") && t.includes("gaps: missing SQL") && t.includes("check before deciding"));
  check("cover letter available", t.includes("cover letter (latest application)"));
  const hrefs = await pg.evaluate(`[...document.querySelectorAll("[data-screen=candidate-profile] a")].map((a) => a.getAttribute("href"))`);
  check("safe links only (portfolio yes, javascript: LinkedIn no)", hrefs.includes("https://zara.example.com") && !hrefs.some((h) => /^javascript:/i.test(h || "")) && !t.includes("LinkedIn"), JSON.stringify(hrefs));
  check("no ratings: no request, no rating text", !calls.some((c) => c.includes("/ratings")) && !/rating/i.test(t));
  await pg.evaluate(AXE + "; true");
  const v = await pg.evaluate(`(async () => { const r = await axe.run(document.querySelector("main") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
  check("axe WCAG 2 A/AA: candidate profile", v.length === 0, v.length ? JSON.stringify(v) : "no violations");

  // from the pipeline drawer
  await go(pg, `http://127.0.0.1:${WEB}/candidate`);
  await sleep(3500);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((e) => (e.getAttribute("aria-label") || "").startsWith("Zara Ahmed, Backend dev, Interview"))?.click(); true`);
  await sleep(1500);
  check("drawer has 'full profile'", await pg.evaluate(`(() => { const e = [...document.querySelectorAll("[role=dialog] button")].find((x) => x.innerText.trim() === "full profile"); if (e) e.click(); return !!e; })()`));
  await sleep(2500);
  check("it opens /candidate/<application>", (await pg.evaluate(`location.pathname`)) === `/candidate/${A1}` && (await main()).includes("applications to your jobs"));

  // not this employer's application
  await go(pg, `http://127.0.0.1:${WEB}/candidate/6ae9ffffffffffffffffffff`);
  await sleep(3000);
  check("someone else's application: candidate not found", (await main()).includes("candidate not found"));

  // outside the pilot
  flags = {};
  calls.length = 0;
  await go(pg, `http://127.0.0.1:${WEB}/candidate/${A1}`);
  await sleep(3000);
  // (the employer shell loads its own dashboard numbers; the profile itself asks for nothing)
  check("flag off: pilot notice, no profile requests", (await main()).includes("part of the hiring timeline pilot") && !calls.some((c) => c.includes(`/jobs/candidates/${A1}`) || c.includes("/career/applications") || c.includes("/career/employers/me/applications") || c.includes("/career/matching")), calls.join(", "));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
