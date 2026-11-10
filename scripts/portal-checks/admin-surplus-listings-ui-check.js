// node --experimental-websocket admin-surplus-listings-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Admin > surprise boxes > listings (every brand's boxes) against a stateful mock of /api/surplus/admin/listings:
// - the tab lists boxes with brand, status, pickup, boxes and open orders; filters go to the server;
// - the drawer: orders; edit of an ordered box only changes the number of boxes (food details locked);
//   publish / pause / close / edit / cancel need a reason (5+ characters) before the button enables;
// - cancel box: says how many open orders are cancelled and which handed-over ones stay; shows the result.
// axe-core WCAG 2 A / AA on the tab, the drawer and the dialogs. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const now = Date.now();
const iso = (h) => new Date(now + h * 3600e3).toISOString();
const L1 = "6af2000000000000000000a1", L2 = "6af2000000000000000000b1";
const base = (id, title, brand, status, extra = {}) => ({ id, title, brand: { id: `b-${brand}`, name: brand }, branch: { id: "br", name: `${brand} Clifton`, city: "Karachi" }, price: 450, listPrice: 1200, currency: "PKR", quantityLeft: 2, quantityTotal: 5, pickupStart: iso(3), pickupEnd: iso(4), status, version: 4, orders: 0, openOrders: 0, disclosures: { allergenNotes: "contains gluten" }, ...extra });
const listings = { [L1]: base(L1, "Evening bakery box", "Alpha Bakery", "published", { orders: 2, openOrders: 2 }), [L2]: base(L2, "Lunch rice box", "Beta Cafe", "paused") };
const orders = { [L1]: [
  { id: "o1", ref: "SB-OPEN11", state: "CONFIRMED", qty: 1, student: { firstName: "Sana" }, next: ["PREPARING", "READY_FOR_PICKUP", "MERCHANT_CANCELLED"], cancelReason: "" },
  { id: "o2", ref: "SB-HAND22", state: "PICKUP_VERIFIED", qty: 1, student: { firstName: "Ali" }, next: ["COMPLETED"], cancelReason: "" },
], [L2]: [] };
const writes = [], lists = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  let raw = "";
  q.on("data", (d) => { raw += d; });
  q.on("end", () => {
    const u = new URL(q.url, "http://x");
    const k = `${q.method} ${u.pathname}`;
    const body = raw ? JSON.parse(raw) : null;
    let out;
    const one = /^(GET|PATCH) \/api\/surplus\/admin\/listings\/(\w+)$/.exec(k);
    const cx = /^POST \/api\/surplus\/admin\/listings\/(\w+)\/cancel$/.exec(k);
    if (k === "GET /api/app/flags/me") out = { surplusBoxes: true };
    else if (k === "GET /api/surplus/admin/cases" || k === "GET /api/surplus/admin/brands" || k === "GET /api/surplus/admin/orders") out = ok([]);
    else if (k === "GET /api/surplus/admin/no-shows") out = ok({ note: "", students: [] });
    else if (k === "GET /api/surplus/admin/listings") { lists.push(Object.fromEntries(u.searchParams)); const st = u.searchParams.get("status"); out = ok({ listings: Object.values(listings).filter((l) => !st || l.status === st) }); }
    else if (one && one[1] === "GET") out = ok({ listing: listings[one[2]], orders: orders[one[2]] });
    else if (one && one[1] === "PATCH") { writes.push({ k: "PATCH", id: one[2], body }); const { reason, version, ...rest } = body; Object.assign(listings[one[2]], rest, { version: listings[one[2]].version + 1 }); out = ok(listings[one[2]]); }
    else if (cx) { writes.push({ k: "CANCEL", id: cx[1], body }); listings[cx[1]].status = "closed"; orders[cx[1]][0] = { ...orders[cx[1]][0], state: "MERCHANT_CANCELLED", next: [], cancelReason: body.reason }; out = ok({ listingId: cx[1], closed: true, cancelled: ["SB-OPEN11"], stayed: ["SB-HAND22"], failed: [] }); }
    else out = q.method === "GET" ? [] : { success: true };
    s.writeHead(200, h);
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
  const b = await launch(9357);
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
  const tab = () => pg.evaluate(`document.querySelector("[data-screen=admin-surplus-listings]")?.innerText || ""`);
  const dlg = () => pg.evaluate(`(${DLG})?.innerText || ""`);
  const click = (label, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button, a, [role=tab]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)} && !x.disabled); if (e) e.click(); return !!e; })()`);
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
  check("admin menu: surprise boxes", await click("surprise boxes"));
  await sleep(1500);
  check("a 'listings' tab", await click("listings"));
  await sleep(1500);
  let t = await tab();
  check("every brand's boxes: brand, status, boxes, open orders", ["Evening bakery box", "Alpha Bakery", "Lunch rice box", "Beta Cafe", "published", "paused", "2 left of 5", "2 open · 2 total"].every((w) => t.includes(w)), t.replace(/\n/g, " | ").slice(0, 300));
  await axe(`document.querySelector("main") || document`, "listings tab");
  await pg.evaluate(`(() => { const el = document.querySelector('select[aria-label="status"]'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, "paused"); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  await click("filter");
  await sleep(1000);
  check("status filter goes to the server", lists[lists.length - 1]?.status === "paused" && !(await tab()).includes("Evening bakery box"));
  await pg.evaluate(`(() => { const el = document.querySelector('select[aria-label="status"]'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(el, ""); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  await click("filter");
  await sleep(1000);

  // the ordered box: edit only the quantity; cancel the box
  await pg.evaluate(`document.querySelector('[aria-label="open Evening bakery box (Alpha Bakery)"]').click(); true`);
  await sleep(1200);
  let d = await dlg();
  check("drawer: facts and orders", ["Evening bakery box", "Alpha Bakery", "SB-OPEN11", "SB-HAND22", "contains gluten"].every((w) => d.includes(w)), d.replace(/\n/g, " | ").slice(0, 200));
  await axe(DLG, "listing drawer");
  await click("edit", DLG);
  await sleep(500);
  check("edit of an ordered box: title and allergens locked, only boxes editable", (await pg.evaluate(`document.getElementById("asl-title").disabled && document.getElementById("asl-allergens").disabled && !document.getElementById("asl-qty").disabled`)) === true && (await dlg()).includes("only the number of boxes can change"));
  await type("asl-qty", "8");
  check("…save needs a reason", (await btn("save")).disabled === true);
  await type("asl-reason", "brand baked more");
  await sleep(200);
  await click("save", DLG);
  await sleep(1200);
  check("edit: PATCH quantity, version, reason; no food details", last().k === "PATCH" && last().body.quantityTotal === 8 && last().body.version === 4 && last().body.reason === "brand baked more" && !("title" in last().body) && !("allergenNotes" in last().body), JSON.stringify(last()));
  await click("cancel box", DLG);
  await sleep(500);
  d = await dlg();
  check("cancel box explains: 1 open order cancelled, 1 handed-over stays", d.includes("1 open order is cancelled") && d.includes("1 handed-over order stays"), d.replace(/\n/g, " | ").slice(0, 300));
  check("…needs a reason", (await btn("close and cancel orders")).disabled === true);
  await type("asl-reason", "the oven broke down");
  await sleep(200);
  await axe(DLG, "cancel box dialog");
  await click("close and cancel orders", DLG);
  await sleep(1200);
  check("cancel: POST with the version and reason", last().k === "CANCEL" && JSON.stringify(last().body) === JSON.stringify({ version: 5, reason: "the oven broke down" }), JSON.stringify(last()));
  d = await dlg();
  check("…result: 1 cancelled (SB-OPEN11), handed over SB-HAND22 not cancelled", d.includes("order cancelled (SB-OPEN11); the box is closed.") && d.includes("handed over, not cancelled: SB-HAND22"), d.replace(/\n/g, " | ").slice(0, 200));
  await click("done", DLG);
  await sleep(500);
  await pg.evaluate(`[...document.querySelectorAll("[role=dialog] button")].find((x) => (x.getAttribute("aria-label") || "") === "close")?.click(); true`);
  await sleep(600);

  // the paused box: publish with a reason
  await pg.evaluate(`document.querySelector('[aria-label="open Lunch rice box (Beta Cafe)"]').click(); true`);
  await sleep(1200);
  await click("publish", DLG);
  await sleep(500);
  await type("asl-reason", "complaint resolved");
  await sleep(200);
  await click("publish", DLG);
  await sleep(1200);
  check("publish: PATCH status published with version and reason", last().k === "PATCH" && last().id === L2 && last().body.status === "published" && last().body.reason === "complaint resolved", JSON.stringify(last()));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
