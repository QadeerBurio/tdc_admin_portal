// P1-2 invite page (public/i/index.html, a static page) and the /i/:code fallback route.
import fs from "fs";
import path from "path";
import React from "react";
import { render } from "@testing-library/react";
import InviteRedirect from "./InviteRedirect";

// jest can't load react-router v7's package exports in this setup (as in PortalNav.test.js): the two hooks it uses
const mockRoute = { params: {}, search: "" };
jest.mock("react-router-dom", () => ({ useParams: () => mockRoute.params, useLocation: () => ({ search: mockRoute.search }) }), { virtual: true });

const HTML = fs.readFileSync(path.join(__dirname, "..", "..", "public", "i", "index.html"), "utf8");
const body = HTML.slice(HTML.indexOf("<body>") + 6, HTML.indexOf("<script>"));
const script = HTML.slice(HTML.indexOf("<script>") + 8, HTML.indexOf("</script>"));

function runPage(url, ua, reply = { valid: true, firstName: "Aisha" }) {
  document.body.innerHTML = body;
  window.history.pushState({}, "", url);
  Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });
  const calls = [];
  window.fetch = jest.fn((u, opts) => { calls.push({ u, opts }); return Promise.resolve({ json: () => Promise.resolve(reply) }); });
  const copied = [];
  Object.defineProperty(window.navigator, "clipboard", { value: { writeText: (t) => { copied.push(t); return Promise.resolve(); } }, configurable: true });
  // eslint-disable-next-line no-new-func
  new Function(script)();
  return { calls, copied, $: (id) => document.getElementById(id) };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";

test("the page is small, noindex, and loads nothing from other sites", () => {
  expect(Buffer.byteLength(HTML)).toBeLessThan(12 * 1024);
  expect(HTML).toMatch(/<meta name="robots" content="noindex, nofollow">/);
  expect(HTML).not.toMatch(/<link[^>]+href="https?:/);
  expect(HTML).not.toMatch(/<script[^>]+src=/);
});

test("Android: the code from the path, the open reported with the channel, the Play button carries the code", async () => {
  const { calls, $ } = runPage("/i/aisha1?c=wa", ANDROID);
  expect($("code").textContent).toBe("AISHA1");
  expect(calls[0].u).toBe("https://the-deft-crew-production.up.railway.app/api/invites/AISHA1/open");
  expect(JSON.parse(calls[0].opts.body)).toEqual({ channel: "wa" });
  expect($("play").className).toBe("btn primary");
  expect($("ios").className).toMatch(/hidden/);
  expect($("play").href).toContain("id=com.aqkhan110.tdc&referrer=" + encodeURIComponent("ref=AISHA1&utm_source=invite&utm_medium=referral&utm_campaign=AISHA1"));
  await flush(); await flush();
  expect($("title").textContent).toBe("aisha invited you to tdc");
});

test("iPhone: 'copy code & get the app' copies the code; an unknown code keeps the generic title", async () => {
  const { copied, $ } = runPage("/i/ZZZZ99", IPHONE, { valid: false });
  expect($("ios").className).toBe("btn primary");
  expect($("play").className).toMatch(/hidden/);
  $("ios").click();
  await flush();
  expect(copied).toEqual(["ZZZZ99"]);
  expect($("msg").textContent).toBe("code ZZZZ99 copied");
  await flush();
  expect($("title").textContent).toBe("your friend invited you to tdc");
});

test("?code= works too (no rewrite); another api than ours is ignored; no code: nothing reported", () => {
  let r = runPage("/i/index.html?code=bilal2&c=ig&api=https://evil.example", ANDROID);
  expect(r.$("code").textContent).toBe("BILAL2");
  expect(r.calls[0].u.startsWith("https://the-deft-crew-production.up.railway.app/")).toBe(true);
  expect(JSON.parse(r.calls[0].opts.body)).toEqual({ channel: "ig" });
  r = runPage("/i/", ANDROID);
  expect(r.calls).toHaveLength(0);
  expect(r.$("codeBox").className).toMatch(/hidden/);
});

test("/i/:code in the React app sends the browser to the static page with the code and channel", () => {
  const replace = jest.fn();
  const orig = window.location;
  delete window.location;
  window.location = { ...orig, replace };
  mockRoute.params = { code: "aisha1" }; mockRoute.search = "?c=wa";
  render(<InviteRedirect />);
  expect(replace).toHaveBeenCalledWith("/i/index.html?code=AISHA1&c=wa");
  window.location = orig;
});
