// UniversitySelect.js: the university dropdown for the portal (brand counter "verify student"), on the same list as
// the app: it opens on the FULL list A–Z (name, short name, city), with a search box that filters as you type (name,
// short name, other names, city). Never empty: the bundled HEC list until / unless the server's list loads.
//   <UniversitySelect id="bv-uni" value="Institute of Business Management" onChange={(name, u) => …} />
import React, { useEffect, useMemo, useRef, useState } from "react";
import Ico from "./Ico";
import { bundledUniversities, loadUniversities, filterUniversities } from "../services/universitiesApi";

export default function UniversitySelect({ id = "university", value = "", onChange, placeholder = "select university" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [list, setList] = useState(bundledUniversities);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    loadUniversities().then((l) => { if (live && Array.isArray(l) && l.length) setList(l); });
    return () => { live = false; };
  }, [open]);
  useEffect(() => {
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);
  const shown = useMemo(() => filterUniversities(list, query), [list, query]);
  const pick = (u) => { onChange?.(u.name, u); setOpen(false); setQuery(""); };

  return (
    <div className="k-dd" ref={ref} data-university-select={id}>
      <button type="button" id={id} className="k-input bv-uni" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", textAlign: "left", minHeight: 44, cursor: "pointer" }}>
        <span style={value ? undefined : { color: "var(--k-faint, #8a857b)" }}>{value || placeholder}</span>
        <Ico kind={open ? "close" : "sort"} tone="plain" size={14} />
      </button>
      {open && (
        <div className="k-dd-pop">
          <div style={{ padding: 8 }}>
            <input type="search" className="k-input" autoFocus aria-label="search universities" placeholder="search: name, short name (IoBM) or city" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="k-dd-empty" data-count>{query ? `${shown.length} of ${list.length}` : `${list.length} universities, A–Z`}</div>
          <div className="k-dd-list" role="listbox" aria-label="universities" style={{ maxHeight: 320, overflowY: "auto" }}>
            {shown.map((u) => (
              <div key={u.id || u.name} role="option" aria-selected={value === u.name} tabIndex={0} className="k-dd-opt" onClick={() => pick(u)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(u); } }}>
                <span>{u.name}<span className="k-hint" style={{ display: "block" }}>{[u.shortName, u.city].filter(Boolean).join(" · ")}</span></span>
                {value === u.name && <Ico kind="check" tone="plain" size={15} />}
              </div>
            ))}
            {!shown.length && <div className="k-dd-empty"><b>no match</b><br />try the short name or the city</div>}
          </div>
        </div>
      )}
    </div>
  );
}
