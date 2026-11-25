// src/portal/HiddenTemplates.js
// Owner (25 Nov 2026): take a single resume template out of the app's gallery later, without an app update.
// Server: GET / PUT /api/admin/resume-settings (features.manage) → { hiddenTemplates, templates }. Shown on the
// features page, on the "Resume template studio" tab. A student who already uses a hidden template keeps it; it is
// only not offered for new picks. Every save is in the admin actions log. An older server (404): nothing is shown.
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Card, Button, Pill, toast } from "./kit";
import { useAdminCan } from "./adminAccess";

const NAMES = {
  modern_ats: "Modern", stanford: "Classic", jakes: "Compact", rezi: "Minimal", faang: "Executive", // the names the app's studio shows (utils/resumeRender.js)
  campus: "Campus", first_step: "First Step", fresh_start: "Fresh Start", society_leader: "Society Leader", project_first: "Project First",
  internship_ready: "Internship Ready", scholar: "Scholar", harvard: "Harvard", clean_line: "Clean Line", two_tone: "Two-tone",
};
const message = (e) => e?.response?.data?.error?.message || e?.response?.data?.message || e?.message || "request failed";

export default function HiddenTemplates() {
  const can = useAdminCan()("features.manage");
  const [data, setData] = useState(null); // { hiddenTemplates, templates }
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
  return (
    <Card title="templates in the app's gallery" icon="settings" tone="sand" style={{ margin: "16px 0" }} action={can ? <Button onClick={save} loading={busy} disabled={!changed}>save</Button> : null}>
      <p className="k-hint" style={{ marginTop: 0 }}>Hide a template to take it out of the gallery. Students already using it keep it. No app update needed.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {data.templates.map((id) => {
          const off = hidden.includes(id);
          return (
            <label key={id} style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 190 }}>
              <input type="checkbox" checked={!off} disabled={!can} onChange={() => toggle(id)} aria-label={`${NAMES[id] || id} shown in the gallery`} />
              <span>{NAMES[id] || id}</span>
              {off && <Pill tone="red">hidden</Pill>}
            </label>
          );
        })}
      </div>
    </Card>
  );
}
