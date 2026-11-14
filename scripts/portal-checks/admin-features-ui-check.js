// node --experimental-websocket admin-features-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Admin features per account (server: /api/admin/features), against a mock API that keeps state:
// - a brand profile's "features" tab: three states per feature (default (on/off), forced on, forced off); a
//   Railway-listed feature shows "default (on)" and isn't locked (only the kill switch locks); a change asks for a
//   reason; a server error leaves the state as it was; after a save it's forced on and a one-sided pilot (no student
//   has it) is flagged, then not once students have it;
// - the students list: "Features…" on the selection (university filter + select all filtered); over 500 accounts the
//   number must be typed; sent in batches of 500; the result lists changed / already / skipped; 2 accounts: no typing;
// - the features page (oversight menu): a tab per feature, the accounts forced on / off, reset to default with a
//   reason; the "default for all students / brands / employers" switches (on by default), turning one off with a reason
//   and a confirm ("turn off for every brand");
// - a student's features tab: default (on) from the student default, force off, reset to default; kill switch locked;
// - axe-core WCAG 2 A / AA on the features tab, the bulk dialog and the features page; no console errors.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });
const fail = (status, code, message) => ({ status, body: { success: false, error: { code, message }, requestId: "mock" } });

const U9 = { _id: "6aea00000000000000000009", name: "NED University" };
const BRAND = { _id: "6aec000000000000000000b1", name: "Alpha", brandName: "Alpha Cafe", email: "alpha@example.com", role: "brand", status: "Verified", brandApprovalStatus: "approved" };
const hex = (n) => n.toString(16).padStart(4, "0");
const students = Array.from({ length: 620 }, (_, i) => ({ _id: `6aeb00000000000000${hex(i)}00`, name: `Student ${i + 1}`, email: `s${i}@example.com`, role: "student", status: "Verified", referralCount: 0, referralCode: `R${i}`, university: U9 }));
students.push({ _id: "6aeb0000000000000000ffaa", name: "Zara Other", email: "z@example.com", role: "student", status: "Verified", referralCount: 0, referralCode: "RZ", university: null });
const users = new Map([[BRAND._id, BRAND], ...students.map((s) => [s._id, s])]);

const FLAGS = [
  { flag: "loyaltyV2", label: "Loyalty", roles: ["brand", "student"] },
  { flag: "surplusBoxes", label: "Surprise Box", roles: ["brand", "student"] },
  { flag: "careerTimeline", label: "Hiring timeline", roles: ["student", "employee"] },
];
const railway = { surplusBoxes: new Set([BRAND._id]) }; // the brand is in FLAG_SURPLUS_BOXES on Railway
const killed = { careerTimeline: true };
const access = { loyaltyV2: new Map(), surplusBoxes: new Map(), careerTimeline: new Map() }; // id → { enabled, reason, setAt }
// role defaults (feat/features-on-by-default): ON for these role / flag pairs unless a row turns them off
const DEFAULTABLE = { student: ["loyaltyV2", "surplusBoxes", "careerTimeline"], brand: ["loyaltyV2", "surplusBoxes"], employee: ["careerTimeline"] };
const defaults = {}; // "role:flag" → true / false (a row); no row = on
const defaultMeta = {}; // "role:flag" → { reason, setAt, setBy }
const roleDefault = (role, flag) => ((DEFAULTABLE[role] || []).includes(flag) ? (`${role}:${flag}` in defaults ? defaults[`${role}:${flag}`] : true) : null);
const defaultsOf = (flag) => Object.fromEntries(Object.keys(DEFAULTABLE).filter((r) => DEFAULTABLE[r].includes(flag)).map((r) => {
  const k = `${r}:${flag}`;
  return [r, { enabled: roleDefault(r, flag), set: k in defaults, ...(defaultMeta[k] || { reason: null, setAt: null, setBy: null }) }];
}));
const calls = { put: [], bulk: [], defaults: [] };
const forcedOn = (flag) => [...access[flag].values()].filter((r) => r.enabled).length;
const forcedOff = (flag) => [...access[flag].values()].filter((r) => !r.enabled).length;
let failNextPut = false;

