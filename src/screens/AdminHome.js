// AdminHome.js: the admin "overview" (feat/admin-approvals-metrics). KPI cards with the change vs the previous
// period, what needs the admin's action (each with its count and a button to its page), charts and quick actions.
// The numbers come from the same call as the metrics page (adminMetricsShared → GET /api/analytics/admin/metrics).
// go(pageId) switches the admin page; pages: the ids the menu has right now (a pilot page that's off is "not set up").
import React from "react";
import Ico from "../portal/Ico";
import { PageHeader, Button, EmptyState, PageLoading } from "../portal/kit";
import { InfoTip, Change, RangePicker, fmtNum, useAdminMetrics } from "./adminMetricsShared";
import { TrendChart, BarList } from "./adminCharts";
import "./styles/AdminMetrics.css";

const KPIS = [
  ["students", "signups", "new students", "grad", "blue"],
  ["students", "verified", "verified students", "checkCircle", "green"],
  ["brands", "approvedBrands", "active brands", "store", "red"],
  ["brands", "redemptions", "redemptions", "ticket", "orange"],
  ["brands", "revenue", "revenue through tdc", "coin", "green"],
  ["careers", "applications", "applications", "briefcase", "coral"],
];
const ACTIONS = [
  ["brandApprovals", "brand approvals", "brand_approval", "store"],
  ["studentVerifications", "student verifications", "student_verifications", "grad"],
  ["companyVerifications", "company verifications", "company_verifications", "shield"],
  ["hireDisputes", "hire disputes", "hire_disputes", "alert"],
  ["ratingsReports", "ratings reports", "ratings_reports", "star"],
  ["failedPushes", "failed pushes (7 days)", "engagement_test_push", "bell"],
];
const QUICK = [
  ["offer", "new offer", "plus"],
  ["brand_approval", "approve brands", "checkCircle"],
  ["engagement_test_push", "send push test", "send"],
  ["features", "open features", "settings"],
];

export default function AdminHome({ go, pages }) {
  const { range, setRange, data, loading, error, load } = useAdminMetrics({ preset: "30d" });
  const has = (id) => !pages || pages.includes(id) || id === "offer";
  return (
    <div className="tdcp k-page" data-screen="admin-overview">
      <PageHeader title="overview" sub="the key numbers, what's waiting for you and quick links. same figures as the metrics page."
        actions={<Button variant="secondary" icon="chart" onClick={() => go("engagement_metrics")}>all metrics</Button>} />
      <RangePicker value={range} onChange={setRange} />

      {error ? (
        <div className="k-card" role="alert"><EmptyState icon="alert" tone="red" title="couldn't load the overview" text={error} action={<Button icon="refresh" onClick={load}>try again</Button>} /></div>
      ) : loading && !data ? (
        <PageLoading label="loading overview…" />
      ) : data ? (
        <div aria-busy={loading || undefined}>
          <p className="k-hint am-scope">{data.range.fromDay} to {data.range.toDay} (Karachi) vs the {data.range.days} day{data.range.days === 1 ? "" : "s"} before. deleted{data.exclusions.test.configured ? " and test" : ""} accounts left out.</p>

          <section aria-label="key numbers" className="am-kpis">
            {KPIS.map(([g, k, label, icon, tone]) => {
              const m = data.groups[g][k];
              return (
                <div key={k} className="k-stat am-kpi" data-kpi={k}>
                  <div className="k-stat-ico"><Ico kind={icon} tone={tone} size={36} /></div>
                  <div className="k-stat-lbl">{label} <InfoTip label={label} text={m.definition} /></div>
                  <div className="k-stat-num">{fmtNum(m.value, m.unit)}</div>
                  <Change m={m} />
                </div>
              );
            })}
          </section>

          <div className="am-two">
            <section className="k-card pad" aria-labelledby="am-needs">
              <div className="k-card-head"><Ico kind="bell" tone="orange" size={32} /><h2 id="am-needs" className="am-group-title">needs your action</h2></div>
              <ul className="am-needs">
                {ACTIONS.map(([k, label, page, icon]) => {
                  const count = data.needsAction[k];
                  const open = has(page) && count != null;
                  return (
                    <li key={k} className="am-need" data-need={k}>
                      <Ico kind={icon} tone="plain" size={18} />
                      <span className="am-need-lbl">{label}</span>
                      <span className={`tdcp-count${!count ? " zero" : ""}`} aria-label={count == null ? "not set up" : `${count} waiting`}>{count == null ? "–" : fmtNum(count)}</span>
                      {open
                        ? <Button size="sm" variant={count ? "primary" : "secondary"} onClick={() => go(page)} aria-label={`open ${label}`}>open</Button>
                        : <span className="k-hint am-need-off">not set up</span>}
                    </li>
                  );
                })}
              </ul>
            </section>
            <section className="k-card pad" aria-labelledby="am-quick">
              <div className="k-card-head"><Ico kind="spark" tone="yellow" size={32} /><h2 id="am-quick" className="am-group-title">quick actions</h2></div>
              <div className="am-quick">
                {QUICK.filter(([p]) => has(p)).map(([p, label, icon]) => <Button key={p} variant="secondary" icon={icon} onClick={() => go(p)}>{label}</Button>)}
              </div>
            </section>
          </div>

          <div className="am-charts">
            <section className="k-card pad"><TrendChart title="sign-ups" points={data.series.signups} /></section>
            <section className="k-card pad"><TrendChart title="redemptions" points={data.series.redemptions} /></section>
            <section className="k-card pad"><BarList title="top 5 brands by redemptions" rows={data.topBrands.map((b) => ({ label: b.name, value: b.redemptions }))} valueLabel="redemptions"
              empty={`no brand had ${data.minCohort}+ students redeem in this range`} note={`brands with fewer than ${data.minCohort} students are not listed.`} /></section>
            <section className="k-card pad"><BarList title="top 5 universities by active students" rows={data.topUniversities.map((u) => ({ label: u.name, value: u.activeStudents }))} valueLabel="active students (30 days)"
              empty={`no university has ${data.minCohort}+ active students yet`} note="active in the last 30 days, as of now." /></section>
            <section className="k-card pad am-wide"><BarList title="hiring funnel" valueLabel="applications"
              rows={[["applications", data.funnel.applications], ["shortlisted", data.funnel.shortlisted], ["interviews completed", data.funnel.interviews], ["offers accepted", data.funnel.offers], ["verified hires", data.funnel.hires]].map(([label, value]) => ({ label, value }))}
              empty="no applications in this range" note="applications that started in the range, from the hiring timeline." /></section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
