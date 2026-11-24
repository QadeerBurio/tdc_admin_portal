// P3d resume metrics (Admin > general > resume metrics, analytics.view): the server's real counts per template, which
// rates students may see (>= 30 applications and >= 10 interviews), the public pages; a failed load says so with
// "try again"; the page needs analytics.view and sits in the menu; axe-core (WCAG 2 A / AA).
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import axe from "axe-core";
import AdminResumeMetrics from "./AdminResumeMetrics";
import { analyticsApi } from "../services/analyticsApi";
import { PAGE_PERMISSIONS } from "../portal/adminAccess";
import { ADMIN_MENU } from "../portal/PortalNav";

jest.mock("../services/analyticsApi", () => { const api = { resumeMetrics: jest.fn() }; return { __esModule: true, analyticsApi: api, default: api }; });
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn(), useLocation: () => ({ pathname: "/admin" }), Link: ({ children }) => children, NavLink: ({ children }) => children }), { virtual: true });

const REPLY = {
  templates: [
    { id: "modern_ats", name: "Modern", resumes: 120, applications: 41, interviews: 12, hires: 2, rateShown: true },
    { id: "campus", name: "Campus", resumes: 8, applications: 29, interviews: 20, hires: 0, rateShown: false },
    { id: "harvard", name: "Harvard", resumes: 0, applications: 0, interviews: 0, hires: 0, rateShown: false },
  ],
  publicPages: { on: 5, views: 37 },
  minimum: { applications: 30, interviews: 10 },
};

beforeEach(() => jest.clearAllMocks());

test("the real counts per template, the rate and whether students see it; public pages", async () => {
  analyticsApi.resumeMetrics.mockResolvedValue(REPLY);
  const { container } = render(<AdminResumeMetrics />);
  const modern = (await screen.findByText("Modern")).closest("tr");
  expect(within(modern).getAllByRole("cell").map((c) => c.textContent)).toEqual(["Modern", "120", "41", "12", "2", "29%", "yes"]);
  const campus = screen.getByText("Campus").closest("tr");
  expect(within(campus).getByText("not yet")).toBeInTheDocument();
  const harvard = screen.getByText("Harvard").closest("tr");
  expect(within(harvard).getAllByRole("cell")[5].textContent).toBe("–"); // no applications: no made-up rate
  expect(screen.getByText(/only from 30 applications and 10 interviews/)).toBeInTheDocument();
  expect(screen.getByText("5")).toBeInTheDocument();
  expect(screen.getByText("37")).toBeInTheDocument();
  expect(screen.getByText("70")).toBeInTheDocument(); // 41 + 29 + 0 applications with a tdc resume
  const r = await axe.run(container, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] }, rules: { "color-contrast": { enabled: false } } });
  expect(r.violations.map((v) => v.id)).toEqual([]);
});

test("a failed load says so, and try again loads it", async () => {
  analyticsApi.resumeMetrics.mockRejectedValueOnce(new Error("Not allowed for your account")).mockResolvedValueOnce(REPLY);
  render(<AdminResumeMetrics />);
  expect(await screen.findByText("couldn't load")).toBeInTheDocument();
  expect(screen.getByText("Not allowed for your account")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "try again" }));
  expect(await screen.findByText("Modern")).toBeInTheDocument();
});

test("the page needs analytics.view and is in the general menu", () => {
  expect(PAGE_PERMISSIONS.resume_metrics).toBe("analytics.view");
  const general = ADMIN_MENU.find((g) => g.title === "general");
  expect(general.items.some(([id, label]) => id === "resume_metrics" && label === "resume metrics")).toBe(true);
});
