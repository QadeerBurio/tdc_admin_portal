// Candidate profile (employer portal, FLAG_CAREER_TIMELINE): pure helpers that turn the employer's own records
// (this candidate's applications to the employer's jobs and their hiring timelines) into a history and stats.
// Only the employer's own data goes in: no ratings, nothing from other employers.

export const STAGE_ORDER = ["applied", "reviewed", "shortlisted", "interview", "offer", "hired"];
export const STAGE_LABEL = { applied: "applied", reviewed: "reviewed", shortlisted: "shortlisted", interview: "interview", offer: "offer", hired: "hired", rejected: "rejected", withdrawn: "withdrew" };
// the events that move an application to a stage
const STAGE_OF_EVENT = {
  APPLIED: "applied", REVIEWED: "reviewed", SHORTLISTED: "shortlisted", INTERVIEW_INVITED: "interview",
  OFFER_SENT: "offer", HIRE_CONFIRMED: "hired", REJECTED: "rejected", WITHDRAWN: "withdrawn",
};

const idOf = (v) => (v && typeof v === "object" ? String(v._id || v.id || "") : String(v || ""));

// the candidate's applications among the employer's applications (classic list), newest first
export function applicationsOf(allApps, userId) {
  const uid = idOf(userId);
  if (!uid) return [];
  return (allApps || [])
    .filter((a) => idOf(a.userId) === uid)
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

// stage changes in order: [{ stage, at }]; starts with "applied" at appliedAt when the timeline has no APPLIED event
export function stageHistory(events = [], appliedAt = null) {
  const out = [];
  const sorted = [...events].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0) || new Date(a.occurredAt) - new Date(b.occurredAt));
  if (!sorted.some((e) => e.type === "APPLIED") && appliedAt) out.push({ stage: "applied", at: appliedAt });
  for (const e of sorted) {
    const stage = STAGE_OF_EVENT[e.type];
    if (!stage) continue;
    if (out.length && out[out.length - 1].stage === stage) continue;
    out.push({ stage, at: e.occurredAt });
  }
  return out;
}

export function interviewOutcomes(events = []) {
  const n = (t) => events.filter((e) => e.type === t).length;
  return {
    invited: n("INTERVIEW_INVITED"),
    rescheduled: n("INTERVIEW_RESCHEDULED"),
    cancelled: n("INTERVIEW_CANCELLED"),
    declined: n("INTERVIEW_DECLINED"),
    completed: n("INTERVIEW_COMPLETED"),
    candidateNoShow: n("CANDIDATE_NO_SHOW_REPORTED"),
    employerNoShow: n("EMPLOYER_NO_SHOW_REPORTED"),
    disputed: n("INTERVIEW_DISPUTED"),
  };
}

const DAY = 864e5;
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const FIRST_RESPONSE = new Set(["REVIEWED", "SHORTLISTED", "REJECTED", "INTERVIEW_INVITED", "OFFER_SENT"]);

// apps: this candidate's applications (classic docs); stateById: pipeline rows by application id;
// timelines: { [applicationId]: { events } } for the ones on the timeline
export function candidateStats(apps = [], stateById = {}, timelines = {}) {
  const sum = { invited: 0, rescheduled: 0, cancelled: 0, declined: 0, completed: 0, candidateNoShow: 0, employerNoShow: 0, disputed: 0 };
  const offers = { sent: 0, accepted: 0, declined: 0, withdrawn: 0, expired: 0 };
  let furthest = -1;
  let hires = 0;
  const responseDays = [];
  for (const a of apps) {
    const id = idOf(a._id || a.applicationId);
    const ev = timelines[id]?.events || [];
    const io = interviewOutcomes(ev);
    for (const k of Object.keys(sum)) sum[k] += io[k];
    offers.sent += ev.filter((e) => e.type === "OFFER_SENT").length;
    offers.accepted += ev.filter((e) => e.type === "OFFER_ACCEPTED").length;
    offers.declined += ev.filter((e) => e.type === "OFFER_DECLINED").length;
    offers.withdrawn += ev.filter((e) => e.type === "OFFER_WITHDRAWN").length;
    offers.expired += ev.filter((e) => e.type === "OFFER_EXPIRED").length;
    const history = stageHistory(ev, a.appliedAt);
    const stage = stateById[id]?.stage;
    for (const s of [...history.map((h) => h.stage), stage]) {
      const i = STAGE_ORDER.indexOf(s);
      if (i > furthest) furthest = i;
    }
    if (stateById[id]?.hire?.status === "verified" || (stage === "hired" && !stateById[id]?.hire)) hires += 1;
    const first = [...ev].sort((x, y) => new Date(x.occurredAt) - new Date(y.occurredAt)).find((e) => FIRST_RESPONSE.has(e.type));
    if (first && a.appliedAt) responseDays.push(Math.max(0, (new Date(first.occurredAt) - new Date(a.appliedAt)) / DAY));
  }
  const med = median(responseDays);
  return {
    applications: apps.length,
    furthestStage: furthest >= 0 ? STAGE_ORDER[furthest] : null,
    interviews: sum,
    offers,
    hires,
    medianDaysToFirstResponse: med == null ? null : Math.round(med * 10) / 10,
  };
}
