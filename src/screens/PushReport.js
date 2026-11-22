// src/screens/PushReport.js
// Plan N-6: the push report on the engagement metrics page. Real numbers only: tracked pushes (pushOpenTracking),
// per type sent / delivered / opened and opt-outs within 24 h; a rate shows only with enough pushes of that type
// ("not enough data yet" otherwise, never 0%); a type to review is marked.
import React, { useEffect, useState } from "react";
import { engagementApi } from "../services/api";
import { Card, Table, EmptyState, Pill, Select } from "../portal/kit";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const rate = (v) => (v == null ? <span className="k-muted">not enough data yet</span> : `${v}%`);

export default function PushReport() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    setError(null);
    // a failure (also a missing call on an older bundle / a test double) shows the error, never breaks the page
    Promise.resolve().then(() => engagementApi.pushReport(days))
      .then((r) => { if (live) setData(r); })
      .catch(() => { if (live) setError("the push report could not be loaded. try again."); });
    return () => { live = false; };
  }, [days]);

  const action = (
    <Select aria-label="push report period" style={{ width: "auto" }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
      <option value={7}>last 7 days</option>
      <option value={14}>last 14 days</option>
      <option value={30}>last 30 days</option>
    </Select>
  );

  let body;
  if (error) body = <div className="k-note bad">{error}</div>;
  else if (!data) body = <p className="k-hint">loading…</p>;
  else if (!data.tracking?.configured && !data.tracking?.trackedPushes) {
    body = <EmptyState icon="bell" title="push tracking is off" text="turn on “push open tracking” for some students (features tab) to measure opens and opt-outs." />;
  } else if (!data.types?.length) {
    body = <EmptyState icon="bell" title="not enough data yet" text="no tracked pushes in this period." />;
  } else {
    body = (
      <>
        {!data.enoughData && <p className="k-hint">not enough data yet: a type gets rates from {fmt(data.minSent)} pushes.</p>}
        <Table
          label="push report"
          minWidth={720}
          rows={data.types}
          rowKey={(t) => t.type}
          columns={[
            { key: "type", label: "type", render: (t) => <span>{String(t.type).replace(/_/g, " ")} {t.review && <Pill tone="pink" title="open rate under 3% or opt-outs at 2% or more">review</Pill>}</span> },
            { key: "sent", label: "sent", thStyle: { textAlign: "right" }, style: { textAlign: "right" }, render: (t) => fmt(t.sent) },
            { key: "delivered", label: "delivered", thStyle: { textAlign: "right" }, style: { textAlign: "right" }, render: (t) => rate(t.deliveredRate) },
            { key: "opened", label: "opened", thStyle: { textAlign: "right" }, style: { textAlign: "right" }, render: (t) => rate(t.openRate) },
            { key: "optouts", label: "opt-outs in 24 h", thStyle: { textAlign: "right" }, style: { textAlign: "right" }, render: (t) => (t.enough ? `${fmt(t.optOuts24h)} (${t.optOutRate}%)` : <span className="k-muted">not enough data yet</span>) },
          ]}
        />
        <p className="k-hint">tracked pushes only ({fmt(data.tracking.trackedPushes)} in the last {data.days} days). review: open rate under 3% or opt-outs at 2% or more.</p>
      </>
    );
  }
  return <Card title="push report" icon="bell" tone="sky" action={action}>{body}</Card>;
}
