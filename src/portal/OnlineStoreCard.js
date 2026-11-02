// OnlineStoreCard.js: the brand's online store, in brand settings (GET/POST/DELETE /api/brand/store).
// Not connected: the store address, then "connect WooCommerce" sends the brand to WooCommerce's own approval
// page (wc-auth); keys made by hand are the fallback. Connected: address, status, last check, order webhook,
// online offers, "test connection" and "disconnect". The server never sends keys back, and neither does this.
import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Button, Facts, Field, Input, Pill, Spinner, confirmDialog, toast } from "./kit";

const API = "https://the-deft-crew-production.up.railway.app/api/brand/store";
const STATUS = {
  connected: ["green", "connected"],
  error: ["red", "needs attention"],
  pending: ["yellow", "waiting for WooCommerce"],
};
const when = (d) => (d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "–");
const messageOf = (err, fallback) => err?.response?.data?.message || fallback;

export default function OnlineStoreCard() {
  const { token } = useContext(AuthContext);
  const headers = { Authorization: `Bearer ${token}` };
  const [state, setState] = useState(null); // { enabled, connection, onlineOffers }
  const [loadError, setLoadError] = useState("");
  const [url, setUrl] = useState("");
  const [manual, setManual] = useState(false);
  const [key, setKey] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const polls = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(API, { headers });
      setState(res.data);
      setLoadError("");
      return res.data;
    } catch (err) {
      setLoadError(messageOf(err, "couldn't load your online store"));
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // back from WooCommerce (?store=woocommerce&success=1|0): the keys arrive at our server, then it tests them;
  // check the status for a short while until it settles
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("store") !== "woocommerce") return undefined;
    window.history.replaceState(null, "", window.location.pathname);
    if (q.get("success") === "0") {
      toast("The connection was cancelled in WooCommerce", "bad");
      return undefined;
    }
    let stop = false;
    const tick = async () => {
      const s = await load();
      polls.current += 1;
      const st = s?.connection?.status;
      if (stop) return;
      if (st === "connected") toast("Your WooCommerce store is connected", "ok");
      else if (st === "error") toast(s.connection.lastError || "The store couldn't be connected", "bad");
      else if (polls.current < 15) setTimeout(tick, 1500);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [load]);

  const run = async (what, fn) => {
    setBusy(what);
    setError("");
    try {
      await fn();
    } finally {
      setBusy("");
    }
  };

  const connect = () => run("connect", async () => {
    try {
      const res = await axios.post(`${API}/woocommerce/start`, { storeUrl: url }, { headers });
      window.location.assign(res.data.authorizeUrl);
    } catch (err) {
      setError(messageOf(err, "couldn't start the connection"));
    }
  });
  const connectWithKeys = () => run("manual", async () => {
    try {
      const res = await axios.post(`${API}/woocommerce/manual`, { storeUrl: url, consumerKey: key.trim(), consumerSecret: secret.trim() }, { headers });
      setState(res.data);
      setKey("");
      setSecret("");
      toast("Your WooCommerce store is connected", "ok");
    } catch (err) {
      setSecret("");
      setError(messageOf(err, "couldn't connect with these keys"));
      if (err?.response?.data?.connection) setState(err.response.data);
    }
  });
  const test = () => run("test", async () => {
    try {
      const res = await axios.post(`${API}/test`, {}, { headers });
      setState(res.data);
      toast(res.data.success ? "The connection works" : res.data.message, res.data.success ? "ok" : "bad");
    } catch (err) {
      toast(messageOf(err, "couldn't test the connection"), "bad");
    }
  });
  const disconnect = async () => {
    const ok = await confirmDialog("New online codes will be checked by hand again, and the order webhook is removed from your store.", { title: "disconnect your store?", confirmLabel: "disconnect" });
    if (!ok) return;
    run("disconnect", async () => {
      try {
        const res = await axios.delete(API, { headers });
        setState(res.data);
        toast(res.data.message || "Disconnected", "ok");
      } catch (err) {
        toast(messageOf(err, "couldn't disconnect"), "bad");
      }
    });
  };

  const c = state?.connection;
  const [tone, label] = (c && STATUS[c.status]) || [];

  return (
    <section className="k-card bs-card bs-store" data-screen="online-store">
      <div className="bs-store-head">
        <h2 className="br-h2">online store</h2>
        {c ? <Pill tone={tone} dot>{label}</Pill> : state && <Pill tone="sand">no online store</Pill>}
      </div>

      {!state && !loadError && <div className="k-hint" role="status"><Spinner size="sm" /> checking…</div>}
      {loadError && <p className="k-error">{loadError}</p>}

      {state && c && (
        <>
          <Facts rows={[
            ["store", <a key="u" href={c.storeUrl} target="_blank" rel="noopener noreferrer">{c.storeUrl.replace(/^https:\/\//, "")}</a>],
            ["platform", "WooCommerce"],
            ["status", c.status === "error" ? <span key="e" className="k-error">{c.lastError || "needs attention"}</span> : label],
            ["order webhook", c.webhookStatus === "active" ? "active" : c.webhookStatus === "error" ? "not working" : "not set up"],
            ["last check", when(c.lastCheckAt)],
            ["online offers", `${state.onlineOffers || 0} using this store`],
            ["connected", c.connectedAt ? when(c.connectedAt) : "–"],
          ]} />
          {c.status === "pending" && <p className="k-hint">Approve the connection in WooCommerce. If you closed that page, cancel and connect again.</p>}
          <div className="bs-store-actions">
            {c.status !== "pending" && state.enabled && <Button variant="secondary" icon="refresh" loading={busy === "test"} disabled={!!busy} onClick={test}>test connection</Button>}
            <Button variant="danger" loading={busy === "disconnect"} disabled={!!busy} onClick={disconnect}>{c.status === "pending" ? "cancel" : "disconnect"}</Button>
          </div>
        </>
      )}

      {state && !c && !state.enabled && (
        <p className="k-hint">Connecting a WooCommerce store is coming soon. Until then, students show their code to you and you check it under promo code verify.</p>
      )}

      {state && !c && state.enabled && (
        <>
          <p className="k-hint">Connect your WooCommerce store and students' online codes become real coupons at your checkout. Paid orders that use them are counted automatically. Without a store, students show you their code and you check it under promo code verify.</p>
          <ol className="bs-steps">
            <li>your website runs WordPress with WooCommerce, on <b>https://</b></li>
            <li>in WordPress, Settings › Permalinks is not set to "Plain"</li>
            <li>you're signed in to WordPress as an administrator or shop manager</li>
          </ol>
          <Field label="store address" htmlFor="bs-store-url" error={error}>
            <Input id="bs-store-url" type="url" inputMode="url" autoComplete="url" placeholder="https://yourshop.pk" value={url} onChange={(e) => setUrl(e.target.value)} invalid={!!error} />
          </Field>
          {!manual ? (
            <div className="bs-store-actions">
              <Button icon="link" loading={busy === "connect"} disabled={!!busy || !url.trim()} onClick={connect}>connect WooCommerce</Button>
              <Button variant="ghost" onClick={() => { setManual(true); setError(""); }}>use keys instead</Button>
            </div>
          ) : (
            <>
              <p className="k-hint">In WooCommerce: Settings › Advanced › REST API › Add key, with permission <b>Read/Write</b>. Paste the key and secret here; they are stored encrypted and never shown again.</p>
              <Field label="consumer key" htmlFor="bs-store-key">
                <Input id="bs-store-key" autoComplete="off" spellCheck={false} placeholder="ck_…" value={key} onChange={(e) => setKey(e.target.value)} />
              </Field>
              <Field label="consumer secret" htmlFor="bs-store-secret">
                <Input id="bs-store-secret" type="password" autoComplete="new-password" spellCheck={false} placeholder="cs_…" value={secret} onChange={(e) => setSecret(e.target.value)} />
              </Field>
              <div className="bs-store-actions">
                <Button icon="link" loading={busy === "manual"} disabled={!!busy || !url.trim() || !key.trim() || !secret.trim()} onClick={connectWithKeys}>connect with keys</Button>
                <Button variant="ghost" onClick={() => { setManual(false); setError(""); }}>back</Button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
