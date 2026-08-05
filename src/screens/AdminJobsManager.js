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
  FaTag,
  FaClock as FaClockIcon,
  FaTrophy,
  FaAward,
  FaHeart,
  FaShieldAlt,
  FaRocket,
  FaLightbulb,
  FaUsersCog,
  FaChartLine,
  FaLayerGroup,
  FaClipboardList,
  FaWifi,
  FaHome,
  FaLaptop,
  FaRegBuilding,
  FaRegClock,
  FaRegCalendar,
  FaRegStar,
  FaRegFileAlt,
  FaRegFolderOpen,
  FaExternalLinkAlt,
  FaUpload,
  FaFileUpload,
  FaCheckDouble,
  FaBars,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeSection, setActiveSection] = useState("basic");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
    companyWebsite: "",
    workSchedule: "Monday - Friday, 9AM - 5PM",
    perks: [],
    teamSize: "",
    reportTo: "",
    departmentDetails: "",
  });

  const token = localStorage.getItem("token");
  const API_URL = "https://the-deft-crew-production.up.railway.app/api/jobs";
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // ─── FIX: Safe array helpers ──────────────────────────────────────
  const safeArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // If it's a string that might be JSON or comma-separated
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return value.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const safeJoin = (value, separator = '\n') => {
    const arr = safeArray(value);
    return arr.join(separator);
  };

  // ─── FIX: Reset form with safe defaults ──────────────────────────
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
      companyWebsite: "",
      workSchedule: "Monday - Friday, 9AM - 5PM",
      perks: [],
      teamSize: "",
      reportTo: "",
      departmentDetails: "",
    });
    setSelectedJob(null);
    setActiveSection("basic");
  };

  // ─── FIX: Edit handler with safe data transformation ─────────────
  const handleEditJob = (job) => {
    setSelectedJob(job);
    setFormData({
      _id: job._id || "",
      title: job.title || "",
      department: job.department || "",
      category: job.category || "Technology",
      location: job.location || "",
      locationType: job.locationType || "On-site",
      type: job.type || "Full-time",
      salary: job.salary || "",
      salaryMin: job.salaryMin || "",
      salaryMax: job.salaryMax || "",
      currency: job.currency || "USD",
      email: job.email || "",
      description: job.description || "",
      requirements: safeArray(job.requirements),
      responsibilities: safeArray(job.responsibilities),
      benefits: safeArray(job.benefits),
      experienceLevel: job.experienceLevel || "Mid Level",
      minExperience: job.minExperience || 0,
      education: job.education || "Bachelor's Degree",
      skills: safeArray(job.skills),
      active: job.active !== undefined ? job.active : true,
      featured: job.featured || false,
      urgent: job.urgent || false,
      applicationDeadline: job.applicationDeadline || "",
      companyName: job.companyName || "",
      companyWebsite: job.companyWebsite || "",
      workSchedule: job.workSchedule || "Monday - Friday, 9AM - 5PM",
      perks: safeArray(job.perks),
      teamSize: job.teamSize || "",
      reportTo: job.reportTo || "",
      departmentDetails: job.departmentDetails || "",
    });
    setShowJobModal(true);
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

  const getLocationIcon = (type) => {
    switch (type) {
      case "Remote": return <FaGlobe />;
      case "Hybrid": return <FaRegBuilding />;
      case "On-site": return <FaHome />;
      default: return <FaMapMarkerAlt />;
    }
  };

  const sections = [
    { id: "basic", label: "Basic Info", icon: <FaBriefcase /> },
    { id: "details", label: "Job Details", icon: <FaClipboardList /> },
    { id: "requirements", label: "Requirements", icon: <FaCheckDouble /> },
    { id: "benefits", label: "Benefits & Perks", icon: <FaAward /> },
    { id: "company", label: "Company Info", icon: <FaBuilding /> },
    { id: "publish", label: "Publish", icon: <FaRocket /> },
  ];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = jobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(jobs.length / itemsPerPage);

  // Mobile Job Card
  const MobileJobCard = ({ job }) => (
    <div style={styles.mobileJobCard}>
      <div style={styles.mobileJobHeader}>
        <div style={styles.mobileJobTitle}>
          <strong>{job.title}</strong>
          <div style={styles.mobileBadgeContainer}>
            {job.urgent && <span style={styles.urgentBadge}><FaFire /> Urgent</span>}
            {job.featured && <span style={styles.featuredBadge}><FaStar /> Featured</span>}
          </div>
        </div>
        <button style={{ ...styles.statusBtn, background: job.active ? "#10b981" : "#ef4444", padding: "4px 12px", fontSize: "11px" }} onClick={() => handleToggleStatus(job._id)}>
          {job.active ? "Active" : "Inactive"}
        </button>
      </div>
      
      <div style={styles.mobileJobDetails}>
        <div style={styles.mobileJobDetail}>
          <FaBuilding size={12} /> {job.department}
        </div>
        <div style={styles.mobileJobDetail}>
          {getLocationIcon(job.locationType)} {job.location}
        </div>
        <div style={styles.mobileJobDetail}>
          <span style={{ ...styles.typeBadge, background: job.type === "Full-time" ? "#dbeafe" : "#f3e8ff", padding: "2px 10px", fontSize: "11px" }}>{job.type}</span>
        </div>
        <div style={styles.mobileJobDetail}>
          <FaUsers size={12} /> {job.totalApplications || 0} applications
        </div>
        <div style={styles.mobileJobDetail}>
          <FaEye size={12} /> {job.views || 0} views
        </div>
      </div>

      <div style={styles.mobileJobActions}>
        <button style={styles.mobileActionBtn} onClick={() => fetchJobApplications(job._id)}>
          <FaUsers /> View Apps
        </button>
        <button style={{ ...styles.mobileActionBtn, background: "#10b981" }} onClick={() => handleEditJob(job)}>
          <FaEdit /> Edit
        </button>
        <button style={{ ...styles.mobileActionBtn, background: "#ef4444" }} onClick={() => handleDeleteJob(job._id)}>
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingSpinner}><FaSpinner /></div>
      <p style={styles.loadingText}>Loading your dashboard...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header} className="fade-in">
        <div style={styles.headerLeft}>
          <div style={styles.headerBadge}>
            <span style={styles.headerBadgeIcon}><FaRocket /></span>
            <span style={styles.headerBadgeText}>Hiring Dashboard</span>
          </div>
          <h1 style={isMobile ? styles.mobileTitle : styles.title}>
            {userRole === "admin" ? "Job Portal Management" : "My Job Postings"}
          </h1>
          <p style={isMobile ? styles.mobileSubtitle : styles.subtitle}>
            {userRole === "admin"
              ? "Manage jobs, review applications, and track hiring metrics"
              : `Welcome back, ${userName}! Manage your job postings`}
          </p>
        </div>
        <button style={isMobile ? styles.mobileCreateBtn : styles.createBtn} className="pulse-btn" onClick={() => {
          resetForm();
          setShowJobModal(true);
        }}>
          <FaPlus /> {isMobile ? "New" : "Post New Job"}
        </button>
      </div>

      {/* Stats Grid - Responsive */}
      {stats && (
        <div style={{
          ...styles.statsGrid,
          gridTemplateColumns: isMobile 
            ? "repeat(2, 1fr)" 
            : isTablet 
              ? "repeat(2, 1fr)" 
              : "repeat(4, 1fr)",
          gap: isMobile ? "8px" : isTablet ? "10px" : "12px",
        }}>
          <div style={{
            ...styles.statCard,
            padding: isMobile ? "12px" : isTablet ? "14px" : "16px",
          }} className="stat-card">
            <div style={{
              ...styles.statIcon,
              width: isMobile ? "36px" : isTablet ? "40px" : "44px",
              height: isMobile ? "36px" : isTablet ? "40px" : "44px",
              fontSize: isMobile ? "14px" : isTablet ? "16px" : "18px",
              background: "#eff6ff",
              color: "#3b82f6",
            }}>
              <FaBriefcase />
            </div>
            <div>
              <h3 style={{
                ...styles.statValue,
                fontSize: isMobile ? "18px" : isTablet ? "20px" : "22px",
              }}>{stats.totalJobs}</h3>
              <p style={{
                ...styles.statLabel,
                fontSize: isMobile ? "10px" : isTablet ? "11px" : "12px",
              }}>Total Jobs</p>
              <span style={{
                ...styles.statTrend,
                fontSize: isMobile ? "9px" : isTablet ? "10px" : "10px",
              }}>+{stats.activeJobs} active</span>
            </div>
          </div>
          <div style={{
            ...styles.statCard,
            padding: isMobile ? "12px" : isTablet ? "14px" : "16px",
          }} className="stat-card">
            <div style={{
              ...styles.statIcon,
              width: isMobile ? "36px" : isTablet ? "40px" : "44px",
              height: isMobile ? "36px" : isTablet ? "40px" : "44px",
              fontSize: isMobile ? "14px" : isTablet ? "16px" : "18px",
              background: "#f0fdf4",
              color: "#10b981",
            }}>
              <FaCheckCircle />
            </div>
            <div>
              <h3 style={{
                ...styles.statValue,
                fontSize: isMobile ? "18px" : isTablet ? "20px" : "22px",
              }}>{stats.activeJobs}</h3>
              <p style={{
                ...styles.statLabel,
                fontSize: isMobile ? "10px" : isTablet ? "11px" : "12px",
              }}>Active Jobs</p>
              <span style={{
                ...styles.statTrend,
                fontSize: isMobile ? "9px" : isTablet ? "10px" : "10px",
              }}>Open positions</span>
            </div>
          </div>
          <div style={{
            ...styles.statCard,
            padding: isMobile ? "12px" : isTablet ? "14px" : "16px",
          }} className="stat-card">
            <div style={{
              ...styles.statIcon,
              width: isMobile ? "36px" : isTablet ? "40px" : "44px",
              height: isMobile ? "36px" : isTablet ? "40px" : "44px",
              fontSize: isMobile ? "14px" : isTablet ? "16px" : "18px",
              background: "#fef3c7",
              color: "#f59e0b",
            }}>
              <FaUsers />
            </div>
            <div>
              <h3 style={{
                ...styles.statValue,
                fontSize: isMobile ? "18px" : isTablet ? "20px" : "22px",
              }}>{stats.totalApplications}</h3>
              <p style={{
                ...styles.statLabel,
                fontSize: isMobile ? "10px" : isTablet ? "11px" : "12px",
              }}>Applications</p>
              <span style={{
                ...styles.statTrend,
                fontSize: isMobile ? "9px" : isTablet ? "10px" : "10px",
              }}>{stats.pendingApplications} pending</span>
            </div>
          </div>
          <div style={{
            ...styles.statCard,
            padding: isMobile ? "12px" : isTablet ? "14px" : "16px",
          }} className="stat-card">
            <div style={{
              ...styles.statIcon,
              width: isMobile ? "36px" : isTablet ? "40px" : "44px",
              height: isMobile ? "36px" : isTablet ? "40px" : "44px",
              fontSize: isMobile ? "14px" : isTablet ? "16px" : "18px",
              background: "#f3e8ff",
              color: "#8b5cf6",
            }}>
              <FaStar />
            </div>
            <div>
              <h3 style={{
                ...styles.statValue,
                fontSize: isMobile ? "18px" : isTablet ? "20px" : "22px",
              }}>{stats.shortlistedApplications || 0}</h3>
              <p style={{
                ...styles.statLabel,
                fontSize: isMobile ? "10px" : isTablet ? "11px" : "12px",
              }}>Shortlisted</p>
              <span style={{
                ...styles.statTrend,
                fontSize: isMobile ? "9px" : isTablet ? "10px" : "10px",
              }}>Ready for interview</span>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters - Toggle on Mobile */}
      {userRole === "admin" && (
        <div style={styles.filterSection}>
          <div style={styles.filterToggle} onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <FaFilter /> Filters
            {isFilterOpen ? <FaChevronUp /> : <FaChevronDown />}
            <span style={styles.filterCount}>
              {Object.values(filters).filter(v => v && v !== "" && v !== "recent").length}
            </span>
          </div>
          
          <AnimatePresence>
            {(isFilterOpen || !isMobile) && (
              <motion.div
                initial={isMobile ? { height: 0, opacity: 0 } : { opacity: 1 }}
                animate={isMobile ? { height: "auto", opacity: 1 } : { opacity: 1 }}
                exit={isMobile ? { height: 0, opacity: 0 } : {}}
                transition={{ duration: 0.3 }}
                style={styles.advancedFilters}
              >
                <div style={isMobile ? styles.mobileFilterRow : styles.filterRow}>
                  <div style={styles.searchWrapper}>
                    <FaSearch style={styles.searchIcon} />
                    <input
                      type="text"
                      placeholder="Search jobs..."
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Jobs Table / Cards */}
      <div style={styles.tableContainer} className="scale-in">
        {!isMobile ? (
          <div style={styles.tableWrapper}>
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
                        {getLocationIcon(job.locationType)}
                        {job.location}
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
                        <button style={styles.editBtn} onClick={() => handleEditJob(job)}>
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
          </div>
        ) : (
          <div style={styles.mobileJobList}>
            {currentItems.map((job) => (
              <MobileJobCard key={job._id} job={job} />
            ))}
            {jobs.length === 0 && (
              <div style={styles.emptyRow}>
                <FaBriefcase size={40} color="#cbd5e1" />
                <p>No jobs found</p>
                <button style={styles.emptyBtn} onClick={() => {
                  resetForm();
                  setShowJobModal(true);
                }}>Post Your First Job</button>
              </div>
            )}
          </div>
        )}

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

      {/* Applications Modal - Responsive */}
      {showApplicationsModal && (
        <div style={styles.modalOverlay} onClick={() => setShowApplicationsModal(false)}>
          <div style={isMobile ? styles.mobileModalLargeContent : styles.modalLargeContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={isMobile ? styles.mobileModalTitle : styles.modalTitle}>Applications for {selectedJob?.title}</h2>
                <p style={styles.modalSubtitle}>{applications.length} candidates applied</p>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowApplicationsModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div style={styles.tableContainer}>
              {!isMobile ? (
                <div style={styles.tableWrapper}>
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
                            <div style={styles.mobileAppActions}>
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
                                <FaEye />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.mobileAppList}>
                  {applications.map((app) => (
                    <div key={app._id} style={styles.mobileAppCard}>
                      <div style={styles.mobileAppHeader}>
                        <div style={styles.applicantCell}>
                          <div style={styles.applicantAvatar}>
                            {app.fullName?.charAt(0) || "A"}
                          </div>
                          <div>
                            <strong>{app.fullName}</strong>
                            <div style={styles.applicantContact}>
                              <FaEnvelope /> {app.email}
                            </div>
                          </div>
                        </div>
                        <span style={{ ...styles.statusBadge, background: getStatusBadgeColor(app.status), fontSize: "10px", padding: "2px 10px" }}>
                          {getStatusLabel(app.status)}
                        </span>
                      </div>
                      <div style={styles.mobileAppDetails}>
                        <span>Experience: {app.yearsOfExperience} years</span>
                        <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </div>
                      <div style={styles.mobileAppActions}>
                        <select
                          style={{ ...styles.statusSelect, flex: 1 }}
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {applications.length === 0 && (
                <div style={styles.emptyRow}>
                  <FaUsers size={40} color="#cbd5e1" />
                  <p>No applications yet for this position.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal - Responsive */}
      {showApplicationDetailModal && selectedApplication && (
        <div style={styles.modalOverlay} onClick={() => setShowApplicationDetailModal(false)}>
          <div style={{ ...styles.modalContent, maxWidth: isMobile ? "95%" : "600px", padding: isMobile ? "16px" : "24px" }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={isMobile ? styles.mobileModalTitle : styles.modalTitle}>Application Details</h2>
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

              <div style={isMobile ? { ...styles.detailGrid, gridTemplateColumns: "1fr" } : styles.detailGrid}>
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

      {/* Create/Edit Job Modal - Responsive */}
      {showJobModal && (
        <div style={styles.modalOverlay} onClick={() => setShowJobModal(false)}>
          <div style={{ ...styles.modalLargeContent, maxWidth: isMobile ? "100%" : "1100px", padding: isMobile ? "16px" : "24px", borderRadius: isMobile ? "12px" : "20px" }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={isMobile ? { ...styles.mobileModalTitle } : styles.modalTitle}>
                  {selectedJob ? <FaEdit style={{ color: '#f9c349', marginRight: '12px' }} /> : <FaPlus style={{ color: '#f9c349', marginRight: '12px' }} />}
                  {selectedJob ? "Edit Job Posting" : "Create New Job"}
                </h2>
                <p style={styles.modalSubtitle}>
                  {selectedJob ? "Update the job details below" : "Fill in the details to attract the best talent"}
                </p>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowJobModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={selectedJob ? handleUpdateJob : handleCreateJob} style={styles.form}>
              {/* Section Navigation - Responsive */}
              <div style={isMobile ? styles.mobileSectionNav : styles.sectionNav}>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    style={{
                      ...(isMobile ? styles.mobileSectionNavBtn : styles.sectionNavBtn),
                      background: activeSection === section.id ? "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)" : "#f8fafc",
                      color: activeSection === section.id ? "#fff" : "#475569",
                    }}
                    onClick={() => setActiveSection(section.id)}
                  >
                    {section.icon}
                    {!isMobile && <span style={styles.sectionNavLabel}>{section.label}</span>}
                  </button>
                ))}
              </div>

              <div style={styles.formBody}>
                {/* Section 1: Basic Information */}
                {activeSection === "basic" && (
                  <div style={styles.formSection} className="slide-down">
                    <div style={styles.formSectionHeader}>
                      <h3 style={styles.formSectionTitle}>
                        <FaBriefcase style={{ color: '#f9c349', marginRight: '10px' }} />
                        Basic Information
                      </h3>
                      <p style={styles.formSectionDesc}>Essential details about the position</p>
                    </div>
                    <div style={isMobile ? styles.mobileFormGrid : styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Job Title *</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.title} 
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                          placeholder="e.g., Senior Software Engineer" 
                          style={styles.formInput}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Department *</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.department} 
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                          placeholder="e.g., Engineering" 
                          style={styles.formInput}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Category</label>
                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={styles.formSelect}>
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
                        <label style={styles.formLabel}>Location *</label>
                        <input 
                          type="text" 
                          required 
                          value={formData.location} 
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                          placeholder="e.g., New York, NY" 
                          style={styles.formInput}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Location Type</label>
                        <select value={formData.locationType} onChange={(e) => setFormData({ ...formData, locationType: e.target.value })} style={styles.formSelect}>
                          <option value="On-site"><FaHome /> On-site</option>
                          <option value="Remote"><FaGlobe /> Remote</option>
                          <option value="Hybrid"><FaRegBuilding /> Hybrid</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Job Type *</label>
                        <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} style={styles.formSelect}>
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                          <option value="Internship">Internship</option>
                          <option value="Temporary">Temporary</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Experience Level</label>
                        <select value={formData.experienceLevel} onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })} style={styles.formSelect}>
                          <option value="Entry Level">Entry Level (0-2 years)</option>
                          <option value="Mid Level">Mid Level (3-5 years)</option>
                          <option value="Senior Level">Senior Level (6-10 years)</option>
                          <option value="Lead">Lead (10+ years)</option>
                          <option value="Manager">Manager</option>
                          <option value="Executive">Executive</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Min Experience (years)</label>
                        <input 
                          type="number" 
                          value={formData.minExperience} 
                          onChange={(e) => setFormData({ ...formData, minExperience: parseInt(e.target.value) || 0 })} 
                          style={styles.formInput}
                          min="0"
                          max="30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 2: Job Details */}
                {activeSection === "details" && (
                  <div style={styles.formSection} className="slide-down">
                    <div style={styles.formSectionHeader}>
                      <h3 style={styles.formSectionTitle}>
                        <FaClipboardList style={{ color: '#f9c349', marginRight: '10px' }} />
                        Job Details
                      </h3>
                      <p style={styles.formSectionDesc}>Compensation, requirements, and responsibilities</p>
                    </div>
                    <div style={isMobile ? styles.mobileFormGrid : styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Salary Range *</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g., 50,000 - 70,000" 
                          value={formData.salary} 
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })} 
                          style={styles.formInput}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Education Level</label>
                        <select value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} style={styles.formSelect}>
                          <option value="High School">High School</option>
                          <option value="Associate Degree">Associate Degree</option>
                          <option value="Bachelor's Degree">Bachelor's Degree</option>
                          <option value="Master's Degree">Master's Degree</option>
                          <option value="PhD">PhD</option>
                          <option value="Not Specified">Not Specified</option>
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Contact Email *</label>
                        <input 
                          type="email" 
                          required 
                          value={formData.email} 
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                          style={styles.formInput}
                          placeholder="hr@company.com"
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Work Schedule</label>
                        <input 
                          type="text" 
                          value={formData.workSchedule} 
                          onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })} 
                          style={styles.formInput}
                          placeholder="e.g., Monday - Friday, 9AM - 5PM"
                        />
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Job Description *</label>
                      <textarea 
                        rows={isMobile ? "4" : "6"} 
                        required 
                        value={formData.description} 
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                        placeholder="Provide a detailed description of the job including responsibilities, team culture, and impact..." 
                        style={styles.formTextarea}
                      />
                    </div>
                  </div>
                )}

                {/* Section 3: Requirements */}
                {activeSection === "requirements" && (
                  <div style={styles.formSection} className="slide-down">
                    <div style={styles.formSectionHeader}>
                      <h3 style={styles.formSectionTitle}>
                        <FaCheckDouble style={{ color: '#f9c349', marginRight: '10px' }} />
                        Requirements & Responsibilities
                      </h3>
                      <p style={styles.formSectionDesc}>Define what candidates need and what they'll do</p>
                    </div>
                    <div style={isMobile ? styles.mobileFormGrid : styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Required Skills</label>
                        <input 
                          type="text" 
                          placeholder="React, Node.js, Python, AWS" 
                          value={safeJoin(formData.skills, ', ')} 
                          onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} 
                          style={styles.formInput}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Key Requirements</label>
                        <textarea 
                          rows={isMobile ? "3" : "4"} 
                          placeholder="• Bachelor's degree in Computer Science&#10;• 5+ years of experience" 
                          value={safeJoin(formData.requirements, '\n')} 
                          onChange={(e) => setFormData({ ...formData, requirements: e.target.value.split('\n').filter(r => r.trim()) })} 
                          style={styles.formTextarea}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Responsibilities</label>
                        <textarea 
                          rows={isMobile ? "3" : "4"} 
                          placeholder="• Lead development of new features&#10;• Mentor junior developers" 
                          value={safeJoin(formData.responsibilities, '\n')} 
                          onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value.split('\n').filter(r => r.trim()) })} 
                          style={styles.formTextarea}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Benefits & Perks */}
                {activeSection === "benefits" && (
                  <div style={styles.formSection} className="slide-down">
                    <div style={styles.formSectionHeader}>
                      <h3 style={styles.formSectionTitle}>
                        <FaAward style={{ color: '#f9c349', marginRight: '10px' }} />
                        Benefits & Perks
                      </h3>
                      <p style={styles.formSectionDesc}>Attract top talent with great benefits</p>
                    </div>
                    <div style={isMobile ? styles.mobileFormGrid : styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Benefits</label>
                        <textarea 
                          rows={isMobile ? "3" : "4"} 
                          placeholder="• Health insurance&#10;• 401(k) matching" 
                          value={safeJoin(formData.benefits, '\n')} 
                          onChange={(e) => setFormData({ ...formData, benefits: e.target.value.split('\n').filter(b => b.trim()) })} 
                          style={styles.formTextarea}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Perks</label>
                        <textarea 
                          rows={isMobile ? "3" : "4"} 
                          placeholder="• Free lunch&#10;• Gym membership" 
                          value={safeJoin(formData.perks, '\n')} 
                          onChange={(e) => setFormData({ ...formData, perks: e.target.value.split('\n').filter(p => p.trim()) })} 
                          style={styles.formTextarea}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 5: Company Info */}
                {activeSection === "company" && (
                  <div style={styles.formSection} className="slide-down">
                    <div style={styles.formSectionHeader}>
                      <h3 style={styles.formSectionTitle}>
                        <FaBuilding style={{ color: '#f9c349', marginRight: '10px' }} />
                        Company Information
                      </h3>
                      <p style={styles.formSectionDesc}>Tell candidates about your company</p>
                    </div>
                    <div style={isMobile ? styles.mobileFormGrid : styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Company Name</label>
                        <input 
                          type="text" 
                          value={formData.companyName} 
                          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} 
                          style={styles.formInput}
                          placeholder="Acme Inc."
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Company Website</label>
                        <input 
                          type="url" 
                          value={formData.companyWebsite} 
                          onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })} 
                          style={styles.formInput}
                          placeholder="https://company.com"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 6: Publish */}
                {activeSection === "publish" && (
                  <div style={styles.formSection} className="slide-down">
                    <div style={styles.formSectionHeader}>
                      <h3 style={styles.formSectionTitle}>
                        <FaRocket style={{ color: '#f9c349', marginRight: '10px' }} />
                        Publish Job
                      </h3>
                      <p style={styles.formSectionDesc}>Review and publish your job posting</p>
                    </div>
                    
                    <div style={styles.publishPreview}>
                      <div style={styles.previewCard}>
                        <div style={styles.previewHeader}>
                          <h4 style={styles.previewTitle}>{formData.title || "Job Title"}</h4>
                          <div style={styles.previewBadges}>
                            {formData.urgent && <span style={styles.urgentBadge}><FaFire /> Urgent</span>}
                            {formData.featured && <span style={styles.featuredBadge}><FaStar /> Featured</span>}
                          </div>
                        </div>
                        <div style={isMobile ? styles.mobilePreviewDetails : styles.previewDetails}>
                          <span><FaBuilding /> {formData.department || "Department"}</span>
                          <span><FaMapMarkerAlt /> {formData.location || "Location"}</span>
                          <span><FaBriefcase /> {formData.type || "Full-time"}</span>
                          <span><FaDollarSign /> {formData.salary || "Salary range"}</span>
                        </div>
                      </div>
                    </div>

                    <div style={styles.publishOptions}>
                      <h4 style={styles.publishOptionsTitle}>Publishing Options</h4>
                      <div style={isMobile ? styles.mobilePublishGrid : styles.publishGrid}>
                        <label style={styles.checkbox}>
                          <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                          <span><FaCheck style={{ color: '#10b981' }} /> Publish Immediately</span>
                        </label>
                        <label style={styles.checkbox}>
                          <input type="checkbox" checked={formData.urgent} onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })} />
                          <span><FaFire style={{ color: '#f59e0b' }} /> Mark as Urgent</span>
                        </label>
                        {userRole === "admin" && (
                          <label style={styles.checkbox}>
                            <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} />
                            <span><FaStar style={{ color: '#f59e0b' }} /> Feature Job</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={isMobile ? styles.mobileFormActions : styles.formActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowJobModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  {selectedJob ? <><FaEdit /> Update</> : <><FaRocket /> {activeSection === "publish" ? "Publish" : "Continue"}</>}
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

          .pulse-btn {
            animation: pulse 2s infinite;
          }

          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #f9c349 0%, #ff961a 100%);
            border-radius: 10px;
          }

          input:focus, select:focus, textarea:focus {
            border-color: #f9c349 !important;
            outline: none !important;
          }

          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .stat-card {
              animation: fadeIn 0.5s ease forwards !important;
            }
            .stat-card:nth-child(1) { animation-delay: 0.05s; }
            .stat-card:nth-child(2) { animation-delay: 0.1s; }
            .stat-card:nth-child(3) { animation-delay: 0.15s; }
            .stat-card:nth-child(4) { animation-delay: 0.2s; }
            
            .filter-toggle {
              display: flex !important;
            }
            .filter-row {
              flex-direction: column !important;
            }
            .search-wrapper {
              width: 100% !important;
              min-width: unset !important;
            }
            .filter-select {
              width: 100% !important;
              min-width: unset !important;
            }
            .reset-btn {
              width: 100% !important;
              justify-content: center !important;
            }
          }

          @media (max-width: 480px) {
            .stat-card {
              padding: 10px !important;
              gap: 8px !important;
            }
            .statValue {
              font-size: 16px !important;
            }
            .statIcon {
              width: 32px !important;
              height: 32px !important;
              font-size: 14px !important;
            }
            .statLabel {
              font-size: 9px !important;
            }
            .header {
              flex-direction: column !important;
              align-items: stretch !important;
            }
            .create-btn {
              width: 100% !important;
              justify-content: center !important;
            }
            .title {
              font-size: 20px !important;
            }
            .subtitle {
              font-size: 13px !important;
            }
            .stats-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 6px !important;
            }
            .mobile-job-details {
              grid-template-columns: 1fr !important;
            }
            .mobile-job-actions {
              flex-direction: column !important;
            }
            .mobile-action-btn {
              width: 100% !important;
            }
            .mobile-app-actions {
              flex-direction: column !important;
            }
            .mobile-app-actions select,
            .mobile-app-actions button {
              width: 100% !important;
            }
            .form-actions {
              flex-direction: column !important;
            }
            .form-actions button {
              width: 100% !important;
              justify-content: center !important;
            }
            .checkbox {
              padding: 8px !important;
              font-size: 12px !important;
            }
            .publish-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    width: "100%",
    padding: "8px 10px",
    margin: "0 auto",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
    boxSizing: "border-box",
    maxWidth: "1400px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "400px",
    gap: "20px",
  },
  loadingSpinner: {
    fontSize: "48px",
    color: "#f9c349",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    color: "#64748b",
    fontSize: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: {
    flex: 1,
    minWidth: "200px",
  },
  headerBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    padding: "4px 16px",
    borderRadius: "20px",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "8px",
  },
  headerBadgeIcon: {
    fontSize: "14px",
  },
  headerBadgeText: {
    letterSpacing: "0.5px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  mobileTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#64748b",
    marginTop: "4px",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  mobileSubtitle: {
    color: "#64748b",
    marginTop: "4px",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  createBtn: {
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 20px rgba(255, 150, 26, 0.3)",
    transition: "all 0.3s ease",
    fontSize: "14px",
    flexShrink: 0,
  },
  mobileCreateBtn: {
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 4px 20px rgba(255, 150, 26, 0.3)",
    transition: "all 0.3s ease",
    fontSize: "13px",
    flexShrink: 0,
    width: "100%",
    justifyContent: "center",
  },
  statsGrid: {
    display: "grid",
    gap: "12px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#fff",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    cursor: "pointer",
  },
  statIcon: {
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statValue: {
    fontWeight: "700",
    margin: 0,
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  statLabel: {
    color: "#64748b",
    margin: "2px 0 0 0",
  },
  statTrend: {
    color: "#10b981",
  },
  filterSection: {
    marginBottom: "20px",
  },
  filterToggle: {
    display: "none",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#0f172a",
    transition: "all 0.3s ease",
  },
  filterCount: {
    background: "#f9c349",
    color: "#fff",
    borderRadius: "50%",
    padding: "2px 8px",
    fontSize: "11px",
    fontWeight: "700",
    marginLeft: "auto",
  },
  advancedFilters: {
    overflow: "hidden",
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  mobileFilterRow: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  },
  searchWrapper: {
    flex: 1,
    minWidth: "180px",
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
  },
  searchInput: {
    width: "100%",
    padding: "10px 14px 10px 36px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    fontSize: "14px",
    background: "#fff",
    transition: "all 0.3s ease",
    outline: "none",
    boxSizing: "border-box",
  },
  filterSelect: {
    padding: "10px 14px",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    background: "#fff",
    fontSize: "14px",
    minWidth: "120px",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.3s ease",
    boxSizing: "border-box",
  },
  resetBtn: {
    padding: "10px 16px",
    background: "#f1f5f9",
    color: "#475569",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    transition: "all 0.3s ease",
  },
  tableContainer: {
    overflow: "hidden",
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
    width: "100%",
  },
  tableWrapper: {
    overflowX: "auto",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "800px",
  },
  tableHeader: {
    borderBottom: "2px solid #e5e7eb",
    background: "#f8fafc",
  },
  th: {
    padding: "14px 16px",
    textAlign: "left",
    fontWeight: "600",
    color: "#475569",
    fontSize: "11px",
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
    gap: "4px",
    flexWrap: "wrap",
  },
  urgentBadge: {
    background: "#fef3c7",
    color: "#d97706",
    padding: "2px 10px",
    borderRadius: "10px",
    fontSize: "9px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  featuredBadge: {
    background: "#f3e8ff",
    color: "#9333ea",
    padding: "2px 10px",
    borderRadius: "10px",
    fontSize: "9px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  typeBadge: {
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "500",
    display: "inline-block",
  },
  locationCell: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
  },
  viewAppsBtn: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    padding: "5px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.3s ease",
  },
  viewsCell: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#64748b",
  },
  statusBtn: {
    padding: "4px 14px",
    borderRadius: "16px",
    border: "none",
    color: "#fff",
    fontSize: "11px",
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
    padding: "4px 12px",
    borderRadius: "16px",
    color: "#fff",
    fontSize: "11px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontWeight: "500",
  },
  statusSelect: {
    padding: "5px 10px",
    borderRadius: "8px",
    border: "2px solid #e5e7eb",
    marginRight: "6px",
    fontSize: "11px",
    background: "#fff",
    cursor: "pointer",
    outline: "none",
    transition: "all 0.3s ease",
  },
  viewDetailsBtn: {
    padding: "5px 12px",
    background: "#8b5cf6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "11px",
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
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    animation: "fadeIn 0.3s ease",
    padding: "16px",
  },
  modalContent: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "scaleIn 0.3s ease",
    boxSizing: "border-box",
  },
  modalLargeContent: {
    background: "#fff",
    borderRadius: "20px",
    padding: "24px",
    maxWidth: "1100px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    animation: "scaleIn 0.3s ease",
    boxSizing: "border-box",
  },
  mobileModalLargeContent: {
    background: "#fff",
    borderRadius: "14px",
    padding: "16px",
    maxWidth: "100%",
    width: "100%",
    maxHeight: "95vh",
    overflowY: "auto",
    animation: "scaleIn 0.3s ease",
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
    gap: "12px",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
  },
  mobileModalTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    display: "flex",
    alignItems: "center",
  },
  modalSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "6px",
    borderRadius: "8px",
    transition: "all 0.3s ease",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  sectionNav: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    padding: "6px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  sectionNavBtn: {
    padding: "8px 16px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
  },
  mobileSectionNav: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    padding: "4px",
    background: "#f8fafc",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },
  mobileSectionNavBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "11px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.3s ease",
    flex: "1 1 auto",
    minWidth: "40px",
    justifyContent: "center",
  },
  sectionNavLabel: {
    display: "inline",
  },
  formBody: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formSection: {
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid #e5e7eb",
  },
  formSectionHeader: {
    marginBottom: "16px",
  },
  formSectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "2px",
    display: "flex",
    alignItems: "center",
  },
  formSectionDesc: {
    fontSize: "13px",
    color: "#64748b",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  mobileFormGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "14px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  formLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  formInput: {
    padding: "8px 12px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    transition: "all 0.3s ease",
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },
  formSelect: {
    padding: "8px 12px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    transition: "all 0.3s ease",
    outline: "none",
    background: "#fff",
    cursor: "pointer",
    width: "100%",
    boxSizing: "border-box",
  },
  formTextarea: {
    padding: "8px 12px",
    border: "2px solid #e5e7eb",
    borderRadius: "8px",
    fontSize: "13px",
    transition: "all 0.3s ease",
    outline: "none",
    background: "#fff",
    resize: "vertical",
    fontFamily: "'Inter', sans-serif",
    width: "100%",
    boxSizing: "border-box",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    paddingTop: "16px",
    borderTop: "2px solid #e5e7eb",
    flexWrap: "wrap",
  },
  mobileFormActions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingTop: "16px",
    borderTop: "2px solid #e5e7eb",
  },
  cancelBtn: {
    padding: "10px 24px",
    background: "#f1f5f9",
    border: "2px solid #e5e7eb",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
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
    fontSize: "13px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(255, 150, 26, 0.3)",
  },
  emptyRow: {
    textAlign: "center",
    padding: "40px 16px",
    color: "#94a3b8",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
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
    gap: "12px",
    padding: "14px",
    borderTop: "1px solid #e5e7eb",
  },
  pageBtn: {
    padding: "6px 14px",
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
    fontSize: "13px",
    color: "#475569",
    fontWeight: "500",
  },
  applicantCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  applicantAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    color: "#fff",
    flexShrink: 0,
  },
  applicantContact: {
    fontSize: "11px",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  detailSection: {
    padding: "4px 0",
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
  },
  detailAvatar: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #f9c349 0%, #ff961a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "24px",
    color: "#fff",
    flexShrink: 0,
  },
  detailName: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "16px",
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    color: "#475569",
    padding: "6px 10px",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  detailSubtitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
    marginTop: "14px",
    marginBottom: "6px",
  },
  coverLetter: {
    background: "#f8fafc",
    padding: "14px",
    borderRadius: "8px",
    lineHeight: "1.6",
    fontSize: "13px",
    color: "#334155",
    marginBottom: "14px",
  },
  detailLinks: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  detailLink: {
    padding: "6px 14px",
    background: "#f1f5f9",
    borderRadius: "8px",
    textDecoration: "none",
    color: "#475569",
    fontSize: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.3s ease",
  },
  publishPreview: {
    marginBottom: "20px",
  },
  previewCard: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "10px",
    border: "2px solid #e5e7eb",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
    flexWrap: "wrap",
    gap: "6px",
  },
  previewTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#0f172a",
    margin: 0,
  },
  previewBadges: {
    display: "flex",
    gap: "6px",
  },
  previewDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "10px",
    padding: "10px 0",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "13px",
  },
  mobilePreviewDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    padding: "10px 0",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
    fontSize: "12px",
  },
  publishOptions: {
    background: "#f8fafc",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },
  publishOptionsTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: "12px",
  },
  publishGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
  },
  mobilePublishGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
  },
  checkbox: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    cursor: "pointer",
    padding: "10px",
    background: "#fff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    fontSize: "13px",
  },
  // Mobile specific styles
  mobileJobList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "12px",
    width: "100%",
  },
  mobileJobCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    width: "100%",
  },
  mobileJobHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  mobileJobTitle: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  mobileBadgeContainer: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
  },
  mobileJobDetails: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "6px",
    marginBottom: "12px",
    padding: "8px 0",
    borderTop: "1px solid #f1f5f9",
    borderBottom: "1px solid #f1f5f9",
  },
  mobileJobDetail: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    color: "#475569",
  },
  mobileJobActions: {
    display: "flex",
    gap: "6px",
  },
  mobileActionBtn: {
    flex: 1,
    padding: "6px 10px",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "11px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    transition: "all 0.3s ease",
  },
  mobileAppList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "12px",
    width: "100%",
  },
  mobileAppCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "12px",
    width: "100%",
  },
  mobileAppHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  mobileAppDetails: {
    display: "flex",
    gap: "12px",
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  mobileAppActions: {
    display: "flex",
    gap: "6px",
  },
};

export default AdminJobsManager;