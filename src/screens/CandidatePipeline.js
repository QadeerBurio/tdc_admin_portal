// CandidatePipeline.js: the employer's candidates as a Kanban on the hiring timeline (FLAG_CAREER_TIMELINE).
// Columns come from the server's state (Applied, Reviewed, Shortlisted, Interview, Offer, Hired, Rejected);
// a card opens the candidate: timeline, audit panel and the actions the server allows now (review,
// shortlist, reject, schedule / reschedule / cancel the interview, record its outcome, send / withdraw an
// offer, confirm the hire). Times are entered and shown in Asia/Karachi. Every action sends the version
// this screen saw: if someone else changed the candidate meanwhile, it reloads instead of overwriting.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Select, DateInput, Drawer, Modal, EmptyState, Pill, Facts, toast, confirmDialog } from "../portal/kit";
import careerApi, { karachiToUtc, utcToKarachiInput, inKarachi } from "../services/careerApi";

const COLUMNS = [
  { stage: "applied", label: "Applied", tone: "sand" },
  { stage: "reviewed", label: "Reviewed", tone: "blue" },
  { stage: "shortlisted", label: "Shortlisted", tone: "yellow" },
  { stage: "interview", label: "Interview", tone: "purple" },
  { stage: "offer", label: "Offer", tone: "orange" },
  { stage: "hired", label: "Hired", tone: "green" },
  { stage: "rejected", label: "Rejected", tone: "red" }, // also withdrawn (marked on the card)
];
const columnOf = (stage) => (stage === "withdrawn" ? "rejected" : stage);
const EVENT_LABEL = {
  APPLIED: "applied", LEGACY_STATUS: "status before the timeline", REVIEWED: "reviewed", SHORTLISTED: "shortlisted", REJECTED: "rejected", WITHDRAWN: "withdrew",
  INTERVIEW_INVITED: "interview invited", INTERVIEW_RESCHEDULED: "interview moved", INTERVIEW_CANCELLED: "interview cancelled", INTERVIEW_ACCEPTED: "interview accepted",
  INTERVIEW_DECLINED: "interview declined", INTERVIEW_RESCHEDULE_REQUESTED: "asked for another time", INTERVIEW_COMPLETED: "interview completed",
  CANDIDATE_NO_SHOW_REPORTED: "candidate no-show reported", EMPLOYER_NO_SHOW_REPORTED: "employer no-show reported", INTERVIEW_DISPUTED: "interview disputed",
  OFFER_SENT: "offer sent", OFFER_WITHDRAWN: "offer withdrawn", OFFER_ACCEPTED: "offer accepted", OFFER_DECLINED: "offer declined", OFFER_EXPIRED: "offer expired",
  HIRE_CONFIRMED: "hire confirmed (verified)", HIRE_DISPUTED: "hire disputed", HIRE_REVOKED: "hire revoked by tdc",
};
const subline = (a) => {
  if (a.stage === "withdrawn") return "withdrew";
  if (a.stage === "interview" && a.interview?.startsAt) return `${a.interview.status.replace(/_/g, " ")} · ${inKarachi(a.interview.startsAt)}`;
  if (a.stage === "offer") return `offer ${a.offer?.status || ""}`;
  if (a.stage === "hired") return a.hire?.status === "verified" ? "verified hire" : "hired";
  return "";
};
const blankSlot = () => ({ startsAt: "", durationMinutes: 45, mode: "online", meetingLink: "", location: "", note: "" });

