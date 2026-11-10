// CandidatePipeline.js: the employer's candidates as a Kanban on the hiring timeline (FLAG_CAREER_TIMELINE).
// Columns come from the server's state (Applied, Reviewed, Shortlisted, Interview, Offer, Hired, Rejected);
// a card opens the candidate: timeline, audit panel and the actions the server allows now (review,
// shortlist, reject, schedule / reschedule / cancel the interview, record its outcome, send / withdraw an
// offer, confirm the hire). Times are entered and shown in Asia/Karachi. Every action sends the version
// this screen saw: if someone else changed the candidate meanwhile, it reloads instead of overwriting.
// Candidate matching (FLAG_CAREER_MATCHING): a "match evidence" panel in the drawer and, for one job, an optional
// "sort by relevance" (newest first stays the default; nobody is hidden).
// Drag and drop (native HTML5, no library): dropping a card on a column asks for the same transition its button
// would (reviewed, shortlisted, rejected directly; interview, offer and hired open the candidate with that dialog).
// A move the candidate can't make from where they are snaps back with the reason; the server decides either way,
// and the board only changes after it has. The buttons stay for keyboard and screen-reader users.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Select, DateInput, Drawer, Modal, EmptyState, Pill, Facts, toast, confirmDialog } from "../portal/kit";
import careerApi, { karachiToUtc, utcToKarachiInput, inKarachi } from "../services/careerApi";
import resumeStudioApi from "../services/resumeStudioApi";
import MatchEvidence from "./MatchEvidence";
import useFlagsMe from "../portal/useFlagsMe";
import { RateCandidate } from "./CareerRatings";

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
// what dropping on a column asks for: the event its button sends (null: no button moves a candidate there)
const DROP = { applied: null, reviewed: "REVIEWED", shortlisted: "SHORTLISTED", interview: "INTERVIEW_INVITED", offer: "OFFER_SENT", hired: "HIRE_CONFIRMED", rejected: "REJECTED" };
const WITH_DIALOG = new Set(["INTERVIEW_INVITED", "OFFER_SENT", "HIRE_CONFIRMED"]);
const labelOf = (stage) => (COLUMNS.find((c) => c.stage === columnOf(stage)) || {}).label || stage;
export const EVENT_LABEL = {
  APPLIED: "applied", LEGACY_STATUS: "status before the timeline", REVIEWED: "reviewed", SHORTLISTED: "shortlisted", REJECTED: "rejected", WITHDRAWN: "withdrew",
  INTERVIEW_INVITED: "interview invited", INTERVIEW_RESCHEDULED: "interview moved", INTERVIEW_CANCELLED: "interview cancelled", INTERVIEW_ACCEPTED: "interview accepted",
  INTERVIEW_DECLINED: "interview declined", INTERVIEW_RESCHEDULE_REQUESTED: "asked for another time", INTERVIEW_COMPLETED: "interview completed",
  CANDIDATE_NO_SHOW_REPORTED: "candidate no-show reported", EMPLOYER_NO_SHOW_REPORTED: "employer no-show reported", INTERVIEW_DISPUTED: "interview disputed",
  OFFER_SENT: "offer sent", OFFER_WITHDRAWN: "offer withdrawn", OFFER_ACCEPTED: "offer accepted", OFFER_DECLINED: "offer declined", OFFER_EXPIRED: "offer expired",
  HIRE_CONFIRMED: "hire confirmed (verified)", HIRE_DISPUTED: "hire disputed", HIRE_REVOKED: "hire revoked by tdc", HIRE_RESTORED: "hire restored by tdc (dispute rejected)",
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
  const [openAction, setOpenAction] = useState(null); // a dialog to open with the candidate (from a drop)
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const [moving, setMoving] = useState(false);
  const flags = useFlagsMe() || {}; // refreshed on focus (matching can be switched on while the page is open)
  // order within each column: newest (default) or relevance (one job at a time, from the matching estimates)
  const [order, setOrder] = useState("newest");
  const [matches, setMatches] = useState(null); // { applicationId: { rank, match } }
  useEffect(() => {
    if (order !== "relevance" || !jobId || !flags.careerMatching) { setMatches(null); return; }
    let alive = true;
    careerApi.jobMatches(jobId, "relevance")
      .then((d) => alive && setMatches(Object.fromEntries(d.applications.map((a, i) => [a.applicationId, { rank: i, match: a.match }]))))
      .catch((e) => { if (alive) { toast(e.message, "bad"); setOrder("newest"); } });
    return () => { alive = false; };
  }, [order, jobId, flags.careerMatching]);
  useEffect(() => { if (!jobId) setOrder("newest"); }, [jobId]);

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
    if (matches) for (const k of Object.keys(m)) m[k].sort((x, y) => (matches[x.applicationId]?.rank ?? 1e9) - (matches[y.applicationId]?.rank ?? 1e9));
    return m;
  }, [data, matches]);

  // a card dropped on a column: the same transition as the button, checked against what the server allows now
  const drop = async (a, stage) => {
    setDragging(null); setOver(null);
    if (!a || columnOf(a.stage) === stage) return;
    const type = DROP[stage];
    const name = a.candidateName || "this candidate";
    if (!type || !a.nextAllowedActions.includes(type)) {
      toast(`${name} can't move from ${labelOf(a.stage)} to ${labelOf(stage)}${!type ? "" : `: ${(a.nextAllowedActions.length ? "allowed now: " + a.nextAllowedActions.map((x) => x.toLowerCase().replace(/_/g, " ")).join(", ") : "no next step from here")}`}`, "bad");
      return;
    }
    if (WITH_DIALOG.has(type)) { setOpenAction(type); setOpenId(a.applicationId); return; }
    if (type === "REJECTED" && !(await confirmDialog(`reject ${name}? they'll get a polite update.`))) return;
    setMoving(true);
    try {
      await careerApi.event(a.applicationId, { type, version: a.version });
      toast(`${name}: ${labelOf(stage).toLowerCase()}`, "ok");
    } catch (err) {
      toast(err.code === "VERSION_CONFLICT" ? "someone changed this candidate meanwhile; reloaded" : err.message, "bad");
    } finally {
      setMoving(false);
      load();
    }
  };

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
            {flags.careerMatching && (
              <Select aria-label="order" value={order} onChange={(e) => setOrder(e.target.value)} disabled={!jobId} title={jobId ? "" : "pick a job to sort by relevance"} style={{ minWidth: 170 }}>
                <option value="newest">newest first</option>
                <option value="relevance">sort by relevance</option>
              </Select>
            )}
            {onClassic && <Button variant="secondary" onClick={onClassic}>classic list</Button>}
          </>
        )}
      />
      {(data.applications || []).length === 0 ? (
        <EmptyState icon="users" tone="blue" title="no applicants yet" text="applications to your jobs appear here." />
      ) : (
        <>
        <p className="k-hint" style={{ margin: "0 0 8px" }}>drag a card to another column, or open it to use the buttons.</p>
        <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(220px, 1fr)", gap: 12, overflowX: "auto", paddingBottom: 8, opacity: moving ? 0.6 : 1 }} role="list" aria-label="candidates by stage" aria-busy={moving}>
          {COLUMNS.map((col) => (
            <section
              key={col.stage}
              className="k-card pad"
              data-column={col.stage}
              style={{ minHeight: 160, background: "var(--sand)", outline: over === col.stage ? "2px dashed var(--ink)" : "none", outlineOffset: -4 }}
              role="listitem"
              aria-label={`${col.label}: ${byColumn[col.stage].length}`}
              onDragOver={(e) => { if (dragging) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (over !== col.stage) setOver(col.stage); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver((o) => (o === col.stage ? null : o)); }}
              onDrop={(e) => { e.preventDefault(); drop(dragging, col.stage); }}
            >
              <div className="k-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15 }}>{col.label}</h3>
                <Pill tone={col.tone}>{byColumn[col.stage].length}</Pill>
              </div>
              {byColumn[col.stage].map((a) => (
                <button
                  type="button"
                  key={a.applicationId}
                  draggable={a.careerEnabled && !moving}
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", a.applicationId); setDragging(a); }}
                  onDragEnd={() => { setDragging(null); setOver(null); }}
                  onClick={() => (a.careerEnabled ? setOpenId(a.applicationId) : toast("this candidate isn't in the timeline pilot yet: use the classic list"))}
                  className="k-card"
                  style={{ display: "block", width: "100%", textAlign: "left", padding: 12, marginBottom: 8, background: "var(--card)", border: "1px solid var(--line)", cursor: "pointer" }}
                  aria-label={`${a.candidateName}, ${a.jobTitle}, ${col.label}`}
                >
                  <div style={{ fontWeight: 700 }}>{a.candidateName || "candidate"}</div>
                  <div className="k-muted" style={{ fontSize: 12.5 }}>{a.jobTitle} · applied {new Date(a.appliedAt).toLocaleDateString("en-GB")}</div>
                  {subline(a) && <div style={{ fontSize: 12.5, marginTop: 4 }}>{subline(a)}</div>}
                  {matches && matches[a.applicationId]?.match && <div className="k-hint" style={{ fontSize: 12, marginTop: 4 }}>{matches[a.applicationId].match.label}</div>}
                  {!a.careerEnabled && <Pill tone="sand">classic flow</Pill>}
                </button>
              ))}
            </section>
          ))}
        </div>
        </>
      )}
      {openId && <CandidateDetail applicationId={openId} initialAction={openAction} onClose={() => { setOpenId(null); setOpenAction(null); }} onChanged={load} />}
    </div>
  );
}

