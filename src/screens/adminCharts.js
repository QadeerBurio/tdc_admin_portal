// adminCharts.js: small charts for the admin overview, drawn with SVG / CSS in the kit's tokens (no chart library).
// Each chart is a <figure> with a caption, a one-line summary for screen readers (role="img" + aria-label) and the
// numbers as a table under "show as table".
import React, { useId } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("en-PK");
const shortDay = (d) => new Date(`${d}T12:00:00+05:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" });

function DataTable({ head, rows }) {
  return (
    <details className="am-chart-table">
      <summary>show as table</summary>
      <table className="k-table">
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
      </table>
    </details>
  );
}

/** points: [{ day: "YYYY-MM-DD", count }] */
export function TrendChart({ title, points = [], unit = "" }) {
  const id = useId();
  const W = 600, H = 180, P = 28;
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((s, p) => s + p.count, 0);
  const x = (i) => P + (points.length <= 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (points.length - 1));
  const y = (v) => H - P - (v / max) * (H - 2 * P);
  const line = points.map((p, i) => `${x(i)},${y(p.count)}`).join(" ");
  const area = points.length ? `${x(0)},${H - P} ${line} ${x(points.length - 1)},${H - P}` : "";
  const peak = points.reduce((b, p) => (p.count > (b?.count ?? -1) ? p : b), null);
  const summary = points.length ? `${title}: ${fmt(total)}${unit} in ${points.length} day${points.length === 1 ? "" : "s"}; most on ${shortDay(peak.day)} (${fmt(peak.count)})` : `${title}: no data`;
  return (
    <figure className="am-chart" aria-labelledby={id}>
      <figcaption id={id} className="am-chart-title">{title} <span className="k-hint">· {fmt(total)} total</span></figcaption>
      {total === 0 ? <p className="k-hint am-chart-empty">nothing in this range</p> : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} preserveAspectRatio="none" className="am-svg">
          <line x1={P} x2={W - P} y1={H - P} y2={H - P} className="am-axis" />
          <polygon points={area} className="am-area" />
          <polyline points={line} className="am-line" fill="none" />
          {points.length <= 31 && points.map((p, i) => <circle key={p.day} cx={x(i)} cy={y(p.count)} r={3} className="am-dot" />)}
          <text x={P} y={H - 8} className="am-tick">{shortDay(points[0].day)}</text>
          <text x={W - P} y={H - 8} className="am-tick" textAnchor="end">{shortDay(points[points.length - 1].day)}</text>
          <text x={P} y={y(max) - 6} className="am-tick">{fmt(max)}</text>
        </svg>
      )}
      <DataTable head={["day", title]} rows={points.map((p) => [shortDay(p.day), fmt(p.count)])} />
    </figure>
  );
}

/** rows: [{ label, value }] as horizontal bars (top 5 lists, the funnel) */
export function BarList({ title, rows = [], empty = "nothing to show", valueLabel = "count", note }) {
  const id = useId();
  const max = Math.max(1, ...rows.map((r) => r.value));
  const summary = rows.length ? `${title}: ${rows.map((r) => `${r.label} ${fmt(r.value)}`).join(", ")}` : `${title}: ${empty}`;
  return (
    <figure className="am-chart" aria-labelledby={id}>
      <figcaption id={id} className="am-chart-title">{title}</figcaption>
      {rows.every((r) => !r.value) ? <p className="k-hint am-chart-empty">{empty}</p> : (
        <div role="img" aria-label={summary} className="am-bars">
          {rows.map((r) => (
            <div key={r.label} className="am-bar-row" aria-hidden="true">
              <span className="am-bar-label">{r.label}</span>
              <span className="am-bar-track"><i style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }} /></span>
              <span className="am-bar-val">{fmt(r.value)}</span>
            </div>
          ))}
        </div>
      )}
      {note && <p className="k-hint" style={{ margin: "6px 0 0" }}>{note}</p>}
      {rows.length > 0 && <DataTable head={["", valueLabel]} rows={rows.map((r) => [r.label, fmt(r.value)])} />}
    </figure>
  );
}
