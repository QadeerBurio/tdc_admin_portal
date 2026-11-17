// node --experimental-websocket hiring-followups-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Hiring follow-ups, against a mock API:
// - employer jobs page, company not verified: "your job goes live once your company is verified" with a link; job
//   statuses "pending verification" / "closed · reopen" / "live"; the filter has pending and closed; reopening sends
//   the toggle and says "live for 30 more days";
// - a new job starts with the company name and logo from the employer's profile and currency PKR; the server's
//   "goes live once your company is verified" is shown;
// - /company-verification: the jobs waiting, the form sends the details;
// - employer dashboard: upcoming interviews from both lists in the server's order (a timeline one in person shows
//   its place), "jobs posted" says how many are closed;
// - admin company verifications: the jobs waiting next to each company; approving says how many went live;
// - axe-core WCAG 2 A / AA on each; no console errors.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5191, API = Number(process.env.CHECK_API_PORT) || 5197; // run.js gives each check its own ports when they run side by side
const ok = (data) => ({ success: true, data, requestId: "mock" });
const E = "6aeb11111111111111111111", ADMIN = "6aebffffffffffffffffffff";
const J = (n) => `6aebb${n}b${n}b${n}b${n}b${n}b${n}b${n}b${n}b${n}b${n}b${n}`.slice(0, 24);
const now = Date.now();
const DAY = 864e5;
const job = (n, title, status, extra = {}) => ({ _id: J(n), title, department: "Engineering", type: "Internship", location: "Karachi", salary: "PKR 40,000", email: "hr@brightlabs.test", description: "x", skills: [], active: status === "live", status, applicationDeadline: new Date(now + (status === "closed" ? -2 : 10) * DAY).toISOString(), createdAt: new Date(now - 15 * DAY).toISOString(), totalApplications: 2, ...extra });
const jobs = [job(1, "Waiting designer", "pending_verification", { pendingVerification: true }), job(2, "Old analyst", "closed", { closedAt: new Date(now - DAY).toISOString() }), job(3, "Backend intern", "live")];
const access = { canPost: true, enforced: true, trial: { status: "active", label: "free trial", daysLeft: 40, clockStarted: true, days: 60, freeHireUsed: false }, plan: null, lock: null, request: null, policy: { text: "", trialDays: 60 } };
let submitted = null;
const myCompany = () => ({ verified: false, verification: submitted ? { id: "v1", status: "pending", ...submitted, reason: "", submittedAt: new Date().toISOString() } : null, pendingJobs: [{ id: J(1), title: "Waiting designer", postedAt: new Date(now - DAY).toISOString() }], message: "Your jobs go live once your company is verified by tdc." });
const verification = { id: "v1", employer: { id: E, name: "Hina", email: "hina@brightlabs.test", accountStatus: "Verified" }, companyName: "Bright Labs (Pvt) Ltd", registrationType: "ntn", ntnOrSecp: "12345678", businessEmailDomain: "brightlabs.test", website: "brightlabs.test", companyGroupKey: "reg:12345678", status: "pending", reason: "", submittedAt: new Date().toISOString(), hints: { signInEmailMatchesDomain: true, websiteMatchesDomain: true }, duplicateOf: [], history: [], pendingJobs: [{ id: J(1), title: "Waiting designer", postedAt: new Date(now - DAY).toISOString() }] };
const upcoming = [
  { _id: "a1", applicationId: "a1", interviewId: "i1", fullName: "Sana Timeline", jobId: { title: "Backend intern", department: "Engineering" }, interviewDate: new Date(now + DAY).toISOString(), meetingLink: "", location: "DHA office, Karachi", mode: "in-person", source: "timeline" },
  { _id: "a2", applicationId: "a2", fullName: "Ali Classic", jobId: { title: "Backend intern", department: "Engineering" }, interviewDate: new Date(now + 2 * DAY).toISOString(), meetingLink: "https://meet.test/x", source: "classic" },
];

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
    if (k === "GET /api/auth/me") return send(200, { _id: E, name: "Hina", role: "employee", companyName: "Bright Labs", logo: "https://cdn.test/bright.png" });
    if (k === "GET /api/jobs/stats") return send(200, { totalJobs: 3, activeJobs: 1, closedJobs: 1, pendingJobs: 1, totalApplications: 6, pendingApplications: 1, shortlistedApplications: 1, hiredApplications: 0 });
    if (k === "GET /api/jobs/my-jobs") return send(200, jobs);
    if (k === "GET /api/jobs/interviews/upcoming") return send(200, upcoming);
    if (k === "GET /api/career/employers/me/hiring-access") return send(200, ok(access));
    if (k === "GET /api/career/employers/me/company-verification") return send(200, ok(myCompany()));
    if (k === "POST /api/career/employers/me/company-verification") { submitted = body; return send(201, ok(myCompany())); }
    if (k === "POST /api/jobs/add") return send(201, { message: "Job saved. Your job goes live once your company is verified by tdc.", pendingVerification: true, code: "PENDING_COMPANY_VERIFICATION", data: { ...body, _id: J(4), status: "pending_verification" } });
    if (k === `PATCH /api/jobs/toggle/${J(2)}`) return send(200, { message: "Job reopened for 30 days", active: true, status: "live" });
    if (k === "GET /api/career/admin/company-verifications") return send(200, ok([verification]));
    if (k === "POST /api/career/admin/company-verifications/v1/review") return send(200, ok({ id: "v1", status: "approved", publishedJobs: 1 }));
    return send(200, q.method === "GET" ? [] : { success: true });
  });
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  require("./serve").send(f, s, API); // the build, with this check's mock API port
}).listen(WEB);

