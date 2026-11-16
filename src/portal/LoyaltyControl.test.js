// feat/loyalty-control in the portal: the bill breakdown (same numbers as the server), the brand form (1 to 10 visits,
// "on top" / "replace", no fixed cap: only tdc's maximum, shown when set), the members' "saved with rewards".
import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { breakdownOf, BillBreakdown } from "./rewardBill";
import LoyaltyMembers from "./LoyaltyMembers";
import loyaltyApi from "../services/loyaltyApi";
import api from "../services/api";

jest.mock("react-router-dom", () => ({ useOutletContext: () => ({ offers: [{ _id: "o1", title: "Chai 15%", discountPercentage: 15 }], brandName: "Chai Cafe" }), Link: ({ children }) => children }), { virtual: true });
jest.mock("../services/loyaltyApi", () => ({ __esModule: true, default: { flagsMe: jest.fn(), myProgram: jest.fn(), analytics: jest.fn(), createProgram: jest.fn(), updateProgram: jest.fn(), members: jest.fn(), membersCsv: jest.fn() } }));
jest.mock("../services/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
// CRA resets mock implementations before each test: set them here
beforeEach(() => { api.get.mockResolvedValue({ data: { branches: [] } }); loyaltyApi.members.mockResolvedValue({ filter: "all", totals: {}, members: [] }); });
jest.mock("./useFlagsMe", () => () => null);
// eslint-disable-next-line import/first
import BrandLoyalty from "../screens/BrandLoyalty";

test("breakdown: bill 1,000, offer 15%, reward 25%: on top → pay 600; replace → 750; PKR off; a free item; never above the bill", () => {
  expect(breakdownOf({ bill: 1000, offerPct: 15, reward: { kind: "percent", value: 25 }, combine: "stack" })).toMatchObject({ offerDiscount: 150, rewardDiscount: 250, totalDiscount: 400, pay: 600 });
  expect(breakdownOf({ bill: 1000, offerPct: 15, reward: { kind: "percent", value: 25 }, combine: "replace" })).toMatchObject({ offerDiscount: 0, rewardDiscount: 250, totalDiscount: 250, pay: 750, used: "reward" });
  expect(breakdownOf({ bill: 1000, offerPct: 30, reward: { kind: "percent", value: 25 }, combine: "replace" })).toMatchObject({ totalDiscount: 300, rewardDiscount: 0, used: "offer" });
  expect(breakdownOf({ bill: 1000, offerPct: 15, reward: { kind: "amount", value: 200 }, combine: "stack" })).toMatchObject({ totalDiscount: 350, pay: 650 });
  expect(breakdownOf({ bill: 1000, offerPct: 15, reward: { kind: "amount", value: 5000 }, combine: "stack" })).toMatchObject({ totalDiscount: 1000, pay: 0 });
  expect(breakdownOf({ bill: 1000, offerPct: 15, reward: { kind: "item", item: "a free chai" } })).toMatchObject({ totalDiscount: 150, pay: 850, giveItem: "a free chai" });
});

test("the verify screen's breakdown rows: offer, reward on top, total, final; replace and give-item wording", () => {
  const { container, rerender } = render(<BillBreakdown bd={breakdownOf({ bill: 1000, offerPct: 15, reward: { kind: "percent", value: 25, label: "25% off" }, combine: "stack" })} />);
  expect(container).toHaveTextContent("Original Amount:₨ 1,000");
  expect(container).toHaveTextContent("Offer discount (15%):- ₨ 150");
  expect(container).toHaveTextContent("Loyalty reward (25% off, on top):- ₨ 250");
  expect(container).toHaveTextContent("Total discount:- ₨ 400");
  expect(container).toHaveTextContent("Final Amount:₨ 600");
  rerender(<BillBreakdown bd={breakdownOf({ bill: 1000, offerPct: 15, reward: { kind: "percent", value: 25, label: "25% off" }, combine: "replace" })} />);
  expect(container).toHaveTextContent("Offer (15%):replaced by the reward");
  expect(container).toHaveTextContent("Final Amount:₨ 750");
  rerender(<BillBreakdown bd={breakdownOf({ bill: 1000, offerPct: 15, reward: { kind: "item", item: "a free chai" } })} />);
  expect(container).toHaveTextContent("Give:a free chai");
  expect(container).toHaveTextContent("Final Amount:₨ 850");
});

const program = (extra = {}) => ({ id: "p1", brand: "b1", status: "draft", version: 2, mode: "reward", tiers: [{ name: "Member", minVisit: 1, maxVisit: null, discountPct: 15 }], maxDiscountPct: 100, eligibleOfferIds: [], branchIds: [], maxVisitsPerDay: 1, resetMonths: 12, terms: "", startsAt: null, endsAt: null, reward: { visitsNeeded: 3, kind: "percent", value: 60, label: "60% off", combine: "stack", maxPerStudent: null, maxPerMonth: null }, brandMaxDiscountPct: 25, adminMaxDiscountPct: null, ...extra });

test("brand form: quick picks 1, 2, 3, 5, 10; 0 and 11 refused; 60% accepted with no cap; 'on top' / 'replace' sent; no 'maximum discount' field", async () => {
  loyaltyApi.flagsMe.mockResolvedValue({ loyaltyV2: true });
  loyaltyApi.myProgram.mockResolvedValue(program());
  loyaltyApi.analytics.mockResolvedValue(null);
  loyaltyApi.updateProgram.mockImplementation((id, body) => Promise.resolve({ ...program(), ...body, reward: { ...program().reward, ...body.reward } }));
  render(<BrandLoyalty />);
  const card = await screen.findByRole("region", { name: "stamp card" }).catch(() => null) || (await screen.findByText("stamp card")).closest("section");
  for (const n of ["1 visit", "2 visits", "3 visits", "5 visits", "10 visits"]) expect(within(card).getByRole("button", { name: n })).toBeInTheDocument();
  expect(screen.queryByLabelText("maximum discount %")).toBeNull();
  expect(screen.queryByText(/tdc maximum/)).toBeNull(); // no admin cap set: none shown
  expect(within(card).getByLabelText("% off (1 to 100)")).toHaveValue(60);
  const n = within(card).getByLabelText("visits for a reward (any number)");
  fireEvent.change(n, { target: { value: "11" } });
  expect(await screen.findByText("visits needed: 1 to 10")).toBeInTheDocument();
  fireEvent.change(n, { target: { value: "0" } });
  expect(await screen.findByText("visits needed: 1 to 10")).toBeInTheDocument();
  fireEvent.click(within(card).getByRole("button", { name: "1 visit" }));
  expect(screen.queryByText("visits needed: 1 to 10")).toBeNull();
  // the example on a PKR 1,000 bill with the first offer's 15%: on top → pays 250 (150 + 600 = 750 off)
  expect(card.querySelector("[data-example]")).toHaveTextContent("the student pays PKR 250 (PKR 750 off)");
  fireEvent.click(within(card).getByRole("button", { name: "replace the offer (use the bigger discount)" }));
  expect(card.querySelector("[data-example]")).toHaveTextContent("the student pays PKR 400 (PKR 600 off)");
  fireEvent.click(screen.getByRole("button", { name: /save changes|save draft|save/i }));
  await waitFor(() => expect(loyaltyApi.updateProgram).toHaveBeenCalled());
  const body = loyaltyApi.updateProgram.mock.calls.at(-1)[1];
  expect(body.reward).toMatchObject({ visitsNeeded: 1, kind: "percent", value: 60, combine: "replace" });
  expect("maxDiscountPct" in body).toBe(false);
});

test("brand form: tdc's maximum is shown only once one is set, and limits the %", async () => {
  loyaltyApi.flagsMe.mockResolvedValue({ loyaltyV2: true });
  loyaltyApi.myProgram.mockResolvedValue(program({ adminMaxDiscountPct: 30, reward: { visitsNeeded: 3, kind: "percent", value: 40, label: "30% off", combine: "stack" } }));
  loyaltyApi.analytics.mockResolvedValue(null);
  render(<BrandLoyalty />);
  expect(await screen.findByText("tdc maximum: 30%")).toBeInTheDocument();
  expect(screen.getByLabelText("% off (tdc's maximum for you: 30%)")).toBeInTheDocument();
  expect(await screen.findByText("% off: 1 to 30")).toBeInTheDocument();
});

test("members: rewards used with the amount saved", async () => {
  const m = { studentId: "s1", label: "tdc verified user", university: "", visits: 0, visitsNeeded: 1, rewardsEarned: 1, rewardsUsed: 1, rewardSavings: 250, rewardUses: [{ label: "25% off", bill: 1000, saved: 250, totalDiscount: 400 }], rewardReady: false, lastVisitAt: null };
  const load = jest.fn(() => Promise.resolve({ filter: "all", mode: "reward", totals: { members: 1, visitsThisMonth: 2, rewardsEarned: 1, rewardsUsed: 1, rewardSavings: 250 }, members: [m] }));
  render(<LoyaltyMembers load={load} loadCsv={jest.fn()} />);
  const box = await screen.findByTestId("loyalty-members");
  await waitFor(() => expect(within(box).getAllByText("PKR 250").length).toBe(2)); // the total and the row
  expect(within(box).getByText("last: 25% off on a PKR 1,000 bill")).toBeInTheDocument();
  const stat = [...box.querySelectorAll(".k-stat")].find((el) => el.querySelector(".k-stat-lbl")?.textContent === "saved with rewards");
  expect(stat).toHaveTextContent("PKR 250");
});
