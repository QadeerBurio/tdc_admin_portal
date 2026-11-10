// src/services/adminActionsApi.js
// The unified admin action log (server: routes/adminActions.routes.js), read-only, admins only.
// The server replies { success, data, requestId }; these return `data` and throw an Error with the message and code.
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

export const adminActionsApi = {
  // { rows, next }: filters adminId, action ("loyalty.*" for a prefix), targetType, targetId, from, to, limit, before
  list: (params) => unwrap(api.get("/admin/actions", { params })),
  facets: () => unwrap(api.get("/admin/actions/facets")),
  // is the log on the server yet? (admin menu item)
  available: () => api.get("/admin/actions", { params: { limit: 1 } }).then(() => true).catch(() => false),
};

export default adminActionsApi;
