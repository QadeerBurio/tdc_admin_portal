import React from "react";
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import ChildSafetyStandards, { childSafetyEmail } from "./ChildSafetyStandards";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  NavLink: ({ to, children }) => <a href={to}>{children}</a>,
  useLocation: () => ({ pathname: "/child-safety" }),
}), { virtual: true });

beforeEach(() => jest.spyOn(window, "scrollTo").mockImplementation(() => {}));
afterEach(() => jest.restoreAllMocks());

test("shows the public standards, reporting instructions, and footer link without an account", () => {
  render(<ChildSafetyStandards />);
  expect(screen.getByRole("heading", { name: "tdc (The Deft Crew) Child Safety Standards" })).toBeInTheDocument();
  expect(screen.getByText(/tdc prohibits child sexual abuse/i)).toBeInTheDocument();
  expect(screen.getByText(/choose Report a safety concern/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Child Safety Standards" })).toHaveAttribute("href", "/child-safety");
  expect(screen.getByRole("heading", { name: "Child Safety Point of Contact" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "privacy@gettdc.pk" })).toHaveAttribute("href", "mailto:privacy@gettdc.pk");
});

test("email configuration preserves valid overrides and falls back to the approved contact", () => {
  expect(childSafetyEmail()).toBe("privacy@gettdc.pk");
  expect(childSafetyEmail("broken@example.org?subject=bad")).toBe("privacy@gettdc.pk");
  expect(childSafetyEmail(" alternate@example.org ")).toBe("alternate@example.org");
});

test("each role router has a standards route and Vercel serves the SPA on direct navigation", () => {
  const root = path.join(__dirname, "..", "..", "..");
  const navigation = fs.readFileSync(path.join(root, "src", "AppNavigator.js"), "utf8");
  const hosting = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  expect(navigation.match(/path="\/child-safety" element=\{<ChildSafetyStandards \/>\}/g)).toHaveLength(5);
  expect(hosting.rewrites.some(({ source, destination }) => new RegExp(`^${source}$`).test("/child-safety") && destination === "/index.html")).toBe(true);
});
