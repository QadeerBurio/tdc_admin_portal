import React, { useState, useEffect, useContext } from 'react';
import { Loader2, User, ChevronRight, ArrowLeft, Mail, Calendar } from 'lucide-react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

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
        const res = await axios.get(`http://localhost:5000/api/admin/exchange/applications/${programId}`, {
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
    <div style={appStyles.container}>
      <header style={appStyles.header}>
        <button onClick={() => navigate(-1)} style={appStyles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={appStyles.title}>Program Applicants</h1>
          <p style={appStyles.subtitle}>{programTitle || "Loading..."}</p>
        </div>
        <div style={appStyles.countBadge}>{applicants.length} Total</div>
      </header>

      <main style={appStyles.main}>
        {loading ? (
          <div style={appStyles.loader}><Loader2 className="animate-spin" size={32} color="#2563EB" /></div>
        ) : applicants.length === 0 ? (
          <div style={appStyles.empty}>No applications received for this program yet.</div>
        ) : (
          <div style={appStyles.grid}>
            {applicants.map((app) => (
              <div 
                key={app._id} 
                style={appStyles.card} 
                onClick={() => navigate(`/dossier/${app._id}`, { state: { application: app } })}
              >
                <div style={appStyles.avatar}>
                  <User size={24} color="#64748B" />
                </div>
                <div style={appStyles.cardInfo}>
                  <h3 style={appStyles.name}>{app.formData?.fullName || "Anonymous Student"}</h3>
                  <div style={appStyles.meta}>
                    <span style={appStyles.metaItem}><Mail size={14} /> {app.formData?.email || app.userId?.email}</span>
                    <span style={appStyles.metaItem}>
                        <Calendar size={14} /> 
                        Applied: {new Date(app.createdAt || app.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} color="#94A3B8" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// Renamed styles to avoid conflict with ManageExchange if in same scope
const appStyles = {
  container: { minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '"Inter", sans-serif' },
  header: { padding: '1.25rem 6%', backgroundColor: '#FFF', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', position: 'sticky', top: 0, zIndex: 10 },
  backBtn: { border: 'none', background: '#F1F5F9', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' },
  title: { fontSize: '20px', fontWeight: '800', margin: 0, color: '#0F172A' },
  subtitle: { fontSize: '14px', color: '#64748B', margin: '2px 0 0' },
  countBadge: { backgroundColor: '#000', color: '#FFF', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  main: { padding: '2rem 6%' },
  grid: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '900px', margin: '0 auto' },
  card: { backgroundColor: '#FFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  avatar: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' },
  cardInfo: { flex: 1 },
  name: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' },
  meta: { display: 'flex', gap: '20px', marginTop: '6px' },
  metaItem: { fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' },
  loader: { display: 'flex', justifyContent: 'center', paddingTop: '100px' },
  empty: { textAlign: 'center', color: '#94A3B8', paddingTop: '100px', fontSize: '15px' }
};

export default ProgramApplication;