// src/screens/CrewPartners.jsx
import React, { useEffect, useState } from 'react';
import { crewApi } from '../services/api';

export default function CrewPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', type: 'ambassador', university: '', handle: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await crewApi.partners();
      setPartners(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    try {
      await crewApi.addPartner(form);
      setOpen(false);
      setForm({ email: '', type: 'ambassador', university: '', handle: '' });
      load();
    } catch (e) { alert(e?.response?.data?.message || 'failed'); }
  };

  const remove = async (userId) => {
    if (!window.confirm('remove this partner?')) return;
    try { await crewApi.removePartner(userId); load(); }
    catch (e) { alert('failed'); }
  };

  if (loading) return <div style={s.empty}>loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Partners</h2>
        <button style={s.btnPrimary} onClick={() => setOpen(true)}>+ add partner</button>
      </div>

      {partners.length === 0 ? <div style={s.empty}>no partners yet.</div> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>NAME</th>
                <th style={s.th}>TYPE</th>
                <th style={s.th}>% SORTED</th>
                <th style={s.th}>POINTS</th>
                <th style={s.th}>REFERRALS</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => {
                const pct = p.stats?.sortedPercent ?? 0;
                return (
                  <tr key={p._id} style={s.tr}>
                    <td style={s.td}>
                      <div style={{ fontWeight: 600 }}>{p.user?.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.user?.email}</div>
                    </td>
                    <td style={s.td}><span style={s.badge}>{p.partner?.type}</span></td>
                    <td style={s.td}><span style={{ fontWeight: 700, color: pct < 40 ? '#ef4444' : '#10b981' }}>{pct}%</span></td>
                    <td style={s.td}>{(p.points?.lifetime || 0).toLocaleString()}</td>
                    <td style={s.td}>{p.stats?.referralsCredited || 0}</td>
                    <td style={s.td}>
                      <button style={s.btnDangerSm} onClick={() => remove(p.user?._id)}>remove</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div style={s.backdrop} onClick={() => setOpen(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Add Partner</h3>
            <div style={s.formGroup}>
              <label style={s.label}>User Email</label>
              <input style={s.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Type</label>
              <select style={s.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="ambassador">ambassador</option>
                <option value="influencer">influencer</option>
              </select>
            </div>
            {form.type === 'ambassador' && (
              <div style={s.formGroup}>
                <label style={s.label}>University</label>
                <input style={s.input} value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
              </div>
            )}
            {form.type === 'influencer' && (
              <div style={s.formGroup}>
                <label style={s.label}>Handle</label>
                <input style={s.input} value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} />
              </div>
            )}
            <div style={s.modalActions}>
              <button style={s.btnGhost} onClick={() => setOpen(false)}>cancel</button>
              <button style={s.btnPrimary} onClick={add}>add</button>
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
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, background: 'rgba(249,195,73,0.18)', color: '#b8860b' },
  btnPrimary: { padding: '10px 20px', background: 'linear-gradient(135deg, #f9c349 0%, #ff961a 100%)', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#0f172a' },
  btnGhost: { padding: '10px 22px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  btnDangerSm: { padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
  empty: { padding: 60, textAlign: 'center', color: '#94a3b8' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 0, marginBottom: 20 },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none' },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #f1f5f9', marginTop: 16 },
};