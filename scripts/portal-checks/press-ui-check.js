// node press-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// "featured in" (feat/press-featured) on the public site, at desktop and phone size, signed out:
// - home page: the logo strip right after the hero and its numbers; Express Tribune, Verified Pakistan and Clap
//   Pakistan each link to their piece (new tab, rel noopener) with the outlet name as alt text; "read the story" goes
//   to /founder; logos lazy, the same height, greyscale until hover / keyboard focus; they wrap on a phone (no page
//   scroll sideways)
// - home page: a small "university partners" row after the strip (Ziauddin University, its MoU page)
// - /founder: a card per outlet (logo, name, one line, read / view link); Clap Pakistan shows its article headline;
//   then a "partners" section (Ziauddin University, "MoU signed with The Deft Crew"); the reworded story line;
//   the meta description mentions the coverage
// - every logo (strip, partners row, founder cards, partners) loads from /press/logos/ (naturalWidth > 0, WebP
//   chosen) and every PNG fallback is served (fix/press-logos)
// - axe-core WCAG 2 A / AA on both pages; no page or console errors
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep, viewport } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5209, API = Number(process.env.CHECK_API_PORT) || 5210;

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

const NEW = {
  "Express Tribune": ["https://www.instagram.com/p/Df1_QhXkeTn/"],
  "Verified Pakistan": ["https://www.linkedin.com/posts/verifiedpakistanvp_during-a-hiring-drive-pakistani-entrepreneur-activity-7528713799072161792-nKX0"],
  "Clap Pakistan": ["https://clappakistan.com/why-are-fresh-graduates-struggling-to-get-their-first-interview-majid-shah-bukhari-is-investing-in-a-different-approach/", "https://www.instagram.com/p/DfzMslugQXu/"],
  "The Financial Daily": ["https://thefinancialdaily.com/degrees-without-skills-majid-shah-calls-out-pakistans-broken-talent-pipeline/", "https://thefinancialdaily.com/64-of-nation-wasted-to-ignorance-the-talent-shortage-is-a-corporate-myth-majid-shah/", "https://thefinancialdaily.com/pakistans-youth-budget-grows-while-employment-stagnates-majid-shah/"],
};
const HEADLINE = "Why are fresh graduates struggling to get their first interview? Majid Shah Bukhari is investing in a different approach";

