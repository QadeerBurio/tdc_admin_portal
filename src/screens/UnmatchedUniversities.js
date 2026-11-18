// UnmatchedUniversities.js: the admin's "unmatched names" (old names students typed at signup), made fast.
// Every name comes with the most likely official university and how sure that is (the server's matcher: name, short
// name, aliases, initials, city; tolerant of case, spacing, abbreviations, city suffixes and typos):
//   high         checkboxes (all ticked to start) and "match all selected": one confirm with the count and examples
//   medium / low the suggestion, plus a dropdown of other likely ones or "another university…" (search the list)
//   none         "add as new", or pick one (dropdown / search)
// Matching merges the old entry into the official one on the server: students, offers and confessions move, the old
// spelling becomes an alias (later signups with it match by themselves), every match is logged. Counts on top:
// unmatched names, students on them, matched today. Reading changes nothing; only a click (and its confirm) does.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Checkbox, EmptyState, Modal, Pill, Select, StatCard, Table, toast } from "../portal/kit";
import universitiesApi from "../services/universitiesApi";
import UniversitySearch from "./UniversitySearch";

const OTHER = "__other";
const CONF = {
  high: { label: "high", tone: "green", title: "high confidence", text: "nearly the same name, nothing else close. ticked ones are matched in one go (you confirm first)." },
  medium: { label: "medium", tone: "yellow", title: "medium and low confidence", text: "check the suggestion, or pick another one from the dropdown." },
  low: { label: "low", tone: "orange" },
  none: { label: "none", tone: "sand", title: "no likely match", text: "add it as a new university, or pick one from the list." },
};
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const short = (u) => (u ? u.shortName || u.name : "");

