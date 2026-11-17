import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, within } from "@testing-library/react";
// the nav only uses Link: a plain link here (jest can't load react-router v7's package exports in this setup)
jest.mock("react-router-dom", () => {
  const R = require("react");
  return { Link: ({ to, children, ...p }) => R.createElement("a", { href: to, ...p }, children) };
});
const MemoryRouter = ({ children }) => children;
import PortalNav, { ADMIN_MENU, ADMIN_PAGE_ALIASES, groupOf, pageLabel } from "./PortalNav";

const KEY = "tdc.admin.nav.test-admin";
const renderNav = (props = {}) => render(
  <MemoryRouter>
    <PortalNav menu={ADMIN_MENU} active="dashboard" onSelect={() => {}} userName="Ayesha" collapsible searchable storageKey={KEY} {...props} />
  </MemoryRouter>
);
const group = (title) => screen.getByRole("button", { name: new RegExp(`^${title}`) });
beforeEach(() => window.localStorage.clear());

test("the menu: groups in order, names, no duplicates", () => {
  expect(ADMIN_MENU.map((g) => g.title)).toEqual(["general", "users", "student app", "brands", "employers", "engagement", "crew", "settings"]);
  expect(ADMIN_MENU.map((g) => g.items.map((i) => i[1]))).toEqual([
    ["dashboard", "overview", "metrics", "admin actions"],
    ["all students", "all brands", "all employers", "all travelers", "student verifications", "student cards"],
    ["jobs & internships", "scholarships", "events", "travel", "AI travel plans", "rewards"],
    ["brand approvals", "offers", "loyalty programs", "loyalty exceptions", "surprise boxes", "brand revenue"],
    ["company verifications", "hiring overview", "hiring funnel", "hire disputes", "ratings reports", "first hire free", "hiring plans"],
    ["daily drops", "push test"],
    ["crew inbox", "crew partners", "crew campaigns", "crew credentials"],
    ["features"],
  ]);
  const ids = ADMIN_MENU.flatMap((g) => g.items.map((i) => i[0]));
  const labels = ADMIN_MENU.flatMap((g) => g.items.map((i) => i[1]));
  expect(new Set(ids).size).toBe(ids.length);
  expect(new Set(labels).size).toBe(labels.length);
  expect(pageLabel("free_hire_trials")).toBe("first hire free");
  expect(groupOf("hire_disputes")).toBe("employers");
});

test("every menu item opens a real page in the admin dashboard; old page ids still resolve", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "screens", "AdminDashboard.js"), "utf8");
  for (const g of ADMIN_MENU) for (const [id] of g.items) {
    expect([id, src.includes(`case "${id}":`)]).toEqual([id, true]);
  }
  expect(ADMIN_PAGE_ALIASES.offer).toEqual(["offers", "new"]);
  expect(ADMIN_PAGE_ALIASES["all offer"]).toEqual(["offers", "all"]);
});

test("groups are buttons with aria-expanded; collapsing hides the items and is remembered", () => {
  const { unmount } = renderNav();
  const brands = group("brands");
  expect(brands).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "offers" })).toBeVisible();
  fireEvent.click(brands);
  expect(brands).toHaveAttribute("aria-expanded", "false");
  expect(document.getElementById(brands.getAttribute("aria-controls"))).not.toBeVisible();
  expect(JSON.parse(window.localStorage.getItem(KEY))).toEqual({ brands: false });
  unmount();
  renderNav();
  expect(group("brands")).toHaveAttribute("aria-expanded", "false"); // remembered for this admin
  expect(group("users")).toHaveAttribute("aria-expanded", "true"); // the others open by default
});

test("the active page's group opens by itself", () => {
  window.localStorage.setItem(KEY, JSON.stringify({ employers: false }));
  renderNav({ active: "hire_disputes" });
  expect(group("employers")).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("button", { name: "hire disputes" })).toHaveAttribute("aria-current", "page");
});

