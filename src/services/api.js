// src/services/api.js
// Centralized API layer for the TDC Admin Portal.
// Every endpoint grouped by domain. Uses localStorage token `token`.

import axios from 'axios';

// ─────────────────────────────────────────────
// Base configuration
// ─────────────────────────────────────────────
const API_BASE =
  
  'https://the-deft-crew-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 900000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// Handle 401 → logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ═════════════════════════════════════════════
// CREW API
// ═════════════════════════════════════════════
export const crewApi = {
  // Inbox — pending posts + applications
  inbox: () => api.get('/admin/crew/inbox').then((r) => r.data),

  // Partners
  partners: () => api.get('/admin/crew/partners').then((r) => r.data),
  partner: (userId) => api.get(`/admin/crew/partners/${userId}`).then((r) => r.data),
  addPartner: (payload) => api.post('/admin/crew/partners', payload).then((r) => r.data),
  removePartner: (userId) => api.delete(`/admin/crew/partners/${userId}`),

  // Reviews
  reviewPost: (postId, status, reach) =>
    api.post(`/admin/crew/posts/${postId}/review`, { status, reach }).then((r) => r.data),
  reviewApplication: (appId, status) =>
    api.post(`/admin/crew/partners/applications/${appId}/review`, { status }).then((r) => r.data),

  // Campaigns
  campaigns: () => api.get('/admin/crew/campaigns').then((r) => r.data),
  createCampaign: (payload) =>
    api.post('/admin/crew/campaigns', payload).then((r) => r.data),
  updateCampaign: (id, payload) =>
    api.put(`/admin/crew/campaigns/${id}`, payload).then((r) => r.data),
  endCampaign: (id) => api.post(`/admin/crew/campaigns/${id}/end`).then((r) => r.data),
  deleteCampaign: (id) => api.delete(`/admin/crew/campaigns/${id}`),

  // Credentials
  credentials: () => api.get('/admin/crew/credentials').then((r) => r.data),
  issueCredential: (payload) =>
    api.post('/admin/crew/credentials', payload).then((r) => r.data),
  revokeCredential: (id) => api.delete(`/admin/crew/credentials/${id}`),

  // Points & Badges
  adjustPoints: (userId, delta, note) =>
    api.post('/admin/crew/points/award', { userId, delta, note }).then((r) => r.data),
  awardBadge: (userId, badgeId) =>
    api.post('/admin/crew/badges/award', { userId, badgeId }).then((r) => r.data),

  // Settings
  settings: () => api.get('/admin/crew/settings').then((r) => r.data),
};

