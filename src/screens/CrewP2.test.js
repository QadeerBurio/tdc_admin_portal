// P2 ambassador programme in the portal: crew inbox (moments, application details, a note to the student),
// credentials (draft letters written and approved by an admin, PDF preview, verify link), partners (university filter,
// verified invites), the public /verify/:id page and the web /ambassador page (apply in the app only when the server
// says so; the mail form otherwise).
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { crewApi, crewPublicApi } from "../services/api";
import CrewInbox from "./CrewInbox";
import CrewCredentials, { VERIFY_BASE } from "./CrewCredentials";
import CrewPartners from "./CrewPartners";
import VerifyCredential from "./VerifyCredential";
import Ambassador from "./Ambassador";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: {},
  crewApi: { inbox: jest.fn(), reviewPost: jest.fn(), reviewApplication: jest.fn(), credentials: jest.fn(), issueCredential: jest.fn(), revokeCredential: jest.fn(), updateCredential: jest.fn(), approveCredential: jest.fn(), credentialPdf: jest.fn(), partners: jest.fn(), addPartner: jest.fn(), removePartner: jest.fn() },
  crewPublicApi: { verify: jest.fn(), config: jest.fn() },
}));
let mockId = "64b000000000000000000001";
jest.mock("react-router-dom", () => ({ useParams: () => ({ id: mockId }), Link: ({ children }) => children }), { virtual: true });
jest.mock("../web/site", () => ({
  WebNav: () => null, WebFooter: () => null, IconTile: () => null, ICONS: {},
  pageTitle: (n) => `tdc. ${n}`,
  LINKS: { hr: "hr@gettdc.pk", playStore: "https://play.google.com/store/apps/details?id=com.aqkhan110.tdc", appStore: "https://apps.apple.com/pk/app/the-deft-crew/id6765877675" },
}));
jest.mock("../portal/kit", () => ({ Modal: ({ title, children, footer }) => (<div role="dialog" aria-label={title}>{children}{footer}</div>) }));

beforeEach(() => {
  jest.resetAllMocks();
  window.confirm = jest.fn(() => true);
  window.alert = jest.fn();
  window.scrollTo = jest.fn();
});

test("inbox: a campus moment shows its photo and caption", async () => {
  crewApi.inbox.mockResolvedValue([{ _id: "p1", kind: "post", postKind: "moment", caption: "tdc stall at the NED fair", imageUrl: "https://res.cloudinary.com/x/a.jpg", summary: "campus moment", user: { name: "Sana" }, createdAt: "2026-11-20T10:00:00Z" }]);
  crewApi.reviewPost.mockResolvedValue({});
  render(<CrewInbox />);
  expect(await screen.findByText("moment")).toBeInTheDocument();
  fireEvent.click(screen.getByText("review"));
  expect(screen.getByRole("dialog", { name: "Review Campus Moment" })).toBeInTheDocument();
  expect(screen.getByAltText("tdc stall at the NED fair")).toHaveAttribute("src", "https://res.cloudinary.com/x/a.jpg");
  expect(screen.getByText("tdc stall at the NED fair")).toBeInTheDocument();
  fireEvent.click(screen.getByText("approve"));
  await waitFor(() => expect(crewApi.reviewPost).toHaveBeenCalledWith("p1", "approved", "posted"));
});

test("inbox: an in-app application with chips, groups, source and a note to the student", async () => {
  crewApi.inbox.mockResolvedValue([{ _id: "a1", kind: "application", university: "NED University", handle: "sana", why: "i run ieee", whyChips: ["i run or help run a society"], groups: ["IEEE"], source: "app", appliedAt: "2026-11-20T10:00:00Z", summary: "partner application", user: { name: "Sana" }, createdAt: "2026-11-20T10:00:00Z" }]);
  crewApi.reviewApplication.mockResolvedValue({});
  render(<CrewInbox />);
  fireEvent.click(await screen.findByText("review"));
  expect(screen.getByText("i run or help run a society")).toBeInTheDocument();
  expect(screen.getByText("IEEE")).toBeInTheDocument();
  expect(screen.getByText("Sent from:").parentElement).toHaveTextContent(/Sent from: the app, /);
  fireEvent.change(screen.getByLabelText(/note to the student/), { target: { value: "  tell us more  " } });
  fireEvent.click(screen.getByText("reject"));
  await waitFor(() => expect(crewApi.reviewApplication).toHaveBeenCalledWith("a1", "rejected", "tell us more"));
});

test("inbox: an older link post and application look as before (no note sent when empty)", async () => {
  crewApi.inbox.mockResolvedValue([{ _id: "a2", kind: "application", university: "LUMS", why: "web form", summary: "partner application", user: { name: "Omar" }, createdAt: "2026-11-01T10:00:00Z" }]);
  crewApi.reviewApplication.mockResolvedValue({});
  render(<CrewInbox />);
  fireEvent.click(await screen.findByText("review"));
  expect(screen.getByText("web form")).toBeInTheDocument();
  fireEvent.click(screen.getByText("approve"));
  await waitFor(() => expect(crewApi.reviewApplication).toHaveBeenCalledWith("a2", "approved", ""));
});

