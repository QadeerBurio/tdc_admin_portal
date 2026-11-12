// SkillTagInput.js: the job form's "Required Skills" as tags (portal/skillTags.js; the server checks again).
// Type a skill and press Enter or comma: it becomes a chip (× removes it; Backspace in the empty box removes the last).
// At most 15 skills, each at most 40 characters: a refused one says why. Pasting a list or a long text doesn't drop it
// into one skill: it's split (commas, semicolons, new lines, " - ", bullets; never inside brackets) into suggested
// tags shown as chips to confirm ("add these"), each removable first, or cancel.
import React, { useState } from "react";
import { MAX_SKILLS, MAX_SKILL_LENGTH, splitSkillText, looksLikeList, addTags } from "./skillTags";
import { Button } from "./kit";

const chip = { display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 6px 4px 10px", borderRadius: 999, background: "var(--yellow-soft)", fontSize: 13.5, fontWeight: 600 };
const chipBtn = { border: 0, background: "transparent", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 4px", color: "inherit" };

export default function SkillTagInput({ id = "skills", value = [], onChange, disabled = false }) {
  const tags = Array.isArray(value) ? value : [];
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [suggested, setSuggested] = useState(null); // tags split from a paste, to confirm

  const refusedNote = (refused) => (refused.length ? refused.map((r) => `"${r.tag.length > 30 ? `${r.tag.slice(0, 27)}...` : r.tag}": ${r.reason}`).join("; ") : "");
  const add = (incoming) => {
    const r = addTags(tags, incoming);
    if (r.tags.length !== tags.length) onChange(r.tags);
    setNote(refusedNote(r.refused));
    return r;
  };
  const commit = () => {
    if (!text.trim()) return;
    const r = add([text]);
    if (!r.refused.length) setText("");
  };
  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); return; }
    if (e.key === "Backspace" && !text && tags.length) onChange(tags.slice(0, -1));
  };
  const onPaste = (e) => {
    const pasted = e.clipboardData?.getData("text") || "";
    if (!looksLikeList(pasted)) return; // one short skill: pasted as typed
    e.preventDefault();
    setSuggested(splitSkillText(pasted));
    setNote("");
  };
  const confirm = () => { add(suggested || []); setSuggested(null); };

  const left = MAX_SKILLS - tags.length;
  return (
    <div data-testid="skill-tags">
      <div role="list" aria-label="skills" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: tags.length ? 8 : 0 }}>
        {tags.map((t) => (
          <span key={t} role="listitem" style={chip}>
            {t}
            <button type="button" style={chipBtn} onClick={() => onChange(tags.filter((x) => x !== t))} disabled={disabled} aria-label={`remove ${t}`}>×</button>
          </span>
        ))}
      </div>
      <input
        id={id}
        className="k-input"
        type="text"
        value={text}
        maxLength={200}
        disabled={disabled || left <= 0}
        onChange={(e) => { const v = e.target.value; if (v.endsWith(",")) { setText(v.slice(0, -1)); return; } setText(v); }}
        onKeyDown={onKeyDown}
        onBlur={commit}
        onPaste={onPaste}
        placeholder={left > 0 ? "Type a skill, then Enter or comma (e.g. React)" : `${MAX_SKILLS} skills added (the most)`}
        aria-describedby={`${id}-hint`}
      />
      <div id={`${id}-hint`} className="k-hint" style={{ fontSize: 12.5, marginTop: 4 }}>
        {tags.length}/{MAX_SKILLS} skills · each up to {MAX_SKILL_LENGTH} characters. Short tags match candidates best.
      </div>
      {note && <div role="alert" className="k-error" style={{ marginTop: 4 }}>{note}</div>}
      {suggested && (
        <div data-testid="skill-suggestions" role="group" aria-label="suggested skills from the pasted text" style={{ marginTop: 8, padding: 10, border: "1px dashed var(--line)", borderRadius: 12 }}>
          <div style={{ fontSize: 13.5, marginBottom: 6 }}>
            {suggested.length ? `Split the pasted text into ${suggested.length} skill${suggested.length === 1 ? "" : "s"}. Remove any you don't want, then add them.` : "Nothing to add from the pasted text."}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {suggested.map((t, i) => (
              <span key={`${t}-${i}`} style={{ ...chip, background: t.length > MAX_SKILL_LENGTH ? "var(--danger-bg)" : chip.background }} title={t.length > MAX_SKILL_LENGTH ? `over ${MAX_SKILL_LENGTH} characters: won't be added` : ""}>
                {t}
                <button type="button" style={chipBtn} onClick={() => setSuggested((s) => s.filter((_, j) => j !== i))} aria-label={`leave out ${t}`}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button size="sm" onClick={confirm} disabled={!suggested.length}>add these</Button>
            <Button size="sm" variant="secondary" onClick={() => setSuggested(null)}>cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}
