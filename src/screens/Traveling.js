import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Image as ImageIcon, MapPin, Plus, Trash2, 
  Edit3, X, Search, Briefcase,  
  Sparkles, Globe, DollarSign,  
  TrendingUp,  
  Grid, List, SlidersHorizontal,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const filteredPackages = packages
    .filter(pkg => {
      const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           pkg.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || pkg.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'priceLow') return a.price - b.price;
      if (sortBy === 'priceHigh') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const totalPackages = packages.length;
  const uniqueCategories = ['All', ...new Set(packages.map(p => p.category))];

  // Mobile Package Card Component
  const MobilePackageCard = ({ pkg }) => (
    <motion.div 
      style={styles.mobileCard}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: "0 12px 25px -8px rgba(0,0,0,0.12)" }}
    >
      <div style={styles.mobileCardImage}>
        <img 
          src={pkg.image} 
          alt={pkg.name} 
          style={styles.mobileCardImg} 
          onError={(e) => e.target.src = 'https://via.placeholder.com/400x200?text=No+Image'} 
        />
        <div style={styles.mobileCardCategory}>{pkg.category}</div>
        <div style={styles.mobileCardPrice}>${parseInt(pkg.price).toLocaleString()}</div>
      </div>
      <div style={styles.mobileCardBody}>
        <h3 style={styles.mobileCardTitle}>{pkg.name}</h3>
        <div style={styles.mobileCardLocation}>
          <MapPin size={12} /> {pkg.location || 'TBD'}
        </div>
        <p style={styles.mobileCardDesc}>
          {pkg.description?.substring(0, 60) || 'No description available'}...
        </p>
        <div style={styles.mobileCardActions}>
          <button style={{...styles.mobileActionBtn, background: '#eff6ff', color: '#3b82f6'}} onClick={() => openModal(pkg)}>
            <Edit3 size={14} /> Edit
          </button>
          <button style={{...styles.mobileActionBtn, background: '#fef2f2', color: '#ef4444'}} onClick={() => handleDelete(pkg._id)}>
            {deletingId === pkg._id ? (
              <div style={styles.spinnerSmall}></div>
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{
      ...styles.pageWrapper,
      padding: isMobile ? '12px 16px' : isTablet ? '16px 24px' : '25px 35px',
      borderRadius: isMobile ? '16px' : isTablet ? '24px' : '32px',
    }}>
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>
      <div style={styles.bgDecoration3}></div>

      <div style={styles.container}>
        {/* HEADER */}
        <motion.div 
          className="animate-header" 
          style={{
            ...styles.dashboardHeader,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            gap: isMobile ? '16px' : '20px',
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <div style={styles.headerBadge}>
              <Globe size={14} />
              <span>Travel Inventory</span>
            </div>
            <h1 style={{
              ...styles.mainTitle,
              fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px',
            }}>Travel Packages</h1>
            <p style={{
              ...styles.mainSubtitle,
              fontSize: isMobile ? '12px' : isTablet ? '13px' : '14px',
            }}>
              {isMobile ? 'Manage your travel inventory' : 'Manage and update your travel inventory across all categories'}
            </p>
          </div>
          <div style={{
            ...styles.headerActions,
            flexDirection: isMobile ? 'column' : 'row',
            width: isMobile ? '100%' : 'auto',
          }}>
            <div className="stats-group" style={{
              ...styles.statsRow,
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              justifyContent: isMobile ? 'center' : 'flex-start',
              width: isMobile ? '100%' : 'auto',
            }}>
              <motion.div className="stat-card" style={{
                ...styles.statCard,
                padding: isMobile ? '8px 14px' : '10px 20px',
                flex: isMobile ? 1 : 'auto',
              }} whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
                <div style={{...styles.statIcon, width: isMobile ? '32px' : '36px', height: isMobile ? '32px' : '36px'}}>
                  <Briefcase size={isMobile ? 14 : 18} color="#10b981" />
                </div>
                <div>
                  <div style={{...styles.statVal, fontSize: isMobile ? '16px' : '20px'}}>{totalPackages}</div>
                  <div style={{...styles.statLab, fontSize: isMobile ? '8px' : '10px'}}>Total</div>
                </div>
              </motion.div>
              <motion.div className="stat-card" style={{
                ...styles.statCard,
                padding: isMobile ? '8px 14px' : '10px 20px',
                flex: isMobile ? 1 : 'auto',
              }} whileHover={{ y: -3, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
                <div style={{...styles.statIcon, width: isMobile ? '32px' : '36px', height: isMobile ? '32px' : '36px'}}>
                  <TrendingUp size={isMobile ? 14 : 18} color="#3b82f6" />
                </div>
                <div>
                  <div style={{...styles.statVal, fontSize: isMobile ? '16px' : '20px'}}>{CATEGORIES.length}</div>
                  <div style={{...styles.statLab, fontSize: isMobile ? '8px' : '10px'}}>Categories</div>
                </div>
              </motion.div>
            </div>
            <motion.button 
              className="add-btn" 
              style={{
                ...styles.addMainBtn,
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
                padding: isMobile ? '10px 16px' : '12px 28px',
                fontSize: isMobile ? '13px' : '14px',
              }} 
              onClick={() => openModal()}
              whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={isMobile ? 16 : 18} /> {isMobile ? 'Create' : 'Create Package'}
            </motion.button>
          </div>
        </motion.div>

        {/* TABLE CONTROLS WITH FILTERS */}
        <motion.div 
          className="animate-controls" 
          style={{
            ...styles.tableControls,
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? '12px' : '16px',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div style={{
            ...styles.controlsLeft,
            width: isMobile ? '100%' : 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
          }}>
            <div style={{
              ...styles.searchContainer,
              width: isMobile ? '100%' : '280px',
            }}>
              <Search size={isMobile ? 16 : 18} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder={isMobile ? "Search..." : "Search by name or category..."} 
                style={{
                  ...styles.searchInput,
                  padding: isMobile ? '8px 32px 8px 36px' : '10px 40px 10px 40px',
                  fontSize: isMobile ? '13px' : '14px',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button style={styles.clearSearch} onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            
            {isMobile ? (
              <button 
                style={styles.mobileFilterToggle}
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <SlidersHorizontal size={16} /> Filters {isFilterOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {filterCategory !== 'All' && <span style={styles.filterDot} />}
              </button>
            ) : (
              <motion.button 
                style={styles.filterToggle}
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SlidersHorizontal size={16} /> Filters
                {filterCategory !== 'All' && <span style={styles.filterDot} />}
              </motion.button>
            )}
          </div>

          <div style={{
            ...styles.controlsRight,
            width: isMobile ? '100%' : 'auto',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: isMobile ? 'center' : 'flex-end',
          }}>
            <div style={styles.viewToggle}>
              <motion.button
                style={{...styles.viewBtn, ...(viewMode === 'grid' ? styles.activeView : {}), padding: isMobile ? '6px 8px' : '8px 10px'}}
                onClick={() => setViewMode('grid')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Grid size={isMobile ? 14 : 16} />
              </motion.button>
              <motion.button
                style={{...styles.viewBtn, ...(viewMode === 'list' ? styles.activeView : {}), padding: isMobile ? '6px 8px' : '8px 10px'}}
                onClick={() => setViewMode('list')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <List size={isMobile ? 14 : 16} />
              </motion.button>
            </div>
            
            <select
              style={{
                ...styles.sortSelect,
                padding: isMobile ? '6px 10px' : '8px 14px',
                fontSize: isMobile ? '12px' : '13px',
              }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priceLow">Price: Low</option>
              <option value="priceHigh">Price: High</option>
              <option value="name">Alphabetical</option>
            </select>
            
            {!isMobile && (
              <div style={styles.badgeCount}>
                {filteredPackages.length} of {totalPackages}
              </div>
            )}
          </div>
        </motion.div>

        {/* Mobile Filters */}
        {isMobile && isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={styles.mobileFilters}
          >
            <div style={styles.mobileFilterGroup}>
              <label style={styles.mobileFilterLabel}>Category</label>
              <select
                style={styles.mobileFilterSelect}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button
              style={styles.mobileClearFilters}
              onClick={() => { setFilterCategory('All'); setIsFilterOpen(false); }}
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Filters Dropdown - Desktop */}
        <AnimatePresence>
          {showFilters && !isMobile && (
            <motion.div 
              style={styles.filtersDropdown}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div style={styles.filtersContent}>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Category</label>
                  <select
                    style={styles.filterSelect}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.filterGroup}>
                  <label style={styles.filterLabel}>Price Range</label>
                  <div style={styles.priceRange}>
                    <input type="number" placeholder="Min" style={styles.priceInput} />
                    <span style={styles.priceSeparator}>-</span>
                    <input type="number" placeholder="Max" style={styles.priceInput} />
                  </div>
                </div>
                <motion.button 
                  style={styles.filterApplyBtn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PACKAGES DISPLAY - GRID OR LIST */}
        <motion.div 
          className="list-container" 
          style={viewMode === 'grid' ? styles.gridWrapper : styles.listWrapper}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {viewMode === 'grid' ? (
            // GRID VIEW
            <div style={{
              ...styles.gridContainer,
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: isMobile ? '12px' : isTablet ? '16px' : '20px',
            }}>
              {filteredPackages.length > 0 ? (
                filteredPackages.map((pkg, index) => (
                  <motion.div 
                    key={pkg._id} 
                    className="package-card"
                    style={{
                      ...styles.gridCard,
                      borderRadius: isMobile ? '16px' : isTablet ? '20px' : '24px',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileHover={{ y: -8, boxShadow: "0 20px 35px -12px rgba(0,0,0,0.15)" }}
                  >
                    <div style={{
                      ...styles.gridImageWrapper,
                      height: isMobile ? '160px' : isTablet ? '180px' : '200px',
                    }}>
                      <img src={pkg.image} alt={pkg.name} style={styles.gridImage} onError={(e) => e.target.src = 'https://via.placeholder.com/400x250?text=No+Image'} />
                      <div style={{...styles.gridCategory, fontSize: isMobile ? '10px' : '11px'}}>{pkg.category}</div>
                      <div style={{...styles.gridPrice, fontSize: isMobile ? '12px' : '14px'}}>${parseInt(pkg.price).toLocaleString()}</div>
                    </div>
                    <div style={{
                      ...styles.gridBody,
                      padding: isMobile ? '12px 14px' : isTablet ? '14px 16px' : '16px 20px',
                    }}>
                      <h3 style={{
                        ...styles.gridTitle,
                        fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                      }}>{pkg.name}</h3>
                      <div style={{
                        ...styles.gridLocation,
                        fontSize: isMobile ? '12px' : isTablet ? '12px' : '13px',
                      }}>
                        <MapPin size={isMobile ? 12 : 14} /> {pkg.location || 'TBD'}
                      </div>
                      <p style={{
                        ...styles.gridDescription,
                        fontSize: isMobile ? '12px' : isTablet ? '12px' : '13px',
                      }}>
                        {pkg.description?.substring(0, isMobile ? 50 : 80) || 'No description available'}...
                      </p>
                      <div style={styles.gridActions}>
                        <motion.button 
                          onClick={() => openModal(pkg)} 
                          style={{
                            ...styles.gridEditBtn,
                            padding: isMobile ? '6px 12px' : '8px 16px',
                            fontSize: isMobile ? '12px' : '13px',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit3 size={isMobile ? 12 : 14} /> Edit
                        </motion.button>
                        <motion.button 
                          onClick={() => handleDelete(pkg._id)} 
                          style={{
                            ...styles.gridDeleteBtn,
                            padding: isMobile ? '6px 10px' : '8px 14px',
                            fontSize: isMobile ? '12px' : '13px',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {deletingId === pkg._id ? (
                            <div style={styles.spinnerSmall}></div>
                          ) : (
                            <Trash2 size={isMobile ? 12 : 14} />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  className="empty-state" 
                  style={styles.emptyState}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div style={{...styles.emptyIcon, fontSize: isMobile ? '40px' : '64px'}}>✈️</div>
                  <p style={{...styles.emptyTitle, fontSize: isMobile ? '16px' : '18px'}}>No travel packages found</p>
                  <span style={{...styles.emptySubtext, fontSize: isMobile ? '13px' : '14px'}}>
                    Try adjusting your search or create a new package
                  </span>
                  <motion.button 
                    style={{
                      ...styles.emptyBtn,
                      padding: isMobile ? '10px 20px' : '12px 24px',
                      fontSize: isMobile ? '13px' : '14px',
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openModal()}
                  >
                    <Plus size={isMobile ? 14 : 16} /> Create New Package
                  </motion.button>
                </motion.div>
              )}
            </div>
          ) : (
            // LIST VIEW
            <div style={styles.listContainer}>
              {!isMobile && (
                <div style={{
                  ...styles.tableHeader,
                  padding: isTablet ? '12px 16px' : '16px 24px',
                  fontSize: isTablet ? '10px' : '11px',
                }}>
                  <div style={{...styles.column, flex: 2.5}}>Package Details</div>
                  <div style={{...styles.column, flex: 1}}>Category</div>
                  <div style={{...styles.column, flex: 1}}>Destination</div>
                  <div style={{...styles.column, flex: 1}}>Price</div>
                  <div style={{...styles.column, flex: 0.8, textAlign: 'right'}}>Actions</div>
                </div>
              )}

              {filteredPackages.length > 0 ? (
                isMobile ? (
                  <div style={styles.mobileCardList}>
                    {filteredPackages.map((pkg) => (
                      <MobilePackageCard key={pkg._id} pkg={pkg} />
                    ))}
                  </div>
                ) : (
                  filteredPackages.map((pkg, index) => (
                    <motion.div 
                      key={pkg._id} 
                      className="package-row" 
                      style={{
                        ...styles.tableRow,
                        padding: isTablet ? '14px 16px' : '18px 24px',
                      }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      whileHover={{ backgroundColor: '#f8fafc', x: 4 }}
                    >
                      <div style={{...styles.cell, flex: 2.5}}>
                        <img src={pkg.image} alt="" style={{
                          ...styles.listThumb,
                          width: isTablet ? '48px' : '56px',
                          height: isTablet ? '48px' : '56px',
                          marginRight: isTablet ? '12px' : '16px',
                        }} onError={(e) => e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'} />
                        <div>
                          <div style={{
                            ...styles.pkgName,
                            fontSize: isTablet ? '13px' : '15px',
                          }}>{pkg.name}</div>
                          <div style={{
                            ...styles.pkgId,
                            fontSize: isTablet ? '9px' : '10px',
                          }}>ID: {pkg._id.slice(-8).toUpperCase()}</div>
                        </div>
                      </div>
                      <div style={{...styles.cell, flex: 1}}>
                        <span style={{
                          ...styles.categoryTag,
                          fontSize: isTablet ? '10px' : '12px',
                          padding: isTablet ? '4px 10px' : '5px 12px',
                        }}>{pkg.category}</span>
                      </div>
                      <div style={{...styles.cell, flex: 1, color: '#64748b', fontSize: isTablet ? '12px' : '13px'}}>
                        <MapPin size={isTablet ? 12 : 14} style={{marginRight: 4}} /> {pkg.location || 'TBD'}
                      </div>
                      <div style={{...styles.cell, flex: 1, fontWeight: '700', color: '#ff961a', fontSize: isTablet ? '13px' : '14px'}}>
                        <DollarSign size={isTablet ? 12 : 14} style={{display: 'inline', marginRight: 2}} />
                        {parseInt(pkg.price).toLocaleString()}
                      </div>
                      <div style={{...styles.cell, flex: 0.8, justifyContent: 'flex-end', gap: isTablet ? '4px' : '8px'}}>
                        <motion.button 
                          onClick={() => openModal(pkg)} 
                          className="action-icon" 
                          style={{
                            ...styles.iconBtnEdit,
                            padding: isTablet ? '6px' : '8px',
                          }} 
                          title="Edit"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit3 size={isTablet ? 14 : 16} />
                        </motion.button>
                        <motion.button 
                          onClick={() => handleDelete(pkg._id)} 
                          className="action-icon" 
                          style={{
                            ...styles.iconBtnDel,
                            padding: isTablet ? '6px' : '8px',
                          }} 
                          title="Delete" 
                          disabled={deletingId === pkg._id}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {deletingId === pkg._id ? (
                            <div style={styles.spinnerSmall}></div>
                          ) : (
                            <Trash2 size={isTablet ? 14 : 16} />
                          )}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )
              ) : (
                <motion.div 
                  className="empty-state" 
                  style={styles.emptyState}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div style={{...styles.emptyIcon, fontSize: isMobile ? '40px' : '64px'}}>✈️</div>
                  <p style={{...styles.emptyTitle, fontSize: isMobile ? '16px' : '18px'}}>No travel packages found</p>
                  <span style={{...styles.emptySubtext, fontSize: isMobile ? '13px' : '14px'}}>
                    Try adjusting your search or create a new package
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* MODERN FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            className="modal-overlay" 
            style={styles.modalOverlay} 
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content" 
              style={{
                ...styles.modalContent,
                maxWidth: isMobile ? '95%' : '950px',
                borderRadius: isMobile ? '20px' : '28px',
              }} 
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div style={{
                ...styles.modalHeader,
                padding: isMobile ? '16px 20px 12px' : '24px 32px 20px',
              }}>
                <div>
                  <div style={styles.modalBadge}>
                    <Sparkles size={14} />
                    <span>{isEditing ? 'Edit Package' : 'New Package'}</span>
                  </div>
                  <h2 style={{
                    ...styles.modalTitle,
                    fontSize: isMobile ? '18px' : '22px',
                  }}>{isEditing ? "Modify Package" : "Create New Package"}</h2>
                  <p style={{
                    ...styles.modalSubtitle,
                    fontSize: isMobile ? '12px' : '13px',
                  }}>Complete all required fields below</p>
                </div>
                <motion.button 
                  onClick={closeModal} 
                  className="close-modal" 
                  style={styles.closeBtn}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </div>
              
              <form onSubmit={handleSubmit} style={{
                ...styles.modalForm,
                padding: isMobile ? '16px' : '32px',
              }}>
                <div style={{
                  ...styles.formGrid,
                  gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr',
                  gap: isMobile ? '16px' : '32px',
                }}>
                  <div style={styles.formCol}>
                    <div className="animate-field" style={styles.inputGroup}>
                      <label style={styles.label}>Package Title <span style={styles.required}>*</span></label>
                      <motion.input 
                        style={styles.input} 
                        value={form.name} 
                        onChange={(e) => setForm({...form, name: e.target.value})} 
                        required 
                        placeholder="e.g., Swiss Alps Adventure"
                        whileFocus={{ borderColor: "#ff961a", boxShadow: "0 0 0 3px rgba(255,150,26,0.1)" }}
                      />
                    </div>

                    <div style={{
                      ...styles.row,
                      flexDirection: isMobile ? 'column' : 'row',
                      gap: isMobile ? '12px' : '16px',
                    }}>
                      <div style={{flex: 1, width: isMobile ? '100%' : 'auto'}}>
                        <label style={styles.label}>Category <span style={styles.required}>*</span></label>
                        <motion.select 
                          style={styles.input} 
                          value={form.category} 
                          onChange={(e) => setForm({...form, category: e.target.value})} 
                          required
                          whileFocus={{ borderColor: "#ff961a", boxShadow: "0 0 0 3px rgba(255,150,26,0.1)" }}
                        >
                          <option value="" disabled>Select category</option>
                          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </motion.select>
                      </div>
                      <div style={{flex: 1, width: isMobile ? '100%' : 'auto'}}>
                        <label style={styles.label}>Price (USD) <span style={styles.required}>*</span></label>
                        <motion.input 
                          style={styles.input} 
                          type="number" 
                          value={form.price} 
                          onChange={(e) => setForm({...form, price: e.target.value})} 
                          required 
                          placeholder="0.00"
                          whileFocus={{ borderColor: "#ff961a", boxShadow: "0 0 0 3px rgba(255,150,26,0.1)" }}
                        />
                      </div>
                    </div>

                    <div className="animate-field" style={styles.inputGroup}>
                      <label style={styles.label}>Destination</label>
                      <motion.input 
                        style={styles.input} 
                        value={form.location} 
                        onChange={(e) => setForm({...form, location: e.target.value})} 
                        placeholder="e.g., Interlaken, Switzerland"
                        whileFocus={{ borderColor: "#ff961a", boxShadow: "0 0 0 3px rgba(255,150,26,0.1)" }}
                      />
                    </div>

                    <div className="animate-field" style={styles.inputGroup}>
                      <label style={styles.label}>Description</label>
                      <motion.textarea 
                        style={{
                          ...styles.input,
                          height: isMobile ? '80px' : '100px',
                          resize: 'none',
                        }} 
                        value={form.description} 
                        onChange={(e) => setForm({...form, description: e.target.value})} 
                        placeholder="Provide an overview of the package..."
                        whileFocus={{ borderColor: "#ff961a", boxShadow: "0 0 0 3px rgba(255,150,26,0.1)" }}
                      />
                    </div>
                  </div>

                  <div style={styles.formCol}>
                    <div className="animate-field" style={styles.inputGroup}>
                      <label style={styles.label}>Featured Image <span style={styles.required}>*</span></label>
                      <motion.div 
                        className="upload-area" 
                        style={{
                          ...styles.uploadBox,
                          height: isMobile ? '140px' : '180px',
                        }} 
                        onClick={() => fileInputRef.current.click()}
                        whileHover={{ borderColor: "#ff961a", background: "#fff7ed" }}
                      >
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
                            <ImageIcon size={isMobile ? 24 : 32} color="#cbd5e1" />
                            <span style={{
                              ...styles.uploadText,
                              fontSize: isMobile ? '12px' : '14px',
                            }}>Click to upload image</span>
                            <small style={styles.uploadHint}>PNG, JPG up to 5MB</small>
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{display: 'none'}} />
                      </motion.div>
                    </div>

                    <div className="animate-field" style={styles.section}>
                      <div style={styles.sectionHeader}>
                        <label style={styles.label}>Requirements Checklist</label>
                        <motion.button 
                          type="button" 
                          onClick={() => addField('requirements')} 
                          className="add-field" 
                          style={{
                            ...styles.addSmallBtn,
                            padding: isMobile ? '4px 10px' : '6px 12px',
                            fontSize: isMobile ? '11px' : '12px',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Plus size={isMobile ? 12 : 14} /> Add
                        </motion.button>
                      </div>
                      <div style={styles.dynamicList}>
                        {form.requirements.map((req, idx) => (
                          <motion.div 
                            key={idx} 
                            className="dynamic-item" 
                            style={styles.dynamicRow}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                          >
                            <input 
                              style={{...styles.input, flex: 1, fontSize: isMobile ? '13px' : '14px'}} 
                              value={req} 
                              onChange={(e) => handleDynamicChange(idx, e.target.value, 'requirements')} 
                              placeholder="Requirement item" 
                            />
                            <motion.button 
                              type="button" 
                              onClick={() => removeField(idx, 'requirements')} 
                              style={styles.delSmallBtn}
                              whileHover={{ scale: 1.1, color: "#ef4444" }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X size={14} />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="animate-field" style={styles.section}>
                      <div style={styles.sectionHeader}>
                        <label style={styles.label}>Inclusions</label>
                        <motion.button 
                          type="button" 
                          onClick={() => addField('inclusions')} 
                          className="add-field" 
                          style={{
                            ...styles.addSmallBtn,
                            padding: isMobile ? '4px 10px' : '6px 12px',
                            fontSize: isMobile ? '11px' : '12px',
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Plus size={isMobile ? 12 : 14} /> Add
                        </motion.button>
                      </div>
                      <div style={styles.dynamicList}>
                        {form.inclusions.map((inc, idx) => (
                          <motion.div 
                            key={idx} 
                            className="dynamic-item" 
                            style={styles.dynamicRow}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                          >
                            <input 
                              style={{...styles.input, flex: 1, fontSize: isMobile ? '13px' : '14px'}} 
                              value={inc} 
                              onChange={(e) => handleDynamicChange(idx, e.target.value, 'inclusions')} 
                              placeholder="Inclusion item" 
                            />
                            <motion.button 
                              type="button" 
                              onClick={() => removeField(idx, 'inclusions')} 
                              style={styles.delSmallBtn}
                              whileHover={{ scale: 1.1, color: "#ef4444" }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X size={14} />
                            </motion.button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  ...styles.modalFooter,
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '8px' : '14px',
                  paddingTop: isMobile ? '16px' : '24px',
                }}>
                  <motion.button 
                    type="button" 
                    onClick={closeModal} 
                    style={{
                      ...styles.cancelBtn,
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: 'center',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    type="submit" 
                    disabled={loading} 
                    style={{
                      ...styles.submitBtn,
                      width: isMobile ? '100%' : 'auto',
                      justifyContent: 'center',
                      padding: isMobile ? '10px 16px' : '12px 32px',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
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
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          .stat-card {
            transition: all 0.3s ease;
          }
          
          .add-btn {
            transition: all 0.3s ease;
          }
          
          .package-card {
            transition: all 0.3s ease;
          }
          
          .package-row {
            transition: all 0.3s ease;
          }
          
          .action-icon {
            transition: all 0.2s ease;
          }
          
          .upload-area {
            transition: all 0.2s ease;
          }
          
          .upload-area:hover .preview-overlay {
            opacity: 1;
          }
          
          .add-field {
            transition: all 0.2s ease;
          }
          
          .dynamic-item {
            transition: all 0.2s ease;
          }
          
          input:focus, select:focus, textarea:focus {
            outline: none;
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
            .stat-card {
              min-width: unset !important;
            }
            .formGrid {
              grid-template-columns: 1fr !important;
            }
            .row {
              flex-direction: column !important;
            }
            .searchContainer {
              width: 100% !important;
            }
            .tableHeader {
              display: none !important;
            }
            .tableRow {
              flex-wrap: wrap !important;
              gap: 8px !important;
            }
            .modalContent {
              width: 95% !important;
            }
            .controlsLeft, .controlsRight {
              width: 100% !important;
              flex-wrap: wrap !important;
            }
            .viewToggle {
              order: -1 !important;
            }
          }

          @media (max-width: 480px) {
            .pageWrapper {
              padding: 8px 12px !important;
              border-radius: 12px !important;
            }
            .mainTitle {
              font-size: 20px !important;
            }
            .mainSubtitle {
              font-size: 11px !important;
            }
            .statVal {
              font-size: 14px !important;
            }
            .statLab {
              font-size: 7px !important;
            }
            .statCard {
              padding: 6px 10px !important;
            }
            .modalContent {
              padding: 12px !important;
            }
            .modalTitle {
              font-size: 16px !important;
            }
            .modalSubtitle {
              font-size: 11px !important;
            }
            .input {
              font-size: 12px !important;
              padding: 8px 12px !important;
            }
            .gridCard {
              border-radius: 12px !important;
            }
            .gridImageWrapper {
              height: 140px !important;
            }
            .gridBody {
              padding: 10px 12px !important;
            }
            .gridTitle {
              font-size: 13px !important;
            }
            .gridDescription {
              font-size: 11px !important;
            }
            .mobileCard {
              padding: 10px !important;
            }
            .mobileCardImage {
              height: 120px !important;
            }
            .mobileCardTitle {
              font-size: 13px !important;
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
  controlsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  controlsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap'
  },
  searchContainer: { 
    position: 'relative', 
    width: '280px' 
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
    padding: '10px 40px 10px 40px', 
    borderRadius: '14px', 
    border: '2px solid #e2e8f0', 
    outline: 'none', 
    fontSize: '14px', 
    backgroundColor: '#fff',
    transition: 'all 0.2s ease'
  },
  badgeCount: { 
    background: '#f1f5f9', 
    padding: '6px 16px', 
    borderRadius: '20px', 
    fontSize: '12px', 
    fontWeight: '600', 
    color: '#475569',
    whiteSpace: 'nowrap'
  },
  filterToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '14px',
    border: '2px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#475569',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  filterDot: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#ff961a'
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    background: '#f1f5f9',
    padding: '4px',
    borderRadius: '12px'
  },
  viewBtn: {
    padding: '8px 10px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    background: 'transparent',
    color: '#94a3b8',
    transition: 'all 0.2s ease'
  },
  activeView: {
    background: '#fff',
    color: '#ff961a',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  sortSelect: {
    padding: '8px 14px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    background: '#fff',
    fontSize: '13px',
    color: '#475569',
    cursor: 'pointer',
    outline: 'none'
  },
  filtersDropdown: {
    background: '#fff',
    borderRadius: '16px',
    padding: '0',
    marginBottom: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
    overflow: 'hidden'
  },
  filtersContent: {
    padding: '20px 24px',
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'flex-end'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: '150px'
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  filterSelect: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    background: '#f8fafc',
    outline: 'none'
  },
  priceRange: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  priceInput: {
    width: '80px',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    background: '#f8fafc',
    outline: 'none'
  },
  priceSeparator: {
    color: '#94a3b8'
  },
  filterApplyBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px'
  },
  // Grid styles
  gridWrapper: {
    background: 'transparent'
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  gridCard: {
    background: '#fff',
    borderRadius: '24px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    transition: 'all 0.3s ease'
  },
  gridImageWrapper: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
    background: '#f1f5f9'
  },
  gridImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  gridCategory: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    background: '#fff',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#ff961a',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  gridPrice: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '700'
  },
  gridBody: {
    padding: '16px 20px'
  },
  gridTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 6px 0'
  },
  gridLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '8px'
  },
  gridDescription: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '12px',
    lineHeight: '1.4'
  },
  gridActions: {
    display: 'flex',
    gap: '8px'
  },
  gridEditBtn: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: '10px',
    border: 'none',
    background: '#eff6ff',
    color: '#3b82f6',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '13px',
    transition: 'all 0.2s ease'
  },
  gridDeleteBtn: {
    padding: '8px 14px',
    borderRadius: '10px',
    border: 'none',
    background: '#fef2f2',
    color: '#ef4444',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    transition: 'all 0.2s ease'
  },
  // List styles
  listWrapper: {
    background: '#fff',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
  },
  listContainer: {
    width: '100%'
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
  uploadText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569'
  },
  uploadHint: {
    fontSize: '11px',
    color: '#94a3b8'
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
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#94a3b8'
  },
  emptyBtn: {
    marginTop: '16px',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  // Mobile specific styles
  mobileFilterToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1e293b',
    cursor: 'pointer',
    flex: 1,
    justifyContent: 'center'
  },
  mobileFilters: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '16px'
  },
  mobileFilterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  mobileFilterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569'
  },
  mobileFilterSelect: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    fontSize: '13px',
    background: '#fff',
    color: '#1e293b',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'inherit'
  },
  mobileClearFilters: {
    padding: '8px',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer'
  },
  mobileCardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px'
  },
  mobileCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  },
  mobileCardImage: {
    position: 'relative',
    height: '160px',
    overflow: 'hidden',
    background: '#f1f5f9'
  },
  mobileCardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  mobileCardCategory: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: '#fff',
    padding: '3px 10px',
    borderRadius: '16px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#ff961a',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  mobileCardPrice: {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '700'
  },
  mobileCardBody: {
    padding: '12px 14px'
  },
  mobileCardTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 4px 0'
  },
  mobileCardLocation: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '6px'
  },
  mobileCardDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '10px',
    lineHeight: '1.4'
  },
  mobileCardActions: {
    display: 'flex',
    gap: '6px'
  },
  mobileActionBtn: {
    flex: 1,
    padding: '6px 10px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  }
};

export default AdminPackageScreen;