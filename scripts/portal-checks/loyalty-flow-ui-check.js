// node --experimental-websocket loyalty-flow-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// The brand's loyalty flow (FLAG_LOYALTY_V2) against a stateful mock API on 5197:
// draft -> start/end dates (an end before the start is refused) -> preview (the student's card, with a
// visits picker) -> publish (PATCH status active with the dates; scheduled when the start is ahead) ->
// end program (confirmation; PATCH sends only the status; then read-only). Also: outside the pilot the
// page is "coming soon" and makes no loyalty calls. axe-core WCAG 2 A / AA on the page, the preview and
// the confirmation. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;

const B = "6ae9aaaaaaaaaaaaaaaaaaaa", PID = "6ae9dddddddddddddddddddd";
let flags = { loyaltyV2: true };
let program = { id: PID, brand: B, status: "draft", version: 1, tiers: [{ name: "Member", minVisit: 1, maxVisit: 5, discountPct: 15 }, { name: "Regular", minVisit: 6, maxVisit: null, discountPct: 25 }], maxDiscountPct: 25, brandMaxDiscountPct: 25, adminMaxDiscountPct: null, eligibleOfferIds: [], branchIds: [], maxVisitsPerDay: 1, resetMonths: 12, terms: "dine-in only", startsAt: null, endsAt: null };
const ok = (data) => ({ success: true, data, requestId: "mock" });
const patches = [];
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  let raw = "";
  q.on("data", (d) => { raw += d; });
  q.on("end", () => {
    const key = `${q.method} ${q.url.split("?")[0]}`;
    calls.push(key);
    let body;
    if (key === "GET /api/app/flags/me") body = flags;
    else if (key === "GET /api/loyalty/programs/mine") body = ok(program);
    else if (key === "GET /api/offers/my-offers") body = [{ _id: "6ae9cccccccccccccccccccc", title: "Alpha 20%", discountPercentage: 20, createdAt: new Date().toISOString(), isInStore: true }];
    else if (key === "GET /api/branches/my-branches") body = { success: true, branches: [{ _id: "6ae9eeeeeeeeeeeeeeeeeeee", name: "Clifton", city: "Karachi" }] };
    else if (key === "GET /api/loyalty/brands/me/analytics") body = ok({ program, verifiedVisits: 0, members: 0, repeatCustomers: 0, reversals: 0, creditsNotCounted: 0, tierCounts: {} });
    else if (key === `PATCH /api/loyalty/programs/${PID}`) {
      const b = JSON.parse(raw || "{}");
      patches.push(b);
      const { version, ...rest } = b;
      program = { ...program, ...rest, version: program.version + 1 };
      body = ok(program);
    } else body = q.method === "GET" ? [] : { success: true };
    s.writeHead(200, h);
    s.end(JSON.stringify(body));
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
  const b = await launch(9352);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  await pg.s("Log.enable");
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const brand = { _id: B, id: B, role: "brand", name: "Alpha", brandName: "Alpha Cafe" };
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(brand)})); true`);
  const text = () => pg.evaluate(`document.getElementById("root")?.innerText || ""`);
  const dialogText = () => pg.evaluate(`[...document.querySelectorAll("[role=dialog]")].map((d) => d.innerText).join("\\n")`);
  const btn = (label, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)}); return e ? { found: true, disabled: e.disabled } : { found: false }; })()`);
  const click = (label, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)} && !x.disabled); if (e) e.click(); return !!e; })()`);
  const setDate = (id, v) => pg.evaluate(`(() => { const el = document.getElementById(${JSON.stringify(id)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const axe = async (scope, label) => {
    await pg.evaluate(AXE + "; true");
    const v = await pg.evaluate(`(async () => { const r = await axe.run(${scope}, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.length ? JSON.stringify(v) : "no violations");
  };

  await go(pg, `http://127.0.0.1:${WEB}/loyalty`);
  await sleep(3500);
  let t = await text();
  check("draft program: status, dates, preview and publish, end program", ["draft", "start date", "end date", "preview and publish", "end program", "save changes"].every((w) => t.toLowerCase().includes(w)));
  check("no pause button for a draft", !(await btn("pause")).found);

  // an end date before the start: refused before anything is sent
  await setDate("loy-start", "2030-03-10");
  await setDate("loy-end", "2030-03-01");
  await sleep(400);
  t = await text();
  check("end before start: error shown, save and preview disabled", t.includes("the end date must be on or after the start date") && (await btn("save changes")).disabled === true && (await btn("preview and publish")).disabled === true);
  await setDate("loy-end", "2030-12-31");
  await sleep(400);
  check("valid dates: buttons enabled again", (await btn("preview and publish")).disabled === false);
  await axe(`document.querySelector("main") || document`, "loyalty page (draft)");

  // preview: the student's card for a new student, then after 5 visits
  check("open preview", await click("preview and publish"));
  await sleep(700);
  let d = await dialogText();
  check("preview: card for a new student", ["preview: what students see", "0", "verified visits", "15%", "on your next visit", "5 more visits, then 25% from visit 6 (regular).", "dine-in only", "runs"].every((w) => d.includes(w)), d.replace(/\n/g, " | ").slice(0, 300));
  check("preview: publishing schedules it (start ahead)", d.includes("publishing schedules it: visits count from 2030-03-10."));
  await axe(`[...document.querySelectorAll("[role=dialog]")].pop()`, "preview dialog");
  await click("5", `[...document.querySelectorAll("[role=dialog]")].pop()`);
  await sleep(400);
  d = await dialogText();
  check("preview with 5 visits: next visit is the top tier at 25%", d.includes("25%") && d.includes("you're on the top tier."));
  check("no request sent by previewing", patches.length === 0);

  // publish from the preview
  check("publish", await click("publish", `[...document.querySelectorAll("[role=dialog]")].pop()`));
  await sleep(1500);
  const p1 = patches[0] || {};
  check("publish: PATCH status active with the dates and the version", p1.status === "active" && p1.version === 1 && new Date(p1.startsAt).getTime() === new Date("2030-03-10T00:00:00").getTime() && new Date(p1.endsAt).getTime() === new Date("2030-12-31T23:59:59.999").getTime(), JSON.stringify({ status: p1.status, startsAt: p1.startsAt, endsAt: p1.endsAt, version: p1.version }));
  t = await text();
  check("after publishing: preview closed, 'scheduled', pause available", (await dialogText()) === "" && t.includes("scheduled") && (await btn("pause")).found && (await btn("preview")).found);

  // end the program: a confirmation first; cancelling sends nothing
  check("end program", await click("end program"));
  await sleep(600);
  d = await dialogText();
  check("confirmation explains it's final", d.includes("end your loyalty program?") && d.includes("Ending is final for this program."));
  await axe(`[...document.querySelectorAll("[role=dialog]")].pop()`, "end confirmation");
  await click("cancel", `[...document.querySelectorAll("[role=dialog]")].pop()`);
  await sleep(400);
  check("cancel: nothing sent", patches.length === 1);
  await click("end program");
  await sleep(600);
  check("confirm end", await click("end program", `[...document.querySelectorAll("[role=dialog]")].pop()`));
  await sleep(1500);
  const p2 = patches[1] || {};
  check("end: PATCH sends only the status (and version)", JSON.stringify(Object.keys(p2).sort()) === JSON.stringify(["status", "version"]) && p2.status === "ended", JSON.stringify(p2));
  t = await text();
  check("ended: notice shown, no publish/pause/end buttons, fields read-only", t.includes("this program has ended") && !(await btn("end program")).found && !(await btn("pause")).found && !(await btn("preview and publish")).found && (await pg.evaluate(`document.getElementById("loy-max").matches(":disabled")`)) === true);
  await axe(`document.querySelector("main") || document`, "loyalty page (ended)");

  // outside the pilot: "coming soon", no loyalty calls
  flags = {};
  calls.length = 0;
  await go(pg, `http://127.0.0.1:${WEB}/loyalty`);
  await sleep(3000);
  t = await text();
  check("flag off: coming soon, no loyalty requests", t.includes("loyalty is coming soon") && !calls.some((c) => c.includes("/api/loyalty/")), calls.filter((c) => c.includes("loyalty")).join(", "));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
