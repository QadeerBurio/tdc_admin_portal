// node --experimental-websocket disputes-ui-check.js <buildDir>
// Admin "hire disputes" page against a mock /api/career:
//   - the menu item is hidden while the server answers 404 (FLAG_CAREER_TIMELINE not set up), shown once it answers
//   - the list shows job, candidate, employer, dates and the candidate's reason, and no contact details
//   - review opens the timeline; restore / revoke stay disabled until a reason of 5+ characters is typed
//   - restore sends HIRE_RESTORED with the timeline's version and the reason; the list then empties
// With A11Y=1 (a11y-disputes.js) it runs axe-core WCAG 2 A / AA on the list and the review dialog instead of the
// text checks, and exits 1 on any violation.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const A11Y = process.env.A11Y === "1";
const WEB = 5194, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });
const D1 = "6ae9d1d1d1d1d1d1d1d1d1d1", D2 = "6ae9d2d2d2d2d2d2d2d2d2d2";
const now = Date.now();
const iso = (days) => new Date(now - days * 864e5).toISOString();
let setUp = false; // FLAG_CAREER_TIMELINE set on the server
let resolved = false;
const posted = [];
const disputes = () => [
  { applicationId: D1, version: 6, job: { title: "Data intern", company: "Bright Labs" }, candidate: { id: "c1", name: "Sana Khan" }, employer: { id: "e1", name: "Hire Co" }, hireConfirmedAt: iso(5), disputedAt: iso(2), reason: "I never started this job", resolvable: true },
  { applicationId: D2, version: 7, job: { title: "Ops intern", company: "Bright Labs" }, candidate: { id: "c2", name: "Taha Ali" }, employer: { id: "e1", name: "Hire Co" }, hireConfirmedAt: iso(6), disputedAt: iso(1), reason: "offer withdrawn", resolvable: false },
].filter((d) => !(resolved && d.applicationId === D1));
const timelineD1 = {
  applicationId: D1, job: { id: "j1", title: "Data intern", company: "Bright Labs", archived: false }, stage: "offer", version: 6,
  hire: { status: "revoked", dispute: "open" }, nextAllowedActions: ["HIRE_REVOKED", "HIRE_RESTORED", "REJECTED"],
  events: [
    { id: "e1", seq: 1, type: "APPLIED", actorRole: "candidate", occurredAt: iso(20), metadata: {} },
    { id: "e2", seq: 2, type: "SHORTLISTED", actorRole: "employer", occurredAt: iso(18), metadata: {} },
    { id: "e3", seq: 3, type: "OFFER_SENT", actorRole: "employer", occurredAt: iso(10), metadata: {} },
    { id: "e4", seq: 4, type: "OFFER_ACCEPTED", actorRole: "candidate", occurredAt: iso(8), metadata: {} },
    { id: "e5", seq: 5, type: "HIRE_CONFIRMED", actorRole: "employer", occurredAt: iso(5), metadata: {} },
    { id: "e6", seq: 6, type: "HIRE_DISPUTED", actorRole: "candidate", occurredAt: iso(2), metadata: { note: "I never started this job" } },
  ],
  interviewDetails: null, offerDetails: null,
};
const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(k);
  let body = "";
  q.on("data", (c) => (body += c));
  q.on("end", () => {
    if (k === "GET /api/career/admin/disputes") {
      if (!setUp) { s.writeHead(404, h); return s.end(JSON.stringify({ success: false, error: { code: "CAREER_OFF", message: "The hiring timeline isn't set up" } })); }
      s.writeHead(200, h); return s.end(JSON.stringify(ok({ disputes: disputes() })));
    }
    if (k === `GET /api/career/applications/${D1}/timeline`) { s.writeHead(200, h); return s.end(JSON.stringify(ok(timelineD1))); }
    if (k === `POST /api/career/applications/${D1}/events`) {
      posted.push(JSON.parse(body || "{}"));
      resolved = true;
      s.writeHead(201, h); return s.end(JSON.stringify(ok({ applicationId: D1, state: "hired", version: 7, type: "HIRE_RESTORED" })));
    }
    s.writeHead(200, h);
    s.end(JSON.stringify(q.method === "GET" ? [] : { success: true }));
  });
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(s);
}).listen(WEB);

