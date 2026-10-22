// StudentDossier.js: /dossier now opens the full profile inside the admin shell (/admin/users/:role/:id).
// Takes the user id from navigation state or ?userId=, as before. Loads through services/api (no localhost).
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usersApi } from "../services/api";
import "../portal/portal.css";

const ROLES = ["student", "brand", "employee", "traveler"];

export default function StudentDossier() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const userId = location.state?.userId || new URLSearchParams(location.search).get("userId");

  useEffect(() => {
    if (!userId) { navigate("/admin", { replace: true, state: { page: "students" } }); return; }
    let alive = true;
    usersApi.details(userId)
      .then((u) => {
        if (!alive) return;
        const role = ROLES.includes(u?.role) ? u.role : "student";
        navigate(`/admin/users/${role}/${userId}`, { replace: true });
      })
      .catch((e) => { if (alive) setError(e?.response?.status === 404 ? "This user could not be found." : "Could not load this profile. Try again."); });
    return () => { alive = false; };
  }, [userId, navigate]);

  return (
    <div className="tdcp" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} role="status">
      {error ? (
        <div className="tdcp-card tdcp-empty" style={{ maxWidth: 420 }}>
          {error}
          <div style={{ marginTop: 14 }}><button type="button" className="tdcp-btn tdcp-btn-primary" onClick={() => navigate("/admin", { state: { page: "students" } })}>all students</button></div>
        </div>
      ) : <span className="tdcp-muted">opening profile…</span>}
    </div>
  );
}
