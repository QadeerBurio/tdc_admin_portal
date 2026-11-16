// The GET /api/analytics/admin/metrics reply the portal checks use (shape of services/analytics/adminMetrics.js).
// metrics(query) → { success, data, requestId }; the numbers change with the preset so a range switch is visible.
const DEF = (s) => `${s} (mock definition)`;
const m = (value, previous, definition, extra = {}) => ({ value, previous, change: previous == null ? null : { delta: value - previous, pct: previous ? Math.round(((value - previous) / previous) * 1000) / 10 : null }, definition, ...extra });
const snap = (value, definition) => ({ value, previous: null, change: null, definition, snapshot: true });
const day = (d) => new Date(d.getTime() + 5 * 3600e3).toISOString().slice(0, 10);

function metrics(q = {}) {
  const preset = q.preset || (q.from ? "custom" : "30d");
  const k = { today: 1, "7d": 7, "30d": 30, month: 16, custom: 5 }[preset] || 30;
  const to = q.to ? new Date(`${q.to}T12:00:00+05:00`) : new Date();
  const days = Array.from({ length: Math.min(k, 31) }, (_, i) => day(new Date(to.getTime() - (Math.min(k, 31) - 1 - i) * 864e5)));
  const data = {
    range: { preset, days: k, fromDay: q.from || days[0], toDay: q.to || days[days.length - 1] },
    previous: { fromDay: "2026-09-01", toDay: "2026-09-30" },
    timeZone: "Asia/Karachi",
    exclusions: { deleted: "accounts whose user record no longer exists", test: { configured: true, how: "Railway variables METRICS_TEST_EMAILS, METRICS_TEST_EMAIL_DOMAINS, METRICS_TEST_USER_IDS" } },
    groups: {
      students: { signups: m(12 * k, 10 * k, "student accounts created in the range (Karachi days), not deleted, not test accounts"), verified: snap(840, DEF("verified students")), active7: snap(310, DEF("active 7 days")), active30: snap(620, DEF("active 30 days")) },
      brands: { approvedBrands: snap(46, DEF("approved brands")), newlyApproved: m(2, 3, DEF("newly approved")), activeOffers: snap(118, DEF("live offers")), redemptions: m(9 * k, 9 * k, DEF("redemptions")), revenue: m(15400 * k, 16000 * k, DEF("revenue"), { unit: "PKR" }) },
      loyalty: { members: m(40, 32, DEF("members")), visits: m(66, 50, DEF("visits")), rewardsEarned: m(5, 2, DEF("rewards earned")), rewardsUsed: m(3, 3, DEF("rewards used")) },
      surpriseBox: { boxesListed: m(0, 0, DEF("boxes listed")), orders: m(0, 0, DEF("orders")), pickups: m(0, 0, DEF("pickups")), noShows: m(0, 0, DEF("no-shows")) },
      careers: { jobs: m(14, 9, DEF("jobs")), applications: m(4 * k, 5 * k, DEF("applications")), interviews: m(6, 4, DEF("interviews")), hires: m(2, 0, DEF("hires")) },
      engagement: { posts: m(80, 72, DEF("posts")), confessions: m(25, 30, DEF("confessions")), pushOpens: m(410, 380, DEF("push opens")) },
    },
    series: { signups: days.map((d, i) => ({ day: d, count: (i * 3) % 7 })), redemptions: days.map((d, i) => ({ day: d, count: (i * 5) % 4 })) },
    topBrands: [{ id: "b1", name: "Alpha Cafe", redemptions: 40 }, { id: "b2", name: "Crust Pizza", redemptions: 22 }],
    topUniversities: [{ id: "u1", name: "Uni One", activeStudents: 120 }],
    minCohort: 5,
    funnel: { applications: 30, shortlisted: 12, interviews: 6, offers: 3, hires: 2 },
    needsAction: { brandApprovals: 3, studentVerifications: 2, companyVerifications: 2, hireDisputes: null, ratingsReports: 0, failedPushes: 4 },
    users: { student: { active: 840, suspended: 12, includingSuspended: 852 }, brand: { active: 46, suspended: 0, includingSuspended: 46 }, employee: { active: 20, suspended: 1, includingSuspended: 21 }, traveler: { active: 5, suspended: 0, includingSuspended: 5 }, definition: "accounts now" },
  };
  return { success: true, data, requestId: "mock" };
}

module.exports = { metrics };
