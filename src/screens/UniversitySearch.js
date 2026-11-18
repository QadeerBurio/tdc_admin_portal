// UniversitySearch.js: pick an approved university (merge target, "match to …"): a search box over the public list
// (server ids, so the pick can be merged into).
import React, { useEffect, useState } from "react";
import { Field, SearchInput } from "../portal/kit";
import universitiesApi from "../services/universitiesApi";

export default function UniversitySearch({ value, onChange, excludeId, label = "university", id = "uni-target" }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  useEffect(() => {
    let live = true;
    const t = setTimeout(() => universitiesApi.search(q, 15).then((r) => { if (live) setRows((r || []).filter((x) => x.id !== excludeId)); }).catch(() => live && setRows([])), q ? 200 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [q, excludeId]);
  return (
    <Field label={label} htmlFor={id}>
      <SearchInput id={id} value={q} onChange={(e) => setQ(e.target.value)} placeholder="name, short name or city" aria-label={`search ${label}`} />
      <div role="listbox" aria-label={`${label} results`} style={{ maxHeight: 220, overflowY: "auto", marginTop: 6 }}>
        {rows.map((u) => (
          <button key={u.id} type="button" role="option" aria-selected={value?.id === u.id} onClick={() => onChange(u)} className={`k-option${value?.id === u.id ? " is-on" : ""}`}
            style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", minHeight: 44, border: 0, borderBottom: "1px solid var(--k-line, #ece7db)", background: value?.id === u.id ? "var(--k-yellow-soft, #fff1cc)" : "transparent", cursor: "pointer" }}>
            <strong>{u.name}</strong> <span className="k-hint">{[u.shortName, u.city].filter(Boolean).join(" · ")}</span>
          </button>
        ))}
        {!rows.length && <div className="k-hint" style={{ padding: 8 }}>no match</div>}
      </div>
    </Field>
  );
}
