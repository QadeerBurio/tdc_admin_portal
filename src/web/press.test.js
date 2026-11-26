// "featured in" (feat/press-featured): the home page's logo strip and /founder's cards. The four new outlets (Express
// Tribune, Verified Pakistan, Clap Pakistan, The Financial Daily) link to their real sources in a new tab with rel="noopener"; each logo
// has the outlet's name as alt text and loads lazily; the home strip links to /founder ("read the story"); the
// founder page's meta description mentions the coverage; plain copy (lowercase "tdc", no em dashes, no "as seen on").
import React from "react";

beforeAll(() => { window.scrollTo = () => {}; });
import { render, screen, within } from "@testing-library/react";

jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>, NavLink: ({ to, children }) => <a href={to}>{children}</a>, useNavigate: () => jest.fn(), useLocation: () => ({ pathname: "/" }) }), { virtual: true });
jest.mock("./useOffers", () => ({ useOffers: () => ({ brands: [], loading: false, live: false }) }));
// eslint-disable-next-line import/first
import { FeaturedIn, PRESS, PARTNERS, pieceLine, logoPath } from "./site";
// eslint-disable-next-line import/first
import Founder, { FOUNDER_DESCRIPTION } from "../screens/roles/Founder";
// eslint-disable-next-line import/first
import Landing from "../screens/Landing";

const NEW = {
  "Express Tribune": ["https://www.instagram.com/p/Df1_QhXkeTn/"],
  "Verified Pakistan": ["https://www.linkedin.com/posts/verifiedpakistanvp_during-a-hiring-drive-pakistani-entrepreneur-activity-7528713799072161792-nKX0"],
  "Clap Pakistan": ["https://clappakistan.com/why-are-fresh-graduates-struggling-to-get-their-first-interview-majid-shah-bukhari-is-investing-in-a-different-approach/", "https://www.instagram.com/p/DfzMslugQXu/"],
  "The Financial Daily": ["https://thefinancialdaily.com/degrees-without-skills-majid-shah-calls-out-pakistans-broken-talent-pipeline/", "https://thefinancialdaily.com/64-of-nation-wasted-to-ignorance-the-talent-shortage-is-a-corporate-myth-majid-shah/", "https://thefinancialdaily.com/pakistans-youth-budget-grows-while-employment-stagnates-majid-shah/"],
};
const HEADLINE = "Why are fresh graduates struggling to get their first interview? Majid Shah Bukhari is investing in a different approach";
const external = (a) => a.getAttribute("target") === "_blank" && /\bnoopener\b/.test(a.getAttribute("rel") || "");

