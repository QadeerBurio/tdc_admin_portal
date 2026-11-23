// VerifyCredential.js — public credential check (/verify/:id), the link and QR printed on every tdc certificate and
// letter (P2-5). Shows only what the server's public verify route returns: name, role, university, dates, and
// valid / revoked. No sign-in; the server limits how often one address can check. Not indexed (vercel.json).
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WebNav, WebFooter, pageTitle } from "../web/site";
import { crewPublicApi } from "../services/api";

const TYPES = { certificate: "certificate of ambassadorship", letter: "letter of recommendation", recommendation: "letter of recommendation", founder_card: "founder circle", badge: "tdc badge" };
const day = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi" }) : "");

export default function VerifyCredential() {
  const { id } = useParams();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    document.title = pageTitle("verify a credential");
    let live = true;
    crewPublicApi.verify(id)
      .then((c) => live && setState({ c }))
      .catch((e) => live && setState({ error: e?.response?.status === 429 ? "too many checks from here. try again in a few minutes." : e?.response?.status === 404 ? "we couldn't find a tdc credential with this id." : "couldn't check right now. try again." }));
    return () => { live = false; };
  }, [id]);

  const c = state.c;
  const revoked = c?.status === "revoked";
  return (
    <div className="tdcw">
      <WebNav />
      <main className="wrap" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 640 }}>
        <h1 className="h-lg">verify a credential<span className="dot" aria-hidden="true">.</span></h1>
        {state.loading && <p className="lead" aria-live="polite">checking…</p>}
        {state.error && (
          <div className="card" role="alert" style={{ padding: 28, borderRadius: 24, marginTop: 24 }}>
            <p style={{ fontSize: 16, margin: 0 }}>{state.error}</p>
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>credential {id}</p>
          </div>
        )}
        {c && (
          <div className="card" style={{ padding: 28, borderRadius: 24, marginTop: 24 }} data-testid="credential">
            <span className="chip" style={revoked ? { background: "#FDECEA", color: "#B42318" } : undefined}>
              <span className="chip-dot" style={revoked ? { background: "#B42318" } : undefined} />{revoked ? "revoked" : "valid"}
            </span>
            <h2 className="h-md" style={{ marginTop: 16 }}>{c.name}</h2>
            <p style={{ fontSize: 16, margin: "6px 0 0" }}>{c.role}{c.university ? `, ${c.university}` : ""}</p>
            <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{TYPES[c.type] || "tdc credential"}</p>
            <dl style={{ marginTop: 18, fontSize: 14, display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px" }}>
              {c.since && (<><dt className="muted">since</dt><dd style={{ margin: 0 }}>{day(c.since)}</dd></>)}
              {c.issuedAt && (<><dt className="muted">issued</dt><dd style={{ margin: 0 }}>{day(c.issuedAt)}</dd></>)}
              {revoked && c.revokedAt && (<><dt className="muted">revoked</dt><dd style={{ margin: 0 }}>{day(c.revokedAt)}</dd></>)}
              <dt className="muted">id</dt><dd style={{ margin: 0, wordBreak: "break-all" }}>{c.id}</dd>
            </dl>
            {revoked && <p style={{ marginTop: 16, fontSize: 14 }}>this credential was revoked by tdc and is no longer valid.</p>}
          </div>
        )}
      </main>
      <WebFooter />
    </div>
  );
}
