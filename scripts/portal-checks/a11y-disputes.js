// node --experimental-websocket a11y-disputes.js <buildDir>    (or: node scripts/portal-checks/run.js)
// Accessibility of the admin hire disputes page (the list and the review dialog): axe-core WCAG 2 A / AA, against
// the same mock API as disputes-ui-check.js. Prints every violation; exits 1 if there is any.
process.env.A11Y = "1";
require("./disputes-ui-check.js");
