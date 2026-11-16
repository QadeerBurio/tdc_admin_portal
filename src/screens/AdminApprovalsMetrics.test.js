// Brand approvals, metrics and the overview (feat/admin-approvals-metrics): search (debounced, on the server),
// filters, bulk actions, the drawer, reasons required, metric tooltips, the date range, the overview's action links,
// and axe-core (WCAG 2 A / AA, colour contrast checked in the browser checks) on each.
import React from "react";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import axe from "axe-core";
import { AuthContext } from "../context/AuthContext";
import BrandApprovalScreen from "./BrandApprovalScreen";
import AdminMetrics from "./AdminMetrics";
import AdminHome from "./AdminHome";
import { brandApprovalApi } from "../services/brandApprovalApi";
import analyticsApi, { downloadCsv } from "../services/analyticsApi";

jest.mock("../services/brandApprovalApi", () => ({ brandApprovalApi: { list: jest.fn(), detail: jest.fn(), setStatus: jest.fn(), requestInfo: jest.fn(), bulk: jest.fn() } }));
jest.mock("../services/analyticsApi", () => ({ __esModule: true, default: { adminMetrics: jest.fn(), adminOverview: jest.fn() }, downloadCsv: jest.fn(), defaultRange: () => ({ from: "2026-10-01", to: "2026-10-30" }) }));
jest.mock("./EngagementMetrics", () => () => <div>engagement page</div>);
jest.mock("./BusinessAnalytics", () => ({ AdminOverview: () => <div>resume studio and employers</div> }));
jest.mock("../portal/DeleteAccountDialog", () => () => null);
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn(), Link: ({ children }) => children }), { virtual: true });

async function a11y(container) {
  const r = await axe.run(container, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, rules: { "color-contrast": { enabled: false } } });
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}

// ---------- brand approvals ----------
const row = (n, brandName, extra = {}) => ({ _id: `b${n}`.padEnd(24, "0"), brandName, name: `${brandName} Owner`, email: `b${n}@example.com`, category: "Food", city: "Karachi", logo: "", brandApprovalStatus: "pending", createdAt: "2026-10-05T05:00:00Z", branchesCount: 2, offersCount: 1, ...extra });
const BRANDS = [row(1, "Pending Perfumes", { name: "Zara Khan" }), row(2, "Bulk Brand A"), row(3, "Bulk Brand B")];
const listReply = (brands = BRANDS, counts = { all: 7, pending: 5, approved: 1, rejected: 1, draft: 0 }) => ({ brands, total: brands.length, pages: 1, counts, options: { cities: ["Karachi", "Lahore"], categories: ["Fashion", "Food"] } });
const renderBA = () => render(<AuthContext.Provider value={{ user: { role: "admin" }, token: "t", login: jest.fn() }}><BrandApprovalScreen /></AuthContext.Provider>);

beforeEach(() => { jest.clearAllMocks(); });

test("brand approvals: rows with the columns; tab counts; search is debounced and sent to the server", async () => {
  brandApprovalApi.list.mockResolvedValue(listReply());
  const { container } = renderBA();
  expect(await screen.findByText("Pending Perfumes")).toBeInTheDocument();
  expect(brandApprovalApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: "pending", sort: "newest", page: 1, limit: 25 }));
  for (const h of ["brand", "category", "city", "joined", "branches", "offers", "status"]) expect(screen.getByRole("columnheader", { name: h })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Pending\s*5/ })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: /All\s*7/ })).toBeInTheDocument();
  expect(await a11y(container)).toEqual([]);

  const calls = brandApprovalApi.list.mock.calls.length;
  const box = screen.getByLabelText("search");
  fireEvent.change(box, { target: { value: "z" } });
  fireEvent.change(box, { target: { value: "za" } });
  fireEvent.change(box, { target: { value: "zara" } });
  await waitFor(() => expect(brandApprovalApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ q: "zara", page: 1 })));
  const searchCalls = brandApprovalApi.list.mock.calls.slice(calls).filter(([p]) => p.q);
  expect(searchCalls).toHaveLength(1); // one request for the typed word
});