// ═════════════════════════════════════════════
// ENGAGEMENT API
// ═════════════════════════════════════════════
export const engagementApi = {
  
  // ─── Metrics ───
  metrics: (weeks = 8) =>
    api.get('/admin/engagement/metrics', { params: { weeks } }).then((r) => r.data),
// ─── Drilldown (click a metric → see users) ───  🆕
  drilldown: (params = {}) =>
    api.get('/admin/engagement/drilldown', { params }).then((r) => r.data),
  // ─── Profiles ───
  profiles: (params = {}) =>
    api.get('/admin/engagement/profiles', { params }).then((r) => r.data),

  // ─── Drops ───
  listDrops: (from, to) =>
    api.get('/admin/engagement/drops', { params: { from, to } }).then((r) => r.data),
  getDrop: (dayKey) =>
    api.get(`/admin/engagement/drops/${dayKey}`).then((r) => r.data),
  createDrop: (payload) =>
    api.post('/admin/engagement/drops', payload).then((r) => r.data),
  updateDrop: (dayKey, payload) =>
    api.put(`/admin/engagement/drops/${dayKey}`, payload).then((r) => r.data),
  publishNow: (dayKey) =>
    api.post(`/admin/engagement/drops/${dayKey}/publish-now`).then((r) => r.data),
  deleteDrop: (dayKey) =>
    api.delete(`/admin/engagement/drops/${dayKey}`).then((r) => r.data),
  dropResults: (dayKey) =>
    api.get(`/admin/engagement/drops/${dayKey}/results`).then((r) => r.data),

  // ─── Rewards (admin) ───
listRewards: () =>
  api.get('/admin/engagement/rewards').then((r) => r.data),

listBrands: () =>
  api.get('/engagement/brands').then((r) => r.data),

createReward: (payload) =>
  api.post('/admin/engagement/rewards', payload).then((r) => r.data),

updateReward: (id, payload) =>
  api.put(`/admin/engagement/rewards/${id}`, payload).then((r) => r.data),

deleteReward: (id) =>
  api.delete(`/admin/engagement/rewards/${id}`).then((r) => r.data),

toggleReward: (id, active) =>
  api.put(`/admin/engagement/rewards/${id}`, { active }).then((r) => r.data),

rewardRedemptions: (id) =>
  api.get(`/admin/engagement/rewards/${id}/redemptions`).then((r) => r.data),

cancelRedemption: (id) =>
  api.post(`/admin/engagement/redemptions/${id}/cancel`).then((r) => r.data),

  // ─── Points / Badges ───
  adjustPoints: (userId, delta, note) =>
    api.post('/admin/engagement/points/adjust', { userId, delta, note }).then((r) => r.data),
  awardBadge: (userId, badgeId) =>
    api.post('/admin/engagement/badges/award', { userId, badgeId }).then((r) => r.data),
  userLedger: (userId, limit = 50) =>
    api.get(`/admin/engagement/users/${userId}/ledger`, { params: { limit } }).then((r) => r.data),

  // ─── Push — Test ───
  testPush: (payload) =>
    api.post('/admin/engagement/test-push', payload).then((r) => r.data),

  // ─── Push — Logs ───
  pushLogs: (params = {}) =>
    api.get('/admin/engagement/push-logs', { params }).then((r) => r.data),

  // ─── Push — Broadcasts ───
  broadcastAppUpdate: (payload) =>
    api.post('/admin/engagement/broadcast/app-update', payload).then((r) => r.data),
  broadcastFreezeReset: () =>
    api.post('/admin/engagement/broadcast/freeze-reset').then((r) => r.data),
  broadcastCustom: (payload) =>
    api.post('/admin/engagement/broadcast/custom', payload).then((r) => r.data),

  // ─── Push — Manual Nudges ───
  nudgeFeature: (userId) =>
    api.post(`/admin/engagement/nudge/feature/${userId}`).then((r) => r.data),
  nudgeWinBack: (userId, days = 7) =>
    api.post(`/admin/engagement/nudge/win-back/${userId}`, { days }).then((r) => r.data),
  nudgeStreak: (userId) =>
    api.post(`/admin/engagement/nudge/streak/${userId}`).then((r) => r.data),
};

// ═════════════════════════════════════════════
// BRAND API
// ═════════════════════════════════════════════
export const brandApi = {
  campaigns: () => api.get('/brand/campaigns').then((r) => r.data),
  campaign: (id) => api.get(`/brand/campaigns/${id}`).then((r) => r.data),
};

// ═════════════════════════════════════════════
// USERS API
// ═════════════════════════════════════════════
export const usersApi = {
  // Get all users
  all: () => api.get('/admin/users/all').then((r) => r.data),

  // Get users by role
  byRole: (role) => api.get(`/admin/users/${role}`).then((r) => r.data),

  // Get user details
  details: (id) => api.get(`/admin/users/details/${id}`).then((r) => r.data),

  // Credentials list (email + role)
  credentials: (role) =>
    api.get(`/admin/users/credentials/${role}`).then((r) => r.data),

  // Create user
  create: (payload) => api.post('/admin/users/create', payload).then((r) => r.data),

  // Update role
  updateRole: (id, role) =>
    api.put(`/admin/users/role/${id}`, { role }).then((r) => r.data),

  // Reset password
  resetPassword: (id, newPassword) =>
    api.post(`/admin/users/reset-password/${id}`, { newPassword }).then((r) => r.data),

  // Get password (admin only)
  getPassword: (id) =>
    api.get(`/admin/users/password/${id}`).then((r) => r.data),

  // Approve / toggle verification
  approveUser: (id) =>
    api.post(`/admin/approve-user/${id}`).then((r) => r.data),

  // Verify
  verifyUser: (targetUserId) =>
    api.patch(`/admin/verify-user/${targetUserId}`).then((r) => r.data),

  // Delete
  delete: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
};

