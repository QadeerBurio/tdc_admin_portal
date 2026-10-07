// src/screens/DropsSchedule.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { engagementApi } from '../services/api';
import api from '../services/api';

const DAYS = 7;
const TYPES = ['internship', 'brand', 'event', 'scholarship', 'confession', 'listing', 'poll'];

// Drop type ↔ linked content kind (kept in sync in the form)
const TYPE_TO_KIND = {
  internship: 'job',
  brand: 'brand',
  event: 'event',
  scholarship: 'scholarship',
  confession: 'confession',
  best_confession: 'confession',
  listing: 'listing',
  poll: 'none',
};
const KIND_TO_TYPE = {
  job: 'internship',
  brand: 'brand',
  event: 'event',
  scholarship: 'scholarship',
  confession: 'confession',
  listing: 'listing',
};

// Exactly what the student's app does when the drop is tapped
const OPENS_IN_APP = {
  none: 'Home (just the question card, no link)',
  job: 'Career → this job opens',
  brand: 'Offer page of this brand',
  event: 'Events → this event opens',
  scholarship: 'Exchange → this program opens',
  confession: 'Social → Confession tab, this post pinned on top',
  listing: 'SkillShare → this listing',
};

// Vote buttons suggested per type (admin can change them)
const DEFAULT_OPTIONS = {
  internship: 'applying, saving it, not for me',
  brand: 'claiming it, maybe later',
  event: 'going, maybe, skip',
  scholarship: 'applying, dream school, not now',
  confession: 'relatable, wild, no way',
  listing: 'interested, not for me',
  poll: '',
};

const MOODS = ['excited', 'broke', 'panic', 'sus', 'shook', 'sleepy', 'cheeky', 'sorted'];

// Day keys in Karachi time (the app and backend use Karachi days)
const karachiDayKey = (d) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

const CONTENT_KINDS = [
  { id: 'none', label: 'No link (just a question)' },
  { id: 'job', label: 'Internship / Job' },
  { id: 'scholarship', label: 'Scholarship' },
  { id: 'event', label: 'Event' },
  { id: 'brand', label: 'Brand / Offer' },
  { id: 'confession', label: 'Confession Post' },
  { id: 'listing', label: 'Skill Listing' },
];

const buildWeek = () => {
  const days = [];
  for (let i = 0; i < DAYS; i++) {
    days.push(karachiDayKey(new Date(Date.now() + i * 86400000)));
  }
  return days;
};

