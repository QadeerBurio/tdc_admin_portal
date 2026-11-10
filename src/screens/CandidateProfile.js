// CandidateProfile.js: one candidate's full profile for the employer (FLAG_CAREER_TIMELINE), at /candidate/:applicationId.
// Built only from the employer's own records: what the candidate sent with their applications to this employer's
// jobs (classic /jobs/candidates, scoped to the employer's jobs on the server), each application's hiring timeline,
// the tailored resume they sent, and match evidence (FLAG_CAREER_MATCHING). Stats: applications to your jobs,
// furthest stage, interview outcomes, offers, hires, time to first response.
// Ratings are never shown here: a student's ratings are never shown to employers.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, StatCard, EmptyState, Pill, Facts, toast } from "../portal/kit";
import careerApi, { inKarachi } from "../services/careerApi";
import resumeStudioApi from "../services/resumeStudioApi";
import api from "../services/api";
import MatchEvidence from "./MatchEvidence";
import { EVENT_LABEL } from "./CandidatePipeline";
import { applicationsOf, stageHistory, interviewOutcomes, candidateStats, STAGE_LABEL } from "../portal/candidateProfile";

const STAGE_TONE = { applied: "sand", reviewed: "blue", shortlisted: "yellow", interview: "purple", offer: "orange", hired: "green", rejected: "red", withdrawn: "sand" };
const day = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" }) : "–");
const MAX_TIMELINES = 20;
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? u : null);

