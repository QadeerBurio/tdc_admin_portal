// AccountFeatures.js: the "features" tab on a brand, employer or student profile (AdminUserProfile.js).
// Three states per feature this account's role can have (server: GET /api/admin/features/account/:id):
//   default (on / off)   no row for this account: the student default decides (students), else the Railway rules
//   forced on / off      this account's own row; "off" beats the student default and the Railway list
//   reset to default     removes the row (PUT state "default")
// A change asks for a reason, and the server writes it to the admin action log; the tab then shows what the server
// says. Locked only by the kill switch (the Railway value is only "off": off for everyone).
// A brand with Loyalty or Surprise Box: how many students have it too, so a one-sided pilot is obvious.
import React, { useCallback, useEffect, useState } from "react";
import featuresApi from "../services/featuresApi";
import { Card, Pill, Button, toast } from "./kit";
import FeatureReasonDialog from "./FeatureReasonDialog";

const date = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
const n = (x) => Number(x || 0).toLocaleString("en-US");

export function Switch({ checked, disabled, onClick, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 48, height: 28, borderRadius: 14, border: "2px solid", flex: "none", position: "relative", padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        borderColor: checked ? "#287A37" : "#6B6B6B",
        background: checked ? "#287A37" : "#FFFFFF",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span aria-hidden="true" style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: checked ? "#FFFFFF" : "#6B6B6B", transition: "left .15s" }} />
    </button>
  );
}

// what "default" means for this account: the student default when set (students), else the Railway rules
export function defaultOf(f) {
  if (f.defaultForRole === true || f.defaultForRole === false) return { on: f.defaultForRole, from: "the default for all students" };
  return { on: !!f.fromRailway, from: f.fromRailway ? "Railway (its id, role or a percentage)" : "nothing turns it on" };
}
export const modeOf = (f) => (f.forced === "on" ? "on" : f.forced === "off" ? "off" : "default");
function stateOf(f) {
  if (f.killed) return { text: "off for everyone: kill switch in Railway", tone: "red", locked: true };
  const d = defaultOf(f);
  if (f.forced === "on") return { text: "on: forced on", tone: "green", locked: false };
  if (f.forced === "off") return { text: "off: forced off", tone: "red", locked: false };
  return { text: `${d.on ? "on" : "off"}: default`, tone: d.on ? "blue" : "sand", locked: false };
}
const ACTION = { on: "force on", off: "force off", default: "reset to default" };

function Students({ f }) {
  const s = f.students;
  if (!s) return null;
  const someone = s.allStudentsFromRailway || s.allStudentsFromDefault || s.withAdminAccess + s.fromRailwayList > 0;
  const oneSided = f.effective && !someone;
  return (
    <div data-testid={`students-${f.flag}`} style={{ marginTop: 10, padding: 12, borderRadius: 10, background: oneSided ? "#FDECEC" : "#F5F2EA", fontSize: 14, lineHeight: 1.5 }}>
      {oneSided && <div style={{ marginBottom: 4 }}><Pill tone="red">one-sided pilot</Pill></div>}
      {s.allStudentsFromDefault
        ? <div>Every student has {f.label} (the default for all students), except those forced off.</div>
        : s.allStudentsFromRailway
        ? <div>Every student has {f.label} (a Railway rule).</div>
        : <div>Students with {f.label}: <strong>{n(s.withAdminAccess)}</strong> with admin access, <strong>{n(s.fromRailwayList)}</strong> from the Railway list.</div>}
      {s.usedThisBrand > 0 && <div>{n(s.usedThisBrandWithIt)} of the {n(s.usedThisBrand)} students who used this brand have it.</div>}
      {oneSided && <div style={{ color: "#B63935" }}>No student has {f.label} yet, so it does nothing for this brand. Turn it on for its test students: all students → select them → Features…</div>}
    </div>
  );
}

const time = (d) => (d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "");

/**
 * What the app sees: exactly what GET /api/app/flags/me answers this account right now (server: accountView's
 * appView), so an admin can check a student's features without their phone.
 */
export function AppView({ view, onRefresh }) {
  const av = view?.appView;
  if (!av || !av.flags) return null;
  const labels = Object.fromEntries((view.flags || []).map((f) => [f.flag, f.label]));
  const entries = Object.entries(av.flags);
  const name = view.account?.name || "this account";
  return (
    <section data-testid="app-view" aria-labelledby="app-view-title" style={{ marginTop: 16, padding: 14, borderRadius: 14, background: "#FFFFFF", border: "1px solid #ECE7DA" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h3 id="app-view-title" style={{ margin: 0, fontSize: 16 }}>what the app sees</h3>
        <Button size="sm" variant="secondary" onClick={onRefresh} aria-label="check what the app sees again">check again</Button>
      </div>
      <p className="k-hint" style={{ margin: "6px 0 8px" }}>
        Exactly what the app gets for {name} right now (GET /api/app/flags/me, checked at {time(av.at)}). The phone shows it after its next check: app open, sign-in or back in the foreground (at most once a minute).
        {view.account?.roleStored === false ? " This account has no stored role: the app treats it as a student." : ""}
        {av.loaded === false ? " The server hasn't loaded the admin settings yet: try again in a few seconds." : ""}
      </p>
      <ul aria-label="what the app sees" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
        {entries.map(([k, v]) => (
          <li key={k} data-flag={k} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ minWidth: 180 }}>{labels[k] || k}</span>
            <Pill tone={v ? "green" : "sand"}>{v ? "on in the app" : "off in the app"}</Pill>
          </li>
        ))}
      </ul>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: "pointer" }}>the raw answer</summary>
        <pre style={{ fontSize: 12, background: "#F7F4EC", padding: 10, borderRadius: 8, overflowX: "auto" }}>{JSON.stringify(av.flags, null, 2)}</pre>
      </details>
    </section>
  );
}

