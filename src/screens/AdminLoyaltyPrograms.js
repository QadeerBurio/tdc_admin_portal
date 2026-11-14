// AdminLoyaltyPrograms.js: every brand's loyalty program, for admins (server: /api/loyalty/admin/programs).
// List with filters (status, brand name); open one for its rules, numbers, version history and restarts; publish,
// pause, end, restart or edit it; create one on a brand's behalf (always a draft: the brand or an admin publishes).
// Every change asks for a reason and is written to the admin action log on the server.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Select, DateInput, Drawer, Modal, EmptyState, Pill, Facts, StatCard, SearchInput, Segmented, toast } from "../portal/kit";
import loyaltyApi from "../services/loyaltyApi";
import api from "../services/api";
import { ruleText } from "../portal/LoyaltyPreview";
import LoyaltyMembers from "../portal/LoyaltyMembers";

const STATUS_TONE = { draft: "sand", active: "green", paused: "orange", ended: "red" };
const day = (iso) => (iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short", year: "numeric" }) : "–");
const toDay = (iso) => (iso ? new Date(new Date(iso).getTime() + 5 * 3600e3).toISOString().slice(0, 10) : "");
const startOf = (d) => (d ? new Date(`${d}T00:00:00+05:00`).toISOString() : null);
const endOf = (d) => (d ? new Date(`${d}T23:59:59.999+05:00`).toISOString() : null);
const MIN_REASON = 5;

export default function AdminLoyaltyPrograms() {
  const [list, setList] = useState(null);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    try { setList((await loyaltyApi.adminPrograms(status === "all" ? {} : { status })).programs); }
    catch (e) { toast(e.message, "bad"); setList([]); }
  }, [status]);
  useEffect(() => { load(); }, [load]);
  const shown = useMemo(() => (list || []).filter((p) => !q.trim() || p.brandName.toLowerCase().includes(q.trim().toLowerCase())), [list, q]);

  return (
    <div className="tdcp k-page" data-screen="admin-loyalty-programs">
      <PageHeader title="loyalty programs" sub="every brand's program. changes need a reason and are logged." actions={<Button icon="plus" onClick={() => setCreating(true)}>create for a brand</Button>} />
      <div className="k-toolbar" style={{ marginBottom: 12 }}>
        <SearchInput className="k-grow" style={{ maxWidth: 360 }} placeholder="search brand" aria-label="search brand" value={q} onChange={(e) => setQ(e.target.value)} />
        <Segmented label="status" value={status} onChange={setStatus} options={["all", "draft", "active", "paused", "ended"].map((s) => ({ value: s, label: s }))} />
      </div>
      {!list ? <PageLoading /> : shown.length === 0 ? <EmptyState icon="star" tone="yellow" title="no programs" text="no loyalty program matches these filters." /> : (
        <div className="k-table-card">
          <div className="k-table-scroll" tabIndex={0} role="region" aria-label="loyalty programs table">
            <table className="k-table" style={{ minWidth: 860 }}>
              <thead><tr><th scope="col">brand</th><th scope="col">status</th><th scope="col">tiers</th><th scope="col">cap</th><th scope="col">dates</th><th scope="col">pilot</th><th scope="col">updated</th><th scope="col"><span className="tdcp-sr">open</span></th></tr></thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id} data-program={p.brandName}>
                    <td><strong>{p.brandName}</strong><div className="k-muted" style={{ fontSize: 12 }}>v{p.version}</div></td>
                    <td><Pill tone={STATUS_TONE[p.status]} dot>{p.status}</Pill></td>
                    <td style={{ fontSize: 13 }}>{p.tiers.map((t) => `${ruleText(t)}: ${t.discountPct}%`).join(" · ")}</td>
                    <td>{p.maxDiscountPct}%{p.adminMaxDiscountPct != null ? <div className="k-muted" style={{ fontSize: 12 }}>tdc cap {p.adminMaxDiscountPct}%</div> : null}</td>
                    <td style={{ fontSize: 13 }}>{p.startsAt || p.endsAt ? `${day(p.startsAt)} – ${day(p.endsAt)}` : "–"}</td>
                    <td>{p.inPilot ? <Pill tone="green">in pilot</Pill> : <Pill tone="sand">not in pilot</Pill>}</td>
                    <td style={{ fontSize: 13 }}>{day(p.updatedAt)}</td>
                    <td><Button size="sm" variant="secondary" onClick={() => setOpenId(p.id)} aria-label={`open ${p.brandName}'s program`}>open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {openId && <ProgramDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
      {creating && <CreateDialog onClose={() => setCreating(false)} onCreated={(p) => { setCreating(false); load(); setOpenId(p.id); }} existing={(list || []).map((p) => p.brand)} />}
    </div>
  );
}

// one change: a reason first (and the fields for an edit), then the server call
function ProgramDrawer({ id, onClose, onChanged }) {
  const [d, setD] = useState(null);
  const [action, setAction] = useState(null); // { kind: publish|pause|end|restart|edit }
  const [reason, setReason] = useState("");
  const [edit, setEdit] = useState({});
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try { setD(await loyaltyApi.adminProgram(id)); } catch (e) { toast(e.message, "bad"); onClose(); }
  }, [id, onClose]);
  useEffect(() => { load(); }, [load]);
  // the brand's members (same view as the brand's members tab)
  const loadMembers = useCallback((filter) => loyaltyApi.adminMembers(id, filter), [id]);
  const loadMembersCsv = useCallback((filter) => loyaltyApi.adminMembersCsv(id, filter), [id]);
  if (!d) return <Drawer open onClose={onClose} title="loyalty program"><PageLoading /></Drawer>;
  const p = d.program;
  const start = (kind) => {
    setReason("");
    if (kind === "edit") setEdit({ terms: p.terms || "", maxVisitsPerDay: p.maxVisitsPerDay, resetMonths: p.resetMonths, adminMaxDiscountPct: p.adminMaxDiscountPct ?? "", startDate: toDay(p.startsAt), endDate: toDay(p.endsAt) });
    setAction({ kind });
  };
  const run = async () => {
    setBusy(true);
    try {
      const base = { version: p.version, reason: reason.trim() };
      if (action.kind === "restart") await loyaltyApi.adminRestartProgram(p.id, base);
      else if (action.kind === "edit") {
        await loyaltyApi.adminUpdateProgram(p.id, {
          ...base, terms: edit.terms, maxVisitsPerDay: Number(edit.maxVisitsPerDay), resetMonths: Number(edit.resetMonths),
          adminMaxDiscountPct: edit.adminMaxDiscountPct === "" ? null : Number(edit.adminMaxDiscountPct), startsAt: startOf(edit.startDate), endsAt: endOf(edit.endDate),
        });
      } else await loyaltyApi.adminUpdateProgram(p.id, { ...base, status: { publish: "active", pause: "paused", end: "ended" }[action.kind] });
      toast({ publish: "published", pause: "paused", end: "ended", restart: "restarted as a draft", edit: "saved" }[action.kind], "ok");
      setAction(null);
      await load();
      onChanged();
    } catch (e) {
      toast(e.code === "VERSION_CONFLICT" ? "the program changed meanwhile; reloaded" : e.message, "bad");
      if (e.code === "VERSION_CONFLICT") { setAction(null); load(); }
    } finally { setBusy(false); }
  };
  const titles = { publish: "publish this program?", pause: "pause this program?", end: "end this program?", restart: "restart as a new draft?", edit: "edit the program" };
  const notes = {
    publish: "students in the pilot get the tier discounts at this brand from now (or from the start date).",
    pause: "visits stop counting and students get the offer's usual discount until it's published again.",
    end: "ending is final for this version: visits stop counting. it can be restarted later as a new draft, where every student starts from 0.",
    restart: "a new draft with the same rules and no dates. every student starts again from 0 visits; visits from before never count again.",
    edit: "the brand sees these changes straight away.",
  };
  const dateError = action?.kind === "edit" && edit.startDate && edit.endDate && edit.endDate < edit.startDate;
  return (
    <Drawer open onClose={onClose} title={`${p.brandName}: loyalty`} sub={`${p.status} · version ${p.version}${p.inPilot ? "" : " · brand not in the pilot"}`}>
      <div className="k-row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {["draft", "paused"].includes(p.status) && <Button size="sm" onClick={() => start("publish")}>publish</Button>}
        {p.status === "active" && <Button size="sm" variant="secondary" onClick={() => start("pause")}>pause</Button>}
        {p.status !== "ended" && <Button size="sm" variant="secondary" onClick={() => start("edit")}>edit</Button>}
        {p.status !== "ended" && <Button size="sm" variant="danger" onClick={() => start("end")}>end</Button>}
        {p.status === "ended" && <Button size="sm" onClick={() => start("restart")}>restart as a new draft</Button>}
      </div>
      <div className="k-stats" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, marginBottom: 12 }}>
        <StatCard label="verified visits" value={d.numbers.verifiedVisits} icon="check" tone="green" />
        <StatCard label="members" value={d.numbers.members} icon="users" tone="blue" />
      </div>
      <section className="k-card pad" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>rules</h3>
        <Facts rows={[
          ["tiers", p.tiers.map((t) => `${ruleText(t)}: ${t.discountPct}%`).join(" · ")],
          ["maximum discount", `${p.brandMaxDiscountPct}% (brand)${p.adminMaxDiscountPct != null ? `, ${p.adminMaxDiscountPct}% (tdc cap)` : ""}`],
          ["visits counted per day", p.maxVisitsPerDay ? String(p.maxVisitsPerDay) : "no limit"],
          ["visits expire after", p.resetMonths ? `${p.resetMonths} months` : "never"],
          ["runs", p.startsAt || p.endsAt ? `${day(p.startsAt)} – ${day(p.endsAt)}` : "no dates"],
          ["terms", p.terms || "–"],
        ]} />
      </section>
      <section className="k-card pad" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>members</h3>
        <LoyaltyMembers load={loadMembers} loadCsv={loadMembersCsv} />
      </section>
      <section className="k-card pad" style={{ marginBottom: 12 }}>
        <h3 style={{ marginTop: 0 }}>history</h3>
        {d.history.length === 0 ? <p className="k-hint">no earlier versions.</p> : (
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {d.history.map((h, i) => <li key={i} style={{ fontSize: 13 }}>v{h.version}: {h.status}{h.restarted ? " (then restarted)" : ""} · {day(h.changedAt)}</li>)}
          </ol>
        )}
        {d.restarts.length > 0 && <p className="k-hint">restarts: {d.restarts.map((r) => `v${r.endedVersion} → v${r.newVersion} on ${day(r.restartedAt)}${r.byAdmin ? " (admin)" : ""}`).join("; ")}</p>}
      </section>

      <Modal open={!!action} onClose={() => !busy && setAction(null)} title={action ? titles[action.kind] : ""} sub={action ? notes[action.kind] : ""} icon={action?.kind === "end" ? "alert" : "star"} tone={action?.kind === "end" ? "red" : "yellow"}
        footer={<><Button variant="secondary" disabled={busy} onClick={() => setAction(null)}>cancel</Button><Button variant={action?.kind === "end" ? "danger" : "primary"} loading={busy} disabled={reason.trim().length < MIN_REASON || dateError} onClick={run}>{action ? { publish: "publish", pause: "pause", end: "end program", restart: "restart", edit: "save" }[action.kind] : ""}</Button></>}>
        {action?.kind === "edit" && (
          <div style={{ display: "grid", gap: 12, marginBottom: 12 }}>
            <Field label="terms students see" htmlFor="alp-terms"><Textarea id="alp-terms" rows={2} maxLength={1000} value={edit.terms} onChange={(e) => setEdit((x) => ({ ...x, terms: e.target.value }))} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <Field label="visits per day" htmlFor="alp-day"><Input id="alp-day" type="number" min={0} max={10} value={edit.maxVisitsPerDay} onChange={(e) => setEdit((x) => ({ ...x, maxVisitsPerDay: e.target.value }))} /></Field>
              <Field label="expire after (months)" htmlFor="alp-reset"><Input id="alp-reset" type="number" min={0} max={60} value={edit.resetMonths} onChange={(e) => setEdit((x) => ({ ...x, resetMonths: e.target.value }))} /></Field>
              <Field label="tdc cap %" hint="empty = no cap" htmlFor="alp-cap"><Input id="alp-cap" type="number" min={0} max={100} value={edit.adminMaxDiscountPct} onChange={(e) => setEdit((x) => ({ ...x, adminMaxDiscountPct: e.target.value }))} /></Field>
              <Field label="start date" htmlFor="alp-start"><DateInput id="alp-start" value={edit.startDate} onChange={(e) => setEdit((x) => ({ ...x, startDate: e.target.value }))} /></Field>
              <Field label="end date" htmlFor="alp-end" error={dateError ? "the end must be on or after the start" : undefined}><DateInput id="alp-end" value={edit.endDate} onChange={(e) => setEdit((x) => ({ ...x, endDate: e.target.value }))} /></Field>
            </div>
          </div>
        )}
        <Field label="reason (logged)" hint={`at least ${MIN_REASON} characters`} htmlFor="alp-reason"><Textarea id="alp-reason" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. brand asked by email on 10 Nov" /></Field>
      </Modal>
    </Drawer>
  );
}

