// node --experimental-websocket career-interviews-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// The employer's interviews page for pilot employers (FLAG_CAREER_TIMELINE) against a mock API:
// - /interviews shows the timeline interviews by Karachi day: time, candidate, job, how to join (https links only),
//   status, .ics and a link to the candidate profile; "classic list" opens the old page;
// - filters go to the server: upcoming (from = now), past (to = now), all (neither), job, status;
// - outside the pilot: the classic page only, no timeline request. axe-core WCAG 2 A / AA. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const E = "6af5000000000000000000e1";
const J1 = "6af6000000000000000000a1", J2 = "6af6000000000000000000a2";
const iv = (id, iso, name, job, mode, status, extra = {}) => ({ id, applicationId: `6af700000000000000000${id.slice(-3)}`, job, employer: { id: E, name: "Hire Co" }, candidate: { id: "u", firstName: name }, startsAt: iso, endsAt: iso, mode, status, active: true, rescheduled: 0, location: "", meetingLink: "", ...extra });
const list = [
  iv("6af8000000000000000000001", "2026-11-20T05:00:00Z", "Sana", { id: J1, title: "Backend dev" }, "online", "accepted", { meetingLink: "https://meet.example.com/abc" }),
  iv("6af8000000000000000000002", "2026-11-20T09:30:00Z", "Ali", { id: J1, title: "Backend dev" }, "in-person", "invited", { location: "Clifton office", rescheduled: 1 }),
  iv("6af8000000000000000000003", "2026-11-21T06:00:00Z", "Zara", { id: J2, title: "Designer" }, "online", "invited", { meetingLink: "javascript:alert(1)" }),
];
let pilot = true;
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const u = new URL(q.url, "http://x");
  const k = `${q.method} ${u.pathname}`;
  const p = Object.fromEntries(u.searchParams);
  calls.push({ k, p });
  let out;
  if (k === "GET /api/app/flags/me") out = { careerTimeline: pilot };
  else if (k === "GET /api/career/employers/me/applications") out = ok({ enabled: true, jobs: [{ id: J1, title: "Backend dev" }, { id: J2, title: "Designer" }], applications: [] });
  else if (k === "GET /api/career/employers/me/interviews") out = ok({ interviews: list.filter((i) => (!p.jobId || i.job.id === p.jobId) && (!p.status || i.status === p.status)) });
  else if (k === "GET /api/jobs/interviews/all") out = [];
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
  const b = await launch(9359);
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
  const text = () => pg.evaluate(`(document.querySelector("[data-screen=career-interviews]") || document.getElementById("root"))?.innerText || ""`);
  const click = (label) => pg.evaluate(`(() => { const e = [...document.querySelectorAll("button, a, [role=radio]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)} && !x.disabled); if (e) e.click(); return !!e; })()`);
  const setSel = (label, v) => pg.evaluate(`(() => { const el = document.querySelector('select[aria-label="${label}"]'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const lastList = () => [...calls].reverse().find((c) => c.k === "GET /api/career/employers/me/interviews")?.p || null;

  await go(pg, `http://127.0.0.1:${WEB}/interviews`);
  await sleep(3500);
  let t = await text();
  check("pilot employer: interviews by Karachi day", t.includes("Friday, 20 November 2026") && t.includes("Saturday, 21 November 2026") && (await pg.evaluate(`document.querySelectorAll("[data-day]").length`)) === 2, t.replace(/\n/g, " | ").slice(0, 300));
  check("…times in Karachi, candidate, job, how, status", ["10:00", "14:30", "Sana · Backend dev", "online: join link", "in person: Clifton office", "moved 1×", "accepted", "invited"].every((w) => t.includes(w)));
  const hrefs = await pg.evaluate(`[...document.querySelectorAll("[data-screen=career-interviews] a")].map((a) => a.getAttribute("href"))`);
  check("https join link shown; a javascript: link is not", hrefs.includes("https://meet.example.com/abc") && !hrefs.some((h) => /^javascript:/i.test(h || "")) && t.includes("Zara · Designer"), JSON.stringify(hrefs));
  check("each interview links to the candidate profile", hrefs.filter((h) => /^\/candidate\/[0-9a-f]{24}$/.test(h || "")).length === 3);
  const p1 = lastList();
  check("upcoming: from = now, no to", !!p1?.from && Math.abs(new Date(p1.from) - Date.now()) < 120e3 && !p1.to, JSON.stringify(p1));
  await pg.evaluate(AXE + "; true");
  const v = await pg.evaluate(`(async () => { const r = await axe.run(document.querySelector("main") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
  check("axe WCAG 2 A/AA: interviews", v.length === 0, v.length ? JSON.stringify(v) : "no violations");
  await click("past");
  await sleep(800);
  const p2 = lastList();
  check("past: to = now, no from", !!p2?.to && !p2.from, JSON.stringify(p2));
  await click("all");
  await sleep(800);
  const p3 = lastList();
  check("all: neither", !p3.from && !p3.to, JSON.stringify(p3));
  await setSel("job", J2);
  await sleep(800);
  check("job filter goes to the server", lastList()?.jobId === J2 && (await text()).includes("Zara") && !(await text()).includes("Sana"));
  await setSel("status", "accepted");
  await sleep(800);
  check("status filter goes to the server", lastList()?.status === "accepted");
  await setSel("job", "");
  await setSel("status", "");
  await sleep(600);
  await click("classic list");
  await sleep(1500);
  check("classic list: the old page (legacy interviews request)", calls.some((c) => c.k === "GET /api/jobs/interviews/all") && (await pg.evaluate(`!!document.querySelector("[data-screen=career-interviews]")`)) === false);

  // outside the pilot
  pilot = false;
  calls.length = 0;
  await go(pg, `http://127.0.0.1:${WEB}/interviews`);
  await sleep(3500);
  check("outside the pilot: classic page only, no timeline request", !calls.some((c) => c.k === "GET /api/career/employers/me/interviews") && (await pg.evaluate(`!!document.querySelector("[data-screen=career-interviews]")`)) === false);

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
