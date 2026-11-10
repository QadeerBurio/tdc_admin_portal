// node --experimental-websocket hiring-overview-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Admin > oversight > hiring overview (read-only, across employers) against a mock of /api/career/admin/*:
// - the menu item shows only when the admin hiring views answer (hidden on 404: timeline not set up);
// - by stage: a count for every stage, clicking one asks the server for that stage's rows;
// - an employer / job id that isn't a 24-character id is refused before anything is sent;
// - interviews: status and Karachi day bounds go to the server; hires: verified / revoked shown;
// - nothing on the page writes. axe-core WCAG 2 A / AA on each tab. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const E1 = "6af3000000000000000000e1", E2 = "6af3000000000000000000e2";
const app = (i, stage, emp = E1) => ({ applicationId: `6af40000000000000000000${i}`, appliedAt: "2026-11-0" + (i + 1) + "T08:00:00Z", stage, job: { id: "j", title: i % 2 ? "Backend dev" : "Designer", archived: false }, employer: { id: emp, name: emp === E1 ? "Hire Co" : "Other Co" }, candidate: { id: `u${i}`, firstName: ["Sana", "Ali", "Zara", "Omar"][i] }, interview: stage === "interview" ? { status: "accepted", startsAt: "2026-11-20T10:00:00Z" } : null, onTimeline: true });
const apps = [app(0, "applied"), app(1, "interview"), app(2, "hired", E2), app(3, "rejected")];
const counts = { applied: 1, reviewed: 0, shortlisted: 0, interview: 1, offer: 0, hired: 1, rejected: 1, withdrawn: 0 };
const calls = [];
let available = true;
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const u = new URL(q.url, "http://x");
  const k = `${q.method} ${u.pathname}`;
  const p = Object.fromEntries(u.searchParams);
  calls.push({ k, p });
  let status = 200, out;
  if (k.startsWith("GET /api/career/admin/") && ["applications", "interviews", "hires"].some((x) => k.endsWith(x)) && !available) { status = 404; out = { success: false, error: { code: "CAREER_OFF" } }; }
  else if (k === "GET /api/career/admin/applications") out = ok({ counts, total: 4, applications: apps.filter((a) => (!p.stage || a.stage === p.stage) && (!p.employerId || a.employer.id === p.employerId)) });
  else if (k === "GET /api/career/admin/interviews") out = ok({ interviews: [{ id: "i1", applicationId: apps[1].applicationId, job: { id: "j", title: "Backend dev" }, employer: { id: E1, name: "Hire Co" }, candidate: { id: "u1", firstName: "Ali" }, startsAt: "2026-11-20T10:00:00Z", endsAt: "2026-11-20T10:45:00Z", mode: "online", status: "accepted", active: true }] });
  else if (k === "GET /api/career/admin/hires") out = ok({ hires: [{ id: "h1", job: { id: "j", title: "Designer" }, employer: { id: E2, name: "Other Co" }, candidate: { id: "u2", firstName: "Zara" }, verificationLevel: "verified", confirmedAt: "2026-11-05T10:00:00Z", revokedAt: null }, { id: "h2", job: { id: "j", title: "Backend dev" }, employer: { id: E1, name: "Hire Co" }, candidate: { id: "u9", firstName: "Bilal" }, verificationLevel: "revoked", confirmedAt: "2026-10-05T10:00:00Z", revokedAt: "2026-10-09T10:00:00Z" }] });
  else if (k === "GET /api/admin/actions" || k === "GET /api/loyalty/admin/programs") { status = 404; out = {}; } // the other oversight pages: off
  else out = q.method === "GET" ? [] : { success: true };
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
  const b = await launch(9358);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(admin)})); true`);
  const text = () => pg.evaluate(`document.querySelector("[data-screen=hiring-overview]")?.innerText || ""`);
  const click = (label) => pg.evaluate(`(() => { const e = [...document.querySelectorAll("button, a, [role=tab]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)} && !x.disabled); if (e) e.click(); return !!e; })()`);
  const type = (id, v) => pg.evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const lastOf = (path) => [...calls].reverse().find((c) => c.k === `GET ${path}` && c.p.limit !== "1");
  const axe = async (label) => {
    await pg.evaluate(AXE + "; true");
    const v = await pg.evaluate(`(async () => { const r = await axe.run(document.querySelector("main") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.length ? JSON.stringify(v) : "no violations");
  };

  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  check("menu: 'hiring overview' under oversight", await click("hiring overview"));
  await sleep(1500);
  let t = await text();
  check("by stage: a count for every stage and the rows", ["applied", "reviewed", "shortlisted", "interview", "offer", "hired", "rejected", "withdrawn", "4 applications in all", "Sana", "Hire Co", "Other Co", "accepted"].every((w) => t.includes(w)), t.replace(/\n/g, " | ").slice(0, 300));
  await axe("by stage");
  await pg.evaluate(`[...document.querySelectorAll("[data-screen=hiring-overview] .k-stat")].find((x) => /^hired/i.test(x.innerText.trim()))?.click(); true`);
  await sleep(1000);
  check("clicking a stage asks the server for it", lastOf("/api/career/admin/applications")?.p.stage === "hired" && (await pg.evaluate(`document.querySelectorAll("[data-row]").length`)) === 1 && (await text()).includes("Zara"));
  await type("ho-emp", "not-an-id");
  await sleep(300);
  const nBefore = calls.length;
  await click("apply filters");
  await sleep(500);
  check("a bad employer id: error shown, nothing sent", (await text()).includes("24 characters, 0-9 and a-f") && calls.length === nBefore && (await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "apply filters").disabled`)) === true);
  await type("ho-emp", E2);
  await sleep(200);
  await click("apply filters");
  await sleep(1000);
  check("a valid employer id goes to the server", lastOf("/api/career/admin/applications")?.p.employerId === E2);
  await click("clear");
  await sleep(800);

  await click("interviews");
  await sleep(1200);
  t = await text();
  check("interviews: when, candidate, job, employer, how, status", ["Ali", "Backend dev", "Hire Co", "online", "accepted"].every((w) => t.includes(w)));
  await axe("interviews");
  await type("ho-status", "completed");
  await type("ho-from", "2026-11-01");
  await type("ho-to", "2026-11-30");
  await click("apply filters");
  await sleep(1000);
  const ip = lastOf("/api/career/admin/interviews")?.p || {};
  check("interview filters: status and Karachi day bounds", ip.status === "completed" && ip.from === "2026-10-31T19:00:00.000Z" && ip.to === "2026-11-30T18:59:59.999Z", JSON.stringify(ip));
  await click("clear");
  await sleep(500);

  await click("hires");
  await sleep(1200);
  t = await text();
  check("hires: verified and revoked (with the date)", t.includes("Zara") && t.includes("verified") && t.includes("revoked (9 Oct 2026)"));
  await axe("hires");
  check("the page never writes", !calls.some((c) => !c.k.startsWith("GET ")));

  available = false;
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  check("views missing (timeline not set up): no 'hiring overview' item, no empty oversight section", !(await pg.evaluate(`[...document.querySelectorAll("button, a")].some((x) => /^hiring overview$/i.test(x.innerText.trim()))`)) && !(await pg.evaluate(`document.getElementById("root").innerText.toLowerCase().includes("oversight")`)));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
