// src/screens/TestPush.js (push center)
// Admin console for push notifications: compose with a phone preview, feature usage, win-back,
// streaks, one-click broadcasts and delivery logs. Mood icons are the real PNG assets.

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api, { engagementApi } from '../services/api';
import Ico, { TONES } from '../portal/Ico';
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Select, Dropdown, Tabs, Segmented, Card, Table, EmptyState, Pill, toast, confirmDialog } from '../portal/kit';
import './styles/TestPush.css';

// ─────────────────────────────────────────────
// ASSET BASE
// The mood icons live at:  {ASSET_BASE}/dots/{mood}.png
// Change this if your CDN or static host differs.
// ─────────────────────────────────────────────
const ASSET_BASE =
 
  'https://the-deft-crew-production.up.railway.app/assets';

// ─────────────────────────────────────────────
// MOOD ICON MAP: each mood has emoji (fallback),
// label, an Ico tone, and a dedicated PNG image URL
// ─────────────────────────────────────────────
const moodImage = (mood) => `${ASSET_BASE}/dots/${mood}.png`;

const MOODS = {
  // 🙂 Happy / positive
  sorted:   { emoji: '😊', label: 'sorted',   tone: 'green' },
  excited:  { emoji: '🤩', label: 'excited',  tone: 'orange' },
  hype:     { emoji: '😆', label: 'hype',     tone: 'orange' },
  smug:     { emoji: '😏', label: 'smug',     tone: 'blue' },

  // 😅 Wary / cheeky
  cheeky:   { emoji: '😜', label: 'cheeky',   tone: 'pink' },
  sus:      { emoji: '😒', label: 'sus',      tone: 'orange' },

  // 😟 Negative / worried
  broke:    { emoji: '😢', label: 'broke',    tone: 'sand' },
  panic:    { emoji: '😰', label: 'panic',    tone: 'red' },
  shock:    { emoji: '😳', label: 'shock',    tone: 'orange' },
  shook:    { emoji: '😮', label: 'shook',    tone: 'purple' },
  urgent:   { emoji: '😨', label: 'urgent',   tone: 'coral' },

  // 💤 Neutral / sleepy / money / ghost
  sleepy:   { emoji: '😴', label: 'sleepy',   tone: 'purple' },
  ghost:    { emoji: '😑', label: 'ghost',    tone: 'sand' },
  money:    { emoji: '🤑', label: 'money',    tone: 'green' },

  // Fallback
  default:  { emoji: '✨', label: 'default',  tone: 'orange' },
};


// ─────────────────────────────────────────────
// SAME RULES AS THE PHONE (backend utils/pushNotification.js)
// so the preview shows the exact title, emoji, picture and sound.
// ─────────────────────────────────────────────
const MOOD_SOUND = {
  sorted: 'tdc_mood_sorted', excited: 'tdc_mood_excited', panic: 'tdc_mood_panic',
  broke: 'tdc_mood_broke', sleepy: 'tdc_mood_sleepy', shook: 'tdc_mood_shook',
  sus: 'tdc_mood_sus', cheeky: 'tdc_mood_cheeky', rs: 'tdc_mood_rs',
};
const TYPE_SOUND = {
  new_offer: 'tdc_push_deal', streak: 'tdc_push_streak', points: 'tdc_push_points',
  level_up: 'tdc_push_level_up', badge: 'tdc_push_level_up', reminder: 'tdc_push_reminder',
  event: 'tdc_push_event', message: 'tdc_push_message',
};
const soundFor = (type, mood) => MOOD_SOUND[mood] || TYPE_SOUND[type] || 'tdc_push_default';
const HAS_EMOJI = /[\u2600-\u27BF]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/;
const phoneTitle = (title, mood) => {
  const t = title || 'tdc';
  if (HAS_EMOJI.test(t)) return t;
  return `${(MOODS[mood] || MOODS.default).emoji} ${t}`;
};
const pushImage = (mood) => `${ASSET_BASE}/dots/push/${mood}.png`;

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
  { id: 'streak_broken',    label: 'streak broke',    mood: 'urgent',  hint: 'midnight cron' },
  { id: 'freeze_used',      label: 'freeze saved',    mood: 'sleepy',  hint: 'midnight cron' },
  { id: 'badge_earned',     label: 'badge earned',    mood: 'excited', hint: 'event pipeline · emoji ok' },
  { id: 'tier_unlocked',    label: 'level up',        mood: 'hype',    hint: 'event pipeline · emoji ok' },
  { id: 'referral_joined',  label: 'referral joined', mood: 'smug',    hint: 'event pipeline · emoji ok' },
  { id: 'win_back_soft',    label: 'win-back · soft', mood: 'sleepy',  hint: '3–6 days inactive', pushTitle: 'we kept your seat warm' },
  { id: 'welcome_back',     label: 'welcome back',    mood: 'excited', hint: '7–13 days inactive' },
  { id: 'exclusive_offer',  label: 'exclusive offer', mood: 'excited',   hint: '14–29 days inactive' },
  { id: 'win_back_ghost',   label: 'win-back · ghost',mood: 'ghost',   hint: '30+ days inactive', pushTitle: 'we miss you' },
  { id: 'new_offer',        label: 'new offer',       mood: 'excited',   hint: 'brand creates offer' },
  { id: 'new_for_you',      label: 'new for you',     mood: 'excited', hint: 'platform announcement' },
  { id: 'app_update',       label: 'app update',      mood: 'sorted',  hint: 'system' },
  { id: 'freeze_reset',     label: 'freeze reset',    mood: 'sorted',  hint: 'monday cron' },
  { id: 'transactional',    label: 'transactional',   mood: 'sorted',  hint: 'generic', pushTitle: 'tdc' },
];

