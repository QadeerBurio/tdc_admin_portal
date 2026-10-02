// src/pages/VerifyReward.jsx
// Brand-side reward verification.
// Layout: Header → Stats cards (always visible) → Tabs (verify/history) → Content
// Rule: brand-locked codes only work at that brand · platform-wide codes work anywhere.

import React, { useState, useContext, useEffect, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import {
  FaShieldAlt,
  FaTicketAlt,
  FaSearch,
  FaCheckCircle,
  FaBan,
  FaSpinner,
  FaHistory,
  FaSync,
  FaGlobe,
  FaStore,
  FaFilter,
  FaTimes,
  FaClock,
  FaGift,
  FaMoneyBillWave,
  FaCheckDouble,
  FaHourglassHalf,
} from "react-icons/fa";

const API_BASE = "http://localhost:5000/api";
const GOLD = "#f9c349";
const GOLD_DARK = "#e0a82e";
const BLACK = "#0f0f0f";

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

  const Row = ({ label, value, mono, accent }) => (
    <div className="vr-row">
      <div className="vr-row-label">{label}</div>
      <div
        className={`vr-row-value ${mono ? "mono" : ""} ${
          accent ? "accent" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );

  // ─── Verify Content ────────────────────────────────
  const renderVerifyContent = () => (
    <div className="vr-card">
      <div className="vr-card-head">
        <div className="vr-card-icon-wrap">
          <FaTicketAlt className="vr-card-icon" />
        </div>
        <div>
          <h3 className="vr-card-title">redeem a customer code</h3>
          <p className="vr-card-sub">
            codes for your brand or platform-wide will verify
          </p>
        </div>
      </div>

      <div className="vr-input-row">
        <input
          className="vr-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="TDC-XXXX-XXXX"
          maxLength={14}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          autoFocus
        />
        <button
          className="vr-verify-btn"
          onClick={handleLookup}
          disabled={loading || !code.trim()}
        >
          {loading ? <FaSpinner className="vr-spin" /> : <FaSearch />}
          <span>{loading ? "checking" : "verify"}</span>
        </button>
      </div>

      {error && (
        <div className="vr-alert vr-alert-error">
          <FaBan />
          <div>
            <div className="vr-alert-title">not valid</div>
            <div className="vr-alert-msg">{error}</div>
          </div>
          <button className="vr-alert-close" onClick={() => setError(null)}>
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="vr-alert vr-alert-success">
          <FaCheckCircle />
          <div>
            <div className="vr-alert-title">marked as used ✓</div>
            <div className="vr-alert-msg">
              code <strong>{success.redemption?.code}</strong> — give the
              customer their reward.
            </div>
          </div>
          <button className="vr-alert-close" onClick={() => setSuccess(null)}>
            <FaTimes />
          </button>
        </div>
      )}

      {lookup && (
        <div className={`vr-result ${lookup.valid ? "valid" : "invalid"}`}>
          <div
            className={`vr-result-banner ${lookup.valid ? "ok" : "fail"}`}
          >
            <div className="vr-result-icon">
              {lookup.valid ? "✓" : "✕"}
            </div>
            <div>
              <div className="vr-result-title">
                {lookup.valid
                  ? "valid code — mark as used"
                  : lookup.reason || "invalid"}
              </div>
              <div className="vr-result-sub">
                {lookup.valid
                  ? "confirm reward then click mark as used"
                  : "code is not usable"}
              </div>
            </div>
          </div>

          {lookup.redemption && (
            <div className="vr-result-details">
              <Row label="code" value={lookup.redemption.code} mono />
              <Row
                label="reward"
                value={lookup.redemption.reward?.title || "—"}
              />

              {lookup.redemption.reward?.brand ? (
                <div className="vr-row">
                  <div className="vr-row-label">brand</div>
                  <div className="vr-row-value vr-row-brand">
                    <FaStore size={11} color={GOLD_DARK} />
                    {lookup.redemption.reward.brand}
                  </div>
                </div>
              ) : (
                <div className="vr-row">
                  <div className="vr-row-label">brand</div>
                  <div className="vr-row-value vr-row-brand vr-row-brand-globe">
                    <FaGlobe size={11} color="#64748b" />
                    platform-wide
                  </div>
                </div>
              )}

              {lookup.redemption.reward?.kind && (
                <Row
                  label="kind"
                  value={lookup.redemption.reward.kind.replace(/_/g, " ")}
                />
              )}
              {lookup.redemption.reward?.description && (
                <Row
                  label="description"
                  value={lookup.redemption.reward.description}
                />
              )}
              <Row
                label="customer"
                value={lookup.redemption.user?.name || "—"}
              />
              {lookup.redemption.user?.rollNo && (
                <Row label="roll no" value={lookup.redemption.user.rollNo} />
              )}
              {lookup.redemption.user?.email && (
                <Row label="email" value={lookup.redemption.user.email} />
              )}
              <Row
                label="points cost"
                value={`${lookup.redemption.costPoints} pts`}
              />
              <Row
                label="expires"
                value={new Date(
                  lookup.redemption.expiresAt
                ).toLocaleDateString()}
              />
              <Row
                label="status"
                value={lookup.redemption.status}
                accent={lookup.valid}
              />
            </div>
          )}

          <div className="vr-result-actions">
            <button className="vr-btn-ghost" onClick={handleReset}>
              {lookup.valid ? "cancel" : "try another"}
            </button>
            {lookup.valid && (
              <button
                className="vr-btn-success"
                onClick={handleUse}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <FaSpinner className="vr-spin" /> marking
                  </>
                ) : (
                  <>
                    <FaCheckCircle /> mark as used
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="vr-help">
        <div className="vr-help-title">how it works</div>
        <ol className="vr-help-list">
          <li>customer opens TDC app → shows code from "my rewards"</li>
          <li>type the code above → press verify</li>
          <li>
            brand-locked codes only work at that brand · platform-wide codes
            work anywhere
          </li>
          <li>give them their reward (discount / free item / perk)</li>
          <li>press "mark as used" — done</li>
        </ol>
      </div>
    </div>
  );

  // ─── History Content ───────────────────────────────
  const renderHistoryContent = () => (
    <div className="vr-history-tab">
      {/* Search + filters */}
      <div className="vr-history-toolbar">
        <div className="vr-search-wrap">
          <FaSearch className="vr-search-icon" />
          <input
            className="vr-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search by code, name, roll no, reward…"
          />
          {searchQuery && (
            <button
              className="vr-search-clear"
              onClick={() => setSearchQuery("")}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <button
          className={`vr-filter-btn ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> filters
          {statusFilter !== "all" && (
            <span className="vr-filter-badge">{statusFilter}</span>
          )}
        </button>

        <button className="vr-refresh-btn-lg" onClick={loadHistory}>
          <FaSync className={historyLoading ? "vr-spin" : ""} />
        </button>
      </div>

      {showFilters && (
        <div className="vr-filter-row">
          {["all", "active", "used", "expired", "cancelled"].map((st) => (
            <button
              key={st}
              className={`vr-chip ${
                statusFilter === st ? "vr-chip-active" : ""
              }`}
              onClick={() => setStatusFilter(st)}
            >
              <span>{st}</span>
              <span className="vr-chip-count">{statusCounts[st] || 0}</span>
            </button>
          ))}
        </div>
      )}

      {historyLoading && history.length === 0 ? (
        <div className="vr-empty-state">
          <FaSpinner className="vr-spin vr-empty-icon" />
          <div className="vr-empty-title">loading history…</div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="vr-empty-state">
          <FaHistory className="vr-empty-icon" />
          <div className="vr-empty-title">
            {history.length === 0
              ? "no redemptions yet."
              : "no results match your filters."}
          </div>
          <div className="vr-empty-sub">
            {history.length === 0
              ? "codes you verify will appear here."
              : "try clearing the search or filters."}
          </div>
        </div>
      ) : (
        <div className="vr-history-grid">
          {filteredHistory.slice(0, 100).map((r) => (
            <div key={r._id} className="vr-history-card">
              <div className="vr-history-card-top">
                <div className="vr-history-card-code">{r.code}</div>
                <span className={`vr-status vr-status-${r.status}`}>
                  {r.status}
                </span>
              </div>

              <div className="vr-history-card-user">
                <div className="vr-history-card-avatar">
                  {(r.user?.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="vr-history-card-user-info">
                  <div className="vr-history-card-name">
                    {r.user?.name || "—"}
                  </div>
                  {r.user?.rollNo && (
                    <div className="vr-history-card-roll">
                      Roll: {r.user.rollNo}
                    </div>
                  )}
                </div>
              </div>

              <div className="vr-history-card-reward">
                <FaGift size={11} />
                <span>{r.rewardTitle || "reward"}</span>
                <span className="vr-history-card-pts">
                  {r.costPoints} pts
                </span>
              </div>

              <div className="vr-history-card-footer">
                <div className="vr-history-card-date">
                  <FaClock size={10} />
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="vr-history-card-date">
                  expires{" "}
                  {new Date(r.expiresAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredHistory.length > 100 && (
        <div className="vr-history-more">
          showing 100 of {filteredHistory.length} redemptions
        </div>
      )}
    </div>
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
    <div className="vr-wrapper">
      <div className="vr-bg-1" />
      <div className="vr-bg-2" />

      {/* Header */}
      <div className="vr-header">
        <div className="vr-badge">
          <FaShieldAlt /> <span>Reward Verification</span>
        </div>
        <p className="vr-sub">
          enter the customer's code from their TDC app to redeem their reward
        </p>
      </div>

      {/* Stats — always visible */}
      {isBrand && (
        <div className="vr-stats-row">
          <StatCard
            icon={<FaGift />}
            label="total"
            value={s.total}
            color="gold"
          />
          <StatCard
            icon={<FaCheckDouble />}
            label="used"
            value={s.used}
            color="green"
          />
          <StatCard
            icon={<FaHourglassHalf />}
            label="active"
            value={s.active}
            color="blue"
          />
          <StatCard
            icon={<FaClock />}
            label="expired"
            value={s.expired}
            color="gray"
          />
          <StatCard
            icon={<FaMoneyBillWave />}
            label="points redeemed"
            value={(s.pointsLiability || 0).toLocaleString()}
            color="dark"
          />
        </div>
      )}

      {/* Tabs — verify | history */}
      {isBrand && (
        <div className="vr-tabs">
          <button
            className={`vr-tab ${activeTab === "verify" ? "vr-tab-active" : ""}`}
            onClick={() => setActiveTab("verify")}
          >
            <FaTicketAlt /> <span>verify</span>
          </button>
          <button
            className={`vr-tab ${activeTab === "history" ? "vr-tab-active" : ""}`}
            onClick={() => {
              setActiveTab("history");
              loadHistory();
            }}
          >
            <FaHistory /> <span>history</span>
            {history.length > 0 && (
              <span className="vr-tab-badge">{history.length}</span>
            )}
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === "verify" ? renderVerifyContent() : renderHistoryContent()}

      <style>{`
        .vr-wrapper {
          padding: 30px 40px;
          min-height: 85vh;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 32px;
          position: relative;
          overflow: hidden;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .vr-bg-1, .vr-bg-2 {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          pointer-events: none;
        }
        .vr-bg-1 {
          top: -100px; right: -80px;
          background: radial-gradient(circle, ${GOLD}25, transparent 70%);
        }
        .vr-bg-2 {
          bottom: -60px; left: -60px;
          background: radial-gradient(circle, ${GOLD}15, transparent 70%);
        }

        .vr-header { margin-bottom: 18px; position: relative; z-index: 1; }
        .vr-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: ${GOLD}22;
          padding: 6px 14px;
          border-radius: 40px;
          font-size: 12px;
          font-weight: 800;
          color: ${GOLD_DARK};
          margin-bottom: 12px;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .vr-title {
          font-size: 30px;
          font-weight: 900;
          color: ${BLACK};
          margin: 0;
          letter-spacing: -0.6px;
          text-transform: lowercase;
        }
        .vr-sub { font-size: 14px; color: #64748b; margin: 6px 0 0; }

        /* ─── Stats Row (always visible) ─── */
        .vr-stats-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 18px;
          position: relative;
          z-index: 1;
        }

        .vr-stat-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.2s;
        }
        .vr-stat-card:hover {
          border-color: ${GOLD};
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(15,15,15,0.06);
        }
        .vr-stat-card-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .vr-stat-card-icon.gold { background: ${GOLD}; color: ${BLACK}; }
        .vr-stat-card-icon.green { background: #10b981; color: #fff; }
        .vr-stat-card-icon.blue { background: #3b82f6; color: #fff; }
        .vr-stat-card-icon.gray { background: #f1f5f9; color: #64748b; }
        .vr-stat-card-icon.dark { background: ${BLACK}; color: ${GOLD}; }

        .vr-stat-card-value {
          font-size: 24px;
          font-weight: 900;
          color: ${BLACK};
          letter-spacing: -0.5px;
          line-height: 1;
        }
        .vr-stat-card-label {
          font-size: 10.5px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        /* ─── Tabs ─── */
        .vr-tabs {
          display: flex;
          gap: 6px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 6px;
          margin-bottom: 18px;
          position: relative;
          z-index: 1;
          width: fit-content;
        }
        .vr-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 10px;
          border: none;
          background: transparent;
          font-size: 13.5px;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: lowercase;
          position: relative;
        }
        .vr-tab:hover { color: ${BLACK}; background: #f8fafc; }
        .vr-tab-active {
          background: ${BLACK};
          color: ${GOLD};
        }
        .vr-tab-active:hover { background: ${BLACK}; color: ${GOLD}; }
        .vr-tab-badge {
          background: ${GOLD};
          color: ${BLACK};
          font-size: 10px;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 999px;
          margin-left: 4px;
        }

        /* ─── Verify Card ─── */
        .vr-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 22px;
          padding: 26px;
          position: relative;
          z-index: 1;
        }
        .vr-card-head {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 20px;
        }
        .vr-card-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: ${GOLD}22;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .vr-card-icon { font-size: 22px; color: ${GOLD_DARK}; }
        .vr-card-title {
          font-size: 20px;
          font-weight: 900;
          color: ${BLACK};
          margin: 0;
          letter-spacing: -0.4px;
          text-transform: lowercase;
        }
        .vr-card-sub { font-size: 13px; color: #64748b; margin: 6px 0 0; }

        .vr-input-row { display: flex; gap: 10px; margin-bottom: 6px; }
        .vr-input {
          flex: 1;
          padding: 16px 18px;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          font-size: 20px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 3px;
          font-weight: 800;
          outline: none;
          background: #fafbfc;
          color: ${BLACK};
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .vr-input:focus {
          border-color: ${GOLD};
          background: #fff;
          box-shadow: 0 0 0 4px ${GOLD}33;
        }
        .vr-input::placeholder { color: #cbd5e1; letter-spacing: 3px; }
        .vr-verify-btn {
          padding: 16px 28px;
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_DARK});
          border: 2px solid ${BLACK};
          border-radius: 14px;
          font-weight: 900;
          font-size: 14px;
          color: ${BLACK};
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: lowercase;
          transition: all 0.2s;
          letter-spacing: 0.3px;
          white-space: nowrap;
        }
        .vr-verify-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px ${GOLD}66;
        }
        .vr-verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Alerts */
        .vr-alert {
          margin-top: 16px;
          padding: 16px 20px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 14px;
          position: relative;
        }
        .vr-alert-error {
          background: rgba(239,68,68,0.1);
          border: 1.5px solid #ef4444;
          color: #dc2626;
        }
        .vr-alert-success {
          background: rgba(16,185,129,0.1);
          border: 1.5px solid #10b981;
          color: #059669;
        }
        .vr-alert svg { font-size: 22px; flex-shrink: 0; }
        .vr-alert-title {
          font-weight: 900;
          font-size: 15px;
          text-transform: lowercase;
          letter-spacing: -0.2px;
        }
        .vr-alert-msg { font-size: 13px; margin-top: 2px; }
        .vr-alert-close {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: currentColor;
          opacity: 0.6;
          padding: 4px;
        }
        .vr-alert-close:hover { opacity: 1; }

        /* Result */
        .vr-result {
          margin-top: 18px;
          border-radius: 18px;
          border: 2px solid;
          overflow: hidden;
          background: #fff;
        }
        .vr-result.valid { border-color: #10b981; }
        .vr-result.invalid { border-color: #ef4444; }

        .vr-result-banner {
          display: flex;
          gap: 14px;
          padding: 18px 20px;
          align-items: center;
        }
        .vr-result-banner.ok { background: #10b981; color: #fff; }
        .vr-result-banner.fail { background: #ef4444; color: #fff; }
        .vr-result-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(255,255,255,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          flex-shrink: 0;
        }
        .vr-result-title {
          font-size: 16px;
          font-weight: 900;
          text-transform: lowercase;
          letter-spacing: -0.2px;
        }
        .vr-result-sub { font-size: 12px; opacity: 0.9; margin-top: 3px; }
        .vr-result-details { padding: 18px 22px; }
        .vr-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          gap: 12px;
        }
        .vr-row:last-child { border-bottom: none; }
        .vr-row-label {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          flex-shrink: 0;
        }
        .vr-row-value {
          font-size: 14px;
          color: ${BLACK};
          font-weight: 700;
          text-align: right;
          word-break: break-word;
        }
        .vr-row-value.mono {
          font-family: ui-monospace, monospace;
          letter-spacing: 2px;
          font-weight: 900;
        }
        .vr-row-value.accent { color: #10b981; font-weight: 900; }
        .vr-row-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: flex-end;
        }
        .vr-row-brand-globe { color: #64748b; }

        .vr-result-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 16px 22px;
          background: #fafbfc;
          border-top: 1px solid #f1f5f9;
        }
        .vr-btn-ghost {
          padding: 12px 22px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          color: ${BLACK};
          text-transform: lowercase;
          transition: all 0.2s;
        }
        .vr-btn-ghost:hover { background: #f8fafc; }
        .vr-btn-success {
          padding: 12px 26px;
          background: #10b981;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-weight: 900;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: lowercase;
          letter-spacing: 0.3px;
          transition: all 0.2s;
        }
        .vr-btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(16,185,129,0.35);
        }
        .vr-btn-success:disabled { opacity: 0.6; cursor: not-allowed; }

        .vr-help {
          margin-top: 22px;
          padding: 18px 20px;
          background: ${GOLD}15;
          border: 1.5px dashed ${GOLD};
          border-radius: 16px;
        }
        .vr-help-title {
          font-size: 11px;
          font-weight: 900;
          color: ${BLACK};
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 10px;
        }
        .vr-help-list {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          color: ${BLACK};
          line-height: 1.9;
        }

        /* ─── History Tab ─── */
        .vr-history-tab { position: relative; z-index: 1; }

        .vr-history-toolbar {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
          align-items: center;
          flex-wrap: wrap;
        }
        .vr-search-wrap {
          flex: 1;
          min-width: 220px;
          position: relative;
          display: flex;
          align-items: center;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0 14px;
          transition: all 0.2s;
        }
        .vr-search-wrap:focus-within {
          border-color: ${GOLD};
          box-shadow: 0 0 0 4px ${GOLD}22;
        }
        .vr-search-icon {
          color: #94a3b8;
          font-size: 13px;
          margin-right: 10px;
          flex-shrink: 0;
        }
        .vr-search-input {
          flex: 1;
          padding: 13px 0;
          border: none;
          background: transparent;
          font-size: 13.5px;
          outline: none;
          color: ${BLACK};
          font-family: inherit;
        }
        .vr-search-clear {
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .vr-search-clear:hover { color: ${BLACK}; }

        .vr-filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 13px 18px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          color: ${BLACK};
          text-transform: lowercase;
          transition: all 0.2s;
        }
        .vr-filter-btn:hover { background: #f8fafc; }
        .vr-filter-btn.active {
          background: ${GOLD}22;
          border-color: ${GOLD};
        }
        .vr-filter-badge {
          background: ${BLACK};
          color: ${GOLD};
          font-size: 10px;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .vr-refresh-btn-lg {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          color: ${BLACK};
          transition: all 0.2s;
        }
        .vr-refresh-btn-lg:hover {
          background: ${BLACK};
          color: ${GOLD};
          border-color: ${BLACK};
        }

        .vr-filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          padding: 12px;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
        }
        .vr-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #f8fafc;
          border: 1.5px solid transparent;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 800;
          color: #64748b;
          cursor: pointer;
          text-transform: lowercase;
          transition: all 0.2s;
        }
        .vr-chip:hover { background: #f1f5f9; color: ${BLACK}; }
        .vr-chip-active {
          background: ${BLACK};
          color: ${GOLD};
          border-color: ${BLACK};
        }
        .vr-chip-active:hover { background: ${BLACK}; color: ${GOLD}; }
        .vr-chip-count {
          background: rgba(15,15,15,0.08);
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
        }
        .vr-chip-active .vr-chip-count {
          background: ${GOLD};
          color: ${BLACK};
        }

        .vr-history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .vr-history-card {
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s;
        }
        .vr-history-card:hover {
          border-color: ${GOLD};
          box-shadow: 0 4px 16px rgba(15,15,15,0.06);
          transform: translateY(-2px);
        }
        .vr-history-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .vr-history-card-code {
          font-family: ui-monospace, monospace;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 1px;
          color: ${BLACK};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vr-history-card-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-top: 1px dashed #f1f5f9;
          border-bottom: 1px dashed #f1f5f9;
        }
        .vr-history-card-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${GOLD}, ${GOLD_DARK});
          color: ${BLACK};
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 14px;
          flex-shrink: 0;
        }
        .vr-history-card-user-info { flex: 1; min-width: 0; }
        .vr-history-card-name {
          font-size: 13px;
          font-weight: 800;
          color: ${BLACK};
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vr-history-card-roll {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }

        .vr-history-card-reward {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: ${BLACK};
          font-weight: 700;
        }
        .vr-history-card-reward svg { color: ${GOLD_DARK}; flex-shrink: 0; }
        .vr-history-card-reward span:first-of-type {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .vr-history-card-pts {
          background: ${BLACK};
          color: ${GOLD};
          padding: 3px 9px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .vr-history-card-footer {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 10.5px;
          color: #94a3b8;
          font-weight: 600;
        }
        .vr-history-card-date {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .vr-history-more {
          text-align: center;
          padding: 16px;
          font-size: 12px;
          color: #94a3b8;
          font-weight: 700;
        }

        .vr-status {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: inline-block;
          flex-shrink: 0;
        }
        .vr-status-active { background: ${GOLD}; color: ${BLACK}; }
        .vr-status-used { background: #10b981; color: #fff; }
        .vr-status-expired { background: #f1f5f9; color: #64748b; }
        .vr-status-cancelled { background: #fee2e2; color: #dc2626; }

        /* Empty state */
        .vr-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: #fff;
          border: 1.5px dashed #e2e8f0;
          border-radius: 18px;
          text-align: center;
          gap: 12px;
        }
        .vr-empty-icon {
          font-size: 42px;
          color: #cbd5e1;
        }
        .vr-empty-title {
          font-size: 16px;
          font-weight: 900;
          color: ${BLACK};
          text-transform: lowercase;
        }
        .vr-empty-sub {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 600;
        }

        /* Spinner */
        .vr-spin { animation: vr-spin 1s linear infinite; }
        @keyframes vr-spin { to { transform: rotate(360deg); } }

        /* Mobile */
        @media (max-width: 1024px) {
          .vr-stats-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 768px) {
          .vr-wrapper { padding: 16px 20px; border-radius: 20px; }
          .vr-title { font-size: 22px; }
          .vr-stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .vr-stat-card { padding: 12px; }
          .vr-stat-card-value { font-size: 20px; }
          .vr-tabs { width: 100%; }
          .vr-tab { flex: 1; justify-content: center; padding: 10px 12px; font-size: 12px; }
          .vr-input-row { flex-direction: column; }
          .vr-input { font-size: 16px; letter-spacing: 2px; }
          .vr-verify-btn { justify-content: center; }
          .vr-card { padding: 20px; }
          .vr-history-grid { grid-template-columns: 1fr; }
          .vr-history-toolbar { flex-direction: column; align-items: stretch; }
          .vr-search-wrap { min-width: 100%; }
          .vr-filter-btn, .vr-refresh-btn-lg { width: 100%; justify-content: center; }
          .vr-filter-row { overflow-x: auto; flex-wrap: nowrap; }
        }
        @media (max-width: 480px) {
          .vr-wrapper { padding: 12px 14px; }
          .vr-stats-row { grid-template-columns: repeat(2, 1fr); }
          .vr-stat-card-value { font-size: 18px; }
          .vr-card-head { flex-direction: column; gap: 6px; }
          .vr-result-actions { flex-direction: column; }
          .vr-btn-ghost, .vr-btn-success { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

// ─── Stat Card ──────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="vr-stat-card">
    <div className={`vr-stat-card-icon ${color || "gold"}`}>{icon}</div>
    <div className="vr-stat-card-value">{value}</div>
    <div className="vr-stat-card-label">{label}</div>
    {sub && <div className="vr-stat-card-sub">{sub}</div>}
  </div>
);

export default VerifyReward;