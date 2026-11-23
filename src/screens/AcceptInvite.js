// src/screens/AcceptInvite.js
// Phase A (A-6): the e-mailed invitation link (/admin/accept-invite?token=…): a new team member sets their password,
// then signs in. The link works once, for 72 hours (the server checks).
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import { Logo, pageTitle } from "../web/site";
import { API_ORIGIN } from "../config/api";

export default function AcceptInvite() {
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [state, setState] = useState({ loading: false, error: "", done: false });
  useEffect(() => { document.title = pageTitle("join the tdc team"); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return setState({ ...state, error: "use at least 8 characters." });
    if (password !== repeat) return setState({ ...state, error: "the two passwords don't match." });
    setState({ loading: true, error: "", done: false });
    try {
      await axios.post(`${API_ORIGIN}/api/auth/admin/accept-invite`, { token, password });
      setState({ loading: false, error: "", done: true });
    } catch (err) {
      setState({ loading: false, error: err.response?.data?.message || "that didn't work. try again.", done: false });
    }
  };

  return (
    <div className="tdcw">
      <div className="center-shell">
        <header className="wrap" style={{ width: "100%", paddingTop: 20, paddingBottom: 20 }}><Logo /></header>
        <main>
          {state.done ? (
            <div className="auth-card" role="status">
              <h1 style={{ fontWeight: 800, fontSize: 30 }}>you're in<span className="dot" aria-hidden="true">.</span></h1>
              <p className="muted">your password is set.</p>
              <Link to="/login" className="btn btn-primary btn-block">sign in</Link>
            </div>
          ) : (
            <form className="auth-card" onSubmit={submit} noValidate>
              <h1 style={{ fontWeight: 800, fontSize: 30 }}>join the tdc team<span className="dot" aria-hidden="true">.</span></h1>
              <p className="muted">set a password for the admin portal.</p>
              {!token && <div className="alert alert-error" role="alert">this link is missing its code. open it from the e-mail again.</div>}
              {state.error && <div className="alert alert-error" role="alert">{state.error}</div>}
              <div className="field"><label htmlFor="inv-pw">password</label><input id="inv-pw" className="input" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <div className="field"><label htmlFor="inv-pw2">the same again</label><input id="inv-pw2" className="input" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} required /></div>
              <button className="btn btn-primary btn-block" type="submit" disabled={state.loading || !token}>{state.loading ? "saving" : "set password"}</button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
