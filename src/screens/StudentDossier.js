// StudentDossier.js
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, MapPin, Phone, GraduationCap, 
  Briefcase, FileText, Globe, Mail, 
  ExternalLink, Award, Calendar, User, ShieldCheck,
  Loader2, AlertCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const StudentDossier = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  const userId = location.state?.userId;

  useEffect(() => {
    if (!userId) {
      setError('No student ID provided');
      setLoading(false);
      return;
    }
    fetchStudentData(userId);
  }, [userId]);

  const fetchStudentData = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/admin/users/student/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch student data');
      }
      
      const data = await res.json();
      setStudentData(data);
    } catch (err) {
      console.error('Error fetching student:', err);
      setError(err.message);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const DetailItem = ({ label, value, icon: Icon }) => (
    <div style={styles.detailCard}>
      <div style={styles.detailLabelWrap}>
        {Icon && <Icon size={14} style={{ color: '#EAB308' }} />}
        <label style={styles.detailLabel}>{label}</label>
      </div>
      <p style={styles.detailValue}>{value || '—'}</p>
    </div>
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 size={48} color="#EAB308" />
        </motion.div>
        <p style={{ color: '#64748b', marginTop: '16px' }}>Loading student dossier...</p>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontWeight: 900, fontSize: '24px' }}>STUDENT NOT FOUND</h2>
          <p style={{ color: '#64748b', margin: '8px 0 24px' }}>{error || 'No student record found'}</p>
          <button onClick={() => navigate(-1)} style={styles.primaryBtn}>BACK TO DASHBOARD</button>
        </div>
      </div>
    );
  }

  const { formData = {}, experiences = [] } = studentData;

  return (
    <div style={styles.pageWrapper}>
      {/* Top Navigation */}
      <nav style={styles.navBar}>
        <div style={styles.navContent}>
          <button onClick={() => navigate(-1)} style={styles.backBtn}>
            <ArrowLeft size={18} />
            <span>RETURN TO ARCHIVE</span>
          </button>
          <div style={styles.idBadge}>
            REF: {studentData._id?.slice(-8).toUpperCase()}
          </div>
        </div>
      </nav>

      <main style={styles.mainContainer}>
        {/* Left: Identity Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.profileCard}>
            <div style={styles.avatarContainer}>
              <div style={styles.avatarInner}>
                {formData.fullName ? formData.fullName[0].toUpperCase() : <User size={40} />}
              </div>
            </div>
            
            <h1 style={styles.userName}>{formData.fullName || 'Candidate'}</h1>
            <p style={styles.userSubHeader}>{formData.lastDegree || 'Student'}</p>
            
            <div style={styles.yellowDivider} />
            
            <div style={styles.contactStack}>
              {formData.email && (
                <a href={`mailto:${formData.email}`} style={styles.contactLink}>
                  <Mail size={16} /> {formData.email}
                </a>
              )}
              {formData.contactNo && (
                <div style={styles.contactLink}>
                  <Phone size={16} /> {formData.contactNo}
                </div>
              )}
              {formData.address && (
                <div style={styles.contactLink}>
                  <MapPin size={16} /> {formData.address}
                </div>
              )}
              {formData.linkedin && (
                <a href={formData.linkedin} target="_blank" rel="noreferrer" style={styles.socialLink}>
                  <Globe size={16} /> LINKEDIN PROFILE <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </aside>

        {/* Right: Detailed Dossier */}
        <div style={styles.contentArea}>
          
          {/* Section: Academic */}
          <section style={styles.contentSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.headerIconBox}><GraduationCap size={20} /></div>
              <h2 style={styles.sectionTitle}>Academic Qualifications</h2>
            </div>
            <div style={styles.grid3Col}>
              <DetailItem label="Degree" value={formData.lastDegree} icon={Award} />
              <DetailItem label="Major" value={formData.major} />
              <DetailItem label="Institution" value={formData.institution} />
              <DetailItem label="CGPA/Grade" value={formData.cgpa} />
              <DetailItem label="Year" value={formData.passingYear} icon={Calendar} />
              <DetailItem label="Language" value={formData.ieltsScore} />
            </div>
          </section>

          {/* Section: Experience */}
          <section style={styles.contentSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.headerIconBox}><Briefcase size={20} /></div>
              <h2 style={styles.sectionTitle}>Professional Journey</h2>
            </div>
            
            {experiences && experiences.length > 0 ? (
              <div style={styles.timeline}>
                {experiences.map((exp, i) => (
                  <div key={i} style={styles.timelineItem}>
                    <div style={styles.timelineDot} />
                    <div style={styles.experienceCard}>
                      <div style={styles.expHeader}>
                        <h3 style={styles.expRole}>{exp.role || 'Position'}</h3>
                        <span style={styles.expDate}>{exp.start || ''} — {exp.end || ''}</span>
                      </div>
                      <div style={styles.expField}>{exp.field || 'Field'}</div>
                      <p style={styles.expDesc}>{exp.description || 'No description provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.emptyState}>No professional history provided.</div>
            )}
          </section>

          {/* Section: SOP */}
          <section style={styles.contentSection}>
            <div style={styles.sectionHeader}>
              <div style={styles.headerIconBox}><FileText size={20} /></div>
              <h2 style={styles.sectionTitle}>Statement of Purpose</h2>
            </div>
            <div style={styles.sopBox}>
              <p style={styles.sopText}>{formData.statementOfPurpose || "No statement on file."}</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
    fontFamily: '"Inter", sans-serif',
    color: '#000000',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  navBar: {
    backgroundColor: '#000000',
    padding: '12px 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.5px'
  },
  idBadge: {
    fontFamily: 'monospace',
    fontSize: '12px',
    backgroundColor: '#EAB308',
    padding: '6px 14px',
    borderRadius: '2px',
    color: '#000000',
    fontWeight: 800
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '40px',
  },
  sidebar: {
    position: 'sticky',
    top: '100px',
    height: 'fit-content'
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '40px 24px',
    textAlign: 'center',
    border: '1px solid #E2E8F0',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
  },
  avatarContainer: {
    width: '110px',
    height: '110px',
    margin: '0 auto 20px',
    padding: '4px',
    borderRadius: '50%',
    border: '2px solid #EAB308',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '42px',
    fontWeight: 900,
    color: '#FFFFFF'
  },
  userName: { fontSize: '22px', fontWeight: 900, margin: '0 0 4px', color: '#000000', textTransform: 'uppercase' },
  userSubHeader: { fontSize: '14px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' },
  yellowDivider: { height: '4px', backgroundColor: '#EAB308', width: '40px', margin: '20px auto' },
  contactStack: { display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left', marginTop: '30px' },
  contactLink: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#000000', textDecoration: 'none', fontWeight: 500 },
  socialLink: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#000000', fontWeight: 800, textDecoration: 'none', borderTop: '1px solid #F1F5F9', paddingTop: '15px' },
  
  contentArea: { display: 'flex', flexDirection: 'column', gap: '30px' },
  contentSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '32px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '32px' },
  headerIconBox: { 
    backgroundColor: '#000000', 
    color: '#EAB308', 
    padding: '8px', 
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: { fontSize: '16px', fontWeight: 900, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' },
  
  grid3Col: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
  detailCard: { padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', borderLeft: '3px solid #000000' },
  detailLabelWrap: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  detailLabel: { fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' },
  detailValue: { fontSize: '15px', fontWeight: 700, color: '#000000', margin: '0' },

  timeline: { borderLeft: '2px solid #E2E8F0', marginLeft: '10px', display: 'flex', flexDirection: 'column', gap: '24px' },
  timelineItem: { position: 'relative', paddingLeft: '30px' },
  timelineDot: { position: 'absolute', left: '-7px', top: '22px', width: '12px', height: '12px', backgroundColor: '#EAB308', borderRadius: '50%', border: '2px solid #FFFFFF' },
  experienceCard: { backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '8px', border: '1px solid #E2E8F0' },
  expHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' },
  expRole: { fontSize: '16px', fontWeight: 800, color: '#000000', margin: 0 },
  expDate: { fontSize: '10px', fontWeight: 900, color: '#FFFFFF', backgroundColor: '#000000', padding: '4px 10px', borderRadius: '20px' },
  expField: { fontSize: '12px', color: '#EAB308', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' },
  expDesc: { fontSize: '14px', lineHeight: '1.6', color: '#475569', margin: 0 },

  sopBox: { backgroundColor: '#FFFFFF', padding: '24px', border: '1px dashed #CBD5E1', borderRadius: '8px' },
  sopText: { fontSize: '15px', lineHeight: '1.8', color: '#1E293B', whiteSpace: 'pre-line', margin: 0 },
  
  emptyState: { textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '14px', border: '2px dashed #E2E8F0', borderRadius: '8px' },
  errorContainer: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  errorCard: { textAlign: 'center', backgroundColor: '#FFFFFF', padding: '60px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  primaryBtn: { backgroundColor: '#000000', color: '#EAB308', border: 'none', padding: '14px 28px', borderRadius: '4px', fontWeight: 900, cursor: 'pointer', fontSize: '13px', letterSpacing: '1px' }
};

export default StudentDossier;