const flagView = (id, f) => {
  const u = users.get(id);
  const fromRailway = !!railway[f.flag]?.has(id);
  const row = access[f.flag].get(id) || null;
  const forced = row ? (row.enabled ? "on" : "off") : null;
  const defaultForRole = roleDefault(u.role, f.flag);
  const k = !!killed[f.flag];
  const source = k ? "kill" : forced ? "account" : defaultForRole !== null ? "default" : "railway";
  const effective = k ? false : forced ? forced === "on" : defaultForRole !== null ? defaultForRole : fromRailway;
  const v = { ...f, killed: k, forced, defaultForRole, fromRailway, granted: forced === "on", source, effective,
    lastChange: row ? { enabled: row.enabled, reason: row.reason, setAt: row.setAt, setBy: { id: "a", name: "Ayesha Admin" } } : null };
  if (u.role === "brand" && (f.flag === "loyaltyV2" || f.flag === "surplusBoxes")) {
    const studentsWith = [...access[f.flag].entries()].filter(([x, r]) => r.enabled && users.get(x)?.role === "student").length;
    v.students = { killed: false, allStudentsFromRailway: false, allStudentsFromDefault: roleDefault("student", f.flag) === true, withAdminAccess: studentsWith, fromRailwayList: 0, usedThisBrand: 3, usedThisBrandWithIt: Math.min(3, studentsWith) };
  }
  return v;
};

function handle(method, url, body) {
  const [p, qs] = url.split("?");
  let m;
  if (method === "GET" && p === "/api/app/flags/me") return {};
  if (method === "GET" && p === "/api/admin/users/student") return students;
  if (method === "GET" && p === "/api/admin/users/brand") return [BRAND];
  if (method === "GET" && (m = p.match(/^\/api\/admin\/users\/details\/(\w+)$/))) return users.get(m[1]) || null;
  if (method === "GET" && p === "/api/admin/features/flags") return ok(FLAGS.map((f) => ({ ...f, killed: !!killed[f.flag], railway: railway[f.flag] ? `${railway[f.flag].size} id` : "not set, using off", railwayIdCount: railway[f.flag]?.size || 0, adminAccessCount: forcedOn(f.flag), forcedOffCount: forcedOff(f.flag),
    studentDefaultable: true, studentDefault: { enabled: roleDefault("student", f.flag), ...(defaultMeta[`student:${f.flag}`] || { reason: null, setAt: null, setBy: null }) }, defaults: defaultsOf(f.flag) })));
  if (method === "PUT" && (m = p.match(/^\/api\/admin\/features\/defaults\/(\w+)$/))) {
    calls.defaults.push({ flag: m[1], ...body });
    const role = body.role || "student";
    const before = roleDefault(role, m[1]);
    defaults[`${role}:${m[1]}`] = body.enabled;
    defaultMeta[`${role}:${m[1]}`] = { reason: body.reason, setAt: new Date().toISOString(), setBy: { id: "a", name: "Ayesha Admin" } };
    return ok({ flag: m[1], role, changed: before !== body.enabled, before, after: body.enabled });
  }
  if (method === "GET" && (m = p.match(/^\/api\/admin\/features\/account\/(\w+)$/))) {
    const u = users.get(m[1]);
    const fl = FLAGS.filter((f) => f.roles.includes(u.role)).map((f) => flagView(u._id, f));
    // what the app sees: the flags/me answer for this account (here: each flag's effective state)
    const appView = { flags: { metaEvents: false, ...Object.fromEntries(FLAGS.map((f) => [f.flag, !!(fl.find((x) => x.flag === f.flag) || {}).effective])) }, at: new Date().toISOString(), loaded: true };
    return ok({ account: { id: u._id, role: u.role, roleStored: true, name: u.brandName || u.name }, flags: fl, appView });
  }
  if (method === "PUT" && (m = p.match(/^\/api\/admin\/features\/account\/(\w+)\/(\w+)$/))) {
    calls.put.push({ id: m[1], flag: m[2], ...body });
    if (failNextPut) { failNextPut = false; return fail(500, "SERVER_ERROR", "Something went wrong"); }
    const st = body.state || (body.enabled ? "on" : "off");
    const row = access[m[2]].get(m[1]);
    const before = row ? row.enabled : null;
    const after = st === "default" ? null : st === "on";
    if (after === null) access[m[2]].delete(m[1]); else access[m[2]].set(m[1], { enabled: after, reason: body.reason, setAt: new Date().toISOString() });
    return ok({ changed: before !== after, before, after, state: {} });
  }
  if (method === "POST" && p === "/api/admin/features/bulk") {
    calls.bulk.push({ ...body, n: body.accountIds.length });
    const out = { changed: [], unchanged: [], skipped: [] };
    for (const id of body.accountIds) {
      const u = users.get(id);
      if (!u) { out.skipped.push({ id, why: "not found" }); continue; }
      if (id === students[0]._id) { out.skipped.push({ id, why: "wrong role (traveler)" }); continue; } // pretend
      const had = access[body.flag].get(id)?.enabled === true;
      if (had === body.enabled) { out.unchanged.push(id); continue; }
      access[body.flag].set(id, { enabled: body.enabled, reason: body.reason, setAt: new Date().toISOString() });
      out.changed.push(id);
    }
    return ok(out);
  }
  if (method === "GET" && (m = p.match(/^\/api\/admin\/features\/flag\/(\w+)$/))) {
    const q = new URLSearchParams(qs || "");
    const all = [...access[m[1]].entries()].reverse().map(([id, r]) => { const u = users.get(id); return { id, name: u.brandName || u.name, role: u.role, university: u.university?.name || null, fromRailway: !!railway[m[1]]?.has(id), forced: r.enabled ? "on" : "off", setBy: { id: "a", name: "Ayesha Admin" }, reason: r.reason, setAt: r.setAt }; });
    const off = Number(q.get("offset") || 0), lim = Number(q.get("limit") || 50);
    const f = FLAGS.find((x) => x.flag === m[1]);
    return ok({ ...f, killed: !!killed[m[1]], railwayIdCount: railway[m[1]]?.size || 0, studentDefault: roleDefault("student", m[1]), defaults: Object.fromEntries(Object.entries(defaultsOf(m[1])).map(([r, d]) => [r, d.enabled])), total: all.length, offset: off, limit: lim, accounts: all.slice(off, off + lim) });
  }
  return undefined;
}

