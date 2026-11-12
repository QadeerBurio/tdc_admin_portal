// BestMatches.js: "best matches for this job" on the employer's candidates page (CandidatePipeline.js), for one job,
// FLAG_CAREER_MATCHING + FLAG_CAREER_TIMELINE (server: GET /api/career/matching/jobs/:jobId/ranked).
// Every applicant, highest estimate first: the percentage and band (strong / medium / weak / not enough info), a one-
// line summary built from the evidence, the top strengths (a matched skill with the resume line that shows it) and
// the gaps. "compare" puts 2-3 applicants side by side against the job's skills. An estimate from the resume to check
// before deciding: nobody is rejected or hidden, and name, photo, gender, age, university and city are never read
// (docs/MATCHING_FAIRNESS.md on the server). The names shown here come from the employer's own applicant list.
import React, { useEffect, useMemo, useState } from "react";
import { Button, Modal, Pill, Checkbox, toast } from "../portal/kit";
import careerApi from "../services/careerApi";
import { pickCompare, compareRows, gapText, MAX_COMPARE } from "../portal/bestMatches";

const TONE = { strong: "green", medium: "yellow", weak: "sand", insufficient: "sand" };
const SHOW = 10;

export default function BestMatches({ jobId, applications = [], onOpen }) {
  const [data, setData] = useState(null);
  const [all, setAll] = useState(false);
  const [selected, setSelected] = useState([]);
  const [comparing, setComparing] = useState(false);
  useEffect(() => {
    let alive = true;
    setData(null); setSelected([]); setAll(false);
    if (!jobId) return undefined;
    careerApi.ranked(jobId).then((d) => alive && setData(d)).catch(() => alive && setData(null));
    return () => { alive = false; };
  }, [jobId, applications]);
  const nameOf = useMemo(() => Object.fromEntries((applications || []).map((a) => [a.applicationId, a.candidateName || "candidate"])), [applications]);
  if (!data || !data.applications?.length) return null;

  const rows = all ? data.applications : data.applications.slice(0, SHOW);
  const toggle = (id) => {
    const r = pickCompare(selected, id);
    if (r.refused) toast(`compare up to ${MAX_COMPARE} at a time`, "bad");
    setSelected(r.selected);
  };
  const people = selected.map((id) => ({ applicationId: id, name: nameOf[id] || "candidate", match: data.applications.find((a) => a.applicationId === id)?.match || null }));

  return (
    <section className="k-card pad" aria-label="best matches for this job" data-testid="best-matches" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <strong>best matches for this job</strong>
        <span className="k-hint">{data.applications.length} applicant{data.applications.length === 1 ? "" : "s"}, highest estimate first</span>
        <span style={{ flex: 1 }} />
        <Button size="sm" variant="secondary" icon="users" disabled={selected.length < 2} onClick={() => setComparing(true)} aria-label={`compare ${selected.length} selected applicants`}>
          compare{selected.length ? ` (${selected.length})` : ""}
        </Button>
      </div>
      <p className="k-hint" style={{ margin: "4px 0 10px" }}>an estimate from each resume's skills: check before deciding. nobody is rejected or hidden. tick 2-3 to compare them side by side.</p>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((r) => {
          const m = r.match;
          const name = nameOf[r.applicationId] || "candidate";
          const gaps = gapText(m);
          return (
            <li key={r.applicationId} data-application={r.applicationId} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", gap: 10, padding: "10px 0", borderTop: "1px solid var(--line-soft)" }}>
              <span style={{ width: 28, fontWeight: 800, color: "var(--muted, #6B675E)" }} aria-label={r.rank ? `rank ${r.rank}` : "no rank"}>{r.rank ? `#${r.rank}` : "–"}</span>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                  <strong data-role="name">{name}</strong>
                  {m ? (
                    <>
                      {m.score != null && <span style={{ fontWeight: 800 }}>{m.score}%</span>}
                      <Pill tone={TONE[m.quality] || "sand"}>{m.qualityLabel}</Pill>
                    </>
                  ) : <Pill tone="sand">no estimate (outside the matching pilot)</Pill>}
                </div>
                {m?.summary && <div style={{ fontSize: 14, marginTop: 4 }}>{m.summary}</div>}
                {m?.strengths?.length > 0 && (
                  <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 13 }} aria-label={`${name}: top strengths`}>
                    {m.strengths.map((s) => <li key={s.skill}><strong>{s.skill}</strong>{s.evidence ? <span className="k-hint">: “{s.evidence}”</span> : null}</li>)}
                  </ul>
                )}
                {gaps && <div className="k-hint" style={{ fontSize: 13, marginTop: 4 }}>gaps: {gaps}</div>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Checkbox label="compare" checked={selected.includes(r.applicationId)} onChange={() => toggle(r.applicationId)} aria-label={`compare ${name}`} />
                <Button size="sm" variant="secondary" onClick={() => onOpen && onOpen(r.applicationId)} aria-label={`open ${name}`}>open</Button>
              </div>
            </li>
          );
        })}
      </ol>
      {data.applications.length > SHOW && (
        <Button size="sm" variant="secondary" onClick={() => setAll((x) => !x)} style={{ marginTop: 8 }}>{all ? "show fewer" : `show all ${data.applications.length}`}</Button>
      )}
      {comparing && (
        <Modal
          open
          onClose={() => setComparing(false)}
          icon="users"
          tone="blue"
          size="lg"
          title="compare applicants"
          sub={`against the skills ${data.job?.title ? `"${data.job.title}"` : "this job"} lists. an estimate from each resume: check before deciding.`}
          footer={<Button variant="secondary" onClick={() => setComparing(false)}>close</Button>}
        >
          <div style={{ overflowX: "auto" }} tabIndex={0} role="region" aria-label="comparison table (scrolls sideways)">
            <table data-testid="compare-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <caption className="k-hint" style={{ textAlign: "left", marginBottom: 6 }}>✓ shown in the resume · ✗ not found · ? can't tell</caption>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: "left", padding: 6 }}>job skill</th>
                  {people.map((p) => <th key={p.applicationId} scope="col" style={{ textAlign: "left", padding: 6 }}>{p.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {compareRows(data.job, people).map((row) => (
                  <tr key={row.key} style={{ borderTop: "1px solid var(--line-soft)" }}>
                    <th scope="row" style={{ textAlign: "left", padding: 6, fontWeight: row.skill ? 600 : 800 }}>{row.label}</th>
                    {row.cells.map((c, i) => (
                      <td key={i} style={{ padding: 6, verticalAlign: "top" }}>
                        {c.tone ? <Pill tone={c.tone}>{c.text}</Pill> : c.text}
                        {c.evidence ? <div className="k-hint" style={{ fontSize: 12 }}>“{c.evidence}”</div> : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </section>
  );
}
