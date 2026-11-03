// SurplusOps.js: admin Surprise Box operations (FLAG_SURPLUS_BOXES).
//   cases     support cases (disputes) opened within 24 hours of pickup: decide upheld / not upheld / no action
//             with a note. Nothing is refunded: no money passes through tdc.
//   orders    every order, filter by state
//   no-shows  students with no-shows in the last 90 days, for review. Nobody is banned automatically.
//   brands    upheld cases and no-shows per brand; block or unblock a brand's listings (with a reason)
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, Field, Textarea, Select, Tabs, EmptyState, Pill, Table, Modal, toast } from "../portal/kit";
import surplusApi, { STATE_LABEL, STATE_TONE, karachi } from "../services/surplusApi";

const REASON = { not_as_described: "not as described", food_safety: "food safety", not_handed_over: "not handed over", wrong_no_show: "wrong no-show", merchant_cancelled_late: "cancelled late by the brand", charged_wrong_price: "charged the wrong price", other: "other" };

export default function SurplusOps() {
  const [tab, setTab] = useState("cases");
  const [available, setAvailable] = useState(null);
  useEffect(() => { surplusApi.adminAvailable().then(setAvailable); }, []);
  if (available === null) return <PageLoading />;
  if (!available) return <div className="tdcp k-page"><EmptyState icon="gift" tone="orange" title="surprise boxes aren't switched on" text="set FLAG_SURPLUS_BOXES on the server to start the pilot." /></div>;
  return (
    <div className="tdcp k-page" data-screen="surplus-ops">
      <PageHeader title="surprise boxes" sub="pickup-only pilot, paid at pickup: tdc records orders, no-shows and disputes; it never takes money." />
      <Tabs label="surprise box operations" value={tab} onChange={setTab} tabs={[{ id: "cases", label: "support cases", icon: "alert" }, { id: "orders", label: "orders", icon: "receipt" }, { id: "noshows", label: "no-shows", icon: "clock" }, { id: "brands", label: "brands", icon: "store" }]} />
      <div style={{ marginTop: 16 }}>
        {tab === "cases" && <Cases />}
        {tab === "orders" && <Orders />}
        {tab === "noshows" && <NoShows />}
        {tab === "brands" && <Brands />}
      </div>
    </div>
  );
}

function Cases() {
  const [status, setStatus] = useState("open");
  const [rows, setRows] = useState(null);
  const [deciding, setDeciding] = useState(null);
  const [decision, setDecision] = useState("upheld");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => surplusApi.adminCases(status).then(setRows).catch((e) => { toast(e.message, "bad"); setRows([]); }), [status]);
  useEffect(() => { setRows(null); load(); }, [load]);
  const decide = async () => {
    setBusy(true);
    try {
      await surplusApi.decideCase(deciding.id, { decision, note });
      toast("decided", "ok"); setDeciding(null);
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); load(); }
  };
  return (
    <>
      <Select aria-label="case status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 200, marginBottom: 12 }}>
        <option value="open">open</option><option value="decided">decided</option><option value="all">all</option>
      </Select>
      <Table loading={!rows} rows={rows || []} rowKey={(r) => r.id} minWidth={900}
        empty={<EmptyState icon="check" tone="green" title="no cases" />}
        columns={[
          { key: "opened", label: "opened", render: (r) => karachi(r.createdAt) },
          { key: "order", label: "order", render: (r) => <>{r.order?.ref}<div className="k-hint">{r.order?.title}</div></> },
          { key: "brand", label: "brand", render: (r) => r.brand?.name },
          { key: "student", label: "student", render: (r) => r.student?.name },
          { key: "reason", label: "reason", render: (r) => <>{REASON[r.reason] || r.reason}<div className="k-hint">{r.description}</div>{r.evidence?.map((u) => <div key={u}><a href={u} target="_blank" rel="noreferrer noopener">evidence</a></div>)}</> },
          { key: "before", label: "order was", render: (r) => <Pill tone={STATE_TONE[r.order?.stateBefore]}>{STATE_LABEL[r.order?.stateBefore] || r.order?.stateBefore}</Pill> },
          { key: "status", label: "decision", render: (r) => (r.status === "decided" ? <><Pill tone={r.decision === "upheld" ? "red" : "sand"}>{r.decision.replace("_", " ")}</Pill><div className="k-hint">{r.adminNote}</div></> : <Button size="sm" onClick={() => { setDeciding(r); setDecision("upheld"); setNote(""); }}>decide</Button>) },
        ]} />
      <Modal open={!!deciding} onClose={() => setDeciding(null)} title={`case on order ${deciding?.order?.ref || ""}`} sub="recorded only: no money passed through tdc, so nothing is refunded. upheld cases count against the brand." icon="alert" tone="orange"
        footer={<><Button variant="secondary" onClick={() => setDeciding(null)}>cancel</Button><Button loading={busy} disabled={note.trim().length < 3} onClick={decide}>save decision</Button></>}>
        {deciding && (
          <div style={{ display: "grid", gap: 12 }}>
            <div className="k-hint">{deciding.order?.history?.map((h) => `${karachi(h.at)}: ${STATE_LABEL[h.to] || h.to}${h.note ? ` (${h.note})` : ""}`).join(" · ")}</div>
            <Field label="decision" htmlFor="so-decision"><Select id="so-decision" value={decision} onChange={(e) => setDecision(e.target.value)}><option value="upheld">upheld (the student was right)</option><option value="not_upheld">not upheld</option><option value="no_action">no action</option></Select></Field>
            <Field label="note for the record (the student sees it)" htmlFor="so-note"><Textarea id="so-note" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          </div>
        )}
      </Modal>
    </>
  );
}