(async () => {
  const b = await launch(9471);
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
    // rendered, and its requests settled (the admin menu's items appear once their availability calls answer)
    await pg.waitFor(`(document.getElementById("root")?.innerText || "").trim().length > 20`, { timeout: 25000, label: `${p} to render` });
    await pg.settled();
    return pg;
  };
  const audit = async (pg, label, scope) => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => v.id + " " + v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" ; ")); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.join(" | "));
  };
  const text = (pg, sel = "body") => pg.evaluate(`document.querySelector(${JSON.stringify(sel)})?.innerText || ""`);
  const click = (pg, re, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button, a")].find((x) => ${re}.test((x.getAttribute("aria-label") || x.innerText).trim()) && !x.disabled); if (e) e.click(); return !!e; })()`);
  const setVal = (pg, sel, v, proto = "HTMLInputElement") => pg.evaluate(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(${proto}.prototype, "value").set.call(i, ${JSON.stringify(v)}); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const emp = { _id: E, id: E, role: "employee", name: "Hina", companyName: "Bright Labs" };

  console.log("── employer jobs: verification, statuses");
  let pg = await open(emp, "/employee-jobs");
  let t = await text(pg, '[data-card="company-verification"]');
  check("the note: 'your job goes live once your company is verified', 1 waiting, a link to verify", /your job goes live once your company is verified/.test(t) && /1 job is waiting/.test(t) && /verify your company/.test(t), t);
  await audit(pg, "verification note", '[data-card="company-verification"]');
  t = await text(pg, "table");
  check("statuses: pending verification, closed · reopen, live", /pending verification/.test(t) && /closed · reopen/.test(t) && /\blive\b/.test(t), t.split("\n").join(" | "));
  t = await text(pg, '[aria-label="filter by status"]');
  check("the filter has live, pending, closed, off", ["live", "pending", "closed", "off"].every((w) => t.includes(w)), t);
  await audit(pg, "jobs table with statuses", ".k-table-card");
  check("reopen a closed job", await click(pg, /^reopen Old analyst$/));
  await pg.settled();
  check("reopen sends the toggle and says 'live for 30 more days'", calls.some((c) => c.k === `PATCH /api/jobs/toggle/${J(2)}`) && /live for 30 more days/.test(await text(pg)));

  console.log("── a new job: profile defaults, PKR, waits for verification");
  check("post a job opens the form", await click(pg, /^post a job$/i));
  await pg.settled();
  await setVal(pg, "#jm-title", "QA intern");
  await pg.evaluate(`(() => { const t = [...document.querySelectorAll("[role=dialog] [role=tab]")].find((x) => /company/i.test(x.innerText) || x.getAttribute("aria-controls")?.includes("company")) || document.querySelectorAll("[role=dialog] [role=tab]")[4]; t?.click(); return !!t; })()`);
  await pg.settled();
  const vals = await pg.evaluate(`({ name: document.querySelector("#jm-company")?.value, logo: document.querySelector("#jm-logo")?.value })`);
  check("company name and logo come from the profile (editable fields)", vals.name === "Bright Labs" && vals.logo === "https://cdn.test/bright.png", JSON.stringify(vals));
  await audit(pg, "job form, company section", "[role=dialog]");
  await pg.evaluate(`document.getElementById("job-form").requestSubmit(); true`);
  await pg.settled();
  const add = calls.filter((c) => c.k === "POST /api/jobs/add").slice(-1)[0];
  check("the post sends currency PKR and the profile's company and logo", add && add.body.currency === "PKR" && add.body.companyName === "Bright Labs" && add.body.companyLogo === "https://cdn.test/bright.png" && add.body.title === "QA intern", JSON.stringify(add?.body || {}).slice(0, 300));
  check("the server's 'goes live once your company is verified' is shown", /goes live once your company is verified/.test(await text(pg)));

  console.log("── /company-verification");
  pg = await open(emp, "/company-verification");
  t = await text(pg, '[data-screen="company-verification"]');
  check("the page: jobs waiting (Waiting designer) and the form", /jobs waiting/.test(t) && /Waiting designer/.test(t) && /send for verification/.test(t), t.split("\n").join(" | ").slice(0, 300));
  await audit(pg, "company verification page", '[data-screen="company-verification"]');
  await setVal(pg, "#cv-name", "Bright Labs (Pvt) Ltd");
  await setVal(pg, "#cv-reg", "1234567-8");
  await setVal(pg, "#cv-domain", "brightlabs.test");
  await setVal(pg, "#cv-web", "brightlabs.test");
  await click(pg, /^send for verification$/);
  await pg.settled();
  check("the details are sent", submitted && submitted.companyName === "Bright Labs (Pvt) Ltd" && submitted.ntnOrSecp === "1234567-8" && submitted.registrationType === "ntn", JSON.stringify(submitted));
  check("then it shows 'being checked' and 'send again'", /being checked/.test(await text(pg)) && /send again/.test(await text(pg)));

  console.log("── employer dashboard");
  pg = await open(emp, "/employee-dashboard");
  t = await text(pg);
  const order = t.indexOf("Sana Timeline") >= 0 && t.indexOf("Sana Timeline") < t.indexOf("Ali Classic");
  check("upcoming interviews: the timeline one and the classic one, in time order", order, t.split("\n").join(" | ").slice(0, 400));
  check("an in-person timeline interview shows its place; the classic one its Join link", /DHA office, Karachi/.test(t) && (await pg.evaluate(`!!document.querySelector('a[aria-label="join the interview with Ali Classic"]')`)));
  check("'jobs posted' says 1 live · 1 closed · 1 waiting for verification", /1 live · 1 closed · 1 waiting for verification/.test(t));
  await audit(pg, "employer dashboard", '[data-screen="employer-dashboard"]');

  console.log("── admin company verifications");
  pg = await open({ _id: ADMIN, id: ADMIN, role: "admin", name: "admin" }, "/admin");
  check("the menu has company verifications (every employer)", await pg.waitFor(`!!document.querySelector('.tdcp-nav [data-page="company_verifications"]')`, { timeout: 20000, label: "'company_verifications' in the menu" }).then(() => pg.evaluate(`(() => { const e = document.querySelector('.tdcp-nav [data-page="company_verifications"]'); e.click(); return true; })()`)).catch(() => false));
  await pg.settled();
  t = await text(pg, '[data-screen="company-verifications"]');
  check("each company with its jobs waiting", /jobs waiting/.test(t) && /1 waiting/.test(t) && /Waiting designer/.test(t), t.split("\n").join(" | ").slice(0, 400));
  await audit(pg, "admin company verifications", '[data-screen="company-verifications"]');
  await click(pg, /^approve$/);
  await pg.settled();
  check("approving explains the waiting job goes live", /approving puts their 1 waiting job live/.test(await text(pg, "[role=dialog]")));
  await setVal(pg, "#cv-reason", "NTN checked on FBR", "HTMLTextAreaElement");
  await click(pg, /^approve$/, `document.querySelector("[role=dialog]")`);
  await pg.settled();
  const rv = calls.filter((c) => c.k === "POST /api/career/admin/company-verifications/v1/review").slice(-1)[0];
  check("approve sends the review and says '1 job is live now'", rv && rv.body.action === "approve" && rv.body.reason === "NTN checked on FBR" && /1 job is live now/.test(await text(pg)), JSON.stringify(rv));

  const errs = pages.flatMap((p) => p.errs);
  check("no page errors, no console errors", errs.length === 0, errs.join(" | "));
  console.log(bad ? "\nFAIL" : "\nall ok");
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
