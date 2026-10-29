// motion.js: the portal's motion helpers (styles in motion.css). Opacity and transform only, played once,
// never delaying data, and off when the user asks for reduced motion. kit.js loads motion.css.
import React, { useEffect, useRef, useState } from "react";

const reduced = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fades the page area in when `key` changes (route path, or the admin's active page). The element is
// not remounted, so nothing refetches; opacity only, so fixed children keep their place while it runs.
export function useRouteFade(ref, key) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = ref.current;
    if (!el || !el.animate || reduced()) return;
    el.animate([{ opacity: 0.001 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
  }, [ref, key]);
}

// "1,234", "rs 5,000", 42 → { pre, n, post, dec } when it holds one plain number, else null
function parseNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? { pre: "", n: v, post: "", dec: Number.isInteger(v) ? 0 : 1, comma: false } : null;
  if (typeof v !== "string") return null;
  const m = v.match(/^(\D*?)(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?(\D*)$/);
  if (!m) return null;
  return { pre: m[1], n: parseFloat(m[2].replace(/,/g, "") + (m[3] || "")), post: m[4], dec: m[3] ? m[3].length - 1 : 0, comma: m[2].includes(",") || parseFloat(m[2].replace(/,/g, "")) >= 1000 };
}
const show = (p, x) => p.pre + (p.comma ? x.toLocaleString("en-US", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec }) : x.toFixed(p.dec)) + p.post;

// Counts up to `value` the first time it is a number above zero (700 ms), then shows later values as
// they are. Anything that isn't a plain number (a skeleton, "—") is rendered untouched.
export function CountUp({ value, duration = 700 }) {
  const parsed = parseNum(value);
  const done = useRef(false);
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (done.current || !parsed || parsed.n <= 0) return undefined;
    done.current = true;
    if (reduced()) return undefined;
    let raf = 0;
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(k < 1 ? parsed.n * e : null);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); setShown(null); };
    // only the first real number starts it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsed && parsed.n]);
  if (!parsed || shown == null) return <>{value}</>;
  const final = show(parsed, parsed.n);
  return (
    <span className="tdcp-count-up">
      <span className="tdcp-sr">{final}</span>
      <span className="size" aria-hidden="true">{final}</span>
      <span aria-hidden="true">{show(parsed, parsed.dec ? shown : Math.round(shown))}</span>
    </span>
  );
}

export default CountUp;
