// bestMatches.js: plain logic for "best matches" (screens/BestMatches.js), kept apart so it can be unit tested.
//   pickCompare(selected, id, max = 3)        toggle one applicant in the compare set (2-3; the 4th is refused)
//   compareRows(job, people)                  the side-by-side table: one row per listed skill, then the estimate,
//                                             the band and the requirements; each cell from that applicant's match
//   gapText(match)                            "missing MongoDB · to check: Must know React" (empty when no gaps)
// people: [{ applicationId, name, match }] where match is the server's best-match view (or null outside the pilot).
export const MAX_COMPARE = 3;

export function pickCompare(selected, id, max = MAX_COMPARE) {
  const has = selected.includes(id);
  if (has) return { selected: selected.filter((x) => x !== id), refused: false };
  if (selected.length >= max) return { selected, refused: true };
  return { selected: [...selected, id], refused: false };
}

const CELL = {
  matched: { text: "shown", tone: "green", sign: "✓" },
  missing: { text: "not found", tone: "red", sign: "✗" },
  unknown: { text: "can't tell", tone: "sand", sign: "?" },
};
export const cellOf = (status) => CELL[status] || { text: "no estimate", tone: "sand", sign: "–" };

export function compareRows(job, people) {
  const rows = [];
  rows.push({ key: "estimate", label: "estimate", cells: people.map((p) => ({ text: p.match?.score != null ? `${p.match.score}%` : "–" })) });
  rows.push({ key: "band", label: "band", cells: people.map((p) => ({ text: p.match ? p.match.qualityLabel : "no estimate", tone: p.match?.quality === "strong" ? "green" : p.match?.quality === "medium" ? "yellow" : "sand" })) });
  for (const skill of job?.skills || []) {
    rows.push({ key: `skill:${skill}`, label: skill, skill: true, cells: people.map((p) => {
      const c = cellOf(p.match?.skillStatus?.[skill]);
      const ev = p.match?.skillStatus?.[skill] === "matched" ? (p.match.strengths || []).find((s) => s.skill === skill)?.evidence || "" : "";
      return { text: `${c.sign} ${c.text}`, tone: c.tone, evidence: ev };
    }) });
  }
  rows.push({ key: "requirements", label: "requirements", cells: people.map((p) => {
    const m = p.match?.mandatorySummary;
    if (!m) return { text: "–" };
    const parts = [m.met ? `${m.met} met` : "", m.notMet ? `${m.notMet} not met` : "", m.unknown ? `${m.unknown} to check` : ""].filter(Boolean);
    return { text: parts.join(" · ") || "none listed" };
  }) });
  rows.push({ key: "summary", label: "summary", cells: people.map((p) => ({ text: p.match?.summary || "outside the matching pilot: no estimate" })) });
  return rows;
}

export function gapText(match) {
  if (!match?.gaps) return "";
  const parts = [];
  if (match.gaps.missingSkills?.length) parts.push(`missing ${match.gaps.missingSkills.join(", ")}`);
  if (match.gaps.unknownSkills?.length) parts.push(`can't tell: ${match.gaps.unknownSkills.join(", ")}`);
  const req = match.gaps.requirements || [];
  if (req.some((r) => r.status === "not_met")) parts.push(`not met: ${req.filter((r) => r.status === "not_met").map((r) => r.criterion).join("; ")}`);
  if (req.some((r) => r.status === "unknown")) parts.push(`to check: ${req.filter((r) => r.status === "unknown").map((r) => r.criterion).join("; ")}`);
  return parts.join(" · ");
}
