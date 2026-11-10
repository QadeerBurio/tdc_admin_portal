// node --experimental-websocket admin-ids-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Admin "copy ids" on the user lists (all students / brands / employers), against a mock API on 5197:
// - a checkbox per row (clicking it doesn't open the profile), "select all filtered", clear, copy ids;
// - the students' university filter, and "select all filtered" taking only the filtered rows;
// - the copied text is "ids:id1,id2,..." in the list's order (clipboard captured in the page);
// - when the clipboard can't be used, the text is shown in a read-only field instead;
// - axe-core WCAG 2 A / AA on the list with rows selected. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;

const U1 = { _id: "6aea00000000000000000001", name: "SZABIST" };
const U2 = { _id: "6aea00000000000000000002", name: "IBA Karachi" };
const st = (n, name, uni) => ({ _id: `6aeb0000000000000000000${n}`, name, email: `${name.toLowerCase()}@example.com`, role: "student", status: "Verified", referralCount: 0, referralCode: `R${n}`, university: uni });
const students = [st(1, "Sana", U1), st(2, "Bilal", U2), st(3, "Ayesha", U1), st(4, "Omar", null)];
const brands = [
  { _id: "6aec00000000000000000001", name: "Alpha", email: "alpha@example.com", role: "brand", brandName: "Alpha Cafe", status: "Verified" },
  { _id: "6aec00000000000000000002", name: "Beta", email: "beta@example.com", role: "brand", brandName: "Beta Books", status: "Pending" },
];
const routes = {
  "GET /api/app/flags/me": {},
  "GET /api/admin/users/student": students,
  "GET /api/admin/users/brand": brands,
};
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const body = routes[`${q.method} ${q.url.split("?")[0]}`];
  s.writeHead(200, h);
  s.end(JSON.stringify(body !== undefined ? body : (q.method === "GET" ? [] : { success: true })));
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
  const b = await launch(9351);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  await pg.s("Log.enable");
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const admin = { _id: "6ae9ffffffffffffffffffff", id: "6ae9ffffffffffffffffffff", role: "admin", name: "admin" };
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(admin)})); true`);
  await go(pg, `http://127.0.0.1:${WEB}/admin`);
  await sleep(3000);
  const click = (re) => pg.evaluate(`(() => { const e = [...document.querySelectorAll("button, a")].find((x) => ${re}.test(x.innerText.trim()) && !x.disabled); if (e) e.click(); return !!e; })()`);
  const text = () => pg.evaluate(`document.getElementById("root")?.innerText || ""`);
  const btn = (re) => pg.evaluate(`(() => { const e = [...document.querySelectorAll("button")].find((x) => ${re}.test(x.innerText.trim())); return e ? { found: true, disabled: e.disabled, text: e.innerText.trim() } : { found: false }; })()`);

  check("open all students from the menu", await click(/^all students$/i));
  await sleep(2500);
  let t = await text();
  check("the list shows every student", ["Sana", "Bilal", "Ayesha", "Omar"].every((n) => t.includes(n)));
  check("a checkbox per row, plus one for the page", (await pg.evaluate(`document.querySelectorAll("table input[type=checkbox]").length`)) === 5);
  check("\"0 selected\" and copy ids disabled at first", t.includes("0 selected") && (await btn(/^copy ids$/i)).disabled === true);

  // university filter: only that university's students; "select all filtered" takes only those
  const opts = await pg.evaluate(`[...document.querySelectorAll("#aul-university option")].map((o) => o.textContent)`);
  check("university filter options (by name, with counts, plus 'no university')", JSON.stringify(opts) === JSON.stringify(["All universities", "IBA Karachi (1)", "SZABIST (2)", "no university (1)"]), JSON.stringify(opts));
  await pg.evaluate(`(() => { const sel = document.getElementById("aul-university"); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(sel, ${JSON.stringify(U1._id)}); sel.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  await sleep(600);
  t = await text();
  check("filtered to SZABIST: Sana and Ayesha only", t.includes("Sana") && t.includes("Ayesha") && !t.includes("Bilal") && !t.includes("Omar"));
  check("select all filtered (2)", await click(/^select all filtered \(2\)$/i));
  await sleep(400);
  check("2 selected", (await text()).includes("2 selected"));

  // the copied text, captured in the page
  await pg.evaluate(`(() => { window.__copied = null; Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (s) => { window.__copied = s; } } }); return true; })()`);
  check("copy ids", await click(/^copy ids$/i));
  await sleep(500);
  const copied = await pg.evaluate(`window.__copied`);
  check("copied text is ids:<SZABIST students, list order>", copied === `ids:${students[0]._id},${students[2]._id}`, copied);

  // back to all universities: the selection stays, and a row checkbox adds one more without opening the profile
  await pg.evaluate(`(() => { const sel = document.getElementById("aul-university"); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(sel, "all"); sel.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  await sleep(500);
  const before = await pg.evaluate(`document.querySelectorAll("[role=dialog]").length`);
  await pg.evaluate(`document.querySelector('input[aria-label="select Omar"]').click(); true`);
  await sleep(600);
  t = await text();
  check("row checkbox selects without opening the profile", t.includes("3 selected") && (await pg.evaluate(`document.querySelectorAll("[role=dialog]").length`)) === before);
  check("select all filtered now offers 4", (await btn(/^select all filtered \(4\)$/i)).found);

  // clipboard unavailable: the ids are shown in a read-only field
  await pg.evaluate(`(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } }); document.execCommand = () => false; return true; })()`);
  await click(/^copy ids$/i);
  await sleep(500);
  const shown = await pg.evaluate(`document.querySelector('input[aria-label="selected ids"]')?.value || null`);
  check("no clipboard: the ids are shown to copy by hand", shown === `ids:${students[0]._id},${students[2]._id},${students[3]._id}`, shown);

  // axe on the page with rows selected
  await pg.evaluate(AXE + "; true");
  const v = await pg.evaluate(`(async () => { const el = document.querySelector("main") || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
  check("axe WCAG 2 A/AA on the students list", v.length === 0, v.length ? JSON.stringify(v) : "no violations");

  check("clear", await click(/^clear$/i));
  await sleep(300);
  check("0 selected after clear", (await text()).includes("0 selected"));

  // brands: checkboxes and copy ids, no university filter; the selection doesn't carry over between lists
  check("open all brands from the menu", await click(/^all brands$/i));
  await sleep(2500);
  t = await text();
  check("brands list with checkboxes, no university filter", t.includes("Alpha Cafe") && (await pg.evaluate(`document.querySelectorAll("table input[type=checkbox]").length`)) === 3 && !(await pg.evaluate(`!!document.getElementById("aul-university")`)));
  check("brands start with 0 selected", t.includes("0 selected"));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
