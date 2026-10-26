// src/screens/AdminJobsManager.js
// Career portal (design/portal/AdCareer): jobs and internships in the career hub.
// Also the employer portal's jobs (design/portal/EmpJobs) at /employee-jobs: same calls, its own header,
// all/active/inactive filter and table. Anything not marked as employer-only renders exactly as for admin.
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Ico from "../portal/Ico";
import { PageHeader, PageLoading, Button, IconButton, Field, Input, Textarea, Select, Checkbox, SearchInput, Segmented, StatCard, Tabs, Modal, EmptyState, Pill, Card, Facts, FileUpload, toast, confirmDialog } from "../portal/kit";
import "./styles/AdminJobsManager.css";

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // employer view only: status filter and search over the employer's own jobs
  const [empStatus, setEmpStatus] = useState("all");
  const [empSearch, setEmpSearch] = useState("");
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
  const API_URL = process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api/jobs`
    : "https://the-deft-crew-production.up.railway.app/api/jobs";
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // CSV/XLSX Upload State
  const [openCsvDialog, setOpenCsvDialog] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState("");
  const csvFileInputRef = useRef(null);

  const handleOpenCsvDialog = () => {
    setCsvFile(null);
    setCsvResult(null);
    setCsvError("");
    setOpenCsvDialog(true);
  };

  const handleCloseCsvDialog = () => {
    if (!csvUploading) {
      setOpenCsvDialog(false);
      setCsvFile(null);
      setCsvResult(null);
      setCsvError("");
    }
  };

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.csv' && ext !== '.xlsx' && ext !== '.xls') {
      setCsvError("Invalid file type. Only .csv and .xlsx files are allowed.");
      setCsvFile(null);
      return;
    }

    setCsvError("");
    setCsvResult(null);
    setCsvFile(file);
  };

  const handleUploadCsvSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setCsvError("Please select a .csv or .xlsx file.");
      return;
    }

    setCsvUploading(true);
    setCsvError("");
    setCsvResult(null);

    const targetUrl = `${API_URL}/admin/import-csv`;
    console.log("Submitting CSV import to URL:", targetUrl);

    try {
      const uploadData = new FormData();
      uploadData.append("file", csvFile);

      const res = await axios.post(targetUrl, uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data && res.data.success) {
        const { created, updated, skipped } = res.data;
        setCsvResult({ created, updated, skipped });
        fetchJobs();
        fetchStats();
      } else {
        setCsvError(res.data?.message || "Upload failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Error uploading jobs file.";
      setCsvError(msg);
    } finally {
      setCsvUploading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
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
      toast("Job created successfully!");
      setShowJobModal(false);
      resetForm();
      fetchJobs();
      fetchStats();
    } catch (err) {
      toast(err.response?.data?.error || "Failed to create job");
    }
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_URL}/update/${selectedJob._id}`, formData, config);
      toast("Job updated successfully!");
      setShowJobModal(false);
      resetForm();
      fetchJobs();
    } catch (err) {
      toast(err.response?.data?.error || "Failed to update job");
    }
  };

  const handleToggleStatus = async (jobId) => {
    try {
      await axios.patch(`${API_URL}/toggle/${jobId}`, {}, config);
      fetchJobs();
    } catch (err) {
      toast("Failed to toggle job status");
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (await confirmDialog("Are you sure you want to delete this job? This will also delete all applications.")) {
      try {
        await axios.delete(`${API_URL}/delete/${jobId}`, config);
        fetchJobs();
        fetchStats();
      } catch (err) {
        toast("Failed to delete job");
      }
    }
  };

  const handleUpdateApplicationStatus = async (appId, status, interviewDate = null, interviewNotes = "") => {
    try {
      await axios.patch(`${API_URL}/application/${appId}/status`,
        { status, interviewDate, interviewNotes },
        config
      );
      toast(`Application status updated to ${status}`);
      fetchJobApplications(selectedJob._id);
    } catch (err) {
      toast("Failed to update application status");
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

  const STATUS_TONE = { pending: "ink", reviewed: "blue", shortlisted: "green", interview: "purple", rejected: "red", hired: "green" };
  const STATUS_ICON = { pending: "clock", reviewed: "eye", shortlisted: "star", interview: "users", rejected: "xCircle", hired: "checkCircle" };
  const LOCATION_ICON = { Remote: "globe", Hybrid: "store", "On-site": "home" };

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

  const statusPill = (status) => (
    <Pill tone={STATUS_TONE[status] || "sand"}><Ico kind={STATUS_ICON[status] || "briefcase"} tone="plain" size={12} />{getStatusLabel(status)}</Pill>
  );

  const sections = [
    { id: "basic", label: "Basic Info", icon: "briefcase" },
    { id: "details", label: "Job Details", icon: "file" },
    { id: "requirements", label: "Requirements", icon: "checkCircle" },
    { id: "benefits", label: "Benefits & Perks", icon: "award" },
    { id: "company", label: "Company Info", icon: "store" },
    { id: "publish", label: "Publish", icon: "send" },
  ];

  const isAdmin = userRole === "admin";
  const empTerm = empSearch.toLowerCase().trim();
  const empJobs = jobs.filter((j) =>
    (empStatus === "all" || (empStatus === "active" ? j.active : !j.active)) &&
    (!empTerm || j.title?.toLowerCase().includes(empTerm) || j.department?.toLowerCase().includes(empTerm))
  );
  const listJobs = isAdmin ? jobs : empJobs;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = listJobs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(listJobs.length / itemsPerPage);

  // employer view: the form walks section by section; only the last step publishes
  const sectionIndex = sections.findIndex((s) => s.id === activeSection);
  const goNextSection = () => {
    const form = document.getElementById("job-form");
    if (form && !form.reportValidity()) return;
    setActiveSection(sections[Math.min(sectionIndex + 1, sections.length - 1)].id);
  };
  const stepFooter = (
    <>
      <span className="jm-step">step {sectionIndex + 1} of {sections.length}</span>
      {sectionIndex > 0 && <Button variant="secondary" icon="chevronLeft" onClick={() => setActiveSection(sections[sectionIndex - 1].id)}>back</Button>}
      {activeSection === "publish"
        ? <Button type="submit" form="job-form" icon="send">publish</Button>
        : <Button iconRight="chevronRight" onClick={goNextSection}>continue</Button>}
    </>
  );

  const openNewJob = () => {
    resetForm();
    setShowJobModal(true);
  };
  const jobBadges = (job) => (
    <>
      {job.urgent && <Pill tone="red"><Ico kind="flame" tone="plain" size={11} />Urgent</Pill>}
      {job.featured && <Pill tone="yellow"><Ico kind="star" tone="plain" size={11} />Featured</Pill>}
    </>
  );
  const sectionHead = (icon, title, desc) => (
    <div className="jm-sec-head">
      <Ico kind={icon} tone="yellow" size={36} />
      <div><h3>{title}</h3><p className="k-hint" style={{ margin: 0 }}>{desc}</p></div>
    </div>
  );
  const set = (patch) => setFormData({ ...formData, ...patch });

  if (loading) return <div className="tdcp k-page"><PageLoading label="Loading your dashboard..." /></div>;

  return (
    <div className="tdcp k-page jm" data-screen="career">
      {isAdmin ? (
      <PageHeader
        title={userRole === "admin" ? "career portal" : "My Job Postings"}
        sub={userRole === "admin"
          ? "all jobs and internships students see in the career hub."
          : `Welcome back, ${userName}! Manage your job postings`}
        actions={<>
          <Button variant="secondary" icon="upload" onClick={handleOpenCsvDialog}>{isMobile ? "CSV" : "Upload Jobs CSV"}</Button>
          <Button icon="plus" onClick={openNewJob}>{isMobile ? "New" : "Post New Job"}</Button>
        </>}
      />
      ) : (
        <div className="k-head">
          <div className="emp-title">
            <Ico kind="briefcase" tone="coral" size={56} />
            <div>
              <h1>jobs<span className="dot" aria-hidden="true">.</span></h1>
              <p>your postings in the tdc career hub.</p>
            </div>
          </div>
          <div className="k-actions">
            <Button variant="secondary" icon="upload" onClick={handleOpenCsvDialog}>{isMobile ? "CSV" : "Upload Jobs CSV"}</Button>
            <Button icon="plus" onClick={openNewJob}>post a job</Button>
          </div>
        </div>
      )}

      {stats && (
        <div className="k-stats">
          <StatCard label="Total Jobs" value={stats.totalJobs} sub={`+${stats.activeJobs} active`} icon="briefcase" tone="blue" />
          <StatCard label="Active Jobs" value={stats.activeJobs} sub="Open positions" icon="checkCircle" tone="green" />
          <StatCard label="Applications" value={stats.totalApplications} sub={`${stats.pendingApplications} pending`} icon="users" tone="yellow" />
          <StatCard label="Shortlisted" value={stats.shortlistedApplications || 0} sub="Ready for interview" icon="star" tone="purple" />
        </div>
      )}

      {userRole === "admin" && (
        <>
          {isMobile && (
            <Button variant="secondary" icon="filter" aria-expanded={isFilterOpen} onClick={() => setIsFilterOpen(!isFilterOpen)} style={{ alignSelf: "flex-start" }}>
              Filters <Pill tone="sand">{Object.values(filters).filter(v => v && v !== "" && v !== "recent").length}</Pill>
            </Button>
          )}
          {(isFilterOpen || !isMobile) && (
            <div className="k-toolbar">
              <SearchInput
                className="k-grow"
                placeholder="Search jobs..."
                aria-label="search jobs"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Select aria-label="status" style={{ width: "auto" }} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Select aria-label="type" style={{ width: "auto" }} value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </Select>
              <Select aria-label="category" style={{ width: "auto" }} value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All Categories</option>
                <option value="Technology">Technology</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="Design">Design</option>
              </Select>
              <Button variant="ghost" icon="close" onClick={() => setFilters({ status: "", department: "", category: "", type: "", locationType: "", experienceLevel: "", search: "", sort: "recent" })}>Reset</Button>
            </div>
          )}
        </>
      )}

      {!isAdmin && (
        <div className="k-toolbar">
          <SearchInput
            className="k-grow"
            placeholder="search by title or department"
            aria-label="search jobs"
            value={empSearch}
            onChange={(e) => { setEmpSearch(e.target.value); setCurrentPage(1); }}
          />
          <Segmented
            label="filter by status"
            value={empStatus}
            onChange={(v) => { setEmpStatus(v); setCurrentPage(1); }}
            options={[{ value: "all", label: "all" }, { value: "active", label: "active" }, { value: "inactive", label: "inactive" }]}
          />
        </div>
      )}

      {isAdmin ? (
      <div className="k-table-card">
        <div className="k-table-scroll">
          <table className="k-table" style={{ minWidth: 960 }}>
            <thead>
              <tr><th>job title</th><th>department</th><th>location</th><th>type</th><th>applications</th><th>views</th><th>status</th><th>actions</th></tr>
            </thead>
            {currentItems.length > 0 && (
              <tbody>
                {currentItems.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <b>{job.title}</b>
                      {(job.urgent || job.featured) && <div className="k-row" style={{ gap: 4, marginTop: 4 }}>{jobBadges(job)}</div>}
                    </td>
                    <td>{job.department}</td>
                    <td><span className="k-row" style={{ gap: 6 }}><Ico kind={LOCATION_ICON[job.locationType] || "pin"} tone="plain" size={13} />{job.location}</span></td>
                    <td><Pill tone={job.type === "Full-time" ? "blue" : "purple"}>{job.type}</Pill></td>
                    <td><Button size="sm" variant="secondary" icon="users" onClick={() => fetchJobApplications(job._id)}>{job.totalApplications || 0}</Button></td>
                    <td><span className="k-row k-muted" style={{ gap: 6 }}><Ico kind="eye" tone="plain" size={13} />{job.views || 0}</span></td>
                    <td>
                      <button type="button" className={`jm-status${job.active ? " on" : ""}`} onClick={() => handleToggleStatus(job._id)}>
                        {job.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td>
                      <span className="k-row" style={{ gap: 6, flexWrap: "nowrap" }}>
                        <IconButton icon="edit" label="Edit job" size="sm" onClick={() => handleEditJob(job)} />
                        <IconButton icon="trash" label="Delete job" variant="danger" size="sm" onClick={() => handleDeleteJob(job._id)} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {jobs.length === 0 && (
          <EmptyState icon="briefcase" title="No jobs found" action={<Button icon="plus" onClick={openNewJob}>Post Your First Job</Button>} />
        )}
        {jobs.length > itemsPerPage && (
          <div className="k-pager">
            <span>{currentPage} / {totalPages}</span>
            <div className="k-pager-btns">
              <button type="button" className="k-page-btn" aria-label="Previous Page" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><Ico kind="chevronLeft" tone="plain" size={15} /></button>
              <button type="button" className="k-page-btn" aria-label="Next Page" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><Ico kind="chevronRight" tone="plain" size={15} /></button>
            </div>
          </div>
        )}
      </div>
      ) : (
      <div className="k-table-card">
        <div className="k-table-scroll">
          <table className="k-table" style={{ minWidth: 760 }}>
            <thead>
              <tr><th>role</th><th>department</th><th>type</th><th>applications</th><th>status</th><th style={{ textAlign: "right" }}>actions</th></tr>
            </thead>
            {currentItems.length > 0 && (
              <tbody>
                {currentItems.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <b>{job.title}</b>
                      <div className="k-hint">{[job.createdAt && `posted ${new Date(job.createdAt).toLocaleDateString()}`, job.experienceLevel].filter(Boolean).join(" · ")}</div>
                      {(job.urgent || job.featured) && <div className="k-row" style={{ gap: 4, marginTop: 4 }}>{jobBadges(job)}</div>}
                    </td>
                    <td>{job.department}</td>
                    <td>{job.type}</td>
                    <td><b>{job.totalApplications || 0}</b></td>
                    <td>
                      <button type="button" className={`jm-status emp${job.active ? " on" : ""}`} onClick={() => handleToggleStatus(job._id)} title={job.active ? "Deactivate" : "Activate"}>
                        {job.active ? "active" : "inactive"}
                      </button>
                    </td>
                    <td>
                      <span className="k-row" style={{ gap: 6, flexWrap: "nowrap", justifyContent: "flex-end" }}>
                        <Button size="sm" variant="secondary" onClick={() => handleEditJob(job)}>edit</Button>
                        <Button size="sm" onClick={() => fetchJobApplications(job._id)}>applicants</Button>
                        <IconButton icon="trash" label="Delete job" variant="danger" size="sm" onClick={() => handleDeleteJob(job._id)} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {listJobs.length === 0 && (
          jobs.length === 0
            ? <EmptyState icon="briefcase" tone="coral" title="No jobs found" action={<Button icon="plus" onClick={openNewJob}>Post Your First Job</Button>} />
            : <EmptyState icon="search" title="no jobs match" text="try another filter or search." />
        )}
        {listJobs.length > itemsPerPage && (
          <div className="k-pager">
            <span>{currentPage} / {totalPages}</span>
            <div className="k-pager-btns">
              <button type="button" className="k-page-btn" aria-label="Previous Page" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><Ico kind="chevronLeft" tone="plain" size={15} /></button>
              <button type="button" className="k-page-btn" aria-label="Next Page" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><Ico kind="chevronRight" tone="plain" size={15} /></button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* applications for a job */}
      <Modal
        open={showApplicationsModal}
        onClose={() => setShowApplicationsModal(false)}
        size="xl"
        icon="users"
        tone="blue"
        title={`Applications for ${selectedJob?.title || ""}`}
        sub={`${applications.length} candidates applied`}
      >
        {applications.length === 0 ? (
          <EmptyState icon="users" title="No applications yet for this position." />
        ) : (
          <div className="k-table-card">
            <div className="k-table-scroll">
              <table className="k-table" style={{ minWidth: 760 }}>
                <thead><tr><th>applicant</th><th>experience</th><th>applied date</th><th>status</th><th>actions</th></tr></thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <div className="k-row" style={{ flexWrap: "nowrap" }}>
                          <span className="jm-avatar">{app.fullName?.charAt(0) || "A"}</span>
                          <div style={{ minWidth: 0 }}>
                            <b>{app.fullName}</b>
                            <div className="k-hint k-row" style={{ gap: 4 }}><Ico kind="mail" tone="plain" size={12} />{app.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{app.yearsOfExperience} years</td>
                      <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                      <td>{statusPill(app.status)}</td>
                      <td>
                        <span className="k-row" style={{ gap: 6, flexWrap: "nowrap" }}>
                          <Select size="sm" aria-label="application status" style={{ width: "auto" }} value={app.status} onChange={(e) => handleUpdateApplicationStatus(app._id, e.target.value)}>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
                          </Select>
                          <IconButton icon="eye" label="View application" size="sm" onClick={() => viewApplicationDetail(app)} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* one application */}
      <Modal
        open={showApplicationDetailModal && !!selectedApplication}
        onClose={() => setShowApplicationDetailModal(false)}
        icon="user"
        tone="purple"
        title="Application Details"
      >
        {selectedApplication && (
          <>
            <div className="k-row" style={{ flexWrap: "nowrap" }}>
              <span className="jm-avatar lg">{selectedApplication.fullName?.charAt(0) || "A"}</span>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 18 }}>{selectedApplication.fullName}</h3>
                {statusPill(selectedApplication.status)}
              </div>
            </div>
            <div className="k-card" style={{ padding: "6px 18px" }}>
              <Facts rows={[
                ["Email", selectedApplication.email],
                ["Phone", selectedApplication.phone],
                ["Current position", selectedApplication.currentPosition || "N/A"],
                ["Current company", selectedApplication.currentCompany || "N/A"],
                ["Education", selectedApplication.education || "N/A"],
                ["Expected salary", selectedApplication.expectedSalary || "N/A"],
              ]} />
            </div>
            {selectedApplication.coverLetter && (
              <Card title="Cover Letter" icon="file" tone="sand">
                <div className="jm-letter">{selectedApplication.coverLetter}</div>
              </Card>
            )}
            <div className="k-row">
              {selectedApplication.portfolioUrl && (
                <a className="k-btn secondary sm" href={selectedApplication.portfolioUrl} target="_blank" rel="noopener noreferrer"><Ico kind="globe" tone="plain" size={16} /> Portfolio</a>
              )}
              {selectedApplication.linkedInUrl && (
                <a className="k-btn secondary sm" href={selectedApplication.linkedInUrl} target="_blank" rel="noopener noreferrer"><Ico kind="link" tone="plain" size={16} /> LinkedIn</a>
              )}
              {selectedApplication.githubUrl && (
                <a className="k-btn secondary sm" href={selectedApplication.githubUrl} target="_blank" rel="noopener noreferrer"><Ico kind="link" tone="plain" size={16} /> GitHub</a>
              )}
              {selectedApplication.resumeUrl && (
                <a className="k-btn secondary sm" href={selectedApplication.resumeUrl} target="_blank" rel="noopener noreferrer"><Ico kind="file" tone="plain" size={16} /> Resume</a>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* create / edit job */}
      <Modal
        open={showJobModal}
        onClose={() => setShowJobModal(false)}
        size="xl"
        icon={selectedJob ? "edit" : "plus"}
        tone="yellow"
        title={selectedJob ? "Edit Job Posting" : "Create New Job"}
        sub={selectedJob ? "Update the job details below" : "Fill in the details to attract the best talent"}
        bodyStyle={isAdmin ? undefined : { minHeight: "min(540px, 60vh)" }}
        footer={isAdmin || selectedJob ? <>
          <Button variant="secondary" onClick={() => setShowJobModal(false)}>Cancel</Button>
          <Button type="submit" form="job-form" icon={selectedJob ? "edit" : "send"}>
            {selectedJob ? "Update" : activeSection === "publish" ? "Publish" : "Continue"}
          </Button>
        </> : stepFooter}
      >
        <Tabs label="job form sections" value={activeSection} onChange={setActiveSection} tabs={sections.map((s) => ({ id: s.id, label: isMobile && isAdmin ? "" : s.label, icon: s.icon }))} />
        <form id="job-form" onSubmit={selectedJob ? handleUpdateJob : handleCreateJob} className="jm-form">
          {activeSection === "basic" && (
            <>
              {sectionHead("briefcase", "Basic Information", "Essential details about the position")}
              <div className="jm-grid">
                <Field label="Job Title *" htmlFor="jm-title"><Input id="jm-title" type="text" required value={formData.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g., Senior Software Engineer" /></Field>
                <Field label="Department *" htmlFor="jm-dept"><Input id="jm-dept" type="text" required value={formData.department} onChange={(e) => set({ department: e.target.value })} placeholder="e.g., Engineering" /></Field>
                <Field label="Category" htmlFor="jm-cat">
                  <Select id="jm-cat" value={formData.category} onChange={(e) => set({ category: e.target.value })}>
                    <option value="Technology">Technology</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="Design">Design</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>
                <Field label="Location *" htmlFor="jm-loc"><Input id="jm-loc" type="text" required value={formData.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g., New York, NY" /></Field>
                <Field label="Location Type" htmlFor="jm-loctype">
                  <Select id="jm-loctype" value={formData.locationType} onChange={(e) => set({ locationType: e.target.value })}>
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </Select>
                </Field>
                <Field label="Job Type *" htmlFor="jm-type">
                  <Select id="jm-type" value={formData.type} onChange={(e) => set({ type: e.target.value })}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Temporary">Temporary</option>
                  </Select>
                </Field>
                <Field label="Experience Level" htmlFor="jm-level">
                  <Select id="jm-level" value={formData.experienceLevel} onChange={(e) => set({ experienceLevel: e.target.value })}>
                    <option value="Entry Level">Entry Level (0-2 years)</option>
                    <option value="Mid Level">Mid Level (3-5 years)</option>
                    <option value="Senior Level">Senior Level (6-10 years)</option>
                    <option value="Lead">Lead (10+ years)</option>
                    <option value="Manager">Manager</option>
                    <option value="Executive">Executive</option>
                  </Select>
                </Field>
                <Field label="Min Experience (years)" htmlFor="jm-minexp">
                  <Input id="jm-minexp" type="number" value={formData.minExperience} onChange={(e) => set({ minExperience: parseInt(e.target.value) || 0 })} min="0" max="30" />
                </Field>
              </div>
            </>
          )}

          {activeSection === "details" && (
            <>
              {sectionHead("file", "Job Details", "Compensation, requirements, and responsibilities")}
              <div className="jm-grid">
                <Field label="Salary Range *" htmlFor="jm-salary"><Input id="jm-salary" type="text" required placeholder="e.g., 50,000 - 70,000" value={formData.salary} onChange={(e) => set({ salary: e.target.value })} /></Field>
                <Field label="Education Level" htmlFor="jm-edu">
                  <Select id="jm-edu" value={formData.education} onChange={(e) => set({ education: e.target.value })}>
                    <option value="High School">High School</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="PhD">PhD</option>
                    <option value="Not Specified">Not Specified</option>
                  </Select>
                </Field>
                <Field label="Contact Email *" htmlFor="jm-email"><Input id="jm-email" type="email" required value={formData.email} onChange={(e) => set({ email: e.target.value })} placeholder="hr@company.com" /></Field>
                <Field label="Work Schedule" htmlFor="jm-sched"><Input id="jm-sched" type="text" value={formData.workSchedule} onChange={(e) => set({ workSchedule: e.target.value })} placeholder="e.g., Monday - Friday, 9AM - 5PM" /></Field>
              </div>
              <Field label="Job Description *" htmlFor="jm-desc">
                <Textarea id="jm-desc" rows={isMobile ? "4" : "6"} required value={formData.description} onChange={(e) => set({ description: e.target.value })} placeholder="Provide a detailed description of the job including responsibilities, team culture, and impact..." />
              </Field>
            </>
          )}

          {activeSection === "requirements" && (
            <>
              {sectionHead("checkCircle", "Requirements & Responsibilities", "Define what candidates need and what they'll do")}
              <div className="jm-grid">
                <Field label="Required Skills" htmlFor="jm-skills">
                  <Input id="jm-skills" type="text" placeholder="React, Node.js, Python, AWS" value={safeJoin(formData.skills, ', ')} onChange={(e) => set({ skills: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} />
                </Field>
                <Field label="Key Requirements" htmlFor="jm-reqs">
                  <Textarea id="jm-reqs" rows={isMobile ? "3" : "4"} placeholder={"• Bachelor's degree in Computer Science\n• 5+ years of experience"} value={safeJoin(formData.requirements, '\n')} onChange={(e) => set({ requirements: e.target.value.split('\n').filter(r => r.trim()) })} />
                </Field>
                <Field label="Responsibilities" htmlFor="jm-resp">
                  <Textarea id="jm-resp" rows={isMobile ? "3" : "4"} placeholder={"• Lead development of new features\n• Mentor junior developers"} value={safeJoin(formData.responsibilities, '\n')} onChange={(e) => set({ responsibilities: e.target.value.split('\n').filter(r => r.trim()) })} />
                </Field>
              </div>
            </>
          )}

          {activeSection === "benefits" && (
            <>
              {sectionHead("award", "Benefits & Perks", "Attract top talent with great benefits")}
              <div className="jm-grid">
                <Field label="Benefits" htmlFor="jm-benefits">
                  <Textarea id="jm-benefits" rows={isMobile ? "3" : "4"} placeholder={"• Health insurance\n• 401(k) matching"} value={safeJoin(formData.benefits, '\n')} onChange={(e) => set({ benefits: e.target.value.split('\n').filter(b => b.trim()) })} />
                </Field>
                <Field label="Perks" htmlFor="jm-perks">
                  <Textarea id="jm-perks" rows={isMobile ? "3" : "4"} placeholder={"• Free lunch\n• Gym membership"} value={safeJoin(formData.perks, '\n')} onChange={(e) => set({ perks: e.target.value.split('\n').filter(p => p.trim()) })} />
                </Field>
              </div>
            </>
          )}

          {activeSection === "company" && (
            <>
              {sectionHead("store", "Company Information", "Tell candidates about your company")}
              <div className="jm-grid">
                <Field label="Company Name" htmlFor="jm-company"><Input id="jm-company" type="text" value={formData.companyName} onChange={(e) => set({ companyName: e.target.value })} placeholder="Acme Inc." /></Field>
                <Field label="Company Website" htmlFor="jm-site"><Input id="jm-site" type="url" value={formData.companyWebsite} onChange={(e) => set({ companyWebsite: e.target.value })} placeholder="https://company.com" /></Field>
              </div>
            </>
          )}

          {activeSection === "publish" && (
            <>
              {sectionHead("send", "Publish Job", "Review and publish your job posting")}
              <div className="k-card pad">
                <div className="k-row" style={{ justifyContent: "space-between" }}>
                  <h4 style={{ margin: 0, fontSize: 17 }}>{formData.title || "Job Title"}</h4>
                  <span className="k-row" style={{ gap: 4 }}>{jobBadges(formData)}</span>
                </div>
                <div className="k-row k-muted" style={{ marginTop: 10, gap: 16, fontSize: 14 }}>
                  <span className="k-row" style={{ gap: 6 }}><Ico kind="store" tone="plain" size={14} />{formData.department || "Department"}</span>
                  <span className="k-row" style={{ gap: 6 }}><Ico kind="pin" tone="plain" size={14} />{formData.location || "Location"}</span>
                  <span className="k-row" style={{ gap: 6 }}><Ico kind="briefcase" tone="plain" size={14} />{formData.type || "Full-time"}</span>
                  <span className="k-row" style={{ gap: 6 }}><Ico kind="wallet" tone="plain" size={14} />{formData.salary || "Salary range"}</span>
                </div>
              </div>
              <div>
                <h4 style={{ margin: "4px 0 8px", fontSize: 15 }}>Publishing Options</h4>
                <div className="jm-grid">
                  <Checkbox checked={formData.active} onChange={(e) => set({ active: e.target.checked })} label="Publish Immediately" />
                  <Checkbox checked={formData.urgent} onChange={(e) => set({ urgent: e.target.checked })} label="Mark as Urgent" />
                  {userRole === "admin" && (
                    <Checkbox checked={formData.featured} onChange={(e) => set({ featured: e.target.checked })} label="Feature Job" />
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* CSV / XLSX upload */}
      <Modal
        open={openCsvDialog}
        onClose={handleCloseCsvDialog}
        icon="upload"
        tone="green"
        title="Upload Jobs CSV / XLSX"
        footer={<>
          <Button variant="secondary" onClick={handleCloseCsvDialog} disabled={csvUploading}>Cancel</Button>
          <Button type="submit" form="jobs-csv-form" disabled={!csvFile || csvUploading} loading={csvUploading}>{csvUploading ? "Uploading..." : "Upload & Import"}</Button>
        </>}
      >
        <form id="jobs-csv-form" onSubmit={handleUploadCsvSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <FileUpload
            accept=".csv, .xlsx, .xls"
            onChange={handleCsvFileChange}
            inputRef={csvFileInputRef}
            file={csvFile}
            label="Click to select or drop .csv / .xlsx file"
            hint="Expected columns: Company, Job Title, Department, Job Type, Target Audience, Application Link, Location"
          />
          {csvUploading && <PageLoading label="Processing & importing jobs..." minHeight={110} />}
          {csvResult && (
            <div className="k-note ok">
              <b>Upload successful: {csvResult.created} jobs created, {csvResult.updated} updated</b>
              {csvResult.skipped > 0 && <div>{csvResult.skipped} duplicates skipped</div>}
            </div>
          )}
          {csvError && <div className="k-note bad">{csvError}</div>}
        </form>
      </Modal>
    </div>
  );
};

export default AdminJobsManager;
