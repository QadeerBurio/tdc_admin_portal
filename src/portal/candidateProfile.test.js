import { applicationsOf, stageHistory, interviewOutcomes, candidateStats } from "./candidateProfile";

const ev = (seq, type, occurredAt) => ({ id: `e${seq}`, seq, type, occurredAt });

test("applicationsOf: only this candidate's applications, newest first (userId as id or populated)", () => {
  const all = [
    { _id: "a1", userId: "u1", appliedAt: "2026-10-01T00:00:00Z" },
    { _id: "a2", userId: { _id: "u1" }, appliedAt: "2026-11-01T00:00:00Z" },
    { _id: "a3", userId: "u2", appliedAt: "2026-11-02T00:00:00Z" },
  ];
  expect(applicationsOf(all, "u1").map((a) => a._id)).toEqual(["a2", "a1"]);
  expect(applicationsOf(all, null)).toEqual([]);
});

test("stageHistory: stage changes in order; applied from appliedAt when there's no APPLIED event", () => {
  const events = [ev(2, "SHORTLISTED", "2026-11-03T00:00:00Z"), ev(1, "REVIEWED", "2026-11-02T00:00:00Z"), ev(3, "INTERVIEW_INVITED", "2026-11-04T00:00:00Z"), ev(4, "INTERVIEW_RESCHEDULED", "2026-11-05T00:00:00Z"), ev(5, "INTERVIEW_COMPLETED", "2026-11-06T00:00:00Z")];
  expect(stageHistory(events, "2026-11-01T00:00:00Z")).toEqual([
    { stage: "applied", at: "2026-11-01T00:00:00Z" },
    { stage: "reviewed", at: "2026-11-02T00:00:00Z" },
    { stage: "shortlisted", at: "2026-11-03T00:00:00Z" },
    { stage: "interview", at: "2026-11-04T00:00:00Z" },
  ]);
});

test("interviewOutcomes counts each kind", () => {
  const o = interviewOutcomes([ev(1, "INTERVIEW_INVITED"), ev(2, "INTERVIEW_RESCHEDULED"), ev(3, "INTERVIEW_COMPLETED"), ev(4, "INTERVIEW_INVITED"), ev(5, "CANDIDATE_NO_SHOW_REPORTED")]);
  expect(o).toMatchObject({ invited: 2, rescheduled: 1, completed: 1, candidateNoShow: 1, cancelled: 0 });
});

test("candidateStats: totals across this employer's applications only", () => {
  const apps = [
    { _id: "a1", appliedAt: "2026-11-01T00:00:00Z" },
    { _id: "a2", appliedAt: "2026-10-01T00:00:00Z" },
  ];
  const stateById = { a1: { stage: "hired", hire: { status: "verified" } }, a2: { stage: "rejected" } };
  const timelines = {
    a1: { events: [ev(1, "REVIEWED", "2026-11-03T00:00:00Z"), ev(2, "INTERVIEW_INVITED", "2026-11-04T00:00:00Z"), ev(3, "INTERVIEW_COMPLETED", "2026-11-05T00:00:00Z"), ev(4, "OFFER_SENT", "2026-11-06T00:00:00Z"), ev(5, "OFFER_ACCEPTED", "2026-11-07T00:00:00Z"), ev(6, "HIRE_CONFIRMED", "2026-11-08T00:00:00Z")] },
    a2: { events: [ev(1, "REJECTED", "2026-10-02T00:00:00Z")] },
  };
  const s = candidateStats(apps, stateById, timelines);
  expect(s).toMatchObject({ applications: 2, furthestStage: "hired", hires: 1, offers: { sent: 1, accepted: 1, declined: 0, withdrawn: 0, expired: 0 } });
  expect(s.interviews).toMatchObject({ invited: 1, completed: 1 });
  expect(s.medianDaysToFirstResponse).toBe(1.5); // 2 days and 1 day
  expect(Object.keys(s)).not.toContain("rating");
});

test("candidateStats: no timeline yet (classic flow): stage from the pipeline, no response time", () => {
  const s = candidateStats([{ _id: "a1", appliedAt: "2026-11-01T00:00:00Z" }], { a1: { stage: "shortlisted" } }, {});
  expect(s.furthestStage).toBe("shortlisted");
  expect(s.medianDaysToFirstResponse).toBeNull();
});