const getCopyMeta = (id) => COPY_KEYS.find((k) => k.id === id) || COPY_KEYS[0];

// ─────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────
const TABS = [
  { id: 'compose', label: 'compose', icon: 'edit' },
  { id: 'users', label: 'users', icon: 'users' },
  { id: 'inactive', label: 'inactive', icon: 'clock' },
  { id: 'streaks', label: 'streaks', icon: 'flame' },
  { id: 'broadcasts', label: 'broadcasts', icon: 'megaphone' },
  { id: 'logs', label: 'activity', icon: 'file' },
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
// MOOD PILL: the real PNG asset, the mood's emoji if the image fails
// ─────────────────────────────────────────────
function MoodPill({ mood, size = 'md' }) {
  const m = MOODS[mood] || MOODS.default;
  const [imgFailed, setImgFailed] = useState(false);
  const px = size === 'sm' ? 28 : size === 'lg' ? 48 : 36;

  return (
    <span className={`tp-mood ${size}`} title={m.label} style={{ width: px, height: px, borderColor: TONES[m.tone][1] }}>
      {imgFailed ? (
        <span>{m.emoji}</span>
      ) : (
        <img src={moodImage(mood)} alt={m.label} width={px - 6} height={px - 6} onError={() => setImgFailed(true)} />
      )}
    </span>
  );
}

// ─────────────────────────────────────────────
// MOOD BIG PREVIEW: shown in the phone preview
// ─────────────────────────────────────────────
function MoodBigPreview({ mood }) {
  const m = MOODS[mood] || MOODS.default;
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="tp-banner">
      <div className="tp-banner-ico">
        {imgFailed ? <span className="tp-banner-emoji">{m.emoji}</span> : <img src={pushImage(mood)} alt={m.label} onError={() => setImgFailed(true)} />}
      </div>
      <div className="tp-banner-text">
        icon: <b>{mood}</b>
        <div className="k-hint">attached as richContent.image</div>
      </div>
    </div>
  );
}

