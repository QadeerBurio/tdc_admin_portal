// r11 (owner): the main features page says when "Launch: all v2 features" turns a flag on for students, next to the
// existing "default for all students"; the gettdc.pk link flags say they wait for "Launch: gettdc.pk links"; a flag
// no launch switch covers shows exactly as before.
import React from "react";
import { render, screen } from "@testing-library/react";
import AdminFeatures from "./AdminFeatures";
import featuresApi from "../services/featuresApi";

jest.mock("react-router-dom", () => ({ useNavigate: () => () => {} }), { virtual: true });
jest.mock("../services/featuresApi", () => ({ __esModule: true, default: { flags: jest.fn(), list: jest.fn(), setState: jest.fn(), setDefault: jest.fn() } }));

const base = (flag, label, extra) => ({ flag, label, roles: ["student"], killed: false, railway: "", railwayIdCount: 0, adminAccessCount: 0, forcedOffCount: 0, defaults: {}, launch: null, ...extra });
const FLAGS = [
  base("resumeV2", "Resume v2", { launch: { by: "launchV2", onForStudents: true } }),
  base("confessionShare", "Confession share card + link", { launch: { by: "launchLinks", onForStudents: false } }),
  base("confessionsVoting", "Confession voting (auto-hide only)"),
  base("launchV2", "Launch: all v2 features", { defaults: { student: { enabled: true, set: false } } }),
];

beforeEach(() => {
  featuresApi.list.mockResolvedValue({ accounts: [], total: 0 });
});

test("a launch-covered flag: 'on for students via Launch: all v2 features'", async () => {
  featuresApi.flags.mockResolvedValue(FLAGS);
  render(<AdminFeatures />);
  expect(await screen.findByText("on for students via Launch: all v2 features", {}, { timeout: 5000 })).toBeInTheDocument();
});

test("the students' launch default off: the card says so instead", async () => {
  featuresApi.flags.mockResolvedValue([base("resumeV2", "Resume v2", { launch: { by: "launchV2", onForStudents: false } })]);
  render(<AdminFeatures />);
  expect(await screen.findByText("Launch: all v2 features is off for students", {}, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.queryByText("on for students via Launch: all v2 features")).toBeNull();
});

test("a gettdc.pk link flag waits for Launch: gettdc.pk links; a flag no launch covers has no launch line", async () => {
  featuresApi.flags.mockResolvedValue([FLAGS[1], FLAGS[2]]);
  const { container, rerender } = render(<AdminFeatures />);
  expect(await screen.findByText("off: waits for Launch: gettdc.pk links", {}, { timeout: 5000 })).toBeInTheDocument();
  featuresApi.flags.mockResolvedValue([FLAGS[2]]);
  rerender(<AdminFeatures key="2" />);
  await screen.findAllByText("Confession voting (auto-hide only)", {}, { timeout: 5000 });
  expect(container.textContent).not.toMatch(/via Launch|waits for Launch/);
});
