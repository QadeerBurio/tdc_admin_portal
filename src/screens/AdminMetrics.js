// AdminMetrics.js: the admin "metrics" page (feat/admin-approvals-metrics). One definition per metric (the "i"),
// a date range in Karachi days with the change vs the previous period of the same length, deleted and test accounts
// left out everywhere, CSV per section. The overview (AdminHome) shows the same numbers from the same call.
//   tabs: metrics | engagement details (the earlier engagement page) | resume studio & employers
import React, { useState } from "react";
import Ico from "../portal/Ico";
import { PageHeader, Tabs, Button, EmptyState, PageLoading } from "../portal/kit";
import EngagementMetrics from "./EngagementMetrics";
import { AdminOverview } from "./BusinessAnalytics";
import { GROUPS, InfoTip, Change, RangePicker, fmtNum, useAdminMetrics, exportGroup } from "./adminMetricsShared";
import "./styles/AdminMetrics.css";

export function MetricTile({ label, m }) {
  return (
    <div className="am-tile" data-metric={label}>
      <div className="am-tile-lbl">{label} <InfoTip label={label} text={m.definition} /></div>
      <div className="am-tile-num">{fmtNum(m.value, m.unit)}</div>
      <Change m={m} />
    </div>
  );
}

function MetricsTab() {
  const { range, setRange, data, loading, error, load } = useAdminMetrics({ preset: "30d" });
  return (
    <>
      <RangePicker value={range} onChange={setRange} />
      {data && (
        <p className="k-hint am-scope" aria-live="polite">
          {data.range.fromDay} to {data.range.toDay} (Karachi time) vs {data.previous.fromDay} to {data.previous.toDay}. deleted accounts are left out;
          {data.exclusions.test.configured ? " test accounts are left out" : " no test accounts are set up yet"} ({data.exclusions.test.how}).
        </p>
      )}
      {error ? (
        <div className="k-card" role="alert"><EmptyState icon="alert" tone="red" title="couldn't load the metrics" text={error} action={<Button icon="refresh" onClick={load}>try again</Button>} /></div>
      ) : loading && !data ? (
        <PageLoading label="loading metrics…" />
      ) : data ? (
        <div className="am-groups" aria-busy={loading || undefined}>
          {GROUPS.map((g) => {
            const metrics = g.metrics.filter(([k]) => data.groups[g.id]?.[k]);
            const empty = metrics.every(([k]) => !data.groups[g.id][k].value);
            return (
              <section key={g.id} className="k-card pad am-group" aria-labelledby={`am-g-${g.id}`} data-group={g.id}>
                <div className="k-card-head">
                  <Ico kind={g.icon} tone={g.tone} size={32} />
                  <h2 id={`am-g-${g.id}`} className="am-group-title">{g.title}</h2>
                  <Button size="sm" variant="secondary" icon="download" onClick={() => exportGroup(data, g)} aria-label={`export ${g.title} as csv`}>csv</Button>
                </div>
                <div className="am-tiles">{metrics.map(([k, label]) => <MetricTile key={k} label={label} m={data.groups[g.id][k]} />)}</div>
                {empty && <p className="k-hint" style={{ margin: "8px 0 0" }}>nothing in this range yet.</p>}
              </section>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

export default function AdminMetrics() {
  const [tab, setTab] = useState("metrics");
  return (
    <div className="tdcp k-page" data-screen="admin-metrics">
      {tab === "metrics" && <PageHeader title="metrics" sub="one definition per number (tap the i). counted from confirmed records, in Karachi time, without deleted or test accounts." />}
      <Tabs label="metrics sections" value={tab} onChange={setTab}
        tabs={[{ id: "metrics", label: "metrics", icon: "chart" }, { id: "engagement", label: "engagement details", icon: "heart" }, { id: "more", label: "resume studio & employers", icon: "file" }]} />
      {tab === "metrics" && <MetricsTab />}
      {tab === "engagement" && <EngagementMetrics />}
      {tab === "more" && <AdminOverview only={["resumeStudio", "employers"]} />}
    </div>
  );
}
