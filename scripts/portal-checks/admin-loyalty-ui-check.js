// node --experimental-websocket admin-loyalty-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Admin "loyalty programs" (every brand's program) against a stateful mock of /api/loyalty/admin/programs:
// - menu item under "oversight" only when the admin routes answer; list with pilot state, status filter
//   (sent to the server) and brand search;
// - the drawer: rules, numbers, history; pause / end / restart / edit each need a reason (5+ characters)
//   before the button enables, and send the version + reason (+ the status or fields);
// - an edit with the end before the start can't be saved; create for a brand: only brands without a program
//   are offered, a reason is required, the body never carries a status (always a draft).
// axe-core WCAG 2 A / AA on the page, the drawer and the dialogs. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const BA = "6af0000000000000000000a1", BB = "6af0000000000000000000b1", BC = "6af0000000000000000000c1";
const PA = "6af1000000000000000000a1", PB = "6af1000000000000000000b1";
const tiers = [{ name: "Member", minVisit: 1, maxVisit: 5, discountPct: 15 }, { name: "Regular", minVisit: 6, maxVisit: null, discountPct: 25 }];
const programs = {
  [PA]: { id: PA, brand: BA, brandName: "Alpha Cafe", status: "active", version: 3, tiers, maxDiscountPct: 25, brandMaxDiscountPct: 25, adminMaxDiscountPct: null, maxVisitsPerDay: 1, resetMonths: 12, terms: "dine-in only", startsAt: null, endsAt: null, inPilot: true, updatedAt: "2026-11-09T10:00:00Z" },
  [PB]: { id: PB, brand: BB, brandName: "Beta Books", status: "draft", version: 1, tiers, maxDiscountPct: 25, brandMaxDiscountPct: 25, adminMaxDiscountPct: 20, maxVisitsPerDay: 1, resetMonths: 12, terms: "", startsAt: null, endsAt: null, inPilot: false, updatedAt: "2026-11-08T10:00:00Z" },
};
const writes = [];
const lists = [];
let available = true;
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  let raw = "";
  q.on("data", (d) => { raw += d; });
  q.on("end", () => {
    const u = new URL(q.url, "http://x");
    const k = `${q.method} ${u.pathname}`;
    const body = raw ? JSON.parse(raw) : null;
    let status = 200, out;
    const one = /^(GET|PATCH) \/api\/loyalty\/admin\/programs\/(\w+)$/.exec(k);
    const rs = /^POST \/api\/loyalty\/admin\/programs\/(\w+)\/restart$/.exec(k);
    if (k.startsWith("GET /api/loyalty/admin/programs") && !available) { status = 404; out = { success: false, error: { code: "NOT_FOUND" } }; }
    else if (k === "GET /api/loyalty/admin/programs") { lists.push(Object.fromEntries(u.searchParams)); const st = u.searchParams.get("status"); out = ok({ programs: Object.values(programs).filter((p) => !st || p.status === st) }); }
    else if (one && one[1] === "GET") { const p = programs[one[2]]; out = ok({ program: p, history: [{ version: p.version - 1, status: "draft", changedAt: "2026-11-01T10:00:00Z", restarted: false }].filter((x) => x.version > 0), restarts: [], numbers: { verifiedVisits: 42, members: 17, repeatCustomers: 9, reversals: 1, tierCounts: {} } }); }
    else if (one && one[1] === "PATCH") { writes.push({ k: "PATCH", id: one[2], body }); const p = programs[one[2]]; const { reason, version, ...rest } = body; Object.assign(p, rest, { version: p.version + 1 }); out = ok(p); }
    else if (rs) { writes.push({ k: "RESTART", id: rs[1], body }); const p = programs[rs[1]]; Object.assign(p, { status: "draft", startsAt: null, endsAt: null, version: p.version + 1 }); out = ok(p); }
    else if (k === "POST /api/loyalty/admin/programs") { writes.push({ k: "CREATE", body }); const id = "6af1000000000000000000c1"; programs[id] = { ...programs[PB], id, brand: body.brandId, brandName: "Gamma Grill", status: "draft", version: 1, adminMaxDiscountPct: body.adminMaxDiscountPct ?? null, inPilot: true }; status = 201; out = ok(programs[id]); }
    else if (k === "GET /api/admin/users/brand") out = [{ _id: BA, brandName: "Alpha Cafe" }, { _id: BB, brandName: "Beta Books" }, { _id: BC, brandName: "Gamma Grill" }];
    else out = q.method === "GET" ? [] : { success: true };
    s.writeHead(status, h);
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
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");

(async () => {
  const b = await launch(9356);
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
  const DLG = `[...document.querySelectorAll("[role=dialog]")].pop()`;
  const text = () => pg.evaluate(`(document.querySelector("[data-screen=admin-loyalty-programs]") || document.getElementById("root"))?.innerText || ""`);
  const dlg = () => pg.evaluate(`(${DLG})?.innerText || ""`);
  const click = (label, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button, a, [role=radio]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)} && !x.disabled); if (e) e.click(); return !!e; })()`);
  const btn = (label) => pg.evaluate(`(() => { const e = [...(${DLG}).querySelectorAll("button")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)}); return e ? { found: true, disabled: e.disabled } : { found: false }; })()`);
  const type = (id, v) => pg.evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const axe = async (scope, label) => {
    await pg.evaluate(AXE + "; true");
    const v = await pg.evaluate(`(async () => { const r = await axe.run(${scope}, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.length ? JSON.stringify(v) : "no violations");
  };
  const last = () => writes[writes.length - 1] || {};

  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  check("menu: 'loyalty programs' under oversight", await click("loyalty programs"));
  await sleep(1500);
  let t = await text();
  check("list: both brands, status, tiers, pilot state", ["Alpha Cafe", "Beta Books", "active", "draft", "visits 1–5: 15%", "in pilot", "not in pilot", "tdc cap 20%"].every((w) => t.includes(w)), t.replace(/\n/g, " | ").slice(0, 300));
  await axe(`document.querySelector("main") || document`, "programs list");
  await click("draft");
  await sleep(800);
  check("status filter goes to the server", lists[lists.length - 1]?.status === "draft" && !(await text()).includes("Alpha Cafe"));
  await click("all");
  await sleep(800);
  await pg.evaluate(`(() => { const el = document.querySelector('input[aria-label="search brand"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, "beta"); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await sleep(400);
  t = await text();
  check("brand search filters the list", t.includes("Beta Books") && !t.includes("Alpha Cafe"));
  await pg.evaluate(`(() => { const el = document.querySelector('input[aria-label="search brand"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ""); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await sleep(300);

  // the drawer: pause with a reason
  await pg.evaluate(`document.querySelector('[aria-label="open Alpha Cafe\\'s program"]').click(); true`);
  await sleep(1200);
  let d = await dlg();
  check("drawer: rules, numbers, history", ["Alpha Cafe: loyalty", "verified visits", "42", "dine-in only", "history", "v2: draft"].every((w) => d.includes(w)), d.replace(/\n/g, " | ").slice(0, 300));
  await axe(DLG, "program drawer");
  await click("pause", DLG);
  await sleep(500);
  check("pause asks for a reason first (disabled)", (await btn("pause")).disabled === true && (await dlg()).includes("pause this program?"));
  await type("alp-reason", "ok");
  await sleep(200);
  check("…4 characters: still disabled", (await btn("pause")).disabled === true);
  await type("alp-reason", "complaint under review");
  await sleep(200);
  await axe(DLG, "reason dialog");
  await click("pause", DLG);
  await sleep(1200);
  check("pause: PATCH with status, version and reason", last().k === "PATCH" && last().body.status === "paused" && last().body.version === 3 && last().body.reason === "complaint under review", JSON.stringify(last()));
  // edit: end before start can't be saved
  await click("edit", DLG);
  await sleep(500);
  await type("alp-terms", "takeaway too");
  await type("alp-cap", "20");
  await type("alp-start", "2026-12-10");
  await type("alp-end", "2026-12-01");
  await type("alp-reason", "brand asked by email");
  await sleep(300);
  check("edit: end before start → error, save disabled", (await dlg()).includes("the end must be on or after the start") && (await btn("save")).disabled === true);
  await type("alp-end", "2026-12-31");
  await sleep(300);
  await click("save", DLG);
  await sleep(1200);
  const e1 = last().body || {};
  check("edit: PATCH terms, cap, Karachi day bounds, version, reason", last().k === "PATCH" && e1.terms === "takeaway too" && e1.adminMaxDiscountPct === 20 && e1.startsAt === "2026-12-09T19:00:00.000Z" && e1.endsAt === "2026-12-31T18:59:59.999Z" && e1.version === 4 && e1.reason === "brand asked by email", JSON.stringify(e1));
  // end, then restart
  await click("end", DLG);
  await sleep(500);
  check("end explains it's final for this version", (await dlg()).includes("ending is final for this version"));
  await type("alp-reason", "brand left the pilot");
  await click("end program", DLG);
  await sleep(1200);
  check("end: PATCH status ended", last().body?.status === "ended" && last().body.version === 5);
  check("ended: only 'restart as a new draft' offered", (await btn("restart as a new draft")).found && !(await btn("pause")).found && !(await btn("edit")).found);
  await click("restart as a new draft", DLG);
  await sleep(500);
  await type("alp-reason", "brand rejoined the pilot");
  await click("restart", DLG);
  await sleep(1200);
  check("restart: POST /restart with version and reason only", last().k === "RESTART" && JSON.stringify(last().body) === JSON.stringify({ version: 6, reason: "brand rejoined the pilot" }), JSON.stringify(last()));
  await pg.evaluate(`[...document.querySelectorAll("[role=dialog] button")].find((x) => (x.getAttribute("aria-label") || "") === "close")?.click(); true`);
  await sleep(600);

  // create for a brand
  await click("create for a brand");
  await sleep(1200);
  const opts = await pg.evaluate(`[...document.querySelectorAll("#alc-brand option")].map((o) => o.textContent)`);
  check("create: only brands without a program are offered", JSON.stringify(opts) === JSON.stringify(["choose a brand", "Gamma Grill"]), JSON.stringify(opts));
  await axe(DLG, "create dialog");
  await type("alc-brand", BC);
  await sleep(200);
  check("…a reason is required", (await btn("create draft")).disabled === true);
  await type("alc-cap", "20");
  await type("alc-reason", "brand signed up by phone");
  await sleep(200);
  await click("create draft", DLG);
  await sleep(1500);
  const c = last().body || {};
  check("create: POST brand, reason, rules; never a status", last().k === "CREATE" && c.brandId === BC && c.reason === "brand signed up by phone" && c.adminMaxDiscountPct === 20 && c.maxDiscountPct === 25 && !("status" in c), JSON.stringify(c));
  check("…then the new draft opens", (await dlg()).includes("Gamma Grill: loyalty"));

  // routes missing on the server: no menu item
  available = false;
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  check("admin routes missing: no 'loyalty programs' item", !(await pg.evaluate(`[...document.querySelectorAll("button, a")].some((x) => /^loyalty programs$/i.test(x.innerText.trim()))`)));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
