// node --experimental-websocket company-proof-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Company verification with proof (feat/company-proof), against a mock API:
// - employer menu: "company verification" always there, with its status chip (not submitted / under review / needs info)
// - /company-verification: domain and website marked optional; sending with no proof shows the error and sends
//   nothing; a PDF uploads (kind + file) and is listed; sending with only that document sends its id; the menu chip
//   turns "under review"
// - needs info: the reason is shown as an alert; sending again works
// - admin company verifications: the proof given and an "open" button per document (fetched with the admin's
//   sign-in); request info asks for a reason and sends action request_info
// - axe-core WCAG 2 A / AA on each; no console errors.
const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = Number(process.env.CHECK_WEB_PORT) || 5192, API = Number(process.env.CHECK_API_PORT) || 5197; // run.js gives each check its own ports when they run side by side
const ok = (data) => ({ success: true, data, requestId: "mock" });
const E = "6aec11111111111111111111", ADMIN = "6aecffffffffffffffffffff";
let mode = "not_submitted"; // not_submitted | under_review | needs_info
let submitted = null;
const uploads = [];
const doc = { id: "6aecd0c0d0c0d0c0d0c0d0c0", kind: "ntn_certificate", fileName: "ntn.pdf", mimeType: "application/pdf", size: 2048, uploadedAt: new Date().toISOString() };
const verification = () => (mode === "not_submitted" ? null : { id: "v1", status: mode === "needs_info" ? "needs_info" : "pending", companyName: "Karachi Tailors", registrationType: "ntn", ntnOrSecp: "12345678", businessEmailDomain: "", website: "", documents: [doc], reason: mode === "needs_info" ? "The NTN scan is unreadable: upload a clearer one" : "", submittedAt: new Date().toISOString() });
const myCompany = () => ({ verified: false, chip: mode, verification: verification(), actionNeeded: mode === "needs_info" ? { status: "needs_info", reason: "The NTN scan is unreadable: upload a clearer one" } : null, pendingJobs: [], message: "Your jobs go live once your company is verified by tdc." });
const adminRow = { id: "v1", employer: { id: E, name: "Small Shop", email: "shop@test.local", accountStatus: "Verified" }, companyName: "Karachi Tailors", registrationType: "ntn", ntnOrSecp: "12345678", businessEmailDomain: "", website: "", companyGroupKey: "reg:12345678", status: "pending", reason: "", submittedAt: new Date().toISOString(), hints: { signInEmailMatchesDomain: false, websiteMatchesDomain: false }, proof: { emailDomain: false, website: false, documents: 1 }, documents: [doc], duplicateOf: [], history: [], pendingJobs: [] };
const PDF = Buffer.from("%PDF-1.4\n% test\n%%EOF\n");

