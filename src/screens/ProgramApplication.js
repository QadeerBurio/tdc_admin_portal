// src/screens/ProgramApplication.js
// Applicants for one exchange program (opened from ManageExchange).
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Ico from '../portal/Ico';
import { PageHeader, PageLoading, IconButton, EmptyState, Pill } from '../portal/kit';

const ProgramApplication = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data passed from ManageExchange
  const { programId, programTitle } = location.state || {};

  const { token } = useContext(AuthContext);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId) {
        navigate('/exchange'); // Redirect back if no ID is found
        return;
    }

    const fetchApplicants = async () => {
      try {
        const res = await axios.get(`https://the-deft-crew-production.up.railway.app/api/admin/exchange/applications/${programId}`,
           {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApplicants(res.data);
      } catch (err) {
        console.error("Fetch applicants failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [programId, token, navigate]);

  return (
    <div className="tdcp k-standalone">
      <div className="k-page" data-screen="program-applicants">
        <div className="k-row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <IconButton icon="back" label="back" onClick={() => navigate(-1)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <PageHeader title="program applicants" sub={programTitle || "Loading..."} actions={<Pill tone="ink">{applicants.length} Total</Pill>} />
          </div>
        </div>

        {loading ? (
          <PageLoading label="loading applicants…" />
        ) : applicants.length === 0 ? (
          <div className="k-card"><EmptyState icon="users" title="No applications received for this program yet." /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {applicants.map((app) => (
              <button
                type="button"
                key={app._id}
                className="k-card k-row"
                style={{ padding: '14px 16px', textAlign: 'left', cursor: 'pointer', flexWrap: 'nowrap', font: 'inherit', color: 'inherit', width: '100%' }}
                onClick={() => navigate(`/dossier/${app._id}`, { state: { application: app } })}
              >
                <Ico kind="user" tone="sand" size={44} />
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <b style={{ fontSize: 16, overflowWrap: 'anywhere' }}>{app.formData?.fullName || "Anonymous Student"}</b>
                  <span className="k-row k-muted" style={{ fontSize: 13, gap: 16 }}>
                    <span className="k-row" style={{ gap: 6 }}><Ico kind="mail" tone="plain" size={14} />{app.formData?.email || app.userId?.email}</span>
                    <span className="k-row" style={{ gap: 6 }}><Ico kind="calendar" tone="plain" size={14} />Applied: {new Date(app.createdAt || app.appliedAt).toLocaleDateString()}</span>
                  </span>
                </span>
                <Ico kind="chevronRight" tone="plain" size={18} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramApplication;
