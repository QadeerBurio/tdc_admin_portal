// HiringFunnel.js: admin view of the hiring funnel (FLAG_CAREER_TIMELINE), counted only from timeline
// events on the server (GET /api/career/admin/analytics): an application is never a hire, a scheduled
// interview is never "completed", an accepted offer is never a verified hire, a disputed outcome never counts.
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Input, DateInput, StatCard, EmptyState, Facts, toast } from "../portal/kit";
import careerApi from "../services/careerApi";

const hours = (h) => (h == null ? "–" : h < 48 ? `${h} h` : `${Math.round((h / 24) * 10) / 10} days`);
const pct = (p) => (p == null ? "–" : `${p}%`);

export default function HiringFunnel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [employerId, setEmployerId] = useState("");
  const [jobId, setJobId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = new Date(`${from}T00:00:00+05:00`).toISOString();
      if (to) params.to = new Date(`${to}T23:59:59+05:00`).toISOString();
      if (/^[a-f0-9]{24}$/i.test(employerId.trim())) params.employerId = employerId.trim();
      if (/^[a-f0-9]{24}$/i.test(jobId.trim())) params.jobId = jobId.trim();
      setData(await careerApi.adminAnalytics(params));
    } catch (err) {
      toast(err.message || "couldn't load the funnel", "bad");
    } finally {
      setLoading(false);
    }
  }, [from, to, employerId, jobId]);
  useEffect(() => { load(); }, [load]);

  const c = data?.counts;
  return (
    <div className="tdcp k-page" data-screen="hiring-funnel">
      <PageHeader title="hiring funnel" sub="counted from the hiring timeline only: scheduled ≠ completed, accepted offer ≠ verified hire, disputed outcomes excluded." />
      <div className="k-toolbar" style={{ flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
        <Field label="applied from" htmlFor="hf-from"><DateInput id="hf-from" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="to" htmlFor="hf-to"><DateInput id="hf-to" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label="employer id (optional)" htmlFor="hf-emp"><Input id="hf-emp" value={employerId} onChange={(e) => setEmployerId(e.target.value)} placeholder="all employers" /></Field>
        <Field label="job id (optional)" htmlFor="hf-job"><Input id="hf-job" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="all jobs" /></Field>
        <Button variant="secondary" icon="search" onClick={load} loading={loading}>refresh</Button>
      </div>
      {data?.job && (
        <p className="k-hint" data-job-facts>job: <strong>{data.job.title || "untitled"}</strong>{data.job.archived ? " (deleted)" : ""} · {data.job.views} views · {data.job.applicants} applicants in all (classic applications included)</p>
      )}
      {loading && !data ? <PageLoading /> : !c || c.applications === 0 ? (
        <EmptyState icon="chart" tone="green" title="no timeline activity yet" text="numbers appear once pilot employers and students use the hiring timeline." />
      ) : (
        <>
          <div className="k-stats">
            <StatCard label="submitted" value={c.submitted} sub={c.joinedPilotLater ? `+${c.joinedPilotLater} joined the pilot later` : undefined} icon="receipt" tone="blue" />
            <StatCard label="reviewed" value={c.reviewed} sub={pct(data.conversions.submittedToReviewed)} icon="search" tone="sky" />
            <StatCard label="shortlisted" value={c.shortlisted} sub={pct(data.conversions.reviewedToShortlisted)} icon="star" tone="yellow" />
            <StatCard label="verified hires" value={c.verifiedHires} sub={pct(data.conversions.acceptedToVerifiedHire) + " of accepted offers"} icon="check" tone="green" dark />
          </div>
          <div className="k-stats">
            <StatCard label="interviews invited" value={c.interviewsInvited} icon="calendar" tone="purple" />
            <StatCard label="interviews accepted" value={c.interviewsAccepted} icon="calendar" tone="purple" />
            <StatCard label="interviews completed" value={c.interviewsCompleted} sub={pct(data.conversions.shortlistedToCompletedInterview) + " of shortlisted"} icon="check" tone="purple" />
            <StatCard label="offers sent / accepted" value={`${c.offersSent} / ${c.offersAccepted}`} sub={pct(data.conversions.offerToAccepted) + " accepted"} icon="send" tone="orange" />
          </div>
          <section className="k-card pad">
            <div className="k-card-head"><h3>response times and exceptions</h3></div>
            <Facts rows={[
              ["median first employer response", hours(data.medianHours.firstEmployerResponse)],
              ["median time to first interview invite", hours(data.medianHours.toFirstInterviewInvite)],
              ["median time to verified hire", hours(data.medianHours.toVerifiedHire)],
              ["disputes (interview + hire + corrections)", String(c.disputes)],
              ["no-show reports", String(c.noShowReports)],
              ["rejected / withdrawn", `${c.rejected} / ${c.withdrawn}`],
              ["offers declined", String(c.offersDeclined)],
            ]} />
          </section>
        </>
      )}
    </div>
  );
}