test("the press list: the four new outlets first, real links only, plain copy", () => {
  expect(PRESS.slice(0, 4).map((o) => o.outlet)).toEqual(Object.keys(NEW));
  for (const [outlet, hrefs] of Object.entries(NEW)) expect(PRESS.find((o) => o.outlet === outlet).pieces.map((p) => p.href)).toEqual(hrefs);
  const clap = PRESS.find((o) => o.outlet === "Clap Pakistan");
  expect(clap.pieces[0].headline).toBe(HEADLINE);
  expect(pieceLine(PRESS[0].pieces[0])).toBe("featured on Instagram");
  expect(pieceLine(PRESS[1].pieces[0])).toBe("featured on LinkedIn");
  const copy = JSON.stringify(PRESS) + FOUNDER_DESCRIPTION;
  expect(copy).not.toMatch(/—|–/);
  expect(copy).not.toMatch(/as seen on|as featured in/i);
  expect(copy).not.toMatch(/\bTDC\b|\bTdc\b/);
  expect(PRESS.every((o) => o.pieces.every((p) => /^https:\/\//.test(p.href)))).toBe(true);
});

test("home page: a slim \"featured in\" logo strip after the hero, each logo linking to its coverage, plus \"read the story\"", () => {
  render(<Landing />);
  const strip = document.querySelector('[data-press="strip"]');
  expect(strip).toBeTruthy();
  // after the hero (and its numbers)
  const hero = screen.getByRole("list", { name: "tdc in numbers" });
  expect(hero.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const list = within(strip).getByRole("list", { name: "featured in" });
  for (const [outlet, hrefs] of Object.entries(NEW)) {
    const img = within(list).getByAltText(outlet);
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img.getAttribute("height")).toBe("48");
    expect(Number(img.getAttribute("width"))).toBeGreaterThan(0);
    const a = img.closest("a");
    expect(a).toHaveAttribute("href", hrefs[0]);
    expect(external(a)).toBe(true);
    expect(a.getAttribute("aria-label")).toMatch(new RegExp(`^${outlet}: .*\\(opens in a new tab\\)$`));
  }
  expect(within(strip).getByRole("link", { name: /read the story/ })).toHaveAttribute("href", "/founder");
  expect(strip.textContent).not.toMatch(/as featured in|as seen on/i);
});

test("the strip without story: no founder link (the founder page itself doesn't use the strip)", () => {
  render(<FeaturedIn />);
  expect(screen.queryByRole("link", { name: /read the story/ })).toBeNull();
  expect(within(screen.getByRole("list", { name: "featured in" })).getAllByRole("link")).toHaveLength(PRESS.length);
});

test("founder page: a card per outlet with logo, name, one line and a read / view link; Clap Pakistan shows its headline", () => {
  render(<Founder />);
  const section = screen.getByRole("region", { name: "featured in" });
  const cards = within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
  expect(cards).toEqual(PRESS.map((o) => o.outlet));
  const card = (outlet) => within(section).getByRole("heading", { level: 3, name: outlet }).closest("li");
  const tribune = card("Express Tribune");
  expect(within(tribune).getByAltText("Express Tribune")).toHaveAttribute("loading", "lazy");
  expect(within(tribune).getByText("featured on Instagram")).toBeInTheDocument();
  let link = within(tribune).getByRole("link", { name: "Express Tribune: view on Instagram (opens in a new tab)" });
  expect(link).toHaveAttribute("href", NEW["Express Tribune"][0]);
  expect(external(link)).toBe(true);
  const verified = card("Verified Pakistan");
  expect(within(verified).getByAltText("Verified Pakistan")).toBeInTheDocument();
  expect(within(verified).getByText("featured on LinkedIn")).toBeInTheDocument();
  link = within(verified).getByRole("link", { name: "Verified Pakistan: view on LinkedIn (opens in a new tab)" });
  expect(link).toHaveAttribute("href", NEW["Verified Pakistan"][0]);
  expect(external(link)).toBe(true);
  const clap = card("Clap Pakistan");
  expect(within(clap).getByAltText("Clap Pakistan")).toBeInTheDocument();
  expect(within(clap).getByText(HEADLINE)).toBeInTheDocument();
  link = within(clap).getByRole("link", { name: `Clap Pakistan: read the article, ${HEADLINE} (opens in a new tab)` });
  expect(link).toHaveAttribute("href", NEW["Clap Pakistan"][0]);
  expect(link).toHaveTextContent("read the article");
  expect(external(link)).toBe(true);
  link = within(clap).getByRole("link", { name: "Clap Pakistan: view on Instagram (opens in a new tab)" });
  expect(link).toHaveAttribute("href", NEW["Clap Pakistan"][1]);
  expect(external(link)).toBe(true);
  const tfd = card("The Financial Daily");
  expect(within(tfd).getByAltText("The Financial Daily")).toHaveAttribute("loading", "lazy");
  expect(within(tfd).getByText("articles featuring Majid Shah Bukhari")).toBeInTheDocument();
  const titles = within(tfd).getAllByRole("link");
  expect(titles.map((x) => x.getAttribute("href"))).toEqual(NEW["The Financial Daily"]);
  expect(titles[0]).toHaveTextContent("Degrees without skills: Majid Shah calls out Pakistan's broken talent pipeline");
  expect(titles[1]).toHaveTextContent("64% of nation wasted to ignorance: the talent shortage is a corporate myth");
  expect(titles[0]).toHaveAccessibleName("The Financial Daily: Degrees without skills: Majid Shah calls out Pakistan's broken talent pipeline (opens in a new tab)");
  expect(titles.every(external)).toBe(true);
  expect(tfd.textContent).not.toMatch(/articles by/);
  // every link in the section opens in a new tab with noopener
  expect(within(section).getAllByRole("link").filter((a) => a.getAttribute("href").startsWith("http")).every(external)).toBe(true);
});

test("founder page: the meta description mentions the coverage, and is put back on leaving", () => {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", "description"); document.head.appendChild(meta); }
  meta.setAttribute("content", "tdc. the free app for students in Pakistan");
  const { unmount } = render(<Founder />);
  const now = document.querySelector('meta[name="description"]').getAttribute("content");
  expect(now).toBe(FOUNDER_DESCRIPTION);
  expect(now).toMatch(/featured in Express Tribune, Verified Pakistan, Clap Pakistan, The Financial Daily, /);
  unmount();
  expect(document.querySelector('meta[name="description"]').getAttribute("content")).toBe("tdc. the free app for students in Pakistan");
});

const ZU = "https://zu.edu.pk/mou-with-the-deft-crew/";
test("partners: a small \"university partners\" row on the home page, after \"featured in\"", () => {
  render(<Landing />);
  const strip = document.querySelector('[data-press="strip"]');
  const row = document.querySelector('[data-partners="row"]');
  expect(row).toBeTruthy();
  expect(strip.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const list = within(row).getByRole("list", { name: "university partners" });
  const img = within(list).getByAltText("Ziauddin University");
  expect(img).toHaveAttribute("loading", "lazy");
  const a = img.closest("a");
  expect(a).toHaveAttribute("href", ZU);
  expect(external(a)).toBe(true);
  expect(a).toHaveAccessibleName("Ziauddin University: read about the MoU (opens in a new tab)");
  // a partner, not press: not in the "featured in" strip
  expect(within(strip).queryByAltText("Ziauddin University")).toBeNull();
});

test("partners: a separate section on /founder after \"featured in\"; the story line reworded", () => {
  render(<Founder />);
  const featured = screen.getByRole("region", { name: "featured in" });
  const partners = screen.getByRole("region", { name: "partners" });
  expect(featured.compareDocumentPosition(partners) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(featured).queryByText("Ziauddin University")).toBeNull();
  const card = within(partners).getByRole("heading", { level: 3, name: "Ziauddin University" }).closest("li");
  expect(within(card).getByAltText("Ziauddin University")).toHaveAttribute("loading", "lazy");
  expect(within(card).getByText("MoU signed with The Deft Crew")).toBeInTheDocument();
  const a = within(card).getByRole("link", { name: "Ziauddin University: read about the MoU (opens in a new tab)" });
  expect(a).toHaveAttribute("href", ZU);
  expect(external(a)).toBe(true);
  expect(screen.getByText("his views on Pakistan's youth skills gap have been featured in The Financial Daily.")).toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/speaks and writes/);
});

// eslint-disable-next-line import/first
import fs from "fs";
// eslint-disable-next-line import/first
import path from "path";
test("every logo in the press and partner lists is committed in public/ (WebP and PNG fallback); the build checks it too", () => {
  const logos = [...PRESS.filter((o) => o.logo).map((o) => o.logo), ...PARTNERS.map((p) => p.logo)];
  expect(logos.map((l) => l.file)).toEqual(["express-tribune", "verified-pakistan", "clap-pakistan", "the-financial-daily", "hello-pakistan", "startup-pakistan", "ziauddin-university"]);
  const publicDir = path.join(__dirname, "..", "..", "public");
  for (const l of logos) {
    for (const ext of ["webp", "png"]) {
      const rel = logoPath(l, ext);
      expect(rel).toBe(`/press/logos/${l.file}.${ext}`);
      expect(fs.readdirSync(path.join(publicDir, "press", "logos"))).toContain(`${l.file}.${ext}`); // exact case
      expect(fs.statSync(path.join(publicDir, rel)).size).toBeGreaterThan(200);
    }
  }
  // the same check runs before every build (package.json "prebuild")
  const { check } = require("../../scripts/check-press-logos");
  expect(check().problems).toEqual([]);
  expect(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "package.json"), "utf8")).scripts.prebuild).toBe("node scripts/check-press-logos.js");
});

test("each logo is a <picture>: WebP first, the PNG as the img src", () => {
  render(<FeaturedIn />);
  const img = screen.getByAltText("Express Tribune");
  expect(img.parentElement.tagName).toBe("PICTURE");
  expect(img.parentElement.querySelector("source")).toHaveAttribute("srcset", "/press/logos/express-tribune.webp");
  expect(img.parentElement.querySelector("source")).toHaveAttribute("type", "image/webp");
  expect(img).toHaveAttribute("src", "/press/logos/express-tribune.png");
  expect(img).toHaveAttribute("width", "143");
});