(async () => {
  const b = await launch(9435);
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
  const audit = async (label) => {
    await ev(AXE + ";true");
    const v = await ev(`(async () => { const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    axeTotal += v.length;
    console.log(`axe ${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };
  // the computed filter of a logo while its link is hovered / keyboard-focused (forced pseudo state)
  await pg.s("DOM.enable", {});
  await pg.s("CSS.enable", {});
  const filterWhen = async (linkSel, imgSel, state) => {
    const { root } = await pg.s("DOM.getDocument", { depth: -1 });
    const { nodeId } = await pg.s("DOM.querySelector", { nodeId: root.nodeId, selector: linkSel });
    if (!nodeId) return "no element";
    await pg.s("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: state ? [state] : [] });
    await sleep(350);
    const f = await ev(`getComputedStyle(document.querySelector(${JSON.stringify(imgSel)})).filter`);
    await pg.s("CSS.forcePseudoState", { nodeId, forcedPseudoClasses: [] });
    return f;
  };
  const links = (scope) => ev(`[...document.querySelectorAll(${JSON.stringify(scope)} + " a")].map((a) => ({ href: a.getAttribute("href"), target: a.getAttribute("target"), rel: a.getAttribute("rel") || "", label: a.getAttribute("aria-label") || a.innerText.trim(), alt: a.querySelector("img")?.getAttribute("alt") || null, lazy: a.querySelector("img")?.getAttribute("loading") || null }))`);
  const ext = (l) => l.target === "_blank" && /\bnoopener\b/.test(l.rel);
  // lazy logos: bring each into view, then wait until every one has finished (loaded or failed)
  const settle = async (sel) => {
    await ev(`(async () => { for (const i of document.querySelectorAll(${JSON.stringify(sel)})) { i.scrollIntoView({ block: "center" }); await new Promise((r) => setTimeout(r, 120)); } return true; })()`);
    await pg.waitFor(`[...document.querySelectorAll(${JSON.stringify(sel)})].every((i) => i.complete)`, { label: "the logos finished loading" });
  };
  // every logo loaded (naturalWidth > 0), from /press/logos/, the WebP chosen; a broken one is named, not a timeout
  const pngs = new Set();
  const logosLoad = async (label, sel, n) => {
    const imgs = await ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map((i) => ({ alt: i.alt, w: i.naturalWidth, src: i.getAttribute("src"), current: i.currentSrc }))`);
    imgs.forEach((i) => pngs.add(i.src));
    const broken = imgs.filter((i) => !(i.w > 0));
    check(`${label}: all ${n} logos load (naturalWidth > 0)`, imgs.length === n && broken.length === 0, JSON.stringify({ count: imgs.length, broken }));
    check(`${label}: every logo from /press/logos/, WebP in Chrome, PNG as the fallback src`, imgs.every((i) => /^\/press\/logos\/[a-z0-9-]+\.png$/.test(i.src) && /\/press\/logos\/[a-z0-9-]+\.webp$/.test(i.current)), JSON.stringify(imgs.map((i) => [i.src, i.current])));
  };

  for (const [label, w, h, mobile] of [["desktop", 1366, 860, false], ["phone", 390, 800, true]]) {
    console.log(`-- ${label} ${w}x${h}`);
    await viewport(pg, w, h, mobile);

    // home page
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.waitFor(`!!document.querySelector('[data-press="strip"] img')`, { label: "the featured in strip" });
    await ev(`document.querySelector('[data-press="strip"]').scrollIntoView({ block: "center" }); true`);
    await settle('[data-press="strip"] img, [data-partners="row"] img');
    await ev(`document.querySelector('[data-press="strip"]').scrollIntoView({ block: "center" }); true`);
    const strip = await ev(`(() => {
      const s = document.querySelector('[data-press="strip"]');
      const stats = document.querySelector('[aria-label="tdc in numbers"]');
      const label = s.querySelector(".featured-label")?.innerText.trim();
      const imgs = [...s.querySelectorAll("img")].map((i) => { const r = i.getBoundingClientRect(); return { alt: i.alt, h: Math.round(r.height), left: r.left, right: r.right, top: Math.round(r.top) }; });
      return { label, after: !!(stats.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING), imgs, sideways: document.scrollingElement.scrollWidth - innerWidth, vw: innerWidth };
    })()`);
    const sl = await links('[data-press="strip"]');
    check(`${label} home: "featured in" strip after the hero and its numbers`, strip.label === "featured in" && strip.after, JSON.stringify({ l: strip.label, a: strip.after }));
    for (const [outlet, hrefs] of Object.entries(NEW)) {
      const l = sl.find((x) => x.alt === outlet);
      check(`${label} home: ${outlet} logo (alt "${outlet}", lazy) links to its piece in a new tab, rel noopener`, l && l.href === hrefs[0] && ext(l) && l.lazy === "lazy" && l.label.startsWith(`${outlet}: `), JSON.stringify(l));
    }
    const story = sl.find((x) => /read the story/.test(x.label));
    check(`${label} home: "read the story" links to /founder (same tab)`, story && story.href === "/founder" && story.target === null, JSON.stringify(story));
    const heights = [...new Set(strip.imgs.map((i) => i.h))];
    check(`${label} home: every logo the same height (${heights.join(", ")} px)`, heights.length === 1 && heights[0] === 48, JSON.stringify(strip.imgs));
    check(`${label} home: logos stay on screen (they wrap), no page scroll sideways`, strip.sideways <= 0 && strip.imgs.every((i) => i.left >= 0 && i.right <= strip.vw), JSON.stringify({ sideways: strip.sideways, imgs: strip.imgs.map((i) => [Math.round(i.left), Math.round(i.right)]) }));
    if (mobile) check(`${label} home: on a phone the logos wrap onto more than one line`, new Set(strip.imgs.map((i) => i.top)).size > 1, JSON.stringify(strip.imgs.map((i) => i.top)));
    const linkSel = `[data-press="strip"] a[aria-label^="Express Tribune"]`, imgSel = `${linkSel} img`;
    const plain = await filterWhen(linkSel, imgSel, null);
    const hover = await filterWhen(linkSel, imgSel, "hover");
    const focus = await filterWhen(linkSel, imgSel, "focus-visible");
    check(`${label} home: greyscale by default, full colour on hover and on keyboard focus`, /grayscale\(1\)/.test(plain) && hover === "none" && focus === "none", JSON.stringify({ plain, hover, focus }));
    const pr = await ev(`(() => { const r = document.querySelector('[data-partners="row"]'); const s = document.querySelector('[data-press="strip"]'); const i = r && r.querySelector("img"); return r && { label: r.querySelector(".featured-label")?.innerText.trim(), after: !!(s.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING), h: i && Math.round(i.getBoundingClientRect().height), inStrip: !!s.querySelector('img[alt="Ziauddin University"]') }; })()`);
    const prl = (await links('[data-partners="row"]'))[0];
    check(`${label} home: "university partners" row after the strip: Ziauddin University (alt, lazy, 48 px) links to the MoU page in a new tab`, pr && pr.label === "university partners" && pr.after && !pr.inStrip && pr.h === 48 && prl && prl.alt === "Ziauddin University" && prl.lazy === "lazy" && prl.href === "https://zu.edu.pk/mou-with-the-deft-crew/" && ext(prl), JSON.stringify({ pr, prl }));
    await logosLoad(`${label} home`, '[data-press="strip"] img, [data-partners="row"] img', 7);
    await audit(`${label} home`);

    // founder page
    await go(pg, `http://127.0.0.1:${WEB}/founder`);
    await pg.waitFor(`!!document.querySelector('[data-press="cards"] .press-card')`, { label: "the featured in cards" });
    await ev(`document.querySelector('[data-press="cards"]').scrollIntoView(); true`);
    await settle('[data-press="cards"] img, [data-partners="cards"] img');
    await ev(`document.querySelector('[data-press="cards"]').scrollIntoView(); true`);
    const f = await ev(`(() => {
      const s = document.querySelector('[data-press="cards"]');
      const cards = [...s.querySelectorAll(".press-card")].map((c) => ({ name: c.querySelector("h3")?.innerText.trim(), alt: c.querySelector("img")?.alt || null, lazy: c.querySelector("img")?.getAttribute("loading") || null, text: c.innerText }));
      return { heading: s.querySelector("h2")?.innerText.trim(), cards, meta: document.querySelector('meta[name="description"]')?.content || "", sideways: document.scrollingElement.scrollWidth - innerWidth, strip: !!document.querySelector('[data-press="strip"]') };
    })()`);
    const fl = await links('[data-press="cards"]');
    check(`${label} founder: a "featured in" section with a card per outlet, the new four first`, /^featured in/.test(f.heading) && f.cards.slice(0, 4).map((c) => c.name).join("|") === Object.keys(NEW).join("|"), JSON.stringify(f.cards.map((c) => c.name)));
    for (const [outlet, hrefs] of Object.entries(NEW)) {
      const c = f.cards.find((x) => x.name === outlet);
      const ls = fl.filter((l) => l.label.startsWith(`${outlet}: `));
      check(`${label} founder: ${outlet} card: logo (alt, lazy), its links in a new tab with noopener`, c && c.alt === outlet && c.lazy === "lazy" && ls.map((l) => l.href).join("|") === hrefs.join("|") && ls.every(ext), JSON.stringify({ c: c && { alt: c.alt, lazy: c.lazy }, ls }));
    }
    const clap = f.cards.find((x) => x.name === "Clap Pakistan");
    check(`${label} founder: Clap Pakistan card shows the article headline, "read the article" and "view on Instagram"`, clap && clap.text.includes(HEADLINE) && /read the article/.test(clap.text) && /view on Instagram/.test(clap.text));
    check(`${label} founder: Express Tribune "featured on Instagram", Verified Pakistan "featured on LinkedIn"`, /featured on Instagram/.test(f.cards[0].text) && /featured on LinkedIn/.test(f.cards[1].text));
    const tfd = f.cards.find((x) => x.name === "The Financial Daily");
    check(`${label} founder: The Financial Daily card: "articles featuring Majid Shah Bukhari" and the article titles as links`, tfd && /articles featuring Majid Shah Bukhari/.test(tfd.text) && /Degrees without skills/.test(tfd.text) && /64% of nation wasted to ignorance/.test(tfd.text) && !/articles by/.test(tfd.text), tfd && tfd.text.slice(0, 300));
    check(`${label} founder: meta description mentions the coverage`, /founder of tdc/.test(f.meta) && /featured in Express Tribune, Verified Pakistan, Clap Pakistan, The Financial Daily, /.test(f.meta), f.meta);
    check(`${label} founder: no page scroll sideways`, f.sideways <= 0, String(f.sideways));
    const cardLink = `[data-press="cards"] .press-card:first-child`;
    const cPlain = await ev(`getComputedStyle(document.querySelector('${cardLink} img')).filter`);
    check(`${label} founder: card logos greyscale by default`, /grayscale\(1\)/.test(cPlain), cPlain);
    const pa = await ev(`(() => { const p = document.querySelector('[data-partners="cards"]'); const s = document.querySelector('[data-press="cards"]'); return p && { heading: p.querySelector("h2")?.innerText.trim(), after: !!(s.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING), text: p.innerText, alt: p.querySelector("img")?.alt, lazy: p.querySelector("img")?.getAttribute("loading") }; })()`);
    const pal = (await links('[data-partners="cards"]'))[0];
    check(`${label} founder: "partners" section after "featured in": Ziauddin University, "MoU signed with The Deft Crew", link in a new tab`, pa && /^partners/.test(pa.heading) && pa.after && /MoU signed with The Deft Crew/.test(pa.text) && pa.alt === "Ziauddin University" && pa.lazy === "lazy" && pal && pal.href === "https://zu.edu.pk/mou-with-the-deft-crew/" && ext(pal), JSON.stringify({ pa, pal }));
    const storyText = await ev(`document.querySelector("main").innerText`);
    check(`${label} founder: the story says "his views on Pakistan's youth skills gap have been featured in The Financial Daily."`, storyText.includes("his views on Pakistan's youth skills gap have been featured in The Financial Daily.") && !/speaks and writes/.test(storyText));
    await logosLoad(`${label} founder`, '[data-press="cards"] img, [data-partners="cards"] img', 7);
    await audit(`${label} founder`);
  }
  // the PNG fallbacks are served too (browsers without WebP use them)
  for (const src of pngs) {
    const r = await ev(`fetch(${JSON.stringify(src)}).then((x) => x.status + " " + x.headers.get("content-type")).catch((e) => String(e))`);
    check(`PNG fallback ${src}: ${r}`, /^200 image\/png/.test(r));
  }
  check("7 different logos, each with its PNG fallback", pngs.size === 7, [...pngs].join(" "));
  const text = await ev(`document.body.innerText`);
  check("plain copy: no em dashes, no \"as seen on\" / \"as featured in\"", !/—/.test(text) && !/as seen on|as featured in/i.test(text));
  check("no page or console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
  check("axe: no WCAG 2 A/AA violations", axeTotal === 0);
  await b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
