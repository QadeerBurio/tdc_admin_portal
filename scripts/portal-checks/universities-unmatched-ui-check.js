// node universities-unmatched-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Admin → universities → "unmatched names" (feat/uni-match), against a mock API, at desktop and phone size:
// - counts on top (unmatched names, students affected, matched today)
// - grouped: high confidence first (all ticked), then medium / low (suggestion + dropdown), then none (add as new / pick)
// - nothing is written by opening the page, ticking boxes or opening the confirm: only the confirm's button writes
// - "match all selected": the confirm shows the count, students and up to 5 examples ("and N more"); one bulk call
//   with every ticked name and its suggestion; the list reloads without them
// - a medium name matched to another university from its dropdown: one call with that university
// - no page scroll sideways; axe-core WCAG 2 A / AA on the page and on the open confirm; no page or console errors
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep, viewport } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5207, API = Number(process.env.CHECK_API_PORT) || 5208;

const U = (id, name, shortName, city) => ({ id, name, shortName, city, status: "approved" });
const IOBM = U("u1", "Institute of Business Management", "IoBM", "Karachi");
const NED = U("u2", "NED University of Engineering & Technology", "NED", "Karachi");
const KU = U("u3", "University of Karachi", "KU", "Karachi");
const UETL = U("u4", "University of Engineering & Technology, Lahore", "UET", "Lahore");
const UETP = U("u5", "University of Engineering & Technology, Peshawar", "UET", "Peshawar");
const GCU = U("u6", "Government College University, Lahore", "GCU", "Lahore");
const START = () => [
  ...["IOBM", "iobm karachi", "Inst of Business Mgmt", "  iObM  KARACHI "].map((n, i) => ({ id: `h${i}`, name: n, students: 3 + i, confidence: "high", score: 1, reason: "short name / initials", suggestion: IOBM, alternatives: [] })),
  ...["NED Univ", "NED University of Engineering and Technology — Karachi"].map((n, i) => ({ id: `n${i}`, name: n, students: 2, confidence: "high", score: 1, reason: "a known other name", suggestion: NED, alternatives: [] })),
  { id: "k0", name: "Karachi University", students: 5, confidence: "high", score: 1, reason: "a known other name", suggestion: KU, alternatives: [] },
  { id: "m0", name: "UET", students: 4, confidence: "medium", score: 1, reason: "short name / initials, but also close to University of Engineering & Technology, Peshawar", suggestion: UETL, alternatives: [{ ...UETP, score: 1 }] },
  { id: "m1", name: "Govt College Lahore", students: 1, confidence: "medium", score: 0.77, reason: "nearly the same words", suggestion: GCU, alternatives: [] },
  { id: "l0", name: "Karachi", students: 1, confidence: "low", score: 0.67, reason: "nearly the same words", suggestion: KU, alternatives: [] },
  { id: "z0", name: "Some College Nobody Knows Of In A Very Long Name That Wraps", students: 1, confidence: "none", score: 0.32, reason: "", suggestion: null, alternatives: [{ ...GCU, score: 0.32 }] },
];
let state = START();
let matchedToday = 0;
const writes = [];

