// /privacy (PR #8, brought up to date): the page says what the app does now (app main: anonymous Meta measurement
// by default, install at first open, Android advertising ID on with an opt-out, iPhone only after "continue" +
// Apple's Allow, hashed email / phone only after "continue", the two switches), and the footer links to it.
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";

jest.mock("react-router-dom", () => ({ Link: ({ to, children }) => <a href={to}>{children}</a>, NavLink: ({ to, children }) => <a href={to}>{children}</a>, useNavigate: () => jest.fn(), useLocation: () => ({ pathname: "/privacy" }) }), { virtual: true });
// eslint-disable-next-line import/first
import PrivacyPolicy from "./PrivacyPolicy";

test("the Meta section matches the app on main", () => {
  render(<PrivacyPolicy />);
  const text = document.body.textContent;
  expect(screen.getByRole("heading", { name: /privacy policy/i })).toBeInTheDocument();
  // the 17 Meta events, the same words as the app's Privacy Center (app/src/components/Privacy.js)
  expect(text).toContain("the install (counted when the app first connects), app opens, sign-up, finishing the app tour, offer claims, discounts redeemed, job applications, AI resumes, event registrations, scholarship applications, new posts, new confessions, likes and comments, AI chat use, travel assistant use, new skillshare listings and new skillshare offers");
  expect(text).not.toMatch(/counted the first time you open the app/);
  expect(text).toMatch(/so Meta can tell us which ads worked/);
  expect(text).toMatch(/on Android, your phone's advertising ID is included unless you turn off "ads with your details"/);
  expect(text).toMatch(/on iPhone, nothing that identifies you is shared unless you tap "continue" when the app asks and then choose Allow when Apple asks/);
  expect(text).toMatch(/your email and phone number are shared with Meta only after you tap "continue" \(on iPhone, also Apple's Allow\), and only hashed/);
  expect(text).toMatch(/"ad measurement" turns off everything the app shares with Meta; "ads with your details" turns off the advertising ID and the hashed email and phone/);
  // the old wording said email and phone are never shared: no longer true
  expect(text).not.toMatch(/never share your name, email, phone number/);
  expect(text).toMatch(/last updated 17 November 2026/);
});

test("the route and the footer link", () => {
  const nav = fs.readFileSync(path.join(__dirname, "..", "..", "AppNavigator.js"), "utf8");
  const site = fs.readFileSync(path.join(__dirname, "..", "..", "web", "site.js"), "utf8");
  expect(nav).toMatch(/<Route path="\/privacy" element={<PrivacyPolicy \/>} \/>/);
  expect(site).toMatch(/<Link to="\/privacy">privacy<\/Link>/);
});
