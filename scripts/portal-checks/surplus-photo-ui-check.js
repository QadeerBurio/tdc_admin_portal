// node --experimental-websocket surplus-photo-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// A Surprise Box's optional photo in the brand portal (FLAG_SURPLUS_BOXES), against a mock API:
// - a box without a photo looks as before and offers "add photo"; one with a photo shows it (alt = the box title)
//   with "change photo" / "remove photo"; an ordered box has no photo buttons;
// - a valid jpg is sent as multipart (image + version); a file over 5 MB or a pdf is refused before sending;
// - remove sends DELETE with the version. axe-core WCAG 2 A / AA on the listings. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const A = "6afc000000000000000000a1", BR = "6afc000000000000000000b1";
const now = Date.now();
const iso = (h) => new Date(now + h * 3600e3).toISOString();
const PIX = "data:image/svg+xml;base64," + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="#f2c230"/></svg>').toString("base64");
const base = (id, title, extra = {}) => ({ id, title, brand: { id: A, name: "Alpha" }, branch: { id: BR, name: "Alpha Clifton", city: "Karachi" }, price: 450, listPrice: 1200, currency: "PKR", quantityLeft: 3, quantityTotal: 5, pickupStart: iso(3), pickupEnd: iso(4), orderCutoff: iso(3.5), contentsMayVary: true, allergens: [], dietary: [], status: "published", version: 2, orders: 0, image: null, disclosures: { allergenNotes: "none known" }, ...extra });
const listings = [base("6afd000000000000000000a1", "Plain box"), base("6afd000000000000000000a2", "Pretty box", { image: PIX }), base("6afd000000000000000000a3", "Ordered box", { orders: 2 })];
const writes = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  const chunks = [];
  q.on("data", (d) => chunks.push(d));
  q.on("end", () => {
    const raw = Buffer.concat(chunks).toString("latin1");
    const k = `${q.method} ${q.url.split("?")[0]}`;
    let out;
    const m = /^(POST|DELETE) \/api\/surplus\/merchant\/listings\/(\w+)\/image$/.exec(k);
    if (k === "GET /api/app/flags/me") out = { surplusBoxes: true };
    else if (k === "GET /api/branches/my-branches") out = { branches: [{ _id: BR, name: "Alpha Clifton", city: "Karachi", isActive: true }] };
    else if (k === "GET /api/offers/my-offers") out = [{ _id: "6afe00000000000000000001", title: "Alpha 20%", discountPercentage: 20, createdAt: new Date().toISOString(), isInStore: true }];
    else if (k === "GET /api/surplus/merchant/listings") out = ok({ listings, blocked: false });
    else if (k === "GET /api/surplus/merchant/summary") out = ok({ orders: 0 });
    else if (k === "GET /api/surplus/merchant/orders") out = ok([]);
    else if (m) {
      writes.push({ method: m[1], id: m[2], type: q.headers["content-type"] || "", raw });
      const l = listings.find((x) => x.id === m[2]);
      Object.assign(l, { image: m[1] === "POST" ? PIX : null, version: l.version + 1 });
      out = ok(l);
    } else out = q.method === "GET" ? [] : { success: true };
    s.writeHead(200, h);
    s.end(JSON.stringify(out));
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
  const b = await launch(9362);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify({ _id: A, id: A, role: "brand", name: "Alpha", brandName: "Alpha Bakery" })})); true`);
  await go(pg, `http://127.0.0.1:${WEB}/surprise-boxes`);
  await sleep(3000);
  await pg.evaluate(`[...document.querySelectorAll("[role=tab]")].find((x) => x.innerText.trim() === "listings")?.click(); true`);
  await sleep(1500);
  const cardText = (title) => pg.evaluate(`document.querySelector('[data-listing="${title}"]')?.innerText || ""`);
  check("no photo: no image, 'add photo'", (await cardText("Plain box")).includes("add photo") && (await pg.evaluate(`!document.querySelector('[data-listing="Plain box"] img')`)));
  check("with a photo: the image (alt = title), change and remove", (await pg.evaluate(`document.querySelector('[data-listing="Pretty box"] img')?.alt`)) === "Pretty box" && (await cardText("Pretty box")).includes("change photo") && (await cardText("Pretty box")).includes("remove photo"));
  check("an ordered box: no photo buttons, says why", !(await cardText("Ordered box")).includes("add photo") && (await cardText("Ordered box")).includes("students have ordered"));
  await pg.evaluate(AXE + "; true");
  const v = await pg.evaluate(`(async () => { const r = await axe.run(document.querySelector("main") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
  check("axe WCAG 2 A/AA: listings with photos", v.length === 0, v.length ? JSON.stringify(v) : "no violations");
  const setFile = (id, name, type, size) => pg.evaluate(`(() => { const el = document.querySelector('[data-photo-input="${id}"]'); const dt = new DataTransfer(); dt.items.add(new File([new Uint8Array(${size})], ${JSON.stringify(name)}, { type: ${JSON.stringify(type)} })); el.files = dt.files; el.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
  await setFile("6afd000000000000000000a1", "huge.jpg", "image/jpeg", 6 * 1024 * 1024);
  await sleep(500);
  await setFile("6afd000000000000000000a1", "menu.pdf", "application/pdf", 1000);
  await sleep(500);
  check("over 5 MB or a pdf: refused before sending", writes.length === 0);
  await setFile("6afd000000000000000000a1", "box.jpg", "image/jpeg", 2000);
  await sleep(1500);
  const w = writes[0] || {};
  check("a jpg: POST multipart with the image and the version", w.method === "POST" && /multipart\/form-data/.test(w.type) && /name="version"\r\n\r\n2\r\n/.test(w.raw) && /name="image"; filename="box.jpg"/.test(w.raw), (w.type || "") + " " + (w.raw || "").slice(0, 120).replace(/\r\n/g, "|"));
  check("…the card now shows it", await pg.evaluate(`!!document.querySelector('[data-listing="Plain box"] img')`));
  await pg.evaluate(`document.querySelector('[aria-label="remove the photo of Pretty box"]').click(); true`);
  await sleep(1200);
  const d = writes[1] || {};
  check("remove: DELETE with the version", d.method === "DELETE" && d.id === "6afd000000000000000000a2" && JSON.parse(d.raw || "{}").version === 2, JSON.stringify({ m: d.method, raw: d.raw }));

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
