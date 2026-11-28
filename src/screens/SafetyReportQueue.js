import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAdminCan } from "../portal/adminAccess";
import { Button, Card, Field, Pill, Select, Textarea } from "../portal/kit";

const URL = "/admin/safety-reports";
const STATUSES = { pending: "Pending", under_review: "Under review", resolved: "Resolved" };
const REASONS = {
  child_exploitation: "Child sexual abuse or exploitation",
  child_grooming: "Child grooming or inappropriate contact",
  harassment: "Harassment or bullying",
  violence: "Threats or violence",
  sexual_content: "Inappropriate sexual content",
  other: "Other safety concern",
};
const errorMessage = (error) => error.response?.data?.message || "Could not complete the request. Please try again.";

export default function SafetyReportQueue() {
  const can = useAdminCan();
  const [status, setStatus] = useState("pending");
  const [child, setChild] = useState(false);
  const [queue, setQueue] = useState(null);
  const [revision, setRevision] = useState(0);
  const [report, setReport] = useState(null);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setQueue(null);
    setError("");
    api.get(URL, { params: { status, child } })
      .then(({ data }) => { if (active) setQueue(data); })
      .catch((err) => { if (active) setError(errorMessage(err)); });
    return () => { active = false; };
  }, [status, child, revision]);

  async function open(id) {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.get(`${URL}/${id}`);
      setDecision({ status: data.status, escalation: data.escalation, assign: false, authorityConfirmed: false, note: "", action: "review", version: data.__v });
      setReport(data);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  function change(key, value) { setDecision((prev) => ({ ...prev, [key]: value })); }
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api.patch(`${URL}/${report._id}`, decision);
      setReport(null);
      setRevision((value) => value + 1);
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }

  return <Card>
    <h2>Safety concerns</h2>
    <label><input type="checkbox" checked={child} disabled={busy} onChange={(event) => { setReport(null); setChild(event.target.checked); }} /> Child safety only</label>
    <Field label="Status" htmlFor="intake-status">
      <Select id="intake-status" disabled={busy} value={status} onChange={(event) => { setReport(null); setStatus(event.target.value); }}>
        {Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}{queue ? ` (${queue.counts[value]})` : ""}</option>)}
      </Select>
    </Field>
    {queue && (queue.items.length ? <ul>{queue.items.map((row) => <li key={row._id}>
      <Button disabled={busy} onClick={() => open(row._id)}>{REASONS[row.reason]} · {row.targetType}</Button>{" "}
      <Pill tone={row.priority ? "red" : "sand"}>{["Normal", "High", "Urgent"][row.priority]}</Pill>
    </li>)}</ul> : <p>No reports in this view.</p>)}
    {error && <p role="alert">{error} {!report && <Button onClick={() => setRevision((value) => value + 1)}>Retry</Button>}</p>}
    {report && <section aria-label="Report details">
      <h3>{REASONS[report.reason]}</h3>
      <p>Report {report._id} · {report.targetType} · {report.targetId}</p>
      <p style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{report.description}</p>
      {report.reference && <p style={{ overflowWrap: "anywhere" }}>Reference {report.reference}</p>}
      <p>Assigned moderator {report.assignedModerator || "Unassigned"}</p>
      <p>Authority escalation {report.escalation}</p>
      <h4>Action history</h4>
      <ul>{report.history.map((entry, index) => <li key={index}>{new Date(entry.at).toLocaleString()} · {entry.action} · {entry.status} · {entry.escalation || "none"}{entry.note ? ` · ${entry.note}` : ""}</li>)}</ul>
      {can("safety.intake.act") && <form onSubmit={save}>
        <fieldset disabled={busy}>
          <Field label="Status" htmlFor="intake-decision">
            <Select id="intake-decision" value={decision.status} onChange={(event) => change("status", event.target.value)}>
              {Object.entries(STATUSES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </Field>
          <label><input type="checkbox" checked={decision.assign} onChange={(event) => change("assign", event.target.checked)} /> Assign to me</label>
          <Field label="Moderation action" htmlFor="intake-action">
            <Select id="intake-action" value={decision.action} onChange={(event) => change("action", event.target.value)}>
              <option value="review">Record review</option>
              {["Confession", "ConfessionComment"].includes(report.targetType) && <option value="restrict">Restrict access</option>}
              {["Post", "Comment", "Confession", "ConfessionComment", "Message"].includes(report.targetType) && <option value="remove">Remove content</option>}
              {report.targetType !== "General" && can("students.suspend") && <><option value="suspend">Suspend account for 24 hours</option><option value="ban">Ban account</option></>}
            </Select>
          </Field>
          <Field label="Authority escalation" htmlFor="intake-escalation">
            <Select id="intake-escalation" value={decision.escalation} onChange={(event) => { change("escalation", event.target.value); change("authorityConfirmed", false); }}>
              <option value="none">None</option><option value="planned">Planned</option><option value="reported">Reported externally</option>
            </Select>
          </Field>
          {decision.escalation === "reported" && report.escalation !== "reported" &&
            <label><input required type="checkbox" checked={decision.authorityConfirmed} onChange={(event) => change("authorityConfirmed", event.target.checked)} /> An authorized responder completed the external report</label>}
          <Field label="Moderator notes" htmlFor="intake-note">
            <Textarea id="intake-note" required maxLength={1000} value={decision.note} onChange={(event) => change("note", event.target.value)} />
          </Field>
          <Button type="submit" disabled={busy || !decision.note.trim()}>{busy ? "Saving" : "Save decision"}</Button>
        </fieldset>
      </form>}
      <Button disabled={busy} onClick={() => { setReport(null); setError(""); }}>Close details</Button>
    </section>}
  </Card>;
}
