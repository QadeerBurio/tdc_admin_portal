import React from "react";
import { render, screen } from "@testing-library/react";
import { isOwnChunkError, PortalShell } from "./PortalFallback";

const here = new URL("https://portal.thedeftcrew.com/admin");
const chunkErr = (message, extra = {}) => Object.assign(new Error(message), { name: "ChunkLoadError", ...extra });
const cssErr = (url) => Object.assign(new Error(`Loading CSS chunk 1006 failed.\n(${url})`), { code: "CSS_CHUNK_LOAD_FAILED", request: url });

describe("isOwnChunkError: only our own JS / CSS chunks", () => {
  test("our JS chunk (webpack message and request) → true", () => {
    const url = "https://portal.thedeftcrew.com/static/js/8733.b3d4e1dc.chunk.js";
    expect(isOwnChunkError(chunkErr(`Loading chunk 8733 failed.\n(error: ${url})`, { request: url }), here)).toBe(true);
    expect(isOwnChunkError(chunkErr(`Loading chunk 8733 failed.\n(error: ${url})`), here)).toBe(true); // URL only in the message
  });
  test("our CSS chunk → true", () => {
    expect(isOwnChunkError(cssErr("https://portal.thedeftcrew.com/static/css/1006.1f44549c.chunk.css"), here)).toBe(true);
  });
  test("relative chunk URL on our origin → true", () => {
    expect(isOwnChunkError(chunkErr("Loading chunk 1 failed.", { request: "/static/js/1.abc.chunk.js" }), here)).toBe(true);
  });
  test("Google Fonts (CSS or font file) → false", () => {
    expect(isOwnChunkError(cssErr("https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&display=swap"), here)).toBe(false);
    expect(isOwnChunkError(chunkErr("Loading chunk 9 failed.\n(error: https://fonts.gstatic.com/s/outfit/v11/x.woff2)"), here)).toBe(false);
  });
  test("any other third-party URL → false (a CDN, the API, an analytics script)", () => {
    expect(isOwnChunkError(chunkErr("Loading chunk 9 failed.", { request: "https://cdn.example.com/static/js/9.chunk.js" }), here)).toBe(false);
    expect(isOwnChunkError(chunkErr("Loading chunk 9 failed.", { request: "https://the-deft-crew-production.up.railway.app/static/js/9.js" }), here)).toBe(false);
  });
  test("our origin but not a chunk file (/api, /uploads) → false", () => {
    expect(isOwnChunkError(chunkErr("Loading chunk 9 failed.", { request: "https://portal.thedeftcrew.com/api/app/flags" }), here)).toBe(false);
  });
  test("not a chunk error at all → false; nothing → false", () => {
    expect(isOwnChunkError(new TypeError("x is undefined"), here)).toBe(false);
    expect(isOwnChunkError(null, here)).toBe(false);
  });
  test("a chunk error without any URL keeps the earlier behaviour (reload screen)", () => {
    expect(isOwnChunkError(chunkErr("Loading chunk 9 failed."), here)).toBe(true);
  });
});

describe("PortalShell: the reload screen", () => {
  const Thrower = ({ error }) => { throw error; };
  let spy;
  beforeEach(() => { spy = jest.spyOn(console, "error").mockImplementation(() => {}); });
  afterEach(() => spy.mockRestore());
  const origin = window.location.origin;

  test("our own chunk failed → 'tdc was updated' with a reload button", () => {
    render(<PortalShell><Thrower error={chunkErr("Loading chunk 8733 failed.", { request: `${origin}/static/js/8733.b3d4e1dc.chunk.js` })} /></PortalShell>);
    expect(screen.getByText(/tdc was updated/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
  });
  test("a Google Fonts failure → no reload screen (the error is passed on)", () => {
    expect(() => render(<PortalShell><Thrower error={cssErr("https://fonts.googleapis.com/css2?family=Outfit&display=swap")} /></PortalShell>)).toThrow(/Loading CSS chunk/);
    expect(screen.queryByText(/tdc was updated/i)).toBeNull();
  });
  test("any other error → passed on, as before", () => {
    expect(() => render(<PortalShell><Thrower error={new TypeError("boom")} /></PortalShell>)).toThrow("boom");
  });
});
