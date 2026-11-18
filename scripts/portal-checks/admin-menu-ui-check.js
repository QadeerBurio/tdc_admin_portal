// node --experimental-websocket admin-menu-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// The admin side menu (feat/admin-menu), against a mock API:
// - groups in order (general, users, student app, brands, employers, engagement, settings) with their items, every item
//   opening its page with a matching title (heading and browser tab); no duplicates
// - badges for what's waiting (brand approvals 3, student verifications 2, company verifications 2, hire disputes 1),
//   none at 0 (ratings reports)
// - search filters by name; groups collapse (aria-expanded), stay closed after a reload (per admin), and the active
//   item's group opens by itself; arrow keys and Enter work
// - old URLs (/adminoffers, /adminjobsmanager, /adminexchangemanage, /admin/brands-revenue) land on the page in the
//   admin portal
// - mobile: the menu is a drawer with the same groups, the signed-in admin at the bottom
// - axe-core WCAG 2 A / AA on the menu (desktop, searching, mobile drawer); no console errors
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep, viewport } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5196, API = Number(process.env.CHECK_API_PORT) || 5197; // run.js gives each check its own ports when they run side by side
const ok = (data) => ({ success: true, data, requestId: "mock" });

const student = (i, status) => ({ _id: `6aeb000000000000000000${String(i).padStart(2, "0")}`, name: `Student ${i}`, email: `s${i}@example.com`, role: "student", status, referralCount: 0 });
const STUDENTS = [student(1, "Verified"), student(2, "Verified"), student(3, "Pending"), student(4, "Verified"), student(5, "Not Verified")];

function handle(method, url) {
  const p = url.split("?")[0];
  if (method !== "GET") return { success: true };
  if (p === "/api/admin/users/student") return STUDENTS;
  if (p === "/api/brand-approval") return { success: true, stats: { pending: 3, approved: 10, rejected: 1, total: 14 }, brands: [] };
  const verification = (id, companyName) => ({ id, companyName, status: "pending", registrationType: "ntn", ntnOrSecp: "1234567", businessEmailDomain: "example.com", website: "example.com", submittedAt: new Date().toISOString(), hints: { signInEmailMatchesDomain: true, websiteMatchesDomain: true }, duplicateOf: [], reason: "", employer: { id: `e-${id}`, name: "Omar", email: "omar@example.com", accountStatus: "Not Verified" } });
  if (p === "/api/career/admin/verifications" || p === "/api/career/admin/company-verifications") return ok([verification("v1", "Bright Labs"), verification("v2", "Hire Co")]);
  if (p === "/api/career/admin/disputes") return ok({ disputes: [{ applicationId: "a1", job: { id: "j1", title: "Intern" }, candidate: { id: "c1", name: "Sana" }, employer: { id: "e1", name: "Hire Co" }, reason: "not hired", raisedAt: new Date().toISOString(), resolvable: true }] });
  if (p === "/api/career/admin/applications") return ok({ total: 0, applications: [] });
  if (p === "/api/admin/features/flags") return ok([{ flag: "loyaltyV2", label: "Loyalty", roles: ["brand", "student"], killed: false, railway: "not set", railwayIdCount: 0, adminAccessCount: 0, forcedOffCount: 0, studentDefaultable: true, studentDefault: { enabled: true }, defaults: { student: { enabled: true, set: false }, brand: { enabled: true, set: false } } }]);
  if (p.startsWith("/api/admin/features/flag/")) return ok({ flag: "loyaltyV2", label: "Loyalty", roles: ["brand", "student"], killed: false, railwayIdCount: 0, total: 0, offset: 0, limit: 50, accounts: [] });
  if (p === "/api/career/ratings/admin/reports") return ok([]);
  if (p === "/api/admin/card-stats") return { pending: 0, approvedTotal: 0, totalRevenue: null, revenueTracked: false };
  if (p === "/api/admin/bookings/stats") return { totalBookings: 0, pendingBookings: 0, confirmedBookings: 0, totalRevenue: 0 };
  if (p === "/api/admin/actions") return ok({ rows: [], next: null });
  if (p === "/api/admin/universities/pending-count") return ok({ pending: 4 }); // students' "my university isn't listed" requests
  if (p === "/api/admin/actions/facets") return ok({ actions: [], targetTypes: [], admins: [] });
  if (p === "/api/analytics/admin/metrics") return require("./mock-admin-metrics").metrics();
  return undefined;
}

http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  q.on("data", () => {});
  q.on("end", () => {
    const out = handle(q.method, q.url);
    s.writeHead(200, h);
    s.end(JSON.stringify(out !== undefined ? out : (q.method === "GET" ? [] : { success: true })));
  });
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  require("./serve").send(f, s, API); // the build, with this check's mock API port
}).listen(WEB);