export default function AccountFeatures({ accountId }) {
  const [view, setView] = useState(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null); // { flag, label, state: "on" | "off" | "default" }

  const load = useCallback(async () => {
    try {
      setView(await featuresApi.account(accountId));
      setError("");
    } catch (e) {
      setError(e?.message || "could not load features");
    }
  }, [accountId]);
  useEffect(() => { setView(null); load(); }, [load]);

  if (error && !view) return <div className="tdcp-card tdcp-empty" role="alert">{error} <Button size="sm" variant="secondary" onClick={load}>try again</Button></div>;
  if (!view) return <div className="tdcp-card tdcp-empty" role="status">loading features…</div>;
  if (!view.flags.length) return <div className="tdcp-card tdcp-empty">No features can be turned on for this kind of account.<AppView view={view} onRefresh={load} /></div>;

  const save = async (reason) => {
    const { flag, label, state } = pending;
    await featuresApi.setState(accountId, flag, state, reason); // throws: the dialog shows the error, nothing changes
    setPending(null);
    toast(`${label}: ${state === "default" ? "back to the default" : state === "on" ? "forced on" : "forced off"}: saved`);
    await load();
  };

  return (
    <Card title="features" icon="settings" tone="sand">
      <p className="k-hint" style={{ marginTop: 0 }}>Each feature follows its default unless you force it on or off for this account. Forced off beats the default for all students and the Railway list; only the Railway kill switch beats it. Each change is kept in the admin log with its reason.</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="features">
        {view.flags.map((f) => {
          const st = stateOf(f);
          const d = defaultOf(f);
          const mode = modeOf(f);
          const choose = (state) => { if (state !== mode) setPending({ flag: f.flag, label: f.label, state }); };
          const options = [
            { state: "default", text: `default (${d.on ? "on" : "off"})` },
            { state: "on", text: "forced on" },
            { state: "off", text: "forced off" },
          ];
          return (
            <li key={f.flag} data-flag={f.flag} style={{ padding: "14px 0", borderTop: "1px solid #ECE7DA" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <strong style={{ fontSize: 16 }}>{f.label}</strong>
                <Pill tone={st.tone}>{st.text}</Pill>
                {f.killed && f.forced && <Pill tone="sand">forced {f.forced} kept, ignored while the kill switch is on</Pill>}
              </div>
              <fieldset disabled={st.locked} style={{ border: 0, padding: 0, margin: "10px 0 0", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <legend className="k-sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{f.label} for this account</legend>
                {options.map((o) => (
                  <label key={o.state} data-state={o.state} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, border: `1.5px solid ${mode === o.state ? "#111111" : "#D9D3C4"}`, background: mode === o.state ? "#FFF1CC" : "#FFFFFF", cursor: st.locked ? "not-allowed" : "pointer", fontSize: 14, fontWeight: mode === o.state ? 700 : 500 }}>
                    <input type="radio" name={`state-${f.flag}`} value={o.state} checked={mode === o.state} onChange={() => choose(o.state)} aria-label={`${f.label}: ${o.text}`} />
                    {o.text}
                  </label>
                ))}
                {mode !== "default" && <Button size="sm" variant="secondary" onClick={() => choose("default")} aria-label={`reset ${f.label} to default`}>reset to default</Button>}
              </fieldset>
              <div className="k-hint" style={{ marginTop: 6 }}>Default here: {d.on ? "on" : "off"}, from {d.from}.{f.killed ? " Locked: the FLAG_* value on Railway is the kill switch (off for everyone)." : ""}</div>
              {f.lastChange && (
                <div className="k-hint" style={{ marginTop: 6 }}>
                  last change: forced {f.lastChange.enabled ? "on" : "off"} by {f.lastChange.setBy?.name || "admin"} on {date(f.lastChange.setAt)}: “{f.lastChange.reason}”
                </div>
              )}
              <Students f={f} />
            </li>
          );
        })}
      </ul>
      <AppView view={view} onRefresh={load} />
      {pending && (
        <FeatureReasonDialog
          title={`${ACTION[pending.state]}: ${pending.label}`}
          sub={`for ${view.account.name || "this account"}${pending.state === "off" ? ": off even if the default for all students or the Railway list turns it on" : pending.state === "default" ? ": the default decides again" : ""}`}
          confirmLabel={ACTION[pending.state]}
          onConfirm={save}
          onClose={() => setPending(null)}
        />
      )}
    </Card>
  );
}
