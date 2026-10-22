// src/screens/Traveling.js
// Travel packages (design/portal/AdTraveling): what students see in the app's travel section.
// Also used by the traveler portal.
import React, { useState, useRef, useEffect } from 'react';
import Ico from '../portal/Ico';
import { PageHeader, Button, Spinner, Field, Input, Textarea, Select, SearchInput, StatCard, Modal, EmptyState, Pill, toast, confirmDialog } from '../portal/kit';
import './styles/Traveling.css';

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
        toast("Error: " + errorData.message);
      }
    } catch (error) {
      toast("Network Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmDialog("⚠️ Are you sure you want to delete this package?"))) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchPackages();
    } catch (err) {
      toast("Delete failed");
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

  const price = (pkg) => `rs ${parseInt(pkg.price).toLocaleString()}`;
  const deleteBtn = (pkg) => (
    <button type="button" className="k-icon-btn sm danger" title="Delete" aria-label="Delete" onClick={() => handleDelete(pkg._id)} disabled={deletingId === pkg._id}>
      {deletingId === pkg._id ? <Spinner size="sm" /> : <Ico kind="trash" tone="plain" size={15} />}
    </button>
  );
  const emptyBox = (withAction) => (
    <div className="k-card" style={{ gridColumn: '1 / -1' }}>
      <EmptyState
        icon="plane"
        tone="sky"
        title="No travel packages found"
        text="Try adjusting your search or create a new package"
        action={withAction ? <Button icon="plus" onClick={() => openModal()}>Create New Package</Button> : null}
      />
    </div>
  );
  const listField = (field, placeholder) => (
    <div className="tv-list">
      {form[field].map((val, idx) => (
        <div key={idx} className="k-row" style={{ flexWrap: 'nowrap', gap: 8 }}>
          <Input value={val} onChange={(e) => handleDynamicChange(idx, e.target.value, field)} placeholder={placeholder} aria-label={placeholder} />
          <button type="button" className="k-icon-btn ghost sm" aria-label="remove" title="remove" onClick={() => removeField(idx, field)}>
            <Ico kind="close" tone="plain" size={14} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="tdcp k-page tv" data-screen="traveling">
      <PageHeader
        title="traveling"
        sub="travel packages students see in the app."
        actions={<Button icon="plus" onClick={() => openModal()}>{isMobile ? 'Create' : 'Create Package'}</Button>}
      />

      <div className="k-stats">
        <StatCard label="Total" value={totalPackages} icon="briefcase" tone="green" />
        <StatCard label="Categories" value={CATEGORIES.length} icon="chart" tone="blue" />
      </div>

      <div className="k-toolbar">
        <SearchInput
          className="k-grow"
          placeholder={isMobile ? "Search..." : "Search by name or category..."}
          aria-label="search packages"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          variant="secondary"
          icon="filter"
          aria-expanded={isMobile ? isFilterOpen : showFilters}
          onClick={() => (isMobile ? setIsFilterOpen(!isFilterOpen) : setShowFilters(!showFilters))}
        >
          Filters{filterCategory !== 'All' && <span className="tv-dot" aria-label="filter on" />}
        </Button>
        <div className="k-seg" role="group" aria-label="view">
          <button type="button" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')} aria-label="grid view" title="grid view"><Ico kind="image" tone="plain" size={16} /></button>
          <button type="button" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} aria-label="list view" title="list view"><Ico kind="menu" tone="plain" size={16} /></button>
        </div>
        <Select aria-label="sort" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priceLow">Price: Low</option>
          <option value="priceHigh">Price: High</option>
          <option value="name">Alphabetical</option>
        </Select>
        {!isMobile && <Pill tone="sand">{filteredPackages.length} of {totalPackages}</Pill>}
      </div>

      {isMobile && isFilterOpen && (
        <div className="k-card pad tv-filters">
          <Field label="Category">
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          </Field>
          <Button variant="secondary" onClick={() => { setFilterCategory('All'); setIsFilterOpen(false); }}>Clear Filters</Button>
        </div>
      )}

      {showFilters && !isMobile && (
        <div className="k-card pad tv-filters">
          <Field label="Category">
            <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </Select>
          </Field>
          <Field label="Price Range">
            <div className="k-row" style={{ flexWrap: 'nowrap', gap: 8 }}>
              <Input type="number" placeholder="Min" aria-label="minimum price" />
              <span className="k-muted">-</span>
              <Input type="number" placeholder="Max" aria-label="maximum price" />
            </div>
          </Field>
          <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="k-grid">
          {filteredPackages.length > 0 ? (
            filteredPackages.map((pkg) => (
              <article key={pkg._id} className="k-card tv-card">
                <div className="tv-img">
                  <img src={pkg.image} alt={pkg.name} onError={(e) => e.target.src = 'https://via.placeholder.com/400x250?text=No+Image'} />
                  <span className="tv-cat"><Pill tone="white">{pkg.category}</Pill></span>
                  <span className="tv-price"><Pill tone="ink">{price(pkg)}</Pill></span>
                </div>
                <div className="tv-body">
                  <h3 className="tv-title">{pkg.name}</h3>
                  <span className="k-row k-hint" style={{ gap: 6 }}><Ico kind="pin" tone="plain" size={13} />{pkg.location || 'TBD'}</span>
                  <p className="tv-desc">{pkg.description?.substring(0, isMobile ? 50 : 80) || 'No description available'}...</p>
                </div>
                <div className="tv-foot">
                  <Button size="sm" variant="secondary" icon="edit" onClick={() => openModal(pkg)}>Edit</Button>
                  {deleteBtn(pkg)}
                </div>
              </article>
            ))
          ) : (
            emptyBox(true)
          )}
        </div>
      ) : filteredPackages.length > 0 ? (
        <div className="k-table-card">
          <div className="k-table-scroll">
            <table className="k-table" style={{ minWidth: 760 }}>
              <thead>
                <tr><th>package details</th><th>category</th><th>destination</th><th>price</th><th style={{ textAlign: 'right' }}>actions</th></tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => (
                  <tr key={pkg._id}>
                    <td>
                      <div className="k-row" style={{ flexWrap: 'nowrap' }}>
                        <img src={pkg.image} alt="" className="tv-thumb" onError={(e) => e.target.src = 'https://via.placeholder.com/60x60?text=No+Image'} />
                        <div>
                          <b>{pkg.name}</b>
                          <div className="k-hint">ID: {pkg._id.slice(-8).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td><Pill tone="sand">{pkg.category}</Pill></td>
                    <td><span className="k-row k-muted" style={{ gap: 6 }}><Ico kind="pin" tone="plain" size={13} />{pkg.location || 'TBD'}</span></td>
                    <td><b>{price(pkg)}</b></td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="k-row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                        <button type="button" className="k-icon-btn sm" title="Edit" aria-label="Edit" onClick={() => openModal(pkg)}><Ico kind="edit" tone="plain" size={15} /></button>
                        {deleteBtn(pkg)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        emptyBox(false)
      )}

      {/* create / edit package */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        size="xl"
        icon={isEditing ? 'edit' : 'plus'}
        tone="yellow"
        title={isEditing ? "Modify Package" : "Create New Package"}
        sub={`${isEditing ? 'Edit Package' : 'New Package'} · Complete all required fields below`}
        footer={<>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button type="submit" form="package-form" loading={loading} iconRight={loading ? undefined : 'send'}>
            {loading ? 'Saving...' : isEditing ? "Update Package" : "Publish Package"}
          </Button>
        </>}
      >
        <form id="package-form" onSubmit={handleSubmit} className="tv-form">
          <div className="tv-col">
            <Field label={<>Package Title <span className="k-error">*</span></>} htmlFor="tv-name">
              <Input id="tv-name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="e.g., Swiss Alps Adventure" />
            </Field>
            <div className="tv-two">
              <Field label={<>Category <span className="k-error">*</span></>} htmlFor="tv-cat">
                <Select id="tv-cat" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} required>
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
              </Field>
              <Field label={<>price (rs) <span className="k-error">*</span></>} htmlFor="tv-price">
                <Input id="tv-price" type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required placeholder="0.00" />
              </Field>
            </div>
            <Field label="Destination" htmlFor="tv-loc">
              <Input id="tv-loc" value={form.location} onChange={(e) => setForm({...form, location: e.target.value})} placeholder="e.g., Interlaken, Switzerland" />
            </Field>
            <Field label="Description" htmlFor="tv-desc">
              <Textarea id="tv-desc" rows={4} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Provide an overview of the package..." />
            </Field>
          </div>

          <div className="tv-col">
            <Field label={<>Featured Image <span className="k-error">*</span></>}>
              <div
                className="k-drop tv-upload"
                role="button"
                tabIndex={0}
                data-kit="upload"
                onClick={() => fileInputRef.current.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current.click(); } }}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="tv-preview" />
                    <span className="tv-change"><Ico kind="image" tone="plain" size={16} />Change Image</span>
                  </>
                ) : (
                  <>
                    <Ico kind="image" tone="sand" size={40} />
                    <span><b>Click to upload image</b></span>
                    <span className="k-hint">PNG, JPG up to 5MB</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" style={{display: 'none'}} />
              </div>
            </Field>

            <div>
              <div className="k-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="k-label">Requirements Checklist</span>
                <Button type="button" size="sm" variant="ghost" icon="plus" onClick={() => addField('requirements')}>Add</Button>
              </div>
              {listField('requirements', 'Requirement item')}
            </div>

            <div>
              <div className="k-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="k-label">Inclusions</span>
                <Button type="button" size="sm" variant="ghost" icon="plus" onClick={() => addField('inclusions')}>Add</Button>
              </div>
              {listField('inclusions', 'Inclusion item')}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPackageScreen;
