// node --experimental-websocket job-skills-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// A job's skills as tags (portal/SkillTagInput.js; server: services/jobs/skills.js), against a mock API:
// - employer, edit a job, Requirements: the job's skills are chips; type + Enter adds one; a pasted list (bullets,
//   " - ", brackets) becomes suggested chips to confirm, one left out; × removes a chip; the save sends the tags as a
//   list; the server's skills error is shown and the form stays; a second save goes through;
// - Upload Jobs CSV: rows the server didn't save because of their skills are listed with row number and reason;
// - admin, career portal: "Skills to fix" lists jobs with broken skills (read-only; GET only) and "edit" opens the job;
// - axe-core WCAG 2 A / AA on the form with chips and suggestions, and on the report; no console errors.
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5188, API = 5197;
const E = "6ae9eeeeeeeeeeeeeeeeeeee", ADMIN = "6ae9ffffffffffffffffffff", J1 = "6ae9b1b1b1b1b1b1b1b1b1b1", J2 = "6ae9b2b2b2b2b2b2b2b2b2b2";
const now = Date.now();
const job = (id, extra) => ({ _id: id, title: "Backend intern", department: "Engineering", category: "Technology", location: "Karachi", locationType: "On-site", type: "Internship", salary: "PKR 40,000", email: "hr@hireco.test", description: "Build APIs", requirements: [], responsibilities: [], benefits: [], perks: [], skills: ["React", "Node.js"], experienceLevel: "Entry Level", education: "Bachelor's Degree", active: true, applicationDeadline: new Date(now + 20 * 864e5).toISOString(), createdAt: new Date(now - 864e5).toISOString(), totalApplications: 0, ...extra });
const LONG = "We are looking for someone who knows React and Node.js very well";
const report = { checked: 2, limits: { maxSkills: 15, maxLength: 40 }, jobs: [{ id: J2, title: "Pasted paragraph", companyName: "Acme", active: true, archived: false, skillCount: 2, problems: [{ skill: LONG, reasons: ["over 40 characters (64)"] }] }] };

