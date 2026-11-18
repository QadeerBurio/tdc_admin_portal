// src/services/universitiesApi.js — the shared university list (server: routes/university.routes.js and
// routes/adminUniversities.routes.js). Only admins add universities (students and brands pick).
//   loadUniversities()   the server's full list (A–Z) when it answers with one, else the bundled list
//                        (data/universities-pk.json, the server's HEC seed): the dropdowns are never empty
//   filterUniversities(list, q)  name, short name, other names (aliases) or city; case / spaces / dots don't matter
// Admin calls return `data` and throw an Error with the server's message and code.
import api from "./api";
import bundled from "../data/universities-pk.json";

const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
const sortAZ = (list) => list.slice().sort((a, b) => a.name.localeCompare(b.name));
export const bundledUniversities = sortAZ((bundled.universities || []).map((u) => ({ id: null, ...u, status: "approved", source: "bundled" })));

let memo = null;
const FRESH_MS = 60 * 1000; // an admin's addition shows within a minute
export async function loadUniversities({ force = false } = {}) {
  if (!force && memo && Date.now() - memo.at < FRESH_MS) return memo.list;
  try {
    const r = await api.get("/universities");
    const list = r?.data?.data;
    if (Array.isArray(list) && list.length) {
      memo = { list: sortAZ(list.map((u) => ({ ...u, aliases: u.aliases || [], source: "server" }))), at: Date.now() };
      return memo.list;
    }
  } catch {
    // offline / server trouble: the bundled list
  }
  return memo?.list || bundledUniversities;
}
export const resetUniversitiesCache = () => { memo = null; };

export function filterUniversities(list, q) {
  const words = norm(q).split(" ").filter(Boolean);
  if (!words.length) return list;
  const compact = words.join("");
  const out = [];
  for (const u of list) {
    const fields = [u.name, u.shortName, ...(u.aliases || []), u.city].map(norm);
    const squashed = fields.map((f) => f.replace(/ /g, ""));
    const all = fields.join(" ").split(" ");
    // best first: the exact name / short name / alias ("iobm", "karachi university"), then one that starts with it,
    // then the rest, A–Z
    const rank = squashed.some((f) => f === compact) ? 0 : squashed.some((f) => f.startsWith(compact)) ? 1
      : squashed.some((f) => f.includes(compact)) || words.every((w) => all.some((x) => x.startsWith(w))) ? 2 : -1;
    if (rank >= 0) out.push({ u, rank });
  }
  return out.sort((x, y) => x.rank - y.rank || x.u.name.localeCompare(y.u.name)).map((x) => x.u);
}

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
  // public: approved ones matching a search (the admin's merge / match pickers)
  search: (search = "", limit = 30) => unwrap(api.get("/universities", { params: { search, limit } })),
  // admin
  list: (params = {}) => unwrap(api.get(A, { params })),
  cities: () => unwrap(api.get(`${A}/cities`)),
  add: (body) => unwrap(api.post(A, body)),
  edit: (id, body) => unwrap(api.patch(`${A}/${id}`, body)),
  hide: (id, reason) => unwrap(api.post(`${A}/${id}/hide`, { reason })),
  show: (id) => unwrap(api.post(`${A}/${id}/show`, {})),
  merge: (fromId, toId) => unwrap(api.post(`${A}/merge`, { fromId, toId })),
  unmatched: () => unwrap(api.get(`${A}/unmatched`)),
  matchTo: (id, toId) => unwrap(api.post(`${A}/unmatched/${id}/match`, { toId })),
  addUnmatched: (id, body) => unwrap(api.post(`${A}/unmatched/${id}/add`, body)),
  // the menu item shows once the server answers
  available: () => api.get(`${A}/cities`).then(() => true).catch(() => false),
};

export const STATUS_LABEL = { approved: "shown", pending: "not shown (old request)", hidden: "hidden", unmatched: "unmatched (old name)" };
export const STATUS_TONE = { approved: "green", pending: "sand", hidden: "sand", unmatched: "orange" };
/** the name shown for a student: the shared list's, else the text they signed up with */
export const studentUniversity = (u) => u?.university?.name || u?.universityName || "";

export default universitiesApi;
