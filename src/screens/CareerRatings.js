// CareerRatings.js: mutual ratings in the portal (FLAG_CAREER_RATINGS).
//   RateCandidate          in the candidate drawer: after a completed interview, and again after a verified hire,
//                          the employer rates the candidate once (communication, punctuality, preparation, 1-5)
//                          with an optional comment; within 14 days. Private: the candidate sees it only once
//                          they've rated too, or the window closed. Never shown to other employers.
//   EmployerRatingCard     on hiring results: the employer's own average from candidates (from 5 ratings), and
//                          the ratings anonymised, each reportable as unfair
//   RatingsReports         admin: reports of unfair ratings; hide or keep, with a reason (recorded)
// Each part renders nothing (or "not switched on") when ratings aren't on for the account.
import React, { useCallback, useEffect, useState } from "react";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Field, Textarea, Segmented, EmptyState, Pill, Table, Modal, toast } from "../portal/kit";
import ratingsApi from "../services/ratingsApi";
import { inKarachi } from "../services/careerApi";

const STARS = [1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }));
const KIND = { interview: "the interview", hire: "the hire" };
const stars = (n) => (n == null ? "–" : `${n} / 5`);

// ---------- the employer rates the candidate (candidate drawer) ----------
export function RateCandidate({ applicationId }) {
  const [d, setD] = useState(undefined);
  const [answers, setAnswers] = useState({});
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => ratingsApi.forApplication(applicationId).then(setD).catch(() => setD(null)), [applicationId]);
  useEffect(() => { load(); }, [load]);
  if (!d || !d.events.length) return null;
  const open = d.events.find((e) => e.open);
  const submit = async () => {
    setBusy(true);
    try {
      await ratingsApi.rate({ applicationId, kind: open.kind, ref: open.ref, answers, comment: comment.trim() });
      toast("rating saved: the candidate sees it once they've rated too, or after 14 days", "ok");
      setAnswers({}); setComment("");
      load();
    } catch (e) {
      toast(e.message, "bad");
    } finally {
      setBusy(false);
    }
  };
  const complete = open && d.questions.every((q) => answers[q.id]);
  return (
    <section className="k-card pad" style={{ marginBottom: 12 }} data-card="rate-candidate" aria-label="rate the candidate">
      <div className="k-card-head"><Ico kind="star" tone="yellow" size={30} /><h3>rate the candidate</h3></div>
      <p className="k-hint" style={{ marginTop: 0 }}>private: never shown to other employers, and the candidate sees it only after rating you too, or 14 days after {open ? KIND[open.kind] : "the event"}. no rating changes anything automatically.</p>
      {d.events.filter((e) => e.myRating).map((e) => (
        <p key={`${e.kind}:${e.ref}`} style={{ margin: "4px 0" }}>
          <Pill tone="green">rated</Pill> {KIND[e.kind]}: {d.questions.map((q) => `${q.label.toLowerCase()} ${stars(e.myRating.answers[q.id])}`).join(", ")}
          {e.myRating.comment && <span className="k-hint"> · “{e.myRating.comment}”</span>}
        </p>
      ))}
      {open ? (
        <>
          <h4 style={{ margin: "10px 0 6px" }}>{KIND[open.kind]} (until {inKarachi(open.windowEndsAt)})</h4>
          {d.questions.map((q) => (
            <div key={q.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }} id={`rq-${q.id}`}>{q.label}</div>
              <Segmented label={`${q.label}, 1 to 5 stars`} options={STARS} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
            </div>
          ))}
          <Field label={`comment (optional, ${300 - comment.length} characters left)`} htmlFor="rate-comment">
            <Textarea id="rate-comment" value={comment} maxLength={300} onChange={(e) => setComment(e.target.value)} placeholder="what went well, what could be better" />
          </Field>
          <Button loading={busy} disabled={!complete} onClick={submit}>save rating</Button>
        </>
      ) : (!d.events.some((e) => e.myRating) && <p className="k-hint">the rating window has closed.</p>)}
    </section>
  );
}

// ---------- the employer's own rating (hiring results) ----------
export function EmployerRatingCard() {
  const [d, setD] = useState(undefined);
  const [reporting, setReporting] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { ratingsApi.received().then(setD).catch(() => setD(null)); }, []);
  if (!d) return null;
  const send = async () => {
    setBusy(true);
    try {
      await ratingsApi.report(reporting.id, reason.trim());
      toast("reported: tdc will review it", "ok");
      setReporting(null);
    } catch (e) {
      toast(e.message, "bad");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="k-card pad" data-card="employer-rating" aria-label="your rating from candidates" style={{ gridColumn: "1 / -1" }}>
      <div className="k-card-head"><Ico kind="star" tone="yellow" size={30} /><h3>your rating from candidates</h3></div>
      {!d.shown ? (
        <p className="k-hint">shown from {d.minimum} ratings ({d.count} so far). students see your average on your jobs from then on; never comments.</p>
      ) : (
        <>
          <p style={{ margin: "0 0 6px" }}><strong>{d.average} / 5</strong> from {d.count} ratings (rounded to half a star)</p>
          <p className="k-hint" style={{ marginTop: 0 }}>{d.questions.map((q) => `${q.label.toLowerCase()} ${q.average}`).join(" · ")}</p>
          <Table label="ratings from candidates" rows={d.ratings} rowKey={(r) => r.id} minWidth={560}
            columns={[
              { key: "m", label: "month", render: (r) => r.month },
              { key: "k", label: "after", render: (r) => KIND[r.kind] },
              { key: "a", label: "communication / respect / clarity", render: (r) => `${r.answers.communication} / ${r.answers.respect} / ${r.answers.clarity}` },
              { key: "c", label: "comment", render: (r) => <span className="k-hint">{r.comment || "–"}</span> },
              { key: "x", label: "", render: (r) => <Button size="sm" variant="secondary" onClick={() => { setReporting(r); setReason(""); }} aria-label={`report the rating from ${r.month} as unfair`}>report</Button> },
            ]} />
        </>
      )}
      <Modal open={!!reporting} onClose={() => setReporting(null)} title="report this rating as unfair" sub="tdc reviews it and may hide it. the candidate isn't told who reported." icon="alert" tone="orange"
        footer={<><Button variant="secondary" onClick={() => setReporting(null)}>cancel</Button><Button loading={busy} disabled={reason.trim().length < 5} onClick={send}>report</Button></>}>
        <Field label="why is it unfair? (at least 5 characters)" htmlFor="report-reason"><Textarea id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </section>
  );
}

