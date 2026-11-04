// node --experimental-websocket a11y-surplus.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Accessibility of the Surprise Box (brand pages, admin cases / orders / no-shows / brands):
// axe-core (from the portal's node_modules) is injected into each page and
// run with the WCAG 2 A and AA rules on the page content (main) and on open dialogs, against the same mock API
// as surplus-ui-check.js. Prints every violation; exits 1 if there is any.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5194, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const A = "6ae9aaaaaaaaaaaaaaaaaaaa", BR = "6ae9b1b1b1b1b1b1b1b1b1b1", O1 = "6ae9c1c1c1c1c1c1c1c1c1c1";
const now = Date.now();
let flagOn = true;
const order = (id, ref, state, extra = {}) => ({ id, ref, state, qty: 1, total: 450, currency: "PKR", paymentState: "unpaid", student: { firstName: "Sana" }, title: "Evening bakery box", listingId: "l1", branchId: BR, branchName: "Alpha Clifton", pickupStart: new Date(now + 3600e3).toISOString(), pickupEnd: new Date(now + 7200e3).toISOString(), version: 2, next: { ORDER_PLACED: ["CONFIRMED", "MERCHANT_CANCELLED"], READY_FOR_PICKUP: ["MERCHANT_CANCELLED"] }[state] || [], history: [], ...extra });
const listing = { id: "l1", title: "Evening bakery box", brand: { id: A, name: "Alpha" }, branch: { id: BR, name: "Alpha Clifton", city: "Karachi", address: "" }, price: 450, listPrice: 1200, currency: "PKR", quantityLeft: 3, quantityTotal: 5, pickupStart: new Date(now + 3600e3).toISOString(), pickupEnd: new Date(now + 7200e3).toISOString(), orderCutoff: new Date(now + 5400e3).toISOString(), contentsMayVary: true, allergens: ["gluten"], dietary: [], status: "published", version: 3, orders: 2, disclosures: { allergenNotes: "contains gluten and dairy", description: "breads" } };
const routesNow = () => ({
  "GET /api/app/flags/me": { metaEvents: false, loyaltyV2: false, careerTimeline: false, surplusBoxes: flagOn },
  "GET /api/branches/my-branches": { branches: [{ _id: BR, name: "Alpha Clifton", city: "Karachi", isActive: true }] },
  "GET /api/surplus/merchant/summary": ok({ orders: 3, boxesOrdered: 4, toCollectAtPickup: 1350, collectedAtPickup: 450, noShows: 1, boxesLeft: 3, byState: {} }),
  "GET /api/surplus/merchant/orders": ok([order(O1, "SB-NEW111", "ORDER_PLACED"), order("6ae9c2c2c2c2c2c2c2c2c2c2", "SB-RDY222", "READY_FOR_PICKUP")]),
  "GET /api/surplus/merchant/listings": ok({ listings: [listing], blocked: false }),
  "POST /api/surplus/merchant/verify-pickup": ok(order(O1, "SB-NEW111", "PICKUP_VERIFIED", { version: 5 })),
  [`POST /api/surplus/merchant/orders/${O1}/transition`]: ok(order(O1, "SB-NEW111", "COMPLETED", { paymentState: "paid_at_pickup" })),
  "GET /api/surplus/admin/cases": ok([{ id: "c1", orderId: O1, reason: "food_safety", description: "mouldy bread", evidence: [], status: "open", decision: null, createdAt: new Date().toISOString(), student: { id: "s", name: "Sana Khan" }, brand: { id: A, name: "Alpha" }, order: { ref: "SB-NEW111", stateBefore: "COMPLETED", title: "Evening bakery box", history: [] } }]),
  "GET /api/surplus/admin/brands": ok([{ id: A, name: "Alpha", listings: 2, upheldCases: 1, studentNoShows: 1, blocked: false, reason: "" }]),
  "GET /api/surplus/admin/no-shows": ok({ note: "Recorded only; nobody is banned automatically.", students: [{ studentId: "s", name: "Sana Khan", count: 2, last: new Date().toISOString(), refs: ["SB-X", "SB-Y"] }] }),
  "GET /api/surplus/admin/orders": ok([]),
});
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(k);
  if (k.startsWith("GET /api/surplus/admin") && !flagOn) { s.writeHead(404, h); return s.end(JSON.stringify({ success: false, error: { code: "SURPLUS_OFF" } })); }
  s.writeHead(200, h);
  const b = routesNow()[k];
  s.end(JSON.stringify(b !== undefined ? b : q.method === "GET" ? [] : { success: true }));
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(s);
}).listen(WEB);