test("brand approvals: filters and sort go to the server; no match → empty state; an error → try again", async () => {
  brandApprovalApi.list.mockResolvedValue(listReply());
  renderBA();
  await screen.findByText("Pending Perfumes");
  fireEvent.change(screen.getByLabelText("city"), { target: { value: "Lahore" } });
  await waitFor(() => expect(brandApprovalApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ city: "Lahore" })));
  fireEvent.change(screen.getByLabelText("category"), { target: { value: "Fashion" } });
  await waitFor(() => expect(brandApprovalApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ city: "Lahore", category: "Fashion" })));
  fireEvent.change(screen.getByLabelText("joined from"), { target: { value: "2026-10-01" } });
  fireEvent.change(screen.getByLabelText("joined to"), { target: { value: "2026-10-31" } });
  await waitFor(() => expect(brandApprovalApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ joinedFrom: "2026-10-01", joinedTo: "2026-10-31" })));
  brandApprovalApi.list.mockResolvedValue(listReply([], { all: 0, pending: 0, approved: 0, rejected: 0, draft: 0 }));
  fireEvent.change(screen.getByLabelText("sort"), { target: { value: "name" } });
  await waitFor(() => expect(brandApprovalApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "name" })));
  expect(await screen.findByText("no brands match")).toBeInTheDocument();
  brandApprovalApi.list.mockRejectedValueOnce(new Error("database unavailable"));
  fireEvent.click(screen.getByRole("button", { name: "refresh" }));
  expect(await screen.findByText("couldn't load brands")).toBeInTheDocument();
  expect(screen.getByText("database unavailable")).toBeInTheDocument();
  brandApprovalApi.list.mockResolvedValue(listReply());
  fireEvent.click(screen.getByRole("button", { name: "try again" }));
  expect(await screen.findByText("Pending Perfumes")).toBeInTheDocument();
});

test("brand approvals: the drawer shows details, branches, offers, contact and history; reject needs a reason", async () => {
  brandApprovalApi.list.mockResolvedValue(listReply());
  brandApprovalApi.detail.mockResolvedValue({
    brand: { ...BRANDS[0], address: "12 Main Rd", phone: "03001234567", websiteUrl: "https://perf.example", onlineStore: { platform: "none", status: "none" } },
    branches: [{ _id: "br1", name: "Clifton", city: "Karachi", isActive: true }],
    offers: [{ _id: "of1", title: "20% off", discountPercentage: 20, status: "active" }],
    history: [{ id: "h1", action: "brand.request_info", reason: "send your NTN", admin: { id: "a1", name: "Ayesha Admin" }, at: "2026-10-06T05:00:00Z" }, { id: "legacy", action: "brand.reject", reason: "blurry logo", admin: null, at: "2026-09-01T05:00:00Z", legacy: true }],
  });
  renderBA();
  fireEvent.click(await screen.findByRole("button", { name: "Pending Perfumes" }));
  const drawer = await screen.findByRole("dialog", { name: "Pending Perfumes" });
  const d = within(drawer);
  for (const t of ["business details", "contact", "documents", "branches (1)", "offers (1)", "history"]) expect(await d.findByText(t)).toBeInTheDocument();
  expect(d.getByText("Clifton")).toBeInTheDocument();
  expect(d.getAllByText("20% off").length).toBe(2); // the offer's title and its discount
  expect(d.getByText("03001234567")).toBeInTheDocument();
  expect(d.getByText("Asked for more information")).toBeInTheDocument();
  expect(d.getByText(/by Ayesha Admin/)).toBeInTheDocument();
  expect(d.getByText("“send your NTN”")).toBeInTheDocument();
  expect(d.getByText(/before the action log/)).toBeInTheDocument();
  expect(await a11y(drawer)).toEqual([]);

  fireEvent.click(d.getByRole("button", { name: "reject" }));
  const dlg = await screen.findByRole("dialog", { name: "Reject" });
  fireEvent.click(within(dlg).getByRole("button", { name: "reject" }));
  expect(await within(dlg).findByText(/reason is required/)).toBeInTheDocument();
  expect(brandApprovalApi.setStatus).not.toHaveBeenCalled();
  expect(await a11y(dlg)).toEqual([]);
  brandApprovalApi.setStatus.mockResolvedValueOnce({ brand: { ...BRANDS[0], brandApprovalStatus: "rejected" } });
  brandApprovalApi.list.mockResolvedValue(listReply(BRANDS.slice(1), { all: 7, pending: 4, approved: 1, rejected: 2, draft: 0 }));
  fireEvent.change(within(dlg).getByLabelText("reason (required)"), { target: { value: "Logo is unreadable" } });
  fireEvent.click(within(dlg).getByRole("button", { name: "reject" }));
  await waitFor(() => expect(brandApprovalApi.setStatus).toHaveBeenCalledWith(BRANDS[0]._id, "rejected", "Logo is unreadable"));
  // the list refreshes in place: the tab count follows
  expect(await screen.findByRole("button", { name: /Pending\s*4/ })).toBeInTheDocument();
});

