// scripts/portal-checks/serve.js: sends one file of the portal build to a check's browser.
// The build has the mock API's address baked in (REACT_APP_API_URL=http://127.0.0.1:5197). When run.js runs checks
// side by side, each gets its own mock API port (CHECK_API_PORT); the build's text files are then sent with that
// address in place of 5197, so the checks never share a server. With the default port the file is streamed as is.
const fs = require("fs");

const BAKED = "http://127.0.0.1:5197";
const cache = new Map(); // file -> rewritten text (the build doesn't change during a check)

function send(file, res, apiPort) {
  if (!apiPort || Number(apiPort) === 5197 || !/\.(js|html|css|json|map)$/i.test(file)) return fs.createReadStream(file).pipe(res);
  let body = cache.get(file);
  if (body === undefined) {
    body = fs.readFileSync(file, "utf8").split(BAKED).join(`http://127.0.0.1:${apiPort}`);
    cache.set(file, body);
  }
  res.end(body);
}

module.exports = { send };