export default function DropsSchedule() {
  const [drops, setDrops] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dayKey: '',
    type: 'brand',
    title: '',
    body: '',
    mood: 'cheeky',
    actionKind: 'react',
    options: '',
    contentKind: 'none',
    contentId: '',
    contentLabel: '',
  });

  // Content picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerItems, setPickerItems] = useState([]);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerError, setPickerError] = useState('');

  const weekDays = buildWeek();

  // ────────────────────────────────────────
  // LOAD DROPS
  // ────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const data = await engagementApi.listDrops(
        weekDays[0],
        weekDays[weekDays.length - 1]
      );
      const list = Array.isArray(data) ? data : [];
      const map = {};
      list.forEach((d) => {
        map[d.dayKey] = d;
      });
      setDrops(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ────────────────────────────────────────
  // EDIT / SAVE
  // ────────────────────────────────────────
  const edit = (dayKey) => {
    const existing = drops[dayKey];
    setForm({
      dayKey,
      type: existing?.type || 'brand',
      title: existing?.title || '',
      body: existing?.body || '',
      mood: existing?.mood || 'cheeky',
      actionKind: existing?.action?.kind || 'react',
      options: (existing?.action?.options || []).join(', '),
      contentKind: existing?.contentRef?.kind || 'none',
      contentId: existing?.contentRef?.id ? String(existing.contentRef.id) : '',
      contentLabel: existing?.contentRef?.label || '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert('add a title (the question students see)');
      return;
    }
    if (form.contentKind !== 'none' && !form.contentId) {
      alert(`pick which ${form.contentKind} this drop opens, or set content type to "No link"`);
      return;
    }
    const optionList = form.options.split(',').map((x) => x.trim()).filter(Boolean);
    if (form.type === 'poll' && optionList.length < 2) {
      alert('a poll needs at least 2 options');
      return;
    }
    const payload = {
      dayKey: form.dayKey,
      type: form.type,
      title: form.title,
      body: form.body,
      mood: form.mood,
      action: {
        kind: form.actionKind,
        options: form.options
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      },
      contentRef:
        form.contentKind !== 'none' && form.contentId.trim()
          ? {
              kind: form.contentKind,
              id: form.contentId.trim(),
              label: form.contentLabel.trim(),
            }
          : null,
    };

    try {
      if (drops[form.dayKey]?._id) {
        await engagementApi.updateDrop(form.dayKey, payload);
      } else {
        await engagementApi.createDrop(payload);
      }
      setOpen(false);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'failed');
    }
  };

  const publishNow = async (dayKey) => {
    if (!window.confirm('publish this drop now?')) return;
    try {
      await engagementApi.publishNow(dayKey);
      load();
    } catch (e) {
      alert('failed');
    }
  };

  // ────────────────────────────────────────
  // CONTENT PICKER — matches your real backend routes
  // ────────────────────────────────────────
  const fetchPickerItems = useCallback(async (kind) => {
    if (!kind || kind === 'none') return;
    setPickerLoading(true);
    setPickerItems([]);
    setPickerError('');

    try {
      let items = [];

      switch (kind) {
        // ─── JOBS ───
        case 'job': {
          const res = await api.get('/jobs/public/all', {
            params: { limit: 100 },
          });
          const list =
            res.data?.jobs ||
            (Array.isArray(res.data) ? res.data : []);
          items = list.map((j) => ({
            id: j._id,
            title: j.title || 'untitled job',
            subtitle: [
              j.companyName || j.department,
              j.location,
              j.type,
            ]
              .filter(Boolean)
              .join(' · '),
          }));
          break;
        }

        // ─── SCHOLARSHIPS ───  (same list the app's Exchange screen uses)
        case 'scholarship': {
          let list = [];
          try {
            const res = await api.get('/admin/exchange/all-admin');
            list = Array.isArray(res.data) ? res.data : res.data?.programs || [];
          } catch (e) {
            const res = await api.get('/admin/exchange/all');
            list = Array.isArray(res.data) ? res.data : res.data?.programs || [];
          }
          items = list.map((p) => ({
            id: p._id,
            title: p.title || 'untitled program',
            subtitle: [
              p.university,
              p.location,
              p.degree,
              p.active === false ? 'inactive (hidden in app)' : null,
            ]
              .filter(Boolean)
              .join(' · '),
          }));
          break;
        }

        // ─── EVENTS ───
        case 'event': {
          const res = await api.get('/events/feed', {
            params: { limit: 100 },
          });
          const list =
            res.data?.events ||
            (Array.isArray(res.data) ? res.data : []);
          items = list.map((e) => ({
            id: e._id,
            title: e.title || 'untitled event',
            subtitle: [
              e.organizer,
              e.location || e.city,
              e.date,
            ]
              .filter(Boolean)
              .join(' · '),
          }));
          break;
        }

        // ─── BRANDS / OFFERS ───
        case 'brand': {
          // /offers/brandss returns all brands with their offers
          const res = await api.get('/offers/brandss');
          const brands = res.data?.brands || [];

          // Flatten: one item per offer, with brand name as subtitle
          items = [];
          brands.forEach((brand) => {
            const brandName = brand.name || 'Brand';
            const offers = brand.offers || [];

            if (offers.length === 0) {
              // If brand has no offers, list the brand itself
              items.push({
                id: brand._id,
                title: brandName,
                subtitle: brand.category || 'no active offers',
              });
            } else {
              offers.forEach((o) => {
                items.push({
                  id: o._id,
                  title: o.title || brandName,
                  subtitle: [
                    brandName,
                    o.discountPercentage ? `${o.discountPercentage}% off` : null,
                    o.category,
                  ]
                    .filter(Boolean)
                    .join(' · '),
                });
              });
            }
          });
          break;
        }

        // ─── CONFESSIONS ───  (same feed the app shows)
        case 'confession': {
          const res = await api.get('/social/confessions/feed');
          const list = (Array.isArray(res.data)
            ? res.data
            : res.data?.confessions || []
          ).filter((c) => c.visibility !== 'campus'); // Daily Drops are public only
          items = list.map((c) => {
            const text = (c.text || '').replace(/\s+/g, ' ').trim();
            return {
              id: c._id,
              title: text
                ? text.length > 70
                  ? `${text.slice(0, 70)}…`
                  : text
                : c.image
                ? '[image confession]'
                : 'confession',
              subtitle: [
                c.campusName || c.location || 'anonymous',
                `${c.likes || 0} likes`,
                `${(c.comments || []).length} comments`,
                c.createdAt ? new Date(c.createdAt).toLocaleDateString() : null,
              ]
                .filter(Boolean)
                .join(' · '),
            };
          });
          break;
        }

        // ─── LISTINGS ───
        case 'listing': {
          const res = await api.get('/listings', {
            params: { limit: 100 },
          });
          const list =
            res.data?.listings ||
            (Array.isArray(res.data) ? res.data : []);
          items = list.map((l) => ({
            id: l._id,
            title: l.title || 'untitled listing',
            subtitle: [
              l.type,
              l.skillOffered?.skillName || l.skillWanted?.skillName,
              l.price ? `rs ${l.price}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
          }));
          break;
        }

        default:
          items = [];
      }

      // Filter out items with missing id or title
      items = items.filter((it) => it.id && it.title);
      setPickerItems(items);

      if (items.length === 0) {
        setPickerError('no items found in database.');
      }
    } catch (e) {
      console.error('[picker] fetch error:', e);
      const status = e?.response?.status;
      const message = e?.response?.data?.message || e?.message || 'failed';
      setPickerError(
        status === 404
          ? 'endpoint not found — check your backend.'
          : `failed to load: ${message}`
      );
      setPickerItems([]);
    } finally {
      setPickerLoading(false);
    }
  }, []);

  const openPicker = (kind) => {
    setPickerQuery('');
    setPickerOpen(true);
    fetchPickerItems(kind);
  };

  const pickItem = (item) => {
    setForm((f) => ({
      ...f,
      contentId: item.id,
      contentLabel: item.title,
    }));
    setPickerOpen(false);
  };

  const clearContent = () => {
    setForm((f) => ({
      ...f,
      contentKind: 'none',
      contentId: '',
      contentLabel: '',
    }));
  };

  const filteredPicker = pickerItems.filter((it) => {
    if (!pickerQuery.trim()) return true;
    const q = pickerQuery.toLowerCase();
    return (
      it.title.toLowerCase().includes(q) ||
      (it.subtitle || '').toLowerCase().includes(q)
    );
  });

  const rows = weekDays.map((dayKey) => ({
    dayKey,
    ...(drops[dayKey] || { status: 'empty' }),
  }));

  if (loading) return <div style={s.empty}>loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Drops Schedule</h2>
        <button style={s.btnGhost} onClick={load}>
          refresh
        </button>
      </div>

      <div style={s.card}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={s.th}>DAY</th>
              <th style={s.th}>TYPE</th>
              <th style={s.th}>TITLE</th>
              <th style={s.th}>LINKED CONTENT</th>
              <th style={s.th}>STATUS</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.dayKey} style={s.tr}>
                <td style={s.td}>
                  <code style={{ fontSize: 12 }}>{r.dayKey}</code>
                  {r.dayKey === weekDays[0] && (
                    <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: '#b45309' }}>
                      TODAY
                    </span>
                  )}
                </td>
                <td style={s.td}>{r.type || '—'}</td>
                <td style={s.td}>
                  {r.title || (
                    <span style={{ color: '#94a3b8' }}>no drop scheduled</span>
                  )}
                </td>
                <td style={s.td}>
                  {r.contentRef?.kind ? (
                    <span style={s.linkPill}>
                      {r.contentRef.kind}
                      {r.contentRef.label
                        ? ` · ${r.contentRef.label.slice(0, 24)}`
                        : r.contentRef.id
                        ? ` · ${String(r.contentRef.id).slice(-6)}`
                        : ''}
                    </span>
                  ) : (
                    <span style={{ color: '#cbd5e1' }}>—</span>
                  )}
                </td>
                <td style={s.td}>
                  <span
                    style={
                      r.status === 'live'
                        ? s.statusLive
                        : r.status === 'scheduled'
                        ? s.statusScheduled
                        : s.statusEmpty
                    }
                  >
                    {r.status || 'empty'}
                  </span>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={s.btnGhostSm} onClick={() => edit(r.dayKey)}>
                      {r._id ? 'edit' : 'create'}
                    </button>
                    {r._id && r.status !== 'live' && (
                      <button
                        style={s.btnPrimarySm}
                        onClick={() => publishNow(r.dayKey)}
                      >
                        publish now
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div style={s.backdrop} onClick={() => setOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Edit Drop — {form.dayKey}</h3>

            <div style={s.formGroup}>
              <label style={s.label}>Type</label>
              <select
                style={s.input}
                value={form.type}
                onChange={(e) => {
                  const type = e.target.value;
                  const kind = TYPE_TO_KIND[type] || 'none';
                  const kindChanged = kind !== form.contentKind;
                  setForm((f) => ({
                    ...f,
                    type,
                    contentKind: kind,
                    contentId: kindChanged ? '' : f.contentId,
                    contentLabel: kindChanged ? '' : f.contentLabel,
                    options: f.options.trim() ? f.options : DEFAULT_OPTIONS[type] || '',
                  }));
                  if (kind !== 'none' && kindChanged) openPicker(kind);
                }}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Title (the question)</label>
              <input
                style={s.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="biryani or karahi at 2am?"
              />
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Body (optional sub-line)</label>
              <textarea
                style={{ ...s.input, minHeight: 70 }}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
            >
              <div style={s.formGroup}>
                <label style={s.label}>Mood</label>
                <select
                  style={s.input}
                  value={form.mood}
                  onChange={(e) => setForm({ ...form, mood: e.target.value })}
                >
                  {MOODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Action Kind</label>
                <select
                  style={s.input}
                  value={form.actionKind}
                  onChange={(e) =>
                    setForm({ ...form, actionKind: e.target.value })
                  }
                >
                  {['react', 'vote', 'save', 'rsvp', 'interest', 'match'].map(
                    (a) => (
                      <option key={a}>{a}</option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Options (comma separated)</label>
              <input
                style={s.input}
                value={form.options}
                onChange={(e) => setForm({ ...form, options: e.target.value })}
                placeholder="biryani, karahi"
              />
              <div style={s.hint}>
                these are the vote buttons. leave empty to show only the "view" button.
              </div>
            </div>

            <div style={s.divider}>
              <span style={s.dividerLabel}>link to content (optional)</span>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Content Type</label>
              <select
                style={s.input}
                value={form.contentKind}
                onChange={(e) => {
                  const kind = e.target.value;
                  setForm((f) => ({
                    ...f,
                    contentKind: kind,
                    contentId: '',
                    contentLabel: '',
                    type: KIND_TO_TYPE[kind] || (kind === 'none' ? 'poll' : f.type),
                  }));
                  if (kind !== 'none') {
                    openPicker(kind);
                  }
                }}
              >
                {CONTENT_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            {form.contentKind !== 'none' && (
              <div style={s.formGroup}>
                <label style={s.label}>Selected {form.contentKind}</label>

                {form.contentId ? (
                  <div style={s.selectedChip}>
                    <div style={s.selectedChipLeft}>
                      <span style={s.selectedChipDot}>●</span>
                      <div>
                        <div style={s.selectedChipTitle}>
                          {form.contentLabel || form.contentId}
                        </div>
                        <div style={s.selectedChipId}>
                          {form.contentId.slice(-12)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={s.btnGhostSm}
                        onClick={() => openPicker(form.contentKind)}
                      >
                        change
                      </button>
                      <button style={s.btnDangerSm} onClick={clearContent}>
                        remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    style={s.pickerOpenBtn}
                    onClick={() => openPicker(form.contentKind)}
                  >
                    <span style={s.pickerOpenBtnIcon}>🔍</span>
                    Search & select a {form.contentKind}…
                  </button>
                )}
              </div>
            )}

            <div style={s.opensBox}>
              <span style={s.opensLabel}>in the app, tapping this drop opens:</span>
              <span style={s.opensValue}>
                {OPENS_IN_APP[form.contentKind] || OPENS_IN_APP.none}
                {form.contentLabel ? ` (${form.contentLabel.slice(0, 40)})` : ''}
              </span>
              <span style={s.opensNote}>
                shows on the home screen only on {form.dayKey} once it's live
                (19:00 automatically, or press "publish now").
              </span>
            </div>

            <div style={s.modalActions}>
              <button style={s.btnGhost} onClick={() => setOpen(false)}>
                cancel
              </button>
              <button style={s.btnPrimary} onClick={save}>
                save
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div style={s.backdrop2} onClick={() => setPickerOpen(false)}>
          <div style={s.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div style={s.pickerHeader}>
              <h3 style={s.pickerTitle}>pick a {form.contentKind}</h3>
              <button
                style={s.pickerCloseBtn}
                onClick={() => setPickerOpen(false)}
              >
                ×
              </button>
            </div>

            <div style={s.pickerSearchWrap}>
              <span style={s.pickerSearchIcon}>🔎</span>
              <input
                style={s.pickerSearchInput}
                placeholder="search by name…"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                autoFocus
              />
              {pickerQuery && (
                <button
                  style={s.pickerClearBtn}
                  onClick={() => setPickerQuery('')}
                >
                  ×
                </button>
              )}
            </div>

            {pickerLoading ? (
              <div style={s.pickerLoader}>
                <div style={s.spinner} />
                <span style={s.pickerLoaderText}>loading from database…</span>
              </div>
            ) : pickerError ? (
              <div style={s.pickerError}>{pickerError}</div>
            ) : filteredPicker.length === 0 ? (
              <div style={s.pickerEmpty}>
                {pickerQuery
                  ? 'no matches for your search.'
                  : 'nothing here.'}
              </div>
            ) : (
              <div style={s.pickerList}>
                {filteredPicker.map((it) => {
                  const isSelected = form.contentId === it.id;
                  return (
                    <button
                      key={it.id}
                      style={{
                        ...s.pickerRow,
                        ...(isSelected ? s.pickerRowSelected : {}),
                      }}
                      onClick={() => pickItem(it)}
                    >
                      <div style={s.pickerRowLeft}>
                        <div
                          style={{
                            ...s.pickerRowAvatar,
                            background: isSelected ? '#0f172a' : '#fef3c7',
                            color: isSelected ? '#f9c349' : '#b8860b',
                          }}
                        >
                          {it.title.charAt(0).toUpperCase()}
                        </div>
                        <div style={s.pickerRowText}>
                          <div style={s.pickerRowTitle}>{it.title}</div>
                          {it.subtitle && (
                            <div style={s.pickerRowSubtitle}>{it.subtitle}</div>
                          )}
                        </div>
                      </div>
                      <div style={s.pickerRowRight}>
                        {isSelected ? (
                          <span style={s.pickerCheck}>✓</span>
                        ) : (
                          <span style={s.pickerArrow}>→</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={s.pickerFooter}>
              <span style={s.pickerFooterText}>
                {filteredPicker.length}{' '}
                {filteredPicker.length === 1 ? 'result' : 'results'}
              </span>
              <button style={s.btnGhost} onClick={() => setPickerOpen(false)}>
                close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════
// STYLES (unchanged from before)
// ══════════════════════════════════════════════
const s = {
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  opensBox: {
    marginTop: 14,
    padding: '10px 12px',
    background: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  },
  opensLabel: { fontSize: 11, color: '#92400e', textTransform: 'lowercase' },
  opensValue: { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  opensNote: { fontSize: 11, color: '#a16207' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 },
  card: {
    background: '#fff',
    borderRadius: 14,
    border: '1px solid #f1f5f9',
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#fafbfc' },
  th: {
    textAlign: 'left',
    padding: '12px 16px',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '14px 16px', fontSize: 13, color: '#1e293b' },
  btnPrimary: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #f9c349 0%, #ff961a 100%)',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    color: '#0f172a',
  },
  btnGhost: {
    padding: '10px 18px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  btnGhostSm: {
    padding: '6px 12px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
    color: '#1e293b',
  },
  btnPrimarySm: {
    padding: '6px 12px',
    background: 'linear-gradient(135deg, #f9c349 0%, #ff961a 100%)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    color: '#0f172a',
  },
  btnDangerSm: {
    padding: '6px 12px',
    background: '#fff',
    border: '1px solid #fecaca',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
    color: '#dc2626',
  },
  empty: { padding: 60, textAlign: 'center', color: '#94a3b8' },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20,
  },
  backdrop2: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: 20,
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    padding: 28,
    maxWidth: 560,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#0f172a',
    marginTop: 0,
    marginBottom: 20,
  },
  formGroup: { marginBottom: 14 },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #e2e8f0',
    borderRadius: 10,
    fontSize: 13,
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 16,
    borderTop: '1px solid #f1f5f9',
    marginTop: 16,
  },
  divider: {
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 16,
    borderTop: '1px dashed #e2e8f0',
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: '#f9c349',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  linkPill: {
    display: 'inline-block',
    padding: '3px 8px',
    background: '#fffbee',
    color: '#b8860b',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
    border: '1px solid #f9c34940',
  },
  statusLive: {
    padding: '2px 8px',
    background: '#10b98115',
    color: '#059669',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  statusScheduled: {
    padding: '2px 8px',
    background: '#f9c34920',
    color: '#b8860b',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  statusEmpty: {
    padding: '2px 8px',
    background: '#f1f5f9',
    color: '#94a3b8',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 700,
  },
  selectedChip: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    background: '#fffbee',
    border: '1.5px solid #f9c34940',
    borderRadius: 12,
    gap: 10,
  },
  selectedChipLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  selectedChipDot: { color: '#f9c349', fontSize: 14 },
  selectedChipTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#0f172a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  selectedChipId: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  pickerOpenBtn: {
    width: '100%',
    padding: '14px 16px',
    background: '#f8fafc',
    border: '2px dashed #cbd5e1',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  pickerOpenBtnIcon: { fontSize: 16 },
  pickerModal: {
    background: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
  },
  pickerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 22px 14px',
    borderBottom: '1px solid #f1f5f9',
  },
  pickerTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    textTransform: 'lowercase',
  },
  pickerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: '#f1f5f9',
    border: 'none',
    cursor: 'pointer',
    fontSize: 20,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSearchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '14px 22px 6px',
    padding: '10px 14px',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    position: 'relative',
  },
  pickerSearchIcon: { fontSize: 14, color: '#94a3b8' },
  pickerSearchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 14,
    background: 'transparent',
    color: '#0f172a',
  },
  pickerClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    background: '#e2e8f0',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerLoader: {
    padding: '60px 22px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid #e2e8f0',
    borderTopColor: '#f9c349',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  pickerLoaderText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'lowercase',
  },
  pickerEmpty: {
    padding: '60px 22px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    textTransform: 'lowercase',
  },
  pickerError: {
    padding: '40px 22px',
    textAlign: 'center',
    color: '#dc2626',
    fontSize: 13,
    fontWeight: 600,
    background: '#fef2f2',
    margin: '14px 22px',
    borderRadius: 12,
  },
  pickerList: {
    flex: 1,
    overflowY: 'auto',
    padding: '6px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  pickerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '12px 12px',
    background: '#fff',
    border: '1.5px solid #f1f5f9',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  pickerRowSelected: {
    background: '#fffbee',
    borderColor: '#f9c349',
  },
  pickerRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  pickerRowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 900,
    flexShrink: 0,
  },
  pickerRowText: { flex: 1, minWidth: 0 },
  pickerRowTitle: {
    fontSize: 13.5,
    fontWeight: 700,
    color: '#0f172a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pickerRowSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    marginTop: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pickerRowRight: { flexShrink: 0 },
  pickerCheck: { color: '#f9c349', fontSize: 18, fontWeight: 900 },
  pickerArrow: { color: '#cbd5e1', fontSize: 16 },
  pickerFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 22px 18px',
    borderTop: '1px solid #f1f5f9',
  },
  pickerFooterText: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'lowercase',
  },
};

// Spinner keyframes
if (typeof document !== 'undefined' && !document.getElementById('__tdc_spinner__')) {
  const styleEl = document.createElement('style');
  styleEl.id = '__tdc_spinner__';
  styleEl.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(styleEl);
}