test("brand approvals: request info needs a reason and notifies; approve needs none", async () => {
  brandApprovalApi.list.mockResolvedValue(listReply());
  brandApprovalApi.detail.mockResolvedValue({ brand: { ...BRANDS[0] }, branches: [], offers: [], history: [] });
  renderBA();
  fireEvent.click(await screen.findByRole("button", { name: "Pending Perfumes" }));
  const drawer = await screen.findByRole("dialog", { name: "Pending Perfumes" });
  fireEvent.click(await within(drawer).findByRole("button", { name: "request info" }));
  let dlg = await screen.findByRole("dialog", { name: "Request more information" });
  fireEvent.click(within(dlg).getByRole("button", { name: "request more information" }));
  expect(await within(dlg).findByText(/reason is required/)).toBeInTheDocument();
  brandApprovalApi.requestInfo.mockResolvedValueOnce({ brand: BRANDS[0] });
  fireEvent.change(within(dlg).getByLabelText("reason (required)"), { target: { value: "Send your NTN" } });
  fireEvent.click(within(dlg).getByRole("button", { name: "request more information" }));
  await waitFor(() => expect(brandApprovalApi.requestInfo).toHaveBeenCalledWith(BRANDS[0]._id, "Send your NTN"));
  fireEvent.click(await within(drawer).findByRole("button", { name: "approve" }));
  dlg = await screen.findByRole("dialog", { name: "Approve" });
  expect(within(dlg).getByLabelText("note (optional)")).toBeInTheDocument();
  brandApprovalApi.setStatus.mockResolvedValueOnce({ brand: { ...BRANDS[0], brandApprovalStatus: "approved" } });
  fireEvent.click(within(dlg).getByRole("button", { name: "approve" }));
  await waitFor(() => expect(brandApprovalApi.setStatus).toHaveBeenCalledWith(BRANDS[0]._id, "approved", ""));
});

test("brand approvals: bulk reject sends the selected ids with one reason (required)", async () => {
  brandApprovalApi.list.mockResolvedValue(listReply());
  const { container } = renderBA();
  await screen.findByText("Pending Perfumes");
  fireEvent.click(screen.getByLabelText("select Bulk Brand A"));
  fireEvent.click(screen.getByLabelText("select Bulk Brand B"));
  expect(screen.getByText("2 selected")).toBeInTheDocument();
  expect(await a11y(container)).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "reject selected" }));
  const dlg = await screen.findByRole("dialog", { name: "Reject 2 brands" });
  fireEvent.click(within(dlg).getByRole("button", { name: "reject" }));
  expect(await within(dlg).findByText(/reason is required/)).toBeInTheDocument();
  expect(brandApprovalApi.bulk).not.toHaveBeenCalled();
  brandApprovalApi.bulk.mockResolvedValueOnce({ brands: [{ ...BRANDS[1], brandApprovalStatus: "rejected" }, { ...BRANDS[2], brandApprovalStatus: "rejected" }] });
  fireEvent.change(within(dlg).getByLabelText("reason (required)"), { target: { value: "Duplicate sign-ups" } });
  fireEvent.click(within(dlg).getByRole("button", { name: "reject" }));
  await waitFor(() => expect(brandApprovalApi.bulk).toHaveBeenCalledWith([BRANDS[1]._id, BRANDS[2]._id], "rejected", "Duplicate sign-ups"));
  await waitFor(() => expect(screen.queryByText("2 selected")).toBeNull());
  // select every brand on the page, then clear
  fireEvent.click(screen.getByLabelText("select every brand on this page"));
  expect(screen.getByText("3 selected")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "clear" }));
  expect(screen.queryByText(/selected$/)).toBeNull();
});

