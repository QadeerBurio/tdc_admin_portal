import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import UnmatchedUniversities from "./UnmatchedUniversities";
import universitiesApi from "../services/universitiesApi";

jest.mock("../services/universitiesApi", () => {
  const api = { unmatched: jest.fn(), unmatchedSummary: jest.fn(), matchBulk: jest.fn(), matchTo: jest.fn(), search: jest.fn() };
  return { __esModule: true, default: api };
});

const IOBM = { id: "u1", name: "Institute of Business Management", shortName: "IoBM", city: "Karachi" };
const NED = { id: "u2", name: "NED University of Engineering & Technology", shortName: "NED", city: "Karachi" };
const KU = { id: "u3", name: "University of Karachi", shortName: "KU", city: "Karachi" };
const UETL = { id: "u4", name: "University of Engineering & Technology, Lahore", shortName: "UET", city: "Lahore" };
const UETP = { id: "u5", name: "University of Engineering & Technology, Peshawar", shortName: "UET", city: "Peshawar" };
const HUM = { id: "u6", name: "University of Home Economics, Lahore", shortName: "", city: "Lahore" };
const ROWS = [
  { id: "o1", name: "iobm karachi", students: 3, confidence: "high", score: 1, reason: "short name / initials", suggestion: IOBM, alternatives: [] },
  { id: "o2", name: "NED Univ", students: 2, confidence: "high", score: 1, reason: "a known other name", suggestion: NED, alternatives: [] },
  { id: "o3", name: "Karachi University", students: 1, confidence: "high", score: 1, reason: "a known other name", suggestion: KU, alternatives: [] },
  { id: "o4", name: "UET", students: 4, confidence: "medium", score: 1, reason: "short name / initials, but also close to …Peshawar", suggestion: UETL, alternatives: [{ ...UETP, score: 1 }] },
  { id: "o5", name: "Some Old College", students: 1, confidence: "none", score: 0.32, reason: "", suggestion: null, alternatives: [{ ...HUM, score: 0.32 }] },
];

beforeEach(() => {
  jest.resetAllMocks();
  universitiesApi.unmatched.mockResolvedValue(ROWS);
  universitiesApi.unmatchedSummary.mockResolvedValue({ unmatched: 5, students: 11, matchedToday: 7 });
  universitiesApi.search.mockResolvedValue([IOBM, KU]);
});

test("counts on top; grouped high → medium / low → none; high ones ticked; reading changes nothing", async () => {
  render(<UnmatchedUniversities onAddNew={() => {}} />);
  const high = await screen.findByRole("region", { name: "high confidence names" });
  const counts = screen.getByRole("group", { name: "unmatched counts" });
  expect(within(counts).getByText("unmatched names")).toBeInTheDocument();
  expect(within(counts).getByText("students affected")).toBeInTheDocument();
  expect(within(counts).getByText("matched today")).toBeInTheDocument();
  await waitFor(() => expect(within(counts).getByText("11")).toBeInTheDocument(), { timeout: 2500 });
  expect(within(counts).getByText("7")).toBeInTheDocument();
  const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(headings).toEqual(["high confidence · 3", "medium and low confidence · 1", "no likely match · 1"]);
  expect(within(high).getByText("iobm karachi")).toBeInTheDocument();
  expect(within(high).getByText(IOBM.name)).toBeInTheDocument();
  ["iobm karachi", "NED Univ", "Karachi University"].forEach((n) => expect(screen.getByRole("checkbox", { name: `select ${n}` })).toBeChecked());
  expect(screen.getByRole("button", { name: "match all selected (3)" })).toBeEnabled();
  expect(within(screen.getByRole("region", { name: "names to check" })).getByText("UET")).toBeInTheDocument();
  expect(within(screen.getByRole("region", { name: "names with no likely match" })).getByText("Some Old College")).toBeInTheDocument();
  expect(universitiesApi.matchBulk).not.toHaveBeenCalled();
  expect(universitiesApi.matchTo).not.toHaveBeenCalled();
});

