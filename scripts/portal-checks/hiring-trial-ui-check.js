// node --experimental-websocket hiring-trial-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Free trial and hiring plans (HiringAccess.js, AdminHiringPlans.js), against a mock API:
// - employer dashboard on the trial: "free trial", days left, free hire not used, "post a job" enabled;
// - after the free hire: "your free hire is used", "posting locked"; "post a job", "Upload Jobs CSV" and "duplicate"
//   disabled; "request a plan" sends { jobs, note } and the banner says the request was sent;
//   the 60-day end: "your free trial has ended";
// - on a plan: "hiring plan", job posts left and valid until; posting enabled; duplicate sends POST /duplicate/:id;
// - admin > employers > hiring plans: counts (incl. kept open by the fresh start), the open request, employers;
//   grant (prefilled with the jobs asked for; no reason = nothing sent), extend the trial with a date;
// - axe-core WCAG 2 A / AA on the banners, the request dialog, the admin page and its dialog; no console errors.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5189, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });
const E = "6aea11111111111111111111", ADMIN = "6aeaffffffffffffffffffff", J1 = "6aeab1b1b1b1b1b1b1b1b1b1";
const now = Date.now();
const DAY = 864e5;
let mode = "trial"; // trial | hire_used | days_over | plan
let request = null;
const trial = (over) => ({ status: "active", label: "free trial", detail: null, endReason: null, endedAt: null, startedAt: new Date(now - 15 * DAY).toISOString(), endsAt: new Date(now + 45 * DAY).toISOString(), daysLeft: 45, clockStarted: true, days: 60, extendedUntil: null, freeHireUsed: false, freeHireUsedAt: null, ...over });
const policy = { text: "Every new employer starts with a free trial ...", trialDays: 60 };
function access() {
  if (mode === "trial") return { canPost: true, enforced: true, trial: trial(), plan: null, lock: null, request, policy };
  if (mode === "hire_used") return { canPost: false, enforced: true, trial: trial({ status: "ended", label: "your free hire is used", detail: "your company's first verified hire through tdc was free; that ends the trial", endReason: "free_hire_used", endedAt: new Date(now - DAY).toISOString(), daysLeft: null, freeHireUsed: true }), plan: null, lock: { code: "POSTING_LOCKED", message: "Your free hire is used, so your free trial has ended. Your open jobs stay open until their deadline; request a plan to post more jobs." }, request, policy };
  if (mode === "days_over") return { canPost: false, enforced: true, trial: trial({ status: "ended", label: "your free trial has ended", detail: "60 days have passed since your first job", endReason: "days_over", daysLeft: null }), plan: null, lock: { code: "POSTING_LOCKED", message: "Your free trial has ended." }, request, policy };
  return { canPost: true, enforced: true, trial: trial({ status: "ended", label: "your free hire is used", endReason: "free_hire_used", daysLeft: null, freeHireUsed: true }), plan: { status: "active", jobsGranted: 3, jobsUsed: 1, jobsLeft: 2, validUntil: new Date(now + 30 * DAY).toISOString(), grantedAt: new Date(now).toISOString() }, lock: null, request: null, policy };
}
const job = { _id: J1, title: "Backend intern", department: "Engineering", type: "Internship", location: "Karachi", salary: "PKR 40,000", email: "hr@brightlabs.test", description: "Build APIs", skills: ["Node.js"], active: true, applicationDeadline: new Date(now + 10 * DAY).toISOString(), createdAt: new Date(now - 15 * DAY).toISOString(), totalApplications: 4 };
const row = (id, companyName, a, jobs) => ({ employer: { id, name: "Owner", companyName }, ...a, jobs, history: [] });
const overview = () => ({
  policyStart: new Date(now - 2 * DAY).toISOString(), trialDays: 60, enforced: true,
  counts: { employers: 3, onTrial: 1, trialEnded: 2, onPlan: 1, locked: 1, openRequests: 1, wouldBeLockedWithoutFreshStart: 3 },
  employers: [
    row(E, "Bright Labs", (mode = "hire_used", access()), { posted: 2, open: 1, firstAt: null }),
    row("6aea22222222222222222222", "Nova Systems", (mode = "trial", access()), { posted: 1, open: 1, firstAt: null }),
    row("6aea33333333333333333333", "Plan Co", (mode = "plan", access()), { posted: 4, open: 3, firstAt: null }),
  ],
  requests: [{ id: "r1", employer: { id: E, name: "Bright Labs" }, jobs: 3, note: "hiring for Q1", status: "open", sentAt: new Date(now - DAY).toISOString(), resolvedAt: null, resolution: "" }],
});

