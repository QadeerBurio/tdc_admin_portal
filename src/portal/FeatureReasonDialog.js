// FeatureReasonDialog.js: asks for the reason before a feature is switched for an account (the server requires one,
// 3 to 500 characters, and writes it to the admin action log). Used by the profile's features tab and the features page.
import React, { useState } from "react";
import { Modal, Button, Field, Textarea } from "./kit";

export default function FeatureReasonDialog({ title, sub, confirmLabel = "save", onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ok = reason.trim().length >= 3;
  const submit = async () => {
    if (!ok || busy) return;
    setBusy(true); setError("");
    try {
      await onConfirm(reason.trim());
    } catch (e) {
      setError(e?.message || "could not save: try again");
      setBusy(false);
    }
  };
  return (
    <Modal
      title={title}
      sub={sub}
      icon="settings"
      tone="sand"
      onClose={busy ? undefined : onClose}
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>cancel</Button>
        <Button onClick={submit} disabled={!ok} loading={busy}>{confirmLabel}</Button>
      </>}
    >
      <Field label="reason (kept in the admin log)" htmlFor="feature-reason" hint="at least 3 characters" error={error}>
        <Textarea id="feature-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Alpha Cafe loyalty pilot, Nov 2026" autoFocus />
      </Field>
    </Modal>
  );
}