const calls = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const k = `${q.method} ${q.url.split("?")[0]}`;
  const chunks = [];
  q.on("data", (c) => chunks.push(c));
  q.on("end", () => {
    const raw = Buffer.concat(chunks);
    let body = null;
    if (/json/.test(q.headers["content-type"] || "")) { try { body = JSON.parse(raw.toString() || "null"); } catch {} }
    calls.push({ k, body, auth: q.headers.authorization || "", type: q.headers["content-type"] || "", raw });
    const send = (status, b) => { s.writeHead(status, h); s.end(JSON.stringify(b)); };
    if (k === "GET /api/app/flags/me") return send(200, {});
    if (k === "GET /api/auth/me") return send(200, { _id: E, name: "Small Shop", role: "employee", companyName: "Karachi Tailors" });
    if (k === "GET /api/career/employers/me/company-verification") return send(200, ok(myCompany()));
    if (k === "POST /api/career/employers/me/company-verification/documents") { uploads.push(raw.toString("latin1")); return send(201, ok(doc)); }
    if (k === "POST /api/career/employers/me/company-verification") { submitted = body; mode = "under_review"; return send(mode === "under_review" ? 200 : 201, ok(myCompany())); }
    if (k === "GET /api/career/admin/company-verifications") return send(200, ok([adminRow]));
    if (k === `GET /api/career/admin/company-verifications/v1/documents/${doc.id}`) { s.writeHead(200, { ...h, "content-type": "application/pdf" }); return s.end(PDF); }
    if (k === "POST /api/career/admin/company-verifications/v1/review") return send(200, ok({ id: "v1", status: body?.action === "request_info" ? "needs_info" : "approved", publishedJobs: 0 }));
    return send(200, q.method === "GET" ? [] : { success: true });
  });
}).listen(API);
const types = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon", ".woff2": "font/woff2" };
http.createServer((q, s) => {
  let f = path.join(BUILD, decodeURIComponent(q.url.split("?")[0]));
  if (!f.startsWith(BUILD) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(BUILD, "index.html");
  s.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
  require("./serve").send(f, s, API); // the build, with this check's mock API port
}).listen(WEB);

(async () => {
  const b = await launch(9481);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`  ${cond ? "ok  " : "FAIL"} ${label}${!cond && detail ? `  → ${String(detail).slice(0, 400)}` : ""}`); };
  const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js", { paths: [path.resolve(__dirname, "..", "..")] }), "utf8");
  const pages = [];
  const open = async (who, p) => {
    const pg = await b.page();
    pg.errs = [];
    pages.push(pg);
    pg.on((m) => {
      if (m.method === "Runtime.exceptionThrown") pg.errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
      if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") pg.errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
    });
    await go(pg, `http://127.0.0.1:${WEB}/`);
    await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(who)})); true`);
    await go(pg, `http://127.0.0.1:${WEB}${p}`);
    // rendered, and its requests settled (the admin menu's items appear once their availability calls answer)
    await pg.waitFor(`(document.getElementById("root")?.innerText || "").trim().length > 20`, { timeout: 25000, label: `${p} to render` });
    await pg.settled();
    return pg;
  };
  const audit = async (pg, label, scope) => {
    await pg.evaluate(AXE + ";true");
    const v = await pg.evaluate(`(async () => { const el = document.querySelector(${JSON.stringify(scope)}) || document; const r = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => v.id + " " + v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" ; ")); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.join(" | "));
  };
  const text = (pg, sel = "body") => pg.evaluate(`document.querySelector(${JSON.stringify(sel)})?.innerText || ""`);
  const chip = (pg) => pg.evaluate(`document.querySelector('[data-chip="company"]')?.innerText.trim() || null`);
  const chipHtml = (pg) => pg.evaluate(`document.querySelector('[data-chip="company"]')?.outerHTML || 'none'`);
  const click = (pg, re, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button, a")].find((x) => ${re}.test((x.getAttribute("aria-label") || x.innerText).trim()) && !x.disabled); if (e) e.click(); return !!e; })()`);
  const setVal = (pg, sel, v, proto = "HTMLInputElement") => pg.evaluate(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(${proto}.prototype, "value").set.call(i, ${JSON.stringify(v)}); i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  const emp = { _id: E, id: E, role: "employee", name: "Small Shop", companyName: "Karachi Tailors" };

  console.log("── the employer menu");
  let pg = await open(emp, "/employee-dashboard");
  const item = await pg.evaluate(`(() => { const e = document.querySelector('.tdcp-nav [data-page="company"]'); return e ? { href: e.getAttribute("href"), text: e.innerText.replace(/\\s+/g, " ").trim() } : null; })()`);
  check("'company verification' is in the menu, linking to /company-verification", item && item.href === "/company-verification" && /company verification/.test(item.text), JSON.stringify(item));
  check("its chip: not submitted", (await chip(pg)) === "not submitted", await chipHtml(pg));
  await audit(pg, "employer menu with the chip", ".tdcp-nav");

  console.log("── send with only a document");
  pg = await open(emp, "/company-verification");
  t = await text(pg, '[data-screen="company-verification"]');
  check("domain and website marked optional; documents explained", /company e-mail domain \(optional\)/.test(t) && /website \(optional\)/.test(t) && /only tdc's team can open them/.test(t), t.split("\n").join(" | ").slice(0, 300));
  check("on this page the menu item is current", await pg.evaluate(`document.querySelector('.tdcp-nav [data-page="company"]')?.getAttribute("aria-current") === "page"`));
  await audit(pg, "company verification form", '[data-screen="company-verification"]');
  await setVal(pg, "#cv-name", "Karachi Tailors");
  await setVal(pg, "#cv-reg", "1234567-8");
  await click(pg, /^send for verification$/);
  await pg.settled();
  check("no proof: the error is shown and nothing is sent", /add at least one/.test(await text(pg, '[data-testid="proof-error"]')) && !calls.some((c) => c.k === "POST /api/career/employers/me/company-verification"));
  const tmp = path.join(os.tmpdir(), `tdc-ntn-${Date.now()}.pdf`);
  fs.writeFileSync(tmp, PDF);
  const dom = await pg.s("DOM.getDocument", { depth: -1, pierce: true });
  const { nodeId } = await pg.s("DOM.querySelector", { nodeId: dom.root.nodeId, selector: '[data-screen="company-verification"] input[type=file]' });
  await pg.s("DOM.setFileInputFiles", { files: [tmp], nodeId });
  await pg.settled();
  await click(pg, /^add document$/);
  await pg.settled();
  check("the PDF uploads with its kind (multipart) and is listed", uploads.length === 1 && /name="kind"\r\n\r\nntn_certificate/.test(uploads[0]) && /%PDF-1.4/.test(uploads[0]) && /NTN certificate: ntn.pdf/.test(await text(pg, '[data-testid="cv-docs"]')), (uploads[0] || "").slice(0, 200));
  await audit(pg, "form with a document", '[data-screen="company-verification"]');
  await click(pg, /^send for verification$/);
  await pg.settled();
  check("sent with only the document: documentIds, empty domain and website", submitted && JSON.stringify(submitted.documentIds) === JSON.stringify([doc.id]) && submitted.businessEmailDomain === "" && submitted.website === "", JSON.stringify(submitted));
  check("the menu chip turns 'under review'", (await chip(pg)) === "under review", await chip(pg));
  try { fs.unlinkSync(tmp); } catch {}

  console.log("── needs info");
  mode = "needs_info";
  pg = await open(emp, "/company-verification");
  t = await text(pg, '[data-testid="action-needed"]');
  check("what's needed is shown (alert) and the chip says needs info", /tdc needs more information/.test(t) && /clearer one/.test(t) && (await chip(pg)) === "needs info", t);
  await audit(pg, "needs info", '[data-screen="company-verification"]');
  submitted = null;
  await click(pg, /^send again$/);
  await pg.settled();
  check("sending again works (the attached document kept)", submitted && JSON.stringify(submitted.documentIds) === JSON.stringify([doc.id]) && (await chip(pg)) === "under review");

  console.log("── admin");
  pg = await open({ _id: ADMIN, id: ADMIN, role: "admin", name: "admin" }, "/admin");
  await pg.waitFor(`!!document.querySelector('.tdcp-nav [data-page="company_verifications"]')`, { timeout: 20000, label: "'company_verifications' in the menu" }).then(() => pg.evaluate(`document.querySelector('.tdcp-nav [data-page="company_verifications"]').click(); true`)).catch(() => false);
  await pg.settled();
  t = await text(pg, `[data-proof="v1"]`);
  check("proof given: 1 document, with an open button", /1 document/.test(t) && /NTN certificate/.test(t), t);
  check("no own domain / no website are said plainly", /no own domain/.test(await text(pg, '[data-screen="company-verifications"]')) && /no website/.test(await text(pg, '[data-screen="company-verifications"]')));
  await audit(pg, "admin company verifications with proof", '[data-screen="company-verifications"]');
  await click(pg, /^open NTN certificate of Karachi Tailors$/);
  await pg.settled();
  const got = calls.filter((c) => c.k === `GET /api/career/admin/company-verifications/v1/documents/${doc.id}`);
  check("open fetches the document with the admin's sign-in", got.length === 1 && /^Bearer /.test(got[0].auth));
  await click(pg, /^request info$/);
  await pg.settled();
  check("request info: the dialog says the employer sees it; the reason is required", /the employer sees it and sends the details again/.test(await text(pg, "[role=dialog]")) && (await pg.evaluate(`[...document.querySelectorAll("[role=dialog] button")].find((x) => x.innerText.trim() === "request info")?.disabled === true`)));
  await audit(pg, "request info dialog", "[role=dialog]");
  await setVal(pg, "#cv-reason", "upload a clearer NTN scan", "HTMLTextAreaElement");
  await click(pg, /^request info$/, `document.querySelector("[role=dialog]")`);
  await pg.settled();
  const rv = calls.filter((c) => c.k === "POST /api/career/admin/company-verifications/v1/review").slice(-1)[0];
  check("sends { action: request_info, reason }", rv && rv.body.action === "request_info" && rv.body.reason === "upload a clearer NTN scan", JSON.stringify(rv?.body));

  const errs = pages.flatMap((p) => p.errs);
  check("no page errors, no console errors", errs.length === 0, errs.join(" | "));
  console.log(bad ? "\nFAIL" : "\nall ok");
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
var t;
