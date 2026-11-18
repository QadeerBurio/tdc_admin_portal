// node --experimental-websocket press-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// "featured in" on the home page (logo strip, university partners row, read the story -> /founder) and on /founder
// (a card per outlet, partners with Ziauddin): every outside link opens a new tab with rel="noopener", every logo has
// alt text and is greyscale until hovered or focused, no horizontal scroll on a phone, axe-core WCAG 2 A / AA clean
// (desktop and phone), no console errors.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep, viewport } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5199, API = Number(process.env.CHECK_API_PORT) || 5197;

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
  require("./serve").send(f, s, API);
}).listen(WEB);
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");

const OUTLETS = ["Express Tribune", "Verified Pakistan", "Clap Pakistan", "The Financial Daily International"];

(async () => {
  const b = await launch(9491);
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
  // every outside link in the scope: new tab + noopener; every image: alt text and greyscale at rest
  const links = (sel) => pg.evaluate(`[...document.querySelectorAll(${JSON.stringify(sel)} + " a")].filter((a) => /^https?:/.test(a.getAttribute("href"))).map((a) => ({ href: a.href, target: a.target, rel: a.rel }))`);
  const imgs = (sel) => pg.evaluate(`[...document.querySelectorAll(${JSON.stringify(sel)} + " img")].map((i) => ({ alt: i.getAttribute("alt"), filter: getComputedStyle(i).filter }))`);
  const linkRules = (label, ls) => check(`${label}: ${ls.length} outside links, all target=_blank rel=noopener`, ls.length > 0 && ls.every((l) => l.target === "_blank" && /noopener/.test(l.rel)), JSON.stringify(ls.filter((l) => l.target !== "_blank" || !/noopener/.test(l.rel))));
  const imgRules = (label, is) => check(`${label}: every logo has alt text and is greyscale at rest`, is.every((i) => i.alt && /grayscale\(1\)/.test(i.filter)), JSON.stringify(is));

  for (const [w, h, mobile] of [[1366, 900, false], [390, 844, true]]) {
    const at = mobile ? "phone" : "desktop";
    await viewport(pg, w, h, mobile, mobile ? 2 : 1);
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await sleep(2500);
    const strip = await pg.evaluate(`document.querySelector(".featured")?.innerText || ""`);
    check(`home (${at}): "featured in" with the four outlets and "university partners" with Ziauddin University`, /featured in/.test(strip) && /university partners/.test(strip) && (await pg.evaluate(`[...document.querySelectorAll(".featured img, .featured .press-wordmark")].map((e) => e.alt || e.textContent).join("|")`)).match(new RegExp(OUTLETS.concat("Ziauddin University").join("|"), "g"))?.length >= 5, strip.slice(0, 300));
    const story = await pg.evaluate(`[...document.querySelectorAll(".featured a")].find((a) => /read the story/.test(a.innerText))?.getAttribute("href") || ""`);
    check(`home (${at}): "read the story" goes to /founder`, story === "/founder", story);
    const strip0 = await pg.evaluate(`(() => { const s = document.querySelector(".featured"); const h = document.querySelector(".hero-stats"); return !!(s && h && (h.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING)); })()`);
    check(`home (${at}): the strip comes after the hero and its stats`, strip0);
    linkRules(`home strip (${at})`, await links(".featured"));
    imgRules(`home strip (${at})`, await imgs(".featured"));
    check(`home (${at}): no horizontal scroll`, (await pg.evaluate(`document.documentElement.scrollWidth - window.innerWidth`)) <= 1);
    await axe(`home (${at})`);

    await go(pg, `http://127.0.0.1:${WEB}/founder`);
    await sleep(2500);
    const cards = await pg.evaluate(`[...document.querySelectorAll("#featured-in ~ * .press-card h3, section[aria-labelledby='featured-in'] .press-card h3")].map((h) => h.innerText)`);
    check(`/founder (${at}): a "featured in" card per outlet`, OUTLETS.every((o) => cards.includes(o)), JSON.stringify(cards));
    const partners = await pg.evaluate(`document.querySelector("section[aria-labelledby='partners']")?.innerText || ""`);
    check(`/founder (${at}): partners section with Ziauddin University and the MoU link`, /Ziauddin University/.test(partners) && /MoU signed with The Deft Crew/.test(partners), partners);
    linkRules(`/founder featured in + partners (${at})`, await links("section[aria-labelledby]"));
    imgRules(`/founder press logos (${at})`, await imgs(".press-card"));
    check(`/founder (${at}): no em dashes in the page`, !(await pg.evaluate(`document.querySelector("main").innerText`)).includes("—"));
    check(`/founder (${at}): no horizontal scroll`, (await pg.evaluate(`document.documentElement.scrollWidth - window.innerWidth`)) <= 1);
    await axe(`/founder (${at})`);
  }
  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
