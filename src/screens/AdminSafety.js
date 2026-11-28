// AdminSafety.js: the Safety log ("general" menu, after admin actions; plan P4-7). No daily reviewing: this is the record behind the safety
// e-mails and the place to change an automatic decision. Tabs:
//   reported  open reports for ALL content (posts, post comments, users, confessions, confession comments), self-harm first
//   held      confessions / comments held by the pre-post check or hidden after reports
//   resolved  the decided ones
//   settings  report threshold, banned words, helplines, the single-report rule; P4a: post tags and prompt chips
// Authors are anonymous references (the same as in the safety e-mails). "who wrote it" asks for a reason and is logged.
// Every decision asks for a note and is written to the admin actions log.
import React, { useCallback, useContext, useEffect, useState } from "react";
import safetyApi from "../services/safetyApi";
import SafetyReportQueue from "./SafetyReportQueue";
import { AdminAccessContext, useAdminCan } from "../portal/adminAccess";
import { PageHeader, PageLoading, Tabs, Table, Button, Pill, EmptyState, Card, Drawer, Field, Input, Textarea, Select, Facts, toast } from "../portal/kit";

const TABS = [
  { id: "intake", label: "safety concerns" },
  { id: "reported", label: "reported" },
  { id: "held", label: "held" },
  { id: "resolved", label: "resolved" },
  { id: "observed", label: "would have blocked" },
  { id: "settings", label: "settings" },
];
const MODE_LABEL = {
  off: "off: no checks",
  observe: "observe: check every post and log it, never block or hide",
  enforce: "enforce: block, hold and hide (students with the confession safety feature)",
};
const WOULD = { block: "would have blocked", hold: "would have held", support: "self-harm signal (support)", hide: "would have hidden", remove: "would have removed" };
const KIND = { confession: "confession", confession_comment: "confession comment", post: "post", post_comment: "post comment", user: "account" };
const ACTIONS = [
  ["approve", "approve (no rule broken)"],
  ["remove", "remove the content"],
  ["warn", "warn the author"],
  ["suspend24h", "suspend the account 24 h"],
  ["suspend7d", "suspend the account 7 days"],
  ["ban", "ban the account"],
];
const when = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–");
const statusTone = (s) => (s === "removed" ? "red" : s === "hidden" || s === "pending" ? "yellow" : s === "live" ? "green" : "sand");

