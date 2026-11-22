// src/services/safetyApi.js
// The confession Safety log (server: routes/adminSafety.routes.js, /api/admin/safety), admins only. The server replies
// { success, data }; these return `data` and throw an Error with the message and code.
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

export const safetyApi = {
  // tab: held | reported | resolved → { tab, items: [...] }
  queue: (tab) => unwrap(api.get("/admin/safety/queue", { params: { tab } })),
  // action: approve | remove | warn | suspend24h | suspend7d | ban
  resolve: (reportId, action, note) => unwrap(api.post(`/admin/safety/${reportId}/resolve`, { action, note })),
  // a held / hidden item without a report: approve | remove
  resolveHeld: (confessionId, action, note, commentId = null) => unwrap(api.post(`/admin/safety/confession/${confessionId}/resolve`, { action, note, commentId })),
  // who wrote it (logged, a reason is required)
  author: (reportId, reason) => unwrap(api.post(`/admin/safety/${reportId}/author`, { reason })),
  settings: () => unwrap(api.get("/admin/safety/settings")),
  saveSettings: (patch) => unwrap(api.put("/admin/safety/settings", patch)),
};

export default safetyApi;
