// node scripts/portal-checks/run.js [--build <dir>] [--only surplus,a11y-surplus,...] [--jobs N]     (npm run check:portal)
// Builds the portal once against the mock API address (REACT_APP_API_URL=http://127.0.0.1:5197) into a temp
// folder, then runs every headless check in this folder, one after another (they share the mock ports):
//   *-ui-check.js   each page renders what it should, with no page or console errors
//   a11y-*.js       axe-core WCAG 2 A / AA on the same pages and their dialogs
// Every check serves the build and its own mock API: no server, database or network is needed, only Chrome.
// Exits 1 if any check fails. --build reuses an existing build (made with the same REACT_APP_API_URL).
// --jobs N (or CHECK_JOBS): N checks at once (default: what free memory and CPUs allow, at most 4; 1 = one after another). Each running check gets its own
// mock API and web ports (CHECK_API_PORT / CHECK_WEB_PORT; serve.js points the build at that API), so checks never
// share a server, and its own Chrome on a free port. Results print as each check ends, then a summary in order.
// Each check has a hard time limit (CHECK_TIMEOUT_MS, default 4 minutes): past it the check, its Chrome and its mock
// servers are killed and it's reported as TIMEOUT (cdp.js also times out every DevTools command and every wait).
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const HERE = __dirname;
const ROOT = path.resolve(HERE, "..", "..");
const CHECKS = [
  ["surplus", "surplus-ui-check.js"], ["first-hire-free", "fhf-ui-check.js"], ["analytics", "an-ui-check.js"],
  ["resume-studio", "studio-ui-check.js"], ["career", "career-ui-check.js"], ["loyalty", "loyalty-ui-check.js"],
  ["hire-disputes", "disputes-ui-check.js"], ["ratings", "ratings-ui-check.js"], ["loyalty-flow", "loyalty-flow-ui-check.js"], ["admin-ids", "admin-ids-ui-check.js"], ["admin-actions", "admin-actions-ui-check.js"], ["admin-loyalty", "admin-loyalty-ui-check.js"], ["admin-surplus-listings", "admin-surplus-listings-ui-check.js"], ["hiring-overview", "hiring-overview-ui-check.js"], ["career-interviews", "career-interviews-ui-check.js"], ["job-funnel", "job-funnel-ui-check.js"], ["loyalty-rewards", "loyalty-rewards-ui-check.js"], ["surplus-photo", "surplus-photo-ui-check.js"], ["flags-refresh", "flags-refresh-ui-check.js"], ["candidate-profile", "candidate-profile-ui-check.js"], ["surplus-boxes", "surplus-boxes-ui-check.js"], ["admin-features", "admin-features-ui-check.js"], ["admin-menu", "admin-menu-ui-check.js"], ["job-skills", "job-skills-ui-check.js"], ["admin-approvals-metrics", "admin-approvals-metrics-ui-check.js"], ["privacy", "privacy-ui-check.js"], ["hiring-trial", "hiring-trial-ui-check.js"], ["hiring-followups", "hiring-followups-ui-check.js"], ["company-proof", "company-proof-ui-check.js"],
  ["modal-scroll", "modal-scroll-ui-check.js"],
  ["a11y-surplus", "a11y-surplus.js"], ["a11y-first-hire-free", "a11y-fhf.js"], ["a11y-analytics", "a11y-analytics.js"],
  ["a11y-career", "a11y-career.js"], ["a11y-loyalty", "a11y-loyalty.js"], ["a11y-hire-disputes", "a11y-disputes.js"], ["a11y-ratings", "a11y-ratings.js"],
];

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const only = arg("--only") ? arg("--only").split(",").map((s) => s.trim()) : null;
let build = arg("--build") ? path.resolve(arg("--build")) : null;

if (!build) {
  build = path.join(os.tmpdir(), "tdc-portal-checks-build");
  console.log(`building the portal into ${build} (about 1-3 minutes) ...`);
  const r = spawnSync("npx", ["react-scripts", "build"], {
    cwd: ROOT, shell: process.platform === "win32", encoding: "utf8",
    env: { ...process.env, BUILD_PATH: build, REACT_APP_API_URL: "http://127.0.0.1:5197", GENERATE_SOURCEMAP: "false", CI: "" },
  });
  if (r.status !== 0) {
    console.log((r.stdout || "") + (r.stderr || ""));
    console.error("build failed");
    process.exit(1);
  }
}
if (!fs.existsSync(path.join(build, "index.html"))) {
  console.error(`no portal build in ${build}`);
  process.exit(1);
}

