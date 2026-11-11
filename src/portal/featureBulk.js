// src/portal/featureBulk.js: the plain logic behind "Features…" on the admin user lists (FeatureBulkDialog.js).
// The server takes at most 500 accounts per request; a change for more than 500 accounts needs the admin to type
// the number to confirm.
export const BATCH = 500;
export const TYPED_CONFIRM_OVER = 500;

/** Split ids into batches of at most `size` */
export function batches(ids, size = BATCH) {
  const out = [];
  for (let i = 0; i < ids.length; i += size) out.push(ids.slice(i, i + size));
  return out;
}

/** Does this count need the number typed to confirm? */
export const needsTypedConfirm = (count) => count > TYPED_CONFIRM_OVER;

/** Is the typed text exactly the count (spaces and thousands separators allowed)? */
export const typedMatches = (typed, count) => String(typed ?? "").replace(/[\s,]/g, "") === String(count);

/** Flags this role can be given, from the server's overview */
export const flagsForRole = (flags, role) => (flags || []).filter((f) => (f.roles || []).includes(role));

/** Merge batch results: { changed, unchanged, skipped, failed } (failed: ids of batches that errored) */
export function mergeResults(parts) {
  const out = { changed: [], unchanged: [], skipped: [], failed: [] };
  for (const p of parts) {
    if (p.error) { out.failed.push(...p.ids); continue; }
    out.changed.push(...(p.result?.changed || []));
    out.unchanged.push(...(p.result?.unchanged || []));
    out.skipped.push(...(p.result?.skipped || []));
  }
  return out;
}

/** "turn on Loyalty for 214 accounts" */
export const actionText = (label, enabled, count) => `turn ${enabled ? "on" : "off"} ${label} for ${count.toLocaleString("en-US")} account${count === 1 ? "" : "s"}`;
