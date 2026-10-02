// src/screens/CrewInbox.jsx
import React, { useEffect, useState } from 'react';
import { crewApi } from '../services/api';

export default function CrewInbox() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await crewApi.inbox();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async () => {
    if (!selected) return;
    try {
      if (selected.kind === 'post') {
        await crewApi.reviewPost(selected._id, 'approved', 'posted');
      } else {
        await crewApi.reviewApplication(selected._id, 'approved');
      }
      setSelected(null); load();
    } catch (e) { alert(e?.response?.data?.message || 'failed'); }
  };

  const reject = async () => {
    if (!selected) return;
    try {
      if (selected.kind === 'post') {
        await crewApi.reviewPost(selected._id, 'rejected');
      } else {
        await crewApi.reviewApplication(selected._id, 'rejected');
      }
      setSelected(null); load();
    } catch (e) { alert(e?.response?.data?.message || 'failed'); }
  };

  if (loading) return <div style={s.empty}>loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Crew Inbox</h2>
        <button style={s.btnGhost} onClick={load}>refresh</button>
      </div>

      {items.length === 0 ? <div style={s.empty}>inbox is empty.</div> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>TYPE</th>
                <th style={s.th}>FROM</th>
                <th style={s.th}>SUMMARY</th>
                <th style={s.th}>RECEIVED</th>
                <th style={s.th}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} style={s.tr}>
                  <td style={s.td}><span style={s.badge}>{r.kind}</span></td>
                  <td style={s.td}>{r.user?.name || '—'}</td>
                  <td style={s.td}>{r.summary}</td>
                  <td style={s.td}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td style={s.td}>
                    <button style={s.btnPrimary} onClick={() => setSelected(r)}>review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div style={s.backdrop} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={s.modalTitle}>
              {selected.kind === 'post' ? 'Review Post' : 'Review Application'}
            </h3>
            <div style={s.modalBody}>
              <p><strong>From:</strong> {selected.user?.name} ({selected.user?.email})</p>
              {selected.platform && <p><strong>Platform:</strong> {selected.platform}</p>}
              {selected.url && (
                <p><strong>URL:</strong> <a href={selected.url} target="_blank" rel="noreferrer" style={{ color: '#f9c349' }}>{selected.url}</a></p>
              )}
              {selected.university && <p><strong>University:</strong> {selected.university}</p>}
              {selected.handle && <p><strong>Handle:</strong> {selected.handle}</p>}
              {(selected.why || selected.summary) && <p><strong>Message:</strong> {selected.why || selected.summary}</p>}
            </div>
            <div style={s.modalActions}>
              <button style={s.btnDanger} onClick={reject}>reject</button>
              <button style={s.btnPrimary} onClick={approve}>approve</button>
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
  btnGhost: { padding: '10px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  card: { background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#fafbfc' },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f8fafc' },
  td: { padding: '14px 16px', fontSize: 13, color: '#1e293b' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', background: 'rgba(249,195,73,0.18)', color: '#b8860b' },
  btnPrimary: { padding: '8px 16px', background: 'linear-gradient(135deg, #f9c349 0%, #ff961a 100%)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', color: '#0f172a' },
  btnDanger: { padding: '10px 22px', background: '#fff', border: '2px solid #ef4444', color: '#ef4444', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  empty: { padding: 60, textAlign: 'center', color: '#94a3b8' },
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modal: { background: '#fff', borderRadius: 20, padding: 28, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 0, marginBottom: 20 },
  modalBody: { fontSize: 14, lineHeight: 1.8 },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #f1f5f9', marginTop: 16 },
};