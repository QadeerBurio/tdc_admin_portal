// Press and partners on /founder and the home page "featured in" strip: every outlet and its links, new tab with
// rel="noopener", alt text on every logo, a text fallback when a logo file is missing, no em dashes in the copy.
import React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";

jest.mock("react-router-dom", () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }), { virtual: true });
jest.mock("../../web/assets/founder-msb.jpg", () => "founder-msb.jpg", { virtual: true });
// eslint-disable-next-line import/first
import Founder from "./Founder";
// eslint-disable-next-line import/first
import { FeaturedIn, PRESS, PARTNERS } from "../../web/site";

const OUTLETS = ["Express Tribune", "Verified Pakistan", "Clap Pakistan", "The Financial Daily International"];
const URLS = [
  "https://www.instagram.com/p/Df1_QhXkeTn/",
  "https://www.linkedin.com/posts/verifiedpakistanvp_during-a-hiring-drive-pakistani-entrepreneur-activity-7528713799072161792-nKX0",
  "https://www.instagram.com/p/DfzMslugQXu/",
  "https://clappakistan.com/why-are-fresh-graduates-struggling-to-get-their-first-interview-majid-shah-bukhari-is-investing-in-a-different-approach/",
  "https://thefinancialdaily.com/degrees-without-skills-majid-shah-calls-out-pakistans-broken-talent-pipeline/",
  "https://zu.edu.pk/mou-with-the-deft-crew/",
];

beforeAll(() => {
  window.scrollTo = () => {};
  delete window.IntersectionObserver;
});

const external = (c) => [...c.querySelectorAll("a")].filter((a) => /^https?:/.test(a.getAttribute("href")));
const expectNewTab = (links) => links.forEach((a) => {
  expect(a).toHaveAttribute("target", "_blank");
  expect(a.getAttribute("rel")).toContain("noopener");
  expect(a.textContent).toContain("(opens in a new tab)");
});

test("the four new outlets come first, then the earlier coverage", () => {
  expect(PRESS.slice(0, 4).map((p) => p.outlet)).toEqual(OUTLETS);
  expect(PARTNERS.map((p) => p.name)).toEqual(["Ziauddin University"]);
});

test("home strip: a logo per outlet, the Ziauddin partner row and a link to /founder", () => {
  const { container } = render(<FeaturedIn withPartners />);
  expect(screen.getByRole("heading", { name: "featured in" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "university partners" })).toBeInTheDocument();
  OUTLETS.forEach((o) => expect(screen.getByAltText(`${o} logo`)).toBeInTheDocument());
  expect(screen.getByAltText("Ziauddin University logo")).toBeInTheDocument();
  container.querySelectorAll("img").forEach((img) => expect(img.getAttribute("alt")).toBeTruthy());
  expect(screen.getByRole("link", { name: /read the story/ })).toHaveAttribute("href", "/founder");
  const hrefs = external(container).map((a) => a.getAttribute("href"));
  expect(hrefs).toEqual(expect.arrayContaining([URLS[0], URLS[1], URLS[3], URLS[4], URLS[5]]));
  expectNewTab(external(container));
});

test("a missing logo file falls back to the outlet name, never a broken image", () => {
  render(<FeaturedIn />);
  fireEvent.error(screen.getByAltText("Express Tribune logo"));
  expect(screen.queryByAltText("Express Tribune logo")).not.toBeInTheDocument();
  expect(screen.getByText("Express Tribune")).toBeInTheDocument();
});

test("/founder: a card per outlet with its stories, and a partners section with Ziauddin", () => {
  const { container } = render(<Founder />);
  const featured = screen.getByRole("region", { name: /featured in/ });
  OUTLETS.forEach((o) => {
    const card = within(featured).getByRole("heading", { name: o, level: 3 }).closest("article");
    expect(within(card).getByAltText(`${o} logo`)).toBeInTheDocument();
  });
  expect(within(featured).getByRole("link", { name: /Why are fresh graduates struggling to get their first interview\? Majid Shah Bukhari is investing in a different approach/ })).toHaveAttribute("href", URLS[3]);
  expect(within(featured).getByRole("link", { name: /Degrees Without Skills: Majid Shah calls out Pakistan's broken talent pipeline/ })).toHaveAttribute("href", URLS[4]);
  const partners = screen.getByRole("region", { name: /partners/ });
  expect(within(partners).getByAltText("Ziauddin University logo")).toBeInTheDocument();
  expect(within(partners).getByRole("link", { name: /MoU signed with The Deft Crew/ })).toHaveAttribute("href", URLS[5]);
  URLS.forEach((u) => expect(container.querySelector(`a[href="${u}"]`)).not.toBeNull());
  expectNewTab(external(featured));
  expectNewTab(external(partners));
  container.querySelectorAll("img").forEach((img) => expect(img.getAttribute("alt")).toBeTruthy());
  expect(container.textContent).not.toMatch(/—/);
});
