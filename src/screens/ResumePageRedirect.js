// ResumePageRedirect.js: /r/<link> when the host hasn't forwarded it to the server itself (vercel.json rewrites
// /r/* to the server's /r/*, P3d public resume page). Sends the browser to the server's page, keeping the visit in
// history once (replace). Only a well-formed link (22 characters) is forwarded; anything else goes home.
import { useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { API_ORIGIN } from "../config/api";

export const resumePageUrl = (slug, search = "") => {
  const s = String(slug || "");
  if (!/^[A-Za-z0-9_-]{22}$/.test(s)) return "/";
  const k = new URLSearchParams(search).get("k");
  return `${API_ORIGIN}/r/${s}${k && /^[A-Za-z0-9_-]{1,64}$/.test(k) ? `?k=${k}` : ""}`;
};

export default function ResumePageRedirect() {
  const { slug = "" } = useParams();
  const { search } = useLocation();
  useEffect(() => { window.location.replace(resumePageUrl(slug, search)); }, [slug, search]);
  return null;
}
