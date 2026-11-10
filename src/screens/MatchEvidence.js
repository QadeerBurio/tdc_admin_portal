// MatchEvidence.js: the "match evidence" panel in the candidate drawer (FLAG_CAREER_MATCHING, server:
// routes/careerMatching.routes.js). Decision support only: the job's mandatory criteria (met / not met / unknown),
// then each listed skill with the resume text that shows it (matched), or why it doesn't (missing / unknown),
// and the estimate with its formula. It never ranks people as hireable or not, and nothing is hidden.
// Renders nothing when matching isn't on for this employer and candidate.
import React, { useEffect, useState } from "react";
import Ico from "../portal/Ico";
import { Pill } from "../portal/kit";
import { careerApi, inKarachi } from "../services/careerApi";

const STATUS = { met: ["green", "met"], not_met: ["red", "not met"], unknown: ["sand", "unknown"] };

export default function MatchEvidence({ applicationId }) {
  const [m, setM] = useState(undefined); // undefined loading, null not available
  useEffect(() => {
    let alive = true;
    careerApi.matchFor(applicationId).then((d) => alive && setM(d)).catch(() => alive && setM(null));
    return () => { alive = false; };
  }, [applicationId]);
  if (!m) return null;
  const list = (items, tone, label) => items.length > 0 && (
    <div style={{ marginTop: 10 }}>
      <div className="k-row" style={{ gap: 6, marginBottom: 4 }}><Pill tone={tone}>{label}</Pill><span className="k-hint">{items.length}</span></div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((s) => (
          <li key={s.skill} style={{ marginBottom: 4 }}>
            <strong>{s.skill}</strong>
            {s.evidence.map((e, i) => (
              <div key={i} className="k-hint" style={{ fontSize: 12.5 }}>{e.path ? <>“{e.text}” <span className="k-muted">({e.path.replace(/\[(\d+)\]/g, (x, n) => ` ${Number(n) + 1}`).replace(/\./g, " › ")})</span></> : e.text}</div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <section className="k-card pad" style={{ marginBottom: 12 }} data-card="match-evidence" aria-label="match evidence">
      <div className="k-card-head"><Ico kind="search" tone="blue" size={30} /><h3>match evidence</h3></div>
      <p className="k-hint" style={{ marginTop: 0 }}>{m.note}</p>
      {m.mandatory.length > 0 && (
        <>
          <h4 style={{ margin: "8px 0 4px" }}>mandatory criteria</h4>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {m.mandatory.map((c, i) => (
              <li key={i} style={{ padding: "4px 0", borderTop: i ? "1px solid var(--line-soft)" : 0 }}>
                <Pill tone={STATUS[c.status][0]}>{STATUS[c.status][1]}</Pill> <strong>{c.criterion}</strong>
                <div className="k-hint" style={{ fontSize: 12.5 }}>{c.evidence}</div>
              </li>
            ))}
          </ul>
        </>
      )}
      <h4 style={{ margin: "12px 0 4px" }}>skills the job lists</h4>
      <p style={{ margin: 0, fontWeight: 700 }}>{m.relevance.label}</p>
      {list(m.skills.matched, "green", "evidence in the resume")}
      {list(m.skills.missing, "red", "not found")}
      {list(m.skills.unknown, "sand", "not enough information")}
      <details style={{ marginTop: 10 }}>
        <summary className="k-hint">how this is worked out</summary>
        <p className="k-hint" style={{ margin: "6px 0 0" }}>{m.relevance.formula}. It reads the resume&apos;s skills, projects and experience; never the name, photo, age, university or city. Resume used: {m.source === "tailored_version" ? "the tailored version sent with this application" : m.source === "resume" ? "the candidate's latest resume" : "none"}. Model {m.modelVersion}, worked out {inKarachi(m.computedAt)}.</p>
      </details>
    </section>
  );
}
