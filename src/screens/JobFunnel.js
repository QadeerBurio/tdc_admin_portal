// JobFunnel.js: "hiring by job" on the employer's reports page (FLAG_CAREER_TIMELINE). One of the employer's own
// jobs (or all of them): views, applicants, shortlisted, interviews completed, verified hires, and the median time to
// a first response and to a verified hire. Server: GET /api/career/employers/me/analytics?jobId (own jobs only),
// counted from the hiring timeline: a scheduled interview isn't completed, an accepted offer isn't a hire.
import React, { useEffect, useState } from "react";
import Ico from "../portal/Ico";
import { PageLoading, Select, StatCard, toast } from "../portal/kit";
import careerApi from "../services/careerApi";

export const duration = (h) => (h == null ? "–" : h < 48 ? `${h} h` : `${Math.round((h / 24) * 10) / 10} days`);

export default function JobFunnel() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [data, setData] = useState(null);
  useEffect(() => { careerApi.pipeline().then((d) => setJobs(d.jobs || [])).catch(() => setJobs([])); }, []);
  useEffect(() => {
    let alive = true;
    setData(null);
    careerApi.employerAnalytics(jobId ? { jobId } : {})
      .then((d) => alive && setData(d))
      .catch((e) => { if (alive) { toast(e.message, "bad"); setData({ failed: true }); } });
    return () => { alive = false; };
  }, [jobId]);
  const c = data?.counts;
  return (
    <section className="k-card pad" style={{ marginBottom: 16 }} aria-label="hiring by job" data-card="job-funnel">
      <div className="k-card-head" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div className="k-row" style={{ gap: 8 }}><Ico kind="chart" tone="green" size={30} /><h3 style={{ margin: 0 }}>hiring by job</h3></div>
        <Select aria-label="job" value={jobId} onChange={(e) => setJobId(e.target.value)} style={{ minWidth: 220 }}>
          <option value="">all my jobs</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}{j.archived ? " (deleted)" : ""}</option>)}
        </Select>
      </div>
      {!data ? <PageLoading /> : data.failed || !c ? <p className="k-hint">couldn't load these numbers.</p> : (
        <>
          <div className="k-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
            {data.job && <StatCard label="views" value={data.job.views} icon="eye" tone="sky" />}
            <StatCard label={data.job ? "applicants" : "applications on the timeline"} value={data.job ? data.job.applicants : c.applications} icon="users" tone="blue" />
            <StatCard label="shortlisted" value={c.shortlisted} icon="star" tone="yellow" />
            <StatCard label="interviewed" value={c.interviewsCompleted} sub={`${c.interviewsInvited} invited`} icon="calendar" tone="purple" />
            <StatCard label="hired (verified)" value={c.verifiedHires} icon="check" tone="green" />
            <StatCard label="time to hire" value={duration(data.medianHours?.toVerifiedHire)} sub="median, applied to verified hire" icon="clock" tone="sand" />
            <StatCard label="first response" value={duration(data.medianHours?.firstEmployerResponse)} sub="median" icon="clock" tone="sand" />
          </div>
          <p className="k-hint" style={{ marginBottom: 0 }}>
            from the hiring timeline: an interview counts once it's recorded as completed, a hire once you confirm it and it isn't disputed.
            {data.job && data.job.applicants > c.applications ? ` ${data.job.applicants - c.applications} applicant${data.job.applicants - c.applications === 1 ? "" : "s"} applied before the timeline and count only as applicants.` : ""}
          </p>
        </>
      )}
    </section>
  );
}