// ---------- metrics + overview ----------
const M = (value, previous, definition, extra = {}) => ({ value, previous, change: previous == null ? null : { delta: value - previous, pct: previous ? Math.round(((value - previous) / previous) * 1000) / 10 : null }, definition, ...extra });
const S = (value, definition) => ({ value, previous: null, change: null, definition, snapshot: true });
const METRICS = {
  range: { preset: "30d", days: 30, fromDay: "2026-10-01", toDay: "2026-10-30" }, previous: { fromDay: "2026-09-01", toDay: "2026-09-30" }, timeZone: "Asia/Karachi",
  exclusions: { deleted: "gone", test: { configured: false, how: "Railway variables METRICS_TEST_EMAILS, METRICS_TEST_EMAIL_DOMAINS, METRICS_TEST_USER_IDS" } },
  groups: {
    students: { signups: M(120, 100, "student accounts created in the range (Karachi days)"), verified: S(800, "verified now"), active7: S(300, "active 7"), active30: S(600, "active 30") },
    brands: { approvedBrands: S(40, "approved now"), newlyApproved: M(2, 2, "approved in range"), activeOffers: S(110, "live offers"), redemptions: M(90, 100, "brand-confirmed bills"), revenue: M(150000, 140000, "bill minus discount", { unit: "PKR" }) },
    loyalty: { members: M(1, 0, "pairs"), visits: M(1, 1, "visits"), rewardsEarned: M(0, 0, "earned"), rewardsUsed: M(0, 0, "used") },
    surpriseBox: { boxesListed: M(0, 0, "listed"), orders: M(0, 0, "orders"), pickups: M(0, 0, "pickups"), noShows: M(0, 0, "no-shows") },
    careers: { jobs: M(5, 4, "jobs"), applications: M(40, 50, "applications"), interviews: M(3, 3, "interviews"), hires: M(1, 0, "hires") },
    engagement: { posts: M(9, 9, "posts"), confessions: M(4, 2, "confessions"), pushOpens: M(70, 60, "opens") },
  },
  series: { signups: [{ day: "2026-10-01", count: 3 }, { day: "2026-10-02", count: 5 }], redemptions: [{ day: "2026-10-01", count: 0 }, { day: "2026-10-02", count: 2 }] },
  topBrands: [{ id: "b1", name: "Alpha Cafe", redemptions: 40 }], topUniversities: [], minCohort: 5,
  funnel: { applications: 40, shortlisted: 10, interviews: 3, offers: 2, hires: 1 },
  needsAction: { brandApprovals: 3, studentVerifications: 2, companyVerifications: 1, hireDisputes: null, ratingsReports: 0, failedPushes: 4 },
};

test("metrics: every group, an 'i' per metric with the server's definition, the change vs the previous period", async () => {
  analyticsApi.adminMetrics.mockResolvedValue(METRICS);
  const { container } = render(<AdminMetrics />);
  expect(await screen.findByRole("heading", { name: "students" })).toBeInTheDocument();
  for (const g of ["brands", "loyalty", "surprise boxes", "careers", "engagement"]) expect(screen.getByRole("heading", { name: g })).toBeInTheDocument();
  expect(analyticsApi.adminMetrics).toHaveBeenCalledWith({ preset: "30d" });
  const tips = container.querySelectorAll(".am-tip-btn");
  expect(tips).toHaveLength(24);
  const signups = screen.getByRole("button", { name: "what “sign-ups” counts" });
  const tip = document.getElementById(signups.getAttribute("aria-describedby"));
  expect(tip).not.toBeVisible();
  fireEvent.focus(signups);
  expect(tip).toBeVisible();
  expect(tip).toHaveTextContent("student accounts created in the range (Karachi days)");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(tip).not.toBeVisible();
  fireEvent.click(signups);
  expect(tip).toBeVisible();
  expect(screen.getAllByText(/\+20%/).length).toBeGreaterThan(0);
  expect(screen.getAllByText("as of now").length).toBe(5); // verified, active 7 / 30, approved brands, live offers
  expect(screen.getByText(/no test accounts are set up yet/)).toBeInTheDocument();
  expect(screen.getAllByText("nothing in this range yet.")).toHaveLength(1); // surprise boxes: all zero
  fireEvent.click(screen.getByRole("button", { name: "export careers as csv" }));
  expect(downloadCsv).toHaveBeenCalledWith("tdc-metrics-careers-2026-10-01-to-2026-10-30.csv", expect.arrayContaining([["careers", "applications", 40, 50, -20, "applications"]]));
  expect(await a11y(container)).toEqual([]);
});

test("metrics: presets and a custom range go to the server; a bad custom range can't be applied; error → try again", async () => {
  analyticsApi.adminMetrics.mockResolvedValue(METRICS);
  render(<AdminMetrics />);
  await screen.findByRole("heading", { name: "students" });
  fireEvent.click(screen.getByRole("button", { name: "7 days" }));
  await waitFor(() => expect(analyticsApi.adminMetrics).toHaveBeenLastCalledWith({ preset: "7d" }));
  fireEvent.click(screen.getByRole("button", { name: "this month" }));
  await waitFor(() => expect(analyticsApi.adminMetrics).toHaveBeenLastCalledWith({ preset: "month" }));
  fireEvent.click(screen.getByRole("button", { name: "custom" }));
  fireEvent.change(screen.getByLabelText("from"), { target: { value: "2026-10-09" } });
  fireEvent.change(screen.getByLabelText("to"), { target: { value: "2026-10-01" } });
  expect(screen.getByText("“to” must be on or after “from”")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "apply" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("to"), { target: { value: "2026-10-12" } });
  fireEvent.click(screen.getByRole("button", { name: "apply" }));
  await waitFor(() => expect(analyticsApi.adminMetrics).toHaveBeenLastCalledWith({ preset: "custom", from: "2026-10-09", to: "2026-10-12" }));
  analyticsApi.adminMetrics.mockRejectedValueOnce(new Error("Something went wrong"));
  fireEvent.click(screen.getByRole("button", { name: "today" }));
  expect(await screen.findByText("couldn't load the metrics")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "try again" }));
  expect(await screen.findByRole("heading", { name: "students" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /engagement details/ }));
  expect(screen.getByText("engagement page")).toBeInTheDocument();
});

