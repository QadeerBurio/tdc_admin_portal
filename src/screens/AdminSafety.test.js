import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminSafety from "./AdminSafety";
import safetyApi from "../services/safetyApi";

jest.mock("../services/safetyApi", () => {
  const api = { queue: jest.fn(), resolve: jest.fn(), resolveHeld: jest.fn(), author: jest.fn(), settings: jest.fn(), saveSettings: jest.fn() };
  return { __esModule: true, default: api, safetyApi: api };
});

const REPORTED = [
  { id: "r1", contentType: "Confession", reason: "Self Harm Risk", description: "", evidence: "", status: "pending", createdAt: "2026-11-21T10:00:00Z", content: { kind: "confession", confessionId: "c1", text: "i feel like giving up", status: "live", reportCount: 1, author: "author-aaaaaaaaaa" } },
  { id: "r2", contentType: "Post", reason: "Harassment", description: "rude", evidence: "", status: "pending", createdAt: "2026-11-21T09:00:00Z", content: { kind: "post", postId: "p1", text: "a feed post", author: "author-bbbbbbbbbb" } },
  { id: "r3", contentType: "Confession", reason: "Identifies A Person", description: "", evidence: "ali from cs", status: "under_review", createdAt: "2026-11-21T08:00:00Z", recheck: { confirmed: false, reasons: ["check_unavailable"] }, content: { kind: "confession_comment", confessionId: "c2", commentId: "m1", text: "ali from cs is rude", status: "hidden", reportCount: 2, author: "author-cccccccccc" } },
];
const HELD = [{ kind: "confession", confessionId: "c9", text: "held by the check", status: "pending", statusReason: "check_unavailable", reportCount: 0, author: "author-dddddddddd", createdAt: "2026-11-21T07:00:00Z" }];

beforeEach(() => {
  jest.resetAllMocks();
  safetyApi.queue.mockImplementation(async (tab) => ({ tab, items: tab === "held" ? HELD : tab === "reported" ? REPORTED : [] }));
  safetyApi.resolve.mockResolvedValue({ id: "r1" });
  safetyApi.resolveHeld.mockResolvedValue({ id: "c9" });
  safetyApi.author.mockResolvedValue({ author: "author-cccccccccc", account: { id: "u1", name: "Real Name", role: "student", university: "Alpha", accountStatus: "active" } });
  safetyApi.settings.mockResolvedValue({ reportThreshold: 3, bannedWords: ["chamcha"], helplines: [{ name: "national mental health helpline", number: "1166", note: "" }], suspendOnSingleEvidenceReport: false });
  safetyApi.saveSettings.mockImplementation(async (x) => ({ ...x, bannedWords: ["a", "b"], helplines: x.helplines }));
});

test("reported: every content type, self-harm first, authors as anonymous references (no names)", async () => {
  render(<AdminSafety />);
  expect(await screen.findByText("i feel like giving up")).toBeInTheDocument();
  expect(safetyApi.queue).toHaveBeenCalledWith("reported");
  expect(screen.getByText("a feed post")).toBeInTheDocument();
  expect(screen.getByText("Self Harm Risk")).toBeInTheDocument();
  expect(screen.getByText("author-aaaaaaaaaa")).toBeInTheDocument();
  expect(screen.queryByText("Real Name")).toBeNull();
  const rows = screen.getAllByRole("row");
  expect(rows[1].textContent).toContain("i feel like giving up"); // the server's order: self-harm first
});

test("a decision needs a note, then is saved with the action", async () => {
  render(<AdminSafety />);
  fireEvent.click(await screen.findByText("a feed post"));
  fireEvent.change(screen.getByLabelText("decision"), { target: { value: "suspend24h" } });
  fireEvent.click(screen.getByRole("button", { name: "save decision" }));
  expect(safetyApi.resolve).not.toHaveBeenCalled(); // no note yet
  fireEvent.change(screen.getByLabelText("note (goes into the admin actions log)"), { target: { value: "repeated harassment" } });
  fireEvent.click(screen.getByRole("button", { name: "save decision" }));
  await waitFor(() => expect(safetyApi.resolve).toHaveBeenCalledWith("r2", "suspend24h", "repeated harassment"));
});

test("who wrote it: needs a reason, then shows the account", async () => {
  render(<AdminSafety />);
  fireEvent.click(await screen.findByText("ali from cs is rude"));
  expect(screen.getByText("“ali from cs”")).toBeInTheDocument(); // the evidence
  const btn = screen.getByRole("button", { name: "show the account" });
  expect(btn).toBeDisabled();
  fireEvent.change(screen.getByLabelText("reason"), { target: { value: "repeat offender check" } });
  fireEvent.click(screen.getByRole("button", { name: "show the account" }));
  expect(await screen.findByText("Real Name")).toBeInTheDocument();
  expect(safetyApi.author).toHaveBeenCalledWith("r3", "repeat offender check");
});

test("held: approve / remove only, through the held route", async () => {
  render(<AdminSafety />);
  fireEvent.click(await screen.findByRole("tab", { name: "held" }));
  fireEvent.click(await screen.findByText("held by the check"));
  const options = [...screen.getByLabelText("decision").querySelectorAll("option")].map((o) => o.value);
  expect(options).toEqual(["approve", "remove"]);
  fireEvent.change(screen.getByLabelText("note (goes into the admin actions log)"), { target: { value: "fine" } });
  fireEvent.click(screen.getByRole("button", { name: "save decision" }));
  await waitFor(() => expect(safetyApi.resolveHeld).toHaveBeenCalledWith("c9", "approve", "fine", null));
});

test("settings: shows the helplines and saves", async () => {
  render(<AdminSafety />);
  fireEvent.click(await screen.findByRole("tab", { name: "settings" }));
  expect(await screen.findByDisplayValue("1166")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("unique reports that hide a post"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(safetyApi.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ reportThreshold: 5, bannedWords: "chamcha", suspendOnSingleEvidenceReport: false })));
});
