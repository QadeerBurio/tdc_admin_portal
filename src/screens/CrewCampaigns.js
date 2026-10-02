// src/screens/CrewCampaigns.jsx
import React, { useEffect, useState } from 'react';
import { crewApi } from '../services/api';

export default function CrewCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', brandId: '', partnerId: '', followerPercent: 15, startsAt: '', endsAt: '', cap: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await crewApi.campaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await crewApi.createCampaign({
        ...form,
        followerPercent: Number(form.followerPercent),
        cap: form.cap ? Number(form.cap) : null,
      });
      setOpen(false);
      setForm({ name: '', brandId: '', partnerId: '', followerPercent: 15, startsAt: '', endsAt: '', cap: '' });
      load();
    } catch (e) { alert(e?.response?.data?.message || 'failed'); }
  };

  const end = async (id) => {
    if (!window.confirm('end this campaign?')) return;
    try { await crewApi.endCampaign(id); load(); }
    catch (e) { alert('failed'); }
  };

  if (loading) return <div style={s.empty}>loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Campaigns</h2>
        <button style={s.btnPrimary} onClick={() => setOpen(true)}>+ new campaign</button>
      </div>

      {campaigns.length === 0 ? <div style={s.empty}>no campaigns yet.</div> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>CAMPAIGN</th>
                <th style={s.th}>BRAND</th>
                <th style={s.th}>PARTNER</th>
                <th style={s.th}>PERK</th>
                <th style={s.th}>STATUS</th>
                <th style={s.th}>FOLLOWERS</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id} style={s.tr}>
                  <td style={s.td}>{c.name}</td>
                  <td style={s.td}>{c.brand?.brandName || c.brand?.name || '—'}</td>
                  <td style={s.td}>{c.partner?.name || '—'}</td>
                  <td style={s.td}>+{c.followerPercent}%</td>
                  <td style={s.td}>{c.status}</td>
                  <td style={s.td}>{c.stats?.followersJoined || 0}</td>
                  <td style={s.td}>
                    {c.status === 'live' && (
                      <button style={s.btnDangerSm} onClick={() => end(c._id)}>end</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div style={s.backdrop} onClick={() => setOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Create Campaign</h3>
            <div style={s.formGroup}>
              <label style={s.label}>Campaign Name</label>
              <input style={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={s.formGroup}>
                <label style={s.label}>Brand ID</label>
                <input style={s.input} value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Partner ID</label>
                <input style={s.input} value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={s.formGroup}>
                <label style={s.label}>Perk %</label>
                <input type="number" style={s.input} value={form.followerPercent} onChange={(e) => setForm({ ...form, followerPercent: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Cap</label>
                <input type="number" style={s.input} value={form.cap} onChange={(e) => setForm({ ...form, cap: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={s.formGroup}>
                <label style={s.label}>Starts</label>
                <input type="date" style={s.input} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Ends</label>
                <input type="date" style={s.input} value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </div>
            </div>
            <div style={s.modalActions}>
              <button style={s.btnGhost} onClick={() => setOpen(false)}>cancel</button>
              <button style={s.btnPrimary} onClick={create}>create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 },
  card: { background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#fafbfc' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '14px 16px', fontSize: 13, color: '#1e293b' },
  btnPrimary: { padding: '10px 20px', background: 'linear-gradient(135deg, #f9c349 0%, #ff961a 100%)', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#0f172a' },
  btnGhost: { padding: '10px 22px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  btnDangerSm: { padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
  empty: { padding: 60, textAlign: 'center', color: '#94a3b8' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, padding: 28, maxWidth: 560, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 0, marginBottom: 20 },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none' },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #f1f5f9', marginTop: 16 },
};