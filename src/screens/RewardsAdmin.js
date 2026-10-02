// src/screens/RewardsAdmin.jsx
// Modern design · WHITE #ffffff · GOLD #f9c349 · BLACK #0f0f0f
// Admin manages rewards + assigns optional brand

import React, { useEffect, useState, useMemo } from 'react';
import { engagementApi } from '../services/api';

const GOLD = '#f9c349';
const GOLD_DARK = '#e0a82e';
const BLACK = '#0f0f0f';
const WHITE = '#ffffff';
const BORDER = 'rgba(15,15,15,0.10)';
const MUTED = 'rgba(15,15,15,0.55)';
const DANGER = '#ef4444';

const KINDS = ['promo_code', 'brand_perk', 'tdc_card_discount'];

export default function RewardsAdmin() {
  const [rewards, setRewards] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [drawerReward, setDrawerReward] = useState(null);
  const [redemptions, setRedemptions] = useState([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  // Brand picker state
  const [brandQuery, setBrandQuery] = useState('');

  const emptyForm = {
    title: '',
    description: '',
    image: '',
    costPoints: 500,
    stock: '',
    perUserLimit: 1,
    validDays: 30,
    kind: 'promo_code',
    active: true,
    brand: '', // '' = platform-wide
  };
  const [form, setForm] = useState(emptyForm);

  // ─── Load rewards + brands ────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const [list, brandList] = await Promise.all([
        engagementApi.listRewards().catch(() => []),
        engagementApi.listBrands
          ? engagementApi.listBrands().catch(() => [])
          : Promise.resolve([]),
      ]);
      setRewards(Array.isArray(list) ? list : []);
      setBrands(Array.isArray(brandList) ? brandList : []);
    } catch (e) {
      console.error('[RewardsAdmin] load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ─── Stats ────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = rewards.length;
    const active = rewards.filter((r) => r.active).length;
    const totalRedeemed = rewards.reduce(
      (s, r) => s + (r.stats?.redeemed || 0),
      0
    );
    const brandLocked = rewards.filter((r) => !!r.brand).length;
    return { total, active, totalRedeemed, brandLocked };
  }, [rewards]);

  // ─── Filtered brands for the dropdown ─────────────────
  const filteredBrands = useMemo(() => {
    if (!brandQuery.trim()) return brands;
    const q = brandQuery.toLowerCase().trim();
    return brands.filter(
      (b) =>
        b.name?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q) ||
        b.city?.toLowerCase().includes(q)
    );
  }, [brands, brandQuery]);

  // ─── Openers ──────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setBrandQuery('');
    setOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      title: r.title || '',
      description: r.description || '',
      image: r.image || '',
      costPoints: r.costPoints ?? 500,
      stock: r.stock ?? '',
      perUserLimit: r.perUserLimit ?? 1,
      validDays: r.validDays ?? 30,
      kind: r.kind || 'promo_code',
      active: r.active !== false,
      brand: r.brand?._id || r.brand || '',
    });
    setBrandQuery('');
    setOpen(true);
  };

  // ─── Save ─────────────────────────────────────────────
  const save = async () => {
    if (!form.title.trim()) return alert('title required');

    const payload = {
      title: form.title.trim(),
      description: form.description || '',
      image: form.image || '',
      costPoints: Number(form.costPoints) || 0,
      stock: form.stock === '' ? null : Number(form.stock),
      perUserLimit: Number(form.perUserLimit || 1),
      validDays: Number(form.validDays || 30),
      kind: form.kind,
      active: !!form.active,
      brand: form.brand && form.brand.trim() ? form.brand : null,
    };

    try {
      if (editing) {
        await engagementApi.updateReward(editing._id, payload);
      } else {
        await engagementApi.createReward(payload);
      }
      setOpen(false);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'failed');
    }
  };

  // ─── Actions ──────────────────────────────────────────
  const toggle = async (r) => {
    setBusyId(r._id);
    try {
      await engagementApi.toggleReward(r._id, !r.active);
      load();
    } catch {
      alert('failed');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (r) => {
    if (!window.confirm(`Delete "${r.title}"? This cannot be undone.`)) return;
    setBusyId(r._id);
    try {
      await engagementApi.deleteReward(r._id);
      load();
    } catch {
      alert('failed');
    } finally {
      setBusyId(null);
    }
  };

  const viewRedemptions = async (r) => {
    setDrawerReward(r);
    setRedemptions([]);
    setRedemptionsLoading(true);
    try {
      const res = await engagementApi.rewardRedemptions(r._id);
      setRedemptions(Array.isArray(res?.items) ? res.items : []);
    } catch {
      setRedemptions([]);
    } finally {
      setRedemptionsLoading(false);
    }
  };

  const cancelRedemption = async (id) => {
    if (!window.confirm('Cancel this redemption and refund points?')) return;
    try {
      await engagementApi.cancelRedemption(id);
      if (drawerReward) viewRedemptions(drawerReward);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'failed');
    }
  };

  // ─── Helpers ──────────────────────────────────────────
  const selectedBrand = brands.find((b) => b._id === form.brand);

  if (loading) return <div style={s.empty}>loading rewards…</div>;

  return (
    <div>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>rewards</h2>
          <p style={s.subtitle}>
            create perks students can spend their points on
          </p>
        </div>
        <button style={s.btnPrimary} onClick={openCreate}>
          + new reward
        </button>
      </div>

      {/* Stats */}
      <div style={s.statsRow}>
        <Stat label="total rewards" value={stats.total} />
        <Stat label="active" value={stats.active} accent />
        <Stat label="brand-locked" value={stats.brandLocked} />
        <Stat label="redeemed" value={stats.totalRedeemed} accent />
      </div>

      {/* List */}
      {rewards.length === 0 ? (
        <div style={s.emptyBox}>
          <div style={s.emptyIcon}>🎁</div>
          <div style={s.emptyTitle}>no rewards yet.</div>
          <div style={s.emptySub}>
            create your first one — students will love it.
          </div>
          <button style={s.btnPrimary} onClick={openCreate}>
            + create reward
          </button>
        </div>
      ) : (
        <div style={s.grid}>
          {rewards.map((r) => (
            <RewardCard
              key={r._id}
              reward={r}
              busy={busyId === r._id}
              onEdit={() => openEdit(r)}
              onToggle={() => toggle(r)}
              onDelete={() => remove(r)}
              onViewRedemptions={() => viewRedemptions(r)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {open && (
        <div style={s.backdrop} onClick={() => setOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>
              {editing ? 'edit reward' : 'create reward'}
            </h3>

            <Field label="title">
              <input
                style={s.input}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 20% off at foo cafe"
              />
            </Field>

            <Field label="description">
              <textarea
                style={{ ...s.input, minHeight: 70, resize: 'vertical' }}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="short line about the perk"
              />
            </Field>

            {/* ✅ BRAND PICKER */}
            <Field
              label={
                selectedBrand
                  ? `brand · ${selectedBrand.name}`
                  : 'brand (leave empty = any brand can redeem)'
              }
            >
              <div style={s.brandPickerWrap}>
                <select
                  style={s.input}
                  value={form.brand || ''}
                  onChange={(e) => {
                    setForm({ ...form, brand: e.target.value });
                    setBrandQuery('');
                  }}
                >
                  <option value="">— platform-wide (any brand) —</option>
                  {filteredBrands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                      {b.category ? ` · ${b.category}` : ''}
                      {b.city ? ` · ${b.city}` : ''}
                    </option>
                  ))}
                </select>

                {brands.length > 6 && (
                  <input
                    style={{ ...s.input, marginTop: 8 }}
                    value={brandQuery}
                    onChange={(e) => setBrandQuery(e.target.value)}
                    placeholder="search brands…"
                  />
                )}

                {selectedBrand && (
                  <div style={s.brandPreview}>
                    {selectedBrand.logo ? (
                      <img
                        src={selectedBrand.logo}
                        alt=""
                        style={s.brandLogo}
                      />
                    ) : (
                      <div style={s.brandLogoFallback}>
                        {selectedBrand.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={s.brandPreviewName}>
                        {selectedBrand.name}
                      </div>
                      <div style={s.brandPreviewMeta}>
                        {selectedBrand.category}
                        {selectedBrand.city ? ` · ${selectedBrand.city}` : ''}
                      </div>
                    </div>
                    <button
                      style={s.brandClearBtn}
                      onClick={() => setForm({ ...form, brand: '' })}
                      type="button"
                    >
                      clear
                    </button>
                  </div>
                )}
              </div>
            </Field>

            <Field label="image url (optional)">
              <input
                style={s.input}
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="https://…"
              />
            </Field>

            <div style={s.twoCol}>
              <Field label="cost (pts)">
                <input
                  type="number"
                  style={s.input}
                  value={form.costPoints}
                  onChange={(e) =>
                    setForm({ ...form, costPoints: e.target.value })
                  }
                />
              </Field>
              <Field label="stock (empty = ∞)">
                <input
                  type="number"
                  style={s.input}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </Field>
            </div>

            <div style={s.twoCol}>
              <Field label="per-user limit">
                <input
                  type="number"
                  style={s.input}
                  value={form.perUserLimit}
                  onChange={(e) =>
                    setForm({ ...form, perUserLimit: e.target.value })
                  }
                />
              </Field>
              <Field label="valid days">
                <input
                  type="number"
                  style={s.input}
                  value={form.validDays}
                  onChange={(e) =>
                    setForm({ ...form, validDays: e.target.value })
                  }
                />
              </Field>
            </div>

            <Field label="kind">
              <select
                style={s.input}
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </Field>

            <label style={s.checkboxRow}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm({ ...form, active: e.target.checked })
                }
              />
              <span style={{ fontWeight: 700, fontSize: 13 }}>
                active (visible to students)
              </span>
            </label>

            <div style={s.modalActions}>
              <button style={s.btnGhost} onClick={() => setOpen(false)}>
                cancel
              </button>
              <button style={s.btnPrimary} onClick={save}>
                {editing ? 'save changes' : 'create reward'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redemptions drawer */}
      {drawerReward && (
        <div style={s.backdrop} onClick={() => setDrawerReward(null)}>
          <div
            style={{ ...s.modal, maxWidth: 820 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h3 style={{ ...s.modalTitle, flex: 1, marginBottom: 0 }}>
                redemptions · {drawerReward.title}
              </h3>
              <button
                style={s.btnGhost}
                onClick={() => setDrawerReward(null)}
              >
                close
              </button>
            </div>

            {redemptionsLoading ? (
              <div style={s.empty}>loading…</div>
            ) : redemptions.length === 0 ? (
              <div style={s.empty}>no redemptions yet.</div>
            ) : (
              <div style={s.tableCard}>
                <table style={s.table}>
                  <thead>
                    <tr style={s.thead}>
                      <th style={s.th}>USER</th>
                      <th style={s.th}>CODE</th>
                      <th style={s.th}>STATUS</th>
                      <th style={s.th}>REDEEMED</th>
                      <th style={s.th}>EXPIRES</th>
                      <th style={s.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptions.map((rd) => (
                      <tr key={rd._id} style={s.tr}>
                        <td style={s.td}>
                          <div style={{ fontWeight: 700 }}>
                            {rd.user?.name || '—'}
                          </div>
                          <div style={s.smallMuted}>
                            {rd.user?.email || ''}
                          </div>
                        </td>
                        <td style={{ ...s.td, fontFamily: 'monospace' }}>
                          {rd.code}
                        </td>
                        <td style={s.td}>
                          <span style={statusPill(rd.status)}>
                            {rd.status}
                          </span>
                        </td>
                        <td style={s.td}>
                          {new Date(rd.createdAt).toLocaleDateString()}
                        </td>
                        <td style={s.td}>
                          {new Date(rd.expiresAt).toLocaleDateString()}
                        </td>
                        <td style={s.td}>
                          {rd.status === 'active' && (
                            <button
                              style={s.btnDangerSm}
                              onClick={() => cancelRedemption(rd._id)}
                            >
                              cancel + refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────
const Stat = ({ label, value, accent }) => (
  <div style={{ ...s.statCard, ...(accent ? s.statCardAccent : {}) }}>
    <div style={{ ...s.statValue, ...(accent ? { color: BLACK } : {}) }}>
      {value}
    </div>
    <div
      style={{
        ...s.statLabel,
        ...(accent ? { color: BLACK, opacity: 0.7 } : {}),
      }}
    >
      {label}
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div style={s.formGroup}>
    <label style={s.label}>{label}</label>
    {children}
  </div>
);

const RewardCard = ({
  reward,
  busy,
  onEdit,
  onToggle,
  onDelete,
  onViewRedemptions,
}) => {
  const r = reward;
  const stockLeft = r.stats?.stockLeft;
  const redeemed = r.stats?.redeemed || 0;
  const activeR = r.stats?.active || 0;
  const usedR = r.stats?.used || 0;
  const expiredR = r.stats?.expired || 0;

  const brandName =
    r.brand?.brandName || r.brand?.name || (r.brand ? 'Brand' : null);

  return (
    <div style={s.rewardCard}>
      <div style={s.rewardTop}>
        <div style={s.rewardImageWrap}>
          {r.image ? (
            <img src={r.image} alt="" style={s.rewardImage} />
          ) : (
            <div style={s.rewardImageFallback}>🎁</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.rewardKind}>
            {r.kind?.replace(/_/g, ' ') || 'promo code'}
          </div>
          <div style={s.rewardTitle} title={r.title}>
            {r.title}
          </div>
          {!!r.description && (
            <div style={s.rewardDesc} title={r.description}>
              {r.description}
            </div>
          )}
          {brandName ? (
            <div style={s.brandTag}>🏪 {brandName}</div>
          ) : (
            <div style={{ ...s.brandTag, ...s.brandTagPlatform }}>
              🌐 platform-wide · any brand
            </div>
          )}
        </div>
      </div>

      <div style={s.rewardMeta}>
        <span style={s.costPill}>★ {r.costPoints}</span>
        <span style={s.metaPill}>
          {stockLeft === null
            ? 'unlimited'
            : stockLeft > 0
            ? `${stockLeft} left`
            : 'sold out'}
        </span>
        <span style={s.metaPill}>limit {r.perUserLimit}/user</span>
        <span style={s.metaPill}>{r.validDays}d valid</span>
        <span
          style={{
            ...s.metaPill,
            background: r.active ? GOLD : 'rgba(15,15,15,0.08)',
            color: r.active ? BLACK : MUTED,
            fontWeight: 800,
          }}
        >
          {r.active ? 'active' : 'inactive'}
        </span>
      </div>

      <div style={s.rewardStats}>
        <div style={s.rewardStatItem}>
          <div style={s.rewardStatValue}>{redeemed}</div>
          <div style={s.rewardStatLabel}>redeemed</div>
        </div>
        <div style={s.rewardStatItem}>
          <div style={s.rewardStatValue}>{activeR}</div>
          <div style={s.rewardStatLabel}>active</div>
        </div>
        <div style={s.rewardStatItem}>
          <div style={s.rewardStatValue}>{usedR}</div>
          <div style={s.rewardStatLabel}>used</div>
        </div>
        <div style={s.rewardStatItem}>
          <div style={s.rewardStatValue}>{expiredR}</div>
          <div style={s.rewardStatLabel}>expired</div>
        </div>
      </div>

      <div style={s.rewardActions}>
        <button style={s.btnGhostSm} onClick={onViewRedemptions}>
          redemptions
        </button>
        <button style={s.btnGhostSm} onClick={onEdit}>
          edit
        </button>
        <button style={s.btnGhostSm} onClick={onToggle} disabled={busy}>
          {r.active ? 'deactivate' : 'activate'}
        </button>
        <button style={s.btnDangerSm} onClick={onDelete} disabled={busy}>
          delete
        </button>
      </div>
    </div>
  );
};

const statusPill = (status) => {
  const base = {
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    display: 'inline-block',
  };
  if (status === 'active') return { ...base, background: GOLD, color: BLACK };
  if (status === 'used') return { ...base, background: BLACK, color: GOLD };
  if (status === 'expired')
    return { ...base, background: 'rgba(15,15,15,0.08)', color: MUTED };
  if (status === 'cancelled')
    return { ...base, background: 'rgba(239,68,68,0.12)', color: DANGER };
  return { ...base, background: '#eee', color: BLACK };
};

// ─── Styles ───────────────────────────────────────────────────────────
const s = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    gap: 16,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 28,
    fontWeight: 900,
    color: BLACK,
    margin: 0,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    margin: '4px 0 0',
    fontWeight: 500,
  },
  btnPrimary: {
    padding: '12px 22px',
    background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
    border: `1.5px solid ${BLACK}`,
    borderRadius: 12,
    fontWeight: 900,
    fontSize: 13,
    cursor: 'pointer',
    color: BLACK,
    letterSpacing: 0.2,
  },
  btnGhost: {
    padding: '10px 20px',
    background: WHITE,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    color: BLACK,
  },
  btnGhostSm: {
    padding: '7px 12px',
    background: WHITE,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    color: BLACK,
  },
  btnDangerSm: {
    padding: '7px 12px',
    background: WHITE,
    border: `1.5px solid rgba(239,68,68,0.4)`,
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    color: DANGER,
  },

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 22,
  },
  statCard: {
    background: WHITE,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 14,
    padding: '14px 16px',
  },
  statCardAccent: {
    background: GOLD,
    borderColor: BLACK,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 900,
    color: BLACK,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 14,
  },

  rewardCard: {
    background: WHITE,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 16,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  rewardTop: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  rewardImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    background: `${GOLD}22`,
    flexShrink: 0,
  },
  rewardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  rewardImageFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
  },
  rewardKind: {
    fontSize: 10,
    fontWeight: 900,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  rewardTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: BLACK,
    lineHeight: 1.25,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  rewardDesc: {
    fontSize: 12,
    color: MUTED,
    marginTop: 4,
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  brandTag: {
    display: 'inline-block',
    fontSize: 11,
    fontWeight: 800,
    color: BLACK,
    background: `${GOLD}55`,
    padding: '3px 9px',
    borderRadius: 999,
    marginTop: 6,
    letterSpacing: 0.2,
    width: 'fit-content',
  },
  brandTagPlatform: {
    background: 'rgba(15,15,15,0.08)',
    color: MUTED,
  },

  rewardMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  costPill: {
    padding: '4px 10px',
    borderRadius: 999,
    background: BLACK,
    color: GOLD,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 0.3,
  },
  metaPill: {
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(15,15,15,0.05)',
    color: BLACK,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.2,
    textTransform: 'lowercase',
  },

  rewardStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
    paddingTop: 10,
    borderTop: `1px dashed ${BORDER}`,
  },
  rewardStatItem: { textAlign: 'center' },
  rewardStatValue: {
    fontSize: 16,
    fontWeight: 900,
    color: BLACK,
  },
  rewardStatLabel: {
    fontSize: 9.5,
    fontWeight: 700,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },

  rewardActions: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    paddingTop: 4,
    borderTop: `1px solid ${BORDER}`,
  },

  empty: {
    padding: 60,
    textAlign: 'center',
    color: MUTED,
    fontSize: 13,
    fontWeight: 600,
  },
  emptyBox: {
    padding: '60px 20px',
    textAlign: 'center',
    background: WHITE,
    border: `1.5px dashed ${BORDER}`,
    borderRadius: 18,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { fontSize: 17, fontWeight: 900, color: BLACK },
  emptySub: { fontSize: 13, color: MUTED, marginBottom: 10 },

  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,15,15,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 20,
    backdropFilter: 'blur(6px)',
  },
  modal: {
    background: WHITE,
    borderRadius: 20,
    padding: 26,
    maxWidth: 560,
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: `1.5px solid ${BORDER}`,
    boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 900,
    color: BLACK,
    margin: '0 0 18px',
    letterSpacing: -0.3,
    textTransform: 'lowercase',
  },
  formGroup: { marginBottom: 14 },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 800,
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  input: {
    width: '100%',
    padding: '11px 13px',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 10,
    fontSize: 13.5,
    outline: 'none',
    fontFamily: 'inherit',
    background: WHITE,
    color: BLACK,
    boxSizing: 'border-box',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    cursor: 'pointer',
  },
  modalActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 18,
    borderTop: `1px solid ${BORDER}`,
    marginTop: 18,
  },

  // Brand picker styles
  brandPickerWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  brandPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: `${GOLD}22`,
    border: `1.5px solid ${GOLD}`,
    borderRadius: 10,
  },
  brandLogo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    objectFit: 'cover',
    flexShrink: 0,
  },
  brandLogoFallback: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: BLACK,
    color: GOLD,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    fontSize: 16,
    flexShrink: 0,
  },
  brandPreviewName: {
    fontSize: 13,
    fontWeight: 800,
    color: BLACK,
  },
  brandPreviewMeta: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  brandClearBtn: {
    padding: '6px 12px',
    background: WHITE,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    color: BLACK,
    cursor: 'pointer',
    flexShrink: 0,
  },

  tableCard: {
    background: WHITE,
    borderRadius: 14,
    border: `1.5px solid ${BORDER}`,
    overflow: 'hidden',
    marginTop: 16,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#fafbfc' },
  th: {
    textAlign: 'left',
    padding: '12px 14px',
    fontSize: 10.5,
    fontWeight: 800,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tr: { borderBottom: `1px solid ${BORDER}` },
  td: { padding: '12px 14px', fontSize: 13, color: BLACK },
  smallMuted: { fontSize: 11, color: MUTED, marginTop: 2 },
};