function handle(method, url, body) {
  const p = url.split("?")[0];
  if (method !== "GET") {
    writes.push({ method, p, body });
    if (p === "/api/admin/universities/unmatched/match-bulk") {
      const ids = new Set((body.items || []).map((x) => x.id));
      const moved = state.filter((r) => ids.has(r.id));
      state = state.filter((r) => !ids.has(r.id));
      matchedToday += moved.length;
      return { success: true, data: { matched: moved.length, students: moved.reduce((a, r) => a + r.students, 0), failed: [], results: [] } };
    }
    const m = /^\/api\/admin\/universities\/unmatched\/([^/]+)\/match$/.exec(p);
    if (m) {
      const r = state.find((x) => x.id === m[1]);
      state = state.filter((x) => x.id !== m[1]);
      matchedToday += 1;
      const to = [IOBM, NED, KU, UETL, UETP, GCU].find((u) => u.id === body.toId);
      return { success: true, data: { from: { name: r?.name }, to, moved: { students: r?.students || 0 } } };
    }
    return { success: true };
  }
  if (p === "/api/admin/universities/cities") return { success: true, data: ["Karachi", "Lahore", "Peshawar"] };
  if (p === "/api/admin/universities/unmatched/summary") return { success: true, data: { unmatched: state.length, students: state.reduce((a, r) => a + r.students, 0), matchedToday } };
  if (p === "/api/admin/universities/unmatched") return { success: true, data: state };
  if (p === "/api/admin/universities") return { success: true, data: [] };
  if (p === "/api/universities") return { success: true, data: [IOBM, NED, KU, UETL, UETP, GCU] };
  return undefined;
}
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  let raw = "";
  q.on("data", (c) => { raw += c; });
  q.on("end", () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
    const out = handle(q.method, q.url, body);
    s.writeHead(200, h);
    s.end(JSON.stringify(out !== undefined ? out : (q.method === "GET" ? [] : { success: true })));
  });
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  require("./serve").send(f, s, API);
}).listen(WEB);

