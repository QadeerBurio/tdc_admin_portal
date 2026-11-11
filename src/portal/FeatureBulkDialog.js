// FeatureBulkDialog.js: "Features…" on the admin user lists (AdminUserList.js). Turns one feature on or off for the
// selected accounts: choose the feature, on / off and a reason; a confirm step shows the exact count (over 500, the
// number must be typed); then it's sent in batches of 500 (POST /api/admin/features/bulk) and the result is shown:
// changed, already so, skipped (wrong role, not found) and any batch that failed. Each change is in the admin log.
import React, { useEffect, useMemo, useState } from "react";
import featuresApi from "../services/featuresApi";
import { Modal, Button, Field, Textarea, Select, Segmented, Input, Progress, Pill } from "./kit";
import { batches, needsTypedConfirm, typedMatches, flagsForRole, mergeResults, actionText } from "./featureBulk";

export default function FeatureBulkDialog({ role, ids, nameOf = (id) => id, onClose, onDone }) {
  const [flags, setFlags] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [flag, setFlag] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState("choose"); // choose | confirm | running | done
  const [typed, setTyped] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    featuresApi.flags()
      .then((all) => { const mine = flagsForRole(all, role); setFlags(mine); setFlag(mine[0]?.flag || ""); })
      .catch((e) => setLoadError(e?.message || "could not load features"));
  }, [role]);

  const chosen = useMemo(() => (flags || []).find((f) => f.flag === flag), [flags, flag]);
  const count = ids.length;
  const typedOk = !needsTypedConfirm(count) || typedMatches(typed, count);

  const run = async () => {
    setStep("running");
    const parts = [];
    const list = batches(ids);
    for (let i = 0; i < list.length; i++) {
      try {
        parts.push({ ids: list[i], result: await featuresApi.bulk({ flag, enabled, accountIds: list[i], reason: reason.trim() }) });
      } catch (error) {
        parts.push({ ids: list[i], error });
      }
      setProgress(Math.round(((i + 1) / list.length) * 100));
    }
    const merged = mergeResults(parts);
    setResult(merged);
    setStep("done");
    onDone?.(merged);
  };

  const busy = step === "running";
  let body; let footer;
  if (loadError) {
    body = <p role="alert">{loadError}</p>;
    footer = <Button variant="secondary" onClick={onClose}>close</Button>;
  } else if (!flags) {
    body = <p role="status">loading features…</p>;
  } else if (!flags.length) {
    body = <p>No features can be turned on for these accounts.</p>;
    footer = <Button variant="secondary" onClick={onClose}>close</Button>;
  } else if (step === "choose") {
    body = (
      <>
        <Field label="feature" htmlFor="bulk-flag">
          <Select id="bulk-flag" value={flag} onChange={(e) => setFlag(e.target.value)}>
            {flags.map((f) => <option key={f.flag} value={f.flag}>{f.label}</option>)}
          </Select>
        </Field>
        {chosen?.killed && <p style={{ margin: "4px 0 12px" }}><Pill tone="red">kill switch on in Railway: {chosen.label} is off for everyone until it's lifted</Pill></p>}
        <Field label="turn">
          <Segmented label="turn on or off" value={enabled ? "on" : "off"} onChange={(v) => setEnabled(v === "on")} options={[{ value: "on", label: "on" }, { value: "off", label: "off" }]} />
        </Field>
        <Field label="reason (kept in the admin log)" htmlFor="bulk-reason" hint="at least 3 characters">
          <Textarea id="bulk-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. NED test students for the Alpha Cafe loyalty pilot" />
        </Field>
      </>
    );
    footer = <>
      <Button variant="secondary" onClick={onClose}>cancel</Button>
      <Button onClick={() => { setTyped(""); setStep("confirm"); }} disabled={!flag || reason.trim().length < 3}>next</Button>
    </>;
  } else if (step === "confirm") {
    body = (
      <>
        <p style={{ fontSize: 17, fontWeight: 700, marginTop: 0 }} data-testid="bulk-summary">{actionText(chosen?.label || flag, enabled, count)}?</p>
        <p className="k-hint">Accounts with the wrong role for {chosen?.label} are skipped and listed afterwards. Accounts listed in Railway stay on whatever you choose here.</p>
        {needsTypedConfirm(count) && (
          <Field label={`this is more than 500 accounts: type ${count} to confirm`} htmlFor="bulk-typed">
            <Input id="bulk-typed" inputMode="numeric" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} invalid={typed !== "" && !typedOk} />
          </Field>
        )}
      </>
    );
    footer = <>
      <Button variant="secondary" onClick={() => setStep("choose")}>back</Button>
      <Button onClick={run} disabled={!typedOk}>{actionText(chosen?.label || flag, enabled, count)}</Button>
    </>;
  } else if (step === "running") {
    body = <Progress value={progress} label={`saving… ${progress}%`} />;
  } else {
    const r = result;
    body = (
      <div data-testid="bulk-result">
        <p style={{ marginTop: 0 }}><strong>{r.changed.length}</strong> changed, <strong>{r.unchanged.length}</strong> already {enabled ? "on" : "off"}, <strong>{r.skipped.length}</strong> skipped{r.failed.length ? <>, <strong>{r.failed.length}</strong> not saved (a request failed: try those again)</> : null}.</p>
        {r.skipped.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18 }} aria-label="skipped accounts">
            {r.skipped.slice(0, 10).map((s) => <li key={s.id}>{nameOf(s.id)}: {s.why}</li>)}
            {r.skipped.length > 10 && <li>and {r.skipped.length - 10} more</li>}
          </ul>
        )}
      </div>
    );
    footer = <Button onClick={onClose}>done</Button>;
  }

  return (
    <Modal title="features" sub={`${count.toLocaleString("en-US")} selected account${count === 1 ? "" : "s"}`} icon="settings" tone="sand" onClose={busy ? undefined : onClose} footer={footer}>
      {body}
    </Modal>
  );
}
