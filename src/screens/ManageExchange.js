// src/screens/ManageExchange.js
// Scholarships (design/portal/AdScholarships): study abroad programs and funding students see in the app.
import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Ico from '../portal/Ico';
import { PageHeader, PageLoading, Button, Spinner, Field, Input, Textarea, Select, DateInput, Checkbox, SearchInput, StatCard, Tabs, Modal, EmptyState, Pill, Progress, toast, confirmDialog } from '../portal/kit';
import './styles/ManageExchange.css';

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
  const [skippedRows, setSkippedRows] = useState([]);
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDegree, setFilterDegree] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [fileLoaded, setFileLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // const BASE_URL = process.env.REACT_APP_API_URL
  //   ? `${process.env.REACT_APP_API_URL}/api/admin/exchange`
  //   : 'https://the-deft-crew-production.up.railway.app/api/events/admin/exchange';
  
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
      toast(err.response?.data?.message || err.message || "Operation failed."); 
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
    if (await confirmDialog("⚠️ Permanent Action: Delete this program?")) {
      setDeletingId(id);
      try {
        await api.delete(`${BASE_URL}/delete/${id}`);
        setPrograms(programs.filter(p => p._id !== id));
      } catch (err) { 
        toast("Delete failed"); 
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
      'application/vnd.ms-excel',
      'text/csv',
      'application/csv'
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast('Please upload a valid Excel or CSV file (.xlsx, .xls, or .csv)');
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
          toast('The Excel file is empty. Please add data and try again.');
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
          toast('No valid programs found in the Excel file. Please check that each row has a Program Title and University.');
          return;
        }
        
        setPreviewData(transformedData);
        setUploadStatus(`✅ Loaded ${transformedData.length} programs from Excel`);
        setUploadProgress(100);
        setUploadComplete(false);
        
      } catch (error) {
        console.error('Error reading Excel:', error);
        toast('Error reading Excel file. Please check the format.\n' + error.message);
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
    if (!excelFile) {
      toast('No file selected. Please choose an Excel or CSV file first.');
      return;
    }

    setIsUploading(true);
    setUploadComplete(false);
    setUploadProgress(20);
    setUploadStatus('🚀 Starting bulk import...');
    setSkippedRows([]);

    try {
      const formData = new FormData();
      formData.append('file', excelFile);

      const response = await api.post(`${BASE_URL}/bulk-import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });

      const { created = 0, skipped = 0, skippedRows: serverSkippedRows = [] } = response.data || {};

      setSkippedRows(serverSkippedRows);
      setUploadProgress(100);
      setUploadComplete(true);

      let statusMsg = `Upload successful: ${created} programs added`;
      if (skipped > 0) {
        statusMsg += `, ${skipped} rows skipped`;
      }
      setUploadStatus(statusMsg);

      await fetchPrograms();

    } catch (error) {
      console.error('Bulk upload error:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Upload failed';
      setUploadStatus('❌ Upload failed: ' + errorMsg);
      toast('Error uploading programs: ' + errorMsg);
      setIsUploading(false);
    }
  };

  const resetUploadState = () => {
    setExcelFile(null);
    setPreviewData([]);
    setUploadProgress(0);
    setUploadStatus('');
    setSkippedRows([]);
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

  const statusBtn = (item) => (
    <button
      type="button"
      className={`mx-status${item.active ? ' on' : ''}`}
      onClick={() => toggleStatus(item._id)}
      disabled={togglingId === item._id}
      title={item.active ? 'Active: click to set to draft' : 'Draft: click to make active'}
    >
      {togglingId === item._id ? <Spinner size="sm" /> : item.active ? 'Active' : 'Draft'}
    </button>
  );
  const reqList = (items, onRemove, emptyText) => (
    <div className="mx-reqs">
      {items.length === 0 ? (
        <div className="k-hint">{emptyText}</div>
      ) : (
        items.map((req, idx) => (
          <div key={idx} className="mx-req">
            <Ico kind="checkCircle" tone="plain" size={15} />
            <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{req}</span>
            <button type="button" className="k-icon-btn ghost sm" aria-label="remove" title="remove" onClick={() => onRemove(idx)}>
              <Ico kind="close" tone="plain" size={13} />
            </button>
          </div>
        ))
      )}
    </div>
  );
  const degreeSelect = (props) => (
    <Select {...props}>
      <option value="All">All Degrees</option>
      <option value="Bachelors">Bachelors</option>
      <option value="Masters">Masters</option>
      <option value="PhD">PhD</option>
      <option value="Exchange">Exchange</option>
    </Select>
  );
  const statusSelect = (props) => (
    <Select {...props}>
      <option value="All">All Status</option>
      <option value="Active">Active</option>
      <option value="Draft">Draft</option>
    </Select>
  );
  const setSch = (patch) => setFormData({ ...formData, scholarship: { ...formData.scholarship, ...patch } });

  return (
    <div className="tdcp k-page mx" data-screen="scholarships">
      <PageHeader
        title="scholarships"
        sub="study abroad programs and funding students see in the app."
        actions={<>
          <Button variant="secondary" icon="upload" onClick={() => setUploadModalVisible(true)}>{isMobile ? 'Upload' : 'Bulk Upload'}</Button>
          <Button icon="plus" onClick={() => openModal()}>{isMobile ? 'Create' : 'Create Program'}</Button>
        </>}
      />

      <div className="k-stats">
        <StatCard label="Total" value={programs.length} icon="grad" tone="green" />
        <StatCard label="Active" value={activeCount} icon="award" tone="blue" />
      </div>

      <div className="k-toolbar">
        <SearchInput
          className="k-grow"
          placeholder={isMobile ? "Search..." : "Search programs, universities..."}
          aria-label="search programs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isMobile ? (
          <Button variant="secondary" icon="filter" aria-expanded={isFilterOpen} onClick={() => setIsFilterOpen(!isFilterOpen)}>Filters</Button>
        ) : (
          <>
            {degreeSelect({ 'aria-label': 'degree', style: { width: 'auto' }, value: filterDegree, onChange: (e) => setFilterDegree(e.target.value) })}
            {statusSelect({ 'aria-label': 'status', style: { width: 'auto' }, value: filterStatus, onChange: (e) => setFilterStatus(e.target.value) })}
          </>
        )}
      </div>

      {isMobile && isFilterOpen && (
        <div className="k-card pad mx-filters">
          {degreeSelect({ 'aria-label': 'degree', value: filterDegree, onChange: (e) => setFilterDegree(e.target.value) })}
          {statusSelect({ 'aria-label': 'status', value: filterStatus, onChange: (e) => setFilterStatus(e.target.value) })}
          <Button variant="secondary" onClick={() => { setFilterDegree('All'); setFilterStatus('All'); setIsFilterOpen(false); }}>Clear Filters</Button>
        </div>
      )}

      {loading ? (
        <PageLoading label="Loading scholarship programs..." />
      ) : filteredPrograms.length === 0 ? (
        <div className="k-card">
          <EmptyState
            icon="globe"
            tone="sky"
            title={programs.length === 0 ? 'No Programs Registered' : 'No matching programs found'}
            text={programs.length === 0 ? 'Start by adding your first scholarship opportunity' : 'Try adjusting your search filters'}
          />
        </div>
      ) : (
        <div className="k-table-card">
          <div className="k-table-scroll">
            <table className="k-table" style={{ minWidth: 900 }}>
              <thead>
                <tr><th>program details</th><th>location</th><th>schedule</th><th style={{ textAlign: 'center' }}>status</th><th style={{ textAlign: 'right' }}>actions</th></tr>
              </thead>
              <tbody>
                {filteredPrograms.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="k-row" style={{ flexWrap: 'nowrap' }}>
                        <Ico kind="grad" tone={item.active ? 'yellow' : 'sand'} size={40} />
                        <div style={{ minWidth: 0 }}>
                          <div className="k-row" style={{ gap: 6 }}>
                            <b>{item.title}</b>
                            {item.scholarship?.name && <Pill tone="purple"><Ico kind="award" tone="plain" size={11} />Scholarship</Pill>}
                          </div>
                          <div className="k-hint">{item.university} • <Pill tone="sand">{item.degree}</Pill></div>
                        </div>
                      </div>
                    </td>
                    <td><span className="k-row" style={{ gap: 6 }}><Ico kind="pin" tone="plain" size={13} />{item.location}</span></td>
                    <td>
                      <div className="k-row" style={{ gap: 6 }}><Ico kind="clock" tone="plain" size={13} />{item.duration}</div>
                      <div className="k-row mx-deadline" style={{ gap: 6 }}><Ico kind="calendar" tone="plain" size={12} />Deadline: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{statusBtn(item)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="k-row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <IconBtn icon="users" label="View Applications" onClick={() => navigate('/program', { state: { programId: item._id, programTitle: item.title } })} />
                        <IconBtn icon="external" label="External Link" onClick={() => window.open(item.link, '_blank')} />
                        <IconBtn icon="edit" label="Edit Program" onClick={() => openModal(item)} />
                        <button type="button" className="k-icon-btn sm danger" title="Delete" aria-label="Delete" onClick={() => deleteProgram(item._id)} disabled={deletingId === item._id}>
                          {deletingId === item._id ? <Spinner size="sm" /> : <Ico kind="trash" tone="plain" size={15} />}
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* create / edit program */}
      <Modal
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        size="lg"
        icon="globe"
        tone="yellow"
        title={editingId ? 'Update Program Details' : 'Create Scholarship Program'}
        sub={editingId ? 'Edit Program' : 'New Scholarship Program'}
        footer={<>
          <Button variant="secondary" onClick={() => setModalVisible(false)}>Cancel</Button>
          <Button type="submit" form="program-form" loading={loading} iconRight={loading ? undefined : 'chevronRight'}>
            {loading ? 'Saving...' : editingId ? 'Update Program' : 'Create Program'}
          </Button>
        </>}
      >
        <Tabs
          label="program sections"
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'details', label: 'Details', icon: 'info' },
            { id: 'requirements', label: 'Requirements', icon: 'shield' },
            { id: 'scholarship', label: 'Scholarship', icon: 'award' },
          ]}
        />
        <form id="program-form" onSubmit={handleSubmit} className="mx-form">
          {activeTab === 'details' && (
            <>
              <Field label="Program Title *" htmlFor="mx-title">
                <Input id="mx-title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g., Global Leadership Semester" required />
              </Field>
              <div className="mx-two">
                <Field label="University/Institution *" htmlFor="mx-uni">
                  <Input id="mx-uni" value={formData.university} onChange={(e) => setFormData({...formData, university: e.target.value})} placeholder="e.g., University of Cambridge" required />
                </Field>
                <Field label="Location *" htmlFor="mx-loc">
                  <Input id="mx-loc" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g., Cambridge, UK" required />
                </Field>
              </div>
              <div className="mx-two">
                <Field label="Degree Type *" htmlFor="mx-degree">
                  <Select id="mx-degree" value={formData.degree} onChange={(e) => setFormData({...formData, degree: e.target.value})}>
                    <option value="Bachelors">Bachelors</option>
                    <option value="Masters">Masters</option>
                    <option value="PhD">PhD</option>
                    <option value="Exchange">Exchange</option>
                  </Select>
                </Field>
                <Field label="Duration *" htmlFor="mx-dur">
                  <Input id="mx-dur" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} placeholder="e.g., 1 Semester" required />
                </Field>
              </div>
              <div className="mx-two">
                <Field label="Application Start Date" htmlFor="mx-start">
                  <DateInput id="mx-start" value={formData.appStart} onChange={(e) => setFormData({...formData, appStart: e.target.value})} />
                </Field>
                <Field label="Application Deadline" htmlFor="mx-deadline">
                  <DateInput id="mx-deadline" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
                </Field>
              </div>
              <Field label="Application URL" htmlFor="mx-link">
                <Input id="mx-link" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="https://example.com/apply" />
              </Field>
            </>
          )}

          {activeTab === 'requirements' && (
            <Field label="Program Requirements">
              <div className="mx-add">
                <Input value={reqInput} onChange={(e) => setReqInput(e.target.value)} placeholder="e.g., Strong academic record" aria-label="new requirement" onKeyDown={(e) => e.key === 'Enter' && addRequirement(e)} />
                <Button type="button" variant="secondary" icon="plus" onClick={addRequirement}>Add</Button>
              </div>
              {reqList(formData.requirements, removeRequirement, 'No requirements added yet')}
            </Field>
          )}

          {activeTab === 'scholarship' && (
            <>
              <Field label="Scholarship Name" htmlFor="mx-sname">
                <Input id="mx-sname" value={formData.scholarship.name} onChange={(e) => setSch({ name: e.target.value })} placeholder="e.g., Global Excellence Scholarship" />
              </Field>
              <div className="mx-two">
                <Field label="Amount" htmlFor="mx-amount">
                  <Input id="mx-amount" value={formData.scholarship.amount} onChange={(e) => setSch({ amount: e.target.value })} placeholder="e.g., 5000" />
                </Field>
                <Field label="Currency" htmlFor="mx-cur">
                  <Select id="mx-cur" value={formData.scholarship.currency} onChange={(e) => setSch({ currency: e.target.value })}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="PKR">PKR</option>
                  </Select>
                </Field>
              </div>
              <Field label="Description" htmlFor="mx-sdesc">
                <Textarea id="mx-sdesc" rows={3} value={formData.scholarship.description} onChange={(e) => setSch({ description: e.target.value })} placeholder="Describe the scholarship opportunity..." />
              </Field>
              <Field label="Scholarship Deadline" htmlFor="mx-sdead">
                <DateInput id="mx-sdead" value={formData.scholarship.deadline} onChange={(e) => setSch({ deadline: e.target.value })} />
              </Field>
              <Field label="Scholarship Requirements">
                <div className="mx-add">
                  <Input id="scholarshipReq" placeholder="e.g., Minimum GPA 3.5" aria-label="new scholarship requirement" onKeyDown={(e) => e.key === 'Enter' && addScholarshipRequirement(e)} />
                  <Button type="button" variant="secondary" icon="plus" onClick={addScholarshipRequirement}>Add</Button>
                </div>
                {reqList(formData.scholarship.requirements || [], removeScholarshipRequirement, 'No scholarship requirements added')}
              </Field>
            </>
          )}
        </form>
      </Modal>

      {/* bulk upload */}
      <Modal
        open={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        size="lg"
        icon="upload"
        tone="green"
        title="Upload Scholarships"
        sub="Bulk Upload"
        footer={previewData.length > 0 ? (uploadComplete ? <>
          <Button variant="secondary" icon="refresh" onClick={resetUploadState}>Upload Another File</Button>
          <Button variant="success" icon="check" onClick={() => { setUploadModalVisible(false); resetUploadState(); }}>Done & Close</Button>
        </> : <>
          <Button variant="secondary" onClick={resetUploadState} disabled={isUploading}>Clear</Button>
          <Button icon="upload" onClick={uploadExcelData} loading={isUploading}>{isUploading ? 'Uploading...' : 'Upload All Programs'}</Button>
        </>) : null}
      >
        <div className="k-drop mx-drop" data-kit="upload">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="mx-file" disabled={isUploading} aria-label="choose Excel or CSV file" />
          <Ico kind="file" tone="yellow" size={fileLoaded ? 36 : 48} />
          <span><b>{fileLoaded ? 'File Loaded!' : 'Upload Excel or CSV File'}</b></span>
          <span className="k-hint">
            {fileLoaded
              ? `${previewData.length} programs found. Click "Upload All Programs" to continue.`
              : 'Drag & drop or click to select .xlsx, .xls, or .csv file'}
          </span>
          {!fileLoaded && (
            <Button size="sm" variant="secondary" icon="download" onClick={downloadTemplate} disabled={isUploading} className="mx-template">Download Template</Button>
          )}
        </div>

        {previewData.length > 0 && (
          <>
            <div className="k-row" style={{ justifyContent: 'space-between' }}>
              <b>Preview ({previewData.length} programs found)</b>
              <Checkbox checked={autoCreateScholarships} onChange={(e) => setAutoCreateScholarships(e.target.checked)} disabled={isUploading} label="Auto-create scholarships" />
            </div>
            <div className="k-table-card">
              <div className="k-table-scroll">
                <table className="k-table" style={{ minWidth: 560 }}>
                  <thead><tr><th>#</th><th>program</th><th>university</th><th>degree</th><th>scholarship</th></tr></thead>
                  <tbody>
                    {previewData.slice(0, isMobile ? 3 : 5).map((prog, idx) => (
                      <tr key={idx}>
                        <td className="k-muted">{idx + 1}</td>
                        <td><b>{prog.title}</b></td>
                        <td>{prog.university}</td>
                        <td><Pill tone="sand">{prog.degree}</Pill></td>
                        <td>{prog.scholarship?.name ? <Pill tone="green">yes</Pill> : <Pill tone="sand">no</Pill>}</td>
                      </tr>
                    ))}
                    {previewData.length > (isMobile ? 3 : 5) && (
                      <tr><td colSpan={5} className="k-muted" style={{ textAlign: 'center' }}>... and {previewData.length - (isMobile ? 3 : 5)} more programs</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {uploadStatus && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Progress value={uploadProgress} label={`${uploadProgress}%`} />
                <p className="k-muted" style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14 }}>{uploadStatus}</p>
                {uploadComplete && <div className="k-note ok">Upload Complete! All valid programs have been processed.</div>}
                {skippedRows && skippedRows.length > 0 && (
                  <div className="k-note warn">
                    <b>Skipped Rows Details ({skippedRows.length}):</b>
                    <div className="mx-skipped">
                      {skippedRows.map((sr, i) => (
                        <div key={i} className="mx-skip">
                          <span><strong>Row {sr.row}</strong>: {sr.title ? `${sr.title}${sr.university ? ` (${sr.university})` : ''}` : 'Untitled Row'}</span>
                          <Pill tone="yellow">{sr.reason}</Pill>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

// small icon button for table rows
const IconBtn = ({ icon, label, onClick }) => (
  <button type="button" className="k-icon-btn sm" title={label} aria-label={label} onClick={onClick}>
    <Ico kind={icon} tone="plain" size={15} />
  </button>
);

export default ManageExchange;
