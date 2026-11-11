// SuggestedCandidates.js: "suggested candidates" for one job on the employer's pipeline (CandidatePipeline.js),
// FLAG_CAREER_MATCHING + FLAG_CAREER_TIMELINE (server: GET /api/career/matching/jobs/:jobId/suggested).
// Students who chose to be found and whose resume shows the job's skills, shown ANONYMOUSLY: a label, the estimate,
// the matched skills and the part of the resume they appear in. No name, photo, university, city or contact. The
// employer can only invite to apply (once each, at most 20 a day per job); the student decides, and the employer
// sees who they are only if they apply (then they appear in the columns like any applicant).
import React, { useCallback, useEffect, useState } from "react";
import { Button, Modal, Pill, toast } from "../portal/kit";
import careerApi from "../services/careerApi";

const STATUS = { sent: ["invited", "sand"], interested: ["interested", "green"], declined: ["declined", "sand"] };

export default function SuggestedCandidates({ jobId, jobTitle }) {
  const [data, setData] = useState(null);
  const [asking, setAsking] = useState(null); // a candidate to confirm
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => {
    if (!jobId) return;
    careerApi.suggested(jobId).then(setData).catch(() => setData(null));
  }, [jobId]);
  useEffect(() => { setData(null); load(); }, [load]);
  if (!data || !data.candidates?.length) return null;

  const send = async () => {
    setBusy(true);
    try {
      await careerApi.invite(jobId, asking.token);
      toast(`${asking.label} invited: they decide`, "ok");
      setAsking(null);
      load();
    } catch (e) { toast(e.message || "couldn't send the invite", "bad"); }
    finally { setBusy(false); }
  };

  return (
    <section className="k-card pad" aria-label="suggested candidates" data-testid="suggested-candidates" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 8 }}>
        <strong>suggested candidates</strong>
        <span className="k-hint">{data.invitesLeftToday} invite{data.invitesLeftToday === 1 ? "" : "s"} left today</span>
      </div>
      <p className="k-hint" style={{ margin: "4px 0 10px" }}>students who chose to be found, shown by their skills only. you can invite them to apply; they decide. you see who they are only if they apply.</p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {data.candidates.map((c) => {
          const st = c.invite ? STATUS[c.invite.status] || [c.invite.status, "sand"] : null;
          return (
            <li key={c.token} data-candidate={c.label} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid #ECE7DA" }}>
              <strong style={{ minWidth: 100 }}>{c.label}</strong>
              <Pill tone="green">{c.score}% of the skills</Pill>
              <span style={{ flex: 1, minWidth: 220, fontSize: 14 }}>
                {c.matchedSkills.map((s) => `${s.skill} (${s.where.join(", ")})`).join(" · ")}
                {c.missingSkills.length > 0 && <span className="k-hint"> · not shown: {c.missingSkills.join(", ")}</span>}
              </span>
              {st ? <Pill tone={st[1]}>{st[0]}</Pill> : (
                <Button size="sm" onClick={() => setAsking(c)} disabled={data.invitesLeftToday <= 0} aria-label={`invite ${c.label} to apply`}>invite to apply</Button>
              )}
            </li>
          );
        })}
      </ul>
      {asking && (
        <Modal title={`invite ${asking.label} to apply?`} sub={jobTitle ? `for ${jobTitle}` : undefined} icon="send" tone="sand" onClose={busy ? undefined : () => setAsking(null)}
          footer={<><Button variant="secondary" onClick={() => setAsking(null)} disabled={busy}>cancel</Button><Button onClick={send} loading={busy}>send the invite</Button></>}>
          <p style={{ marginTop: 0 }}>they get a note in the tdc app with your company and this job. they decide whether to apply; you'll see their name only if they do. you can invite each candidate once.</p>
        </Modal>
      )}
    </section>
  );
}