(async () => {
  const b = await launch(A11Y ? 9408 : 9407);
  let bad = 0;
  const open = async (who, p) => {
    const pg = await b.page();
    pg.errs = [];
    await pg.s("Log.enable");
    pg.on((m) => {
      if (m.method === "Runtime.exceptionThrown") pg.errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") pg.errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
      if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/status of 404/.test(m.params.entry.text)) pg.errs.push("log: " + m.params.entry.text.slice(0, 160));
    });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    await sleep(3500);
    return pg;
  };
  const text = (pg) => pg.evaluate(`document.body.innerText || ""`);
  const expect = (label, t, want, not = []) => {
    const miss = want.filter((w) => !t.toLowerCase().includes(w.toLowerCase()));
    const found = not.filter((w) => t.toLowerCase().includes(w.toLowerCase()));
    if (miss.length || found.length) bad = 1;
    console.log(`${label}: ${miss.length ? "MISSING " + miss.join(" | ") : "all expected text present"}${found.length ? "; SHOULD NOT SHOW " + found.join(" | ") : ""}`);
  };
  const check = (label, cond) => { if (!cond) bad = 1; console.log(`${label}: ${cond ? "yes" : "NO"}`); };
  const menu = (pg) => pg.evaluate(`[...document.querySelectorAll("aside a, aside button")].map((a) => a.innerText.trim().toLowerCase()).join("|")`);
  const click = (pg, re) => pg.evaluate(`[...document.querySelectorAll("button, a")].find((x) => ${re}.test(x.innerText.trim()))?.click(); true`);
  const disabled = (pg, label) => pg.evaluate(`[...document.querySelectorAll("[role=dialog] button")].find((x) => x.innerText.trim() === ${JSON.stringify(label)})?.disabled === true`);
  const typeReason = (pg, val) => pg.evaluate(`(() => { const i = document.querySelector("#dispute-reason"); const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set; set.call(i, ${JSON.stringify(val)}); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };

  let total = 0;
  const AXE = A11Y ? fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8") : "";
  const audit = async (pg, label, scope = "main") => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    total += v.length;
    console.log(`${label}: ${v.length ? v.map((x) => `${x.impact} ${x.id} (${x.nodes}) ${x.targets.join(" ; ")}`).join("\n    ") : "no WCAG 2 A/AA violations"}`);
  };

  if (!A11Y) {
    const off = await open(admin, "/admin");
    check("not set up (404): no 'hire disputes' in the admin menu", !/hire disputes/.test(await menu(off)));
    await off.close();
  }
  setUp = true;
  const adm = await open(admin, "/admin");
  if (!A11Y) check("set up: 'hire disputes' in the admin menu", /hire disputes/.test(await menu(adm)));
  await click(adm, /^hire disputes$/i);
  await sleep(2000);
  if (A11Y) await audit(adm, "admin hire disputes: list");
  else expect("disputes list", await text(adm), ["hire disputes", "Data intern", "Bright Labs", "Sana Khan", "Hire Co", "I never started this job", "open", "Ops intern", "timeline switched off", "review"], ["@", "0300"]);
  await click(adm, /^review$/);
  await sleep(1500);
  if (A11Y) {
    await audit(adm, "admin hire disputes: review dialog", "[role=dialog]");
    await typeReason(adm, "contract and payslip checked");
    await sleep(300);
    await audit(adm, "admin hire disputes: review dialog, reason typed", "[role=dialog]");
  } else {
    expect("review dialog", await text(adm), ["dispute: Data intern", "the candidate's reason", "timeline", "hire confirmed (verified)", "hire disputed", "your reason (required", "restore the hire", "revoke the hire"]);
    check("restore and revoke are disabled without a reason", (await disabled(adm, "restore the hire")) && (await disabled(adm, "revoke the hire")));
    await typeReason(adm, "ok");
    await sleep(200);
    check("…and with a reason under 5 characters", await disabled(adm, "restore the hire"));
    await typeReason(adm, "contract and payslip checked (ticket 77)");
    await sleep(200);
    check("…enabled with a reason", !(await disabled(adm, "restore the hire")) && !(await disabled(adm, "revoke the hire")));
    await adm.evaluate(`[...document.querySelectorAll("[role=dialog] button")].find((x) => x.innerText.trim() === "restore the hire")?.click(); true`);
    await sleep(2000);
    const p = posted[0] || {};
    check("restore sends HIRE_RESTORED with the timeline's version and the reason", posted.length === 1 && p.type === "HIRE_RESTORED" && p.version === 6 && p.note === "contract and payslip checked (ticket 77)");
    expect("after restoring: the dispute left the list", await text(adm), ["hire restored", "Ops intern"], ["Data intern"]);
  }
  adm.errs.forEach((e) => console.log("    " + e));
  if (adm.errs.length) bad = 1; else console.log("    admin page: no page errors, no console errors");
  if (A11Y) console.log(`\nA11Y_TOTAL=${total}`);
  else console.log("API calls: " + [...new Set(calls)].filter((c) => /career/.test(c)).join(", "));
  b.close();
  process.exit(A11Y ? (total || bad ? 1 : 0) : bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
