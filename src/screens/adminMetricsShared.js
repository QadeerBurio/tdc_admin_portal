// adminMetricsShared.js: what the metrics page (AdminMetrics) and the overview (AdminHome) share, so both show the
// same numbers from the same server calculation (GET /api/analytics/admin/metrics, services/analytics/adminMetrics.js):
// the date range picker (Karachi days), the "i" tooltip with each metric's definition, the change vs the previous
// period, the CSV export and the data hook.
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import Ico from "../portal/Ico";
import { Button, DateInput, Field, Segmented } from "../portal/kit";
import analyticsApi, { downloadCsv } from "../services/analyticsApi";

export const PRESETS = [
  { value: "today", label: "today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "month", label: "this month" },
  { value: "custom", label: "custom" },
];
export const karachiDay = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

// the groups and the label of each metric (the definitions come from the server)
export const GROUPS = [
  { id: "students", title: "students", icon: "grad", tone: "blue", metrics: [["signups", "sign-ups"], ["verified", "verified"], ["active7", "active (7 days)"], ["active30", "active (30 days)"]] },
  { id: "brands", title: "brands", icon: "store", tone: "red", metrics: [["approvedBrands", "approved brands"], ["newlyApproved", "newly approved"], ["activeOffers", "live offers"], ["redemptions", "redemptions"], ["revenue", "revenue through tdc"]] },
  { id: "loyalty", title: "loyalty", icon: "star", tone: "yellow", metrics: [["members", "members"], ["visits", "visits"], ["rewardsEarned", "rewards earned"], ["rewardsUsed", "rewards used"]] },
  { id: "surpriseBox", title: "surprise boxes", icon: "gift", tone: "orange", metrics: [["boxesListed", "boxes listed"], ["orders", "orders"], ["pickups", "pickups"], ["noShows", "no-shows"]] },
  { id: "careers", title: "careers", icon: "briefcase", tone: "coral", metrics: [["jobs", "jobs posted"], ["applications", "applications"], ["interviews", "interviews"], ["hires", "hires"]] },
  { id: "engagement", title: "engagement", icon: "heart", tone: "pink", metrics: [["posts", "posts"], ["confessions", "confessions"], ["pushOpens", "push opens"]] },
];

export const fmtNum = (v, unit) => (v == null ? "–" : unit === "PKR" ? `PKR ${Number(v).toLocaleString("en-PK")}` : Number(v).toLocaleString("en-PK"));

/** the "i" button: the metric's definition on hover, focus or click (Escape closes) */
export function InfoTip({ label, text }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDoc); };
  }, [open]);
  return (
    <span className="am-tip" ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="am-tip-btn" aria-label={`what “${label}” counts`} aria-describedby={id} aria-expanded={open}
        onClick={() => setOpen((o) => !o)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} data-tip={label}>
        <Ico kind="info" tone="plain" size={14} />
      </button>
      <span role="tooltip" id={id} className="am-tip-text" hidden={!open}>{text}</span>
    </span>
  );
}

/** "+12% vs previous period" (or "as of now" for snapshots) */
export function Change({ m }) {
  if (!m) return null;
  if (m.snapshot) return <span className="am-change flat">as of now</span>;
  if (!m.change) return null;
  const { delta, pct } = m.change;
  const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const text = pct == null ? (delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${fmtNum(delta, m.unit)} (new)`) : `${pct > 0 ? "+" : ""}${pct}%`;
  return (
    <span className={`am-change ${dir}`}>
      <span aria-hidden="true">{dir === "up" ? "▲" : dir === "down" ? "▼" : "•"}</span> {text}
      <span className="am-sr"> vs previous period ({fmtNum(m.previous, m.unit)})</span>
    </span>
  );
}

/** preset buttons + the custom from / to (Karachi days) */
export function RangePicker({ value, onChange }) {
  const [from, setFrom] = useState(value.from || karachiDay(new Date(Date.now() - 6 * 864e5)));
  const [to, setTo] = useState(value.to || karachiDay());
  const bad = value.preset === "custom" && from && to && from > to;
  return (
    <div className="am-range" role="group" aria-label="date range">
      <Segmented label="date range" value={value.preset} onChange={(p) => onChange(p === "custom" ? { preset: "custom", from, to } : { preset: p })} options={PRESETS} />
      {value.preset === "custom" && (
        <div className="am-custom">
          <Field label="from" htmlFor="am-from"><DateInput id="am-from" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
          <Field label="to" htmlFor="am-to" error={bad ? "“to” must be on or after “from”" : undefined}><DateInput id="am-to" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
          <Button variant="secondary" disabled={!from || !to || bad} onClick={() => onChange({ preset: "custom", from, to })}>apply</Button>
        </div>
      )}
    </div>
  );
}

/** the figures for a range; refetches when the range changes */
export function useAdminMetrics(initial = { preset: "30d" }) {
  const [range, setRange] = useState(initial);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const seq = useRef(0);
  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const d = await analyticsApi.adminMetrics(range.preset === "custom" ? range : { preset: range.preset });
      if (mine === seq.current) setData(d);
    } catch (e) {
      if (mine === seq.current) { setError(e.message || "could not load the figures"); setData(null); }
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [range]);
  useEffect(() => { load(); }, [load]);
  return { range, setRange, data, loading, error, load };
}

/** one group as CSV: metric, value, previous, change %, definition */
export function exportGroup(data, group) {
  const rows = [["section", "metric", "value", "previous period", "change %", "definition"], ["range", `${data.range.fromDay} to ${data.range.toDay} (Karachi)`, "", `${data.previous.fromDay} to ${data.previous.toDay}`, "", ""]];
  for (const [key, label] of group.metrics) {
    const m = data.groups[group.id][key];
    if (!m) continue;
    rows.push([group.title, label, m.value, m.snapshot ? "as of now" : m.previous ?? "", m.change?.pct ?? "", m.definition]);
  }
  downloadCsv(`tdc-metrics-${group.id}-${data.range.fromDay}-to-${data.range.toDay}.csv`, rows);
}
