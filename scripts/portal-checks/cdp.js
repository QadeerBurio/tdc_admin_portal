// Minimal Chrome DevTools Protocol driver (no packages). Run with: node --experimental-websocket (Node 20-21;
// Node 22+ has WebSocket built in). Chrome: CHROME_PATH, or the usual install places on Windows, macOS, Linux.
// Each browser gets a throw-away profile in the system temp folder (CDP_PROFILE_DIR to change it).
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

async function launch(port = 9333) {
  if (!CHROME) throw new Error("Chrome not found: set CHROME_PATH to the Chrome (or Chromium) executable");
  const prof = path.join(process.env.CDP_PROFILE_DIR || os.tmpdir(), "tdc-portal-checks-" + port);
  const proc = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", ...(process.env.CDP_ARGS ? process.env.CDP_ARGS.split(" ") : []), `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, "about:blank"], { stdio: "ignore" });
  let ver;
  for (let i = 0; i < 50 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
  if (!ver) { proc.kill(); throw new Error(`Chrome did not open its debugging port ${port}`); }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let id = 0; const pending = new Map(); const listeners = [];
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else listeners.forEach((l) => l(m));
  });
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  async function page() {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
    const s = (m, p) => send(m, p, sessionId);
    const waitEvent = (name, ms = 30000) => new Promise((res) => { const t = setTimeout(res, ms); listeners.push((m) => { if (m.sessionId === sessionId && m.method === name) { clearTimeout(t); res(m.params); } }); });
    await s("Page.enable"); await s("Runtime.enable"); await s("Network.enable");
    const evaluate = async (expr) => { const r = await s("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value; };
    const on = (fn) => listeners.push((m) => { if (m.sessionId === sessionId) fn(m); });
    return { s, waitEvent, evaluate, on, close: () => send("Target.closeTarget", { targetId }) };
  }
  return { page, close: () => { try { ws.close(); } catch {} proc.kill(); } };
}

async function viewport(p, w, h, mobile = true, dpr = 1) {
  await p.s("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: dpr, mobile });
}
async function go(p, url, ms = 30000) { const ev = p.waitEvent("Page.loadEventFired", ms); await p.s("Page.navigate", { url }); await ev; }

module.exports = { launch, viewport, go, sleep };
