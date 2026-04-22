import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Trash2, PlusCircle, Briefcase, Eye, EyeOff, 
    MapPin, DollarSign, Building2, Send, ListFilter,
    Layers, Mail, Clock, CheckCircle, X, Sparkles,
    TrendingUp, Users, Award, ChevronRight
} from 'lucide-react';

const AdminJobManager = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    
    const initialState = {
        title: '',
        department: '',
        location: '',
        type: 'Full-time',
        salary: '',
        email: 'hr@thedeftcrew.com',
        description: '',
        requirements: ''
    };

    const [formData, setFormData] = useState(initialState);

    const token = localStorage.getItem("token");
    const config = { headers: { "Authorization": `Bearer ${token}` } };

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await axios.get('https://the-deft-crew-production.up.railway.app/api/admin/jobs/all', config);
            setJobs(res.data);
        } catch (err) {
            console.error("Failed to fetch jobs", err);
        }
    };

    const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const finalData = {
                ...formData,
                requirements: formData.requirements
                    .split(',')
                    .map(r => r.trim())
                    .filter(r => r !== "")
            };

            await axios.post('https://the-deft-crew-production.up.railway.app/api/admin/jobs/add', finalData, config);
            
            setFormData(initialState);
            setIsModalOpen(false);
            fetchJobs();
        } catch (err) {
            alert("Error creating job listing");
        } finally {
            setLoading(false);
        }
    };

    const deleteJob = async (id) => {
        if (window.confirm("⚠️ Are you sure? This listing will be permanently removed.")) {
            setDeletingId(id);
            try {
                await axios.delete(`https://the-deft-crew-production.up.railway.app/api/admin/jobs/delete/${id}`, config);
                await fetchJobs();
            } catch (err) {
                alert("Delete failed");
            } finally {
                setDeletingId(null);
            }
        }
    };

    const toggleStatus = async (id) => {
        setTogglingId(id);
        try {
            await axios.patch(`https://the-deft-crew-production.up.railway.app/api/admin/jobs/toggle/${id}`, {}, config);
            await fetchJobs();
        } catch (err) {
            console.error("Toggle failed", err);
        } finally {
            setTogglingId(null);
        }
    };

    const activeJobs = jobs.filter(j => j.active).length;
    const totalApplications = jobs.reduce((acc, job) => acc + (job.applications || 0), 0);

    return (
        <div style={styles.pageWrapper}>
            {/* Decorative Background */}
            <div style={styles.bgDecoration1}></div>
            <div style={styles.bgDecoration2}></div>

            <div style={styles.container}>
                {/* Header Section */}
                <div className="animate-header" style={styles.header}>
                    <div>
                        <div style={styles.headerBadge}>
                            <Briefcase size={14} />
                            <span>Career Portal</span>
                        </div>
                        <h1 style={styles.mainTitle}>Recruitment Hub</h1>
                        <p style={styles.subTitle}>Manage and deploy career opportunities for your growing team</p>
                    </div>
                    
                    <div style={styles.headerActions}>
                        <div className="stats-group" style={styles.statsGrid}>
                            <div className="stat-card" style={styles.statCard}>
                                <div style={{...styles.iconBox, background: '#ecfdf5'}}>
                                    <Briefcase size={18} color="#10b981" />
                                </div>
                                <div>
                                    <div style={styles.statVal}>{jobs.length}</div>
                                    <div style={styles.statLab}>Total Jobs</div>
                                </div>
                            </div>
                            <div className="stat-card" style={styles.statCard}>
                                <div style={{...styles.iconBox, background: '#eff6ff'}}>
                                    <CheckCircle size={18} color="#3b82f6" />
                                </div>
                                <div>
                                    <div style={styles.statVal}>{activeJobs}</div>
                                    <div style={styles.statLab}>Live</div>
                                </div>
                            </div>
                            <div className="stat-card" style={styles.statCard}>
                                <div style={{...styles.iconBox, background: '#fff7ed'}}>
                                    <Users size={18} color="#ff961a" />
                                </div>
                                <div>
                                    <div style={styles.statVal}>{totalApplications}</div>
                                    <div style={styles.statLab}>Applications</div>
                                </div>
                            </div>
                        </div>
                        <button className="add-btn" onClick={() => setIsModalOpen(true)} style={styles.addNewBtn}>
                            <PlusCircle size={20} />
                            <span>Post New Opportunity</span>
                        </button>
                    </div>
                </div>

                {/* Full Width Listings */}
                <section className="animate-list" style={styles.listSection}>
                    <div style={styles.listHeader}>
                        <ListFilter size={20} color="#ff961a" />
                        <h3 style={styles.cardTitle}>Active Vacancies</h3>
                        <span style={styles.jobCount}>{jobs.length} positions</span>
                    </div>

                    <div style={styles.jobListings}>
                        {jobs.map((job, index) => (
                            <div 
                                key={job._id} 
                                className="job-card"
                                style={styles.jobItem}
                            >
                                <div style={styles.jobMainInfo}>
                                    <div style={styles.jobHeaderRow}>
                                        <h4 style={styles.jobTitleText}>{job.title}</h4>
                                        <div style={{
                                            ...styles.badge, 
                                            backgroundColor: job.active ? '#dcfce7' : '#f1f5f9',
                                            color: job.active ? '#15803d' : '#64748b'
                                        }}>
                                            {job.active ? 'Public' : 'Draft'}
                                        </div>
                                    </div>
                                    <div style={styles.jobMetaRow}>
                                        <span style={styles.metaLabel}>
                                            <Building2 size={14} /> {job.department}
                                        </span>
                                        <span style={styles.metaLabel}>
                                            <Clock size={14} /> {job.type}
                                        </span>
                                        <span style={styles.metaLabel}>
                                            <MapPin size={14} /> {job.location}
                                        </span>
                                        <span style={styles.metaLabel}>
                                            <DollarSign size={14} /> {job.salary}
                                        </span>
                                    </div>
                                    {job.description && (
                                        <p style={styles.jobPreview}>
                                            {job.description.length > 100 
                                                ? job.description.substring(0, 100) + '...' 
                                                : job.description}
                                        </p>
                                    )}
                                </div>
                                
                                <div style={styles.jobActions}>
                                    <button 
                                        className="action-btn toggle-btn"
                                        onClick={() => toggleStatus(job._id)} 
                                        style={styles.actionBtn}
                                        disabled={togglingId === job._id}
                                    >
                                        {togglingId === job._id ? (
                                            <div style={styles.spinnerSmall}></div>
                                        ) : job.active ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                    <button 
                                        className="action-btn delete-btn"
                                        onClick={() => deleteJob(job._id)} 
                                        style={styles.deleteBtn}
                                        disabled={deletingId === job._id}
                                    >
                                        {deletingId === job._id ? (
                                            <div style={styles.spinnerSmall}></div>
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                        {jobs.length === 0 && (
                            <div className="empty-state" style={styles.emptyState}>
                                <div style={styles.emptyIcon}>🎯</div>
                                <p>No job listings found</p>
                                <span>Click "Post New Opportunity" to create your first job posting</span>
                            </div>
                        )}
                    </div>
                </section>

                {/* Modal Overlay */}
                {isModalOpen && (
                    <div className="modal-overlay" style={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                        <div className="modal-content" style={styles.modalContent} onClick={e => e.stopPropagation()}>
                            <div style={styles.modalHeader}>
                                <div>
                                    <div style={styles.modalBadge}>
                                        <Sparkles size={14} />
                                        <span>New Listing</span>
                                    </div>
                                    <h3 style={styles.modalTitle}>Create Job Listing</h3>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} style={styles.closeBtn}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleSubmit} style={styles.form}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Job Title</label>
                                    <input 
                                        name="title" 
                                        style={styles.input} 
                                        value={formData.title} 
                                        onChange={handleInput} 
                                        required 
                                        placeholder="e.g., Senior Product Designer" 
                                    />
                                </div>

                                <div style={styles.grid2}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Department</label>
                                        <input 
                                            name="department" 
                                            style={styles.input} 
                                            value={formData.department} 
                                            onChange={handleInput} 
                                            required 
                                            placeholder="Engineering" 
                                        />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Job Type</label>
                                        <select 
                                            name="type" 
                                            style={styles.input} 
                                            value={formData.type} 
                                            onChange={handleInput}
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Remote">Remote</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={styles.grid2}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Location</label>
                                        <input 
                                            name="location" 
                                            style={styles.input} 
                                            value={formData.location} 
                                            onChange={handleInput} 
                                            required 
                                            placeholder="Karachi / Remote" 
                                        />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Salary Range</label>
                                        <input 
                                            name="salary" 
                                            style={styles.input} 
                                            value={formData.salary} 
                                            onChange={handleInput} 
                                            required 
                                            placeholder="e.g., 80k - 120k" 
                                        />
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>
                                        Requirements <span style={styles.inputHint}>(Separated by commas)</span>
                                    </label>
                                    <input 
                                        name="requirements" 
                                        style={styles.input} 
                                        value={formData.requirements} 
                                        onChange={handleInput} 
                                        required 
                                        placeholder="React, Node.js, SQL, Team Leadership..." 
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Detailed Description</label>
                                    <textarea 
                                        name="description" 
                                        style={styles.textarea} 
                                        value={formData.description} 
                                        onChange={handleInput} 
                                        required 
                                        placeholder="What are the core responsibilities and qualifications?"
                                        rows={4}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading} 
                                    style={loading ? styles.btnDisabled : styles.primaryBtn}
                                    className="submit-btn"
                                >
                                    {loading ? (
                                        <>
                                            <div style={styles.spinner}></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Publish Vacancy
                                            <Send size={16} style={{marginLeft: '8px'}} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

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
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
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
                
                .animate-list {
                    animation: slideUp 0.5s ease forwards;
                    opacity: 0;
                    animation-delay: 0.2s;
                }
                
                .job-card {
                    transition: all 0.3s ease;
                    animation: slideUp 0.4s ease forwards;
                    opacity: 0;
                }
                .job-card:nth-child(1) { animation-delay: 0.05s; }
                .job-card:nth-child(2) { animation-delay: 0.1s; }
                .job-card:nth-child(3) { animation-delay: 0.15s; }
                .job-card:nth-child(4) { animation-delay: 0.2s; }
                .job-card:nth-child(5) { animation-delay: 0.25s; }
                
                .job-card:hover {
                    transform: translateX(5px);
                    border-color: rgba(255,150,26,0.3);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.08);
                }
                
                .action-btn {
                    transition: all 0.2s ease;
                }
                .action-btn:hover {
                    transform: translateY(-2px);
                }
                
                .submit-btn {
                    transition: all 0.3s ease;
                }
                .submit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                }
                
                .modal-overlay {
                    animation: fadeInScale 0.3s ease forwards;
                }
                
                .modal-content {
                    animation: slideUp 0.4s ease forwards;
                }
                
                .empty-state {
                    animation: fadeInScale 0.4s ease;
                }
                
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: #ff961a;
                    box-shadow: 0 0 0 3px rgba(255,150,26,0.1);
                }
            `}</style>
        </div>
    );
};

const styles = {
    pageWrapper: { 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
        padding: '30px 35px', 
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
        maxWidth: '1200px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
    },
    header: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '40px', 
        flexWrap: 'wrap', 
        gap: '20px' 
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
    mainTitle: { 
        fontSize: '32px', 
        fontWeight: '800', 
        color: '#1e293b', 
        margin: 0, 
        letterSpacing: '-0.5px' 
    },
    subTitle: { 
        color: '#64748b', 
        fontSize: '14px', 
        marginTop: '8px' 
    },
    addNewBtn: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        padding: '12px 28px', 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '16px', 
        fontWeight: '600', 
        cursor: 'pointer', 
        transition: 'all 0.3s ease',
        fontSize: '14px'
    },
    statsGrid: { 
        display: 'flex', 
        gap: '12px' 
    },
    statCard: { 
        background: '#fff', 
        padding: '12px 20px', 
        borderRadius: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        border: '1px solid #e2e8f0',
        transition: 'all 0.3s ease'
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
    iconBox: { 
        padding: '8px', 
        borderRadius: '12px' 
    },
    listSection: { 
        width: '100%' 
    },
    listHeader: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '20px' 
    },
    cardTitle: { 
        fontSize: '18px', 
        fontWeight: '700', 
        color: '#1e293b', 
        margin: 0 
    },
    jobCount: {
        fontSize: '12px',
        color: '#94a3b8',
        background: '#f1f5f9',
        padding: '4px 10px',
        borderRadius: '20px'
    },
    jobListings: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px' 
    },
    jobItem: { 
        background: '#fff', 
        padding: '22px 24px', 
        borderRadius: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        border: '1px solid #e2e8f0', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        gap: '20px',
        flexWrap: 'wrap'
    },
    jobMainInfo: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px', 
        flex: 1 
    },
    jobHeaderRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
    },
    jobTitleText: { 
        fontSize: '18px', 
        fontWeight: '700', 
        color: '#1e293b', 
        margin: 0 
    },
    jobMetaRow: { 
        display: 'flex', 
        gap: '20px', 
        flexWrap: 'wrap' 
    },
    metaLabel: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        fontSize: '13px', 
        color: '#64748b' 
    },
    jobPreview: {
        fontSize: '13px',
        color: '#94a3b8',
        margin: '4px 0 0 0',
        lineHeight: '1.5'
    },
    jobActions: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px' 
    },
    badge: { 
        padding: '5px 12px', 
        borderRadius: '10px', 
        fontSize: '11px', 
        fontWeight: '700' 
    },
    actionBtn: { 
        background: '#fff', 
        border: '1px solid #e2e8f0', 
        padding: '10px', 
        borderRadius: '12px', 
        cursor: 'pointer', 
        color: '#64748b',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    deleteBtn: { 
        background: '#fff', 
        border: '1px solid #fee2e2', 
        padding: '10px', 
        borderRadius: '12px', 
        cursor: 'pointer', 
        color: '#ef4444',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalOverlay: { 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        background: 'rgba(15, 23, 42, 0.7)', 
        backdropFilter: 'blur(8px)', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        zIndex: 1000 
    },
    modalContent: { 
        background: '#fff', 
        width: '100%', 
        maxWidth: '620px', 
        borderRadius: '28px', 
        padding: '28px', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        maxHeight: '85vh',
        overflowY: 'auto'
    },
    modalHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '24px' 
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
    closeBtn: { 
        background: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        width: '36px', 
        height: '36px', 
        borderRadius: '50%', 
        cursor: 'pointer', 
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s'
    },
    form: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px' 
    },
    grid2: { 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px' 
    },
    inputGroup: { 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px' 
    },
    label: { 
        fontSize: '12px', 
        fontWeight: '700', 
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    inputHint: {
        fontSize: '10px',
        fontWeight: '400',
        color: '#94a3b8',
        textTransform: 'none'
    },
    input: { 
        padding: '12px 14px', 
        borderRadius: '14px', 
        border: '2px solid #e2e8f0', 
        fontSize: '14px', 
        outline: 'none', 
        backgroundColor: '#f8fafc',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit'
    },
    textarea: { 
        padding: '12px 14px', 
        borderRadius: '14px', 
        border: '2px solid #e2e8f0', 
        fontSize: '14px', 
        minHeight: '100px', 
        resize: 'vertical', 
        backgroundColor: '#f8fafc', 
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'all 0.2s ease'
    },
    primaryBtn: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '14px', 
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '16px', 
        fontWeight: '700', 
        cursor: 'pointer', 
        fontSize: '15px', 
        marginTop: '8px',
        transition: 'all 0.3s ease'
    },
    btnDisabled: { 
        padding: '14px', 
        borderRadius: '16px', 
        background: '#cbd5e1', 
        color: '#94a3b8', 
        border: 'none', 
        cursor: 'not-allowed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    },
    spinner: {
        width: '18px',
        height: '18px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginRight: '8px'
    },
    spinnerSmall: {
        width: '16px',
        height: '16px',
        border: '2px solid #e2e8f0',
        borderTop: '2px solid #ff961a',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
    },
    emptyState: { 
        textAlign: 'center', 
        padding: '80px 20px', 
        border: '2px dashed #e2e8f0', 
        borderRadius: '24px',
        backgroundColor: '#fff',
        color: '#94a3b8'
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '16px',
        opacity: 0.5
    }
};

export default AdminJobManager;