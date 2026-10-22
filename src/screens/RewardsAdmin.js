// src/screens/RewardsAdmin.js
// Rewards (design/portal/AdRewards): brand perks students unlock with crew points.
import React, { useEffect, useState, useMemo } from 'react';
import { engagementApi } from '../services/api';
import Ico from '../portal/Ico';
import { PageHeader, PageLoading, Button, Field, Input, Textarea, Select, Dropdown, Checkbox, StatCard, Modal, Table, EmptyState, Pill, toast, confirmDialog } from '../portal/kit';
import './styles/RewardsAdmin.css';

const KINDS = ['promo_code', 'brand_perk', 'tdc_card_discount'];
const STATUS_TONE = { active: 'yellow', used: 'ink', expired: 'sand', cancelled: 'red' };

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
    if (!form.title.trim()) return toast('title required');

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
      toast(e?.response?.data?.message || 'failed');
    }
  };

  // ─── Actions ──────────────────────────────────────────
  const toggle = async (r) => {
    setBusyId(r._id);
    try {
      await engagementApi.toggleReward(r._id, !r.active);
      load();
    } catch {
      toast('failed');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (r) => {
    if (!(await confirmDialog(`Delete "${r.title}"? This cannot be undone.`))) return;
    setBusyId(r._id);
    try {
      await engagementApi.deleteReward(r._id);
      load();
    } catch {
      toast('failed');
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
    if (!(await confirmDialog('Cancel this redemption and refund points?'))) return;
    try {
      await engagementApi.cancelRedemption(id);
      if (drawerReward) viewRedemptions(drawerReward);
      load();
    } catch (e) {
      toast(e?.response?.data?.message || 'failed');
    }
  };

  // ─── Helpers ──────────────────────────────────────────
  const selectedBrand = brands.find((b) => b._id === form.brand);

  if (loading) return <div className="tdcp k-page"><PageLoading label="loading rewards…" /></div>;

  return (
    <div className="tdcp k-page" data-screen="rewards">
      <PageHeader
        title="rewards"
        sub="brand perks students unlock with crew points."
        actions={<Button icon="plus" onClick={openCreate}>new reward</Button>}
      />

      <div className="k-stats">
        <StatCard label="total rewards" value={stats.total} icon="gift" tone="sand" />
        <StatCard label="active" value={stats.active} icon="checkCircle" tone="yellow" />
        <StatCard label="brand-locked" value={stats.brandLocked} icon="store" tone="purple" />
        <StatCard label="redeemed" value={stats.totalRedeemed} icon="ticket" tone="yellow" />
      </div>

      {rewards.length === 0 ? (
        <div className="k-card">
          <EmptyState icon="gift" tone="yellow" title="no rewards yet." text="create your first one: students will love it." action={<Button icon="plus" onClick={openCreate}>create reward</Button>} />
        </div>
      ) : (
        <div className="k-grid">
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

      {/* create / edit */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        icon={editing ? 'edit' : 'plus'}
        tone="yellow"
        title={editing ? 'edit reward' : 'create reward'}
        footer={<>
          <Button variant="secondary" onClick={() => setOpen(false)}>cancel</Button>
          <Button onClick={save}>{editing ? 'save changes' : 'create reward'}</Button>
        </>}
      >
        <Field label="title" htmlFor="rw-title">
          <Input id="rw-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. 20% off at foo cafe" />
        </Field>

        <Field label="description" htmlFor="rw-desc">
          <Textarea id="rw-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="short line about the perk" />
        </Field>

        <Field label={selectedBrand ? `brand · ${selectedBrand.name}` : 'brand (leave empty = any brand can redeem)'}>
          <Dropdown
            searchable={brands.length > 6}
            placeholder="platform-wide (any brand)"
            value={form.brand || ''}
            onChange={(v) => {
              setForm({ ...form, brand: v });
              setBrandQuery('');
            }}
            options={[
              { value: '', label: 'platform-wide (any brand)' },
              ...filteredBrands.map((b) => ({ value: b._id, label: b.name, hint: [b.category, b.city].filter(Boolean).join(' · ') })),
            ]}
          />
          {selectedBrand && (
            <div className="rw-brand">
              {selectedBrand.logo ? <img src={selectedBrand.logo} alt="" /> : <span className="rw-brand-ph">{selectedBrand.name.charAt(0)}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{selectedBrand.name}</b>
                <div className="k-hint">
                  {selectedBrand.category}
                  {selectedBrand.city ? ` · ${selectedBrand.city}` : ''}
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setForm({ ...form, brand: '' })}>clear</Button>
            </div>
          )}
        </Field>

        <Field label="image url (optional)" htmlFor="rw-image">
          <Input id="rw-image" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" />
        </Field>

        <div className="rw-two">
          <Field label="cost (pts)" htmlFor="rw-cost">
            <Input id="rw-cost" type="number" value={form.costPoints} onChange={(e) => setForm({ ...form, costPoints: e.target.value })} />
          </Field>
          <Field label="stock (empty = ∞)" htmlFor="rw-stock">
            <Input id="rw-stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </Field>
          <Field label="per-user limit" htmlFor="rw-limit">
            <Input id="rw-limit" type="number" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} />
          </Field>
          <Field label="valid days" htmlFor="rw-days">
            <Input id="rw-days" type="number" value={form.validDays} onChange={(e) => setForm({ ...form, validDays: e.target.value })} />
          </Field>
        </div>

        <Field label="kind" htmlFor="rw-kind">
          <Select id="rw-kind" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </Field>

        <Checkbox checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} label={<b>active (visible to students)</b>} />
      </Modal>

      {/* redemptions */}
      <Modal
        open={!!drawerReward}
        onClose={() => setDrawerReward(null)}
        size="lg"
        icon="ticket"
        tone="purple"
        title={drawerReward ? `redemptions · ${drawerReward.title}` : ''}
        footer={<Button variant="secondary" onClick={() => setDrawerReward(null)}>close</Button>}
      >
        {redemptionsLoading ? (
          <PageLoading label="loading redemptions…" minHeight={180} />
        ) : redemptions.length === 0 ? (
          <EmptyState icon="ticket" title="no redemptions yet." />
        ) : (
          <Table
            minWidth={700}
            rows={redemptions}
            columns={[
              { key: 'user', label: 'user', render: (rd) => <><b>{rd.user?.name || '–'}</b><div className="k-hint">{rd.user?.email || ''}</div></> },
              { key: 'code', label: 'code', render: (rd) => <code>{rd.code}</code> },
              { key: 'status', label: 'status', render: (rd) => <Pill tone={STATUS_TONE[rd.status] || 'sand'}>{rd.status}</Pill> },
              { key: 'redeemed', label: 'redeemed', render: (rd) => new Date(rd.createdAt).toLocaleDateString() },
              { key: 'expires', label: 'expires', render: (rd) => new Date(rd.expiresAt).toLocaleDateString() },
              {
                key: 'act',
                label: '',
                render: (rd) => rd.status === 'active' && (
                  <Button size="sm" variant="danger" onClick={() => cancelRedemption(rd._id)}>cancel + refund</Button>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}

// ─── Reward card ──────────────────────────────────────────────────────
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
    <article className="k-card rw-card">
      <div className="rw-top">
        {r.image ? <img src={r.image} alt="" className="rw-img" /> : <Ico kind="gift" tone="yellow" size={56} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="k-hint">{r.kind?.replace(/_/g, ' ') || 'promo code'}</div>
          <h3 className="rw-title" title={r.title}>{r.title}</h3>
          {!!r.description && <p className="rw-desc" title={r.description}>{r.description}</p>}
          {brandName ? (
            <Pill tone="purple"><Ico kind="store" tone="plain" size={12} />{brandName}</Pill>
          ) : (
            <Pill tone="sand"><Ico kind="globe" tone="plain" size={12} />platform-wide · any brand</Pill>
          )}
        </div>
      </div>

      <div className="k-row" style={{ gap: 6 }}>
        <Pill tone="ink"><Ico kind="star" tone="plain" size={12} />{r.costPoints}</Pill>
        <Pill tone="sand">
          {stockLeft === null
            ? 'unlimited'
            : stockLeft > 0
            ? `${stockLeft} left`
            : 'sold out'}
        </Pill>
        <Pill tone="sand">limit {r.perUserLimit}/user</Pill>
        <Pill tone="sand">{r.validDays}d valid</Pill>
        <Pill tone={r.active ? 'yellow' : 'sand'} dot>{r.active ? 'active' : 'inactive'}</Pill>
      </div>

      <div className="rw-stats">
        {[[redeemed, 'redeemed'], [activeR, 'active'], [usedR, 'used'], [expiredR, 'expired']].map(([v, l]) => (
          <div key={l}><b>{v}</b><span>{l}</span></div>
        ))}
      </div>

      <div className="k-row" style={{ gap: 6 }}>
        <Button size="sm" variant="secondary" icon="ticket" onClick={onViewRedemptions}>redemptions</Button>
        <Button size="sm" variant="secondary" icon="edit" onClick={onEdit}>edit</Button>
        <Button size="sm" variant="secondary" onClick={onToggle} disabled={busy}>{r.active ? 'deactivate' : 'activate'}</Button>
        <Button size="sm" variant="danger" icon="trash" onClick={onDelete} disabled={busy}>delete</Button>
      </div>
    </article>
  );
};
