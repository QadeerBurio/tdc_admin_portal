import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Image as ImageIcon, MapPin, Plus, Trash2, 
  Edit3, X, Search, Briefcase,  
  Sparkles, Globe, DollarSign,  
  TrendingUp,  
} from 'lucide-react';

const CATEGORIES = [
  'Ziyarat', 'International Tours', 'Pakistan Tours',
  'Flights', 'Hotels', 'Visa Services', 'Study Abroad', 'Travel Insurance',
  'Transport Services', 'Adventure Tourism', 'Honeymoon Packages', 'Family Tours',
  'Group Tours', 'Corporate Travel', 'Cruise Tours', 'Events & Conferences',
  'Student Tours', 'Luxury Travel'
];

const API_BASE_URL = 'https://the-deft-crew-production.up.railway.app/api/admin/packages';

const AdminPackageScreen = () => {
  const fileInputRef = useRef(null);
  
  const [packages, setPackages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    location: '',
    category: '',
    price: '',
    description: '',
    requirements: [''],
    inclusions: [''],
  });

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch:", err);
    }
  };

  const handleDynamicChange = (index, value, field) => {
    const updated = [...form[field]];
    updated[index] = value;
    setForm({ ...form, [field]: updated });
  };

  const addField = (field) => setForm({ ...form, [field]: [...form[field], ''] });
  
  const removeField = (index, field) => {
    const updated = form[field].filter((_, i) => i !== index);
    setForm({ ...form, [field]: updated.length ? updated : [''] });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openModal = (pkg = null) => {
    if (pkg) {
      setIsEditing(true);
      setEditId(pkg._id);
      setForm({
        name: pkg.name,
        location: pkg.location || '',
        category: pkg.category,
        price: pkg.price,
        description: pkg.description || '',
        requirements: pkg.requirements?.length > 0 ? pkg.requirements : [''],
        inclusions: pkg.inclusions?.length > 0 ? pkg.inclusions : [''],
      });
      setPreviewUrl(pkg.image);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: '', location: '', category: '', price: '', description: '', requirements: [''], inclusions: [''] });
    setImageFile(null);
    setPreviewUrl(null);
    setIsEditing(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      Object.keys(form).forEach(key => {
        if (key === 'requirements' || key === 'inclusions') {
          formData.append(key, JSON.stringify(form[key].filter(item => item.trim() !== '')));
        } else {
          formData.append(key, form[key]);
        }
      });

      if (imageFile) formData.append('image', imageFile);

      const url = isEditing ? `${API_BASE_URL}/update/${editId}` : `${API_BASE_URL}/create`;
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        closeModal();
        fetchPackages();
      } else {
        const errorData = await response.json();
        alert("Error: " + errorData.message);
      }
    } catch (error) {
      alert("Network Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this package?")) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchPackages();
    } catch (err) {
      alert("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPackages = packages.length;

  return (
    <div style={styles.pageWrapper}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      <div style={styles.container}>
        {/* HEADER */}
        <div className="animate-header" style={styles.dashboardHeader}>
          <div>
            <div style={styles.headerBadge}>
              <Globe size={14} />
              <span>Travel Inventory</span>
            </div>
            <h1 style={styles.mainTitle}>Travel Packages</h1>
            <p style={styles.mainSubtitle}>Manage and update your travel inventory across all categories</p>
          </div>
          <div style={styles.headerActions}>
            <div className="stats-group" style={styles.statsRow}>
              <div className="stat-card" style={styles.statCard}>
                <div style={{...styles.statIcon, background: '#ecfdf5'}}>
                  <Briefcase size={18} color="#10b981" />
                </div>
                <div>
                  <div style={styles.statVal}>{totalPackages}</div>
                  <div style={styles.statLab}>Total Packages</div>
                </div>
              </div>
              <div className="stat-card" style={styles.statCard}>
                <div style={{...styles.statIcon, background: '#eff6ff'}}>
                  <TrendingUp size={18} color="#3b82f6" />
                </div>
                <div>
                  <div style={styles.statVal}>{CATEGORIES.length}</div>
                  <div style={styles.statLab}>Categories</div>
                </div>
              </div>
            </div>
            <button className="add-btn" style={styles.addMainBtn} onClick={() => openModal()}>
              <Plus size={18} /> Create Package
            </button>
          </div>
        </div>

        {/* TABLE CONTROLS */}
        <div className="animate-controls" style={styles.tableControls}>
          <div style={styles.searchContainer}>
            <Search size={18} style={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search by name or category..." 
              style={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button style={styles.clearSearch} onClick={() => setSearchQuery("")}>
                <X size={14} />
              </button>
            )}
          </div>
          <div style={styles.badgeCount}>
            {filteredPackages.length} of {totalPackages} packages
          </div>
        </div>

        {/* FULL WIDTH LIST / TABLE */}
        <div className="list-container" style={styles.listWrapper}>
          <div style={styles.tableHeader}>
            <div style={{...styles.column, flex: 2.5}}>Package Details</div>
            <div style={{...styles.column, flex: 1}}>Category</div>
            <div style={{...styles.column, flex: 1}}>Destination</div>
            <div style={{...styles.column, flex: 1}}>Price</div>
            <div style={{...styles.column, flex: 0.8, textAlign: 'right'}}>Actions</div>
          </div>

          {filteredPackages.length > 0 ? (
            filteredPackages.map((pkg, index) => (
              <div key={pkg._id} className="package-row" style={styles.tableRow}>
                <div style={{...styles.cell, flex: 2.5}}>
                  <img src={pkg.image} alt="" style={styles.listThumb} onError={(e) => e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'} />
                  <div>
                    <div style={styles.pkgName}>{pkg.name}</div>
                    <div style={styles.pkgId}>ID: {pkg._id.slice(-8).toUpperCase()}</div>
                  </div>
                </div>
                <div style={{...styles.cell, flex: 1}}>
                  <span style={styles.categoryTag}>{pkg.category}</span>
                </div>
                <div style={{...styles.cell, flex: 1, color: '#64748b'}}>
                  <MapPin size={14} style={{marginRight: 4}} /> {pkg.location || 'TBD'}
                </div>
                <div style={{...styles.cell, flex: 1, fontWeight: '700', color: '#ff961a'}}>
                  <DollarSign size={14} style={{display: 'inline', marginRight: 2}} />
                  {parseInt(pkg.price).toLocaleString()}
                </div>
                <div style={{...styles.cell, flex: 0.8, justifyContent: 'flex-end', gap: '8px'}}>
                  <button onClick={() => openModal(pkg)} className="action-icon" style={styles.iconBtnEdit} title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(pkg._id)} className="action-icon" style={styles.iconBtnDel} title="Delete" disabled={deletingId === pkg._id}>
                    {deletingId === pkg._id ? (
                      <div style={styles.spinnerSmall}></div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={styles.emptyState}>
              <div style={styles.emptyIcon}>✈️</div>
              <p>No travel packages found</p>
              <span>Try adjusting your search or create a new package</span>
            </div>
          )}
        </div>
      </div>

      {/* MODERN FORM MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={closeModal}>
          <div className="modal-content" style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalBadge}>
                  <Sparkles size={14} />
                  <span>{isEditing ? 'Edit Package' : 'New Package'}</span>
                </div>
                <h2 style={styles.modalTitle}>{isEditing ? "Modify Package" : "Create New Package"}</h2>
                <p style={styles.modalSubtitle}>Complete all required fields below</p>
              </div>
              <button onClick={closeModal} className="close-modal" style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formGrid}>
                <div style={styles.formCol}>
                  <div className="animate-field" style={styles.inputGroup}>
                    <label style={styles.label}>Package Title <span style={styles.required}>*</span></label>
                    <input 
                      style={styles.input} 
                      value={form.name} 
                      onChange={(e) => setForm({...form, name: e.target.value})} 
                      required 
                      placeholder="e.g., Swiss Alps Adventure" 
                    />
                  </div>

                  <div style={styles.row}>
                    <div style={{flex: 1}}>
                      <label style={styles.label}>Category <span style={styles.required}>*</span></label>
                      <select style={styles.input} value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required>
                        <option value="" disabled>Select category</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div style={{flex: 1}}>
                      <label style={styles.label}>Price (USD) <span style={styles.required}>*</span></label>
                      <input 
                        style={styles.input} 
                        type="number" 
                        value={form.price} 
                        onChange={(e) => setForm({...form, price: e.target.value})} 
                        required 
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="animate-field" style={styles.inputGroup}>
                    <label style={styles.label}>Destination</label>
                    <input 
                      style={styles.input} 
                      value={form.location} 
                      onChange={(e) => setForm({...form, location: e.target.value})} 
                      placeholder="e.g., Interlaken, Switzerland" 
                    />
                  </div>

                  <div className="animate-field" style={styles.inputGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea 
                      style={{...styles.input, height: '100px', resize: 'none'}} 
                      value={form.description} 
                      onChange={(e) => setForm({...form, description: e.target.value})} 
                      placeholder="Provide an overview of the package..."
                    />
                  </div>
                </div>

                <div style={styles.formCol}>
                  <div className="animate-field" style={styles.inputGroup}>
                    <label style={styles.label}>Featured Image <span style={styles.required}>*</span></label>
                    <div className="upload-area" style={styles.uploadBox} onClick={() => fileInputRef.current.click()}>
                      {previewUrl ? (
                        <div style={styles.previewContainer}>
                          <img src={previewUrl} alt="Preview" style={styles.previewImage} />
                          <div style={styles.previewOverlay}>
                            <ImageIcon size={20} />
                            <span>Change Image</span>
                          </div>
                        </div>
                      ) : (
                        <div style={styles.uploadPlaceholder}>
                          <ImageIcon size={32} color="#cbd5e1" />
                          <span>Click to upload image</span>
                          <small>PNG, JPG up to 5MB</small>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{display: 'none'}} />
                    </div>
                  </div>

                  <div className="animate-field" style={styles.section}>
                    <div style={styles.sectionHeader}>
                      <label style={styles.label}>Requirements Checklist</label>
                      <button type="button" onClick={() => addField('requirements')} className="add-field" style={styles.addSmallBtn}>
                        <Plus size={14} /> Add
                      </button>
                    </div>
                    <div style={styles.dynamicList}>
                      {form.requirements.map((req, idx) => (
                        <div key={idx} className="dynamic-item" style={styles.dynamicRow}>
                          <input 
                            style={{...styles.input, flex: 1}} 
                            value={req} 
                            onChange={(e) => handleDynamicChange(idx, e.target.value, 'requirements')} 
                            placeholder="Requirement item" 
                          />
                          <button type="button" onClick={() => removeField(idx, 'requirements')} style={styles.delSmallBtn}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="animate-field" style={styles.section}>
                    <div style={styles.sectionHeader}>
                      <label style={styles.label}>Inclusions</label>
                      <button type="button" onClick={() => addField('inclusions')} className="add-field" style={styles.addSmallBtn}>
                        <Plus size={14} /> Add
                      </button>
                    </div>
                    <div style={styles.dynamicList}>
                      {form.inclusions.map((inc, idx) => (
                        <div key={idx} className="dynamic-item" style={styles.dynamicRow}>
                          <input 
                            style={{...styles.input, flex: 1}} 
                            value={inc} 
                            onChange={(e) => handleDynamicChange(idx, e.target.value, 'inclusions')} 
                            placeholder="Inclusion item" 
                          />
                          <button type="button" onClick={() => removeField(idx, 'inclusions')} style={styles.delSmallBtn}>
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeModal} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} style={styles.submitBtn}>
                  {loading ? (
                    <>
                      <div style={styles.spinner}></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      {isEditing ? "Update Package" : "Publish Package"}
                      <Send size={16} style={{marginLeft: '8px'}} />
                    </>
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
        
        .animate-controls {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.2s;
        }
        
        .list-container {
          animation: fadeInScale 0.5s ease forwards;
          animation-delay: 0.25s;
        }
        
        .package-row {
          transition: all 0.3s ease;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .package-row:nth-child(1) { animation-delay: 0.05s; }
        .package-row:nth-child(2) { animation-delay: 0.1s; }
        .package-row:nth-child(3) { animation-delay: 0.15s; }
        .package-row:nth-child(4) { animation-delay: 0.2s; }
        .package-row:nth-child(5) { animation-delay: 0.25s; }
        
        .package-row:hover {
          background: #f8fafc;
          transform: translateX(4px);
        }
        
        .action-icon {
          transition: all 0.2s ease;
        }
        .action-icon:hover {
          transform: translateY(-2px);
        }
        
        .modal-overlay {
          animation: fadeInScale 0.3s ease forwards;
        }
        
        .modal-content {
          animation: slideUp 0.4s ease forwards;
        }
        
        .animate-field {
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .animate-field:nth-child(1) { animation-delay: 0.1s; }
        .animate-field:nth-child(2) { animation-delay: 0.15s; }
        .animate-field:nth-child(3) { animation-delay: 0.2s; }
        .animate-field:nth-child(4) { animation-delay: 0.25s; }
        
        .dynamic-item {
          transition: all 0.2s ease;
          animation: slideUp 0.3s ease forwards;
          opacity: 0;
        }
        .dynamic-item:nth-child(1) { animation-delay: 0.02s; }
        .dynamic-item:nth-child(2) { animation-delay: 0.04s; }
        .dynamic-item:nth-child(3) { animation-delay: 0.06s; }
        
        .upload-area {
          transition: all 0.2s ease;
        }
        .upload-area:hover {
          border-color: #ff961a;
          background: #fff7ed;
        }
        
        .add-field:hover {
          transform: translateY(-1px);
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #ff961a;
          box-shadow: 0 0 0 3px rgba(255,150,26,0.1);
        }
        
        .empty-state {
          animation: fadeInScale 0.4s ease;
        }
      `}</style>
    </div>
  );
};

const styles = {
  pageWrapper: { 
    minHeight: '100vh', 
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
    padding: '25px 35px', 
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
  dashboardHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: '32px',
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
  mainTitle: { 
    fontSize: '32px', 
    fontWeight: '800', 
    color: '#1e293b', 
    margin: 0, 
    letterSpacing: '-0.5px' 
  },
  mainSubtitle: { 
    color: '#64748b', 
    fontSize: '14px', 
    marginTop: '8px' 
  },
  addMainBtn: { 
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
    color: '#fff', 
    border: 'none', 
    padding: '12px 28px', 
    borderRadius: '16px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    transition: 'all 0.3s ease',
    fontSize: '14px'
  },
  tableControls: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  searchContainer: { 
    position: 'relative', 
    width: '350px' 
  },
  searchIcon: { 
    position: 'absolute', 
    left: '14px', 
    top: '50%', 
    transform: 'translateY(-50%)', 
    color: '#94a3b8' 
  },
  clearSearch: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8'
  },
  searchInput: { 
    width: '100%', 
    padding: '12px 40px 12px 42px', 
    borderRadius: '16px', 
    border: '2px solid #e2e8f0', 
    outline: 'none', 
    fontSize: '14px', 
    backgroundColor: '#fff',
    transition: 'all 0.2s ease'
  },
  badgeCount: { 
    background: '#fff', 
    padding: '8px 20px', 
    borderRadius: '30px', 
    fontSize: '13px', 
    fontWeight: '600', 
    color: '#475569', 
    border: '1px solid #e2e8f0' 
  },
  listWrapper: { 
    backgroundColor: '#fff', 
    borderRadius: '24px', 
    border: '1px solid #e2e8f0', 
    overflow: 'hidden', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)' 
  },
  tableHeader: { 
    display: 'flex', 
    padding: '16px 24px', 
    backgroundColor: '#f8fafc', 
    borderBottom: '2px solid #e2e8f0', 
    color: '#64748b', 
    fontSize: '11px', 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tableRow: { 
    display: 'flex', 
    padding: '18px 24px', 
    borderBottom: '1px solid #f1f5f9', 
    alignItems: 'center', 
    transition: 'all 0.2s ease' 
  },
  column: { 
    display: 'flex', 
    alignItems: 'center' 
  },
  cell: { 
    display: 'flex', 
    alignItems: 'center' 
  },
  listThumb: { 
    width: '56px', 
    height: '56px', 
    borderRadius: '14px', 
    objectFit: 'cover', 
    marginRight: '16px', 
    background: '#f1f5f9' 
  },
  pkgName: { 
    fontSize: '15px', 
    fontWeight: '700', 
    color: '#1e293b' 
  },
  pkgId: { 
    fontSize: '10px', 
    color: '#94a3b8', 
    marginTop: '4px',
    fontFamily: 'monospace'
  },
  categoryTag: { 
    backgroundColor: '#f0fdf4', 
    color: '#166534', 
    padding: '5px 12px', 
    borderRadius: '8px', 
    fontSize: '12px', 
    fontWeight: '600',
    display: 'inline-block'
  },
  iconBtnEdit: { 
    color: '#3b82f6', 
    background: '#eff6ff', 
    border: 'none', 
    padding: '8px', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconBtnDel: { 
    color: '#ef4444', 
    background: '#fef2f2', 
    border: 'none', 
    padding: '8px', 
    borderRadius: '10px', 
    cursor: 'pointer', 
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    background: 'rgba(15, 23, 42, 0.75)', 
    backdropFilter: 'blur(8px)', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    zIndex: 1000 
  },
  modalContent: { 
    background: '#fff', 
    width: '90%', 
    maxWidth: '950px', 
    borderRadius: '28px', 
    maxHeight: '90vh', 
    overflowY: 'auto', 
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' 
  },
  modalHeader: { 
    padding: '24px 32px 20px', 
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
    margin: 0, 
    fontSize: '22px', 
    fontWeight: '800', 
    color: '#1e293b' 
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 0'
  },
  closeBtn: { 
    background: '#f1f5f9', 
    border: 'none', 
    cursor: 'pointer', 
    color: '#64748b', 
    padding: '8px', 
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalForm: { 
    padding: '32px' 
  },
  formGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1.2fr 0.8fr', 
    gap: '32px' 
  },
  formCol: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px' 
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
  required: {
    color: '#ef4444',
    fontSize: '12px',
    marginLeft: '2px'
  },
  input: { 
    width: '100%', 
    padding: '12px 16px', 
    borderRadius: '14px', 
    border: '2px solid #e2e8f0', 
    fontSize: '14px', 
    transition: 'all 0.2s ease', 
    outline: 'none', 
    backgroundColor: '#f8fafc',
    fontFamily: 'inherit'
  },
  row: { 
    display: 'flex', 
    gap: '16px' 
  },
  uploadBox: { 
    border: '2px dashed #e2e8f0', 
    borderRadius: '16px', 
    height: '180px', 
    cursor: 'pointer', 
    overflow: 'hidden', 
    background: '#f8fafc', 
    transition: 'all 0.2s ease' 
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  previewImage: { 
    width: '100%', 
    height: '100%', 
    objectFit: 'cover' 
  },
  previewOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
    opacity: 0,
    transition: 'opacity 0.2s ease'
  },
  uploadPlaceholder: { 
    textAlign: 'center', 
    color: '#94a3b8', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px', 
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%'
  },
  section: { 
    background: '#f8fafc', 
    padding: '20px', 
    borderRadius: '20px', 
    border: '1px solid #f1f5f9' 
  },
  sectionHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '16px' 
  },
  addSmallBtn: { 
    background: '#1e293b', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '10px', 
    padding: '6px 12px', 
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease'
  },
  dynamicList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  dynamicRow: { 
    display: 'flex', 
    gap: '10px', 
    alignItems: 'center' 
  },
  delSmallBtn: { 
    color: '#94a3b8', 
    background: '#fff', 
    border: '1px solid #e2e8f0', 
    borderRadius: '8px', 
    padding: '8px', 
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalFooter: { 
    marginTop: '32px', 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: '14px', 
    borderTop: '2px solid #f1f5f9', 
    paddingTop: '24px' 
  },
  cancelBtn: { 
    padding: '12px 28px', 
    borderRadius: '14px', 
    border: '2px solid #e2e8f0', 
    background: '#fff', 
    cursor: 'pointer', 
    fontWeight: '600', 
    color: '#475569',
    transition: 'all 0.2s ease'
  },
  submitBtn: { 
    padding: '12px 32px', 
    borderRadius: '14px', 
    border: 'none', 
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
    color: '#fff', 
    cursor: 'pointer', 
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid #e2e8f0',
    borderTop: '2px solid #ef4444',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  emptyState: { 
    textAlign: 'center', 
    padding: '80px 20px', 
    color: '#94a3b8', 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: '12px' 
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '8px',
    opacity: 0.5
  }
};

export default AdminPackageScreen;