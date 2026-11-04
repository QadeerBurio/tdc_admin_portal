// AdminFirstHireFree.js: admin pages for First Hire Free (FLAG_EMPLOYER_FIRST_HIRE_FREE).
//   CompanyVerifications  the review queue: company details, hints (sign-in e-mail on the domain, website on the
//                         domain), possible duplicates and what matched; approve / reject / mark duplicate, each
//                         with a required reason (shown to the employer, written to the audit)
//   FreeHireTrials        every company's trial: status, which hire used it, the company's accounts; restore /
//                         revoke / keep with a reason; and the billing ledger (records only: nothing is charged)
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Textarea, Select, Checkbox, Tabs, EmptyState, Pill, Table, Modal, toast } from "../portal/kit";
import trialApi, { TRIAL_LABEL, TRIAL_TONE, VERIFICATION_LABEL, VERIFICATION_TONE, BILLING_LABEL, pkDate } from "../services/trialApi";

function useAvailable() {
  const [ok, setOk] = useState(null);
  useEffect(() => { trialApi.adminAvailable().then(setOk); }, []);
  return ok;
}
const Off = () => <div className="tdcp k-page"><EmptyState icon="gift" tone="green" title="first hire free isn't switched on" text="set FLAG_EMPLOYER_FIRST_HIRE_FREE on the server to start the pilot." /></div>;

// ---------- company verifications ----------
const ACTION_LABEL = { approve: "approve", reject: "reject", mark_duplicate: "mark as duplicate" };
export function CompanyVerifications() {
  const available = useAvailable();
  const [status, setStatus] = useState("pending");
  const [rows, setRows] = useState(null);
  const [review, setReview] = useState(null); // { v, action }
  const [reason, setReason] = useState("");
  const [separate, setSeparate] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => trialApi.verifications(status).then(setRows).catch((e) => { toast(e.message, "bad"); setRows([]); }), [status]);
  useEffect(() => { if (available) { setRows(null); load(); } }, [available, load]);
  const decide = async () => {
    setBusy(true);
    try {
      await trialApi.reviewVerification(review.v.id, { action: review.action, reason, separateGroup: review.action === "approve" && separate });
      toast(`${ACTION_LABEL[review.action]}: done`, "ok");
      setReview(null);
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); load(); }
  };
  if (available === null) return <PageLoading />;
  if (!available) return <Off />;
  return (
    <div className="tdcp k-page" data-screen="company-verifications">
      <PageHeader title="company verifications" sub="first hire free: one free verified hire per verified company. check the registration number, the e-mail domain and the website." />
      <Select aria-label="status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 240, marginBottom: 12 }}>
        <option value="pending">to check</option><option value="duplicate_review">possible duplicates</option><option value="approved">verified</option><option value="rejected">not approved</option><option value="all">all</option>
      </Select>
      <Table loading={!rows} rows={rows || []} rowKey={(r) => r.id} minWidth={980} empty={<EmptyState icon="check" tone="green" title="nothing here" />}
        columns={[
          { key: "company", label: "company", render: (r) => <><strong>{r.companyName}</strong><div className="k-hint">{r.employer.name} · {r.employer.email}</div></> },
          { key: "reg", label: "registration", render: (r) => <>{r.registrationType.toUpperCase()} {r.ntnOrSecp}</> },
          { key: "domain", label: "e-mail domain / website", render: (r) => <>{r.businessEmailDomain}<div className="k-hint">{r.website}</div><div className="k-hint">{r.hints.signInEmailMatchesDomain ? "sign-in e-mail on this domain" : "sign-in e-mail NOT on this domain"} · {r.hints.websiteMatchesDomain ? "website matches" : "website differs"}</div></> },
          { key: "dup", label: "possible duplicate of", render: (r) => (r.duplicateOf.length ? r.duplicateOf.map((d) => <div key={d.verificationId}><Pill tone="orange">{d.employer.name || "another account"}</Pill> <span className="k-hint">same {d.matchedOn.join(", ")}</span></div>) : "–") },
          { key: "status", label: "status", render: (r) => <><Pill tone={VERIFICATION_TONE[r.status]}>{VERIFICATION_LABEL[r.status]}</Pill>{r.reason && <div className="k-hint">{r.reason}</div>}</> },
          { key: "act", label: "", render: (r) => (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {r.status !== "approved" && <Button size="sm" onClick={() => { setReview({ v: r, action: "approve" }); setReason(""); setSeparate(false); }}>approve</Button>}
              {r.status !== "rejected" && <Button size="sm" variant="secondary" onClick={() => { setReview({ v: r, action: "reject" }); setReason(""); }}>reject</Button>}
              {r.status === "pending" && <Button size="sm" variant="secondary" onClick={() => { setReview({ v: r, action: "mark_duplicate" }); setReason(""); }}>duplicate</Button>}
            </div>
          ) },
        ]} />
      <Modal open={!!review} onClose={() => setReview(null)} title={review ? `${ACTION_LABEL[review.action]}: ${review.v.companyName}` : ""}
        sub={review?.action === "approve" && review.v.duplicateOf.length ? "this account matches another one: approving puts it in the same company (one free hire between them)." : "the employer sees your reason. it's recorded in the audit."}
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
      <PageHeader title="free-hire trials" sub="consumed only by a verified hire (offer accepted + employer confirmed). nothing is charged: the ledger only records." />
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
