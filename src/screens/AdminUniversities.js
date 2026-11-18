// AdminUniversities.js: the shared university list (admin, under "users"). One list for signup, student verification,
// profiles, student lists, filters and metrics. Every change is logged in the admin action log.
//   list:      every university (shown, hidden, unmatched) with search, city / status filters and student counts; add,
//              edit (name, short name, city, aliases), hide / show. Only admins add universities; an addition shows in
//              the app and portal dropdowns within a minute.
//   merge:     move every student of one entry into another; the old name stays as an alias
//   unmatched: old names students typed at signup that aren't on the list yet (UnmatchedUniversities.js): each with
//              a suggested official university and a confidence; high ones matched in bulk, the rest one by one or
//              "add as new". Reading it changes nothing; only a click does.
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Input, Select, Tabs, EmptyState, Pill, Table, Modal, SearchInput, toast } from "../portal/kit";
import universitiesApi, { STATUS_LABEL, STATUS_TONE } from "../services/universitiesApi";
import UniversitySearch from "./UniversitySearch";
import UnmatchedUniversities from "./UnmatchedUniversities";

export { UniversitySearch };

const blankForm = { name: "", shortName: "", city: "", aliases: "" };
const asForm = (u) => ({ name: u.name || "", shortName: u.shortName || "", city: u.city || "", aliases: (u.aliases || []).join(", ") });

