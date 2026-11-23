// node --experimental-websocket auth-me-ui-check.js <buildDir>
// Owner (after P3b): GET /api/auth/me works again (it was answered by /:id with a 400). The six portal screens that
// read it, against a mock API that answers with REAL-SHAPED replies (src/screens/__fixtures__/authMe.json: made by the
// server's own handler and User model, safe shape): each shows the account's details.
//   brand:    Home (the brand shell) and Brand Settings
//   employer: Company Dashboard (the employer shell), Employer Settings, the job manager ("post a job" starts with
//             the company name)
//   travel:   Travel Settings
//   admin:    the admin job manager (Admin Jobs Manager) opens
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5214, API = Number(process.env.CHECK_API_PORT) || 5217;
const ME = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "src", "screens", "__fixtures__", "authMe.json"), "utf8"));
const roleOf = (auth) => (/tok-(brand|employee|traveler|admin)/.exec(auth || "") || [])[1];

const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key,x-device-id", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  calls.push(`${k} ${roleOf(q.headers.authorization) || "-"}`);
  if (k === "GET /api/auth/me") {
    const me = ME[roleOf(q.headers.authorization)];
    s.writeHead(me ? 200 : 401, h);
    return s.end(JSON.stringify(me || { message: "sign in" }));
  }
  if (k === "GET /api/app/flags/me") { s.writeHead(200, h); return s.end(JSON.stringify({ metaEvents: false })); }
  // an employer who may post (so the job manager's "post a job" opens)
  if (k === "GET /api/career/employers/me/hiring-access") { s.writeHead(200, h); return s.end(JSON.stringify({ success: true, data: { canPost: true, enforced: true, trial: { status: "active", label: "free trial", daysLeft: 40, clockStarted: true, days: 60, freeHireUsed: false }, plan: null, lock: null, request: null, policy: { text: "", trialDays: 60 } } })); }
  if (k === "GET /api/admin/me/access") { s.writeHead(200, h); return s.end(JSON.stringify({ success: true, data: { level: "super", permissions: [] } })); }
  s.writeHead(200, h);
  s.end(JSON.stringify(q.method === "GET" ? [] : { success: true }));
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  require("./serve").send(f, s, API);
}).listen(WEB);

(async () => {
  const b = await launch(9391);
  let bad = 0;
  const check = (name, cond, detail = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && detail ? "  (" + String(detail).slice(0, 300) + ")" : ""}`); if (!cond) bad++; };
  const open = async (role, p) => {
    const pg = await b.page();
    pg.errs = [];
    pg.on((m) => { if (m.method === "Runtime.exceptionThrown") pg.errs.push((m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]); });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    const user = { _id: ME[role]._id, name: ME[role].name, role, email: ME[role].email };
    await pg.evaluate(`localStorage.setItem("token","tok-${role}"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(user)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    await sleep(3500);
    return pg;
  };
  const text = (pg) => pg.evaluate(`document.body.innerText || ""`);
  const meCalled = (role) => calls.some((c) => c === `GET /api/auth/me ${role}`);

  // brand: Home + Brand Settings
  let pg = await open("brand", "/home");
  let t = await text(pg);
  check("Home (brand): /auth/me answered and the brand name shows", meCalled("brand") && /Chai Spot/.test(t), t.slice(0, 200));
  check("…no page error", !pg.errs.length, pg.errs.join(" | "));
  pg = await open("brand", "/settings");
  t = await text(pg);
  check("Brand Settings: brand name, contact, e-mail, phone, city, category, address", ["Chai Spot", "Hamza Qureshi", "owner@chaispot.example", "03001234567", "Karachi", "Food", "Shop 4, Block 2, Gulshan"].every((x) => t.includes(x)), t.slice(0, 400));
  check("…approval shown, no page error", /approved/i.test(t) && !pg.errs.length, pg.errs.join(" | "));

  // employer: Company Dashboard + Employer Settings + job manager
  pg = await open("employee", "/employee-dashboard");
  t = await text(pg);
  check("Company Dashboard (employer): /auth/me answered and the company name shows", meCalled("employee") && /Acme Pvt Ltd/.test(t), t.slice(0, 200));
  check("…no page error", !pg.errs.length, pg.errs.join(" | "));
  pg = await open("employee", "/settings");
  t = await text(pg);
  check("Employer Settings: company, hiring contact, e-mail, phone, city", ["Acme Pvt Ltd", "Ayesha Raza", "hr@acme.example", "03001234567", "Lahore"].every((x) => t.includes(x)), t.slice(0, 400));
  check("…no page error", !pg.errs.length, pg.errs.join(" | "));
  pg = await open("employee", "/employee-jobs");
  await pg.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => /post (new|a) job|post your first job/i.test(x.innerText)); if (b && !b.disabled) b.click(); return !!b; })()`);
  await sleep(800);
  // the company name sits on the form's "Company Info" tab
  await pg.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => x.innerText.trim() === "Company Info"); if (b) b.click(); return !!b; })()`);
  await sleep(800);
  const prefilled = await pg.evaluate(`(() => { const i = [...document.querySelectorAll("input")].find((x) => x.value === "Acme Pvt Ltd"); return !!i; })()`);
  check("job manager (employer): a new job starts with the company name from /auth/me", prefilled === true, (await text(pg)).slice(0, 200));

  // travel: Travel Settings
  pg = await open("traveler", "/settings");
  t = await text(pg);
  check("Travel Settings: name, e-mail, phone, city", meCalled("traveler") && ["Trail Co", "hello@trail.example", "03001234567", "Islamabad"].every((x) => t.includes(x)), t.slice(0, 400));
  check("…no page error", !pg.errs.length, pg.errs.join(" | "));

  // admin: the job manager in the admin portal
  pg = await open("admin", "/admin");
  await pg.evaluate(`(() => { const b = [...document.querySelectorAll("a,button")].find((x) => /^jobs & internships$/i.test((x.innerText || "").trim())); if (b) b.click(); return !!b; })()`);
  await sleep(2500);
  t = await text(pg);
  check("Admin Jobs Manager: opens, /auth/me answered", meCalled("admin") && /job/i.test(t), t.slice(0, 200));
  check("…no page error", !pg.errs.length, pg.errs.join(" | "));

  await b.close();
  console.log(bad ? `\n${bad} failed` : "\nall passed");
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
