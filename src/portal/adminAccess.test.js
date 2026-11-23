// Phase A (A-7): what an admin may open in the portal (src/portal/adminAccess.js).
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import { useAdminAccess, PAGE_PERMISSIONS, deviceId } from "./adminAccess";
import { ADMIN_MENU } from "./PortalNav";
import P from "./adminPermissions";
import NoAccess from "./NoAccess";

jest.mock("../services/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("react-router-dom", () => ({}), { virtual: true });

function Probe() {
  const a = useAdminAccess(true);
  return <div data-testid="out">{JSON.stringify({ loaded: a.loaded, level: a.level, students: a.canOpen("students"), brands: a.canOpen("brands"), team: a.canOpen("team_access"), dash: a.canOpen("dashboard") })}</div>;
}
const out = async () => { await waitFor(() => expect(JSON.parse(screen.getByTestId("out").textContent).loaded).toBe(true)); return JSON.parse(screen.getByTestId("out").textContent); };
beforeEach(() => jest.resetAllMocks());

test("every menu page has a permission entry, each a real permission (or none: any admin)", () => {
  const ids = ADMIN_MENU.flatMap((g) => g.items.map((i) => i[0]));
  for (const id of ids) expect([id, id in PAGE_PERMISSIONS]).toEqual([id, true]);
  for (const [id, p] of Object.entries(PAGE_PERMISSIONS)) expect([id, p === null || P.KEYS.includes(p)]).toEqual([id, true]);
  expect(PAGE_PERMISSIONS.team_access).toBe("team.manage");
  expect(PAGE_PERMISSIONS.safety).toBe("safety.view");
});

test("the portal's permission list is the server's (the server test compares the files byte for byte)", () => {
  expect(fs.existsSync(path.join(__dirname, "adminPermissions.js"))).toBe(true);
  expect(P.GROUPS.map((g) => g.id)).toContain("safety");
});

test("a member: only the pages of their permissions; the dashboard for everyone", async () => {
  api.get.mockResolvedValue({ data: { data: { level: "member", permissions: ["brands.view"] } } });
  render(<Probe />);
  expect(await out()).toEqual({ loaded: true, level: "member", students: false, brands: true, team: false, dash: true });
  expect(api.get).toHaveBeenCalledWith("/admin/me/access");
});

test("a super admin: every page, the team page too", async () => {
  api.get.mockResolvedValue({ data: { data: { level: "super", permissions: [] } } });
  render(<Probe />);
  expect(await out()).toMatchObject({ level: "super", students: true, team: true });
});

test("an older server (404): every page an admin had before, not the team page", async () => {
  api.get.mockRejectedValue({ response: { status: 404 } });
  render(<Probe />);
  expect(await out()).toMatchObject({ level: "legacy", students: true, brands: true, team: false });
});

test("a reply that isn't from the access route (200 with something else): every page, as before", async () => {
  api.get.mockResolvedValue({ data: {} });
  render(<Probe />);
  expect(await out()).toMatchObject({ level: "legacy", students: true, team: false });
});

test("paused access: suspended, nothing opens", async () => {
  api.get.mockRejectedValue({ response: { status: 403, data: { code: "ADMIN_ACCESS_SUSPENDED" } } });
  render(<Probe />);
  expect(await out()).toMatchObject({ level: "suspended", students: false, brands: false });
});

test("the no-access page says what to do; paused says so", () => {
  const { unmount } = render(<NoAccess />);
  expect(screen.getByText("you don't have access to this")).toBeInTheDocument();
  expect(screen.getByText("ask a super admin.")).toBeInTheDocument();
  unmount();
  render(<NoAccess paused />);
  expect(screen.getByText("your admin access is paused")).toBeInTheDocument();
});

test("a device id: kept in this browser, 36 hex characters", () => {
  localStorage.clear();
  const a = deviceId();
  expect(a).toMatch(/^[0-9a-f]{36}$/);
  expect(deviceId()).toBe(a);
});
