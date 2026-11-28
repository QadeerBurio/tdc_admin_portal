// Owner (25 Nov 2026): hide a single resume template from the app's gallery without an app update
// (server: GET / PUT /api/admin/resume-settings, features.manage). An older server (404): the card stays away.
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HiddenTemplates from "./HiddenTemplates";
import api from "../services/api";
import { AdminAccessContext } from "./adminAccess";

jest.mock("../services/api", () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() } }));
jest.mock("./kit", () => ({
  Card: ({ title, action, children }) => <section aria-label={title}>{action}{children}</section>,
  Button: ({ children, loading, ...rest }) => <button type="button" {...rest}>{children}</button>,
  Pill: ({ children }) => <span>{children}</span>,
  toast: jest.fn(),
}));

const TEMPLATES = ["modern_ats", "stanford", "jakes", "rezi", "faang", "campus", "first_step", "fresh_start", "society_leader", "project_first", "internship_ready", "scholar", "harvard", "clean_line", "two_tone"];

beforeEach(() => {
  api.get.mockResolvedValue({ data: { ok: true, data: { hiddenTemplates: ["scholar"], templates: TEMPLATES } } });
  api.put.mockImplementation(async (_url, body) => ({ data: { ok: true, data: { hiddenTemplates: body.hiddenTemplates } } }));
});

test("lists the 15 templates, the hidden one unticked; hide Two-tone and show Scholar again → one save with the new list", async () => {
  render(<HiddenTemplates />);
  const scholar = await screen.findByLabelText("Scholar shown in the gallery");
  expect(screen.getAllByRole("checkbox")).toHaveLength(15);
  expect(scholar.checked).toBe(false);
  expect(screen.getByLabelText("Executive shown in the gallery").checked).toBe(true);
  expect(screen.getByRole("button", { name: "save" })).toBeDisabled(); // nothing changed yet
  fireEvent.click(screen.getByLabelText("Two-tone shown in the gallery"));
  fireEvent.click(scholar);
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/resume-settings", { hiddenTemplates: ["two_tone"] }));
  await waitFor(() => expect(screen.getByLabelText("Scholar shown in the gallery").checked).toBe(true));
});

test("an older server or no permission to read (404 / 403): nothing is shown", async () => {
  api.get.mockRejectedValue({ response: { status: 404 } });
  const { container } = render(<HiddenTemplates />);
  await waitFor(() => expect(api.get).toHaveBeenCalled());
  expect(container.textContent).toBe("");
});

test("an admin without features.manage sees the list but can't change it (no save button)", async () => {
  render(<AdminAccessContext.Provider value={{ loaded: true, can: (p) => p !== "features.manage" }}><HiddenTemplates /></AdminAccessContext.Provider>);
  expect(await screen.findByLabelText("Campus shown in the gallery")).toBeDisabled();
  expect(screen.queryByRole("button", { name: "save" })).toBeNull();
});

// resume full fix: 50 templates, their names and collections from the server's catalog (the shared registry)
test("the catalog: all 50 by collection, with their names and the ATS badge; hiding one saves its id", async () => {
  const COLS = { ats: "ATS Pro", fresher: "Fresher & Student", tech: "Tech / IT", twocol: "Two-column", executive: "Executive" };
  const catalog = [
    ...TEMPLATES.map((id, i) => ({ id, name: i < 5 ? ["Modern", "Classic", "Compact", "Minimal", "Executive"][i] : id.replace(/_/g, " "), collection: i < 5 || i > 11 ? "ats" : "fresher", ats: "safe" })),
    ...Array.from({ length: 35 }, (_, i) => ({ id: `new_${i}`, name: `New ${i}`, collection: ["tech", "twocol", "executive"][i % 3], ats: i % 3 === 1 ? "design" : "safe" })),
  ].map((t) => ({ ...t, collectionName: COLS[t.collection] }));
  api.get.mockResolvedValue({ data: { ok: true, data: { hiddenTemplates: [], templates: catalog.map((t) => t.id), catalog } } });
  render(<HiddenTemplates />);
  await screen.findByLabelText("New 34 shown in the gallery");
  expect(screen.getAllByRole("checkbox")).toHaveLength(50);
  expect(screen.getByText(/50 of 50 shown/)).toBeTruthy();
  for (const name of ["ATS Pro", "Fresher & Student", "Tech / IT", "Two-column", "Executive"]) expect(screen.getByTestId(`template-group-${name}`)).toBeTruthy();
  expect(screen.getByTestId("template-group-Two-column").textContent).not.toMatch(/ATS-safe/); // the design ones carry no ATS badge
  fireEvent.click(screen.getByLabelText("New 1 shown in the gallery"));
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(api.put).toHaveBeenCalledWith("/admin/resume-settings", { hiddenTemplates: ["new_1"] }));
});
