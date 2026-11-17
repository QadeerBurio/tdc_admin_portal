// Minimal Chrome DevTools Protocol driver (no packages). Run with: node --experimental-websocket (Node 20-21;
// Node 22+ has WebSocket built in). Chrome: CHROME_PATH, or the usual install places on Windows, macOS, Linux.
// Each browser gets its own throw-away profile (CDP_PROFILE_DIR for the parent folder), removed when it closes.
//
// Made for a busy machine (scripts/portal-checks run one after another, sometimes while other work runs):
//   - Chrome picks a free debugging port (--remote-debugging-port=0, read from DevToolsActivePort), so a Chrome left
//     over from a killed run is never reused; the port passed to launch() is only a label
//   - every DevTools command has a timeout (CDP_COMMAND_TIMEOUT_MS, default 30 s): a stalled Chrome fails the
//     check instead of hanging it
//   - Chrome is killed when the check's process exits for any reason
//   - waits on real conditions: page.waitFor(expression), page.waitForText(texts), page.clickWhen(expression),
//     page.idle() (no network request for a moment), page.settled() (idle and no CSS animation or transition
//     running: run it before axe, or a dialog still fading in reads as low contrast); each with a timeout
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const COMMAND_MS = Number(process.env.CDP_COMMAND_TIMEOUT_MS) || 30000;
const WAIT_MS = Number(process.env.CDP_WAIT_TIMEOUT_MS) || 20000;

const browsers = new Set();
const killAll = () => { for (const p of browsers) { try { p.kill(); } catch {} } browsers.clear(); };
process.on("exit", killAll);
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(sig, () => { killAll(); process.exit(130); });