function CreateDialog({ onClose, onCreated, existing }) {
  const [brands, setBrands] = useState(null);
  const [form, setForm] = useState({ brandId: "", reason: "", terms: "", maxDiscountPct: 25, adminMaxDiscountPct: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get("/admin/users/brand").then((r) => {
      const taken = new Set(existing.map(String));
      setBrands((Array.isArray(r.data) ? r.data : []).filter((b) => !taken.has(String(b._id))).map((b) => ({ id: String(b._id), name: b.brandName || b.name || "brand" })).sort((a, b) => a.name.localeCompare(b.name)));
    }).catch(() => setBrands([]));
  }, [existing]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    try {
      const p = await loyaltyApi.adminCreateProgram({ brandId: form.brandId, reason: form.reason.trim(), terms: form.terms, maxDiscountPct: Number(form.maxDiscountPct), ...(form.adminMaxDiscountPct === "" ? {} : { adminMaxDiscountPct: Number(form.adminMaxDiscountPct) }) });
      toast("created as a draft: the brand or an admin publishes it", "ok");
      onCreated(p);
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={() => !busy && onClose()} title="create a loyalty program for a brand" sub="saved as a draft with the default tiers (visits 1–5: 15%, visit 6 onward: 25%); nothing is live until it's published." icon="star" tone="yellow"
      footer={<><Button variant="secondary" disabled={busy} onClick={onClose}>cancel</Button><Button loading={busy} disabled={!form.brandId || form.reason.trim().length < MIN_REASON} onClick={save}>create draft</Button></>}>
      {!brands ? <PageLoading /> : (
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="brand" hint={brands.length ? "brands that already have a program aren't listed" : "every brand already has a program"} htmlFor="alc-brand">
            <Select id="alc-brand" value={form.brandId} onChange={set("brandId")}>
              <option value="">choose a brand</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <Field label="maximum discount %" htmlFor="alc-max"><Input id="alc-max" type="number" min={1} max={100} value={form.maxDiscountPct} onChange={set("maxDiscountPct")} /></Field>
            <Field label="tdc cap % (optional)" htmlFor="alc-cap"><Input id="alc-cap" type="number" min={0} max={100} value={form.adminMaxDiscountPct} onChange={set("adminMaxDiscountPct")} /></Field>
          </div>
          <Field label="terms students see (optional)" htmlFor="alc-terms"><Textarea id="alc-terms" rows={2} maxLength={1000} value={form.terms} onChange={set("terms")} /></Field>
          <Field label="reason (logged)" hint={`at least ${MIN_REASON} characters`} htmlFor="alc-reason"><Textarea id="alc-reason" rows={2} maxLength={500} value={form.reason} onChange={set("reason")} placeholder="e.g. brand signed up for the pilot by phone" /></Field>
        </div>
      )}
    </Modal>
  );
}
