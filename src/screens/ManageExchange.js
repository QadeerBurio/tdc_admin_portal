import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, X, Edit3, 
  GraduationCap, Calendar, Clock, ExternalLink, MapPin, CheckCircle2,
  Info, Users, Sparkles, Globe, Award,
  Upload, FileSpreadsheet, Database, Filter, Search, Download,
  Loader2, ChevronDown, ChevronUp, Zap, Star, 
  Shield, BookOpen, Target, ArrowRight, TrendingUp
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext'; 
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [autoCreateScholarships, setAutoCreateScholarships] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDegree, setFilterDegree] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [fileLoaded, setFileLoaded] = useState(false);

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
    duration: '', link: '',
    requirements: [...defaultRequirements],
    scholarship: {
      name: '',
      amount: '',
      currency: 'USD',
      description: '',
      deadline: '',
      requirements: []
    }
  };

  const [formData, setFormData] = useState(initialFormState);

  const BASE_URL = 'https://the-deft-crew-production.up.railway.app/api/admin/exchange';
  
  const api = axios.create({ 
    headers: { Authorization: `Bearer ${token}` } 
  });

  useEffect(() => { 
    if (token) fetchPrograms(); 
  }, [token]);

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
      setFormData({ 
        ...program,
        scholarship: program.scholarship || initialFormState.scholarship
      });
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

  const addScholarshipRequirement = (e) => {
    e.preventDefault();
    const input = document.getElementById('scholarshipReq');
    if (input && input.value.trim()) {
      setFormData({
        ...formData,
        scholarship: {
          ...formData.scholarship,
          requirements: [...(formData.scholarship.requirements || []), input.value.trim()]
        }
      });
      input.value = '';
    }
  };

  const removeScholarshipRequirement = (index) => {
    const updatedReqs = (formData.scholarship.requirements || []).filter((_, i) => i !== index);
    setFormData({
      ...formData,
      scholarship: {
        ...formData.scholarship,
        requirements: updatedReqs
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const submitData = {
        title: formData.title,
        university: formData.university,
        location: formData.location,
        degree: formData.degree,
        appStart: formData.appStart,
        deadline: formData.deadline,
        duration: formData.duration,
        link: formData.link || '',
        requirements: formData.requirements || []
      };

      if (formData.scholarship?.name) {
        submitData.scholarship = formData.scholarship;
      }
      
      if (editingId) {
        await api.put(`${BASE_URL}/update/${editingId}`, submitData);
      } else {
        await api.post(`${BASE_URL}/add`, submitData);
      }
      setModalVisible(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchPrograms();
    } catch (err) { 
      alert(err.response?.data?.message || err.message || "Operation failed."); 
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    
    setExcelFile(file);
    setFileLoaded(true);
    setUploadComplete(false);
    readExcelFile(file);
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        if (jsonData.length === 0) {
          alert('The Excel file is empty. Please add data and try again.');
          return;
        }
        
        const transformedData = jsonData.map((row, index) => {
          const program = {
            title: String(row['Program Title'] || row['Title'] || '').trim(),
            university: String(row['University'] || row['Institution'] || '').trim(),
            location: String(row['Location'] || row['City/Country'] || '').trim(),
            degree: detectDegree(row['Degree'] || row['Program Type'] || ''),
            duration: String(row['Duration'] || row['Program Length'] || '').trim(),
            deadline: formatDate(row['Application Deadline'] || row['Deadline'] || ''),
            appStart: formatDate(row['Application Start'] || row['Start Date'] || ''),
            link: String(row['Application URL'] || row['Link'] || '').trim(),
            requirements: parseRequirements(row['Requirements'] || row['Prerequisites'] || ''),
            scholarship: {
              name: String(row['Scholarship Name'] || row['Scholarship'] || '').trim(),
              amount: String(row['Scholarship Amount'] || row['Amount'] || '').trim(),
              currency: String(row['Currency'] || 'USD').trim(),
              description: String(row['Scholarship Description'] || row['Description'] || '').trim(),
              deadline: formatDate(row['Scholarship Deadline'] || ''),
              requirements: parseRequirements(row['Scholarship Requirements'] || '')
            }
          };
          return program;
        }).filter(item => item.title && item.university);
        
        if (transformedData.length === 0) {
          alert('No valid programs found in the Excel file. Please check that each row has a Program Title and University.');
          return;
        }
        
        setPreviewData(transformedData);
        setUploadStatus(`✅ Loaded ${transformedData.length} programs from Excel`);
        setUploadProgress(100);
        setUploadComplete(false);
        
      } catch (error) {
        console.error('Error reading Excel:', error);
        alert('Error reading Excel file. Please check the format.\n' + error.message);
        setFileLoaded(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const detectDegree = (value) => {
    const degree = String(value).toLowerCase().trim();
    if (degree.includes('phd') || degree.includes('doctor')) return 'PhD';
    if (degree.includes('master') || degree.includes('msc') || degree.includes('ma')) return 'Masters';
    if (degree.includes('bachelor') || degree.includes('bsc') || degree.includes('ba')) return 'Bachelors';
    return 'Exchange';
  };

  const parseRequirements = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(r => r && r.trim());
    return String(value).split(',').map(r => r.trim()).filter(r => r);
  };

  const formatDate = (value) => {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return String(value);
    } catch {
      return String(value);
    }
  };

  const uploadExcelData = async () => {
    if (previewData.length === 0) {
      alert('No data to upload. Please load an Excel file first.');
      return;
    }

    setIsUploading(true);
    setUploadComplete(false);
    setUploadProgress(0);
    setUploadStatus('🚀 Starting upload...');

    try {
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (let i = 0; i < previewData.length; i++) {
        const program = previewData[i];
        
        try {
          const submitData = {
            title: program.title,
            university: program.university,
            location: program.location,
            degree: program.degree || 'Bachelors',
            appStart: program.appStart,
            deadline: program.deadline,
            duration: program.duration,
            link: program.link || '',
            requirements: program.requirements || []
          };

          if (autoCreateScholarships && program.scholarship?.name) {
            submitData.scholarship = {
              name: program.scholarship.name,
              amount: program.scholarship.amount || '',
              currency: program.scholarship.currency || 'USD',
              description: program.scholarship.description || '',
              deadline: program.scholarship.deadline || '',
              requirements: program.scholarship.requirements || []
            };
          }

          const response = await api.post(`${BASE_URL}/add`, submitData);
          
          if (response.status === 201 || response.status === 200) {
            successCount++;
          } else {
            failCount++;
            errors.push(`Program ${i+1}: ${response.data?.message || 'Unknown error'}`);
          }
        } catch (err) {
          failCount++;
          const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown error';
          errors.push(`Program ${i+1}: ${errorMsg}`);
        }

        const progress = ((i + 1) / previewData.length) * 100;
        setUploadProgress(Math.round(progress));
        setUploadStatus(`📊 ${Math.round(progress)}% - ${i + 1}/${previewData.length} programs (${successCount} ✅, ${failCount} ❌)`);
      }

      let finalMessage = `✅ Upload Complete! ${successCount} programs added, ${failCount} failed.`;
      if (errors.length > 0) {
        finalMessage += `\n\nErrors:\n${errors.slice(0, 5).join('\n')}`;
        if (errors.length > 5) {
          finalMessage += `\n... and ${errors.length - 5} more errors`;
        }
      }
      
      setUploadStatus(finalMessage);
      setUploadProgress(100);
      setUploadComplete(true);

      await fetchPrograms();

      if (failCount > 0) {
        alert(`📊 Upload Summary:\n✅ ${successCount} programs added\n❌ ${failCount} failed\n\nCheck the status message for details.`);
      } else {
        alert(`🎉 All ${successCount} programs uploaded successfully!`);
      }

      setTimeout(() => {
        setUploadModalVisible(false);
        resetUploadState();
      }, 3000);

    } catch (error) {
      setUploadStatus('❌ Upload failed: ' + error.message);
      alert('Error uploading programs. Please try again.\n' + error.message);
      setIsUploading(false);
    }
  };

  const resetUploadState = () => {
    setExcelFile(null);
    setPreviewData([]);
    setUploadProgress(0);
    setUploadStatus('');
    setIsUploading(false);
    setUploadComplete(false);
    setFileLoaded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Program Title': 'Global Leadership Semester',
        'University': 'National University of Singapore',
        'Location': 'Singapore',
        'Degree': 'Bachelors',
        'Duration': '1 Semester',
        'Application Deadline': '2026-01-15',
        'Application Start': '2025-09-01',
        'Application URL': 'https://example.com/apply',
        'Requirements': 'Full-time enrollment, Strong academic record, Language Proficiency',
        'Scholarship Name': 'Global Leaders Scholarship',
        'Scholarship Amount': '5000',
        'Currency': 'USD',
        'Scholarship Description': 'Merit-based scholarship for outstanding students',
        'Scholarship Deadline': '2025-12-01',
        'Scholarship Requirements': 'Minimum GPA 3.5, Leadership experience'
      }
    ];
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, "Programs");
    XLSX.writeFile(wb, "exchange_programs_template.xlsx");
  };

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = (program.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (program.university || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (program.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDegree = filterDegree === 'All' || program.degree === filterDegree;
    const matchesStatus = filterStatus === 'All' || 
                         (filterStatus === 'Active' && program.active) ||
                         (filterStatus === 'Draft' && !program.active);
    return matchesSearch && matchesDegree && matchesStatus;
  });

  const activeCount = programs.filter(p => p.active).length;

  // Create/Edit Modal
  const renderModal = () => (
    <AnimatePresence>
      {modalVisible && (
        <motion.div 
          className="modal-overlay" 
          style={styles.modalOverlay} 
          onClick={() => setModalVisible(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-content" 
            style={styles.modalContent} 
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalBadge}>
                  <Globe size={14} />
                  <span>{editingId ? 'Edit Program' : 'New Exchange Program'}</span>
                </div>
                <h2 style={styles.modalTitle}>
                  {editingId ? 'Update Program Details' : 'Create Exchange Program'}
                </h2>
              </div>
              <button className="close-modal" onClick={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.tabs}>
              <button 
                className="tab-btn"
                style={activeTab === 'details' ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab('details')}
              >
                <Info size={16} /> Details
              </button>
              <button 
                className="tab-btn"
                style={activeTab === 'requirements' ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab('requirements')}
              >
                <Shield size={16} /> Requirements
              </button>
              <button 
                className="tab-btn"
                style={activeTab === 'scholarship' ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab('scholarship')}
              >
                <Award size={16} /> Scholarship
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.tabContent}>
                {activeTab === 'details' && (
                  <div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Program Title *</label>
                      <input
                        style={styles.input}
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g., Global Leadership Semester"
                        required
                      />
                    </div>

                    <div style={styles.inputRow}>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>University/Institution *</label>
                        <input
                          style={styles.input}
                          value={formData.university}
                          onChange={(e) => setFormData({...formData, university: e.target.value})}
                          placeholder="e.g., University of Cambridge"
                          required
                        />
                      </div>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Location *</label>
                        <input
                          style={styles.input}
                          value={formData.location}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          placeholder="e.g., Cambridge, UK"
                          required
                        />
                      </div>
                    </div>

                    <div style={styles.inputRow}>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Degree Type *</label>
                        <select
                          style={styles.input}
                          value={formData.degree}
                          onChange={(e) => setFormData({...formData, degree: e.target.value})}
                        >
                          <option value="Bachelors">Bachelors</option>
                          <option value="Masters">Masters</option>
                          <option value="PhD">PhD</option>
                          <option value="Exchange">Exchange</option>
                        </select>
                      </div>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Duration *</label>
                        <input
                          style={styles.input}
                          value={formData.duration}
                          onChange={(e) => setFormData({...formData, duration: e.target.value})}
                          placeholder="e.g., 1 Semester"
                          required
                        />
                      </div>
                    </div>

                    <div style={styles.inputRow}>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Application Start Date</label>
                        <input
                          style={styles.input}
                          type="date"
                          value={formData.appStart}
                          onChange={(e) => setFormData({...formData, appStart: e.target.value})}
                        />
                      </div>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Application Deadline</label>
                        <input
                          style={styles.input}
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                        />
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Application URL</label>
                      <input
                        style={styles.input}
                        value={formData.link}
                        onChange={(e) => setFormData({...formData, link: e.target.value})}
                        placeholder="https://example.com/apply"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'requirements' && (
                  <div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Program Requirements</label>
                      <div style={styles.requirementHeader}>
                        <div style={{display: 'flex', gap: '10px', width: '100%'}}>
                          <input
                            style={{...styles.input, flex: 1}}
                            value={reqInput}
                            onChange={(e) => setReqInput(e.target.value)}
                            placeholder="e.g., Strong academic record"
                            onKeyDown={(e) => e.key === 'Enter' && addRequirement(e)}
                          />
                          <button
                            type="button"
                            style={styles.smallAddBtn}
                            onClick={addRequirement}
                          >
                            <Plus size={16} /> Add
                          </button>
                        </div>
                      </div>
                      <div style={styles.requirementList}>
                        {formData.requirements.length === 0 ? (
                          <div style={styles.emptyReqs}>No requirements added yet</div>
                        ) : (
                          formData.requirements.map((req, idx) => (
                            <div key={idx} className="req-item" style={styles.reqBadge}>
                              <CheckCircle2 size={14} color="#10b981" />
                              <span style={{flex: 1, fontSize: '13px'}}>{req}</span>
                              <button
                                type="button"
                                onClick={() => removeRequirement(idx)}
                                style={styles.removeReqIcon}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'scholarship' && (
                  <div>
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Scholarship Name</label>
                      <input
                        style={styles.input}
                        value={formData.scholarship.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          scholarship: {...formData.scholarship, name: e.target.value}
                        })}
                        placeholder="e.g., Global Excellence Scholarship"
                      />
                    </div>

                    <div style={styles.inputRow}>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Amount</label>
                        <input
                          style={styles.input}
                          value={formData.scholarship.amount}
                          onChange={(e) => setFormData({
                            ...formData,
                            scholarship: {...formData.scholarship, amount: e.target.value}
                          })}
                          placeholder="e.g., 5000"
                        />
                      </div>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Currency</label>
                        <select
                          style={styles.input}
                          value={formData.scholarship.currency}
                          onChange={(e) => setFormData({
                            ...formData,
                            scholarship: {...formData.scholarship, currency: e.target.value}
                          })}
                        >
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="PKR">PKR</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Description</label>
                      <textarea
                        style={{...styles.input, minHeight: '60px', resize: 'vertical'}}
                        value={formData.scholarship.description}
                        onChange={(e) => setFormData({
                          ...formData,
                          scholarship: {...formData.scholarship, description: e.target.value}
                        })}
                        placeholder="Describe the scholarship opportunity..."
                      />
                    </div>

                    <div style={styles.inputRow}>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Scholarship Deadline</label>
                        <input
                          style={styles.input}
                          type="date"
                          value={formData.scholarship.deadline}
                          onChange={(e) => setFormData({
                            ...formData,
                            scholarship: {...formData.scholarship, deadline: e.target.value}
                          })}
                        />
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Scholarship Requirements</label>
                      <div style={styles.requirementHeader}>
                        <div style={{display: 'flex', gap: '10px', width: '100%'}}>
                          <input
                            id="scholarshipReq"
                            style={{...styles.input, flex: 1}}
                            placeholder="e.g., Minimum GPA 3.5"
                            onKeyDown={(e) => e.key === 'Enter' && addScholarshipRequirement(e)}
                          />
                          <button
                            type="button"
                            style={styles.smallAddBtn}
                            onClick={addScholarshipRequirement}
                          >
                            <Plus size={16} /> Add
                          </button>
                        </div>
                      </div>
                      <div style={styles.requirementList}>
                        {(formData.scholarship.requirements || []).length === 0 ? (
                          <div style={styles.emptyReqs}>No scholarship requirements added</div>
                        ) : (
                          (formData.scholarship.requirements || []).map((req, idx) => (
                            <div key={idx} className="req-item" style={styles.reqBadge}>
                              <CheckCircle2 size={14} color="#10b981" />
                              <span style={{flex: 1, fontSize: '13px'}}>{req}</span>
                              <button
                                type="button"
                                onClick={() => removeScholarshipRequirement(idx)}
                                style={styles.removeReqIcon}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  style={styles.cancelBtn} 
                  onClick={() => setModalVisible(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={styles.submitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div style={styles.spinnerSmall}></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? 'Update Program' : 'Create Program'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Upload Modal
  const renderUploadModal = () => (
    <AnimatePresence>
      {uploadModalVisible && (
        <motion.div 
          className="modal-overlay" 
          style={styles.modalOverlay} 
          onClick={() => setUploadModalVisible(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="modal-content" 
            style={{...styles.modalContent, maxWidth: '800px'}} 
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 30, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalBadge}>
                  <FileSpreadsheet size={14} />
                  <span>Bulk Upload</span>
                </div>
                <h2 style={styles.modalTitle}>Upload Exchange Programs</h2>
              </div>
              <button className="close-modal" onClick={() => setUploadModalVisible(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={{padding: '24px 28px'}}>
              <div style={styles.uploadArea}>
                <div style={styles.uploadBox}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    style={styles.fileInput}
                    disabled={isUploading}
                  />
                  <div style={styles.uploadIcon}>
                    <FileSpreadsheet size={48} color="#ff961a" />
                  </div>
                  <h4 style={{color: '#1e293b', marginBottom: '8px'}}>
                    {fileLoaded ? '📄 File Loaded!' : 'Upload Excel File'}
                  </h4>
                  <p style={{color: '#94a3b8', fontSize: '14px'}}>
                    {fileLoaded 
                      ? `${previewData.length} programs found. Click "Upload All Programs" to continue.`
                      : 'Drag & drop or click to select .xlsx or .xls file'}
                  </p>
                  <button 
                    onClick={downloadTemplate}
                    style={{...styles.smallAddBtn, background: '#ff961a', padding: '8px 20px', marginTop: '12px'}}
                    disabled={isUploading}
                  >
                    <Download size={16} /> Download Template
                  </button>
                </div>

                {previewData.length > 0 && (
                  <div style={styles.previewSection}>
                    <div style={styles.previewHeader}>
                      <span style={{fontWeight: 600, color: '#1e293b'}}>
                        📊 Preview ({previewData.length} programs found)
                      </span>
                      <label style={styles.autoScholarshipLabel}>
                        <input
                          type="checkbox"
                          checked={autoCreateScholarships}
                          onChange={(e) => setAutoCreateScholarships(e.target.checked)}
                          disabled={isUploading}
                        />
                        Auto-create scholarships
                      </label>
                    </div>
                    
                    <div style={styles.previewTable}>
                      <table style={{width: '100%', fontSize: '13px', borderCollapse: 'collapse'}}>
                        <thead>
                          <tr style={{background: '#f8fafc'}}>
                            <th style={{padding: '8px 12px', textAlign: 'left'}}>#</th>
                            <th style={{padding: '8px 12px', textAlign: 'left'}}>Program</th>
                            <th style={{padding: '8px 12px', textAlign: 'left'}}>University</th>
                            <th style={{padding: '8px 12px', textAlign: 'left'}}>Degree</th>
                            <th style={{padding: '8px 12px', textAlign: 'left'}}>Scholarship</th>
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.slice(0, 5).map((prog, idx) => (
                            <tr key={idx} style={{borderBottom: '1px solid #f1f5f9'}}>
                              <td style={{padding: '8px 12px', color: '#94a3b8'}}>{idx + 1}</td>
                              <td style={{padding: '8px 12px', fontWeight: 500}}>{prog.title}</td>
                              <td style={{padding: '8px 12px'}}>{prog.university}</td>
                              <td style={{padding: '8px 12px'}}>
                                <span style={styles.degreeTag}>{prog.degree}</span>
                              </td>
                              <td style={{padding: '8px 12px'}}>
                                {prog.scholarship?.name ? '✅' : '❌'}
                              </td>
                            </tr>
                          ))}
                          {previewData.length > 5 && (
                            <tr>
                              <td colSpan={5} style={{padding: '8px 12px', textAlign: 'center', color: '#94a3b8'}}>
                                ... and {previewData.length - 5} more programs
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {uploadStatus && (
                      <div style={styles.uploadStatus}>
                        <div style={styles.progressBar}>
                          <div 
                            style={{
                              ...styles.progressFill, 
                              width: `${uploadProgress}%`,
                              transition: 'width 0.5s ease-in-out',
                              background: uploadComplete 
                                ? 'linear-gradient(90deg, #10b981, #059669)' 
                                : 'linear-gradient(90deg, #ff961a, #f59e0b)'
                            }}
                          >
                            <span style={styles.progressText}>{uploadProgress}%</span>
                          </div>
                        </div>
                        <p style={{fontSize: '14px', color: '#475569', marginTop: '8px', whiteSpace: 'pre-wrap'}}>
                          {uploadStatus}
                        </p>
                        {uploadComplete && (
                          <div style={styles.completeBadge}>
                            ✅ Upload Complete!
                          </div>
                        )}
                      </div>
                    )}

                    <div style={styles.uploadActions}>
                      <button
                        onClick={resetUploadState}
                        style={styles.cancelBtn}
                        disabled={isUploading}
                      >
                        Clear
                      </button>
                      <button
                        onClick={uploadExcelData}
                        disabled={isUploading || uploadComplete}
                        style={{
                          ...styles.submitBtn,
                          background: uploadComplete 
                            ? '#10b981' 
                            : isUploading 
                              ? '#94a3b8' 
                              : '#1e293b',
                          cursor: uploadComplete || isUploading ? 'default' : 'pointer'
                        }}
                      >
                        {isUploading ? (
                          <>
                            <div style={styles.spinnerSmall}></div>
                            Uploading...
                          </>
                        ) : uploadComplete ? (
                          '✅ Complete'
                        ) : (
                          '📤 Upload All Programs'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>

      <div style={styles.container}>
        <motion.div 
          className="animate-header" 
          style={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
              <motion.div className="stat-card" style={styles.statCard} whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
                <div style={{...styles.statIcon, background: '#ecfdf5'}}>
                  <GraduationCap size={18} color="#10b981" />
                </div>
                <div>
                  <div style={styles.statVal}>{programs.length}</div>
                  <div style={styles.statLab}>Total Programs</div>
                </div>
              </motion.div>
              <motion.div className="stat-card" style={styles.statCard} whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
                <div style={{...styles.statIcon, background: '#eff6ff'}}>
                  <Award size={18} color="#3b82f6" />
                </div>
                <div>
                  <div style={styles.statVal}>{activeCount}</div>
                  <div style={styles.statLab}>Active</div>
                </div>
              </motion.div>
              <motion.div className="stat-card" style={styles.statCard} whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
                <div style={{...styles.statIcon, background: '#fef3c7'}}>
                  <Database size={18} color="#f59e0b" />
                </div>
                <div>
                  <div style={styles.statVal}>{programs.filter(p => p.scholarship?.name).length}</div>
                  <div style={styles.statLab}>Scholarships</div>
                </div>
              </motion.div>
            </div>
            <motion.button 
              className="add-btn" 
              style={styles.addButton} 
              onClick={() => openModal()}
              whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={18} /> 
              <span>Create Program</span>
            </motion.button>
            <motion.button 
              className="add-btn" 
              style={{...styles.addButton, background: '#0f172a'}} 
              onClick={() => setUploadModalVisible(true)}
              whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload size={18} /> 
              <span>Bulk Upload</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          style={styles.filterBar}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div style={styles.searchWrapper}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search programs, universities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.filterGroup}>
            <select
              value={filterDegree}
              onChange={(e) => setFilterDegree(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All Degrees</option>
              <option value="Bachelors">Bachelors</option>
              <option value="Masters">Masters</option>
              <option value="PhD">PhD</option>
              <option value="Exchange">Exchange</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </motion.div>

        <main style={styles.main}>
          {loading ? (
            <div className="loader-container" style={styles.loaderContainer}>
              <div className="spinner" style={styles.spinner}></div>
              <p style={{marginTop: '16px', color: '#64748B', fontWeight: 500}}>Loading exchange programs...</p>
            </div>
          ) : (
            <motion.div 
              className="list-container" 
              style={styles.listContainer}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div style={styles.listHeader}>
                <div style={{flex: 2.5}}>PROGRAM DETAILS</div>
                <div style={{flex: 1}}>LOCATION</div>
                <div style={{flex: 1}}>SCHEDULE</div>
                <div style={{flex: 0.8, textAlign: 'center'}}>STATUS</div>
                <div style={{flex: 1.2, textAlign: 'right'}}>ACTIONS</div>
              </div>

              {filteredPrograms.length === 0 ? (
                <div className="empty-state" style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🌍</div>
                  <h3 style={{color: '#1e293b', marginBottom: '4px'}}>
                    {programs.length === 0 ? 'No Programs Registered' : 'No matching programs found'}
                  </h3>
                  <p>
                    {programs.length === 0 
                      ? 'Start by adding your first international exchange opportunity'
                      : 'Try adjusting your search filters'}
                  </p>
                </div>
              ) : (
                filteredPrograms.map((item, index) => (
                  <motion.div 
                    key={item._id} 
                    className="program-row" 
                    style={styles.row}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ backgroundColor: '#f8fafc', x: 4 }}
                  >
                    <div style={{flex: 2.5, display: 'flex', gap: '14px', alignItems: 'center'}}>
                      <div style={{...styles.iconBox, backgroundColor: item.active ? '#fff7ed' : '#f8fafc'}}>
                        <GraduationCap size={20} color={item.active ? '#ff961a' : '#94a3b8'} />
                      </div>
                      <div>
                        <div style={styles.rowTitle}>
                          {item.title}
                          {item.scholarship?.name && (
                            <span style={styles.scholarshipBadge}>
                              <Award size={12} /> Scholarship
                            </span>
                          )}
                        </div>
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
                        <Calendar size={13} /> Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'N/A'}
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
                      <motion.button 
                        className="action-icon"
                        title="View Applications" 
                        onClick={() => navigate('/program', { 
                          state: { programId: item._id, programTitle: item.title } 
                        })} 
                        style={{...styles.actionBtn, color: '#3b82f6', borderColor: '#dbeafe'}}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Users size={16} />
                      </motion.button>
                      <motion.button 
                        className="action-icon"
                        title="External Link" 
                        onClick={() => window.open(item.link, '_blank')} 
                        style={styles.actionBtn}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ExternalLink size={16} />
                      </motion.button>
                      <motion.button 
                        className="action-icon"
                        title="Edit Program" 
                        onClick={() => openModal(item)} 
                        style={styles.actionBtn}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit3 size={16} />
                      </motion.button>
                      <motion.button 
                        className="action-icon"
                        title="Delete" 
                        onClick={() => deleteProgram(item._id)} 
                        disabled={deletingId === item._id}
                        style={{...styles.actionBtn, color: '#ef4444', borderColor: '#fee2e2'}}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {deletingId === item._id ? (
                          <div style={styles.spinnerSmall}></div>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </main>
      </div>

      {renderModal()}
      {renderUploadModal()}

      <style>
        {`
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
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .program-row {
            transition: all 0.3s ease;
          }
          
          .action-icon {
            transition: all 0.2s ease;
          }
          
          .status-btn {
            transition: all 0.2s ease;
          }
          
          .tab-btn {
            transition: all 0.2s ease;
          }
          .tab-btn:hover {
            color: #ff961a;
          }
          
          .req-item {
            transition: all 0.2s ease;
          }
          .req-item:hover {
            background: #e6f7ec;
            transform: translateX(3px);
          }
          
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #ff961a;
            box-shadow: 0 0 0 3px rgba(255,150,26,0.1);
          }

          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #ff961a;
          }

          @media (max-width: 768px) {
            .header {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .headerActions {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .statsRow {
              flex-wrap: wrap !important;
              justify-content: center !important;
            }
            .row {
              flex-wrap: wrap !important;
              gap: 8px !important;
            }
            .listHeader {
              display: none !important;
            }
          }
        `}
      </style>
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
  bgDecoration3: {
    position: 'absolute',
    top: '50%',
    right: '10%',
    width: '150px',
    height: '150px',
    background: 'radial-gradient(circle, rgba(255,150,26,0.03) 0%, rgba(255,150,26,0) 70%)',
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
    marginBottom: '10px'
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
    gap: '12px', 
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
  filterBar: {
    display: 'flex',
    gap: '16px',
    padding: '16px 0 24px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  searchWrapper: {
    flex: 1,
    minWidth: '200px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fff',
    padding: '0 16px',
    borderRadius: '16px',
    border: '2px solid #e2e8f0',
    transition: 'all 0.2s ease'
  },
  searchInput: {
    flex: 1,
    padding: '10px 0',
    border: 'none',
    background: 'transparent',
    fontSize: '14px',
    outline: 'none',
    color: '#1e293b'
  },
  filterGroup: {
    display: 'flex',
    gap: '10px'
  },
  filterSelect: {
    padding: '10px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    background: '#fff',
    fontSize: '13px',
    color: '#1e293b',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease'
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
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
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
  scholarshipBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: '#fef3c7',
    color: '#d97706',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600'
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
    maxHeight: '90vh',
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
    backgroundColor: '#f8fafc',
    fontFamily: 'inherit'
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
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
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
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  uploadBox: {
    border: '2px dashed #e2e8f0',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    background: '#fafbfc',
    position: 'relative',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  },
  fileInput: {
    position: 'absolute',
    inset: 0,
    opacity: 0,
    cursor: 'pointer',
    width: '100%',
    height: '100%'
  },
  uploadIcon: {
    marginBottom: '16px'
  },
  previewSection: {
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '16px',
    background: '#fff'
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  autoScholarshipLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer'
  },
  previewTable: {
    maxHeight: '200px',
    overflow: 'auto',
    border: '1px solid #f1f5f9',
    borderRadius: '12px'
  },
  uploadStatus: {
    marginTop: '12px'
  },
  progressBar: {
    width: '100%',
    height: '24px',
    background: '#e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    position: 'relative'
  },
  progressFill: {
    height: '100%',
    borderRadius: '12px',
    transition: 'width 0.5s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressText: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  completeBadge: {
    marginTop: '8px',
    padding: '8px 16px',
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center'
  },
  uploadActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px'
  }
};

export default ManageExchange;