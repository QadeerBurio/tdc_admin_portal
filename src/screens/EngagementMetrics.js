// src/screens/EngagementMetrics.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { engagementApi } from '../services/api';

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
const GOLD = '#f9c349';
const GOLD_DARK = '#e0a82e';
const GOLD_LIGHT = '#fffbee';
const BLACK = '#0f172a';
const MUTED = '#64748b';
const BORDER = '#f1f5f9';
const DANGER = '#ef4444';
const SUCCESS = '#10b981';
const INFO = '#3b82f6';
const PURPLE = '#8b5cf6';
const PINK = '#ec4899';
const ORANGE = '#f97316';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-US');
const fmtPct = (n, digits = 0) => `${Number(n || 0).toFixed(digits)}%`;
const timeAgo = (date) => {
  if (!date) return 'never';
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

// ═════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════
export default function EngagementMetrics() {
  const [data, setData] = useState(null);
  const [weeks, setWeeks] = useState(() => {
    const stored = localStorage.getItem('metrics_weeks');
    return stored ? Number(stored) : 8;
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const isMountedRef = useRef(true);

  // ── Drill-down state ──
  const [drilldown, setDrilldown] = useState(null);
  // drilldown = { kind: 'event' | 'mission' | 'level' | 'badge' | 'week' | 'metric', key, label, users: [], loading }

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await engagementApi.metrics(weeks);
        console.log('[Metrics] ✅ data:', res);
        if (!isMountedRef.current) return;
        setData(res);
        setLastUpdated(new Date());
      } catch (e) {
        console.error('[Metrics] fetch error:', e);
        if (!isMountedRef.current) return;
        setError(
          e?.response?.data?.message || e?.message || 'failed to load metrics'
        );
        setData(null);
      } finally {
        if (!isMountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [weeks]
  );

  useEffect(() => {
    isMountedRef.current = true;
    load(false);
    return () => {
      isMountedRef.current = false;
    };
  }, [load]);

  useEffect(() => {
    localStorage.setItem('metrics_weeks', String(weeks));
  }, [weeks]);

  // Auto-refresh on tab visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && data) {
        if (!lastUpdated || Date.now() - lastUpdated.getTime() > 60_000) {
          load(true);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [data, lastUpdated, load]);

  // ── Drill-down helper: fetch users for any metric ──
  const openDrilldown = useCallback(
    async (kind, key, label) => {
      setDrilldown({ kind, key, label, users: [], loading: true, error: null });
      try {
        const res = await engagementApi.drilldown({ kind, key, weeks });
        setDrilldown((prev) =>
          prev ? { ...prev, users: res.items || [], loading: false } : null
        );
      } catch (e) {
        console.error('[Metrics] drilldown error:', e);
        setDrilldown((prev) =>
          prev
            ? {
                ...prev,
                loading: false,
                error: e?.response?.data?.message || e.message,
              }
            : null
        );
      }
    },
    [weeks]
  );

  const closeDrilldown = () => setDrilldown(null);

  // ═════════════════════════════════════════════
  // LOADING
  // ═════════════════════════════════════════════
  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>metrics</h2>
            <p style={s.subtitle}>loading engagement data...</p>
          </div>
        </div>
        <div style={s.loadingWrap}>
          <div style={s.spinner} />
          <span style={s.loadingText}>fetching metrics…</span>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════
  // ERROR
  // ═════════════════════════════════════════════
  if (error) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>metrics</h2>
            <p style={s.subtitle}>something went wrong</p>
          </div>
        </div>
        <div style={s.errorCard}>
          <div style={s.errorIcon}>⚠</div>
          <h3 style={s.errorTitle}>could not load metrics</h3>
          <p style={s.errorMessage}>{error}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button style={s.retryBtn} onClick={() => load(false)}>
              try again
            </button>
            <button
              style={{
                ...s.retryBtn,
                background: '#fff',
                border: `1.5px solid ${BORDER}`,
                color: BLACK,
              }}
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}
            >
              re-login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════
  // EMPTY
  // ═════════════════════════════════════════════
  if (!data) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div>
            <h2 style={s.title}>metrics</h2>
            <p style={s.subtitle}>no data available</p>
          </div>
        </div>
        <div style={s.emptyCard}>
          <div style={s.emptyIcon}>📊</div>
          <h3 style={s.emptyTitle}>nothing to show yet</h3>
          <p style={s.emptyMessage}>
            metrics will appear once users start engaging
          </p>
          <button
            style={{ ...s.retryBtn, marginTop: 20 }}
            onClick={() => load(false)}
          >
            refresh
          </button>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════
  // STAT CARDS
  // ═════════════════════════════════════════════
  const primaryStats = [
    { label: 'total profiles', value: fmt(data.totalProfiles), icon: '👥', color: GOLD_DARK, sub: 'users with profiles', drill: { kind: 'metric', key: 'totalProfiles' } },
    { label: 'active users', value: fmt(data.activeUsers), icon: '⚡', color: SUCCESS, sub: 'active in last 30d', drill: { kind: 'metric', key: 'activeUsers' } },
    { label: 'total points', value: fmt(data.totalPointsAwarded), icon: '🪙', color: ORANGE, sub: 'points awarded', drill: { kind: 'metric', key: 'totalPointsAwarded' } },
    { label: 'badges earned', value: fmt(data.badgesEarned), icon: '🏆', color: PURPLE, sub: 'unlocks in period', drill: { kind: 'metric', key: 'badgesEarned' } },
    { label: 'push sent', value: fmt(data.pushSent), icon: '📤', color: INFO, sub: 'notifications sent', drill: { kind: 'metric', key: 'pushSent' } },
    { label: 'push open rate', value: fmtPct((data.pushOpenRate || 0) * 100), icon: '📈', color: SUCCESS, sub: `${fmt(data.pushOpened)} opened`, drill: { kind: 'metric', key: 'pushOpened' } },
    { label: 'rewards redeemed', value: fmt(data.rewardsRedeemed), icon: '🎁', color: PINK, sub: 'codes issued', drill: { kind: 'metric', key: 'rewardsRedeemed' } },
    { label: 'total drops', value: fmt(data.totalDrops), icon: '🌙', color: GOLD_DARK, sub: `${fmt(data.totalDropReactions)} reactions`, drill: { kind: 'metric', key: 'totalDrops' } },
  ];

  const secondaryStats = [
    { label: 'fully sorted', value: fmt(data.fullySortedCount), icon: '✅', color: SUCCESS, sub: 'completed all 8', drill: { kind: 'metric', key: 'fullySortedCount' } },
    { label: 'streak average', value: (data.avgStreak ?? 0).toFixed(1), icon: '🔥', color: ORANGE, sub: `longest: ${data.longestStreak ?? 0}d`, drill: { kind: 'metric', key: 'streaks' } },
    { label: 'exam mode active', value: fmt(data.examModeActive), icon: '📚', color: INFO, sub: 'paused', drill: { kind: 'metric', key: 'examModeActive' } },
    { label: 'referrals', value: fmt(data.totalReferrals), icon: '🤝', color: PINK, sub: 'users invited', drill: { kind: 'metric', key: 'totalReferrals' } },
  ];

  // ═════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════
  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>metrics</h2>
          <p style={s.subtitle}>
            click any number to see the exact users ·{' '}
            {lastUpdated ? `updated ${timeAgo(lastUpdated)}` : 'never'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            style={{
              ...s.select,
              cursor: refreshing ? 'wait' : 'pointer',
              opacity: refreshing ? 0.6 : 1,
            }}
            onClick={() => load(true)}
            disabled={refreshing}
          >
            {refreshing ? 'refreshing…' : 'refresh'}
          </button>
          <select
            style={s.select}
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
          >
            {[4, 8, 12, 26].map((w) => (
              <option key={w} value={w}>
                last {w} weeks
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── PRIMARY STAT GRID ── */}
      <div style={s.grid}>
        {primaryStats.map((c, i) => (
          <StatCard
            key={i}
            {...c}
            onClick={() => openDrilldown(c.drill.kind, c.drill.key, c.label)}
          />
        ))}
      </div>

      {/* ── SECONDARY STAT GRID ── */}
      <div style={s.grid}>
        {secondaryStats.map((c, i) => (
          <StatCard
            key={i}
            {...c}
            onClick={() => openDrilldown(c.drill.kind, c.drill.key, c.label)}
          />
        ))}
      </div>

      {/* ── WEEKLY ACTIVE USERS ── */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div>
            <h3 style={s.cardTitle}>weekly active users</h3>
            <p style={s.cardSub}>click a week to see who was active</p>
          </div>
          <span style={s.cardBadge}>
            {data.weeklyUsers?.length || 0} weeks
          </span>
        </div>

        {data.weeklyUsers && data.weeklyUsers.length > 0 ? (
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>WEEK</th>
                <th style={s.th}>YEAR</th>
                <th style={{ ...s.th, textAlign: 'right' }}>USERS</th>
              </tr>
            </thead>
            <tbody>
              {data.weeklyUsers.map((w, i) => (
                <tr
                  key={i}
                  style={s.trClickable}
                  onClick={() =>
                    openDrilldown(
                      'week',
                      `${w._id?.year}-W${w._id?.week}`,
                      `week ${w._id?.week} · ${w._id?.year}`
                    )
                  }
                >
                  <td style={s.td}>
                    <span style={s.weekChip}>
                      W{String(w._id?.week || 0).padStart(2, '0')}
                    </span>
                  </td>
                  <td style={s.td}>{w._id?.year || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <span style={s.userCount}>{fmt(w.users)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={s.emptyTable}>no weekly data yet.</div>
        )}
      </div>

      {/* ── MISSION BREAKDOWN ── */}
      {data.missionBreakdown && Object.keys(data.missionBreakdown).length > 0 && (
        <div style={{ ...s.card, marginTop: 20 }}>
          <div style={s.cardHeader}>
            <div>
              <h3 style={s.cardTitle}>mission breakdown</h3>
              <p style={s.cardSub}>
                click a mission to see which users sorted it
              </p>
            </div>
            <span style={s.cardBadge}>
              {Object.keys(data.missionBreakdown).length} missions
            </span>
          </div>

          <div style={s.missionGrid}>
            {Object.entries(data.missionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([feature, count]) => {
                const pct = data.totalProfiles
                  ? Math.round((count / data.totalProfiles) * 100)
                  : 0;
                return (
                  <div
                    key={feature}
                    style={s.missionRow}
                    onClick={() =>
                      openDrilldown('mission', feature, `${feature.replace(/_/g, ' ')} sorted`)
                    }
                  >
                    <div style={s.missionHeader}>
                      <span style={s.missionName}>
                        {feature.replace(/_/g, ' ')}
                      </span>
                      <span style={s.missionCount}>
                        {fmt(count)}{' '}
                        <span style={s.missionPct}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={s.missionBarTrack}>
                      <div
                        style={{
                          ...s.missionBarFill,
                          width: `${Math.min(pct, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── LEVEL BREAKDOWN ── */}
      {data.levelBreakdown && Object.keys(data.levelBreakdown).length > 0 && (
        <div style={{ ...s.card, marginTop: 20 }}>
          <div style={s.cardHeader}>
            <div>
              <h3 style={s.cardTitle}>level breakdown</h3>
              <p style={s.cardSub}>click a level to see who's in it</p>
            </div>
            <span style={s.cardBadge}>
              {Object.keys(data.levelBreakdown).length} levels
            </span>
          </div>

          <div style={s.levelGrid}>
            {Object.entries(data.levelBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([levelId, count], idx) => {
                const colors = [GOLD_DARK, ORANGE, PINK, PURPLE, INFO, SUCCESS];
                const color = colors[idx % colors.length];
                return (
                  <div
                    key={levelId}
                    style={{
                      ...s.levelCard,
                      borderColor: color + '40',
                      background: color + '08',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      openDrilldown('level', levelId, `${levelId.replace(/_/g, ' ')} level`)
                    }
                  >
                    <div style={{ ...s.levelDot, backgroundColor: color }} />
                    <div style={s.levelName}>{levelId.replace(/_/g, ' ')}</div>
                    <div style={s.levelCount}>{fmt(count)}</div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── TOP BADGES ── */}
      {data.topBadges && data.topBadges.length > 0 && (
        <div style={{ ...s.card, marginTop: 20 }}>
          <div style={s.cardHeader}>
            <div>
              <h3 style={s.cardTitle}>top badges</h3>
              <p style={s.cardSub}>click a badge to see who earned it</p>
            </div>
            <span style={s.cardBadge}>
              top {Math.min(data.topBadges.length, 10)}
            </span>
          </div>

          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>BADGE</th>
                <th style={{ ...s.th, textAlign: 'right' }}>EARNED</th>
              </tr>
            </thead>
            <tbody>
              {data.topBadges.slice(0, 10).map((b, i) => (
                <tr
                  key={b.badgeId || i}
                  style={s.trClickable}
                  onClick={() =>
                    openDrilldown(
                      'badge',
                      b.badgeId,
                      `${(b.badgeId || '').replace(/_/g, ' ')} earned`
                    )
                  }
                >
                  <td style={s.td}>
                    <span style={s.weekChip}>
                      {(b.badgeId || 'unknown').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <span style={s.userCount}>{fmt(b.count)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── EVENT BREAKDOWN ── */}
      {data.eventBreakdown && Object.keys(data.eventBreakdown).length > 0 && (
        <div style={{ ...s.card, marginTop: 20 }}>
          <div style={s.cardHeader}>
            <div>
              <h3 style={s.cardTitle}>event breakdown</h3>
              <p style={s.cardSub}>
                click an event to see every user who triggered it
              </p>
            </div>
            <span style={s.cardBadge}>
              {Object.keys(data.eventBreakdown).length} types
            </span>
          </div>

          <div style={s.eventGrid}>
            {Object.entries(data.eventBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([eventName, count]) => (
                <div
                  key={eventName}
                  style={{ ...s.eventRow, cursor: 'pointer' }}
                  onClick={() =>
                    openDrilldown(
                      'event',
                      eventName,
                      `${eventName.replace(/_/g, ' ')} events`
                    )
                  }
                >
                  <span style={s.eventName}>
                    {eventName.replace(/_/g, ' ')}
                  </span>
                  <span style={s.eventCount}>{fmt(count)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={s.footer}>
        <span style={s.footerText}>
          metrics computed from events + profiles ·{' '}
          {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'never'}
        </span>
      </div>

      {/* ── DRILL-DOWN MODAL ── */}
      {drilldown && (
        <DrilldownModal
          data={drilldown}
          onClose={closeDrilldown}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════
// STAT CARD (clickable)
// ═════════════════════════════════════════════
function StatCard({ label, value, icon, color, sub, onClick }) {
  return (
    <div
      style={{ ...s.statCard, cursor: 'pointer' }}
      onClick={onClick}
      title="click to see users"
    >
      <div style={s.statTop}>
        <div
          style={{
            ...s.statIconBox,
            backgroundColor: color + '15',
          }}
        >
          <span style={s.statIcon}>{icon}</span>
        </div>
        <div style={s.statLabel}>{label}</div>
        <div style={s.statArrow}>›</div>
      </div>
      <div style={s.statValue}>{value}</div>
      {sub && <div style={s.statSub}>{sub}</div>}
    </div>
  );
}

// ═════════════════════════════════════════════
// DRILL-DOWN MODAL
// ═════════════════════════════════════════════
function DrilldownModal({ data, onClose }) {
  const { kind, key, label, users, loading, error } = data;

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={s.modalBackdrop} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={s.modalHeader}>
          <div>
            <div style={s.modalKind}>{kind}</div>
            <h3 style={s.modalTitle}>{label}</h3>
            <p style={s.modalSub}>
              {loading
                ? 'loading users…'
                : `${users.length} user${users.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button style={s.modalClose} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div style={s.modalBody}>
          {loading ? (
            <div style={s.modalLoading}>
              <div style={s.spinner} />
              <span style={s.modalLoadingText}>fetching users…</span>
            </div>
          ) : error ? (
            <div style={s.modalError}>⚠ {error}</div>
          ) : users.length === 0 ? (
            <div style={s.modalEmpty}>no users found for this metric.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>user</th>
                  <th style={s.th}>role</th>
                  <th style={s.th}>detail</th>
                  <th style={s.th}>when</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 200).map((u, i) => (
                  <tr key={u._id || u.userId || i} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.userCell}>
                        <div style={s.avatarSm}>
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={s.userName}>{u.name || 'unknown'}</div>
                          <div style={s.userEmail}>
                            {u.email || u.rollNo || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={s.td}>
                      {u.role ? (
                        <span style={s.typeTag}>{u.role}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={s.td}>
                      <span style={s.detailText}>
                        {u.detail || u.meta || '—'}
                      </span>
                    </td>
                    <td style={s.td}>
                      <span style={s.mutedText}>
                        {u.when ? timeAgo(u.when) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {users.length > 200 && (
            <div style={s.modalFoot}>
              showing first 200 of {users.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = {
  page: { padding: 0 },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 16,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 26,
    fontWeight: 900,
    color: BLACK,
    margin: 0,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    margin: '4px 0 0 0',
    fontWeight: 500,
  },
  select: {
    padding: '10px 16px',
    border: `2px solid ${BORDER}`,
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    background: '#fff',
    cursor: 'pointer',
    outline: 'none',
    color: BLACK,
    textTransform: 'lowercase',
  },

  // Loading
  loadingWrap: {
    padding: '80px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  spinner: {
    width: 32,
    height: 32,
    border: `3px solid ${BORDER}`,
    borderTopColor: GOLD,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: 600,
    textTransform: 'lowercase',
  },

  // Error
  errorCard: {
    backgroundColor: '#fef2f2',
    border: `1.5px solid ${DANGER}30`,
    borderRadius: 16,
    padding: 32,
    textAlign: 'center',
    maxWidth: 480,
    margin: '0 auto',
  },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: DANGER,
    margin: '0 0 6px 0',
    textTransform: 'lowercase',
  },
  errorMessage: {
    fontSize: 13,
    color: '#991b1b',
    margin: '0 0 20px 0',
    lineHeight: 20,
    wordBreak: 'break-word',
  },
  retryBtn: {
    padding: '10px 24px',
    background: GOLD,
    border: 'none',
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    color: BLACK,
    textTransform: 'lowercase',
  },

  // Empty
  emptyCard: {
    backgroundColor: '#fff',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 16,
    padding: 48,
    textAlign: 'center',
    maxWidth: 480,
    margin: '0 auto',
  },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: BLACK,
    margin: '0 0 6px 0',
    textTransform: 'lowercase',
  },
  emptyMessage: {
    fontSize: 13,
    color: MUTED,
    margin: 0,
    lineHeight: 20,
  },

  // Stat grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    background: '#fff',
    borderRadius: 16,
    padding: 20,
    border: `1.5px solid ${BORDER}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    transition: 'all 0.15s',
  },
  statTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statIcon: { fontSize: 18 },
  statLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: MUTED,
    textTransform: 'lowercase',
    letterSpacing: 0.3,
    flex: 1,
  },
  statArrow: {
    fontSize: 20,
    color: BORDER,
    fontWeight: 700,
    lineHeight: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 900,
    color: BLACK,
    letterSpacing: -0.8,
  },
  statSub: {
    fontSize: 11,
    color: MUTED,
    fontWeight: 500,
    marginTop: 4,
    textTransform: 'lowercase',
  },

  // Card
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    border: `1.5px solid ${BORDER}`,
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 800,
    color: BLACK,
    margin: 0,
    textTransform: 'lowercase',
    letterSpacing: -0.2,
  },
  cardSub: {
    fontSize: 12,
    color: MUTED,
    margin: '4px 0 0 0',
    fontWeight: 500,
  },
  cardBadge: {
    padding: '4px 10px',
    background: GOLD_LIGHT,
    color: GOLD_DARK,
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'lowercase',
    border: `1px solid ${GOLD}40`,
  },

  // Table
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#fafbfc' },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 11,
    fontWeight: 800,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: `1.5px solid ${BORDER}`,
  },
  tr: { borderBottom: `1px solid ${BORDER}` },
  trClickable: {
    borderBottom: `1px solid ${BORDER}`,
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  td: {
    padding: '14px 16px',
    fontSize: 13,
    color: BLACK,
    fontWeight: 600,
  },
  weekChip: {
    display: 'inline-block',
    padding: '4px 10px',
    background: GOLD_LIGHT,
    color: GOLD_DARK,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    border: `1px solid ${GOLD}40`,
    textTransform: 'lowercase',
  },
  userCount: {
    display: 'inline-block',
    padding: '4px 12px',
    background: '#10b98115',
    color: '#059669',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 900,
    minWidth: 48,
    textAlign: 'center',
  },
  emptyTable: {
    padding: '60px 20px',
    textAlign: 'center',
    color: MUTED,
    fontSize: 13,
    fontWeight: 500,
    textTransform: 'lowercase',
  },

  // Mission breakdown
  missionGrid: { display: 'flex', flexDirection: 'column', gap: 14 },
  missionRow: {
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: 10,
    transition: 'background 0.15s',
  },
  missionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  missionName: {
    fontSize: 13,
    fontWeight: 700,
    color: BLACK,
    textTransform: 'lowercase',
  },
  missionCount: { fontSize: 13, fontWeight: 900, color: BLACK },
  missionPct: { fontSize: 11, color: MUTED, fontWeight: 600 },
  missionBarTrack: {
    height: 8,
    background: BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  missionBarFill: {
    height: '100%',
    background: GOLD,
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },

  // Level breakdown
  levelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  levelCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '14px 16px',
    borderRadius: 12,
    border: '1.5px solid',
    transition: 'all 0.15s',
  },
  levelDot: { width: 10, height: 10, borderRadius: 5 },
  levelName: {
    fontSize: 13,
    fontWeight: 800,
    color: BLACK,
    textTransform: 'lowercase',
    flex: 1,
  },
  levelCount: { fontSize: 18, fontWeight: 900, color: BLACK },

  // Event breakdown
  eventGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 10,
  },
  eventRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#fafbfc',
    borderRadius: 10,
    border: `1px solid ${BORDER}`,
    transition: 'all 0.15s',
  },
  eventName: {
    fontSize: 12.5,
    fontWeight: 700,
    color: BLACK,
    textTransform: 'lowercase',
  },
  eventCount: {
    fontSize: 13,
    fontWeight: 900,
    color: GOLD_DARK,
    background: GOLD_LIGHT,
    padding: '2px 10px',
    borderRadius: 8,
    border: `1px solid ${GOLD}40`,
  },

  // Footer
  footer: { textAlign: 'center', padding: '30px 0 10px' },
  footerText: {
    fontSize: 11,
    color: MUTED,
    fontWeight: 500,
    textTransform: 'lowercase',
  },

  // ── MODAL ──
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 9999,
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 900,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: `1.5px solid ${BORDER}`,
    gap: 16,
  },
  modalKind: {
    fontSize: 10,
    fontWeight: 900,
    color: GOLD_DARK,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: BLACK,
    margin: 0,
    textTransform: 'lowercase',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 12,
    color: MUTED,
    margin: '4px 0 0 0',
    fontWeight: 500,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 12,
    background: '#f1f5f9',
    border: 'none',
    cursor: 'pointer',
    fontSize: 22,
    color: MUTED,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: 0,
  },
  modalLoading: {
    padding: 60,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  modalLoadingText: {
    fontSize: 12,
    color: MUTED,
    fontWeight: 600,
    textTransform: 'lowercase',
  },
  modalError: {
    padding: 40,
    textAlign: 'center',
    color: DANGER,
    fontWeight: 700,
    background: DANGER + '08',
    margin: 24,
    borderRadius: 12,
  },
  modalEmpty: {
    padding: 60,
    textAlign: 'center',
    color: MUTED,
    fontSize: 13,
    fontWeight: 500,
    textTransform: 'lowercase',
  },
  modalFoot: {
    padding: '14px 24px',
    textAlign: 'center',
    fontSize: 11,
    color: MUTED,
    fontWeight: 600,
    background: '#fafbfc',
    borderTop: `1.5px solid ${BORDER}`,
    textTransform: 'lowercase',
  },

  // User row
  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  userName: { fontSize: 13, fontWeight: 700, color: BLACK },
  userEmail: { fontSize: 11, color: MUTED, marginTop: 1 },
  avatarSm: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: BLACK,
    color: GOLD,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 900,
    flexShrink: 0,
  },
  typeTag: {
    padding: '3px 8px',
    background: PURPLE + '15',
    color: PURPLE,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'lowercase',
  },
  detailText: { fontSize: 12, color: BLACK, fontWeight: 600 },
  mutedText: { color: MUTED, fontWeight: 500, fontSize: 12 },
};

// Spinner keyframes
if (
  typeof document !== 'undefined' &&
  !document.getElementById('__tdc_metrics_spin__')
) {
  const styleEl = document.createElement('style');
  styleEl.id = '__tdc_metrics_spin__';
  styleEl.innerHTML = `
    @keyframes spin { to { transform: rotate(360deg); } }
    div[style*="cursor: pointer"]:hover { background: #fafbfc; }
  `;
  document.head.appendChild(styleEl);
}