const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  let raw = "";
  q.on("data", (c) => (raw += c));
  q.on("end", () => {
    let body = null;
    try { body = JSON.parse(raw || "null"); } catch {}
    calls.push({ k, body });
    const send = (status, b) => { s.writeHead(status, h); s.end(JSON.stringify(b)); };
    if (k === "GET /api/app/flags/me") return send(200, {});
    if (k === "GET /api/auth/me") return send(200, { _id: E, name: "Hina", role: "employee", companyName: "Bright Labs" });
    if (k === "GET /api/jobs/stats") return send(200, { totalJobs: 2, activeJobs: 1, totalApplications: 4, pendingApplications: 1, shortlistedApplications: 1, hiredApplications: 1, totalInterviews: 1, upcomingInterviews: 0 });
    if (k === "GET /api/jobs/my-jobs") return send(200, [job]);
    if (k === "GET /api/career/employers/me/hiring-access") return send(200, ok(access()));
    if (k === "POST /api/career/employers/me/plan-requests") { request = { id: "r1", jobs: body.jobs, note: body.note, status: "open", sentAt: new Date().toISOString() }; return send(201, ok(access())); }
    if (k === `POST /api/jobs/duplicate/${J1}`) return send(201, { message: "Job duplicated", data: { ...job, _id: "6aeab2b2b2b2b2b2b2b2b2b2" } });
    if (k === "POST /api/jobs/add" && !access().canPost) return send(403, { error: access().lock.message, code: "POSTING_LOCKED" });
    if (k === "GET /api/career/admin/hiring-plans") { const keep = mode; const o = overview(); mode = keep; return send(200, ok(o)); }
    if (/^POST \/api\/career\/admin\/hiring-plans\/[0-9a-f]+\/(grant|trial)$/.test(k)) return send(200, ok(access()));
    return send(200, q.method === "GET" ? [] : { success: true });
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
  const b = await launch(9461);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`  ${cond ? "ok  " : "FAIL"} ${label}${!cond && detail ? `  → ${String(detail).slice(0, 400)}` : ""}`); };
  const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  const pages = [];
  const open = async (who, p) => {
    const pg = await b.page();
    pg.errs = [];
    pages.push(pg);
    pg.on((m) => {
      if (m.method === "Runtime.exceptionThrown") pg.errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") pg.errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
    });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    await sleep(3000);
    return pg;
  };
  const audit = async (pg, label, scope) => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => v.id + " " + v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" ; ")); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.join(" | "));
  };
  const banner = (pg) => pg.evaluate(`document.querySelector('[data-card="hiring-access"]')?.innerText || ""`);
  const btn = (pg, re, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button")].find((x) => ${re}.test((x.getAttribute("aria-label") || x.innerText).trim())); return e ? { found: true, disabled: e.disabled, title: e.title } : { found: false }; })()`);
  const click = (pg, re, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button")].find((x) => ${re}.test((x.getAttribute("aria-label") || x.innerText).trim()) && !x.disabled); if (e) e.click(); return !!e; })()`);
  const setVal = (pg, sel, v, proto = "HTMLInputElement") => pg.evaluate(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(${proto}.prototype, "value").set.call(i, ${JSON.stringify(v)}); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const emp = { _id: E, id: E, role: "employee", name: "Hina", companyName: "Bright Labs" };

  console.log("── employer on the free trial");
  mode = "trial";
  let pg = await open(emp, "/employee-dashboard");
  let t = await banner(pg);
  check("dashboard banner: free trial, 45 days left, free hire not used, posting open", /free trial/.test(t) && /45 days left · free hire not used yet/.test(t) && /posting open/.test(t), t);
  check("'post a job' enabled on the trial", (await btn(pg, /^post a job$/i)).disabled === false);
  await audit(pg, "trial banner on the dashboard", '[data-card="hiring-access"]');

  console.log("── after the free hire: locked");
  mode = "hire_used";
  pg = await open(emp, "/employee-dashboard");
  t = await banner(pg);
  check("dashboard banner: 'your free hire is used', posting locked, what still works, 'request a plan'", /your free hire is used/.test(t) && /posting locked/.test(t) && /open jobs stay open until their deadline/.test(t) && /request a plan/.test(t), t);
  check("dashboard 'post a job' is disabled", (await btn(pg, /^post a job$/i)).disabled === true);
  await audit(pg, "locked banner on the dashboard", '[data-card="hiring-access"]');
  pg = await open(emp, "/employee-jobs");
  const post = await btn(pg, /^post a job$/i), csv = await btn(pg, /^(Upload Jobs CSV|CSV)$/), dup = await btn(pg, /^duplicate Backend intern$/);
  check("jobs page: 'post a job', 'Upload Jobs CSV' and 'duplicate' disabled with the reason", post.disabled && csv.disabled && dup.found && dup.disabled && /request a plan/i.test(post.title), JSON.stringify({ post, csv, dup }));
  check("jobs page: the banner is there too", /your free hire is used/.test(await banner(pg)));
  check("request a plan opens the dialog", await click(pg, /^request a plan$/i));
  await sleep(500);
  await audit(pg, "request a plan dialog", "[role=dialog]");
  await setVal(pg, "#plan-jobs", "0");
  await sleep(200);
  check("0 jobs: 'send request' disabled", (await btn(pg, /^send request$/i, `document.querySelector("[role=dialog]")`)).disabled === true);
  await setVal(pg, "#plan-jobs", "3");
  await setVal(pg, "#plan-note", "hiring for Q1", "HTMLTextAreaElement");
  await sleep(200);
  await click(pg, /^send request$/i, `document.querySelector("[role=dialog]")`);
  await sleep(1500);
  const sent = calls.filter((c) => c.k === "POST /api/career/employers/me/plan-requests");
  check("the request is sent once with { jobs: 3, note }", sent.length === 1 && sent[0].body.jobs === 3 && sent[0].body.note === "hiring for Q1", JSON.stringify(sent));
  t = await banner(pg);
  check("the banner says the request was sent and offers 'change request'", /your request for 3 jobs was sent/.test(t) && /change request/.test(t), t);
  await audit(pg, "banner with a sent request", '[data-card="hiring-access"]');

  console.log("── the 60-day end");
  mode = "days_over"; request = null;
  pg = await open(emp, "/employee-dashboard");
  t = await banner(pg);
  check("banner: 'your free trial has ended' (60 days since the first job)", /your free trial has ended/.test(t) && /60 days have passed since your first job/.test(t), t);

  console.log("── on a plan");
  mode = "plan";
  pg = await open(emp, "/employee-jobs");
  t = await banner(pg);
  check("banner: hiring plan, 2 job posts left, valid until a date; posting enabled", /hiring plan/.test(t) && /2 job posts left · valid until/.test(t) && (await btn(pg, /^post a job$/i)).disabled === false, t);
  await audit(pg, "plan banner", '[data-card="hiring-access"]');
  await click(pg, /^duplicate Backend intern$/);
  await sleep(1200);
  check("duplicate sends POST /api/jobs/duplicate/:id", calls.some((c) => c.k === `POST /api/jobs/duplicate/${J1}`));

  console.log("── admin: hiring plans");
  pg = await open({ _id: ADMIN, id: ADMIN, role: "admin", name: "admin" }, "/admin");
  check("the menu has 'hiring plans' under employers", await pg.evaluate(`(() => { const e = document.querySelector('.tdcp-nav [data-page="hiring_plans"]'); if (e) e.click(); return !!e; })()`));
  await sleep(2500);
  t = await pg.evaluate(`document.querySelector('[data-screen="hiring-plans"]')?.innerText || ""`);
  check("the page: counts incl. 'kept open by the fresh start' (3), the open request, the employers", /kept open by the fresh start/i.test(t) && /hiring for Q1/.test(t) && /Bright Labs/.test(t) && /Nova Systems/.test(t) && /Plan Co/.test(t) && /posting locked/.test(t), t.split("\n").join(" | ").slice(0, 500));
  await audit(pg, "admin hiring plans page", '[data-screen="hiring-plans"]');
  await click(pg, /^grant a plan to Bright Labs$/);
  await sleep(600);
  check("grant from the request: the dialog is prefilled with 3 job posts", (await pg.evaluate(`document.querySelector("#hp-jobs")?.value`)) === "3");
  await audit(pg, "grant dialog", "[role=dialog]");
  const before = calls.filter((c) => /\/grant$/.test(c.k)).length;
  await click(pg, /^grant plan$/i, `document.querySelector("[role=dialog]")`);
  await sleep(600);
  check("no reason: nothing is sent", calls.filter((c) => /\/grant$/.test(c.k)).length === before);
  await setVal(pg, "#hp-reason", "agreed on a call", "HTMLTextAreaElement");
  await click(pg, /^grant plan$/i, `document.querySelector("[role=dialog]")`);
  await sleep(1200);
  const g = calls.filter((c) => /\/grant$/.test(c.k)).slice(-1)[0];
  check("grant sends { jobs: 3, validUntil: null, reason, requestId }", g && g.k.includes(E) && g.body.jobs === 3 && g.body.validUntil === null && g.body.reason === "agreed on a call" && g.body.requestId === "r1", JSON.stringify(g));
  await click(pg, /^extend Nova Systems's trial$/);
  await sleep(600);
  const day = new Date(now + 20 * DAY).toISOString().slice(0, 10);
  await setVal(pg, "#hp-until", day);
  await setVal(pg, "#hp-reason", "slow season", "HTMLTextAreaElement");
  await click(pg, /^extend trial$/i, `document.querySelector("[role=dialog]")`);
  await sleep(1200);
  const x = calls.filter((c) => /\/trial$/.test(c.k)).slice(-1)[0];
  check("extend sends { action: extend, until (end of that day, Pakistan), reason }", x && x.body.action === "extend" && x.body.until === new Date(`${day}T23:59:59+05:00`).toISOString() && x.body.reason === "slow season", JSON.stringify(x));

  const errs = pages.flatMap((p) => p.errs);
  check("no page errors, no console errors", errs.length === 0, errs.join(" | "));
  console.log(bad ? "\nFAIL" : "\nall ok");
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