export default function UnmatchedUniversities({ onAddNew, reloadKey = 0 }) {
  const [rows, setRows] = useState(null);
  const [summary, setSummary] = useState(null);
  const [picked, setPicked] = useState({}); // id -> ticked (high)
  const [choice, setChoice] = useState({}); // id -> the university chosen (medium / low / none): dropdown or search
  const [single, setSingle] = useState(null); // { r, into }  one name, confirm (or search when into is null)
  const [bulk, setBulk] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setRows(null);
    universitiesApi.unmatched()
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setRows(list);
        setPicked(Object.fromEntries(list.filter((r) => r.confidence === "high" && r.suggestion).map((r) => [r.id, true])));
        setChoice(Object.fromEntries(list.filter((r) => r.suggestion).map((r) => [r.id, r.suggestion])));
      })
      .catch((e) => { toast(e.message, "bad"); setRows([]); });
    universitiesApi.unmatchedSummary().then(setSummary).catch(() => setSummary(null));
  }, []);
  useEffect(() => { load(); }, [load, reloadKey]);

  const groups = useMemo(() => {
    const g = { high: [], review: [], none: [] };
    for (const r of rows || []) {
      if (r.confidence === "high" && r.suggestion) g.high.push(r);
      else if ((r.confidence === "medium" || r.confidence === "low") && r.suggestion) g.review.push(r);
      else g.none.push(r);
    }
    return g;
  }, [rows]);
  const selected = groups.high.filter((r) => picked[r.id]);
  const selectedStudents = selected.reduce((a, r) => a + (r.students || 0), 0);
  const allTicked = groups.high.length > 0 && selected.length === groups.high.length;

  // the universities a row can be matched to from its dropdown: the suggestion, then the alternatives
  const optionsOf = (r) => {
    const seen = new Set();
    return [choice[r.id], r.suggestion, ...(r.alternatives || [])].filter((u) => u && !seen.has(u.id) && seen.add(u.id));
  };
  const targetOf = (r) => choice[r.id] || null;

  const matchBulk = async () => {
    setBusy(true);
    try {
      const d = await universitiesApi.matchBulk(selected.map((r) => ({ id: r.id, toId: r.suggestion.id })));
      const failed = d?.failed || [];
      toast(`${plural(d.matched, "name")} matched, ${plural(d.students, "student")} moved${failed.length ? `; ${failed.length} not matched: ${failed.slice(0, 3).map((f) => f.message).join("; ")}` : ""}`, failed.length ? "bad" : "ok");
      setBulk(false);
      load();
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  };
  const matchOne = async () => {
    setBusy(true);
    try {
      const d = await universitiesApi.matchTo(single.r.id, single.into.id);
      toast(`${plural(d.moved?.students || 0, "student")} moved to ${d.to?.name || single.into.name}; "${single.r.name}" kept as another name`, "ok");
      setSingle(null);
      load();
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  };

  const nameCell = (r) => <><strong>{r.name}</strong><div className="k-hint">{plural(r.students || 0, "student")}</div></>;
  const target = (u, r) => <>{u.name}<div className="k-hint">{[u.shortName, u.city, r?.reason].filter(Boolean).join(" · ")}</div></>;
  const dropdown = (r, placeholder) => (
    <Select aria-label={`match ${r.name} to`} value={choice[r.id]?.id || ""} style={{ minWidth: 240 }}
      onChange={(e) => (e.target.value === OTHER ? setSingle({ r, into: null }) : setChoice({ ...choice, [r.id]: optionsOf(r).find((u) => u.id === e.target.value) || null }))}>
      {placeholder && <option value="">{placeholder}</option>}
      {optionsOf(r).map((u) => <option key={u.id} value={u.id}>{u.name}{u.city ? ` (${u.city})` : ""}</option>)}
      <option value={OTHER}>another university…</option>
    </Select>
  );

  return (
    <div style={{ marginTop: 16 }} data-screen="admin-universities-unmatched">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 12 }} aria-label="unmatched counts" role="group">
        <StatCard label="unmatched names" value={summary?.unmatched ?? (rows ? rows.length : 0)} icon="search" tone="orange" />
        <StatCard label="students affected" value={summary?.students ?? 0} icon="grad" tone="blue" />
        <StatCard label="matched today" value={summary?.matchedToday ?? 0} icon="check" tone="green" />
      </div>
      <p className="k-hint">names students typed at signup before the list existed. nothing changes until you click.</p>

      {rows && !rows.length && <EmptyState icon="check" tone="green" title="every name is matched" />}
      {!rows && <Table loading rows={[]} columns={[{ key: "x", label: "" }]} label="unmatched names" />}

      {groups.high.length > 0 && (
        <section aria-labelledby="um-high" style={{ marginTop: 16 }} data-group="high">
          <h3 id="um-high" style={{ margin: "0 0 4px" }}>{CONF.high.title} · {groups.high.length}</h3>
          <p className="k-hint" style={{ marginTop: 0 }}>{CONF.high.text}</p>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <Checkbox label={`select all (${groups.high.length})`} checked={allTicked} onChange={(e) => setPicked(e.target.checked ? Object.fromEntries(groups.high.map((r) => [r.id, true])) : {})} />
            <Button icon="check" disabled={!selected.length || busy} onClick={() => setBulk(true)}>match all selected ({selected.length})</Button>
          </div>
          <Table rows={groups.high} rowKey={(r) => r.id} minWidth={760} label="high confidence names"
            columns={[
              { key: "pick", label: "", render: (r) => <Checkbox aria-label={`select ${r.name}`} checked={!!picked[r.id]} onChange={(e) => setPicked({ ...picked, [r.id]: e.target.checked })} /> },
              { key: "name", label: "typed name", render: nameCell },
              { key: "to", label: "matches", render: (r) => target(r.suggestion, r) },
              { key: "conf", label: "confidence", render: () => <Pill tone={CONF.high.tone}>{CONF.high.label}</Pill> },
            ]} />
        </section>
      )}

      {groups.review.length > 0 && (
        <section aria-labelledby="um-review" style={{ marginTop: 24 }} data-group="review">
          <h3 id="um-review" style={{ margin: "0 0 4px" }}>{CONF.medium.title} · {groups.review.length}</h3>
          <p className="k-hint" style={{ marginTop: 0 }}>{CONF.medium.text}</p>
          <Table rows={groups.review} rowKey={(r) => r.id} minWidth={820} label="names to check"
            columns={[
              { key: "name", label: "typed name", render: nameCell },
              { key: "conf", label: "confidence", render: (r) => <><Pill tone={CONF[r.confidence].tone}>{CONF[r.confidence].label}</Pill>{r.reason && <div className="k-hint">{r.reason}</div>}</> },
              { key: "to", label: "match to", render: (r) => dropdown(r) },
              { key: "act", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Button size="sm" disabled={!targetOf(r)} onClick={() => setSingle({ r, into: targetOf(r) })} aria-label={`match ${r.name}`}>match to {short(targetOf(r))}</Button>
                  <Button size="sm" variant="secondary" onClick={() => onAddNew?.(r)} aria-label={`add ${r.name} as new`}>add as new</Button>
                </div>
              ) },
            ]} />
        </section>
      )}

      {groups.none.length > 0 && (
        <section aria-labelledby="um-none" style={{ marginTop: 24 }} data-group="none">
          <h3 id="um-none" style={{ margin: "0 0 4px" }}>{CONF.none.title} · {groups.none.length}</h3>
          <p className="k-hint" style={{ marginTop: 0 }}>{CONF.none.text}</p>
          <Table rows={groups.none} rowKey={(r) => r.id} minWidth={760} label="names with no likely match"
            columns={[
              { key: "name", label: "typed name", render: nameCell },
              { key: "to", label: "pick one", render: (r) => dropdown(r, "pick from the list…") },
              { key: "act", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Button size="sm" onClick={() => onAddNew?.(r)} aria-label={`add ${r.name} as new`}>add as new</Button>
                  <Button size="sm" variant="secondary" disabled={!targetOf(r)} onClick={() => setSingle({ r, into: targetOf(r) })} aria-label={`match ${r.name}`}>{targetOf(r) ? `match to ${short(targetOf(r))}` : "match"}</Button>
                </div>
              ) },
            ]} />
        </section>
      )}

      <Modal open={bulk} onClose={() => setBulk(false)} icon="grad" tone="green" title={`match ${plural(selected.length, "name")}?`}
        sub={`${plural(selectedStudents, "student")} move to the official university. each old spelling becomes another name of it, so later signups with it match by themselves. every match is logged.`}
        footer={<><Button variant="secondary" onClick={() => setBulk(false)}>cancel</Button><Button loading={busy} onClick={matchBulk}>match {selected.length}</Button></>}>
        <ul aria-label="examples" style={{ margin: 0, paddingLeft: 18 }}>
          {selected.slice(0, 5).map((r) => <li key={r.id} style={{ marginBottom: 6 }}><strong>{r.name}</strong> → {r.suggestion.name} <span className="k-hint">({plural(r.students || 0, "student")})</span></li>)}
        </ul>
        {selected.length > 5 && <p className="k-hint">and {selected.length - 5} more</p>}
      </Modal>

      <Modal open={!!single} onClose={() => setSingle(null)} icon="grad" tone="blue" title={single ? `match "${single.r.name}"` : ""}
        sub={single ? `${plural(single.r.students || 0, "student")} move to ${single.into ? single.into.name : "the university you pick"}; "${single.r.name}" stays as one of its other names.` : ""}
        footer={<><Button variant="secondary" onClick={() => setSingle(null)}>cancel</Button><Button loading={busy} disabled={!single?.into} onClick={matchOne}>{single?.into ? `move to ${short(single.into)}` : "pick a university"}</Button></>}>
        {single && <UniversitySearch id="uni-match-into" label="into" value={single.into} excludeId={single.r.id} onChange={(u) => { setChoice({ ...choice, [single.r.id]: u }); setSingle({ ...single, into: u }); }} />}
      </Modal>
    </div>
  );
}