export default function CandidateProfile() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });

  const load = useCallback(async () => {
    setState({ loading: true });
    try {
      const flags = await careerApi.flagsMe().catch(() => ({}));
      if (!flags.careerTimeline) return setState({ loading: false, off: true });
      // the application opened (the server checks it's for one of this employer's jobs)
      const app = await api.get(`/jobs/candidates/${applicationId}`).then((r) => r.data);
      const [all, pipeline] = await Promise.all([
        api.get("/jobs/candidates/all", { params: { limit: 1000 } }).then((r) => (Array.isArray(r.data) ? r.data : [])).catch(() => []),
        careerApi.pipeline().catch(() => ({ applications: [] })),
      ]);
      let apps = applicationsOf(all, app.userId);
      if (!apps.some((a) => String(a._id) === String(app._id))) apps = [app, ...apps];
      const stateById = Object.fromEntries((pipeline.applications || []).map((p) => [p.applicationId, p]));
      const onTimeline = apps.filter((a) => stateById[String(a._id)]?.careerEnabled).slice(0, MAX_TIMELINES);
      const timelines = Object.fromEntries((await Promise.all(onTimeline.map((a) => careerApi.timeline(String(a._id)).then((t) => [String(a._id), t]).catch(() => null)))).filter(Boolean));
      setState({ loading: false, app, apps, stateById, timelines });
    } catch (err) {
      const status = err.response?.status;
      setState({ loading: false, missing: status === 403 || status === 404 || status === 400 });
      if (!(status === 403 || status === 404 || status === 400)) toast(err.response?.data?.message || err.message || "couldn't load the candidate", "bad");
    }
  }, [applicationId]);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => (state.apps ? candidateStats(state.apps, state.stateById, state.timelines) : null), [state]);
  const back = <Button variant="secondary" icon="chevronLeft" onClick={() => navigate("/candidate")}>back to candidates</Button>;

  if (state.loading) return <PageLoading />;
  if (state.off) return <div className="tdcp k-page" data-screen="candidate-profile"><EmptyState icon="users" tone="blue" title="candidate profiles are part of the hiring timeline pilot" text="your candidates are on the candidates page." action={back} /></div>;
  if (state.missing || !state.app) return <div className="tdcp k-page" data-screen="candidate-profile"><EmptyState icon="users" tone="sand" title="candidate not found" text="this application isn't for one of your jobs, or it was removed." action={back} /></div>;

  const { app, apps, stateById, timelines } = state;
  const latest = apps[0] || app;
  const links = [["portfolio", latest.portfolioUrl], ["LinkedIn", latest.linkedInUrl], ["GitHub", latest.githubUrl]].filter(([, u]) => safeUrl(u));
  const iv = stats.interviews;

  return (
    <div className="tdcp k-page" data-screen="candidate-profile">
      <PageHeader
        title={app.fullName || "candidate"}
        sub={[latest.currentPosition && `${latest.currentPosition}${latest.currentCompany ? ` at ${latest.currentCompany}` : ""}`, [latest.city, latest.country].filter(Boolean).join(", ")].filter(Boolean).join(" · ") || "candidate"}
        actions={back}
      />
      <p className="k-hint" style={{ marginTop: 0 }}>only your company's own records: what this candidate sent with applications to your jobs and what happened in your hiring.</p>

      <div className="k-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <StatCard label="applications to your jobs" value={stats.applications} icon="file" tone="blue" />
        <StatCard label="furthest stage" value={stats.furthestStage ? STAGE_LABEL[stats.furthestStage] : "–"} icon="star" tone="yellow" />
        <StatCard label="interviews completed" value={iv.completed} sub={`${iv.invited} invited${iv.candidateNoShow ? ` · ${iv.candidateNoShow} no-show reported` : ""}${iv.cancelled ? ` · ${iv.cancelled} cancelled` : ""}`} icon="calendar" tone="purple" />
        <StatCard label="offers" value={stats.offers.sent} sub={stats.offers.sent ? `${stats.offers.accepted} accepted · ${stats.offers.declined} declined` : "none sent"} icon="send" tone="orange" />
        <StatCard label="hires" value={stats.hires} icon="check" tone="green" />
        <StatCard label="days to your first response" value={stats.medianDaysToFirstResponse ?? "–"} sub="median, applied to first step" icon="clock" tone="sand" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 16, alignItems: "start" }}>
        <section className="k-card pad" aria-label="contact and details">
          <div className="k-card-head"><Ico kind="users" tone="blue" size={30} /><h3>contact and details</h3></div>
          <Facts rows={[
            ["email", latest.email || "–"],
            ["phone", latest.phone || "–"],
            ["experience", latest.yearsOfExperience != null && latest.yearsOfExperience !== "" ? `${latest.yearsOfExperience} years` : "–"],
            ["expected salary", latest.expectedSalary ? String(latest.expectedSalary) : "–"],
            ["notice period", latest.noticePeriod || "–"],
            ["available from", latest.availableFrom ? day(latest.availableFrom) : "–"],
            ["work authorization", latest.workAuthorization || "–"],
          ]} />
          {links.length > 0 && (
            <div className="k-row" style={{ gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              {links.map(([label, u]) => <a key={label} href={safeUrl(u)} target="_blank" rel="noopener noreferrer" className="k-btn secondary sm">{label}</a>)}
            </div>
          )}
          {safeUrl(latest.resumeUrl) && (
            <p style={{ marginBottom: 0 }}><a href={safeUrl(latest.resumeUrl)} target="_blank" rel="noopener noreferrer">resume uploaded with the application{latest.resumeFileName ? ` (${latest.resumeFileName})` : ""}</a></p>
          )}
          {latest.coverLetter && (
            <details style={{ marginTop: 10 }}>
              <summary>cover letter (latest application)</summary>
              <p style={{ whiteSpace: "pre-wrap" }}>{latest.coverLetter}</p>
            </details>
          )}
        </section>

        <div style={{ display: "grid", gap: 16 }}>
          {apps.map((a) => (
            <ApplicationCard key={String(a._id)} a={a} row={stateById[String(a._id)]} timeline={timelines[String(a._id)]} current={String(a._id) === String(applicationId)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ a, row, timeline, current }) {
  const id = String(a._id);
  const [sent, setSent] = useState(null);
  useEffect(() => { if (row?.careerEnabled) resumeStudioApi.attachedResume(id).then(setSent).catch(() => setSent(null)); }, [id, row?.careerEnabled]);
  const stage = row?.stage || a.status || "applied";
  const events = timeline?.events || [];
  const history = stageHistory(events, a.appliedAt);
  const io = interviewOutcomes(events);
  const outcomes = events.filter((e) => ["INTERVIEW_COMPLETED", "CANDIDATE_NO_SHOW_REPORTED", "EMPLOYER_NO_SHOW_REPORTED", "INTERVIEW_CANCELLED", "INTERVIEW_DECLINED", "INTERVIEW_DISPUTED"].includes(e.type));
  const job = a.jobId && typeof a.jobId === "object" ? a.jobId : null;
  return (
    <section className="k-card pad" aria-label={`application: ${job?.title || row?.jobTitle || "job"}`} data-application={id}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{job?.title || row?.jobTitle || "job"}{current ? <span className="k-muted" style={{ fontWeight: 400, fontSize: 13 }}> · opened</span> : null}</h3>
        <Pill tone={STAGE_TONE[stage] || "sand"}>{STAGE_LABEL[stage] || stage}</Pill>
      </div>
      <p className="k-hint" style={{ margin: "4px 0 8px" }}>applied {day(a.appliedAt)}{row && !row.careerEnabled ? " · classic flow (no timeline)" : ""}</p>

      {history.length > 0 && (
        <>
          <h4 style={{ margin: "8px 0 4px", fontSize: 14 }}>stage history</h4>
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {history.map((h, i) => <li key={i}>{STAGE_LABEL[h.stage] || h.stage} <span className="k-muted">· {day(h.at)}</span></li>)}
          </ol>
        </>
      )}

      {(io.invited > 0 || outcomes.length > 0) && (
        <>
          <h4 style={{ margin: "12px 0 4px", fontSize: 14 }}>interviews</h4>
          <p style={{ margin: 0, fontSize: 13.5 }}>{io.invited} invited · {io.completed} completed{io.rescheduled ? ` · ${io.rescheduled} moved` : ""}{io.cancelled ? ` · ${io.cancelled} cancelled` : ""}{io.candidateNoShow ? ` · ${io.candidateNoShow} candidate no-show reported` : ""}</p>
          {outcomes.length > 0 && (
            <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
              {outcomes.map((e) => <li key={e.id}>{EVENT_LABEL[e.type] || e.type} <span className="k-muted">· {inKarachi(e.occurredAt)}</span>{e.metadata?.note ? <> · “{e.metadata.note}”</> : null}</li>)}
            </ul>
          )}
        </>
      )}

      {sent && (
        <div className="k-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
          <span style={{ fontSize: 13.5 }}>resume sent: {sent.label || "tailored resume"} · {inKarachi(sent.attachedAt)}</span>
          <Button size="sm" variant="secondary" icon="download" onClick={() => resumeStudioApi.downloadAttachedResume(id, `${job?.title || "candidate"} resume`).catch((e) => toast(e.message, "bad"))}>download pdf</Button>
        </div>
      )}
      {row?.careerEnabled && <div style={{ marginTop: 12 }}><MatchEvidence applicationId={id} /></div>}
    </section>
  );
}