test("match all selected: one confirm with the count and examples, then one bulk call; reloads", async () => {
  universitiesApi.matchBulk.mockResolvedValue({ matched: 2, students: 5, failed: [] });
  render(<UnmatchedUniversities onAddNew={() => {}} />);
  fireEvent.click(await screen.findByRole("checkbox", { name: "select Karachi University" }));
  fireEvent.click(screen.getByRole("button", { name: "match all selected (2)" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("match 2 names?")).toBeInTheDocument();
  expect(within(dialog).getByText(/5 students move to the official university/)).toBeInTheDocument();
  const examples = within(dialog).getByRole("list", { name: "examples" });
  expect(examples).toHaveTextContent("iobm karachi → Institute of Business Management");
  expect(examples).toHaveTextContent("NED Univ → NED University of Engineering & Technology");
  expect(examples).not.toHaveTextContent("Karachi University");
  expect(universitiesApi.matchBulk).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "match 2" }));
  await waitFor(() => expect(universitiesApi.matchBulk).toHaveBeenCalledWith([{ id: "o1", toId: "u1" }, { id: "o2", toId: "u2" }]));
  await waitFor(() => expect(universitiesApi.unmatched).toHaveBeenCalledTimes(2));
  expect(universitiesApi.unmatchedSummary).toHaveBeenCalledTimes(2);
});

test("select all off / on; cancel the confirm: nothing is matched", async () => {
  render(<UnmatchedUniversities onAddNew={() => {}} />);
  const all = await screen.findByRole("checkbox", { name: "select all (3)" });
  fireEvent.click(all);
  expect(screen.getByRole("button", { name: "match all selected (0)" })).toBeDisabled();
  fireEvent.click(all);
  fireEvent.click(screen.getByRole("button", { name: "match all selected (3)" }));
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "cancel" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(universitiesApi.matchBulk).not.toHaveBeenCalled();
});

test("medium: the suggestion, or another one from the dropdown, then confirm", async () => {
  universitiesApi.matchTo.mockResolvedValue({ from: { name: "UET" }, to: UETP, moved: { students: 4 } });
  render(<UnmatchedUniversities onAddNew={() => {}} />);
  const select = await screen.findByRole("combobox", { name: "match UET to" });
  expect(select).toHaveValue("u4");
  expect([...select.options].map((o) => o.textContent)).toEqual([`${UETL.name} (Lahore)`, `${UETP.name} (Peshawar)`, "another university…"]);
  fireEvent.change(select, { target: { value: "u5" } });
  fireEvent.click(screen.getByRole("button", { name: "match UET" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/4 students move to University of Engineering & Technology, Peshawar/)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "move to UET" }));
  await waitFor(() => expect(universitiesApi.matchTo).toHaveBeenCalledWith("o4", "u5"));
});

test("none: add as new, or pick one (dropdown or search the whole list)", async () => {
  const onAddNew = jest.fn();
  universitiesApi.matchTo.mockResolvedValue({ from: { name: "Some Old College" }, to: KU, moved: { students: 1 } });
  render(<UnmatchedUniversities onAddNew={onAddNew} />);
  const none = await screen.findByRole("region", { name: "names with no likely match" });
  fireEvent.click(within(none).getByRole("button", { name: "add Some Old College as new" }));
  expect(onAddNew).toHaveBeenCalledWith(expect.objectContaining({ id: "o5", name: "Some Old College" }));
  expect(within(none).getByRole("button", { name: "match Some Old College" })).toBeDisabled();
  fireEvent.change(within(none).getByRole("combobox", { name: "match Some Old College to" }), { target: { value: "__other" } });
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(await within(dialog).findByRole("option", { name: /University of Karachi/ }));
  fireEvent.click(within(dialog).getByRole("button", { name: "move to KU" }));
  await waitFor(() => expect(universitiesApi.matchTo).toHaveBeenCalledWith("o5", "u3"));
});

test("a partial bulk failure is reported", async () => {
  universitiesApi.matchBulk.mockResolvedValue({ matched: 2, students: 5, failed: [{ id: "o3", code: "NOT_UNMATCHED", message: "This name is already on the list" }] });
  render(<UnmatchedUniversities onAddNew={() => {}} />);
  fireEvent.click(await screen.findByRole("button", { name: "match all selected (3)" }));
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "match 3" }));
  await waitFor(() => expect(universitiesApi.matchBulk).toHaveBeenCalledTimes(1));
  expect(await screen.findByText(/2 names matched, 5 students moved; 1 not matched: This name is already on the list/)).toBeInTheDocument();
});

test("every name matched: an empty state", async () => {
  universitiesApi.unmatched.mockResolvedValue([]);
  universitiesApi.unmatchedSummary.mockResolvedValue({ unmatched: 0, students: 0, matchedToday: 12 });
  render(<UnmatchedUniversities onAddNew={() => {}} />);
  expect(await screen.findByText("every name is matched")).toBeInTheDocument();
});
