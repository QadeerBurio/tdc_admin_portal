// src/services/careerApi.js
// Hiring timeline (server: routes/career.routes.js, behind FLAG_CAREER_TIMELINE). The server replies
// { success, data, requestId }; these return `data` and throw an Error with the server's message, `code`
// and `status`. Every write sends the version the screen last saw and a fresh Idempotency-Key, so a
// retried click can't write twice. Times: the portal works in Asia/Karachi; the server stores UTC.
import api from "./api";

const unwrap = (request) =>
  request
    .then((res) => res.data?.data)
    .catch((e) => {
      const body = e.response?.data || {};
      const err = new Error(body.error?.message || body.message || e.message || "request failed");
      err.code = body.error?.code;
      err.status = e.response?.status;
      err.extra = body.error || {};
      throw err;
    });

const key = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const post = (url, body) => unwrap(api.post(url, body, { headers: { "Idempotency-Key": key() } }));

// Karachi has no daylight saving: UTC+5 all year
export const KARACHI = "Asia/Karachi";
export const karachiToUtc = (local) => {
  // "2026-11-20T14:30" typed as Karachi time → ISO UTC
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(local || ""));
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 5, +m[5])).toISOString();
};
export const utcToKarachiInput = (iso) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5 * 3600e3);
  return d.toISOString().slice(0, 16);
};
export const inKarachi = (iso) => (iso ? new Date(iso).toLocaleString("en-GB", { timeZone: KARACHI, dateStyle: "medium", timeStyle: "short" }) : "–");

export const careerApi = {
  flagsMe: () => api.get("/app/flags/me").then((r) => r.data || {}),
  // employer
  pipeline: (jobId) => unwrap(api.get("/career/employers/me/applications", { params: jobId ? { jobId } : {} })),
  timeline: (applicationId) => unwrap(api.get(`/career/applications/${applicationId}/timeline`)),
  event: (applicationId, { type, version, note, internalNote }) => post(`/career/applications/${applicationId}/events`, { type, version, note, internalNote }),
  schedule: (body) => post("/career/interviews", body),
  reschedule: (id, body) => post(`/career/interviews/${id}/reschedule`, body),
  cancelInterview: (id, body) => post(`/career/interviews/${id}/cancel`, body),
  complete: (id, body) => post(`/career/interviews/${id}/complete`, body),
  sendOffer: (body) => post("/career/offers", body),
  withdrawOffer: (id, body) => post(`/career/offers/${id}/withdraw`, body),
  confirmHire: (id, body) => post(`/career/offers/${id}/confirm-hire`, body),
  employerAnalytics: (params) => unwrap(api.get("/career/employers/me/analytics", { params })),
  // my interviews (my own jobs only): ?jobId, ?status, ?from, ?to
  employerInterviews: (params) => unwrap(api.get("/career/employers/me/interviews", { params })),
  // candidate matching (FLAG_CAREER_MATCHING): one application's evidence; a job's estimates (?sort=newest|relevance)
  matchFor: (applicationId) => unwrap(api.get(`/career/matching/applications/${applicationId}`)),
  jobMatches: (jobId, sort = "newest") => unwrap(api.get(`/career/matching/jobs/${jobId}`, { params: { sort } })),
  // admin
  adminAnalytics: (params) => unwrap(api.get("/career/admin/analytics", { params })),
  // open hire disputes (admin); 404 when the hiring timeline isn't set up on the server
  adminDisputes: () => unwrap(api.get("/career/admin/disputes")),
  adminDisputesAvailable: () => api.get("/career/admin/disputes").then(() => true).catch(() => false),
  // hiring across employers, read-only (audited on the server; 404 unless the hiring timeline is set up)
  adminApplications: (params) => unwrap(api.get("/career/admin/applications", { params })),
  adminInterviews: (params) => unwrap(api.get("/career/admin/interviews", { params })),
  adminHires: (params) => unwrap(api.get("/career/admin/hires", { params })),
  adminOverviewAvailable: () => api.get("/career/admin/hires", { params: { limit: 1 } }).then(() => true).catch(() => false),
  // the calendar file, saved through the browser
  downloadIcs: async (interviewId) => {
    const res = await api.get(`/career/interviews/${interviewId}/ics`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-${interviewId}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export default careerApi;
