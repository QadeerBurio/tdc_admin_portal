// src/services/loyaltyApi.js
// Brand loyalty (server: routes/loyalty.routes.js, behind FLAG_LOYALTY_V2). The server replies
// { success, data, requestId }; these calls return `data` and throw an Error carrying the server's
// message, `code` and `status`. Uses the shared client (src/services/api.js) for the token and base URL.
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

export const loyaltyApi = {
  // { metaEvents, loyaltyV2, ... } for the signed-in user
  flagsMe: () => api.get("/app/flags/me").then((r) => r.data || {}),

  // brand
  myProgram: () => unwrap(api.get("/loyalty/programs/mine")),
  createProgram: (body) => unwrap(api.post("/loyalty/programs", body)),
  updateProgram: (id, body) => unwrap(api.patch(`/loyalty/programs/${id}`, body)),
  // an ended program becomes a draft at a new version; visits from before never count again
  restartProgram: (id, body) => unwrap(api.post(`/loyalty/programs/${id}/restart`, body)),
  analytics: (params) => unwrap(api.get("/loyalty/brands/me/analytics", { params })),
  // the tier and % for this student's visit, before confirming the bill
  quote: ({ studentId, offerId, branchId }) => unwrap(api.post("/loyalty/quotes", { studentId, offerId, branchId })),
  // stamp card: apply a student's waiting reward (once; the key makes a retry safe)
  useReward: (rewardId, body = {}, key) => unwrap(api.post(`/loyalty/rewards/${rewardId}/use`, body, { headers: { "Idempotency-Key": key } })),

  // admin
  brandProgram: (brandId) => unwrap(api.get(`/loyalty/brands/${brandId}/program`)),
  adminLedger: (params) => unwrap(api.get("/loyalty/admin/ledger", { params })),
  adminReverse: ({ redemptionId, reason }) => unwrap(api.post("/loyalty/admin/reverse", { redemptionId, reason })),
  // admin: every brand's program (writes need a reason and are logged on the server)
  adminPrograms: (params) => unwrap(api.get("/loyalty/admin/programs", { params })),
  adminProgram: (id) => unwrap(api.get(`/loyalty/admin/programs/${id}`)),
  adminCreateProgram: (body) => unwrap(api.post("/loyalty/admin/programs", body)),
  adminUpdateProgram: (id, body) => unwrap(api.patch(`/loyalty/admin/programs/${id}`, body)),
  adminRestartProgram: (id, body) => unwrap(api.post(`/loyalty/admin/programs/${id}/restart`, body)),
  adminProgramsAvailable: () => api.get("/loyalty/admin/programs").then(() => true).catch(() => false),
};

export default loyaltyApi;
