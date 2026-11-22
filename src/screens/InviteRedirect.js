// InviteRedirect.js: /i/<CODE> when the host hasn't served the static invite page itself (vercel.json rewrites
// /i/:code to /i/index.html). Sends the browser to that page with the code and channel, keeping the visit in history
// once (replace). The page is public/i/index.html: tiny, no React, made for slow mobile data (P1-2).
import { useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";

export default function InviteRedirect() {
  const { code = "" } = useParams();
  const { search } = useLocation();
  useEffect(() => {
    const clean = String(code).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    const q = new URLSearchParams(search);
    const c = (q.get("c") || "").replace(/[^a-z]/gi, "").slice(0, 10);
    window.location.replace(`/i/index.html?code=${encodeURIComponent(clean)}${c ? `&c=${c}` : ""}`);
  }, [code, search]);
  return null;
}
