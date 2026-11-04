# Portal headless checks

Checks for the pilot pages of the portal: each page renders what it should, with no page or console errors, and
passes the axe-core WCAG 2 A / AA rules. They run in headless Chrome against a **mock API**, so they need no
server, no database, no network and no `.env`.

## Run everything (one command)

```
npm run check:portal
```

This builds the portal into a temp folder (1 to 3 minutes), with `REACT_APP_API_URL=http://127.0.0.1:5197` (the
mock API address), then runs all 13 checks one after another. It takes about 5 minutes in all, prints `PASS` or
`FAIL` for each check, and exits 1 if any check fails. A failed check prints its full output: missing text, page
errors, or each accessibility violation with the element it was found on.

Options (after `--`, e.g. `npm run check:portal -- --only analytics,a11y-analytics`):

| Option | Meaning |
|---|---|
| `--build <dir>` | reuse an existing build instead of building again. It must have been built with the same `REACT_APP_API_URL`. |
| `--only <names>` | run only these checks (names below, comma-separated) |
| `--verbose` | print the full output of passing checks too |

## Requirements

- **Node 20 or newer.** On Node 20–21 the runner adds `--experimental-websocket` itself.
- **Google Chrome or Chromium.** It is found in the usual install folders on Windows, macOS and Linux. Set
  `CHROME_PATH` if it is installed somewhere else.
- **The portal's own `node_modules`** (`npm install`). axe-core comes in with `react-scripts`, so nothing extra is
  installed.
- **Free local ports:** 5194, 5196 and 5197 (web and mock API), plus 9342–9406 (Chrome debugging). Checks run one at
  a time.

Browser profiles go to the system temp folder (`tdc-portal-checks-<port>`). Set `CDP_PROFILE_DIR` to put them
elsewhere.

## The checks

| Name | File | What it covers |
|---|---|---|
| `surplus` | `surplus-ui-check.js` | Surprise Box brand pages (today, listings, verify pickup) and admin cases |
| `first-hire-free` | `fhf-ui-check.js` | employer dashboard card and First Hire Free page, admin verifications, trials, billing ledger |
| `analytics` | `an-ui-check.js` | admin overview (every card, CSV export), brand insights, employer hiring results (no prices) |
| `resume-studio` | `studio-ui-check.js` | employer view of the tailored resume sent with an application, admin page |
| `career` | `career-ui-check.js` | employer candidate pipeline and drawer, admin hiring funnel |
| `loyalty` | `loyalty-ui-check.js` | brand loyalty page, verify page loyalty line, admin loyalty exceptions |
| `hire-disputes` | `disputes-ui-check.js` | admin hire disputes: hidden until the server answers, the list (no contact details), the review dialog, reason required, restore sends the right event |
| `a11y-surplus`, `a11y-first-hire-free`, `a11y-analytics`, `a11y-career`, `a11y-loyalty`, `a11y-hire-disputes` | `a11y-*.js` | axe-core WCAG 2 A / AA on the same pages and their open dialogs |

## How they work

`cdp.js` is a small Chrome DevTools Protocol driver; it uses no packages. Each check does the following:
1. serves the build on a local port;
2. starts its own mock API with the replies the page needs;
3. signs in by putting a user in `localStorage`;
4. opens the pages and clicks through them;
5. reads the page text (the functional checks) or runs axe (the `a11y-*` checks).

To run one check by hand:

```
node --experimental-websocket scripts/portal-checks/an-ui-check.js <buildDir>
```

## When a page changes

If a page's wording or its API reply changes, update that check's mock reply (the route table near the top of the
file) and its expected text (the `expect(...)` lines). A new pilot page needs a new check, plus an entry in
`CHECKS` in `run.js` and in the table above.
