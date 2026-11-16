// AdminHiringPlans.js: admin > employers > hiring plans (server: GET /api/career/admin/hiring-plans).
//   - counts: employers, on the free trial, trial ended, on a plan, posting locked, open requests, and how many would
//     have been locked on release without the fresh start
//   - plan requests: employer, jobs, note, sent; grant (prefilled with the jobs asked for) or decline, with a reason
//   - employers: trial (days left, free hire used, end reason) or plan (jobs left, valid until), jobs open / posted;
//     grant a plan (job posts and/or valid until), extend the trial to a date, end it. Every change needs a reason
//     and is written to the admin action log by the server. No payments.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Modal, Pill, StatCard, EmptyState, Segmented, SearchInput, toast } from "../portal/kit";
import hiringAccessApi, { accessSummary, pkDay } from "../services/hiringAccessApi";

const STATUS_LABEL = { trial: "free trial", plan: "plan", locked: "posting locked" };
const STATUS_TONE = { trial: "green", plan: "blue", locked: "orange" };
const isoDay = (d) => new Date(d).toISOString().slice(0, 10);
// a date field (yyyy-mm-dd) as the end of that day in Pakistan
const endOfDayPk = (v) => (v ? new Date(`${v}T23:59:59+05:00`).toISOString() : null);

function DecisionModal({ open, kind, row, request, onClose, onDone }) {
  const [jobs, setJobs] = useState("");
  const [until, setUntil] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setJobs(kind === "grant" ? String(request?.jobs || "") : "");
    setUntil("");
    setReason("");
    setError({});
  }, [open, kind, request]);
  if (!open) return null;
  const name = row?.employer?.companyName || row?.employer?.name || request?.employer?.name || "this employer";
  const employerId = row?.employer?.id || request?.employer?.id;
  const titles = { grant: `grant a plan to ${name}`, extend: `extend ${name}'s free trial`, end: `end ${name}'s free trial`, decline: `decline ${name}'s request` };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError({});
    try {
      if (kind === "grant") await hiringAccessApi.grant(employerId, { jobs: jobs === "" ? null : Number(jobs), validUntil: endOfDayPk(until), reason, requestId: request?.id });
      else if (kind === "extend") await hiringAccessApi.trial(employerId, { action: "extend", until: endOfDayPk(until), reason });
      else if (kind === "end") await hiringAccessApi.trial(employerId, { action: "end", reason });
      else await hiringAccessApi.decline(request.id, { reason });
      toast({ grant: "plan granted: posting is open for them now", extend: "trial extended", end: "trial ended", decline: "request declined" }[kind], "ok");
      onDone();
      onClose();
    } catch (err) {
      setError({ [err.field || "reason"]: err.message });
    } finally { setBusy(false); }
  };
  const tomorrow = isoDay(Date.now() + 864e5);
  return (
    <Modal open onClose={onClose} icon={kind === "end" || kind === "decline" ? "alert" : "briefcase"} tone={kind === "end" || kind === "decline" ? "orange" : "blue"} title={titles[kind]}
      sub={kind === "grant" ? "job posts, a date it's valid until, or both. it replaces any plan they have; posting opens at once and locks again when it's used up or past its date." : kind === "extend" ? "the trial is active until the end of that day (Pakistan time); a free hire already used no longer ends it." : kind === "end" ? "posting locks now (a plan they have still applies). their open jobs stay open until their deadline." : "they can send a new request later."}
      footer={<><Button variant="secondary" onClick={onClose}>cancel</Button><Button type="submit" form="hp-decision" loading={busy} variant={kind === "end" || kind === "decline" ? "danger" : "primary"}>{{ grant: "grant plan", extend: "extend trial", end: "end trial", decline: "decline" }[kind]}</Button></>}>
      <form id="hp-decision" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        {request && <p className="k-hint" style={{ margin: 0 }}>asked for {request.jobs} job{request.jobs === 1 ? "" : "s"}{request.note ? `: "${request.note}"` : ""}</p>}
        {kind === "grant" && (
          <Field label="job posts" hint="leave empty for no limit (then give a date)" error={error.jobs} htmlFor="hp-jobs">
            <Input id="hp-jobs" type="number" inputMode="numeric" min={1} max={1000} value={jobs} invalid={!!error.jobs} onChange={(e) => setJobs(e.target.value)} />
          </Field>
        )}
        {(kind === "grant" || kind === "extend") && (
          <Field label={kind === "grant" ? "valid until (optional)" : "trial until"} error={error.validUntil || error.until} htmlFor="hp-until">
            <Input id="hp-until" type="date" min={tomorrow} value={until} invalid={!!(error.validUntil || error.until)} onChange={(e) => setUntil(e.target.value)} required={kind === "extend"} />
          </Field>
        )}
        <Field label="reason" hint="kept in the admin action log" error={error.reason} htmlFor="hp-reason">
          <Textarea id="hp-reason" rows={2} maxLength={500} value={reason} invalid={!!error.reason} onChange={(e) => setReason(e.target.value)} required />
        </Field>
      </form>
    </Modal>
  );
}

