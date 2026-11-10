// node --experimental-websocket a11y-ratings.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Accessibility of the ratings screens (rate the candidate in the drawer, the employer's own rating, admin
// ratings reports and its dialog): axe-core WCAG 2 A / AA, against the same mock API as ratings-ui-check.js.
// Prints every violation; exits 1 if there is any.
process.env.A11Y = "1";
require("./ratings-ui-check.js");
