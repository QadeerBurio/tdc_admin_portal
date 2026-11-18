// node modal-scroll-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Modals scroll (fix/modal-scroll), against a mock API, at desktop and phone size:
// - metrics page -> "engagement details" -> a metric's details: a long user list (150 rows, a wide table)
// - the modal fits the screen (100dvh minus a margin; full screen on a phone); header and footer stay put
// - only the body scrolls: mouse wheel (desktop) / touch swipe (phone) and keys (End, Page Up, Home) reach the last
//   row, which is then fully visible; wide tables scroll sideways inside the modal, the page never does
// - the page behind doesn't move while the modal is open and is back at the same place after closing
// - Tab stays inside, Escape and the close button close; axe-core WCAG 2 A / AA on the open modal
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep, viewport } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5203, API = Number(process.env.CHECK_API_PORT) || 5204;

const ENGAGEMENT = {
  range: { weeks: 8, fromDay: "2026-09-25", toDay: "2026-11-19", timeZone: "Asia/Karachi" }, exclusions: { test: "test accounts left out" },
  totalProfiles: 150, activeUsers: 90, badgesEarned: 12, pushSent: 40, pushDelivered: 40, pushFailed: 1, pushQueued: 0, pushAwaitingReceipt: 0, pushOpened: 10, pushOpenRate: 0.25,
  rewardsRedeemed: 2, codesIssued: 2, totalDrops: 3, totalDropReactions: 9, totalPointsAwarded: 1200, fullySortedCount: 1, examModeActive: 1,
  totalReferrals: 2, studentsWhoInvited: 2, invitedSignups: 1, avgStreak: 1.5, longestStreak: 9,
  weeklyUsers: Array.from({ length: 8 }, (_, i) => ({ _id: { week: 38 + i, year: 2026 }, weekStart: `2026-10-${String(1 + i * 3).padStart(2, "0")}`, users: 10 + i })),
  missionBreakdown: {}, levelBreakdown: {}, topBadges: [], eventBreakdown: {},
};
// a long list with a long, unbreakable detail column (the table is wider than a phone)
const USERS = Array.from({ length: 150 }, (_, i) => ({ _id: `6aed${String(i).padStart(20, "0")}`, name: `Student ${i + 1}`, email: `student${i + 1}@example.com`, role: "student", detail: `opened-the-app-${i + 1}-times-this-week-and-claimed-offers-at-several-brands`, when: new Date(Date.now() - i * 3600e3).toISOString() }));

function handle(method, url) {
  const p = url.split("?")[0];
  if (method !== "GET") return { success: true };
  if (p === "/api/analytics/admin/metrics") return require("./mock-admin-metrics").metrics();
  if (p === "/api/admin/engagement/metrics") return ENGAGEMENT;
  if (p === "/api/admin/engagement/drilldown") return { items: USERS };
  return undefined;
}
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  q.on("data", () => {});
  q.on("end", () => { const out = handle(q.method, q.url); s.writeHead(200, h); s.end(JSON.stringify(out !== undefined ? out : (q.method === "GET" ? [] : { success: true }))); });
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  require("./serve").send(f, s, API);
}).listen(WEB);