// ═════════════════════════════════════════════
// OFFERS API
// ═════════════════════════════════════════════
export const offersApi = {
  // Get all offer images (approved brands only)
  imagesAll: (params = {}) =>
    api.get('/offers/images/all', { params }).then((r) => r.data),

  // Get single offer image
  image: (offerId) =>
    api.get(`/offers/${offerId}/image`).then((r) => r.data),

  // Brand offers
  byBrand: (brandId) =>
    api.get(`/offers/brand/${brandId}`).then((r) => r.data),

  // Promo info for a specific offer
  promoInfo: (offerId) =>
    api.get(`/offers/${offerId}/promo-info`).then((r) => r.data),

  // Claimed users for current brand
  claimedUsers: () => api.get('/offers/claimed-users').then((r) => r.data),

  // Savings report for current brand
  savingsReport: () => api.get('/offers/savings-report').then((r) => r.data),

  // Brand redemptions (admin view)
  brandRedemptions: (brandId) =>
    api.get(`/offers/brand/${brandId}/redemptions`).then((r) => r.data),

  // Admin — all brands revenue summary
  adminBrandsRevenue: () =>
    api.get('/offers/admin/brands-revenue').then((r) => r.data),

  // Public list of brands (with offers count)
  publicBrands: () => api.get('/offers/brandss').then((r) => r.data),
};

// ═════════════════════════════════════════════
// JOBS API
// ═════════════════════════════════════════════
export const jobsApi = {
  // Admin — all jobs
  all: (params = {}) => api.get('/jobs/all', { params }).then((r) => r.data),

  // My jobs (posted by current user)
  myJobs: () => api.get('/jobs/my-jobs').then((r) => r.data),

  // Public — all external jobs
  publicAll: (params = {}) =>
    api.get('/jobs/public/all', { params }).then((r) => r.data),

  // Public — TDC internal jobs
  publicTdc: (params = {}) =>
    api.get('/jobs/public/tdc', { params }).then((r) => r.data),

  // Single job
  publicJob: (id) => api.get(`/jobs/public/job/${id}`).then((r) => r.data),

  // Filters
  filters: () => api.get('/jobs/public/filters').then((r) => r.data),

  // Add job
  add: (payload) => api.post('/jobs/add', payload).then((r) => r.data),

  // Update job
  update: (id, payload) => api.put(`/jobs/update/${id}`, payload).then((r) => r.data),

  // Toggle active
  toggle: (id) => api.patch(`/jobs/toggle/${id}`).then((r) => r.data),

  // Delete
  delete: (id) => api.delete(`/jobs/delete/${id}`).then((r) => r.data),

  // Stats
  stats: () => api.get('/jobs/stats').then((r) => r.data),

  // Applications
  myApplications: () => api.get('/jobs/my-applications').then((r) => r.data),
  jobApplications: (jobId) =>
    api.get(`/jobs/job/${jobId}/applications`).then((r) => r.data),
  updateApplicationStatus: (id, status) =>
    api.patch(`/jobs/application/${id}/status`, { status }).then((r) => r.data),

  // Interviews
  interviewsAll: () => api.get('/jobs/interviews/all').then((r) => r.data),
  interviewsUpcoming: () => api.get('/jobs/interviews/upcoming').then((r) => r.data),
  scheduleInterview: (payload) =>
    api.post('/jobs/interviews/schedule', payload).then((r) => r.data),

  // Candidates
  candidatesAll: (params = {}) =>
    api.get('/jobs/candidates/all', { params }).then((r) => r.data),
  candidate: (id) => api.get(`/jobs/candidates/${id}`).then((r) => r.data),
  bulkUpdateStatus: (payload) =>
    api.patch('/jobs/candidates/bulk-status', payload).then((r) => r.data),

  // Bookmarks
  bookmarks: () => api.get('/jobs/bookmarks').then((r) => r.data),
  bookmarkJob: (jobId) => api.post(`/jobs/bookmarks/${jobId}`).then((r) => r.data),
  unbookmarkJob: (jobId) => api.delete(`/jobs/bookmarks/${jobId}`).then((r) => r.data),

  // Recommendations
  recommendations: (params = {}) =>
    api.get('/jobs/recommendations', { params }).then((r) => r.data),
  topRecommendations: (limit = 5) =>
    api.get('/jobs/recommendations/top', { params: { limit } }).then((r) => r.data),
  feed: (params = {}) => api.get('/jobs/feed', { params }).then((r) => r.data),
  similarJobs: (jobId, limit = 6) =>
    api.get(`/jobs/similar/${jobId}`, { params: { limit } }).then((r) => r.data),

  // Skill gap
  skillGap: (jobId, resumeId) =>
    api.get(`/jobs/${jobId}/skill-gap`, { params: { resumeId } }).then((r) => r.data),
  validateApplication: (jobId, resumeId) =>
    api.post(`/jobs/${jobId}/validate-application`, { resumeId }).then((r) => r.data),
  atsScore: (jobId) =>
    api.get(`/jobs/${jobId}/ats-score`).then((r) => r.data),
};

