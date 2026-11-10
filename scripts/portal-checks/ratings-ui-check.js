// node --experimental-websocket ratings-ui-check.js <buildDir>
// Mutual ratings in the portal (FLAG_CAREER_RATINGS) against a mock API:
//   - the candidate drawer: "rate the candidate" after a completed interview; save stays off until all three
//     questions have stars; it sends the three answers and the comment once; then shows "rated"
//   - hiring results: the employer's own average (from 5 ratings) and the ratings anonymised; report one as unfair
//   - admin "ratings reports": hidden until the server answers; hide a rating with a required reason
// With A11Y=1 (a11y-ratings.js) it runs axe-core WCAG 2 A / AA on the same screens instead, exits 1 on any violation.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const A11Y = process.env.A11Y === "1";
const WEB = 5194, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });
const A2 = "6ae9a2a2a2a2a2a2a2a2a2a2", E = "6ae9aaaaaaaaaaaaaaaaaaaa";
const now = Date.now();
const iso = (d) => new Date(now - d * 864e5).toISOString();
let ratingsSetUp = false;
let rated = null;
const posted = [];
const apps = [{ applicationId: A2, jobId: "j1", jobTitle: "Backend dev", candidateName: "Taha Ali", appliedAt: iso(9), careerEnabled: true, stage: "interview", version: 6, interview: { status: "completed" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["OFFER_SENT", "REJECTED"] }];
const timelineA2 = { applicationId: A2, job: { id: "j1", title: "Backend dev", company: "Hire Co", archived: false }, external: false, stage: "interview", legacyStatus: "interview", version: 6, interview: { status: "completed" }, offer: { status: "none" }, hire: { status: "none" }, nextAllowedActions: ["OFFER_SENT", "REJECTED"], events: [{ id: "e1", seq: 1, type: "APPLIED", actorRole: "candidate", occurredAt: iso(9), metadata: {} }, { id: "e5", seq: 5, type: "INTERVIEW_COMPLETED", actorRole: "employer", occurredAt: iso(2), metadata: {} }], interviewDetails: null, offerDetails: null };
const QE = [{ id: "communication", label: "Communication" }, { id: "punctuality", label: "Punctuality" }, { id: "preparation", label: "Preparation" }];
const funnel = { range: {}, counts: { applications: 12, submitted: 10, joinedPilotLater: 2, reviewed: 9, shortlisted: 6, rejected: 3, withdrawn: 1, interviewsInvited: 5, interviewsAccepted: 4, interviewsCompleted: 3, noShowReports: 1, offersSent: 3, offersAccepted: 2, offersDeclined: 1, verifiedHires: 1, disputes: 0 }, conversions: { acceptedToVerifiedHire: 50 }, medianHours: { firstEmployerResponse: 20.5 } };
const received = { count: 5, shown: true, minimum: 5, average: 4, questions: [{ id: "communication", label: "Communication", average: 4 }, { id: "respect", label: "Respect", average: 4.5 }, { id: "clarity", label: "Clarity of the process", average: 3.5 }], ratings: [{ id: "r1", kind: "interview", answers: { communication: 2, respect: 3, clarity: 2 }, comment: "they never called back", month: "2026-10" }, ...[2, 3, 4, 5].map((i) => ({ id: `r${i}`, kind: "interview", answers: { communication: 5, respect: 5, clarity: 4 }, comment: "", month: "2026-11" }))] };
const reports = () => (posted.some((p) => p.url.includes("/decide")) ? [] : [{ id: "rep1", status: "open", reason: "I was on time; the address was wrong", reporterRole: "candidate", createdAt: iso(1), rating: { id: "x1", kind: "interview", raterRole: "employer", rater: { id: E, name: "Hire Co" }, ratee: { id: "s1", name: "Taha Ali" }, job: { title: "Backend dev", company: "Hire Co" }, answers: { communication: 2, punctuality: 1, preparation: 2 }, comment: "came late", status: "visible", createdAt: iso(2) } }]);
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(k);
  let body = "";
  q.on("data", (c) => (body += c));
  q.on("end", () => {
    const send = (st, b) => { s.writeHead(st, h); s.end(JSON.stringify(b)); };
    if (q.method === "POST") posted.push({ url: k, body: JSON.parse(body || "{}") });
    if (k === "GET /api/app/flags/me") return send(200, { careerTimeline: true, careerRatings: true });
    if (k === "GET /api/career/employers/me/applications") return send(200, ok({ enabled: true, jobs: [{ id: "j1", title: "Backend dev", archived: false, external: false }], applications: apps }));
    if (k === `GET /api/career/applications/${A2}/timeline`) return send(200, ok(timelineA2));
    if (k === `GET /api/career/ratings/applications/${A2}`) return send(200, ok({ side: "employer", questions: QE, events: [{ kind: "interview", ref: "iv1", eventAt: iso(2), windowEndsAt: iso(-12), open: !rated, myRating: rated }] }));
    if (k === "POST /api/career/ratings") { const b = JSON.parse(body); rated = { id: "mine", kind: "interview", answers: b.answers, comment: b.comment, createdAt: new Date().toISOString() }; return send(201, ok({ id: "mine", released: false })); }
    if (k === "GET /api/analytics/employers/me") return send(200, ok({ range: {}, hiring: funnel, trial: null }));
    if (k === "GET /api/career/ratings/me/received") return send(200, ok(received));
    if (k === "POST /api/career/ratings/r1/report") return send(201, ok({ id: "rep9", status: "open" }));
    if (k === "GET /api/career/ratings/admin/reports") return ratingsSetUp ? send(200, ok(reports())) : send(404, { success: false, error: { code: "RATINGS_OFF" } });
    if (k === "POST /api/career/ratings/admin/reports/rep1/decide") return send(200, ok({ id: "rep1", status: "hidden" }));
    if (/^GET \/api\/career\/(matching|resume)\//.test(k)) return send(404, { success: false, error: { code: "OFF" } });
    send(200, q.method === "GET" ? [] : { success: true });
  });
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(s);
}).listen(WEB);

