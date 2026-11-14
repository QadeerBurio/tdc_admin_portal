import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import LoyaltyMembers, { visitsText } from "./LoyaltyMembers";

const view = (members) => ({
  filter: "all",
  mode: "reward",
  totals: { members: 2, visitsThisMonth: 5, rewardsEarned: 3, rewardsUsed: 1 },
  members,
});
const sana = { studentId: "s1", label: "tdc verified user", university: "NED University", visits: 1, visitsNeeded: 2, rewardsEarned: 2, rewardsUsed: 1, rewardReady: false, lastVisitAt: "2026-11-10T10:00:00Z" };
const taha = { studentId: "s2", label: "tdc verified user", university: "", visits: 2, visitsNeeded: 2, rewardsEarned: 1, rewardsUsed: 0, rewardReady: true, lastVisitAt: "2026-11-12T10:00:00Z" };

test("visitsText: visits so far / visits needed (stamp card), or the visits (tiers)", () => {
  expect(visitsText(sana)).toBe("1 / 2");
  expect(visitsText({ visits: 4, visitsNeeded: null })).toBe("4");
});

test("members: totals, one row per student (no name), the filter asks the server, CSV export", async () => {
  const load = jest.fn((filter) => Promise.resolve(filter === "reward-ready" ? { ...view([taha]), filter } : view([sana, taha])));
  const loadCsv = jest.fn(() => Promise.resolve("student,university\n"));
  global.URL.createObjectURL = jest.fn(() => "blob:x");
  global.URL.revokeObjectURL = jest.fn();
  render(<LoyaltyMembers load={load} loadCsv={loadCsv} />);
  const box = await screen.findByTestId("loyalty-members");
  await waitFor(() => expect(within(box).getByText("tdc verified user · NED University")).toBeInTheDocument());
  expect(load).toHaveBeenCalledWith("all");
  for (const [label, value] of [["members", "2"], ["visits this month", "5"], ["rewards earned", "3"], ["rewards used", "1"]]) {
    const stat = [...box.querySelectorAll(".k-stat")].find((el) => el.querySelector(".k-stat-lbl")?.textContent === label);
    expect(stat).toHaveTextContent(value);
  }
  expect(within(box).getByText("1 / 2")).toBeInTheDocument();
  expect(within(box).getAllByText("reward ready").length).toBeGreaterThan(1); // the filter and the row pill
  fireEvent.click(within(box).getByRole("button", { name: "reward ready" }));
  await waitFor(() => expect(load).toHaveBeenCalledWith("reward-ready"));
  await waitFor(() => expect(within(box).queryByText("tdc verified user · NED University")).toBeNull());
  fireEvent.click(within(box).getByRole("button", { name: /export csv/i }));
  await waitFor(() => expect(loadCsv).toHaveBeenCalledWith("reward-ready"));
});