// ═════════════════════════════════════════════
// EVENTS API
// ═════════════════════════════════════════════
export const eventsApi = {
  // Feed
  feed: (params = {}) => api.get('/events/feed', { params }).then((r) => r.data),
  latest: () => api.get('/events/latest').then((r) => r.data),
  search: (q) => api.get('/events/search', { params: { q } }).then((r) => r.data),
  byCategory: (category) =>
    api.get(`/events/category/${category}`).then((r) => r.data),

  // Single event
  event: (id) => api.get(`/events/${id}`).then((r) => r.data),

  // Create / update
  create: (payload) => api.post('/events/create', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/events/${id}`, payload).then((r) => r.data),
  delete: (id) => api.delete(`/events/${id}`).then((r) => r.data),

  // Registrations
  register: (payload) => api.post('/events/register', payload).then((r) => r.data),
  cancelRegistration: (eventId) =>
    api.delete(`/events/register/${eventId}`).then((r) => r.data),
  myRegistrations: () => api.get('/events/my-registrations').then((r) => r.data),
  eventRegistrations: (eventId) =>
    api.get(`/events/registrations/${eventId}`).then((r) => r.data),

  // Notifications
  notifications: () => api.get('/events/notifications').then((r) => r.data),
  unreadCount: () => api.get('/events/notifications/unread/count').then((r) => r.data),
  markRead: (id) =>
    api.put(`/events/notifications/${id}/read`).then((r) => r.data),

  // Admin
  adminStats: () => api.get('/events/admin/stats').then((r) => r.data),
  adminModerate: (id, payload) =>
    api.patch(`/events/admin/moderate/${id}`, payload).then((r) => r.data),
  importCsv: (formData) =>
    api
      .post('/events/admin/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  sync: (provider) =>
    api.post('/events/sync', { provider }).then((r) => r.data),
  expire: () => api.patch('/events/expire').then((r) => r.data),
  deleteExpired: () => api.delete('/events/expired').then((r) => r.data),
};

// ═════════════════════════════════════════════
// EXCHANGE API (Scholarships / Programs)
// ═════════════════════════════════════════════
export const exchangeApi = {
  // Public
  all: () => api.get('/admin/exchange/all').then((r) => r.data),

  // Admin
  allAdmin: () => api.get('/admin/exchange/all-admin').then((r) => r.data),

  // Create
  add: (payload) => api.post('/admin/exchange/add', payload).then((r) => r.data),

  // Bulk import
  bulkImport: (formData) =>
    api
      .post('/admin/exchange/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  // Update
  update: (id, payload) =>
    api.put(`/admin/exchange/update/${id}`, payload).then((r) => r.data),

  // Toggle active
  toggle: (id) =>
    api.patch(`/admin/exchange/toggle/${id}`).then((r) => r.data),

  // Delete
  delete: (id) => api.delete(`/admin/exchange/delete/${id}`).then((r) => r.data),

  // Applications
  applications: (programId) =>
    api.get(`/admin/exchange/applications/${programId}`).then((r) => r.data),
};

// ═════════════════════════════════════════════
// TRAVEL / PACKAGES API
// ═════════════════════════════════════════════
export const travelApi = {
  // Packages
  packagesAll: () => api.get('/admin/packages/all').then((r) => r.data),
  createPackage: (formData) =>
    api
      .post('/admin/packages/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  updatePackage: (id, formData) =>
    api
      .put(`/admin/packages/update/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),
  deletePackage: (id) =>
    api.delete(`/admin/packages/delete/${id}`).then((r) => r.data),

  // Bookings
  bookingsAll: () => api.get('/admin/bookings/all').then((r) => r.data),
  updateBooking: (id, payload) =>
    api.put(`/admin/bookings/${id}`, payload).then((r) => r.data),
  deleteBooking: (id) =>
    api.delete(`/admin/bookings/${id}`).then((r) => r.data),
  bookingsStats: () => api.get('/admin/bookings/stats').then((r) => r.data),
};

