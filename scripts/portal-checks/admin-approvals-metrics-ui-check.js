// node --experimental-websocket admin-approvals-metrics-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Brand approvals, metrics and the overview (feat/admin-approvals-metrics), against a mock API:
// - brand approvals: the search is sent to the server (debounced: one request for a typed word), filters and sort
//   too; tab counts; a row opens the drawer (details, documents, branches, offers, contact, history with admin and
//   reason); reject / request info need a reason (shown, nothing sent); with one, the request carries it and the
//   row updates in place (no page reload); bulk approve sends the selected ids with one reason; empty + error states
// - metrics: every group, an "i" per metric whose tooltip is the server's definition (focus and Escape), the range
//   presets and a custom range reach the server, CSV per section, the error state with "try again"
// - overview: KPI cards with the change, "needs your action" counts with buttons that open their pages ("not set up"
//   when the server has no count), quick actions, charts with a table alternative
// - axe-core WCAG 2 A / AA on each view and dialog, desktop and phone width; no horizontal scroll on a phone;
//   no console errors
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { launch, go, sleep, viewport } = require("./cdp");
const { metrics } = require("./mock-admin-metrics");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5198, API = 5197;

// ---------- the mock brand-approval API (state kept, so actions show up) ----------
const id = (n) => `6aec0000000000000000${String(n).padStart(4, "0")}`;
const brandRow = (n, brandName, extra = {}) => ({ _id: id(n), brandName, name: `${brandName} Owner`, email: `b${n}@example.com`, phone: "03001234567", logo: "", category: "Food", city: "Karachi", brandApprovalStatus: "pending", createdAt: new Date(Date.now() - n * 864e5).toISOString(), branchesCount: n % 3, offersCount: n % 2, ...extra });
let BRANDS = [
  brandRow(1, "Pending Perfumes", { name: "Zara Khan", category: "Fashion" }),
  brandRow(2, "Crust Pizza", { city: "Lahore", brandApprovalStatus: "approved" }),
  brandRow(3, "Rejected Rugs", { city: "Islamabad", category: "Home", brandApprovalStatus: "rejected" }),
  ...Array.from({ length: 4 }, (_, i) => brandRow(10 + i, `Bulk Brand ${i}`)),
];
const HISTORY = [];
const calls = [];
let failList = false, failMetrics = false;
function listReply(qs) {
  if (failList) return [500, { success: false, message: "database unavailable" }];
  const q = (qs.get("q") || "").toLowerCase();
  const st = qs.get("status") || "all";
  let rows = BRANDS.filter((b) => !q || [b.brandName, b.name, b.email, b.phone, b.city, b.category].some((v) => String(v).toLowerCase().includes(q)));
  if (qs.get("city")) rows = rows.filter((b) => b.city.toLowerCase() === qs.get("city").toLowerCase());
  if (qs.get("category")) rows = rows.filter((b) => b.category.toLowerCase() === qs.get("category").toLowerCase());
  const counts = { all: rows.length };
  for (const s of ["pending", "approved", "rejected", "draft"]) counts[s] = rows.filter((b) => b.brandApprovalStatus === s).length;
  if (st !== "all") rows = rows.filter((b) => b.brandApprovalStatus === st);
  if (qs.get("sort") === "name") rows = [...rows].sort((a, b) => a.brandName.localeCompare(b.brandName));
  return [200, { success: true, brands: rows, total: rows.length, page: 1, pages: 1, limit: 25, counts, stats: counts, options: { cities: ["Islamabad", "Karachi", "Lahore"], categories: ["Fashion", "Food", "Home"] } }];
}
function handle(method, url, body) {
  const u = new URL(url, "http://x");
  const p = u.pathname;
  calls.push({ method, path: p, query: Object.fromEntries(u.searchParams), body });
  if (p === "/api/analytics/admin/metrics") return failMetrics ? [500, { success: false, error: { code: "SERVER_ERROR", message: "Something went wrong" } }] : [200, metrics(Object.fromEntries(u.searchParams))];
  if (p === "/api/brand-approval" && method === "GET") return listReply(u.searchParams);
  const one = p.match(/^\/api\/brand-approval\/([0-9a-f]{24})$/);
  if (one && method === "GET") {
    const b = BRANDS.find((x) => x._id === one[1]);
    return [200, { success: true, brand: { ...b, address: "12 Main Rd", websiteUrl: "https://example.com", onlineStore: { platform: "none", status: "none" } }, branches: [{ _id: "br1", name: "Clifton", city: "Karachi", isActive: true }], offers: [{ _id: "of1", title: "20% off", discountPercentage: 20, status: "active" }], history: HISTORY.filter((h) => h.brand === b._id).map((h) => ({ ...h })).reverse().concat([{ id: "legacy", action: "brand.reject", status: "rejected", reason: "blurry logo", admin: null, at: "2026-09-01T05:00:00.000Z", legacy: true }]) }];
  }
  const st = p.match(/^\/api\/brand-approval\/([0-9a-f]{24})\/status$/);
  if (st && method === "PUT") {
    const b = BRANDS.find((x) => x._id === st[1]);
    b.brandApprovalStatus = body.status;
    HISTORY.push({ id: `h${HISTORY.length}`, brand: b._id, action: body.status === "approved" ? "brand.approve" : "brand.reject", reason: body.reason || "", admin: { id: "a1", name: "Ayesha Admin" }, at: new Date().toISOString() });
    return [200, { success: true, brand: { ...b } }];
  }
  const ri = p.match(/^\/api\/brand-approval\/([0-9a-f]{24})\/request-info$/);
  if (ri && method === "POST") {
    const b = BRANDS.find((x) => x._id === ri[1]);
    HISTORY.push({ id: `h${HISTORY.length}`, brand: b._id, action: "brand.request_info", reason: body.reason, admin: { id: "a1", name: "Ayesha Admin" }, at: new Date().toISOString() });
    return [200, { success: true, brand: { ...b } }];
  }
  if (p === "/api/brand-approval/bulk-status" && method === "PUT") {
    const rows = BRANDS.filter((b) => body.brandIds.includes(b._id));
    rows.forEach((b) => { b.brandApprovalStatus = body.status; });
    return [200, { success: true, updatedCount: rows.length, brands: rows.map((b) => ({ ...b })) }];
  }
  if (p === "/api/admin/card-stats") return [200, { pending: 0, approvedTotal: 0 }];
  if (p === "/api/admin/bookings/stats") return [200, { totalBookings: 0 }];
  return [200, method === "GET" ? [] : { success: true }];
}
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  let raw = "";
  q.on("data", (c) => { raw += c; });
  q.on("end", () => {
    let body = null; try { body = raw ? JSON.parse(raw) : null; } catch {}
    const [code, out] = handle(q.method, q.url, body);
    s.writeHead(code, h);
    s.end(JSON.stringify(out));
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
  const b = await launch(9411);
  let bad = 0;
  const check = (label, ok, detail = "") => { if (!ok) bad = 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}${!ok && detail ? `  (${detail})` : ""}`); };
  const pg = await b.page();
  const errs = [];
  await pg.s("Log.enable");
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/status of 500/.test(m.params.entry.text)) errs.push("log: " + m.params.entry.text.slice(0, 160));
  });
  await viewport(pg, 1366, 900, false);
  await go(pg, `http://127.0.0.1:${WEB}/`);
  const admin = { _id: "6aecffffffffffffffffffff", id: "6aecffffffffffffffffffff", role: "admin", name: "Ayesha Admin" };
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(admin)})); true`);
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  const ev = (js) => pg.evaluate(js);
  const text = () => ev(`document.body.innerText || ""`);
  // menu items by page id (their text includes the "waiting" badge)
  const menu = (page) => ev(`document.querySelector(${JSON.stringify(`.tdcp-nav [data-page="${page}"]`)})?.click(); true`);
  const clickText = (t, scope = "document") => ev(`[...${scope}.querySelectorAll("button, a, [role=tab]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(t)})?.click(); !!0`);
  const setValue = (sel, v, kind = "HTMLInputElement", evt = "input") => ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; Object.getOwnPropertyDescriptor(window.${kind}.prototype, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event(${JSON.stringify(evt)}, { bubbles: true })); return true; })()`);
  const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  let axeTotal = 0;
  const audit = async (label, scope = "main") => {
    await ev(AXE + ";true");
    const v = await ev(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    axeTotal += v.length;
    console.log(`axe ${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };
  const tab = (label) => ev(`[...document.querySelectorAll("[role=group][aria-label=status] button")].find((x) => x.innerText.trim().toLowerCase().startsWith(${JSON.stringify(label)}))?.click(); true`);
  const listCalls = () => calls.filter((c) => c.method === "GET" && c.path === "/api/brand-approval");

  // ======== brand approvals
  console.log("-- brand approvals");
  await ev(`window.__noReload = 1; true`);
  await menu("brand_approval");
  await sleep(1800);
  let t = await text();
  check("pending tab first, with counts on every tab", /Pending\s*5/.test(t) && /Approved\s*1/.test(t) && /Rejected\s*1/.test(t) && /All\s*7/.test(t), t.slice(0, 300));
  check("rows: name, category, city, joined, branches, offers, status columns", ["category", "city", "joined", "branches", "offers", "status"].every((c) => t.toLowerCase().includes(c)) && t.includes("Pending Perfumes") && !t.includes("Crust Pizza"));
  await audit("brand approvals: list");
  await tab("all"); await sleep(800);
  const before = listCalls().length;
  await ev(`document.querySelector("#ba-search").focus(); true`);
  await pg.s("Input.insertText", { text: "z" }); await sleep(60);
  await pg.s("Input.insertText", { text: "a" }); await sleep(60);
  await pg.s("Input.insertText", { text: "ra" });
  await sleep(1000);
  const searched = listCalls().slice(before);
  check("search is debounced and sent to the server: one request with q=zara", searched.length === 1 && searched[0].query.q === "zara", JSON.stringify(searched.map((c) => c.query)));
  t = await text();
  check("…the owner-name match shows, the rest don't", t.includes("Pending Perfumes") && !t.includes("Bulk Brand 0"));
  await setValue("#ba-search", "nothing-matches-this"); await sleep(900);
  t = await text();
  check("no match → empty state with 'clear filters'", /no brands match/i.test(t) && /clear filters/i.test(t));
  await clickText("clear filters"); await sleep(900);
  await setValue("#ba-city", "Lahore", "HTMLSelectElement", "change"); await sleep(900);
  check("city filter sent to the server", listCalls().at(-1).query.city === "Lahore" && (await text()).includes("Crust Pizza"));
  await setValue("#ba-city", "all", "HTMLSelectElement", "change"); await sleep(600);
  await setValue("#ba-cat", "Home", "HTMLSelectElement", "change"); await sleep(900);
  check("category filter sent to the server", listCalls().at(-1).query.category === "Home" && (await text()).includes("Rejected Rugs"));
  await setValue("#ba-cat", "all", "HTMLSelectElement", "change"); await sleep(600);
  await setValue("#ba-from", "2026-10-01", "HTMLInputElement", "change"); await sleep(300);
  await setValue("#ba-from", "2026-10-01"); await sleep(900);
  check("joined-from date sent to the server", listCalls().at(-1).query.joinedFrom === "2026-10-01", JSON.stringify(listCalls().at(-1).query));
  await setValue("#ba-from", ""); await sleep(300);
  await setValue("#ba-sort", "name", "HTMLSelectElement", "change"); await sleep(900);
  check("sort sent to the server", listCalls().at(-1).query.sort === "name");
  await tab("pending"); await sleep(900);

  // drawer
  await ev(`[...document.querySelectorAll(".ba-link")].find((x) => x.innerText === "Pending Perfumes")?.click(); true`);
  await sleep(1200);
  t = await ev(`document.querySelector("[data-kit=drawer]")?.innerText || ""`);
  check("drawer: business details, contact, documents, branches, offers, history", ["business details", "contact", "documents", "branches (1)", "offers (1)", "history", "Zara Khan", "b1@example.com", "Clifton", "20% off", "blurry logo", "before the action log"].every((w) => t.toLowerCase().includes(w.toLowerCase())), t.slice(0, 400));
  await audit("brand approvals: drawer", "[data-kit=drawer]");

  // reject: reason required
  const writes = () => calls.filter((c) => c.method !== "GET").length;
  let w0 = writes();
  await clickText("reject", `document.querySelector("[data-kit=drawer]")`); await sleep(600);
  await audit("brand approvals: reject dialog", "[data-kit=modal]");
  await ev(`[...document.querySelectorAll("[data-kit=modal] .k-modal-foot button")].at(-1).click(); true`); await sleep(500);
  t = await ev(`document.querySelector("[data-kit=modal]")?.innerText || ""`);
  check("reject without a reason: the dialog says a reason is required and nothing is sent", /reason is required/i.test(t) && writes() === w0, t);
  await ev(`document.querySelector("#ba-reason").focus(); true`);
  await pg.s("Input.insertText", { text: "Logo is unreadable" });
  await ev(`[...document.querySelectorAll("[data-kit=modal] .k-modal-foot button")].at(-1).click(); true`); await sleep(1200);
  const rej = calls.filter((c) => c.method === "PUT").at(-1);
  check("reject with a reason: PUT /:id/status { rejected, reason }", rej && rej.body.status === "rejected" && rej.body.reason === "Logo is unreadable", JSON.stringify(rej));
  t = await ev(`document.querySelector("[data-kit=drawer]")?.innerText || ""`);
  check("…the drawer's history shows it with the admin and reason", /Rejected/.test(t) && /Ayesha Admin/.test(t) && /Logo is unreadable/.test(t), t.slice(-300));

  // request info
  w0 = writes();
  await clickText("request info", `document.querySelector("[data-kit=drawer]")`); await sleep(500);
  await ev(`[...document.querySelectorAll("[data-kit=modal] .k-modal-foot button")].at(-1).click(); true`); await sleep(400);
  check("request info without a reason: nothing sent", writes() === w0 && /reason is required/i.test(await ev(`document.querySelector("[data-kit=modal]")?.innerText || ""`)));
  await ev(`document.querySelector("#ba-reason").focus(); true`);
  await pg.s("Input.insertText", { text: "Please send your NTN" });
  await ev(`[...document.querySelectorAll("[data-kit=modal] .k-modal-foot button")].at(-1).click(); true`); await sleep(1000);
  const ri = calls.filter((c) => c.method === "POST").at(-1);
  check("request info with a reason: POST /:id/request-info", ri && /request-info$/.test(ri.path) && ri.body.reason === "Please send your NTN");
  await ev(`document.querySelector("[data-kit=drawer] button[aria-label=close]")?.click(); true`); await sleep(600);
  t = await text();
  check("the list updated in place: Pending Perfumes left the pending tab, pending count 4", !t.includes("Pending Perfumes") && /Pending\s*4/.test(t), t.slice(0, 200));

  // bulk
  await ev(`[...document.querySelectorAll("input[type=checkbox]")].filter((c) => /select Bulk Brand [01]$/.test(c.getAttribute("aria-label") || "")).forEach((c) => c.click()); true`); await sleep(400);
  t = await text();
  check("bulk bar: 2 selected", /2 selected/.test(t));
  await audit("brand approvals: with a selection");
  await clickText("approve selected"); await sleep(500);
  await ev(`document.querySelector("#ba-reason").focus(); true`);
  await pg.s("Input.insertText", { text: "Verified by phone" });
  await ev(`[...document.querySelectorAll("[data-kit=modal] .k-modal-foot button")].at(-1).click(); true`); await sleep(1200);
  const bulk = calls.filter((c) => c.path === "/api/brand-approval/bulk-status").at(-1);
  check("bulk approve: one request with the 2 ids and one reason", bulk && bulk.body.brandIds.length === 2 && bulk.body.status === "approved" && bulk.body.reason === "Verified by phone", JSON.stringify(bulk?.body));
  t = await text();
  check("…they left the pending tab (pending 2) and the selection cleared", /Pending\s*2/.test(t) && !/selected/.test(t));
  check("no page reload during any of it", await ev(`window.__noReload === 1`));
  failList = true;
  await clickText("refresh"); await sleep(1000);
  check("error state with 'try again'", /couldn't load brands/i.test(await text()) && /try again/i.test(await text()));
  failList = false;
  await clickText("try again"); await sleep(1000);
  check("…and 'try again' loads the list", !/couldn't load brands/i.test(await text()));

  // ======== metrics
  console.log("-- metrics");
  await menu("engagement_metrics"); await sleep(2000);
  t = await text();
  check("every group: students, brands, loyalty, surprise boxes, careers, engagement", ["students", "brands", "loyalty", "surprise boxes", "careers", "engagement"].every((g) => new RegExp(`\\n${g}\\n`, "i").test(`\n${t}\n`) || t.toLowerCase().includes(g)), t.slice(0, 200));
  check("metrics: sign-ups, verified, active 7/30, redemptions, revenue, members, orders, no-shows, hires, push opens", ["sign-ups", "verified", "active (7 days)", "active (30 days)", "redemptions", "revenue through tdc", "members", "no-shows", "hires", "push opens"].every((w) => t.toLowerCase().includes(w)));
  check("change vs previous period and 'as of now' for snapshots; Karachi time stated", /▲\s*\+20%/.test(t) && /as of now/.test(t) && /Karachi/.test(t), t.slice(0, 400));
  const tipCount = await ev(`document.querySelectorAll(".am-tip-btn").length`);
  check("an 'i' for every metric (24)", tipCount === 24, String(tipCount));
  await ev(`document.querySelector(".am-tip-btn[data-tip='sign-ups']").focus(); true`); await sleep(200);
  const tip = await ev(`(() => { const b = document.querySelector(".am-tip-btn[data-tip='sign-ups']"); const t = document.getElementById(b.getAttribute("aria-describedby")); return { shown: !t.hidden, text: t.innerText }; })()`);
  check("focusing the 'i' shows the server's definition", tip.shown && /student accounts created in the range \(Karachi days\)/.test(tip.text), JSON.stringify(tip));
  await pg.s("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await sleep(200);
  check("…Escape hides it", await ev(`document.getElementById(document.querySelector(".am-tip-btn[data-tip='sign-ups']").getAttribute("aria-describedby")).hidden`));
  await audit("metrics");
  const mCalls = () => calls.filter((c) => c.path === "/api/analytics/admin/metrics");
  await clickText("7 days"); await sleep(1000);
  check("7 days → preset=7d sent", mCalls().at(-1).query.preset === "7d");
  await clickText("this month"); await sleep(1000);
  check("this month → preset=month", mCalls().at(-1).query.preset === "month");
  await clickText("custom"); await sleep(600);
  await setValue("#am-from", "2026-10-01", "HTMLInputElement", "change"); await setValue("#am-from", "2026-10-01");
  await setValue("#am-to", "2026-10-07", "HTMLInputElement", "change"); await setValue("#am-to", "2026-10-07");
  await sleep(200);
  await clickText("apply"); await sleep(1000);
  const c = mCalls().at(-1).query;
  check("custom → from / to sent", c.preset === "custom" && c.from === "2026-10-01" && c.to === "2026-10-07", JSON.stringify(c));
  await audit("metrics: custom range");
  await ev(`window.__csv = 0; const o = URL.createObjectURL; URL.createObjectURL = (b) => { window.__csv++; return o(b); }; true`);
  await ev(`document.querySelector("[data-group=careers] button[aria-label='export careers as csv']").click(); true`); await sleep(300);
  check("CSV per section", await ev(`window.__csv === 1`));
  failMetrics = true;
  await clickText("today"); await sleep(1000);
  t = await text();
  check("error state: 'couldn't load the metrics' and 'try again'", /couldn't load the metrics/i.test(t) && /try again/i.test(t));
  failMetrics = false;
  await clickText("try again"); await sleep(1000);
  check("…'try again' loads them", !/couldn't load the metrics/i.test(await text()));
  await clickText("engagement details"); await sleep(1500);
  check("the earlier engagement page is a tab", (await ev(`document.querySelectorAll("[role=tab][aria-selected=true]")[0]?.innerText || ""`)).includes("engagement details"));

  // ======== overview
  console.log("-- overview");
  await menu("business_overview"); await sleep(2000);
  t = await text();
  check("KPI cards: new students, verified students, active brands, redemptions, revenue, applications", ["new students", "verified students", "active brands", "redemptions", "revenue through tdc", "applications"].every((w) => t.toLowerCase().includes(w)));
  check("…with the change vs previous period", /▲\s*\+20%/.test(t) && /▼\s*-20%/.test(t), t.slice(0, 500));
  const needs = await ev(`[...document.querySelectorAll(".am-need")].map((li) => li.innerText.replace(/\\s+/g, " ").trim())`);
  check("needs your action: brand approvals 3, student verifications 2, company verifications 2, hire disputes not set up, ratings reports 0, failed pushes 4", /brand approvals 3/.test(needs[0]) && /student verifications 2/.test(needs[1]) && /company verifications 2/.test(needs[2]) && /hire disputes – not set up/.test(needs[3]) && /ratings reports 0/.test(needs[4]) && /failed pushes \(7 days\) 4/.test(needs[5]), JSON.stringify(needs));
  check("charts: sign-ups, redemptions, top 5 brands, top 5 universities, hiring funnel (each with a table)", ["sign-ups", "redemptions", "top 5 brands by redemptions", "top 5 universities by active students", "hiring funnel"].every((w) => t.toLowerCase().includes(w)) && (await ev(`document.querySelectorAll(".am-chart-table").length`)) >= 5 && (await ev(`document.querySelectorAll(".am-chart [role=img][aria-label]").length`)) >= 5);
  check("quick actions: new offer, approve brands, send push test", ["new offer", "approve brands", "send push test"].every((w) => t.toLowerCase().includes(w)));
  await audit("overview");
  await ev(`document.querySelector("button[aria-label='open brand approvals']").click(); true`); await sleep(1500);
  check("'open' on brand approvals goes to that page", await ev(`!!document.querySelector("[data-screen=brand-approvals]")`));
  await menu("business_overview"); await sleep(1500);
  await ev(`document.querySelector("button[aria-label='open student verifications']").click(); true`); await sleep(1500);
  check("'open' on student verifications goes to that page", await ev(`document.querySelector('.tdcp-nav [aria-current="page"]')?.dataset.page === "student_verifications"`));
  await menu("business_overview"); await sleep(1500);
  await clickText("send push test"); await sleep(1500);
  check("quick action 'send push test' opens push test", await ev(`document.querySelector('.tdcp-nav [aria-current="page"]')?.dataset.page === "engagement_test_push"`));

  // phone width
  console.log("-- phone width");
  await viewport(pg, 390, 844, true, 2);
  for (const [label, item] of [["overview", "business_overview"], ["metrics", "engagement_metrics"], ["brand approvals", "brand_approval"]]) {
    await ev(`document.querySelector('[aria-label="open menu"]')?.click(); true`); await sleep(400);
    await menu(item); await sleep(1500);
    const over = await ev(`document.documentElement.scrollWidth - window.innerWidth`);
    check(`${label} on a phone: no horizontal page scroll`, over <= 1, `${over}px`);
    await audit(`${label} (phone)`);
  }

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  console.log(`\nA11Y_TOTAL=${axeTotal}`);
  b.close();
  process.exit(bad || axeTotal ? 1 : 0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
