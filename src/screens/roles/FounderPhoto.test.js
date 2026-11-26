// /founder hero photo (fix/founder-photo): WebP with a JPG fallback at 1x / 2x, loaded first (above the fold), its
// 4:5 box reserved (width / height), and CSS that keeps it 4:5 (height: auto: without it the height attribute wins).
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";

jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>, NavLink: ({ to, children }) => <a href={to}>{children}</a>, useNavigate: () => jest.fn(), useLocation: () => ({ pathname: "/founder" }) }), { virtual: true });
// eslint-disable-next-line import/first
import Founder from "./Founder";

beforeAll(() => { window.scrollTo = () => {}; });

test("the photo: <picture> with WebP 400w / 800w and a JPG fallback, eager, high priority, 4:5 box", () => {
  render(<Founder />);
  const img = screen.getByAltText("Majid Shah Bukhari, founder of tdc");
  expect(img).toHaveClass("founder-photo");
  expect(img.parentElement.tagName).toBe("PICTURE");
  const source = img.parentElement.querySelector("source");
  expect(source).toHaveAttribute("type", "image/webp");
  expect(source.getAttribute("srcset")).toMatch(/founder-msb-400\.webp 400w, .*founder-msb-800\.webp 800w/);
  expect(img.getAttribute("srcset")).toMatch(/founder-msb-400\.jpg 400w, .*founder-msb-800\.jpg 800w/);
  expect(img.getAttribute("src")).toMatch(/founder-msb-400\.jpg/);
  expect(img.getAttribute("sizes")).toBe(source.getAttribute("sizes"));
  expect(img).toHaveAttribute("loading", "eager");
  expect(img).toHaveAttribute("fetchpriority", "high");
  expect(Number(img.getAttribute("width")) / Number(img.getAttribute("height"))).toBe(0.8);
});

test("the CSS keeps it 4:5: height auto with aspect-ratio, cover, face-first position, card radius", () => {
  const css = fs.readFileSync(path.join(__dirname, "..", "..", "web", "web.css"), "utf8");
  const rule = css.match(/\.tdcw \.founder-photo \{([^}]*)\}/)[1];
  expect(rule).toMatch(/height: auto/);
  expect(rule).toMatch(/aspect-ratio: 4 \/ 5/);
  expect(rule).toMatch(/object-fit: cover/);
  expect(rule).toMatch(/object-position: 50% 22%/);
  expect(rule).toMatch(/border-radius: 22px/);
  // the 4:5 files exist at 1x and 2x
  for (const f of ["founder-msb-400.webp", "founder-msb-800.webp", "founder-msb-400.jpg", "founder-msb-800.jpg"]) {
    expect(fs.existsSync(path.join(__dirname, "..", "..", "web", "assets", f))).toBe(true);
  }
});