http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  let raw = "";
  q.on("data", (c) => (raw += c));
  q.on("end", () => {
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch {}
    const out = handle(q.method, q.url, body);
    if (out && out.status && out.body) { s.writeHead(out.status, h); return s.end(JSON.stringify(out.body)); }
    s.writeHead(200, h);
    s.end(JSON.stringify(out !== undefined ? out : (q.method === "GET" ? [] : { success: true })));
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
  const b = await launch(9407);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail !== "" ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") {
      const t = m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200);
      if (!/status of 500|AxiosError|Request failed with status code 500/.test(t)) errs.push("console.error: " + t); // the deliberate 500
    }
  });
  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(admin)})); true`);

  const click = (re, sel = "button, a") => pg.evaluate(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => ${re}.test(x.innerText.trim()) && !x.disabled); if (e) e.click(); return !!e; })()`);
  const btn = (re) => pg.evaluate(`(() => { const e = [...document.querySelectorAll("button")].find((x) => ${re}.test(x.innerText.trim())); return e ? { found: true, disabled: e.disabled } : { found: false }; })()`);
  const text = () => pg.evaluate(`document.body.innerText`);
  // a feature's row on a features tab: the checked state, whether it's locked, the pill and the default label
  const sw = (flag) => pg.evaluate(`(() => { const li = document.querySelector('li[data-flag="${flag}"]'); if (!li) return null; const r = li.querySelector("input[type=radio]:checked"); const fsd = li.querySelector("fieldset"); return { mode: r ? r.value : null, disabled: !!fsd?.disabled, pill: li.querySelector(".k-pill, [class*=pill]")?.innerText || "", defaultLabel: li.querySelector('label[data-state="default"]')?.innerText.trim() || "", text: li.innerText }; })()`);
  const pick = (flag, label) => pg.evaluate(`(() => { const e = document.querySelector('li[data-flag="${flag}"] input[aria-label="${label}"]'); if (!e) return false; e.click(); return true; })()`);
  const type = (sel, value) => pg.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, "value").set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  const axe = async (label) => {
    await pg.evaluate(AXE + "; true");
    const v = await pg.evaluate(`(async () => { const r = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(" ") })); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.length ? JSON.stringify(v) : "no violations");
  };

  console.log("── brand profile: features tab");
  await go(pg, `http://127.0.0.1:${WEB}/admin/users/brand/${BRAND._id}`);
  await sleep(3500);
  check("a features tab", await click(/^features$/i, "[role=tab]"));
  await sleep(1500);
  let t = await text();
  check("brand: Loyalty and Surprise Box, no career flag", t.includes("Loyalty") && t.includes("Surprise Box") && !t.includes("Hiring timeline"));
  let s = await sw("surplusBoxes");
  check("Surprise Box (brand on the Railway list): 'default (on)', not locked (only the kill switch locks)", s && s.mode === "default" && !s.disabled && s.defaultLabel === "default (on)" && /on: default/.test(s.text), JSON.stringify(s));
  check("…the default's source: the default for all brands (on by default)", /Default here: on, from the default for all brands/.test(s.text), s.text);
  s = await sw("loyaltyV2");
  check("Loyalty: 'default (on)' (on by default for brands), three choices incl. forced off, not locked", s && s.mode === "default" && !s.disabled && s.defaultLabel === "default (on)" && /forced on/.test(s.text) && /forced off/.test(s.text), JSON.stringify(s));
  await axe("brand features tab");

  await pick("loyaltyV2", "Loyalty: forced on");
  await sleep(500);
  check("choosing 'forced on' asks for a reason (dialog), confirm disabled without one", (await text()).includes("force on: Loyalty") && (await btn(/^force on$/i)).disabled === true);
  await axe("reason dialog");
  failNextPut = true;
  await type("#feature-reason", "fail this one");
  await sleep(200);
  await click(/^force on$/i);
  await sleep(1000);
  t = await text();
  check("server error: shown in the dialog, the state stays default", /Something went wrong/.test(t) && (await sw("loyaltyV2")).mode === "default");
  await type("#feature-reason", "Alpha Cafe loyalty pilot");
  await sleep(200);
  await click(/^force on$/i);
  await sleep(1500);
  const lastPut = calls.put[calls.put.length - 1];
  check("PUT sent: state on, the reason", lastPut && lastPut.id === BRAND._id && lastPut.flag === "loyaltyV2" && lastPut.state === "on" && lastPut.reason === "Alpha Cafe loyalty pilot", JSON.stringify(lastPut));
  s = await sw("loyaltyV2");
  t = await text();
  check("after the save: Loyalty forced on, the dialog gone, last change shown, reset offered", s.mode === "on" && /on: forced on/.test(s.text) && !(await pg.evaluate(`!!document.getElementById("feature-reason")`)) && t.includes("forced on by Ayesha Admin") && t.includes("Alpha Cafe loyalty pilot") && /reset to default/.test(s.text));
  const blk = await pg.evaluate(`document.querySelector('[data-testid="students-loyaltyV2"]')?.innerText || ""`);
  check("no one-sided pilot: every student has Loyalty by default", !t.includes("one-sided pilot") && /Every student has Loyalty \(the default for all students\)/.test(blk), blk);
  await axe("features tab after forcing on");

  console.log("── students list: Features… (bulk)");
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  check("open all students", await click(/^all students$/i));
  await sleep(3000);
  check("Features… disabled with nothing selected", (await btn(/^features…$/i)).disabled === true);
  // two rows: no typed confirmation
  // the first two rows on the page (not Student 1, which the mock always skips)
  const picked = await pg.evaluate(`(() => { const boxes = [...document.querySelectorAll('tbody input[type=checkbox]')].filter((x) => x.getAttribute("aria-label") !== "select Student 1").slice(0, 2); boxes.forEach((x) => x.click()); return boxes.map((x) => x.getAttribute("aria-label").replace(/^select /, "")); })()`);
  await sleep(300);
  check("2 selected → Features…", await click(/^features…$/i));
  await sleep(1200);
  t = await text();
  check("the dialog lists only the student features (incl. the kill-switched one)", (await pg.evaluate(`[...document.querySelectorAll("#bulk-flag option")].map((o) => o.textContent).join()`)) === "Loyalty,Surprise Box,Hiring timeline");
  check("next is disabled without a reason", (await btn(/^next$/i)).disabled === true);
  await type("#bulk-reason", "two test students");
  await sleep(200);
  await click(/^next$/i);
  await sleep(500);
  check("confirm: 'turn on Loyalty for 2 accounts?', no number to type", (await pg.evaluate(`document.querySelector('[data-testid="bulk-summary"]')?.innerText`)) === "turn on Loyalty for 2 accounts?" && !(await pg.evaluate(`!!document.getElementById("bulk-typed")`)));
  await click(/^turn on Loyalty for 2 accounts$/i);
  await sleep(1500);
  const r2 = await pg.evaluate(`document.querySelector('[data-testid="bulk-result"]')?.innerText || ""`);
  check("one request with 2 ids; result 2 changed", calls.bulk.length === 1 && calls.bulk[0].n === 2 && calls.bulk[0].enabled === true && calls.bulk[0].reason === "two test students" && /2 changed, 0 already on, 0 skipped/.test(r2), r2);
  await click(/^done$/i);
  await sleep(400);
  check("clear the selection", await click(/^clear$/i));
  await sleep(300);

  // NED: 620 students → over 500, the number must be typed; two batches (500 + 120)
  await pg.evaluate(`(() => { const sel = document.getElementById("aul-university"); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(sel, ${JSON.stringify(U9._id)}); sel.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  await sleep(800);
  check("select all filtered (620)", await click(/^select all filtered \(620\)$/i));
  await sleep(500);
  check("620 selected → Features…", (await text()).includes("620 selected") && (await click(/^features…$/i)));
  await sleep(1200);
  await type("#bulk-reason", "NED test students, loyalty pilot");
  await sleep(200);
  await click(/^next$/i);
  await sleep(500);
  check("confirm: 'turn on Loyalty for 620 accounts?' with the number to type", (await pg.evaluate(`document.querySelector('[data-testid="bulk-summary"]')?.innerText`)) === "turn on Loyalty for 620 accounts?" && (await pg.evaluate(`!!document.getElementById("bulk-typed")`)));
  check("…the confirm button is disabled until the number is typed", (await btn(/^turn on Loyalty for 620 accounts$/i)).disabled === true);
  await axe("bulk confirm with the typed number");
  await type("#bulk-typed", "619");
  await sleep(200);
  check("…a wrong number keeps it disabled", (await btn(/^turn on Loyalty for 620 accounts$/i)).disabled === true);
  await type("#bulk-typed", "620");
  await sleep(200);
  check("…the right number enables it", (await btn(/^turn on Loyalty for 620 accounts$/i)).disabled === false);
  await click(/^turn on Loyalty for 620 accounts$/i);
  await sleep(2500);
  const rb = await pg.evaluate(`document.querySelector('[data-testid="bulk-result"]')?.innerText || ""`);
  check("two requests: 500 then 120", calls.bulk.length === 3 && calls.bulk[1].n === 500 && calls.bulk[2].n === 120, JSON.stringify(calls.bulk.map((c) => c.n)));
  // already on: the two picked earlier, if they're NED students (the mock always skips Student 1)
  const already = picked.filter((n) => /^Student \d+$/.test(n) && n !== "Student 1").length;
  check(`result: ${619 - already} changed, ${already} already on, 1 skipped with its name and why`, rb.includes(`${619 - already} changed, ${already} already on, 1 skipped`) && /Student 1: wrong role \(traveler\)/.test(rb), `${rb} | picked ${picked.join(", ")}`);
  await click(/^done$/i);
  await sleep(400);

  console.log("── the brand again: students have Loyalty now");
  await go(pg, `http://127.0.0.1:${WEB}/admin/users/brand/${BRAND._id}`);
  await sleep(3000);
  await click(/^features$/i, "[role=tab]");
  await sleep(1500);
  t = await text();
  const blk2 = await pg.evaluate(`document.querySelector('[data-testid="students-loyaltyV2"]')?.innerText || ""`);
  const nStudents = [...access.loyaltyV2.entries()].filter(([x, r]) => r.enabled && users.get(x)?.role === "student").length;
  const blkSurplus = await pg.evaluate(`document.querySelector('[data-testid="students-surplusBoxes"]')?.innerText || ""`);
  check(`Loyalty: no one-sided warning (every student on by default; ${nStudents} also forced on)`, !blk2.includes("one-sided pilot") && /Every student has Loyalty/.test(blk2), blk2);
  check("Surprise Box: every student has it by default, not one-sided", !blkSurplus.includes("one-sided pilot") && /Every student has Surprise Box/.test(blkSurplus), blkSurplus);

  console.log("── the features page");
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  check("features in the menu", await click(/^features$/i));
  await sleep(2000);
  t = await text();
  const tabsText = await pg.evaluate(`[...document.querySelectorAll("[role=tab]")].map((x) => { const c = x.querySelector(".k-count"); return (c ? x.innerText.replace(c.innerText, "").trim() + " " + c.innerText.trim() : x.innerText.trim()); }).join("|")`);
  // newest first: the last bulk batch's students lead the list (the brand, turned on first, is on a later page)
  check("a tab per feature with counts; Loyalty lists the accounts, newest first", tabsText === `Loyalty ${access.loyaltyV2.size}|Surprise Box 0|Hiring timeline 0` && t.includes("Student 620") && !t.includes("Alpha Cafe"), tabsText);
  const left = access.loyaltyV2.size - 50;
  check(`load more (${access.loyaltyV2.size} accounts, 50 per page)`, await pg.evaluate(`[...document.querySelectorAll("button")].some((x) => x.innerText.trim() === "load more (${left} left)")`));
  await axe("features page");
  check("Hiring timeline tab: kill switch shown, empty list", (await click(/^Hiring timeline/i, "[role=tab]")) && (await sleep(1200), (await text()).includes("kill switch on in Railway: off for everyone")));
  check("Surprise Box tab: also on through Railway: 1 id", (await click(/^Surprise Box/i, "[role=tab]")) && (await sleep(1200), (await text()).includes("also on through Railway: 1 id")));
  await click(/^Loyalty/i, "[role=tab]");
  await sleep(1200);
  const rowsNow = () => pg.evaluate(`document.querySelectorAll("tbody tr").length`);
  check("50 rows on the first page", (await rowsNow()) === 50, await rowsNow());
  await click(/^load more/i);
  await sleep(1200);
  check("load more: 100 rows", (await rowsNow()) === 100, await rowsNow());
  check("each row says forced on", await pg.evaluate(`[...document.querySelectorAll("tbody tr")].slice(0, 5).every((tr) => /forced on/.test(tr.innerText))`));
  // reset the newest account (first row) to default
  const victim = await pg.evaluate(`(() => { const e = document.querySelector('tbody button[aria-label^="reset Loyalty to default for "]'); if (!e) return null; const name = e.getAttribute("aria-label").replace("reset Loyalty to default for ", ""); e.click(); return name; })()`);
  check("reset to default for one account asks for a reason", !!victim && (await sleep(500), await pg.evaluate(`!!document.getElementById("feature-reason")`)) && /the default decides again/.test(await text()), victim);
  await type("#feature-reason", "pilot over");
  await sleep(200);
  await click(/^reset to default$/i, ".k-modal button");
  await sleep(1500);
  const rem = calls.put[calls.put.length - 1];
  const victimId = [...users.values()].find((u) => (u.brandName || u.name) === victim)?._id;
  const names = await pg.evaluate(`[...document.querySelectorAll("tbody tr td:first-child")].map((x) => x.innerText.trim())`);
  check("PUT state default with the reason; that account is gone from the list", rem.id === victimId && rem.state === "default" && rem.reason === "pilot over" && !names.includes(victim), JSON.stringify(rem));

  console.log("── role defaults: on by default, switched off per role (features page)");
  const dsw = (role) => pg.evaluate(`(() => { const box = document.querySelector('[data-role="${role}"]'); const e = box?.querySelector('[role=switch]'); return e ? { checked: e.getAttribute("aria-checked") === "true", disabled: !!e.disabled, label: e.getAttribute("aria-label"), text: box.innerText } : null; })()`);
  let d = await dsw("student");
  check("Loyalty: 'default for all students' on by default", d && d.checked && /on by default/.test(d.text) && /Only students are affected/.test(d.text) && /default for all students on/.test(d.label), JSON.stringify(d));
  d = await dsw("brand");
  check("Loyalty: 'default for all brands' on by default too", d && d.checked && /default for all brands/.test(d.text) && /on by default/.test(d.text), JSON.stringify(d));
  check("…no employer switch for Loyalty (employers can't use it)", !(await dsw("employee")));
  await pg.evaluate(`document.querySelector('[data-role="brand"] [role=switch]').click(); true`);
  await sleep(500);
  t = await text();
  check("turning it off for brands: a confirm step with a reason ('turn off Loyalty for every brand'), disabled without a reason", t.includes("turn off Loyalty for every brand") && /Only brands are affected/.test(t) && (await btn(/^turn off for every brand$/i)).disabled === true);
  await axe("role default: confirm dialog");
  await type("#feature-reason", "brands: loyalty paused");
  await sleep(200);
  await click(/^turn off for every brand$/i);
  await sleep(1500);
  const dput = calls.defaults[calls.defaults.length - 1];
  d = await dsw("brand");
  check("PUT /defaults/loyaltyV2: brand, off, the reason; the brand switch off, who and why shown; students still on", dput && dput.flag === "loyaltyV2" && dput.role === "brand" && dput.enabled === false && dput.reason === "brands: loyalty paused" && d && !d.checked && /set off by Ayesha Admin/.test(d.text) && /brands: loyalty paused/.test(d.text) && (await dsw("student")).checked, JSON.stringify({ dput, d }));
  check("Hiring timeline (kill switch): the student and employer default switches are locked", (await click(/^Hiring timeline/i, "[role=tab]")) && (await sleep(1200), await pg.evaluate(`(() => { const s = document.querySelector('[data-role="student"] [role=switch]'), e = document.querySelector('[data-role="employee"] [role=switch]'); return !!s && !!e && s.disabled === true && e.disabled === true; })()`)));
  await click(/^Loyalty/i, "[role=tab]");
  await sleep(800);

  console.log("── a student's features tab: three states");
  const st = students.find((x) => !access.loyaltyV2.has(x._id));
  await go(pg, `http://127.0.0.1:${WEB}/admin/users/student/${st._id}`);
  await sleep(3500);
  check("a features tab on the student", await click(/^features$/i, "[role=tab]"));
  await sleep(1500);
  s = await sw("loyaltyV2");
  check("Loyalty: 'default (on)' from the default for all students", s && s.mode === "default" && s.defaultLabel === "default (on)" && /on: default/.test(s.text) && /from the default for all students/.test(s.text), JSON.stringify(s));
  s = await sw("careerTimeline");
  check("Hiring timeline: locked by the kill switch, said so", s && s.disabled && /kill switch/.test(s.text), JSON.stringify(s));
  await axe("student features tab (with what the app sees)");
  const appSees = await pg.evaluate(`(() => { const sec = document.querySelector('[data-testid="app-view"]'); if (!sec) return null; const row = (k) => sec.querySelector('[data-flag="' + k + '"]')?.textContent || ""; return { title: sec.querySelector("h3")?.textContent || "", loyalty: row("loyaltyV2"), timeline: row("careerTimeline"), btn: !!sec.querySelector('button[aria-label="check what the app sees again"]'), raw: !!sec.querySelector("details pre") }; })()`);
  check("student features tab: 'what the app sees' shows the app's answer (Loyalty on, Hiring timeline off) with 'check again' and the raw answer", appSees && /what the app sees/.test(appSees.title) && /on in the app/.test(appSees.loyalty) && /off in the app/.test(appSees.timeline) && appSees.btn && appSees.raw, JSON.stringify(appSees));
  await pick("loyaltyV2", "Loyalty: forced off");
  await sleep(500);
  t = await text();
  check("force off: the dialog says it beats the default and the Railway list", t.includes("force off: Loyalty") && /off even if the default for all students or the Railway list turns it on/.test(t));
  await type("#feature-reason", "abuse report 123");
  await sleep(200);
  await click(/^force off$/i);
  await sleep(1500);
  let put = calls.put[calls.put.length - 1];
  s = await sw("loyaltyV2");
  check("PUT state off; now 'off: forced off' with reset to default", put.id === st._id && put.state === "off" && s.mode === "off" && /off: forced off/.test(s.text) && /reset to default/.test(s.text), JSON.stringify(put));
  await pg.evaluate(`document.querySelector('li[data-flag="loyaltyV2"] button[aria-label="reset Loyalty to default"]').click(); true`);
  await sleep(500);
  await type("#feature-reason", "report resolved");
  await sleep(200);
  await click(/^reset to default$/i, ".k-modal button");
  await sleep(1500);
  put = calls.put[calls.put.length - 1];
  s = await sw("loyaltyV2");
  check("reset to default: PUT state default; back to 'default (on)'", put.state === "default" && put.reason === "report resolved" && s.mode === "default" && /on: default/.test(s.text), JSON.stringify(put));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
