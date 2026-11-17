// HiringAccess.js: the employer's free trial / hiring plan (server: routes/hiringAccess.routes.js).
//   useHiringAccess()      { loading, data, error } + reload; data = GET /career/employers/me/hiring-access
//   HiringAccessBanner     on the employer dashboard and the jobs page: the trial (days left, free hire used or not)
//                          or the plan (job posts left, valid until); after the trial "your free hire is used" /
//                          "your free trial has ended" with what still works and "request a plan"
//   RequestPlanModal       how many jobs (1-100) and a short note; tdc is notified and grants a plan by hand
// No payments. When posting is locked, the jobs page disables "post a job", "duplicate" and the CSV upload; the
// server refuses them anyway (403 POSTING_LOCKED).
import React, { useCallback, useEffect, useState } from "react";
import Ico from "../portal/Ico";
import { Button, Field, Input, Textarea, Modal, Pill, toast } from "../portal/kit";
import hiringAccessApi, { accessSummary, pkDay } from "../services/hiringAccessApi";

export function useHiringAccess(enabled = true) {
  const [state, setState] = useState({ loading: enabled, data: null, error: null });
  const reload = useCallback(async () => {
    if (!enabled) return;
    try {
      setState({ loading: false, data: await hiringAccessApi.me(), error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message });
    }
  }, [enabled]);
  useEffect(() => { reload(); }, [reload]);
  return [state, reload];
}

export function RequestPlanModal({ open, onClose, onSent, current }) {
  const [jobs, setJobs] = useState(String(current?.jobs || 1));
  const [note, setNote] = useState(current?.note || "");
  const [error, setError] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setJobs(String(current?.jobs || 1)); setNote(current?.note || ""); setError({}); } }, [open, current]);
  const n = Number(jobs);
  const valid = Number.isInteger(n) && n >= 1 && n <= 100;
  const send = async (e) => {
    e.preventDefault();
    if (!valid) { setError({ jobs: "a whole number from 1 to 100" }); return; }
    setBusy(true);
    try {
      const d = await hiringAccessApi.requestPlan({ jobs: n, note });
      toast("sent: tdc will get back to you about your plan", "ok");
      onSent && onSent(d);
      onClose();
    } catch (err) {
      if (err.field) setError({ [err.field]: err.message });
      toast(err.message, "bad");
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} icon="briefcase" tone="blue" title="request a plan" sub="tell tdc how many jobs you want to post. there's no payment here: tdc gets in touch and sets up your plan."
      footer={<><Button variant="secondary" onClick={onClose}>cancel</Button><Button type="submit" form="plan-request-form" loading={busy} disabled={!valid}>send request</Button></>}>
      <form id="plan-request-form" onSubmit={send} style={{ display: "grid", gap: 12 }}>
        <Field label="how many jobs" hint="1 to 100" error={error.jobs} htmlFor="plan-jobs">
          <Input id="plan-jobs" type="number" inputMode="numeric" min={1} max={100} value={jobs} invalid={!!error.jobs} onChange={(e) => { setJobs(e.target.value); setError({}); }} />
        </Field>
        <Field label="note (optional)" hint="e.g. which roles, by when" htmlFor="plan-note">
          <Textarea id="plan-note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}

/** the banner; pass the hook's state (or it loads its own) */
export function HiringAccessBanner({ state, reload }) {
  const [own, ownReload] = useHiringAccess(!state);
  const s = state || own;
  const again = reload || ownReload;
  const [asking, setAsking] = useState(false);
  const d = s.data;
  if (s.loading || !d) return null;
  const sum = accessSummary(d);
  const locked = !d.canPost;
  const req = d.request;
  return (
    <section className="k-card pad" data-card="hiring-access" data-status={sum.status} aria-labelledby="hiring-access-title" style={{ marginBottom: 16, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", borderColor: locked ? "var(--orange, #f59e0b)" : undefined }}>
      <Ico kind={locked ? "alert" : sum.status === "plan" ? "briefcase" : "gift"} tone={sum.tone} size={44} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <h2 id="hiring-access-title" style={{ margin: 0, fontSize: 17 }}>{sum.title}</h2>
          <Pill tone={sum.tone}>{locked ? "posting locked" : sum.status === "plan" ? "plan" : "posting open"}</Pill>
        </div>
        <p style={{ margin: "4px 0 0" }}>{sum.text}</p>
        {locked && <p className="k-hint" style={{ margin: "4px 0 0" }}>your open jobs stay open until their deadline; candidates, interviews, offers and hires keep working. to post more jobs, request a plan.</p>}
        {req && <p className="k-hint" data-testid="plan-request-sent" style={{ margin: "4px 0 0" }}>your request for {req.jobs} job{req.jobs === 1 ? "" : "s"} was sent on {pkDay(req.sentAt)}. tdc will get back to you.</p>}
      </div>
      {(locked || req || sum.status === "plan") && (
        <Button size="sm" variant={locked && !req ? "primary" : "secondary"} icon="send" onClick={() => setAsking(true)}>{req ? "change request" : "request a plan"}</Button>
      )}
      <RequestPlanModal open={asking} onClose={() => setAsking(false)} onSent={() => again()} current={req} />
    </section>
  );
}

export default HiringAccessBanner;
