// CompanyVerification.js: /company-verification, for every employer (server: routes/hiringAccess.routes.js).
// A company's jobs go live once tdc verifies it. The form: registered name, NTN or SECP number, and proof: the
// company's own e-mail domain, its website, and/or a document (NTN certificate, SECP certificate, business
// registration or letterhead; PDF or image, max 5 MB, seen only by tdc's admins). At least one of the three.
// When tdc rejected the details or asked for more, the reason is shown and the employer sends them again.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, IconButton, Field, Input, Select, EmptyState, Pill, FileUpload, toast } from "../portal/kit";
import hiringAccessApi from "../services/hiringAccessApi";
import { VERIFICATION_LABEL, VERIFICATION_TONE, CHIP_LABEL, CHIP_TONE, DOCUMENT_KIND_LABEL, pkDate } from "../services/trialApi";

const blank = { companyName: "", registrationType: "ntn", ntnOrSecp: "", businessEmailDomain: "", website: "" };
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const kb = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default function CompanyVerification() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [form, setForm] = useState(blank);
  const [docs, setDocs] = useState([]); // attached to the submission: { id, kind, fileName, size }
  const [kind, setKind] = useState("ntn_certificate");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fieldError, setFieldError] = useState({});
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const apply = (d) => {
    setState({ loading: false, data: d || null, error: d ? null : "no data" });
    const v = d?.verification;
    if (v) {
      setForm({ companyName: v.companyName, registrationType: v.registrationType, ntnOrSecp: v.ntnOrSecp, businessEmailDomain: v.businessEmailDomain || "", website: v.website || "" });
      setDocs(v.documents || []);
    }
  };
  const load = useCallback(async () => {
    try { apply(await hiringAccessApi.myCompany()); } catch (e) { setState({ loading: false, data: null, error: e.message }); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const set = (k, val) => { setForm((f) => ({ ...f, [k]: val })); setFieldError((e) => ({ ...e, [k]: "", proof: "" })); };

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!TYPES.includes(f.type)) { setFieldError((x) => ({ ...x, file: "a PDF or an image (JPEG, PNG or WebP)" })); setFile(null); return; }
    if (f.size > MAX_BYTES) { setFieldError((x) => ({ ...x, file: "the file is over 5 MB" })); setFile(null); return; }
    setFieldError((x) => ({ ...x, file: "", proof: "" }));
    setFile(f);
  };
  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const d = await hiringAccessApi.uploadDocument(file, kind);
      setDocs((list) => [...list, d]);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast(`added: ${DOCUMENT_KIND_LABEL[d.kind]}`, "ok");
    } catch (err) {
      setFieldError((x) => ({ ...x, file: err.message }));
    } finally { setUploading(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.businessEmailDomain.trim() && !form.website.trim() && !docs.length) {
      setFieldError({ proof: "add at least one: your company's own e-mail domain, its website, or a document" });
      return;
    }
    setBusy(true);
    try {
      const d = await hiringAccessApi.submitCompany({ ...form, documentIds: docs.map((x) => x.id) });
      apply(d);
      window.dispatchEvent(new Event("tdc:company-verification"));
      toast("sent: tdc will check your company details", "ok");
    } catch (err) {
      setFieldError({ [err.field === "documents" ? "proof" : err.field || "proof"]: err.message });
      toast(err.message, "bad");
    } finally { setBusy(false); }
  };

  if (state.loading) return <PageLoading />;
  const d = state.data;
  if (!d) return <div className="tdcp k-page" data-screen="company-verification"><PageHeader title="company verification" /><EmptyState icon="alert" tone="red" title="couldn't load" text={state.error || "try again"} action={<Button onClick={load}>retry</Button>} /></div>;
  const v = d.verification;
  const editable = !v || ["pending", "rejected", "duplicate_review", "needs_info"].includes(v.status);
  const need = d.actionNeeded;
  return (
    <div className="tdcp k-page" data-screen="company-verification">
      <PageHeader title="company verification" sub="your jobs go live for students once tdc verifies your company." />
      {need && (
        <div className="k-note bad" role="alert" data-testid="action-needed" style={{ marginBottom: 16 }}>
          <b>{need.status === "needs_info" ? "tdc needs more information" : "tdc couldn't verify your company"}</b>
          {need.reason && <div>{need.reason}</div>}
          <div className="k-hint">fix the details below or add a document, then send them again.</div>
        </div>
      )}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <section className="k-card pad" aria-labelledby="cv-form-title">
          <div className="k-card-head"><Ico kind="shield" tone="blue" size={30} /><h2 id="cv-form-title" style={{ fontSize: 18, margin: 0 }}>your company</h2><Pill tone={CHIP_TONE[d.chip]}>{CHIP_LABEL[d.chip]}</Pill></div>
          {v && !need && v.reason && <p className="k-hint">tdc: {v.reason}</p>}
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }} noValidate>
            <Field label="registered company name" error={fieldError.companyName} htmlFor="cv-name"><Input id="cv-name" disabled={!editable} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} /></Field>
            <Field label="registration" htmlFor="cv-type"><Select id="cv-type" disabled={!editable} value={form.registrationType} onChange={(e) => set("registrationType", e.target.value)}><option value="ntn">NTN (FBR)</option><option value="secp">SECP incorporation number</option></Select></Field>
            <Field label={form.registrationType === "secp" ? "SECP incorporation number" : "NTN"} hint={form.registrationType === "secp" ? "as on the certificate of incorporation" : "e.g. 1234567-8"} error={fieldError.ntnOrSecp} htmlFor="cv-reg"><Input id="cv-reg" disabled={!editable} value={form.ntnOrSecp} onChange={(e) => set("ntnOrSecp", e.target.value)} /></Field>
            <p className="k-hint" style={{ margin: "6px 0 0" }}><b>proof</b>: at least one of your company's own e-mail domain, its website, or a document.</p>
            <Field label="company e-mail domain (optional)" hint="the part after @ in your work e-mails; not gmail, yahoo, outlook ..." error={fieldError.businessEmailDomain} htmlFor="cv-domain"><Input id="cv-domain" disabled={!editable} value={form.businessEmailDomain} onChange={(e) => set("businessEmailDomain", e.target.value)} placeholder="yourcompany.pk" /></Field>
            <Field label="website (optional)" error={fieldError.website} htmlFor="cv-web"><Input id="cv-web" disabled={!editable} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="yourcompany.pk" /></Field>
            <div className="k-card" style={{ padding: 12, display: "grid", gap: 8 }} aria-labelledby="cv-docs-title">
              <b id="cv-docs-title">documents</b>
              <span className="k-hint">NTN certificate, SECP certificate, business registration or letterhead. PDF or image, up to 5 MB. only tdc's team can open them.</span>
              {docs.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 6 }} data-testid="cv-docs">
                  {docs.map((x) => (
                    <li key={x.id} className="k-row" style={{ gap: 8 }}>
                      <Ico kind="file" tone="plain" size={16} />
                      <span style={{ flex: 1, minWidth: 0 }}>{DOCUMENT_KIND_LABEL[x.kind] || x.kind}: {x.fileName} <span className="k-hint">{x.size ? kb(x.size) : ""}</span></span>
                      {editable && <IconButton icon="close" size="sm" variant="ghost" label={`remove ${x.fileName}`} onClick={() => setDocs((list) => list.filter((y) => y.id !== x.id))} />}
                    </li>
                  ))}
                </ul>
              )}
              {editable && (
                <>
                  <Field label="what is it" htmlFor="cv-kind"><Select id="cv-kind" value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(DOCUMENT_KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
                  <FileUpload accept=".pdf,image/jpeg,image/png,image/webp" onChange={pick} file={file} inputRef={fileRef} label="choose a PDF or an image" hint="up to 5 MB" />
                  {fieldError.file && <div className="k-note bad" role="alert">{fieldError.file}</div>}
                  <Button size="sm" variant="secondary" icon="upload" onClick={upload} disabled={!file} loading={uploading}>add document</Button>
                </>
              )}
            </div>
            {fieldError.proof && <div className="k-note bad" role="alert" data-testid="proof-error">{fieldError.proof}</div>}
            {editable && <Button type="submit" loading={busy}>{v ? "send again" : "send for verification"}</Button>}
            {!editable && <p className="k-hint">verified {pkDate(v.reviewedAt)}. contact tdc to change these details.</p>}
          </form>
        </section>
        <section className="k-card pad" aria-labelledby="cv-jobs-title">
          <div className="k-card-head"><Ico kind="briefcase" tone="yellow" size={30} /><h2 id="cv-jobs-title" style={{ fontSize: 18, margin: 0 }}>jobs waiting</h2><Pill tone={d.pendingJobs.length ? "yellow" : "sand"}>{d.pendingJobs.length}</Pill></div>
          {v && <p className="k-hint">status: <Pill tone={VERIFICATION_TONE[v.status]}>{VERIFICATION_LABEL[v.status]}</Pill></p>}
          {d.verified ? <p>your company is verified: new jobs go live at once.</p> : d.pendingJobs.length ? (
            <>
              <p>these go live once your company is verified:</p>
              <ul style={{ margin: 0, paddingLeft: 18 }}>{d.pendingJobs.map((j) => <li key={j.id}>{j.title} <span className="k-hint">posted {pkDate(j.postedAt)}</span></li>)}</ul>
            </>
          ) : <p className="k-hint">no jobs waiting. a job you post now goes live once your company is verified.</p>}
          <Button variant="secondary" icon="briefcase" onClick={() => navigate("/employee-jobs")}>your jobs</Button>
        </section>
      </div>
    </div>
  );
}