// ═════════════════════════════════════════════
// CARDS / VIP MEMBERSHIP API
// ═════════════════════════════════════════════
export const cardsApi = {
  // Pending cards
  pendingCards: () => api.get('/admin/pending-cards').then((r) => r.data),
  pendingPayments: () => api.get('/admin/pending-payments').then((r) => r.data),

  // Stats
  stats: () => api.get('/admin/card-stats').then((r) => r.data),

  // Logistics
  logisticsByStatus: (status) =>
    api.get(`/admin/logistics/${status}`).then((r) => r.data),
  bulkUpdateStatus: (payload) =>
    api.post('/admin/bulk-update-status', payload).then((r) => r.data),

  // Payments
  approvePayment: (id) =>
    api.post(`/admin/approve-payment/${id}`).then((r) => r.data),
  rejectPayment: (id) =>
    api.post(`/admin/reject-payment/${id}`).then((r) => r.data),
};

// ═════════════════════════════════════════════
// SLIDER / OFFERS API
// ═════════════════════════════════════════════
export const sliderApi = {
  all: (type) => api.get('/admin/all', { params: { type } }).then((r) => r.data),

  add: (formData) =>
    api
      .post('/admin/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data),

  toggle: (id) => api.patch(`/admin/toggle/${id}`).then((r) => r.data),

  delete: (id) => api.delete(`/admin/delete/${id}`).then((r) => r.data),
};

// ═════════════════════════════════════════════
// NOTIFICATIONS API
// ═════════════════════════════════════════════
export const notificationsApi = {
  send: (payload) => api.post('/notification/send', payload).then((r) => r.data),
  myNotifications: () => api.get('/notification/my-notifications').then((r) => r.data),
  unreadCount: () => api.get('/notification/unread-count').then((r) => r.data),
  markRead: (id) => api.patch(`/notification/mark-read/${id}`).then((r) => r.data),
  markAllRead: () => api.put('/notification/mark-all-read').then((r) => r.data),
  delete: (id) => api.delete(`/notification/delete/${id}`).then((r) => r.data),
  clearAll: () => api.delete('/notification/clear-all').then((r) => r.data),
};

// ═════════════════════════════════════════════
// SOCIAL / MODERATION API
// ═════════════════════════════════════════════
export const socialApi = {
  // Feed
  feed: (params = {}) => api.get('/social/feed', { params }).then((r) => r.data),

  // Reports
  reports: (params = {}) =>
    api.get('/social/admin/reports', { params }).then((r) => r.data),
  reportDetails: (reportId) =>
    api.get(`/social/admin/reports/${reportId}`).then((r) => r.data),
  updateReport: (reportId, payload) =>
    api.put(`/social/admin/reports/${reportId}`, payload).then((r) => r.data),
  takeAction: (reportId, payload) =>
    api.post(`/social/admin/reports/${reportId}/action`, payload).then((r) => r.data),
  reportsStats: () => api.get('/social/admin/reports/stats').then((r) => r.data),
  pendingReportsCount: () =>
    api.get('/social/admin/reports/pending-count').then((r) => r.data),

  // Blocked users
  blockedUsers: () => api.get('/social/user/blocked').then((r) => r.data),
};

// ═════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════
export const API_BASE_URL = API_BASE;