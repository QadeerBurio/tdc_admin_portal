import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminUniversities from "./AdminUniversities";
import universitiesApi from "../services/universitiesApi";

jest.mock("../services/universitiesApi", () => {
  const api = { available: jest.fn(), list: jest.fn(), cities: jest.fn(), search: jest.fn(), add: jest.fn(), edit: jest.fn(), hide: jest.fn(), show: jest.fn(), merge: jest.fn(), unmatched: jest.fn(), matchTo: jest.fn(), addUnmatched: jest.fn() };
  return {
    __esModule: true,
    default: api,
    STATUS_LABEL: { approved: "shown", pending: "not shown (old request)", hidden: "hidden", unmatched: "unmatched (old name)" },
    STATUS_TONE: { approved: "green", pending: "yellow", hidden: "sand", unmatched: "orange" },
  };
});

const IOBM = { id: "u1", name: "Institute of Business Management", shortName: "IoBM", city: "Karachi", aliases: ["CBM"], status: "approved", source: "seed", students: 12, rejectReason: "", mergedInto: null };
const HID = { id: "h1", name: "Global Institute, Lahore", shortName: "", city: "Lahore", aliases: [], status: "hidden", source: "seed", students: 0, rejectReason: "", mergedInto: null };
const OLD = { id: "o1", name: "iobm karachi", shortName: "", city: "", aliases: [], status: "unmatched", source: "signup", students: 3, rejectReason: "", mergedInto: null };

beforeEach(() => {
  jest.resetAllMocks();
  universitiesApi.available.mockResolvedValue(true);
  universitiesApi.cities.mockResolvedValue(["Karachi", "Lahore"]);
  universitiesApi.list.mockResolvedValue([OLD, IOBM, HID]);
  universitiesApi.search.mockResolvedValue([{ id: "u1", name: "Institute of Business Management", shortName: "IoBM", city: "Karachi", status: "approved" }]);
});

test("every university (shown, hidden, unmatched) with student counts; filters go to the server; no approve / reject / requests", async () => {
  render(<AdminUniversities />);
  expect(await screen.findByText("Institute of Business Management")).toBeInTheDocument();
  expect(screen.getByText("Global Institute, Lahore")).toBeInTheDocument();
  expect(screen.getByText("iobm karachi")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getAllByText("shown").length).toBeGreaterThan(1); // the filter option and the pill
  expect(screen.getAllByText("hidden").length).toBeGreaterThan(1);
  expect(screen.queryByRole("button", { name: /^approve/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /^reject/ })).toBeNull();
  expect(screen.queryByText(/pending request/)).toBeNull();
  expect(screen.getByRole("button", { name: "show Global Institute, Lahore" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("filter by status"), { target: { value: "hidden" } });
  fireEvent.change(screen.getByLabelText("filter by city"), { target: { value: "Karachi" } });
  fireEvent.change(screen.getByLabelText("search universities"), { target: { value: "iobm" } });
  await waitFor(() => expect(universitiesApi.list).toHaveBeenLastCalledWith({ search: "iobm", city: "Karachi", status: "hidden" }));
  expect([...screen.getByLabelText("filter by status").options].map((o) => o.value)).toEqual(["", "approved", "hidden", "unmatched"]);
});

test("add a university, edit, hide", async () => {
  universitiesApi.add.mockResolvedValue({ ...IOBM, id: "n1" });
  universitiesApi.hide.mockResolvedValue({ ...IOBM, status: "hidden" });
  universitiesApi.show.mockResolvedValue({ ...HID, status: "approved" });
  universitiesApi.edit.mockResolvedValue(IOBM);
  render(<AdminUniversities />);
  fireEvent.click(await screen.findByRole("button", { name: "add university" }));
  const save = screen.getByRole("button", { name: "save" });
  expect(save).toBeDisabled();
  fireEvent.change(screen.getByLabelText("name"), { target: { value: "Test Institute of Design" } });
  fireEvent.change(screen.getByLabelText("city"), { target: { value: "Lahore" } });
  fireEvent.change(screen.getByLabelText("other names (aliases)"), { target: { value: "TID, Design Lahore" } });
  fireEvent.click(save);
  await waitFor(() => expect(universitiesApi.add).toHaveBeenCalledWith({ name: "Test Institute of Design", shortName: "", city: "Lahore", aliases: "TID, Design Lahore" }));
  fireEvent.click(await screen.findByRole("button", { name: `edit ${IOBM.name}` }));
  expect(screen.getByLabelText("other names (aliases)")).toHaveValue("CBM");
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(universitiesApi.edit).toHaveBeenCalledWith("u1", expect.objectContaining({ name: IOBM.name, shortName: "IoBM" })));
  fireEvent.click(await screen.findByRole("button", { name: `hide ${IOBM.name}` }));
  await waitFor(() => expect(universitiesApi.hide).toHaveBeenCalledWith("u1"));
  fireEvent.click(await screen.findByRole("button", { name: "show Global Institute, Lahore" }));
  await waitFor(() => expect(universitiesApi.show).toHaveBeenCalledWith("h1"));
});

test("unmatched names: counts, the suggestion, one-click match, add as new; reading changes nothing", async () => {
  universitiesApi.unmatched.mockResolvedValue([{ id: "o1", name: "iobm karachi", students: 3, suggestion: { id: "u1", name: IOBM.name, shortName: "IoBM", city: "Karachi" } }, { id: "o2", name: "Some Old College", students: 1, suggestion: null }]);
  universitiesApi.matchTo.mockResolvedValue({ from: { name: "iobm karachi" }, to: { name: IOBM.name }, moved: { students: 3 } });
  universitiesApi.addUnmatched.mockResolvedValue({ id: "o2", status: "approved" });
  render(<AdminUniversities />);
  fireEvent.click(await screen.findByRole("tab", { name: /unmatched names/ }));
  const table = await screen.findByRole("region", { name: "unmatched names" });
  expect(within(table).getByText("iobm karachi")).toBeInTheDocument();
  expect(within(table).getByText("3")).toBeInTheDocument();
  expect(within(table).getByText("no close match")).toBeInTheDocument();
  expect(universitiesApi.matchTo).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: `match iobm karachi to ${IOBM.name}` }));
  expect(screen.getByText(/3 students move to the university you pick/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "move to IoBM" }));
  await waitFor(() => expect(universitiesApi.matchTo).toHaveBeenCalledWith("o1", "u1"));
  fireEvent.click(screen.getByRole("button", { name: "add Some Old College as new" }));
  fireEvent.change(screen.getByLabelText("city"), { target: { value: "Hyderabad" } });
  fireEvent.click(screen.getByRole("button", { name: "save" }));
  await waitFor(() => expect(universitiesApi.addUnmatched).toHaveBeenCalledWith("o2", expect.objectContaining({ name: "Some Old College", city: "Hyderabad" })));
});

test("merge duplicates: pick the university to move students into", async () => {
  universitiesApi.list.mockResolvedValue([{ ...IOBM, id: "d1", name: "IoBM Karachi Campus", shortName: "", students: 4 }, IOBM]);
  universitiesApi.merge.mockResolvedValue({ from: { name: "IoBM Karachi Campus" }, to: { name: IOBM.name }, moved: { students: 4 } });
  render(<AdminUniversities />);
  fireEvent.click(await screen.findByRole("button", { name: "merge IoBM Karachi Campus" }));
  fireEvent.click(await screen.findByRole("option", { name: /Institute of Business Management/ }));
  fireEvent.click(screen.getByRole("button", { name: "move to IoBM" }));
  await waitFor(() => expect(universitiesApi.merge).toHaveBeenCalledWith("d1", "u1"));
});
