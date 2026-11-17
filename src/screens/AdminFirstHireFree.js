// AdminFirstHireFree.js: admin pages for First Hire Free (FLAG_EMPLOYER_FIRST_HIRE_FREE).
//   CompanyVerifications  the review queue for every employer (not only the pilot): company details, hints
//                         (sign-in e-mail on the domain, website on the domain), possible duplicates and what
//                         matched, the proof given (own e-mail domain, website, documents: "open" fetches the file
//                         for this admin only), and the employer's jobs waiting for it; approve (publishes those jobs) /
//                         reject / request info / mark duplicate, each with a required reason (shown to the employer,
//                         written to the audit)
//   FreeHireTrials        every company's trial: status, which hire used it, the company's accounts; restore /
//                         revoke / keep with a reason; and the billing ledger (records only: nothing is charged)
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Textarea, Select, Checkbox, Tabs, EmptyState, Pill, Table, Modal, toast } from "../portal/kit";
import trialApi, { TRIAL_LABEL, TRIAL_TONE, VERIFICATION_LABEL, VERIFICATION_TONE, BILLING_LABEL, DOCUMENT_KIND_LABEL, pkDate } from "../services/trialApi";
import hiringAccessApi from "../services/hiringAccessApi";

function useAvailable() {
  const [ok, setOk] = useState(null);
  useEffect(() => { trialApi.adminAvailable().then(setOk); }, []);
  return ok;
}
const Off = () => <div className="tdcp k-page"><EmptyState icon="gift" tone="green" title="first hire free isn't switched on" text="set FLAG_EMPLOYER_FIRST_HIRE_FREE on the server to start the pilot." /></div>;

