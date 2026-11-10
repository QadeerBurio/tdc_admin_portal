// HiringOverview.js: Admin > oversight > hiring overview (server: /api/career/admin/applications | interviews | hires).
// Read-only, across every employer: candidates by stage (counts for every stage, then the rows for one), every
// interview, every hire. Filters go to the server (employer id, job id, stage / status, dates). Names only: the
// candidate's first name and the employer; the full timeline opens from the employer's side or hire disputes.
// Every read is audited on the server.
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Input, Select, DateInput, Tabs, EmptyState, Pill, StatCard, toast } from "../portal/kit";
import careerApi, { inKarachi } from "../services/careerApi";

const STAGES = ["applied", "reviewed", "shortlisted", "interview", "offer", "hired", "rejected", "withdrawn"];
const STAGE_TONE = { applied: "sand", reviewed: "blue", shortlisted: "yellow", interview: "purple", offer: "orange", hired: "green", rejected: "red", withdrawn: "sand" };
const IV_STATUSES = ["invited", "accepted", "declined", "reschedule_requested", "cancelled", "completed", "candidate_no_show_reported", "employer_no_show_reported", "disputed"];
const HIRE_TONE = { verified: "green", "employer-recorded": "blue", revoked: "red" };
const day = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" }) : "–");
const isId = (v) => /^[0-9a-f]{24}$/i.test(String(v || "").trim());
const startOf = (d) => (d ? new Date(`${d}T00:00:00+05:00`).toISOString() : undefined);
const endOf = (d) => (d ? new Date(`${d}T23:59:59.999+05:00`).toISOString() : undefined);

