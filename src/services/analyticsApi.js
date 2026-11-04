// src/services/analyticsApi.js
// Business analytics (server: routes/analytics.routes.js): read-only figures from authoritative records.
// The server replies { success, data, requestId }; these return `data` and throw an Error with the message.
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

export const analyticsApi = {
  // range: { from: "YYYY-MM-DD", to: "YYYY-MM-DD" } (Karachi days)
  adminOverview: (range) => unwrap(api.get("/analytics/admin/overview", { params: range })),
  brandInsights: (range) => unwrap(api.get("/analytics/brands/me", { params: range })),
  employerResults: (range) => unwrap(api.get("/analytics/employers/me", { params: range })),
};

const day = (d) => new Date(d.getTime() + 5 * 3600e3).toISOString().slice(0, 10); // Karachi date
export const defaultRange = () => ({ from: day(new Date(Date.now() - 29 * 864e5)), to: day(new Date()) });

/** rows [[section, metric, value]] -> a CSV download */
export function downloadCsv(name, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const text = rows.map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default analyticsApi;
