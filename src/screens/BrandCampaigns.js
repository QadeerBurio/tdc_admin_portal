// src/screens/BrandCampaigns.jsx
import React, { useEffect, useState } from 'react';
import { brandApi } from '../services/api';

export default function BrandCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await brandApi.campaigns();
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div style={s.empty}>loading...</div>;

  return (
    <div>
      <div style={s.header}>
        <h2 style={s.title}>Brand Campaigns</h2>
        <button style={s.btnGhost} onClick={load}>refresh</button>
      </div>

      {campaigns.length === 0 ? <div style={s.empty}>no campaigns yet.</div> : (
        <div style={s.card}>
          <table style={s.table}>
            <thead>
              <tr style={s.thead}>
                <th style={s.th}>CAMPAIGN</th>
                <th style={s.th}>INFLUENCER</th>
                <th style={s.th}>STATUS</th>
                <th style={s.th}>FOLLOWERS</th>
                <th style={s.th}>BILL TOTAL</th>
                <th style={s.th}>SAVINGS</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c._id} style={s.tr}>
                  <td style={s.td}>{c.name}</td>
                  <td style={s.td}>{c.partner?.name || '—'}</td>
                  <td style={s.td}>{c.status}</td>
                  <td style={s.td}>{c.stats?.followersJoined || 0}</td>
                  <td style={s.td}>₨ {(c.stats?.billTotal || 0).toLocaleString()}</td>
                  <td style={s.td}>₨ {(c.stats?.savingsGiven || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  btnGhost: { padding: '10px 18px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  empty: { padding: 60, textAlign: 'center', color: '#94a3b8' },
};