// src/screens/EngagementMetrics.js
// Engagement metrics (design/portal/AdMetrics): are students coming back? Every number opens the users behind it.
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { engagementApi } from '../services/api';
import Ico from '../portal/Ico';
import { PageHeader, PageLoading, Button, Select, StatCard, Card, Table, EmptyState, Modal, Pill } from '../portal/kit';
import './styles/EngagementMetrics.css';

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

const LEVEL_TONES = ['yellow', 'orange', 'pink', 'purple', 'blue', 'green'];

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

  const header = (sub, actions) => <PageHeader title="engagement" sub={sub} actions={actions} />;

  // ═════════════════════════════════════════════
  // LOADING
  // ═════════════════════════════════════════════
  if (loading) {
    return (
      <div className="tdcp k-page">
        {header('loading engagement data...')}
        <PageLoading label="fetching metrics…" />
      </div>
    );
  }

  // ═════════════════════════════════════════════
  // ERROR
  // ═════════════════════════════════════════════
  if (error) {
    return (
      <div className="tdcp k-page">
        {header('something went wrong')}
        <div className="k-card">
          <EmptyState
            icon="alert"
            tone="red"
            title="could not load metrics"
            text={error}
            action={
              <div className="k-row" style={{ justifyContent: 'center' }}>
                <Button onClick={() => load(false)}>try again</Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }}
                >
                  re-login
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════
  // EMPTY
  // ═════════════════════════════════════════════
  if (!data) {
    return (
      <div className="tdcp k-page">
        {header('no data available')}
        <div className="k-card">
          <EmptyState icon="chart" title="nothing to show yet" text="metrics will appear once users start engaging" action={<Button onClick={() => load(false)}>refresh</Button>} />
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════
  // STAT CARDS
  // ═════════════════════════════════════════════
  const primaryStats = [
    { label: 'total profiles', value: fmt(data.totalProfiles), icon: 'users', tone: 'yellow', sub: 'users with profiles', drill: { kind: 'metric', key: 'totalProfiles' } },
    { label: 'active users', value: fmt(data.activeUsers), icon: 'flame', tone: 'green', sub: 'active in last 30d', drill: { kind: 'metric', key: 'activeUsers' } },
    { label: 'total points', value: fmt(data.totalPointsAwarded), icon: 'coin', tone: 'orange', sub: 'points awarded', drill: { kind: 'metric', key: 'totalPointsAwarded' } },
    { label: 'badges earned', value: fmt(data.badgesEarned), icon: 'trophy', tone: 'purple', sub: 'unlocks in period', drill: { kind: 'metric', key: 'badgesEarned' } },
    { label: 'push sent', value: fmt(data.pushSent), icon: 'send', tone: 'blue', sub: 'notifications sent', drill: { kind: 'metric', key: 'pushSent' } },
    { label: 'push open rate', value: fmtPct((data.pushOpenRate || 0) * 100), icon: 'chart', tone: 'green', sub: `${fmt(data.pushOpened)} opened`, drill: { kind: 'metric', key: 'pushOpened' } },
    { label: 'rewards redeemed', value: fmt(data.rewardsRedeemed), icon: 'gift', tone: 'pink', sub: 'codes issued', drill: { kind: 'metric', key: 'rewardsRedeemed' } },
    { label: 'total drops', value: fmt(data.totalDrops), icon: 'spark', tone: 'yellow', sub: `${fmt(data.totalDropReactions)} reactions`, drill: { kind: 'metric', key: 'totalDrops' } },
  ];

  const secondaryStats = [
    { label: 'fully sorted', value: fmt(data.fullySortedCount), icon: 'checkCircle', tone: 'green', sub: 'completed all 8', drill: { kind: 'metric', key: 'fullySortedCount' } },
    { label: 'streak average', value: (data.avgStreak ?? 0).toFixed(1), icon: 'flame', tone: 'orange', sub: `longest: ${data.longestStreak ?? 0}d`, drill: { kind: 'metric', key: 'streaks' } },
    { label: 'exam mode active', value: fmt(data.examModeActive), icon: 'file', tone: 'blue', sub: 'paused', drill: { kind: 'metric', key: 'examModeActive' } },
    { label: 'referrals', value: fmt(data.totalReferrals), icon: 'link', tone: 'pink', sub: 'users invited', drill: { kind: 'metric', key: 'totalReferrals' } },
  ];

  const badge = (text) => <Pill tone="sand">{text}</Pill>;

  // ═════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════
  return (
    <div className="tdcp k-page em" data-screen="metrics">
      {header(
        <>
          are students coming back? goal: 2 to 3 opens a day. click any number to see the exact users ·{' '}
          {lastUpdated ? `updated ${timeAgo(lastUpdated)}` : 'never'}
        </>,
        <>
          <Button variant="secondary" icon="refresh" onClick={() => load(true)} loading={refreshing}>
            {refreshing ? 'refreshing…' : 'refresh'}
          </Button>
          <Select aria-label="period" style={{ width: 'auto' }} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
            {[4, 8, 12, 26].map((w) => (
              <option key={w} value={w}>
                last {w} weeks
              </option>
            ))}
          </Select>
        </>
      )}

      <div className="k-stats em-stats">
        {primaryStats.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} sub={c.sub} icon={c.icon} tone={c.tone} onClick={() => openDrilldown(c.drill.kind, c.drill.key, c.label)} />
        ))}
      </div>
      <div className="k-stats em-stats">
        {secondaryStats.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} sub={c.sub} icon={c.icon} tone={c.tone} onClick={() => openDrilldown(c.drill.kind, c.drill.key, c.label)} />
        ))}
      </div>

      {/* weekly active users */}
      <Card title="weekly active users" icon="calendar" tone="blue" action={badge(`${data.weeklyUsers?.length || 0} weeks`)}>
        <p className="em-sub">click a week to see who was active</p>
        {data.weeklyUsers && data.weeklyUsers.length > 0 ? (
          <Table
            minWidth={420}
            rows={data.weeklyUsers}
            rowKey={(w, i) => i}
            onRowClick={(w) => openDrilldown('week', `${w._id?.year}-W${w._id?.week}`, `week ${w._id?.week} · ${w._id?.year}`)}
            columns={[
              { key: 'week', label: 'week', render: (w) => <Pill tone="sand">W{String(w._id?.week || 0).padStart(2, '0')}</Pill> },
              { key: 'year', label: 'year', render: (w) => w._id?.year || '–' },
              { key: 'users', label: 'users', thStyle: { textAlign: 'right' }, style: { textAlign: 'right' }, render: (w) => <b>{fmt(w.users)}</b> },
            ]}
          />
        ) : (
          <EmptyState icon="calendar" title="no weekly data yet." />
        )}
      </Card>

      {/* mission breakdown */}
      {data.missionBreakdown && Object.keys(data.missionBreakdown).length > 0 && (
        <Card title="mission breakdown" icon="checkCircle" tone="green" action={badge(`${Object.keys(data.missionBreakdown).length} missions`)}>
          <p className="em-sub">click a mission to see which users sorted it</p>
          <div className="em-missions">
            {Object.entries(data.missionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([feature, count]) => {
                const pct = data.totalProfiles
                  ? Math.round((count / data.totalProfiles) * 100)
                  : 0;
                return (
                  <button type="button" key={feature} className="em-mission" onClick={() => openDrilldown('mission', feature, `${feature.replace(/_/g, ' ')} sorted`)}>
                    <span className="em-mission-head">
                      <span className="em-mission-name">{feature.replace(/_/g, ' ')}</span>
                      <span><b>{fmt(count)}</b> <span className="k-muted">({pct}%)</span></span>
                    </span>
                    <span className="k-progress"><i style={{ width: `${Math.min(pct, 100)}%` }} /></span>
                  </button>
                );
              })}
          </div>
        </Card>
      )}

      {/* level breakdown */}
      {data.levelBreakdown && Object.keys(data.levelBreakdown).length > 0 && (
        <Card title="level breakdown" icon="award" tone="purple" action={badge(`${Object.keys(data.levelBreakdown).length} levels`)}>
          <p className="em-sub">click a level to see who's in it</p>
          <div className="em-levels">
            {Object.entries(data.levelBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([levelId, count], idx) => (
                <button type="button" key={levelId} className="em-level" onClick={() => openDrilldown('level', levelId, `${levelId.replace(/_/g, ' ')} level`)}>
                  <Ico kind="award" tone={LEVEL_TONES[idx % LEVEL_TONES.length]} size={32} />
                  <span className="em-level-name">{levelId.replace(/_/g, ' ')}</span>
                  <b className="em-level-count">{fmt(count)}</b>
                </button>
              ))}
          </div>
        </Card>
      )}

      {/* top badges */}
      {data.topBadges && data.topBadges.length > 0 && (
        <Card title="top badges" icon="trophy" tone="orange" action={badge(`top ${Math.min(data.topBadges.length, 10)}`)}>
          <p className="em-sub">click a badge to see who earned it</p>
          <Table
            minWidth={360}
            rows={data.topBadges.slice(0, 10)}
            rowKey={(b, i) => b.badgeId || i}
            onRowClick={(b) => openDrilldown('badge', b.badgeId, `${(b.badgeId || '').replace(/_/g, ' ')} earned`)}
            columns={[
              { key: 'badge', label: 'badge', render: (b) => <Pill tone="sand">{(b.badgeId || 'unknown').replace(/_/g, ' ')}</Pill> },
              { key: 'earned', label: 'earned', thStyle: { textAlign: 'right' }, style: { textAlign: 'right' }, render: (b) => <b>{fmt(b.count)}</b> },
            ]}
          />
        </Card>
      )}

      {/* event breakdown */}
      {data.eventBreakdown && Object.keys(data.eventBreakdown).length > 0 && (
        <Card title="event breakdown" icon="bell" tone="sky" action={badge(`${Object.keys(data.eventBreakdown).length} types`)}>
          <p className="em-sub">click an event to see every user who triggered it</p>
          <div className="em-events">
            {Object.entries(data.eventBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([eventName, count]) => (
                <button type="button" key={eventName} className="em-event" onClick={() => openDrilldown('event', eventName, `${eventName.replace(/_/g, ' ')} events`)}>
                  <span>{eventName.replace(/_/g, ' ')}</span>
                  <b>{fmt(count)}</b>
                </button>
              ))}
          </div>
        </Card>
      )}

      <p className="k-hint" style={{ textAlign: 'center', margin: 0 }}>
        metrics computed from events + profiles ·{' '}
        {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'never'}
      </p>

      {drilldown && <DrilldownModal data={drilldown} onClose={closeDrilldown} />}
    </div>
  );
}

