import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UniversitySelect from "./UniversitySelect";
import api from "../services/api";
import { resetUniversitiesCache, bundledUniversities, filterUniversities } from "../services/universitiesApi";

jest.mock("../services/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));

const BUNDLED = require("../data/universities-pk.json");
const serverList = () => [...BUNDLED.universities.map((u, i) => ({ id: `s${i}`, ...u, status: "approved" })), { id: "new1", name: "Aaa Test Institute of Design", shortName: "ATID", city: "Lahore", aliases: [], status: "approved" }];
const options = () => screen.queryAllByRole("option");

beforeEach(() => { jest.resetAllMocks(); resetUniversitiesCache(); });

jest.setTimeout(30000);

test("opens on the full list A–Z, no typing; the server's list (with an admin's addition) replaces the bundled one", async () => {
  api.get.mockResolvedValue({ data: { success: true, data: serverList() } });
  render(<UniversitySelect id="bv-uni" value="" onChange={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /select university/ }));
  expect(options().length).toBe(BUNDLED.universities.length); // at once: never empty
  await waitFor(() => expect(options().length).toBe(BUNDLED.universities.length + 1), { timeout: 8000 }); // 285 rows: slow on a loaded machine
  const names = options().map((o) => o.firstChild.firstChild.textContent);
  expect(names[0]).toBe("Aaa Test Institute of Design");
  expect(names.every((n, i) => i === 0 || names[i - 1].localeCompare(n) <= 0)).toBe(true);
  expect(screen.getByText(`${BUNDLED.universities.length + 1} universities, A–Z`)).toBeInTheDocument();
  expect(screen.getAllByText("IoBM · Karachi").length).toBe(1);
});

test("the search box filters as you type: name, short name, alias, city", async () => {
  api.get.mockResolvedValue({ data: { success: true, data: serverList() } });
  const onChange = jest.fn();
  render(<UniversitySelect id="bv-uni" value="" onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: /select university/ }));
  await waitFor(() => expect(options().length).toBe(BUNDLED.universities.length + 1), { timeout: 8000 }); // 285 rows: slow on a loaded machine
  const search = screen.getByLabelText("search universities");
  fireEvent.change(search, { target: { value: "iobm" } });
  expect(options().map((o) => o.textContent)).toEqual([expect.stringContaining("Institute of Business Management")]);
  fireEvent.change(search, { target: { value: "fast-nuces" } });
  expect(options().some((o) => o.textContent.includes("National University of Computer & Emerging Sciences"))).toBe(true);
  fireEvent.change(search, { target: { value: "jamshoro" } });
  expect(options().length).toBeGreaterThan(0);
  expect(options().every((o) => o.textContent.includes("Jamshoro"))).toBe(true);
  fireEvent.change(search, { target: { value: "zzz nothing" } });
  expect(options().length).toBe(0);
  expect(screen.getByText("no match")).toBeInTheDocument();
  fireEvent.change(search, { target: { value: "lums" } });
  fireEvent.click(options()[0]);
  expect(onChange).toHaveBeenCalledWith("Lahore University of Management Sciences", expect.objectContaining({ shortName: "LUMS" }));
});

test("offline, or the server returns nothing: the bundled list", async () => {
  api.get.mockRejectedValue(Object.assign(new Error("Network Error"), { request: {} }));
  const { unmount } = render(<UniversitySelect id="a" value="" onChange={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /select university/ }));
  await waitFor(() => expect(api.get).toHaveBeenCalled(), { timeout: 8000 });
  expect(options().length).toBe(BUNDLED.universities.length);
  unmount();
  resetUniversitiesCache();
  api.get.mockResolvedValue({ data: { success: true, data: [] } });
  render(<UniversitySelect id="b" value="" onChange={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /select university/ }));
  await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2), { timeout: 8000 });
  expect(options().length).toBe(BUNDLED.universities.length);
});

test("the bundled list is the same as the app's, and verify student uses this dropdown", () => {
  expect(bundledUniversities.length).toBeGreaterThanOrEqual(280);
  expect(filterUniversities(bundledUniversities, "karachi university")[0].name).toBe("University of Karachi");
  const verify = fs.readFileSync(path.join(__dirname, "..", "screens", "VerifyClaim.js"), "utf8");
  expect(verify).toMatch(/import UniversitySelect from "\.\.\/portal\/UniversitySelect"/);
  expect(verify).toMatch(/<UniversitySelect id="bv-uni" value=\{inputs\.university\}/);
  expect(verify).not.toMatch(/const universities = \[\s*"/);
  expect(verify).not.toMatch(/universitiesApi\.search/);
});