// ---------- admin: ratings reports ----------
const ROLE = { employer: "employer", candidate: "candidate" };
const ANSWERS = (a) => Object.entries(a || {}).map(([k, v]) => `${k} ${v}`).join(", ");
export function RatingsReports() {
  const [available, setAvailable] = useState(null);
  const [status, setStatus] = useState("open");
  const [rows, setRows] = useState(null);
  const [deciding, setDeciding] = useState(null); // { report, action }
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => ratingsApi.adminReports(status).then((d) => { setRows(d); setAvailable(true); }).catch((e) => {
    if (e.status === 404) setAvailable(false);
    else { toast(e.message, "bad"); setRows([]); setAvailable(true); }
  }), [status]);
  useEffect(() => { setRows(null); load(); }, [load]);
  const decide = async () => {
    setBusy(true);
    try {
      await ratingsApi.decide(deciding.report.id, { action: deciding.action, reason: reason.trim() });
      toast(deciding.action === "hide" ? "rating hidden" : "rating kept", "ok");
      setDeciding(null);
    } catch (e) {
      toast(e.message, "bad");
    } finally { setBusy(false); load(); }
  };
  if (available === null) return <PageLoading />;
  if (!available) return <div className="tdcp k-page"><EmptyState icon="star" tone="yellow" title="ratings aren't switched on" text="set FLAG_CAREER_RATINGS on the server for the pilot employers and students." /></div>;
  return (
    <div className="tdcp k-page" data-screen="ratings-reports">
      <PageHeader title="ratings reports" sub="someone said a rating about them is unfair. hide it (it stops counting) or keep it; your reason is recorded." />
      <Segmented label="report status" value={status} onChange={setStatus} options={[{ value: "open", label: "open" }, { value: "hidden", label: "hidden" }, { value: "kept", label: "kept" }]} />
      <div style={{ marginTop: 12 }}>
        <Table label="ratings reports" loading={!rows} rows={rows || []} rowKey={(r) => r.id} minWidth={980} empty={<EmptyState icon="check" tone="green" title="no reports here" />}
          columns={[
            { key: "who", label: "rating", render: (r) => <><strong>{r.rating?.rater.name || "?"}</strong> ({ROLE[r.rating?.raterRole]}) rated <strong>{r.rating?.ratee.name || "?"}</strong><div className="k-hint">{r.rating?.job.title} · after {KIND[r.rating?.kind]} · {inKarachi(r.rating?.createdAt)}</div></> },
            { key: "ans", label: "answers and comment", render: (r) => <>{ANSWERS(r.rating?.answers)}<div className="k-hint">{r.rating?.comment ? `“${r.rating.comment}”` : "no comment"}</div></> },
            { key: "why", label: "reported because", render: (r) => <>{r.reason}<div className="k-hint">by the {ROLE[r.reporterRole]} · {inKarachi(r.createdAt)}</div></> },
            { key: "st", label: "status", render: (r) => <><Pill tone={r.status === "open" ? "orange" : r.status === "hidden" ? "red" : "green"}>{r.status}</Pill>{r.decisionReason && <div className="k-hint">{r.decisionReason}</div>}</> },
            { key: "act", label: "", render: (r) => r.status === "open" && (
              <div style={{ display: "flex", gap: 6 }}>
                <Button size="sm" onClick={() => { setDeciding({ report: r, action: "hide" }); setReason(""); }} aria-label={`hide the rating by ${r.rating?.rater.name}`}>hide</Button>
                <Button size="sm" variant="secondary" onClick={() => { setDeciding({ report: r, action: "keep" }); setReason(""); }} aria-label={`keep the rating by ${r.rating?.rater.name}`}>keep</Button>
              </div>
            ) },
          ]} />
      </div>
      <Modal open={!!deciding} onClose={() => setDeciding(null)} icon="star" tone={deciding?.action === "hide" ? "red" : "green"}
        title={deciding ? (deciding.action === "hide" ? "hide this rating" : "keep this rating") : ""}
        sub={deciding?.action === "hide" ? "it stops counting in averages and isn't shown to anyone." : "it stays as it is; the report is closed."}
        footer={<><Button variant="secondary" onClick={() => setDeciding(null)}>cancel</Button><Button loading={busy} disabled={reason.trim().length < 5} onClick={decide}>{deciding?.action === "hide" ? "hide" : "keep"}</Button></>}>
        <Field label="reason (required, at least 5 characters)" htmlFor="decide-reason"><Textarea id="decide-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