(async () => {
  const b = await launch(A11Y ? 9410 : 9409);
  let bad = 0;
  const open = async (who, p) => {
    const pg = await b.page();
    pg.errs = [];
    await pg.s("Log.enable");
    pg.on((m) => {
      if (m.method === "Runtime.exceptionThrown") pg.errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") pg.errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/status of 404/.test(m.params.entry.text)) pg.errs.push("log: " + m.params.entry.text.slice(0, 160));
    });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    await sleep(3500);
    return pg;
  };
  const text = (pg) => pg.evaluate(`document.body.innerText || ""`);
  const expect = (label, t, want, not = []) => {
    const miss = want.filter((w) => !t.toLowerCase().includes(w.toLowerCase()));
    const found = not.filter((w) => t.toLowerCase().includes(w.toLowerCase()));
    if (miss.length || found.length) bad = 1;
    console.log(`${label}: ${miss.length ? "MISSING " + miss.join(" | ") : "all expected text present"}${found.length ? "; SHOULD NOT SHOW " + found.join(" | ") : ""}`);
  };
  const check = (label, cond) => { if (!cond) bad = 1; console.log(`${label}: ${cond ? "yes" : "NO"}`); };
  const clickIn = (pg, scope, re) => pg.evaluate(`[...document.querySelectorAll(${JSON.stringify(scope)} + " button")].find((x) => ${re}.test(x.innerText.trim()))?.click(); true`);
  const star = (pg, group, n) => pg.evaluate(`[...document.querySelectorAll('[role=group][aria-label^="${group}"] button')].find((x) => x.innerText.trim() === "${n}")?.click(); true`);
  const typeIn = (pg, sel, val) => pg.evaluate(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(i, ${JSON.stringify(val)}); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  const disabled = (pg, scope, label) => pg.evaluate(`[...document.querySelectorAll(${JSON.stringify(scope)} + " button")].find((x) => x.innerText.trim() === ${JSON.stringify(label)})?.disabled === true`);
  let total = 0;
  const AXE = A11Y ? fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8") : "";
  const audit = async (pg, label, scope = "main") => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    total += v.length;
    console.log(`${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };
  const emp = { _id: E, id: E, role: "employee", name: "Hire Co", companyName: "Hire Co" };
  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };

  // the candidate drawer
  const pg = await open(emp, "/candidate");
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => /Taha Ali/.test(x.innerText))?.click(); true`);
  await sleep(1800);
  const card = '[data-card="rate-candidate"]';
  if (A11Y) await audit(pg, "candidate drawer: rate the candidate", "[role=dialog]");
  else {
    expect("rate the candidate", await text(pg), ["rate the candidate", "never shown to other employers", "Communication", "Punctuality", "Preparation", "comment (optional, 300 characters left)", "save rating"]);
    check("save is off until every question has stars", await disabled(pg, card, "save rating"));
    await star(pg, "Communication", 4); await star(pg, "Punctuality", 5);
    check("…still off with two of three", await disabled(pg, card, "save rating"));
    await star(pg, "Preparation", 3);
    await typeIn(pg, "#rate-comment", "prepared and polite");
    await sleep(200);
    check("…on with all three", !(await disabled(pg, card, "save rating")));
    await clickIn(pg, card, /^save rating$/);
    await sleep(1500);
    const p = posted.find((x) => x.url === "POST /api/career/ratings")?.body || {};
    check("saving sends the application, the interview, the three answers and the comment", p.applicationId === A2 && p.kind === "interview" && p.ref === "iv1" && JSON.stringify(p.answers) === JSON.stringify({ communication: 4, punctuality: 5, preparation: 3 }) && p.comment === "prepared and polite");
    expect("after saving", await text(pg), ["rated", "communication 4 / 5", "prepared and polite"], ["save rating"]);
  }
  if (pg.errs.length) { bad = 1; pg.errs.forEach((e) => console.log("    " + e)); }

  // hiring results: the employer's own rating
  const hr = await open(emp, "/hiring-results");
  if (A11Y) await audit(hr, "hiring results: your rating from candidates");
  else {
    expect("your rating from candidates", await text(hr), ["your rating from candidates", "4 / 5", "from 5 ratings", "rounded to half a star", "respect 4.5", "they never called back", "report"], ["Taha"]);
    await hr.evaluate(`document.querySelector('[aria-label="report the rating from 2026-10 as unfair"]')?.click(); true`);
    await sleep(600);
    check("report needs a reason (5+ characters)", await disabled(hr, "[role=dialog]", "report"));
    await typeIn(hr, "#report-reason", "the interview was cancelled by them");
    await sleep(200);
    await clickIn(hr, "[role=dialog]", /^report$/);
    await sleep(1000);
    check("reporting sends the reason for that rating", posted.some((x) => x.url === "POST /api/career/ratings/r1/report" && x.body.reason === "the interview was cancelled by them"));
  }
  if (hr.errs.length) { bad = 1; hr.errs.forEach((e) => console.log("    " + e)); }

  // admin: ratings reports
  const menu = (p) => p.evaluate(`[...document.querySelectorAll("aside a, aside button")].map((a) => a.innerText.trim().toLowerCase()).join("|")`);
  if (!A11Y) {
    const off = await open(admin, "/admin");
    check("ratings not set up (404): no 'ratings reports' in the admin menu", !/ratings reports/.test(await menu(off)));
    await off.close();
  }
  ratingsSetUp = true;
  const adm = await open(admin, "/admin");
  if (!A11Y) check("set up: 'ratings reports' in the admin menu", /ratings reports/.test(await menu(adm)));
  await adm.evaluate(`[...document.querySelectorAll("aside a, aside button")].find((x) => /^ratings reports$/i.test(x.innerText.trim()))?.click(); true`);
  await sleep(2000);
  if (A11Y) {
    await audit(adm, "admin ratings reports");
    await adm.evaluate(`document.querySelector('[aria-label="hide the rating by Hire Co"]')?.click(); true`);
    await sleep(600);
    await audit(adm, "admin ratings reports: hide dialog", "[role=dialog]");
  } else {
    expect("admin ratings reports", await text(adm), ["ratings reports", "Hire Co", "rated", "Taha Ali", "Backend dev", "came late", "I was on time; the address was wrong", "open", "hide", "keep"]);
    await adm.evaluate(`document.querySelector('[aria-label="hide the rating by Hire Co"]')?.click(); true`);
    await sleep(600);
    check("hide needs a reason", await disabled(adm, "[role=dialog]", "hide"));
    await typeIn(adm, "#decide-reason", "the address in the invite was wrong");
    await sleep(200);
    await clickIn(adm, "[role=dialog]", /^hide$/);
    await sleep(1500);
    check("hiding sends action hide and the reason; the report leaves the open list", posted.some((x) => x.url === "POST /api/career/ratings/admin/reports/rep1/decide" && x.body.action === "hide" && x.body.reason === "the address in the invite was wrong") && /no reports here/i.test(await text(adm)));
  }
  if (adm.errs.length) { bad = 1; adm.errs.forEach((e) => console.log("    " + e)); }
  if (A11Y) console.log(`\nA11Y_TOTAL=${total}`);
  else console.log("API calls: " + [...new Set(calls)].filter((c) => /ratings/.test(c)).join(", "));
  b.close();
  process.exit(A11Y ? (total || bad ? 1 : 0) : bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
