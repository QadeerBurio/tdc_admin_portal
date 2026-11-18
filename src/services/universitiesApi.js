// src/services/universitiesApi.js — the shared university list (server: routes/university.routes.js and
// routes/adminUniversities.routes.js). Admin calls return `data` and throw an Error with the server's message and code.
import api from "./api";

const unwrap = (request) =>
  request
    .then((res) => res.data?.data)
    .catch((e) => {
      const body = e.response?.data || {};
      const { code, message } = body.error || {};
      const err = new Error(message || body.message || e.message || "request failed");
      Object.assign(err, { code, status: e.response?.status });
      throw err;
    });

const A = "/admin/universities";
export const universitiesApi = {
  // public: the approved list (brand verification, filters)
  search: (search = "", limit = 30) => unwrap(api.get("/universities", { params: { search, limit } })),
  // admin
  list: (params = {}) => unwrap(api.get(A, { params })),
  pendingCount: () => unwrap(api.get(`${A}/pending-count`)).then((d) => (typeof d?.pending === "number" ? d.pending : null)),
  cities: () => unwrap(api.get(`${A}/cities`)),
  add: (body) => unwrap(api.post(A, body)),
  edit: (id, body) => unwrap(api.patch(`${A}/${id}`, body)),
  hide: (id, reason) => unwrap(api.post(`${A}/${id}/hide`, { reason })),
  show: (id) => unwrap(api.post(`${A}/${id}/show`, {})),
  approve: (id, body = {}) => unwrap(api.post(`${A}/${id}/approve`, body)),
  reject: (id, body) => unwrap(api.post(`${A}/${id}/reject`, body)),
  merge: (fromId, toId) => unwrap(api.post(`${A}/merge`, { fromId, toId })),
  unmatched: () => unwrap(api.get(`${A}/unmatched`)),
  matchTo: (id, toId) => unwrap(api.post(`${A}/unmatched/${id}/match`, { toId })),
  addUnmatched: (id, body) => unwrap(api.post(`${A}/unmatched/${id}/add`, body)),
  // the menu item shows once the server answers
  available: () => api.get(`${A}/pending-count`).then(() => true).catch(() => false),
};

export const STATUS_LABEL = { approved: "approved", pending: "pending request", hidden: "hidden", unmatched: "unmatched (old name)" };
export const STATUS_TONE = { approved: "green", pending: "yellow", hidden: "sand", unmatched: "orange" };
/** the name shown for a student: the shared list's, else the text they signed up with */
export const studentUniversity = (u) => u?.university?.name || u?.universityName || "";

export default universitiesApi;
