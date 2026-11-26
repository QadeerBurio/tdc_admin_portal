// node founder-photo-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// The founder photo on /founder (fix/founder-photo), at 1440, 768 and 390 px:
// - it loads (naturalWidth > 0), as WebP, eagerly with high fetch priority (above the fold)
// - always 4:5 (no stretching or squashing), never the img's height attribute (the old bug: 1124 px tall at any width)
// - the face is inside the visible part of the photo (object-fit: cover never cuts through it)
// - desktop: beside the text, top-aligned, at most 380 px wide; tablet: 360 px, centred above the text; phone: at most
//   352 px wide and 440 px tall, centred above the text
// - no layout shift while it loads (its box is reserved); no page scroll sideways; axe-core WCAG 2 A / AA; no errors
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep, viewport } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5215, API = Number(process.env.CHECK_API_PORT) || 5216;

http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  s.writeHead(200, h);
  s.end(JSON.stringify(q.method === "GET" ? [] : { success: true }));
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  require("./serve").send(f, s, API);
}).listen(WEB);

// where the face is in the photo, as fractions of the full image (measured on founder-msb-800: head and beard)
const FACE = { x0: 0.24, x1: 0.50, y0: 0.05, y1: 0.37 };

(async () => {
  const b = await launch(9437);
  let bad = 0;
  const check = (label, ok, detail = "") => { if (!ok) bad = 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}${!ok && detail ? `  (${detail})` : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const ev = (js) => pg.evaluate(js);
  const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  let axeTotal = 0;
  // layout shifts, recorded from the first paint
  await pg.s("Page.addScriptToEvaluateOnNewDocument", { source: `window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });` });

  for (const [label, w, h, mobile, maxW] of [["1440", 1440, 900, false, 380], ["768", 768, 1024, true, 360], ["390", 390, 844, true, 352]]) {
    console.log(`-- ${label}x${h}`);
    await viewport(pg, w, h, mobile);
    await go(pg, `http://127.0.0.1:${WEB}/founder`);
    await pg.waitFor(`(() => { const i = document.querySelector("img.founder-photo"); return i && i.complete; })()`, { label: "the founder photo" });
    await sleep(600);
    const m = await ev(`(() => {
      const img = document.querySelector("img.founder-photo"), r = img.getBoundingClientRect(), cs = getComputedStyle(img);
      const copy = document.querySelector(".hero-copy").getBoundingClientRect();
      const pos = cs.objectPosition.split(" ").map((v) => parseFloat(v) / 100);
      return { w: r.width, h: r.height, left: r.left, top: r.top, natW: img.naturalWidth, natH: img.naturalHeight, current: img.currentSrc, loading: img.getAttribute("loading"), priority: img.getAttribute("fetchpriority"),
        attrW: +img.getAttribute("width"), attrH: +img.getAttribute("height"), fit: cs.objectFit, pos, radius: cs.borderRadius, inPicture: img.parentElement.tagName,
        textTop: copy.top, textLeft: copy.left, textBottom: copy.bottom, vw: innerWidth, sideways: document.scrollingElement.scrollWidth - innerWidth, cls: window.__cls };
    })()`);
    const ratio = m.w / m.h;
    check(`${label}: the photo loads (naturalWidth ${m.natW} > 0), as WebP`, m.natW > 0 && /\.webp$/.test(m.current), m.current);
    check(`${label}: above the fold: loading="eager", fetchpriority="high", in a <picture> with a JPG fallback`, m.loading === "eager" && m.priority === "high" && m.inPicture === "PICTURE" && m.attrW / m.attrH === 0.8, JSON.stringify({ loading: m.loading, priority: m.priority, el: m.inPicture, wh: [m.attrW, m.attrH] }));
    check(`${label}: 4:5, not stretched or squashed (${Math.round(m.w)}x${Math.round(m.h)}, ratio ${ratio.toFixed(3)}); the file is 4:5 too`, Math.abs(ratio - 0.8) < 0.01 && Math.abs(m.natW / m.natH - 0.8) < 0.01 && m.h < 600, JSON.stringify({ w: m.w, h: m.h, nat: [m.natW, m.natH] }));
    check(`${label}: object-fit cover, rounded like the cards (${m.radius})`, m.fit === "cover" && m.radius === "22px");
    // the part of the image object-fit: cover shows, as fractions of the image; the face must be inside it
    const s = Math.max(m.w / m.natW, m.h / m.natH), visW = m.w / (m.natW * s), visH = m.h / (m.natH * s);
    const x0 = (1 - visW) * m.pos[0], y0 = (1 - visH) * m.pos[1];
    const faceIn = FACE.x0 >= x0 - 0.001 && FACE.x1 <= x0 + visW + 0.001 && FACE.y0 >= y0 - 0.001 && FACE.y1 <= y0 + visH + 0.001;
    check(`${label}: the face is fully in view (shown: x ${(x0 * 100).toFixed(0)}-${((x0 + visW) * 100).toFixed(0)}%, y ${(y0 * 100).toFixed(0)}-${((y0 + visH) * 100).toFixed(0)}%)`, faceIn);
    check(`${label}: at most ${maxW} px wide (${Math.round(m.w)})`, m.w <= maxW + 0.5);
    if (label === "1440") check(`${label}: beside the text, top-aligned (photo top ${Math.round(m.top)}, text top ${Math.round(m.textTop)})`, m.left > m.textLeft + 300 && Math.abs(m.top - m.textTop) <= 2 && m.h - (m.textBottom - m.textTop) < 160, JSON.stringify({ photoH: m.h, textH: m.textBottom - m.textTop }));
    else check(`${label}: centred above the text`, m.top + m.h <= m.textTop && Math.abs(m.left + m.w / 2 - m.vw / 2) <= 1, JSON.stringify({ top: m.top, h: m.h, textTop: m.textTop, left: m.left, w: m.w, vw: m.vw }));
    if (label === "390") check(`${label}: at most 440 px tall (${Math.round(m.h)})`, m.h <= 440.5);
    check(`${label}: no layout shift while it loads (CLS ${m.cls.toFixed(4)})`, m.cls < 0.01);
    check(`${label}: no page scroll sideways`, m.sideways <= 0, String(m.sideways));
    await ev(AXE + ";true");
    const v = await ev(`(async () => { const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => v.id + " (" + v.nodes.length + ")"); })()`);
    axeTotal += v.length;
    console.log(`axe ${label}: ${v.length ? v.join(", ") : "no WCAG 2 A/AA violations"}`);
  }
  check("no page or console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
  check("axe: no WCAG 2 A/AA violations", axeTotal === 0);
  await b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
