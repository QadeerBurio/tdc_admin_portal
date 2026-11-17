// node --experimental-websocket privacy-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// The public privacy policy at /privacy (PR #8): opens without signing in, says what the app does with Meta now,
// the site footer links to it, axe-core WCAG 2 A / AA clean (desktop and phone), no console errors.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep, viewport } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5199, API = Number(process.env.CHECK_API_PORT) || 5197; // run.js gives each check its own ports when they run side by side

http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  s.writeHead(200, h);
  s.end(JSON.stringify(q.method === "GET" ? [] : { success: true }));
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  require("./serve").send(f, s, API); // the build, with this check's mock API port
}).listen(WEB);
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");

(async () => {
  const b = await launch(9417);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${!cond && detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const axe = async (label) => {
    await pg.evaluate(AXE + "; true");
    const v = await pg.evaluate(`(async () => { const r = await axe.run(document.querySelector("main") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, JSON.stringify(v));
  };
  await viewport(pg, 1366, 900, false);
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await sleep(2500);
  const footerHref = await pg.evaluate(`[...document.querySelectorAll("footer a")].find((a) => a.innerText.trim().toLowerCase() === "privacy")?.getAttribute("href") || ""`);
  check("the site footer links to /privacy", footerHref === "/privacy", footerHref);
  await go(pg, `http://127.0.0.1:${WEB}/privacy`);
  await sleep(2500);
  const t = await pg.evaluate(`document.body.innerText`);
  check("/privacy opens without signing in: 'privacy policy', updated 16 November 2026", /privacy policy/i.test(t) && t.includes("last updated 16 November 2026"), t.slice(0, 200));
  check("Meta: install at first open; Android ad ID with the opt-out; iPhone only after continue + Allow; hashed email/phone after continue; the two switches", [
    "the install, counted the first time you open the app",
    "unless you turn off \"ads with your details\"",
    "unless you tap \"continue\" when the app asks and then choose Allow when Apple asks",
    "only after you tap \"continue\"",
    "\"ad measurement\" turns off everything the app shares with Meta",
  ].every((w) => t.includes(w)), t.slice(0, 400));
  check("the page title says privacy policy", /privacy policy/i.test(await pg.evaluate("document.title")));
  await axe("privacy policy (desktop)");
  await viewport(pg, 390, 844, true, 2);
  await go(pg, `http://127.0.0.1:${WEB}/privacy`);
  await sleep(2000);
  check("phone width: no horizontal scroll", (await pg.evaluate(`document.documentElement.scrollWidth - window.innerWidth`)) <= 1);
  await axe("privacy policy (phone)");
  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
