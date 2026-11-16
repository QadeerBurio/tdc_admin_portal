// fix/metric-audit: the engagement page's new labels and separate counts, card revenue "not tracked".
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import EngagementMetrics from "./EngagementMetrics";
import CardManager from "./CardManager";
import { engagementApi } from "../services/api";

jest.mock("../services/api", () => ({ __esModule: true, default: {}, engagementApi: { metrics: jest.fn(), drilldown: jest.fn() } }));
jest.mock("axios");
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn(), Link: ({ children }) => children }), { virtual: true });

const ENGAGEMENT = {
  range: { weeks: 8, fromDay: "2026-09-25", toDay: "2026-11-19", timeZone: "Asia/Karachi" }, exclusions: { test: "test accounts left out (METRICS_TEST_* variables)" },
  totalProfiles: 4, activeUsers: 1, badgesEarned: 0, pushSent: 1, pushDelivered: 1, pushFailed: 1, pushQueued: 1, pushAwaitingReceipt: 1, pushOpened: 1, pushOpenRate: 1,
  rewardsRedeemed: 2, codesIssued: 2, totalDrops: 0, totalDropReactions: 0, totalPointsAwarded: 0, fullySortedCount: 0, examModeActive: 1,
  totalReferrals: 2, studentsWhoInvited: 2, invitedSignups: 1, avgStreak: 0, longestStreak: 0,
  weeklyUsers: [{ _id: { week: 41, year: 2026 }, weekStart: "2026-10-05", users: 1 }], missionBreakdown: {}, levelBreakdown: {}, topBadges: [], eventBreakdown: {},
};

test("engagement: 'students who invited someone', invited sign-ups, codes issued, delivered / failed / queued pushes, Karachi weeks", async () => {
  engagementApi.metrics.mockResolvedValue(ENGAGEMENT);
  render(<EngagementMetrics />);
  expect(await screen.findByText("students who invited someone")).toBeInTheDocument();
  expect(screen.queryByText("users invited")).toBeNull();
  expect(screen.getByText("1 invited sign-ups in the period")).toBeInTheDocument();
  expect(screen.getByText("invited sign-ups")).toBeInTheDocument();
  expect(screen.getByText("codes issued")).toBeInTheDocument();
  expect(screen.getByText("codes used · 2 codes issued")).toBeInTheDocument();
  expect(screen.getByText("push delivered")).toBeInTheDocument();
  expect(screen.getByText("1 failed · 1 queued · 1 no receipt yet")).toBeInTheDocument();
  expect(screen.getByText("active students")).toBeInTheDocument();
  expect(screen.getByText(/active in the last \d+ weeks/)).toBeInTheDocument();
  expect(screen.getByText("today (Karachi)")).toBeInTheDocument();
  expect(screen.getByText(/from 2026-10-05 \(Mon, Karachi\)/)).toBeInTheDocument();
  expect(screen.getByText(/test accounts left out/)).toBeInTheDocument();
});

test("card manager: revenue 'not tracked' when the server has no payment amount", async () => {
  axios.get.mockImplementation((url) => Promise.resolve({ data: /card-stats/.test(url) ? { printing: 0, shipped: 0, delivered: 0, pending: 1, approvedTotal: 2, totalRevenue: null, revenueTracked: false } : [] }));
  render(<AuthContext.Provider value={{ token: "t", user: { role: "admin" } }}><CardManager /></AuthContext.Provider>);
  await waitFor(() => expect(screen.getByText("not tracked")).toBeInTheDocument());
  expect(screen.getByText("payments have no amount recorded")).toBeInTheDocument();
  expect(screen.queryByText(/₨ 1,500/)).toBeNull();
});
