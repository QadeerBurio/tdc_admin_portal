// AdminSurplusListings.js: the "listings" tab of Admin > surprise boxes (server: /api/surplus/admin/listings).
// Every brand's boxes with status, pickup, boxes left and open orders; open one for its orders, then publish,
// pause, close, edit (the brand's own rules: food details lock once a student has ordered) or cancel the box
// (closes it and cancels its open orders; handed-over orders stay). Every change asks for a reason, which the
// students see on a cancelled order and which goes to the admin action log.
import React, { useCallback, useEffect, useState } from "react";
import { PageLoading, Button, Field, Input, Textarea, Select, SearchInput, Drawer, Modal, EmptyState, Pill, Facts, toast } from "../portal/kit";
import surplusApi, { STATE_LABEL, STATE_TONE, karachi } from "../services/surplusApi";

const STATUS_TONE = { published: "green", sold_out: "orange", paused: "sand", draft: "sand", closed: "red", blocked: "red" };
const money = (n, c = "PKR") => `${c} ${Number(n || 0).toLocaleString("en-PK")}`;
const MIN_REASON = 5;

export default function AdminSurplusListings() {
  const [rows, setRows] = useState(null);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState({ status: "", q: "" });
  const [openId, setOpenId] = useState(null);
  const load = useCallback(async () => {
    try { setRows((await surplusApi.adminListings({ ...(applied.status ? { status: applied.status } : {}), ...(applied.q ? { q: applied.q } : {}) })).listings); }
    catch (e) { toast(e.message, "bad"); setRows([]); }
  }, [applied]);
  useEffect(() => { load(); }, [load]);
  return (
    <div data-screen="admin-surplus-listings">
      <form className="k-toolbar" style={{ marginBottom: 12 }} onSubmit={(e) => { e.preventDefault(); setApplied({ status, q: q.trim() }); }} aria-label="listing filters">
        <SearchInput className="k-grow" style={{ maxWidth: 340 }} placeholder="box or brand" aria-label="search box or brand" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">every status</option>
          {["published", "sold_out", "paused", "draft", "closed", "blocked"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </Select>
        <Button type="submit" variant="secondary" icon="search">filter</Button>
      </form>
      {!rows ? <PageLoading /> : rows.length === 0 ? <EmptyState icon="gift" tone="orange" title="no boxes" text="no surprise box matches these filters." /> : (
        <div className="k-table-card">
          <div className="k-table-scroll" tabIndex={0} role="region" aria-label="surprise box listings table">
            <table className="k-table" style={{ minWidth: 900 }}>
              <thead><tr><th scope="col">box</th><th scope="col">brand</th><th scope="col">status</th><th scope="col">pickup (Karachi)</th><th scope="col">boxes</th><th scope="col">orders</th><th scope="col"><span className="tdcp-sr">open</span></th></tr></thead>
              <tbody>
                {rows.map((l) => (
                  <tr key={l.id} data-listing={l.title}>
                    <td><strong>{l.title}</strong><div className="k-muted" style={{ fontSize: 12 }}>{money(l.price, l.currency)} (usually {money(l.listPrice, l.currency)})</div></td>
                    <td>{l.brand.name}<div className="k-muted" style={{ fontSize: 12 }}>{l.branch.name}</div></td>
                    <td><Pill tone={STATUS_TONE[l.status] || "sand"} dot>{l.status.replace("_", " ")}</Pill></td>
                    <td style={{ fontSize: 13 }}>{karachi(l.pickupStart)}</td>
                    <td>{l.quantityLeft} left of {l.quantityTotal}</td>
                    <td>{l.openOrders} open · {l.orders} total</td>
                    <td><Button size="sm" variant="secondary" onClick={() => setOpenId(l.id)} aria-label={`open ${l.title} (${l.brand.name})`}>open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {openId && <ListingDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

function ListingDrawer({ id, onClose, onChanged }) {
  const [d, setD] = useState(null);
  const [action, setAction] = useState(null); // publish | pause | close | edit | cancel
  const [reason, setReason] = useState("");
  const [edit, setEdit] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const load = useCallback(async () => {
    try { setD(await surplusApi.adminListing(id)); } catch (e) { toast(e.message, "bad"); onClose(); }
  }, [id, onClose]);
  useEffect(() => { load(); }, [load]);
  if (!d) return <Drawer open onClose={onClose} title="surprise box"><PageLoading /></Drawer>;
  const l = d.listing;
  const ordered = l.orders > 0;
  const openOrders = d.orders.filter((o) => (o.next || []).includes("MERCHANT_CANCELLED"));
  const handed = d.orders.filter((o) => o.state === "PICKUP_VERIFIED");
  const start = (kind) => {
    setReason(""); setResult(null);
    if (kind === "edit") setEdit({ title: l.title, quantityTotal: l.quantityTotal, allergenNotes: l.disclosures?.allergenNotes || "" });
    setAction(kind);
  };
  const run = async () => {
    setBusy(true);
    try {
      const base = { version: l.version, reason: reason.trim() };
      if (action === "cancel") {
        const out = await surplusApi.adminCancelListing(l.id, base);
        setResult(out);
        toast(`box closed; ${out.cancelled.length} order${out.cancelled.length === 1 ? "" : "s"} cancelled${out.failed.length ? `, ${out.failed.length} couldn't be` : ""}`, out.failed.length ? "bad" : "ok");
      } else {
        const body = action === "edit"
          ? { ...base, quantityTotal: Number(edit.quantityTotal), ...(ordered ? {} : { title: edit.title, allergenNotes: edit.allergenNotes }) }
          : { ...base, status: { publish: "published", pause: "paused", close: "closed" }[action] };
        await surplusApi.adminUpdateListing(l.id, body);
        toast({ publish: "published", pause: "paused", close: "closed", edit: "saved" }[action], "ok");
        setAction(null);
      }
      await load();
      onChanged();
    } catch (e) {
      toast(e.code === "STALE_VERSION" ? "this box changed meanwhile (a student may have just ordered); reloaded" : e.message, "bad");
      if (e.code === "STALE_VERSION") { setAction(null); load(); }
    } finally { setBusy(false); }
  };
  const live = ["published", "sold_out"].includes(l.status);
  const titles = { publish: "publish this box?", pause: "pause this box?", close: "close this box?", edit: "edit this box", cancel: "cancel this box?" };
  const notes = {
    publish: "students can see and order it again.",
    pause: "students can't order it until it's published again. existing orders stay.",
    close: "no new orders. existing orders stay; use cancel box to cancel them too.",
    edit: ordered ? "students have ordered this box, so only the number of boxes can change." : "the brand sees these changes straight away.",
    cancel: `the box closes and ${openOrders.length} open order${openOrders.length === 1 ? "" : "s"} ${openOrders.length === 1 ? "is" : "are"} cancelled. each student is told, with this reason.${handed.length ? ` ${handed.length} handed-over order${handed.length === 1 ? "" : "s"} stay${handed.length === 1 ? "s" : ""}.` : ""}`,
  };
  return (
    <Drawer open onClose={onClose} title={l.title} sub={`${l.brand.name} · ${l.status.replace("_", " ")} · version ${l.version}`}>
      <div className="k-row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {["draft", "paused"].includes(l.status) && <Button size="sm" onClick={() => start("publish")}>publish</Button>}
        {live && <Button size="sm" variant="secondary" onClick={() => start("pause")}>pause</Button>}
        {!["closed", "blocked"].includes(l.status) && <Button size="sm" variant="secondary" onClick={() => start("edit")}>edit</Button>}
        {!["closed", "blocked"].includes(l.status) && <Button size="sm" variant="secondary" onClick={() => start("close")}>close</Button>}
        {l.status !== "blocked" && (l.status !== "closed" || openOrders.length > 0) && <Button size="sm" variant="danger" onClick={() => start("cancel")}>cancel box</Button>}
      </div>
      <section className="k-card pad" style={{ marginBottom: 12 }}>
        <Facts rows={[
          ["brand / branch", `${l.brand.name} · ${l.branch.name}`],
          ["pickup (Karachi)", `${karachi(l.pickupStart)} – ${karachi(l.pickupEnd, { hour: "2-digit", minute: "2-digit" })}`],
          ["price", `${money(l.price, l.currency)} (usually ${money(l.listPrice, l.currency)})`],
          ["boxes", `${l.quantityLeft} left of ${l.quantityTotal}`],
          ["allergens", l.disclosures?.allergenNotes || "–"],
        ]} />
      </section>
      <section className="k-card pad">
        <h3 style={{ marginTop: 0 }}>orders ({d.orders.length})</h3>
        {d.orders.length === 0 ? <p className="k-hint">no orders.</p> : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {d.orders.map((o) => (
              <li key={o.id} style={{ padding: "6px 0", borderTop: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span><strong>{o.ref}</strong> · {o.qty} × · {o.student.firstName}{o.cancelReason ? <span className="k-muted"> · “{o.cancelReason}”</span> : null}</span>
                <Pill tone={STATE_TONE[o.state] || "sand"}>{STATE_LABEL[o.state] || o.state}</Pill>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={!!action} onClose={() => !busy && setAction(null)} title={action ? titles[action] : ""} sub={action ? notes[action] : ""} icon={action === "cancel" ? "alert" : "gift"} tone={action === "cancel" ? "red" : "orange"}
        footer={result
          ? <Button onClick={() => { setAction(null); setResult(null); }}>done</Button>
          : <><Button variant="secondary" disabled={busy} onClick={() => setAction(null)}>keep it</Button><Button variant={action === "cancel" ? "danger" : "primary"} loading={busy} disabled={reason.trim().length < MIN_REASON} onClick={run}>{action ? { publish: "publish", pause: "pause", close: "close box", edit: "save", cancel: "close and cancel orders" }[action] : ""}</Button></>}>
        {result ? (
          <div role="status">
            <p><strong>{result.cancelled.length}</strong> order{result.cancelled.length === 1 ? "" : "s"} cancelled{result.cancelled.length ? ` (${result.cancelled.join(", ")})` : ""}; the box is closed.</p>
            {result.stayed.length > 0 && <p className="k-hint">handed over, not cancelled: {result.stayed.join(", ")}</p>}
            {result.failed.length > 0 && <ul>{result.failed.map((f) => <li key={f.ref}>{f.ref}: {f.message}</li>)}</ul>}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {action === "edit" && (
              <>
                <Field label="title" htmlFor="asl-title"><Input id="asl-title" disabled={ordered} value={edit.title} onChange={(e) => setEdit((x) => ({ ...x, title: e.target.value }))} /></Field>
                <Field label="allergen notes" htmlFor="asl-allergens"><Textarea id="asl-allergens" rows={2} disabled={ordered} value={edit.allergenNotes} onChange={(e) => setEdit((x) => ({ ...x, allergenNotes: e.target.value }))} /></Field>
                <Field label="boxes" hint={`at least ${l.quantityTotal - l.quantityLeft} (held or ordered)`} htmlFor="asl-qty"><Input id="asl-qty" type="number" min={1} max={500} value={edit.quantityTotal} onChange={(e) => setEdit((x) => ({ ...x, quantityTotal: e.target.value }))} /></Field>
              </>
            )}
            <Field label={action === "cancel" ? "reason (students see it; logged)" : "reason (logged)"} hint={`at least ${MIN_REASON} characters`} htmlFor="asl-reason"><Textarea id="asl-reason" rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={action === "cancel" ? "e.g. the brand's oven broke down this evening" : "e.g. brand asked by phone"} /></Field>
          </div>
        )}
      </Modal>
    </Drawer>
  );
}
