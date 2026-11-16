// node --experimental-websocket loyalty-rewards-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Loyalty stamp cards (reward mode, FLAG_LOYALTY_V2) in the brand portal, against a stateful mock API:
// - the editor: "stamp card" mode, quick picks 1 / 2 / 3 / 5 / 10 and a custom number (1 to 10), the reward (free item
//   / % within tdc's maximum when one is set / PKR), "on top" or "replace the offer" with a worked example, limits;
//   invalid settings can't be saved; the PATCH body carries mode + reward (+ combine); no brand "maximum discount"
// - the preview shows the stamp card ("1 of 3 visits", "2 more visits to a free coffee");
// - verify student (feat/loyalty-control): the waiting reward BEFORE confirming with "apply reward to this bill"; the
//   breakdown on the original bill (offer, reward, total, final); the redemption is sent with applyRewardId (one
//   request, no separate "use reward"); unticking it leaves the reward for later.
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
const stampsLoyalty = { mode: "reward", stamps: 3, needed: 3, visitsToReward: 0, reward: { visitsNeeded: 3, kind: "percent", value: 25, label: "25% off", combine: "stack" }, available: { id: RW, label: "25% off", kind: "percent", value: 25 }, limitReached: null, countsAsVisit: true };
const patches = [], uses = [], redeems = [];
// the server's breakdown (services/loyalty.js): bill 1,000, offer 10%, reward 25% on top -> 100 + 250 = 350 off, pay 650
const BD = { bill: 1000, offerPct: 10, offerDiscount: 100, rewardDiscount: 250, totalDiscount: 350, pay: 650, combine: "stack", reward: { kind: "percent", value: 25, label: "25% off" }, giveItem: null, used: "both" };
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
    else if (k === "GET /api/offers/claimed-users") out = [{ _id: S, name: "Sana", rollNo: "21K-1", universityName: "SZABIST", offerId: O, discountPercentage: 10 }];
    else if (k === "POST /api/loyalty/quotes") { const b = JSON.parse(raw || "{}"); out = ok({ mode: "reward", applies: false, discountPercentage: 10, readyReward: { id: RW, kind: "percent", value: 25, label: "25% off", combine: "stack", breakdown: b.billAmount === 1000 ? BD : null } }); }
    else if (k === "POST /api/offers/redeem-payment") { const b = JSON.parse(raw || "{}"); redeems.push(b); out = { message: "ok", savedAmount: b.applyRewardId ? 350 : 100, breakdown: b.applyRewardId ? BD : { ...BD, rewardDiscount: 0, totalDiscount: 100, pay: 900, combine: null, reward: null }, ...(b.applyRewardId ? { rewardUsed: { id: RW, label: "25% off", kind: "percent" } } : {}) }; }
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
  check("stamp card mode: quick picks 1, 2, 3, 5, 10; no tiers; no brand 'maximum discount' field", t.includes("visits for a reward") && ["1 visit", "2 visits", "3 visits", "5 visits", "10 visits"].every((w) => t.includes(w)) && !t.includes("visits 1–5: 15%") && !t.includes("maximum discount %"));
  check("tdc's maximum shown (it's set: 20%)", t.includes("tdc maximum: 20%"));
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
  await type("rw-kind", "percent");
  await type("rw-value", "15");
  await sleep(300);
  check("15% on top: the worked example on a PKR 1,000 bill with the 10% offer (pays 750)", (await text()).includes("the student pays PKR 750 (PKR 250 off)"));
  await click("replace the offer (use the bigger discount)");
  await sleep(300);
  check("replace: the bigger one (15%) -> pays 850", (await text()).includes("the student pays PKR 850 (PKR 150 off)"));
  await click("add on top of the offer");
  await type("rw-kind", "item");
  await type("rw-item", "a free coffee");
  await type("rw-n", "11");
  await sleep(300);
  check("custom 11 visits: error (1 to 10)", (await text()).includes("visits needed: 1 to 10") && (await btn("save changes")).disabled === true);
  await type("rw-n", "0");
  await sleep(300);
  check("0 visits: error (1 to 10)", (await text()).includes("visits needed: 1 to 10"));
  await type("rw-n", "1");
  await sleep(300);
  check("1 visit: allowed", !(await text()).includes("visits needed: 1 to 10") && (await text()).includes("students see: 1 visit = a free coffee"));
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
  check("save: PATCH mode reward + the reward (combine, limits as numbers or null), no maxDiscountPct", p.mode === "reward" && JSON.stringify(p.reward) === JSON.stringify({ visitsNeeded: 3, kind: "item", combine: "stack", item: "a free coffee", maxPerStudent: null, maxPerMonth: 2 }) && !("maxDiscountPct" in p), JSON.stringify(p));

  // verify student: the waiting reward BEFORE confirming, applied to this bill
  await go(pg, `http://127.0.0.1:${WEB}/verifyclaim`);
  await sleep(3500);
  t = await text();
  const box = (label) => pg.evaluate(`(() => { const l = [...document.querySelectorAll("label")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)}); const i = l?.querySelector("input"); return i ? { found: true, checked: i.checked } : { found: false }; })()`);
  check("verify: stamps 3 of 3, 'reward ready: 25% off' and 'apply reward to this bill' (ticked), no separate 'use reward'", t.includes("stamps: 3 of 3") && t.includes("reward ready: 25% off") && (await box("apply reward to this bill")).checked === true && !(await btn("use reward")).found, t.replace(/\n/g, " | ").slice(0, 300));
  await axe(`document.querySelector("main") || document`, "verify with a ready reward");
  const openPay = () => pg.evaluate(`(() => { const e = [...document.querySelectorAll("article button")].find((x) => !x.disabled && /process|redeem|bill|payment/i.test(x.innerText)); if (e) e.click(); return e ? e.innerText : null; })()`);
  await openPay();
  await sleep(800);
  await type("bv-modal-bill", "1000");
  await click("calculate discount");
  await sleep(6500); // longer than the 5-second poll
  check("the poll doesn't wipe the bill or the breakdown while the payment is open", (await pg.evaluate(`document.getElementById("bv-modal-bill")?.value`)) === "1000");
  const modal = await pg.evaluate(`(${DLG})?.innerText || ""`);
  check("the breakdown on the original bill: offer 10% -100, reward 25% on top -250, total -350, final 650", /Offer discount \(10%\):\s*- ₨ 100/.test(modal) && /Loyalty reward \(25% off, on top\):\s*- ₨ 250/.test(modal) && /Total discount:\s*- ₨ 350/.test(modal) && /Final Amount:\s*₨ 650/.test(modal), modal.replace(/\n/g, " | ").slice(0, 400));
  await axe(DLG, "payment with the reward breakdown");
  await click("complete redemption");
  await sleep(1500);
  check("complete: ONE redeem-payment with applyRewardId (no separate 'use reward' call), for the student picked from the list", redeems.length === 1 && redeems[0].applyRewardId === RW && redeems[0].billAmount === 1000 && redeems[0].userId === S && uses.length === 0, JSON.stringify(redeems));
  // unticked: the bill gets the offer only, the reward stays for later
  await go(pg, `http://127.0.0.1:${WEB}/verifyclaim`);
  await sleep(3000);
  await pg.evaluate(`(() => { const l = [...document.querySelectorAll("label")].find((x) => x.innerText.trim().toLowerCase() === "apply reward to this bill"); l.querySelector("input").click(); return true; })()`);
  await sleep(300);
  await openPay();
  await sleep(800);
  await type("bv-modal-bill", "1000");
  await click("calculate discount");
  await sleep(800);
  await click("complete redemption");
  await sleep(1500);
  check("'apply reward' unticked: the redemption has no applyRewardId", redeems.length === 2 && !("applyRewardId" in redeems[1]), JSON.stringify(redeems[1]));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
