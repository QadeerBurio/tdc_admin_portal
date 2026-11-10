// src/services/ratingsApi.js
// Mutual ratings (server: routes/careerRatings.routes.js, FLAG_CAREER_RATINGS). Returns `data`; errors carry the
// server's message, `code` and `status` (404 RATINGS_OFF when ratings aren't on for this account).
import api from "./api";

const unwrap = (request) =>
  request
    .then((res) => res.data?.data)
    .catch((e) => {
      const body = e.response?.data || {};
      const err = new Error(body.error?.message || body.message || e.message || "request failed");
      err.code = body.error?.code;
      err.status = e.response?.status;
      throw err;
    });

const ratingsApi = {
  // the candidate or the job's employer: what they can rate on this application, and their own ratings
  forApplication: (applicationId) => unwrap(api.get(`/career/ratings/applications/${applicationId}`)),
  rate: (body) => unwrap(api.post("/career/ratings", body)),
  // ratings this account received (an employer: its average, and from 5 on the ratings anonymised)
  received: () => unwrap(api.get("/career/ratings/me/received")),
  report: (ratingId, reason) => unwrap(api.post(`/career/ratings/${ratingId}/report`, { reason })),
  // admin
  adminReports: (status = "open") => unwrap(api.get("/career/ratings/admin/reports", { params: { status } })),
  adminAvailable: () => api.get("/career/ratings/admin/reports").then(() => true).catch(() => false),
  decide: (reportId, body) => unwrap(api.post(`/career/ratings/admin/reports/${reportId}/decide`, body)),
};

export default ratingsApi;
