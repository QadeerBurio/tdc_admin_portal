// src/screens/PushCenter.jsx
// Modern admin console for push notifications.
// Shows mood icons (real PNG assets), rotating copy variants, and full delivery logs.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
const ORANGE = '#f97316';

// ─────────────────────────────────────────────
// ASSET BASE
// The mood icons live at:  {ASSET_BASE}/dots/{mood}.png
// Change this if your CDN or static host differs.
// ─────────────────────────────────────────────
const ASSET_BASE =
  process.env.REACT_APP_ASSET_BASE ||
  'https://the-deft-crew-production.up.railway.app/assets';

// ─────────────────────────────────────────────
// MOOD ICON MAP — each mood has emoji (fallback),
// label, color, and a dedicated PNG image URL
// ─────────────────────────────────────────────
const moodImage = (mood) => `${ASSET_BASE}/dots/${mood}.png`;

const MOODS = {
  // 🙂 Happy / positive
  sorted:   { emoji: '😌', label: 'sorted',   color: '#10b981' },
  excited:  { emoji: '🤩', label: 'excited',  color: '#f9c349' },
  hype:     { emoji: '🔥', label: 'hype',     color: '#f97316' },
  smug:     { emoji: '😏', label: 'smug',     color: '#3b82f6' },

  // 😅 Wary / cheeky
  cheeky:   { emoji: '😜', label: 'cheeky',   color: '#ec4899' },
  sus:      { emoji: '👀', label: 'sus',      color: '#f97316' },

  // 😟 Negative / worried
  broke:    { emoji: '😔', label: 'broke',    color: '#94a3b8' },
  panic:    { emoji: '😰', label: 'panic',    color: '#ef4444' },
  shock:    { emoji: '😮', label: 'shock',    color: '#eab308' },
  shook:    { emoji: '😳', label: 'shook',    color: '#a855f7' },
  urgent:   { emoji: '🚨', label: 'urgent',   color: '#ff6b6b' },

  // 💤 Neutral / sleepy / money / ghost
  sleepy:   { emoji: '😴', label: 'sleepy',   color: '#8b5cf6' },
  ghost:    { emoji: '👻', label: 'ghost',    color: '#64748b' },
  money:    { emoji: '💰', label: 'money',    color: '#10b981' },

  // Fallback
  default:  { emoji: '✨', label: 'default',  color: '#f9c349' },
};

// Preload all mood images so the preview is instant
const MOOD_KEYS = Object.keys(MOODS).filter((k) => k !== 'default');
MOOD_KEYS.forEach((m) => {
  const img = new Image();
  img.src = moodImage(m);
});

// ─────────────────────────────────────────────
// COPY KEYS
// ─────────────────────────────────────────────
const COPY_KEYS = [
  { id: 'daily_drop',       label: 'daily drop',      mood: 'sus',     hint: '7pm cron · rotated variants' },
  { id: 'streak_warning',   label: 'streak at risk',  mood: 'panic',   hint: '8pm cron · deadpan tone' },
  { id: 'streak_broken',    label: 'streak broke',    mood: 'sleepy',  hint: 'midnight cron' },
  { id: 'freeze_used',      label: 'freeze saved',    mood: 'sleepy',  hint: 'midnight cron' },
  { id: 'badge_earned',     label: 'badge earned',    mood: 'excited', hint: 'event pipeline · emoji ok' },
  { id: 'tier_unlocked',    label: 'level up',        mood: 'hype',    hint: 'event pipeline · emoji ok' },
  { id: 'referral_joined',  label: 'referral joined', mood: 'smug',    hint: 'event pipeline · emoji ok' },
  { id: 'win_back_soft',    label: 'win-back · soft', mood: 'sleepy',  hint: '3–6 days inactive' },
  { id: 'welcome_back',     label: 'welcome back',    mood: 'excited', hint: '7–13 days inactive' },
  { id: 'exclusive_offer',  label: 'exclusive offer', mood: 'money',   hint: '14–29 days inactive' },
  { id: 'win_back_ghost',   label: 'win-back · ghost',mood: 'ghost',   hint: '30+ days inactive' },
  { id: 'new_offer',        label: 'new offer',       mood: 'money',   hint: 'brand creates offer' },
  { id: 'new_for_you',      label: 'new for you',     mood: 'excited', hint: 'platform announcement' },
  { id: 'app_update',       label: 'app update',      mood: 'sorted',  hint: 'system' },
  { id: 'freeze_reset',     label: 'freeze reset',    mood: 'sorted',  hint: 'monday cron' },
  { id: 'transactional',    label: 'transactional',   mood: 'sorted',  hint: 'generic' },
];

