// AdminActions.js: the unified admin action log (admin only, read-only). Every logged admin write: when, which
// admin, the action, its target, the changed fields before and after, and the reason. Filters: admin, action
// (or a whole area, e.g. every loyalty action), target type and id, and dates. Nothing here can change a row.
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Input, Select, DateInput, EmptyState, Pill, toast } from "../portal/kit";
import adminActionsApi from "../services/adminActionsApi";

const when = (iso) => new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" });
const short = (v) => {
  if (v === undefined) return "–";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
};
// the changed fields: key: before → after
export function changes(before, after) {
  const b = before && typeof before === "object" ? before : {};
  const a = after && typeof after === "object" ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])];
  return keys.map((k) => ({ key: k, from: b[k], to: a[k] }));
}
const AREA = (action) => String(action || "").split(".")[0];
const blank = { adminId: "", action: "", targetType: "", targetId: "", from: "", to: "" };

export default function AdminActions() {
  const [facets, setFacets] = useState({ actions: [], targetTypes: [], admins: [] });
  const [filters, setFilters] = useState(blank);
  const [applied, setApplied] = useState(blank);
  const [data, setData] = useState(null); // { rows, next }
  const [more, setMore] = useState(false);

  useEffect(() => { adminActionsApi.facets().then(setFacets).catch(() => {}); }, []);
  const params = (f, before) => ({
    ...(f.adminId ? { adminId: f.adminId } : {}), ...(f.action ? { action: f.action } : {}), ...(f.targetType ? { targetType: f.targetType } : {}),
    ...(f.targetId.trim() ? { targetId: f.targetId.trim() } : {}),
    ...(f.from ? { from: new Date(`${f.from}T00:00:00+05:00`).toISOString() } : {}), ...(f.to ? { to: new Date(`${f.to}T23:59:59.999+05:00`).toISOString() } : {}),
    limit: 50, ...(before ? { before } : {}),
  });
  const load = useCallback(async (f) => {
    setData(null);
    try { setData(await adminActionsApi.list(params(f))); } catch (e) { toast(e.message, "bad"); setData({ rows: [], next: null }); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(applied); }, [applied, load]);
  const loadMore = async () => {
    setMore(true);
    try {
      const page = await adminActionsApi.list(params(applied, data.next));
      setData((d) => ({ rows: [...d.rows, ...page.rows], next: page.next }));
    } catch (e) { toast(e.message, "bad"); } finally { setMore(false); }
  };
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const areas = [...new Set(facets.actions.map(AREA))].sort();

  return (
    <div className="tdcp k-page" data-screen="admin-actions">
      <PageHeader title="admin actions" sub="every logged admin change: who, what, on which record, before and after, and why. read-only." />
      <form className="k-card pad" onSubmit={(e) => { e.preventDefault(); setApplied(filters); }} aria-label="filters" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <Field label="admin" htmlFor="aa-admin">
            <Select id="aa-admin" value={filters.adminId} onChange={set("adminId")}>
              <option value="">every admin</option>
              {facets.admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="action" htmlFor="aa-action">
            <Select id="aa-action" value={filters.action} onChange={set("action")}>
              <option value="">every action</option>
              {areas.map((a) => <option key={`${a}.*`} value={`${a}.*`}>{`all ${a}`}</option>)}
              {facets.actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </Field>
          <Field label="target type" htmlFor="aa-type">
            <Select id="aa-type" value={filters.targetType} onChange={set("targetType")}>
              <option value="">every type</option>
              {facets.targetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="target id" htmlFor="aa-target"><Input id="aa-target" value={filters.targetId} onChange={set("targetId")} placeholder="paste an id" /></Field>
          <Field label="from (Karachi)" htmlFor="aa-from"><DateInput id="aa-from" value={filters.from} onChange={set("from")} /></Field>
          <Field label="to (Karachi)" htmlFor="aa-to"><DateInput id="aa-to" value={filters.to} onChange={set("to")} /></Field>
        </div>
        <div className="k-row" style={{ gap: 8, marginTop: 12 }}>
          <Button type="submit" icon="search">apply filters</Button>
          <Button variant="secondary" onClick={() => { setFilters(blank); setApplied(blank); }}>clear</Button>
        </div>
      </form>

      {!data ? <PageLoading /> : data.rows.length === 0 ? (
        <EmptyState icon="receipt" tone="sand" title="no admin actions" text="nothing logged matches these filters. the log starts with the first admin change after it was switched on." />
      ) : (
        <div className="k-table-card">
          {/* focusable, so keyboard users can scroll the wide table */}
          <div className="k-table-scroll" tabIndex={0} role="region" aria-label="admin actions table">
            <table className="k-table" style={{ minWidth: 960 }}>
              <caption className="k-hint" style={{ textAlign: "left", padding: "8px 12px" }}>{data.rows.length}{data.next ? "+" : ""} actions, newest first</caption>
              <thead><tr><th scope="col">when</th><th scope="col">admin</th><th scope="col">action</th><th scope="col">target</th><th scope="col">changes</th><th scope="col">reason</th></tr></thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} data-action-row={r.action}>
                    <td style={{ whiteSpace: "nowrap" }}>{when(r.at)}</td>
                    <td>{r.admin.name}</td>
                    <td><Pill tone="sand">{r.action}</Pill></td>
                    <td><div>{r.targetType}</div><code className="k-muted" style={{ fontSize: 12 }}>{r.targetId}</code></td>
                    <td>
                      {changes(r.before, r.after).length === 0 ? <span className="k-muted">–</span> : (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
                          {changes(r.before, r.after).map((c) => <li key={c.key}><strong>{c.key}</strong>: {short(c.from)} → {short(c.to)}</li>)}
                        </ul>
                      )}
                    </td>
                    <td style={{ maxWidth: 260 }}>{r.reason || <span className="k-muted">none given</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.next && <div style={{ padding: 12 }}><Button variant="secondary" loading={more} onClick={loadMore}>load more</Button></div>}
        </div>
      )}
    </div>
  );
}
