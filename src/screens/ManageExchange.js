import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Eye, EyeOff, X, Edit3, 
  GraduationCap, Calendar, Clock, Loader2, ExternalLink, MapPin, CheckCircle2,
  AlertCircle, Briefcase, Info, Users, Sparkles, Globe, Award, ChevronRight
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';

const ManageExchange = () => {
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); 
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reqInput, setReqInput] = useState("");

  const defaultRequirements = [
    "Full-time enrollment at a recognized university",
    "Strong academic record (Minimum CGPA)",
    "Language Proficiency (IELTS/TOEFL)",
    "Statement of Purpose / Motivation Letter",
    "Detailed CV / Resume",
    "Official Academic Transcripts",
    "1-2 Letters of Recommendation",
    "Valid Passport Copy",
    "Passport-size photographs & ID",
    "Supporting docs (Certificates/Research)"
  ];

  const initialFormState = {
    title: '', university: '', location: '', 
    degree: 'Bachelors', appStart: '', deadline: '', 
    duration: '', link: '', color: '#2563EB',
    requirements: [...defaultRequirements] 
  };

  const [formData, setFormData] = useState(initialFormState);

  const BASE_URL = 'http://localhost:5000/api/admin/exchange';
  const api = axios.create({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => { if (token) fetchPrograms(); }, [token]);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${BASE_URL}/all`);
      setPrograms(res.data);
    } catch (err) {
      if (err.response?.status === 401) logout();
      else console.error("Fetch failed", err);
    } finally { 
      setTimeout(() => setLoading(false), 500);
    }
  };

  const openModal = (program = null) => {
    if (program) {
      setEditingId(program._id);
      setFormData({ ...program });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setActiveTab('details');
    setModalVisible(true);
  };

  const addRequirement = (e) => {
    e.preventDefault();
    if (reqInput.trim()) {
      setFormData({ 
        ...formData, 
        requirements: [...formData.requirements, reqInput.trim()] 
      });
      setReqInput("");
    }
  };

  const removeRequirement = (index) => {
    const updatedReqs = formData.requirements.filter((_, i) => i !== index);
    setFormData({ ...formData, requirements: updatedReqs });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingId) {
        await api.put(`${BASE_URL}/update/${editingId}`, formData);
      } else {
        await api.post(`${BASE_URL}/add`, formData);
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchPrograms();
    } catch (err) { 
      alert(err.response?.data?.message || "Operation failed."); 
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    setTogglingId(id);
    try {
      setPrograms(programs.map(p => p._id === id ? { ...p, active: !p.active } : p));
      await api.patch(`${BASE_URL}/toggle/${id}`);
    } catch (err) { 
      fetchPrograms(); 
    } finally {
      setTogglingId(null);
    }
  };

  const deleteProgram = async (id) => {
    if (window.confirm("⚠️ Permanent Action: Delete this program?")) {
      setDeletingId(id);
      try {
        await api.delete(`${BASE_URL}/delete/${id}`);
        setPrograms(programs.filter(p => p._id !== id));
      } catch (err) { 
        alert("Delete failed"); 
      } finally {
        setDeletingId(null);
      }
    }
  };

  const activeCount = programs.filter(p => p.active).length;

  return (
    <div style={styles.pageWrapper}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      <div style={styles.container}>
        <div className="animate-header" style={styles.header}>
          <div>
            <div style={styles.headerBadge}>
              <Globe size={14} />
              <span>Global Partnerships</span>
            </div>
            <h1 style={styles.headerTitle}>Exchange Management</h1>
            <p style={styles.headerSub}>Manage global academic partnerships and application cycles</p>
          </div>
          <div style={styles.headerActions}>
            <div className="stats-group" style={styles.statsRow}>
              <div className="stat-card" style={styles.statCard}>
                <div style={{...styles.statIcon, background: '#ecfdf5'}}>
                  <GraduationCap size={18} color="#10b981" />
                </div>
                <div>
                  <div style={styles.statVal}>{programs.length}</div>
                  <div style={styles.statLab}>Total Programs</div>
                </div>
              </div>
              <div className="stat-card" style={styles.statCard}>
                <div style={{...styles.statIcon, background: '#eff6ff'}}>
                  <Award size={18} color="#3b82f6" />
                </div>
                <div>
                  <div style={styles.statVal}>{activeCount}</div>
                  <div style={styles.statLab}>Active</div>
                </div>
              </div>
            </div>
            <button className="add-btn" style={styles.addButton} onClick={() => openModal()}>
              <Plus size={18} /> 
              <span>Create Program</span>
            </button>
          </div>
        </div>

        <main style={styles.main}>
          {loading ? (
            <div className="loader-container" style={styles.loaderContainer}>
              <div className="spinner" style={styles.spinner}></div>
              <p style={{marginTop: '16px', color: '#64748B', fontWeight: 500}}>Loading exchange programs...</p>
            </div>
          ) : (
            <div className="list-container" style={styles.listContainer}>
              <div style={styles.listHeader}>
                <div style={{flex: 2.5}}>PROGRAM DETAILS</div>
                <div style={{flex: 1}}>LOCATION</div>
                <div style={{flex: 1}}>SCHEDULE</div>
                <div style={{flex: 0.8, textAlign: 'center'}}>STATUS</div>
                <div style={{flex: 1.2, textAlign: 'right'}}>ACTIONS</div>
              </div>

              {programs.length === 0 ? (
                <div className="empty-state" style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🌍</div>
                  <h3 style={{color: '#1e293b', marginBottom: '4px'}}>No Programs Registered</h3>
                  <p>Start by adding your first international exchange opportunity</p>
                </div>
              ) : (
                programs.map((item, index) => (
                  <div key={item._id} className="program-row" style={styles.row}>
                    <div style={{flex: 2.5, display: 'flex', gap: '14px', alignItems: 'center'}}>
                      <div style={{...styles.iconBox, backgroundColor: item.active ? '#fff7ed' : '#f8fafc'}}>
                        <GraduationCap size={20} color={item.active ? '#ff961a' : '#94a3b8'} />
                      </div>
                      <div>
                        <div style={styles.rowTitle}>{item.title}</div>
                        <div style={styles.rowSub}>
                          {item.university} • <span style={styles.degreeTag}>{item.degree}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{flex: 1, ...styles.cellText}}>
                      <MapPin size={14} color="#94a3b8" /> {item.location}
                    </div>

                    <div style={{flex: 1}}>
                      <div style={{...styles.cellText, marginBottom: '4px'}}>
                        <Clock size={14} /> {item.duration}
                      </div>
                      <div style={{...styles.cellText, fontSize: '12px', color: '#ef4444'}}>
                        <Calendar size={13} /> Deadline: {new Date(item.deadline).toLocaleDateString()}
                      </div>
                    </div>

                    <div style={{flex: 0.8, display: 'flex', justifyContent: 'center'}}>
                      <button 
                        className="status-btn"
                        onClick={() => toggleStatus(item._id)}
                        disabled={togglingId === item._id}
                        style={{
                          ...styles.statusBadge, 
                          backgroundColor: item.active ? '#dcfce7' : '#f1f5f9', 
                          color: item.active ? '#166534' : '#64748b' 
                        }}
                      >
                        {togglingId === item._id ? (
                          <div style={styles.spinnerSmall}></div>
                        ) : item.active ? (
                          'Active'
                        ) : (
                          'Draft'
                        )}
                      </button>
                    </div>

                    <div style={{flex: 1.2, display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                      <button 
                        className="action-icon"
                        title="View Applications" 
                        onClick={() => navigate('/program', { 
                          state: { programId: item._id, programTitle: item.title } 
                        })} 
                        style={{...styles.actionBtn, color: '#3b82f6', borderColor: '#dbeafe'}}
                      >
                        <Users size={16} />
                      </button>
                      <button 
                        className="action-icon"
                        title="External Link" 
                        onClick={() => window.open(item.link, '_blank')} 
                        style={styles.actionBtn}
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button 
                        className="action-icon"
                        title="Edit Program" 
                        onClick={() => openModal(item)} 
                        style={styles.actionBtn}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="action-icon"
                        title="Delete" 
                        onClick={() => deleteProgram(item._id)} 
                        disabled={deletingId === item._id}
                        style={{...styles.actionBtn, color: '#ef4444', borderColor: '#fee2e2'}}
                      >
                        {deletingId === item._id ? (
                          <div style={styles.spinnerSmall}></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modalVisible && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={() => setModalVisible(false)}>
          <div className="modal-content" style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalBadge}>
                  <Sparkles size={14} />
                  <span>{editingId ? 'Edit Program' : 'New Opportunity'}</span>
                </div>
                <h2 style={styles.modalTitle}>{editingId ? 'Edit Exchange Program' : 'Create Exchange Program'}</h2>
              </div>
              <button className="close-modal" onClick={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.tabs}>
              <button 
                className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
                style={activeTab === 'details' ? styles.activeTab : styles.tab} 
                onClick={() => setActiveTab('details')}
              >
                <Info size={16} /> General Info
              </button>
              <button 
                className={`tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
                style={activeTab === 'requirements' ? styles.activeTab : styles.tab} 
                onClick={() => setActiveTab('requirements')}
              >
                <CheckCircle2 size={16} /> Requirements ({formData.requirements.length})
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {activeTab === 'details' ? (
                <div className="tab-content" style={styles.tabContent}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Program Title</label>
                    <input 
                      style={styles.input} 
                      placeholder="e.g., Global Leadership Semester" 
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})} 
                      required 
                    />
                  </div>
                  
                  <div style={styles.inputRow}>
                    <div style={{flex:1}}>
                      <label style={styles.label}>University Name</label>
                      <input 
                        style={styles.input} 
                        placeholder="National University of Singapore" 
                        value={formData.university} 
                        onChange={e => setFormData({...formData, university: e.target.value})} 
                        required 
                      />
                    </div>
                    <div style={{flex:1}}>
                      <label style={styles.label}>City, Country</label>
                      <input 
                        style={styles.input} 
                        placeholder="Singapore" 
                        value={formData.location} 
                        onChange={e => setFormData({...formData, location: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={styles.inputRow}>
                    <div style={{flex:1}}>
                      <label style={styles.label}>Degree Level</label>
                      <select 
                        style={styles.input} 
                        value={formData.degree} 
                        onChange={e => setFormData({...formData, degree: e.target.value})}
                      >
                        <option value="Bachelors">Bachelors</option>
                        <option value="Masters">Masters</option>
                        <option value="PhD">PhD</option>
                        <option value="Exchange">Exchange</option>
                      </select>
                    </div>
                    <div style={{flex:1}}>
                      <label style={styles.label}>Program Duration</label>
                      <input 
                        style={styles.input} 
                        placeholder="1 Semester / 1 Year" 
                        value={formData.duration} 
                        onChange={e => setFormData({...formData, duration: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={styles.inputRow}>
                    <div style={{flex:1}}>
                      <label style={styles.label}>Application Start Date</label>
                      <input 
                        type="date" 
                        style={styles.input} 
                        value={formData.appStart?.split('T')[0] || ''} 
                        onChange={e => setFormData({...formData, appStart: e.target.value})} 
                        required 
                      />
                    </div>
                    <div style={{flex:1}}>
                      <label style={styles.label}>Application Deadline</label>
                      <input 
                        type="date" 
                        style={styles.input} 
                        value={formData.deadline?.split('T')[0] || ''} 
                        onChange={e => setFormData({...formData, deadline: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Official Application URL</label>
                    <input 
                      style={styles.input} 
                      placeholder="https://..." 
                      value={formData.link} 
                      onChange={e => setFormData({...formData, link: e.target.value})} 
                    />
                  </div>
                </div>
              ) : (
                <div className="tab-content" style={styles.tabContent}>
                  <div style={styles.requirementHeader}>
                    <label style={styles.label}>Add Requirement</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input 
                        style={{...styles.input, flex: 1}} 
                        placeholder="Enter requirement..." 
                        value={reqInput} 
                        onChange={(e) => setReqInput(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter') addRequirement(e); }}
                      />
                      <button type="button" onClick={addRequirement} style={styles.smallAddBtn}>
                        Add
                      </button>
                    </div>
                  </div>
                  
                  <div style={styles.requirementList}>
                    {formData.requirements.map((req, idx) => (
                      <div key={idx} className="req-item" style={styles.reqBadge}>
                        <CheckCircle2 size={14} color="#10b981" />
                        <span style={{flex:1, fontSize: '13px'}}>{req}</span>
                        <X 
                          size={14} 
                          style={styles.removeReqIcon} 
                          onClick={() => removeRequirement(idx)} 
                        />
                      </div>
                    ))}
                  </div>
                  {formData.requirements.length === 0 && (
                    <div className="empty-reqs" style={styles.emptyReqs}>
                      No requirements listed yet. Add some criteria for applicants.
                    </div>
                  )}
                </div>
              )}

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setModalVisible(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {loading ? (
                    <>
                      <div style={styles.spinnerSmall}></div>
                      Processing...
                    </>
                  ) : (
                    editingId ? 'Update Program' : 'Publish Program'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.98); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-header {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.1s;
        }
        
        .stats-group {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.05s;
        }
        
        .stat-card {
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
        
        .add-btn {
          transition: all 0.3s ease;
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.15s;
        }
        .add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
        }
        
        .list-container {
          animation: fadeInScale 0.5s ease forwards;
        }
        
        .program-row {
          transition: all 0.3s ease;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .program-row:nth-child(1) { animation-delay: 0.05s; }
        .program-row:nth-child(2) { animation-delay: 0.1s; }
        .program-row:nth-child(3) { animation-delay: 0.15s; }
        .program-row:nth-child(4) { animation-delay: 0.2s; }
        .program-row:nth-child(5) { animation-delay: 0.25s; }
        
        .program-row:hover {
          background: #f8fafc;
          transform: translateX(4px);
        }
        
        .action-icon {
          transition: all 0.2s ease;
        }
        .action-icon:hover {
          transform: translateY(-2px);
        }
        
        .status-btn {
          transition: all 0.2s ease;
        }
        .status-btn:hover {
          transform: scale(1.02);
        }
        
        .modal-overlay {
          animation: fadeInScale 0.3s ease forwards;
        }
        
        .modal-content {
          animation: slideUp 0.4s ease forwards;
        }
        
        .tab-btn {
          transition: all 0.2s ease;
        }
        .tab-btn:hover {
          color: #ff961a;
        }
        
        .req-item {
          transition: all 0.2s ease;
          animation: slideUp 0.3s ease forwards;
          opacity: 0;
        }
        .req-item:nth-child(1) { animation-delay: 0.02s; }
        .req-item:nth-child(2) { animation-delay: 0.04s; }
        .req-item:nth-child(3) { animation-delay: 0.06s; }
        
        .req-item:hover {
          background: #e6f7ec;
          transform: translateX(3px);
        }
        
        .empty-state {
          animation: fadeInScale 0.4s ease;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #ff961a;
          box-shadow: 0 0 0 3px rgba(255,150,26,0.1);
        }
        
        .loader-container {
          animation: pulse 1.5s ease infinite;
        }
      `}</style>
    </div>
  );
};

const styles = {
  pageWrapper: { 
    minHeight: '100vh', 
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
    padding: '20px 30px', 
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    position: 'relative',
    borderRadius: '32px',
    overflow: 'hidden'
  },
  bgDecoration1: {
    position: 'absolute',
    top: '-100px',
    right: '-50px',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255,150,26,0.06) 0%, rgba(255,150,26,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: '-80px',
    left: '-60px',
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(255,150,26,0.04) 0%, rgba(255,150,26,0) 70%)',
    borderRadius: '50%',
    pointerEvents: 'none'
  },
  container: { 
    maxWidth: '1400px', 
    margin: '0 auto',
    position: 'relative',
    zIndex: 1
  },
  header: { 
    padding: '20px 0', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    flexWrap: 'wrap', 
    gap: '20px',
    marginBottom: '20px'
  },
  headerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fff7ed',
    padding: '6px 16px',
    borderRadius: '40px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#ff961a',
    marginBottom: '16px'
  },
  headerActions: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '20px', 
    flexWrap: 'wrap' 
  },
  headerTitle: { 
    fontSize: '32px', 
    fontWeight: '800', 
    margin: 0, 
    color: '#1e293b', 
    letterSpacing: '-0.5px' 
  },
  headerSub: { 
    color: '#64748b', 
    fontSize: '14px', 
    marginTop: '8px' 
  },
  statsRow: { 
    display: 'flex', 
    gap: '12px' 
  },
  statCard: { 
    background: '#fff', 
    padding: '10px 20px', 
    borderRadius: '20px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease'
  },
  statIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statVal: { 
    fontSize: '20px', 
    fontWeight: '800', 
    color: '#1e293b',
    lineHeight: '1.2'
  },
  statLab: { 
    fontSize: '10px', 
    color: '#94a3b8', 
    textTransform: 'uppercase', 
    fontWeight: '600' 
  },
  addButton: { 
    backgroundColor: '#1e293b', 
    color: '#fff', 
    border: 'none', 
    padding: '10px 24px', 
    borderRadius: '16px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    transition: 'all 0.3s ease',
    fontSize: '14px'
  },
  main: { 
    padding: '0', 
    width: '100%' 
  },
  listContainer: { 
    backgroundColor: '#fff', 
    borderRadius: '24px', 
    border: '1px solid #e2e8f0', 
    overflow: 'hidden', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)' 
  },
  listHeader: { 
    display: 'flex', 
    padding: '16px 24px', 
    backgroundColor: '#f8fafc', 
    borderBottom: '2px solid #e2e8f0', 
    color: '#64748b', 
    fontSize: '11px', 
    fontWeight: '700', 
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  },
  row: { 
    display: 'flex', 
    alignItems: 'center', 
    padding: '18px 24px', 
    borderBottom: '1px solid #f1f5f9', 
    transition: 'all 0.2s ease' 
  },
  rowTitle: { 
    fontSize: '15px', 
    fontWeight: '700', 
    color: '#1e293b' 
  },
  rowSub: { 
    fontSize: '12px', 
    color: '#64748b', 
    marginTop: '4px' 
  },
  degreeTag: { 
    color: '#ff961a', 
    fontWeight: 600, 
    fontSize: '11px' 
  },
  cellText: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '6px', 
    fontSize: '13px', 
    color: '#475569' 
  },
  iconBox: { 
    width: '44px', 
    height: '44px', 
    borderRadius: '14px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    border: '1px solid #e2e8f0' 
  },
  statusBadge: { 
    fontSize: '11px', 
    fontWeight: '700', 
    padding: '5px 14px', 
    borderRadius: '20px', 
    border: 'none', 
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  actionBtn: { 
    padding: '8px', 
    borderRadius: '10px', 
    border: '1px solid #e2e8f0', 
    backgroundColor: '#fff', 
    cursor: 'pointer', 
    color: '#64748b', 
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalOverlay: { 
    position: 'fixed', 
    inset: 0, 
    backgroundColor: 'rgba(15, 23, 42, 0.75)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 1000, 
    backdropFilter: 'blur(8px)' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    width: '90%', 
    maxWidth: '620px', 
    maxHeight: '85vh',
    borderRadius: '28px', 
    overflow: 'hidden', 
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
  },
  modalHeader: { 
    padding: '24px 28px 16px', 
    borderBottom: '2px solid #f1f5f9', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  modalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: '#fff7ed',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#ff961a',
    marginBottom: '12px'
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  tabs: { 
    display: 'flex', 
    gap: '24px', 
    padding: '0 28px', 
    borderBottom: '1px solid #f1f5f9' 
  },
  tab: { 
    padding: '14px 0', 
    border: 'none', 
    background: 'none', 
    fontSize: '14px', 
    color: '#64748b', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s ease'
  },
  activeTab: { 
    padding: '14px 0', 
    border: 'none', 
    background: 'none', 
    fontSize: '14px', 
    color: '#ff961a', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    borderBottom: '2px solid #ff961a', 
    fontWeight: 600 
  },
  form: { 
    padding: '20px 28px 28px' 
  },
  tabContent: { 
    minHeight: '280px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '18px' 
  },
  fieldGroup: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '6px' 
  },
  inputRow: { 
    display: 'flex', 
    gap: '16px' 
  },
  label: { 
    fontSize: '12px', 
    fontWeight: '700', 
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: { 
    padding: '12px 14px', 
    borderRadius: '14px', 
    border: '2px solid #e2e8f0', 
    fontSize: '14px', 
    width: '100%', 
    boxSizing: 'border-box', 
    outline: 'none', 
    transition: 'all 0.2s ease',
    backgroundColor: '#f8fafc'
  },
  smallAddBtn: { 
    backgroundColor: '#1e293b', 
    color: '#fff', 
    border: 'none', 
    padding: '0 24px', 
    borderRadius: '14px', 
    cursor: 'pointer', 
    fontWeight: '600', 
    fontSize: '13px',
    transition: 'all 0.2s ease'
  },
  requirementHeader: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    marginBottom: '8px' 
  },
  requirementList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    overflowY: 'auto', 
    maxHeight: '240px', 
    paddingRight: '6px' 
  },
  reqBadge: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    backgroundColor: '#f0fdf4', 
    color: '#166534', 
    padding: '10px 14px', 
    borderRadius: '12px', 
    border: '1px solid #dcfce7',
    transition: 'all 0.2s ease'
  },
  removeReqIcon: { 
    cursor: 'pointer', 
    opacity: 0.6, 
    transition: 'opacity 0.2s' 
  },
  modalFooter: { 
    padding: '20px 0 0', 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: '12px',
    borderTop: '1px solid #f1f5f9',
    marginTop: '8px'
  },
  cancelBtn: { 
    padding: '12px 24px', 
    borderRadius: '14px', 
    border: '2px solid #e2e8f0', 
    background: '#fff', 
    fontWeight: '600', 
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  submitBtn: { 
    backgroundColor: '#1e293b', 
    color: '#fff', 
    padding: '12px 28px', 
    borderRadius: '14px', 
    border: 'none', 
    fontWeight: '600', 
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  },
  closeBtn: { 
    border: 'none', 
    background: '#f1f5f9', 
    borderRadius: '50%', 
    padding: '8px', 
    cursor: 'pointer', 
    color: '#64748b',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: { 
    padding: '80px 24px', 
    textAlign: 'center', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '12px', 
    color: '#94a3b8' 
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '8px',
    opacity: 0.5
  },
  emptyReqs: { 
    textAlign: 'center', 
    color: '#94a3b8', 
    padding: '30px', 
    fontSize: '13px',
    background: '#f8fafc',
    borderRadius: '16px'
  },
  loaderContainer: { 
    textAlign: 'center', 
    padding: '100px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e2e8f0',
    borderTop: '3px solid #ff961a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #ff961a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  }
};

export default ManageExchange;