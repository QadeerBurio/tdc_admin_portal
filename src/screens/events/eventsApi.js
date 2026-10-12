// src/screens/events/eventsApi.js
// Events API for the admin web. Every call sends the admin token.
// REACT_APP_EVENTS_API overrides the base (local mock tests); the default is production.
import axios from "axios";

export const API_BASE =
  process.env.REACT_APP_EVENTS_API || "https://the-deft-crew-production.up.railway.app/api/events";

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

// 401 / 403: the session is gone or this account can't manage events
export const authProblem = (err) => {
  const s = err?.response?.status;
  if (s === 401) return "Your session has ended. Please sign in again.";
  if (s === 403) return "This account can't manage events. Please sign in with an admin account.";
  return null;
};

// a plain message for anything else
export const errorMessage = (err, fallback = "Something went wrong. Please try again.") => {
  if (!err?.response) return "Can't reach the server. Check your connection and try again.";
  const d = err.response.data || {};
  return d.message || d.error || fallback;
};

export const eventsApi = {
  templates: () => axios.get(`${API_BASE}/category-templates`).then((r) => r.data),
  myEvents: (token) => axios.get(`${API_BASE}/my-events`, auth(token)).then((r) => (Array.isArray(r.data) ? r.data : [])),
  eventRegistrations: (token, eventId) =>
    axios.get(`${API_BASE}/registrations/${eventId}`, auth(token)).then((r) => (Array.isArray(r.data) ? r.data : [])),
  paymentInfo: (token, eventId) => axios.get(`${API_BASE}/${eventId}/payment-info`, auth(token)).then((r) => r.data),
  create: (token, body) => axios.post(`${API_BASE}/create`, body, auth(token)).then((r) => r.data),
  update: (token, id, body) => axios.put(`${API_BASE}/event/${id}`, body, auth(token)).then((r) => r.data),
  remove: (token, id) => axios.delete(`${API_BASE}/event/${id}`, auth(token)).then((r) => r.data),
  importCsv: (token, formData) =>
    axios
      .post(`${API_BASE}/admin/import-csv`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),

  // registrations (admin)
  registrations: (token, params) =>
    axios.get(`${API_BASE}/admin/registrations`, { ...auth(token), params }).then((r) => r.data),
  reviewPayment: (token, id, action, reason) =>
    axios.patch(`${API_BASE}/registrations/${id}/payment`, { action, reason }, auth(token)).then((r) => r.data),
  registrationsCsv: (token, params) =>
    axios.get(`${API_BASE}/admin/registrations.csv`, { ...auth(token), params, responseType: "blob" }),
};

// Cloudinary upload (same unsigned preset as before). Throws with a plain message.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export async function uploadImage(file) {
  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", "tdc_profiles");
  body.append("cloud_name", "decaxpera");
  let res;
  try {
    res = await fetch("https://api.cloudinary.com/v1_1/decaxpera/image/upload", { method: "POST", body });
  } catch {
    throw new Error("The image didn't upload: can't reach the image server. Check your connection and try again.");
  }
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* not JSON */
  }
  if (!res.ok || !data.secure_url) {
    throw new Error(`The image didn't upload${data?.error?.message ? `: ${data.error.message}` : ""}. Try again or pick another image.`);
  }
  return data.secure_url;
}
