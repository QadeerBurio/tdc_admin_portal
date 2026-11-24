// P3d public resume page: gettdc.pk/r/<link> is forwarded to the server (vercel.json), with a React fallback.
// jest can't load react-router v7's package exports in this setup (as in InvitePage.test.js): the hooks are mocked
jest.mock("react-router-dom", () => ({ useParams: () => ({}), useLocation: () => ({ search: "" }) }), { virtual: true });
import { resumePageUrl } from "./ResumePageRedirect";
import { API_ORIGIN } from "../config/api";

const vercel = require("../../vercel.json");

test("vercel forwards /r/* to the server's /r/*, before the app's fallback, and marks it noindex", () => {
  const i = vercel.rewrites.findIndex((r) => r.source === "/r/:path*");
  const spa = vercel.rewrites.findIndex((r) => r.destination === "/index.html");
  expect(i).toBeGreaterThanOrEqual(0);
  expect(vercel.rewrites[i].destination).toBe("https://the-deft-crew-production.up.railway.app/r/:path*");
  expect(i).toBeLessThan(spa);
  const h = vercel.headers.find((x) => x.source === "/r/(.*)");
  expect(h.headers).toEqual([{ key: "X-Robots-Tag", value: "noindex, nofollow" }]);
});

test("fallback: a well-formed link goes to the server's page", () => {
  expect(resumePageUrl("AbCdEfGhIjKlMnOpQrStU_")).toBe(`${API_ORIGIN}/r/AbCdEfGhIjKlMnOpQrStU_`);
});

test("fallback: the student's own key is kept (so their visit isn't counted); anything odd in it is dropped", () => {
  expect(resumePageUrl("AbCdEfGhIjKlMnOpQrStU_", "?k=abc-DEF_123")).toBe(`${API_ORIGIN}/r/AbCdEfGhIjKlMnOpQrStU_?k=abc-DEF_123`);
  expect(resumePageUrl("AbCdEfGhIjKlMnOpQrStU_", "?k=<script>")).toBe(`${API_ORIGIN}/r/AbCdEfGhIjKlMnOpQrStU_`);
});

test("fallback: a malformed link goes home, never to the server", () => {
  for (const bad of ["", "short", "../../etc/passwd_______", "AbCdEfGhIjKlMnOpQrStU_X", "AbCdEfGhIjKlMnOpQrSt%2F"]) expect(resumePageUrl(bad)).toBe("/");
});
