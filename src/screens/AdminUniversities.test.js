import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminUniversities from "./AdminUniversities";
import universitiesApi from "../services/universitiesApi";

jest.mock("../services/universitiesApi", () => {
  const api = { available: jest.fn(), list: jest.fn(), cities: jest.fn(), search: jest.fn(), add: jest.fn(), edit: jest.fn(), hide: jest.fn(), show: jest.fn(), approve: jest.fn(), reject: jest.fn(), merge: jest.fn(), unmatched: jest.fn(), matchTo: jest.fn(), addUnmatched: jest.fn(), pendingCount: jest.fn() };
  return {
    __esModule: true,
    default: api,
    STATUS_LABEL: { approved: "approved", pending: "pending request", hidden: "hidden", unmatched: "unmatched (old name)" },
    STATUS_TONE: { approved: "green", pending: "yellow", hidden: "sand", unmatched: "orange" },
  };
});

const IOBM = { id: "u1", name: "Institute of Business Management", shortName: "IoBM", city: "Karachi", aliases: ["CBM"], status: "approved", source: "seed", students: 12, rejectReason: "", mergedInto: null };
const REQ = { id: "p1", name: "Karachi Grammar College of Design", shortName: "", city: "Karachi", aliases: [], status: "pending", source: "student", students: 1, rejectReason: "", mergedInto: null };

beforeEach(() => {
  jest.resetAllMocks();
  universitiesApi.available.mockResolvedValue(true);
  universitiesApi.cities.mockResolvedValue(["Karachi", "Lahore"]);
  universitiesApi.list.mockResolvedValue([REQ, IOBM]);
  universitiesApi.search.mockResolvedValue([{ id: "u1", name: "Institute of Business Management", shortName: "IoBM", city: "Karachi", status: "approved" }]);
});

test("the list: student counts, statuses, search / city / status filters sent to the server", async () => {
  render(<AdminUniversities />);
  expect(await screen.findByText("Institute of Business Management")).toBeInTheDocument();
  expect(screen.getByText("IoBM")).toBeInTheDocument();
  expect(screen.getByText("12")).toBeInTheDocument();
  expect(screen.getByText("pending request")).toBeInTheDocument();
  expect(screen.getByText("a student's request")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("filter by status"), { target: { value: "pending" } });
  fireEvent.change(screen.getByLabelText("filter by city"), { target: { value: "Karachi" } });
  fireEvent.change(screen.getByLabelText("search universities"), { target: { value: "iobm" } });
  await waitFor(() => expect(universitiesApi.list).toHaveBeenLastCalledWith({ search: "iobm", city: "Karachi", status: "pending" }));
});

test("approve a request with a short name", async () => {
  universitiesApi.approve.mockResolvedValue({ ...REQ, status: "approved", shortName: "KGCD" });
  render(<AdminUniversities />);
  fireEvent.click(await screen.findByRole("button", { name: `approve ${REQ.name}` }));
  fireEvent.change(screen.getByLabelText("short name"), { target: { value: "KGCD" } });
  fireEvent.click(screen.getByRole("button", { name: "approve" }));
  await waitFor(() => expect(universitiesApi.approve).toHaveBeenCalledWith("p1", { name: REQ.name, shortName: "KGCD", city: "Karachi", aliases: "" }));
});

test("reject needs a reason, and can merge into an existing university", async () => {
  universitiesApi.reject.mockResolvedValue({ ...REQ, status: "hidden", merged: { to: { name: IOBM.name }, moved: { students: 1 } } });
  render(<AdminUniversities />);
  fireEvent.click(await screen.findByRole("button", { name: `reject ${REQ.name}` }));
  expect(screen.getByRole("button", { name: "reject" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("reason (required)"), { target: { value: "duplicate of IoBM" } });
  fireEvent.click(await screen.findByRole("option", { name: /Institute of Business Management/ }));
  fireEvent.click(screen.getByRole("button", { name: "reject and merge into IoBM" }));
  await waitFor(() => expect(universitiesApi.reject).toHaveBeenCalledWith("p1", { reason: "duplicate of IoBM", mergeInto: "u1" }));
});

test("add a university, edit, hide", async () => {
  universitiesApi.add.mockResolvedValue({ ...IOBM, id: "n1" });
  universitiesApi.hide.mockResolvedValue({ ...IOBM, status: "hidden" });
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