// ---------- company verifications ----------
const ACTION_LABEL = { approve: "approve", reject: "reject", request_info: "request info", mark_duplicate: "mark as duplicate" };
// an uploaded document: fetched with the admin's sign-in and opened from memory in a new tab (no public link);
// when the browser blocks the new tab, it's saved as a file instead (this page stays where it is)
async function openDocument(verificationId, doc) {
  const win = window.open("", "_blank");
  try {
    const blob = await hiringAccessApi.openDocument(verificationId, doc.id);
    const url = URL.createObjectURL(blob);
    if (win && !win.closed) win.location.href = url;
    else {
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    if (win) win.close();
    toast("couldn't open the document", "bad");
  }
}
export function CompanyVerifications() {
  const [available, setAvailable] = useState(null);
  useEffect(() => { hiringAccessApi.companyAvailable().then(setAvailable); }, []);
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState(null);
  const [review, setReview] = useState(null); // { v, action }
  const [reason, setReason] = useState("");
  const [separate, setSeparate] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => hiringAccessApi.companyVerifications(status).then((d) => setRows(Array.isArray(d) ? d : [])).catch((e) => { toast(e.message, "bad"); setRows([]); }), [status]);
  useEffect(() => { if (available) { setRows(null); load(); } }, [available, load]);
  const decide = async () => {
    setBusy(true);
    try {
      const d = await hiringAccessApi.reviewCompany(review.v.id, { action: review.action, reason, separateGroup: review.action === "approve" && separate });
      toast(review.action === "approve" && d?.publishedJobs ? `approved: ${d.publishedJobs} job${d.publishedJobs === 1 ? " is" : "s are"} live now` : `${ACTION_LABEL[review.action]}: done`, "ok");
      setReview(null);
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); load(); }
  };
  if (available === null) return <PageLoading />;
  if (!available) return <div className="tdcp k-page" data-screen="company-verifications"><PageHeader title="company verifications" /><EmptyState icon="shield" tone="blue" title="couldn't load company verifications" text="try again in a moment." /></div>;
  return (
    <div className="tdcp k-page" data-screen="company-verifications">
      <PageHeader title="company verifications" sub="a company's jobs go live once it's verified. check the registration number, the e-mail domain and the website." />
      <Select aria-label="status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 240, marginBottom: 12 }}>
        <option value="pending">to check</option><option value="duplicate_review">possible duplicates</option><option value="approved">verified</option><option value="needs_info">needs info</option><option value="rejected">not approved</option><option value="all">all</option>
      </Select>
      <Table loading={!rows} rows={rows || []} rowKey={(r) => r.id} minWidth={980} empty={<EmptyState icon="check" tone="green" title="nothing here" />}
        columns={[
          { key: "company", label: "company", render: (r) => <><strong>{r.companyName}</strong><div className="k-hint">{r.employer.name} · {r.employer.email}</div></> },
          { key: "reg", label: "registration", render: (r) => <>{r.registrationType.toUpperCase()} {r.ntnOrSecp}</> },
          { key: "domain", label: "e-mail domain / website", render: (r) => <>{r.businessEmailDomain || <span className="k-hint">no own domain</span>}<div className="k-hint">{r.website || "no website"}</div>{r.businessEmailDomain && <div className="k-hint">{r.hints.signInEmailMatchesDomain ? "sign-in e-mail on this domain" : "sign-in e-mail NOT on this domain"}{r.website ? ` · ${r.hints.websiteMatchesDomain ? "website matches" : "website differs"}` : ""}</div>}</> },
          { key: "proof", label: "proof given", render: (r) => (
            <div data-proof={r.id}>
              <div className="k-hint">{[r.proof?.emailDomain && "own e-mail domain", r.proof?.website && "website", r.proof?.documents && `${r.proof.documents} document${r.proof.documents === 1 ? "" : "s"}`].filter(Boolean).join(" · ") || "none"}</div>
              {(r.documents || []).map((x) => <div key={x.id}><Button size="sm" variant="secondary" icon="file" onClick={() => openDocument(r.id, x)} aria-label={`open ${DOCUMENT_KIND_LABEL[x.kind] || x.kind} of ${r.companyName}`}>{DOCUMENT_KIND_LABEL[x.kind] || x.kind}</Button></div>)}
            </div>
          ) },
          { key: "dup", label: "possible duplicate of", render: (r) => (r.duplicateOf.length ? r.duplicateOf.map((d) => <div key={d.verificationId}><Pill tone="orange">{d.employer.name || "another account"}</Pill> <span className="k-hint">same {d.matchedOn.join(", ")}</span></div>) : "–") },
          { key: "jobs", label: "jobs waiting", render: (r) => ((r.pendingJobs || []).length ? <><Pill tone="yellow">{r.pendingJobs.length} waiting</Pill>{r.pendingJobs.slice(0, 3).map((j) => <div key={j.id} className="k-hint">{j.title}</div>)}{r.pendingJobs.length > 3 && <div className="k-hint">+{r.pendingJobs.length - 3} more</div>}</> : "–") },
          { key: "status", label: "status", render: (r) => <><Pill tone={VERIFICATION_TONE[r.status]}>{VERIFICATION_LABEL[r.status]}</Pill>{r.reason && <div className="k-hint">{r.reason}</div>}</> },
          { key: "act", label: "", render: (r) => (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {r.status !== "approved" && <Button size="sm" onClick={() => { setReview({ v: r, action: "approve" }); setReason(""); setSeparate(false); }}>approve</Button>}
              {r.status !== "rejected" && <Button size="sm" variant="secondary" onClick={() => { setReview({ v: r, action: "reject" }); setReason(""); }}>reject</Button>}
              {!["approved", "needs_info"].includes(r.status) && <Button size="sm" variant="secondary" onClick={() => { setReview({ v: r, action: "request_info" }); setReason(""); }}>request info</Button>}
              {r.status === "pending" && <Button size="sm" variant="secondary" onClick={() => { setReview({ v: r, action: "mark_duplicate" }); setReason(""); }}>duplicate</Button>}
            </div>
          ) },
        ]} />
      <Modal open={!!review} onClose={() => setReview(null)} title={review ? `${ACTION_LABEL[review.action]}: ${review.v.companyName}` : ""}
        sub={review?.action === "approve" && review.v.duplicateOf.length ? "this account matches another one: approving puts it in the same company (one free hire between them)." : review?.action === "request_info" ? "say what's missing (e.g. a clearer NTN scan): the employer sees it and sends the details again." : review?.action === "approve" && (review.v.pendingJobs || []).length ? `approving puts their ${review.v.pendingJobs.length} waiting job${review.v.pendingJobs.length === 1 ? "" : "s"} live. the employer sees your reason; it's recorded in the audit.` : "the employer sees your reason. it's recorded in the audit."}
        icon="shield" tone={review?.action === "reject" ? "red" : "blue"}
        footer={<><Button variant="secondary" onClick={() => setReview(null)}>cancel</Button><Button loading={busy} disabled={reason.trim().length < 3} onClick={decide}>{review ? ACTION_LABEL[review.action] : ""}</Button></>}>
        <Field label="reason (required)" htmlFor="cv-reason"><Textarea id="cv-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. NTN checked on FBR; domain owned by the company" /></Field>
        {review?.action === "approve" && review.v.duplicateOf.length > 0 && <Checkbox label="it's a different company (only possible with a different registration number)" checked={separate} onChange={(e) => setSeparate(e.target.checked)} />}
      </Modal>
    </div>
  );
}

