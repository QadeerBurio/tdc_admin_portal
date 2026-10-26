// src/pages/VerifyReward.jsx
// Brand-side reward verification (design/portal/BrReward).
// Layout: Header, stats (always visible), tabs (verify/history), content.
// Rule: brand-locked codes only work at that brand · platform-wide codes work anywhere.

import React, { useState, useContext, useEffect, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Ico from "../portal/Ico";
import { Button, IconButton, Input, SearchInput, Segmented, StatCard, Tabs, Table, EmptyState, Pill, Facts } from "../portal/kit";
import "./styles/BrandPortal.css";

const API_BASE = "https://the-deft-crew-production.up.railway.app/api";
const STATUS_TONE = { active: "blue", used: "green", expired: "sand", cancelled: "red" };

const VerifyReward = () => {
  const { token, user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState("verify"); // verify | history

  // Verify state
  const [code, setCode] = useState("");
  const [lookup, setLookup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Stats
  const [stats, setStats] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const isBrand = user?.role === "brand";

  useEffect(() => {
    if (isBrand) {
      loadStats();
      loadHistory();
    }
  }, [isBrand]);

  const loadStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/engagement/brand/redeem-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data);
    } catch (e) {
      console.error("[redeem-stats]", e?.message);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/engagement/brand/redemptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory(res.data?.items || []);
    } catch (e) {
      console.error("[redeem-history]", e?.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLookup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setLookup(null);
    setSuccess(null);

    try {
      const res = await axios.post(
        `${API_BASE}/engagement/brand/redemptions/lookup`,
        { code: code.trim().toUpperCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLookup(res.data);
    } catch (e) {
      const data = e?.response?.data;
      setError(data?.reason || data?.message || "lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUse = async () => {
    if (!lookup?.valid || !lookup?.redemption?._id) return;
    setActionLoading(true);
    setError(null);

    try {
      const res = await axios.post(
        `${API_BASE}/engagement/brand/redemptions/${lookup.redemption._id}/use`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(res.data);
      setCode("");
      setLookup(null);
      loadStats();
      loadHistory();
    } catch (e) {
      const data = e?.response?.data;
      setError(data?.message || "failed to mark as used");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setLookup(null);
    setError(null);
    setSuccess(null);
  };

  // ─── Filtered history ────────────────────────────────
  const filteredHistory = useMemo(() => {
    let list = history;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.code?.toLowerCase().includes(q) ||
          r.user?.name?.toLowerCase().includes(q) ||
          r.user?.rollNo?.toLowerCase().includes(q) ||
          r.user?.email?.toLowerCase().includes(q) ||
          r.rewardTitle?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }

    return list;
  }, [history, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: history.length,
      active: 0,
      used: 0,
      expired: 0,
      cancelled: 0,
    };
    history.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return counts;
  }, [history]);

  const fmtDate = (d, opts) => (d ? new Date(d).toLocaleDateString(undefined, opts) : "–");

  // ─── Verify Content ────────────────────────────────
  const renderVerifyContent = () => (
    <div className="bv-grid">
      <section className="k-card bv-pane">
        <div>
          <h2 className="br-h2">redeem a customer code</h2>
          <p className="k-hint">codes for your brand or platform-wide will verify</p>
        </div>

        <div className="vr-input-row">
          <Input
            className="vr-code"
            aria-label="reward code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="TDC-XXXX-XXXX"
            maxLength={14}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            autoFocus
          />
          <Button
            icon="search"
            onClick={handleLookup}
            loading={loading}
            disabled={loading || !code.trim()}
          >
            {loading ? "checking" : "verify"}
          </Button>
        </div>

        {error && (
          <div className="k-note bad vr-note" role="alert">
            <div>
              <b>not valid</b>
              <div>{error}</div>
            </div>
            <IconButton icon="close" label="dismiss" variant="ghost" size="sm" onClick={() => setError(null)} />
          </div>
        )}

        {success && (
          <div className="k-note ok vr-note" role="status">
            <div>
              <b>marked as used. sorted.</b>
              <div>code <strong>{success.redemption?.code}</strong>. give the customer their reward.</div>
            </div>
            <IconButton icon="close" label="dismiss" variant="ghost" size="sm" onClick={() => setSuccess(null)} />
          </div>
        )}

        {lookup && (
          <div className={`vr-result ${lookup.valid ? "ok" : "fail"}`}>
            <div className="vr-result-head">
              <Ico kind={lookup.valid ? "checkCircle" : "xCircle"} tone={lookup.valid ? "green" : "red"} size={40} />
              <div>
                <b>{lookup.valid ? "valid code. sorted." : lookup.reason || "invalid"}</b>
                <div className="k-muted">
                  {lookup.valid
                    ? "confirm reward then click mark as used"
                    : "code is not usable"}
                </div>
              </div>
            </div>

            {lookup.redemption && (
              <Facts rows={[
                ["code", <span className="vr-mono">{lookup.redemption.code}</span>],
                ["reward", lookup.redemption.reward?.title],
                ["brand", lookup.redemption.reward?.brand ? lookup.redemption.reward.brand : "platform-wide"],
                ...(lookup.redemption.reward?.kind ? [["kind", lookup.redemption.reward.kind.replace(/_/g, " ")]] : []),
                ...(lookup.redemption.reward?.description ? [["description", lookup.redemption.reward.description]] : []),
                ["customer", lookup.redemption.user?.name],
                ...(lookup.redemption.user?.rollNo ? [["roll no", lookup.redemption.user.rollNo]] : []),
                ...(lookup.redemption.user?.email ? [["email", lookup.redemption.user.email]] : []),
                ["points cost", `${lookup.redemption.costPoints} pts`],
                ["expires", new Date(lookup.redemption.expiresAt).toLocaleDateString()],
                ["status", <Pill tone={lookup.valid ? "green" : STATUS_TONE[lookup.redemption.status] || "sand"}>{lookup.redemption.status}</Pill>],
              ]} />
            )}

            <div className="k-row">
              <Button variant="secondary" onClick={handleReset}>
                {lookup.valid ? "cancel" : "try another"}
              </Button>
              {lookup.valid && (
                <Button icon="check" onClick={handleUse} loading={actionLoading} disabled={actionLoading}>
                  {actionLoading ? "marking" : "mark as used"}
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="k-card bv-pane">
        <h2 className="br-h2">how it works</h2>
        <ol className="vr-how">
          <li><span>1</span>customer opens the tdc app and shows the code from "my rewards".</li>
          <li><span>2</span>type the code above and press verify.</li>
          <li><span>3</span>brand-locked codes only work at that brand · platform-wide codes work anywhere</li>
          <li><span>4</span>give them their reward (discount / free item / perk)</li>
          <li><span>5</span>press "mark as used". done.</li>
        </ol>
      </section>
    </div>
  );

  // ─── History Content ───────────────────────────────
  const columns = [
    { key: "code", label: "code", render: (r) => <span className="vr-mono">{r.code}</span> },
    { key: "user", label: "customer", render: (r) => (
      <div className="vr-cell">
        <b>{r.user?.name || "–"}</b>
        {r.user?.rollNo && <span className="k-muted">Roll: {r.user.rollNo}</span>}
      </div>
    ) },
    { key: "reward", label: "reward", render: (r) => (
      <div className="vr-cell">
        <span>{r.rewardTitle || "reward"}</span>
        <span className="k-muted">{r.costPoints} pts</span>
      </div>
    ) },
    { key: "createdAt", label: "date", render: (r) => fmtDate(r.createdAt, { month: "short", day: "numeric", year: "numeric" }) },
    { key: "expiresAt", label: "expires", render: (r) => fmtDate(r.expiresAt, { month: "short", day: "numeric" }) },
    { key: "status", label: "status", render: (r) => <Pill tone={STATUS_TONE[r.status] || "sand"}>{r.status}</Pill> },
  ];

  const renderHistoryContent = () => (
    <>
      <div className="k-toolbar">
        <SearchInput
          className="k-grow"
          aria-label="search history"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="search by code, name, roll no, reward…"
        />
        <Button variant={showFilters ? "primary" : "secondary"} icon="filter" onClick={() => setShowFilters(!showFilters)}>
          filters{statusFilter !== "all" ? ` · ${statusFilter}` : ""}
        </Button>
        <IconButton icon="refresh" label="refresh history" onClick={loadHistory} />
      </div>

      {showFilters && (
        <Segmented
          label="filter by status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={["all", "active", "used", "expired", "cancelled"].map((st) => ({ value: st, label: st, count: statusCounts[st] || 0 }))}
        />
      )}

      <Table
        columns={columns}
        rows={filteredHistory.slice(0, 100)}
        loading={historyLoading && history.length === 0}
        minWidth={760}
        empty={
          <EmptyState
            icon="clock"
            tone="purple"
            title={history.length === 0 ? "no redemptions yet." : "no results match your filters."}
            text={history.length === 0 ? "codes you verify will appear here." : "try clearing the search or filters."}
          />
        }
      />

      {filteredHistory.length > 100 && (
        <p className="k-hint">showing 100 of {filteredHistory.length} redemptions</p>
      )}
    </>
  );

  // ─── Stats (always visible) ────────────────────────
  const s = stats || {
    total: 0,
    active: 0,
    used: 0,
    expired: 0,
    cancelled: 0,
    pointsLiability: 0,
  };

  return (
    <div className="tdcp k-page" data-screen="brand-reward">
      <div className="k-head">
        <div className="br-title">
          <Ico kind="gift" tone="purple" size={56} />
          <div>
            <h1>verify reward<span className="dot" aria-hidden="true">.</span></h1>
            <p>for crew perks students unlock with points. different from the student discount.</p>
          </div>
        </div>
      </div>

      {isBrand && (
        <div className="k-stats">
          <StatCard icon="gift" tone="yellow" label="total" value={s.total} />
          <StatCard icon="check" tone="green" label="used" value={s.used} />
          <StatCard icon="clock" tone="blue" label="active" value={s.active} />
          <StatCard icon="alert" tone="sand" label="expired" value={s.expired} />
          <StatCard icon="coin" tone="purple" label="points redeemed" value={(s.pointsLiability || 0).toLocaleString()} />
        </div>
      )}

      {isBrand && (
        <Tabs
          label="reward sections"
          value={activeTab}
          onChange={(t) => {
            setActiveTab(t);
            if (t === "history") loadHistory();
          }}
          tabs={[
            { id: "verify", label: "verify", icon: "ticket" },
            { id: "history", label: "history", icon: "clock", count: history.length > 0 ? history.length : null },
          ]}
        />
      )}

      {activeTab === "verify" ? renderVerifyContent() : renderHistoryContent()}
    </div>
  );
};

export default VerifyReward;