test("credentials: a draft letter is written, saved and approved; issued ones link to their verify page", async () => {
  crewApi.credentials.mockResolvedValue([
    { _id: "c1", type: "recommendation", status: "draft", letterText: "", user: { name: "Sana" } },
    { _id: "c2", type: "certificate", status: "issued", issuedAt: "2026-11-20T10:00:00Z", user: { name: "Ali" } },
  ]);
  crewApi.updateCredential.mockResolvedValue({});
  crewApi.approveCredential.mockResolvedValue({});
  render(<CrewCredentials />);
  expect(await screen.findByText("draft")).toBeInTheDocument();
  expect(screen.getByText("verify page")).toHaveAttribute("href", `${VERIFY_BASE}c2`);
  expect(screen.getAllByText("pdf")).toHaveLength(1); // the empty draft has no pdf yet
  fireEvent.click(screen.getByText("write letter"));
  const approve = screen.getByText("approve & issue");
  expect(approve).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Letter text"), { target: { value: "Sana led the NED chapter." } });
  fireEvent.click(screen.getByText("approve & issue"));
  await waitFor(() => expect(crewApi.approveCredential).toHaveBeenCalledWith("c1"));
  expect(crewApi.updateCredential).toHaveBeenCalledWith("c1", { letterText: "Sana led the NED chapter." });
});

test("credentials: the pdf preview opens the server's file", async () => {
  crewApi.credentials.mockResolvedValue([{ _id: "c2", type: "certificate", status: "issued", issuedAt: "2026-11-20T10:00:00Z", user: { name: "Ali" } }]);
  crewApi.credentialPdf.mockResolvedValue(new Blob(["%PDF"], { type: "application/pdf" }));
  window.open = jest.fn();
  URL.createObjectURL = jest.fn(() => "blob:x");
  URL.revokeObjectURL = jest.fn();
  render(<CrewCredentials />);
  fireEvent.click(await screen.findByText("pdf"));
  await waitFor(() => expect(window.open).toHaveBeenCalledWith("blob:x", "_blank", "noopener"));
  expect(crewApi.credentialPdf).toHaveBeenCalledWith("c2");
});

test("partners: filter by university; verified invites per ambassador", async () => {
  crewApi.partners.mockResolvedValue([{ _id: "p1", user: { _id: "u1", name: "Sana" }, partner: { type: "ambassador" }, points: { lifetime: 10 }, stats: { sortedPercent: 50, referralsCredited: 4, verified: 3, verifiedThisMonth: 1 } }]);
  render(<CrewPartners />);
  expect(await screen.findByText("3 (1)")).toBeInTheDocument();
  expect(crewApi.partners).toHaveBeenCalledWith(undefined);
  fireEvent.change(screen.getByLabelText("university"), { target: { value: " NED University " } });
  fireEvent.click(screen.getByText("filter"));
  await waitFor(() => expect(crewApi.partners).toHaveBeenLastCalledWith({ university: "NED University" }));
});

test("verify page: a valid credential shows only the public facts", async () => {
  crewPublicApi.verify.mockResolvedValue({ id: mockId, type: "certificate", name: "Sana Malik", role: "campus ambassador", university: "NED University", since: "2026-09-01T00:00:00Z", issuedAt: "2026-11-20T00:00:00Z", status: "valid", revokedAt: null });
  render(<VerifyCredential />);
  expect(await screen.findByText("Sana Malik")).toBeInTheDocument();
  expect(screen.getByText("valid")).toBeInTheDocument();
  expect(screen.getByText("campus ambassador, NED University")).toBeInTheDocument();
  expect(crewPublicApi.verify).toHaveBeenCalledWith(mockId);
});

test("verify page: revoked, not found and rate-limited", async () => {
  crewPublicApi.verify.mockResolvedValueOnce({ id: mockId, type: "certificate", name: "Ali", role: "campus ambassador", university: "", status: "revoked", revokedAt: "2026-11-21T00:00:00Z", issuedAt: "2026-11-01T00:00:00Z" });
  const { unmount } = render(<VerifyCredential />);
  expect(await screen.findByText(/was revoked by tdc/)).toBeInTheDocument();
  expect(screen.getAllByText("revoked").length).toBeGreaterThan(0);
  unmount();
  crewPublicApi.verify.mockRejectedValueOnce({ response: { status: 404 } });
  const r2 = render(<VerifyCredential />);
  expect(await screen.findByRole("alert")).toHaveTextContent("couldn't find a tdc credential");
  r2.unmount();
  crewPublicApi.verify.mockRejectedValueOnce({ response: { status: 429 } });
  render(<VerifyCredential />);
  expect(await screen.findByRole("alert")).toHaveTextContent("too many checks");
});

test("web /ambassador: the mail form as today unless the server says apply in the app", async () => {
  crewPublicApi.config.mockResolvedValue({ applyInApp: false });
  const { unmount } = render(<Ambassador />);
  await waitFor(() => expect(crewPublicApi.config).toHaveBeenCalled());
  expect(screen.getByText("apply now")).toBeInTheDocument();
  expect(screen.queryByTestId("apply-in-app")).toBeNull();
  unmount();
  crewPublicApi.config.mockRejectedValue(new Error("offline"));
  const r2 = render(<Ambassador />);
  await waitFor(() => expect(crewPublicApi.config).toHaveBeenCalledTimes(2));
  expect(screen.getByText("apply now")).toBeInTheDocument();
  r2.unmount();
  crewPublicApi.config.mockResolvedValue({ applyInApp: true });
  render(<Ambassador />);
  expect(await screen.findByTestId("apply-in-app")).toBeInTheDocument();
  expect(screen.getByText("get it on google play")).toHaveAttribute("href", "https://play.google.com/store/apps/details?id=com.aqkhan110.tdc");
  expect(screen.queryByText("apply now")).toBeNull();
});