const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
const MENU = [
  ["general", ["dashboard", "overview", "metrics", "admin actions"]],
  ["users", ["all students", "all brands", "all employers", "all travelers", "student verifications", "universities", "student cards"]],
  ["student app", ["jobs & internships", "scholarships", "events", "travel", "AI travel plans", "rewards"]],
  ["brands", ["brand approvals", "offers", "loyalty programs", "loyalty exceptions", "surprise boxes", "brand revenue"]],
  ["employers", ["company verifications", "hiring overview", "hiring funnel", "hire disputes", "ratings reports", "first hire free", "hiring plans"]],
  ["engagement", ["daily drops", "push test"]],
  ["crew", ["crew inbox", "crew partners", "crew campaigns", "crew credentials"]],
  ["settings", ["features"]],
];

(async () => {
  const b = await launch(9431);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail !== "" && !cond ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  await viewport(pg, 1280, 900, false);
  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "Ayesha Admin" };
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.clear(); localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(admin)})); true`);
  const axe = async (label) => {
    await pg.evaluate(AXE + "; true");
    const v = await pg.evaluate(`(async () => { const r = await axe.run(document.querySelector(".tdcp-nav") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(" ") })); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, JSON.stringify(v));
  };
  const menu = () => pg.evaluate(`[...document.querySelectorAll(".tdcp-nav [data-group]")].map((g) => ({ title: g.querySelector(".tdcp-nav-toggle .lbl")?.innerText.trim() || "", expanded: g.querySelector(".tdcp-nav-toggle")?.getAttribute("aria-expanded"), items: [...g.querySelectorAll("[data-page]")].filter((x) => x.offsetParent !== null).map((x) => ({ id: x.dataset.page, label: x.querySelector(".lbl").innerText.trim(), badge: x.querySelector(".tdcp-nav-badge")?.innerText || null, current: x.getAttribute("aria-current") })) }))`);
  const clickPage = (id) => pg.evaluate(`(() => { const e = document.querySelector('.tdcp-nav [data-page="${id}"]'); if (e) e.click(); return !!e; })()`);
  // wait for what the next check reads (a timeout is logged, then the check reports what it saw)
  const w = (expr, label, timeout = 20000) => pg.waitFor(expr, { timeout, label }).catch((e) => console.log("    (" + e.message + ")"));
  const heading = () => pg.evaluate(`(() => { const h = [...document.querySelectorAll("main h1, .tdcp-main h1, h1")].map((x) => x.innerText.trim()).filter(Boolean); return h.join(" | "); })()`);

  console.log("── the menu");
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  // the menu and all five waiting badges the next check reads (each from its own page's call) are in
  await w(`document.querySelectorAll(".tdcp-nav [data-group]").length >= 8 && ["brand_approval", "student_verifications", "company_verifications", "hire_disputes", "universities"].every((id) => !!document.querySelector(\`.tdcp-nav [data-page="\${id}"] .tdcp-nav-badge\`))`, "the admin menu with its five badges");
  await pg.idle();
  let m = await menu();
  check("groups in order with their items (every pilot set up in this mock)", JSON.stringify(m.map((g) => [g.title, g.items.map((i) => i.label)])) === JSON.stringify(MENU), JSON.stringify(m.map((g) => [g.title, g.items.map((i) => i.label)])));
  const allIds = m.flatMap((g) => g.items.map((i) => i.id));
  check("no duplicate items", new Set(allIds).size === allIds.length);
  check("every group open by default, dashboard highlighted", m.every((g) => g.expanded === "true") && m[0].items[0].current === "page");
  const badge = (id) => m.flatMap((g) => g.items).find((i) => i.id === id)?.badge;
  check("badges: brand approvals 3, student verifications 2, company verifications 2, hire disputes 1, university requests 4", badge("brand_approval") === "3" && badge("student_verifications") === "2" && badge("company_verifications") === "2" && badge("hire_disputes") === "1" && badge("universities") === "4", JSON.stringify(m.flatMap((g) => g.items).filter((i) => i.badge)));
  check("…no badge at 0 (ratings reports) or with nothing waiting (loyalty exceptions)", badge("ratings_reports") === null && badge("loyalty_exceptions") === null);
  check("the signed-in admin at the bottom of the menu", await pg.evaluate(`(() => { const u = document.querySelector(".tdcp-nav-user"); return !!u && u.innerText.includes("Ayesha Admin") && u === document.querySelector(".tdcp-nav").lastElementChild; })()`));
  await axe("admin menu (desktop)");

  console.log("── every item opens its page, titled like the menu");
  const titled = [];
  for (const [, items] of MENU) for (const label of items) {
    const id = m.flatMap((g) => g.items).find((i) => i.label === label)?.id;
    await clickPage(id);
    // the page is open: the tab title, the highlighted item and (but on the dashboard) a heading
    await w(`document.title === ${JSON.stringify(label + " · tdc admin")} && document.querySelector('.tdcp-nav [aria-current="page"]')?.dataset.page === ${JSON.stringify(id)} && (${label === "dashboard"} || [...document.querySelectorAll("main h1, .tdcp-main h1, h1")].some((x) => x.innerText.trim().length > 0))`, `the ${label} page`);
    const st = await pg.evaluate(`({ title: document.title, current: document.querySelector('.tdcp-nav [aria-current="page"]')?.dataset.page || "" })`);
    const h = await heading();
    const titleOk = st.title === `${label} · tdc admin` && st.current === id;
    // the dashboard's own heading is a greeting; offers shows its tabs
    const headOk = label === "dashboard" || (label === "offers" ? /offers/.test(h) : h.toLowerCase().includes(label.toLowerCase()));
    if (!titleOk || !headOk) titled.push(`${label}: tab "${st.title}", heading "${h}", current ${st.current}`);
  }
  check("each of the 35 items opens its page; the browser tab and the page heading use the menu name", titled.length === 0, titled.join(" ;; "));
  await clickPage("offers");
  await w(`document.querySelectorAll('[data-screen="admin-offers-tabs"] [role=tab]').length === 2`, "the offers tabs");
  const tabs = await pg.evaluate(`[...document.querySelectorAll('[data-screen="admin-offers-tabs"] [role=tab]')].map((t) => t.innerText.trim() + (t.getAttribute("aria-selected") === "true" ? "*" : ""))`);
  check("offers: one page with tabs 'all offers' (open) and 'new offer'", JSON.stringify(tabs) === JSON.stringify(["all offers*", "new offer"]), JSON.stringify(tabs));
  await pg.evaluate(`[...document.querySelectorAll('[data-screen="admin-offers-tabs"] [role=tab]')].find((t) => t.innerText.trim() === "new offer").click(); true`);
  await w(`[...document.querySelectorAll("main h1, .tdcp-main h1, h1")].some((x) => /new offer/i.test(x.innerText))`, "the new offer form");
  check("…'new offer' shows the create form", /new offer/i.test(await heading()));
  await clickPage("student_verifications");
  await w(`/Student 3/.test(document.querySelector(".tdcp-main")?.innerText || "")`, "the students waiting for approval");
  await pg.idle();
  const sv = await pg.evaluate(`document.querySelector(".tdcp-main")?.innerText || document.body.innerText`);
  check("student verifications: all students filtered to the 2 waiting for approval", /student verifications/.test(sv) && /Student 3/.test(sv) && /Student 5/.test(sv) && !/Student 1\b/.test(sv), sv.slice(0, 300));

  console.log("── search, collapse, remember, active group, keyboard");
  await pg.evaluate(`(() => { const i = document.querySelector('[data-nav-search]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, "loyal"); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await w(`[...document.querySelectorAll(".tdcp-nav [data-page]")].filter((x) => x.offsetParent !== null).length === 2`, "the search result");
  m = await menu();
  check("search 'loyal': only loyalty programs and loyalty exceptions", JSON.stringify(m.flatMap((g) => g.items.map((i) => i.label))) === JSON.stringify(["loyalty programs", "loyalty exceptions"]), JSON.stringify(m.flatMap((g) => g.items.map((i) => i.label))));
  await axe("admin menu while searching");
  await pg.evaluate(`(() => { const i = document.querySelector('[data-nav-search]'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(i, ""); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await clickPage("dashboard");
  await w(`document.querySelector('.tdcp-nav [aria-current="page"]')?.dataset.page === "dashboard"`, "the dashboard");
  await pg.evaluate(`[...document.querySelectorAll(".tdcp-nav-toggle")].find((b) => b.innerText.trim().startsWith("brands")).click(); true`);
  await w(`[...document.querySelectorAll(".tdcp-nav-toggle")].find((b) => b.innerText.trim().startsWith("brands"))?.getAttribute("aria-expanded") === "false"`, "'brands' collapsed");
  m = await menu();
  const brands = m.find((g) => g.title === "brands");
  check("collapsing 'brands': aria-expanded false, its items hidden", brands.expanded === "false" && brands.items.length === 0);
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await w(`document.querySelectorAll(".tdcp-nav [data-group]").length >= 8`, "the admin menu"); await pg.idle();
  m = await menu();
  check("…after a reload it stays closed (remembered for this admin); the others stay open", m.find((g) => g.title === "brands").expanded === "false" && m.filter((g) => g.title !== "brands").every((g) => g.expanded === "true"));
  check("…remembered under this admin's key", await pg.evaluate(`localStorage.getItem("tdc.admin.nav.${admin._id}") === JSON.stringify({ brands: false })`));
  // the active item's group opens by itself: open "offers" from an old URL
  await go(pg, `http://127.0.0.1:${WEB}/adminoffers`);
  await w(`location.pathname === "/admin" && document.querySelector('.tdcp-nav [aria-current="page"]')?.dataset.page === "offers"`, "offers opened from the old URL");
  m = await menu();
  const url = await pg.evaluate(`location.pathname`);
  check("old URL /adminoffers: lands on /admin with offers open, and its (closed) group opens by itself", url === "/admin" && m.find((g) => g.title === "brands").expanded === "true" && m.flatMap((g) => g.items).find((i) => i.id === "offers")?.current === "page", `${url} ${JSON.stringify(m.find((g) => g.title === "brands"))}`);
  for (const [old, label] of [["/adminjobsmanager", "jobs & internships"], ["/adminexchangemanage", "scholarships"], ["/admin/brands-revenue", "brand revenue"], ["/crew/inbox", "crew inbox"], ["/crew/partners", "crew partners"], ["/crew/campaigns", "crew campaigns"], ["/crew/credentials", "crew credentials"]]) {
    await go(pg, `http://127.0.0.1:${WEB}${old}`);
    await w(`location.pathname === "/admin" && document.title === ${JSON.stringify(label + " · tdc admin")}`, `${old} to land on ${label}`);
    const st = await pg.evaluate(`({ path: location.pathname, title: document.title })`);
    check(`old URL ${old}: lands on /admin, "${label}"`, st.path === "/admin" && st.title === `${label} · tdc admin`, JSON.stringify(st));
  }
  // keyboard: arrows move, Enter opens / toggles
  await pg.evaluate(`[...document.querySelectorAll(".tdcp-nav-toggle")][0].focus(); true`);
  // a real key press (Enter carries its character, so the browser activates the focused button)
  const key = async (k, code, vk) => { const text = k === "Enter" ? String.fromCharCode(13) : undefined; await pg.s("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text, unmodifiedText: text } : {}) }); await pg.s("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk }); await sleep(150); };
  await key("ArrowDown", "ArrowDown", 40);
  check("keyboard: arrow down from 'general' moves to 'dashboard'", await pg.evaluate(`document.activeElement?.dataset?.page === "dashboard"`));
  await key("ArrowDown", "ArrowDown", 40);
  await key("Enter", "Enter", 13);
  await w(`document.querySelector('.tdcp-nav [aria-current="page"]')?.dataset.page === "business_overview"`, "overview opened by Enter");
  check("…Enter opens the focused item (overview)", await pg.evaluate(`document.querySelector('.tdcp-nav [aria-current="page"]')?.dataset.page === "business_overview"`));
  await key("ArrowUp", "ArrowUp", 38); await key("ArrowUp", "ArrowUp", 38);
  await key("Enter", "Enter", 13);
  check("…Enter on a group button closes it", await pg.evaluate(`[...document.querySelectorAll(".tdcp-nav-toggle")][0].getAttribute("aria-expanded") === "false"`));
  await key("Enter", "Enter", 13);

  console.log("── mobile: a drawer with the same groups");
  await viewport(pg, 390, 844, true);
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await w(`!!document.querySelector('[aria-label="open menu"]')`, "the mobile menu button");
  await pg.idle();
  await pg.evaluate(`document.querySelector('[aria-label="open menu"]').click(); true`);
  await w(`document.querySelector(".tdcp-shell")?.classList.contains("nav-open") && document.querySelectorAll(".tdcp-nav [data-group]").length >= 8`, "the drawer");
  await pg.settled();
  m = await menu();
  check("the drawer opens with the same groups", JSON.stringify(m.map((g) => g.title)) === JSON.stringify(MENU.map((x) => x[0])), JSON.stringify(m.map((g) => g.title)));
  const user = await pg.evaluate(`(() => { const u = document.querySelector(".tdcp-nav-user").getBoundingClientRect(); return { bottom: Math.round(u.bottom), vh: innerHeight }; })()`);
  check("…the signed-in admin card stays at the bottom of the drawer, on screen", user.bottom <= user.vh && user.bottom >= user.vh - 80, JSON.stringify(user));
  await axe("admin menu (mobile drawer)");
  await clickPage("events");
  await w(`!document.querySelector(".tdcp-shell").classList.contains("nav-open") && document.title === "events · tdc admin"`, "events opened from the drawer");
  check("…choosing an item closes the drawer and opens the page", await pg.evaluate(`!document.querySelector(".tdcp-shell").classList.contains("nav-open") && document.title === "events · tdc admin"`));

  check("no page errors, no console errors", errs.length === 0, errs.slice(0, 5).join(" | "));
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
