// node --experimental-websocket surplus-boxes-ui-check.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Brand Surprise Box listings (FLAG_SURPLUS_BOXES), "duplicate" and "cancel box", against a stateful mock API:
// - duplicate: the new-box form prefilled from the box, same pickup times when they're ahead, moved by whole
//   days when they've passed, saved as a draft (POST with status draft);
// - cancel box: lists the open orders it will cancel and the handed-over ones that stay, needs a reason,
//   closes the box first (PATCH status closed with the version), then cancels each open order with the reason;
//   an order that changed meanwhile is read again and cancelled; a closed box with no orders has no button.
// axe-core WCAG 2 A / AA on both dialogs. Exits 1 on any failure.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { launch, go, sleep } = require("./cdp");
const BUILD = path.resolve(process.argv[2]);
const WEB = 5196, API = 5197;
const ok = (data) => ({ success: true, data, requestId: "mock" });

const A = "6ae9aaaaaaaaaaaaaaaaaaaa", BR = "6ae9b1b1b1b1b1b1b1b1b1b1";
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const base = { brand: { id: A, name: "Alpha" }, branch: { id: BR, name: "Alpha Clifton", city: "Karachi", address: "" }, currency: "PKR", contentsMayVary: true, dietary: ["halal"] };
const listings = [
  { ...base, id: "l1", title: "Evening bakery box", price: 450, listPrice: 1200, quantityLeft: 3, quantityTotal: 5, pickupStart: iso(now + 3 * 3600e3), pickupEnd: iso(now + 5 * 3600e3), orderCutoff: iso(now + 4.5 * 3600e3), allergens: ["gluten"], status: "published", version: 3, orders: 3, disclosures: { allergenNotes: "contains gluten and dairy", description: "breads" } },
  { ...base, id: "l2", title: "Lunch rice box", price: 300, listPrice: 800, quantityLeft: 0, quantityTotal: 4, pickupStart: iso(now - 22 * 3600e3), pickupEnd: iso(now - 21 * 3600e3), orderCutoff: iso(now - 21.5 * 3600e3), allergens: [], status: "closed", version: 7, orders: 0, disclosures: { allergenNotes: "none known", description: "rice and curry", bestBefore: iso(now - 20 * 3600e3) } },
];
const mkOrder = (id, ref, state, next, listingId = "l1") => ({ id, ref, state, qty: 1, total: 450, currency: "PKR", paymentState: "unpaid", student: { firstName: "Sana" }, title: "Evening bakery box", listingId, branchId: BR, branchName: "Alpha Clifton", pickupStart: listings[0].pickupStart, pickupEnd: listings[0].pickupEnd, version: 2, next, history: [] });
let orders = [
  mkOrder("o1", "SB-NEW111", "ORDER_PLACED", ["CONFIRMED", "MERCHANT_CANCELLED"]),
  mkOrder("o2", "SB-PRE333", "PREPARING", ["READY_FOR_PICKUP", "MERCHANT_CANCELLED"]),
  mkOrder("o3", "SB-HND444", "PICKUP_VERIFIED", ["COMPLETED"]),
  mkOrder("o4", "SB-OTH555", "ORDER_PLACED", ["CONFIRMED", "MERCHANT_CANCELLED"], "l9"),
];
let staleOnce = true; // o2 changes "meanwhile" once: the first cancel gets STALE_VERSION
const log = [];
http.createServer((q, s) => {
  const h = { "access-control-allow-origin": "*", "access-control-allow-headers": "authorization,content-type,accept,idempotency-key", "access-control-allow-methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS", "content-type": "application/json" };
  if (q.method === "OPTIONS") { s.writeHead(204, h); return s.end(); }
  let raw = "";
  q.on("data", (d) => { raw += d; });
  q.on("end", () => {
    const k = `${q.method} ${q.url.split("?")[0]}`;
    const body = raw ? JSON.parse(raw) : null;
    if (q.method !== "GET") log.push({ k, body });
    let status = 200, out;
    const m = /^POST \/api\/surplus\/merchant\/orders\/(\w+)\/transition$/.exec(k);
    const pl = /^PATCH \/api\/surplus\/merchant\/listings\/(\w+)$/.exec(k);
    const cb = /^POST \/api\/surplus\/merchant\/listings\/(\w+)\/cancel$/.exec(k);
    if (k === "GET /api/app/flags/me") out = { surplusBoxes: true };
    else if (k === "GET /api/branches/my-branches") out = { branches: [{ _id: BR, name: "Alpha Clifton", city: "Karachi", isActive: true }] };
    else if (k === "GET /api/offers/my-offers") out = [{ _id: "6ae9cccccccccccccccccccc", title: "Alpha 20%", discountPercentage: 20, createdAt: new Date().toISOString(), isInStore: true }];
    else if (k === "GET /api/surplus/merchant/listings") out = ok({ listings, blocked: false });
    else if (k === "GET /api/surplus/merchant/summary") out = ok({ orders: 0, boxesOrdered: 0, toCollectAtPickup: 0, collectedAtPickup: 0, noShows: 0, boxesLeft: 3 });
    else if (k === "GET /api/surplus/merchant/orders") out = ok(orders.filter((o) => !["MERCHANT_CANCELLED", "COMPLETED"].includes(o.state)));
    else if (k === "POST /api/surplus/merchant/listings") out = ok({ ...listings[0], id: "l3", status: body.status });
    else if (cb) {
      // the server's cancel box: close it, cancel each open order it still can (with the reason), keep handed-over ones
      const l = listings.find((x) => x.id === cb[1]);
      if (l.status !== "closed" && body.version !== l.version) { status = 409; out = { success: false, error: { code: "STALE_VERSION", message: "changed" } }; }
      else {
        Object.assign(l, { status: "closed", version: l.version + 1 });
        const cancelled = [], stayed = [];
        for (const o of orders.filter((x) => x.listingId === l.id && !["MERCHANT_CANCELLED", "COMPLETED", "CUSTOMER_CANCELLED", "NO_SHOW"].includes(x.state))) {
          if ((o.next || []).includes("MERCHANT_CANCELLED")) { Object.assign(o, { state: "MERCHANT_CANCELLED", next: [], cancelReason: body.reason }); cancelled.push(o.ref); } else stayed.push(o.ref);
        }
        out = ok({ listingId: l.id, closed: true, cancelled, stayed, failed: [] });
      }
    } else if (pl) {
      const l = listings.find((x) => x.id === pl[1]);
      if (body.version !== l.version) { status = 409; out = { success: false, error: { code: "STALE_VERSION", message: "changed" } }; }
      else { Object.assign(l, { status: body.status || l.status, version: l.version + 1 }); out = ok(l); }
    } else if (m) {
      const o = orders.find((x) => x.id === m[1]);
      if (o.id === "o2" && staleOnce) { staleOnce = false; o.version += 1; status = 409; out = { success: false, error: { code: "STALE_VERSION", message: "This order changed meanwhile" } }; }
      else if (body.version !== o.version) { status = 409; out = { success: false, error: { code: "STALE_VERSION", message: "This order changed meanwhile" } }; }
      else { Object.assign(o, { state: body.to, next: [], version: o.version + 1, cancelReason: body.reason }); out = ok(o); }
    } else out = q.method === "GET" ? [] : { success: true };
    s.writeHead(status, h);
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
// what the portal shows in a Karachi datetime-local input
const kInput = (isoStr) => new Date(new Date(isoStr).getTime() + 5 * 3600e3).toISOString().slice(0, 16);

(async () => {
  const b = await launch(9353);
  let bad = 0;
  const check = (label, cond, detail = "") => { if (!cond) bad = 1; console.log(`${cond ? "ok  " : "FAIL"} ${label}${detail ? ": " + detail : ""}`); };
  const pg = await b.page();
  const errs = [];
  pg.on((m) => {
    if (m.method === "Runtime.exceptionThrown") errs.push("exception: " + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || "").split("\n")[0]);
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push("console.error: " + m.params.args.map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 200));
  });
  const brand = { _id: A, id: A, role: "brand", name: "Alpha", brandName: "Alpha Cafe" };
  await go(pg, `http://127.0.0.1:${WEB}/`);
  await pg.evaluate(`localStorage.setItem("token","mock-token"); localStorage.setItem("user", JSON.stringify(${JSON.stringify(brand)})); true`);
  await go(pg, `http://127.0.0.1:${WEB}/surprise-boxes`);
  await sleep(3000);
  const DLG = `[...document.querySelectorAll("[role=dialog]")].pop()`;
  const dialogText = () => pg.evaluate(`(${DLG})?.innerText || ""`);
  const clickSel = (sel) => pg.evaluate(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (e && !e.disabled) e.click(); return !!e && !e.disabled; })()`);
  const clickText = (label, scope = "document") => pg.evaluate(`(() => { const e = [...${scope}.querySelectorAll("button, [role=tab]")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)} && !x.disabled); if (e) e.click(); return !!e; })()`);
  const btnState = (label) => pg.evaluate(`(() => { const e = [...(${DLG}).querySelectorAll("button")].find((x) => x.innerText.trim().toLowerCase() === ${JSON.stringify(label)}); return e ? { found: true, disabled: e.disabled } : { found: false }; })()`);
  const val = (id) => pg.evaluate(`document.getElementById(${JSON.stringify(id)})?.value ?? null`);
  const axe = async (label) => {
    await pg.evaluate(AXE + "; true");
    const v = await pg.evaluate(`(async () => { const r = await axe.run(${DLG}, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } }); return r.violations.map((v) => ({ id: v.id, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })); })()`);
    check(`axe WCAG 2 A/AA: ${label}`, v.length === 0, v.length ? JSON.stringify(v) : "no violations");
  };

  check("open the listings tab", await clickText("listings"));
  await sleep(1500);
  check("duplicate on both boxes; cancel box only where it can do something", (await pg.evaluate(`!!document.querySelector('[aria-label="duplicate Evening bakery box"]') && !!document.querySelector('[aria-label="duplicate Lunch rice box"]') && !!document.querySelector('[aria-label="cancel box Evening bakery box"]') && !document.querySelector('[aria-label="cancel box Lunch rice box"]')`)) === true);

  // duplicate a box whose pickup is still ahead: same times
  await clickSel('[aria-label="duplicate Evening bakery box"]');
  await sleep(700);
  let d = await dialogText();
  check("duplicate dialog: title and note", d.includes("duplicate surprise box") && d.includes('a copy of "Evening bakery box"') && !d.includes("moved"));
  check("prefilled: title, allergens, prices, quantity, same pickup times", (await val("sb-title")) === "Evening bakery box" && (await val("sb-allergen-notes")) === "contains gluten and dairy" && (await val("sb-price")) === "450" && (await val("sb-list")) === "1200" && (await val("sb-qty")) === "5" && (await val("sb-start")) === kInput(listings[0].pickupStart) && (await val("sb-end")) === kInput(listings[0].pickupEnd));
  check("publish now is off: saved as a draft", (await pg.evaluate(`[...(${DLG}).querySelectorAll("input[type=checkbox]")].pop().checked`)) === false && (await btnState("save draft")).found);
  await axe("duplicate dialog");
  await clickText("save draft", DLG);
  await sleep(1200);
  const post = log.find((x) => x.k === "POST /api/surplus/merchant/listings");
  check("POST a new listing: draft, same branch and box", !!post && post.body.status === "draft" && post.body.branchId === BR && post.body.title === "Evening bakery box" && post.body.allergenNotes === "contains gluten and dairy" && post.body.quantityTotal === 5 && post.body.price === 450 && Math.abs(new Date(post.body.pickupStart) - new Date(listings[0].pickupStart)) < 60e3, post ? JSON.stringify({ status: post.body.status, pickupStart: post.body.pickupStart }) : "none");
  check("the original box wasn't changed", !log.some((x) => x.k.startsWith("PATCH")));

  // duplicate yesterday's box: moved a day ahead, same clock times
  await clickSel('[aria-label="duplicate Lunch rice box"]');
  await sleep(700);
  d = await dialogText();
  check("yesterday's box: moved 1 day ahead, same times", d.includes("moved 1 day ahead, same times") && (await val("sb-start")) === kInput(iso(new Date(listings[1].pickupStart).getTime() + 864e5)) && (await val("sb-best")) === kInput(iso(new Date(listings[1].disclosures.bestBefore).getTime() + 864e5)));
  await clickText("cancel", DLG);
  await sleep(400);

  // cancel box
  await clickSel('[aria-label="cancel box Evening bakery box"]');
  await sleep(1200);
  d = await dialogText();
  check("cancel box: the orders it cancels and the ones that stay (other boxes' orders not listed)", d.includes("2 open orders will be cancelled: SB-NEW111, SB-PRE333.") && d.includes("1 order already handed over (SB-HND444) stay as they are.") && !d.includes("SB-OTH555"), d.replace(/\n/g, " | ").slice(0, 300));
  check("needs a reason first", (await btnState("close and cancel 2 orders")).disabled === true);
  await pg.evaluate(`(() => { const el = document.getElementById("sb-box-cancel-reason"); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set.call(el, "our oven broke down"); el.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
  await sleep(300);
  check("with a reason: enabled", (await btnState("close and cancel 2 orders")).disabled === false);
  await axe("cancel box dialog");
  const before = log.length;
  await clickText("close and cancel 2 orders", DLG);
  await sleep(2500);
  const seq = log.slice(before);
  // the server does the whole cancel (closes the box, cancels each open order, keeps handed-over ones): one request
  check("one request: POST …/l1/cancel with the reason and the box's version", seq.length === 1 && seq[0].k === "POST /api/surplus/merchant/listings/l1/cancel" && seq[0].body.reason === "our oven broke down" && seq[0].body.version === 3, JSON.stringify(seq));
  check("the open orders cancelled with the reason; the handed-over one and other boxes' orders untouched", ["o1", "o2"].every((id) => { const o = orders.find((x) => x.id === id); return o.state === "MERCHANT_CANCELLED" && o.cancelReason === "our oven broke down"; }) && orders.find((o) => o.id === "o3").state === "PICKUP_VERIFIED" && orders.find((o) => o.id === "o4").state !== "MERCHANT_CANCELLED", JSON.stringify(orders.map((o) => [o.id, o.state])));
  d = await dialogText();
  check("result: 2 cancelled, box closed", d.includes("2 orders cancelled; the box is closed."));
  await clickText("done", DLG);

  errs.forEach((e) => console.log("    " + e));
  check("no page errors, no console errors", errs.length === 0);
  b.close();
  process.exit(bad);
})().catch((e) => { console.error("FATAL", e.message); process.exit(2); });