const avatar = (name) => <span className="tp-avatar">{(name || '?').charAt(0).toUpperCase()}</span>;
const userCell = (u, sub) => (
  <div className="tp-user">
    {avatar(u.name)}
    <div style={{ minWidth: 0 }}>
      <div className="tp-name">{u.name || 'unknown'}</div>
      <div className="k-hint">{sub}</div>
    </div>
  </div>
);
const Banner = ({ ok, children }) => <div className={`k-note ${ok ? 'ok' : 'bad'}`} style={{ fontWeight: 700 }}>{children}</div>;

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
    <div className="tdcp k-page tp" data-screen="push">
      <PageHeader
        title="push center"
        sub="compose, test and send notifications. keep them fun, never pushy."
        actions={<Button variant="secondary" icon="refresh" onClick={loadUsers} loading={loadingUsers}>refresh</Button>}
      />

      {loadError && (
        <div className="k-note warn tp-warn">
          <Ico kind="alert" tone="plain" size={18} />
          <span>{loadError}: check your backend /admin/users/all endpoint</span>
        </div>
      )}

      <Tabs label="push center sections" value={tab} onChange={setTab} tabs={TABS} />

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
// TAB 1: COMPOSE
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
      setResult({ ok: res?.ok !== false && (res?.sent || 0) > 0, data: res, error: res?.message || res?.reason });
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
    <div className="tp-grid">
      <Card title="compose push" icon="send" tone="yellow">
        <div className="tp-form">
          <Field label="Audience">
            <Segmented
              label="audience"
              value={audience}
              onChange={setAudience}
              options={[
                { value: 'single', label: 'single user' },
                { value: 'all', label: 'all users' },
                { value: 'student', label: 'students' },
                { value: 'brand', label: 'brands' },
                { value: 'traveler', label: 'travelers' },
              ]}
            />
          </Field>

          {audience === 'single' && (
            selectedUser ? (
              <div className="tp-picked">
                {avatar(selectedUser.name)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="tp-name">{selectedUser.name || 'unknown'}</div>
                  <div className="k-hint">{selectedUser.email || selectedUser.rollNo || '–'}</div>
                </div>
                <button type="button" className="k-icon-btn ghost sm" aria-label="clear user" title="clear user" onClick={clearUser}>
                  <Ico kind="close" tone="plain" size={15} />
                </button>
              </div>
            ) : (
              <Field label="User" hint={!search ? (users.length > 0 ? `showing ${filtered.length} of ${users.length} users` : 'no users loaded: click refresh') : undefined}>
                <div className="k-dd" data-kit="dropdown">
                  <div className="k-search">
                    <span className="k-search-ico"><Ico kind="search" tone="plain" size={17} /></span>
                    <Input
                      ref={inputRef}
                      placeholder="search by name, email, or roll no…"
                      aria-label="search users"
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
                  </div>

                  {showDropdown && filtered.length > 0 && (
                    <div className="k-dd-pop">
                      <div className="k-dd-list" role="listbox" aria-label="users">
                        {filtered.map((u, i) => (
                          <button
                            key={u._id}
                            type="button"
                            role="option"
                            aria-selected={i === highlightIdx}
                            className={`k-dd-opt tp-opt${i === highlightIdx ? ' active' : ''}`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pickUser(u)}
                            onMouseEnter={() => setHighlightIdx(i)}
                          >
                            {avatar(u.name)}
                            <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                              <span className="tp-name">{u.name || 'unknown'}</span>
                              <span className="k-hint" style={{ display: 'block' }}>
                                {u.email || '–'}
                                {u.rollNo ? ` · ${u.rollNo}` : ''}
                                {u.role ? ` · ${u.role}` : ''}
                              </span>
                            </span>
                            {u.profile?.streakCount > 0 && (
                              <Pill tone="orange"><Ico kind="flame" tone="plain" size={12} />{u.profile.streakCount}</Pill>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {showDropdown && search.trim() && filtered.length === 0 && (
                    <div className="k-dd-pop">
                      <div className="k-dd-empty">no users match "{search}"</div>
                    </div>
                  )}
                </div>
              </Field>
            )
          )}

          <Field label="Copy key" hint={<>{copyMeta.hint} · icon: <b>{mood}</b></>}>
            <div className="tp-copykey">
              <Dropdown
                style={{ flex: 1 }}
                options={COPY_KEYS.map((k) => ({ value: k.id, label: k.label, hint: k.hint }))}
                value={copyKey}
                onChange={(v) => {
                  setCopyKey(v);
                  setPreviewTick((t) => t + 1);
                }}
              />
              <MoodPill mood={mood} size="md" />
            </div>
          </Field>

          <Field label="Title (optional)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="leave blank for copy bank" />
          </Field>

          <Field label="Body (optional)">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="leave blank for copy bank" rows={3} />
          </Field>

          <Button block size="lg" icon="send" onClick={send} loading={sending}>
            {sending
              ? 'sending…'
              : audience === 'single'
              ? `send to ${selectedUser?.name || 'user'}`
              : `send to ${audience}`}
          </Button>

          {result && (
            <Banner ok={result.ok}>
              {result.ok
                ? `✓ sent: ${result.data?.sent || 0} / ${result.data?.total || 0}` +
                  (result.data?.skipped ? ` · skipped: ${result.data.skipped}` : '') +
                  (result.data?.failed ? ` · failed: ${result.data.failed}` : '')+
                  (result.data?.note ? ` · ⚠ ${result.data.note}` : '')
                : `✗ ${result.error || 'not sent'}` +
                  (result.data ? ` (sent ${result.data.sent || 0} / ${result.data.total || 0})` : '')}
            </Banner>
          )}
        </div>
      </Card>

      {/* preview */}
      <Card
        title="preview"
        icon="eye"
        tone="purple"
        action={<Button size="sm" variant="secondary" icon="refresh" onClick={() => setPreviewTick((t) => t + 1)} title="cycle through copy variants">rotate</Button>}
      >
        <div className="tp-phone" data-preview="phone">
          <div className="tp-phone-bar">
            <span>now</span>
            <Ico kind="bell" tone="plain" size={14} />
          </div>

          {/* the mood picture that lands on the device */}
          <MoodBigPreview mood={mood} />

          <div className="tp-notif">
            <MoodPill mood={mood} size="md" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="tp-notif-title">{phoneTitle(title || copyMeta.pushTitle || copyMeta.label, mood)}</div>
              <div className="tp-notif-body">{body || <PreviewVariant copyKey={copyKey} tick={previewTick} />}</div>
            </div>
          </div>
        </div>

        <div className="tp-bank">
          {[
            ['type', copyKey],
            ['mood', mood],
            ['icon url', <code key="u">/assets/dots/push/{mood}.png</code>],
            ['sound', <code key="s">{soundFor(copyKey, mood)}.wav</code>],
            ['variants', 'rotates per user · no repeats in a row'],
          ].map(([k, v]) => (
            <div className="k-fact" key={k}><span>{k}</span><span>{v}</span></div>
          ))}
        </div>

        <div className="tp-strip">
          <div className="k-label">all icons</div>
          <div className="tp-strip-row">
            {MOOD_KEYS.map((m) => (
              <MoodPill key={m} mood={m} size="sm" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Preview variant: rotates through a small client-side pool
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
    '{tier} unlocked. {discount}% off just kicked in: go use it before you forget.',
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
// TAB 2: USERS
// ═════════════════════════════════════════════
function UsersTab({ users, totalCount, search, setSearch, loading }) {
  const [nudging, setNudging] = useState(null);

  const sendNudge = async (u) => {
    setNudging(u._id);
    try {
      const res = await engagementApi.nudgeFeature(u._id);
      toast(res?.sent ? `✓ sent: ${res.copyKey}` : `skipped: ${res.reason}`);
    } catch (e) {
      toast(`error: ${e.message}`);
    } finally {
      setNudging(null);
    }
  };

  if (loading) return <Card><PageLoading label="loading users…" minHeight={220} /></Card>;

  return (
    <Card
      title="feature usage"
      icon="users"
      tone="blue"
      action={<Input style={{ maxWidth: 260 }} aria-label="search users" placeholder="search by name / email / roll" value={search} onChange={(e) => setSearch(e.target.value)} />}
    >
      <p className="tp-sub">
        who sorted what · who still has unused features
        {search && ` · showing ${users.length}/${totalCount}`}
      </p>
      <Table
        minWidth={860}
        rows={users.slice(0, 50)}
        empty={<EmptyState icon="users" title={search ? `no users match "${search}"` : 'no users found'} />}
        columns={[
          { key: 'user', label: 'user', render: (u) => userCell(u, u.email || u.rollNo || '–') },
          {
            key: 'sorted',
            label: 'sorted',
            render: (u) => (
              <div className="tp-tags">
                {u.profile.sortedFeatures.length > 0 ? (
                  u.profile.sortedFeatures.slice(0, 4).map((f) => <Pill key={f} tone="green">{f}</Pill>)
                ) : (
                  <Pill tone="sand">none yet</Pill>
                )}
                {u.profile.sortedFeatures.length > 4 && <Pill tone="sand">+{u.profile.sortedFeatures.length - 4}</Pill>}
              </div>
            ),
          },
          {
            key: 'unused',
            label: 'unused',
            render: (u) => (
              <div className="tp-tags">
                {u.profile.unusedFeatures.slice(0, 3).map((f) => <Pill key={f} tone="orange">{f}</Pill>)}
                {u.profile.unusedFeatures.length > 3 && <Pill tone="sand">+{u.profile.unusedFeatures.length - 3}</Pill>}
              </div>
            ),
          },
          { key: 'streak', label: 'streak', render: (u) => <Pill tone={u.profile.streakCount > 0 ? 'orange' : 'sand'}><Ico kind="flame" tone="plain" size={12} />{u.profile.streakCount}</Pill> },
          { key: 'last', label: 'last active', render: (u) => <span className="k-muted">{u.profile.lastActiveAt ? new Date(u.profile.lastActiveAt).toLocaleDateString() : 'never'}</span> },
          {
            key: 'act',
            label: '',
            render: (u) => (
              <Button size="sm" variant="secondary" onClick={() => sendNudge(u)} loading={nudging === u._id} disabled={nudging === u._id || u.profile.unusedFeatures.length === 0}>
                {u.profile.unusedFeatures.length === 0 ? 'fully sorted' : `nudge ${u.profile.unusedFeatures[0]}`}
              </Button>
            ),
          },
        ]}
      />
    </Card>
  );
}

// ═════════════════════════════════════════════
// TAB 3: INACTIVE
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
      toast(e.message);
    } finally {
      setBusy(null);
    }
  };

  const sendBulk = async () => {
    if (!(await confirmDialog(`Send win-back to all ${users.length} inactive users?`))) return;
    setBulk(true);
    try {
      for (const u of users.slice(0, 100)) {
        await engagementApi.nudgeWinBack(u._id, u.daysSinceActive).catch(() => {});
      }
      onRefresh?.();
      toast(`sent win-back to ${Math.min(users.length, 100)} users`);
    } finally {
      setBulk(false);
    }
  };

  const moodForDays = (d) =>
    d >= 30 ? 'ghost' : d >= 14 ? 'excited' : d >= 7 ? 'excited' : 'sleepy';

  return (
    <Card
      title="inactive users"
      icon="clock"
      tone="orange"
      action={users.length > 0 && (
        <Button size="sm" icon="send" onClick={sendBulk} loading={bulk}>{bulk ? 'sending…' : `send to all (${users.length})`}</Button>
      )}
    >
      <p className="tp-sub">haven't opened the app in 3+ days · {users.length} total</p>
      {users.length === 0 ? (
        <EmptyState icon="checkCircle" tone="green" title="everyone is active" />
      ) : (
        <Table
          minWidth={760}
          rows={users.slice(0, 50)}
          columns={[
            { key: 'user', label: 'user', render: (u) => userCell(u, u.email) },
            { key: 'icon', label: 'icon', render: (u) => <MoodPill mood={moodForDays(u.daysSinceActive)} size="sm" /> },
            {
              key: 'days',
              label: 'days inactive',
              render: (u) => (
                <Pill tone={u.daysSinceActive > 14 ? 'red' : u.daysSinceActive > 7 ? 'orange' : 'yellow'}>
                  {u.daysSinceActive === 999 ? 'never' : `${u.daysSinceActive}d`}
                </Pill>
              ),
            },
            { key: 'last', label: 'last active', render: (u) => (u.profile.lastActiveAt ? new Date(u.profile.lastActiveAt).toLocaleDateString() : '–') },
            { key: 'points', label: 'points', render: (u) => u.profile.points },
            { key: 'act', label: '', render: (u) => <Button size="sm" variant="secondary" onClick={() => sendTo(u)} loading={busy === u._id}>send win-back</Button> },
          ]}
        />
      )}
    </Card>
  );
}

// ═════════════════════════════════════════════
// TAB 4: STREAKS
// ═════════════════════════════════════════════
function StreaksTab({ users, onRefresh }) {
  const [sending, setSending] = useState(false);

  const sendAll = async () => {
    if (!(await confirmDialog(`Send streak warning to ${users.length} users?`))) return;
    setSending(true);
    try {
      for (const u of users.slice(0, 100)) {
        await engagementApi.nudgeStreak(u._id).catch(() => {});
      }
      onRefresh?.();
      toast(`sent to ${Math.min(users.length, 100)} users`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card
      title="at-risk streaks"
      icon="flame"
      tone="red"
      action={users.length > 0 && (
        <Button size="sm" icon="send" onClick={sendAll} loading={sending}>{sending ? 'sending…' : `warn all (${users.length})`}</Button>
      )}
    >
      <p className="tp-sub">streak ≥ 2 & no action today · {users.length} users</p>
      {users.length === 0 ? (
        <EmptyState icon="flame" tone="sand" title="no at-risk streaks" />
      ) : (
        <Table
          minWidth={720}
          rows={users.slice(0, 50)}
          columns={[
            { key: 'user', label: 'user', render: (u) => userCell(u, u.email) },
            { key: 'icon', label: 'icon', render: () => <MoodPill mood="panic" size="sm" /> },
            { key: 'streak', label: 'streak', render: (u) => <Pill tone="orange"><Ico kind="flame" tone="plain" size={12} />{u.profile.streakCount}</Pill> },
            { key: 'best', label: 'best', render: (u) => u.profile.streakBest },
            { key: 'freeze', label: 'freezes left', render: (u) => (u.profile.freezesLeft === 0 ? <Pill tone="sand">0</Pill> : <Pill tone="sky"><Ico kind="shield" tone="plain" size={12} />{u.profile.freezesLeft}</Pill>) },
            { key: 'last', label: 'last action', render: (u) => <span className="k-muted">{u.profile.streakLastAction || '–'}</span> },
          ]}
        />
      )}
    </Card>
  );
}

// ═════════════════════════════════════════════
// TAB 5: BROADCASTS
// ═════════════════════════════════════════════
function BroadcastsTab({ onRefresh }) {
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);

  const run = async (id, fn, label) => {
    if (!(await confirmDialog(`Send "${label}" to all users?`))) return;
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
    <Card title="one-click broadcasts" icon="megaphone" tone="purple">
      <p className="tp-sub">pre-built campaigns for common events</p>
      <div className="tp-casts">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            className="tp-cast"
            onClick={() => run(a.id, a.fn, a.label)}
            disabled={busy === a.id}
            aria-busy={busy === a.id || undefined}
          >
            <MoodPill mood={a.mood} size="lg" />
            <span className="tp-cast-text">
              <b>{a.label}</b>
              <span className="k-hint">{a.desc}</span>
            </span>
            <Ico kind="chevronRight" tone="plain" size={18} />
          </button>
        ))}
      </div>

      {result && (
        <div style={{ marginTop: 14 }}>
          <Banner ok={result.ok}>
            {result.ok
              ? `✓ ${result.label}: sent ${result.data?.sent || 0} / ${result.data?.total || 0}`
              : `✗ ${result.label}: ${result.error}`}
          </Banner>
        </div>
      )}
    </Card>
  );
}

// ═════════════════════════════════════════════
// TAB 6: LOGS
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
    <Card
      title="push activity"
      icon="file"
      tone="sand"
      action={
        <div className="k-row">
          <Select size="sm" aria-label="status" style={{ width: 'auto', minWidth: 120 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">all</option>
            <option value="sent">sent</option>
            <option value="failed">failed</option>
          </Select>
          <Button size="sm" variant="secondary" icon="refresh" onClick={load} loading={loading}>refresh</Button>
        </div>
      }
    >
      <p className="tp-sub">last 50 sends · click refresh anytime</p>
      {logs.length === 0 ? (
        loading ? <PageLoading label="loading activity…" minHeight={180} /> : <EmptyState icon="bell" title="no activity yet" />
      ) : (
        <Table
          minWidth={860}
          rows={logs}
          columns={[
            { key: 'user', label: 'user', render: (l) => <span className="tp-name">{l.user?.name || l.userName || '–'}</span> },
            { key: 'icon', label: 'icon', render: (l) => <MoodPill mood={l.mood || 'sorted'} size="sm" /> },
            { key: 'type', label: 'type', render: (l) => <Pill tone="sand">{l.type}</Pill> },
            { key: 'body', label: 'body', render: (l) => <span className="tp-body" title={l.body}>{(l.body || '').slice(0, 60)}</span> },
            {
              key: 'status',
              label: 'status',
              render: (l) => (l.status === 'failed' ? <Pill tone="red">failed</Pill> : l.openedAt ? <Pill tone="green">opened</Pill> : <Pill tone="blue">sent</Pill>),
            },
            { key: 'sent', label: 'sent', render: (l) => (l.sentAt ? new Date(l.sentAt).toLocaleTimeString() : '–') },
            { key: 'opened', label: 'opened', render: (l) => (l.openedAt ? new Date(l.openedAt).toLocaleTimeString() : '–') },
          ]}
        />
      )}
    </Card>
  );
}
