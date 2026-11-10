// node --experimental-websocket flags-refresh-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Flags refresh on focus (src/portal/useFlagsMe.js), against a mock API whose flags can be switched mid-test:
// - brand: one /app/flags/me on load; a focus within a minute asks nothing; after a minute a focus (or the tab
//   becoming visible) asks once, and the loyalty / surprise boxes menu items appear without a reload; switching
//   them off works the same way;
// - employer: the candidates page switches from the classic list to the pipeline after a focus, no reload.
// The page's clock is moved forward instead of waiting a minute. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

let flags = { loyaltyV2: false, surplusBoxes: false, careerTimeline: false };
let flagCalls = 0;
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  let out;
  if (k === "GET /api/app/flags/me") { flagCalls++; out = flags; }
  else if (k === "GET /api/offers/my-offers") out = [{ _id: "6aff00000000000000000001", title: "Alpha 20%", discountPercentage: 20, createdAt: new Date().toISOString(), isInStore: true }];
  else if (k === "GET /api/career/employers/me/applications") out = ok({ enabled: true, jobs: [], applications: [] });
  else out = q.method === "GET" ? [] : { success: true };
  s.writeHead(200, h);
  s.end(JSON.stringify(out));
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(s);
}).listen(WEB);

(async () => {
  const b = await launch(9364);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail !== "" ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const signIn = async (who) => { await go(pg, `http://127.0.0.1:${WEB}/`); await pg.evaluate(`localStorage.setItem("token","mock-token-${who.role}"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`); };
  // move the page's clock forward (instead of waiting a minute)
  const later = (sec) => pg.evaluate(`(() => { window.__realNow = window.__realNow || Date.now.bind(Date); window.__shift = (window.__shift || 0) + ${sec * 1000}; Date.now = () => window.__realNow() + window.__shift; return true; })()`);
  const focus = () => pg.evaluate(`window.dispatchEvent(new Event("focus")); true`);
  const visible = () => pg.evaluate(`document.dispatchEvent(new Event("visibilitychange")); true`);
  const menuHas = (label) => pg.evaluate(`[...document.querySelectorAll("a, button")].some((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)})`);

  console.log("── brand");
  await signIn({ _id: "6aff000000000000000000b1", id: "6aff000000000000000000b1", role: "brand", name: "Alpha", brandName: "Alpha Cafe" });
  flagCalls = 0;
  await go(pg, `http://127.0.0.1:${WEB}/home`);
  await sleep(3000);
  check("on load: one flags request, no loyalty / surprise boxes items", flagCalls === 1 && !(await menuHas("loyalty")) && !(await menuHas("surprise boxes")), flagCalls);
  flags = { ...flags, loyaltyV2: true, surplusBoxes: true }; // switched on on the server
  await focus();
  await sleep(800);
  check("a focus within a minute: no new request, menu unchanged", flagCalls === 1 && !(await menuHas("loyalty")), flagCalls);
  await later(61);
  await focus();
  await sleep(1200);
  check("a focus after a minute: one request; loyalty and surprise boxes appear, no reload", flagCalls === 2 && (await menuHas("loyalty")) && (await menuHas("surprise boxes")), flagCalls);
  await visible();
  await focus();
  await sleep(800);
  check("visible / focus again right away: no new request", flagCalls === 2, flagCalls);
  flags = { ...flags, loyaltyV2: false, surplusBoxes: false };
  await later(61);
  await visible();
  await sleep(1200);
  check("switched off, the tab visible again after a minute: the items go away", flagCalls === 3 && !(await menuHas("loyalty")) && !(await menuHas("surprise boxes")), flagCalls);

  console.log("── employer");
  await signIn({ _id: "6aff000000000000000000e1", id: "6aff000000000000000000e1", role: "employee", name: "Hire Co", companyName: "Hire Co" });
  flags = { ...flags, careerTimeline: false };
  await go(pg, `http://127.0.0.1:${WEB}/candidate`);
  await sleep(3500);
  const pipeline = () => pg.evaluate(`!!document.querySelector("[data-screen=employer-pipeline]")`);
  check("not in the pilot: the classic candidates list", !(await pipeline()));
  flags = { ...flags, careerTimeline: true };
  await later(61);
  await focus();
  await sleep(2000);
  check("switched on + focus after a minute: the pipeline, no reload", await pipeline());

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
