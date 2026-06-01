import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminJobsManager = ({ userRole, userName }) => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showApplicationDetailModal, setShowApplicationDetailModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({ 
    status: "", department: "", category: "", type: "", locationType: "", experienceLevel: "", search: "", sort: "recent" 
  });
  const [formData, setFormData] = useState({
    title: "", department: "", category: "Technology", location: "", locationType: "On-site",
    type: "Full-time", salary: "", salaryMin: "", salaryMax: "", currency: "USD",
    email: "", description: "", requirements: [], responsibilities: [], benefits: [],
    experienceLevel: "Mid Level", minExperience: 0, education: "Bachelor's Degree",
    skills: [], active: true, featured: false, urgent: false,
    applicationDeadline: "", companyName: "", companyWebsite: ""
  });

  const token = localStorage.getItem("token");
  const API_URL = "http://localhost:5000/api/jobs";
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters);
      let url;
      if (userRole === "admin") {
        url = `${API_URL}/all?${queryParams}`;
      } else {
        url = `${API_URL}/my-jobs`;
      }
      const res = await axios.get(url, config);
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/stats`, config);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchJobApplications = async (jobId) => {
    try {
      const res = await axios.get(`${API_URL}/job/${jobId}/applications`, config);
      setApplications(res.data);
      setSelectedJob(jobs.find(j => j._id === jobId));
      setShowApplicationsModal(true);
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/add`, formData, config);
      alert("Job created successfully!");
      setShowJobModal(false);
      resetForm();
      fetchJobs();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create job");
    }
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/update/${selectedJob._id}`, formData, config);
      alert("Job updated successfully!");
      setShowJobModal(false);
      resetForm();
      fetchJobs();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update job");
    }
  };

  const handleToggleStatus = async (jobId) => {
    try {
      await axios.patch(`${API_URL}/toggle/${jobId}`, {}, config);
      fetchJobs();
    } catch (err) {
      alert("Failed to toggle job status");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job? This will also delete all applications.")) {
      try {
        await axios.delete(`${API_URL}/delete/${jobId}`, config);
        fetchJobs();
        fetchStats();
      } catch (err) {
        alert("Failed to delete job");
      }
    }
  };

  const handleUpdateApplicationStatus = async (appId, status, interviewDate = null, interviewNotes = "") => {
    try {
      await axios.patch(`${API_URL}/application/${appId}/status`, 
        { status, interviewDate, interviewNotes }, 
        config
      );
      alert(`Application status updated to ${status}`);
      fetchJobApplications(selectedJob._id);
    } catch (err) {
      alert("Failed to update application status");
    }
  };

  const viewApplicationDetail = (application) => {
    setSelectedApplication(application);
    setShowApplicationDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: "", department: "", category: "Technology", location: "", locationType: "On-site",
      type: "Full-time", salary: "", salaryMin: "", salaryMax: "", currency: "USD",
      email: "", description: "", requirements: [], responsibilities: [], benefits: [],
      experienceLevel: "Mid Level", minExperience: 0, education: "Bachelor's Degree",
      skills: [], active: true, featured: false, urgent: false,
      applicationDeadline: "", companyName: "", companyWebsite: ""
    });
    setSelectedJob(null);
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case "pending": return "#f59e0b";
      case "reviewed": return "#3b82f6";
      case "shortlisted": return "#10b981";
      case "interview": return "#8b5cf6";
      case "rejected": return "#ef4444";
      case "hired": return "#059669";
      default: return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case "pending": return "Pending Review";
      case "reviewed": return "Reviewed";
      case "shortlisted": return "Shortlisted";
      case "interview": return "Interview Stage";
      case "rejected": return "Rejected";
      case "hired": return "Hired";
      default: return status;
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {userRole === "admin" ? "Job Portal Management" : "My Job Postings"}
          </h1>
          <p style={styles.subtitle}>
            {userRole === "admin" 
              ? "Manage jobs, review applications, and track hiring metrics"
              : `Welcome ${userName}! Manage your job postings and review applicants`}
          </p>
        </div>
        <button style={styles.createBtn} onClick={() => {
          resetForm();
          setShowJobModal(true);
        }}>
          + Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: "#eff6ff", color: "#3b82f6" }}>📊</div>
            <div>
              <h3 style={styles.statValue}>{stats.totalJobs}</h3>
              <p style={styles.statLabel}>Total Jobs</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: "#f0fdf4", color: "#10b981" }}>✅</div>
            <div>
              <h3 style={styles.statValue}>{stats.activeJobs}</h3>
              <p style={styles.statLabel}>Active Jobs</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#f59e0b" }}>📝</div>
            <div>
              <h3 style={styles.statValue}>{stats.totalApplications}</h3>
              <p style={styles.statLabel}>Applications</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: "#f3e8ff", color: "#8b5cf6" }}>⭐</div>
            <div>
              <h3 style={styles.statValue}>{stats.shortlistedApplications || 0}</h3>
              <p style={styles.statLabel}>Shortlisted</p>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: "#dcfce7", color: "#059669" }}>🎉</div>
            <div>
              <h3 style={styles.statValue}>{stats.hiredApplications || 0}</h3>
              <p style={styles.statLabel}>Hired</p>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {userRole === "admin" && (
        <div style={styles.advancedFilters}>
          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search jobs..."
              style={styles.searchInput}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <select style={styles.filterSelect} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select style={styles.filterSelect} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
            <select style={styles.filterSelect} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
              <option value="">All Categories</option>
              <option value="Technology">Technology</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="Design">Design</option>
            </select>
            <select style={styles.filterSelect} value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}>
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="applications">Most Applications</option>
              <option value="views">Most Views</option>
            </select>
            <button style={styles.resetBtn} onClick={() => setFilters({ status: "", department: "", category: "", type: "", locationType: "", experienceLevel: "", search: "", sort: "recent" })}>
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Jobs Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th>Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Type</th>
              <th>Applications</th>
              <th>Views</th>
              <th>Status</th>
              <th>Actions</th>
             </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job._id} style={styles.tableRow}>
                <td style={styles.jobTitle}>
                  {job.title}
                  {job.urgent && <span style={styles.urgentBadge}>Urgent</span>}
                  {job.featured && <span style={styles.featuredBadge}>Featured</span>}
                </td>
                <td>{job.department}</td>
                <td>{job.location} <small>({job.locationType})</small></td>
                <td><span style={styles.typeBadge}>{job.type}</span></td>
                <td>
                  <button style={styles.viewAppsBtn} onClick={() => fetchJobApplications(job._id)}>
                    {job.totalApplications || 0} Applications
                  </button>
                </td>
                <td>{job.views || 0}</td>
                <td>
                  <button style={{ ...styles.statusBtn, background: job.active ? "#10b981" : "#ef4444" }} onClick={() => handleToggleStatus(job._id)}>
                    {job.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <button style={styles.editBtn} onClick={() => {
                    setSelectedJob(job);
                    setFormData(job);
                    setShowJobModal(true);
                  }}>Edit</button>
                  <button style={styles.deleteBtn} onClick={() => handleDeleteJob(job._id)}>Delete</button>
                 </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan="8" style={styles.emptyRow}>No jobs found. Click "Post New Job" to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Applications Modal */}
      {showApplicationsModal && (
        <div style={styles.modalOverlay} onClick={() => setShowApplicationsModal(false)}>
          <div style={styles.modalLargeContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Applications for {selectedJob?.title}</h2>
              <button style={styles.closeBtn} onClick={() => setShowApplicationsModal(false)}>✕</button>
            </div>
            
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th>Applicant</th>
                    <th>Experience</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id} style={styles.tableRow}>
                      <td>
                        <div>
                          <strong>{app.fullName}</strong><br />
                          <small style={{ color: "#666" }}>{app.email}</small><br />
                          <small style={{ color: "#666" }}>{app.phone}</small>
                        </div>
                      </td>
                      <td>{app.yearsOfExperience} years</td>
                      <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td>
                        <span style={{ ...styles.statusBadge, background: getStatusBadgeColor(app.status) }}>
                          {getStatusLabel(app.status)}
                        </span>
                      </td>
                      <td>
                        <select 
                          style={styles.statusSelect}
                          value={app.status}
                          onChange={(e) => handleUpdateApplicationStatus(app._id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                        <button style={styles.viewDetailsBtn} onClick={() => viewApplicationDetail(app)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan="5" style={styles.emptyRow}>No applications yet for this position.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {showApplicationDetailModal && selectedApplication && (
        <div style={styles.modalOverlay} onClick={() => setShowApplicationDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Application Details</h2>
              <button style={styles.closeBtn} onClick={() => setShowApplicationDetailModal(false)}>✕</button>
            </div>
            
            <div style={styles.detailSection}>
              <h3>Personal Information</h3>
              <div style={styles.detailGrid}>
                <div><strong>Full Name:</strong> {selectedApplication.fullName}</div>
                <div><strong>Email:</strong> {selectedApplication.email}</div>
                <div><strong>Phone:</strong> {selectedApplication.phone}</div>
                <div><strong>Address:</strong> {selectedApplication.address || "N/A"}</div>
                <div><strong>Current Company:</strong> {selectedApplication.currentCompany || "N/A"}</div>
                <div><strong>Current Position:</strong> {selectedApplication.currentPosition || "N/A"}</div>
                <div><strong>Years Experience:</strong> {selectedApplication.yearsOfExperience}</div>
                <div><strong>Expected Salary:</strong> {selectedApplication.expectedSalary || "N/A"}</div>
                <div><strong>Notice Period:</strong> {selectedApplication.noticePeriod || "N/A"}</div>
                <div><strong>Work Authorization:</strong> {selectedApplication.workAuthorization}</div>
              </div>
              
              <h3>Links</h3>
              <div style={styles.detailGrid}>
                <div><strong>Portfolio:</strong> {selectedApplication.portfolioUrl ? <a href={selectedApplication.portfolioUrl} target="_blank">View</a> : "N/A"}</div>
                <div><strong>LinkedIn:</strong> {selectedApplication.linkedInUrl ? <a href={selectedApplication.linkedInUrl} target="_blank">View</a> : "N/A"}</div>
                <div><strong>GitHub:</strong> {selectedApplication.githubUrl ? <a href={selectedApplication.githubUrl} target="_blank">View</a> : "N/A"}</div>
                <div><strong>Resume:</strong> {selectedApplication.resumeUrl ? <a href={selectedApplication.resumeUrl} target="_blank">Download Resume</a> : "N/A"}</div>
              </div>
              
              <h3>Cover Letter</h3>
              <p style={styles.coverLetter}>{selectedApplication.coverLetter}</p>
              
              {selectedApplication.notes && (
                <>
                  <h3>Review Notes</h3>
                  <p style={styles.notes}>{selectedApplication.notes}</p>
                </>
              )}
              
              {selectedApplication.interviewDate && (
                <>
                  <h3>Interview Information</h3>
                  <div><strong>Date:</strong> {new Date(selectedApplication.interviewDate).toLocaleString()}</div>
                  <div><strong>Notes:</strong> {selectedApplication.interviewNotes || "N/A"}</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Job Modal */}
      {showJobModal && (
        <div style={styles.modalOverlay} onClick={() => setShowJobModal(false)}>
          <div style={styles.modalLargeContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{selectedJob ? "Edit Job" : "Post New Job"}</h2>
            <form onSubmit={selectedJob ? handleUpdateJob : handleCreateJob} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label>Job Title *</label>
                  <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label>Department *</label>
                  <input type="text" required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    <option value="Technology">Technology</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="Design">Design</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label>Location *</label>
                  <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label>Location Type</label>
                  <select value={formData.locationType} onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label>Job Type *</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label>Salary Range *</label>
                  <input type="text" required placeholder="e.g., $50,000 - $70,000" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label>Min Experience (years)</label>
                  <input type="number" value={formData.minExperience} onChange={(e) => setFormData({ ...formData, minExperience: parseInt(e.target.value) || 0 })} />
                </div>
                <div style={styles.formGroup}>
                  <label>Education Level</label>
                  <select value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })}>
                    <option value="High School">High School</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                    <option value="Not Specified">Not Specified</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label>Contact Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label>Company Name</label>
                  <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                </div>
                <div style={styles.formGroup}>
                  <label>Company Website</label>
                  <input type="url" value={formData.companyWebsite} onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })} />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Job Description *</label>
                <textarea rows="5" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div style={styles.formGroup}>
                <label>Requirements (one per line)</label>
                <textarea rows="3" placeholder="e.g., Bachelor's degree in Computer Science&#10;5+ years of experience&#10;Strong knowledge of React" value={formData.requirements.join('\n')} onChange={(e) => setFormData({ ...formData, requirements: e.target.value.split('\n').filter(r => r.trim()) })} />
              </div>

              <div style={styles.formGroup}>
                <label>Responsibilities (one per line)</label>
                <textarea rows="3" placeholder="e.g., Lead development of new features&#10;Mentor junior developers" value={formData.responsibilities.join('\n')} onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value.split('\n').filter(r => r.trim()) })} />
              </div>

              <div style={styles.formGroup}>
                <label>Benefits (one per line)</label>
                <textarea rows="2" placeholder="e.g., Health insurance&#10;401(k) matching" value={formData.benefits.join('\n')} onChange={(e) => setFormData({ ...formData, benefits: e.target.value.split('\n').filter(b => b.trim()) })} />
              </div>

              <div style={styles.formGroup}>
                <label>Required Skills (comma separated)</label>
                <input type="text" placeholder="React, Node.js, Python, AWS" value={formData.skills.join(', ')} onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} />
              </div>

              <div style={styles.formRow}>
                <label style={styles.checkbox}>
                  <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                  Active Job
                </label>
                <label style={styles.checkbox}>
                  <input type="checkbox" checked={formData.urgent} onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })} />
                  Urgent Hiring
                </label>
                {userRole === "admin" && (
                  <label style={styles.checkbox}>
                    <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                    Featured Job
                  </label>
                )}
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowJobModal(false)}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>{selectedJob ? "Update Job" : "Post Job"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: "24px", maxWidth: "1400px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#1a1a1a", margin: 0 },
  subtitle: { color: "#666", marginTop: "8px" },
  createBtn: { background: "#ff961a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "12px", fontWeight: "600", cursor: "pointer" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" },
  statCard: { background: "#fff", padding: "20px", borderRadius: "16px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  statIcon: { width: "50px", height: "50px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" },
  statValue: { fontSize: "28px", fontWeight: "700", margin: 0, color: "#1a1a1a" },
  statLabel: { fontSize: "14px", color: "#666", margin: "4px 0 0 0" },
  advancedFilters: { marginBottom: "24px" },
  filterRow: { display: "flex", gap: "12px", flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: "200px", padding: "10px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "14px" },
  filterSelect: { padding: "10px 16px", border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fff" },
  resetBtn: { padding: "10px 20px", background: "#6b7280", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  tableContainer: { overflowX: "auto", background: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { borderBottom: "1px solid #e5e7eb", background: "#f9fafb", padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151" },
  tableRow: { borderBottom: "1px solid #e5e7eb", padding: "16px" },
  jobTitle: { fontWeight: "600", color: "#1a1a1a" },
  urgentBadge: { background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", marginLeft: "8px", fontWeight: "500" },
  featuredBadge: { background: "#f3e8ff", color: "#9333ea", padding: "2px 8px", borderRadius: "12px", fontSize: "10px", marginLeft: "8px", fontWeight: "500" },
  typeBadge: { background: "#f3f4f6", padding: "4px 8px", borderRadius: "6px", fontSize: "12px" },
  viewAppsBtn: { background: "#3b82f6", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  statusBtn: { padding: "4px 12px", borderRadius: "20px", border: "none", color: "#fff", fontSize: "12px", cursor: "pointer" },
  editBtn: { padding: "6px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", marginRight: "8px" },
  deleteBtn: { padding: "6px 12px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" },
  statusBadge: { padding: "4px 12px", borderRadius: "20px", color: "#fff", fontSize: "12px", display: "inline-block" },
  statusSelect: { padding: "6px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", marginRight: "8px", fontSize: "12px" },
  viewDetailsBtn: { padding: "6px 12px", background: "#8b5cf6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", marginTop: "4px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#fff", borderRadius: "16px", padding: "32px", maxWidth: "600px", width: "90%", maxHeight: "90vh", overflowY: "auto" },
  modalLargeContent: { background: "#fff", borderRadius: "16px", padding: "32px", maxWidth: "1200px", width: "90%", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: "24px", fontWeight: "700", marginBottom: "24px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  closeBtn: { background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#666" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" },
  formRow: { display: "flex", gap: "20px", marginBottom: "16px", flexWrap: "wrap" },
  checkbox: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  formActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "16px" },
  cancelBtn: { padding: "10px 20px", background: "#e5e7eb", border: "none", borderRadius: "8px", cursor: "pointer" },
  submitBtn: { padding: "10px 20px", background: "#ff961a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontSize: "18px", color: "#666" },
  emptyRow: { textAlign: "center", padding: "40px", color: "#666" },
  detailSection: { padding: "16px 0" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px", marginBottom: "20px" },
  coverLetter: { background: "#f9fafb", padding: "16px", borderRadius: "8px", marginBottom: "20px", lineHeight: "1.6" },
  notes: { background: "#fef3c7", padding: "12px", borderRadius: "8px", marginBottom: "20px" }
};

export default AdminJobsManager;