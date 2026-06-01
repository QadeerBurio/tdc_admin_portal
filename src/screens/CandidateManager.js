import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSearch, FaEnvelope, FaPhone, FaDownload, FaEye, FaStar, FaFilter } from "react-icons/fa";

const CandidatesManager = ({ token }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/jobs/candidates/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCandidates(res.data);
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/jobs/application/${id}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCandidates();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedCandidates.length === 0) {
      alert("Please select candidates first");
      return;
    }
    try {
      await axios.patch("http://localhost:5000/api/jobs/candidates/bulk-status", 
        { candidateIds: selectedCandidates, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${selectedCandidates.length} candidates updated to ${status}`);
      setSelectedCandidates([]);
      setShowBulkActions(false);
      fetchCandidates();
    } catch (err) {
      console.error("Error bulk updating:", err);
      alert("Failed to update candidates");
    }
  };

  const exportCandidates = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/jobs/candidates/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const csvData = convertToCSV(res.data);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates_${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting:", err);
      alert("Failed to export candidates");
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const viewCandidateDetails = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/jobs/candidates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCandidate(res.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Error fetching candidate details:", err);
      alert("Failed to load candidate details");
    }
  };

  const toggleSelectCandidate = (id) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  const filteredCandidates = candidates.filter(c => 
    c.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.jobId?.title?.toLowerCase().includes(search.toLowerCase())
  ).filter(c => statusFilter ? c.status === statusFilter : true);

  const getStatusBadge = (status) => {
    const colors = {
      pending: { bg: "#fef3c7", color: "#d97706" },
      reviewed: { bg: "#dbeafe", color: "#2563eb" },
      shortlisted: { bg: "#d1fae5", color: "#059669" },
      interview: { bg: "#ede9fe", color: "#7c3aed" },
      rejected: { bg: "#fee2e2", color: "#dc2626" },
      hired: { bg: "#d1fae5", color: "#059669" }
    };
    return colors[status] || colors.pending;
  };

  if (loading) return <div style={styles.loading}>Loading candidates...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Candidates</h1>
          <p style={styles.subtitle}>Review and manage job applicants</p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.exportBtn} onClick={exportCandidates}>
            <FaDownload /> Export
          </button>
          {selectedCandidates.length > 0 && (
            <button style={styles.bulkBtn} onClick={() => setShowBulkActions(!showBulkActions)}>
              Bulk Actions ({selectedCandidates.length})
            </button>
          )}
        </div>
      </div>

      {showBulkActions && selectedCandidates.length > 0 && (
        <div style={styles.bulkActions}>
          <button onClick={() => bulkUpdateStatus("shortlisted")}>Shortlist</button>
          <button onClick={() => bulkUpdateStatus("interview")}>Schedule Interview</button>
          <button onClick={() => bulkUpdateStatus("rejected")}>Reject</button>
          <button onClick={() => bulkUpdateStatus("hired")}>Mark as Hired</button>
          <button onClick={() => { setSelectedCandidates([]); setShowBulkActions(false); }}>Cancel</button>
        </div>
      )}

      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <FaSearch />
          <input type="text" placeholder="Search by name, email, or job..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInput} />
        </div>
        <select style={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ width: "40px" }}><input type="checkbox" onChange={(e) => {
                if (e.target.checked) setSelectedCandidates(filteredCandidates.map(c => c._id));
                else setSelectedCandidates([]);
              }} /></th>
              <th>Candidate</th>
              <th>Position</th>
              <th>Experience</th>
              <th>Applied Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate) => (
              <tr key={candidate._id} style={styles.tableRow}>
                <td><input type="checkbox" checked={selectedCandidates.includes(candidate._id)} onChange={() => toggleSelectCandidate(candidate._id)} /></td>
                <td>
                  <div style={styles.candidateCell}>
                    <div style={styles.candidateAvatar}>{candidate.fullName?.charAt(0)}</div>
                    <div>
                      <div style={styles.candidateName}>{candidate.fullName}</div>
                      <div style={styles.candidateEmail}><FaEnvelope size={10} /> {candidate.email}</div>
                      <div style={styles.candidatePhone}><FaPhone size={10} /> {candidate.phone}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={styles.jobTitle}>{candidate.jobId?.title}</div>
                  <div style={styles.jobDept}>{candidate.jobId?.department}</div>
                </td>
                <td>{candidate.yearsOfExperience} years</td>
                <td>{new Date(candidate.appliedAt).toLocaleDateString()}</td>
                <td>
                  <span style={{ ...styles.statusBadge, background: getStatusBadge(candidate.status).bg, color: getStatusBadge(candidate.status).color }}>
                    {candidate.status}
                  </span>
                </td>
                <td>
                  <select style={styles.statusSelect} value={candidate.status} onChange={(e) => updateStatus(candidate._id, e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
                  <button style={styles.viewBtn} onClick={() => viewCandidateDetails(candidate._id)}><FaEye /> View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDetailsModal && selectedCandidate && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2>Candidate Details</h2>
            <div style={styles.detailSection}>
              <h3>Personal Information</h3>
              <p><strong>Name:</strong> {selectedCandidate.fullName}</p>
              <p><strong>Email:</strong> {selectedCandidate.email}</p>
              <p><strong>Phone:</strong> {selectedCandidate.phone}</p>
              <p><strong>Address:</strong> {selectedCandidate.address || "N/A"}</p>
            </div>
            <div style={styles.detailSection}>
              <h3>Professional Information</h3>
              <p><strong>Current Company:</strong> {selectedCandidate.currentCompany || "N/A"}</p>
              <p><strong>Current Position:</strong> {selectedCandidate.currentPosition || "N/A"}</p>
              <p><strong>Years of Experience:</strong> {selectedCandidate.yearsOfExperience}</p>
              <p><strong>Expected Salary:</strong> {selectedCandidate.expectedSalary || "N/A"}</p>
              <p><strong>Notice Period:</strong> {selectedCandidate.noticePeriod || "N/A"}</p>
            </div>
            <div style={styles.detailSection}>
              <h3>Cover Letter</h3>
              <p style={styles.coverLetter}>{selectedCandidate.coverLetter}</p>
            </div>
            {selectedCandidate.resumeUrl && (
              <div style={styles.detailSection}>
                <h3>Resume</h3>
                <a href={selectedCandidate.resumeUrl} target="_blank" rel="noopener noreferrer" style={styles.resumeLink}>Download Resume</a>
              </div>
            )}
            <button style={styles.closeModalBtn} onClick={() => setShowDetailsModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { animation: "fadeInUp 0.5s ease" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "16px" },
  title: { fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 },
  subtitle: { fontSize: "14px", color: "#64748b", marginTop: "4px" },
  headerActions: { display: "flex", gap: "12px" },
  exportBtn: { background: "#ff961a", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  bulkBtn: { background: "#3b82f6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer" },
  bulkActions: { display: "flex", gap: "12px", padding: "16px", background: "#f8fafc", borderRadius: "12px", marginBottom: "20px", flexWrap: "wrap" },
  filterBar: { display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" },
  searchBox: { flex: 1, display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#fff" },
  searchInput: { flex: 1, border: "none", outline: "none", fontSize: "14px" },
  filterSelect: { padding: "10px 16px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#fff", fontSize: "14px" },
  tableContainer: { overflowX: "auto", background: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { borderBottom: "1px solid #e5e7eb", background: "#f8fafc", padding: "16px", textAlign: "left", fontWeight: "600", color: "#374151" },
  tableRow: { borderBottom: "1px solid #e5e7eb" },
  candidateCell: { display: "flex", alignItems: "center", gap: "12px" },
  candidateAvatar: { width: "40px", height: "40px", borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", color: "#ff961a" },
  candidateName: { fontWeight: "600", color: "#1e293b" },
  candidateEmail: { fontSize: "11px", color: "#64748b", marginTop: "2px" },
  candidatePhone: { fontSize: "11px", color: "#94a3b8" },
  jobTitle: { fontWeight: "500", color: "#1e293b" },
  jobDept: { fontSize: "11px", color: "#94a3b8" },
  statusBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", display: "inline-block" },
  statusSelect: { padding: "6px 10px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px", marginRight: "8px" },
  viewBtn: { padding: "6px 12px", background: "#eff6ff", border: "none", borderRadius: "8px", color: "#3b82f6", fontSize: "12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalContent: { background: "#fff", borderRadius: "16px", padding: "32px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto" },
  detailSection: { marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #e5e7eb" },
  coverLetter: { background: "#f8fafc", padding: "12px", borderRadius: "8px", fontSize: "14px", lineHeight: "1.5" },
  resumeLink: { color: "#ff961a", textDecoration: "none", fontWeight: "500" },
  closeModalBtn: { padding: "10px 20px", background: "#ff961a", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", width: "100%" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "400px", fontSize: "16px", color: "#64748b" }
};

export default CandidatesManager;