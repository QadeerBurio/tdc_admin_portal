// src/services/trialApi.js
// First Hire Free (server: routes/careerTrial.routes.js, behind FLAG_EMPLOYER_FIRST_HIRE_FREE). The server
// replies { success, data, requestId }; these return `data` and throw an Error with the server's message,
// `code`, `status` and `field`. No prices anywhere: further hires are "pricing coming soon".
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

export const trialApi = {
  flagsMe: () => api.get("/app/flags/me").then((r) => r.data || {}),
  // employer
  trial: () => unwrap(api.get("/career/employers/me/trial")),
  submitVerification: (body) => unwrap(api.post("/career/employers/me/verification", body)),
  activate: () => unwrap(api.post("/career/employers/me/trial/activate", {})),
  summary: () => unwrap(api.get("/career/employers/me/trial/summary")),
  // admin
  verifications: (status = "pending") => unwrap(api.get("/career/admin/verifications", { params: { status } })),
  reviewVerification: (id, body) => unwrap(api.post(`/career/admin/verifications/${id}/review`, body)),
  trials: (status = "all") => unwrap(api.get("/career/admin/trials", { params: { status } })),
  reviewTrial: (id, body) => unwrap(api.post(`/career/admin/trials/${id}/review`, body)),
  billingEvents: (params = {}) => unwrap(api.get("/career/admin/billing-events", { params })),
  companyStatus: () => unwrap(api.get("/career/admin/employers/company-status")).catch(() => null),
  // the pilot is set up on the server (admin menu items)
  adminAvailable: () => api.get("/career/admin/verifications", { params: { status: "pending" } }).then(() => true).catch(() => false),
};

export const TRIAL_LABEL = { not_activated: "not activated", active: "active", used: "used", under_review: "under review" };
export const TRIAL_TONE = { not_activated: "sand", active: "green", used: "blue", under_review: "orange" };
export const VERIFICATION_LABEL = { pending: "being checked", approved: "verified", rejected: "not approved", duplicate_review: "being checked (possible duplicate)" };
export const VERIFICATION_TONE = { pending: "yellow", approved: "green", rejected: "red", duplicate_review: "orange" };
export const BILLING_LABEL = { free_hire_consumed: "free hire used", free_hire_restored: "free hire restored", hire_billable_pending_pricing: "hire (pricing pending)" };
export const pkDate = (iso) => (iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" }) : "–");

export default trialApi;