export default function AdminUniversities() {
  const [available, setAvailable] = useState(null);
  useEffect(() => { universitiesApi.available().then(setAvailable); }, []);
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [cities, setCities] = useState([]);
  const [rows, setRows] = useState(null);
  const [unmatchedKey, setUnmatchedKey] = useState(0); // bump to reload the unmatched names
  const [edit, setEdit] = useState(null); // { u?: row, form, mode: "add" | "edit" | "approve" | "add_unmatched" }
  const [merge, setMerge] = useState(null); // { u, into, mode: "merge" | "match" }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setRows(null);
    universitiesApi.list({ ...(search.trim() ? { search: search.trim() } : {}), ...(city ? { city } : {}), ...(status ? { status } : {}) })
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch((e) => { toast(e.message, "bad"); setRows([]); });
  }, [search, city, status]);
  useEffect(() => { if (available) universitiesApi.cities().then((c) => setCities(c || [])).catch(() => {}); }, [available]);
  useEffect(() => { if (!available || tab !== "list") return undefined; const t = setTimeout(load, 250); return () => clearTimeout(t); }, [available, tab, load]);

  const run = async (task, done) => {
    setBusy(true);
    try { const r = await task(); toast(done(r), "ok"); return r; } catch (e) { toast(e.message, "bad"); return null; } finally { setBusy(false); }
  };
  const refresh = () => (tab === "list" ? load() : setUnmatchedKey((k) => k + 1));

  const saveEdit = async () => {
    const { u, form, mode } = edit;
    const body = { name: form.name, shortName: form.shortName, city: form.city, aliases: form.aliases };
    const r = await run(
      () => (mode === "add" ? universitiesApi.add(body) : mode === "add_unmatched" ? universitiesApi.addUnmatched(u.id, body) : universitiesApi.edit(u.id, body)),
      () => ({ add: "added: it shows in the app and portal within a minute", add_unmatched: "added to the list", edit: "saved" }[mode]),
    );
    if (r) { setEdit(null); refresh(); }
  };
  const doMerge = async () => {
    const r = await run(() => (merge.mode === "match" ? universitiesApi.matchTo(merge.u.id, merge.into.id) : universitiesApi.merge(merge.u.id, merge.into.id)),
      (d) => `${d.moved.students} student${d.moved.students === 1 ? "" : "s"} moved to ${d.to.name}; "${d.from.name}" kept as an alias`);
    if (r) { setMerge(null); refresh(); }
  };
  const toggleHidden = async (u) => {
    const r = await run(() => (u.status === "approved" ? universitiesApi.hide(u.id) : universitiesApi.show(u.id)), () => (u.status === "approved" ? "hidden" : "shown in the dropdowns"));
    if (r) refresh();
  };

  if (available === null) return <PageLoading />;
  if (!available) return <div className="tdcp k-page" data-screen="admin-universities"><PageHeader title="universities" /><EmptyState icon="grad" tone="blue" title="couldn't load universities" text="try again in a moment." /></div>;

  const f = edit?.form || blankForm;
  const setF = (k) => (e) => setEdit({ ...edit, form: { ...edit.form, [k]: e.target.value } });
  return (
    <div className="tdcp k-page" data-screen="admin-universities">
      <PageHeader title="universities" sub="one list for signup, student verification, profiles, student lists, filters and metrics. matching never uses it."
        actions={<Button icon="plus" onClick={() => setEdit({ mode: "add", form: { ...blankForm } })}>add university</Button>} />
      <Tabs label="universities" value={tab} onChange={setTab} tabs={[{ id: "list", label: "all universities", icon: "grad" }, { id: "unmatched", label: "unmatched names", icon: "search" }]} />

      {tab === "list" && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="name, short name, alias or city" aria-label="search universities" style={{ minWidth: 260 }} />
            <Select aria-label="filter by city" value={city} onChange={(e) => setCity(e.target.value)} style={{ maxWidth: 200 }}>
              <option value="">all cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select aria-label="filter by status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 220 }}>
              <option value="">every status</option><option value="approved">shown</option><option value="hidden">hidden</option><option value="unmatched">unmatched (old names)</option>
            </Select>
          </div>
          <Table loading={!rows} rows={rows || []} rowKey={(r) => r.id} minWidth={900} label="universities" empty={<EmptyState icon="grad" tone="sand" title="nothing here" />}
            columns={[
              { key: "name", label: "university", render: (r) => <><strong>{r.name}</strong>{r.aliases.length > 0 && <div className="k-hint">also: {r.aliases.slice(0, 4).join(", ")}{r.aliases.length > 4 ? "…" : ""}</div>}</> },
              { key: "short", label: "short name", render: (r) => r.shortName || <span className="k-hint">–</span> },
              { key: "city", label: "city", render: (r) => r.city || <span className="k-hint">–</span> },
              { key: "students", label: "students", render: (r) => r.students },
              { key: "status", label: "status", render: (r) => <><Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status] || r.status}</Pill>{r.rejectReason && <div className="k-hint">{r.rejectReason}</div>}</> },
              { key: "act", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {!r.mergedInto && <Button size="sm" variant="secondary" onClick={() => setEdit({ mode: r.status === "unmatched" ? "add_unmatched" : "edit", u: r, form: asForm(r) })} aria-label={`edit ${r.name}`}>{r.status === "unmatched" ? "add as new" : "edit"}</Button>}
                  {!r.mergedInto && <Button size="sm" variant="secondary" onClick={() => setMerge({ u: r, into: null, mode: r.status === "unmatched" ? "match" : "merge" })} aria-label={`merge ${r.name}`}>{r.status === "unmatched" ? "match to…" : "merge into…"}</Button>}
                  {["approved", "hidden", "pending"].includes(r.status) && !r.mergedInto && <Button size="sm" variant="secondary" onClick={() => toggleHidden(r)} disabled={busy} aria-label={`${r.status === "approved" ? "hide" : "show"} ${r.name}`}>{r.status === "approved" ? "hide" : "show"}</Button>}
                </div>
              ) },
            ]} />
        </div>
      )}

      {tab === "unmatched" && <UnmatchedUniversities reloadKey={unmatchedKey} onAddNew={(r) => setEdit({ mode: "add_unmatched", u: r, form: { ...blankForm, name: r.name } })} />}

      <Modal open={!!edit} onClose={() => setEdit(null)} icon="grad" tone="blue"
        title={edit ? { add: "add a university", edit: `edit ${edit.u?.name}`, add_unmatched: `add "${edit.u?.name}" as a new university` }[edit.mode] : ""}
        sub={edit?.mode === "add" ? "it shows in the app and portal dropdowns within a minute." : edit?.mode === "add_unmatched" ? "its students move with it." : ""}
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>cancel</Button><Button loading={busy} disabled={f.name.trim().length < 3 || !f.city.trim()} onClick={saveEdit}>save</Button></>}>
        <Field label="name" htmlFor="uni-name"><Input id="uni-name" value={f.name} onChange={setF("name")} /></Field>
        <Field label="short name" htmlFor="uni-short" hint="e.g. IoBM, NUST"><Input id="uni-short" value={f.shortName} onChange={setF("shortName")} /></Field>
        <Field label="city" htmlFor="uni-city"><Input id="uni-city" value={f.city} onChange={setF("city")} /></Field>
        <Field label="other names (aliases)" htmlFor="uni-aliases" hint="comma-separated: what students also type"><Input id="uni-aliases" value={f.aliases} onChange={setF("aliases")} /></Field>
      </Modal>

      <Modal open={!!merge} onClose={() => setMerge(null)} icon="grad" tone="blue" title={merge ? `${merge.mode === "match" ? "match" : "merge"} "${merge.u.name}"` : ""}
        sub={merge ? `${merge.u.students} student${merge.u.students === 1 ? "" : "s"} move to the university you pick; "${merge.u.name}" stays as one of its other names.` : ""}
        footer={<><Button variant="secondary" onClick={() => setMerge(null)}>cancel</Button><Button loading={busy} disabled={!merge?.into} onClick={doMerge}>{merge?.into ? `move to ${merge.into.shortName || merge.into.name}` : "pick a university"}</Button></>}>
        {merge && <UniversitySearch id="uni-merge-into" label="into" value={merge.into} excludeId={merge.u.id} onChange={(u) => setMerge({ ...merge, into: u })} />}
      </Modal>
    </div>
  );
}
