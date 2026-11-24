// P4c shared confession page: gettdc.pk/c/<id> is forwarded to the server (vercel.json + middleware.js), with a React
// fallback that sends the browser to the server's page.
// jest can't load react-router v7's package exports in this setup (as in InvitePage.test.js): the hooks are mocked
jest.mock("react-router-dom", () => ({ useParams: () => ({}) }), { virtual: true });
import { confessionPageUrl } from "./ConfessionPageRedirect";
import { API_ORIGIN } from "../config/api";

test("fallback: a well-formed confession id goes to the server's page", () => {
  expect(confessionPageUrl("0123456789abcdef01234567")).toBe(`${API_ORIGIN}/c/0123456789abcdef01234567`);
});

test("fallback: anything else goes home, never to the server", () => {
  for (const bad of ["", "short", "0123456789abcdef0123456z", "0123456789abcdef012345678", "../../etc/passwd"]) expect(confessionPageUrl(bad)).toBe("/");
});