const getCopyMeta = (id) => COPY_KEYS.find((k) => k.id === id) || COPY_KEYS[0];

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
const TABS = [
  { id: 'compose', label: 'compose', icon: '✍️', desc: 'send a push' },
  { id: 'users', label: 'users', icon: '👥', desc: 'feature usage' },
  { id: 'inactive', label: 'inactive', icon: '💤', desc: 'win-back' },
  { id: 'streaks', label: 'streaks', icon: '🔥', desc: 'at risk' },
  { id: 'broadcasts', label: 'broadcasts', icon: '📢', desc: 'one-click' },
  { id: 'logs', label: 'activity', icon: '📜', desc: 'recent sends' },
];

// ─────────────────────────────────────────────
// SEARCH HELPER
// ─────────────────────────────────────────────
function matchesQuery(user, query) {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const name = (user.name || '').toLowerCase();
  const email = (user.email || '').toLowerCase();
  const rollNo = (user.rollNo || '').toLowerCase();
  const role = (user.role || '').toLowerCase();

  if (name.includes(q) || email.includes(q) || rollNo.includes(q) || role.includes(q)) {
    return true;
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    const haystack = `${name} ${email} ${rollNo}`;
    return tokens.every((t) => haystack.includes(t));
  }

  return false;
}

// ─────────────────────────────────────────────
// MOOD PILL — reusable icon component
// Uses the REAL PNG asset. Falls back to emoji if the image fails.
// ─────────────────────────────────────────────
function MoodPill({ mood, size = 'md' }) {
  const m = MOODS[mood] || MOODS.default;
  const [imgFailed, setImgFailed] = useState(false);

  const dims =
    size === 'sm' ? { w: 26, h: 26, fs: 13, r: 9 } :
    size === 'lg' ? { w: 48, h: 48, fs: 22, r: 12 } :
                    { w: 34, h: 34, fs: 16, r: 10 };

  return (
    <div
      title={m.label}
      style={{
        width: dims.w,
        height: dims.h,
        borderRadius: dims.r,
        background: m.color + '18',
        border: `1.5px solid ${m.color}50`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: dims.fs,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {imgFailed ? (
        <span>{m.emoji}</span>
      ) : (
        <img
          src={moodImage(mood)}
          alt={m.label}
          width={dims.w - 4}
          height={dims.h - 4}
          onError={() => setImgFailed(true)}
          style={{
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MOOD BIG PREVIEW — shown in the phone preview
// ─────────────────────────────────────────────
function MoodBigPreview({ mood }) {
  const m = MOODS[mood] || MOODS.default;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      style={{
        ...s.moodBanner,
        background: `linear-gradient(135deg, ${m.color}30, ${m.color}10)`,
        border: `2px dashed ${m.color}60`,
      }}
    >
      <div style={s.moodBannerIconWrap}>
        {imgFailed ? (
          <div style={s.moodBannerEmoji}>{m.emoji}</div>
        ) : (
          <img
            src={moodImage(mood)}
            alt={m.label}
            style={{
              width: 72,
              height: 72,
              objectFit: 'contain',
              display: 'block',
            }}
            onError={() => setImgFailed(true)}
          />
        )}
      </div>
      <div style={s.moodBannerLabel}>
        icon: <b>{mood}</b>
        <div style={s.moodBannerSub}>attached as richContent.image</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function PushCenter() {
  const [tab, setTab] = useState('compose');
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [loadError, setLoadError] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setLoadError(null);
    try {
      const [usersRes, profilesRes] = await Promise.all([
        api.get('/admin/users/all').catch(() => api.get('/admin/users/student').catch(() => ({ data: [] }))),
        api.get('/admin/engagement/profiles').catch(() => ({ data: { items: [] } })),
      ]);

      let usersList = [];
      if (Array.isArray(usersRes.data)) usersList = usersRes.data;
      else if (Array.isArray(usersRes.data?.users)) usersList = usersRes.data.users;
      else if (Array.isArray(usersRes.data?.data)) usersList = usersRes.data.data;

      let profilesList = [];
      if (Array.isArray(profilesRes.data)) profilesList = profilesRes.data;
      else if (Array.isArray(profilesRes.data?.items)) profilesList = profilesRes.data.items;

      console.log('[PushCenter] loaded users:', usersList.length, '· profiles:', profilesList.length);

      if (usersList.length === 0) {
        setLoadError('no users returned from /admin/users/all');
      }

      setUsers(usersList);
      setProfiles(profilesList);
    } catch (e) {
      console.error('[PushCenter] loadUsers error:', e);
      setLoadError(e?.response?.data?.message || e.message);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const mergedUsers = useMemo(() => {
    const byUser = new Map();
    profiles.forEach((p) => {
      const uid = String(p.user?._id || p.user || p._id);
      if (uid) byUser.set(uid, p);
    });

    return users.map((u) => {
      const profile = byUser.get(String(u._id)) || {};
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

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return mergedUsers;
    return mergedUsers.filter((u) => matchesQuery(u, userSearch));
  }, [mergedUsers, userSearch]);

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

      {loadError && (
        <div style={s.warnBanner}>
          ⚠ {loadError} — check your backend /admin/users/all endpoint
        </div>
      )}

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

      {tab === 'compose' && <ComposeTab users={mergedUsers} onRefresh={loadUsers} />}
      {tab === 'users' && (
        <UsersTab
          users={filteredUsers}
          totalCount={mergedUsers.length}
          search={userSearch}
          setSearch={setUserSearch}
          loading={loadingUsers}
        />
      )}
      {tab === 'inactive' && <InactiveTab users={inactiveUsers} onRefresh={loadUsers} />}
      {tab === 'streaks' && <StreaksTab users={atRiskStreaks} onRefresh={loadUsers} />}
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [copyKey, setCopyKey] = useState('daily_drop');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [previewTick, setPreviewTick] = useState(0);

  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return users.slice(0, 8);
    return users.filter((u) => matchesQuery(u, search)).slice(0, 12);
  }, [users, search]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [search]);

  const handleKeyDown = (e) => {
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const u = filtered[highlightIdx];
      if (u) {
        setSelectedUser(u);
        setSearch('');
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const pickUser = (u) => {
    setSelectedUser(u);
    setSearch('');
    setShowDropdown(false);
  };

  const clearUser = () => {
    setSelectedUser(null);
    setSearch('');
    setShowDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

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

  const copyMeta = getCopyMeta(copyKey);
  const mood = copyMeta.mood;

  return (
    <div style={s.grid2}>
      <div style={s.card}>
        <h3 style={s.cardTitle}>compose push</h3>

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

        {audience === 'single' && (
          <div style={{ marginTop: 14 }}>
            {selectedUser ? (
              <div style={s.selectedChip}>
                <div style={s.avatar}>
                  {(selectedUser.name || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.selectedName}>{selectedUser.name || 'unknown'}</div>
                  <div style={s.selectedMeta}>
                    {selectedUser.email || selectedUser.rollNo || '—'}
                  </div>
                </div>
                <button style={s.clearBtn} onClick={clearUser}>
                  ×
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  style={s.input}
                  placeholder="search by name, email, or roll no…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />

                {!search && !selectedUser && (
                  <div style={s.searchHint}>
                    {users.length > 0
                      ? `showing ${filtered.length} of ${users.length} users`
                      : 'no users loaded — click refresh'}
                  </div>
                )}

                {showDropdown && filtered.length > 0 && (
                  <div style={s.dropdown}>
                    {filtered.map((u, i) => (
                      <button
                        key={u._id}
                        type="button"
                        style={{
                          ...s.dropdownRow,
                          ...(i === highlightIdx ? s.dropdownRowHighlight : {}),
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickUser(u)}
                        onMouseEnter={() => setHighlightIdx(i)}
                      >
                        <div style={s.avatarSm}>
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={s.dropdownName}>{u.name || 'unknown'}</div>
                          <div style={s.dropdownMeta}>
                            {u.email || '—'}
                            {u.rollNo ? ` · ${u.rollNo}` : ''}
                            {u.role ? ` · ${u.role}` : ''}
                          </div>
                        </div>
                        {u.profile?.streakCount > 0 && (
                          <span style={s.streakPip}>
                            🔥 {u.profile.streakCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {showDropdown && search.trim() && filtered.length === 0 && (
                  <div style={s.dropdown}>
                    <div style={s.dropdownEmpty}>
                      no users match "{search}"
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <label style={{ ...s.label, marginTop: 16 }}>Copy key</label>
        <div style={s.copyKeyRow}>
          <select
            style={{ ...s.input, flex: 1 }}
            value={copyKey}
            onChange={(e) => {
              setCopyKey(e.target.value);
              setPreviewTick((t) => t + 1);
            }}
          >
            {COPY_KEYS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
          <MoodPill mood={mood} size="md" />
        </div>
        <div style={s.copyKeyHint}>
          {copyMeta.hint} · icon: <b>{mood}</b>
        </div>

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
          {sending
            ? 'sending…'
            : audience === 'single'
            ? `send to ${selectedUser?.name || 'user'}`
            : `send to ${audience}`}
        </button>

        {result && (
          <div style={resultBanner(result.ok)}>
            {result.ok
              ? `✓ sent: ${result.data?.sent || 0} / ${result.data?.total || 0} · failed: ${result.data?.failed || 0}`
              : `✗ ${result.error}`}
          </div>
        )}
      </div>

      {/* Preview panel */}
      <div>
        <div style={s.card}>
          <div style={s.previewHead}>
            <h3 style={s.cardTitle}>preview</h3>
            <button
              style={s.refreshBtnSm}
              onClick={() => setPreviewTick((t) => t + 1)}
              title="cycle through copy variants"
            >
              ↻ rotate
            </button>
          </div>

          <div style={s.phone}>
            <div style={s.phoneHeader}>
              <span style={s.phoneTime}>now</span>
              <span style={s.phoneBattery}>🔋</span>
            </div>

            {/* Big mood banner — shows the real PNG that lands on the device */}
            <MoodBigPreview mood={mood} />

            <div style={s.notifCard}>
              <MoodPill mood={mood} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.notifTitle}>
                  {title || copyMeta.label}
                </div>
                <div style={s.notifBody}>
                  {body || (
                    <>
                      <PreviewVariant copyKey={copyKey} tick={previewTick} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Copy bank details */}
          <div style={s.bankInfo}>
            <div style={s.bankInfoRow}>
              <span style={s.bankInfoLabel}>type</span>
              <span style={s.bankInfoValue}>{copyKey}</span>
            </div>
            <div style={s.bankInfoRow}>
              <span style={s.bankInfoLabel}>mood</span>
              <span style={s.bankInfoValue}>{mood}</span>
            </div>
            <div style={s.bankInfoRow}>
              <span style={s.bankInfoLabel}>icon url</span>
              <span style={s.bankInfoValueMono}>
                /dots/{mood}.png
              </span>
            </div>
            <div style={s.bankInfoRow}>
              <span style={s.bankInfoLabel}>variants</span>
              <span style={s.bankInfoValue}>
                rotates per user · no repeats in a row
              </span>
            </div>
          </div>

          {/* Mood reference strip — all 14 icons */}
          <div style={s.moodStrip}>
            <div style={s.moodStripLabel}>all icons</div>
            <div style={s.moodStripRow}>
              {MOOD_KEYS.map((m) => (
                <MoodPill key={m} mood={m} size="sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Preview variant — rotates through a small client-side pool
function PreviewVariant({ copyKey, tick }) {
  const VARIANTS = PREVIEW_VARIANTS[copyKey] || PREVIEW_VARIANTS.default;
  const idx = tick % VARIANTS.length;
  return <span>{VARIANTS[idx]}</span>;
}

const PREVIEW_VARIANTS = {
  daily_drop: [
    "tonight's confession is going to end a friendship.",
    'someone in your uni said something wild. 7pm.',
    "this drop's not for the weak.",
    'read this before your group chat does.',
    "7pm. tonight's confession has main character energy and you're not in it yet.",
  ],
  streak_warning: [
    'you do this every night. 15 mins left.',
    "12 days. don't be the guy who breaks it on a tuesday.",
    "your streak is flatlining. cpr's free, just open the app.",
    'bhai your streak is literally about to die. 15 mins left.',
    "we've seen this movie before. you always open at 11:58. cutting it close again?",
  ],
  streak_broken: [
    'your {count} day streak broke. come back stronger.',
    '{count} days gone. new start tomorrow.',
    'streak reset. no drama, just reload.',
  ],
  freeze_used: [
    'we saved your {count} day streak. one freeze used.',
  ],
  badge_earned: [
    '{badge_name}. took you long enough.',
    'unlocked. most people quit before this one.',
    'BOOM. {badge_name} unlocked. flex it.',
    'certified {badge_name} holder now. screenshot this, you earned it.',
  ],
  tier_unlocked: [
    "LEVEL UP. you're {tier} now. card's ready, discount's live.",
    'welcome to {tier}. this is not a drill, your perks just got real.',
    '{tier} unlocked. {discount}% off just kicked in — go use it before you forget.',
    "you're {tier} now. this is the part where you tell everyone, subtly.",
  ],
  referral_joined: [
    "{friend_name} just joined with YOUR code. that's 100 points, straight up.",
    'you put someone on. {friend_name} joined tdc because of you. +100 pts',
    "recruiter era activated. {friend_name} is in, you're up 100 points.",
  ],
  win_back_soft: [
    'we kept your seat warm. {n} deals dropped since you left.',
    'campus moved on without you a little. come see what you missed.',
    'not to guilt trip but... {n} confessions happened without you reading them',
  ],
  welcome_back: [
    'welcome back. your {count} points are waiting.',
  ],
  exclusive_offer: [
    'exclusive for you: {brand} · {discount}% off. expires soon.',
    'just for you: {brand}, {discount}% off. one-tap claim.',
  ],
  win_back_ghost: [
    "it's been {n} days. your app icon has started to wonder about you.",
    "you left. the deals didn't. neither did we, technically. we're a notification.",
    'your streak died alone. no one came.',
    "everything's still here. you're the only thing that left.",
  ],
  new_offer: [
    'new offer from {brand}: {discount}% off. claim in 1 tap.',
    "{brand} just dropped {discount}% off. grab it before it's gone.",
  ],
  new_for_you: ['something new for you on tdc.'],
  app_update: [
    'tdc just got better. new features live. update now.',
    'fresh version is out. tap to update.',
  ],
  freeze_reset: [
    'weekly freeze reset. your streak is protected.',
    'freeze is back. keep the streak alive.',
  ],
  transactional: ['{message}'],
  default: ['select a copy key to preview'],
};

// ═════════════════════════════════════════════
// TAB 2 — USERS
// ═════════════════════════════════════════════
function UsersTab({ users, totalCount, search, setSearch, loading }) {
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
            {search && ` · showing ${users.length}/${totalCount}`}
          </p>
        </div>
        <input
          style={{ ...s.input, maxWidth: 260 }}
          placeholder="search by name / email / roll"
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
                    <div style={s.userEmail}>{u.email || u.rollNo || '—'}</div>
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
        <div style={s.emptyTable}>
          {search ? `no users match "${search}"` : 'no users found'}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════
// TAB 3 — INACTIVE
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

  const moodForDays = (d) =>
    d >= 30 ? 'ghost' : d >= 14 ? 'excited' : d >= 7 ? 'excited' : 'sleepy';

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
            style={{ ...s.btnPrimary, padding: '10px 20px', width: 'auto' }}
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
              <th style={s.th}>icon</th>
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
                  <MoodPill mood={moodForDays(u.daysSinceActive)} size="sm" />
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
// TAB 4 — STREAKS
// ═════════════════════════════════════════════
function StreaksTab({ users, onRefresh }) {
  const [sending, setSending] = useState(false);

  const sendAll = async () => {
    if (!window.confirm(`Send streak warning to ${users.length} users?`)) return;
    setSending(true);
    try {
      for (const u of users.slice(0, 100)) {
        await engagementApi.nudgeStreak(u._id).catch(() => {});
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
            style={{ ...s.btnPrimary, padding: '10px 20px', width: 'auto' }}
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
              <th style={s.th}>icon</th>
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
                  <MoodPill mood="panic" size="sm" />
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
      mood: 'sorted',
      label: 'app update',
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
      mood: 'sorted',
      label: 'freeze reset',
      desc: 'all students get their weekly freeze back',
      fn: () => engagementApi.broadcastFreezeReset(),
    },
    {
      id: 'exclusive-offer',
      icon: '✨',
      mood: 'money',
      label: 'exclusive offer',
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
      mood: 'excited',
      label: 'new feature',
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
      mood: 'sorted',
      label: 'maintenance',
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
      mood: 'sleepy',
      label: 'global win-back',
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
        <p style={s.cardSub}>pre-built campaigns for common events</p>

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
              <div style={s.broadcastIconWrap}>
                <MoodPill mood={a.mood} size="lg" />
              </div>
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
            style={{ ...s.input, maxWidth: 140 }}
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
              <th style={s.th}>icon</th>
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
                  <MoodPill mood={l.mood || 'sorted'} size="sm" />
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
  refreshBtnSm: {
    padding: '5px 12px',
    background: '#f1f5f9',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 11,
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

  warnBanner: {
    padding: '12px 16px',
    background: GOLD_LIGHT,
    border: `1.5px solid ${GOLD}50`,
    borderRadius: 12,
    color: GOLD_DARK,
    fontWeight: 700,
    fontSize: 12.5,
    marginBottom: 16,
    textTransform: 'lowercase',
  },

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

  grid2: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
    gap: 20,
    alignItems: 'start',
  },

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
  previewHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

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

  copyKeyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  copyKeyHint: {
    fontSize: 11.5,
    color: MUTED,
    marginTop: 6,
    textTransform: 'lowercase',
  },

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

  searchHint: {
    fontSize: 11,
    color: MUTED,
    marginTop: 6,
    textTransform: 'lowercase',
  },

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
    maxHeight: 320,
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
    fontFamily: 'inherit',
  },
  dropdownRowHighlight: {
    background: GOLD_LIGHT,
  },
  dropdownName: { fontSize: 13, fontWeight: 700, color: BLACK },
  dropdownMeta: { fontSize: 11, color: MUTED, marginTop: 1 },
  dropdownEmpty: {
    padding: 16,
    textAlign: 'center',
    color: MUTED,
    fontSize: 12,
    textTransform: 'lowercase',
  },

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

  streakPip: {
    fontSize: 11,
    fontWeight: 900,
    color: ORANGE,
    background: ORANGE + '12',
    padding: '2px 8px',
    borderRadius: 6,
    marginLeft: 6,
    flexShrink: 0,
  },

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

  moodBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  moodBannerIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moodBannerEmoji: {
    fontSize: 38,
    lineHeight: 1,
  },
  moodBannerLabel: {
    fontSize: 13,
    fontWeight: 800,
    color: BLACK,
    textTransform: 'lowercase',
  },
  moodBannerSub: {
    fontSize: 10.5,
    color: MUTED,
    marginTop: 2,
    fontWeight: 500,
  },

  notifCard: {
    display: 'flex',
    gap: 10,
    padding: 12,
    background: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
  },
  notifTitle: { fontSize: 13, fontWeight: 800, color: BLACK, marginBottom: 2 },
  notifBody: { fontSize: 12, color: '#334155', lineHeight: 1.4 },

  bankInfo: {
    marginTop: 16,
    padding: 14,
    background: '#f8fafc',
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
  },
  bankInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    gap: 8,
  },
  bankInfoLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bankInfoValue: {
    fontSize: 12,
    fontWeight: 700,
    color: BLACK,
    textTransform: 'lowercase',
  },
  bankInfoValueMono: {
    fontSize: 11,
    fontWeight: 700,
    color: BLACK,
    fontFamily: 'ui-monospace, Menlo, monospace',
    background: '#fff',
    padding: '2px 8px',
    borderRadius: 6,
    border: `1px solid ${BORDER}`,
  },

  // mood reference strip
  moodStrip: {
    marginTop: 16,
    padding: 12,
    background: '#f8fafc',
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
  },
  moodStripLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  moodStripRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },

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
  broadcastIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    background: '#fff',
    border: `1.5px solid ${GOLD}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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