(async () => {
  const b = await launch(9431);
  let bad = 0;
  const check = (label, ok, detail = "") => { if (!ok) bad = 1; console.log(`${ok ? "ok  " : "FAIL"} ${label}${!ok && detail ? `  (${detail})` : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const ev = (js) => pg.evaluate(js);
  const key = async (k, code, vk, shift = false) => {
    await pg.s("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk, modifiers: shift ? 8 : 0 });
    await pg.s("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk, modifiers: shift ? 8 : 0 });
    await sleep(120);
  };
  const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  let axeTotal = 0;
  const audit = async (label) => {
    await ev(AXE + ";true");
    const v = await ev(`(async () => { const r = await axe.run(document.querySelector(".k-modal") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    axeTotal += v.length;
    console.log(`axe ${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };
  // geometry of the open modal
  const geo = () => ev(`(() => {
    const m = document.querySelector(".k-modal"), b = m && m.querySelector("[data-kit-body]"), h = m && m.querySelector(".k-modal-head");
    if (!m) return null;
    const r = m.getBoundingClientRect(), br = b.getBoundingClientRect(), hr = h.getBoundingClientRect();
    const rows = b.querySelectorAll("tbody tr"), last = rows[rows.length - 1], lr = last && last.getBoundingClientRect();
    const scroller = b.querySelector(".k-table-scroll");
    return { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height, vw: innerWidth, vh: innerHeight,
      bodyTop: br.top, bodyBottom: br.bottom, scrollTop: b.scrollTop, scrollHeight: b.scrollHeight, clientHeight: b.clientHeight,
      headTop: hr.top, rows: rows.length, lastTop: lr && lr.top, lastBottom: lr && lr.bottom, lastText: last && last.innerText.split("\\n")[0],
      tableWide: scroller ? scroller.scrollWidth > scroller.clientWidth : false, pageWide: document.documentElement.scrollWidth > innerWidth + 1,
      locked: document.body.style.position === "fixed", focusInside: m.contains(document.activeElement) };
  })()`);

  const admin = { _id: "6aecffffffffffffffffffff", id: "6aecffffffffffffffffffff", role: "admin", name: "Ayesha Admin" };
  for (const [label, w, h, mobile] of [["desktop", 1366, 760, false], ["phone", 390, 740, true]]) {
    console.log(`-- ${label} ${w}x${h}`);
    await viewport(pg, w, h, mobile);
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await ev(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(admin)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}/admin`);
    await sleep(2500);
    await ev(`document.querySelector('.tdcp-nav [data-page="engagement_metrics"]')?.click(); true`);
    await sleep(1500);
    await ev(`[...document.querySelectorAll("[role=tab]")].find((x) => x.innerText.trim().toLowerCase() === "engagement details")?.click(); true`);
    await pg.waitFor(`[...document.querySelectorAll("button, [role=button]")].some((x) => /total profiles/.test(x.innerText))`, { label: "the engagement cards" });
    // the page behind is long and scrolled down a bit before the modal opens
    await ev(`window.scrollTo(0, 400); true`);
    await sleep(200);
    const pageY = await ev(`window.scrollY`);
    await ev(`[...document.querySelectorAll("button, [role=button]")].find((x) => /total profiles/.test(x.innerText))?.click(); true`);
    await pg.waitFor(`document.querySelectorAll(".k-modal tbody tr").length === 150`, { label: "150 rows in the modal" });
    await sleep(400);
    let g = await geo();
    check(`${label}: the details modal opens with 150 rows`, g && g.rows === 150);
    check(`${label}: the modal fits the screen (${Math.round(g.height)} of ${g.vh} px)`, g.top >= -0.5 && g.bottom <= g.vh + 0.5, JSON.stringify({ top: g.top, bottom: g.bottom, vh: g.vh }));
    if (mobile) check(`${label}: full screen on a phone`, Math.abs(g.width - g.vw) < 1 && Math.abs(g.height - g.vh) < 1 && g.top < 1, JSON.stringify({ w: g.width, h: g.height }));
    check(`${label}: the body has more than fits, and scrolls`, g.scrollHeight > g.clientHeight + 200 && g.scrollTop === 0, JSON.stringify({ sh: g.scrollHeight, ch: g.clientHeight }));
    check(`${label}: the last row starts out of view (so the test means something)`, g.lastTop > g.bodyBottom);
    check(`${label}: the page behind was scrolled before opening (${pageY}px)`, pageY > 100);
    check(`${label}: the page behind is locked`, g.locked);
    check(`${label}: focus is inside the modal`, g.focusInside);
    const headTop0 = g.headTop;

    // wheel (desktop) / swipe (phone) inside the body
    const cx = Math.round(g.left + g.width / 2), cy = Math.round((g.bodyTop + g.bodyBottom) / 2);
    if (!mobile) {
      for (let i = 0; i < 6; i++) await pg.s("Input.dispatchMouseEvent", { type: "mouseWheel", x: cx, y: cy, deltaX: 0, deltaY: 600 });
    } else {
      await pg.s("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
      // a finger swipe: touch start, moves upward, end (three swipes)
      for (let sw = 0; sw < 3; sw++) {
        const y0 = cy + 200, y1 = cy - 200;
        await pg.s("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: y0, id: 1 }] });
        for (let k = 1; k <= 12; k++) { await pg.s("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx, y: Math.round(y0 + ((y1 - y0) * k) / 12), id: 1 }] }); await sleep(16); }
        await pg.s("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await sleep(150);
      }
    }
    await sleep(600);
    g = await geo();
    check(`${label}: ${mobile ? "a swipe" : "the mouse wheel"} scrolls the modal body (${g.scrollTop}px)`, g.scrollTop > 300, String(g.scrollTop));
    check(`${label}: the header stays put`, Math.abs(g.headTop - headTop0) < 1);
    // locked: the page is pinned where it was (body top = -pageY) and the window itself can't move
    const pinned = await ev(`document.body.style.top`);
    check(`${label}: the page behind didn't move (pinned at ${pageY}px)`, pinned === `-${pageY}px` && (await ev(`window.scrollY`)) === 0, `${pinned} ${await ev("window.scrollY")}`);

    // keys: End -> the last row is fully visible; Page Up moves back; Home -> top
    await ev(`document.querySelector(".k-modal [aria-label='close']")?.focus(); true`);
    await key("End", "End", 35);
    await sleep(300);
    g = await geo();
    check(`${label}: End (focus on the close button) scrolls to the last row, fully visible`, g.lastBottom <= g.bodyBottom + 1 && g.lastTop >= g.bodyTop - 1 && g.lastBottom <= g.vh, JSON.stringify({ lastTop: g.lastTop, lastBottom: g.lastBottom, bodyTop: g.bodyTop, bodyBottom: g.bodyBottom, vh: g.vh }));
    check(`${label}: …it's Student 150`, (await ev(`document.querySelector(".k-modal tbody tr:last-child")?.innerText || ""`)).includes("Student 150"));
    const atEnd = g.scrollTop;
    await key("PageUp", "PageUp", 33);
    g = await geo();
    check(`${label}: Page Up scrolls back up`, g.scrollTop < atEnd - 100, `${g.scrollTop} vs ${atEnd}`);
    await key("PageDown", "PageDown", 34);
    check(`${label}: Page Down scrolls down`, (await geo()).scrollTop > g.scrollTop + 100);
    await key("Home", "Home", 36);
    check(`${label}: Home back to the top`, (await geo()).scrollTop === 0);

    // wide table: sideways inside the modal, never the page
    g = await geo();
    if (mobile) check(`${label}: the wide table scrolls sideways inside the modal`, g.tableWide);
    check(`${label}: the page itself never scrolls sideways`, !g.pageWide);

    // Tab stays inside
    let inside = true;
    for (let i = 0; i < 8; i++) { await key("Tab", "Tab", 9, i % 2 === 1); inside = inside && (await ev(`document.querySelector(".k-modal").contains(document.activeElement)`)); }
    check(`${label}: Tab and Shift+Tab stay inside the modal`, inside);

    await audit(`${label}: details modal`);

    // Escape closes; the page is back where it was
    await key("Escape", "Escape", 27);
    await sleep(300);
    check(`${label}: Escape closes it`, !(await ev(`!!document.querySelector(".k-modal")`)));
    check(`${label}: the page is unlocked and back at the same place`, (await ev(`document.body.style.position`)) === "" && (await ev(`window.scrollY`)) === pageY, `${await ev("window.scrollY")} vs ${pageY}`);
    // the close button too
    await ev(`[...document.querySelectorAll("button, [role=button]")].find((x) => /total profiles/.test(x.innerText))?.click(); true`);
    await pg.waitFor(`!!document.querySelector(".k-modal [aria-label='close']")`, { label: "modal again" });
    await ev(`document.querySelector(".k-modal [aria-label='close']").click(); true`);
    await sleep(300);
    check(`${label}: the close button closes it`, !(await ev(`!!document.querySelector(".k-modal")`)) && (await ev(`document.body.style.position`)) === "");
  }

  check("no page errors, no console errors", errs.length === 0, errs.slice(0, 3).join(" | "));
  console.log(`A11Y_TOTAL=${axeTotal}`);
  if (axeTotal) bad = 1;
  await b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
