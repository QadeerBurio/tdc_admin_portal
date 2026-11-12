// skillTags.js: a job's skills as tags (the job form's SkillTagInput). The same rules and splitting as the server
// (server: services/jobs/skills.js), which checks them again on save.
//   MAX_SKILLS 15, MAX_SKILL_LENGTH 40
//   splitSkillText(text)          pasted text → suggested tags: split on commas, semicolons, new lines, " - " and
//                                 bullets, never inside brackets ("Python (pandas, numpy)" stays one tag)
//   looksLikeList(text)           a paste to split and confirm (a separator outside brackets, or longer than one tag)
//   addTags(tags, incoming)       → { tags, refused: [{ tag, reason }] }: trimmed, no repeats (any case), at most 15,
//                                 each at most 40 characters
export const MAX_SKILLS = 15;
export const MAX_SKILL_LENGTH = 40;

const OPEN = { "(": ")", "[": "]", "{": "}" };
const CLOSE = new Set([")", "]", "}"]);
const BULLET = /^[\s]*(?:[•·▪◦●○■□➤►▶✓✔*]|-(?=\s)|\d+[.)](?=\s))\s*/;
const tidy = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();

export function splitSkillText(text) {
  const src = String(text == null ? "" : text).replace(/\r\n?/g, "\n");
  const out = [];
  let cur = "";
  const depth = [];
  const push = () => { const t = tidy(cur.replace(BULLET, "")); if (t) out.push(t); cur = ""; };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (OPEN[ch]) { depth.push(OPEN[ch]); cur += ch; continue; }
    if (CLOSE.has(ch)) { if (depth.length && depth[depth.length - 1] === ch) depth.pop(); cur += ch; continue; }
    if (depth.length) { cur += ch === "\n" ? " " : ch; continue; }
    if (ch === "," || ch === ";" || ch === "\n") { push(); continue; }
    if ((ch === "-" || ch === "|" || ch === "–" || ch === "—") && src[i - 1] === " " && src[i + 1] === " ") { push(); continue; }
    if (/[•·▪◦●]/.test(ch)) { push(); continue; }
    cur += ch;
  }
  push();
  return out;
}

export function looksLikeList(text) {
  const t = String(text || "");
  return splitSkillText(t).length > 1 || tidy(t).length > MAX_SKILL_LENGTH || /^\s*(?:[•·▪◦●*]|-\s|\d+[.)]\s)/.test(t);
}

export function addTags(tags, incoming) {
  const out = [...(tags || [])];
  const refused = [];
  const seen = new Set(out.map((t) => t.toLowerCase()));
  for (const raw of incoming || []) {
    const t = tidy(raw);
    if (!t) continue;
    if (t.length > MAX_SKILL_LENGTH) { refused.push({ tag: t, reason: `over ${MAX_SKILL_LENGTH} characters` }); continue; }
    if (seen.has(t.toLowerCase())) { refused.push({ tag: t, reason: "already added" }); continue; }
    if (out.length >= MAX_SKILLS) { refused.push({ tag: t, reason: `at most ${MAX_SKILLS} skills` }); continue; }
    seen.add(t.toLowerCase());
    out.push(t);
  }
  return { tags: out, refused };
}

/** skills a job already has (an array, or old comma text) → tags as they are, for editing */
export function tagsOf(value) {
  if (Array.isArray(value)) return value.map(tidy).filter(Boolean);
  if (typeof value === "string") return splitSkillText(value);
  return [];
}
