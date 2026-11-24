// ConfessionPageRedirect.js: /c/<id> when the host hasn't forwarded it to the server itself (vercel.json rewrites and
// middleware.js forward /c/* to the server's /c/*, P4c shared confession page). Sends the browser to the server's page,
// keeping the visit in history once (replace). Only a well-formed id (24 hex characters) is forwarded; anything else
// goes home.
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_ORIGIN } from "../config/api";

export const confessionPageUrl = (id) => (/^[0-9a-f]{24}$/i.test(String(id || "")) ? `${API_ORIGIN}/c/${id}` : "/");

export default function ConfessionPageRedirect() {
  const { id = "" } = useParams();
  useEffect(() => { window.location.replace(confessionPageUrl(id)); }, [id]);
  return null;
}