export default function HiringOverview() {
  const [tab, setTab] = useState("stages");
  const [f, setF] = useState({ employerId: "", jobId: "", stage: "", status: "", from: "", to: "" });
  const [applied, setApplied] = useState(f);
  const [data, setData] = useState(null);
  const badId = (f.employerId && !isId(f.employerId)) || (f.jobId && !isId(f.jobId));
  const load = useCallback(async () => {
    setData(null);
    const common = { ...(applied.employerId ? { employerId: applied.employerId.trim() } : {}), ...(applied.jobId ? { jobId: applied.jobId.trim() } : {}) };
    try {
      // the data carries the tab it was loaded for: a tab switch never renders another tab's data
      if (tab === "stages") setData({ tab, ...(await careerApi.adminApplications({ ...common, ...(applied.stage ? { stage: applied.stage } : {}) })) });
      else if (tab === "interviews") setData({ tab, ...(await careerApi.adminInterviews({ ...common, ...(applied.status ? { status: applied.status } : {}), from: startOf(applied.from), to: endOf(applied.to) })) });
      else setData({ tab, ...(await careerApi.adminHires({ ...common, from: startOf(applied.from), to: endOf(applied.to) })) });
    } catch (e) { toast(e.message, "bad"); setData({ tab, empty: true }); }
  }, [tab, applied]);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  return (
    <div className="tdcp k-page" data-screen="hiring-overview">
      <PageHeader title="hiring overview" sub="every employer's candidates by stage, interviews and hires. read-only; every view is audited." />
      <Tabs label="hiring overview" value={tab} onChange={setTab} tabs={[{ id: "stages", label: "by stage", icon: "users" }, { id: "interviews", label: "interviews", icon: "calendar" }, { id: "hires", label: "hires", icon: "trophy" }]} />
      <form className="k-card pad" style={{ margin: "16px 0" }} aria-label="filters" onSubmit={(e) => { e.preventDefault(); if (!badId) setApplied(f); }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <Field label="employer id" htmlFor="ho-emp" error={f.employerId && !isId(f.employerId) ? "24 characters, 0-9 and a-f" : undefined}><Input id="ho-emp" value={f.employerId} onChange={set("employerId")} placeholder="all employers" /></Field>
          <Field label="job id" htmlFor="ho-job" error={f.jobId && !isId(f.jobId) ? "24 characters, 0-9 and a-f" : undefined}><Input id="ho-job" value={f.jobId} onChange={set("jobId")} placeholder="all jobs" /></Field>
          {tab === "stages" && (
            <Field label="stage" htmlFor="ho-stage"><Select id="ho-stage" value={f.stage} onChange={set("stage")}><option value="">every stage</option>{STAGES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
          )}
          {tab === "interviews" && (
            <Field label="status" htmlFor="ho-status"><Select id="ho-status" value={f.status} onChange={set("status")}><option value="">every status</option>{IV_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}</Select></Field>
          )}
          {tab !== "stages" && <Field label="from (Karachi)" htmlFor="ho-from"><DateInput id="ho-from" value={f.from} onChange={set("from")} /></Field>}
          {tab !== "stages" && <Field label="to (Karachi)" htmlFor="ho-to"><DateInput id="ho-to" value={f.to} onChange={set("to")} /></Field>}
        </div>
        <div className="k-row" style={{ gap: 8, marginTop: 12 }}>
          <Button type="submit" icon="search" disabled={badId}>apply filters</Button>
          <Button variant="secondary" onClick={() => { const blank = { employerId: "", jobId: "", stage: "", status: "", from: "", to: "" }; setF(blank); setApplied(blank); }}>clear</Button>
        </div>
      </form>

      {!data || data.tab !== tab ? <PageLoading /> : data.empty ? <EmptyState icon="alert" tone="sand" title="couldn't load" text="try again." /> : tab === "stages" ? (
        <>
          <div className="k-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginBottom: 12 }}>
            {STAGES.map((s) => <StatCard key={s} label={s} value={data.counts?.[s] || 0} tone={STAGE_TONE[s] === "sand" ? "sand" : STAGE_TONE[s]} pressed={applied.stage === s} onClick={() => { setF((x) => ({ ...x, stage: s })); setApplied((x) => ({ ...x, stage: x.stage === s ? "" : s })); }} />)}
          </div>
          <p className="k-hint">{data.total} applications in all; showing {data.applications.length}{applied.stage ? ` at ${applied.stage}` : ""}.</p>
          <Table rows={data.applications} empty="no candidates at this stage." head={["candidate", "job", "employer", "stage", "applied", "interview"]} row={(a) => [
            a.candidate.firstName, a.job.title + (a.job.archived ? " (deleted)" : ""), a.employer.name || "–",
            <Pill tone={STAGE_TONE[a.stage]}>{a.stage}</Pill>, day(a.appliedAt), a.interview ? `${a.interview.status.replace(/_/g, " ")}${a.interview.startsAt ? ` · ${inKarachi(a.interview.startsAt)}` : ""}` : "–",
          ]} keyOf={(a) => a.applicationId} />
        </>
      ) : tab === "interviews" ? (
        <Table rows={data.interviews} empty="no interviews match." head={["when (Karachi)", "candidate", "job", "employer", "how", "status"]} row={(i) => [
          inKarachi(i.startsAt), i.candidate.firstName, i.job.title, i.employer.name || "–", i.mode, <Pill tone={i.status === "completed" ? "green" : i.active ? "purple" : "sand"}>{i.status.replace(/_/g, " ")}</Pill>,
        ]} keyOf={(i) => i.id} />
      ) : (
        <Table rows={data.hires} empty="no hires match." head={["confirmed", "candidate", "job", "employer", "status"]} row={(h) => [
          day(h.confirmedAt), h.candidate.firstName, h.job.title, h.employer.name || "–", <Pill tone={HIRE_TONE[h.verificationLevel] || "sand"}>{h.verificationLevel}{h.revokedAt ? ` (${day(h.revokedAt)})` : ""}</Pill>,
        ]} keyOf={(h) => h.id} />
      )}
    </div>
  );
}

function Table({ rows, head, row, keyOf, empty }) {
  if (!rows.length) return <EmptyState icon="search" tone="sand" title={empty} text="change the filters to see more." />;
  return (
    <div className="k-table-card">
      <div className="k-table-scroll" tabIndex={0} role="region" aria-label="results table">
        <table className="k-table" style={{ minWidth: 760 }}>
          <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={keyOf(r)} data-row>{row(r).map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
