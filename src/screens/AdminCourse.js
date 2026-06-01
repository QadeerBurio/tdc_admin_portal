import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, Trash2, Edit3, X, Loader2, ExternalLink, 
  GraduationCap, Calendar, Clock, Users, Star, 
  BookOpen, CheckCircle2, AlertCircle, Briefcase, 
  Info, MapPin, Eye, EyeOff, Search, Filter,
  Send, Mail, User, Award, Activity, TrendingUp,
  ChevronRight, BarChart3, Sparkles, Globe, Trophy
} from 'lucide-react';

const AdminCoursePortal = () => {
  const { token } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  
  // UI State
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  
  // Enrollments State
  const [showEnrollmentsModal, setShowEnrollmentsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  // Form State
  const initialFormState = {
    id: '', 
    title: '', 
    category: 'ds', 
    provider: 'TechDegree Club',
    instructorName: '', 
    instructorRole: '', 
    instructorBio: '',
    level: 'Beginner', 
    duration: '', 
    color: '#2563EB',
    skills: '', 
    description: '', 
    courseUrl: '',
    courseImage: null
  };
  const [formData, setFormData] = useState(initialFormState);

  // Category Labels
  const categoryLabels = {
    ds: 'Data Science',
    ai: 'Artificial Intelligence',
    fs: 'Full Stack',
    cs: 'Cyber Security'
  };

  // Fetch Courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/admin/courses', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch');
      }
      
      const data = await response.json();
      const coursesArray = Array.isArray(data) ? data : (data.courses || []);
      setCourses(coursesArray);
    } catch (error) {
      console.error("Fetch error:", error);
      alert('Failed to load courses: ' + error.message);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  // Fetch Enrollments for a course
  const fetchEnrollments = async (courseId) => {
    setLoadingEnrollments(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/courses/${courseId}/enrollments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      const data = await response.json();
      setEnrollments(data.enrollments || []);
    } catch (error) {
      console.error("Fetch enrollments error:", error);
      alert('Failed to load enrollments: ' + error.message);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCourses();
    }
  }, [token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }
      setFormData(prev => ({ ...prev, courseImage: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openModal = (course = null) => {
    if (course) {
      setEditingId(course.id);
      setFormData({
        id: course.id,
        title: course.title,
        category: course.category,
        provider: course.provider || 'TechDegree Club',
        instructorName: course.instructor?.name || '',
        instructorRole: course.instructor?.role || '',
        instructorBio: course.instructor?.bio || '',
        level: course.level,
        duration: course.duration,
        color: course.color || '#2563EB',
        skills: Array.isArray(course.skills) ? course.skills.join(', ') : '',
        description: course.description,
        courseUrl: course.courseUrl || '',
        courseImage: null
      });
      setImagePreview(course.image);
    } else {
      setEditingId(null);
      setFormData(initialFormState);
      setImagePreview(null);
    }
    setActiveTab('details');
    setModalVisible(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id || !formData.title || !formData.description || !formData.duration) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('id', formData.id);
    data.append('title', formData.title);
    data.append('category', formData.category);
    data.append('provider', formData.provider);
    data.append('description', formData.description);
    data.append('level', formData.level);
    data.append('duration', formData.duration);
    data.append('color', formData.color);
    data.append('courseUrl', formData.courseUrl);
    data.append('instructorName', formData.instructorName);
    data.append('instructorRole', formData.instructorRole);
    data.append('instructorBio', formData.instructorBio);
    data.append('skills', formData.skills);
    
    if (formData.courseImage) {
      data.append('courseImage', formData.courseImage);
    }

    const url = editingId 
      ? `http://localhost:5000/api/admin/courses/${editingId}`
      : 'http://localhost:5000/api/admin/courses/create';
    
    const method = editingId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      const result = await response.json();

      if (response.ok) {
        alert(editingId ? "Course Updated Successfully!" : "Course Created Successfully!");
        setModalVisible(false);
        setEditingId(null);
        setFormData(initialFormState);
        setImagePreview(null);
        fetchCourses();
      } else {
        alert(result.message || "Operation failed");
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert("Server error occurred: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Are you sure you want to delete this course?")) return;
    
    setDeletingId(id);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/courses/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert('Course deleted successfully');
        fetchCourses();
      } else {
        alert(result.message || 'Delete failed');
      }
    } catch (error) { 
      console.error('Delete error:', error);
      alert("Delete failed: " + error.message); 
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (course) => {
    setTogglingId(course.id);
    try {
      setCourses(courses.map(c => c.id === course.id ? { ...c, isActive: !c.isActive } : c));
      const response = await fetch(`http://localhost:5000/api/admin/courses/${course.id}/toggle`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Toggle error:', error);
      fetchCourses();
    } finally {
      setTogglingId(null);
    }
  };

  const handleViewEnrollments = async (course) => {
    setSelectedCourse(course);
    await fetchEnrollments(course.id);
    setShowEnrollmentsModal(true);
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setResponseMessage('');
    setShowUserDetailsModal(true);
  };

  const handleSendResponse = async () => {
    if (!responseMessage.trim()) {
      alert('Please enter a response message');
      return;
    }

    setSendingResponse(true);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/courses/${selectedCourse?.id}/respond/${selectedUser?.userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: responseMessage,
          courseTitle: selectedCourse?.title
        })
      });

      if (response.ok) {
        alert('Response sent successfully to student!');
        setResponseMessage('');
        setShowUserDetailsModal(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send response');
      }
    } catch (error) {
      console.error('Send response error:', error);
      alert('Error sending response');
    } finally {
      setSendingResponse(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.isActive !== false).length;
  const totalEnrollments = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const avgRating = (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / (totalCourses || 1)).toFixed(1);

  return (
    <div style={styles.pageWrapper}>
      {/* Decorative Background */}
      <div style={styles.bgDecoration1}></div>
      <div style={styles.bgDecoration2}></div>

      <div style={styles.container}>
        <div className="animate-header" style={styles.header}>
          <div>
            <div style={styles.headerBadge}>
              <GraduationCap size={14} />
              <span>Learning Platform</span>
            </div>
            <h1 style={styles.headerTitle}>Course Management</h1>
            <p style={styles.headerSub}>Manage your learning catalog and track student progress</p>
          </div>
          <button className="add-btn" style={styles.addButton} onClick={() => openModal()}>
            <Plus size={18} /> <span>Create Course</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-group" style={styles.statsContainer}>
          <div className="stat-card" style={styles.statCard}>
            <div style={styles.statIconBox}>
              <BookOpen size={20} color="#2563EB" />
            </div>
            <div>
              <p style={styles.statValue}>{totalCourses}</p>
              <p style={styles.statLabel}>Total Courses</p>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIconBox, backgroundColor: '#DCFCE7'}}>
              <CheckCircle2 size={20} color="#10B981" />
            </div>
            <div>
              <p style={styles.statValue}>{activeCourses}</p>
              <p style={styles.statLabel}>Active</p>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIconBox, backgroundColor: '#FEF3C7'}}>
              <Users size={20} color="#F59E0B" />
            </div>
            <div>
              <p style={styles.statValue}>{totalEnrollments}</p>
              <p style={styles.statLabel}>Enrollments</p>
            </div>
          </div>
          <div className="stat-card" style={styles.statCard}>
            <div style={{...styles.statIconBox, backgroundColor: '#FCE7F3'}}>
              <Star size={20} color="#EC4899" />
            </div>
            <div>
              <p style={styles.statValue}>{avgRating}</p>
              <p style={styles.statLabel}>Avg Rating</p>
            </div>
          </div>
        </div>

        <main style={styles.main}>
          {/* Search and Filter Bar */}
          <div className="animate-controls" style={styles.filterBar}>
            <div style={styles.searchWrapper}>
              <Search size={16} color="#94A3B8" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by title or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={styles.clearSearch}>
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              <option value="ds">Data Science</option>
              <option value="ai">Artificial Intelligence</option>
              <option value="fs">Full Stack Development</option>
              <option value="cs">Cyber Security</option>
            </select>
          </div>

          {loading ? (
            <div className="loader-container" style={styles.loaderContainer}>
              <div className="spinner" style={styles.spinner}></div>
              <p style={{marginTop: '16px', color: '#64748B', fontWeight: 500}}>Loading courses...</p>
            </div>
          ) : (
            <div className="list-container" style={styles.listContainer}>
              <div style={styles.listHeader}>
                <div style={{flex: 2.5}}>COURSE DETAILS</div>
                <div style={{flex: 1}}>CATEGORY</div>
                <div style={{flex: 1}}>DURATION</div>
                <div style={{flex: 0.8, textAlign: 'center'}}>STATUS</div>
                <div style={{flex: 1.2, textAlign: 'right'}}>ACTIONS</div>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="empty-state" style={styles.emptyState}>
                  <div style={styles.emptyIcon}>📚</div>
                  <h3 style={{color: '#1e293b', marginBottom: '4px'}}>No Courses Found</h3>
                  <p>Start by adding your first course to the catalog</p>
                </div>
              ) : (
                filteredCourses.map((course, index) => (
                  <div key={course.id} className="course-row" style={styles.row}>
                    <div style={{flex: 2.5, display: 'flex', gap: '14px', alignItems: 'center'}}>
                      <div style={{...styles.iconBox, backgroundColor: course.isActive !== false ? '#fff7ed' : '#F9FAFB'}}>
                        <img 
                          src={course.image} 
                          style={styles.courseImage}
                          alt={course.title}
                          onError={(e) => {
                            e.target.src = `https://via.placeholder.com/44x44?text=${encodeURIComponent(course.title?.charAt(0) || 'C')}`;
                          }}
                        />
                      </div>
                      <div>
                        <div style={styles.rowTitle}>{course.title}</div>
                        <div style={styles.rowSub}>
                          {course.id} • <span style={styles.levelTag}>{course.level}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{flex: 1, ...styles.cellText}}>
                      <BookOpen size={14} color="#94A3B8" /> {categoryLabels[course.category]}
                    </div>

                    <div style={{flex: 1}}>
                      <div style={{...styles.cellText, marginBottom: '2px'}}>
                        <Clock size={14} color="#94A3B8" /> {course.duration}
                      </div>
                      <div style={{...styles.cellText, fontSize: '11px', color: '#64748B'}}>
                        <Users size={12} /> {course.enrolledCount || 0} enrolled
                      </div>
                    </div>

                    <div style={{flex: 0.8, display: 'flex', justifyContent: 'center'}}>
                      <button 
                        className="status-btn"
                        onClick={() => toggleStatus(course)}
                        disabled={togglingId === course.id}
                        style={{
                          ...styles.statusBadge, 
                          backgroundColor: course.isActive !== false ? '#DCFCE7' : '#FEE2E2', 
                          color: course.isActive !== false ? '#166534' : '#991B1B' 
                        }}
                      >
                        {togglingId === course.id ? (
                          <div style={styles.spinnerSmall}></div>
                        ) : course.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div style={{flex: 1.2, display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                      <button 
                        className="action-icon"
                        title="View Enrollments" 
                        onClick={() => handleViewEnrollments(course)} 
                        style={{...styles.actionBtn, color: '#8B5CF6', borderColor: '#EDE9FE'}}
                      >
                        <Users size={16} />
                      </button>
                      <button 
                        className="action-icon"
                        title="View Course" 
                        onClick={() => window.open(course.courseUrl, '_blank')} 
                        style={styles.actionBtn}
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button 
                        className="action-icon"
                        title="Edit Course" 
                        onClick={() => openModal(course)} 
                        style={styles.actionBtn}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        className="action-icon"
                        title="Delete" 
                        onClick={() => handleDelete(course.id)} 
                        disabled={deletingId === course.id}
                        style={{...styles.actionBtn, color: '#EF4444', borderColor: '#FEE2E2'}}
                      >
                        {deletingId === course.id ? (
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

      {/* Create/Edit Modal */}
      {modalVisible && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={() => setModalVisible(false)}>
          <div className="modal-content" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <div style={styles.modalBadge}>
                  <Sparkles size={14} />
                  <span>{editingId ? 'Edit Course' : 'New Course'}</span>
                </div>
                <h2 style={styles.modalTitle}>{editingId ? 'Edit Course' : 'Create New Course'}</h2>
              </div>
              <button onClick={() => setModalVisible(false)} style={styles.closeBtn}>
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
                className={`tab-btn ${activeTab === 'instructor' ? 'active' : ''}`}
                style={activeTab === 'instructor' ? styles.activeTab : styles.tab} 
                onClick={() => setActiveTab('instructor')}
              >
                <User size={16} /> Instructor
              </button>
            </div>

            <div style={styles.modalBody}>
              <form onSubmit={handleSubmit} style={styles.form}>
                {activeTab === 'details' ? (
                  <div style={styles.tabContent}>
                    {/* Image Upload */}
                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Course Cover Image</label>
                      <div 
                        className="upload-area"
                        onClick={() => fileInputRef.current.click()}
                        style={styles.imageUploadArea}
                      >
                        {imagePreview ? (
                          <div style={styles.previewContainer}>
                            <img src={imagePreview} style={styles.imagePreview} alt="Preview" />
                            <button 
                              type="button"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setImagePreview(null);
                                setFormData(prev => ({ ...prev, courseImage: null }));
                              }} 
                              style={styles.removeImageBtn}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={styles.uploadPlaceholder}>
                            <Plus size={24} color="#94A3B8" />
                            <p style={styles.uploadText}>Click to upload</p>
                            <p style={styles.uploadSubtext}>PNG, JPG up to 5MB</p>
                          </div>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        style={{display: 'none'}} 
                        accept="image/*" 
                      />
                    </div>

                    <div style={styles.inputRow}>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Course ID <span style={styles.required}>*</span></label>
                        <input 
                          value={formData.id} 
                          onChange={(e) => setFormData({...formData, id: e.target.value})} 
                          disabled={!!editingId} 
                          style={{...styles.input, ...(editingId ? styles.disabledInput : {})}}
                          placeholder="e.g., DS-101" 
                          required 
                        />
                      </div>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Category <span style={styles.required}>*</span></label>
                        <select 
                          value={formData.category} 
                          onChange={(e) => setFormData({...formData, category: e.target.value})} 
                          style={styles.input}
                        >
                          <option value="ds">Data Science</option>
                          <option value="ai">Artificial Intelligence</option>
                          <option value="fs">Full Stack Development</option>
                          <option value="cs">Cyber Security</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Course Title <span style={styles.required}>*</span></label>
                      <input 
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})} 
                        style={styles.input}
                        placeholder="e.g., Complete Data Science Bootcamp" 
                        required 
                      />
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Description <span style={styles.required}>*</span></label>
                      <textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        style={styles.textarea}
                        rows="3" 
                        placeholder="Course description..."
                        required 
                      />
                    </div>

                    <div style={styles.inputRow}>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Level <span style={styles.required}>*</span></label>
                        <select 
                          value={formData.level} 
                          onChange={(e) => setFormData({...formData, level: e.target.value})} 
                          style={styles.input}
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Duration <span style={styles.required}>*</span></label>
                        <input 
                          value={formData.duration} 
                          onChange={(e) => setFormData({...formData, duration: e.target.value})} 
                          style={styles.input}
                          placeholder="e.g., 40 hours" 
                          required 
                        />
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Skills (comma-separated)</label>
                      <input 
                        value={formData.skills} 
                        onChange={(e) => setFormData({...formData, skills: e.target.value})} 
                        style={styles.input}
                        placeholder="Python, SQL, Machine Learning" 
                      />
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Course URL</label>
                      <input 
                        value={formData.courseUrl} 
                        onChange={(e) => setFormData({...formData, courseUrl: e.target.value})} 
                        style={styles.input}
                        placeholder="https://..." 
                      />
                    </div>
                  </div>
                ) : (
                  <div style={styles.tabContent}>
                    <div style={styles.inputRow}>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Instructor Name</label>
                        <input 
                          value={formData.instructorName} 
                          onChange={(e) => setFormData({...formData, instructorName: e.target.value})} 
                          style={styles.input}
                          placeholder="e.g., John Doe" 
                        />
                      </div>
                      <div style={{flex: 1}}>
                        <label style={styles.label}>Instructor Role</label>
                        <input 
                          value={formData.instructorRole} 
                          onChange={(e) => setFormData({...formData, instructorRole: e.target.value})} 
                          style={styles.input}
                          placeholder="e.g., Lead Data Scientist" 
                        />
                      </div>
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Instructor Bio</label>
                      <textarea 
                        value={formData.instructorBio} 
                        onChange={(e) => setFormData({...formData, instructorBio: e.target.value})} 
                        style={styles.textarea}
                        rows="4" 
                        placeholder="Professional background and expertise..."
                      />
                    </div>

                    <div style={styles.fieldGroup}>
                      <label style={styles.label}>Provider</label>
                      <input 
                        value={formData.provider} 
                        onChange={(e) => setFormData({...formData, provider: e.target.value})} 
                        style={styles.input}
                        placeholder="TechDegree Club" 
                      />
                    </div>
                  </div>
                )}

                <div style={styles.modalFooter}>
                  <button type="button" onClick={() => setModalVisible(false)} style={styles.cancelBtn}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} style={styles.submitBtn}>
                    {loading ? (
                      <>
                        <div style={styles.spinnerSmall}></div>
                        Processing...
                      </>
                    ) : (
                      editingId ? 'Update Course' : 'Publish Course'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enrollments Modal */}
      {showEnrollmentsModal && selectedCourse && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={() => setShowEnrollmentsModal(false)}>
          <div style={{...styles.modalContent, maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Enrolled Students</h2>
                <p style={styles.modalSubtitle}>{selectedCourse.title}</p>
              </div>
              <button onClick={() => setShowEnrollmentsModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {loadingEnrollments ? (
                <div style={styles.loaderContainer}>
                  <div className="spinner" style={styles.spinner}></div>
                </div>
              ) : enrollments.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>👥</div>
                  <p>No enrollments yet</p>
                </div>
              ) : (
                <>
                  <div style={styles.enrollmentStats}>
                    <div style={styles.enrollmentStatCard}>
                      <p style={styles.enrollmentStatValue}>{enrollments.length}</p>
                      <p style={styles.enrollmentStatLabel}>Total Students</p>
                    </div>
                    <div style={styles.enrollmentStatCard}>
                      <p style={styles.enrollmentStatValue}>
                        {enrollments.filter(e => e.completed).length}
                      </p>
                      <p style={styles.enrollmentStatLabel}>Completed</p>
                    </div>
                    <div style={styles.enrollmentStatCard}>
                      <p style={styles.enrollmentStatValue}>
                        {Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)}%
                      </p>
                      <p style={styles.enrollmentStatLabel}>Avg Progress</p>
                    </div>
                  </div>

                  <div style={styles.studentList}>
                    {enrollments.map((enrollment, idx) => (
                      <div 
                        key={idx} 
                        className="student-card"
                        style={styles.studentCard}
                        onClick={() => handleViewUserDetails(enrollment)}
                      >
                        <div style={styles.studentAvatar}>
                          {enrollment.userName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={styles.studentInfo}>
                          <p style={styles.studentName}>{enrollment.userName || 'Student'}</p>
                          <p style={styles.studentEmail}>{enrollment.userEmail || 'No email'}</p>
                          <div style={styles.studentMeta}>
                            <span><Calendar size={10} /> {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                            <span><Activity size={10} /> Progress: {enrollment.progress || 0}%</span>
                          </div>
                          <div style={styles.progressBar}>
                            <div style={{...styles.progressFill, width: `${enrollment.progress || 0}%`}} />
                          </div>
                        </div>
                        <div style={{
                          ...styles.statusChip,
                          backgroundColor: enrollment.completed ? '#DCFCE7' : '#FEF3C7',
                          color: enrollment.completed ? '#166534' : '#92400E'
                        }}>
                          {enrollment.completed ? 'Completed' : 'In Progress'}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Details & Response Modal */}
      {showUserDetailsModal && selectedUser && (
        <div className="modal-overlay" style={styles.modalOverlay} onClick={() => setShowUserDetailsModal(false)}>
          <div style={{...styles.modalContent, maxWidth: '450px'}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Student Details</h2>
                <p style={styles.modalSubtitle}>Review progress and send response</p>
              </div>
              <button onClick={() => setShowUserDetailsModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.userProfileHeader}>
                <div style={styles.userAvatar}>
                  {selectedUser.userName?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div>
                  <h3 style={styles.userName}>{selectedUser.userName || 'Student'}</h3>
                  <p style={styles.userEmail}>
                    <Mail size={12} /> {selectedUser.userEmail || 'No email'}
                  </p>
                </div>
              </div>

              <div style={styles.progressSection}>
                <p style={styles.sectionLabel}>Course Progress</p>
                <div style={styles.progressStats}>
                  <div>
                    <p style={styles.progressPercent}>{selectedUser.progress || 0}%</p>
                    <p style={styles.progressLabel}>Completion</p>
                  </div>
                  <div style={{flex: 1}}>
                    <div style={styles.progressBarLarge}>
                      <div style={{...styles.progressFillLarge, width: `${selectedUser.progress || 0}%`}} />
                    </div>
                    <div style={styles.progressDetails}>
                      <span>📚 {selectedUser.completedLessons?.length || 0} lessons completed</span>
                      <span>🎯 Status: {selectedUser.completed ? 'Completed' : 'In Progress'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.responseSection}>
                <label style={styles.sectionLabel}>Send Response to Student</label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  style={styles.responseTextarea}
                  rows="3"
                  placeholder="Type your response message here..."
                />
                <button
                  onClick={handleSendResponse}
                  disabled={sendingResponse}
                  style={styles.sendResponseBtn}
                >
                  {sendingResponse ? (
                    <div style={styles.spinnerSmall}></div>
                  ) : (
                    <Send size={16} />
                  )}
                  Send Response
                </button>
              </div>
            </div>
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
        
        .animate-header {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.1s;
        }
        
        .stats-group {
          animation: slideUp 0.5s ease forwards;
          opacity: 0;
          animation-delay: 0.15s;
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
        
        .course-row {
          transition: all 0.3s ease;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .course-row:nth-child(1) { animation-delay: 0.05s; }
        .course-row:nth-child(2) { animation-delay: 0.1s; }
        .course-row:nth-child(3) { animation-delay: 0.15s; }
        .course-row:nth-child(4) { animation-delay: 0.2s; }
        .course-row:nth-child(5) { animation-delay: 0.25s; }
        
        .course-row:hover {
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
        .tab-btn.active {
          color: #ff961a;
          border-bottom-color: #ff961a;
        }
        
        .upload-area {
          transition: all 0.2s ease;
        }
        .upload-area:hover {
          border-color: #ff961a;
          background: #fff7ed;
        }
        
        .student-card {
          transition: all 0.2s ease;
        }
        .student-card:hover {
          transform: translateX(4px);
          border-color: #ff961a30;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #ff961a;
          box-shadow: 0 0 0 3px rgba(255,150,26,0.1);
        }
        
        .loader-container {
          animation: pulse 1.5s ease infinite;
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
  addButton: { 
    backgroundColor: '#1e293b', 
    color: '#FFF', 
    border: 'none', 
    padding: '12px 28px', 
    borderRadius: '16px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px', 
    fontWeight: '600', 
    cursor: 'pointer', 
    transition: 'all 0.3s ease',
    fontSize: '14px'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '28px',
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: '20px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    transition: 'all 0.3s ease'
  },
  statIconBox: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0
  },
  statLabel: {
    fontSize: '11px',
    color: '#64748b',
    margin: '4px 0 0 0',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  main: { 
    padding: '0', 
    width: '100%' 
  },
  filterBar: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  searchWrapper: {
    flex: 1,
    position: 'relative',
    maxWidth: '360px'
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)'
  },
  clearSearch: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 42px',
    borderRadius: '16px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#FFF',
    transition: 'all 0.2s ease'
  },
  filterSelect: {
    padding: '12px 20px',
    borderRadius: '16px',
    border: '2px solid #E2E8F0',
    fontSize: '14px',
    backgroundColor: '#FFF',
    cursor: 'pointer',
    outline: 'none'
  },
  listContainer: { 
    backgroundColor: '#FFF', 
    borderRadius: '24px', 
    border: '1px solid #E2E8F0', 
    overflow: 'hidden', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)' 
  },
  listHeader: { 
    display: 'flex', 
    padding: '16px 24px', 
    backgroundColor: '#F8FAFC', 
    borderBottom: '2px solid #E2E8F0', 
    color: '#64748B', 
    fontSize: '11px', 
    fontWeight: '700', 
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  row: { 
    display: 'flex', 
    alignItems: 'center', 
    padding: '18px 24px', 
    borderBottom: '1px solid #F1F5F9', 
    transition: 'all 0.2s ease' 
  },
  courseImage: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    objectFit: 'cover'
  },
  iconBox: { 
    width: '48px', 
    height: '48px', 
    borderRadius: '14px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    border: '1px solid #E2E8F0',
    overflow: 'hidden'
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
  levelTag: { 
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
    border: '1px solid #E2E8F0', 
    backgroundColor: '#FFF', 
    cursor: 'pointer', 
    color: '#64748B', 
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
    backgroundColor: '#FFF', 
    width: '90%', 
    maxWidth: '700px', 
    maxHeight: '85vh',
    borderRadius: '28px', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: { 
    padding: '24px 28px 16px', 
    borderBottom: '2px solid #F1F5F9', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    flexShrink: 0
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
  modalSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '4px 0 0'
  },
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '0'
  },
  tabs: { 
    display: 'flex', 
    gap: '24px', 
    padding: '0 28px', 
    borderBottom: '1px solid #F1F5F9',
    flexShrink: 0,
    backgroundColor: '#FFF'
  },
  tab: { 
    padding: '14px 0', 
    border: 'none', 
    background: 'none', 
    fontSize: '14px', 
    color: '#64748B', 
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
    padding: '24px 28px 28px'
  },
  tabContent: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '20px' 
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
  required: {
    color: '#ef4444',
    fontSize: '12px',
    marginLeft: '2px'
  },
  input: { 
    padding: '12px 14px', 
    borderRadius: '14px', 
    border: '2px solid #CBD5E1', 
    fontSize: '14px', 
    width: '100%', 
    boxSizing: 'border-box', 
    outline: 'none', 
    transition: 'all 0.2s ease',
    backgroundColor: '#F8FAFC'
  },
  textarea: {
    padding: '12px 14px',
    borderRadius: '14px',
    border: '2px solid #CBD5E1',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    backgroundColor: '#F8FAFC'
  },
  disabledInput: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8'
  },
  imageUploadArea: {
    border: '2px dashed #E2E8F0',
    borderRadius: '16px',
    height: '140px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    transition: 'all 0.2s ease'
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    height: '100%'
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  removeImageBtn: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(0,0,0,0.6)',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#FFF',
    transition: 'all 0.2s ease'
  },
  uploadPlaceholder: {
    textAlign: 'center',
    padding: '30px'
  },
  uploadText: {
    fontSize: '13px',
    color: '#64748B',
    marginTop: '8px'
  },
  uploadSubtext: {
    fontSize: '11px',
    color: '#94A3B8',
    marginTop: '4px'
  },
  modalFooter: { 
    padding: '20px 0 0', 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: '12px',
    borderTop: '2px solid #F1F5F9',
    flexShrink: 0,
    backgroundColor: '#FFF',
    marginTop: '8px'
  },
  cancelBtn: { 
    padding: '12px 24px', 
    borderRadius: '14px', 
    border: '2px solid #E2E8F0', 
    background: '#FFF', 
    fontWeight: '600', 
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  submitBtn: { 
    backgroundColor: '#1e293b', 
    color: '#FFF', 
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
    background: '#F1F5F9', 
    borderRadius: '50%', 
    padding: '8px', 
    cursor: 'pointer', 
    color: '#64748B',
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
    color: '#94A3B8' 
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '8px',
    opacity: 0.5
  },
  loaderContainer: { 
    textAlign: 'center', 
    padding: '80px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #E2E8F0',
    borderTop: '3px solid #ff961a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  spinnerSmall: {
    width: '16px',
    height: '16px',
    border: '2px solid currentColor',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 0.6s linear infinite'
  },
  enrollmentStats: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    padding: '0 4px'
  },
  enrollmentStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: '14px',
    padding: '14px',
    textAlign: 'center',
    border: '1px solid #E2E8F0'
  },
  enrollmentStatValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0
  },
  enrollmentStatLabel: {
    fontSize: '11px',
    color: '#64748B',
    margin: '4px 0 0 0',
    fontWeight: '500'
  },
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  studentCard: {
    border: '1px solid #E2E8F0',
    borderRadius: '16px',
    padding: '14px',
    display: 'flex',
    gap: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  studentAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #ff961a, #f3b245)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFF',
    fontWeight: '700',
    fontSize: '18px'
  },
  studentInfo: {
    flex: 1
  },
  studentName: {
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    fontSize: '14px'
  },
  studentEmail: {
    fontSize: '12px',
    color: '#64748B',
    margin: '2px 0 6px 0'
  },
  studentMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '10px',
    color: '#94A3B8',
    marginBottom: '6px'
  },
  progressBar: {
    height: '4px',
    backgroundColor: '#E2E8F0',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff961a, #f3b245)',
    borderRadius: '2px'
  },
  statusChip: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '20px',
    height: 'fit-content'
  },
  userProfileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '20px',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: '20px'
  },
  userAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #ff961a, #f3b245)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFF',
    fontWeight: '700',
    fontSize: '24px'
  },
  userName: {
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    fontSize: '16px'
  },
  userEmail: {
    fontSize: '12px',
    color: '#64748B',
    margin: '4px 0 0 0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  progressSection: {
    marginBottom: '24px'
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  progressStats: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  progressPercent: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#ff961a',
    margin: 0,
    lineHeight: 1
  },
  progressLabel: {
    fontSize: '11px',
    color: '#64748B',
    margin: '4px 0 0 0'
  },
  progressBarLarge: {
    height: '8px',
    backgroundColor: '#E2E8F0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  progressFillLarge: {
    height: '100%',
    background: 'linear-gradient(90deg, #ff961a, #f3b245)',
    borderRadius: '4px'
  },
  progressDetails: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#64748B'
  },
  responseSection: {
    marginTop: '8px'
  },
  responseTextarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '14px',
    border: '2px solid #CBD5E1',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    marginBottom: '12px',
    boxSizing: 'border-box',
    backgroundColor: '#F8FAFC',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  sendResponseBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1e293b',
    color: '#FFF',
    border: 'none',
    borderRadius: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease'
  }
};

export default AdminCoursePortal;