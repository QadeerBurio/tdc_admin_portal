// AdminUniversities.js: the shared university list (admin, under "users"). One list for signup, student verification,
// profiles, student lists, filters and metrics. Every change is logged in the admin action log.
//   list:      search, filter by city and status, student counts; add, edit (name, short name, city, aliases), hide /
//              show; pending requests: approve, or reject with a reason (optionally merging into an existing one)
//   merge:     move every student of one entry into another; the old name stays as an alias
//   unmatched: old names students typed at signup that aren't on the list yet, with counts: "match to …" or
//              "add as new". Reading it changes nothing; only a click does.
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Select, Tabs, EmptyState, Pill, Table, Modal, SearchInput, toast } from "../portal/kit";
import universitiesApi, { STATUS_LABEL, STATUS_TONE } from "../services/universitiesApi";

const blankForm = { name: "", shortName: "", city: "", aliases: "" };
const asForm = (u) => ({ name: u.name || "", shortName: u.shortName || "", city: u.city || "", aliases: (u.aliases || []).join(", ") });

// pick an approved university (merge target, "match to …"): a search box over the public list
export function UniversitySearch({ value, onChange, excludeId, label = "university", id = "uni-target" }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => universitiesApi.search(q, 15).then((r) => { if (live) setRows((r || []).filter((x) => x.id !== excludeId)); }).catch(() => live && setRows([])), q ? 200 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [q, excludeId]);
  return (
    <Field label={label} htmlFor={id}>
      <SearchInput id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="name, short name or city" aria-label={`search ${label}`} />
      <div role="listbox" aria-label={`${label} results`} style={{ maxHeight: 220, overflowY: "auto", marginTop: 6 }}>
        {rows.map((u) => (
          <button key={u.id} type="button" role="option" aria-selected={value?.id === u.id} onClick={() => onChange(u)} className={`k-option${value?.id === u.id ? " is-on" : ""}`}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", minHeight: 44, border: 0, borderBottom: "1px solid var(--k-line, #ece7db)", background: value?.id === u.id ? "var(--k-yellow-soft, #fff1cc)" : "transparent", cursor: "pointer" }}>
            <strong>{u.name}</strong> <span className="k-hint">{[u.shortName, u.city].filter(Boolean).join(" · ")}</span>
          </button>
        ))}
        {!rows.length && <div className="k-hint" style={{ padding: 8 }}>no match</div>}
      </div>
    </Field>
  );
}