export default function AdminSafety() {
  const [tab, setTab] = useState("reported");
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(null); // the row in the drawer
  const [action, setAction] = useState("approve");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [revealReason, setRevealReason] = useState("");
  const [revealed, setRevealed] = useState(null);
  // P5a: deciding needs safety.act (suspend / ban also students.suspend), showing the author identity.reveal (as on the server)
  const can = useAdminCan();
  const access = useContext(AdminAccessContext);
  const intakeAllowed = access?.level !== "legacy" && can("safety.intake.view");
  const tabs = intakeAllowed ? TABS : TABS.filter(({ id }) => id !== "intake");
  const canAct = can("safety.act");
  const actions = (open && open.id ? ACTIONS : ACTIONS.slice(0, 2)).filter(([v]) => !["suspend24h", "suspend7d", "ban"].includes(v) || can("students.suspend"));

  const load = useCallback(async () => {
    if (["intake", "settings", "observed"].includes(tab)) return;
    setItems(null); setError("");
    try { setItems((await safetyApi.queue(tab)).items || []); } catch (e) { setError(e.message); }
  }, [tab]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "intake" && !intakeAllowed) setTab("reported"); }, [tab, intakeAllowed]);

  const openRow = (row) => { setOpen(row); setAction("approve"); setNote(""); setRevealReason(""); setRevealed(null); };
  const decide = async () => {
    if (!note.trim()) return toast("add a short note: it goes into the admin actions log");
    setBusy(true);
    try {
      if (open.id) await safetyApi.resolve(open.id, action, note.trim());
      else await safetyApi.resolveHeld(open.confessionId, action, note.trim(), open.commentId || null);
      toast("saved");
      setOpen(null);
      load();
    } catch (e) { toast(e.message || "could not save"); } finally { setBusy(false); }
  };
  const reveal = async () => {
    setBusy(true);
    try { setRevealed((await safetyApi.author(open.id, revealReason.trim())).account); } catch (e) { toast(e.message || "could not show the account"); } finally { setBusy(false); }
  };

  const content = (r) => r.content || r;
  const columns = [
    { key: "when", label: "when", render: (r) => when(r.createdAt) },
    { key: "kind", label: "what", render: (r) => KIND[content(r).kind] || content(r).kind || "–" },
    { key: "text", label: "content", style: { maxWidth: 380, overflowWrap: "anywhere" }, render: (r) => (content(r).gone ? <em>(deleted)</em> : String(content(r).text || "").slice(0, 160) || "–") },
    { key: "reason", label: "reason", render: (r) => (r.reason ? <Pill tone={r.reason === "Self Harm Risk" ? "red" : "sand"}>{r.reason}</Pill> : r.statusReason || "–") },
    { key: "status", label: "status", render: (r) => { const s = content(r).status || r.status; return s ? <Pill tone={statusTone(s)}>{s}</Pill> : "–"; } },
    { key: "author", label: "author", render: (r) => content(r).author || "–" },
  ];

  if (tab === "settings") return <div className="tdcp k-page"><PageHeader title="safety" sub="confession safety: automatic checks, reports and strikes" /><Tabs tabs={TABS} value={tab} onChange={setTab} label="safety" /><SafetySettings /></div>;
  if (tab === "observed") return <div className="tdcp k-page"><PageHeader title="safety" sub="observe mode: what the checks would have done on real posts. nothing was blocked or hidden." /><Tabs tabs={TABS} value={tab} onChange={setTab} label="safety" /><Observed /></div>;

  return (
    <div className="tdcp k-page">
      <PageHeader title="safety" sub="the record behind the safety e-mails. change an automatic decision here." />
      <Tabs tabs={tabs} value={tab} onChange={setTab} label="safety" />
      {tab === "intake" && intakeAllowed ? <SafetyReportQueue /> : error ? (
        <EmptyState icon="alert" tone="red" title="could not load" text={error} action={<Button onClick={load}>try again</Button>} />
      ) : !items ? (
        <PageLoading label="loading…" />
      ) : (
        <Table
          label={`${tab} items`}
          columns={columns}
          rows={items}
          rowKey={(r, i) => r.id || `${r.confessionId}-${r.commentId || ""}-${i}`}
          onRowClick={tab === "resolved" ? undefined : openRow}
          empty={<EmptyState icon="shield" title={tab === "held" ? "nothing held" : tab === "reported" ? "no open reports" : "nothing decided yet"} text="" />}
        />
      )}

      {open && (
        <Drawer
          open
          onClose={busy ? undefined : () => setOpen(null)}
          title={KIND[content(open).kind] || "item"}
          sub={open.reason ? `reported: ${open.reason}` : open.statusReason || ""}
          footer={canAct ? <Button onClick={decide} loading={busy} disabled={busy}>save decision</Button> : null}
        >
          <Card title="content" icon="file" tone="sand">
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{content(open).gone ? "(deleted)" : content(open).text}</p>
            {content(open).image ? <p><a href={content(open).image} target="_blank" rel="noreferrer">open the image</a></p> : null}
          </Card>
          <Facts rows={[
            ["author", content(open).author || "–"],
            ["status", content(open).status || "–"],
            ["reports", String(content(open).reportCount ?? "–")],
            ...(open.evidence ? [["evidence", `“${open.evidence}”`]] : []),
            ...(open.description ? [["reporter's note", open.description]] : []),
            ...(open.recheck ? [["re-check", open.recheck.confirmed ? `confirmed (${(open.recheck.reasons || []).join(", ")})` : "not confirmed"]] : []),
          ]} />
          {canAct ? (
            <>
              <Field label="decision" htmlFor="safety-action">
                <Select id="safety-action" value={action} onChange={(e) => setAction(e.target.value)}>
                  {actions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field label="note (goes into the admin actions log)" htmlFor="safety-note">
                <Textarea id="safety-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} />
              </Field>
            </>
          ) : <p className="tdcp-sub">deciding needs the "decide reports" permission. ask a super admin.</p>}
          {open.id && content(open).author && can("identity.reveal") && (
            <Card title="who wrote it" icon="shield" tone="red">
              {revealed ? (
                <Facts rows={[["name", revealed.name], ["role", revealed.role], ["university", revealed.university || "–"], ["account", revealed.accountStatus]]} />
              ) : (
                <>
                  <p style={{ marginTop: 0 }}>only when it's needed. a reason is required and every reveal is logged.</p>
                  <Field label="reason" htmlFor="safety-reveal"><Input id="safety-reveal" value={revealReason} onChange={(e) => setRevealReason(e.target.value)} /></Field>
                  <Button variant="secondary" onClick={reveal} disabled={busy || revealReason.trim().length < 5}>show the account</Button>
                </>
              )}
            </Card>
          )}
        </Drawer>
      )}
    </div>
  );
}

