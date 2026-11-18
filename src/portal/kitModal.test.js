import React, { useState } from "react";
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Modal, Drawer } from "./kit";

beforeEach(() => {
  window.scrollTo = jest.fn((x, y) => { window.scrollY = y; });
  window.scrollY = 0;
  document.body.removeAttribute("style");
});

function Harness({ drawer = false }) {
  const [open, setOpen] = useState(false);
  const C = drawer ? Drawer : Modal;
  return (
    <div>
      <button onClick={() => setOpen(true)}>open details</button>
      <C open={open} onClose={() => setOpen(false)} title="details" footer={<button>ok</button>}>
        <input aria-label="first field" />
        {Array.from({ length: 50 }, (_, i) => <p key={i}>row {i + 1}</p>)}
      </C>
    </div>
  );
}

test.each([["Modal", false], ["Drawer", true]])("%s: the page behind is pinned while open and comes back to the same place", async (_n, drawer) => {
  window.scrollY = 640;
  render(<Harness drawer={drawer} />);
  const opener = screen.getByRole("button", { name: "open details" });
  opener.focus();
  fireEvent.click(opener);
  expect(document.body.style.position).toBe("fixed");
  expect(document.body.style.top).toBe("-640px");
  expect(document.body.style.overflow).toBe("hidden");
  // header / body / footer: the body is the scrolling region, reachable by keyboard
  const dialog = screen.getByRole("dialog", { name: "details" });
  const body = dialog.querySelector("[data-kit-body]");
  expect(body).toHaveAttribute("tabindex", "0");
  expect(body).toHaveAttribute("role", "region");
  expect(dialog.querySelector(".k-modal-head")).toBeTruthy();
  expect(dialog.querySelector(".k-modal-foot")).toBeTruthy();
  await act(async () => { await new Promise((r) => setTimeout(r, 5)); });
  expect(screen.getByLabelText("first field")).toHaveFocus(); // focus moved inside
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.body.style.position).toBe("");
  expect(document.body.style.top).toBe("");
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 640);
  expect(opener).toHaveFocus(); // focus back to what opened it
});

test("keys scroll the body even when the focus is on the close button; typing in a field isn't hijacked", async () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "open details" }));
  const body = screen.getByRole("dialog").querySelector("[data-kit-body]");
  Object.defineProperty(body, "clientHeight", { value: 400, configurable: true });
  Object.defineProperty(body, "scrollHeight", { value: 3000, configurable: true });
  screen.getByRole("button", { name: "close" }).focus();
  fireEvent.keyDown(screen.getByRole("button", { name: "close" }), { key: "PageDown" });
  expect(body.scrollTop).toBe(360);
  fireEvent.keyDown(screen.getByRole("button", { name: "close" }), { key: "End" });
  expect(body.scrollTop).toBe(3000);
  fireEvent.keyDown(screen.getByRole("button", { name: "close" }), { key: "Home" });
  expect(body.scrollTop).toBe(0);
  fireEvent.keyDown(screen.getByLabelText("first field"), { key: "End" });
  expect(body.scrollTop).toBe(0);
});

test("Tab stays inside: from the last control back to the first, Shift+Tab the other way", () => {
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "open details" }));
  const dialog = screen.getByRole("dialog");
  const items = [...dialog.querySelectorAll("button, input, [tabindex='0']")];
  // jsdom has no layout: every element counts as visible for the trap
  items.forEach((el) => Object.defineProperty(el, "offsetParent", { value: dialog, configurable: true }));
  const last = items[items.length - 1];
  last.focus();
  fireEvent.keyDown(last, { key: "Tab" });
  expect(items[0]).toHaveFocus();
  fireEvent.keyDown(items[0], { key: "Tab", shiftKey: true });
  expect(last).toHaveFocus();
});

test("a confirm over a modal: Escape closes only the top one; the page stays pinned until the last one closes", () => {
  window.scrollY = 300;
  function Two() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(true);
    return (<>
      <Modal open={a} onClose={() => setA(false)} title="outer"><p>outer</p></Modal>
      <Modal open={b} onClose={() => setB(false)} title="inner"><p>inner</p></Modal>
    </>);
  }
  render(<Two />);
  expect(screen.getAllByRole("dialog")).toHaveLength(2);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog", { name: "inner" })).toBeNull();
  expect(screen.getByRole("dialog", { name: "outer" })).toBeInTheDocument();
  expect(document.body.style.position).toBe("fixed");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.body.style.position).toBe("");
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 300);
});

test("the CSS: fixed header / footer, a body that can be shorter than its content, 100dvh, full screen on a phone", () => {
  const css = fs.readFileSync(path.join(__dirname, "kit.css"), "utf8");
  expect(css).toMatch(/\.tdcp \.k-modal \{[^}]*max-height: calc\(100dvh - 32px\)/);
  expect(css).toMatch(/\.tdcp \.k-modal-body \{[^}]*flex: 1 1 auto;[^}]*min-height: 0;[^}]*overflow-y: auto;[^}]*overscroll-behavior: contain;[^}]*-webkit-overflow-scrolling: touch/);
  expect(css).toMatch(/\.tdcp \.k-modal-head \{ flex: none;/);
  expect(css).toMatch(/\.tdcp \.k-modal-foot \{ flex: none;/);
  expect(css).toMatch(/@media \(max-width: 600px\) \{[\s\S]*?\.tdcp \.k-modal[^{]*\{[^}]*height: 100dvh;[^}]*border-radius: 0;/);
});

test("every portal modal is the shared one: the Crew screens no longer build their own overlay", () => {
  for (const f of ["CrewCampaigns", "CrewCredentials", "CrewInbox", "CrewPartners"]) {
    const src = fs.readFileSync(path.join(__dirname, "..", "screens", `${f}.js`), "utf8");
    expect(src).toMatch(/import \{ Modal \} from '\.\.\/portal\/kit'/);
    expect(src).toMatch(/<Modal onClose=/);
    expect(src).not.toMatch(/position: 'fixed'/);
  }
});
