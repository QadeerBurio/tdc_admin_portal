// node --experimental-websocket admin-actions-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// The admin "admin actions" page (unified admin action log, read-only) against a mock API:
// - the menu item (section "oversight") shows only when /api/admin/actions answers; hidden when it 404s;
// - rows: time, admin, action, target, changed fields (before → after) and reason;
// - filters go to the server as query parameters (area prefix "loyalty.*", admin, target, Karachi dates);
// - "load more" sends the cursor and appends; the page never writes (no POST / PATCH / PUT / DELETE).
// axe-core WCAG 2 A / AA on the page. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const AD1 = "6aed00000000000000000001", AD2 = "6aed00000000000000000002";
const mk = (i, action, targetType, before, after, reason, admin = AD1) => ({ id: `6aee0000000000000000000${i.toString(16)}`, at: new Date(Date.UTC(2026, 10, 10, 10 - i)).toISOString(), admin: { id: admin, name: admin === AD1 ? "Ayesha Admin" : "Bilal Admin" }, action, targetType, targetId: `6aef00000000000000000${String(i).padStart(3, "0")}`, before, after, reason });
const all = [
  mk(1, "loyalty.program.update", "LoyaltyProgram", { adminMaxDiscountPct: null }, { adminMaxDiscountPct: 20 }, "too generous for the pilot"),
  mk(2, "surplus.case.decide", "SurplusSupportCase", { status: "open" }, { status: "decided", decision: "upheld" }, "photos show mould", AD2),
  mk(3, "loyalty.visit.reverse", "LoyaltyLedger", { counted: true }, { counted: false }, "refund: order returned"),
  mk(4, "fhf.verification.review", "EmployerCompanyVerification", null, { status: "approved" }, ""),
];
const calls = [];
let available = true;
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const u = new URL(q.url, "http://x");
  const k = `${q.method} ${u.pathname}`;
  calls.push({ k, q: Object.fromEntries(u.searchParams) });
  let status = 200, out;
  if (k === "GET /api/admin/actions" || k === "GET /api/admin/actions/facets") {
    if (!available) { status = 404; out = { message: "not found" }; }
    else if (k.endsWith("facets")) out = ok({ actions: [...new Set(all.map((r) => r.action))].sort(), targetTypes: [...new Set(all.map((r) => r.targetType))].sort(), admins: [{ id: AD1, name: "Ayesha Admin" }, { id: AD2, name: "Bilal Admin" }] });
    else {
      const p = Object.fromEntries(u.searchParams);
      let rows = all.filter((r) => (!p.action || (p.action.endsWith(".*") ? r.action.startsWith(p.action.slice(0, -1)) : r.action === p.action)) && (!p.adminId || r.admin.id === p.adminId) && (!p.targetId || r.targetId === p.targetId));
      const limit = Number(p.limit) || 50;
      if (limit === 50 && !p.action && !p.before) out = ok({ rows: rows.slice(0, 3), next: rows[2].id }); // first page: 3 rows and a cursor
      else if (p.before) out = ok({ rows: rows.slice(3), next: null });
      else out = ok({ rows, next: null });
    }
  } else if (k === "GET /api/loyalty/admin/programs" || k === "GET /api/career/admin/hires") { status = 404; out = { success: false, error: { code: "NOT_FOUND" } }; } // the other oversight pages, not under test: off
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
  const b = await launch(9355);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const admin = { _id: AD1, id: AD1, role: "admin", name: "Ayesha Admin" };
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(admin)})); true`);
  const text = () => pg.evaluate(`(document.querySelector("[data-screen=admin-actions]") || document.getElementById("root"))?.innerText || ""`);
  const click = (re) => pg.evaluate(`(() => { const e = [...document.querySelectorAll("button, a")].find((x) => ${re}.test(x.innerText.trim()) && !x.disabled); if (e) e.click(); return !!e; })()`);
  const setSel = (id, v) => pg.evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); Object.getOwnPropertyDescriptor(el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const lastList = () => [...calls].reverse().find((c) => c.k === "GET /api/admin/actions" && c.q.limit !== "1");

  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  check("menu: 'admin actions' under oversight", (await pg.evaluate(`document.getElementById("root").innerText.toLowerCase()`)).includes("oversight") && (await click(/^admin actions$/i)));
  await sleep(2000);
  let t = await text();
  check("rows: time, admin, action, target, changes, reason", ["Ayesha Admin", "Bilal Admin", "loyalty.program.update", "LoyaltyProgram", "adminMaxDiscountPct: null → 20", "too generous for the pilot", "status: open → decided", "decision: – → upheld"].every((w) => t.includes(w)), t.replace(/\n/g, " | ").slice(0, 300));
  check("first page: 3 rows and 'load more'", (await pg.evaluate(`document.querySelectorAll("[data-action-row]").length`)) === 3 && t.includes("load more"));
  await pg.evaluate(AXE + "; true");
  const v = await pg.evaluate(`(async () => { const r = await axe.run(document.querySelector("main") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
  check("axe WCAG 2 A/AA: admin actions", v.length === 0, v.length ? JSON.stringify(v) : "no violations");

  await click(/^load more$/i);
  await sleep(1200);
  check("load more: sends the cursor, appends the 4th row", lastList()?.q.before === all[2].id && (await pg.evaluate(`document.querySelectorAll("[data-action-row]").length`)) === 4 && (await text()).includes("fhf.verification.review"));

  // filters: an area, an admin, dates
  await setSel("aa-action", "loyalty.*");
  await setSel("aa-admin", AD1);
  await setSel("aa-from", "2026-11-01");
  await setSel("aa-to", "2026-11-10");
  await click(/^apply filters$/i);
  await sleep(1200);
  const q = lastList()?.q || {};
  check("filters sent: action prefix, admin, Karachi day bounds", q.action === "loyalty.*" && q.adminId === AD1 && q.from === "2026-10-31T19:00:00.000Z" && q.to === "2026-11-10T18:59:59.999Z", JSON.stringify(q));
  const shown = await pg.evaluate(`[...document.querySelectorAll("[data-action-row]")].map((r) => r.dataset.actionRow)`);
  check("…only loyalty rows shown", shown.length === 2 && shown.every((a) => a.startsWith("loyalty.")), JSON.stringify(shown));
  await click(/^clear$/i);
  await sleep(1000);
  check("clear: back to every action", !(lastList()?.q.action) && (await pg.evaluate(`document.querySelectorAll("[data-action-row]").length`)) === 3);
  check("the page never writes", !calls.some((c) => c.k.includes("/admin/actions") && !c.k.startsWith("GET")));

  // not on the server yet: the menu item stays hidden
  available = false;
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  check("endpoint missing: no 'admin actions' item (and no empty 'oversight' section)", !(await pg.evaluate(`[...document.querySelectorAll("button, a")].some((x) => /^admin actions$/i.test(x.innerText.trim()))`)) && !(await pg.evaluate(`document.getElementById("root").innerText.toLowerCase().includes("oversight")`)));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