// ═════════════════════════════════════════════
// DRILL-DOWN MODAL
// ═════════════════════════════════════════════
function DrilldownModal({ data, onClose }) {
  const { kind, label, users, loading, error } = data;

  return (
    <Modal
      onClose={onClose}
      size="lg"
      icon="users"
      tone="blue"
      title={label}
      sub={<>{kind} · {loading ? 'loading users…' : `${users.length} user${users.length === 1 ? '' : 's'}`}</>}
    >
      {loading ? (
        <PageLoading label="fetching users…" minHeight={200} />
      ) : error ? (
        <div className="k-note bad">{error}</div>
      ) : users.length === 0 ? (
        <EmptyState icon="users" title="no users found for this metric." />
      ) : (
        <Table
          minWidth={600}
          rows={users.slice(0, 200)}
          rowKey={(u, i) => u._id || u.userId || i}
          columns={[
            {
              key: 'user',
              label: 'user',
              render: (u) => (
                <div className="k-row" style={{ flexWrap: 'nowrap' }}>
                  <span className="em-avatar">{(u.name || '?').charAt(0).toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <b>{u.name || 'unknown'}</b>
                    <div className="k-hint">{u.email || u.rollNo || '–'}</div>
                  </div>
                </div>
              ),
            },
            { key: 'role', label: 'role', render: (u) => (u.role ? <Pill tone="sand">{u.role}</Pill> : '–') },
            { key: 'detail', label: 'detail', render: (u) => <span className="k-muted">{u.detail || u.meta || '–'}</span> },
            { key: 'when', label: 'when', render: (u) => <span className="k-muted">{u.when ? timeAgo(u.when) : '–'}</span> },
          ]}
        />
      )}
      {users.length > 200 && <p className="k-hint" style={{ textAlign: 'center', margin: 0 }}>showing first 200 of {users.length}</p>}
    </Modal>
  );
}
