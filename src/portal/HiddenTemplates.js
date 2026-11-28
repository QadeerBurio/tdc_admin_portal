// src/portal/HiddenTemplates.js
// Owner (25 Nov 2026): take a single resume template out of the app's gallery later, without an app update.
// Server: GET / PUT /api/admin/resume-settings (features.manage) → { hiddenTemplates, templates, catalog }. Shown on the
// features page, on the "Resume template studio" tab. A student who already uses a hidden template keeps it; it is
// only not offered for new picks. Every save is in the admin actions log. An older server (404): nothing is shown.
// Resume full fix: 50 templates in 12 collections; the names and collections come from the server's catalog (the one
// registry the app uses too), grouped by collection, with the ATS badge. An older server without a catalog: the ids.
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Card, Button, Pill, toast } from "./kit";
import { useAdminCan } from "./adminAccess";

// only for an older server that sends ids without the catalog
const NAMES = {
  modern_ats: "Modern", stanford: "Classic", jakes: "Compact", rezi: "Minimal", faang: "Executive",
  campus: "Campus", first_step: "First Step", fresh_start: "Fresh Start", society_leader: "Society Leader", project_first: "Project First",
  internship_ready: "Internship Ready", scholar: "Scholar", harvard: "Harvard", clean_line: "Clean Line", two_tone: "Two-tone",
};
const message = (e) => e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "request failed";

/** the templates grouped by collection, in the server's order: [[collectionName, [{ id, name, ats }]]] */
export function groupsOf(data) {
  const cat = Array.isArray(data?.catalog) ? data.catalog : null;
  const items = (data?.templates || []).map((id) => {
    const c = cat && cat.find((x) => x.id === id);
    return { id, name: c?.name || NAMES[id] || id, group: c?.collectionName || "templates", ats: c?.ats || null };
  });
  const out = [];
  for (const it of items) {
    let g = out.find(([name]) => name === it.group);
    if (!g) { g = [it.group, []]; out.push(g); }
    g[1].push(it);
  }
  return out;
}

export default function HiddenTemplates() {
  const can = useAdminCan()("features.manage");
  const [data, setData] = useState(null); // { hiddenTemplates, templates, catalog }
  const [hidden, setHidden] = useState([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    api.get("/admin/resume-settings")
      .then((r) => { const d = r.data?.data; if (live && d && Array.isArray(d.templates)) { setData(d); setHidden(d.hiddenTemplates || []); } })
      .catch(() => {}); // older server or no permission: the card stays away
    return () => { live = false; };
  }, []);
  if (!data) return null;
  const changed = [...hidden].sort().join() !== [...(data.hiddenTemplates || [])].sort().join();
  const toggle = (id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  const save = async () => {
    setBusy(true);
    try {
      const r = await api.put("/admin/resume-settings", { hiddenTemplates: hidden });
      const d = r.data?.data;
      setData((x) => ({ ...x, hiddenTemplates: d?.hiddenTemplates || hidden }));
      setHidden(d?.hiddenTemplates || hidden);
      toast("saved: the app shows the change within a minute");
    } catch (e) { toast(message(e)); } finally { setBusy(false); }
  };
  const groups = groupsOf(data);
  const shown = data.templates.length - hidden.filter((id) => data.templates.includes(id)).length;
  return (
    <Card title="templates in the app's gallery" icon="settings" tone="sand" style={{ margin: "16px 0" }} action={can ? <Button onClick={save} loading={busy} disabled={!changed}>save</Button> : null}>
      <p className="k-hint" style={{ marginTop: 0 }}>Hide a template to take it out of the gallery. Students already using it keep it. No app update needed. {shown} of {data.templates.length} shown.</p>
      {groups.map(([group, items]) => (
        <div key={group} style={{ marginBottom: 12 }} data-testid={`template-group-${group}`}>
          <div style={{ fontWeight: 700, fontSize: 13, margin: "6px 0" }}>{group} <span className="k-hint">({items.length})</span></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.map(({ id, name, ats }) => {
              const off = hidden.includes(id);
              return (
                <label key={id} style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 190 }}>
                  <input type="checkbox" checked={!off} disabled={!can} onChange={() => toggle(id)} aria-label={`${name} shown in the gallery`} />
                  <span>{name}</span>
                  {ats === "safe" && <Pill tone="green">ATS-safe</Pill>}
                  {off && <Pill tone="red">hidden</Pill>}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </Card>
  );
}
