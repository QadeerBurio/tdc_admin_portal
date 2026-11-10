// node --experimental-websocket loyalty-rewards-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Loyalty stamp cards (reward mode, FLAG_LOYALTY_V2) in the brand portal, against a stateful mock API:
// - the editor: "stamp card" mode, quick picks 2 / 3 / 5 and a custom number, the reward (free item / % within the
//   cap / PKR), limits; invalid settings can't be saved; the PATCH body carries mode + reward;
// - the preview shows the stamp card ("1 of 3 visits", "2 more visits to a free coffee");
// - verify student: stamps and a waiting reward; "use reward" asks first, then POSTs once with an Idempotency-Key.
// axe-core WCAG 2 A / AA on the editor, the preview and the verify list. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const B = "6afb0000000000000000000b", S = "6afb0000000000000000000c", O = "6afb0000000000000000000d", PID = "6afb0000000000000000000e", RW = "6afb0000000000000000000f";
let program = { id: PID, brand: B, status: "draft", version: 1, mode: "tiers", reward: null, tiers: [{ name: "Member", minVisit: 1, maxVisit: 5, discountPct: 15 }, { name: "Regular", minVisit: 6, maxVisit: null, discountPct: 25 }], maxDiscountPct: 25, brandMaxDiscountPct: 25, adminMaxDiscountPct: 20, eligibleOfferIds: [], branchIds: [], maxVisitsPerDay: 1, resetMonths: 12, terms: "", startsAt: null, endsAt: null };
const stampsLoyalty = { mode: "reward", stamps: 3, needed: 3, visitsToReward: 0, reward: { visitsNeeded: 3, kind: "item", label: "a free coffee" }, available: { id: RW, label: "a free coffee", kind: "item" }, limitReached: null, countsAsVisit: true };
const patches = [], uses = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  let raw = "";
  q.on("data", (d) => { raw += d; });
  q.on("end", () => {
    const k = `${q.method} ${new URL(q.url, "http://x").pathname}`;
    let out, status = 200;
    if (k === "GET /api/app/flags/me") out = { loyaltyV2: true };
    else if (k === "GET /api/loyalty/programs/mine") out = ok(program);
    else if (k === "GET /api/loyalty/brands/me/analytics") out = ok({ program, verifiedVisits: 9, members: 4, repeatCustomers: 2, reversals: 0, creditsNotCounted: 0, tierCounts: {}, rewards: { earned: 3, used: 2, waiting: 1 } });
    else if (k === `PATCH /api/loyalty/programs/${PID}`) { const b = JSON.parse(raw); patches.push(b); const { version, ...rest } = b; program = { ...program, ...rest, version: program.version + 1 }; out = ok(program); }
    else if (k === "GET /api/offers/my-offers") out = [{ _id: O, title: "Roast 10%", discountPercentage: 10, createdAt: new Date().toISOString(), isInStore: true }];
    else if (k === "GET /api/branches/my-branches") out = { success: true, branches: [] };
    else if (k === "GET /api/offers/pending-scans") out = [{ studentId: S, name: "Sana", rollNo: "21K-1", universityName: "SZABIST", offerId: O, offerTitle: "Roast 10%", discountPercentage: 10, scannedAt: new Date().toISOString(), status: "pending", loyalty: stampsLoyalty }];
    else if (k === `POST /api/loyalty/rewards/${RW}/use`) { uses.push({ key: q.headers["idempotency-key"], body: JSON.parse(raw || "{}") }); status = 201; out = ok({ id: RW, status: "used", label: "a free coffee", savedAmount: null, duplicate: false }); }
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
  const b = await launch(9361);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify({ _id: B, id: B, role: "brand", name: "Roast", brandName: "Roast Cafe" })})); true`);
  const DLG = `[...document.querySelectorAll("[role=dialog]")].pop()`;
  const text = () => pg.evaluate(`document.getElementById("root")?.innerText || ""`);
  const click = (label, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button, [role=radio]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)} && !x.disabled); if (e) e.click(); return !!e; })()`);
  const btn = (label) => pg.evaluate(`(() => { const e = [...document.querySelectorAll("button")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)}); return e ? { found: true, disabled: e.disabled, pressed: e.getAttribute("aria-pressed") } : { found: false }; })()`);
  const type = (id, v) => pg.evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); const proto = el.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const axe = async (scope, label) => {
    await pg.evaluate(AXE + "; true");
    const v = await pg.evaluate(`(async () => { const r = await axe.run(${scope}, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.length ? JSON.stringify(v) : "no violations");
  };

  await go(pg, `http://127.0.0.1:${WEB}/loyalty`);
  await sleep(3500);
  check("editor: 'how it works' with the two kinds, tiers by default", (await text()).includes("how it works") && (await text()).includes("stamp card: a reward every few visits") && (await text()).includes("visits 1–5: 15%"));
  check("brand numbers: rewards earned / used / waiting", (await text()).includes("rewards") && (await text()).includes("2 used · 1 waiting"));
  await click("stamp card: a reward every few visits");
  await sleep(500);
  let t = await text();
  check("stamp card mode: the reward settings, no tiers", t.includes("visits for a reward") && t.includes("2 visits") && t.includes("5 visits") && !t.includes("visits 1–5: 15%"));
  await click("3 visits");
  await sleep(300);
  check("quick pick 3: pressed, the number set", (await btn("3 visits")).pressed === "true" && (await pg.evaluate(`document.getElementById("rw-n").value`)) === "3");
  check("a free item without a name: error, can't save", (await text()).includes("name the free item") && (await btn("save changes")).disabled === true);
  await type("rw-kind", "percent");
  await type("rw-value", "30");
  await sleep(300);
  check("% off above the admin cap (20%): error, can't save", (await text()).includes("% off: 1 to 20") && (await btn("save changes")).disabled === true);
  await type("rw-kind", "item");
  await type("rw-item", "a free coffee");
  await type("rw-month", "2");
  await type("rw-n", "21");
  await sleep(300);
  check("custom 21 visits: error (2 to 20)", (await text()).includes("visits needed: 2 to 20") && (await btn("save changes")).disabled === true);
  await type("rw-n", "3");
  await sleep(300);
  check("valid: 'students see: 3 visits = a free coffee'", (await text()).includes("students see: 3 visits = a free coffee"));
  await axe(`document.querySelector("main") || document`, "stamp card editor");
  await click("preview and publish");
  await sleep(600);
  const d = await pg.evaluate(`(${DLG})?.innerText || ""`);
  check("preview: the stamp card", d.includes("1 of 3 visits") && d.includes("2 more visits to a free coffee") && d.includes("up to 2 rewards a month"), d.replace(/\n/g, " | ").slice(0, 200));
  await axe(DLG, "stamp card preview");
  await click("back to editing", DLG);
  await sleep(300);
  await click("save changes");
  await sleep(1200);
  const p = patches[patches.length - 1] || {};
  check("save: PATCH mode reward + the reward (limits as numbers or null)", p.mode === "reward" && JSON.stringify(p.reward) === JSON.stringify({ visitsNeeded: 3, kind: "item", item: "a free coffee", maxPerStudent: null, maxPerMonth: 2 }), JSON.stringify(p));

  // verify student: stamps and the waiting reward
  await go(pg, `http://127.0.0.1:${WEB}/verifyclaim`);
  await sleep(3500);
  t = await text();
  check("verify: stamps 3 of 3 and the waiting reward", t.includes("stamps: 3 of 3") && t.includes("reward waiting: a free coffee") && (await btn("use reward")).found, t.replace(/\n/g, " | ").slice(0, 300));
  await axe(`document.querySelector("main") || document`, "verify with a waiting reward");
  await click("use reward");
  await sleep(600);
  check("use reward asks first", (await pg.evaluate(`(${DLG})?.innerText || ""`)).includes("it can only be used once"));
  await click("use reward", DLG);
  await sleep(1200);
  check("use: one POST with an Idempotency-Key", uses.length === 1 && typeof uses[0].key === "string" && uses[0].key.length >= 8, JSON.stringify(uses));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