export default function CandidatePipeline({ onClassic }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ jobs: [], applications: [] });
  const [jobId, setJobId] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await careerApi.pipeline(jobId || undefined));
    } catch (err) {
      toast(err.message || "couldn't load your candidates", "bad");
    } finally {
      setLoading(false);
    }
  }, [jobId]);
  useEffect(() => { load(); }, [load]);

  const byColumn = useMemo(() => {
    const m = Object.fromEntries(COLUMNS.map((c) => [c.stage, []]));
    for (const a of data.applications || []) m[columnOf(a.stage)]?.push(a);
    return m;
  }, [data]);

  if (loading && !data.applications.length) return <PageLoading />;
  return (
    <div className="tdcp k-page" data-screen="employer-pipeline">
      <PageHeader
        title="candidates"
        sub="every applicant by stage. open a card for the timeline and the next step."
        actions={(
          <>
            <Select aria-label="job" value={jobId} onChange={(e) => setJobId(e.target.value)} style={{ minWidth: 200 }}>
              <option value="">all jobs</option>
              {(data.jobs || []).map((j) => <option key={j.id} value={j.id}>{j.title}{j.archived ? " (deleted)" : ""}</option>)}
            </Select>
            <Button variant="secondary" icon="search" onClick={load} loading={loading}>refresh</Button>
            {onClassic && <Button variant="secondary" onClick={onClassic}>classic list</Button>}
          </>
        )}
      />
      {(data.applications || []).length === 0 ? (
        <EmptyState icon="users" tone="blue" title="no applicants yet" text="applications to your jobs appear here." />
      ) : (
        <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(220px, 1fr)", gap: 12, overflowX: "auto", paddingBottom: 8 }} role="list" aria-label="candidates by stage">
          {COLUMNS.map((col) => (
            <section key={col.stage} className="k-card pad" style={{ minHeight: 160, background: "var(--sand)" }} role="listitem" aria-label={`${col.label}: ${byColumn[col.stage].length}`}>
              <div className="k-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{col.label}</h3>
                <Pill tone={col.tone}>{byColumn[col.stage].length}</Pill>
              </div>
              {byColumn[col.stage].map((a) => (
                <button
                  type="button"
                  key={a.applicationId}
                  onClick={() => (a.careerEnabled ? setOpenId(a.applicationId) : toast("this candidate isn't in the timeline pilot yet: use the classic list"))}
                  className="k-card"
                  style={{ display: "block", width: "100%", textAlign: "left", padding: 12, marginBottom: 8, background: "var(--card)", border: "1px solid var(--line)", cursor: "pointer" }}
                  aria-label={`${a.candidateName}, ${a.jobTitle}, ${col.label}`}
                >
                  <div style={{ fontWeight: 700 }}>{a.candidateName || "candidate"}</div>
                  <div className="k-muted" style={{ fontSize: 12.5 }}>{a.jobTitle} · applied {new Date(a.appliedAt).toLocaleDateString("en-GB")}</div>
                  {subline(a) && <div style={{ fontSize: 12.5, marginTop: 4 }}>{subline(a)}</div>}
                  {!a.careerEnabled && <Pill tone="sand">classic flow</Pill>}
                </button>
              ))}
            </section>
          ))}
        </div>
      )}
      {openId && <CandidateDetail applicationId={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

function CandidateDetail({ applicationId, onClose, onChanged }) {
  const [t, setT] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState(null); // schedule | reschedule | complete | offer
  const [slot, setSlot] = useState(blankSlot);
  const [offer, setOffer] = useState({ title: "", terms: "", expiresOn: "" });
  const [outcome, setOutcome] = useState({ outcome: "completed", note: "" });

  const load = useCallback(async () => {
    try {
      setT(await careerApi.timeline(applicationId));
    } catch (err) {
      toast(err.message || "couldn't load the timeline", "bad");
    }
  }, [applicationId]);
  useEffect(() => { load(); }, [load]);

  // one action: on a version conflict, reload instead of overwriting someone else's change
  const act = async (fn, done) => {
    setBusy(true);
    try {
      await fn();
      toast(done, "ok");
      setDialog(null);
      await load();
      onChanged();
    } catch (err) {
      toast(err.code === "VERSION_CONFLICT" ? "someone changed this candidate meanwhile; reloaded" : err.message, "bad");
      if (err.code === "VERSION_CONFLICT") load();
    } finally {
      setBusy(false);
    }
  };
  if (!t) return <Drawer open onClose={onClose} title="candidate"><PageLoading /></Drawer>;
  const can = (a) => t.nextAllowedActions.includes(a);
  const v = t.version;
  const iv = t.interviewDetails;
  const of = t.offerDetails;

  const slotBody = () => {
    const startsAt = karachiToUtc(slot.startsAt);
    if (!startsAt) throw Object.assign(new Error("pick a date and time"), { code: "LOCAL" });
    return { version: v, startsAt, durationMinutes: Number(slot.durationMinutes), timezone: "Asia/Karachi", mode: slot.mode, meetingLink: slot.meetingLink, location: slot.location, note: slot.note };
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={t.job.title || "candidate"}
      sub={`${t.stage}${t.job.archived ? " · job deleted" : ""}${t.external ? ` · ${t.externalLabel}` : ""}`}
    >
      <div className="k-row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {can("REVIEWED") && <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(() => careerApi.event(applicationId, { type: "REVIEWED", version: v }), "marked reviewed")}>mark reviewed</Button>}
        {can("SHORTLISTED") && <Button size="sm" disabled={busy} onClick={() => act(() => careerApi.event(applicationId, { type: "SHORTLISTED", version: v }), "shortlisted")}>shortlist</Button>}
        {can("INTERVIEW_INVITED") && <Button size="sm" icon="calendar" disabled={busy} onClick={() => { setSlot(blankSlot()); setDialog("schedule"); }}>schedule interview</Button>}
        {can("INTERVIEW_RESCHEDULED") && iv && <Button size="sm" variant="secondary" disabled={busy} onClick={() => { setSlot({ ...blankSlot(), startsAt: utcToKarachiInput(iv.startsAt), mode: iv.mode, meetingLink: iv.meetingLink, location: iv.location, note: iv.note }); setDialog("reschedule"); }}>reschedule</Button>}
        {can("INTERVIEW_CANCELLED") && iv && <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { if (await confirmDialog("cancel this interview? the candidate is told and their calendar entry is cancelled.")) act(() => careerApi.cancelInterview(iv.id, { version: v }), "interview cancelled"); }}>cancel interview</Button>}
        {(can("INTERVIEW_COMPLETED") || can("CANDIDATE_NO_SHOW_REPORTED")) && iv && <Button size="sm" disabled={busy} onClick={() => { setOutcome({ outcome: "completed", note: "" }); setDialog("complete"); }}>record outcome</Button>}
        {can("OFFER_SENT") && <Button size="sm" icon="send" disabled={busy} onClick={() => { setOffer({ title: t.job.title || "", terms: "", expiresOn: "" }); setDialog("offer"); }}>send offer</Button>}
        {can("OFFER_WITHDRAWN") && of && <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { if (await confirmDialog("withdraw this offer?")) act(() => careerApi.withdrawOffer(of.id, { version: v }), "offer withdrawn"); }}>withdraw offer</Button>}
        {can("HIRE_CONFIRMED") && of && <Button size="sm" icon="check" disabled={busy} onClick={async () => { if (await confirmDialog("confirm the hire? the candidate accepted your offer. this creates a verified 'Hired via TDC' record (private to them).")) act(() => careerApi.confirmHire(of.id, { version: v }), "hire confirmed"); }}>confirm hire</Button>}
        {can("REJECTED") && <Button size="sm" variant="secondary" disabled={busy} onClick={async () => { if (await confirmDialog("reject this candidate? they'll get a polite update.")) act(() => careerApi.event(applicationId, { type: "REJECTED", version: v }), "rejected"); }}>reject</Button>}
      </div>

      {iv && (
        <section className="k-card pad" style={{ marginBottom: 12 }}>
          <div className="k-card-head"><Ico kind="calendar" tone="purple" size={30} /><h3>interview</h3></div>
          <Facts rows={[
            ["status", iv.status.replace(/_/g, " ")],
            ["when (Karachi)", inKarachi(iv.startsAt)],
            ["how", iv.mode === "online" ? iv.meetingLink : iv.mode === "in-person" ? iv.location : "phone"],
            ["calendar version", String(iv.calendarSequence)],
          ]} />
          <Button size="sm" variant="secondary" icon="download" onClick={() => careerApi.downloadIcs(iv.id).catch((e) => toast(e.message, "bad"))}>download .ics</Button>
        </section>
      )}
      {of && (
        <section className="k-card pad" style={{ marginBottom: 12 }}>
          <div className="k-card-head"><Ico kind="send" tone="orange" size={30} /><h3>offer</h3></div>
          <Facts rows={[["role", of.title], ["status", of.status], ["answer by", inKarachi(of.expiresAt)], ["hire", of.verificationStatus === "verified" ? "verified" : of.verificationStatus === "revoked" ? "revoked" : "not confirmed"]]} />
        </section>
      )}

      <section className="k-card pad">
        <div className="k-card-head"><Ico kind="receipt" tone="blue" size={30} /><h3>timeline and audit</h3></div>
        {t.events.length === 0 && <p className="k-hint">no timeline yet: the first action starts it from the current status ({t.legacyStatus}).</p>}
        <ol style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {[...t.events].reverse().map((e) => (
            <li key={e.id} style={{ padding: "8px 0", borderTop: "1px solid var(--line-soft)" }}>
              <div style={{ fontWeight: 700 }}>{EVENT_LABEL[e.type] || e.type}</div>
              <div className="k-muted" style={{ fontSize: 12.5 }}>
                {inKarachi(e.occurredAt)} · by {e.actorRole}{e.source ? ` · ${e.source}` : ""} · v{e.seq}
              </div>
              {e.metadata?.startsAt && <div style={{ fontSize: 12.5 }}>slot: {inKarachi(e.metadata.startsAt)}</div>}
              {e.metadata?.note && <div style={{ fontSize: 12.5 }}>“{e.metadata.note}”</div>}
              {e.metadata?.internalNote && <div style={{ fontSize: 12.5 }} className="k-muted">internal: {e.metadata.internalNote}</div>}
            </li>
          ))}
        </ol>
      </section>

      <Modal
        open={dialog === "schedule" || dialog === "reschedule"}
        onClose={() => setDialog(null)}
        icon="calendar"
        tone="purple"
        title={dialog === "reschedule" ? "move the interview" : "schedule an interview"}
        sub="time in Asia/Karachi. the candidate gets the invite and a calendar file."
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>cancel</Button><Button loading={busy} onClick={() => act(() => (dialog === "reschedule" ? careerApi.reschedule(iv.id, slotBody()) : careerApi.schedule({ applicationId, ...slotBody() })), dialog === "reschedule" ? "interview moved" : "interview scheduled")}>{dialog === "reschedule" ? "move" : "send invite"}</Button></>}
      >
        <Field label="date and time (Karachi)" htmlFor="iv-when"><DateInput id="iv-when" withTime value={slot.startsAt} onChange={(e) => setSlot((s) => ({ ...s, startsAt: e.target.value }))} /></Field>
        <Field label="length (minutes)" htmlFor="iv-len"><Input id="iv-len" type="number" min={10} max={480} value={slot.durationMinutes} onChange={(e) => setSlot((s) => ({ ...s, durationMinutes: e.target.value }))} /></Field>
        <Field label="how" htmlFor="iv-mode">
          <Select id="iv-mode" value={slot.mode} onChange={(e) => setSlot((s) => ({ ...s, mode: e.target.value }))}>
            <option value="online">online</option><option value="in-person">in person</option><option value="phone">phone</option>
          </Select>
        </Field>
        {slot.mode === "online" && <Field label="meeting link" htmlFor="iv-link" hint="https:// only"><Input id="iv-link" value={slot.meetingLink} onChange={(e) => setSlot((s) => ({ ...s, meetingLink: e.target.value }))} placeholder="https://meet.google.com/..." /></Field>}
        {slot.mode === "in-person" && <Field label="address" htmlFor="iv-loc"><Input id="iv-loc" value={slot.location} onChange={(e) => setSlot((s) => ({ ...s, location: e.target.value }))} /></Field>}
        <Field label="note for the candidate" htmlFor="iv-note"><Textarea id="iv-note" rows={2} maxLength={1000} value={slot.note} onChange={(e) => setSlot((s) => ({ ...s, note: e.target.value }))} /></Field>
      </Modal>

      <Modal
        open={dialog === "complete"}
        onClose={() => setDialog(null)}
        icon="check"
        tone="green"
        title="record the interview"
        sub="the candidate is told and can dispute it. a no-show is a report only: nothing happens to them automatically."
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>cancel</Button><Button loading={busy} onClick={() => act(() => careerApi.complete(iv.id, { version: v, outcome: outcome.outcome, note: outcome.note }), "recorded")}>record</Button></>}
      >
        <Field label="what happened" htmlFor="iv-out">
          <Select id="iv-out" value={outcome.outcome} onChange={(e) => setOutcome((o) => ({ ...o, outcome: e.target.value }))}>
            {can("INTERVIEW_COMPLETED") && <option value="completed">the interview took place</option>}
            {can("CANDIDATE_NO_SHOW_REPORTED") && <option value="candidate_no_show">the candidate didn't join</option>}
          </Select>
        </Field>
        <Field label="note for the candidate (optional)" htmlFor="iv-out-note"><Textarea id="iv-out-note" rows={2} value={outcome.note} onChange={(e) => setOutcome((o) => ({ ...o, note: e.target.value }))} /></Field>
      </Modal>

      <Modal
        open={dialog === "offer"}
        onClose={() => setDialog(null)}
        icon="send"
        tone="orange"
        title="send an offer"
        sub="the candidate accepts or declines by the date. after they accept, you confirm the hire."
        footer={<><Button variant="secondary" onClick={() => setDialog(null)}>cancel</Button><Button loading={busy} disabled={!offer.expiresOn} onClick={() => act(() => careerApi.sendOffer({ applicationId, version: v, title: offer.title, terms: offer.terms, expiresAt: karachiToUtc(`${offer.expiresOn}T23:59`) }), "offer sent")}>send offer</Button></>}
      >
        <Field label="role" htmlFor="of-title"><Input id="of-title" maxLength={200} value={offer.title} onChange={(e) => setOffer((o) => ({ ...o, title: e.target.value }))} /></Field>
        <Field label="terms the candidate reads" htmlFor="of-terms" hint="e.g. start date, full time / part time"><Textarea id="of-terms" rows={3} maxLength={2000} value={offer.terms} onChange={(e) => setOffer((o) => ({ ...o, terms: e.target.value }))} /></Field>
        <Field label="answer by (end of day, Karachi)" htmlFor="of-exp"><DateInput id="of-exp" value={offer.expiresOn} onChange={(e) => setOffer((o) => ({ ...o, expiresOn: e.target.value }))} /></Field>
      </Modal>
    </Drawer>
  );
}