function CandidateDetail({ applicationId, initialAction = null, onClose, onChanged }) {
  const navigate = useNavigate();
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
  // the tailored resume the candidate sent with this application (Resume Studio), if any: exactly that snapshot
  const [sentResume, setSentResume] = useState(null);
  useEffect(() => { resumeStudioApi.attachedResume(applicationId).then(setSentResume).catch(() => setSentResume(null)); }, [applicationId]);

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
  // opened by a drop on the interview / offer / hired column: the same dialog the button opens
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (!t || started || !initialAction) return;
    setStarted(true);
    if (!t.nextAllowedActions.includes(initialAction)) { toast("that step isn't possible any more; reloaded", "bad"); return; }
    if (initialAction === "INTERVIEW_INVITED") { setSlot(blankSlot()); setDialog("schedule"); }
    else if (initialAction === "OFFER_SENT") { setOffer({ title: t.job.title || "", terms: "", expiresOn: "" }); setDialog("offer"); }
    else if (initialAction === "HIRE_CONFIRMED" && t.offerDetails) {
      confirmDialog("confirm the hire? the candidate accepted your offer. this creates a verified 'Hired via TDC' record (private to them).")
        .then((yes) => yes && act(() => careerApi.confirmHire(t.offerDetails.id, { version: t.version }), "hire confirmed"));
    }
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps
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
        <Button size="sm" variant="secondary" icon="users" onClick={() => navigate(`/candidate/${applicationId}`)}>full profile</Button>
      </div>

      <MatchEvidence applicationId={applicationId} />
      <RateCandidate applicationId={applicationId} />
      {sentResume && (
        <section className="k-card pad" style={{ marginBottom: 12 }}>
          <div className="k-card-head"><Ico kind="file" tone="blue" size={30} /><h3>resume sent with this application</h3></div>
          <Facts rows={[
            ["version", sentResume.label || "tailored resume"],
            ["sent", inKarachi(sentResume.attachedAt)],
            ["snapshot", String(sentResume.contentHash || "").slice(0, 12)],
          ]} />
          <p className="k-hint">the candidate approved this exact version for your job; it can't change after it was sent.</p>
          <Button size="sm" variant="secondary" icon="download" onClick={() => resumeStudioApi.downloadAttachedResume(applicationId, `${t.job.title || "candidate"} resume`).catch((e) => toast(e.message, "bad"))}>download pdf</Button>
        </section>
      )}
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
