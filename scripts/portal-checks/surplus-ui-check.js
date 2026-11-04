// node --experimental-websocket surplus-ui-check.js <buildDir>
// Surprise Box portal screens against a mock /api/surplus: brand menu + pages, admin operations, flag off.
// Portal build (REACT_APP_API_URL=http://127.0.0.1:5197) against a mock /api/career; signs in through
// localStorage; checks the employer pipeline, the candidate drawer and the admin hiring funnel render,
// with no page or console errors.
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
  const b = await launch(9363);
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

  const brand = { _id: A, id: A, role: "brand", name: "Alpha", brandName: "Alpha", brandApprovalStatus: "approved" };
  let pg = await open(brand, "/surprise-boxes");
  const nav = async (p) => p.evaluate(`[...document.querySelectorAll("aside a, aside button")].map((a) => a.innerText.trim().toLowerCase()).join("|")`);
  const menu = await nav(pg);
  if (!/surprise boxes/.test(menu)) bad = 1;
  console.log(`brand menu: ${/surprise boxes/.test(menu) ? "has 'surprise boxes'" : "MISSING surprise boxes: " + menu}`);
  expect("today + live board", await text(pg), ["surprise boxes", "orders today", "to collect at pickup", "no-shows", "SB-NEW111", "SB-RDY222", "collect PKR 450 at pickup", "confirm", "cancel", "ready for pickup"]);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "cancel")?.click(); true`);
  await sleep(500);
  expect("brand cancel needs a reason", await text(pg), ["cancel order SB-NEW111?", "reason (the student sees it)"]);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "keep it")?.click(); true`);
  await sleep(300);
  await pg.evaluate(`[...document.querySelectorAll("[role=tab]")].find((x) => /listings/.test(x.innerText))?.click(); true`);
  await sleep(1200);
  expect("listings", await text(pg), ["Evening bakery box", "3 left of 5", "PKR 450", "usually PKR 1,200", "contains gluten and dairy", "pause", "new surprise box"]);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "new surprise box")?.click(); true`);
  await sleep(600);
  expect("new listing form: the food disclosures", await text(pg), ["branch (pickup place)", "contents may vary", "allergens", "allergen notes (required)", "best before", "pickup from (Karachi)", "pickup until (Karachi)", "price at pickup (PKR)", "until 30 minutes before pickup starts", "publish now"]);
  await pg.evaluate(`[...document.querySelectorAll(".k-modal button, [role=dialog] button")].find((x) => x.innerText.trim() === "cancel")?.click(); true`);
  await sleep(400);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "edit")?.click(); true`);
  await sleep(600);
  const locked = await pg.evaluate(`!!document.querySelector("#sb-allergen-notes")?.disabled && !!document.querySelector("#sb-qty") && !document.querySelector("#sb-qty").disabled`);
  if (!locked) bad = 1;
  console.log(`edit after orders: ${locked ? "disclosures locked, quantity editable" : "NOT LOCKED"}`);
  await pg.evaluate(`[...document.querySelectorAll(".k-modal button, [role=dialog] button")].find((x) => x.innerText.trim() === "cancel")?.click(); true`);
  await sleep(400);
  await pg.evaluate(`[...document.querySelectorAll("[role=tab]")].find((x) => /verify pickup/.test(x.innerText))?.click(); true`);
  await sleep(800);
  expect("verify pickup", await text(pg), ["verify a pickup", "branch you're at", "pickup code", "verify code", "scan QR"]);
  await pg.evaluate(`(() => { const i = document.querySelector("#sb-code"); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "K7QM2X"); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await sleep(300);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "verify code")?.click(); true`);
  await sleep(1000);
  expect("code verified: hand over, then paid", await text(pg), ["hand over this order", "SB-NEW111", "collect", "student paid PKR 450: complete"]);
  await pg.evaluate(`[...document.querySelectorAll("button")].find((x) => /student paid/.test(x.innerText))?.click(); true`);
  await sleep(1000);
  expect("completed", await text(pg), ["completed", "SB-NEW111"]);
  pg.errs.forEach((e) => console.log("    " + e));
  if (pg.errs.length) bad = 1; else console.log("    brand pages: no page errors, no console errors");

  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  const adm = await open(admin, "/admin");
  await adm.evaluate(`[...document.querySelectorAll("button, a")].find((e) => /surprise boxes/i.test(e.innerText))?.click(); true`);
  await sleep(2000);
  expect("admin: support cases", await text(adm), ["surprise boxes", "never takes money", "support cases", "SB-NEW111", "food safety", "mouldy bread", "decide"]);
  await adm.evaluate(`[...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "decide")?.click(); true`);
  await sleep(500);
  expect("admin: decide a case", await text(adm), ["nothing is refunded", "upheld (the student was right)", "note for the record"]);
  await adm.evaluate(`[...document.querySelectorAll(".k-modal button, [role=dialog] button")].find((x) => x.innerText.trim() === "cancel")?.click(); true`);
  await sleep(400);
  await adm.evaluate(`[...document.querySelectorAll("[role=tab]")].find((x) => /no-shows/.test(x.innerText))?.click(); true`);
  await sleep(800);
  expect("admin: no-shows for review", await text(adm), ["nobody is banned automatically", "Sana Khan", "SB-X, SB-Y"]);
  await adm.evaluate(`[...document.querySelectorAll("[role=tab]")].find((x) => /brands/.test(x.innerText))?.click(); true`);
  await sleep(800);
  expect("admin: brands, block listings", await text(adm), ["Alpha", "upheld cases", "block listings"]);
  adm.errs.forEach((e) => console.log("    " + e));
  if (adm.errs.length) bad = 1; else console.log("    admin page: no page errors, no console errors");

  flagOn = false;
  pg = await open(brand, "/home");
  const offMenu = await nav(pg);
  if (/surprise boxes/.test(offMenu)) bad = 1;
  console.log(`flag off: brand menu ${/surprise boxes/.test(offMenu) ? "STILL SHOWS surprise boxes" : "has no 'surprise boxes'"}`);
  const adm2 = await open(admin, "/admin");
  const admMenu = await nav(adm2);
  if (/surprise boxes/.test(admMenu)) bad = 1;
  console.log(`flag off: admin menu ${/surprise boxes/.test(admMenu) ? "STILL SHOWS surprise boxes" : "has no 'surprise boxes'"}`);
  console.log("API calls: " + [...new Set(calls)].filter((c) => /surplus|flags|branches/.test(c)).join(", "));
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