(async () => {
  const b = await launch(9433);
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
  const audit = async (label, scope) => {
    await ev(AXE + ";true");
    const v = await ev(`(async () => { const r = await axe.run(document.querySelector(${JSON.stringify(scope)}) || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    axeTotal += v.length;
    console.log(`axe ${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };
  const clickButton = (re) => ev(`(() => { const b = [...document.querySelectorAll("button")].find((x) => ${re}.test((x.getAttribute("aria-label") || x.innerText).trim())); if (b && !b.disabled) { b.click(); return true; } return false; })()`);
  const SCREEN = `[data-screen="admin-universities-unmatched"]`;

  const admin = { _id: "6aecffffffffffffffffffff", id: "6aecffffffffffffffffffff", role: "admin", name: "Ayesha Admin" };
  for (const [label, w, h, mobile] of [["desktop", 1366, 760, false], ["phone", 390, 740, true]]) {
    console.log(`-- ${label} ${w}x${h}`);
    state = START(); matchedToday = 2; writes.length = 0;
    await viewport(pg, w, h, mobile);
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await ev(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(admin)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}/admin`);
    await pg.waitFor(`!!document.querySelector('.tdcp-nav [data-page="universities"]')`, { label: "the universities menu item" });
    await ev(`document.querySelector('.tdcp-nav [data-page="universities"]').click(); true`);
    await pg.waitFor(`[...document.querySelectorAll("[role=tab]")].some((x) => /unmatched names/.test(x.innerText))`, { label: "the unmatched tab" });
    await ev(`[...document.querySelectorAll("[role=tab]")].find((x) => /unmatched names/.test(x.innerText)).click(); true`);
    await pg.waitFor(`document.querySelectorAll('${SCREEN} section h3').length === 3`, { label: "three groups" });
    await sleep(1200); // the counts count up

    const page = await ev(`(() => {
      const root = document.querySelector('${SCREEN}');
      const counts = [...root.querySelectorAll('[aria-label="unmatched counts"] .k-stat')].map((s) => s.innerText.replace(/\\s+/g, " ").trim());
      const heads = [...root.querySelectorAll("section h3")].map((x) => x.innerText.trim());
      const high = [...root.querySelectorAll('section[data-group="high"] tbody input[type=checkbox]')];
      return { counts, heads, high: high.length, ticked: high.filter((c) => c.checked).length, sideways: document.scrollingElement.scrollWidth - innerWidth,
        selects: root.querySelectorAll('section[data-group="review"] select').length, addNew: [...root.querySelectorAll("button")].filter((x) => /as new$/.test(x.getAttribute("aria-label") || "")).length };
    })()`);
    check(`${label}: counts: 11 unmatched names, 34 students affected, 2 matched today`, page.counts.some((c) => /unmatched names 11/.test(c)) && page.counts.some((c) => /students affected 34/.test(c)) && page.counts.some((c) => /matched today 2/.test(c)), JSON.stringify(page.counts));
    check(`${label}: grouped high → medium / low → none`, page.heads.join(" | ") === "high confidence · 7 | medium and low confidence · 3 | no likely match · 1", page.heads.join(" | "));
    check(`${label}: 7 high names, all ticked`, page.high === 7 && page.ticked === 7);
    check(`${label}: medium / low names each have a dropdown; add as new on the rest`, page.selects === 3 && page.addNew === 4, JSON.stringify(page));
    check(`${label}: no page scroll sideways`, page.sideways <= 0, String(page.sideways));
    await audit(`${label} unmatched names`, SCREEN);

    // untick one, open the confirm: nothing written yet
    await ev(`document.querySelector('[aria-label="select Karachi University"]').click(); true`);
    await sleep(150);
    check(`${label}: unticking one: "match all selected (6)"`, await clickButton(/^match all selected \(6\)$/));
    await pg.waitFor(`!!document.querySelector(".k-modal")`, { label: "the confirm" });
    const dlg = await ev(`(() => { const m = document.querySelector(".k-modal"); return { title: m.querySelector(".k-modal-head")?.innerText || "", text: m.innerText, items: [...m.querySelectorAll('[aria-label="examples"] li')].map((li) => li.innerText) }; })()`);
    check(`${label}: the confirm shows the count and students`, /match 6 names\?/.test(dlg.title) && /22 students move/.test(dlg.text), dlg.text.slice(0, 200));
    check(`${label}: …5 examples (typed → official) and "and 1 more"`, dlg.items.length === 5 && /^IOBM → Institute of Business Management/.test(dlg.items[0]) && /and 1 more/.test(dlg.text), JSON.stringify(dlg.items));
    check(`${label}: nothing written before the confirm`, writes.length === 0, JSON.stringify(writes));
    await audit(`${label} the bulk confirm`, ".k-modal");
    check(`${label}: confirm`, await clickButton(/^match 6$/));
    await pg.waitFor(`document.querySelectorAll('${SCREEN} section h3').length === 3 && /high confidence · 1/.test(document.querySelector('${SCREEN}').innerText)`, { label: "the list reloaded" });
    const bulk = writes.filter((x) => x.p === "/api/admin/universities/unmatched/match-bulk");
    check(`${label}: one bulk call with the 6 ticked names and their suggestions`, writes.length === 1 && bulk.length === 1 && bulk[0].body.items.length === 6 && bulk[0].body.items.every((it) => (it.id.startsWith("h") && it.toId === "u1") || (it.id.startsWith("n") && it.toId === "u2")), JSON.stringify(writes));
    await sleep(1000);
    const after = await ev(`[...document.querySelectorAll('${SCREEN} [aria-label="unmatched counts"] .k-stat')].map((s) => s.innerText.replace(/\\s+/g, " ").trim()).join(" | ")`);
    check(`${label}: counts after: 5 left, 8 matched today`, /unmatched names 5/.test(after) && /matched today 8/.test(after), after);

    // a medium one, matched to another university from its dropdown
    await ev(`(() => { const s = document.querySelector('[aria-label="match UET to"]'); const set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set; set.call(s, "u5"); s.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
    await sleep(150);
    check(`${label}: "match UET" with the picked university`, await clickButton(/^match UET$/));
    await pg.waitFor(`!!document.querySelector(".k-modal")`, { label: "the single confirm" });
    const one = await ev(`document.querySelector(".k-modal").innerText`);
    check(`${label}: the confirm names the picked university`, /4 students move to University of Engineering & Technology, Peshawar/.test(one), one.slice(0, 200));
    check(`${label}: still nothing more written`, writes.length === 1);
    check(`${label}: confirm`, await clickButton(/^move to UET$/));
    await pg.waitFor(`!document.querySelector('[aria-label="match UET to"]')`, { label: "UET matched" });
    const single = writes.filter((x) => /\/unmatched\/m0\/match$/.test(x.p));
    check(`${label}: one call: UET → the Peshawar campus`, single.length === 1 && single[0].body.toId === "u5" && writes.length === 2, JSON.stringify(writes.slice(1)));
  }
  check("no page or console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
  check("axe: no WCAG 2 A/AA violations", axeTotal === 0);
  await b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