// ---------- trials + ledger ----------
const TRIAL_ACTION = { restore: "restore the free hire", revoke: "revoke the free hire", keep: "keep as it is" };
export function FreeHireTrials() {
  const available = useAvailable();
  const [tab, setTab] = useState("trials");
  const [status, setStatus] = useState("all");
  const [data, setData] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [ledgerType, setLedgerType] = useState("");
  const [review, setReview] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => trialApi.trials(status).then(setData).catch((e) => { toast(e.message, "bad"); setData({ trials: [] }); }), [status]);
  const loadLedger = useCallback(() => trialApi.billingEvents(ledgerType ? { eventType: ledgerType } : {}).then(setLedger).catch((e) => { toast(e.message, "bad"); setLedger([]); }), [ledgerType]);
  useEffect(() => { if (available && tab === "trials") { setData(null); load(); } }, [available, tab, load]);
  useEffect(() => { if (available && tab === "ledger") { setLedger(null); loadLedger(); } }, [available, tab, loadLedger]);
  const decide = async () => {
    setBusy(true);
    try {
      await trialApi.reviewTrial(review.t.id, { action: review.action, reason });
      toast("saved", "ok");
      setReview(null);
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); load(); }
  };
  if (available === null) return <PageLoading />;
  if (!available) return <Off />;
  return (
    <div className="tdcp k-page" data-screen="free-hire-trials">
      <PageHeader title="first hire free" sub="consumed only by a verified hire (offer accepted + employer confirmed). nothing is charged: the ledger only records." />
      <Tabs label="first hire free" value={tab} onChange={setTab} tabs={[{ id: "trials", label: "trials", icon: "gift" }, { id: "ledger", label: "billing ledger", icon: "receipt" }]} />
      <div style={{ marginTop: 16 }}>
        {tab === "trials" && (
          <>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
              <Select aria-label="trial status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 220 }}>
                <option value="all">every trial</option><option value="active">active</option><option value="used">used</option><option value="under_review">under review</option>
              </Select>
              {data && <Pill tone={data.suspectedDuplicates ? "orange" : "sand"}>{data.suspectedDuplicates} suspected duplicate account{data.suspectedDuplicates === 1 ? "" : "s"}</Pill>}
            </div>
            <Table loading={!data} rows={data?.trials || []} rowKey={(r) => r.id} minWidth={900} empty={<EmptyState icon="gift" title="no trials yet" />}
              columns={[
                { key: "company", label: "company", render: (r) => <><strong>{r.companyName}</strong><div className="k-hint">{r.employers.map((e) => e.name).join(", ")}</div></> },
                { key: "status", label: "status", render: (r) => <><Pill tone={TRIAL_TONE[r.status]}>{TRIAL_LABEL[r.status]}</Pill>{r.reviewReason && <div className="k-hint">{r.reviewReason}</div>}</> },
                { key: "used", label: "used by", render: (r) => (r.usedBy ? <>{r.usedBy.job}<div className="k-hint">{r.usedBy.candidateFirstName} · {pkDate(r.consumedAt)}</div></> : "–") },
                { key: "left", label: "free hires left", render: (r) => (r.status === "active" ? r.entitlementCount - r.consumedCount : 0) },
                { key: "dups", label: "suspected duplicates", render: (r) => r.suspectedDuplicates || "–" },
                { key: "act", label: "", render: (r) => (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {r.status !== "active" && <Button size="sm" onClick={() => { setReview({ t: r, action: "restore" }); setReason(""); }}>restore</Button>}
                    {r.status === "under_review" && <Button size="sm" variant="secondary" onClick={() => { setReview({ t: r, action: "keep" }); setReason(""); }}>keep</Button>}
                    {r.entitlementCount > 0 && <Button size="sm" variant="secondary" onClick={() => { setReview({ t: r, action: "revoke" }); setReason(""); }}>revoke</Button>}
                  </div>
                ) },
              ]} />
          </>
        )}
        {tab === "ledger" && (
          <>
            <Select aria-label="event type" value={ledgerType} onChange={(e) => setLedgerType(e.target.value)} style={{ maxWidth: 260, marginBottom: 12 }}>
              <option value="">every event</option>{Object.entries(BILLING_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Table loading={!ledger} rows={ledger || []} rowKey={(r) => r.id} minWidth={760} empty={<EmptyState icon="receipt" title="no ledger events" />}
              columns={[
                { key: "at", label: "when", render: (r) => pkDate(r.createdAt) },
                { key: "type", label: "event", render: (r) => <Pill tone={r.eventType === "free_hire_consumed" ? "green" : r.eventType === "free_hire_restored" ? "blue" : "sand"}>{BILLING_LABEL[r.eventType]}</Pill> },
                { key: "employer", label: "employer", render: (r) => r.employer.name },
                { key: "fee", label: "fee", render: (r) => (r.feeWaived ? "waived (0)" : r.amount == null ? "pricing pending" : `${r.currency} ${r.amount}`) },
                { key: "note", label: "note", render: (r) => <span className="k-hint">{r.note}</span> },
              ]} />
          </>
        )}
      </div>
      <Modal open={!!review} onClose={() => setReview(null)} title={review ? `${TRIAL_ACTION[review.action]}: ${review.t.companyName}` : ""} sub="recorded in the audit with your reason." icon="gift" tone={review?.action === "revoke" ? "red" : "green"}
        footer={<><Button variant="secondary" onClick={() => setReview(null)}>cancel</Button><Button loading={busy} disabled={reason.trim().length < 3} onClick={decide}>save</Button></>}>
        <Field label="reason (required)" htmlFor="tr-reason"><Textarea id="tr-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
      </Modal>
    </div>
  );
}
