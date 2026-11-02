// LoyaltyExceptions.js: admin view of the loyalty ledger (FLAG_LOYALTY_V2). Credits, the bills that
// didn't count (e.g. a second visit the same day), and reversals. A credited visit can be reversed for a
// refund, void or fraud: the reason is required and recorded with the admin; nothing is deleted.
// Also: cap a brand's program at a maximum discount (admin override).
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, Button, Field, Input, Textarea, Segmented, Table, Modal, EmptyState, Pill, Facts, toast } from "../portal/kit";
import loyaltyApi from "../services/loyaltyApi";

const FILTERS = [
  { value: "all", label: "all" },
  { value: "CREDIT", label: "credits" },
  { value: "not-counted", label: "didn't count" },
  { value: "REVERSAL", label: "reversals" },
];
const isId = (v) => /^[a-f0-9]{24}$/i.test(String(v || "").trim());
const when = (d) => (d ? new Date(d).toLocaleString() : "–");

export default function LoyaltyExceptions() {
  const [filter, setFilter] = useState("all");
  const [brandId, setBrandId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reverseRow, setReverseRow] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [capBrand, setCapBrand] = useState("");
  const [capProgram, setCapProgram] = useState(null);
  const [capValue, setCapValue] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 300 };
      if (filter === "CREDIT" || filter === "REVERSAL") params.type = filter;
      if (filter === "not-counted") params.type = "CREDIT";
      if (isId(brandId)) params.brandId = brandId.trim();
      if (isId(studentId)) params.studentId = studentId.trim();
      const data = await loyaltyApi.adminLedger(params);
      const list = data?.rows || [];
      setRows(filter === "not-counted" ? list.filter((r) => r.visitsDelta === 0) : list);
    } catch (err) {
      toast(err.message || "couldn't load the loyalty ledger", "bad");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter, brandId, studentId]);
  useEffect(() => { load(); }, [load]);

  const reverse = async () => {
    if (reason.trim().length < 5) return toast("give a reason (at least 5 characters)", "bad");
    setBusy(true);
    try {
      await loyaltyApi.adminReverse({ redemptionId: reverseRow.redemptionId, reason: reason.trim() });
      toast("visit reversed; the student's tier is recalculated", "ok");
      setReverseRow(null);
      setReason("");
      load();
    } catch (err) {
      toast(err.message, "bad");
    } finally {
      setBusy(false);
    }
  };

  const findProgram = async () => {
    if (!isId(capBrand)) return toast("enter a brand id", "bad");
    try {
      const p = await loyaltyApi.brandProgram(capBrand.trim());
      setCapProgram(p);
      setCapValue("");
    } catch (err) {
      setCapProgram(null);
      toast(err.status === 404 ? "this brand has no active loyalty program" : err.message, "bad");
    }
  };
  const saveCap = async (clear) => {
    const v = clear ? null : Number(capValue);
    if (!clear && !(v >= 0 && v <= 100)) return toast("the cap must be 0 to 100", "bad");
    try {
      const p = await loyaltyApi.updateProgram(capProgram.id, { adminMaxDiscountPct: v });
      setCapProgram(p);
      toast(clear ? "cap removed" : `capped at ${v}%`, "ok");
    } catch (err) {
      toast(err.message, "bad");
    }
  };

  const columns = [
    { key: "at", label: "when", render: (r) => when(r.at) },
    { key: "brand", label: "brand", render: (r) => r.brandName || r.brand },
    { key: "student", label: "student", render: (r) => r.studentName || r.student },
    {
      key: "type",
      label: "entry",
      render: (r) =>
        r.type === "REVERSAL" ? <Pill tone="coral">reversal</Pill>
          : r.visitsDelta === 0 ? <Pill tone="sand">didn't count</Pill>
          : r.reversed ? <Pill tone="orange">credited · reversed</Pill>
          : <Pill tone="green">credited</Pill>,
    },
    { key: "visit", label: "visit / tier", render: (r) => (r.type === "CREDIT" ? `${r.visitNumber ? `#${r.visitNumber}` : "–"} · ${r.tierName || "–"}${r.discountPct != null ? ` · ${r.discountPct}%` : ""}` : "–") },
    { key: "source", label: "source", render: (r) => r.source || "–" },
    { key: "reason", label: "reason", render: (r) => r.reason ? `${r.reason}${r.actorName ? ` (${r.actorName})` : ""}` : "–", style: { maxWidth: 260 } },
    {
      key: "actions",
      label: "",
      render: (r) => (r.type === "CREDIT" && r.visitsDelta > 0 && !r.reversed
        ? <Button size="sm" variant="secondary" onClick={() => { setReverseRow(r); setReason(""); }}>reverse</Button>
        : null),
    },
  ];

  return (
    <div className="tdcp k-page" data-screen="loyalty-exceptions">
      <PageHeader title="loyalty exceptions" sub="credited visits, bills that didn't count, and reversals. reversing appends a correction; nothing is deleted." />

      <div className="k-toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
        <Segmented label="entries" value={filter} onChange={setFilter} options={FILTERS} />
        <Input aria-label="brand id" placeholder="brand id" value={brandId} onChange={(e) => setBrandId(e.target.value)} style={{ maxWidth: 240 }} />
        <Input aria-label="student id" placeholder="student id" value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ maxWidth: 240 }} />
        <Button variant="secondary" icon="search" onClick={load}>refresh</Button>
      </div>

      <Table
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        minWidth={980}
        empty={<EmptyState icon="star" tone="yellow" title="no loyalty entries" text="entries appear when a brand in the loyalty pilot confirms a bill." />}
      />

      <section className="k-card pad" style={{ marginTop: 16 }}>
        <div className="k-card-head"><h3>cap a brand's maximum discount</h3></div>
        <div className="k-row" style={{ gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="brand id" htmlFor="cap-brand" style={{ flex: "1 1 240px" }}>
            <Input id="cap-brand" value={capBrand} onChange={(e) => setCapBrand(e.target.value)} placeholder="24-character id" />
          </Field>
          <Button variant="secondary" onClick={findProgram}>find program</Button>
        </div>
        {capProgram && (
          <>
            <Facts rows={[
              ["status", capProgram.status],
              ["tiers", capProgram.tiers.map((t) => `${t.maxVisit == null ? `${t.minVisit}+` : `${t.minVisit}-${t.maxVisit}`}: ${t.discountPct}%`).join(" · ")],
              ["maximum now", `${capProgram.maxDiscountPct}%`],
              ["admin cap", capProgram.adminMaxDiscountPct == null ? "none" : `${capProgram.adminMaxDiscountPct}%`],
            ]} />
            <div className="k-row" style={{ gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <Field label="cap at %" htmlFor="cap-value" style={{ flex: "0 1 140px" }}>
                <Input id="cap-value" type="number" min={0} max={100} value={capValue} onChange={(e) => setCapValue(e.target.value)} />
              </Field>
              <Button onClick={() => saveCap(false)} disabled={capValue === ""}>set cap</Button>
              {capProgram.adminMaxDiscountPct != null && <Button variant="secondary" onClick={() => saveCap(true)}>remove cap</Button>}
            </div>
          </>
        )}
      </section>

      <Modal
        open={!!reverseRow}
        onClose={() => setReverseRow(null)}
        icon="receipt"
        tone="coral"
        title="reverse this visit"
        sub="for a refund, a void or fraud. the visit stops counting and the student's tier is recalculated."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setReverseRow(null)}>cancel</Button>
            <Button loading={busy} disabled={reason.trim().length < 5} onClick={reverse}>reverse visit</Button>
          </>
        )}
      >
        {reverseRow && (
          <>
            <Facts rows={[
              ["brand", reverseRow.brandName || reverseRow.brand],
              ["student", reverseRow.studentName || reverseRow.student],
              ["visit", `#${reverseRow.visitNumber || "–"} · ${reverseRow.tierName || ""}`],
              ["bill / saved", `Rs. ${reverseRow.billAmount ?? "–"} / Rs. ${reverseRow.savedAmount ?? "–"}`],
              ["when", when(reverseRow.at)],
            ]} />
            <Field label="reason (required)" htmlFor="rev-reason" hint="recorded with your name">
              <Textarea id="rev-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. refund: order returned" />
            </Field>
          </>
        )}
      </Modal>
    </div>
  );
}
