// src/screens/CrewPartners.jsx
import React, { useEffect, useState } from 'react';
import { crewApi } from '../services/api';
import { Modal } from '../portal/kit';
import { useAdminCan } from '../portal/adminAccess';

export default function CrewPartners() {
  const canManage = useAdminCan()('crew.manage'); // P5a: changes need crew.manage (as on the server); crew.view only reads
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: '', type: 'ambassador', university: '', handle: '' });
  // P2: filter by university (name or id; older partners match by name)
  const [uni, setUni] = useState('');
  const [applied, setApplied] = useState('');

  const load = async (university = applied) => {
    setLoading(true);
    try {
      const data = await crewApi.partners(university ? { university } : undefined);
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
        <h1 style={s.title}>crew partners</h1>
        {canManage && <button style={s.btnPrimary} onClick={() => setOpen(true)}>+ add partner</button>}
      </div>
      <form style={s.filter} onSubmit={(e) => { e.preventDefault(); const v = uni.trim(); setApplied(v); load(v); }}>
        <label htmlFor="crew-uni-filter" style={s.filterLabel}>university</label>
        <input id="crew-uni-filter" style={{ ...s.input, maxWidth: 280 }} value={uni} onChange={(e) => setUni(e.target.value)} placeholder="e.g. NED University" />
        <button type="submit" style={s.btnGhostSm}>filter</button>
        {applied && <button type="button" style={s.btnGhostSm} onClick={() => { setUni(''); setApplied(''); load(''); }}>clear</button>}
      </form>

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
                <th style={s.th} title="friends who joined with their code and verified their e-mail">VERIFIED (MONTH)</th>
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
                    <td style={s.td}>{typeof p.stats?.verified === 'number' ? `${p.stats.verified} (${p.stats.verifiedThisMonth ?? 0})` : '—'}</td>
                    <td style={s.td}>
                      {canManage && <button style={s.btnDangerSm} onClick={() => remove(p.user?._id)}>remove</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal onClose={() => setOpen(false)} title="Add Partner" footer={<><button style={s.btnGhost} onClick={() => setOpen(false)}>cancel</button><button style={s.btnPrimary} onClick={add}>add</button></>}>
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
        </Modal>
      )}
    </div>
  );
}

const s = {
  filter: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  btnGhostSm: { padding: '8px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12 },
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
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none' },
};