function Observed() {
  const [days, setDays] = useState(7);
  const [d, setD] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setD(null); setError("");
    safetyApi.observed(days).then(setD).catch((e) => setError(e.message || "could not load"));
  }, [days]);
  if (error) return <EmptyState icon="alert" tone="red" title="could not load" text={error} />;
  if (!d) return <PageLoading label="loading…" />;
  const reasons = Object.entries(d.byReason || {}).sort((a, b) => b[1] - a[1]);
  return (
    <>
      <Field label="period" htmlFor="safety-days">
        <Select id="safety-days" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[1, 7, 30, 90].map((n) => <option key={n} value={n}>last {n} day{n === 1 ? "" : "s"}</option>)}
        </Select>
      </Field>
      <Card title="summary" icon="chart" tone="sand">
        <Facts rows={[
          ["checked", String(d.checked)],
          ["would have acted", String(d.wouldHaveActed)],
          ...Object.entries(d.byOutcome || {}).map(([k, v]) => [WOULD[k] || k, String(v)]),
        ]} />
        {reasons.length > 0 && <p style={{ marginBottom: 0 }}>by reason: {reasons.map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(" · ")}</p>}
      </Card>
      <Table
        label="would have acted"
        columns={[
          { key: "when", label: "when", render: (r) => when(r.createdAt) },
          { key: "kind", label: "what", render: (r) => r.kind },
          { key: "would", label: "would have", render: (r) => <Pill tone={r.wouldHave === "block" || r.wouldHave === "remove" ? "red" : "yellow"}>{WOULD[r.wouldHave] || r.wouldHave}</Pill> },
          { key: "reasons", label: "reasons", render: (r) => (r.reasons || []).map((x) => x.code.replace(/_/g, " ")).join(", ") || (r.aiOk ? "–" : "check unavailable") },
          { key: "text", label: "content", style: { maxWidth: 380, overflowWrap: "anywhere" }, render: (r) => String(r.text || "").slice(0, 160) || "–" },
          { key: "author", label: "author", render: (r) => r.author || "–" },
        ]}
        rows={d.items || []}
        rowKey={(r) => r.id}
        empty={<EmptyState icon="shield" title="nothing would have been blocked" text="in observe mode, every new post and report is checked and listed here when enforcement would have acted." />}
      />
    </>
  );
}

