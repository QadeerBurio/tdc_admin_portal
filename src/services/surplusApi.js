// src/services/surplusApi.js
// Surprise Box (server: routes/surplus.routes.js, behind FLAG_SURPLUS_BOXES): merchant surplus food,
// pickup only, pay at pickup. The server replies { success, data, requestId }; these return `data` and
// throw an Error with the server's message, `code`, `status` and any extra fields (allowed, ref, ...).
import api from "./api";

const unwrap = (request) =>
  request
    .then((res) => res.data?.data)
    .catch((e) => {
      const body = e.response?.data || {};
      const { code, message, ...extra } = body.error || {};
      const err = new Error(message || body.message || e.message || "request failed");
      Object.assign(err, extra, { code, status: e.response?.status });
      throw err;
    });

export const surplusApi = {
  flagsMe: () => api.get("/app/flags/me").then((r) => r.data || {}),
  // brand
  branches: () => api.get("/branches/my-branches").then((r) => r.data?.branches || []),
  listings: () => unwrap(api.get("/surplus/merchant/listings")),
  createListing: (body) => unwrap(api.post("/surplus/merchant/listings", body)),
  updateListing: (id, body) => unwrap(api.patch(`/surplus/merchant/listings/${id}`, body)),
  // the box's optional photo (images only, at most 5 MB; locked once a student has ordered)
  uploadPhoto: (id, file, version) => {
    const fd = new FormData();
    fd.append("version", String(version));
    fd.append("image", file);
    return unwrap(api.post(`/surplus/merchant/listings/${id}/image`, fd, { headers: { "Content-Type": "multipart/form-data" } }));
  },
  removePhoto: (id, version) => unwrap(api.delete(`/surplus/merchant/listings/${id}/image`, { data: { version } })),
  orders: (scope = "live") => unwrap(api.get("/surplus/merchant/orders", { params: { scope } })),
  transition: (id, body) => unwrap(api.post(`/surplus/merchant/orders/${id}/transition`, body)),
  // { code | qr, branchId, markPaid }
  verifyPickup: (body) => unwrap(api.post("/surplus/merchant/verify-pickup", body)),
  summary: () => unwrap(api.get("/surplus/merchant/summary")),
  // admin
  adminOrders: (params) => unwrap(api.get("/surplus/admin/orders", { params })),
  adminNoShows: () => unwrap(api.get("/surplus/admin/no-shows")),
  adminCases: (status = "open") => unwrap(api.get("/surplus/admin/cases", { params: { status } })),
  decideCase: (id, body) => unwrap(api.post(`/surplus/admin/cases/${id}/decide`, body)),
  adminBrands: () => unwrap(api.get("/surplus/admin/brands")),
  blockBrand: (brandId, body) => unwrap(api.post(`/surplus/admin/brands/${brandId}/block`, body)),
  // every brand's listings (writes need a reason and are logged on the server)
  adminListings: (params) => unwrap(api.get("/surplus/admin/listings", { params })),
  adminListing: (id) => unwrap(api.get(`/surplus/admin/listings/${id}`)),
  adminUpdateListing: (id, body) => unwrap(api.patch(`/surplus/admin/listings/${id}`, body)),
  adminCancelListing: (id, body) => unwrap(api.post(`/surplus/admin/listings/${id}/cancel`, body)),
  // is the pilot set up at all? (admin menu item)
  adminAvailable: () => api.get("/surplus/admin/cases", { params: { status: "open" } }).then(() => true).catch(() => false),
};

export const STATE_LABEL = {
  ORDER_PLACED: "new", CONFIRMED: "confirmed", PREPARING: "preparing", READY_FOR_PICKUP: "ready", PICKUP_VERIFIED: "handed over",
  COMPLETED: "completed", MERCHANT_CANCELLED: "cancelled by you", CUSTOMER_CANCELLED: "cancelled by student", NO_SHOW: "no-show",
  DISPUTED: "disputed", RESERVATION_EXPIRED: "expired", SOLD_OUT: "sold out",
};
export const STATE_TONE = { ORDER_PLACED: "yellow", CONFIRMED: "blue", PREPARING: "purple", READY_FOR_PICKUP: "green", PICKUP_VERIFIED: "green", COMPLETED: "sand", MERCHANT_CANCELLED: "red", CUSTOMER_CANCELLED: "sand", NO_SHOW: "red", DISPUTED: "orange" };
export const ACTION_LABEL = { CONFIRMED: "confirm", PREPARING: "preparing", READY_FOR_PICKUP: "ready for pickup", MERCHANT_CANCELLED: "cancel", COMPLETED: "paid at pickup: complete" };
export const karachi = (iso, opts = { dateStyle: "medium", timeStyle: "short" }) => (iso ? new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", ...opts }) : "–");
// "2026-11-20T14:30" typed as Karachi time -> ISO UTC (Karachi is UTC+5 all year)
export const karachiToUtc = (local) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(local || ""));
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 5, +m[5])).toISOString() : null;
};
export const utcToKarachiInput = (iso) => (iso ? new Date(new Date(iso).getTime() + 5 * 3600e3).toISOString().slice(0, 16) : "");

export default surplusApi;
