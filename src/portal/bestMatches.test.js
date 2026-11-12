import { pickCompare, compareRows, gapText, cellOf, MAX_COMPARE } from "./bestMatches";

const strong = { score: 83, quality: "strong", qualityLabel: "strong", summary: "Matches 5 of 6 skills, missing MongoDB, meets all requirements", strengths: [{ skill: "React", evidence: "A web app built with React" }], gaps: { missingSkills: ["MongoDB"], unknownSkills: [], requirements: [] }, skillStatus: { React: "matched", MongoDB: "missing" }, mandatorySummary: { met: 1, notMet: 0, unknown: 0 } };
const weak = { score: 33, quality: "weak", qualityLabel: "weak", summary: "Matches 1 of 2 skills", strengths: [], gaps: { missingSkills: ["React"], unknownSkills: [], requirements: [{ criterion: "Must know React", status: "unknown" }] }, skillStatus: { React: "missing", MongoDB: "matched" }, mandatorySummary: { met: 0, notMet: 0, unknown: 1 } };

test("pickCompare: adds and removes; at most 3", () => {
  let s = [];
  s = pickCompare(s, "a").selected;
  s = pickCompare(s, "b").selected;
  s = pickCompare(s, "c").selected;
  expect(s).toEqual(["a", "b", "c"]);
  const fourth = pickCompare(s, "d");
  expect(fourth.refused).toBe(true);
  expect(fourth.selected).toEqual(["a", "b", "c"]);
  expect(pickCompare(s, "b").selected).toEqual(["a", "c"]);
  expect(MAX_COMPARE).toBe(3);
});

test("compareRows: estimate, band, one row per job skill in the job's order, requirements, summary", () => {
  const rows = compareRows({ skills: ["React", "MongoDB"] }, [{ applicationId: "1", name: "A", match: strong }, { applicationId: "2", name: "B", match: weak }, { applicationId: "3", name: "C", match: null }]);
  expect(rows.map((r) => r.key)).toEqual(["estimate", "band", "skill:React", "skill:MongoDB", "requirements", "summary"]);
  expect(rows[0].cells.map((c) => c.text)).toEqual(["83%", "33%", "–"]);
  expect(rows[1].cells.map((c) => c.text)).toEqual(["strong", "weak", "no estimate"]);
  expect(rows[2].cells.map((c) => c.text)).toEqual(["✓ shown", "✗ not found", "– no estimate"]);
  expect(rows[2].cells[0].evidence).toBe("A web app built with React");
  expect(rows[4].cells.map((c) => c.text)).toEqual(["1 met", "1 to check", "–"]);
  expect(rows[5].cells[2].text).toMatch(/no estimate/);
});

test("gapText: missing skills, then requirements not met / to check", () => {
  expect(gapText(strong)).toBe("missing MongoDB");
  expect(gapText(weak)).toBe("missing React · to check: Must know React");
  expect(gapText(null)).toBe("");
  expect(cellOf("unknown").text).toBe("can't tell");
});
