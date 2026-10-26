// Redeem offer (design/portal/TrRedeem): check a student's tdc code, then mark it redeemed.
// No travel code endpoint exists yet, so verify and scan stay disabled and nothing is sent.
// Will need: POST /api/partner/travel/redeem/verify { code } -> { valid, reason, student, institute,
// package, travelDate, discountPercent, amount, discountAmount }, POST /api/partner/travel/redeem { code },
// and the partner's recent redemptions (code, student, package, redeemedAt).
import React, { useState } from "react";
import Ico from "../../portal/Ico";
import { Button, Input, Pill } from "../../portal/kit";
import "../styles/TravelPortal.css";

const HOW = ["the student shows their code from the tdc app.", "type or scan it, then press verify.", "apply the discount and press mark as redeemed."];

// the verify card on its own: pass onVerify / onRedeem and a result to make it live
export function RedeemCard({ onVerify = null, onRedeem = null, result = null, busy = false }) {
  const [code, setCode] = useState("");
  const live = typeof onVerify === "function";
  return (
    <section className="k-card tr-redeem">
      <h2>enter or scan the code</h2>
      <div className="tr-redeem-row">
        <Input aria-label="code" className="tr-code" value={code} placeholder="e.g. TDC-7K2Q" onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <Button variant="secondary" icon="qr" disabled title="scanning opens with partner redemption">scan</Button>
        <Button disabled={!live || !code.trim() || busy} loading={busy} onClick={() => live && onVerify(code.trim())}>verify</Button>
      </div>
      {!live && <p className="tr-soon"><Ico kind="clock" tone="plain" size={16} />code checks open when partner redemption goes live.</p>}
      {result && (
        <div className={`tr-result ${result.valid ? "ok" : "bad"}`}>
          <Ico kind={result.valid ? "checkCircle" : "xCircle"} tone={result.valid ? "green" : "red"} size={44} />
          <div>
            <b>{result.valid ? "valid. sorted." : result.reason || "not valid"}</b>
            {result.valid && <div>{[result.student, result.institute, `${result.discountPercent}% off ${result.package}`].filter(Boolean).join(" · ")}</div>}
          </div>
          {result.valid && <Button disabled={!onRedeem || busy} onClick={() => onRedeem && onRedeem(code.trim())}>mark as redeemed</Button>}
        </div>
      )}
    </section>
  );
}

export default function RedeemOffer({ redemptions = [] }) {
  return (
    <div className="tdcp k-page" data-screen="travel-redeem">
      <div className="k-head">
        <div className="tr-title">
          <Ico kind="qr" tone="green" size={56} />
          <div>
            <h1>redeem offer<span className="dot" aria-hidden="true">.</span></h1>
            <p>check a student's tdc code before you apply the discount.</p>
          </div>
        </div>
      </div>

      <div className="tr-redeem-grid">
        <RedeemCard />
        <section className="tr-how">
          <h2>how it works</h2>
          <ol>
            {HOW.map((t, i) => (
              <li key={i}><span>{i + 1}</span>{t}</li>
            ))}
          </ol>
        </section>
      </div>

      <section className="k-card tr-recent">
        <div className="tr-list-head"><h2>recent redemptions</h2><Pill tone="sand">coming soon</Pill></div>
        <div className="k-table-scroll">
          <table className="k-table" style={{ minWidth: 640 }}>
            <thead><tr><th>code</th><th>student</th><th>package</th><th>redeemed on</th></tr></thead>
            {redemptions.length > 0 && (
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.code}>
                    <td className="tr-mono">{r.code}</td>
                    <td>{r.student}</td>
                    <td>{r.package}</td>
                    <td>{r.redeemedAt ? new Date(r.redeemedAt).toLocaleDateString() : "–"}</td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {redemptions.length === 0 && <p className="tr-table-empty">no codes redeemed yet.</p>}
      </section>
    </div>
  );
}
