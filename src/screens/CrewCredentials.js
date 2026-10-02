// src/screens/CrewCredentials.jsx
import React, { useEffect, useState } from 'react';
import { crewApi } from '../services/api';

const TYPES = [
  { id: 'certificate', label: 'Experience Certificate' },
  { id: 'letter', label: "Majid's Letter" },
  { id: 'recommendation', label: 'Recommendation' },
  { id: 'founder_card', label: 'Founder Card' },
];

export default function CrewCredentials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ userId: '', type: 'certificate', note: '' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await crewApi.credentials();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const issue = async () => {
    try {
      await crewApi.issueCredential(form);
      setOpen(false);
      setForm({ userId: '', type: 'certificate', note: '' });
      load();
    } catch (e) { alert(e?.response?.data?.message || 'failed'); }
  };

  const revoke = async (id) => {
    if (!window.confirm('revoke this credential?')) return;
    try { await crewApi.revokeCredential(id); load(); }
    catch (e) { alert('failed'); }
  };

  if (loading) return <div style={s.empty}>loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Credentials</h2>
        <button style={s.btnPrimary} onClick={() => setOpen(true)}>+ issue credential</button>
      </div>

      {items.length === 0 ? <div style={s.empty}>no credentials issued yet.</div> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>USER</th>
                <th style={s.th}>TYPE</th>
                <th style={s.th}>STATUS</th>
                <th style={s.th}>ISSUED</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id} style={s.tr}>
                  <td style={s.td}>
                    <div style={{ fontWeight: 600 }}>{c.user?.name || c.userId}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.user?.email || ''}</div>
                  </td>
                  <td style={s.td}>{TYPES.find((t) => t.id === c.type)?.label || c.type}</td>
                  <td style={s.td}>{c.status}</td>
                  <td style={s.td}>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '—'}</td>
                  <td style={s.td}>
                    {c.status === 'issued' && (
                      <button style={s.btnDangerSm} onClick={() => revoke(c._id)}>revoke</button>
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
            <h3 style={s.modalTitle}>Issue Credential</h3>
            <div style={s.formGroup}>
              <label style={s.label}>User ID</label>
              <input style={s.input} value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="mongodb user id" />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Type</label>
              <select style={s.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Internal Note</label>
              <textarea style={{ ...s.input, minHeight: 80 }} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <div style={s.modalActions}>
              <button style={s.btnGhost} onClick={() => setOpen(false)}>cancel</button>
              <button style={s.btnPrimary} onClick={issue}>issue</button>
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
  modal: { background: '#fff', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%' },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 0, marginBottom: 20 },
  formGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '2px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none' },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #f1f5f9', marginTop: 16 },
};