const calls = [];
let puts = 0;
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  let body = "";
  q.on("data", (c) => (body += c));
  q.on("end", () => {
    calls.push({ k, body: /json/.test(q.headers["content-type"] || "") ? JSON.parse(body || "{}") : null });
    const send = (status, b) => { s.writeHead(status, h); s.end(JSON.stringify(b)); };
    if (k === "GET /api/app/flags/me") return send(200, {});
    if (k === "GET /api/jobs/my-jobs") return send(200, [job(J1)]);
    if (k === "GET /api/jobs/all") return send(200, [job(J1), job(J2, { title: "Pasted paragraph", companyName: "Acme", skills: [LONG, "SQL"] })]);
    if (k === "GET /api/jobs/admin/stats") return send(200, { totalJobs: 2, activeJobs: 2, totalApplications: 0 });
    if (k === "GET /api/jobs/admin/skills-report") return send(200, report);
    if (k === `PUT /api/jobs/update/${J1}`) {
      puts += 1;
      if (puts === 1) return send(400, { error: "Each skill can be at most 40 characters: \"Kubernetes administration and cloud operations\". Split long text into separate skills.", code: "INVALID_SKILLS" });
      return send(200, { message: "Job updated successfully", data: job(J1) });
    }
    if (k === "POST /api/jobs/admin/import-csv") return send(200, { success: true, created: 1, updated: 0, skipped: 0, rejected: [{ row: 3, title: "Writer", company: "Acme", reason: "Each skill can be at most 40 characters: \"xxxx\". Split long text into separate skills." }] });
    return send(200, q.method === "GET" ? [] : { success: true });
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
  const b = await launch(9351);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`  ${cond ? "ok  " : "FAIL"} ${label}${!cond && detail ? `  → ${String(detail).slice(0, 400)}` : ""}`); };
  const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  const open = async (who, p) => {
    const pg = await b.page();
    pg.errs = [];
    await pg.s("Log.enable");
    pg.on((m) => {
      if (m.method === "Runtime.exceptionThrown") pg.errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") pg.errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
    });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    await sleep(3000);
    return pg;
  };
  const audit = async (pg, label, scope) => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => v.id + " " + v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" ; ")); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.join(" | "));
  };
  const click = (pg, sel) => pg.evaluate(`(() => { const e = ${sel}; if (e) e.click(); return !!e; })()`);
  const byText = (scope, txt) => `[...document.querySelectorAll(${JSON.stringify(scope)})].find((x) => x.innerText.trim() === ${JSON.stringify(txt)})`;
  const chips = (pg) => pg.evaluate(`[...document.querySelectorAll('[data-testid="skill-tags"] [role=listitem]')].map((x) => x.innerText.replace("×", "").trim())`);
  const typeIn = (pg, text) => pg.evaluate(`(() => { const i = document.querySelector("#jm-skills"); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(i, ${JSON.stringify(text)}); i.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  const key = (pg, k) => pg.evaluate(`document.querySelector("#jm-skills").dispatchEvent(new KeyboardEvent("keydown", { key: ${JSON.stringify(k)}, bubbles: true, cancelable: true })); true`);
  const paste = (pg, text) => pg.evaluate(`(() => { const dt = new DataTransfer(); dt.setData("text/plain", ${JSON.stringify(text)}); return document.querySelector("#jm-skills").dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true })); })()`);

  console.log("── employer: the job form's skills");
  const emp = { _id: E, id: E, role: "employee", name: "Hire Co", companyName: "Hire Co" };
  const pg = await open(emp, "/employee-jobs");
  check("edit opens the job", await click(pg, `[...document.querySelectorAll("button")].find((x) => /^edit$/i.test(x.innerText.trim()) || x.getAttribute("aria-label") === "Edit job")`));
  await sleep(700);
  await click(pg, `document.querySelectorAll("[role=dialog] [role=tab]")[2]` /* Requirements (icons only on small admin screens) */); await sleep(500);
  check("the job's skills are chips", JSON.stringify(await chips(pg)) === '["React","Node.js"]', JSON.stringify(await chips(pg)));
  await typeIn(pg, "Express"); await sleep(100); await key(pg, "Enter"); await sleep(300);
  check("type + Enter adds a chip and clears the box", JSON.stringify(await chips(pg)) === '["React","Node.js","Express"]' && (await pg.evaluate(`document.querySelector("#jm-skills").value`)) === "");
  const notPrevented = await paste(pg, "Requirements:\n• SQL\n• Python (pandas, numpy) - Git");
  await sleep(400);
  const sugg = await pg.evaluate(`document.querySelector('[data-testid="skill-suggestions"]')?.innerText || ""`);
  check("a pasted list becomes suggested chips to confirm (brackets kept together); nothing added yet", notPrevented === false && /Split the pasted text into 4 skills/.test(sugg) && sugg.includes("Python (pandas, numpy)") && (await chips(pg)).length === 3, sugg.split("\n").join(" | "));
  await audit(pg, "job form with chips and suggestions", "[role=dialog]");
  await click(pg, `document.querySelector('[aria-label="leave out Requirements:"]')`); await sleep(200);
  await click(pg, byText('[data-testid="skill-suggestions"] button', "add these")); await sleep(300);
  check("confirming adds them (the left-out one isn't)", JSON.stringify(await chips(pg)) === '["React","Node.js","Express","SQL","Python (pandas, numpy)","Git"]', JSON.stringify(await chips(pg)));
  await click(pg, `document.querySelector('[aria-label="remove Git"]')`); await sleep(200);
  check("× removes a chip", !(await chips(pg)).includes("Git"));
  check("the counter shows the limits", /5\/15 skills · each up to 40 characters/.test(await pg.evaluate(`document.querySelector('[data-testid="skill-tags"]').innerText`)));
  await click(pg, byText("button", "Update")); await sleep(1200);
  const put1 = calls.filter((c) => c.k === `PUT /api/jobs/update/${J1}`)[0];
  check("save sends the skills as a list of tags", put1 && JSON.stringify(put1.body.skills) === '["React","Node.js","Express","SQL","Python (pandas, numpy)"]', JSON.stringify(put1?.body?.skills));
  const t1 = await pg.evaluate(`document.body.innerText`);
  check("the server's skills error is shown and the form stays open", /at most 40 characters/.test(t1) && (await pg.evaluate(`!!document.querySelector("#jm-skills")`)));
  await click(pg, byText("button", "Update")); await sleep(1200);
  check("a second save goes through", puts === 2 && /Job updated successfully/i.test(await pg.evaluate(`document.body.innerText`)));
  console.log("── Upload Jobs CSV: rows not saved because of their skills");
  await sleep(1500);
  await click(pg, `[...document.querySelectorAll("button")].find((x) => /Upload Jobs CSV|^CSV$/.test(x.innerText.trim()))`); await sleep(600);
  check("the dialog mentions the optional Skills column", /optionally Skills/.test(await pg.evaluate(`document.querySelector("[role=dialog]")?.innerText || ""`)));
  const tmp = path.join(os.tmpdir(), `tdc-skills-check-${Date.now()}.csv`);
  fs.writeFileSync(tmp, "Company,Job Title,Location,Skills\nAcme,Data intern,Lahore,\"SQL, Excel\"\n");
  const doc = await pg.s("DOM.getDocument", { depth: -1, pierce: true });
  const { nodeId } = await pg.s("DOM.querySelector", { nodeId: doc.root.nodeId, selector: 'form#jobs-csv-form input[type=file]' });
  await pg.s("DOM.setFileInputFiles", { files: [tmp], nodeId });
  await sleep(400);
  await click(pg, byText("button", "Upload & Import")); await sleep(1500);
  const rej = await pg.evaluate(`document.querySelector('[data-testid="csv-rejected"]')?.innerText || ""`);
  check("rejected rows are listed with row number, job and reason", /1 row not saved because of their skills/.test(rej) && /row 3 \(Writer, Acme\): Each skill can be at most 40 characters/.test(rej), rej);
  try { fs.unlinkSync(tmp); } catch {}
  if (pg.errs.length) { bad = 1; pg.errs.forEach((e) => console.log("    " + e)); } else console.log("  ok   employer page: no page errors, no console errors");

  console.log("── admin: skills to fix (read-only)");
  const adm = await open({ _id: ADMIN, id: ADMIN, role: "admin", name: "admin" }, "/admin");
  await click(adm, `[...document.querySelectorAll("button, a")].find((x) => x.innerText.trim().toLowerCase() === "career portal")`); await sleep(2500);
  const writesBefore = calls.filter((c) => !c.k.startsWith("GET ")).length;
  check("'Skills to fix' is there for admins", await click(adm, `document.querySelector('button[aria-label="skills to fix"]')`));
  await sleep(1200);
  const rp = await adm.evaluate(`document.querySelector('[data-testid="skills-report"]')?.innerText || ""`);
  check("the report lists the job, the broken skill and why", /1 of 2 jobs need a look/.test(rp) && rp.includes("Pasted paragraph") && rp.includes("We are looking for someone") && /over 40 characters \(64\)/.test(rp), rp.split("\n").join(" | "));
  check("reading it sends no write", calls.filter((c) => !c.k.startsWith("GET ")).length === writesBefore && calls.some((c) => c.k === "GET /api/jobs/admin/skills-report"));
  await audit(adm, "skills to fix report", "[role=dialog]");
  await click(adm, `document.querySelector('[aria-label="edit Pasted paragraph"]')`); await sleep(800);
  await click(adm, `document.querySelectorAll("[role=dialog] [role=tab]")[2]` /* Requirements (icons only on small admin screens) */); await sleep(500);
  check("edit opens that job with its skills as chips, the long one visible to fix", (await chips(adm)).includes(LONG) && (await chips(adm)).includes("SQL"), JSON.stringify(await chips(adm)));
  const empPg = await open(emp, "/employee-jobs");
  check("employers don't get the report button", !(await empPg.evaluate(`!!document.querySelector('button[aria-label="skills to fix"]')`)));
  if (adm.errs.length) { bad = 1; adm.errs.forEach((e) => console.log("    " + e)); } else console.log("  ok   admin page: no page errors, no console errors");

  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
