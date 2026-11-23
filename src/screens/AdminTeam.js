// src/screens/AdminTeam.js
// Phase A (A-6): team & access (settings, super admins only). Members with their access in plain words; invite a
// member from a template; edit access with checkboxes grouped like the menu; make / unmake a super admin (a second
// super admin confirms while there are two or more); suspend, restore, remove; activity and sign-ins; templates;
// the "would deny" log of shadow mode. The server enforces every rule; this page only offers what it allows.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import P from "../portal/adminPermissions";
import { PageHeader, Card, Table, Button, Field, Input, Select, Checkbox, Modal, Tabs, Pill, EmptyState } from "../portal/kit";

const err = (e) => e?.response?.data?.message || "that didn't work. try again.";
const day = (d) => (d ? new Date(d).toLocaleDateString() : "–");
const LEVEL = { super: ["super admin", "ink"], legacy: ["full access (before roles)", "sand"], member: ["member", "sky"], suspended: ["paused", "red"] };

function PermissionPicker({ value, onChange }) {
  const set = new Set(value);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {P.GROUPS.map((g) => {
        const items = P.PERMISSIONS.filter((p) => p.group === g.id && p.key !== "team.manage");
        if (!items.length) return null;
        return (
          <fieldset key={g.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: "8px 12px" }}>
            <legend style={{ fontWeight: 700, fontSize: 13 }}>{g.label}</legend>
            {items.map((p) => (
              <Checkbox key={p.key} label={`${p.label}`} checked={set.has(p.key)} onChange={(e) => { const n = new Set(set); e.target.checked ? n.add(p.key) : n.delete(p.key); onChange(P.KEYS.filter((k) => n.has(k))); }} />
            ))}
          </fieldset>
        );
      })}
      <p className="k-hint" aria-live="polite">{P.describe(value)}</p>
    </div>
  );
}

