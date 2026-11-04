// HireDisputes.js: admin page for open hire disputes (FLAG_CAREER_TIMELINE). A candidate disputed a verified
// hire; an admin reads the application's timeline and decides, with a required reason (written to the timeline
// and the admin audit):
//   restore  the dispute is rejected: the hire is verified again and can't be disputed again (HIRE_RESTORED)
//   revoke   the dispute is upheld: the hire stays revoked (HIRE_REVOKED)
// Shown only when the server has the hiring timeline set up (GET /career/admin/disputes answers).
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Textarea, EmptyState, Pill, Table, Modal, toast } from "../portal/kit";
import { careerApi, inKarachi } from "../services/careerApi";
import { EVENT_LABEL } from "./CandidatePipeline";

const MIN_REASON = 5;
const ACTION = {
  HIRE_RESTORED: { label: "restore the hire", done: "hire restored: the dispute was rejected" },
  HIRE_REVOKED: { label: "revoke the hire", done: "hire revoked: the dispute was upheld" },
};
const ROLE = { candidate: "candidate", employer: "employer", admin: "tdc", system: "system" };

export default function HireDisputes() {
  const [available, setAvailable] = useState(null);
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(null); // the dispute being reviewed
  const [tl, setTl] = useState(null); // its timeline
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(() => careerApi.adminDisputes().then((d) => { setRows(d.disputes); setAvailable(true); }).catch((e) => {
    if (e.status === 404) setAvailable(false);
    else { toast(e.message, "bad"); setRows([]); setAvailable(true); }
  }), []);
  useEffect(() => { load(); }, [load]);
  const review = (d) => {
    setOpen(d); setReason(""); setTl(null);
    careerApi.timeline(d.applicationId).then(setTl).catch((e) => { toast(e.message, "bad"); setOpen(null); });
  };
  const decide = async (type) => {
    setBusy(type);
    try {
      await careerApi.event(open.applicationId, { type, version: tl.version, note: reason.trim() });
      toast(ACTION[type].done, "ok");
      setOpen(null);
    } catch (e) {
      toast(e.code === "VERSION_CONFLICT" ? "this application changed meanwhile: reopen it and decide again" : e.message, "bad");
    } finally { setBusy(""); load(); }
  };

  if (available === null) return <PageLoading />;
  if (!available) return <div className="tdcp k-page"><EmptyState icon="briefcase" tone="coral" title="the hiring timeline isn't switched on" text="set FLAG_CAREER_TIMELINE on the server for the pilot employers and students." /></div>;
  const ready = reason.trim().length >= MIN_REASON;
  return (
    <div className="tdcp k-page" data-screen="hire-disputes">
      <PageHeader title="hire disputes" sub="a candidate disputed a verified hire. read the timeline, then restore the hire (dispute rejected) or revoke it (dispute upheld). your reason is recorded." />
      <Table label="open hire disputes" loading={!rows} rows={rows || []} rowKey={(r) => r.applicationId} minWidth={900}
        empty={<EmptyState icon="check" tone="green" title="no open disputes" text="disputes appear here when a candidate disputes a verified hire." />}
        columns={[
          { key: "job", label: "job", render: (r) => <><strong>{r.job.title || "job"}</strong><div className="k-hint">{r.job.company}</div></> },
          { key: "candidate", label: "candidate", render: (r) => r.candidate.name || "candidate" },
          { key: "employer", label: "employer", render: (r) => r.employer.name || "–" },
          { key: "hired", label: "hire confirmed", render: (r) => inKarachi(r.hireConfirmedAt) },
          { key: "disputed", label: "disputed", render: (r) => <>{inKarachi(r.disputedAt)}<div className="k-hint">{r.reason || "no reason given"}</div></> },
          { key: "status", label: "status", render: (r) => (r.resolvable ? <Pill tone="red">open</Pill> : <Pill tone="sand">timeline switched off</Pill>) },
          { key: "act", label: "", render: (r) => <Button size="sm" disabled={!r.resolvable} onClick={() => review(r)} aria-label={`review the dispute for ${r.job.title || "this job"}, ${r.candidate.name || "candidate"}`}>review</Button> },
        ]} />
      <Modal open={!!open} onClose={() => setOpen(null)} icon="alert" tone="red"
        title={open ? `dispute: ${open.job.title || "job"}` : ""}
        sub={open ? `${open.candidate.name || "the candidate"} disputed the hire by ${open.employer.name || "the employer"}. restoring makes it verified again (it can't be disputed again); revoking keeps it revoked.` : ""}
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(null)}>cancel</Button>
          <Button variant="secondary" loading={busy === "HIRE_REVOKED"} disabled={!tl || !ready || !!busy} onClick={() => decide("HIRE_REVOKED")}>{ACTION.HIRE_REVOKED.label}</Button>
          <Button loading={busy === "HIRE_RESTORED"} disabled={!tl || !ready || !!busy} onClick={() => decide("HIRE_RESTORED")}>{ACTION.HIRE_RESTORED.label}</Button>
        </>}>
        {open && (
          <>
            <p className="k-hint" style={{ marginTop: 0 }}>the candidate's reason: <strong>{open.reason || "none given"}</strong></p>
            <h4 style={{ margin: "12px 0 6px" }}>timeline</h4>
            {!tl ? <PageLoading /> : (
              <ol style={{ margin: 0, paddingLeft: 18, maxHeight: 260, overflowY: "auto" }} aria-label="application timeline" tabIndex={0}>
                {tl.events.map((e) => (
                  <li key={e.id} style={{ marginBottom: 6 }}>
                    <strong>{EVENT_LABEL[e.type] || e.type.toLowerCase().replace(/_/g, " ")}</strong>
                    <span className="k-hint"> · {ROLE[e.actorRole] || e.actorRole} · {inKarachi(e.occurredAt)}</span>
                    {e.metadata?.note && <div className="k-hint">“{e.metadata.note}”</div>}
                  </li>
                ))}
              </ol>
            )}
            <Field label={`your reason (required, at least ${MIN_REASON} characters)`} htmlFor="dispute-reason">
              <Textarea id="dispute-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. employer sent the signed contract and first payslip (ticket 77)" />
            </Field>
          </>
        )}
      </Modal>
    </div>
  );
}