export default function AdminHiringPlans() {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [filter, setFilter] = useState("all");
  const [term, setTerm] = useState("");
  const [decision, setDecision] = useState(null); // { kind, row?, request? }
  const load = useCallback(async () => {
    try {
      const d = await hiringAccessApi.overview();
      setState({ loading: false, data: d && Array.isArray(d.employers) ? d : null, error: d && Array.isArray(d.employers) ? null : "no data" });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message });
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const d = state.data;
  const rows = useMemo(() => {
    if (!d) return [];
    const t = term.trim().toLowerCase();
    return d.employers
      .map((r) => ({ ...r, sum: accessSummary(r) }))
      .filter((r) => filter === "all" || r.sum.status === filter)
      .filter((r) => !t || `${r.employer.companyName} ${r.employer.name}`.toLowerCase().includes(t));
  }, [d, filter, term]);
  if (state.loading) return <PageLoading />;
  if (!d) return <div className="tdcp k-page" data-screen="hiring-plans"><PageHeader title="hiring plans" /><EmptyState icon="alert" tone="red" title="couldn't load hiring plans" text={state.error || "try again"} action={<Button onClick={load}>retry</Button>} /></div>;
  const c = d.counts;
  const open = d.requests.filter((r) => r.status === "open");
  const rowOf = (employerId) => d.employers.find((e) => e.employer.id === employerId);
  return (
    <div className="tdcp k-page" data-screen="hiring-plans">
      <PageHeader title="hiring plans" sub={`every employer starts on a free trial: it ends at their first verified hire (First Hire Free) or ${d.trialDays} days after their first job. after it, posting is locked until you grant a plan. no payments.`} />
      {!d.enforced && <p className="k-note" role="status">posting isn't locked right now (HIRING_TRIAL_OFF is set on the server).</p>}
      <div className="k-stats">
        <StatCard label="employers" value={c.employers} icon="users" tone="blue" />
        <StatCard label="on the free trial" value={c.onTrial} icon="gift" tone="green" />
        <StatCard label="on a plan" value={c.onPlan} icon="briefcase" tone="blue" />
        <StatCard label="posting locked" value={c.locked} sub={`${c.trialEnded} trials ended`} icon="lock" tone="orange" />
        <StatCard label="open requests" value={c.openRequests} icon="send" tone="yellow" />
        <StatCard label="kept open by the fresh start" value={c.wouldBeLockedWithoutFreshStart} sub={`trials counted from ${pkDay(d.policyStart)}`} icon="clock" tone="purple" />
      </div>

      <section className="k-card pad" aria-labelledby="hp-requests" style={{ marginTop: 16 }}>
        <div className="k-card-head"><Ico kind="send" tone="yellow" size={30} /><h2 id="hp-requests" style={{ fontSize: 18, margin: 0 }}>plan requests</h2><Pill tone={open.length ? "yellow" : "sand"}>{open.length} open</Pill></div>
        {d.requests.length === 0 ? <p className="k-hint">no requests yet.</p> : (
          <div className="k-table-scroll">
            <table className="k-table" style={{ minWidth: 640 }}>
              <thead><tr><th>employer</th><th>jobs</th><th>note</th><th>sent</th><th>status</th><th style={{ textAlign: "right" }}>actions</th></tr></thead>
              <tbody>
                {d.requests.map((q) => (
                  <tr key={q.id}>
                    <td><b>{q.employer.name || "employer"}</b></td>
                    <td>{q.jobs}</td>
                    <td>{q.note || "–"}</td>
                    <td>{pkDay(q.sentAt)}</td>
                    <td><Pill tone={q.status === "open" ? "yellow" : q.status === "granted" ? "green" : "sand"}>{q.status}</Pill>{q.resolution ? <div className="k-hint">{q.resolution}</div> : null}</td>
                    <td style={{ textAlign: "right" }}>
                      {q.status === "open" && (
                        <span className="k-row" style={{ gap: 6, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          <Button size="sm" onClick={() => setDecision({ kind: "grant", request: q, row: rowOf(q.employer.id) })} aria-label={`grant a plan to ${q.employer.name}`}>grant</Button>
                          <Button size="sm" variant="secondary" onClick={() => setDecision({ kind: "decline", request: q })} aria-label={`decline ${q.employer.name}'s request`}>decline</Button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="k-card pad" aria-labelledby="hp-employers" style={{ marginTop: 16 }}>
        <div className="k-card-head"><Ico kind="briefcase" tone="blue" size={30} /><h2 id="hp-employers" style={{ fontSize: 18, margin: 0 }}>employers</h2></div>
        <div className="k-toolbar">
          <SearchInput className="k-grow" placeholder="search by company or name" aria-label="search employers" value={term} onChange={(e) => setTerm(e.target.value)} />
          <Segmented label="filter employers" value={filter} onChange={setFilter} options={[{ value: "all", label: "all" }, { value: "trial", label: "free trial" }, { value: "plan", label: "plan" }, { value: "locked", label: "locked" }]} />
        </div>
        {rows.length === 0 ? <EmptyState icon="search" title="no employers match" /> : (
          <div className="k-table-scroll">
            <table className="k-table" style={{ minWidth: 820 }}>
              <thead><tr><th>employer</th><th>status</th><th>details</th><th>jobs open / posted</th><th style={{ textAlign: "right" }}>actions</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const label = r.employer.companyName || r.employer.name || "employer";
                  return (
                    <tr key={r.employer.id} data-employer={r.employer.id}>
                      <td><b>{label}</b>{r.employer.companyName && r.employer.name ? <div className="k-hint">{r.employer.name}</div> : null}</td>
                      <td><Pill tone={STATUS_TONE[r.sum.status]}>{STATUS_LABEL[r.sum.status]}</Pill>{r.sum.status === "locked" && <div className="k-hint">{r.sum.title}</div>}</td>
                      <td>{r.sum.text}{r.trial.status !== "active" && r.plan?.status === "active" ? <div className="k-hint">trial: {r.trial.label}</div> : null}</td>
                      <td>{r.jobs.open} / {r.jobs.posted}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className="k-row" style={{ gap: 6, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                          <Button size="sm" onClick={() => setDecision({ kind: "grant", row: r })} aria-label={`grant a plan to ${label}`}>grant plan</Button>
                          <Button size="sm" variant="secondary" onClick={() => setDecision({ kind: "extend", row: r })} aria-label={`extend ${label}'s trial`}>extend trial</Button>
                          {r.trial.status === "active" && <Button size="sm" variant="secondary" onClick={() => setDecision({ kind: "end", row: r })} aria-label={`end ${label}'s trial`}>end trial</Button>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <DecisionModal open={!!decision} kind={decision?.kind} row={decision?.row} request={decision?.request} onClose={() => setDecision(null)} onDone={load} />
    </div>
  );
}