function SafetySettings() {
  const [s, setS] = useState(null);
  const [words, setWords] = useState("");
  const [threshold, setThreshold] = useState(3);
  const [helplines, setHelplines] = useState([]);
  const [single, setSingle] = useState(false);
  const [mode, setMode] = useState("enforce");
  // P4a (confessionsV2): post tags (the id stays when renamed) and the composer's prompt chips; only when the server has them
  const [tags, setTags] = useState(null);
  const [prompts, setPrompts] = useState(null);
  // owner (25 Nov 2026): a word taken out of confession handles later (no app update); only when the server has it
  const [handleWords, setHandleWords] = useState(null);
  const [busy, setBusy] = useState(false);
  const canSave = useAdminCan()("safety.act"); // P5a: saving the settings needs safety.act (as on the server)
  useEffect(() => {
    safetyApi.settings().then((x) => { setS(x); setWords((x.bannedWords || []).join(", ")); setThreshold(x.reportThreshold); setHelplines(x.helplines || []); setSingle(!!x.suspendOnSingleEvidenceReport); setMode(x.mode || "enforce"); setTags(Array.isArray(x.tags) ? x.tags : null); setPrompts(Array.isArray(x.prompts) ? x.prompts.join("\n") : null); setHandleWords(Array.isArray(x.blockedHandleWords) ? x.blockedHandleWords.join(", ") : null); }).catch((e) => toast(e.message || "could not load the settings"));
  }, []);
  if (!s) return <PageLoading label="loading settings…" />;
  const setTag = (i, k, v) => setTags((prev) => prev.map((t, j) => (j === i ? { ...t, [k]: v } : t)));
  const setLine = (i, k, v) => setHelplines((prev) => prev.map((h, j) => (j === i ? { ...h, [k]: v } : h)));
  const save = async () => {
    setBusy(true);
    try {
      const x = await safetyApi.saveSettings({ reportThreshold: Number(threshold), bannedWords: words, helplines: helplines.filter((h) => h.number.trim()), suspendOnSingleEvidenceReport: single, mode, ...(tags ? { tags: tags.filter((t) => String(t.label || "").trim()) } : {}), ...(prompts != null ? { prompts: prompts.split("\n").map((p) => p.trim()).filter(Boolean) } : {}), ...(handleWords != null ? { blockedHandleWords: handleWords } : {}) });
      setS(x); if (Array.isArray(x.tags)) setTags(x.tags); if (Array.isArray(x.blockedHandleWords)) setHandleWords(x.blockedHandleWords.join(", ")); toast("saved");
    } catch (e) { toast(e.message || "could not save"); } finally { setBusy(false); }
  };
  return (
    <Card title="settings" icon="settings" tone="sand" action={canSave ? <Button onClick={save} loading={busy}>save</Button> : null}>
      <Field label="mode" htmlFor="safety-mode" hint="start with observe for a few days, check 'would have blocked', then enforce">
        <Select id="safety-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          {["off", "observe", "enforce"].map((m) => <option key={m} value={m}>{MODE_LABEL[m]}</option>)}
        </Select>
      </Field>
      <Field label="unique reports that hide a post" htmlFor="safety-threshold"><Input id="safety-threshold" type="number" min={1} max={50} value={threshold} onChange={(e) => setThreshold(e.target.value)} /></Field>
      <Field label="extra banned words (comma-separated)" htmlFor="safety-words"><Textarea id="safety-words" rows={3} value={words} onChange={(e) => setWords(e.target.value)} /></Field>
      <Field label="helplines shown after a self-harm signal (call-test each before launch)">
        {helplines.map((h, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <Input aria-label={`helpline ${i + 1} name`} value={h.name} onChange={(e) => setLine(i, "name", e.target.value)} />
            <Input aria-label={`helpline ${i + 1} number`} value={h.number} onChange={(e) => setLine(i, "number", e.target.value)} style={{ maxWidth: 160 }} />
            <Input aria-label={`helpline ${i + 1} note`} value={h.note || ""} onChange={(e) => setLine(i, "note", e.target.value)} style={{ maxWidth: 120 }} />
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setHelplines((p) => [...p, { name: "", number: "", note: "" }])}>add a helpline</Button>
      </Field>
      {tags && (
        <Field label="post tags (confessions v2): rename, hide or add; a renamed tag keeps its posts">
          {tags.map((t, i) => (
            <div key={t.id || `new-${i}`} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
              <Input aria-label={`tag ${i + 1} name`} value={t.label} onChange={(e) => setTag(i, "label", e.target.value)} maxLength={24} />
              <Select aria-label={`tag ${i + 1} shown or hidden`} value={t.hidden ? "hidden" : "shown"} onChange={(e) => setTag(i, "hidden", e.target.value === "hidden")} style={{ maxWidth: 120 }}>
                <option value="shown">shown</option>
                <option value="hidden">hidden</option>
              </Select>
              {t.id ? <span className="k-hint">#{t.id}</span> : <span className="k-hint">new</span>}
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setTags((p) => [...p, { label: "", hidden: false }])}>add a tag</Button>
        </Field>
      )}
      {prompts != null && (
        <Field label="composer prompt chips, one per line (3 are shown each week, in turn)" htmlFor="safety-prompts">
          <Textarea id="safety-prompts" rows={6} value={prompts} onChange={(e) => setPrompts(e.target.value)} />
        </Field>
      )}
      {handleWords != null && (
        <Field label="words blocked from confession handles (comma-separated, letters only)" htmlFor="safety-handle-words" hint="a handle with one of these shows 'anon.' at once; that student gets a new handle on their next post">
          <Textarea id="safety-handle-words" rows={2} value={handleWords} onChange={(e) => setHandleWords(e.target.value)} />
        </Field>
      )}
      <Field label="one report with evidence, confirmed by the re-check, suspends the account at once" htmlFor="safety-single">
        <Select id="safety-single" value={single ? "on" : "off"} onChange={(e) => setSingle(e.target.value === "on")}>
          <option value="off">off (recommended: strikes decide)</option>
          <option value="on">on</option>
        </Select>
      </Field>
    </Card>
  );
}
