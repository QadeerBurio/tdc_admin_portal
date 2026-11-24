// AdminResumeMetrics.js: Admin > general > resume metrics (P3d; server: GET /api/analytics/admin/resume-metrics,
// permission analytics.view). Read-only and real counts only: per template, the resumes using it now, the applications
// sent with it ("my tdc resume" in the app), the interviews and hires that followed, and whether students may see its
// interview rate yet (the app shows it only from 30 applications and 10 interviews). Plus the public resume pages that
// are on and their views (the students' own visits, link previews and crawlers are not counted).
import React, { useCallback, useEffect, useState } from "react";
import { PageHeader, PageLoading, Button, EmptyState, Pill, StatCard, Table } from "../portal/kit";
import { analyticsApi } from "../services/analyticsApi";

const rate = (r) => (r.applications ? `${Math.round((r.interviews / r.applications) * 100)}%` : "–");

export default function AdminResumeMetrics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setData(null); setError("");
    try { setData(await analyticsApi.resumeMetrics()); } catch (e) { setError(e.message || "couldn't load"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const min = data?.minimum || { applications: 30, interviews: 10 };
  const columns = [
    { key: "name", label: "template" },
    { key: "resumes", label: "resumes now" },
    { key: "applications", label: "applications" },
    { key: "interviews", label: "interviews" },
    { key: "hires", label: "hires" },
    { key: "rate", label: "interview rate", render: (r) => rate(r) },
    { key: "rateShown", label: "shown to students", render: (r) => (r.rateShown ? <Pill tone="green">yes</Pill> : <Pill tone="sand">not yet</Pill>) },
  ];
  return (
    <div className="tdcp k-page" data-screen="resume-metrics">
      <PageHeader title="resume metrics" sub={`templates and what came of the applications sent with them. students see a template's interview rate only from ${min.applications} applications and ${min.interviews} interviews.`} actions={<Button variant="secondary" icon="refresh" onClick={load}>refresh</Button>} />
      {error ? <EmptyState icon="alert" tone="sand" title="couldn't load" text={error} action={<Button onClick={load}>try again</Button>} />
        : !data ? <PageLoading />
          : (
            <>
              <div className="k-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, margin: "16px 0" }}>
                <StatCard label="public resume pages on" value={data.publicPages?.on || 0} tone="blue" />
                <StatCard label="views of those pages" value={data.publicPages?.views || 0} tone="green" />
                <StatCard label="applications with a tdc resume" value={(data.templates || []).reduce((a, r) => a + (r.applications || 0), 0)} tone="orange" />
              </div>
              <Table label="resume templates" columns={columns} rows={data.templates || []} rowKey={(r) => r.id} empty={<EmptyState title="no resumes yet" />} />
              <p className="k-hint" style={{ marginTop: 12 }}>applications count only those sent with "my tdc resume" in the app (newer app, resume v2). an interview: the application reached interview or hired, an interview was scheduled, or an outcome was recorded (revoked ones don't count).</p>
            </>
          )}
    </div>
  );
}