// Node 20-21 needs the flag for the WebSocket the Chrome driver uses; Node 22+ has it built in
const nodeArgs = typeof WebSocket === "undefined" ? ["--experimental-websocket"] : [];
// run one check in its own process with a hard time limit (CHECK_TIMEOUT_MS, default 4 minutes): past it, the
// check and everything it started (Chrome, its mock servers) are killed, so a hung check can't hold the run or the
// shared mock ports, and it's reported as a TIMEOUT
const CHECK_TIMEOUT_MS = Number(process.env.CHECK_TIMEOUT_MS) || 4 * 60 * 1000;
function killTree(child) {
  if (!child.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else { try { process.kill(-child.pid, "SIGKILL"); } catch { try { child.kill("SIGKILL"); } catch {} } }
}
// by default as many as the machine has room for: about 1.2 GB free memory and 2 CPUs per check (a check is a
// headless Chrome rendering the portal plus axe scans); at most 4. A starved check is slow, not wrong, but slow
// enough and its waits run out, so this errs low. --jobs / CHECK_JOBS overrides it.
const autoJobs = () => Math.max(1, Math.min(4, Math.floor(os.freemem() / (1.2 * 1024 ** 3)), Math.floor(os.cpus().length / 2)));
const JOBS = Math.max(1, Math.min(8, Number(arg("--jobs") || process.env.CHECK_JOBS) || autoJobs()));
const portsOf = (slot) => ({ CHECK_WEB_PORT: String(5400 + slot * 2), CHECK_API_PORT: String(5401 + slot * 2) });
function runCheck(file, slot) {
  return new Promise((resolve) => {
    // its Chrome profiles go in a folder of its own, removed when the check ends (also when it was killed)
    const profiles = fs.mkdtempSync(path.join(os.tmpdir(), "tdc-check-profiles-"));
    const dropProfiles = () => { try { fs.rmSync(profiles, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 }); } catch {} };
    const env = { ...process.env, CDP_PROFILE_DIR: profiles, ...(JOBS > 1 ? portsOf(slot) : {}) };
    const child = spawn(process.execPath, [...nodeArgs, path.join(HERE, file), build], { cwd: HERE, env, detached: process.platform !== "win32", windowsHide: true });
    let out = "";
    let timedOut = false;
    child.stdout.on("data", (c) => (out += c));
    child.stderr.on("data", (c) => (out += c));
    const t = setTimeout(() => { timedOut = true; killTree(child); }, CHECK_TIMEOUT_MS);
    child.on("close", (code) => { clearTimeout(t); dropProfiles(); resolve({ code: timedOut ? null : code, out, timedOut }); });
    child.on("error", (e) => { clearTimeout(t); dropProfiles(); resolve({ code: null, out: out + String(e), timedOut: false }); });
  });
}

(async () => {
  const todo = CHECKS.filter(([name]) => !only || only.includes(name));
  const results = new Map();
  const startedAll = Date.now();
  console.log(`running ${todo.length} checks, ${JOBS} at a time`);
  let next = 0;
  const worker = async (slot) => {
    while (next < todo.length) {
      const [name, file] = todo[next++];
      const started = Date.now();
      const r = await runCheck(file, slot);
      const ok = r.code === 0;
      const secs = Math.round((Date.now() - started) / 1000);
      results.set(name, { name, ok, secs });
      // one block per check (printed whole, so parallel checks don't interleave)
      const lines = r.out.split("\n").filter(Boolean);
      const show = !ok || process.argv.includes("--verbose") ? lines : lines.filter((l) => /MISSING|FAIL|violation|A11Y_TOTAL|errors|FATAL/i.test(l) && !/no WCAG 2/.test(l));
      const head = `\n=== ${ok ? "PASS" : r.timedOut ? "TIMEOUT" : "FAIL"} ${name} (${file}, ${secs}s)`;
      const extra = r.timedOut ? [`  killed after ${Math.round(CHECK_TIMEOUT_MS / 1000)} s (CHECK_TIMEOUT_MS)`] : [];
      console.log([head, ...extra, ...show.map((l) => "  " + l)].join("\n"));
    }
  };
  await Promise.all(Array.from({ length: Math.min(JOBS, todo.length) }, (_, i) => worker(i)));
  const ordered = todo.map(([name]) => results.get(name));
  const failed = ordered.filter((r) => !r.ok);
  console.log(`\n${ordered.length - failed.length}/${ordered.length} portal checks passed in ${Math.round((Date.now() - startedAll) / 1000)}s${failed.length ? `; failed: ${failed.map((r) => r.name).join(", ")}` : ""}`);
  process.exit(failed.length ? 1 : 0);
})();