async function launch(label = 9333) {
  if (!CHROME) throw new Error("Chrome not found: set CHROME_PATH to the Chrome (or Chromium) executable");
  const prof = fs.mkdtempSync(path.join(process.env.CDP_PROFILE_DIR || os.tmpdir(), `tdc-portal-checks-${label}-`));
  const proc = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", ...(process.env.CDP_ARGS ? process.env.CDP_ARGS.split(" ") : []), "--remote-debugging-port=0", `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  browsers.add(proc);
  const cleanup = () => { browsers.delete(proc); try { proc.kill(); } catch {} setTimeout(() => { try { fs.rmSync(prof, { recursive: true, force: true }); } catch {} }, 500).unref(); };
  // the port Chrome picked
  let port = null;
  for (let i = 0; i < 150 && !port; i++) {
    try { port = Number(fs.readFileSync(path.join(prof, "DevToolsActivePort"), "utf8").split("\n")[0]) || null; } catch {}
    if (!port) await sleep(100);
  }
  let ver;
  for (let i = 0; port && i < 100 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(100); } }
  if (!ver) { cleanup(); throw new Error(`Chrome (${label}) did not open its debugging port within 15 s`); }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r, j) => { const t = setTimeout(() => j(new Error("Chrome's DevTools socket didn't open")), 10000); ws.addEventListener("open", () => { clearTimeout(t); r(); }, { once: true }); });
  let id = 0; const pending = new Map(); const listeners = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { res, rej, t } = pending.get(m.id); clearTimeout(t); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else listeners.forEach((l) => l(m));
  });
  ws.addEventListener("close", () => { for (const { rej, t } of pending.values()) { clearTimeout(t); rej(new Error("Chrome closed the DevTools connection")); } pending.clear(); });
  const send = (method, params = {}, sessionId, ms = COMMAND_MS) => new Promise((res, rej) => {
    const i = ++id;
    const t = setTimeout(() => { pending.delete(i); rej(new Error(`DevTools ${method} took over ${ms} ms`)); }, ms);
    pending.set(i, { res, rej, t });
    try { ws.send(JSON.stringify({ id: i, method, params, sessionId })); } catch (e) { clearTimeout(t); pending.delete(i); rej(e); }
  });
  async function page() {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    // after an action (navigation, a click, a key, a file) the page is "dirty": its next read first waits until it has
    // settled (no request in flight, nothing animating). So a check never reads, or clicks into, a page that is still
    // loading what the action asked for, on a quiet machine or a busy one; a leftover fixed sleep is just extra time.
    let dirty = false;
    const ACTIONS = new Set(["Page.navigate", "Page.reload", "Input.dispatchKeyEvent", "Input.dispatchMouseEvent", "Input.insertText", "DOM.setFileInputFiles"]);
    const s = (m, p, ms) => { if (ACTIONS.has(m)) dirty = true; return send(m, p, sessionId, ms); };
    const waitEvent = (name, ms = 30000) => new Promise((res) => { const t = setTimeout(res, ms); listeners.push((m) => { if (m.sessionId === sessionId && m.method === name) { clearTimeout(t); res(m.params); } }); });
    // requests in flight (for idle())
    let settledRef = null; // set below (evaluate uses it before an axe scan)
    const inflight = new Map(); // requestId -> when it started (a long-poll / socket left open isn't "busy")
    let lastNet = Date.now();
    listeners.push((m) => {
      if (m.sessionId !== sessionId) return;
      if (m.method === "Network.requestWillBeSent") { inflight.set(m.params.requestId, Date.now()); lastNet = Date.now(); }
      else if (m.method === "Network.loadingFinished" || m.method === "Network.loadingFailed") { inflight.delete(m.params.requestId); lastNet = Date.now(); }
    });
    await s("Page.enable"); await s("Runtime.enable"); await s("Network.enable");
    // an expression's value; a long one (axe) gets a longer command timeout
    // an axe scan always runs on a settled page (no request in flight, nothing fading in): a dialog still animating
    // reads as low contrast; every check gets this, whatever its own audit helper looks like
    const evaluate = async (expr, ms = COMMAND_MS * 2) => {
      if ((dirty || expr.includes("axe.run(")) && settledRef) { dirty = false; await settledRef(); }
      const r = await s("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }, ms);
      // an expression that clicks, dispatches an event or sets a value is an action too
      if (/\.click\(|dispatchEvent\(|\.focus\(|\.call\(\s*\w+\s*,/.test(expr)) dirty = true;
      if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
      return r.result.value;
    };
    const on = (fn) => listeners.push((m) => { if (m.sessionId === sessionId) fn(m); });
    /** wait until the expression is truthy (polled); returns its value; throws naming `label` after `timeout` ms */
    const waitFor = async (expr, { timeout = WAIT_MS, label = expr.slice(0, 80), interval = 100 } = {}) => {
      const end = Date.now() + timeout;
      let last;
      while (Date.now() < end) {
        try { last = await evaluate(`(() => { try { return (${expr}); } catch { return null; } })()`, 10000); } catch { last = null; }
        if (last) return last;
        await sleep(interval);
      }
      throw new Error(`timed out after ${timeout} ms waiting for: ${label}`);
    };
    /** wait until every text is in the element's text (case-insensitive); returns the text */
    const waitForText = (texts, { scope = "#root", timeout, label } = {}) => {
      const want = JSON.stringify(texts.map((t) => t.toLowerCase()));
      return waitFor(`(() => { const t = (document.querySelector(${JSON.stringify(scope)})?.innerText || ""); const l = t.toLowerCase(); return ${want}.every((w) => l.includes(w)) && t.trim().length > 0 ? t : null; })()`, { timeout, label: label || `${scope} to show ${texts.join(" | ")}` });
    };
    /** wait for an element (an expression giving it), then click it */
    const clickWhen = async (elementExpr, { timeout, label = elementExpr.slice(0, 80) } = {}) => {
      await waitFor(`(() => { const e = ${elementExpr}; return !!e && !e.disabled; })()`, { timeout, label: `${label} to be clickable` });
      await evaluate(`(() => { const e = ${elementExpr}; e.scrollIntoView({ block: "center" }); e.click(); return true; })()`);
    };
    /** no request in flight for `quiet` ms (or `timeout` passed: then go on; a busy page isn't an error) */
    const idle = async ({ quiet = 400, timeout = 10000 } = {}) => {
      const end = Date.now() + timeout;
      while (Date.now() < end) {
        const now = Date.now();
        const busy = [...inflight.values()].some((t) => now - t < 3000); // open longer than 3 s: a long-poll, not loading
        if (!busy && now - lastNet >= quiet) return true;
        await sleep(50);
      }
      return false;
    };
    /** idle, and no animation / transition still running (a fade-in would make axe see half-transparent colours) */
    const settled = async ({ timeout = 10000 } = {}) => {
      await idle({ timeout });
      await waitFor(`(document.getAnimations ? document.getAnimations() : []).every((a) => a.playState !== "running" || a.effect?.getComputedTiming?.().iterations === Infinity)`, { timeout, label: "animations to finish" }).catch(() => {});
    };
    settledRef = () => settled();
    return { s, waitEvent, evaluate, on, waitFor, waitForText, clickWhen, idle, settled, close: () => send("Target.closeTarget", { targetId }) };
  }
  return { page, close: () => { try { ws.close(); } catch {} cleanup(); } };
}

async function viewport(p, w, h, mobile = true, dpr = 1) {
  await p.s("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile });
}
async function go(p, url, ms = 30000) { const ev = p.waitEvent("Page.loadEventFired", ms); await p.s("Page.navigate", { url }); await ev; }

module.exports = { launch, viewport, go, sleep };