export default function AdminUniversities() {
  const [available, setAvailable] = useState(null);
  useEffect(() => { universitiesApi.available().then(setAvailable); }, []);
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [cities, setCities] = useState([]);
  const [rows, setRows] = useState(null);
  const [unmatched, setUnmatched] = useState(null);
  const [edit, setEdit] = useState(null); // { u?: row, form, mode: "add" | "edit" | "approve" | "add_unmatched" }
  const [reject, setReject] = useState(null); // { u, reason, into }
  const [merge, setMerge] = useState(null); // { u, into, mode: "merge" | "match" }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setRows(null);
    universitiesApi.list({ ...(search.trim() ? { search: search.trim() } : {}), ...(city ? { city } : {}), ...(status ? { status } : {}) })
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch((e) => { toast(e.message, "bad"); setRows([]); });
  }, [search, city, status]);
  const loadUnmatched = useCallback(() => { setUnmatched(null); universitiesApi.unmatched().then((d) => setUnmatched(Array.isArray(d) ? d : [])).catch((e) => { toast(e.message, "bad"); setUnmatched([]); }); }, []);
  useEffect(() => { if (available) universitiesApi.cities().then((c) => setCities(c || [])).catch(() => {}); }, [available]);
  useEffect(() => { if (!available || tab !== "list") return undefined; const t = setTimeout(load, 250); return () => clearTimeout(t); }, [available, tab, load]);
  useEffect(() => { if (available && tab === "unmatched") loadUnmatched(); }, [available, tab, loadUnmatched]);

  const run = async (task, done) => {
    setBusy(true);
    try { const r = await task(); toast(done(r), "ok"); return r; } catch (e) { toast(e.message, "bad"); return null; } finally { setBusy(false); }
  };
  const refresh = () => (tab === "list" ? load() : loadUnmatched());

  const saveEdit = async () => {
    const { u, form, mode } = edit;
    const body = { name: form.name, shortName: form.shortName, city: form.city, aliases: form.aliases };
    const r = await run(
      () => (mode === "add" ? universitiesApi.add(body) : mode === "approve" ? universitiesApi.approve(u.id, body) : mode === "add_unmatched" ? universitiesApi.addUnmatched(u.id, body) : universitiesApi.edit(u.id, body)),
      () => ({ add: "added", approve: "approved", add_unmatched: "added to the list", edit: "saved" }[mode]),
    );
    if (r) { setEdit(null); refresh(); }
  };
  const doReject = async () => {
    const r = await run(() => universitiesApi.reject(reject.u.id, { reason: reject.reason, ...(reject.into ? { mergeInto: reject.into.id } : {}) }),
      (d) => (d?.merged ? `rejected; ${d.merged.moved.students} student${d.merged.moved.students === 1 ? "" : "s"} moved to ${d.merged.to.name}` : "rejected"));
    if (r) { setReject(null); refresh(); }
  };
  const doMerge = async () => {
    const r = await run(() => (merge.mode === "match" ? universitiesApi.matchTo(merge.u.id, merge.into.id) : universitiesApi.merge(merge.u.id, merge.into.id)),
      (d) => `${d.moved.students} student${d.moved.students === 1 ? "" : "s"} moved to ${d.to.name}; "${d.from.name}" kept as an alias`);
    if (r) { setMerge(null); refresh(); }
  };
  const toggleHidden = async (u) => {
    const r = await run(() => (u.status === "hidden" ? universitiesApi.show(u.id) : universitiesApi.hide(u.id)), () => (u.status === "hidden" ? "shown again" : "hidden"));
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
              <option value="">every status</option><option value="pending">pending requests</option><option value="approved">approved</option><option value="unmatched">unmatched (old names)</option><option value="hidden">hidden</option>
            </Select>
          </div>
          <Table loading={!rows} rows={rows || []} rowKey={(r) => r.id} minWidth={900} label="universities" empty={<EmptyState icon="grad" tone="sand" title="nothing here" />}
            columns={[
              { key: "name", label: "university", render: (r) => <><strong>{r.name}</strong>{r.aliases.length > 0 && <div className="k-hint">also: {r.aliases.slice(0, 4).join(", ")}{r.aliases.length > 4 ? "…" : ""}</div>}</> },
              { key: "short", label: "short name", render: (r) => r.shortName || <span className="k-hint">–</span> },
              { key: "city", label: "city", render: (r) => r.city || <span className="k-hint">–</span> },
              { key: "students", label: "students", render: (r) => r.students },
              { key: "status", label: "status", render: (r) => <><Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status] || r.status}</Pill>{r.rejectReason && <div className="k-hint">{r.rejectReason}</div>}{r.status === "pending" && r.source === "student" && <div className="k-hint">a student's request</div>}</> },
              { key: "act", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {r.status === "pending" && <>
                    <Button size="sm" onClick={() => setEdit({ mode: "approve", u: r, form: asForm(r) })} aria-label={`approve ${r.name}`}>approve</Button>
                    <Button size="sm" variant="secondary" onClick={() => setReject({ u: r, reason: "", into: null })} aria-label={`reject ${r.name}`}>reject</Button>
                  </>}
                  {r.status !== "pending" && !r.mergedInto && <Button size="sm" variant="secondary" onClick={() => setEdit({ mode: r.status === "unmatched" ? "add_unmatched" : "edit", u: r, form: asForm(r) })} aria-label={`edit ${r.name}`}>{r.status === "unmatched" ? "add as new" : "edit"}</Button>}
                  {!r.mergedInto && <Button size="sm" variant="secondary" onClick={() => setMerge({ u: r, into: null, mode: r.status === "unmatched" ? "match" : "merge" })} aria-label={`merge ${r.name}`}>{r.status === "unmatched" ? "match to…" : "merge into…"}</Button>}
                  {["approved", "hidden"].includes(r.status) && !r.mergedInto && <Button size="sm" variant="secondary" onClick={() => toggleHidden(r)} disabled={busy} aria-label={`${r.status === "hidden" ? "show" : "hide"} ${r.name}`}>{r.status === "hidden" ? "show" : "hide"}</Button>}
                </div>
              ) },
            ]} />
        </div>
      )}

      {tab === "unmatched" && (
        <div style={{ marginTop: 16 }} data-screen="admin-universities-unmatched">
          <p className="k-hint">names students typed at signup before the list existed. nothing changes until you click.</p>
          <Table loading={!unmatched} rows={unmatched || []} rowKey={(r) => r.id} minWidth={820} label="unmatched names" empty={<EmptyState icon="check" tone="green" title="every name is matched" />}
            columns={[
              { key: "name", label: "typed name", render: (r) => <strong>{r.name}</strong> },
              { key: "students", label: "students", render: (r) => r.students },
              { key: "suggestion", label: "probably", render: (r) => (r.suggestion ? <>{r.suggestion.name}<div className="k-hint">{[r.suggestion.shortName, r.suggestion.city].filter(Boolean).join(" · ")}</div></> : <span className="k-hint">no close match</span>) },
              { key: "act", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {r.suggestion && <Button size="sm" onClick={() => setMerge({ u: r, into: r.suggestion, mode: "match" })} aria-label={`match ${r.name} to ${r.suggestion.name}`}>match to {r.suggestion.shortName || r.suggestion.name}</Button>}
                  <Button size="sm" variant="secondary" onClick={() => setMerge({ u: r, into: null, mode: "match" })} aria-label={`match ${r.name} to another university`}>match to…</Button>
                  <Button size="sm" variant="secondary" onClick={() => setEdit({ mode: "add_unmatched", u: r, form: { ...blankForm, name: r.name } })} aria-label={`add ${r.name} as new`}>add as new</Button>
                </div>
              ) },
            ]} />
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} icon="grad" tone="blue"
        title={edit ? { add: "add a university", edit: `edit ${edit.u?.name}`, approve: `approve: ${edit.u?.name}`, add_unmatched: `add "${edit.u?.name}" as a new university` }[edit.mode] : ""}
        sub={edit?.mode === "approve" ? "check the name and city; add a short name if it has one. its students keep it." : edit?.mode === "add_unmatched" ? "its students move with it." : ""}
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>cancel</Button><Button loading={busy} disabled={f.name.trim().length < 3 || !f.city.trim()} onClick={saveEdit}>{edit?.mode === "approve" ? "approve" : "save"}</Button></>}>
        <Field label="name" htmlFor="uni-name"><Input id="uni-name" value={f.name} onChange={setF("name")} /></Field>
        <Field label="short name" htmlFor="uni-short" hint="e.g. IoBM, NUST"><Input id="uni-short" value={f.shortName} onChange={setF("shortName")} /></Field>
        <Field label="city" htmlFor="uni-city"><Input id="uni-city" value={f.city} onChange={setF("city")} /></Field>
        <Field label="other names (aliases)" htmlFor="uni-aliases" hint="comma-separated: what students also type"><Input id="uni-aliases" value={f.aliases} onChange={setF("aliases")} /></Field>
      </Modal>

      <Modal open={!!reject} onClose={() => setReject(null)} icon="grad" tone="red" title={reject ? `reject: ${reject.u.name}` : ""}
        sub="the request is hidden. if it's really an existing university, merge it: its students move there."
        footer={<><Button variant="secondary" onClick={() => setReject(null)}>cancel</Button><Button loading={busy} disabled={(reject?.reason || "").trim().length < 3} onClick={doReject}>{reject?.into ? `reject and merge into ${reject.into.shortName || reject.into.name}` : "reject"}</Button></>}>
        {reject && <>
          <Field label="reason (required)" htmlFor="uni-reason"><Textarea id="uni-reason" value={reject.reason} onChange={(e) => setReject({ ...reject, reason: e.target.value })} placeholder="e.g. duplicate of IoBM; not a degree-awarding institute" /></Field>
          <UniversitySearch id="uni-reject-into" label="merge into an existing university (optional)" value={reject.into} excludeId={reject.u.id} onChange={(u) => setReject({ ...reject, into: reject.into?.id === u.id ? null : u })} />
        </>}
      </Modal>

      <Modal open={!!merge} onClose={() => setMerge(null)} icon="grad" tone="blue" title={merge ? `${merge.mode === "match" ? "match" : "merge"} "${merge.u.name}"` : ""}
        sub={merge ? `${merge.u.students} student${merge.u.students === 1 ? "" : "s"} move to the university you pick; "${merge.u.name}" stays as one of its other names.` : ""}
        footer={<><Button variant="secondary" onClick={() => setMerge(null)}>cancel</Button><Button loading={busy} disabled={!merge?.into} onClick={doMerge}>{merge?.into ? `move to ${merge.into.shortName || merge.into.name}` : "pick a university"}</Button></>}>
        {merge && <UniversitySearch id="uni-merge-into" label="into" value={merge.into} excludeId={merge.u.id} onChange={(u) => setMerge({ ...merge, into: u })} />}
      </Modal>
    </div>
  );
}
