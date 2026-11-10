// BusinessAnalytics.js: figures counted from authoritative records only (server services/analytics/).
//   AdminOverview    admin: discounts, loyalty, Surprise Box, hiring, employers, Resume Studio; date range; CSV export
//   BrandInsights    brand: its own redemptions, repeat customers, loyalty, Surprise Box
//   HiringResults    employer: its own hiring funnel, plus the First Hire Free summary when piloted
// Each figure shows what it counts (definitions from the server) and its denominator. Figures built from
// fewer than 5 students are hidden by the server and shown as "hidden". No student names anywhere.
import React, { useCallback, useEffect, useState } from "react";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, Field, DateInput, EmptyState, Pill, Table, toast } from "../portal/kit";
import analyticsApi, { defaultRange, downloadCsv } from "../services/analyticsApi";
import { EmployerRatingCard } from "./CareerRatings";

const n = (v) => (v == null ? "hidden" : typeof v === "number" ? v.toLocaleString("en-PK") : String(v));
const pkr = (v) => (v == null ? "hidden" : `PKR ${Number(v).toLocaleString("en-PK")}`);
const pct = (v, den) => (v == null ? (den === 0 ? "no data" : "hidden") : `${v}%${den != null ? ` of ${den}` : ""}`);

function useFigures(fetcher) {
  const [range, setRange] = useState(defaultRange);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await fetcher(range)); } catch (e) { toast(e.message, "bad"); setData(null); } finally { setLoading(false); }
  }, [fetcher, range]);
  useEffect(() => { load(); }, [load]);
  return { range, setRange, data, loading, load };
}

function RangeBar({ range, setRange, onExport }) {
  return (
    <div className="k-toolbar" style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
      <Field label="from" htmlFor="ba-from"><DateInput id="ba-from" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></Field>
      <Field label="to" htmlFor="ba-to"><DateInput id="ba-to" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></Field>
      {onExport && <Button variant="secondary" icon="download" onClick={onExport}>export csv</Button>}
    </div>
  );
}

// one card: rows of [label, value, definition?]
function Figures({ title, icon, tone, rows, note, definitions }) {
  return (
    <section className="k-card pad" data-card={title}>
      <div className="k-card-head"><Ico kind={icon} tone={tone} size={30} /><h3>{title}</h3></div>
      <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 12px", margin: 0 }}>
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="k-hint" style={{ margin: 0 }}>{label}</dt>
            <dd style={{ margin: 0, fontWeight: 700, textAlign: "right" }}>{value}</dd>
          </React.Fragment>
        ))}
      </dl>
      {note && <p className="k-hint" style={{ marginTop: 8 }}>{note}</p>}
      {definitions && (
        <details style={{ marginTop: 8 }}>
          <summary className="k-hint">what these count</summary>
          <ul className="k-hint" style={{ margin: "6px 0 0", paddingLeft: 18 }}>{Object.entries(definitions).map(([k, v]) => <li key={k}><strong>{k}</strong>: {v}</li>)}</ul>
        </details>
      )}
    </section>
  );
}
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 };

const discountRows = (d) => [
  ["redemptions (brand-confirmed)", n(d.redemptions)], ["students who redeemed", n(d.uniqueStudents)], ["bills", pkr(d.billTotal)], ["savings given", pkr(d.savedTotal)],
  ["repeat customers", n(d.repeatCustomers)], ["repeat rate", pct(d.repeatRatePct, d.studentBrandPairs)],
];
const loyaltyRows = (l) => [["visits counted", n(l.countedVisits)], ["credits that didn't count", n(l.creditsNotCounted)], ["reversals", n(l.reversals)], ["net visits", n(l.netVisits)], ["members", n(l.members)], ...Object.entries(l.membersByTier || {}).map(([t, c]) => [`members: ${t}`, n(c)])];
const surplusRows = (s) => [["orders placed", n(s.ordersPlaced)], ["boxes ordered", n(s.boxesOrdered)], ["verified pickups", n(s.verifiedPickups)], ["pickup rate", pct(s.pickupRatePct, s.pickupRateDenominator)], ["collected at pickup (by brands)", pkr(s.collectedAtPickup)], ["no-shows", n(s.noShows)], ["cancelled by students / brands", `${n(s.cancelledByStudent)} / ${n(s.cancelledByBrand)}`], ["support cases open", n(s.disputes)]];
const secs = (v) => (v == null ? "no data" : v < 90 ? `${Math.round(v)} s` : `${Math.round(v / 6) / 10} min`);
const resumeStudioRows = (s) => [
  ["tailoring started", n(s.tailoringStarted)], ["completed / failed / in progress", `${n(s.tailoringCompleted)} / ${n(s.tailoringFailed)} / ${n(s.inProgress)}`],
  ["students tailoring", n(s.studentsTailoring)], ["approvals", n(s.approvals)], ["applications with a tailored version", n(s.applicationsWithTailoredVersion)],
  ["blocked by the factual check", `${n(s.factualCheckRejections)} (${pct(s.factualCheckRejectionPct, s.suggestions)})`], ["needs the student's confirmation", n(s.needsConfirmation)],
  ["time to draft: median / p95", `${secs(s.timeToDraftSeconds?.p50)} / ${secs(s.timeToDraftSeconds?.p95)}`],
];
const hiringRows = (c, conv) => [["applications", n(c.applications)], ["shortlisted", n(c.shortlisted)], ["interviews completed", n(c.interviewsCompleted)], ["offers accepted", n(c.offersAccepted)], ["verified hires", n(c.verifiedHires)], ["offer to verified hire", pct(conv?.acceptedToVerifiedHire, c.offersAccepted)]];

