// CompanyVerification.js: /company-verification, for every employer (server: routes/hiringAccess.routes.js).
// A company's jobs go live once tdc verifies it: the form (registered name, NTN or SECP number, company e-mail
// domain, website), its status and tdc's reason, and the jobs waiting for it. Free-mail domains are refused by the
// server (shown on the field). The First Hire Free pilot uses the same details.
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Field, Input, Select, EmptyState, Pill, toast } from "../portal/kit";
import hiringAccessApi from "../services/hiringAccessApi";
import { VERIFICATION_LABEL, VERIFICATION_TONE, pkDate } from "../services/trialApi";

const blank = { companyName: "", registrationType: "ntn", ntnOrSecp: "", businessEmailDomain: "", website: "" };

export default function CompanyVerification() {
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [form, setForm] = useState(blank);
  const [fieldError, setFieldError] = useState({});
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const d = await hiringAccessApi.myCompany();
      setState({ loading: false, data: d || null, error: d ? null : "no data" });
      const v = d?.verification;
      if (v) setForm({ companyName: v.companyName, registrationType: v.registrationType, ntnOrSecp: v.ntnOrSecp, businessEmailDomain: v.businessEmailDomain, website: v.website });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message });
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const set = (k, val) => { setForm((f) => ({ ...f, [k]: val })); setFieldError((e) => ({ ...e, [k]: "" })); };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await hiringAccessApi.submitCompany(form);
      setState({ loading: false, data: d, error: null });
      toast("sent: tdc will check your company details", "ok");
    } catch (err) {
      if (err.field) setFieldError({ [err.field]: err.message });
      toast(err.message, "bad");
    } finally { setBusy(false); }
  };
  if (state.loading) return <PageLoading />;
  const d = state.data;
  if (!d) return <div className="tdcp k-page" data-screen="company-verification"><PageHeader title="company verification" /><EmptyState icon="alert" tone="red" title="couldn't load" text={state.error || "try again"} action={<Button onClick={load}>retry</Button>} /></div>;
  const v = d.verification;
  const editable = !v || ["pending", "rejected", "duplicate_review"].includes(v.status);
  return (
    <div className="tdcp k-page" data-screen="company-verification">
      <PageHeader title="company verification" sub="your jobs go live for students once tdc verifies your company." />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <section className="k-card pad" aria-labelledby="cv-form-title">
          <div className="k-card-head"><Ico kind="shield" tone="blue" size={30} /><h2 id="cv-form-title" style={{ fontSize: 18, margin: 0 }}>your company</h2>{v && <Pill tone={VERIFICATION_TONE[v.status]}>{VERIFICATION_LABEL[v.status]}</Pill>}</div>
          {v?.reason && <p className={v.status === "rejected" ? "k-note bad" : "k-hint"} role={v.status === "rejected" ? "alert" : undefined}>tdc: {v.reason}</p>}
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <Field label="registered company name" error={fieldError.companyName} htmlFor="cv-name"><Input id="cv-name" disabled={!editable} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} /></Field>
            <Field label="registration" htmlFor="cv-type"><Select id="cv-type" disabled={!editable} value={form.registrationType} onChange={(e) => set("registrationType", e.target.value)}><option value="ntn">NTN (FBR)</option><option value="secp">SECP incorporation number</option></Select></Field>
            <Field label={form.registrationType === "secp" ? "SECP incorporation number" : "NTN"} hint={form.registrationType === "secp" ? "as on the certificate of incorporation" : "e.g. 1234567-8"} error={fieldError.ntnOrSecp} htmlFor="cv-reg"><Input id="cv-reg" disabled={!editable} value={form.ntnOrSecp} onChange={(e) => set("ntnOrSecp", e.target.value)} /></Field>
            <Field label="company e-mail domain" hint="the part after @ in your work e-mails (not gmail, yahoo, outlook ...)" error={fieldError.businessEmailDomain} htmlFor="cv-domain"><Input id="cv-domain" disabled={!editable} value={form.businessEmailDomain} onChange={(e) => set("businessEmailDomain", e.target.value)} placeholder="yourcompany.pk" /></Field>
            <Field label="website" error={fieldError.website} htmlFor="cv-web"><Input id="cv-web" disabled={!editable} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="yourcompany.pk" /></Field>
            {editable && <Button type="submit" loading={busy}>{v ? "send again" : "send for verification"}</Button>}
            {!editable && <p className="k-hint">verified {pkDate(v.reviewedAt)}. contact tdc to change these details.</p>}
          </form>
        </section>
        <section className="k-card pad" aria-labelledby="cv-jobs-title">
          <div className="k-card-head"><Ico kind="briefcase" tone="yellow" size={30} /><h2 id="cv-jobs-title" style={{ fontSize: 18, margin: 0 }}>jobs waiting</h2><Pill tone={d.pendingJobs.length ? "yellow" : "sand"}>{d.pendingJobs.length}</Pill></div>
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
