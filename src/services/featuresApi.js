// src/services/featuresApi.js
// Features per account (server: routes/adminFeatures.routes.js), admins only. Every change needs a reason and is
// written to the admin action log. The server replies { success, data, requestId }; these return `data` and throw
// an Error with the message and code.
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

export const featuresApi = {
  // [{ flag, label, roles, killed, railway, railwayIdCount, adminAccessCount }]
  flags: () => unwrap(api.get("/admin/features/flags")),
  // { account: { id, role, name }, flags: [{ flag, label, killed, fromRailway, granted, effective, lastChange, students? }] }
  account: (id) => unwrap(api.get(`/admin/features/account/${id}`)),
  // { changed, before, after, state }
  set: (id, flag, enabled, reason) => unwrap(api.put(`/admin/features/account/${id}/${flag}`, { enabled, reason })),
  // { changed: [ids], unchanged: [ids], skipped: [{ id, why }] }; at most 500 ids per call
  bulk: ({ flag, enabled, accountIds, reason }) => unwrap(api.post("/admin/features/bulk", { flag, enabled, accountIds, reason })),
  // { flag, label, killed, railwayIdCount, total, offset, limit, accounts: [...] }
  list: (flag, { offset = 0, limit = 50 } = {}) => unwrap(api.get(`/admin/features/flag/${flag}`, { params: { offset, limit } })),
  // is it on the server yet? (admin menu item)
  available: () => api.get("/admin/features/flags").then(() => true).catch(() => false),
};

export default featuresApi;
