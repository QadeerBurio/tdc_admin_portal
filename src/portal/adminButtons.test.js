// P5a: buttons inside admin pages follow the admin's permissions, the same ones the server checks on the route each
// button calls (server: the permission tag on every admin route, tests/admin-route-coverage). AdminDashboard shares its
// useAdminAccess() through AdminAccessContext; useAdminCan() reads it. No provider (a page on its own) or access not
// loaded yet: every button shows, as before. Legacy and super admins have every permission, so nothing changes for them.
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { AdminAccessContext, useAdminCan } from "./adminAccess";
import { crewApi } from "../services/api";
import CrewPartners from "../screens/CrewPartners";

jest.mock("../services/api", () => ({ __esModule: true, default: { get: jest.fn() }, crewApi: { partners: jest.fn(), addPartner: jest.fn(), removePartner: jest.fn() } }));
jest.mock("./kit", () => ({ Modal: ({ title, children, footer }) => (<div role="dialog" aria-label={title}>{children}{footer}</div>) }));

const member = (permissions) => ({ loaded: true, level: "member", permissions, can: (p) => !p || permissions.includes(p) });
const wrap = (access) => ({ children }) => <AdminAccessContext.Provider value={access}>{children}</AdminAccessContext.Provider>;

test("useAdminCan: no provider → everything allowed (as before)", () => {
  const { result } = renderHook(() => useAdminCan());
  expect(result.current("students.delete")).toBe(true);
});

test("useAdminCan: access not loaded yet → allowed (the server still checks the call)", () => {
  const { result } = renderHook(() => useAdminCan(), { wrapper: wrap({ loaded: false, permissions: [], can: () => false }) });
  expect(result.current("students.delete")).toBe(true);
});

test("useAdminCan: a member admin → exactly their permissions", () => {
  const { result } = renderHook(() => useAdminCan(), { wrapper: wrap(member(["crew.view"])) });
  expect(result.current("crew.view")).toBe(true);
  expect(result.current("crew.manage")).toBe(false);
});

const PARTNER = [{ _id: "p1", user: { _id: "u1", name: "Sana" }, partner: { type: "ambassador" }, points: { lifetime: 10 }, stats: { sortedPercent: 50, referralsCredited: 4, verified: 3, verifiedThisMonth: 1 } }];

test("crew partners: crew.view only → the list, no add / remove", async () => {
  crewApi.partners.mockResolvedValue(PARTNER);
  render(<AdminAccessContext.Provider value={member(["crew.view"])}><CrewPartners /></AdminAccessContext.Provider>);
  expect(await screen.findByText("Sana")).toBeInTheDocument();
  expect(screen.queryByText("+ add partner")).toBeNull();
  expect(screen.queryByText("remove")).toBeNull();
});

test("crew partners: crew.manage → add and remove show", async () => {
  crewApi.partners.mockResolvedValue(PARTNER);
  render(<AdminAccessContext.Provider value={member(["crew.view", "crew.manage"])}><CrewPartners /></AdminAccessContext.Provider>);
  expect(await screen.findByText("Sana")).toBeInTheDocument();
  expect(screen.getByText("+ add partner")).toBeInTheDocument();
  expect(screen.getByText("remove")).toBeInTheDocument();
});

// every guarded button names the permission of the server route it calls
const read = (rel) => fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
const GUARDS = {
  "screens/AdminUserList.js": ['can("students.verify")', 'can("students.delete")', 'can("features.manage")', 'can("data.export")'],
  "portal/AdminUserProfile.js": ['can("students.delete")', 'can("features.manage")'],
  "screens/BrandApprovalScreen.js": ["can('brands.approve')", "can('students.delete')"],
  "screens/AdminSafety.js": ['can("safety.act")', 'can("students.suspend")', 'can("identity.reveal")', 'useAdminCan()("safety.act")'],
  "screens/AdminFirstHireFree.js": ['useAdminCan()("employers.verify")'],
  "screens/events/RegistrationsTab.js": ['useAdminCan()("data.export")'],
  "screens/CrewPartners.js": ["useAdminCan()('crew.manage')"],
  "screens/CrewInbox.js": ["useAdminCan()('crew.manage')"],
  "screens/CrewCampaigns.js": ["useAdminCan()('crew.manage')"],
};
test.each(Object.entries(GUARDS))("%s guards its buttons with the server's permissions", (file, guards) => {
  const src = read(file);
  for (const g of guards) expect(src).toContain(g);
});

test("AdminDashboard shares its access with every page and the profile", () => {
  const src = read("screens/AdminDashboard.js");
  expect(src).toMatch(/<AdminAccessContext\.Provider value=\{access\}>\s*\{profileId/);
});
