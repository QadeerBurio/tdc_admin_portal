import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../services/api";
import SafetyReportQueue from "./SafetyReportQueue";

jest.mock("../services/api", () => ({ get: jest.fn(), patch: jest.fn() }));
jest.mock("../portal/adminAccess", () => ({ useAdminCan: () => (permission) => permission === "safety.intake.act" }));

test("shows urgent reports, opens details and saves a versioned decision", async () => {
  const row = { _id: "test-report", reason: "child_exploitation", targetType: "General", priority: 2 };
  api.get.mockImplementation(async (url) => ({ data: url.endsWith(row._id)
    ? { ...row, description: "Harmless fixture", status: "pending", escalation: "none", __v: 3, history: [] }
    : { items: [row], counts: { pending: 1, under_review: 0, resolved: 0 } } }));
  api.patch.mockResolvedValue({ data: { success: true } });

  render(<SafetyReportQueue />);
  expect(await screen.findByText("Urgent")).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Pending (1)" })).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Child safety only"));
  await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/safety-reports", { params: { child: true, status: "pending" } }));
  fireEvent.click(await screen.findByRole("button", { name: /child sexual abuse or exploitation/i }));
  expect(await screen.findByText("Harmless fixture")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Moderator notes"), { target: { value: "Harmless test decision" } });
  fireEvent.click(screen.getByLabelText("Assign to me"));
  fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
  await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/admin/safety-reports/test-report", expect.objectContaining({
    assign: true, version: 3, note: "Harmless test decision",
  })));
});
