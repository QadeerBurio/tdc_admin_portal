// src/screens/BrandCampaigns.js
// Brand campaigns: influencer campaigns with followers, bills and savings.
import React, { useEffect, useState } from 'react';
import { brandApi } from '../services/api';
import { PageHeader, PageLoading, Button, Table, EmptyState, Pill } from '../portal/kit';

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

  if (loading) return <div className="tdcp k-page"><PageLoading label="loading campaigns…" /></div>;

  return (
    <div className="tdcp k-page" data-screen="brand-campaigns">
      <PageHeader
        title="brand campaigns"
        sub="influencer campaigns, the followers they bring and what they save."
        actions={<Button variant="secondary" icon="refresh" onClick={load}>refresh</Button>}
      />
      <Table
        minWidth={760}
        rows={campaigns}
        empty={<EmptyState icon="megaphone" title="no campaigns yet." />}
        columns={[
          { key: 'name', label: 'campaign', render: (c) => <b>{c.name}</b> },
          { key: 'partner', label: 'influencer', render: (c) => c.partner?.name || '–' },
          { key: 'status', label: 'status', render: (c) => <Pill tone="sand">{c.status}</Pill> },
          { key: 'followers', label: 'followers', render: (c) => c.stats?.followersJoined || 0 },
          { key: 'bill', label: 'bill total', render: (c) => `₨ ${(c.stats?.billTotal || 0).toLocaleString()}` },
          { key: 'savings', label: 'savings', render: (c) => `₨ ${(c.stats?.savingsGiven || 0).toLocaleString()}` },
        ]}
      />
    </div>
  );
}
