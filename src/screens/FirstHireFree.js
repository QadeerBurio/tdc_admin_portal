// FirstHireFree.js: First Hire Free for employers (FLAG_EMPLOYER_FIRST_HIRE_FREE).
//   FreeHireCard        the employer dashboard card "Your first verified hire is free": status (Not activated /
//                       Active / Used / Under review), free hires left, the next step and a link to the terms
//   FirstHireFreePage   /first-hire-free: company verification form (company name, NTN or SECP number, business
//                       e-mail domain, website), its status and the admin's reason, activation, the terms and the
//                       real counts (applicants, completed interviews, verified hires)
// Both render nothing / "not available" for employers outside the pilot. No prices: further hires show
// "pricing coming soon".
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Field, Input, Select, EmptyState, Pill, Facts, StatCard, toast } from "../portal/kit";
import trialApi, { TRIAL_LABEL, TRIAL_TONE, VERIFICATION_LABEL, VERIFICATION_TONE, pkDate } from "../services/trialApi";

function useTrial() {
  const [state, setState] = useState({ loading: true, enabled: false, data: null });
  const load = useCallback(async () => {
    try {
      const flags = await trialApi.flagsMe().catch(() => ({}));
      if (!flags.employerFirstHireFree) return setState({ loading: false, enabled: false, data: null });
      setState({ loading: false, enabled: true, data: await trialApi.trial() });
    } catch (e) {
      setState({ loading: false, enabled: e.status !== 404, data: null, error: e.message });
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return [state, load, setState];
}

export function FreeHireCard() {
  const navigate = useNavigate();
  const [{ loading, enabled, data }] = useTrial();
  if (loading || !enabled || !data) return null;
  const status = data.status;
  return (
    <section className="k-card pad" data-card="first-hire-free" style={{ marginBottom: 16, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <Ico kind="gift" tone="green" size={44} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>your first verified hire is free</h3>
          <Pill tone={TRIAL_TONE[status]}>{TRIAL_LABEL[status]}</Pill>
        </div>
        <p className="k-hint" style={{ margin: "4px 0 0" }}>
          {status === "active" ? `${data.remainingFreeHires} free hire left. it's used when a candidate accepts your offer and you confirm the hire.` : data.nextAction.label}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="sm" onClick={() => navigate("/first-hire-free")}>{({ verify_company: "verify your company", activate: "activate", wait_for_review: "see status", post_job: "see details", none: "see details" })[data.nextAction.action] || "see details"}</Button>
        <Button size="sm" variant="secondary" onClick={() => navigate("/first-hire-free#terms")}>terms</Button>
      </div>
    </section>
  );
}

const blank = { companyName: "", registrationType: "ntn", ntnOrSecp: "", businessEmailDomain: "", website: "" };

export function FirstHireFreePage() {
  const navigate = useNavigate();
  const [{ loading, enabled, data, error }, reload, setState] = useTrial();
  const [form, setForm] = useState(blank);
  const [fieldError, setFieldError] = useState({});
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    const v = data?.verification;
    if (v) setForm({ companyName: v.companyName, registrationType: v.registrationType, ntnOrSecp: v.ntnOrSecp, businessEmailDomain: v.businessEmailDomain, website: v.website });
    if (enabled && data) trialApi.summary().then(setSummary).catch(() => setSummary(null));
  }, [data, enabled]);
  const set = (k, val) => { setForm((f) => ({ ...f, [k]: val })); setFieldError((e) => ({ ...e, [k]: "" })); };
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await trialApi.submitVerification(form);
      setState((s) => ({ ...s, data: d }));
      toast(d.verification.status === "duplicate_review" ? "sent: tdc will check it (it looks like another account of the same company)" : "sent: tdc will check your company details", "ok");
    } catch (err) {
      if (err.field) setFieldError({ [err.field]: err.message });
      toast(err.message, "bad");
    } finally { setBusy(false); }
  };
  const activate = async () => {
    setBusy(true);
    try {
      const d = await trialApi.activate();
      setState((s) => ({ ...s, data: d }));
      toast("activated: your first verified hire is free", "ok");
    } catch (err) { toast(err.message, "bad"); reload(); } finally { setBusy(false); }
  };

  if (loading) return <PageLoading />;
  if (!enabled) return <div className="tdcp k-page"><EmptyState icon="gift" tone="green" title="first hire free isn't available for your account yet" text="tdc is piloting it with a few companies." /></div>;
  if (!data) return <div className="tdcp k-page"><EmptyState icon="alert" tone="red" title="couldn't load" text={error || "try again"} action={<Button onClick={reload}>retry</Button>} /></div>;
  const v = data.verification;
  const editable = !v || ["pending", "rejected", "duplicate_review"].includes(v.status);
  return (
    <div className="tdcp k-page" data-screen="first-hire-free">
      <PageHeader title="your first verified hire is free" sub="one fee-waived hire per verified company. nothing is charged today." />
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <section className="k-card pad">
          <div className="k-card-head"><Ico kind="gift" tone="green" size={30} /><h3>free hire</h3><Pill tone={TRIAL_TONE[data.status]}>{TRIAL_LABEL[data.status]}</Pill></div>
          <Facts rows={[["free hires left", String(data.remainingFreeHires)], ["used", data.usedOn ? pkDate(data.usedOn) : "–"], ["next step", data.nextAction.label]]} />
          {data.nextAction.action === "activate" && <Button icon="check" loading={busy} onClick={activate}>activate my free hire</Button>}
          {data.nextAction.action === "post_job" && <Button icon="plus" onClick={() => navigate("/employee-jobs")}>post a job</Button>}
          {data.status === "used" && <p className="k-hint">{data.policy.furtherHires}</p>}
        </section>
        <section className="k-card pad">
          <div className="k-card-head"><Ico kind="shield" tone="blue" size={30} /><h3>company verification</h3>{v && <Pill tone={VERIFICATION_TONE[v.status]}>{VERIFICATION_LABEL[v.status]}</Pill>}</div>
          {v?.reason && <p className={v.status === "rejected" ? "k-note bad" : "k-hint"} role={v.status === "rejected" ? "alert" : undefined}>tdc: {v.reason}</p>}
          <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
            <Field label="registered company name" error={fieldError.companyName} htmlFor="fhf-name"><Input id="fhf-name" disabled={!editable} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} /></Field>
            <Field label="registration" htmlFor="fhf-type"><Select id="fhf-type" disabled={!editable} value={form.registrationType} onChange={(e) => set("registrationType", e.target.value)}><option value="ntn">NTN (FBR)</option><option value="secp">SECP incorporation number</option></Select></Field>
            <Field label={form.registrationType === "secp" ? "SECP incorporation number" : "NTN"} hint={form.registrationType === "secp" ? "as on the certificate of incorporation" : "e.g. 1234567-8"} error={fieldError.ntnOrSecp} htmlFor="fhf-reg"><Input id="fhf-reg" disabled={!editable} value={form.ntnOrSecp} onChange={(e) => set("ntnOrSecp", e.target.value)} /></Field>
            <Field label="company e-mail domain" hint="the part after @ in your work e-mails (not gmail, yahoo, outlook ...)" error={fieldError.businessEmailDomain} htmlFor="fhf-domain"><Input id="fhf-domain" disabled={!editable} value={form.businessEmailDomain} onChange={(e) => set("businessEmailDomain", e.target.value)} placeholder="yourcompany.pk" /></Field>
            <Field label="website" error={fieldError.website} htmlFor="fhf-web"><Input id="fhf-web" disabled={!editable} value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="yourcompany.pk" /></Field>
            {editable && <Button type="submit" loading={busy}>{v ? "send again" : "send for verification"}</Button>}
            {!editable && <p className="k-hint">verified {pkDate(v.reviewedAt)}. contact tdc to change these details.</p>}
          </form>
        </section>
      </div>
      {summary && (
        <div className="k-stats" style={{ marginTop: 16 }}>
          <StatCard label="applicants" value={summary.applicants} icon="users" tone="blue" />
          <StatCard label="interviews completed" value={summary.completedInterviews} icon="calendar" tone="purple" />
          <StatCard label="verified hires" value={summary.verifiedHires} icon="trophy" tone="green" />
          <StatCard label="free hire used" value={summary.freeHireUsed ? "yes" : "no"} icon="gift" tone="orange" />
        </div>
      )}
      <section className="k-card pad" id="terms" style={{ marginTop: 16 }}>
        <div className="k-card-head"><Ico kind="info" tone="sand" size={30} /><h3>terms</h3></div>
        <p style={{ margin: 0 }}>{data.policy.text}</p>
        <p className="k-hint">policy {data.policy.version}</p>
      </section>
    </div>
  );
}

export default FirstHireFreePage;