export default function AdminTeam() {
  const [tab, setTab] = useState("members");
  const [members, setMembers] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [changes, setChanges] = useState([]);
  const [shadow, setShadow] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [edit, setEdit] = useState(null); // { member, permissions }
  const [invite, setInvite] = useState(null); // { name, email, note, template, permissions }
  const [detail, setDetail] = useState(null); // { member, activity, sessions }

  const load = useCallback(async () => {
    try {
      const [m, t, c] = await Promise.all([api.get("/admin/team"), api.get("/admin/team/templates"), api.get("/admin/team/changes")]);
      setMembers(m.data.data); setTemplates(t.data.data); setChanges(c.data.data); setError("");
    } catch (e) { setError(err(e)); setMembers([]); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === "shadow") api.get("/admin/team/shadow").then((r) => setShadow(r.data.data)).catch((e) => setError(err(e))); }, [tab]);

  const act = async (fn, ok) => {
    setError(""); setNotice("");
    try { const r = await fn(); setNotice(r?.data?.data?.message || ok); await load(); return true; } catch (e) { setError(err(e)); return false; }
  };
  const ask = (label) => { const v = window.prompt(label); return v == null ? null : v.trim(); };
  const byId = useMemo(() => new Map((members || []).map((m) => [m.id, m])), [members]);
  const memberTemplates = templates.filter((t) => t.level !== "super");

  const columns = [
    { key: "name", label: "member", render: (m) => (<div><b>{m.name}</b><div className="k-hint">{m.email}{m.note ? ` · ${m.note}` : ""}</div></div>) },
    { key: "level", label: "access", render: (m) => { const [t, tone] = LEVEL[m.status === "suspended" ? "suspended" : m.level] || ["–", "sand"]; return <span><Pill tone={tone}>{m.removed ? "removed" : t}</Pill>{m.template ? <span className="k-hint"> {m.template.replace(/_/g, " ")}</span> : null}</span>; } },
    { key: "summary", label: "can", render: (m) => <span className="k-hint">{m.summary}</span> },
    { key: "last", label: "last active", render: (m) => day(m.lastActiveAt) },
    { key: "actions", label: "", render: (m) => (
      <div className="k-row" style={{ gap: 6, flexWrap: "wrap" }}>
        {m.level !== "super" && <Button size="sm" variant="secondary" onClick={() => setEdit({ member: m, permissions: m.permissions.filter((k) => k !== "team.manage") })}>edit access</Button>}
        <Button size="sm" variant="secondary" onClick={async () => { const [a, s] = await Promise.all([api.get(`/admin/team/${m.id}/activity`), api.get(`/admin/team/${m.id}/sessions`)]); setDetail({ member: m, activity: a.data.data, sessions: s.data.data }); }}>activity</Button>
        {m.level === "super"
          ? <Button size="sm" variant="ghost" onClick={() => { const r = ask("why make them a member?"); if (r != null) act(() => api.post(`/admin/team/${m.id}/level`, { level: "member", reason: r }), "done."); }}>make member</Button>
          : <Button size="sm" variant="ghost" onClick={() => { const r = ask("why make them a super admin?"); if (r != null) act(() => api.post(`/admin/team/${m.id}/level`, { level: "super", reason: r }), "done."); }}>make super admin</Button>}
        {m.status === "suspended"
          ? <Button size="sm" variant="ghost" onClick={() => act(() => api.post(`/admin/team/${m.id}/restore`), "access restored.")}>restore</Button>
          : <>
              <Button size="sm" variant="ghost" onClick={() => { const r = ask("why pause their access? (they're signed out at once)"); if (r) act(() => api.post(`/admin/team/${m.id}/suspend`, { reason: r }), "access paused."); }}>pause</Button>
              <Button size="sm" variant="danger" onClick={() => { const r = ask("why remove them from the team?"); if (r) act(() => api.post(`/admin/team/${m.id}/remove`, { reason: r }), "removed."); }}>remove</Button>
            </>}
      </div>
    ) },
  ];

  return (
    <div className="k-stack">
      <PageHeader title="team & access" sub="who can open what in the admin portal. changes act on their next click." actions={<Button onClick={() => setInvite({ name: "", email: "", note: "", template: memberTemplates[0]?.key || "", permissions: memberTemplates[0]?.permissions || [] })}>invite member</Button>} />
      {error && <div className="k-note bad" role="alert">{error}</div>}
      {notice && <div className="k-note" role="status">{notice}</div>}
      {changes.length > 0 && (
        <Card title="waiting for a second super admin" icon="shield" tone="orange">
          {changes.map((c) => (
            <div key={c.id} className="k-row" style={{ justifyContent: "space-between", gap: 8 }}>
              <span>{byId.get(c.target)?.name || "someone"} → {c.change.level === "super" ? "super admin" : "member"} <span className="k-hint">asked by {byId.get(c.requestedBy)?.name || "a super admin"}{c.reason ? `: ${c.reason}` : ""}</span></span>
              <span className="k-row" style={{ gap: 6 }}>
                <Button size="sm" onClick={() => act(() => api.post(`/admin/team/changes/${c.id}/confirm`), "confirmed.")}>confirm</Button>
                <Button size="sm" variant="ghost" onClick={() => act(() => api.post(`/admin/team/changes/${c.id}/cancel`), "cancelled.")}>cancel</Button>
              </span>
            </div>
          ))}
        </Card>
      )}
      <Tabs label="team sections" value={tab} onChange={setTab} tabs={[{ id: "members", label: "members", count: (members || []).length }, { id: "templates", label: "role templates", count: templates.length }, { id: "shadow", label: "would deny" }]} />
      {tab === "members" && (members === null ? <p className="k-hint">loading…</p> : <Table label="team members" rows={members} rowKey={(m) => m.id} columns={columns} minWidth={860} />)}
      {tab === "templates" && (
        <Table label="role templates" rows={templates} rowKey={(t) => t.key} minWidth={640} columns={[
          { key: "label", label: "template", render: (t) => <span><b>{t.label}</b>{t.builtIn ? <span className="k-hint"> built in{t.changed ? ", changed" : ""}</span> : null}</span> },
          { key: "can", label: "can", render: (t) => <span className="k-hint">{P.describe(t.permissions)}</span> },
          { key: "copy", label: "", render: (t) => t.level === "super" ? null : <Button size="sm" variant="secondary" onClick={() => { const label = ask(`name for a copy of "${t.label}"`); if (label) act(() => api.post("/admin/team/templates", { label, permissions: t.permissions }), "template saved."); }}>copy</Button> },
        ]} />
      )}
      {tab === "shadow" && (!shadow ? <p className="k-hint">loading…</p> : shadow.items.length === 0
        ? <EmptyState icon="shield" title="nothing would have been denied" text={shadow.enforcing ? "permissions are enforced." : "shadow mode: members aren't refused yet; this list shows what would be."} />
        : <Table label="would deny" rows={shadow.items} rowKey={(x, i) => i} columns={[
            { key: "who", label: "member", render: (x) => byId.get(x.admin)?.name || x.admin },
            { key: "permission", label: "missing", render: (x) => <Pill tone="orange">{x.permission}</Pill> },
            { key: "where", label: "where", render: (x) => <span className="k-hint">{x.where}</span> },
            { key: "count", label: "times", render: (x) => x.count },
            { key: "last", label: "last", render: (x) => day(x.last) },
          ]} />)}

      {edit && (
        <Modal title={`access: ${edit.member.name}`} onClose={() => setEdit(null)} footer={<Button onClick={async () => { if (await act(() => api.put(`/admin/team/${edit.member.id}/access`, { permissions: edit.permissions }), "access saved.")) setEdit(null); }}>save</Button>}>
          <Field label="start from a template">
            <Select aria-label="template" value="" onChange={(e) => { const t = templates.find((x) => x.key === e.target.value); if (t) setEdit({ ...edit, permissions: t.permissions.filter((k) => k !== "team.manage") }); }}>
              <option value="">choose…</option>
              {memberTemplates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </Select>
          </Field>
          <PermissionPicker value={edit.permissions} onChange={(permissions) => setEdit({ ...edit, permissions })} />
        </Modal>
      )}
      {invite && (
        <Modal title="invite a team member" sub="they get an e-mail to set their password (the link works for 72 hours)." onClose={() => setInvite(null)} footer={<Button onClick={async () => { if (await act(() => api.post("/admin/team/invite", invite), "invitation sent.")) setInvite(null); }}>send invitation</Button>}>
          <Field label="name" htmlFor="inv-name"><Input id="inv-name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></Field>
          <Field label="e-mail" htmlFor="inv-email"><Input id="inv-email" type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} /></Field>
          <Field label="job title" htmlFor="inv-note"><Input id="inv-note" value={invite.note} onChange={(e) => setInvite({ ...invite, note: e.target.value })} /></Field>
          <Field label="role template">
            <Select aria-label="role template" value={invite.template} onChange={(e) => { const t = templates.find((x) => x.key === e.target.value); setInvite({ ...invite, template: e.target.value, permissions: t ? t.permissions.filter((k) => k !== "team.manage") : [] }); }}>
              {memberTemplates.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </Select>
          </Field>
          <PermissionPicker value={invite.permissions} onChange={(permissions) => setInvite({ ...invite, permissions })} />
        </Modal>
      )}
      {detail && (
        <Modal title={detail.member.name} sub="activity and sign-ins" onClose={() => setDetail(null)} footer={<Button variant="secondary" onClick={() => act(() => api.post(`/admin/team/${detail.member.id}/sessions/end`), "signed out everywhere.").then(() => setDetail(null))}>sign them out everywhere</Button>}>
          <h3 style={{ fontSize: 14 }}>recent actions</h3>
          {detail.activity.length === 0 ? <p className="k-hint">no actions yet.</p> : <ul>{detail.activity.slice(0, 20).map((a) => <li key={a.id || a._id}>{a.action} <span className="k-hint">{day(a.at)}</span></li>)}</ul>}
          <h3 style={{ fontSize: 14 }}>sign-ins</h3>
          {detail.sessions.length === 0 ? <p className="k-hint">no sign-ins recorded (sign-in records start when admin sessions are switched on).</p> : <ul>{detail.sessions.slice(0, 20).map((s) => <li key={s.id}>{day(s.at)} · {s.device}{s.endedBecause ? ` · ended: ${s.endedBecause.replace(/_/g, " ")}` : s.open ? " · open" : ""}</li>)}</ul>}
        </Modal>
      )}
    </div>
  );
}
