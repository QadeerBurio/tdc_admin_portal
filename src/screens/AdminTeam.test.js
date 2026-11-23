// Phase A (A-6): the team & access page.
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import api from "../services/api";
import AdminTeam from "./AdminTeam";

jest.mock("../services/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));

const MEMBERS = [
  { id: "a1", name: "Sara Super", email: "sara@tdc.test", level: "super", permissions: [], summary: "can do everything.", status: "active", lastActiveAt: null },
  { id: "m1", name: "Mia Member", email: "mia@tdc.test", level: "member", template: "brand_partnerships", permissions: ["brands.view"], summary: "can see brands. can't see full phone numbers, e-mails and documents or manage the admin team.", status: "active", lastActiveAt: null },
];
const TEMPLATES = [
  { key: "super", label: "super admin", level: "super", permissions: [], builtIn: true },
  { key: "brand_partnerships", label: "brand partnerships", permissions: ["brands.view", "brands.approve", "offers.manage"], builtIn: true },
  { key: "viewer", label: "viewer", permissions: ["dashboard.view", "students.view"], builtIn: true },
];
beforeEach(() => {
  jest.resetAllMocks();
  api.get.mockImplementation(async (url) => ({ data: { data: url.endsWith("/templates") ? TEMPLATES : url.endsWith("/changes") ? [{ id: "c1", target: "m1", change: { level: "super" }, requestedBy: "a1", reason: "lead" }] : url.endsWith("/shadow") ? { enforcing: false, items: [] } : MEMBERS } }));
  api.post.mockResolvedValue({ data: { data: {} } });
  api.put.mockResolvedValue({ data: { data: {} } });
});

test("members with their access in plain words, and the pending change", async () => {
  render(<AdminTeam />);
  expect(await screen.findByText("Mia Member")).toBeInTheDocument();
  expect(screen.getByText(/can see brands/)).toBeInTheDocument();
  expect(screen.getByText("super admin")).toBeInTheDocument();
  expect(screen.getByText("waiting for a second super admin")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "confirm" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/team/changes/c1/confirm"));
});

test("edit access: checkboxes grouped like the menu (no team.manage); save sends the list", async () => {
  render(<AdminTeam />);
  await screen.findByText("Mia Member");
  fireEvent.click(screen.getAllByRole("button", { name: "edit access" })[0]);
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).queryByLabelText(/manage the admin team/)).toBeNull();
  fireEvent.click(within(dialog).getByLabelText("approve brands"));
  fireEvent.click(within(dialog).getByRole("button", { name: "save" }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/team/m1/access", { permissions: ["brands.view", "brands.approve"] }));
});

test("invite: name, e-mail, a member template (not super admin); sends the template's permissions", async () => {
  render(<AdminTeam />);
  await screen.findByText("Mia Member");
  fireEvent.click(screen.getByRole("button", { name: "invite member" }));
  const dialog = screen.getByRole("dialog");
  const options = within(dialog).getByLabelText("role template").querySelectorAll("option");
  expect(Array.from(options).map((o) => o.textContent)).toEqual(["brand partnerships", "viewer"]);
  fireEvent.change(within(dialog).getByLabelText("name"), { target: { value: "Nia" } });
  fireEvent.change(within(dialog).getByLabelText("e-mail"), { target: { value: "nia@tdc.test" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "send invitation" }));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/team/invite", expect.objectContaining({ name: "Nia", email: "nia@tdc.test", template: "brand_partnerships", permissions: ["brands.view", "brands.approve", "offers.manage"] })));
});

test("pause asks for a reason; a server refusal shows its message", async () => {
  window.prompt = jest.fn(() => "left the team");
  api.post.mockRejectedValueOnce({ response: { data: { message: "this is the last super admin: make someone else a super admin first." } } });
  render(<AdminTeam />);
  await screen.findByText("Mia Member");
  fireEvent.click(screen.getAllByRole("button", { name: "pause" })[0]);
  expect(await screen.findByRole("alert")).toHaveTextContent("last super admin");
  expect(api.post).toHaveBeenCalledWith("/admin/team/a1/suspend", { reason: "left the team" });
});