function Orders() {
  const [state, setState] = useState("");
  const [rows, setRows] = useState(null);
  useEffect(() => { setRows(null); surplusApi.adminOrders(state ? { state } : {}).then(setRows).catch((e) => { toast(e.message, "bad"); setRows([]); }); }, [state]);
  return (
    <>
      <Select aria-label="order state" value={state} onChange={(e) => setState(e.target.value)} style={{ maxWidth: 240, marginBottom: 12 }}>
        <option value="">every state</option>{Object.keys(STATE_LABEL).map((s) => <option key={s} value={s}>{STATE_LABEL[s]}</option>)}
      </Select>
      <Table loading={!rows} rows={rows || []} rowKey={(r) => r.id} minWidth={860} empty={<EmptyState icon="receipt" title="no orders" />}
        columns={[
          { key: "ref", label: "order", render: (r) => r.ref },
          { key: "brand", label: "brand", render: (r) => r.brand?.name },
          { key: "box", label: "box", render: (r) => `${r.qty} × ${r.title}` },
          { key: "student", label: "student", render: (r) => r.student.firstName },
          { key: "pickup", label: "pickup", render: (r) => karachi(r.pickupStart) },
          { key: "total", label: "at pickup", render: (r) => `${r.currency} ${r.total}` },
          { key: "state", label: "state", render: (r) => <Pill tone={STATE_TONE[r.state]}>{STATE_LABEL[r.state]}</Pill> },
          { key: "paid", label: "paid", render: (r) => (r.paymentState === "paid_at_pickup" ? "at pickup" : "–") },
        ]} />
    </>
  );
}

function NoShows() {
  const [data, setData] = useState(null);
  useEffect(() => { surplusApi.adminNoShows().then(setData).catch((e) => { toast(e.message, "bad"); setData({ students: [] }); }); }, []);
  if (!data) return <PageLoading />;
  return (
    <>
      <p className="k-hint">{data.note} last 90 days.</p>
      <Table rows={data.students} rowKey={(r) => r.studentId} minWidth={640} empty={<EmptyState icon="check" tone="green" title="no no-shows" />}
        columns={[
          { key: "name", label: "student", render: (r) => r.name },
          { key: "count", label: "no-shows", render: (r) => <Pill tone={r.count >= 3 ? "red" : r.count === 2 ? "orange" : "sand"}>{r.count}</Pill> },
          { key: "last", label: "last", render: (r) => karachi(r.last) },
          { key: "refs", label: "orders", render: (r) => r.refs.join(", ") },
        ]} />
    </>
  );
}

function Brands() {
  const [rows, setRows] = useState(null);
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => surplusApi.adminBrands().then(setRows).catch((e) => { toast(e.message, "bad"); setRows([]); }), []);
  useEffect(() => { load(); }, [load]);
  const apply = async () => {
    setBusy(true);
    try {
      const r = await surplusApi.blockBrand(target.id, { blocked: !target.blocked, reason });
      toast(r.blocked ? `listings blocked (${r.listingsChanged})` : "unblocked: their listings are paused until they republish", "ok");
      setTarget(null);
    } catch (e) { toast(e.message, "bad"); } finally { setBusy(false); load(); }
  };
  return (
    <>
      <Table loading={!rows} rows={rows || []} rowKey={(r) => r.id} minWidth={720} empty={<EmptyState icon="store" title="no brands in the pilot yet" />}
        columns={[
          { key: "name", label: "brand", render: (r) => r.name },
          { key: "listings", label: "listings", render: (r) => r.listings },
          { key: "upheld", label: "upheld cases", render: (r) => <Pill tone={r.upheldCases >= 2 ? "red" : "sand"}>{r.upheldCases}</Pill> },
          { key: "noshows", label: "student no-shows", render: (r) => r.studentNoShows },
          { key: "status", label: "listings status", render: (r) => (r.blocked ? <><Pill tone="red">blocked</Pill><div className="k-hint">{r.reason}</div></> : <Pill tone="green">active</Pill>) },
          { key: "act", label: "", render: (r) => <Button size="sm" variant={r.blocked ? "secondary" : "primary"} onClick={() => { setTarget(r); setReason(""); }}>{r.blocked ? "unblock" : "block listings"}</Button> },
        ]} />
      <Modal open={!!target} onClose={() => setTarget(null)} title={target?.blocked ? `unblock ${target?.name}?` : `block ${target?.name}'s listings?`}
        sub={target?.blocked ? "their listings come back paused; they republish them." : "their live listings disappear for students and they can't publish new ones. existing orders continue."}
        icon="shield" tone={target?.blocked ? "green" : "red"}
        footer={<><Button variant="secondary" onClick={() => setTarget(null)}>cancel</Button><Button loading={busy} disabled={!target?.blocked && reason.trim().length < 3} onClick={apply}>{target?.blocked ? "unblock" : "block"}</Button></>}>
        {!target?.blocked && <Field label="reason (recorded)" htmlFor="so-block-reason"><Textarea id="so-block-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>}
      </Modal>
    </>
  );
}