test("search filters items by name; nothing matching says so", () => {
  renderNav();
  const box = screen.getByRole("searchbox", { name: "search the menu" });
  fireEvent.change(box, { target: { value: "loyal" } });
  expect(screen.getByRole("button", { name: "loyalty programs" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "loyalty exceptions" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "all students" })).toBeNull();
  expect(screen.queryByRole("button", { name: /^general/ })).toBeNull(); // a group with no match is hidden
  fireEvent.change(box, { target: { value: "zzz" } });
  expect(screen.getByRole("status")).toHaveTextContent("nothing matches");
  fireEvent.change(box, { target: { value: "" } });
  expect(screen.getByRole("button", { name: "all students" })).toBeInTheDocument();
});

test("badges show only when something is waiting", () => {
  renderNav({ badges: { brand_approval: 3, company_verifications: 0, hire_disputes: null, student_verifications: 12 } });
  expect(within(screen.getByRole("button", { name: /^brand approvals/ })).getByLabelText("3 waiting")).toHaveTextContent("3");
  expect(within(screen.getByRole("button", { name: /^student verifications/ })).getByLabelText("12 waiting")).toBeInTheDocument();
  expect(within(screen.getByRole("button", { name: /^company verifications/ })).queryByLabelText(/waiting/)).toBeNull();
  expect(within(screen.getByRole("button", { name: /^hire disputes/ })).queryByLabelText(/waiting/)).toBeNull();
  // a closed group shows the total waiting inside it
  fireEvent.click(group("brands"));
  expect(within(group("brands")).getByLabelText("3 waiting")).toBeInTheDocument();
});

test("arrow keys move between the group buttons and items", () => {
  renderNav();
  const first = group("general");
  first.focus();
  fireEvent.keyDown(first, { key: "ArrowDown" });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "dashboard" }));
  fireEvent.keyDown(document.activeElement, { key: "ArrowUp" });
  expect(document.activeElement).toBe(first);
  fireEvent.keyDown(document.activeElement, { key: "End" });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "features" }));
});

test("storage that throws (private mode): everything still works, all groups open", () => {
  const spy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
  const set = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
  renderNav();
  expect(group("users")).toHaveAttribute("aria-expanded", "true");
  fireEvent.click(group("users"));
  expect(group("users")).toHaveAttribute("aria-expanded", "false");
  spy.mockRestore(); set.mockRestore();
});

test("brand / employer menus are unchanged: no group buttons, no search", () => {
  render(<MemoryRouter><PortalNav menu={[{ title: "", items: [["dashboard", "dashboard", "home", "orange", "/home"]] }]} active="dashboard" userName="b" /></MemoryRouter>);
  expect(screen.queryByRole("searchbox")).toBeNull();
  expect(screen.getByRole("link", { name: "dashboard" })).toHaveAttribute("href", "/home");
});

test("employer menu: 'company verification' is always there, with its status chip", () => {
  const { EMPLOYER_MENU } = require("./PortalNav");
  const items = EMPLOYER_MENU.flatMap((g) => g.items);
  expect(items.find((i) => i[0] === "company")).toEqual(["company", "company verification", "shield", "blue", "/company-verification"]);
  const { rerender } = render(<MemoryRouter><PortalNav menu={EMPLOYER_MENU} active="dashboard" userName="e" chips={{ company: { label: "under review", tone: "yellow" } }} /></MemoryRouter>);
  const link = screen.getByRole("link", { name: /company verification/ });
  expect(link).toHaveAttribute("href", "/company-verification");
  expect(within(link).getByText("under review")).toHaveAttribute("data-tone", "yellow");
  rerender(<MemoryRouter><PortalNav menu={EMPLOYER_MENU} active="dashboard" userName="e" /></MemoryRouter>);
  // no status yet: the item is still there, without a chip
  expect(screen.getByRole("link", { name: /company verification/ })).toBeInTheDocument();
  expect(document.querySelector('[data-chip="company"]')).toBeNull();
});
