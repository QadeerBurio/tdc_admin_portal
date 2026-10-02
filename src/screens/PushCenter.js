// src/screens/PushCenter.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api, { engagementApi } from '../services/api';

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
// TABS
// ─────────────────────────────────────────────
const TABS = [
  { id: 'compose', label: 'Compose', icon: '✍️', desc: 'send a push' },
  { id: 'users', label: 'Users', icon: '👥', desc: 'feature usage' },
  { id: 'inactive', label: 'Inactive', icon: '💤', desc: 'win-back' },
  { id: 'streaks', label: 'Streaks', icon: '🔥', desc: 'at risk' },
  { id: 'broadcasts', label: 'Broadcasts', icon: '📢', desc: 'one-click' },
  { id: 'logs', label: 'Activity', icon: '📜', desc: 'recent sends' },
];

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function PushCenter() {
  const [tab, setTab] = useState('compose');
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // ── Load users + profiles once ──
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const [usersRes, profilesRes] = await Promise.all([
        api.get('/admin/users/all').catch(() => ({ data: [] })),
        api.get('/admin/engagement/profiles').catch(() => ({ data: { items: [] } })),
      ]);

      const usersList = usersRes.data?.users || usersRes.data || [];
      const profilesList = profilesRes.data?.items || profilesRes.data || [];

      setUsers(usersList);
      setProfiles(profilesList);
    } catch (e) {
      console.error('[PushCenter] loadUsers error:', e);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Merge users + profiles for rich data ──
  const mergedUsers = useMemo(() => {
    const byUser = new Map(profiles.map((p) => [String(p.user?._id || p.user), p]));

    return users.map((u) => {
      const profile = byUser.get(String(u._id)) || {};

      // Which features sorted
      const sortedMap = profile.sorted || {};
      const sortedFeatures = Object.keys(sortedMap).filter((k) => sortedMap[k]);
      const unusedFeatures = [
        'discounts', 'resume', 'jobs', 'social',
        'events', 'scholarship', 'skillshare', 'traveling',
      ].filter((f) => !sortedMap[f]);

      return {
        ...u,
        profile: {
          ...profile,
          sortedFeatures,
          unusedFeatures,
          sortedCount: profile.sortedCount || 0,
          streakCount: profile.streak?.count || 0,
          streakBest: profile.streak?.best || 0,
          streakLastAction: profile.streak?.lastActionDay || null,
          freezesLeft: profile.streak?.freezesLeft ?? 1,
          lastActiveAt: profile.stats?.lastActiveAt || null,
          totalSaved: profile.stats?.totalSaved || 0,
          points: profile.points?.balance || 0,
          level: profile.level?.id || 'member',
        },
      };
    });
  }, [users, profiles]);

  // ── Filter by search ──
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return mergedUsers;
    const q = userSearch.toLowerCase();
    return mergedUsers.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.rollNo || '').toLowerCase().includes(q)
    );
  }, [mergedUsers, userSearch]);

  // ── Inactive users (3+ days) ──
  const inactiveUsers = useMemo(() => {
    const now = Date.now();
    return mergedUsers
      .filter((u) => {
        if (!u.profile.lastActiveAt) return true;
        const days = (now - new Date(u.profile.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000);
        return days >= 3;
      })
      .map((u) => ({
        ...u,
        daysSinceActive: u.profile.lastActiveAt
          ? Math.floor((now - new Date(u.profile.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000))
          : 999,
      }))
      .sort((a, b) => b.daysSinceActive - a.daysSinceActive);
  }, [mergedUsers]);

  // ── At-risk streaks (count >= 2, not acted today) ──
  const atRiskStreaks = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return mergedUsers.filter(
      (u) => u.profile.streakCount >= 2 && u.profile.streakLastAction !== today
    );
  }, [mergedUsers]);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>push center</h2>
          <p style={s.subtitle}>
            every notification · every scenario · one place
          </p>
        </div>
        <button style={s.refreshBtn} onClick={loadUsers} disabled={loadingUsers}>
          {loadingUsers ? 'loading…' : 'refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div style={s.tabsWrap}>
        {TABS.map((t) => (
          <button
            key={t.id}
            style={{
              ...s.tabChip,
              ...(tab === t.id ? s.tabChipActive : {}),
            }}
            onClick={() => setTab(t.id)}
          >
            <span style={s.tabIcon}>{t.icon}</span>
            <div>
              <div style={s.tabLabel}>{t.label}</div>
              <div style={s.tabDesc}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'compose' && <ComposeTab users={mergedUsers} onRefresh={loadUsers} />}
      {tab === 'users' && (
        <UsersTab
          users={filteredUsers}
          search={userSearch}
          setSearch={setUserSearch}
          loading={loadingUsers}
        />
      )}
      {tab === 'inactive' && (
        <InactiveTab users={inactiveUsers} onRefresh={loadUsers} />
      )}
      {tab === 'streaks' && (
        <StreaksTab users={atRiskStreaks} onRefresh={loadUsers} />
      )}
      {tab === 'broadcasts' && <BroadcastsTab onRefresh={loadUsers} />}
      {tab === 'logs' && <LogsTab />}
    </div>
  );
}

// ═════════════════════════════════════════════
// TAB 1 — COMPOSE
// ═════════════════════════════════════════════
function ComposeTab({ users, onRefresh }) {
  const [audience, setAudience] = useState('single');
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState('');
  const [copyKey, setCopyKey] = useState('daily_drop');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return users.slice(0, 8);
    const q = search.toLowerCase();
    return users
      .filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [users, search]);

  const send = async () => {
    if (audience === 'single' && !selectedUser) {
      setResult({ ok: false, error: 'pick a user first' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await engagementApi.testPush({
        audience,
        userId: audience === 'single' ? selectedUser._id : undefined,
        copyKey,
        title: title || undefined,
        body: body || undefined,
      });
      setResult({ ok: true, data: res });
      onRefresh?.();
    } catch (e) {
      setResult({
        ok: false,
        error: e?.response?.data?.message || e.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={s.grid2}>
      <div style={s.card}>
        <h3 style={s.cardTitle}>compose push</h3>

        {/* Audience selector */}
        <label style={s.label}>Audience</label>
        <div style={s.audienceRow}>
          {[
            { id: 'single', label: 'single user' },
            { id: 'all', label: 'all users' },
            { id: 'student', label: 'students' },
            { id: 'brand', label: 'brands' },
            { id: 'traveler', label: 'travelers' },
          ].map((a) => (
            <button
              key={a.id}
              style={{
                ...s.audienceChip,
                ...(audience === a.id ? s.audienceChipActive : {}),
              }}
              onClick={() => setAudience(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* User picker */}
        {audience === 'single' && (
          <div style={{ marginTop: 14 }}>
            {selectedUser ? (
              <div style={s.selectedChip}>
                <div style={s.avatar}>
                  {(selectedUser.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.selectedName}>{selectedUser.name}</div>
                  <div style={s.selectedMeta}>{selectedUser.email}</div>
                </div>
                <button
                  style={s.clearBtn}
                  onClick={() => {
                    setSelectedUser(null);
                    setSearch('');
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  style={s.input}
                  placeholder="search user…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {filtered.length > 0 && search.length >= 2 && (
                  <div style={s.dropdown}>
                    {filtered.map((u) => (
                      <button
                        key={u._id}
                        style={s.dropdownRow}
                        onClick={() => {
                          setSelectedUser(u);
                          setSearch('');
                        }}
                      >
                        <div style={s.avatarSm}>
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={s.dropdownName}>{u.name}</div>
                          <div style={s.dropdownMeta}>{u.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Copy key */}
        <label style={{ ...s.label, marginTop: 16 }}>Copy Key</label>
        <select
          style={s.input}
          value={copyKey}
          onChange={(e) => setCopyKey(e.target.value)}
        >
          {[
            { id: 'daily_drop', label: 'Daily Drop' },
            { id: 'streak_warning', label: 'Streak Warning' },
            { id: 'new_for_you', label: 'New For You' },
            { id: 'win_back', label: 'Win Back' },
            { id: 'app_update', label: 'App Update' },
            { id: 'exclusive_offer', label: 'Exclusive Offer' },
            { id: 'freeze_reset', label: 'Freeze Reset' },
            { id: 'transactional', label: 'Transactional' },
          ].map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>

        <label style={{ ...s.label, marginTop: 16 }}>Title (optional)</label>
        <input
          style={s.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="leave blank for copy bank"
        />

        <label style={{ ...s.label, marginTop: 16 }}>Body (optional)</label>
        <textarea
          style={{ ...s.input, minHeight: 80 }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="leave blank for copy bank"
        />

        <button
          style={{ ...s.btnPrimary, marginTop: 20, opacity: sending ? 0.6 : 1 }}
          onClick={send}
          disabled={sending}
        >
          {sending ? 'sending…' : `send to ${audience}`}
        </button>

        {result && (
          <div style={resultBanner(result.ok)}>
            {result.ok
              ? `✓ sent: ${result.data?.sent || 0} / ${result.data?.total || 0} · failed: ${result.data?.failed || 0}`
              : `✗ ${result.error}`}
          </div>
        )}
      </div>

      <div>
        <div style={s.card}>
          <h3 style={s.cardTitle}>preview</h3>
          <div style={s.phone}>
            <div style={s.phoneHeader}>
              <span style={s.phoneTime}>now</span>
              <span style={s.phoneBattery}>🔋</span>
            </div>
            <div style={s.notifCard}>
              <div style={s.notifIcon}>tdc</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.notifTitle}>{title || "today's drop."}</div>
                <div style={s.notifBody}>
                  {body || 'preview of what users will see'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// TAB 2 — USERS (feature usage)
// ═════════════════════════════════════════════
function UsersTab({ users, search, setSearch, loading }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [nudging, setNudging] = useState(null);

  const sendNudge = async (u) => {
    setNudging(u._id);
    try {
      const res = await engagementApi.nudgeFeature(u._id);
      alert(res?.sent ? `✓ sent: ${res.copyKey}` : `skipped: ${res.reason}`);
    } catch (e) {
      alert(`error: ${e.message}`);
    } finally {
      setNudging(null);
    }
  };

  if (loading) return <div style={s.empty}>loading users…</div>;

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div>
          <h3 style={s.cardTitle}>feature usage</h3>
          <p style={s.cardSub}>
            who sorted what · who still has unused features
          </p>
        </div>
        <input
          style={{ ...s.input, maxWidth: 260 }}
          placeholder="search by name / email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table style={s.table}>
        <thead>
          <tr style={s.thead}>
            <th style={s.th}>user</th>
            <th style={s.th}>sorted</th>
            <th style={s.th}>unused</th>
            <th style={s.th}>streak</th>
            <th style={s.th}>last active</th>
            <th style={s.th}></th>
          </tr>
        </thead>
        <tbody>
          {users.slice(0, 50).map((u) => (
            <tr key={u._id} style={s.tr}>
              <td style={s.td}>
                <div style={s.userCell}>
                  <div style={s.avatarSm}>
                    {(u.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={s.userName}>{u.name || 'unknown'}</div>
                    <div style={s.userEmail}>{u.email}</div>
                  </div>
                </div>
              </td>
              <td style={s.td}>
                <div style={s.featureTags}>
                  {u.profile.sortedFeatures.length > 0 ? (
                    u.profile.sortedFeatures.slice(0, 4).map((f) => (
                      <span key={f} style={s.featureTagUsed}>
                        {f}
                      </span>
                    ))
                  ) : (
                    <span style={s.mutedTag}>none yet</span>
                  )}
                  {u.profile.sortedFeatures.length > 4 && (
                    <span style={s.featureTagMore}>
                      +{u.profile.sortedFeatures.length - 4}
                    </span>
                  )}
                </div>
              </td>
              <td style={s.td}>
                <div style={s.featureTags}>
                  {u.profile.unusedFeatures.slice(0, 3).map((f) => (
                    <span key={f} style={s.featureTagUnused}>
                      {f}
                    </span>
                  ))}
                  {u.profile.unusedFeatures.length > 3 && (
                    <span style={s.featureTagMore}>
                      +{u.profile.unusedFeatures.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td style={s.td}>
                <span style={u.profile.streakCount > 0 ? s.streakBadge : s.mutedTag}>
                  🔥 {u.profile.streakCount}
                </span>
              </td>
              <td style={s.td}>
                <span style={s.mutedText}>
                  {u.profile.lastActiveAt
                    ? new Date(u.profile.lastActiveAt).toLocaleDateString()
                    : 'never'}
                </span>
              </td>
              <td style={s.td}>
                <button
                  style={s.actionBtn}
                  onClick={() => sendNudge(u)}
                  disabled={nudging === u._id || u.profile.unusedFeatures.length === 0}
                >
                  {nudging === u._id
                    ? '…'
                    : u.profile.unusedFeatures.length === 0
                    ? 'fully sorted'
                    : `nudge ${u.profile.unusedFeatures[0]}`}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div style={s.emptyTable}>no users found</div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════
// TAB 3 — INACTIVE (win-back)
// ═════════════════════════════════════════════
function InactiveTab({ users, onRefresh }) {
  const [busy, setBusy] = useState(null);
  const [bulk, setBulk] = useState(false);

  const sendTo = async (u) => {
    setBusy(u._id);
    try {
      await engagementApi.nudgeWinBack(u._id, u.daysSinceActive);
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  };

  const sendBulk = async () => {
    if (!window.confirm(`Send win-back to all ${users.length} inactive users?`)) return;
    setBulk(true);
    try {
      for (const u of users.slice(0, 100)) {
        await engagementApi.nudgeWinBack(u._id, u.daysSinceActive).catch(() => {});
      }
      onRefresh?.();
      alert(`sent win-back to ${Math.min(users.length, 100)} users`);
    } finally {
      setBulk(false);
    }
  };

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div>
          <h3 style={s.cardTitle}>inactive users</h3>
          <p style={s.cardSub}>
            haven't opened the app in 3+ days · {users.length} total
          </p>
        </div>
        {users.length > 0 && (
          <button
            style={{ ...s.btnPrimary, padding: '10px 20px' }}
            onClick={sendBulk}
            disabled={bulk}
          >
            {bulk ? 'sending…' : `send to all (${users.length})`}
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div style={s.emptyTable}>everyone is active 💪</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>user</th>
              <th style={s.th}>days inactive</th>
              <th style={s.th}>last active</th>
              <th style={s.th}>points</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 50).map((u) => (
              <tr key={u._id} style={s.tr}>
                <td style={s.td}>
                  <div style={s.userCell}>
                    <div style={s.avatarSm}>
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={s.userName}>{u.name}</div>
                      <div style={s.userEmail}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={s.td}>
                  <span
                    style={{
                      ...s.streakBadge,
                      background:
                        u.daysSinceActive > 14
                          ? DANGER + '15'
                          : u.daysSinceActive > 7
                          ? ORANGE + '15'
                          : GOLD + '15',
                      color:
                        u.daysSinceActive > 14
                          ? DANGER
                          : u.daysSinceActive > 7
                          ? ORANGE
                          : GOLD_DARK,
                    }}
                  >
                    {u.daysSinceActive === 999 ? 'never' : `${u.daysSinceActive}d`}
                  </span>
                </td>
                <td style={s.td}>
                  {u.profile.lastActiveAt
                    ? new Date(u.profile.lastActiveAt).toLocaleDateString()
                    : '—'}
                </td>
                <td style={s.td}>{u.profile.points}</td>
                <td style={s.td}>
                  <button
                    style={s.actionBtn}
                    onClick={() => sendTo(u)}
                    disabled={busy === u._id}
                  >
                    {busy === u._id ? '…' : 'send win-back'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════
// TAB 4 — STREAKS (at risk)
// ═════════════════════════════════════════════
function StreaksTab({ users, onRefresh }) {
  const [sending, setSending] = useState(false);

  const sendAll = async () => {
    if (!window.confirm(`Send streak warning to ${users.length} users?`)) return;
    setSending(true);
    try {
      for (const u of users.slice(0, 100)) {
        await api.post(`/admin/engagement/nudge/streak/${u._id}`).catch(() => {});
      }
      onRefresh?.();
      alert(`sent to ${Math.min(users.length, 100)} users`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div>
          <h3 style={s.cardTitle}>at-risk streaks</h3>
          <p style={s.cardSub}>
            streak ≥ 2 & no action today · {users.length} users
          </p>
        </div>
        {users.length > 0 && (
          <button
            style={{ ...s.btnPrimary, padding: '10px 20px' }}
            onClick={sendAll}
            disabled={sending}
          >
            {sending ? 'sending…' : `warn all (${users.length})`}
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div style={s.emptyTable}>no at-risk streaks</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>user</th>
              <th style={s.th}>streak</th>
              <th style={s.th}>best</th>
              <th style={s.th}>freezes left</th>
              <th style={s.th}>last action</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 50).map((u) => (
              <tr key={u._id} style={s.tr}>
                <td style={s.td}>
                  <div style={s.userCell}>
                    <div style={s.avatarSm}>
                      {(u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={s.userName}>{u.name}</div>
                      <div style={s.userEmail}>{u.email}</div>
                    </div>
                  </div>
                </td>
                <td style={s.td}>
                  <span style={s.streakBadge}>🔥 {u.profile.streakCount}</span>
                </td>
                <td style={s.td}>{u.profile.streakBest}</td>
                <td style={s.td}>
                  {u.profile.freezesLeft === 0 ? (
                    <span style={s.mutedTag}>0</span>
                  ) : (
                    <span style={s.freezeBadge}>🧊 {u.profile.freezesLeft}</span>
                  )}
                </td>
                <td style={s.td}>
                  <span style={s.mutedText}>
                    {u.profile.streakLastAction || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════
// TAB 5 — BROADCASTS
// ═════════════════════════════════════════════
function BroadcastsTab({ onRefresh }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);

  const run = async (id, fn, label) => {
    if (!window.confirm(`Send "${label}" to all users?`)) return;
    setBusy(id);
    setResult(null);
    try {
      const res = await fn();
      setResult({ ok: true, label, data: res });
      onRefresh?.();
    } catch (e) {
      setResult({ ok: false, label, error: e?.response?.data?.message || e.message });
    } finally {
      setBusy(null);
    }
  };

  const actions = [
    {
      id: 'app-update',
      icon: '📱',
      label: 'App Update',
      desc: 'notify everyone about a new version',
      fn: () =>
        engagementApi.broadcastAppUpdate({
          title: 'tdc just got better',
          body: 'new features live. update now.',
          version: '2.1.0',
        }),
    },
    {
      id: 'freeze-reset',
      icon: '🧊',
      label: 'Freeze Reset',
      desc: 'all students get their weekly freeze back',
      fn: () => engagementApi.broadcastFreezeReset(),
    },
    {
      id: 'exclusive-offer',
      icon: '✨',
      label: 'Exclusive Offer',
      desc: 'notify about a special VIP offer',
      fn: () =>
        engagementApi.broadcastCustom({
          audience: 'student',
          title: 'exclusive offer',
          body: 'a new offer just dropped for you. claim in 1 tap.',
          data: { route: 'Brands', params: {} },
        }),
    },
    {
      id: 'new-feature',
      icon: '🚀',
      label: 'New Feature',
      desc: 'announce a new feature is live',
      fn: () =>
        engagementApi.broadcastCustom({
          audience: 'all',
          title: 'new feature live',
          body: 'something new just landed on tdc.',
          data: { route: 'Home', params: {} },
        }),
    },
    {
      id: 'maintenance',
      icon: '🔧',
      label: 'Maintenance',
      desc: 'notify about scheduled downtime',
      fn: () =>
        engagementApi.broadcastCustom({
          audience: 'all',
          title: 'scheduled maintenance',
          body: 'tdc will be down for 30 min tonight at 3am.',
          data: { route: 'Home', params: {} },
        }),
    },
    {
      id: 'win-back-all',
      icon: '💤',
      label: 'Global Win-Back',
      desc: 'ping every user with 3+ days inactive',
      fn: () =>
        engagementApi.broadcastCustom({
          audience: 'all',
          title: 'we saved your spot',
          body: 'come back. your points are waiting.',
          data: { route: 'Home', params: {} },
        }),
    },
  ];

  return (
    <div>
      <div style={s.card}>
        <h3 style={s.cardTitle}>one-click broadcasts</h3>
        <p style={s.cardSub} >
          pre-built campaigns for common events
        </p>

        <div style={s.broadcastGrid}>
          {actions.map((a) => (
            <button
              key={a.id}
              style={{
                ...s.broadcastCard,
                opacity: busy === a.id ? 0.5 : 1,
              }}
              onClick={() => run(a.id, a.fn, a.label)}
              disabled={busy === a.id}
            >
              <div style={s.broadcastIcon}>{a.icon}</div>
              <div style={s.broadcastText}>
                <div style={s.broadcastLabel}>{a.label}</div>
                <div style={s.broadcastDesc}>{a.desc}</div>
              </div>
              <div style={s.broadcastArrow}>→</div>
            </button>
          ))}
        </div>

        {result && (
          <div style={resultBanner(result.ok)}>
            {result.ok
              ? `✓ ${result.label}: sent ${result.data?.sent || 0} / ${result.data?.total || 0}`
              : `✗ ${result.label}: ${result.error}`}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════
// TAB 6 — LOGS
// ═════════════════════════════════════════════
function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filter !== 'all') params.status = filter;
      const res = await engagementApi.pushLogs(params);
      setLogs(res.items || []);
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div>
          <h3 style={s.cardTitle}>push activity</h3>
          <p style={s.cardSub}>last 50 sends · click refresh anytime</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            style={s.input}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">all</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
          </select>
          <button style={s.btnGhost} onClick={load} disabled={loading}>
            {loading ? '…' : 'refresh'}
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div style={s.emptyTable}>no activity yet</div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>user</th>
              <th style={s.th}>type</th>
              <th style={s.th}>body</th>
              <th style={s.th}>status</th>
              <th style={s.th}>sent</th>
              <th style={s.th}>opened</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id} style={s.tr}>
                <td style={s.td}>
                  <span style={s.userName}>{l.user?.name || l.userName || '—'}</span>
                </td>
                <td style={s.td}>
                  <span style={s.typeTag}>{l.type}</span>
                </td>
                <td style={s.td}>
                  <span style={s.bodyText} title={l.body}>
                    {(l.body || '').slice(0, 60)}
                  </span>
                </td>
                <td style={s.td}>
                  {l.status === 'failed' ? (
                    <span style={s.tagDanger}>failed</span>
                  ) : l.openedAt ? (
                    <span style={s.tagSuccess}>opened</span>
                  ) : (
                    <span style={s.tagInfo}>sent</span>
                  )}
                </td>
                <td style={s.td}>
                  {l.sentAt ? new Date(l.sentAt).toLocaleTimeString() : '—'}
                </td>
                <td style={s.td}>
                  {l.openedAt ? new Date(l.openedAt).toLocaleTimeString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const resultBanner = (ok) => ({
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  background: ok ? SUCCESS + '12' : DANGER + '12',
  color: ok ? '#059669' : '#dc2626',
  fontWeight: 700,
  fontSize: 13,
  border: `1.5px solid ${ok ? SUCCESS + '30' : DANGER + '30'}`,
});

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = {
  page: { padding: 0 },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
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
  refreshBtn: {
    padding: '9px 18px',
    background: '#f1f5f9',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    color: BLACK,
    textTransform: 'lowercase',
  },
  btnGhost: {
    padding: '9px 18px',
    background: '#f1f5f9',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    color: BLACK,
    textTransform: 'lowercase',
  },

  // Tabs
  tabsWrap: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 10,
    marginBottom: 20,
  },
  tabChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: '#fff',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 14,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  tabChipActive: {
    background: GOLD,
    borderColor: BLACK,
    boxShadow: '0 4px 12px rgba(249,195,73,0.35)',
  },
  tabIcon: { fontSize: 20, flexShrink: 0 },
  tabLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: BLACK,
    textTransform: 'lowercase',
  },
  tabDesc: {
    fontSize: 10.5,
    color: MUTED,
    marginTop: 1,
    textTransform: 'lowercase',
  },

  // Grids
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
    gap: 20,
    alignItems: 'start',
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

  // Form
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 800,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: `2px solid ${BORDER}`,
    borderRadius: 12,
    fontSize: 13,
    outline: 'none',
    background: '#fafbfc',
    color: BLACK,
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },

  // Audience
  audienceRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  audienceChip: {
    padding: '8px 14px',
    background: '#f8fafc',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
    color: MUTED,
    textTransform: 'lowercase',
  },
  audienceChipActive: {
    background: GOLD,
    borderColor: BLACK,
    color: BLACK,
  },

  // Selected user chip
  selectedChip: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    background: GOLD_LIGHT,
    border: `1.5px solid ${GOLD}50`,
    borderRadius: 12,
  },
  selectedName: { fontSize: 13.5, fontWeight: 800, color: BLACK },
  selectedMeta: { fontSize: 11.5, color: MUTED, marginTop: 1 },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    background: '#fff',
    border: `1px solid ${BORDER}`,
    cursor: 'pointer',
    fontSize: 16,
    color: MUTED,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    background: '#fff',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    maxHeight: 260,
    overflowY: 'auto',
    zIndex: 10,
  },
  dropdownRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${BORDER}`,
    cursor: 'pointer',
    textAlign: 'left',
  },
  dropdownName: { fontSize: 13, fontWeight: 700, color: BLACK },
  dropdownMeta: { fontSize: 11, color: MUTED, marginTop: 1 },

  // Avatars
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: BLACK,
    color: GOLD,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 900,
    flexShrink: 0,
  },
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

  // Buttons
  btnPrimary: {
    width: '100%',
    padding: '13px 24px',
    background: GOLD,
    border: `1.5px solid ${BLACK}`,
    borderRadius: 12,
    fontWeight: 900,
    fontSize: 13,
    cursor: 'pointer',
    color: BLACK,
    textTransform: 'lowercase',
  },
  actionBtn: {
    padding: '6px 12px',
    background: GOLD_LIGHT,
    border: `1px solid ${GOLD}50`,
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    color: GOLD_DARK,
    textTransform: 'lowercase',
    whiteSpace: 'nowrap',
  },

  // Phone preview
  phone: {
    background: '#1a1a1a',
    borderRadius: 20,
    padding: 14,
    border: `6px solid #000`,
  },
  phoneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  phoneTime: { fontSize: 12, fontWeight: 700, color: '#fff' },
  phoneBattery: { fontSize: 12, color: '#fff', opacity: 0.7 },
  notifCard: {
    display: 'flex',
    gap: 10,
    padding: 12,
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: GOLD,
    color: BLACK,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 900,
    flexShrink: 0,
  },
  notifTitle: { fontSize: 13, fontWeight: 800, color: BLACK, marginBottom: 2 },
  notifBody: { fontSize: 12, color: '#334155', lineHeight: 1.4 },

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
  td: {
    padding: '12px 16px',
    fontSize: 13,
    color: BLACK,
    fontWeight: 600,
  },

  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  userName: { fontSize: 13, fontWeight: 700, color: BLACK },
  userEmail: { fontSize: 11, color: MUTED, marginTop: 1 },

  featureTags: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  featureTagUsed: {
    padding: '2px 8px',
    background: SUCCESS + '15',
    color: '#059669',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'lowercase',
    border: `1px solid ${SUCCESS}30`,
  },
  featureTagUnused: {
    padding: '2px 8px',
    background: GOLD_LIGHT,
    color: GOLD_DARK,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'lowercase',
    border: `1px solid ${GOLD}40`,
  },
  featureTagMore: {
    padding: '2px 8px',
    background: '#f1f5f9',
    color: MUTED,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
  },
  mutedTag: {
    padding: '2px 8px',
    background: '#f1f5f9',
    color: MUTED,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'lowercase',
  },
  streakBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: ORANGE + '15',
    color: ORANGE,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 900,
  },
  freezeBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: INFO + '15',
    color: INFO,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 900,
  },
  mutedText: { color: MUTED, fontWeight: 500, fontSize: 12 },

  typeTag: {
    padding: '3px 8px',
    background: PURPLE + '15',
    color: PURPLE,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'lowercase',
  },
  tagSuccess: {
    padding: '3px 8px',
    background: SUCCESS + '15',
    color: '#059669',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'lowercase',
  },
  tagInfo: {
    padding: '3px 8px',
    background: INFO + '15',
    color: '#2563eb',
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'lowercase',
  },
  tagDanger: {
    padding: '3px 8px',
    background: DANGER + '15',
    color: DANGER,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'lowercase',
  },
  bodyText: {
    fontSize: 12,
    color: MUTED,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 260,
    display: 'inline-block',
  },

  // Broadcasts
  broadcastGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 12,
  },
  broadcastCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '16px 18px',
    background: GOLD_LIGHT,
    border: `1.5px solid ${GOLD}50`,
    borderRadius: 14,
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  broadcastIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    background: '#fff',
    border: `1.5px solid ${GOLD}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
  },
  broadcastText: { flex: 1, minWidth: 0 },
  broadcastLabel: {
    fontSize: 14,
    fontWeight: 800,
    color: BLACK,
    textTransform: 'lowercase',
    letterSpacing: -0.2,
  },
  broadcastDesc: {
    fontSize: 11.5,
    color: MUTED,
    marginTop: 2,
    textTransform: 'lowercase',
  },
  broadcastArrow: {
    fontSize: 20,
    color: GOLD_DARK,
    fontWeight: 900,
  },

  // Empty
  empty: {
    padding: 60,
    textAlign: 'center',
    color: MUTED,
    fontSize: 13,
    textTransform: 'lowercase',
  },
  emptyTable: {
    padding: '60px 20px',
    textAlign: 'center',
    color: MUTED,
    fontSize: 13,
    fontWeight: 500,
    textTransform: 'lowercase',
  },
};