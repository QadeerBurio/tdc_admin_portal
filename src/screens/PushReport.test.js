// N-6 push report (engagement metrics page): real numbers only, "not enough data yet" instead of 0%.
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PushReport from "./PushReport";
import { engagementApi } from "../services/api";

jest.mock("../services/api", () => ({ __esModule: true, engagementApi: { pushReport: jest.fn() } }));

const report = (over = {}) => ({ days: 14, minSent: 50, enoughData: true, tracking: { configured: true, trackedPushes: 70 }, optOuts: { total: 2, unattributed: 0 }, byDay: [], types: [], ...over });

beforeEach(() => jest.resetAllMocks());

test("tracking off: says so, no numbers", async () => {
  engagementApi.pushReport.mockResolvedValue(report({ tracking: { configured: false, trackedPushes: 0 }, enoughData: false }));
  render(<PushReport />);
  expect(await screen.findByText("push tracking is off")).toBeInTheDocument();
  expect(screen.queryByText(/%/)).not.toBeInTheDocument();
});

test("tracking on but nothing yet: not enough data yet", async () => {
  engagementApi.pushReport.mockResolvedValue(report({ types: [], enoughData: false, tracking: { configured: true, trackedPushes: 0 } }));
  render(<PushReport />);
  expect(await screen.findByText("not enough data yet")).toBeInTheDocument();
});

test("a type with too few pushes shows 'not enough data yet', never 0%; one with enough shows its rates and review", async () => {
  engagementApi.pushReport.mockResolvedValue(report({
    types: [
      { type: "social_post", sent: 60, delivered: 50, opened: 1, optOuts24h: 2, enough: true, openRate: 1.7, deliveredRate: 83.3, optOutRate: 3.3, review: true },
      { type: "reply", sent: 10, delivered: 10, opened: 0, optOuts24h: 0, enough: false, openRate: null, deliveredRate: null, optOutRate: null, review: false },
    ],
  }));
  render(<PushReport />);
  expect(await screen.findByText("1.7%")).toBeInTheDocument();
  expect(screen.getByText("83.3%")).toBeInTheDocument();
  expect(screen.getByText("2 (3.3%)")).toBeInTheDocument();
  expect(screen.getByText("review")).toBeInTheDocument();
  expect(screen.getAllByText("not enough data yet")).toHaveLength(3); // the reply row: delivered, opened, opt-outs
  expect(screen.queryByText("0%")).not.toBeInTheDocument();
});

test("the period selector asks again", async () => {
  engagementApi.pushReport.mockResolvedValue(report({ types: [] }));
  render(<PushReport />);
  await waitFor(() => expect(engagementApi.pushReport).toHaveBeenCalledWith(14));
  fireEvent.change(screen.getByLabelText("push report period"), { target: { value: "30" } });
  await waitFor(() => expect(engagementApi.pushReport).toHaveBeenCalledWith(30));
});

test("a failed load says so", async () => {
  engagementApi.pushReport.mockRejectedValue(new Error("500"));
  render(<PushReport />);
  expect(await screen.findByText("the push report could not be loaded. try again.")).toBeInTheDocument();
});
