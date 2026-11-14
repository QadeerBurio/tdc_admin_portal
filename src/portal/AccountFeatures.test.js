import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountFeatures, { defaultOf, modeOf } from "./AccountFeatures";
import featuresApi from "../services/featuresApi";

jest.mock("../services/featuresApi", () => ({ __esModule: true, default: { account: jest.fn(), setState: jest.fn() } }));

const flag = (extra) => ({ flag: "loyaltyV2", label: "Loyalty", roles: ["brand", "student"], killed: false, forced: null, defaultForRole: null, fromRailway: false, source: "railway", effective: false, lastChange: null, ...extra });

test("defaultOf: the student default when set, else the Railway rules", () => {
  expect(defaultOf(flag({ defaultForRole: true }))).toEqual({ on: true, from: "the default for all students" });
  expect(defaultOf(flag({ defaultForRole: false, fromRailway: true }))).toEqual({ on: false, from: "the default for all students" });
  expect(defaultOf(flag({ fromRailway: true })).on).toBe(true);
  expect(defaultOf(flag({})).on).toBe(false);
});

test("modeOf: forced on / forced off / default", () => {
  expect(modeOf(flag({ forced: "on" }))).toBe("on");
  expect(modeOf(flag({ forced: "off" }))).toBe("off");
  expect(modeOf(flag({}))).toBe("default");
});

test("a student: default (on) from the student default; force off asks for a reason, then reset to default", async () => {
  featuresApi.account.mockResolvedValueOnce({ account: { id: "s1", role: "student", name: "Sana" }, flags: [flag({ defaultForRole: true, effective: true, source: "default" })] });
  render(<AccountFeatures accountId="s1" />);
  const def = await screen.findByLabelText("Loyalty: default (on)");
  expect(def).toBeChecked();
  expect(screen.getByText("on: default")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "reset Loyalty to default" })).toBeNull();

  featuresApi.setState.mockResolvedValueOnce({ changed: true });
  featuresApi.account.mockResolvedValueOnce({ account: { id: "s1", role: "student", name: "Sana" }, flags: [flag({ defaultForRole: true, forced: "off", effective: false, source: "account", lastChange: { enabled: false, reason: "abuse", setAt: "2026-11-12T00:00:00Z", setBy: { name: "Ayesha Admin" } } })] });
  fireEvent.click(screen.getByLabelText("Loyalty: forced off"));
  expect(await screen.findByText("force off: Loyalty")).toBeInTheDocument();
  fireEvent.change(document.getElementById("feature-reason"), { target: { value: "abuse report" } });
  fireEvent.click(screen.getByRole("button", { name: "force off" }));
  await waitFor(() => expect(featuresApi.setState).toHaveBeenCalledWith("s1", "loyaltyV2", "off", "abuse report"));
  expect(await screen.findByText("off: forced off")).toBeInTheDocument();
  expect(screen.getByLabelText("Loyalty: forced off")).toBeChecked();

  featuresApi.setState.mockResolvedValueOnce({ changed: true });
  featuresApi.account.mockResolvedValueOnce({ account: { id: "s1", role: "student", name: "Sana" }, flags: [flag({ defaultForRole: true, effective: true, source: "default" })] });
  fireEvent.click(screen.getByRole("button", { name: "reset Loyalty to default" }));
  fireEvent.change(document.getElementById("feature-reason"), { target: { value: "resolved" } });
  fireEvent.click(screen.getByRole("button", { name: "reset to default" }));
  await waitFor(() => expect(featuresApi.setState).toHaveBeenLastCalledWith("s1", "loyaltyV2", "default", "resolved"));
  expect(await screen.findByText("on: default")).toBeInTheDocument();
});

test("locked only by the kill switch: a Railway-listed account isn't locked", async () => {
  featuresApi.account.mockResolvedValueOnce({ account: { id: "b1", role: "brand", name: "Alpha" }, flags: [flag({ fromRailway: true, effective: true }), flag({ flag: "surplusBoxes", label: "Surprise Box", killed: true, source: "kill" })] });
  render(<AccountFeatures accountId="b1" />);
  const listed = await screen.findByLabelText("Loyalty: default (on)");
  expect(listed).not.toBeDisabled();
  expect(screen.getByLabelText("Surprise Box: forced on")).toBeDisabled();
  expect(screen.getByText(/kill switch \(off for everyone\)/)).toBeInTheDocument();
});

test("what the app sees: exactly the flags/me answer for this student, with 'check again'", async () => {
  const appView = { flags: { metaEvents: false, loyaltyV2: true, surplusBoxes: false }, at: "2026-11-14T10:00:00Z", loaded: true };
  featuresApi.account.mockResolvedValueOnce({ account: { id: "s9", role: "student", roleStored: false, name: "Old Student" }, flags: [flag({ defaultForRole: true, effective: true, source: "default" })], appView });
  render(<AccountFeatures accountId="s9" />);
  const section = await screen.findByTestId("app-view");
  expect(section).toHaveTextContent("what the app sees");
  expect(section).toHaveTextContent("This account has no stored role: the app treats it as a student.");
  const list = screen.getByRole("list", { name: "what the app sees" });
  expect(list.querySelector('[data-flag="loyaltyV2"]')).toHaveTextContent("Loyalty");
  expect(list.querySelector('[data-flag="loyaltyV2"]')).toHaveTextContent("on in the app");
  expect(list.querySelector('[data-flag="surplusBoxes"]')).toHaveTextContent("off in the app");
  featuresApi.account.mockResolvedValueOnce({ account: { id: "s9", role: "student", roleStored: false, name: "Old Student" }, flags: [flag({ defaultForRole: true, effective: true, source: "default" })], appView: { ...appView, flags: { ...appView.flags, surplusBoxes: true } } });
  fireEvent.click(screen.getByRole("button", { name: "check what the app sees again" }));
  await waitFor(() => expect(screen.getByRole("list", { name: "what the app sees" }).querySelector('[data-flag="surplusBoxes"]')).toHaveTextContent("on in the app"));
});