test("overview: KPI cards with the change; each action has its count and opens its page; quick actions; charts", async () => {
  analyticsApi.adminMetrics.mockResolvedValue(METRICS);
  const go = jest.fn();
  const pages = ["brand_approval", "student_verifications", "company_verifications", "ratings_reports", "engagement_test_push", "features", "engagement_metrics"];
  const { container } = render(<AdminHome go={go} pages={pages} />);
  expect(await screen.findByText("new students")).toBeInTheDocument();
  for (const k of ["verified students", "active brands", "revenue through tdc"]) expect(screen.getByText(k)).toBeInTheDocument();
  const kpi = (k) => container.querySelector(`[data-kpi=${k}]`);
  expect(kpi("signups")).toHaveTextContent("120");
  expect(kpi("signups")).toHaveTextContent("+20%");
  expect(kpi("applications")).toHaveTextContent("-20%");
  expect(kpi("revenue")).toHaveTextContent("PKR 150,000");
  expect(kpi("verified")).toHaveTextContent("as of now");

  const need = (k) => container.querySelector(`[data-need=${k}]`);
  expect(need("brandApprovals")).toHaveTextContent("3");
  fireEvent.click(screen.getByRole("button", { name: "open brand approvals" }));
  expect(go).toHaveBeenLastCalledWith("brand_approval");
  fireEvent.click(screen.getByRole("button", { name: "open student verifications" }));
  expect(go).toHaveBeenLastCalledWith("student_verifications");
  fireEvent.click(screen.getByRole("button", { name: "open company verifications" }));
  expect(go).toHaveBeenLastCalledWith("company_verifications");
  fireEvent.click(screen.getByRole("button", { name: "open ratings reports" }));
  expect(go).toHaveBeenLastCalledWith("ratings_reports");
  fireEvent.click(screen.getByRole("button", { name: "open failed pushes (7 days)" }));
  expect(go).toHaveBeenLastCalledWith("engagement_test_push");
  expect(need("hireDisputes")).toHaveTextContent("not set up"); // no count from the server (pilot off) and no page
  expect(within(need("hireDisputes")).queryByRole("button")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "new offer" }));
  expect(go).toHaveBeenLastCalledWith("offer");
  fireEvent.click(screen.getByRole("button", { name: "approve brands" }));
  expect(go).toHaveBeenLastCalledWith("brand_approval");
  fireEvent.click(screen.getByRole("button", { name: "send push test" }));
  expect(go).toHaveBeenLastCalledWith("engagement_test_push");
  fireEvent.click(screen.getByRole("button", { name: "open features" }));
  expect(go).toHaveBeenLastCalledWith("features");

  expect(screen.getByRole("img", { name: /sign-ups: 8 in 2 days/ })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /top 5 brands by redemptions: Alpha Cafe 40/ })).toBeInTheDocument();
  expect(screen.getByText(/no university has 5\+ active students yet/)).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /hiring funnel: applications 40, shortlisted 10/ })).toBeInTheDocument();
  expect(screen.getAllByText("show as table").length).toBeGreaterThanOrEqual(4);
  expect(await a11y(container)).toEqual([]);
});

test("overview: same numbers as the metrics page (one call, same reply)", async () => {
  analyticsApi.adminMetrics.mockResolvedValue(METRICS);
  const a = render(<AdminHome go={jest.fn()} pages={[]} />);
  await screen.findByText("new students");
  const homeSignups = a.container.querySelector("[data-kpi=signups] .k-stat-num").textContent;
  a.unmount();
  const b = render(<AdminMetrics />);
  await screen.findByRole("heading", { name: "students" });
  const metricsSignups = b.container.querySelector("[data-metric='sign-ups'] .am-tile-num").textContent;
  expect(homeSignups).toBe(metricsSignups);
  expect(analyticsApi.adminMetrics.mock.calls.every(([q]) => q.preset === "30d")).toBe(true);
  await act(async () => {});
});
