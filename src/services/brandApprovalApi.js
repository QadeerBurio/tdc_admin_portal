// src/services/brandApprovalApi.js
// Brand approvals (server: routes/brandApproval.routes.js). Each call returns the reply body; errors throw an
// Error with the server's message (and .code / .status).
import api from "./api";

const call = (request) =>
  request
    .then((res) => res.data)
    .catch((e) => {
      const body = e.response?.data || {};
      const err = new Error(body.message || body.error?.message || e.message || "request failed");
      err.code = body.code || body.error?.code;
      err.status = e.response?.status;
      throw err;
    });

export const brandApprovalApi = {
  // params: { q, status, city, category, joinedFrom, joinedTo, sort, page, limit }
  list: (params) => call(api.get("/brand-approval", { params })),
  detail: (id) => call(api.get(`/brand-approval/${id}`)),
  setStatus: (id, status, reason) => call(api.put(`/brand-approval/${id}/status`, { status, reason })),
  requestInfo: (id, reason) => call(api.post(`/brand-approval/${id}/request-info`, { reason })),
  bulk: (brandIds, status, reason) => call(api.put("/brand-approval/bulk-status", { brandIds, status, reason })),
};

export default brandApprovalApi;