(async () => {
  const b = await launch(9401);
  let bad = 0;
  const open = async (who, p) => {
    const pg = await b.page();
    pg.errs = [];
    await pg.s("Log.enable");
    pg.on((m) => {
      if (m.method === "Runtime.exceptionThrown") pg.errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") pg.errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error") pg.errs.push("log: " + m.params.entry.text.slice(0, 160));
    });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    await sleep(3500);
    return pg;
  };
  const text = (pg) => pg.evaluate(`document.body.innerText || ""`);
  const expect = (label, t, want) => {
    const miss = want.filter((w) => !t.toLowerCase().includes(w.toLowerCase()));
    if (miss.length) bad = 1;
    console.log(`${label}: ${miss.length ? "MISSING " + miss.join(" | ") : "all expected text present"}`);
  };

  const AXE = require("fs").readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  const findings = [];
  const audit = async (pg, label, scope = "main") => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    findings.push({ label, v });
    console.log(`${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };
  const clickText = (p, txt) => p.evaluate(`[...document.querySelectorAll("button, a, [role=tab]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(txt)})?.click(); true`);
  const clickMatch = (p, re) => p.evaluate(`[...document.querySelectorAll("button, a, [role=tab]")].find((x) => ${re}.test(x.innerText))?.click(); true`);

  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  const page = process.env.A11Y_SET || "surplus";
  if (page === "surplus") {
    const brand = { _id: A, id: A, role: "brand", name: "Alpha", brandName: "Alpha", brandApprovalStatus: "approved" };
    const pg = await open(brand, "/surprise-boxes");
    await audit(pg, "brand surprise boxes: today");
    await clickText(pg, "cancel"); await sleep(500); await audit(pg, "brand surprise boxes: cancel dialog", "[role=dialog]"); await clickText(pg, "keep it"); await sleep(300);
    await clickMatch(pg, /^listings/); await sleep(1000); await audit(pg, "brand surprise boxes: listings");
    await clickText(pg, "new surprise box"); await sleep(600); await audit(pg, "brand surprise boxes: listing form", "[role=dialog]"); await pg.evaluate(`document.querySelector("[role=dialog] button[aria-label=close]")?.click(); true`); await sleep(300);
    await clickMatch(pg, /verify pickup/); await sleep(800); await audit(pg, "brand surprise boxes: verify pickup");
    const adm = await open(admin, "/admin");
    await clickMatch(adm, /surprise boxes/i); await sleep(2000); await audit(adm, "admin surprise boxes: cases");
    for (const t of ["orders", "no-shows", "brands"]) { await clickText(adm, t); await sleep(800); await audit(adm, `admin surprise boxes: ${t}`); }
    await audit(adm, "admin shell (existing)", "aside");
  }
  if (page === "fhf") {
    const emp = { _id: E, id: E, role: "employee", name: "Hina", companyName: "Bright Labs" };
    let pg = await open(emp, "/employee-dashboard");
    await audit(pg, "employer dashboard (free-hire card)", "[data-card=first-hire-free]");
    pg = await open(emp, "/first-hire-free");
    await audit(pg, "employer first hire free page");
    const adm = await open(admin, "/admin");
    await clickMatch(adm, /company verifications/i); await sleep(2000); await audit(adm, "admin company verifications");
    await clickText(adm, "approve"); await sleep(500); await audit(adm, "admin verification decision dialog", "[role=dialog]"); await clickText(adm, "cancel"); await sleep(300);
    await clickMatch(adm, /free-hire trials/i); await sleep(2000); await audit(adm, "admin free-hire trials");
    await clickMatch(adm, /billing ledger/); await sleep(1000); await audit(adm, "admin billing ledger");
  }
  if (page === "analytics") {
    const adm = await open(admin, "/admin");
    await adm.evaluate(`[...document.querySelectorAll("button, a")].find((e) => e.innerText.trim().toLowerCase() === "overview")?.click(); true`); await sleep(2000);
    await audit(adm, "admin overview");
    const brand = { _id: A, id: A, role: "brand", name: "Tiny", brandName: "Tiny Shop", brandApprovalStatus: "approved" };
    await audit(await open(brand, "/insights"), "brand insights");
    const emp = { _id: E, id: E, role: "employee", name: "Hina", companyName: "Bright Labs" };
    await audit(await open(emp, "/hiring-results"), "employer hiring results");
  }
  if (page === "career") {
    const emp = { _id: E, id: E, role: "employee", name: "Hire Co", companyName: "Hire Co" };
    const pg = await open(emp, "/candidate");
    await audit(pg, "employer candidate pipeline");
    await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => /Taha Ali/.test(x.innerText))?.click(); true`); await sleep(1500);
    await audit(pg, "candidate drawer (timeline, sent resume)", "[role=dialog]");
    await clickText(pg, "schedule interview"); await sleep(800); await audit(pg, "schedule interview dialog", "[role=dialog]:last-of-type");
    const adm = await open(admin, "/admin");
    await clickMatch(adm, /hiring funnel/i); await sleep(2000); await audit(adm, "admin hiring funnel");
  }
  if (page === "loyalty") {
    const brand = { _id: A, id: A, role: "brand", name: "Alpha", brandName: "Alpha", brandApprovalStatus: "approved" };
    await audit(await open(brand, "/loyalty"), "brand loyalty");
    const adm = await open(admin, "/admin");
    await clickMatch(adm, /loyalty exceptions/i); await sleep(2000); await audit(adm, "admin loyalty exceptions");
  }

  const total = findings.reduce((n, f) => n + f.v.length, 0);
  console.log(`\nA11Y_TOTAL=${total}`);
  b.close();
  process.exit(total ? 1 : 0);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