export function AdminOverview() {
  const f = useFigures(analyticsApi.adminOverview);
  const d = f.data;
  const exportCsv = () => {
    if (!d) return;
    const rows = [["section", "metric", "value"], ["range", "from", d.range.from], ["range", "to", d.range.to]];
    const add = (section, list) => list.forEach(([k, v]) => rows.push([section, k, v]));
    add("discounts", discountRows(d.discounts)); add("loyalty", loyaltyRows(d.loyalty)); add("surprise box", surplusRows(d.surpriseBox));
    add("hiring", hiringRows(d.hiring.counts, d.hiring.conversions)); if (d.resumeStudio) add("resume studio", resumeStudioRows(d.resumeStudio)); add("employers", Object.entries(d.employers).filter(([k]) => k !== "definitions").map(([k, v]) => [k, v == null ? "" : v]));
    downloadCsv(`tdc-overview-${f.range.from}-to-${f.range.to}.csv`, rows);
  };
  return (
    <div className="tdcp k-page" data-screen="business-overview">
      <PageHeader title="overview" sub="counted from confirmed records only: redemptions the brand confirmed, orders, the hiring timeline, the hiring ledger. claims, holds and scheduled interviews never count." />
      <RangeBar range={f.range} setRange={f.setRange} onExport={d ? exportCsv : null} />
      {f.loading && !d ? <PageLoading /> : !d ? <EmptyState icon="alert" title="couldn't load" action={<Button onClick={f.load}>retry</Button>} /> : (
        <div style={grid}>
          <Figures title="discounts" icon="tag" tone="red" rows={[...discountRows(d.discounts), ["of which deleted brands", n(d.discounts.archivedRedemptions)]]} definitions={d.discounts.definitions} note={d.discounts.brandsHidden ? `${d.discounts.brandsHidden} brand(s) with fewer than ${d.minCohort} students not listed below.` : ""} />
          <Figures title="loyalty" icon="star" tone="yellow" rows={loyaltyRows(d.loyalty)} definitions={d.loyalty.definitions} note={d.loyalty.membersByTierNote} />
          <Figures title="surprise box" icon="gift" tone="orange" rows={surplusRows(d.surpriseBox)} definitions={d.surpriseBox.definitions} />
          <Figures title="hiring" icon="briefcase" tone="coral" rows={[...hiringRows(d.hiring.counts, d.hiring.conversions), ["median first employer response", d.hiring.medianHours?.firstEmployerResponse == null ? "no data" : `${d.hiring.medianHours.firstEmployerResponse} h`]]} note="from the hiring timeline: a hire counts only when the candidate accepted and the employer confirmed it, and it wasn't revoked." />
          <Figures title="employers" icon="hat" tone="sky" rows={[["companies verified", n(d.employers.companiesVerified)], ["verifications to check / suspected duplicates", `${n(d.employers.verificationsPending)} / ${n(d.employers.suspectedDuplicates)}`], ["free-hire trials issued", n(d.employers.trialsIssued)], ["trials active / used / under review", `${n(d.employers.trialsActive)} / ${n(d.employers.trialsUsed)} / ${n(d.employers.trialsUnderReview)}`], ["free hires used (net of restored)", n(d.employers.netFreeHires)], ["hires pending pricing", n(d.employers.hiresPendingPricing)], ["paying employers", n(d.employers.payingEmployers)], ["trial to paid", d.employers.trialToPaidPct == null ? "not measurable yet" : `${d.employers.trialToPaidPct}%`]]} definitions={d.employers.definitions} />
          {d.resumeStudio && (
            <Figures title="resume studio" icon="file" tone="purple" rows={resumeStudioRows(d.resumeStudio)} definitions={d.resumeStudio.definitions}
              note={Object.keys(d.resumeStudio.failedByReason || {}).length ? `failed: ${Object.entries(d.resumeStudio.failedByReason).map(([k, v]) => `${k.toLowerCase().replace(/_/g, " ")} ${v}`).join(", ")}` : ""} />
          )}
          {d.discounts.topBrands.length > 0 && (
            <section className="k-card pad" style={{ gridColumn: "1 / -1" }}>
              <div className="k-card-head"><Ico kind="store" tone="red" size={30} /><h3>brands by redemptions</h3></div>
              <Table rows={d.discounts.topBrands} rowKey={(r) => r.id} minWidth={560}
                columns={[{ key: "name", label: "brand" }, { key: "r", label: "redemptions", render: (r) => n(r.redemptions) }, { key: "s", label: "students", render: (r) => n(r.uniqueStudents) }, { key: "rep", label: "repeat rate", render: (r) => pct(r.repeatRatePct, r.studentBrandPairs) }, { key: "saved", label: "savings given", render: (r) => pkr(r.savedTotal) }]} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export function BrandInsights() {
  const f = useFigures(analyticsApi.brandInsights);
  const d = f.data;
  return (
    <div className="tdcp k-page" data-screen="brand-insights">
      <PageHeader title="insights" sub="your own figures, from the bills you confirmed, your loyalty ledger and your Surprise Box orders." />
      <RangeBar range={f.range} setRange={f.setRange} />
      {f.loading && !d ? <PageLoading /> : !d ? <EmptyState icon="alert" title="couldn't load" action={<Button onClick={f.load}>retry</Button>} /> : (
        <div style={grid}>
          <Figures title="customers" icon="users" tone="blue" rows={[["redemptions you confirmed", n(d.discounts.redemptions)], ["students", n(d.discounts.uniqueStudents)], ["repeat customers", n(d.discounts.repeatCustomers)], ["repeat rate", pct(d.discounts.repeatRatePct, d.discounts.uniqueStudents)], ["bills", pkr(d.discounts.billTotal)], ["savings you gave", pkr(d.discounts.savedTotal)]]} note={d.discounts.note} definitions={d.discounts.definitions} />
          <Figures title="loyalty" icon="star" tone="yellow" rows={loyaltyRows(d.loyalty)} note={d.loyalty.membersByTierNote} />
          <Figures title="surprise boxes" icon="gift" tone="orange" rows={surplusRows(d.surpriseBox)} />
        </div>
      )}
    </div>
  );
}

export function HiringResults() {
  const f = useFigures(analyticsApi.employerResults);
  const d = f.data;
  return (
    <div className="tdcp k-page" data-screen="hiring-results">
      <PageHeader title="hiring results" sub="your own hiring timeline: a hire counts when the candidate accepted your offer and you confirmed it." />
      <RangeBar range={f.range} setRange={f.setRange} />
      {f.loading && !d ? <PageLoading /> : !d ? <EmptyState icon="alert" title="couldn't load" action={<Button onClick={f.load}>retry</Button>} /> : (
        <div style={grid}>
          <Figures title="your funnel" icon="briefcase" tone="coral" rows={[...hiringRows(d.hiring.counts, d.hiring.conversions), ["median time to first response", d.hiring.medianHours?.firstEmployerResponse == null ? "no data" : `${d.hiring.medianHours.firstEmployerResponse} h`]]} />
          <EmployerRatingCard />
          {d.trial && (
            <Figures title="first hire free" icon="trophy" tone="green" rows={[["status", <Pill key="s" tone={{ active: "green", used: "blue", under_review: "orange" }[d.trial.status] || "sand"}>{d.trial.status.replace("_", " ")}</Pill>], ["free hires left", n(d.trial.remainingFreeHires)], ["applicants", n(d.trial.summary.applicants)], ["interviews completed", n(d.trial.summary.completedInterviews)], ["verified hires", n(d.trial.summary.verifiedHires)], ["free hire used", d.trial.summary.freeHireUsed ? "yes" : "no"]]} note={d.trial.furtherHires} />
          )}
        </div>
      )}
    </div>
  );
}
