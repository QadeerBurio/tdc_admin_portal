// src/screens/DropsSchedule.js
// Daily drops (design/portal/AdDrops): one question a day at the top of the app's home screen.
import React, { useEffect, useState, useCallback } from 'react';
import { engagementApi } from '../services/api';
import api from '../services/api';
import Ico from '../portal/Ico';
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Select, SearchInput, Modal, Table, EmptyState, Pill, toast, confirmDialog } from '../portal/kit';

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

const STATUS_TONE = { live: 'green', scheduled: 'blue' };

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
      toast('add a title (the question students see)');
      return;
    }
    if (form.contentKind !== 'none' && !form.contentId) {
      toast(`pick which ${form.contentKind} this drop opens, or set content type to "No link"`);
      return;
    }
    const optionList = form.options.split(',').map((x) => x.trim()).filter(Boolean);
    if (form.type === 'poll' && optionList.length < 2) {
      toast('a poll needs at least 2 options');
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
      toast(e?.response?.data?.message || 'failed');
    }
  };

  const publishNow = async (dayKey) => {
    if (!(await confirmDialog('publish this drop now?'))) return;
    try {
      await engagementApi.publishNow(dayKey);
      load();
    } catch (e) {
      toast('failed');
    }
  };

  // ────────────────────────────────────────
  // CONTENT PICKER: matches your real backend routes
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
          ? 'endpoint not found: check your backend.'
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

  if (loading) return <div className="tdcp k-page"><PageLoading label="loading drops…" /></div>;

  return (
    <div className="tdcp k-page" data-screen="drops">
      <PageHeader
        title="drops schedule"
        sub="one question a day at the top of the app's home screen."
        actions={<Button variant="secondary" icon="refresh" onClick={load}>refresh</Button>}
      />

      <Table
        minWidth={860}
        rows={rows}
        rowKey={(r) => r.dayKey}
        columns={[
          {
            key: 'day',
            label: 'day',
            render: (r) => (
              <span className="k-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                <code style={{ fontSize: 13 }}>{r.dayKey}</code>
                {r.dayKey === weekDays[0] && <Pill tone="yellow">today</Pill>}
              </span>
            ),
          },
          { key: 'type', label: 'type', render: (r) => r.type || '–' },
          { key: 'title', label: 'title', render: (r) => r.title || <span className="k-muted">no drop scheduled</span> },
          {
            key: 'link',
            label: 'linked content',
            render: (r) =>
              r.contentRef?.kind ? (
                <Pill tone="sand">
                  {r.contentRef.kind}
                  {r.contentRef.label
                    ? ` · ${r.contentRef.label.slice(0, 24)}`
                    : r.contentRef.id
                    ? ` · ${String(r.contentRef.id).slice(-6)}`
                    : ''}
                </Pill>
              ) : (
                <span className="k-muted">–</span>
              ),
          },
          { key: 'status', label: 'status', render: (r) => <Pill tone={STATUS_TONE[r.status] || 'sand'} dot>{r.status || 'empty'}</Pill> },
          {
            key: 'act',
            label: '',
            render: (r) => (
              <div className="k-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                <Button size="sm" variant="secondary" icon={r._id ? 'edit' : 'plus'} onClick={() => edit(r.dayKey)}>
                  {r._id ? 'edit' : 'create'}
                </Button>
                {r._id && r.status !== 'live' && (
                  <Button size="sm" icon="send" onClick={() => publishNow(r.dayKey)}>
                    publish now
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* edit / create */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon="spark"
        tone="yellow"
        title={`Edit Drop: ${form.dayKey}`}
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>cancel</Button>
          <Button onClick={save}>save</Button>
        </>}
      >
        <Field label="Type" htmlFor="drop-type">
          <Select
            id="drop-type"
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
          </Select>
        </Field>

        <Field label="Title (the question)" htmlFor="drop-title">
          <Input id="drop-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="biryani or karahi at 2am?" />
        </Field>

        <Field label="Body (optional sub-line)" htmlFor="drop-body">
          <Textarea id="drop-body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>

        <div className="k-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
          <Field label="Mood" htmlFor="drop-mood">
            <Select id="drop-mood" value={form.mood} onChange={(e) => setForm({ ...form, mood: e.target.value })}>
              {MOODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Action Kind" htmlFor="drop-action">
            <Select id="drop-action" value={form.actionKind} onChange={(e) => setForm({ ...form, actionKind: e.target.value })}>
              {['react', 'vote', 'save', 'rsvp', 'interest', 'match'].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Options (comma separated)" htmlFor="drop-options" hint={'these are the vote buttons. leave empty to show only the "view" button.'}>
          <Input id="drop-options" value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="biryani, karahi" />
        </Field>

        <div className="k-label" style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>link to content (optional)</div>

        <Field label="Content Type" htmlFor="drop-kind">
          <Select
            id="drop-kind"
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
          </Select>
        </Field>

        {form.contentKind !== 'none' && (
          <Field label={`Selected ${form.contentKind}`}>
            {form.contentId ? (
              <div className="k-row" style={{ justifyContent: 'space-between', padding: '10px 12px', borderRadius: 16, background: 'var(--yellow-soft)' }}>
                <div style={{ minWidth: 0 }}>
                  <b style={{ overflowWrap: 'anywhere' }}>{form.contentLabel || form.contentId}</b>
                  <div className="k-hint"><code>{form.contentId.slice(-12)}</code></div>
                </div>
                <div className="k-row" style={{ gap: 6 }}>
                  <Button size="sm" variant="secondary" onClick={() => openPicker(form.contentKind)}>change</Button>
                  <Button size="sm" variant="danger" onClick={clearContent}>remove</Button>
                </div>
              </div>
            ) : (
              <Button variant="secondary" icon="search" onClick={() => openPicker(form.contentKind)} style={{ justifyContent: 'flex-start' }}>
                Search & select a {form.contentKind}…
              </Button>
            )}
          </Field>
        )}

        <div className="k-note">
          <div className="k-hint">in the app, tapping this drop opens:</div>
          <b>
            {OPENS_IN_APP[form.contentKind] || OPENS_IN_APP.none}
            {form.contentLabel ? ` (${form.contentLabel.slice(0, 40)})` : ''}
          </b>
          <div className="k-hint" style={{ marginTop: 4 }}>
            shows on the home screen only on {form.dayKey} once it's live
            (19:00 automatically, or press "publish now").
          </div>
        </div>
      </Modal>

      {/* content picker */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        icon="search"
        tone="sand"
        title={`pick a ${form.contentKind}`}
        footer={<>
          <span className="k-hint" style={{ marginRight: 'auto', alignSelf: 'center' }}>
            {filteredPicker.length}{' '}
            {filteredPicker.length === 1 ? 'result' : 'results'}
          </span>
          <Button variant="secondary" onClick={() => setPickerOpen(false)}>close</Button>
        </>}
      >
        <SearchInput placeholder="search by name…" aria-label="search content" value={pickerQuery} onChange={(e) => setPickerQuery(e.target.value)} autoFocus />

        {pickerLoading ? (
          <PageLoading label="loading from database…" minHeight={180} />
        ) : pickerError ? (
          <div className="k-note bad">{pickerError}</div>
        ) : filteredPicker.length === 0 ? (
          <EmptyState icon="search" title={pickerQuery ? 'no matches for your search.' : 'nothing here.'} />
        ) : (
          <div className="k-dd-list" role="listbox" aria-label="content" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filteredPicker.map((it) => {
              const isSelected = form.contentId === it.id;
              return (
                <button
                  type="button"
                  key={it.id}
                  role="option"
                  aria-selected={isSelected}
                  className="k-dd-opt"
                  style={{ border: 0, background: isSelected ? undefined : 'transparent', font: 'inherit', color: 'inherit', textAlign: 'left', width: '100%' }}
                  onClick={() => pickItem(it)}
                >
                  <span className="k-row" style={{ flexWrap: 'nowrap', minWidth: 0 }}>
                    <Ico kind="tag" tone={isSelected ? 'ink' : 'yellow'} size={34} />
                    <span style={{ minWidth: 0 }}>
                      <b style={{ display: 'block', overflowWrap: 'anywhere' }}>{it.title}</b>
                      {it.subtitle && <span className="k-hint">{it.subtitle}</span>}
                    </span>
                  </span>
                  <Ico kind={isSelected ? 'check' : 'chevronRight'} tone="plain" size={16} />
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
