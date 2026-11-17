// src/services/hiringAccessApi.js
// Free trial and hiring plans (server: routes/hiringAccess.routes.js, for every employer). The server replies
// { success, data, requestId }; these return `data` and throw an Error with the server's message, `code`, `status`
// and `field`. No payments anywhere: a plan is granted by tdc by hand.
import api from "./api";

const unwrap = (request) =>
  request
    .then((res) => res.data?.data)
    .catch((e) => {
      const body = e.response?.data || {};
      const { code, message, ...extra } = body.error || {};
      const err = new Error(message || body.message || e.message || "request failed");
      Object.assign(err, extra, { code, status: e.response?.status });
      throw err;
    });

export const hiringAccessApi = {
  // employer
  me: () => unwrap(api.get("/career/employers/me/hiring-access")),
  requestPlan: (body) => unwrap(api.post("/career/employers/me/plan-requests", body)),
  // admin
  overview: () => unwrap(api.get("/career/admin/hiring-plans")),
  grant: (employerId, body) => unwrap(api.post(`/career/admin/hiring-plans/${employerId}/grant`, body)),
  trial: (employerId, body) => unwrap(api.post(`/career/admin/hiring-plans/${employerId}/trial`, body)),
  decline: (id, body) => unwrap(api.post(`/career/admin/plan-requests/${id}/decline`, body)),
  // the admin menu item shows once the server answers
  adminAvailable: () => api.get("/career/admin/hiring-plans").then(() => true).catch(() => false),
};

export const pkDay = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium" }) : "–");
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** one line about where the employer stands (shared by the banner and the admin page) */
export function accessSummary(d) {
  if (!d) return { title: "", text: "", tone: "sand", status: "unknown" };
  const t = d.trial;
  const plan = d.plan;
  if (plan && plan.status === "active") {
    const left = plan.jobsLeft == null ? "any number of job posts" : `${plural(plan.jobsLeft, "job post")} left`;
    return { status: "plan", tone: "blue", title: "hiring plan", text: `${left}${plan.validUntil ? ` · valid until ${pkDay(plan.validUntil)}` : ""}` };
  }
  if (t.status === "active") {
    const hire = t.freeHireUsed ? "free hire used" : "free hire not used yet";
    const days = t.clockStarted ? `${plural(t.daysLeft, "day")} left` : `your ${t.days} days start with your first job`;
    return { status: "trial", tone: "green", title: "free trial", text: `${days} · ${hire}${t.extendedUntil ? ` · extended by tdc until ${pkDay(t.extendedUntil)}` : ""}` };
  }
  const why = plan?.status === "used_up" ? `all ${plural(plan.jobsGranted, "job post")} of your plan are used` : plan?.status === "expired" ? `your plan ended on ${pkDay(plan.validUntil)}` : t.detail;
  const title = plan?.status === "used_up" ? "your plan is used up" : plan?.status === "expired" ? "your plan has ended" : t.label;
  return { status: "locked", tone: "orange", title, text: why ? `${why}.` : "" };
}

export default hiringAccessApi;
