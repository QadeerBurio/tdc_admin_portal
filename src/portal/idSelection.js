// Admin user lists: pick rows and copy their ids in the form feature flags take ("ids:id1,id2,...").
// Pure helpers, so the list screen stays small and the formatting has one place.

// "ids:a,b,c" from a list of ids (duplicates and empty values dropped, order kept)
export function formatIds(ids) {
  const seen = new Set();
  const out = [];
  for (const raw of ids || []) {
    const id = String(raw || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return `ids:${out.join(",")}`;
}

// the universities present in a student list, for the filter: [{ value, label, count }], by name
export const NO_UNIVERSITY = "__none__";
export function universityOptions(users) {
  const map = new Map();
  let none = 0;
  for (const u of users || []) {
    const id = u?.university?._id || u?.university?.id;
    if (!id) { none += 1; continue; }
    const key = String(id);
    const cur = map.get(key) || { value: key, label: u.university.name || "unnamed university", count: 0 };
    cur.count += 1;
    map.set(key, cur);
  }
  const list = [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  if (none) list.push({ value: NO_UNIVERSITY, label: "no university", count: none });
  return list;
}

export function matchesUniversity(user, filter) {
  if (!filter || filter === "all") return true;
  const id = user?.university?._id || user?.university?.id;
  if (filter === NO_UNIVERSITY) return !id;
  return String(id || "") === filter;
}

// copy text; falls back to a hidden textarea where the async clipboard API isn't available
export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}
