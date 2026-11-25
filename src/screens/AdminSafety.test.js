import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminSafety from "./AdminSafety";
import safetyApi from "../services/safetyApi";

jest.mock("../services/safetyApi", () => {
  const api = { observed: jest.fn(), queue: jest.fn(), resolve: jest.fn(), resolveHeld: jest.fn(), author: jest.fn(), settings: jest.fn(), saveSettings: jest.fn() };
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
  safetyApi.observed.mockResolvedValue({ days: 7, checked: 40, wouldHaveActed: 2, byOutcome: { block: 1, remove: 1 }, byReason: { politics: 1, personal_info: 1 }, items: [
    { id: "o1", kind: "confession", verdict: "edit", wouldHave: "block", reasons: [{ code: "politics" }], text: "who will win the election", author: "author-eeeeeeeeee", createdAt: "2026-11-21T10:00:00Z", aiOk: true },
    { id: "o2", kind: "report", verdict: "confirmed", wouldHave: "remove", reasons: [{ code: "personal_info" }], text: "call 0300", author: "author-ffffffffff", createdAt: "2026-11-21T09:00:00Z", aiOk: true },
  ] });
  safetyApi.settings.mockResolvedValue({ mode: "observe", reportThreshold: 3, bannedWords: ["chamcha"], helplines: [{ name: "national mental health helpline", number: "1166", note: "" }], suspendOnSingleEvidenceReport: false });
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

test("would have blocked: the summary, the items, a period filter", async () => {
  render(<AdminSafety />);
  fireEvent.click(await screen.findByRole("tab", { name: "would have blocked" }));
  expect(await screen.findByText("who will win the election")).toBeInTheDocument();
  expect(screen.getByText("40")).toBeInTheDocument(); // checked
  expect(screen.getAllByText("would have blocked").length).toBeGreaterThan(1); // tab + pill / summary
  expect(screen.getByText(/politics 1/)).toBeInTheDocument();
  expect(screen.getByText("author-eeeeeeeeee")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("period"), { target: { value: "30" } });
  await waitFor(() => expect(safetyApi.observed).toHaveBeenLastCalledWith(30));
});

test("settings: the mode (off / observe / enforce) is shown and saved", async () => {
  render(<AdminSafety />);
  fireEvent.click(await screen.findByRole("tab", { name: "settings" }));
  const mode = await screen.findByLabelText("mode");
  expect(mode.value).toBe("observe");
  expect([...mode.querySelectorAll("option")].map((o) => o.value)).toEqual(["off", "observe", "enforce"]);
  fireEvent.change(mode, { target: { value: "enforce" } });
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(safetyApi.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ mode: "enforce" })));
});

test("settings (P4a): post tags (rename, hide, add) and prompt chips; an older server without them gets nothing new", async () => {
  safetyApi.settings.mockResolvedValueOnce({ mode: "enforce", reportThreshold: 3, bannedWords: [], helplines: [{ name: "x", number: "1166", note: "" }], suspendOnSingleEvidenceReport: false,
    tags: [{ id: "crush", label: "crush", hidden: false }, { id: "rant", label: "rant", hidden: false }], prompts: ["a hostel story nobody believes", "a small win this week"] });
  const { container } = render(<AdminSafety />);
  fireEvent.click(await screen.findByRole("tab", { name: "settings" }));
  expect(await screen.findByDisplayValue("crush")).toBeInTheDocument();
  expect(screen.getByText("#rant")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("tag 1 name"), { target: { value: "crushes" } });
  fireEvent.change(screen.getByLabelText("tag 2 shown or hidden"), { target: { value: "hidden" } });
  fireEvent.click(screen.getByRole("button", { name: "add a tag" }));
  fireEvent.change(screen.getByLabelText("tag 3 name"), { target: { value: "exam stress" } });
  fireEvent.change(screen.getByLabelText("composer prompt chips, one per line (3 are shown each week, in turn)"), { target: { value: "one\n\n two \nthree" } });
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(safetyApi.saveSettings).toHaveBeenCalledWith(expect.objectContaining({
    tags: [{ id: "crush", label: "crushes", hidden: false }, { id: "rant", label: "rant", hidden: true }, { label: "exam stress", hidden: false }],
    prompts: ["one", "two", "three"],
  })));
  const axe = require("axe-core");
  const r = await axe.run(container, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, rules: { "color-contrast": { enabled: false } } });
  expect(r.violations.map((v) => v.id)).toEqual([]);
});

test("settings: an older server (no tags / prompts) gets the same save as before", async () => {
  render(<AdminSafety />);
  fireEvent.click(await screen.findByRole("tab", { name: "settings" }));
  await screen.findByDisplayValue("1166");
  expect(screen.queryByText(/post tags/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(safetyApi.saveSettings).toHaveBeenCalled());
  const sent = safetyApi.saveSettings.mock.calls.slice(-1)[0][0];
  expect("tags" in sent || "prompts" in sent || "blockedHandleWords" in sent).toBe(false);
  expect(screen.queryByText(/blocked from confession handles/)).toBeNull();
});

test("settings (r7): words blocked from confession handles, saved as typed (the server keeps plain words only)", async () => {
  safetyApi.settings.mockResolvedValueOnce({ mode: "enforce", reportThreshold: 3, bannedWords: [], helplines: [{ name: "x", number: "1166", note: "" }], suspendOnSingleEvidenceReport: false, blockedHandleWords: ["sleepy"] });
  safetyApi.saveSettings.mockImplementationOnce(async (x) => ({ ...x, blockedHandleWords: ["sleepy", "quiet"] }));
  const { container } = render(<AdminSafety />);
  fireEvent.click(await screen.findByRole("tab", { name: "settings" }));
  const box = await screen.findByLabelText("words blocked from confession handles (comma-separated, letters only)");
  expect(box.value).toBe("sleepy");
  fireEvent.change(box, { target: { value: "sleepy, Quiet" } });
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(safetyApi.saveSettings).toHaveBeenCalledWith(expect.objectContaining({ blockedHandleWords: "sleepy, Quiet" })));
  await waitFor(() => expect(box.value).toBe("sleepy, quiet"));
  const axe = require("axe-core");
  const r = await axe.run(container, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, rules: { "color-contrast": { enabled: false } } });
  expect(r.violations.map((v) => v.id)).toEqual([]);
});
