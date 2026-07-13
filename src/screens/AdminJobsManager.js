import React, { useState, useEffect } from "react";
import axios from "axios";

// Icons
import {
  FaBriefcase,
  FaUsers,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaFilter,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye as FaView,
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaStar,
  FaFire,
  FaMapMarkerAlt,
  FaBuilding,
  FaGraduationCap,
  FaDollarSign,
  FaCalendarAlt,
  FaEnvelope,
  FaPhone,
  FaLinkedin,
  FaGithub,
  FaGlobe,
  FaFilePdf,
  FaSort,
  FaSpinner,
  FaExclamationCircle,
  FaCheck,
} from "react-icons/fa";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    category: "",
    type: "",
    locationType: "",
    experienceLevel: "",
    search: "",
    sort: "recent"
  });
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    category: "Technology",
    location: "",
    locationType: "On-site",
    type: "Full-time",
    salary: "",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    email: "",
    description: "",
    requirements: [],
    responsibilities: [],
    benefits: [],
    experienceLevel: "Mid Level",
    minExperience: 0,
    education: "Bachelor's Degree",
    skills: [],
    active: true,
    featured: false,
    urgent: false,
    applicationDeadline: "",
    companyName: "",
    companyWebsite: ""
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
      title: "",
      department: "",
      category: "Technology",
      location: "",
      locationType: "On-site",
      type: "Full-time",
      salary: "",
      salaryMin: "",
      salaryMax: "",
      currency: "USD",
      email: "",
      description: "",
      requirements: [],
      responsibilities: [],
      benefits: [],
      experienceLevel: "Mid Level",
      minExperience: 0,
      education: "Bachelor's Degree",
      skills: [],
      active: true,
      featured: false,
      urgent: false,
      applicationDeadline: "",
      companyName: "",
      companyWebsite: ""
    });
    setSelectedJob(null);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
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
    switch (status) {
      case "pending": return "Pending Review";
      case "reviewed": return "Reviewed";
      case "shortlisted": return "Shortlisted";
      case "interview": return "Interview Stage";
      case "rejected": return "Rejected";
      case "hired": return "Hired";
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <FaClock />;
      case "reviewed": return <FaEye />;
      case "shortlisted": return <FaStar />;
      case "interview": return <FaUsers />;
      case "rejected": return <FaTimes />;
      case "hired": return <FaCheckCircle />;
      default: return <FaBriefcase />;
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = jobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(jobs.length / itemsPerPage);

  if (loading) return (
    <div style={styles.loadingContainer}>
      <FaSpinner style={styles.spinner} />
      <p>Loading your dashboard...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Animated Header */}
      <div style={styles.header} className="fade-in">
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>
            {userRole === "admin" ? "Job Portal Management" : "My Job Postings"}
          </h1>
          <p style={styles.subtitle}>
            {userRole === "admin"
              ? "Manage jobs, review applications, and track hiring metrics"
              : `Welcome ${userName}! Manage your job postings and review applicants`}
          </p>
        </div>
        <button style={styles.createBtn} className="pulse-btn" onClick={() => {
          resetForm();
          setShowJobModal(true);
        }}>
          <FaPlus /> Post New Job
        </button>
      </div>

      {/* Animated Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIcon, background: "#eff6ff", color: "#3b82f6" }}>
              <FaBriefcase />
            </div>
            <div>
              <h3 style={styles.statValue}>{stats.totalJobs}</h3>
              <p style={styles.statLabel}>Total Jobs</p>
              <span style={styles.statTrend}>+{stats.activeJobs} active</span>
            </div>
          </div>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIcon, background: "#f0fdf4", color: "#10b981" }}>
              <FaCheckCircle />
            </div>
            <div>
              <h3 style={styles.statValue}>{stats.activeJobs}</h3>
              <p style={styles.statLabel}>Active Jobs</p>
              <span style={styles.statTrend}>Open positions</span>
            </div>
          </div>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIcon, background: "#fef3c7", color: "#f59e0b" }}>
              <FaUsers />
            </div>
            <div>
              <h3 style={styles.statValue}>{stats.totalApplications}</h3>
              <p style={styles.statLabel}>Applications</p>
              <span style={styles.statTrend}>{stats.pendingApplications} pending</span>
            </div>
          </div>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIcon, background: "#f3e8ff", color: "#8b5cf6" }}>
              <FaStar />
            </div>
            <div>
              <h3 style={styles.statValue}>{stats.shortlistedApplications || 0}</h3>
              <p style={styles.statLabel}>Shortlisted</p>
              <span style={styles.statTrend}>Ready for interview</span>
            </div>
          </div>
          <div style={styles.statCard} className="stat-card">
            <div style={{ ...styles.statIcon, background: "#dcfce7", color: "#059669" }}>
              <FaCheckCircle />
            </div>
            <div>
              <h3 style={styles.statValue}>{stats.hiredApplications || 0}</h3>
              <p style={styles.statLabel}>Hired</p>
              <span style={styles.statTrend}>Successfully placed</span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {userRole === "admin" && (
        <div style={styles.advancedFilters} className="slide-down">
          <div style={styles.filterRow}>
            <div style={styles.searchWrapper}>
              <FaSearch style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search jobs by title, department..."
                style={styles.searchInput}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
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
            <button style={styles.resetBtn} onClick={() => setFilters({ status: "", department: "", category: "", type: "", locationType: "", experienceLevel: "", search: "", sort: "recent" })}>
              <FaTimes /> Reset
            </button>
          </div>
        </div>
      )}

      {/* Jobs Table */}
      <div style={styles.tableContainer} className="scale-in">
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Job Title</th>
              <th style={styles.th}>Department</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Applications</th>
              <th style={styles.th}>Views</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((job, index) => (
              <tr key={job._id} style={{ ...styles.tableRow, animationDelay: `${index * 0.05}s` }} className="fade-in-row">
                <td style={styles.jobTitle}>
                  <div style={styles.jobTitleContent}>
                    <strong>{job.title}</strong>
                    <div style={styles.badgeContainer}>
                      {job.urgent && <span style={styles.urgentBadge}><FaFire /> Urgent</span>}
                      {job.featured && <span style={styles.featuredBadge}><FaStar /> Featured</span>}
                    </div>
                  </div>
                </td>
                <td>{job.department}</td>
                <td>
                  <div style={styles.locationCell}>
                    <FaMapMarkerAlt style={styles.locationIcon} />
                    {job.location}
                    <small style={styles.locationType}>({job.locationType})</small>
                  </div>
                </td>
                <td><span style={{ ...styles.typeBadge, background: job.type === "Full-time" ? "#dbeafe" : "#f3e8ff" }}>{job.type}</span></td>
                <td>
                  <button style={styles.viewAppsBtn} onClick={() => fetchJobApplications(job._id)}>
                    <FaUsers /> {job.totalApplications || 0}
                  </button>
                </td>
                <td>
                  <span style={styles.viewsCell}>
                    <FaEye /> {job.views || 0}
                  </span>
                </td>
                <td>
                  <button style={{ ...styles.statusBtn, background: job.active ? "#10b981" : "#ef4444" }} onClick={() => handleToggleStatus(job._id)}>
                    {job.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td>
                  <div style={styles.actionButtons}>
                    <button style={styles.editBtn} onClick={() => {
                      setSelectedJob(job);
                      setFormData(job);
                      setShowJobModal(true);
                    }}>
                      <FaEdit />
                    </button>
                    <button style={styles.deleteBtn} onClick={() => handleDeleteJob(job._id)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan="8" style={styles.emptyRow}>
                  <FaBriefcase size={40} color="#cbd5e1" />
                  <p>No jobs found</p>
                  <button style={styles.emptyBtn} onClick={() => {
                    resetForm();
                    setShowJobModal(true);
                  }}>Post Your First Job</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {jobs.length > itemsPerPage && (
          <div style={styles.pagination}>
            <button
              style={{ ...styles.pageBtn, opacity: currentPage === 1 ? 0.5 : 1 }}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <FaArrowLeft />
            </button>
            <span style={styles.pageInfo}>{currentPage} / {totalPages}</span>
            <button
              style={{ ...styles.pageBtn, opacity: currentPage === totalPages ? 0.5 : 1 }}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <FaArrowRight />
            </button>
          </div>
        )}
      </div>

      {/* Applications Modal */}
      {showApplicationsModal && (
        <div style={styles.modalOverlay} onClick={() => setShowApplicationsModal(false)}>
          <div style={styles.modalLargeContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>Applications for {selectedJob?.title}</h2>
                <p style={styles.modalSubtitle}>{applications.length} candidates applied</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowApplicationsModal(false)}>
                <FaTimes />
              </button>
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
                        <div style={styles.applicantCell}>
                          <div style={styles.applicantAvatar}>
                            {app.fullName?.charAt(0) || "A"}
                          </div>
                          <div>
                            <strong>{app.fullName}</strong>
                            <div style={styles.applicantContact}>
                              <FaEnvelope /> {app.email}
                            </div>
                            <div style={styles.applicantContact}>
                              <FaPhone /> {app.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{app.yearsOfExperience} years</td>
                      <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td>
                        <span style={{ ...styles.statusBadge, background: getStatusBadgeColor(app.status) }}>
                          {getStatusIcon(app.status)} {getStatusLabel(app.status)}
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
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {applications.length === 0 && (
                    <tr>
                      <td colSpan="5" style={styles.emptyRow}>
                        <FaUsers size={40} color="#cbd5e1" />
                        <p>No applications yet for this position.</p>
                      </td>
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
              <button style={styles.closeBtn} onClick={() => setShowApplicationDetailModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div style={styles.detailSection}>
              <div style={styles.detailHeader}>
                <div style={styles.detailAvatar}>
                  {selectedApplication.fullName?.charAt(0) || "A"}
                </div>
                <div>
                  <h3 style={styles.detailName}>{selectedApplication.fullName}</h3>
                  <span style={{ ...styles.statusBadge, background: getStatusBadgeColor(selectedApplication.status) }}>
                    {getStatusLabel(selectedApplication.status)}
                  </span>
                </div>
              </div>

              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <FaEnvelope /> <span>{selectedApplication.email}</span>
                </div>
                <div style={styles.detailItem}>
                  <FaPhone /> <span>{selectedApplication.phone}</span>
                </div>
                <div style={styles.detailItem}>
                  <FaBriefcase /> <span>{selectedApplication.currentPosition || "N/A"}</span>
                </div>
                <div style={styles.detailItem}>
                  <FaBuilding /> <span>{selectedApplication.currentCompany || "N/A"}</span>
                </div>
                <div style={styles.detailItem}>
                  <FaGraduationCap /> <span>{selectedApplication.education || "N/A"}</span>
                </div>
                <div style={styles.detailItem}>
                  <FaDollarSign /> <span>{selectedApplication.expectedSalary || "N/A"}</span>
                </div>
              </div>

              {selectedApplication.coverLetter && (
                <>
                  <h3 style={styles.detailSubtitle}>Cover Letter</h3>
                  <div style={styles.coverLetter}>{selectedApplication.coverLetter}</div>
                </>
              )}

              <div style={styles.detailLinks}>
                {selectedApplication.portfolioUrl && (
                  <a href={selectedApplication.portfolioUrl} target="_blank" style={styles.detailLink}>
                    <FaGlobe /> Portfolio
                  </a>
                )}
                {selectedApplication.linkedInUrl && (
                  <a href={selectedApplication.linkedInUrl} target="_blank" style={styles.detailLink}>
                    <FaLinkedin /> LinkedIn
                  </a>
                )}
                {selectedApplication.githubUrl && (
                  <a href={selectedApplication.githubUrl} target="_blank" style={styles.detailLink}>
                    <FaGithub /> GitHub
                  </a>
                )}
                {selectedApplication.resumeUrl && (
                  <a href={selectedApplication.resumeUrl} target="_blank" style={styles.detailLink}>
                    <FaFilePdf /> Resume
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Job Modal */}
      {showJobModal && (
        <div style={styles.modalOverlay} onClick={() => setShowJobModal(false)}>
          <div style={styles.modalLargeContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>{selectedJob ? "Edit Job" : "Post New Job"}</h2>
                <p style={styles.modalSubtitle}>Fill in the details below to {selectedJob ? "update" : "create"} a job posting</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowJobModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={selectedJob ? handleUpdateJob : handleCreateJob} style={styles.form}>
              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Basic Information</h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label>Job Title *</label>
                    <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Senior Software Engineer" />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Department *</label>
                    <input type="text" required value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} placeholder="e.g., Engineering" />
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
                    <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g., New York, NY" />
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
                </div>
              </div>

              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Compensation & Requirements</h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label>Salary Range *</label>
                    <input type="text" required placeholder="e.g., $50,000 - $70,000" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Experience Level</label>
                    <select value={formData.experienceLevel} onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}>
                      <option value="Entry Level">Entry Level</option>
                      <option value="Mid Level">Mid Level</option>
                      <option value="Senior Level">Senior Level</option>
                      <option value="Lead">Lead</option>
                      <option value="Manager">Manager</option>
                      <option value="Executive">Executive</option>
                    </select>
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
              </div>

              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Job Description</h3>
                <div style={styles.formGroup}>
                  <label>Description *</label>
                  <textarea rows="5" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Provide a detailed description of the job..." />
                </div>
              </div>

              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Requirements & Responsibilities</h3>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label>Requirements (one per line)</label>
                    <textarea rows="4" placeholder="e.g., Bachelor's degree in Computer Science&#10;5+ years of experience&#10;Strong knowledge of React" value={formData.requirements.join('\n')} onChange={(e) => setFormData({ ...formData, requirements: e.target.value.split('\n').filter(r => r.trim()) })} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Responsibilities (one per line)</label>
                    <textarea rows="4" placeholder="e.g., Lead development of new features&#10;Mentor junior developers" value={formData.responsibilities.join('\n')} onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value.split('\n').filter(r => r.trim()) })} />
                  </div>
                </div>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label>Benefits (one per line)</label>
                    <textarea rows="3" placeholder="e.g., Health insurance&#10;401(k) matching" value={formData.benefits.join('\n')} onChange={(e) => setFormData({ ...formData, benefits: e.target.value.split('\n').filter(b => b.trim()) })} />
                  </div>
                  <div style={styles.formGroup}>
                    <label>Required Skills (comma separated)</label>
                    <input type="text" placeholder="React, Node.js, Python, AWS" value={formData.skills.join(', ')} onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} />
                  </div>
                </div>
              </div>

              <div style={styles.formSection}>
                <h3 style={styles.formSectionTitle}>Job Status</h3>
                <div style={styles.formRow}>
                  <label style={styles.checkbox}>
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                    <span>Active Job</span>
                  </label>
                  <label style={styles.checkbox}>
                    <input type="checkbox" checked={formData.urgent} onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })} />
                    <span><FaFire style={{ color: "#f59e0b" }} /> Urgent Hiring</span>
                  </label>
                  {userRole === "admin" && (
                    <label style={styles.checkbox}>
                      <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                      <span><FaStar style={{ color: "#f59e0b" }} /> Featured Job</span>
                    </label>
                  )}
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowJobModal(false)}>Cancel</button>
                <button type="submit" style={styles.submitBtn}>
                  {selectedJob ? <><FaEdit /> Update Job</> : <><FaPlus /> Post Job</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .fade-in {
            animation: fadeIn 0.6s ease forwards;
          }
          .slide-down {
            animation: slideDown 0.5s ease forwards;
          }
          .scale-in {
            animation: scaleIn 0.5s ease forwards;
          }
          .fade-in-row {
            animation: fadeIn 0.4s ease forwards;
            opacity: 0;
          }
          .stat-card {
            animation: fadeIn 0.6s ease forwards;
            opacity: 0;
          }
          .stat-card:nth-child(1) { animation-delay: 0.05s; }
          .stat-card:nth-child(2) { animation-delay: 0.1s; }
          .stat-card:nth-child(3) { animation-delay: 0.15s; }
          .stat-card:nth-child(4) { animation-delay: 0.2s; }
          .stat-card:nth-child(5) { animation-delay: 0.25s; }

          .pulse-btn {
            animation: pulse 2s infinite;
          }

          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.1);
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
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    gap: "20px",
  },
  spinner: {
    fontSize: "40px",
    color: "#f9c349",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "28px",
    flexWrap: "wrap",
    gap: "16px",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#64748b",
    marginTop: "6px",
    fontSize: "14px",
  },
  createBtn: {
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 15px rgba(255, 150, 26, 0.3)",
    transition: "all 0.3s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },
  statCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  statIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    flexShrink: 0,
  },
  statValue: {
    fontSize: "26px",
    fontWeight: "700",
    margin: 0,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  statTrend: {
    fontSize: "11px",
    color: "#10b981",
  },
  advancedFilters: {
    marginBottom: "24px",
  },
  filterRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchWrapper: {
    flex: 1,
    minWidth: "200px",
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px 10px 40px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#fff",
    transition: "all 0.3s ease",
    outline: "none",
  },
  filterSelect: {
    padding: "10px 16px",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    background: "#fff",
    fontSize: "14px",
    minWidth: "140px",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.3s ease",
  },
  resetBtn: {
    padding: "10px 20px",
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
  tableContainer: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },
  tableHeader: {
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  tableRow: {
    borderBottom: "1px solid #f1f5f9",
    transition: "all 0.2s ease",
  },
  jobTitle: {
    padding: "14px 16px",
  },
  jobTitleContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  badgeContainer: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  urgentBadge: {
    background: "#fef3c7",
    color: "#d97706",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  featuredBadge: {
    background: "#f3e8ff",
    color: "#9333ea",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  typeBadge: {
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block",
  },
  locationCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
  },
  locationIcon: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  locationType: {
    color: "#94a3b8",
    fontSize: "11px",
  },
  viewAppsBtn: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  viewsCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#64748b",
  },
  statusBtn: {
    padding: "4px 14px",
    borderRadius: "20px",
    border: "none",
    color: "#fff",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500",
  },
  actionButtons: {
    display: "flex",
    gap: "6px",
  },
  editBtn: {
    padding: "6px 10px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  deleteBtn: {
    padding: "6px 10px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  statusBadge: {
    padding: "4px 14px",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontWeight: "500",
  },
  statusSelect: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    marginRight: "8px",
    fontSize: "12px",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
  },
  viewDetailsBtn: {
    padding: "6px 12px",
    background: "#8b5cf6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.3s ease",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease",
  },
  modalContent: {
    background: "#fff",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "scaleIn 0.3s ease",
  },
  modalLargeContent: {
    background: "#fff",
    borderRadius: "20px",
    padding: "32px",
    maxWidth: "1100px",
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "scaleIn 0.3s ease",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  modalSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  formSection: {
    background: "#f8fafc",
    padding: "20px",
    borderRadius: "12px",
  },
  formSectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  formRow: {
    display: "flex",
    gap: "24px",
    flexWrap: "wrap",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#475569",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  cancelBtn: {
    padding: "10px 24px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    transition: "all 0.3s ease",
  },
  submitBtn: {
    padding: "10px 28px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(255, 150, 26, 0.3)",
  },
  emptyRow: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  emptyBtn: {
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    padding: "10px 24px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    padding: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  pageBtn: {
    padding: "8px 16px",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  pageInfo: {
    fontSize: "14px",
    color: "#475569",
    fontWeight: "500",
  },
  applicantCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  applicantAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "16px",
    color: "#fff",
    flexShrink: 0,
  },
  applicantContact: {
    fontSize: "12px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  detailSection: {
    padding: "8px 0",
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
  },
  detailAvatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "28px",
    color: "#fff",
  },
  detailName: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "20px",
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#475569",
    padding: "8px 12px",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  detailSubtitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    marginTop: "16px",
    marginBottom: "8px",
  },
  coverLetter: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "8px",
    lineHeight: "1.8",
    fontSize: "14px",
    color: "#334155",
    marginBottom: "16px",
  },
  detailLinks: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "16px",
  },
  detailLink: {
    padding: "8px 16px",
    background: "#f1f5f9",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#475569",
    fontSize: "13px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
};

export default AdminJobsManager;