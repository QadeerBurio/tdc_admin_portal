// Phase A (A-8): an admin from a new device enters an e-mailed code; an ended session says why; the invitation page.
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import SignIn from "./SignIn";
import AcceptInvite from "./AcceptInvite";

const mockNavigate = jest.fn();
let mockSearch = "";
jest.mock("react-router-dom", () => ({ useNavigate: () => mockNavigate, useLocation: () => ({ search: mockSearch }), Link: ({ to, children, ...p }) => require("react").createElement("a", { href: to, ...p }, children) }), { virtual: true });
jest.mock("axios", () => ({ __esModule: true, default: { post: jest.fn(), defaults: { headers: { common: {} } } } }));
jest.mock("../services/api", () => ({ __esModule: true, default: { get: jest.fn() } })); // via portal/adminAccess (deviceId)
jest.mock("../web/site", () => ({ Logo: () => null, LINKS: { getApp: "#", hello: "x@y" }, pageTitle: (t) => t }));

const setToken = jest.fn(); const setUser = jest.fn();
const renderSignIn = () => render(<AuthContext.Provider value={{ setToken, setUser }}><SignIn /></AuthContext.Provider>);
const fill = () => {
  fireEvent.change(screen.getByLabelText("email"), { target: { value: "sara@tdc.test" } });
  fireEvent.change(screen.getByLabelText("password"), { target: { value: "Admin#Pass9" } });
  fireEvent.click(screen.getByRole("button", { name: "log in" }));
};
beforeEach(() => { jest.resetAllMocks(); sessionStorage.clear(); localStorage.clear(); });

test("login sends this browser's device id (in the body: no new header); a token signs in as before", async () => {
  axios.post.mockResolvedValue({ data: { token: "t", user: { role: "admin" } } });
  renderSignIn(); fill();
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/admin"));
  expect(axios.post.mock.calls[0][1].deviceId).toMatch(/^[0-9a-f]{36}$/);
  expect(axios.post.mock.calls[0][2]).toBeUndefined();
  expect(setToken).toHaveBeenCalledWith("t");
});

test("a new device: the code step, then the session token", async () => {
  axios.post.mockResolvedValueOnce({ data: { requiresAdminCode: true, sessionId: "s1", email: "sa••@tdc.test", message: "we e-mailed you a 6-digit code." } });
  renderSignIn(); fill();
  expect(await screen.findByText("check your e-mail")).toBeInTheDocument();
  expect(screen.getByText(/sa••@tdc.test/)).toBeInTheDocument();
  axios.post.mockResolvedValueOnce({ data: { token: "t2", user: { role: "admin" } } });
  fireEvent.change(screen.getByLabelText("sign-in code"), { target: { value: "12a3456" } });
  expect(screen.getByLabelText("sign-in code").value).toBe("123456");
  fireEvent.click(screen.getByRole("button", { name: "sign in" }));
  await waitFor(() => expect(setToken).toHaveBeenCalledWith("t2"));
  expect(axios.post.mock.calls[1][1]).toEqual({ sessionId: "s1", code: "123456", deviceId: expect.stringMatching(/^[0-9a-f]{36}$/) });
});

test("a wrong code shows the server's message", async () => {
  axios.post.mockResolvedValueOnce({ data: { requiresAdminCode: true, sessionId: "s1", email: "x" } });
  renderSignIn(); fill();
  await screen.findByText("check your e-mail");
  axios.post.mockRejectedValueOnce({ response: { data: { message: "wrong code. 4 tries left." } } });
  fireEvent.change(screen.getByLabelText("sign-in code"), { target: { value: "000000" } });
  fireEvent.click(screen.getByRole("button", { name: "sign in" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("wrong code. 4 tries left.");
});

test("signed out after 12 hours: the sign-in page says why, once", () => {
  sessionStorage.setItem("tdc.signoutReason", "you were signed out after 12 hours without activity. sign in again.");
  renderSignIn();
  expect(screen.getByRole("status")).toHaveTextContent("12 hours");
  expect(sessionStorage.getItem("tdc.signoutReason")).toBeNull();
});

test("the invitation page: matching passwords of 8+ characters, then 'sign in'", async () => {
  mockSearch = `?token=${"a".repeat(64)}`;
  axios.post.mockResolvedValue({ data: { success: true } });
  render(<AcceptInvite />);
  fireEvent.change(screen.getByLabelText("password"), { target: { value: "short" } });
  fireEvent.change(screen.getByLabelText("the same again"), { target: { value: "short" } });
  fireEvent.click(screen.getByRole("button", { name: "set password" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("at least 8");
  fireEvent.change(screen.getByLabelText("password"), { target: { value: "Nia#Pass99" } });
  fireEvent.change(screen.getByLabelText("the same again"), { target: { value: "Nia#Pass99" } });
  fireEvent.click(screen.getByRole("button", { name: "set password" }));
  expect(await screen.findByText("your password is set.")).toBeInTheDocument();
  expect(axios.post.mock.calls[0][1]).toEqual({ token: "a".repeat(64), password: "Nia#Pass99" });
});
